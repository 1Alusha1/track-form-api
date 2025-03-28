import mongoose, { Schema } from "mongoose";

const LeadSchema = new Schema({
  platform: String,
  email: String,
  created_at: {
    type: Number,
    default: Date.now(),
  },
});

export default mongoose.model("Lead", LeadSchema);
