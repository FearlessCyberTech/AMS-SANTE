const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Récupérer toutes les factures
router.get('/', auth, async (req, res) => {
  try {
    const [factures] = await db.execute(`
      SELECT f.*, 
             p.nom as payeur_nom
      FROM factures f
      LEFT JOIN payeurs p ON f.payeur_id = p.id
      ORDER BY f.date_emission DESC
    `);

    res.json({
      success: true,
      data: factures
    });
  } catch (error) {
    console.error('Erreur récupération factures:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des factures'
    });
  }
});

// Créer une nouvelle facture
router.post('/', auth, async (req, res) => {
  try {
    const {
      payeur_id,
      periode_debut,
      periode_fin,
      montant_total,
      date_emission,
      date_echeance
    } = req.body;

    // Générer un numéro de facture
    const [countResult] = await db.execute('SELECT COUNT(*) as count FROM factures WHERE YEAR(date_emission) = YEAR(CURDATE())');
    const numero_facture = `FACT-${new Date().getFullYear()}-${String(countResult[0].count + 1).padStart(4, '0')}`;

    const [result] = await db.execute(`
      INSERT INTO factures (
        numero_facture, payeur_id, periode_debut, periode_fin,
        montant_total, date_emission, date_echeance, statut, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'brouillon', ?)
    `, [
      numero_facture, payeur_id, periode_debut, periode_fin,
      montant_total, date_emission, date_echeance, req.user.id
    ]);

    res.json({
      success: true,
      message: 'Facture créée avec succès',
      data: {
        id: result.insertId,
        numero_facture
      }
    });
  } catch (error) {
    console.error('Erreur création facture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de la facture'
    });
  }
});

// Récupérer les statistiques des factures
router.get('/stats', auth, async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'payee' THEN 1 ELSE 0 END) as payees,
        SUM(CASE WHEN statut = 'envoyee' THEN 1 ELSE 0 END) as envoyees,
        SUM(CASE WHEN statut = 'partiellement_payee' THEN 1 ELSE 0 END) as partiellement_payees,
        SUM(montant_total) as total_montant,
        SUM(montant_paye) as total_paye
      FROM factures
    `);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Erreur récupération stats factures:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;