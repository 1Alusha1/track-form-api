import mongoose, { Schema } from "mongoose";

const LeadSchema = new Schema({
    platform: String,
    email: String,
    utmLink: String,
    created_at: Number,
    leadIp:String,
});

export default mongoose.model("Lead", LeadSchema);
