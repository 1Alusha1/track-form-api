import express from "express";
import { config } from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import LeadSchema from "./models/Lead.js";
import UserSchema from "./models/User.js";
import { formatDateTime } from "./utils/formatDateTime.js";

config();

const app = express();

app.use(express.json());

app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json({ hello: "world" });
});

// lead
app.post("/", async (req, res) => {
  const { email, platform, userId } = req.body;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return res.status(403).json({
      error: true,
      message: `email isn't correct`,
    });
  }
  try {
    const lead = new LeadSchema({
      ...req.body,
    });
    const response = await fetch(
      `https://api.telegram.org/bot${
        process.env.BOT_TOKEN
      }/sendMessage?chat_id=${userId}&text=potential lead clicked on platform: ${platform} \n ${formatDateTime(
        lead.created_at
      )}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      }
    );

    lead.save();
    res.status(200);
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

app.listen(process.env.PORT, () => console.log("server was start"));

export default app;
