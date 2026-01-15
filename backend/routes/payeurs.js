// backend/routes/payeurs.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Récupérer tous les payeurs
router.get('/', auth, async (req, res) => {
  try {
    const [payeurs] = await db.execute(`
      SELECT * FROM payeurs 
      WHERE is_active = true
      ORDER BY nom
    `);

    res.json({
      success: true,
      data: payeurs
    });
  } catch (error) {
    console.error('Erreur récupération payeurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des payeurs'
    });
  }
});

// Créer un nouveau payeur
router.post('/', auth, async (req, res) => {
  try {
    const {
      nom,
      type,
      code_payeur,
      adresse,
      telephone,
      email,
      taux_prise_en_charge,
      delai_paiement
    } = req.body;

    const [result] = await db.execute(`
      INSERT INTO payeurs (
        nom, type, code_payeur, adresse, telephone, email, 
        taux_prise_en_charge, delai_paiement
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nom, type, code_payeur, adresse, telephone, email,
      taux_prise_en_charge, delai_paiement
    ]);

    res.json({
      success: true,
      message: 'Payeur créé avec succès',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('Erreur création payeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du payeur'
    });
  }
});

// Mettre à jour un payeur
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const [result] = await db.execute(
      'UPDATE payeurs SET ? WHERE id = ?',
      [updateData, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payeur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Payeur mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur mise à jour payeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du payeur'
    });
  }
});

// Supprimer un payeur (désactivation)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'UPDATE payeurs SET is_active = false WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payeur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Payeur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression payeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du payeur'
    });
  }
});

module.exports = router;    