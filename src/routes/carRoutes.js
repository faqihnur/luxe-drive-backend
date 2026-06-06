const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const authMiddleware = require('../middlewares/authMiddleware'); // Mengimpor satpam API

// 1. Jalur Tambah Mobil (POST http://localhost:5000/api/cars)
// Hanya user terverifikasi dengan role admin yang bisa menambah, mengedit, atau menghapus mobil
router.post('/', authMiddleware, authMiddleware.requireAdmin, carController.createCar);

// 2. Jalur Lihat Semua Mobil (GET http://localhost:5000/api/cars)
// Semua user yang sudah login bisa melihat katalog mobil mewah ini
router.get('/', authMiddleware, carController.getAllCars);

// 3. Edit Mobil (PUT) -> membutuhkan parameter ID (contoh: /api/cars/1)
router.put('/:id', authMiddleware, authMiddleware.requireAdmin, carController.updateCar);

// 4. Hapus Mobil (DELETE) -> membutuhkan parameter ID (contoh: /api/cars/1)
router.delete('/:id', authMiddleware, authMiddleware.requireAdmin, carController.deleteCar);
module.exports = router;