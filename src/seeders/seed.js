const bcrypt = require('bcryptjs');

module.exports = async function runSeed(models) {
    try {
        if (!models) return;

        // Seed Users (admin)
        if (models.User) {
            const count = await models.User.count();
            if (count === 0) {
                try {
                    const plain = process.env.ADMIN_PASSWORD || 'admin123';
                    const salt = await bcrypt.genSalt(10);
                    const hashed = await bcrypt.hash(plain, salt);
                    await models.User.create({
                        nama: process.env.ADMIN_NAME || 'Admin',
                        email: process.env.ADMIN_EMAIL || 'admin@example.com',
                        password: hashed,
                        role: 'admin'
                    });
                    console.log('🌱 Seeder: akun admin dibuat.');
                } catch (err) {
                    console.warn('⚠️ Seeder User gagal (periksa atribut model):', err.message);
                }
            }
        }

        // Seed Cars (sample data)
        if (models.Car) {
            const count = await models.Car.count();
            if (count === 0) {
                try {
                    await models.Car.bulkCreate([
                        { nama_mobil: 'Lamborghini Aventador', merk: 'Lamborghini', harga_per_hari: 1500 },
                        { nama_mobil: 'Ferrari F8', merk: 'Ferrari', harga_per_hari: 1400 }
                    ]);
                    console.log('🌱 Seeder: data mobil contoh dibuat.');
                } catch (err) {
                    console.warn('⚠️ Seeder Car gagal (periksa atribut model):', err.message);
                }
            }
        }

        // Rentals seeding usually not necessary; skip unless explicitly needed
    } catch (err) {
        console.error('❌ Seeder gagal:', err.message);
    }
};
