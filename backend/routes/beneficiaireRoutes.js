const express = require('express');
const router = express.Router();
const beneficiaireController = require('../controllers/beneficiaireController');
const authMiddleware = require('../middleware/auth');

// Appliquer l'authentification à toutes les routes
router.use(authMiddleware);

// Routes CRUD
router.get('/', beneficiaireController.getAll);
router.get('/stats', beneficiaireController.getStats);
router.get('/search', beneficiaireController.search);
router.get('/export', beneficiaireController.export);
router.get('/:id', beneficiaireController.getById);
router.post('/', beneficiaireController.create);
router.put('/:id', beneficiaireController.update);
router.delete('/:id', beneficiaireController.delete);
router.post('/:id/suspend', beneficiaireController.suspend);
router.get('/assures-principaux/search', beneficiaireController.searchAssuresPrincipaux);

module.exports = router;