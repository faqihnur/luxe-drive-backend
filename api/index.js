// Serverless handler for Vercel
const app = require('../src/app');
const { testConnection } = require('../src/config/db');

let isConnected = false;
async function initOnce() {
  if (!isConnected) {
    try {
      await testConnection();
      isConnected = true;
    } catch (err) {
      console.error('DB init failed (vercel):', err.message || err);
    }
  }
}

module.exports = async (req, res) => {
  await initOnce();
  return app(req, res);
};
