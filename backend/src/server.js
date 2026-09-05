require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🚀 DealFlow360 API Server running on port ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 REST API: http://localhost:${PORT}/api`);
  console.log(`=============================================`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('DealFlow360 server closed gracefully.');
  });
});
