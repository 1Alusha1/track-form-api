import express from "express";
import { config } from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import LeadSchema from "./models/Lead.js";
import UserSchema from "./models/User.js";

import { formatDateTimeManualUTC2 } from "./utils/formatDateTime.js";
import { getDatePointGMT } from "./utils/getDatePoin.js";

config();

const app = express();

app.use(express.json());

app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json({ hello: "world" });
});

// lead
// записывает лидов в бд и шлет месседж в бота
app.post("/", async (req, res) => {
  const { email, platform, userId, utmLink, leadIp } = req.body;

  try {
    const lead = await new LeadSchema({
      ...req.body,
    });

    const response = await fetch(
      `https://api.telegram.org/bot${
        process.env.BOT_TOKEN
      }/sendMessage?chat_id=${userId}&text=
        ${platform ? `Platform: ${platform} ` : ""} \n
        ${email ? `Your answer: ${email}` : ""}\n
        ${utmLink ? `UTM: ${utmLink}` : ""}\n
        ${leadIp ? `IP: ${leadIp}` : ""}\n
        ${formatDateTimeManualUTC2(lead.created_at)}
      `,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      }
    );

    lead.save();
    const data = await response.json();

    if (data.ok) {
      return res.status(201).json({
        error: false,
        message: "new lead click has benn added and sended",
      });
    }
  } catch (err) {
    if (err) console.log(err);

    return res
      .status(500)
      .json({ error: true, message: "Error while adding record in database" });
  }
});

// просто получает лидов
app.get("/get-leads", async (req, res) => {
  try {
    const records = await LeadSchema.find();

    return res.status(200).json({ error: false, message: "", records });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: err,
      message: "Error while geting records from database",
    });
  }
});

// показывает общее кол-во лидов с утм
app.get("/get-leads-by-utm", async (req, res) => {
  try {
    const records = await LeadSchema.find({
      utmLink: { $ne: "", $exists: true },
    });

    if (!records.length) {
      return res.status(200).json({
        error: false,
        message: "Leads with utm haven't found",
        records: [],
        count: 0,
      });
    }

    const result = parseLeadsByUtm(records);

    return res.status(200).json({
      error: false,
      message: "",
      records: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: err,
      message: "Error while geting utm records from database",
    });
  }
});

// парсит лидов с ютм в готовый для вывода массив
const parseLeadsByUtm = (records) => {
  const result = {};

  for (let i = 0; i < records.length; i++) {
    if (!result[records[i].utmLink]) {
      result[records[i].utmLink] = [];
    }
  }

  for (let i = 0; i < records.length; i++) {
    if (result[records[i].utmLink]) {
      result[records[i].utmLink].push(records[i]);
    }
  }

  const leadsCount = {};
  for (let item in result) {
    for (let i = 0; i < result[item].length; i++) {
      if (!leadsCount[result[item][i].utmLink]) {
        leadsCount[result[item][i].utmLink] = {
          name: result[item][i].utmLink,
          count: result[item].length,
        };
      }
    }
  }

  const final = Object.keys(leadsCount).map((item) => ({
    ...leadsCount[item],
  }));

  return final;
};

// Показывает инфу за день с какой рекламы перешли и количество человек с этой рекламы
app.post("/get-leads-by-date-utm", async (req, res) => {
  const { date } = req.body;
  const dateRegex = /^(0[1-9]|[12]\d|3[01])\.(0[1-9]|1[0-2])\.\d{4}$/;

  if (!dateRegex.test(date)) {
    return res.status(400).json({
      error: true,
      message: "Date has incorrect formate. Date must be in format dd.mm.yyyy",
    });
  }

  const dateArray = date.split(".");
  const { startDay, endDay } = getDatePointGMT(
    Number(dateArray[2]),
    Number(dateArray[1]),
    Number(dateArray[0])
  );

  try {
    const records = await LeadSchema.find({
      created_at: { $gte: startDay, $lt: endDay },
      utmLink: { $ne: "", $exists: true },
    });

    if (!records.length) {
      return res.status(200).json({
        error: false,
        message: "For this day leads haven't found",
        records: [],
        count: 0,
      });
    }
    const result = parseLeadsByUtm(records);

    return res.status(200).json({
      error: false,
      message: "",
      records: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: err,
      message: "Error while geting records by date from database",
    });
  }
});

// показывает общее количество лидов за день
app.post("/get-leads-by-date", async (req, res) => {
  const { date } = req.body;
  const dateRegex = /^(0[1-9]|[12]\d|3[01])\.(0[1-9]|1[0-2])\.\d{4}$/;

  if (!dateRegex.test(date)) {
    return res.status(400).json({
      error: true,
      message: "Date has incorrect formate. Date must be in format dd.mm.yyyy",
    });
  }

  const dateArray = date.split(".");
  const { startDay, endDay } = getDatePointGMT(
    Number(dateArray[2]),
    Number(dateArray[1]),
    Number(dateArray[0])
  );

  try {
    const records = await LeadSchema.find({
      created_at: { $gte: startDay, $lt: endDay },
    });

    if (!records.length) {
      return res.status(200).json({
        error: false,
        message: "For this day leads haven't found",
        records: [],
        count: 0,
      });
    }

    return res.status(200).json({
      error: false,
      message: "",
      records: records,
      count: records.length,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: err,
      message: "Error while geting records by date from database",
    });
  }
});

// показывает количество лидов за текущий день
app.get("/get-leads-current-day", async (req, res) => {
  const date = new Date();
  const fd = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  const formattedDate = fd.split(".");
  const { startDay, endDay } = getDatePointGMT(
    Number(formattedDate[2]),
    Number(formattedDate[1]),
    Number(formattedDate[0])
  );

  try {
    const records = await LeadSchema.find({
      created_at: { $gte: startDay, $lt: endDay },
    });

    if (!records.length) {
      return res.status(200).json({
        error: false,
        message: "For this day leads haven't found",
        records: [],
        count: 0,
      });
    }

    return res.status(200).json({
      error: false,
      message: "",
      records: records,
      count: records.length,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: err,
      message: "Error while geting records by date from database",
    });
  }
});

// user
app.post("/register-user", async (req, res) => {
  const { userId, username, first_name } = req.body;

  try {
    if (!userId && !username && !first_name) {
      return res.status(400).json({
        error: err,
        message: "Fields: userId, user_name, full_name are required ",
      });
    }

    const record = await UserSchema.findOne({ userId });

    if (record) {
      return res.status(400).json({
        error: true,
        message: `You've already registred`,
      });
    }

    const newUser = await new UserSchema({ userId, username, first_name });

    if (newUser) {
      newUser.save();
    }
    return res.status(201).json({
      error: false,
      message: "User record has got successfully created",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: err,
      message: "Error while adding user records to database",
    });
  }
});

app.get("/get-user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    if (!userId) {
      return res.status(400).json({
        error: false,
        message: "Field: userId is required ",
      });
    }

    const record = await UserSchema.findOne({ userId });

    res.status(200).json({
      error: false,
      message: "",
      record,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: err,
      message: "Error while getting user record from database",
    });
  }
});

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.listen(process.env.PORT, () => console.log("server was start"));

export default app;
