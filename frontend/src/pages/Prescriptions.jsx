import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Row, Col, Button, Modal, Form,
  Select, Input, Table, Tag, Space, message, Tabs,
  Descriptions, Alert, Typography,
  InputNumber, DatePicker, AutoComplete,
  Spin, Empty, Divider, Steps, Result,
  Checkbox, Radio, Upload, Drawer, Popover, Tooltip,
  Badge, Progress, TimePicker, List, Avatar
} from 'antd';
import {
  FileTextOutlined, MedicineBoxOutlined, SearchOutlined,
  PlusOutlined, DeleteOutlined, EyeOutlined,
  PrinterOutlined, CheckCircleOutlined, SyncOutlined,
  UserOutlined, CloseCircleOutlined, DownloadOutlined,
  HistoryOutlined, CalculatorOutlined, DollarOutlined,
  TeamOutlined, HeartOutlined, DatabaseOutlined,
  PercentageOutlined, InfoCircleOutlined, LoadingOutlined,
  EditOutlined, InfoCircleFilled, AppstoreAddOutlined,
  PlayCircleOutlined, StopOutlined, ClockCircleOutlined,
  CheckOutlined, CloseOutlined, FilterOutlined,
  FilePdfOutlined, FileExcelOutlined, ShareAltOutlined,
  CalendarOutlined, ArrowRightOutlined, ReloadOutlined
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/fr';

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;
const { TabPane } = Tabs;
const { Step } = Steps;
const { RangePicker } = DatePicker;

// Configuration API
const API_BASE = process.env.REACT_APP_API_URL || '';

// API Services
const prescriptionsAPI = {
  async create(data) {
    try {
      const response = await fetch(`${API_BASE}/api/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message };
    }
  }
};

const beneficiairesAPI = {
  async searchAdvanced(cardNumber) {
    try {
      const response = await fetch(`${API_BASE}/api/beneficiaires/search?numero_carte=${cardNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, beneficiaires: [] };
    }
  }
};

const affectionsAPI = {
  async search(searchText, limit = 10) {
    try {
      const response = await fetch(
        `${API_BASE}/api/affections/search?search=${encodeURIComponent(searchText)}&limit=${limit}&cod_pay=CMF`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, affections: [] };
    }
  }
};

const baremesAPI = {
  async getActesMedicaux(codPay, params = {}) {
    try {
      const query = new URLSearchParams({ cod_pay: codPay, ...params }).toString();
      const response = await fetch(`${API_BASE}/api/baremes/actes?${query}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, actes: [] };
    }
  }
};

const centresAPI = {
  async getAll() {
    try {
      const userStr = localStorage.getItem('user');
      let user = null;
      
      if (userStr) {
        try {
          user = JSON.parse(userStr);
        } catch (e) {
          console.error('❌ Error parsing user:', e);
        }
      }
      
      const isSuperAdmin = user?.super_admin || user?.SUPER_ADMIN || user?.role === 'super_admin';
      
      if (isSuperAdmin) {
        const response = await fetch(`${API_BASE}/api/centres`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          return { 
            success: false, 
            message: `Erreur HTTP ${response.status}`,
            centres: [] 
          };
        }
        
        const data = await response.json();
        
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
      } else {
        const userCentreId = user?.COD_CEN || user?.centre_id || user?.prestataire?.centre_id;
        
        if (!userCentreId) {
          return { 
            success: true, 
            message: 'Utilisateur non affecté à un centre',
            centres: [] 
          };
        }
        
        const response = await fetch(`${API_BASE}/api/centres/${userCentreId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          return { 
            success: false, 
            message: `Erreur ${response.status}`,
            centres: [] 
          };
        }
        
        const data = await response.json();
        
        let centre = null;
        
        if (data.success && data.centre) {
          centre = data.centre;
        } else if (data.centre) {
          centre = data.centre;
        } else if (data) {
          centre = data;
        }
        
        if (centre) {
          return {
            success: true,
            centres: [centre],
            message: 'Centre utilisateur récupéré'
          };
        } else {
          return {
            success: false,
            message: 'Centre utilisateur non trouvé',
            centres: []
          };
        }
      }
      
    } catch (error) {
      return { 
        success: false, 
        message: `Erreur réseau: ${error.message}`,
        centres: [] 
      };
    }
  },

  async getPrestatairesByCentre(centreId, filters = {}) {
    try {
      if (!centreId || centreId === 'null' || centreId === 'undefined') {
        return { 
          success: false, 
          message: 'ID centre invalide',
          prestataires: [] 
        };
      }
      
      const params = new URLSearchParams();
      params.append('page', filters.page || 1);
      params.append('limit', filters.limit || 100);
      
      if (filters.type_prestataire) params.append('type_prestataire', filters.type_prestataire);
      if (filters.actif !== undefined) params.append('actif', filters.actif);
      if (filters.search) params.append('search', filters.search);
      if (filters.affectation_active !== undefined) params.append('affectation_active', filters.affectation_active);
      
      const url = `${API_BASE}/api/centres/${centreId}/prestataires?${params.toString()}`;
      const token = localStorage.getItem('token');
      
      if (!token) {
        return { 
          success: false, 
          message: 'Session expirée',
          prestataires: [] 
        };
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
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
          console.error('Error reading error message:', e);
        }
        
        return { 
          success: false, 
          message: errorMessage,
          prestataires: [] 
        };
      }
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        return { 
          success: false, 
          message: 'Réponse invalide du serveur',
          prestataires: [] 
        };
      }
      
      if (!data) {
        return { 
          success: false, 
          message: 'Réponse vide du serveur',
          prestataires: [] 
        };
      }
      
      if (data.success !== undefined) {
        const prestatairesArray = Array.isArray(data.prestataires) ? data.prestataires : [];
        return {
          success: data.success,
          message: data.message || `${prestatairesArray.length} prestataires récupérés`,
          prestataires: prestatairesArray
        };
      }
      
      if (Array.isArray(data)) {
        return {
          success: true,
          message: `${data.length} prestataires récupérés`,
          prestataires: data
        };
      }
      
      if (data.data && Array.isArray(data.data)) {
        return {
          success: true,
          message: data.message || `${data.data.length} prestataires récupérés`,
          prestataires: data.data
        };
      }
      
      if (data.result && Array.isArray(data.result)) {
        return {
          success: true,
          message: data.message || `${data.result.length} prestataires récupérés`,
          prestataires: data.result
        };
      }
      
      return { 
        success: false, 
        message: 'Format de réponse inconnu',
        prestataires: [] 
      };
      
    } catch (error) {
      return { 
        success: false, 
        message: `Erreur réseau: ${error.message}`,
        prestataires: [] 
      };
    }
  }
};

// Main Component
const Prescriptions = () => {
  // ==================== ÉTATS PRINCIPAUX ====================
  const [activeTab, setActiveTab] = useState('saisie');
  const [loading, setLoading] = useState({
    patient: false,
    prestations: false,
    prescrire: false,
    impression: false,
    prestataires: false,
    centres: false,
    actes: false,
    affections: false,
    executions: false,
    historique: false
  });

  // États pour la saisie de prescription
  const [patient, setPatient] = useState(null);
  const [prescriptionForm] = Form.useForm();
  const [selectedPrestations, setSelectedPrestations] = useState([]);
  const [typePrestation, setTypePrestation] = useState('PHARMACIE');
  const [searchPrestation, setSearchPrestation] = useState('');
  
  // États pour les affections avec COD_PAY = 'CMF' par défaut
  const [affectionCode, setAffectionCode] = useState('');
  const [affectionLibelle, setAffectionLibelle] = useState('');
  const [affectionDetails, setAffectionDetails] = useState(null);
  const [affectionOptions, setAffectionOptions] = useState([]);
  const [searchingAffections, setSearchingAffections] = useState(false);
  const COD_PAY_DEFAULT = 'CMF';
  
  // Gestion des centres
  const [user, setUser] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  });
  
  const [centreId, setCentreId] = useState(() => {
    const savedCentre = localStorage.getItem('selectedCentre');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userCentreId = user?.centre_id || user?.COD_CEN || user?.prestataire?.centre_id;
    return userCentreId || savedCentre || null;
  });
  
  const [centres, setCentres] = useState([]);
  const [centreNom, setCentreNom] = useState('');
  const [loadingCentres, setLoadingCentres] = useState(false);

  // États pour les prestations (actes médicaux)
  const [prestationsList, setPrestationsList] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loadingPrestations, setLoadingPrestations] = useState(false);
  
  // États pour les prestataires (médecins)
  const [prestataires, setPrestataires] = useState([]);
  const [selectedPrestataire, setSelectedPrestataire] = useState(null);
  const [modalPrestataires, setModalPrestataires] = useState(false);
  const [loadingPrestataires, setLoadingPrestataires] = useState(false);

  // États pour la saisie manuelle
  const [manualEntryModal, setManualEntryModal] = useState(false);
  const [manualForm] = Form.useForm();
  const [manualEntryType, setManualEntryType] = useState('MEDICAMENT');
  
  // États pour l'impression
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [ordonnanceToPrint, setOrdonnanceToPrint] = useState(null);
  const [printingOrdonnance, setPrintingOrdonnance] = useState(false);
  
  // États pour l'onglet Exécution
  const [executions, setExecutions] = useState([]);
  const [loadingExecutions, setLoadingExecutions] = useState(false);
  const [filtersExecutions, setFiltersExecutions] = useState({
    statut: 'EN_COURS',
    dateRange: [moment().startOf('month'), moment().endOf('month')],
    search: ''
  });
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [executionDetailModal, setExecutionDetailModal] = useState(false);
  const [executingPrescription, setExecutingPrescription] = useState(false);
  
  // États pour l'onglet Historique
  const [historique, setHistorique] = useState([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);
  const [filtersHistorique, setFiltersHistorique] = useState({
    dateRange: [moment().subtract(1, 'month'), moment()],
    search: '',
    type: 'ALL'
  });
  const [selectedHistorique, setSelectedHistorique] = useState(null);
  const [historiqueDetailModal, setHistoriqueDetailModal] = useState(false);
  
  // Réf pour l'impression
  const printRef = useRef();

  // ==================== FONCTIONS UTILITAIRES ====================
  
  const getTypeLabel = (type) => {
    const typeMap = {
      'PHARMACIE': 'Ordonnance Médicale',
      'BIOLOGIE': 'Demande d\'Examens Biologiques',
      'IMAGERIE': 'Demande d\'Imagerie Médicale',
      'HOSPITALISATION': 'Demande d\'Hospitalisation',
      'CONSULTATION': 'Demande de Consultation Spécialisée',
      'KINESITHERAPIE': 'Prescription de Kinésithérapie',
      'INFIRMIER': 'Prescription de Soins Infirmiers',
      'MEDICAMENT': 'Médicament',
      'EXAMEN': 'Examen',
      'ACTE': 'Acte Médical'
    };
    return typeMap[type] || 'Prescription Médicale';
  };

  const generatePrescriptionNumber = () => {
    const date = moment().format('YYMMDD');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const prefix = typePrestation.substring(0, 3);
    return `${prefix}-${date}-${random}`;
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    try {
      const birthDate = moment(dateOfBirth);
      const age = moment().diff(birthDate, 'years');
      return age;
    } catch (error) {
      return 'N/A';
    }
  };

  // ==================== CHARGEMENT DES DONNÉES ====================
  
  const loadCentres = useCallback(async () => {
    try {
      setLoadingCentres(true);
      
      const response = await centresAPI.getAll();
      
      if (response.success && Array.isArray(response.centres)) {
        const validCentres = response.centres.filter(centre => centre && (centre.id || centre.COD_CEN));
        
        const userStr = localStorage.getItem('user');
        let user = null;
        
        if (userStr) {
          try {
            user = JSON.parse(userStr);
          } catch (e) {
            console.error('Error parsing user:', e);
          }
        }
        
        const isSuperAdmin = user?.super_admin || user?.SUPER_ADMIN || user?.role === 'super_admin';
        const userCentreId = user?.COD_CEN || user?.centre_id || user?.prestataire?.centre_id;
        
        setCentres(validCentres);
        
        let selectedCentreId = null;
        let selectedCentreNom = '';
        
        if (validCentres.length > 0) {
          if (isSuperAdmin) {
            const firstCentre = validCentres[0];
            selectedCentreId = firstCentre.id || firstCentre.COD_CEN;
            selectedCentreNom = firstCentre.nom || firstCentre.LIB_CEN || firstCentre.NOM_CENTRE || `Centre ${selectedCentreId}`;
          } else if (userCentreId) {
            const userCentre = validCentres.find(centre => {
              const centreId = centre.id || centre.COD_CEN;
              return centreId?.toString() === userCentreId?.toString();
            });
            
            if (userCentre) {
              selectedCentreId = userCentre.id || userCentre.COD_CEN;
              selectedCentreNom = userCentre.nom || userCentre.LIB_CEN || userCentre.NOM_CENTRE || `Centre ${selectedCentreId}`;
            } else {
              message.warning('Votre centre attribué n\'a pas été trouvé');
            }
          }
        }
        
        if (selectedCentreId) {
          setCentreId(selectedCentreId.toString());
          localStorage.setItem('selectedCentre', selectedCentreId.toString());
          setCentreNom(selectedCentreNom);
        } else if (validCentres.length === 0) {
          message.warning('Aucun centre disponible');
        }
      } else {
        setCentres([]);
        if (response.message) {
          message.warning(response.message);
        }
      }
      
    } catch (error) {
      console.error('Error loading centres:', error);
      message.error('Erreur lors du chargement des centres de santé');
      setCentres([]);
    } finally {
      setLoadingCentres(false);
    }
  }, []);

  const loadPrestataires = useCallback(async () => {
    try {
      if (!centreId || centreId === 'null' || centreId === 'undefined') {
        return;
      }
      
      const userStr = localStorage.getItem('user');
      let user = null;
      
      if (userStr) {
        try {
          user = JSON.parse(userStr);
        } catch (e) {
          console.error('Error parsing user:', e);
        }
      }
      
      const userCentreId = user?.COD_CEN || user?.centre_id || user?.prestataire?.centre_id;
      const isSuperAdmin = user?.super_admin || user?.SUPER_ADMIN || user?.role === 'super_admin';
      
      if (!isSuperAdmin && userCentreId && userCentreId.toString() !== centreId.toString()) {
        message.error('Vous n\'avez pas accès à ce centre de santé');
        setPrestataires([]);
        return;
      }
      
      setLoadingPrestataires(true);
      
      const response = await centresAPI.getPrestatairesByCentre(centreId, {
        type_prestataire: 'MEDECIN',
        actif: '1',
        affectation_active: '1',
        limit: 100
      });
      
      if (response.success && Array.isArray(response.prestataires)) {
        const formattedPrestataires = response.prestataires.map(p => ({
          id: p.id || p.COD_PRE,
          COD_PRE: p.COD_PRE || p.id,
          NOM_PRESTATAIRE: p.NOM_PRESTATAIRE || p.nom || 'Nom non spécifié',
          PRENOM_PRESTATAIRE: p.PRENOM_PRESTATAIRE || p.prenom || '',
          SPECIALITE: p.SPECIALITE || p.specialite || '',
          TELEPHONE: p.TELEPHONE || p.telephone || '',
          EMAIL: p.EMAIL || p.email || '',
          nom_complet: `${p.PRENOM_PRESTATAIRE || ''} ${p.NOM_PRESTATAIRE || ''}`.trim(),
          specialite: p.SPECIALITE || p.specialite || '',
          telephone: p.TELEPHONE || p.telephone || ''
        }));
        
        setPrestataires(formattedPrestataires);
        
        if (formattedPrestataires.length > 0 && !selectedPrestataire) {
          const firstPrestataire = formattedPrestataires[0];
          setSelectedPrestataire(firstPrestataire);
          prescriptionForm.setFieldValue('COD_PRESCRIPTEUR', firstPrestataire.id);
          message.info(`Médecin par défaut: ${firstPrestataire.nom_complet}`);
        }
      } else {
        setPrestataires([]);
        if (response.success && response.message) {
          message.warning(response.message);
        }
      }
    } catch (error) {
      console.error('Error loading prestataires:', error);
      message.error('Erreur lors du chargement des médecins');
      setPrestataires([]);
    } finally {
      setLoadingPrestataires(false);
    }
  }, [centreId, selectedPrestataire, prescriptionForm]);

  const loadPrestations = useCallback(async (searchTerm = '') => {
    try {
      if (!typePrestation) return;
      
      setLoadingPrestations(true);
      
      const defaultPrestations = {
        'CONSULTATION': [
          { CODE_ACTE: 'CONS001', LIBELLE: 'Consultation générale', PRIX: 5000, UNITE: 'séance' },
          { CODE_ACTE: 'CONS002', LIBELLE: 'Consultation spécialisée', PRIX: 10000, UNITE: 'séance' },
          { CODE_ACTE: 'CONS003', LIBELLE: 'Consultation d\'urgence', PRIX: 15000, UNITE: 'séance' }
        ],
        'PHARMACIE': [
          { CODE_ACTE: 'MED001', LIBELLE: 'Paracétamol 500mg', PRIX: 500, UNITE: 'boîte' },
          { CODE_ACTE: 'MED002', LIBELLE: 'Amoxicilline 1g', PRIX: 1500, UNITE: 'boîte' },
          { CODE_ACTE: 'MED003', LIBELLE: 'Ibuprofène 400mg', PRIX: 800, UNITE: 'boîte' }
        ],
        'BIOLOGIE': [
          { CODE_ACTE: 'BIO001', LIBELLE: 'NFS Complète', PRIX: 8000, UNITE: 'examen' },
          { CODE_ACTE: 'BIO002', LIBELLE: 'Glycémie à jeun', PRIX: 2000, UNITE: 'examen' },
          { CODE_ACTE: 'BIO003', LIBELLE: 'Créatininémie', PRIX: 3000, UNITE: 'examen' }
        ],
        'IMAGERIE': [
          { CODE_ACTE: 'IMG001', LIBELLE: 'Radiographie thorax', PRIX: 15000, UNITE: 'examen' },
          { CODE_ACTE: 'IMG002', LIBELLE: 'Échographie abdominale', PRIX: 25000, UNITE: 'examen' },
          { CODE_ACTE: 'IMG003', LIBELLE: 'Scanner cérébral', PRIX: 50000, UNITE: 'examen' }
        ]
      };
      
      let prestationsData = [];
      
      if (typePrestation === 'PHARMACIE' || typePrestation === 'MEDICAMENT') {
        try {
          const response = await baremesAPI.getActesMedicaux(COD_PAY_DEFAULT, { 
            search: searchTerm, 
            limit: 50 
          });
          
          if (response.success && Array.isArray(response.actes)) {
            prestationsData = response.actes;
          } else {
            prestationsData = defaultPrestations['PHARMACIE'] || [];
          }
        } catch (error) {
          prestationsData = defaultPrestations['PHARMACIE'] || [];
        }
      } else {
        prestationsData = defaultPrestations[typePrestation] || defaultPrestations['CONSULTATION'];
      }
      
      const formattedPrestations = prestationsData.map((item, index) => ({
        key: `presta_${index}_${Date.now()}`,
        CODE_ACTE: item.CODE_ACTE || `CODE_${index}`,
        LIBELLE: item.LIBELLE || item.nom || `Prestation ${typePrestation} ${index + 1}`,
        PRIX: item.PRIX || item.tarif || item.MONTANT || 0,
        UNITE: item.UNITE || 'unité',
        CATEGORIE: item.CATEGORIE || typePrestation,
        REMBOURSABLE: item.REMBOURSABLE || 1,
        TYPE_ELEMENT: 'PRESTATION',
        DESCRIPTION: item.DESCRIPTION || item.OBSERVATIONS || ''
      }));
      
      setPrestationsList(formattedPrestations);
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const filtered = formattedPrestations.filter(presta =>
          (presta.LIBELLE || '').toLowerCase().includes(searchLower) ||
          (presta.CODE_ACTE || '').toLowerCase().includes(searchLower) ||
          (presta.DESCRIPTION || '').toLowerCase().includes(searchLower)
        );
        setSearchResults(filtered);
      } else {
        setSearchResults(formattedPrestations);
      }
    } catch (error) {
      console.error('Error loading prestations:', error);
      message.error(`Erreur lors du chargement des ${getTypeLabel(typePrestation)}`);
      setPrestationsList([]);
      setSearchResults([]);
    } finally {
      setLoadingPrestations(false);
    }
  }, [typePrestation]);

  const searchAffections = async (searchText) => {
    if (!searchText || searchText.trim().length < 2) {
      setAffectionOptions([]);
      return;
    }
    
    try {
      setSearchingAffections(true);
      
      const response = await affectionsAPI.search(searchText, 10);
      
      if (response.success && Array.isArray(response.affections)) {
        if (response.affections.length > 0) {
          const options = response.affections.map(aff => {
            const id = aff.id || aff.COD_AFF || aff.CODE_AFF || aff.cod_aff || 
                       `aff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const code = aff.id || aff.COD_AFF || aff.CODE_AFF || aff.cod_aff || id;
            const libelle = aff.libelle || aff.LIB_AFF || aff.LIBELLE_AFF || '';
            
            return {
              value: id,
              key: id,
              label: (
                <div>
                  <div><strong>{code}</strong> - {libelle}</div>
                  {aff.nom_type_affection && (
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      Type: {aff.nom_type_affection}
                    </div>
                  )}
                </div>
              ),
              code: code,
              libelle: libelle,
              data: aff
            };
          });
          
          setAffectionOptions(options);
        } else {
          setAffectionOptions([]);
          message.info('Aucune affection trouvée');
        }
      } else {
        setAffectionOptions([]);
        
        const testOptions = [
          {
            value: '113',
            key: '113',
            label: '113 - Gastrite',
            code: '113',
            libelle: 'Gastrite',
            data: { id: '113', libelle: 'Gastrite' }
          },
          {
            value: '114',
            key: '114',
            label: '114 - Gastro-entérite intestinale',
            code: '114',
            libelle: 'Gastro-entérite intestinale',
            data: { id: '114', libelle: 'Gastro-entérite intestinale' }
          }
        ];
        
        setAffectionOptions(testOptions);
      }
    } catch (error) {
      console.error('Error searching affections:', error);
      message.error('Erreur lors de la recherche des affections');
      setAffectionOptions([]);
    } finally {
      setSearchingAffections(false);
    }
  };

  const handleSelectAffection = (value, option) => {
    if (!option) return;
    
    const selectedAffection = option.data;
    const code = option.code || value;
    const libelle = option.libelle || '';
    
    if (code && libelle) {
      setAffectionCode(code);
      setAffectionLibelle(libelle);
      setAffectionDetails(selectedAffection);
      
      message.success(`Affection sélectionnée: ${libelle} (${code})`);
    } else {
      const parts = value?.split(' - ') || [];
      const fallbackCode = parts[0] || value || '';
      const fallbackLibelle = parts.slice(1).join(' - ') || '';
      
      setAffectionCode(fallbackCode);
      setAffectionLibelle(fallbackLibelle);
      
      message.info(`Affection sélectionnée: ${fallbackLibelle || fallbackCode}`);
    }
  };

  const searchPatient = async (cardNumber) => {
    if (!cardNumber || cardNumber.trim().length < 3) {
      message.warning('Veuillez entrer un numéro de carte valide (minimum 3 caractères)');
      return;
    }
    
    setLoading(prev => ({ ...prev, patient: true }));
    try {
      let response;
      
      if (beneficiairesAPI.searchAdvanced) {
        response = await beneficiairesAPI.searchAdvanced(cardNumber);
      } else {
        throw new Error('API bénéficiaires non disponible');
      }
      
      if (response.success && Array.isArray(response.beneficiaires) && response.beneficiaires.length > 0) {
        const patientData = response.beneficiaires[0];
        
        const formattedPatient = {
          id: patientData.ID_BEN || patientData.COD_BEN || patientData.id,
          COD_BEN: patientData.COD_BEN || patientData.ID_BEN || patientData.id,
          ID_BEN: patientData.COD_BEN || patientData.ID_BEN || patientData.id,
          nom: patientData.NOM_BEN || patientData.nom,
          prenom: patientData.PRE_BEN || patientData.prenom,
          nom_complet: `${patientData.PRE_BEN || patientData.prenom || ''} ${patientData.NOM_BEN || patientData.nom || ''}`.trim(),
          identifiant_national: patientData.IDENTIFIANT_NATIONAL,
          numero_carte: patientData.NUMERO_CARTE || cardNumber,
          date_naissance: patientData.NAI_BEN || patientData.date_naissance,
          age: patientData.AGE || calculateAge(patientData.NAI_BEN || patientData.date_naissance),
          sexe: patientData.SEX_BEN || patientData.sexe,
          telephone: patientData.TELEPHONE || patientData.telephone,
          groupe_sanguin: patientData.GROUPE_SANGUIN,
          rhesus: patientData.RHESUS,
          taux_couverture: patientData.TAUX_COUVERTURE || 80,
          statut: patientData.STATUT || 'Actif'
        };
        
        setPatient(formattedPatient);
        prescriptionForm.setFieldsValue({
          COD_BEN: formattedPatient.COD_BEN,
          NOM_BEN: formattedPatient.nom_complet
        });
        
        message.success(`Patient trouvé: ${formattedPatient.nom_complet}`);
      } else {
        message.warning('Aucun patient trouvé avec ce numéro de carte');
        setPatient(null);
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      message.error('Erreur lors de la recherche du patient: ' + error.message);
      setPatient(null);
    } finally {
      setLoading(prev => ({ ...prev, patient: false }));
    }
  };

  // ==================== GESTION DES PRESTATIONS ====================
  
  const handleSearchPrestations = (value) => {
    setSearchPrestation(value);
    
    if (!value || value.trim().length < 2) {
      setSearchResults(prestationsList);
      return;
    }
    
    const searchLower = value.toLowerCase();
    const filtered = prestationsList.filter(presta =>
      (presta.LIBELLE || '').toLowerCase().includes(searchLower) ||
      (presta.CODE_ACTE || '').toLowerCase().includes(searchLower) ||
      (presta.DESCRIPTION || '').toLowerCase().includes(searchLower)
    );
    
    setSearchResults(filtered);
  };

  const ajouterPrestation = (prestation) => {
    const nouvellePrestation = {
      ...prestation,
      key: `presta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      QUANTITE: 1,
      UNITE: 'unité',
      POSOLOGIE: (typePrestation === 'PHARMACIE' || typePrestation === 'MEDICAMENT') ? '1 comprimé matin et soir' : '',
      DUREE: (typePrestation === 'PHARMACIE' || typePrestation === 'MEDICAMENT') ? '7' : '1',
      PRIX_UNITAIRE: prestation.PRIX || 0,
      TYPE_ELEMENT: 'PRESTATION'
    };
    
    setSelectedPrestations(prev => [...prev, nouvellePrestation]);
    setSearchPrestation('');
    setSearchResults(prestationsList);
    message.success(`${prestation.LIBELLE} ajouté à la prescription`);
  };

  // ==================== GESTION DE LA SAISIE MANUELLE ====================
  
  const ouvrirSaisieManuelle = (type) => {
    setManualEntryType(type);
    manualForm.resetFields();
    
    const defaultValues = {
      quantite: 1,
      prix_unitaire: 0,
      duree: type === 'MEDICAMENT' ? '7' : '1'
    };
    
    if (type === 'MEDICAMENT') {
      defaultValues.posologie = '1 comprimé matin et soir';
    }
    
    manualForm.setFieldsValue(defaultValues);
    setManualEntryModal(true);
  };

  const ajouterManuellement = async () => {
    try {
      const values = await manualForm.validateFields();
      
      const nouvellePrestation = {
        key: `manuel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        CODE_ACTE: values.code_acte || `MANUEL_${Date.now()}`,
        LIBELLE: values.libelle,
        QUANTITE: values.quantite || 1,
        UNITE: 'unité',
        POSOLOGIE: manualEntryType === 'MEDICAMENT' ? values.posologie : '',
        DUREE: manualEntryType === 'MEDICAMENT' ? values.duree : '1',
        PRIX_UNITAIRE: values.prix_unitaire || 0,
        TYPE_ELEMENT: 'MANUEL',
        CATEGORIE: manualEntryType,
        REMBOURSABLE: 1,
        DESCRIPTION: values.description || ''
      };
      
      setSelectedPrestations(prev => [...prev, nouvellePrestation]);
      setManualEntryModal(false);
      message.success('Élément ajouté manuellement avec succès');
    } catch (error) {
      console.error('Error validating manual entry:', error);
    }
  };

  // ==================== GESTION DES PRESCRIPTIONS ====================
  
  const calculerTotal = () => {
    return selectedPrestations.reduce((total, presta) => {
      const prix = parseFloat(presta.PRIX_UNITAIRE) || 0;
      const quantite = parseInt(presta.QUANTITE) || 1;
      return total + (prix * quantite);
    }, 0);
  };

  const updatePrestation = (key, field, value) => {
    setSelectedPrestations(prev => 
      prev.map(presta => presta.key === key ? { ...presta, [field]: value } : presta)
    );
  };

  const supprimerPrestation = (key) => {
    setSelectedPrestations(prev => prev.filter(presta => presta.key !== key));
  };

  const validerPrescription = async () => {
    try {
      if (!patient) {
        message.error('Veuillez d\'abord rechercher un patient');
        return;
      }
      
      if (!patient.id && !patient.COD_BEN) {
        message.error('ID du patient manquant');
        return;
      }
      
      if (!selectedPrestataire) {
        message.error('Veuillez sélectionner un médecin prescripteur');
        return;
      }
      
      if (!selectedPrestataire.id) {
        message.error('ID du médecin prescripteur manquant');
        return;
      }
      
      if (selectedPrestations.length === 0) {
        message.error('Veuillez ajouter au moins une prestation');
        return;
      }
      
      if (!affectionCode) {
        message.error('Veuillez sélectionner une affection');
        return;
      }
      
      if (!centreId) {
        message.error('Veuillez sélectionner un centre de santé');
        return;
      }
      
      setValidationModalVisible(true);
      
    } catch (error) {
      console.error('Validation error:', error);
      message.error('Erreur lors de la validation de la prescription');
    }
  };

  const confirmerPrescription = async () => {
    setLoading(prev => ({ ...prev, prescrire: true }));
    
    try {
      const prescriptionNum = generatePrescriptionNumber();
      const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
      
      const prescriptionData = {
        COD_BEN: patient.COD_BEN || patient.ID_BEN || patient.id,
        COD_PRE: selectedPrestataire.COD_PRE || selectedPrestataire.id,
        COD_CEN: centreId,
        TYPE_PRESTATION: typePrestation,
        COD_AFF: affectionCode || null,
        OBSERVATIONS: `Affection: ${affectionLibelle || 'Non spécifiée'}`,
        ORIGINE: 'Electronique',
        DATE_VALIDITE: moment().add(30, 'days').format('YYYY-MM-DD'),
        MONTANT_TOTAL: calculerTotal(),
        
        details: selectedPrestations.map((presta, index) => ({
          ORDRE: index + 1,
          TYPE_ELEMENT: presta.TYPE_ELEMENT || 'PRESTATION',
          COD_ELEMENT: presta.CODE_ACTE,
          LIBELLE: presta.LIBELLE,
          QUANTITE: presta.QUANTITE,
          UNITE: presta.UNITE || 'unité',
          POSOLOGIE: presta.POSOLOGIE || '',
          DUREE_TRAITEMENT: presta.DUREE,
          PRIX_UNITAIRE: presta.PRIX_UNITAIRE || 0,
          REMBOURSABLE: presta.REMBOURSABLE || 1,
          TAUX_PRISE_EN_CHARGE: null,
          DESCRIPTION: presta.DESCRIPTION || ''
        }))
      };
      
      const requiredFields = ['COD_BEN', 'TYPE_PRESTATION'];
      const missingFields = requiredFields.filter(field => !prescriptionData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Champs obligatoires manquants: ${missingFields.join(', ')}`);
      }
      
      if (prescriptionData.details && prescriptionData.details.length > 0) {
        for (let i = 0; i < prescriptionData.details.length; i++) {
          const detail = prescriptionData.details[i];
          if (!detail.COD_ELEMENT || typeof detail.COD_ELEMENT !== 'string') {
            throw new Error(`Le détail à la position ${i + 1} a un COD_ELEMENT invalide: ${detail.COD_ELEMENT}`);
          }
        }
      }
      
      const response = await prescriptionsAPI.create(prescriptionData);
      
      if (response.success) {
        const ordonnanceData = {
          numero: prescriptionNum,
          COD_PRES: response.data?.COD_PRES || prescriptionNum,
          patient,
          selectedPrestataire,
          selectedPrestations,
          centreId,
          centreNom,
          typePrestation,
          affectionCode,
          affectionLibelle,
          urgent: false,
          dateValidite: moment().add(30, 'days').format('DD/MM/YYYY'),
          statut: 'EN_COURS',
          nombrePrestations: selectedPrestations.length,
          total: calculerTotal(),
          dateCreation: moment().format('DD/MM/YYYY HH:mm'),
          datePrescription: moment().format('DD/MM/YYYY')
        };
        
        setOrdonnanceToPrint(ordonnanceData);
        resetPrescriptionForm();
        setPrintModalVisible(true);
        
        loadExecutions();
        loadHistorique();
        
        message.success(`Prescription créée avec succès! Numéro: ${response.data?.NUM_PRESCRIPTION || prescriptionNum}`);
      } else {
        let errorMessage = response.message || 'Erreur lors de la création de la prescription';
        if (response.message?.includes('COD_BEN')) {
          errorMessage = 'Erreur: Le code patient (COD_BEN) est invalide ou manquant';
        } else if (response.message?.includes('TYPE_PRESTATION')) {
          errorMessage = 'Erreur: Le type de prestation est obligatoire';
        }
        message.error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      message.error('Erreur lors de la création de la prescription: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, prescrire: false }));
      setValidationModalVisible(false);
    }
  };

  const resetPrescriptionForm = () => {
    setPatient(null);
    setSelectedPrestations([]);
    setAffectionCode('');
    setAffectionLibelle('');
    setAffectionDetails(null);
    setAffectionOptions([]);
    setSearchPrestation('');
    setSearchResults(prestationsList);
    prescriptionForm.resetFields();
  };

  // ==================== ONGLET EXÉCUTION ====================
  
  const loadExecutions = async () => {
    try {
      setLoadingExecutions(true);
      
      const mockExecutions = [
        {
          id: 'EXEC001',
          numero: 'PHAR-250112-0001',
          patient: 'Moussa Diop',
          date: '25/01/2024 09:30',
          type: 'PHARMACIE',
          statut: 'EN_COURS',
          priorite: 'Haute',
          total: 15000,
          elements: 3,
          medecin: 'Dr. Amadou Ndiaye',
          centre: 'Centre de Santé Principal'
        },
        {
          id: 'EXEC002',
          numero: 'BIO-250112-0002',
          patient: 'Fatou Sow',
          date: '25/01/2024 10:15',
          type: 'BIOLOGIE',
          statut: 'EN_COURS',
          priorite: 'Normale',
          total: 25000,
          elements: 2,
          medecin: 'Dr. Marie Fall',
          centre: 'Centre de Santé Principal'
        },
        {
          id: 'EXEC003',
          numero: 'CONS-250112-0003',
          patient: 'Omar Gueye',
          date: '25/01/2024 11:00',
          type: 'CONSULTATION',
          statut: 'EN_ATTENTE',
          priorite: 'Basse',
          total: 5000,
          elements: 1,
          medecin: 'Dr. Jean Diallo',
          centre: 'Centre de Santé Principal'
        }
      ];
      
      let filteredExecutions = mockExecutions.filter(exec => {
        if (filtersExecutions.statut !== 'ALL' && exec.statut !== filtersExecutions.statut) {
          return false;
        }
        if (filtersExecutions.search) {
          const searchLower = filtersExecutions.search.toLowerCase();
          return (
            exec.numero.toLowerCase().includes(searchLower) ||
            exec.patient.toLowerCase().includes(searchLower) ||
            exec.medecin.toLowerCase().includes(searchLower)
          );
        }
        return true;
      });
      
      setExecutions(filteredExecutions);
    } catch (error) {
      console.error('Error loading executions:', error);
      message.error('Erreur lors du chargement des prescriptions à exécuter');
      setExecutions([]);
    } finally {
      setLoadingExecutions(false);
    }
  };

  const marquerCommeExecutée = async (id) => {
    try {
      setExecutingPrescription(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setExecutions(prev => prev.filter(exec => exec.id !== id));
      message.success('Prescription marquée comme exécutée avec succès');
      
      const executed = executions.find(exec => exec.id === id);
      if (executed) {
        setHistorique(prev => [{
          ...executed,
          statut: 'EXECUTEE',
          dateExecution: moment().format('DD/MM/YYYY HH:mm'),
          executant: JSON.parse(localStorage.getItem('user') || '{}').nom || 'Utilisateur'
        }, ...prev]);
      }
    } catch (error) {
      console.error('Error executing prescription:', error);
      message.error('Erreur lors de l\'exécution de la prescription');
    } finally {
      setExecutingPrescription(false);
    }
  };

  const ouvrirDetailExecution = (execution) => {
    setSelectedExecution(execution);
    setExecutionDetailModal(true);
  };

  // ==================== ONGLET HISTORIQUE ====================
  
  const loadHistorique = async () => {
    try {
      setLoadingHistorique(true);
      
      const mockHistorique = [
        {
          id: 'HIST001',
          numero: 'PHAR-240112-0001',
          patient: 'Aminata Diop',
          date: '24/01/2024 14:30',
          dateExecution: '24/01/2024 15:45',
          type: 'PHARMACIE',
          statut: 'EXECUTEE',
          total: 12000,
          elements: 2,
          medecin: 'Dr. Amadou Ndiaye',
          executant: 'Pharmacien Principal',
          centre: 'Centre de Santé Principal'
        },
        {
          id: 'HIST002',
          numero: 'BIO-240112-0002',
          patient: 'Mamadou Kane',
          date: '24/01/2024 10:15',
          dateExecution: '24/01/2024 11:30',
          type: 'BIOLOGIE',
          statut: 'EXECUTEE',
          total: 18000,
          elements: 3,
          medecin: 'Dr. Marie Fall',
          executant: 'Laborantin',
          centre: 'Centre de Santé Principal'
        },
        {
          id: 'HIST003',
          numero: 'CONS-230112-0003',
          patient: 'Khadija Mbaye',
          date: '23/01/2024 09:00',
          dateExecution: '23/01/2024 09:45',
          type: 'CONSULTATION',
          statut: 'EXECUTEE',
          total: 5000,
          elements: 1,
          medecin: 'Dr. Jean Diallo',
          executant: 'Secrétaire Médicale',
          centre: 'Centre de Santé Principal'
        }
      ];
      
      let filteredHistorique = mockHistorique.filter(hist => {
        if (filtersHistorique.type !== 'ALL' && hist.type !== filtersHistorique.type) {
          return false;
        }
        if (filtersHistorique.search) {
          const searchLower = filtersHistorique.search.toLowerCase();
          return (
            hist.numero.toLowerCase().includes(searchLower) ||
            hist.patient.toLowerCase().includes(searchLower) ||
            hist.medecin.toLowerCase().includes(searchLower)
          );
        }
        return true;
      });
      
      setHistorique(filteredHistorique);
    } catch (error) {
      console.error('Error loading history:', error);
      message.error('Erreur lors du chargement de l\'historique');
      setHistorique([]);
    } finally {
      setLoadingHistorique(false);
    }
  };

  const ouvrirDetailHistorique = (historiqueItem) => {
    setSelectedHistorique(historiqueItem);
    setHistoriqueDetailModal(true);
  };

  // ==================== IMPRESSION ====================
  
  const imprimerOrdonnance = async () => {
    try {
      setPrintingOrdonnance(true);
      
      if (!ordonnanceToPrint) {
        message.error('Aucune ordonnance à imprimer');
        return;
      }
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ordonnance ${ordonnanceToPrint.numero}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 20mm;
              }
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
                margin-bottom: 20px;
              }
              .header h1 {
                font-size: 20px;
                margin: 0;
                color: #333;
              }
              .header h2 {
                font-size: 16px;
                margin: 5px 0;
                color: #666;
              }
              .section {
                margin-bottom: 15px;
              }
              .section-title {
                font-weight: bold;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
                margin-bottom: 10px;
                font-size: 14px;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 10px;
              }
              .info-item {
                font-size: 12px;
              }
              .info-label {
                font-weight: bold;
                display: inline-block;
                width: 120px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
                font-size: 11px;
              }
              table th, table td {
                border: 1px solid #ddd;
                padding: 5px;
                text-align: left;
              }
              table th {
                background-color: #f5f5f5;
                font-weight: bold;
              }
              .total {
                text-align: right;
                font-weight: bold;
                font-size: 12px;
                margin-top: 10px;
              }
              .footer {
                margin-top: 30px;
                padding-top: 10px;
                border-top: 1px solid #000;
                font-size: 10px;
                color: #666;
                text-align: center;
              }
              .signature {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
              }
              .signature-box {
                text-align: center;
                width: 200px;
                border-top: 1px solid #000;
                padding-top: 10px;
                font-size: 11px;
              }
              .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 80px;
                color: rgba(0,0,0,0.1);
                z-index: -1;
                white-space: nowrap;
              }
            }
            body {
              font-family: Arial, sans-serif;
              max-width: 210mm;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .header h1 {
              font-size: 20px;
              margin: 0;
              color: #333;
            }
            .header h2 {
              font-size: 16px;
              margin: 5px 0;
              color: #666;
            }
            .section {
              margin-bottom: 15px;
            }
            .section-title {
              font-weight: bold;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 10px;
            }
            .info-item {
              font-size: 12px;
            }
            .info-label {
              font-weight: bold;
              display: inline-block;
              width: 120px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
              font-size: 11px;
            }
            table th, table td {
              border: 1px solid #ddd;
              padding: 5px;
              text-align: left;
            }
            table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .total {
              text-align: right;
              font-weight: bold;
              font-size: 12px;
              margin-top: 10px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 10px;
              border-top: 1px solid #000;
              font-size: 10px;
              color: #666;
              text-align: center;
            }
            .signature {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              text-align: center;
              width: 200px;
              border-top: 1px solid #000;
              padding-top: 10px;
              font-size: 11px;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 80px;
              color: rgba(0,0,0,0.1);
              z-index: -1;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
          <div class="watermark">${getTypeLabel(ordonnanceToPrint.typePrestation).toUpperCase()}</div>
          
          <div class="header">
            <h1>FEUILLE DE PRISE EN CHARGE</h1>
            <h2>${getTypeLabel(ordonnanceToPrint.typePrestation)}</h2>
            <div style="font-size: 12px; margin-top: 5px;">
              N°: <strong>${ordonnanceToPrint.numero}</strong> | 
              Date: ${ordonnanceToPrint.datePrescription}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">INFORMATIONS DU PATIENT</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Nom & Prénom:</span>
                ${ordonnanceToPrint.patient?.nom_complet || 'Non spécifié'}
              </div>
              <div class="info-item">
                <span class="info-label">N° Carte:</span>
                ${ordonnanceToPrint.patient?.numero_carte || 'Non spécifié'}
              </div>
              <div class="info-item">
                <span class="info-label">Âge/Sexe:</span>
                ${ordonnanceToPrint.patient?.age || 'N/A'} ans / ${ordonnanceToPrint.patient?.sexe || 'Non spécifié'}
              </div>
              <div class="info-item">
                <span class="info-label">Téléphone:</span>
                ${ordonnanceToPrint.patient?.telephone || 'Non renseigné'}
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">INFORMATIONS MÉDICALES</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Médecin:</span>
                ${ordonnanceToPrint.selectedPrestataire?.nom_complet || 'Non spécifié'}
              </div>
              <div class="info-item">
                <span class="info-label">Spécialité:</span>
                ${ordonnanceToPrint.selectedPrestataire?.specialite || 'Médecin Généraliste'}
              </div>
              <div class="info-item">
                <span class="info-label">Affection:</span>
                ${ordonnanceToPrint.affectionCode || ''} - ${ordonnanceToPrint.affectionLibelle || 'Non spécifiée'}
              </div>
              <div class="info-item">
                <span class="info-label">Centre:</span>
                ${ordonnanceToPrint.centreNom || 'Non spécifié'}
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">DÉTAIL DE LA PRESCRIPTION</div>
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Code</th>
                  <th>Désignation</th>
                  <th>Qté</th>
                  ${ordonnanceToPrint.typePrestation === 'PHARMACIE' || ordonnanceToPrint.typePrestation === 'MEDICAMENT' ? '<th>Posologie</th><th>Durée</th>' : ''}
                  <th>Prix Unit.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${ordonnanceToPrint.selectedPrestations.map((presta, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${presta.CODE_ACTE || ''}</td>
                    <td>${presta.LIBELLE || ''}</td>
                    <td>${presta.QUANTITE || 1}</td>
                    ${ordonnanceToPrint.typePrestation === 'PHARMACIE' || ordonnanceToPrint.typePrestation === 'MEDICAMENT' ? `
                      <td>${presta.POSOLOGIE || ''}</td>
                      <td>${presta.DUREE || ''} jours</td>
                    ` : ''}
                    <td>${parseFloat(presta.PRIX_UNITAIRE || 0).toLocaleString('fr-FR')} FCFA</td>
                    <td>${(parseFloat(presta.PRIX_UNITAIRE || 0) * parseInt(presta.QUANTITE || 1)).toLocaleString('fr-FR')} FCFA</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">
              TOTAL: <strong>${ordonnanceToPrint.total?.toLocaleString('fr-FR') || '0'} FCFA</strong>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">OBSERVATIONS</div>
            <div style="font-size: 11px; padding: 10px; border: 1px dashed #ddd; min-height: 50px;">
              ${ordonnanceToPrint.affectionLibelle ? `Affection diagnostiquée: ${ordonnanceToPrint.affectionLibelle}` : ''}
              <br>
              Date de validité: ${ordonnanceToPrint.dateValidite}
            </div>
          </div>
          
          <div class="signature">
            <div class="signature-box">
              Le Médecin Prescripteur<br><br><br>
              <strong>${ordonnanceToPrint.selectedPrestataire?.nom_complet || ''}</strong><br>
              ${ordonnanceToPrint.selectedPrestataire?.specialite || 'Médecin Généraliste'}
            </div>
            <div class="signature-box">
              Cachet et Signature du Centre<br><br><br>
              <strong>${ordonnanceToPrint.centreNom || ''}</strong><br>
              ${ordonnanceToPrint.dateCreation || ''}
            </div>
          </div>
          
          <div class="footer">
            Document généré électroniquement le ${moment().format('DD/MM/YYYY à HH:mm')} - 
            Ce document a valeur légale - Conserver précieusement
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            };
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      message.success('Impression lancée avec succès');
    } catch (error) {
      console.error('Error printing:', error);
      message.error('Erreur lors de l\'impression: ' + error.message);
    } finally {
      setPrintingOrdonnance(false);
    }
  };

  // ==================== EFFETS ====================
  
  useEffect(() => {
    loadCentres();
  }, []);

  useEffect(() => {
    if (centreId) {
      loadPrestataires();
    }
  }, [centreId, loadPrestataires]);

  useEffect(() => {
    if (typePrestation) {
      loadPrestations();
    }
  }, [typePrestation, loadPrestations]);

  useEffect(() => {
    if (activeTab === 'execution') {
      loadExecutions();
    }
  }, [activeTab, filtersExecutions]);

  useEffect(() => {
    if (activeTab === 'historique') {
      loadHistorique();
    }
  }, [activeTab, filtersHistorique]);

  // Mettre à jour le nom du centre quand centreId change
  useEffect(() => {
    if (centreId && centres.length > 0) {
      const centre = centres.find(c => 
        (c.id && c.id.toString() === centreId.toString()) || 
        (c.COD_CEN && c.COD_CEN.toString() === centreId.toString())
      );
      if (centre) {
        setCentreNom(centre.nom || centre.LIB_CEN || centre.NOM_CENTRE || `Centre ${centreId}`);
      }
    }
  }, [centreId, centres]);

  // ==================== COLONNES DES TABLES ====================
  
  const prestationsColumns = [
    {
      title: 'Code',
      dataIndex: 'CODE_ACTE',
      key: 'CODE_ACTE',
      width: 100,
      render: (code) => <Tag color="blue">{code}</Tag>
    },
    {
      title: 'Désignation',
      dataIndex: 'LIBELLE',
      key: 'LIBELLE',
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          {record.DESCRIPTION && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              {record.DESCRIPTION.substring(0, 50)}...
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Prix (FCFA)',
      dataIndex: 'PRIX',
      key: 'PRIX',
      width: 100,
      render: (prix) => (
        <span style={{ fontWeight: 'bold' }}>
          {parseFloat(prix || 0).toLocaleString('fr-FR')}
        </span>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 90,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => ajouterPrestation(record)}
          disabled={selectedPrestations.some(p => p.CODE_ACTE === record.CODE_ACTE)}
        >
          Ajouter
        </Button>
      )
    }
  ];

  const prescriptionPrestationsColumns = [
    {
      title: 'Type',
      dataIndex: 'TYPE_ELEMENT',
      key: 'TYPE_ELEMENT',
      width: 80,
      render: (type) => (
        <Tag color={type === 'MANUEL' ? 'orange' : 'blue'}>
          {type === 'MANUEL' ? 'Manuel' : 'Nomenclature'}
        </Tag>
      )
    },
    {
      title: 'Code',
      dataIndex: 'CODE_ACTE',
      key: 'CODE_ACTE',
      width: 100,
      render: (code) => <Tag color="blue">{code}</Tag>
    },
    {
      title: 'Désignation',
      dataIndex: 'LIBELLE',
      key: 'LIBELLE',
      width: 200,
      ellipsis: true
    },
    {
      title: 'Qté',
      dataIndex: 'QUANTITE',
      key: 'QUANTITE',
      width: 70,
      render: (text, record) => (
        <InputNumber
          min={1}
          max={999}
          value={text}
          onChange={(value) => updatePrestation(record.key, 'QUANTITE', value)}
          style={{ width: '70px' }}
          size="small"
        />
      )
    },
    ...((typePrestation === 'PHARMACIE' || typePrestation === 'MEDICAMENT') ? [{
      title: 'Posologie',
      dataIndex: 'POSOLOGIE',
      key: 'POSOLOGIE',
      width: 150,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updatePrestation(record.key, 'POSOLOGIE', e.target.value)}
          placeholder="Posologie"
          size="small"
        />
      )
    }] : []),
    ...((typePrestation === 'PHARMACIE' || typePrestation === 'MEDICAMENT') ? [{
      title: 'Durée (j)',
      dataIndex: 'DUREE',
      key: 'DUREE',
      width: 80,
      render: (text, record) => (
        <InputNumber
          min={1}
          max={365}
          value={text}
          onChange={(value) => updatePrestation(record.key, 'DUREE', value)}
          style={{ width: '70px' }}
          size="small"
        />
      )
    }] : []),
    {
      title: 'Prix unit.',
      dataIndex: 'PRIX_UNITAIRE',
      key: 'PRIX_UNITAIRE',
      width: 100,
      render: (prix, record) => (
        <InputNumber
          value={parseFloat(prix || 0)}
          onChange={(value) => updatePrestation(record.key, 'PRIX_UNITAIRE', value)}
          placeholder="0"
          size="small"
          style={{ width: '100%' }}
          min={0}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
        />
      )
    },
    {
      title: 'Total',
      key: 'total',
      width: 100,
      render: (_, record) => {
        const prix = parseFloat(record.PRIX_UNITAIRE) || 0;
        const quantite = parseInt(record.QUANTITE) || 1;
        const total = prix * quantite;
        return (
          <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
            {total.toLocaleString('fr-FR')} FCFA
          </span>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => supprimerPrestation(record.key)}
          size="small"
        />
      )
    }
  ];

  const prestatairesColumns = [
    {
      title: 'Médecin',
      dataIndex: 'nom_complet',
      key: 'nom_complet',
      render: (text, record) => (
        <div>
          <div><strong>{text}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.specialite || 'Généraliste'}
          </div>
        </div>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div>{record.telephone || 'Non renseigné'}</div>
          {record.email && (
            <div style={{ fontSize: '11px', color: '#666' }}>{record.email}</div>
          )}
        </div>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type={selectedPrestataire?.id === record.id ? 'default' : 'primary'}
          size="small"
          onClick={() => {
            setSelectedPrestataire(record);
            prescriptionForm.setFieldValue('COD_PRESCRIPTEUR', record.id);
            setModalPrestataires(false);
            message.success(`Médecin sélectionné: ${record.nom_complet}`);
          }}
        >
          {selectedPrestataire?.id === record.id ? 'Sélectionné' : 'Sélectionner'}
        </Button>
      )
    }
  ];

  const executionsColumns = [
    {
      title: 'N° Prescription',
      dataIndex: 'numero',
      key: 'numero',
      width: 150,
      render: (text) => (
        <Tag color="blue" style={{ cursor: 'pointer' }}>
          <FileTextOutlined /> {text}
        </Tag>
      )
    },
    {
      title: 'Patient',
      dataIndex: 'patient',
      key: 'patient',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (text) => (
        <div>
          <CalendarOutlined style={{ marginRight: 5 }} />
          {text}
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => (
        <Tag color={
          type === 'PHARMACIE' ? 'green' : 
          type === 'BIOLOGIE' ? 'purple' : 
          type === 'CONSULTATION' ? 'blue' : 'orange'
        }>
          {getTypeLabel(type)}
        </Tag>
      )
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 120,
      render: (statut) => {
        const statusConfig = {
          'EN_COURS': { color: 'processing', text: 'En cours', icon: <SyncOutlined spin /> },
          'EN_ATTENTE': { color: 'warning', text: 'En attente', icon: <ClockCircleOutlined /> },
          'EXECUTEE': { color: 'success', text: 'Exécutée', icon: <CheckCircleOutlined /> }
        };
        const config = statusConfig[statut] || { color: 'default', text: statut };
        return (
          <Badge
            status={config.color}
            text={
              <span>
                {config.icon && React.cloneElement(config.icon, { style: { marginRight: 5 } })}
                {config.text}
              </span>
            }
          />
        );
      }
    },
    {
      title: 'Priorité',
      dataIndex: 'priorite',
      key: 'priorite',
      width: 100,
      render: (priorite) => {
        const priorityConfig = {
          'Haute': { color: 'red', text: 'Haute' },
          'Normale': { color: 'blue', text: 'Normale' },
          'Basse': { color: 'green', text: 'Basse' }
        };
        const config = priorityConfig[priorite] || { color: 'default', text: priorite };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      render: (total) => (
        <span style={{ fontWeight: 'bold' }}>
          {parseFloat(total || 0).toLocaleString('fr-FR')} FCFA
        </span>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir détails">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => ouvrirDetailExecution(record)}
              size="small"
            />
          </Tooltip>
          {record.statut !== 'EXECUTEE' && (
            <Tooltip title="Marquer comme exécutée">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => marquerCommeExecutée(record.id)}
                loading={executingPrescription}
                size="small"
              >
                Exécuter
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  const historiqueColumns = [
    {
      title: 'N° Prescription',
      dataIndex: 'numero',
      key: 'numero',
      width: 150,
      render: (text) => (
        <Tag color="blue" style={{ cursor: 'pointer' }}>
          <FileTextOutlined /> {text}
        </Tag>
      )
    },
    {
      title: 'Patient',
      dataIndex: 'patient',
      key: 'patient',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Date Prescription',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (text) => (
        <div>
          <CalendarOutlined style={{ marginRight: 5 }} />
          {text}
        </div>
      )
    },
    {
      title: 'Date Exécution',
      dataIndex: 'dateExecution',
      key: 'dateExecution',
      width: 120,
      render: (text) => (
        <div style={{ color: '#52c41a' }}>
          <CheckCircleOutlined style={{ marginRight: 5 }} />
          {text}
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => (
        <Tag color={
          type === 'PHARMACIE' ? 'green' : 
          type === 'BIOLOGIE' ? 'purple' : 
          type === 'CONSULTATION' ? 'blue' : 'orange'
        }>
          {getTypeLabel(type)}
        </Tag>
      )
    },
    {
      title: 'Médecin',
      dataIndex: 'medecin',
      key: 'medecin',
      render: (text) => (
        <div style={{ fontSize: '12px' }}>
          <TeamOutlined style={{ marginRight: 5 }} />
          {text}
        </div>
      )
    },
    {
      title: 'Exécutant',
      dataIndex: 'executant',
      key: 'executant',
      render: (text) => (
        <div style={{ fontSize: '12px', color: '#666' }}>
          <UserOutlined style={{ marginRight: 5 }} />
          {text}
        </div>
      )
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      render: (total) => (
        <span style={{ fontWeight: 'bold' }}>
          {parseFloat(total || 0).toLocaleString('fr-FR')} FCFA
        </span>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir détails">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => ouvrirDetailHistorique(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Imprimer">
            <Button
              type="default"
              icon={<PrinterOutlined />}
              onClick={() => {
                const mockOrdonnance = {
                  ...record,
                  selectedPrestations: [
                    { CODE_ACTE: 'MED001', LIBELLE: 'Paracétamol 500mg', QUANTITE: 2, PRIX_UNITAIRE: 500 },
                    { CODE_ACTE: 'MED002', LIBELLE: 'Amoxicilline 1g', QUANTITE: 1, PRIX_UNITAIRE: 1500 }
                  ],
                  patient: { nom_complet: record.patient, numero_carte: '123456', age: 35, sexe: 'M' },
                  selectedPrestataire: { nom_complet: record.medecin, specialite: 'Médecin Généraliste' },
                  centreNom: record.centre,
                  typePrestation: record.type,
                  affectionCode: '113',
                  affectionLibelle: 'Gastrite',
                  dateValidite: moment().add(30, 'days').format('DD/MM/YYYY'),
                  total: record.total
                };
                setOrdonnanceToPrint(mockOrdonnance);
                setPrintModalVisible(true);
              }}
              size="small"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // ==================== RENDU PRINCIPAL ====================
  
  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MedicineBoxOutlined style={{ marginRight: 8, fontSize: '20px', color: '#1890ff' }} />
            <span>Gestion des Prescriptions Médicales</span>
            {centreNom && (
              <Tag color="blue" style={{ marginLeft: 16 }}>
                <DatabaseOutlined /> {centreNom}
              </Tag>
            )}
            <Tag color="green" style={{ marginLeft: 8 }}>
              <InfoCircleFilled /> COD_PAY: {COD_PAY_DEFAULT}
            </Tag>
          </div>
        }
        extra={
          <Space>
            {user?.super_admin || user?.SUPER_ADMIN || user?.role === 'super_admin' ? (
              <Select
                value={centreId}
                onChange={(value) => {
                  if (value) {
                    setCentreId(value.toString());
                    localStorage.setItem('selectedCentre', value.toString());
                    
                    const selectedCentre = centres.find(c => 
                      (c.id && c.id.toString() === value.toString()) || 
                      (c.COD_CEN && c.COD_CEN.toString() === value.toString())
                    );
                    if (selectedCentre) {
                      setCentreNom(selectedCentre.nom || selectedCentre.LIB_CEN || selectedCentre.NOM_CENTRE || `Centre ${value}`);
                    }
                  }
                }}
                style={{ width: 250 }}
                placeholder="Sélectionner un centre"
                loading={loadingCentres}
                disabled={loadingCentres || centres.length === 0}
              >
                {centres.map(centre => {
                  const centreValue = centre.id || centre.COD_CEN;
                  if (!centreValue) return null;
                  return (
                    <Option key={centreValue} value={centreValue.toString()}>
                      {centre.nom || centre.LIB_CEN || centre.NOM_CENTRE || `Centre ${centreValue}`}
                      {centre.TYP_CEN && ` (${centre.TYP_CEN})`}
                    </Option>
                  );
                })}
              </Select>
            ) : (
              <Tag color="blue" style={{ 
                marginRight: 16, 
                fontSize: '14px', 
                padding: '5px 10px',
                border: '1px solid #1890ff'
              }}>
                <DatabaseOutlined /> Centre: {centreNom || 'Non affecté'}
              </Tag>
            )}
            
            <Button
              type={selectedPrestataire ? 'default' : 'primary'}
              icon={<TeamOutlined />}
              onClick={() => setModalPrestataires(true)}
              loading={loadingPrestataires}
              disabled={!centreId}
            >
              {selectedPrestataire ? 
                `Dr. ${selectedPrestataire.nom_complet.split(' ')[0]}` : 
                'Choisir médecin'}
            </Button>
          </Space>
        }
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          animated
        >
          {/* TAB 1: SAISIE DE PRESCRIPTION */}
          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                Saisie de Prescription
              </span>
            } 
            key="saisie"
          >
            <Form
              form={prescriptionForm}
              layout="vertical"
              onFinish={validerPrescription}
            >
              {/* SECTION PATIENT */}
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <UserOutlined style={{ marginRight: 8 }} />
                    <span>Étape 1: Identification du Patient</span>
                  </div>
                }
                style={{ marginBottom: 16 }}
                size="small"
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Numéro de carte du patient"
                      required
                      rules={[{ required: true, message: 'Veuillez entrer un numéro de carte' }]}
                    >
                      <Input.Search
                        placeholder="Entrez le numéro de la carte d'assurance"
                        enterButton={<SearchOutlined />}
                        size="large"
                        onSearch={searchPatient}
                        loading={loading.patient}
                        allowClear
                        disabled={!centreId}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Type de prestation"
                      required
                      initialValue="PHARMACIE"
                    >
                      <Select
                        value={typePrestation}
                        onChange={(value) => {
                          setTypePrestation(value);
                          setSelectedPrestations([]);
                          setSearchPrestation('');
                        }}
                        size="large"
                        disabled={!centreId}
                      >
                        <Option value="PHARMACIE">Pharmacie</Option>
                        <Option value="MEDICAMENT">Médicament</Option>
                        <Option value="EXAMEN">Examen</Option>
                        <Option value="BIOLOGIE">Biologie</Option>
                        <Option value="IMAGERIE">Imagerie Médicale</Option>
                        <Option value="HOSPITALISATION">Hospitalisation</Option>
                        <Option value="CONSULTATION">Consultation Spécialisée</Option>
                        <Option value="KINESITHERAPIE">Kinésithérapie</Option>
                        <Option value="INFIRMIER">Soins infirmiers</Option>
                        <Option value="ACTE">Acte Médical</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {patient && (
                  <Alert
                    message="Informations du Patient"
                    description={
                      <Descriptions size="small" column={3}>
                        <Descriptions.Item label="Nom">
                          <strong>{patient.nom_complet}</strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="Identifiant">
                          {patient.identifiant_national || patient.numero_carte}
                        </Descriptions.Item>
                        <Descriptions.Item label="Âge/Sexe">
                          {patient.age} ans / {patient.sexe || 'Non spécifié'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Groupe Sanguin">
                          {patient.groupe_sanguin || 'Non renseigné'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Téléphone">
                          {patient.telephone || 'Non renseigné'}
                        </Descriptions.Item>
                      </Descriptions>
                    }
                    type="success"
                    showIcon
                    style={{ marginBottom: 16 }}
                    action={
                      <Button size="small" onClick={() => setPatient(null)}>
                        Changer
                      </Button>
                    }
                  />
                )}
              </Card>

              {/* SECTION AFFECTION */}
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <HeartOutlined style={{ marginRight: 8 }} />
                    <span>Étape 2: Diagnostic et Affection</span>
                    <Tag color="green" style={{ marginLeft: 8 }}>
                      COD_PAY: {COD_PAY_DEFAULT}
                    </Tag>
                  </div>
                }
                style={{ marginBottom: 16 }}
                size="small"
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      label="Recherche d'affection"
                      required
                      help="Tapez au moins 2 caractères pour rechercher une affection (COD_PAY = CMF)"
                      validateStatus={affectionCode ? 'success' : ''}
                      hasFeedback={affectionCode}
                    >
                      <AutoComplete
                        options={affectionOptions}
                        style={{ width: '100%' }}
                        onSearch={searchAffections}
                        onSelect={handleSelectAffection}
                        placeholder="Ex: Hypertension, Diabète, Grippe..."
                        notFoundContent={
                          searchingAffections ? 
                            <div style={{ padding: 8, textAlign: 'center' }}>
                              <Spin size="small" /> Recherche en cours...
                            </div> : 
                            "Aucune affection trouvée"
                        }
                        disabled={!patient}
                        filterOption={false}
                        defaultActiveFirstOption={false}
                        allowClear
                        value={affectionCode ? `${affectionCode} - ${affectionLibelle}` : undefined}
                        onChange={(value) => {
                          if (value === '') {
                            setAffectionOptions([]);
                            setAffectionCode('');
                            setAffectionLibelle('');
                            setAffectionDetails(null);
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                {affectionCode && (
                  <Alert
                    message="Affection sélectionnée"
                    description={
                      <div>
                        <strong>Code:</strong> {affectionCode}
                        <br />
                        <strong>Libellé:</strong> {affectionLibelle || 'Non spécifié'}
                        {affectionDetails && (
                          <>
                            <br />
                            <strong>Type:</strong> {affectionDetails.nom_type_affection || 'Non spécifié'}
                          </>
                        )}
                      </div>
                    }
                    type="info"
                    showIcon
                    action={
                      <Button size="small" onClick={() => {
                        setAffectionCode('');
                        setAffectionLibelle('');
                        setAffectionDetails(null);
                      }}>
                        Changer
                      </Button>
                    }
                  />
                )}
              </Card>

              {/* SECTION PRESTATIONS */}
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <MedicineBoxOutlined style={{ marginRight: 8 }} />
                      <span>Étape 3: Prestations ({getTypeLabel(typePrestation)})</span>
                    </div>
                    <div>
                      <Tag color="blue">{selectedPrestations.length} élément(s)</Tag>
                      <Tag color="green">
                        Total: {calculerTotal().toLocaleString('fr-FR')} FCFA
                      </Tag>
                    </div>
                  </div>
                }
                style={{ marginBottom: 16 }}
                size="small"
              >
                {!patient ? (
                  <Alert
                    message="Patient requis"
                    description="Veuillez d'abord rechercher un patient avant d'ajouter des prestations"
                    type="warning"
                    showIcon
                  />
                ) : !affectionCode ? (
                  <Alert
                    message="Affection requise"
                    description="Veuillez d'abord sélectionner une affection avant d'ajouter des prestations"
                    type="warning"
                    showIcon
                  />
                ) : (
                  <>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={18}>
                        <Input.Search
                          placeholder={`Rechercher des prestations ${getTypeLabel(typePrestation).toLowerCase()}...`}
                          enterButton={<SearchOutlined />}
                          size="large"
                          value={searchPrestation}
                          onChange={(e) => handleSearchPrestations(e.target.value)}
                          loading={loadingPrestations}
                          disabled={!patient || !affectionCode}
                        />
                      </Col>
                      <Col span={6}>
                        <Space>
                          <Button
                            type="dashed"
                            icon={<AppstoreAddOutlined />}
                            onClick={() => ouvrirSaisieManuelle(typePrestation === 'PHARMACIE' ? 'MEDICAMENT' : 'ACTE')}
                            style={{ width: '100%' }}
                          >
                            Saisie manuelle
                          </Button>
                        </Space>
                      </Col>
                    </Row>
                    
                    {loadingPrestations ? (
                      <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin tip="Chargement des prestations..." size="large" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <Table
                        columns={prestationsColumns}
                        dataSource={searchResults}
                        pagination={{ pageSize: 5 }}
                        size="small"
                        rowKey="key"
                        scroll={{ y: 300 }}
                      />
                    ) : searchPrestation ? (
                      <Empty
                        description={`Aucune prestation trouvée pour "${searchPrestation}"`}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    ) : (
                      <Empty
                        description={`Aucune prestation disponible pour ${getTypeLabel(typePrestation)}`}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}

                    <Divider orientation="left">
                      <strong>Prescription en cours</strong>
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        {selectedPrestations.length} élément(s)
                      </Tag>
                    </Divider>

                    {selectedPrestations.length > 0 ? (
                      <div>
                        <Table
                          columns={prescriptionPrestationsColumns}
                          dataSource={selectedPrestations}
                          pagination={false}
                          size="small"
                          rowKey="key"
                          scroll={{ x: 'max-content' }}
                          summary={() => {
                            const total = calculerTotal();
                            
                            return (
                              <Table.Summary.Row style={{ background: '#fafafa' }}>
                                <Table.Summary.Cell 
                                  index={0} 
                                  colSpan={
                                    (typePrestation === 'PHARMACIE' || typePrestation === 'MEDICAMENT') ? 6 : 4
                                  } 
                                  align="right"
                                >
                                  <div>
                                    <div><strong>TOTAL PRESCRIPTION:</strong></div>
                                  </div>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="right">
                                  <div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                                      {total.toLocaleString('fr-FR')} FCFA
                                    </div>
                                  </div>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={2} />
                              </Table.Summary.Row>
                            );
                          }}
                        />
                        
                        <div style={{ marginTop: 16, textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                            Total à facturer: {calculerTotal().toLocaleString('fr-FR')} FCFA
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Empty
                        description="Aucune prestation ajoutée à la prescription"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </>
                )}
              </Card>

              {/* BOUTONS D'ACTION */}
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Space size="large">
                  <Button
                    size="large"
                    onClick={resetPrescriptionForm}
                    disabled={!patient && selectedPrestations.length === 0}
                    icon={<CloseCircleOutlined />}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={loading.prescrire}
                    disabled={!patient || !selectedPrestataire || selectedPrestations.length === 0 || !affectionCode}
                    icon={<CheckCircleOutlined />}
                  >
                    Terminer la prescription ({selectedPrestations.length} éléments)
                  </Button>
                </Space>
              </div>
            </Form>
          </TabPane>

          {/* TAB 2: EXÉCUTION */}
          <TabPane 
            tab={
              <span>
                <PlayCircleOutlined />
                Exécution
                {executions.length > 0 && (
                  <Badge count={executions.length} style={{ marginLeft: 5 }} />
                )}
              </span>
            } 
            key="execution"
          >
            <Card 
              title="Exécution de prescriptions" 
              extra={
                <Space>
                  <Select
                    value={filtersExecutions.statut}
                    onChange={(value) => setFiltersExecutions(prev => ({ ...prev, statut: value }))}
                    style={{ width: 150 }}
                    size="small"
                  >
                    <Option value="ALL">Tous les statuts</Option>
                    <Option value="EN_COURS">En cours</Option>
                    <Option value="EN_ATTENTE">En attente</Option>
                    <Option value="EXECUTEE">Exécutées</Option>
                  </Select>
                  
                  <RangePicker
                    value={filtersExecutions.dateRange}
                    onChange={(dates) => setFiltersExecutions(prev => ({ ...prev, dateRange: dates }))}
                    size="small"
                    format="DD/MM/YYYY"
                  />
                  
                  <Input.Search
                    placeholder="Rechercher..."
                    value={filtersExecutions.search}
                    onChange={(e) => setFiltersExecutions(prev => ({ ...prev, search: e.target.value }))}
                    style={{ width: 200 }}
                    size="small"
                  />
                  
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadExecutions}
                    loading={loadingExecutions}
                    size="small"
                  >
                    Actualiser
                  </Button>
                </Space>
              }
            >
              {loadingExecutions ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin tip="Chargement des prescriptions..." size="large" />
                </div>
              ) : executions.length > 0 ? (
                <Table
                  columns={executionsColumns}
                  dataSource={executions}
                  pagination={{ pageSize: 10 }}
                  size="middle"
                  rowKey="id"
                  scroll={{ x: 1000 }}
                />
              ) : (
                <Empty
                  description={
                    <div>
                      <p>Aucune prescription à exécuter</p>
                      <p style={{ fontSize: '12px', color: '#666' }}>
                        Toutes les prescriptions ont été exécutées ou aucune ne correspond aux filtres
                      </p>
                    </div>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
              
              {/* Statistiques */}
              <div style={{ marginTop: 20 }}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                          {executions.filter(e => e.statut !== 'EXECUTEE').length}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <ClockCircleOutlined /> Total à exécuter
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                          {executions.filter(e => e.statut === 'EN_COURS').length}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <SyncOutlined spin /> En cours
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d4b106' }}>
                          {executions.filter(e => e.statut === 'EN_ATTENTE').length}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <ClockCircleOutlined /> En attente
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                          {executions.filter(e => e.statut === 'EXECUTEE').length}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <CheckCircleOutlined /> Exécutées
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Card>
          </TabPane>
          
          {/* TAB 3: HISTORIQUE */}
          <TabPane 
            tab={
              <span>
                <HistoryOutlined />
                Historique
                {historique.length > 0 && (
                  <Badge count={historique.length} style={{ marginLeft: 5 }} />
                )}
              </span>
            } 
            key="historique"
          >
            <Card 
              title="Historique des prescriptions" 
              extra={
                <Space>
                  <Select
                    value={filtersHistorique.type}
                    onChange={(value) => setFiltersHistorique(prev => ({ ...prev, type: value }))}
                    style={{ width: 180 }}
                    size="small"
                  >
                    <Option value="ALL">Tous les types</Option>
                    <Option value="PHARMACIE">Pharmacie</Option>
                    <Option value="BIOLOGIE">Biologie</Option>
                    <Option value="CONSULTATION">Consultation</Option>
                    <Option value="IMAGERIE">Imagerie</Option>
                    <Option value="HOSPITALISATION">Hospitalisation</Option>
                  </Select>
                  
                  <RangePicker
                    value={filtersHistorique.dateRange}
                    onChange={(dates) => setFiltersHistorique(prev => ({ ...prev, dateRange: dates }))}
                    size="small"
                    format="DD/MM/YYYY"
                  />
                  
                  <Input.Search
                    placeholder="Rechercher..."
                    value={filtersHistorique.search}
                    onChange={(e) => setFiltersHistorique(prev => ({ ...prev, search: e.target.value }))}
                    style={{ width: 200 }}
                    size="small"
                  />
                  
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadHistorique}
                    loading={loadingHistorique}
                    size="small"
                  >
                    Actualiser
                  </Button>
                  
                  <Button
                    type="primary"
                    icon={<FileExcelOutlined />}
                    size="small"
                    onClick={() => message.info('Export CSV à implémenter')}
                  >
                    Exporter
                  </Button>
                </Space>
              }
            >
              {loadingHistorique ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin tip="Chargement de l'historique..." size="large" />
                </div>
              ) : historique.length > 0 ? (
                <Table
                  columns={historiqueColumns}
                  dataSource={historique}
                  pagination={{ pageSize: 10 }}
                  size="middle"
                  rowKey="id"
                  scroll={{ x: 1200 }}
                />
              ) : (
                <Empty
                  description={
                    <div>
                      <p>Aucune prescription dans l'historique</p>
                      <p style={{ fontSize: '12px', color: '#666' }}>
                        Les prescriptions exécutées apparaîtront ici
                      </p>
                    </div>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
              
              {/* Résumé statistique */}
              <div style={{ marginTop: 20 }}>
                <Card size="small" title="Résumé statistique">
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                          {historique.length}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <FileTextOutlined /> Total prescriptions
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                          {historique.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0).toLocaleString('fr-FR')} FCFA
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <DollarOutlined /> Montant total
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                          {historique.length > 0 ? moment(historique[0].dateExecution, 'DD/MM/YYYY HH:mm').fromNow() : 'Aucune'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <CalendarOutlined /> Dernière exécution
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </div>
            </Card>
          </TabPane>
        </Tabs>

        {/* MODALE DE SAISIE MANUELLE */}
        <Modal
          title={
            <div>
              <AppstoreAddOutlined style={{ marginRight: 8 }} />
              Saisie manuelle - {getTypeLabel(manualEntryType)}
            </div>
          }
          open={manualEntryModal}
          onCancel={() => setManualEntryModal(false)}
          onOk={ajouterManuellement}
          okText="Ajouter"
          cancelText="Annuler"
          width={600}
          centered
        >
          <Form
            form={manualForm}
            layout="vertical"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Code"
                  name="code_acte"
                  rules={[{ required: true, message: 'Veuillez entrer un code' }]}
                >
                  <Input placeholder="Ex: MED001, EXM001..." />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Libellé"
                  name="libelle"
                  rules={[{ required: true, message: 'Veuillez entrer un libellé' }]}
                >
                  <Input placeholder="Désignation de la prestation" />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              label="Description"
              name="description"
            >
              <TextArea
                rows={2}
                placeholder="Description détaillée (optionnel)"
              />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Quantité"
                  name="quantite"
                  initialValue={1}
                  rules={[{ required: true, message: 'Veuillez entrer la quantité' }]}
                >
                  <InputNumber
                    min={1}
                    max={999}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Prix unitaire (FCFA)"
                  name="prix_unitaire"
                  initialValue={0}
                  rules={[{ required: true, message: 'Veuillez entrer le prix' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                  />
                </Form.Item>
              </Col>
              {manualEntryType === 'MEDICAMENT' && (
                <Col span={8}>
                  <Form.Item
                    label="Durée (jours)"
                    name="duree"
                    initialValue="7"
                  >
                    <Input placeholder="Durée du traitement" />
                  </Form.Item>
                </Col>
              )}
            </Row>
            
            {manualEntryType === 'MEDICAMENT' && (
              <Form.Item
                label="Posologie"
                name="posologie"
                initialValue="1 comprimé matin et soir"
                rules={[{ required: true, message: 'Veuillez entrer la posologie' }]}
              >
                <TextArea
                  rows={2}
                  placeholder="Ex: 1 comprimé matin et soir après les repas"
                />
              </Form.Item>
            )}
          </Form>
        </Modal>

        {/* MODALE DE SÉLECTION DES PRESTATAIRES */}
        <Modal
          title={
            <div>
              <TeamOutlined style={{ marginRight: 8 }} />
              Sélectionner un médecin
              <Tag color="blue" style={{ marginLeft: 8 }}>
                Centre: {centreNom || `Centre ${centreId}`}
              </Tag>
            </div>
          }
          open={modalPrestataires}
          onCancel={() => setModalPrestataires(false)}
          footer={null}
          width={800}
          centered
          destroyOnClose
        >
          {loadingPrestataires ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin tip="Chargement des médecins..." size="large" />
            </div>
          ) : prestataires.length > 0 ? (
            <Table
              columns={prestatairesColumns}
              dataSource={prestataires}
              pagination={{ pageSize: 5 }}
              size="small"
              rowKey="id"
            />
          ) : (
            <Empty
              description={
                <div>
                  <p>Aucun médecin trouvé pour ce centre</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    Vérifiez que le centre sélectionné dispose de médecins affectés
                  </p>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Modal>

        {/* MODALE DE VALIDATION */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              <span>Confirmer la prescription</span>
            </div>
          }
          open={validationModalVisible}
          onCancel={() => setValidationModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setValidationModalVisible(false)}>
              Annuler
            </Button>,
            <Button
              key="confirm"
              type="primary"
              loading={loading.prescrire}
              onClick={confirmerPrescription}
              icon={<CheckCircleOutlined />}
            >
              Confirmer et enregistrer
            </Button>
          ]}
          width={600}
          destroyOnClose
        >
          <div style={{ padding: '20px 0' }}>
            <Steps
              current={2}
              items={[
                {
                  title: 'Patient',
                  description: patient?.nom_complet
                },
                {
                  title: 'Affection',
                  description: (affectionLibelle || affectionCode || '').substring(0, 20) + '...'
                },
                {
                  title: 'Validation',
                  description: 'Confirmer'
                },
              ]}
              style={{ marginBottom: 24 }}
            />
            
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Patient">
                <strong>{patient?.nom_complet}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Médecin prescripteur">
                <strong>{selectedPrestataire?.nom_complet}</strong>
                {selectedPrestataire?.specialite && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {selectedPrestataire.specialite}
                  </div>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Type de prescription">
                <Tag color="blue">{getTypeLabel(typePrestation)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Affection">
                <strong>{affectionCode} - {affectionLibelle || 'Non spécifié'}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Centre">
                {centreNom}
              </Descriptions.Item>
              <Descriptions.Item label="Nombre d'éléments">
                <strong>{selectedPrestations.length}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Montant total">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <strong style={{ color: '#1890ff', fontSize: '18px', marginRight: 8 }}>
                    {calculerTotal().toLocaleString('fr-FR')} FCFA
                  </strong>
                </div>
              </Descriptions.Item>
            </Descriptions>
            
            <Alert
              message="Information"
              description="La prescription sera enregistrée et un numéro unique lui sera attribué. Vous pourrez ensuite l'imprimer."
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        </Modal>

        {/* MODALE D'IMPRESSION */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <PrinterOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              <span>Impression d'ordonnance</span>
              {ordonnanceToPrint && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {ordonnanceToPrint.numero}
                </Tag>
              )}
            </div>
          }
          open={printModalVisible}
          onCancel={() => {
            setPrintModalVisible(false);
            setOrdonnanceToPrint(null);
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setPrintModalVisible(false);
                setOrdonnanceToPrint(null);
              }}
            >
              Fermer
            </Button>,
            <Button
              key="print"
              type="primary"
              loading={printingOrdonnance}
              onClick={imprimerOrdonnance}
              icon={<PrinterOutlined />}
            >
              Imprimer
            </Button>,
            <Button
              key="download"
              type="default"
              icon={<DownloadOutlined />}
              onClick={() => {
                message.info('Téléchargement PDF à implémenter');
              }}
            >
              PDF
            </Button>
          ]}
          width={700}
          destroyOnClose
        >
          {ordonnanceToPrint ? (
            <div style={{ padding: '20px 0' }}>
              <Alert
                message="Prescription créée avec succès"
                description={`Numéro: ${ordonnanceToPrint.numero}`}
                type="success"
                showIcon
                style={{ marginBottom: 24 }}
              />
              
              <div style={{ 
                textAlign: 'center', 
                marginBottom: 20,
                padding: '10px',
                border: '2px solid #1890ff',
                borderRadius: '4px',
                background: '#f0f9ff'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                  FEUILLE DE PRISE EN CHARGE
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: 5 }}>
                  {getTypeLabel(ordonnanceToPrint.typePrestation)}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: 8 }}>
                  {ordonnanceToPrint.numero} • {ordonnanceToPrint.dateCreation}
                </div>
              </div>
              
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Patient">
                  <strong>{ordonnanceToPrint.patient?.nom_complet}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Carte: {ordonnanceToPrint.patient?.numero_carte || 'Non spécifié'} | 
                    Âge: {ordonnanceToPrint.patient?.age || 'N/A'} ans | 
                    Sexe: {ordonnanceToPrint.patient?.sexe || 'Non spécifié'}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Médecin prescripteur">
                  <strong>{ordonnanceToPrint.selectedPrestataire?.nom_complet}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {ordonnanceToPrint.selectedPrestataire?.specialite || 'Médecin Généraliste'}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Affection diagnostiquée">
                  <strong>{ordonnanceToPrint.affectionCode} - {ordonnanceToPrint.affectionLibelle || 'Non spécifiée'}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Centre de santé">
                  {ordonnanceToPrint.centreNom}
                </Descriptions.Item>
                <Descriptions.Item label="Nombre d'éléments prescrits">
                  <strong>{ordonnanceToPrint.selectedPrestations?.length || 0}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Montant total">
                  <strong style={{ color: '#1890ff', fontSize: '16px' }}>
                    {ordonnanceToPrint.total?.toLocaleString('fr-FR') || '0'} FCFA
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Date de validité">
                  {ordonnanceToPrint.dateValidite}
                </Descriptions.Item>
              </Descriptions>
              
              <div style={{ marginTop: 16, background: '#fafafa', padding: '10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: 5 }}>
                  Détail des éléments prescrits:
                </div>
                <List
                  size="small"
                  dataSource={ordonnanceToPrint.selectedPrestations?.slice(0, 3) || []}
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        title={`${index + 1}. ${item.LIBELLE}`}
                        description={
                          <div>
                            <span>Code: {item.CODE_ACTE} | </span>
                            <span>Qté: {item.QUANTITE} | </span>
                            <span>Prix: {parseFloat(item.PRIX_UNITAIRE || 0).toLocaleString('fr-FR')} FCFA</span>
                            {item.POSOLOGIE && <div>Posologie: {item.POSOLOGIE}</div>}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
                {ordonnanceToPrint.selectedPrestations?.length > 3 && (
                  <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', marginTop: 5 }}>
                    ... et {ordonnanceToPrint.selectedPrestations.length - 3} éléments supplémentaires
                  </div>
                )}
              </div>
              
              <Alert
                message="Instructions d'impression"
                description="Cliquez sur 'Imprimer' pour générer une version imprimable de l'ordonnance avec l'entête 'Feuille de Prise en Charge'."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin tip="Chargement de l'ordonnance..." size="large" />
            </div>
          )}
        </Modal>

        {/* MODALE DE DÉTAIL D'EXÉCUTION */}
        <Modal
          title={
            <div>
              <EyeOutlined style={{ marginRight: 8 }} />
              Détail de la prescription
              {selectedExecution && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {selectedExecution.numero}
                </Tag>
              )}
            </div>
          }
          open={executionDetailModal}
          onCancel={() => setExecutionDetailModal(false)}
          footer={[
            <Button key="close" onClick={() => setExecutionDetailModal(false)}>
              Fermer
            </Button>,
            selectedExecution?.statut !== 'EXECUTEE' && (
              <Button
                key="execute"
                type="primary"
                loading={executingPrescription}
                onClick={() => {
                  marquerCommeExecutée(selectedExecution.id);
                  setExecutionDetailModal(false);
                }}
                icon={<CheckOutlined />}
              >
                Marquer comme exécutée
              </Button>
            )
          ]}
          width={600}
          destroyOnClose
        >
          {selectedExecution && (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="N° Prescription">
                <strong>{selectedExecution.numero}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Patient">
                <strong>{selectedExecution.patient}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Médecin prescripteur">
                {selectedExecution.medecin}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="blue">{getTypeLabel(selectedExecution.type)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Badge
                  status={
                    selectedExecution.statut === 'EN_COURS' ? 'processing' :
                    selectedExecution.statut === 'EN_ATTENTE' ? 'warning' : 'success'
                  }
                  text={selectedExecution.statut === 'EN_COURS' ? 'En cours' :
                        selectedExecution.statut === 'EN_ATTENTE' ? 'En attente' : 'Exécutée'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Priorité">
                <Tag color={
                  selectedExecution.priorite === 'Haute' ? 'red' :
                  selectedExecution.priorite === 'Normale' ? 'blue' : 'green'
                }>
                  {selectedExecution.priorite}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Date prescription">
                {selectedExecution.date}
              </Descriptions.Item>
              <Descriptions.Item label="Nombre d'éléments">
                {selectedExecution.elements}
              </Descriptions.Item>
              <Descriptions.Item label="Montant total">
                <strong>{parseFloat(selectedExecution.total || 0).toLocaleString('fr-FR')} FCFA</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Centre">
                {selectedExecution.centre}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* MODALE DE DÉTAIL HISTORIQUE */}
        <Modal
          title={
            <div>
              <HistoryOutlined style={{ marginRight: 8 }} />
              Détail historique
              {selectedHistorique && (
                <Tag color="green" style={{ marginLeft: 8 }}>
                  {selectedHistorique.numero}
                </Tag>
              )}
            </div>
          }
          open={historiqueDetailModal}
          onCancel={() => setHistoriqueDetailModal(false)}
          footer={[
            <Button key="close" onClick={() => setHistoriqueDetailModal(false)}>
              Fermer
            </Button>,
            <Button
              key="print"
              type="primary"
              icon={<PrinterOutlined />}
              onClick={() => {
                const mockOrdonnance = {
                  ...selectedHistorique,
                  selectedPrestations: [
                    { CODE_ACTE: 'MED001', LIBELLE: 'Paracétamol 500mg', QUANTITE: 2, PRIX_UNITAIRE: 500 },
                    { CODE_ACTE: 'MED002', LIBELLE: 'Amoxicilline 1g', QUANTITE: 1, PRIX_UNITAIRE: 1500 }
                  ],
                  patient: { nom_complet: selectedHistorique.patient, numero_carte: '123456', age: 35, sexe: 'M' },
                  selectedPrestataire: { nom_complet: selectedHistorique.medecin, specialite: 'Médecin Généraliste' },
                  centreNom: selectedHistorique.centre,
                  typePrestation: selectedHistorique.type,
                  affectionCode: '113',
                  affectionLibelle: 'Gastrite',
                  dateValidite: moment().add(30, 'days').format('DD/MM/YYYY'),
                  total: selectedHistorique.total
                };
                setOrdonnanceToPrint(mockOrdonnance);
                setHistoriqueDetailModal(false);
                setPrintModalVisible(true);
              }}
            >
              Imprimer
            </Button>
          ]}
          width={600}
          destroyOnClose
        >
          {selectedHistorique && (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="N° Prescription">
                <strong>{selectedHistorique.numero}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Patient">
                <strong>{selectedHistorique.patient}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Médecin prescripteur">
                {selectedHistorique.medecin}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="blue">{getTypeLabel(selectedHistorique.type)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Badge status="success" text="Exécutée" />
              </Descriptions.Item>
              <Descriptions.Item label="Date prescription">
                {selectedHistorique.date}
              </Descriptions.Item>
              <Descriptions.Item label="Date exécution">
                <div style={{ color: '#52c41a' }}>
                  <CheckCircleOutlined style={{ marginRight: 5 }} />
                  {selectedHistorique.dateExecution}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Exécuté par">
                {selectedHistorique.executant}
              </Descriptions.Item>
              <Descriptions.Item label="Nombre d'éléments">
                {selectedHistorique.elements}
              </Descriptions.Item>
              <Descriptions.Item label="Montant total">
                <strong>{parseFloat(selectedHistorique.total || 0).toLocaleString('fr-FR')} FCFA</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Centre">
                {selectedHistorique.centre}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default Prescriptions;