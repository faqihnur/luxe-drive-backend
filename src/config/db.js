const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// === SESUAIKAN: Menambahkan PORT dan Opsi SSL untuk Aiven Cloud ===
const sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASSWORD, 
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306, // Menggunakan port khusus dari .env (misal 15775 di Aiven)
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
            ssl: {
                rejectUnauthorized: false // WAJIB AKTIF! Agar diizinkan masuk oleh sistem enkripsi Aiven
            }
        }
    }
);

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database MySQL berhasil terhubung ke Cloud Aiven!');
    } catch (err) {
        console.error('❌ Koneksi database gagal:', err.message);
        throw err;
    }
}

// Import models from src/models (if any) and attach to sequelize
function initModels() {
    const models = {};
    const modelsDir = path.join(__dirname, '..', 'models');
    try {
        const fs = require('fs');
        if (fs.existsSync(modelsDir)) {
            fs.readdirSync(modelsDir)
                .filter(file => file.endsWith('.js') && file !== 'index.js')
                .forEach(file => {
                    const model = require(path.join(modelsDir, file));
                    if (typeof model === 'function') {
                        const defined = model(sequelize);
                        models[defined.name] = defined;
                    }
                });
        }
    } catch (err) {
        console.warn('⚠️ Gagal memuat model otomatis:', err.message);
    }

    // If models define associations, call associate
    Object.keys(models).forEach((name) => {
        if (typeof models[name].associate === 'function') {
            models[name].associate(models);
        }
    });

    return { sequelize, models };
}

async function query(sql, params) {
    return sequelize.query(sql, { replacements: params });
}

module.exports = { sequelize, testConnection, initModels, query };