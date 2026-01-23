// middleware/cors.js
const corsMiddleware = (req, res, next) => {
  // Liste des origines autorisées
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://172.20.10.2:3000',
    'http://localhost:8080',
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  
  // Gérer les pré-requêtes OPTIONS
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  next();
};

module.exports = corsMiddleware;