// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const auth = require('../middleware/auth'); // Import par défaut
const { authorize } = require('../middleware/auth');

// Statistiques principales
router.get('/stats', auth, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    
    const userCountry = req.user.cod_pay || 'CMF';
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log('Récupération stats pour:', {
      user: userId,
      role: userRole,
      pays: userCountry
    });
    
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM core.BENEFICIAIRE ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'WHERE COD_PAY = @userCountry' : ''}) as totalBeneficiaires,
        (SELECT COUNT(*) FROM core.CONSULTATION c WHERE CONVERT(DATE, c.DATE_CONSULTATION) = CONVERT(DATE, GETDATE()) 
          ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND EXISTS (SELECT 1 FROM core.BENEFICIAIRE b WHERE b.ID_BEN = c.COD_BEN AND b.COD_PAY = @userCountry)' : ''}) as consultationsAujourdhui,
        (SELECT COUNT(*) FROM core.PRESTATAIRE WHERE ACTIF = 1) as prestatairesActifs,
        (SELECT COUNT(*) FROM core.CONSULTATION c WHERE c.STATUT_PAIEMENT = 'en_attente' 
          ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND EXISTS (SELECT 1 FROM core.BENEFICIAIRE b WHERE b.ID_BEN = c.COD_BEN AND b.COD_PAY = @userCountry)' : ''}) as demandesEnAttente,
        (SELECT ISNULL(SUM(c.MONTANT_CONSULTATION), 0) FROM core.CONSULTATION c
         WHERE MONTH(c.DATE_CONSULTATION) = MONTH(GETDATE()) 
         AND YEAR(c.DATE_CONSULTATION) = YEAR(GETDATE())
         AND c.STATUT_PAIEMENT IN ('paye', 'partiel') 
         ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND EXISTS (SELECT 1 FROM core.BENEFICIAIRE b WHERE b.ID_BEN = c.COD_BEN AND b.COD_PAY = @userCountry)' : ''}) as revenuMensuel,
        (SELECT COUNT(*) FROM core.CONSULTATION c WHERE MONTH(c.DATE_CONSULTATION) = MONTH(GETDATE()) 
         AND YEAR(c.DATE_CONSULTATION) = YEAR(GETDATE()) 
         ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND EXISTS (SELECT 1 FROM core.BENEFICIAIRE b WHERE b.ID_BEN = c.COD_BEN AND b.COD_PAY = @userCountry)' : ''}) as consultationsMensuelles,
        (SELECT COUNT(*) FROM core.BENEFICIAIRE WHERE RETRAIT_DATE IS NULL 
          ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND COD_PAY = @userCountry' : ''}) as totalBeneficiairesActifs,
        (SELECT COUNT(*) FROM core.PRESTATAIRE WHERE ACTIF = 1 AND COD_PAY = @userCountry) as prestatairesActifsPays,
        (SELECT COUNT(*) FROM core.CENTRE_SANTE WHERE ACTIF = 1 
          ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND COD_PAY = @userCountry' : ''}) as centresActifs
    `;

    const request = connection.request();
    
    // Toujours ajouter le paramètre userCountry pour éviter les erreurs
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      request.input('userCountry', sql.VarChar, userCountry);
    } else {
      // Pour les admins, on peut mettre une valeur par défaut ou laisser NULL
      request.input('userCountry', sql.VarChar, null);
    }
    
    const result = await request.query(statsQuery);

    res.json({
      success: true,
      data: result.recordset[0],
      userRole: userRole,
      pays: userCountry
    });
  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    // Libérer la connexion
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Erreur lors de la fermeture de la connexion:', closeError);
      }
    }
  }
});

// Activités récentes
router.get('/activity', auth, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    
    const userCountry = req.user.cod_pay;
    const userRole = req.user.role;
    
    const activitiesQuery = `
      SELECT TOP 10
        'consultation' as type,
        CONCAT('Consultation de ', b.NOM_BEN, ' ', b.PRE_BEN) as description,
        c.DATE_CONSULTATION as time,
        c.STATUT_PAIEMENT as status,
        b.COD_PAY as cod_pay
      FROM core.CONSULTATION c
      JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN
      WHERE c.DATE_CONSULTATION >= DATEADD(HOUR, -24, GETDATE())
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
      UNION ALL
      SELECT TOP 10
        'admission' as type,
        CONCAT('Admission de ', b.NOM_BEN, ' ', b.PRE_BEN) as description,
        c.DATE_CONSULTATION as time,
        CASE WHEN c.HOSPITALISATION = 1 THEN 'hospitalise' ELSE 'consultation' END as status,
        b.COD_PAY as cod_pay
      FROM core.CONSULTATION c
      JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN
      WHERE c.DATE_CONSULTATION >= DATEADD(HOUR, -24, GETDATE())
        AND c.HOSPITALISATION = 1
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
      ORDER BY time DESC
    `;

    const request = connection.request();
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      request.input('userCountry', sql.VarChar, userCountry);
    }
    
    const result = await request.query(activitiesQuery);

    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Erreur récupération activité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des activités',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Données pour graphiques
router.get('/charts', auth, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    
    const userCountry = req.user.cod_pay;
    const userRole = req.user.role;
    
    // Tendances des consultations (7 derniers jours)
    const trendsQuery = `
      SELECT 
        CONVERT(DATE, DATE_CONSULTATION) as date,
        DATENAME(WEEKDAY, DATE_CONSULTATION) as name,
        COUNT(*) as consultations,
        ISNULL(SUM(MONTANT_CONSULTATION), 0) as revenue
      FROM core.CONSULTATION c
      ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN' : ''}
      WHERE DATE_CONSULTATION >= DATEADD(DAY, -7, GETDATE())
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
      GROUP BY CONVERT(DATE, DATE_CONSULTATION), DATENAME(WEEKDAY, DATE_CONSULTATION)
      ORDER BY date
    `;

    // Consultations par type
    const typeQuery = `
      SELECT 
        TYPE_CONSULTATION as name,
        COUNT(*) as value
      FROM core.CONSULTATION c
      ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN' : ''}
      WHERE MONTH(DATE_CONSULTATION) = MONTH(GETDATE())
        AND YEAR(DATE_CONSULTATION) = YEAR(GETDATE())
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
      GROUP BY TYPE_CONSULTATION
    `;

    // Distribution des bénéficiaires par sexe
    const genderQuery = `
      SELECT 
        SEX_BEN as name,
        COUNT(*) as value
      FROM core.BENEFICIAIRE 
      WHERE SEX_BEN IS NOT NULL
        AND RETRAIT_DATE IS NULL
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND COD_PAY = @userCountry' : ''}
      GROUP BY SEX_BEN
    `;

    // Répartition par statut de paiement
    const paymentQuery = `
      SELECT 
        STATUT_PAIEMENT as name,
        COUNT(*) as value
      FROM core.CONSULTATION c
      ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN' : ''}
      WHERE DATE_CONSULTATION >= DATEADD(DAY, -30, GETDATE())
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
      GROUP BY STATUT_PAIEMENT
    `;

    // Pathologies les plus fréquentes (depuis les diagnostics)
    const pathologyQuery = `
      SELECT TOP 5
        DIAGNOSTIC as name,
        COUNT(*) as value
      FROM core.CONSULTATION 
      WHERE DIAGNOSTIC IS NOT NULL 
        AND DIAGNOSTIC != ''
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND EXISTS (SELECT 1 FROM core.BENEFICIAIRE b WHERE b.ID_BEN = core.CONSULTATION.COD_BEN AND b.COD_PAY = @userCountry)' : ''}
      GROUP BY DIAGNOSTIC
      ORDER BY value DESC
    `;

    const request = connection.request();
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      request.input('userCountry', sql.VarChar, userCountry);
    }
    
    const [trendsResult, typeResult, genderResult, paymentResult, pathologyResult] = await Promise.all([
      request.query(trendsQuery),
      request.query(typeQuery),
      request.query(genderQuery),
      request.query(paymentQuery),
      request.query(pathologyQuery)
    ]);

    res.json({
      success: true,
      data: {
        consultationTrends: trendsResult.recordset,
        consultationsByType: typeResult.recordset,
        beneficiaireDemographics: genderResult.recordset,
        paymentStatusDistribution: paymentResult.recordset,
        topDiagnostics: pathologyResult.recordset
      }
    });

  } catch (error) {
    console.error('Erreur récupération graphiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des graphiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Données bénéficiaires
router.get('/beneficiaires', auth, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    
    const userCountry = req.user.cod_pay;
    const userRole = req.user.role;
    
    // Liste des bénéficiaires récents
    const recentBenefQuery = `
      SELECT TOP 10
        b.ID_BEN as id,
        b.IDENTIFIANT_NATIONAL as numero_carte,
        b.NOM_BEN as nom,
        b.PRE_BEN as prenom,
        b.NAI_BEN as date_naissance,
        b.SEX_BEN as genre,
        b.TELEPHONE_MOBILE as telephone,
        b.EMAIL as email,
        b.PROFESSION as profession,
        b.SITUATION_FAMILIALE as situation_familiale,
        b.COD_PAY as cod_pay,
        p.LIB_PAY as nom_pays,
        (SELECT MAX(DATE_CONSULTATION) FROM core.CONSULTATION c WHERE c.COD_BEN = b.ID_BEN) as derniere_visite
      FROM core.BENEFICIAIRE b
      LEFT JOIN ref.PAYS p ON b.COD_PAY = p.COD_PAY
      WHERE b.RETRAIT_DATE IS NULL
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
      ORDER BY b.DAT_CREUTIL DESC
    `;

    // Statistiques bénéficiaires
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN SEX_BEN = 'M' THEN 1 END) as hommes,
        COUNT(CASE WHEN SEX_BEN = 'F' THEN 1 END) as femmes,
        COUNT(CASE WHEN dbo.fCalculAge(NAI_BEN, GETDATE()) < 18 THEN 1 END) as moins_18,
        COUNT(CASE WHEN dbo.fCalculAge(NAI_BEN, GETDATE()) BETWEEN 18 AND 35 THEN 1 END) as 18_35,
        COUNT(CASE WHEN dbo.fCalculAge(NAI_BEN, GETDATE()) BETWEEN 36 AND 65 THEN 1 END) as 36_65,
        COUNT(CASE WHEN dbo.fCalculAge(NAI_BEN, GETDATE()) > 65 THEN 1 END) as plus_65
      FROM core.BENEFICIAIRE
      WHERE RETRAIT_DATE IS NULL
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND COD_PAY = @userCountry' : ''}
    `;

    const request = connection.request();
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      request.input('userCountry', sql.VarChar, userCountry);
    }
    
    const [benefResult, statsResult] = await Promise.all([
      request.query(recentBenefQuery),
      request.query(statsQuery)
    ]);

    res.json({
      success: true,
      data: {
        recentBeneficiaires: benefResult.recordset,
        stats: statsResult.recordset[0]
      }
    });

  } catch (error) {
    console.error('Erreur récupération bénéficiaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des données bénéficiaires',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Données financières
router.get('/finances', auth, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    
    const userCountry = req.user.cod_pay;
    const userRole = req.user.role;
    
    // Revenus mensuels (6 derniers mois)
    const revenueQuery = `
      SELECT 
        YEAR(DATE_CONSULTATION) as annee,
        MONTH(DATE_CONSULTATION) as mois,
        ISNULL(SUM(MONTANT_CONSULTATION), 0) as revenu,
        COUNT(*) as consultations
      FROM core.CONSULTATION c
      ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN' : ''}
      WHERE STATUT_PAIEMENT IN ('paye', 'partiel')
        AND DATE_CONSULTATION >= DATEADD(MONTH, -6, GETDATE())
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
      GROUP BY YEAR(DATE_CONSULTATION), MONTH(DATE_CONSULTATION)
      ORDER BY annee DESC, mois DESC
    `;

    // Consultations en attente de paiement
    const pendingQuery = `
      SELECT TOP 10
        c.COD_CONS as id_consultation,
        b.NOM_BEN + ' ' + b.PRE_BEN as nom_beneficiaire,
        c.MONTANT_CONSULTATION as montant_total,
        c.STATUT_PAIEMENT as statut,
        c.DATE_CONSULTATION as date_consultation,
        p.NOM_PRESTATAIRE + ' ' + ISNULL(p.PRENOM_PRESTATAIRE, '') as nom_prestataire
      FROM core.CONSULTATION c
      JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN
      LEFT JOIN core.PRESTATAIRE p ON c.COD_PRE = p.COD_PRE
      WHERE c.STATUT_PAIEMENT IN ('en_attente', 'partiel')
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
      ORDER BY c.DATE_CONSULTATION ASC
    `;

    // Statistiques financières
    const financeStatsQuery = `
      SELECT 
        ISNULL(SUM(MONTANT_CONSULTATION), 0) as revenue_mensuel,
        COUNT(*) as consultations_mensuelles,
        ISNULL(AVG(MONTANT_CONSULTATION), 0) as moyenne_par_consultation,
        (SELECT ISNULL(SUM(MONTANT_CONSULTATION), 0) FROM core.CONSULTATION 
         WHERE CONVERT(DATE, DATE_CONSULTATION) = CONVERT(DATE, GETDATE())
           AND STATUT_PAIEMENT IN ('paye', 'partiel') ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND EXISTS (SELECT 1 FROM core.BENEFICIAIRE b WHERE b.ID_BEN = core.CONSULTATION.COD_BEN AND b.COD_PAY = @userCountry)' : ''}) as revenue_aujourdhui
      FROM core.CONSULTATION c
      ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN' : ''}
      WHERE MONTH(DATE_CONSULTATION) = MONTH(GETDATE())
        AND YEAR(DATE_CONSULTATION) = YEAR(GETDATE())
        AND STATUT_PAIEMENT IN ('paye', 'partiel')
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
    `;

    const request = connection.request();
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      request.input('userCountry', sql.VarChar, userCountry);
    }
    
    const [revenueResult, pendingResult, statsResult] = await Promise.all([
      request.query(revenueQuery),
      request.query(pendingQuery),
      request.query(financeStatsQuery)
    ]);

    res.json({
      success: true,
      data: {
        monthlyRevenue: revenueResult.recordset,
        pendingConsultations: pendingResult.recordset,
        stats: statsResult.recordset[0]
      }
    });

  } catch (error) {
    console.error('Erreur récupération finances:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des données financières',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Données analytiques
router.get('/analytics', auth, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    
    const userCountry = req.user.cod_pay;
    const userRole = req.user.role;
    
    // Performance des prestataires
    const performanceQuery = `
      SELECT 
        p.COD_PRE as id,
        p.NOM_PRESTATAIRE as nom,
        p.PRENOM_PRESTATAIRE as prenom,
        p.SPECIALITE as specialite,
        p.NUM_LICENCE as numero_license,
        COUNT(c.COD_CONS) as consultations_mois,
        ISNULL(SUM(c.MONTANT_CONSULTATION), 0) as revenue_mois,
        ISNULL(AVG(c.MONTANT_CONSULTATION), 0) as moyenne_par_consultation
      FROM core.PRESTATAIRE p
      LEFT JOIN core.CONSULTATION c ON p.COD_PRE = c.COD_PRE
        AND MONTH(c.DATE_CONSULTATION) = MONTH(GETDATE())
        AND YEAR(c.DATE_CONSULTATION) = YEAR(GETDATE())
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND EXISTS (SELECT 1 FROM core.BENEFICIAIRE b WHERE b.ID_BEN = c.COD_BEN AND b.COD_PAY = @userCountry)' : ''}
      WHERE p.ACTIF = 1
      GROUP BY p.COD_PRE, p.NOM_PRESTATAIRE, p.PRENOM_PRESTATAIRE, p.SPECIALITE, p.NUM_LICENCE
      ORDER BY consultations_mois DESC
    `;

    // Taux de remplissage (consultations par jour de la semaine)
    const occupancyQuery = `
      SELECT 
        DATENAME(WEEKDAY, DATE_CONSULTATION) as jour,
        COUNT(*) as consultations,
        ROUND(COUNT(*) * 100.0 / NULLIF((SELECT AVG(cnt) FROM 
          (SELECT COUNT(*) as cnt FROM core.CONSULTATION 
           WHERE DATE_CONSULTATION >= DATEADD(DAY, -30, GETDATE())
           ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND EXISTS (SELECT 1 FROM core.BENEFICIAIRE b WHERE b.ID_BEN = core.CONSULTATION.COD_BEN AND b.COD_PAY = @userCountry)' : ''}
           GROUP BY CONVERT(DATE, DATE_CONSULTATION)) as daily_avg), 0), 2) as taux_remplissage
      FROM core.CONSULTATION c
      ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN' : ''}
      WHERE DATE_CONSULTATION >= DATEADD(DAY, -30, GETDATE())
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
      GROUP BY DATENAME(WEEKDAY, DATE_CONSULTATION), DATEPART(WEEKDAY, DATE_CONSULTATION)
      ORDER BY DATEPART(WEEKDAY, DATE_CONSULTATION)
    `;

    // Diagnostics les plus fréquents
    const diagnosticsQuery = `
      SELECT TOP 10
        DIAGNOSTIC as nom,
        COUNT(*) as frequence
      FROM core.CONSULTATION 
      WHERE DIAGNOSTIC IS NOT NULL 
        AND DIAGNOSTIC != ''
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND EXISTS (SELECT 1 FROM core.BENEFICIAIRE b WHERE b.ID_BEN = core.CONSULTATION.COD_BEN AND b.COD_PAY = @userCountry)' : ''}
      GROUP BY DIAGNOSTIC
      ORDER BY frequence DESC
    `;

    const request = connection.request();
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      request.input('userCountry', sql.VarChar, userCountry);
    }
    
    const [performanceResult, occupancyResult, diagnosticsResult] = await Promise.all([
      request.query(performanceQuery),
      request.query(occupancyQuery),
      request.query(diagnosticsQuery)
    ]);

    res.json({
      success: true,
      data: {
        prestatairePerformance: performanceResult.recordset,
        occupancyRate: occupancyResult.recordset,
        topDiagnostics: diagnosticsResult.recordset
      }
    });

  } catch (error) {
    console.error('Erreur récupération analytiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des données analytiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Statistiques des consultations
router.get('/consultation-stats', auth, async (req, res) => {
  let connection;
  try {
    const { period = 'month' } = req.query;
    
    connection = await getConnection();
    
    const userCountry = req.user.cod_pay;
    const userRole = req.user.role;
    
    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = `CONVERT(DATE, DATE_CONSULTATION) = CONVERT(DATE, GETDATE())`;
        break;
      case 'week':
        dateFilter = `DATEPART(WEEK, DATE_CONSULTATION) = DATEPART(WEEK, GETDATE()) 
                      AND YEAR(DATE_CONSULTATION) = YEAR(GETDATE())`;
        break;
      case 'year':
        dateFilter = `YEAR(DATE_CONSULTATION) = YEAR(GETDATE())`;
        break;
      default: // month
        dateFilter = `MONTH(DATE_CONSULTATION) = MONTH(GETDATE()) 
                      AND YEAR(DATE_CONSULTATION) = YEAR(GETDATE())`;
    }
    
    // Statistiques principales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_consultations,
        ISNULL(SUM(MONTANT_CONSULTATION), 0) as total_revenue,
        COUNT(CASE WHEN URGENT = 1 THEN 1 END) as urgences,
        COUNT(CASE WHEN HOSPITALISATION = 1 THEN 1 END) as hospitalisations,
        COUNT(CASE WHEN STATUT_PAIEMENT = 'paye' THEN 1 END) as payees,
        COUNT(CASE WHEN STATUT_PAIEMENT = 'en_attente' THEN 1 END) as en_attente,
        COUNT(CASE WHEN STATUT_PAIEMENT = 'partiel' THEN 1 END) as partiel,
        COUNT(CASE WHEN STATUT_PAIEMENT = 'annule' THEN 1 END) as annulees,
        ISNULL(AVG(MONTANT_CONSULTATION), 0) as moyenne_montant
      FROM core.CONSULTATION c
      ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN' : ''}
      WHERE ${dateFilter}
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
    `;
    
    // Consultations par jour (7 derniers jours)
    const dailyQuery = `
      SELECT 
        CONVERT(DATE, DATE_CONSULTATION) as date,
        DATENAME(WEEKDAY, DATE_CONSULTATION) as day,
        COUNT(*) as consultations,
        ISNULL(SUM(MONTANT_CONSULTATION), 0) as revenue
      FROM core.CONSULTATION c
      ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN' : ''}
      WHERE DATE_CONSULTATION >= DATEADD(DAY, -7, GETDATE())
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
      GROUP BY CONVERT(DATE, DATE_CONSULTATION), DATENAME(WEEKDAY, DATE_CONSULTATION)
      ORDER BY date
    `;
    
    // Consultations par prestataire
    const byPrestataireQuery = `
      SELECT 
        p.COD_PRE as id,
        p.NOM_PRESTATAIRE as nom,
        p.PRENOM_PRESTATAIRE as prenom,
        p.SPECIALITE as specialite,
        COUNT(c.COD_CONS) as consultations_count,
        ISNULL(SUM(c.MONTANT_CONSULTATION), 0) as total_revenue,
        ISNULL(AVG(c.MONTANT_CONSULTATION), 0) as moyenne_revenue
      FROM core.PRESTATAIRE p
      LEFT JOIN core.CONSULTATION c ON p.COD_PRE = c.COD_PRE
        AND ${dateFilter}
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND EXISTS (SELECT 1 FROM core.BENEFICIAIRE b WHERE b.ID_BEN = c.COD_BEN AND b.COD_PAY = @userCountry)' : ''}
      WHERE p.ACTIF = 1
      GROUP BY p.COD_PRE, p.NOM_PRESTATAIRE, p.PRENOM_PRESTATAIRE, p.SPECIALITE
      ORDER BY consultations_count DESC
    `;
    
    // Consultations par type
    const byTypeQuery = `
      SELECT 
        TYPE_CONSULTATION as name,
        COUNT(*) as consultations_count,
        ISNULL(SUM(MONTANT_CONSULTATION), 0) as total_revenue
      FROM core.CONSULTATION c
      ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN' : ''}
      WHERE ${dateFilter}
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
      GROUP BY TYPE_CONSULTATION
      ORDER BY consultations_count DESC
    `;
    
    // Consultations récentes
    const recentQuery = `
      SELECT TOP 10
        c.*,
        b.NOM_BEN as beneficiaire_nom,
        b.PRE_BEN as beneficiaire_prenom,
        b.IDENTIFIANT_NATIONAL as numero_carte,
        p.SPECIALITE as specialite,
        p.NOM_PRESTATAIRE as prestataire_nom,
        p.PRENOM_PRESTATAIRE as prestataire_prenom
      FROM core.CONSULTATION c
      JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN
      LEFT JOIN core.PRESTATAIRE p ON c.COD_PRE = p.COD_PRE
      ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'WHERE b.COD_PAY = @userCountry' : ''}
      ORDER BY c.DATE_CONSULTATION DESC
    `;

    const request = connection.request();
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      request.input('userCountry', sql.VarChar, userCountry);
    }
    
    const [statsResult, dailyResult, prestataireResult, typeResult, recentResult] = await Promise.all([
      request.query(statsQuery),
      request.query(dailyQuery),
      request.query(byPrestataireQuery),
      request.query(byTypeQuery),
      request.query(recentQuery)
    ]);

    res.json({
      success: true,
      data: {
        summary: statsResult.recordset[0] || {},
        daily: dailyResult.recordset,
        byPrestataire: prestataireResult.recordset,
        byType: typeResult.recordset,
        recent: recentResult.recordset,
        period
      }
    });
  } catch (error) {
    console.error('Erreur récupération statistiques consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques des consultations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Données détaillées des consultations avec filtres
router.get('/consultations-details', auth, async (req, res) => {
  let connection;
  try {
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate, 
      prestataireId, 
      typeConsultation, 
      status 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    connection = await getConnection();
    
    const userCountry = req.user.cod_pay;
    const userRole = req.user.role;
    
    let whereClause = 'WHERE 1=1';
    const request = connection.request();
    
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      whereClause += ' AND b.COD_PAY = @userCountry';
      request.input('userCountry', sql.VarChar, userCountry);
    }
    
    if (startDate && endDate) {
      whereClause += ' AND CONVERT(DATE, c.DATE_CONSULTATION) BETWEEN @startDate AND @endDate';
      request.input('startDate', sql.Date, startDate);
      request.input('endDate', sql.Date, endDate);
    }
    
    if (prestataireId) {
      whereClause += ' AND c.COD_PRE = @prestataireId';
      request.input('prestataireId', sql.Int, parseInt(prestataireId));
    }
    
    if (typeConsultation) {
      whereClause += ' AND c.TYPE_CONSULTATION = @typeConsultation';
      request.input('typeConsultation', sql.VarChar, typeConsultation);
    }
    
    if (status) {
      whereClause += ' AND c.STATUT_PAIEMENT = @status';
      request.input('status', sql.VarChar, status);
    }
    
    const consultationsQuery = `
      SELECT 
        c.*,
        b.NOM_BEN as beneficiaire_nom,
        b.PRE_BEN as beneficiaire_prenom,
        b.IDENTIFIANT_NATIONAL as identifiant_national,
        b.TELEPHONE_MOBILE as beneficiaire_telephone,
        p.SPECIALITE as specialite,
        p.NOM_PRESTATAIRE as prestataire_nom,
        p.PRENOM_PRESTATAIRE as prestataire_prenom,
        cs.NOM_CENTRE as centre_sante_nom
      FROM core.CONSULTATION c
      JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN
      LEFT JOIN core.PRESTATAIRE p ON c.COD_PRE = p.COD_PRE
      LEFT JOIN core.CENTRE_SANTE cs ON c.COD_CEN = cs.COD_CEN
      ${whereClause}
      ORDER BY c.DATE_CONSULTATION DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;
    
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, parseInt(limit));
    
    const result = await request.query(consultationsQuery);
    
    // Comptage total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM core.CONSULTATION c
      JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN
      ${whereClause}
    `;
    
    // Supprimer les paramètres offset et limit pour le count
    const countRequest = connection.request();
    
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      countRequest.input('userCountry', sql.VarChar, userCountry);
    }
    if (startDate && endDate) {
      countRequest.input('startDate', sql.Date, startDate);
      countRequest.input('endDate', sql.Date, endDate);
    }
    if (prestataireId) {
      countRequest.input('prestataireId', sql.Int, parseInt(prestataireId));
    }
    if (typeConsultation) {
      countRequest.input('typeConsultation', sql.VarChar, typeConsultation);
    }
    if (status) {
      countRequest.input('status', sql.VarChar, status);
    }
    
    const countResult = await countRequest.query(countQuery);
    
    const total = countResult.recordset[0]?.total || 0;
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({
      success: true,
      data: {
        consultations: result.recordset,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur récupération détails consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des détails des consultations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Tendances des consultations
router.get('/consultation-trends', auth, async (req, res) => {
  let connection;
  try {
    const { days = 30 } = req.query;
    
    connection = await getConnection();
    
    const userCountry = req.user.cod_pay;
    const userRole = req.user.role;
    
    // Tendances quotidiennes
    const trendsQuery = `
      SELECT 
        CONVERT(DATE, DATE_CONSULTATION) as date,
        DATENAME(WEEKDAY, DATE_CONSULTATION) as day_name,
        COUNT(*) as consultations,
        ISNULL(SUM(MONTANT_CONSULTATION), 0) as revenue
      FROM core.CONSULTATION c
      ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN' : ''}
      WHERE DATE_CONSULTATION >= DATEADD(DAY, -@days, GETDATE())
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
      GROUP BY CONVERT(DATE, DATE_CONSULTATION), DATENAME(WEEKDAY, DATE_CONSULTATION)
      ORDER BY date
    `;
    
    // Répartition par statut
    const statusQuery = `
      SELECT 
        STATUT_PAIEMENT as name,
        COUNT(*) as value
      FROM core.CONSULTATION c
      ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN' : ''}
      WHERE DATE_CONSULTATION >= DATEADD(DAY, -30, GETDATE())
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
      GROUP BY STATUT_PAIEMENT
      ORDER BY value DESC
    `;
    
    // Top bénéficiaires
    const topBenefQuery = `
      SELECT TOP 10
        b.NOM_BEN + ' ' + b.PRE_BEN as nom_complet,
        b.IDENTIFIANT_NATIONAL,
        COUNT(c.COD_CONS) as consultations_count,
        ISNULL(SUM(c.MONTANT_CONSULTATION), 0) as total_depense
      FROM core.CONSULTATION c
      JOIN core.BENEFICIAIRE b ON c.COD_BEN = b.ID_BEN
      WHERE c.DATE_CONSULTATION >= DATEADD(DAY, -90, GETDATE())
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND b.COD_PAY = @userCountry' : ''}
      GROUP BY b.NOM_BEN, b.PRE_BEN, b.IDENTIFIANT_NATIONAL
      ORDER BY consultations_count DESC
    `;

    const request = connection.request();
    request.input('days', sql.Int, parseInt(days));
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      request.input('userCountry', sql.VarChar, userCountry);
    }
    
    const [trendsResult, statusResult, topResult] = await Promise.all([
      request.query(trendsQuery),
      request.query(statusQuery),
      request.query(topBenefQuery)
    ]);

    res.json({
      success: true,
      data: {
        dailyTrends: trendsResult.recordset,
        statusDistribution: statusResult.recordset,
        topBeneficiaires: topResult.recordset,
        period: `${days} jours`
      }
    });
  } catch (error) {
    console.error('Erreur récupération tendances consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des tendances des consultations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Performance des prestataires
router.get('/prestataires-performance', auth, async (req, res) => {
  let connection;
  try {
    const { startDate, endDate } = req.query;
    
    connection = await getConnection();
    
    const userCountry = req.user.cod_pay;
    const userRole = req.user.role;
    
    let dateFilter = '';
    const request = connection.request();
    
    if (startDate && endDate) {
      dateFilter = 'AND c.DATE_CONSULTATION BETWEEN @startDate AND @endDate';
      request.input('startDate', sql.Date, startDate);
      request.input('endDate', sql.Date, endDate);
    } else {
      dateFilter = 'AND c.DATE_CONSULTATION >= DATEADD(DAY, -30, GETDATE())';
    }
    
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      request.input('userCountry', sql.VarChar, userCountry);
    }
    
    const performanceQuery = `
      SELECT 
        p.COD_PRE as id,
        p.NOM_PRESTATAIRE as nom,
        p.PRENOM_PRESTATAIRE as prenom,
        p.SPECIALITE as specialite,
        p.NUM_LICENCE as numero_license,
        COUNT(c.COD_CONS) as total_consultations,
        ISNULL(SUM(c.MONTANT_CONSULTATION), 0) as total_revenue,
        ISNULL(AVG(c.MONTANT_CONSULTATION), 0) as moyenne_par_consultation,
        MIN(c.DATE_CONSULTATION) as premiere_consultation,
        MAX(c.DATE_CONSULTATION) as derniere_consultation
      FROM core.PRESTATAIRE p
      LEFT JOIN core.CONSULTATION c ON p.COD_PRE = c.COD_PRE
        ${dateFilter}
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND EXISTS (SELECT 1 FROM core.BENEFICIAIRE b WHERE b.ID_BEN = c.COD_BEN AND b.COD_PAY = @userCountry)' : ''}
      WHERE p.ACTIF = 1
      GROUP BY p.COD_PRE, p.NOM_PRESTATAIRE, p.PRENOM_PRESTATAIRE, p.SPECIALITE, p.NUM_LICENCE
      ORDER BY total_consultations DESC
    `;
    
    // Statistiques globales
    const globalQuery = `
      SELECT 
        COUNT(DISTINCT COD_PRE) as prestataires_actifs,
        ISNULL(AVG(MONTANT_CONSULTATION), 0) as moyenne_prix_consultation,
        ISNULL(SUM(MONTANT_CONSULTATION), 0) as total_revenue
      FROM core.CONSULTATION
      WHERE DATE_CONSULTATION >= DATEADD(DAY, -30, GETDATE())
        ${userRole !== 'SuperAdmin' && userRole !== 'Admin' ? 'AND EXISTS (SELECT 1 FROM core.BENEFICIAIRE b WHERE b.ID_BEN = core.CONSULTATION.COD_BEN AND b.COD_PAY = @userCountry)' : ''}
    `;

    const [performanceResult, globalResult] = await Promise.all([
      request.query(performanceQuery),
      request.query(globalQuery)
    ]);

    res.json({
      success: true,
      data: {
        performance: performanceResult.recordset,
        globalStats: globalResult.recordset[0] || {}
      }
    });
  } catch (error) {
    console.error('Erreur récupération performance prestataires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de la performance des prestataires',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Statistiques par pays (SuperAdmin seulement)
router.get('/stats-by-country', auth, authorize('SuperAdmin'), async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    
    // Utiliser la procédure stockée pour les statistiques par pays
    const statsQuery = `
      EXEC core.usp_RapportStatistiquePays
    `;
    
    const result = await connection.request().query(statsQuery);

    res.json({
      success: true,
      data: result.recordset
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

module.exports = router;