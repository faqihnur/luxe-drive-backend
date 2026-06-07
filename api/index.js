// Serverless handler for Vercel
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = require('../src/app');
const { testConnection } = require('../src/config/db');

let isConnected = false;
async function initOnce() {
  if (!isConnected) {
    try {
      await testConnection();
      isConnected = true;
    } catch (err) {
      // Don't throw — allow function to respond even if DB isn't ready.
      console.error('DB init failed (vercel):', err && err.message ? err.message : err);
    }
  }
}

module.exports = async (req, res) => {
  try {
    await initOnce();
    return app(req, res);
  } catch (err) {
    console.error('Unhandled error in serverless handler:', err && err.message ? err.message : err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
};
