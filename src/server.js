const app = require('./app');
const { sequelize, testConnection, initModels } = require('./config/db'); // Sequelize based DB helper
const runSeed = require('./seeders/seed');

const PORT = process.env.PORT || 5000;

// Initialize DB, sync models and seed data, then start server
(async () => {
    try {
        await testConnection();

        const { models } = initModels();

        const forceSync = process.env.FORCE_DB_SYNC === 'true';
        if (forceSync) {
            await sequelize.sync({ force: true });
            console.log('🔄 Database synchronized with { force: true } (all tables recreated).');
        } else {
            await sequelize.sync({ alter: true });
            console.log('🔄 Database synchronized with { alter: true } (tables created/updated).');
        }

        // Run seeders to populate initial data when tables are empty
        await runSeed(models);

        // Start server after DB is ready
        app.listen(PORT, () => {
            console.log(`🚀 Server Luxe Drive aktif di: http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Gagal memulai server akibat error DB:', err.message);
        process.exit(1);
    }
})();
