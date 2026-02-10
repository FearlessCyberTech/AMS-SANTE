import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Dropdown, Modal, Form, Select, Input, DatePicker, Tag, Space, message, Tabs, Descriptions, Tooltip, Popconfirm, Spin, Upload, Alert, Divider, Badge, Typography, Empty, Avatar, InputNumber, Switch, Radio, Steps, Popover, Statistic, List, Table, Card, Row, Col, Button } from 'antd';
import {
  CloudSyncOutlined, DownOutlined, UserOutlined, TeamOutlined, IdcardOutlined,
  FileTextOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  SearchOutlined, SyncOutlined, DownloadOutlined, UploadOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, PhoneOutlined, MailOutlined,
  EnvironmentOutlined, BankOutlined, MedicineBoxOutlined, SafetyCertificateOutlined,
  CreditCardOutlined, CameraOutlined, PrinterOutlined, QrcodeOutlined, FilterOutlined,
  ReloadOutlined, SaveOutlined, CloseOutlined, InfoCircleOutlined, ManOutlined,
  WomanOutlined, HomeOutlined, CarOutlined, HeartOutlined, FileAddOutlined,
  TabletOutlined, StarOutlined, SettingOutlined, AppstoreOutlined, DatabaseOutlined,
  BarChartOutlined, PieChartOutlined, LineChartOutlined, ArrowUpOutlined,
  ArrowDownOutlined, DashboardOutlined, UserAddOutlined, UserSwitchOutlined,
  UserDeleteOutlined, CalendarOutlined, FlagOutlined, GlobalOutlined, ShopOutlined,
  ClusterOutlined, ApartmentOutlined, ContactsOutlined, CrownOutlined, DollarOutlined,
  InsuranceOutlined, LockOutlined, MessageOutlined, NotificationOutlined,
  TrophyOutlined, WalletOutlined, ExperimentOutlined, SmileOutlined, SolutionOutlined,
  ToolOutlined, UsergroupAddOutlined, WifiOutlined, CloudUploadOutlined,
  FileExcelOutlined, FilePdfOutlined, BarcodeOutlined
} from '@ant-design/icons';
import html2canvas from 'html2canvas';
import moment from 'moment';
import 'moment/locale/fr';
import jsPDF from 'jspdf';
import {
  beneficiairesAPI, famillesACEAPI, paysAPI, policesAPI, syncAPI,
  centresAPI, compagniesAPI, reseauSoinsAPI, baremesAPI
} from '../../services/api';
import AMSlogo from "../../assets/AMS-logo.png";
import FrontbackgroundCard from "../../assets/FrontbackgroundCard.png";
import backgroundCard from "../../assets/backBackground.jpeg";

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;
const { TabPane } = Tabs;
const { Step } = Steps;

// Cache pour éviter les appels API répétés
const photoCache = new Map();

const Beneficiaires = () => {
  // ==================== ÉTATS PRINCIPAUX ====================
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [loading, setLoading] = useState({
    main: false,
    table: false,
    form: false,
    polices: false,
    cartes: false,
    centres: false,
    export: false,
    compagnies: false
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filtres, setFiltres] = useState({
    statut_ace: 'tous',
    sexe: 'tous',
    cod_pay: 'tous',
    date_debut: null,
    date_fin: null,
    employeur: '',
    age_min: '',
    age_max: ''
  });
  
  // ==================== ÉTATS MODALES ====================
  const [policesModal, setPolicesModal] = useState(false);
  const [selectedBeneficiaireForPolices, setSelectedBeneficiaireForPolices] = useState(null);
  const [polices, setPolices] = useState([]);
  const [showPoliceForm, setShowPoliceForm] = useState(false);
  const [editingPolice, setEditingPolice] = useState(null);
  
  const [cartesModal, setCartesModal] = useState(false);
  const [selectedBeneficiaireForCartes, setSelectedBeneficiaireForCartes] = useState(null);
  const [cartes, setCartes] = useState([]);
  const [showCarteForm, setShowCarteForm] = useState(false);
  const [editingCarte, setEditingCarte] = useState(null);
  
  const [centresModal, setCentresModal] = useState(false);
  const [selectedBeneficiaireForCentres, setSelectedBeneficiaireForCentres] = useState(null);
  const [centres, setCentres] = useState([]);
  const [allCentres, setAllCentres] = useState([]);
  const [showCentreForm, setShowCentreForm] = useState(false);
  const [editingCentre, setEditingCentre] = useState(null);
  
  const [carteModal, setCarteModal] = useState(false);
  const [selectedBeneficiaireForCard, setSelectedBeneficiaireForCard] = useState(null);
  const [cardSide, setCardSide] = useState('front');
  
  const [exportModal, setExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  
  const [syncModal, setSyncModal] = useState(false);
  const [syncType, setSyncType] = useState('ace');
  const [syncProgress, setSyncProgress] = useState({
    step: 0,
    total: 0,
    current: 0,
    message: '',
    details: ''
  });
  
  const [policeGestionModal, setPoliceGestionModal] = useState(false);
  const [linkBeneficiaireModal, setLinkBeneficiaireModal] = useState(false);
  const [selectedPoliceForLinking, setSelectedPoliceForLinking] = useState(null);
  const [availablePolicesForLinking, setAvailablePolicesForLinking] = useState([]);
  const [beneficiairesForLinking, setBeneficiairesForLinking] = useState([]);
  const [selectedBeneficiaires, setSelectedBeneficiaires] = useState([]);
  
  // ==================== ÉTATS FORMULAIRES ====================
  const [form] = Form.useForm();
  const [policeForm] = Form.useForm();
  const [carteForm] = Form.useForm();
  const [centreForm] = Form.useForm();
  const [linkForm] = Form.useForm();
  
  // ==================== ÉTATS DONNÉES ====================
  const [paysList, setPaysList] = useState([]);
  const [compagniesList, setCompagniesList] = useState([]);
  const [reseauSoinsList, setReseauSoinsList] = useState([]);
  const [employeursList, setEmployeursList] = useState([]);
  const [assuresPrincipaux, setAssuresPrincipaux] = useState([]);
  const [baremesList, setBaremesList] = useState([]);
  const [selectedBaremes, setSelectedBaremes] = useState([]);
  const [loadingBaremes, setLoadingBaremes] = useState(false);
  
  // ==================== ÉTATS PHOTOS ====================
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  
  // ==================== ÉTATS STATISTIQUES ====================
  const [stats, setStats] = useState({
    total: 0,
    assuresPrincipaux: 0,
    ayantsDroit: 0,
    avecAssurancePrivee: 0,
    actifs: 0,
    inactifs: 0
  });

  const cardRef = useRef(null);



  // ==================== FONCTIONS UTILITAIRES ====================
  // Ajoutez cette fonction utilitaire
const loadTauxCouvertureBatch = async (beneficiaireIds) => {
  try {
    const response = await policesAPI.getTauxCouvertureBatch(beneficiaireIds);
    if (response.success) {
      return response.tauxParBeneficiaire || {};
    }
    return {};
  } catch (error) {
    console.error('Erreur chargement batch taux couverture:', error);
    return {};
  }
};

// Puis modifiez loadBeneficiaires pour utiliser le batch loading
const loadBeneficiaires = useCallback(async () => {
  setLoading(prev => ({ ...prev, table: true }));
  try {
    const params = {
      search: searchTerm,
      limit: 100,
      ...(filtres.statut_ace !== 'tous' && { statut_ace: filtres.statut_ace }),
      ...(filtres.sexe !== 'tous' && { sexe: filtres.sexe }),
      ...(filtres.cod_pay !== 'tous' && { cod_pay: filtres.cod_pay }),
      ...(filtres.date_debut && { date_debut: filtres.date_debut.format('YYYY-MM-DD') }),
      ...(filtres.date_fin && { date_fin: filtres.date_fin.format('YYYY-MM-DD') }),
      ...(filtres.employeur && { employeur: filtres.employeur }),
      ...(filtres.age_min && { age_min: parseInt(filtres.age_min) }),
      ...(filtres.age_max && { age_max: parseInt(filtres.age_max) })
    };
    
    const response = await beneficiairesAPI.searchAdvanced(searchTerm, params, 100);
    
    if (response.success) {
      const beneficiairesList = Array.isArray(response.beneficiaires) ? response.beneficiaires : (response.data || []);
      
      // Extraire tous les IDs de bénéficiaires
      const beneficiaireIds = beneficiairesList
        .map(ben => ben.ID_BEN || ben.id)
        .filter(id => id);
      
<<<<<<< HEAD
      // Charger tous les taux de couverture en une seule requête
      const tauxParBeneficiaire = await loadTauxCouvertureBatch(beneficiaireIds);
=======
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
>>>>>>> d90a12e2bad9383f696451b6f983404524d7015b
      
      const formattedBeneficiaires = beneficiairesList.map(ben => {
        let employeur = 'Non spécifié';
        if (ben.EMPLOYEUR && ben.EMPLOYEUR !== '') {
          employeur = ben.EMPLOYEUR;
        } else if (ben.employeur && ben.employeur !== '') {
          employeur = ben.employeur;
        }
        
        const age = calculateAge(ben.NAI_BEN || ben.date_naissance);
        
        return {
          key: generateUniqueKey('benef', ben.ID_BEN || ben.id),
          ID_BEN: ben.ID_BEN || ben.id,
          NOM_BEN: ben.NOM_BEN || ben.nom || '',
          PRE_BEN: ben.PRE_BEN || ben.prenom || '',
          FIL_BEN: ben.FIL_BEN || ben.nom_marital || '',
          SEX_BEN: ben.SEX_BEN || ben.sexe || 'M',
          NAI_BEN: ben.NAI_BEN || ben.date_naissance || '',
          IDENTIFIANT_NATIONAL: ben.IDENTIFIANT_NATIONAL || ben.identifiant_national || '',
          TELEPHONE_MOBILE: ben.TELEPHONE_MOBILE || ben.telephone_mobile || ben.telephone || '',
          EMAIL: ben.EMAIL || ben.email || '',
          PROFESSION: ben.PROFESSION || ben.profession || '',
          EMPLOYEUR: employeur,
          STATUT_ACE: ben.STATUT_ACE || ben.statut_ace || '',
          ID_ASSURE_PRINCIPAL: ben.ID_ASSURE_PRINCIPAL || ben.id_assure_principal || null,
          ID_CENTRE_SANTE: ben.ID_CENTRE_SANTE || ben.id_centre_sante || null,
          PHOTO: ben.PHOTO || ben.photo || null,
          AGE: age,
          COD_PAY: ben.COD_PAY || 'CMR',
          ASSURANCE_PRIVE: ben.ASSURANCE_PRIVE || false,
          STATUT: ben.STATUT || 'ACTIF',
          tauxCouverture: tauxParBeneficiaire[ben.ID_BEN || ben.id] || 0
        };
      });
      
      setBeneficiaires(formattedBeneficiaires);
      
      // Mettre à jour les statistiques (restent les mêmes)
      const total = formattedBeneficiaires.length;
      const assuresPrincipaux = formattedBeneficiaires.filter(b => !b.STATUT_ACE || b.STATUT_ACE === '').length;
      const ayantsDroit = formattedBeneficiaires.filter(b => b.STATUT_ACE && b.STATUT_ACE !== '').length;
      const avecAssurancePrivee = formattedBeneficiaires.filter(b => b.ASSURANCE_PRIVE).length;
      const actifs = formattedBeneficiaires.filter(b => b.STATUT === 'ACTIF').length;
      const inactifs = total - actifs;
      
      setStats({ total, assuresPrincipaux, ayantsDroit, avecAssurancePrivee, actifs, inactifs });
      
      // Mettre à jour la liste des assurés principaux
      const assures = formattedBeneficiaires
        .filter(ben => !ben.STATUT_ACE || ben.STATUT_ACE === '' || ben.STATUT_ACE === null)
        .map(assure => ({
          id: assure.ID_BEN,
          nom: assure.NOM_BEN,
          prenom: assure.PRE_BEN,
          nom_marital: assure.FIL_BEN,
          sexe: assure.SEX_BEN,
          telephone: assure.TELEPHONE_MOBILE,
          identifiant_national: assure.IDENTIFIANT_NATIONAL,
          age: assure.AGE,
          employeur: assure.EMPLOYEUR,
          photo: assure.PHOTO,
          tauxCouverture: assure.tauxCouverture
        }));
      setAssuresPrincipaux(assures);
      
      // Charger les employeurs
      loadEmployeursList(formattedBeneficiaires);
      
      message.success(`${formattedBeneficiaires.length} bénéficiaire(s) chargé(s) avec taux de couverture`);
    } else {
      message.error(response.message || 'Erreur lors du chargement');
      setBeneficiaires([]);
    }
  } catch (error) {
    console.error('Erreur chargement bénéficiaires:', error);
    message.error('Erreur de connexion avec le serveur');
    setBeneficiaires([]);
  } finally {
    setLoading(prev => ({ ...prev, table: false }));
  }
}, [searchTerm, filtres]);

  const generateUniqueKey = (prefix, id) => {
    return `${prefix}-${id || 'unknown'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifié';
    return moment(dateString).format('DD/MM/YYYY');
  };

  const calculateAge = (dateString) => {
    if (!dateString) return 0;
    return moment().diff(moment(dateString), 'years');
  };

  const genererIdentifiantNational = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `AMS${timestamp}${random}`;
  };

  const generateCarteNumber = (beneficiaire, carteType = 'PRM') => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const beneficiaireId = beneficiaire.ID_BEN || beneficiaire.id || 0;
    const sequential = beneficiaireId.toString().padStart(5, '0');
    return `CMR-${carteType}-${year}${month}-${sequential}`;
  };

  const getPoliceTypeLabel = (typeCode) => {
    const mapping = {
      'I': 'Individuelle',
      'F': 'Familiale',
      'C': 'Collective',
      'E': 'Entreprise',
      'G': 'Groupe'
    };
    return mapping[typeCode] || 'Individuelle';
  };

  // ==================== COMPOSANT BENEFICIAIRE AVATAR ====================
  const BeneficiaireAvatar = React.memo(({ beneficiaire, size = 40 }) => {
    const [photoUrl, setPhotoUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
      let isMounted = true;
      let timeoutId;

      const loadPhoto = async () => {
        if (!beneficiaire?.ID_BEN) {
          if (isMounted) {
            setPhotoUrl(null);
            setError(false);
            setLoading(false);
          }
          return;
        }

        const cacheKey = `photo-${beneficiaire.ID_BEN}`;
        
        if (photoCache.has(cacheKey)) {
          const cached = photoCache.get(cacheKey);
          if (isMounted) {
            setPhotoUrl(cached.photoUrl);
            setError(cached.error || false);
            setLoading(false);
          }
          return;
        }

        try {
          if (isMounted) {
            setLoading(true);
            setError(false);
          }
          
          const response = await beneficiairesAPI.getPhoto(beneficiaire.ID_BEN);
          
          if (response.success && response.photoUrl) {
            const url = response.photoUrl;
            
            timeoutId = setTimeout(() => {
              if (isMounted) {
                photoCache.set(cacheKey, { photoUrl: null, error: true });
                setPhotoUrl(null);
                setError(true);
                setLoading(false);
              }
            }, 2000);
            
            const img = new Image();
            img.onload = () => {
              clearTimeout(timeoutId);
              if (isMounted) {
                photoCache.set(cacheKey, { photoUrl: url, error: false });
                setPhotoUrl(url);
                setError(false);
                setLoading(false);
              }
            };
            
            img.onerror = () => {
              clearTimeout(timeoutId);
              if (isMounted) {
                photoCache.set(cacheKey, { photoUrl: null, error: true });
                setPhotoUrl(null);
                setError(true);
                setLoading(false);
              }
            };
            
            img.src = url;
          } else {
            photoCache.set(cacheKey, { photoUrl: null, error: true });
            if (isMounted) {
              setPhotoUrl(null);
              setError(true);
              setLoading(false);
            }
          }
        } catch (error) {
          console.warn('⚠️ Erreur chargement photo bénéficiaire', beneficiaire.ID_BEN, error.message);
          photoCache.set(cacheKey, { photoUrl: null, error: true });
          if (isMounted) {
            setPhotoUrl(null);
            setError(true);
            setLoading(false);
          }
        }
      };

      loadPhoto();

      return () => {
        isMounted = false;
        if (timeoutId) clearTimeout(timeoutId);
      };
    }, [beneficiaire?.ID_BEN]);

    const avatarKey = useMemo(() => {
      if (beneficiaire?.ID_BEN) {
        return `avatar-${beneficiaire.ID_BEN}-${photoUrl ? 'photo' : 'default'}`;
      }
      return `avatar-${Date.now()}-${Math.random()}`;
    }, [beneficiaire?.ID_BEN, photoUrl]);

    if (loading) {
      return (
        <Avatar
          key={`${avatarKey}-loading`}
          size={size}
          icon={<UserOutlined />}
          style={{ backgroundColor: '#f0f0f0' }}
        />
      );
    }

    if (error || !photoUrl) {
      return (
        <Avatar
          key={`${avatarKey}-default`}
          size={size}
          icon={beneficiaire?.SEX_BEN === 'F' ? <WomanOutlined /> : <ManOutlined />}
          style={{ backgroundColor: beneficiaire?.SEX_BEN === 'F' ? '#f56a00' : '#1890ff' }}
        />
      );
    }

    return (
      <Avatar
        key={avatarKey}
        size={size}
        src={photoUrl}
        alt={`${beneficiaire?.NOM_BEN || ''} ${beneficiaire?.PRE_BEN || ''}`.trim()}
        onError={() => {
          setPhotoUrl(null);
          setError(true);
        }}
        style={{ objectFit: 'cover' }}
      />
    );
  });

  BeneficiaireAvatar.displayName = 'BeneficiaireAvatar';

  // ==================== CHARGEMENT DES DONNÉES ====================
  const loadReferenceData = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userCentreId = user?.centre_id || user?.COD_CEN || user?.prestataire?.centre_id || null;
      
      // Charger les pays
      const paysResponse = await paysAPI.getAll();
      if (paysResponse && paysResponse.success) {
        setPaysList(paysResponse.pays || []);
      }
      
      // Charger les centres selon les permissions
      let centresResponse;
      if (user && !user.super_admin && userCentreId) {
        centresResponse = await centresAPI.getById(userCentreId);
      } else {
        centresResponse = await centresAPI.getAll({ limit: 100 });
      }
      
      if (centresResponse && centresResponse.success) {
        const centresData = centresResponse.centres || centresResponse.data || [];
        const formattedCentres = Array.isArray(centresData) ? centresData.map(centre => ({
          ID_CENTRE: centre.ID_CENTRE || centre.id || centre.CODE_CENTRE || centre.COD_CEN,
          CODE_CENTRE: centre.CODE_CENTRE || centre.code_centre || centre.COD_CEN || centre.ID_CENTRE,
          NOM_CENTRE: centre.NOM_CENTRE || centre.nom_centre || centre.nom || centre.LIB_CEN || '',
          TYPE_CENTRE: centre.TYPE_CENTRE || centre.type_centre || centre.TYP_CEN || 'HOPITAL',
          ADRESSE: centre.ADRESSE || centre.adresse || centre.NUM_ADR || '',
          TELEPHONE: centre.TELEPHONE || centre.telephone || centre.TR1_CEN || '',
          EMAIL: centre.EMAIL || centre.email || '',
          SPECIALITES: centre.SPECIALITES || centre.specialites || [],
          CONVENTIONNE: centre.CONVENTIONNE !== undefined ? centre.CONVENTIONNE : true,
          STATUT_CENTRE: centre.STATUT_CENTRE || centre.statut_centre || centre.STATUT || 'ACTIF'
        })) : [];
        setAllCentres(formattedCentres);
      }
    } catch (error) {
      console.error('❌ Erreur chargement données de référence:', error);
      message.error('Erreur lors du chargement des données de référence');
    }
  }, []);

  const loadEmployeursList = useCallback(async (beneficiairesData = beneficiaires) => {
    try {
      const response = await beneficiairesAPI.getEmployeurs();
      if (response && response.success && response.employeurs) {
        const employeurs = response.employeurs || [];
        const nomsEmployeurs = employeurs
          .filter(emp => emp && emp !== '')
          .map(emp => {
            if (typeof emp === 'string') return emp.trim();
            if (emp.nom) return emp.nom.trim();
            if (emp.EMPLOYEUR) return emp.EMPLOYEUR.trim();
            return String(emp).trim();
          })
          .filter(emp => emp !== '' && emp !== 'null' && emp !== 'undefined' && emp !== 'Non spécifié')
          .filter((value, index, self) => self.indexOf(value) === index);
        setEmployeursList(nomsEmployeurs);
        return;
      }
    } catch (apiError) {
      console.warn('⚠️ API employeurs échouée:', apiError.message);
    }
    
    // Fallback: extraire des bénéficiaires
    const employeursSet = new Set();
    const dataSource = beneficiairesData || beneficiaires;
    dataSource.forEach(ben => {
      if (ben.EMPLOYEUR && ben.EMPLOYEUR.trim() !== '' && ben.EMPLOYEUR !== 'Non spécifié' && ben.EMPLOYEUR !== 'null' && ben.EMPLOYEUR !== 'undefined') {
        employeursSet.add(ben.EMPLOYEUR.trim());
      }
    });
    setEmployeursList(Array.from(employeursSet));
  }, [beneficiaires]);



  const loadBaremes = async (cod_pay = 'CMR') => {
    setLoadingBaremes(true);
    try {
      const response = await baremesAPI.getAll({
        limit: 100,
        cod_pay: cod_pay,
        sortBy: 'LIB_BAR',
        sortOrder: 'ASC'
      });
      
      if (response.success && response.baremes) {
        const filteredBaremes = response.baremes
          .filter(b => b != null && b.COD_BAR != null)
          .map(b => ({
            COD_BAR: String(b.COD_BAR || ''),
            LIB_BAR: b.LIB_BAR || 'Barème sans nom',
            TYPE_BAREME: b.TYPE_BAREME || b.TYP_BAR || 'STANDARD'
          }));
        setBaremesList(filteredBaremes);
      } else {
        message.error(response.message || 'Erreur lors du chargement des barèmes');
        setBaremesList([]);
      }
    } catch (error) {
      console.error('Erreur chargement barèmes:', error);
      message.error('Erreur lors du chargement des barèmes');
      setBaremesList([]);
    } finally {
      setLoadingBaremes(false);
    }
  };

  const loadCompagnies = async () => {
    try {
      const result = await compagniesAPI.getAll({ limit: 100 });
      if (result && result.success) {
        const compagniesData = result.compagnies || result.data || [];
        const formattedCompagnies = compagniesData.map(comp => ({
          COD_ASS: String(comp.COD_ASS || comp.id || comp.COD_ASS),
          NOM_COMPAGNIE: comp.NOM_COMPAGNIE || comp.nom_compagnie || comp.LIB_ASS || 'Compagnie sans nom'
        }));
        setCompagniesList(formattedCompagnies);
      } else {
        setCompagniesList([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement compagnies:', error);
      setCompagniesList([]);
    }
  };

  const loadReseauSoins = async () => {
    try {
      const response = await reseauSoinsAPI.getAllNetworks({ limit: 100 });
      if (response && response.success) {
        const networksData = response.networks || response.data || [];
        const validNetworks = networksData.filter(item => item && (item.id || item.COD_RESEAU));
        const formattedNetworks = validNetworks.map(item => {
          const networkId = item.id || item.COD_RESEAU;
          const networkName = item.nom || item.NOM_RESEAU || 'Réseau sans nom';
          return {
            key: generateUniqueKey('reseau', networkId),
            COD_RESEAU: String(networkId),
            NOM_RESEAU: networkName,
            TYPE_RESEAU: item.type || item.NETWORK_TYPE || 'Standard',
            ...item
          };
        });
        setReseauSoinsList(formattedNetworks);
      } else {
        const fallbackNetworks = [
          { key: 'reseau-1', COD_RESEAU: '1', NOM_RESEAU: 'Réseau Santé Principal', TYPE_RESEAU: 'Standard' },
          { key: 'reseau-2', COD_RESEAU: '2', NOM_RESEAU: 'Réseau Urgences', TYPE_RESEAU: 'Urgences' },
          { key: 'reseau-3', COD_RESEAU: '3', NOM_RESEAU: 'Réseau Spécialisé', TYPE_RESEAU: 'Spécialisé' }
        ];
        setReseauSoinsList(fallbackNetworks);
        message.warning('Utilisation de données de test pour les réseaux de soins');
      }
    } catch (error) {
      console.error('❌ Erreur chargement réseaux de soins:', error);
      const fallbackNetworks = [
        { key: 'reseau-fallback-1', COD_RESEAU: '1', NOM_RESEAU: 'Réseau Santé Principal', TYPE_RESEAU: 'Standard' },
        { key: 'reseau-fallback-2', COD_RESEAU: '2', NOM_RESEAU: 'Réseau Urgences', TYPE_RESEAU: 'Urgences' }
      ];
      setReseauSoinsList(fallbackNetworks);
      message.error('Erreur lors du chargement des réseaux de soins. Données de test utilisées.');
    }
  };

  // ==================== FONCTIONS DE SYNCHRONISATION ====================
const handleSyncAceData = async () => {
  setLoading(prev => ({ ...prev, main: true }));
  try {
    const response = await syncAPI.syncACE();
    if (response.success) {
      message.success('Synchronisation ACE terminée avec succès');
      loadBeneficiaires();
    } else {
      message.error(response.message || 'Erreur lors de la synchronisation ACE');
    }
  } catch (error) {
    console.error('Erreur synchronisation ACE:', error);
    message.error('Erreur lors de la synchronisation ACE');
  } finally {
    setLoading(prev => ({ ...prev, main: false }));
  }
};

const handleSyncBenefPolice = async () => {
  setLoading(prev => ({ ...prev, main: true }));
  try {
    const response = await syncAPI.syncBenefPolice();
    if (response.success) {
      message.success('Synchronisation BENEF_POLICE terminée avec succès');
      loadBeneficiaires();
    } else {
      message.error(response.message || 'Erreur lors de la synchronisation BENEF_POLICE');
    }
  } catch (error) {
    console.error('Erreur synchronisation BENEF_POLICE:', error);
    message.error('Erreur lors de la synchronisation BENEF_POLICE');
  } finally {
    setLoading(prev => ({ ...prev, main: false }));
  }
};

const handleFullSync = async () => {
  setSyncModal(true);
  setSyncProgress({
    step: 1,
    total: 2,
    current: 0,
    message: 'Début de la synchronisation ACE...',
    details: ''
  });
  
  try {
    // Synchronisation ACE
    const aceResponse = await syncAPI.syncACE();
    setSyncProgress(prev => ({
      ...prev,
      current: 1,
      message: 'Synchronisation ACE terminée, démarrage de BENEF_POLICE...',
      details: `Enregistrements traités: ${aceResponse.count || 0}`
    }));
    
    // Synchronisation BENEF_POLICE
    const benefPoliceResponse = await syncAPI.syncBenefPolice();
    setSyncProgress({
      step: 2,
      total: 2,
      current: 2,
      message: 'Synchronisation terminée avec succès',
      details: `ACE: ${aceResponse.count || 0}, BENEF_POLICE: ${benefPoliceResponse.count || 0}`
    });
    
    message.success('Synchronisation complète terminée');
    loadBeneficiaires();
    
    // Fermer la modal après 3 secondes
    setTimeout(() => {
      setSyncModal(false);
      setSyncProgress({
        step: 0,
        total: 0,
        current: 0,
        message: '',
        details: ''
      });
    }, 3000);
  } catch (error) {
    console.error('Erreur synchronisation complète:', error);
    setSyncProgress(prev => ({
      ...prev,
      message: 'Erreur lors de la synchronisation',
      details: error.message
    }));
    message.error('Erreur lors de la synchronisation complète');
  }
};

const checkTableStructure = async () => {
  try {
    const response = await syncAPI.checkTableStructure();
    if (response.success) {
      message.success('Structure de la table BENEF_POLICE vérifiée avec succès');
      Modal.info({
        title: 'Structure de la table BENEF_POLICE',
        content: (
          <div>
            <p>La table existe et a les colonnes requises.</p>
            <pre>{JSON.stringify(response.columns, null, 2)}</pre>
          </div>
        ),
        width: 800
      });
    } else {
      message.error(response.message || 'Erreur lors de la vérification');
    }
  } catch (error) {
    console.error('Erreur vérification structure:', error);
    message.error('Erreur lors de la vérification de la structure');
  }
};

// ==================== FONCTIONS MANQUANTES ====================
const loadPolicesForManagement = async () => {
  setLoading(prev => ({ ...prev, polices: true }));
  try {
    const response = await policesAPI.getAll({ limit: 100 });
    if (response.success) {
      const policesData = response.polices || response.data || [];
      const formattedPolices = policesData.map((police, index) => {
        const policeKey = police.COD_POL ? `police-${police.COD_POL}` : police.NUM_POLICE ? `police-${police.NUM_POLICE}-${index}` : `police-${Date.now()}-${index}-${Math.random()}`;
        
        let baremesArray = [];
        if (Array.isArray(police.Bareme)) {
          baremesArray = police.Bareme
            .filter(b => b != null && b.COD_BAR != null)
            .map(b => ({
              ...b,
              COD_BAR: String(b.COD_BAR || ''),
              LIB_BAR: b.LIB_BAR || `Barème ${b.COD_BAR}`
            }));
        } else if (Array.isArray(police.baremes)) {
          baremesArray = police.baremes
            .filter(b => b != null && b.COD_BAR != null)
            .map(b => ({
              ...b,
              COD_BAR: String(b.COD_BAR || ''),
              LIB_BAR: b.LIB_BAR || `Barème ${b.COD_BAR}`
            }));
        }
        
        return {
          key: policeKey,
          COD_POL: police.COD_POL, 
          NUM_POLICE: police.NUM_POLICE || police.NUM_POL || police.numero,
          NUMR_POLICE: police.NUMR_POLICE || police.NUMR_POL || police.numero_reference,
          COD_ASS: police.COD_ASS,
          NOM_COMPAGNIE: police.nom_compagnie || police.NOM_COMPAGNIE || (compagniesList.find(c => Number(c.COD_ASS) === Number(police.COD_ASS)) || {}).NOM_COMPAGNIE,
          DATE_EFFET: police.EFF_POL || police.date_effet || police.DATE_EFFET,
          DATE_ECHEANCE: police.RES_POL || police.date_resiliation || police.DATE_ECHEANCE,
          DATE_EMISSION: police.EMP_POL || police.date_emission || police.DATE_EMISSION,
          STATUT_POLICE: police.STD_POL === 1 ? 'ACTIVE' : police.STD_POL === 0 ? 'INACTIVE' : police.statut || police.STATUT_POLICE,
          TYPE_POLICE: getPoliceTypeLabel(police.TYP_POL || police.type_police || 'INDIVIDUELLE'),
          MONTANT_PRIME: police.PRM_POL || police.prime || police.MONTANT_PRIME,
          TAUX_ASSURANCE: police.TXA_POL || police.taux_assurance || police.TAUX_ASSURANCE,
          Bareme: baremesArray,
          REMARQUES: police.REM_POL || police.remarques || police.REMARQUES,
          DATE_CREATION: police.DAT_CREUTIL || police.date_creation,
          DATE_MODIFICATION: police.DAT_MODUTIL || police.date_modification,
          beneficiaires: police.beneficiaires || [],
          COD_RESEAU: police.COD_RESEAU,
          reseau_soins: police.reseau_soins || null,
          tauxCouverture: police.tauxCouverture || 0
        };
      });
      
      setPolices(formattedPolices);
    } else {
      message.error(response.message || 'Erreur chargement polices');
      setPolices([]);
    }
  } catch (error) {
    console.error('Erreur chargement polices:', error);
    message.error('Erreur lors du chargement des polices');
    setPolices([]);
  } finally {
    setLoading(prev => ({ ...prev, polices: false }));
  }
};

const policeGestionColumns = [
  {
    title: 'Numéro',
    dataIndex: 'NUM_POLICE',
    key: 'NUM_POLICE',
    width: 150,
  },
  {
    title: 'Compagnie',
    dataIndex: 'NOM_COMPAGNIE',
    key: 'NOM_COMPAGNIE',
    width: 160,
    render: (text, record) => {
      const compagnie = compagniesList.find(c => c.COD_ASS === record.COD_ASS);
      const nomCompagnie = compagnie ? compagnie.NOM_COMPAGNIE : text || 'N/A';
      return (
        <Tooltip title={nomCompagnie}>
          <Tag color="blue">
            {nomCompagnie.length > 20 ? `${nomCompagnie.substring(0, 20)}...` : nomCompagnie}
          </Tag>
        </Tooltip>
      );
    }
  },
  {
    title: 'Type',
    dataIndex: 'TYPE_POLICE',
    key: 'TYPE_POLICE',
    width: 120,
  },
  {
    title: 'Date effet',
    dataIndex: 'DATE_EFFET',
    key: 'DATE_EFFET',
    width: 120,
    render: (date) => formatDate(date),
  },
  {
    title: 'Date échéance',
    dataIndex: 'DATE_ECHEANCE',
    key: 'DATE_ECHEANCE',
    width: 120,
    render: (date) => formatDate(date),
  },
  {
    title: 'Prime',
    dataIndex: 'MONTANT_PRIME',
    key: 'MONTANT_PRIME',
    width: 120,
    render: (montant) => montant ? `${parseFloat(montant).toLocaleString('fr-FR')} FCFA` : '-',
  },
  {
    title: 'Statut',
    dataIndex: 'STATUT_POLICE',
    key: 'STATUT_POLICE',
    width: 120,
    render: (statut) => (
      <Tag color={
        statut === 'ACTIVE' ? 'success' :
        statut === 'SUSPENDUE' ? 'warning' :
        statut === 'RESILIEE' ? 'error' : 'default'
      }>
        {statut || 'INACTIVE'}
      </Tag>
    ),
  },
  {
    title: 'Actions',
    key: 'actions_police',
    width: 150,
    render: (_, record) => (
      <Space size="small">
        <Tooltip title="Modifier">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              handleOpenPoliceForm(record);
              setPoliceGestionModal(false);
            }}
            size="small"
          />
        </Tooltip>
        <Tooltip title="Supprimer">
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeletePolice(record)}
            size="small"
          />
        </Tooltip>
        <Tooltip title="Voir bénéficiaires">
          <Button
            type="link"
            icon={<TeamOutlined />}
            onClick={() => {
              Modal.info({
                title: `Bénéficiaires de la police ${record.NUM_POLICE}`,
                content: (
                  <div>
                    {record.beneficiaires && record.beneficiaires.length > 0 ? (
                      <List
                        dataSource={record.beneficiaires}
                        renderItem={benef => (
                          <List.Item>
                            <List.Item.Meta
                              title={`${benef.NOM_BEN} ${benef.PRE_BEN}`}
                              description={`${benef.IDENTIFIANT_NATIONAL} - ${benef.STATUT_ACE || 'Assuré principal'}`}
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <p>Aucun bénéficiaire associé à cette police.</p>
                    )}
                  </div>
                ),
                width: 600
              });
            }}
            size="small"
          />
        </Tooltip>
      </Space>
    ),
  },
];

const handleSaveCentre = async (values) => {
  setLoading(prev => ({ ...prev, centres: true }));
  try {
    let response;
    if (editingCentre) {
      response = await centresAPI.update(editingCentre.ID_CENTRE, values);
    } else {
      response = await centresAPI.create(values);
    }
    
    if (response.success) {
      message.success(editingCentre ? 'Centre mis à jour' : 'Centre créé');
      setShowCentreForm(false);
      centreForm.resetFields();
      setEditingCentre(null);
      // Recharger la liste des centres
      loadReferenceData();
      if (selectedBeneficiaireForCentres) {
        loadCentres(selectedBeneficiaireForCentres.ID_BEN);
      }
    } else {
      message.error(response.message || 'Erreur sauvegarde centre');
    }
  } catch (error) {
    console.error('Erreur sauvegarde centre:', error);
    message.error('Erreur sauvegarde centre');
  } finally {
    setLoading(prev => ({ ...prev, centres: false }));
  }
};

const handleAssignCentre = async (centre) => {
  if (!selectedBeneficiaireForCentres) return;
  
  Modal.confirm({
    title: `Affilier le centre ${centre.NOM_CENTRE} ?`,
    content: `Voulez-vous affilier le bénéficiaire ${selectedBeneficiaireForCentres.NOM_BEN} ${selectedBeneficiaireForCentres.PRE_BEN} à ce centre ?`,
    onOk: async () => {
      try {
        const response = await beneficiairesAPI.assignCentre(selectedBeneficiaireForCentres.ID_BEN, centre.ID_CENTRE);
        if (response.success) {
          message.success('Centre affilié avec succès');
          loadCentres(selectedBeneficiaireForCentres.ID_BEN);
        } else {
          message.error(response.message || 'Erreur affiliation centre');
        }
      } catch (error) {
        console.error('Erreur affiliation centre:', error);
        message.error('Erreur affiliation centre');
      }
    }
  });
};

const centreColumns = [
  {
    title: 'Nom',
    dataIndex: 'NOM_CENTRE',
    key: 'NOM_CENTRE',
    width: 200,
  },
  {
    title: 'Type',
    dataIndex: 'TYPE_CENTRE',
    key: 'TYPE_CENTRE',
    width: 120,
  },
  {
    title: 'Adresse',
    dataIndex: 'ADRESSE',
    key: 'ADRESSE',
    width: 200,
  },
  {
    title: 'Téléphone',
    dataIndex: 'TELEPHONE',
    key: 'TELEPHONE',
    width: 120,
  },
  {
    title: 'Date affiliation',
    dataIndex: 'DATE_AFFECTATION',
    key: 'DATE_AFFECTATION',
    width: 120,
    render: (date) => formatDate(date),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 100,
    render: (_, record) => (
      <Button
        type="link"
        danger
        icon={<DeleteOutlined />}
        onClick={() => {
          Modal.confirm({
            title: 'Retirer ce centre ?',
            content: `Voulez-vous retirer l'affiliation du centre ${record.NOM_CENTRE} ?`,
            onOk: async () => {
              try {
                const response = await beneficiairesAPI.unassignCentre(selectedBeneficiaireForCentres.ID_BEN, record.ID_CENTRE);
                if (response.success) {
                  message.success('Centre retiré avec succès');
                  loadCentres(selectedBeneficiaireForCentres.ID_BEN);
                } else {
                  message.error(response.message || 'Erreur retrait centre');
                }
              } catch (error) {
                console.error('Erreur retrait centre:', error);
                message.error('Erreur retrait centre');
              }
            }
          });
        }}
      />
    ),
  },
];

const carteColumns = [
  {
    title: 'Numéro',
    dataIndex: 'NUM_CAR',
    key: 'NUM_CAR',
    width: 150,
  },
  {
    title: 'Type',
    dataIndex: 'COD_CAR',
    key: 'COD_CAR',
    width: 100,
    render: (type) => {
      const types = {
        'PRM': 'Principale',
        'SEC': 'Secondaire',
        'TMP': 'Temporaire'
      };
      return types[type] || type;
    }
  },
  {
    title: 'Date début',
    dataIndex: 'DDV_CAR',
    key: 'DDV_CAR',
    width: 120,
    render: (date) => formatDate(date),
  },
  {
    title: 'Date fin',
    dataIndex: 'DFV_CAR',
    key: 'DFV_CAR',
    width: 120,
    render: (date) => formatDate(date),
  },
  {
    title: 'Statut',
    dataIndex: 'STS_CAR',
    key: 'STS_CAR',
    width: 100,
    render: (statut) => (
      <Tag color={statut === 1 ? 'success' : statut === 2 ? 'warning' : 'error'}>
        {statut === 1 ? 'Active' : statut === 2 ? 'Suspendue' : 'Inactive'}
      </Tag>
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 100,
    render: (_, record) => (
      <Space>
        <Tooltip title="Modifier">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenCarteForm(record)}
            size="small"
          />
        </Tooltip>
        <Tooltip title="Supprimer">
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Supprimer cette carte ?',
                content: 'Cette action est irréversible.',
                onOk: async () => {
                  try {
                    const response = await beneficiairesAPI.deleteCarte(record.NUM_CAR);
                    if (response.success) {
                      message.success('Carte supprimée');
                      loadCartes(selectedBeneficiaireForCartes.ID_BEN);
                    } else {
                      message.error(response.message || 'Erreur suppression carte');
                    }
                  } catch (error) {
                    console.error('Erreur suppression carte:', error);
                    message.error('Erreur suppression carte');
                  }
                }
              });
            }}
            size="small"
          />
        </Tooltip>
      </Space>
    ),
  },
];

const handlePrintCard = () => {
  if (!selectedBeneficiaireForCard) {
    message.error('Aucun bénéficiaire sélectionné');
    return;
  }
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    const cardElement = cardRef.current;
    if (cardElement) {
      const cardHtml = cardElement.innerHTML;
      printWindow.document.write(`
        <html>
          <head>
            <title>Carte ${selectedBeneficiaireForCard.NOM_BEN} ${selectedBeneficiaireForCard.PRE_BEN}</title>
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              .card-container { transform: scale(1.5); }
            </style>
          </head>
          <body>
            <div class="card-container">${cardHtml}</div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      printWindow.close();
      message.error('Erreur lors de la préparation de l\'impression');
    }
  } else {
    message.error('Impossible d\'ouvrir la fenêtre d\'impression');
  }
};

const handleExportData = async () => {
  setLoading(prev => ({ ...prev, export: true }));
  try {
    let response;
    switch (exportFormat) {
      case 'excel':
        response = await beneficiairesAPI.exportExcel(beneficiaires.map(b => b.ID_BEN));
        if (response.success && response.url) {
          window.open(response.url, '_blank');
          message.success('Export Excel généré avec succès');
        } else {
          message.error(response.message || 'Erreur génération Excel');
        }
        break;
      case 'pdf':
        // Pour PDF, on pourrait générer un rapport PDF côté serveur ou client
        // Ici, on utilise la fonction handleDownloadCard comme exemple pour un bénéficiaire
        // Mais pour l'export PDF de tous les bénéficiaires, il faudrait une autre fonction
        message.warning('Export PDF non implémenté pour tous les bénéficiaires');
        break;
      case 'csv':
        response = await beneficiairesAPI.exportCSV(beneficiaires.map(b => b.ID_BEN));
        if (response.success && response.url) {
          window.open(response.url, '_blank');
          message.success('Export CSV généré avec succès');
        } else {
          message.error(response.message || 'Erreur génération CSV');
        }
        break;
      case 'json':
        const dataStr = JSON.stringify(beneficiaires, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `beneficiaires_${moment().format('YYYYMMDD_HHmmss')}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        message.success('Export JSON généré avec succès');
        break;
      default:
        message.error('Format non supporté');
    }
    setExportModal(false);
  } catch (error) {
    console.error('Erreur export:', error);
    message.error('Erreur lors de l\'export');
  } finally {
    setLoading(prev => ({ ...prev, export: false }));
  }
};

  // ==================== GESTION DES FORMULAIRES ====================
  const handleOpenForm = async (beneficiaire = null) => {
    if (beneficiaire) {
      form.setFieldsValue({
        NOM_BEN: beneficiaire.NOM_BEN,
        PRE_BEN: beneficiaire.PRE_BEN,
        FIL_BEN: beneficiaire.FIL_BEN,
        SEX_BEN: beneficiaire.SEX_BEN,
        NAI_BEN: beneficiaire.NAI_BEN ? moment(beneficiaire.NAI_BEN) : null,
        IDENTIFIANT_NATIONAL: beneficiaire.IDENTIFIANT_NATIONAL,
        TELEPHONE_MOBILE: beneficiaire.TELEPHONE_MOBILE,
        EMAIL: beneficiaire.EMAIL,
        PROFESSION: beneficiaire.PROFESSION,
        EMPLOYEUR: beneficiaire.EMPLOYEUR || '',
        STATUT_ACE: beneficiaire.STATUT_ACE || '',
        ID_ASSURE_PRINCIPAL: beneficiaire.ID_ASSURE_PRINCIPAL,
        ID_CENTRE_SANTE: beneficiaire.ID_CENTRE_SANTE,
        COD_PAY: beneficiaire.COD_PAY || 'CMR',
        ASSURANCE_PRIVE: beneficiaire.ASSURANCE_PRIVE || false,
        STATUT: beneficiaire.STATUT || 'ACTIF'
      });
      setEditingId(beneficiaire.ID_BEN);
      
      if (beneficiaire.ID_BEN) {
        try {
          setLoading(prev => ({ ...prev, form: true }));
          const response = await beneficiairesAPI.getPhoto(beneficiaire.ID_BEN);
          if (response.success && response.photoUrl) {
            setPhotoPreview(response.photoUrl);
          } else {
            setPhotoPreview(null);
          }
        } catch (error) {
          console.error('Erreur chargement photo:', error);
          setPhotoPreview(null);
        } finally {
          setLoading(prev => ({ ...prev, form: false }));
        }
      } else {
        setPhotoPreview(null);
      }
    } else {
      form.resetFields();
      form.setFieldsValue({
        SEX_BEN: 'M',
        COD_PAY: 'CMR',
        IDENTIFIANT_NATIONAL: genererIdentifiantNational(),
        STATUT: 'ACTIF',
        ASSURANCE_PRIVE: false,
        EMPLOYEUR: ''
      });
      setEditingId(null);
      setPhotoPreview(null);
      setPhotoFile(null);
    }
    setShowForm(true);
  };

  const handleSubmit = async (values) => {
    setLoading(prev => ({ ...prev, form: true }));
    
    try {
      const beneficiaireData = {
        ...values,
        NAI_BEN: values.NAI_BEN ? values.NAI_BEN.format('YYYY-MM-DD') : null,
        IDENTIFIANT_NATIONAL: values.IDENTIFIANT_NATIONAL || genererIdentifiantNational(),
        ID_ASSURE_PRINCIPAL: values.STATUT_ACE ? values.ID_ASSURE_PRINCIPAL : null,
        ID_CENTRE_SANTE: values.ID_CENTRE_SANTE || null,
      };
      
      const formData = new FormData();
      formData.append('data', JSON.stringify(beneficiaireData));
      
      if (photoFile) {
        formData.append('photo', photoFile);
      }
      
      let response;
      if (editingId) {
        response = await beneficiairesAPI.update(editingId, formData);
      } else {
        response = await beneficiairesAPI.create(formData);
      }
      
      if (response.success) {
        const successMsg = editingId ? 'Bénéficiaire mis à jour avec succès' : 'Bénéficiaire créé avec succès';
        message.success(photoFile ? `${successMsg} avec photo` : successMsg);
        
        setShowForm(false);
        form.resetFields();
        setPhotoFile(null);
        setPhotoPreview(null);
        await loadBeneficiaires();
      } else {
        message.error(response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      message.error('Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  const handleDelete = async (beneficiaire) => {
    Modal.confirm({
      title: `Mettre en retrait ${beneficiaire.NOM_BEN} ${beneficiaire.PRE_BEN} ?`,
      content: 'Cette action est réversible.',
      okText: 'Confirmer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          const response = await beneficiairesAPI.delete(beneficiaire.ID_BEN);
          if (response.success) {
            message.success('Bénéficiaire mis en retrait');
            loadBeneficiaires();
          } else {
            message.error(response.message || 'Erreur suppression');
          }
        } catch (error) {
          console.error('Erreur suppression:', error);
          message.error('Erreur lors de la suppression');
        }
      }
    });
  };

  // ==================== GESTION DES POLICES ====================
  const loadPolices = async (beneficiaireId) => {
    setLoading(prev => ({ ...prev, polices: true }));
    try {
      const response = await policesAPI.getByBeneficiaire(beneficiaireId);
      
      if (response && response.success) {
        const policesData = response.polices || response.data || [];
        const formattedPolices = Array.isArray(policesData) ? policesData.map((police, index) => {
          const policeKey = police.COD_POL ? `police-${police.COD_POL}` : police.NUM_POLICE ? `police-${police.NUM_POLICE}-${index}` : `police-${Date.now()}-${index}-${Math.random()}`;
          
          let baremesArray = [];
          if (Array.isArray(police.Bareme)) {
            baremesArray = police.Bareme
              .filter(b => b != null && b.COD_BAR != null)
              .map(b => ({
                ...b,
                COD_BAR: String(b.COD_BAR || ''),
                LIB_BAR: b.LIB_BAR || `Barème ${b.COD_BAR}`
              }));
          } else if (Array.isArray(police.baremes)) {
            baremesArray = police.baremes
              .filter(b => b != null && b.COD_BAR != null)
              .map(b => ({
                ...b,
                COD_BAR: String(b.COD_BAR || ''),
                LIB_BAR: b.LIB_BAR || `Barème ${b.COD_BAR}`
              }));
          }
          
          return {
            key: policeKey,
            COD_POL: police.COD_POL, 
            NUM_POLICE: police.NUM_POLICE || police.NUM_POL || police.numero,
            NUMR_POLICE: police.NUMR_POLICE || police.NUMR_POL || police.numero_reference,
            COD_ASS: police.COD_ASS,
            NOM_COMPAGNIE: police.nom_compagnie || police.NOM_COMPAGNIE || (compagniesList.find(c => Number(c.COD_ASS) === Number(police.COD_ASS)) || {}).NOM_COMPAGNIE,
            DATE_EFFET: police.EFF_POL || police.date_effet || police.DATE_EFFET,
            DATE_ECHEANCE: police.RES_POL || police.date_resiliation || police.DATE_ECHEANCE,
            DATE_EMISSION: police.EMP_POL || police.date_emission || police.DATE_EMISSION,
            STATUT_POLICE: police.STD_POL === 1 ? 'ACTIVE' : police.STD_POL === 0 ? 'INACTIVE' : police.statut || police.STATUT_POLICE,
            TYPE_POLICE: getPoliceTypeLabel(police.TYP_POL || police.type_police || 'INDIVIDUELLE'),
            MONTANT_PRIME: police.PRM_POL || police.prime || police.MONTANT_PRIME,
            TAUX_ASSURANCE: police.TXA_POL || police.taux_assurance || police.TAUX_ASSURANCE,
            Bareme: baremesArray,
            REMARQUES: police.REM_POL || police.remarques || police.REMARQUES,
            DATE_CREATION: police.DAT_CREUTIL || police.date_creation,
            DATE_MODIFICATION: police.DAT_MODUTIL || police.date_modification,
            beneficiaires: police.beneficiaires || [],
            COD_RESEAU: police.COD_RESEAU,
            reseau_soins: police.reseau_soins || null,
            tauxCouverture: police.tauxCouverture || 0
          };
        }) : [];
        
        setPolices(formattedPolices);
      } else {
        message.error((response && response.message) || 'Erreur chargement polices');
        setPolices([]);
      }
    } catch (error) {
      console.error('Erreur chargement polices:', error);
      message.error('Erreur lors du chargement des polices');
      setPolices([]);
    } finally {
      setLoading(prev => ({ ...prev, polices: false }));
    }
  };

  const handleOpenPoliceForm = async (police = null) => {
    try {
      await Promise.all([
        loadCompagnies(),
        loadReseauSoins(),
        loadEmployeursList(),
        loadBaremes('CMR')
      ]);
      
      if (police) {
        let employeurValue = '';
        if (police.EMPLOYEUR && police.EMPLOYEUR !== '') {
          employeurValue = police.EMPLOYEUR;
        } else if (police.employeur && police.employeur !== '') {
          employeurValue = police.employeur;
        } else if (police.beneficiaires && police.beneficiaires.length > 0) {
          const premierBeneficiaire = police.beneficiaires[0];
          employeurValue = premierBeneficiaire.EMPLOYEUR || '';
        }
        
        if (!employeurValue || employeurValue.trim() === '') {
          employeurValue = 'Non spécifié';
        }
        
        const baremesCodes = police.Bareme ? police.Bareme.map(b => b.COD_BAR).filter(Boolean) : [];
        
        const valeursForm = {
          NUM_POLICE: police.NUM_POLICE || police.NUM_POL || '',
          NUMR_POLICE: police.NUMR_POLICE || police.NUMR_POL || '',
          COD_ASS: police.COD_ASS ? String(police.COD_ASS) : '',
          COD_RESEAU: police.COD_RESEAU || undefined,
          EMPLOYEUR: employeurValue,
          DATE_EFFET: police.DATE_EFFET || police.EFF_POL ? moment(police.DATE_EFFET || police.EFF_POL) : null,
          DATE_ECHEANCE: police.DATE_ECHEANCE || police.RES_POL ? moment(police.DATE_ECHEANCE || police.RES_POL) : null,
          DATE_EMISSION: police.DATE_EMISSION || police.EMP_POL ? moment(police.DATE_EMISSION || police.EMP_POL) : null,
          STATUT_POLICE: police.STATUT_POLICE || (police.STD_POL === 1 ? 'ACTIVE' : 'INACTIVE') || 'ACTIVE',
          TYPE_POLICE: police.TYPE_POLICE || (police.TYP_POL ? getPoliceTypeLabel(police.TYP_POL) : 'COLLECTIVE'),
          MONTANT_PRIME: police.MONTANT_PRIME || police.PRM_POL || 0,
          TAUX_ASSURANCE: police.TAUX_ASSURANCE || police.TXA_POL || 100,
          REMARQUES: police.REMARQUES || police.REM_POL || '',
          BAREMES: baremesCodes
        };
        
        policeForm.setFieldsValue(valeursForm);
        setSelectedBaremes(baremesCodes);
        setEditingPolice(police);
      } else {
        policeForm.resetFields();
        const defaultValues = {
          STATUT_POLICE: 'ACTIVE',
          DATE_EFFET: moment(),
          DATE_ECHEANCE: moment().add(1, 'year'),
          DATE_EMISSION: moment(),
          TYPE_POLICE: 'COLLECTIVE',
          TAUX_ASSURANCE: 100,
          MONTANT_PRIME: 0,
          COD_RESEAU: undefined,
          EMPLOYEUR: 'Non spécifié',
          BAREMES: []
        };
        
        if (compagniesList.length > 0) {
          const compagnieActive = compagniesList.find(c => c.STATUT === 'ACTIF' || c.ACTIF === true) || compagniesList[0];
          if (compagnieActive) {
            defaultValues.COD_ASS = String(compagnieActive.COD_ASS);
          }
        }
        
        policeForm.setFieldsValue(defaultValues);
        setSelectedBaremes([]);
        setEditingPolice(null);
      }
      
      setShowPoliceForm(true);
    } catch (error) {
      console.error('❌ Erreur ouverture formulaire police:', error);
      message.error('Erreur lors de l\'ouverture du formulaire: ' + error.message);
    }
  };

  const handleSavePolice = async (values) => {
    setLoading(prev => ({ ...prev, polices: true }));
    
    try {
      const errors = [];
      if (!values.NUM_POLICE || values.NUM_POLICE.trim() === '') errors.push('Le numéro de police est obligatoire');
      if (!values.DATE_EFFET || !moment(values.DATE_EFFET).isValid()) errors.push('La date d\'effet est invalide');
      if (!values.DATE_ECHEANCE || !moment(values.DATE_ECHEANCE).isValid()) errors.push('La date d\'échéance est invalide');
      if (!values.COD_ASS) errors.push('La compagnie d\'assurance est obligatoire');
      if (!values.EMPLOYEUR || values.EMPLOYEUR.trim() === '') errors.push('L\'employeur est obligatoire');
      
      if (errors.length > 0) {
        message.error(errors.join(', '));
        setLoading(prev => ({ ...prev, polices: false }));
        return;
      }
      
      const policeData = {
        COD_ASS: parseInt(values.COD_ASS),
        NUM_POL: values.NUM_POLICE.trim(),
        NUMR_POL: values.NUMR_POLICE?.trim() || null,
        EMPLOYEUR: values.EMPLOYEUR.trim(),
        COD_RESEAU: values.COD_RESEAU || null,
        EFF_POL: values.DATE_EFFET.format('YYYY-MM-DD'),
        RES_POL: values.DATE_ECHEANCE.format('YYYY-MM-DD'),
        EMP_POL: values.DATE_EMISSION ? values.DATE_EMISSION.format('YYYY-MM-DD') : values.DATE_EFFET.format('YYYY-MM-DD'),
        PRM_POL: values.MONTANT_PRIME || 0,
        TXA_POL: values.TAUX_ASSURANCE || 100,
        STD_POL: values.STATUT_POLICE === 'ACTIVE' ? 1 : 0,
        TYP_POL: values.TYPE_POLICE === 'INDIVIDUELLE' ? 'I' :
                 values.TYPE_POLICE === 'FAMILIALE' ? 'F' :
                 values.TYPE_POLICE === 'COLLECTIVE' ? 'C' :
                 values.TYPE_POLICE === 'ENTREPRISE' ? 'E' :
                 values.TYPE_POLICE === 'GROUPE' ? 'G' : 'C',
        REM_POL: values.REMARQUES || '',
        COD_CREUTIL: 'ADMIN',
        DAT_CREUTIL: new Date().toISOString().split('T')[0],
        baremes: selectedBaremes.filter(b => b && b !== 'null' && b !== 'undefined')
      };
      
      let response;
      if (editingPolice) {
        let policeId;
        if (editingPolice.COD_POL && !isNaN(parseInt(editingPolice.COD_POL))) {
          policeId = parseInt(editingPolice.COD_POL);
          response = await policesAPI.update(policeId, policeData);
        } else if (editingPolice.NUM_POLICE) {
          policeId = editingPolice.NUM_POLICE;
          response = await policesAPI.update(policeId, policeData);
        } else {
          message.error('Impossible d\'identifier la police à mettre à jour');
          setLoading(prev => ({ ...prev, polices: false }));
          return;
        }
      } else {
        response = await policesAPI.create(policeData);
      }
      
      if (response.success) {
        message.success(editingPolice ? 'Police mise à jour avec succès' : 'Police créée avec succès');
        policeForm.resetFields();
        setShowPoliceForm(false);
        setSelectedBaremes([]);
        
        if (selectedBeneficiaireForPolices) {
          await loadPolices(selectedBeneficiaireForPolices.ID_BEN);
        }
        if (policeGestionModal) {
          await loadPolicesForManagement();
        }
        
        await loadBeneficiaires();
      } else {
        message.error(response.message || 'Erreur lors de la sauvegarde de la police');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde police:', error);
      message.error('Erreur lors de la sauvegarde de la police: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, polices: false }));
    }
  };

  const handleDeletePolice = async (police) => {
    Modal.confirm({
      title: `Supprimer la police ${police.NUM_POLICE} ?`,
      content: 'Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          const policeId = police.COD_POL || police.NUM_POLICE;
          if (!policeId || isNaN(parseInt(policeId))) {
            message.error('ID police invalide. Impossible de supprimer.');
            return;
          }
          
          const response = await policesAPI.delete(parseInt(policeId));
          if (response.success) {
            message.success('Police supprimée');
            if (selectedBeneficiaireForPolices) {
              await loadPolices(selectedBeneficiaireForPolices.ID_BEN);
            }
            if (policeGestionModal) {
              await loadPolicesForManagement();
            }
          } else {
            message.error(response.message || 'Erreur suppression');
          }
        } catch (error) {
          console.error('Erreur suppression police:', error);
          message.error('Erreur lors de la suppression');
        }
      }
    });
  };

  // ==================== GESTION LIAISON BÉNÉFICIAIRES-POLICE ====================
const loadPolicesForLinking = async () => {
  try {
    setLoading(prev => ({ ...prev, polices: true }));
    const response = await policesAPI.getAll({
      limit: 100,
      withBeneficiaires: true,
      statut: 'ACTIVE'
    });
    
    console.log('🔍 Réponse API polices pour liaison:', response);
    
    if (response.success && Array.isArray(response.polices)) {
      const formattedPolices = response.polices.map((police, index) => {
        console.log('📊 Police brute (index', index, '):', police);
        
        // Utiliser l'id comme COD_POL (si disponible) - IMPORTANT: utiliser un nombre!
        const policeId = police.id || police.COD_POL || (index + 1);
        
        // S'assurer que c'est un nombre pour le backend
        const numericId = parseInt(policeId);
        const finalId = isNaN(numericId) ? (index + 1) : numericId;
        
        const policeNumber = police.NUM_POLICE || police.NUM_POL || police.numero || `POL-${finalId}`;
        const nomCompagnie = police.NOM_COMPAGNIE || police.nom_compagnie || 'Sans compagnie';
        
        return {
          ...police,
          // Assurez-vous que COD_POL est défini comme nombre
          COD_POL: finalId,
          key: `police-${finalId}-${index}`,
          label: `${policeNumber} - ${nomCompagnie}`,
          value: finalId, // DOIT ÊTRE UN NOMBRE pour le backend
          nombreBeneficiaires: police.beneficiaires?.length || 0,
          STATUT_POLICE: police.STATUT_POLICE || (police.STD_POL === 1 ? 'ACTIVE' : 'INACTIVE') || 'ACTIVE',
          TYPE_POLICE: police.TYPE_POLICE || getPoliceTypeLabel(police.TYP_POL) || 'COLLECTIVE'
        };
      });
      
      console.log('📋 Polices formatées pour liaison:', formattedPolices);
      console.log('🎯 Valeurs disponibles:', formattedPolices.map(p => ({ id: p.value, label: p.label })));
      setAvailablePolicesForLinking(formattedPolices);
    } else {
      console.error('❌ Format de réponse invalide:', response);
      setAvailablePolicesForLinking([]);
    }
  } catch (error) {
    console.error('Erreur chargement polices pour liaison:', error);
    message.error('Erreur lors du chargement des polices');
  } finally {
    setLoading(prev => ({ ...prev, polices: false }));
  }
};

  const loadBeneficiairesForLinking = async () => {
    try {
      setLoading(prev => ({ ...prev, table: true }));
      const response = await beneficiairesAPI.getAll({
        limit: 200,
        statut: 'ACTIF'
      });
      
      if (response.success && Array.isArray(response.beneficiaires)) {
        const formattedBeneficiaires = response.beneficiaires
          .filter(ben => ben != null)
          .map(ben => ({
            ...ben,
            key: `benef-${ben.ID_BEN}`,
            label: `${ben.NOM_BEN} ${ben.PRE_BEN} (${ben.IDENTIFIANT_NATIONAL || 'Sans ID'})`,
            value: ben.ID_BEN,
            age: calculateAge(ben.NAI_BEN),
            statutText: ben.STATUT_ACE ? `Ayant droit - ${ben.STATUT_ACE}` : 'Assuré principal'
          }));
        setBeneficiairesForLinking(formattedBeneficiaires);
      }
    } catch (error) {
      console.error('Erreur chargement bénéficiaires pour liaison:', error);
      message.error('Erreur lors du chargement des bénéficiaires');
    } finally {
      setLoading(prev => ({ ...prev, table: false }));
    }
  };

  const handleOpenLinkModal = () => {
    setSelectedPoliceForLinking(null);
    setSelectedBeneficiaires([]);
    linkForm.resetFields();
    loadPolicesForLinking();
    loadBeneficiairesForLinking();
    setLinkBeneficiaireModal(true);
  };

const handlePoliceSelection = (selectedValue) => {
  console.log('🔍 Valeur sélectionnée:', selectedValue, '(type:', typeof selectedValue, ')');
  
  if (!selectedValue) {
    setSelectedPoliceForLinking(null);
    return;
  }
  
  // Rechercher la police par la valeur (qui doit être un nombre)
  const police = availablePolicesForLinking.find(p => {
    return p.value === selectedValue || String(p.value) === String(selectedValue);
  });
  
  console.log('🔍 Police trouvée:', police);
  
  if (!police) {
    console.warn('❌ Police non trouvée pour la valeur:', selectedValue);
    console.warn('❌ Valeurs disponibles:', availablePolicesForLinking.map(p => p.value));
    message.error('Police non trouvée. Veuillez réessayer.');
    return;
  }
  
  setSelectedPoliceForLinking(police);
  setSelectedBeneficiaires([]);
  linkForm.setFieldsValue({ selectedBeneficiaires: [] });
};

  const getFilteredBeneficiaires = useMemo(() => {
    if (!selectedPoliceForLinking || !beneficiairesForLinking.length) {
      return beneficiairesForLinking;
    }
    const linkedBeneficiaireIds = selectedPoliceForLinking.beneficiaires?.map(b => b.ID_BEN) || [];
    return beneficiairesForLinking.filter(ben => !linkedBeneficiaireIds.includes(ben.ID_BEN));
  }, [selectedPoliceForLinking, beneficiairesForLinking]);

const handleLinkBeneficiairesSubmit = async (values) => {
  if (!selectedPoliceForLinking) {
    message.warning('Veuillez sélectionner une police');
    return;
  }
  
  const { selectedBeneficiaires: selectedBenefIds, tauxGlobal, dateEffet } = values;
  if (!selectedBenefIds || selectedBenefIds.length === 0) {
    message.warning('Veuillez sélectionner au moins un bénéficiaire');
    return;
  }
  
  setLoading(prev => ({ ...prev, polices: true }));
  
  try {
    // Utiliser l'id de la police comme COD_POL
    let policeId = selectedPoliceForLinking.id;
    
    if (!policeId) {
      // Si pas d'id, essayer COD_POL
      policeId = selectedPoliceForLinking.COD_POL;
    }
    
    if (!policeId) {
      throw new Error('La police sélectionnée n\'a pas d\'identifiant valide');
    }
    
    // Convertir en nombre
    policeId = parseInt(policeId);
    if (isNaN(policeId)) {
      throw new Error('L\'identifiant de la police doit être un nombre');
    }
    
    console.log(`🔗 Tentative de liaison à la police COD_POL: ${policeId}`);
    console.log('📊 Police sélectionnée:', selectedPoliceForLinking);
    
    const beneficiairesData = selectedBenefIds.map(beneficiaireId => {
      const beneficiaire = beneficiairesForLinking.find(b => b.ID_BEN === beneficiaireId);
      return {
        ID_BEN: beneficiaireId,
        TAUX_COUVERTURE: tauxGlobal || 100,
        DATE_EFFET: dateEffet ? dateEffet.format('YYYY-MM-DD') : new Date().toISOString().split('T')[0],
        NOM_BEN: beneficiaire?.NOM_BEN || '',
        PRE_BEN: beneficiaire?.PRE_BEN || ''
      };
    });
    
    console.log(`📋 ${beneficiairesData.length} bénéficiaire(s) à lier`);
    
    const response = await policesAPI.linkMultipleBeneficiaires(policeId, beneficiairesData);
    
    if (response.success) {
      message.success(`${beneficiairesData.length} bénéficiaire(s) lié(s) avec succès`);
      
      // Recharger les données
      await Promise.all([
        loadPolicesForLinking(),
        loadBeneficiairesForLinking(),
        loadBeneficiaires()
      ]);
      
      setLinkBeneficiaireModal(false);
      linkForm.resetFields();
      setSelectedPoliceForLinking(null);
      setSelectedBeneficiaires([]);
      
      if (policeGestionModal) {
        await loadPolicesForManagement();
      }
    } else {
      message.error(response.message || 'Erreur lors de la liaison');
    }
  } catch (error) {
    console.error('Erreur liaison bénéficiaires:', error);
    message.error('Erreur lors de la liaison: ' + error.message);
  } finally {
    setLoading(prev => ({ ...prev, polices: false }));
  }
};

  // ==================== GESTION DES CARTES ====================
  const loadCartes = async (beneficiaireId) => {
    setLoading(prev => ({ ...prev, cartes: true }));
    try {
      const response = await beneficiairesAPI.getCartes(beneficiaireId);
      if (response.success) {
        setCartes(response.cartes || []);
      } else {
        message.error(response.message || 'Erreur lors du chargement des cartes');
        setCartes([]);
      }
    } catch (error) {
      console.error('Erreur chargement cartes:', error);
      message.error('Erreur lors du chargement des cartes');
      setCartes([]);
    } finally {
      setLoading(prev => ({ ...prev, cartes: false }));
    }
  };

  const handleOpenCarteForm = (carte = null) => {
    if (carte) {
      carteForm.setFieldsValue({
        COD_CAR: carte.COD_CAR,
        NUM_CAR: carte.NUM_CAR,
        DDV_CAR: carte.DDV_CAR ? moment(carte.DDV_CAR) : null,
        DFV_CAR: carte.DFV_CAR ? moment(carte.DFV_CAR) : null,
        STS_CAR: carte.STS_CAR,
        NOM_BEN: carte.NOM_BEN,
        PRE_BEN: carte.PRE_BEN,
        NAI_BEN: carte.NAI_BEN ? moment(carte.NAI_BEN) : null,
        SEX_BEN: carte.SEX_BEN
      });
      setEditingCarte(carte);
    } else {
      carteForm.resetFields();
      const beneficiaire = selectedBeneficiaireForCartes;
      carteForm.setFieldsValue({
        COD_CAR: 'PRM',
        NUM_CAR: generateCarteNumber(beneficiaire, 'PRM'),
        DDV_CAR: moment(),
        DFV_CAR: moment().add(1, 'year'),
        STS_CAR: 1,
        NOM_BEN: beneficiaire.NOM_BEN,
        PRE_BEN: beneficiaire.PRE_BEN,
        NAI_BEN: beneficiaire.NAI_BEN ? moment(beneficiaire.NAI_BEN) : null,
        SEX_BEN: beneficiaire.SEX_BEN,
        COD_PAY: 'CMR'
      });
      setEditingCarte(null);
    }
    setShowCarteForm(true);
  };

  const handleSaveCarte = async (values) => {
    if (!selectedBeneficiaireForCartes) return;
    
    setLoading(prev => ({ ...prev, cartes: true }));
    
    try {
      const carteData = {
        ...values,
        DDV_CAR: values.DDV_CAR.format('YYYY-MM-DD'),
        DFV_CAR: values.DFV_CAR.format('YYYY-MM-DD'),
        NAI_BEN: values.NAI_BEN ? values.NAI_BEN.format('YYYY-MM-DD') : null,
        ID_BEN: selectedBeneficiaireForCartes.ID_BEN,
        COD_CREUTIL: 'ADMIN',
        COD_MODUTIL: 'ADMIN'
      };
      
      let response;
      if (editingCarte) {
        response = await beneficiairesAPI.updateCarte(editingCarte.NUM_CAR, carteData);
      } else {
        response = await beneficiairesAPI.createCarte(carteData);
      }
      
      if (response.success) {
        message.success(editingCarte ? 'Carte mise à jour' : 'Carte créée');
        carteForm.resetFields();
        setShowCarteForm(false);
        await loadCartes(selectedBeneficiaireForCartes.ID_BEN);
      } else {
        message.error(response.message || 'Erreur sauvegarde carte');
      }
    } catch (error) {
      console.error('Erreur sauvegarde carte:', error);
      message.error('Erreur sauvegarde carte');
    } finally {
      setLoading(prev => ({ ...prev, cartes: false }));
    }
  };

  // ==================== GESTION DES CENTRES ====================
  const loadCentres = async (beneficiaireId) => {
    setLoading(prev => ({ ...prev, centres: true }));
    try {
      const response = await beneficiairesAPI.getCentres(beneficiaireId);
      if (response.success) {
        const centresData = response.centres || [];
        const formattedCentres = centresData.map(centre => ({
          key: centre.ID_CENTRE || `centre-${Date.now()}-${Math.random()}`,
          ID_CENTRE: centre.ID_CENTRE,
          NOM_CENTRE: centre.NOM_CENTRE || centre.LIB_CEN,
          TYPE_CENTRE: centre.TYPE_CENTRE || centre.TYP_CEN || 'HOPITAL',
          ADRESSE: centre.ADRESSE || centre.NUM_ADR || '',
          TELEPHONE: centre.TELEPHONE || centre.TR1_CEN || '',
          DATE_AFFECTATION: centre.DATE_AFFECTATION || centre.EFF_BEN,
          COD_PRS: centre.COD_PRS || 1,
          STATUT_CENTRE: 'ACTIF'
        }));
        setCentres(formattedCentres);
      } else {
        message.error(response.message || 'Erreur lors du chargement des centres');
        setCentres([]);
      }
    } catch (error) {
      console.error('Erreur chargement centres:', error);
      message.error('Erreur lors du chargement des centres');
      setCentres([]);
    } finally {
      setLoading(prev => ({ ...prev, centres: false }));
    }
  };

  // ==================== GÉNÉRATION CARTE PDF ====================
  const generateQRCode = async (text, size = 200) => {
    try {
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
      return qrCodeUrl;
    } catch (error) {
      console.error('Erreur génération QR Code:', error);
      return null;
    }
  };

  const getBeneficiaryQRCodeData = (beneficiaire) => {
    const data = {
      id: beneficiaire.ID_BEN || beneficiaire.id,
      matricule: beneficiaire.IDENTIFIANT_NATIONAL || '',
      identifiant_national: beneficiaire.IDENTIFIANT_NATIONAL || '',
      nom: beneficiaire.NOM_BEN || '',
      prenom: beneficiaire.PRE_BEN || '',
      date_naissance: beneficiaire.NAI_BEN || '',
      sexe: beneficiaire.SEX_BEN || '',
      employeur: beneficiaire.EMPLOYEUR || '',
      telephone: beneficiaire.TELEPHONE_MOBILE || '',
      type: beneficiaire.STATUT_ACE ? 'Ayant droit' : 'Assuré principal',
      statut_ace: beneficiaire.STATUT_ACE || '',
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(data);
  };

  const handleDownloadCard = async () => {
    if (!selectedBeneficiaireForCard) {
      message.error('Aucun bénéficiaire sélectionné');
      return;
    }
    
    try {
      const ben = selectedBeneficiaireForCard;
      setLoading(prev => ({ ...prev, export: true }));
      
      // Récupérer la photo
      let photoDataUrl = null;
      try {
        const photoResponse = await beneficiairesAPI.getPhoto(ben.ID_BEN);
        if (photoResponse.success) {
          if (photoResponse.photoData) {
            const mimeType = photoResponse.mimeType || 'image/jpeg';
            photoDataUrl = `data:${mimeType};base64,${photoResponse.photoData}`;
          } else if (photoResponse.photoUrl) {
            photoDataUrl = photoResponse.photoUrl;
          }
        }
      } catch (photoError) {
        console.error('❌ Erreur récupération photo:', photoError);
      }
      
      // Générer QR Code
      let qrCodeUrl = null;
      try {
        const qrData = getBeneficiaryQRCodeData(ben);
        qrCodeUrl = await generateQRCode(qrData, 300);
      } catch (qrError) {
        console.error('❌ Erreur génération QR code:', qrError);
      }
      
      // Fonction d'attente pour les images
      const waitForImages = (container) => {
        return new Promise((resolve) => {
          const images = container.getElementsByTagName('img');
          const totalImages = images.length;
          if (totalImages === 0) {
            resolve();
            return;
          }
          
          let loadedImages = 0;
          const checkAllLoaded = () => {
            if (loadedImages === totalImages) {
              resolve();
            }
          };
          
          Array.from(images).forEach(img => {
            if (img.complete) {
              loadedImages++;
              checkAllLoaded();
            } else {
              img.onload = () => {
                loadedImages++;
                checkAllLoaded();
              };
              img.onerror = () => {
                loadedImages++;
                checkAllLoaded();
              };
            }
          });
          
          setTimeout(() => {
            resolve();
          }, 10000);
        });
      };
      
      // Générer le recto
      let rectoCanvas = null;
      let rectoContainer = null;
      
      try {
        rectoContainer = document.createElement('div');
        rectoContainer.style.position = 'fixed';
        rectoContainer.style.left = '-10000px';
        rectoContainer.style.top = '-10000px';
        rectoContainer.style.width = '1480px';
        rectoContainer.style.height = '1050px';
        rectoContainer.style.fontFamily = 'Arial, sans-serif';
        rectoContainer.style.overflow = 'hidden';
        rectoContainer.style.zIndex = '-9999';
        document.body.appendChild(rectoContainer);
        
        const matricule = ben.IDENTIFIANT_NATIONAL || `AMS${String(ben.ID_BEN || '000000').padStart(6, '0')}`;
        const nomComplet = `${ben.NOM_BEN || ''} ${ben.PRE_BEN || ''}`.trim();
        
        rectoContainer.innerHTML = `
          <div style="
            width: 1480px; 
            height: 1050px; 
            background: ${FrontbackgroundCard ? `url('${FrontbackgroundCard}')` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; 
            background-size:fit-content; 
            position: relative; 
            overflow: hidden; 
            font-family: Arial, sans-serif;
          ">
            <div style="
              position: relative; 
              height: 100%; 
              color: white; 
              display: flex; 
              flex-direction: column;
            ">
              <div style="
                flex: 1; 
                display: flex; 
                flex-direction: column; 
                justify-content: center; 
                margin-top: 100px;
              ">
                <div style="
                  display: flex; 
                  align-items: center; 
                  gap: 60px; 
                  margin-bottom: 80px;
                ">
                  <div style="
                    width: 580px; 
                    height: 600px; 
                    border-radius: 20px; 
                    overflow: hidden; 
                    border: 5px solid white; 
                    background: #f5f5f5; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    margin-top: 20%;
                  ">
                    ${photoDataUrl ? `
                      <img 
                        src="${photoDataUrl}" 
                        style="width: 100%; height: 100%; object-fit: cover;" 
                        alt="Photo de ${nomComplet}"
                        crossorigin="anonymous"
                        onerror="this.onerror=null; this.style.display='none'; this.parentNode.innerHTML='<div style=\"font-size: 100px; color: #ccc; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #f5f5f5;\">${ben.SEX_BEN === 'F' ? '♀' : '♂'}</div>';"
                      />
                    ` : `
                      <div style="
                        font-size: 100px; 
                        color: #ccc; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        width: 100%; 
                        height: 100%;
                      ">
                        ${ben.SEX_BEN === 'F' ? '♀' : '♂'}
                      </div>
                    `}
                  </div>
                  
                  <div style="flex: 1;">
                    <div style="
                      font-size: 40px; 
                      font-weight: 900; 
                      color: #03104f; 
                      margin-bottom: 20px; 
                      text-transform: uppercase; 
                      letter-spacing: 2px; 
                      text-shadow: 3px 3px 6px rgba(0,0,0,0.4); 
                      position: absolute; 
                      left: 70%; 
                      top: 75%;
                    ">
                      <strong>${ben.NOM_BEN || ''}</strong>
                    </div>
                    <div style="
                      font-size: 34px; 
                      font-weight: 900; 
                      color: #03104f; 
                      margin-bottom: 20px; 
                      text-transform: uppercase; 
                      letterSpacing: 2px; 
                      text-shadow: 3px 3px 6px rgba(0,0,0,0.4); 
                      position: absolute; 
                      left: 70%; 
                      top: 81%;
                    ">
                      <strong>${ben.PRE_BEN || ''}</strong>
                    </div> 
                  </div>
                </div>
                
                <div style="
                  text-align: center; 
                  position: absolute; 
                  left: 35%; 
                  top: 75%;
                ">
                  <div style="
                    display: inline-block; 
                    width: 70px; 
                    background: transparent; 
                    padding: 10px; 
                    border-radius: 15px;  
                    transform: translate(-100px, -100px);
                  ">
                    ${qrCodeUrl ? `
                      <img 
                        src="${qrCodeUrl}" 
                        style="width: 220px; height: 220px;" 
                        alt="QR Code Matricule: ${matricule}"
                        crossorigin="anonymous"
                      />
                    ` : `
                      <div style="
                        width: 320px; 
                        height: 320px; 
                        display: flex; 
                        flex-direction: column;
                        align-items: center; 
                        justify-content: center; 
                        background: #f0f0f0; 
                        border-radius: 10px; 
                        font-size: 24px; 
                        color: #333; 
                        font-weight: bold;
                        padding: 20px;
                      ">
                        QR Code<br><br>
                        Matricule:<br>
                        <strong>${matricule}</strong>
                      </div>
                    `}
                    <div style="
                      margin-top: 15px; 
                      color: #333; 
                      font-size: 24px; 
                      font-weight: bold; 
                      letter-spacing: 1px;
                    ">
                      ${matricule}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        
        await waitForImages(rectoContainer);
        rectoCanvas = await html2canvas(rectoContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          logging: false,
          allowTaint: true,
          imageTimeout: 30000,
        });
        
      } catch (rectoError) {
        console.error('❌ Erreur lors de la génération du recto:', rectoError);
        throw new Error(`Échec de génération du recto: ${rectoError.message}`);
      } finally {
        if (rectoContainer && rectoContainer.parentNode) {
          document.body.removeChild(rectoContainer);
        }
      }
      
      // Générer le verso
      let versoCanvas = null;
      let versoContainer = null;
      
      try {
        versoContainer = document.createElement('div');
        versoContainer.style.position = 'fixed';
        versoContainer.style.left = '-10000px';
        versoContainer.style.top = '-10000px';
        versoContainer.style.width = '1480px';
        versoContainer.style.height = '1050px';
        versoContainer.style.fontFamily = 'Arial, sans-serif';
        versoContainer.style.zIndex = '-9999';
        document.body.appendChild(versoContainer);
        
        versoContainer.innerHTML = `
          <div style="
            width: 1480px; 
            height: 1050px; 
            background: ${backgroundCard ? `url('${backgroundCard}')` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; 
            background-size:fit-content;  
            background-position: center; 
            padding: 80px; 
            color: #333; 
            display: flex; 
            flex-direction: column; 
            font-family: Arial, sans-serif;
          ">
            <div style="
              height: 100%; 
              display: flex; 
              flex-direction: column; 
              justify-content: center;
            ">
              <div style="
                font-size: 30px; 
                line-height: 1.5; 
                text-align: center; 
                margin-bottom: 50px; 
                margin-top: 25%; 
                color: #333; 
                font-weight: 500;
              ">
                <div style="margin-bottom: 15px;">Bonapriso, Rue VASNITEX, Immeuble ATLANTIS</div>
                <div style="margin-bottom: 15px;">Avenue Winton Churchill, Immeuble mitoyen à l'OAPI (Yaoundé)</div>
                <div style="margin-bottom: 15px;">BP 4962 Douala – Cameroun</div>
                <div style="margin-bottom: 25px;">
                  <strong>Tel :</strong> 2 33 42 08 74 / 6 99 90 60 88 / 690096197
                </div>
              </div>
              
              <div style="
                font-size: 32px; 
                font-weight: 700; 
                color: #1a2980; 
                text-align: center; 
                margin-top: 20px; 
                margin-bottom: 60px; 
                text-transform: uppercase; 
                background: rgba(26, 41, 128, 0.1); 
                padding: 25px; 
                border-radius: 15px;
              ">
                Support Technique: +237 690 09 61 97 / +237 674 29 01 49
              </div>
              
              <div style="
                font-size: 26px; 
                line-height: 1.4; 
                text-align: center; 
                margin-top: auto; 
                color: #333; 
                padding: 40px; 
                border-top: 5px solid red; 
                background: rgba(255, 0, 0, 0.05); 
                border-radius: 10px;
              ">
                <strong>⚠️ IMPORTANT :</strong> Cette carte est strictement personnelle et est la propriété exclusive d'AMS INSURANCE.<br/>
                En cas de perte ou vol, contactez immédiatement le support technique.
              </div>
            </div>
          </div>
        `;
        
        await waitForImages(versoContainer);
        versoCanvas = await html2canvas(versoContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          logging: false,
          allowTaint: true,
          imageTimeout: 15000
        });
        
      } catch (versoError) {
        console.error('❌ Erreur lors de la génération du verso:', versoError);
        throw new Error(`Échec de génération du verso: ${versoError.message}`);
      } finally {
        if (versoContainer && versoContainer.parentNode) {
          document.body.removeChild(versoContainer);
        }
      }
      
      // Créer PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a6',
        compress: true
      });
      
      const pageWidth = 148;
      const pageHeight = 105;
      
      if (rectoCanvas) {
        const rectoDataUrl = rectoCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(rectoDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, '', 'FAST');
      }
      
      pdf.addPage();
      if (versoCanvas) {
        const versoDataUrl = versoCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(versoDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, '', 'FAST');
      }
      
      pdf.setProperties({
        title: `Carte Bénéficiaire - ${ben.NOM_BEN} ${ben.PRE_BEN}`,
        subject: "Carte d'identification bénéficiaire AMS Insurance",
        author: 'AMS Insurance',
        keywords: `carte, bénéficiaire, assurance, santé, AMS, QR code, matricule: ${ben.IDENTIFIANT_NATIONAL || ben.ID_BEN}`,
        creator: 'AMS System'
      });
      
      const nomFichier = `Carte_${ben.NOM_BEN?.replace(/\s+/g, '_') || 'Inconnu'}_${ben.PRE_BEN?.replace(/\s+/g, '_') || 'Inconnu'}_${ben.IDENTIFIANT_NATIONAL || ben.ID_BEN}.pdf`;
      pdf.save(nomFichier);
      
      message.success(`Carte téléchargée: ${nomFichier}`);
      
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement du PDF:', error);
      message.error('Erreur lors du téléchargement du PDF: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };

  // ==================== COLONNES DES TABLES ====================
  const beneficiaireColumns = [
    {
      title: 'Photo',
      dataIndex: 'PHOTO',
      key: 'PHOTO',
      width: 80,
      render: (_, record) => (
        <Tooltip title={`${record.NOM_BEN} ${record.PRE_BEN}`}>
          <BeneficiaireAvatar beneficiaire={record} size={40} />
        </Tooltip>
      ),
    },
    {
      title: 'Nom & Prénom',
      key: 'NOM_PRENOM',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.NOM_BEN} {record.PRE_BEN}</div>
          {record.FIL_BEN && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              <em>(née {record.FIL_BEN})</em>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Identifiant',
      dataIndex: 'IDENTIFIANT_NATIONAL',
      key: 'IDENTIFIANT_NATIONAL',
      width: 150,
      render: (text) => <Tag color="blue">{text || 'N/A'}</Tag>,
    },
    {
      title: 'Téléphone',
      dataIndex: 'TELEPHONE_MOBILE',
      key: 'TELEPHONE_MOBILE',
      width: 150,
      render: (text) => text || 'N/A',
    },
    {
      title: 'Employeur',
      dataIndex: 'EMPLOYEUR',
      key: 'EMPLOYEUR',
      width: 150,
      render: (text, record) => {
        const employeur = record.EMPLOYEUR || record.employeur || 'Non spécifié';
        return (
          <Tooltip title={employeur}>
            <span>{employeur}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Âge',
      key: 'AGE',
      width: 80,
      render: (_, record) => (
        <Tag color={record.AGE < 18 ? 'green' : record.AGE > 60 ? 'red' : 'blue'}>
          {record.AGE} ans
        </Tag>
      ),
    },
    {
      title: 'Statut ACE',
      key: 'STATUT_ACE',
      width: 120,
      render: (_, record) => {
        if (record.STATUT_ACE) {
          return <Tag color="orange">{record.STATUT_ACE}</Tag>;
        }
        return <Tag color="green">Assuré Principal</Tag>;
      },
    },
   {
    title: 'Taux de couverture',
    key: 'TAUX_COUVERTURE',
    width: 150,
    render: (_, record) => {
      // Calculer ou récupérer le taux de couverture depuis BENEF_POLICE
      const tauxCouverture = record.tauxCouverture || 0;
      
      // Déterminer la couleur en fonction du taux
      let color = 'default';
      if (tauxCouverture >= 80) {
        color = 'success';
      } else if (tauxCouverture >= 50) {
        color = 'warning';
      } else if (tauxCouverture > 0) {
        color = 'error';
      }
      
      return (
        <Tooltip title={`Taux de couverture: ${tauxCouverture}%`}>
          <Tag color={color}>
            {tauxCouverture}%
          </Tag>
        </Tooltip>
      );
    },
  },
    {
    title: 'Statut',
    dataIndex: 'STATUT',
    key: 'STATUT',
    width: 100,
    render: (statut) => (
      <Tag color={statut === 'ACTIF' ? 'success' : 'error'}>
        {statut || 'ACTIF'}
      </Tag>
    ),
  },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir les polices">
            <Button
              type="link"
              icon={<InsuranceOutlined />}
              onClick={() => {
                setSelectedBeneficiaireForPolices(record);
                loadPolices(record.ID_BEN);
                setPolicesModal(true);
              }}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Voir les cartes">
            <Button
              type="link"
              icon={<IdcardOutlined />}
              onClick={() => {
                setSelectedBeneficiaireForCartes(record);
                loadCartes(record.ID_BEN);
                setCartesModal(true);
              }}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Voir les centres">
            <Button
              type="link"
              icon={<MedicineBoxOutlined />}
              onClick={() => {
                setSelectedBeneficiaireForCentres(record);
                loadCentres(record.ID_BEN);
                setCentresModal(true);
              }}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Générer carte">
            <Button
              type="link"
              icon={<CreditCardOutlined />}
              onClick={() => {
                setSelectedBeneficiaireForCard(record);
                setCarteModal(true);
              }}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenForm(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const policeColumns = [
    {
      title: 'Numéro',
      dataIndex: 'NUM_POLICE',
      key: 'NUM_POLICE',
      width: 150,
    },
    {
      title: 'Compagnie',
      dataIndex: 'NOM_COMPAGNIE',
      key: 'NOM_COMPAGNIE',
      width: 160,
      render: (text, record) => {
        const compagnie = compagniesList.find(c => c.COD_ASS === record.COD_ASS);
        const nomCompagnie = compagnie ? compagnie.NOM_COMPAGNIE : text || 'N/A';
        return (
          <Tooltip title={nomCompagnie}>
            <Tag color="blue">
              {nomCompagnie.length > 20 ? `${nomCompagnie.substring(0, 20)}...` : nomCompagnie}
            </Tag>
          </Tooltip>
        );
      }
    },
    {
      title: 'Type',
      dataIndex: 'TYPE_POLICE',
      key: 'TYPE_POLICE',
      width: 120,
    },
    {
      title: 'Barèmes',
      key: 'BAREMES',
      width: 150,
      render: (_, record) => {
        const baremes = Array.isArray(record.Bareme) 
          ? record.Bareme.filter(b => b != null && b.COD_BAR != null && b.COD_BAR !== 'null')
          : [];
        
        if (baremes.length === 0) {
          return <Tag color="default">Aucun</Tag>;
        }
        
        const displayedBaremes = baremes.slice(0, 2);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {displayedBaremes.map((bareme, index) => {
              const baremeText = bareme.LIB_BAR || bareme.COD_BAR || `Barème ${index + 1}`;
              return (
                <Tag key={`bareme-${index}`} color="purple" style={{ marginRight: 0, marginBottom: '4px' }}>
                  {baremeText}
                </Tag>
              );
            })}
            {baremes.length > 2 && (
              <Tooltip title={baremes.slice(2).map((b, idx) => {
                const text = b.LIB_BAR || b.COD_BAR || `Barème ${idx + 3}`;
                return <div key={`tooltip-item-${idx}`}>{text}</div>;
              })}>
                <Tag style={{ cursor: 'pointer' }}>
                  +{baremes.length - 2} autres
                </Tag>
              </Tooltip>
            )}
          </div>
        );
      }
    },
    {
      title: 'Date effet',
      dataIndex: 'DATE_EFFET',
      key: 'DATE_EFFET',
      width: 120,
      render: (date) => formatDate(date),
    },
    {
      title: 'Date échéance',
      dataIndex: 'DATE_ECHEANCE',
      key: 'DATE_ECHEANCE',
      width: 120,
      render: (date) => formatDate(date),
    },
    {
      title: 'Prime',
      dataIndex: 'MONTANT_PRIME',
      key: 'MONTANT_PRIME',
      width: 120,
      render: (montant) => montant ? `${parseFloat(montant).toLocaleString('fr-FR')} FCFA` : '-',
    },
    {
      title: 'Taux',
      dataIndex: 'TAUX_ASSURANCE',
      key: 'TAUX_ASSURANCE',
      width: 80,
      render: (taux) => taux ? `${taux}%` : '-',
    },
    {
      title: 'Statut',
      dataIndex: 'STATUT_POLICE',
      key: 'STATUT_POLICE',
      width: 120,
      render: (statut) => (
        <Tag color={
          statut === 'ACTIVE' ? 'success' :
          statut === 'SUSPENDUE' ? 'warning' :
          statut === 'RESILIEE' ? 'error' : 'default'
        }>
          {statut || 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions_police',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Modifier">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenPoliceForm(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeletePolice(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ==================== EFFETS ====================
  useEffect(() => {
    loadBeneficiaires();
    loadReferenceData();
    loadCompagnies();
    loadReseauSoins();
    loadBaremes();
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  // ==================== RENDU ====================
  return (
    <div style={{ padding: '20px' }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TeamOutlined style={{ marginRight: 8 }} />
            <span>Gestion des Bénéficiaires</span>
          </div>
        }
        extra={
          <Space>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'ace',
                    label: 'Synchroniser ACE uniquement',
                    icon: <SyncOutlined />,
                    onClick: handleSyncAceData
                  },
                  {
                    key: 'benef-police',
                    label: 'Synchroniser BENEF_POLICE uniquement',
                    icon: <DatabaseOutlined />,
                    onClick: handleSyncBenefPolice
                  },
                  {
                    key: 'full',
                    label: 'Synchronisation complète',
                    icon: <CloudSyncOutlined />,
                    onClick: handleFullSync
                  },
                  {
                    type: 'divider'
                  },
                  {
                    key: 'check',
                    label: 'Vérifier structure BENEF_POLICE',
                    icon: <DatabaseOutlined />,
                    onClick: checkTableStructure
                  }
                ]
              }}
              trigger={['click']}
            >
              <Button icon={<SyncOutlined />} loading={loading.main}>
                Synchroniser <DownOutlined />
              </Button>
            </Dropdown>
            <Button
              icon={<CloudUploadOutlined />}
              onClick={() => setExportModal(true)}
            >
              Exporter
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenForm()}
            >
              Nouveau Bénéficiaire
            </Button>
            <Button
              icon={<InsuranceOutlined />}
              onClick={() => {
                setPoliceGestionModal(true);
                loadPolicesForManagement();
              }}
            >
              Gérer les polices
            </Button>
            <Button
              icon={<UserSwitchOutlined />}
              onClick={handleOpenLinkModal}
            >
              Lier bénéficiaires
            </Button>
          </Space>
        }
      >
        {/* Statistiques */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Total Bénéficiaires"
                value={stats.total}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Assurés Principaux"
                value={stats.assuresPrincipaux}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Ayants Droit"
                value={stats.ayantsDroit}
                prefix={<UsergroupAddOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Actifs"
                value={stats.actifs}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Barre de recherche et filtres */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Input
                placeholder="Rechercher un bénéficiaire (nom, prénom, téléphone, identifiant...)"
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onPressEnter={loadBeneficiaires}
                allowClear
              />
            </Col>
            <Col>
              <Popover
                title="Filtres avancés"
                content={
                  <div style={{ width: 300 }}>
                    <Row gutter={[8, 8]}>
                      <Col span={24}>
                        <Select
                          value={filtres.statut_ace}
                          onChange={(value) => setFiltres(prev => ({ ...prev, statut_ace: value }))}
                          style={{ width: '100%' }}
                          placeholder="Statut ACE"
                        >
                          <Option value="tous">Tous les statuts</Option>
                          <Option value="">Assuré Principal</Option>
                          <Option value="Conjoint">Conjoint</Option>
                          <Option value="Enfant">Enfant</Option>
                          <Option value="Ascendant">Ascendant</Option>
                        </Select>
                      </Col>
                      <Col span={12}>
                        <Select
                          value={filtres.sexe}
                          onChange={(value) => setFiltres(prev => ({ ...prev, sexe: value }))}
                          style={{ width: '100%' }}
                          placeholder="Sexe"
                        >
                          <Option value="tous">Tous</Option>
                          <Option value="M">Masculin</Option>
                          <Option value="F">Féminin</Option>
                        </Select>
                      </Col>
                      <Col span={12}>
                        <Input
                          placeholder="Âge min"
                          value={filtres.age_min}
                          onChange={(e) => setFiltres(prev => ({ ...prev, age_min: e.target.value }))}
                        />
                      </Col>
                      <Col span={12}>
                        <Input
                          placeholder="Âge max"
                          value={filtres.age_max}
                          onChange={(e) => setFiltres(prev => ({ ...prev, age_max: e.target.value }))}
                        />
                      </Col>
                      <Col span={12}>
                        <Input
                          placeholder="Employeur"
                          value={filtres.employeur}
                          onChange={(e) => setFiltres(prev => ({ ...prev, employeur: e.target.value }))}
                        />
                      </Col>
                      <Col span={24}>
                        <DatePicker.RangePicker
                          value={[filtres.date_debut, filtres.date_fin]}
                          onChange={(dates) => {
                            setFiltres(prev => ({ 
                              ...prev, 
                              date_debut: dates ? dates[0] : null,
                              date_fin: dates ? dates[1] : null
                            }));
                          }}
                          style={{ width: '100%' }}
                          placeholder={['Date début', 'Date fin']}
                        />
                      </Col>
                    </Row>
                  </div>
                }
                trigger="click"
              >
                <Button icon={<FilterOutlined />} style={{ marginRight: 8 }}>
                  Filtres
                </Button>
              </Popover>
              <Button
                type="primary"
                onClick={loadBeneficiaires}
                loading={loading.table}
                style={{ marginRight: 8 }}
              >
                Appliquer
              </Button>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setFiltres({
                    statut_ace: 'tous',
                    sexe: 'tous',
                    cod_pay: 'tous',
                    date_debut: null,
                    date_fin: null,
                    employeur: '',
                    age_min: '',
                    age_max: ''
                  });
                }}
              >
                Réinitialiser
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Table des bénéficiaires */}
        <Table
          columns={beneficiaireColumns}
          dataSource={beneficiaires}
          loading={loading.table}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `${total} bénéficiaires`,
            showQuickJumper: true
          }}
          scroll={{ x: 1300 }}
          locale={{
            emptyText: (
              <Empty
                description="Aucun bénéficiaire trouvé"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenForm()}
                >
                  Ajouter un bénéficiaire
                </Button>
              </Empty>
            )
          }}
        />
      </Card>

      {/* Modal Formulaire Bénéficiaire */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {editingId ? <EditOutlined /> : <PlusOutlined />}
            <span style={{ marginLeft: 8 }}>
              {editingId ? 'Modifier Bénéficiaire' : 'Nouveau Bénéficiaire'}
            </span>
          </div>
        }
        open={showForm}
        onCancel={() => {
          setShowForm(false);
          form.resetFields();
          setPhotoFile(null);
          setPhotoPreview(null);
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Tabs defaultActiveKey="1">
            <TabPane tab="Informations Personnelles" key="1">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="NOM_BEN"
                    label="Nom *"
                    rules={[{ required: true, message: 'Veuillez saisir le nom' }]}
                  >
                    <Input placeholder="Nom" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="PRE_BEN"
                    label="Prénom *"
                    rules={[{ required: true, message: 'Veuillez saisir le prénom' }]}
                  >
                    <Input placeholder="Prénom" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="FIL_BEN"
                    label="Nom marital"
                  >
                    <Input placeholder="Nom marital (si applicable)" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="SEX_BEN"
                    label="Sexe *"
                    rules={[{ required: true, message: 'Veuillez sélectionner le sexe' }]}
                  >
                    <Select placeholder="Sélectionner le sexe">
                      <Option value="M">Masculin</Option>
                      <Option value="F">Féminin</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="NAI_BEN"
                    label="Date de naissance *"
                    rules={[{ required: true, message: 'Veuillez sélectionner la date de naissance' }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="IDENTIFIANT_NATIONAL"
                    label="Identifiant national"
                  >
                    <Input placeholder="Généré automatiquement" readOnly />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Photo">
                <Upload
                  name="photo"
                  listType="picture-card"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const isImage = file.type.startsWith('image/');
                    if (!isImage) {
                      message.error('Vous ne pouvez uploader que des images !');
                      return false;
                    }
                    
                    const isLt5M = file.size / 1024 / 1024 < 5;
                    if (!isLt5M) {
                      message.error('L\'image doit être inférieure à 5MB !');
                      return false;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setPhotoPreview(e.target.result);
                    };
                    reader.readAsDataURL(file);
                    setPhotoFile(file);
                    
                    return false;
                  }}
                >
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Prévisualisation" 
                      style={{ width: '100%' }} 
                    />
                  ) : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Uploader</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </TabPane>

            <TabPane tab="Coordonnées" key="2">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="TELEPHONE_MOBILE"
                    label="Téléphone mobile *"
                    rules={[{ required: true, message: 'Veuillez saisir le téléphone' }]}
                  >
                    <Input placeholder="Téléphone mobile" prefix={<PhoneOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="EMAIL"
                    label="Email"
                    rules={[{ type: 'email', message: 'Email invalide' }]}
                  >
                    <Input placeholder="Email" prefix={<MailOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="PROFESSION"
                    label="Profession"
                  >
                    <Input placeholder="Profession" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="EMPLOYEUR"
                    label="Employeur"
                  >
                    <Input placeholder="Employeur" prefix={<BankOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="COD_PAY"
                    label="Pays"
                    initialValue="CMR"
                  >
                    <Select placeholder="Sélectionner le pays">
                      {paysList.map(pays => (
                        <Option key={pays.COD_PAY} value={pays.COD_PAY}>
                          {pays.NOM_PAY}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="STATUT"
                    label="Statut"
                    initialValue="ACTIF"
                  >
                    <Select>
                      <Option value="ACTIF">Actif</Option>
                      <Option value="INACTIF">Inactif</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="Affiliation" key="3">
              <Form.Item
                name="STATUT_ACE"
                label="Statut ACE"
              >
                <Select placeholder="Sélectionner le statut">
                  <Option value="">Assuré Principal</Option>
                  <Option value="Conjoint">Conjoint</Option>
                  <Option value="Enfant">Enfant</Option>
                  <Option value="Ascendant">Ascendant</Option>
                </Select>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.STATUT_ACE !== currentValues.STATUT_ACE}
              >
                {({ getFieldValue }) => {
                  const statutAce = getFieldValue('STATUT_ACE');
                  if (statutAce) {
                    return (
                      <Form.Item
                        name="ID_ASSURE_PRINCIPAL"
                        label="Assuré principal *"
                        rules={[{ required: true, message: 'Veuillez sélectionner un assuré principal' }]}
                      >
                        <Select
                          placeholder="Sélectionner un assuré principal"
                          showSearch
                          filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                          }
                        >
                          {assuresPrincipaux.map(assure => (
                            <Option key={assure.id} value={assure.id}>
                              {assure.nom} {assure.prenom} ({assure.identifiant_national})
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    );
                  }
                  return null;
                }}
              </Form.Item>

              <Form.Item
                name="ID_CENTRE_SANTE"
                label="Centre de santé"
              >
                <Select
                  placeholder="Sélectionner un centre de santé"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {allCentres.map(centre => (
                    <Option key={centre.ID_CENTRE || centre.id} value={centre.ID_CENTRE || centre.id}>
                      {centre.NOM_CENTRE} ({centre.TYPE_CENTRE})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="ASSURANCE_PRIVE"
                label="Assurance privée"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </TabPane>
          </Tabs>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Button
              onClick={() => {
                setShowForm(false);
                form.resetFields();
                setPhotoFile(null);
                setPhotoPreview(null);
              }}
              style={{ marginRight: 8 }}
            >
              Annuler
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading.form}
              icon={<SaveOutlined />}
            >
              {editingId ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Liaison Bénéficiaires-Police */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UserSwitchOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <span>Lier des bénéficiaires à une police</span>
          </div>
        }
        open={linkBeneficiaireModal}
        onCancel={() => {
          setLinkBeneficiaireModal(false);
          linkForm.resetFields();
          setSelectedPoliceForLinking(null);
          setSelectedBeneficiaires([]);
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setLinkBeneficiaireModal(false);
              linkForm.resetFields();
              setSelectedPoliceForLinking(null);
              setSelectedBeneficiaires([]);
            }}
          >
            Annuler
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={() => linkForm.submit()}
            loading={loading.polices}
            disabled={!selectedPoliceForLinking || selectedBeneficiaires.length === 0}
          >
            Lier les bénéficiaires
          </Button>
        ]}
        width={900}
      >
        <Form
          form={linkForm}
          layout="vertical"
          onFinish={handleLinkBeneficiairesSubmit}
          initialValues={{
            tauxGlobal: 100,
            dateEffet: moment()
          }}
        >
          <Card 
            size="small" 
            style={{ marginBottom: 16, borderColor: '#1890ff' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <InsuranceOutlined style={{ marginRight: 8 }} />
                <span>Étape 1 : Sélectionner une police</span>
              </div>
            }
          >
            <Form.Item
              name="selectedPolice"
              label="Police d'assurance"
              rules={[{ required: true, message: 'Veuillez sélectionner une police' }]}
            >

<Select
  placeholder="Rechercher et sélectionner une police"
  style={{ width: '100%' }}
  onChange={handlePoliceSelection}
  showSearch
  filterOption={(input, option) => {
    if (option && option.children) {
      return option.children.toString().toLowerCase().includes(input.toLowerCase());
    }
    return false;
  }}
  loading={loading.polices}
  allowClear
  value={selectedPoliceForLinking ? selectedPoliceForLinking.value : undefined}
>
  {availablePolicesForLinking.map(police => {
    const policeNumber = police.NUM_POLICE || police.NUM_POL || `POL-${police.value}`;
    const nomCompagnie = police.NOM_COMPAGNIE || 'Sans compagnie';
    const label = `${policeNumber} - ${nomCompagnie}`;
    
    return (
      <Select.Option 
        key={police.key} 
        value={police.value}  // IMPORTANT: passer la valeur numérique
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{policeNumber}</strong>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {nomCompagnie} • ID: {police.value}
            </div>
          </div>
          <div>
            <Tag color="blue">
              {police.nombreBeneficiaires || 0} bénéf.
            </Tag>
            <Tag color={police.STATUT_POLICE === 'ACTIVE' ? 'success' : 'warning'}>
              {police.STATUT_POLICE || 'ACTIVE'}
            </Tag>
          </div>
        </div>
      </Select.Option>
    );
  })}
</Select>
            </Form.Item>

            {selectedPoliceForLinking && (
              <Alert
                message={
                  <div>
                    <strong>Police sélectionnée :</strong> {selectedPoliceForLinking.NUM_POLICE}
                    <div style={{ marginTop: 4 }}>
                      <Tag color="blue">{selectedPoliceForLinking.NOM_COMPAGNIE}</Tag>
                      <Tag>{selectedPoliceForLinking.TYPE_POLICE}</Tag>
                      <Tag color={selectedPoliceForLinking.STATUT_POLICE === 'ACTIVE' ? 'success' : 'warning'}>
                        {selectedPoliceForLinking.STATUT_POLICE}
                      </Tag>
                      {selectedPoliceForLinking.TAUX_ASSURANCE && (
                        <Tag color="purple">Taux: {selectedPoliceForLinking.TAUX_ASSURANCE}%</Tag>
                      )}
                    </div>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
          </Card>

          {selectedPoliceForLinking && (
            <>
              <Card 
                size="small" 
                style={{ marginBottom: 16, borderColor: '#52c41a' }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <TeamOutlined style={{ marginRight: 8 }} />
                    <span>Étape 2 : Sélectionner les bénéficiaires</span>
                  </div>
                }
              >
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <Form.Item
                      name="tauxGlobal"
                      label="Taux de couverture global (%)"
                      rules={[
                        { required: true, message: 'Veuillez saisir le taux' },
                        { type: 'number', min: 0, max: 100, message: 'Le taux doit être entre 0 et 100%' }
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        max={100}
                        formatter={value => `${value}%`}
                        parser={value => value.replace('%', '')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="dateEffet"
                      label="Date d'effet de la liaison"
                      rules={[{ required: true, message: 'Veuillez sélectionner une date' }]}
                    >
                      <DatePicker
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="selectedBeneficiaires"
                  label="Bénéficiaires à lier"
                  rules={[{ required: true, message: 'Veuillez sélectionner au moins un bénéficiaire' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="Rechercher et sélectionner des bénéficiaires"
                    style={{ width: '100%' }}
                    onChange={(value) => setSelectedBeneficiaires(value)}
                    filterOption={(input, option) =>
                      option.label.toLowerCase().includes(input.toLowerCase())
                    }
                    loading={loading.table}
                    showSearch
                    allowClear
                    optionLabelProp="label"
                  >
                    {getFilteredBeneficiaires.map(beneficiaire => (
                      <Select.Option 
                        key={beneficiaire.key} 
                        value={beneficiaire.ID_BEN}
                        label={`${beneficiaire.NOM_BEN} ${beneficiaire.PRE_BEN}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <BeneficiaireAvatar 
                              beneficiaire={beneficiaire} 
                              size={24}
                              style={{ marginRight: 8 }}
                            />
                            <div>
                              <div>
                                <strong>{beneficiaire.NOM_BEN} {beneficiaire.PRE_BEN}</strong>
                              </div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {beneficiaire.IDENTIFIANT_NATIONAL} • {beneficiaire.age} ans • {beneficiaire.SEX_BEN === 'M' ? '♂' : '♀'}
                              </div>
                            </div>
                          </div>
                          <div>
                            <Tag color={beneficiaire.STATUT_ACE ? 'orange' : 'green'}>
                              {beneficiaire.statutText}
                            </Tag>
                            {beneficiaire.EMPLOYEUR && (
                              <Tag color="blue" style={{ marginLeft: 4 }}>
                                {beneficiaire.EMPLOYEUR}
                              </Tag>
                            )}
                          </div>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                {selectedBeneficiaires.length > 0 && (
                  <Alert
                    message={
                      <div>
                        <strong>{selectedBeneficiaires.length} bénéficiaire(s) sélectionné(s)</strong>
                        <div style={{ marginTop: 8, maxHeight: 150, overflowY: 'auto' }}>
                          {selectedBeneficiaires.map(id => {
                            const benef = beneficiairesForLinking.find(b => b.ID_BEN === id);
                            return benef ? (
                              <Tag 
                                key={id} 
                                color="blue" 
                                style={{ marginBottom: 4, marginRight: 4 }}
                              >
                                {benef.NOM_BEN} {benef.PRE_BEN}
                              </Tag>
                            ) : null;
                          })}
                        </div>
                      </div>
                    }
                    type="success"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}
              </Card>

              <Card 
                size="small" 
                style={{ borderColor: '#faad14' }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <InfoCircleOutlined style={{ marginRight: 8 }} />
                    <span>Résumé de l'opération</span>
                  </div>
                }
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Police">
                    <strong>{selectedPoliceForLinking.NUM_POLICE}</strong> - {selectedPoliceForLinking.NOM_COMPAGNIE}
                  </Descriptions.Item>
                  <Descriptions.Item label="Type">
                    {selectedPoliceForLinking.TYPE_POLICE}
                  </Descriptions.Item>
                  <Descriptions.Item label="Bénéficiaires à lier">
                    <span style={{ color: selectedBeneficiaires.length > 0 ? '#52c41a' : '#f5222d' }}>
                      {selectedBeneficiaires.length} sélectionné(s)
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Taux appliqué">
                    {linkForm.getFieldValue('tauxGlobal') || 100}%
                  </Descriptions.Item>
                  <Descriptions.Item label="Date d'effet">
                    {linkForm.getFieldValue('dateEffet')?.format('DD/MM/YYYY') || 'Aujourd\'hui'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </>
          )}
        </Form>
      </Modal>

      {/* Modal Polices */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <InsuranceOutlined style={{ marginRight: 8 }} />
            <span>Polices de {selectedBeneficiaireForPolices?.NOM_BEN} {selectedBeneficiaireForPolices?.PRE_BEN}</span>
          </div>
        }
        open={policesModal}
        onCancel={() => {
          setPolicesModal(false);
          setSelectedBeneficiaireForPolices(null);
          setPolices([]);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setPolicesModal(false);
              setSelectedBeneficiaireForPolices(null);
              setPolices([]);
            }}
          >
            Fermer
          </Button>,
          <Button
            key="new"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenPoliceForm()}
          >
            Nouvelle Police
          </Button>
        ]}
        width={1200}
      >
        <Table
          columns={policeColumns}
          dataSource={polices}
          loading={loading.polices}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                description="Aucune police trouvée"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenPoliceForm()}
                >
                  Créer une police
                </Button>
              </Empty>
            )
          }}
        />
      </Modal>

      {/* Modal Formulaire Police */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FileAddOutlined />
            <span style={{ marginLeft: 8 }}>
              {editingPolice ? 'Modifier Police' : 'Nouvelle Police'}
            </span>
          </div>
        }
        open={showPoliceForm}
        onCancel={() => {
          setShowPoliceForm(false);
          policeForm.resetFields();
          setEditingPolice(null);
          setSelectedBaremes([]);
        }}
        footer={null}
        width={800}
        destroyOnClose
        style={{ top: 20 }}
      >
        <Form
          form={policeForm}
          layout="vertical"
          onFinish={handleSavePolice}
          style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}
        >
          {/* Section 1: Informations de Base */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: '1px solid #f0f0f0'
            }}>
              <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
              <Text strong style={{ fontSize: 16 }}>Informations de Base</Text>
            </div>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="NUM_POLICE"
                  label={
                    <span>
                      Numéro de police <Text type="danger">*</Text>
                    </span>
                  }
                  rules={[
                    { required: true, message: 'Ce champ est obligatoire' },
                    { max: 50, message: 'Maximum 50 caractères' }
                  ]}
                >
                  <Input 
                    placeholder="Ex: POL-2024-001" 
                    suffix={<Tag color="blue">Unique</Tag>}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="NUMR_POLICE"
                  label="Numéro de référence"
                  tooltip="Numéro de référence interne ou externe"
                >
                  <Input placeholder="Optionnel - référence secondaire" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="TYPE_POLICE"
                  label={
                    <span>
                      Type de police <Text type="danger">*</Text>
                    </span>
                  }
                  rules={[{ required: true, message: 'Veuillez sélectionner le type' }]}
                >
                  <Select placeholder="Sélectionner le type">
                    <Option value="INDIVIDUELLE">Individuelle</Option>
                    <Option value="FAMILIALE">Familiale</Option>
                    <Option value="COLLECTIVE">Collective</Option>
                    <Option value="ENTREPRISE">Entreprise</Option>
                    <Option value="GROUPE">Groupe</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
  name="STATUT_POLICE"
  label={
    <span>
      Statut <Text type="danger">*</Text>
    </span>
  }
  rules={[{ required: true, message: 'Veuillez sélectionner le statut' }]}
>
  <Select placeholder="Sélectionner le statut">
    <Option value="ACTIVE">
      <Badge status="success" text="Active" />
    </Option>
    <Option value="SUSPENDUE">
      <Badge status="warning" text="Suspendue" />
    </Option>
    <Option value="RESILIEE">
      <Badge status="error" text="Résiliée" />
    </Option>
    <Option value="INACTIVE">
      <Badge status="default" text="Inactive" />
    </Option>
  </Select>
</Form.Item>
                </Col>
              </Row>
            </div>

            {/* Section 2: Partenaires et Affiliation */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: '1px solid #f0f0f0'
              }}>
                <TeamOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text strong style={{ fontSize: 16 }}>Partenaires et Affiliation</Text>
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="COD_ASS"
                    label={
                      <span>
                        Compagnie d'assurance <Text type="danger">*</Text>
                      </span>
                    }
                    rules={[{ required: true, message: 'Veuillez sélectionner une compagnie' }]}
                  >
                    <Select 
                      placeholder="Sélectionner une compagnie"
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      loading={loading.compagnies}
                    >
                      {compagniesList.map(compagnie => (
                        <Option 
                          key={compagnie.COD_ASS} 
                          value={String(compagnie.COD_ASS)}
                          disabled={compagnie.STATUT === 'INACTIF'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{compagnie.NOM_COMPAGNIE}</span>
                            {compagnie.STATUT === 'INACTIF' && (
                              <Tag color="red" size="small">INACTIF</Tag>
                            )}
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="EMPLOYEUR"
                    label="Employeur affilié"
                    tooltip="Si cette police est liée à un employeur spécifique"
                  >
                    <Select
                      placeholder="Sélectionner un employeur"
                      showSearch
                      allowClear
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {employeursList.map(employeur => (
                        <Option key={employeur} value={employeur}>
                          {employeur}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="COD_RESEAU"
                    label="Réseau de soins"
                    tooltip="Réseau de soins associé à cette police"
                  >
                    <Select
                      placeholder="Sélectionner un réseau de soins"
                      showSearch
                      allowClear
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {reseauSoinsList
                        .filter(reseau => reseau && reseau.COD_RESEAU)
                        .map(reseau => {
                          const value = reseau.COD_RESEAU ? String(reseau.COD_RESEAU) : '';
                          const label = reseau.NOM_RESEAU || `Réseau ${reseau.COD_RESEAU}`;
                          return (
                            <Option 
                              key={reseau.key} 
                              value={value}
                              disabled={!value || value === 'null' || value === 'undefined'}
                            >
                              {label} {reseau.TYPE_RESEAU ? `(${reseau.TYPE_RESEAU})` : ''}
                            </Option>
                          );
                        })
                      }
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Section 3: Période de validité */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: '1px solid #f0f0f0'
              }}>
                <CalendarOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                <Text strong style={{ fontSize: 16 }}>Période de validité</Text>
              </div>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="DATE_EMISSION"
                    label="Date d'émission"
                    rules={[{ required: true, message: 'Date d\'émission requise' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }} 
                      format="DD/MM/YYYY"
                      placeholder="Date d'émission"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="DATE_EFFET"
                    label={
                      <span>
                        Date d'effet <Text type="danger">*</Text>
                      </span>
                    }
                    rules={[{ required: true, message: 'Date d\'effet requise' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }} 
                      format="DD/MM/YYYY"
                      placeholder="Date d'effet"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="DATE_ECHEANCE"
                    label={
                      <span>
                        Date d'échéance <Text type="danger">*</Text>
                      </span>
                    }
                    rules={[{ required: true, message: 'Date d\'échéance requise' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }} 
                      format="DD/MM/YYYY"
                      placeholder="Date d'échéance"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Section 4: Barèmes */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: '1px solid #f0f0f0'
              }}>
                <ToolOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                <Text strong style={{ fontSize: 16 }}>Barèmes associés</Text>
              </div>

              <Form.Item
                name="BAREMES"
                label="Sélectionner les barèmes"
                tooltip="Barèmes de remboursement applicables à cette police"
              >
                <Select
                  mode="multiple"
                  placeholder="Sélectionner un ou plusieurs barèmes"
                  style={{ width: '100%' }}
                  loading={loadingBaremes}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={(value) => {
                    const filteredValue = value.filter(v => v && v !== 'null' && v !== 'undefined');
                    setSelectedBaremes(filteredValue);
                  }}
                >
                  {baremesList
                    .filter(bareme => bareme && bareme.COD_BAR && bareme.COD_BAR !== 'null')
                    .map(bareme => {
                      const value = bareme.COD_BAR ? String(bareme.COD_BAR) : '';
                      return (
                        <Option 
                          key={bareme.COD_BAR}
                          value={value}
                          disabled={!value}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ marginRight: 8 }}>{bareme.COD_BAR}</span>
                            <span style={{ color: '#666', flex: 1 }}>{bareme.LIB_BAR}</span>
                            <Tag color="blue" size="small">{bareme.TYPE_BAREME}</Tag>
                          </div>
                        </Option>
                      );
                    })
                  }
                </Select>
              </Form.Item>

              {selectedBaremes.length > 0 && (
                <Alert
                  message={`${selectedBaremes.length} barème(s) sélectionné(s)`}
                  type="info"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              )}
            </div>

            {/* Section 5: Informations financières */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: '1px solid #f0f0f0'
              }}>
                <DollarOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text strong style={{ fontSize: 16 }}>Informations financières</Text>
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="MONTANT_PRIME"
                    label="Montant de la prime (FCFA)"
                    rules={[
                      { required: true, message: 'Veuillez saisir le montant de la prime' },
                      { type: 'number', min: 0, message: 'Le montant doit être positif' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                      parser={value => value.replace(/\s/g, '')}
                      placeholder="0"
                      min={0}
                      step={1000}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="TAUX_ASSURANCE"
                    label="Taux d'assurance (%)"
                    rules={[
                      { required: true, message: 'Veuillez saisir le taux' },
                      { type: 'number', min: 0, max: 100, message: 'Le taux doit être entre 0 et 100%' }
                    ]}
                    initialValue={100}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      formatter={value => `${value}%`}
                      parser={value => value.replace('%', '')}
                      placeholder="100"
                      min={0}
                      max={100}
                      step={1}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Section 6: Remarques */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: '1px solid #f0f0f0'
              }}>
                <FileTextOutlined style={{ color: '#8c8c8c', marginRight: 8 }} />
                <Text strong style={{ fontSize: 16 }}>Remarques</Text>
              </div>

              <Form.Item
                name="REMARQUES"
                label="Remarques additionnelles"
              >
                <TextArea
                  rows={4}
                  placeholder="Notes, conditions particulières, exclusions..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </div>

            <Divider />

            <div style={{ textAlign: 'right' }}>
              <Button
                onClick={() => {
                  setShowPoliceForm(false);
                  policeForm.resetFields();
                  setSelectedBaremes([]);
                }}
                style={{ marginRight: 8 }}
              >
                Annuler
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading.polices}
                icon={<SaveOutlined />}
              >
                {editingPolice ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Modal Gestion des Polices */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <InsuranceOutlined style={{ marginRight: 8 }} />
            <span>Gestion des Polices</span>
          </div>
        }
        open={policeGestionModal}
        onCancel={() => {
          setPoliceGestionModal(false);
          setPolices([]);
        }}
        footer={null}
        width={1200}
        style={{ top: 20 }}
      >
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenPoliceForm()}
              >
                Nouvelle Police
              </Button>
              <Button
                icon={<SyncOutlined />}
                onClick={loadPolicesForManagement}
                loading={loading.polices}
              >
                Actualiser
              </Button>
            </Space>
          </div>

          <Table
            columns={policeGestionColumns}
            dataSource={polices}
            loading={loading.polices}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `${total} polices`,
              showQuickJumper: true
            }}
            scroll={{ x: 1300 }}
            locale={{
              emptyText: (
                <Empty
                  description="Aucune police trouvée"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleOpenPoliceForm()}
                  >
                    Créer une police
                  </Button>
                </Empty>
              )
            }}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ margin: 0, padding: 16, background: '#fafafa' }}>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Bénéficiaires couverts :</Text>
                    {record.beneficiaires && record.beneficiaires.length > 0 ? (
                      <div style={{ marginTop: 8 }}>
                        {record.beneficiaires.slice(0, 10).map((benef, index) => (
                          <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                            {benef.NOM_BEN} {benef.PRE_BEN}
                          </Tag>
                        ))}
                        {record.beneficiaires.length > 10 && (
                          <Tag>
                            + {record.beneficiaires.length - 10} autres
                          </Tag>
                        )}
                      </div>
                    ) : (
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        Aucun bénéficiaire directement associé
                      </Text>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Informations réseau :</Text>
                    {record.reseau_soins ? (
                      <div style={{ marginTop: 8 }}>
                        <Tag color="purple">
                          {record.reseau_soins.NOM_RESEAU} ({record.reseau_soins.TYPE_RESEAU})
                        </Tag>
                      </div>
                    ) : (
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        Aucun réseau spécifié
                      </Text>
                    )}
                  </div>
                  
                  <div>
                    <Text strong>Remarques :</Text>
                    {record.REMARQUES ? (
                      <div style={{ marginTop: 8, padding: 8, background: 'white', borderRadius: 4 }}>
                        {record.REMARQUES}
                      </div>
                    ) : (
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        Aucune remarque
                      </Text>
                    )}
                  </div>
                </div>
              ),
              rowExpandable: (record) => true,
            }}
          />
        </Card>
      </Modal>

      {/* Modal Synchronisation */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CloudSyncOutlined style={{ marginRight: 8 }} />
            <span>Synchronisation</span>
          </div>
        }
        open={syncModal}
        onCancel={() => setSyncModal(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {syncProgress.step > 0 ? (
            <Steps current={syncProgress.step} style={{ marginBottom: 40 }}>
              <Step title="Synchronisation ACE" />
              <Step title="Synchronisation BENEF_POLICE" />
              <Step title="Terminé" />
            </Steps>
          ) : (
            <div style={{ marginBottom: 40 }}>
              <SyncOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              <h3>Sélectionnez le type de synchronisation</h3>
            </div>
          )}
          
          {syncProgress.step > 0 ? (
            <div>
              <p style={{ fontSize: 16, marginBottom: 8 }}>
                <strong>{syncProgress.message}</strong>
              </p>
              {syncProgress.details && (
                <p style={{ color: '#666', marginBottom: 16 }}>
                  {syncProgress.details}
                </p>
              )}
              <Progress
                percent={syncProgress.total > 0 ? 
                  Math.round((syncProgress.current / syncProgress.total) * 100) : 0}
                status="active"
              />
            </div>
          ) : (
            <Radio.Group 
              value={syncType} 
              onChange={(e) => setSyncType(e.target.value)}
              style={{ marginBottom: 20 }}
            >
              <Radio value="ace">Synchronisation ACE uniquement</Radio>
              <Radio value="benef-police">Synchronisation BENEF_POLICE uniquement</Radio>
              <Radio value="full">Synchronisation complète</Radio>
            </Radio.Group>
          )}
          
          <div style={{ marginTop: 20 }}>
            <Button
              onClick={() => setSyncModal(false)}
              style={{ marginRight: 8 }}
              disabled={syncProgress.step > 0}
            >
              Annuler
            </Button>
            <Button
              type="primary"
              loading={loading.main}
              onClick={handleFullSync}
              disabled={syncProgress.step > 0}
            >
              Démarrer la synchronisation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Export */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <DownloadOutlined style={{ marginRight: 8 }} />
            <span>Exporter les données</span>
          </div>
        }
        open={exportModal}
        onCancel={() => setExportModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setExportModal(false)}>
            Annuler
          </Button>,
          <Button
            key="export"
            type="primary"
            loading={loading.export}
            onClick={handleExportData}
            icon={<DownloadOutlined />}
          >
            Exporter
          </Button>
        ]}
      >
        <div style={{ padding: '20px 0' }}>
          <p>Veuillez sélectionner le format d'export :</p>
          <Radio.Group 
            value={exportFormat} 
            onChange={(e) => setExportFormat(e.target.value)}
            style={{ width: '100%' }}
          >
            <Row>
              <Col span={12} style={{ marginBottom: 16 }}>
                <Radio value="excel">
                  <FileExcelOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  Excel (.xlsx)
                </Radio>
              </Col>
              <Col span={12} style={{ marginBottom: 16 }}>
                <Radio value="pdf">
                  <FilePdfOutlined style={{ color: '#f5222d', marginRight: 8 }} />
                  PDF (.pdf)
                </Radio>
              </Col>
              <Col span={12}>
                <Radio value="csv">
                  <FileTextOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                  CSV (.csv)
                </Radio>
              </Col>
              <Col span={12}>
                <Radio value="json">
                  <DatabaseOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                  JSON (.json)
                </Radio>
              </Col>
            </Row>
          </Radio.Group>
          
          <Divider />
          
          <Alert
            message="Informations sur l'export"
            description={
              <div>
                <p>L'export inclura :</p>
                <ul>
                  <li>Tous les bénéficiaires filtrés ({beneficiaires.length})</li>
                  <li>Leurs informations personnelles</li>
                  <li>Leurs polices d'assurance</li>
                  <li>Leurs centres de santé affiliés</li>
                </ul>
              </div>
            }
            type="info"
            showIcon
          />
        </div>
      </Modal>

      {/* Modal Carte Bénéficiaire */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IdcardOutlined style={{ marginRight: 8 }} />
            <span>Carte Bénéficiaire - {selectedBeneficiaireForCard?.NOM_BEN} {selectedBeneficiaireForCard?.PRE_BEN}</span>
          </div>
        }
        open={carteModal}
        onCancel={() => {
          setCarteModal(false);
          setSelectedBeneficiaireForCard(null);
          setCardSide('front');
        }}
        footer={[
          <Button
            key="print"
            icon={<PrinterOutlined />}
            onClick={handlePrintCard}
            style={{ marginRight: 8 }}
          >
            Imprimer
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadCard}
            loading={loading.export}
          >
            Télécharger PDF
          </Button>
        ]}
        width={800}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 20 }}>
            <Radio.Group 
              value={cardSide} 
              onChange={(e) => setCardSide(e.target.value)}
            >
              <Radio.Button value="front">Recto</Radio.Button>
              <Radio.Button value="back">Verso</Radio.Button>
            </Radio.Group>
          </div>
          
          <div 
            id="card-content"
            ref={cardRef}
            style={{
              width: '400px',
              height: '250px',
              margin: '0 auto',
              position: 'relative',
              borderRadius: '15px',
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              backgroundColor: 'white'
            }}
          >
            {selectedBeneficiaireForCard && cardSide === 'front' ? (
              // Front of card
              <div style={{
                width: '100%',
                height: '100%',
                background: `url(${FrontbackgroundCard}) no-repeat center center`,
                backgroundSize: 'cover',
                padding: '20px',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '25px', 
                    overflow: 'hidden',
                    border: '2px solid white'
                  }}>
                    <BeneficiaireAvatar 
                      beneficiaire={selectedBeneficiaireForCard} 
                      size={46}
                    />
                  </div>
                </div>
                
                <div style={{ flex: 1, marginTop: '20px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px', color: '#03104f' }}>
                    {selectedBeneficiaireForCard.NOM_BEN}
                  </div>
                  <div style={{ fontSize: '20px', color: '#03104f' }}>
                    {selectedBeneficiaireForCard.PRE_BEN}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    marginTop: '10px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    padding: '5px 10px',
                    borderRadius: '10px',
                    display: 'inline-block'
                  }}>
                    {selectedBeneficiaireForCard.SEX_BEN === 'M' ? 'MASCULIN' : 'FÉMININ'}
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '10px', opacity: 0.8 }}>MATRICULE</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      {selectedBeneficiaireForCard.IDENTIFIANT_NATIONAL || 'N/A'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', opacity: 0.8 }}>EXPIRATION</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      {moment().add(1, 'year').format('MM/YY')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Back of card
              <div style={{
                width: '100%',
                height: '100%',
                background: `url(${backgroundCard}) no-repeat center center`,
                backgroundSize: 'cover',
                padding: '20px',
                color: '#333',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                  <div style={{ fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>
                    Support Technique
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    +237 690 09 61 97
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    +237 674 29 01 49
                  </div>
                </div>
                
                <div style={{ 
                  fontSize: '8px', 
                  textAlign: 'center',
                  color: '#666',
                  lineHeight: 1.4,
                  marginBottom: '20px'
                }}>
                  Cette carte est la propriété exclusive d'AMS INSURANCE.<br/>
                  En cas de perte ou vol, contactez immédiatement le support.
                </div>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '20px', color: '#666', fontSize: '12px' }}>
            <InfoCircleOutlined /> La carte sera générée en haute résolution pour l'impression
          </div>
        </div>
      </Modal>

      {/* Modal Cartes */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IdcardOutlined style={{ marginRight: 8 }} />
            <span>Cartes de {selectedBeneficiaireForCartes?.NOM_BEN} {selectedBeneficiaireForCartes?.PRE_BEN}</span>
          </div>
        }
        open={cartesModal}
        onCancel={() => {
          setCartesModal(false);
          setSelectedBeneficiaireForCartes(null);
          setCartes([]);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setCartesModal(false);
              setSelectedBeneficiaireForCartes(null);
              setCartes([]);
            }}
          >
            Fermer
          </Button>,
          <Button
            key="new"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenCarteForm()}
          >
            Nouvelle Carte
          </Button>
        ]}
        width={800}
      >
        <Table
          columns={carteColumns}
          dataSource={cartes}
          loading={loading.cartes}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                description="Aucune carte trouvée"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenCarteForm()}
                >
                  Créer une carte
                </Button>
              </Empty>
            )
          }}
        />
      </Modal>

      {/* Modal Formulaire Carte */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {editingCarte ? <EditOutlined /> : <PlusOutlined />}
            <span style={{ marginLeft: 8 }}>
              {editingCarte ? 'Modifier Carte' : 'Nouvelle Carte'}
            </span>
          </div>
        }
        open={showCarteForm}
        onCancel={() => {
          setShowCarteForm(false);
          carteForm.resetFields();
          setEditingCarte(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={carteForm}
          layout="vertical"
          onFinish={handleSaveCarte}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="COD_CAR"
                label="Type de carte"
                rules={[{ required: true, message: 'Veuillez sélectionner le type' }]}
              >
                <Select placeholder="Sélectionner le type">
                  <Option value="PRM">Principale</Option>
                  <Option value="SEC">Secondaire</Option>
                  <Option value="TMP">Temporaire</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="NUM_CAR"
                label="Numéro de carte"
                rules={[{ required: true, message: 'Veuillez saisir le numéro' }]}
              >
                <Input placeholder="Numéro de carte" readOnly />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="DDV_CAR"
                label="Date de début"
                rules={[{ required: true, message: 'Veuillez sélectionner la date de début' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="DFV_CAR"
                label="Date de fin"
                rules={[{ required: true, message: 'Veuillez sélectionner la date de fin' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="STS_CAR"
            label="Statut"
            initialValue={1}
          >
            <Radio.Group>
              <Radio value={1}>Active</Radio>
              <Radio value={0}>Inactive</Radio>
              <Radio value={2}>Suspendue</Radio>
            </Radio.Group>
          </Form.Item>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Button
              onClick={() => {
                setShowCarteForm(false);
                carteForm.resetFields();
                setEditingCarte(null);
              }}
              style={{ marginRight: 8 }}
            >
              Annuler
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading.cartes}
            >
              {editingCarte ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Centres */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MedicineBoxOutlined style={{ marginRight: 8 }} />
            <span>Centres de santé pour {selectedBeneficiaireForCentres?.NOM_BEN} {selectedBeneficiaireForCentres?.PRE_BEN}</span>
          </div>
        }
        open={centresModal}
        onCancel={() => {
          setCentresModal(false);
          setSelectedBeneficiaireForCentres(null);
          setCentres([]);
        }}
        footer={null}
        width={1000}
      >
        <Tabs>
          <TabPane tab="Centres affiliés" key="1">
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCentreForm(true)}
              >
                Nouveau Centre
              </Button>
              <Button
                icon={<SyncOutlined />}
                onClick={() => selectedBeneficiaireForCentres && loadCentres(selectedBeneficiaireForCentres.ID_BEN)}
                loading={loading.centres}
                style={{ marginLeft: 8 }}
              >
                Actualiser
              </Button>
            </div>
            
            <Table
              columns={centreColumns}
              dataSource={centres}
              loading={loading.centres}
              pagination={false}
              locale={{
                emptyText: (
                  <Empty
                    description="Aucun centre affilié"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <p style={{ marginBottom: 16 }}>Ce bénéficiaire n'est affilié à aucun centre de santé.</p>
                    <Button
                      type="primary"
                      onClick={() => {
                        // Ouvrir la liste des centres disponibles
                        Modal.info({
                          title: 'Centres disponibles',
                          content: (
                            <div>
                              <p>Sélectionnez un centre de santé à affilier :</p>
                              <List
                                dataSource={allCentres.slice(0, 10)}
                                renderItem={centre => (
                                  <List.Item
                                    actions={[
                                      <Button
                                        key="assign"
                                        type="link"
                                        onClick={() => handleAssignCentre(centre)}
                                      >
                                        Affilier
                                      </Button>
                                    ]}
                                  >
                                    <List.Item.Meta
                                      title={centre.NOM_CENTRE}
                                      description={`${centre.TYPE_CENTRE} - ${centre.ADRESSE}`}
                                    />
                                  </List.Item>
                                )}
                              />
                            </div>
                          ),
                          width: 600,
                        });
                      }}
                    >
                      Affilier un centre
                    </Button>
                  </Empty>
                )
              }}
            />
          </TabPane>
          
          <TabPane tab="Centres disponibles" key="2">
            <Table
              columns={[
                {
                  title: 'Nom',
                  dataIndex: 'NOM_CENTRE',
                  key: 'NOM_CENTRE',
                  width: 200,
                },
                {
                  title: 'Type',
                  dataIndex: 'TYPE_CENTRE',
                  key: 'TYPE_CENTRE',
                  width: 120,
                },
                {
                  title: 'Adresse',
                  dataIndex: 'ADRESSE',
                  key: 'ADRESSE',
                  width: 200,
                },
                {
                  title: 'Téléphone',
                  dataIndex: 'TELEPHONE',
                  key: 'TELEPHONE',
                  width: 120,
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  width: 100,
                  render: (_, record) => (
                    <Button
                      type="link"
                      onClick={() => handleAssignCentre(record)}
                    >
                      Affilier
                    </Button>
                  ),
                },
              ]}
              dataSource={allCentres}
              pagination={{ pageSize: 5 }}
              rowKey="ID_CENTRE"
            />
          </TabPane>
        </Tabs>
      </Modal>

           {/* Modal Formulaire Centre */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {editingCentre ? <EditOutlined /> : <PlusOutlined />}
            <span style={{ marginLeft: 8 }}>
              {editingCentre ? 'Modifier Centre' : 'Nouveau Centre de Santé'}
            </span>
          </div>
        }
        open={showCentreForm}
        onCancel={() => {
          setShowCentreForm(false);
          centreForm.resetFields();
          setEditingCentre(null);
        }}
        footer={null}
        width={700}
      >
        <Form
          form={centreForm}
          layout="vertical"
          onFinish={handleSaveCentre}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="CODE_CENTRE"
                label="Code du centre"
                rules={[{ required: true, message: 'Veuillez saisir le code' }]}
              >
                <Input placeholder="Ex: HOP-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="TYPE_CENTRE"
                label="Type de centre"
                rules={[{ required: true, message: 'Veuillez sélectionner le type' }]}
                initialValue="HOPITAL"
              >
                <Select placeholder="Sélectionner le type">
                  <Option value="HOPITAL">Hôpital</Option>
                  <Option value="CLINIQUE">Clinique</Option>
                  <Option value="LABORATOIRE">Laboratoire</Option>
                  <Option value="PHARMACIE">Pharmacie</Option>
                  <Option value="CENTRE_SANTE">Centre de Santé</Option>
                  <Option value="CABINET_MEDICAL">Cabinet Médical</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="NOM_CENTRE"
            label="Nom du centre"
            rules={[{ required: true, message: 'Veuillez saisir le nom' }]}
          >
            <Input placeholder="Nom complet du centre" />
          </Form.Item>

          <Form.Item
            name="ADRESSE"
            label="Adresse"
            rules={[{ required: true, message: 'Veuillez saisir l\'adresse' }]}
          >
            <Input.TextArea rows={2} placeholder="Adresse complète" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="TELEPHONE"
                label="Téléphone"
                rules={[{ required: true, message: 'Veuillez saisir le téléphone' }]}
              >
                <Input placeholder="Téléphone du centre" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="EMAIL"
                label="Email"
                rules={[{ type: 'email', message: 'Email invalide' }]}
              >
                <Input placeholder="Email du centre" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="SPECIALITES"
            label="Spécialités"
            tooltip="Sélectionnez les spécialités disponibles dans ce centre"
          >
            <Select
              mode="multiple"
              placeholder="Sélectionnez les spécialités"
              allowClear
            >
              <Option value="MEDECINE_GENERALE">Médecine Générale</Option>
              <Option value="PEDIATRIE">Pédiatrie</Option>
              <Option value="GYNECOLOGIE">Gynécologie</Option>
              <Option value="CHIRURGIE">Chirurgie</Option>
              <Option value="RADIOLOGIE">Radiologie</Option>
              <Option value="LABORATOIRE">Laboratoire</Option>
              <Option value="PHARMACIE">Pharmacie</Option>
              <Option value="DENTAIRE">Dentaire</Option>
              <Option value="OPHTALMOLOGIE">Ophtalmologie</Option>
              <Option value="CARDIOLOGIE">Cardiologie</Option>
              <Option value="DERMATOLOGIE">Dermatologie</Option>
              <Option value="PSYCHIATRIE">Psychiatrie</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="CONVENTIONNE"
                label="Conventionné"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="Oui" unCheckedChildren="Non" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="STATUT_CENTRE"
                label="Statut"
                initialValue="ACTIF"
              >
                <Select>
                  <Option value="ACTIF">Actif</Option>
                  <Option value="INACTIF">Inactif</Option>
                  <Option value="EN_CONSTRUCTION">En construction</Option>
                  <Option value="EN_RENOVATION">En rénovation</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Button
              onClick={() => {
                setShowCentreForm(false);
                centreForm.resetFields();
                setEditingCentre(null);
              }}
              style={{ marginRight: 8 }}
            >
              Annuler
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading.centres}
            >
              {editingCentre ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Autres modales restantes */}
      {syncProgress.step > 0 && (
        <Modal
          title="Synchronisation en cours"
          open={syncProgress.step > 0}
          closable={false}
          footer={null}
        >
          <Steps current={syncProgress.step} style={{ marginBottom: 20 }}>
            <Step title="ACE" />
            <Step title="BENEF_POLICE" />
            <Step title="Terminé" />
          </Steps>
          <Progress percent={Math.round((syncProgress.current / syncProgress.total) * 100)} />
          <p style={{ marginTop: 20, textAlign: 'center' }}>
            {syncProgress.message}
            <br />
            {syncProgress.details && (
              <small style={{ color: '#666' }}>{syncProgress.details}</small>
            )}
          </p>
        </Modal>
      )}

      {/* Modal pour prévisualisation de photo */}
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <img alt="Prévisualisation" style={{ width: '100%' }} src={previewImage} />
      </Modal>
      </div>
    );
  };

export default Beneficiaires;