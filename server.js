require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');
const cron    = require('node-cron');
const path    = require('path');

const connectDB      = require('./config/db');
const { refreshRates }  = require('./utils/coingecko');
const { pollAllUsers }  = require('./utils/chainPoller');
const { startWatchers } = require('./utils/blockchainWatcher');

const authRoutes      = require('./routes/auth');
const userRoutes      = require('./routes/user');
const transferRoutes  = require('./routes/transfer');
const ratesRoutes     = require('./routes/rates');
const adminRoutes     = require('./routes/admin');
const webhookRoutes   = require('./routes/webhook');
const changenowRoutes = require('./routes/changenow');
const guestRoutes     = require('./routes/guest');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Too many requests.' } }));

connectDB();

refreshRates();
cron.schedule('*/2 * * * *', refreshRates);
cron.schedule('*/5 * * * *', pollAllUsers);
startWatchers();

// API routes
app.use('/api/auth',       authRoutes);
app.use('/api/user',       userRoutes);
app.use('/api/transfer',   transferRoutes);
app.use('/api/rates',      ratesRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/webhook',    webhookRoutes);
app.use('/api/changenow',  changenowRoutes);
app.use('/api/guest',      guestRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok', app: 'CERA API' }));

// Serve React frontend (built to /public)
const PUBLIC = path.join(__dirname, 'public');
app.use(express.static(PUBLIC));
app.get('*', (req, res) => {
  // Don't catch API 404s
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Route not found' });
  res.sendFile(path.join(PUBLIC, 'index.html'));
});

app.use((err, _, res, __) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`CERA API running on port ${PORT}`));
