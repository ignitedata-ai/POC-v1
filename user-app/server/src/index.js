/**
 * index.js
 *
 * User App backend entry point.
 * Serves the F-Tag extraction API, POC module, and proxies admin template queries.
 * Runs on port 3002 (separate from Admin API on 3001).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const routes = require('./routes');

require('./database');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[User App] Server running on http://localhost:${PORT}`);
});
