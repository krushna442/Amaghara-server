import User from '../src/models/user.js';

export const userAuth = async (req, res, next) => {
    const { userId } = req.cookies;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
