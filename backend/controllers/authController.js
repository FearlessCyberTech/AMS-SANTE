// config/database.js
const sql = require('mssql');

const config = {
  user: process.env.DB_USER || 'hcs_dbadmin',
  password: process.env.DB_PASSWORD || 'healthsoft@25',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'hcs_backoffice',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Pour Azure, true, pour local, false
    trustServerCertificate: true, // Pour le développement local
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Pool de connexions
let pool = null;

const connectToDb = async () => {
  try {
    if (pool) {
      return pool;
    }
    
    pool = await new sql.ConnectionPool(config).connect();
    console.log('Connecté à SQL Server avec succès');
    return pool;
  } catch (err) {
    console.error('Erreur de connexion à la base de données:', err);
    throw err;
  }
};

// Middleware pour obtenir une connexion
const getConnection = async () => {
  if (!pool) {
    await connectToDb();
  }
  return pool;
};

// Fermer la connexion
const closeConnection = async () => {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Connexion à SQL Server fermée');
    }
  } catch (err) {
    console.error('Erreur lors de la fermeture de la connexion:', err);
    throw err;
  }
};

module.exports = {
  connectToDb,
  getConnection,
  closeConnection,
  sql // Exporter sql pour les types de données
};