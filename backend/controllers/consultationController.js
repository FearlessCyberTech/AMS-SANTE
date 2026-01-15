// backend/controllers/consultationController.js
const sql = require('mssql');
const dbConfig = require('../config/database');

class ConsultationController {
  // Créer une nouvelle consultation
  static async createConsultation(req, res) {
    let pool;
    try {
      const consultationData = req.body;
      
      console.log('Données reçues pour création consultation:', JSON.stringify(consultationData, null, 2));
      
      // Validation basique des champs obligatoires
      if (!consultationData.COD_BEN || !consultationData.COD_PRE || !consultationData.TYPE_CONSULTATION) {
        return res.status(400).json({ 
          success: false, 
          message: 'Champs obligatoires manquants: COD_BEN, COD_PRE, TYPE_CONSULTATION' 
        });
      }
      
      pool = await dbConfig.getConnection();
      
      // Vérifier que le patient existe
      console.log('Vérification du patient COD_BEN:', consultationData.COD_BEN);
      const patientCheck = await pool.request()
        .input('COD_BEN', sql.Int, consultationData.COD_BEN)
        .query('SELECT ID_BEN FROM [core].[BENEFICIAIRE] WHERE ID_BEN = @COD_BEN');
      
      console.log('Résultat vérification patient:', patientCheck.recordset);
      
      if (patientCheck.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient non trouvé'
        });
      }
      
      // Vérifier que le médecin existe et est actif
      console.log('Vérification du médecin COD_PRE:', consultationData.COD_PRE);
      const medecinCheck = await pool.request()
        .input('COD_PRE', sql.Int, consultationData.COD_PRE)
        .query('SELECT COD_PRE FROM [core].[PRESTATAIRE] WHERE COD_PRE = @COD_PRE AND ACTIF = 1');
      
      console.log('Résultat vérification médecin:', medecinCheck.recordset);
      
      if (medecinCheck.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Médecin non trouvé ou inactif'
        });
      }
      
      // Vérifier que le centre de santé existe (si fourni)
      if (consultationData.COD_CEN) {
        console.log('Vérification du centre COD_CEN:', consultationData.COD_CEN);
        const centreCheck = await pool.request()
          .input('COD_CEN', sql.Int, consultationData.COD_CEN)
          .query('SELECT COD_CEN FROM [core].[CENTRE_SANTE] WHERE COD_CEN = @COD_CEN AND ACTIF = 1');
        
        console.log('Résultat vérification centre:', centreCheck.recordset);
        
        if (centreCheck.recordset.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Centre de santé non trouvé ou inactif'
          });
        }
      }
      
      // Insérer la consultation
      const query = `
        INSERT INTO [core].[CONSULTATION] 
          (COD_BEN, COD_CEN, COD_PRE, DATE_CONSULTATION, TYPE_CONSULTATION, 
           MOTIF_CONSULTATION, OBSERVATIONS, DIAGNOSTIC, 
           TA, POIDS, TAILLE, TEMPERATURE, POULS, FREQUENCE_RESPIRATOIRE,
           GLYCEMIE, EXAMENS_COMPLEMENTAIRES, TRAITEMENT_PRESCRIT,
           PROCHAIN_RDV, MONTANT_CONSULTATION, STATUT_PAIEMENT,
           URGENT, HOSPITALISATION, COD_CREUTIL, DAT_CREUTIL)
        OUTPUT INSERTED.COD_CONS
        VALUES 
          (@COD_BEN, @COD_CEN, @COD_PRE, @DATE_CONSULTATION, @TYPE_CONSULTATION,
           @MOTIF_CONSULTATION, @OBSERVATIONS, @DIAGNOSTIC,
           @TA, @POIDS, @TAILLE, @TEMPERATURE, @POULS, @FREQUENCE_RESPIRATOIRE,
           @GLYCEMIE, @EXAMENS_COMPLEMENTAIRES, @TRAITEMENT_PRESCRIT,
           @PROCHAIN_RDV, @MONTANT_CONSULTATION, @STATUT_PAIEMENT,
           @URGENT, @HOSPITALISATION, @COD_CREUTIL, GETDATE())
      `;
      
      console.log('Exécution de l\'insertion...');
      
      const request = pool.request()
        .input('COD_BEN', sql.Int, consultationData.COD_BEN)
        .input('COD_CEN', sql.Int, consultationData.COD_CEN || null)
        .input('COD_PRE', sql.Int, consultationData.COD_PRE)
        .input('DATE_CONSULTATION', sql.DateTime, consultationData.DATE_CONSULTATION || new Date())
        .input('TYPE_CONSULTATION', sql.VarChar(30), consultationData.TYPE_CONSULTATION)
        .input('MOTIF_CONSULTATION', sql.VarChar(500), consultationData.MOTIF_CONSULTATION || '')
        .input('OBSERVATIONS', sql.VarChar(1000), consultationData.OBSERVATIONS || '')
        .input('DIAGNOSTIC', sql.VarChar(500), consultationData.DIAGNOSTIC || '')
        .input('TA', sql.VarChar(20), consultationData.TA || '')
        .input('POIDS', sql.Decimal(5,2), consultationData.POIDS !== undefined ? consultationData.POIDS : null)
        .input('TAILLE', sql.Decimal(5,2), consultationData.TAILLE !== undefined ? consultationData.TAILLE : null)
        .input('TEMPERATURE', sql.Decimal(4,1), consultationData.TEMPERATURE !== undefined ? consultationData.TEMPERATURE : null)
        .input('POULS', sql.Int, consultationData.POULS !== undefined ? consultationData.POULS : null)
        .input('FREQUENCE_RESPIRATOIRE', sql.Int, consultationData.FREQUENCE_RESPIRATOIRE !== undefined ? consultationData.FREQUENCE_RESPIRATOIRE : null)
        .input('GLYCEMIE', sql.Decimal(5,2), consultationData.GLYCEMIE !== undefined ? consultationData.GLYCEMIE : null)
        .input('EXAMENS_COMPLEMENTAIRES', sql.VarChar(500), consultationData.EXAMENS_COMPLEMENTAIRES || '')
        .input('TRAITEMENT_PRESCRIT', sql.VarChar(1000), consultationData.TRAITEMENT_PRESCRIT || '')
        .input('PROCHAIN_RDV', sql.Date, consultationData.PROCHAIN_RDV || null)
        .input('MONTANT_CONSULTATION', sql.Decimal(12,2), consultationData.MONTANT_CONSULTATION || 0)
        .input('STATUT_PAIEMENT', sql.VarChar(20), consultationData.STATUT_PAIEMENT || 'En attente')
        .input('URGENT', sql.Bit, consultationData.URGENT ? 1 : 0)
        .input('HOSPITALISATION', sql.Bit, consultationData.HOSPITALISATION ? 1 : 0)
        .input('COD_CREUTIL', sql.VarChar(16), consultationData.COD_CREUTIL || req.user?.username || 'SYSTEM');
      
      const result = await request.query(query);
      
      console.log('Insertion réussie, résultat:', result);
      
      const consultationId = result.recordset[0]?.COD_CONS;
      
      if (!consultationId) {
        throw new Error('Aucun ID de consultation retourné');
      }
      
      // Journaliser la création
      await this.logAudit('CREATE', 'CONSULTATION', consultationId, consultationData.COD_CREUTIL || req.user?.username || 'SYSTEM', 'Nouvelle consultation créée');
      
      return res.json({
        success: true,
        consultationId: consultationId,
        message: 'Consultation créée avec succès'
      });
      
    } catch (error) {
      console.error('Erreur détaillée création consultation:', error);
      console.error('Stack trace:', error.stack);
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la consultation',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code,
          number: error.number,
          state: error.state,
          class: error.class,
          serverName: error.serverName,
          procName: error.procName,
          lineNumber: error.lineNumber
        } : undefined
      });
    }
  }

  // Rechercher des patients
  static async searchPatients(req, res) {
    try {
      const { searchTerm } = req.query;
      if (!searchTerm || searchTerm.trim() === '') {
        return res.json({
          success: true,
          patients: []
        });
      }
      
      const pool = await dbConfig.getConnection();
      
      const query = `
        SELECT TOP 10 
          ID_BEN as COD_BEN,
          NOM_BEN,
          PRENOM_BEN as PRE_BEN,
          DATE_NAISSANCE as NAI_BEN,
          IDENTIFIANT_NATIONAL as NUM_ASSURE,
          TELEPHONE_MOBILE
        FROM [core].[BENEFICIAIRE]
        WHERE (NOM_BEN LIKE @searchTerm 
           OR PRENOM_BEN LIKE @searchTerm
           OR IDENTIFIANT_NATIONAL LIKE @searchTerm
           OR TELEPHONE_MOBILE LIKE @searchTerm)
           AND RETRAIT_DATE IS NULL
        ORDER BY NOM_BEN, PRENOM_BEN
      `;
      
      const result = await pool.request()
        .input('searchTerm', sql.VarChar, `%${searchTerm}%`)
        .query(query);
      
      return res.json({
        success: true,
        patients: result.recordset
      });
    } catch (error) {
      console.error('Erreur recherche patients:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche des patients'
      });
    }
  }

  // Récupérer la liste des médecins
  static async getMedecins(req, res) {
    try {
      const pool = await dbConfig.getConnection();
      
      const query = `
        SELECT 
          COD_PRE,
          NOM_PRESTATAIRE + ' ' + ISNULL(PRENOM_PRESTATAIRE, '') as NOM_PRENOM,
          SPECIALITE,
          TITRE
        FROM [core].[PRESTATAIRE]
        WHERE ACTIF = 1
        ORDER BY NOM_PRESTATAIRE, PRENOM_PRESTATAIRE
      `;
      
      const result = await pool.request().query(query);
      
      return res.json({
        success: true,
        medecins: result.recordset
      });
    } catch (error) {
      console.error('Erreur récupération médecins:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des médecins'
      });
    }
  }

  // Récupérer les types de consultation
  static async getTypesConsultation(req, res) {
    try {
      const pool = await dbConfig.getConnection();
      
      const query = `
        SELECT 
          COD_TYP_CONS as value,
          LIB_TYP_CONS as label,
          MONTANT
        FROM [metier].[TYPE_CONSULTATION]
        WHERE ACTIF = 1
        ORDER BY LIB_TYP_CONS
      `;
      
      const result = await pool.request().query(query);
      
      if (result.recordset.length > 0) {
        return res.json({
          success: true,
          types: result.recordset
        });
      } else {
        // Liste de secours si la table est vide
        const typesConsultation = [
          { value: 'GENERALE', label: 'Consultation Générale', MONTANT: 5000 },
          { value: 'SPECIALISTE', label: 'Consultation Spécialiste', MONTANT: 10000 },
          { value: 'URGENCE', label: 'Consultation d\'Urgence', MONTANT: 8000 },
          { value: 'SUIVI', label: 'Consultation de Suivi', MONTANT: 4000 },
          { value: 'PREVENTIVE', label: 'Consultation Préventive', MONTANT: 6000 }
        ];
        
        return res.json({
          success: true,
          types: typesConsultation
        });
      }
    } catch (error) {
      console.error('Erreur récupération types consultation:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des types de consultation'
      });
    }
  }

  // Calculer le décompte
  static async calculateDecompte(req, res) {
    try {
      const consultationData = req.body;
      
      if (!consultationData.TYPE_CONSULTATION || !consultationData.MONTANT_CONSULTATION) {
        return res.status(400).json({
          success: false,
          message: 'Type de consultation et montant requis'
        });
      }
      
      // Récupérer le montant de la table TYPE_CONSULTATION si disponible
      let montantBase = consultationData.MONTANT_CONSULTATION;
      
      try {
        const pool = await dbConfig.getConnection();
        const typeQuery = await pool.request()
          .input('TYPE_CONSULTATION', sql.VarChar, consultationData.TYPE_CONSULTATION)
          .query(`
            SELECT MONTANT 
            FROM [metier].[TYPE_CONSULTATION] 
            WHERE LIB_TYP_CONS LIKE '%' + @TYPE_CONSULTATION + '%' 
            OR COD_TYP_CONS = @TYPE_CONSULTATION
          `);
        
        if (typeQuery.recordset.length > 0) {
          montantBase = typeQuery.recordset[0].MONTANT;
        }
      } catch (error) {
        console.log('Utilisation du montant fourni:', montantBase);
      }
      
      // Logique de calcul du décompte
      let montantPriseEnCharge = 0;
      let resteCharge = montantBase;
      
      // Exemple de calcul simplifié - à adapter selon vos règles métier
      if (consultationData.TYPE_CONSULTATION === 'GENERALE' || consultationData.TYPE_CONSULTATION.includes('GÉNÉRALE')) {
        montantPriseEnCharge = montantBase * 0.8; // 80% pris en charge
        resteCharge = montantBase - montantPriseEnCharge;
      } else if (consultationData.TYPE_CONSULTATION === 'URGENCE' || consultationData.TYPE_CONSULTATION.includes('URGENCE')) {
        montantPriseEnCharge = montantBase * 0.9; // 90% pris en charge
        resteCharge = montantBase - montantPriseEnCharge;
      } else {
        montantPriseEnCharge = montantBase * 0.7; // 70% pris en charge par défaut
        resteCharge = montantBase - montantPriseEnCharge;
      }
      
      return res.json({
        success: true,
        decompte: {
          montantTotal: montantBase,
          montantPriseEnCharge: parseFloat(montantPriseEnCharge.toFixed(2)),
          resteCharge: parseFloat(resteCharge.toFixed(2))
        }
      });
    } catch (error) {
      console.error('Erreur calcul décompte:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du calcul du décompte'
      });
    }
  }

  // Générer la feuille de prise en charge
  static async generateFeuillePriseEnCharge(req, res) {
    try {
      const { consultationId } = req.params;
      const pool = await dbConfig.getConnection();
      
      // Récupérer les informations de la consultation
      const query = `
        SELECT 
          c.*,
          b.NOM_BEN, b.PRENOM_BEN as PRE_BEN, b.NAI_BEN, b.IDENTIFIANT_NATIONAL,
          p.NOM_PRESTATAIRE, p.PRENOM_PRESTATAIRE, p.SPECIALITE, p.TITRE,
          cs.NOM_CENTRE, cs.TYPE_CENTRE
        FROM [core].[CONSULTATION] c
        INNER JOIN [core].[BENEFICIAIRE] b ON c.COD_BEN = b.ID_BEN
        LEFT JOIN [core].[PRESTATAIRE] p ON c.COD_PRE = p.COD_PRE
        LEFT JOIN [core].[CENTRE_SANTE] cs ON c.COD_CEN = cs.COD_CEN
        WHERE c.COD_CONS = @consultationId
      `;
      
      const result = await pool.request()
        .input('consultationId', sql.Int, consultationId)
        .query(query);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Consultation non trouvée'
        });
      }
      
      const consultation = result.recordset[0];
      
      // Générer un PDF ou retourner les données pour affichage
      // Pour l'instant, retournons les données
      return res.json({
        success: true,
        consultation: consultation,
        message: 'Données pour la feuille de prise en charge récupérées avec succès'
      });
    } catch (error) {
      console.error('Erreur génération feuille prise en charge:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération de la feuille de prise en charge'
      });
    }
  }
  
  // Journaliser les actions
  static async logAudit(typeAction, table, idEnregistrement, utilisateur, description) {
    try {
      const pool = await dbConfig.getConnection();
      
      const query = `
        INSERT INTO [audit].[SYSTEM_AUDIT] 
          (TYPE_ACTION, TABLE_CONCERNEE, ID_ENREGISTREMENT, UTILISATEUR, DESCRIPTION, DATE_AUDIT)
        VALUES 
          (@typeAction, @table, @idEnregistrement, @utilisateur, @description, GETDATE())
      `;
      
      await pool.request()
        .input('typeAction', sql.VarChar, typeAction)
        .input('table', sql.VarChar, table)
        .input('idEnregistrement', sql.VarChar, idEnregistrement)
        .input('utilisateur', sql.VarChar, utilisateur)
        .input('description', sql.VarChar, description)
        .query(query);
    } catch (error) {
      console.error('Erreur journalisation audit:', error);
    }
  }
}

module.exports = ConsultationController;