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
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://clause-guard-ai-murex.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (e.g. curl, postman, server-to-server)
    if (!origin) return callback(null, true);

    // Allow localhost and local IP
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    // Allow Vercel deployments (production + preview domains)
    if (origin.endsWith('.vercel.app') || origin === 'https://clause-guard-ai-murex.vercel.app') {
      return callback(null, true);
    }

    // Allow configured CLIENT_URL
    if (process.env.CLIENT_URL) {
      const sanitizedClientUrl = process.env.CLIENT_URL.trim().replace(/\/+$/, '');
      if (origin === sanitizedClientUrl) {
        return callback(null, true);
      }
    }

    // Allow all other origins gracefully for public API flexibility
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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

// Root welcome & status endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ClauseGuard AI Backend API',
    status: 'online',
    version: '1.0.0',
    description: 'Intelligent Terms & Conditions Risk Analysis API',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      documents: '/api/documents',
      risk: '/api/risk',
      qa: '/api/qa',
      reports: '/api/reports'
    }
  });
});

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
