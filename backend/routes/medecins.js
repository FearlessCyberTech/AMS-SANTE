router.get('/', async (req, res) => {
  try {
    const pool = await dbConfig.getConnection();
    
    const result = await pool.request().query(`
      SELECT 
        COD_PRE,
        NOM_PRESTATAIRE,
        PRENOM_PRESTATAIRE,
        CONCAT(NOM_PRESTATAIRE, ' ', ISNULL(PRENOM_PRESTATAIRE, '')) as NOM_COMPLET,
        SPECIALITE,
        TITRE,
        NUM_LICENCE,
        TELEPHONE,
        EMAIL,
        CENTRE_PRATIQUE,
        COD_CEN,
        HONORAIRES,
        LANGUE_PARLEE,
        EXPERIENCE_ANNEE
      FROM [core].[PRESTATAIRE] 
      WHERE (TYPE_PRESTATAIRE = 'M' OR TYPE_PRESTATAIRE LIKE '%M%' OR SPECIALITE IS NOT NULL)
        AND ACTIF = 1
      ORDER BY NOM_PRESTATAIRE, PRENOM_PRESTATAIRE
    `);
    
    res.json({
      success: true,
      medecins: result.recordset,
      total: result.recordset.length
    });
    
  } catch (error) {
    console.error('Erreur récupération médecins:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des médecins',
      error: error.message
    });
  }
});