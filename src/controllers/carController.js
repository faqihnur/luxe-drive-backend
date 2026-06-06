const db = require('../config/db');

// A. TAMBAH MOBIL BARU (POST) - Hanya bisa diakses Admin nanti
exports.createCar = async (req, res) => {
    // Ambil nilai dari berbagai kemungkinan kunci request
    const nama_mobil = req.body.nama_mobil || req.body.nama || req.body.name;
    const merk = req.body.merk || req.body.brand;
    const url_gambar = req.body.url_gambar || req.body.imageUrl || req.body.image;
    const rawPrice = req.body.harga || req.body.price || req.body.harga_per_hari || req.body.price_per_day;

    if (!nama_mobil || !merk || !rawPrice || !url_gambar) {
        return res.status(400).json({ message: "Semua data mobil wajib diisi!" });
    }

    try {
        // Sanitasi & parsing harga (paksa jadi Number)
        const MAX_PRICE = 2000000000; // 2 miliar
        const DB_MAX_SAFE = 2147483646; // cap sedikit di bawah signed 32-bit max
        const parsed = rawPrice ? parseInt(rawPrice.toString().replace(/[^0-9]/g, ''), 10) : NaN;
        if (isNaN(parsed) || parsed <= 0) {
            return res.status(400).json({ message: 'Nilai harga tidak valid.' });
        }
        let cleanPrice = parsed;
        if (cleanPrice > MAX_PRICE) cleanPrice = MAX_PRICE;
        if (cleanPrice > DB_MAX_SAFE) cleanPrice = DB_MAX_SAFE;

        // Siapkan timestamps eksplisit agar MySQL menerima nilai jika diperlukan
        const now = new Date();

        await db.query(
            'INSERT INTO cars (nama_mobil, merk, harga_per_hari, url_gambar, status_ketersediaan, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nama_mobil, merk, cleanPrice, url_gambar, true, now, now]
        );

        // Ambil kembali mobil yang baru dibuat untuk response (cari berdasarkan nama, merk, dan created_at)
        const [rows] = await db.query('SELECT * FROM cars WHERE nama_mobil = ? AND merk = ? AND created_at = ? LIMIT 1', [nama_mobil, merk, now]);
        const createdCar = (rows && rows[0]) ? rows[0] : null;

        // Normalisasi response (status sebagai string)
        const responseCar = createdCar ? { ...createdCar, status_ketersediaan: createdCar.status_ketersediaan ? 'tersedia' : 'disewa' } : null;

        res.status(201).json({
            status: "success",
            message: "Mobil mewah baru berhasil ditambahkan ke garasi Luxe Drive!",
            data: responseCar
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error.message });
    }
};

// B. LIHAT SEMUA KOLEKSI MOBIL (GET) - Bisa diakses Customer & Admin
exports.getAllCars = async (req, res) => {
    try {
        const [cars] = await db.query('SELECT * FROM cars ORDER BY created_at DESC');
        // Normalisasi status_ketersediaan (boolean di DB) menjadi string untuk frontend
        const mapped = cars.map(c => ({
            ...c,
            status_ketersediaan: c.status_ketersediaan ? 'tersedia' : 'disewa'
        }));

        res.status(200).json({
            status: "success",
            results: mapped.length,
            data: mapped
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

// C. UBAH DATA MOBIL (PUT)
exports.updateCar = async (req, res) => {
    const { id } = req.params; // Mengambil ID mobil dari URL

    // Adaptasi nama kunci dari berbagai frontend (Flutter, dsb.)
    const rawPrice = req.body.harga || req.body.price || req.body.price_per_day;
    const status = req.body.status || req.body.status_ketersediaan || req.body.availability;
    const nama = req.body.nama || req.body.name || req.body.nama_mobil;
    const merk = req.body.merk || req.body.brand;
    const url_gambar = req.body.url_gambar || req.body.imageUrl || req.body.image;

    try {
        // Cek dulu apakah mobilnya ada di database
        const [carRows] = await db.query('SELECT * FROM cars WHERE id = ?', [id]);
        if (carRows.length === 0) {
            return res.status(404).json({ message: "Mobil tidak ditemukan!" });
        }

        const car = carRows[0];

        // Sanitasi & parsing harga (paksa jadi Number)
        // Batas rasional disesuaikan: MAX_PRICE 2 miliar untuk supercar
        const MAX_PRICE = 2000000000; // 2,000,000,000
        // Jaga agar angka tidak melewati limit integer DB umum (signed 32-bit)
        const DB_MAX_SAFE = 2147483646; // sedikit di bawah 2,147,483,647
        let finalPrice = car.harga_per_hari; // default ke nilai lama
        if (typeof rawPrice !== 'undefined') {
            const cleanPrice = rawPrice ? parseInt(rawPrice.toString().replace(/[^0-9]/g, ''), 10) : NaN;
            if (isNaN(cleanPrice) || cleanPrice <= 0) {
                return res.status(400).json({ message: 'Nilai harga tidak valid.' });
            }
            // Terapkan batas bertingkat: MAX_PRICE lalu DB_MAX_SAFE
            let capped = cleanPrice;
            if (capped > MAX_PRICE) capped = MAX_PRICE;
            if (capped > DB_MAX_SAFE) capped = DB_MAX_SAFE;
            finalPrice = capped;
        }

        // Normalisasi status ke boolean sesuai model (DB menyimpan boolean)
        // Jika tidak diberikan, gunakan nilai lama dari DB
        let finalStatus = car.status_ketersediaan; // boolean
        if (typeof status !== 'undefined') {
            const s = status ? status.toString().toLowerCase().trim() : '';
            if (['tersedia', 'available', 'true', '1'].includes(s)) finalStatus = true;
            else if (['disewa', 'rented', 'false', '0'].includes(s)) finalStatus = false;
            else {
                return res.status(400).json({ message: 'Nilai status tidak dikenali.' });
            }
        }

        // Final values (jika tidak diberikan, gunakan nilai lama)
        const finalNama = typeof nama !== 'undefined' ? nama : car.nama_mobil;
        const finalMerk = typeof merk !== 'undefined' ? merk : car.merk;
        const finalUrl = typeof url_gambar !== 'undefined' ? url_gambar : car.url_gambar;

        // Jalankan query update dengan nilai final
        await db.query(
            'UPDATE cars SET nama_mobil = ?, merk = ?, harga_per_hari = ?, status_ketersediaan = ?, url_gambar = ? WHERE id = ?',
            [finalNama, finalMerk, finalPrice, finalStatus, finalUrl, id]
        );

        // Ambil kembali data yang terupdate untuk respons yang bersih
        const [updatedRows] = await db.query('SELECT * FROM cars WHERE id = ?', [id]);
        const updatedCar = updatedRows[0];
        // Normalisasi untuk response
        const responseCar = {
            ...updatedCar,
            status_ketersediaan: updatedCar.status_ketersediaan ? 'tersedia' : 'disewa'
        };

        res.status(200).json({
            status: 'success',
            message: 'Spesifikasi mobil berhasil diperbarui!',
            data: responseCar
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

// D. HAPUS MOBIL DARI GARASI (DELETE)
exports.deleteCar = async (req, res) => {
    const { id } = req.params;

    try {
        const [car] = await db.query('SELECT * FROM cars WHERE id = ?', [id]);
        if (car.length === 0) {
            return res.status(404).json({ message: "Mobil tidak ditemukan!" });
        }

        // Jalankan query hapus
        await db.query('DELETE FROM cars WHERE id = ?', [id]);

        res.status(200).json({
            status: "success",
            message: "Mobil berhasil dihapus dari sistem Luxe Drive!"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};