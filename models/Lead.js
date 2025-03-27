import mongoose, { Schema } from "mongoose";

const LeadSchema = new Schema({
  full_name: String,
  email: String,
  phone: String,
  source: String,
});

export default mongoose.model("Lead", LeadSchema);
