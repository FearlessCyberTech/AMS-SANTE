import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, Search, Edit, Trash2, User, Download, 
  RefreshCw, ChevronLeft, ChevronRight,
  Users, Phone, Mail, UserPlus, Save, X, 
  Loader2, CheckCircle, AlertCircle, FileText,
  Filter, Calendar, MapPin, Briefcase, Heart,
  ChevronDown, Shield, CreditCard, FileSignature,
  QrCode, Camera, Printer, IdCard, Info,
  Building, Globe, PhoneCall, Map,
  Pill, Clipboard, Stethoscope, Wallet,
  Database, Activity, BarChart, 
  Upload, Eye, Key, Fingerprint,
  Image as ImageIcon, UploadCloud
} from 'lucide-react';
import { 
  beneficiairesAPI, famillesACEAPI,
  paysAPI, policesAPI, syncAPI
} from '../../services/api';
import './Beneficiaires.css';
import AMSlogo from "../../assets/AMS-logo.png";
import frontBackgroundCard from "../../assets/FrontbackgroundCard.png";
import backBackgroundCard from "../../assets/backBackground.jpeg";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ==============================================
// FONCTION UNIFIÉE ET SIMPLIFIÉE POUR LES PHOTOS
// ==============================================
const getPhotoUrl = (photoFileName) => {
  if (!photoFileName || ['null', 'undefined', ''].includes(photoFileName)) {
    return null;
  }
  
  // Si c'est déjà une URL complète
  if (photoFileName.startsWith('photo')) {
    return photoFileName;
  }
  
  // Base URL de l'API
  const baseUrl = (window._env_ && window._env_.REACT_APP_API_URL) || 
                  window.REACT_APP_API_URL || 
                  'http://localhost:5000';
  
  // Nettoyer le nom de fichier
  let fileName = photoFileName.toString().replace(/\\/g, '/');
  
  // Extraire uniquement le nom du fichier (dernière partie après /)
  const fileNameParts = fileName.split('/');
  fileName = fileNameParts[fileNameParts.length - 1];
  
  // Construire l'URL complète
  const finalUrl = `${baseUrl}/uploads/beneficiaires/${fileName}`;
  
  return finalUrl;
};

// Fonction alternative plus simple pour tester
const getPhotoUrlSimple = (photoFileName) => {
  if (!photoFileName || ['null', 'undefined', ''].includes(photoFileName)) {
    return null;
  }
  
  if (photoFileName.startsWith('http')) {
    return photoFileName;
  }
  
  const baseUrl = (window._env_ && window._env_.REACT_APP_API_URL) || 
                  window.REACT_APP_API_URL || 
                  'http://localhost:5000';
  
  // Nettoyer le nom de fichier
  let fileName = photoFileName.replace(/\\/g, '/');
  
  // Si le chemin contient déjà "uploads/beneficiaires/"
  if (fileName.includes('uploads/beneficiaires/')) {
    // Extraire la partie après "uploads/beneficiaires/"
    const parts = fileName.split('uploads/beneficiaires/');
    fileName = parts[parts.length - 1];
  }
  
  // Supprimer les préfixes de chemin inutiles
  const unwantedPrefixes = ['backend/', 'public/', 'static/', 'images/'];
  unwantedPrefixes.forEach(prefix => {
    if (fileName.startsWith(prefix)) {
      fileName = fileName.substring(prefix.length);
    }
  });
  
  return `${baseUrl}/uploads/beneficiaires/${fileName}`;
};


// Fonction pour vérifier si une image existe
const checkImageExists = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

// Composant pour afficher les photos avec gestion des erreurs
const BeneficiaryPhoto = ({ photoUrl, sex, className = '', size = 'medium' }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      if (!photoUrl) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);
      
      // Vérifier si l'URL est valide
      try {
        const url = new URL(photoUrl);
        
        // Vérifier si l'image existe
        const img = new window.Image();
        
        img.onload = () => {
          setImgSrc(photoUrl);
          setIsLoading(false);
        };
        
        img.onerror = () => {
          console.warn('Erreur de chargement de l\'image:', photoUrl);
          setHasError(true);
          setIsLoading(false);
        };
        
        img.src = photoUrl;
        
        // Timeout après 5 secondes
        const timeout = setTimeout(() => {
          if (isLoading) {
            console.warn('Timeout de chargement pour:', photoUrl);
            setHasError(true);
            setIsLoading(false);
          }
        }, 5000);
        
        return () => clearTimeout(timeout);
      } catch (error) {
        console.warn('URL photo invalide:', photoUrl);
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadImage();
  }, [photoUrl]);

  const sizeClasses = {
    small: 'photo-small',
    medium: 'photo-medium',
    large: 'photo-large',
    xlarge: 'photo-xlarge'
  };

  if (isLoading) {
    return (
      <div className={`photo-placeholder loading ${sex === 'F' ? 'female' : 'male'} ${sizeClasses[size]} ${className}`}>
        <Loader2 size={size === 'small' ? 16 : size === 'medium' ? 20 : 24} className="animate-spin" />
      </div>
    );
  }

  if (hasError || !imgSrc) {
    return (
      <div className={`photo-placeholder ${sex === 'F' ? 'female' : 'male'} ${sizeClasses[size]} ${className}`}>
        <User size={size === 'small' ? 20 : size === 'medium' ? 30 : 40} />
      </div>
    );
  }

  return (
    <div className={`photo-container ${className}`}>
      <img 
        src={imgSrc} 
        alt="Photo bénéficiaire"
        className={`beneficiary-photo ${sizeClasses[size]}`}
        onError={() => {
          console.warn(`Erreur d'affichage de la photo: ${imgSrc}`);
          setHasError(true);
        }}
        loading="lazy"
      />
    </div>
  );
};

// ==============================================
// FONCTIONS UTILITAIRES POUR LES FILTRES
// ==============================================

// Fonction pour transformer les filtres avancés en paramètres API
const transformFiltersToAPI = (filters) => {
  const apiFilters = {};
  
  // Mapper les noms des filtres frontend vers les noms backend
  if (filters.type_beneficiaire) {
    apiFilters.type_beneficiaire = filters.type_beneficiaire;
  }
  
  if (filters.sexe) {
    apiFilters.sexe = filters.sexe;
  }
  
  if (filters.zone_habitation) {
    apiFilters.zone_habitation = filters.zone_habitation;
  }
  
  if (filters.age_min) {
    apiFilters.age_min = parseInt(filters.age_min);
  }
  
  if (filters.age_max) {
    apiFilters.age_max = parseInt(filters.age_max);
  }
  
  if (filters.assurance_prive !== undefined && filters.assurance_prive !== '') {
    apiFilters.assurance_prive = filters.assurance_prive ? 1 : 0;
  }
  
  if (filters.cod_pay) {
    apiFilters.cod_pay = filters.cod_pay;
  }
  
  if (filters.statut_ace) {
    apiFilters.statut_ace = filters.statut_ace;
  }
  
  return apiFilters;
};

// Fonction pour précharger les photos
const preloadPhoto = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    
    // Utiliser window.Image pour éviter tout conflit
    const img = new window.Image();
    img.onload = () => {
      resolve(url);
    };
    img.onerror = () => {
      console.warn(`Impossible de précharger la photo: ${url}`);
      resolve(null);
    };
    img.src = url;
  });
};



const Beneficiaires = () => {
  // ==============================================
  // ÉTATS PRINCIPAUX
  // ==============================================
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // États pour la synchronisation
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [showSyncResults, setShowSyncResults] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncDetails, setSyncDetails] = useState([]);
  
  // États pour les données de référence
  const [paysList, setPaysList] = useState([]);
  const [assuresPrincipaux, setAssuresPrincipaux] = useState([]);
  const [showAssureDropdown, setShowAssureDropdown] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [beneficiairesDisponibles, setBeneficiairesDisponibles] = useState([]);
  const [loadingBeneficiaires, setLoadingBeneficiaires] = useState(false);
  
  // États pour les filtres avancés
  const [advancedFilters, setAdvancedFilters] = useState({
    type_beneficiaire: '',
    sexe: '',
    zone_habitation: '',
    age_min: '',
    age_max: '',
    assurance_prive: false,
    cod_pay: '',
    statut_ace: ''
  });

 // ==============================================
  // ÉTATS POUR LA GESTION DES DONNÉES MÉDICALES
  // ==============================================
  const [showMedicalData, setShowMedicalData] = useState(false);
  const [selectedBeneficiaireForMedical, setSelectedBeneficiaireForMedical] = useState(null);
  const [medicalData, setMedicalData] = useState({
    allergies: [],
    antecedents: [],
    notes: []
  });
  const [loadingMedical, setLoadingMedical] = useState(false);

  // États pour les formulaires médicaux
  const [showAllergieForm, setShowAllergieForm] = useState(false);
  const [showAntecedentForm, setShowAntecedentForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [medicalFormData, setMedicalFormData] = useState({
    allergie: {
      TYPE_ALLERGIE: '',
      ALLERGENE: '',
      REACTION: '',
      GRAVITE: '',
      TRAITEMENT_URGENCE: '',
      OBSERVATIONS: ''
    },
    antecedent: {
      TYPE_ANTECEDENT: '',
      DESCRIPTION: '',
      GRAVITE: '',
      TRAITEMENT: '',
      OBSERVATIONS: ''
    },
    note: {
      TYPE_NOTE: '',
      CONTENU: '',
      URGENT: false,
      RESTREINT: false
    }
  });

  // ==============================================
  // ÉTATS POUR LES CARTES ET REMBOURSEMENTS
  // ==============================================
  const [showCartes, setShowCartes] = useState(false);
  const [selectedBeneficiaireForCartes, setSelectedBeneficiaireForCartes] = useState(null);
  const [cartes, setCartes] = useState([]);
  const [loadingCartes, setLoadingCartes] = useState(false);

  const [showRemboursements, setShowRemboursements] = useState(false);
  const [selectedBeneficiaireForRemboursements, setSelectedBeneficiaireForRemboursements] = useState(null);
  const [remboursements, setRemboursements] = useState([]);
  const [loadingRemboursements, setLoadingRemboursements] = useState(false);

  // ==============================================
  // ÉTATS POUR LA GESTION DES POLICES ET GARANTIES
  // ==============================================
  const [showPolices, setShowPolices] = useState(false);
  const [selectedBeneficiaireForPolices, setSelectedBeneficiaireForPolices] = useState(null);
  const [polices, setPolices] = useState([]);
  const [loadingPolices, setLoadingPolices] = useState(false);
  
  const [showGaranties, setShowGaranties] = useState(false);
  const [selectedBeneficiaireForGaranties, setSelectedBeneficiaireForGaranties] = useState(null);
  const [garanties, setGaranties] = useState([]);
  const [loadingGaranties, setLoadingGaranties] = useState(false);
  
  const [showCentres, setShowCentres] = useState(false);
  const [selectedBeneficiaireForCentres, setSelectedBeneficiaireForCentres] = useState(null);
  const [centres, setCentres] = useState([]);
  const [loadingCentres, setLoadingCentres] = useState(false);

  // ==============================================
  // ÉTATS POUR LA BIOMÉTRIE
  // ==============================================
  const [showBiometrie, setShowBiometrie] = useState(false);
  const [selectedBeneficiaireForBiometrie, setSelectedBeneficiaireForBiometrie] = useState(null);
  const [biometrieData, setBiometrieData] = useState([]);
  const [loadingBiometrie, setLoadingBiometrie] = useState(false);

  // ==============================================
  // ÉTATS POUR LES FAMILLES ACE
  // ==============================================
  const [showFamille, setShowFamille] = useState(false);
  const [selectedAssureForFamille, setSelectedAssureForFamille] = useState(null);
  const [compositionFamiliale, setCompositionFamiliale] = useState([]);
  const [loadingFamille, setLoadingFamille] = useState(false);
  const [showAddAyantDroitForm, setShowAddAyantDroitForm] = useState(false);
  const [ayantDroitFormData, setAyantDroitFormData] = useState({
    ID_AYANT_DROIT: '',
    TYPE_AYANT_DROIT: '',
    DATE_MARIAGE: '',
    LIEU_MARIAGE: '',
    NUM_ACTE_MARIAGE: ''
  });
// ==============================================
  // ÉTAT POUR LA CARTE DE BÉNÉFICIAIRE
  // ==============================================
  const [showCard, setShowCard] = useState(false);
  const [selectedBeneficiaireForCard, setSelectedBeneficiaireForCard] = useState(null);
  const [cardSide, setCardSide] = useState('front');
  const [qrCodeUrls, setQrCodeUrls] = useState({});

  // ==============================================
  // ÉTATS POUR LE FORMULAIRE BÉNÉFICIAIRE (AVEC PHOTO)
  // ==============================================
  const [formData, setFormData] = useState({
    NOM_BEN: '',
    PRE_BEN: '',
    FIL_BEN: '',
    SEX_BEN: 'M',
    NAI_BEN: '',
    LIEU_NAISSANCE: '',
    IDENTIFIANT_NATIONAL: '',
    NUM_PASSEPORT: '',
    TELEPHONE_MOBILE: '',
    TELEPHONE: '',
    EMAIL: '',
    PROFESSION: '',
    EMPLOYEUR: '',
    SITUATION_FAMILIALE: '',
    NOMBRE_ENFANTS: 0,
    GROUPE_SANGUIN: '',
    ANTECEDENTS_MEDICAUX: '',
    ALLERGIES: '',
    TRAITEMENTS_EN_COURS: '',
    CONTACT_URGENCE: '',
    TEL_URGENCE: '',
    COD_PAY: 'CMR',
    COD_REGION: null,
    CODE_TRIBAL: '',
    ZONE_HABITATION: '',
    TYPE_HABITAT: '',
    NIVEAU_ETUDE: '',
    RELIGION: '',
    LANGUE_MATERNEL: '',
    LANGUE_PARLEE: '',
    SALAIRE: null,
    MUTUELLE: '',
    STATUT_ACE: '',
    ID_ASSURE_PRINCIPAL: null,
    ACCES_EAU: true,
    ACCES_ELECTRICITE: true,
    DISTANCE_CENTRE_SANTE: 0,
    MOYEN_TRANSPORT: '',
    ASSURANCE_PRIVE: false,
    COD_CREUTIL: 'SYSTEM',
    COD_MODUTIL: 'SYSTEM'
  });
  
  // Nouvel état pour la photo
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // ==============================================
  // ÉTATS POUR LA GESTION DES CARTES
  // ==============================================
  const [showCarteForm, setShowCarteForm] = useState(false);
  const [editingCarte, setEditingCarte] = useState(null);
  const [carteFormData, setCarteFormData] = useState({
    COD_PAY: '',
    COD_CAR: '',
    NUM_CAR: '',
    NOM_BEN: '',
    PRE_BEN: '',
    NAI_BEN: '',
    SEX_BEN: '',
    SOC_BEN: '',
    NAG_ASS: '',
    PRM_BEN: '',
    DDV_CAR: '',
    DFV_CAR: '',
    DAT_EMP: '',
    DAT_BIO: '',
    STS_CAR: 1
  });
  const [carteErrors, setCarteErrors] = useState({});

  // Références pour les menus déroulants
  const assureDropdownRef = useRef(null);
  const beneficiaireDropdownRef = useRef(null);

  // ==============================================
  // OPTIONS POUR LES LISTES DÉROULANTES
  // ==============================================
  const statutAceOptions = [
    { value: '', label: 'Assuré Principal' },
    { value: 'CONJOINT', label: 'Conjoint' },
    { value: 'ENFANT', label: 'Enfant' },
    { value: 'ASCENDANT', label: 'Ascendant' }
  ];

  const typeAllergieOptions = [
    { value: 'Médicamenteuse', label: 'Médicamenteuse' },
    { value: 'Alimentaire', label: 'Alimentaire' },
    { value: 'Respiratoire', label: 'Respiratoire' },
    { value: 'Cutanée', label: 'Cutanée' },
    { value: 'Autre', label: 'Autre' }
  ];

  const typeAntecedentOptions = [
    { value: 'Chirurgical', label: 'Chirurgical' },
    { value: 'Médical', label: 'Médical' },
    { value: 'Familial', label: 'Familial' },
    { value: 'Allergique', label: 'Allergique' },
    { value: 'Obstétrical', label: 'Obstétrical' },
    { value: 'Autre', label: 'Autre' }
  ];

  const typeNoteOptions = [
    { value: 'Médicale', label: 'Médicale' },
    { value: 'Administrative', label: 'Administrative' },
    { value: 'Sociale', label: 'Sociale' },
    { value: 'Urgente', label: 'Urgente' },
    { value: 'Autre', label: 'Autre' }
  ];

  const graviteOptions = [
    { value: 'Légère', label: 'Légère' },
    { value: 'Modérée', label: 'Modérée' },
    { value: 'Sévère', label: 'Sévère' },
    { value: 'Critique', label: 'Critique' }
  ];

  const sexeOptions = [
    { value: 'M', label: 'Masculin' },
    { value: 'F', label: 'Féminin' },
    { value: 'O', label: 'Autre' }
  ];

  const groupeSanguinOptions = [
    { value: '', label: 'Sélectionner' },
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  const situationFamilialeOptions = [
    { value: '', label: 'Sélectionner' },
    { value: 'CELIBATAIRE', label: 'Célibataire' },
    { value: 'MARIE', label: 'Marié(e)' },
    { value: 'DIVORCE', label: 'Divorcé(e)' },
    { value: 'VEUF', label: 'Veuf/Veuve' },
    { value: 'CONCUBINAGE', label: 'En concubinage' }
  ];

  const carteTypeOptions = [
    { value: 'PRM', label: 'Primaire' },
    { value: 'SEC', label: 'Secondaire' },
    { value: 'TMP', label: 'Temporaire' },
    { value: 'RPL', label: 'Remplaçante' }
  ];

  const carteStatutOptions = [
    { value: 1, label: 'Active' },
    { value: 0, label: 'Inactive' },
    { value: 2, label: 'Suspendue' },
    { value: 3, label: 'Expirée' }
  ];// ==============================================
  // FONCTIONS UTILITAIRES
  // ==============================================
  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifié';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      return 'Date invalide';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Non spécifié';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const calculateAge = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const birthDate = new Date(dateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return 'N/A';
    }
  };

  const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return null;
    }
  };

  const genererIdentifiantNationalSequential = () => {
    let maxNum = 0;
    
    beneficiaires.forEach(ben => {
      const idNat = ben.IDENTIFIANT_NATIONAL;
      if (idNat && idNat.startsWith('AMS')) {
        const numStr = idNat.substring(3);
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    
    const nextNum = maxNum + 1;
    return `AMS${nextNum.toString().padStart(6, '0')}`;
  };

  const showNotification = (message, type = 'info', duration = 5000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

 // ==============================================
  // FONCTIONS POUR CHARGER LES DONNÉES
  // ==============================================
  const loadReferenceData = useCallback(async () => {
    try {
      const paysResponse = await paysAPI.getAll();
      if (paysResponse.success) {
        setPaysList(paysResponse.pays || []);
      }
    } catch (error) {
      console.error('Erreur chargement données de référence:', error);
    }
  }, []);

const loadBeneficiaires = useCallback(async () => {
  try {
    setLoading(true);
    
    const apiFilters = transformFiltersToAPI(advancedFilters);
    
    // Nettoyer les filtres
    const cleanedFilters = {};
    Object.keys(apiFilters).forEach(key => {
      const value = apiFilters[key];
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'number' && !isNaN(value)) {
          cleanedFilters[key] = value;
        } else if (typeof value === 'boolean') {
          cleanedFilters[key] = value;
        } else if (typeof value === 'string' && value.trim() !== '') {
          cleanedFilters[key] = value.trim();
        } else if (Array.isArray(value) && value.length > 0) {
          cleanedFilters[key] = value;
        }
      }
    });

    let response;
    if (searchTerm || Object.keys(cleanedFilters).length > 0) {
      response = await beneficiairesAPI.searchAdvanced(searchTerm, cleanedFilters, 100);
    } else {
      response = await beneficiairesAPI.getAll(100);
    }
    
    if (response.success) {
      const beneficiairesList = Array.isArray(response.beneficiaires) 
        ? response.beneficiaires 
        : (response.data || []);
      
      console.log('Données reçues du backend:', beneficiairesList[0]); // Debug
      
     // ==============================================
// NORMALISATION DES BÉNÉFICIAIRES - VERSION CORRIGÉE
// ==============================================

const normalizedBeneficiaires = beneficiairesList.map((ben) => {
  // Calcul de l'âge
  const dateNaissance = ben.NAI_BEN || ben.date_naissance || '';
  const age = ben.AGE || calculateAge(dateNaissance);
  
  // Gestion des photos - Version simplifiée
  let photoUrl = null;
  const photoField = ben.PHOTO || ben.photo || ben.PHOTO_URL;
  
  if (photoField && photoField !== 'null' && photoField !== 'undefined') {
    photoUrl = getPhotoUrl(photoField);
  }
  
  // Log de débogage
  console.log('Debug photo:', {
    id: ben.ID_BEN || ben.id,
    nom: ben.NOM_BEN,
    photoField: photoField,
    photoUrl: photoUrl
  });
  
  // Construction de l'objet normalisé
  return {
    // Identifiants
    ID_BEN: ben.ID_BEN || ben.id || 0,
    id: ben.ID_BEN || ben.id || 0,
    
    // Informations personnelles
    NOM_BEN: ben.NOM_BEN || ben.nom || '',
    PRE_BEN: ben.PRE_BEN || ben.prenom || '',
    SEX_BEN: ben.SEX_BEN || ben.sexe || 'M',
    NAI_BEN: dateNaissance,
    AGE: age,
    
    // Contact
    TELEPHONE_MOBILE: ben.TELEPHONE_MOBILE || ben.telephone_mobile || ben.telephone || '',
    EMAIL: ben.EMAIL || ben.email || '',
    
    // Profession
    PROFESSION: ben.PROFESSION || ben.profession || '',
    EMPLOYEUR: ben.EMPLOYEUR || ben.employeur || 'Non spécifié',
    
    // Statut
    STATUT_ACE: ben.STATUT_ACE || ben.statut_ace || '',
    ID_ASSURE_PRINCIPAL: ben.ID_ASSURE_PRINCIPAL || ben.id_assure_principal || null,
    
    // Photo - URL complète
    photo: photoUrl,
    
    // Autres champs (simplifiés)
    IDENTIFIANT_NATIONAL: ben.IDENTIFIANT_NATIONAL || ben.identifiant_national || '',
    ZONE_HABITATION: ben.ZONE_HABITATION || ben.zone_habitation || '',
    
    TYPE_HABITAT: ben.TYPE_HABITAT || '',
    
    // ==============================================
    // INFORMATIONS MÉDICALES (pour dossier médical)
    // ==============================================
    GROUPE_SANGUIN: ben.GROUPE_SANGUIN || '',
    ANTECEDENTS_MEDICAUX: ben.ANTECEDENTS_MEDICAUX || '',
    ALLERGIES: ben.ALLERGIES || '',
    TRAITEMENTS_EN_COURS: ben.TRAITEMENTS_EN_COURS || '',
    
    // Contact d'urgence
    CONTACT_URGENCE: ben.CONTACT_URGENCE || '',
    TEL_URGENCE: ben.TEL_URGENCE || '',
    
    // ==============================================
    // INFORMATIONS SOCIO-CULTURELLES
    // ==============================================
    NIVEAU_ETUDE: ben.NIVEAU_ETUDE || '',
    RELIGION: ben.RELIGION || '',
    LANGUE_MATERNEL: ben.LANGUE_MATERNEL || '',
    LANGUE_PARLEE: ben.LANGUE_PARLEE || '',
    SALAIRE: ben.SALAIRE || null,
    
    // ==============================================
    // ACCESSIBILITÉ ET TRANSPORT
    // ==============================================
    ACCES_EAU: ben.ACCES_EAU !== undefined ? ben.ACCES_EAU : true,
    ACCES_ELECTRICITE: ben.ACCES_ELECTRICITE !== undefined ? ben.ACCES_ELECTRICITE : true,
    DISTANCE_CENTRE_SANTE: ben.DISTANCE_CENTRE_SANTE || 0,
    MOYEN_TRANSPORT: ben.MOYEN_TRANSPORT || '',
    
    // ==============================================
    // INFORMATIONS D'ASSURANCE
    // ==============================================
    ASSURANCE_PRIVE: ben.ASSURANCE_PRIVE || ben.assurance_prive || false,
    
    MUTUELLE: ben.MUTUELLE || ben.mutuelle || '',
    
    // ==============================================
    // PHOTOGRAPHIE - CHAMPS UNIFIÉS
    // ==============================================
    PHOTO: photoUrl,           // URL complète de la photo
    PHOTO_URL: photoUrl,       // URL complète (primaire)
    PHOTO_FILENAME: photoField, // Nom de fichier original
    
    // ==============================================
    // MÉTADONNÉES DE GESTION
    // ==============================================
    COD_CREUTIL: ben.COD_CREUTIL || 'SYSTEM',
    COD_MODUTIL: ben.COD_MODUTIL || 'SYSTEM',
    DAT_CREUTIL: ben.DAT_CREUTIL || '',
    DAT_MODUTIL: ben.DAT_MODUTIL || '',
    
    // ==============================================
    // CHAMPS UTILITAIRES POUR L'AFFICHAGE
    // ==============================================
    
    // Format d'affichage de la date de naissance
    date_naissance_formatted: formatDate(dateNaissance),
    
    // Statut ACE formaté pour l'affichage
    statut_ace_formatted: !(ben.STATUT_ACE || ben.statut_ace) ? 'Assuré Principal' : 
                         ben.STATUT_ACE === 'CONJOINT' ? 'Conjoint' :
                         ben.STATUT_ACE === 'ENFANT' ? 'Enfant' :
                         ben.STATUT_ACE === 'ASCENDANT' ? 'Ascendant' : 'Ayant droit',
    
    // Indicateur booléen pour assuré principal
    is_assure_principal: !ben.STATUT_ACE || ben.STATUT_ACE === '' || ben.STATUT_ACE === null,
    
    // Groupe sanguin formaté
    groupe_sanguin_formatted: ben.GROUPE_SANGUIN ? `${ben.GROUPE_SANGUIN}` : 'Non spécifié',
    
    // Assurance privée formatée
    assurance_prive_formatted: (ben.ASSURANCE_PRIVE || ben.assurance_prive) ? 'Oui' : 'Non'
  };
  
  return beneficiaireNormalise;

  console.log('Données brutes du backend:', beneficiairesList);
console.log('URLs de photos générées:', normalizedBeneficiaires.map(b => ({
  nom: b.NOM_BEN,
  photoUrl: b.PHOTO
})));
});
      setBeneficiaires(normalizedBeneficiaires);
      
      // Mettre à jour les assurés principaux (pour le dropdown du formulaire)
      if (normalizedBeneficiaires.length > 0) {
        const assures = normalizedBeneficiaires
          .filter(ben => !ben.STATUT_ACE || ben.STATUT_ACE === '' || ben.STATUT_ACE === null)
          .map(assure => ({
            id: assure.ID_BEN || assure.id,
            nom: assure.NOM_BEN || assure.nom,
            prenom: assure.PRE_BEN || assure.prenom,
            nom_marital: assure.FIL_BEN || assure.nom_marital,
            sexe: assure.SEX_BEN || assure.sexe,
            telephone: assure.TELEPHONE_MOBILE || assure.TELEPHONE || assure.telephone,
            identifiant_national: assure.IDENTIFIANT_NATIONAL || assure.identifiant_national,
            age: assure.AGE || calculateAge(assure.NAI_BEN || assure.date_naissance),
            employeur: assure.EMPLOYEUR || assure.employeur,
            photo: assure.PHOTO || assure.photo || assure.PHOTO_URL
          }));
        
        console.log('Assurés principaux mis à jour:', assures.length); // Debug
        setAssuresPrincipaux(assures);
      } else {
        setAssuresPrincipaux([]);
      }
      
      showNotification(
        `Chargement réussi: ${normalizedBeneficiaires.length} bénéficiaire(s) trouvé(s)`,
        'success'
      );
      
    } else {
      showNotification(
        response.message || 'Erreur lors du chargement des bénéficiaires', 
        'error'
      );
      setBeneficiaires([]);
      setAssuresPrincipaux([]);
    }
  } catch (error) {
    console.error('Erreur chargement bénéficiaires:', error);
    showNotification(
      error.message || 'Erreur de connexion avec le serveur', 
      'error'
    );
    setBeneficiaires([]);
    setAssuresPrincipaux([]);
  } finally {
    setLoading(false);
  }
}, [searchTerm, advancedFilters]);



  // ==============================================
  // FONCTIONS POUR LA SYNCHRONISATION
  // ==============================================
  const handleSyncData = async () => {
    if (!window.confirm('Voulez-vous synchroniser les données avec le serveur? Cette opération peut prendre quelques minutes.')) {
      return;
    }

    try {
      setSyncing(true);
      setSyncResult(null);
      setSyncProgress(0);
      setSyncDetails([]);
      
      showNotification('Début de la synchronisation des données...', 'info');
      
      // Simuler une progression pour l'utilisateur
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);
      
      // Appeler l'API de synchronisation
      const response = await syncAPI.syncAceData();
      
      clearInterval(progressInterval);
      setSyncProgress(100);
      
      if (response.success) {
        setSyncResult(response);
        setSyncDetails(response.details || []);
        setShowSyncResults(true);
        
        showNotification(
          response.message || 'Synchronisation terminée avec succès',
          'success'
        );
        
        // Recharger les bénéficiaires après synchronisation
        await loadBeneficiaires();
        
        // Mettre à jour les détails de synchronisation
        if (response.results && Array.isArray(response.results)) {
          setSyncDetails(response.results.map(result => ({
            table: result.table,
            records: result.records,
            added: result.added || 0,
            updated: result.updated || 0,
            errors: result.errors || 0
          })));
        }
        
      } else {
        setSyncResult(response);
        setShowSyncResults(true);
        showNotification(
          response.message || 'Erreur lors de la synchronisation',
          'error'
        );
      }
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      showNotification(
        error.message || 'Erreur de connexion lors de la synchronisation',
        'error'
      );
      setSyncResult({
        success: false,
        message: error.message,
        errors: [error.message]
      });
      setShowSyncResults(true);
    } finally {
      setSyncing(false);
      setSyncProgress(0);
    }
  };

  // ==============================================
  // FONCTIONS POUR LES DONNÉES MÉDICALES
  // ==============================================
  const loadMedicalData = async (beneficiaireId) => {
    try {
      setLoadingMedical(true);
      
      const [allergiesRes, antecedentsRes, notesRes] = await Promise.all([
        beneficiairesAPI.getAllergies(beneficiaireId),
        beneficiairesAPI.getAntecedents(beneficiaireId),
        beneficiairesAPI.getNotes(beneficiaireId)
      ]);
      
      setMedicalData({
        allergies: allergiesRes.success ? allergiesRes.allergies || [] : [],
        antecedents: antecedentsRes.success ? antecedentsRes.antecedents || [] : [],
        notes: notesRes.success ? notesRes.notes || [] : []
      });
      
    } catch (error) {
      console.error('Erreur chargement données médicales:', error);
      showNotification('Erreur lors du chargement des données médicales', 'error');
    } finally {
      setLoadingMedical(false);
    }
  };

  const handleAddAllergie = async () => {
    if (!selectedBeneficiaireForMedical) return;
    
    try {
      setSaving(true);
      const response = await beneficiairesAPI.addAllergie(
        selectedBeneficiaireForMedical.ID_BEN || selectedBeneficiaireForMedical.id,
        medicalFormData.allergie
      );
      
      if (response.success) {
        showNotification('Allergie ajoutée avec succès', 'success');
        setShowAllergieForm(false);
        setMedicalFormData(prev => ({ ...prev, allergie: {
          TYPE_ALLERGIE: '',
          ALLERGENE: '',
          REACTION: '',
          GRAVITE: '',
          TRAITEMENT_URGENCE: '',
          OBSERVATIONS: ''
        }}));
        await loadMedicalData(selectedBeneficiaireForMedical.ID_BEN || selectedBeneficiaireForMedical.id);
      } else {
        showNotification(response.message || 'Erreur lors de l\'ajout de l\'allergie', 'error');
      }
    } catch (error) {
      console.error('Erreur ajout allergie:', error);
      showNotification('Erreur lors de l\'ajout de l\'allergie', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAntecedent = async () => {
    if (!selectedBeneficiaireForMedical) return;
    
    try {
      setSaving(true);
      const response = await beneficiairesAPI.addAntecedent(
        selectedBeneficiaireForMedical.ID_BEN || selectedBeneficiaireForMedical.id,
        medicalFormData.antecedent
      );
      
      if (response.success) {
        showNotification('Antécédent ajouté avec succès', 'success');
        setShowAntecedentForm(false);
        setMedicalFormData(prev => ({ ...prev, antecedent: {
          TYPE_ANTECEDENT: '',
          DESCRIPTION: '',
          GRAVITE: '',
          TRAITEMENT: '',
          OBSERVATIONS: ''
        }}));
        await loadMedicalData(selectedBeneficiaireForMedical.ID_BEN || selectedBeneficiaireForMedical.id);
      } else {
        showNotification(response.message || 'Erreur lors de l\'ajout de l\'antécédent', 'error');
      }
    } catch (error) {
      console.error('Erreur ajout antécédent:', error);
      showNotification('Erreur lors de l\'ajout de l\'antécédent', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedBeneficiaireForMedical) return;
    
    try {
      setSaving(true);
      const response = await beneficiairesAPI.addNote(
        selectedBeneficiaireForMedical.ID_BEN || selectedBeneficiaireForMedical.id,
        medicalFormData.note
      );
      
      if (response.success) {
        showNotification('Note ajoutée avec succès', 'success');
        setShowNoteForm(false);
        setMedicalFormData(prev => ({ ...prev, note: {
          TYPE_NOTE: '',
          CONTENU: '',
          URGENT: false,
          RESTREINT: false
        }}));
        await loadMedicalData(selectedBeneficiaireForMedical.ID_BEN || selectedBeneficiaireForMedical.id);
      } else {
        showNotification(response.message || 'Erreur lors de l\'ajout de la note', 'error');
      }
    } catch (error) {
      console.error('Erreur ajout note:', error);
      showNotification('Erreur lors de l\'ajout de la note', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ==============================================
  // FONCTIONS POUR GÉNÉRER LES QR CODES
  // ==============================================
  const generateQRCode = async (text, size = 200) => {
    try {
      // Utilisation d'une API externe pour générer le QR Code
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
      return qrCodeUrl;
    } catch (error) {
      console.error('Erreur génération QR Code:', error);
      // Fallback: générer un QR code simple via canvas
      return generateSimpleQRCode(text, size);
    }
  };

  const generateSimpleQRCode = (text, size = 200) => {
    // Créer un canvas pour le QR code simple
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Fond blanc
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);
    
    // Dessiner un QR code simple (carrés noirs)
    ctx.fillStyle = 'black';
    const data = text;
    
    // Position des marqueurs
    const markerSize = 7;
    const cellSize = (size - 20) / 21; // 21 cellules pour un QR code simple
    
    // Marqueurs supérieur gauche, supérieur droit, inférieur gauche
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        // Marqueur supérieur gauche
        if ((i === 0 || i === 6 || j === 0 || j === 6) || 
            (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          ctx.fillRect(10 + i * cellSize, 10 + j * cellSize, cellSize, cellSize);
        }
        
        // Marqueur supérieur droit
        if ((i === 14 || i === 20 || j === 0 || j === 6) || 
            (i >= 16 && i <= 18 && j >= 2 && j <= 4)) {
          ctx.fillRect(10 + i * cellSize, 10 + j * cellSize, cellSize, cellSize);
        }
        
        // Marqueur inférieur gauche
        if ((i === 0 || i === 6 || j === 14 || j === 20) || 
            (i >= 2 && i <= 4 && j >= 16 && j <= 18)) {
          ctx.fillRect(10 + i * cellSize, 10 + j * cellSize, cellSize, cellSize);
        }
      }
    }
    
    return canvas.toDataURL();
  };

 const getBeneficiaryQRCodeData = (beneficiaire) => {
  // Données à encoder dans le QR code
  const data = {
    id: beneficiaire.ID_BEN || beneficiaire.id,
    identifiant_national: beneficiaire.IDENTIFIANT_NATIONAL || '',
    employeur: beneficiaire.EMPLOYEUR || '',
    nom: beneficiaire.NOM_BEN || '',
    prenom: beneficiaire.PRE_BEN || '',
    date_naissance: beneficiaire.NAI_BEN || '',
    sexe: beneficiaire.SEX_BEN || '',
    telephone: beneficiaire.TELEPHONE_MOBILE || '',
    type: beneficiaire.STATUT_ACE ? 'Ayant droit' : 'Assuré principal',
    statut_ace: beneficiaire.STATUT_ACE || '',
    timestamp: new Date().toISOString()
  };
  
  return JSON.stringify(data);
};

  const loadQRCode = async (beneficiaire) => {
    if (!beneficiaire) return null;
    
    const cacheKey = beneficiaire.ID_BEN || beneficiaire.id;
    
    // Vérifier si le QR code est déjà en cache
    if (qrCodeUrls[cacheKey]) {
      return qrCodeUrls[cacheKey];
    }
    
    try {
      const qrData = getBeneficiaryQRCodeData(beneficiaire);
      const qrCodeUrl = await generateQRCode(qrData, 200);
      
      // Mettre en cache
      setQrCodeUrls(prev => ({
        ...prev,
        [cacheKey]: qrCodeUrl
      }));
      
      return qrCodeUrl;
    } catch (error) {
      console.error('Erreur chargement QR code:', error);
      return null;
    }
  };

  // ==============================================
  // FONCTIONS POUR LES CARTES
  // ==============================================
  const loadCartes = async (beneficiaireId) => {
    try {
      setLoadingCartes(true);
      const response = await beneficiairesAPI.getCartes(beneficiaireId);
      
      if (response.success) {
        setCartes(response.cartes || []);
      } else {
        showNotification(response.message || 'Erreur lors du chargement des cartes', 'error');
        setCartes([]);
      }
    } catch (error) {
      console.error('Erreur chargement cartes:', error);
      showNotification('Erreur lors du chargement des cartes', 'error');
      setCartes([]);
    } finally {
      setLoadingCartes(false);
    }
  };

  const validateCarteNumberFormat = (numCar) => {
    const regex = /^[A-Z]{3}-[A-Z]{3}-\d{4}-\d{5}(-\d{3})?$/;
    return regex.test(numCar);
  };

  const handleCloseCarteForm = () => {
    setShowCarteForm(false);
    setEditingCarte(null);
    setCarteFormData({
      COD_PAY: '',
      COD_CAR: '',
      NUM_CAR: '',
      NOM_BEN: '',
      PRE_BEN: '',
      NAI_BEN: '',
      SEX_BEN: '',
      SOC_BEN: '',
      NAG_ASS: '',
      PRM_BEN: '',
      DDV_CAR: '',
      DFV_CAR: '',
      DAT_EMP: '',
      DAT_BIO: '',
      STS_CAR: 1
    });
    setCarteErrors({});
  };

  const handleCarteInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let finalValue;
    if (type === 'checkbox') {
      finalValue = checked;
    } else if (type === 'number') {
      finalValue = value === '' ? null : parseFloat(value);
    } else {
      finalValue = value;
    }
    
    setCarteFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
    
    if (carteErrors[name]) {
      setCarteErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateCarteForm = () => {
    const errors = {};
    
    if (!carteFormData.COD_PAY.trim()) errors.COD_PAY = 'Le code pays est requis';
    if (!carteFormData.COD_CAR.trim()) errors.COD_CAR = 'Le type de carte est requis';
    if (!carteFormData.NUM_CAR.trim()) errors.NUM_CAR = 'Le numéro de carte est requis';
    if (!carteFormData.DDV_CAR) errors.DDV_CAR = 'La date de début de validité est requise';
    if (!carteFormData.DFV_CAR) errors.DFV_CAR = 'La date de fin de validité est requise';
    
    if (carteFormData.NUM_CAR && !validateCarteNumberFormat(carteFormData.NUM_CAR)) {
      errors.NUM_CAR = 'Format de numéro de carte invalide. Format attendu: CMR-PRM-2412-00001';
    }
    
    if (carteFormData.DDV_CAR && carteFormData.DFV_CAR) {
      const ddvCar = new Date(carteFormData.DDV_CAR);
      const dfvCar = new Date(carteFormData.DFV_CAR);
      
      if (ddvCar > dfvCar) {
        errors.DFV_CAR = 'La date de fin doit être postérieure à la date de début';
      }
    }
    
    setCarteErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleDeleteCarte = async (carte) => {
    if (!selectedBeneficiaireForCartes) return;
    
    if (!window.confirm(`Confirmer la suppression de la carte ${carte.NUM_CAR} ?`)) {
      return;
    }
    
    try {
      const response = await beneficiairesAPI.deleteCarte(
        selectedBeneficiaireForCartes.ID_BEN || selectedBeneficiaireForCartes.id,
        {
          COD_PAY: carte.COD_PAY,
          COD_CAR: carte.COD_CAR,
          NUM_CAR: carte.NUM_CAR
        }
      );
      
      if (response.success) {
        showNotification('Carte supprimée avec succès', 'success');
        // Recharger les cartes
        await loadCartes(selectedBeneficiaireForCartes.ID_BEN || selectedBeneficiaireForCartes.id);
      } else {
        showNotification(response.message || 'Erreur lors de la suppression de la carte', 'error');
      }
    } catch (error) {
      console.error('Erreur suppression carte:', error);
      showNotification('Erreur lors de la suppression de la carte', 'error');
    }
  };

  const generateCarteNumber = (beneficiaire, carteType = 'PRM') => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const beneficiaireId = beneficiaire.ID_BEN || beneficiaire.id || 0;
    const sequential = beneficiaireId.toString().padStart(5, '0');
    
    return `CMR-${carteType}-${year}${month}-${sequential}`;
  };

  const handleOpenCarteForm = async (beneficiaire, carte = null) => {
    setSelectedBeneficiaireForCartes(beneficiaire);
    
    if (carte) {
      setEditingCarte({
        COD_PAY: carte.COD_PAY,
        COD_CAR: carte.COD_CAR,
        NUM_CAR: carte.NUM_CAR
      });
      setCarteFormData({
        COD_PAY: carte.COD_PAY,
        COD_CAR: carte.COD_CAR,
        NUM_CAR: carte.NUM_CAR,
        NOM_BEN: carte.NOM_BEN || beneficiaire.NOM_BEN || '',
        PRE_BEN: carte.PRE_BEN || beneficiaire.PRE_BEN || '',
        NAI_BEN: carte.NAI_BEN || beneficiaire.NAI_BEN || '',
        SEX_BEN: carte.SEX_BEN || beneficiaire.SEX_BEN || 'M',
        SOC_BEN: carte.SOC_BEN || '',
        NAG_ASS: carte.NAG_ASS || '',
        PRM_BEN: carte.PRM_BEN || '',
        DDV_CAR: carte.DDV_CAR || new Date().toISOString().split('T')[0],
        DFV_CAR: carte.DFV_CAR || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        DAT_EMP: carte.DAT_EMP || new Date().toISOString().split('T')[0],
        DAT_BIO: carte.DAT_BIO || '',
        STS_CAR: carte.STS_CAR !== undefined ? carte.STS_CAR : 1
      });
    } else {
      setEditingCarte(null);
      const carteNumber = generateCarteNumber(beneficiaire, 'PRM');
      
      setCarteFormData({
        COD_PAY: 'CMR',
        COD_CAR: 'PRM',
        NUM_CAR: carteNumber,
        NOM_BEN: beneficiaire.NOM_BEN || '',
        PRE_BEN: beneficiaire.PRE_BEN || '',
        NAI_BEN: beneficiaire.NAI_BEN || '',
        SEX_BEN: beneficiaire.SEX_BEN || 'M',
        SOC_BEN: '',
        NAG_ASS: '',
        PRM_BEN: '',
        DDV_CAR: new Date().toISOString().split('T')[0],
        DFV_CAR: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        DAT_EMP: new Date().toISOString().split('T')[0],
        DAT_BIO: '',
        STS_CAR: 1
      });
    }
    
    setShowCarteForm(true);
    setCarteErrors({});
  };

  // ==============================================
  // FONCTIONS POUR LES FAMILLES ACE
  // ==============================================
  const loadBeneficiairesDisponibles = useCallback(async (assurePrincipalId) => {
    try {
      setLoadingBeneficiaires(true);
      
      const response = await beneficiairesAPI.searchAdvanced('', {}, 500, 1);
      
      if (response.success) {
        const beneficiairesList = Array.isArray(response.beneficiaires) 
          ? response.beneficiaires 
          : (response.data || []);
        
        const filteredBeneficiaires = beneficiairesList.filter(ben => {
          const benId = ben.ID_BEN || ben.id;
          const statutAce = ben.STATUT_ACE || ben.statut_ace;
          const idAssurePrincipal = ben.ID_ASSURE_PRINCIPAL || ben.id_assure_principal;
          
          if (benId === assurePrincipalId) return false;
          if (idAssurePrincipal && idAssurePrincipal !== assurePrincipalId) return false;
          if (statutAce && statutAce !== '' && statutAce !== null) return false;
          
          return true;
        });
        
        const formattedBeneficiaires = filteredBeneficiaires.map(ben => ({
          id: ben.ID_BEN || ben.id,
          nom: ben.NOM_BEN || ben.nom || '',
          prenom: ben.PRE_BEN || ben.prenom || '',
          nom_marital: ben.FIL_BEN || ben.nom_marital || '',
          sexe: ben.SEX_BEN || ben.sexe || 'M',
          identifiant_national: ben.IDENTIFIANT_NATIONAL || ben.identifiant_national || '',
          telephone: ben.TELEPHONE_MOBILE || ben.TELEPHONE || ben.telephone || '',
          age: ben.AGE || calculateAge(ben.NAI_BEN || ben.date_naissance),
          profession: ben.PROFESSION || ben.profession || '',
          employeur: ben.EMPLOYEUR || ben.employeur || 'Non spécifié',
          photo: ben.PHOTO || null
        }));
        
        setBeneficiairesDisponibles(formattedBeneficiaires);
      } else {
        setBeneficiairesDisponibles([]);
      }
    } catch (error) {
      console.error('Erreur chargement bénéficiaires disponibles:', error);
      showNotification('Erreur lors du chargement des bénéficiaires disponibles', 'error');
      setBeneficiairesDisponibles([]);
    } finally {
      setLoadingBeneficiaires(false);
    }
  }, []);

  const handleOpenFamilleModal = async (assure) => {
    try {
      setSelectedAssureForFamille(assure);
      setShowFamille(true);
      await loadCompositionFamiliale(assure.ID_BEN || assure.id);
      await loadBeneficiairesDisponibles(assure.ID_BEN || assure.id);
    } catch (error) {
      console.error('Erreur ouverture composition familiale:', error);
      showNotification('Erreur lors de l\'ouverture de la composition familiale', 'error');
    }
  };

  const loadCompositionFamiliale = async (assureId) => {
    try {
      setLoadingFamille(true);
      const response = await famillesACEAPI.getComposition(assureId);
      
      if (response.success) {
        setCompositionFamiliale(response.composition || []);
      } else {
        showNotification(response.message || 'Erreur lors du chargement de la composition familiale', 'error');
        setCompositionFamiliale([]);
      }
    } catch (error) {
      console.error('Erreur chargement composition familiale:', error);
      showNotification('Erreur lors du chargement de la composition familiale', 'error');
      setCompositionFamiliale([]);
    } finally {
      setLoadingFamille(false);
    }
  };

  const handleAddAyantDroit = async () => {
    if (!selectedAssureForFamille || !ayantDroitFormData.ID_AYANT_DROIT) return;
    
    try {
      setSaving(true);
      const response = await famillesACEAPI.addAyantDroit(
        selectedAssureForFamille.ID_BEN || selectedAssureForFamille.id,
        ayantDroitFormData
      );
      
      if (response.success) {
        showNotification('Ayant droit ajouté avec succès', 'success');
        setShowAddAyantDroitForm(false);
        setAyantDroitFormData({
          ID_AYANT_DROIT: '',
          TYPE_AYANT_DROIT: '',
          DATE_MARIAGE: '',
          LIEU_MARIAGE: '',
          NUM_ACTE_MARIAGE: ''
        });
        await loadCompositionFamiliale(selectedAssureForFamille.ID_BEN || selectedAssureForFamille.id);
        await loadBeneficiairesDisponibles(selectedAssureForFamille.ID_BEN || selectedAssureForFamille.id);
      } else {
        showNotification(response.message || 'Erreur lors de l\'ajout de l\'ayant droit', 'error');
      }
    } catch (error) {
      console.error('Erreur ajout ayant droit:', error);
      showNotification('Erreur lors de l\'ajout de l\'ayant droit', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ==============================================
  // FONCTIONS POUR LE DOSSIER MÉDICAL COMPLET
  // ==============================================
  const handleOpenDossierMedical = async (beneficiaire) => {
    try {
      setSelectedBeneficiaireForMedical(beneficiaire);
      setShowMedicalData(true);
      await loadMedicalData(beneficiaire.ID_BEN || beneficiaire.id);
    } catch (error) {
      console.error('Erreur ouverture dossier médical:', error);
      showNotification('Erreur lors de l\'ouverture du dossier médical', 'error');
    }
  };

  // ==============================================
  // FONCTIONS POUR LE FORMULAIRE BÉNÉFICIAIRE (AVEC PHOTO)
  // ==============================================
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let finalValue;
    if (type === 'checkbox') {
      finalValue = checked;
    } else if (type === 'number') {
      finalValue = value === '' ? null : parseFloat(value);
    } else {
      finalValue = value;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
    
    // Validation en temps réel pour les champs obligatoires
    if (['NOM_BEN', 'PRE_BEN', 'SEX_BEN', 'NAI_BEN', 'TELEPHONE_MOBILE'].includes(name)) {
      const trimmedValue = finalValue ? finalValue.toString().trim() : '';
      
      if (!trimmedValue && name in validationErrors) {
        setValidationErrors(prev => ({ ...prev, [name]: '' }));
      } else if (!trimmedValue) {
        setValidationErrors(prev => ({ 
          ...prev, 
          [name]: `${name.replace('_', ' ')} est requis` 
        }));
      } else {
        setValidationErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
    
    if (name === 'STATUT_ACE') {
      if (finalValue === '') {
        setFormData(prev => ({
          ...prev,
          ID_ASSURE_PRINCIPAL: null
        }));
        setShowAssureDropdown(false);
      }
    }
  };

  // Gestion du changement de photo
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('La photo ne doit pas dépasser 5MB', 'error');
        return;
      }
      
      // Vérifier le type de fichier
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        showNotification('Format de photo invalide. Utilisez JPEG, PNG ou GIF', 'error');
        return;
      }
      
      setPhotoFile(file);
      
      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Suppression de la photo
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (existingPhotoUrl) {
      setExistingPhotoUrl(null);
    }
  };

  const handleSelectAssure = (assure) => {
    setFormData(prev => ({
      ...prev,
      ID_ASSURE_PRINCIPAL: assure.id
    }));
    setShowAssureDropdown(false);
    
    if (validationErrors.ID_ASSURE_PRINCIPAL) {
      setValidationErrors(prev => ({ ...prev, ID_ASSURE_PRINCIPAL: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Vérification stricte des champs obligatoires
    if (!formData.NOM_BEN || formData.NOM_BEN.trim() === '') {
      errors.NOM_BEN = 'Le nom est requis';
    }
    if (!formData.PRE_BEN || formData.PRE_BEN.trim() === '') {
      errors.PRE_BEN = 'Le prénom est requis';
    }
    if (!formData.SEX_BEN || formData.SEX_BEN.trim() === '') {
      errors.SEX_BEN = 'Le sexe est requis';
    }
    if (!formData.NAI_BEN) {
      errors.NAI_BEN = 'La date de naissance est requise';
    }
    if (!formData.TELEPHONE_MOBILE || formData.TELEPHONE_MOBILE.trim() === '') {
      errors.TELEPHONE_MOBILE = 'Le téléphone mobile est requis';
    }
    
    // Validation des dates
    if (formData.NAI_BEN) {
      const birthDate = new Date(formData.NAI_BEN);
      const today = new Date();
      
      if (birthDate > today) {
        errors.NAI_BEN = 'La date de naissance ne peut pas être dans le futur';
      }
    }
    
    // Validation du téléphone
    const phoneRegex = /^[\d\s\+\(\)\-]{8,20}$/;
    if (formData.TELEPHONE_MOBILE && !phoneRegex.test(formData.TELEPHONE_MOBILE.replace(/\s/g, ''))) {
      errors.TELEPHONE_MOBILE = 'Numéro de téléphone invalide';
    }
    
    // Validation de l'assuré principal pour les ayants droit
    if (formData.STATUT_ACE && formData.STATUT_ACE !== '') {
      if (!formData.ID_ASSURE_PRINCIPAL) {
        errors.ID_ASSURE_PRINCIPAL = 'L\'assuré principal est requis pour les ayants droit';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

 const handleSave = async () => {
  // Vérification manuelle renforcée des champs obligatoires
  const requiredFieldsCheck = {
    'NOM_BEN': formData.NOM_BEN,
    'PRE_BEN': formData.PRE_BEN,
    'SEX_BEN': formData.SEX_BEN,
    'NAI_BEN': formData.NAI_BEN,
    'TELEPHONE_MOBILE': formData.TELEPHONE_MOBILE
  };
  
  let hasError = false;
  Object.entries(requiredFieldsCheck).forEach(([field, value]) => {
    const trimmedValue = value ? value.toString().trim() : '';
    
    if (!value || trimmedValue === '') {
      showNotification(`Le champ ${field.replace('_', ' ').toLowerCase()} est requis`, 'error');
      hasError = true;
      setValidationErrors(prev => ({ ...prev, [field]: 'Ce champ est requis' }));
    }
  });
  
  if (hasError) {
    setSaving(false);
    return;
  }
  
  if (!validateForm()) {
    showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
    setSaving(false);
    return;
  }
  
  setSaving(true);

  try {
    let identifiantNational = formData.IDENTIFIANT_NATIONAL;
    
    if (!editingId && !identifiantNational) {
      identifiantNational = genererIdentifiantNationalSequential();
    }
    
    // CRÉATION DES DONNÉES AVEC LES CHAMPS OBLIGATOIRES BIEN FORMATÉS
    const dataToSend = {
      // CHAMPS OBLIGATOIRES
      NOM_BEN: formData.NOM_BEN.trim(),
      PRE_BEN: formData.PRE_BEN.trim(),
      SEX_BEN: formData.SEX_BEN,
      NAI_BEN: formData.NAI_BEN, // Format YYYY-MM-DD déjà géré par input type="date"
      TELEPHONE_MOBILE: formData.TELEPHONE_MOBILE.trim(),
      
      // CHAMPS OPTIONNELS
      FIL_BEN: formData.FIL_BEN?.trim() || null,
      LIEU_NAISSANCE: formData.LIEU_NAISSANCE?.trim() || null,
      IDENTIFIANT_NATIONAL: identifiantNational || null,
      NUM_PASSEPORT: formData.NUM_PASSEPORT?.trim() || null,
      TELEPHONE: formData.TELEPHONE?.trim() || null,
      EMAIL: formData.EMAIL?.trim() || null,
      PROFESSION: formData.PROFESSION?.trim() || null,
      EMPLOYEUR: formData.EMPLOYEUR?.trim() || null,
      SITUATION_FAMILIALE: formData.SITUATION_FAMILIALE || null,
      NOMBRE_ENFANTS: formData.NOMBRE_ENFANTS || 0,
      GROUPE_SANGUIN: formData.GROUPE_SANGUIN || null,
      ANTECEDENTS_MEDICAUX: formData.ANTECEDENTS_MEDICAUX?.trim() || null,
      ALLERGIES: formData.ALLERGIES?.trim() || null,
      TRAITEMENTS_EN_COURS: formData.TRAITEMENTS_EN_COURS?.trim() || null,
      CONTACT_URGENCE: formData.CONTACT_URGENCE?.trim() || null,
      TEL_URGENCE: formData.TEL_URGENCE?.trim() || null,
      COD_PAY: formData.COD_PAY || 'CMR',
      COD_REGION: formData.COD_REGION || null,
      CODE_TRIBAL: formData.CODE_TRIBAL?.trim() || null,
      ZONE_HABITATION: formData.ZONE_HABITATION?.trim() || null,
      TYPE_HABITAT: formData.TYPE_HABITAT?.trim() || null,
      NIVEAU_ETUDE: formData.NIVEAU_ETUDE?.trim() || null,
      RELIGION: formData.RELIGION?.trim() || null,
      LANGUE_MATERNEL: formData.LANGUE_MATERNEL?.trim() || null,
      LANGUE_PARLEE: formData.LANGUE_PARLEE?.trim() || null,
      SALAIRE: formData.SALAIRE || null,
      MUTUELLE: formData.MUTUELLE?.trim() || null,
      STATUT_ACE: formData.STATUT_ACE || null,
      ID_ASSURE_PRINCIPAL: formData.ID_ASSURE_PRINCIPAL || null,
      ACCES_EAU: formData.ACCES_EAU !== undefined ? formData.ACCES_EAU : true,
      ACCES_ELECTRICITE: formData.ACCES_ELECTRICITE !== undefined ? formData.ACCES_ELECTRICITE : true,
      DISTANCE_CENTRE_SANTE: formData.DISTANCE_CENTRE_SANTE || 0,
      MOYEN_TRANSPORT: formData.MOYEN_TRANSPORT?.trim() || null,
      ASSURANCE_PRIVE: formData.ASSURANCE_PRIVE || false,
      COD_CREUTIL: 'SYSTEM',
      COD_MODUTIL: 'SYSTEM'
    };
    
    let response;
    
    if (editingId) {
      // MISE À JOUR - Utiliser FormData si photo présente
      const formDataToSend = new FormData();
      
      // Ajouter les données JSON
      formDataToSend.append('data', JSON.stringify(dataToSend));
      
      // Ajouter la photo si elle existe
      if (photoFile) {
        formDataToSend.append('photo', photoFile);
      }
      
      response = await beneficiairesAPI.update(editingId, formDataToSend);
    } else {
      // CRÉATION - Utiliser FormData si photo présente
      const formDataToSend = new FormData();
      
      // Ajouter les données JSON
      formDataToSend.append('data', JSON.stringify(dataToSend));
      
      // Ajouter la photo si elle existe
      if (photoFile) {
        formDataToSend.append('photo', photoFile);
      }
      
      response = await beneficiairesAPI.create(formDataToSend);
    }

    if (response.success) {
      showNotification(
        editingId 
          ? 'Bénéficiaire mis à jour avec succès' 
          : 'Bénéficiaire créé avec succès',
        'success'
      );
      
      resetForm();
      await loadBeneficiaires();
    } else {
      showNotification(
        response.message || 'Erreur lors de la sauvegarde',
        'error'
      );
    }
    
  } catch (error) {
    console.error('Erreur dans handleSave:', error);
    showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
  } finally {
    setSaving(false);
  }
};

const handleSaveCarte = async () => {
  if (!selectedBeneficiaireForCartes) return;
  
  if (!validateCarteForm()) {
    showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
    return;
  }
  
  setSaving(true);
  
  try {
    const carteData = {
      ...carteFormData,
      ID_BEN: selectedBeneficiaireForCartes.ID_BEN || selectedBeneficiaireForCartes.id
    };
    
    let response;
    if (editingCarte) {
      response = await beneficiairesAPI.updateCarte(carteData);
    } else {
      response = await beneficiairesAPI.createCarte(carteData);
    }
    
    if (response.success) {
      showNotification(
        editingCarte 
          ? 'Carte mise à jour avec succès' 
          : 'Carte créée avec succès',
        'success'
      );
      handleCloseCarteForm();
      await loadCartes(selectedBeneficiaireForCartes.ID_BEN || selectedBeneficiaireForCartes.id);
    } else {
      showNotification(response.message || 'Erreur lors de la sauvegarde', 'error');
    }
  } catch (error) {
    console.error('Erreur sauvegarde carte:', error);
    showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
  } finally {
    setSaving(false);
  }
};


  const resetForm = () => {
    setFormData({
      NOM_BEN: '',
      PRE_BEN: '',
      FIL_BEN: '',
      SEX_BEN: 'M',
      NAI_BEN: '',
      LIEU_NAISSANCE: '',
      IDENTIFIANT_NATIONAL: '',
      NUM_PASSEPORT: '',
      TELEPHONE_MOBILE: '',
      TELEPHONE: '',
      EMAIL: '',
      PROFESSION: '',
      EMPLOYEUR: '',
      SITUATION_FAMILIALE: '',
      NOMBRE_ENFANTS: 0,
      GROUPE_SANGUIN: '',
      ANTECEDENTS_MEDICAUX: '',
      ALLERGIES: '',
      TRAITEMENTS_EN_COURS: '',
      CONTACT_URGENCE: '',
      TEL_URGENCE: '',
      COD_PAY: 'CMR',
      COD_REGION: null,
      CODE_TRIBAL: '',
      ZONE_HABITATION: '',
      TYPE_HABITAT: '',
      NIVEAU_ETUDE: '',
      RELIGION: '',
      LANGUE_MATERNEL: '',
      LANGUE_PARLEE: '',
      SALAIRE: null,
      MUTUELLE: '',
      STATUT_ACE: '',
      ID_ASSURE_PRINCIPAL: null,
      ACCES_EAU: true,
      ACCES_ELECTRICITE: true,
      DISTANCE_CENTRE_SANTE: 0,
      MOYEN_TRANSPORT: '',
      ASSURANCE_PRIVE: false,
      COD_CREUTIL: 'SYSTEM',
      COD_MODUTIL: 'SYSTEM'
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setExistingPhotoUrl(null);
    setEditingId(null);
    setShowForm(false);
    setValidationErrors({});
    setShowAssureDropdown(false);
  };

  const handleEdit = async (beneficiaire) => {
    try {
      const response = await beneficiairesAPI.getById(beneficiaire.id || beneficiaire.ID_BEN);
      
      if (response.success && response.beneficiaire) {
        const data = response.beneficiaire;
        
        // S'assurer que les champs obligatoires ne sont pas null
        const formDataUpdate = {
          NOM_BEN: data.NOM_BEN || '',
          PRE_BEN: data.PRE_BEN || '',
          FIL_BEN: data.FIL_BEN || '',
          SEX_BEN: data.SEX_BEN || 'M',
          NAI_BEN: data.NAI_BEN ? data.NAI_BEN.split('T')[0] : '',
          LIEU_NAISSANCE: data.LIEU_NAISSANCE || '',
          IDENTIFIANT_NATIONAL: data.IDENTIFIANT_NATIONAL || '',
          NUM_PASSEPORT: data.NUM_PASSEPORT || '',
          TELEPHONE_MOBILE: data.TELEPHONE_MOBILE || '',
          TELEPHONE: data.TELEPHONE || '',
          EMAIL: data.EMAIL || '',
          PROFESSION: data.PROFESSION || '',
          EMPLOYEUR: data.EMPLOYEUR || '',
          SITUATION_FAMILIALE: data.SITUATION_FAMILIALE || '',
          NOMBRE_ENFANTS: data.NOMBRE_ENFANTS || 0,
          GROUPE_SANGUIN: data.GROUPE_SANGUIN || '',
          ANTECEDENTS_MEDICAUX: data.ANTECEDENTS_MEDICAUX || '',
          ALLERGIES: data.ALLERGIES || '',
          TRAITEMENTS_EN_COURS: data.TRAITEMENTS_EN_COURS || '',
          CONTACT_URGENCE: data.CONTACT_URGENCE || '',
          TEL_URGENCE: data.TEL_URGENCE || '',
          COD_PAY: data.COD_PAY || 'CMR',
          COD_REGION: data.COD_REGION || null,
          CODE_TRIBAL: data.CODE_TRIBAL || '',
          ZONE_HABITATION: data.ZONE_HABITATION || '',
          TYPE_HABITAT: data.TYPE_HABITAT || '',
          NIVEAU_ETUDE: data.NIVEAU_ETUDE || '',
          RELIGION: data.RELIGION || '',
          LANGUE_MATERNEL: data.LANGUE_MATERNEL || '',
          LANGUE_PARLEE: data.LANGUE_PARLEE || '',
          SALAIRE: data.SALAIRE || null,
          MUTUELLE: data.MUTUELLE || '',
          STATUT_ACE: data.STATUT_ACE || '',
          ID_ASSURE_PRINCIPAL: data.ID_ASSURE_PRINCIPAL || null,
          ACCES_EAU: data.ACCES_EAU !== null ? data.ACCES_EAU : true,
          ACCES_ELECTRICITE: data.ACCES_ELECTRICITE !== null ? data.ACCES_ELECTRICITE : true,
          DISTANCE_CENTRE_SANTE: data.DISTANCE_CENTRE_SANTE || 0,
          MOYEN_TRANSPORT: data.MOYEN_TRANSPORT || '',
          ASSURANCE_PRIVE: data.ASSURANCE_PRIVE || false,
          COD_CREUTIL: data.COD_CREUTIL || 'SYSTEM',
          COD_MODUTIL: data.COD_MODUTIL || 'SYSTEM'
        };
        
        setFormData(formDataUpdate);
        setEditingId(data.ID_BEN || data.id);
        
        // Gérer la photo existante - UTILISATION DE getPhotoUrl
        if (data.PHOTO) {
          const photoUrl = getPhotoUrl(data.PHOTO);
          setExistingPhotoUrl(photoUrl);
          setPhotoPreview(photoUrl);
        } else {
          setExistingPhotoUrl(null);
          setPhotoPreview(null);
        }
        
        setPhotoFile(null);
        setShowForm(true);
      } else {
        showNotification('Bénéficiaire non trouvé', 'error');
      }
    } catch (error) {
      console.error('Erreur chargement bénéficiaire:', error);
      showNotification('Erreur lors du chargement du bénéficiaire', 'error');
    }
  };

  const handleDelete = async (beneficiaire) => {
    if (!window.confirm(`Confirmer la mise en retrait de ${beneficiaire.NOM_BEN} ${beneficiaire.PRE_BEN} ?`)) {
      return;
    }
    
    try {
      const response = await beneficiairesAPI.delete(beneficiaire.id || beneficiaire.ID_BEN);
      
      if (response.success) {
        showNotification('Bénéficiaire mis en retrait avec succès', 'success');
        loadBeneficiaires();
      } else {
        showNotification(response.message || 'Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };



  const getSelectedAssureName = () => {
    if (!formData.ID_ASSURE_PRINCIPAL) return null;
    
    const assure = assuresPrincipaux.find(a => a.id === formData.ID_ASSURE_PRINCIPAL);
    return assure ? `${assure.nom} ${assure.prenom}` : 'Assuré non trouvé';
  };

  // ==============================================
  // FONCTIONS POUR LA CARTE DE BÉNÉFICIAIRE (AVEC QR CODE)
  // ==============================================
  const handleOpenCard = async (beneficiaire) => {
    try {
      setSelectedBeneficiaireForCard(beneficiaire);
      setShowCard(true);
      
      // Charger le QR code
      await loadQRCode(beneficiaire);
    } catch (error) {
      console.error('Erreur ouverture carte:', error);
      showNotification('Erreur lors de l\'ouverture de la carte', 'error');
    }
  };

// Fonction pour télécharger la carte instantanément
const handleDownloadCard = async () => {
  if (!selectedBeneficiaireForCard) return;
  
  try {
    const ben = selectedBeneficiaireForCard;
    
    // Générer le QR code avec les données requises
    const qrData = getBeneficiaryQRCodeData(ben);
    const qrCodeUrl = await generateQRCode(qrData, 300);
    
    // Récupérer la photo du bénéficiaire ou utiliser un avatar
    const photoUrl = ben.PHOTO || ben.photo || ben.PHOTO_URL || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(ben.NOM_BEN + ' ' + ben.PRE_BEN)}&size=200&background=random`;
    
    // Création du conteneur temporaire pour le recto
    const tempContainerRecto = document.createElement('div');
    tempContainerRecto.style.position = 'absolute';
    tempContainerRecto.style.left = '-9999px';
    tempContainerRecto.style.top = '-9999px';
    tempContainerRecto.style.width = '1480px';
    tempContainerRecto.style.height = '1050px';
    tempContainerRecto.style.fontFamily = 'Arial, sans-serif';
    document.body.appendChild(tempContainerRecto);
    
    // HTML du recto avec photo à gauche du QR code
    const rectoHTML = `
      <div style="width: 1480px; height: 1050px; background: url(${frontBackgroundCard}) no-repeat center center; background-size: cover; border-radius: 80px; position: relative; overflow: hidden; box-shadow: 0 40px 120px rgba(0, 0, 0, 0.2);">
        <div style="position: relative; height: 100%; padding: 80px; color: black; display: flex; flex-direction: column;">
          <!-- En-tête avec logo et titre -->
         
          <!-- Section centrale (vide) -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; margin-top: 100px;">
            <div style="height: 400px;"></div>
          </div>
          
          <!-- Pied de page avec photo, QR code et nom -->
          <div style="position: absolute; bottom: 80px; width: calc(100% - 160px); display: flex; justify-content: space-between; align-items: flex-end;">
            
            <!-- Photo à gauche -->
            <div style="flex: 0 0 25%; text-align: left;">
              <div style="display: inline-block; width: 250px; height: 250px; border-radius: 15px; overflow: hidden; background: white; padding: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <img 
                  src="${photoUrl}" 
                  style="width: 100%; height: 100%; object-fit: cover;" 
                  alt="Photo ${ben.NOM_BEN} ${ben.PRE_BEN}"
                  onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(ben.NOM_BEN + ' ' + ben.PRE_BEN)}&size=200&background=random'"
                />
              </div>
            </div>
            
            <!-- QR code au centre -->
            <div style="flex: 0 0 35%; text-align: center; margin-top: -50px;">
              <div style="display: inline-block; background: white; padding: 20px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <div id="qrcode-container" style="position: relative; width: 250px; height: 250px;">
                  ${qrCodeUrl ? `
                    <img 
                      src="${qrCodeUrl}" 
                      style="width: 100%; height: 100%;" 
                      alt="QR Code"
                    />
                  ` : `
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f5f5f5; color: #666; font-size: 14px;">
                      QR Code non disponible
                    </div>
                  `}
                </div>
              </div>
            </div>
            
            <!-- Nom à droite -->
            <div style="flex: 0 0 35%; text-align: right;">
              <div style="font-size: 42px; font-weight: 900; color: black; text-transform: uppercase; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                ${ben.NOM_BEN || ''} ${ben.PRE_BEN || ''}
              </div>
              <div style="font-size: 36px; font-weight: 700; color: black; text-transform: uppercase; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                ${ben.TELEPHONE_MOBILE || ''}
              </div>
              <div style="font-size: 32px; font-weight: 600; color: black; text-transform: uppercase; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                ${ben.NUM_PASSEPORT || ''}
              </div>
              <div style="font-size: 28px; font-weight: 500; color: black; text-transform: uppercase; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                ${ben.IDENTIFIANT_NATIONAL || ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    tempContainerRecto.innerHTML = rectoHTML;
    
    // Précharger les images
    const images = tempContainerRecto.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = resolve;
          img.onerror = resolve;
        }
      });
    }));
    
    // Capturer le recto
    const rectoCanvas = await html2canvas(tempContainerRecto, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
      allowTaint: true,
      imageTimeout: 5000
    });
    
    document.body.removeChild(tempContainerRecto);
    
    // Création du conteneur temporaire pour le verso
    const tempContainerVerso = document.createElement('div');
    tempContainerVerso.style.position = 'absolute';
    tempContainerVerso.style.left = '-9999px';
    tempContainerVerso.style.top = '-9999px';
    tempContainerVerso.style.width = '1480px';
    tempContainerVerso.style.height = '1050px';
    tempContainerVerso.style.fontFamily = 'Arial, sans-serif';
    document.body.appendChild(tempContainerVerso);
    
    // HTML du verso
    const versoHTML = `
      <div style="width: 1480px; height: 1050px; background: url(${backBackgroundCard}) no-repeat center center; background-size: cover; border-radius: 80px; padding: 80px; color: black; display: flex; flex-direction: column; box-shadow: 0 40px 120px rgba(0, 0, 0, 0.1);">
        <div style="height: 100%; display: flex; flex-direction: column; justify-content: center;">
          <!-- Logo au centre -->
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 36px; font-weight: 700; color: black; margin-top: 280px;">
              COURTIER D'ASSURANCES
            </div>
          </div>
          
          <!-- Adresse et contacts -->
          <div style="font-size: 30px; line-height: 1.5; text-align: center; margin-bottom: 50px; color: black; font-weight: 500;">
            <div style="margin-bottom: 15px;">Bonapriso, Rue VASNITEX, Immeuble ATLANTIS</div>
            <div style="margin-bottom: 15px;">Avenue Winton Churchill, Immeuble mitoyen à l'OAPI (Yaoundé)</div>
            <div style="margin-bottom: 15px;">BP 4962 Douala – Cameroun</div>
            <div style="margin-bottom: 25px;">
              <strong>Tel :</strong> 2 33 42 08 74 / 6 99 90 60 88 / 690096197
            </div>
          </div>
          
          <hr style="border-top: 1px dotted red; margin: 30px 0;" />

          <!-- Support technique -->
          <div style="font-size: 32px; font-weight: 700; color: black; text-align: center; margin-top: 20px; margin-bottom: 60px; text-transform: uppercase; background: rgba(255, 255, 255, 0.1); padding: 25px; border-radius: 15px;">
            Support Technique: +237 690 09 61 97 / +237 674 29 01 49
          </div>
          
          <!-- Notice -->
          <div style="font-size: 26px; line-height: 1.4; text-align: center; margin-top: auto; color: black; padding: 40px; border-top: 5px solid rgba(255, 255, 255, 0.3); background: rgba(255, 255, 255, 0.05); border-radius: 10px;">
            <strong>⚠️ IMPORTANT :</strong> Cette carte est strictement personnelle et est la propriété exclusive d'HCSINSURANCE.<br/>
            En cas de perte ou vol, contactez immédiatement le support technique.
          </div>
        </div>
      </div>
    `;
    
    tempContainerVerso.innerHTML = versoHTML;
    
    // Capturer le verso
    const versoCanvas = await html2canvas(tempContainerVerso, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
      allowTaint: true,
      imageTimeout: 5000
    });
    
    document.body.removeChild(tempContainerVerso);
    
    // Création du PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a6',
      compress: true
    });
    
    const pageWidth = 148;
    const pageHeight = 105;
    
    // Ajouter le recto
    const rectoDataUrl = rectoCanvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(rectoDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, '', 'FAST');
    
    // Ajouter le verso
    pdf.addPage();
    const versoDataUrl = versoCanvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(versoDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, '', 'FAST');
    
    // Propriétés du PDF
    pdf.setProperties({
      title: `Carte Bénéficiaire - ${ben.NOM_BEN} ${ben.PRE_BEN}`,
      subject: 'Carte d\'identification bénéficiaire HCSInsurance',
      author: 'HCSInsurance',
      keywords: `carte, bénéficiaire, assurance, santé, QR code, ${ben.IDENTIFIANT_NATIONAL}, ${ben.EMPLOYEUR || ''}`,
      creator: 'HCSSystem'
    });
    
    // Télécharger le PDF
    const nomFichier = `Carte_${ben.NOM_BEN}_${ben.PRE_BEN}_${ben.IDENTIFIANT_NATIONAL || ben.ID_BEN}.pdf`;
    pdf.save(nomFichier);
    
    showNotification('Carte téléchargée avec succès!', 'success');
    
  } catch (error) {
    console.error('Erreur lors du téléchargement de la carte:', error);
    showNotification('Erreur lors du téléchargement de la carte: ' + error.message, 'error');
  }
};

  const handleCloseCard = () => {
    setShowCard(false);
    setSelectedBeneficiaireForCard(null);
    setCardSide('front');
  };

  // ==============================================
  // FONCTIONS UTILITAIRES POUR LES CARTES
  // ==============================================
  const getCarteStatusClass = (carte) => {
    if (new Date(carte.DFV_CAR) < new Date()) return 'expired';
    if (carte.STS_CAR === 0) return 'inactive';
    if (carte.STS_CAR === 2) return 'suspended';
    if (carte.STS_CAR === 3) return 'expired';
    return 'active';
  };

  const getCarteStatusText = (carte) => {
    if (new Date(carte.DFV_CAR) < new Date()) return 'Expirée';
    switch(carte.STS_CAR) {
      case 0: return 'Inactive';
      case 1: return 'Active';
      case 2: return 'Suspendue';
      case 3: return 'Expirée';
      default: return 'Inconnu';
    }
  };

  // ==============================================
  // EFFETS POUR CHARGEMENT INITIAL
  // ==============================================
  useEffect(() => {
    loadBeneficiaires();
    loadReferenceData();
  }, [loadBeneficiaires, loadReferenceData]);

  // Effet pour fermer les menus déroulants en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (assureDropdownRef.current && !assureDropdownRef.current.contains(event.target)) {
        setShowAssureDropdown(false);
      }
      if (beneficiaireDropdownRef.current && !beneficiaireDropdownRef.current.contains(event.target)) {
        const dropdown = document.querySelector('.beneficiaire-dropdown');
        if (dropdown) dropdown.classList.remove('open');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ==============================================
  // CALCUL DES STATISTIQUES
  // ==============================================
 const calculateStats = (beneficiairesList = []) => {
  const totalBeneficiaires = beneficiairesList.length;
  const assuresPrincipauxCount = beneficiairesList.filter(b => 
    !b.STATUT_ACE || b.STATUT_ACE === '' || b.STATUT_ACE === null
  ).length;
  const ayantsDroitCount = totalBeneficiaires - assuresPrincipauxCount;
  const avecAssurancePriveeCount = beneficiairesList.filter(b => 
    b.ASSURANCE_PRIVE || b.assurance_prive
  ).length;
  
  return {
    total: totalBeneficiaires,
    assuresPrincipaux: assuresPrincipauxCount,
    ayantsDroit: ayantsDroitCount,
    avecAssurancePrivee: avecAssurancePriveeCount
  };
};

  const filteredBeneficiaires = beneficiaires.filter(ben => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      ben.NOM_BEN?.toLowerCase().includes(searchLower) ||
      ben.PRE_BEN?.toLowerCase().includes(searchLower) ||
      ben.FIL_BEN?.toLowerCase().includes(searchLower) ||
      ben.IDENTIFIANT_NATIONAL?.includes(searchTerm) ||
      ben.TELEPHONE?.includes(searchTerm) ||
      ben.EMAIL?.toLowerCase().includes(searchLower) ||
      ben.EMPLOYEUR?.toLowerCase().includes(searchLower)
    );
  });

  const stats = calculateStats(beneficiaires);

  // ==============================================
  // RENDU DU MODAL DE SYNCHRONISATION
  // ==============================================
  const renderSyncResultsModal = () => {
    if (!showSyncResults || !syncResult) return null;
    
    return (
      <div className="modal-overlay" onClick={() => setShowSyncResults(false)}>
        <div className="modal-content large">
          <div className="modal-header">
            <h2>
              <Database size={20} /> Résultats de la Synchronisation
            </h2>
            <button onClick={() => setShowSyncResults(false)} className="modal-close">
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body">
            <div className={`sync-result ${syncResult.success ? 'success' : 'error'}`}>
              <div className="sync-result-header">
                {syncResult.success ? (
                  <CheckCircle size={32} className="success-icon" />
                ) : (
                  <AlertCircle size={32} className="error-icon" />
                )}
                <h3>{syncResult.success ? 'Synchronisation réussie' : 'Erreur de synchronisation'}</h3>
              </div>
              
              <div className="sync-result-message">
                <p>{syncResult.message}</p>
              </div>
              
              {syncing && (
                <div className="sync-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${syncProgress}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {syncProgress}% complété
                  </div>
                </div>
              )}
              
              {syncDetails.length > 0 && (
                <div className="sync-details">
                  <h4>Détails de la synchronisation :</h4>
                  <div className="details-grid">
                    {syncDetails.map((detail, index) => (
                      <div key={index} className="detail-item">
                        <div className="detail-header">
                          <strong>{detail.table || 'Table'}</strong>
                          <span className={`detail-badge ${detail.errors > 0 ? 'error' : 'success'}`}>
                            {detail.records || 0} enregistrement(s)
                          </span>
                        </div>
                        <div className="detail-body">
                          {detail.added > 0 && (
                            <span className="detail-added">
                              <Plus size={12} /> {detail.added} ajouté(s)
                            </span>
                          )}
                          {detail.updated > 0 && (
                            <span className="detail-updated">
                              <Edit size={12} /> {detail.updated} mis à jour
                            </span>
                          )}
                          {detail.errors > 0 && (
                            <span className="detail-errors">
                              <AlertCircle size={12} /> {detail.errors} erreur(s)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {syncResult.results && syncResult.results.length > 0 && (
                <div className="sync-tables">
                  <h4>Tables synchronisées :</h4>
                  <div className="tables-list">
                    {syncResult.results.map((result, index) => (
                      <div key={index} className="table-item">
                        <div className="table-name">
                          <Database size={14} />
                          <span>{result.table}</span>
                        </div>
                        <div className="table-stats">
                          <span className="stat">
                            {result.records || 0} enregistrement(s)
                          </span>
                          {result.added > 0 && (
                            <span className="stat added">
                              +{result.added} nouveau(x)
                            </span>
                          )}
                          {result.updated > 0 && (
                            <span className="stat updated">
                              {result.updated} mis à jour
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {syncResult.errors && syncResult.errors.length > 0 && (
                <div className="sync-errors">
                  <h4>Erreurs rencontrées :</h4>
                  <div className="errors-list">
                    {syncResult.errors.map((error, index) => (
                      <div key={index} className="error-item">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="sync-actions">
                <button
                  onClick={() => setShowSyncResults(false)}
                  className="btn-primary"
                >
                  Fermer
                </button>
                
                {syncResult.success && (
                  <button
                    onClick={() => {
                      loadBeneficiaires();
                      setShowSyncResults(false);
                    }}
                    className="btn-success"
                  >
                    <RefreshCw size={18} /> Recharger les données
                  </button>
                )}
                
                {syncResult.success && (
                  <button
                    onClick={handleSyncData}
                    className="btn-info"
                  >
                    <Upload size={18} /> Synchroniser à nouveau
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==============================================
  // RENDU DES MODALS ET COMPOSANTS
  // ==============================================
  
  // RENDU DU FORMULAIRE BÉNÉFICIAIRE AVEC PHOTO
  const renderBeneficiaireForm = () => {
    if (!showForm) return null;
    
    return (
      <div className="modal-overlay" onClick={(e) => {
        if (e.target.className === 'modal-overlay') {
          resetForm();
        }
      }}>
        <div className="modal-content large">
          <div className="modal-header">
            <h2>
              <UserPlus size={20} /> {editingId ? 'Modifier Bénéficiaire' : 'Nouveau Bénéficiaire'}
            </h2>
            <button onClick={resetForm} className="modal-close">
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-sections">
                
                <div className="form-section">
                  <h3><User size={18} /> Informations Personnelles *</h3>
                  
                  {/* Section Photo */}
                  <div className="form-group photo-upload-section">
                    <label>Photo d'identité</label>
                    <div className="photo-upload-container">
                      <div className="photo-preview">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="photo-preview-img" />
                        ) : (
                          <div className="photo-placeholder">
                            <User size={48} />
                            <span>Aucune photo</span>
                          </div>
                        )}
                      </div>
                      <div className="photo-upload-controls">
                        <div className="file-upload-wrapper">
                          <input
                            type="file"
                            id="photo-upload"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="file-upload-input"
                          />
                          <label htmlFor="photo-upload" className="btn-secondary file-upload-label">
                            <UploadCloud size={16} /> {photoFile ? 'Changer la photo' : 'Choisir une photo'}
                          </label>
                        </div>
                        {(photoFile || photoPreview) && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="btn-secondary btn-remove-photo"
                          >
                            <Trash2 size={16} /> Supprimer la photo
                          </button>
                        )}
                        <div className="photo-upload-info">
                          <small>
                            <Info size={12} /> Formats acceptés : JPEG, PNG, GIF (max 5MB)
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nom *</label>
                      <input
                        type="text"
                        name="NOM_BEN"
                        value={formData.NOM_BEN}
                        onChange={handleInputChange}
                        className={validationErrors.NOM_BEN ? 'error' : ''}
                        placeholder="Nom"
                        required
                        onBlur={(e) => {
                          if (!e.target.value.trim()) {
                            setValidationErrors(prev => ({ ...prev, NOM_BEN: 'Le nom est requis' }));
                          }
                        }}
                      />
                      {validationErrors.NOM_BEN && (
                        <span className="error-message">⚠️ {validationErrors.NOM_BEN}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Prénom *</label>
                      <input
                        type="text"
                        name="PRE_BEN"
                        value={formData.PRE_BEN}
                        onChange={handleInputChange}
                        className={validationErrors.PRE_BEN ? 'error' : ''}
                        placeholder="Prénom"
                        required
                        onBlur={(e) => {
                          if (!e.target.value.trim()) {
                            setValidationErrors(prev => ({ ...prev, PRE_BEN: 'Le prénom est requis' }));
                          }
                        }}
                      />
                      {validationErrors.PRE_BEN && (
                        <span className="error-message">⚠️ {validationErrors.PRE_BEN}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Sexe *</label>
                      <select
                        name="SEX_BEN"
                        value={formData.SEX_BEN}
                        onChange={handleInputChange}
                        className={validationErrors.SEX_BEN ? 'error' : ''}
                        required
                        onBlur={(e) => {
                          if (!e.target.value.trim()) {
                            setValidationErrors(prev => ({ ...prev, SEX_BEN: 'Le sexe est requis' }));
                          }
                        }}
                      >
                        <option value="">Sélectionner</option>
                        {sexeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {validationErrors.SEX_BEN && (
                        <span className="error-message">⚠️ {validationErrors.SEX_BEN}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Date de naissance *</label>
                      <input
                        type="date"
                        name="NAI_BEN"
                        value={formData.NAI_BEN}
                        onChange={handleInputChange}
                        className={validationErrors.NAI_BEN ? 'error' : ''}
                        required
                        onBlur={(e) => {
                          if (!e.target.value) {
                            setValidationErrors(prev => ({ ...prev, NAI_BEN: 'La date de naissance est requise' }));
                          }
                        }}
                      />
                      {validationErrors.NAI_BEN && (
                        <span className="error-message">⚠️ {validationErrors.NAI_BEN}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Téléphone Mobile *</label>
                      <input
                        type="tel"
                        name="TELEPHONE_MOBILE"
                        value={formData.TELEPHONE_MOBILE}
                        onChange={handleInputChange}
                        className={validationErrors.TELEPHONE_MOBILE ? 'error' : ''}
                        placeholder="+XXX XX XX XX XX"
                        required
                        onBlur={(e) => {
                          if (!e.target.value.trim()) {
                            setValidationErrors(prev => ({ 
                              ...prev, 
                              TELEPHONE_MOBILE: 'Le téléphone mobile est requis' 
                            }));
                          }
                        }}
                      />
                      {validationErrors.TELEPHONE_MOBILE && (
                        <span className="error-message">⚠️ {validationErrors.TELEPHONE_MOBILE}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Téléphone Fixe</label>
                      <input
                        type="tel"
                        name="TELEPHONE"
                        value={formData.TELEPHONE}
                        onChange={handleInputChange}
                        placeholder="Téléphone fixe"
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="EMAIL"
                        value={formData.EMAIL}
                        onChange={handleInputChange}
                        placeholder="email@exemple.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3><Users size={18} /> Situation Familiale & Professionnelle</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Profession</label>
                      <input
                        type="text"
                        name="PROFESSION"
                        value={formData.PROFESSION}
                        onChange={handleInputChange}
                        placeholder="Profession"
                      />
                    </div>

                    <div className="form-group">
                      <label>Employeur</label>
                      <input
                        type="text"
                        name="EMPLOYEUR"
                        value={formData.EMPLOYEUR}
                        onChange={handleInputChange}
                        placeholder="Nom de l'employeur"
                      />
                    </div>

                    <div className="form-group">
                      <label>Situation Familiale</label>
                      <select
                        name="SITUATION_FAMILIALE"
                        value={formData.SITUATION_FAMILIALE}
                        onChange={handleInputChange}
                      >
                        {situationFamilialeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Nombre d'Enfants</label>
                      <input
                        type="number"
                        name="NOMBRE_ENFANTS"
                        value={formData.NOMBRE_ENFANTS}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3><Shield size={18} /> Statut ACE</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Type de Bénéficiaire</label>
                      <select
                        name="STATUT_ACE"
                        value={formData.STATUT_ACE}
                        onChange={handleInputChange}
                      >
                        {statutAceOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.STATUT_ACE && formData.STATUT_ACE !== '' && (
                      <div className="form-group" ref={assureDropdownRef}>
                        <label>Assuré Principal *</label>
                        <div className="assure-principal-select">
                          <div 
                            className={`assure-dropdown-toggle ${validationErrors.ID_ASSURE_PRINCIPAL ? 'error' : ''}`}
                            onClick={() => setShowAssureDropdown(!showAssureDropdown)}
                          >
                            {formData.ID_ASSURE_PRINCIPAL ? (
                              <div className="selected-assure">
                                <span>{getSelectedAssureName()}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData(prev => ({ ...prev, ID_ASSURE_PRINCIPAL: null }));
                                  }}
                                  className="remove-assure"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <span className="placeholder">Sélectionner un assuré principal</span>
                            )}
                            <ChevronDown size={16} />
                          </div>
                          
                          {showAssureDropdown && (
                            <div className="assure-dropdown">
                              <div className="assure-search">
                                <Search size={16} />
                                <input
                                  type="text"
                                  placeholder="Rechercher un assuré..."
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="assure-list">
                                {assuresPrincipaux.map(assure => (
                                  <div
                                    key={assure.id}
                                    className="assure-item"
                                    onClick={() => handleSelectAssure(assure)}
                                  >
                                    <div className="assure-avatar">
                                      {assure.photo ? (
                                        <img src={assure.photo} alt={`${assure.nom} ${assure.prenom}`} />
                                      ) : (
                                        <div>{assure.sexe === 'M' ? '♂' : '♀'}</div>
                                      )}
                                    </div>
                                    <div className="assure-info">
                                      <strong>{assure.nom} {assure.prenom}</strong>
                                      <div className="assure-details">
                                        <span>Tél: {assure.telephone}</span>
                                        <span>ID: {assure.identifiant_national || 'N/A'}</span>
                                        {assure.employeur && <span>Employeur: {assure.employeur}</span>}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {validationErrors.ID_ASSURE_PRINCIPAL && (
                            <span className="error-message">{validationErrors.ID_ASSURE_PRINCIPAL}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-section">
                  <h3><Heart size={18} /> Informations Médicales</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Groupe Sanguin</label>
                      <select
                        name="GROUPE_SANGUIN"
                        value={formData.GROUPE_SANGUIN}
                        onChange={handleInputChange}
                      >
                        {groupeSanguinOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Antécédents Médicaux</label>
                    <textarea
                      name="ANTECEDENTS_MEDICAUX"
                      value={formData.ANTECEDENTS_MEDICAUX}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Antécédents médicaux..."
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Allergies</label>
                      <textarea
                        name="ALLERGIES"
                        value={formData.ALLERGIES}
                        onChange={handleInputChange}
                        rows="2"
                        placeholder="Allergies connues..."
                      />
                    </div>

                    <div className="form-group">
                      <label>Traitements en cours</label>
                      <textarea
                        name="TRAITEMENTS_EN_COURS"
                        value={formData.TRAITEMENTS_EN_COURS}
                        onChange={handleInputChange}
                        rows="2"
                        placeholder="Traitements médicaux..."
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3><Phone size={18} /> Contact d'Urgence</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nom du Contact</label>
                      <input
                        type="text"
                        name="CONTACT_URGENCE"
                        value={formData.CONTACT_URGENCE}
                        onChange={handleInputChange}
                        placeholder="Nom du contact d'urgence"
                      />
                    </div>

                    <div className="form-group">
                      <label>Téléphone d'Urgence</label>
                      <input
                        type="tel"
                        name="TEL_URGENCE"
                        value={formData.TEL_URGENCE}
                        onChange={handleInputChange}
                        placeholder="Téléphone d'urgence"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3><MapPin size={18} /> Localisation</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Pays</label>
                      <select
                        name="COD_PAY"
                        value={formData.COD_PAY}
                        onChange={handleInputChange}
                      >
                        {paysList.map(pays => (
                          <option key={pays.COD_PAY} value={pays.COD_PAY}>
                            {pays.LIB_PAY}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Zone d'Habitation</label>
                      <input
                        type="text"
                        name="ZONE_HABITATION"
                        value={formData.ZONE_HABITATION}
                        onChange={handleInputChange}
                        placeholder="Quartier, Ville"
                      />
                    </div>

                    <div className="form-group">
                      <label>Type d'Habitat</label>
                      <input
                        type="text"
                        name="TYPE_HABITAT"
                        value={formData.TYPE_HABITAT}
                        onChange={handleInputChange}
                        placeholder="Maison, Appartement..."
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3><MapPin size={18} /> Accessibilité</h3>
                  <div className="form-grid">
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="ACCES_EAU"
                          checked={formData.ACCES_EAU}
                          onChange={handleInputChange}
                        />
                        Accès à l'eau potable
                      </label>
                    </div>

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="ACCES_ELECTRICITE"
                          checked={formData.ACCES_ELECTRICITE}
                          onChange={handleInputChange}
                        />
                        Accès à l'électricité
                      </label>
                    </div>

                    <div className="form-group">
                      <label>Distance au centre de santé (km)</label>
                      <input
                        type="number"
                        name="DISTANCE_CENTRE_SANTE"
                        value={formData.DISTANCE_CENTRE_SANTE}
                        onChange={handleInputChange}
                        min="0"
                        step="0.1"
                        placeholder="Distance en km"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Moyen de Transport</label>
                    <input
                      type="text"
                      name="MOYEN_TRANSPORT"
                      value={formData.MOYEN_TRANSPORT}
                      onChange={handleInputChange}
                      placeholder="Voiture, Moto, Transport public..."
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3><Shield size={18} /> Assurance</h3>
                  <div className="form-grid">
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="ASSURANCE_PRIVE"
                          checked={formData.ASSURANCE_PRIVE}
                          onChange={handleInputChange}
                        />
                        Dispose d'une assurance privée
                      </label>
                    </div>

                    <div className="form-group">
                      <label>Mutuelle</label>
                      <input
                        type="text"
                        name="MUTUELLE"
                        value={formData.MUTUELLE}
                        onChange={handleInputChange}
                        placeholder="Nom de la mutuelle"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Enregistrement...
                    </>
                  ) : editingId ? (
                    <>
                      <Save size={18} />
                      Mettre à jour
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Créer le bénéficiaire
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // RENDU DE LA RECHERCHE AVANCÉE
  const renderAdvancedSearch = () => (
    <div className="advanced-search-panel">
      <div className="advanced-search-header">
        <h3><Filter size={18} /> Recherche Avancée</h3>
        <button 
          onClick={() => setShowAdvancedSearch(false)} 
          className="btn-icon"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="advanced-search-filters">
        <div className="form-grid">
          <div className="form-group">
            <label>Type de Bénéficiaire</label>
            <select
              value={advancedFilters.type_beneficiaire || ''}
              onChange={(e) => setAdvancedFilters(prev => ({
                ...prev,
                type_beneficiaire: e.target.value || undefined
              }))}
            >
              <option value="">Tous les types</option>
              <option value="Assuré Principal">Assuré Principal</option>
              <option value="Conjoint">Conjoint</option>
              <option value="Enfant">Enfant</option>
              <option value="Ascendant">Ascendant</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sexe</label>
            <select
              value={advancedFilters.sexe || ''}
              onChange={(e) => setAdvancedFilters(prev => ({
                ...prev,
                sexe: e.target.value || undefined
              }))}
            >
              <option value="">Tous</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>

          <div className="form-group">
            <label>Zone d'Habitation</label>
            <input
              type="text"
              value={advancedFilters.zone_habitation || ''}
              onChange={(e) => setAdvancedFilters(prev => ({
                ...prev,
                zone_habitation: e.target.value || undefined
              }))}
              placeholder="Zone d'habitation"
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Âge minimum</label>
            <input
              type="number"
              value={advancedFilters.age_min || ''}
              onChange={(e) => setAdvancedFilters(prev => ({
                ...prev,
                age_min: e.target.value || undefined
              }))}
              min="0"
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>Âge maximum</label>
            <input
              type="number"
              value={advancedFilters.age_max || ''}
              onChange={(e) => setAdvancedFilters(prev => ({
                ...prev,
                age_max: e.target.value || undefined
              }))}
              min="0"
              placeholder="100"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={advancedFilters.assurance_prive || false}
                onChange={(e) => setAdvancedFilters(prev => ({
                  ...prev,
                  assurance_prive: e.target.checked || undefined
                }))}
              />
              Avec assurance privée
            </label>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Pays</label>
            <select
              value={advancedFilters.cod_pay || ''}
              onChange={(e) => setAdvancedFilters(prev => ({
                ...prev,
                cod_pay: e.target.value || undefined
              }))}
            >
              <option value="">Tous les pays</option>
              {paysList.map(pays => (
                <option key={pays.COD_PAY} value={pays.COD_PAY}>
                  {pays.LIB_PAY}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Statut ACE</label>
            <select
              value={advancedFilters.statut_ace || ''}
              onChange={(e) => setAdvancedFilters(prev => ({
                ...prev,
                statut_ace: e.target.value || undefined
              }))}
            >
              <option value="">Tous les statuts</option>
              <option value="">Assuré Principal</option>
              <option value="CONJOINT">Conjoint</option>
              <option value="ENFANT">Enfant</option>
              <option value="ASCENDANT">Ascendant</option>
            </select>
          </div>
        </div>
      </div>

      <div className="advanced-search-actions">
        <button
          onClick={() => setAdvancedFilters({
            type_beneficiaire: '',
            sexe: '',
            zone_habitation: '',
            age_min: '',
            age_max: '',
            assurance_prive: false,
            cod_pay: '',
            statut_ace: ''
          })}
          className="btn-secondary"
        >
          Réinitialiser
        </button>
        <button
          onClick={loadBeneficiaires}
          className="btn-primary"
        >
          <Search size={18} /> Rechercher
        </button>
      </div>
    </div>
  );

  // RENDU DES DONNÉES MÉDICALES
  const renderMedicalDataModal = () => {
    if (!showMedicalData || !selectedBeneficiaireForMedical) return null;
    
    const ben = selectedBeneficiaireForMedical;
    
    return (
      <div className="modal-overlay" onClick={(e) => {
        if (e.target.className === 'modal-overlay') {
          setShowMedicalData(false);
          setSelectedBeneficiaireForMedical(null);
        }
      }}>
        <div className="modal-content xlarge">
          <div className="modal-header">
            <h2>
              <Clipboard size={20} /> Dossier Médical - {ben.NOM_BEN} {ben.PRE_BEN}
            </h2>
            <button onClick={() => {
              setShowMedicalData(false);
              setSelectedBeneficiaireForMedical(null);
            }} className="modal-close">
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body">
            <div className="medical-patient-header">
              <div className="medical-patient-photo">
                <BeneficiaryPhoto 
                  photoUrl={ben.PHOTO || ben.photo || ben.PHOTO_URL}
                  sex={ben.SEX_BEN}
                  size="large"
                />
              </div>
              <div className="medical-patient-info">
                <h3>{ben.NOM_BEN} {ben.PRE_BEN}</h3>
                <div><strong>Âge:</strong> {calculateAge(ben.NAI_BEN)} ans</div>
                <div><strong>Sexe:</strong> {ben.SEX_BEN === 'M' ? 'Masculin' : 'Féminin'}</div>
                <div><strong>Identifiant national:</strong> {ben.IDENTIFIANT_NATIONAL || 'N/A'}</div>
                <div><strong>Employeur:</strong> {ben.EMPLOYEUR || 'Non spécifié'}</div>
                <div><strong>Téléphone:</strong> {ben.TELEPHONE_MOBILE || ben.TELEPHONE || 'N/A'}</div>
              </div>
            </div>
            
            <div className="medical-tabs">
              <div className="medical-tab-header">
                <button 
                  className={`medical-tab ${!showAllergieForm && !showAntecedentForm && !showNoteForm ? 'active' : ''}`}
                  onClick={() => {
                    setShowAllergieForm(false);
                    setShowAntecedentForm(false);
                    setShowNoteForm(false);
                  }}
                >
                  <Heart size={16} /> Vue d'ensemble
                </button>
                <button 
                  className={`medical-tab ${showAllergieForm ? 'active' : ''}`}
                  onClick={() => setShowAllergieForm(true)}
                >
                  <Pill size={16} /> Ajouter une allergie
                </button>
                <button 
                  className={`medical-tab ${showAntecedentForm ? 'active' : ''}`}
                  onClick={() => setShowAntecedentForm(true)}
                >
                  <Stethoscope size={16} /> Ajouter un antécédent
                </button>
                <button 
                  className={`medical-tab ${showNoteForm ? 'active' : ''}`}
                  onClick={() => setShowNoteForm(true)}
                >
                  <FileText size={16} /> Ajouter une note
                </button>
              </div>
              
              <div className="medical-tab-content">
                {loadingMedical ? (
                  <div className="loading">
                    <Loader2 size={32} className="animate-spin" />
                    <p>Chargement des données médicales...</p>
                  </div>
                ) : showAllergieForm ? (
                  <div className="medical-form">
                    <h3><Pill size={18} /> Nouvelle Allergie</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Type d'allergie *</label>
                        <select
                          value={medicalFormData.allergie.TYPE_ALLERGIE}
                          onChange={(e) => setMedicalFormData(prev => ({
                            ...prev,
                            allergie: { ...prev.allergie, TYPE_ALLERGIE: e.target.value }
                          }))}
                          required
                        >
                          <option value="">Sélectionner</option>
                          {typeAllergieOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Allergène *</label>
                        <input
                          type="text"
                          value={medicalFormData.allergie.ALLERGENE}
                          onChange={(e) => setMedicalFormData(prev => ({
                            ...prev,
                            allergie: { ...prev.allergie, ALLERGENE: e.target.value }
                          }))}
                          placeholder="Ex: Pénicilline, Arachides..."
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Réaction</label>
                        <input
                          type="text"
                          value={medicalFormData.allergie.REACTION}
                          onChange={(e) => setMedicalFormData(prev => ({
                            ...prev,
                            allergie: { ...prev.allergie, REACTION: e.target.value }
                          }))}
                          placeholder="Ex: Urticaire, Choc anaphylactique..."
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Gravité</label>
                        <select
                          value={medicalFormData.allergie.GRAVITE}
                          onChange={(e) => setMedicalFormData(prev => ({
                            ...prev,
                            allergie: { ...prev.allergie, GRAVITE: e.target.value }
                          }))}
                        >
                          <option value="">Sélectionner</option>
                          {graviteOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Traitement d'urgence</label>
                      <textarea
                        value={medicalFormData.allergie.TRAITEMENT_URGENCE}
                        onChange={(e) => setMedicalFormData(prev => ({
                          ...prev,
                          allergie: { ...prev.allergie, TRAITEMENT_URGENCE: e.target.value }
                        }))}
                        rows="2"
                        placeholder="Procédure d'urgence en cas de réaction..."
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Observations</label>
                      <textarea
                        value={medicalFormData.allergie.OBSERVATIONS}
                        onChange={(e) => setMedicalFormData(prev => ({
                          ...prev,
                          allergie: { ...prev.allergie, OBSERVATIONS: e.target.value }
                        }))}
                        rows="2"
                        placeholder="Observations supplémentaires..."
                      />
                    </div>
                    
                    <div className="form-actions">
                      <button
                        onClick={() => setShowAllergieForm(false)}
                        className="btn-secondary"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleAddAllergie}
                        className="btn-primary"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            Ajouter l'allergie
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : showAntecedentForm ? (
                  <div className="medical-form">
                    <h3><Stethoscope size={18} /> Nouvel Antécédent Médical</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Type d'antécédent *</label>
                        <select
                          value={medicalFormData.antecedent.TYPE_ANTECEDENT}
                          onChange={(e) => setMedicalFormData(prev => ({
                            ...prev,
                            antecedent: { ...prev.antecedent, TYPE_ANTECEDENT: e.target.value }
                          }))}
                          required
                        >
                          <option value="">Sélectionner</option>
                          {typeAntecedentOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Description *</label>
                        <input
                          type="text"
                          value={medicalFormData.antecedent.DESCRIPTION}
                          onChange={(e) => setMedicalFormData(prev => ({
                            ...prev,
                            antecedent: { ...prev.antecedent, DESCRIPTION: e.target.value }
                          }))}
                          placeholder="Description de l'antécédent..."
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Gravité</label>
                        <select
                          value={medicalFormData.antecedent.GRAVITE}
                          onChange={(e) => setMedicalFormData(prev => ({
                            ...prev,
                            antecedent: { ...prev.antecedent, GRAVITE: e.target.value }
                          }))}
                        >
                          <option value="">Sélectionner</option>
                          {graviteOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Traitement</label>
                        <input
                          type="text"
                          value={medicalFormData.antecedent.TRAITEMENT}
                          onChange={(e) => setMedicalFormData(prev => ({
                            ...prev,
                            antecedent: { ...prev.antecedent, TRAITEMENT: e.target.value }
                          }))}
                          placeholder="Traitement suivi..."
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Observations</label>
                      <textarea
                        value={medicalFormData.antecedent.OBSERVATIONS}
                        onChange={(e) => setMedicalFormData(prev => ({
                          ...prev,
                          antecedent: { ...prev.antecedent, OBSERVATIONS: e.target.value }
                        }))}
                        rows="2"
                        placeholder="Observations supplémentaires..."
                      />
                    </div>
                    
                    <div className="form-actions">
                      <button
                        onClick={() => setShowAntecedentForm(false)}
                        className="btn-secondary"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleAddAntecedent}
                        className="btn-primary"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            Ajouter l'antécédent
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : showNoteForm ? (
                  <div className="medical-form">
                    <h3><FileText size={18} /> Nouvelle Note</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Type de note *</label>
                        <select
                          value={medicalFormData.note.TYPE_NOTE}
                          onChange={(e) => setMedicalFormData(prev => ({
                            ...prev,
                            note: { ...prev.note, TYPE_NOTE: e.target.value }
                          }))}
                          required
                        >
                          <option value="">Sélectionner</option>
                          {typeNoteOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Contenu *</label>
                      <textarea
                        value={medicalFormData.note.CONTENU}
                        onChange={(e) => setMedicalFormData(prev => ({
                          ...prev,
                          note: { ...prev.note, CONTENU: e.target.value }
                        }))}
                        rows="4"
                        placeholder="Contenu de la note..."
                        required
                      />
                    </div>
                    
                    <div className="form-grid">
                      <div className="form-group checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={medicalFormData.note.URGENT}
                            onChange={(e) => setMedicalFormData(prev => ({
                              ...prev,
                              note: { ...prev.note, URGENT: e.target.checked }
                            }))}
                          />
                          Urgent
                        </label>
                      </div>
                      
                      <div className="form-group checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={medicalFormData.note.RESTREINT}
                            onChange={(e) => setMedicalFormData(prev => ({
                              ...prev,
                              note: { ...prev.note, RESTREINT: e.target.checked }
                            }))}
                          />
                          Restreint
                        </label>
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button
                        onClick={() => setShowNoteForm(false)}
                        className="btn-secondary"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleAddNote}
                        className="btn-primary"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            Ajouter la note
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="medical-overview">
                    <div className="medical-section">
                      <h3><Pill size={18} /> Allergies ({medicalData.allergies.length})</h3>
                      {medicalData.allergies.length > 0 ? (
                        <div className="medical-list">
                          {medicalData.allergies.map((allergie, index) => (
                            <div key={index} className="medical-item">
                              <div className="medical-item-header">
                                <strong>{allergie.ALLERGENE}</strong>
                                <span className={`severity-badge ${allergie.GRAVITE?.toLowerCase() || ''}`}>
                                  {allergie.GRAVITE || 'Non spécifié'}
                                </span>
                              </div>
                              <div className="medical-item-body">
                                <div><strong>Type:</strong> {allergie.TYPE_ALLERGIE}</div>
                                {allergie.REACTION && <div><strong>Réaction:</strong> {allergie.REACTION}</div>}
                                {allergie.TRAITEMENT_URGENCE && <div><strong>Traitement d'urgence:</strong> {allergie.TRAITEMENT_URGENCE}</div>}
                                {allergie.OBSERVATIONS && <div><strong>Observations:</strong> {allergie.OBSERVATIONS}</div>}
                                <div className="medical-item-date">
                                  <Calendar size={12} /> Déclaré le: {formatDate(allergie.DATE_DECLARATION)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-data">Aucune allergie enregistrée</p>
                      )}
                    </div>
                    
                    <div className="medical-section">
                      <h3><Stethoscope size={18} /> Antécédents ({medicalData.antecedents.length})</h3>
                      {medicalData.antecedents.length > 0 ? (
                        <div className="medical-list">
                          {medicalData.antecedents.map((antecedent, index) => (
                            <div key={index} className="medical-item">
                              <div className="medical-item-header">
                                <strong>{antecedent.DESCRIPTION}</strong>
                                <span className={`severity-badge ${antecedent.GRAVITE?.toLowerCase() || ''}`}>
                                  {antecedent.GRAVITE || 'Non spécifié'}
                                </span>
                              </div>
                              <div className="medical-item-body">
                                <div><strong>Type:</strong> {antecedent.TYPE_ANTECEDENT}</div>
                                {antecedent.TRAITEMENT && <div><strong>Traitement:</strong> {antecedent.TRAITEMENT}</div>}
                                {antecedent.OBSERVATIONS && <div><strong>Observations:</strong> {antecedent.OBSERVATIONS}</div>}
                                <div className="medical-item-date">
                                  <Calendar size={12} /> Déclaré le: {formatDate(antecedent.DATE_DECLARATION)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-data">Aucun antécédent enregistré</p>
                      )}
                    </div>
                    
                    <div className="medical-section">
                      <h3><FileText size={18} /> Notes ({medicalData.notes.length})</h3>
                      {medicalData.notes.length > 0 ? (
                        <div className="medical-list">
                          {medicalData.notes.map((note, index) => (
                            <div key={index} className="medical-item">
                              <div className="medical-item-header">
                                <strong>{note.TYPE_NOTE}</strong>
                                <div className="note-flags">
                                  {note.URGENT && <span className="flag urgent">URGENT</span>}
                                  {note.RESTREINT && <span className="flag restreint">RESTREINT</span>}
                                </div>
                              </div>
                              <div className="medical-item-body">
                                <div className="note-content">{note.CONTENU}</div>
                                <div className="medical-item-date">
                                  <Calendar size={12} /> Créée le: {formatDateTime(note.DATE_CREATION)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-data">Aucune note enregistrée</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // RENDU DU FORMULAIRE DE CARTE
  const renderCarteForm = () => {
    return (
      <div className="carte-form-container">
        <div className="form-header">
          <h3>
            {editingCarte ? 'Modifier la carte' : 'Nouvelle carte'}
          </h3>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSaveCarte(); }}>
          <div className="form-sections">
            <div className="form-section">
              <h3><IdCard size={18} /> Informations de la carte *</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Code Pays *</label>
                  <input
                    type="text"
                    name="COD_PAY"
                    value={carteFormData.COD_PAY}
                    onChange={handleCarteInputChange}
                    className={carteErrors.COD_PAY ? 'error' : ''}
                    placeholder="Ex: CMR"
                    maxLength="3"
                    required
                    disabled={!!editingCarte}
                  />
                  {carteErrors.COD_PAY && (
                    <span className="error-message">{carteErrors.COD_PAY}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Type de carte *</label>
                  <select
                    name="COD_CAR"
                    value={carteFormData.COD_CAR}
                    onChange={handleCarteInputChange}
                    className={carteErrors.COD_CAR ? 'error' : ''}
                    required
                    disabled={!!editingCarte}
                  >
                    <option value="">Sélectionner</option>
                    {carteTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {carteErrors.COD_CAR && (
                    <span className="error-message">{carteErrors.COD_CAR}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Numéro de carte *</label>
                  <input
                    type="text"
                    name="NUM_CAR"
                    value={carteFormData.NUM_CAR}
                    onChange={handleCarteInputChange}
                    className={carteErrors.NUM_CAR ? 'error' : ''}
                    placeholder="Numéro unique"
                    required
                    disabled={!!editingCarte}
                  />
                  {carteErrors.NUM_CAR && (
                    <span className="error-message">{carteErrors.NUM_CAR}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h3><User size={18} /> Informations du bénéficiaire</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    name="NOM_BEN"
                    value={carteFormData.NOM_BEN}
                    onChange={handleCarteInputChange}
                    placeholder="Nom"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Prénom *</label>
                  <input
                    type="text"
                    name="PRE_BEN"
                    value={carteFormData.PRE_BEN}
                    onChange={handleCarteInputChange}
                    placeholder="Prénom"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Sexe</label>
                  <select
                    name="SEX_BEN"
                    value={carteFormData.SEX_BEN}
                    onChange={handleCarteInputChange}
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Date de naissance</label>
                  <input
                    type="date"
                    name="NAI_BEN"
                    value={carteFormData.NAI_BEN}
                    onChange={handleCarteInputChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h3><Building size={18} /> Informations employeur</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Société</label>
                  <input
                    type="text"
                    name="SOC_BEN"
                    value={carteFormData.SOC_BEN}
                    onChange={handleCarteInputChange}
                    placeholder="Nom de la société"
                  />
                </div>
                
                <div className="form-group">
                  <label>Numéro d'agrément</label>
                  <input
                    type="text"
                    name="NAG_ASS"
                    value={carteFormData.NAG_ASS}
                    onChange={handleCarteInputChange}
                    placeholder="Numéro d'agrément de l'assureur"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Prime</label>
                <input
                  type="text"
                  name="PRM_BEN"
                  value={carteFormData.PRM_BEN}
                  onChange={handleCarteInputChange}
                  placeholder="Prime de la carte"
                />
              </div>
            </div>
            
            <div className="form-section">
              <h3><Calendar size={18} /> Dates de validité *</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Date de début *</label>
                  <input
                    type="date"
                    name="DDV_CAR"
                    value={carteFormData.DDV_CAR}
                    onChange={handleCarteInputChange}
                    className={carteErrors.DDV_CAR ? 'error' : ''}
                    required
                  />
                  {carteErrors.DDV_CAR && (
                    <span className="error-message">{carteErrors.DDV_CAR}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Date de fin *</label>
                  <input
                    type="date"
                    name="DFV_CAR"
                    value={carteFormData.DFV_CAR}
                    onChange={handleCarteInputChange}
                    className={carteErrors.DFV_CAR ? 'error' : ''}
                    required
                  />
                  {carteErrors.DFV_CAR && (
                    <span className="error-message">{carteErrors.DFV_CAR}</span>
                  )}
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Date d'émission</label>
                  <input
                    type="date"
                    name="DAT_EMP"
                    value={carteFormData.DAT_EMP}
                    onChange={handleCarteInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Date de biométrie</label>
                  <input
                    type="date"
                    name="DAT_BIO"
                    value={carteFormData.DAT_BIO}
                    onChange={handleCarteInputChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h3><Shield size={18} /> Statut de la carte</h3>
              <div className="form-group">
                <label>Statut</label>
                <select
                  name="STS_CAR"
                  value={carteFormData.STS_CAR}
                  onChange={handleCarteInputChange}
                >
                  {carteStatutOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="form-help">
                  <Info size={14} /> La carte sera automatiquement marquée comme "Expirée" après la date de fin de validité
                </p>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCloseCarteForm}
              className="btn-secondary"
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Enregistrement...
                </>
              ) : editingCarte ? (
                <>
                  <Save size={18} />
                  Mettre à jour
                </>
              ) : (
                <>
                  <IdCard size={18} />
                  Créer la carte
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // RENDU DES CARTES
  const renderCartesModal = () => {
    if (!showCartes || !selectedBeneficiaireForCartes) return null;
    
    const ben = selectedBeneficiaireForCartes;
    
    return (
      <div className="modal-overlay" onClick={(e) => {
        if (e.target.className === 'modal-overlay' && !showCarteForm) {
          setShowCartes(false);
          setSelectedBeneficiaireForCartes(null);
          handleCloseCarteForm();
        }
      }}>
        <div className="modal-content large">
          <div className="modal-header">
            <h2>
              <IdCard size={20} /> Cartes - {ben.NOM_BEN} {ben.PRE_BEN}
            </h2>
            <button onClick={() => {
              setShowCartes(false);
              setSelectedBeneficiaireForCartes(null);
              handleCloseCarteForm();
            }} className="modal-close">
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body">
            {showCarteForm ? (
              renderCarteForm()
            ) : loadingCartes ? (
              <div className="loading">
                <Loader2 size={32} className="animate-spin" />
                <p>Chargement des cartes...</p>
              </div>
            ) : (
              <>
                <div className="cartes-actions">
                  <button 
                    onClick={() => handleOpenCarteForm(ben)} 
                    className="btn-primary"
                  >
                    <Plus size={18} /> Ajouter une carte
                  </button>
                  <div className="cartes-info">
                    <span>{cartes.length} carte(s) enregistrée(s)</span>
                  </div>
                </div>
                
                {cartes.length > 0 ? (
                  <div className="cartes-list">
                    <table>
                      <thead>
                        <tr>
                          <th>Numéro de carte</th>
                          <th>Type</th>
                          <th>Date d'émission</th>
                          <th>Date de début</th>
                          <th>Date d'expiration</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartes.map((carte, index) => {
                          const isExpired = new Date(carte.DFV_CAR) < new Date();
                          const today = new Date();
                          const expDate = new Date(carte.DFV_CAR);
                          const diffTime = Math.abs(expDate - today);
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          const isExpiringSoon = diffDays <= 30 && !isExpired;
                          
                          return (
                            <tr key={index} className={isExpired ? 'expired' : isExpiringSoon ? 'expiring' : ''}>
                              <td>
                                <div className="carte-numero">
                                  <strong>{carte.NUM_CAR}</strong>
                                  {carte.STS_CAR === 1 && (
                                    <span className="badge biometric">
                                      <Fingerprint size={12} /> Biométrique
                                    </span>
                                  )}
                                </div>
                                <div className="carte-details">
                                  {carte.COD_PAY} - {carte.COD_CAR}
                                </div>
                              </td>
                              <td>
                                {carteTypeOptions.find(opt => opt.value === carte.COD_CAR)?.label || carte.COD_CAR}
                              </td>
                              <td>
                                {carte.DAT_EMP ? formatDate(carte.DAT_EMP) : 'Non spécifiée'}
                              </td>
                              <td>
                                {formatDate(carte.DDV_CAR)}
                              </td>
                              <td className={isExpired ? 'expired-date' : isExpiringSoon ? 'expiring-soon' : ''}>
                                {formatDate(carte.DFV_CAR)}
                                {isExpiringSoon && (
                                  <span className="warning-text"> (Expire dans {diffDays} jours)</span>
                                )}
                              </td>
                              <td>
                                <span className={`status-badge ${getCarteStatusClass(carte)}`}>
                                  {getCarteStatusText(carte)}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    onClick={() => handleOpenCarteForm(ben, carte)}
                                    className="btn-action edit"
                                    title="Modifier"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCarte(carte)}
                                    className="btn-action delete"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <IdCard size={48} />
                    <h4>Aucune carte enregistrée</h4>
                    <p>Ce bénéficiaire n'a pas de carte enregistrée. Ajoutez-en une nouvelle.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // RENDU DES FAMILLES ACE
  const renderFamilleModal = () => {
    if (!showFamille || !selectedAssureForFamille) return null;
    
    const assure = selectedAssureForFamille;
    
    return (
      <div className="modal-overlay" onClick={(e) => {
        if (e.target.className === 'modal-overlay') {
          setShowFamille(false);
          setSelectedAssureForFamille(null);
          setShowAddAyantDroitForm(false);
        }
      }}>
        <div className="modal-content large">
          <div className="modal-header">
            <h2>
              <Users size={20} /> Composition Familiale - {assure.NOM_BEN} {assure.PRE_BEN}
            </h2>
            <button onClick={() => {
              setShowFamille(false);
              setSelectedAssureForFamille(null);
              setShowAddAyantDroitForm(false);
            }} className="modal-close">
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body">
            {loadingFamille ? (
              <div className="loading">
                <Loader2 size={32} className="animate-spin" />
                <p>Chargement de la composition familiale...</p>
              </div>
            ) : showAddAyantDroitForm ? (
              <div className="famille-form">
                <h3><UserPlus size={18} /> Ajouter un Ayant Droit</h3>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Ayant droit *</label>
                    <div className="beneficiaire-dropdown" ref={beneficiaireDropdownRef}>
                      <div 
                        className={`dropdown-toggle ${!ayantDroitFormData.ID_AYANT_DROIT ? 'placeholder' : ''}`}
                        onClick={() => {
                          const dropdown = document.querySelector('.beneficiaire-dropdown');
                          if (dropdown.classList.contains('open')) {
                            dropdown.classList.remove('open');
                          } else {
                            dropdown.classList.add('open');
                          }
                        }}
                      >
                        {ayantDroitFormData.ID_AYANT_DROIT ? (
                          <div className="selected-beneficiaire">
                            {(() => {
                              const selectedBen = beneficiairesDisponibles.find(
                                b => b.id.toString() === ayantDroitFormData.ID_AYANT_DROIT
                              );
                              return selectedBen ? (
                                <>
                                  <div className="selected-beneficiaire-info">
                                    <strong>{selectedBen.nom} {selectedBen.prenom}</strong>
                                    <div className="beneficiaire-details">
                                      <span>ID: {selectedBen.identifiant_national || 'N/A'}</span>
                                      <span>Tél: {selectedBen.telephone}</span>
                                      <span>Âge: {selectedBen.age} ans</span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAyantDroitFormData(prev => ({
                                        ...prev,
                                        ID_AYANT_DROIT: ''
                                      }));
                                    }}
                                    className="remove-beneficiaire"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              ) : 'Sélectionner un bénéficiaire';
                            })()}
                          </div>
                        ) : (
                          <span className="placeholder-text">
                            {loadingBeneficiaires ? (
                              <><Loader2 size={14} className="animate-spin" /> Chargement...</>
                            ) : (
                              'Sélectionner un bénéficiaire'
                            )}
                          </span>
                        )}
                        <ChevronDown size={16} />
                      </div>
                      
                      <div className="dropdown-menu">
                        {loadingBeneficiaires ? (
                          <div className="dropdown-loading">
                            <Loader2 size={16} className="animate-spin" />
                            <span>Chargement des bénéficiaires...</span>
                          </div>
                        ) : beneficiairesDisponibles.length > 0 ? (
                          <>
                            <div className="dropdown-search">
                              <Search size={14} />
                              <input
                                type="text"
                                placeholder="Rechercher un bénéficiaire..."
                                onChange={(e) => {
                                  const searchTerm = e.target.value.toLowerCase();
                                  // Filtrage optionnel
                                }}
                              />
                            </div>
                            <div className="dropdown-list">
                              {beneficiairesDisponibles.map(beneficiaire => (
                                <div
                                  key={beneficiaire.id}
                                  className="dropdown-item"
                                  onClick={() => {
                                    setAyantDroitFormData(prev => ({
                                      ...prev,
                                      ID_AYANT_DROIT: beneficiaire.id.toString()
                                    }));
                                    const dropdown = document.querySelector('.beneficiaire-dropdown');
                                    dropdown.classList.remove('open');
                                  }}
                                >
                                  <div className="beneficiaire-avatar">
                                    {beneficiaire.photo ? (
                                      <img src={beneficiaire.photo} alt={`${beneficiaire.nom} ${beneficiaire.prenom}`} />
                                    ) : (
                                      <div>{beneficiaire.sexe === 'F' ? '♀' : '♂'}</div>
                                    )}
                                  </div>
                                  <div className="beneficiaire-info">
                                    <strong>{beneficiaire.nom} {beneficiaire.prenom}</strong>
                                    <div className="beneficiaire-details">
                                      <span>ID: {beneficiaire.identifiant_national || 'N/A'}</span>
                                      <span>Tél: {beneficiaire.telephone}</span>
                                      <span>Âge: {beneficiaire.age} ans</span>
                                      <span>Profession: {beneficiaire.profession}</span>
                                      {beneficiaire.employeur && beneficiaire.employeur !== 'Non spécifié' && (
                                        <span>Employeur: {beneficiaire.employeur}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="dropdown-empty">
                            <Users size={24} />
                            <p>Aucun bénéficiaire disponible</p>
                            <small>Les bénéficiaires disponibles doivent être des assurés principaux sans ayants droits attachés</small>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="form-help">
                      <Info size={14} /> Sélectionnez un bénéficiaire existant dans la base de données
                    </p>
                  </div>
                  
                  <div className="form-group">
                    <label>Type d'ayant droit *</label>
                    <select
                      value={ayantDroitFormData.TYPE_AYANT_DROIT}
                      onChange={(e) => setAyantDroitFormData(prev => ({
                        ...prev,
                        TYPE_AYANT_DROIT: e.target.value
                      }))}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="CONJOINT">Conjoint</option>
                      <option value="ENFANT">Enfant</option>
                      <option value="ASCENDANT">Ascendant</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>
                </div>
                
                {ayantDroitFormData.TYPE_AYANT_DROIT === 'CONJOINT' && (
                  <div className="form-section">
                    <h3><Heart size={16} /> Informations du mariage</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Date du mariage</label>
                        <input
                          type="date"
                          value={ayantDroitFormData.DATE_MARIAGE}
                          onChange={(e) => setAyantDroitFormData(prev => ({
                            ...prev,
                            DATE_MARIAGE: e.target.value
                          }))}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Lieu du mariage</label>
                        <input
                          type="text"
                          value={ayantDroitFormData.LIEU_MARIAGE}
                          onChange={(e) => setAyantDroitFormData(prev => ({
                            ...prev,
                            LIEU_MARIAGE: e.target.value
                          }))}
                          placeholder="Lieu du mariage"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Numéro d'acte de mariage</label>
                        <input
                          type="text"
                          value={ayantDroitFormData.NUM_ACTE_MARIAGE}
                          onChange={(e) => setAyantDroitFormData(prev => ({
                            ...prev,
                            NUM_ACTE_MARIAGE: e.target.value
                          }))}
                          placeholder="Numéro d'acte de mariage"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="form-actions">
                  <button
                    onClick={() => setShowAddAyantDroitForm(false)}
                    className="btn-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddAyantDroit}
                    className="btn-primary"
                    disabled={saving || !ayantDroitFormData.ID_AYANT_DROIT || !ayantDroitFormData.TYPE_AYANT_DROIT}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Ajouter l'ayant droit
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="famille-actions">
                  <button 
                    onClick={() => setShowAddAyantDroitForm(true)} 
                    className="btn-primary"
                  >
                    <UserPlus size={18} /> Ajouter un ayant droit
                  </button>
                  <div className="famille-info">
                    <span>{compositionFamiliale.length} ayant(s) droit</span>
                  </div>
                </div>
                
                {compositionFamiliale.length > 0 ? (
                  <div className="famille-list">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Nom & Prénom</th>
                          <th>Type</th>
                          <th>Date de naissance</th>
                          <th>Âge</th>
                          <th>Téléphone</th>
                          <th>Date d'ajout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compositionFamiliale.map((membre, index) => (
                          <tr key={index}>
                            <td>
                              <div className="famille-id">
                                {membre.ID_BEN || membre.ID_AYANT_DROIT}
                              </div>
                            </td>
                            <td>
                              <div className="famille-nom">
                                <strong>{membre.NOM_BEN} {membre.PRE_BEN}</strong>
                                {membre.FIL_BEN && (
                                  <div className="famille-filiation">
                                    Filiation: {membre.FIL_BEN}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`statut-ace ${membre.STATUT_ACE ? membre.STATUT_ACE.toLowerCase() : ''}`}>
                                {membre.STATUT_ACE === 'CONJOINT' ? '👫 Conjoint' : 
                                 membre.STATUT_ACE === 'ENFANT' ? '👶 Enfant' : 
                                 membre.STATUT_ACE === 'ASCENDANT' ? '👵 Ascendant' : 
                                 membre.STATUT_ACE || 'Ayant droit'}
                              </span>
                              {membre.TYPE_AYANT_DROIT && membre.TYPE_AYANT_DROIT !== membre.STATUT_ACE && (
                                <div className="famille-type">
                                  <small>Type: {membre.TYPE_AYANT_DROIT}</small>
                                </div>
                              )}
                            </td>
                            <td>
                              {membre.NAI_BEN ? formatDate(membre.NAI_BEN) : 'Non spécifiée'}
                            </td>
                            <td>
                              {membre.NAI_BEN ? calculateAge(membre.NAI_BEN) + ' ans' : 'N/A'}
                            </td>
                            <td>
                              {membre.TELEPHONE_MOBILE || membre.TELEPHONE || 'N/A'}
                            </td>
                            <td>
                              {membre.DATE_AJOUT ? formatDate(membre.DATE_AJOUT) : 'Non spécifiée'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <Users size={48} />
                    <h4>Aucun ayant droit</h4>
                    <p>Cet assuré principal n'a pas encore d'ayants droit enregistrés.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

 // RENDU DE LA MODALE DE LA CARTE
const renderCardModal = () => {
  if (!showCard || !selectedBeneficiaireForCard) return null;
  
  const ben = selectedBeneficiaireForCard;
  const qrCodeUrl = qrCodeUrls[ben.ID_BEN || ben.id];
  const photoUrl = ben.PHOTO || ben.photo || ben.PHOTO_URL || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(ben.NOM_BEN + ' ' + ben.PRE_BEN)}&size=200&background=random`;
  
  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target.className === 'modal-overlay') {
        handleCloseCard();
      }
    }}>
      <div className="modal-content xlarge">
        <div className="modal-header">
          <h2>
            <IdCard size={20} /> Carte Bénéficiaire - {ben.NOM_BEN} {ben.PRE_BEN}
          </h2>
          <button onClick={handleCloseCard} className="modal-close">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="card-preview-container">
            <div className="card-preview-wrapper">
              <div className="card-instructions">
                <div className="instructions-box">
                  <h3><Info size={18} /> Instructions</h3>
                  <ul>
                    <li><strong>Format :</strong> A6 paysage (148mm x 105mm)</li>
                    <li><strong>Recto :</strong> Photo + QR Code + Nom</li>
                    <li><strong>Verso :</strong> Informations du courtier d'assurances</li>
                    <li><strong>QR Code :</strong> Contient l'identifiant national et l'employeur</li>
                    <li><strong>Validité :</strong> 1 an à partir de la date d'émission</li>
                    <li><strong>Papier recommandé :</strong> Cartonné 250-300g/m²</li>
                  </ul>
                </div>
              </div>
              
              <div className="card-preview-area">
                <div className="preview-controls">
                  <button 
                    className={`preview-control-btn ${cardSide === 'front' ? 'active' : ''}`}
                    onClick={() => setCardSide('front')}
                  >
                    Recto
                  </button>
                  <button 
                    className={`preview-control-btn ${cardSide === 'back' ? 'active' : ''}`}
                    onClick={() => setCardSide('back')}
                  >
                    Verso
                  </button>
                </div>
                
                <div className="preview-custom-container">
                  {cardSide === 'front' ? (
                    <div className="preview-custom-front">
                      <div className="preview-custom-content">
                        <div className="preview-custom-header">
                          <div className="preview-custom-title">
                            <div className="preview-custom-title-main">HCSINSURANCE</div>
                            <div className="preview-custom-title-sub">CARTE TIERS PAYANT</div>
                          </div>
                        </div>
                        
                        <div className="preview-custom-body">
                          <div className="preview-custom-photo-qr-container">
               
                            <div className="preview-custom-photo-section">
                              <div className="preview-custom-photo-frame">
                                <img 
                                  src={photoUrl} 
                                  alt="Photo bénéficiaire"
                                  className="preview-custom-photo"
                                  onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ben.NOM_BEN + ' ' + ben.PRE_BEN)}&size=200&background=random`;
                                  }}
                                />
                              </div>
                            </div>
                            
        
                            <div className="preview-custom-qr-section">
                              <div className="preview-custom-qr-frame">
                                {qrCodeUrl ? (
                                  <img 
                                    src={qrCodeUrl} 
                                    alt="QR Code"
                                    className="preview-custom-qr"
                                  />
                                ) : (
                                  <div className="qr-placeholder">
                                    <QrCode size={48} />
                                    <span>QR Code à générer</span>
                                  </div>
                                )}
                              </div>
                              <div className="preview-custom-qr-info">
                                Identifiant: {ben.IDENTIFIANT_NATIONAL || 'N/A'}
                                {ben.EMPLOYEUR && ben.EMPLOYEUR !== 'Non spécifié' && (
                                  <div>Employeur: {ben.EMPLOYEUR}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="preview-custom-footer">
                          <div className="preview-custom-name-section">
                            <div className="preview-custom-name">
                              <strong>{ben.NOM_BEN || ''} {ben.PRE_BEN || ''}</strong>
                            </div>
                            <div className="preview-custom-details">
                              <div>Tél: {ben.TELEPHONE_MOBILE || ''}</div>
                              <div>Passport: {ben.NUM_PASSEPORT || ''}</div>
                            </div>
                            <div className="preview-custom-recto">recto</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="preview-custom-back">
                      <div className="preview-custom-back-content">
                        <div className="preview-custom-back-header">
                          <div className="preview-custom-back-logo">
                            <img src={AMSlogo} alt="HCSLogo" />
                          </div>
                          <div className="preview-custom-back-title">
                            <h1>HCSINSURANCE</h1>
                            <div className="preview-custom-back-subtitle">CARTE SANTÉ</div>
                            <div className="preview-custom-back-subtitle2">COURTIER D'ASSURANCES</div>
                          </div>
                        </div>
                        
                        <div className="preview-custom-back-address">
                          Bonapriso, Rue VASNITEX, Immeuble ATLANTIS / Avenue Winton Churchill, Immeuble mitoyen à l'OAPI ( Yaoundé )<br />
                          BP 4962 Douala – Cameroun<br />
                          Tel : 2 33 42 08 74 / 6 99 90 60 88 / 690096197
                        </div>
                        
                        <div className="preview-custom-back-support">
                          Support Technique: +237 690 09 61 97 / +237 674 29 01 49
                        </div>
                        
                        <div className="preview-custom-back-notice">
                          Cette carte est strictement personnelle et est la propriété exclusive d'HCSINSURANCE. 
                          En cas de perte, merci de bien vouloir nous la retourner.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="card-actions">
                  <div className="action-buttons-grid">
                    <button onClick={handleDownloadCard} className="btn-success download-btn">
                      <Download size={18} /> Télécharger la carte
                    </button>
                    <button onClick={handleCloseCard} className="btn-secondary">
                      <X size={18} /> Fermer
                    </button>
                  </div>
                  
                  <div className="format-info">
                    <small>Format : A6 paysage (148x105mm) - QR Code contient: identifiant national et employeur</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  // RENDU DES REMBOURSEMENTS
  const renderRemboursementsModal = () => {
    if (!showRemboursements || !selectedBeneficiaireForRemboursements) return null;
    
    const ben = selectedBeneficiaireForRemboursements;
    
    return (
      <div className="modal-overlay" onClick={(e) => {
        if (e.target.className === 'modal-overlay') {
          setShowRemboursements(false);
          setSelectedBeneficiaireForRemboursements(null);
        }
      }}>
        <div className="modal-content xlarge">
          <div className="modal-header">
            <h2>
              <Wallet size={20} /> Remboursements - {ben.NOM_BEN} {ben.PRE_BEN}
            </h2>
            <button onClick={() => {
              setShowRemboursements(false);
              setSelectedBeneficiaireForRemboursements(null);
            }} className="modal-close">
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body">
            {loadingRemboursements ? (
              <div className="loading">
                <Loader2 size={32} className="animate-spin" />
                <p>Chargement des remboursements...</p>
              </div>
            ) : remboursements.length > 0 ? (
              <div className="remboursements-list">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Montant facturé</th>
                      <th>Montant remboursé</th>
                      <th>Taux de remboursement</th>
                      <th>Type de soin</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remboursements.map((remboursement, index) => (
                      <tr key={index}>
                        <td>{formatDate(remboursement.DATE_REMBOURSEMENT)}</td>
                        <td>{remboursement.MTX_REM?.toLocaleString('fr-FR')} FCFA</td>
                        <td><strong>{remboursement.MTR_REM?.toLocaleString('fr-FR')} FCFA</strong></td>
                        <td>
                          {remboursement.MTX_REM > 0 ? (
                            <span className={`taux-badge ${(remboursement.MTR_REM / remboursement.MTX_REM * 100) >= 80 ? 'high' : 'low'}`}>
                              {Math.round(remboursement.MTR_REM / remboursement.MTX_REM * 100)}%
                            </span>
                          ) : 'N/A'}
                        </td>
                        <td>{remboursement.TYPE_SOIN || 'Non spécifié'}</td>
                        <td>
                          <span className={`status-badge ${remboursement.STATUT?.toLowerCase() || ''}`}>
                            {remboursement.STATUT}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="remboursements-summary">
                  <div className="summary-item">
                    <span className="summary-label">Total remboursé:</span>
                    <span className="summary-value">
                      {remboursements.reduce((sum, r) => sum + (r.MTR_REM || 0), 0).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Nombre de remboursements:</span>
                    <span className="summary-value">{remboursements.length}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <Wallet size={48} />
                <h4>Aucun remboursement trouvé</h4>
                <p>Ce bénéficiaire n'a pas de remboursement enregistré</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const totalBeneficiaires = filteredBeneficiaires.length;

  return (
    <div className="beneficiaires-container">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="notification-close">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="header-actions">
        <button 
          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)} 
          className={`btn-secondary ${showAdvancedSearch ? 'active' : ''}`}
        >
          <Filter size={18} /> Recherche avancée
        </button>
        
        <button 
          onClick={handleSyncData} 
          className={`btn-info ${syncing ? 'loading' : ''}`}
          disabled={syncing}
          title="Synchroniser les données avec le serveur"
        >
          {syncing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Synchronisation...
            </>
          ) : (
            <>
              <Upload size={18} /> Synchroniser
            </>
          )}
        </button>
        
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={18} /> Nouveau Bénéficiaire
        </button>
      </div>

      {showAdvancedSearch && renderAdvancedSearch()}

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={20} />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, téléphone, identifiant, employeur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && loadBeneficiaires()}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search">
              <X size={18} />
            </button>
          )}
        </div>
        <button onClick={loadBeneficiaires} className="btn-refresh" title="Rafraîchir">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon primary">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Bénéficiaires totaux</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <User size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.assuresPrincipaux}</h3>
            <p>Assurés principaux</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.ayantsDroit}</h3>
            <p>Ayants droit</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.avecAssurancePrivee}</h3>
            <p>Avec assurance privée</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">
            <Loader2 size={32} className="animate-spin" />
            <p>Chargement des bénéficiaires...</p>
          </div>
        ) : totalBeneficiaires === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h4>Aucun bénéficiaire trouvé</h4>
            <p>
              {searchTerm || Object.keys(advancedFilters).filter(k => advancedFilters[k] !== '' && advancedFilters[k] !== false).length > 0
                ? 'Aucun résultat pour votre recherche'
                : 'Commencez par ajouter un nouveau bénéficiaire'}
            </p>
            {!searchTerm && Object.keys(advancedFilters).filter(k => advancedFilters[k] !== '' && advancedFilters[k] !== false).length === 0 && (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus size={18} /> Ajouter un bénéficiaire
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <div className="table-info">
              <span>{totalBeneficiaires} bénéficiaire(s) trouvé(s)</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>ID</th>
                  <th>Nom & Prénom</th>
                  <th>Âge/Sexe</th>
                  <th>Contact</th>
                  <th>Statut ACE</th>
                  <th>Employeur</th>
                  <th>Assurance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeneficiaires.map(ben => {
                  const isAssurePrincipal = !ben.STATUT_ACE || ben.STATUT_ACE === '' || ben.STATUT_ACE === null;
                  const age = ben.AGE || calculateAge(ben.NAI_BEN);
                  
                  return (
                    <tr key={ben.ID_BEN || ben.id}>
                       <td className="photo-cell">
  <div className="patient-photo">
    <BeneficiaryPhoto 
      photoUrl={ben.PHOTO || ben.photo || ben.PHOTO_URL}  // Prioriser PHOTO
      sex={ben.SEX_BEN}
      size="small"
    />
  </div>
</td>
                      <td className="id-cell">
                        <div className="identifier-cell">
                          <div className="beneficiary-id">#{ben.ID_BEN || ben.id}</div>
                          {ben.IDENTIFIANT_NATIONAL && (
                            <div className="national-id">
                              <small>{ben.IDENTIFIANT_NATIONAL}</small>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="patient-info">
                          <div>
                            <strong>{ben.NOM_BEN} {ben.PRE_BEN}</strong>
                            {ben.FIL_BEN && (
                              <div className="patient-nom-marital">
                                Filiation: {ben.FIL_BEN}
                              </div>
                            )}
                            <div className="patient-profession">
                              {ben.PROFESSION || 'Non spécifié'}
                            </div>
                            <div className="patient-zone">
                              <MapPin size={12} /> {ben.ZONE_HABITATION || 'Zone non spécifiée'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="age-sex">
                          <span className="age">{age} ans</span>
                          <span className={`sex ${ben.SEX_BEN === 'M' ? 'male' : 'female'}`}>
                            {ben.SEX_BEN === 'M' ? '♂ Masculin' : '♀ Féminin'}
                          </span>
                          <div className="date-naissance">
                            <Calendar size={12} /> {formatDate(ben.NAI_BEN)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-info">
                          <div><Phone size={14} /> {ben.TELEPHONE_MOBILE || ben.TELEPHONE || 'N/A'}</div>
                          {ben.EMAIL && <div><Mail size={14} /> {ben.EMAIL}</div>}
                        </div>
                      </td>
                      <td>
                        <div className="statut-ace-container">
                          {isAssurePrincipal ? (
                            <span className="statut-ace principal">
                              <User size={12} /> Assuré Principal
                            </span>
                          ) : (
                            <span className={`statut-ace ayant-droit ${ben.STATUT_ACE ? ben.STATUT_ACE.toLowerCase() : ''}`}>
                              {ben.STATUT_ACE === 'CONJOINT' ? '👫 Conjoint' : 
                               ben.STATUT_ACE === 'ENFANT' ? '👶 Enfant' : 
                               ben.STATUT_ACE === 'ASCENDANT' ? '👵 Ascendant' : ben.STATUT_ACE || 'Ayant droit'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="employeur-info">
                          {ben.EMPLOYEUR && ben.EMPLOYEUR !== 'Non spécifié' ? (
                            <span className="employeur-badge">
                              <Briefcase size={12} /> {ben.EMPLOYEUR}
                            </span>
                          ) : (
                            <span className="employeur-badge empty">
                              Non spécifié
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="assurance-info">
                          {ben.ASSURANCE_PRIVE ? (
                            <span className="assurance-badge has-insurance">
                              <Shield size={12} /> Assurance privée
                            </span>
                          ) : (
                            <span className="assurance-badge no-insurance">
                              Sans assurance privée
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEdit(ben)}
                            className="btn-action edit"
                            title="Modifier"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenDossierMedical(ben)}
                            className="btn-action medical"
                            title="Dossier médical"
                          >
                            <Clipboard size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBeneficiaireForCartes(ben);
                              setShowCartes(true);
                              loadCartes(ben.ID_BEN || ben.id);
                              setShowCarteForm(false);
                            }}
                            className="btn-action card"
                            title="Gérer les cartes"
                          >
                            <IdCard size={16} />
                          </button>
                         
                          {isAssurePrincipal && (
                            <button
                              onClick={() => handleOpenFamilleModal(ben)}
                              className="btn-action famille"
                              title="Composition familiale"
                            >
                              <Users size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenCard(ben)}
                            className="btn-action print-card"
                            title="Générer la carte"
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(ben)}
                            className="btn-action delete"
                            title="Mettre en retrait"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {renderBeneficiaireForm()}
      {renderMedicalDataModal()}
      {renderCartesModal()}
      {renderRemboursementsModal()}
      {renderFamilleModal()}
      {renderCardModal()}
      {renderSyncResultsModal()}
    </div>
  );
};

export default Beneficiaires;