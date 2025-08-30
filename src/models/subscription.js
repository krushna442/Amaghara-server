import mongoose from 'mongoose';
const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ["Basic", "Premium", "Enterprise"]
  },
  price: {
    type: Number,
    required: true
  },
  duration: { // in days
    type: Number,
    required: true
  },
  features: [String], // ["Unlimited Property Views", "Priority Support"]
  isActive: {
    type: Boolean,
    default: true
  },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  remarks: String
});
const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;