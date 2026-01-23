import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
  Tooltip,
  LinearProgress,
  InputAdornment,
  TablePagination,
  Menu,
  Divider,
  FormHelperText,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Collapse,
  AlertTitle,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  BeachAccess as BeachAccessIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  SortByAlpha as SortByAlphaIcon,
  LocalHospital as HospitalIcon,
  Warning as WarningIcon,
  Public as PublicIcon,
  Sync as SyncIcon,
  Business as BusinessIcon,
  EventAvailable as EventAvailableIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  FilterAlt as FilterAltIcon,
  FilterAltOff as FilterAltOffIcon,
  Info as InfoIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  SyncProblem as SyncProblemIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

import { prestatairesAPI, centresAPI, paysAPI, syncAPI } from '../../services/api';

// ==============================================
// CONSTANTES ET CONFIGURATION
// ==============================================
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_ROWS_PER_PAGE = 25;
const DEFAULT_SORT_FIELD = 'nom';
const DEFAULT_SORT_DIRECTION = 'asc';

// Types de prestataires basés sur la table PRESTATAIRE
const TYPES_PRESTATAIRE = [
  'Médecin',
  'Infirmier',
  'Kinésithérapeute',
  'Sage-femme',
  'Pharmacien',
  'Technicien de laboratoire',
  'Aide-soignant',
  'Radiologue',
  'Chirurgien',
  'Pédiatre',
  'Gynécologue',
  'Cardiologue',
  'Neurologue',
  'Dermatologue',
  'Ophtalmologue',
  'ORL',
  'Dentiste',
  'Psychologue',
  'Psychiatre',
  'Nutritionniste',
  'Diététicien',
  'Ergothérapeute',
  'Orthophoniste',
  'Podologue',
  'Ostéopathe',
  'Ambulancier',
  'Manipulateur en électroradiologie',
  'Biologiste',
  'Pharmacien assistant',
  'Autre'
];

// Statuts de disponibilité basés sur la table PRESTATAIRE
const STATUTS_DISPONIBILITE = [
  'Disponible',
  'En congé',
  'Indisponible',
  'En formation',
  'En mission',
  'En arrêt maladie',
  'En consultation',
  'En intervention',
  'En réunion',
  'En déplacement',
  'En standby',
  'En repos'
];

// Langues parlées
const LANGUES = [
  'Français',
  'Anglais',
  'Espagnol',
  'Arabe',
  'Portugais',
  'Allemand',
  'Italien',
  'Russe',
  'Chinois',
  'Japonais',
  'Coréen',
  'Turc',
  'Persan',
  'Swahili',
  'Lingala',
  'Wolof',
  'Autre'
];

// Titres professionnels
const TITRES_PROFESSIONNELS = [
  'Docteur',
  'Professeur',
  'Chargé de cours',
  'Maître de conférences',
  'Interne',
  'Externe',
  'Chef de service',
  'Chef de clinique',
  'Assistant',
  'Spécialiste',
  'Généraliste',
  'Praticien hospitalier',
  'Directeur',
  'Coordinateur',
  'Superviseur',
  'Formateur',
  'Expert',
  'Consultant',
  'Autre'
];

// Spécialités médicales
const SPECIALITES_MEDICALES = [
  'Médecine générale',
  'Cardiologie',
  'Dermatologie',
  'Endocrinologie',
  'Gastro-entérologie',
  'Gynécologie',
  'Hématologie',
  'Néphrologie',
  'Neurologie',
  'Ophtalmologie',
  'ORL',
  'Pédiatrie',
  'Pneumologie',
  'Psychiatrie',
  'Radiologie',
  'Rhumatologie',
  'Urologie',
  'Chirurgie générale',
  'Chirurgie orthopédique',
  'Chirurgie plastique',
  'Anesthésiologie',
  'Médecine d\'urgence',
  'Médecine du travail',
  'Médecine légale',
  'Médecine nucléaire',
  'Oncologie',
  'Pédopsychiatrie',
  'Réanimation',
  'Soins intensifs',
  'Traumatologie'
];

// ==============================================
// UTILS - FONCTIONS UTILITAIRES
// ==============================================
/**
 * Normalise les données de pays pour un usage cohérent dans l'application
 */
const normalizePaysData = (paysList) => {
  if (!Array.isArray(paysList)) return [];
  
  return paysList.map(p => ({
    COD_PAY: p.COD_PAY || p.code || p.id || p.value,
    LIB_PAY: p.LIB_PAY || p.nom || p.label || p.name,
    CODE_TELEPHONE: p.CODE_TELEPHONE || p.code_telephone,
    // Conserver toutes les propriétés originales
    ...p
  }));
};

// Utilisez-la dans chargerPays
const chargerPays = async () => {
  try {
    const response = await paysAPI.getAll();
    
    if (response.success) {
      const paysList = response.data || response.pays || [];
      const normalizedPays = normalizePaysData(paysList);
      setPays(normalizedPays);
      
      if (normalizedPays.length === 0) {
        showNotification(
          'Aucun pays configuré. Veuillez configurer les pays avant d\'ajouter des prestataires.',
          'warning'
        );
      }
    } else {
      setPays([]);
      showNotification('Erreur lors du chargement des pays', 'error');
    }
  } catch (error) {
    console.error('Erreur chargement pays:', error);
    setPays([]);
    showNotification('Impossible de charger la liste des pays', 'error');
  }
};

/**
 * Normalise le statut selon la BD (1/0 ou Actif/Inactif)
 */
const normalizeStatus = (status) => {
  if (status === undefined || status === null) return 'Actif';
  
  if (status === 1 || status === '1' || status === true || 
      status.toString().toLowerCase() === 'actif') {
    return 'Actif';
  }
  
  if (status === 0 || status === '0' || status === false || 
      status.toString().toLowerCase() === 'inactif') {
    return 'Inactif';
  }
  
  return 'Actif';
};

/**
 * Vérifie si un prestataire est actif selon la BD
 */
const isPrestataireActif = (prestataire) => {
  if (!prestataire) return false;
  
  const actif = prestataire.actif ?? prestataire.ACTIF;
  const status = prestataire.status ?? prestataire.STATUS;
  
  if (actif !== undefined && actif !== null) {
    if (typeof actif === 'number') return actif === 1;
    if (typeof actif === 'string') return actif === '1' || actif.toLowerCase() === 'actif';
    if (typeof actif === 'boolean') return actif;
  }
  
  if (status !== undefined && status !== null) {
    return normalizeStatus(status) === 'Actif';
  }
  
  return true;
};

/**
 * Formatage des dates
 */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('fr-FR');
  } catch (error) {
    return dateString;
  }
};

/**
 * Formatage des dates avec heure
 */
const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleString('fr-FR');
  } catch (error) {
    return dateString;
  }
};

/**
 * Validation d'email
 */
const isValidEmail = (email) => {
  if (!email || email.trim() === '') return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validation de téléphone
 */
const isValidPhone = (phone) => {
  if (!phone || phone.trim() === '') return true;
  const phoneRegex = /^[\d\s+\-().]{6,20}$/;
  return phoneRegex.test(phone);
};

/**
 * Validation de numéro de licence
 */
const isValidNumLicence = (numLicence) => {
  if (!numLicence || numLicence.trim() === '') return true;
  const licenceRegex = /^[A-Za-z0-9\-]{5,20}$/;
  return licenceRegex.test(numLicence);
};

/**
 * Validation de numéro d'ordre
 */
const isValidNumOrdre = (numOrdre) => {
  if (!numOrdre || numOrdre.trim() === '') return true;
  const ordreRegex = /^[0-9]{1,10}$/;
  return ordreRegex.test(numOrdre);
};

/**
 * Obtient le libellé du pays à partir du code
 */
/**
 * Obtient le libellé du pays à partir du code
 */
const getPaysLabel = (codPay, paysList) => {
  if (!codPay || !paysList || !Array.isArray(paysList)) return codPay || '';
  
  const pays = paysList.find(p => 
    p.COD_PAY === codPay || 
    p.code === codPay || 
    p.value === codPay ||
    p.id === codPay ||
    (p.CODE_TELEPHONE && p.CODE_TELEPHONE === codPay)
  );
  
  return pays ? (pays.LIB_PAY || pays.nom || pays.label || pays.name || pays.COD_PAY || codPay) : codPay;
};

/**
 * Obtient le nom du centre à partir du code
 */
const getCentreLabel = (codCen, centresList) => {
  if (!codCen || !centresList) return codCen || '';
  const centre = centresList.find(c => c.COD_CEN === codCen || c.id === codCen);
  return centre ? (centre.NOM_CENTRE || centre.nom || centre.label || centre.name || codCen) : codCen;
};

// ==============================================
// COMPOSANTS RÉUTILISABLES
// ==============================================

/**
 * Carte de statistiques
 */
const StatCard = React.memo(({ title, value, icon: Icon, color, subtitle, onClick, loading = false }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        borderRadius: 3,
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          cursor: onClick ? 'pointer' : 'default'
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <CircularProgress size={40} sx={{ my: 1 }} />
            ) : (
              <>
                <Typography variant="h4" component="div" sx={{ fontWeight: 800, mb: 1 }}>
                  {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
                </Typography>
                {subtitle && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {subtitle}
                  </Typography>
                )}
              </>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ml: 2
            }}
          >
            <Icon />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

/**
 * Chip de statut
 */
const StatusChip = React.memo(({ prestataire }) => {
  if (!prestataire) return null;
  
  const isActif = isPrestataireActif(prestataire);
  
  return isActif ? (
    <Chip
      icon={<CheckCircleIcon fontSize="small" />}
      label="Actif"
      color="success"
      size="small"
      sx={{ fontWeight: 600, borderRadius: 1.5 }}
    />
  ) : (
    <Chip
      icon={<BlockIcon fontSize="small" />}
      label="Inactif"
      color="error"
      size="small"
      sx={{ fontWeight: 600, borderRadius: 1.5 }}
    />
  );
});

StatusChip.displayName = 'StatusChip';

/**
 * Chip de disponibilité
 */
const DisponibiliteChip = React.memo(({ disponibilite }) => {
  if (!disponibilite) return null;
  
  const getChipProps = () => {
    switch (disponibilite) {
      case 'Disponible':
        return { color: 'success', icon: <CheckCircleIcon /> };
      case 'En congé':
        return { color: 'warning', icon: <BeachAccessIcon /> };
      case 'En formation':
        return { color: 'info', icon: <SchoolIcon /> };
      case 'En arrêt maladie':
        return { color: 'error', icon: <HospitalIcon /> };
      case 'En mission':
        return { color: 'primary', icon: <BusinessIcon /> };
      case 'Indisponible':
        return { color: 'default', icon: <BlockIcon /> };
      default:
        return { color: 'default', icon: <InfoIcon /> };
    }
  };
  
  const { color, icon } = getChipProps();
  
  return (
    <Chip
      icon={icon}
      label={disponibilite}
      color={color}
      size="small"
      sx={{ fontWeight: 500, borderRadius: 1.5 }}
    />
  );
});

DisponibiliteChip.displayName = 'DisponibiliteChip';

/**
 * Section de formulaire pliable
 */
const CollapsibleSection = ({ title, children, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <Paper sx={{ mb: 3, overflow: 'hidden' }}>
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          {title}
        </Typography>
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Box>
      <Collapse in={expanded}>
        <Box p={3}>
          {children}
        </Box>
      </Collapse>
    </Paper>
  );
};

// ==============================================
// MODALES AMÉLIORÉES
// ==============================================

/**
 * Modale d'ajout de prestataire - COMPLÈTE
 */
const AjouterPrestataireModal = ({ 
  open, 
  onClose, 
  onSave, 
  centres, 
  specialites, 
  pays, 
  loading 
}) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Informations personnelles
    type_prestataire: 'Médecin',
    nom: '',
    prenom: '',
    specialite: '',
    titre: '',
    
    // Informations professionnelles
    num_licence: '',
    num_ordre: '',
    date_obtention_licence: null,
    date_expiration_licence: null,
    universite_formation: '',
    annee_diplome: '',
    experience_annee: 0,
    
    // Informations de contact
    telephone: '',
    email: '',
    
    // Localisation
    cod_cen: '',
    centre_pratique: '',
    cod_pay: '',
    num_adr: '',
    
    // Tarification
    honoraires: '',
    
    // Autres
    langue_parlee: 'Français',
    disponibilite: 'Disponible',
    actif: 1
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

 // Calcul des options de pays à partir de la prop pays
const paysOptions = useMemo(() => {
  if (!pays || !Array.isArray(pays) || pays.length === 0) return [];
  
  return pays.map(p => ({
    value: p.COD_PAY || p.code || p.id || p.value,
    label: p.LIB_PAY || p.nom || p.label || p.name || p.COD_PAY,
    code_telephone: p.CODE_TELEPHONE || p.code_telephone || ''
  })).filter(p => p.value && p.label); // Filtrer les entrées invalides
}, [pays]);

  // Effet pour initialiser le formulaire
 useEffect(() => {
  if (open) {
    // Initialiser le formulaire avec les valeurs par défaut
    const firstPaysValue = paysOptions.length > 0 ? paysOptions[0].value : '';
    
    const newFormData = {
      type_prestataire: 'Médecin',
      nom: '',
      prenom: '',
      specialite: '',
      titre: '',
      num_licence: '',
      num_ordre: '',
      date_obtention_licence: null,
      date_expiration_licence: null,
      universite_formation: '',
      annee_diplome: '',
      experience_annee: 0,
      telephone: '',
      email: '',
      cod_cen: '',
      centre_pratique: '',
      cod_pay: firstPaysValue, // Utiliser la valeur du premier pays
      num_adr: '',
      honoraires: '',
      langue_parlee: 'Français',
      disponibilite: 'Disponible',
      actif: 1
    };
    setFormData(newFormData);
    setErrors({});
    setTouched({});
    setActiveStep(0);
  }
}, [open, paysOptions]); // Note: nous dépendons de paysOptions pour l'initialisation

  const steps = [
    'Informations personnelles',
    'Informations professionnelles',
    'Contact et localisation',
    'Validation'
  ];

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateField = (field, value) => {
    let error = '';
    
    switch (field) {
      case 'nom':
        if (!value?.trim()) {
          error = 'Le nom est obligatoire';
        } else if (value.trim().length < 2) {
          error = 'Le nom doit contenir au moins 2 caractères';
        }
        break;
        
      case 'prenom':
        if (!value?.trim()) {
          error = 'Le prénom est obligatoire';
        } else if (value.trim().length < 2) {
          error = 'Le prénom doit contenir au moins 2 caractères';
        }
        break;
        
      case 'specialite':
        if (!value?.trim()) {
          error = 'La spécialité est obligatoire';
        }
        break;
        
      case 'cod_pay':
        if (!value || value.trim() === '') {
          error = 'Le pays est obligatoire';
        }
        break;
        
      case 'email':
        if (value && value.trim() !== '' && !isValidEmail(value)) {
          error = 'Format d\'email invalide';
        }
        break;
        
      case 'telephone':
        if (value && value.trim() !== '' && !isValidPhone(value)) {
          error = 'Format de téléphone invalide';
        }
        break;
        
      case 'num_licence':
        if (value && value.trim() !== '' && !isValidNumLicence(value)) {
          error = 'Format de numéro de licence invalide';
        }
        break;
        
      case 'num_ordre':
        if (value && value.trim() !== '' && !isValidNumOrdre(value)) {
          error = 'Format de numéro d\'ordre invalide';
        }
        break;
        
      case 'experience_annee':
        if (value && (isNaN(parseInt(value)) || parseInt(value) < 0 || parseInt(value) > 60)) {
          error = 'Doit être un nombre entre 0 et 60';
        }
        break;
        
      case 'honoraires':
        if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
          error = 'Doit être un nombre positif';
        }
        break;
        
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateStep = (step) => {
    let isValid = true;
    const newErrors = {};
    
    switch (step) {
      case 0: // Informations personnelles
        ['nom', 'prenom', 'specialite'].forEach(field => {
          if (!validateField(field, formData[field])) {
            newErrors[field] = errors[field] || 'Ce champ est obligatoire';
            isValid = false;
          }
        });
        break;
        
      case 1: // Informations professionnelles
        if (formData.num_licence && !isValidNumLicence(formData.num_licence)) {
          newErrors.num_licence = 'Format de licence invalide';
          isValid = false;
        }
        if (formData.num_ordre && !isValidNumOrdre(formData.num_ordre)) {
          newErrors.num_ordre = 'Format de numéro d\'ordre invalide';
          isValid = false;
        }
        break;
        
      case 2: // Contact et localisation
        if (!formData.cod_pay || formData.cod_pay.trim() === '') {
          newErrors.cod_pay = 'Le pays est obligatoire';
          isValid = false;
        }
        if (formData.email && !isValidEmail(formData.email)) {
          newErrors.email = 'Format d\'email invalide';
          isValid = false;
        }
        if (formData.telephone && !isValidPhone(formData.telephone)) {
          newErrors.telephone = 'Format de téléphone invalide';
          isValid = false;
        }
        break;
        
      case 3: // Validation - pas de validation spécifique
        break;
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    const newValue = type === 'number' 
      ? value === '' ? '' : parseFloat(value)
      : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'actif' ? (value === '1' ? 1 : 0) : newValue
    }));
    
    if (touched[name]) {
      validateField(name, newValue);
    }
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
    
    if (touched[name]) {
      validateField(name, date);
    }
  };

  const handleSubmit = async () => {
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      setActiveStep(0);
      return;
    }

    try {
      if (!formData.cod_pay || formData.cod_pay.trim() === '') {
        setErrors(prev => ({ ...prev, cod_pay: 'Le pays est obligatoire' }));
        return;
      }

      const dataToSend = {
        type_prestataire: formData.type_prestataire,
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        specialite: formData.specialite.trim(),
        titre: formData.titre?.trim() || null,
        num_licence: formData.num_licence?.trim() || null,
        num_ordre: formData.num_ordre?.trim() || null,
        date_obtention_licence: formData.date_obtention_licence || null,
        date_expiration_licence: formData.date_expiration_licence || null,
        universite_formation: formData.universite_formation?.trim() || null,
        annee_diplome: formData.annee_diplome?.trim() || null,
        experience_annee: formData.experience_annee ? parseInt(formData.experience_annee) : 0,
        telephone: formData.telephone?.trim() || null,
        email: formData.email?.trim() || null,
        cod_cen: formData.cod_cen || null,
        centre_pratique: formData.centre_pratique?.trim() || null,
        cod_pay: formData.cod_pay.trim(),
        num_adr: formData.num_adr?.trim() || null,
        honoraires: formData.honoraires ? parseFloat(formData.honoraires) : null,
        langue_parlee: formData.langue_parlee,
        disponibilite: formData.disponibilite,
        actif: formData.actif
      };

      await onSave(dataToSend);
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      throw error;
    }
  };

  const getError = (field) => {
    return touched[field] ? errors[field] : '';
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom *"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                onBlur={() => handleBlur('nom')}
                error={!!getError('nom')}
                helperText={getError('nom')}
                disabled={loading}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prénom *"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                onBlur={() => handleBlur('prenom')}
                error={!!getError('prenom')}
                helperText={getError('prenom')}
                disabled={loading}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!getError('specialite')} required>
                <InputLabel>Spécialité *</InputLabel>
                <Select
                  name="specialite"
                  value={formData.specialite}
                  onChange={handleChange}
                  onBlur={() => handleBlur('specialite')}
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Sélectionner une spécialité</em>
                  </MenuItem>
                  {specialites.map((spec, index) => (
                    <MenuItem key={`spec-${index}`} value={spec}>
                      {spec}
                    </MenuItem>
                  ))}
                </Select>
                {getError('specialite') && (
                  <FormHelperText>{getError('specialite')}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type de prestataire</InputLabel>
                <Select
                  name="type_prestataire"
                  value={formData.type_prestataire}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {TYPES_PRESTATAIRE.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Titre professionnel</InputLabel>
                <Select
                  name="titre"
                  value={formData.titre}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Sélectionner un titre</em>
                  </MenuItem>
                  {TITRES_PROFESSIONNELS.map(titre => (
                    <MenuItem key={titre} value={titre}>
                      {titre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Numéro de licence"
                name="num_licence"
                value={formData.num_licence}
                onChange={handleChange}
                onBlur={() => handleBlur('num_licence')}
                error={!!getError('num_licence')}
                helperText={getError('num_licence')}
                disabled={loading}
                placeholder="Ex: MED12345"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Numéro d'ordre"
                name="num_ordre"
                value={formData.num_ordre}
                onChange={handleChange}
                onBlur={() => handleBlur('num_ordre')}
                error={!!getError('num_ordre')}
                helperText={getError('num_ordre')}
                disabled={loading}
                placeholder="Ex: 123456"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DatePicker
                  label="Date d'obtention de licence"
                  value={formData.date_obtention_licence}
                  onChange={(date) => handleDateChange('date_obtention_licence', date)}
                  disabled={loading}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DatePicker
                  label="Date d'expiration de licence"
                  value={formData.date_expiration_licence}
                  onChange={(date) => handleDateChange('date_expiration_licence', date)}
                  disabled={loading}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDate={formData.date_obtention_licence || new Date()}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Université de formation"
                name="universite_formation"
                value={formData.universite_formation}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Année de diplôme"
                name="annee_diplome"
                value={formData.annee_diplome}
                onChange={handleChange}
                disabled={loading}
                placeholder="Ex: 2015"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expérience (années)"
                name="experience_annee"
                type="number"
                value={formData.experience_annee}
                onChange={handleChange}
                onBlur={() => handleBlur('experience_annee')}
                error={!!getError('experience_annee')}
                helperText={getError('experience_annee')}
                disabled={loading}
                inputProps={{ min: 0, max: 60 }}
              />
            </Grid>
          </Grid>
        );
        
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Téléphone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                onBlur={() => handleBlur('telephone')}
                error={!!getError('telephone')}
                helperText={getError('telephone')}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                error={!!getError('email')}
                helperText={getError('email')}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Centre de pratique</InputLabel>
                <Select
                  name="cod_cen"
                  value={formData.cod_cen}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Sélectionner un centre</em>
                  </MenuItem>
                  {centres.map(centre => (
                    <MenuItem key={centre.COD_CEN || centre.id} value={centre.COD_CEN || centre.id}>
                      {centre.NOM_CENTRE || centre.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lieu de pratique"
                name="centre_pratique"
                value={formData.centre_pratique}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!getError('cod_pay')} required>
                <InputLabel>Pays *</InputLabel>
                <Select
                  name="cod_pay"
                  value={formData.cod_pay || ''}
                  onChange={handleChange}
                  onBlur={() => handleBlur('cod_pay')}
                  disabled={loading || paysOptions.length === 0}
                >
                  {paysOptions.length === 0 ? (
                    <MenuItem disabled value="">
                      <em>Chargement des pays...</em>
                    </MenuItem>
                  ) : (
                    <>
                      <MenuItem value="">
                        <em>Sélectionner un pays</em>
                      </MenuItem>
                      {paysOptions.map(p => (
                        <MenuItem key={p.value} value={p.value}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <PublicIcon fontSize="small" />
                            <span>{p.label}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </>
                  )}
                </Select>
                {getError('cod_pay') && (
                  <FormHelperText error>{getError('cod_pay')}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Numéro d'adresse"
                name="num_adr"
                value={formData.num_adr}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Honoraires (FCFA)"
                name="honoraires"
                type="number"
                value={formData.honoraires}
                onChange={handleChange}
                onBlur={() => handleBlur('honoraires')}
                error={!!getError('honoraires')}
                helperText={getError('honoraires')}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography variant="caption">FCFA</Typography>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Langue parlée</InputLabel>
                <Select
                  name="langue_parlee"
                  value={formData.langue_parlee}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {LANGUES.map(langue => (
                    <MenuItem key={langue} value={langue}>
                      {langue}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Disponibilité</InputLabel>
                <Select
                  name="disponibilite"
                  value={formData.disponibilite}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {STATUTS_DISPONIBILITE.map(statut => (
                    <MenuItem key={statut} value={statut}>
                      {statut}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
        
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              Récapitulatif
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Informations personnelles
                  </Typography>
                  <Typography variant="body2">
                    <strong>Nom:</strong> {formData.nom}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Prénom:</strong> {formData.prenom}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Spécialité:</strong> {formData.specialite}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {formData.type_prestataire}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Informations professionnelles
                  </Typography>
                  <Typography variant="body2">
                    <strong>Licence:</strong> {formData.num_licence || 'Non renseigné'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Expérience:</strong> {formData.experience_annee} ans
                  </Typography>
                  <Typography variant="body2">
                    <strong>Disponibilité:</strong> {formData.disponibilite}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contact et localisation
                  </Typography>
                  <Typography variant="body2">
                    <strong>Téléphone:</strong> {formData.telephone || 'Non renseigné'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {formData.email || 'Non renseigné'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Pays:</strong> {getPaysLabel(formData.cod_pay, paysOptions)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Centre:</strong> {formData.cod_cen ? getCentreLabel(formData.cod_cen, centres) : 'Non renseigné'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Box mt={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.actif === 1}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      actif: e.target.checked ? 1 : 0 
                    }))}
                    disabled={loading}
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {formData.actif === 1 ? (
                      <>
                        <CheckCircleIcon color="success" fontSize="small" />
                        <Typography>Actif</Typography>
                      </>
                    ) : (
                      <>
                        <BlockIcon color="error" fontSize="small" />
                        <Typography>Inactif</Typography>
                      </>
                    )}
                  </Box>
                }
              />
            </Box>
          </Box>
        );
        
      default:
        return 'Étape inconnue';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: theme.palette.primary.main,
        color: 'white',
        py: 2
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <AddIcon />
          <Typography variant="h6" fontWeight="bold">
            Ajouter un nouveau prestataire
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ py: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
              <StepContent>
                {getStepContent(index)}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Box>
            {activeStep > 0 && (
              <Button 
                onClick={handleBack} 
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Retour
              </Button>
            )}
          </Box>
          
          <Box>
            <Button 
              onClick={onClose} 
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleNext} 
              variant="contained" 
              color="primary"
              disabled={loading || paysOptions.length === 0}
              startIcon={activeStep === steps.length - 1 ? <AddIcon /> : <ChevronRightIcon />}
            >
              {activeStep === steps.length - 1 
                ? (loading ? 'Enregistrement...' : 'Enregistrer') 
                : 'Suivant'}
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Modale de modification de prestataire - COMPLÈTE
 */
const ModifierPrestataireModal = ({ 
  open, 
  onClose, 
  onSave, 
  prestataire, 
  centres, 
  specialites, 
  pays, 
  loading 
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [initialized, setInitialized] = useState(false);
  
  // Calcul des options de pays à partir de la prop pays
  const paysOptions = useMemo(() => {
    if (!pays || pays.length === 0) return [];
    return pays.map(p => ({
      value: p.COD_PAY || p.code || p.id,
      label: p.LIB_PAY || p.nom || p.label || p.COD_PAY || p.name
    }));
  }, [pays]);

  // Effet pour initialiser le formulaire
useEffect(() => {
  if (open && prestataire && paysOptions.length > 0) {
    const codPayValue = prestataire.cod_pay || prestataire.COD_PAY || '';
    
    // Vérifier si le cod_pay du prestataire existe dans paysOptions
    const paysExiste = paysOptions.some(p => p.value === codPayValue);
    
    setFormData({
      type_prestataire: prestataire.type_prestataire || 'Médecin',
      nom: prestataire.nom || '',
      prenom: prestataire.prenom || '',
      specialite: prestataire.specialite || '',
      titre: prestataire.titre || '',
      num_licence: prestataire.num_licence || '',
      num_ordre: prestataire.num_ordre || '',
      date_obtention_licence: prestataire.date_obtention_licence || null,
      date_expiration_licence: prestataire.date_expiration_licence || null,
      universite_formation: prestataire.universite_formation || '',
      annee_diplome: prestataire.annee_diplome || '',
      experience_annee: prestataire.experience_annee || 0,
      telephone: prestataire.telephone || '',
      email: prestataire.email || '',
      cod_cen: prestataire.cod_cen || '',
      centre_pratique: prestataire.centre_pratique || '',
      // Si le pays existe, on l'utilise, sinon premier de la liste
      cod_pay: paysExiste ? codPayValue : (paysOptions[0]?.value || ''),
      num_adr: prestataire.num_adr || '',
      honoraires: prestataire.honoraires || '',
      langue_parlee: prestataire.langue_parlee || 'Français',
      disponibilite: prestataire.disponibilite || 'Disponible',
      actif: isPrestataireActif(prestataire) ? 1 : 0
    });
    
    setErrors({});
    setTouched({});
    setInitialized(true);
  }
}, [open, prestataire, paysOptions]);

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateField = (field, value) => {
    let error = '';
    
    switch (field) {
      case 'nom':
        if (!value?.trim()) {
          error = 'Le nom est obligatoire';
        } else if (value.trim().length < 2) {
          error = 'Le nom doit contenir au moins 2 caractères';
        }
        break;
        
      case 'prenom':
        if (!value?.trim()) {
          error = 'Le prénom est obligatoire';
        } else if (value.trim().length < 2) {
          error = 'Le prénom doit contenir au moins 2 caractères';
        }
        break;
        
      case 'specialite':
        if (!value?.trim()) {
          error = 'La spécialité est obligatoire';
        }
        break;
        
      case 'cod_pay':
        if (!value || value.trim() === '') {
          error = 'Le pays est obligatoire';
        }
        break;
        
      case 'email':
        if (value && value.trim() !== '' && !isValidEmail(value)) {
          error = 'Format d\'email invalide';
        }
        break;
        
      case 'telephone':
        if (value && value.trim() !== '' && !isValidPhone(value)) {
          error = 'Format de téléphone invalide';
        }
        break;
        
      case 'num_licence':
        if (value && value.trim() !== '' && !isValidNumLicence(value)) {
          error = 'Format de numéro de licence invalide';
        }
        break;
        
      case 'num_ordre':
        if (value && value.trim() !== '' && !isValidNumOrdre(value)) {
          error = 'Format de numéro d\'ordre invalide';
        }
        break;
        
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateForm = () => {
    const requiredFields = ['nom', 'prenom', 'specialite', 'cod_pay'];
    let isValid = true;
    const newErrors = {};
    
    requiredFields.forEach(field => {
      if (!validateField(field, formData[field])) {
        newErrors[field] = errors[field] || 'Ce champ est obligatoire';
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'actif' ? (value === '1' ? 1 : 0) : value
    }));
    
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleSubmit = async () => {
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    if (!validateForm()) return;

    try {
      if (!formData.cod_pay || formData.cod_pay.trim() === '') {
        setErrors(prev => ({ ...prev, cod_pay: 'Le pays est obligatoire' }));
        return;
      }

      const dataToSend = {
        type_prestataire: formData.type_prestataire,
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        specialite: formData.specialite.trim(),
        titre: formData.titre?.trim() || null,
        num_licence: formData.num_licence?.trim() || null,
        num_ordre: formData.num_ordre?.trim() || null,
        date_obtention_licence: formData.date_obtention_licence || null,
        date_expiration_licence: formData.date_expiration_licence || null,
        universite_formation: formData.universite_formation?.trim() || null,
        annee_diplome: formData.annee_diplome?.trim() || null,
        experience_annee: formData.experience_annee ? parseInt(formData.experience_annee) : 0,
        telephone: formData.telephone?.trim() || null,
        email: formData.email?.trim() || null,
        cod_cen: formData.cod_cen || null,
        centre_pratique: formData.centre_pratique?.trim() || null,
        cod_pay: formData.cod_pay.trim(),
        num_adr: formData.num_adr?.trim() || null,
        honoraires: formData.honoraires ? parseFloat(formData.honoraires) : null,
        langue_parlee: formData.langue_parlee,
        disponibilite: formData.disponibilite,
        actif: formData.actif
      };

      await onSave(dataToSend);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      throw error;
    }
  };

  const getError = (field) => {
    return touched[field] ? errors[field] : '';
  };

  if (!prestataire || !initialized) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: theme.palette.warning.main,
        color: 'white',
        py: 2
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <EditIcon />
          <Typography variant="h6" fontWeight="bold">
            Modifier le prestataire
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Informations personnelles */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
              Informations personnelles
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nom *"
              name="nom"
              value={formData.nom || ''}
              onChange={handleChange}
              onBlur={() => handleBlur('nom')}
              error={!!getError('nom')}
              helperText={getError('nom')}
              disabled={loading}
              margin="normal"
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Prénom *"
              name="prenom"
              value={formData.prenom || ''}
              onChange={handleChange}
              onBlur={() => handleBlur('prenom')}
              error={!!getError('prenom')}
              helperText={getError('prenom')}
              disabled={loading}
              margin="normal"
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal" error={!!getError('specialite')} required>
              <InputLabel>Spécialité *</InputLabel>
              <Select
                name="specialite"
                value={formData.specialite || ''}
                onChange={handleChange}
                onBlur={() => handleBlur('specialite')}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Sélectionner une spécialité</em>
                </MenuItem>
                {specialites.map((spec, index) => (
                  <MenuItem key={`spec-${index}`} value={spec}>
                    {spec}
                  </MenuItem>
                ))}
              </Select>
              {getError('specialite') && (
                <FormHelperText>{getError('specialite')}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Type de prestataire</InputLabel>
              <Select
                name="type_prestataire"
                value={formData.type_prestataire || 'Médecin'}
                onChange={handleChange}
                disabled={loading}
              >
                {TYPES_PRESTATAIRE.map(type => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Titre professionnel</InputLabel>
              <Select
                name="titre"
                value={formData.titre || ''}
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Sélectionner un titre</em>
                </MenuItem>
                {TITRES_PROFESSIONNELS.map(titre => (
                  <MenuItem key={titre} value={titre}>
                    {titre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Informations professionnelles */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary" sx={{ mt: 2 }}>
              Informations professionnelles
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Numéro de licence"
              name="num_licence"
              value={formData.num_licence || ''}
              onChange={handleChange}
              onBlur={() => handleBlur('num_licence')}
              error={!!getError('num_licence')}
              helperText={getError('num_licence')}
              disabled={loading}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Numéro d'ordre"
              name="num_ordre"
              value={formData.num_ordre || ''}
              onChange={handleChange}
              onBlur={() => handleBlur('num_ordre')}
              error={!!getError('num_ordre')}
              helperText={getError('num_ordre')}
              disabled={loading}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date d'obtention de licence"
                value={formData.date_obtention_licence}
                onChange={(date) => handleDateChange('date_obtention_licence', date)}
                disabled={loading}
                renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date d'expiration de licence"
                value={formData.date_expiration_licence}
                onChange={(date) => handleDateChange('date_expiration_licence', date)}
                disabled={loading}
                renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                minDate={formData.date_obtention_licence || new Date()}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Université de formation"
              name="universite_formation"
              value={formData.universite_formation || ''}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Année de diplôme"
              name="annee_diplome"
              value={formData.annee_diplome || ''}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Expérience (années)"
              name="experience_annee"
              type="number"
              value={formData.experience_annee || 0}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
              inputProps={{ min: 0, max: 60 }}
            />
          </Grid>
          
          {/* Informations de contact */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary" sx={{ mt: 2 }}>
              Informations de contact
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Téléphone"
              name="telephone"
              value={formData.telephone || ''}
              onChange={handleChange}
              onBlur={() => handleBlur('telephone')}
              error={!!getError('telephone')}
              helperText={getError('telephone')}
              disabled={loading}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              error={!!getError('email')}
              helperText={getError('email')}
              disabled={loading}
              margin="normal"
            />
          </Grid>
          
          {/* Localisation */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary" sx={{ mt: 2 }}>
              Localisation
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Centre de pratique</InputLabel>
              <Select
                name="cod_cen"
                value={formData.cod_cen || ''}
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Sélectionner un centre</em>
                </MenuItem>
                {centres.map(centre => (
                  <MenuItem key={centre.COD_CEN || centre.id} value={centre.COD_CEN || centre.id}>
                    {centre.NOM_CENTRE || centre.nom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Lieu de pratique"
              name="centre_pratique"
              value={formData.centre_pratique || ''}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal" error={!!getError('cod_pay')} required>
              <InputLabel>Pays *</InputLabel>
              <Select
                name="cod_pay"
                value={formData.cod_pay || ''}
                onChange={handleChange}
                onBlur={() => handleBlur('cod_pay')}
                disabled={loading || paysOptions.length === 0}
              >
                {paysOptions.length === 0 ? (
                  <MenuItem disabled value="">
                    <em>Chargement des pays...</em>
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem value="">
                      <em>Sélectionner un pays</em>
                    </MenuItem>
                    {paysOptions.map(p => (
                      <MenuItem key={p.value} value={p.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PublicIcon fontSize="small" />
                          <span>{p.label}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </>
                )}
              </Select>
              {getError('cod_pay') && (
                <FormHelperText error>{getError('cod_pay')}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Numéro d'adresse"
              name="num_adr"
              value={formData.num_adr || ''}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
            />
          </Grid>
          
          {/* Tarification et autres */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Honoraires (FCFA)"
              name="honoraires"
              type="number"
              value={formData.honoraires || ''}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="caption">FCFA</Typography>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Langue parlée</InputLabel>
              <Select
                name="langue_parlee"
                value={formData.langue_parlee || 'Français'}
                onChange={handleChange}
                disabled={loading}
              >
                {LANGUES.map(langue => (
                  <MenuItem key={langue} value={langue}>
                    {langue}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Disponibilité</InputLabel>
              <Select
                name="disponibilite"
                value={formData.disponibilite || 'Disponible'}
                onChange={handleChange}
                disabled={loading}
              >
                {STATUTS_DISPONIBILITE.map(statut => (
                  <MenuItem key={statut} value={statut}>
                    {statut}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Statut */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.actif === 1}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    actif: e.target.checked ? 1 : 0 
                  }))}
                  disabled={loading}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  {formData.actif === 1 ? (
                    <>
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography>Actif</Typography>
                    </>
                  ) : (
                    <>
                      <BlockIcon color="error" fontSize="small" />
                      <Typography>Inactif</Typography>
                    </>
                  )}
                </Box>
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          sx={{ mr: 1 }}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="warning"
          disabled={loading || paysOptions.length === 0}
          startIcon={<EditIcon />}
        >
          {loading ? 'Enregistrement...' : 'Mettre à jour'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Modale de synchronisation avancée avec syncAPI
 */
const SyncPrestataireModal = ({ 
  open, 
  onClose, 
  prestataire,
  centres,
  loading,
  onSync 
}) => {
  const theme = useTheme();
  const [selectedCentre, setSelectedCentre] = useState('');
  const [dateDebut, setDateDebut] = useState(null);
  const [dateFin, setDateFin] = useState(null);
  const [observations, setObservations] = useState('');
  const [tarif1, setTarif1] = useState('');
  const [tarif2, setTarif2] = useState('');
  const [tarif3, setTarif3] = useState('');
  const [tps, setTps] = useState('');
  const [tva, setTva] = useState('');
  const [typeOperation, setTypeOperation] = useState('synccentre');
  const [syncOptions, setSyncOptions] = useState({
    updateExisting: true,
    createMissing: true,
    validateData: true,
    sendNotifications: false
  });

  useEffect(() => {
    if (open && prestataire && centres.length > 0) {
      // Initialiser avec le centre actuel du prestataire
      setSelectedCentre(prestataire.cod_cen || '');
      setDateDebut(new Date());
      setDateFin(null);
      setObservations('');
      setTarif1(prestataire.honoraires || '');
      setTarif2('');
      setTarif3('');
      setTps('');
      setTva('');
      setTypeOperation('synccentre');
    }
  }, [open, prestataire, centres]);

  const handleSync = async () => {
    if (!selectedCentre && typeOperation === 'synccentre') {
      alert('Veuillez sélectionner un centre');
      return;
    }

    // Vérifier la présence du token
    if (typeof window === 'undefined') {
      console.error('❌ Exécution côté serveur - localStorage indisponible');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Token manquant - Redirection vers la connexion');
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    // Préparation des données selon le type d'opération
    const syncData = {
      typeOperation,
      options: syncOptions,
      prestataireId: prestataire.id || prestataire.COD_PRE,
      prestataireData: prestataire
    };

    // Ajout des données spécifiques selon l'opération
    if (typeOperation === 'synccentre') {
      syncData.centreData = {
        COD_PRE: prestataire.id || prestataire.COD_PRE,
        COD_CEN: selectedCentre,
        DEB_AGRP: dateDebut || null,
        FIN_AGRP: dateFin || null,
        OBS_AGRP: observations || null,
        TR1_AGRP: tarif1 ? parseFloat(tarif1) : null,
        TR2_AGRP: tarif2 ? parseFloat(tarif2) : null,
        TR3_AGRP: tarif3 ? parseFloat(tarif3) : null,
        TPS_AGRP: tps ? parseFloat(tps) : null,
        TVA_AGRP: tva ? parseFloat(tva) : null
      };
    } else if (typeOperation === 'fullsync') {
      syncData.syncScope = 'all';
    } else if (typeOperation === 'validate') {
      syncData.validationRules = {
        checkLicence: true,
        checkExpiration: true,
        checkAvailability: true
      };
    }

    // Appeler la fonction de synchronisation avec les données préparées
    await onSync(syncData);
  };

  if (!prestataire) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: theme.palette.info.main,
        color: 'white',
        py: 2
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <SyncIcon />
          <Typography variant="h6" fontWeight="bold">
            Synchronisation avancée
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom color="primary">
              Prestataire: <strong>{prestataire.prenom} {prestataire.nom}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {prestataire.id || prestataire.COD_PRE} | Spécialité: {prestataire.specialite}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Type d'opération</InputLabel>
              <Select
                value={typeOperation}
                onChange={(e) => setTypeOperation(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="synccentre">Synchroniser avec centre</MenuItem>
                <MenuItem value="fullsync">Synchronisation complète</MenuItem>
                <MenuItem value="validate">Valider données</MenuItem>
                <MenuItem value="backup">Sauvegarde</MenuItem>
                <MenuItem value="restore">Restauration</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {typeOperation === 'synccentre' && (
            <>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Centre *</InputLabel>
                  <Select
                    value={selectedCentre}
                    onChange={(e) => setSelectedCentre(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="">
                      <em>Sélectionner un centre</em>
                    </MenuItem>
                    {centres.map(centre => (
                      <MenuItem key={centre.COD_CEN || centre.id} value={centre.COD_CEN || centre.id}>
                        {centre.NOM_CENTRE || centre.nom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                  <DatePicker
                    label="Date début d'agrément"
                    value={dateDebut}
                    onChange={setDateDebut}
                    disabled={loading}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                  <DatePicker
                    label="Date fin d'agrément"
                    value={dateFin}
                    onChange={setDateFin}
                    disabled={loading}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    minDate={dateDebut || new Date()}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  disabled={loading}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  Tarification
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Tarif 1 (FCFA)"
                  value={tarif1}
                  onChange={(e) => setTarif1(e.target.value)}
                  disabled={loading}
                  type="number"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Tarif 2 (FCFA)"
                  value={tarif2}
                  onChange={(e) => setTarif2(e.target.value)}
                  disabled={loading}
                  type="number"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Tarif 3 (FCFA)"
                  value={tarif3}
                  onChange={(e) => setTarif3(e.target.value)}
                  disabled={loading}
                  type="number"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="TPS (%)"
                  value={tps}
                  onChange={(e) => setTps(e.target.value)}
                  disabled={loading}
                  type="number"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="TVA (%)"
                  value={tva}
                  onChange={(e) => setTva(e.target.value)}
                  disabled={loading}
                  type="number"
                />
              </Grid>
            </>
          )}
          
          {(typeOperation === 'fullsync' || typeOperation === 'validate') && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                Options de synchronisation
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={syncOptions.updateExisting}
                        onChange={(e) => setSyncOptions(prev => ({ 
                          ...prev, 
                          updateExisting: e.target.checked 
                        }))}
                        disabled={loading}
                      />
                    }
                    label="Mettre à jour les existants"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={syncOptions.createMissing}
                        onChange={(e) => setSyncOptions(prev => ({ 
                          ...prev, 
                          createMissing: e.target.checked 
                        }))}
                        disabled={loading}
                      />
                    }
                    label="Créer les manquants"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={syncOptions.validateData}
                        onChange={(e) => setSyncOptions(prev => ({ 
                          ...prev, 
                          validateData: e.target.checked 
                        }))}
                        disabled={loading}
                      />
                    }
                    label="Valider les données"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={syncOptions.sendNotifications}
                        onChange={(e) => setSyncOptions(prev => ({ 
                          ...prev, 
                          sendNotifications: e.target.checked 
                        }))}
                        disabled={loading}
                      />
                    }
                    label="Envoyer notifications"
                  />
                </Grid>
              </Grid>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mt: 2 }}>
              <AlertTitle>Information</AlertTitle>
              {typeOperation === 'synccentre' 
                ? 'Cette opération va créer ou mettre à jour une entrée dans la table CENTRE_PRESTATAIRE pour lier ce prestataire au centre sélectionné.'
                : typeOperation === 'fullsync'
                ? 'Cette opération va synchroniser toutes les données du prestataire avec les systèmes externes.'
                : typeOperation === 'validate'
                ? 'Cette opération va valider les données du prestataire selon les règles métier.'
                : 'Cette opération va effectuer une sauvegarde/restauration des données.'}
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          sx={{ mr: 1 }}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleSync} 
          variant="contained" 
          color="info"
          disabled={loading || (typeOperation === 'synccentre' && !selectedCentre)}
          startIcon={<SyncIcon />}
        >
          {loading ? 'Synchronisation...' : 'Exécuter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Modale de détails avancés
 */
const PrestataireDetailsModal = ({ open, onClose, prestataire, pays, centres }) => {
  if (!prestataire) return null;

  const theme = useTheme();
  const isActif = isPrestataireActif(prestataire);
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const detailsSections = [
    {
      title: 'Informations personnelles',
      items: [
        { label: 'ID', value: prestataire.id || prestataire.COD_PRE },
        { label: 'Nom complet', value: `${prestataire.prenom || ''} ${prestataire.nom || ''}` },
        { label: 'Spécialité', value: prestataire.specialite || '-' },
        { label: 'Titre', value: prestataire.titre || '-' },
        { label: 'Type', value: prestataire.type_prestataire || '-' },
      ]
    },
    {
      title: 'Informations professionnelles',
      items: [
        { label: 'Numéro de licence', value: prestataire.num_licence || '-' },
        { label: 'Numéro d\'ordre', value: prestataire.num_ordre || '-' },
        { label: 'Date obtention licence', value: formatDate(prestataire.date_obtention_licence) },
        { label: 'Date expiration licence', value: formatDate(prestataire.date_expiration_licence) },
        { label: 'Université de formation', value: prestataire.universite_formation || '-' },
        { label: 'Année de diplôme', value: prestataire.annee_diplome || '-' },
        { label: 'Années d\'expérience', value: prestataire.experience_annee ? `${prestataire.experience_annee} ans` : '-' },
      ]
    },
    {
      title: 'Contact et localisation',
      items: [
        { label: 'Téléphone', value: prestataire.telephone || '-', icon: <PhoneIcon /> },
        { label: 'Email', value: prestataire.email || '-', icon: <EmailIcon /> },
        { label: 'Numéro d\'adresse', value: prestataire.num_adr || '-' },
        { label: 'Centre de pratique', value: getCentreLabel(prestataire.cod_cen, centres) || '-' },
        { label: 'Lieu de pratique', value: prestataire.centre_pratique || '-' },
        { label: 'Pays', value: getPaysLabel(prestataire.cod_pay, pays) || '-' },
      ]
    },
    {
      title: 'Tarification et disponibilité',
      items: [
        { label: 'Honoraires', value: prestataire.honoraires ? `${parseFloat(prestataire.honoraires).toLocaleString('fr-FR')} FCFA` : '-' },
        { label: 'Langue parlée', value: prestataire.langue_parlee || '-' },
        { label: 'Disponibilité', value: prestataire.disponibilite || '-', icon: <EventAvailableIcon /> },
        { label: 'Statut BD', value: isActif ? 'Actif (1)' : 'Inactif (0)', icon: isActif ? <CheckCircleIcon color="success" /> : <BlockIcon color="error" /> },
      ]
    },
    {
      title: 'Dates système',
      items: [
        { label: 'Date de création', value: formatDateTime(prestataire.date_creation || prestataire.DAT_CREUTIL) },
        { label: 'Date de modification', value: formatDateTime(prestataire.date_modification || prestataire.DAT_MODUTIL) },
        { label: 'Créé par', value: prestataire.COD_CREUTIL || '-' },
        { label: 'Modifié par', value: prestataire.COD_MODUTIL || '-' },
      ]
    }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: theme.palette.info.main,
        color: 'white',
        py: 2
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <VisibilityIcon />
          <Typography variant="h6" fontWeight="bold">
            Détails du prestataire
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ py: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Informations générales" />
            <Tab label="Informations professionnelles" />
            <Tab label="Contact et localisation" />
            <Tab label="Dates système" />
          </Tabs>
        </Box>
        
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {detailsSections.slice(0, 2).map((section, sectionIndex) => (
              <Grid item xs={12} md={6} key={`section-${sectionIndex}`}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                  {section.title}
                </Typography>
                <Grid container spacing={2}>
                  {section.items.map((item, itemIndex) => (
                    <Grid item xs={12} key={`item-${sectionIndex}-${itemIndex}`}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          borderLeft: 4,
                          borderColor: theme.palette.primary.main,
                          bgcolor: 'background.default'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          {item.icon && (
                            <Box sx={{ color: 'text.secondary' }}>
                              {item.icon}
                            </Box>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {item.label}
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="medium">
                          {item.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            ))}
          </Grid>
        )}
        
        {activeTab === 1 && (
          <Grid container spacing={3}>
            {detailsSections.slice(1, 3).map((section, sectionIndex) => (
              <Grid item xs={12} md={6} key={`section-prof-${sectionIndex}`}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                  {section.title}
                </Typography>
                <Grid container spacing={2}>
                  {section.items.map((item, itemIndex) => (
                    <Grid item xs={12} key={`item-prof-${sectionIndex}-${itemIndex}`}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          borderLeft: 4,
                          borderColor: theme.palette.secondary.main,
                          bgcolor: 'background.default'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          {item.icon && (
                            <Box sx={{ color: 'text.secondary' }}>
                              {item.icon}
                            </Box>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {item.label}
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="medium">
                          {item.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            ))}
          </Grid>
        )}
        
        {activeTab === 2 && (
          <Grid container spacing={3}>
            {detailsSections.slice(2, 4).map((section, sectionIndex) => (
              <Grid item xs={12} md={6} key={`section-contact-${sectionIndex}`}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                  {section.title}
                </Typography>
                <Grid container spacing={2}>
                  {section.items.map((item, itemIndex) => (
                    <Grid item xs={12} key={`item-contact-${sectionIndex}-${itemIndex}`}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          borderLeft: 4,
                          borderColor: theme.palette.success.main,
                          bgcolor: 'background.default'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          {item.icon && (
                            <Box sx={{ color: 'text.secondary' }}>
                              {item.icon}
                            </Box>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {item.label}
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="medium">
                          {item.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            ))}
          </Grid>
        )}
        
        {activeTab === 3 && (
          <Grid container spacing={3}>
            {detailsSections.slice(4).map((section, sectionIndex) => (
              <Grid item xs={12} key={`section-system-${sectionIndex}`}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                  {section.title}
                </Typography>
                <Grid container spacing={2}>
                  {section.items.map((item, itemIndex) => (
                    <Grid item xs={12} md={6} key={`item-system-${sectionIndex}-${itemIndex}`}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          borderLeft: 4,
                          borderColor: theme.palette.warning.main,
                          bgcolor: 'background.default'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          {item.icon && (
                            <Box sx={{ color: 'text.secondary' }}>
                              {item.icon}
                            </Box>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {item.label}
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="medium">
                          {item.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          onClick={onClose} 
          variant="contained"
          color="primary"
        >
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Modale de synchronisation globale
 */
const GlobalSyncModal = ({ 
  open, 
  onClose, 
  loading,
  onGlobalSync 
}) => {
  const theme = useTheme();
  const [syncScope, setSyncScope] = useState('all');
  const [syncDirection, setSyncDirection] = useState('bidirectional');
  const [syncOptions, setSyncOptions] = useState({
    validateBeforeSync: true,
    createBackup: true,
    notifyUsers: false,
    forceUpdate: false
  });

  const handleGlobalSync = async () => {
    const syncConfig = {
      scope: syncScope,
      direction: syncDirection,
      options: syncOptions,
      timestamp: new Date().toISOString()
    };

    await onGlobalSync(syncConfig);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: theme.palette.primary.main,
        color: 'white',
        py: 2
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <SyncIcon />
          <Typography variant="h6" fontWeight="bold">
            Synchronisation globale
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Portée de synchronisation</InputLabel>
              <Select
                value={syncScope}
                onChange={(e) => setSyncScope(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="all">Tous les prestataires</MenuItem>
                <MenuItem value="active">Prestataires actifs seulement</MenuItem>
                <MenuItem value="recent">Modifications récentes</MenuItem>
                <MenuItem value="selected">Sélection spécifique</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Direction de synchronisation</InputLabel>
              <Select
                value={syncDirection}
                onChange={(e) => setSyncDirection(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="upload">Upload (local → serveur)</MenuItem>
                <MenuItem value="download">Download (serveur → local)</MenuItem>
                <MenuItem value="bidirectional">Bidirectionnel</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom color="primary">
              Options de synchronisation
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={syncOptions.validateBeforeSync}
                      onChange={(e) => setSyncOptions(prev => ({ 
                        ...prev, 
                        validateBeforeSync: e.target.checked 
                      }))}
                      disabled={loading}
                    />
                  }
                  label="Valider avant synchronisation"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={syncOptions.createBackup}
                      onChange={(e) => setSyncOptions(prev => ({ 
                        ...prev, 
                        createBackup: e.target.checked 
                      }))}
                      disabled={loading}
                    />
                  }
                  label="Créer une sauvegarde"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={syncOptions.notifyUsers}
                      onChange={(e) => setSyncOptions(prev => ({ 
                        ...prev, 
                        notifyUsers: e.target.checked 
                      }))}
                      disabled={loading}
                    />
                  }
                  label="Notifier les utilisateurs"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={syncOptions.forceUpdate}
                      onChange={(e) => setSyncOptions(prev => ({ 
                        ...prev, 
                        forceUpdate: e.target.checked 
                      }))}
                      disabled={loading}
                    />
                  }
                  label="Forcer la mise à jour"
                />
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ mt: 2 }}>
              <AlertTitle>Attention</AlertTitle>
              Cette opération va synchroniser {syncScope === 'all' ? 'tous les prestataires' : 
              syncScope === 'active' ? 'les prestataires actifs' : 
              'les modifications récentes'} avec le serveur. 
              Cette opération peut prendre plusieurs minutes.
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          sx={{ mr: 1 }}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleGlobalSync} 
          variant="contained" 
          color="primary"
          disabled={loading}
          startIcon={<SyncIcon />}
        >
          {loading ? 'Synchronisation en cours...' : 'Démarrer la synchronisation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==============================================
// COMPOSANT PRINCIPAL - COMPLET
// ==============================================
const GestionPrestataires = () => {
  const theme = useTheme();
  
  // États principaux
  const [prestataires, setPrestataires] = useState([]);
  const [loading, setLoading] = useState({
    prestataires: false,
    donnees: false,
    action: false,
    sync: false,
    globalSync: false
  });
  
  // États pour les filtres avancés
  const [filters, setFilters] = useState({
    search: '',
    actif: '',
    specialite: '',
    cod_cen: '',
    type_prestataire: '',
    cod_pay: '',
    disponibilite: '',
    experience_min: '',
    experience_max: ''
  });
  
  // États pour la pagination et tri
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: DEFAULT_ROWS_PER_PAGE,
    total: 0,
    totalPages: 0
  });
  
  const [sortConfig, setSortConfig] = useState({
    field: DEFAULT_SORT_FIELD,
    direction: DEFAULT_SORT_DIRECTION
  });
  
  // États pour les modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showGlobalSyncModal, setShowGlobalSyncModal] = useState(false);
  const [selectedPrestataire, setSelectedPrestataire] = useState(null);
  
  // États pour les données
  const [centres, setCentres] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [pays, setPays] = useState([]);
  const [statistiques, setStatistiques] = useState({
    generales: {
      total: 0,
      actifs: 0,
      inactifs: 0,
      pourcentage_actifs: 0,
      pourcentage_inactifs: 0,
      nombre_specialites: 0,
      nombre_types: 0,
      experience_moyenne: 0,
      honoraires_moyens: 0,
      nombre_pays: 0,
      nombre_centres: 0
    },
    par_specialite: [],
    par_type: [],
    par_pays: [],
    par_centre: []
  });
  
  // États pour les notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Menu contextuel
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  
  // États pour les filtres avancés
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // États pour la synchronisation
  const [syncStatus, setSyncStatus] = useState({
    lastSync: null,
    syncInProgress: false,
    syncErrors: [],
    syncStats: {
      success: 0,
      failed: 0,
      skipped: 0
    }
  });
  
  // Référence pour la recherche avec debounce
  const searchTimeoutRef = useRef(null);
  
  // Chargement initial
  useEffect(() => {
    chargerDonneesInitiales();
  }, []);
  
  // Charger les prestataires quand les filtres, pagination ou tri changent
  useEffect(() => {
    chargerPrestataires();
  }, [pagination.page, pagination.rowsPerPage, filters, sortConfig]);
  
  // Débounce pour la recherche
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (pagination.page === 0) {
        chargerPrestataires();
      } else {
        setPagination(prev => ({ ...prev, page: 0 }));
      }
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters.search]);
  
  const chargerDonneesInitiales = async () => {
    setLoading(prev => ({ ...prev, donnees: true }));
    try {
      await Promise.all([
        chargerPays(),
        chargerPrestataires(),
        chargerCentres(),
        chargerSpecialites(),
        chargerStatistiques(),
        checkSyncStatus()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement initial:', error);
      showNotification('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(prev => ({ ...prev, donnees: false }));
    }
  };
  
  const chargerPrestataires = async () => {
    setLoading(prev => ({ ...prev, prestataires: true }));
    try {
      const params = {
        page: pagination.page + 1,
        limit: pagination.rowsPerPage,
        sortBy: sortConfig.field,
        sortOrder: sortConfig.direction.toUpperCase()
      };
      
      // Ajouter les filtres
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
          params[key] = filters[key];
        }
      });
      
      const response = await prestatairesAPI.getAll(params);
      
      if (response.success) {
        setPrestataires(response.data || response.prestataires || []);
        setPagination(prev => ({
          ...prev,
          total: response.total || response.pagination?.total || 0,
          totalPages: response.totalPages || response.pagination?.totalPages || 0
        }));
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des prestataires');
      }
    } catch (error) {
      console.error('Erreur chargement prestataires:', error);
      showNotification(error.message || 'Erreur lors du chargement des prestataires', 'error');
    } finally {
      setLoading(prev => ({ ...prev, prestataires: false }));
    }
  };
  
  const chargerCentres = async () => {
    try {
      const response = await centresAPI.getAll();
      if (response.success) {
        setCentres(response.data || response.centres || []);
      } else {
        setCentres([]);
      }
    } catch (error) {
      console.error('Erreur chargement centres:', error);
      setCentres([]);
    }
  };
  
  const chargerSpecialites = async () => {
    try {
      const response = await prestatairesAPI.getSpecialites();
      if (response.success) {
        const specList = response.data || response.specialites || [];
        const labels = specList.map(s => s.label || s.value || s.nom || s);
        setSpecialites([...new Set(labels)].filter(Boolean));
      } else {
        setSpecialites([]);
      }
    } catch (error) {
      console.error('Erreur chargement spécialités:', error);
      setSpecialites([]);
    }
  };
  
  const chargerPays = async () => {
  try {
    const response = await paysAPI.getAll();
    
    console.log('📊 Données pays reçues:', response); // Debug
    
    if (response.success) {
      const paysList = response.data || response.pays || [];
      console.log('📊 Structure du premier pays:', paysList[0]); // Debug
      setPays(paysList);
      
      if (paysList.length === 0) {
        showNotification(
          'Aucun pays n\'est configuré. Veuillez configurer les pays avant d\'ajouter des prestataires.',
          'warning'
        );
      }
    } else {
      console.error('❌ Erreur API pays:', response);
      setPays([]);
      showNotification('Erreur lors du chargement des pays', 'error');
    }
  } catch (error) {
    console.error('❌ Erreur chargement pays:', error);
    setPays([]);
    showNotification('Impossible de charger la liste des pays', 'error');
  }
};
  
  const chargerStatistiques = async () => {
    try {
      const response = await prestatairesAPI.getStatistiques();
      if (response.success && response.statistiques) {
        setStatistiques({
          ...statistiques,
          ...response.statistiques
        });
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };
  
  const checkSyncStatus = async () => {
    try {
      const response = await syncAPI.getStatus();
      if (response.success) {
        setSyncStatus(prev => ({
          ...prev,
          lastSync: response.lastSync,
          syncInProgress: response.inProgress,
          syncStats: response.stats || prev.syncStats
        }));
      }
    } catch (error) {
      console.error('Erreur vérification statut sync:', error);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 0 }));
  };
  
  const resetFilters = () => {
    setFilters({
      search: '',
      actif: '',
      specialite: '',
      cod_cen: '',
      type_prestataire: '',
      cod_pay: '',
      disponibilite: '',
      experience_min: '',
      experience_max: ''
    });
    setPagination(prev => ({ ...prev, page: 0 }));
  };
  
  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const handleChangePage = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };
  
  const handleChangeRowsPerPage = (event) => {
    setPagination(prev => ({
      ...prev,
      rowsPerPage: parseInt(event.target.value, 10),
      page: 0
    }));
  };
  
  const handleAddPrestataire = async (prestataireData) => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const response = await prestatairesAPI.create(prestataireData);
      
      if (response.success) {
        showNotification('Prestataire ajouté avec succès', 'success');
        setShowAddModal(false);
        chargerPrestataires();
        chargerStatistiques();
        
        // Synchroniser automatiquement le nouveau prestataire
        try {
          await syncAPI.syncPrestataire({
            prestataireId: response.data.id || response.data.COD_PRE,
            operation: 'create',
            data: response.data
          });
        } catch (syncError) {
          console.warn('Synchronisation automatique échouée:', syncError);
        }
      } else {
        throw new Error(response.message || 'Erreur lors de l\'ajout du prestataire');
      }
    } catch (error) {
      console.error('Erreur ajout prestataire:', error);
      showNotification(error.message || 'Erreur lors de l\'ajout du prestataire', 'error');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };
  
  const handleEditPrestataire = async (prestataireData) => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      if (!selectedPrestataire?.id) {
        throw new Error('Aucun prestataire sélectionné');
      }
      
      const response = await prestatairesAPI.update(selectedPrestataire.id, prestataireData);
      
      if (response.success) {
        showNotification('Prestataire modifié avec succès', 'success');
        setShowEditModal(false);
        chargerPrestataires();
        chargerStatistiques();
        
        // Synchroniser automatiquement les modifications
        try {
          await syncAPI.syncPrestataire({
            prestataireId: selectedPrestataire.id,
            operation: 'update',
            data: { ...selectedPrestataire, ...prestataireData }
          });
        } catch (syncError) {
          console.warn('Synchronisation automatique échouée:', syncError);
        }
      } else {
        throw new Error(response.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur modification prestataire:', error);
      showNotification(error.message || 'Erreur lors de la modification du prestataire', 'error');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };
  
  const handleDeletePrestataire = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver ce prestataire ?')) {
      return;
    }
    
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const response = await prestatairesAPI.delete(id);
      
      if (response.success) {
        showNotification('Prestataire désactivé avec succès', 'success');
        chargerPrestataires();
        chargerStatistiques();
        
        // Synchroniser la désactivation
        try {
          await syncAPI.syncPrestataire({
            prestataireId: id,
            operation: 'delete',
            data: { actif: 0 }
          });
        } catch (syncError) {
          console.warn('Synchronisation automatique échouée:', syncError);
        }
      } else {
        throw new Error(response.message || 'Erreur lors de la désactivation');
      }
    } catch (error) {
      console.error('Erreur suppression prestataire:', error);
      showNotification(error.message || 'Erreur lors de la désactivation du prestataire', 'error');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };
  
  const handleChangeStatus = async (id, newStatus) => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const updateData = {
        actif: newStatus === 'Actif' ? 1 : 0
      };
      
      const response = await prestatairesAPI.update(id, updateData);
      
      if (response.success) {
        showNotification(`Statut modifié en "${newStatus}" avec succès`, 'success');
        chargerPrestataires();
        chargerStatistiques();
        
        // Synchroniser le changement de statut
        try {
          await syncAPI.syncPrestataire({
            prestataireId: id,
            operation: 'status',
            data: updateData
          });
        } catch (syncError) {
          console.warn('Synchronisation automatique échouée:', syncError);
        }
      } else {
        throw new Error(response.message || 'Erreur lors du changement de statut');
      }
    } catch (error) {
      console.error('Erreur changement statut:', error);
      showNotification(error.message || 'Erreur lors du changement de statut', 'error');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };
  
  const handleSyncWithCentrePrestataire = async (syncData) => {
    // Vérifier la présence du token
    if (typeof window === 'undefined') {
      console.error('❌ Exécution côté serveur - localStorage indisponible');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Token manquant - Redirection vers la connexion');
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    
    // Vérifier la validité du token (optionnel)
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.error('❌ Informations utilisateur manquantes');
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }
    
    setLoading(prev => ({ ...prev, sync: true }));
    
    try {
      let response;
      
      // Selon le type d'opération, appeler l'API appropriée
      switch (syncData.typeOperation) {
        case 'synccentre':
          // Pour la synchronisation centre-prestataire
          if (!syncData.centreData) {
            throw new Error('Données de centre manquantes');
          }
          
          response = await syncAPI.syncCentrePrestataire(syncData.centreData);
          break;
          
        case 'fullsync':
          // Synchronisation complète
          response = await syncAPI.fullSync(syncData);
          break;
          
        case 'validate':
          // Validation des données
          response = await syncAPI.validatePrestataire(syncData);
          break;
          
        case 'backup':
          // Sauvegarde
          response = await syncAPI.backupPrestataires(syncData);
          break;
          
        case 'restore':
          // Restauration
          response = await syncAPI.restorePrestataires(syncData);
          break;
          
        default:
          throw new Error(`Type d'opération non supporté : ${syncData.typeOperation}`);
      }
      
      if (response.success) {
        showNotification('Opération de synchronisation réussie', 'success');
        setShowSyncModal(false);
        
        // Recharger les données si nécessaire
        if (syncData.typeOperation === 'synccentre') {
          chargerPrestataires();
        }
      } else {
        throw new Error(response.message || 'Erreur lors de la synchronisation');
      }
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
      
      let errorMessage = error.message || 'Erreur lors de la synchronisation';
      
      // Messages d'erreur plus spécifiques
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Problème de connexion réseau. Vérifiez votre connexion internet.';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'La synchronisation a pris trop de temps et a été interrompue.';
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(prev => ({ ...prev, sync: false }));
    }
  };
  
  const handleGlobalSync = async (syncConfig) => {
    setLoading(prev => ({ ...prev, globalSync: true }));
    try {
      console.log('🌐 Lancement de la synchronisation globale:', syncConfig);
      
      // Mettre à jour le statut
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: true,
        lastSync: null
      }));
      
      // Appeler l'API de synchronisation globale
      const response = await syncAPI.globalSync(syncConfig);
      
      if (response.success) {
        showNotification('Synchronisation globale terminée avec succès', 'success');
        setShowGlobalSyncModal(false);
        
        // Mettre à jour le statut
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date().toISOString(),
          syncInProgress: false,
          syncStats: response.stats || prev.syncStats,
          syncErrors: response.errors || []
        }));
        
        // Rafraîchir les données
        chargerPrestataires();
        chargerStatistiques();
        
        // Afficher le rapport de synchronisation
        if (response.report) {
          showNotification(
            `Synchronisation terminée: ${response.report.success} réussis, ${response.report.failed} échoués`,
            response.report.failed > 0 ? 'warning' : 'success'
          );
        }
      } else {
        throw new Error(response.message || 'Erreur lors de la synchronisation globale');
      }
    } catch (error) {
      console.error('❌ Erreur synchronisation globale:', error);
      
      let errorMessage = error.message || 'Erreur lors de la synchronisation globale';
      
      if (error.message.includes('timeout')) {
        errorMessage = 'La synchronisation a pris trop de temps et a été interrompue.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Problème de réseau. Vérifiez votre connexion.';
      }
      
      showNotification(errorMessage, 'error');
      
      // Mettre à jour le statut
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        syncErrors: [...prev.syncErrors, {
          timestamp: new Date().toISOString(),
          operation: 'global',
          error: errorMessage
        }]
      }));
    } finally {
      setLoading(prev => ({ ...prev, globalSync: false }));
    }
  };
  
  const handleExport = () => {
    try {
      const headers = [
        'ID', 'Nom', 'Prénom', 'Spécialité', 'Type', 'Titre',
        'Numéro Licence', 'Numéro Ordre', 'Date Obtention Licence', 'Date Expiration Licence',
        'Université Formation', 'Année Diplôme', 'Expérience (années)',
        'Téléphone', 'Email', 'Numéro Adresse',
        'Code Centre', 'Centre Pratique', 'Code Pays',
        'Honoraires (FCFA)', 'Langue Parlée', 'Disponibilité',
        'Statut BD', 'Date Création', 'Date Modification'
      ];
      
      const rows = prestataires.map(p => [
        p.id || p.COD_PRE,
        p.nom,
        p.prenom,
        p.specialite,
        p.type_prestataire,
        p.titre,
        p.num_licence || '',
        p.num_ordre || '',
        formatDate(p.date_obtention_licence),
        formatDate(p.date_expiration_licence),
        p.universite_formation || '',
        p.annee_diplome || '',
        p.experience_annee || 0,
        p.telephone || '',
        p.email || '',
        p.num_adr || '',
        p.cod_cen || '',
        p.centre_pratique || '',
        p.cod_pay || '',
        p.honoraires || '',
        p.langue_parlee || '',
        p.disponibilite || '',
        isPrestataireActif(p) ? 'Actif (1)' : 'Inactif (0)',
        formatDateTime(p.date_creation),
        formatDateTime(p.date_modification)
      ]);
      
      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
      ].join('\n');
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prestataires_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('Export CSV généré avec succès', 'success');
    } catch (error) {
      console.error('Erreur export:', error);
      showNotification('Erreur lors de l\'export', 'error');
    }
  };
  
  const handleMenuOpen = (event, id) => {
    setAnchorEl(event.currentTarget);
    setSelectedMenuId(id);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMenuId(null);
  };
  
  const showNotification = useCallback((message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);
  
  // Données pour les graphiques
  const chartData = useMemo(() => {
    const generales = statistiques?.generales || {};
    const actifs = generales.actifs || 0;
    const inactifs = generales.inactifs || 0;
    
    return [
      { name: 'Actifs', value: actifs, color: theme.palette.success.main },
      { name: 'Inactifs', value: inactifs, color: theme.palette.error.main }
    ].filter(item => item.value > 0);
  }, [statistiques, theme]);
  
  const specialiteChartData = useMemo(() => {
    return (statistiques?.par_specialite || []).slice(0, 5).map(item => ({
      name: item.specialite?.substring(0, 20) || 'Non spécifié',
      value: item.nombre || 0
    }));
  }, [statistiques?.par_specialite]);
  
  // Calcul des options de pays pour les filtres
  const paysOptions = useMemo(() => {
    if (!pays || pays.length === 0) return [];
    return pays.map(p => ({
      value: p.COD_PAY || p.code || p.id,
      label: p.LIB_PAY || p.nom || p.label || p.COD_PAY || p.name
    }));
  }, [pays]);
  
  const statsCards = useMemo(() => {
    const generales = statistiques?.generales || {};
    
    return [
      {
        title: 'Total',
        value: generales.total || 0,
        icon: PersonIcon,
        color: 'primary',
        subtitle: 'Prestataires enregistrés',
        onClick: () => resetFilters()
      },
      {
        title: 'Actifs',
        value: generales.actifs || 0,
        icon: CheckCircleIcon,
        color: 'success',
        subtitle: `${generales.pourcentage_actifs || 0}% du total`,
        onClick: () => setFilters(prev => ({ ...prev, actif: '1' }))
      },
      {
        title: 'Spécialités',
        value: generales.nombre_specialites || 0,
        icon: HospitalIcon,
        color: 'info',
        subtitle: 'Différentes spécialités'
      },
      {
        title: 'Centres',
        value: centres.length || 0,
        icon: BusinessIcon,
        color: 'warning',
        subtitle: 'Centres disponibles'
      }
    ];
  }, [statistiques, centres]);
  
  const syncStatusCard = useMemo(() => ({
    title: 'Dernière sync',
    value: syncStatus.lastSync ? formatDateTime(syncStatus.lastSync) : 'Jamais',
    icon: syncStatus.syncInProgress ? SyncIcon : 
          syncStatus.lastSync ? SyncIcon : SyncProblemIcon,
    color: syncStatus.syncInProgress ? 'warning' : 
           syncStatus.lastSync ? 'success' : 'error',
    subtitle: syncStatus.syncInProgress ? 'Synchronisation en cours...' : 
              syncStatus.lastSync ? 'Synchronisé' : 'Non synchronisé',
    onClick: () => setShowGlobalSyncModal(true)
  }), [syncStatus]);
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* En-tête */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                <PersonIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
                Gestion des Prestataires
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {pagination.total} prestataire(s) • Page {pagination.page + 1} sur {Math.max(1, pagination.totalPages)}
                {pays.length > 0 && ` • ${pays.length} pays disponible(s)`}
                {centres.length > 0 && ` • ${centres.length} centres disponible(s)`}
                {syncStatus.lastSync && ` • Dernière sync: ${formatDateTime(syncStatus.lastSync)}`}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={chargerDonneesInitiales}
                disabled={loading.donnees}
              >
                Actualiser
              </Button>
              <Button
                variant="contained"
                startIcon={<SyncIcon />}
                onClick={() => setShowGlobalSyncModal(true)}
                disabled={loading.globalSync}
                color={syncStatus.lastSync ? "success" : "warning"}
              >
                Synchroniser
              </Button>
            
<Button
  variant="contained"
  startIcon={<AddIcon />}
  onClick={() => {
    if (pays.length === 0) {
      showNotification(
        'Impossible d\'ajouter un prestataire : aucun pays disponible. Veuillez configurer les pays d\'abord.',
        'error'
      );
      chargerPays(); // Recharger les pays
    } else {
      setShowAddModal(true);
    }
  }}
  disabled={loading.donnees || pays.length === 0}
  sx={{
    position: 'relative',
    '&::after': pays.length === 0 ? {
      content: '"!"',
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: 'error.main',
      color: 'white',
      borderRadius: '50%',
      width: 20,
      height: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold'
    } : {}
  }}
>
  Nouveau Prestataire
  {pays.length === 0 && (
    <Tooltip title="Aucun pays disponible. Configurez les pays d'abord.">
      <WarningIcon sx={{ ml: 1, fontSize: 16 }} />
    </Tooltip>
  )}
</Button>
            </Stack>
          </Box>
          <LinearProgress 
            sx={{ 
              opacity: loading.donnees ? 1 : 0,
              transition: 'opacity 0.3s',
              mb: 2 
            }} 
          />
        </Box>

        {/* Statistiques */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StatCard {...stat} loading={loading.donnees} />
            </Grid>
          ))}
          
          {/* Carte de statut de synchronisation */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard {...syncStatusCard} loading={loading.globalSync} />
          </Grid>
        </Grid>

        {/* Graphiques */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Répartition par statut (BD)
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => [value, 'Nombre']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Top 5 des spécialités
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={specialiteChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar 
                      dataKey="value" 
                      fill={theme.palette.primary.main}
                      name="Nombre"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Filtres et recherche */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Filtres et recherche
            </Typography>
            <Button
              startIcon={showAdvancedFilters ? <FilterAltOffIcon /> : <FilterAltIcon />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              size="small"
            >
              {showAdvancedFilters ? 'Masquer les filtres avancés' : 'Filtres avancés'}
            </Button>
          </Box>
          
          <form onSubmit={handleSearch}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Rechercher par nom, prénom, email, téléphone..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                  disabled={loading.prestataires}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={filters.actif}
                    label="Statut"
                    onChange={(e) => setFilters(prev => ({ ...prev, actif: e.target.value }))}
                    disabled={loading.prestataires}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="1">Actif</MenuItem>
                    <MenuItem value="0">Inactif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Spécialité</InputLabel>
                  <Select
                    value={filters.specialite}
                    label="Spécialité"
                    onChange={(e) => setFilters(prev => ({ ...prev, specialite: e.target.value }))}
                    disabled={loading.prestataires}
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    {specialites.map((spec, index) => (
                      <MenuItem key={index} value={spec}>
                        {spec}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type_prestataire}
                    label="Type"
                    onChange={(e) => setFilters(prev => ({ ...prev, type_prestataire: e.target.value }))}
                    disabled={loading.prestataires}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    {TYPES_PRESTATAIRE.slice(0, 10).map(type => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Stack direction="row" spacing={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading.prestataires}
                  >
                    Appliquer
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={resetFilters}
                    fullWidth
                    disabled={loading.prestataires}
                  >
                    Réinitialiser
                  </Button>
                </Stack>
              </Grid>
            </Grid>
            
            {/* Filtres avancés */}
            <Collapse in={showAdvancedFilters}>
              <Box mt={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Centre</InputLabel>
                      <Select
                        value={filters.cod_cen}
                        label="Centre"
                        onChange={(e) => setFilters(prev => ({ ...prev, cod_cen: e.target.value }))}
                        disabled={loading.prestataires}
                      >
                        <MenuItem value="">Tous</MenuItem>
                        {centres.map(centre => (
                          <MenuItem key={centre.COD_CEN || centre.id} value={centre.COD_CEN || centre.id}>
                            {centre.NOM_CENTRE || centre.nom}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Pays</InputLabel>
                      <Select
                        value={filters.cod_pay}
                        label="Pays"
                        onChange={(e) => setFilters(prev => ({ ...prev, cod_pay: e.target.value }))}
                        disabled={loading.prestataires}
                      >
                        <MenuItem value="">Tous</MenuItem>
                        {paysOptions.map(p => (
                          <MenuItem key={p.value} value={p.value}>
                            {p.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Disponibilité</InputLabel>
                      <Select
                        value={filters.disponibilite}
                        label="Disponibilité"
                        onChange={(e) => setFilters(prev => ({ ...prev, disponibilite: e.target.value }))}
                        disabled={loading.prestataires}
                      >
                        <MenuItem value="">Toutes</MenuItem>
                        {STATUTS_DISPONIBILITE.map(statut => (
                          <MenuItem key={statut} value={statut}>
                            {statut}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Exp. min (ans)"
                      type="number"
                      value={filters.experience_min}
                      onChange={(e) => setFilters(prev => ({ ...prev, experience_min: e.target.value }))}
                      disabled={loading.prestataires}
                      inputProps={{ min: 0, max: 60 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Exp. max (ans)"
                      type="number"
                      value={filters.experience_max}
                      onChange={(e) => setFilters(prev => ({ ...prev, experience_max: e.target.value }))}
                      disabled={loading.prestataires}
                      inputProps={{ min: 0, max: 60 }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </form>
        </Paper>

        {/* Table des prestataires */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}>
            <Typography variant="h6" fontWeight="bold">
              Liste des prestataires ({pagination.total})
            </Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Synchronisation globale">
                <IconButton 
                  onClick={() => setShowGlobalSyncModal(true)}
                  disabled={loading.globalSync}
                  size="small"
                  color={syncStatus.lastSync ? "success" : "warning"}
                >
                  {syncStatus.syncInProgress ? (
                    <CircularProgress size={20} />
                  ) : (
                    <SyncIcon />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip title="Exporter en CSV">
                <IconButton 
                  onClick={handleExport} 
                  disabled={loading.prestataires || prestataires.length === 0}
                  size="small"
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600, width: '70px' }}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      ID
                      <IconButton size="small" onClick={() => handleSort('id')}>
                        <SortByAlphaIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      Nom & Prénom
                      <IconButton size="small" onClick={() => handleSort('nom')}>
                        <SortByAlphaIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Spécialité/Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Localisation</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Statut/Disponibilité</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Dates</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '180px' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading.prestataires ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Chargement des prestataires...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : prestataires.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Aucun prestataire trouvé
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {Object.values(filters).some(f => f !== '' && f !== null && f !== undefined)
                          ? 'Aucun résultat ne correspond à vos critères de recherche.'
                          : 'Aucun prestataire n\'est enregistré pour le moment.'}
                      </Typography>
                      {Object.values(filters).some(f => f !== '' && f !== null && f !== undefined) ? (
                        <Button
                          variant="outlined"
                          onClick={resetFilters}
                        >
                          Afficher tous les prestataires
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={() => {
                            if (paysOptions.length === 0) {
                              showNotification('Veuillez configurer les pays d\'abord', 'error');
                            } else {
                              setShowAddModal(true);
                            }
                          }}
                          startIcon={<AddIcon />}
                          disabled={paysOptions.length === 0}
                        >
                          Ajouter un prestataire
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  prestataires.map((prestataire) => (
                    <TableRow 
                      key={prestataire.id} 
                      hover
                      sx={{ 
                        '&:hover': { bgcolor: 'action.hover' },
                        opacity: isPrestataireActif(prestataire) ? 1 : 0.7
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" fontWeight="medium">
                          #{prestataire.id || prestataire.COD_PRE}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {prestataire.prenom} {prestataire.nom}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {prestataire.type_prestataire}
                            {prestataire.titre && ` • ${prestataire.titre}`}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {prestataire.specialite}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {prestataire.num_licence && `Licence: ${prestataire.num_licence}`}
                            {prestataire.num_ordre && ` • Ordre: ${prestataire.num_ordre}`}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {prestataire.telephone && (
                            <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {prestataire.telephone}
                              </Typography>
                            </Box>
                          )}
                          {prestataire.email && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2" noWrap sx={{ maxWidth: '200px' }}>
                                {prestataire.email}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                            <PublicIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {getPaysLabel(prestataire.cod_pay, pays)}
                            </Typography>
                          </Box>
                          {prestataire.cod_cen && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <BusinessIcon fontSize="small" color="action" />
                              <Typography variant="caption">
                                {getCentreLabel(prestataire.cod_cen, centres)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexDirection="column" gap={0.5}>
                          <StatusChip prestataire={prestataire} />
                          <DisponibiliteChip disponibilite={prestataire.disponibilite} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Créé: {formatDate(prestataire.date_creation)}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Modifié: {formatDate(prestataire.date_modification)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Voir détails">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedPrestataire(prestataire);
                                setShowDetailsModal(true);
                              }}
                              color="info"
                              disabled={loading.action}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Modifier">
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (paysOptions.length === 0) {
                                  showNotification('Impossible de modifier : aucun pays disponible', 'error');
                                  chargerPays();
                                } else {
                                  setSelectedPrestataire(prestataire);
                                  setShowEditModal(true);
                                }
                              }}
                              color="warning"
                              disabled={loading.action || paysOptions.length === 0}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Synchroniser">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedPrestataire(prestataire);
                                setShowSyncModal(true);
                              }}
                              color="primary"
                              disabled={loading.action}
                            >
                              <SyncIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Options">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, prestataire.id)}
                              color="default"
                              disabled={loading.action}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        
                        {/* Menu contextuel */}
                        <Menu
                          anchorEl={anchorEl}
                          open={Boolean(anchorEl) && selectedMenuId === prestataire.id}
                          onClose={handleMenuClose}
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                          }}
                          transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                          }}
                        >
                          <MenuItem 
                            onClick={() => {
                              handleChangeStatus(prestataire.id, 'Actif');
                              handleMenuClose();
                            }}
                            disabled={isPrestataireActif(prestataire) || loading.action}
                          >
                            <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                            Activer (1)
                          </MenuItem>
                          <MenuItem 
                            onClick={() => {
                              handleChangeStatus(prestataire.id, 'Inactif');
                              handleMenuClose();
                            }}
                            disabled={!isPrestataireActif(prestataire) || loading.action}
                          >
                            <BlockIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
                            Désactiver (0)
                          </MenuItem>
                          <Divider />
                          <MenuItem 
                            onClick={() => {
                              handleDeletePrestataire(prestataire.id);
                              handleMenuClose();
                            }}
                            sx={{ color: 'error.main' }}
                            disabled={loading.action}
                          >
                            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                            Supprimer définitivement
                          </MenuItem>
                        </Menu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          {!loading.prestataires && prestataires.length > 0 && (
            <TablePagination
              rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
              component="div"
              count={pagination.total}
              rowsPerPage={pagination.rowsPerPage}
              page={pagination.page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Lignes par page :"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} sur ${count}`
              }
              ActionsComponent={(props) => (
                <Box sx={{ flexShrink: 0, ml: 2.5 }}>
                  <IconButton
                    onClick={() => props.onPageChange(null, 0)}
                    disabled={props.page === 0}
                    aria-label="première page"
                  >
                    <FirstPageIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => props.onPageChange(null, props.page - 1)}
                    disabled={props.page === 0}
                    aria-label="page précédente"
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => props.onPageChange(null, props.page + 1)}
                    disabled={props.page >= Math.ceil(props.count / props.rowsPerPage) - 1}
                    aria-label="page suivante"
                  >
                    <ChevronRightIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => props.onPageChange(null, Math.max(0, Math.ceil(props.count / props.rowsPerPage) - 1))}
                    disabled={props.page >= Math.ceil(props.count / props.rowsPerPage) - 1}
                    aria-label="dernière page"
                  >
                    <LastPageIcon />
                  </IconButton>
                </Box>
              )}
            />
          )}
        </Paper>

        {/* Modales */}
        <AjouterPrestataireModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddPrestataire}
          centres={centres}
          specialites={specialites}
          pays={pays}
          loading={loading.action}
        />
        
        {selectedPrestataire && (
          <>
            <ModifierPrestataireModal
              open={showEditModal}
              onClose={() => setShowEditModal(false)}
              onSave={handleEditPrestataire}
              prestataire={selectedPrestataire}
              centres={centres}
              specialites={specialites}
              pays={pays}
              loading={loading.action}
            />
            
            <SyncPrestataireModal
              open={showSyncModal}
              onClose={() => setShowSyncModal(false)}
              prestataire={selectedPrestataire}
              centres={centres}
              loading={loading.sync}
              onSync={handleSyncWithCentrePrestataire}
            />
            
            <PrestataireDetailsModal
              open={showDetailsModal}
              onClose={() => setShowDetailsModal(false)}
              prestataire={selectedPrestataire}
              pays={pays}
              centres={centres}
            />
          </>
        )}
        
        <GlobalSyncModal
          open={showGlobalSyncModal}
          onClose={() => setShowGlobalSyncModal(false)}
          loading={loading.globalSync}
          onGlobalSync={handleGlobalSync}
        />

        {/* Notifications */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
            severity={notification.severity}
            sx={{ width: '100%' }}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default GestionPrestataires;