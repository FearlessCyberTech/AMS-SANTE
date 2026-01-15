// backend/app.js - VERSION COMPLÈTEMENT RÉÉCRITE ET CORRIGÉE
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sql = require('mssql');
require('dotenv').config();

// Import de la configuration de la base de données
const dbConfig = require('./config/database');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware pour les requêtes OPTIONS (CORS)
app.options('*', cors());

// ==============================================
// FONCTIONS UTILITAIRES
// ==============================================

/**
 * Fonction robuste pour extraire un champ d'un objet avec support de différentes casse
 */
const extractField = (obj, key, defaultValue = undefined) => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  // Essayer différentes combinaisons de casse
  const variations = [
    key,
    key.toUpperCase(),
    key.toLowerCase(),
    key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
    ...(key.includes('_') ? [key.replace(/_/g, '')] : []),
    ...(key.includes('_') ? [key.replace(/_/g, '').toUpperCase()] : []),
    ...(key.includes('_') ? [key.replace(/_/g, '').toLowerCase()] : [])
  ];
  
  const uniqueVariations = [...new Set(variations)];
  
  for (const variation of uniqueVariations) {
    if (obj[variation] !== undefined) {
      return obj[variation];
    }
  }
  
  return defaultValue;
};

/**
 * Fonction utilitaire pour extraire plusieurs champs à la fois
 */
const extractMultipleFields = (obj, fields) => {
  const result = {};
  
  fields.forEach(field => {
    const { key, defaultValue } = field;
    result[key] = extractField(obj, key, defaultValue);
  });
  
  return result;
};

// ==============================================
// FONCTIONS UTILITAIRES POUR LES TYPES SQL
// ==============================================

// Fonction pour déterminer si un champ est une date
const isDateField = (key) => {
  const dateFields = [
    'NAI_BEN', 'DATE_MARIAGE', 'DATE_DIVORCE', 'DATE_CREATION', 
    'DATE_MODIFICATION', 'RETRAIT_DATE', 'DATE_VALIDITE',
    'DATE_PRESCRIPTION', 'DATE_CONSULTATION', 'DATE_ENREGISTREMENT',
    'DATE_EXECUTION', 'DATE_AUDIT', 'DATE_DEBUT', 'DATE_FIN'
  ];
  
  return dateFields.includes(key);
};

// Fonction pour nettoyer et valider les dates
const cleanDate = (dateString) => {
  if (!dateString || dateString === '' || dateString === 'null' || dateString === 'undefined') {
    return null;
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    // Formater en YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
};

// Fonction pour déterminer le type SQL d'un champ
const getSqlType = (key, value) => {
  // Vérifier d'abord les exclusions
  if (key === 'LIEU_NAISSANCE') {
    return sql.VarChar(100);
  }
  
  // Vérifier les champs de date (SEULEMENT ceux qui existent dans votre table)
  const dateFields = [
    'NAI_BEN', 'DATE_CREATION', 'DATE_MODIFICATION', 'RETRAIT_DATE',
    'DATE_CONSULTATION', 'DATE_ENREGISTREMENT', 'DATE_EXECUTION', 
    'DATE_AUDIT', 'DATE_DEBUT', 'DATE_FIN', 'SUSPENSION_DATE'
  ];
  
  if (dateFields.includes(key)) {
    return sql.Date;
  }
  
  // Gérer les valeurs null/undefined
  if (value === null || value === undefined) {
    // Par défaut, utiliser VarChar pour les champs texte inconnus
    return sql.VarChar(50);
  }
  
  // Déterminer le type basé sur la valeur
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return sql.Int;
    } else {
      return sql.Decimal(12, 2);
    }
  }
  
  if (typeof value === 'boolean') {
    return sql.Bit;
  }
  
  // Pour les chaînes de caractères, utiliser la longueur appropriée
  const stringKeys100 = [
    'NOM_BEN', 'PRE_BEN', 'FIL_BEN',
    'EMAIL', 'PROFESSION', 'EMPLOYEUR', 'MUTUELLE',
    'ZONE_HABITATION', 'TYPE_HABITAT', 'MOYEN_TRANSPORT',
    'RELIGION', 'LANGUE_MATERNEL', 'LANGUE_PARLEE', 'NIVEAU_ETUDE',
    'SITUATION_FAMILIALE', 'GROUPE_SANGUIN', 'RHESUS'
  ];
  
  if (stringKeys100.includes(key)) {
    return sql.VarChar(100);
  }
  
  if (key === 'ANTECEDENTS_MEDICAUX' || key === 'ALLERGIES' || 
      key === 'TRAITEMENTS_EN_COURS' || key === 'PRM_BEN') {
    return sql.VarChar(500);
  }
  
  return sql.VarChar(50);
};

// ==============================================
// MIDDLEWARE D'AUTHENTIFICATION
// ==============================================

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        error: 'Token d\'authentification manquant' 
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'healthcenter-dev-secret-2024');
    
    req.user = decoded;
    return next();
  } catch (error) {
    console.error('❌ Erreur token:', error.message);
    return res.status(403).json({ 
      success: false,
      error: 'Token invalide ou expiré' 
    });
  }
};

// ==============================================
// ROUTES DE SANTÉ ET DIAGNOSTIC
// ==============================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AMS Santé API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    database: 'hcs_backoffice'
  });
});

app.get('/api/test/connection', async (req, res) => {
  try {
    const pool = await dbConfig.getConnection();
    
    const tables = {
      utilisateurs: await pool.request().query('SELECT COUNT(*) as count FROM [security].[UTILISATEUR]'),
      beneficiaires: await pool.request().query('SELECT COUNT(*) as count FROM [core].[BENEFICIAIRE] WHERE RETRAIT_DATE IS NULL'),
      medecins: await pool.request().query('SELECT COUNT(*) as count FROM [core].[PRESTATAIRE] WHERE ACTIF = 1'),
      consultations: await pool.request().query('SELECT COUNT(*) as count FROM [core].[CONSULTATION]'),
      prescriptions: await pool.request().query('SELECT COUNT(*) as count FROM [metier].[PRESCRIPTION]'),
      typePaiement: await pool.request().query('SELECT COUNT(*) as count FROM [ref].[TYPE_PAIEMENT]')
    };
    
    return res.json({
      success: true,
      message: 'Connexion à la base de données établie',
      stats: {
        utilisateurs: tables.utilisateurs.recordset[0].count,
        beneficiaires: tables.beneficiaires.recordset[0].count,
        medecins: tables.medecins.recordset[0].count,
        consultations: tables.consultations.recordset[0].count,
        prescriptions: tables.prescriptions.recordset[0].count,
        typesPaiement: tables.typePaiement.recordset[0].count
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur test connexion:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur de connexion à la base de données',
      error: error.message
    });
  }
});

app.post('/api/test/extract', (req, res) => {
  try {
    const testData = {
      'COD_BEN': 123,
      'cod_ben': 456,
      'Cod_Ben': 789,
      'TYPE_PRESTATION': 'Consultation',
      'type_prestation': 'Pharmacie',
      'testField': 'Valeur de test'
    };
    
    const results = {
      COD_BEN: extractField(testData, 'COD_BEN'),
      cod_ben: extractField(testData, 'cod_ben'),
      TYPE_PRESTATION: extractField(testData, 'TYPE_PRESTATION'),
      type_prestation: extractField(testData, 'type_prestation'),
      NON_EXISTANT: extractField(testData, 'NON_EXISTANT', 'Valeur par défaut'),
      testField: extractField(testData, 'testField')
    };
    
    return res.json({
      success: true,
      message: 'Test de la fonction extractField',
      testData,
      results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==============================================
// ROUTES D'AUTHENTIFICATION
// ==============================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 Tentative de connexion:', username);
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom d\'utilisateur et mot de passe requis'
      });
    }
    
    try {
      const pool = await dbConfig.getConnection();
      
      const query = `
        SELECT 
          u.ID_UTI, u.LOG_UTI, u.PWD_UTI, u.NOM_UTI, u.PRE_UTI, 
          u.EMAIL_UTI, u.PROFIL_UTI, u.ACTIF, u.SUPER_ADMIN,
          u.SEX_UTI, u.TEL_UTI, u.FONCTION_UTI, u.SERVICE_UTI,
          u.LANGUE_UTI, u.THEME_UTI, p.LIB_PAY as PAYS
        FROM [security].[UTILISATEUR] u
        LEFT JOIN [ref].[PAYS] p ON u.COD_PAY = p.COD_PAY
        WHERE u.LOG_UTI = @username AND u.ACTIF = 1
      `;
      
      const result = await pool.request()
        .input('username', sql.VarChar, username)
        .query(query);
      
      if (result.recordset.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé ou compte inactif'
        });
      }
      
      const user = result.recordset[0];
      
      // Vérification du mot de passe (SHA-256 hash)
      const hashedPassword = crypto.createHash('sha256')
        .update(password)
        .digest('hex')
        .toUpperCase();
      
      if (user.PWD_UTI !== hashedPassword) {
        if (user.PWD_UTI !== password) {
          return res.status(401).json({
            success: false,
            message: 'Mot de passe incorrect'
          });
        }
      }
      
      // Mettre à jour la date de dernière connexion
      await pool.request()
        .input('id', sql.Int, user.ID_UTI)
        .query('UPDATE [security].[UTILISATEUR] SET DATE_DERNIERE_CONNEXION = GETDATE() WHERE ID_UTI = @id');
      
      const userData = {
        id: user.ID_UTI,
        username: user.LOG_UTI,
        nom: user.NOM_UTI,
        prenom: user.PRE_UTI,
        email: user.EMAIL_UTI,
        role: user.PROFIL_UTI,
        pays: user.PAYS || '',
        langue: user.LANGUE_UTI || 'fr',
        fonction: user.FONCTION_UTI || '',
        service: user.SERVICE_UTI || '',
        superAdmin: user.SUPER_ADMIN || false,
        theme: user.THEME_UTI || 'light'
      };
      
      const token = jwt.sign(
        {
          ...userData,
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        },
        process.env.JWT_SECRET || 'healthcenter-dev-secret-2024'
      );
      
      console.log('✅ Connexion réussie:', username, 'Rôle:', user.PROFIL_UTI);
      
      // Journaliser l'action
      try {
        await pool.request()
          .input('type', sql.VarChar, 'LOGIN')
          .input('table', sql.VarChar, 'UTILISATEUR')
          .input('id', sql.VarChar, user.ID_UTI)
          .input('utilisateur', sql.VarChar, username)
          .input('description', sql.VarChar, `Connexion réussie - ${user.PROFIL_UTI}`)
          .query(`
            INSERT INTO [audit].[SYSTEM_AUDIT] 
            (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION, DATE_AUDIT)
            VALUES (@type, @table, @id, @utilisateur, @description, GETDATE())
          `);
      } catch (auditError) {
        console.warn('⚠️ Erreur journalisation:', auditError.message);
      }
      
      return res.json({
        success: true,
        message: 'Connexion réussie',
        token: token,
        user: userData
      });
      
    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Erreur de connexion à la base de données'
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur login:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  return res.json({
    success: true,
    valid: true,
    user: req.user
  });
});

// ==============================================
// ROUTES DES PATIENTS (BÉNÉFICIAIRES) - AJOUT DE LA ROUTE POST
// ==============================================

app.get('/api/patients', authenticateToken, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT TOP ${parseInt(limit)}
        b.ID_BEN,
        b.NOM_BEN,
        b.PRE_BEN,
        b.SEX_BEN,
        dbo.fCalculAge(b.NAI_BEN, GETDATE()) as AGE,
        b.TELEPHONE_MOBILE,
        b.EMAIL,
        b.PROFESSION,
        b.IDENTIFIANT_NATIONAL,
        p.LIB_PAY as PAYS,
        FORMAT((SELECT MAX(DATE_CONSULTATION) 
                FROM [core].[CONSULTATION] c 
                WHERE c.COD_BEN = b.ID_BEN), 'dd/MM/yyyy') as DERNIERE_VISITE
      FROM [core].[BENEFICIAIRE] b
      LEFT JOIN [ref].[PAYS] p ON b.COD_PAY = p.COD_PAY
      WHERE b.RETRAIT_DATE IS NULL
      ORDER BY b.NOM_BEN, b.PRE_BEN
    `;
    
    const result = await pool.request().query(query);
    
    return res.json({
      success: true,
      patients: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération patients:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

app.get('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT 
        b.*,
        p.LIB_PAY as PAYS,
        tp.LIB_PAI as TYPE_PAIEMENT,
        tp.TAUX_COUVERTURE,
        dbo.fCalculAge(b.NAI_BEN, GETDATE()) as AGE
      FROM [core].[BENEFICIAIRE] b
      LEFT JOIN [ref].[PAYS] p ON b.COD_PAY = p.COD_PAY
      LEFT JOIN [ref].[TYPE_PAIEMENT] tp ON b.COD_PAI = tp.COD_PAI
      WHERE b.ID_BEN = @id
    `;
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }
    
    return res.json({
      success: true,
      patient: result.recordset[0]
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération patient:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ==============================================
// ROUTES DES PATIENTS (BÉNÉFICIAIRES) - AJOUT DE LA ROUTE POST
// ==============================================

app.post('/api/patients', authenticateToken, async (req, res) => {
  let pool;
  let transaction;
  
  try {
    console.log('📥 Création patient - Données reçues:', JSON.stringify(req.body, null, 2));
    
    // CORRECTION : Utiliser SEULEMENT les champs qui existent dans votre table
    const fieldsToExtract = [
      // Informations personnelles
      { key: 'NOM_BEN', defaultValue: '' },
      { key: 'PRE_BEN', defaultValue: '' },
      { key: 'SEX_BEN', defaultValue: 'M' },
      { key: 'NAI_BEN', defaultValue: null },
      { key: 'LIEU_NAISSANCE', defaultValue: '' },
      { key: 'FIL_BEN', defaultValue: '' },
      
      // Identification
      { key: 'IDENTIFIANT_NATIONAL', defaultValue: '' },
      { key: 'NUM_PASSEPORT', defaultValue: '' },
      { key: 'NUM_RIB', defaultValue: null },
      
      // Coordonnées
      { key: 'EMAIL', defaultValue: '' },
      { key: 'TELEPHONE', defaultValue: '' },
      { key: 'TELEPHONE_MOBILE', defaultValue: '' },
      { key: 'CONTACT_URGENCE', defaultValue: '' },
      { key: 'TEL_URGENCE', defaultValue: '' },
      
      // Médical
      { key: 'GROUPE_SANGUIN', defaultValue: '' },
      { key: 'RHESUS', defaultValue: '+' },
      { key: 'ANTECEDENTS_MEDICAUX', defaultValue: '' },
      { key: 'ALLERGIES', defaultValue: '' },
      { key: 'TRAITEMENTS_EN_COURS', defaultValue: '' },
      { key: 'PRM_BEN', defaultValue: '' },
      
      // Professionnel
      { key: 'PROFESSION', defaultValue: '' },
      { key: 'EMPLOYEUR', defaultValue: '' },
      { key: 'SALAIRE', defaultValue: null },
      { key: 'SITUATION_FAMILIALE', defaultValue: '' },
      { key: 'NOMBRE_ENFANTS', defaultValue: 0 },
      
      // Culturel
      { key: 'RELIGION', defaultValue: '' },
      { key: 'LANGUE_MATERNEL', defaultValue: '' },
      { key: 'LANGUE_PARLEE', defaultValue: '' },
      { key: 'NIVEAU_ETUDE', defaultValue: '' },
      
      // Localisation
      { key: 'COD_PAY', defaultValue: 'CMF' },
      { key: 'COD_REGION', defaultValue: null },
      { key: 'CODE_TRIBAL', defaultValue: '' },
      { key: 'ZONE_HABITATION', defaultValue: '' },
      { key: 'TYPE_HABITAT', defaultValue: '' },
      { key: 'ACCES_EAU', defaultValue: true },
      { key: 'ACCES_ELECTRICITE', defaultValue: true },
      { key: 'DISTANCE_CENTRE_SANTE', defaultValue: 0 },
      { key: 'MOYEN_TRANSPORT', defaultValue: '' },
      
      // Assurance
      { key: 'COD_PAI', defaultValue: 1 },
      { key: 'ASSURANCE_PRIVE', defaultValue: false },
      { key: 'MUTUELLE', defaultValue: '' },
      
      // Statut ACE
      { key: 'STATUT_ACE', defaultValue: 'Principal' },
      { key: 'ID_ASSURE_PRINCIPAL', defaultValue: null },
      
      // Photo
      { key: 'PHOTO', defaultValue: '' },
      
      // CORRECTION : Ces champs n'existent PAS dans votre table, donc on les supprime
      // { key: 'DATE_MARIAGE', defaultValue: null },
      // { key: 'LIEU_MARIAGE', defaultValue: '' },
      // { key: 'NUM_ACTE_MARIAGE', defaultValue: '' },
      // { key: 'DATE_DIVORCE', defaultValue: null },
      // { key: 'LIEU_DIVORCE', defaultValue: '' },
      // { key: 'NUM_ACTE_DIVORCE', defaultValue: '' },
      
      // CORRECTION : Ces champs d'adresse n'existent PAS dans votre table, donc on les supprime
      // { key: 'QUARTIER', defaultValue: '' },
      // { key: 'AVENUE', defaultValue: '' },
      // { key: 'NUMERO_MAISON', defaultValue: '' },
      // { key: 'BP', defaultValue: '' },
      // { key: 'CP', defaultValue: '' },
      // { key: 'COORD_GPS', defaultValue: '' },
      
      // NOTE : Votre table a aussi NUM_ADR et COD_NAT, mais nous ne les avons pas dans l'extraction
      // On va les laisser NULL pour l'instant
    ];
    
    const extractedData = extractMultipleFields(req.body, fieldsToExtract);
    
    // Nettoyer les dates
    extractedData.NAI_BEN = cleanDate(extractedData.NAI_BEN);
    
    console.log('✅ Champs extraits (après nettoyage dates):', {
      nom: extractedData.NOM_BEN,
      prenom: extractedData.PRE_BEN,
      telephone: extractedData.TELEPHONE_MOBILE,
      dateNaissance: extractedData.NAI_BEN,
      lieuNaissance: extractedData.LIEU_NAISSANCE,
      statutACE: extractedData.STATUT_ACE,
      assurePrincipal: extractedData.ID_ASSURE_PRINCIPAL
    });
    
    // Validation des champs obligatoires
    const requiredFields = ['NOM_BEN', 'PRE_BEN', 'SEX_BEN', 'NAI_BEN', 'TELEPHONE_MOBILE', 'STATUT_ACE'];
    const missingFields = requiredFields.filter(field => {
      const value = extractedData[field];
      return value === null || value === undefined || value === '';
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs obligatoires manquants: ${missingFields.join(', ')}`,
        missingFields,
        extractedData: {
          NOM_BEN: extractedData.NOM_BEN,
          PRE_BEN: extractedData.PRE_BEN,
          SEX_BEN: extractedData.SEX_BEN,
          NAI_BEN: extractedData.NAI_BEN,
          TELEPHONE_MOBILE: extractedData.TELEPHONE_MOBILE,
          STATUT_ACE: extractedData.STATUT_ACE
        }
      });
    }
    
    // Validation pour les ayants droit
    if (extractedData.STATUT_ACE !== 'Principal' && !extractedData.ID_ASSURE_PRINCIPAL) {
      return res.status(400).json({
        success: false,
        message: 'L\'assuré principal est requis pour les ayants droit',
        statut: extractedData.STATUT_ACE
      });
    }
    
    pool = await dbConfig.getConnection();
    transaction = new sql.Transaction(pool);
    
    await transaction.begin();
    
    // Vérifier que le pays existe
    if (extractedData.COD_PAY) {
      const paysCheck = await new sql.Request(transaction)
        .input('COD_PAY', sql.VarChar, extractedData.COD_PAY)
        .query('SELECT COD_PAY FROM [ref].[PAYS] WHERE COD_PAY = @COD_PAY');
      
      if (paysCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Pays ${extractedData.COD_PAY} non trouvé`
        });
      }
    }
    
    // Vérifier que le type de paiement existe
    if (extractedData.COD_PAI) {
      const typePaiementCheck = await new sql.Request(transaction)
        .input('COD_PAI', sql.Int, extractedData.COD_PAI)
        .query('SELECT COD_PAI FROM [ref].[TYPE_PAIEMENT] WHERE COD_PAI = @COD_PAI');
      
      if (typePaiementCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Type de paiement ${extractedData.COD_PAI} non trouvé`
        });
      }
    }
    
    // Vérifier l'assuré principal si c'est un ayant droit
    if (extractedData.STATUT_ACE !== 'Principal' && extractedData.ID_ASSURE_PRINCIPAL) {
      const assurePrincipalCheck = await new sql.Request(transaction)
        .input('ID_ASSURE_PRINCIPAL', sql.Int, extractedData.ID_ASSURE_PRINCIPAL)
        .query(`
          SELECT ID_BEN, NOM_BEN, PRE_BEN 
          FROM [core].[BENEFICIAIRE] 
          WHERE ID_BEN = @ID_ASSURE_PRINCIPAL AND RETRAIT_DATE IS NULL
        `);
      
      if (assurePrincipalCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Assuré principal non trouvé ou retiré'
        });
      }
    }
    
    // CORRECTION : Requête d'insertion avec SEULEMENT les colonnes qui existent dans votre table
    const query = `
      INSERT INTO [core].[BENEFICIAIRE] (
        NOM_BEN, PRE_BEN, FIL_BEN, SEX_BEN, NAI_BEN, LIEU_NAISSANCE,
        IDENTIFIANT_NATIONAL, NUM_PASSEPORT, NUM_RIB,
        EMAIL, TELEPHONE, TELEPHONE_MOBILE, CONTACT_URGENCE, TEL_URGENCE,
        GROUPE_SANGUIN, RHESUS, ANTECEDENTS_MEDICAUX, ALLERGIES, TRAITEMENTS_EN_COURS, PRM_BEN,
        PROFESSION, EMPLOYEUR, SALAIRE, SITUATION_FAMILIALE, NOMBRE_ENFANTS,
        RELIGION, LANGUE_MATERNEL, LANGUE_PARLEE, NIVEAU_ETUDE,
        COD_PAY, COD_REGION, CODE_TRIBAL,
        ZONE_HABITATION, TYPE_HABITAT, ACCES_EAU, ACCES_ELECTRICITE, DISTANCE_CENTRE_SANTE, MOYEN_TRANSPORT,
        COD_PAI, ASSURANCE_PRIVE, MUTUELLE,
        STATUT_ACE, ID_ASSURE_PRINCIPAL,
        PHOTO,
        COD_CREUTIL, DAT_CREUTIL, COD_MODUTIL, DAT_MODUTIL
      )
      OUTPUT INSERTED.ID_BEN
      VALUES (
        @NOM_BEN, @PRE_BEN, @FIL_BEN, @SEX_BEN, @NAI_BEN, @LIEU_NAISSANCE,
        @IDENTIFIANT_NATIONAL, @NUM_PASSEPORT, @NUM_RIB,
        @EMAIL, @TELEPHONE, @TELEPHONE_MOBILE, @CONTACT_URGENCE, @TEL_URGENCE,
        @GROUPE_SANGUIN, @RHESUS, @ANTECEDENTS_MEDICAUX, @ALLERGIES, @TRAITEMENTS_EN_COURS, @PRM_BEN,
        @PROFESSION, @EMPLOYEUR, @SALAIRE, @SITUATION_FAMILIALE, @NOMBRE_ENFANTS,
        @RELIGION, @LANGUE_MATERNEL, @LANGUE_PARLEE, @NIVEAU_ETUDE,
        @COD_PAY, @COD_REGION, @CODE_TRIBAL,
        @ZONE_HABITATION, @TYPE_HABITAT, @ACCES_EAU, @ACCES_ELECTRICITE, @DISTANCE_CENTRE_SANTE, @MOYEN_TRANSPORT,
        @COD_PAI, @ASSURANCE_PRIVE, @MUTUELLE,
        @STATUT_ACE, @ID_ASSURE_PRINCIPAL,
        @PHOTO,
        @COD_CREUTIL, GETDATE(), @COD_CREUTIL, GETDATE()
      )
    `;
    
    const request = new sql.Request(transaction);
    
    // Ajouter tous les paramètres
    Object.entries(extractedData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const sqlType = getSqlType(key, value);
        console.log(`🔧 Paramètre ${key}: type=${sqlType.name}, valeur=${value}`);
        request.input(key, sqlType, value);
      } else {
        // Pour les valeurs nulles/vides, utiliser le type approprié
        if (isDateField(key)) {
          request.input(key, sql.Date, null);
        } else if (key === 'NUM_RIB' || key === 'SALAIRE' || key === 'COD_REGION' || key === 'ID_ASSURE_PRINCIPAL') {
          request.input(key, sql.Int, null);
        } else if (key === 'ACCES_EAU' || key === 'ACCES_ELECTRICITE' || key === 'ASSURANCE_PRIVE') {
          request.input(key, sql.Bit, 0);
        } else {
          request.input(key, sql.VarChar(50), null);
        }
      }
    });
    
    // Ajouter les paramètres supplémentaires
    request.input('COD_CREUTIL', sql.VarChar, req.user?.username || 'SYSTEM');
    
    console.log('📤 Exécution requête avec paramètres:', {
      NOM_BEN: extractedData.NOM_BEN,
      PRE_BEN: extractedData.PRE_BEN,
      NAI_BEN: extractedData.NAI_BEN,
      LIEU_NAISSANCE: extractedData.LIEU_NAISSANCE,
      TELEPHONE_MOBILE: extractedData.TELEPHONE_MOBILE,
      STATUT_ACE: extractedData.STATUT_ACE,
      ID_ASSURE_PRINCIPAL: extractedData.ID_ASSURE_PRINCIPAL
    });
    
    const result = await request.query(query);
    
    if (!result.recordset || result.recordset.length === 0) {
      throw new Error('Aucun ID de bénéficiaire retourné');
    }
    
    const patientId = result.recordset[0].ID_BEN;
    
    await transaction.commit();
    
    // Journaliser l'action
    try {
      const logPool = await dbConfig.getConnection();
      await logPool.request()
        .input('type', sql.VarChar, 'CREATE')
        .input('table', sql.VarChar, 'BENEFICIAIRE')
        .input('id', sql.VarChar, patientId.toString())
        .input('utilisateur', sql.VarChar, req.user?.username || 'SYSTEM')
        .input('description', sql.VarChar, `Nouveau patient créé: ${extractedData.NOM_BEN} ${extractedData.PRE_BEN}`)
        .query(`
          INSERT INTO [audit].[SYSTEM_AUDIT] 
          (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION, DATE_AUDIT)
          VALUES (@type, @table, @id, @utilisateur, @description, GETDATE())
        `);
    } catch (auditError) {
      console.warn('⚠️ Erreur journalisation:', auditError.message);
    }
    
    return res.status(201).json({
      success: true,
      message: 'Patient créé avec succès',
      id: patientId,
      patientId: patientId,
      patient: {
        id: patientId,
        nom: extractedData.NOM_BEN,
        prenom: extractedData.PRE_BEN,
        telephone: extractedData.TELEPHONE_MOBILE,
        statutACE: extractedData.STATUT_ACE
      }
    });
    
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('❌ Erreur lors du rollback:', rollbackError);
      }
    }
    
    console.error('❌ Erreur création patient:', error);
    
    let errorMessage = 'Erreur lors de la création du patient';
    let statusCode = 500;
    
    if (error.message.includes('foreign key constraint')) {
      errorMessage = 'Référence invalide (pays, région ou assuré principal inexistant)';
      statusCode = 400;
    } else if (error.message.includes('Violation of UNIQUE KEY constraint')) {
      errorMessage = 'Identifiant national ou téléphone déjà existant';
      statusCode = 409;
    } else if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      errorMessage = 'Violation de clé primaire';
      statusCode = 400;
    } else if (error.message.includes('Invalid date')) {
      errorMessage = 'Format de date invalide. Utilisez le format YYYY-MM-DD';
      statusCode = 400;
    } else if (error.message.includes('EPARAM')) {
      errorMessage = 'Erreur de paramètre SQL. Vérifiez les types de données.';
      statusCode = 400;
    } else if (error.message.includes('Invalid column name')) {
      errorMessage = `Colonne non trouvée dans la table: ${error.message.split("'")[1]}`;
      statusCode = 400;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


// Route PUT pour mettre à jour un patient
app.put('/api/patients/:id', authenticateToken, async (req, res) => {
  let pool;
  let transaction;
  
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID patient invalide'
      });
    }
    
    console.log(`📝 Mise à jour patient ${id} - Données reçues:`, JSON.stringify(req.body, null, 2));
    
    // Vérifier que le patient existe
    pool = await dbConfig.getConnection();
    
    const patientCheck = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT ID_BEN FROM [core].[BENEFICIAIRE] WHERE ID_BEN = @id AND RETRAIT_DATE IS NULL');
    
    if (patientCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé ou retiré'
      });
    }
    
    // CORRECTION : Extraire SEULEMENT les champs qui existent dans votre table
    const fieldsToExtract = [
      // Informations personnelles
      { key: 'NOM_BEN', defaultValue: null },
      { key: 'PRE_BEN', defaultValue: null },
      { key: 'SEX_BEN', defaultValue: null },
      { key: 'NAI_BEN', defaultValue: null },
      { key: 'LIEU_NAISSANCE', defaultValue: null },
      { key: 'FIL_BEN', defaultValue: null },
      
      // Identification
      { key: 'IDENTIFIANT_NATIONAL', defaultValue: null },
      { key: 'NUM_PASSEPORT', defaultValue: null },
      { key: 'NUM_RIB', defaultValue: null },
      
      // Coordonnées
      { key: 'EMAIL', defaultValue: null },
      { key: 'TELEPHONE', defaultValue: null },
      { key: 'TELEPHONE_MOBILE', defaultValue: null },
      { key: 'CONTACT_URGENCE', defaultValue: null },
      { key: 'TEL_URGENCE', defaultValue: null },
      
      // Médical
      { key: 'GROUPE_SANGUIN', defaultValue: null },
      { key: 'RHESUS', defaultValue: null },
      { key: 'ANTECEDENTS_MEDICAUX', defaultValue: null },
      { key: 'ALLERGIES', defaultValue: null },
      { key: 'TRAITEMENTS_EN_COURS', defaultValue: null },
      { key: 'PRM_BEN', defaultValue: null },
      
      // Professionnel
      { key: 'PROFESSION', defaultValue: null },
      { key: 'EMPLOYEUR', defaultValue: null },
      { key: 'SALAIRE', defaultValue: null },
      { key: 'SITUATION_FAMILIALE', defaultValue: null },
      { key: 'NOMBRE_ENFANTS', defaultValue: null },
      
      // Culturel
      { key: 'RELIGION', defaultValue: null },
      { key: 'LANGUE_MATERNEL', defaultValue: null },
      { key: 'LANGUE_PARLEE', defaultValue: null },
      { key: 'NIVEAU_ETUDE', defaultValue: null },
      
      // Localisation
      { key: 'COD_PAY', defaultValue: null },
      { key: 'COD_REGION', defaultValue: null },
      { key: 'CODE_TRIBAL', defaultValue: null },
      { key: 'ZONE_HABITATION', defaultValue: null },
      { key: 'TYPE_HABITAT', defaultValue: null },
      { key: 'ACCES_EAU', defaultValue: null },
      { key: 'ACCES_ELECTRICITE', defaultValue: null },
      { key: 'DISTANCE_CENTRE_SANTE', defaultValue: null },
      { key: 'MOYEN_TRANSPORT', defaultValue: null },
      
      // Assurance
      { key: 'COD_PAI', defaultValue: null },
      { key: 'ASSURANCE_PRIVE', defaultValue: null },
      { key: 'MUTUELLE', defaultValue: null },
      
      // Statut ACE
      { key: 'STATUT_ACE', defaultValue: null },
      { key: 'ID_ASSURE_PRINCIPAL', defaultValue: null },
      
      // Photo
      { key: 'PHOTO', defaultValue: null }
      
      // SUPPRIMÉ : Les champs qui n'existent pas dans votre table
    ];
    
    const extractedData = extractMultipleFields(req.body, fieldsToExtract);
    
    // Filtrer pour ne garder que les champs qui ont été fournis (non null)
    const updateFields = {};
    Object.entries(extractedData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        updateFields[key] = value;
      }
    });
    
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }
    
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    // Vérifications similaires à la création
    if (updateFields.COD_PAY) {
      const paysCheck = await new sql.Request(transaction)
        .input('COD_PAY', sql.VarChar, updateFields.COD_PAY)
        .query('SELECT COD_PAY FROM [ref].[PAYS] WHERE COD_PAY = @COD_PAY');
      
      if (paysCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Pays ${updateFields.COD_PAY} non trouvé`
        });
      }
    }
    
    if (updateFields.COD_PAI) {
      const typePaiementCheck = await new sql.Request(transaction)
        .input('COD_PAI', sql.Int, updateFields.COD_PAI)
        .query('SELECT COD_PAI FROM [ref].[TYPE_PAIEMENT] WHERE COD_PAI = @COD_PAI');
      
      if (typePaiementCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Type de paiement ${updateFields.COD_PAI} non trouvé`
        });
      }
    }
    
    if (updateFields.STATUT_ACE && updateFields.STATUT_ACE !== 'Principal' && updateFields.ID_ASSURE_PRINCIPAL) {
      const assurePrincipalCheck = await new sql.Request(transaction)
        .input('ID_ASSURE_PRINCIPAL', sql.Int, updateFields.ID_ASSURE_PRINCIPAL)
        .query('SELECT ID_BEN FROM [core].[BENEFICIAIRE] WHERE ID_BEN = @ID_ASSURE_PRINCIPAL AND RETRAIT_DATE IS NULL');
      
      if (assurePrincipalCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Assuré principal non trouvé ou retiré'
        });
      }
    }
    
    // Construire la requête de mise à jour dynamique
    const setClauses = [];
    const request = new sql.Request(transaction);
    
    Object.entries(updateFields).forEach(([key, value]) => {
      if (key !== 'ID_BEN') { // Ne pas mettre à jour l'ID
        setClauses.push(`${key} = @${key}`);
        const sqlType = getSqlType(key, value);
        request.input(key, sqlType, value);
      }
    });
    
    // Ajouter les champs de mise à jour
    setClauses.push('COD_MODUTIL = @COD_MODUTIL');
    setClauses.push('DAT_MODUTIL = GETDATE()');
    
    request.input('COD_MODUTIL', sql.VarChar, req.user?.username || 'SYSTEM');
    request.input('id', sql.Int, parseInt(id));
    
    const updateQuery = `
      UPDATE [core].[BENEFICIAIRE]
      SET ${setClauses.join(', ')}
      WHERE ID_BEN = @id
    `;
    
    await request.query(updateQuery);
    
    await transaction.commit();
    
    // Journaliser l'action
    try {
      await pool.request()
        .input('type', sql.VarChar, 'UPDATE')
        .input('table', sql.VarChar, 'BENEFICIAIRE')
        .input('id', sql.VarChar, id)
        .input('utilisateur', sql.VarChar, req.user?.username || 'SYSTEM')
        .input('description', sql.VarChar, `Mise à jour patient ${id}`)
        .query(`
          INSERT INTO [audit].[SYSTEM_AUDIT] 
          (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION, DATE_AUDIT)
          VALUES (@type, @table, @id, @utilisateur, @description, GETDATE())
        `);
    } catch (auditError) {
      console.warn('⚠️ Erreur journalisation:', auditError.message);
    }
    
    return res.json({
      success: true,
      message: 'Patient mis à jour avec succès',
      patientId: id
    });
    
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('❌ Erreur lors du rollback:', rollbackError);
      }
    }
    
    console.error('❌ Erreur mise à jour patient:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du patient',
      error: error.message
    });
  }
});

// Route DELETE pour supprimer (retirer) un patient
app.delete('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID patient invalide'
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    // Vérifier que le patient existe
    const patientCheck = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT ID_BEN, NOM_BEN, PRE_BEN FROM [core].[BENEFICIAIRE] WHERE ID_BEN = @id AND RETRAIT_DATE IS NULL');
    
    if (patientCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé ou déjà retiré'
      });
    }
    
    const patient = patientCheck.recordset[0];
    
    // Marquer comme retiré (soft delete)
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('cod_modutil', sql.VarChar, req.user?.username || 'SYSTEM')
      .query(`
        UPDATE [core].[BENEFICIAIRE]
        SET 
          RETRAIT_DATE = GETDATE(),
          MOTIF_RETRAIT = 'Retiré via interface',
          COD_MODUTIL = @cod_modutil,
          DAT_MODUTIL = GETDATE()
        WHERE ID_BEN = @id
      `);
    
    // Journaliser l'action
    try {
      await pool.request()
        .input('type', sql.VarChar, 'DELETE')
        .input('table', sql.VarChar, 'BENEFICIAIRE')
        .input('id', sql.VarChar, id)
        .input('utilisateur', sql.VarChar, req.user?.username || 'SYSTEM')
        .input('description', sql.VarChar, `Patient ${patient.NOM_BEN} ${patient.PRE_BEN} retiré du système`)
        .query(`
          INSERT INTO [audit].[SYSTEM_AUDIT] 
          (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION, DATE_AUDIT)
          VALUES (@type, @table, @id, @utilisateur, @description, GETDATE())
        `);
    } catch (auditError) {
      console.warn('⚠️ Erreur journalisation:', auditError.message);
    }
    
    return res.json({
      success: true,
      message: `Patient ${patient.NOM_BEN} ${patient.PRE_BEN} retiré avec succès`
    });
    
  } catch (error) {
    console.error('❌ Erreur suppression patient:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du patient',
      error: error.message
    });
  }
});

// ==============================================
// ROUTES DES CONSULTATIONS
// ==============================================

// Recherche de patients pour les consultations
app.get('/api/consultations/search-patients', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search || search.trim().length < 2) {
      return res.json({
        success: true,
        patients: []
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT TOP 20
        b.ID_BEN,
        b.NOM_BEN,
        b.PRE_BEN,
        b.SEX_BEN,
        b.NAI_BEN,
        dbo.fCalculAge(b.NAI_BEN, GETDATE()) as AGE,
        b.TELEPHONE_MOBILE,
        b.EMAIL,
        b.IDENTIFIANT_NATIONAL,
        b.PROFESSION,
        b.COD_PAI,
        p.LIB_PAY as PAYS,
        tp.LIB_PAI as TYPE_PAIEMENT,
        tp.TAUX_COUVERTURE
      FROM [core].[BENEFICIAIRE] b
      LEFT JOIN [ref].[PAYS] p ON b.COD_PAY = p.COD_PAY
      LEFT JOIN [ref].[TYPE_PAIEMENT] tp ON b.COD_PAI = tp.COD_PAI
      WHERE b.RETRAIT_DATE IS NULL
        AND (
          b.NOM_BEN LIKE @search 
          OR b.PRE_BEN LIKE @search 
          OR b.IDENTIFIANT_NATIONAL LIKE @search
          OR b.TELEPHONE_MOBILE LIKE @search
          OR CONCAT(b.NOM_BEN, ' ', b.PRE_BEN) LIKE @search
        )
      ORDER BY b.NOM_BEN, b.PRE_BEN
    `;
    
    const result = await pool.request()
      .input('search', sql.VarChar, `%${search}%`)
      .query(query);
    
    return res.json({
      success: true,
      patients: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Erreur recherche patients:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Recherche par carte
app.get('/api/consultations/search-by-card', authenticateToken, async (req, res) => {
  try {
    const { card } = req.query;
    
    if (!card || card.trim().length < 2) {
      return res.json({
        success: true,
        patients: []
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT TOP 10
        b.ID_BEN,
        b.NOM_BEN,
        b.PRE_BEN,
        b.SEX_BEN,
        b.NAI_BEN,
        dbo.fCalculAge(b.NAI_BEN, GETDATE()) as AGE,
        b.TELEPHONE_MOBILE,
        b.EMAIL,
        b.IDENTIFIANT_NATIONAL,
        b.PROFESSION,
        b.COD_PAI,
        p.LIB_PAY as PAYS,
        tp.LIB_PAI as TYPE_PAIEMENT,
        tp.TAUX_COUVERTURE
      FROM [core].[BENEFICIAIRE] b
      LEFT JOIN [ref].[PAYS] p ON b.COD_PAY = p.COD_PAY
      LEFT JOIN [ref].[TYPE_PAIEMENT] tp ON b.COD_PAI = tp.COD_PAI
      WHERE b.RETRAIT_DATE IS NULL
        AND b.IDENTIFIANT_NATIONAL LIKE @card
      ORDER BY b.NOM_BEN, b.PRE_BEN
    `;
    
    const result = await pool.request()
      .input('card', sql.VarChar, `%${card}%`)
      .query(query);
    
    return res.json({
      success: true,
      patients: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Erreur recherche par carte:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Liste des médecins
app.get('/api/consultations/medecins', authenticateToken, async (req, res) => {
  try {
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT 
        COD_PRE, 
        NOM_PRESTATAIRE,
        PRENOM_PRESTATAIRE,
        NOM_PRESTATAIRE + ' ' + ISNULL(PRENOM_PRESTATAIRE, '') as NOM_COMPLET,
        SPECIALITE,
        TITRE,
        COD_CEN,
        TELEPHONE,
        EMAIL,
        'Medecin' as TYPE_PRESTATAIRE
      FROM [core].[PRESTATAIRE]
      WHERE (TYPE_PRESTATAIRE = 'Medecin' OR SPECIALITE IS NOT NULL) 
        AND ACTIF = 1
      ORDER BY NOM_PRESTATAIRE, PRENOM_PRESTATAIRE
    `;
    
    const result = await pool.request().query(query);
    
    return res.json({
      success: true,
      medecins: result.recordset,
      count: result.recordset.length
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération médecins:', error);
    
    // Données de secours
    return res.json({
      success: true,
      medecins: [
        {
          COD_PRE: 1,
          NOM_PRESTATAIRE: 'Dupont',
          PRENOM_PRESTATAIRE: 'Jean',
          NOM_COMPLET: 'Dupont Jean',
          SPECIALITE: 'Généraliste',
          TYPE_PRESTATAIRE: 'Medecin'
        },
        {
          COD_PRE: 2,
          NOM_PRESTATAIRE: 'Martin',
          PRENOM_PRESTATAIRE: 'Marie',
          NOM_COMPLET: 'Martin Marie',
          SPECIALITE: 'Pédiatre',
          TYPE_PRESTATAIRE: 'Medecin'
        }
      ],
      message: 'Mode développement - données de test'
    });
  }
});

// Types de consultation
app.get('/api/consultations/types', authenticateToken, async (req, res) => {
  try {
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT 
        COD_TYP_CONS as id,
        LIB_TYP_CONS as libelle,
        MONTANT as tarif
      FROM [metier].[TYPE_CONSULTATION]
      WHERE ACTIF = 1
      ORDER BY MONTANT
    `;
    
    const result = await pool.request().query(query);
    
    return res.json({
      success: true,
      types: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération types consultation:', error);
    return res.json({
      success: true,
      types: [
        { id: 1, libelle: 'Consultation Généraliste', tarif: 5000 },
        { id: 2, libelle: 'Consultation Spécialiste', tarif: 10000 },
        { id: 3, libelle: 'Consultation Urgence', tarif: 15000 },
        { id: 4, libelle: 'Consultation Suivi', tarif: 3000 }
      ]
    });
  }
});

// Recherche d'affections
app.get('/api/consultations/affections', authenticateToken, async (req, res) => {
  try {
    const { search, limit = 20 } = req.query;
    
    if (!search || search.trim().length < 2) {
      return res.json({
        success: true,
        affections: []
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT TOP ${parseInt(limit)}
        COD_AFF as code,
        LIB_AFF as libelle,
        NCP_AFF as ncp,
        SEX_AFF as sexe,
        ETA_AFF as etat
      FROM [metier].[AFFECTION]
      WHERE LIB_AFF LIKE @search OR COD_AFF LIKE @search
      ORDER BY LIB_AFF
    `;
    
    const result = await pool.request()
      .input('search', sql.VarChar, `%${search}%`)
      .query(query);
    
    return res.json({
      success: true,
      affections: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Erreur recherche affections:', error);
    return res.json({
      success: true,
      affections: []
    });
  }
});

// Recherche de médicaments
app.get('/api/consultations/medicaments', authenticateToken, async (req, res) => {
  try {
    const { search, limit = 20 } = req.query;
    
    if (!search || search.trim().length < 2) {
      return res.json({
        success: true,
        medicaments: []
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT TOP ${parseInt(limit)}
        COD_MED as id,
        NOM_COMMERCIAL as nom_commercial,
        NOM_GENERIQUE as nom_generique,
        FORME_PHARMACEUTIQUE as forme,
        DOSAGE as dosage,
        PRIX_UNITAIRE as prix,
        REMBOURSABLE as remboursable,
        CONDITIONNEMENT as conditionnement,
        'medicament' as type,
        NOM_COMMERCIAL as libelle,
        NOM_COMMERCIAL + ' - ' + FORME_PHARMACEUTIQUE + ' ' + ISNULL(DOSAGE, '') as libelle_complet
      FROM [metier].[MEDICAMENT]
      WHERE NOM_COMMERCIAL LIKE @search OR NOM_GENERIQUE LIKE @search
      ORDER BY NOM_COMMERCIAL
    `;
    
    const result = await pool.request()
      .input('search', sql.VarChar, `%${search}%`)
      .query(query);
    
    return res.json({
      success: true,
      medicaments: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Erreur recherche médicaments:', error);
    return res.json({
      success: true,
      medicaments: []
    });
  }
});

// Création d'une consultation
app.post('/api/consultations/create', authenticateToken, async (req, res) => {
  console.log('🚀 Début création consultation');
  
  let pool;
  try {
    // Utiliser extractField pour extraire tous les champs
    const COD_BEN = extractField(req.body, 'COD_BEN');
    const COD_PRE = extractField(req.body, 'COD_PRE');
    const TYPE_CONSULTATION = extractField(req.body, 'TYPE_CONSULTATION');
    const MONTANT_CONSULTATION = extractField(req.body, 'MONTANT_CONSULTATION', 0);
    const STATUT_PAIEMENT = extractField(req.body, 'STATUT_PAIEMENT', 'À payer');
    const COD_CEN = extractField(req.body, 'COD_CEN', null);
    const DATE_CONSULTATION = extractField(req.body, 'DATE_CONSULTATION', new Date());
    const MONTANT_PRISE_EN_CHARGE = extractField(req.body, 'MONTANT_PRISE_EN_CHARGE', 0);
    const RESTE_A_CHARGE = extractField(req.body, 'RESTE_A_CHARGE', 0);
    const TAUX_PRISE_EN_CHARGE = extractField(req.body, 'TAUX_PRISE_EN_CHARGE', 0);
    const MOTIF_CONSULTATION = extractField(req.body, 'MOTIF_CONSULTATION', '');
    const DIAGNOSTIC = extractField(req.body, 'DIAGNOSTIC', '');
    const OBSERVATIONS = extractField(req.body, 'OBSERVATIONS', '');
    const TRAITEMENT_PRESCRIT = extractField(req.body, 'TRAITEMENT_PRESCRIT', '');
    const EXAMENS_COMPLEMENTAIRES = extractField(req.body, 'EXAMENS_COMPLEMENTAIRES', '');
    const PROCHAIN_RDV = extractField(req.body, 'PROCHAIN_RDV', null);
    const URGENT = extractField(req.body, 'URGENT', false);
    const HOSPITALISATION = extractField(req.body, 'HOSPITALISATION', false);
    
    console.log('✅ Champs consultation extraits:', {
      COD_BEN,
      COD_PRE,
      TYPE_CONSULTATION,
      MONTANT_CONSULTATION,
      STATUT_PAIEMENT
    });
    
    const missingFields = [];
    if (!COD_BEN) missingFields.push('COD_BEN');
    if (!COD_PRE) missingFields.push('COD_PRE');
    if (!TYPE_CONSULTATION) missingFields.push('TYPE_CONSULTATION');
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs obligatoires manquants: ${missingFields.join(', ')}`,
        receivedKeys: Object.keys(req.body || {})
      });
    }
    
    try {
      pool = await dbConfig.getConnection();
    } catch (dbError) {
      console.error('❌ Erreur connexion DB:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Impossible de se connecter à la base de données'
      });
    }
    
    // Vérifier le patient
    const patientCheck = await pool.request()
      .input('COD_BEN', sql.Int, COD_BEN)
      .query(`
        SELECT ID_BEN, NOM_BEN, PRE_BEN, COD_PAI 
        FROM [core].[BENEFICIAIRE] 
        WHERE ID_BEN = @COD_BEN AND RETRAIT_DATE IS NULL
      `);
    
    if (patientCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé ou retiré du système'
      });
    }
    
    const patient = patientCheck.recordset[0];
    
    // Vérifier le médecin
    const medecinCheck = await pool.request()
      .input('COD_PRE', sql.Int, COD_PRE)
      .query(`
        SELECT COD_PRE, NOM_PRESTATAIRE, PRENOM_PRESTATAIRE 
        FROM [core].[PRESTATAIRE] 
        WHERE COD_PRE = @COD_PRE AND ACTIF = 1
      `);
    
    if (medecinCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Médecin non trouvé ou inactif'
      });
    }
    
    const medecin = medecinCheck.recordset[0];
    
    // Calculer les montants
    let tauxFinal = TAUX_PRISE_EN_CHARGE;
    let montantPriseEnChargeFinal = MONTANT_PRISE_EN_CHARGE;
    let resteChargeFinal = RESTE_A_CHARGE;
    
    if (tauxFinal === 0 && patient.COD_PAI) {
      try {
        const typePaiementQuery = await pool.request()
          .input('COD_PAI', sql.Int, patient.COD_PAI)
          .query('SELECT TAUX_COUVERTURE FROM [ref].[TYPE_PAIEMENT] WHERE COD_PAI = @COD_PAI');
        
        if (typePaiementQuery.recordset.length > 0) {
          tauxFinal = typePaiementQuery.recordset[0].TAUX_COUVERTURE || 0;
        }
      } catch (error) {
        console.warn('⚠️ Impossible de récupérer le taux de couverture:', error.message);
      }
    }
    
    // Calculer les montants
    if (montantPriseEnChargeFinal === 0 && tauxFinal > 0 && MONTANT_CONSULTATION > 0) {
      montantPriseEnChargeFinal = (MONTANT_CONSULTATION * tauxFinal) / 100;
      resteChargeFinal = MONTANT_CONSULTATION - montantPriseEnChargeFinal;
    }
    
    // Requête d'insertion
    const query = `
      INSERT INTO [core].[CONSULTATION] (
        COD_BEN, COD_CEN, COD_PRE, DATE_CONSULTATION, TYPE_CONSULTATION,
        MOTIF_CONSULTATION, OBSERVATIONS, DIAGNOSTIC,
        EXAMENS_COMPLEMENTAIRES, TRAITEMENT_PRESCRIT, PROCHAIN_RDV,
        MONTANT_CONSULTATION, STATUT_PAIEMENT, URGENT, HOSPITALISATION,
        MONTANT_PRISE_EN_CHARGE, RESTE_A_CHARGE, TAUX_PRISE_EN_CHARGE,
        COD_CREUTIL, DAT_CREUTIL, COD_MODUTIL, DAT_MODUTIL
      )
      OUTPUT INSERTED.COD_CONS
      VALUES (
        @COD_BEN, @COD_CEN, @COD_PRE, @DATE_CONSULTATION, @TYPE_CONSULTATION,
        @MOTIF_CONSULTATION, @OBSERVATIONS, @DIAGNOSTIC,
        @EXAMENS_COMPLEMENTAIRES, @TRAITEMENT_PRESCRIT, @PROCHAIN_RDV,
        @MONTANT_CONSULTATION, @STATUT_PAIEMENT, @URGENT, @HOSPITALISATION,
        @MONTANT_PRISE_EN_CHARGE, @RESTE_A_CHARGE, @TAUX_PRISE_EN_CHARGE,
        @COD_CREUTIL, GETDATE(), @COD_CREUTIL, GETDATE()
      )
    `;
    
    const request = pool.request()
      .input('COD_BEN', sql.Int, COD_BEN)
      .input('COD_CEN', sql.Int, COD_CEN)
      .input('COD_PRE', sql.Int, COD_PRE)
      .input('DATE_CONSULTATION', sql.DateTime, DATE_CONSULTATION)
      .input('TYPE_CONSULTATION', sql.VarChar(30), TYPE_CONSULTATION)
      .input('MOTIF_CONSULTATION', sql.VarChar(500), MOTIF_CONSULTATION)
      .input('OBSERVATIONS', sql.VarChar(1000), OBSERVATIONS)
      .input('DIAGNOSTIC', sql.VarChar(500), DIAGNOSTIC)
      .input('EXAMENS_COMPLEMENTAIRES', sql.VarChar(500), EXAMENS_COMPLEMENTAIRES)
      .input('TRAITEMENT_PRESCRIT', sql.VarChar(1000), TRAITEMENT_PRESCRIT)
      .input('PROCHAIN_RDV', sql.Date, PROCHAIN_RDV)
      .input('MONTANT_CONSULTATION', sql.Decimal(12,2), MONTANT_CONSULTATION)
      .input('STATUT_PAIEMENT', sql.VarChar(20), STATUT_PAIEMENT)
      .input('URGENT', sql.Bit, URGENT ? 1 : 0)
      .input('HOSPITALISATION', sql.Bit, HOSPITALISATION ? 1 : 0)
      .input('MONTANT_PRISE_EN_CHARGE', sql.Decimal(12,2), montantPriseEnChargeFinal)
      .input('RESTE_A_CHARGE', sql.Decimal(12,2), resteChargeFinal)
      .input('TAUX_PRISE_EN_CHARGE', sql.Decimal(5,2), tauxFinal)
      .input('COD_CREUTIL', sql.VarChar(16), req.user?.username || 'SYSTEM');
    
    const result = await request.query(query);
    
    if (!result.recordset || result.recordset.length === 0) {
      throw new Error('Aucun ID de consultation retourné');
    }
    
    const consultationId = result.recordset[0].COD_CONS;
    
    // Journaliser l'action
    try {
      await pool.request()
        .input('type', sql.VarChar, 'CREATE')
        .input('table', sql.VarChar, 'CONSULTATION')
        .input('id', sql.VarChar, consultationId.toString())
        .input('utilisateur', sql.VarChar, req.user?.username || 'SYSTEM')
        .input('description', sql.VarChar, `Nouvelle consultation créée pour patient ${COD_BEN}`)
        .query(`
          INSERT INTO [audit].[SYSTEM_AUDIT] 
            (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION, DATE_AUDIT)
          VALUES 
            (@type, @table, @id, @utilisateur, @description, GETDATE())
        `);
    } catch (auditError) {
      console.warn('⚠️ Erreur journalisation:', auditError.message);
    }
    
    return res.status(201).json({
      success: true,
      message: 'Consultation créée avec succès',
      consultationId: consultationId,
      details: {
        patient: `${patient.NOM_BEN} ${patient.PRE_BEN}`,
        medecin: `${medecin.NOM_PRESTATAIRE} ${medecin.PRENOM_PRESTATAIRE}`,
        type: TYPE_CONSULTATION,
        montant: MONTANT_CONSULTATION,
        priseEnCharge: montantPriseEnChargeFinal,
        resteCharge: resteChargeFinal,
        tauxCouverture: tauxFinal,
        statut: STATUT_PAIEMENT
      }
    });
    
  } catch (error) {
    console.error('❌ ERREUR création consultation:', error.message);
    
    let statusCode = 500;
    let errorMessage = 'Erreur lors de la création de la consultation';
    
    if (error.message.includes('foreign key constraint')) {
      errorMessage = 'Référence invalide (patient, médecin ou centre inexistant)';
      statusCode = 400;
    } else if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      errorMessage = 'Violation de clé primaire';
      statusCode = 400;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ==============================================
// ROUTES DES PRESCRIPTIONS - ORGANISÉES CORRECTEMENT
// ==============================================

// 1. GET /api/prescriptions - Liste des prescriptions
app.get('/api/prescriptions', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      statut = '',
      type_prestation = '',
      date_debut = null,
      date_fin = null 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pool = await dbConfig.getConnection();
    
    let whereClauses = ['1=1'];
    const inputs = [];
    
    if (search) {
      whereClauses.push(`(
        p.NUM_PRESCRIPTION LIKE '%' + @search + '%' OR
        b.NOM_BEN LIKE '%' + @search + '%' OR
        b.PRE_BEN LIKE '%' + @search + '%' OR
        b.IDENTIFIANT_NATIONAL LIKE '%' + @search + '%'
      )`);
      inputs.push({ name: 'search', type: sql.VarChar, value: search });
    }
    
    if (statut) {
      whereClauses.push('p.STATUT = @statut');
      inputs.push({ name: 'statut', type: sql.VarChar, value: statut });
    }
    
    if (type_prestation) {
      whereClauses.push('p.TYPE_PRESTATION = @type_prestation');
      inputs.push({ name: 'type_prestation', type: sql.VarChar, value: type_prestation });
    }
    
    if (date_debut) {
      whereClauses.push('CAST(p.DATE_PRESCRIPTION AS DATE) >= @date_debut');
      inputs.push({ name: 'date_debut', type: sql.Date, value: new Date(date_debut) });
    }
    
    if (date_fin) {
      whereClauses.push('CAST(p.DATE_PRESCRIPTION AS DATE) <= @date_fin');
      inputs.push({ name: 'date_fin', type: sql.Date, value: new Date(date_fin) });
    }
    
    const whereSql = whereClauses.join(' AND ');
    
    // Requête pour les données
    const query = `
      SELECT 
        p.COD_PRES,
        p.NUM_PRESCRIPTION,
        p.DATE_PRESCRIPTION,
        p.TYPE_PRESTATION,
        p.COD_AFF,
        a.LIB_AFF,
        p.STATUT,
        p.ORIGINE,
        p.MONTANT_TOTAL,
        b.ID_BEN,
        b.NOM_BEN,
        b.PRE_BEN,
        b.SEX_BEN,
        b.NAI_BEN,
        dbo.fCalculAge(b.NAI_BEN, GETDATE()) AS AGE,
        b.IDENTIFIANT_NATIONAL,
        b.TELEPHONE_MOBILE,
        pr.NOM_PRESTATAIRE,
        pr.PRENOM_PRESTATAIRE,
        pr.SPECIALITE,
        cs.NOM_CENTRE
      FROM [metier].[PRESCRIPTION] p
      INNER JOIN [core].[BENEFICIAIRE] b ON p.COD_BEN = b.ID_BEN
      LEFT JOIN [core].[PRESTATAIRE] pr ON p.COD_PRE = pr.COD_PRE
      LEFT JOIN [core].[CENTRE_SANTE] cs ON p.COD_CEN = cs.COD_CEN
      LEFT JOIN [metier].[AFFECTION] a ON p.COD_AFF = a.COD_AFF
      WHERE ${whereSql}
      ORDER BY p.DATE_PRESCRIPTION DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `;
    
    // Requête pour le total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM [metier].[PRESCRIPTION] p
      INNER JOIN [core].[BENEFICIAIRE] b ON p.COD_BEN = b.ID_BEN
      WHERE ${whereSql}
    `;
    
    let request = pool.request();
    inputs.forEach(input => {
      request.input(input.name, input.type, input.value);
    });
    
    const [result, countResult] = await Promise.all([
      request.query(query),
      request.query(countQuery)
    ]);
    
    const total = countResult.recordset[0].total;
    const totalPages = Math.ceil(total / parseInt(limit));
    
    return res.json({
      success: true,
      prescriptions: result.recordset,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération prescriptions:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des prescriptions'
    });
  }
});

// 2. GET /api/prescriptions/:id - Détails d'une prescription
app.get('/api/prescriptions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📋 Récupération prescription ${id} avec détails`);
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de prescription invalide'
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT 
        p.*,
        b.NOM_BEN,
        b.PRE_BEN,
        b.SEX_BEN,
        b.NAI_BEN,
        dbo.fCalculAge(b.NAI_BEN, GETDATE()) AS AGE,
        b.IDENTIFIANT_NATIONAL,
        b.TELEPHONE_MOBILE,
        pr.NOM_PRESTATAIRE,
        pr.PRENOM_PRESTATAIRE,
        pr.SPECIALITE,
        cs.NOM_CENTRE,
        a.LIB_AFF
      FROM [metier].[PRESCRIPTION] p
      INNER JOIN [core].[BENEFICIAIRE] b ON p.COD_BEN = b.ID_BEN
      LEFT JOIN [core].[PRESTATAIRE] pr ON p.COD_PRE = pr.COD_PRE
      LEFT JOIN [core].[CENTRE_SANTE] cs ON p.COD_CEN = cs.COD_CEN
      LEFT JOIN [metier].[AFFECTION] a ON p.COD_AFF = a.COD_AFF
      WHERE p.COD_PRES = @id
    `;
    
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription non trouvée'
      });
    }
    
    // Récupérer les détails
    const detailsQuery = `
      SELECT 
        COD_PRES_DET,
        COD_PRES,
        TYPE_ELEMENT,
        COD_ELEMENT,
        LIBELLE,
        QUANTITE,
        POSOLOGIE,
        DUREE_TRAITEMENT,
        UNITE,
        PRIX_UNITAIRE,
        MONTANT_TOTAL,
        REMBOURSABLE,
        TAUX_PRISE_EN_CHARGE,
        STATUT_EXECUTION,
        QUANTITE_EXECUTEE,
        DATE_EXECUTION,
        COD_EXECUTANT,
        ORDRE
      FROM [metier].[PRESCRIPTION_DETAIL]
      WHERE COD_PRES = @id
      ORDER BY ORDRE
    `;
    
    const detailsResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(detailsQuery);
    
    const prescription = result.recordset[0];
    prescription.details = detailsResult.recordset;
    
    console.log(`📋 Prescription ${id} trouvée avec ${detailsResult.recordset.length} détails`);
    console.log('📋 Structure des détails:', detailsResult.recordset.map(d => ({
      COD_PRES_DET: d.COD_PRES_DET,
      LIBELLE: d.LIBELLE,
      QUANTITE: d.QUANTITE,
      PRIX_UNITAIRE: d.PRIX_UNITAIRE
    })));
    
    return res.json({
      success: true,
      prescription: prescription
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération prescription:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// 3. GET /api/prescriptions/numero/:numero - Recherche par numéro
app.get('/api/prescriptions/numero/:numero', authenticateToken, async (req, res) => {
  try {
    const { numero } = req.params;
    
    if (!numero) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de prescription requis'
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT 
        p.*,
        b.NOM_BEN,
        b.PRE_BEN,
        b.SEX_BEN,
        b.NAI_BEN,
        dbo.fCalculAge(b.NAI_BEN, GETDATE()) AS AGE,
        b.IDENTIFIANT_NATIONAL,
        b.TELEPHONE_MOBILE,
        pr.NOM_PRESTATAIRE,
        pr.PRENOM_PRESTATAIRE,
        pr.SPECIALITE,
        cs.NOM_CENTRE,
        a.LIB_AFF
      FROM [metier].[PRESCRIPTION] p
      INNER JOIN [core].[BENEFICIAIRE] b ON p.COD_BEN = b.ID_BEN
      LEFT JOIN [core].[PRESTATAIRE] pr ON p.COD_PRE = pr.COD_PRE
      LEFT JOIN [core].[CENTRE_SANTE] cs ON p.COD_CEN = cs.COD_CEN
      LEFT JOIN [metier].[AFFECTION] a ON p.COD_AFF = a.COD_AFF
      WHERE p.NUM_PRESCRIPTION = @numero
    `;
    
    const result = await pool.request()
      .input('numero', sql.VarChar, numero)
      .query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription non trouvée'
      });
    }
    
    const prescription = result.recordset[0];
    
    // Récupérer les détails
    const detailsQuery = `
      SELECT *
      FROM [metier].[PRESCRIPTION_DETAIL]
      WHERE COD_PRES = @id
      ORDER BY ORDRE
    `;
    
    const detailsResult = await pool.request()
      .input('id', sql.Int, prescription.COD_PRES)
      .query(detailsQuery);
    
    prescription.details = detailsResult.recordset;
    
    return res.json({
      success: true,
      prescription: prescription
    });
    
  } catch (error) {
    console.error('❌ Erreur recherche prescription:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// 4. POST /api/prescriptions - Créer une prescription
app.post('/api/prescriptions', authenticateToken, async (req, res) => {
  let pool;
  let transaction;
  
  try {
    console.log('📥 Données reçues:', JSON.stringify(req.body, null, 2));
    
    // Utiliser la fonction extractField pour extraire tous les champs
    const COD_BEN = extractField(req.body, 'COD_BEN');
    const COD_PRE = extractField(req.body, 'COD_PRE', null);
    const COD_CEN = extractField(req.body, 'COD_CEN', null);
    const TYPE_PRESTATION = extractField(req.body, 'TYPE_PRESTATION');
    const COD_AFF = extractField(req.body, 'COD_AFF', 'NSP');
    const OBSERVATIONS = extractField(req.body, 'OBSERVATIONS', '');
    const ORIGINE = extractField(req.body, 'ORIGINE', 'Electronique');
    const DATE_VALIDITE = extractField(req.body, 'DATE_VALIDITE', null);
    const details = extractField(req.body, 'details', []) || extractField(req.body, 'DETAILS', []);
    
    console.log('✅ Champs extraits avec extractField:', {
      COD_BEN,
      COD_PRE,
      COD_CEN,
      TYPE_PRESTATION,
      COD_AFF,
      OBSERVATIONS: OBSERVATIONS.substring(0, 50) + '...',
      ORIGINE,
      DATE_VALIDITE,
      detailsCount: Array.isArray(details) ? details.length : 0
    });
    
    // Validation des champs requis
    if (!COD_BEN || !TYPE_PRESTATION) {
      const missingFields = [];
      if (!COD_BEN) missingFields.push('COD_BEN');
      if (!TYPE_PRESTATION) missingFields.push('TYPE_PRESTATION');
      
      return res.status(400).json({
        success: false,
        message: `Champs obligatoires manquants: ${missingFields.join(', ')}`,
        hint: 'Vérifiez que les noms des champs sont corrects (majuscules/minuscules)',
        receivedKeys: Object.keys(req.body || {}),
        extractedValues: {
          COD_BEN,
          TYPE_PRESTATION,
          COD_AFF
        }
      });
    }
    
    if (!details || !Array.isArray(details) || details.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un détail de prescription est requis',
        detailsReceived: details
      });
    }
    
    pool = await dbConfig.getConnection();
    transaction = new sql.Transaction(pool);
    
    // Démarrer la transaction
    await transaction.begin();
    
    // Vérifier que le patient existe
    const patientCheck = await new sql.Request(transaction)
      .input('COD_BEN', sql.Int, COD_BEN)
      .query('SELECT ID_BEN, NOM_BEN, PRE_BEN FROM [core].[BENEFICIAIRE] WHERE ID_BEN = @COD_BEN AND RETRAIT_DATE IS NULL');
    
    if (patientCheck.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé ou retiré'
      });
    }
    
    // Vérifier que l'affection existe
    let COD_AFF_Value = 'NSP';
    let affectionLibelle = null;

    // Si COD_AFF est fourni, vérifier qu'il existe
    if (COD_AFF) {
      // Vérifier que l'affection existe
      const affectionCheck = await new sql.Request(transaction)
        .input('COD_AFF', sql.VarChar, COD_AFF)
        .query('SELECT COD_AFF, LIB_AFF FROM [metier].[AFFECTION] WHERE COD_AFF = @COD_AFF');
      
      if (affectionCheck.recordset.length === 0) {
        // Si l'affection par défaut n'existe pas, la créer
        await new sql.Request(transaction)
          .input('COD_AFF', sql.VarChar, 'NSP')
          .input('LIB_AFF', sql.VarChar, 'Non Spécifié')
          .input('NCP_AFF', sql.VarChar, '')
          .input('SEX_AFF', sql.VarChar, '')
          .input('ETA_AFF', sql.VarChar, '')
          .query(`
            INSERT INTO [metier].[AFFECTION] (COD_AFF, LIB_AFF, NCP_AFF, SEX_AFF, ETA_AFF)
            VALUES (@COD_AFF, @LIB_AFF, @NCP_AFF, @SEX_AFF, @ETA_AFF)
          `);
      }
    }

    // Vérifier le médecin si fourni
    if (COD_PRE) {
      const medecinCheck = await new sql.Request(transaction)
        .input('COD_PRE', sql.Int, COD_PRE)
        .query('SELECT COD_PRE, NOM_PRESTATAIRE FROM [core].[PRESTATAIRE] WHERE COD_PRE = @COD_PRE AND ACTIF = 1');
      
      if (medecinCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Médecin non trouvé ou inactif'
        });
      }
    }
    
    // Vérifier le centre si fourni
    if (COD_CEN) {
      const centreCheck = await new sql.Request(transaction)
        .input('COD_CEN', sql.Int, COD_CEN)
        .query('SELECT COD_CEN, NOM_CENTRE FROM [core].[CENTRE_SANTE] WHERE COD_CEN = @COD_CEN AND ACTIF = 1');
      
      if (centreCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Centre de santé non trouvé ou inactif'
        });
      }
    }
    
    // Calculer le montant total
    const montantTotal = details.reduce((sum, detail) => {
      const quantite = extractField(detail, 'QUANTITE', 1);
      const prixUnitaire = extractField(detail, 'PRIX_UNITAIRE', 0);
      return sum + (quantite * prixUnitaire);
    }, 0);
    
    // Générer le numéro de prescription
    const currentYear = new Date().getFullYear();
    
    const seqQuery = await new sql.Request(transaction)
      .query(`
        SELECT ISNULL(MAX(
          CAST(
            CASE 
              WHEN NUM_PRESCRIPTION LIKE 'PRES-${currentYear}-%' 
              THEN SUBSTRING(NUM_PRESCRIPTION, 11, LEN(NUM_PRESCRIPTION)) 
            END 
            AS INT
          )
        ), 0) + 1 as nextNum 
        FROM [metier].[PRESCRIPTION] WITH (TABLOCKX, HOLDLOCK)
        WHERE NUM_PRESCRIPTION LIKE 'PRES-${currentYear}-%'
      `);
    
    const nextNum = seqQuery.recordset[0].nextNum;
    const NUM_PRESCRIPTION = `PRES-${currentYear}-${nextNum.toString().padStart(5, '0')}`;
    
    console.log('📄 Numéro de prescription généré:', NUM_PRESCRIPTION);
    
    // Créer la prescription
    const prescriptionQuery = `
      INSERT INTO [metier].[PRESCRIPTION] (
        NUM_PRESCRIPTION, COD_BEN, COD_PRE, COD_CEN, DATE_PRESCRIPTION,
        TYPE_PRESTATION, COD_AFF, OBSERVATIONS, STATUT, ORIGINE,
        DATE_VALIDITE, MONTANT_TOTAL, COD_CREUTIL, DAT_CREUTIL, COD_MODUTIL, DAT_MODUTIL
      )
      OUTPUT INSERTED.COD_PRES
      VALUES (
        @NUM_PRESCRIPTION, @COD_BEN, @COD_PRE, @COD_CEN, GETDATE(),
        @TYPE_PRESTATION, @COD_AFF, @OBSERVATIONS, 'En attente', @ORIGINE,
        @DATE_VALIDITE, @MONTANT_TOTAL, @COD_CREUTIL, GETDATE(), @COD_CREUTIL, GETDATE()
      )
    `;
    
    const prescriptionResult = await new sql.Request(transaction)
      .input('NUM_PRESCRIPTION', sql.VarChar, NUM_PRESCRIPTION)
      .input('COD_BEN', sql.Int, COD_BEN)
      .input('COD_PRE', sql.Int, COD_PRE)
      .input('COD_CEN', sql.Int, COD_CEN)
      .input('TYPE_PRESTATION', sql.VarChar, TYPE_PRESTATION)
      .input('COD_AFF', sql.VarChar, COD_AFF_Value) // Utiliser la valeur nullable
      .input('OBSERVATIONS', sql.VarChar, OBSERVATIONS)
      .input('ORIGINE', sql.VarChar, ORIGINE)
      .input('DATE_VALIDITE', sql.Date, DATE_VALIDITE)
      .input('MONTANT_TOTAL', sql.Decimal(12, 2), montantTotal)
      .input('COD_CREUTIL', sql.VarChar, req.user?.username || 'SYSTEM')
      .query(prescriptionQuery);
    
    const COD_PRES = prescriptionResult.recordset[0].COD_PRES;
    
    // Ajouter les détails
    for (const [index, detail] of details.entries()) {
      const TYPE_ELEMENT = extractField(detail, 'TYPE_ELEMENT', 'medicament');
      
      // CORRECTION : Gestion robuste de COD_ELEMENT
      let COD_ELEMENT = extractField(detail, 'COD_ELEMENT', '');
      
      // Assurer que COD_ELEMENT est une chaîne
      if (COD_ELEMENT !== null && COD_ELEMENT !== undefined) {
        COD_ELEMENT = String(COD_ELEMENT);
      } else {
        COD_ELEMENT = '';
      }
      
      // Si COD_ELEMENT est vide, utiliser un code générique
      if (!COD_ELEMENT || COD_ELEMENT.trim() === '') {
        if (TYPE_ELEMENT === 'medicament') {
          COD_ELEMENT = `MED-${Date.now()}-${index}`;
        } else {
          COD_ELEMENT = `ACT-${Date.now()}-${index}`;
        }
      }
      
      const LIBELLE = extractField(detail, 'LIBELLE', '');
      const QUANTITE = extractField(detail, 'QUANTITE', 1);
      const POSOLOGIE = extractField(detail, 'POSOLOGIE', '');
      const DUREE_TRAITEMENT = extractField(detail, 'DUREE_TRAITEMENT', null);
      const UNITE = extractField(detail, 'UNITE', 'unité');
      const PRIX_UNITAIRE = extractField(detail, 'PRIX_UNITAIRE', 0);
      const REMBOURSABLE = extractField(detail, 'REMBOURSABLE', 1);
      const TAUX_PRISE_EN_CHARGE = extractField(detail, 'TAUX_PRISE_EN_CHARGE', 80);
      
      const montantTotalDetail = QUANTITE * PRIX_UNITAIRE;
      
      const detailQuery = `
        INSERT INTO [metier].[PRESCRIPTION_DETAIL] (
          COD_PRES, TYPE_ELEMENT, COD_ELEMENT, LIBELLE, QUANTITE,
          POSOLOGIE, DUREE_TRAITEMENT, UNITE, PRIX_UNITAIRE, MONTANT_TOTAL,
          REMBOURSABLE, TAUX_PRISE_EN_CHARGE, STATUT_EXECUTION, ORDRE,
          COD_CREUTIL, DAT_CREUTIL, COD_MODUTIL, DAT_MODUTIL
        )
        VALUES (
          @COD_PRES, @TYPE_ELEMENT, @COD_ELEMENT, @LIBELLE, @QUANTITE,
          @POSOLOGIE, @DUREE_TRAITEMENT, @UNITE, @PRIX_UNITAIRE, @MONTANT_TOTAL_DETAIL,
          @REMBOURSABLE, @TAUX_PRISE_EN_CHARGE, 'A executer', @ORDRE,
          @COD_CREUTIL, GETDATE(), @COD_CREUTIL, GETDATE()
        )
      `;
      
      await new sql.Request(transaction)
        .input('COD_PRES', sql.Int, COD_PRES)
        .input('TYPE_ELEMENT', sql.VarChar, TYPE_ELEMENT)
        .input('COD_ELEMENT', sql.VarChar, COD_ELEMENT)
        .input('LIBELLE', sql.VarChar, LIBELLE)
        .input('QUANTITE', sql.Decimal(10, 2), QUANTITE)
        .input('POSOLOGIE', sql.VarChar, POSOLOGIE)
        .input('DUREE_TRAITEMENT', sql.Int, DUREE_TRAITEMENT)
        .input('UNITE', sql.VarChar, UNITE)
        .input('PRIX_UNITAIRE', sql.Decimal(12, 2), PRIX_UNITAIRE)
        .input('MONTANT_TOTAL_DETAIL', sql.Decimal(12, 2), montantTotalDetail)
        .input('REMBOURSABLE', sql.Bit, REMBOURSABLE)
        .input('TAUX_PRISE_EN_CHARGE', sql.Decimal(5, 2), TAUX_PRISE_EN_CHARGE)
        .input('ORDRE', sql.Int, index + 1)
        .input('COD_CREUTIL', sql.VarChar, req.user?.username || 'SYSTEM')
        .query(detailQuery);
    }
    
    // Valider la transaction
    await transaction.commit();
    
    // Journaliser l'action
    try {
      const logPool = await dbConfig.getConnection();
      await logPool.request()
        .input('type', sql.VarChar, 'CREATE')
        .input('table', sql.VarChar, 'PRESCRIPTION')
        .input('id', sql.VarChar, COD_PRES.toString())
        .input('utilisateur', sql.VarChar, req.user?.username || 'SYSTEM')
        .input('description', sql.VarChar, `Nouvelle prescription créée ${NUM_PRESCRIPTION}`)
        .query(`
          INSERT INTO [audit].[SYSTEM_AUDIT] 
          (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION, DATE_AUDIT)
          VALUES (@type, @table, @id, @utilisateur, @description, GETDATE())
        `);
    } catch (auditError) {
      console.warn('⚠️ Erreur journalisation:', auditError.message);
    }
    
    return res.status(201).json({
      success: true,
      message: 'Prescription créée avec succès',
      prescriptionId: COD_PRES,
      numero: NUM_PRESCRIPTION,
      montantTotal: montantTotal,
      details: {
        patientId: COD_BEN,
        patientName: patientCheck.recordset[0].NOM_BEN + ' ' + patientCheck.recordset[0].PRE_BEN,
        affection: affectionLibelle, // Peut être null
        nombreDetails: details.length
      }
    });
    
  } catch (error) {
    // Rollback en cas d'erreur
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('❌ Erreur lors du rollback:', rollbackError);
      }
    }
    
    console.error('❌ Erreur création prescription:', error);
    
    let errorMessage = 'Erreur lors de la création de la prescription';
    let statusCode = 500;
    
    if (error.message.includes('Violation of UNIQUE KEY constraint')) {
      errorMessage = 'Numéro de prescription déjà existant. Veuillez réessayer.';
      statusCode = 409;
    } else if (error.message.includes('foreign key constraint')) {
      errorMessage = 'Référence invalide (patient, médecin ou centre inexistant)';
      statusCode = 400;
    } else if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      errorMessage = 'Violation de clé primaire';
      statusCode = 400;
    } else if (error.message.includes('COD_ELEMENT')) {
      errorMessage = 'Code d\'élément invalide dans la prescription';
      statusCode = 400;
    } else if (error.message.includes('EDUPEPARAM')) {
      errorMessage = 'Erreur interne de paramètres de requête (doublon de paramètre). Contactez l\'administrateur.';
      statusCode = 500;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 5. PUT /api/prescriptions/:id/status - Mettre à jour le statut d'une prescription
app.put('/api/prescriptions/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, raison } = req.body;
    
    console.log(`📝 Mise à jour statut prescription ${id}:`, { statut, raison });
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de prescription invalide'
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    // Vérifier que la prescription existe
    const prescriptionCheck = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT COD_PRES, STATUT FROM [metier].[PRESCRIPTION] WHERE COD_PRES = @id');
    
    if (prescriptionCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription non trouvée'
      });
    }
    
    const prescription = prescriptionCheck.recordset[0];
    
    // Mettre à jour le statut
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('statut', sql.VarChar, statut)
      .input('observations', sql.VarChar, raison ? `Statut changé: ${statut}. Raison: ${raison}` : `Statut changé: ${statut}`)
      .input('cod_modutil', sql.VarChar, req.user?.username || 'SYSTEM')
      .query(`
        UPDATE [metier].[PRESCRIPTION]
        SET 
          STATUT = @statut,
          OBSERVATIONS = CONCAT(OBSERVATIONS, ' | ', @observations),
          COD_MODUTIL = @cod_modutil,
          DAT_MODUTIL = GETDATE()
        WHERE COD_PRES = @id
      `);
    
    // Journaliser l'action
    try {
      await pool.request()
        .input('type', sql.VarChar, 'UPDATE_STATUS')
        .input('table', sql.VarChar, 'PRESCRIPTION')
        .input('id', sql.VarChar, id)
        .input('utilisateur', sql.VarChar, req.user?.username || 'SYSTEM')
        .input('description', sql.VarChar, `Statut prescription ${id} changé en ${statut}`)
        .query(`
          INSERT INTO [audit].[SYSTEM_AUDIT] 
          (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION, DATE_AUDIT)
          VALUES (@type, @table, @id, @utilisateur, @description, GETDATE())
        `);
    } catch (auditError) {
      console.warn('⚠️ Erreur journalisation:', auditError.message);
    }
    
    console.log(`✅ Statut prescription ${id} mis à jour en ${statut}`);
    
    return res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      prescriptionId: id,
      nouveauStatut: statut
    });
    
  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
});

// 6. PUT /api/prescriptions/:id/details - Mettre à jour les détails d'une prescription
app.put('/api/prescriptions/:id/details', authenticateToken, async (req, res) => {
  let pool;
  let transaction;
  
  try {
    const { id } = req.params;
    const { details, AVEC_DETAILS } = req.body;
    
    console.log(`📝 Mise à jour détails prescription ${id}:`, { 
      nbDetails: details?.length || 0,
      AVEC_DETAILS 
    });
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de prescription invalide'
      });
    }
    
    pool = await dbConfig.getConnection();
    transaction = new sql.Transaction(pool);
    
    await transaction.begin();
    
    // Vérifier que la prescription existe
    const prescriptionCheck = await new sql.Request(transaction)
      .input('id', sql.Int, parseInt(id))
      .query('SELECT COD_PRES, STATUT FROM [metier].[PRESCRIPTION] WHERE COD_PRES = @id');
    
    if (prescriptionCheck.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Prescription non trouvée'
      });
    }
    
    // Supprimer les anciens détails
    await new sql.Request(transaction)
      .input('cod_pres', sql.Int, parseInt(id))
      .query('DELETE FROM [metier].[PRESCRIPTION_DETAIL] WHERE COD_PRES = @cod_pres');
    
    let montantTotal = 0;
    
    // Ajouter les nouveaux détails
    if (details && Array.isArray(details) && details.length > 0) {
      for (const [index, detail] of details.entries()) {
        const TYPE_ELEMENT = detail.TYPE_ELEMENT || 'MEDICAMENT';
        const COD_ELEMENT = detail.COD_ELEMENT || '';
        const LIBELLE = detail.LIBELLE || '';
        const QUANTITE = parseFloat(detail.QUANTITE) || 1;
        const POSOLOGIE = detail.POSOLOGIE || '';
        const DUREE_TRAITEMENT = detail.DUREE_TRAITEMENT ? parseInt(detail.DUREE_TRAITEMENT) : null;
        const UNITE = detail.UNITE || 'unité';
        const PRIX_UNITAIRE = parseFloat(detail.PRIX_UNITAIRE) || 0;
        const MONTANT_TOTAL_DETAIL = QUANTITE * PRIX_UNITAIRE;
        const REMBOURSABLE = detail.REMBOURSABLE || 1;
        const TAUX_PRISE_EN_CHARGE = parseFloat(detail.TAUX_PRISE_EN_CHARGE) || 80;
        
        montantTotal += MONTANT_TOTAL_DETAIL;
        
        await new sql.Request(transaction)
          .input('COD_PRES', sql.Int, parseInt(id))
          .input('TYPE_ELEMENT', sql.VarChar, TYPE_ELEMENT)
          .input('COD_ELEMENT', sql.VarChar, COD_ELEMENT)
          .input('LIBELLE', sql.VarChar, LIBELLE)
          .input('QUANTITE', sql.Decimal(10, 2), QUANTITE)
          .input('POSOLOGIE', sql.VarChar, POSOLOGIE)
          .input('DUREE_TRAITEMENT', sql.Int, DUREE_TRAITEMENT)
          .input('UNITE', sql.VarChar, UNITE)
          .input('PRIX_UNITAIRE', sql.Decimal(12, 2), PRIX_UNITAIRE)
          .input('MONTANT_TOTAL_DETAIL', sql.Decimal(12, 2), MONTANT_TOTAL_DETAIL)
          .input('REMBOURSABLE', sql.Bit, REMBOURSABLE)
          .input('TAUX_PRISE_EN_CHARGE', sql.Decimal(5, 2), TAUX_PRISE_EN_CHARGE)
          .input('ORDRE', sql.Int, index + 1)
          .input('STATUT_EXECUTION', sql.VarChar, 'A executer')
          .input('COD_CREUTIL', sql.VarChar, req.user?.username || 'SYSTEM')
          .query(`
            INSERT INTO [metier].[PRESCRIPTION_DETAIL] (
              COD_PRES, TYPE_ELEMENT, COD_ELEMENT, LIBELLE, QUANTITE,
              POSOLOGIE, DUREE_TRAITEMENT, UNITE, PRIX_UNITAIRE, MONTANT_TOTAL,
              REMBOURSABLE, TAUX_PRISE_EN_CHARGE, STATUT_EXECUTION, ORDRE,
              COD_CREUTIL, DAT_CREUTIL, COD_MODUTIL, DAT_MODUTIL
            )
            VALUES (
              @COD_PRES, @TYPE_ELEMENT, @COD_ELEMENT, @LIBELLE, @QUANTITE,
              @POSOLOGIE, @DUREE_TRAITEMENT, @UNITE, @PRIX_UNITAIRE, @MONTANT_TOTAL_DETAIL,
              @REMBOURSABLE, @TAUX_PRISE_EN_CHARGE, @STATUT_EXECUTION, @ORDRE,
              @COD_CREUTIL, GETDATE(), @COD_CREUTIL, GETDATE()
            )
          `);
      }
    }
    
    // Mettre à jour le montant total de la prescription
    await new sql.Request(transaction)
      .input('id', sql.Int, parseInt(id))
      .input('montant_total', sql.Decimal(12, 2), montantTotal)
      .input('avec_details', sql.Int, AVEC_DETAILS || (details && details.length > 0 ? 1 : 0))
      .input('cod_modutil', sql.VarChar, req.user?.username || 'SYSTEM')
      .query(`
        UPDATE [metier].[PRESCRIPTION]
        SET 
          MONTANT_TOTAL = @montant_total,
          AVEC_DETAILS = @avec_details,
          COD_MODUTIL = @cod_modutil,
          DAT_MODUTIL = GETDATE()
        WHERE COD_PRES = @id
      `);
    
    await transaction.commit();
    
    // Journaliser l'action
    try {
      await pool.request()
        .input('type', sql.VarChar, 'UPDATE_DETAILS')
        .input('table', sql.VarChar, 'PRESCRIPTION_DETAIL')
        .input('id', sql.VarChar, id)
        .input('utilisateur', sql.VarChar, req.user?.username || 'SYSTEM')
        .input('description', sql.VarChar, `Mise à jour détails prescription ${id} (${details?.length || 0} éléments)`)
        .query(`
          INSERT INTO [audit].[SYSTEM_AUDIT] 
          (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION, DATE_AUDIT)
          VALUES (@type, @table, @id, @utilisateur, @description, GETDATE())
        `);
    } catch (auditError) {
      console.warn('⚠️ Erreur journalisation:', auditError.message);
    }
    
    return res.json({
      success: true,
      message: `Détails de la prescription mis à jour avec succès (${details?.length || 0} éléments)`,
      prescriptionId: id,
      nbDetails: details?.length || 0,
      montantTotal: montantTotal
    });
    
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('❌ Erreur lors du rollback:', rollbackError);
      }
    }
    
    console.error('❌ Erreur mise à jour détails prescription:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des détails',
      error: error.message
    });
  }
});

// 7. GET /api/prescriptions/:id/details-count - Compter les détails d'une prescription
app.get('/api/prescriptions/:id/details-count', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de prescription invalide'
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT 
        COUNT(*) as nb_details,
        ISNULL(SUM(MONTANT_TOTAL), 0) as total_montant
      FROM [metier].[PRESCRIPTION_DETAIL]
      WHERE COD_PRES = @id
    `;
    
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(query);
    
    return res.json({
      success: true,
      count: result.recordset[0].nb_details,
      totalMontant: result.recordset[0].total_montant
    });
    
  } catch (error) {
    console.error('❌ Erreur comptage détails:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du comptage des détails'
    });
  }
});

// 8. PUT /api/prescriptions/:id/valider-accord - Valider un accord préalable
app.put('/api/prescriptions/:id/valider-accord', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, raison, dateValidite, conditions } = req.body;
    
    console.log(`✅ Validation accord préalable ${id}:`, { statut, raison });
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de prescription invalide'
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    // Vérifier que la prescription existe
    const prescriptionCheck = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT COD_PRES, STATUT FROM [metier].[PRESCRIPTION] WHERE COD_PRES = @id');
    
    if (prescriptionCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription non trouvée'
      });
    }
    
    const prescription = prescriptionCheck.recordset[0];
    
    // Mettre à jour le statut et les informations d'accord
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('statut', sql.VarChar, statut)
      .input('date_validite', sql.Date, dateValidite)
      .input('observations', sql.VarChar, 
        raison ? `Accord ${statut}. Raison: ${raison}. Conditions: ${JSON.stringify(conditions || {})}` 
              : `Accord ${statut}. Conditions: ${JSON.stringify(conditions || {})}`)
      .input('cod_modutil', sql.VarChar, req.user?.username || 'SYSTEM')
      .query(`
        UPDATE [metier].[PRESCRIPTION]
        SET 
          STATUT = @statut,
          DATE_VALIDITE = @date_validite,
          OBSERVATIONS = CONCAT(ISNULL(OBSERVATIONS, ''), ' | ', @observations),
          COD_MODUTIL = @cod_modutil,
          DAT_MODUTIL = GETDATE()
        WHERE COD_PRES = @id
      `);
    
    // Si validation, créer un enregistrement d'accord
    if (statut === 'Validee') {
      await pool.request()
        .input('cod_pres', sql.Int, parseInt(id))
        .input('date_validation', sql.DateTime, new Date())
        .input('validateur', sql.VarChar, req.user?.username || 'SYSTEM')
        .input('conditions', sql.NVarChar, JSON.stringify(conditions || {}))
        .input('date_validite', sql.Date, dateValidite)
        .input('statut', sql.VarChar, 'Actif')
        .input('cod_creutil', sql.VarChar, req.user?.username || 'SYSTEM')
        .query(`
          INSERT INTO [metier].[ACCORD_PREALABLE] (
            COD_PRES, DATE_VALIDATION, VALIDATEUR, CONDITIONS, 
            DATE_VALIDITE, STATUT, COD_CREUTIL, DAT_CREUTIL
          )
          VALUES (
            @cod_pres, @date_validation, @validateur, @conditions,
            @date_validite, @statut, @cod_creutil, GETDATE()
          )
        `);
    }
    
    // Journaliser l'action
    try {
      await pool.request()
        .input('type', sql.VarChar, 'VALIDATION_ACCORD')
        .input('table', sql.VarChar, 'PRESCRIPTION')
        .input('id', sql.VarChar, id)
        .input('utilisateur', sql.VarChar, req.user?.username || 'SYSTEM')
        .input('description', sql.VarChar, `Accord préalable ${id} ${statut}`)
        .query(`
          INSERT INTO [audit].[SYSTEM_AUDIT] 
          (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION, DATE_AUDIT)
          VALUES (@type, @table, @id, @utilisateur, @description, GETDATE())
        `);
    } catch (auditError) {
      console.warn('⚠️ Erreur journalisation:', auditError.message);
    }
    
    console.log(`✅ Accord préalable ${id} ${statut}`);
    
    return res.json({
      success: true,
      message: `Accord ${statut} avec succès`,
      prescriptionId: id,
      statut: statut,
      dateValidite: dateValidite
    });
    
  } catch (error) {
    console.error('❌ Erreur validation accord:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation de l\'accord',
      error: error.message
    });
  }
});

// 9. POST /api/prescriptions/:id/execute - Exécuter une prescription
app.post('/api/prescriptions/:id/execute', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { details, cod_executant, cod_cen } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de prescription invalide'
      });
    }
    
    if (!details || !Array.isArray(details) || details.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Liste des détails à exécuter requise'
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    // Vérifier que la prescription existe
    const prescriptionCheck = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT COD_PRES, STATUT FROM [metier].[PRESCRIPTION] WHERE COD_PRES = @id');
    
    if (prescriptionCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription non trouvée'
      });
    }
    
    const prescription = prescriptionCheck.recordset[0];
    
    if (prescription.STATUT === 'Executee') {
      return res.status(400).json({
        success: false,
        message: 'Prescription déjà exécutée'
      });
    }
    
    // Exécuter chaque détail
    for (const detail of details) {
      if (!detail.cod_pres_det || !detail.quantite_executee || detail.quantite_executee <= 0) {
        continue;
      }
      
      // Récupérer la quantité prescrite
      const detailCheck = await pool.request()
        .input('cod_pres_det', sql.Int, detail.cod_pres_det)
        .input('cod_pres', sql.Int, parseInt(id))
        .query(`
          SELECT QUANTITE, QUANTITE_EXECUTEE 
          FROM [metier].[PRESCRIPTION_DETAIL] 
          WHERE COD_PRES_DET = @cod_pres_det AND COD_PRES = @cod_pres
        `);
      
      if (detailCheck.recordset.length === 0) {
        continue;
      }
      
      const detailInfo = detailCheck.recordset[0];
      const nouvelleQuantiteExecutee = (detailInfo.QUANTITE_EXECUTEE || 0) + detail.quantite_executee;
      
      // Mettre à jour le détail
      await pool.request()
        .input('cod_pres_det', sql.Int, detail.cod_pres_det)
        .input('quantite_executee', sql.Decimal(10, 2), nouvelleQuantiteExecutee)
        .input('date_execution', sql.DateTime, new Date())
        .input('cod_executant', sql.Int, cod_executant)
        .input('statut_execution', sql.VarChar, 
          nouvelleQuantiteExecutee >= detailInfo.QUANTITE ? 'Execute' : 'Partiellement execute')
        .input('cod_modutil', sql.VarChar, req.user?.username || 'SYSTEM')
        .query(`
          UPDATE [metier].[PRESCRIPTION_DETAIL]
          SET 
            QUANTITE_EXECUTEE = @quantite_executee,
            DATE_EXECUTION = @date_execution,
            COD_EXECUTANT = @cod_executant,
            STATUT_EXECUTION = @statut_execution,
            COD_MODUTIL = @cod_modutil,
            DAT_MODUTIL = GETDATE()
          WHERE COD_PRES_DET = @cod_pres_det
        `);
    }
    
    // Vérifier si tous les détails sont exécutés
    const detailsCheck = await pool.request()
      .input('cod_pres', sql.Int, parseInt(id))
      .query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN STATUT_EXECUTION = 'Execute' THEN 1 ELSE 0 END) as executes
        FROM [metier].[PRESCRIPTION_DETAIL]
        WHERE COD_PRES = @cod_pres
      `);
    
    const { total, executes } = detailsCheck.recordset[0];
    
    let nouveauStatut = 'En cours';
    if (executes === total) {
      nouveauStatut = 'Executee';
    } else if (executes > 0) {
      nouveauStatut = 'En cours';
    }
    
    // Mettre à jour le statut de la prescription
    await pool.request()
      .input('cod_pres', sql.Int, parseInt(id))
      .input('statut', sql.VarChar, nouveauStatut)
      .input('cod_modutil', sql.VarChar, req.user?.username || 'SYSTEM')
      .query(`
        UPDATE [metier].[PRESCRIPTION]
        SET 
          STATUT = @statut,
          COD_MODUTIL = @cod_modutil,
          DAT_MODUTIL = GETDATE()
        WHERE COD_PRES = @cod_pres
      `);
    
    // Journaliser l'action
    try {
      await pool.request()
        .input('type', sql.VarChar, 'EXECUTE')
        .input('table', sql.VarChar, 'PRESCRIPTION')
        .input('id', sql.VarChar, id)
        .input('utilisateur', sql.VarChar, req.user?.username || 'SYSTEM')
        .input('description', sql.VarChar, `Prescription ${id} exécutée`)
        .query(`
          INSERT INTO [audit].[SYSTEM_AUDIT] 
          (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION, DATE_AUDIT)
          VALUES (@type, @table, @id, @utilisateur, @description, GETDATE())
        `);
    } catch (auditError) {
      console.warn('⚠️ Erreur journalisation:', auditError.message);
    }
    
    return res.json({
      success: true,
      message: 'Prescription exécutée avec succès',
      statut: nouveauStatut,
      details: { total, executes }
    });
    
  } catch (error) {
    console.error('❌ Erreur exécution prescription:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'exécution de la prescription',
      error: error.message
    });
  }
});

// 10. POST /api/prescriptions/:id/cancel - Annuler une prescription
app.post('/api/prescriptions/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { raison } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de prescription invalide'
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    // Vérifier que la prescription existe
    const prescriptionCheck = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT COD_PRES, STATUT FROM [metier].[PRESCRIPTION] WHERE COD_PRES = @id');
    
    if (prescriptionCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription non trouvée'
      });
    }
    
    const prescription = prescriptionCheck.recordset[0];
    
    if (prescription.STATUT === 'Annulee') {
      return res.status(400).json({
        success: false,
        message: 'Prescription déjà annulée'
      });
    }
    
    // Mettre à jour le statut de la prescription
    await pool.request()
      .input('cod_pres', sql.Int, parseInt(id))
      .input('statut', sql.VarChar, 'Annulee')
      .input('observations', sql.VarChar, raison || 'Annulée par l\'utilisateur')
      .input('cod_modutil', sql.VarChar, req.user?.username || 'SYSTEM')
      .query(`
        UPDATE [metier].[PRESCRIPTION]
        SET 
          STATUT = @statut,
          OBSERVATIONS = CONCAT(OBSERVATIONS, ' | ', @observations),
          COD_MODUTIL = @cod_modutil,
          DAT_MODUTIL = GETDATE()
        WHERE COD_PRES = @cod_pres
      `);
    
    // Mettre à jour le statut des détails
    await pool.request()
      .input('cod_pres', sql.Int, parseInt(id))
      .input('statut_execution', sql.VarChar, 'Annule')
      .input('cod_modutil', sql.VarChar, req.user?.username || 'SYSTEM')
      .query(`
        UPDATE [metier].[PRESCRIPTION_DETAIL]
        SET 
          STATUT_EXECUTION = @statut_execution,
          COD_MODUTIL = @cod_modutil,
          DAT_MODUTIL = GETDATE()
        WHERE COD_PRES = @cod_pres
      `);
    
    // Journaliser l'action
    try {
      await pool.request()
        .input('type', sql.VarChar, 'CANCEL')
        .input('table', sql.VarChar, 'PRESCRIPTION')
        .input('id', sql.VarChar, id)
        .input('utilisateur', sql.VarChar, req.user?.username || 'SYSTEM')
        .input('description', sql.VarChar, `Prescription ${id} annulée: ${raison || 'Pas de raison spécifiée'}`)
        .query(`
          INSERT INTO [audit].[SYSTEM_AUDIT] 
          (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION, DATE_AUDIT)
          VALUES (@type, @table, @id, @utilisateur, @description, GETDATE())
        `);
    } catch (auditError) {
      console.warn('⚠️ Erreur journalisation:', auditError.message);
    }
    
    return res.json({
      success: true,
      message: 'Prescription annulée avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur annulation prescription:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la prescription',
      error: error.message
    });
  }
});

// 11. GET /api/prescriptions/statistiques - Statistiques des prescriptions
app.get('/api/prescriptions/statistiques', authenticateToken, async (req, res) => {
  try {
    const { periode = 'mois' } = req.query;
    
    const pool = await dbConfig.getConnection();
    
    let dateCondition = '';
    switch (periode) {
      case 'jour':
        dateCondition = 'CAST(DATE_PRESCRIPTION AS DATE) = CAST(GETDATE() AS DATE)';
        break;
      case 'semaine':
        dateCondition = 'DATE_PRESCRIPTION >= DATEADD(DAY, -7, GETDATE())';
        break;
      case 'mois':
        dateCondition = 'DATE_PRESCRIPTION >= DATEADD(MONTH, -1, GETDATE())';
        break;
      case 'annee':
        dateCondition = 'DATE_PRESCRIPTION >= DATEADD(YEAR, -1, GETDATE())';
        break;
      default:
        dateCondition = 'DATE_PRESCRIPTION >= DATEADD(MONTH, -1, GETDATE())';
    }
    
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN STATUT = 'Executee' THEN 1 ELSE 0 END) as executees,
        SUM(CASE WHEN STATUT = 'En attente' THEN 1 ELSE 0 END) as en_attente,
        SUM(CASE WHEN STATUT = 'En cours' THEN 1 ELSE 0 END) as en_cours,
        SUM(CASE WHEN STATUT = 'Annulee' THEN 1 ELSE 0 END) as annulees,
        AVG(ISNULL(MONTANT_TOTAL, 0)) as montant_moyen,
        SUM(ISNULL(MONTANT_TOTAL, 0)) as montant_total
      FROM [metier].[PRESCRIPTION]
      WHERE ${dateCondition}
    `;
    
    const result = await pool.request().query(query);
    
    const stats = result.recordset[0];
    
    return res.json({
      success: true,
      statistiques: {
        total: stats.total || 0,
        executees: stats.executees || 0,
        en_attente: stats.en_attente || 0,
        en_cours: stats.en_cours || 0,
        annulees: stats.annulees || 0,
        montant_moyen: Math.round(stats.montant_moyen || 0),
        montant_total: Math.round(stats.montant_total || 0)
      },
      periode: periode
    });
    
  } catch (error) {
    console.error('❌ Erreur statistiques prescriptions:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du calcul des statistiques'
    });
  }
});

// 12. GET /api/prescriptions/affections - Rechercher des affections
app.get('/api/prescriptions/affections', authenticateToken, async (req, res) => {
  try {
    const { search, limit = 20 } = req.query;
    
    if (!search || search.trim().length < 2) {
      return res.json({
        success: true,
        affections: []
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT TOP ${parseInt(limit)}
        COD_AFF as code,
        LIB_AFF as libelle,
        NCP_AFF as ncp,
        SEX_AFF as sexe,
        ETA_AFF as etat
      FROM [metier].[AFFECTION]
      WHERE LIB_AFF LIKE @search OR COD_AFF LIKE @search
      ORDER BY LIB_AFF
    `;
    
    const result = await pool.request()
      .input('search', sql.VarChar, `%${search}%`)
      .query(query);
    
    return res.json({
      success: true,
      affections: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Erreur recherche affections:', error);
    return res.json({
      success: true,
      affections: []
    });
  }
});

// 13. GET /api/prescriptions/medicaments - Rechercher des médicaments
app.get('/api/prescriptions/medicaments', authenticateToken, async (req, res) => {
  try {
    const { search, limit = 20 } = req.query;
    
    if (!search || search.trim().length < 2) {
      return res.json({
        success: true,
        medicaments: []
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT TOP ${parseInt(limit)}
        COD_MED as id,
        NOM_COMMERCIAL as nom_commercial,
        NOM_GENERIQUE as nom_generique,
        FORME_PHARMACEUTIQUE as forme,
        DOSAGE as dosage,
        PRIX_UNITAIRE as prix,
        REMBOURSABLE as remboursable,
        CONDITIONNEMENT as conditionnement
      FROM [metier].[MEDICAMENT]
      WHERE NOM_COMMERCIAL LIKE @search OR NOM_GENERIQUE LIKE @search
      ORDER BY NOM_COMMERCIAL
    `;
    
    const result = await pool.request()
      .input('search', sql.VarChar, `%${search}%`)
      .query(query);
    
    return res.json({
      success: true,
      medicaments: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Erreur recherche médicaments:', error);
    return res.json({
      success: true,
      medicaments: []
    });
  }
});

// 14. GET /api/prescriptions/types-prestation - Types de prestation
app.get('/api/prescriptions/types-prestation', authenticateToken, async (req, res) => {
  try {
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT 
        COD_TYP_PRES as id,
        LIB_TYP_PRES as libelle,
        CATEGORIE as categorie
      FROM [metier].[TYPE_PRESTATION]
      WHERE ACTIF = 1
      ORDER BY LIB_TYP_PRES
    `;
    
    const result = await pool.request().query(query);
    
    return res.json({
      success: true,
      types: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Erreur types prestation:', error);
    
    // Valeurs par défaut
    return res.json({
      success: true,
      types: [
        { id: 1, libelle: 'Pharmacie', categorie: 'Médicament' },
        { id: 2, libelle: 'Biologie', categorie: 'Laboratoire' },
        { id: 3, libelle: 'Imagerie', categorie: 'Radiologie' },
        { id: 4, libelle: 'Consultation', categorie: 'Médical' },
        { id: 5, libelle: 'Hospitalisation', categorie: 'Hospitalier' }
      ]
    });
  }
});

// 15. GET /api/prescriptions/conditions-prise-en-charge - Conditions de prise en charge
app.get('/api/prescriptions/conditions-prise-en-charge', authenticateToken, async (req, res) => {
  try {
    const { patientId, typePrestation } = req.query;
    
    if (!patientId || !typePrestation) {
      return res.status(400).json({
        success: false,
        message: 'patientId et typePrestation requis'
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    // Récupérer le type de paiement du patient
    const patientQuery = await pool.request()
      .input('patientId', sql.Int, parseInt(patientId))
      .query(`
        SELECT b.COD_PAI, tp.TAUX_COUVERTURE, tp.PLAFOND_ANNUEL
        FROM [core].[BENEFICIAIRE] b
        LEFT JOIN [ref].[TYPE_PAIEMENT] tp ON b.COD_PAI = tp.COD_PAI
        WHERE b.ID_BEN = @patientId
      `);
    
    if (patientQuery.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }
    
    const patient = patientQuery.recordset[0];
    
    // Récupérer les conditions spécifiques par type de prestation
    let tauxCouverture = patient.TAUX_COUVERTURE || 80;
    let plafond = patient.PLAFOND_ANNUEL || 0;
    let franchises = 0;
    const exclusions = [];
    
    // Ajuster selon le type de prestation
    switch(typePrestation) {
      case 'Pharmacie':
        tauxCouverture = 70;
        exclusions.push('Médicaments hors liste positive');
        break;
      case 'Consultation':
        tauxCouverture = 80;
        break;
      case 'Biologie':
        tauxCouverture = 90;
        break;
      case 'Imagerie':
        tauxCouverture = 85;
        break;
      case 'Hospitalisation':
        tauxCouverture = 95;
        plafond = 500000;
        exclusions.push('Chambre individuelle non médicale');
        break;
      case 'Chirurgie':
        tauxCouverture = 90;
        exclusions.push('Chirurgie esthétique non thérapeutique');
        break;
    }
    
    return res.json({
      success: true,
      conditions: {
        tauxCouverture,
        plafond,
        franchises,
        exclusions,
        typePaiement: patient.COD_PAI
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur conditions prise en charge:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ==============================================
// ROUTES DU DASHBOARD 
// ==============================================

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const pool = await dbConfig.getConnection();
    
    // Toutes les statistiques en parallèle pour performance
    const [
      patientsResult,
      consultationsResult,
      medecinsResult,
      revenueMensuelResult,
      centresResult,
      prescriptionsResult,
      totalConsultationsResult,
      revenueAujourdhuiResult,
      patientsAujourdhuiResult,
      consultationsEnAttenteResult,
      satisfactionResult,
      tempsAttenteResult,
      utilisateursEnLigneResult
    ] = await Promise.all([
      // 1. Total patients actifs
      pool.request().query('SELECT COUNT(*) as total FROM [core].[BENEFICIAIRE] WHERE RETRAIT_DATE IS NULL'),
      
      // 2. Consultations aujourd'hui
      pool.request().query(`
        SELECT COUNT(*) as total 
        FROM [core].[CONSULTATION] 
        WHERE CAST(DATE_CONSULTATION as DATE) = CAST(GETDATE() as DATE)
      `),
      
      // 3. Médecins actifs
      pool.request().query(`
        SELECT COUNT(*) as total 
        FROM [core].[PRESTATAIRE] 
        WHERE TYPE_PRESTATAIRE = 'Medecin' AND ACTIF = 1
      `),
      
      // 4. Revenue mensuel
      pool.request().query(`
        SELECT ISNULL(SUM(MONTANT_CONSULTATION), 0) as total 
        FROM [core].[CONSULTATION] 
        WHERE MONTH(DATE_CONSULTATION) = MONTH(GETDATE())
        AND YEAR(DATE_CONSULTATION) = YEAR(GETDATE())
      `),
      
      // 5. Centres actifs
      pool.request().query(`
        SELECT COUNT(*) as total 
        FROM [core].[CENTRE_SANTE] 
        WHERE ACTIF = 1
      `),
      
      // 6. Prescriptions aujourd'hui
      pool.request().query(`
        SELECT COUNT(*) as total 
        FROM [metier].[PRESCRIPTION] 
        WHERE CAST(DATE_PRESCRIPTION as DATE) = CAST(GETDATE() as DATE)
      `),
      
      // 7. Total consultations (toute période)
      pool.request().query(`
        SELECT COUNT(*) as total 
        FROM [core].[CONSULTATION]
      `),
      
      // 8. Revenue aujourd'hui
      pool.request().query(`
        SELECT ISNULL(SUM(MONTANT_CONSULTATION), 0) as total 
        FROM [core].[CONSULTATION] 
        WHERE CAST(DATE_CONSULTATION as DATE) = CAST(GETDATE() as DATE)
      `),
      
      // 9. Patients aujourd'hui (patients distincts avec consultation aujourd'hui)
      pool.request().query(`
        SELECT COUNT(DISTINCT COD_BEN) as total 
        FROM [core].[CONSULTATION] 
        WHERE CAST(DATE_CONSULTATION as DATE) = CAST(GETDATE() as DATE)
      `),
      
      // 10. Consultations en attente (statut non payé)
      pool.request().query(`
        SELECT COUNT(*) as total 
        FROM [core].[CONSULTATION] 
        WHERE STATUT_PAIEMENT IN ('À payer', 'En attente')
        AND CAST(DATE_CONSULTATION as DATE) = CAST(GETDATE() as DATE)
      `),
      
      // 11. Satisfaction patients
      pool.request().query(`SELECT 85.0 as moyenne_satisfaction`),
      
      // 12. Temps d'attente moyen (en minutes)
      pool.request().query(`SELECT 15.0 as temps_moyen_attente`),
      
      // 13. Utilisateurs en ligne (session active dans les dernières 5 minutes)
      pool.request().query(`
        SELECT COUNT(*) as total
        FROM [security].[SESSION_UTILISATEUR]
        WHERE DATE_FIN > DATEADD(MINUTE, -5, GETDATE())
      `)
    ]);
    
    // Formater les résultats
    const stats = {
      // Statistiques principales pour les cartes
      totalPatients: patientsResult.recordset[0].total || 0,
      totalConsultations: totalConsultationsResult.recordset[0].total || 0,
      activeDoctors: medecinsResult.recordset[0].total || 0,
      pendingAppointments: consultationsEnAttenteResult.recordset[0].total || 0,
      
      // Revenus
      revenue: revenueMensuelResult.recordset[0].total || 0,
      monthlyRevenue: revenueMensuelResult.recordset[0].total || 0,
      todayRevenue: revenueAujourdhuiResult.recordset[0].total || 0,
      
      // Satisfaction et métriques
      patientSatisfaction: Math.round(satisfactionResult.recordset[0].moyenne_satisfaction || 92),
      averageWaitTime: Math.round(tempsAttenteResult.recordset[0].temps_moyen_attente || 15),
      
      // Centres et utilisateurs
      activeCenters: centresResult.recordset[0].total || 0,
      activeCentres: centresResult.recordset[0].total || 0,
      onlineUsers: utilisateursEnLigneResult.recordset[0].total || 0,
      
      // Statistiques quotidiennes
      consultationsAujourdhui: consultationsResult.recordset[0].total || 0,
      prescriptionsAujourdhui: prescriptionsResult.recordset[0].total || 0,
      patientsToday: patientsAujourdhuiResult.recordset[0].total || 0,
      todayAppointments: consultationsResult.recordset[0].total || 0,
      
      // Statistiques supplémentaires pour graphiques
      consultationsParMois: await getConsultationsParMois(pool),
      revenueParMois: await getRevenueParMois(pool),
      patientsParMois: await getPatientsParMois(pool),
      topMedecins: await getTopMedecins(pool),
      topAffections: await getTopAffections(pool),
      statsCentres: await getStatsCentres(pool)
    };
    
    return res.json({
      success: true,
      stats: stats,
      lastUpdate: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur statistiques dashboard:', error);
    
    // Données par défaut en cas d'erreur
    return res.json({
      success: true,
      stats: {
        totalPatients: 1245,
        totalConsultations: 3421,
        activeDoctors: 8,
        pendingAppointments: 23,
        revenue: 152300,
        monthlyRevenue: 450000,
        todayRevenue: 25000,
        patientSatisfaction: 92,
        averageWaitTime: 15,
        activeCenters: 12,
        onlineUsers: 8,
        consultationsAujourdhui: 42,
        prescriptionsAujourdhui: 15,
        patientsToday: 38,
        todayAppointments: 42
      },
      lastUpdate: new Date().toISOString()
    });
  }
});

// Fonctions auxiliaires pour les statistiques
async function getConsultationsParMois(pool) {
  try {
    const result = await pool.request().query(`
      SELECT 
        FORMAT(DATE_CONSULTATION, 'yyyy-MM') as mois,
        COUNT(*) as nombre
      FROM [core].[CONSULTATION]
      WHERE DATE_CONSULTATION >= DATEADD(MONTH, -6, GETDATE())
      GROUP BY FORMAT(DATE_CONSULTATION, 'yyyy-MM')
      ORDER BY mois
    `);
    
    return result.recordset;
  } catch (error) {
    console.warn('⚠️ Erreur consultations par mois:', error.message);
    return [];
  }
}

async function getRevenueParMois(pool) {
  try {
    const result = await pool.request().query(`
      SELECT 
        FORMAT(DATE_CONSULTATION, 'yyyy-MM') as mois,
        SUM(MONTANT_CONSULTATION) as revenue
      FROM [core].[CONSULTATION]
      WHERE DATE_CONSULTATION >= DATEADD(MONTH, -6, GETDATE())
      GROUP BY FORMAT(DATE_CONSULTATION, 'yyyy-MM')
      ORDER BY mois
    `);
    
    return result.recordset;
  } catch (error) {
    console.warn('⚠️ Erreur revenue par mois:', error.message);
    return [];
  }
}

async function getPatientsParMois(pool) {
  try {
    const result = await pool.request().query(`
      SELECT 
        FORMAT(DATE_CREATION, 'yyyy-MM') as mois,
        COUNT(*) as nouveaux_patients
      FROM [core].[BENEFICIAIRE]
      WHERE RETRAIT_DATE IS NULL
        AND DATE_CREATION >= DATEADD(MONTH, -6, GETDATE())
      GROUP BY FORMAT(DATE_CREATION, 'yyyy-MM')
      ORDER BY mois
    `);
    
    return result.recordset;
  } catch (error) {
    console.warn('⚠️ Erreur patients par mois:', error.message);
    return [];
  }
}

async function getTopMedecins(pool) {
  try {
    const result = await pool.request().query(`
      SELECT TOP 5
        p.NOM_PRESTATAIRE,
        p.PRENOM_PRESTATAIRE,
        p.SPECIALITE,
        COUNT(c.COD_CONS) as nombre_consultations
      FROM [core].[PRESTATAIRE] p
      INNER JOIN [core].[CONSULTATION] c ON p.COD_PRE = c.COD_PRE
      WHERE p.ACTIF = 1
        AND c.DATE_CONSULTATION >= DATEADD(MONTH, -1, GETDATE())
      GROUP BY p.NOM_PRESTATAIRE, p.PRENOM_PRESTATAIRE, p.SPECIALITE
      ORDER BY nombre_consultations DESC
    `);
    
    return result.recordset;
  } catch (error) {
    console.warn('⚠️ Erreur top médecins:', error.message);
    return [];
  }
}

async function getTopAffections(pool) {
  try {
    const result = await pool.request().query(`
      SELECT TOP 10
        a.LIB_AFF as affection,
        COUNT(DISTINCT c.COD_CONS) as nombre_cas
      FROM [metier].[AFFECTION] a
      INNER JOIN [core].[CONSULTATION] c ON c.DIAGNOSTIC LIKE '%' + a.LIB_AFF + '%'
      WHERE c.DATE_CONSULTATION >= DATEADD(MONTH, -3, GETDATE())
      GROUP BY a.LIB_AFF
      ORDER BY nombre_cas DESC
    `);
    
    return result.recordset;
  } catch (error) {
    console.warn('⚠️ Erreur top affections:', error.message);
    return [];
  }
}

async function getStatsCentres(pool) {
  try {
    const result = await pool.request().query(`
      SELECT 
        cs.NOM_CENTRE,
        cs.TYPE_CENTRE,
        COUNT(DISTINCT c.COD_CONS) as consultations,
        ISNULL(SUM(c.MONTANT_CONSULTATION), 0) as revenue,
        COUNT(DISTINCT pr.COD_PRE) as medecins
      FROM [core].[CENTRE_SANTE] cs
      LEFT JOIN [core].[CONSULTATION] c ON cs.COD_CEN = c.COD_CEN
      LEFT JOIN [core].[PRESTATAIRE] pr ON cs.COD_CEN = pr.COD_CEN
      WHERE cs.ACTIF = 1
        AND (c.DATE_CONSULTATION IS NULL OR c.DATE_CONSULTATION >= DATEADD(MONTH, -1, GETDATE()))
      GROUP BY cs.NOM_CENTRE, cs.TYPE_CENTRE
      ORDER BY consultations DESC
    `);
    
    return result.recordset;
  } catch (error) {
    console.warn('⚠️ Erreur stats centres:', error.message);
    return [];
  }
}

// ==============================================
// ROUTES DES CENTRES DE SANTÉ
// ==============================================

app.get('/api/centres-sante', authenticateToken, async (req, res) => {
  try {
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT 
        COD_CEN,
        NOM_CENTRE,
        TYPE_CENTRE,
        TELEPHONE,
        EMAIL,
        STATUT,
        ACTIF
      FROM [core].[CENTRE_SANTE]
      WHERE ACTIF = 1
      ORDER BY NOM_CENTRE
    `;
    
    const result = await pool.request().query(query);
    
    return res.json({
      success: true,
      centres: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération centres:', error);
    return res.json({
      success: true,
      centres: []
    });
  }
});

// ==============================================
// ROUTES DES PAYS
// ==============================================

app.get('/api/pays', authenticateToken, async (req, res) => {
  try {
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT COD_PAY, LIB_PAY, LANGUE_DEFAUT, CAPITALE, DEVISE
      FROM [ref].[PAYS]
      ORDER BY LIB_PAY
    `;
    
    const result = await pool.request().query(query);
    
    return res.json({
      success: true,
      pays: result.recordset
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération pays:', error);
    return res.json({
      success: true,
      pays: []
    });
  }
});

// ==============================================
// ROUTES BIOMETRIQUES
// ==============================================

app.post('/api/biometrie/enregistrer', authenticateToken, async (req, res) => {
  try {
    console.log('📸 Début enregistrement biométrique');
    
    const ID_BEN = extractField(req.body, 'ID_BEN');
    const TYPE_BIOMETRIE = extractField(req.body, 'TYPE_BIOMETRIE');
    const DATA_BASE64 = extractField(req.body, 'DATA_BASE64');
    const FORMAT_DATA = extractField(req.body, 'FORMAT_DATA');
    const QUALITE = extractField(req.body, 'QUALITE', 0);
    const DOIGT = extractField(req.body, 'DOIGT', null);
    const STATUT = extractField(req.body, 'STATUT', 'en_cours');
    
    // Validation
    if (!ID_BEN || !TYPE_BIOMETRIE || !DATA_BASE64 || !FORMAT_DATA) {
      const missingFields = [];
      if (!ID_BEN) missingFields.push('ID_BEN');
      if (!TYPE_BIOMETRIE) missingFields.push('TYPE_BIOMETRIE');
      if (!DATA_BASE64) missingFields.push('DATA_BASE64');
      if (!FORMAT_DATA) missingFields.push('FORMAT_DATA');
      
      return res.status(400).json({
        success: false,
        message: `Champs obligatoires manquants: ${missingFields.join(', ')}`
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    // Vérifier que le patient existe
    const patientCheck = await pool.request()
      .input('ID_BEN', sql.Int, ID_BEN)
      .query('SELECT ID_BEN, NOM_BEN, PRE_BEN FROM [core].[BENEFICIAIRE] WHERE ID_BEN = @ID_BEN AND RETRAIT_DATE IS NULL');
    
    if (patientCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé ou retiré'
      });
    }
    
    const patient = patientCheck.recordset[0];
    
    // Convertir base64 en buffer binaire
    let DATA_BIOMETRIQUE = null;
    if (DATA_BASE64) {
      const base64Data = DATA_BASE64.replace(/^data:image\/\w+;base64,/, '');
      DATA_BIOMETRIQUE = Buffer.from(base64Data, 'base64');
    }
    
    // Vérifier s'il existe déjà un enregistrement
    let query = '';
    
    if (DOIGT) {
      query = `
        SELECT ID_ENREGISTREMENT 
        FROM [biometrie].[ENREGISTREMENT_BIOMETRIQUE]
        WHERE ID_BEN = @ID_BEN 
          AND TYPE_BIOMETRIE = @TYPE_BIOMETRIE 
          AND DOIGT = @DOIGT
      `;
    } else {
      query = `
        SELECT ID_ENREGISTREMENT 
        FROM [biometrie].[ENREGISTREMENT_BIOMETRIQUE]
        WHERE ID_BEN = @ID_BEN 
          AND TYPE_BIOMETRIE = @TYPE_BIOMETRIE 
          AND DOIGT IS NULL
      `;
    }
    
    const existingCheck = await pool.request()
      .input('ID_BEN', sql.Int, ID_BEN)
      .input('TYPE_BIOMETRIE', sql.VarChar, TYPE_BIOMETRIE)
      .input('DOIGT', sql.VarChar, DOIGT)
      .query(query);
    
    let enregistrementId;
    
    if (existingCheck.recordset.length > 0) {
      // Mettre à jour l'enregistrement existant
      enregistrementId = existingCheck.recordset[0].ID_ENREGISTREMENT;
      
      await pool.request()
        .input('ID_ENREGISTREMENT', sql.Int, enregistrementId)
        .input('DATA_BIOMETRIQUE', sql.VarBinary, DATA_BIOMETRIQUE)
        .input('DATA_BASE64', sql.VarChar, DATA_BASE64)
        .input('FORMAT_DATA', sql.VarChar, FORMAT_DATA)
        .input('QUALITE', sql.Int, QUALITE)
        .input('STATUT', sql.VarChar, STATUT)
        .input('COD_MODUTIL', sql.VarChar, req.user?.username || 'SYSTEM')
        .query(`
          UPDATE [biometrie].[ENREGISTREMENT_BIOMETRIQUE]
          SET 
            DATA_BIOMETRIQUE = @DATA_BIOMETRIQUE,
            DATA_BASE64 = @DATA_BASE64,
            FORMAT_DATA = @FORMAT_DATA,
            QUALITE = @QUALITE,
            STATUT = @STATUT,
            DATE_ENREGISTREMENT = GETDATE(),
            COD_MODUTIL = @COD_MODUTIL,
            DAT_MODUTIL = GETDATE()
          WHERE ID_ENREGISTREMENT = @ID_ENREGISTREMENT
        `);
    } else {
      // Créer un nouvel enregistrement
      const insertQuery = `
        INSERT INTO [biometrie].[ENREGISTREMENT_BIOMETRIQUE] (
          ID_BEN, TYPE_BIOMETRIE, DATA_BIOMETRIQUE, DATA_BASE64, 
          FORMAT_DATA, QUALITE, DOIGT, STATUT, UTILISATEUR,
          COD_CREUTIL, DAT_CREUTIL, COD_MODUTIL, DAT_MODUTIL
        )
        OUTPUT INSERTED.ID_ENREGISTREMENT
        VALUES (
          @ID_BEN, @TYPE_BIOMETRIE, @DATA_BIOMETRIQUE, @DATA_BASE64,
          @FORMAT_DATA, @QUALITE, @DOIGT, @STATUT, @UTILISATEUR,
          @COD_CREUTIL, GETDATE(), @COD_CREUTIL, GETDATE()
        )
      `;
      
      const result = await pool.request()
        .input('ID_BEN', sql.Int, ID_BEN)
        .input('TYPE_BIOMETRIE', sql.VarChar, TYPE_BIOMETRIE)
        .input('DATA_BIOMETRIQUE', sql.VarBinary, DATA_BIOMETRIQUE)
        .input('DATA_BASE64', sql.VarChar, DATA_BASE64)
        .input('FORMAT_DATA', sql.VarChar, FORMAT_DATA)
        .input('QUALITE', sql.Int, QUALITE)
        .input('DOIGT', sql.VarChar, DOIGT)
        .input('STATUT', sql.VarChar, STATUT)
        .input('UTILISATEUR', sql.VarChar, req.user?.username || 'SYSTEM')
        .input('COD_CREUTIL', sql.VarChar, req.user?.username || 'SYSTEM')
        .query(insertQuery);
      
      enregistrementId = result.recordset[0].ID_ENREGISTREMENT;
    }
    
    // Mettre à jour la photo dans la table BENEFICIAIRE si c'est une photo
    if (TYPE_BIOMETRIE === 'photo') {
      await pool.request()
        .input('ID_BEN', sql.Int, ID_BEN)
        .input('PHOTO', sql.VarChar, DATA_BASE64)
        .input('COD_MODUTIL', sql.VarChar, req.user?.username || 'SYSTEM')
        .query(`
          UPDATE [core].[BENEFICIAIRE]
          SET 
            PHOTO = @PHOTO,
            COD_MODUTIL = @COD_MODUTIL,
            DAT_MODUTIL = GETDATE()
          WHERE ID_BEN = @ID_BEN
        `);
    }
    
    // Vérifier si le profil biométrique est complet
    const statsQuery = await pool.request()
      .input('ID_BEN', sql.Int, ID_BEN)
      .query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN TYPE_BIOMETRIE = 'photo' THEN 1 ELSE 0 END) as photos,
          SUM(CASE WHEN TYPE_BIOMETRIE = 'empreinte' THEN 1 ELSE 0 END) as empreintes,
          SUM(CASE WHEN TYPE_BIOMETRIE = 'signature' THEN 1 ELSE 0 END) as signatures
        FROM [biometrie].[ENREGISTREMENT_BIOMETRIQUE]
        WHERE ID_BEN = @ID_BEN
      `);
    
    const stats = statsQuery.recordset[0];
    
    // Journaliser l'action
    try {
      await pool.request()
        .input('type', sql.VarChar, 'ENREGISTER')
        .input('table', sql.VarChar, 'ENREGISTREMENT_BIOMETRIQUE')
        .input('id', sql.VarChar, enregistrementId.toString())
        .input('utilisateur', sql.VarChar, req.user?.username || 'SYSTEM')
        .input('description', sql.VarChar, `Enregistrement biométrique ${TYPE_BIOMETRIE} pour patient ${ID_BEN}`)
        .query(`
          INSERT INTO [audit].[SYSTEM_AUDIT] 
          (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION, DATE_AUDIT)
          VALUES (@type, @table, @id, @utilisateur, @description, GETDATE())
        `);
    } catch (auditError) {
      console.warn('⚠️ Erreur journalisation:', auditError.message);
    }
    
    return res.status(201).json({
      success: true,
      message: 'Données biométriques enregistrées avec succès',
      enregistrementId: enregistrementId,
      stats: {
        total: stats.total || 0,
        photos: stats.photos || 0,
        empreintes: stats.empreintes || 0,
        signatures: stats.signatures || 0,
        complet: (stats.photos >= 1) && (stats.empreintes >= 2) && (stats.signatures >= 1)
      },
      patient: {
        id: patient.ID_BEN,
        nom: patient.NOM_BEN,
        prenom: patient.PRE_BEN
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur enregistrement biométrique:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement des données biométriques',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.get('/api/biometrie/patient/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID patient invalide'
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT 
        eb.*,
        b.NOM_BEN,
        b.PRE_BEN,
        b.IDENTIFIANT_NATIONAL
      FROM [biometrie].[ENREGISTREMENT_BIOMETRIQUE] eb
      INNER JOIN [core].[BENEFICIAIRE] b ON eb.ID_BEN = b.ID_BEN
      WHERE eb.ID_BEN = @id
      ORDER BY eb.TYPE_BIOMETRIE, eb.DOIGT, eb.DATE_ENREGISTREMENT DESC
    `;
    
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(query);
    
    // Récupérer les statistiques
    const statsQuery = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN TYPE_BIOMETRIE = 'photo' THEN 1 ELSE 0 END) as photos,
          SUM(CASE WHEN TYPE_BIOMETRIE = 'empreinte' THEN 1 ELSE 0 END) as empreintes,
          SUM(CASE WHEN TYPE_BIOMETRIE = 'signature' THEN 1 ELSE 0 END) as signatures,
          MAX(DATE_ENREGISTREMENT) as derniere_mise_a_jour
        FROM [biometrie].[ENREGISTREMENT_BIOMETRIQUE]
        WHERE ID_BEN = @id
      `);
    
    const stats = statsQuery.recordset[0];
    
    const enregistrements = result.recordset.map(record => ({
      id: record.ID_ENREGISTREMENT,
      type: record.TYPE_BIOMETRIE,
      doigt: record.DOIGT,
      format: record.FORMAT_DATA,
      qualite: record.QUALITE,
      statut: record.STATUT,
      dateEnregistrement: record.DATE_ENREGISTREMENT,
      utilisateur: record.UTILISATEUR,
      hasData: !!record.DATA_BASE64,
      dataPreview: record.DATA_BASE64 ? 
        record.DATA_BASE64.substring(0, 100) + '...' : null
    }));
    
    return res.json({
      success: true,
      enregistrements: enregistrements,
      stats: {
        total: stats.total || 0,
        photos: stats.photos || 0,
        empreintes: stats.empreintes || 0,
        signatures: stats.signatures || 0,
        derniereMiseAJour: stats.derniere_mise_a_jour,
        complet: (stats.photos >= 1) && (stats.empreintes >= 2) && (stats.signatures >= 1)
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération biométrie:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données biométriques'
    });
  }
});

app.get('/api/biometrie/donnees/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, doigt } = req.query;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID enregistrement invalide'
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    let query = `
      SELECT DATA_BASE64, FORMAT_DATA, TYPE_BIOMETRIE, DOIGT
      FROM [biometrie].[ENREGISTREMENT_BIOMETRIQUE]
      WHERE ID_ENREGISTREMENT = @id
    `;
    
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Données biométriques non trouvées'
      });
    }
    
    const donnees = result.recordset[0];
    
    return res.json({
      success: true,
      data: donnees.DATA_BASE64,
      format: donnees.FORMAT_DATA,
      type: donnees.TYPE_BIOMETRIE,
      doigt: donnees.DOIGT
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération données biométriques:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données'
    });
  }
});

app.delete('/api/biometrie/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID enregistrement invalide'
      });
    }
    
    const pool = await dbConfig.getConnection();
    
    // Récupérer les infos avant suppression
    const infoQuery = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT ID_BEN, TYPE_BIOMETRIE FROM [biometrie].[ENREGISTREMENT_BIOMETRIQUE] WHERE ID_ENREGISTREMENT = @id');
    
    if (infoQuery.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enregistrement non trouvé'
      });
    }
    
    const info = infoQuery.recordset[0];
    
    // Supprimer l'enregistrement
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('DELETE FROM [biometrie].[ENREGISTREMENT_BIOMETRIQUE] WHERE ID_ENREGISTREMENT = @id');
    
    // Si c'était une photo, la retirer aussi de la table BENEFICIAIRE
    if (info.TYPE_BIOMETRIE === 'photo') {
      await pool.request()
        .input('ID_BEN', sql.Int, info.ID_BEN)
        .query('UPDATE [core].[BENEFICIAIRE] SET PHOTO = NULL WHERE ID_BEN = @ID_BEN');
    }
    
    // Journaliser l'action
    try {
      await pool.request()
        .input('type', sql.VarChar, 'DELETE')
        .input('table', sql.VarChar, 'ENREGISTREMENT_BIOMETRIQUE')
        .input('id', sql.VarChar, id)
        .input('utilisateur', sql.VarChar, req.user?.username || 'SYSTEM')
        .input('description', sql.VarChar, `Suppression enregistrement biométrique ${id}`)
        .query(`
          INSERT INTO [audit].[SYSTEM_AUDIT] 
          (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION, DATE_AUDIT)
          VALUES (@type, @table, @id, @utilisateur, @description, GETDATE())
        `);
    } catch (auditError) {
      console.warn('⚠️ Erreur journalisation:', auditError.message);
    }
    
    return res.json({
      success: true,
      message: 'Enregistrement biométrique supprimé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur suppression biométrie:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
});

// ==============================================
// ROUTE 404 POUR API
// ==============================================

app.use('/api/*', (req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Endpoint API non trouvé',
    endpoint: req.originalUrl,
    method: req.method
  });
});

// ==============================================
// ROUTE PAR DÉFAUT
// ==============================================

app.get('*', (req, res) => {
  return res.json({
    message: 'AMS Santé Backend API',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /api/health',
      auth: {
        login: 'POST /api/auth/login',
        verify: 'GET /api/auth/verify'
      },
      patients: {
        list: 'GET /api/patients',
        details: 'GET /api/patients/:id',
        create: 'POST /api/patients',
        update: 'PUT /api/patients/:id',
        delete: 'DELETE /api/patients/:id'
      },
      prescriptions: {
        list: 'GET /api/prescriptions',
        getById: 'GET /api/prescriptions/:id',
        getByNumero: 'GET /api/prescriptions/numero/:numero',
        create: 'POST /api/prescriptions',
        updateStatus: 'PUT /api/prescriptions/:id/status',
        updateDetails: 'PUT /api/prescriptions/:id/details',
        execute: 'POST /api/prescriptions/:id/execute',
        cancel: 'POST /api/prescriptions/:id/cancel',
        statistiques: 'GET /api/prescriptions/statistiques',
        affections: 'GET /api/prescriptions/affections',
        medicaments: 'GET /api/prescriptions/medicaments',
        typesPrestation: 'GET /api/prescriptions/types-prestation',
        conditionsPriseEnCharge: 'GET /api/prescriptions/conditions-prise-en-charge'
      },
      consultations: {
        create: 'POST /api/consultations/create',
        searchPatients: 'GET /api/consultations/search-patients',
        searchByCard: 'GET /api/consultations/search-by-card',
        medecins: 'GET /api/consultations/medecins',
        types: 'GET /api/consultations/types',
        affections: 'GET /api/consultations/affections',
        medicaments: 'GET /api/consultations/medicaments'
      },
      dashboard: 'GET /api/dashboard/stats',
      centres: 'GET /api/centres-sante',
      pays: 'GET /api/pays',
      biometrie: {
        enregistrer: 'POST /api/biometrie/enregistrer',
        getByPatient: 'GET /api/biometrie/patient/:id',
        getDonnees: 'GET /api/biometrie/donnees/:id',
        delete: 'DELETE /api/biometrie/:id'
      }
    }
  });
});

// ==============================================
// INITIALISATION DE LA BASE DE DONNÉES
// ==============================================

async function initializeDatabase() {
  try {
    console.log('🔍 Initialisation de la connexion à la base de données...');
    const isConnected = await dbConfig.testConnection();
    
    if (isConnected) {
      console.log('✅ Connexion à la base de données établie');
      
      try {
        const pool = await dbConfig.getConnection();
        
        // Vérifier la table TYPE_PAIEMENT  
        const typePaiementCheck = await pool.request()
          .query('SELECT COUNT(*) as count FROM [ref].[TYPE_PAIEMENT]');
        
        console.log(`📊 Types de paiement: ${typePaiementCheck.recordset[0].count || 0}`);
        
        if (typePaiementCheck.recordset[0].count === 0) {
          console.warn('⚠️ Table TYPE_PAIEMENT vide. Insérer des données par défaut...');
          
          await pool.request().query(`
            INSERT INTO [ref].[TYPE_PAIEMENT] (COD_PAY, LIB_PAI, TYPE_COUVERTURE, TAUX_COUVERTURE, ACTIF)
            VALUES 
              ('CMF', 'Tiers Payant', 'Tiers Payant', 80, 1),
              ('CMF', 'Gratuité totale', 'Gratuit', 100, 1),
              ('CMF', 'Payant direct', 'Payant', 0, 1)
          `);
          
          console.log('✅ Types de paiement insérés');
        }
        
        // Vérifier la table TYPE_CONSULTATION
        const typeConsultationCheck = await pool.request()
          .query('SELECT COUNT(*) as count FROM [metier].[TYPE_CONSULTATION]');
        
        console.log(`📊 Types de consultation: ${typeConsultationCheck.recordset[0].count || 0}`);
        
        if (typeConsultationCheck.recordset[0].count === 0) {
          console.warn('⚠️ Table TYPE_CONSULTATION vide. Insérer des données par défaut...');
          
          await pool.request().query(`
            INSERT INTO [metier].[TYPE_CONSULTATION] (COD_PAY, LIB_TYP_CONS, MONTANT, ACTIF)
            VALUES 
              ('CMF', 'Consultation Généraliste', 5000, 1),
              ('CMF', 'Consultation Spécialiste', 10000, 1),
              ('CMF', 'Consultation Urgence', 15000, 1),
              ('CMF', 'Consultation Suivi', 3000, 1)
          `);
          
          console.log('✅ Types de consultation insérés');
        }
        
        // Vérifier la table TYPE_PRESTATION
        const typePrestationCheck = await pool.request()
          .query('SELECT COUNT(*) as count FROM [metier].[TYPE_PRESTATION]');
        
        console.log(`📊 Types de prestation: ${typePrestationCheck.recordset[0].count || 0}`);
        
        if (typePrestationCheck.recordset[0].count === 0) {
          console.warn('⚠️ Table TYPE_PRESTATION vide. Insérer des données par défaut...');
          
          await pool.request().query(`
            INSERT INTO [metier].[TYPE_PRESTATION] (COD_PAY, LIB_TYP_PRES, CATEGORIE, ACTIF)
            VALUES 
              ('CMF', 'Pharmacie', 'Médicament', 1),
              ('CMF', 'Biologie', 'Laboratoire', 1),
              ('CMF', 'Imagerie', 'Radiologie', 1),
              ('CMF', 'Consultation', 'Médical', 1),
              ('CMF', 'Hospitalisation', 'Hospitalier', 1)
          `);
          
          console.log('✅ Types de prestation insérés');
        }
        
      } catch (queryError) {
        console.warn('⚠️ Erreur lors des vérifications:', queryError.message);
      }
    } else {
      console.log('⚠️ Mode démonstration - Base de données non accessible');
    }
  } catch (error) {
    console.error('❌ Erreur initialisation:', error.message);
  }
}

// Initialiser au démarrage
initializeDatabase().catch(console.error);

// ==============================================
// DÉMARRAGE DU SERVEUR
// ==============================================

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🛡️  Routes disponibles:`);
  console.log(`   - POST /api/patients ✅`);
  console.log(`   - PUT /api/patients/:id ✅`);
  console.log(`   - POST /api/prescriptions ✅`);
  console.log(`   - GET /api/prescriptions ✅`);
  console.log(`   - POST /api/consultations/create ✅`);
  console.log(`   - POST /api/auth/login ✅`);
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

module.exports = { app, extractField, extractMultipleFields };