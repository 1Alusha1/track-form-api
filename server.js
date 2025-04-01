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
app.post('/', async (req, res) => {
  const { email, platform, userId, utmLink,leadIp } = req.body;

  try {
    const lead = await new LeadSchema({
      ...req.body,
    });

    console.log(req.body)
    const response = await fetch(
      `https://api.telegram.org/bot${
        process.env.BOT_TOKEN
      }/sendMessage?chat_id=${userId}&text=
        ${platform ? `Platform: ${platform} ` : ''} \n
        ${email ? `Your answer: ${email}` : ''}\n
        ${utmLink ? `UTM: ${utmLink}` : ''}\n
        ${leadIp ? `IP: ${leadIp}` : ''}\n
        ${formatDateTimeManualUTC2(lead.created_at)}
      `,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      }
    );

    lead.save();
    res.status(200);
    const data = await response.json();

    if (data.ok) {
      return res.status(201).json({
        error: false,
        message: 'new lead click has benn added and sended',
      });
    }
  } catch (err) {
    if (err) console.log(err);

    return res
      .status(500)
      .json({ error: true, message: 'Error while adding record in database' });
  }
});
app.get("/get-leads", async (req, res) => {
  try {
    const records = await LeadSchema.findOne();

    return res.status(200).json({ error: false, message: "", records });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: err,
      message: "Error while geting records from database",
    });
  }
});

app.post("/get-leads-by-date", async (req, res) => {
  console.log(req.body);
  const { date } = req.body;
  const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

  if (!dateRegex.test(date)) {
    return res.status(400).json({
      error: true,
      message: "Date has incorrect formate. Date mus be in format yyyy-mm-dd",
    });
  }
  const dateArray = date.split("-");
  console.log(dateArray);
  const { startDay, endDay } = getDatePointGMT(
    Number(dateArray[0]),
    Number(dateArray[1]),
    Number(dateArray[2])
  );
  console.log(startDay, endDay);
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
  console.log(userId);
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

app.listen(3000, () => console.log("server was start"));

export default app;
