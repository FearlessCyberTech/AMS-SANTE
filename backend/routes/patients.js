// routes/patients.js - VERSION FINALE
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const { auth } = require('../middleware/auth'); // IMPORTANT: désructurez!

router.get('/', auth, async (req, res) => {
  let connection;
  try {
    const userCountry = req.user.cod_pay;
    const userRole = req.user.role;
    
    connection = await getConnection();
    
    let query = `
      SELECT TOP 100 
        ID_BEN as id, 
        NOM_BEN as nom, 
        PRE_BEN as prenom, 
        IDENTIFIANT_NATIONAL as numero_carte, 
        NAI_BEN as date_naissance,
        SEX_BEN as genre,
        TELEPHONE_MOBILE as telephone,
        EMAIL as email,
        PROFESSION as profession,
        COD_PAY as cod_pay
      FROM core.BENEFICIAIRE 
      WHERE RETRAIT_DATE IS NULL
    `;
    
    const request = connection.request();
    
    // Filtrer par pays si l'utilisateur n'est pas admin
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      query += ' AND COD_PAY = @userCountry';
      request.input('userCountry', sql.VarChar, userCountry);
    }
    
    query += ' ORDER BY NOM_BEN, PRE_BEN';
    
    const result = await request.query(query);
    
    res.json({ 
      success: true, 
      data: result.recordset,
      count: result.recordset.length
    });
    
  } catch (error) {
    console.error('Erreur récupération patients:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la récupération des patients',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Erreur fermeture connexion:', closeError);
      }
    }
  }
});

module.exports = router;