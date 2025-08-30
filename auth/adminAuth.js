import Admin from '../src/models/admin.js';

export const adminAuth = async (req, res, next) => {
    const { adminId } = req.cookies;
    if (!adminId) {
        return res.status(401).json({ success: false, message: 'Admin not authenticated' });
    }
    try {
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Admin not found' });
        }
        req.admin = admin;
        next();
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
