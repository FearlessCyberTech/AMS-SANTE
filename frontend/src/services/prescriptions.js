// src/services/prescriptions.js
import axios from 'axios';

// Configuration de base d'axios
const api = axios.create({
  baseURL: 'http://localhost:3000/api/prescriptions',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes de timeout
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ Token non trouvé dans localStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ Erreur intercepteur requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour logging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    // Gestion spécifique des erreurs 401 (non autorisé)
    if (error.response?.status === 401) {
      console.error('🔐 Session expirée, redirection vers login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Service d'API pour les prescriptions
const prescriptionsAPI = {
  // ============================================
  // DONNÉES DE RÉFÉRENCE
  // ============================================
  
  // Récupérer la liste des affections
  getAffections: async (searchTerm = '', limit = 20) => {
    try {
      const response = await api.get('/data/affections', {
        params: { 
          search: searchTerm, 
          limit: limit 
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur recherche affections:', error);
      // Retourner des données de secours
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de connexion',
        affections: [
          { code: 'A01', libelle: 'Choléra dû à Vibrio cholerae 01, biovar cholerae' },
          { code: 'A010', libelle: 'Choléra dû à Vibrio cholerae 01, biovar cholerae' },
          { code: 'A011', libelle: 'Choléra dû à Vibrio cholerae 01, biovar eltor' }
        ]
      };
    }
  },

  // Récupérer les types de prestation
  getTypesPrestation: async () => {
    try {
      const response = await api.get('/data/types-prestation');
      return response.data;
    } catch (error) {
      console.error('Erreur types prestation:', error);
      return {
        success: false,
        message: 'Erreur de connexion',
        types: []
      };
    }
  },

  // Récupérer les types d'affections
  getTypesAffection: async () => {
    try {
      const response = await api.get('/data/types-affection');
      return response.data;
    } catch (error) {
      console.error('Erreur types affection:', error);
      return {
        success: false,
        message: 'Erreur de connexion',
        types: []
      };
    }
  },

  // Rechercher des éléments (médicaments/actes)
  searchElements: async (type, searchTerm, limit = 20) => {
    try {
      const response = await api.get('/search-elements', {
        params: { 
          type: type, 
          search: searchTerm, 
          limit: limit 
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur recherche éléments:', error);
      return {
        success: false,
        message: 'Erreur de connexion',
        elements: []
      };
    }
  },

  // ============================================
  // GESTION DES PRESCRIPTIONS
  // ============================================
  
  // Créer une nouvelle prescription
  createPrescription: async (prescriptionData) => {
    try {
      console.log('📤 Envoi création prescription:', prescriptionData);
      
      // Validation minimale côté client
      if (!prescriptionData.COD_BEN) {
        return {
          success: false,
          message: 'Patient obligatoire'
        };
      }
      
      if (!prescriptionData.COD_AFF) {
        return {
          success: false,
          message: 'Affection obligatoire'
        };
      }
      
      if (!prescriptionData.elements || prescriptionData.elements.length === 0) {
        return {
          success: false,
          message: 'Ajoutez au moins un élément'
        };
      }
      
      const response = await api.post('/create', prescriptionData);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur création prescription:', error);
      
      if (error.response) {
        return {
          success: false,
          message: error.response.data.message || 'Erreur lors de la création',
          error: error.response.data
        };
      }
      
      return {
        success: false,
        message: error.message || 'Erreur de connexion au serveur'
      };
    }
  },

  // Rechercher des prescriptions
  searchPrescriptions: async (filters = {}) => {
    try {
      console.log('🔍 Recherche prescriptions avec filtres:', filters);
      
      const response = await api.get('/search', { 
        params: filters 
      });
      return response.data;
    } catch (error) {
      console.error('Erreur recherche prescriptions:', error);
      return {
        success: false,
        message: 'Erreur de connexion',
        prescriptions: []
      };
    }
  },

  // Récupérer une prescription par son numéro
  getPrescriptionByNumber: async (prescriptionNumber) => {
    try {
      const response = await api.get(`/${prescriptionNumber}`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération prescription:', error);
      return {
        success: false,
        message: 'Prescription non trouvée',
        error: error.response?.data
      };
    }
  },

  // Exécuter une prescription
  executePrescription: async (prescriptionNumber, executionData) => {
    try {
      console.log('⚡ Exécution prescription:', prescriptionNumber);
      
      const response = await api.post(`/${prescriptionNumber}/execute`, executionData);
      return response.data;
    } catch (error) {
      console.error('Erreur exécution prescription:', error);
      
      if (error.response) {
        return {
          success: false,
          message: error.response.data.message || 'Erreur lors de l\'exécution',
          error: error.response.data
        };
      }
      
      return {
        success: false,
        message: 'Erreur de connexion'
      };
    }
  },

  // ============================================
  // STATISTIQUES ET RAPPORTS
  // ============================================
  
  // Obtenir les statistiques par affections
  getStatsByAffections: async (dateRange = {}) => {
    try {
      const response = await api.get('/stats/affections', {
        params: dateRange
      });
      return response.data;
    } catch (error) {
      console.error('Erreur statistiques:', error);
      return {
        success: false,
        message: 'Erreur de connexion',
        stats: []
      };
    }
  },

  // ============================================
  // UTILITAIRES
  // ============================================
  
  // Tester la connexion à l'API
  testConnection: async () => {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      console.error('❌ Test connexion échoué:', error);
      return {
        success: false,
        message: 'Impossible de se connecter au serveur',
        error: error.message
      };
    }
  },

  // Formater une affection pour l'affichage
  formatAffection: (affection) => {
    if (!affection) return '';
    return `${affection.code} - ${affection.libelle}`;
  },

  // Formater un élément pour l'affichage
  formatElement: (element) => {
    if (!element) return '';
    
    if (element.TYPE === 'Medicament') {
      return `${element.LIBELLE}${element.NOM_GENERIQUE ? ` (${element.NOM_GENERIQUE})` : ''}${element.DOSAGE ? ` - ${element.DOSAGE}` : ''}`;
    } else {
      return `${element.LIBELLE}${element.DESCRIPTION ? ` - ${element.DESCRIPTION}` : ''}`;
    }
  }
};

export default prescriptionsAPI;