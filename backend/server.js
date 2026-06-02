// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection test
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const libraryRoutes = require('./routes/library');
const hrRoutes = require('./routes/hr');
const procurementRoutes = require('./routes/procurement');
const inventoryRoutes = require('./routes/inventory');
const healthRoutes = require('./routes/health');
const transportRoutes = require('./routes/transport');
const assetsRoutes = require('./routes/assets');
const dashboardRoutes = require('./routes/dashboard');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', require('./routes/students'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});