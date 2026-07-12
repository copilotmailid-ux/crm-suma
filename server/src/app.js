const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const companyRoutes = require('./routes/companyRoutes');
const placementRoutes = require('./routes/placementRoutes');
const alumniRoutes = require('./routes/alumniRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/placements', placementRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route (helps Uptime Robot keep the server awake and shows active status)
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    message: 'CRM Placement Backend is running and active!',
    timestamp: new Date().toISOString()
  });
});

// Error handler (must be after routes)
app.use(errorHandler);

module.exports = app;
