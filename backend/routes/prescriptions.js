// backend/routes/prescriptions.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { getConnection } = require('../config/database');

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'Token manquant' });
  
  const token = authHeader.replace('Bearer ', '');
  // Vérification JWT (implémentée dans app.js)
  req.user = { id: 1, username: 'medecin', role: 'Medecin' }; // Simplifié pour l'exemple
  next();
};

// ==============================================
// ROUTES DES PRESCRIPTIONS
// ==============================================

// Récupérer toutes les prescriptions (avec pagination et filtres)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      statut = '',
      date_debut = '',
      date_fin = '',
      type_prestation = ''
    } = req.query;

    const pool = await getConnection();
    const offset = (page - 1) * limit;

    // Construction de la requête avec filtres
    let whereClause = 'WHERE 1=1';
    const inputs = [];

    if (search) {
      whereClause += ` AND (
        p.NUM_PRESCRIPTION LIKE @search OR 
        b.NOM_BEN LIKE @search OR 
        b.PRE_BEN LIKE @search OR
        b.IDENTIFIANT_NATIONAL LIKE @search
      )`;
      inputs.push({ name: 'search', type: sql.VarChar, value: `%${search}%` });
    }

    if (statut) {
      whereClause += ' AND p.STATUT = @statut';
      inputs.push({ name: 'statut', type: sql.VarChar, value: statut });
    }

    if (type_prestation) {
      whereClause += ' AND p.TYPE_PRESTATION = @type_prestation';
      inputs.push({ name: 'type_prestation', type: sql.VarChar, value: type_prestation });
    }

    if (date_debut && date_fin) {
      whereClause += ' AND CAST(p.DATE_PRESCRIPTION AS DATE) BETWEEN @date_debut AND @date_fin';
      inputs.push({ name: 'date_debut', type: sql.Date, value: date_debut });
      inputs.push({ name: 'date_fin', type: sql.Date, value: date_fin });
    }

    // Requête principale avec jointures
    const query = `
      SELECT 
        p.COD_PRES,
        p.NUM_PRESCRIPTION,
        p.DATE_PRESCRIPTION,
        p.TYPE_PRESTATION,
        p.COD_AFF,
        a.LIB_AFF,
        p.STATUT,
        p.ORIGINE,
        p.MONTANT_TOTAL,
        b.ID_BEN,
        b.NOM_BEN,
        b.PRE_BEN,
        b.SEX_BEN,
        b.NAI_BEN,
        b.IDENTIFIANT_NATIONAL,
        b.TELEPHONE_MOBILE,
        pr.COD_PRE,
        pr.NOM_PRESTATAIRE AS NOM_MEDECIN,
        pr.PRENOM_PRESTATAIRE AS PRENOM_MEDECIN,
        pr.SPECIALITE,
        c.COD_CEN,
        c.NOM_CENTRE,
        (SELECT COUNT(*) FROM [metier].[PRESCRIPTION_DETAIL] pd WHERE pd.COD_PRES = p.COD_PRES) AS NB_ELEMENTS,
        (SELECT COUNT(*) FROM [metier].[PRESCRIPTION_DETAIL] pd WHERE pd.COD_PRES = p.COD_PRES AND pd.STATUT_EXECUTION = 'Execute') AS NB_ELEMENTS_EXECUTES,
        (SELECT MAX(pd.DATE_EXECUTION) FROM [metier].[PRESCRIPTION_DETAIL] pd WHERE pd.COD_PRES = p.COD_PRES) AS DERNIERE_EXECUTION
      FROM [metier].[PRESCRIPTION] p
      INNER JOIN [core].[BENEFICIAIRE] b ON p.COD_BEN = b.ID_BEN
      LEFT JOIN [core].[PRESTATAIRE] pr ON p.COD_PRE = pr.COD_PRE
      LEFT JOIN [core].[CENTRE_SANTE] c ON p.COD_CEN = c.COD_CEN
      LEFT JOIN [metier].[AFFECTION] a ON p.COD_AFF = a.COD_AFF
      ${whereClause}
      ORDER BY p.DATE_PRESCRIPTION DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;

    inputs.push({ name: 'offset', type: sql.Int, value: offset });
    inputs.push({ name: 'limit', type: sql.Int, value: parseInt(limit) });

    const request = pool.request();
    inputs.forEach(input => request.input(input.name, input.type, input.value));

    const result = await request.query(query);

    // Compter le total pour la pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM [metier].[PRESCRIPTION] p
      INNER JOIN [core].[BENEFICIAIRE] b ON p.COD_BEN = b.ID_BEN
      ${whereClause}
    `;

    const countRequest = pool.request();
    inputs.slice(0, inputs.length - 2).forEach(input => countRequest.input(input.name, input.type, input.value));
    const countResult = await countRequest.query(countQuery);

    res.json({
      success: true,
      prescriptions: result.recordset,
      pagination: {
        total: countResult.recordset[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.recordset[0].total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération prescriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Récupérer une prescription par son ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const query = `
      SELECT 
        p.*,
        b.NOM_BEN,
        b.PRE_BEN,
        b.SEX_BEN,
        b.NAI_BEN,
        dbo.fCalculAge(b.NAI_BEN, GETDATE()) AS AGE,
        b.IDENTIFIANT_NATIONAL,
        b.TELEPHONE_MOBILE,
        pr.NOM_PRESTATAIRE AS NOM_MEDECIN,
        pr.PRENOM_PRESTATAIRE AS PRENOM_MEDECIN,
        pr.SPECIALITE,
        c.NOM_CENTRE,
        a.LIB_AFF
      FROM [metier].[PRESCRIPTION] p
      INNER JOIN [core].[BENEFICIAIRE] b ON p.COD_BEN = b.ID_BEN
      LEFT JOIN [core].[PRESTATAIRE] pr ON p.COD_PRE = pr.COD_PRE
      LEFT JOIN [core].[CENTRE_SANTE] c ON p.COD_CEN = c.COD_CEN
      LEFT JOIN [metier].[AFFECTION] a ON p.COD_AFF = a.COD_AFF
      WHERE p.COD_PRES = @id
    `;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Prescription non trouvée'
      });
    }

    // Récupérer les détails
    const detailsQuery = `
      SELECT *
      FROM [metier].[PRESCRIPTION_DETAIL]
      WHERE COD_PRES = @id
      ORDER BY ORDRE
    `;

    const detailsResult = await pool.request()
      .input('id', sql.Int, id)
      .query(detailsQuery);

    res.json({
      success: true,
      prescription: result.recordset[0],
      details: detailsResult.recordset
    });

  } catch (error) {
    console.error('❌ Erreur récupération prescription:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Récupérer une prescription par son numéro
router.get('/numero/:numero', authenticateToken, async (req, res) => {
  try {
    const { numero } = req.params;
    const pool = await getConnection();

    const query = `
      SELECT 
        p.*,
        b.NOM_BEN,
        b.PRE_BEN,
        b.SEX_BEN,
        b.NAI_BEN,
        dbo.fCalculAge(b.NAI_BEN, GETDATE()) AS AGE,
        b.IDENTIFIANT_NATIONAL,
        b.TELEPHONE_MOBILE,
        pr.NOM_PRESTATAIRE AS NOM_MEDECIN,
        pr.PRENOM_PRESTATAIRE AS PRENOM_MEDECIN,
        pr.SPECIALITE,
        c.NOM_CENTRE,
        a.LIB_AFF
      FROM [metier].[PRESCRIPTION] p
      INNER JOIN [core].[BENEFICIAIRE] b ON p.COD_BEN = b.ID_BEN
      LEFT JOIN [core].[PRESTATAIRE] pr ON p.COD_PRE = pr.COD_PRE
      LEFT JOIN [core].[CENTRE_SANTE] c ON p.COD_CEN = c.COD_CEN
      LEFT JOIN [metier].[AFFECTION] a ON p.COD_AFF = a.COD_AFF
      WHERE p.NUM_PRESCRIPTION = @numero
    `;

    const result = await pool.request()
      .input('numero', sql.VarChar, numero)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Prescription non trouvée'
      });
    }

    const prescription = result.recordset[0];

    // Récupérer les détails
    const detailsQuery = `
      SELECT *
      FROM [metier].[PRESCRIPTION_DETAIL]
      WHERE COD_PRES = @id
      ORDER BY ORDRE
    `;

    const detailsResult = await pool.request()
      .input('id', sql.Int, prescription.COD_PRES)
      .query(detailsQuery);

    res.json({
      success: true,
      prescription,
      details: detailsResult.recordset
    });

  } catch (error) {
    console.error('❌ Erreur récupération prescription:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Créer une nouvelle prescription
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      cod_ben,
      cod_pre,
      cod_cen,
      type_prestation,
      cod_aff,
      observations,
      origine = 'Electronique',
      date_validite,
      details
    } = req.body;

    const utilisateur = req.user.username || 'SYSTEM';

    const pool = await getConnection();

    // Générer le numéro de prescription
    const current_year = new Date().getFullYear();
    
    // Récupérer le dernier numéro
    const lastNumQuery = `
      SELECT MAX(NUM_PRESCRIPTION) as last_num
      FROM [metier].[PRESCRIPTION]
      WHERE NUM_PRESCRIPTION LIKE @pattern
    `;

    const pattern = `PRES-${current_year}-%`;
    const lastNumResult = await pool.request()
      .input('pattern', sql.VarChar, pattern)
      .query(lastNumQuery);

    let sequence = 1;
    if (lastNumResult.recordset[0].last_num) {
      const lastNum = lastNumResult.recordset[0].last_num;
      const lastSeq = parseInt(lastNum.split('-')[2]);
      sequence = lastSeq + 1;
    }

    const num_prescription = `PRES-${current_year}-${sequence.toString().padStart(5, '0')}`;

    // Commencer une transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Insérer la prescription
      const insertQuery = `
        INSERT INTO [metier].[PRESCRIPTION] (
          NUM_PRESCRIPTION, COD_BEN, COD_PRE, COD_CEN, DATE_PRESCRIPTION,
          TYPE_PRESTATION, COD_AFF, OBSERVATIONS, ORIGINE, DATE_VALIDITE,
          STATUT, MONTANT_TOTAL, COD_CREUTIL, DAT_CREUTIL, COD_MODUTIL, DAT_MODUTIL
        )
        VALUES (
          @num_prescription, @cod_ben, @cod_pre, @cod_cen, GETDATE(),
          @type_prestation, @cod_aff, @observations, @origine, @date_validite,
          'En attente', 0, @utilisateur, GETDATE(), @utilisateur, GETDATE()
        );
        SELECT SCOPE_IDENTITY() as COD_PRES;
      `;

      const insertResult = await transaction.request()
        .input('num_prescription', sql.VarChar, num_prescription)
        .input('cod_ben', sql.Int, cod_ben)
        .input('cod_pre', sql.Int, cod_pre)
        .input('cod_cen', sql.Int, cod_cen)
        .input('type_prestation', sql.VarChar, type_prestation)
        .input('cod_aff', sql.VarChar, cod_aff)
        .input('observations', sql.VarChar, observations)
        .input('origine', sql.VarChar, origine)
        .input('date_validite', sql.Date, date_validite)
        .input('utilisateur', sql.VarChar, utilisateur)
        .query(insertQuery);

      const cod_pres = insertResult.recordset[0].COD_PRES;
      let montant_total = 0;

      // 2. Insérer les détails de la prescription
      if (details && details.length > 0) {
        for (let i = 0; i < details.length; i++) {
          const detail = details[i];
          const montant = detail.quantite * (detail.prix_unitaire || 0);

          const detailQuery = `
            INSERT INTO [metier].[PRESCRIPTION_DETAIL] (
              COD_PRES, TYPE_ELEMENT, COD_ELEMENT, LIBELLE, QUANTITE,
              POSOLOGIE, DUREE_TRAITEMENT, UNITE, PRIX_UNITAIRE, MONTANT_TOTAL,
              REMBOURSABLE, TAUX_PRISE_EN_CHARGE, STATUT_EXECUTION, ORDRE,
              COD_CREUTIL, DAT_CREUTIL, COD_MODUTIL, DAT_MODUTIL
            )
            VALUES (
              @cod_pres, @type_element, @cod_element, @libelle, @quantite,
              @posologie, @duree_traitement, @unite, @prix_unitaire, @montant,
              @remboursable, @taux_prise_en_charge, 'A executer', @ordre,
              @utilisateur, GETDATE(), @utilisateur, GETDATE()
            )
          `;

          await transaction.request()
            .input('cod_pres', sql.Int, cod_pres)
            .input('type_element', sql.VarChar, detail.type_element)
            .input('cod_element', sql.VarChar, detail.cod_element)
            .input('libelle', sql.VarChar, detail.libelle)
            .input('quantite', sql.Decimal(10, 2), detail.quantite || 1)
            .input('posologie', sql.VarChar, detail.posologie)
            .input('duree_traitement', sql.Int, detail.duree_traitement)
            .input('unite', sql.VarChar, detail.unite)
            .input('prix_unitaire', sql.Decimal(12, 2), detail.prix_unitaire || 0)
            .input('montant', sql.Decimal(12, 2), montant)
            .input('remboursable', sql.Bit, detail.remboursable || 1)
            .input('taux_prise_en_charge', sql.Decimal(5, 2), detail.taux_prise_en_charge)
            .input('ordre', sql.Int, i + 1)
            .input('utilisateur', sql.VarChar, utilisateur)
            .query(detailQuery);

          montant_total += montant;
        }
      }

      // 3. Mettre à jour le montant total
      const updateQuery = `
        UPDATE [metier].[PRESCRIPTION]
        SET MONTANT_TOTAL = @montant_total,
            COD_MODUTIL = @utilisateur,
            DAT_MODUTIL = GETDATE()
        WHERE COD_PRES = @cod_pres
      `;

      await transaction.request()
        .input('montant_total', sql.Decimal(12, 2), montant_total)
        .input('cod_pres', sql.Int, cod_pres)
        .input('utilisateur', sql.VarChar, utilisateur)
        .query(updateQuery);

      // Valider la transaction
      await transaction.commit();

      res.json({
        success: true,
        message: 'Prescription créée avec succès',
        prescription: {
          COD_PRES: cod_pres,
          NUM_PRESCRIPTION: num_prescription,
          MONTANT_TOTAL: montant_total
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Erreur création prescription:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la prescription',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Exécuter une prescription
router.post('/:id/execute', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { details, cod_executant, cod_cen } = req.body;
    const utilisateur = req.user.username || 'SYSTEM';

    if (!details || details.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun détail fourni pour l\'exécution'
      });
    }

    const pool = await getConnection();

    // Vérifier si la prescription existe
    const checkQuery = `
      SELECT STATUT, NUM_PRESCRIPTION
      FROM [metier].[PRESCRIPTION]
      WHERE COD_PRES = @id
    `;

    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Prescription non trouvée'
      });
    }

    const prescription = checkResult.recordset[0];

    // Commencer une transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Mettre à jour chaque détail exécuté
      for (const detail of details) {
        const updateDetailQuery = `
          UPDATE [metier].[PRESCRIPTION_DETAIL]
          SET QUANTITE_EXECUTEE = @quantite_executee,
              DATE_EXECUTION = GETDATE(),
              COD_EXECUTANT = @cod_executant,
              STATUT_EXECUTION = CASE 
                WHEN @quantite_executee >= QUANTITE THEN 'Execute'
                WHEN @quantite_executee > 0 THEN 'Partiellement execute'
                ELSE 'A executer'
              END,
              COD_MODUTIL = @utilisateur,
              DAT_MODUTIL = GETDATE()
          WHERE COD_PRES_DET = @cod_pres_det
            AND COD_PRES = @cod_pres
        `;

        await transaction.request()
          .input('quantite_executee', sql.Decimal(10, 2), detail.quantite_executee)
          .input('cod_executant', sql.Int, cod_executant)
          .input('cod_pres_det', sql.Int, detail.cod_pres_det)
          .input('cod_pres', sql.Int, id)
          .input('utilisateur', sql.VarChar, utilisateur)
          .query(updateDetailQuery);
      }

      // Vérifier le statut global
      const statsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN STATUT_EXECUTION = 'Execute' THEN 1 ELSE 0 END) as executes
        FROM [metier].[PRESCRIPTION_DETAIL]
        WHERE COD_PRES = @id
      `;

      const statsResult = await transaction.request()
        .input('id', sql.Int, id)
        .query(statsQuery);

      const { total, executes } = statsResult.recordset[0];
      let nouveau_statut = prescription.STATUT;

      if (executes === 0) {
        nouveau_statut = 'En attente';
      } else if (executes === total) {
        nouveau_statut = 'Executee';
      } else {
        nouveau_statut = 'En cours';
      }

      // Mettre à jour le statut de la prescription
      const updatePrescriptionQuery = `
        UPDATE [metier].[PRESCRIPTION]
        SET STATUT = @statut,
            COD_MODUTIL = @utilisateur,
            DAT_MODUTIL = GETDATE()
        WHERE COD_PRES = @id
      `;

      await transaction.request()
        .input('statut', sql.VarChar, nouveau_statut)
        .input('id', sql.Int, id)
        .input('utilisateur', sql.VarChar, utilisateur)
        .query(updatePrescriptionQuery);

      // Valider la transaction
      await transaction.commit();

      res.json({
        success: true,
        message: `Prescription ${prescription.NUM_PRESCRIPTION} exécutée`,
        statut: nouveau_statut,
        details: {
          total,
          executes
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Erreur exécution prescription:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'exécution de la prescription',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Rechercher des éléments médicaux (médicaments, actes)
router.get('/elements/medical-items', authenticateToken, async (req, res) => {
  try {
    const { search = '', type = '' } = req.query;
    const pool = await getConnection();

    let query = '';
    let result;

    if (type === 'medicament' || !type) {
      // Recherche dans les médicaments
      const medQuery = `
        SELECT 
          COD_MED as id,
          NOM_COMMERCIAL as libelle,
          NOM_GENERIQUE as libelle_complet,
          'medicament' as type,
          FORME_PHARMACEUTIQUE as forme,
          DOSAGE,
          PRIX_UNITAIRE as prix,
          REMBOURSABLE
        FROM [metier].[MEDICAMENT]
        WHERE (NOM_COMMERCIAL LIKE @search OR NOM_GENERIQUE LIKE @search)
          AND ACTIF = 1
        ORDER BY NOM_COMMERCIAL
      `;

      result = await pool.request()
        .input('search', sql.VarChar, `%${search}%`)
        .query(medQuery);
    }

    if (type === 'acte' || !type) {
      // Recherche dans les actes (tarifs)
      const acteQuery = `
        SELECT 
          LIC_TAR as id,
          LIB_TAR as libelle,
          LIB_TAR as libelle_complet,
          'acte' as type,
          NULL as forme,
          NULL as dosage,
          NULL as prix,
          1 as remboursable
        FROM [metier].[TARIF]
        WHERE LIB_TAR LIKE @search
          AND ETA_TAR = 1
        ORDER BY LIB_TAR
      `;

      const acteResult = await pool.request()
        .input('search', sql.VarChar, `%${search}%`)
        .query(acteQuery);

      if (result) {
        result.recordset = [...result.recordset, ...acteResult.recordset];
      } else {
        result = acteResult;
      }
    }

    res.json({
      success: true,
      items: result.recordset || []
    });

  } catch (error) {
    console.error('❌ Erreur recherche éléments:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Rechercher des patients par carte
router.get('/search/patients', authenticateToken, async (req, res) => {
  try {
    const { search = '', limit = 20 } = req.query;
    const pool = await getConnection();

    const query = `
      SELECT TOP ${limit}
        ID_BEN as id,
        NOM_BEN as nom,
        PRE_BEN as prenom,
        SEX_BEN as sexe,
        NAI_BEN as date_naissance,
        dbo.fCalculAge(NAI_BEN, GETDATE()) as age,
        IDENTIFIANT_NATIONAL as identifiant,
        TELEPHONE_MOBILE as telephone,
        COD_PAY as pays,
        GROUPE_SANGUIN,
        RHESUS,
        PROFESSION
      FROM [core].[BENEFICIAIRE]
      WHERE (
        IDENTIFIANT_NATIONAL LIKE @search OR
        NOM_BEN LIKE @search OR
        PRE_BEN LIKE @search OR
        TELEPHONE_MOBILE LIKE @search OR
        CONCAT(NOM_BEN, ' ', PRE_BEN) LIKE @search
      ) AND RETRAIT_DATE IS NULL
      ORDER BY NOM_BEN, PRE_BEN
    `;

    const result = await pool.request()
      .input('search', sql.VarChar, `%${search}%`)
      .query(query);

    res.json({
      success: true,
      patients: result.recordset.map(patient => ({
        ...patient,
        nom_complet: `${patient.nom} ${patient.prenom}`,
        age: patient.age || 0
      }))
    });

  } catch (error) {
    console.error('❌ Erreur recherche patients:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Rechercher des affections (diagnostics)
router.get('/search/affections', authenticateToken, async (req, res) => {
  try {
    const { search = '', limit = 20 } = req.query;
    const pool = await getConnection();

    const query = `
      SELECT TOP ${limit}
        COD_AFF as code,
        LIB_AFF as libelle,
        NCP_AFF as ncp,
        SEX_AFF,
        ETA_AFF
      FROM [metier].[AFFECTION]
      WHERE LIB_AFF LIKE @search OR COD_AFF LIKE @search
      ORDER BY LIB_AFF
    `;

    const result = await pool.request()
      .input('search', sql.VarChar, `%${search}%`)
      .query(query);

    res.json({
      success: true,
      affections: result.recordset
    });

  } catch (error) {
    console.error('❌ Erreur recherche affections:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Rechercher des éléments médicaux
router.get('/search/medical-items', authenticateToken, async (req, res) => {
  try {
    const { search = '', type = '', limit = 20 } = req.query;
    const pool = await getConnection();

    let items = [];
    
    // Rechercher médicaments
    if (!type || type === 'medicament') {
      const medQuery = `
        SELECT TOP ${limit}
          COD_MED as id,
          NOM_COMMERCIAL as libelle,
          NOM_GENERIQUE as libelle_complet,
          'medicament' as type,
          FORME_PHARMACEUTIQUE as forme,
          DOSAGE,
          PRIX_UNITAIRE as prix,
          REMBOURSABLE,
          CLASSE_THERAPEUTIQUE as categorie
        FROM [metier].[MEDICAMENT]
        WHERE (NOM_COMMERCIAL LIKE @search OR NOM_GENERIQUE LIKE @search)
          AND ACTIF = 1
        ORDER BY NOM_COMMERCIAL
      `;

      const medResult = await pool.request()
        .input('search', sql.VarChar, `%${search}%`)
        .query(medQuery);

      items = [...items, ...medResult.recordset];
    }

    // Rechercher actes médicaux
    if (!type || type === 'acte') {
      const acteQuery = `
        SELECT TOP ${limit}
          LIC_TAR as id,
          LIB_TAR as libelle,
          LIB_TAR as libelle_complet,
          'acte' as type,
          NULL as forme,
          NULL as dosage,
          NULL as prix,
          1 as remboursable,
          COD_LET as categorie
        FROM [metier].[TARIF]
        WHERE LIB_TAR LIKE @search
          AND ETA_TAR = 1
        ORDER BY LIB_TAR
      `;

      const acteResult = await pool.request()
        .input('search', sql.VarChar, `%${search}%`)
        .query(acteQuery);

      items = [...items, ...acteResult.recordset];
    }

    res.json({
      success: true,
      items: items.slice(0, limit)
    });

  } catch (error) {
    console.error('❌ Erreur recherche éléments médicaux:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

router.get('/types/prestations', authenticateToken, async (req, res) => {
  try {
    const pool = await getConnection();

    const query = `
      SELECT 
        COD_TYP_PRES as value,
        LIB_TYP_PRES as label,
        CATEGORIE
      FROM [metier].[TYPE_PRESTATION]
      WHERE ACTIF = 1
      ORDER BY LIB_TYP_PRES
    `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      types: result.recordset
    });

  } catch (error) {
    console.error('❌ Erreur récupération types prestation:', error);
    res.json({
      success: true,
      types: [
        { value: 'Pharmacie', label: 'Pharmacie' },
        { value: 'Biologie', label: 'Biologie' },
        { value: 'Imagerie', label: 'Imagerie' },
        { value: 'Consultation', label: 'Consultation' },
        { value: 'Hospitalisation', label: 'Hospitalisation' },
        { value: 'Chirurgie', label: 'Chirurgie' },
        { value: 'Maternite', label: 'Maternité' },
        { value: 'Urgence', label: 'Urgence' }
      ]
    });
  }
});

router.get('/verifier/:numero', authenticateToken, async (req, res) => {
  try {
    const { numero } = req.params;
    const pool = await getConnection();

    const query = `
      SELECT 
        COUNT(*) as existe
      FROM [metier].[PRESCRIPTION]
      WHERE NUM_PRESCRIPTION = @numero
    `;

    const result = await pool.request()
      .input('numero', sql.VarChar, numero)
      .query(query);

    res.json({
      success: true,
      existe: result.recordset[0].existe > 0,
      numero
    });

  } catch (error) {
    console.error('❌ Erreur vérification prescription:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Annuler une prescription
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { raison } = req.body;
    const utilisateur = req.user.username || 'SYSTEM';

    const pool = await getConnection();

    const query = `
      UPDATE [metier].[PRESCRIPTION]
      SET STATUT = 'Annulee',
          OBSERVATIONS = CONCAT(ISNULL(OBSERVATIONS, ''), ' - ANNULATION: ', @raison),
          COD_MODUTIL = @utilisateur,
          DAT_MODUTIL = GETDATE()
      WHERE COD_PRES = @id
        AND STATUT IN ('En attente', 'En cours')
    `;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('raison', sql.VarChar, raison)
      .input('utilisateur', sql.VarChar, utilisateur)
      .query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({
        success: false,
        error: 'Prescription non annulable (déjà exécutée ou annulée)'
      });
    }

    res.json({
      success: true,
      message: 'Prescription annulée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur annulation prescription:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Obtenir les statistiques des prescriptions
router.get('/statistiques/general', authenticateToken, async (req, res) => {
  try {
    const { periode = 'mois' } = req.query;
    const pool = await getConnection();

    let dateCondition = '';
    switch (periode) {
      case 'jour':
        dateCondition = 'WHERE CAST(DATE_PRESCRIPTION AS DATE) = CAST(GETDATE() AS DATE)';
        break;
      case 'semaine':
        dateCondition = 'WHERE DATE_PRESCRIPTION >= DATEADD(DAY, -7, GETDATE())';
        break;
      case 'mois':
        dateCondition = 'WHERE DATE_PRESCRIPTION >= DATEADD(MONTH, -1, GETDATE())';
        break;
      case 'annee':
        dateCondition = 'WHERE DATE_PRESCRIPTION >= DATEADD(YEAR, -1, GETDATE())';
        break;
    }

    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN STATUT = 'Executee' THEN 1 ELSE 0 END) as executees,
        SUM(CASE WHEN STATUT = 'En attente' THEN 1 ELSE 0 END) as en_attente,
        SUM(CASE WHEN STATUT = 'En cours' THEN 1 ELSE 0 END) as en_cours,
        SUM(CASE WHEN STATUT = 'Annulee' THEN 1 ELSE 0 END) as annulees,
        AVG(MONTANT_TOTAL) as montant_moyen,
        SUM(MONTANT_TOTAL) as montant_total
      FROM [metier].[PRESCRIPTION]
      ${dateCondition}
    `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      statistiques: result.recordset[0]
    });

  } catch (error) {
    console.error('❌ Erreur statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

module.exports = router;