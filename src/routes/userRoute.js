import express from 'express';
import { create_user, login_user, update_user } from '../controllers/userController.js';
import { userAuth } from '../../auth/userAuth.js';
import User from '../models/user.js';
import Subscription from '../models/subscription.js';
import bcrypt from 'bcrypt';
const router = express.Router();

// Register user
router.post('/register', create_user);

// Login user
router.post('/login', login_user);

// Update user details
router.put('/update/:id', update_user);

router.get('/home',userAuth, (req, res) => {
    res.status(200).json({ success: true, message: 'Welcome to the user home page', user: req.user } );
}

);

router.put("/:userId/subscription", async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, remark } = req.body;

    // find user
    let user = await User.findById(userId).populate("subscription.planId");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // update subscription fields in User
    if (typeof isActive === "boolean") {
      user.subscription.isActive = isActive;
    }

    if (remark) {
      user.subscription.remarks = remark; // ✅ update user’s embedded subscription
    }

    user.updatedAt = new Date();
    await user.save();

    // also update the Subscription collection (if planId exists)
    if (user.subscription.planId) {
      await Subscription.findByIdAndUpdate(
        user.subscription.planId,
        { remarks: remark ?? user.subscription.planId.remarks }, // ✅ update remark
        { new: true }
      );
    }

    res.json({
      success: true,
      message: "User subscription updated successfully",
      subscription: user.subscription,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});



//forgot password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    // Send OTP for password reset
    const otp = generateOTP();
    const subject = "Password Reset Verification";
    
    const result = await sendOTPHandler({ 
        email, 
        subject, 
        otp
    });

    if (result.success) {
        // Store OTP with purpose 'reset'
        storeOTPInSession(req, email, otp, 'reset');
        res.json({ 
            success: true, 
            message: "OTP sent for password reset" 
        });
    } else {
        res.status(500).json(result);
    }
});

// Verify OTP and reset password
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ 
            success: false, 
            message: "Email, OTP, and new password are required" 
        });
    }


    // OTP verified successfully - now reset the password
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Hash the new password before saving
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user's password using your existing update function
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { password: hashedPassword },
            { new: true }
        );

        // Clear OTP session data
        delete req.session.otpData;

        res.json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error resetting password",
            error: error.message
        });
    }
});


export default router;  