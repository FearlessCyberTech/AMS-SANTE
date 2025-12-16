const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Récupérer toutes les demandes de prise en charge
router.get('/', auth, async (req, res) => {
  try {
    const [demandes] = await db.execute(`
      SELECT d.*, 
             pat.nom as patient_nom, 
             pat.prenom as patient_prenom,
             pat.numero_carte
      FROM demandes_prise_en_charge d
      LEFT JOIN patients pat ON d.patient_id = pat.id
      ORDER BY d.date_demande DESC
    `);

    res.json({
      success: true,
      data: demandes
    });
  } catch (error) {
    console.error('Erreur récupération demandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des demandes'
    });
  }
});

module.exports = router;