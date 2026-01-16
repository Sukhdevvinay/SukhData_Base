const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { apiLimiter } = require('./middleware/rateLimiter');
const startCronJobs = require('./services/cronService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// Rate Limiting
app.use('/api', apiLimiter);

// Start Cron Jobs
startCronJobs();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/folders', require('./routes/folderRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/share', require('./routes/shareRoutes'));
app.use('/api/trash', require('./routes/trashRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/advanced-storage')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
