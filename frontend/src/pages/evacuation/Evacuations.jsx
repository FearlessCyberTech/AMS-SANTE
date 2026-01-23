import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Badge,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  InputAdornment,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FileDownload as DownloadIcon,
  AttachFile as AttachFileIcon,
  AirplanemodeActive as AirplaneIcon,
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
  Emergency as EmergencyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Sync as SyncIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Place as PlaceIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  TrendingUp as StatsIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { evacuationsAPI } from '../../services/api';

const UrgencesEvacuationsPage = () => {
  // ==============================================
  // ÉTATS PRINCIPAUX
  // ==============================================

  const [evacuations, setEvacuations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filtres
  const [filters, setFilters] = useState({
    search: '',
    statut: '',
    destination: '',
    date_debut: null,
    date_fin: null,
    gravite: '',
    patient_id: '',
    medecin_id: '',
    decision: '',
    moyen_transport: ''
  });
  
  // Dialogue et formulaire
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedEvacuation, setSelectedEvacuation] = useState(null);
  const [formData, setFormData] = useState({
    ID_BEN: '',
    ID_MEDECIN: '',
    DIAGNOSTIC: '',
    MOTIF_EVACUATION: '',
    URGENCE: true,
    GRAVITE: '3',
    OBSERVATIONS: '',
    RECOMMANDATIONS: '',
    DATE_DEMANDE: new Date(),
    DATE_DEPART: null,
    DESTINATION: '',
    HOPITAL_DESTINATION: '',
    ADRESSE_DESTINATION: '',
    TELEPHONE_DESTINATION: '',
    MEDECIN_REFERENT: '',
    ACCOMPAGNANTS: '',
    MOYEN_TRANSPORT: 'ambulance',
    TRANSPORT_SPECIAL: false,
    NUMERO_VOL: '',
    COMPAGNIE_AERIENNE: '',
    COUT_ESTIME: '',
    PRISE_EN_CHARGE: 100,
    STATUT: 'en_attente',
    DECISION: 'en_attente'
  });
  
  // Sous-composants (onglets)
  const [activeTab, setActiveTab] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [frais, setFrais] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  
  // Recherche de patients/médecins
  const [patientSearch, setPatientSearch] = useState('');
  const [patientOptions, setPatientOptions] = useState([]);
  const [medecinSearch, setMedecinSearch] = useState('');
  const [medecinOptions, setMedecinOptions] = useState([]);
  
  // Statistiques
  const [statistics, setStatistics] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ==============================================
  // FONCTIONS DE CHARGEMENT DES DONNÉES
  // ==============================================

  const loadEvacuations = useCallback(async () => {
    try {
      setLoading(true);
      
      // Préparer les filtres pour l'API
      const apiFilters = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      };
      
      // Nettoyer les filtres vides
      Object.keys(apiFilters).forEach(key => {
        if (apiFilters[key] === '' || apiFilters[key] === null || apiFilters[key] === undefined) {
          delete apiFilters[key];
        }
      });
      
      const response = await evacuationsAPI.getAll(apiFilters);
      
      if (response.success) {
        setEvacuations(response.evacuations || []);
        setTotalRows(response.pagination?.total || 0);
        setTotalPages(response.pagination?.totalPages || 0);
      } else {
        setError(response.message || 'Erreur lors du chargement des évacuations');
      }
    } catch (err) {
      console.error('Erreur chargement évacuations:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]);

  const loadStatistics = async () => {
    try {
      setStatsLoading(true);
      const response = await evacuationsAPI.getStatistics('month');
      if (response.success) {
        setStatistics(response.statistics);
      }
    } catch (err) {
      console.error('Erreur chargement statistiques:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadPatientOptions = async (searchTerm) => {
    if (searchTerm.length < 2) return;
    
    try {
      const response = await evacuationsAPI.searchPatients(searchTerm, 10);
      if (response.success) {
        setPatientOptions(response.patients || []);
      }
    } catch (err) {
      console.error('Erreur recherche patients:', err);
    }
  };

  const loadMedecinOptions = async (searchTerm) => {
    if (searchTerm.length < 2) return;
    
    try {
      // Utiliser l'API prestataires pour rechercher des médecins
      const response = await fetchAPI(`/prestataires/search?search=${encodeURIComponent(searchTerm)}&limit=10`);
      if (response.success) {
        setMedecinOptions(response.prestataires || []);
      }
    } catch (err) {
      console.error('Erreur recherche médecins:', err);
    }
  };

  const loadEvacuationDetails = async (id) => {
    try {
      const response = await evacuationsAPI.getById(id);
      if (response.success) {
        setSelectedEvacuation(response.evacuation);
        
        // Charger les données associées
        if (response.evacuation.documents) {
          setDocuments(response.evacuation.documents);
        }
        
        if (response.evacuation.frais) {
          setFrais(response.evacuation.frais);
        }
        
        // Charger le journal d'activités
        const activityResponse = await evacuationsAPI.getActivityLog(id);
        if (activityResponse.success) {
          setActivityLog(activityResponse.activities || []);
        }
      }
    } catch (err) {
      console.error('Erreur chargement détails:', err);
      setError('Erreur lors du chargement des détails');
    }
  };

  // ==============================================
  // EFFETS
  // ==============================================

  useEffect(() => {
    loadEvacuations();
    loadStatistics();
  }, [loadEvacuations]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (patientSearch) {
        loadPatientOptions(patientSearch);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [patientSearch]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (medecinSearch) {
        loadMedecinOptions(medecinSearch);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [medecinSearch]);

  // ==============================================
  // GESTION DES ÉVÉNEMENTS
  // ==============================================

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0); // Retour à la première page lors du filtrage
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      statut: '',
      destination: '',
      date_debut: null,
      date_fin: null,
      gravite: '',
      patient_id: '',
      medecin_id: '',
      decision: '',
      moyen_transport: ''
    });
    setPage(0);
  };

  const handleOpenDialog = (mode, evacuation = null) => {
    setDialogMode(mode);
    
    if (mode === 'create') {
      setFormData({
        ID_BEN: '',
        ID_MEDECIN: '',
        DIAGNOSTIC: '',
        MOTIF_EVACUATION: '',
        URGENCE: true,
        GRAVITE: '3',
        OBSERVATIONS: '',
        RECOMMANDATIONS: '',
        DATE_DEMANDE: new Date(),
        DATE_DEPART: null,
        DESTINATION: '',
        HOPITAL_DESTINATION: '',
        ADRESSE_DESTINATION: '',
        TELEPHONE_DESTINATION: '',
        MEDECIN_REFERENT: '',
        ACCOMPAGNANTS: '',
        MOYEN_TRANSPORT: 'ambulance',
        TRANSPORT_SPECIAL: false,
        NUMERO_VOL: '',
        COMPAGNIE_AERIENNE: '',
        COUT_ESTIME: '',
        PRISE_EN_CHARGE: 100,
        STATUT: 'en_attente',
        DECISION: 'en_attente'
      });
      setSelectedEvacuation(null);
    } else if (mode === 'edit' || mode === 'view') {
      if (evacuation) {
        setSelectedEvacuation(evacuation);
        setFormData({
          ID_BEN: evacuation.ID_BEN || '',
          ID_MEDECIN: evacuation.ID_MEDECIN || '',
          DIAGNOSTIC: evacuation.DIAGNOSTIC || '',
          MOTIF_EVACUATION: evacuation.MOTIF_EVACUATION || '',
          URGENCE: evacuation.URGENCE || true,
          GRAVITE: evacuation.GRAVITE || '3',
          OBSERVATIONS: evacuation.OBSERVATIONS || '',
          RECOMMANDATIONS: evacuation.RECOMMANDATIONS || '',
          DATE_DEMANDE: evacuation.DATE_DEMANDE ? new Date(evacuation.DATE_DEMANDE) : new Date(),
          DATE_DEPART: evacuation.DATE_DEPART ? new Date(evacuation.DATE_DEPART) : null,
          DESTINATION: evacuation.DESTINATION || '',
          HOPITAL_DESTINATION: evacuation.HOPITAL_DESTINATION || '',
          ADRESSE_DESTINATION: evacuation.ADRESSE_DESTINATION || '',
          TELEPHONE_DESTINATION: evacuation.TELEPHONE_DESTINATION || '',
          MEDECIN_REFERENT: evacuation.MEDECIN_REFERENT || '',
          ACCOMPAGNANTS: evacuation.ACCOMPAGNANTS || '',
          MOYEN_TRANSPORT: evacuation.MOYEN_TRANSPORT || 'ambulance',
          TRANSPORT_SPECIAL: evacuation.TRANSPORT_SPECIAL || false,
          NUMERO_VOL: evacuation.NUMERO_VOL || '',
          COMPAGNIE_AERIENNE: evacuation.COMPAGNIE_AERIENNE || '',
          COUT_ESTIME: evacuation.COUT_ESTIME || '',
          PRISE_EN_CHARGE: evacuation.PRISE_EN_CHARGE || 100,
          STATUT: evacuation.STATUT || 'en_attente',
          DECISION: evacuation.DECISION || 'en_attente'
        });
      }
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEvacuation(null);
    setFormData({
      ID_BEN: '',
      ID_MEDECIN: '',
      DIAGNOSTIC: '',
      MOTIF_EVACUATION: '',
      URGENCE: true,
      GRAVITE: '3',
      OBSERVATIONS: '',
      RECOMMANDATIONS: '',
      DATE_DEMANDE: new Date(),
      DATE_DEPART: null,
      DESTINATION: '',
      HOPITAL_DESTINATION: '',
      ADRESSE_DESTINATION: '',
      TELEPHONE_DESTINATION: '',
      MEDECIN_REFERENT: '',
      ACCOMPAGNANTS: '',
      MOYEN_TRANSPORT: 'ambulance',
      TRANSPORT_SPECIAL: false,
      NUMERO_VOL: '',
      COMPAGNIE_AERIENNE: '',
      COUT_ESTIME: '',
      PRISE_EN_CHARGE: 100,
      STATUT: 'en_attente',
      DECISION: 'en_attente'
    });
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'create') {
        const response = await evacuationsAPI.create(formData);
        if (response.success) {
          setSuccess('Évacuation créée avec succès');
          loadEvacuations();
          loadStatistics();
          handleCloseDialog();
        } else {
          setError(response.message || 'Erreur lors de la création');
        }
      } else if (dialogMode === 'edit' && selectedEvacuation) {
        const response = await evacuationsAPI.update(selectedEvacuation.id, formData);
        if (response.success) {
          setSuccess('Évacuation mise à jour avec succès');
          loadEvacuations();
          loadStatistics();
          handleCloseDialog();
        } else {
          setError(response.message || 'Erreur lors de la mise à jour');
        }
      }
    } catch (err) {
      console.error('Erreur soumission formulaire:', err);
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleUpdateStatus = async (id, newStatus, notes = '') => {
    try {
      const response = await evacuationsAPI.updateStatus(id, newStatus, notes);
      if (response.success) {
        setSuccess('Statut mis à jour avec succès');
        loadEvacuations();
        loadStatistics();
      } else {
        setError(response.message || 'Erreur lors de la mise à jour du statut');
      }
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const handleCancelEvacuation = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette évacuation ?')) {
      try {
        const raison = prompt('Veuillez indiquer la raison de l\'annulation :');
        if (raison) {
          const response = await evacuationsAPI.cancel(id, raison);
          if (response.success) {
            setSuccess('Évacuation annulée avec succès');
            loadEvacuations();
            loadStatistics();
          } else {
            setError(response.message || 'Erreur lors de l\'annulation');
          }
        }
      } catch (err) {
        console.error('Erreur annulation:', err);
        setError('Erreur lors de l\'annulation');
      }
    }
  };

  // ==============================================
  // FONCTIONS UTILITAIRES
  // ==============================================

  const getStatusChip = (status) => {
    const statusConfig = evacuationsAPI.getStatusDisplay(status);
    return (
      <Chip
        label={statusConfig.text}
        color={statusConfig.color}
        size="small"
        icon={React.createElement(statusConfig.icon === 'schedule' ? ScheduleIcon : 
                                statusConfig.icon === 'sync' ? SyncIcon :
                                statusConfig.icon === 'check_circle' ? CheckCircleIcon :
                                statusConfig.icon === 'cancel' ? CancelIcon :
                                statusConfig.icon === 'block' ? CancelIcon : ScheduleIcon)}
      />
    );
  };

  const getGraviteChip = (gravite) => {
    const graviteConfig = evacuationsAPI.getGraviteDisplay(gravite);
    return (
      <Chip
        label={graviteConfig.text}
        color={graviteConfig.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const getTransportIcon = (transport) => {
    switch (transport) {
      case 'avion': return <AirplaneIcon />;
      case 'helicoptere': return <AirplaneIcon />;
      case 'ambulance': return <HospitalIcon />;
      default: return <HospitalIcon />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 €';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // ==============================================
  // COMPOSANTS DE LA PAGE
  // ==============================================

  // Section Statistiques
  const StatisticsSection = () => {
    if (statsLoading) {
      return <CircularProgress size={24} />;
    }

    if (!statistics) return null;

    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatsIcon /> Statistiques des Évacuations
        </Typography>
        
        <Grid container spacing={3}>
          {/* Carte Totale */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total des Évacuations
                </Typography>
                <Typography variant="h4" component="div">
                  {statistics.general?.total || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Carte En attente */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  En Attente
                </Typography>
                <Typography variant="h4" component="div" color="warning.main">
                  {statistics.general?.en_attente || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Carte En cours */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  En Cours
                </Typography>
                <Typography variant="h4" component="div" color="info.main">
                  {statistics.general?.en_cours || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Carte Terminées */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Terminées
                </Typography>
                <Typography variant="h4" component="div" color="success.main">
                  {statistics.general?.terminees || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Graphique des statuts */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Répartition par Statut
                </Typography>
                <Grid container spacing={2}>
                  {['en_attente', 'en_cours', 'terminee', 'annulee', 'rejetee'].map((statut) => (
                    <Grid item xs key={statut}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="body2" color="textSecondary">
                          {evacuationsAPI.getStatusDisplay(statut).text}
                        </Typography>
                        <Typography variant="h6">
                          {statistics.general?.[statut] || 0}
                        </Typography>
                        <Box sx={{ width: '100%', mt: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={((statistics.general?.[statut] || 0) / (statistics.general?.total || 1)) * 100}
                            color={evacuationsAPI.getStatusDisplay(statut).color}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Section Filtres
  const FiltersSection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Rechercher"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              placeholder="Référence, patient, destination..."
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.statut}
                label="Statut"
                onChange={(e) => handleFilterChange('statut', e.target.value)}
              >
                <MenuItem value="">Tous</MenuItem>
                {evacuationsAPI.getStatusOptions().map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Gravité</InputLabel>
              <Select
                value={filters.gravite}
                label="Gravité"
                onChange={(e) => handleFilterChange('gravite', e.target.value)}
              >
                <MenuItem value="">Toutes</MenuItem>
                {evacuationsAPI.getGraviteOptions().map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Transport</InputLabel>
              <Select
                value={filters.moyen_transport}
                label="Transport"
                onChange={(e) => handleFilterChange('moyen_transport', e.target.value)}
              >
                <MenuItem value="">Tous</MenuItem>
                {evacuationsAPI.getTransportOptions().map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date début"
                value={filters.date_debut}
                onChange={(date) => handleFilterChange('date_debut', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date fin"
                value={filters.date_fin}
                onChange={(date) => handleFilterChange('date_fin', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Décision</InputLabel>
              <Select
                value={filters.decision}
                label="Décision"
                onChange={(e) => handleFilterChange('decision', e.target.value)}
              >
                <MenuItem value="">Toutes</MenuItem>
                {evacuationsAPI.getDecisionOptions().map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2} sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={resetFilters}
              fullWidth
            >
              Réinitialiser
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={loadEvacuations}
              fullWidth
            >
              Actualiser
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Tableau des évacuations
  const EvacuationsTable = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Liste des Évacuations ({totalRows})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('create')}
          >
            Nouvelle Évacuation
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Référence</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Destination</TableCell>
                <TableCell>Date Demande</TableCell>
                <TableCell>Gravité</TableCell>
                <TableCell>Transport</TableCell>
                <TableCell>Coût Estimé</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Décision</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : evacuations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    Aucune évacuation trouvée
                  </TableCell>
                </TableRow>
              ) : (
                evacuations.map((evacuation) => (
                  <TableRow key={evacuation.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {evacuation.REFERENCE}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {evacuation.patient_nom} {evacuation.patient_prenom}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {evacuation.patient_age} ans
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PlaceIcon fontSize="small" />
                        <Typography variant="body2">
                          {evacuation.DESTINATION}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {formatDate(evacuation.DATE_DEMANDE)}
                    </TableCell>
                    <TableCell>
                      {getGraviteChip(evacuation.GRAVITE)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getTransportIcon(evacuation.MOYEN_TRANSPORT)}
                        <Typography variant="body2">
                          {evacuation.MOYEN_TRANSPORT}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(evacuation.COUT_ESTIME)}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(evacuation.STATUT)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={evacuationsAPI.getDecisionDisplay(evacuation.DECISION).text}
                        size="small"
                        color={evacuationsAPI.getDecisionDisplay(evacuation.DECISION).color}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Voir détails">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('view', evacuation)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('edit', evacuation)}
                            disabled={evacuation.STATUT === 'terminee'}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Annuler">
                          <IconButton
                            size="small"
                            onClick={() => handleCancelEvacuation(evacuation.id)}
                            disabled={evacuation.STATUT === 'terminee' || evacuation.STATUT === 'annulee'}
                            color="error"
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalRows}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="Lignes par page"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      </CardContent>
    </Card>
  );

  // Dialogue de formulaire
  const EvacuationDialog = () => {
    const isViewMode = dialogMode === 'view';
    const isEditMode = dialogMode === 'edit';
    const isCreateMode = dialogMode === 'create';

    return (
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmergencyIcon />
            {isCreateMode && 'Nouvelle Évacuation'}
            {isEditMode && `Modifier l'Évacuation ${selectedEvacuation?.REFERENCE}`}
            {isViewMode && `Détails de l'Évacuation ${selectedEvacuation?.REFERENCE}`}
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="Informations Générales" />
            <Tab label="Informations Médicales" />
            <Tab label="Logistique & Transport" />
            <Tab label="Documents & Frais" />
          </Tabs>

          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Colonne gauche - Informations patient */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Informations Patient
                </Typography>
                
                <Autocomplete
                  options={patientOptions}
                  loading={patientSearch.length > 0 && patientOptions.length === 0}
                  value={patientOptions.find(p => p.id === formData.ID_BEN) || null}
                  onInputChange={(event, newValue) => setPatientSearch(newValue)}
                  onChange={(event, newValue) => {
                    handleFormChange('ID_BEN', newValue?.id || '');
                  }}
                  getOptionLabel={(option) => 
                    `${option.prenom} ${option.nom} - ${option.identifiant || ''} (${option.age || 'N/A'} ans)`
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Patient *"
                      required
                      disabled={isViewMode}
                      helperText="Rechercher par nom, prénom ou identifiant"
                    />
                  )}
                />

                {selectedEvacuation?.patient_nom && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Informations du patient sélectionné:
                    </Typography>
                    <Typography variant="body2">
                      <strong>Nom:</strong> {selectedEvacuation.patient_nom} {selectedEvacuation.patient_prenom}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Âge:</strong> {selectedEvacuation.patient_age} ans
                    </Typography>
                    <Typography variant="body2">
                      <strong>Sexe:</strong> {selectedEvacuation.patient_sexe}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Téléphone:</strong> {selectedEvacuation.patient_telephone}
                    </Typography>
                  </Box>
                )}
              </Grid>

              {/* Colonne droite - Informations générales */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  <AssignmentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Informations Générales
                </Typography>

                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                  <DatePicker
                    label="Date de Demande *"
                    value={formData.DATE_DEMANDE}
                    onChange={(date) => handleFormChange('DATE_DEMANDE', date)}
                    disabled={isViewMode}
                    renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
                  />
                </LocalizationProvider>

                <TextField
                  fullWidth
                  label="Destination *"
                  value={formData.DESTINATION}
                  onChange={(e) => handleFormChange('DESTINATION', e.target.value)}
                  disabled={isViewMode}
                  required
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Hôpital de Destination"
                  value={formData.HOPITAL_DESTINATION}
                  onChange={(e) => handleFormChange('HOPITAL_DESTINATION', e.target.value)}
                  disabled={isViewMode}
                  sx={{ mb: 2 }}
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Gravité *</InputLabel>
                      <Select
                        value={formData.GRAVITE}
                        label="Gravité *"
                        onChange={(e) => handleFormChange('GRAVITE', e.target.value)}
                        disabled={isViewMode}
                      >
                        {evacuationsAPI.getGraviteOptions().map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Statut</InputLabel>
                      <Select
                        value={formData.STATUT}
                        label="Statut"
                        onChange={(e) => handleFormChange('STATUT', e.target.value)}
                        disabled={isViewMode}
                      >
                        {evacuationsAPI.getStatusOptions().map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  <HospitalIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Informations Médicales
                </Typography>

                <TextField
                  fullWidth
                  label="Diagnostic Principal"
                  value={formData.DIAGNOSTIC}
                  onChange={(e) => handleFormChange('DIAGNOSTIC', e.target.value)}
                  disabled={isViewMode}
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Motif d'Évacuation *"
                  value={formData.MOTIF_EVACUATION}
                  onChange={(e) => handleFormChange('MOTIF_EVACUATION', e.target.value)}
                  disabled={isViewMode}
                  required
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Observations"
                      value={formData.OBSERVATIONS}
                      onChange={(e) => handleFormChange('OBSERVATIONS', e.target.value)}
                      disabled={isViewMode}
                      multiline
                      rows={4}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Recommandations"
                      value={formData.RECOMMANDATIONS}
                      onChange={(e) => handleFormChange('RECOMMANDATIONS', e.target.value)}
                      disabled={isViewMode}
                      multiline
                      rows={4}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  <AirplaneIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Transport
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Moyen de Transport *</InputLabel>
                  <Select
                    value={formData.MOYEN_TRANSPORT}
                    label="Moyen de Transport *"
                    onChange={(e) => handleFormChange('MOYEN_TRANSPORT', e.target.value)}
                    disabled={isViewMode}
                  >
                    {evacuationsAPI.getTransportOptions().map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {formData.MOYEN_TRANSPORT === 'avion' && (
                  <>
                    <TextField
                      fullWidth
                      label="Numéro de Vol"
                      value={formData.NUMERO_VOL}
                      onChange={(e) => handleFormChange('NUMERO_VOL', e.target.value)}
                      disabled={isViewMode}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Compagnie Aérienne"
                      value={formData.COMPAGNIE_AERIENNE}
                      onChange={(e) => handleFormChange('COMPAGNIE_AERIENNE', e.target.value)}
                      disabled={isViewMode}
                      sx={{ mb: 2 }}
                    />
                  </>
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.TRANSPORT_SPECIAL}
                      onChange={(e) => handleFormChange('TRANSPORT_SPECIAL', e.target.checked)}
                      disabled={isViewMode}
                    />
                  }
                  label="Transport Spécial Requis"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Accompagnement
                </Typography>

                <Autocomplete
                  options={medecinOptions}
                  loading={medecinSearch.length > 0 && medecinOptions.length === 0}
                  value={medecinOptions.find(m => m.id === formData.ID_MEDECIN) || null}
                  onInputChange={(event, newValue) => setMedecinSearch(newValue)}
                  onChange={(event, newValue) => {
                    handleFormChange('ID_MEDECIN', newValue?.id || '');
                    if (newValue) {
                      handleFormChange('MEDECIN_REFERENT', `${newValue.prenom} ${newValue.nom}`);
                    }
                  }}
                  getOptionLabel={(option) => 
                    `${option.prenom} ${option.nom} - ${option.specialite || 'Médecin'}`
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Médecin Référent"
                      disabled={isViewMode}
                      helperText="Rechercher un médecin"
                    />
                  )}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Accompagnants"
                  value={formData.ACCOMPAGNANTS}
                  onChange={(e) => handleFormChange('ACCOMPAGNANTS', e.target.value)}
                  disabled={isViewMode}
                  multiline
                  rows={3}
                  helperText="Noms des accompagnants, séparés par des virgules"
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  <PaymentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Coûts
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Coût Estimé (€)"
                      type="number"
                      value={formData.COUT_ESTIME}
                      onChange={(e) => handleFormChange('COUT_ESTIME', e.target.value)}
                      disabled={isViewMode}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">€</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Prise en Charge (%)"
                      type="number"
                      value={formData.PRISE_EN_CHARGE}
                      onChange={(e) => handleFormChange('PRISE_EN_CHARGE', e.target.value)}
                      disabled={isViewMode}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}

          {activeTab === 3 && selectedEvacuation && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  <AttachFileIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Documents
                </Typography>

                <List>
                  {documents.map((doc) => (
                    <ListItem key={doc.id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <AttachFileIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={doc.TYPE_DOCUMENT}
                        secondary={`${doc.NOM_FICHIER} - ${formatDate(doc.DAT_CREUTIL)}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="télécharger">
                          <DownloadIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>

                {!isViewMode && (
                  <Button
                    variant="outlined"
                    startIcon={<AttachFileIcon />}
                    sx={{ mt: 2 }}
                  >
                    Ajouter un Document
                  </Button>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  <PaymentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Frais Associés
                </Typography>

                <List>
                  {frais.map((fraisItem) => (
                    <ListItem key={fraisItem.id} divider>
                      <ListItemText
                        primary={fraisItem.TYPE_FRAIS}
                        secondary={`${formatCurrency(fraisItem.MONTANT)} - ${fraisItem.DESCRIPTION}`}
                      />
                      <Chip
                        label={fraisItem.STATUT_PAIEMENT}
                        size="small"
                        color={fraisItem.STATUT_PAIEMENT === 'payé' ? 'success' : 'warning'}
                      />
                    </ListItem>
                  ))}
                </List>

                {!isViewMode && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                  >
                    Ajouter des Frais
                  </Button>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  <HistoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Journal d'Activités
                </Typography>

                <Stepper orientation="vertical">
                  {activityLog.slice(0, 5).map((activity, index) => (
                    <Step key={index} active>
                      <StepLabel>
                        <Typography variant="body2">
                          {activity.action} par {activity.user}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(activity.timestamp)}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {isViewMode ? 'Fermer' : 'Annuler'}
          </Button>
          {!isViewMode && (
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {isCreateMode ? 'Créer' : 'Enregistrer'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  // ==============================================
  // RENDU PRINCIPAL
  // ==============================================

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box sx={{ p: 3 }}>
        {/* En-tête de la page */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmergencyIcon fontSize="large" />
            Gestion des Évacuations Sanitaires
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Gérez les évacuations sanitaires urgentes, les transports médicaux et le suivi des patients
          </Typography>
        </Box>

        {/* Notifications */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
        >
          <Alert onClose={() => setSuccess(null)} severity="success">
            {success}
          </Alert>
        </Snackbar>

        {/* Section Statistiques */}
        <StatisticsSection />

        {/* Section Filtres */}
        <FiltersSection />

        {/* Tableau des évacuations */}
        <EvacuationsTable />

        {/* Dialogue de formulaire */}
        <EvacuationDialog />

        {/* Boutons d'action rapide */}
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Tooltip title="Nouvelle évacuation">
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog('create')}
              sx={{ borderRadius: '50%', width: 56, height: 56 }}
            >
              <AddIcon />
            </Button>
          </Tooltip>
          
          <Tooltip title="Actualiser">
            <Button
              variant="outlined"
              onClick={loadEvacuations}
              sx={{ borderRadius: '50%', width: 56, height: 56 }}
            >
              <RefreshIcon />
            </Button>
          </Tooltip>
          
          <Tooltip title="Statistiques">
            <Button
              variant="outlined"
              onClick={loadStatistics}
              sx={{ borderRadius: '50%', width: 56, height: 56 }}
            >
              <StatsIcon />
            </Button>
          </Tooltip>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default UrgencesEvacuationsPage;