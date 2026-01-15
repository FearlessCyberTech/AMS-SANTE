const Beneficiaire = require('../models/Beneficiaire');

// Récupérer tous les bénéficiaires
exports.getAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      sexe,
      typePaiement,
      pays,
      statut 
    } = req.query;
    
    const filters = {};
    if (sexe && sexe !== 'all') filters.sexe = sexe;
    if (typePaiement && typePaiement !== 'all') filters.typePaiement = typePaiement;
    if (pays && pays !== 'all') filters.pays = pays;
    if (statut && statut !== 'all') filters.statut = statut;
    
    const result = await Beneficiaire.getAll({ 
      page, 
      limit, 
      search, 
      ...filters 
    });
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur getAll:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Récupérer un bénéficiaire par ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const beneficiaire = await Beneficiaire.getById(id);
    
    if (!beneficiaire) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bénéficiaire non trouvé' 
      });
    }
    
    res.json({ 
      success: true, 
      data: beneficiaire 
    });
  } catch (error) {
    console.error('❌ Erreur getById:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Créer un bénéficiaire
exports.create = async (req, res) => {
  try {
    const beneficiaireData = req.body;
    const utilisateur = req.user?.username || 'SYSTEM';
    
    // Validation des données requises
    if (!beneficiaireData.NOM_BEN) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le nom est obligatoire' 
      });
    }
    
    if (!beneficiaireData.COD_PAY) {
      beneficiaireData.COD_PAY = 'CMF';
    }
    
    const newId = await Beneficiaire.create(beneficiaireData, utilisateur);
    
    res.status(201).json({ 
      success: true, 
      message: 'Bénéficiaire créé avec succès',
      id: newId 
    });
  } catch (error) {
    console.error('❌ Erreur create:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Mettre à jour un bénéficiaire
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const beneficiaireData = req.body;
    const utilisateur = req.user?.username || 'SYSTEM';
    
    await Beneficiaire.update(id, beneficiaireData, utilisateur);
    
    res.json({ 
      success: true, 
      message: 'Bénéficiaire mis à jour avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur update:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Supprimer un bénéficiaire
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { raison } = req.body;
    const utilisateur = req.user?.username || 'SYSTEM';
    
    await Beneficiaire.delete(id, utilisateur, raison);
    
    res.json({ 
      success: true, 
      message: 'Bénéficiaire retiré avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur delete:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Suspendre un bénéficiaire
exports.suspend = async (req, res) => {
  try {
    const { id } = req.params;
    const { raison } = req.body;
    const utilisateur = req.user?.username || 'SYSTEM';
    
    await Beneficiaire.suspend(id, utilisateur, raison);
    
    res.json({ 
      success: true, 
      message: 'Bénéficiaire suspendu avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur suspend:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Récupérer les statistiques
exports.getStats = async (req, res) => {
  try {
    const stats = await Beneficiaire.getStats();
    res.json({ 
      success: true, 
      data: stats 
    });
  } catch (error) {
    console.error('❌ Erreur getStats:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Rechercher des bénéficiaires
exports.search = async (req, res) => {
  try {
    const criteria = req.query;
    const results = await Beneficiaire.search(criteria);
    res.json({ 
      success: true, 
      data: results 
    });
  } catch (error) {
    console.error('❌ Erreur search:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Exporter les bénéficiaires
exports.export = async (req, res) => {
  try {
    const pool = await require('../config/database').getConnection();
    
    const query = `
      SELECT 
        b.ID_BEN,
        b.NOM_BEN,
        b.PRE_BEN,
        b.SEX_BEN,
        FORMAT(b.NAI_BEN, 'dd/MM/yyyy') as DATE_NAISSANCE,
        dbo.fCalculAge(b.NAI_BEN, GETDATE()) as AGE,
        b.IDENTIFIANT_NATIONAL,
        b.NUM_PASSEPORT,
        b.TELEPHONE_MOBILE,
        b.EMAIL,
        b.PROFESSION,
        p.LIB_PAY as PAYS,
        FORMAT(b.DAT_CREUTIL, 'dd/MM/yyyy HH:mm') as DATE_INSCRIPTION,
        CASE WHEN b.SUSPENSION_DATE IS NOT NULL THEN 'Suspendu' 
             WHEN b.RETRAIT_DATE IS NOT NULL THEN 'Retiré' 
             ELSE 'Actif' END as STATUT
      FROM [core].[BENEFICIAIRE] b
      LEFT JOIN [ref].[PAYS] p ON b.COD_PAY = p.COD_PAY
      ORDER BY b.NOM_BEN, b.PRE_BEN
    `;
    
    const result = await pool.request().query(query);
    
    // Convertir en CSV
    const headers = [
      'ID', 'Nom', 'Prénom', 'Sexe', 'Date Naissance', 'Age',
      'Identifiant National', 'Passeport', 'Téléphone', 'Email',
      'Profession', 'Pays', 'Date Inscription', 'Statut'
    ];
    
    const rows = result.recordset.map(b => [
      b.ID_BEN,
      b.NOM_BEN,
      b.PRE_BEN,
      b.SEX_BEN,
      b.DATE_NAISSANCE,
      b.AGE,
      b.IDENTIFIANT_NATIONAL,
      b.NUM_PASSEPORT,
      b.TELEPHONE_MOBILE,
      b.EMAIL,
      b.PROFESSION,
      b.PAYS,
      b.DATE_INSCRIPTION,
      b.STATUT
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=beneficiaires.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('❌ Erreur export:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};