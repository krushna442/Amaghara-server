import User from '../models/user.js';
import bcrypt from 'bcrypt';

// Create user
export const create_user = async (req, res) => {
    try {
        const userData = req.body;
        const user = new User(userData);
        await user.save();
        res.cookie('userId', user._id.toString(), {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 60 * 60 * 1000 * 24 // 1 day
        });
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

// Update use
// r
export const update_user = async (req, res) => {
    try {
        const userId = req.params.id;
        const updateData = req.body;
        const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// Delete user
export const delete_user = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// User login
export const login_user = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email ' });
        }
        if(user.password !== password){
            return res.status(401).json({ success: false, message: 'Invalid password ' });
        }
        // const isMatch = await bcrypt.compare(password, user.password);
        // if (!isMatch) {
        //     return res.status(401).json({ success: false, message: 'Invalid email or password' });
        // }
        res.cookie('userId', user._id.toString(), {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 60 * 60 * 1000 * 24 // 1 day
        });
        res.json({
            success: true,
            message: 'Login successful',
            user: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};


