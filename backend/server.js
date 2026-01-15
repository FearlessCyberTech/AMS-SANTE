const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 5000;

// Tester la connexion à la base de données au démarrage
const startServer = async () => {
  try {
    console.log('🔍 Tentative de connexion à SQL Server...');
    console.log(`📊 Serveur: ${process.env.DB_SERVER || 'DESKTOP-G2TN8LC'}`);
    console.log(`📁 Base de données: ${process.env.DB_NAME || 'hcs_backoffice'}`);
    
    const isConnected = await db.testConnection();
    
    if (!isConnected) {
      console.log('⚠️  Mode démonstration activé - SQL Server non connectée');
      console.log('💡 Vérifiez que:');
      console.log('   1. SQL Server est en cours d\'exécution');
      console.log('   2. L\'authentification SQL Server est activée');
      console.log('   3. Le port 1433 est accessible');
      console.log('   4. Les identifiants sont corrects');
    } else {
      console.log('✅ SQL Server connecté avec succès');
    }

    app.listen(PORT, () => {
      console.log(`🚀 HealthCenterSoft backend running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Database: SQL Server (${process.env.DB_NAME})`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    
    // Tentative de démarrage en mode démo si la base de données n'est pas disponible
    if (error.code === 'ELOGIN' || error.code === 'ETIMEOUT') {
      console.log('⚠️  Démarrage en mode sans base de données...');
      app.listen(PORT, () => {
        console.log(`🚀 Serveur démarré en mode démonstration (sans DB) sur le port ${PORT}`);
      });
    } else {
      process.exit(1);
    }
  }
};

// Gestion propre de l'arrêt avec fermeture du pool de connexions
const shutdown = async () => {
  console.log('\n🛑 Arrêt du serveur...');
  try {
    await db.close();
    console.log('✅ Pool de connexions SQL Server fermé');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture des connexions:', error);
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Gestion des erreurs non catchées
process.on('uncaughtException', (error) => {
  console.error('💥 Erreur non gérée:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promise rejetée non gérée:', reason);
  shutdown();
});

// Démarrer le serveur
startServer();