/**
 * index.js
 *
 * Main entry point for the Express server.
 * Sets up middleware, mounts API routes, seeds the database on first run,
 * and starts listening on port 3001.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { seedDatabase } = require('./seed');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT'],
}));
app.use(express.json({ limit: '10mb' })); // Large limit for full packet JSON

// Mount API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seed database on startup (idempotent - skips if data exists)
seedDatabase();

// Start server
app.listen(PORT, () => {
  console.log(`[Server] TCS Template Repository API running on http://localhost:${PORT}`);
});
