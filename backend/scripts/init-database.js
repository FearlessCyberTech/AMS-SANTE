const sql = require('mssql');
const crypto = require('crypto');

const config = {
  user: 'hcs_dbadmin',
  password: 'healthsoft@25',
  server: 'localhost',
  database: 'hcs_backoffice',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function initializeDatabase() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('✅ Connexion à la base de données établie');

    // Insérer un pays par défaut
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM [ref].[PAYS] WHERE COD_PAY = 'CMF')
      BEGIN
        INSERT INTO [ref].[PAYS] (COD_PAY, LIB_PAY, LANGUE_DEFAUT, ZONE_GEO)
        VALUES ('CMF', 'Cameroun-Francophone', 'Français', 'Afrique Centrale');
        PRINT '✅ Pays CMF inséré';
      END
    `);

    // Insérer des types de paiement
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM [ref].[TYPE_PAIEMENT] WHERE COD_PAI = 1)
      BEGIN
        INSERT INTO [ref].[TYPE_PAIEMENT] (COD_PAY, LIB_PAI, TYPE_COUVERTURE, TAUX_COUVERTURE, ACTIF)
        VALUES 
          ('CMF', 'Cash', 'Direct', 100.00, 1),
          ('CMF', 'Assurance', 'Partiel', 80.00, 1),
          ('CMF', 'Mutuelle', 'Partiel', 70.00, 1);
        PRINT '✅ Types de paiement insérés';
      END
    `);

    // Insérer un utilisateur admin
    const adminPassword = 'admin123';
    const hashedPassword = crypto.createHash('sha256')
      .update(adminPassword)
      .digest('hex')
      .toUpperCase();

    await pool.request()
      .input('password', sql.VarChar, hashedPassword)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM [security].[UTILISATEUR] WHERE LOG_UTI = 'admin')
        BEGIN
          INSERT INTO [security].[UTILISATEUR] 
            (COD_PAY, LOG_UTI, PWD_UTI, NOM_UTI, PRE_UTI, PROFIL_UTI, ACTIF, SUPER_ADMIN)
          VALUES 
            ('CMF', 'admin', @password, 'Admin', 'System', 'Admin', 1, 1);
          PRINT '✅ Utilisateur admin créé (mot de passe: admin123)';
        END
      `);

    // Insérer des types de consultation
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM [metier].[TYPE_CONSULTATION] WHERE COD_PAY = 'CMF')
      BEGIN
        INSERT INTO [metier].[TYPE_CONSULTATION] (COD_PAY, LIB_TYP_CONS, MONTANT, ACTIF)
        VALUES 
          ('CMF', 'Consultation Générale', 5000.00, 1),
          ('CMF', 'Consultation Spécialiste', 10000.00, 1),
          ('CMF', 'Consultation Urgence', 15000.00, 1),
          ('CMF', 'Consultation Pédiatrique', 6000.00, 1),
          ('CMF', 'Consultation Gynécologique', 8000.00, 1);
        PRINT '✅ Types de consultation insérés';
      END
    `);

    // Insérer des centres de santé
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM [core].[CENTRE_SANTE] WHERE COD_PAY = 'CMF')
      BEGIN
        INSERT INTO [core].[CENTRE_SANTE] 
          (COD_PAY, NOM_CENTRE, TYPE_CENTRE, STATUT, ACTIF)
        VALUES 
          ('CMF', 'Centre de Santé Principal', 'Hôpital Général', 'Actif', 1),
          ('CMF', 'Centre Pédiatrique', 'Hôpital Spécialisé', 'Actif', 1),
          ('CMF', 'Centre de Santé Communautaire', 'Centre de Santé', 'Actif', 1);
        PRINT '✅ Centres de santé insérés';
      END
    `);

    console.log('✅ Initialisation de la base de données terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

initializeDatabase();