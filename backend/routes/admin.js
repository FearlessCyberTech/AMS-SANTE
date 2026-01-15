const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

// Middleware pour vérifier les droits admin (SuperAdmin ou Admin)
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'SuperAdmin' && req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Droits administrateur requis.'
    });
  }
  next();
};

// Récupérer les statistiques système
router.get('/stats', auth, requireAdmin, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM [security].[UTILISATEUR] WHERE ACTIF = 1) as total_utilisateurs,
        (SELECT COUNT(*) FROM [core].[BENEFICIAIRE] WHERE RETRAIT_DATE IS NULL) as total_beneficiaires,
        (SELECT COUNT(*) FROM [core].[CONSULTATION] WHERE CONVERT(DATE, DATE_CONSULTATION) = CONVERT(DATE, GETDATE())) as consultations_aujourdhui,
        (SELECT COUNT(*) FROM [core].[CONSULTATION] WHERE HOSPITALISATION = 1 AND CONVERT(DATE, DATE_CONSULTATION) = CONVERT(DATE, GETDATE())) as hospitalisations_aujourdhui,
        (SELECT COUNT(*) FROM [core].[CENTRE_SANTE] WHERE ACTIF = 1) as centres_actifs,
        (SELECT COUNT(*) FROM [core].[PRESTATAIRE] WHERE ACTIF = 1) as prestataires_actifs,
        (SELECT COUNT(*) FROM [core].[BENEFICIAIRE] WHERE COD_PAY = @cod_pay AND RETRAIT_DATE IS NULL) as beneficiaires_pays,
        (SELECT COUNT(*) FROM [core].[BENEFICIAIRE] WHERE COD_PAY = @cod_pay AND SEX_BEN = 'F' AND RETRAIT_DATE IS NULL) as femmes_pays,
        (SELECT COUNT(*) FROM [core].[BENEFICIAIRE] WHERE COD_PAY = @cod_pay AND SEX_BEN = 'M' AND RETRAIT_DATE IS NULL) as hommes_pays,
        (SELECT ISNULL(SUM(MONTANT_CONSULTATION), 0) FROM [core].[CONSULTATION] WHERE MONTH(DATE_CONSULTATION) = MONTH(GETDATE()) AND YEAR(DATE_CONSULTATION) = YEAR(GETDATE())) as ca_mois,
        (SELECT ISNULL(SUM(MONTANT_CONSULTATION), 0) FROM [core].[CONSULTATION] WHERE CONVERT(DATE, DATE_CONSULTATION) = CONVERT(DATE, GETDATE())) as ca_aujourdhui,
        (SELECT COUNT(*) FROM [core].[BENEFICIAIRE] WHERE SUSPENSION_DATE IS NOT NULL) as beneficiaires_suspendus,
        (SELECT COUNT(*) FROM [security].[UTILISATEUR] WHERE DATE_DERNIERE_CONNEXION > DATEADD(MINUTE, -15, GETDATE()) AND ACTIF = 1) as utilisateurs_actifs
    `;

    const request = connection.request();
    // Si l'utilisateur a un pays spécifique, utiliser ce pays, sinon utiliser CMF par défaut
    request.input('cod_pay', sql.VarChar, req.user.cod_pay || 'CMF');
    
    const result = await request.query(statsQuery);

    res.json({
      success: true,
      data: result.recordset[0],
      timestamp: new Date().toISOString(),
      pays: req.user.cod_pay || 'CMF'
    });
  } catch (error) {
    console.error('Erreur récupération stats admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    // La connexion est gérée par le pool, pas besoin de la fermer manuellement
  }
});

// Récupérer tous les utilisateurs
router.get('/users', auth, requireAdmin, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    
    const usersQuery = `
      SELECT 
        u.ID_UTI as id,
        u.LOG_UTI as username,
        u.NOM_UTI as nom,
        u.PRE_UTI as prenom,
        u.PROFIL_UTI as role,
        u.EMAIL_UTI as email,
        u.COD_PAY as cod_pay,
        u.SEX_UTI as sexe,
        u.ACTIF as is_active,
        u.SUPER_ADMIN as super_admin,
        u.FONCTION_UTI as fonction,
        u.SERVICE_UTI as service,
        u.DATE_DERNIERE_CONNEXION as derniere_connexion,
        u.DATE_PWD_CHANGE as dernier_changement_mdp,
        u.DAT_CREUTIL as created_at,
        u.DAT_MODUTIL as updated_at,
        p.LIB_PAY as nom_pays,
        -- Informations prestataire si applicable
        pr.COD_PRE as prestataire_id,
        pr.SPECIALITE as specialite,
        pr.NUM_LICENCE as numero_licence
      FROM [security].[UTILISATEUR] u
      LEFT JOIN [ref].[PAYS] p ON u.COD_PAY = p.COD_PAY
      LEFT JOIN [core].[PRESTATAIRE] pr ON u.EMAIL_UTI = pr.EMAIL AND u.PROFIL_UTI IN ('Medecin', 'Infirmier', 'Pharmacien', 'Technicien')
      ORDER BY u.DAT_CREUTIL DESC
    `;

    const request = connection.request();
    const result = await request.query(usersQuery);

    // Formater la réponse
    const formattedUsers = result.recordset.map(user => ({
      ...user,
      derniere_connexion: user.derniere_connexion ? new Date(user.derniere_connexion).toISOString() : null,
      created_at: user.created_at ? new Date(user.created_at).toISOString() : null,
      updated_at: user.updated_at ? new Date(user.updated_at).toISOString() : null,
      prestataire_info: user.prestataire_id ? {
        id: user.prestataire_id,
        specialite: user.specialite,
        numero_licence: user.numero_licence
      } : null
    }));

    res.json({
      success: true,
      data: formattedUsers,
      total: formattedUsers.length
    });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des utilisateurs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Récupérer les statistiques par pays (pour super admin seulement)
router.get('/stats-par-pays', auth, authorize('SuperAdmin'), async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    
    // Utiliser la vue existante ou créer une requête adaptée
    const statsPaysQuery = `
      SELECT 
        p.COD_PAY,
        p.LIB_PAY,
        p.LANGUE_DEFAUT,
        p.CAPITALE,
        p.ZONE_GEO,
        ISNULL(b.NOMBRE_BENEFICIAIRES, 0) as nombre_beneficiaires,
        ISNULL(b.HOMMES, 0) as hommes,
        ISNULL(b.FEMMES, 0) as femmes,
        ISNULL(b.AGE_MOYEN, 0) as age_moyen,
        ISNULL(b.SUSPENDUS, 0) as suspendus,
        ISNULL(b.RETIRES, 0) as retires,
        ISNULL(cs.centres_actifs, 0) as centres_actifs,
        ISNULL(pr.prestataires_actifs, 0) as prestataires_actifs,
        ISNULL(ct.consultations_total, 0) as consultations_total
      FROM [ref].[PAYS] p
      LEFT JOIN [core].[V_BENEFICIAIRES_PAR_PAYS] b ON p.COD_PAY = b.COD_PAY
      LEFT JOIN (
        SELECT COD_PAY, COUNT(*) as centres_actifs 
        FROM [core].[CENTRE_SANTE] 
        WHERE ACTIF = 1 
        GROUP BY COD_PAY
      ) cs ON p.COD_PAY = cs.COD_PAY
      LEFT JOIN (
        SELECT COD_PAY, COUNT(*) as prestataires_actifs 
        FROM [core].[PRESTATAIRE] 
        WHERE ACTIF = 1 
        GROUP BY COD_PAY
      ) pr ON p.COD_PAY = pr.COD_PAY
      LEFT JOIN (
        SELECT b.COD_PAY, COUNT(*) as consultations_total
        FROM [core].[CONSULTATION] c
        INNER JOIN [core].[BENEFICIAIRE] b ON c.COD_BEN = b.ID_BEN
        GROUP BY b.COD_PAY
      ) ct ON p.COD_PAY = ct.COD_PAY
      ORDER BY p.LIB_PAY
    `;

    const request = connection.request();
    const result = await request.query(statsPaysQuery);

    res.json({
      success: true,
      data: result.recordset,
      totalPays: result.recordset.length
    });
  } catch (error) {
    console.error('Erreur récupération stats par pays:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques par pays',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Récupérer les bénéficiaires par pays
router.get('/beneficiaires', auth, requireAdmin, async (req, res) => {
  let connection;
  try {
    const { page = 1, limit = 50, search = '', cod_pay } = req.query;
    const offset = (page - 1) * limit;
    
    connection = await getConnection();
    
    // Construire la requête avec filtres
    let whereClause = 'WHERE b.RETRAIT_DATE IS NULL';
    const inputs = [];
    
    if (cod_pay) {
      whereClause += ' AND b.COD_PAY = @cod_pay';
      inputs.push({ name: 'cod_pay', type: sql.VarChar, value: cod_pay });
    } else if (req.user.cod_pay && req.user.role !== 'SuperAdmin') {
      // Pour les non-super admin, filtrer par leur pays
      whereClause += ' AND b.COD_PAY = @user_cod_pay';
      inputs.push({ name: 'user_cod_pay', type: sql.VarChar, value: req.user.cod_pay });
    }
    
    if (search) {
      whereClause += ' AND (b.NOM_BEN LIKE @search OR b.PRE_BEN LIKE @search OR b.IDENTIFIANT_NATIONAL LIKE @search)';
      inputs.push({ name: 'search', type: sql.VarChar, value: `%${search}%` });
    }
    
    const beneficiairesQuery = `
      SELECT 
        b.ID_BEN as id,
        b.NOM_BEN as nom,
        b.FIL_BEN as fil,
        b.PRE_BEN as prenom,
        b.SEX_BEN as sexe,
        b.NAI_BEN as date_naissance,
        b.COD_PAY as cod_pay,
        b.GROUPE_SANGUIN as groupe_sanguin,
        b.RHESUS as rhesus,
        b.TELEPHONE_MOBILE as telephone,
        b.EMAIL as email,
        b.PROFESSION as profession,
        b.SITUATION_FAMILIALE as situation_familiale,
        b.LANGUE_MATERNEL as langue_maternelle,
        b.IDENTIFIANT_NATIONAL as identifiant_national,
        b.SUSPENSION_DATE as suspension_date,
        b.RETRAIT_DATE as retrait_date,
        b.DAT_CREUTIL as created_at,
        b.DAT_MODUTIL as updated_at,
        p.LIB_PAY as nom_pays,
        -- Informations ACE si disponible
        a.STATUT_ACE as statut_ace,
        a.ID_ASSURE_PRINCIPAL as id_assure_principal
      FROM [core].[BENEFICIAIRE] b
      LEFT JOIN [ref].[PAYS] p ON b.COD_PAY = p.COD_PAY
      LEFT JOIN [core].[BENEFICIAIRE_ACE] a ON b.ID_BEN = a.ID_BEN
      ${whereClause}
      ORDER BY b.DAT_CREUTIL DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;

    const request = connection.request();
    
    // Ajouter tous les paramètres
    inputs.forEach(input => {
      request.input(input.name, input.type, input.value);
    });
    
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, parseInt(limit));
    
    const result = await request.query(beneficiairesQuery);
    
    // Récupérer le total pour la pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM [core].[BENEFICIAIRE] b
      ${whereClause}
    `;
    
    const countRequest = connection.request();
    inputs.forEach(input => {
      if (input.name !== 'offset' && input.name !== 'limit') {
        countRequest.input(input.name, input.type, input.value);
      }
    });
    
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    res.json({
      success: true,
      data: result.recordset,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération bénéficiaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des bénéficiaires',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Récupérer les centres de santé
router.get('/centres-sante', auth, requireAdmin, async (req, res) => {
  let connection;
  try {
    const { cod_pay, type } = req.query;
    
    connection = await getConnection();
    
    // Construire la requête avec filtres
    let whereClause = 'WHERE cs.ACTIF = 1';
    const inputs = [];
    
    if (cod_pay) {
      whereClause += ' AND cs.COD_PAY = @cod_pay';
      inputs.push({ name: 'cod_pay', type: sql.VarChar, value: cod_pay });
    } else if (req.user.cod_pay && req.user.role !== 'SuperAdmin') {
      // Pour les non-super admin, filtrer par leur pays
      whereClause += ' AND cs.COD_PAY = @user_cod_pay';
      inputs.push({ name: 'user_cod_pay', type: sql.VarChar, value: req.user.cod_pay });
    }
    
    if (type) {
      whereClause += ' AND cs.TYPE_CENTRE = @type';
      inputs.push({ name: 'type', type: sql.VarChar, value: type });
    }
    
    const centresQuery = `
      SELECT 
        cs.COD_CEN as id,
        cs.NOM_CENTRE as nom,
        cs.TYPE_CENTRE as type,
        cs.CATEGORIE_CENTRE as categorie,
        cs.COD_PAY as cod_pay,
        cs.COD_REGION as region_id,
        cs.TELEPHONE as telephone,
        cs.EMAIL as email,
        cs.DIRECTEUR as directeur,
        cs.NOMBRE_LITS as nombre_lits,
        cs.NOMBRE_MEDECINS as nombre_medecins,
        cs.NOMBRE_INFIRMIERS as nombre_infirmiers,
        cs.SPECIALITES as specialites,
        cs.URGENCES_24H as urgences_24h,
        cs.LABORATOIRE as laboratoire,
        cs.PHARMACIE as pharmacie,
        cs.RADIOLOGIE as radiologie,
        cs.CHIRURGIE as chirurgie,
        cs.MATERNITE as maternite,
        cs.PEDIATRIE as pediatrie,
        cs.STATUT as statut,
        cs.ACTIF as actif,
        cs.DAT_CREUTIL as created_at,
        cs.DAT_MODUTIL as updated_at,
        p.LIB_PAY as nom_pays,
        r.LIB_REG as nom_region
      FROM [core].[CENTRE_SANTE] cs
      LEFT JOIN [ref].[PAYS] p ON cs.COD_PAY = p.COD_PAY
      LEFT JOIN [ref].[REGION_ADMIN] r ON cs.COD_REGION = r.COD_REG
      ${whereClause}
      ORDER BY cs.DAT_CREUTIL DESC
    `;

    const request = connection.request();
    
    // Ajouter tous les paramètres
    inputs.forEach(input => {
      request.input(input.name, input.type, input.value);
    });
    
    const result = await request.query(centresQuery);

    res.json({
      success: true,
      data: result.recordset,
      total: result.recordset.length
    });
  } catch (error) {
    console.error('Erreur récupération centres de santé:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des centres de santé',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Activer/désactiver un utilisateur
router.patch('/users/:id/toggle-active', auth, authorize('SuperAdmin'), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Le champ "active" doit être un booléen'
      });
    }

    // Empêcher la désactivation de soi-même
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas désactiver votre propre compte'
      });
    }

    connection = await getConnection();
    
    const updateQuery = `
      UPDATE [security].[UTILISATEUR] 
      SET ACTIF = @active,
          COD_MODUTIL = @currentUser,
          DAT_MODUTIL = GETDATE()
      WHERE ID_UTI = @id
    `;

    const request = connection.request();
    request.input('active', sql.Bit, active);
    request.input('currentUser', sql.VarChar, req.user.username);
    request.input('id', sql.Int, parseInt(id));
    
    const result = await request.query(updateQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: `Utilisateur ${active ? 'activé' : 'désactivé'} avec succès`
    });
  } catch (error) {
    console.error('Erreur modification statut utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la modification du statut utilisateur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Récupérer les prestataires
router.get('/prestataires', auth, requireAdmin, async (req, res) => {
  let connection;
  try {
    const { type, cod_pay } = req.query;
    
    connection = await getConnection();
    
    let whereClause = 'WHERE p.ACTIF = 1';
    const inputs = [];
    
    if (type) {
      whereClause += ' AND p.TYPE_PRESTATAIRE = @type';
      inputs.push({ name: 'type', type: sql.VarChar, value: type });
    }
    
    if (cod_pay) {
      whereClause += ' AND p.COD_PAY = @cod_pay';
      inputs.push({ name: 'cod_pay', type: sql.VarChar, value: cod_pay });
    } else if (req.user.cod_pay && req.user.role !== 'SuperAdmin') {
      whereClause += ' AND p.COD_PAY = @user_cod_pay';
      inputs.push({ name: 'user_cod_pay', type: sql.VarChar, value: req.user.cod_pay });
    }
    
    const prestatairesQuery = `
      SELECT 
        p.COD_PRE as id,
        p.NOM_PRESTATAIRE as nom,
        p.PRENOM_PRESTATAIRE as prenom,
        p.TYPE_PRESTATAIRE as type,
        p.SPECIALITE as specialite,
        p.TITRE as titre,
        p.NUM_LICENCE as numero_licence,
        p.COD_PAY as cod_pay,
        p.COD_CEN as centre_id,
        p.TELEPHONE as telephone,
        p.EMAIL as email,
        p.EXPERIENCE_ANNEE as experience_annees,
        p.DISPONIBILITE as disponibilite,
        p.DAT_CREUTIL as created_at,
        pay.LIB_PAY as nom_pays,
        cs.NOM_CENTRE as nom_centre
      FROM [core].[PRESTATAIRE] p
      LEFT JOIN [ref].[PAYS] pay ON p.COD_PAY = pay.COD_PAY
      LEFT JOIN [core].[CENTRE_SANTE] cs ON p.COD_CEN = cs.COD_CEN
      ${whereClause}
      ORDER BY p.DAT_CREUTIL DESC
    `;

    const request = connection.request();
    
    inputs.forEach(input => {
      request.input(input.name, input.type, input.value);
    });
    
    const result = await request.query(prestatairesQuery);

    res.json({
      success: true,
      data: result.recordset,
      total: result.recordset.length
    });
  } catch (error) {
    console.error('Erreur récupération prestataires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des prestataires',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;