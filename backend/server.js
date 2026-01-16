const { app } = require('./app'); // Notez les accolades { } pour extraire l'app
const db = require('./config/database');

const PORT = process.env.PORT || 5030;

const startServer = async () => {
  try {
    console.log('🚀 Démarrage du serveur HealthCenterSoft...');
    console.log('📊 Configuration:');
    console.log(`   Port: ${PORT}`);
    console.log(`   Environnement: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Base de données: ${process.env.DB_NAME || 'hcs_backoffice'}`);
    
    // Tester la connexion à la base de données (sans bloquer le démarrage)
    console.log('\n🔍 Test de connexion à la base de données...');
    
    // Démarrer le serveur même si la base de données n'est pas accessible
    app.listen(PORT, async () => {
      console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
      
      // Tenter la connexion à la base de données en arrière-plan
      setTimeout(async () => {
        try {
          const isConnected = await db.testConnection();
          if (!isConnected) {
            console.log('\n⚠️  MODE DÉMONSTRATION ACTIVÉ');
            console.log('   Le serveur fonctionne sans base de données SQL Server');
            console.log('   Les données seront stockées en mémoire uniquement');
            console.log('   Pour activer la base de données:');
            console.log('   1. Démarrez SQL Server');
            console.log('   2. Vérifiez les paramètres dans le fichier .env');
            console.log('   3. Redémarrez le serveur');
          }
        } catch (error) {
          console.log('⚠️  Impossible de se connecter à la base de données');
          console.log('   Le serveur fonctionne en mode démonstration');
        }
      }, 1000);
    });
    
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE lors du démarrage du serveur:', error);
    
    // Tentative de redémarrage en mode démo
    console.log('\n🔄 Tentative de démarrage en mode démonstration...');
    try {
      app.listen(PORT, () => {
        console.log(`✅ Serveur démarré en mode démonstration sur http://localhost:${PORT}`);
        console.log('⚠️  Aucune connexion à la base de données disponible');
        console.log('📝 Les données seront perdues au redémarrage');
      });
    } catch (fallbackError) {
      console.error('💥 Impossible de démarrer le serveur:', fallbackError.message);
      process.exit(1);
    }
  }
};

// Gestionnaire d'arrêt propre
const shutdown = async (signal) => {
  console.log(`\n${signal} reçu, arrêt du serveur...`);
  try {
    await db.close();
    console.log('✅ Connexions fermées');
  } catch (error) {
    console.error('Erreur lors de la fermeture:', error);
  }
  process.exit(0);
};

// Gestion des signaux d'arrêt
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('💥 Erreur non capturée:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promise rejetée non gérée:', reason);
});

// Démarrer le serveur
startServer();