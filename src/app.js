require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Ambil file route auth
const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const rentalRoutes = require('./routes/rentalRoutes');

const app = express();

// Middleware Global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pendaftaran Route Utama
app.use('/api/auth', authRoutes); 
app.use('/api/cars', carRoutes);
app.use('/api/rentals', rentalRoutes); // Pastikan ada huruf 's' di belakang rental

app.get('/', (req, res) => {
    res.json({
        message: "Selamat datang di Luxe Drive API! Server berjalan dengan aman."
    });
});

// === KOREKSI: Menambahkan Port Dinamis untuk Render Deployment ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Luxe Drive running on port ${PORT}`);
});

module.exports = app;