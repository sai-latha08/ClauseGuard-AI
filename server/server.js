const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const riskRoutes = require('./routes/riskRoutes');
const qaRoutes = require('./routes/qaRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { protect } = require('./middleware/auth');
const Document = require('./models/Document');
const { sampleFilePath } = require('./services/sampleDocs');
const { processDocumentPipeline } = require('./controllers/documentController');
const fs = require('fs');

const app = express();

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true); // Dev flexible
    }
  },
  credentials: true
}));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', apiLimiter);

// Body parser
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Ensure uploads folder exists and serve static uploads if needed
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'clauseguard-backend-api',
    timestamp: new Date().toISOString()
  });
});

// Demo sample document endpoint: uploads the real sample document into user account
app.post('/api/documents/demo', protect, async (req, res, next) => {
  try {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    const demoFilename = `demo-${Date.now()}-terms_of_service.txt`;
    const destPath = path.join(uploadDir, demoFilename);
    
    fs.copyFileSync(sampleFilePath, destPath);
    const stats = fs.statSync(destPath);

    const newDoc = await Document.create({
      userId: req.user.id,
      originalName: 'CloudSphere_Standard_Terms_and_Conditions.txt',
      storedFilename: demoFilename,
      filePath: destPath,
      fileType: 'text/plain',
      fileSize: stats.size,
      status: 'PROCESSING'
    });

    res.status(201).json({
      success: true,
      data: newDoc,
      message: 'Sample Terms & Conditions loaded. AI Pipeline processing started.'
    });

    // Run real pipeline
    processDocumentPipeline(newDoc._id, destPath, 'CloudSphere_Standard_Terms_and_Conditions.txt').catch(console.error);
  } catch (error) {
    next(error);
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api', riskRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/reports', reportRoutes);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`ClauseGuard Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
