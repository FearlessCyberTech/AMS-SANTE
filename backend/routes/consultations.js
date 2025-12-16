const express = require('express');
const router = express.Router();
const consultationsController = require('../controllers/consultationController');
const { authenticateToken } = require('../middleware/');

// Routes protégées par authentification
router.use(authenticateToken);

// Routes pour les consultations
router.get('/medecins', consultationsController.getMedecins);
router.get('/types-consultation', consultationsController.getTypesConsultation);
router.get('/search-patients', consultationsController.searchPatients);
router.get('/search-by-card', consultationsController.searchByCard);
router.get('/type-paiement/:idBen', consultationsController.getTypePaiementBeneficiaire);
router.post('/', consultationsController.create);
router.get('/:id', consultationsController.getConsultationDetails);
router.get('/patient/:idBen', consultationsController.getPatientConsultations);

module.exports = router;