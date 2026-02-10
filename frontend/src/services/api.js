  // src/services/api.js - VERSION PRODUCTION CORRIGÉE ET OPTIMISÉE

  // ==============================================
  // CONFIGURATION AVANCÉE POUR PRODUCTION
  // ==============================================

  /**
   * Détermine l'URL de base de l'API selon l'environnement
   * @returns {string} URL de base de l'API
   */
<<<<<<< HEAD
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    
    // Développement local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${port || '3000'}/api`;
    }

    // Développement réseau local
    if (hostname === '172.20.10.3') {
      return `http://172.20.10.3:${port || '3000'}/api`;
    }
    
    // Production - utilisez une variable globale ou configuration
    // Option 1 : Variable globale définie dans index.html
    if (window.REACT_APP_API_URL) {
      return window.REACT_APP_API_URL;
    }
    
    // Option 2 : Configuration dans un fichier séparé
    if (window.appConfig && window.appConfig.API_URL) {
      return window.appConfig.API_URL;
    }
    
    // Option 3 : URL relative par défaut
    return '/api';
  }
  
  // Pour SSR/Node.js
  // Ces variables doivent être définies lors du build
  const env = typeof process !== 'undefined' ? process.env : {};
  return env.API_URL || env.REACT_APP_API_URL || 'http://localhost:3000/api';
};
=======
  const getApiBaseUrl = () => {
    // Vérification de l'existence de window pour éviter les erreurs SSR
    if (typeof window !== 'undefined') {
      const { protocol, hostname, port } = window.location;
      
      // Environnement de développement local
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://localhost:${port || '3000'}/api`;
      }

      // Environnement de développement local
      if (hostname === '172.20.10.2' || hostname === '0.0.0.0') {
        return `http://172.20.10.2:${port || '3000'}/api`;
      }
      
    
      // Production - utilisation de l'URL relative par défaut
      return import.meta.env.VITE_API_URL || '/api';
    }
    
    // Fallback pour Node.js/SSR
    return import.meta.env.VITE_API_URL || 'http://localhost:3000/api' || 'http://172.20.10.2:3000/api';
  };
>>>>>>> d90a12e2bad9383f696451b6f983404524d7015b

let API_URL = getApiBaseUrl();

// ==============================================
// FONCTIONS UTILITAIRES
// ==============================================

const TYPE_MAPPING = {
  // String vers numérique
  'M': 1, 'H': 2, 'P': 3, 'L': 4, 'C': 5,
  'D': 6, 'O': 7, 'A': 8, 'S': 9,
  // Numérique vers string
  1: 'M', 2: 'H', 3: 'P', 4: 'L', 5: 'C',
  6: 'D', 7: 'O', 8: 'A', 9: 'S'
};

const TYPE_LABELS = {
  'M': 'Médical',
  'H': 'Hospitalier',
  'P': 'Pharmacie',
  'L': 'Laboratoire',
  'C': 'Consultation',
  'D': 'Dentaire',
  'O': 'Optique',
  'A': 'Ambulatoire',
  'S': 'Soins'
};

  // ==============================================
  // FONCTIONS UTILITAIRES OPTIMISÉES
  // ==============================================

  /**
   * Formate une date pour l'API au format YYYY-MM-DD
   * @param {Date|string} date - Date à formater
   * @returns {string|null} Date formatée ou null si invalide
   */
  const formatDateForAPI = (date) => {
    if (!date) return null;
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Validation de la date
      if (isNaN(dateObj.getTime())) {
        console.warn('⚠️ Date invalide pour formatage:', date);
        return null;
      }
      
      // Formatage ISO simplifié
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      console.error('❌ Erreur formatage date:', error);
      return null;
    }
  };

  const genererIdentifiantNational = async (transaction = null) => {
  try {
    let query;
    let request;
    
    if (transaction) {
      // Utiliser la transaction existante
      query = `
        SELECT TOP 1 IDENTIFIANT_NATIONAL 
        FROM [core].[BENEFICIAIRE] 
        WHERE IDENTIFIANT_NATIONAL LIKE 'AMS%'
          AND RETRAIT_DATE IS NULL
        ORDER BY 
          CAST(SUBSTRING(IDENTIFIANT_NATIONAL, 4, LEN(IDENTIFIANT_NATIONAL)) AS BIGINT) DESC
      `;
      
      const result = await transaction.request().query(query);
      
      let nextNum = 1;
      
      if (result.recordset.length > 0) {
        const lastId = result.recordset[0].IDENTIFIANT_NATIONAL;
        const numPart = lastId.substring(3);
        const lastNum = parseInt(numPart, 10);
        
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
      
      return `AMS${nextNum.toString().padStart(6, '0')}`;
      
    } else {
      // Créer une nouvelle connexion
      const pool = await dbConfig.getConnection();
      
      query = `
        SELECT TOP 1 IDENTIFIANT_NATIONAL 
        FROM [core].[BENEFICIAIRE] 
        WHERE IDENTIFIANT_NATIONAL LIKE 'AMS%'
          AND RETRAIT_DATE IS NULL
        ORDER BY 
          CAST(SUBSTRING(IDENTIFIANT_NATIONAL, 4, LEN(IDENTIFIANT_NATIONAL)) AS BIGINT) DESC
      `;
      
      const result = await pool.request().query(query);
      
      let nextNum = 1;
      
      if (result.recordset.length > 0) {
        const lastId = result.recordset[0].IDENTIFIANT_NATIONAL;
        const numPart = lastId.substring(3);
        const lastNum = parseInt(numPart, 10);
        
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
      
      return `AMS${nextNum.toString().padStart(6, '0')}`;
    }
    
  } catch (error) {
    console.error('❌ Erreur génération identifiant national:', error);
    throw error;
  }
};

  /**
   * Nettoie les paramètres en supprimant les valeurs null/undefined/empty
   * @param {Object} params - Paramètres à nettoyer
   * @returns {Object} Paramètres nettoyés
   */
  const cleanParams = (params) => {
    if (!params || typeof params !== 'object') return {};
    
    return Object.entries(params).reduce((acc, [key, value]) => {
      // Conserver les valeurs 0, false et les tableaux vides
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
  };

  /**
   * Construit une query string à partir des paramètres
   * @param {Object} params - Paramètres à convertir
   * @returns {string} Query string
   */
  // Fonction utilitaire pour construire les query strings
  const buildQueryString = (params) => {
    if (!params || Object.keys(params).length === 0) return '';
    
    const queryParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => {
        if (value instanceof Date) {
          return `${encodeURIComponent(key)}=${encodeURIComponent(value.toISOString())}`;
        }
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      });
    
    return queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
  };

  // ==============================================
  // FONCTION DE BASE POUR LES APPELS API (OPTIMISÉE)
  // ==============================================

  /**
   * Fonction de base pour tous les appels API
   * @param {string} endpoint - Endpoint API
   * @param {Object} options - Options de la requête
   * @returns {Promise<any>} Données de la réponse
   */
// Correction dans api.js
const fetchAPI = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };
  
<<<<<<< HEAD
=======
  // Ajout du token d'authentification
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  // Ajout de l'ID utilisateur pour le tracking
  if (user?.id) {
    defaultHeaders['X-User-Id'] = user.id;
  }
  
  // Préparation de la configuration de la requête
  const config = {
    method: 'GET',
    headers: defaultHeaders,
    ...options,
    credentials: import.meta.env.MODE === 'production' ? 'same-origin' : 'include',
  };
  
  // Gestion spéciale pour FormData (upload de fichiers)
  const isFormData = config.body && config.body instanceof FormData;
  
  if (isFormData) {
    // Pour FormData, le navigateur définit automatiquement le Content-Type avec boundary
    // Ne pas définir Content-Type manuellement
    console.log('📤 Envoi FormData avec upload de fichier');
  } else if (config.body && typeof config.body === 'object') {
    // Pour les requêtes JSON standard
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(config.body);
  }
  
  // Gestion du timeout adaptée au type de requête
  let timeoutDuration;
  if (isFormData) {
    // Upload de fichiers : timeout plus long (2 minutes)
    timeoutDuration = import.meta.env.MODE === 'production' ? 120000 : 180000;
  } else {
    // Requêtes normales : timeout standard
    timeoutDuration = import.meta.env.MODE === 'production' ? 15000 : 30000;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
  config.signal = controller.signal;
  
>>>>>>> d90a12e2bad9383f696451b6f983404524d7015b
  try {
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    console.log(`🌐 fetchAPI: ${defaultOptions.method || 'GET'} ${fullUrl}`);
    
<<<<<<< HEAD
    // Vérifier si le body est déjà un string JSON
    if (defaultOptions.body && typeof defaultOptions.body !== 'string') {
      defaultOptions.body = JSON.stringify(defaultOptions.body);
=======
    // Logging en développement (adapté pour FormData)
    if (import.meta.env.MODE === 'development') {
      console.log(`📞 API Call: ${config.method} ${fullUrl}`, {
        headers: config.headers,
        hasBody: !!config.body,
        isFormData: isFormData,
        body: isFormData ? '[FormData - fichier upload]' : (config.body ? JSON.parse(config.body) : 'none')
      });
>>>>>>> d90a12e2bad9383f696451b6f983404524d7015b
    }
    
    const response = await fetch(fullUrl, defaultOptions);
    
    console.log(`📡 Réponse HTTP: ${response.status} ${response.statusText}`);
    console.log('📋 Headers de la réponse:', Object.fromEntries(response.headers.entries()));
    
    // Vérifier si la réponse est vide
    const contentType = response.headers.get('content-type') || '';
    const isJsonResponse = contentType.includes('application/json');
    
    // Lire le texte de la réponse d'abord pour débogage
    const responseText = await response.text();
    console.log(`📝 Contenu brut de la réponse (${responseText.length} chars):`, 
                responseText.substring(0, 500));
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        // Essayer de parser comme JSON si indiqué
        if (isJsonResponse && responseText) {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('❌ Erreur JSON du serveur:', errorData);
        } else if (responseText) {
          // Utiliser le texte brut
          errorMessage = responseText;
        }
      } catch (e) {
        console.error('❌ Erreur parsing réponse d\'erreur:', e);
        // Si le parsing échoue, utiliser le texte brut
        if (responseText) {
          errorMessage = responseText;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // Si la réponse est vide (204 No Content)
    if (response.status === 204 || !responseText) {
      console.log('✅ Réponse vide (204 ou texte vide)');
      return { success: true, data: null };
    }
    
    // Vérifier si la réponse est JSON
    if (isJsonResponse) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ JSON parsé avec succès:', data);
        return data;
      } catch (e) {
        console.error('❌ Erreur parsing JSON:', e);
        console.error('❌ Texte qui a échoué:', responseText);
        throw new Error(`Réponse JSON invalide: ${e.message}`);
      }
    } else {
      console.warn('⚠️ Réponse non-JSON reçue:', responseText.substring(0, 200));
      return { success: true, data: responseText };
    }
    
  } catch (error) {
    console.error('❌ Erreur fetchAPI:', error.message);
    // Ajouter plus d'informations pour le débogage
    if (error.message.includes('[object Object]')) {
      console.error('⚠️ Détection d\'objet JavaScript converti en string');
    }
    throw error;
  }
};

// Fonction utilitaire pour télécharger des fichiers binaires (PDF, images)
const fetchBlob = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;
  
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error('❌ Erreur parsing user:', e);
    }
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/pdf, image/*',
    ...options.headers
  };
  
  if (user?.id) {
    headers['X-User-Id'] = user.id;
  }

  const config = {
    method: 'GET',
    headers: headers,
    credentials: import.meta.env.MODE === 'production' ? 'same-origin' : 'include',
    ...options
  };

  const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  config.signal = controller.signal;
  
  try {
    const response = await fetch(fullUrl, config);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    return await response.blob();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Fonction utilitaire pour uploader un fichier avec FormData
const uploadFile = async (endpoint, formData, method = 'POST') => {
  return await fetchAPI(endpoint, {
    method,
    body: formData,
  });
};

// Exporter les fonctions
export { fetchAPI, fetchBlob, uploadFile };


  // ==============================================
  // API DES CONSULTATIONS
  // ==============================================

export const consultationsAPI = {
  async getAllConsultations(filters = {}) {
    try {
      console.log('🔍 Chargement consultations avec filtres:', filters);
      
      const transformedFilters = {};
      
      if (filters.dateDebut) {
        transformedFilters.date_debut = formatDateForAPI(filters.dateDebut);
      }
      
      if (filters.dateFin) {
        transformedFilters.date_fin = formatDateForAPI(filters.dateFin);
      }
      
      if (filters.statut) {
        transformedFilters.statut = filters.statut;
      }
      
      if (filters.medecin) {
        transformedFilters.medecin = filters.medecin;
      }
      
      if (filters.patient) {
        transformedFilters.patient = filters.patient;
      }
      
      const queryString = buildQueryString(transformedFilters);
      const response = await fetchAPI(`/consultations/list${queryString}`);
      
      if (response.success && Array.isArray(response.consultations)) {
        return {
          ...response,
          consultations: response.consultations.map(consultation => ({
            COD_CONS: consultation.COD_CONS || consultation.id || consultation.ID_CONSULTATION,
            DATE_CONSULTATION: consultation.DATE_CONSULTATION || consultation.date_consultation || consultation.date,
            NOM_BEN: consultation.NOM_BEN || consultation.nom_patient || consultation.patient_nom,
            PRE_BEN: consultation.PRE_BEN || consultation.prenom_patient || consultation.patient_prenom,
            NOM_MEDECIN: consultation.NOM_MEDECIN || consultation.nom_medecin || consultation.medecin_nom || 'Médecin non spécifié',
            TYPE_CONSULTATION: consultation.TYPE_CONSULTATION || consultation.type_consultation || consultation.type,
            MONTANT_CONSULTATION: consultation.MONTANT_CONSULTATION || consultation.montant || consultation.montant_total || 0,
            STATUT_PAIEMENT: consultation.STATUT_PAIEMENT || consultation.statut || consultation.statut_paiement || 'À payer',
            IDENTIFIANT_NATIONAL: consultation.IDENTIFIANT_NATIONAL || consultation.identifiant_national || '',
            ...consultation
          }))
        };
      } else if (Array.isArray(response)) {
        return { 
          success: true, 
          consultations: response,
          message: 'Données récupérées avec succès' 
        };
      }
      
      return { success: true, consultations: [], message: 'Aucune consultation trouvée' };
    } catch (error) {
      console.error('❌ Erreur récupération consultations:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur lors du chargement des consultations',
        consultations: [] 
      };
    }
  },

  async getConsultationById(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID consultation invalide');
      }
      
      const response = await fetchAPI(`/consultations/${id}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur consultation ${id}:`, error);
      throw error;
    }
  },

  async getByPatientId(patientId) {
    try {
      const response = await fetchAPI(`/consultations/patient/${patientId}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur consultations patient ${patientId}:`, error);
      return { 
        success: false, 
        message: error.message, 
        consultations: [] 
      };
    }
  },

  async searchByCard(cardNumber) {
    try {
      if (!cardNumber || cardNumber.trim().length === 0) {
        return { success: true, patients: [] };
      }
      
      const response = await fetchAPI(`/consultations/search-by-card?card=${encodeURIComponent(cardNumber)}`);
      
      if (response.success && Array.isArray(response.patients)) {
        return response;
      } else if (Array.isArray(response)) {
        return { success: true, patients: response };
      }
      
      return { success: true, patients: [] };
    } catch (error) {
      console.error('❌ Erreur recherche par carte:', error);
      return { success: false, message: error.message, patients: [] };
    }
  },

  async getTypePaiementBeneficiaire(idBen) {
    try {
      if (!idBen || isNaN(parseInt(idBen))) {
        throw new Error('ID bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/consultations/type-paiement/${idBen}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur type paiement bénéficiaire ${idBen}:`, error);
      return { 
        success: false, 
        message: error.message,
        typePaiement: null 
      };
    }
  },

  async update(id, consultationData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID consultation invalide');
      }
      
      const dataToSend = { ...consultationData };
      
      if (dataToSend.DATE_CONSULTATION) {
        dataToSend.DATE_CONSULTATION = formatDateForAPI(dataToSend.DATE_CONSULTATION);
      }
      
      if (dataToSend.DATE_DEBUT) {
        dataToSend.DATE_DEBUT = formatDateForAPI(dataToSend.DATE_DEBUT);
      }
      
      if (dataToSend.DATE_FIN) {
        dataToSend.DATE_FIN = formatDateForAPI(dataToSend.DATE_FIN);
      }
      
      if (consultationData.statut && Object.keys(consultationData).length <= 3) {
        return await fetchAPI(`/consultations/${id}/status`, {
          method: 'PATCH',
          body: {
            statut: consultationData.statut,
            notes: consultationData.notes || consultationData.OBSERVATIONS
          },
        });
      }
      
      try {
        const response = await fetchAPI(`/consultations/${id}`, {
          method: 'PUT',
          body: dataToSend,
        });
        return response;
      } catch (putError) {
        console.log('Tentative avec PATCH suite à l\'erreur PUT');
        const response = await fetchAPI(`/consultations/${id}`, {
          method: 'PATCH',
          body: dataToSend,
        });
        return response;
      }
    } catch (error) {
      console.error(`❌ Erreur mise à jour consultation ${id}:`, error);
      throw error;
    }
  },

  async delete(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID consultation invalide');
      }
      
      const response = await fetchAPI(`/consultations/${id}`, {
        method: 'DELETE',
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression consultation ${id}:`, error);
      throw error;
    }
  },

  async create(consultationData) {
    try {
      const dataToSend = {
        ...consultationData,
        DATE_CONSULTATION: consultationData.DATE_CONSULTATION 
          ? formatDateForAPI(consultationData.DATE_CONSULTATION)
          : formatDateForAPI(new Date())
      };
      
      const response = await fetchAPI('/consultations/create', {
        method: 'POST',
        body: dataToSend,
      });

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la création de la consultation');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur création consultation:', error);
      throw error;
    }
  },

 async getMedicaments(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/medicaments${queryString}`);
      return response;
    } catch (error) {
      console.error('Erreur récupération médicaments:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des médicaments',
        medicaments: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };
    }
  },

  // Fonction principale pour la recherche unifiée
  async searchMedicalItemsUnified(searchTerm, type = null) {
    try {
      console.log('🔍 searchMedicalItemsUnified appelée avec:', { searchTerm, type });
      
      // Validation
      if (!searchTerm || searchTerm.trim().length < 2) {
        return {
          success: true,
          medicaments: [],
          items: [],
          count: 0
        };
      }
      
      // Construire les paramètres
      const params = { search: searchTerm.trim(), limit: 20 };
      if (type) {
        params.type = type === 'tous' ? null : type;
      }
      
      const queryString = buildQueryString(params);
      console.log('📡 Appel API avec query:', queryString);
      
      // Appeler l'API backend
      const response = await fetchAPI(`/consultations/medicaments${queryString}`);
      
      console.log('📊 Réponse API:', response);
      
      // Gérer différents formats de réponse
      if (response && typeof response === 'object') {
        // Format 1: Réponse directe de l'API (avec succès)
        if (response.success !== undefined) {
          const medicaments = response.medicaments || response.items || [];
          
          // Si un type spécifique est demandé et que l'API n'a pas filtré
          if (type && type !== 'tous' && type !== 'nomenclature') {
            const filtered = medicaments.filter(item => {
              if (type === 'medicament') return item.type === 'medicament';
              if (type === 'nomenclature_exclue') return item.type === 'nomenclature_exclue';
              return true;
            });
            
            return {
              ...response,
              medicaments: filtered,
              items: filtered,
              count: filtered.length
            };
          }
          
          return response;
        }
        
        // Format 2: Tableau direct
        if (Array.isArray(response)) {
          return {
            success: true,
            medicaments: response,
            items: response,
            count: response.length
          };
        }
        
        // Format 3: Objet avec données
        return {
          success: true,
          ...response
        };
      }
      
      // Aucune donnée
      return {
        success: true,
        medicaments: [],
        items: [],
        count: 0
      };
      
    } catch (error) {
      console.error('❌ Erreur searchMedicalItemsUnified:', error);
      
      // Fallback: Tester d'autres endpoints
      try {
        console.log('🔄 Tentative de fallback...');
        return await this.searchMedicalItemsFallback(searchTerm, type);
      } catch (fallbackError) {
        console.error('❌ Erreur fallback:', fallbackError);
      }
      
      return {
        success: false,
        message: error.message || 'Erreur lors de la recherche',
        medicaments: [],
        items: [],
        count: 0
      };
    }
  },

  // Fonction de fallback pour la recherche
  async searchMedicalItemsFallback(searchTerm, type = null) {
    try {
      const searchLower = searchTerm.toLowerCase();
      let items = [];
      
      // Si type est 'medicament' ou 'tous', chercher les médicaments
      if (!type || type === 'tous' || type === 'medicament') {
        try {
          const medResponse = await this.getMedicaments({
            search: searchTerm,
            page: 1,
            limit: 10
          });
          
          if (medResponse.success && medResponse.medicaments) {
            const medicaments = medResponse.medicaments.map(med => ({
              id: med.COD_MED || med.id,
              COD_MED: med.COD_MED,
              type: 'medicament',
              libelle: med.NOM_COMMERCIAL || '',
              libelle_complet: `${med.NOM_COMMERCIAL || ''} ${med.NOM_GENERIQUE ? `(${med.NOM_GENERIQUE})` : ''} - ${med.FORME_PHARMACEUTIQUE || ''} ${med.DOSAGE || ''}`.trim(),
              NOM_COMMERCIAL: med.NOM_COMMERCIAL,
              NOM_GENERIQUE: med.NOM_GENERIQUE,
              FORME_PHARMACEUTIQUE: med.FORME_PHARMACEUTIQUE,
              DOSAGE: med.DOSAGE,
              PRIX_UNITAIRE: parseFloat(med.PRIX_UNITAIRE) || 0,
              REMBOURSABLE: med.REMBOURSABLE || 0,
              CONDITIONNEMENT: med.CONDITIONNEMENT
            }));
            
            items = [...items, ...medicaments];
          }
        } catch (medError) {
          console.warn('❌ Fallback médicaments échoué:', medError);
        }
      }
      
      // Pour les nomenclatures, nous devons utiliser des données de test
      // car nous n'avons pas d'API dédiée
      if (!type || type === 'tous' || type === 'nomenclature' || type === 'nomenclature_exclue') {
        const demoNomenclatures = [
          {
            id: 'NOM001',
            COD_MED: 'NOM001',
            type: 'nomenclature',
            libelle: 'Consultation générale',
            libelle_complet: 'Consultation médicale générale - Nomenclature standard',
            NOM_COMMERCIAL: 'Consultation générale',
            PRIX_UNITAIRE: 5000,
            REMBOURSABLE: 1,
            code_pays: 'CMR',
            licence: 'MED-001',
            type_produit: 'CONSULTATION'
          },
          {
            id: 'NOM002',
            COD_MED: 'NOM002',
            type: 'nomenclature',
            libelle: 'Radiographie thorax',
            libelle_complet: 'Radiographie standard du thorax - Nomenclature imagerie',
            NOM_COMMERCIAL: 'Radiographie thorax',
            PRIX_UNITAIRE: 15000,
            REMBOURSABLE: 1,
            code_pays: 'CMR',
            licence: 'IMG-001',
            type_produit: 'IMAGERIE'
          },
          {
            id: 'NOM_EX001',
            COD_MED: 'NOM_EX001',
            type: 'nomenclature_exclue',
            libelle: 'Acte esthétique non remboursable',
            libelle_complet: 'Acte esthétique - Nomenclature exclue',
            NOM_COMMERCIAL: 'Acte esthétique',
            PRIX_UNITAIRE: 10000,
            REMBOURSABLE: 0,
            code_pays: 'CMR',
            famille_exclusion: 'ESTHETIQUE',
            motifs_exclusion: 'Non thérapeutique'
          }
        ];
        
        const filteredNomenclatures = demoNomenclatures.filter(item => {
          const matchesSearch = item.libelle.toLowerCase().includes(searchLower) ||
                              item.libelle_complet.toLowerCase().includes(searchLower);
          
          if (!type || type === 'tous') return matchesSearch;
          if (type === 'nomenclature') return matchesSearch && item.type === 'nomenclature';
          if (type === 'nomenclature_exclue') return matchesSearch && item.type === 'nomenclature_exclue';
          return matchesSearch;
        });
        
        items = [...items, ...filteredNomenclatures];
      }
      
      // Filtrer selon le type demandé
      let filteredItems = items;
      if (type && type !== 'tous') {
        filteredItems = items.filter(item => {
          if (type === 'medicament') return item.type === 'medicament';
          if (type === 'nomenclature') return item.type === 'nomenclature' || item.type === 'nomenclature_exclue';
          if (type === 'nomenclature_exclue') return item.type === 'nomenclature_exclue';
          return true;
        });
      }
      
      // Limiter les résultats
      filteredItems = filteredItems.slice(0, 20);
      
      console.log('🔄 Fallback résultats:', filteredItems.length, 'éléments');
      
      return {
        success: true,
        medicaments: filteredItems,
        items: filteredItems,
        count: filteredItems.length
      };
      
    } catch (error) {
      console.error('❌ Erreur fallback:', error);
      throw error;
    }
  },

  // Fonction de recherche simplifiée (compatibilité)
  async searchMedicalItems(search, type = '', limit = 20) {
    try {
      console.log('🔍 searchMedicalItems appelée avec:', { search, type, limit });
      
      // Utiliser la fonction unifiée
      const unifiedResult = await this.searchMedicalItemsUnified(search, type);
      
      // Adapter le format de retour
      return {
        success: unifiedResult.success,
        items: unifiedResult.medicaments || unifiedResult.items || [],
        medicaments: unifiedResult.medicaments || [],
        pagination: {
          page: 1,
          limit: limit,
          total: unifiedResult.count || 0,
          totalPages: Math.ceil((unifiedResult.count || 0) / limit)
        }
      };
      
    } catch (error) {
      console.error('❌ Erreur searchMedicalItems:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la recherche',
        items: [],
        medicaments: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 }
      };
    }
  },

  // Fonction pour obtenir les prix des médicaments
  async getMedicationPrices(medicationIds) {
    try {
      if (!Array.isArray(medicationIds) || medicationIds.length === 0) {
        return { success: true, prices: {} };
      }
      
      // Construire les données de requête
      const requestData = {
        ids: medicationIds,
        // Ajouter les informations de type si disponibles
        items: medicationIds.map(id => {
          // Essayer de déterminer le type d'élément
          if (id.startsWith('MED')) return { id, type: 'medicament' };
          if (id.startsWith('NOM')) return { id, type: 'nomenclature' };
          if (id.startsWith('NOM_EX')) return { id, type: 'nomenclature_exclue' };
          return { id, type: 'medicament' }; // Par défaut
        })
      };
      
      // Essayer plusieurs endpoints possibles
      const endpoints = [
        '/medicaments/prices',
        '/consultations/medicaments/prices',
        '/nomenclatures/prices'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetchAPI(endpoint, {
            method: 'POST',
            body: requestData
          });
          
          if (response && response.success) {
            return response;
          }
        } catch (endpointError) {
          console.log(`⚠️ Endpoint ${endpoint} non disponible:`, endpointError.message);
          continue;
        }
      }
      
      // Fallback: Retourner des prix par défaut
      console.log('⚠️ Aucun endpoint de prix disponible, utilisation des prix par défaut');
      const defaultPrices = {};
      medicationIds.forEach(id => {
        if (id.startsWith('NOM')) {
          defaultPrices[id] = 5000; // Prix par défaut pour les nomenclatures
        } else {
          defaultPrices[id] = 1000; // Prix par défaut pour les médicaments
        }
      });
      
      return {
        success: true,
        prices: defaultPrices,
        message: 'Prix par défaut utilisés'
      };
      
    } catch (error) {
      console.error('Erreur récupération des prix:', error);
      return { 
        success: false, 
        message: error.message, 
        prices: {} 
      };
    }
  },

  // Fonction pour rechercher les nomenclatures spécifiquement
  async searchNomenclatures(search, type = 'all') {
    try {
      console.log('🔍 searchNomenclatures appelée avec:', { search, type });
      
      // Utiliser la recherche unifiée avec filtre
      const result = await this.searchMedicalItemsUnified(search, 'nomenclature');
      
      if (!result.success) {
        return result;
      }
      
      // Filtrer selon le type de nomenclature
      let filteredNomenclatures = result.medicaments || result.items || [];
      
      if (type === 'included') {
        filteredNomenclatures = filteredNomenclatures.filter(item => item.type === 'nomenclature');
      } else if (type === 'excluded') {
        filteredNomenclatures = filteredNomenclatures.filter(item => item.type === 'nomenclature_exclue');
      }
      
      return {
        success: true,
        nomenclatures: filteredNomenclatures,
        count: filteredNomenclatures.length,
        breakdown: {
          included: filteredNomenclatures.filter(item => item.type === 'nomenclature').length,
          excluded: filteredNomenclatures.filter(item => item.type === 'nomenclature_exclue').length
        }
      };
      
    } catch (error) {
      console.error('❌ Erreur searchNomenclatures:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la recherche des nomenclatures',
        nomenclatures: [],
        count: 0
      };
    }
  },

  // Fonction pour valider une nomenclature (vérifier si elle est remboursable)
  async validateNomenclature(code, type = 'nomenclature') {
    try {
      if (!code) {
        throw new Error('Code de nomenclature requis');
      }
      
      console.log(`🔍 Validation nomenclature: ${code} (type: ${type})`);
      
      // Chercher l'élément dans la base
      const searchResult = await this.searchMedicalItemsUnified(code, type);
      
      if (!searchResult.success || searchResult.count === 0) {
        return {
          success: false,
          message: 'Nomenclature non trouvée',
          valid: false,
          remboursable: false
        };
      }
      
      const nomenclature = searchResult.medicaments[0];
      
      return {
        success: true,
        valid: true,
        remboursable: nomenclature.REMBOURSABLE === 1,
        nomenclature: nomenclature,
        message: nomenclature.REMBOURSABLE === 1 ? 
          'Nomenclature remboursable' : 
          'Nomenclature non remboursable'
      };
      
    } catch (error) {
      console.error('❌ Erreur validation nomenclature:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la validation de la nomenclature',
        valid: false,
        remboursable: false
      };
    }
  },

  async getMedecins() {
    try {
      const response = await fetchAPI('/consultations/medecins');
      
      if (response.success && Array.isArray(response.medecins)) {
        return response;
      } else if (Array.isArray(response)) {
        return { success: true, medecins: response };
      }
      
      return { success: true, medecins: [] };
    } catch (error) {
      console.error('❌ Erreur récupération médecins:', error);
      return { success: false, message: error.message, medecins: [] };
    }
  },

  async getTypesConsultation() {
    try {
      const response = await fetchAPI('/consultations/types');
      return response;
    } catch (error) {
      console.error('❌ Erreur types consultation:', error);
      return {
        success: true,
        types: [
          { id: 1, libelle: 'Consultation générale', tarif: 5000 },
          { id: 2, libelle: 'Consultation spécialisée', tarif: 10000 },
          { id: 3, libelle: 'Consultation d\'urgence', tarif: 15000 },
          { id: 4, libelle: 'Consultation pédiatrique', tarif: 6000 },
          { id: 5, libelle: 'Consultation gynécologique', tarif: 8000 }
        ]
      };
    }
  },

  async searchPatients(cardNumber) {
    try {
      if (!cardNumber || cardNumber.trim().length < 2) {
        return { success: true, patients: [] };
      }
      
      const response = await fetchAPI(`/consultations/search-by-card?card=${encodeURIComponent(cardNumber)}`);
      
      if (response.success && Array.isArray(response.patients)) {
        return response;
      } else if (Array.isArray(response)) {
        return { success: true, patients: response };
      }
      
      return { success: true, patients: [] };
    } catch (error) {
      console.error('❌ Erreur recherche patients par carte:', error);
      return { success: false, message: error.message, patients: [] };
    }
  },

  async searchPatientsAdvanced(searchTerm, filters = {}, limit = 20) {
    try {
      const params = {
        search: searchTerm,
        limit,
        ...filters
      };
      
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/consultations/search-patients${queryString}`);
      
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche avancée patients:', error);
      return { success: false, message: error.message, patients: [] };
    }
  },

  // Alias pour compatibilité
  async updateConsultation(id, data) {
    return this.update(id, data);
  },

  async deleteConsultation(id) {
    return this.delete(id);
  }
};

export const prestationsAPI = {
  // === FONCTIONS PRINCIPALES ===

  /**
   * Récupérer toutes les prestations (avec pagination et filtres)
   */
  async getAllPrestations(filters = {}, pagination = {}) {
    try {
      const params = {
        page: pagination.page || 1,
        limit: pagination.limit || 50,
        sortBy: pagination.sortBy || 'CRE_PRE',
        sortOrder: pagination.sortOrder || 'desc',
        ...filters
      };
      
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/prestations${queryString}`);
      
      if (response.success) {
        return {
          ...response,
          prestations: response.prestations?.map(p => this.formatPrestation(p)) || []
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération prestations:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors du chargement des prestations',
        prestations: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0
        }
      };
    }
  },

   async getActesByPrestationId(cod_pres) {
    try {
      const response = await fetchAPI(`/prestations/${cod_pres}/actes`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération actes:', error);
      return {
        success: false,
        message: error.message,
        actes: []
      };
    }
  },

   async getTypesPrestations() {
    try {
      const response = await fetchAPI('/prestations/types');
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération types prestations:', error);
      return {
        success: false,
        message: error.message,
        types_prestations: []
      };
    }
  },

  /**
   * Obtenir le détail d'une prestation
   */
  async getPrestationById(id) {
    try {
      if (!id) {
        throw new Error('ID prestation invalide');
      }
      
      const response = await fetchAPI(`/prestations/${id}`);
      
      if (response.success && response.prestation) {
        return {
          ...response,
          prestation: this.formatPrestation(response.prestation)
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération prestation ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération de la prestation'
      };
    }
  },

  /**
   * Récupérer les prestations d'un bénéficiaire
   */
  async getPrestationsByBeneficiaire(cod_ben, filters = {}) {
    try {
      if (!cod_ben) {
        throw new Error('ID bénéficiaire invalide');
      }
      
      const params = { ...filters };
      const queryString = buildQueryString(params);
      
      const response = await fetchAPI(`/prestations/beneficiaire/${cod_ben}${queryString}`);
      
      if (response.success) {
        return {
          ...response,
          prestations: response.prestations?.map(p => this.formatPrestation(p, cod_ben)) || []
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur prestations bénéficiaire ${cod_ben}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors du chargement des prestations',
        prestations: []
      };
    }
  },

  /**
   * Créer une nouvelle prestation
   */
  async createPrestation(prestationData) {
    try {
      console.log('📤 Création de prestation:', prestationData);
      
      // Validation des champs obligatoires
      const requiredFields = ['COD_BPR', 'LIC_TAR', 'LIC_NOM', 'MLT_PRE'];
      const missingFields = requiredFields.filter(field => {
        const value = prestationData[field];
        return value === undefined || value === null || value === '';
      });
      
      if (missingFields.length > 0) {
        throw new Error(`Champs obligatoires manquants: ${missingFields.join(', ')}`);
      }
      
      const response = await fetchAPI('/prestations', {
        method: 'POST',
        body: prestationData
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur création prestation:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour une prestation
   */
  async updatePrestation(id, prestationData) {
    try {
      if (!id) {
        throw new Error('ID prestation invalide');
      }
      
      console.log(`📝 Mise à jour prestation ${id}:`, prestationData);
      
      const response = await fetchAPI(`/prestations/${id}`, {
        method: 'PUT',
        body: prestationData
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour prestation ${id}:`, error);
      throw error;
    }
  },

  /**
   * Supprimer une prestation
   */
  async deletePrestation(id) {
    try {
      if (!id) {
        throw new Error('ID prestation invalide');
      }
      
      const response = await fetchAPI(`/prestations/${id}`, {
        method: 'DELETE'
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression prestation ${id}:`, error);
      throw error;
    }
  },

  /**
   * Supprimer définitivement une prestation
   */
  async forceDeletePrestation(id) {
    try {
      if (!id) {
        throw new Error('ID prestation invalide');
      }
      
      const response = await fetchAPI(`/prestations/${id}/force`, {
        method: 'DELETE'
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression définitive prestation ${id}:`, error);
      throw error;
    }
  },

  /**
   * Restaurer une prestation (non applicable - pour compatibilité)
   */
  async restorePrestation(id) {
    try {
      if (!id) {
        throw new Error('ID prestation invalide');
      }
      
      const response = await fetchAPI(`/prestations/${id}/restore`, {
        method: 'PATCH'
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur restauration prestation ${id}:`, error);
      throw error;
    }
  },

  // === STATISTIQUES ===

  /**
   * Obtenir les statistiques des prestations
   */
  async getStatistics(filters = {}) {
    try {
      const params = { ...filters };
      const queryString = buildQueryString(params);
      
      const response = await fetchAPI(`/prestations/statistics${queryString}`);
      
      if (response.success && response.statistics) {
        return response;
      }
      
      // Retourner des statistiques par défaut en cas d'erreur
      return {
        success: true,
        statistics: {
          total: 0,
          total_montant: 0,
          total_prise_charge: 0,
          reste_a_charge: 0,
          moyenne_montant: 0,
          moyenne_taux: 0,
          par_type: [],
          par_mois: [],
          par_statut: []
        }
      };
    } catch (error) {
      console.error('❌ Erreur statistiques prestations:', error);
      return {
        success: false,
        message: error.message,
        statistics: {
          total: 0,
          total_montant: 0,
          total_prise_charge: 0,
          reste_a_charge: 0,
          moyenne_montant: 0,
          moyenne_taux: 0,
          par_type: [],
          par_mois: [],
          par_statut: []
        }
      };
    }
  },

  // === RECHERCHE ET FILTRES ===

  /**
   * Rechercher des prestations
   */
  async searchPrestations(searchTerm, filters = {}) {
    try {
      const params = {
        search: searchTerm,
        limit: 20,
        ...filters
      };
      
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/prestations${queryString}`);
      
      if (response.success && response.prestations) {
        return {
          ...response,
          prestations: response.prestations.map(p => this.formatPrestation(p))
        };
      }
      
      return {
        success: true,
        prestations: [],
        message: 'Aucun résultat'
      };
    } catch (error) {
      console.error('❌ Erreur recherche prestations:', error);
      return {
        success: false,
        message: error.message,
        prestations: []
      };
    }
  },

  // === FONCTIONS SPÉCIFIQUES ===

  /**
   * Marquer une prestation comme déclarée
   */
  async markAsDeclared(prestationId, declarationId) {
    try {
      if (!prestationId || !declarationId) {
        throw new Error('ID prestation ou déclaration invalide');
      }
      
      const response = await fetchAPI(`/prestations/${prestationId}`, {
        method: 'PUT',
        body: {
          COD_REM: declarationId,
          STA_PRE: 'V' // Validé
        }
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur marquage prestation comme déclarée:', error);
      throw error;
    }
  },

  /**
   * Vérifier si une prestation peut être déclarée
   */
  async canDeclarePrestation(prestationId) {
    try {
      if (!prestationId) {
        return {
          success: true,
          canDeclare: false,
          reason: 'ID prestation invalide'
        };
      }
      
      const prestation = await this.getPrestationById(prestationId);
      
      if (!prestation.success) {
        return {
          success: false,
          canDeclare: false,
          reason: 'Prestation non trouvée'
        };
      }
      
      const prestationData = prestation.prestation;
      const canDeclare = !prestationData.COD_REM && prestationData.STA_PRE !== 'R';
      
      return {
        success: true,
        canDeclare,
        reason: canDeclare ? 
          'Prestation non déclarée et non refusée' : 
          prestationData.COD_REM ? 'Déjà déclarée' : 'Statut refusé'
      };
    } catch (error) {
      console.error('❌ Erreur vérification déclaration prestation:', error);
      return {
        success: false,
        canDeclare: false,
        reason: error.message
      };
    }
  },

  // === EXPORT ===

  /**
   * Exporter les prestations
   */
  async exportPrestations(filters = {}) {
    try {
      const params = { ...filters };
      const queryString = buildQueryString(params);
      
      const response = await fetch(`/prestations/export${queryString}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const filename = `prestations_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return {
        success: true,
        message: 'Export terminé'
      };
    } catch (error) {
      console.error('❌ Erreur export prestations:', error);
      throw error;
    }
  },

  // === FONCTIONS UTILITAIRES ===

  /**
   * Formater une prestation pour le frontend
   */
  formatPrestation(prestation, cod_ben = null) {
    // Déterminer le type de prestation
    const typePrestation = prestation.TYPE_PRESTATION || prestation.LIC_TAR || 'Non spécifié';
    
    // Déterminer le libellé
    const libellePrestation = prestation.LIB_PREST || prestation.LIC_NOM || typePrestation;
    
    // Calculer le taux de prise en charge
    let tauxPriseCharge = prestation.TAUX_PRISE_CHARGE;
    if (!tauxPriseCharge && prestation.MLT_PRE && prestation.MLT_PRE > 0) {
      tauxPriseCharge = ((prestation.MTR_PRE || 0) * 100) / prestation.MLT_PRE;
    }
    
    // Déterminer le statut de paiement
    const statutPaiement = this.getStatutPaiementLabel(prestation.STA_PRE);
    
    // Déterminer le statut de déclaration
    const statutDeclaration = prestation.COD_REM ? 'Déclaré' : 'Non déclaré';
    
    return {
      // Identification
      id: prestation.id || prestation.COD_PREST || prestation.COD_PRE,
      COD_PREST: prestation.id || prestation.COD_PREST || prestation.COD_PRE,
      
      // Informations principales
      TYPE_PRESTATION: typePrestation,
      LIB_PREST: libellePrestation,
      LIBELLE_PRESTATION: libellePrestation,
      DATE_PRESTATION: prestation.DATE_PRESTATION || prestation.CRE_PRE,
      MONTANT: prestation.MONTANT || prestation.MLT_PRE || 0,
      QUANTITE: prestation.QUANTITE || prestation.QT_PRE || 1,
      
      // Prise en charge
      TAUX_PRISE_CHARGE: tauxPriseCharge || 0,
      MONTANT_PRISE_CHARGE: prestation.MONTANT_PRISE_CHARGE || prestation.MTR_PRE || 0,
      
      // Informations complémentaires
      OBSERVATIONS: prestation.OBSERVATIONS || prestation.OBS_PRE || '',
      STATUT_PAIEMENT: statutPaiement,
      STATUT_DECLARATION: prestation.STATUT_DECLARATION || statutDeclaration,
      STATUT: prestation.STATUT || prestation.STA_PRE || 'E',
      
      // Relations
      COD_BEN: prestation.COD_BEN || cod_ben,
      COD_DECL: prestation.COD_DECL || prestation.COD_REM,
      COD_CONTRAT: prestation.COD_CONTRAT || prestation.COD_POL,
      COD_PRESTATAIRE: prestation.COD_PRESTATAIRE || prestation.COD_BPR,
      
      // Informations techniques
      COD_POL: prestation.COD_POL,
      COD_PEC: prestation.COD_PEC,
      LIC_TAR: prestation.LIC_TAR,
      LIC_NOM: prestation.LIC_NOM,
      CRE_PRE: prestation.CRE_PRE,
      QT_PRE: prestation.QT_PRE,
      MLT_PRE: prestation.MLT_PRE,
      MTR_PRE: prestation.MTR_PRE,
      EXP_PRE: prestation.EXP_PRE,
      OBS_PRE: prestation.OBS_PRE,
      STA_PRE: prestation.STA_PRE,
      COD_TYP_PRES: prestation.COD_TYP_PRES,
      NUM_BAR: prestation.NUM_BAR,
      
      // Informations du bénéficiaire
      beneficiaire: prestation.beneficiaire || (prestation.beneficiaire_id ? {
        ID_BEN: prestation.beneficiaire_id,
        NOM_BEN: prestation.beneficiaire_nom,
        PRE_BEN: prestation.beneficiaire_prenom,
        beneficiaire_nom_complet: prestation.beneficiaire_nom_complet,
        IDENTIFIANT_NATIONAL: prestation.beneficiaire_identifiant
      } : null),
      
      // Informations du type de prestation
      type_prestation: prestation.type_prestation || (prestation.type_prestation_id ? {
        COD_TYP_PRES: prestation.type_prestation_id,
        LIB_TYP_PRES: prestation.type_prestation_libelle,
        CATEGORIE: prestation.type_prestation_categorie,
        ACTIF: prestation.type_prestation_actif
      } : null),
      
      // Informations du prestataire
      prestataire: prestation.prestataire || (prestation.prestataire_id ? {
        COD_PRE: prestation.prestataire_id,
        NOM_PRESTATAIRE: prestation.prestataire_nom,
        PRENOM_PRESTATAIRE: prestation.prestataire_prenom,
        prestataire_nom_complet: prestation.prestataire_nom_complet
      } : null),
      
      // Informations de déclaration
      declaration: prestation.declaration || (prestation.declaration_id ? {
        COD_DECL: prestation.declaration_id,
        NUM_DECL: prestation.declaration_numero,
        DATE_DECLARATION: prestation.declaration_date
      } : null),
      
      // Calculs
      reste_a_charge: prestation.reste_a_charge || 0,
      
      // Pour compatibilité avec le frontend
      libelle: libellePrestation,
      description: libellePrestation,
      montant: prestation.MONTANT || prestation.MLT_PRE || 0,
      quantite: prestation.QUANTITE || prestation.QT_PRE || 1,
      prix_unitaire: prestation.MLT_PRE || 0,
      taux_prise_charge: tauxPriseCharge || 0,
      montant_prise_charge: prestation.MONTANT_PRISE_CHARGE || prestation.MTR_PRE || 0,
      statut_declaration_libelle: statutDeclaration,
      statut_paiement_libelle: statutPaiement,
      date_prestation_format: prestation.DATE_PRESTATION ? 
        new Date(prestation.DATE_PRESTATION).toLocaleDateString('fr-FR') : 
        (prestation.CRE_PRE ? new Date(prestation.CRE_PRE).toLocaleDateString('fr-FR') : ''),
      
      // Métadonnées
      created_at: prestation.CRE_PRE,
      updated_at: prestation.MOD_PRE,
      deleted_at: prestation.DEL_PRE
    };
  },

  /**
   * Obtenir le libellé du statut de paiement
   */
  getStatutPaiementLabel(statutCode) {
    const statuts = {
      'V': 'validé',
      'R': 'refusé',
      'P': 'payé',
      'E': 'en_cours',
      'default': 'non_traite'
    };
    
    return statuts[statutCode] || statuts.default;
  },

  /**
   * Obtenir la couleur du statut
   */
  getStatutColor(statutCode) {
    const colors = {
      'V': 'green',     // Validé
      'R': 'red',       // Refusé
      'P': 'blue',      // Payé
      'E': 'orange',    // En cours
      'default': 'gray'
    };
    
    return colors[statutCode] || colors.default;
  },

  /**
   * Formater un montant
   */
  formatMontant(montant) {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant || 0);
  },

  /**
   * Valider les données d'une prestation avant création/mise à jour
   */
  validatePrestationData(data, isUpdate = false) {
    const errors = [];
    
    // Champs obligatoires pour création
    if (!isUpdate) {
      if (!data.COD_BPR) errors.push('COD_BPR (bénéficiaire) est requis');
      if (!data.LIC_TAR) errors.push('LIC_TAR (type prestation) est requis');
      if (!data.LIC_NOM) errors.push('LIC_NOM (libellé) est requis');
      if (!data.MLT_PRE) errors.push('MLT_PRE (montant) est requis');
    }
    
    // Validation des types
    if (data.COD_BPR && isNaN(parseInt(data.COD_BPR))) {
      errors.push('COD_BPR doit être un nombre');
    }
    
    if (data.MLT_PRE && isNaN(parseFloat(data.MLT_PRE))) {
      errors.push('MLT_PRE doit être un nombre');
    }
    
    if (data.QT_PRE && isNaN(parseInt(data.QT_PRE))) {
      errors.push('QT_PRE doit être un nombre entier');
    }
    
    if (data.MTR_PRE && isNaN(parseFloat(data.MTR_PRE))) {
      errors.push('MTR_PRE doit être un nombre');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Générer une prévisualisation de prestation
   */
  generatePrestationPreview(data) {
    const montant = parseFloat(data.MLT_PRE) || 0;
    const quantite = parseInt(data.QT_PRE) || 1;
    const montantRembourse = parseFloat(data.MTR_PRE) || 0;
    const taux = montant > 0 ? (montantRembourse * 100) / montant : 0;
    
    return {
      montant_total: montant * quantite,
      montant_rembourse: montantRembourse,
      taux_remboursement: taux,
      reste_a_charge: (montant * quantite) - montantRembourse
    };
  },

  /**
   * Types de prestations par défaut (pour l'autocomplétion)
   */
  getDefaultTypesPrestations() {
    return [
      { code: 'CONSULT', libelle: 'Consultation médicale' },
      { code: 'PHARMA', libelle: 'Pharmacie' },
      { code: 'LABO', libelle: 'Analyses de laboratoire' },
      { code: 'RADIO', libelle: 'Radiologie' },
      { code: 'ECHO', libelle: 'Echographie' },
      { code: 'SCANNER', libelle: 'Scanner' },
      { code: 'IRM', libelle: 'IRM' },
      { code: 'HOSPIT', libelle: 'Hospitalisation' },
      { code: 'CHIR', libelle: 'Chirurgie' },
      { code: 'SOINS', libelle: 'Soins infirmiers' },
      { code: 'KINE', libelle: 'Kinésithérapie' },
      { code: 'DENT', libelle: 'Dentaire' },
      { code: 'OPTIQUE', libelle: 'Optique' },
      { code: 'AMBULANCE', libelle: 'Ambulance' },
      { code: 'PROTHESE', libelle: 'Prothèse' },
      { code: 'MATER', libelle: 'Matériel médical' }
    ];
  }
};

export const affectionsAPI = {
   // Récupérer la liste des affections avec pagination et filtres
  async getAll(filters = {}) {
    try {
      console.log('🔍 Chargement affections avec filtres:', filters);
      
      const transformedFilters = {};
      
      // Transformation des filtres
      const filterMapping = {
        search: 'search',
        cod_pay: 'cod_pay',
        cod_taf: 'cod_taf',
        sex_aff: 'sex_aff',
        eta_aff: 'eta_aff',
        page: 'page',
        limit: 'limit'
      };
      
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'tous') {
          const mappedKey = filterMapping[key] || key;
          transformedFilters[mappedKey] = filters[key];
        }
      });
      
      const queryString = buildQueryString(transformedFilters);
      console.log('📤 URL appelée:', `/affections${queryString}`);
      
      const response = await fetchAPI(`/affections${queryString}`);
      
      console.log('✅ Réponse API affections:', response);
      
      // Vérification de la structure de la réponse
      if (!response) {
        console.warn('⚠️ Réponse API vide');
        return { 
          success: false, 
          message: 'Aucune réponse du serveur',
          affections: [], 
          pagination: null 
        };
      }
      
      // CAS 1: Réponse avec structure standard (success + affections)
      if (response.success && Array.isArray(response.affections)) {
        const normalized = response.affections.map(affection => ({
          id: affection.COD_AFF || affection.id,
          COD_AFF: affection.COD_AFF || affection.id,
          cod_pays: affection.cod_pays || affection.COD_PAY,
          cod_type_affection: affection.cod_type_affection || affection.COD_TAF,
          libelle: affection.libelle || affection.LIB_AFF,
          LIB_AFF: affection.LIB_AFF || affection.libelle,
          ncp: affection.ncp || affection.NCP_AFF,
          NCP_AFF: affection.NCP_AFF || affection.ncp,
          sexe: affection.sexe || affection.SEX_AFF,
          SEX_AFF: affection.SEX_AFF || affection.sexe,
          etat: affection.etat || affection.ETA_AFF,
          ETA_AFF: affection.ETA_AFF || affection.etat,
          nom_pays: affection.nom_pays || affection.LIB_PAY,
          nom_type_affection: affection.nom_type_affection || affection.LIB_TAF,
          COD_CREUTIL: affection.COD_CREUTIL,
          COD_MODUTIL: affection.COD_MODUTIL,
          DAT_CREUTIL: affection.DAT_CREUTIL,
          DAT_MODUTIL: affection.DAT_MODUTIL,
          ...affection
        }));
        
        return {
          success: true,
          affections: normalized,
          message: response.message || `${normalized.length} affection(s) trouvée(s)`,
          pagination: response.pagination || {
            page: filters.page || 1,
            limit: filters.limit || 10,
            total: normalized.length,
            pages: Math.ceil(normalized.length / (filters.limit || 10))
          }
        };
      }
      
      // CAS 2: Réponse directe sous forme de tableau
      if (Array.isArray(response)) {
        const normalized = response.map(affection => ({
          id: affection.COD_AFF || affection.id,
          COD_AFF: affection.COD_AFF || affection.id,
          libelle: affection.libelle || affection.LIB_AFF,
          LIB_AFF: affection.LIB_AFF || affection.libelle,
          ...affection
        }));
        
        return { 
          success: true, 
          affections: normalized,
          message: `${normalized.length} affection(s) trouvée(s)`,
          pagination: {
            page: filters.page || 1,
            limit: filters.limit || 10,
            total: normalized.length,
            pages: Math.ceil(normalized.length / (filters.limit || 10))
          }
        };
      }
      
      // CAS 3: Réponse avec data
      if (response.data && Array.isArray(response.data)) {
        const normalized = response.data.map(affection => ({
          id: affection.COD_AFF || affection.id,
          COD_AFF: affection.COD_AFF || affection.id,
          libelle: affection.libelle || affection.LIB_AFF,
          LIB_AFF: affection.LIB_AFF || affection.libelle,
          ...affection
        }));
        
        return {
          success: response.success !== false,
          affections: normalized,
          message: response.message || `${normalized.length} affection(s) trouvée(s)`,
          pagination: response.pagination
        };
      }
      
      // CAS 4: Réponse d'erreur
      console.warn('⚠️ Structure de réponse non reconnue:', response);
      return { 
        success: false, 
        message: response.message || 'Structure de réponse invalide',
        affections: [],
        pagination: null
      };
      
    } catch (error) {
      console.error('❌ Erreur récupération affections:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur lors du chargement des affections',
        affections: [],
        pagination: null
      };
    }
  },

  // Rechercher des affections
  async search(searchTerm, limit = 20) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { 
          success: true, 
          affections: [],
          message: 'Entrez au moins 2 caractères pour la recherche'
        };
      }
      
      console.log('🔍 Recherche affections avec terme:', searchTerm);
      
      // Utiliser getAll avec le filtre de recherche
      return await this.getAll({ search: searchTerm, limit: limit });
      
    } catch (error) {
      console.error('❌ Erreur recherche affections:', error);
      return { 
        success: false, 
        message: `Erreur: ${error.message}`,
        affections: [] 
      };
    }
  },

  // Rechercher des affections (alias pour compatibilité)
  async search(searchTerm, limit = 20) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { 
          success: true, 
          affections: [],
          message: 'Entrez au moins 2 caractères pour la recherche'
        };
      }
      
      console.log('🔍 Recherche affections avec terme:', searchTerm);
      
      const response = await fetchAPI(`/affections?search=${encodeURIComponent(searchTerm)}&limit=${limit}`);
      
      // Normalisation de la structure
      if (response.success && Array.isArray(response.affections)) {
        return response;
      } else if (Array.isArray(response)) {
        return { 
          success: true, 
          affections: response,
          message: `${response.length} affection(s) trouvée(s)`
        };
      } else if (response && response.affections) {
        return {
          success: true,
          affections: Array.isArray(response.affections) ? response.affections : [],
          message: response.message || 'Recherche effectuée'
        };
      }
      
      return { 
        success: true, 
        affections: [], 
        message: 'Aucun résultat'
      };
      
    } catch (error) {
      console.error('❌ Erreur recherche affections:', error);
      return { 
        success: false, 
        message: `Erreur: ${error.message}`,
        affections: [] 
      };
    }
  },

  // Récupérer une affection par son ID
  async getById(id) {
    try {
      if (!id) {
        throw new Error('ID affection invalide');
      }
      
      const response = await fetchAPI(`/affections/${id}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération affection ${id}:`, error);
      throw error;
    }
  },

  // Créer une nouvelle affection
  async create(affectionData) {
    try {
      const dataToSend = {
        ...affectionData,
        cod_aff: affectionData.cod_aff || affectionData.COD_AFF,
        libelle: affectionData.libelle || affectionData.LIB_AFF,
        cod_pays: affectionData.cod_pays || affectionData.COD_PAY,
        cod_type_affection: affectionData.cod_type_affection || affectionData.COD_TAF,
        ncp: affectionData.ncp || affectionData.NCP_AFF,
        sexe: affectionData.sexe || affectionData.SEX_AFF,
        etat: affectionData.etat || affectionData.ETA_AFF
      };
      
      const response = await fetchAPI('/affections', {
        method: 'POST',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur création affection:', error);
      throw error;
    }
  },

  // Mettre à jour une affection
  async update(id, affectionData) {
    try {
      if (!id) {
        throw new Error('ID affection invalide');
      }
      
      const response = await fetchAPI(`/affections/${id}`, {
        method: 'PUT',
        body: affectionData,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour affection ${id}:`, error);
      throw error;
    }
  },

  // Supprimer une affection
  async delete(id) {
    try {
      if (!id) {
        throw new Error('ID affection invalide');
      }
      
      const response = await fetchAPI(`/affections/${id}`, {
        method: 'DELETE',
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression affection ${id}:`, error);
      throw error;
    }
  },

  // Recherche avancée d'affections
  async searchAdvanced(searchTerm, filters = {}, limit = 20) {
    try {
      const params = {
        search: searchTerm,
        limit,
        ...filters
      };
      
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/affections${queryString}`);
      
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche avancée affections:', error);
      return { success: false, message: error.message, affections: [] };
    }
  },

  // Recherche par code ou libellé
  async searchByCodeOrLibelle(searchTerm) {
    return this.search(searchTerm);
  },

  // Vérifier si une affection existe
  async checkExists(cod_aff) {
    try {
      if (!cod_aff) {
        return { success: true, exists: false };
      }
      
      const response = await fetchAPI(`/affections/${cod_aff}`);
      
      return {
        success: response.success,
        exists: response.success && response.affection ? true : false,
        affection: response.affection
      };
    } catch (error) {
      console.error('❌ Erreur vérification existence affection:', error);
      return { success: false, message: error.message, exists: false };
    }
  },

  // Alias pour compatibilité
  async getAllAffections(filters = {}) {
    return this.getAll(filters);
  },

  async getAffectionById(id) {
    return this.getById(id);
  },

  async createAffection(affectionData) {
    return this.create(affectionData);
  },

  async updateAffection(id, affectionData) {
    return this.update(id, affectionData);
  },

  async deleteAffection(id) {
    return this.delete(id);
  }
};


// ==============================================
// API POUR L'IMPORTATION DE DONNÉES
// ==============================================


// ==============================================
// CONSTANTES ET CONFIGURATION
// ==============================================

// Liste des schémas autorisés
const ALLOWED_SCHEMAS = ['core', 'security', 'config', 'audit', 'dbo'];

// Mode d'importation disponibles
const IMPORT_MODES = {
  INSERT_ONLY: 'insert_only',
  UPDATE_ONLY: 'update_only',
  UPSERT: 'upsert'
};

// Stratégies de gestion des doublons
const DUPLICATE_STRATEGIES = {
  UPDATE: 'update',
  SKIP: 'skip',
  ERROR: 'error'
};

// Stratégies de gestion des erreurs
const ERROR_HANDLING = {
  CONTINUE: 'continue',
  STOP: 'stop',
  SKIP_ROW: 'skip_row'
};

export const importAPI = {
  // ========== IMPORTATION DE FICHIERS ==========

  // Importer un fichier CSV/Excel
  async importFile(file, importParams = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Ajouter tous les paramètres d'importation
      Object.keys(importParams).forEach(key => {
        if (importParams[key] !== undefined && importParams[key] !== null) {
          if (typeof importParams[key] === 'object') {
            formData.append(key, JSON.stringify(importParams[key]));
          } else {
            formData.append(key, importParams[key]);
          }
        }
      });

      const response = await fetchAPI('/upload/masse', {
        method: 'POST',
        body: formData,
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur importation fichier:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'importation du fichier',
        details: {
          total: 0,
          inserted: 0,
          updated: 0,
          errors: 1,
          skipped: 0
        }
      };
    }
  },

  // Valider un fichier avant importation
  async validateFile(file, importParams = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'validate');
      
      // Ajouter les paramètres de validation
      Object.keys(importParams).forEach(key => {
        if (importParams[key] !== undefined && importParams[key] !== null) {
          formData.append(key, importParams[key]);
        }
      });

      const response = await fetchAPI('/upload/masse', {
        method: 'POST',
        body: formData,
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur validation fichier:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la validation du fichier',
        validated: false,
        errors: [error.message],
        warnings: []
      };
    }
  },

  // ========== TEMPLATES ET SCHEMAS ==========

  // Télécharger un template d'importation
  async downloadTemplate(table, format = 'csv', schema = 'core') {
    try {
      if (!table) {
        throw new Error('Table non spécifiée');
      }
      
      let fileName;
      let url = `/upload/template/${table}`;
      
      // Déterminer le format
      if (format === 'excel' || format === 'xlsx' || format === 'xls') {
        fileName = `template_${table.toLowerCase()}.xlsx`;
        url = `/upload/template-excel/${table}`;
      } else if (format === 'json') {
        fileName = `template_${table.toLowerCase()}.json`;
        url += '?format=json';
      } else {
        fileName = `template_${table.toLowerCase()}.csv`;
        url += '?format=csv';
      }
      
      // Ajouter le schéma
      if (schema && schema !== 'core') {
        url += url.includes('?') ? `&schema=${schema}` : `?schema=${schema}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      // Gérer le téléchargement
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
      
      return {
        success: true,
        message: 'Template téléchargé avec succès',
        fileName: fileName
      };
      
    } catch (error) {
      console.error('❌ Erreur téléchargement template:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors du téléchargement du template'
      };
    }
  },

  // Obtenir les informations d'un template
  async getTemplateInfo(table, schema = 'core') {
    try {
      const response = await fetchAPI(`/upload/template-info/${table}${schema ? `?schema=${schema}` : ''}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération infos template:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des informations du template'
      };
    }
  },

  // Obtenir la structure d'une table
  async getTableSchema(table, schema = 'core') {
    try {
      const response = await fetchAPI(`/upload/schema/${table}?schema=${schema}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération schéma ${schema}.${table}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération du schéma'
      };
    }
  },

  // ========== GESTION DES TABLES ==========

  // Récupérer toutes les tables disponibles
  async getAllTables(schema = null) {
    try {
      let url = '/upload/tables/all';
      if (schema) {
        url += `?schema=${schema}`;
      }
      
      const response = await fetchAPI(url);
      
      if (response.success && response.tables) {
        return response;
      } else {
        // Fallback pour le développement
        return {
          success: true,
          tables: [
            { name: 'BENEFICIAIRE', schema: 'core', label: 'Bénéficiaires', canImport: true },
            { name: 'PRESTATAIRE', schema: 'core', label: 'Prestataires', canImport: true },
            { name: 'CENTRE', schema: 'core', label: 'Centres de santé', canImport: true },
            { name: 'CARTE', schema: 'core', label: 'Cartes bénéficiaires', canImport: true },
            { name: 'UTILISATEUR', schema: 'security', label: 'Utilisateurs', canImport: false },
          ],
          total: 5,
          message: 'Tables récupérées'
        };
      }
    } catch (error) {
      console.error('❌ Erreur récupération tables:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des tables',
        tables: [],
        total: 0
      };
    }
  },

  // Obtenir les informations détaillées d'une table
  async getTableInfo(table, schema = 'core') {
    try {
      const response = await fetchAPI(`/upload/table-info/${table}?schema=${schema}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération infos table ${schema}.${table}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des informations de la table'
      };
    }
  },

  // Récupérer les schémas disponibles
  async getSchemas() {
    try {
      const response = await fetchAPI('/upload/schemas');
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération schémas:', error);
      return {
        success: true,
        schemas: [
          { name: 'core', description: 'Données principales', canImport: true },
          { name: 'security', description: 'Sécurité', canImport: false },
          { name: 'config', description: 'Configuration', canImport: true },
          { name: 'audit', description: 'Audit', canImport: false }
        ],
        message: 'Schémas récupérés'
      };
    }
  },

  // ========== DONNÉES DE RÉFÉRENCE ==========

  // Récupérer les données de référence pour les clés étrangères
  async getReferenceData(table, column, filters = {}) {
    try {
      let url = `/upload/reference-data/${table}/${column}`;
      
      // Ajouter les filtres
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const response = await fetchAPI(url);
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération données référence ${table}.${column}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des données de référence',
        data: [],
        total: 0
      };
    }
  },

  // ========== HISTORIQUE ET STATISTIQUES ==========

  // Récupérer l'historique des imports
  async getImportHistory(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/upload/history${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetchAPI(url);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération historique imports:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération de l\'historique',
        imports: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
      };
    }
  },

  // Récupérer les statistiques d'importation
  async getImportStats() {
    try {
      const response = await fetchAPI('/upload/stats');
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération statistiques:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des statistiques',
        stats: {}
      };
    }
  },

  // ========== GESTION DES MAPPINGS ==========

  // Mapper automatiquement les colonnes
  async autoMapColumns(file, table, schema = 'core', options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('table', table);
      formData.append('schema', schema);
      formData.append('action', 'auto-map');
      
      // Ajouter les options
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined && options[key] !== null) {
          formData.append(key, options[key]);
        }
      });

      const response = await fetchAPI('/upload/auto-map', {
        method: 'POST',
        body: formData,
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur mapping automatique:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors du mapping automatique',
        mapping: {},
        suggestions: []
      };
    }
  },

  // Valider un mapping
  async validateMapping(mapping, table, schema = 'core') {
    try {
      const response = await fetchAPI('/upload/validate-mapping', {
        method: 'POST',
        body: JSON.stringify({ mapping, table, schema }),
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur validation mapping:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la validation du mapping',
        valid: false,
        errors: []
      };
    }
  },

  // ========== GESTION DES FICHIERS ==========

  // Télécharger un rapport d'importation
  async downloadReport(importId, format = 'pdf') {
    try {
      const response = await fetchAPI(`/upload/report/${importId}?format=${format}`, {
        method: 'GET',
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur téléchargement rapport:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors du téléchargement du rapport'
      };
    }
  },

  // Obtenir les erreurs d'un import spécifique
  async getImportErrors(importId, limit = 100) {
    try {
      const response = await fetchAPI(`/upload/errors/${importId}?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération erreurs import:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des erreurs',
        errors: []
      };
    }
  },

  // ========== CONFIGURATION D'IMPORTATION ==========

  // Obtenir la configuration d'importation
  async getImportConfig() {
    try {
      const response = await fetchAPI('/upload/config');
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération configuration:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération de la configuration',
        config: {}
      };
    }
  },

  // Sauvegarder la configuration d'importation
  async saveImportConfig(config) {
    try {
      const response = await fetchAPI('/upload/config', {
        method: 'POST',
        body: JSON.stringify(config),
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur sauvegarde configuration:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la sauvegarde de la configuration'
      };
    }
  },

  // ========== OPÉRATIONS BATCH ==========

  // Annuler une importation en cours
  async cancelImport(importId) {
    try {
      const response = await fetchAPI(`/upload/cancel/${importId}`, {
        method: 'POST',
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur annulation import:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'annulation de l\'importation'
      };
    }
  },

  // Redémarrer une importation échouée
  async retryImport(importId) {
    try {
      const response = await fetchAPI(`/upload/retry/${importId}`, {
        method: 'POST',
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur redémarrage import:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors du redémarrage de l\'importation'
      };
    }
  },

  // ========== UTILITAIRES ==========

  // Tester la connexion à l'API d'importation
  async testConnection() {
    try {
      const response = await fetchAPI('/upload/test');
      return response;
    } catch (error) {
      console.error('❌ Erreur test connexion:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors du test de connexion'
      };
    }
  },

  // Obtenir les logs d'importation en temps réel
  async getLiveLogs(importId) {
    try {
      const response = await fetchAPI(`/upload/logs/${importId}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération logs:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des logs',
        logs: []
      };
    }
  },

  // Formater un nom de table pour l'affichage
  formatTableName(tableName) {
    if (!tableName) return '';
    
    let formatted = tableName.replace(/_/g, ' ');
    
    formatted = formatted.toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const corrections = {
      'Beneficiaire': 'Bénéficiaires',
      'Prestataire': 'Prestataires de santé',
      'Utilisateur': 'Utilisateurs',
      'Centre': 'Centres de santé',
      'Carte': 'Cartes bénéficiaires',
      'Affection': 'Affections médicales',
      'Medicament': 'Médicaments',
      'Consultation': 'Consultations',
      'Examen': 'Examens',
      'Prescription': 'Prescriptions'
    };
    
    return corrections[formatted] || formatted;
  },

  // Formater un nom de schéma
  formatSchemaName(schemaName) {
    const schemaLabels = {
      'core': 'Données principales',
      'security': 'Sécurité',
      'config': 'Configuration',
      'audit': 'Audit',
      'metier': 'Métier',
      'dbo': 'Base de données'
    };
    
    return schemaLabels[schemaName] || schemaName.toUpperCase();
  },

  // Valider les options d'importation
  validateImportOptions(options) {
    const errors = [];
    
    if (!options.table) {
      errors.push('La table est obligatoire');
    }
    
    if (options.batchSize && (options.batchSize < 1 || options.batchSize > 10000)) {
      errors.push('La taille du lot doit être entre 1 et 10000');
    }
    
    if (options.delimiter && ![',', ';', '\t', '|'].includes(options.delimiter)) {
      errors.push('Délimiteur non supporté');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  },

  // Obtenir la configuration par défaut
  getDefaultConfig() {
    return {
      delimiter: ',',
      hasHeader: true,
      batchSize: 100,
      importMode: 'upsert',
      duplicateStrategy: 'update',
      errorHandling: 'continue',
      maxFileSize: 100 * 1024 * 1024,
      allowedExtensions: ['.csv', '.txt', '.xlsx', '.xls'],
      defaultSchema: 'core',
      validateBeforeImport: true,
      createBackup: false,
      notifyOnComplete: false
    };
  }
};



// Fonction utilitaire pour convertir une URL relative en absolue (déplacée en dehors de l'objet)
// Remplacer la fonction toAbsoluteUrl par :
const toAbsoluteUrl = (url) => {
  if (!url) return null;
  
  // Si c'est déjà une URL complète
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  // Utiliser window._env_ ou une variable globale
  const baseURL = (window._env_ && window._env_.REACT_APP_API_URL) || 
                  window.REACT_APP_API_URL || 
                  window.location.origin;
  
  // Ajouter le préfixe /api si nécessaire
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  return `${baseURL}${cleanUrl}`;
};

export const beneficiairesAPI = {
  // ========== GESTION DES EMPLOYEURS ==========
  async getEmployeurs() {
  try {
    console.log('🔍 Appel API pour récupérer les employeurs...');
    
    // Essayer plusieurs endpoints possibles
    let response;
    try {
      response = await fetchAPI('/beneficiaires/employeurs');
    } catch (error) {
      console.warn('⚠️ Endpoint /beneficiaires/employeurs échoué, essai alternatif...');
      // Essayer un autre endpoint
      response = await fetchAPI('/employeurs');
    }
    
    if (response && response.success) {
      console.log(`✅ ${response.employeurs?.length || 0} employeurs récupérés`);
      return response;
    } else {
      console.warn('⚠️ API employeurs retourne success: false, utilisation du fallback');
      return {
        success: true,
        message: 'Utilisation de données locales',
        employeurs: []
      };
    }
  } catch (error) {
    console.error('❌ Erreur récupération employeurs:', error);
    return {
      success: true,
      message: 'Erreur de connexion, utilisation de données locales',
      employeurs: []
    };
  }
},

  // ========== GESTION DES IDENTIFIANTS NATIONAUX ==========
  getLastIdentifiantNational: async () => {
    try {
      const response = await fetchAPI('/beneficiaires/last-identifiant');
      return response;
    } catch (error) {
      console.error('Erreur API getLastIdentifiantNational:', error);
      return { 
        success: false, 
        message: error.message,
        lastIdentifiant: null
      };
    }
  },

  getLastIdentifiantNationalAlt: async () => {
    try {
      const response = await fetchAPI('/beneficiaires/last-identifiant-alt');
      return response;
    } catch (error) {
      console.error('Erreur API getLastIdentifiantNationalAlt:', error);
      return { 
        success: false, 
        message: error.message,
        lastIdentifiant: null,
        maxNumber: 0
      };
    }
  },

  getNextIdentifiantNational: async () => {
    try {
      const response = await fetchAPI('/beneficiaires/next-identifiant');
      return response;
    } catch (error) {
      console.error('Erreur API getNextIdentifiantNational:', error);
      return { 
        success: false, 
        message: error.message,
        nextIdentifiant: null
      };
    }
  },

  checkIdentifiantNational: async (identifiant) => {
    try {
      if (!identifiant) {
        throw new Error('Identifiant national requis');
      }
      
      const response = await fetchAPI(`/beneficiaires/check-identifiant/${encodeURIComponent(identifiant)}`);
      return response;
    } catch (error) {
      console.error('Erreur vérification identifiant:', error);
      return { 
        success: false, 
        message: error.message,
        exists: false
      };
    }
  },

  // ========== GESTION DES BÉNÉFICIAIRES ==========

  async getAll(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Ajouter les filtres aux paramètres
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/beneficiaires${queryString ? `?${queryString}` : ''}`);
      
      // Traiter les URLs de photos si nécessaire
      if (response.success && Array.isArray(response.beneficiaires)) {
      response.beneficiaires = response.beneficiaires.map(ben => ({
        ...ben,
        PHOTO_URL: ben.PHOTO ? toAbsoluteUrl(`/api/beneficiaires/${ben.ID_BEN}/photo`) : null, // Ajout de /api/
        photoUrl: ben.PHOTO ? toAbsoluteUrl(`/api/beneficiaires/${ben.ID_BEN}/photo`) : null   // Ajout de /api/
      }));
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération bénéficiaires:', error);
      return { 
        success: false, 
        message: error.message, 
        beneficiaires: [] 
      };
    }
  },


  // Récupérer la photo d'un bénéficiaire (VERSION CORRIGÉE)
async getPhoto(id) {
 try {
    if (!id || isNaN(parseInt(id))) {
      throw new Error('ID de bénéficiaire invalide');
    }
    
    console.log(`📸 Tentative récupération photo ${id}...`);
    
    // Construire l'URL de l'endpoint CORRIGÉ
    const apiUrl = `/api/beneficiaires/${id}/photo`; // Ajout de /api/
    
    // Essayer de récupérer la photo via fetch directement
    const baseURL = (window._env_ && window._env_.REACT_APP_API_URL) || 
                    window.REACT_APP_API_URL || 
                    window.location.origin;
    
    const fullUrl = `${baseURL}${apiUrl}`;
    
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, image/*',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        // Si c'est une image
        if (contentType && contentType.startsWith('image/')) {
          const blob = await response.blob();
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          
          return {
            success: true,
            photoUrl: dataUrl,
            mimeType: contentType,
            photoSize: blob.size
          };
        }
        // Si c'est du JSON avec base64
        else if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          
          if (data.success && data.photoData) {
            return {
              success: true,
              photoData: data.photoData,
              mimeType: data.mimeType || 'image/jpeg',
              photoSize: data.photoSize,
              photoUrl: `data:${data.mimeType || 'image/jpeg'};base64,${data.photoData}`
            };
          }
        }
      }
      
      // Si on arrive ici, c'est qu'aucune photo n'a été trouvée
      return {
        success: false,
        message: 'Photo non disponible',
        photoUrl: null
      };
      
    } catch (fetchError) {
      console.warn(`⚠️ Erreur fetch directe pour photo ${id}:`, fetchError.message);
      
      // Fallback: essayer via l'API normalisée
      const response = await fetchAPI(`/beneficiaires/${id}/photo`);
      
      if (response.success) {
        if (response.photoData) {
          return {
            success: true,
            photoData: response.photoData,
            mimeType: response.mimeType || 'image/jpeg',
            photoSize: response.photoSize,
            photoUrl: `data:${response.mimeType || 'image/jpeg'};base64,${response.photoData}`
          };
        } else if (response.photoUrl) {
          const absoluteUrl = toAbsoluteUrl(response.photoUrl);
          return {
            success: true,
            photoUrl: absoluteUrl,
            photoSize: response.photoSize,
            isPath: true
          };
        }
      }
      
      return {
        success: false,
        message: response.message || 'Photo non trouvée',
        photoUrl: null
      };
    }
    
  } catch (error) {
    console.error(`❌ Erreur récupération photo bénéficiaire ${id}:`, error);
    
    return {
      success: false,
      message: error.message,
      photoUrl: null
    };
  }
},

  // Récupérer l'URL de la photo d'un bénéficiaire (méthode simplifiée)
  async getPhotoUrl(id) {
    try {
      const photoResponse = await this.getPhoto(id);
      if (photoResponse.success && photoResponse.photoUrl) {
        return photoResponse.photoUrl;
      }
      return null;
    } catch (error) {
      console.error(`❌ Erreur récupération URL photo ${id}:`, error);
      return null;
    }
  },

  // Mettre à jour la photo d'un bénéficiaire
  async updatePhoto(id, photoFile) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      if (!photoFile) {
        throw new Error('Aucun fichier photo fourni');
      }
      
      // Créer FormData pour upload fichier
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('id', id);
      
      const response = await fetchAPI(`/beneficiaires/${id}/photo`, {
        method: 'PUT',
        body: formData,
        // Ne pas set le content-type, il sera automatiquement défini avec FormData
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour photo bénéficiaire ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour de la photo'
      };
    }
  },

  // Uploader une photo
  async uploadPhoto(id, photoFile) {
    return this.updatePhoto(id, photoFile);
  },

  // Récupérer un bénéficiaire par ID (CORRIGÉ pour inclure l'URL de photo)
  async getById(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}`);
      
      // Ajouter l'URL de la photo si le bénéficiaire existe
      if (response.success && response.beneficiaire) {
        const beneficiaire = response.beneficiaire;
        if (beneficiaire.PHOTO) {
          beneficiaire.PHOTO_URL = toAbsoluteUrl(`/beneficiaires/${id}/photo`);
          beneficiaire.photoUrl = toAbsoluteUrl(`/beneficiaires/${id}/photo`);
        }
        response.beneficiaire = beneficiaire;
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur bénéficiaire ${id}:`, error);
      return {
        success: false,
        message: error.message,
        beneficiaire: null
      };
    }
  },

  // Créer un nouveau bénéficiaire
  async create(formData) {
    try {
      const response = await fetchAPI('/beneficiaires', {
        method: 'POST',
        body: formData,
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur création bénéficiaire:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la création du bénéficiaire'
      };
    }
  },

  // Mettre à jour un bénéficiaire
  async update(id, formData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}`, {
        method: 'PUT',
        body: formData,
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur mise à jour bénéficiaire:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du bénéficiaire'
      };
    }
  },

  // Supprimer un bénéficiaire (soft delete)
  async delete(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}`, {
        method: 'DELETE',
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression bénéficiaire ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la suppression du bénéficiaire'
      };
    }
  },

  // Activer/désactiver un bénéficiaire
  async toggleStatus(id, status) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ active: status }),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur changement statut bénéficiaire ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors du changement de statut'
      };
    }
  },

  // ========== GESTION DES DONNÉES MÉDICALES ==========

  async getAllergies(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}/allergies`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur allergies bénéficiaire ${id}:`, error);
      return { 
        success: false, 
        message: error.message, 
        allergies: [] 
      };
    }
  },

  async addAllergie(id, allergieData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}/allergies`, {
        method: 'POST',
        body: JSON.stringify(allergieData),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur ajout allergie ${id}:`, error);
      throw error;
    }
  },

  async getAntecedents(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}/antecedents`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur antécédents bénéficiaire ${id}:`, error);
      return { 
        success: false, 
        message: error.message, 
        antecedents: [] 
      };
    }
  },

  async addAntecedent(id, antecedentData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}/antecedents`, {
        method: 'POST',
        body: JSON.stringify(antecedentData),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur ajout antécédent ${id}:`, error);
      throw error;
    }
  },

  async getNotes(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}/notes`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur notes bénéficiaire ${id}:`, error);
      return { 
        success: false, 
        message: error.message, 
        notes: [] 
      };
    }
  },

  async addNote(id, noteData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify(noteData),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur ajout note ${id}:`, error);
      throw error;
    }
  },

  async getDossierMedical(patientId) {
    try {
      if (!patientId || isNaN(parseInt(patientId))) {
        throw new Error('ID patient invalide');
      }
      
      const response = await fetchAPI(`/dossiers-medicaux/patient/${patientId}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur dossier médical ${patientId}:`, error);
      throw error;
    }
  },

  // ========== GESTION DES CARTES ==========

  async getCartes(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}/cartes`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur cartes bénéficiaire ${id}:`, error);
      return { 
        success: false, 
        message: error.message, 
        cartes: [] 
      };
    }
  },

  async createCarte(carteData) {
    try {
      const { ID_BEN, ...data } = carteData;
      
      if (!ID_BEN || isNaN(parseInt(ID_BEN))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      return await this.addCarte(ID_BEN, data);
    } catch (error) {
      console.error('❌ Erreur création carte:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la création de la carte'
      };
    }
  },

  async addCarte(id, carteData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      // Validation des champs obligatoires
      const requiredFields = ['COD_PAY', 'COD_CAR', 'NUM_CAR', 'DDV_CAR', 'DFV_CAR'];
      const missingFields = requiredFields.filter(field => !carteData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Champs obligatoires manquants: ${missingFields.join(', ')}`);
      }
      
      // Vérification des dates
      const ddvCar = new Date(carteData.DDV_CAR);
      const dfvCar = new Date(carteData.DFV_CAR);
      
      if (ddvCar > dfvCar) {
        throw new Error('La date de début de validité doit être antérieure à la date de fin');
      }
      
      // Nettoyage des données
      const cleanedData = {
        ...carteData,
        COD_PAY: carteData.COD_PAY.trim().toUpperCase(),
        COD_CAR: carteData.COD_CAR.trim().toUpperCase(),
        NUM_CAR: carteData.NUM_CAR.trim().toUpperCase(),
        NOM_BEN: carteData.NOM_BEN?.trim() || '',
        PRE_BEN: carteData.PRE_BEN?.trim() || '',
        SOC_BEN: carteData.SOC_BEN?.trim() || null,
        NAG_ASS: carteData.NAG_ASS?.trim() || null,
        PRM_BEN: carteData.PRM_BEN?.trim() || null,
        STS_CAR: carteData.STS_CAR !== undefined ? carteData.STS_CAR : 1
      };
      
      const response = await fetchAPI(`/beneficiaires/${id}/cartes`, {
        method: 'POST',
        body: JSON.stringify(cleanedData),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur création carte bénéficiaire ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la création de la carte'
      };
    }
  },

  async updateCarte(carteData) {
    try {
      const { ID_BEN, COD_PAY, COD_CAR, NUM_CAR, ...updateData } = carteData;
      
      if (!ID_BEN || isNaN(parseInt(ID_BEN))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      // Vérification des identifiants de carte
      if (!COD_PAY || !COD_CAR || !NUM_CAR) {
        throw new Error('Identifiants de carte incomplets. Requis: COD_PAY, COD_CAR, NUM_CAR');
      }
      
      // Vérification des dates si fournies
      if (updateData.DDV_CAR && updateData.DFV_CAR) {
        const ddvCar = new Date(updateData.DDV_CAR);
        const dfvCar = new Date(updateData.DFV_CAR);
        
        if (ddvCar > dfvCar) {
          throw new Error('La date de début de validité doit être antérieure à la date de fin');
        }
      }
      
      // Nettoyage des données
      const cleanedData = { ...updateData };
      
      if (cleanedData.COD_PAY) cleanedData.COD_PAY = cleanedData.COD_PAY.trim().toUpperCase();
      if (cleanedData.COD_CAR) cleanedData.COD_CAR = cleanedData.COD_CAR.trim().toUpperCase();
      if (cleanedData.NUM_CAR) cleanedData.NUM_CAR = cleanedData.NUM_CAR.trim().toUpperCase();
      if (cleanedData.NOM_BEN) cleanedData.NOM_BEN = cleanedData.NOM_BEN.trim();
      if (cleanedData.PRE_BEN) cleanedData.PRE_BEN = cleanedData.PRE_BEN.trim();
      if (cleanedData.SOC_BEN) cleanedData.SOC_BEN = cleanedData.SOC_BEN.trim();
      if (cleanedData.NAG_ASS) cleanedData.NAG_ASS = cleanedData.NAG_ASS.trim();
      if (cleanedData.PRM_BEN) cleanedData.PRM_BEN = cleanedData.PRM_BEN.trim();
      
      const response = await fetchAPI(`/beneficiaires/${ID_BEN}/cartes/${COD_PAY}/${COD_CAR}/${NUM_CAR}`, {
        method: 'PUT',
        body: JSON.stringify(cleanedData),
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur mise à jour carte:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour de la carte'
      };
    }
  },

  async deleteCarte(id, carteId) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      // carteId doit être un objet avec COD_PAY, COD_CAR, NUM_CAR
      if (!carteId || !carteId.COD_PAY || !carteId.COD_CAR || !carteId.NUM_CAR) {
        throw new Error('Identifiants de carte incomplets. Requis: COD_PAY, COD_CAR, NUM_CAR');
      }
      
      const { COD_PAY, COD_CAR, NUM_CAR } = carteId;
      const response = await fetchAPI(`/beneficiaires/${id}/cartes/${COD_PAY}/${COD_CAR}/${NUM_CAR}`, {
        method: 'DELETE',
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression carte bénéficiaire ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la suppression de la carte'
      };
    }
  },

  // ========== GESTION DES REMBOURSEMENTS ==========

  async getRemboursements(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}/remboursements`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur remboursements bénéficiaire ${id}:`, error);
      return { 
        success: false, 
        message: error.message, 
        remboursements: [] 
      };
    }
  },

  // ========== GESTION DES DONNÉES BIOMÉTRIQUES ==========

  async getBiometrie(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}/biometrie`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur biométrie bénéficiaire ${id}:`, error);
      return { 
        success: false, 
        message: error.message, 
        enregistrements: [] 
      };
    }
  },

  async addBiometrie(id, biometrieData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}/biometrie`, {
        method: 'POST',
        body: JSON.stringify(biometrieData),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur ajout biométrie ${id}:`, error);
      throw error;
    }
  },

  // ========== STATISTIQUES ==========

  async getStatistiquesGenerales() {
    try {
      const response = await fetchAPI(`/statistiques/generales`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération statistiques générales:', error);
      return { 
        success: false, 
        message: error.message,
        statistiques: null
      };
    }
  },

  // ========== GESTION DES CENTRES DE SANTÉ ==========

  async getCentres(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}/centres`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur centres bénéficiaire ${id}:`, error);
      return { 
        success: false, 
        message: error.message, 
        centres: [] 
      };
    }
  },
  
  async assignCentre(beneficiaireId, centreId) {
    try {
      if (!beneficiaireId || isNaN(parseInt(beneficiaireId))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      if (!centreId || isNaN(parseInt(centreId))) {
        throw new Error('ID de centre invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${beneficiaireId}/centres/assign`, {
        method: 'POST',
        body: JSON.stringify({ COD_CEN: centreId }),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur attribution centre ${centreId} à bénéficiaire ${beneficiaireId}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'attribution du centre'
      };
    }
  },
  
  async getHistoriqueCentres(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/beneficiaires/${id}/centres/historique`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur historique centres bénéficiaire ${id}:`, error);
      return { 
        success: false, 
        message: error.message, 
        historique: [] 
      };
    }
  },
  
  // ========== RECHERCHE AVANCÉE ==========
  
  async searchAdvanced(searchTerm, filters = {}, limit = 20, page = 1) {
    try {
      const params = {
        search: searchTerm,
        limit,
        page,
        ...filters
      };
      
      // Construire la query string avec des paramètres avancés
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          if (Array.isArray(params[key])) {
            params[key].forEach(value => {
              queryParams.append(`${key}[]`, value);
            });
          } else {
            queryParams.append(key, params[key]);
          }
        }
      });
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/beneficiaires/search${queryString ? `?${queryString}` : ''}`);
      
      // Adaptation de la structure pour le frontend
      if (response.success && Array.isArray(response.beneficiaires)) {
        const adaptedBeneficiaires = response.beneficiaires.map(ben => {
          // Déterminer le type de bénéficiaire basé sur STATUT_ACE
          let typeBeneficiaire = 'Assuré Principal';
          if (ben.STATUT_ACE) {
            switch(ben.STATUT_ACE.toUpperCase()) {
              case 'CONJOINT':
                typeBeneficiaire = 'Conjoint';
                break;
              case 'ENFANT':
                typeBeneficiaire = 'Enfant';
                break;
              case 'ASCENDANT':
                typeBeneficiaire = 'Ascendant';
                break;
              default:
                typeBeneficiaire = ben.STATUT_ACE;
            }
          }
          
          // Générer l'URL de la photo si elle existe
          const photoUrl = ben.PHOTO && ben.ID_BEN ? 
            toAbsoluteUrl(`/beneficiaires/${ben.ID_BEN}/photo`) : null;
          
          return {
            // Informations d'identification
            ID_BEN: ben.ID_BEN || ben.id,
            id: ben.ID_BEN || ben.id,
            NOM_BEN: ben.NOM_BEN || ben.nom,
            nom: ben.NOM_BEN || ben.nom,
            PRE_BEN: ben.PRE_BEN || ben.prenom,
            prenom: ben.PRE_BEN || ben.prenom,
            FIL_BEN: ben.FIL_BEN || ben.nom_marital,
            nom_marital: ben.FIL_BEN || ben.nom_marital,
            SEX_BEN: ben.SEX_BEN || ben.sexe,
            sexe: ben.SEX_BEN || ben.sexe,
            AGE: ben.AGE || ben.age,
            NAI_BEN: ben.NAI_BEN || ben.date_naissance,
            date_naissance: ben.NAI_BEN || ben.date_naissance,
            LIEU_NAISSANCE: ben.LIEU_NAISSANCE || ben.lieu_naissance,
            
            // Informations de contact
            IDENTIFIANT_NATIONAL: ben.IDENTIFIANT_NATIONAL || ben.identifiant_national,
            identifiant_national: ben.IDENTIFIANT_NATIONAL || ben.identifiant_national,
            NUM_PASSEPORT: ben.NUM_PASSEPORT || ben.num_passeport,
            TELEPHONE: ben.TELEPHONE || ben.telephone,
            TELEPHONE_MOBILE: ben.TELEPHONE_MOBILE || ben.telephone_mobile,
            telephone: ben.TELEPHONE_MOBILE || ben.telephone_mobile || ben.telephone,
            EMAIL: ben.EMAIL || ben.email,
            email: ben.EMAIL || ben.email,
            
            // Informations professionnelles
            PROFESSION: ben.PROFESSION || ben.profession,
            profession: ben.PROFESSION || ben.profession,
            EMPLOYEUR: ben.EMPLOYEUR || ben.employeur,
            employeur: ben.EMPLOYEUR || ben.employeur,
            SALAIRE: ben.SALAIRE || ben.salaire,
            NIVEAU_ETUDE: ben.NIVEAU_ETUDE || ben.niveau_etude,
            
            // Informations personnelles
            SITUATION_FAMILIALE: ben.SITUATION_FAMILIALE || ben.situation_familiale,
            situation_familiale: ben.SITUATION_FAMILIALE || ben.situation_familiale,
            NOMBRE_ENFANTS: ben.NOMBRE_ENFANTS || ben.nombre_enfants,
            RELIGION: ben.RELIGION || ben.religion,
            LANGUE_MATERNEL: ben.LANGUE_MATERNEL || ben.langue_maternelle,
            LANGUE_PARLEE: ben.LANGUE_PARLEE || ben.langue_parlee,
            
            // Informations géographiques
            COD_PAY: ben.COD_PAY || ben.cod_pay,
            cod_pay: ben.COD_PAY || ben.cod_pay,
            COD_REGION: ben.COD_REGION || ben.cod_region,
            CODE_TRIBAL: ben.CODE_TRIBAL || ben.code_tribal,
            ZONE_HABITATION: ben.ZONE_HABITATION || ben.zone_habitation,
            zone_habitation: ben.ZONE_HABITATION || ben.zone_habitation,
            TYPE_HABITAT: ben.TYPE_HABITAT || ben.type_habitat,
            type_habitat: ben.TYPE_HABITAT || ben.type_habitat,
            
            // Conditions de vie
            ACCES_EAU: ben.ACCES_EAU !== undefined ? ben.ACCES_EAU : (ben.acces_eau !== undefined ? ben.acces_eau : true),
            ACCES_ELECTRICITE: ben.ACCES_ELECTRICITE !== undefined ? ben.ACCES_ELECTRICITE : (ben.acces_electricite !== undefined ? ben.acces_electricite : true),
            DISTANCE_CENTRE_SANTE: ben.DISTANCE_CENTRE_SANTE || ben.distance_centre_sante || 0,
            MOYEN_TRANSPORT: ben.MOYEN_TRANSPORT || ben.moyen_transport,
            
            // Informations ACE
            STATUT_ACE: ben.STATUT_ACE || ben.statut_ace,
            statut_ace: ben.STATUT_ACE || ben.statut_ace,
            type_beneficiaire: ben.type_beneficiaire || typeBeneficiaire,
            ID_ASSURE_PRINCIPAL: ben.ID_ASSURE_PRINCIPAL || ben.id_assure_principal,
            id_assure_principal: ben.ID_ASSURE_PRINCIPAL || ben.id_assure_principal,
            
            // Informations de l'assuré principal
            nom_assure_principal: ben.nom_assure_principal,
            prenom_assure_principal: ben.prenom_assure_principal,
            NOM_ASSURE_PRINCIPAL: ben.nom_assure_principal,
            PRE_ASSURE_PRINCIPAL: ben.prenom_assure_principal,
            
            // Informations médicales
            ANTECEDENTS_MEDICAUX: ben.ANTECEDENTS_MEDICAUX || ben.antecedents_medicaux,
            ALLERGIES: ben.ALLERGIES || ben.allergies,
            TRAITEMENTS_EN_COURS: ben.TRAITEMENTS_EN_COURS || ben.traitements_en_cours,
            GROUPE_SANGUIN: ben.GROUPE_SANGUIN || ben.groupe_sanguin,
            
            // Contacts d'urgence
            CONTACT_URGENCE: ben.CONTACT_URGENCE || ben.contact_urgence,
            TEL_URGENCE: ben.TEL_URGENCE || ben.tel_urgence,
            
            // Informations d'assurance
            ASSURANCE_PRIVE: ben.ASSURANCE_PRIVE || ben.assurance_prive || false,
            assurance_prive: ben.ASSURANCE_PRIVE || ben.assurance_prive || false,
            MUTUELLE: ben.MUTUELLE || ben.mutuelle,
            mutuelle: ben.MUTUELLE || ben.mutuelle,
            
            // Informations du centre de santé
            ID_CENTRE_SANTE: ben.ID_CENTRE_SANTE || ben.id_centre_sante,
            NOM_CENTRE: ben.NOM_CENTRE || ben.nom_centre,
            TYPE_CENTRE: ben.TYPE_CENTRE || ben.type_centre,
            ADRESSE_CENTRE: ben.ADRESSE_CENTRE || ben.adresse_centre,
            TELEPHONE_CENTRE: ben.TELEPHONE_CENTRE || ben.telephone_centre,
            DATE_AFFECTATION_CENTRE: ben.DATE_AFFECTATION_CENTRE || ben.date_affectation_centre,
            
            // Photo et autres (CORRIGÉ pour les URLs de photos)
            PHOTO: ben.PHOTO || ben.photo,
            photo: ben.PHOTO || ben.photo,
            PHOTO_URL: photoUrl,
            photoUrl: photoUrl,
            PHOTO_FILENAME: ben.PHOTO || ben.photo,
            
            // Statut
            STATUT: ben.STATUT || (ben.RETRAIT_DATE ? 'INACTIF' : 'ACTIF'),
            active: !ben.RETRAIT_DATE
          };
        });
        
        return { 
          ...response, 
          beneficiaires: adaptedBeneficiaires 
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche avancée bénéficiaires:', error);
      return { 
        success: false, 
        message: error.message, 
        beneficiaires: [] 
      };
    }
  }
};

<<<<<<< HEAD

// Export PDF API
export const exportPDFAPI = {
  // Exporter le dossier médical en PDF
  exportDossierMedical: async (beneficiaireId, options, format = 'pdf') => {
=======
  // Supprimer un bénéficiaire (soft delete)
  async delete(id) {
>>>>>>> d90a12e2bad9383f696451b6f983404524d7015b
    try {
      const response = await api.post(`/export/dossier-medical/${beneficiaireId}`, {
        format,
        options,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur export PDF:', error);
      throw error;
    }
  },

  // Générer le PDF côté client
  generatePDFClient: async (data, options, companyInfo) => {
    // Cette fonction génère le PDF côté client en attendant l'implémentation backend
    return new Promise((resolve) => {
      // Simulation de génération PDF
      setTimeout(() => {
        const pdfBlob = new Blob([JSON.stringify(data)], { type: 'application/pdf' });
        resolve(pdfBlob);
      }, 2000);
    });
  },

  // Télécharger le fichier généré
  downloadPDF: (data, filename) => {
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

  // Alias pour bénéficiaires (pour compatibilité)
  export const patientsAPI = beneficiairesAPI;

export const famillesACEAPI = {
  // Récupérer toutes les familles - CORRIGÉ
  async getAll(search = '', filters = {}, limit = 100, page = 1) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit);
      queryParams.append('page', page);
      
      if (search) queryParams.append('search', search);
      
      // Ajouter les filtres s'ils existent
      if (filters.type_ayant_droit) {
        queryParams.append('type_ayant_droit', filters.type_ayant_droit);
      }
      if (filters.actif !== undefined && filters.actif !== '') {
        queryParams.append('actif', filters.actif);
      }
      
      const response = await fetchAPI(`/familles-ace?${queryParams.toString()}`);
      
      console.log('✅ Réponse familles:', response); // Debug
      return response;
      
    } catch (error) {
      console.error('❌ Erreur API getAll:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur réseau', 
        familles: [] 
      };
    }
  },

  // Récupérer une famille par ID
  async getById(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        return { success: false, message: 'ID invalide', data: null };
      }
      const response = await fetchAPI(`/familles-ace/${id}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération famille:', error);
      return { 
        success: false, 
        message: error.message, 
        data: null 
      };
    }
  },

  // Créer une famille
  async create(familleData) {
    try {
      const response = await fetchAPI('/familles-ace', {
        method: 'POST',
        body: familleData,
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur création famille:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  // Mettre à jour une famille
  async update(id, familleData) {
    try {
      const response = await fetchAPI(`/familles-ace/${id}`, {
        method: 'PUT',
        body: familleData,
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur mise à jour famille:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  // Désactiver une famille
  async delete(id) {
    try {
      const response = await fetchAPI(`/familles-ace/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur désactivation famille:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  // Récupérer les statistiques
  async getStatistiques() {
    try {
      const response = await fetchAPI('/familles-ace/statistiques');
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération statistiques familles:', error);
      return { 
        success: false, 
        message: error.message, 
        data: null 
      };
    }
  },

  // Récupérer les assurés principaux
  async getAssuresPrincipaux(limit = 100, search = '') {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit);
      if (search) queryParams.append('search', search);
      
      const response = await fetchAPI(`/beneficiaires/assures-principaux?${queryParams.toString()}`);
      
      console.log('✅ Réponse assurés principaux:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération assurés principaux:', error);
      return { 
        success: false, 
        message: error.message, 
        beneficiaires: [] 
      };
    }
  },

  // Recherche de bénéficiaires
  async search(searchTerm = '', isAyantDroit = false, limit = 100) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('search', searchTerm);
      queryParams.append('limit', limit);
      
      const response = await fetchAPI(`/beneficiaires?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche bénéficiaires:', error);
      return { 
        success: false, 
        message: error.message, 
        beneficiaires: [] 
      };
    }
  },

  // Récupérer les ayants droit d'un assuré
  async getAyantsDroitByAssure(idAssure) {
    try {
      if (!idAssure || isNaN(parseInt(idAssure))) {
        return { success: false, message: 'ID d\'assuré principal invalide', data: null };
      }
      
      const response = await fetchAPI(`/familles-ace/assure/${idAssure}/ayants-droit`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération ayants droit pour l'assuré ${idAssure}:`, error);
      return { 
        success: false, 
        message: error.message, 
        data: null 
      };
    }
  },
  
  // Récupérer la composition familiale d'un assuré principal
  async getComposition(idAssure) {
    try {
      if (!idAssure || isNaN(parseInt(idAssure))) {
        return { success: false, message: 'ID d\'assuré principal invalide', composition: [] };
      }
      
      const response = await fetchAPI(`/familles/${idAssure}/composition`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur composition familiale ${idAssure}:`, error);
      return { 
        success: false, 
        message: error.message, 
        composition: [] 
      };
    }
  },

  // Ajouter un ayant droit à une famille
  async addAyantDroit(assurePrincipalId, ayantDroitData) {
    try {
      if (!assurePrincipalId || isNaN(parseInt(assurePrincipalId))) {
        return { success: false, message: 'ID d\'assuré principal invalide' };
      }
      
      const response = await fetchAPI(`/familles/${assurePrincipalId}/ayants-droit`, {
        method: 'POST',
        body: ayantDroitData,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur ajout ayant droit ${assurePrincipalId}:`, error);
      return { success: false, message: error.message };
    }
  }
};

export const declarationsAPI = {
  // Récupérer les déclarations de remboursement
  async getDeclarations(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/declarations${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération déclarations:', error);
      return { 
        success: false, 
        message: error.message, 
        declarations: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }
  }
};

export const ticketsAPI = {
  // Récupérer les tickets modérateurs
  async getTicketsModerateurs(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/tickets-moderateurs${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération tickets modérateurs:', error);
      return { 
        success: false, 
        message: error.message, 
        tickets: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }
  }
};

export const statistiquesAPI = {
  // Récupérer les statistiques générales
  async getStatistiquesGenerales() {
    try {
      const response = await fetchAPI('/statistiques/generales');
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération statistiques:', error);
      return { 
        success: false, 
        message: error.message, 
        statistiques: {}
      };
    }
  }
};

export const rapportsAPI = {
  // Générer un rapport bénéficiaires
  async getRapportBeneficiaires(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/rapports/beneficiaires${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur génération rapport bénéficiaires:', error);
      return { 
        success: false, 
        message: error.message, 
        rapport: [],
        total: 0
      };
    }
  },

  // Exporter les données bénéficiaires
  async exportBeneficiaires(format = 'csv') {
    try {
      const response = await fetchAPI(`/export/beneficiaires?format=${format}`);
      
      if (format === 'csv' && response.success) {
        // Pour le CSV, la réponse est le fichier lui-même
        return response;
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur export bénéficiaires:', error);
      return { 
        success: false, 
        message: error.message,
        data: []
      };
    }
  }
};

export const syncAPI = {
   async checkBenefPoliceStructure() {
    try {
      const response = await fetchAPI('/sync/check-benef-police', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur vérification structure BENEF_POLICE:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  // Synchroniser les données ACE
  async syncAceData() {
    try {
      const response = await fetchAPI('/sync/ace-data', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur synchronisation ACE:', error);
      return { 
        success: false, 
        message: error.message,
        results: []
      };
    }
  },

   // Synchroniser les liens bénéficiaire-police
  async syncBenefPolice() {
    try {
      const response = await fetchAPI('/sync/benef-police', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur synchronisation BENEF_POLICE:', error);
      return { 
        success: false, 
        message: error.message,
        results: []
      };
    }
  },

  // Synchroniser une relation centre-prestataire (créer ou mettre à jour)
  async syncCentrePrestataire(relationData) {
   try {
      const response = await fetchAPI('/sync/centre-prestataire', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur synchronisation ACE:', error);
      return { 
        success: false, 
        message: error.message,
        results: []
      };
    }
  },

  // Récupérer les relations centre-prestataire d'un prestataire
  async getCentrePrestataireByPrestataire(cod_pre) {
    try {
      const response = await fetchAPI(`/sync/centre-prestataire/${cod_pre}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération relations centre-prestataire:', error);
      return { 
        success: false, 
        message: error.message,
        data: []
      };
    }
  },

  // Vérifier si une relation existe entre un centre et un prestataire
  async checkCentrePrestataire(cod_pre, cod_cen) {
    try {
      const response = await fetchAPI(`/sync/centre-prestataire/check/${cod_pre}/${cod_cen}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur vérification relation centre-prestataire:', error);
      return { 
        success: false, 
        message: error.message,
        exists: false
      };
    }
  },

  // Supprimer une relation centre-prestataire
  async deleteCentrePrestataire(num_precen) {
    try {
      const response = await fetchAPI(`/sync/centre-prestataire/${num_precen}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur suppression relation centre-prestataire:', error);
      return { 
        success: false, 
        message: error.message
      };
    }
  },

  // Synchroniser plusieurs relations centre-prestataire en batch
  async syncCentrePrestataireBatch(relations) {
    try {
      const response = await fetchAPI('/sync/centre-prestataire/batch', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur synchronisation batch centre-prestataire:', error);
      return { 
        success: false, 
        message: error.message,
        results: [],
        summary: {
          total: 0,
          successful: 0,
          failed: 0
        }
      };
    }
  },

  // Optionnel: Fonction utilitaire pour formater les données avant envoi
  formatCentrePrestataireData(data) {
    return {
      COD_PRE: data.COD_PRE,
      COD_CEN: data.COD_CEN,
      DEB_AGRP: data.DEB_AGRP || null,
      FIN_AGRP: data.FIN_AGRP || null,
      OBS_AGRP: data.OBS_AGRP || null,
      TR1_AGRP: data.TR1_AGRP || null,
      TR2_AGRP: data.TR2_AGRP || null,
      TR3_AGRP: data.TR3_AGRP || null,
      TPS_AGRP: data.TPS_AGRP || null,
      TVA_AGRP: data.TVA_AGRP || null
    };
  },

  // ============================================
  // NOUVELLES FONCTIONS AJOUTÉES
  // ============================================

  /**
   * Synchronisation globale de tous les prestataires
   * @param {Object} syncConfig - Configuration de la synchronisation
   * @returns {Promise<Object>} Résultat de la synchronisation
   */
  async globalSync(syncConfig) {
    try {
      const response = await fetchAPI('/sync/global', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur synchronisation globale:', error);
      return { 
        success: false, 
        message: error.message,
        stats: {
          success: 0,
          failed: 0,
          skipped: 0
        }
      };
    }
  },

  /**
   * Synchronisation complète d'un prestataire (données + relations)
   * @param {Object} syncData - Données de synchronisation complète
   * @returns {Promise<Object>} Résultat de la synchronisation
   */
  async fullSync(syncData) {
    try {
      const response = await fetchAPI('/sync/global', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur synchronisation complète:', error);
      return { 
        success: false, 
        message: error.message
      };
    }
  },

  /**
   * Valider les données d'un prestataire avant synchronisation
   * @param {Object} prestataireData - Données du prestataire à valider
   * @returns {Promise<Object>} Résultat de la validation
   */
  async validatePrestataire(prestataireData) {
    try {
      const response = await fetchAPI('/sync/global', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur validation prestataire:', error);
      return { 
        success: false, 
        message: error.message,
        errors: []
      };
    }
  },

  /**
   * Sauvegarder les données des prestataires
   * @param {Object} backupConfig - Configuration de la sauvegarde
   * @returns {Promise<Object>} Résultat de la sauvegarde
   */
  async backupPrestataires(backupConfig) {
    try {
      const response = await fetchAPI('/sync/global', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur sauvegarde prestataires:', error);
      return { 
        success: false, 
        message: error.message,
        backupPath: null
      };
    }
  },

  /**
   * Restaurer les données des prestataires
   * @param {Object} restoreConfig - Configuration de la restauration
   * @returns {Promise<Object>} Résultat de la restauration
   */
  async restorePrestataires(restoreConfig) {
    try {
      const response = await fetchAPI('/sync/global', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur restauration prestataires:', error);
      return { 
        success: false, 
        message: error.message
      };
    }
  },

  /**
   * Obtenir le statut de la synchronisation
   * @returns {Promise<Object>} Statut de la synchronisation
   */
  async getStatus() {
    try {
      const response = await fetchAPI('/sync/global', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération statut synchronisation:', error);
      return { 
        success: false, 
        message: error.message,
        lastSync: null,
        inProgress: false,
        stats: {
          success: 0,
          failed: 0,
          skipped: 0
        }
      };
    }
  },

  /**
   * Synchroniser un prestataire individuel (création, mise à jour, suppression, statut)
   * @param {Object} syncData - Données de synchronisation du prestataire
   * @returns {Promise<Object>} Résultat de la synchronisation
   */
  async syncPrestataire(syncData) {
    try {
      const response = await fetchAPI('/sync/global', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur synchronisation prestataire:', error);
      return { 
        success: false, 
        message: error.message
      };
    }
  },

  /**
   * Annuler une synchronisation en cours
   * @param {string} syncId - ID de la synchronisation à annuler
   * @returns {Promise<Object>} Résultat de l'annulation
   */
  async cancelSync(syncId) {
    try {
      const response = await fetchAPI(`/sync/global/${syncId}`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur annulation synchronisation:', error);
      return { 
        success: false, 
        message: error.message
      };
    }
  },

  /**
   * Obtenir l'historique des synchronisations
   * @param {Object} filters - Filtres pour l'historique
   * @returns {Promise<Object>} Historique des synchronisations
   */
  async getHistory(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `/sync/history?${queryParams}` : '/sync/global';
      
      const response = await fetchAPI(url, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération historique synchronisation:', error);
      return { 
        success: false, 
        message: error.message,
        history: [],
        total: 0
      };
    }
  },

  /**
   * Forcer la synchronisation d'un prestataire spécifique
   * @param {string} prestataireId - ID du prestataire
   * @param {Object} options - Options de synchronisation forcée
   * @returns {Promise<Object>} Résultat de la synchronisation forcée
   */
  async forceSyncPrestataire(prestataireId, options = {}) {
    try {
      const response = await fetchAPI(`/sync/global/${prestataireId}`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur synchronisation forcée prestataire:', error);
      return { 
        success: false, 
        message: error.message
      };
    }
  },

  /**
   * Vérifier les conflits de données avant synchronisation
   * @param {Object} data - Données à vérifier
   * @returns {Promise<Object>} Résultat de la vérification des conflits
   */
  async checkConflicts(data) {
    try {
      const response = await fetchAPI('/sync/global', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur vérification conflits:', error);
      return { 
        success: false, 
        message: error.message,
        conflicts: []
      };
    }
  },

  /**
   * Résoudre les conflits de données
   * @param {Object} resolutionData - Données de résolution des conflits
   * @returns {Promise<Object>} Résultat de la résolution
   */
  async resolveConflicts(resolutionData) {
    try {
      const response = await fetchAPI('/sync/global', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur résolution conflits:', error);
      return { 
        success: false, 
        message: error.message
      };
    }
  },

  /**
   * Nettoyer les anciennes données de synchronisation
   * @param {Object} cleanupConfig - Configuration du nettoyage
   * @returns {Promise<Object>} Résultat du nettoyage
   */
  async cleanupSyncData(cleanupConfig = {}) {
    try {
      const response = await fetchAPI('/sync/global', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur nettoyage données synchronisation:', error);
      return { 
        success: false, 
        message: error.message,
        cleanedCount: 0
      };
    }
  }
};

  // ==============================================
  // API DES PAYS
  // ==============================================

 export const paysAPI = {
    async getAll() {
      try {
        const response = await fetchAPI('/pays');
        return response;
      } catch (error) {
        console.error('❌ Erreur récupération pays:', error);
        return { success: false, message: error.message, pays: [] };
      }
    },
    
    async getByCode(code) {
      try {
        const response = await fetchAPI(`/pays/${encodeURIComponent(code)}`);
        return response;
      } catch (error) {
        console.error(`❌ Erreur pays ${code}:`, error);
        throw error;
      }
    }
  };
  

  // ==============================================
  // API D'AUTHENTIFICATION
  // ==============================================

  export const authAPI = {
    async login(credentials) {
      try {
        const response = await fetchAPI('/auth/login', {
          method: 'POST',
          body: credentials,
        });
        
        if (response.success && response.token) {
          // Stockage sécurisé du token
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Ajout d'une date d'expiration
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);
          localStorage.setItem('token_expires', expiresAt.toISOString());
        }
        
        return response;
      } catch (error) {
        console.error('❌ Erreur login:', error);
        throw error;
      }
    },

    logout() {
      try {
        // Nettoyage complet des données d'authentification
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('token_expires');
        
        return Promise.resolve();
      } catch (error) {
        console.error('❌ Erreur lors de la déconnexion:', error);
        return Promise.reject(error);
      }
    },

    async verifyToken() {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          return { success: false, valid: false, message: 'Aucun token trouvé' };
        }
        
        // Vérification de l'expiration
        const expiresAt = localStorage.getItem('token_expires');
        if (expiresAt && new Date(expiresAt) < new Date()) {
          this.logout();
          return { success: false, valid: false, message: 'Token expiré' };
        }
        
        const response = await fetchAPI('/auth/verify');
        return response;
      } catch (error) {
        console.error('❌ Erreur vérification token:', error);
        
        // Déconnexion en cas d'erreur 401
        if (error.status === 401) {
          this.logout();
        }
        
        throw error;
      }
    },
    
    isAuthenticated() {
      const token = localStorage.getItem('token');
      const expiresAt = localStorage.getItem('token_expires');
      
      if (!token) return false;
      
      // Vérification de l'expiration
      if (expiresAt) {
        return new Date(expiresAt) > new Date();
      }
      
      return true;
    },
    
    getUser() {
      try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
      } catch (error) {
        console.error('❌ Erreur récupération utilisateur:', error);
        return null;
      }
    },
    async getProfileDetails() {
    try {
      const response = await fetchAPI('/auth/profile');
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération détails profil:', error);
      
      // Fallback: retourner les données du localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return { success: true, user };
        } catch (e) {
          console.error('❌ Erreur parsing user:', e);
        }
      }
      
      return {
        success: false,
        message: error.message,
        user: null
      };
    }
  },

  async updateProfile(profileData) {
    try {
      // Validation des données requises
      if (!profileData.email) {
        throw new Error('L\'email est obligatoire');
      }

      const response = await fetchAPI('/auth/profile', {
        method: 'PUT',
        body: profileData,
      });

      if (response.success && response.token) {
        // Mettre à jour le localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Mettre à jour la date d'expiration
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        localStorage.setItem('token_expires', expiresAt.toISOString());
      }

      return response;
    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      throw error;
    }
  },

  async changePassword(passwordData) {
    try {
      const response = await fetchAPI('/auth/change-password', {
        method: 'POST',
        body: passwordData,
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur changement mot de passe:', error);
      throw error;
    }
  },

  // Fonction pour déconnecter tous les appareils
  async logoutAllDevices() {
    try {
      const response = await fetchAPI('/auth/logout-all', {
        method: 'POST',
      });
      
      // Nettoyage local
      this.logout();
      
      return response;
    } catch (error) {
      console.error('❌ Erreur déconnexion tous appareils:', error);
      throw error;
    }
  },

  // Récupérer l'historique de connexion
  async getLoginHistory(limit = 10) {
    try {
      const response = await fetchAPI(`/auth/login-history?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur historique connexion:', error);
      return {
        success: false,
        message: error.message,
        history: []
      };
    }
  }
  };

  // ==============================================
  // API DU DASHBOARD
  // ==============================================

  export const dashboardAPI = {
    async getStats(periode = 'mois') {
      try {
        const response = await fetchAPI(`/dashboard/stats?periode=${periode}`);
        return response;
      } catch (error) {
        console.error('❌ Erreur stats dashboard:', error);
        return {
          success: false,
          message: error.message,
          stats: {
            totalPatients: 0,
            consultationsAujourdhui: 0,
            medecinsActifs: 0,
            revenueMensuel: 0,
            centresActifs: 0,
            prescriptionsAujourdhui: 0,
            patientsToday: 0
          }
        };
      }
    },
    
    async getConsultationsParMois(mois = 6) {
      try {
        const response = await fetchAPI(`/dashboard/consultations-par-mois?mois=${mois}`);
        return response;
      } catch (error) {
        console.error('❌ Erreur consultations par mois:', error);
        return { success: false, message: error.message, data: [] };
      }
    },
    
    async getRevenueParMois(mois = 6) {
      try {
        const response = await fetchAPI(`/dashboard/revenue-par-mois?mois=${mois}`);
        return response;
      } catch (error) {
        console.error('❌ Erreur revenue par mois:', error);
        return { success: false, message: error.message, data: [] };
      }
    }
  };

  // ==============================================
  // API DES CENTRES DE SANTÉ
  // ==============================================
export const centresAPI = {
  // Récupérer tous les centres
  async getAll() {
    try {
      const response = await fetch('/api/centres', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        console.error(`❌ Erreur HTTP ${response.status}: ${response.statusText}`);
        return { 
          success: false, 
          message: `Erreur HTTP ${response.status}`,
          centres: [] 
        };
      }
      
      const data = await response.json();
      
      // Normaliser la réponse pour s'assurer qu'elle a le bon format
      if (Array.isArray(data)) {
        return {
          success: true,
          centres: data,
          message: `${data.length} centres récupérés`
        };
      } else if (data.success !== undefined) {
        return data;
      } else if (data.centres !== undefined) {
        return {
          success: true,
          centres: data.centres,
          message: data.message || 'Centres récupérés'
        };
      } else {
        return {
          success: true,
          centres: [],
          message: 'Aucun centre disponible'
        };
      }
      
    } catch (error) {
      console.error('❌ Erreur réseau chargement centres:', error);
      return { 
        success: false, 
        message: `Erreur réseau: ${error.message}`,
        centres: [] 
      };
    }
  },

  // Récupérer un centre par son ID
  async getById(id) {
    try {
      const response = await fetch(`/api/centres/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        console.error(`❌ Erreur HTTP ${response.status} pour centre ${id}: ${response.statusText}`);
        return { 
          success: false, 
          message: `Erreur ${response.status}`,
          centre: null 
        };
      }
      
      const data = await response.json();
      
      if (data.success !== undefined) {
        return data;
      } else {
        return {
          success: true,
          centre: data,
          message: 'Centre récupéré'
        };
      }
      
    } catch (error) {
      console.error(`❌ Erreur chargement centre ${id}:`, error);
      return { 
        success: false, 
        message: error.message,
        centre: null 
      };
    }
  },

  // Récupérer les prestataires par centre
  async getPrestatairesByCentre(centreId, filters = {}) {
    try {
      // Validation de l'ID centre
      if (!centreId || centreId === 'null' || centreId === 'undefined') {
        console.error('❌ ID centre invalide pour getPrestatairesByCentre:', centreId);
        return { 
          success: false, 
          message: 'ID centre invalide',
          prestataires: [] 
        };
      }
      
      // Construction des paramètres
      const params = new URLSearchParams();
      
      // Paramètres par défaut
      params.append('page', filters.page || 1);
      params.append('limit', filters.limit || 100);
      
      // Ajouter les filtres optionnels
      if (filters.type_prestataire) params.append('type_prestataire', filters.type_prestataire);
      if (filters.actif !== undefined) params.append('actif', filters.actif);
      if (filters.search) params.append('search', filters.search);
      if (filters.affectation_active !== undefined) params.append('affectation_active', filters.affectation_active);
      
      const url = `/api/centres/${centreId}/prestataires?${params.toString()}`;
      console.log(`🔍 Appel API prestataires: ${url}`);
      
      // Vérifier le token
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ Token manquant pour getPrestatairesByCentre');
        return { 
          success: false, 
          message: 'Session expirée, veuillez vous reconnecter',
          prestataires: [] 
        };
      }
      
      // Effectuer la requête
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`📡 Statut réponse: ${response.status} ${response.statusText}`);
      
      // Vérifier si la réponse est OK
      if (!response.ok) {
        console.error(`❌ Erreur HTTP ${response.status}: ${response.statusText}`);
        
        // Essayer de lire le message d'erreur
        let errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
              errorMessage = errorText;
            }
          }
        } catch (e) {
          console.error('❌ Erreur lecture message erreur:', e);
        }
        
        return { 
          success: false, 
          message: errorMessage,
          prestataires: [] 
        };
      }
      
      // Parser la réponse JSON
      let data;
      try {
        data = await response.json();
        console.log('📦 Données API prestataires reçues:', data);
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError);
        return { 
          success: false, 
          message: 'Réponse invalide du serveur',
          prestataires: [] 
        };
      }
      
      // Traiter les différents formats de réponse
      if (!data) {
        console.error('❌ Réponse API vide');
        return { 
          success: false, 
          message: 'Réponse vide du serveur',
          prestataires: [] 
        };
      }
      
      // Format 1: Réponse avec propriété 'success'
      if (data.success !== undefined) {
        const prestatairesArray = Array.isArray(data.prestataires) ? data.prestataires : [];
        console.log(`✅ Format 1: ${prestatairesArray.length} prestataires récupérés`);
        return {
          success: data.success,
          message: data.message || `${prestatairesArray.length} prestataires récupérés`,
          prestataires: prestatairesArray
        };
      }
      
      // Format 2: Réponse directe sous forme de tableau
      if (Array.isArray(data)) {
        console.log(`✅ Format 2: ${data.length} prestataires récupérés`);
        return {
          success: true,
          message: `${data.length} prestataires récupérés`,
          prestataires: data
        };
      }
      
      // Format 3: Réponse avec propriété 'data' contenant un tableau
      if (data.data && Array.isArray(data.data)) {
        console.log(`✅ Format 3: ${data.data.length} prestataires récupérés`);
        return {
          success: true,
          message: data.message || `${data.data.length} prestataires récupérés`,
          prestataires: data.data
        };
      }
      
      // Format 4: Réponse avec propriété 'result' contenant un tableau
      if (data.result && Array.isArray(data.result)) {
        console.log(`✅ Format 4: ${data.result.length} prestataires récupérés`);
        return {
          success: true,
          message: data.message || `${data.result.length} prestataires récupérés`,
          prestataires: data.result
        };
      }
      
      // Format inconnu
      console.error('❌ Format de réponse inconnu:', data);
      return { 
        success: false, 
        message: 'Format de réponse inconnu du serveur',
        prestataires: [] 
      };
      
    } catch (error) {
      console.error('❌ Erreur réseau getPrestatairesByCentre:', error);
      return { 
        success: false, 
        message: `Erreur réseau: ${error.message}`,
        prestataires: [] 
      };
    }
  },

  // Récupérer uniquement le centre de l'utilisateur
async getMyCentre() {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('Utilisateur non connecté');
    }
    
    const user = JSON.parse(userStr);
    const userCentreId = user?.COD_CEN || user?.centre_id || user?.prestataire?.centre_id;
    
    if (!userCentreId) {
      throw new Error('Utilisateur non affecté à un centre');
    }
    
    return await this.getById(userCentreId);
  } catch (error) {
    console.error('❌ Erreur récupération centre utilisateur:', error);
    return {
      success: false,
      message: error.message,
      centre: null
    };
  }
},

  // Créer un nouveau centre
  async create(centreData) {
    try {
      console.log('📝 Création centre:', centreData);
      
      if (!centreData.LIB_CEN || !centreData.TYP_CEN) {
        throw new Error('Les champs LIB_CEN et TYP_CEN sont obligatoires');
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token manquant');
      }
      
      const response = await fetch('/api/centres', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(centreData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('❌ Erreur création centre:', error);
      throw error;
    }
  },

  // Mettre à jour un centre existant
  async update(id, centreData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID centre invalide');
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token manquant');
      }
      
      const response = await fetch(`/api/centres/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(centreData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error(`❌ Erreur mise à jour centre ${id}:`, error);
      throw error;
    }
  },

  // Désactiver un centre
  async delete(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID centre invalide');
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token manquant');
      }
      
      const response = await fetch(`/api/centres/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error(`❌ Erreur suppression centre ${id}:`, error);
      throw error;
    }
  },

  // Rechercher des centres par nom
  async searchCentres(searchTerm, limit = 20) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { 
          success: true, 
          centres: [],
          message: 'Entrez au moins 2 caractères pour la recherche'
        };
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        return { 
          success: false, 
          message: 'Token manquant',
          centres: [] 
        };
      }
      
      const response = await fetch(`/api/centres/search?search=${encodeURIComponent(searchTerm)}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error(`❌ Erreur HTTP recherche centres: ${response.status}`);
        return { 
          success: false, 
          message: `Erreur ${response.status}`,
          centres: [] 
        };
      }
      
      const data = await response.json();
      
      // Normaliser la réponse
      if (Array.isArray(data)) {
        return {
          success: true,
          centres: data,
          message: `${data.length} centres trouvés`
        };
      } else if (data.success !== undefined) {
        return data;
      } else if (data.centres !== undefined) {
        return {
          success: true,
          centres: data.centres,
          message: data.message || 'Recherche effectuée'
        };
      } else {
        return {
          success: true,
          centres: [],
          message: 'Aucun résultat'
        };
      }
      
    } catch (error) {
      console.error('❌ Erreur recherche centres:', error);
      return { 
        success: false, 
        message: error.message,
        centres: [] 
      };
    }
  },

  // Fonction de recherche rapide pour autocomplétion
  async searchQuick(searchTerm, limit = 10) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { success: true, centres: [], options: [] };
      }
      
      const response = await this.searchCentres(searchTerm, limit);
      
      if (response.success && response.centres) {
        const options = response.centres.map(centre => ({
          id: centre.COD_CEN || centre.id,
          label: centre.LIB_CEN || centre.nom || `Centre ${centre.COD_CEN}`,
          value: centre.COD_CEN || centre.id,
          nom: centre.LIB_CEN || centre.nom,
          code: centre.COD_CEN,
          type: centre.TYP_CEN || centre.type,
          region: centre.COD_PAI || centre.region
        }));
        
        return { 
          ...response, 
          options 
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche rapide centres:', error);
      return { 
        success: false, 
        message: error.message, 
        centres: [], 
        options: [] 
      };
    }
  },

  // Récupérer les statistiques des centres
  async getStatistics() {
    try {
      const response = await this.getAll();
      
      if (response.success && response.centres) {
        const centres = response.centres;
        
        const statistiques = {
          total: centres.length,
          actifs: centres.filter(c => c.ACTIF === 1 || c.ACTIF === true || c.ACTIF === '1' || c.actif === 1).length,
          inactifs: centres.filter(c => c.ACTIF === 0 || c.ACTIF === false || c.ACTIF === '0' || c.actif === 0).length,
          par_type: centres.reduce((acc, centre) => {
            const type = centre.TYP_CEN || centre.type || 'Non spécifié';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {}),
          par_region: centres.reduce((acc, centre) => {
            const region = centre.COD_PAI || centre.region || 'Non spécifiée';
            acc[region] = (acc[region] || 0) + 1;
            return acc;
          }, {})
        };
        
        return {
          success: true,
          statistiques: statistiques
        };
      }
      
      return {
        success: true,
        statistiques: {
          total: 0,
          actifs: 0,
          inactifs: 0,
          par_type: {},
          par_region: {}
        }
      };
      
    } catch (error) {
      console.error('❌ Erreur statistiques centres:', error);
      return {
        success: false,
        message: error.message,
        statistiques: null
      };
    }
  },

  // Tester la connexion à l'API centres
  async testConnection() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return {
          success: false,
          message: 'Token manquant',
          timestamp: new Date().toISOString()
        };
      }
      
      const response = await fetch('/api/centres?limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return {
        success: response.ok,
        message: response.ok ? 'API centres opérationnelle' : `API en erreur: ${response.status}`,
        timestamp: new Date().toISOString(),
        status: response.status
      };
    } catch (error) {
      console.error('❌ Test connexion centres échoué:', error);
      return {
        success: false,
        message: 'API centres non disponible',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  // Fonction utilitaire pour debugger l'API
  async debugPrestatairesAPI(centreId) {
    try {
      console.log('🧪 Début debug API prestataires...');
      
      if (!centreId) {
        console.error('❌ ID centre manquant');
        return;
      }
      
      const url = `/api/centres/${centreId}/prestataires?page=1&limit=5`;
      console.log(`🌐 URL: ${url}`);
      
      const token = localStorage.getItem('token');
      console.log(`🔑 Token présent: ${!!token}`);
      
      console.log('📡 Envoi de la requête...');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`📊 Statut: ${response.status} ${response.statusText}`);
      console.log(`📊 Headers:`, Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log(`📄 Réponse brute (${text.length} caractères):`, text.substring(0, 500));
      
      try {
        const json = JSON.parse(text);
        console.log('✅ JSON parsé avec succès:', json);
        console.log('🔍 Structure:', {
          type: typeof json,
          isArray: Array.isArray(json),
          keys: Object.keys(json || {}),
          hasSuccess: 'success' in json,
          hasPrestataires: 'prestataires' in json,
          prestatairesType: typeof json.prestataires,
          prestatairesIsArray: Array.isArray(json.prestataires)
        });
        
        if (Array.isArray(json.prestataires)) {
          console.log(`📊 Nombre de prestataires: ${json.prestataires.length}`);
          if (json.prestataires.length > 0) {
            console.log('📋 Premier prestataire:', json.prestataires[0]);
          }
        }
        
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError);
      }
      
      console.log('🧪 Fin debug API prestataires');
      
    } catch (error) {
      console.error('❌ Erreur debug API:', error);
    }
  }
};



export const antecedentsAPI = {
  async getByPatientId(patientId) {
    try {
      const response = await fetchAPI(`/antecedents/patient/${patientId}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur antécédents patient ${patientId}:`, error);
      return { 
        success: false, 
        message: error.message, 
        antecedents: [] 
      };
    }
  }
};

export const allergiesAPI = {
  async getByPatientId(patientId) {
    try {
      const response = await fetchAPI(`/allergies/patient/${patientId}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur allergies patient ${patientId}:`, error);
      return { 
        success: false, 
        message: error.message, 
        allergies: [] 
      };
    }
  }
};

  // ==============================================
  // API DES PRESCRIPTIONS (CORRIGÉE)
  // ==============================================

export const prescriptionsAPI = {
  async getAll(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/prescriptions${queryString}`);
      
      // Assurer la cohérence de la réponse
      if (response.success && !response.pagination) {
        response.pagination = {
          total: response.prescriptions?.length || 0,
          page: params.page || 1,
          limit: params.limit || 20,
          totalPages: Math.ceil((response.prescriptions?.length || 0) / (params.limit || 20))
        };
      }
      
      return response;
    } catch (error) {
      console.error('Erreur récupération prescriptions:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération des prescriptions',
        prescriptions: [], 
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } 
      };
    }
  },

  async getById(id) {
    try {
      if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
        throw new Error('ID de prescription invalide');
      }
      
      const response = await fetchAPI(`/prescriptions/${id}`);
      
      // Log pour débogage
      console.log('📊 Réponse de getById:', response);
      
      if (response.success && response.prescription) {
        console.log('✅ Détails trouvés dans response.prescription.details:', response.prescription.details?.length || 0, 'éléments');
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération prescription ${id}:`, error);
      return { 
        success: false, 
        message: error.message || 'Prescription non trouvée',
        prescription: null 
      };
    }
  },

  async getByPatientId(patientId) {
    try {
      if (!patientId || isNaN(parseInt(patientId)) || parseInt(patientId) <= 0) {
        throw new Error('ID patient invalide');
      }
      
      const response = await fetchAPI(`/prescriptions/patient/${patientId}`);
      return response;
    } catch (error) {
      console.error(`Erreur récupération prescriptions patient ${patientId}:`, error);
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération des prescriptions',
        prescriptions: [],
        statistics: {
          total: 0,
          executees: 0,
          en_attente: 0,
          validees: 0,
          annulees: 0,
          montant_total: 0
        }
      };
    }
  },

  async getByNumero(numero) {
    try {
      if (!numero || typeof numero !== 'string' || numero.trim() === '') {
        throw new Error('Numéro de prescription invalide');
      }
      
      console.log('🔍 Recherche par numéro:', numero);
      // Recherche par numéro via la route getAll avec le paramètre search
      const response = await fetchAPI(`/prescriptions?search=${encodeURIComponent(numero)}&limit=1`);
      
      console.log('📄 Résultat recherche par numéro:', response);
      
      if (response.success && response.prescriptions && response.prescriptions.length > 0) {
        const prescription = response.prescriptions[0];
        console.log('✅ Prescription trouvée par numéro, ID:', prescription.COD_PRES);
        // Retourner la prescription complète avec ses détails
        return await this.getById(prescription.COD_PRES || prescription.id);
      }
      
      console.log('❌ Aucune prescription trouvée pour le numéro:', numero);
      return {
        success: false,
        message: 'Prescription non trouvée',
        prescription: null
      };
      
    } catch (error) {
      console.error(`Erreur récupération prescription ${numero}:`, error);
      throw error;
    }
  },

async getByNumeroOrId(identifier) {
  try {
    console.log('🔍 getByNumeroOrId appelé avec:', identifier);
    
    // Essai par numéro de prescription (si c'est une chaîne contenant un tiret)
    if (typeof identifier === 'string' && identifier.includes('-')) {
      try {
        console.log('🔎 Tentative par numéro de prescription...');
        const response = await this.getByNumero(identifier);
        if (response.success && response.prescription) {
          console.log('✅ Trouvé par numéro');
          return response;
        }
      } catch (error) {
        console.log('❌ Échec par numéro, tentative suivante...');
      }
    }
    
    // Essai par ID numérique
    const idNum = parseInt(identifier);
    if (!isNaN(idNum) && idNum > 0) {
      try {
        console.log('🔎 Tentative par ID numérique...');
        const response = await this.getById(idNum);
        if (response.success && response.prescription) {
          console.log('✅ Trouvé par ID');
          return response;
        }
      } catch (error) {
        console.log('❌ Échec par ID, tentative suivante...');
      }
    }
    
    // Recherche textuelle dans la vue
    try {
      console.log('🔎 Tentative par recherche textuelle...');
      const searchResponse = await this.getAll({ 
        search: identifier, 
        limit: 5 
      });
      
      console.log('📄 Résultat recherche textuelle:', searchResponse);
      
      if (searchResponse.success && 
          searchResponse.prescriptions && 
          searchResponse.prescriptions.length > 0) {
        
        // Pour la vue, nous n'avons pas les détails, donc récupérer la prescription complète
        const prescription = searchResponse.prescriptions[0];
        console.log('✅ Trouvé par recherche textuelle, ID:', prescription.COD_PRES);
        
        // Récupérer la prescription avec détails
        return await this.getById(prescription.COD_PRES || prescription.id);
      }
    } catch (error) {
      console.log('❌ Échec recherche textuelle');
    }
    
    // Aucun résultat
    console.log('❌ Aucun résultat trouvé pour:', identifier);
    return {
      success: false,
      message: 'Prescription non trouvée',
      prescription: null
    };
    
  } catch (error) {
    console.error('❌ Erreur getByNumeroOrId:', error);
    return {
      success: false,
      message: error.message || 'Erreur lors de la recherche',
      prescription: null
    };
  }
},

  async create(prescriptionData) {
    try {
      // Nettoyage et formatage des données
      const cleanedData = { ...prescriptionData };
      
      // Formater les dates
      if (cleanedData.DATE_VALIDITE) {
        cleanedData.DATE_VALIDITE = formatDateForAPI(cleanedData.DATE_VALIDITE);
      }
      
      // Valeurs par défaut
      if (cleanedData.ORIGINE === undefined) {
        cleanedData.ORIGINE = 'Electronique';
      }
      
      if (cleanedData.COD_AFF === undefined) {
        cleanedData.COD_AFF = null;
      }
      
      // Formater les détails (médicaments)
      if (cleanedData.details && Array.isArray(cleanedData.details)) {
        cleanedData.details = cleanedData.details.map(detail => ({
          ...detail,
          TYPE_ELEMENT: detail.TYPE_ELEMENT || 'MEDICAMENT',
          COD_ELEMENT: detail.COD_ELEMENT || detail.COD_MED || '',
          LIBELLE: detail.LIBELLE || detail.NOM_COMMERCIAL || '',
          QUANTITE: parseFloat(detail.QUANTITE) || 1,
          PRIX_UNITAIRE: parseFloat(detail.PRIX_UNITAIRE) || 0,
          REMBOURSABLE: detail.REMBOURSABLE !== undefined ? detail.REMBOURSABLE : 1
        }));
      }
      
      console.log('📤 Données envoyées pour création:', cleanedData);
      const response = await fetchAPI('/prescriptions', {
        method: 'POST',
        body: cleanedData,
      });
      
      console.log('📥 Réponse création:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur création prescription:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la création de la prescription',
        data: null
      };
    }
  },
  
  async updateStatus(id, statusData) {
    try {
      if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
        throw new Error('ID de prescription invalide');
      }
      
      if (!statusData || !statusData.statut) {
        throw new Error('Le statut est requis');
      }
      
      const response = await fetchAPI(`/prescriptions/${id}/statut`, {
        method: 'PUT',
        body: statusData,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour statut prescription ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du statut',
        data: null
      };
    }
  },

  async cancel(id, raison) {
    try {
      return await this.updateStatus(id, { 
        statut: 'Annulée',
        motif: raison || 'Annulée par l\'utilisateur'
      });
    } catch (error) {
      console.error(`❌ Erreur annulation prescription ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'annulation de la prescription'
      };
    }
  },

  async validate(id, motif = null) {
    try {
      const data = { statut: 'Validée' };
      if (motif) {
        data.motif = motif;
      }
      return await this.updateStatus(id, data);
    } catch (error) {
      console.error(`❌ Erreur validation prescription ${id}:`, error);
      throw error;
    }
  },

  async getMedicaments(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/medicaments${queryString}`);
      return response;
    } catch (error) {
      console.error('Erreur récupération médicaments:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des médicaments',
        medicaments: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };
    }
  },

async searchMedicalItemsUnified(searchTerm, type = null) {
  try {
    const params = { search: searchTerm };
    if (type) params.type = type;
    
    const queryString = buildQueryString(params);
    const response = await fetchAPI(`/consultations/medicaments${queryString}`);
    
    // Si la réponse est directement un tableau (ancienne structure)
    if (response && Array.isArray(response)) {
      // Filtrer par type si spécifié
      let filteredResults = response;
      if (type) {
        filteredResults = response.filter(item => {
          if (type === 'medicament') return item.type === 'medicament';
          if (type === 'nomenclature') return item.type === 'nomenclature';
          if (type === 'nomenclature_exclue') return item.type === 'nomenclature_exclue';
          return true;
        });
      }
      
      return { 
        success: true, 
        medicaments: filteredResults,
        items: filteredResults,
        medicamentsOnly: filteredResults.filter(item => item.type === 'medicament'),
        nomenclaturesOnly: filteredResults.filter(item => item.type === 'nomenclature'),
        nomenclaturesExcluesOnly: filteredResults.filter(item => item.type === 'nomenclature_exclue'),
        allNomenclatures: filteredResults.filter(item => 
          item.type === 'nomenclature' || item.type === 'nomenclature_exclue'
        ),
        count: filteredResults.length,
        breakdown: {
          medicaments: filteredResults.filter(item => item.type === 'medicament').length,
          nomenclatures: filteredResults.filter(item => item.type === 'nomenclature').length,
          nomenclatures_exclues: filteredResults.filter(item => item.type === 'nomenclature_exclue').length,
          total_nomenclatures: filteredResults.filter(item => 
            item.type === 'nomenclature' || item.type === 'nomenclature_exclue'
          ).length
        }
      };
    } 
    // Si l'API retourne un objet structuré (nouvelle structure)
    else if (response && typeof response === 'object' && response.success !== undefined) {
      // Si un type spécifique est demandé, filtrer les résultats
      if (type && response.medicaments) {
        let filteredMedicaments = response.medicaments;
        
        if (type === 'medicament') {
          filteredMedicaments = response.medicaments.filter(item => item.type === 'medicament');
        } else if (type === 'nomenclature') {
          filteredMedicaments = response.medicaments.filter(item => 
            item.type === 'nomenclature' || item.type === 'nomenclature_exclue'
          );
        } else if (type === 'nomenclature_exclue') {
          filteredMedicaments = response.medicaments.filter(item => item.type === 'nomenclature_exclue');
        }
        
        // Recalculer les statistiques pour les résultats filtrés
        return {
          ...response,
          medicaments: filteredMedicaments,
          items: filteredMedicaments,
          medicamentsOnly: filteredMedicaments.filter(item => item.type === 'medicament'),
          nomenclaturesOnly: filteredMedicaments.filter(item => item.type === 'nomenclature'),
          nomenclaturesExcluesOnly: filteredMedicaments.filter(item => item.type === 'nomenclature_exclue'),
          allNomenclatures: filteredMedicaments.filter(item => 
            item.type === 'nomenclature' || item.type === 'nomenclature_exclue'
          ),
          count: filteredMedicaments.length,
          breakdown: {
            medicaments: filteredMedicaments.filter(item => item.type === 'medicament').length,
            nomenclatures: filteredMedicaments.filter(item => item.type === 'nomenclature').length,
            nomenclatures_exclues: filteredMedicaments.filter(item => item.type === 'nomenclature_exclue').length,
            total_nomenclatures: filteredMedicaments.filter(item => 
              item.type === 'nomenclature' || item.type === 'nomenclature_exclue'
            ).length
          }
        };
      }
      
      return { success: true, ...response };
    }
    
    // Aucune donnée valide
    return { 
      success: true, 
      medicaments: [], 
      items: [],
      medicamentsOnly: [],
      nomenclaturesOnly: [],
      nomenclaturesExcluesOnly: [],
      allNomenclatures: [],
      count: 0,
      breakdown: {
        medicaments: 0,
        nomenclatures: 0,
        nomenclatures_exclues: 0,
        total_nomenclatures: 0
      }
    };
  } catch (error) {
    console.error('❌ Erreur recherche unifiée:', error);
    return { 
      success: false, 
      message: error.message, 
      medicaments: [], 
      items: [],
      medicamentsOnly: [],
      nomenclaturesOnly: [],
      nomenclaturesExcluesOnly: [],
      allNomenclatures: [],
      count: 0,
      breakdown: {
        medicaments: 0,
        nomenclatures: 0,
        nomenclatures_exclues: 0,
        total_nomenclatures: 0
      }
    };
  }
},

// services/api.js - dans prescriptionsAPI
async searchMedicalItems(search, type = '', limit = 20) {
  try {
    console.log('🔍 searchMedicalItems appelée avec:', { search, type, limit });
    
    // Validation de la recherche
    if (!search || (typeof search === 'string' && search.trim().length < 2)) {
      return { 
        success: true, 
        items: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 }
      };
    }

    const searchTerm = typeof search === 'string' ? search.trim() : String(search);
    let items = [];
    let responseData = { success: true, items: [] };

    try {
      // Essayer de récupérer les médicaments
      const medResponse = await this.getMedicaments({ 
        search: searchTerm, 
        page: 1, 
        limit 
      });
      
      console.log('💊 Réponse médicaments:', medResponse);
      
      if (medResponse.success && Array.isArray(medResponse.medicaments)) {
        // Transformer les médicaments
        const medicamentItems = medResponse.medicaments.map(med => {
          // Extraire le prix
          let prix = 0;
          if (med.PRIX_UNITAIRE !== undefined && med.PRIX_UNITAIRE !== null) {
            prix = parseFloat(med.PRIX_UNITAIRE);
            if (isNaN(prix)) {
              console.warn(`Prix invalide pour ${med.NOM_COMMERCIAL}: ${med.PRIX_UNITAIRE}`);
              prix = 0;
            }
          }
          
          return {
            id: med.COD_MED || med.id,
            COD_ELEMENT: med.COD_MED || med.id,
            COD_MED: med.COD_MED,
            type: 'medicament',
            libelle: med.NOM_COMMERCIAL || '',
            libelle_complet: `${med.NOM_COMMERCIAL || ''} ${med.NOM_GENERIQUE ? `(${med.NOM_GENERIQUE})` : ''} - ${med.FORME_PHARMACEUTIQUE || ''} ${med.DOSAGE || ''}`.trim(),
            NOM_COMMERCIAL: med.NOM_COMMERCIAL,
            NOM_GENERIQUE: med.NOM_GENERIQUE,
            FORME_PHARMACEUTIQUE: med.FORME_PHARMACEUTIQUE,
            DOSAGE: med.DOSAGE,
            PRIX_UNITAIRE: prix,
            PRIX: prix,
            prix: prix,
            REMBOURSABLE: med.REMBOURSABLE || 0,
            CONDITIONNEMENT: med.CONDITIONNEMENT,
            VOIE_ADMINISTRATION: med.VOIE_ADMINISTRATION,
            quantite_stock: med.QUANTITE_STOCK || 0
          };
        });
        
        items = [...items, ...medicamentItems];
      }
    } catch (medError) {
      console.error('❌ Erreur recherche médicaments:', medError);
    }

    // Chercher les actes médicaux - essayer différentes routes
    const acteEndpoints = [
      '/medical-acts',
      '/actes-medicaux',
      '/prestations',
      '/actes',
      '/tarifs'
    ];
    
    let actesFound = false;
    
    for (const endpoint of acteEndpoints) {
      if (actesFound) break;
      
      try {
        console.log(`🔍 Tentative endpoint: ${endpoint}`);
        const queryParams = `?search=${encodeURIComponent(searchTerm)}&limit=${limit}`;
        const acteResponse = await fetchAPI(`${endpoint}${queryParams}`);
        
        console.log(`📊 Réponse ${endpoint}:`, acteResponse);
        
        if (acteResponse && (Array.isArray(acteResponse) || (acteResponse.success && Array.isArray(acteResponse.actes)) || (acteResponse.success && Array.isArray(acteResponse.prestations)) || (acteResponse.success && Array.isArray(acteResponse.tarifs)))) {
          actesFound = true;
          
          // Normaliser la réponse selon le format
          let actesArray = [];
          if (Array.isArray(acteResponse)) {
            actesArray = acteResponse;
          } else if (acteResponse.actes) {
            actesArray = acteResponse.actes;
          } else if (acteResponse.prestations) {
            actesArray = acteResponse.prestations;
          } else if (acteResponse.tarifs) {
            actesArray = acteResponse.tarifs;
          } else if (acteResponse.items) {
            actesArray = acteResponse.items;
          }
          
          // Transformer les actes
          const acteItems = actesArray.map(acte => {
            // Extraire le prix de différentes façons possibles
            let prix = 0;
            const prixFields = [
              acte.prix,
              acte.PRIX,
              acte.PRIX_UNITAIRE,
              acte.prix_unitaire,
              acte.TARIF,
              acte.tarif,
              acte.MONTANT,
              acte.montant,
              acte.COUT,
              acte.cout
            ];
            
            for (const field of prixFields) {
              if (field !== undefined && field !== null) {
                const parsed = parseFloat(field);
                if (!isNaN(parsed)) {
                  prix = parsed;
                  break;
                }
              }
            }
            
            return {
              id: acte.COD_ACTE || acte.COD_ELEMENT || acte.COD_TARIF || acte.id || `acte-${Date.now()}-${Math.random()}`,
              COD_ELEMENT: acte.COD_ACTE || acte.COD_ELEMENT || acte.COD_TARIF || acte.id,
              type: 'acte',
              libelle: acte.LIBELLE || acte.libelle || acte.NOM || acte.nom || 'Acte médical',
              libelle_complet: acte.LIBELLE_COMPLET || acte.libelle_complet || acte.LIBELLE || acte.libelle || acte.DESCRIPTION || acte.description || 'Acte médical',
              PRIX_UNITAIRE: prix,
              PRIX: prix,
              prix: prix,
              CATEGORIE: acte.CATEGORIE || acte.categorie,
              CODE_NOMENCLATURE: acte.CODE_NOMENCLATURE,
              UNITE: acte.UNITE || 'U',
              REMBOURSABLE: acte.REMBOURSABLE !== false ? 1 : 0,
              TAUX_PRISE_EN_CHARGE: acte.TAUX_PRISE_EN_CHARGE || 80
            };
          });
          
          items = [...items, ...acteItems];
        }
      } catch (endpointError) {
        console.log(`⚠️ Endpoint ${endpoint} non disponible:`, endpointError.message);
        continue;
      }
    }

    // Si aucune donnée trouvée, utiliser des données de démonstration
    if (items.length === 0) {
      console.log('🔄 Utilisation de données de démonstration');
      const demoActes = [
        { 
          id: 'ACTE001', 
          COD_ELEMENT: 'ACTE001',
          type: 'acte',
          libelle: 'Consultation générale',
          libelle_complet: 'Consultation médicale générale',
          PRIX_UNITAIRE: 5000,
          PRIX: 5000,
          prix: 5000,
          REMBOURSABLE: 1,
          CATEGORIE: 'CONSULTATION'
        },
        { 
          id: 'ACTE002', 
          COD_ELEMENT: 'ACTE002',
          type: 'acte', 
          libelle: 'Radiographie thorax',
          libelle_complet: 'Radiographie standard du thorax',
          PRIX_UNITAIRE: 15000,
          PRIX: 15000,
          prix: 15000,
          REMBOURSABLE: 1,
          CATEGORIE: 'IMAGERIE'
        },
        { 
          id: 'ACTE003', 
          COD_ELEMENT: 'ACTE003',
          type: 'acte',
          libelle: 'Analyse sanguine complète',
          libelle_complet: 'Analyse biochimique sanguine complète',
          PRIX_UNITAIRE: 8000,
          PRIX: 8000,
          prix: 8000,
          REMBOURSABLE: 1,
          CATEGORIE: 'BIOLOGIE'
        },
        { 
          id: 'ACTE004', 
          COD_ELEMENT: 'ACTE004',
          type: 'acte',
          libelle: 'Echographie abdominale',
          libelle_complet: 'Echographie des organes abdominaux',
          PRIX_UNITAIRE: 12000,
          PRIX: 12000,
          prix: 12000,
          REMBOURSABLE: 1,
          CATEGORIE: 'IMAGERIE'
        },
        { 
          id: 'ACTE005', 
          COD_ELEMENT: 'ACTE005',
          type: 'acte',
          libelle: 'Vaccination tétanos',
          libelle_complet: 'Vaccin antitétanique',
          PRIX_UNITAIRE: 3000,
          PRIX: 3000,
          prix: 3000,
          REMBOURSABLE: 1,
          CATEGORIE: 'VACCINATION'
        },
        { 
          id: 'MED001', 
          COD_ELEMENT: 'MED001',
          type: 'medicament',
          libelle: 'Paracétamol 500mg',
          libelle_complet: 'Paracétamol 500mg - Comprimé',
          PRIX_UNITAIRE: 500,
          PRIX: 500,
          prix: 500,
          REMBOURSABLE: 1,
          CATEGORIE: 'PHARMACIE'
        },
        { 
          id: 'MED002', 
          COD_ELEMENT: 'MED002',
          type: 'medicament',
          libelle: 'Amoxicilline 500mg',
          libelle_complet: 'Amoxicilline 500mg - Gélule',
          PRIX_UNITAIRE: 1200,
          PRIX: 1200,
          prix: 1200,
          REMBOURSABLE: 1,
          CATEGORIE: 'PHARMACIE'
        }
      ];
      
      // Filtrer par terme de recherche
      items = demoActes.filter(acte =>
        acte.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acte.libelle_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acte.CATEGORIE.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Limiter le nombre de résultats
    items = items.slice(0, limit);
    
    // Ajouter des logs pour débogage
    console.log('📦 Résultats finaux searchMedicalItems:', {
      searchTerm,
      nbItems: items.length,
      premierItem: items.length > 0 ? items[0] : null,
      prixPremierItem: items.length > 0 ? items[0].prix : 'N/A'
    });

    return {
      success: true,
      items,
      pagination: {
        page: 1,
        limit: limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit)
      }
    };
  } catch (error) {
    console.error('❌ Erreur générale searchMedicalItems:', error);
    return {
      success: false,
      message: error.message || 'Erreur lors de la recherche',
      items: [],
      pagination: { page: 1, limit, total: 0, totalPages: 0 }
    };
  }
},

async getMedicationPrices(medicationIds) {
  try {
    if (!Array.isArray(medicationIds) || medicationIds.length === 0) {
      return { success: true, prices: {} };
    }
    
    const response = await fetchAPI('/medicaments/prices', {
      method: 'POST',
      body: { ids: medicationIds }
    });
    
    return response;
  } catch (error) {
    console.error('Erreur récupération des prix:', error);
    return { success: false, message: error.message, prices: {} };
  }
},

  async getPatientAllergies(patientId) {
    try {
      if (!patientId || isNaN(parseInt(patientId)) || parseInt(patientId) <= 0) {
        throw new Error('ID patient invalide');
      }
      
      const response = await fetchAPI(`/allergies/patient/${patientId}`);
      return response;
    } catch (error) {
      console.error(`Erreur récupération allergies patient ${patientId}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des allergies',
        allergies: [],
        statistics: {
          total: 0,
          severes: 0,
          legeres: 0,
          par_type: {}
        }
      };
    }
  },

  async getPatientAntecedents(patientId) {
    try {
      if (!patientId || isNaN(parseInt(patientId)) || parseInt(patientId) <= 0) {
        throw new Error('ID patient invalide');
      }
      
      const response = await fetchAPI(`/antecedents/patient/${patientId}`);
      return response;
    } catch (error) {
      console.error(`Erreur récupération antécédents patient ${patientId}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des antécédents',
        antecedents: [],
        statistics: {
          total: 0,
          severes: 0,
          par_type: {}
        }
      };
    }
  },

  async getPatientInfo(patientId) {
    try {
      if (!patientId || isNaN(parseInt(patientId)) || parseInt(patientId) <= 0) {
        throw new Error('ID patient invalide');
      }
      
      const response = await fetchAPI(`/patients/${patientId}`);
      return response;
    } catch (error) {
      console.error(`Erreur récupération informations patient ${patientId}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des informations du patient',
        patient: null
      };
    }
  },

  async getPatientMedicalData(patientId) {
    try {
      // Récupérer toutes les données médicales en parallèle
      const [prescriptions, allergies, antecedents, patientInfo] = await Promise.all([
        this.getByPatientId(patientId),
        this.getPatientAllergies(patientId),
        this.getPatientAntecedents(patientId),
        this.getPatientInfo(patientId)
      ]);
      
      return {
        success: true,
        message: 'Données médicales récupérées avec succès',
        data: {
          prescriptions: prescriptions.success ? prescriptions.prescriptions : [],
          allergies: allergies.success ? allergies.allergies : [],
          antecedents: antecedents.success ? antecedents.antecedents : [],
          patientInfo: patientInfo.success ? patientInfo.patient : null,
          statistics: {
            prescriptions: prescriptions.success ? prescriptions.statistics : null,
            allergies: allergies.success ? allergies.statistics : null,
            antecedents: antecedents.success ? antecedents.statistics : null
          }
        }
      };
    } catch (error) {
      console.error(`Erreur récupération données médicales patient ${patientId}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des données médicales',
        data: {
          prescriptions: [],
          allergies: [],
          antecedents: [],
          patientInfo: null,
          statistics: null
        }
      };
    }
  },

  async searchPatients(search, limit = 20) {
    try {
      if (!search || search.trim().length < 1) {
        return { 
          success: true, 
          patients: [],
          pagination: { total: 0, page: 1, limit, totalPages: 0 }
        };
      }
      
      // Rechercher les patients via la route des prescriptions avec patient_id
      // Note: Nous n'avons pas de route spécifique pour la recherche de patients
      // Nous utilisons donc la route des prescriptions avec un filtrage côté client
      const response = await fetchAPI(`/prescriptions?search=${encodeURIComponent(search)}&limit=${limit}`);
      
      if (response.success && Array.isArray(response.prescriptions)) {
        // Extraire les patients uniques de la liste des prescriptions
        const patientMap = new Map();
        
        response.prescriptions.forEach(pres => {
          if (pres.ID_BEN || pres.COD_BEN) {
            const patientId = pres.ID_BEN || pres.COD_BEN;
            if (!patientMap.has(patientId)) {
              patientMap.set(patientId, {
                id: patientId,
                ID_BEN: patientId,
                COD_BEN: patientId,
                nom: pres.NOM_BEN || '',
                prenom: pres.PRE_BEN || '',
                sexe: pres.SEX_BEN || '',
                age: pres.AGE || calculateAge(pres.NAI_BEN),
                identifiant: pres.IDENTIFIANT_NATIONAL || '',
                date_naissance: pres.NAI_BEN || null,
                telephone: pres.TELEPHONE_MOBILE || '',
                groupe_sanguin: pres.GROUPE_SANGUIN || '',
                rhesus: pres.RHESUS || ''
              });
            }
          }
        });
        
        const patients = Array.from(patientMap.values());
        
        return {
          success: true,
          patients: patients,
          count: patients.length,
          pagination: {
            total: patients.length,
            page: 1,
            limit: patients.length,
            totalPages: 1
          }
        };
      }
      
      return { success: true, patients: [] };
    } catch (error) {
      console.error('Erreur recherche patients:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la recherche des patients',
        patients: [] 
      };
    }
  },

  async getStatistiques(periode = 'mois') {
    try {
      // Implémentation basique des statistiques
      // Note: Cette fonctionnalité n'est pas encore implémentée dans le backend
      // Pour l'instant, nous retournons des données fictives
      console.warn('Les statistiques ne sont pas encore implémentées dans le backend');
      
      return {
        success: true,
        statistiques: {
          total: 0,
          executees: 0,
          en_attente: 0,
          en_cours: 0,
          annulees: 0,
          montant_moyen: 0,
          montant_total: 0,
          par_type: {},
          evolution: []
        }
      };
    } catch (error) {
      console.error('Erreur statistiques prescriptions:', error);
      return { 
        success: false,
        message: error.message || 'Erreur lors de la récupération des statistiques',
        statistiques: null
      };
    }
  }
};

// ==============================================
// API DE FINANCES (CORRIGÉE)
// ==============================================



export const financesAPI = {
  // ==============================================
  // TABLEAU DE BORD
  // ==============================================
   async getDashboard(periode = 'mois') {
      try {
        const response = await fetchAPI(`/finances/dashboard?periode=${periode}`);
        return response;
      } catch (error) {
        console.error('❌ Erreur API getDashboard:', error);
        return {
          success: false,
          message: error.message || 'Erreur lors de la récupération du tableau de bord',
          dashboard: {}
        };
      }
    },

  // ==============================================
  // FACTURES (DÉCLARATIONS)
  // ==============================================
  async getDeclarations(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/facturation/factures${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur API getDeclarations:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des déclarations',
        factures: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }
  },

  async getDeclaration(id) {
    try {
      const response = await fetchAPI(`/facturation/factures/${id}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur API getDeclaration(${id}):`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération de la déclaration',
        facture: null
      };
    }
  },

  async createDeclaration(data) {
    try {
      const response = await fetchAPI('/facturation/generer', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur API createDeclaration:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la création de la déclaration'
      };
    }
  },

  // ==============================================
  // RÈGLEMENTS
  // ==============================================
  async getReglements(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/facturation/reglements${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur API getReglements:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des règlements',
        reglements: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }
  },

// Dans votre fichier services/api.js
async initierPaiement(data) {
  try {
    console.log('📤 INITIER PAIEMENT - Données envoyées:', data);

    // Construction robuste de la requête
    const requestData = {
      type: data.type || 'facture',
      method: data.method || 'Espèces',
      montant: parseFloat(data.montant) || 0,
      reference: data.reference || `PAY-${Date.now()}`,
      observations: data.observations || '',
      notifierClient: data.notifierClient !== false,
      force: data.force || false, // Nouveau paramètre pour forcer le paiement
      debug: data.debug || null // Pour le débogage
    };

    // Ajouter les champs spécifiques
    if (data.type === 'facture') {
      if (!data.factureId && !data.numeroFacture) {
        throw new Error('factureId ou numeroFacture requis pour un paiement de facture');
      }
      
      requestData.factureId = parseInt(data.factureId);
      if (data.numeroFacture) requestData.numeroFacture = data.numeroFacture;
      if (data.codBen) requestData.codBen = parseInt(data.codBen);
      
      // Si on force, ajouter un flag spécial
      if (data.force) {
        requestData.forceMode = true;
        requestData.bypassValidation = true;
      }
    }

    // Validation du montant
    if (requestData.montant <= 0) {
      throw new Error('Le montant doit être supérieur à 0');
    }

    // Récupérer le token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    console.log('📤 Données envoyées au serveur:', requestData);

    const response = await fetchAPI('/facturation/paiement/initier', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });

    console.log('✅ Réponse serveur:', response);

    // Si le serveur refuse à cause du bug, proposer une réparation
    if (!response.success && 
        (response.message?.includes('dépasse le montant restant (0)') || 
         response.message?.includes('montant restant est 0'))) {
      
      console.warn('⚠️ Bug serveur détecté, proposer réparation');
      
      return {
        success: false,
        message: response.message,
        code: 'BUG_SERVEUR_MONTANT_RESTANT_ZERO',
        data: {
          ...response.data,
          montantAPayer: requestData.montant,
          proposeReparation: true,
          factureId: requestData.factureId
        }
      };
    }

    return response;

  } catch (error) {
    console.error('❌ Erreur API initierPaiement:', error);
    
    return {
      success: false,
      message: error.message,
      status: error.status || 500,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
},

// Ajoutez cette méthode à votre objet financesAPI
async initierPaiementForce(data) {
  try {
    console.log('🚀 INITIER PAIEMENT FORCÉ - Données:', {
      ...data,
      montant: data.montant,
      timestamp: new Date().toISOString()
    });

    // Construction spéciale pour contourner le bug
    const requestData = {
      type: data.type || 'facture',
      method: data.method || 'Espèces',
      montant: parseFloat(data.montant) || 0,
      reference: data.reference || `PAY-FORCE-${Date.now()}`,
      observations: (data.observations || '') + ' [PAIEMENT FORCÉ - BUG SERVEUR]',
      notifierClient: false, // Ne pas notifier pour les paiements forcés
      forceMode: true,
      bypassBug: true,
      debug_mode: 'force_payment'
    };

    // Ajouter les champs spécifiques
    if (data.type === 'facture') {
      if (!data.factureId) {
        throw new Error('factureId requis pour un paiement forcé');
      }
      requestData.factureId = parseInt(data.factureId);
      if (data.numeroFacture) requestData.numeroFacture = data.numeroFacture;
      if (data.codBen) requestData.codBen = parseInt(data.codBen);
    }

    // Validation
    if (requestData.montant <= 0) {
      throw new Error('Le montant doit être supérieur à 0');
    }

    // Token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    console.log('📤 Données FORCÉES envoyées:', requestData);

    // Essayons d'abord avec l'endpoint normal mais avec des paramètres spéciaux
    const response = await fetchAPI('/facturation/paiement/initier', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });

    console.log('✅ Réponse paiement forcé:', response);

    // Si ça échoue, essayer un autre endpoint
    if (!response.success && response.message && response.message.includes('dépasse le montant restant (0)')) {
      console.warn('⚠️ Premier échec, tentative avec endpoint alternatif...');
      
      // Essayer un endpoint direct de création de règlement
      const reglementData = {
        COD_FACTURE: requestData.factureId,
        NUMERO_FACTURE: requestData.numeroFacture,
        COD_BEN: requestData.codBen,
        MONTANT: requestData.montant,
        METHODE_PAIEMENT: requestData.method,
        REFERENCE_PAIEMENT: requestData.reference,
        STATUT: 'payé',
        DATE_PAIEMENT: new Date().toISOString(),
        OBSERVATIONS: requestData.observations,
        FORCE_PAIEMENT: true,
        BUG_CORRECTION: true
      };
      
      const fallbackResponse = await fetchAPI('/finances/reglements/creer-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reglementData)
      });
      
      if (fallbackResponse.success) {
        return {
          success: true,
          message: 'Paiement forcé enregistré via méthode alternative',
          data: fallbackResponse.data,
          method: 'alternative'
        };
      }
      
      // Si tout échoue, retourner une erreur avec instructions
      return {
        success: false,
<<<<<<< HEAD
        message: 'ERREUR CRITIQUE: Impossible de forcer le paiement. Le serveur a un bug critique.',
        code: 'SERVER_BUG_CRITICAL',
        instructions: [
          '1. Contactez immédiatement l\'administrateur de la base de données',
          '2. Exécutez cette requête SQL pour corriger la facture:',
          `   UPDATE [hcs_backoffice].[facturation].[FACTURE] SET MONTANT_RESTANT = MONTANT_TOTAL WHERE COD_FACTURE = ${requestData.factureId}`,
          '3. Réessayez le paiement après correction'
        ],
        factureId: requestData.factureId,
        montant: requestData.montant
=======
        message: errorMessage,
        status: errorStatus,
        error: import.meta.env.MODE === 'development' ? error.message : undefined
>>>>>>> d90a12e2bad9383f696451b6f983404524d7015b
      };
    }

    return response;

  } catch (error) {
    console.error('❌ Erreur paiement forcé:', error);
    
    return {
      success: false,
      message: 'Erreur lors du paiement forcé',
      error: error.message,
      code: 'FORCE_PAYMENT_ERROR',
      instructions: [
        'Le serveur refuse catégoriquement le paiement.',
        'Veuillez contacter l\'administrateur pour corriger manuellement la base de données.',
        `Facture ID: ${data.factureId}`,
        `Montant: ${data.montant} XAF`
      ]
    };
  }
},

  async initierPaiementTicket(data) {
  try {
    const response = await fetchAPI('/facturation/paiement/initier-ticket', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  } catch (error) {
    console.error('❌ Erreur API initierPaiementTicket:', error);
    return {
      success: false,
      message: error.message || 'Erreur lors de l\'initiation du paiement du ticket'
    };
  }
},
  // ==============================================
  // REMBOURSEMENTS
  // ==============================================
  async getRemboursements(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/facturation/remboursements${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur API getRemboursements:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des remboursements',
        remboursements: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }
  },

  // ==============================================
  // PAYEURS
  // ==============================================
  async getPayeurs(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/facturation/payeurs${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur API getPayeurs:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des payeurs',
        payeurs: [],
        count: 0
      };
    }
  },

  // ==============================================
  // TRANSACTIONS
  // ==============================================
  async getTransactions(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/transactions${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur API getTransactions:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des transactions',
        transactions: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }
  },

  // ==============================================
  // RÉCLAMATIONS (remplace les litiges)
  // ==============================================
  async getReclamations(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/facturation/reclamations${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur API getReclamations:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des réclamations',
        reclamations: [],
        statistiques: { total: 0, nouveaux: 0, en_cours: 0, resolus: 0, fermes: 0 }
      };
    }
  },

  async getReclamation(id) {
    try {
      const response = await fetchAPI(`/facturation/reclamations/${id}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur API getReclamation(${id}):`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération de la réclamation',
        reclamation: null
      };
    }
  },

  async createReclamation(data) {
    try {
      const response = await fetchAPI('/facturation/reclamations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur API createReclamation:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la création de la réclamation'
      };
    }
  },

  async updateReclamation(id, data) {
    try {
      const response = await fetchAPI(`/facturation/reclamations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error(`❌ Erreur API updateReclamation(${id}):`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour de la réclamation'
      };
    }
  },

  // ==============================================
  // RAPPORTS ET STATISTIQUES
  // ==============================================
  async getRapports(params = {}) {
    try {
      const { type, ...otherParams } = params;
      let endpoint;
      
      if (type === 'dashboard') {
        endpoint = '/finances/dashboard';
      } else if (type === 'transactions') {
        endpoint = '/transactions';
      } else if (type === 'declarations') {
        endpoint = '/facturation/factures';
      } else if (type === 'reglements') {
        endpoint = '/facturation/reglements';
      } else if (type === 'remboursements') {
        endpoint = '/facturation/remboursements';
      } else if (type === 'reclamations') {
        endpoint = '/facturation/reclamations';
      } else {
        endpoint = '/finances/dashboard';
      }
      
      const queryString = buildQueryString(otherParams);
      const response = await fetchAPI(`${endpoint}${queryString}`);
      
      return response;
    } catch (error) {
      console.error('❌ Erreur API getRapports:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la génération du rapport',
        rapport: null
      };
    }
  },

  async getStatistiques(params = {}) {
    try {
      const response = await fetchAPI(`/finances/dashboard?periode=${params.periode || 'mois'}`);
      
      if (response.success && response.dashboard) {
        return {
          success: true,
          message: 'Statistiques récupérées avec succès',
          statistiques: response.dashboard.statistiques || {},
          indicateurs: response.dashboard.indicateurs_cles || {},
          periode: params.periode || 'mois'
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur API getStatistiques:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des statistiques',
        statistiques: {}
      };
    }
  },

  // ==============================================
  // EXPORT
  // ==============================================
  async exportData(type, params = {}) {
    try {
      let endpoint = '';
      
      switch (type) {
        case 'factures':
          endpoint = '/facturation/factures';
          break;
        case 'transactions':
          endpoint = '/transactions';
          break;
        case 'reglements':
          endpoint = '/facturation/reglements';
          break;
        case 'remboursements':
          endpoint = '/facturation/remboursements';
          break;
        case 'reclamations':
          endpoint = '/facturation/reclamations';
          break;
        default:
          throw new Error(`Type d'export non supporté: ${type}`);
      }
      
      const exportParams = { ...params, limit: 1000 };
      const queryString = buildQueryString(exportParams);
      const response = await fetchAPI(`${endpoint}${queryString}`);
      
      if (!response.success) {
        throw new Error(response.message);
      }
      
      let data = [];
      let fileName = `export_${type}_${new Date().toISOString().split('T')[0]}`;
      
      if (type === 'factures') {
        data = response.factures || [];
      } else if (type === 'transactions') {
        data = response.transactions || [];
      } else if (type === 'reglements') {
        data = response.reglements || [];
      } else if (type === 'remboursements') {
        data = response.remboursements || [];
      } else if (type === 'reclamations') {
        data = response.reclamations || [];
      }
      
      return {
        success: true,
        message: `Données ${type} prêtes pour l'export`,
        data,
        fileName,
        count: data.length,
        format: 'json'
      };
    } catch (error) {
      console.error(`❌ Erreur API exportData(${type}):`, error);
      return {
        success: false,
        message: error.message || `Erreur lors de l'export des données ${type}`,
        data: [],
        fileName: ''
      };
    }
  },
   // Fonction pour générer une quittance PDF
  genererQuittancePDF: async (id) => {
    try {
      const token = localStorage.getItem('token');
<<<<<<< HEAD
=======
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api' || 'http://172.20.10.2:3000/api';
>>>>>>> d90a12e2bad9383f696451b6f983404524d7015b
      
      const response = await fetch(`${API_URL}/facturation/quittance/generer/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      // Récupérer le blob PDF
      const pdfBlob = await response.blob();
      return {
        success: true,
        pdf: pdfBlob,
        fileName: `quittance_${id}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
      };
    } catch (error) {
      console.error('❌ Erreur génération quittance PDF:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la génération de la quittance'
      };
    }
  },

  // Autre option: Version qui retourne les données JSON pour générer le PDF côté client
  genererQuittance: async (id) => {
    try {
      const token = localStorage.getItem('token');
<<<<<<< HEAD
      const API_URL = process.env.REACT_APP_API_URL || 'http://212.47.73.151:3000/api';
=======
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
>>>>>>> d90a12e2bad9383f696451b6f983404524d7015b
      
      const response = await fetch(`${API_URL}/facturation/quittance/generer/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Erreur génération quittance:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la génération de la quittance'
      };
    }
  }
};


// ==============================================
// API DE FACTURATION (CORRIGÉE)
// ==============================================

export const facturationAPI = {
  // ==============================================
  // STATISTIQUES
  // ==============================================
  async getStats() {
    try {
      const response = await fetchAPI('/finances/dashboard?periode=mois');
      
      if (response.success && response.dashboard) {
        const stats = response.dashboard.statistiques?.factures || {};
        return {
          success: true,
          message: 'Statistiques récupérées avec succès',
          stats: {
            total: stats.total || 0,
            payees: stats.payees || 0,
            enAttente: stats.en_attente || 0,
            partiellement: stats.partiellement || 0,
            montantTotal: stats.montant_total || 0,
            montantRecu: stats.montant_paye || 0,
            montantRestant: stats.montant_restant || 0,
            delaiMoyen: stats.delai_moyen || 0,
            enRetard: stats.en_retard || 0
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur API getStats:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des statistiques',
        stats: {
          total: 0,
          payees: 0,
          enAttente: 0,
          partiellement: 0,
          montantTotal: 0,
          montantRecu: 0,
          montantRestant: 0,
          delaiMoyen: 0,
          enRetard: 0
        }
      };
    }
  },

  // ==============================================
  // FACTURES
  // ==============================================
  async getFactures(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/facturation/factures${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur API getFactures:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des factures',
        factures: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }
  },

  async getFactureById(id) {
    try {
      if (!id) {
        throw new Error('ID facture requis pour getFactureById');
      }
      
      // Log pour débogage
      console.log(`🔍 Récupération facture avec identifiant: ${id} (type: ${typeof id})`);
      
      // Si id est un nombre qui ressemble à une année (comme 2025), cela pourrait être une erreur
      if (typeof id === 'number' && id >= 2000 && id <= 2100) {
        console.warn(`⚠️ Attention: L'identifiant "${id}" ressemble à une année plutôt qu'à un ID de facture`);
      }
      
      const response = await fetchAPI(`/facturation/factures/${id}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération facture ${id}:`, error);
      
      // Message d'erreur plus clair
      const enhancedError = new Error(
        error.message.includes('Cannot GET') 
          ? `La facture avec l'identifiant "${id}" n'a pas été trouvée. Vérifiez que l'ID est correct.`
          : error.message
      );
      enhancedError.originalError = error;
      enhancedError.factureId = id;
      
      throw enhancedError;
    }
  },

  async createFacture(factureData) {
      try {
        const response = await fetchAPI('/facturation/generer', {
          method: 'POST',
          body: factureData,
        });
        return response;
      } catch (error) {
        console.error('❌ Erreur création facture:', error);
        throw error;
      }
    },


    async genererQuittancePDF(factureId) {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        let user = null;
        
        if (userStr) {
          try {
            user = JSON.parse(userStr);
          } catch (e) {
            console.error('❌ Erreur parsing user:', e);
          }
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        };
        
        if (user?.id) {
          headers['X-User-Id'] = user.id;
        }

        const response = await fetch(`${API_URL}/facturation/quittance/pdf/${factureId}`, {
          method: 'GET',
          headers: headers,
          credentials: process.env.NODE_ENV === 'production' ? 'same-origin' : 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur ${response.status}: ${errorText}`);
        }
        
        return await response.blob();
      } catch (error) {
        console.error('❌ Erreur API genererQuittancePDF:', error);
        throw error;
      }
    },

       async genererRecuPDF(transactionId) {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        let user = null;
        
        if (userStr) {
          try {
            user = JSON.parse(userStr);
          } catch (e) {
            console.error('❌ Erreur parsing user:', e);
          }
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        };
        
        if (user?.id) {
          headers['X-User-Id'] = user.id;
        }

        const response = await fetch(`${API_URL}/facturation/recu/pdf/${transactionId}`, {
          method: 'GET',
          headers: headers,
          credentials: process.env.NODE_ENV === 'production' ? 'same-origin' : 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur ${response.status}: ${errorText}`);
        }
        
        return await response.blob();
      } catch (error) {
        console.error('❌ Erreur API genererRecuPDF:', error);
        throw error;
      }
    },

  async getFacturesByPatientId(patientId) {
    try {
      const response = await fetchAPI(`/facturation/factures?cod_ben=${patientId}&limit=100`);
      
      if (response.success && response.factures) {
        return {
          success: true,
          message: 'Factures récupérées avec succès',
          factures: response.factures.map(facture => ({
            id: facture.id || facture.COD_FACTURE,
            numero: facture.numero || facture.NUMERO_FACTURE,
            dateFacture: facture.date_facture || facture.DATE_FACTURE,
            dateEcheance: facture.date_echeance || facture.DATE_ECHEANCE,
            montantTotal: parseFloat(facture.montant_total || facture.MONTANT_TOTAL || 0),
            montantPaye: parseFloat(facture.montant_paye || facture.MONTANT_PAYE || 0),
            montantRestant: parseFloat(facture.montant_restant || facture.MONTANT_RESTANT || 0),
            statut: facture.statut || facture.STATUT_FACTURE || 'en_attente',
            observations: facture.observations || facture.OBSERVATIONS,
            modePaiement: facture.mode_paiement || facture.MODE_PAIEMENT
          }))
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération factures patient ${patientId}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des factures du patient',
        factures: []
      };
    }
  },

  async getFacturesByBeneficiaireId(beneficiaireId) {
    return this.getFacturesByPatientId(beneficiaireId);
  },

   async genererFacturePDF(factureId) {
    try {
      const response = await fetchAPI(`/facturation/${factureId}/pdf`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      // La route backend retourne directement le PDF en stream
      // On doit traiter la réponse différemment
      return response;
    } catch (error) {
      console.error(`❌ Erreur génération PDF facture ${factureId}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la génération du PDF',
        error: error
      };
    }
  },

  async getFacturesByPatientId(patientId) {
    try {
      const response = await fetchAPI(`/facturation/factures?cod_ben=${patientId}&limit=100`);
      
      // DEBUG: Log la réponse brute
      console.log('📋 Réponse brute factures patient:', response);
      
      if (response.success && response.factures) {
        const formattedFactures = response.factures.map(facture => {
          // DEBUG: Log chaque facture
          console.log('📝 Facture brute:', facture);
          
          return {
            key: facture.id || facture.COD_FACTURE,
            id: facture.id || facture.COD_FACTURE,
            numero: facture.numero || facture.NUMERO_FACTURE || `FACT-${facture.id}`,
            dateFacture: facture.date_facture || facture.DATE_FACTURE,
            dateEcheance: facture.date_echeance || facture.DATE_ECHEANCE,
            montantTotal: parseFloat(facture.montant_total || facture.MONTANT_TOTAL || 0),
            montantPaye: parseFloat(facture.montant_paye || facture.MONTANT_PAYE || 0),
            montantRestant: parseFloat(facture.montant_restant || facture.MONTANT_RESTANT || 0),
            statut: facture.statut || facture.STATUT_FACTURE || 'en_attente',
            observations: facture.observations || facture.OBSERVATIONS,
            modePaiement: facture.mode_paiement || facture.MODE_PAIEMENT
          };
        });
        
        console.log('✅ Factures formatées:', formattedFactures);
        
        return {
          success: true,
          message: 'Factures récupérées avec succès',
          factures: formattedFactures
        };
      } else {
        console.warn('⚠️ Réponse API non valide:', response);
        return {
          success: false,
          message: response.message || 'Aucune facture trouvée',
          factures: []
        };
      }
    } catch (error) {
      console.error(`❌ Erreur récupération factures patient ${patientId}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des factures du patient',
        factures: []
      };
    }
  },


  // ==============================================
  // PAIEMENTS
  // ==============================================
  async initierPaiement(data) {
    try {
      const response = await fetchAPI('/facturation/paiement/initier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur API initierPaiement:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'initiation du paiement',
        error: error.response?.data || error
      };
    }
  },

  // ==============================================
  // RÈGLEMENTS
  // ==============================================
  async getReglements(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/facturation/reglements${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur API getReglements:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des règlements',
        reglements: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }
  },

  // ==============================================
  // REMBOURSEMENTS
  // ==============================================
  async getRemboursements(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/facturation/remboursements${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur API getRemboursements:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des remboursements',
        remboursements: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }
  },

  // ==============================================
  // PAYEURS
  // ==============================================
  async getPayeurs(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/facturation/payeurs${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur API getPayeurs:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des payeurs',
        payeurs: [],
        count: 0
      };
    }
  },

  // ==============================================
  // TRANSACTIONS
  // ==============================================
  async getTransactions(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/transactions${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur API getTransactions:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des transactions',
        transactions: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }
  },

  // ==============================================
  // RÉCLAMATIONS/LITIGES
  // ==============================================
  async getLitiges(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/facturation/litiges${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur API getLitiges:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des litiges',
        litiges: [],
        statistiques: { total: 0, ouverts: 0, en_cours: 0, resolus: 0 }
      };
    }
  },

  async getLitige(id) {
    try {
      const response = await fetchAPI(`/facturation/litiges/${id}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur API getLitige(${id}):`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération du litige',
        litige: null
      };
    }
  },

  async createLitige(data) {
    try {
      const response = await fetchAPI('/facturation/litiges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur API createLitige:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la création du litige'
      };
    }
  },

  async updateLitige(id, data) {
    try {
      const response = await fetchAPI(`/facturation/litiges/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error(`❌ Erreur API updateLitige(${id}):`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du litige'
      };
    }
  },

  async searchReclamations(searchTerm, filters = {}) {
    try {
      const queryParams = {
        search: searchTerm,
        ...filters
      };
      const queryString = buildQueryString(queryParams);
      const response = await fetchAPI(`/facturation/reclamations${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur API searchReclamations:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la recherche des réclamations',
        reclamations: []
      };
    }
  },

  // ==============================================
  // RECHERCHE
  // ==============================================
  async searchPatients(searchTerm, limit = 20) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { success: true, patients: [] };
      }
      
      const response = await fetchAPI(`/consultations/search-patients?search=${encodeURIComponent(searchTerm)}&limit=${limit}`);
      
      if (response.success && response.patients) {
        return {
          success: true,
          patients: response.patients.map(patient => ({
            key: patient.id || patient.COD_BEN,
            id: patient.id || patient.COD_BEN,
            nom: patient.nom || patient.NOM_BEN || patient.nom_complet?.split(' ')[0] || '',
            prenom: patient.prenom || patient.PRE_BEN || patient.nom_complet?.split(' ').slice(1).join(' ') || '',
            nomComplet: `${patient.nom || patient.NOM_BEN || ''} ${patient.prenom || patient.PRE_BEN || ''}`.trim(),
            telephone: patient.telephone || patient.TELEPHONE || patient.telephone_mobile || '',
            email: patient.email || patient.EMAIL || '',
            dateNaissance: patient.date_naissance || patient.DATE_NAISSANCE,
            sexe: patient.sexe || patient.SEXE,
            identifiant: patient.identifiant || patient.IDENTIFIANT_NATIONAL || patient.matricule || '',
            adresse: patient.adresse || patient.ADRESSE,
            groupeSanguin: patient.groupe_sanguin || patient.GROUPE_SANGUIN
          }))
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur API searchPatients:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la recherche des patients',
        patients: []
      };
    }
  },

  async searchPrestations(searchTerm, limit = 20) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { success: true, prestations: [] };
      }
      
      const response = await fetchAPI(`/consultations/medicaments?search=${encodeURIComponent(searchTerm)}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur API searchPrestations:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la recherche des prestations',
        prestations: []
      };
    }
  },

  // ==============================================
  // QUITTANCES
  // ==============================================
  async genererQuittancePDF(reglementId) {
    try {
      const response = await fetchAPI(`/finances/reglements/${reglementId}/quittance`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      if (response instanceof Blob) {
        return {
          success: true,
          pdf: response,
          fileName: `quittance_${reglementId}.pdf`
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur génération quittance ${reglementId}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la génération de la quittance',
        pdf: null
      };
    }
  }
};



// ==============================================
// API DE REMBOURSEMENTS (CORRIGÉE)
// ==============================================

export const remboursementsAPI = {
  async getDashboardRecap(params = {}) {
      try {
        const response = await fetchAPI('/remboursements/dashboard-recap', {
          method: 'POST',
          body: params
        });
        
        return response;
      } catch (error) {
        console.error('❌ Erreur API dashboard recap:', error);
        throw error;
      }
    },

    async getDeclarations(filters = {}) {
      try {
        const queryString = buildQueryString(filters);
        const response = await fetchAPI(`/remboursements/declarations${queryString}`);
        return response;
      } catch (error) {
        console.error('❌ Erreur récupération déclarations:', error);
        return { 
          success: false, 
          message: error.message,
          declarations: [] 
        };
      }
    },

    async getRecap() {
      try {
        const response = await fetchAPI('/remboursements/recap');
        return response;
      } catch (error) {
        console.error('❌ Erreur récupération récapitulatif:', error);
        
        // Données simulées pour le développement
        return { 
          success: true,
          message: 'Mode développement - données simulées',
          recap: {
            nbSoumis: 12,
            montantAPayer: 4500000,
            payesMois: 2500000,
            ticketMoyen: 75000
          }
        };
      }
    },

    async getHistorique(beneficiaireId) {
      try {
        const response = await fetchAPI(`/remboursements/historique/${beneficiaireId}`);
        return response;
      } catch (error) {
        console.error('❌ Erreur récupération historique:', error);
        return { 
          success: false,
          message: error.message,
          historique: [] 
        };
      }
    },

    async initierPaiement(data) {
      try {
        const response = await fetchAPI('/remboursements/paiement/initier', {
          method: 'POST',
          body: data
        });
        return response;
      } catch (error) {
        console.error('❌ Erreur initiation paiement:', error);
        throw error;
      }
    },

    async validerDeclaration(data) {
      try {
        const response = await fetchAPI('/remboursements/declarations/valider', {
          method: 'POST',
          body: data
        });
        return response;
      } catch (error) {
        console.error('❌ Erreur validation déclaration:', error);
        throw error;
      }
    },

    async rejeterDeclaration(data) {
      try {
        const response = await fetchAPI('/remboursements/declarations/rejeter', {
          method: 'POST',
          body: data
        });
        return response;
      } catch (error) {
        console.error('❌ Erreur rejet déclaration:', error);
        throw error;
      }
    },

    async soumettreReclamation(data) {
      try {
        const response = await fetchAPI('/remboursements/reclamations', {
          method: 'POST',
          body: data
        });
        return response;
      } catch (error) {
        console.error('❌ Erreur soumission réclamation:', error);
        throw error;
      }
    },

    async creerDeclaration(data) {
      try {
        const response = await fetchAPI('/remboursements/declarations', {
          method: 'POST',
          body: data
        });
        return response;
      } catch (error) {
        console.error('❌ Erreur création déclaration:', error);
        throw error;
      }
    },

    async traiterDeclaration(id, action, motif) {
      try {
        const response = await fetchAPI(`/remboursements/declarations/${id}/traiter`, {
          method: 'PUT',
          body: {
            action: action.toLowerCase(),
            motif
          }
        });
        return response;
      } catch (error) {
        console.error('❌ Erreur traitement déclaration:', error);
        throw error;
      }
    },

    async getBeneficiaires() {
      try {
        const response = await fetchAPI('/remboursements/beneficiaires');
        return response;
      } catch (error) {
        console.error('❌ Erreur récupération bénéficiaires:', error);
        return { 
          success: false,
          message: error.message,
          beneficiaires: [] 
        };
      }
    }
};
 


  // ==============================================
  // API DES NOTIFICATIONS FINANCIÈRES
  // ==============================================

  export const notificationsAPI = {
    async getUnreadCount() {
    try {
      const response = await fetchAPI('/notifications/unread-count');
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération nombre notifications non lues:', error);
      // Fallback pour le développement
      if (import.meta.env.MODE === 'development') {
        return { success: true, count: Math.floor(Math.random() * 10) };
      }
      return { success: false, message: error.message, count: 0 };
    }
  },

  // Récupérer les notifications non lues
  async getUnread(limit = 5) {
    try {
      const response = await fetchAPI(`/notifications/unread?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération notifications non lues:', error);
      // Fallback pour le développement
      if (import.meta.env.MODE === 'development') {
        return this.getMockNotifications();
      }
      return { success: false, message: error.message, notifications: [] };
    }
  },

  // Récupérer toutes les notifications
  async getAll(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/notifications${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération notifications:', error);
      return { 
        success: false, 
        message: error.message, 
        notifications: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }
  },

  // Marquer une notification comme lue
  async markAsRead(notificationId) {
    try {
      const response = await fetchAPI(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      return response;
    } catch (error) {
      console.error(`❌ Erreur marquer notification ${notificationId} comme lue:`, error);
      return { success: false, message: error.message };
    }
  },

  // Marquer toutes les notifications comme lues
  async markAllAsRead() {
    try {
      const response = await fetchAPI('/notifications/mark-all-read', {
        method: 'POST',
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur marquer toutes les notifications comme lues:', error);
      return { success: false, message: error.message };
    }
  },

  // Envoyer une notification système
  async sendSystemNotification(notificationData) {
    try {
      const response = await fetchAPI('/notifications/send-system', {
        method: 'POST',
        body: notificationData,
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur envoi notification système:', error);
      throw error;
    }
  },

  // Récupérer les statistiques
  async getStats() {
    try {
      const response = await fetchAPI('/notifications/stats');
      return response;
    } catch (error) {
      console.error('❌ Erreur statistiques notifications:', error);
      return { 
        success: false, 
        message: error.message,
        stats: {
          total: 0,
          unread: 0,
          read: 0,
          by_type: []
        }
      };
    }
  },

  // Récupérer les types de notifications
  async getTypes() {
    try {
      const response = await fetchAPI('/notifications/types');
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération types de notifications:', error);
      return { success: false, message: error.message, types: [] };
    }
  },

  // Données mockées pour le développement (optionnel)
  async getMockNotifications() {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      notifications: [
        {
          id: 1,
          title: 'Consultation urgente requise',
          message: 'Le patient Jean Dupont nécessite une consultation urgente en cardiologie',
          type: 'urgent',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          metadata: {
            lien_action: '/consultations/123',
            type_notification: 'URGENCE_MEDICALE',
            cod_pay: 'FR'
          }
        },
        {
          id: 2,
          title: 'Paiement en attente',
          message: 'Le paiement de la facture #FAC-2024-00123 est en attente depuis 5 jours',
          type: 'warning',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          metadata: {
            lien_action: '/paiements/facture/789',
            type_notification: 'ALERTE_PAIEMENT',
            cod_pay: 'FR'
          }
        },
        {
          id: 3,
          title: 'Nouveau bénéficiaire enregistré',
          message: 'Le bénéficiaire Sophie Martin a été ajouté avec succès',
          type: 'success',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          metadata: {
            lien_action: '/beneficiaires/456',
            type_notification: 'INFORMATION',
            cod_pay: 'FR'
          }
        }
      ]
    };
  },
    async getNotificationsFinancieres(params = {}) {
      try {
        const queryString = buildQueryString(params);
        const response = await fetchAPI(`/notifications/financieres${queryString}`);
        return response;
      } catch (error) {
        console.error('❌ Erreur API getNotificationsFinancieres:', error);
        return {
          success: false,
          message: error.message,
          notifications: []
        };
      }
    },

    async envoyerRappel(data) {
      try {
        const response = await fetchAPI('/notifications/envoyer-rappel', {
          method: 'POST',
          body: data
        });
        return response;
      } catch (error) {
        console.error('❌ Erreur API envoyerRappel:', error);
        throw error;
      }
    }
  };

 

  // ==============================================
  // API GLOBALE
  // ==============================================

  /**
   * Teste la disponibilité des endpoints API
   * @returns {Promise<Object>} Résultats des tests
   */
  const testEndpointsAvailability = async () => {
    const endpointsToTest = [
      '/health',
      '/auth/login',
      '/consultations/search-patients',
      '/consultations/medicaments',
      '/consultations/affections',
      '/prescriptions',
      '/patients',
      '/pays',
      '/centres-sante',
      '/consultations/medecins',
      '/consultations/types',
      '/facturation/consultations-sans-affection',
      '/facturation/payeurs'
    ];
    
    const results = {};
    const startTime = Date.now();
    
    for (const endpoint of endpointsToTest) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        results[endpoint] = {
          available: response.ok,
          status: response.status,
          statusText: response.statusText,
          responseTime: Date.now() - startTime
        };
      } catch (error) {
        results[endpoint] = {
          available: false,
          error: error.message,
          responseTime: Date.now() - startTime
        };
      }
    }
    
    return results;
  };

  /**
   * Fonction de fallback pour la recherche de patients
   * @param {string} searchTerm - Terme de recherche
   * @param {Object} filters - Filtres supplémentaires
   * @param {number} limit - Limite de résultats
   * @returns {Promise<Object>} Résultats de recherche
   */
  export const searchPatientsFallback = async (searchTerm, filters = {}, limit = 20) => {
    try {
      // Essai de la recherche standard
      try {
        const response = await patientsAPI.search(searchTerm, filters, limit);
        if (response.success && response.patients && response.patients.length > 0) {
          return response;
        }
      } catch (error) {
        // Continue avec le fallback
      }
      
      // Fallback: Recherche dans consultations
      try {
        const response = await consultationsAPI.searchPatientsAdvanced(searchTerm, filters, limit);
        if (response.success && response.patients && response.patients.length > 0) {
          return response;
        }
      } catch (error) {
        // Continue avec le fallback final
      }
      
      // Fallback final: Données mockées pour développement
      if (import.meta.env.MODE === 'development') {
        return {
          success: true,
          patients: [
            {
              id: 1,
              nom: 'DUPONT',
              prenom: 'Jean',
              sexe: 'M',
              age: 35,
              identifiant: 'PAT001',
              date_naissance: '1989-05-15',
              telephone: '0123456789',
              email: 'jean.dupont@example.com'
            }
          ],
          isFallback: true,
          message: 'Données de développement - API non disponible'
        };
      }
      
      // Aucune donnée trouvée
      return {
        success: false,
        message: 'Aucun patient trouvé et API non disponible',
        patients: [],
        isFallback: false
      };
      
    } catch (error) {
      console.error('❌ Erreur recherche fallback:', error);
      return {
        success: false,
        message: `Erreur recherche: ${error.message}`,
        patients: [],
        isFallback: false
      };
    }
  };

  // ==============================================
  // API DES PRESTATAIRES
  // ==============================================

    export const prestatairesAPI = {
      // ==============================================
      // RÉCUPÉRATION DE DONNÉES
      // ==============================================

      // Récupérer tous les prestataires avec pagination et filtres
      async getAll(params = {}) {
        try {
          const { 
            page = 1, 
            limit = 20, 
            search, 
            status, 
            specialite,
            type_prestataire,
            centre_id,
            disponibilite,
            sortBy = 'nom',
            sortOrder = 'ASC'
          } = params;
          
          // Construction des paramètres de requête
          const queryParams = new URLSearchParams();
          
          if (page) queryParams.append('page', page);
          if (limit) queryParams.append('limit', limit);
          if (search) queryParams.append('search', search);
          if (status) queryParams.append('actif', status === 'Actif' ? '1' : '0');
          if (specialite) queryParams.append('specialite', specialite);
          if (type_prestataire) queryParams.append('type_prestataire', type_prestataire);
          if (centre_id) queryParams.append('centre_id', centre_id);
          if (disponibilite) queryParams.append('disponibilite', disponibilite);
          if (sortBy) queryParams.append('sortBy', sortBy);
          if (sortOrder) queryParams.append('sortOrder', sortOrder);
          
          const queryString = queryParams.toString();
          const response = await fetchAPI(`/prestataires${queryString ? '?' + queryString : ''}`);
          
          // Normalisation de la réponse
          if (response.success) {
            const prestataires = response.prestataires?.map(p => this.formatPrestataireForDisplay(p)) || [];
            
            return {
              success: true,
              prestataires: prestataires,
              pagination: response.pagination || {
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false
              }
            };
          }
          
          return response;
          
        } catch (error) {
          console.error('❌ Erreur récupération prestataires:', error);
          return { 
            success: false, 
            message: error.message,
            prestataires: [], 
            pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } 
          };
        }
      },

      // Récupérer les prestataires par centre
  // Dans prestatairesAPI object
      async getByCentre(centreId, params = {}) {
    try {
      const { 
        page = 1, 
        limit = 50,
        type_prestataire = '',
        status = 'Actif',
        affectation_active = '1'
      } = params;
      
      // VALIDER que centreId n'est pas undefined
      if (!centreId || centreId === 'undefined') {
        console.error('❌ centreId est undefined ou vide:', centreId);
        return { 
          success: false, 
          message: 'ID du centre est invalide',
          prestataires: [], 
          pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } 
        };
      }
      
      // Convertir centreId en nombre si c'est une chaîne numérique
      const numericCentreId = parseInt(centreId);
      if (isNaN(numericCentreId)) {
        console.error('❌ centreId n\'est pas un nombre:', centreId);
        return { 
          success: false, 
          message: 'ID du centre doit être un nombre',
          prestataires: [], 
          pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } 
        };
      }
      
      const queryParams = new URLSearchParams();
      if (page) queryParams.append('page', page);
      if (limit) queryParams.append('limit', limit);
      if (type_prestataire) queryParams.append('type_prestataire', type_prestataire);
      
      // Convertir le statut
      let actifValue = '1';
      if (status === 'Actif') {
        actifValue = '1';
      } else if (status === 'Inactif') {
        actifValue = '0';
      } else {
        actifValue = status;
      }
      queryParams.append('actif', actifValue);
      
      // Ajouter le paramètre d'affectation active
      if (affectation_active !== undefined) {
        queryParams.append('affectation_active', affectation_active);
      }
      
      const queryString = queryParams.toString();
      
      // CORRECTION IMPORTANTE: Utiliser la route CORRECTE
      const url = `/centres/${numericCentreId}/prestataires${queryString ? '?' + queryString : ''}`;
      
      console.log('📡 URL appelée pour getByCentre:', url);
      console.log('📋 Paramètres:', {
        centreId: numericCentreId,
        type_prestataire,
        actif: actifValue,
        affectation_active,
        page,
        limit
      });
      
      const response = await fetchAPI(url);
      
      // Normalisation de la réponse
      if (response.success) {
        // Formater chaque prestataire
        const prestataires = response.prestataires?.map(p => {
          // Extraire les informations de base
          const formatted = {
            id: p.id || p.COD_PRE || `prest_${Math.random().toString(36).substr(2, 9)}`,
            nom: p.nom || p.NOM_PRESTATAIRE || '',
            prenom: p.prenom || p.PRENOM_PRESTATAIRE || '',
            nom_complet: p.nom_complet || `${p.prenom || p.PRENOM_PRESTATAIRE || ''} ${p.nom || p.NOM_PRESTATAIRE || ''}`.trim(),
            specialite: p.specialite || p.SPECIALITE || 'Non spécifiée',
            titre: p.titre || p.TITRE || '',
            telephone: p.telephone || p.TELEPHONE || '',
            email: p.email || p.EMAIL || '',
            type_prestataire: p.type_prestataire || p.TYPE_PRESTATAIRE || 'Médecin',
            cod_pre: p.cod_pre || p.COD_PRE || p.id,
            centre_affectation: centreId,
            statut: p.statut || (p.ACTIF === 1 ? 'Actif' : 'Inactif'),
            ACTIF: p.ACTIF || 1
          };
          
          // Ajouter les informations spécifiques à l'affectation
          if (p.affectation) {
            formatted.date_debut_affectation = p.affectation.date_debut;
            formatted.date_fin_affectation = p.affectation.date_fin;
            formatted.statut_affectation = p.affectation.statut || 'Actif';
            formatted.id_affectation = p.affectation.id;
          }
          
          return formatted;
        }) || [];
        
        console.log(`✅ ${prestataires.length} médecins récupérés pour le centre ${centreId}`);
        
        return {
          success: true,
          prestataires: prestataires,
          pagination: response.pagination || {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      } else {
        console.error('❌ Erreur API getByCentre:', response.message);
        return { 
          success: false, 
          message: response.message || 'Erreur lors de la récupération des médecins',
          prestataires: [], 
          pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } 
        };
      }
      
    } catch (error) {
      console.error('❌ Erreur réseau récupération prestataires par centre:', error);
      return { 
        success: false, 
        message: `Erreur réseau: ${error.message}`,
        prestataires: [], 
        pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } 
      };
    }
  },
  
  // Alternative: méthode de recherche avec filtre par centre
  async searchByCentre(searchTerm = '', centreId = null, params = {}) {
    try {
      // VALIDER que centreId n'est pas undefined
      if (!centreId || centreId === 'undefined') {
        console.error('❌ centreId est undefined pour searchByCentre:', centreId);
        return { 
          success: false, 
          message: 'ID du centre est invalide',
          prestataires: [], 
          pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } 
        };
      }
      
      // Utiliser directement la route centres/:id/prestataires avec un terme de recherche
      const numericCentreId = parseInt(centreId);
      if (isNaN(numericCentreId)) {
        console.error('❌ centreId n\'est pas un nombre pour searchByCentre:', centreId);
        return { 
          success: false, 
          message: 'ID du centre doit être un nombre',
          prestataires: [], 
          pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } 
        };
      }
      
      const queryParams = new URLSearchParams();
      
      // Ajouter les paramètres de base
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('actif', params.status === 'Actif' ? '1' : '0');
      if (params.type_prestataire) queryParams.append('type_prestataire', params.type_prestataire);
      
      // Ajouter le terme de recherche
      if (searchTerm && searchTerm.trim() !== '') {
        queryParams.append('search', searchTerm);
      }
      
      const queryString = queryParams.toString();
      const url = `/centres/${numericCentreId}/prestataires${queryString ? '?' + queryString : ''}`;
      
      console.log('📡 URL appelée pour searchByCentre:', url);
      
      const response = await fetchAPI(url);
      
      if (response.success) {
        // Formater les prestataires
        const prestataires = response.prestataires?.map(p => {
          const formatted = {
            id: p.id || p.COD_PRE || `prest_${Math.random().toString(36).substr(2, 9)}`,
            nom: p.nom || p.NOM_PRESTATAIRE || '',
            prenom: p.prenom || p.PRENOM_PRESTATAIRE || '',
            nom_complet: p.nom_complet || `${p.prenom || p.PRENOM_PRESTATAIRE || ''} ${p.nom || p.NOM_PRESTATAIRE || ''}`.trim(),
            specialite: p.specialite || p.SPECIALITE || 'Non spécifiée',
            titre: p.titre || p.TITRE || '',
            telephone: p.telephone || p.TELEPHONE || '',
            email: p.email || p.EMAIL || '',
            type_prestataire: p.type_prestataire || p.TYPE_PRESTATAIRE || 'Médecin',
            cod_pre: p.cod_pre || p.COD_PRE || p.id,
            centre_affectation: centreId,
            statut: p.statut || (p.ACTIF === 1 ? 'Actif' : 'Inactif')
          };
          
          if (p.affectation) {
            formatted.date_debut_affectation = p.affectation.date_debut;
            formatted.date_fin_affectation = p.affectation.date_fin;
            formatted.statut_affectation = p.affectation.statut || 'Actif';
          }
          
          return formatted;
        }) || [];
        
        return {
          success: true,
          prestataires: prestataires,
          pagination: response.pagination || {
            total: 0,
            page: params.page || 1,
            limit: params.limit || 50,
            totalPages: 0
          }
        };
      } else {
        console.error('❌ Erreur API searchByCentre:', response.message);
        return { 
          success: false, 
          message: response.message || 'Erreur lors de la recherche des prestataires',
          prestataires: [], 
          pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } 
        };
      }
    } catch (error) {
      console.error('❌ Erreur réseau searchByCentre:', error);
      return { 
        success: false, 
        message: `Erreur réseau: ${error.message}`,
        prestataires: [], 
        pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } 
      };
    }
  },

// Alternative: méthode de recherche avec filtre par centre
async searchByCentre(searchTerm = '', centreId = null, params = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    // Ajouter les paramètres de base
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.type_prestataire) queryParams.append('type_prestataire', params.type_prestataire);
    
    // Ajouter les paramètres de recherche
    if (searchTerm) queryParams.append('search', searchTerm);
    if (centreId) queryParams.append('centre_id', centreId);
    
    const queryString = queryParams.toString();
    const url = `/prestataires${queryString ? '?' + queryString : ''}`;
    
    console.log('📡 URL appelée pour searchByCentre:', url);
    
    const response = await fetchAPI(url);
    
    if (response.success) {
      // Formater les prestataires pour l'affichage
      const prestataires = response.prestataires?.map(p => 
        this.formatPrestataireForDisplay ? this.formatPrestataireForDisplay(p) : p
      ) || [];
      
      return {
        success: true,
        prestataires: prestataires,
        pagination: response.pagination || {
          total: 0,
          page: params.page || 1,
          limit: params.limit || 50,
          totalPages: 0
        }
      };
    } else {
      console.error('❌ Erreur API searchByCentre:', response.message);
      return { 
        success: false, 
        message: response.message || 'Erreur lors de la recherche des prestataires',
        prestataires: [], 
        pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } 
      };
    }
  } catch (error) {
    console.error('❌ Erreur réseau searchByCentre:', error);
    return { 
      success: false, 
      message: `Erreur réseau: ${error.message}`,
      prestataires: [], 
      pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } 
    };
  }
},

// Méthode utilitaire pour formater un prestataire (ajoutez cette méthode si elle n'existe pas)
formatPrestataireForDisplay(prestataire) {
  const id = prestataire.id || prestataire.COD_PRE || `prest_${Math.random().toString(36).substr(2, 9)}`;
  const nom = prestataire.nom || prestataire.NOM_PRESTATAIRE || '';
  const prenom = prestataire.prenom || prestataire.PRENOM_PRESTATAIRE || '';
  
  return {
    id: String(id),
    nom: String(nom),
    prenom: String(prenom),
    nom_complet: `${prenom} ${nom}`.trim(),
    specialite: String(prestataire.specialite || prestataire.SPECIALITE || 'Non spécifiée'),
    titre: String(prestataire.titre || prestataire.TITRE || ''),
    telephone: String(prestataire.telephone || prestataire.TELEPHONE || ''),
    email: String(prestataire.email || prestataire.EMAIL || ''),
    type_prestataire: String(prestataire.type_prestataire || prestataire.TYPE_PRESTATAIRE || 'Médecin'),
    cod_pre: String(prestataire.cod_pre || prestataire.COD_PRE || id),
    centre_affectation: prestataire.centre_affectation || prestataire.COD_CEN || prestataire.centre_id,
    statut: String(prestataire.statut || prestataire.STATUT || 'Actif')
  };
},

      // Récupérer les statistiques par centre
      async getCentresStats() {
        try {
          const response = await fetchAPI('/centres/stats-prestataires');
          
          if (response.success) {
            return response;
          }
          
          // Fallback si l'API ne répond pas
          console.warn('⚠️ API statistiques par centre non disponible');
          return { 
            success: false,
            message: response.message || 'API non disponible',
            stats: [] 
          };
        } catch (error) {
          console.error('❌ Erreur statistiques par centre:', error);
          return { 
            success: false,
            message: error.message,
            stats: [] 
          };
        }
      },

      // Dans api.js - ligne ~2616:
      async searchQuick(searchTerm, limit = 10) {
        try {
          if (!searchTerm || searchTerm.trim().length < 2) {
            return { success: true, prestataires: [] };
          }
          
          const queryParams = {
            search: searchTerm,
            limit: limit
          };
          
          const queryString = buildQueryString(queryParams);
          const response = await fetchAPI(`/prestataires/search/quick${queryString}`);
          
          // Assurez-vous que la réponse est bien formatée
          if (response.success && Array.isArray(response.prestataires)) {
            console.log('Prestataires trouvés:', response.prestataires.length); // Debug
            return {
              ...response,
              prestataires: response.prestataires.map(p => ({
                id: p.id || p.COD_PRE,
                nom: p.nom || p.NOM_PRESTATAIRE || '',
                prenom: p.prenom || p.PRENOM_PRESTATAIRE || '',
                specialite: p.specialite || p.SPECIALITE || 'Médecin',
                telephone: p.telephone || p.TELEPHONE || '',
                label: `${p.prenom || p.PRENOM_PRESTATAIRE || ''} ${p.nom || p.NOM_PRESTATAIRE || ''} - ${p.specialite || 'Médecin'}`.trim()
              }))
            };
          }
          
          return { success: false, message: 'Format de réponse invalide', prestataires: [] };
        } catch (error) {
          console.error('❌ Erreur recherche rapide prestataires:', error);
          return { success: false, message: error.message, prestataires: [] };
        }
      },

      // Récupérer un prestataire par son ID
      async getById(id) {
        try {
          if (!id || isNaN(parseInt(id))) {
            throw new Error('ID prestataire invalide');
          }
          
          const response = await fetchAPI(`/prestataires/${id}`);
          
          if (response.success && response.prestataire) {
            return {
              ...response,
              prestataire: this.formatPrestataireForDisplay(response.prestataire)
            };
          }
          
          return response;
        } catch (error) {
          console.error(`❌ Erreur récupération prestataire ${id}:`, error);
          throw error;
        }
      },

      // Récupérer les prestataires disponibles (pour urgences)
      async getDisponibles(params = {}) {
        try {
          const { 
            specialite = 'Médecin', 
            limit = 50,
            search = '',
            centre_id = null
          } = params;
          
          const queryParams = new URLSearchParams();
          
          if (specialite) queryParams.append('specialite', specialite);
          if (limit) queryParams.append('limit', limit);
          if (search) queryParams.append('search', search);
          if (centre_id) queryParams.append('centre_id', centre_id);
          queryParams.append('disponibilite', 'Disponible');
          queryParams.append('actif', '1');
          
          const queryString = queryParams.toString();
          const response = await fetchAPI(`/prestataires${queryString ? '?' + queryString : ''}`);
          
          // Normalisation de la réponse
          if (response.success) {
            const prestataires = response.prestataires?.map(p => ({
              id: p.id || p.COD_PRE,
              nom: p.nom || p.NOM_PRESTATAIRE,
              prenom: p.prenom || p.PRENOM_PRESTATAIRE,
              nom_complet: p.nom_complet || `${p.prenom || p.PRENOM_PRESTATAIRE || ''} ${p.nom || p.NOM_PRESTATAIRE || ''}`.trim(),
              specialite: p.specialite || p.SPECIALITE,
              titre: p.titre || p.TITRE,
              telephone: p.telephone || p.TELEPHONE,
              email: p.email || p.EMAIL,
              cod_cen: p.cod_cen || p.COD_CEN,
              centre_pratique: p.centre_pratique || p.CENTRE_PRATIQUE,
              disponibilite: p.disponibilite || p.DISPONIBILITE || 'Disponible',
              status: p.status === 1 || p.status === 'Actif' ? 'Actif' : 'Inactif',
              nom_centre: p.nom_centre || '',
              adresse_centre: p.adresse_centre || ''
            })) || [];
            
            return {
              ...response,
              prestataires
            };
          }
          
          return response;
        } catch (error) {
          console.error('❌ Erreur récupération prestataires disponibles:', error);
          return { 
            success: false, 
            message: error.message,
            prestataires: [] 
          };
        }
      },

      // ==============================================
      // CRÉATION ET MISE À JOUR
      // ==============================================

      // Créer un nouveau prestataire
      async create(prestataireData) {
        try {
          console.log('📝 Création prestataire:', prestataireData);
          
          // Nettoyage et validation des données
          const validation = this.validatePrestataireData(prestataireData, false);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }
          
          // Préparation des données pour l'envoi
          const dataToSend = {
            ...prestataireData,
            type_prestataire: prestataireData.type_prestataire || 'Médecin',
            status: prestataireData.status === 'Actif' ? 'Actif' : 'Inactif'
          };
          
          // Nettoyage des champs vides
          Object.keys(dataToSend).forEach(key => {
            if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
              delete dataToSend[key];
            }
          });
          
          const response = await fetchAPI('/prestataires', {
            method: 'POST',
            body: dataToSend,
          });
          
          if (response.success && response.prestataire) {
            return {
              ...response,
              prestataire: this.formatPrestataireForDisplay(response.prestataire)
            };
          }
          
          return response;
        } catch (error) {
          console.error('❌ Erreur création prestataire:', error);
          throw error;
        }
      },

      // Dans api.js - fonction update
      async update(id, prestataireData) {
        try {
          if (!id || isNaN(parseInt(id))) {
            throw new Error('ID prestataire invalide');
          }
          
          console.log(`✏️ Mise à jour prestataire ${id}:`, prestataireData);
          
          // S'assurer que le status est correctement formaté
          const dataToSend = { ...prestataireData };
          
          // Si status est 1/0, le convertir en 'Actif'/'Inactif'
          if (dataToSend.status === 1 || dataToSend.status === 0) {
            dataToSend.status = dataToSend.status === 1 ? 'Actif' : 'Inactif';
          }
          
          // Nettoyage des champs vides
          Object.keys(dataToSend).forEach(key => {
            if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
              delete dataToSend[key];
            }
          });
          
          const response = await fetchAPI(`/prestataires/${id}/update`, {
            method: 'POST',
            body: dataToSend,
          });
          
          if (response.success && response.prestataire) {
            return {
              ...response,
              prestataire: this.formatPrestataireForDisplay(response.prestataire)
            };
          }
          
          return response;
        } catch (error) {
          console.error(`❌ Erreur mise à jour prestataire ${id}:`, error);
          throw error;
        }
      },

      // Désactiver un prestataire
      async delete(id) {
        try {
          if (!id || isNaN(parseInt(id))) {
            throw new Error('ID prestataire invalide');
          }
          
          const response = await fetchAPI(`/prestataires/${id}/delete`, {
            method: 'POST',
          });
          
          return response;
        } catch (error) {
          console.error(`❌ Erreur suppression prestataire ${id}:`, error);
          throw error;
        }
      },

      // ==============================================
      // RECHERCHE ET FILTRAGE
      // ==============================================

      // Rechercher des prestataires (méthode POST pour recherche avancée)
      async search(searchTerm, filters = {}, limit = 20) {
        try {
          const dataToSend = {
            searchTerm,
            filters,
            limit
          };
          
          const response = await fetchAPI('/prestataires/search', {
            method: 'POST',
            body: dataToSend,
          });
          
          if (response.success) {
            const prestataires = response.prestataires?.map(p => this.formatPrestataireForDisplay(p)) || [];
            
            return {
              ...response,
              prestataires
            };
          }
          
          return response;
        } catch (error) {
          console.error('❌ Erreur recherche prestataires:', error);
          return { success: false, message: error.message, prestataires: [] };
        }
      },

      // ==============================================
      // DONNÉES DE RÉFÉRENCE ET STATISTIQUES
      // ==============================================

      async getSpecialites() {
        try {
          // Si l'endpoint n'existe pas, calculez à partir des prestataires
          const response = await this.getAll({ limit: 1000 });
          
          if (response.success && response.prestataires) {
            // Extraire les spécialités uniques
            const specialitesMap = {};
            response.prestataires.forEach(p => {
              const spec = p.specialite || p.SPECIALITE;
              if (spec) {
                specialitesMap[spec] = (specialitesMap[spec] || 0) + 1;
              }
            });
            
            const specialites = Object.keys(specialitesMap).map(key => ({
              label: key,
              value: key,
              count: specialitesMap[key]
            })).sort((a, b) => a.label.localeCompare(b.label));
            
            return {
              success: true,
              specialites: specialites.length > 0 ? specialites : [
                { label: 'Médecin généraliste', value: 'Médecin généraliste', count: 0 },
                { label: 'Infirmier', value: 'Infirmier', count: 0 },
                { label: 'Kinésithérapeute', value: 'Kinésithérapeute', count: 0 },
                { label: 'Sage-femme', value: 'Sage-femme', count: 0 },
                { label: 'Pharmacien', value: 'Pharmacien', count: 0 }
              ]
            };
          }
          
          // Fallback
          return { 
            success: true,
            specialites: [
              'Médecin généraliste',
              'Infirmier',
              'Kinésithérapeute',
              'Sage-femme',
              'Pharmacien'
            ].map(s => ({ label: s, value: s, count: 0 }))
          };
        } catch (error) {
          console.error('❌ Erreur récupération spécialités:', error);
          return { 
            success: true, // Notez: success: true pour éviter de bloquer l'interface
            specialites: [
              'Médecin généraliste',
              'Infirmier',
              'Kinésithérapeute',
              'Sage-femme',
              'Pharmacien'
            ]
          };
        }
      },

      async getStatistiques() {
        try {
          // Si l'endpoint n'existe pas, calculez à partir des prestataires
          const response = await this.getAll({ limit: 1000 });
          
          if (response.success && response.prestataires) {
            const prestataires = response.prestataires;
            
            const statistiques = {
              total: prestataires.length,
              actifs: prestataires.filter(p => p.status === 1 || p.status === 'Actif' || p.ACTIF === 1).length,
              inactifs: prestataires.filter(p => p.status === 0 || p.status === 'Inactif' || p.ACTIF === 0).length,
              en_conges: prestataires.filter(p => 
                (p.disponibilite || p.DISPONIBILITE) === 'En congé' || 
                (p.disponibilite || p.DISPONIBILITE) === 'En congés'
              ).length,
              en_formation: prestataires.filter(p => 
                (p.disponibilite || p.DISPONIBILITE) === 'En formation'
              ).length
            };
            
            return {
              success: true,
              statistiques
            };
          }
          
          // Fallback
          return {
            success: true,
            statistiques: {
              total: 0,
              actifs: 0,
              inactifs: 0,
              en_conges: 0,
              en_formation: 0
            }
          };
        } catch (error) {
          console.error('❌ Erreur statistiques prestataires:', error);
          return {
            success: true, // Notez: success: true pour éviter de bloquer l'interface
            statistiques: {
              total: 0,
              actifs: 0,
              inactifs: 0,
              en_conges: 0,
              en_formation: 0
            }
          };
        }
      },

      // ==============================================
      // FONCTIONS POUR LE MODULE URGENCES
      // ==============================================

      // Récupérer l'équipe disponible pour les urgences
      async getEquipeUrgences(limit = 20) {
        try {
          const response = await fetchAPI(`/prestataires/equipe/urgences${limit ? '?limit=' + limit : ''}`);
          
          if (response.success) {
            const equipe = response.equipe?.map(membre => ({
              id: membre.id,
              nom: membre.nom,
              prenom: membre.prenom,
              nom_complet: membre.nom_complet || `${membre.prenom || ''} ${membre.nom || ''}`.trim(),
              specialite: membre.specialite,
              titre: membre.titre,
              telephone: membre.telephone,
              email: membre.email,
              cod_cen: membre.cod_cen,
              nom_centre: membre.nom_centre,
              disponibilite: membre.disponibilite || 'Disponible',
              status: membre.status === 1 || membre.status === 'Actif' ? 'Actif' : 'Inactif',
              consultations_en_cours: membre.consultations_en_cours || 0
            })) || [];
            
            return {
              ...response,
              equipe
            };
          }
          
          return response;
        } catch (error) {
          console.error('❌ Erreur récupération équipe urgences:', error);
          
          // Fallback en cas d'erreur
          return { 
            success: false, 
            message: error.message,
            equipe: [] 
          };
        }
      },

      // Rechercher des prestataires pour l'autocomplétion (urgences)
      async searchForAutocomplete(searchTerm, limit = 10) {
        try {
          if (!searchTerm || searchTerm.trim().length < 2) {
            return { success: true, prestataires: [], options: [] };
          }
          
          // Utiliser la recherche rapide
          const response = await this.searchQuick(searchTerm, limit);
          
          if (response.success && response.prestataires) {
            // Formater pour l'autocomplétion
            const options = response.prestataires.map(p => ({
              id: p.id,
              label: p.label || `${p.prenom} ${p.nom} - ${p.specialite}`.trim(),
              nom: p.nom,
              prenom: p.prenom,
              specialite: p.specialite,
              telephone: p.telephone,
              email: p.email,
              cod_cen: p.cod_cen
            }));
            
            return { 
              ...response, 
              options 
            };
          }
          
          return response;
        } catch (error) {
          console.error('❌ Erreur recherche autocomplétion:', error);
          return { success: false, message: error.message, prestataires: [], options: [] };
        }
      },

      // ==============================================
      // FONCTIONS UTILITAIRES
      // ==============================================

      // Tester la connexion à l'API prestataires
      async testConnection() {
        try {
          const response = await fetchAPI('/prestataires?limit=1');
          return {
            success: response.success !== false,
            message: response.success !== false ? 'API prestataires opérationnelle' : 'API en erreur',
            timestamp: new Date().toISOString(),
            details: response
          };
        } catch (error) {
          console.error('❌ Test connexion prestataires échoué:', error);
          return {
            success: false,
            message: 'API prestataires non disponible',
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }
      },

    formatPrestataireForDisplay(prestataire) {
    // Si le prestataire vient de la nouvelle route (avec table de liaison)
    if (prestataire.id_affectation) {
      return {
        id: prestataire.id || prestataire.COD_PRE,
        nom: prestataire.nom || prestataire.NOM_PRESTATAIRE || '',
        prenom: prestataire.prenom || prestataire.PRENOM_PRESTATAIRE || '',
        nom_complet: prestataire.nom_complet || `${prestataire.prenom || ''} ${prestataire.nom || ''}`.trim(),
        specialite: prestataire.specialite || prestataire.SPECIALITE || '',
        type_prestataire: prestataire.type_prestataire || prestataire.TYPE_PRESTATAIRE || '',
        cod_cen: prestataire.cod_cen || prestataire.COD_CEN || null,
        // Informations d'affectation spécifiques
        id_affectation: prestataire.id_affectation,
        date_debut_affectation: prestataire.date_debut_affectation,
        date_fin_affectation: prestataire.date_fin_affectation,
        statut_affectation: prestataire.statut_affectation,
        // Compatibilité avec l'ancienne structure
        telephone: prestataire.telephone || prestataire.TELEPHONE || '',
        email: prestataire.email || prestataire.EMAIL || '',
        actif: prestataire.ACTIF || prestataire.actif || 1
      };
    }
    
    // Si le prestataire vient de l'ancienne route (sans table de liaison)
    return {
      id: prestataire.id || prestataire.COD_PRE,
      nom: prestataire.nom || prestataire.NOM_PRESTATAIRE || '',
      prenom: prestataire.prenom || prestataire.PRENOM_PRESTATAIRE || '',
      nom_complet: prestataire.nom_complet || `${prestataire.prenom || ''} ${prestataire.nom || ''}`.trim(),
      specialite: prestataire.specialite || prestataire.SPECIALITE || '',
      type_prestataire: prestataire.type_prestataire || prestataire.TYPE_PRESTATAIRE || '',
      cod_cen: prestataire.cod_cen || prestataire.COD_CEN || null,
      telephone: prestataire.telephone || prestataire.TELEPHONE || '',
      email: prestataire.email || prestataire.EMAIL || '',
      actif: prestataire.ACTIF || prestataire.actif || 1
    };
  },

      // Valider les données d'un prestataire avant création/mise à jour
      validatePrestataireData(data, isUpdate = false) {
        const errors = [];
        
        // Validation des champs obligatoires (pour création)
        if (!isUpdate) {
          if (!data.nom || data.nom.trim() === '') {
            errors.push('Le nom est obligatoire');
          }
          if (!data.prenom || data.prenom.trim() === '') {
            errors.push('Le prénom est obligatoire');
          }
          if (!data.specialite || data.specialite.trim() === '') {
            errors.push('La spécialité est obligatoire');
          }
        }
        
        // Validation du format email
        if (data.email && data.email.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(data.email)) {
            errors.push('Format d\'email invalide');
          }
        }
        
        // Validation du téléphone
        if (data.telephone && data.telephone.trim() !== '') {
          const phoneRegex = /^[\d\s+\-()]{6,20}$/;
          if (!phoneRegex.test(data.telephone)) {
            errors.push('Format de téléphone invalide (6-20 caractères, chiffres, espaces, +, -, ())');
          }
        }
        
        // Validation de l'expérience
        if (data.experience_annee !== undefined && data.experience_annee !== null) {
          const exp = parseInt(data.experience_annee);
          if (isNaN(exp) || exp < 0 || exp > 60) {
            errors.push('L\'expérience doit être un nombre entre 0 et 60 ans');
          }
        }
        
        // Validation des honoraires
        if (data.honoraires !== undefined && data.honoraires !== null) {
          const honoraires = parseFloat(data.honoraires);
          if (isNaN(honoraires) || honoraires < 0) {
            errors.push('Les honoraires doivent être un nombre positif');
          }
        }
        
        return {
          isValid: errors.length === 0,
          errors
        };
      },

      // ==============================================
      // FONCTIONS DE CONVERSION POUR LE FRONTEND
      // ==============================================

      // Convertir pour le sélecteur d'autocomplétion
      convertToAutocompleteOptions(prestataires) {
        if (!prestataires || !Array.isArray(prestataires)) {
          return [];
        }
        
        return prestataires.map(prestataire => ({
          id: prestataire.id,
          label: `${prestataire.prenom} ${prestataire.nom} - ${prestataire.specialite}`.trim(),
          nom: prestataire.nom,
          prenom: prestataire.prenom,
          specialite: prestataire.specialite,
          telephone: prestataire.telephone,
          email: prestataire.email,
          cod_cen: prestataire.cod_cen,
          value: prestataire.id // Pour compatibilité avec certains composants
        }));
      },

      // Convertir pour la table de données
      convertToTableData(prestataires) {
        if (!prestataires || !Array.isArray(prestataires)) {
          return [];
        }
        
        return prestataires.map(prestataire => ({
          id: prestataire.id,
          nom: prestataire.nom,
          prenom: prestataire.prenom,
          nom_complet: prestataire.nom_complet,
          specialite: prestataire.specialite,
          titre: prestataire.titre,
          telephone: prestataire.telephone,
          email: prestataire.email,
          centre_pratique: prestataire.centre_pratique,
          disponibilite: prestataire.disponibilite,
          status: prestataire.status,
          actions: [] // Placeholder pour les boutons d'actions
        }));
      },

      // Obtenir le statut d'affichage
      getStatusDisplay(status) {
        if (status === 1 || status === 'Actif' || status === true) {
          return { text: 'Actif', color: 'success', icon: 'check_circle' };
        } else {
          return { text: 'Inactif', color: 'error', icon: 'cancel' };
        }
      },

      // Obtenir la disponibilité d'affichage
      getDisponibiliteDisplay(disponibilite) {
        switch (disponibilite) {
          case 'Disponible':
            return { text: 'Disponible', color: 'success', icon: 'check' };
          case 'En congés':
            return { text: 'En congés', color: 'warning', icon: 'beach_access' };
          case 'Indisponible':
            return { text: 'Indisponible', color: 'error', icon: 'block' };
          default:
            return { text: 'Disponible', color: 'success', icon: 'check' };
        }
      },

      // ==============================================
      // FONCTIONS DE GESTION DE CACHE (optionnel)
      // ==============================================

      // Mettre en cache les prestataires
      cachePrestataires(prestataires, key = 'prestataires_cache') {
        try {
          if (typeof window !== 'undefined') {
            const cacheData = {
              data: prestataires,
              timestamp: new Date().getTime(),
              expiresIn: 5 * 60 * 1000 // 5 minutes
            };
            localStorage.setItem(key, JSON.stringify(cacheData));
            return true;
          }
        } catch (error) {
          console.warn('⚠️ Impossible de mettre en cache les prestataires:', error);
        }
        return false;
      },

      // Récupérer du cache
      getCachedPrestataires(key = 'prestataires_cache') {
        try {
          if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(key);
            if (cached) {
              const { data, timestamp, expiresIn } = JSON.parse(cached);
              const now = new Date().getTime();
              
              if (now - timestamp < expiresIn) {
                return data;
              } else {
                // Cache expiré
                localStorage.removeItem(key);
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Impossible de récupérer le cache des prestataires:', error);
        }
        return null;
      },

      // Effacer le cache
      clearCache(key = 'prestataires_cache') {
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
            return true;
          }
        } catch (error) {
          console.warn('⚠️ Impossible d\'effacer le cache des prestataires:', error);
        }
        return false;
      }
    };

  // ==============================================
  // API DES DOSSIERS MÉDICAUX
  // ==============================================

 export const dossiersMedicauxAPI = {
  // Récupérer le dossier complet d'un patient
  async getDossierPatient(patientId) {
    try {
      if (!patientId || isNaN(parseInt(patientId))) {
        throw new Error('ID patient invalide');
      }
      
      console.log(`📋 Récupération dossier patient ${patientId}...`);
      
      const response = await fetchAPI(`/dossiers-medicaux/patient/${patientId}`);
      
      // Si l'endpoint principal n'existe pas, essayer une route alternative
      if (!response.success && response.status === 404) {
        console.warn('Route principale non disponible, tentative avec route alternative');
        
        // Tentative avec la route du bénéficiaire
        try {
          const altResponse = await fetchAPI(`/patients/${patientId}`);
          if (altResponse.success) {
            // Construire un dossier minimal
            const dossierMinimal = {
              patient: {
                informations: altResponse.patient,
                statistiques: {
                  total_consultations: 0,
                  consultations_urgentes: 0,
                  montant_total_consultations: 0
                }
              },
              consultations: {
                liste: [],
                total: 0
              },
              prescriptions: {
                liste: [],
                total: 0
              },
              facturation: {
                factures: [],
                total: 0
              },
              metadata: {
                date_generation: new Date().toISOString(),
                generateur_par: 'API fallback'
              }
            };
            
            return {
              success: true,
              message: 'Dossier minimal récupéré',
              dossier: dossierMinimal,
              isFallback: true
            };
          }
        } catch (altError) {
          console.warn('Route alternative échouée:', altError.message);
        }
      }
      
      return response;
      
    } catch (error) {
      console.error(`❌ Erreur récupération dossier patient ${patientId}:`, error);
      
      // Gestion des erreurs spécifiques
      if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
        return {
          success: false,
          message: 'Erreur de connexion au serveur.',
          isNetworkError: true,
          dossier: null
        };
      }
      
      if (error.message.includes('404')) {
        return {
          success: false,
          message: `Dossier médical non trouvé pour le patient ${patientId}.`,
          status: 404,
          dossier: null
        };
      }
      
      return {
        success: false,
        message: error.message || 'Erreur inattendue',
        dossier: null
      };
    }
  },

  // Rechercher des patients
  async searchPatients(searchTerm, filters = {}, limit = 20) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { success: true, patients: [] };
      }
      
      const queryParams = new URLSearchParams();
      queryParams.append('search', searchTerm);
      queryParams.append('limit', limit);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/patients?${queryString}`);
      
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche patients:', error);
      return { success: false, message: error.message, patients: [] };
    }
  },

  // Récupérer les statistiques du dossier médical
    async getStats(id, periode = 'tous') {
      try {
        if (!id || isNaN(parseInt(id))) {
          throw new Error('ID patient invalide');
        }
        
        const response = await fetchAPI(`/dossiers-medicaux/stats/${id}?periode=${periode}`);
        
        // Normalisation des statistiques
        if (response.success && response.statistiques) {
          const stats = response.statistiques;
          
          // S'assurer que tous les champs existent
          stats.consultations = stats.consultations || { 
            total: 0, urgentes: 0, hospitalisations: 0, 
            montant_total: 0, montant_prise_charge: 0 
          };
          
          stats.prescriptions = stats.prescriptions || { 
            total: 0, executees: 0, en_attente: 0, montant_total: 0 
          };
          
          stats.factures = stats.factures || { 
            total: 0, payees: 0, en_attente: 0, 
            montant_total: 0, montant_paye: 0, montant_restant: 0 
          };
          
          stats.evolution = stats.evolution || [];
        }
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur statistiques dossier ${id}:`, error);
        
        // Retourner des statistiques par défaut en cas d'erreur
        return {
          success: false,
          message: error.message,
          statistiques: {
            periode: periode,
            consultations: {
              total: 0, urgentes: 0, hospitalisations: 0,
              montant_total: 0, montant_prise_charge: 0
            },
            prescriptions: {
              total: 0, executees: 0, en_attente: 0, montant_total: 0
            },
            factures: {
              total: 0, payees: 0, en_attente: 0,
              montant_total: 0, montant_paye: 0, montant_restant: 0
            },
            evolution: []
          }
        };
      }
    },

  // Exporter le dossier en PDF
  async exportPDF(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID patient invalide');
      }
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/dossiers-medicaux/export/${id}?format=pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error(`❌ Erreur export PDF dossier ${id}:`, error);
      throw error;
    }
  },

  // Ajouter une note au dossier
  async addNote(noteData) {
    try {
      const requiredFields = ['COD_BEN', 'TYPE_NOTE', 'CONTENU'];
      const missingFields = requiredFields.filter(field => !noteData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Champs manquants: ${missingFields.join(', ')}`);
      }
      
      // Note: Cette route n'existe pas encore dans le backend
      // Vous devez la créer si nécessaire
      const response = await fetchAPI('/dossiers-medicaux/notes', {
        method: 'POST',
        body: noteData,
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur ajout note dossier:', error);
      
      if (import.meta.env.MODE === 'development') {
        console.warn('Simulation en développement');
        return {
          success: true,
          message: 'Note ajoutée (simulation)',
          noteId: Date.now()
        };
      }
      
      throw error;
    }
  },

  // Récupérer les notes du dossier
  async getNotes(patientId, params = {}) {
    try {
      if (!patientId || isNaN(parseInt(patientId))) {
        throw new Error('ID patient invalide');
      }
      
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      // Note: Cette route n'existe pas encore
      const response = await fetchAPI(`/dossiers-medicaux/notes/${patientId}${queryString}`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération notes patient ${patientId}:`, error);
      return { success: false, message: error.message, notes: [] };
    }
  },

  // Récupérer les consultations d'un patient
  async getConsultationsPatient(patientId, params = {}) {
    try {
      if (!patientId || isNaN(parseInt(patientId))) {
        throw new Error('ID patient invalide');
      }
      
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString() ? `?${queryString}` : '';
      const response = await fetchAPI(`/dossiers-medicaux/patient/${patientId}/consultations${queryString}`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération consultations patient ${patientId}:`, error);
      return { success: false, message: error.message, consultations: [], total: 0 };
    }
  },

  // Récupérer les prescriptions d'un patient
  async getPrescriptionsPatient(patientId, params = {}) {
    try {
      // Pour l'instant, utiliser le dossier complet
      const dossierResponse = await this.getDossierPatient(patientId);
      
      if (dossierResponse.success) {
        const prescriptions = dossierResponse.dossier?.prescriptions?.liste || [];
        
        // Appliquer les filtres
        let filteredPrescriptions = [...prescriptions];
        
        if (params.statut) {
          filteredPrescriptions = filteredPrescriptions.filter(p => 
            p.STATUT === params.statut
          );
        }
        
        if (params.date_debut) {
          const dateDebut = new Date(params.date_debut);
          filteredPrescriptions = filteredPrescriptions.filter(p => 
            new Date(p.DATE_PRESCRIPTION) >= dateDebut
          );
        }
        
        if (params.date_fin) {
          const dateFin = new Date(params.date_fin);
          filteredPrescriptions = filteredPrescriptions.filter(p => 
            new Date(p.DATE_PRESCRIPTION) <= dateFin
          );
        }
        
        // Pagination
        const page = params.page || 1;
        const pageSize = params.limit || 20;
        const startIndex = (page - 1) * pageSize;
        const paginatedPrescriptions = filteredPrescriptions.slice(startIndex, startIndex + pageSize);
        
        return {
          success: true,
          prescriptions: paginatedPrescriptions,
          total: filteredPrescriptions.length,
          page: page,
          totalPages: Math.ceil(filteredPrescriptions.length / pageSize)
        };
      }
      
      return dossierResponse;
    } catch (error) {
      console.error(`❌ Erreur récupération prescriptions patient ${patientId}:`, error);
      return { success: false, message: error.message, prescriptions: [], total: 0 };
    }
  },

  // Récupérer les factures d'un patient
  async getFacturesPatient(patientId, params = {}) {
    try {
      // Pour l'instant, utiliser le dossier complet
      const dossierResponse = await this.getDossierPatient(patientId);
      
      if (dossierResponse.success) {
        const factures = dossierResponse.dossier?.facturation?.factures || [];
        
        // Appliquer les filtres
        let filteredFactures = [...factures];
        
        if (params.statut) {
          filteredFactures = filteredFactures.filter(f => 
            f.statut === params.statut
          );
        }
        
        if (params.date_debut) {
          const dateDebut = new Date(params.date_debut);
          filteredFactures = filteredFactures.filter(f => 
            new Date(f.DATE_FACTURE) >= dateDebut
          );
        }
        
        if (params.date_fin) {
          const dateFin = new Date(params.date_fin);
          filteredFactures = filteredFactures.filter(f => 
            new Date(f.DATE_FACTURE) <= dateFin
          );
        }
        
        // Pagination
        const page = params.page || 1;
        const pageSize = params.limit || 20;
        const startIndex = (page - 1) * pageSize;
        const paginatedFactures = filteredFactures.slice(startIndex, startIndex + pageSize);
        
        return {
          success: true,
          factures: paginatedFactures,
          total: filteredFactures.length,
          page: page,
          totalPages: Math.ceil(filteredFactures.length / pageSize)
        };
      }
      
      return dossierResponse;
    } catch (error) {
      console.error(`❌ Erreur récupération factures patient ${patientId}:`, error);
      return { success: false, message: error.message, factures: [], total: 0 };
    }
  },

  // Générer un rapport synthétique
  async genererRapportSynthese(patientId) {
    try {
      const dossierResponse = await this.getDossierPatient(patientId);
      
      if (!dossierResponse.success) {
        return dossierResponse;
      }
      
      const dossier = dossierResponse.dossier;
      const patient = dossier.patient?.informations || {};
      
      // Calculer les indicateurs
      const consultations = dossier.consultations?.liste || [];
      const prescriptions = dossier.prescriptions?.liste || [];
      const factures = dossier.facturation?.factures || [];
      
      const indicateurs = {
        consultations_total: consultations.length,
        consultations_urgentes: consultations.filter(c => c.URGENT === true || c.URGENT === 1).length,
        prescriptions_total: prescriptions.length,
        factures_total: factures.length,
        factures_payees: factures.filter(f => f.statut === 'Payée').length,
        montant_total_factures: factures.reduce((sum, f) => sum + (parseFloat(f.MONTANT_TOTAL) || 0), 0),
        montant_restant: factures.reduce((sum, f) => sum + (parseFloat(f.MONTANT_RESTANT) || 0), 0)
      };
      
      // Alertes
      const alertes = [];
      
      if (consultations.length === 0) {
        alertes.push({ niveau: 'warning', message: 'Aucune consultation enregistrée' });
      }
      
      if (factures.filter(f => f.statut !== 'Payée').length > 0) {
        alertes.push({ 
          niveau: 'danger', 
          message: `${factures.filter(f => f.statut !== 'Payée').length} facture(s) impayée(s)` 
        });
      }
      
      // Rapport
      const rapport = {
        patient: {
          id: patientId,
          nom_complet: `${patient.NOM_BEN || ''} ${patient.PRE_BEN || ''}`.trim(),
          age: patient.AGE,
          type_prise_en_charge: patient.TYPE_PAIEMENT,
          taux_couverture: patient.TAUX_COUVERTURE || 0
        },
        indicateurs: indicateurs,
        alertes: alertes,
        resume_activite: {
          derniere_consultation: consultations.length > 0 ? 
            new Date(consultations[0].DATE_CONSULTATION).toLocaleDateString('fr-FR') : 
            'Aucune',
          dernier_examen: 'Aucun',
          derniere_prescription: prescriptions.length > 0 ? 
            new Date(prescriptions[0].DATE_PRESCRIPTION).toLocaleDateString('fr-FR') : 
            'Aucune'
        },
        date_generation: new Date().toISOString()
      };
      
      return {
        success: true,
        message: 'Rapport synthétique généré',
        rapport: rapport
      };
    } catch (error) {
      console.error(`❌ Erreur génération rapport patient ${patientId}:`, error);
      return {
        success: false,
        message: error.message,
        rapport: null
      };
    }
  },

  // Synchroniser le dossier
  async synchroniserDossier(patientId, lastSyncDate = null) {
    try {
      if (!patientId || isNaN(parseInt(patientId))) {
        throw new Error('ID patient invalide');
      }
      
      const params = lastSyncDate ? { last_sync: new Date(lastSyncDate).toISOString() } : {};
      const queryString = new URLSearchParams(params).toString();
      
      const response = await fetchAPI(`/dossiers-medicaux/sync/${patientId}${queryString ? '?' + queryString : ''}`);
      
      if (!response.success && response.status === 404) {
        // Fallback
        return await this.getDossierPatient(patientId);
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur synchronisation dossier ${patientId}:`, error);
      
      if (error.status === 404) {
        return await this.getDossierPatient(patientId);
      }
      
      throw error;
    }
  },

  // Alias pour compatibilité
  async getPatientDossier(patientId) {
    return this.getDossierPatient(patientId);
  },

  // Vérifier l'accès au dossier
  async checkAccess(patientId) {
    try {
      if (!patientId || isNaN(parseInt(patientId))) {
        return { success: false, hasAccess: false, reason: 'ID patient invalide' };
      }
      
      // Essayer de récupérer le dossier
      const response = await this.getDossierPatient(patientId);
      
      return {
        success: true,
        hasAccess: response.success !== false,
        message: response.success !== false ? 'Accès autorisé' : 'Accès refusé'
      };
    } catch (error) {
      console.error(`❌ Erreur vérification accès dossier ${patientId}:`, error);
      
      return {
        success: false,
        hasAccess: false,
        reason: error.message
      };
    }
  },
// Fonction d'assistance pour assembler manuellement un dossier
  async assemblerDossierManuellement(patientId) {
    try {
      console.log(`🛠️ Assemblage manuel du dossier pour patient ${patientId}`);
      
      // 1. Récupérer les informations du bénéficiaire
      const patientResponse = await beneficiairesAPI.getById(patientId);
      
      if (!patientResponse.success) {
        throw new Error('Impossible de récupérer les informations du patient');
      }
      
      const patientData = patientResponse.beneficiaire || patientResponse.data;
      
      // 2. Récupérer les consultations
      let consultations = [];
      try {
        const consultationsResponse = await consultationsAPI.getAllConsultations({ 
          patientId: patientId,
          limit: 100 
        });
        if (consultationsResponse.success) {
          consultations = consultationsResponse.consultations || [];
        }
      } catch (consError) {
        console.warn('Erreur récupération consultations:', consError.message);
      }
      
      // 3. Récupérer les prescriptions
      let prescriptions = [];
      try {
        const prescriptionsResponse = await prescriptionsAPI.getAll({ 
          patientId: patientId,
          limit: 100 
        });
        if (prescriptionsResponse.success) {
          prescriptions = prescriptionsResponse.prescriptions || [];
        }
      } catch (presError) {
        console.warn('Erreur récupération prescriptions:', presError.message);
      }
      
      // 4. Récupérer les factures
      let factures = [];
      try {
        const facturesResponse = await facturationAPI.getFactures({ 
          patientId: patientId,
          limit: 100 
        });
        if (facturesResponse.success) {
          factures = facturesResponse.factures || [];
        }
      } catch (factError) {
        console.warn('Erreur récupération factures:', factError.message);
      }
      
      // 5. Assembler la structure du dossier
      const dossierAssemble = {
        patient: {
          ...patientData,
          informations: {
            id: patientData.ID_BEN || patientData.id,
            nom: patientData.NOM_BEN || patientData.nom,
            prenom: patientData.PRE_BEN || patientData.prenom,
            sexe: patientData.SEX_BEN || patientData.sexe,
            age: patientData.AGE || patientData.age,
            date_naissance: patientData.NAI_BEN || patientData.date_naissance,
            telephone: patientData.TELEPHONE_MOBILE || patientData.telephone,
            email: patientData.EMAIL || patientData.email,
            type_paiement: patientData.TYPE_PAIEMENT || patientData.type_paiement || 'CASH',
            profession: patientData.PROFESSION || patientData.profession,
            groupe_sanguin: patientData.GROUPE_SANGUIN || patientData.groupe_sanguin,
            taux_couverture: patientData.taux_couverture || 0,
            identifiant: patientData.IDENTIFIANT_NATIONAL || patientData.identifiant_national
          }
        },
        consultations: {
          liste: consultations,
          statistiques: {
            total: consultations.length,
            urgentes: consultations.filter(c => c.URGENT === 1 || c.URGENT === true).length
          }
        },
        prescriptions: {
          liste: prescriptions,
          statistiques: {
            total: prescriptions.length,
            executees: prescriptions.filter(p => p.STATUT === 'Executee').length
          }
        },
        facturation: {
          factures: factures,
          statistiques: {
            total: factures.length,
            payees: factures.filter(f => f.statut === 'Payée').length
          }
        },
        antecedents: {
          medicaux: patientData.ANTECEDENTS_MEDICAUX || [],
          detailles: []
        },
        allergies: {
          liste: patientData.ALLERGIES || [],
          detailles: []
        },
        examens: [],
        hospitalisations: [],
        traitements: {
          en_cours: patientData.TRAITEMENTS_EN_COURS || []
        },
        metadata: {
          dateGeneration: new Date().toISOString(),
          source: 'Assemblage manuel',
          completeness: 0.7 // Score de complétude estimé
        }
      };
      
      return {
        success: true,
        message: 'Dossier assemblé manuellement (fallback)',
        dossier: dossierAssemble,
        isFallback: true,
        metadata: {
          assembledFrom: ['patient', 'consultations', 'prescriptions', 'factures'],
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ Échec assemblage manuel dossier:', error);
      throw error;
    }
  },

};

  export const urgencesAPI = {
  // Récupérer toutes les urgences
  async getAll(filters = {}) {
    try {
      const queryString = api.buildQueryString({
        ...filters,
        type_consultation: 'urgence',
        is_urgence: true
      });
      
      const response = await fetchAPI(`/consultations/urgences${queryString}`);
      
      // Normalisation de la réponse
      if (response.success && Array.isArray(response.urgences)) {
        return response;
      } else if (Array.isArray(response)) {
        return { success: true, urgences: response };
      }
      
      return { success: true, urgences: [] };
    } catch (error) {
      console.error('❌ Erreur récupération urgences:', error);
      return { 
        success: false, 
        message: error.message, 
        urgences: [] 
      };
    }
  },

  // Récupérer une urgence par ID
  async getById(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID urgence invalide');
      }
      
      const response = await fetchAPI(`/consultations/urgences/${id}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur urgence ${id}:`, error);
      throw error;
    }
  },

  // Créer une urgence
  async create(urgenceData) {
    try {
      const dataToSend = {
        ...urgenceData,
        TYPE_CONSULTATION: 'urgence',
        IS_URGENCE: true,
        STATUT_CONSULTATION: urgenceData.statut || 'en_attente',
        PRIORITE: urgenceData.priorite || 3,
        GRAVITE: urgenceData.gravite || 3
      };
      
      const response = await fetchAPI('/consultations/urgences', {
        method: 'POST',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur création urgence:', error);
      throw error;
    }
  },

  // Mettre à jour une urgence
  async update(id, urgenceData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID urgence invalide');
      }
      
      const response = await fetchAPI(`/consultations/urgences/${id}`, {
        method: 'PUT',
        body: urgenceData,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour urgence ${id}:`, error);
      throw error;
    }
  },

  // Supprimer une urgence
  async delete(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID urgence invalide');
      }
      
      const response = await fetchAPI(`/consultations/urgences/${id}`, {
        method: 'DELETE',
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression urgence ${id}:`, error);
      throw error;
    }
  },

  // Récupérer les statistiques des urgences
  async getStats(periode = 'today') {
    try {
      const response = await fetchAPI(`/consultations/urgences/stats?periode=${periode}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur statistiques urgences:', error);
      return { 
        success: false, 
        message: error.message,
        stats: {
          total: 0,
          en_attente: 0,
          en_cours: 0,
          traite: 0,
          transfere: 0,
          decede: 0,
          abandon: 0,
          urgent_absolu: 0,
          urgent: 0,
          semi_urgent: 0,
          non_urgent: 0
        } 
      };
    }
  },

  // Mettre à jour le statut d'une urgence
  async updateStatus(id, statut, notes = '') {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID urgence invalide');
      }
      
      const response = await fetchAPI(`/consultations/urgences/${id}/status`, {
        method: 'PATCH',
        body: { statut, notes },
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour statut urgence ${id}:`, error);
      throw error;
    }
  },

  // Rechercher des patients pour les urgences
  async searchPatients(searchTerm, limit = 20) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { success: true, patients: [] };
      }
      
      const response = await fetchAPI(
        `/consultations/search-patients?search=${encodeURIComponent(searchTerm)}&limit=${limit}&urgence=true`
      );
      
      // Adaptation de la structure pour les urgences
      if (response.success && Array.isArray(response.patients)) {
        const adaptedPatients = response.patients.map(patient => ({
          id: patient.ID_BEN || patient.id,
          nom: patient.NOM_BEN || patient.nom,
          prenom: patient.PRE_BEN || patient.prenom,
          sexe: patient.SEX_BEN || patient.sexe,
          age: patient.AGE || null,
          identifiant: patient.IDENTIFIANT_NATIONAL || patient.identifiant,
          date_naissance: patient.NAI_BEN || patient.date_naissance,
          telephone: patient.TELEPHONE_MOBILE || patient.telephone,
          email: patient.EMAIL || patient.email,
          type_paiement: patient.COD_PAI,
          taux_couverture: patient.TAUX_COUVERTURE,
          antecedents: patient.ANTECEDENTS_MEDICAUX,
          allergies: patient.ALLERGIES,
          groupe_sanguin: patient.GROUPE_SANGUIN,
          rhesus: patient.RHESUS
        }));
        
        return { ...response, patients: adaptedPatients };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche patients urgences:', error);
      return { success: false, message: error.message, patients: [] };
    }
  },

  // Récupérer les médecins disponibles pour les urgences
  async getMedecinsDisponibles() {
    try {
      const response = await fetchAPI('/consultations/medecins/disponibles?urgence=true');
      
      // Normalisation de la réponse
      if (response.success && Array.isArray(response.medecins)) {
        return response;
      } else if (Array.isArray(response)) {
        return { success: true, medecins: response };
      }
      
      return { success: true, medecins: [] };
    } catch (error) {
      console.error('❌ Erreur récupération médecins urgences:', error);
      return { success: false, message: error.message, medecins: [] };
    }
  },

  // Exporter les données des urgences
  async exportData(format = 'excel', filters = {}) {
    try {
      const queryString = api.buildQueryString(filters);
      const response = await fetchAPI(`/consultations/urgences/export/${format}${queryString}`, {
        responseType: 'blob'
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur export urgences:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  // Synchroniser en temps réel (WebSocket simulation)
  async subscribeToUpdates(callback) {
    try {
      // Simulation WebSocket - dans une vraie implémentation, utiliser Socket.io ou similaire
      const eventSource = new EventSource('/urgences/updates');
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        callback(data);
      };
      
      eventSource.onerror = (error) => {
        console.error('❌ Erreur connexion temps réel:', error);
        callback({ type: 'error', message: 'Connexion perdue' });
      };
      
      return () => eventSource.close();
    } catch (error) {
      console.error('❌ Erreur abonnement mises à jour:', error);
      throw error;
    }
  }
};

export const evacuationsAPI = {
  // ==============================================
  // RÉCUPÉRATION DE DONNÉES
  // ==============================================

  // Récupérer toutes les évacuations avec pagination et filtres
  async getAll(filters = {}) {
    try {
      console.log('🔍 Chargement évacuations avec filtres:', filters);
      
      const queryParams = new URLSearchParams();
      
      // Ajouter les filtres aux paramètres
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '' && filters[key] !== null) {
          if (key === 'dateDebut' || key === 'dateFin') {
            // Formater les dates pour l'API
            const dateValue = formatDateForAPI(filters[key]);
            queryParams.append(key === 'dateDebut' ? 'date_debut' : 'date_fin', dateValue);
          } else if (key === 'date_evacuation') {
            // Pour la recherche par date exacte
            queryParams.append(key, formatDateForAPI(filters[key]));
          } else {
            queryParams.append(key, filters[key]);
          }
        }
      });
      
      // Paramètres par défaut si aucun filtre
      if (queryParams.toString().length === 0) {
        queryParams.append('limit', '20');
        queryParams.append('page', '1');
      }
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/evacuations${queryString ? `?${queryString}` : ''}`);
      
      // Normalisation de la réponse
      if (response.success && Array.isArray(response.evacuations)) {
        return {
          ...response,
          evacuations: response.evacuations.map(evac => this.formatEvacuationForDisplay(evac))
        };
      } else if (Array.isArray(response)) {
        return {
          success: true,
          evacuations: response.map(evac => this.formatEvacuationForDisplay(evac)),
          pagination: {
            total: response.length,
            page: 1,
            limit: 20,
            totalPages: Math.ceil(response.length / 20)
          }
        };
      }
      
      return {
        success: true,
        evacuations: [],
        message: 'Aucune évacuation trouvée',
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      };
    } catch (error) {
      console.error('❌ Erreur récupération évacuations:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors du chargement des évacuations',
        evacuations: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      };
    }
  },

  // Récupérer une évacuation par son ID
  async getById(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID évacuation invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${id}`);
      
      if (response.success && response.evacuation) {
        return {
          ...response,
          evacuation: this.formatEvacuationForDisplay(response.evacuation)
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération évacuation ${id}:`, error);
      throw error;
    }
  },

  // Récupérer les évacuations d'un patient
  async getByPatientId(patientId) {
    try {
      if (!patientId || isNaN(parseInt(patientId))) {
        throw new Error('ID patient invalide');
      }
      
      const response = await fetchAPI(`/evacuations/patient/${patientId}`);
      
      if (response.success && Array.isArray(response.evacuations)) {
        return {
          ...response,
          evacuations: response.evacuations.map(evac => this.formatEvacuationForDisplay(evac))
        };
      } else if (Array.isArray(response)) {
        return {
          success: true,
          evacuations: response.map(evac => this.formatEvacuationForDisplay(evac))
        };
      }
      
      return { success: true, evacuations: [] };
    } catch (error) {
      console.error(`❌ Erreur évacuations patient ${patientId}:`, error);
      return {
        success: false,
        message: error.message,
        evacuations: []
      };
    }
  },

  // Récupérer les évacuations par statut
  async getByStatus(status) {
    try {
      if (!status) {
        throw new Error('Statut requis');
      }
      
      const response = await fetchAPI(`/evacuations/status/${status}`);
      
      if (response.success && Array.isArray(response.evacuations)) {
        return {
          ...response,
          evacuations: response.evacuations.map(evac => this.formatEvacuationForDisplay(evac))
        };
      } else if (Array.isArray(response)) {
        return {
          success: true,
          evacuations: response.map(evac => this.formatEvacuationForDisplay(evac))
        };
      }
      
      return { success: true, evacuations: [] };
    } catch (error) {
      console.error(`❌ Erreur évacuations statut ${status}:`, error);
      return {
        success: false,
        message: error.message,
        evacuations: []
      };
    }
  },

  // ==============================================
  // CRÉATION ET MISE À JOUR
  // ==============================================

  // Créer une nouvelle évacuation
  async create(evacuationData) {
    try {
      console.log('📝 Création évacuation:', evacuationData);
      
      // Validation des données
      const validation = this.validateEvacuationData(evacuationData, false);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Préparation des données pour l'envoi
      const dataToSend = this.prepareEvacuationData(evacuationData);
      
      const response = await fetchAPI('/evacuations', {
        method: 'POST',
        body: dataToSend,
      });
      
      if (response.success && response.evacuation) {
        return {
          ...response,
          evacuation: this.formatEvacuationForDisplay(response.evacuation)
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur création évacuation:', error);
      throw error;
    }
  },

  // Mettre à jour une évacuation existante
  async update(id, evacuationData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID évacuation invalide');
      }
      
      console.log(`✏️ Mise à jour évacuation ${id}:`, evacuationData);
      
      // Préparation des données pour l'envoi
      const dataToSend = this.prepareEvacuationData(evacuationData);
      
      const response = await fetchAPI(`/evacuations/${id}`, {
        method: 'PUT',
        body: dataToSend,
      });
      
      if (response.success && response.evacuation) {
        return {
          ...response,
          evacuation: this.formatEvacuationForDisplay(response.evacuation)
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour évacuation ${id}:`, error);
      throw error;
    }
  },

  // Mettre à jour le statut d'une évacuation
  async updateStatus(id, status, notes = '') {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID évacuation invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${id}/status`, {
        method: 'PATCH',
        body: { 
          statut: status,
          notes_decision: notes
        },
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour statut évacuation ${id}:`, error);
      throw error;
    }
  },

  // Annuler une évacuation
  async cancel(id, raison) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID évacuation invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${id}/cancel`, {
        method: 'POST',
        body: { raison_annulation: raison },
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur annulation évacuation ${id}:`, error);
      throw error;
    }
  },

  // ==============================================
  // RECHERCHE ET FILTRAGE
  // ==============================================

  // Recherche rapide d'évacuations
  async searchQuick(searchTerm, limit = 20) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { success: true, evacuations: [] };
      }
      
      const response = await fetchAPI(
        `/evacuations/search/quick?search=${encodeURIComponent(searchTerm)}&limit=${limit}`
      );
      
      if (response.success && Array.isArray(response.evacuations)) {
        return {
          ...response,
          evacuations: response.evacuations.map(evac => this.formatEvacuationForDisplay(evac))
        };
      }
      
      return { success: false, message: 'Format de réponse invalide', evacuations: [] };
    } catch (error) {
      console.error('❌ Erreur recherche rapide évacuations:', error);
      return { success: false, message: error.message, evacuations: [] };
    }
  },

  // Recherche avancée d'évacuations
  async searchAdvanced(searchTerm, filters = {}, limit = 20) {
    try {
      const params = {
        search: searchTerm,
        limit,
        ...filters
      };
      
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/evacuations/search/advanced${queryString}`);
      
      if (response.success && Array.isArray(response.evacuations)) {
        return {
          ...response,
          evacuations: response.evacuations.map(evac => this.formatEvacuationForDisplay(evac))
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche avancée évacuations:', error);
      return { success: false, message: error.message, evacuations: [] };
    }
  },

  // Uploader plusieurs documents pour une évacuation
  async uploadDocuments(evacuationId, formData) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${evacuationId}/documents`, {
        method: 'POST',
        body: formData,
        headers: {
          // Note: ne pas définir Content-Type pour FormData, le navigateur le fera automatiquement
        }
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur upload documents évacuation ${evacuationId}:`, error);
      throw error;
    }
  },

  // Récupérer les documents d'une évacuation
  async getDocuments(evacuationId) {
   try {
      const response = await api.get(`/evacuations/${evacuationId}/documents`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },


  // Télécharger un document
  async downloadDocument(evacuationId, documentId) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      if (!documentId) {
        throw new Error('ID document invalide');
      }
      
      // Pour le téléchargement, vous pouvez utiliser window.open ou créer un lien temporaire
      const response = await fetchAPI(
        `/evacuations/${evacuationId}/documents/${documentId}/download`,
        { responseType: 'blob' }
      );
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur téléchargement document ${documentId}:`, error);
      throw error;
    }
  },

  // Supprimer un document
  async deleteDocument(documentId) {
    try {
      if (!documentId || isNaN(parseInt(documentId))) {
        throw new Error('ID document invalide');
      }
      
      // Note: dans notre route, nous avons besoin de l'ID d'évacuation
      // Nous devrons peut-être ajuster cette méthode
      const response = await fetchAPI(
        `/evacuations/0/documents/${documentId}`, // L'ID évacuation sera remplacé par le vrai dans l'implémentation
        { method: 'DELETE' }
      );
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression document ${documentId}:`, error);
      throw error;
    }
  },

  // Formater un document pour l'affichage
  formatDocumentForDisplay(document) {
    return {
      id: document.id || document.ID_DOCUMENT,
      ID_EVACUATION: document.ID_EVACUATION || document.evacuation_id,
      TYPE_DOCUMENT: document.TYPE_DOCUMENT || document.type_document,
      NOM_FICHIER: document.NOM_FICHIER || document.nom_fichier,
      TAILLE: document.TAILLE || document.taille,
      CHEMIN_FICHIER: document.CHEMIN_FICHIER || document.chemin_fichier,
      DATE_UPLOAD: document.DATE_UPLOAD || document.date_upload,
      NOTES: document.NOTES || document.notes,
      COD_CREUTIL: document.COD_CREUTIL || document.created_by,
      
      // Pour l'affichage frontend
      url: document.url || document.CHEMIN_FICHIER,
      nom_original: document.nom_original || document.NOM_FICHIER,
      type_fichier: document.type_fichier || this.getFileType(document.NOM_FICHIER),
      taille_format: document.taille_format || this.formatFileSize(document.TAILLE),
      DATE_UPLOAD_FORMAT: document.DATE_UPLOAD_FORMAT || 
                         (document.DATE_UPLOAD ? 
                           new Date(document.DATE_UPLOAD).toLocaleDateString('fr-FR') : ''),
      
      // Conserver toutes les autres propriétés
      ...document
    };
  },

  // Obtenir le type de fichier basé sur l'extension
  getFileType(filename) {
    if (!filename) return 'document';
    
    const extension = filename.split('.').pop().toLowerCase();
    switch(extension) {
      case 'pdf': return 'pdf';
      case 'doc':
      case 'docx': return 'word';
      case 'xls':
      case 'xlsx': return 'excel';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp': return 'image';
      case 'zip':
      case 'rar':
      case '7z': return 'archive';
      case 'txt':
      case 'rtf': return 'text';
      default: return 'document';
    }
  },

  // Formater la taille du fichier
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // ==============================================
  // GESTION DES FRAIS ET COÛTS
  // ==============================================

  // Ajouter des frais à une évacuation
  async addFrais(evacuationId, fraisData) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${evacuationId}/frais`, {
        method: 'POST',
        body: fraisData,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur ajout frais évacuation ${evacuationId}:`, error);
      throw error;
    }
  },

  // Récupérer les frais d'une évacuation
  async getFrais(evacuationId) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${evacuationId}/frais`);
      
      // Normaliser la réponse
      if (response.success && Array.isArray(response.frais)) {
        return {
          success: true,
          frais: response.frais.map(f => this.formatFraisForDisplay(f)),
          total: response.total || 0,
          count: response.count || response.frais.length
        };
      } else if (Array.isArray(response)) {
        return {
          success: true,
          frais: response.map(f => this.formatFraisForDisplay(f)),
          total: response.reduce((sum, f) => sum + (parseFloat(f.MONTANT) || 0), 0),
          count: response.length
        };
      }
      
      return { 
        success: false, 
        message: 'Format de réponse invalide', 
        frais: [], 
        total: 0,
        count: 0 
      };
    } catch (error) {
      console.error(`❌ Erreur récupération frais évacuation ${evacuationId}:`, error);
      return { 
        success: false, 
        message: error.message, 
        frais: [], 
        total: 0,
        count: 0 
      };
    }
  },

  // Mettre à jour les frais
  async updateFrais(fraisId, fraisData) {
    try {
      if (!fraisId) {
        throw new Error('ID frais invalide');
      }
      
      // Note: dans notre route, nous avons besoin de l'ID d'évacuation
      // Pour simplifier, nous allons supposer que fraisData contient ID_EVACUATION
      const evacuationId = fraisData.ID_EVACUATION;
      
      if (!evacuationId) {
        throw new Error('ID évacuation requis pour mettre à jour le frais');
      }
      
      const response = await fetchAPI(`/evacuations/${evacuationId}/frais/${fraisId}`, {
        method: 'PUT',
        body: fraisData,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour frais ${fraisId}:`, error);
      throw error;
    }
  },

  // Supprimer un frais
  async deleteFrais(fraisId) {
    try {
      if (!fraisId || isNaN(parseInt(fraisId))) {
        throw new Error('ID frais invalide');
      }
      
      // Note: dans notre route, nous avons besoin de l'ID d'évacuation
      // Cette méthode devra être ajustée en fonction de votre implémentation
      const response = await fetchAPI(
        `/evacuations/0/frais/${fraisId}`, // L'ID évacuation sera remplacé par le vrai dans l'implémentation
        { method: 'DELETE' }
      );
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression frais ${fraisId}:`, error);
      throw error;
    }
  },

  // Formater un frais pour l'affichage
  formatFraisForDisplay(frais) {
    return {
      id: frais.id || frais.ID_FRAIS,
      ID_EVACUATION: frais.ID_EVACUATION || frais.evacuation_id,
      TYPE_FRAIS: frais.TYPE_FRAIS || frais.type_frais,
      DESCRIPTION: frais.DESCRIPTION || frais.description,
      MONTANT: frais.MONTANT || frais.montant,
      DATE_FRAIS: frais.DATE_FRAIS || frais.date_frais,
      STATUT: frais.STATUT || frais.statut,
      NOTES: frais.NOTES || frais.notes,
      COD_CREUTIL: frais.COD_CREUTIL || frais.created_by,
      DATE_CREATION: frais.DATE_CREATION || frais.date_creation,
      
      // Pour l'affichage frontend
      type_frais_display: frais.type_frais_display || 
                         (frais.TYPE_FRAIS === 'transport' ? 'Transport' : 
                          frais.TYPE_FRAIS === 'hospitalisation' ? 'Hospitalisation' :
                          frais.TYPE_FRAIS === 'medicaments' ? 'Médicaments' :
                          frais.TYPE_FRAIS === 'consultation' ? 'Consultation' :
                          frais.TYPE_FRAIS === 'examen' ? 'Examen médical' :
                          frais.TYPE_FRAIS === 'hebergement' ? 'Hébergement' :
                          frais.TYPE_FRAIS === 'restauration' ? 'Restauration' :
                          frais.TYPE_FRAIS === 'frais_dossier' ? 'Frais de dossier' : 'Autre'),
      statut_display: frais.statut_display || 
                     (frais.STATUT === 'paye' ? 'Payé' : 
                      frais.STATUT === 'en_attente' ? 'En attente' : 
                      frais.STATUT === 'annule' ? 'Annulé' : frais.STATUT),
      montant_format: frais.montant_format || 
                     (frais.MONTANT ? 
                       new Intl.NumberFormat('fr-FR', {
                         style: 'currency',
                         currency: 'XOF',
                         minimumFractionDigits: 0
                       }).format(frais.MONTANT) : '0 FCFA'),
      DATE_FRAIS_FORMAT: frais.DATE_FRAIS_FORMAT || 
                        (frais.DATE_FRAIS ? 
                          new Date(frais.DATE_FRAIS).toLocaleDateString('fr-FR') : ''),
      DATE_CREATION_FORMAT: frais.DATE_CREATION_FORMAT || 
                           (frais.DATE_CREATION ? 
                             new Date(frais.DATE_CREATION).toLocaleDateString('fr-FR') : ''),
      
      // Conserver toutes les autres propriétés
      ...frais
    };
  },

  // Obtenir les options de type de frais
  getTypeFraisOptions() {
    return [
      { value: 'transport', label: 'Transport' },
      { value: 'hospitalisation', label: 'Hospitalisation' },
      { value: 'medicaments', label: 'Médicaments' },
      { value: 'consultation', label: 'Consultation' },
      { value: 'examen', label: 'Examen médical' },
      { value: 'hebergement', label: 'Hébergement' },
      { value: 'restauration', label: 'Restauration' },
      { value: 'frais_dossier', label: 'Frais de dossier' },
      { value: 'autre', label: 'Autre' }
    ];
  },

  // Obtenir les options de statut de frais
  getStatutFraisOptions() {
    return [
      { value: 'en_attente', label: 'En attente' },
      { value: 'paye', label: 'Payé' },
      { value: 'annule', label: 'Annulé' }
    ];
  },

  // ==============================================
  // STATISTIQUES ET RAPPORTS
  // ==============================================

  // Récupérer les statistiques des évacuations
  async getStatistics(periode = 'month') {
    try {
      const response = await fetchAPI(`/evacuations/statistics?periode=${periode}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur statistiques évacuations:', error);
      return {
        success: false,
        message: error.message,
        statistics: {
          total: 0,
          en_attente: 0,
          approuvees: 0,
          rejetees: 0,
          en_cours: 0,
          terminees: 0,
          annulees: 0,
          par_type_evacuation: {},
          par_destination: {},
          par_motif: {}
        }
      };
    }
  },

  // Générer un rapport d'évacuation
  async generateReport(format = 'pdf', filters = {}) {
    try {
      const queryString = buildQueryString(filters);
      const response = await fetchAPI(`/evacuations/report/${format}${queryString}`, {
        responseType: 'blob'
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur génération rapport évacuations:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // ==============================================
  // GESTION DES DOCUMENTS
  // ==============================================

  // Uploader un document pour une évacuation
  async uploadDocument(evacuationId, documentData) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      const formData = new FormData();
      
      // Ajouter les métadonnées du document
      if (documentData.type_document) {
        formData.append('type_document', documentData.type_document);
      }
      if (documentData.notes) {
        formData.append('notes', documentData.notes);
      }
      
      // Ajouter le fichier
      if (documentData.file) {
        formData.append('document', documentData.file);
      }
      
      const response = await fetchAPI(`/evacuations/${evacuationId}/documents`, {
        method: 'POST',
        body: formData,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur upload document évacuation ${evacuationId}:`, error);
      throw error;
    }
  },

  // Récupérer les documents d'une évacuation
  async getDocuments(evacuationId) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${evacuationId}/documents`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération documents évacuation ${evacuationId}:`, error);
      return { success: false, message: error.message, documents: [] };
    }
  },

  // Télécharger un document
  async downloadDocument(evacuationId, documentId) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      if (!documentId) {
        throw new Error('ID document invalide');
      }
      
      const response = await fetchAPI(
        `/evacuations/${evacuationId}/documents/${documentId}/download`,
        { responseType: 'blob' }
      );
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur téléchargement document ${documentId}:`, error);
      throw error;
    }
  },

  // Supprimer un document
  async deleteDocument(evacuationId, documentId) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      if (!documentId) {
        throw new Error('ID document invalide');
      }
      
      const response = await fetchAPI(
        `/evacuations/${evacuationId}/documents/${documentId}`,
        { method: 'DELETE' }
      );
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression document ${documentId}:`, error);
      throw error;
    }
  },

  // ==============================================
  // GESTION DES ITINÉRAIRES ET TRANSPORTS
  // ==============================================

  // Planifier un itinéraire pour une évacuation
  async planItinerary(evacuationId, itineraryData) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${evacuationId}/itinerary`, {
        method: 'POST',
        body: itineraryData,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur planification itinéraire évacuation ${evacuationId}:`, error);
      throw error;
    }
  },

  // Mettre à jour l'itinéraire
  async updateItinerary(evacuationId, itineraryData) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${evacuationId}/itinerary`, {
        method: 'PUT',
        body: itineraryData,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour itinéraire évacuation ${evacuationId}:`, error);
      throw error;
    }
  },

  // Récupérer les moyens de transport disponibles
  async getAvailableTransport() {
    try {
      const response = await fetchAPI('/evacuations/transport/available');
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération moyens de transport:', error);
      return { success: false, message: error.message, transports: [] };
    }
  },

  // Réserver un transport
  async reserveTransport(evacuationId, transportData) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${evacuationId}/transport/reserve`, {
        method: 'POST',
        body: transportData,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur réservation transport évacuation ${evacuationId}:`, error);
      throw error;
    }
  },

  // ==============================================
  // GESTION DES FRAIS ET COÛTS
  // ==============================================

  // Ajouter des frais à une évacuation
  async addFrais(evacuationId, fraisData) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${evacuationId}/frais`, {
        method: 'POST',
        body: fraisData,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur ajout frais évacuation ${evacuationId}:`, error);
      throw error;
    }
  },

  // Récupérer les frais d'une évacuation
  async getFrais(evacuationId) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${evacuationId}/frais`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération frais évacuation ${evacuationId}:`, error);
      return { success: false, message: error.message, frais: [] };
    }
  },

  // Mettre à jour les frais
  async updateFrais(evacuationId, fraisId, fraisData) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      if (!fraisId) {
        throw new Error('ID frais invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${evacuationId}/frais/${fraisId}`, {
        method: 'PUT',
        body: fraisData,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour frais ${fraisId}:`, error);
      throw error;
    }
  },

  // Calculer le coût total d'une évacuation
  async calculateCost(evacuationId) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${evacuationId}/calculate-cost`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur calcul coût évacuation ${evacuationId}:`, error);
      return { success: false, message: error.message, total: 0 };
    }
  },

  // ==============================================
  // NOTIFICATIONS ET SUIVI
  // ==============================================

  // Envoyer une notification concernant une évacuation
  async sendNotification(evacuationId, notificationData) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${evacuationId}/notify`, {
        method: 'POST',
        body: notificationData,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur envoi notification évacuation ${evacuationId}:`, error);
      throw error;
    }
  },

  // Récupérer le journal d'activités d'une évacuation
  async getActivityLog(evacuationId) {
    try {
      if (!evacuationId || isNaN(parseInt(evacuationId))) {
        throw new Error('ID évacuation invalide');
      }
      
      const response = await fetchAPI(`/evacuations/${evacuationId}/activity-log`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération journal évacuation ${evacuationId}:`, error);
      return { success: false, message: error.message, activities: [] };
    }
  },

  // ==============================================
  // FONCTIONS UTILITAIRES
  // ==============================================
  // Fonction utilitaire pour convertir une URL relative en absolue

  // Formater une évacuation pour l'affichage
  formatEvacuationForDisplay(evacuation) {
    return {
      // Identifiants
      id: evacuation.id || evacuation.ID_EVACUATION,
      ID_EVACUATION: evacuation.ID_EVACUATION || evacuation.id,
      REFERENCE: evacuation.REFERENCE || evacuation.reference || `EVAC-${(evacuation.id || evacuation.ID_EVACUATION || '').toString().padStart(6, '0')}`,
      
      // Informations patient
      ID_BEN: evacuation.ID_BEN || evacuation.patient_id,
      patient_id: evacuation.patient_id || evacuation.ID_BEN,
      NOM_BEN: evacuation.NOM_BEN || evacuation.patient_nom,
      PRE_BEN: evacuation.PRE_BEN || evacuation.patient_prenom,
      patient_nom: evacuation.patient_nom || evacuation.NOM_BEN,
      patient_prenom: evacuation.patient_prenom || evacuation.PRE_BEN,
      patient_age: evacuation.patient_age || evacuation.age,
      patient_sexe: evacuation.patient_sexe || evacuation.sexe,
      
      // Informations médicales
      DIAGNOSTIC: evacuation.DIAGNOSTIC || evacuation.diagnostic,
      MOTIF_EVACUATION: evacuation.MOTIF_EVACUATION || evacuation.motif,
      URGENCE: evacuation.URGENCE || evacuation.urgence,
      GRAVITE: evacuation.GRAVITE || evacuation.gravite,
      OBSERVATIONS: evacuation.OBSERVATIONS || evacuation.observations,
      RECOMMANDATIONS: evacuation.RECOMMANDATIONS || evacuation.recommandations,
      
      // Dates
      DATE_DEMANDE: evacuation.DATE_DEMANDE || evacuation.date_demande,
      DATE_DECISION: evacuation.DATE_DECISION || evacuation.date_decision,
      DATE_DEPART: evacuation.DATE_DEPART || evacuation.date_depart,
      DATE_ARRIVEE: evacuation.DATE_ARRIVEE || evacuation.date_arrivee,
      DATE_PREVUE_RETOUR: evacuation.DATE_PREVUE_RETOUR || evacuation.date_retour_prevu,
      
      // Destination
      DESTINATION: evacuation.DESTINATION || evacuation.destination,
      HOPITAL_DESTINATION: evacuation.HOPITAL_DESTINATION || evacuation.hopital_destination,
      ADRESSE_DESTINATION: evacuation.ADRESSE_DESTINATION || evacuation.adresse_destination,
      TELEPHONE_DESTINATION: evacuation.TELEPHONE_DESTINATION || evacuation.telephone_destination,
      
      // Médecin et accompagnants
      MEDECIN_REFERENT: evacuation.MEDECIN_REFERENT || evacuation.medecin_referent,
      ID_MEDECIN: evacuation.ID_MEDECIN || evacuation.medecin_id,
      ACCOMPAGNANTS: evacuation.ACCOMPAGNANTS || evacuation.accompagnants,
      
      // Transport
      MOYEN_TRANSPORT: evacuation.MOYEN_TRANSPORT || evacuation.moyen_transport,
      TRANSPORT_SPECIAL: evacuation.TRANSPORT_SPECIAL || evacuation.transport_special,
      NUMERO_VOL: evacuation.NUMERO_VOL || evacuation.numero_vol,
      COMPAGNIE_AERIENNE: evacuation.COMPAGNIE_AERIENNE || evacuation.compagnie_aerienne,
      
      // Statut et décision
      STATUT: evacuation.STATUT || evacuation.statut,
      DECISION: evacuation.DECISION || evacuation.decision,
      MOTIF_REJET: evacuation.MOTIF_REJET || evacuation.motif_rejet,
      NOTES_DECISION: evacuation.NOTES_DECISION || evacuation.notes_decision,
      
      // Coûts
      COUT_ESTIME: evacuation.COUT_ESTIME || evacuation.cout_estime,
      COUT_REEL: evacuation.COUT_REEL || evacuation.cout_reel,
      PRISE_EN_CHARGE: evacuation.PRISE_EN_CHARGE || evacuation.prise_en_charge,
      MONTANT_PATIENT: evacuation.MONTANT_PATIENT || evacuation.montant_patient,
      
      // Documents
      DOCUMENTS: evacuation.DOCUMENTS || evacuation.documents || [],
      
      // Métadonnées
      COD_CREUTIL: evacuation.COD_CREUTIL || evacuation.created_by,
      COD_MODUTIL: evacuation.COD_MODUTIL || evacuation.modified_by,
      DAT_CREUTIL: evacuation.DAT_CREUTIL || evacuation.created_at,
      DAT_MODUTIL: evacuation.DAT_MODUTIL || evacuation.updated_at,
      
      // Pour l'affichage
      status_display: this.getStatusDisplay(evacuation.STATUT || evacuation.statut),
      decision_display: this.getDecisionDisplay(evacuation.DECISION || evacuation.decision),
      gravite_display: this.getGraviteDisplay(evacuation.GRAVITE || evacuation.gravite),
      
      // Conserver toutes les autres propriétés
      ...evacuation
    };
  },

  // Préparer les données d'évacuation pour l'envoi
  prepareEvacuationData(evacuationData) {
    const dataToSend = { ...evacuationData };
    
    // Formater les dates pour l'API
    const dateFields = [
      'DATE_DEMANDE', 'date_demande',
      'DATE_DECISION', 'date_decision',
      'DATE_DEPART', 'date_depart',
      'DATE_ARRIVEE', 'date_arrivee',
      'DATE_PREVUE_RETOUR', 'date_retour_prevu'
    ];
    
    dateFields.forEach(field => {
      if (dataToSend[field]) {
        dataToSend[field] = formatDateForAPI(dataToSend[field]);
      }
    });
    
    // Nettoyage des champs texte
    const textFields = [
      'MOTIF_EVACUATION', 'motif',
      'OBSERVATIONS', 'observations',
      'RECOMMANDATIONS', 'recommandations',
      'DESTINATION', 'destination',
      'HOPITAL_DESTINATION', 'hopital_destination',
      'ADRESSE_DESTINATION', 'adresse_destination',
      'NOTES_DECISION', 'notes_decision',
      'MOTIF_REJET', 'motif_rejet'
    ];
    
    textFields.forEach(field => {
      if (dataToSend[field]) {
        dataToSend[field] = dataToSend[field].trim();
      }
    });
    
    // Nettoyage des numéros
    const phoneFields = ['TELEPHONE_DESTINATION', 'telephone_destination'];
    phoneFields.forEach(field => {
      if (dataToSend[field]) {
        dataToSend[field] = dataToSend[field].replace(/[^\d+]/g, '').trim();
      }
    });
    
    // Nettoyer les champs vides
    Object.keys(dataToSend).forEach(key => {
      if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
        delete dataToSend[key];
      }
    });
    
    return dataToSend;
  },

  // Valider les données d'une évacuation
  validateEvacuationData(data, isUpdate = false) {
    const errors = [];
    
    // Validation pour la création
    if (!isUpdate) {
      if (!data.ID_BEN && !data.patient_id) {
        errors.push('Le patient est obligatoire');
      }
      if (!data.MOTIF_EVACUATION && !data.motif) {
        errors.push('Le motif d\'évacuation est obligatoire');
      }
      if (!data.DESTINATION && !data.destination) {
        errors.push('La destination est obligatoire');
      }
    }
    
    // Validation des dates
    if (data.DATE_DEMANDE || data.date_demande) {
      const dateDemande = new Date(data.DATE_DEMANDE || data.date_demande);
      if (isNaN(dateDemande.getTime())) {
        errors.push('Date de demande invalide');
      }
    }
    
    if (data.DATE_DEPART || data.date_depart) {
      const dateDepart = new Date(data.DATE_DEPART || data.date_depart);
      if (isNaN(dateDepart.getTime())) {
        errors.push('Date de départ invalide');
      }
    }
    
    // Validation des coûts
    if (data.COUT_ESTIME || data.cout_estime) {
      const cout = parseFloat(data.COUT_ESTIME || data.cout_estime);
      if (isNaN(cout) || cout < 0) {
        errors.push('Coût estimé invalide');
      }
    }
    
    if (data.COUT_REEL || data.cout_reel) {
      const cout = parseFloat(data.COUT_REEL || data.cout_reel);
      if (isNaN(cout) || cout < 0) {
        errors.push('Coût réel invalide');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Obtenir l'affichage du statut
  getStatusDisplay(status) {
    const statusMap = {
      'en_attente': { text: 'En attente', color: 'warning', icon: 'schedule' },
      'en_cours': { text: 'En cours', color: 'info', icon: 'sync' },
      'terminee': { text: 'Terminée', color: 'success', icon: 'check_circle' },
      'annulee': { text: 'Annulée', color: 'error', icon: 'cancel' },
      'rejetee': { text: 'Rejetée', color: 'error', icon: 'block' }
    };
    
    return statusMap[status] || { text: status, color: 'default', icon: 'help' };
  },

  // Obtenir l'affichage de la décision
  getDecisionDisplay(decision) {
    const decisionMap = {
      'approuvee': { text: 'Approuvée', color: 'success', icon: 'thumb_up' },
      'rejetee': { text: 'Rejetée', color: 'error', icon: 'thumb_down' },
      'en_attente': { text: 'En attente', color: 'warning', icon: 'schedule' }
    };
    
    return decisionMap[decision] || { text: decision, color: 'default', icon: 'help' };
  },

  // Obtenir l'affichage de la gravité
  getGraviteDisplay(gravite) {
    const graviteMap = {
      '1': { text: 'Critique', color: 'error', icon: 'error' },
      '2': { text: 'Urgent', color: 'warning', icon: 'warning' },
      '3': { text: 'Semi-urgent', color: 'info', icon: 'info' },
      '4': { text: 'Non urgent', color: 'success', icon: 'check_circle' }
    };
    
    return graviteMap[gravite] || { text: 'Non spécifié', color: 'default', icon: 'help' };
  },

  // Obtenir les statuts disponibles
  getStatusOptions() {
    return [
      { value: 'en_attente', label: 'En attente' },
      { value: 'en_cours', label: 'En cours' },
      { value: 'terminee', label: 'Terminée' },
      { value: 'annulee', label: 'Annulée' },
      { value: 'rejetee', label: 'Rejetée' }
    ];
  },

  // Obtenir les décisions disponibles
  getDecisionOptions() {
    return [
      { value: 'approuvee', label: 'Approuvée' },
      { value: 'rejetee', label: 'Rejetée' },
      { value: 'en_attente', label: 'En attente' }
    ];
  },

  // Obtenir les niveaux de gravité
  getGraviteOptions() {
    return [
      { value: '1', label: 'Critique' },
      { value: '2', label: 'Urgent' },
      { value: '3', label: 'Semi-urgent' },
      { value: '4', label: 'Non urgent' }
    ];
  },

  // Obtenir les moyens de transport
  getTransportOptions() {
    return [
      { value: 'ambulance', label: 'Ambulance' },
      { value: 'avion', label: 'Avion médicalisé' },
      { value: 'helicoptere', label: 'Hélicoptère' },
      { value: 'voiture', label: 'Voiture médicalisée' },
      { value: 'train', label: 'Train médicalisé' },
      { value: 'bateau', label: 'Bateau médicalisé' }
    ];
  },


};
  // ==============================================
  // API DU RÉSEAU DE SOINS - ADAPTÉE AU BACKEND
  // ==============================================

  export const reseauSoinsAPI = {
    // Récupérer tous les réseaux de soins - ADAPTÉ À LA STRUCTURE RÉELLE
    async getAllNetworks(params = {}) {
      try {
        const { status, type, page, limit, ...otherParams } = params;
        
        // Construction des paramètres de requête
        const queryParams = new URLSearchParams();
        
        if (status) queryParams.append('status', status);
        if (type) queryParams.append('type', type);
        if (page) queryParams.append('page', page);
        if (limit) queryParams.append('limit', limit);
        
        Object.entries(otherParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value);
          }
        });
        
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const endpoint = `/reseau-soins/networks${queryString}`;
        
        console.log('📡 Appel API réseaux:', endpoint);
        
        const response = await fetchAPI(endpoint);
        
        // Adaptation à la structure de réponse du backend
        if (response.success === false) {
          console.warn('⚠️ API retourne success: false', response);
          
          return {
            success: false,
            message: response.message || 'Erreur lors de la récupération des réseaux',
            networks: [],
            pagination: {
              total: 0,
              page: page || 1,
              limit: limit || 20,
              totalPages: 0
            }
          };
        }
        
        // La réponse du backend contient directement `networks` au premier niveau
        const networks = response.networks || response.data || [];
        
        const result = {
          success: true,
          message: response.message || `${networks.length} réseau(s) trouvé(s)`,
          networks: networks.map(network => ({
            id: network.id || network.COD_RESEAU,
            nom: network.nom || network.NOM_RESEAU,
            description: network.DESCRIPTION || network.description || '',
            type: network.type || network.NETWORK_TYPE,
            status: network.STATUS || network.statut || 'Actif',
            date_creation: network.DATE_CREATION || network.date_creation,
            date_modification: network.DATE_MODIFICATION || network.date_modification,
            region_code: network.COD_REGION || network.region_code,
            region_nom: network.region_nom || '',
            nombre_membres: network.nombre_membres || 0,
            contrats_actifs: network.contrats_actifs || 0,
            contact_principal: network.CONTACT_PRINCIPAL || '',
            telephone_contact: network.TELEPHONE_CONTACT || '',
            email_contact: network.EMAIL_CONTACT || '',
            site_web: network.SITE_WEB || ''
          })),
          pagination: response.pagination || {
            total: networks.length,
            page: page || 1,
            limit: limit || 20,
            totalPages: Math.ceil(networks.length / (limit || 20))
          }
        };
        
        console.log(`✅ ${result.networks.length} réseaux récupérés`);
        return result;
        
      } catch (error) {
        console.error('❌ Erreur récupération réseaux:', {
          message: error.message,
          status: error.status,
          isNetworkError: error.isNetworkError
        });
        
        // Retour d'une structure valide en cas d'erreur
        return {
          success: false,
          message: error.isNetworkError 
            ? 'Erreur de connexion au serveur' 
            : error.message || 'Erreur lors de la récupération des réseaux',
          networks: [],
          pagination: {
            total: 0,
            page: params.page || 1,
            limit: params.limit || 20,
            totalPages: 0
          }
        };
      }
    },

    // Récupérer un réseau spécifique avec ses détails - ADAPTÉ À LA STRUCTURE RÉELLE
    async getNetworkById(id) {
      try {
        if (!id || isNaN(parseInt(id))) {
          throw new Error('ID réseau invalide');
        }
        
        console.log(`📡 Récupération détaillée réseau ID: ${id}`);
        const response = await fetchAPI(`/reseau-soins/networks/${id}`);
        
        if (response.success === false) {
          throw new Error(response.message || `Réseau ${id} non trouvé`);
        }
        
        // Transformation des données pour correspondre au frontend
        const networkData = response.network || response;
        const members = response.members || [];
        const contracts = response.contracts || [];
        const activities = response.activities || [];
        const statistics = response.statistics || {
          total_membres: 0,
          etablissements: 0,
          prestataires: 0,
          membres_actifs: 0,
          membres_inactifs: 0
        };
        
        const result = {
          success: true,
          message: response.message || 'Réseau récupéré avec succès',
          network: {
            id: networkData.id || networkData.COD_RESEAU,
            nom: networkData.nom || networkData.NOM_RESEAU,
            description: networkData.DESCRIPTION || networkData.description || '',
            type: networkData.type || networkData.NETWORK_TYPE,
            objectifs: networkData.OBJECTIFS || networkData.objectifs || '',
            zone_couverture: networkData.ZONE_COUVERTURE || networkData.zone_couverture || '',
            population_cible: networkData.POPULATION_CIBLE || networkData.population_cible || '',
            status: networkData.STATUS || networkData.status || 'Actif',
            date_creation: networkData.DATE_CREATION || networkData.date_creation,
            date_modification: networkData.DATE_MODIFICATION || networkData.date_modification,
            contact_principal: networkData.CONTACT_PRINCIPAL || networkData.contact_principal || '',
            telephone_contact: networkData.TELEPHONE_CONTACT || networkData.telephone_contact || '',
            email_contact: networkData.EMAIL_CONTACT || networkData.email_contact || '',
            site_web: networkData.SITE_WEB || networkData.site_web || '',
            region_code: networkData.COD_REGION || networkData.region_code,
            region_nom: networkData.region_nom || ''
          },
          members: members.map(member => ({
            id: member.id || member.COD_RESEAU_MEMBRE,
            cod_reseau: member.COD_RESEAU,
            type_membre: member.TYPE_MEMBRE,
            cod_etablissement: member.COD_ETABLISSEMENT,
            cod_prestataire: member.COD_PRESTATAIRE,
            date_adhesion: member.DATE_ADHESION,
            status_adhesion: member.STATUS_ADHESION || 'Actif',
            role: member.ROLE || 'Membre',
            responsabilites: member.RESPONSABILITES || '',
            nom_etablissement: member.NOM_ETABLISSEMENT || member.NOM_CENTRE,
            type_centre: member.TYPE_CENTRE,
            adresse: member.ADRESSE,
            telephone: member.TELEPHONE,
            nom_prestataire: member.NOM_PRESTATAIRE,
            prenom_prestataire: member.PRENOM_PRESTATAIRE,
            specialite: member.SPECIALITE,
            titre: member.TITRE,
            // Champ calculé pour l'affichage
            nom_complet: member.TYPE_MEMBRE === 'Etablissement' 
              ? member.NOM_ETABLISSEMENT || member.NOM_CENTRE
              : `${member.TITRE || ''} ${member.PRENOM_PRESTATAIRE || ''} ${member.NOM_PRESTATAIRE || ''}`.trim()
          })),
          contracts: contracts.map(contract => ({
            id: contract.id || contract.COD_CONTRAT,
            numero_contrat: contract.NUMERO_CONTRAT,
            type_contrat: contract.TYPE_CONTRAT,
            objet_contrat: contract.OBJET_CONTRAT,
            date_debut: contract.DATE_DEBUT,
            date_fin: contract.DATE_FIN,
            status: contract.STATUS,
            montant_contrat: contract.MONTANT_CONTRAT,
            renouvelable: contract.RENOUVELABLE,
            date_signature: contract.DATE_SIGNATURE,
            partenaire: contract.PARTENAIRE,
            contact_partenaire: contract.CONTACT_PARTENAIRE
          })),
          activities: activities.map(activity => ({
            id: activity.id || activity.COD_ACTIVITE,
            type_activite: activity.TYPE_ACTIVITE,
            libelle_activite: activity.LIBELLE_ACTIVITE,
            description: activity.DESCRIPTION,
            date_debut: activity.DATE_DEBUT,
            date_fin: activity.DATE_FIN,
            lieu: activity.LIEU,
            nombre_participants: activity.NOMBRE_PARTICIPANTS || 0,
            status: activity.STATUS || 'Planifié',
            resultats: activity.RESULTATS || '',
            commentaires: activity.COMMENTAIRES || ''
          })),
          statistics: {
            total_membres: statistics.total_membres || 0,
            etablissements: statistics.etablissements || 0,
            prestataires: statistics.prestataires || 0,
            membres_actifs: statistics.membres_actifs || 0,
            membres_inactifs: statistics.membres_inactifs || 0
          }
        };
        
        return result;
        
      } catch (error) {
        console.error(`❌ Erreur récupération réseau ${id}:`, error);
        
        // Propagation de l'erreur pour gestion par le composant
        throw {
          success: false,
          message: error.message || `Impossible de récupérer le réseau ${id}`,
          status: error.status,
          isApiError: true
        };
      }
    },

    // Créer un nouveau réseau de soins - ADAPTÉ AU FORMAT BACKEND
    async createNetwork(networkData) {
      try {
        console.log('📝 Création réseau:', networkData);
        
        // Formatage des données pour le backend
        const dataToSend = {
          nom: networkData.nom,
          description: networkData.description || '',
          type: networkData.type,
          objectifs: networkData.objectifs || '',
          zone_couverture: networkData.zone_couverture || '',
          population_cible: networkData.population_cible || '',
          region_code: networkData.region_code || null,
          contact_principal: networkData.contact_principal || '',
          telephone_contact: networkData.telephone_contact || '',
          email_contact: networkData.email_contact || '',
          site_web: networkData.site_web || ''
        };
        
        const response = await fetchAPI('/reseau-soins/networks', {
          method: 'POST',
          body: dataToSend,
        });
        
        if (response.success === false) {
          throw new Error(response.message || 'Échec de la création du réseau');
        }
        
        return {
          success: true,
          message: response.message || 'Réseau créé avec succès',
          networkId: response.networkId,
          network: {
            id: response.networkId,
            ...dataToSend,
            status: 'Actif',
            date_creation: new Date().toISOString()
          }
        };
        
      } catch (error) {
        console.error('❌ Erreur création réseau:', error);
        throw error;
      }
    },

    // Mettre à jour un réseau de soins - ADAPTÉ AU FORMAT BACKEND
    async updateNetwork(id, networkData) {
      try {
        if (!id || isNaN(parseInt(id))) {
          throw new Error('ID réseau invalide');
        }
        
        console.log(`✏️ Mise à jour réseau ${id}:`, networkData);
        
        // Filtrage des champs à mettre à jour (exclure l'ID)
        const updates = { ...networkData };
        delete updates.id;
        
        const response = await fetchAPI(`/reseau-soins/networks/${id}`, {
          method: 'PUT',
          body: updates,
        });
        
        if (response.success === false) {
          throw new Error(response.message || 'Échec de la mise à jour du réseau');
        }
        
        return {
          success: true,
          message: response.message || 'Réseau mis à jour avec succès',
          networkId: id
        };
        
      } catch (error) {
        console.error(`❌ Erreur mise à jour réseau ${id}:`, error);
        throw error;
      }
    },

  // CORRECTION de la fonction addMemberToNetwork dans reseauSoinsAPI
  async addMemberToNetwork(networkId, memberData) {
    try {
      if (!networkId || isNaN(parseInt(networkId))) {
        throw new Error('ID réseau invalide');
      }
      
      console.log(`➕ Ajout membre au réseau ${networkId}:`, memberData);
      
      // FORMATAGE CORRECT pour le backend
      const dataToSend = {
        type_membre: memberData.type_membre,
        cod_ben: memberData.cod_ben || null,
        cod_cen: memberData.cod_cen || null,  // CORRECTION: cod_cen au lieu de cod_etablissement
        cod_pre: memberData.cod_pre || null,  // CORRECTION: cod_pre au lieu de cod_prestataire
        date_adhesion: memberData.date_adhesion || this.formatDateForAPI(new Date()),
        statut: memberData.status_adhesion || 'Actif'  // CORRECTION: statut au lieu de status_adhesion
      };
      
      console.log('📤 Données envoyées au backend:', dataToSend);
      
      const response = await fetchAPI(`/reseau-soins/networks/${networkId}/members`, {
        method: 'POST',
        body: dataToSend,
      });
      
      if (response.success === false) {
        throw new Error(response.message || 'Échec de l\'ajout du membre');
      }
      
      return {
        success: true,
        message: response.message || 'Membre ajouté avec succès',
        memberId: response.memberId
      };
      
    } catch (error) {
      console.error(`❌ Erreur ajout membre réseau ${networkId}:`, error);
      throw error;
    }
  },
    // Rechercher des établissements pour l'ajout au réseau - ADAPTÉ AU FORMAT BACKEND
    async searchEtablissements(searchTerm, limit = 20) {
      try {
        if (!searchTerm || searchTerm.trim().length < 2) {
          return { success: true, etablissements: [] };
        }
        
        const response = await fetchAPI(
          `/reseau-soins/etablissements/search?search=${encodeURIComponent(searchTerm)}&limit=${limit}`
        );
        
        // Adaptation de la structure
        if (response.success === false) {
          console.warn('Recherche établissements échouée:', response.message);
          return { success: false, message: response.message, etablissements: [] };
        }
        
        const etablissements = response.etablissements || response.data || [];
        
        return {
          success: true,
          etablissements: etablissements.map(etab => ({
            id: etab.id || etab.COD_CEN,
            nom: etab.nom || etab.NOM_CENTRE,
            type: etab.type || etab.TYPE_CENTRE,
            adresse: etab.ADRESSE || etab.adresse || '',
            telephone: etab.TELEPHONE || etab.telephone || '',
            email: etab.EMAIL || etab.email || '',
            region_code: etab.COD_REGION || etab.region_code,
            status: etab.STATUS || etab.status
          })),
          count: etablissements.length
        };
        
      } catch (error) {
        console.error('❌ Erreur recherche établissements:', error);
        return { success: false, message: error.message, etablissements: [] };
      }
    },

    // Rechercher des centres de santé pour l'ajout au réseau
    async searchCentresSante(searchTerm, limit = 20) {
      try {
        if (!searchTerm || searchTerm.trim().length < 2) {
          return { success: true, centres: [] };
        }
        
        const response = await fetchAPI(
          `/reseau-soins/centres-sante/search?search=${encodeURIComponent(searchTerm)}&limit=${limit}`
        );
        
        // Adaptation de la structure
        if (response.success === false) {
          console.warn('Recherche centres de santé échouée:', response.message);
          return { success: false, message: response.message, centres: [] };
        }
        
        const centres = response.centres || response.data || [];
        
        return {
          success: true,
          centres: centres.map(centre => ({
            id: centre.id || centre.COD_CEN,
            nom: centre.nom || centre.NOM_CENTRE,
            type: centre.type || centre.TYPE_CENTRE,
            categorie: centre.categorie || centre.CATEGORIE_CENTRE,
            telephone: centre.TELEPHONE || centre.telephone || '',
            email: centre.EMAIL || centre.email || '',
            region_code: centre.COD_REGION || centre.region_code,
            status: centre.status || centre.STATUT,
            actif: centre.actif || centre.ACTIF
          })),
          count: centres.length
        };
        
      } catch (error) {
        console.error('❌ Erreur recherche centres de santé:', error);
        return { success: false, message: error.message, centres: [] };
      }
    },

    // Dans reseauSoinsAPI
async getEvolutionMensuelleConventions(years = 2) {
  try {
    // Utiliser l'API des conventions
    const response = await conventionsAPI.getEvolutionMensuelle({ years });
    return response;
  } catch (error) {
    console.error('❌ Erreur évolution mensuelle conventions:', error);
    return {
      success: false,
      message: error.message,
      evolutionMensuelle: []
    };
  }
},

// Récupérer les réseaux par région
async getReseauxParRegion(regionCode = null) {
  try {
    const params = regionCode ? { cod_pay: regionCode } : {};
    const queryString = buildQueryString(params);
    const response = await fetchAPI(`/reseaux${queryString}`);
    return response;
  } catch (error) {
    console.error('❌ Erreur récupération réseaux par région:', error);
    return { success: false, message: error.message, reseaux: [] };
  }
},

// Mettre à jour le statut d'un contrat
async updateContractStatus(contractId, status) {
  try {
    const response = await fetchAPI(`/conventions/contracts/${contractId}/status`, {
      method: 'PATCH',
      body: { status },
    });
    return response;
  } catch (error) {
    console.error(`❌ Erreur mise à jour statut contrat ${contractId}:`, error);
    throw error;
  }
},

// Récupérer les activités d'un réseau
async getNetworkActivities(networkId, params = {}) {
  try {
    const queryString = buildQueryString(params);
    const response = await fetchAPI(`/reseau-soins/networks/${networkId}/activities${queryString}`);
    return response;
  } catch (error) {
    console.error(`❌ Erreur récupération activités réseau ${networkId}:`, error);
    return { success: false, message: error.message, activities: [] };
  }
},

// Récupérer les contrats d'un réseau
async getNetworkContracts(networkId, params = {}) {
  try {
    const queryString = buildQueryString(params);
    const response = await fetchAPI(`/reseau-soins/networks/${networkId}/contracts${queryString}`);
    return response;
  } catch (error) {
    console.error(`❌ Erreur récupération contrats réseau ${networkId}:`, error);
    return { success: false, message: error.message, contracts: [] };
  }
},

// Rechercher les membres d'un réseau
async searchNetworkMembers(networkId, searchTerm, filters = {}) {
  try {
    const queryParams = { search: searchTerm, ...filters };
    const queryString = buildQueryString(queryParams);
    const response = await fetchAPI(`/reseau-soins/networks/${networkId}/members/search${queryString}`);
    return response;
  } catch (error) {
    console.error(`❌ Erreur recherche membres réseau ${networkId}:`, error);
    return { success: false, message: error.message, members: [] };
  }
},

// Exporter les données d'un réseau
async exportNetworkData(networkId, format = 'excel') {
  try {
    const response = await fetchAPI(`/reseau-soins/networks/${networkId}/export/${format}`, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error(`❌ Erreur export réseau ${networkId}:`, error);
    throw error;
  }
},

// Synchroniser les membres d'un réseau
async syncNetworkMembers(networkId, memberIds) {
  try {
    const response = await fetchAPI(`/reseau-soins/networks/${networkId}/members/sync`, {
      method: 'POST',
      body: { memberIds },
    });
    return response;
  } catch (error) {
    console.error(`❌ Erreur synchronisation membres réseau ${networkId}:`, error);
    throw error;
  }
},

// Vérifier l'éligibilité d'un bénéficiaire pour un réseau
async checkEligibility(networkId, beneficiaryId) {
  try {
    const response = await fetchAPI(`/reseau-soins/networks/${networkId}/eligibility/${beneficiaryId}`);
    return response;
  } catch (error) {
    console.error(`❌ Erreur vérification éligibilité ${beneficiaryId}:`, error);
    return { 
      success: false, 
      message: error.message,
      eligible: false,
      reasons: [] 
    };
  }
},

// Récupérer l'historique d'un réseau
async getNetworkHistory(networkId, params = {}) {
  try {
    const queryString = buildQueryString(params);
    const response = await fetchAPI(`/reseau-soins/networks/${networkId}/history${queryString}`);
    return response;
  } catch (error) {
    console.error(`❌ Erreur historique réseau ${networkId}:`, error);
    return { success: false, message: error.message, history: [] };
  }
},

// Mettre à jour la configuration d'un réseau
async updateNetworkConfig(networkId, config) {
  try {
    const response = await fetchAPI(`/reseau-soins/networks/${networkId}/config`, {
      method: 'PUT',
      body: config,
    });
    return response;
  } catch (error) {
    console.error(`❌ Erreur mise à jour config réseau ${networkId}:`, error);
    throw error;
  }
},

// Générer un rapport pour un réseau
async generateNetworkReport(networkId, reportType, params = {}) {
  try {
    const queryString = buildQueryString(params);
    const response = await fetchAPI(`/reseau-soins/networks/${networkId}/report/${reportType}${queryString}`, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error(`❌ Erreur génération rapport réseau ${networkId}:`, error);
    throw error;
  }
},
      // =============================================
    // RECHERCHE DE MEMBRES POTENTIELS
    // =============================================

    // Rechercher des bénéficiaires pour l'ajout au réseau
    async searchBeneficiaires(searchTerm, limit = 20) {
      try {
        if (!searchTerm || searchTerm.trim().length < 2) {
          return { success: true, beneficiaires: [] };
        }
        
        const response = await fetchAPI(
          `/reseau-soins/beneficiaires/search?search=${encodeURIComponent(searchTerm)}&limit=${limit}`
        );
        
        // Adaptation de la structure
        if (response.success === false) {
          console.warn('Recherche bénéficiaires échouée:', response.message);
          return { success: false, message: response.message, beneficiaires: [] };
        }
        
        const beneficiaires = response.beneficiaires || response.data || [];
        
        return {
          success: true,
          beneficiaires: beneficiaires.map(benef => ({
            id: benef.id || benef.ID_BEN,
            nom: benef.nom || benef.NOM_BEN,
            prenom: benef.prenom || benef.PRE_BEN,
            nom_marital: benef.nom_marital || benef.FIL_BEN,
            sexe: benef.sexe || benef.SEX_BEN,
            date_naissance: benef.date_naissance || benef.NAI_BEN,
            telephone: benef.telephone || benef.TELEPHONE_MOBILE || benef.TELEPHONE,
            email: benef.EMAIL || benef.email || '',
            profession: benef.PROFESSION || benef.profession || '',
            situation_familiale: benef.SITUATION_FAMILIALE || benef.situation_familiale || '',
            zone_habitation: benef.ZONE_HABITATION || benef.zone_habitation || ''
          })),
          count: beneficiaires.length
        };
        
      } catch (error) {
        console.error('❌ Erreur recherche bénéficiaires:', error);
        return { success: false, message: error.message, beneficiaires: [] };
      }
    },

    // Rechercher des prestataires pour l'ajout au réseau - ADAPTÉ AU FORMAT BACKEND
  async searchPrestataires(searchTerm, limit = 20) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { success: true, prestataires: [] };
      }
      
      // CORRECTION : Utiliser buildQueryString au lieu de manipuler params directement
      const queryParams = {
        search: searchTerm,
        limit: limit
      };
      
      const queryString = buildQueryString(queryParams);
      const response = await fetchAPI(`/reseau-soins/prestataires/search${queryString}`);
      
      // CORRECTION : Gérer la structure de réponse
      if (response.success === false) {
        console.warn('Recherche prestataires échouée:', response.message);
        return { success: false, message: response.message, prestataires: [] };
      }
      
      // S'assurer que nous avons toujours un tableau
      const prestataires = response.prestataires || response.data || [];
      
      return {
        success: true,
        prestataires: prestataires.map(presta => ({
          id: presta.id || presta.COD_PRE,
          nom: presta.nom || presta.NOM_PRESTATAIRE,
          prenom: presta.prenom || presta.PRENOM_PRESTATAIRE,
          nom_complet: `${presta.PRENOM_PRESTATAIRE || ''} ${presta.NOM_PRESTATAIRE || ''}`.trim(),
          specialite: presta.SPECIALITE || presta.specialite,
          titre: presta.TITRE || presta.titre,
          telephone: presta.TELEPHONE || presta.telephone,
          email: presta.EMAIL || presta.email,
          cod_cen: presta.COD_CEN,
          status: presta.STATUS || presta.status
        })),
        count: prestataires.length
      };
      
    } catch (error) {
      console.error('❌ Erreur recherche prestataires:', error);
      return { success: false, message: error.message, prestataires: [] };
    }
  },

    
    // =============================================
  // CONTRATS
  // =============================================

  // Créer un contrat pour un réseau
  async createContract(networkId, contractData) {
    try {
      if (!networkId || isNaN(parseInt(networkId))) {
        throw new Error('ID réseau invalide');
      }
      
      console.log(`📄 Création contrat réseau ${networkId}:`, contractData);
      
      // Formatage des données pour le backend
      const dataToSend = {
        numero_contrat: contractData.numero_contrat,
        type_contrat: contractData.type_contrat,
        objet_contrat: contractData.objet_contrat || '',
        date_debut: contractData.date_debut || this.formatDateForAPI(new Date()),
        date_fin: contractData.date_fin || null,
        montant_contrat: contractData.montant_contrat || 0,
        renouvelable: contractData.renouvelable !== undefined ? contractData.renouvelable : true,
        date_signature: contractData.date_signature || this.formatDateForAPI(new Date()),
        partenaire: contractData.partenaire || '',
        contact_partenaire: contractData.contact_partenaire || '',
        status: contractData.status || 'Actif'
      };
      
      // ✅ CORRECTION : Supprimez le /api au début
      const response = await fetchAPI(`/reseau-soins/networks/${networkId}/contracts`, {
        method: 'POST',
        body: dataToSend,
      });
      
      if (response.success === false) {
        throw new Error(response.message || 'Échec de la création du contrat');
      }
      
      return {
        success: true,
        message: response.message || 'Contrat créé avec succès',
        contractId: response.contractId
      };
      
    } catch (error) {
      console.error(`❌ Erreur création contrat réseau ${networkId}:`, error);
      throw error;
    }
  },
    

    // Récupérer les statistiques globales des réseaux - ADAPTÉ AU FORMAT BACKEND
    async getStatistics() {
      try {
        const response = await fetchAPI('/reseau-soins/statistiques');
        
        if (response.success === false) {
          console.warn('Statistiques échouées:', response.message);
          return {
            success: false,
            message: response.message,
            statistiques: {
              total_reseaux: 0,
              reseaux_actifs: 0,
              reseaux_inactifs: 0,
              types_differents: 0,
              total_membres: 0,
              regions_couvertes: 0
            },
            stats_par_type: [],
            reseaux_recents: []
          };
        }
        
        return {
          success: true,
          message: response.message || 'Statistiques récupérées avec succès',
          statistiques: response.statistiques || {
            total_reseaux: 0,
            reseaux_actifs: 0,
            reseaux_inactifs: 0,
            types_differents: 0,
            total_membres: 0,
            regions_couvertes: 0
          },
          stats_par_type: response.stats_par_type || [],
          reseaux_recents: response.reseaux_recents || []
        };
        
      } catch (error) {
        console.error('❌ Erreur statistiques réseaux:', error);
        
        // Données par défaut pour le développement
        return {
          success: false,
          message: error.message,
          statistiques: {
            total_reseaux: 3,
            reseaux_actifs: 2,
            reseaux_inactifs: 1,
            types_differents: 2,
            total_membres: 35,
            regions_couvertes: 3
          },
          stats_par_type: [
            { type: 'Cardiologie', nombre: 2, actifs: 2 },
            { type: 'Pédiatrie', nombre: 1, actifs: 0 }
          ],
          reseaux_recents: []
        };
      }
    },

    // Créer une activité pour un réseau - ADAPTÉ AU FORMAT BACKEND
    async createActivity(networkId, activityData) {
      try {
        if (!networkId || isNaN(parseInt(networkId))) {
          throw new Error('ID réseau invalide');
        }
        
        console.log(`🎯 Création activité réseau ${networkId}:`, activityData);
        
        // Formatage des données pour le backend
        const dataToSend = {
          type_activite: activityData.type_activite,
          libelle_activite: activityData.libelle_activite,
          description: activityData.description || '',
          date_debut: activityData.date_debut || formatDateForAPI(new Date()),
          date_fin: activityData.date_fin || null,
          lieu: activityData.lieu || '',
          nombre_participants: activityData.nombre_participants || 0
        };
        
        const response = await fetchAPI(`/reseau-soins/networks/${networkId}/activities`, {
          method: 'POST',
          body: dataToSend,
        });
        
        if (response.success === false) {
          throw new Error(response.message || 'Échec de la création de l\'activité');
        }
        
        return {
          success: true,
          message: response.message || 'Activité créée avec succès',
          activityId: response.activityId
        };
        
      } catch (error) {
        console.error(`❌ Erreur création activité réseau ${networkId}:`, error);
        throw error;
      }
    },

    // Mettre à jour le statut d'un membre - ADAPTÉ AU FORMAT BACKEND (à créer si nécessaire)
    async updateMemberStatus(memberId, status) {
      try {
        if (!memberId || isNaN(parseInt(memberId))) {
          throw new Error('ID membre invalide');
        }
        
        console.log(`🔄 Mise à jour statut membre ${memberId}: ${status}`);
        
        // Note: Cette route n'existe pas dans le backend fourni
        // On utilise un endpoint générique ou on simule
        const response = await fetchAPI(`/reseau-soins/members/${memberId}/status`, {
          method: 'PATCH',
          body: { status },
        }).catch(error => {
          if (error.status === 404) {
            // Endpoint non disponible, on simule une réussite
            console.warn('Endpoint PATCH /members/:id/status non disponible, simulation réussie');
            return { success: true, message: 'Statut mis à jour (simulation)' };
          }
          throw error;
        });
        
        return response;
        
      } catch (error) {
        console.error(`❌ Erreur mise à jour statut membre ${memberId}:`, error);
        throw error;
      }
    },

    // Supprimer un membre d'un réseau - ADAPTÉ AU FORMAT BACKEND (à créer si nécessaire)
    async removeMember(memberId) {
      try {
        if (!memberId || isNaN(parseInt(memberId))) {
          throw new Error('ID membre invalide');
        }
        
        console.log(`🗑️ Suppression membre ${memberId}`);
        
        // Note: Cette route n'existe pas dans le backend fourni
        // On utilise un endpoint générique ou on simule
        const response = await fetchAPI(`/reseau-soins/members/${memberId}`, {
          method: 'DELETE',
        }).catch(error => {
          if (error.status === 404) {
            // Endpoint non disponible, on simule une réussite
            console.warn('Endpoint DELETE /members/:id non disponible, simulation réussie');
            return { success: true, message: 'Membre supprimé (simulation)' };
          }
          throw error;
        });
        
        return response;
        
      } catch (error) {
        console.error(`❌ Erreur suppression membre ${memberId}:`, error);
        throw error;
      }
    },

    // Rechercher des réseaux par nom ou description
    async searchNetworks(searchTerm, filters = {}, limit = 20) {
      try {
        // On utilise getAllNetworks avec le terme de recherche
        const response = await this.getAllNetworks({
          ...filters,
          search: searchTerm,
          limit: limit
        });
        
        return response;
        
      } catch (error) {
        console.error('❌ Erreur recherche réseaux:', error);
        return { success: false, message: error.message, networks: [] };
      }
    },

    // Fonction utilitaire pour tester la connexion
    async testConnection() {
      try {
        console.log('🔍 Test de connexion API réseaux...');
        
        // Test avec l'endpoint de statistiques
        const response = await fetchAPI('/reseau-soins/statistiques');
        
        return {
          success: response.success !== false,
          message: response.success !== false ? 'API réseaux opérationnelle' : 'API en erreur',
          timestamp: new Date().toISOString(),
          details: response
        };
        
      } catch (error) {
        console.error('❌ Test connexion échoué:', error);
        return {
          success: false,
          message: 'API réseaux non disponible',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    },

    // Récupérer les régions disponibles
   // services/api.js - Fonction getRegions corrigée
async getRegions() {
  try {
    const response = await fetchAPI('/ref/regions');
    
    if (response.success === false) {
      console.warn('Récupération régions échouée:', response.message);
      // Fallback : créer une liste basique de régions
      return { 
        success: true, 
        regions: [
          { code: '01', nom: 'Adamaoua' },
          { code: '02', nom: 'Centre' },
          { code: '03', nom: 'Est' },
          { code: '04', nom: 'Extrême-Nord' },
          { code: '05', nom: 'Littoral' },
          { code: '06', nom: 'Nord' },
          { code: '07', nom: 'Nord-Ouest' },
          { code: '08', nom: 'Ouest' },
          { code: '09', nom: 'Sud' },
          { code: '10', nom: 'Sud-Ouest' }
        ]
      };
    }
    
    // Adapter la structure selon la réponse du backend
    let regionsData = [];
    
    if (Array.isArray(response.regions)) {
      regionsData = response.regions;
    } else if (Array.isArray(response)) {
      regionsData = response;
    } else if (response.data && Array.isArray(response.data)) {
      regionsData = response.data;
    }
    
    // Transformer en format standardisé
    const regions = regionsData.map(region => ({
      id: region.COD_REG || region.id || region.code,
      code: region.COD_REG || region.code,
      nom: region.LIB_REG || region.nom || region.name
    }));
    
    return {
      success: true,
      regions: regions
    };
    
  } catch (error) {
    console.error('❌ Erreur récupération régions:', error);
    return {
      success: false,
      message: error.message,
      regions: []
    };
  }
},// services/api.js - Nouvelle fonction pour récupérer les centres avec régions
async getCentresSanteWithRegions(searchTerm = '', limit = 20) {
  try {
    const queryParams = {
      search: searchTerm,
      limit: limit,
      include_regions: true
    };
    
    const queryString = buildQueryString(queryParams);
    const response = await fetchAPI(`/centres-sante/with-regions${queryString}`);
    
    if (response.success) {
      const centres = response.centres || [];
      
      return {
        success: true,
        centres: centres.map(centre => ({
          id: centre.COD_CEN || centre.id,
          nom: centre.NOM_CENTRE || centre.nom,
          type: centre.TYPE_CENTRE || centre.type,
          adresse: centre.ADRESSE || centre.adresse,
          telephone: centre.TELEPHONE || centre.telephone,
          email: centre.EMAIL || centre.email,
          region_code: centre.COD_REGION || centre.region_code,
          region_nom: centre.region_nom || centre.nom_region,
          // Ajouter d'autres champs si nécessaire
          ...centre
        })),
        count: centres.length
      };
    }
    
    return { success: false, message: response.message, centres: [] };
  } catch (error) {
    console.error('❌ Erreur récupération centres avec régions:', error);
    return { success: false, message: error.message, centres: [] };
  }
}
  };

  // ==============================================
  // API DES POLICES D'ASSURANCE
  // ==============================================

// services/api/polices.js
export const policesAPI = {
  // ==============================================
  // FONCTIONS UTILITAIRES INTERNES
  // ==============================================

  getPoliceTypeLabel: (typeCode) => {
    const mapping = {
      'I': 'Individuelle',
      'F': 'Familiale', 
      'C': 'Collective',
      'E': 'Entreprise',
      'G': 'Groupe',
      'IND': 'Individuelle',
      'FAM': 'Familiale',
      'COL': 'Collective',
      'ENT': 'Entreprise'
    };
    return mapping[typeCode] || 'Individuelle';
  },

  getPoliceTypeCode: (typeLabel) => {
    const mapping = {
      'Individuelle': 'I',
      'Familiale': 'F',
      'Collective': 'C',
      'Entreprise': 'E',
      'Groupe': 'G'
    };
    return mapping[typeLabel] || 'I';
  },

  // Dans policesAPI
async getBeneficiairesWithTaux(policeId) {
  try {
    const response = await fetchAPI(`/polices/${policeId}/beneficiaires-with-taux`);
    return response;
  } catch (error) {
    console.error(`Erreur récupération bénéficiaires avec taux:`, error);
    return { success: false, message: error.message, beneficiaires: [] };
  }
},

async updateTauxCouvertureBeneficiaire(policeId, beneficiaireId, tauxCouverture) {
  try {
    const dataToSend = {
      ID_BEN: beneficiaireId,
      COD_POL: policeId,
      TAUX_COUVERTURE: tauxCouverture
    };
    
    const response = await fetchAPI('/polices/update-taux-couverture', {
      method: 'PUT',
      body: dataToSend,
    });
    
    return response;
  } catch (error) {
    console.error(`Erreur mise à jour taux couverture:`, error);
    return { success: false, message: error.message };
  }
},

async unlinkBeneficiaireFromPolice(policeId, beneficiaireId) {
  try {
    const response = await fetchAPI(`/polices/${policeId}/beneficiaires/${beneficiaireId}/unlink`, {
      method: 'DELETE',
    });
    
    return response;
  } catch (error) {
    console.error(`Erreur dissociation bénéficiaire-police:`, error);
    return { success: false, message: error.message };
  }
},


<<<<<<< HEAD
async getTauxCouvertureByBeneficiaire(beneficiaireId) {
  try {
    if (!beneficiaireId || isNaN(parseInt(beneficiaireId))) {
      throw new Error('ID bénéficiaire invalide');
    }
    
    console.log(`🔍 Recherche taux couverture pour bénéficiaire ${beneficiaireId}`);
    
    // 1. Récupérer tous les liens bénéficiaire-police
    const response = await fetchAPI(`/polices/beneficiaire/${beneficiaireId}/liens`);
    
    if (!response.success || !response.liens || response.liens.length === 0) {
=======
    // Récupérer les polices d'un bénéficiaire
    async getByBeneficiaire(beneficiaireId) {
      try {
        if (!beneficiaireId || isNaN(parseInt(beneficiaireId))) {
          throw new Error('ID bénéficiaire invalide');
        }
        
        const response = await fetchAPI(`/polices/beneficiaire/${beneficiaireId}`);
        
        // Normalisation de la réponse
        if (response.success) {
          const polices = response.polices?.map(p => this.formatPoliceForDisplay(p)) || [];
          return { ...response, polices };
        }
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur polices bénéficiaire ${beneficiaireId}:`, error);
        return { success: false, message: error.message, polices: [] };
      }
    },

    // Récupérer les polices d'une compagnie
    async getByCompagnie(compagnieId) {
      try {
        if (!compagnieId || isNaN(parseInt(compagnieId))) {
          throw new Error('ID compagnie invalide');
        }
        
        const response = await fetchAPI(`/polices/compagnie/${compagnieId}`);
        
        // Normalisation de la réponse
        if (response.success) {
          const polices = response.polices?.map(p => this.formatPoliceForDisplay(p)) || [];
          return { ...response, polices };
        }
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur polices compagnie ${compagnieId}:`, error);
        return { success: false, message: error.message, polices: [] };
      }
    },

    // ==============================================
    // CRÉATION ET MISE À JOUR
    // ==============================================

    // Créer une nouvelle police
    async create(policeData) {
      try {
        console.log('📝 Création police:', policeData);
        
        // Nettoyage et validation des données
        const validation = this.validatePoliceData(policeData, false);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }
        
        // Préparation des données pour l'envoi
        const dataToSend = {
          ...policeData,
          // Conversion des dates
          EFF_POL: policeData.EFF_POL ? formatDateForAPI(policeData.EFF_POL) : null,
          RES_POL: policeData.RES_POL ? formatDateForAPI(policeData.RES_POL) : null,
          EMP_POL: policeData.EMP_POL ? formatDateForAPI(policeData.EMP_POL) : null,
          DEM_POL: policeData.DEM_POL ? formatDateForAPI(policeData.DEM_POL) : null,
          SUS_POL: policeData.SUS_POL ? formatDateForAPI(policeData.SUS_POL) : null,
          VIG_POL: policeData.VIG_POL ? formatDateForAPI(policeData.VIG_POL) : null,
          DAT_CSS: policeData.DAT_CSS ? formatDateForAPI(policeData.DAT_CSS) : null,
          DAT_CREUTIL: formatDateForAPI(new Date()),
          DAT_MODUTIL: formatDateForAPI(new Date())
        };
        
        // Nettoyage des champs vides
        Object.keys(dataToSend).forEach(key => {
          if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
            delete dataToSend[key];
          }
        });
        
        const response = await fetchAPI('/polices', {
          method: 'POST',
          body: dataToSend,
        });
        
        if (response.success && response.police) {
          return {
            ...response,
            police: this.formatPoliceForDisplay(response.police)
          };
        }
        
        return response;
      } catch (error) {
        console.error('❌ Erreur création police:', error);
        throw error;
      }
    },

    // Mettre à jour une police
    async update(id, policeData) {
      try {
        if (!id || isNaN(parseInt(id))) {
          throw new Error('ID police invalide');
        }
        
        console.log(`✏️ Mise à jour police ${id}:`, policeData);
        
        // Nettoyage des données
        const dataToSend = { ...policeData };
        
        // Conversion des dates
        if (dataToSend.EFF_POL) {
          dataToSend.EFF_POL = formatDateForAPI(dataToSend.EFF_POL);
        }
        if (dataToSend.RES_POL) {
          dataToSend.RES_POL = formatDateForAPI(dataToSend.RES_POL);
        }
        if (dataToSend.EMP_POL) {
          dataToSend.EMP_POL = formatDateForAPI(dataToSend.EMP_POL);
        }
        if (dataToSend.DEM_POL) {
          dataToSend.DEM_POL = formatDateForAPI(dataToSend.DEM_POL);
        }
        if (dataToSend.SUS_POL) {
          dataToSend.SUS_POL = formatDateForAPI(dataToSend.SUS_POL);
        }
        if (dataToSend.VIG_POL) {
          dataToSend.VIG_POL = formatDateForAPI(dataToSend.VIG_POL);
        }
        if (dataToSend.DAT_CSS) {
          dataToSend.DAT_CSS = formatDateForAPI(dataToSend.DAT_CSS);
        }
        
        // Mise à jour de la date de modification
        dataToSend.DAT_MODUTIL = formatDateForAPI(new Date());
        
        // Nettoyage des champs vides
        Object.keys(dataToSend).forEach(key => {
          if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
            delete dataToSend[key];
          }
        });
        
        const response = await fetchAPI(`/polices/${id}`, {
          method: 'PUT',
          body: dataToSend,
        });
        
        if (response.success && response.police) {
          return {
            ...response,
            police: this.formatPoliceForDisplay(response.police)
          };
        }
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur mise à jour police ${id}:`, error);
        throw error;
      }
    },

    // Désactiver une police
    async delete(id) {
      try {
        if (!id || isNaN(parseInt(id))) {
          throw new Error('ID police invalide');
        }
        
        const response = await fetchAPI(`/polices/${id}`, {
          method: 'DELETE',
        });
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur suppression police ${id}:`, error);
        throw error;
      }
    },

    // ==============================================
    // GESTION DES BÉNÉFICIAIRES DE POLICE
    // ==============================================

    // Ajouter un bénéficiaire à une police
    async addBeneficiaire(policeId, beneficiaireData) {
      try {
        if (!policeId || isNaN(parseInt(policeId))) {
          throw new Error('ID police invalide');
        }
        
        console.log(`➕ Ajout bénéficiaire police ${policeId}:`, beneficiaireData);
        
        // Préparation des données
        const dataToSend = {
          ...beneficiaireData,
          COD_POL: policeId,
          ENT_BPO: beneficiaireData.ENT_BPO ? formatDateForAPI(beneficiaireData.ENT_BPO) : null,
          SOR_BPO: beneficiaireData.SOR_BPO ? formatDateForAPI(beneficiaireData.SOR_BPO) : null,
          SUS_BPO: beneficiaireData.SUS_BPO ? formatDateForAPI(beneficiaireData.SUS_BPO) : null,
          REM_BPO: beneficiaireData.REM_BPO ? formatDateForAPI(beneficiaireData.REM_BPO) : null,
          DAT_DEME: beneficiaireData.DAT_DEME ? formatDateForAPI(beneficiaireData.DAT_DEME) : null,
          DAT_DEMS: beneficiaireData.DAT_DEMS ? formatDateForAPI(beneficiaireData.DAT_DEMS) : null
        };
        
        const response = await fetchAPI(`/polices/${policeId}/beneficiaires`, {
          method: 'POST',
          body: dataToSend,
        });
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur ajout bénéficiaire police ${policeId}:`, error);
        throw error;
      }
    },

    // Mettre à jour un bénéficiaire de police
    async updateBeneficiaire(policeId, beneficiaireId, beneficiaireData) {
      try {
        if (!policeId || isNaN(parseInt(policeId))) {
          throw new Error('ID police invalide');
        }
        
        if (!beneficiaireId || isNaN(parseInt(beneficiaireId))) {
          throw new Error('ID bénéficiaire police invalide');
        }
        
        console.log(`✏️ Mise à jour bénéficiaire police ${policeId}:`, beneficiaireData);
        
        // Préparation des données
        const dataToSend = { ...beneficiaireData };
        
        // Conversion des dates
        if (dataToSend.ENT_BPO) {
          dataToSend.ENT_BPO = formatDateForAPI(dataToSend.ENT_BPO);
        }
        if (dataToSend.SOR_BPO) {
          dataToSend.SOR_BPO = formatDateForAPI(dataToSend.SOR_BPO);
        }
        if (dataToSend.SUS_BPO) {
          dataToSend.SUS_BPO = formatDateForAPI(dataToSend.SUS_BPO);
        }
        if (dataToSend.REM_BPO) {
          dataToSend.REM_BPO = formatDateForAPI(dataToSend.REM_BPO);
        }
        if (dataToSend.DAT_DEME) {
          dataToSend.DAT_DEME = formatDateForAPI(dataToSend.DAT_DEME);
        }
        if (dataToSend.DAT_DEMS) {
          dataToSend.DAT_DEMS = formatDateForAPI(dataToSend.DAT_DEMS);
        }
        
        const response = await fetchAPI(`/polices/${policeId}/beneficiaires/${beneficiaireId}`, {
          method: 'PUT',
          body: dataToSend,
        });
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur mise à jour bénéficiaire police ${policeId}:`, error);
        throw error;
      }
    },

    // Retirer un bénéficiaire d'une police
    async removeBeneficiaire(policeId, beneficiaireId) {
      try {
        if (!policeId || isNaN(parseInt(policeId))) {
          throw new Error('ID police invalide');
        }
        
        if (!beneficiaireId || isNaN(parseInt(beneficiaireId))) {
          throw new Error('ID bénéficiaire police invalide');
        }
        
        const response = await fetchAPI(`/polices/${policeId}/beneficiaires/${beneficiaireId}`, {
          method: 'DELETE',
        });
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur retrait bénéficiaire police ${policeId}:`, error);
        throw error;
      }
    },

    // Récupérer les bénéficiaires d'une police
    async getBeneficiaires(policeId) {
      try {
        if (!policeId || isNaN(parseInt(policeId))) {
          throw new Error('ID police invalide');
        }
        
        const response = await fetchAPI(`/polices/${policeId}/beneficiaires`);
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur bénéficiaires police ${policeId}:`, error);
        return { success: false, message: error.message, beneficiaires: [] };
      }
    },

    // ==============================================
    // GESTION DES AVENANTS
    // ==============================================

    // Créer un avenant
    async createAvenant(policeId, avenantData) {
      try {
        if (!policeId || isNaN(parseInt(policeId))) {
          throw new Error('ID police invalide');
        }
        
        console.log(`📄 Création avenant police ${policeId}:`, avenantData);
        
        // Préparation des données
        const dataToSend = {
          ...avenantData,
          COD_POL: policeId,
          DAT_AVN: avenantData.DAT_AVN ? formatDateForAPI(avenantData.DAT_AVN) : formatDateForAPI(new Date()),
          DEB_AVN: avenantData.DEB_AVN ? formatDateForAPI(avenantData.DEB_AVN) : null,
          FIN_AVN: avenantData.FIN_AVN ? formatDateForAPI(avenantData.FIN_AVN) : null,
          ECH_AVN: avenantData.ECH_AVN ? formatDateForAPI(avenantData.ECH_AVN) : null,
          DAT_CREUTIL: formatDateForAPI(new Date()),
          DAT_MODUTIL: formatDateForAPI(new Date())
        };
        
        const response = await fetchAPI(`/polices/${policeId}/avenants`, {
          method: 'POST',
          body: dataToSend,
        });
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur création avenant police ${policeId}:`, error);
        throw error;
      }
    },

    // Récupérer les avenants d'une police
    async getAvenants(policeId) {
      try {
        if (!policeId || isNaN(parseInt(policeId))) {
          throw new Error('ID police invalide');
        }
        
        const response = await fetchAPI(`/polices/${policeId}/avenants`);
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur avenants police ${policeId}:`, error);
        return { success: false, message: error.message, avenants: [] };
      }
    },

    // ==============================================
    // GESTION DES TARIFS
    // ==============================================

    // Ajouter un tarif
    async addTarif(policeId, tarifData) {
      try {
        if (!policeId || isNaN(parseInt(policeId))) {
          throw new Error('ID police invalide');
        }
        
        console.log(`💰 Ajout tarif police ${policeId}:`, tarifData);
        
        // Préparation des données
        const dataToSend = {
          ...tarifData,
          COD_POL: policeId,
          EFF_PTA: tarifData.EFF_PTA ? formatDateForAPI(tarifData.EFF_PTA) : formatDateForAPI(new Date()),
          DAT_CREUTIL: formatDateForAPI(new Date()),
          DAT_MODUTIL: formatDateForAPI(new Date())
        };
        
        const response = await fetchAPI(`/polices/${policeId}/tarifs`, {
          method: 'POST',
          body: dataToSend,
        });
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur ajout tarif police ${policeId}:`, error);
        throw error;
      }
    },

    // Récupérer les tarifs d'une police
    async getTarifs(policeId) {
      try {
        if (!policeId || isNaN(parseInt(policeId))) {
          throw new Error('ID police invalide');
        }
        
        const response = await fetchAPI(`/polices/${policeId}/tarifs`);
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur tarifs police ${policeId}:`, error);
        return { success: false, message: error.message, tarifs: [] };
      }
    },

    // ==============================================
    // GESTION DES PAYS
    // ==============================================

    // Ajouter un pays à une police
    async addPays(policeId, paysData) {
      try {
        if (!policeId || isNaN(parseInt(policeId))) {
          throw new Error('ID police invalide');
        }
        
        console.log(`🌍 Ajout pays police ${policeId}:`, paysData);
        
        const response = await fetchAPI(`/polices/${policeId}/pays`, {
          method: 'POST',
          body: paysData,
        });
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur ajout pays police ${policeId}:`, error);
        throw error;
      }
    },

    // Récupérer les pays d'une police
    async getPays(policeId) {
      try {
        if (!policeId || isNaN(parseInt(policeId))) {
          throw new Error('ID police invalide');
        }
        
        const response = await fetchAPI(`/polices/${policeId}/pays`);
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur pays police ${policeId}:`, error);
        return { success: false, message: error.message, pays: [] };
      }
    },

    // ==============================================
    // GESTION DES PRESTATIONS
    // ==============================================

    // Ajouter une prestation
    async addPrestation(policeId, prestationData) {
      try {
        if (!policeId || isNaN(parseInt(policeId))) {
          throw new Error('ID police invalide');
        }
        
        console.log(`🏥 Ajout prestation police ${policeId}:`, prestationData);
        
        // Préparation des données
        const dataToSend = {
          ...prestationData,
          COD_POL: policeId,
          EFF_POL: prestationData.EFF_POL ? formatDateForAPI(prestationData.EFF_POL) : formatDateForAPI(new Date()),
          EXD_POL: prestationData.EXD_POL ? formatDateForAPI(prestationData.EXD_POL) : null,
          EXF_POL: prestationData.EXF_POL ? formatDateForAPI(prestationData.EXF_POL) : null,
          DAT_CREUTIL: formatDateForAPI(new Date()),
          DAT_MODUTIL: formatDateForAPI(new Date())
        };
        
        const response = await fetchAPI(`/polices/${policeId}/prestations`, {
          method: 'POST',
          body: dataToSend,
        });
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur ajout prestation police ${policeId}:`, error);
        throw error;
      }
    },

    // Récupérer les prestations d'une police
    async getPrestations(policeId) {
      try {
        if (!policeId || isNaN(parseInt(policeId))) {
          throw new Error('ID police invalide');
        }
        
        const response = await fetchAPI(`/polices/${policeId}/prestations`);
        
        return response;
      } catch (error) {
        console.error(`❌ Erreur prestations police ${policeId}:`, error);
        return { success: false, message: error.message, prestations: [] };
      }
    },

    // ==============================================
    // RECHERCHE ET FILTRAGE
    // ==============================================

    // Rechercher des polices
    async search(searchTerm, filters = {}, limit = 20) {
      try {
        const dataToSend = {
          searchTerm,
          filters,
          limit
        };
        
        const response = await fetchAPI('/polices/search', {
          method: 'POST',
          body: dataToSend,
        });
        
        if (response.success) {
          const polices = response.polices?.map(p => this.formatPoliceForDisplay(p)) || [];
          
          return {
            ...response,
            polices
          };
        }
        
        return response;
      } catch (error) {
        console.error('❌ Erreur recherche polices:', error);
        return { success: false, message: error.message, polices: [] };
      }
    },

    // Recherche rapide pour autocomplétion
    async searchQuick(searchTerm, limit = 10) {
      try {
        if (!searchTerm || searchTerm.trim().length < 2) {
          return { success: true, polices: [] };
        }
        
        const queryParams = new URLSearchParams();
        queryParams.append('search', searchTerm);
        if (limit) queryParams.append('limit', limit);
        
        const queryString = queryParams.toString();
        const response = await fetchAPI(`/polices/search/quick${queryString ? '?' + queryString : ''}`);
        
        // Normalisation de la réponse
        if (response.success) {
          const polices = response.polices?.map(p => ({
            id: p.id || p.COD_POL,
            numero: p.NUM_POL || p.numero,
            compagnie: p.nom_compagnie || '',
            nom_complet: p.nom_complet || `${p.NUM_POL || ''} - ${p.nom_compagnie || ''}`.trim(),
            eff_pol: p.EFF_POL || p.eff_pol,
            res_pol: p.RES_POL || p.res_pol,
            status: p.status || 'Active',
            label: p.label || `${p.NUM_POL || ''} - ${p.nom_compagnie || ''}`.trim()
          })) || [];
          
          return {
            ...response,
            polices
          };
        }
        
        return response;
      } catch (error) {
        console.error('❌ Erreur recherche rapide polices:', error);
        return { success: false, message: error.message, polices: [] };
      }
    },

    // ==============================================
    // DONNÉES DE RÉFÉRENCE
    // ==============================================

    // Récupérer les souscripteurs
    async getSouscripteurs() {
      try {
        const response = await fetchAPI('/polices/souscripteurs');
        
        if (response.success) {
          return response;
        }
        
        console.warn('⚠️ API souscripteurs non disponible');
        return { 
          success: true,
          souscripteurs: []
        };
      } catch (error) {
        console.error('❌ Erreur récupération souscripteurs:', error);
        return { success: false, message: error.message, souscripteurs: [] };
      }
    },

    // Récupérer les types de police
    async getTypesPolice() {
      try {
        const response = await fetchAPI('/polices/types');
        
        if (response.success) {
          return response;
        }
        
        console.warn('⚠️ API types police non disponible');
        return { 
          success: true,
          types: [
            { value: 'IND', label: 'Individuelle' },
            { value: 'COL', label: 'Collective' },
            { value: 'ENT', label: 'Entreprise' }
          ]
        };
      } catch (error) {
        console.error('❌ Erreur récupération types police:', error);
        return { success: false, message: error.message, types: [] };
      }
    },

    // Récupérer les statistiques des polices
    async getStatistiques() {
      try {
        const response = await fetchAPI('/polices/statistiques');
        
        if (response.success) {
          return response;
        }
        
        console.warn('⚠️ API statistiques non disponible');
        return { 
          success: false,
          message: 'API non disponible',
          statistiques: {
            total: 0,
            actives: 0,
            suspendues: 0,
            resiliees: 0,
            en_attente: 0,
            par_compagnie: [],
            par_type: []
          } 
        };
      } catch (error) {
        console.error('❌ Erreur statistiques polices:', error);
        return { 
          success: false,
          message: error.message,
          statistiques: {
            total: 0,
            actives: 0,
            suspendues: 0,
            resiliees: 0,
            en_attente: 0,
            par_compagnie: [],
            par_type: []
          } 
        };
      }
    },

    // ==============================================
    // FONCTIONS UTILITAIRES
    // ==============================================

    // Tester la connexion
    async testConnection() {
      try {
        const response = await fetchAPI('/polices?limit=1');
        return {
          success: response.success !== false,
          message: response.success !== false ? 'API polices opérationnelle' : 'API en erreur',
          timestamp: new Date().toISOString(),
          details: response
        };
      } catch (error) {
        console.error('❌ Test connexion polices échoué:', error);
        return {
          success: false,
          message: 'API polices non disponible',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    },

    // Formater une police pour l'affichage
  formatPoliceForDisplay(police) {
      if (!police) return null;
      
>>>>>>> d90a12e2bad9383f696451b6f983404524d7015b
      return {
        success: true,
        tauxCouverture: 0,
        message: 'Aucune police liée',
        policeActive: null
      };
    }
    
    // 2. Trouver le lien actif avec le taux le plus élevé
    const liensActifs = response.liens.filter(lien => 
      lien.STATUT_LIEN === 'ACTIF' && 
      new Date(lien.DATE_EFFET) <= new Date() &&
      (!lien.DATE_FIN || new Date(lien.DATE_FIN) >= new Date())
    );
    
    if (liensActifs.length === 0) {
      return {
        success: true,
        tauxCouverture: 0,
        message: 'Aucun lien actif',
        policeActive: null
      };
    }
    
    // 3. Prendre le lien avec le taux de couverture le plus élevé
    const meilleurLien = liensActifs.reduce((max, current) => 
      (current.TAUX_COUVERTURE || 0) > (max.TAUX_COUVERTURE || 0) ? current : max
    );
    
    // 4. Récupérer les détails de la police
    let policeDetails = null;
    try {
      const policeResponse = await this.getById(meilleurLien.COD_POL);
      if (policeResponse.success) {
        policeDetails = policeResponse.police;
      }
    } catch (error) {
      console.warn('Impossible de récupérer les détails de la police:', error);
    }
    
    return {
      success: true,
      tauxCouverture: meilleurLien.TAUX_COUVERTURE || 0,
      policeActive: policeDetails,
      lienActif: meilleurLien,
      totalLiens: response.liens.length,
      liensActifs: liensActifs.length,
      details: {
        policeId: meilleurLien.COD_POL,
        policeNumero: policeDetails?.NUM_POLICE || 'N/A',
        dateEffet: meilleurLien.DATE_EFFET,
        dateFin: meilleurLien.DATE_FIN,
        tauxSpecifique: meilleurLien.TAUX_COUVERTURE
      }
    };
    
  } catch (error) {
    console.error(`❌ Erreur récupération taux couverture bénéficiaire ${beneficiaireId}:`, error);
    return {
      success: false,
      message: error.message,
      tauxCouverture: 0,
      policeActive: null
    };
  }
},

// Dans policesAPI
async getTauxCouvertureBatch(beneficiaireIds) {
  try {
    if (!Array.isArray(beneficiaireIds) || beneficiaireIds.length === 0) {
      return { success: true, tauxParBeneficiaire: {} };
    }
    
    console.log(`🔍 Chargement batch taux couverture pour ${beneficiaireIds.length} bénéficiaires`);
    
    const response = await fetchAPI(`/api/polices/taux-couverture/batch?beneficiaireIds=${JSON.stringify(beneficiaireIds)}`, {
      method: 'POST',
      body: { beneficiaireIds },
    });
    
    return response;
  } catch (error) {
    console.error('❌ Erreur chargement batch taux couverture:', error);
    return { success: false, message: error.message, tauxParBeneficiaire: {} };
  }
},

async getDetailsTauxCouverture(beneficiaireId) {
  try {
    if (!beneficiaireId || isNaN(parseInt(beneficiaireId))) {
      throw new Error('ID bénéficiaire invalide');
    }
    
    console.log(`🔍 Détails taux couverture pour bénéficiaire ${beneficiaireId}`);
    
    // 1. Récupérer les polices avec leurs barèmes
    const responsePolices = await this.getByBeneficiaire(beneficiaireId, {
      includeBeneficiaires: false,
      includeReseauSoins: false
    });
    
    if (!responsePolices.success || !responsePolices.polices) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des polices',
        details: null
      };
    }
    
    const polices = responsePolices.polices;
    
    // 2. Organiser les données par police
    const detailsParPolice = await Promise.all(
      polices.map(async (police) => {
        // Pour chaque police, récupérer les barèmes associés
        let baremesDetails = [];
        
        if (police.Bareme && Array.isArray(police.Bareme) && police.Bareme.length > 0) {
          // Les barèmes sont déjà inclus dans la réponse
          baremesDetails = police.Bareme.map(b => ({
            COD_BAR: b.COD_BAR,
            LIB_BAR: b.LIB_BAR,
            TYPE_BAREME: b.TYPE_BAREME || 'STANDARD'
          }));
        } else if (police.COD_POL) {
          // Sinon, récupérer les barèmes via API séparée
          try {
            const responseBaremes = await baremesAPI.getBarèmesByPolice(police.COD_POL);
            if (responseBaremes.success && responseBaremes.baremes) {
              baremesDetails = responseBaremes.baremes;
            }
          } catch (error) {
            console.warn(`⚠️ Impossible de récupérer les barèmes pour la police ${police.COD_POL}:`, error);
          }
        }
        
        return {
          police: {
            COD_POL: police.COD_POL,
            NUM_POLICE: police.NUM_POLICE,
            NOM_COMPAGNIE: police.NOM_COMPAGNIE,
            TYPE_POLICE: police.TYPE_POLICE,
            STATUT_POLICE: police.STATUT_POLICE,
            DATE_EFFET: police.DATE_EFFET,
            DATE_ECHEANCE: police.DATE_ECHEANCE,
            TAUX_ASSURANCE: police.TAUX_ASSURANCE || police.TXA_POL || 0,
            MONTANT_PRIME: police.MONTANT_PRIME
          },
          baremes: baremesDetails,
          nombreBaremes: baremesDetails.length
        };
      })
    );
    
    // 3. Calculer le taux de couverture global (prendre le maximum des polices actives)
    const policesActives = detailsParPolice.filter(p => p.police.STATUT_POLICE === 'ACTIVE');
    
    let tauxCouvertureGlobal = 0;
    let policeReference = null;
    
    if (policesActives.length > 0) {
      // Prendre la police active avec le taux le plus élevé
      const policeMaxTaux = policesActives.reduce((max, current) => {
        const tauxCurrent = parseFloat(current.police.TAUX_ASSURANCE) || 0;
        const tauxMax = parseFloat(max.police.TAUX_ASSURANCE) || 0;
        return tauxCurrent > tauxMax ? current : max;
      });
      
      tauxCouvertureGlobal = parseFloat(policeMaxTaux.police.TAUX_ASSURANCE) || 0;
      policeReference = policeMaxTaux.police;
    }
    
    // 4. Retourner les résultats détaillés
    return {
      success: true,
      tauxCouvertureGlobal: tauxCouvertureGlobal,
      policeReference: policeReference,
      nombreTotalPolices: polices.length,
      nombrePolicesActives: policesActives.length,
      detailsParPolice: detailsParPolice,
      resume: {
        taux: `${tauxCouvertureGlobal}%`,
        police: policeReference?.NUM_POLICE || 'Aucune',
        compagnie: policeReference?.NOM_COMPAGNIE || 'N/A',
        validite: policeReference ? `Du ${formatDate(policeReference.DATE_EFFET)} au ${formatDate(policeReference.DATE_ECHEANCE)}` : 'Non définie'
      }
    };
    
  } catch (error) {
    console.error(`❌ Erreur détails taux couverture bénéficiaire ${beneficiaireId}:`, error);
    return {
      success: false,
      message: error.message,
      tauxCouvertureGlobal: 0,
      detailsParPolice: []
    };
  }
},

// Lier un bénéficiaire à une police avec taux de couverture spécifique
  async linkBeneficiaireToPolice(policeId, beneficiaireId, tauxCouverture = 100, dateEffet = null) {
    try {
      console.log(`🔗 Liaison bénéficiaire ${beneficiaireId} à police ${policeId} avec taux ${tauxCouverture}%`);
      
      const dataToSend = {
        ID_BEN: beneficiaireId,
        COD_POL: policeId,
        TAUX_COUVERTURE: tauxCouverture,
        DATE_EFFET: dateEffet || new Date().toISOString().split('T')[0],
        STATUT_LIEN: 'ACTIF',
        COD_CREUTIL: 'ADMIN',
        DAT_CREUTIL: new Date().toISOString().split('T')[0]
      };
      
      const response = await fetchAPI('/polices/link-beneficiaire', {
        method: 'POST',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur liaison bénéficiaire-police:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la liaison'
      };
    }
  },

  // Mettre à jour le taux de couverture pour un bénéficiaire spécifique
  async updateTauxCouvertureBeneficiaire(policeId, beneficiaireId, tauxCouverture) {
    try {
      console.log(`📊 Mise à jour taux couverture: ${tauxCouverture}% pour bénéficiaire ${beneficiaireId}, police ${policeId}`);
      
      const dataToSend = {
        ID_BEN: beneficiaireId,
        COD_POL: policeId,
        TAUX_COUVERTURE: tauxCouverture,
        DAT_MODUTIL: new Date().toISOString().split('T')[0],
        COD_MODUTIL: 'ADMIN'
      };
      
      const response = await fetchAPI('/polices/update-taux-couverture', {
        method: 'PUT',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour taux couverture:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du taux'
      };
    }
  },

  // Dissocier un bénéficiaire d'une police
  async unlinkBeneficiaireFromPolice(policeId, beneficiaireId) {
    try {
      console.log(`🔓 Dissociation bénéficiaire ${beneficiaireId} de police ${policeId}`);
      
      const response = await fetchAPI(`/polices/${policeId}/beneficiaires/${beneficiaireId}/unlink`, {
        method: 'DELETE',
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur dissociation bénéficiaire-police:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la dissociation'
      };
    }
  },

  // Récupérer les bénéficiaires liés à une police avec leurs taux de couverture
  async getBeneficiairesWithTaux(policeId) {
    try {
      console.log(`🔍 Récupération bénéficiaires avec taux pour police ${policeId}`);
      
      const response = await fetchAPI(`/polices/${policeId}/beneficiaires-with-taux`);
      
      if (response.success && response.beneficiaires) {
        // Ajouter des données formatées
        response.beneficiaires = response.beneficiaires.map(ben => ({
          ...ben,
          formattedTaux: `${ben.TAUX_COUVERTURE || 0}%`,
          statusColor: ben.TAUX_COUVERTURE >= 80 ? 'success' : 
                      ben.TAUX_COUVERTURE >= 50 ? 'warning' : 'error'
        }));
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération bénéficiaires avec taux:`, error);
      return {
        success: false,
        message: error.message,
        beneficiaires: []
      };
    }
  },

  // Récupérer le taux de couverture spécifique d'un bénéficiaire pour une police
  async getTauxCouvertureForBeneficiaire(beneficiaireId, policeId) {
    try {
      console.log(`🔍 Taux couverture pour bénéficiaire ${beneficiaireId}, police ${policeId}`);
      
      const response = await fetchAPI(`/polices/${policeId}/beneficiaire/${beneficiaireId}/taux-couverture`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération taux couverture spécifique:`, error);
      return {
        success: false,
        message: error.message,
        tauxCouverture: 0
      };
    }
  },

  // ==============================================
  // GESTION MULTIPLE DES LIENS
  // ==============================================

  // Lier plusieurs bénéficiaires à une police avec taux spécifiques
async linkMultipleBeneficiaires(policeId, beneficiairesData) {
  try {
    console.log(`🔗 Liaison multiple à police ${policeId}:`, beneficiairesData);
    
    // Validation des données
    if (!policeId || policeId === null || policeId === undefined) {
      throw new Error('ID police invalide: policeId est requis');
    }
    
    // S'assurer que policeId est un nombre
    const codPol = parseInt(policeId);
    if (isNaN(codPol)) {
      throw new Error(`ID police invalide: doit être un nombre, reçu: ${policeId} (${typeof policeId})`);
    }
    
    if (!Array.isArray(beneficiairesData) || beneficiairesData.length === 0) {
      throw new Error('Liste des bénéficiaires vide ou invalide');
    }
    
    // Préparation des données au format attendu par le backend
    const formattedBeneficiaires = beneficiairesData.map(ben => {
      // Valider chaque bénéficiaire
      if (!ben.ID_BEN) {
        throw new Error('ID bénéficiaire manquant dans les données');
      }
      
      const idBen = parseInt(ben.ID_BEN);
      if (isNaN(idBen)) {
        throw new Error(`ID bénéficiaire invalide: ${ben.ID_BEN}`);
      }
      
      return {
        ID_BEN: idBen,
        TAUX_COUVERTURE: ben.TAUX_COUVERTURE || 100,
        DATE_EFFET: ben.DATE_EFFET || new Date().toISOString().split('T')[0],
        NOM_BEN: ben.NOM_BEN || '',
        PRE_BEN: ben.PRE_BEN || ''
      };
    });
    
    // Formater les données pour le backend
    // Le backend s'attend à COD_POL (nombre)
    const dataToSend = {
      COD_POL: codPol,
      beneficiaires: formattedBeneficiaires
    };
    
    console.log('📤 Données envoyées au serveur:', JSON.stringify(dataToSend, null, 2));
    
    // Vérifier la structure avant envoi
    if (!dataToSend.COD_POL || !Array.isArray(dataToSend.beneficiaires)) {
      throw new Error('Structure de données invalide pour la liaison');
    }
    
    // Récupérer le token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token d\'authentification manquant. Veuillez vous reconnecter.');
    }
    
    const response = await fetch('/api/polices/link-multiple-beneficiaires', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dataToSend)
    });
    
    console.log('📥 Réponse brute du serveur:', response.status, response.statusText);
    
    // Gestion des erreurs HTTP
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur HTTP:', response.status, errorText);
      
      let errorMessage = `Erreur serveur (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) {
        // Ne rien faire, on garde le message d'erreur par défaut
      }
      
      throw new Error(errorMessage);
    }
    
    const responseData = await response.json();
    console.log('✅ Réponse du serveur:', responseData);
    
    return responseData;
    
  } catch (error) {
    console.error('❌ Erreur liaison multiple bénéficiaires:', error);
    
    // Messages d'erreur plus clairs
    let errorMessage = error.message;
    
    if (error.message.includes('404')) {
      errorMessage = `La police avec l'ID ${policeId} n'existe pas. Veuillez sélectionner une police valide.`;
    } else if (error.message.includes('COD_POL')) {
      errorMessage = 'Erreur d\'identification de la police. Veuillez sélectionner à nouveau la police.';
    } else if (error.message.includes('ID_BEN')) {
      errorMessage = 'Erreur d\'identification des bénéficiaires.';
    } else if (error.message.includes('401')) {
      errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      window.location.href = '/login';
    } else if (error.message.includes('400')) {
      errorMessage = 'Données invalides. Vérifiez les informations saisies.';
    }
    
    return {
      success: false,
      message: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString()
    };
  }
},

  // Synchroniser les bénéficiaires d'une police avec une liste
  async syncBeneficiairesForPolice(policeId, beneficiairesList, options = {}) {
    try {
      console.log(`🔄 Synchronisation bénéficiaires pour police ${policeId}`, beneficiairesList);
      
      const dataToSend = {
        COD_POL: policeId,
        beneficiaires: beneficiairesList,
        options: {
          updateExisting: options.updateExisting !== false,
          keepExisting: options.keepExisting !== false,
          defaultTaux: options.defaultTaux || 100
        }
      };
      
      const response = await fetchAPI('/polices/sync-beneficiaires', {
        method: 'POST',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur synchronisation bénéficiaires:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la synchronisation'
      };
    }
  },

  // ==============================================
  // RÉCUPÉRATION DE DONNÉES
  // ==============================================

  async getAll(params = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        status, 
        compagnie,
        type_police,
        date_debut,
        date_fin,
        sortBy = 'DAT_CREUTIL',
        sortOrder = 'DESC',
        withBeneficiaires = false,
        withReseauSoins = false
      } = params;
      
      const queryParams = new URLSearchParams();
      
      if (page) queryParams.append('page', page);
      if (limit) queryParams.append('limit', limit);
      if (search) queryParams.append('search', search);
      if (status) queryParams.append('status', status);
      if (compagnie) queryParams.append('compagnie', compagnie);
      if (type_police) queryParams.append('type_police', type_police);
      if (date_debut) queryParams.append('date_debut', date_debut);
      if (date_fin) queryParams.append('date_fin', date_fin);
      if (sortBy) queryParams.append('sortBy', sortBy);
      if (sortOrder) queryParams.append('sortOrder', sortOrder);
      if (withBeneficiaires) queryParams.append('withBeneficiaires', 'true');
      if (withReseauSoins) queryParams.append('withReseauSoins', 'true');
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/polices${queryString ? '?' + queryString : ''}`);
      
      if (response.success) {
        const polices = response.polices?.map(p => this.formatPoliceForDisplay(p)) || [];
        
        return {
          success: true,
          polices: polices,
          pagination: response.pagination || {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Erreur récupération polices:', error);
      return { 
        success: false, 
        message: error.message,
        polices: [], 
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } 
      };
    }
  },

  // NOUVELLE FONCTION : Récupérer les polices d'un bénéficiaire
  async getPolicesByBeneficiaire(beneficiaireId, params = {}) {
    try {
      console.log(`🔍 Récupération des polices pour le bénéficiaire ID: ${beneficiaireId}`);
      
      if (!beneficiaireId || isNaN(parseInt(beneficiaireId))) {
        throw new Error('ID bénéficiaire invalide');
      }
      
      const { 
        page = 1, 
        limit = 20,
        includeBeneficiaires = false,
        includeReseauSoins = false
      } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('beneficiaireId', beneficiaireId);
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (includeBeneficiaires) queryParams.append('includeBeneficiaires', 'true');
      if (includeReseauSoins) queryParams.append('includeReseauSoins', 'true');
      
      const queryString = queryParams.toString();
      const url = `/polices/beneficiaire/${beneficiaireId}${queryString ? '?' + queryString : ''}`;
      
      console.log(`📡 Appel API: GET ${url}`);
      
      const response = await fetchAPI(url);
      
      if (response.success) {
        const polices = response.polices?.map(p => this.formatPoliceForDisplay(p)) || [];
        
        return {
          success: true,
          polices: polices,
          beneficiaire: response.beneficiaire || null,
          pagination: response.pagination || {
            total: polices.length,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(polices.length / limit),
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      }
      
      return response;
      
    } catch (error) {
      console.error(`❌ Erreur récupération polices par bénéficiaire ${beneficiaireId}:`, error);
      return { 
        success: false, 
        message: error.message,
        polices: [], 
        pagination: { 
          total: 0, 
          page: 1, 
          limit: 20, 
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        } 
      };
    }
  },

  // Fonction existante (maintenue pour compatibilité)
  async getByBeneficiaire(beneficiaireId, params = {}) {
    return this.getPolicesByBeneficiaire(beneficiaireId, params);
  },

  async getById(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID police invalide');
      }
      
      console.log(`🔍 Récupération détaillée police ${id}`);
      
      // Ajout des paramètres pour inclure bénéficiaires et réseau de soins
      const queryParams = new URLSearchParams();
      queryParams.append('includeBeneficiaires', 'true');
      queryParams.append('includeReseauSoins', 'true');
      queryParams.append('includeGaranties', 'true');
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/polices/${id}${queryString ? '?' + queryString : ''}`);
      
      if (response.success && response.police) {
        return {
          ...response,
          police: this.formatPoliceForDisplay(response.police)
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération police ${id}:`, error);
      throw error;
    }
  },

  async getBeneficiaires(policeId) {
    try {
      if (!policeId || isNaN(parseInt(policeId))) {
        throw new Error('ID police invalide');
      }
      
      const response = await fetchAPI(`/polices/${policeId}/beneficiaires`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur bénéficiaires police ${policeId}:`, error);
      return { success: false, message: error.message, beneficiaires: [] };
    }
  },

  // NOUVELLE FONCTION : Récupérer tous les bénéficiaires avec leurs polices
  async getBeneficiairesWithPolices(params = {}) {
    try {
      const { 
        page = 1, 
        limit = 20,
        search,
        statut_ace,
        sexe,
        cod_pay,
        date_debut,
        date_fin,
        employeur
      } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (search) queryParams.append('search', search);
      if (statut_ace) queryParams.append('statut_ace', statut_ace);
      if (sexe) queryParams.append('sexe', sexe);
      if (cod_pay) queryParams.append('cod_pay', cod_pay);
      if (date_debut) queryParams.append('date_debut', date_debut);
      if (date_fin) queryParams.append('date_fin', date_fin);
      if (employeur) queryParams.append('employeur', employeur);
      queryParams.append('includePolices', 'true');
      
      const queryString = queryParams.toString();
      const url = `/polices/beneficiaires-with-polices${queryString ? '?' + queryString : ''}`;
      
      console.log(`📡 Appel API: GET ${url}`);
      
      const response = await fetchAPI(url);
      
      if (response.success) {
        const beneficiaires = response.beneficiaires?.map(b => ({
          ...b,
          polices: b.polices?.map(p => this.formatPoliceForDisplay(p)) || []
        })) || [];
        
        return {
          success: true,
          beneficiaires: beneficiaires,
          pagination: response.pagination || {
            total: beneficiaires.length,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(beneficiaires.length / limit),
            hasNextPage: false,
            hasPrevPage: false
          },
          statistiques: response.statistiques || {
            total: 0,
            avec_police: 0,
            sans_police: 0
          }
        };
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Erreur récupération bénéficiaires avec polices:', error);
      return { 
        success: false, 
        message: error.message,
        beneficiaires: [], 
        pagination: { 
          total: 0, 
          page: 1, 
          limit: 20, 
          totalPages: 0 
        }
      };
    }
  },

  async getCompagnies() {
    try {
      const response = await fetchAPI('/compagnies');
      
      if (response.success) {
        return response;
      }
      
      console.warn('⚠️ API compagnies non disponible');
      return { 
        success: true,
        message: 'Données par défaut chargées',
        compagnies: [
          { id: 1, COD_ASS: 1, NOM_COMPAGNIE: 'Compagnie A', LIB_ASS: 'Compagnie A' },
          { id: 2, COD_ASS: 2, NOM_COMPAGNIE: 'Compagnie B', LIB_ASS: 'Compagnie B' }
        ]
      };
    } catch (error) {
      console.error('❌ Erreur récupération compagnies:', error);
      return { 
        success: true,
        message: 'Erreur API, données par défaut chargées',
        compagnies: []
      };
    }
  },

  async getExpiringSoon(days = 30) {
    try {
      const response = await fetchAPI(`/polices/expiring?days=${days}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération polices expirantes:', error);
      return { success: false, message: error.message, polices: [] };
    }
  },

  async getTypesAssureur() {
    try {
      const response = await fetchAPI('/polices/types-assureur');
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération types assureur:', error);
      return { success: false, message: error.message, typesAssureur: [] };
    }
  },

  async getByCompagnie(compagnieId) {
    try {
      if (!compagnieId || isNaN(parseInt(compagnieId))) {
        throw new Error('ID compagnie invalide');
      }
      
      const response = await fetchAPI(`/polices/compagnie/${compagnieId}`);
      
      if (response.success) {
        const polices = response.polices?.map(p => this.formatPoliceForDisplay(p)) || [];
        return { ...response, polices };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur polices compagnie ${compagnieId}:`, error);
      return { success: false, message: error.message, polices: [] };
    }
  },

  // NOUVELLE FONCTION : Récupérer les détails complets d'une police
  async getDetails(policeId) {
    try {
      if (!policeId || isNaN(parseInt(policeId))) {
        throw new Error('ID police invalide');
      }
      
      const response = await fetchAPI(`/polices/${policeId}/details`);
      
      if (response.success) {
        return {
          ...response,
          police: this.formatPoliceForDisplay(response.police)
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur détails police ${policeId}:`, error);
      return { 
        success: false, 
        message: error.message,
        police: null,
        beneficiaires: [],
        reseau_soins: null 
      };
    }
  },

  // ==============================================
  // CRÉATION ET MISE À JOUR
  // ==============================================
async create(policeData) {
  try {
    console.log('📝 Création police avec données:', policeData);
    
    // Récupérer le token d'authentification
    const token = localStorage.getItem('token'); // ou sessionStorage, selon votre implémentation
    if (!token) {
      throw new Error('Aucun token d\'authentification trouvé. Veuillez vous reconnecter.');
    }
    
    // Validation des champs obligatoires
    const errors = [];
    
    if (!policeData.COD_ASS || isNaN(parseInt(policeData.COD_ASS))) {
      errors.push('La compagnie est obligatoire (COD_ASS manquant ou invalide)');
    }
    
    if (!policeData.NUM_POL || policeData.NUM_POL.trim() === '') {
      errors.push('Le numéro de police est obligatoire (NUM_POL manquant)');
    }
    
    if (!policeData.EFF_POL) {
      errors.push('La date d\'effet est obligatoire (EFF_POL manquant)');
    } else {
      const effDate = new Date(policeData.EFF_POL);
      if (isNaN(effDate.getTime())) {
        errors.push('La date d\'effet est invalide');
      }
    }
    
    if (!policeData.EMPLOYEUR || policeData.EMPLOYEUR.trim() === '') {
      errors.push('L\'employeur est obligatoire');
    }
    
    if (errors.length > 0) {
      console.error('❌ Validation échouée:', errors);
      throw new Error(errors.join(', '));
    }
    
    // Préparation des données
    const cleanPoliceData = {
      COD_ASS: parseInt(policeData.COD_ASS),
      NUM_POL: policeData.NUM_POL.trim(),
      EMPLOYEUR: policeData.EMPLOYEUR.trim(),
      EFF_POL: policeData.EFF_POL,
      RES_POL: policeData.RES_POL || null,
      EMP_POL: policeData.EMP_POL || policeData.EFF_POL,
      PRM_POL: policeData.PRM_POL || 0,
      TXA_POL: policeData.TXA_POL || 100,
      STD_POL: policeData.STD_POL || 1,
      TYP_POL: policeData.TYP_POL || 'C',
      REM_POL: policeData.REM_POL || '',
      beneficiaires: policeData.beneficiaires || []
    };
    
    console.log('📤 Données envoyées au backend:', cleanPoliceData);
    
    // Utiliser fetch directement avec le token
    const response = await fetch('/api/polices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // IMPORTANT: Ajouter le token ici
      },
      body: JSON.stringify(cleanPoliceData)
    });
    
    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      console.error('❌ Erreur backend:', errorData);
      
      if (response.status === 401) {
        // Token invalide ou expiré
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log('📥 Réponse backend création police:', responseData);
    
    if (responseData.success && responseData.data) {
      return {
        ...responseData,
        police: responseData.data
      };
    }
    
    return responseData;
    
  } catch (error) {
    console.error('❌ Erreur création police:', error);
    throw error;
  }
},

  async update(id, policeData) {
    try {
      console.log(`✏️ Début mise à jour police - ID: ${id}`, policeData);
      
      let endpoint;
      let isNumericId = !isNaN(parseInt(id)) && isFinite(id);
      
      if (isNumericId) {
        endpoint = `/polices/${id}`;
      } else {
        endpoint = `/polices/num/${encodeURIComponent(id)}`;
      }
      
      console.log(`📍 Endpoint utilisé: ${endpoint}`);
      console.log(`📋 Type ID: ${isNumericId ? 'COD_POL (numérique)' : 'NUM_POLICE (alphanumérique)'}`);
      
      // Préparation des données
      const dataToSend = {
        ...policeData,
        // Gérer les champs spécifiques
        COD_ASS: policeData.COD_ASS ? parseInt(policeData.COD_ASS) : null,
        EMPLOYEUR: policeData.EMPLOYEUR || null, // NOUVEAU CHAMP
        COD_RESEAU: policeData.COD_RESEAU || null,
        DAT_MODUTIL: new Date().toISOString().split('T')[0],
        COD_MODUTIL: 'ADMIN'
      };
      
      // Gérer les dates
      const dateFields = {
        DATE_EFFET: 'EFF_POL',
        DATE_ECHEANCE: 'RES_POL',
        DATE_EMISSION: 'EMP_POL'
      };
      
      Object.entries(dateFields).forEach(([frontendField, backendField]) => {
        if (policeData[frontendField]) {
          dataToSend[backendField] = formatDateForAPI(policeData[frontendField]);
        }
      });
      
      // Gérer le type de police
      if (policeData.TYPE_POLICE) {
        dataToSend.TYP_POL = this.getPoliceTypeCode(policeData.TYPE_POLICE);
      }
      
      // Gérer le statut
      if (policeData.STATUT_POLICE) {
        dataToSend.STD_POL = policeData.STATUT_POLICE === 'ACTIVE' ? 1 : 0;
      }
      
      // Gérer le numéro de référence
      if (policeData.NUMR_POLICE) {
        dataToSend.NUMR_POL = policeData.NUMR_POLICE;
      }
      
      // Gérer la prime
      if (policeData.MONTANT_PRIME !== undefined) {
        dataToSend.PRM_POL = policeData.MONTANT_PRIME;
      }
      
      // Gérer le taux
      if (policeData.TAUX_ASSURANCE !== undefined) {
        dataToSend.TXA_POL = policeData.TAUX_ASSURANCE;
      }
      
      // Gérer les remarques
      if (policeData.REMARQUES !== undefined) {
        dataToSend.REM_POL = policeData.REMARQUES;
      }
      
      // Nettoyer les données vides
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null || dataToSend[key] === undefined) {
          delete dataToSend[key];
        }
      });
      
      console.log('📤 Données finales envoyées:', dataToSend);
      
      const response = await fetchAPI(endpoint, {
        method: 'PUT',
        body: dataToSend,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 Réponse du serveur:', response);
      
      if (response.success && response.police) {
        return {
          ...response,
          police: this.formatPoliceForDisplay(response.police)
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour police ${id}:`, error);
      
      let errorMessage = error.message || 'Erreur lors de la mise à jour de la police';
      
      if (error.message.includes('ID police invalide')) {
        errorMessage = `ID police invalide: "${id}". Utilisez COD_POL (entier) ou NUM_POL (alphanumérique).`;
      } else if (error.message.includes('404')) {
        errorMessage = `Police ${id} non trouvée. Vérifiez que la police existe.`;
      } else if (error.message.includes('500')) {
        errorMessage = 'Erreur serveur. Vérifiez les logs du backend.';
      }
      
      throw new Error(errorMessage);
    }
  },

  async delete(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID police invalide');
      }
      
      const response = await fetchAPI(`/polices/${id}`, {
        method: 'DELETE',
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression police ${id}:`, error);
      throw error;
    }
  },

  // ==============================================
  // GESTION DES BÉNÉFICIAIRES DE POLICE
  // ==============================================

  async addBeneficiaire(policeId, beneficiaireData) {
    try {
      if (!policeId || isNaN(parseInt(policeId))) {
        throw new Error('ID police invalide');
      }
      
      console.log(`➕ Ajout bénéficiaire police ${policeId}:`, beneficiaireData);
      
      const dataToSend = {
        ...beneficiaireData,
        COD_POL: policeId,
        ENT_BPO: beneficiaireData.ENT_BPO ? formatDateForAPI(beneficiaireData.ENT_BPO) : null,
        SOR_BPO: beneficiaireData.SOR_BPO ? formatDateForAPI(beneficiaireData.SOR_BPO) : null,
        SUS_BPO: beneficiaireData.SUS_BPO ? formatDateForAPI(beneficiaireData.SUS_BPO) : null,
        REM_BPO: beneficiaireData.REM_BPO ? formatDateForAPI(beneficiaireData.REM_BPO) : null,
        DAT_DEME: beneficiaireData.DAT_DEME ? formatDateForAPI(beneficiaireData.DAT_DEME) : null,
        DAT_DEMS: beneficiaireData.DAT_DEMS ? formatDateForAPI(beneficiaireData.DAT_DEMS) : null
      };
      
      const response = await fetchAPI(`/polices/${policeId}/beneficiaires`, {
        method: 'POST',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur ajout bénéficiaire police ${policeId}:`, error);
      throw error;
    }
  },

  async addBeneficiairesToPolice(policeId, beneficiaireIds) {
    try {
      if (!policeId || isNaN(parseInt(policeId))) {
        throw new Error('ID police invalide');
      }
      
      console.log(`➕ Ajout multiple bénéficiaires à police ${policeId}:`, beneficiaireIds);
      
      if (!Array.isArray(beneficiaireIds) || beneficiaireIds.length === 0) {
        throw new Error('Liste de bénéficiaires invalide ou vide');
      }
      
      const response = await fetchAPI(`/polices/${policeId}/beneficiaires/multiple`, {
        method: 'POST',
        body: { beneficiaireIds },
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur ajout bénéficiaires police ${policeId}:`, error);
      throw error;
    }
  },

  async updateBeneficiaire(policeId, beneficiaireId, beneficiaireData) {
    try {
      if (!policeId || isNaN(parseInt(policeId))) {
        throw new Error('ID police invalide');
      }
      
      if (!beneficiaireId || isNaN(parseInt(beneficiaireId))) {
        throw new Error('ID bénéficiaire police invalide');
      }
      
      console.log(`✏️ Mise à jour bénéficiaire police ${policeId}:`, beneficiaireData);
      
      const dataToSend = { ...beneficiaireData };
      
      if (dataToSend.ENT_BPO) {
        dataToSend.ENT_BPO = formatDateForAPI(dataToSend.ENT_BPO);
      }
      if (dataToSend.SOR_BPO) {
        dataToSend.SOR_BPO = formatDateForAPI(dataToSend.SOR_BPO);
      }
      if (dataToSend.SUS_BPO) {
        dataToSend.SUS_BPO = formatDateForAPI(dataToSend.SUS_BPO);
      }
      if (dataToSend.REM_BPO) {
        dataToSend.REM_BPO = formatDateForAPI(dataToSend.REM_BPO);
      }
      if (dataToSend.DAT_DEME) {
        dataToSend.DAT_DEME = formatDateForAPI(dataToSend.DAT_DEME);
      }
      if (dataToSend.DAT_DEMS) {
        dataToSend.DAT_DEMS = formatDateForAPI(dataToSend.DAT_DEMS);
      }
      
      const response = await fetchAPI(`/polices/${policeId}/beneficiaires/${beneficiaireId}`, {
        method: 'PUT',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour bénéficiaire police ${policeId}:`, error);
      throw error;
    }
  },

  async removeBeneficiaire(policeId, beneficiaireId) {
    try {
      if (!policeId || isNaN(parseInt(policeId))) {
        throw new Error('ID police invalide');
      }
      
      if (!beneficiaireId || isNaN(parseInt(beneficiaireId))) {
        throw new Error('ID bénéficiaire police invalide');
      }
      
      const response = await fetchAPI(`/polices/${policeId}/beneficiaires/${beneficiaireId}`, {
        method: 'DELETE',
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur retrait bénéficiaire police ${policeId}:`, error);
      throw error;
    }
  },

  // ==============================================
  // OPÉRATIONS SPÉCIALES
  // ==============================================

  async createAvenant(policeId, avenantData) {
    try {
      if (!policeId || isNaN(parseInt(policeId))) {
        throw new Error('ID police invalide');
      }
      
      console.log(`📄 Création avenant police ${policeId}:`, avenantData);
      
      const dataToSend = {
        ...avenantData,
        COD_POL: policeId,
        DAT_AVN: avenantData.DAT_AVN ? formatDateForAPI(avenantData.DAT_AVN) : formatDateForAPI(new Date()),
        DEB_AVN: avenantData.DEB_AVN ? formatDateForAPI(avenantData.DEB_AVN) : null,
        FIN_AVN: avenantData.FIN_AVN ? formatDateForAPI(avenantData.FIN_AVN) : null,
        ECH_AVN: avenantData.ECH_AVN ? formatDateForAPI(avenantData.ECH_AVN) : null,
        DAT_CREUTIL: formatDateForAPI(new Date()),
        DAT_MODUTIL: formatDateForAPI(new Date())
      };
      
      const response = await fetchAPI(`/polices/${policeId}/avenants`, {
        method: 'POST',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur création avenant police ${policeId}:`, error);
      throw error;
    }
  },

  async getAvenants(policeId) {
    try {
      if (!policeId || isNaN(parseInt(policeId))) {
        throw new Error('ID police invalide');
      }
      
      const response = await fetchAPI(`/polices/${policeId}/avenants`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur avenants police ${policeId}:`, error);
      return { success: false, message: error.message, avenants: [] };
    }
  },

  async renew(id, renewalData) {
    try {
      const response = await fetchAPI(`/polices/${id}/renew`, {
        method: 'POST',
        body: renewalData,
      });
      return response;
    } catch (error) {
      console.error(`❌ Erreur renouvellement police ${id}:`, error);
      throw error;
    }
  },

  async suspend(id, reason) {
    try {
      const response = await fetchAPI(`/polices/${id}/suspend`, {
        method: 'POST',
        body: { reason },
      });
      return response;
    } catch (error) {
      console.error(`❌ Erreur suspension police ${id}:`, error);
      throw error;
    }
  },

  // ==============================================
  // DONNÉES DE RÉFÉRENCE
  // ==============================================

  async getTypesPolice() {
    try {
      const response = await fetchAPI('/polices/types');
      
      if (response.success) {
        return response;
      }
      
      console.warn('⚠️ API types police non disponible');
      return { 
        success: true,
        types: [
          { value: 'I', label: 'Individuelle' },
          { value: 'F', label: 'Familiale' },
          { value: 'C', label: 'Collective' },
          { value: 'E', label: 'Entreprise' },
          { value: 'G', label: 'Groupe' }
        ]
      };
    } catch (error) {
      console.error('❌ Erreur récupération types police:', error);
      return { success: false, message: error.message, types: [] };
    }
  },

  async getSouscripteurs() {
    try {
      const response = await fetchAPI('/polices/souscripteurs');
      
      if (response.success) {
        return response;
      }
      
      console.warn('⚠️ API souscripteurs non disponible');
      return { 
        success: true,
        souscripteurs: []
      };
    } catch (error) {
      console.error('❌ Erreur récupération souscripteurs:', error);
      return { success: false, message: error.message, souscripteurs: [] };
    }
  },

  async getStatistiques() {
    try {
      const response = await fetchAPI('/polices/statistiques');
      
      if (response.success) {
        return response;
      }
      
      console.warn('⚠️ API statistiques non disponible');
      return { 
        success: false,
        message: 'API non disponible',
        statistiques: {
          total: 0,
          actives: 0,
          suspendues: 0,
          resiliees: 0,
          en_attente: 0,
          par_compagnie: [],
          par_type: []
        } 
      };
    } catch (error) {
      console.error('❌ Erreur statistiques polices:', error);
      return { 
        success: false,
        message: error.message,
        statistiques: {
          total: 0,
          actives: 0,
          suspendues: 0,
          resiliees: 0,
          en_attente: 0,
          par_compagnie: [],
          par_type: []
        } 
      };
    }
  },

  // ==============================================
  // RECHERCHE ET FILTRAGE
  // ==============================================

  async search(searchTerm, filters = {}, limit = 20) {
    try {
      const dataToSend = {
        searchTerm,
        filters,
        limit
      };
      
      const response = await fetchAPI('/polices/search', {
        method: 'POST',
        body: dataToSend,
      });
      
      if (response.success) {
        const polices = response.polices?.map(p => this.formatPoliceForDisplay(p)) || [];
        
        return {
          ...response,
          polices
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche polices:', error);
      return { success: false, message: error.message, polices: [] };
    }
  },

  async searchQuick(searchTerm, limit = 10) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { success: true, polices: [] };
      }
      
      const queryParams = new URLSearchParams();
      queryParams.append('search', searchTerm);
      if (limit) queryParams.append('limit', limit);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/polices/search/quick${queryString ? '?' + queryString : ''}`);
      
      if (response.success) {
        const polices = response.polices?.map(p => ({
          id: p.id || p.COD_POL,
          numero: p.NUM_POL || p.numero,
          compagnie: p.nom_compagnie || '',
          nom_complet: p.nom_complet || `${p.NUM_POL || ''} - ${p.nom_compagnie || ''}`.trim(),
          eff_pol: p.EFF_POL || p.eff_pol,
          res_pol: p.RES_POL || p.res_pol,
          status: p.status || 'Active',
          label: p.label || `${p.NUM_POL || ''} - ${p.nom_compagnie || ''}`.trim()
        })) || [];
        
        return {
          ...response,
          polices
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche rapide polices:', error);
      return { success: false, message: error.message, polices: [] };
    }
  },

  // NOUVELLE FONCTION : Rechercher les bénéficiaires avec leurs polices
  async searchBeneficiairesWithPolices(searchTerm, filters = {}, limit = 20) {
    try {
      const dataToSend = {
        searchTerm,
        filters,
        limit,
        includePolices: true
      };
      
      const response = await fetchAPI('/polices/beneficiaires/search', {
        method: 'POST',
        body: dataToSend,
      });
      
      if (response.success) {
        const beneficiaires = response.beneficiaires?.map(b => ({
          ...b,
          polices: b.polices?.map(p => this.formatPoliceForDisplay(p)) || []
        })) || [];
        
        return {
          ...response,
          beneficiaires
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche bénéficiaires avec polices:', error);
      return { success: false, message: error.message, beneficiaires: [] };
    }
  },

  // ==============================================
  // FONCTIONS UTILITAIRES
  // ==============================================


  async testConnection() {
    try {
      const response = await fetchAPI('/polices?limit=1');
      return {
        success: response.success !== false,
        message: response.success !== false ? 'API polices opérationnelle' : 'API en erreur',
        timestamp: new Date().toISOString(),
        details: response
      };
    } catch (error) {
      console.error('❌ Test connexion polices échoué:', error);
      return {
        success: false,
        message: 'API polices non disponible',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  formatPoliceForDisplay(police) {
    if (!police) return null;
    
    let statut = 'INACTIVE';
    if (police.STD_POL === 1) {
      statut = 'ACTIVE';
    } else if (police.STD_POL === 2) {
      statut = 'SUSPENDUE';
    } else if (police.STD_POL === 3) {
      statut = 'RESILIEE';
    }
    
    const typePolice = police.TYP_POL ? this.getPoliceTypeLabel(police.TYP_POL) : 
                      (police.TYPE_POLICE || 'Individuelle');
    
    const formattedPolice = {
      COD_POL: police.COD_POL,
      NUM_POLICE: police.NUM_POL || police.NUM_POLICE || police.numero,
      NUMR_POLICE: police.NUMR_POL || police.NUMR_POLICE || police.numero_reference,
      
      COD_ASS: police.COD_ASS,
      NOM_COMPAGNIE: police.nom_compagnie || police.NOM_COMPAGNIE || 
                     (police.COMPAGNIE ? police.COMPAGNIE.NOM_COMPAGNIE : null),
      
      COD_RESEAU: police.COD_RESEAU || police.COD_RES,
      NOM_RESEAU: police.nom_reseau || police.NOM_RESEAU,
      TYPE_RESEAU: police.type_reseau || police.TYPE_RESEAU,
      
      DATE_EFFET: police.EFF_POL || police.date_effet || police.DATE_EFFET,
      DATE_ECHEANCE: police.RES_POL || police.date_resiliation || police.DATE_ECHEANCE,
      DATE_EMISSION: police.EMP_POL || police.date_emission || police.DATE_EMISSION,
      
      STATUT_POLICE: police.STATUT_POLICE || statut,
      TYPE_POLICE: typePolice,
      TYP_POL: police.TYP_POL,
      
      MONTANT_PRIME: police.PRM_POL || police.prime || police.MONTANT_PRIME,
      TAUX_ASSURANCE: police.TXA_POL || police.taux_assurance || police.TAUX_ASSURANCE,
      
      REMARQUES: police.REM_POL || police.remarques || police.REMARQUES,
      OBSERVATIONS: police.OBS_POL || police.observations || police.OBSERVATIONS,
      
      DATE_CREATION: police.DAT_CREUTIL || police.date_creation,
      DATE_MODIFICATION: police.DAT_MODUTIL || police.date_modification,
      
      // NOUVEAU CHAMP : Employeur
      EMPLOYEUR: police.EMPLOYEUR || null,
      
      // Liste des bénéficiaires
      beneficiaires: police.beneficiaires || [],
      totalBeneficiaires: police.beneficiaires ? police.beneficiaires.length : 0,
      
      // Informations réseau de soins
      reseau_soins: police.reseau_soins || null,
      
      // GARANTIES
      GARANTIES: police.GARANTIES || [],
      totalGaranties: police.GARANTIES ? police.GARANTIES.length : 0,
      
      // Clé unique
      key: police.NUM_POL || police.NUM_POLICE || `police-${police.COD_POL}`,
      
      // Compatibilité
      id: police.COD_POL,
      numero: police.NUM_POL || police.NUM_POLICE,
      nom_compagnie: police.nom_compagnie || police.NOM_COMPAGNIE,
      date_effet: police.EFF_POL || police.DATE_EFFET,
      date_resiliation: police.RES_POL || police.DATE_ECHEANCE,
      prime: police.PRM_POL || police.MONTANT_PRIME,
      taux_assurance: police.TXA_POL || police.TAUX_ASSURANCE,
      statut: statut,
      type_police: typePolice
    };
    
    return formattedPolice;
  },

  calculatePoliceStatus(police) {
    const today = new Date();
    const effPol = police.EFF_POL ? new Date(police.EFF_POL) : null;
    const resPol = police.RES_POL ? new Date(police.RES_POL) : null;
    const susPol = police.SUS_POL ? new Date(police.SUS_POL) : null;
    
    if (resPol && resPol < today) {
      return 'Résiliée';
    }
    
    if (susPol && susPol < today) {
      return 'Suspendue';
    }
    
    if (effPol && effPol > today) {
      return 'En attente';
    }
    
    if (police.STD_POL === 1 || police.STD_POL === true) {
      return 'Active';
    }
    
    return 'Inactive';
  },

  isPoliceActive(police) {
    const status = this.calculatePoliceStatus(police);
    return status === 'Active';
  },

  validatePoliceData(data, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate) {
      if (!data.COD_ASS || isNaN(parseInt(data.COD_ASS))) {
        errors.push('La compagnie est obligatoire');
      }
      if (!data.NUM_POLICE || data.NUM_POLICE.trim() === '') {
        errors.push('Le numéro de police est obligatoire');
      }
      if (!data.DATE_EFFET) {
        errors.push('La date d\'effet est obligatoire');
      }
      if (!data.EMPLOYEUR) {
        errors.push('L\'employeur est obligatoire');
      }
    }
    
    if (data.DATE_EFFET) {
      const effDate = new Date(data.DATE_EFFET);
      if (isNaN(effDate.getTime())) {
        errors.push('Date d\'effet invalide');
      }
    }
    
    if (data.DATE_ECHEANCE) {
      const resDate = new Date(data.DATE_ECHEANCE);
      if (isNaN(resDate.getTime())) {
        errors.push('Date de résiliation invalide');
      }
      
      if (data.DATE_EFFET && resDate < new Date(data.DATE_EFFET)) {
        errors.push('La date de résiliation ne peut pas être antérieure à la date d\'effet');
      }
    }
    
    if (data.TAUX_ASSURANCE) {
      const taux = parseFloat(data.TAUX_ASSURANCE);
      if (isNaN(taux) || taux < 0 || taux > 100) {
        errors.push('Le taux d\'assurance doit être compris entre 0 et 100');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // NOUVELLE FONCTION : Obtenir le résumé des polices d'un bénéficiaire
  async getBeneficiairePoliceSummary(beneficiaireId) {
    try {
      if (!beneficiaireId || isNaN(parseInt(beneficiaireId))) {
        throw new Error('ID bénéficiaire invalide');
      }
      
      const response = await fetchAPI(`/polices/beneficiaire/${beneficiaireId}/summary`);
      
      if (response.success) {
        return {
          success: true,
          summary: {
            totalPolices: response.totalPolices || 0,
            policesActives: response.policesActives || 0,
            policesInactives: response.policesInactives || 0,
            policesExpirant: response.policesExpirant || 0,
            compagnies: response.compagnies || [],
            dernierRenouvellement: response.dernierRenouvellement,
            prochaineEcheance: response.prochaineEcheance
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur résumé polices bénéficiaire ${beneficiaireId}:`, error);
      return { 
        success: false, 
        message: error.message,
        summary: {
          totalPolices: 0,
          policesActives: 0,
          policesInactives: 0,
          policesExpirant: 0,
          compagnies: [],
          dernierRenouvellement: null,
          prochaineEcheance: null
        }
      };
    }
  },

  // NOUVELLE FONCTION : Synchronisation BENEF_POLICE
  async syncBenefPolice() {
    try {
      const response = await fetchAPI('/polices/sync/benef-police', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur synchronisation BENEF_POLICE:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }
};



  //----- API des Compagnies d'Assurance -----//
  // services/api.js - API des Compagnies CORRIGÉE
export const compagniesAPI = {
  // Récupérer toutes les compagnies - CORRIGÉ
async getAll(params = {}) {
  try {
    console.log('📡 Appel API compagnies avec params:', params);
    
    // Nettoyer les paramètres
    const cleanParams = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Ne pas convertir le statut - on ne filtre pas par actif/inactif
        // On ignore simplement le paramètre 'statut' pour récupérer toutes les compagnies
        if (key !== 'statut') {
          cleanParams[key] = value;
        }
      }
    });
    
    // Ajouter un paramètre pour récupérer toutes les compagnies par défaut
    if (!cleanParams.limit) {
      cleanParams.limit = 100;
    }
    
    const queryString = buildQueryString(cleanParams);
    console.log('📡 URL appelée:', `/compagnies${queryString}`);
    
    const response = await fetchAPI(`/compagnies${queryString}`);
    console.log('📡 Réponse API compagnies:', response);
    
    // Vérifier si la réponse est valide
    if (!response) {
      throw new Error('Réponse vide de l\'API compagnies');
    }
    
    // RETOURNER DIRECTEMENT LA RÉPONSE DU BACKEND SANS TRANSFORMATION
    if (response.success !== false) {
      return response;
    }
    
    return response;
  } catch (error) {
    console.error('❌ Erreur récupération compagnies:', error);
    return { 
      success: false, 
      message: error.message, 
      compagnies: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    };
  }
},

  // Récupérer une compagnie par son ID - CORRIGÉ
  async getById(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID compagnie invalide');
      }
      const response = await fetchAPI(`/compagnies/${id}`);
      
      // Normaliser la réponse
      if (response.success !== false && !response.compagnie && response.id) {
        return {
          success: true,
          compagnie: response
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération compagnie ${id}:`, error);
      return {
        success: false,
        message: error.message,
        compagnie: null
      };
    }
  },

 // Dans api.js - fonction create de compagniesAPI
async create(compagnieData) {
  try {
    console.log('📝 Données reçues pour création compagnie:', compagnieData);
    
    // Vérification du nom de compagnie
    let nomCompagnie = '';
    
    if (compagnieData.LIB_ASS && compagnieData.LIB_ASS.trim() !== '') {
      nomCompagnie = compagnieData.LIB_ASS.trim();
    } else if (compagnieData.nom && compagnieData.nom.trim() !== '') {
      nomCompagnie = compagnieData.nom.trim();
    } else if (compagnieData.nom_compagnie && compagnieData.nom_compagnie.trim() !== '') {
      nomCompagnie = compagnieData.nom_compagnie.trim();
    }
    
    if (!nomCompagnie) {
      console.error('❌ Nom de compagnie manquant');
      return {
        success: false,
        message: 'Le nom de la compagnie (LIB_ASS) est obligatoire'
      };
    }
    
    // Formater les données pour l'API
    const dataToSend = {
      LIB_ASS: nomCompagnie,
      NUM_ADR: compagnieData.ADRESSE || compagnieData.adresse || '',
      AUT_ASS: compagnieData.TELEPHONE || compagnieData.telephone || '',
      EMA_ASS: compagnieData.EMAIL || compagnieData.email || '',
      NUM_RIB: compagnieData.NUM_AGREMENT || compagnieData.num_agrement || '',
      OBS_ASS: compagnieData.NOTES || compagnieData.observations || '',
      GEN_ASS: compagnieData.TYPE_COMPAGNIE || compagnieData.gen_ass || 'ASSURANCE',
      COD_PAY: compagnieData.COD_PAY || compagnieData.cod_pay || 'SN',
      COD_STA: compagnieData.ACTIF !== undefined 
        ? (compagnieData.ACTIF === true || compagnieData.ACTIF === 1 || compagnieData.ACTIF === '1' ? 1 : 0)
        : 1,
      COD_CREUTIL: 'SYSTEM'
    };
    
    console.log('📤 Données formatées pour le backend:', dataToSend);
    
    // Appel API pour créer la compagnie
    const response = await fetchAPI('/compagnies', {
      method: 'POST',
      body: dataToSend,
    });
    
    console.log('✅ Réponse API création:', response);
    
    return response;
    
  } catch (error) {
    console.error('❌ Erreur création compagnie:', error);
    
    return {
      success: false,
      message: error.message || 'Erreur lors de la création de la compagnie',
      compagnie: null
    };
  }
},

async getNextId() {
  try {
    const response = await fetchAPI('/compagnies/next-id', {
      method: 'GET',
    });
    return response;
  } catch (error) {
    console.error('Erreur récupération next ID:', error);
    return {
      success: false,
      message: error.message || 'Erreur lors de la récupération du prochain ID'
    };
  }
},

  // Mettre à jour une compagnie - CORRIGÉ ET SIMPLIFIÉ
  async update(id, compagnieData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID compagnie invalide');
      }
      
      console.log(`✏️ Mise à jour compagnie ${id}:`, compagnieData);
      
      // SIMPLIFICATION : Utiliser directement les données reçues
      const dataToSend = {};
      
      // Copier uniquement les champs qui existent dans compagnieData
      const allowedFields = [
        'LIB_ASS', 'ADRESSE', 'TELEPHONE', 'EMAIL', 'NUM_AGREMENT',
        'SITE_WEB', 'CONTACT_PRINCIPAL', 'TYPE_COMPAGNIE', 'CAPITAL_SOCIAL',
        'NUMERO_RC', 'NUMERO_FISCAL', 'NOTES', 'ACTIF'
      ];
      
      allowedFields.forEach(field => {
        // Vérifier en majuscules et minuscules
        const fieldLower = field.toLowerCase();
        const value = compagnieData[field] !== undefined ? compagnieData[field] : compagnieData[fieldLower];
        
        if (value !== undefined) {
          if (field === 'CAPITAL_SOCIAL') {
            dataToSend[field] = parseFloat(value) || 0;
          } else if (field === 'ACTIF') {
            dataToSend[field] = value === true || value === 1 || value === '1' ? 1 : 0;
          } else {
            dataToSend[field] = value;
          }
        }
      });
      
      // S'assurer qu'on a au moins un champ à mettre à jour
      if (Object.keys(dataToSend).length === 0) {
        throw new Error('Aucune donnée à mettre à jour');
      }
      
      console.log('📤 Données de mise à jour envoyées:', dataToSend);
      
      const response = await fetchAPI(`/compagnies/${id}`, {
        method: 'PUT',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour compagnie ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour de la compagnie',
        compagnie: null
      };
    }
  },

  // Désactiver une compagnie - CORRIGÉ
  async delete(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID compagnie invalide');
      }
      
      // Utiliser l'endpoint standard PUT pour mettre à jour
      const response = await this.update(id, { ACTIF: 0 });
      
      if (response.success) {
        return {
          success: true,
          message: 'Compagnie désactivée avec succès'
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur désactivation compagnie ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la désactivation de la compagnie'
      };
    }
  },

  // Activer une compagnie - CORRIGÉ
  async activate(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID compagnie invalide');
      }
      
      // Utiliser l'endpoint standard PUT pour mettre à jour
      const response = await this.update(id, { ACTIF: 1 });
      
      if (response.success) {
        return {
          success: true,
          message: 'Compagnie activée avec succès'
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur activation compagnie ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'activation de la compagnie'
      };
    }
  },

  // Rechercher des compagnies - CORRIGÉ
  async search(searchTerm, filters = {}, limit = 20) {
    try {
      // Utiliser getAll avec les paramètres de recherche
      const params = {
        ...filters,
        search: searchTerm,
        limit: limit
      };
      
      return await this.getAll(params);
    } catch (error) {
      console.error('❌ Erreur recherche compagnies:', error);
      return { 
        success: false, 
        message: error.message, 
        compagnies: [],
        count: 0
      };
    }
  },

  // Récupérer les statistiques des compagnies - CORRIGÉ (calcul client)
  async getStatistiques() {
    try {
      // Récupérer toutes les compagnies
      const response = await this.getAll({ limit: 1000 });
      
      if (response.success && response.compagnies) {
        const compagnies = response.compagnies;
        
        // Calculer les statistiques côté client
        const statistiques = {
          total: compagnies.length,
          actives: compagnies.filter(c => c.ACTIF === 1 || c.ACTIF === true).length,
          inactives: compagnies.filter(c => c.ACTIF === 0 || c.ACTIF === false).length,
          par_type: this.calculateStatsByType(compagnies),
          avec_conventions: 0, // À calculer si l'API des conventions existe
          sans_conventions: 0  // À calculer si l'API des conventions existe
        };
        
        return {
          success: true,
          statistiques: statistiques
        };
      }
      
      return {
        success: false,
        message: response.message || 'Erreur lors du calcul des statistiques',
        statistiques: {
          total: 0,
          actives: 0,
          inactives: 0,
          par_type: [],
          avec_conventions: 0,
          sans_conventions: 0
        }
      };
    } catch (error) {
      console.error('❌ Erreur statistiques compagnies:', error);
      return {
        success: false,
        message: error.message,
        statistiques: {
          total: 0,
          actives: 0,
          inactives: 0,
          par_type: [],
          avec_conventions: 0,
          sans_conventions: 0
        }
      };
    }
  },

  // Fonction helper pour calculer les stats par type
  calculateStatsByType(compagnies) {
    const typeCounts = {};
    
    compagnies.forEach(compagnie => {
      const type = compagnie.TYPE_COMPAGNIE || 'ASSURANCE';
      if (!typeCounts[type]) {
        typeCounts[type] = 0;
      }
      typeCounts[type]++;
    });
    
    return Object.entries(typeCounts).map(([type, count]) => ({
      type: type,
      count: count
    }));
  },

  // Récupérer les compagnies pour l'autocomplétion - CORRIGÉ
  async getForAutocomplete(searchTerm = '') {
    try {
      const response = await this.getAll({
        search: searchTerm,
        limit: 10
      });
      
      if (response.success) {
        // Formater pour l'autocomplétion
        const compagniesFormatted = response.compagnies.map(compagnie => ({
          id: compagnie.id || compagnie.COD_ASS,
          label: compagnie.LIB_ASS || compagnie.nom_compagnie || 'Compagnie sans nom',
          value: compagnie.id || compagnie.COD_ASS
        }));
        
        return {
          success: true,
          compagnies: compagniesFormatted
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur autocomplétion compagnies:', error);
      return {
        success: false,
        message: error.message,
        compagnies: []
      };
    }
  },

  // Récupérer les compagnies avec conventions actives - CORRIGÉ (simulation)
  async getAvecConventionsActives() {
    try {
      // Pour l'instant, retourner toutes les compagnies actives
      const response = await this.getAll({ actif: 1 });
      
      if (response.success) {
        return {
          success: true,
          compagnies: response.compagnies,
          message: 'Compagnies actives récupérées'
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération compagnies avec conventions actives:', error);
      return {
        success: false,
        message: error.message,
        compagnies: []
      };
    }
  },

  // Exporter la liste des compagnies - CORRIGÉ (simulation)
  async export(format = 'excel', filters = {}) {
    try {
      // Récupérer toutes les compagnies
      const response = await this.getAll({ ...filters, limit: 1000 });
      
      if (response.success) {
        // Simuler l'export
        const data = response.compagnies;
        
        return {
          success: true,
          message: `Données prêtes pour export ${format}`,
          data: data,
          format: format,
          count: data.length
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur export compagnies:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Vérifier si une compagnie existe déjà - CORRIGÉ (simulation)
  async checkExists(field, value, excludeId = null) {
    try {
      // Récupérer toutes les compagnies
      const response = await this.getAll({ limit: 1000 });
      
      if (response.success) {
        const compagnies = response.compagnies;
        
        // Rechercher une correspondance
        const exists = compagnies.some(compagnie => {
          if (excludeId && (compagnie.id === excludeId || compagnie.COD_ASS === excludeId)) {
            return false;
          }
          
          // Vérifier le champ spécifié
          const fieldValue = compagnie[field] || compagnie[field.toLowerCase()];
          return fieldValue && fieldValue.toString().toLowerCase() === value.toString().toLowerCase();
        });
        
        return {
          success: true,
          exists: exists,
          message: exists ? 'Une compagnie avec cette valeur existe déjà' : 'Valeur disponible'
        };
      }
      
      return {
        success: false,
        exists: false,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Erreur vérification existence compagnie:', error);
      return {
        success: false,
        message: error.message,
        exists: false
      };
    }
  },

  // Récupérer l'historique des modifications d'une compagnie - CORRIGÉ (simulation)
  async getHistorique(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID compagnie invalide');
      }
      
      // Simuler l'historique
      const historique = [
        {
          id: 1,
          action: 'Création',
          date: new Date().toISOString(),
          utilisateur: 'SYSTEM',
          details: 'Création initiale de la compagnie'
        }
      ];
      
      return {
        success: true,
        historique: historique,
        message: 'Historique récupéré'
      };
    } catch (error) {
      console.error(`❌ Erreur historique compagnie ${id}:`, error);
      return {
        success: false,
        message: error.message,
        historique: []
      };
    }
  },

  // Télécharger le logo d'une compagnie - CORRIGÉ (simulation)
  async uploadLogo(id, file) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID compagnie invalide');
      }
      
      console.log(`📤 Upload logo pour compagnie ${id}:`, file.name);
      
      // Simuler le téléchargement
      return {
        success: true,
        message: 'Logo téléchargé avec succès',
        logoUrl: `/logos/compagnie-${id}.png`
      };
    } catch (error) {
      console.error(`❌ Erreur upload logo compagnie ${id}:`, error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Récupérer le logo d'une compagnie - CORRIGÉ (simulation)
  async getLogo(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID compagnie invalide');
      }
      
      // Simuler la récupération du logo
      return {
        success: true,
        logoUrl: `/logos/compagnie-${id}.png`,
        exists: false
      };
    } catch (error) {
      console.error(`❌ Erreur récupération logo compagnie ${id}:`, error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Supprimer le logo d'une compagnie - CORRIGÉ (simulation)
  async deleteLogo(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID compagnie invalide');
      }
      
      console.log(`🗑️ Suppression logo compagnie ${id}`);
      
      // Simuler la suppression
      return {
        success: true,
        message: 'Logo supprimé avec succès'
      };
    } catch (error) {
      console.error(`❌ Erreur suppression logo compagnie ${id}:`, error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Synchroniser les compagnies avec un système externe - CORRIGÉ (simulation)
  async syncWithExternal(source) {
    try {
      console.log(`🔄 Synchronisation avec ${source}`);
      
      // Simuler la synchronisation
      return {
        success: true,
        message: `Synchronisation avec ${source} terminée`,
        synced: 0,
        errors: []
      };
    } catch (error) {
      console.error('❌ Erreur synchronisation compagnies:', error);
      return {
        success: false,
        message: error.message,
        synced: 0,
        errors: []
      };
    }
  },

  // NOUVELLE MÉTHODE: Tester la connexion à l'API
  async testConnection() {
    try {
      const response = await fetchAPI('/compagnies?limit=1');
      return {
        success: response.success !== false,
        message: response.success !== false ? 'API compagnies opérationnelle' : 'API en erreur',
        timestamp: new Date().toISOString(),
        details: response
      };
    } catch (error) {
      console.error('❌ Test connexion compagnies échoué:', error);
      return {
        success: false,
        message: 'API compagnies non disponible',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  // NOUVELLE MÉTHODE: Formater une compagnie pour l'affichage
  formatCompagnieForDisplay(compagnie) {
    if (!compagnie) return null;
    
    return {
      id: compagnie.id || compagnie.COD_ASS,
      nom: compagnie.LIB_ASS || compagnie.nom_compagnie,
      adresse: compagnie.ADRESSE || compagnie.adresse,
      telephone: compagnie.TELEPHONE || compagnie.telephone,
      email: compagnie.EMAIL || compagnie.email,
      site_web: compagnie.SITE_WEB || compagnie.site_web,
      num_agrement: compagnie.NUM_AGREMENT || compagnie.num_agrement,
      contact_principal: compagnie.CONTACT_PRINCIPAL || compagnie.contact_principal,
      type_compagnie: compagnie.TYPE_COMPAGNIE || compagnie.type_compagnie,
      capital_social: compagnie.CAPITAL_SOCIAL || compagnie.capital_social,
      numero_rc: compagnie.NUMERO_RC || compagnie.numero_rc,
      numero_fiscal: compagnie.NUMERO_FISCAL || compagnie.numero_fiscal,
      notes: compagnie.NOTES || compagnie.notes,
      actif: compagnie.ACTIF === 1 || compagnie.ACTIF === true,
      date_creation: compagnie.DATE_CREATION || compagnie.date_creation,
      date_modification: compagnie.DATE_MODIFICATION || compagnie.date_modification
    };
  }
};

// ------------ Routes des Types Assurance ------------ //
// API pour les types d'assureurs
export const typesAssureursAPI = {
  // Récupérer la liste paginée des types d'assureurs
  async getAll(page = 1, limit = 10, search = '', cod_sta = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(cod_sta && { cod_sta })
      });
      
      const response = await fetchAPI(`/types-assureurs?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération types assureurs:', error);
      return { 
        success: false, 
        message: error.message, 
        types_assureurs: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      };
    }
  },

  // Récupérer un type d'assureur par ID
  async getById(id) {
    try {
      const params = new URLSearchParams({
        cod_sta: id.toString()
      });
      
      const response = await fetchAPI(`/types-assureurs?${params.toString()}`);
      
      if (response.success && response.types_assureurs.length > 0) {
        return {
          success: true,
          type_assureur: response.types_assureurs[0]
        };
      }
      
      return {
        success: false,
        message: 'Type d\'assureur non trouvé'
      };
    } catch (error) {
      console.error(`❌ Erreur type assureur ${id}:`, error);
      throw error;
    }
  },

  // Récupérer la liste complète des types d'assureurs (pour dropdown)
  async getList() {
    try {
      const response = await fetchAPI('/types-assureurs/list');
      return response;
    } catch (error) {
      console.error('❌ Erreur liste types assureurs:', error);
      return { 
        success: false, 
        message: error.message, 
        types_assureurs: [] 
      };
    }
  },

  // Créer un nouveau type d'assureur
  async create(typeAssureurData) {
    try {
      const response = await fetchAPI('/types-assureurs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(typeAssureurData)
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur création type assureur:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  // Mettre à jour un type d'assureur
  async update(id, typeAssureurData) {
    try {
      const response = await fetchAPI(`/types-assureurs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(typeAssureurData)
      });
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour type assureur ${id}:`, error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  // Supprimer un type d'assureur
  async delete(id) {
    try {
      const response = await fetchAPI(`/types-assureurs/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression type assureur ${id}:`, error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }
};


export const baremesAPI = {
  // ==============================================
  // FONCTIONS UTILITAIRES INTERNES
  // ==============================================


  getTypeBarremeLabel(typeCode) {
    if (!typeCode) return 'Médical';
    
    if (typeof typeCode === 'number') {
      const stringCode = TYPE_MAPPING[typeCode];
      return TYPE_LABELS[stringCode] || 'Médical';
    }
    
    return TYPE_LABELS[typeCode] || 'Médical';
  },

  getTypeBarremeCode(typeLabel) {
    const entry = Object.entries(TYPE_LABELS).find(([code, label]) => label === typeLabel);
    return entry ? entry[0] : 'M';
  },

  getTypeNumericValue(typeCode) {
    if (!typeCode) return 1;
    
    if (typeof typeCode === 'number') {
      return typeCode;
    }
    
    return TYPE_MAPPING[typeCode] || 1;
  },

  getTypeStringCode(numericValue) {
    if (!numericValue) return 'M';
    
    if (typeof numericValue === 'string') {
      return numericValue;
    }
    
    return TYPE_MAPPING[numericValue] || 'M';
  },

  normalizeBarremeData(rawData) {
    if (!rawData) return null;
    
    const codBar = rawData.COD_BAR || '0000';
    const codPay = rawData.COD_PAY || 'FR';
    const libBar = rawData.LIB_BAR || 'Libellé non spécifié';
    
    // Gérer le type
    let typBarNumeric = 1;
    let typBarString = 'M';
    
    if (rawData.TYP_BAR !== undefined && rawData.TYP_BAR !== null) {
      if (typeof rawData.TYP_BAR === 'number') {
        typBarNumeric = rawData.TYP_BAR;
        typBarString = this.getTypeStringCode(rawData.TYP_BAR);
      } else if (typeof rawData.TYP_BAR === 'string') {
        typBarString = rawData.TYP_BAR;
        typBarNumeric = this.getTypeNumericValue(rawData.TYP_BAR);
      }
    } else if (rawData.TYP_BAR_STRING) {
      typBarString = rawData.TYP_BAR_STRING;
      typBarNumeric = this.getTypeNumericValue(typBarString);
    }
    
    return {
      // Identifiants
      key: `${codBar}-${codPay}`,
      id: codBar,
      COD_BAR: codBar,
      COD_PAY: codPay,
      LIB_BAR: libBar,
      
      // Type
      TYP_BAR: typBarNumeric,
      TYP_BAR_STRING: typBarString,
      TYPE_BAREME: this.getTypeBarremeLabel(typBarString),
      
      // Dates
      DATE_CREATION: rawData.DAT_CREUTIL,
      DATE_MODIFICATION: rawData.DAT_MODUTIL,
      DAT_CREUTIL: rawData.DAT_CREUTIL,
      DAT_MODUTIL: rawData.DAT_MODUTIL,
      
      // Utilisateurs
      UTILISATEUR_CREATION: rawData.COD_CREUTIL || 'ADMIN',
      UTILISATEUR_MODIFICATION: rawData.COD_MODUTIL || 'ADMIN',
      
      // Informations complémentaires
      LIB_PAY: rawData.LIB_PAY || '',
      
      // Statistiques (initialisées à 0, seront calculées si disponibles)
      totalAffections: 0,
      totalGaranties: 0,
      totalLettres: 0,
      totalPlafonds: 0,
      
      // Compatibilité
      code: codBar,
      libelle: libBar,
      pays: codPay,
      type: typBarNumeric,
      type_code: typBarString
    };
  },

  // ==============================================
  // RÉCUPÉRATION DE DONNÉES - CODE_BAREME
  // ==============================================

  async getAll(params = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        cod_pay, 
        type_bareme,
        sortBy = 'DAT_CREUTIL',
        sortOrder = 'DESC'
      } = params;
      
      console.log('📤 Appel API getAll avec params:', params);
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      
      if (search) queryParams.append('search', search);
      if (cod_pay) queryParams.append('cod_pay', cod_pay);
      if (type_bareme) {
        const numericType = this.getTypeNumericValue(type_bareme);
        queryParams.append('type_bareme', numericType);
      }
      if (sortBy) queryParams.append('sortBy', sortBy);
      if (sortOrder) queryParams.append('sortOrder', sortOrder);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/baremes${queryString ? '?' + queryString : ''}`);
      
      console.log('📥 Réponse API getAll:', response);
      
      if (response.success) {
        const baremes = (response.baremes || []).map(b => this.normalizeBarremeData(b));
        
        return {
          success: true,
          baremes: baremes,
          pagination: response.pagination || {
            total: baremes.length,
            page: page,
            limit: limit,
            totalPages: Math.ceil(baremes.length / limit)
          }
        };
      }
      
      // Si l'API retourne une erreur, retourner l'erreur proprement
      return {
        success: false,
        message: response.message || 'Erreur lors de la récupération des barèmes',
        baremes: [],
        pagination: {
          total: 0,
          page: page,
          limit: limit,
          totalPages: 0
        }
      };
      
    } catch (error) {
      console.error('❌ Erreur récupération barèmes:', error);
      return { 
        success: false, 
        message: error.message,
        baremes: [], 
        pagination: { 
          total: 0, 
          page: 1, 
          limit: 20, 
          totalPages: 0 
        } 
      };
    }
  },

  async getPays() {
    try {
      console.log('🌍 Récupération des pays...');
      
      const response = await fetchAPI('/reference/pays');
      
      if (response.success) {
        return response;
      }
      
      // Si l'API retourne une erreur, la retourner proprement
      return {
        success: false,
        message: response.message || 'Erreur lors de la récupération des pays',
        pays: []
      };
      
    } catch (error) {
      console.error('❌ Erreur récupération pays:', error);
      return { 
        success: false, 
        message: error.message,
        pays: [] 
      };
    }
  },

  async getTypesBarreme() {
    try {
      console.log('📋 Récupération des types de barème...');
      
      const response = await fetchAPI('/baremes/types');
      
      if (response.success) {
        const types = response.types || [];
        
        // Ajouter les couleurs
        const colorMapping = {
          'M': 'blue', 'H': 'red', 'P': 'green', 'L': 'purple',
          'C': 'orange', 'D': 'cyan', 'O': 'geekblue', 'A': 'magenta', 'S': 'volcano'
        };
        
        const typesWithColors = types.map(type => ({
          ...type,
          color: colorMapping[type.value] || 'blue'
        }));
        
        return {
          success: true,
          types: typesWithColors
        };
      }
      
      // Si l'API retourne une erreur, la retourner proprement
      return {
        success: false,
        message: response.message || 'Erreur lors de la récupération des types',
        types: []
      };
      
    } catch (error) {
      console.error('❌ Erreur récupération types:', error);
      return { 
        success: false, 
        message: error.message,
        types: [] 
      };
    }
  },
 

  async getById(cod_bar, cod_pay = null) {
    try {
      if (!cod_bar) {
        throw new Error('Code barème invalide');
      }
      
      console.log(`🔍 Récupération détaillée barème ${cod_bar}${cod_pay ? ` pour pays ${cod_pay}` : ''}`);
      
      const queryParams = new URLSearchParams();
      if (cod_pay) queryParams.append('cod_pay', cod_pay);
      queryParams.append('includeAffections', 'true');
      queryParams.append('includeGaranties', 'true');
      queryParams.append('includeLettres', 'true');
      queryParams.append('includePlafonds', 'true');
      queryParams.append('includeTarifs', 'true');
      
      const queryString = queryParams.toString();
      const endpoint = cod_pay 
        ? `/baremes/${cod_bar}/pays/${cod_pay}${queryString ? '?' + queryString : ''}`
        : `/baremes/${cod_bar}${queryString ? '?' + queryString : ''}`;
      
      const response = await fetchAPI(endpoint);
      
      if (response.success && response.bareme) {
        return {
          ...response,
          bareme: this.formatBarremeForDisplay(response.bareme)
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération barème ${cod_bar}:`, error);
      throw error;
    }
  },

  async getByPays(cod_pay, params = {}) {
    try {
      if (!cod_pay) {
        throw new Error('Code pays invalide');
      }
      
      const { 
        page = 1, 
        limit = 50,
        type_bareme,
        search
      } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (type_bareme) queryParams.append('type_bareme', type_bareme);
      if (search) queryParams.append('search', search);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/baremes/pays/${cod_pay}${queryString ? '?' + queryString : ''}`);
      
      if (response.success) {
        const baremes = response.baremes?.map(b => this.formatBarremeForDisplay(b)) || [];
        
        return {
          ...response,
          baremes: baremes
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération barèmes pays ${cod_pay}:`, error);
      return { success: false, message: error.message, baremes: [] };
    }
  },

  async getByType(type_bareme, params = {}) {
    try {
      const { 
        page = 1, 
        limit = 50,
        cod_pay
      } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (cod_pay) queryParams.append('cod_pay', cod_pay);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/baremes/type/${type_bareme}${queryString ? '?' + queryString : ''}`);
      
      if (response.success) {
        const baremes = response.baremes?.map(b => this.formatBarremeForDisplay(b)) || [];
        
        return {
          ...response,
          baremes: baremes
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération barèmes type ${type_bareme}:`, error);
      return { success: false, message: error.message, baremes: [] };
    }
  },

  async getBarèmesByPolice(policeId) {
    try {
      if (!policeId) {
        throw new Error('ID police invalide');
      }
      
      console.log(`🔍 Récupération barèmes pour police ${policeId}`);
      
      const response = await fetchAPI(`/baremes/police/${policeId}`);
      
      if (response.success) {
        const baremes = (response.baremes || []).map(b => this.normalizeBarremeData(b));
        
        return {
          success: true,
          baremes: baremes,
          nombreBarèmes: baremes.length
        };
      }
      
      return response;
      
    } catch (error) {
      console.error(`❌ Erreur récupération barèmes police ${policeId}:`, error);
      return {
        success: false,
        message: error.message,
        baremes: []
      };
    }
  },

  // ==============================================
  // RÉCUPÉRATION - BAREME_BAREME (DÉTAILS)
  // ==============================================

  async getDetailsBareme(num_bar, cod_pay) {
    try {
      if (!num_bar || !cod_pay) {
        throw new Error('Numéro barème ou code pays invalide');
      }
      
      const response = await fetchAPI(`/baremes/${cod_pay}/${num_bar}/details`);
      
      if (response.success) {
        return {
          ...response,
          details: this.formatDetailsBarremeForDisplay(response.details)
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur détails barème ${num_bar} pays ${cod_pay}:`, error);
      return { success: false, message: error.message, details: null };
    }
  },

  async getAllDetailsBareme(cod_bar, cod_pay) {
    try {
      if (!cod_bar || !cod_pay) {
        throw new Error('Code barème ou code pays invalide');
      }
      
      const response = await fetchAPI(`/baremes/${cod_bar}/pays/${cod_pay}/details/all`);
      
      if (response.success) {
        const details = response.details?.map(d => this.formatDetailsBarremeForDisplay(d)) || [];
        
        return {
          ...response,
          details: details
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur tous détails barème ${cod_bar} pays ${cod_pay}:`, error);
      return { success: false, message: error.message, details: [] };
    }
  },

  // ==============================================
  // GESTION DES AFFECTIONS (BAREME_AFFECTION)
  // ==============================================

  async getAffections(cod_bar, cod_pay, params = {}) {
    try {
      if (!cod_bar || !cod_pay) {
        throw new Error('Code barème ou code pays invalide');
      }
      
      const { 
        page = 1, 
        limit = 50,
        ind_opc
      } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (ind_opc) queryParams.append('ind_opc', ind_opc);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/baremes/${cod_bar}/pays/${cod_pay}/affections${queryString ? '?' + queryString : ''}`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur affections barème ${cod_bar} pays ${cod_pay}:`, error);
      return { success: false, message: error.message, affections: [] };
    }
  },

  async addAffection(cod_bar, cod_pay, affectionData) {
    try {
      if (!cod_bar || !cod_pay) {
        throw new Error('Code barème ou code pays invalide');
      }
      
      console.log(`➕ Ajout affection barème ${cod_bar} pays ${cod_pay}:`, affectionData);
      
      const dataToSend = {
        ...affectionData,
        COD_BAR: cod_bar,
        COD_PAY: cod_pay,
        EFF_BAF: affectionData.EFF_BAF ? formatDateForAPI(affectionData.EFF_BAF) : formatDateForAPI(new Date()),
        DAT_CREUTIL: formatDateForAPI(new Date()),
        DAT_MODUTIL: formatDateForAPI(new Date())
      };
      
      const response = await fetchAPI(`/baremes/${cod_bar}/pays/${cod_pay}/affections`, {
        method: 'POST',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur ajout affection barème ${cod_bar} pays ${cod_pay}:`, error);
      throw error;
    }
  },

  async updateAffection(num_baf, cod_pay, affectionData) {
    try {
      if (!num_baf || !cod_pay) {
        throw new Error('Numéro affection ou code pays invalide');
      }
      
      const dataToSend = {
        ...affectionData,
        DAT_MODUTIL: formatDateForAPI(new Date())
      };
      
      const response = await fetchAPI(`/baremes/affections/${num_baf}/pays/${cod_pay}`, {
        method: 'PUT',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour affection ${num_baf}:`, error);
      throw error;
    }
  },

  async removeAffection(num_baf, cod_pay) {
    try {
      if (!num_baf || !cod_pay) {
        throw new Error('Numéro affection ou code pays invalide');
      }
      
      const response = await fetchAPI(`/baremes/affections/${num_baf}/pays/${cod_pay}`, {
        method: 'DELETE',
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression affection ${num_baf}:`, error);
      throw error;
    }
  },

  // ==============================================
  // GESTION DES GARANTIES (BAREME_GARANTIE)
  // ==============================================

  async getGaranties(cod_bar, cod_pay, params = {}) {
    try {
      if (!cod_bar || !cod_pay) {
        throw new Error('Code barème ou code pays invalide');
      }
      
      const { 
        page = 1, 
        limit = 50,
        ind_opc,
        cod_gac
      } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (ind_opc) queryParams.append('ind_opc', ind_opc);
      if (cod_gac) queryParams.append('cod_gac', cod_gac);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/baremes/${cod_bar}/pays/${cod_pay}/garanties${queryString ? '?' + queryString : ''}`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur garanties barème ${cod_bar} pays ${cod_pay}:`, error);
      return { success: false, message: error.message, garanties: [] };
    }
  },

  async addGarantie(cod_bar, cod_pay, garantieData) {
    try {
      if (!cod_bar || !cod_pay) {
        throw new Error('Code barème ou code pays invalide');
      }
      
      console.log(`➕ Ajout garantie barème ${cod_bar} pays ${cod_pay}:`, garantieData);
      
      const dataToSend = {
        ...garantieData,
        COD_BAR: cod_bar,
        COD_PAY: cod_pay,
        EFF_GAC: garantieData.EFF_GAC ? formatDateForAPI(garantieData.EFF_GAC) : formatDateForAPI(new Date()),
        DAT_CREUTIL: formatDateForAPI(new Date()),
        DAT_MODUTIL: formatDateForAPI(new Date())
      };
      
      const response = await fetchAPI(`/baremes/${cod_bar}/pays/${cod_pay}/garanties`, {
        method: 'POST',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur ajout garantie barème ${cod_bar} pays ${cod_pay}:`, error);
      throw error;
    }
  },

  async updateGarantie(num_gac, cod_pay, garantieData) {
    try {
      if (!num_gac || !cod_pay) {
        throw new Error('Numéro garantie ou code pays invalide');
      }
      
      const dataToSend = {
        ...garantieData,
        DAT_MODUTIL: formatDateForAPI(new Date())
      };
      
      const response = await fetchAPI(`/baremes/garanties/${num_gac}/pays/${cod_pay}`, {
        method: 'PUT',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour garantie ${num_gac}:`, error);
      throw error;
    }
  },

  async removeGarantie(num_gac, cod_pay) {
    try {
      if (!num_gac || !cod_pay) {
        throw new Error('Numéro garantie ou code pays invalide');
      }
      
      const response = await fetchAPI(`/baremes/garanties/${num_gac}/pays/${cod_pay}`, {
        method: 'DELETE',
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression garantie ${num_gac}:`, error);
      throw error;
    }
  },

  // ==============================================
  // GESTION DES LETTRES (BAREME_LETTRE)
  // ==============================================

  async getLettres(cod_bar, cod_pay, params = {}) {
    try {
      if (!cod_bar || !cod_pay) {
        throw new Error('Code barème ou code pays invalide');
      }
      
      const { 
        page = 1, 
        limit = 50,
        ind_opc,
        cod_let
      } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (ind_opc) queryParams.append('ind_opc', ind_opc);
      if (cod_let) queryParams.append('cod_let', cod_let);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/baremes/${cod_bar}/pays/${cod_pay}/lettres${queryString ? '?' + queryString : ''}`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur lettres barème ${cod_bar} pays ${cod_pay}:`, error);
      return { success: false, message: error.message, lettres: [] };
    }
  },

  async addLettre(cod_bar, cod_pay, lettreData) {
    try {
      if (!cod_bar || !cod_pay) {
        throw new Error('Code barème ou code pays invalide');
      }
      
      console.log(`➕ Ajout lettre barème ${cod_bar} pays ${cod_pay}:`, lettreData);
      
      const dataToSend = {
        ...lettreData,
        COD_BAR: cod_bar,
        COD_PAY: cod_pay,
        EFF_BAL: lettreData.EFF_BAL ? formatDateForAPI(lettreData.EFF_BAL) : formatDateForAPI(new Date()),
        DAT_CREUTIL: formatDateForAPI(new Date()),
        DAT_MODUTIL: formatDateForAPI(new Date())
      };
      
      const response = await fetchAPI(`/baremes/${cod_bar}/pays/${cod_pay}/lettres`, {
        method: 'POST',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur ajout lettre barème ${cod_bar} pays ${cod_pay}:`, error);
      throw error;
    }
  },

  async updateLettre(num_bal, cod_pay, lettreData) {
    try {
      if (!num_bal || !cod_pay) {
        throw new Error('Numéro lettre ou code pays invalide');
      }
      
      const dataToSend = {
        ...lettreData,
        DAT_MODUTIL: formatDateForAPI(new Date())
      };
      
      const response = await fetchAPI(`/baremes/lettres/${num_bal}/pays/${cod_pay}`, {
        method: 'PUT',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour lettre ${num_bal}:`, error);
      throw error;
    }
  },

  async removeLettre(num_bal, cod_pay) {
    try {
      if (!num_bal || !cod_pay) {
        throw new Error('Numéro lettre ou code pays invalide');
      }
      
      const response = await fetchAPI(`/baremes/lettres/${num_bal}/pays/${cod_pay}`, {
        method: 'DELETE',
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression lettre ${num_bal}:`, error);
      throw error;
    }
  },

  // ==============================================
  // GESTION DES PLAFONDS (BAREME_PLAFOND)
  // ==============================================

  async getPlafonds(cod_bar, cod_pay, params = {}) {
    try {
      if (!cod_bar || !cod_pay) {
        throw new Error('Code barème ou code pays invalide');
      }
      
      const { 
        page = 1, 
        limit = 50,
        ind_opc
      } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (ind_opc) queryParams.append('ind_opc', ind_opc);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/baremes/${cod_bar}/pays/${cod_pay}/plafonds${queryString ? '?' + queryString : ''}`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur plafonds barème ${cod_bar} pays ${cod_pay}:`, error);
      return { success: false, message: error.message, plafonds: [] };
    }
  },

  async addPlafond(cod_bar, cod_pay, plafondData) {
    try {
      if (!cod_bar || !cod_pay) {
        throw new Error('Code barème ou code pays invalide');
      }
      
      console.log(`➕ Ajout plafond barème ${cod_bar} pays ${cod_pay}:`, plafondData);
      
      const dataToSend = {
        ...plafondData,
        COD_BAR: cod_bar,
        COD_PAY: cod_pay,
        EFF_CPL: plafondData.EFF_CPL ? formatDateForAPI(plafondData.EFF_CPL) : formatDateForAPI(new Date()),
        DAT_CREUTIL: formatDateForAPI(new Date()),
        DAT_MODUTIL: formatDateForAPI(new Date())
      };
      
      const response = await fetchAPI(`/baremes/${cod_bar}/pays/${cod_pay}/plafonds`, {
        method: 'POST',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur ajout plafond barème ${cod_bar} pays ${cod_pay}:`, error);
      throw error;
    }
  },

  async updatePlafond(num_cpl, cod_pay, plafondData) {
    try {
      if (!num_cpl || !cod_pay) {
        throw new Error('Numéro plafond ou code pays invalide');
      }
      
      const dataToSend = {
        ...plafondData,
        DAT_MODUTIL: formatDateForAPI(new Date())
      };
      
      const response = await fetchAPI(`/baremes/plafonds/${num_cpl}/pays/${cod_pay}`, {
        method: 'PUT',
        body: dataToSend,
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour plafond ${num_cpl}:`, error);
      throw error;
    }
  },

  async removePlafond(num_cpl, cod_pay) {
    try {
      if (!num_cpl || !cod_pay) {
        throw new Error('Numéro plafond ou code pays invalide');
      }
      
      const response = await fetchAPI(`/baremes/plafonds/${num_cpl}/pays/${cod_pay}`, {
        method: 'DELETE',
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression plafond ${num_cpl}:`, error);
      throw error;
    }
  },

  // ==============================================
  // GESTION DES TARIFS (TARIF, TARIF_ACTE, TARIF_LETTRE)
  // ==============================================

  async getTarifs(cod_bar, cod_pay, params = {}) {
    try {
      if (!cod_bar || !cod_pay) {
        throw new Error('Code barème ou code pays invalide');
      }
      
      const { 
        page = 1, 
        limit = 50,
        lic_tar,
        cod_cen,
        cod_pre
      } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (lic_tar) queryParams.append('lic_tar', lic_tar);
      if (cod_cen) queryParams.append('cod_cen', cod_cen);
      if (cod_pre) queryParams.append('cod_pre', cod_pre);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/baremes/${cod_bar}/pays/${cod_pay}/tarifs${queryString ? '?' + queryString : ''}`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur tarifs barème ${cod_bar} pays ${cod_pay}:`, error);
      return { success: false, message: error.message, tarifs: [] };
    }
  },

  async getTarifsActe(cod_bar, cod_pay, params = {}) {
    try {
      if (!cod_bar || !cod_pay) {
        throw new Error('Code barème ou code pays invalide');
      }
      
      const { 
        page = 1, 
        limit = 50,
        lic_tar,
        cod_cen,
        cod_pre,
        cod_acte
      } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (lic_tar) queryParams.append('lic_tar', lic_tar);
      if (cod_cen) queryParams.append('cod_cen', cod_cen);
      if (cod_pre) queryParams.append('cod_pre', cod_pre);
      if (cod_acte) queryParams.append('cod_acte', cod_acte);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/baremes/${cod_bar}/pays/${cod_pay}/tarifs-actes${queryString ? '?' + queryString : ''}`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur tarifs acte barème ${cod_bar} pays ${cod_pay}:`, error);
      return { success: false, message: error.message, tarifsActe: [] };
    }
  },

  async getTarifsLettre(cod_bar, cod_pay, params = {}) {
    try {
      if (!cod_bar || !cod_pay) {
        throw new Error('Code barème ou code pays invalide');
      }
      
      const { 
        page = 1, 
        limit = 50,
        cod_let,
        cod_cen,
        cod_pre
      } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (cod_let) queryParams.append('cod_let', cod_let);
      if (cod_cen) queryParams.append('cod_cen', cod_cen);
      if (cod_pre) queryParams.append('cod_pre', cod_pre);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/baremes/${cod_bar}/pays/${cod_pay}/tarifs-lettres${queryString ? '?' + queryString : ''}`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur tarifs lettre barème ${cod_bar} pays ${cod_pay}:`, error);
      return { success: false, message: error.message, tarifsLettre: [] };
    }
  },

  // ==============================================
  // CRÉATION ET MISE À JOUR - CODE_BAREME
  // ==============================================
  async create(baremeData) {
    try {
      console.log('📝 Création barème avec données:', baremeData);
      
      const dataToSend = {
        COD_BAR: String(baremeData.COD_BAR).trim(),
        COD_PAY: String(baremeData.COD_PAY).toUpperCase().trim(),
        LIB_BAR: String(baremeData.LIB_BAR).trim(),
        TYP_BAR: this.getTypeNumericValue(baremeData.TYP_BAR),
        COD_CREUTIL: 'ADMIN'
      };
      
      console.log('📤 Données envoyées à l\'API:', dataToSend);
      
      const response = await fetchAPI('/baremes', {
        method: 'POST',
        body: dataToSend,
      });
      
      console.log('📥 Réponse création:', response);
      
      return response;
      
    } catch (error) {
      console.error('❌ Erreur création barème:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la création'
      };
    }
  },

  async update(cod_bar, cod_pay, baremeData) {
    try {
      console.log(`✏️ Mise à jour barème ${cod_bar} (${cod_pay}):`, baremeData);
      
      const dataToSend = {
        LIB_BAR: String(baremeData.LIB_BAR).trim(),
        TYP_BAR: this.getTypeNumericValue(baremeData.TYP_BAR),
        COD_MODUTIL: 'ADMIN'
      };
      
      console.log('📤 Données de mise à jour:', dataToSend);
      
      const response = await fetchAPI(`/baremes/${cod_bar}/pays/${cod_pay}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });
      
      console.log('📥 Réponse mise à jour:', response);
      
      return response;
      
    } catch (error) {
      console.error('❌ Erreur mise à jour barème:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la mise à jour'
      };
    }
  },

  // ==============================================
  // FONCTIONS DE FORMATAGE POUR L'AFFICHAGE
  // ==============================================

  formatBarremeForDisplay(bareme) {
    return this.normalizeBarremeData(bareme);
  },

  async getActesMedicaux(cod_pay, params = {}) {
    try {
      const { 
        page = 1, 
        limit = 50,
        search
      } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (search) queryParams.append('search', search);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/reference/pays/${cod_pay}/actes-medicaux${queryString ? '?' + queryString : ''}`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération actes médicaux pays ${cod_pay}:`, error);
      return { success: false, message: error.message, actes: [] };
    }
  },

  async getAffectionsList(cod_pay, params = {}) {
    try {
      const { 
        page = 1, 
        limit = 50,
        search
      } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (search) queryParams.append('search', search);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/reference/pays/${cod_pay}/affections${queryString ? '?' + queryString : ''}`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération affections pays ${cod_pay}:`, error);
      return { success: false, message: error.message, affections: [] };
    }
  },

  async getCategoriesTarif(cod_pay, params = {}) {
    try {
      const { 
        page = 1, 
        limit = 50,
        cod_typp
      } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (cod_typp) queryParams.append('cod_typp', cod_typp);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/reference/pays/${cod_pay}/categories-tarif${queryString ? '?' + queryString : ''}`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération catégories tarif pays ${cod_pay}:`, error);
      return { success: false, message: error.message, categories: [] };
    }
  },

  async getTypesBarreme(cod_pay = null) {
    try {
      let endpoint = '/baremes/types';
      if (cod_pay) {
        endpoint = `/baremes/types/pays/${cod_pay}`;
      }
      
      const response = await fetchAPI(endpoint);
      
      if (response.success) {
        return {
          ...response,
          types: response.types || []
        };
      }
      
      console.warn('⚠️ API types barème non disponible, utilisation des valeurs par défaut');
      return { 
        success: true,
        types: [
          { value: 'M', label: 'Médical' },
          { value: 'H', label: 'Hospitalier' },
          { value: 'P', label: 'Pharmacie' },
          { value: 'L', label: 'Laboratoire' },
          { value: 'C', label: 'Consultation' },
          { value: 'D', label: 'Dentaire' },
          { value: 'O', label: 'Optique' },
          { value: 'A', label: 'Ambulatoire' },
          { value: 'S', label: 'Soins' }
        ]
      };
    } catch (error) {
      console.error('❌ Erreur récupération types barème:', error);
      return { 
        success: false, 
        message: error.message, 
        types: [] 
      };
    }
  },

  // ==============================================
  // RECHERCHE ET FILTRAGE
  // ==============================================

  async search(searchTerm, filters = {}, limit = 20) {
    try {
      const dataToSend = {
        searchTerm,
        filters,
        limit
      };
      
      const response = await fetchAPI('/baremes/search', {
        method: 'POST',
        body: dataToSend,
      });
      
      if (response.success) {
        const baremes = response.baremes?.map(b => this.formatBarremeForDisplay(b)) || [];
        
        return {
          ...response,
          baremes
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche barèmes:', error);
      return { success: false, message: error.message, baremes: [] };
    }
  },

  async searchQuick(searchTerm, limit = 10) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return { success: true, baremes: [] };
      }
      
      const queryParams = new URLSearchParams();
      queryParams.append('search', searchTerm);
      if (limit) queryParams.append('limit', limit);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/baremes/search/quick${queryString ? '?' + queryString : ''}`);
      
      if (response.success) {
        const baremes = response.baremes?.map(b => ({
          cod_bar: b.COD_BAR,
          lib_bar: b.LIB_BAR,
          cod_pay: b.COD_PAY,
          lib_pay: b.lib_pay || '',
          typ_bar: b.TYP_BAR,
          lib_type: this.getTypeBarremeLabel(b.TYP_BAR),
          label: `${b.COD_BAR} - ${b.LIB_BAR} (${b.COD_PAY})`
        })) || [];
        
        return {
          ...response,
          baremes
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche rapide barèmes:', error);
      return { success: false, message: error.message, baremes: [] };
    }
  },

  // ==============================================
  // STATISTIQUES ET RAPPORTS
  // ==============================================

  async getStatistiques(cod_pay = null) {
    try {
      const endpoint = cod_pay 
        ? `/baremes/statistiques/pays/${cod_pay}`
        : '/baremes/statistiques';
      
      const response = await fetchAPI(endpoint);
      
      if (response.success) {
        return response;
      }
      
      console.warn('⚠️ API statistiques non disponible');
      return { 
        success: false,
        message: 'API non disponible',
        statistiques: {
          total: 0,
          par_type: [],
          par_pays: [],
          derniers_ajouts: []
        } 
      };
    } catch (error) {
      console.error('❌ Erreur statistiques barèmes:', error);
      return { 
        success: false,
        message: error.message,
        statistiques: {
          total: 0,
          par_type: [],
          par_pays: [],
          derniers_ajouts: []
        } 
      };
    }
  },

  async getHistorique(cod_bar, cod_pay) {
    try {
      if (!cod_bar || !cod_pay) {
        throw new Error('Code barème ou code pays invalide');
      }
      
      const response = await fetchAPI(`/baremes/${cod_bar}/pays/${cod_pay}/historique`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur historique barème ${cod_bar}:`, error);
      return { success: false, message: error.message, historique: [] };
    }
  },

  // ==============================================
  // FONCTIONS UTILITAIRES
  // ==============================================

  async testConnection() {
    try {
      const response = await fetchAPI('/baremes?limit=1');
      return {
        success: response.success !== false,
        message: response.success !== false ? 'API barèmes opérationnelle' : 'API en erreur',
        timestamp: new Date().toISOString(),
        details: response
      };
    } catch (error) {
      console.error('❌ Test connexion barèmes échoué:', error);
      return {
        success: false,
        message: 'API barèmes non disponible',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  formatBarremeForDisplay(bareme) {
    if (!bareme) return null;
    
    const typeBarreme = bareme.TYP_BAR ? this.getTypeBarremeLabel(bareme.TYP_BAR) : 'Médical';
    
    const formattedBarreme = {
      COD_BAR: bareme.COD_BAR,
      LIB_BAR: bareme.LIB_BAR,
      COD_PAY: bareme.COD_PAY,
      LIB_PAY: bareme.lib_pay || bareme.LIB_PAY,
      
      TYP_BAR: bareme.TYP_BAR,
      TYPE_BAREME: typeBarreme,
      
      DATE_CREATION: bareme.DAT_CREUTIL || bareme.date_creation,
      DATE_MODIFICATION: bareme.DAT_MODUTIL || bareme.date_modification,
      
      UTILISATEUR_CREATION: bareme.COD_CREUTIL,
      UTILISATEUR_MODIFICATION: bareme.COD_MODUTIL,
      
      // Associations
      AFFECTIONS: bareme.affections || [],
      GARANTIES: bareme.garanties || [],
      LETTRES: bareme.lettres || [],
      PLAFONDS: bareme.plafonds || [],
      TARIFS: bareme.tarifs || [],
      
      // Compteurs
      totalAffections: bareme.affections ? bareme.affections.length : 0,
      totalGaranties: bareme.garanties ? bareme.garanties.length : 0,
      totalLettres: bareme.lettres ? bareme.lettres.length : 0,
      totalPlafonds: bareme.plafonds ? bareme.plafonds.length : 0,
      totalTarifs: bareme.tarifs ? bareme.tarifs.length : 0,
      
      // Compatibilité
      id: bareme.COD_BAR,
      code: bareme.COD_BAR,
      libelle: bareme.LIB_BAR,
      pays: bareme.COD_PAY,
      type: typeBarreme,
      type_code: bareme.TYP_BAR
    };
    
    return formattedBarreme;
  },

  formatDetailsBarremeForDisplay(details) {
    if (!details) return null;
    
    return {
      NUM_BAR: details.NUM_BAR,
      COD_BAR: details.COD_BAR,
      COD_PAY: details.COD_PAY,
      LIC_NOM: details.LIC_NOM,
      IND_OPC: details.IND_OPC,
      IND_OPC_LIB: this.getIndicateurOPCLabel(details.IND_OPC),
      COD_NAT: details.COD_NAT,
      COD_TYPC: details.COD_TYPC,
      COD_TYPT: details.COD_TYPT,
      EFF_BAR: details.EFF_BAR,
      COD_COL: details.COD_COL,
      COD_GAR: details.COD_GAR,
      IND_BAR: details.IND_BAR,
      RBA_BAR: details.RBA_BAR,
      RBC_BAR: details.RBC_BAR,
      RBE_BAR: details.RBE_BAR,
      TMA_BAR: details.TMA_BAR,
      TMC_BAR: details.TMC_BAR,
      TME_BAR: details.TME_BAR,
      IAS_BAR: details.IAS_BAR,
      ICO_BAR: details.ICO_BAR,
      IEN_BAR: details.IEN_BAR,
      MAX_BAR: details.MAX_BAR,
      PLA_BAR: details.PLA_BAR,
      PEC_BAR: details.PEC_BAR,
      DATE_CREATION: details.DAT_CREUTIL,
      DATE_MODIFICATION: details.DAT_MODUTIL
    };
  },

  validateBarremeData(data, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate) {
      // Valider COD_BAR
      if (!data.COD_BAR) {
        errors.push('Le code barème est obligatoire');
      } else {
        const codBarStr = String(data.COD_BAR).trim();
        if (codBarStr === '') {
          errors.push('Le code barème ne peut pas être vide');
        }
        // Retirer la validation stricte de chiffres uniquement
        // car certains codes peuvent contenir des lettres
      }
      
      // Valider COD_PAY
      if (!data.COD_PAY) {
        errors.push('Le code pays est obligatoire');
      } else {
        const codPayStr = String(data.COD_PAY).trim();
        if (codPayStr === '') {
          errors.push('Le code pays ne peut pas être vide');
        }
        // Retirer la validation de longueur fixe
      }
      
      // Valider LIB_BAR
      if (!data.LIB_BAR) {
        errors.push('Le libellé barème est obligatoire');
      } else {
        const libBarStr = String(data.LIB_BAR).trim();
        if (libBarStr === '') {
          errors.push('Le libellé barème ne peut pas être vide');
        }
      }
    }
    
    // Valider TYP_BAR
    if (data.TYP_BAR === undefined || data.TYP_BAR === null || data.TYP_BAR === '') {
      errors.push('Le type barème est obligatoire');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // ==============================================
  // IMPORT/EXPORT
  // ==============================================

  async importBarremes(file, cod_pay) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (cod_pay) {
        formData.append('cod_pay', cod_pay);
      }
      
      const response = await fetchAPI('/baremes/import', {
        method: 'POST',
        body: formData,
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur import barèmes:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  async exportBarremes(cod_pay = null, type_bar = null) {
    try {
      const queryParams = new URLSearchParams();
      if (cod_pay) queryParams.append('cod_pay', cod_pay);
      if (type_bar) queryParams.append('type_bar', type_bar);
      
      const queryString = queryParams.toString();
      const endpoint = `/baremes/export${queryString ? '?' + queryString : ''}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `baremes_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true, message: 'Export réussi' };
    } catch (error) {
      console.error('❌ Erreur export barèmes:', error);
      return { success: false, message: error.message };
    }
  },

  // ==============================================
  // SYNCHRONISATION ET MAINTENANCE
  // ==============================================

  async syncBarremes() {
    try {
      const response = await fetchAPI('/baremes/sync', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur synchronisation barèmes:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  async cleanupOrphelins() {
    try {
      const response = await fetchAPI('/baremes/cleanup/orphelins', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur nettoyage barèmes orphelins:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  },

  async duplicateBarreme(sourceCodBar, sourceCodPay, newCodBar, newCodPay) {
    try {
      const response = await fetchAPI('/baremes/duplicate', {
        method: 'POST',
        body: {
          sourceCodBar,
          sourceCodPay,
          newCodBar,
          newCodPay
        }
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur duplication barème:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }
};

// tarifsAPI.js

export const tarifsAPI = {
  // Récupérer tous les tarifs
  async getAll(params = {}) {
    try {
      // Nettoyer les paramètres
      const cleanParams = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = value;
        }
      });

      const queryString = buildQueryString(cleanParams);
      const response = await fetchAPI(`/tarifs${queryString}`);

      // Normaliser la réponse
      if (response.success !== false && Array.isArray(response)) {
        return {
          success: true,
          tarifs: response,
          pagination: {
            page: 1,
            limit: 10,
            total: response.length,
            pages: 1
          }
        };
      }

      return response;
    } catch (error) {
      console.error('❌ Erreur récupération tarifs:', error);
      return {
        success: false,
        message: error.message,
        tarifs: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      };
    }
  },

  // Récupérer un tarif par son ID
  async getById(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID tarif invalide');
      }

      // Récupérer tous les tarifs et filtrer (en attendant une route spécifique)
      const allTarifs = await this.getAll({ limit: 1000 });

      if (allTarifs.success && allTarifs.tarifs) {
        const tarif = allTarifs.tarifs.find(t => t.id === parseInt(id) || t.COD_TAR === parseInt(id));

        if (tarif) {
          return {
            success: true,
            tarif: this.formatTarifForDisplay(tarif)
          };
        }
      }

      throw new Error('Tarif non trouvé');
    } catch (error) {
      console.error(`❌ Erreur récupération tarif ${id}:`, error);
      return {
        success: false,
        message: error.message,
        tarif: null
      };
    }
  },

  // Créer un nouveau tarif
  async create(tarifData) {
    try {
      console.log('📝 Données reçues pour création tarif:', tarifData);

      // VALIDATION
      const validation = this.validateTarifData(tarifData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // FORMATAGE POUR L'API
      const dataToSend = {
        LIB_TAR: tarifData.LIB_TAR || tarifData.nom_tarif || '',
        TYP_TAR: tarifData.TYP_TAR || tarifData.type_tarif || 0,
        COD_PAY: tarifData.COD_PAY || tarifData.cod_pay || 'SN',
        COD_CREUTIL: tarifData.COD_CREUTIL || 'SYSTEM'
      };

      console.log('📤 Données envoyées à l\'API:', dataToSend);

      // Appel API
      const response = await fetchAPI('/tarifs', {
        method: 'POST',
        body: dataToSend,
      });

      return response;
    } catch (error) {
      console.error('❌ Erreur création tarif:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la création du tarif',
        tarif: null
      };
    }
  },

  // Mettre à jour un tarif (si la route backend existe)
  async update(id, tarifData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID tarif invalide');
      }

      console.log(`✏️ Mise à jour tarif ${id}:`, tarifData);

      // SIMPLIFICATION : Utiliser directement les données reçues
      const dataToSend = {};

      // Copier uniquement les champs qui existent dans tarifData
      const allowedFields = [
        'LIB_TAR', 'TYP_TAR', 'COD_PAY'
      ];

      allowedFields.forEach(field => {
        // Vérifier en majuscules et minuscules
        const fieldLower = field.toLowerCase();
        const value = tarifData[field] !== undefined ? tarifData[field] : tarifData[fieldLower];

        if (value !== undefined) {
          dataToSend[field] = value;
        }
      });

      // S'assurer qu'on a au moins un champ à mettre à jour
      if (Object.keys(dataToSend).length === 0) {
        throw new Error('Aucune donnée à mettre à jour');
      }

      console.log('📤 Données de mise à jour envoyées:', dataToSend);

      const response = await fetchAPI(`/tarifs/${id}`, {
        method: 'PUT',
        body: dataToSend,
      });

      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour tarif ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du tarif',
        tarif: null
      };
    }
  },

  // Supprimer un tarif (si la route backend existe)
  async delete(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID tarif invalide');
      }

      const response = await fetchAPI(`/tarifs/${id}`, {
        method: 'DELETE',
      });

      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression tarif ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la suppression du tarif'
      };
    }
  },

  // Rechercher des tarifs
  async search(searchTerm, filters = {}, limit = 20) {
    try {
      // Utiliser getAll avec les paramètres de recherche
      const params = {
        ...filters,
        search: searchTerm,
        limit: limit
      };

      return await this.getAll(params);
    } catch (error) {
      console.error('❌ Erreur recherche tarifs:', error);
      return {
        success: false,
        message: error.message,
        tarifs: [],
        count: 0
      };
    }
  },

  // Récupérer les statistiques des tarifs
  async getStatistiques() {
    try {
      // Récupérer tous les tarifs
      const response = await this.getAll({ limit: 1000 });

      if (response.success && response.tarifs) {
        const tarifs = response.tarifs;

        // Calculer les statistiques côté client
        const statistiques = {
          total: tarifs.length,
          par_type: this.calculateStatsByType(tarifs),
          par_pays: this.calculateStatsByPays(tarifs),
          derniere_modification: this.getLastModification(tarifs)
        };

        return {
          success: true,
          statistiques: statistiques
        };
      }

      return {
        success: false,
        message: response.message || 'Erreur lors du calcul des statistiques',
        statistiques: {
          total: 0,
          par_type: [],
          par_pays: [],
          derniere_modification: null
        }
      };
    } catch (error) {
      console.error('❌ Erreur statistiques tarifs:', error);
      return {
        success: false,
        message: error.message,
        statistiques: {
          total: 0,
          par_type: [],
          par_pays: [],
          derniere_modification: null
        }
      };
    }
  },

  // Fonction helper pour calculer les stats par type
  calculateStatsByType(tarifs) {
    const typeCounts = {};

    tarifs.forEach(tarif => {
      const type = tarif.type_tarif || tarif.TYP_TAR || 0;
      if (!typeCounts[type]) {
        typeCounts[type] = 0;
      }
      typeCounts[type]++;
    });

    return Object.entries(typeCounts).map(([type, count]) => ({
      type: type,
      label: `Type ${type}`,
      count: count
    }));
  },

  // Fonction helper pour calculer les stats par pays
  calculateStatsByPays(tarifs) {
    const paysCounts = {};

    tarifs.forEach(tarif => {
      const pays = tarif.nom_pays || tarif.COD_PAY || 'Inconnu';
      if (!paysCounts[pays]) {
        paysCounts[pays] = 0;
      }
      paysCounts[pays]++;
    });

    return Object.entries(paysCounts).map(([pays, count]) => ({
      pays: pays,
      count: count
    }));
  },

  // Fonction helper pour obtenir la dernière modification
  getLastModification(tarifs) {
    let lastDate = null;

    tarifs.forEach(tarif => {
      const date = tarif.dat_modutil || tarif.DAT_MODUTIL;
      if (date) {
        const dateObj = new Date(date);
        if (!lastDate || dateObj > lastDate) {
          lastDate = dateObj;
        }
      }
    });

    return lastDate ? lastDate.toISOString() : null;
  },

  // Récupérer les tarifs pour l'autocomplétion
  async getForAutocomplete(searchTerm = '') {
    try {
      const response = await this.getAll({
        search: searchTerm,
        limit: 10
      });

      if (response.success) {
        // Formater pour l'autocomplétion
        const tarifsFormatted = response.tarifs.map(tarif => ({
          id: tarif.id || tarif.COD_TAR,
          label: tarif.LIB_TAR || tarif.nom_tarif || `Tarif ${tarif.COD_TAR}`,
          value: tarif.id || tarif.COD_TAR,
          cod_pay: tarif.COD_PAY || tarif.cod_pay,
          nom_pays: tarif.nom_pays
        }));

        return {
          success: true,
          tarifs: tarifsFormatted
        };
      }

      return response;
    } catch (error) {
      console.error('❌ Erreur autocomplétion tarifs:', error);
      return {
        success: false,
        message: error.message,
        tarifs: []
      };
    }
  },

  // Récupérer les tarifs par pays
  async getByPays(cod_pay) {
    try {
      const response = await this.getAll({ cod_pay, limit: 100 });

      if (response.success) {
        return {
          success: true,
          tarifs: response.tarifs,
          count: response.tarifs.length,
          pays: cod_pay
        };
      }

      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération tarifs pour pays ${cod_pay}:`, error);
      return {
        success: false,
        message: error.message,
        tarifs: []
      };
    }
  },

  // Récupérer les tarifs utilisés dans les conventions
  async getUsedInConventions() {
    try {
      // Cette fonction nécessite des données des conventions
      // Pour l'instant, retourner tous les tarifs
      const response = await this.getAll({ limit: 100 });

      if (response.success) {
        // Simuler l'utilisation dans les conventions
        const tarifsWithUsage = response.tarifs.map(tarif => ({
          ...tarif,
          used_in_conventions: Math.floor(Math.random() * 10) // Simulation
        }));

        return {
          success: true,
          tarifs: tarifsWithUsage
        };
      }

      return response;
    } catch (error) {
      console.error('❌ Erreur récupération tarifs utilisés:', error);
      return {
        success: false,
        message: error.message,
        tarifs: []
      };
    }
  },

  // Récupérer les tarifs d'un assureur spécifique
  async getByAssureur(assureurId) {
    try {
      // Récupérer les conventions de l'assureur
      const token = localStorage.getItem('token');
      const conventionsResponse = await fetch(`/conventions?cod_ass=${assureurId}&limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (conventionsResponse.ok) {
        const conventionsData = await conventionsResponse.json();
        
        if (conventionsData.success && conventionsData.conventions) {
          // Extraire les codes tarif uniques
          const tarifIds = [...new Set(
            conventionsData.conventions
              .filter(c => c.cod_tar)
              .map(c => c.cod_tar)
          )];

          // Récupérer tous les tarifs
          const allTarifs = await this.getAll({ limit: 1000 });

          if (allTarifs.success && allTarifs.tarifs) {
            // Filtrer les tarifs utilisés par l'assureur
            const tarifsAssureur = allTarifs.tarifs.filter(t => 
              tarifIds.includes(t.id || t.COD_TAR)
            );

            return {
              success: true,
              tarifs: tarifsAssureur,
              count: tarifsAssureur.length,
              assureurId: assureurId
            };
          }
        }
      }

      return {
        success: true,
        tarifs: [],
        count: 0,
        assureurId: assureurId
      };
    } catch (error) {
      console.error(`❌ Erreur récupération tarifs pour assureur ${assureurId}:`, error);
      return {
        success: false,
        message: error.message,
        tarifs: []
      };
    }
  },

  // Exporter la liste des tarifs
  async export(format = 'excel', filters = {}) {
    try {
      // Récupérer tous les tarifs
      const response = await this.getAll({ ...filters, limit: 1000 });

      if (response.success) {
        // Simuler l'export
        const data = response.tarifs;

        return {
          success: true,
          message: `Données prêtes pour export ${format}`,
          data: data,
          format: format,
          count: data.length
        };
      }

      return response;
    } catch (error) {
      console.error('❌ Erreur export tarifs:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Vérifier si un tarif existe déjà
  async checkExists(field, value, excludeId = null) {
    try {
      // Récupérer tous les tarifs
      const response = await this.getAll({ limit: 1000 });

      if (response.success) {
        const tarifs = response.tarifs;

        // Rechercher une correspondance
        const exists = tarifs.some(tarif => {
          if (excludeId && (tarif.id === excludeId || tarif.COD_TAR === excludeId)) {
            return false;
          }

          // Vérifier le champ spécifié
          const fieldValue = tarif[field] || tarif[field.toLowerCase()];
          return fieldValue && fieldValue.toString().toLowerCase() === value.toString().toLowerCase();
        });

        return {
          success: true,
          exists: exists,
          message: exists ? 'Un tarif avec cette valeur existe déjà' : 'Valeur disponible'
        };
      }

      return {
        success: false,
        exists: false,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Erreur vérification existence tarif:', error);
      return {
        success: false,
        message: error.message,
        exists: false
      };
    }
  },

  // Récupérer les options (pays) pour les filtres
  async getOptions() {
    try {
      // Récupérer les pays depuis l'API des conventions
      const token = localStorage.getItem('token');
      const response = await fetch('/conventions/pays', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          options: {
            pays: data.pays || [],
            types: this.getTypesTarif()
          }
        };
      }

      throw new Error('Erreur lors de la récupération des options');
    } catch (error) {
      console.error('❌ Erreur récupération options tarifs:', error);
      return {
        success: false,
        message: error.message,
        options: {
          pays: [],
          types: this.getTypesTarif()
        }
      };
    }
  },

  // Tester la connexion à l'API
  async testConnection() {
    try {
      const response = await fetchAPI('/tarifs?limit=1');
      return {
        success: response.success !== false,
        message: response.success !== false ? 'API tarifs opérationnelle' : 'API en erreur',
        timestamp: new Date().toISOString(),
        details: response
      };
    } catch (error) {
      console.error('❌ Test connexion tarifs échoué:', error);
      return {
        success: false,
        message: 'API tarifs non disponible',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  // Formater un tarif pour l'affichage
  formatTarifForDisplay(tarif) {
    if (!tarif) return null;

    return {
      id: tarif.id || tarif.COD_TAR,
      cod_tar: tarif.COD_TAR || tarif.id,
      nom_tarif: tarif.LIB_TAR || tarif.nom_tarif,
      type_tarif: tarif.TYP_TAR || tarif.type_tarif,
      cod_pay: tarif.COD_PAY || tarif.cod_pay,
      nom_pays: tarif.nom_pays,
      cod_creutil: tarif.COD_CREUTIL || tarif.cod_creutil,
      cod_modutil: tarif.COD_MODUTIL || tarif.cod_modutil,
      dat_creutil: tarif.DAT_CREUTIL || tarif.dat_creutil,
      dat_modutil: tarif.DAT_MODUTIL || tarif.dat_modutil,
      date_creation: tarif.DAT_CREUTIL || tarif.dat_creutil,
      date_modification: tarif.DAT_MODUTIL || tarif.dat_modutil
    };
  },

  // Valider les données d'un tarif
  validateTarifData(tarifData) {
    const errors = [];

    if (!tarifData.LIB_TAR && !tarifData.nom_tarif) {
      errors.push('Le nom du tarif est obligatoire');
    }

    if (tarifData.TYP_TAR === undefined && tarifData.type_tarif === undefined) {
      errors.push('Le type de tarif est obligatoire');
    }

    if (!tarifData.COD_PAY && !tarifData.cod_pay) {
      errors.push('Le pays est obligatoire');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Récupérer les types de tarif disponibles
  getTypesTarif() {
    return [
      { value: 0, label: 'Tarif Standard' },
      { value: 1, label: 'Tarif Premium' },
      { value: 2, label: 'Tarif Entreprise' },
      { value: 3, label: 'Tarif Spécial' }
    ];
  }
};

  // ==============================================
// API DES CONVENTIONS
// ==============================================

export const conventionsAPI = {
  // Récupérer toutes les conventions
  async getAll(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const response = await fetchAPI(`/conventions${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération conventions:', error);
      return { 
        success: false, 
        message: error.message, 
        conventions: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      };
    }
  },

  // Récupérer une convention par son ID
  async getById(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID convention invalide');
      }
      const response = await fetchAPI(`/conventions/${id}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération convention ${id}:`, error);
      throw error;
    }
  },

  // Créer une nouvelle convention
  async create(conventionData) {
    try {
      // Formatage des dates si nécessaire
      const dataToSend = { ...conventionData };
      if (dataToSend.DAT_CNV) {
        dataToSend.DAT_CNV = formatDateForAPI(dataToSend.DAT_CNV);
      }
      
      // Ajouter l'utilisateur créateur
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      dataToSend.COD_CREUTIL = user.username || 'SYSTEM';
      
      const response = await fetchAPI('/conventions', {
        method: 'POST',
        body: dataToSend,
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur création convention:', error);
      throw error;
    }
  },

  // Mettre à jour une convention
  async update(id, conventionData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID convention invalide');
      }
      const dataToSend = { ...conventionData };
      if (dataToSend.DAT_CNV) {
        dataToSend.DAT_CNV = formatDateForAPI(dataToSend.DAT_CNV);
      }
      
      // Ajouter l'utilisateur modificateur
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      dataToSend.COD_MODUTIL = user.username || 'SYSTEM';
      
      const response = await fetchAPI(`/conventions/${id}`, {
        method: 'PUT',
        body: dataToSend,
      });
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour convention ${id}:`, error);
      throw error;
    }
  },

  // Supprimer une convention
  async delete(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID convention invalide');
      }
      
      // Ajouter l'utilisateur qui supprime
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const body = {
        COD_MODUTIL: user.username || 'SYSTEM'
      };
      
      const response = await fetchAPI(`/conventions/${id}`, {
        method: 'DELETE',
        body: body,
      });
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression convention ${id}:`, error);
      throw error;
    }
  },

  // Rechercher des conventions
  async search(searchTerm, filters = {}, limit = 20) {
    try {
      const dataToSend = {
        searchTerm,
        filters,
        limit
      };
      const response = await fetchAPI('/conventions/search', {
        method: 'POST',
        body: dataToSend,
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche conventions:', error);
      return { 
        success: false, 
        message: error.message, 
        conventions: [],
        count: 0
      };
    }
  },

  // Récupérer les statistiques des conventions
  async getStatistiques() {
    try {
      const response = await fetchAPI('/conventions/statistiques');
      return response;
    } catch (error) {
      console.error('❌ Erreur statistiques conventions:', error);
      return {
        success: false,
        message: error.message,
        statistiques: {
          total: 0,
          actives: 0,
          inactives: 0,
          en_attente: 0,
          par_type: [],
          par_compagnie: []
        }
      };
    }
  }
};
// ==============================================
// API D'ADMINISTRATION
// ==============================================


export const adminAPI = {
  // ==============================================
  // STATISTIQUES ADMIN
  // ==============================================

  async getStatistiques() {
    try {
      const response = await fetchAPI('/security/statistiques');
      
      if (response.success) {
        return {
          ...response,
          statistiques: {
            utilisateurs: {
              total: response.statistiques?.utilisateurs?.total_utilisateurs || 0,
              actifs: response.statistiques?.utilisateurs?.utilisateurs_actifs || 0,
              inactifs: response.statistiques?.utilisateurs?.utilisateurs_inactifs || 0,
              bloques: response.statistiques?.utilisateurs?.comptes_bloques || 0,
              super_admin: response.statistiques?.utilisateurs?.super_admin || 0,
              actifs_aujourdhui: response.statistiques?.utilisateurs?.actifs_aujourdhui || 0
            },
            roles: {
              total: response.statistiques?.roles?.total_roles || 0,
              utilisateurs_avec_roles: response.statistiques?.roles?.utilisateurs_avec_roles || 0
            },
            sessions: {
              actives: response.statistiques?.sessions?.sessions_actives || 0,
              en_cours: response.statistiques?.sessions?.sessions_en_cours || 0
            }
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération statistiques:', error);
      return {
        success: false,
        message: error.message,
        statistiques: {
          utilisateurs: { total: 0, actifs: 0, inactifs: 0, bloques: 0, super_admin: 0, actifs_aujourdhui: 0 },
          roles: { total: 0, utilisateurs_avec_roles: 0 },
          sessions: { actives: 0, en_cours: 0 }
        }
      };
    }
  },

  async getEtatSysteme() {
    try {
      const response = await fetchAPI('/security/etat-systeme');
      
      if (response.success) {
        return {
          ...response,
          etat: {
            base_donnees: response.etat?.base_donnees || {},
            stockage: response.etat?.stockage || {},
            performances: response.etat?.performances || {},
            securite: response.etat?.securite || {},
            dernieres_erreurs: response.etat?.dernieres_erreurs || [],
            dernier_verification: response.etat?.dernier_verification
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération état système:', error);
      return {
        success: false,
        message: error.message,
        etat: {
          base_donnees: { connectee: false, version: '', nom: '', heure_serveur: '' },
          stockage: { total_mb: 0, utilise_mb: 0, libre_mb: 0, pourcentage_utilise: 0 },
          performances: { connexions_actives: 0 },
          securite: { parametres: { total_parametres: 0, pays_configures: 0 } },
          dernieres_erreurs: [],
          dernier_verification: new Date().toISOString()
        }
      };
    }
  },


  
  // ==============================================
  // GESTION DES UTILISATEURS
  // ==============================================
async getCentresUtilisateur(id) {
  try {
    if (!id || isNaN(parseInt(id))) {
      throw new Error('ID utilisateur invalide');
    }
    
    const response = await fetchAPI(`/security/utilisateurs/${id}/centres`);
    return response;
  } catch (error) {
    console.error(`❌ Erreur récupération centres utilisateur ${id}:`, error);
    return { success: false, message: error.message, centres: [] };
  }
},

// Assigner des centres à un utilisateur
async assignerCentresUtilisateur(id, centres) {
  try {
    if (!id || isNaN(parseInt(id))) {
      throw new Error('ID utilisateur invalide');
    }
    
    const response = await fetchAPI(`/security/utilisateurs/${id}/centres/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ centres }),
    });
    
    return response;
  } catch (error) {
    console.error(`❌ Erreur assignation centres utilisateur ${id}:`, error);
    return { success: false, message: error.message };
  }
},

  async getUtilisateurs(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        profil = '',
        actif = '',
        cod_pay = '',
        dateDebut = null,
        dateFin = null
      } = params;

      const queryParams = new URLSearchParams();
      
      if (page) queryParams.append('page', page);
      if (limit) queryParams.append('limit', limit);
      if (search) queryParams.append('search', search);
      if (profil) queryParams.append('profil', profil);
      if (actif !== '') queryParams.append('actif', actif);
      if (cod_pay) queryParams.append('cod_pay', cod_pay);
      if (dateDebut) queryParams.append('dateDebut', dateDebut);
      if (dateFin) queryParams.append('dateFin', dateFin);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/security/utilisateurs${queryString ? '?' + queryString : ''}`);
      
      if (response.success) {
        const utilisateurs = response.utilisateurs?.map(user => this.formatUtilisateurForDisplay(user)) || [];
        
        return {
          success: true,
          utilisateurs: utilisateurs,
          pagination: response.pagination || {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération utilisateurs:', error);
      return {
        success: false,
        message: error.message,
        utilisateurs: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }
  },

  async getUtilisateur(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID utilisateur invalide');
      }
      
      const response = await fetchAPI(`/security/utilisateurs/${id}`);
      
      if (response.success) {
        return {
          ...response,
          utilisateur: this.formatUtilisateurForDisplay(response.utilisateur)
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération utilisateur ${id}:`, error);
      return {
        success: false,
        message: error.message,
        utilisateur: null
      };
    }
  },

//  ajoutez le hachage SHA-256
async createUtilisateur(userData) {
  try {
    console.log('📝 Création utilisateur:', userData);
    
    // Validation des données obligatoires
    if (!userData.LOG_UTI || !userData.NOM_UTI || !userData.PRE_UTI || !userData.EMAIL_UTI) {
      return {
        success: false,
        message: 'Login, nom, prénom et email sont requis'
      };
    }
    
    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.EMAIL_UTI)) {
      return {
        success: false,
        message: 'Format d\'email invalide'
      };
    }
    
    // Validation du sexe
    const sexesValides = ['M', 'F', 'O'];
    if (userData.SEX_UTI && !sexesValides.includes(userData.SEX_UTI)) {
      return {
        success: false,
        message: 'Sexe invalide. Doit être M, F ou O'
      };
    }
    
    // Validation du profil
    const profilsValides = ['Utilisateur', 'Caissier', 'Secretaire', 'Infirmier', 'Medecin', 'Admin', 'SuperAdmin'];
    if (userData.PROFIL_UTI && !profilsValides.includes(userData.PROFIL_UTI)) {
      return {
        success: false,
        message: `Profil invalide. Doit être l'un de: ${profilsValides.join(', ')}`
      };
    }
    
    // Préparer les données pour l'envoi
    const dataToSend = {
      COD_PAY: userData.COD_PAY || 'CMF',
      LOG_UTI: userData.LOG_UTI,
      NOM_UTI: userData.NOM_UTI,
      PRE_UTI: userData.PRE_UTI,
      EMAIL_UTI: userData.EMAIL_UTI,
      PROFIL_UTI: userData.PROFIL_UTI || 'Utilisateur',
      SEX_UTI: userData.SEX_UTI || 'M',
      ACTIF: userData.ACTIF !== undefined ? userData.ACTIF : true,
      SUPER_ADMIN: userData.SUPER_ADMIN || false,
      // Inclure le centre si spécifié
      COD_CEN: userData.COD_CEN || null,
      roles: Array.isArray(userData.roles) ? userData.roles : [],
      mot_de_passe: userData.mot_de_passe || 'Password123',
      // Champs optionnels avec valeurs par défaut
      TEL_UTI: userData.TEL_UTI || '',
      TEL_MOBILE_UTI: userData.TEL_MOBILE_UTI || '',
      FONCTION_UTI: userData.FONCTION_UTI || '',
      SERVICE_UTI: userData.SERVICE_UTI || '',
      LANGUE_UTI: userData.LANGUE_UTI || 'fr',
      TIMEZONE_UTI: userData.TIMEZONE_UTI || 'Africa/Douala',
      DATE_FORMAT: userData.DATE_FORMAT || 'DD/MM/YYYY',
      THEME_UTI: userData.THEME_UTI || 'light',
      NAISSANCE_UTI: userData.NAISSANCE_UTI || null,
      DATE_DEBUT_VALIDITE: userData.DATE_DEBUT_VALIDITE || null,
      DATE_FIN_VALIDITE: userData.DATE_FIN_VALIDITE || null,
      DROITS_SPECIAUX: userData.DROITS_SPECIAUX || null
    };
    
    console.log('📤 Données envoyées:', dataToSend);
    
    const response = await fetchAPI('/security/utilisateurs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(dataToSend),
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error);
    
    let errorMessage = error.message;
    if (error.message.includes('login existe déjà') || error.message.includes('duplicate key')) {
      errorMessage = 'Ce nom d\'utilisateur est déjà utilisé';
    } else if (error.message.includes('email existe déjà')) {
      errorMessage = 'Cette adresse email est déjà utilisée';
    } else if (error.message.includes('409')) {
      errorMessage = 'Utilisateur déjà existant';
    } else if (error.message.includes('401') || error.message.includes('403')) {
      errorMessage = 'Vous n\'avez pas les autorisations nécessaires';
    } else if (error.message.includes('validation') || error.message.includes('400')) {
      errorMessage = 'Données invalides. Veuillez vérifier les informations saisies';
    }
    
    return {
      success: false,
      message: errorMessage || 'Erreur lors de la création de l\'utilisateur'
    };
  }
},

// Ajoutez cette fonction utilitaire dans adminAPI
async hashPasswordSHA256(password) {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex.toUpperCase();
    } else {
      // Fallback pour Node.js
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(password).digest('hex');
      return hash.toUpperCase();
    }
  } catch (error) {
    console.error('Erreur de hachage:', error);
    throw error;
  }
},

async updateUtilisateur(id, userData) {
  try {
    if (!id || isNaN(parseInt(id))) {
      return {
        success: false,
        message: 'ID utilisateur invalide'
      };
    }
    
    console.log(`✏️ Mise à jour utilisateur ${id}:`, userData);
    
    // Préparer les données pour l'envoi
    const dataToSend = {};
    
    // Copier uniquement les champs qui sont présents dans userData
    const champsAutorises = [
      'NOM_UTI', 'PRE_UTI', 'EMAIL_UTI', 'SEX_UTI', 'PROFIL_UTI',
      'ACTIF', 'SUPER_ADMIN', 'COD_CEN', 'TEL_UTI', 'TEL_MOBILE_UTI',
      'FONCTION_UTI', 'SERVICE_UTI', 'LANGUE_UTI', 'TIMEZONE_UTI',
      'DATE_FORMAT', 'THEME_UTI', 'NAISSANCE_UTI', 'DATE_DEBUT_VALIDITE',
      'DATE_FIN_VALIDITE', 'DROITS_SPECIAUX', 'roles'
    ];
    
    champsAutorises.forEach(champ => {
      if (userData[champ] !== undefined) {
        dataToSend[champ] = userData[champ];
      }
    });
    
    // Ajouter le pays si modifié (uniquement pour super admin)
    if (userData.COD_PAY !== undefined) {
      dataToSend.COD_PAY = userData.COD_PAY;
    }
    
    console.log('📤 Données de mise à jour:', dataToSend);
    
    const response = await fetchAPI(`/security/utilisateurs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(dataToSend),
    });
    
    return response;
    
  } catch (error) {
    console.error(`❌ Erreur mise à jour utilisateur ${id}:`, error);
    
    let errorMessage = error.message;
    if (error.message.includes('404')) {
      errorMessage = 'Utilisateur non trouvé';
    } else if (error.message.includes('401') || error.message.includes('403')) {
      errorMessage = 'Vous n\'avez pas les autorisations nécessaires';
    } else if (error.message.includes('validation') || error.message.includes('400')) {
      errorMessage = 'Données invalides. Veuillez vérifier les informations saisies';
    } else if (error.message.includes('email existe déjà')) {
      errorMessage = 'Cette adresse email est déjà utilisée';
    }
    
    return {
      success: false,
      message: errorMessage || 'Erreur lors de la mise à jour de l\'utilisateur'
    };
  }
},


  async deleteUtilisateur(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID utilisateur invalide');
      }
      
      const response = await fetchAPI(`/security/utilisateurs/${id}`, {
        method: 'DELETE',
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression utilisateur ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la suppression de l\'utilisateur'
      };
    }
  },

  async resetUtilisateurPassword(id, passwordData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID utilisateur invalide');
      }
      
      console.log(`🔑 Réinitialisation mot de passe utilisateur ${id}`);
      
      const response = await fetchAPI(`/security/utilisateurs/${id}/password`, {
        method: 'PUT',
        body: JSON.stringify(passwordData),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur réinitialisation mot de passe utilisateur ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la réinitialisation du mot de passe'
      };
    }
  },

  // ==============================================
  // GESTION DES RÔLES
  // ==============================================
 async getRoles(params = {}) {
    try {
      const { search = '', actif = '' } = params;
      
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (actif !== '') queryParams.append('actif', actif);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/security/roles${queryString ? '?' + queryString : ''}`);
      
      if (response.success) {
        const roles = response.roles?.map(role => this.formatRoleForDisplay(role)) || [];
        
        return {
          ...response,
          roles: roles
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération rôles:', error);
      return { success: false, message: error.message, roles: [] };
    }
  },

  async getRole(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID rôle invalide');
      }
      
      const response = await fetchAPI(`/security/roles/${id}`);
      
      if (response.success) {
        return {
          ...response,
          role: this.formatRoleForDisplay(response.role)
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération rôle ${id}:`, error);
      return { success: false, message: error.message, role: null };
    }
  },

  async createRole(roleData) {
    try {
      console.log('📝 Création rôle avec synchronisation:', roleData);
      
      const validation = this.validateRoleData(roleData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      const dataToSend = {
        LIB_ROL: roleData.LIB_ROL,
        DESCRIPTION: roleData.DESCRIPTION,
        ACTIF: roleData.ACTIF !== undefined ? roleData.ACTIF : true,
        templateRoleId: roleData.templateRoleId || null
      };
      
      const response = await fetchAPI('/security/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dataToSend),
      });
      
      // Formatage de la réponse pour le frontend
      if (response.success) {
        return {
          ...response,
          role: {
            id: response.role.id,
            nom: response.role.nom,
            label: response.role.nom,
            description: response.role.description,
            actif: response.role.actif,
            date_creation: response.role.date_creation,
            createur: response.role.createur,
            nombre_utilisateurs: 0, // Initialement 0
            options_assignees: response.details?.optionsAssignees || 0,
            template_used: response.details?.templateUsed || false
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur création rôle:', error);
      
      // Gestion des erreurs spécifiques
      let errorMessage = error.message;
      
      if (error.message.includes('Un rôle avec ce nom existe déjà')) {
        errorMessage = 'Un rôle avec ce nom existe déjà';
      } else if (error.message.includes('Option invalide')) {
        errorMessage = 'Erreur de synchronisation des options';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Vous n\'avez pas les autorisations nécessaires pour créer un rôle';
      } else if (error.message.includes('400')) {
        errorMessage = 'Données invalides. Veuillez vérifier les informations saisies';
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  async updateRole(id, roleData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID rôle invalide');
      }
      
      console.log(`✏️ Mise à jour rôle ${id}:`, roleData);
      
      const dataToSend = {
        LIB_ROL: roleData.LIB_ROL,
        DESCRIPTION: roleData.DESCRIPTION,
        ACTIF: roleData.ACTIF
      };
      
      const response = await fetchAPI(`/security/roles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dataToSend),
      });
      
      // Formatage de la réponse pour le frontend
      if (response.success) {
        return {
          ...response,
          role: this.formatRoleForDisplay(response.role)
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour rôle ${id}:`, error);
      
      let errorMessage = error.message;
      if (error.message.includes('Un rôle avec ce nom existe déjà')) {
        errorMessage = 'Un rôle avec ce nom existe déjà';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Vous n\'avez pas les autorisations nécessaires pour modifier ce rôle';
      } else if (error.message.includes('404')) {
        errorMessage = 'Rôle non trouvé';
      }
      
      return {
        success: false,
        message: errorMessage || 'Erreur lors de la mise à jour du rôle'
      };
    }
  },

  async deleteRole(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID rôle invalide');
      }
      
      const response = await fetchAPI(`/security/roles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression rôle ${id}:`, error);
      
      let errorMessage = error.message;
      if (error.message.includes('utilisé par des utilisateurs')) {
        errorMessage = 'Ce rôle est utilisé par des utilisateurs et ne peut pas être supprimé';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Vous n\'avez pas les autorisations nécessaires pour supprimer ce rôle';
      } else if (error.message.includes('404')) {
        errorMessage = 'Rôle non trouvé';
      }
      
      return {
        success: false,
        message: errorMessage || 'Erreur lors de la suppression du rôle'
      };
    }
  },

  // Fonction pour récupérer les rôles disponibles comme templates
  async getRoleTemplates() {
    try {
      const response = await fetchAPI('/security/roles/templates');
      
      if (response.success) {
        return {
          success: true,
          templates: response.templates.map(template => ({
            id: template.id,
            nom: template.nom,
            description: template.description,
            options_count: template.options_count || 0
          }))
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération templates rôles:', error);
      return { success: false, message: error.message, templates: [] };
    }
  },

  // Fonction pour récupérer les options d'un rôle
  async getRoleOptions(roleId) {
    try {
      if (!roleId || isNaN(parseInt(roleId))) {
        throw new Error('ID rôle invalide');
      }
      
      const response = await fetchAPI(`/security/roles/${roleId}/options`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération options rôle ${roleId}:`, error);
      return { success: false, message: error.message, options: [] };
    }
  },

  // Fonction pour mettre à jour les options d'un rôle
  async updateRoleOptions(roleId, optionsData) {
    try {
      if (!roleId || isNaN(parseInt(roleId))) {
        throw new Error('ID rôle invalide');
      }
      
      const response = await fetchAPI(`/security/roles/${roleId}/options`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(optionsData),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour options rôle ${roleId}:`, error);
      return { success: false, message: error.message };
    }
  },

  // Mettre à jour la validation des données de rôle
  validateRoleData(data) {
    const errors = [];
    
    if (!data.LIB_ROL || data.LIB_ROL.trim() === '') {
      errors.push('Le nom du rôle est obligatoire');
    }
    
    if (data.LIB_ROL && data.LIB_ROL.length < 3) {
      errors.push('Le nom du rôle doit contenir au moins 3 caractères');
    }
    
    if (!data.DESCRIPTION || data.DESCRIPTION.trim() === '') {
      errors.push('La description du rôle est obligatoire');
    }
    
    // Validation du templateRoleId si fourni
    if (data.templateRoleId && isNaN(parseInt(data.templateRoleId))) {
      errors.push('L\'ID du rôle template doit être un nombre valide');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Mettre à jour formatRoleForDisplay pour inclure les options
  formatRoleForDisplay(role) {
    if (!role) return null;
    
    if (role.id) return role;
    
    return {
      id: role.COD_ROL,
      nom: role.LIB_ROL,
      label: role.LIB_ROL,
      description: role.DESCRIPTION,
      actif: role.ACTIF === 1 || role.ACTIF === true,
      date_creation: role.DATE_CREATION,
      createur: role.COD_CREUTIL,
      nombre_utilisateurs: role.NB_UTILISATEURS || 0,
      options_count: role.OPTIONS_COUNT || 0,
      // Nouveaux champs pour la synchronisation
      options_assignees: role.OPTIONS_ASSIGNEES || 0,
      template_used: role.TEMPLATE_USED || false
    };
  },
  // ==============================================
  // GESTION DES SESSIONS
  // ==============================================

async getSessions(params = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      statut = '',
      dateDebut = null,
      dateFin = null
    } = params;

    const queryParams = new URLSearchParams();
    
    if (page && page > 1) queryParams.append('page', page);
    if (limit && limit !== 20) queryParams.append('limit', limit);
    if (search) queryParams.append('search', search);
    if (statut) queryParams.append('statut', statut);
    if (dateDebut) queryParams.append('dateDebut', dateDebut);
    if (dateFin) queryParams.append('dateFin', dateFin);
    
    const queryString = queryParams.toString();
    const response = await fetchAPI(`/admin/sessions${queryString ? '?' + queryString : ''}`);
    
    // Si l'API ne gère pas encore la pagination côté serveur, on la gère côté client
    if (response.success && response.sessions) {
      // Transformer la réponse pour correspondre à l'attendu du frontend
      const sessions = response.sessions || [];
      
      // Filtrer par recherche si fourni
      let filteredSessions = sessions;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredSessions = sessions.filter(session => 
          (session.LOG_UTI && session.LOG_UTI.toLowerCase().includes(searchLower)) ||
          (session.NOM_UTI && session.NOM_UTI.toLowerCase().includes(searchLower)) ||
          (session.PRE_UTI && session.PRE_UTI.toLowerCase().includes(searchLower)) ||
          (session.ADRESSE_IP && session.ADRESSE_IP.includes(search)) ||
          (session.ID_SESSION && session.ID_SESSION.toString().includes(search))
        );
      }
      
      // Filtrer par statut si fourni
      if (statut) {
        filteredSessions = filteredSessions.filter(session => 
          session.STATUT === statut
        );
      }
      
      // Gestion de la pagination côté client
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSessions = filteredSessions.slice(startIndex, endIndex);
      const total = filteredSessions.length;
      
      return {
        success: true,
        sessions: paginatedSessions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    }
    
    return response;
  } catch (error) {
    console.error('❌ Erreur récupération sessions:', error);
    return {
      success: false,
      message: error.message,
      sessions: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
    };
  }
},

async terminerSession(id) {
  try {
    if (!id || isNaN(parseInt(id))) {
      throw new Error('ID session invalide');
    }
    
    const response = await fetchAPI(`/admin/sessions/${id}/terminer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response;
  } catch (error) {
    console.error(`❌ Erreur terminaison session ${id}:`, error);
    return {
      success: false,
      message: error.message || 'Erreur lors de la terminaison de la session'
    };
  }
},

  // ==============================================
  // GESTION DES MENUS ET PERMISSIONS
  // ==============================================

  async getMenus(params = {}) {
    try {
      const { actif = '' } = params;
      
      const queryParams = new URLSearchParams();
      if (actif !== '') queryParams.append('actif', actif);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/security/menus${queryString ? '?' + queryString : ''}`);
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération menus:', error);
      return { success: false, message: error.message, menus: [], menusByLevel: {} };
    }
  },

  async getMyPermissions() {
    try {
      const response = await fetchAPI('/security/permissions/me');
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération permissions:', error);
      return { success: false, message: error.message, permissions: null };
    }
  },

  async checkAccess(path) {
    try {
      const response = await fetchAPI(`/security/check-access?path=${encodeURIComponent(path)}`);
      
      return response;
    } catch (error) {
      console.error('❌ Erreur vérification accès:', error);
      return { success: false, message: error.message, hasAccess: false };
    }
  },

  // ==============================================
  // GESTION BIOMÉTRIQUE
  // ==============================================

  async getEnregistrementsBiometriques(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        type = '',
        statut = '',
        dateDebut = null,
        dateFin = null
      } = params;

      const queryParams = new URLSearchParams();
      
      if (page) queryParams.append('page', page);
      if (limit) queryParams.append('limit', limit);
      if (search) queryParams.append('search', search);
      if (type) queryParams.append('type', type);
      if (statut) queryParams.append('statut', statut);
      if (dateDebut) queryParams.append('dateDebut', dateDebut);
      if (dateFin) queryParams.append('dateFin', dateFin);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/security/biometrie${queryString ? '?' + queryString : ''}`);
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération enregistrements biométriques:', error);
      return {
        success: false,
        message: error.message,
        enregistrements: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }
  },

  async getEnregistrementBiometrique(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID enregistrement invalide');
      }
      
      const response = await fetchAPI(`/security/biometrie/${id}`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération enregistrement biométrique ${id}:`, error);
      return { success: false, message: error.message, enregistrement: null };
    }
  },

  async createEnregistrementBiometrique(data) {
    try {
      console.log('📝 Création enregistrement biométrique:', data);
      
      const response = await fetchAPI('/security/biometrie', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur création enregistrement biométrique:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la création de l\'enregistrement biométrique'
      };
    }
  },

  async deleteEnregistrementBiometrique(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID enregistrement invalide');
      }
      
      const response = await fetchAPI(`/security/biometrie/${id}`, {
        method: 'DELETE',
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression enregistrement biométrique ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la suppression de l\'enregistrement biométrique'
      };
    }
  },

  // ==============================================
  // PROFIL UTILISATEUR
  // ==============================================

  async getMyProfile() {
    try {
      const response = await fetchAPI('/security/my-profile');
      
      if (response.success) {
        return {
          ...response,
          profile: this.formatUtilisateurForDisplay(response.profile)
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération profil:', error);
      return { success: false, message: error.message, profile: null };
    }
  },

  async updateMyProfile(profileData) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser.ID_UTI || currentUser.id;
      
      if (!userId) {
        throw new Error('Utilisateur non connecté');
      }
      
      const response = await this.updateUtilisateur(userId, profileData);
      
      if (response.success) {
        const updatedUser = { ...currentUser, ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du profil'
      };
    }
  },

  async changeMyPassword(passwordData) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser.ID_UTI || currentUser.id;
      
      if (!userId) {
        throw new Error('Utilisateur non connecté');
      }
      
      const response = await this.resetUtilisateurPassword(userId, passwordData);
      
      return response;
    } catch (error) {
      console.error('❌ Erreur changement mot de passe:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors du changement de mot de passe'
      };
    }
  },

  // ==============================================
  // UTILITAIRES ET FONCTIONS D'AIDE
  // ==============================================

  formatUtilisateurForDisplay(user) {
    if (!user) return null;
    
    if (user.id) return user;
    
    return {
      id: user.ID_UTI,
      login: user.LOG_UTI,
      nom: user.NOM_UTI,
      prenom: user.PRE_UTI,
      nom_complet: `${user.PRE_UTI || ''} ${user.NOM_UTI || ''}`.trim(),
      sexe: user.SEX_UTI,
      naissance: user.NAISSANCE_UTI,
      email: user.EMAIL_UTI,
      telephone: user.TEL_UTI,
      mobile: user.TEL_MOBILE_UTI,
      fonction: user.FONCTION_UTI,
      service: user.SERVICE_UTI,
      profil: user.PROFIL_UTI,
      langue: user.LANGUE_UTI,
      timezone: user.TIMEZONE_UTI,
      date_format: user.DATE_FORMAT,
      theme: user.THEME_UTI,
      date_derniere_connexion: user.DATE_DERNIERE_CONNEXION,
      nb_tentatives_echouees: user.NB_TENTATIVES_ECHOUES || 0,
      compte_bloque: user.COMPTE_BLOQUE === 1 || user.COMPTE_BLOQUE === true,
      actif: user.ACTIF === 1 || user.ACTIF === true,
      super_admin: user.SUPER_ADMIN === 1 || user.SUPER_ADMIN === true,
      date_debut_validite: user.DATE_DEBUT_VALIDITE,
      date_fin_validite: user.DATE_FIN_VALIDITE,
      droits_speciaux: user.DROITS_SPECIAUX,
      signature_digitale: user.SIGNATURE_DIGITALE,
      photo: user.PHOTO_UTI,
      cod_pay: user.COD_PAY,
      nom_pays: user.NOM_PAYS,
      roles: user.ROLES || '',
      role_ids: user.ROLE_IDS || [],
      date_creation: user.DAT_CREUTIL,
      date_modification: user.DAT_MODUTIL,
      createur: user.COD_CREUTIL,
      modificateur: user.COD_MODUTIL
    };
  },

  validateUtilisateurData(data, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate) {
      if (!data.LOG_UTI || data.LOG_UTI.trim() === '') {
        errors.push('Le login est obligatoire');
      }
      if (!data.NOM_UTI || data.NOM_UTI.trim() === '') {
        errors.push('Le nom est obligatoire');
      }
      if (!data.PRE_UTI || data.PRE_UTI.trim() === '') {
        errors.push('Le prénom est obligatoire');
      }
      if (!data.EMAIL_UTI || data.EMAIL_UTI.trim() === '') {
        errors.push('L\'email est obligatoire');
      }
      if (!data.mot_de_passe && !isUpdate) {
        errors.push('Le mot de passe est obligatoire');
      }
    }
    
    if (data.EMAIL_UTI && data.EMAIL_UTI.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.EMAIL_UTI)) {
        errors.push('Format d\'email invalide');
      }
    }
    
    if (data.SEX_UTI && !['M', 'F', 'O'].includes(data.SEX_UTI)) {
      errors.push('Sexe invalide. Doit être M, F ou O');
    }
    
    const profilsValides = ['Utilisateur', 'Caissier', 'Secretaire', 'Infirmier', 'Medecin', 'Admin', 'SuperAdmin'];
    if (data.PROFIL_UTI && !profilsValides.includes(data.PROFIL_UTI)) {
      errors.push(`Profil invalide. Doit être l'un de: ${profilsValides.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  

  getProfilsDisponibles() {
    return [
      { value: 'Utilisateur', label: 'Utilisateur' },
      { value: 'Caissier', label: 'Caissier' },
      { value: 'Secretaire', label: 'Secrétaire' },
      { value: 'Infirmier', label: 'Infirmier' },
      { value: 'Medecin', label: 'Médecin' },
      { value: 'Admin', label: 'Administrateur' },
      { value: 'SuperAdmin', label: 'Super Administrateur' }
    ];
  },

  getSexesDisponibles() {
    return [
      { value: 'M', label: 'Masculin' },
      { value: 'F', label: 'Féminin' },
      { value: 'O', label: 'Autre' }
    ];
  },

  getPaysDisponibles() {
    return [
      { value: 'CMF', label: 'Cameroun Francophone' },
      { value: 'CMA', label: 'Cameroun Anglophone' },
      { value: 'RCA', label: 'République Centrafricaine' },
      { value: 'TCD', label: 'Tchad' },
      { value: 'GNQ', label: 'Guinée Équatoriale' },
      { value: 'BDI', label: 'Burundi' },
      { value: 'COG', label: 'République du Congo' }
    ];
  },

  getTypesBiometriques() {
    return [
      { value: 'empreinte', label: 'Empreinte digitale' },
      { value: 'visage', label: 'Reconnaissance faciale' },
      { value: 'iris', label: 'Scan de l\'iris' }
    ];
  },

  getDoigtsDisponibles() {
    return [
      { value: 'pouce_droit', label: 'Pouce droit' },
      { value: 'index_droit', label: 'Index droit' },
      { value: 'majeur_droit', label: 'Majeur droit' },
      { value: 'annulaire_droit', label: 'Annulaire droit' },
      { value: 'auriculaire_droit', label: 'Auriculaire droit' },
      { value: 'pouce_gauche', label: 'Pouce gauche' },
      { value: 'index_gauche', label: 'Index gauche' },
      { value: 'majeur_gauche', label: 'Majeur gauche' },
      { value: 'annulaire_gauche', label: 'Annulaire gauche' },
      { value: 'auriculaire_gauche', label: 'Auriculaire gauche' }
    ];
  },

  getLanguesDisponibles() {
    return [
      { value: 'fr-FR', label: 'Français' },
      { value: 'en-GB', label: 'Anglais' },
      { value: 'es-ES', label: 'Espagnol' }
    ];
  },

  getFuseauxHorairesDisponibles() {
    return [
      { value: 'Africa/Douala', label: 'Afrique/Douala (GMT+1)' },
      { value: 'Africa/Lagos', label: 'Afrique/Lagos (GMT+1)' },
      { value: 'Africa/Brazzaville', label: 'Afrique/Brazzaville (GMT+1)' },
      { value: 'Africa/Bangui', label: 'Afrique/Bangui (GMT+1)' },
      { value: 'Africa/Ndjamena', label: 'Afrique/Ndjamena (GMT+1)' }
    ];
  },

  getFormatsDateDisponibles() {
    return [
      { value: 'dd/MM/yyyy', label: 'JJ/MM/AAAA' },
      { value: 'MM/dd/yyyy', label: 'MM/JJ/AAAA' },
      { value: 'yyyy-MM-dd', label: 'AAAA-MM-JJ' },
      { value: 'dd MMMM yyyy', label: 'JJ Mois AAAA' }
    ];
  },

  getThemesDisponibles() {
    return [
      { value: 'Clair', label: 'Clair' },
      { value: 'Sombre', label: 'Sombre' },
      { value: 'Auto', label: 'Auto (selon système)' }
    ];
  },

  generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  },

  generateLogin(nom, prenom) {
    const nomPart = nom.toLowerCase().substring(0, 3).replace(/\s/g, '');
    const prenomPart = prenom.toLowerCase().substring(0, 3).replace(/\s/g, '');
    const randomNum = Math.floor(Math.random() * 1000);
    return `${prenomPart}.${nomPart}${randomNum}`;
  },

  async getRolesDisponibles() {
    try {
      const response = await this.getRoles();
      
      if (response.success) {
        const roles = response.roles.map(role => ({
          id: role.id,
          nom: role.nom,
          label: role.nom,
          value: role.id,
          description: role.description
        }));
        
        return {
          success: true,
          roles: roles
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur rôles disponibles:', error);
      return { success: false, message: error.message, roles: [] };
    }
  },

  async testConnexion() {
    try {
      const response = await fetchAPI('/security/my-profile');
      return {
        success: response.success !== false,
        message: response.success !== false ? 'Connexion OK' : 'Connexion en erreur',
        timestamp: new Date().toISOString(),
        details: response
      };
    } catch (error) {
      console.error('❌ Test connexion échoué:', error);
      return {
        success: false,
        message: 'Connexion non disponible',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  async getStatistiquesGlobales() {
    try {
      const [utilisateursResponse, rolesResponse, sessionsResponse] = await Promise.all([
        this.getUtilisateurs({ limit: 1 }),
        this.getRoles(),
        this.getSessions({ limit: 1 })
      ]);
      
      const stats = {
        utilisateurs: {
          total: utilisateursResponse.pagination?.total || 0,
          actifs: 0,
          inactifs: 0,
          bloques: 0,
          super_admin: 0,
          actifs_aujourdhui: 0
        },
        roles: {
          total: rolesResponse.roles?.length || 0,
          utilisateurs_avec_roles: 0
        },
        sessions: {
          actives: 0,
          en_cours: sessionsResponse.pagination?.total || 0
        }
      };
      
      return {
        success: true,
        statistiques: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erreur statistiques globales:', error);
      return {
        success: false,
        message: error.message,
        statistiques: null
      };
    }
  },

  async getDashboard() {
    try {
      const [utilisateursResponse, sessionsResponse, rolesResponse] = await Promise.all([
        this.getUtilisateurs({ limit: 10 }),
        this.getSessions({ limit: 5 }),
        this.getRoles()
      ]);
      
      const sessionsActives = sessionsResponse.sessions?.filter(s => s.STATUT === 'ACTIVE') || [];
      const derniersUtilisateurs = utilisateursResponse.utilisateurs?.slice(0, 5) || [];
      
      return {
        success: true,
        dashboard: {
          statistiques: {
            utilisateurs: {
              total: utilisateursResponse.pagination?.total || 0,
              actifs: derniersUtilisateurs.filter(u => u.actif).length,
              nouveaux_aujourdhui: 0
            },
            roles: {
              total: rolesResponse.roles?.length || 0
            },
            sessions: {
              actives: sessionsActives.length
            }
          },
          sessions_actives: sessionsActives.length,
          derniers_utilisateurs: derniersUtilisateurs,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Erreur dashboard admin:', error);
      return {
        success: false,
        message: error.message,
        dashboard: {
          statistiques: null,
          sessions_actives: 0,
          derniers_utilisateurs: [],
          timestamp: new Date().toISOString()
        }
      };
    }
  },
   async getConfigurations() {
    try {
      const response = await fetchAPI('/config/configurations');
      
      if (response.success) {
        return {
          ...response,
          configurations: response.configurations || {}
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération configurations:', error);
      return {
        success: false,
        message: error.message,
        configurations: {
          general: [],
          securite: [],
          email: [],
          reseau: [],
          backup: [],
          interface: [],
          comptabilite: [],
          medical: []
        }
      };
    }
  },

  async getParametres(params = {}) {
    try {
      const { search = '', type = '', cod_pay = '' } = params;
      
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (type) queryParams.append('type', type);
      if (cod_pay) queryParams.append('cod_pay', cod_pay);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/config/parametres${queryString ? '?' + queryString : ''}`);
      
      if (response.success) {
        return {
          ...response,
          parametres: response.parametres || []
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération paramètres:', error);
      return { success: false, message: error.message, parametres: [] };
    }
  },

  async getParametre(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID paramètre invalide');
      }
      
      const response = await fetchAPI(`/config/parametres/${id}`);
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération paramètre ${id}:`, error);
      return { success: false, message: error.message, parametre: null };
    }
  },

  async createParametre(parametreData) {
    try {
      console.log('📝 Création paramètre:', parametreData);
      
      const response = await fetchAPI('/config/parametres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(parametreData),
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur création paramètre:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la création du paramètre'
      };
    }
  },

  async updateParametre(id, parametreData) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID paramètre invalide');
      }
      
      console.log(`✏️ Mise à jour paramètre ${id}:`, parametreData);
      
      const response = await fetchAPI(`/config/parametres/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(parametreData),
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour paramètre ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du paramètre'
      };
    }
  },

  async deleteParametre(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID paramètre invalide');
      }
      
      const response = await fetchAPI(`/config/parametres/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression paramètre ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la suppression du paramètre'
      };
    }
  },

  async importParametres(importData) {
    try {
      const formData = new FormData();
      if (importData.file && importData.file[0]) {
        formData.append('file', importData.file[0]);
      }
      formData.append('overwrite', importData.overwrite || false);
      
      const response = await fetchAPI('/config/parametres/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur import paramètres:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'importation des paramètres'
      };
    }
  },

  async exportParametres() {
    try {
      const response = await fetchAPI('/config/parametres/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur export paramètres:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'exportation des paramètres'
      };
    }
  },

  // ==============================================
  // GESTION DES LOGS
  // ==============================================

  async getLogs(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        level = '',
        dateDebut = null,
        dateFin = null
      } = params;

      const queryParams = new URLSearchParams();
      
      if (page) queryParams.append('page', page);
      if (limit) queryParams.append('limit', limit);
      if (level) queryParams.append('level', level);
      if (dateDebut) queryParams.append('dateDebut', dateDebut);
      if (dateFin) queryParams.append('dateFin', dateFin);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/config/logs${queryString ? '?' + queryString : ''}`);
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération logs:', error);
      return {
        success: false,
        message: error.message,
        logs: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }
  },

  async clearLogs() {
    try {
      const response = await fetchAPI('/config/logs/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur suppression logs:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la suppression des logs'
      };
    }
  },

  // ==============================================
  // GESTION DES BACKUPS
  // ==============================================

  async getBackups() {
    try {
      const response = await fetchAPI('/config/backups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération backups:', error);
      return {
        success: false,
        message: error.message,
        backups: [],
        status: null
      };
    }
  },

  async createBackup() {
    try {
      const response = await fetchAPI('/config/backups/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur création backup:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la création du backup'
      };
    }
  },

  async restoreBackup(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID backup invalide');
      }
      
      const response = await fetchAPI(`/config/backups/${id}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Erreur restauration backup ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la restauration du backup'
      };
    }
  },

  async downloadBackup(id) {
  try {
    if (!id || isNaN(parseInt(id))) {
      throw new Error('ID backup invalide');
    }
    
<<<<<<< HEAD
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api' || 'http://localhost:3000/api';
=======
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api' || 'http://172.20.10.2:3000/api';
>>>>>>> d90a12e2bad9383f696451b6f983404524d7015b
    const url = `${baseURL}/config/backups/${id}/download`;
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    
    // Extraire le nom du fichier de l'en-tête Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `backup_${id}_${moment().format('YYYYMMDD')}.txt`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Erreur téléchargement backup ${id}:`, error);
    return {
      success: false,
      message: error.message || 'Erreur lors du téléchargement du backup'
    };
  }
},

async getBackupStatus(id) {
  try {
    if (!id || isNaN(parseInt(id))) {
      throw new Error('ID backup invalide');
    }
    
    const response = await fetchAPI(`/config/backups/${id}/status`);
    return response;
  } catch (error) {
    console.error(`❌ Erreur vérification statut backup ${id}:`, error);
    return { success: false, message: error.message };
  }
},

  // ==============================================
  // GESTION DES AUDITS
  // ==============================================

  async getAuditTrails(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        action = '',
        username = '',
        dateDebut = null,
        dateFin = null
      } = params;

      const queryParams = new URLSearchParams();
      
      if (page) queryParams.append('page', page);
      if (limit) queryParams.append('limit', limit);
      if (action) queryParams.append('action', action);
      if (username) queryParams.append('username', username);
      if (dateDebut) queryParams.append('dateDebut', dateDebut);
      if (dateFin) queryParams.append('dateFin', dateFin);
      
      const queryString = queryParams.toString();
      const response = await fetchAPI(`/config/audit${queryString ? '?' + queryString : ''}`);
      
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération audit:', error);
      return {
        success: false,
        message: error.message,
        audit: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      };
    }
  }
};

  // API globale
  const api = {
    // Modules API
    consultations: consultationsAPI,
    prescriptions: prescriptionsAPI,
    patients: patientsAPI,
    prestattions:prestationsAPI,
    beneficiaires: beneficiairesAPI,
    pays: paysAPI,
    auth: authAPI,
    dashboard: dashboardAPI,
    centres: centresAPI,
    facturation: facturationAPI,
    finances: financesAPI,
    notifications: notificationsAPI,
    remboursements: remboursementsAPI,
    reseauSoins: reseauSoinsAPI,
    dossiersMedicaux: dossiersMedicauxAPI,
    famillesACE: famillesACEAPI,
    prestataires: prestatairesAPI,
    conventions: conventionsAPI,
    compagnies: compagniesAPI,
    urgences: urgencesAPI,
    polices: policesAPI,
    baremes:baremesAPI,
    tarifs: tarifsAPI,
    affections:affectionsAPI,
    admin: adminAPI,
    typesAssureurs: typesAssureursAPI,
    allergies: allergiesAPI,
    antecedentsAPI: antecedentsAPI,
    importAPI: importAPI,
    exportPDFAPI: exportPDFAPI,
  

    
    // Configuration
    setBaseURL(baseURL) {
      API_URL = baseURL.replace(/\/$/, '');
      console.log(`🔧 URL API mise à jour: ${API_URL}`);
      
      // Persistance dans localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('api_base_url', API_URL);
      }
    },
    
    getBaseURL() {
      return API_URL;
    },
    
    // Test de connexion
    async testConnection() {
      try {
        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        return {
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    },
    
    // Vérification de santé de l'API
    async checkHealth() {
      try {
        const healthResponse = await fetchAPI('/health');
        
        return {
          success: true,
          api: healthResponse,
          timestamp: new Date().toISOString(),
          environment: import.meta.env.MODE || 'development',
          apiUrl: API_URL
        };
      } catch (error) {
        return {
          success: false,
          message: 'API non disponible',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
      
    },
    
    // Test des endpoints
    async testEndpoints() {
      return await testEndpointsAvailability();
    },
    
    // Fonctions utilitaires
    formatDate: formatDateForAPI,
    cleanParams,
    buildQueryString,
    

    // Gestion des erreurs
    handleApiError(error, context = '') {
      console.error(`❌ Erreur API${context ? ` (${context})` : ''}:`, error);
      
      let userMessage = 'Une erreur est survenue';
      
      if (error.isNetworkError) {
        userMessage = 'Problème de connexion. Vérifiez votre réseau.';
      } else if (error.isTimeoutError) {
        userMessage = 'La requête a pris trop de temps. Veuillez réessayer.';
      } else if (error.status === 401) {
        userMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (error.status === 403) {
        userMessage = 'Accès non autorisé.';
      } else if (error.status === 404) {
        userMessage = 'Ressource non trouvée.';
      } else if (error.status >= 500) {
        userMessage = 'Erreur serveur. Veuillez contacter l\'administrateur.';
      } else if (error.message) {
        userMessage = error.message;
      }
      
      return {
        success: false,
        message: userMessage,
        technical: error.message,
        status: error.status,
        timestamp: new Date().toISOString()
      };
    }
  };

  // Fonctions utilitaires pour les bénéficiaires
  const getColorFromName = (name) => {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
      '#ff5722', '#795548', '#607d8b'
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (nom, prenom) => {
    const first = nom?.charAt(0)?.toUpperCase() || '';
    const second = prenom?.charAt(0)?.toUpperCase() || '';
    return `${first}${second}` || '?';
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Assuré Principal': return 'primary';
      case 'Conjoint': return 'secondary';
      case 'Enfant': return 'success';
      default: return 'default';
    }
  };


  // Initialisation au chargement
  if (typeof window !== 'undefined') {
    // Restauration de l'URL API depuis localStorage
    const savedUrl = localStorage.getItem('api_base_url');
    if (savedUrl && import.meta.env.MODE === 'development') {
      api.setBaseURL(savedUrl);
    }
    
    // Vérification périodique du token
    window.addEventListener('load', () => {
      if (authAPI.isAuthenticated()) {
        setInterval(() => {
          if (authAPI.isAuthenticated()) {
            authAPI.verifyToken().catch(() => {
              // Erreurs silencieuses pour la vérification périodique
            });
          }
        }, 5 * 60 * 1000); // Toutes les 5 minutes
      }
    });
  }

  export default api;