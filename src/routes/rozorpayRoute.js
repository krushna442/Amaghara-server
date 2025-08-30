import express from 'express';
import Rozorpay from 'razorpay';
const router = express.Router();
import dotenv from 'dotenv';
import { userAuth } from '../../auth/userAuth.js';
import crypto from 'crypto';
dotenv.config();
import UserSubscription from '../models/userSubscription.js';
import User from '../models/user.js';


router.post('/order',async(req,res)=>{
    const rozorpay=new Rozorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    const order =req.body;
    const options = {
        amount: order.amount, // Amount in smallest currency unit (e.g., cents)
        currency: order.currency,
        receipt: order.receipt || `receipt_${new Date().getTime()}`,
    }
    try {
        const orders= await rozorpay.orders.create(options);
        if(!orders){
            return res.status(400).json({error: 'Failed to create Rozorpay order'});
        }
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error creating Rozorpay order:', error);
        res.status(500).json({ error: 'Failed to create Rozorpay order' });
    }
})



// Example backend verification (Node.js/Express)


router.post('/verify-payment', userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      plan,
      paymentDetails,
      transactionId
    } = req.body;

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required payment details' 
      });
    }

    if (!plan || !paymentDetails) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing plan or payment details' 
      });
    }

    // Verify Razorpay signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET) // Use environment variable
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed - Invalid signature' 
      });
    }

    // Payment is verified - Create subscription record
    const subscription = new UserSubscription({
      userId: user._id,
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        duration: plan.duration,
        houseVisits: plan.houseVisits,
        features: plan.features,
        startDate: new Date(),
        // Calculate end date based on plan type
        endDate: plan.id === 'one-time' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year for subscription plans
        status: 'active'
      },
      paymentDetails: {
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        method: paymentDetails.method,
        bank: paymentDetails.bank,
        wallet: paymentDetails.wallet,
        vpa: paymentDetails.vpa,
        email: paymentDetails.email,
        contact: paymentDetails.contact,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        verified: true,
        verifiedAt: new Date()
      },
      transactionId: transactionId,
      createdAt: new Date()
    });

    // Save subscription
    const savedSubscription = await subscription.save();

    console.log('Subscription created successfully:', savedSubscription._id);

    // Optional: Update user model with current subscription
    await User.findByIdAndUpdate(user._id, { 
      'subscription.planId': savedSubscription._id,
      'subscription.isActive': true,
        'subscription.duration':savedSubscription.plan.duration
    });

    res.json({ 
      success: true, 
      message: 'Payment verified and subscription activated successfully',
      subscription: {
        id: savedSubscription._id,
        plan: savedSubscription.plan,
        createdAt: savedSubscription.createdAt
      }
    });

  } catch (error) {
    console.error('Error in payment verification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during payment verification' 
    });
  }
});

export default router;
