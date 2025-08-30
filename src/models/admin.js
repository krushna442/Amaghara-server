import mongoose from 'mongoose'; 
const adminSchema = new mongoose.Schema(
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
    minlength: 10, 
    select: false
  },
  phone: Number,
  permissions: [{
    type: String,
    enum: ["create_property", "edit_property", "delete_property", "manage_users", "manage_subscriptions"]
  }],
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  googleId: {
    type: String,
    select: false
  },
  picture: String
}
);
const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
