// backend/models/Beneficiaire.js
const sql = require('mssql');
const dbConfig = require('../config/database');

class Beneficiaire {
  // Trouver un bénéficiaire par ID
  static async findById(id) {
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT 
        b.*,
        p.LIB_PAY as PAYS,
        dbo.fCalculAge(b.NAI_BEN, GETDATE()) as AGE,
        FORMAT((SELECT MAX(DATE_CONSULTATION) 
                FROM [core].[CONSULTATION] c 
                WHERE c.COD_BEN = b.ID_BEN), 'dd/MM/yyyy') as DERNIERE_CONSULTATION
      FROM [core].[BENEFICIAIRE] b
      LEFT JOIN [ref].[PAYS] p ON b.COD_PAY = p.COD_PAY
      WHERE b.ID_BEN = @id AND b.RETRAIT_DATE IS NULL
    `;
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(query);
    
    return result.recordset[0];
  }

  // Rechercher des bénéficiaires
  static async search(searchTerm) {
    const pool = await dbConfig.getConnection();
    
    const query = `
      SELECT TOP 20
        ID_BEN,
        NOM_BEN,
        PRE_BEN,
        SEX_BEN,
        NAI_BEN,
        dbo.fCalculAge(NAI_BEN, GETDATE()) as AGE,
        TELEPHONE_MOBILE,
        EMAIL,
        IDENTIFIANT_NATIONAL,
        GROUPE_SANGUIN,
        RHESUS,
        PROFESSION,
        COD_PAY
      FROM [core].[BENEFICIAIRE]
      WHERE RETRAIT_DATE IS NULL
        AND (NOM_BEN LIKE @search OR 
             PRE_BEN LIKE @search OR 
             IDENTIFIANT_NATIONAL LIKE @search OR
             TELEPHONE_MOBILE LIKE @search)
      ORDER BY NOM_BEN, PRE_BEN
    `;
    
    const result = await pool.request()
      .input('search', sql.VarChar, `%${searchTerm}%`)
      .query(query);
    
    return result.recordset;
  }
}

module.exports = Beneficiaire;