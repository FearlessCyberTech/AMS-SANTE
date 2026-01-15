// routes/types-consultation.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const [types] = await db.execute('SELECT id, nom, code, tarif FROM types_consultation WHERE is_active = true');
    res.json({ success: true, data: types });
  } catch (error) {
    console.error('Erreur récupération types consultation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;