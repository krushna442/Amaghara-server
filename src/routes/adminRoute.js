import express from 'express';
import { admin_send_otp, admin_verify_otp, admin_login, adminLogout } from '../controllers/adminLoginController.js';
import { adminAuth } from '../../auth/adminAuth.js';
import User from '../models/user.js'
const router = express.Router();

// Admin registration - send OTP
router.post('/send-otp', admin_send_otp);

// Admin registration/forgot password - verify OTP
router.post('/verify-otp', admin_verify_otp);

// Admin login (email/password)
router.post('/login', admin_login); 
router.post('/logout', adminLogout); 


router.get ('/home', adminAuth, (req, res) => {
    res.status(200).json({ success: true, message: 'Welcome to the admin home page', admin: req.admin } );
})
router.get('/user-list',async(req,res)=>{
    try {
  const users = await User.find()
      .select('-password') 
      .sort({ createdAt: -1 });  
        res.json({
        success: true,
        users
    });
} catch (error) {
    res.status(400).json({
        success: false,
        message: 'Error fetching users',
        error: error.message
    });
}
})
export default router;