// server.js - Point d'entrée principal optimisé et sécurisé
'use strict';

// === CONFIGURATION INITIALE ===
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Déclaration de la variable isShuttingDown au début
let isShuttingDown = false;

// Validation des variables d'environnement critiques
const requiredEnvVars = ['NODE_ENV'];
if (process.env.NODE_ENV === 'production') {
  requiredEnvVars.push('FRONTEND_URL');
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Variable d'environnement manquante: ${envVar}`);
    process.exit(1);
  }
}

// === IMPORT DES DÉPENDANCES (sans express-slow-down) ===
const express = require('express');
const app = require('./app');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

// === CONFIGURATION DE SÉCURITÉ ===

// Configuration CORS optimisée
const corsWhitelist = process.env.NODE_ENV === 'development'
  ? [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://172.20.10.3:3000',
      'http://172.20.10.3:5173'
    ]
  : [
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      ...(process.env.FRONTEND_URL?.startsWith('http') ? [] : [`https://${process.env.FRONTEND_URL}`]),
      ...(process.env.ADMIN_URL?.startsWith('http') ? [] : [`https://${process.env.ADMIN_URL}`])
    ].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (comme les applications mobiles, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (corsWhitelist.indexOf(origin) !== -1 || corsWhitelist.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`🚫 Tentative d'accès CORS bloquée: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key'
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Configuration du rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes.',
    code: 429,
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  skip: (req) => {
    // Ne pas limiter les endpoints de santé
    return req.path.includes('/health') || 
           req.path.includes('/status') ||
           req.path === '/favicon.ico';
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Trop de requêtes',
      message: 'Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.',
      timestamp: new Date().toISOString()
    });
  }
});

// === CONFIGURATION DES LOGS ===
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true, mode: 0o755 });
}

// Format personnalisé pour Morgan
morgan.token('security', (req) => {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
});

morgan.token('user-agent', (req) => {
  return req.headers['user-agent'] || 'unknown';
});

const logFormat = ':security - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Streams pour les logs
const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { 
    flags: 'a',
    encoding: 'utf8',
    mode: 0o644
  }
);

const errorLogStream = fs.createWriteStream(
  path.join(logDir, 'error.log'),
  { 
    flags: 'a',
    encoding: 'utf8',
    mode: 0o644
  }
);

// === APPLICATION DES MIDDLEWARES ===
// Ordre CRITIQUE pour la sécurité

// 1. Helmet avec configuration personnalisée
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' }
}));

// 2. Compression
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// 3. Parseurs de requêtes
app.use(express.json({
  limit: '10kb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      throw new Error('JSON malformé');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10kb',
  parameterLimit: 10 
}));

app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key-change-this'));

// 4. CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 5. Protection contre les injections NoSQL
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️ Tentative d'injection NoSQL détectée: ${key}`, {
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
}));

// 6. Protection contre les paramètres pollués
app.use(hpp({
  whitelist: ['page', 'limit', 'sort', 'fields']
}));

// 7. Rate limiting
app.use('/api/', apiLimiter);

// 8. Logging
if (process.env.NODE_ENV === 'production') {
  // Logs d'accès en production
  app.use(morgan(logFormat, {
    stream: accessLogStream,
    skip: (req) => req.path === '/health' || req.method === 'OPTIONS'
  }));
  
  // Logs d'erreur séparés
  app.use(morgan(logFormat, {
    stream: errorLogStream,
    skip: (req, res) => res.statusCode < 400
  }));
  
  // Logger console simplifié
  app.use(morgan(':method :url :status :response-time ms - :security'));
} else {
  app.use(morgan('dev'));
}

// 9. Middleware de sécurité personnalisé
app.use((req, res, next) => {
  // Headers de sécurité supplémentaires
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Cache control
  if (!req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  
  next();
});

// === ROUTES DE SANTÉ ET MÉTRIQUES ===
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV
  });
});

app.get('/metrics', (req, res) => {
  // Protection basique pour les métriques
  const metricsKey = req.headers['x-api-key'] || req.query.apiKey;
  if (process.env.NODE_ENV === 'production' && metricsKey !== process.env.METRICS_API_KEY) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }
  
  res.json({
    timestamp: new Date().toISOString(),
    process: {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      pid: process.pid
    },
    system: {
      loadavg: require('os').loadavg(),
      freemem: require('os').freemem(),
      totalmem: require('os').totalmem(),
      cpus: require('os').cpus().length
    }
  });
});

// === GESTION DES ERREURS ===

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint non trouvé',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    suggestion: 'Vérifiez la documentation de l\'API'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log détaillé de l'erreur
  const errorDetails = {
    message: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent']
  };
  
  // Journalisation selon l'environnement
  if (isProduction) {
    console.error('🚨 Erreur serveur:', JSON.stringify(errorDetails));
  } else {
    console.error('🚨 Erreur détaillée:', {
      ...errorDetails,
      stack: err.stack
    });
  }
  
  // Réponse adaptée à l'environnement
  const response = {
    error: isProduction && statusCode === 500 
      ? 'Une erreur serveur est survenue' 
      : err.message,
    timestamp: new Date().toISOString(),
    ...(isProduction && statusCode === 500 ? { reference: `ERR-${Date.now()}` } : {})
  };
  
  if (!isProduction && err.stack) {
    response.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
});

// === DÉMARRAGE DU SERVEUR ===
const PORT = parseInt(process.env.PORT, 10) || 5030;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Serveur démarré avec succès`);
  console.log(`📍 URL: http://${HOST}:${PORT}`);
  console.log(`🎯 Environnement: ${process.env.NODE_ENV}`);
  console.log(`📊 PID: ${process.pid}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log(`🌐 Réseau: http://172.20.10.3:${PORT}`);
  }
});

// Configuration du serveur
server.setTimeout(30000); // 30 secondes
server.keepAliveTimeout = 65000; // 65 secondes
server.headersTimeout = 66000; // 66 secondes

// === GESTION DE L'ARRÊT GRACIEUX ===
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n⚠️  Signal ${signal} reçu, début de l'arrêt gracieux...`);
  
  // Timeout d'arrêt forcé
  const shutdownTimeout = setTimeout(() => {
    console.error('⏰ Timeout d\'arrêt atteint, extinction forcée');
    process.exit(1);
  }, 30000);
  
  try {
    // Fermer le serveur HTTP
    console.log('🚪 Fermeture du serveur HTTP...');
    server.close(() => {
      console.log('✅ Serveur HTTP fermé');
      
      // Fermer les streams de logs
      accessLogStream.end();
      errorLogStream.end();
      
      clearTimeout(shutdownTimeout);
      
      console.log(`👋 Arrêt complet`);
      process.exit(0);
    });
    
    // Fermer les connexions persistantes
    server.closeAllConnections();
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'arrêt:', error);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
};

// Gestion des signaux
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion des erreurs non catchées
process.on('uncaughtException', (error) => {
  console.error('💥 Exception non gérée:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Rejet de promesse non géré:', reason);
});

// === EXPORTS ===
module.exports = { 
  app, 
  server,
  gracefulShutdown
};