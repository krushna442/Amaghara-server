import mongoose from 'mongoose'; 
const { Schema } = mongoose;

const UserSchema = new Schema(
{
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Invalid email format']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  phone: {
    type: String,
    validate: {
      validator: (v) => /^[0-9]{10,15}$/.test(v),
      message: "Invalid phone number"
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  subscription: { // Active subscription (if any)
    planId: { type: Schema.Types.ObjectId, ref: "UserSubscription" },
    duration: String,
    isActive: Boolean ,
    remarks: String
  },
  favorites: [{ type: Schema.Types.ObjectId, ref: "Property" }], // Fix ObjectId reference
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  googleId: {
    type: String,
    select: false
  },
  picture: String,
  lastLogin: Date
});
const User = mongoose.model('User', UserSchema);
export default User;
