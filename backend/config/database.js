// backend/config/database.js
const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'hcs_dbadmin',
  password: process.env.DB_PASSWORD || 'healthsoft@25',
  server: process.env.DB_SERVER || 'DESKTOP-G2TN8LC',
  database: process.env.DB_NAME || 'healthcentersoft_db',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolConnection = null;

const getConnection = async () => {
  try {
    if (poolConnection && poolConnection.connected) {
      return poolConnection;
    }
    
    console.log('🔄 Connexion à SQL Server...');
    console.log('   Serveur:', config.server);
    console.log('   Base:', config.database);
    console.log('   Utilisateur:', config.user);
    
    poolConnection = await sql.connect(config);
    console.log('✅ Connecté à SQL Server');
    
    return poolConnection;
  } catch (error) {
    console.error('❌ ERREUR CONNEXION SQL SERVER:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    console.error('   Serveur:', config.server);
    console.error('   Vérifiez:');
    console.error('     1. SQL Server est démarré');
    console.error('     2. Le service SQL Server (SQLEXPRESS) est en cours d\'exécution');
    console.error('     3. L\'authentification Windows/SQL est activée');
    console.error('     4. Le port 1433 est ouvert');
    throw error;
  }
};

const testConnection = async () => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log('✅ Test de connexion réussi');
    console.log('   Version SQL Server:', result.recordset[0].version.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ Test de connexion échoué:', error.message);
    return false;
  }
};

const close = async () => {
  try {
    if (poolConnection) {
      await poolConnection.close();
      poolConnection = null;
      console.log('✅ Connexion SQL Server fermée');
    }
  } catch (error) {
    console.error('❌ Erreur fermeture connexion:', error.message);
  }
};

module.exports = {
  sql,
  getConnection,
  testConnection,
  close
};