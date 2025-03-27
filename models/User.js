import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  userId: String,
  first_name: String,
  username: String,
});

export default mongoose.model('User', UserSchema);
