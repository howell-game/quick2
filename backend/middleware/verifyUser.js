const User = require('../models/User'); // 👈 direct import

async function verifyUser(req, res, next) {
    const { userId } = req.body;

    try {
        const user = await User.findOne({ where: { userId } });

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before accessing this page.' });
        }

        next();
    } catch (error) {
        console.error('Error in verifyUser:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = verifyUser;
