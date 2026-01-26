// server.js - Point d'entrée principal
require('dotenv').config();

// Importer l'application Express
const express = require('express');
const app = require('./app');

// Configuration des middlewares de sécurité et démarrage du serveur
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// === CONFIGURATION DE SÉCURITÉ ===

// Configuration CORS pour production
const corsOptions = {
  origin: process.env.NODE_ENV === 'development' 
    ? [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://192.168.100.20:3000',
        'http://192.168.100.20:5173'
      ]
    : [
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL,
        `https://${process.env.FRONTEND_URL}`,
        `https://${process.env.ADMIN_URL}`
      ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 200
};

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
    code: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path.includes('/api/health') || req.path.includes('/api/status');
  }
});

// === APPLICATION DES MIDDLEWARES GLOBAUX ===

// 1. Helmet pour la sécurité HTTP
app.use(helmet());

// 2. Compression GZIP
app.use(compression({
  level: 6,
  threshold: 100 * 1024
}));

// 3. CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 4. Rate limiting pour l'API
app.use('/api/', apiLimiter);

// 5. Logging structuré
const logFormat = process.env.NODE_ENV === 'production' 
  ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'
  : 'dev';

// Création du dossier de logs si inexistant
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Stream pour les logs d'accès
const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);

// Logger pour production
if (process.env.NODE_ENV === 'production') {
  app.use(morgan(logFormat, {
    stream: accessLogStream,
    skip: (req) => req.path === '/api/health'
  }));
  
  // Logger dans la console en format JSON
  app.use(morgan(logFormat, {
    skip: (req) => req.path === '/api/health'
  }));
} else {
  // Logger détaillé en développement
  app.use(morgan('dev'));
}

// === GESTION DES ERREURS SUPPLÉMENTAIRES ===

// Middleware pour les erreurs 404
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Endpoint non trouvé',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Middleware pour la gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Une erreur serveur est survenue' 
    : err.message;
  
  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

// === CONFIGURATION DU SERVEUR ===

const PORT = process.env.PORT || 5030;
const HOST = process.env.HOST || '0.0.0.0';

// Démarrer le serveur
const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Serveur démarré avec succès`);
  console.log(`   URL: http://${HOST}:${PORT}`);
  console.log(`   URL locale: http://localhost:${PORT}`);
  console.log(`   URL réseau: http://192.168.100.20:${PORT}`);
  console.log(`   Environnement: ${process.env.NODE_ENV || 'development'}`);
});

// Configuration du timeout
server.setTimeout(300000);

// Gestion des erreurs du serveur
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Le port ${PORT} est déjà utilisé`);
    process.exit(1);
  } else {
    console.error('❌ Erreur du serveur:', error);
    process.exit(1);
  }
});

// Gestion de l'arrêt gracieux
let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n⚠️  Signal ${signal} reçu, arrêt gracieux...`);
  
  setTimeout(() => {
    console.error('⏰ Timeout atteint, arrêt forcé');
    process.exit(1);
  }, 30000);
  
  try {
    console.log('🚪 Fermeture du serveur HTTP...');
    server.close(() => {
      console.log('✅ Serveur HTTP fermé');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'arrêt gracieux:', error);
    process.exit(1);
  }
};

// Signaux d'arrêt
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export pour les tests
module.exports = { app, server };