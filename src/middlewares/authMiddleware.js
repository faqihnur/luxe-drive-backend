const jwt = require('jsonwebtoken');

// Verify token middleware
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Akses ditolak! Anda harus login terlebih dahulu.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token tidak valid atau sudah kedaluwarsa!' });
    }
}

// Require admin role middleware (after verifyToken)
function requireAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ message: 'Token tidak ditemukan.' });
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Akses terbatas: admin saja.' });
    next();
}

// Export verifyToken as default function and attach requireAdmin helper
module.exports = verifyToken;
module.exports.requireAdmin = requireAdmin;