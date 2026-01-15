// src/services/api.js - VERSION FINALE CORRIGÉE

// Configuration
let API_URL = 'http://localhost:3000/api';

// Fonction utilitaire pour formater les dates
const formatDateForAPI = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date)) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Fonction utilitaire pour nettoyer les paramètres
const cleanParams = (params) => {
  const cleaned = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      cleaned[key] = params[key];
    }
  });
  return cleaned;
};

// Fonction de base pour les appels API
const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    headers: defaultHeaders,
    ...options,
  };

  // Préparer le body
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const fullUrl = `${API_URL}${endpoint}`;
    console.log(`📞 API: ${config.method || 'GET'} ${fullUrl}`);
    
    const response = await fetch(fullUrl, config);
    
    // Lire la réponse
    const responseText = await response.text();
    let data;
    
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { message: responseText, success: false };
    }
    
    console.log(`📊 Réponse API ${response.status}:`, {
      ok: response.ok,
      status: response.status,
      endpoint,
      data: data
    });
    
    if (!response.ok) {
      const errorMessage = data.message || data.error || `Erreur ${response.status}`;
      console.error(`❌ API Error ${response.status}:`, {
        message: errorMessage,
        endpoint,
        responseData: data
      });
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      error.isApiError = true;
      
      throw error;
    }
    
    return data;
  } catch (error) {
    if (error.isApiError) throw error;
    
    console.error('❌ Network Error:', {
      message: error.message,
      endpoint,
      stack: error.stack
    });
    const networkError = new Error(`Erreur réseau: ${error.message}`);
    networkError.isNetworkError = true;
    throw networkError;
  }
};

// Fonction de recherche de patients (utilise l'endpoint existant)
export const searchPatientsFallback = async (searchTerm, filters = {}, limit = 20) => {
  try {
    const response = await fetchAPI(`/consultations/search-patients?search=${encodeURIComponent(searchTerm)}&limit=${limit}`);
    return response;
  } catch (error) {
    console.error('❌ Erreur recherche fallback:', error);
    return { success: true, patients: [] };
  }
};

// API des consultations
export const consultationsAPI = {
  async getMedecins() {
    try {
      // CORRECTION: Utiliser le bon endpoint qui existe dans app.js
      const response = await fetchAPI('/consultations/medecins');
      return response;
    } catch (error) {
      console.error('❌ Erreur médecins:', error);
      return { success: true, medecins: [] };
    }
  },

  async getTypesConsultation() {
    try {
      const response = await fetchAPI('/consultations/types');
      return response;
    } catch (error) {
      console.error('❌ Erreur types consultation:', error);
      return { success: true, types: [] };
    }
  },

  async searchPatients(cardNumber) {
    try {
      if (!cardNumber || cardNumber.trim().length < 2) {
        return { success: true, patients: [] };
      }
      
      const response = await fetchAPI(`/consultations/search-by-card?card=${encodeURIComponent(cardNumber)}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche patients:', error);
      return { success: true, patients: [] };
    }
  },

  async create(consultationData) {
    try {
      const response = await fetchAPI('/consultations/create', {
        method: 'POST',
        body: consultationData,
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur création consultation:', error);
      throw error;
    }
  }
};

// API des patients
export const patientsAPI = {
  async getAll(limit = 50) {
    try {
      const response = await fetchAPI(`/patients?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur patients:', error);
      return { success: true, patients: [] };
    }
  },

  async getById(id) {
    try {
      const response = await fetchAPI(`/patients/${id}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur patient ${id}:`, error);
      throw error;
    }
  },

  async create(patientData) {
    try {
      const response = await fetchAPI('/patients', {
        method: 'POST',
        body: patientData,
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur création patient:', error);
      throw error;
    }
  },

  async update(id, patientData) {
    try {
      const response = await fetchAPI(`/patients/${id}`, {
        method: 'PUT',
        body: patientData,
      });
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour patient ${id}:`, error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await fetchAPI(`/patients/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression patient ${id}:`, error);
      throw error;
    }
  },

  async search(searchTerm, filters = {}, limit = 20) {
    try {
      let url = `/consultations/search-patients?search=${encodeURIComponent(searchTerm)}&limit=${limit}`;
      
      if (Object.keys(filters).length > 0) {
        const filterParams = Object.entries(filters)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&');
        url += `&${filterParams}`;
      }
      
      const response = await fetchAPI(url);
      return response;
    } catch (error) {
      console.error('❌ Erreur recherche patients:', error);
      return { success: true, patients: [] };
    }
  }
};

// API des bénéficiaires (alias)
export const beneficiairesAPI = patientsAPI;

// API des pays
export const paysAPI = {
  async getAll() {
    try {
      const response = await fetchAPI('/pays');
      return response;
    } catch (error) {
      console.error('❌ Erreur pays:', error);
      return { success: true, pays: [] };
    }
  }
};

// API d'authentification
export const authAPI = {
  async login(credentials) {
    try {
      const response = await fetchAPI('/auth/login', {
        method: 'POST',
        body: credentials,
      });
      
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur login:', error);
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve();
  },

  async verifyToken() {
    try {
      const response = await fetchAPI('/auth/verify');
      return response;
    } catch (error) {
      console.error('❌ Erreur vérification token:', error);
      throw error;
    }
  }
};

// API du dashboard
export const dashboardAPI = {
  async getStats() {
    try {
      const response = await fetchAPI('/dashboard/stats');
      return response;
    } catch (error) {
      console.error('❌ Erreur stats:', error);
      return {
        success: true,
        stats: {
          totalPatients: 0,
          consultationsAujourdhui: 0,
          medecinsActifs: 0,
          revenueMensuel: 0,
          centresActifs: 0
        }
      };
    }
  }
};

// API des centres de santé
export const centresAPI = {
  async getAll() {
    try {
      const response = await fetchAPI('/centres-sante');
      return response;
    } catch (error) {
      console.error('❌ Erreur centres:', error);
      return { success: true, centres: [] };
    }
  }
};

// API des prescriptions - UNIQUEMENT avec les endpoints existants
export const prescriptionsAPI = {
  async getAll(params = {}) {
    try {
      // Nettoyer et formater les paramètres
      const cleanedParams = { ...params };
      
      if (params.date_debut) {
        const date = new Date(params.date_debut);
        if (!isNaN(date)) {
          cleanedParams.date_debut = formatDateForAPI(date);
        }
      }
      
      if (params.date_fin) {
        const date = new Date(params.date_fin);
        if (!isNaN(date)) {
          cleanedParams.date_fin = formatDateForAPI(date);
        }
      }
      
      const finalParams = cleanParams(cleanedParams);
      const queryString = new URLSearchParams(finalParams).toString();
      const response = await fetchAPI(`/prescriptions?${queryString}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération prescriptions:', error);
      return { 
        success: true, 
        prescriptions: [], 
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } 
      };
    }
  },

  async getById(id) {
    try {
      const response = await fetchAPI(`/prescriptions/${id}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur prescription ${id}:`, error);
      throw error;
    }
  },

  async getByNumero(numero) {
    try {
      const response = await fetchAPI(`/prescriptions/numero/${encodeURIComponent(numero)}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur prescription ${numero}:`, error);
      throw error;
    }
  },

  // Dans prescriptionsAPI, ajoutez cette méthode :
async getByNumeroOrId(identifier) {
  try {
    console.log('🔍 Recherche prescription par identifiant:', identifier);
    
    // Essayer d'abord comme numéro de prescription
    try {
      const response = await fetchAPI(`/prescriptions/numero/${encodeURIComponent(identifier)}`);
      console.log('✅ Réponse par numéro:', response);
      return response;
    } catch (numError) {
      console.log('⚠️ Erreur par numéro, essai par ID:', numError.message);
    }
    
    // Si l'identifiant est numérique, essayer comme ID
    if (!isNaN(identifier) && parseInt(identifier) > 0) {
      try {
        const response = await fetchAPI(`/prescriptions/${parseInt(identifier)}`);
        console.log('✅ Réponse par ID:', response);
        return response;
      } catch (idError) {
        console.log('⚠️ Erreur par ID:', idError.message);
      }
    }
    
    // Si les deux échouent, chercher dans la liste
    try {
      const allPrescriptions = await fetchAPI(`/prescriptions?search=${encodeURIComponent(identifier)}&limit=1`);
      if (allPrescriptions.success && allPrescriptions.prescriptions && allPrescriptions.prescriptions.length > 0) {
        const prescription = allPrescriptions.prescriptions[0];
        // Récupérer les détails par ID
        const detailsResponse = await fetchAPI(`/prescriptions/${prescription.COD_PRES}`);
        return detailsResponse;
      }
    } catch (listError) {
      console.log('⚠️ Erreur recherche dans liste:', listError.message);
    }
    
    // Si rien ne fonctionne
    return {
      success: false,
      message: 'Prescription non trouvée'
    };
    
  } catch (error) {
    console.error('❌ Erreur getByNumeroOrId:', error);
    throw error;
  }
},

  async create(prescriptionData) {
  try {
    console.log('📤 Données envoyées à l\'API:', JSON.stringify(prescriptionData, null, 2));
    
    // Assurer que COD_AFF est présent (même null)
    if (prescriptionData.COD_AFF === undefined) {
      prescriptionData.COD_AFF = null;
    }
    
    // Formater la date de validité si elle existe
    if (prescriptionData.DATE_VALIDITE) {
      const date = new Date(prescriptionData.DATE_VALIDITE);
      if (!isNaN(date)) {
        prescriptionData.DATE_VALIDITE = formatDateForAPI(date);
      } else {
        prescriptionData.DATE_VALIDITE = null;
      }
    }
    
    const response = await fetchAPI('/prescriptions', {
      method: 'POST',
      body: prescriptionData,
    });
    return response;
  } catch (error) {
    console.error('❌ Erreur création prescription:', error);
    throw error;
  }
},

  async execute(id, executionData) {
    try {
      const response = await fetchAPI(`/prescriptions/${id}/execute`, {
        method: 'POST',
        body: executionData,
      });
      return response;
    } catch (error) {
      console.error(`❌ Erreur exécution prescription ${id}:`, error);
      throw error;
    }
  },

  async cancel(id, raison) {
    try {
      const response = await fetchAPI(`/prescriptions/${id}/cancel`, {
        method: 'POST',
        body: { raison },
      });
      return response;
    } catch (error) {
      console.error(`❌ Erreur annulation prescription ${id}:`, error);
      throw error;
    }
  },

  // Recherche de patients - utilise l'endpoint existant /consultations/search-patients
  async searchPatients(search) {
  try {
    if (!search || search.trim().length < 1) {
      return { success: true, patients: [] };
    }
    
    const response = await fetchAPI(`/consultations/search-patients?search=${encodeURIComponent(search)}&limit=20`);
    
    console.log('🔍 Réponse recherche patients:', response);
    
    if (response.success && response.patients) {
      const adaptedPatients = response.patients.map(patient => ({
        id: patient.ID_BEN || patient.COD_BEN || patient.id, // Vérifiez ici
        nom: patient.NOM_BEN || patient.nom || patient.NOM,
        prenom: patient.PRE_BEN || patient.prenom || patient.PRENOM,
        sexe: patient.SEX_BEN || patient.SEXE || patient.sexe,
        age: patient.AGE || (patient.NAI_BEN ? 
          new Date().getFullYear() - new Date(patient.NAI_BEN).getFullYear() : null),
        identifiant: patient.IDENTIFIANT_NATIONAL || patient.identifiant || patient.NUM_CARTE,
        date_naissance: patient.NAI_BEN || patient.DATE_NAISSANCE
      }));
      
      console.log('🔍 Patients adaptés:', adaptedPatients);
      
      return { ...response, patients: adaptedPatients };
    }
    
    return response;
  } catch (error) {
    console.error('❌ Erreur recherche patients:', error);
    return { success: true, patients: [] };
  }
},

  // Recherche d'affections - SANS mock, retourne vide
  async searchAffections(search) {
    try {
      // Essayer d'abord l'endpoint générique
      const response = await fetchAPI(`/consultations/affections?search=${encodeURIComponent(search)}&limit=20`);
      return response;
    } catch (error) {
      // Si l'endpoint n'existe pas, retourner un tableau vide
      console.log('ℹ️ Endpoint /consultations/affections non disponible');
      return { success: true, affections: [] };
    }
  },

  // Recherche d'éléments médicaux - SANS mock, retourne vide
  // Recherche d'éléments médicaux
async searchMedicalItems(search, type = '') {
  try {
    if (!search || search.trim().length < 2) {
      return { success: true, items: [] };
    }
    
    // Rechercher d'abord les médicaments
    const response = await fetchAPI(`/consultations/medicaments?search=${encodeURIComponent(search)}&limit=20`);
    
    if (response.success && response.medicaments && response.medicaments.length > 0) {
      const adaptedItems = response.medicaments.map(item => ({
        id: item.COD_MED || item.id,  // ICI: COD_MED doit être la clé primaire
        type: 'medicament',
        libelle: item.NOM_COMMERCIAL || item.libelle,
        libelle_complet: item.NOM_COMMERCIAL || item.libelle,
        forme: item.FORME_PHARMACEUTIQUE || item.forme,
        dosage: item.DOSAGE,
        prix: item.PRIX_UNITAIRE || item.prix,
        remboursable: item.REMBOURSABLE !== undefined ? item.REMBOURSABLE : 1
      }));
      
      return { ...response, items: adaptedItems };
    }
    
    // Si pas de médicaments, chercher d'autres types d'éléments
    return { success: true, items: [] };
  } catch (error) {
    console.error('❌ Erreur recherche éléments:', error);
    return { success: true, items: [] };
  }
},

 
async updateStatus(id, data) {
  try {
    // Utiliser l'endpoint de validation d'accord
    const response = await fetchAPI(`/prescriptions/${id}/valider-accord`, {
      method: 'PUT',
      body: data,
    });
    return response;
  } catch (error) {
    console.error(`❌ Erreur mise à jour statut ${id}:`, error);
    throw error;
  }
},

  async getConditionsPriseEnCharge(patientId, typePrestation) {
    try {
      const response = await fetchAPI(`/prescriptions/conditions-prise-en-charge?patientId=${patientId}&typePrestation=${typePrestation}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur conditions prise en charge:', error);
      return { 
        success: true, 
        conditions: {
          tauxCouverture: 80,
          plafond: 0,
          franchises: 0,
          exclusions: []
        } 
      };
    }
  },


  async getStatistiques(periode = 'mois') {
    try {
      const response = await fetchAPI(`/prescriptions/statistiques?periode=${periode}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur statistiques:', error);
      return { 
        success: true, 
        statistiques: {
          total: 0,
          executees: 0,
          en_attente: 0,
          en_cours: 0,
          annulees: 0,
          montant_moyen: 0,
          montant_total: 0
        } 
      };
    }
  },


  
  // Mettre à jour les détails d'une prescription existante
  async updateDetails(id, data) {
    try {
      console.log('📤 Mise à jour détails prescription:', id, data);
      
      const response = await fetchAPI(`/prescriptions/${id}/details`, {
        method: 'PUT',
        body: data,
      });
      return response;
    } catch (error) {
      console.error(`❌ Erreur mise à jour détails prescription ${id}:`, error);
      throw error;
    }
  },
  
  // Récupérer le nombre de détails d'une prescription
  async getDetailsCount(id) {
    try {
      const response = await fetchAPI(`/prescriptions/${id}/details-count`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur comptage détails prescription ${id}:`, error);
      return { success: true, count: 0 };
    }
  }


};


// Fonction pour tester les endpoints disponibles
const testEndpointsAvailability = async () => {
  const endpointsToTest = [
    '/consultations/search-patients',
    '/consultations/medicaments',
    '/consultations/affections',
    '/prescriptions',
    '/patients',
    '/pays',
    '/centres-sante',
    '/consultations/medecins',
    '/consultations/types'
  ];
  
  const results = {};
  
  for (const endpoint of endpointsToTest) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      results[endpoint] = {
        available: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      results[endpoint] = {
        available: false,
        error: error.message
      };
    }
  }
  
  console.log('🔍 Endpoints disponibles:', results);
  return results;
};

// API globale
const api = {
  consultations: consultationsAPI,
  prescriptions: prescriptionsAPI,
  patients: patientsAPI,
  beneficiaires: beneficiairesAPI,
  pays: paysAPI,
  auth: authAPI,
  dashboard: dashboardAPI,
  centres: centresAPI,
  searchPatientsFallback,
  
  // Configuration
  setBaseURL(baseURL) {
    API_URL = baseURL;
    console.log(`🔧 URL API mise à jour: ${API_URL}`);
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
      return response.ok;
    } catch {
      return false;
    }
  },
  
  // Tester les endpoints
  async testEndpoints() {
    return await testEndpointsAvailability();
  },
  
  // Fonctions utilitaires
  formatDate: formatDateForAPI,
  cleanParams
};

export default api;