import mongoose from 'mongoose';

const userSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  plan: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String,},
    price: { type: Number, required: true },
    duration: { type: String},
    houseVisits: { type: Number},
    features: [{ type: String }],
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date }, // null for one-time plans
    status: { 
      type: String, 
      enum: ['active', 'expired', 'cancelled'], 
      default: 'active' 
    }
  },
  paymentDetails: {
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    method: { type: String },
    bank: { type: String },
    wallet: { type: String },
    vpa: { type: String },
    email: { type: String },
    contact: { type: String },
    razorpay_payment_id: { type: String, required: true },
    razorpay_order_id: { type: String, required: true },
    razorpay_signature: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date }
  },
  transactionId: { 
    type: String, 
    required: true 
  },
  usedVisits: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Add indexes for better performance
userSubscriptionSchema.index({ userId: 1 });
userSubscriptionSchema.index({ 'paymentDetails.razorpay_payment_id': 1 });
userSubscriptionSchema.index({ transactionId: 1 });

const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);
export default UserSubscription;