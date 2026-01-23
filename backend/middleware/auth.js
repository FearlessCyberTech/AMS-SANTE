// middleware/auth.js
const jwt = require('jsonwebtoken');
const { getConnection, sql } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'healthcenter-dev-secret-2024';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token manquant' 
    });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error('Erreur vérification token:', err);
      
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ 
          success: false, 
          message: 'Token JWT invalide' 
        });
      } else if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ 
          success: false, 
          message: 'Token expiré' 
        });
      } else if (err.name === 'TokenNotBeforeError') {
        return res.status(403).json({ 
          success: false, 
          message: 'Token pas encore valide' 
        });
      }
      
      return res.status(403).json({ 
        success: false, 
        message: 'Token invalide' 
      });
    }
    
    try {
      // Établir la connexion à la base de données
      const pool = await getConnection();
      
      // Vérifier que l'utilisateur existe toujours et est actif
      const query = `
        SELECT 
          u.ID_UTI as id,
          u.LOG_UTI as username,
          u.PROFIL_UTI as role,
          u.NOM_UTI as nom,
          u.PRE_UTI as prenom,
          u.EMAIL_UTI as email,
          u.ACTIF as is_active,
          u.COD_PAY as cod_pay,
          u.SUPER_ADMIN as super_admin,
          p.COD_PRE as prestataire_id,
          p.SPECIALITE as specialite,
          p.NUM_LICENCE as numero_license
        FROM security.UTILISATEUR u
        LEFT JOIN core.PRESTATAIRE p ON u.EMAIL_UTI = p.EMAIL AND u.PROFIL_UTI = 'Medecin'
        WHERE u.ID_UTI = @userId AND u.ACTIF = 1
      `;

      const request = pool.request();
      request.input('userId', sql.Int, decoded.id || decoded.userId);
      
      const result = await request.query(query);

      if (result.recordset.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé ou compte inactif'
        });
      }

      const user = result.recordset[0];
      
      // Préparer l'objet utilisateur pour la requête
      req.user = {
        id: user.id,
        username: user.username,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        pays: decoded.pays || '',
        cod_pay: user.cod_pay || decoded.cod_pay || 'CMF',
        super_admin: user.super_admin || decoded.super_admin || false,
        is_active: user.is_active,
        prestataire_id: user.prestataire_id,
        specialite: user.specialite,
        numero_license: user.numero_license,
        langue: decoded.langue || 'fr',
        theme: decoded.theme || 'light'
      };
      
      console.log('Authentification réussie pour:', req.user.username, 'COD_PAY:', req.user.cod_pay);
      next();
    } catch (dbError) {
      console.error('Erreur base de données lors de l\'authentification:', dbError);
      
      // En cas d'erreur DB, utiliser les données du token décodé
      req.user = {
        id: decoded.id,
        username: decoded.username,
        nom: decoded.nom,
        prenom: decoded.prenom,
        email: decoded.email,
        role: decoded.role,
        pays: decoded.pays || '',
        cod_pay: decoded.cod_pay || 'CMF',
        super_admin: decoded.super_admin || false,
        langue: decoded.langue || 'fr',
        theme: decoded.theme || 'light'
      };
      
      console.log('Authentification via token (fallback) pour:', req.user.username);
      next();
    }
  });
}

// Middleware pour vérifier si l'utilisateur est super admin
function requireSuperAdmin(req, res, next) {
  if (!req.user || !req.user.super_admin) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux super administrateurs'
    });
  }
  next();
}

// Middleware pour vérifier les permissions par pays
function requireSameCountryOrSuperAdmin(req, res, next) {
  // Si l'utilisateur est super admin, on laisse passer
  if (req.user && req.user.super_admin) {
    return next();
  }
  
  // Vérifier si la requête concerne un utilisateur d'un autre pays
  const requestedCodPay = req.body.COD_PAY || req.query.cod_pay || req.params.cod_pay;
  
  if (requestedCodPay && requestedCodPay !== req.user.cod_pay) {
    return res.status(403).json({
      success: false,
      message: 'Vous ne pouvez accéder qu\'aux données de votre pays'
    });
  }
  
  next();
}

// Middleware pour vérifier les permissions d'accès aux utilisateurs
function checkUserAccess(req, res, next) {
  const userId = req.params.id;
  
  // Si l'utilisateur est super admin, on laisse passer
  if (req.user && req.user.super_admin) {
    return next();
  }
  
  // Vérifier si l'utilisateur essaie d'accéder à son propre compte
  if (userId && parseInt(userId) === req.user.id) {
    return next();
  }
  
  // Pour les non-super admins, vérifier que l'utilisateur cible est du même pays
  // Cette vérification se fera dans le contrôleur avec une requête à la DB
  next();
}

module.exports = {
  authenticateToken,
  requireSuperAdmin,
  requireSameCountryOrSuperAdmin,
  checkUserAccess
};