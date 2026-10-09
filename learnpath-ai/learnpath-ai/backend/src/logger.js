const config = require('./config');
const fmt = (level, msg, meta) =>
  JSON.stringify({ time: new Date().toISOString(), level, msg, ...(meta || {}) });

module.exports = {
  info: (msg, meta) => console.log(fmt('info', msg, meta)),
  warn: (msg, meta) => console.warn(fmt('warn', msg, meta)),
  error: (msg, meta) => console.error(fmt('error', msg, meta)),
  debug: (msg, meta) => config.nodeEnv !== 'production' && console.log(fmt('debug', msg, meta)),
  stream: { write: (line) => console.log(fmt('http', line.trim())) },
};
