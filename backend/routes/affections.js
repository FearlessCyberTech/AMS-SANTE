// routes/affections.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');

// GET /api/affections/search?q=...
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
          COD_AFF,
          LIB_AFF,
          NCP_AFF
        FROM metier.AFFECTION
        WHERE COD_AFF LIKE @search OR LIB_AFF LIKE @search
        ORDER BY LIB_AFF
      `);
    
    res.json({
      success: true,
      affections: result.recordset.map(a => ({
        code: a.COD_AFF,
        libelle: a.LIB_AFF,
        ncp: a.NCP_AFF
      }))
    });
  } catch (error) {
    console.error('Erreur recherche affections:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;