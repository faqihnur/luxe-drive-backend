const { Sequelize } = require('sequelize');
const path = require('path');

// Ensure the MySQL driver is included when bundlers (like Vercel's) build the lambda
// Sequelize dynamically requires 'mysql2' so explicitly require it here to avoid
// runtime error: "Please install mysql2 package manually"
try {
    require('mysql2');
} catch (e) {
    // If mysql2 is not installed, let Sequelize throw the original error later.
}

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const isProduction = process.env.NODE_ENV === 'production';
const DB_PORT = process.env.DB_PORT || 3306;
const poolMax = isProduction ? parseInt(process.env.DB_POOL_MAX || '2', 10) : parseInt(process.env.DB_POOL_MAX || '5', 10);
const poolMin = parseInt(process.env.DB_POOL_MIN || '0', 10);
const poolAcquire = parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10);
const poolIdle = parseInt(process.env.DB_POOL_IDLE || '10000', 10);
const useSsl = (process.env.DB_SSL === 'true') || isProduction;

const sequelizeOptions = {
    host: process.env.DB_HOST,
    port: DB_PORT,
    dialect: 'mysql',
    logging: false,
    pool: {
        max: poolMax,
        min: poolMin,
        acquire: poolAcquire,
        idle: poolIdle
    },
    dialectOptions: {}
};

if (useSsl) {
    // For Aiven MySQL, ensure SSL is used but allow rejectUnauthorized false
    sequelizeOptions.dialectOptions.ssl = { rejectUnauthorized: false };
}

// Use a global singleton so cold-starts / hot-reloads don't create many instances
let sequelize;
if (global.__sequelize) {
    sequelize = global.__sequelize;
} else {
    sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, sequelizeOptions);
    global.__sequelize = sequelize;
}

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database MySQL berhasil terhubung ke Cloud Aiven!');
    } catch (err) {
        console.error('❌ Koneksi database gagal:', err && err.message ? err.message : err);
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