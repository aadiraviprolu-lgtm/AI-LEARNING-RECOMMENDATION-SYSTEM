const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const logger = require('./logger');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.set('trust proxy', 1); // correct client IPs behind Render/Railway/Netlify proxies (rate limiting)
app.use(helmet());
app.use(cors({
  origin(origin, cb) {
    // Native mobile apps send no Origin header; browsers must be on the allow-list.
    if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS_NOT_ALLOWED'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '100kb' }));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: logger.stream }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', apiLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/recommendations', require('./routes/recommendations'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
