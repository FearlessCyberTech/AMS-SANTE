// backend/routes/consultations.js
const express = require('express');
const router = express.Router();
const ConsultationController = require('../controllers/consultationController');
const Consultation = require('../models/Consultation');

// Créer une consultation
router.post('/create', async (req, res) => {
  try {
    const consultationData = req.body;
    
    // Validation basique
    if (!consultationData.COD_BEN || !consultationData.COD_PRE || !consultationData.TYPE_CONSULTATION) {
      return res.status(400).json({ 
        success: false, 
        message: 'Champs obligatoires manquants' 
      });
    }
    
    const consultationId = await Consultation.create(consultationData);
    
    res.json({
      success: true,
      consultationId: consultationId,
      message: 'Consultation créée avec succès'
    });
  } catch (error) {
    console.error('Erreur création consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la consultation',
      error: error.message
    });
  }
});

// Obtenir toutes les consultations
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const pool = await require('../config/database').getConnection();
    
    const query = `
      SELECT TOP ${limit} 
        c.COD_CONS, c.DATE_CONSULTATION, c.TYPE_CONSULTATION,
        c.MONTANT_CONSULTATION, c.STATUT_PAIEMENT, c.URGENT,
        b.NOM_BEN, b.PRE_BEN, b.IDENTIFIANT_NATIONAL,
        p.NOM_PRESTATAIRE, p.SPECIALITE
      FROM [core].[CONSULTATION] c
      INNER JOIN [core].[BENEFICIAIRE] b ON c.COD_BEN = b.ID_BEN
      LEFT JOIN [core].[PRESTATAIRE] p ON c.COD_PRE = p.COD_PRE
      ORDER BY c.DATE_CONSULTATION DESC
    `;
    
    const result = await pool.request().query(query);
    
    res.json({
      success: true,
      consultations: result.recordset
    });
  } catch (error) {
    console.error('Erreur récupération consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des consultations'
    });
  }
});

// Obtenir une consultation par ID
router.get('/:id', async (req, res) => {
  try {
    const consultationId = req.params.id;
    const consultation = await Consultation.getById(consultationId);
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation non trouvée'
      });
    }
    
    res.json({
      success: true,
      consultation: consultation
    });
  } catch (error) {
    console.error('Erreur récupération consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la consultation'
    });
  }
});

// Générer feuille de prise en charge
router.get('/feuille-prise-en-charge/:id', async (req, res) => {
  try {
    const consultationId = req.params.id;
    const feuille = await Consultation.generateFeuillePriseEnCharge(consultationId);
    
    res.json({
      success: true,
      feuille: feuille
    });
  } catch (error) {
    console.error('Erreur génération feuille:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération de la feuille'
    });
  }
});

// Obtenir les médecins
router.get('/medecins', async (req, res) => {
  try {
    const medecins = await Consultation.getMedecins();
    
    res.json({
      success: true,
      medecins: medecins
    });
  } catch (error) {
    console.error('Erreur récupération médecins:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des médecins'
    });
  }
});

// Obtenir les types de consultation
router.get('/types', async (req, res) => {
  try {
    const types = await Consultation.getTypesConsultation();
    
    res.json({
      success: true,
      types: types
    });
  } catch (error) {
    console.error('Erreur récupération types:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des types de consultation'
    });
  }
});

// Rechercher des patients
router.get('/search-patients', async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || 20;
    
    const pool = await require('../config/database').getConnection();
    
    const query = `
      SELECT TOP ${limit} 
        ID_BEN, NOM_BEN, PRE_BEN, AGE, SEX_BEN,
        TELEPHONE_MOBILE, IDENTIFIANT_NATIONAL, NAI_BEN
      FROM [core].[BENEFICIAIRE]
      WHERE 
        NOM_BEN LIKE @search OR
        PRE_BEN LIKE @search OR
        TELEPHONE_MOBILE LIKE @search OR
        IDENTIFIANT_NATIONAL LIKE @search
      ORDER BY NOM_BEN, PRE_BEN
    `;
    
    const result = await pool.request()
      .input('search', sql.NVarChar, `%${search}%`)
      .query(query);
    
    res.json({
      success: true,
      patients: result.recordset
    });
  } catch (error) {
    console.error('Erreur recherche patients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche des patients'
    });
  }
});

// Calculer le décompte
router.post('/calculate-decompte', (req, res) => {
  try {
    const { montantTotal, pourcentageCouverture = 80 } = req.body;
    
    const montantPrisEnCharge = (montantTotal * pourcentageCouverture) / 100;
    const resteCharge = montantTotal - montantPrisEnCharge;
    
    res.json({
      success: true,
      decompte: {
        montantTotal: parseFloat(montantTotal) || 0,
        montantPrisEnCharge: montantPrisEnCharge,
        resteCharge: resteCharge,
        pourcentageCouverture: parseFloat(pourcentageCouverture) || 0
      }
    });
  } catch (error) {
    console.error('Erreur calcul décompte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul du décompte'
    });
  }
});

module.exports = router;