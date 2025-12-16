// services/jwtService.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'healthcenter_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class JwtService {
  // Générer un token JWT
  generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'health-center-soft',
      audience: 'health-center-users'
    });
  }

  // Vérifier un token JWT
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error(`Token invalide: ${error.message}`);
    }
  }

  // Décoder un token sans vérification (pour debug)
  decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = new JwtService();