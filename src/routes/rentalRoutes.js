const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const authMiddleware = require('../middlewares/authMiddleware'); // Si satpam API

// 1. Buat Transaksi Sewa (POST http://localhost:5000/api/rentals)
router.post('/', authMiddleware, rentalController.createRental);

// 2. Lihat Semua Riwayat Sewa (GET http://localhost:5000/api/rentals)
router.get('/', authMiddleware, rentalController.getAllRentals);

module.exports = router;