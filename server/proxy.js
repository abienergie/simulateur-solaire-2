import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'societe-id',
    'Api-Key',
    'Accept',
    'Origin'
  ],
  credentials: true,
  maxAge: 86400 // CORS preflight cache time - 24 hours
};

app.use(cors(corsOptions));

// Increased JSON body size limit and better error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));

// Root route handler with more detailed info
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'iColl proxy server is running',
    version: '1.0.0',
    endpoints: {
      root: '/',
      health: '/health',
      api: '/api/*'
    },
    cors: {
      origin: corsOptions.origin,
      methods: corsOptions.methods.join(', ')
    }
  });
});

// Health check endpoint with more details
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Enhanced proxy configuration
const proxyOptions = {
  target: 'https://abienergie.icoll.fr',
  changeOrigin: true,
  secure: true, // Enable SSL verification
  timeout: 30000, // 30 second timeout
  pathRewrite: {
    '^/api': '/api-v2'
  },
  onProxyReq: (proxyReq, req) => {
    // Add required headers
    proxyReq.setHeader('societe-id', '131');
    proxyReq.setHeader('Api-Key', '88iU66-wSD3gx-xUxcPH-bq8WoM-aCJJwp');
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Accept', 'application/json');
    
    // Handle POST data with better error handling
    if (req.method === 'POST' && req.body) {
      try {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      } catch (error) {
        console.error('Error processing request body:', error);
        proxyReq.destroy(error);
      }
    }
    
    // Enhanced request logging
    console.log('Proxying request:', {
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString()
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    // Enhanced CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = corsOptions.origin;
    proxyRes.headers['Access-Control-Allow-Methods'] = corsOptions.methods.join(', ');
    proxyRes.headers['Access-Control-Allow-Headers'] = corsOptions.allowedHeaders.join(', ');
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Max-Age'] = '86400';
    
    // Enhanced response logging
    console.log('Received response:', {
      status: proxyRes.statusCode,
      statusMessage: proxyRes.statusMessage,
      path: req.path,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - req.startTime
    });
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', {
      error: err.message,
      code: err.code,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    // Send appropriate error response
    const statusCode = err.code === 'ECONNREFUSED' ? 503 : 500;
    res.status(statusCode).json({
      error: 'Proxy error',
      message: err.message,
      code: err.code
    });
  }
};

// Request timing middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Create and use proxy middleware
const apiProxy = createProxyMiddleware(proxyOptions);
app.use('/api', apiProxy);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    error: 'Server error',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
🚀 Proxy server running on port ${PORT}
📍 Root endpoint: http://localhost:${PORT}
💓 Health check: http://localhost:${PORT}/health
🔄 API proxy: http://localhost:${PORT}/api/*
⏰ Started at: ${new Date().toISOString()}
  `);
});

// Handle process errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});