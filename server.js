require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const connectDB = require('./config/db');
const { refreshRates } = require('./utils/coingecko');
const { pollAllUsers } = require('./utils/chainPoller');
const { startWatchers } = require('./utils/blockchainWatcher');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const transferRoutes = require('./routes/transfer');
const ratesRoutes = require('./routes/rates');
const adminRoutes   = require('./routes/admin');
const webhookRoutes = require('./routes/webhook');

const app = express();

// Security
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting — 100 requests per 15 minutes per IP
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many requests, slow down.' } }));

// Connect DB
connectDB();

// Refresh rates on boot then every 2 minutes
refreshRates();
cron.schedule('*/2 * * * *', refreshRates);

// Poll all chains every 5 minutes as a safety net (WebSocket watchers handle real-time)
cron.schedule('*/5 * * * *', pollAllUsers);

// Start real-time WebSocket watchers (instant detection via public RPC nodes)
startWatchers();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/webhook', webhookRoutes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', app: 'CERA API' }));

// 404
app.use((_, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, _, res, __) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 CERA API running on port ${PORT}`));
