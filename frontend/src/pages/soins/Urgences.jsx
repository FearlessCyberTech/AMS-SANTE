// src/pages/UrgencesPage.jsx - VERSION CORRIGÉE ET OPTIMISÉE
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  LocalHospital as HospitalIcon,
  AccessTime as TimeIcon,
  PriorityHigh as PriorityIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  MedicalServices as MedicalIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { fr } from 'date-fns/locale';
import { format, parseISO, isToday, isValid, differenceInMinutes } from 'date-fns';

// Import API - Version corrigée
import api from '../../services/api';
const { consultations, prestataires } = api;

// ==============================================
// CONSTANTES ET FONCTIONS UTILITAIRES
// ==============================================

const STATUS_OPTIONS = [
  { value: 'en_attente', label: 'En attente', color: 'warning', icon: TimeIcon },
  { value: 'en_cours', label: 'En cours', color: 'primary', icon: MedicalIcon },
  { value: 'traite', label: 'Traité', color: 'success', icon: CheckCircleIcon },
  { value: 'transfere', label: 'Transféré', color: 'info', icon: InfoIcon },
  { value: 'decede', label: 'Décédé', color: 'error', icon: ErrorIcon },
  { value: 'abandon', label: 'Abandon', color: 'default', icon: CloseIcon }
];

const PRIORITY_OPTIONS = [
  { value: 1, label: 'URGENT ABSOLU', color: 'error', icon: PriorityIcon },
  { value: 2, label: 'Urgent', color: 'warning', icon: WarningIcon },
  { value: 3, label: 'Semi-urgent', color: 'info', icon: InfoIcon },
  { value: 4, label: 'Non urgent', color: 'success', icon: CheckCircleIcon }
];

const SERVICES = [
  'Général',
  'Chirurgie',
  'Pédiatrie',
  'Gynécologie',
  'Traumatologie',
  'Cardiologie',
  'Neurologie',
  'Psychiatrie'
];

// Fonctions utilitaires
const getSafeDate = (dateString, defaultValue = new Date()) => {
  if (!dateString) return defaultValue;
  try {
    const parsed = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return isValid(parsed) ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
};

const formatSafeDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return 'N/A';
  try {
    const dateObj = getSafeDate(date);
    return format(dateObj, formatStr);
  } catch {
    return 'N/A';
  }
};

const getSafeValue = (value, defaultValue = '') => {
  if (value === undefined || value === null) return defaultValue;
  return value;
};

const calculateWaitingTime = (arrivalTime) => {
  if (!arrivalTime) return null;
  
  try {
    const arrival = getSafeDate(arrivalTime);
    const now = new Date();
    const diffMinutes = differenceInMinutes(now, arrival);
    
    if (isNaN(diffMinutes) || diffMinutes < 0) return null;
    
    return diffMinutes;
  } catch {
    return null;
  }
};

// ==============================================
// COMPOSANTS RÉUTILISABLES
// ==============================================

const UrgenceStatusChip = ({ status }) => {
  const config = STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[0];
  const IconComponent = config.icon;
  
  return (
    <Chip
      icon={<IconComponent />}
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
    />
  );
};

const PriorityChip = ({ priority }) => {
  const safePriority = getSafeValue(priority, 3);
  const config = PRIORITY_OPTIONS.find(opt => opt.value === safePriority) || PRIORITY_OPTIONS[2];
  const IconComponent = config.icon;
  
  return (
    <Chip
      icon={<IconComponent />}
      label={config.label}
      color={config.color}
      size="small"
      sx={{ fontWeight: 'bold' }}
    />
  );
};

const WaitingTimeChip = ({ arrivalTime }) => {
  const diffMinutes = calculateWaitingTime(arrivalTime);
  
  if (diffMinutes === null) {
    return <Chip label="N/A" size="small" color="default" />;
  }
  
  let color = 'success';
  let label = `${diffMinutes} min`;
  
  if (diffMinutes > 120) {
    color = 'error';
  } else if (diffMinutes > 60) {
    color = 'warning';
  } else if (diffMinutes > 30) {
    color = 'info';
  }
  
  return <Chip label={label} color={color} size="small" />;
};

const StatusSelector = ({ value, onChange, disabled = false, size = 'small' }) => {
  return (
    <FormControl size={size} sx={{ minWidth: 120 }}>
      <Select
        value={value}
        onChange={onChange}
        disabled={disabled}
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center'
          }
        }}
      >
        {STATUS_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <MenuItem key={option.value} value={option.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon fontSize="small" color={option.color} />
                <Typography>{option.label}</Typography>
              </Box>
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

const PrioritySelector = ({ value, onChange, disabled = false, size = 'small' }) => {
  return (
    <FormControl size={size} sx={{ minWidth: 140 }}>
      <Select
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {PRIORITY_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <MenuItem key={option.value} value={option.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon fontSize="small" color={option.color} />
                <Typography>{option.label}</Typography>
              </Box>
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

// ==============================================
// DIALOG DE DÉTAILS D'URGENCE
// ==============================================

const UrgenceDetailDialog = ({ 
  open, 
  onClose, 
  urgence, 
  onStatusChange,
  onPriorityChange 
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  if (!urgence) return null;

  const formatFullDate = (date, heure) => {
    try {
      const dateStr = format(getSafeDate(date), "yyyy-MM-dd");
      const timeStr = heure || '00:00:00';
      return format(getSafeDate(`${dateStr}T${timeStr}`), "dd/MM/yyyy HH:mm");
    } catch {
      return 'N/A';
    }
  };

  const handleLocalStatusChange = (event) => {
    const newStatus = event.target.value;
    if (onStatusChange && urgence?.id) {
      onStatusChange(urgence.id, newStatus);
    }
  };

  const handleLocalPriorityChange = (event) => {
    const newPriority = parseInt(event.target.value);
    if (onPriorityChange && urgence?.id) {
      onPriorityChange(urgence.id, newPriority);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssignmentIcon />
        Détails de l'Urgence
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Actions rapides */}
          <Grid item xs={12}>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Actions rapides
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Changer le statut</InputLabel>
                    <StatusSelector
                      value={urgence.statut || 'en_attente'}
                      onChange={handleLocalStatusChange}
                      size="small"
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Changer la priorité</InputLabel>
                    <PrioritySelector
                      value={urgence.priorite || 3}
                      onChange={handleLocalPriorityChange}
                      size="small"
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* En-tête avec infos patient */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                {getSafeValue(urgence.patient_prenom).charAt(0)}{getSafeValue(urgence.patient_nom).charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {getSafeValue(urgence.patient_prenom)} {getSafeValue(urgence.patient_nom)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {getSafeValue(urgence.patient_id, 'N/A')}
                </Typography>
              </Box>
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                <UrgenceStatusChip status={urgence.statut} />
                <PriorityChip priority={urgence.priorite} />
              </Box>
            </Box>
          </Grid>

          {/* Informations d'Admission */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              <TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Informations d'Admission
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Date et heure d'arrivée" 
                  secondary={formatFullDate(urgence.date_arrivee, urgence.heure_arrivee)}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Temps d'attente" 
                  secondary={<WaitingTimeChip arrivalTime={urgence.date_arrivee} />}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Service" 
                  secondary={getSafeValue(urgence.service, 'Non spécifié')}
                />
              </ListItem>
            </List>
          </Grid>

          {/* Évaluation Médicale */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              <MedicalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Évaluation Médicale
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Motif de consultation" 
                  secondary={getSafeValue(urgence.motif, 'Non spécifié')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Symptômes" 
                  secondary={getSafeValue(urgence.symptomes, 'Non spécifié')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Gravité" 
                  secondary={getSafeValue(urgence.gravite, 'Non évaluée')}
                />
              </ListItem>
            </List>
          </Grid>

          {/* Personnel Médical */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Personnel Médical
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Médecin traitant" 
                  secondary={getSafeValue(urgence.medecin_nom, 'Non affecté')}
                />
              </ListItem>
            </List>
          </Grid>

          {/* Informations Complémentaires */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Informations Complémentaires
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Notes" 
                  secondary={getSafeValue(urgence.notes, 'Aucune note')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Dernière mise à jour" 
                  secondary={formatSafeDate(urgence.updated_at, 'dd/MM/yyyy HH:mm')}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==============================================
// DIALOG DE CRÉATION/MODIFICATION D'URGENCE
// ==============================================

const UrgenceDialog = ({ open, onClose, onSave, initialData }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isEdit = Boolean(initialData?.id);
  
  const [formData, setFormData] = useState({
    id: '',
    patient_id: '',
    patient_nom: '',
    patient_prenom: '',
    date_arrivee: new Date(),
    heure_arrivee: new Date(),
    motif: '',
    symptomes: '',
    gravite: 3,
    priorite: 3,
    medecin_id: '',
    medecin_nom: '',
    service: 'Général',
    notes: '',
    statut: 'en_attente'
  });
  
  const [patientsList, setPatientsList] = useState([]);
  const [medecinsList, setMedecinsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingMedecins, setLoadingMedecins] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMedecin, setSearchMedecin] = useState('');

  // Initialisation des données
  useEffect(() => {
    if (initialData) {
      const dateArrivee = getSafeDate(initialData.date_arrivee);
      let heureArrivee = new Date();
      
      try {
        if (initialData.heure_arrivee) {
          const [hours, minutes] = initialData.heure_arrivee.split(':');
          heureArrivee.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);
        }
      } catch (error) {
        console.error('Erreur parsing heure:', error);
      }

      setFormData({
        id: getSafeValue(initialData.id),
        patient_id: getSafeValue(initialData.patient_id),
        patient_nom: getSafeValue(initialData.patient_nom),
        patient_prenom: getSafeValue(initialData.patient_prenom),
        date_arrivee: dateArrivee,
        heure_arrivee: heureArrivee,
        motif: getSafeValue(initialData.motif),
        symptomes: getSafeValue(initialData.symptomes),
        gravite: getSafeValue(initialData.gravite, 3),
        priorite: getSafeValue(initialData.priorite, 3),
        medecin_id: getSafeValue(initialData.medecin_id),
        medecin_nom: getSafeValue(initialData.medecin_nom),
        service: getSafeValue(initialData.service, 'Général'),
        notes: getSafeValue(initialData.notes),
        statut: getSafeValue(initialData.statut, 'en_attente')
      });
    } else {
      // Réinitialiser pour une nouvelle urgence
      setFormData({
        id: '',
        patient_id: '',
        patient_nom: '',
        patient_prenom: '',
        date_arrivee: new Date(),
        heure_arrivee: new Date(),
        motif: '',
        symptomes: '',
        gravite: 3,
        priorite: 3,
        medecin_id: '',
        medecin_nom: '',
        service: 'Général',
        notes: '',
        statut: 'en_attente'
      });
      setPatientsList([]);
      setMedecinsList([]);
      setSearchTerm('');
      setSearchMedecin('');
    }
  }, [initialData]);

  // Recherche des patients
  useEffect(() => {
    const searchPatients = async () => {
      if (searchTerm.length < 2) {
        setPatientsList([]);
        return;
      }
      
      setLoadingPatients(true);
      try {
        const response = await consultations.searchPatientsAdvanced(searchTerm, {}, 10, 1);
        if (response.success) {
          const patients = response.beneficiaires || response.patients || [];
          setPatientsList(patients.map(p => ({
            id: p.id || p.ID_BEN,
            nom: p.nom || p.NOM_BEN,
            prenom: p.prenom || p.PRE_BEN,
            identifiant: p.identifiant || p.IDENTIFIANT_NATIONAL,
            date_naissance: p.date_naissance || p.NAI_BEN
          })));
        }
      } catch (error) {
        console.error('Erreur recherche patients:', error);
      } finally {
        setLoadingPatients(false);
      }
    };
    
    const timer = setTimeout(searchPatients, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Recherche des médecins
  useEffect(() => {
    const searchMedecins = async () => {
      if (searchMedecin.length < 2) {
        setMedecinsList([]);
        return;
      }
      
      setLoadingMedecins(true);
      try {
        const response = await prestataires.searchQuick(searchMedecin, 10);
        if (response.success) {
          const medecins = response.prestataires || [];
          setMedecinsList(medecins.map(m => ({
            id: m.id || m.COD_PRE,
            nom: m.nom || m.NOM_PRESTATAIRE,
            prenom: m.prenom || m.PRENOM_PRESTATAIRE,
            nom_complet: m.nom_complet || `${m.prenom || m.PRENOM_PRESTATAIRE} ${m.nom || m.NOM_PRESTATAIRE}`,
            specialite: m.specialite || m.SPECIALITE
          })));
        }
      } catch (error) {
        console.error('Erreur recherche médecins:', error);
      } finally {
        setLoadingMedecins(false);
      }
    };
    
    const timer = setTimeout(searchMedecins, 500);
    return () => clearTimeout(timer);
  }, [searchMedecin]);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleDateChange = (field) => (newValue) => {
    if (newValue && isValid(newValue)) {
      setFormData(prev => ({
        ...prev,
        [field]: newValue
      }));
    }
  };

  const handlePatientSelect = (patient) => {
    setFormData(prev => ({
      ...prev,
      patient_id: patient.id,
      patient_nom: getSafeValue(patient.nom),
      patient_prenom: getSafeValue(patient.prenom)
    }));
    setPatientsList([]);
    setSearchTerm('');
  };

  const handleMedecinSelect = (medecin) => {
    setFormData(prev => ({
      ...prev,
      medecin_id: medecin.id,
      medecin_nom: medecin.nom_complet
    }));
    setMedecinsList([]);
    setSearchMedecin('');
  };

  const handleClearPatient = () => {
    setFormData(prev => ({
      ...prev,
      patient_id: '',
      patient_nom: '',
      patient_prenom: ''
    }));
    setSearchTerm('');
  };

  const handleClearMedecin = () => {
    setFormData(prev => ({
      ...prev,
      medecin_id: '',
      medecin_nom: ''
    }));
    setSearchMedecin('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const urgenceData = {
        ...formData,
        date_arrivee: format(formData.date_arrivee, 'yyyy-MM-dd'),
        heure_arrivee: format(formData.heure_arrivee, 'HH:mm:ss'),
        type_consultation: 'urgence',
        is_urgence: true
      };
      
      await onSave(urgenceData, isEdit);
      onClose();
    } catch (error) {
      console.error('Erreur sauvegarde urgence:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        {isEdit ? 'Modifier une Urgence' : 'Nouvelle Admission aux Urgences'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Section Patient */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Informations du Patient
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Patient sélectionné */}
              {formData.patient_id ? (
                <Paper sx={{ p: 2, flex: 1, minWidth: 200, bgcolor: 'action.hover' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getSafeValue(formData.patient_prenom).charAt(0)}{getSafeValue(formData.patient_nom).charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {getSafeValue(formData.patient_prenom)} {getSafeValue(formData.patient_nom)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {getSafeValue(formData.patient_id, 'N/A')}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={handleClearPatient} color="error">
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </Paper>
              ) : (
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <TextField
                    label="Rechercher un patient"
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nom, prénom ou identifiant"
                    size="small"
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                      endAdornment: loadingPatients && <CircularProgress size={20} />
                    }}
                  />
                  {patientsList.length > 0 && (
                    <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider' }}>
                      <List dense>
                        {patientsList.map(patient => (
                          <ListItem key={patient.id} disablePadding>
                            <ListItemButton
                              onClick={() => handlePatientSelect(patient)}
                              sx={{ borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}
                            >
                              <ListItemAvatar>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                  {getSafeValue(patient.prenom).charAt(0)}{getSafeValue(patient.nom).charAt(0)}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={`${getSafeValue(patient.prenom)} ${getSafeValue(patient.nom)}`}
                                secondary={`ID: ${getSafeValue(patient.identifiant)}`}
                              />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Section Admission */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Admission
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                  <DatePicker
                    label="Date d'arrivée"
                    value={formData.date_arrivee}
                    onChange={handleDateChange('date_arrivee')}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                  <TimePicker
                    label="Heure d'arrivée"
                    value={formData.heure_arrivee}
                    onChange={handleDateChange('heure_arrivee')}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Grid>

          {/* Section Évaluation */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Évaluation Médicale
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Gravité"
                  fullWidth
                  value={formData.gravite}
                  onChange={handleChange('gravite')}
                  size="small"
                >
                  <MenuItem value={1}>Critique</MenuItem>
                  <MenuItem value={2}>Sévère</MenuItem>
                  <MenuItem value={3}>Modérée</MenuItem>
                  <MenuItem value={4}>Légère</MenuItem>
                  <MenuItem value={5}>Minime</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Priorité"
                  fullWidth
                  value={formData.priorite}
                  onChange={handleChange('priorite')}
                  size="small"
                >
                  {PRIORITY_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Motif de consultation"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.motif}
                  onChange={handleChange('motif')}
                  size="small"
                  placeholder="Description du motif principal"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Symptômes"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.symptomes}
                  onChange={handleChange('symptomes')}
                  size="small"
                  placeholder="Symptômes présentés par le patient"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Section Affectation */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Affectation
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box>
                  {/* Médecin sélectionné */}
                  {formData.medecin_id ? (
                    <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            {getSafeValue(formData.medecin_nom).split(' ').map(n => n.charAt(0)).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {formData.medecin_nom}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton size="small" onClick={handleClearMedecin} color="error">
                          <CloseIcon />
                        </IconButton>
                      </Box>
                    </Paper>
                  ) : (
                    <>
                      <TextField
                        label="Rechercher un médecin"
                        fullWidth
                        value={searchMedecin}
                        onChange={(e) => setSearchMedecin(e.target.value)}
                        placeholder="Nom du médecin"
                        size="small"
                        InputProps={{
                          startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                          endAdornment: loadingMedecins && <CircularProgress size={20} />
                        }}
                      />
                      {medecinsList.length > 0 && (
                        <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider' }}>
                          <List dense>
                            {medecinsList.map(medecin => (
                              <ListItem key={medecin.id} disablePadding>
                                <ListItemButton
                                  onClick={() => handleMedecinSelect(medecin)}
                                  sx={{ borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}
                                >
                                  <ListItemAvatar>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                      {getSafeValue(medecin.prenom).charAt(0)}{getSafeValue(medecin.nom).charAt(0)}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={medecin.nom_complet}
                                    secondary={getSafeValue(medecin.specialite, 'Spécialité non définie')}
                                  />
                                </ListItemButton>
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      )}
                    </>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Service"
                  fullWidth
                  value={formData.service}
                  onChange={handleChange('service')}
                  size="small"
                >
                  {SERVICES.map(service => (
                    <MenuItem key={service} value={service}>
                      {service}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes supplémentaires"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.notes}
                  onChange={handleChange('notes')}
                  size="small"
                  placeholder="Informations complémentaires"
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={isEdit ? <EditIcon /> : <AddIcon />}
          disabled={loading || !formData.patient_nom || !formData.motif}
        >
          {loading ? 'Enregistrement...' : (isEdit ? 'Modifier' : 'Enregistrer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==============================================
// PAGE PRINCIPALE DES URGENCES
// ==============================================

const UrgencesPage = () => {
  const theme = useTheme();
  
  // États principaux
  const [urgences, setUrgences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour les dialogues
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUrgence, setSelectedUrgence] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  // États pour la pagination et le tri
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('date_arrivee');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    statut: 'tous',
    priorite: 'tous',
    service: 'tous',
    dateDebut: null,
    dateFin: null,
    search: ''
  });
  
  // États pour les notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [updatingStatus, setUpdatingStatus] = useState({});
  const [updatingPriority, setUpdatingPriority] = useState({});

  // Chargement des urgences
  const loadUrgences = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = {};
      
      if (filters.dateDebut) {
        queryParams.date_debut = format(filters.dateDebut, 'yyyy-MM-dd');
      }
      
      if (filters.dateFin) {
        queryParams.date_fin = format(filters.dateFin, 'yyyy-MM-dd');
      }
      
      queryParams.is_urgence = true;
      queryParams.type_consultation = 'urgence';
      
      const response = await consultations.getAllConsultations(queryParams);
      
      if (response.success) {
        const urgencesList = (response.consultations || []).map(cons => {
          const dateArrivee = getSafeDate(
            cons.DATE_CONSULTATION || cons.date_arrivee || cons.date_consultation,
            new Date()
          );
          
          const heureArrivee = cons.HEURE_CONSULTATION || 
                               cons.heure_arrivee || 
                               cons.heure_consultation || 
                               format(dateArrivee, 'HH:mm:ss');
          
          return {
            id: getSafeValue(cons.COD_CONS || cons.id || cons.ID_CONSULTATION, Date.now()),
            patient_id: getSafeValue(cons.ID_BEN || cons.patient_id || cons.COD_BEN),
            patient_nom: getSafeValue(cons.NOM_BEN || cons.patient_nom || cons.nom_patient, 'Inconnu'),
            patient_prenom: getSafeValue(cons.PRE_BEN || cons.patient_prenom || cons.prenom_patient, ''),
            date_arrivee: dateArrivee.toISOString(),
            heure_arrivee: heureArrivee,
            motif: getSafeValue(cons.MOTIF_CONSULTATION || cons.motif, 'Non spécifié'),
            symptomes: getSafeValue(cons.SYMPTOMES || cons.symptomes, ''),
            gravite: getSafeValue(cons.GRAVITE || cons.gravite, 3),
            priorite: getSafeValue(cons.PRIORITE || cons.priorite, 3),
            medecin_id: getSafeValue(cons.COD_MED || cons.medecin_id),
            medecin_nom: getSafeValue(cons.NOM_MEDECIN || cons.medecin_nom || cons.nom_medecin, 'Non affecté'),
            service: getSafeValue(cons.SERVICE || cons.service, 'Général'),
            notes: getSafeValue(cons.OBSERVATIONS || cons.notes, ''),
            statut: getSafeValue(cons.STATUT_CONSULTATION || cons.statut || cons.statut_consultation, 'en_attente'),
            created_at: getSafeValue(cons.DAT_CREUTIL || cons.created_at, new Date().toISOString()),
            updated_at: getSafeValue(cons.DAT_MODUTIL || cons.updated_at, new Date().toISOString())
          };
        });
        
        setUrgences(urgencesList);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des urgences');
      }
    } catch (error) {
      console.error('Erreur chargement urgences:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [filters.dateDebut, filters.dateFin]);

  // Calcul des statistiques
  const stats = useMemo(() => {
    const statsData = {
      total: urgences.length,
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
    };

    urgences.forEach(urgence => {
      const statut = getSafeValue(urgence.statut, 'en_attente');
      const priorite = getSafeValue(urgence.priorite, 3);
      
      if (statsData[statut] !== undefined) {
        statsData[statut] = (statsData[statut] || 0) + 1;
      }
      
      switch (priorite) {
        case 1: statsData.urgent_absolu++; break;
        case 2: statsData.urgent++; break;
        case 3: statsData.semi_urgent++; break;
        case 4: statsData.non_urgent++; break;
      }
    });

    return statsData;
  }, [urgences]);

  // Application des filtres et tri
  const filteredUrgences = useMemo(() => {
    let filtered = [...urgences];
    
    // Filtre par statut
    if (filters.statut !== 'tous') {
      filtered = filtered.filter(u => getSafeValue(u.statut) === filters.statut);
    }
    
    // Filtre par priorité
    if (filters.priorite !== 'tous') {
      filtered = filtered.filter(u => getSafeValue(u.priorite, 3) === parseInt(filters.priorite));
    }
    
    // Filtre par service
    if (filters.service !== 'tous') {
      filtered = filtered.filter(u => getSafeValue(u.service) === filters.service);
    }
    
    // Filtre par date
    if (filters.dateDebut) {
      const dateDebut = getSafeDate(filters.dateDebut);
      filtered = filtered.filter(u => {
        const dateUrgence = getSafeDate(u.date_arrivee);
        return dateUrgence >= dateDebut;
      });
    }
    
    if (filters.dateFin) {
      const dateFin = getSafeDate(filters.dateFin);
      dateFin.setHours(23, 59, 59, 999);
      filtered = filtered.filter(u => {
        const dateUrgence = getSafeDate(u.date_arrivee);
        return dateUrgence <= dateFin;
      });
    }
    
    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(u => {
        const nom = getSafeValue(u.patient_nom, '').toLowerCase();
        const prenom = getSafeValue(u.patient_prenom, '').toLowerCase();
        const motif = getSafeValue(u.motif, '').toLowerCase();
        const service = getSafeValue(u.service, '').toLowerCase();
        const medecin = getSafeValue(u.medecin_nom, '').toLowerCase();
        
        return nom.includes(searchLower) ||
               prenom.includes(searchLower) ||
               motif.includes(searchLower) ||
               service.includes(searchLower) ||
               medecin.includes(searchLower);
      });
    }
    
    // Trier
    filtered.sort((a, b) => {
      const aValue = getSafeValue(a[sortField]);
      const bValue = getSafeValue(b[sortField]);
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [urgences, filters, sortField, sortDirection]);

  // Pagination
  const paginatedUrgences = useMemo(() => {
    return filteredUrgences.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredUrgences, page, rowsPerPage]);

  // Gestion des urgences
  const handleCreateUrgence = () => {
    setSelectedUrgence(null);
    setDialogOpen(true);
  };

  const handleEditUrgence = (urgence) => {
    setSelectedUrgence(urgence);
    setDialogOpen(true);
  };

  const handleViewUrgence = (urgence) => {
    setSelectedUrgence(urgence);
    setDetailDialogOpen(true);
  };

  const handleDeleteUrgence = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette urgence ?')) {
      try {
        setUrgences(prev => prev.filter(u => u.id !== id));
        showSnackbar('Urgence supprimée avec succès', 'success');
      } catch (error) {
        console.error('Erreur suppression urgence:', error);
        showSnackbar('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleSaveUrgence = async (urgenceData, isEdit) => {
    try {
      if (isEdit) {
        setUrgences(prev => prev.map(u => 
          u.id === urgenceData.id ? { 
            ...u, 
            ...urgenceData,
            updated_at: new Date().toISOString()
          } : u
        ));
        showSnackbar('Urgence modifiée avec succès', 'success');
      } else {
        const newUrgence = {
          ...urgenceData,
          id: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUrgences(prev => [newUrgence, ...prev]);
        showSnackbar('Urgence créée avec succès', 'success');
      }
    } catch (error) {
      console.error('Erreur sauvegarde urgence:', error);
      showSnackbar('Erreur lors de la sauvegarde', 'error');
      throw error;
    }
  };

  // Gestion des changements de statut
  const handleStatusChange = async (urgenceId, newStatus) => {
    let oldStatus;
    try {
      const urgenceToUpdate = urgences.find(u => u.id === urgenceId);
      if (!urgenceToUpdate) return;

      oldStatus = urgenceToUpdate.statut;
      
      // Mettre à jour l'état local
      const updatedUrgence = {
        ...urgenceToUpdate,
        statut: newStatus,
        updated_at: new Date().toISOString()
      };
      
      setUrgences(prev => prev.map(u => 
        u.id === urgenceId ? updatedUrgence : u
      ));

      setUpdatingStatus(prev => ({ ...prev, [urgenceId]: true }));

      // Préparer les données pour le backend
      const updateData = {
        STATUT_CONSULTATION: newStatus,
        OBSERVATIONS: `${urgenceToUpdate.notes || ''} | Statut changé de ${oldStatus} à ${newStatus} - ${new Date().toLocaleString()}`,
        id: urgenceId,
        COD_CONS: urgenceId,
        PRIORITE: urgenceToUpdate.priorite || 3
      };

      const response = await consultations.update(urgenceId, updateData);

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la mise à jour');
      }

      showSnackbar('Statut mis à jour avec succès', 'success');

    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      // Revenir à l'ancien statut en cas d'erreur
      if (oldStatus) {
        setUrgences(prev => prev.map(u => 
          u.id === urgenceId ? { ...u, statut: oldStatus } : u
        ));
      }
      showSnackbar(`Erreur: ${error.message}`, 'error');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [urgenceId]: false }));
    }
  };

  // Gestion des changements de priorité
  const handlePriorityChange = async (urgenceId, newPriority) => {
    let oldPriority;
    try {
      const urgenceToUpdate = urgences.find(u => u.id === urgenceId);
      if (!urgenceToUpdate) return;

      oldPriority = urgenceToUpdate.priorite;
      
      // Mettre à jour l'état local
      const updatedUrgence = {
        ...urgenceToUpdate,
        priorite: parseInt(newPriority),
        updated_at: new Date().toISOString()
      };
      
      setUrgences(prev => prev.map(u => 
        u.id === urgenceId ? updatedUrgence : u
      ));

      setUpdatingPriority(prev => ({ ...prev, [urgenceId]: true }));

      // Préparer les données pour le backend
      const updateData = {
        PRIORITE: parseInt(newPriority),
        OBSERVATIONS: `${urgenceToUpdate.notes || ''} | Priorité changée de ${oldPriority} à ${newPriority} - ${new Date().toLocaleString()}`,
        STATUT_CONSULTATION: urgenceToUpdate.statut || 'en_attente',
        MOTIF_CONSULTATION: urgenceToUpdate.motif || '',
        id: urgenceId,
        COD_CONS: urgenceId
      };

      const response = await consultations.update(urgenceId, updateData);

      if (response.success) {
        showSnackbar('Priorité mise à jour avec succès', 'success');
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour');
      }

    } catch (error) {
      console.error('Erreur mise à jour priorité:', error);
      // Revenir à l'ancienne priorité en cas d'erreur
      if (oldPriority !== undefined) {
        setUrgences(prev => prev.map(u => 
          u.id === urgenceId ? { ...u, priorite: oldPriority } : u
        ));
      }
      showSnackbar(`Erreur: ${error.message}`, 'error');
    } finally {
      setUpdatingPriority(prev => ({ ...prev, [urgenceId]: false }));
    }
  };

  // Gestion de la pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Gestion du tri
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Gestion des filtres
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0); // Réinitialiser la pagination lors du changement de filtre
  };

  const handleRefresh = () => {
    loadUrgences();
  };

  // Gestion des notifications
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Effets
  useEffect(() => {
    loadUrgences();
  }, [loadUrgences]);

  // Composant des statistiques
  const renderStatsCards = () => {
    const statCards = [
      {
        title: 'Total Urgences',
        value: stats.total,
        color: 'primary.main',
        icon: <HospitalIcon />
      },
      {
        title: 'En Attente',
        value: stats.en_attente,
        color: 'warning.main',
        icon: <TimeIcon />
      },
      {
        title: 'En Cours',
        value: stats.en_cours,
        color: 'info.main',
        icon: <MedicalIcon />
      },
      {
        title: 'Traitées',
        value: stats.traite,
        color: 'success.main',
        icon: <CheckCircleIcon />
      },
      {
        title: 'Urgent Absolu',
        value: stats.urgent_absolu,
        color: 'error.main',
        icon: <PriorityIcon />
      }
    ];

    return (
      <Grid container spacing={2}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: card.color, color: 'white', width: 40, height: 40 }}>
                    {card.icon}
                  </Avatar>
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Composant du tableau des urgences
  const renderUrgencesTable = () => {
    if (loading) {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>
            Chargement des urgences...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }

    if (filteredUrgences.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucune urgence trouvée avec les critères actuels.
        </Alert>
      );
    }

    return (
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => handleSort('patient_nom')}>
                    Patient
                  </Box>
                </TableCell>
                <TableCell>Arrivée</TableCell>
                <TableCell>Motif</TableCell>
                <TableCell>Priorité</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Médecin</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUrgences.map((urgence) => {
                const patientNom = getSafeValue(urgence.patient_nom, 'Inconnu');
                const patientPrenom = getSafeValue(urgence.patient_prenom, '');
                const dateArrivee = getSafeDate(urgence.date_arrivee);
                const heureArrivee = getSafeValue(urgence.heure_arrivee, '');
                const motif = getSafeValue(urgence.motif, 'Non spécifié');
                const symptomes = getSafeValue(urgence.symptomes, '');
                const priorite = getSafeValue(urgence.priorite, 3);
                const service = getSafeValue(urgence.service, 'Général');
                const statut = getSafeValue(urgence.statut, 'en_attente');
                const medecinNom = getSafeValue(urgence.medecin_nom, 'Non affecté');
                
                const arrivalTime = dateArrivee && heureArrivee 
                  ? `${format(dateArrivee, 'yyyy-MM-dd')}T${heureArrivee}`
                  : null;
                
                const isRecent = isToday(dateArrivee);
                
                return (
                  <TableRow 
                    key={urgence.id}
                    hover
                    sx={{ 
                      bgcolor: isRecent ? 'action.hover' : 'inherit',
                      '&:hover': { bgcolor: 'action.selected' }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {patientPrenom.charAt(0)}{patientNom.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {patientPrenom} {patientNom}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {urgence.patient_id || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {formatSafeDate(dateArrivee, 'dd/MM/yyyy')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {heureArrivee ? heureArrivee.substring(0, 5) : 'N/A'}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <WaitingTimeChip arrivalTime={arrivalTime} />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Tooltip title={motif}>
                        <Typography variant="body2" noWrap>
                          {motif}
                        </Typography>
                      </Tooltip>
                      {symptomes && (
                        <Typography variant="caption" color="text.secondary" display="block" noWrap>
                          {symptomes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PrioritySelector
                          value={priorite}
                          onChange={(e) => handlePriorityChange(urgence.id, e.target.value)}
                          disabled={updatingPriority[urgence.id]}
                          size="small"
                        />
                        {updatingPriority[urgence.id] && (
                          <CircularProgress size={16} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={service} 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StatusSelector
                          value={statut}
                          onChange={(e) => handleStatusChange(urgence.id, e.target.value)}
                          disabled={updatingStatus[urgence.id]}
                          size="small"
                        />
                        {updatingStatus[urgence.id] && (
                          <CircularProgress size={16} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {medecinNom !== 'Non affecté' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main', fontSize: 12 }}>
                            {medecinNom.split(' ').map(n => n.charAt(0)).join('')}
                          </Avatar>
                          <Typography variant="body2">
                            {medecinNom}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Non affecté
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Voir les détails">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleViewUrgence(urgence)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditUrgence(urgence)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteUrgence(urgence.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredUrgences.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page :"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} sur ${count}`
          }
        />
      </Box>
    );
  };

  // Composant des filtres
  const renderFilters = () => {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Rechercher patient, motif, service..."
              size="small"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.statut}
                label="Statut"
                onChange={(e) => handleFilterChange('statut', e.target.value)}
              >
                <MenuItem value="tous">Tous</MenuItem>
                {STATUS_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Priorité</InputLabel>
              <Select
                value={filters.priorite}
                label="Priorité"
                onChange={(e) => handleFilterChange('priorite', e.target.value)}
              >
                <MenuItem value="tous">Toutes</MenuItem>
                {PRIORITY_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Service</InputLabel>
              <Select
                value={filters.service}
                label="Service"
                onChange={(e) => handleFilterChange('service', e.target.value)}
              >
                <MenuItem value="tous">Tous</MenuItem>
                {SERVICES.map(service => (
                  <MenuItem key={service} value={service}>
                    {service}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={1.5}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Du"
                value={filters.dateDebut}
                onChange={(newValue) => handleFilterChange('dateDebut', newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={6} md={1.5}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Au"
                value={filters.dateFin}
                onChange={(newValue) => handleFilterChange('dateFin', newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <HospitalIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              Gestion des Urgences
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Surveillance et gestion des admissions aux urgences en temps réel
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Actualiser
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateUrgence}
            >
              Nouvelle Admission
            </Button>
          </Box>
        </Box>
        
        {renderStatsCards()}
      </Box>

      {renderFilters()}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" component="h2">
            Liste des Urgences
            <Chip 
              label={filteredUrgences.length} 
              size="small" 
              color="primary" 
              sx={{ ml: 1 }} 
            />
          </Typography>
        </Box>
        
        {renderUrgencesTable()}
      </Paper>

      {/* Dialogues */}
      <UrgenceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveUrgence}
        initialData={selectedUrgence}
      />

      <UrgenceDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        urgence={selectedUrgence}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
      />

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UrgencesPage;