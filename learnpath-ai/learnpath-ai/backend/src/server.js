const app = require('./app');
const config = require('./config');
const db = require('./db');
const logger = require('./logger');

const server = app.listen(config.port, () => logger.info(`API listening on port ${config.port}`, { env: config.nodeEnv }));

const shutdown = (signal) => {
  logger.info(`${signal} received, shutting down`);
  server.close(() => db.pool.end().then(() => process.exit(0)));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => logger.error('unhandledRejection', { reason: String(reason) }));
