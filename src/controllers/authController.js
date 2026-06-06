const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // 1. Tambahkan ini di paling atas file!

// LOGIKA REGISTER USER
exports.register = async (req, res) => {
    const { nama, email, password, role: requestedRole } = req.body;

    if (!nama || !email || !password) {
        return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
    }

    // Accept role from body but restrict to known values
    let role = (requestedRole || 'user').toString().toLowerCase();
    if (!['user', 'admin'].includes(role)) role = 'user';

    try {
        // Cek apakah email sudah terdaftar
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing && existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
        }

        // Hash password (tangani error hashing secara eksplisit)
        let hashed;
        try {
            const salt = await bcrypt.genSalt(10);
            hashed = await bcrypt.hash(password, salt);
        } catch (hashErr) {
            console.error('Hashing error:', hashErr);
            return res.status(500).json({ success: false, message: 'Gagal memproses password.' });
        }

        // Insert user baru with requested role (user/admin)
        const now = new Date();
        const [insertResult] = await db.query(
            'INSERT INTO users (nama, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [nama, email, hashed, role, now, now]
        );

        const newUser = {
            id: insertResult && insertResult.insertId ? insertResult.insertId : null,
            nama,
            email,
            role,
            created_at: now,
            updated_at: now
        };

        return res.status(201).json({ success: true, message: 'Register berhasil', data: newUser });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
};

// 2. TAMBAHKAN LOGIKA LOGIN INI DI BAWAHNYA:
exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
        return res.status(400).json({ message: "Email dan password wajib diisi!" });
    }

    try {
        // 1. Cari user berdasarkan email
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: "Email atau password salah!" });
        }

        const user = users[0];

        // 2. Cocokkan password yang diinput dengan password terenkripsi di DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Email atau password salah!" });
        }

        // 3. Jika cocok, buat Token JWT (berlaku selama 1 hari)
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 4. Kirim respon sukses beserta tokennya ke client (token dikembalikan sebagai Bearer string)
        res.status(200).json({
            status: "success",
            message: "Login berhasil! Welcome to Luxe Drive.",
            token: `Bearer ${token}`,
            user: {
                id: user.id,
                nama: user.nama,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};