// middleware/validation.js
const { body, validationResult, param } = require('express-validator');

// Validation pour la connexion
const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Le nom d\'utilisateur est requis')
    .trim()
    .isLength({ min: 3, max: 32 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 32 caractères')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores'),
  
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),

  // Middleware pour vérifier les résultats de la validation
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation pour la création/modification d'utilisateur
const userValidation = [
  body('LOG_UTI')
    .notEmpty()
    .withMessage('Le login est requis')
    .trim()
    .isLength({ min: 3, max: 32 })
    .withMessage('Le login doit contenir entre 3 et 32 caractères')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Le login ne peut contenir que des lettres, chiffres et underscores'),
  
  body('NOM_UTI')
    .notEmpty()
    .withMessage('Le nom est requis')
    .trim()
    .isLength({ min: 2, max: 64 })
    .withMessage('Le nom doit contenir entre 2 et 64 caractères'),
  
  body('PRE_UTI')
    .notEmpty()
    .withMessage('Le prénom est requis')
    .trim()
    .isLength({ min: 2, max: 64 })
    .withMessage('Le prénom doit contenir entre 2 et 64 caractères'),
  
  body('EMAIL_UTI')
    .optional()
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  
  body('PROFIL_UTI')
    .notEmpty()
    .withMessage('Le profil est requis')
    .isIn(['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'])
    .withMessage('Profil invalide'),
  
  body('COD_PAY')
    .optional()
    .isIn(['CMF', 'CMA', 'RCA', 'TCD', 'GNQ', 'BDI', 'COG'])
    .withMessage('Code pays invalide'),
  
  body('SEX_UTI')
    .optional()
    .isIn(['M', 'F', 'O'])
    .withMessage('Sexe invalide (M, F ou O)'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation utilisateur',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation pour la création/modification de bénéficiaire
const beneficiaireValidation = [
  body('NOM_BEN')
    .notEmpty()
    .withMessage('Le nom du bénéficiaire est requis')
    .trim()
    .isLength({ min: 2, max: 64 })
    .withMessage('Le nom doit contenir entre 2 et 64 caractères'),
  
  body('PRE_BEN')
    .optional()
    .trim()
    .isLength({ min: 2, max: 64 })
    .withMessage('Le prénom doit contenir entre 2 et 64 caractères'),
  
  body('SEX_BEN')
    .optional()
    .isIn(['M', 'F', 'O'])
    .withMessage('Sexe invalide (M, F ou O)'),
  
  body('NAI_BEN')
    .optional()
    .isDate()
    .withMessage('Date de naissance invalide'),
  
  body('GROUPE_SANGUIN')
    .optional()
    .isIn(['A', 'B', 'AB', 'O'])
    .withMessage('Groupe sanguin invalide (A, B, AB ou O)'),
  
  body('RHESUS')
    .optional()
    .isIn(['+', '-'])
    .withMessage('Rhésus invalide (+ ou -)'),
  
  body('COD_PAY')
    .optional()
    .isIn(['CMF', 'CMA', 'RCA', 'TCD', 'GNQ', 'BDI', 'COG'])
    .withMessage('Code pays invalide'),
  
  body('TELEPHONE_MOBILE')
    .optional()
    .matches(/^\+?[0-9\s\-\(\)]{10,20}$/)
    .withMessage('Numéro de téléphone mobile invalide'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation bénéficiaire',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation pour la création/modification de prestataire
const prestataireValidation = [
  body('NOM_PRESTATAIRE')
    .notEmpty()
    .withMessage('Le nom du prestataire est requis')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  
  body('TYPE_PRESTATAIRE')
    .notEmpty()
    .withMessage('Le type de prestataire est requis')
    .isIn(['Medecin', 'Infirmier', 'Pharmacien', 'Technicien', 'Administratif'])
    .withMessage('Type de prestataire invalide'),
  
  body('SPECIALITE')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La spécialité ne doit pas dépasser 100 caractères'),
  
  body('NUM_LICENCE')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Le numéro de licence ne doit pas dépasser 50 caractères'),
  
  body('COD_PAY')
    .optional()
    .isIn(['CMF', 'CMA', 'RCA', 'TCD', 'GNQ', 'BDI', 'COG'])
    .withMessage('Code pays invalide'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation prestataire',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation pour les IDs (paramètres de route)
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID invalide (doit être un nombre entier positif)'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation ID',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation pour le changement de mot de passe
const changePasswordValidation = [
  body('oldPassword')
    .notEmpty()
    .withMessage('L\'ancien mot de passe est requis'),
  
  body('newPassword')
    .notEmpty()
    .withMessage('Le nouveau mot de passe est requis')
    .isLength({ min: 8 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
    .matches(/[A-Z]/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule')
    .matches(/[a-z]/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule')
    .matches(/[0-9]/)
    .withMessage('Le nouveau mot de passe doit contenir au moins un chiffre')
    .custom((value, { req }) => value !== req.body.oldPassword)
    .withMessage('Le nouveau mot de passe doit être différent de l\'ancien'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('La confirmation du mot de passe est requise')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Les mots de passe ne correspondent pas'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation changement de mot de passe',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation pour les recherches
const searchValidation = [
  body('searchTerm')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le terme de recherche doit contenir au moins 2 caractères'),
  
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation recherche',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation pour les dates
const dateRangeValidation = [
  body('dateDebut')
    .optional()
    .isDate()
    .withMessage('Date de début invalide'),
  
  body('dateFin')
    .optional()
    .isDate()
    .withMessage('Date de fin invalide')
    .custom((value, { req }) => {
      if (req.body.dateDebut && new Date(value) < new Date(req.body.dateDebut)) {
        throw new Error('La date de fin doit être postérieure à la date de début');
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation période',
        errors: errors.array()
      });
    }
    next();
  }
];

// Middleware générique pour gérer les erreurs de validation
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  };
};

module.exports = {
  loginValidation,
  userValidation,
  beneficiaireValidation,
  prestataireValidation,
  idValidation,
  changePasswordValidation,
  searchValidation,
  dateRangeValidation,
  validate
};