import mongoose, { Schema } from "mongoose";

const LeadSchema = new Schema({
  platform: String,
  email: String,
  created_at: {
    type: Number,
    default: new Date().getTime(),
  },
});

export default mongoose.model("Lead", LeadSchema);
