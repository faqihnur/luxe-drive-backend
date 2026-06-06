const db = require('../config/db');

// A. BUAT TRANSAKSI SEWA BARU (POST)
exports.createRental = async (req, res) => {
    const { car_id, tanggal_mulai, tanggal_selesai } = req.body;
    const user_id = req.user.id; // Mengambil ID User otomatis dari Token JWT yang login

    if (!car_id || !tanggal_mulai || !tanggal_selesai) {
        return res.status(400).json({ message: "Semua data transaksi wajib diisi!" });
    }

    try {
        // 1. Cek apakah mobilnya ada dan tersedia
        const [cars] = await db.query('SELECT * FROM cars WHERE id = ?', [car_id]);
        if (cars.length === 0) {
            return res.status(404).json({ message: "Mobil tidak ditemukan!" });
        }
        
        const car = cars[0];
        // DB menyimpan `status_ketersediaan` sebagai boolean (true = tersedia)
        if (!car.status_ketersediaan) {
            return res.status(400).json({ message: "Maaf, mobil ini sedang disewa orang lain!" });
        }

        // 2. Hitung durasi hari sewa
        const tglMulai = new Date(tanggal_mulai);
        const tglSelesai = new Date(tanggal_selesai);
        const selisihWaktu = tglSelesai.getTime() - tglMulai.getTime();
        const durasiHari = Math.ceil(selisihWaktu / (1000 * 3600 * 24));

        if (durasiHari <= 0) {
            return res.status(400).json({ message: "Tanggal selesai harus setelah tanggal mulai!" });
        }

        // 3. Hitung total harga sewa
        const total_harga = durasiHari * car.harga_per_hari;

        // 4. Masukkan data ke tabel rentals
        await db.query(
            'INSERT INTO rentals (user_id, car_id, tanggal_mulai, tanggal_selesai, total_harga) VALUES (?, ?, ?, ?, ?)',
            [user_id, car_id, tanggal_mulai, tanggal_selesai, total_harga]
        );

        // 5. Update status mobil menjadi false (tidak tersedia)
        await db.query('UPDATE cars SET status_ketersediaan = ? WHERE id = ?', [false, car_id]);

        res.status(201).json({
            status: "success",
            message: "Booking Luxe Drive berhasil dibuat! Hubungi admin untuk pelunasan.",
            detail_transaksi: {
                mobil: car.nama_mobil,
                durasi: `${durasiHari} Hari`,
                total_bayar: total_harga
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

// B. LIHAT SEMUA RIWAYAT SEWA (GET)
exports.getAllRentals = async (req, res) => {
    try {
        // Kita gunakan JOIN agar datanya lengkap menampilkan nama user dan nama mobil
        const queryTeks = `
            SELECT r.id, u.nama AS nama_penyewa, c.nama_mobil, c.merk, r.tanggal_mulai, r.tanggal_selesai, r.total_harga, r.status_pembayaran 
            FROM rentals r
            JOIN users u ON r.user_id = u.id
            JOIN cars c ON r.car_id = c.id
            ORDER BY r.created_at DESC
        `;
        const [rentals] = await db.query(queryTeks);

        res.status(200).json({
            status: "success",
            results: rentals.length,
            data: rentals
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};