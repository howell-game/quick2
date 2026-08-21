const Member = require('../models/Member'); // 👈 direct import

async function verifyMember(req, res, next) {
    const { memberId } = req.body;

    try {
        const member = await Member.findOne({ where: { memberId } });

        if (!member) return res.status(404).json({ message: 'Member not found' });

        if (!member.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before accessing this page.' });
        }

        next();
    } catch (error) {
        console.error('Error in verifyMember:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = verifyMember;
