import express from 'express';
import { create_user, login_user, update_user } from '../controllers/userController.js';
import { userAuth } from '../../auth/userAuth.js';
import User from '../models/user.js';
import Subscription from '../models/subscription.js';
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


export default router;  