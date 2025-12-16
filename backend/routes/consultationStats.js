const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get all consultations with filters
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      startDate, 
      endDate,
      status,
      doctorId,
      patientId 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let baseQuery = `
      SELECT 
        c.*,
        p.nom as patient_nom,
        p.prenom as patient_prenom,
        p.numero_carte,
        p.date_naissance as patient_date_naissance,
        p.genre as patient_genre,
        m.specialite,
        m.taux_prise_en_charge,
        u.nom as medecin_nom,
        u.prenom as medecin_prenom,
        tc.nom as type_consultation_nom,
        tc.code as type_consultation_code,
        tc.tarif as tarif_reference,
        creator.nom as createur_nom,
        creator.prenom as createur_prenom
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN medecins m ON c.medecin_id = m.id
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN types_consultation tc ON c.type_consultation_id = tc.id
      LEFT JOIN users creator ON c.created_by = creator.id
      WHERE 1=1
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    const countParams = [];
    
    if (search) {
      baseQuery += ` AND (p.nom LIKE ? OR p.prenom LIKE ? OR p.numero_carte LIKE ?)`;
      countQuery += ` AND (p.nom LIKE ? OR p.prenom LIKE ? OR p.numero_carte LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (startDate && endDate) {
      baseQuery += ` AND DATE(c.date_consultation) BETWEEN ? AND ?`;
      countQuery += ` AND DATE(c.date_consultation) BETWEEN ? AND ?`;
      queryParams.push(startDate, endDate);
      countParams.push(startDate, endDate);
    }
    
    if (status) {
      baseQuery += ` AND c.statut = ?`;
      countQuery += ` AND c.statut = ?`;
      queryParams.push(status);
      countParams.push(status);
    }
    
    if (doctorId) {
      baseQuery += ` AND c.medecin_id = ?`;
      countQuery += ` AND c.medecin_id = ?`;
      queryParams.push(doctorId);
      countParams.push(doctorId);
    }
    
    if (patientId) {
      baseQuery += ` AND c.patient_id = ?`;
      countQuery += ` AND c.patient_id = ?`;
      queryParams.push(patientId);
      countParams.push(patientId);
    }
    
    baseQuery += ` ORDER BY c.date_consultation DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), offset);
    
    const [consultations] = await db.execute(baseQuery, queryParams);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: consultations,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des consultations'
    });
  }
});

// Get consultation statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year
    
    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = `DATE(date_consultation) = CURDATE()`;
        break;
      case 'week':
        dateFilter = `YEARWEEK(date_consultation, 1) = YEARWEEK(CURDATE(), 1)`;
        break;
      case 'year':
        dateFilter = `YEAR(date_consultation) = YEAR(CURDATE())`;
        break;
      default: // month
        dateFilter = `MONTH(date_consultation) = MONTH(CURDATE()) AND YEAR(date_consultation) = YEAR(CURDATE())`;
    }
    
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_consultations,
        SUM(montant_total) as total_revenue,
        SUM(montant_pris_en_charge) as total_insurance,
        SUM(reste_a_charge) as total_patient_share,
        COUNT(CASE WHEN consultation_gratuite = 1 THEN 1 END) as free_consultations,
        COUNT(CASE WHEN statut = 'validee' THEN 1 END) as validated,
        COUNT(CASE WHEN statut = 'facturee' THEN 1 END) as invoiced,
        COUNT(CASE WHEN statut = 'payee' THEN 1 END) as paid,
        COUNT(CASE WHEN statut = 'annulee' THEN 1 END) as cancelled,
        AVG(montant_total) as avg_amount
      FROM consultations
      WHERE ${dateFilter}
    `);
    
    // Daily consultations for the last 7 days
    const [dailyStats] = await db.execute(`
      SELECT 
        DATE(date_consultation) as date,
        DAYNAME(date_consultation) as day,
        COUNT(*) as consultations,
        SUM(montant_total) as revenue,
        SUM(montant_pris_en_charge) as insurance,
        SUM(reste_a_charge) as patient_share
      FROM consultations
      WHERE date_consultation >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(date_consultation), DAYNAME(date_consultation)
      ORDER BY date
    `);
    
    // Consultations by doctor
    const [doctorStats] = await db.execute(`
      SELECT 
        m.id,
        u.nom,
        u.prenom,
        m.specialite,
        COUNT(c.id) as consultations_count,
        SUM(c.montant_total) as total_revenue,
        AVG(c.montant_total) as avg_revenue
      FROM medecins m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN consultations c ON m.id = c.medecin_id 
        AND ${dateFilter}
      WHERE m.is_active = 1
      GROUP BY m.id, u.nom, u.prenom, m.specialite
      ORDER BY consultations_count DESC
    `);
    
    // Consultations by type
    const [typeStats] = await db.execute(`
      SELECT 
        tc.id,
        tc.nom,
        tc.code,
        tc.tarif,
        COUNT(c.id) as consultations_count,
        SUM(c.montant_total) as total_revenue
      FROM types_consultation tc
      LEFT JOIN consultations c ON tc.id = c.type_consultation_id 
        AND ${dateFilter}
      WHERE tc.is_active = 1
      GROUP BY tc.id, tc.nom, tc.code, tc.tarif
      ORDER BY consultations_count DESC
    `);
    
    res.json({
      success: true,
      data: {
        summary: stats[0] || {},
        dailyStats,
        doctorStats,
        typeStats,
        period
      }
    });
  } catch (error) {
    console.error('Erreur récupération statistiques consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
});

// Get consultation details
router.get('/:id/details', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [consultation] = await db.execute(`
      SELECT 
        c.*,
        p.nom as patient_nom,
        p.prenom as patient_prenom,
        p.numero_carte,
        p.date_naissance as patient_date_naissance,
        p.genre as patient_genre,
        p.telephone as patient_telephone,
        p.email as patient_email,
        p.adresse as patient_adresse,
        p.ville as patient_ville,
        p.assurance as patient_assurance,
        p.numero_assurance as patient_numero_assurance,
        m.specialite,
        m.taux_prise_en_charge,
        m.numero_license,
        u.nom as medecin_nom,
        u.prenom as medecin_prenom,
        u.email as medecin_email,
        u.telephone as medecin_telephone,
        tc.nom as type_consultation_nom,
        tc.code as type_consultation_code,
        tc.tarif as tarif_reference,
        creator.nom as createur_nom,
        creator.prenom as createur_prenom
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN medecins m ON c.medecin_id = m.id
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN types_consultation tc ON c.type_consultation_id = tc.id
      LEFT JOIN users creator ON c.created_by = creator.id
      WHERE c.id = ?
    `, [id]);
    
    if (consultation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultation non trouvée'
      });
    }
    
    // Get related prescriptions
    const [prescriptions] = await db.execute(`
      SELECT 
        p.*,
        pat.nom as patient_nom,
        pat.prenom as patient_prenom
      FROM prescriptions p
      LEFT JOIN patients pat ON p.patient_id = pat.id
      WHERE p.consultation_id = ?
    `, [id]);
    
    // Get diagnosis codes
    const [diagnosis] = await db.execute(`
      SELECT 
        ca.*
      FROM consultation_affections cca
      LEFT JOIN codes_affection ca ON cca.code_affection_id = ca.id
      WHERE cca.consultation_id = ?
    `, [id]);
    
    res.json({
      success: true,
      data: {
        consultation: consultation[0],
        prescriptions,
        diagnosis
      }
    });
  } catch (error) {
    console.error('Erreur récupération détails consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des détails'
    });
  }
});

// Update consultation status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    const validStatuses = ['brouillon', 'validee', 'facturee', 'payee', 'annulee'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }
    
    const [result] = await db.execute(
      `UPDATE consultations SET statut = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultation non trouvée'
      });
    }
    
    // Log the status change
    await db.execute(
      `INSERT INTO logs_activite (user_id, action, table_concernée, enregistrement_id, anciennes_valeurs, nouvelles_valeurs) 
       VALUES (?, 'UPDATE_STATUS', 'consultations', ?, ?, ?)`,
      [
        req.user.id,
        id,
        JSON.stringify({ action: 'status_change', reason }),
        JSON.stringify({ status })
      ]
    );
    
    res.json({
      success: true,
      message: `Consultation marquée comme ${status}`
    });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du statut'
    });
  }
});

// Export consultations to Excel
router.get('/export', auth, async (req, res) => {
  try {
    const { startDate, endDate, format = 'excel' } = req.query;
    
    const [consultations] = await db.execute(`
      SELECT 
        c.numero_prise_en_charge,
        c.date_consultation,
        c.statut,
        CONCAT(p.prenom, ' ', p.nom) as patient,
        p.numero_carte,
        CONCAT(u.prenom, ' ', u.nom) as medecin,
        m.specialite,
        tc.nom as type_consultation,
        c.montant_total,
        c.montant_pris_en_charge,
        c.reste_a_charge,
        c.consultation_gratuite,
        c.observations
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN medecins m ON c.medecin_id = m.id
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN types_consultation tc ON c.type_consultation_id = tc.id
      WHERE (? IS NULL OR DATE(c.date_consultation) >= ?)
        AND (? IS NULL OR DATE(c.date_consultation) <= ?)
      ORDER BY c.date_consultation DESC
    `, [startDate, startDate, endDate, endDate]);
    
    // In a real implementation, you would generate Excel/CSV file
    // Using a library like exceljs or csv-writer
    
    res.json({
      success: true,
      data: consultations,
      count: consultations.length,
      exportFormat: format
    });
  } catch (error) {
    console.error('Erreur export consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'export des consultations'
    });
  }
});

module.exports = router;