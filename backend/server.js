const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const caseRoutes = require('./routes/cases');
const documentRoutes = require('./routes/documents');
const calendarRoutes = require('./routes/calendar');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/legalcase')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/calendar', calendarRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 