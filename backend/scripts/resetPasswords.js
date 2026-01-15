const crypto = require('crypto');
const sql = require('mssql');

// Configuration de la base de données SQL Server pour hcs_backoffice
const dbConfig = {
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'hcs_backoffice',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

// Nouveaux mots de passe en clair (SHA256 hashés)
const newPasswords = {
  // Super administrateurs
  'dilangue': 'Admin123!',
  'ekani': 'Admin456!',
  
  // Test utilisateurs avec différents profils
  'admin_test': 'Admin123!',
  'medecin_test': 'Doctor123!',
  'infirmier_test': 'Nurse123!',
  'secretaire_test': 'Secretary123!',
  'caissier_test': 'Cashier123!',
  'utilisateur_test': 'User123!'
};

// Fonction pour hacher un mot de passe en SHA256
function hashPasswordSHA256(password) {
  return crypto.createHash('sha256').update(password).digest('hex').toUpperCase();
}

async function resetPasswords() {
  let pool;
  
  try {
    // Se connecter à SQL Server
    pool = await sql.connect(dbConfig);
    console.log('✓ Connecté à SQL Server avec succès');
    console.log(`Base de données: ${dbConfig.database}\n`);

    // Récupérer tous les utilisateurs existants
    const usersQuery = 'SELECT ID_UTI, LOG_UTI, NOM_UTI, PRE_UTI, PROFIL_UTI FROM security.UTILISATEUR';
    const usersResult = await pool.request().query(usersQuery);
    
    console.log(`Utilisateurs existants (${usersResult.recordset.length}):`);
    usersResult.recordset.forEach(user => {
      console.log(`  - ${user.LOG_UTI} (${user.NOM_UTI} ${user.PRE_UTI}) - ${user.PROFIL_UTI}`);
    });
    console.log();

    // Réinitialiser les mots de passe
    const updatedUsers = [];
    const notFoundUsers = [];

    for (const [username, plainPassword] of Object.entries(newPasswords)) {
      try {
        // Vérifier si l'utilisateur existe
        const checkQuery = `
          SELECT ID_UTI, LOG_UTI, NOM_UTI, PRE_UTI, PROFIL_UTI 
          FROM security.UTILISATEUR 
          WHERE LOG_UTI = @username
        `;
        
        const checkRequest = pool.request();
        checkRequest.input('username', sql.VarChar, username);
        const userResult = await checkRequest.query(checkQuery);

        if (userResult.recordset.length > 0) {
          const user = userResult.recordset[0];
          const hashedPassword = hashPasswordSHA256(plainPassword);
          
          // Mettre à jour le mot de passe dans hcs_backoffice
          const updateQuery = `
            UPDATE security.UTILISATEUR 
            SET PWD_UTI = @hashedPassword,
                DATE_PWD_CHANGE = GETDATE(),
                COD_MODUTIL = @modifier,
                DAT_MODUTIL = GETDATE(),
                NB_TENTATIVES_ECHOUES = 0,
                COMPTE_BLOQUE = 0
            WHERE LOG_UTI = @username
          `;
          
          const updateRequest = pool.request();
          updateRequest.input('hashedPassword', sql.VarChar, hashedPassword);
          updateRequest.input('username', sql.VarChar, username);
          updateRequest.input('modifier', sql.VarChar, 'system');
          
          const updateResult = await updateRequest.query(updateQuery);
          
          if (updateResult.rowsAffected[0] > 0) {
            updatedUsers.push({
              username: user.LOG_UTI,
              nom: `${user.NOM_UTI} ${user.PRE_UTI}`,
              role: user.PROFIL_UTI,
              password: plainPassword,
              hashedPassword: hashedPassword.substring(0, 16) + '...'
            });
            console.log(`✓ Mot de passe réinitialisé pour ${username} (${user.PROFIL_UTI})`);
          }
        } else {
          notFoundUsers.push(username);
          console.log(`✗ Utilisateur non trouvé: ${username}`);
        }
      } catch (error) {
        console.error(`✗ Erreur pour ${username}:`, error.message);
      }
    }

    // Afficher le récapitulatif
    console.log('\n=== RÉCAPITULATIF ===');
    console.log(`Mots de passe réinitialisés: ${updatedUsers.length}`);
    console.log(`Utilisateurs non trouvés: ${notFoundUsers.length}`);
    
    if (updatedUsers.length > 0) {
      console.log('\nUtilisateurs mis à jour:');
      updatedUsers.forEach(user => {
        console.log(`  ${user.username} (${user.role}): ${user.password}`);
      });
    }
    
    if (notFoundUsers.length > 0) {
      console.log('\nUtilisateurs non trouvés:');
      notFoundUsers.forEach(username => {
        console.log(`  ${username}`);
      });
    }

    // Si vous souhaitez créer des utilisateurs de test manquants
    console.log('\n=== INSTRUCTIONS POUR CRÉER DES UTILISATEURS MANQUANTS ===');
    console.log('Pour créer les utilisateurs manquants, exécutez ces commandes SQL dans hcs_backoffice:');
    
    notFoundUsers.forEach(username => {
      const userConfig = {
        'admin_test': { 
          nom: 'Admin', 
          prenom: 'Test', 
          profil: 'Admin', 
          email: 'admin.test@healthcenter.cm',
          cod_pay: 'CMF'
        },
        'medecin_test': { 
          nom: 'Medecin', 
          prenom: 'Test', 
          profil: 'Medecin', 
          email: 'medecin.test@healthcenter.cm',
          cod_pay: 'CMF'
        },
        'infirmier_test': { 
          nom: 'Infirmier', 
          prenom: 'Test', 
          profil: 'Infirmier', 
          email: 'infirmier.test@healthcenter.cm',
          cod_pay: 'CMF'
        },
        'secretaire_test': { 
          nom: 'Secretaire', 
          prenom: 'Test', 
          profil: 'Secretaire', 
          email: 'secretaire.test@healthcenter.cm',
          cod_pay: 'CMF'
        },
        'caissier_test': { 
          nom: 'Caissier', 
          prenom: 'Test', 
          profil: 'Caissier', 
          email: 'caissier.test@healthcenter.cm',
          cod_pay: 'CMF'
        },
        'utilisateur_test': { 
          nom: 'Utilisateur', 
          prenom: 'Test', 
          profil: 'Utilisateur', 
          email: 'utilisateur.test@healthcenter.cm',
          cod_pay: 'CMF'
        }
      };
      
      if (userConfig[username]) {
        const config = userConfig[username];
        const hashedPassword = hashPasswordSHA256(newPasswords[username]);
        
        console.log(`\n-- Création de ${username} (${config.profil})`);
        console.log(`
          INSERT INTO [security].[UTILISATEUR] 
            (LOG_UTI, PWD_UTI, NOM_UTI, PRE_UTI, EMAIL_UTI, PROFIL_UTI, COD_PAY, ACTIF, COD_CREUTIL, DAT_CREUTIL)
          VALUES (
            '${username}', 
            '${hashedPassword}',
            '${config.nom}', 
            '${config.prenom}', 
            '${config.email}',
            '${config.profil}',
            '${config.cod_pay}',
            1,
            'system',
            GETDATE()
          )
        `);
      }
    });

    // Vérifier les administrateurs par défaut
    console.log('\n=== VÉRIFICATION DES ADMINISTRATEURS ===');
    const adminsQuery = `
      SELECT LOG_UTI, NOM_UTI, PRE_UTI, PROFIL_UTI, ACTIF, SUPER_ADMIN, COD_PAY
      FROM security.UTILISATEUR 
      WHERE PROFIL_UTI IN ('SuperAdmin', 'Admin')
      ORDER BY PROFIL_UTI
    `;
    
    const adminsResult = await pool.request().query(adminsQuery);
    
    console.log(`Administrateurs trouvés: ${adminsResult.recordset.length}`);
    adminsResult.recordset.forEach(admin => {
      console.log(`  - ${admin.LOG_UTI} (${admin.NOM_UTI} ${admin.PRE_UTI}) - ${admin.PROFIL_UTI} - ${admin.SUPER_ADMIN ? 'SuperAdmin' : 'Admin'} - ${admin.ACTIF ? 'Actif' : 'Inactif'}`);
    });

    // Instructions d'utilisation
    console.log('\n=== INSTRUCTIONS POUR LA CONNEXION ===');
    console.log('Utilisez ces identifiants pour vous connecter :');
    console.log('1. dilangue / Admin123! (SuperAdmin - Cameroun Francophone)');
    console.log('2. ekani / Admin456! (SuperAdmin - Cameroun Francophone)');
    console.log('\nPour les autres utilisateurs, créez-les d\'abord avec les commandes SQL ci-dessus.');

  } catch (error) {
    console.error('✗ Erreur lors de la réinitialisation des mots de passe:', error.message);
    console.error('\nAssurez-vous que :');
    console.error('1. SQL Server est en cours d\'exécution');
    console.error('2. La base de données hcs_backoffice existe');
    console.error('3. Les identifiants de connexion sont corrects');
    console.error('\nConfiguration utilisée :');
    console.error(`  Serveur: ${dbConfig.server}`);
    console.error(`  Base: ${dbConfig.database}`);
    console.error(`  Utilisateur: ${dbConfig.user}`);
    
    // Solution de secours : création des utilisateurs manquants via un script SQL
    console.log('\n=== SCRIPT SQL DE SECOURS ===');
    console.log('Exécutez ce script dans SQL Server Management Studio :\n');
    
    console.log(`
USE [hcs_backoffice]
GO

-- Réinitialisation des mots de passe pour dilangue et ekani
UPDATE [security].[UTILISATEUR] 
SET PWD_UTI = 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3' -- Admin123!
WHERE LOG_UTI = 'dilangue';

UPDATE [security].[UTILISATEUR] 
SET PWD_UTI = 'B3A8E0E1F9AB1BFE3A36F231F676F78BB30A519D2B21E6C530EA0B5D3F5E5B3F' -- Admin456!
WHERE LOG_UTI = 'ekani';

-- Vérification
SELECT LOG_UTI, NOM_UTI, PRE_UTI, PROFIL_UTI, ACTIF 
FROM [security].[UTILISATEUR] 
WHERE LOG_UTI IN ('dilangue', 'ekani');
    `);
    
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n✓ Connexion à la base de données fermée');
    }
  }
}

// Exécuter le script
resetPasswords();