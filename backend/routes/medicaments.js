// routes/medicaments.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');

// GET /api/medicaments/search?q=...
router.get('/search', async (req, res) => {
  try {
    const search = req.query.q || '';
    const limit = req.query.limit || 20;
    
    const pool = await sql.connect();
    const result = await pool.request()
      .input('search', sql.VarChar, `%${search}%`)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit) 
          COD_MED, 
          NOM_COMMERCIAL,
          NOM_GENERIQUE,
          FORME_PHARMACEUTIQUE as FORME,
          DOSAGE,
          PRIX_UNITAIRE,
          REMBOURSABLE,
          STOCK_MINIMUM,
          ACTIF
        FROM metier.MEDICAMENT
        WHERE (NOM_COMMERCIAL LIKE @search OR NOM_GENERIQUE LIKE @search)
          AND ACTIF = 1
        ORDER BY NOM_COMMERCIAL
      `);
    
    res.json({
      success: true,
      medicaments: result.recordset
    });
  } catch (error) {
    console.error('Erreur recherche médicaments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;