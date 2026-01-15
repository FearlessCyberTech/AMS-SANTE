const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Récupérer tous les bénéficiaires avec informations des pays
router.get('/', auth, async (req, res) => {
  try {
    const [beneficiaires] = await db.execute(`
      SELECT 
        b.ID_BEN as id_ben,
        b.COD_PAY as cod_pay,
        b.NOM_BEN as nom_ben,
        b.FIL_BEN as fil_ben,
        b.PRE_BEN as pre_ben,
        b.SEX_BEN as sex_ben,
        b.NAI_BEN as nai_ben,
        b.LIEU_NAISSANCE as lieu_naissance,
        b.GROUPE_SANGUIN as groupe_sanguin,
        b.RHESUS as rhesus,
        b.PROFESSION as profession,
        b.SITUATION_FAMILIALE as situation_familiale,
        b.NOMBRE_ENFANTS as nombre_enfants,
        b.LANGUE_MATERNEL as langue_maternel,
        b.LANGUE_PARLEE as langue_parlee,
        b.RELIGION as religion,
        b.NIVEAU_ETUDE as niveau_etude,
        b.IDENTIFIANT_NATIONAL as identifiant_national,
        b.NUM_PASSEPORT as num_passeport,
        b.SUSPENSION_DATE as suspension_date,
        b.RETRAIT_DATE as retrait_date,
        b.ANTECEDENTS_MEDICAUX as antecedents_medicaux,
        b.ALLERGIES as allergies,
        b.TRAITEMENTS_EN_COURS as traitements_en_cours,
        b.CONTACT_URGENCE as contact_urgence,
        b.TEL_URGENCE as tel_urgence,
        b.EMAIL as email,
        b.TELEPHONE as telephone,
        b.TELEPHONE_MOBILE as telephone_mobile,
        b.PHOTO as photo,
        b.EMPLOYEUR as employeur,
        b.SALAIRE as salaire,
        b.ZONE_HABITATION as zone_habitation,
        b.TYPE_HABITAT as type_habitat,
        b.ACCES_EAU as acces_eau,
        b.ACCES_ELECTRICITE as acces_electricite,
        b.DISTANCE_CENTRE_SANTE as distance_centre_sante,
        b.MOYEN_TRANSPORT as moyen_transport,
        b.ASSURANCE_PRIVE as assurance_prive,
        b.MUTUELLE as mutuelle,
        b.COD_CREUTIL as cod_creutil,
        b.DAT_CREUTIL as dat_creutil,
        b.COD_MODUTIL as cod_modutil,
        b.DAT_MODUTIL as dat_modutil,
        p.LIB_PAY as lib_pay,
        p.LANGUE_DEFAUT as langue_defaut,
        p.CODE_TELEPHONE as code_telephone
      FROM [core].[BENEFICIAIRE] b
      LEFT JOIN [ref].[PAYS] p ON b.COD_PAY = p.COD_PAY
      WHERE b.RETRAIT_DATE IS NULL
      ORDER BY b.NOM_BEN, b.PRE_BEN
    `);

    res.json({
      success: true,
      beneficiaires // Changé de 'data' à 'beneficiaires' pour correspondre au frontend
    });
  } catch (error) {
    console.error('Erreur récupération bénéficiaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des bénéficiaires',
      error: error.message
    });
  }
});

// Récupérer un bénéficiaire par ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const [beneficiaires] = await db.execute(`
      SELECT 
        b.*,
        p.LIB_PAY as lib_pay
      FROM [core].[BENEFICIAIRE] b
      LEFT JOIN [ref].[PAYS] p ON b.COD_PAY = p.COD_PAY
      WHERE b.ID_BEN = ?
    `, [id]);

    if (beneficiaires.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bénéficiaire non trouvé'
      });
    }

    res.json({
      success: true,
      beneficiaire: beneficiaires[0] // Changé de 'data' à 'beneficiaire'
    });
  } catch (error) {
    console.error('Erreur récupération bénéficiaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Routes pour les références (ajoutées)
router.get('/ref/pays', auth, async (req, res) => {
  try {
    const [pays] = await db.execute(`
      SELECT COD_PAY as cod_pay, LIB_PAY as lib_pay, LANGUE_DEFAUT as langue_defaut, CODE_TELEPHONE as code_telephone
      FROM [ref].[PAYS] 
      ORDER BY LIB_PAY
    `);

    res.json({
      success: true,
      pays
    });
  } catch (error) {
    console.error('Erreur récupération pays:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des pays'
    });
  }
});

// Créer un nouveau bénéficiaire - CORRIGÉ pour correspondre à app.js
router.post('/', auth, async (req, res) => {
  const {
    COD_PAY, NOM_BEN, PRE_BEN, FIL_BEN, SEX_BEN, NAI_BEN,
    LIEU_NAISSANCE, IDENTIFIANT_NATIONAL, NUM_PASSEPORT,
    TELEPHONE_MOBILE, TELEPHONE, EMAIL, GROUPE_SANGUIN, RHESUS,
    PROFESSION, EMPLOYEUR, SALAIRE, SITUATION_FAMILIALE,
    NOMBRE_ENFANTS, LANGUE_MATERNEL, LANGUE_PARLEE, RELIGION,
    NIVEAU_ETUDE, ANTECEDENTS_MEDICAUX, ALLERGIES,
    TRAITEMENTS_EN_COURS, CONTACT_URGENCE, TEL_URGENCE,
    ZONE_HABITATION, TYPE_HABITAT, ACCES_EAU, ACCES_ELECTRICITE,
    DISTANCE_CENTRE_SANTE, MOYEN_TRANSPORT, ASSURANCE_PRIVE, MUTUELLE,
    COD_PAI, STATUT_ACE, ID_ASSURE_PRINCIPAL
  } = req.body;

  try {
    const utilisateur = req.user?.username || 'system';
    
    // Utiliser la procédure stockée
    const [result] = await db.execute(`
      EXEC [core].[usp_AddBeneficiaireRegion] 
        @cod_pay = ?,
        @nom_ben = ?,
        @pre_ben = ?,
        @sex_ben = ?,
        @nai_ben = ?,
        @identifiant_national = ?,
        @telephone = ?,
        @utilisateur = ?
    `, [COD_PAY, NOM_BEN, PRE_BEN, SEX_BEN, NAI_BEN, 
        IDENTIFIANT_NATIONAL, TELEPHONE_MOBILE, utilisateur]);

    let beneficiaireId;
    
    // Gérer le résultat selon la structure retournée
    if (result && result.affectedRows > 0) {
      // Récupérer le dernier ID inséré
      const [lastId] = await db.execute('SELECT LAST_INSERT_ID() as id');
      beneficiaireId = lastId[0].id;
    } else if (result && result.NewBeneficiaireID) {
      beneficiaireId = result.NewBeneficiaireID;
    } else if (Array.isArray(result) && result.length > 0 && result[0].ID_BEN) {
      beneficiaireId = result[0].ID_BEN;
    } else {
      throw new Error('Aucun ID de bénéficiaire retourné');
    }

    // Mettre à jour les informations supplémentaires
    await db.execute(`
      UPDATE [core].[BENEFICIAIRE] 
      SET 
        FIL_BEN = ?,
        LIEU_NAISSANCE = ?,
        NUM_PASSEPORT = ?,
        TELEPHONE = ?,
        EMAIL = ?,
        GROUPE_SANGUIN = ?,
        RHESUS = ?,
        PROFESSION = ?,
        EMPLOYEUR = ?,
        SALAIRE = ?,
        SITUATION_FAMILIALE = ?,
        NOMBRE_ENFANTS = ?,
        LANGUE_MATERNEL = ?,
        LANGUE_PARLEE = ?,
        RELIGION = ?,
        NIVEAU_ETUDE = ?,
        ANTECEDENTS_MEDICAUX = ?,
        ALLERGIES = ?,
        TRAITEMENTS_EN_COURS = ?,
        CONTACT_URGENCE = ?,
        TEL_URGENCE = ?,
        ZONE_HABITATION = ?,
        TYPE_HABITAT = ?,
        ACCES_EAU = ?,
        ACCES_ELECTRICITE = ?,
        DISTANCE_CENTRE_SANTE = ?,
        MOYEN_TRANSPORT = ?,
        ASSURANCE_PRIVE = ?,
        MUTUELLE = ?,
        COD_PAI = ?,
        STATUT_ACE = ?,
        ID_ASSURE_PRINCIPAL = ?,
        COD_MODUTIL = ?,
        DAT_MODUTIL = NOW()
      WHERE ID_BEN = ?
    `, [
      FIL_BEN, LIEU_NAISSANCE, NUM_PASSEPORT, TELEPHONE, EMAIL,
      GROUPE_SANGUIN, RHESUS, PROFESSION, EMPLOYEUR, SALAIRE,
      SITUATION_FAMILIALE, NOMBRE_ENFANTS || 0, LANGUE_MATERNEL,
      LANGUE_PARLEE, RELIGION, NIVEAU_ETUDE, ANTECEDENTS_MEDICAUX,
      ALLERGIES, TRAITEMENTS_EN_COURS, CONTACT_URGENCE, TEL_URGENCE,
      ZONE_HABITATION, TYPE_HABITAT, ACCES_EAU ? 1 : 0,
      ACCES_ELECTRICITE ? 1 : 0, DISTANCE_CENTRE_SANTE || 0, MOYEN_TRANSPORT,
      ASSURANCE_PRIVE ? 1 : 0, MUTUELLE, COD_PAI || 1, STATUT_ACE, 
      ID_ASSURE_PRINCIPAL, utilisateur, beneficiaireId
    ]);

    // Récupérer le bénéficiaire créé
    const [beneficiaire] = await db.execute(`
      SELECT b.*, p.LIB_PAY as lib_pay
      FROM [core].[BENEFICIAIRE] b
      LEFT JOIN [ref].[PAYS] p ON b.COD_PAY = p.COD_PAY
      WHERE b.ID_BEN = ?
    `, [beneficiaireId]);

    res.status(201).json({
      success: true,
      message: 'Bénéficiaire créé avec succès',
      beneficiaire: beneficiaire[0],
      id: beneficiaireId
    });
  } catch (error) {
    console.error('Erreur création bénéficiaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du bénéficiaire',
      error: error.message
    });
  }
});

// Mettre à jour un bénéficiaire - CORRIGÉ pour correspondre à app.js
router.put('/:id', auth, async (req, res) => {
  const beneficiaireId = req.params.id;
  const updateData = req.body;

  try {
    const utilisateur = req.user?.username || 'system';
    
    // Construire dynamiquement la requête de mise à jour
    const fields = [];
    const values = [];
    
    // Ajouter les champs de mise à jour
    Object.keys(updateData).forEach(key => {
      if (key !== 'ID_BEN' && key !== 'id') {
        fields.push(`${key} = ?`);
        
        // Convertir les types si nécessaire
        let value = updateData[key];
        if (key === 'ACCES_EAU' || key === 'ACCES_ELECTRICITE' || key === 'ASSURANCE_PRIVE') {
          value = value ? 1 : 0;
        } else if (key === 'NOMBRE_ENFANTS' || key === 'DISTANCE_CENTRE_SANTE' || key === 'COD_PAI') {
          value = parseInt(value) || 0;
        }
        
        values.push(value);
      }
    });
    
    // Ajouter les champs de suivi
    fields.push('COD_MODUTIL = ?');
    fields.push('DAT_MODUTIL = NOW()');
    values.push(utilisateur);
    
    // Ajouter l'ID à la fin
    values.push(beneficiaireId);
    
    const query = `
      UPDATE [core].[BENEFICIAIRE] 
      SET ${fields.join(', ')}
      WHERE ID_BEN = ?
    `;
    
    await db.execute(query, values);

    // Journaliser la modification
    await db.execute(`
      INSERT INTO [audit].[SYSTEM_AUDIT] 
        (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION)
      VALUES ('UPDATE', 'BENEFICIAIRE', ?, ?, 'Modification bénéficiaire')
    `, [beneficiaireId, utilisateur]);

    res.json({
      success: true,
      message: 'Bénéficiaire mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur mise à jour bénéficiaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du bénéficiaire',
      error: error.message
    });
  }
});

// Supprimer un bénéficiaire (soft delete)
router.delete('/:id', auth, async (req, res) => {
  const beneficiaireId = req.params.id;
  
  try {
    const utilisateur = req.user?.username || 'system';
    
    await db.execute(`
      UPDATE [core].[BENEFICIAIRE] 
      SET 
        RETRAIT_DATE = NOW(),
        COD_MODUTIL = ?,
        DAT_MODUTIL = NOW()
      WHERE ID_BEN = ?
    `, [utilisateur, beneficiaireId]);

    // Journaliser la suppression
    await db.execute(`
      INSERT INTO [audit].[SYSTEM_AUDIT] 
        (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION)
      VALUES ('DELETE', 'BENEFICIAIRE', ?, ?, 'Suppression bénéficiaire')
    `, [beneficiaireId, utilisateur]);

    res.json({
      success: true,
      message: 'Bénéficiaire supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression bénéficiaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du bénéficiaire'
    });
  }
});

// Récupérer les statistiques par pays
router.get('/statistiques/pays', auth, async (req, res) => {
  try {
    const [statistiques] = await db.execute(`
      SELECT * FROM [core].[V_BENEFICIAIRES_PAR_PAYS]
      ORDER BY LIB_PAY
    `);

    res.json({
      success: true,
      statistiques
    });
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
});

// Recherche avancée - CORRIGÉ
router.post('/recherche', auth, async (req, res) => {
  const { terme, cod_pay, sex_ben, date_debut, date_fin } = req.body;
  
  try {
    let query = `
      SELECT 
        b.ID_BEN as id_ben,
        b.COD_PAY as cod_pay,
        b.NOM_BEN as nom_ben,
        b.PRE_BEN as pre_ben,
        b.SEX_BEN as sex_ben,
        b.NAI_BEN as nai_ben,
        b.IDENTIFIANT_NATIONAL as identifiant_national,
        b.TELEPHONE_MOBILE as telephone_mobile,
        b.GROUPE_SANGUIN as groupe_sanguin,
        b.RHESUS as rhesus,
        b.SITUATION_FAMILIALE as situation_familiale,
        b.EMAIL as email,
        p.LIB_PAY as lib_pay
      FROM [core].[BENEFICIAIRE] b
      LEFT JOIN [ref].[PAYS] p ON b.COD_PAY = p.COD_PAY
      WHERE b.RETRAIT_DATE IS NULL
    `;
    const params = [];
    
    if (terme) {
      query += ` AND (
        b.NOM_BEN LIKE ? OR 
        b.PRE_BEN LIKE ? OR 
        b.IDENTIFIANT_NATIONAL LIKE ? OR 
        b.TELEPHONE_MOBILE LIKE ?
      )`;
      const likeTerme = `%${terme}%`;
      params.push(likeTerme, likeTerme, likeTerme, likeTerme);
    }
    
    if (cod_pay) {
      query += ` AND b.COD_PAY = ?`;
      params.push(cod_pay);
    }
    
    if (sex_ben) {
      query += ` AND b.SEX_BEN = ?`;
      params.push(sex_ben);
    }
    
    if (date_debut) {
      query += ` AND b.NAI_BEN >= ?`;
      params.push(date_debut);
    }
    
    if (date_fin) {
      query += ` AND b.NAI_BEN <= ?`;
      params.push(date_fin);
    }
    
    query += ` ORDER BY b.NOM_BEN, b.PRE_BEN`;
    
    const [resultats] = await db.execute(query, params);
    
    res.json({
      success: true,
      beneficiaires: resultats,
      total: resultats.length
    });
  } catch (error) {
    console.error('Erreur recherche bénéficiaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la recherche'
    });
  }
});

// Recherche par identifiant national
router.get('/identifiant/:identifiant', auth, async (req, res) => {
  try {
    const { identifiant } = req.params;
    const [beneficiaires] = await db.execute(`
      SELECT b.*, p.LIB_PAY as lib_pay
      FROM [core].[BENEFICIAIRE] b
      LEFT JOIN [ref].[PAYS] p ON b.COD_PAY = p.COD_PAY
      WHERE b.IDENTIFIANT_NATIONAL = ? AND b.RETRAIT_DATE IS NULL
    `, [identifiant]);

    res.json({
      success: true,
      beneficiaire: beneficiaires.length > 0 ? beneficiaires[0] : null
    });
  } catch (error) {
    console.error('Erreur recherche par identifiant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Recherche avec filtres - CORRIGÉ
router.post('/search', auth, async (req, res) => {
  try {
    const { EMPLOYEUR, COD_PAI, COD_PAY } = req.body;
    
    let query = `
      SELECT 
        b.ID_BEN,
        b.NOM_BEN,
        b.PRE_BEN,
        b.IDENTIFIANT_NATIONAL,
        b.TELEPHONE_MOBILE,
        b.EMAIL,
        b.COD_PAI,
        b.EMPLOYEUR,
        b.COD_PAY,
        b.SEX_BEN,
        b.NAI_BEN,
        dbo.fCalculAge(b.NAI_BEN, NOW()) AS AGE
      FROM [core].[BENEFICIAIRE] b
      WHERE b.RETRAIT_DATE IS NULL
    `;
    
    const params = [];
    
    if (EMPLOYEUR) {
      query += ' AND b.EMPLOYEUR = ?';
      params.push(EMPLOYEUR);
    }
    
    if (COD_PAI) {
      query += ' AND b.COD_PAI = ?';
      params.push(parseInt(COD_PAI));
    }
    
    if (COD_PAY) {
      query += ' AND b.COD_PAY = ?';
      params.push(COD_PAY);
    }
    
    query += ' ORDER BY b.NOM_BEN, b.PRE_BEN';
    
    const [beneficiaires] = await db.execute(query, params);
    
    res.json({ 
      success: true, 
      beneficiaires: beneficiaires || [] 
    });
    
  } catch (error) {
    console.error('Erreur recherche bénéficiaires:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la recherche' 
    });
  }
});


module.exports = router;