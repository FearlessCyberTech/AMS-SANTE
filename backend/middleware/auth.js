// middleware/auth.js
const jwt = require('jsonwebtoken');
const { getConnection, sql } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'healthcenter_secret_key_2024_super_secure';

const auth = async (req, res, next) => {
  try {
    let token = req.header('Authorization');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    // Nettoyer le token
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    // Vérifications basiques
    if (!token || token === 'null' || token === 'undefined' || token === '') {
      return res.status(401).json({
        success: false,
        message: 'Token vide ou invalide'
      });
    }

    console.log('Token reçu (début):', token.substring(0, 20) + '...');

    // Vérifier le token JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Établir la connexion à la base de données
    const pool = await getConnection();
    
    // Vérifier que l'utilisateur existe toujours
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
    request.input('userId', sql.Int, decoded.userId);
    
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = result.recordset[0];
    req.user = user;
    
    console.log('Authentification réussie pour:', user.username);
    next();
  } catch (error) {
    console.error('Erreur authentification détaillée:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: `Token JWT invalide: ${error.message}`
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    } else if (error.name === 'TokenNotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token pas encore valide'
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Erreur d\'authentification'
    });
  }
};

module.exports = auth;