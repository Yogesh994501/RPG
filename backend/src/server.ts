import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase } from './db/database.js';
import { errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import characterRoutes from './routes/character.js';
import questRoutes from './routes/quests.js';
import shopRoutes from './routes/shop.js';
import bossRoutes from './routes/boss.js';
import chronicleRoutes from './routes/chronicle.js';
import customRewardsRoutes from './routes/customRewards.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite database and seed shop items
initDatabase();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    game: 'ChronoSlayer Life RPG',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/character', characterRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/boss', bossRoutes);
app.use('/api/chronicle', chronicleRoutes);
app.use('/api/custom-rewards', customRewardsRoutes);

import fs from 'fs';

// Serve frontend static build in production (e.g. Render / Railway / Koyeb free deployment)
const frontendDistPath = path.resolve(process.cwd(), '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Global Error Handler Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('========================================================');
  console.log(`⚔️  CHRONOSLAYER LIFE RPG - AUTHORITATIVE ENGINE READY ⚔️`);
  console.log(`🌐 Server listening on http://localhost:${PORT}`);
  console.log(`🛡️  SQLite Database initialized & WAL active`);
  console.log(`📜 Health Check: http://localhost:${PORT}/api/health`);
  console.log('========================================================');
});

export default app;
