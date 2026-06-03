const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const grievanceRoutes = require('./routes/grievances');
const hearingRoutes = require('./routes/hearings');
const dataRoutes = require('./routes/data');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth', authRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/hearings', hearingRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/notifications', notificationRoutes);


app.get('/api/attachments/:grievanceId', async (req, res) => {
  try {
    const [attachments] = await require('./config/database').query(
      'SELECT attachment_id, original_name, file_size, mime_type, uploaded_at FROM grievance_attachments WHERE grievance_id = ?',
      [req.params.grievanceId]
    );
    res.json({ success: true, data: attachments });
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'GrievanceMS API is running' });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
