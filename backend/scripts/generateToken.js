const jwt = require('jsonwebtoken');
const sql = require('mssql');
require('dotenv').config();

// Configuration de la base de données hcs_backoffice
const dbConfig = {
  user: process.env.DB_USER || 'dilangue',
  password: process.env.DB_PASSWORD || 'Admin123!',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'hcs_backoffice',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

// Utilisez la même clé secrète que dans votre backend
const JWT_SECRET = process.env.JWT_SECRET || 'hcs_backoffice_secret_key_2025_super_secure';

// Fonction pour se connecter à la base de données
async function connectToDatabase() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('Connecté à SQL Server avec succès');
    return pool;
  } catch (err) {
    console.error('Erreur de connexion à la base de données:', err.message);
    throw err;
  }
}

// Fonction pour récupérer les utilisateurs de test depuis la base de données
async function getTestUsers() {
  const pool = await connectToDatabase();
  
  try {
    // Récupérer les utilisateurs de test
    const query = `
      SELECT 
        u.ID_UTI as userId,
        u.LOG_UTI as username,
        u.PROFIL_UTI as role,
        u.NOM_UTI as nom,
        u.PRE_UTI as prenom,
        u.EMAIL_UTI as email,
        u.COD_PAY as cod_pay,
        u.SUPER_ADMIN as super_admin,
        p.COD_PRE as prestataire_id,
        p.SPECIALITE as specialite,
        p.NUM_LICENCE as numero_license,
        p.NOM_PRESTATAIRE as nom_prestataire,
        p.PRENOM_PRESTATAIRE as prenom_prestataire,
        pay.LIB_PAY as nom_pays,
        pay.LANGUE_DEFAUT as langue_pays
      FROM security.UTILISATEUR u
      LEFT JOIN core.PRESTATAIRE p ON u.EMAIL_UTI = p.EMAIL 
        AND u.PROFIL_UTI IN ('Medecin', 'Infirmier', 'Pharmacien', 'Technicien')
      LEFT JOIN ref.PAYS pay ON u.COD_PAY = pay.COD_PAY
      WHERE u.ACTIF = 1
      ORDER BY u.PROFIL_UTI, u.NOM_UTI
    `;

    const result = await pool.request().query(query);
    
    // Mapper les résultats vers un format adapté pour JWT
    const testUsers = result.recordset.map(user => ({
      userId: user.userId,
      username: user.username,
      role: user.role,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      cod_pay: user.cod_pay,
      super_admin: user.super_admin,
      nom_pays: user.nom_pays,
      langue_pays: user.langue_pays,
      // Inclure les infos prestataire si disponible
      ...(user.prestataire_id && {
        prestataireId: user.prestataire_id,
        medecinId: user.prestataire_id, // Alias pour compatibilité
        specialite: user.specialite,
        numero_license: user.numero_license,
        nom_prestataire: user.nom_prestataire,
        prenom_prestataire: user.prenom_prestataire
      })
    }));

    return testUsers;
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error.message);
    throw error;
  } finally {
    await pool.close();
  }
}

// Fonction pour générer un token
function generateToken(userData) {
  // Assurez-vous que les champs obligatoires sont présents
  const tokenPayload = {
    userId: userData.userId,
    username: userData.username,
    role: userData.role,
    nom: userData.nom,
    prenom: userData.prenom,
    email: userData.email,
    cod_pay: userData.cod_pay || 'CMF',
    super_admin: userData.super_admin || false
  };

  // Ajouter les infos supplémentaires si présentes
  if (userData.prestataireId) {
    tokenPayload.prestataireId = userData.prestataireId;
    tokenPayload.medecinId = userData.prestataireId; // Alias
    tokenPayload.specialite = userData.specialite;
    tokenPayload.numero_license = userData.numero_license;
  }

  const token = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'hcs-backoffice',
    audience: 'hcs-backoffice-users'
  });

  console.log('=== TOKEN GÉNÉRÉ ===');
  console.log('User:', userData.username);
  console.log('Role:', userData.role);
  console.log('Token:', token);
  console.log('Payload:', JSON.stringify(tokenPayload, null, 2));
  console.log('Expires In: 24h');
  console.log('====================\n');
  
  return token;
}

// Fonction principale
async function main() {
  try {
    console.log('=== GÉNÉRATION DE TOKENS POUR HCS_BACKOFFICE ===');
    console.log('Connexion à la base de données...\n');
    
    const testUsers = await getTestUsers();
    
    if (testUsers.length === 0) {
      console.log('Aucun utilisateur trouvé dans la base de données.');
      return;
    }

    console.log(`Utilisateurs disponibles (${testUsers.length}):`);
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.role}) - ${user.nom} ${user.prenom}`);
    });

    console.log('\n=== TOKENS GÉNÉRÉS ===');

    // Générer un token pour chaque utilisateur
    const tokens = [];
    for (const user of testUsers) {
      const token = generateToken(user);
      tokens.push({
        user: user.username,
        role: user.role,
        token: token
      });
    }

    // Instructions pour utiliser les tokens
    console.log('\n=== INSTRUCTIONS D\'UTILISATION ===');
    console.log('1. Pour utiliser un token dans le navigateur:');
    console.log('   Ouvrez la console du navigateur (F12)');
    console.log('   Exécutez la commande suivante:');
    console.log('   localStorage.setItem("token", "VOTRE_TOKEN_ICI")');
    console.log('   Puis rechargez la page du dashboard');
    
    console.log('\n2. Pour utiliser avec cURL:');
    tokens.forEach(t => {
      console.log(`\n   Pour ${t.user} (${t.role}):`);
      console.log(`   curl -H "Authorization: Bearer ${t.token}" http://localhost:3000/api/auth/verify`);
    });

    console.log('\n3. Pour utiliser avec Postman:');
    console.log('   - Créez une nouvelle requête');
    console.log('   - Ajoutez un header: "Authorization: Bearer VOTRE_TOKEN"');
    console.log('   - Envoyez la requête à http://localhost:3000/api/auth/verify');

    // Sauvegarder les tokens dans un fichier pour référence
    const fs = require('fs');
    const output = {
      generated_at: new Date().toISOString(),
      database: 'hcs_backoffice',
      tokens: tokens.map(t => ({
        user: t.user,
        role: t.role,
        token: t.token
      }))
    };

    fs.writeFileSync('tokens_hcs_backoffice.json', JSON.stringify(output, null, 2));
    console.log('\n=== TOKENS SAUVEGARDÉS ===');
    console.log('Les tokens ont été sauvegardés dans le fichier tokens_hcs_backoffice.json');

  } catch (error) {
    console.error('Erreur lors de l\'exécution du script:', error.message);
    
    // Si la connexion échoue, proposer des tokens de secours basés sur les données connues
    console.log('\n=== UTILISATION DES UTILISATEURS PAR DÉFAUT ===');
    
    const defaultUsers = [
      {
        userId: 1,
        username: 'dilangue',
        role: 'SuperAdmin',
        nom: 'Di',
        prenom: 'Langue',
        email: 'dilangue@healthcenter.cm',
        cod_pay: 'CMF',
        super_admin: true
      },
      {
        userId: 2,
        username: 'ekani',
        role: 'SuperAdmin',
        nom: 'Ekani',
        prenom: 'Ekani',
        email: 'ekani@healthcenter.cm',
        cod_pay: 'CMF',
        super_admin: true
      },
      {
        userId: 3,
        username: 'test_medecin',
        role: 'Medecin',
        nom: 'Test',
        prenom: 'Medecin',
        email: 'medecin@healthcenter.cm',
        cod_pay: 'CMF',
        super_admin: false,
        prestataireId: 1,
        specialite: 'Médecin Généraliste',
        numero_license: 'MG123456789'
      }
    ];

    console.log('Génération de tokens par défaut:');
    defaultUsers.forEach(user => generateToken(user));
  }
}

// Exécuter le script
main().catch(err => {
  console.error('Erreur inattendue:', err);
  process.exit(1);
});