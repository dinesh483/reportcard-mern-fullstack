require('express-async-errors');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const studentRoutes = require('./routes/students');
const subjectRoutes = require('./routes/subjects');
const marksRoutes = require('./routes/marks');
const reportCardRoutes = require('./routes/reportCards');
const bulkImportRoutes = require('./routes/bulkImport');
const dashboardRoutes = require('./routes/dashboard');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(morgan('combined'));

// Public health endpoints must be registered before authenticated root routes.
app.get('/', (_, res) => res.json({ status: 'ok', message: 'Report Card Portal API running' }));
app.get('/health', (_, res) => res.json({ status: 'healthy' }));

// Routes
app.use('/auth', authRoutes);
app.use('/departments', departmentRoutes);
app.use('/students', studentRoutes);
app.use('/subjects', subjectRoutes);
app.use('/marks', marksRoutes);
app.use('/report-cards', reportCardRoutes);
app.use('/import', bulkImportRoutes);
app.use('/', dashboardRoutes); // /dashboard and /metrics

// Global error handler
app.use(errorHandler);

module.exports = app;
