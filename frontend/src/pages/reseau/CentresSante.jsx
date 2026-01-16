// src/pages/centres-sante/CentresSantePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  IconButton,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Fab,
  Avatar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  Snackbar,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  MedicalServices as MedicalIcon,
  People as PeopleIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { centresAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Fonction locale pour formater les numéros de téléphone
const formatPhone = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  const cleaned = phoneNumber.toString().replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  
  if (cleaned.length > 10) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }
  
  return phoneNumber;
};

// Composant de détails rapides
const QuickDetailsDialog = ({ open, onClose, centre }) => {
  if (!centre) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <MedicalIcon />
          </Avatar>
          <Box>
            <Typography variant="h6">{centre.nom || centre.NOM_CENTRE}</Typography>
            <Typography variant="body2" color="text.secondary">
              {centre.code || centre.CODE_CENTRE}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Type & Catégorie
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip label={centre.type || centre.TYPE_CENTRE} size="small" />
              <Chip 
                label={centre.categorie || centre.CATEGORIE_CENTRE} 
                size="small" 
                color="secondary" 
                variant="outlined" 
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Statut
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={centre.statut || centre.STATUT}
                size="small"
                color={centre.statut === 'Actif' || centre.STATUT === 'Actif' ? 'success' : 'error'}
                sx={{ fontWeight: 500 }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Localisation
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <LocationIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="body1">
                  {centre.ville || centre.VILLE}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {centre.region || centre.REGION}
                  {centre.adresse && ` • ${centre.adresse}`}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Capacité
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body1">
                {centre.capacite_lits || 0} lits
              </Typography>
              {centre.capacite_urgences && (
                <Typography variant="body2" color="text.secondary">
                  + {centre.capacite_urgences} places urgences
                </Typography>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Contact
            </Typography>
            <Box sx={{ mt: 1 }}>
              {centre.telephone && (
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <PhoneIcon fontSize="small" />
                  {formatPhone(centre.telephone)}
                </Typography>
              )}
              {centre.email && (
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" />
                  {centre.email}
                </Typography>
              )}
              {centre.directeur && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Directeur : {centre.directeur}
                </Typography>
              )}
            </Box>
          </Grid>
          
          {centre.services && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Services proposés
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {centre.services}
              </Typography>
            </Grid>
          )}
          
          {centre.equipements && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Équipements
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {centre.equipements}
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
        <Button 
          variant="contained" 
          onClick={() => {
            onClose();
            window.open(`/centres-sante/${centre.id || centre.COD_CEN}`, '_blank');
          }}
        >
          Voir fiche complète
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Formulaire pour la création/édition d'un centre
const CentreForm = ({ open, onClose, centre, onSubmit, isEditing }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    type: 'Hôpital',
    categorie: 'Public',
    ville: '',
    region: '',
    adresse: '',
    telephone: '',
    email: '',
    directeur: '',
    capacite_lits: 0,
    capacite_urgences: 0,
    services: '',
    equipements: '',
    statut: 'Actif',
    date_ouverture: new Date().toISOString().split('T')[0],
    actif: 1
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const steps = [
    { label: 'Informations générales', fields: ['nom', 'code', 'type', 'categorie'] },
    { label: 'Localisation', fields: ['ville', 'region', 'adresse'] },
    { label: 'Contact & Capacité', fields: ['telephone', 'email', 'directeur', 'capacite_lits', 'capacite_urgences'] },
    { label: 'Services & Équipements', fields: ['services', 'equipements'] },
    { label: 'Statut & Validation', fields: ['statut', 'date_ouverture', 'actif'] }
  ];

  useEffect(() => {
    if (centre && isEditing) {
      setFormData({
        nom: centre.nom || centre.NOM_CENTRE || '',
        code: centre.code || centre.CODE_CENTRE || '',
        type: centre.type || centre.TYPE_CENTRE || 'Hôpital',
        categorie: centre.categorie || centre.CATEGORIE_CENTRE || 'Public',
        ville: centre.ville || centre.VILLE || '',
        region: centre.region || centre.REGION || '',
        adresse: centre.adresse || centre.ADRESSE || '',
        telephone: centre.telephone || centre.TELEPHONE || '',
        email: centre.email || centre.EMAIL || '',
        directeur: centre.directeur || centre.DIRECTEUR || '',
        capacite_lits: centre.capacite_lits || centre.CAPACITE_LITS || 0,
        capacite_urgences: centre.capacite_urgences || centre.CAPACITE_URGENCES || 0,
        services: centre.services || centre.SERVICES || '',
        equipements: centre.equipements || centre.EQUIPEMENTS || '',
        statut: centre.statut || centre.STATUT || 'Actif',
        date_ouverture: centre.date_ouverture || centre.DATE_OUVERTURE || new Date().toISOString().split('T')[0],
        actif: centre.actif || centre.ACTIF || 1
      });
    } else if (!isEditing) {
      setFormData({
        nom: '',
        code: '',
        type: 'Hôpital',
        categorie: 'Public',
        ville: '',
        region: '',
        adresse: '',
        telephone: '',
        email: '',
        directeur: '',
        capacite_lits: 0,
        capacite_urgences: 0,
        services: '',
        equipements: '',
        statut: 'Actif',
        date_ouverture: new Date().toISOString().split('T')[0],
        actif: 1
      });
    }
    setActiveStep(0);
  }, [centre, isEditing, open]);

  const validateStep = (step) => {
    const stepFields = steps[step].fields;
    const newErrors = {};
    
    stepFields.forEach(field => {
      if (field === 'nom' && !formData.nom.trim()) newErrors.nom = 'Le nom est requis';
      if (field === 'code' && !formData.code.trim()) newErrors.code = 'Le code est requis';
      if (field === 'ville' && !formData.ville.trim()) newErrors.ville = 'La ville est requise';
      if (field === 'region' && !formData.region.trim()) newErrors.region = 'La région est requise';
      if (field === 'capacite_lits' && formData.capacite_lits < 0) newErrors.capacite_lits = 'La capacité doit être positive';
      if (field === 'capacite_urgences' && formData.capacite_urgences < 0) newErrors.capacite_urgences = 'La capacité doit être positive';
      if (field === 'email' && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email invalide';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'capacite_lits' || field === 'capacite_urgences' 
        ? parseInt(value) || 0 
        : value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData, isEditing ? centre.id : null);
      onClose();
    } catch (error) {
      console.error('❌ Erreur soumission formulaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const types = ['Hôpital', 'Clinique', 'Centre de Santé', 'Dispensaire', 'Laboratoire', 'Pharmacie'];
  const categories = ['Public', 'Privé', 'Mixte', 'ONG'];
  const statuts = ['Actif', 'Inactif', 'En travaux', 'Fermé temporairement'];
  const regions = ['Centre', 'Littoral', 'Ouest', 'Nord', 'Extrême-Nord', 'Adamaoua', 'Est', 'Sud', 'Sud-Ouest', 'Nord-Ouest'];

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom du centre *"
                value={formData.nom}
                onChange={handleChange('nom')}
                error={!!errors.nom}
                helperText={errors.nom}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Code du centre *"
                value={formData.code}
                onChange={handleChange('code')}
                error={!!errors.code}
                helperText={errors.code}
                placeholder="HOP-001"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type *</InputLabel>
                <Select
                  value={formData.type}
                  label="Type *"
                  onChange={handleChange('type')}
                >
                  {types.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Catégorie *</InputLabel>
                <Select
                  value={formData.categorie}
                  label="Catégorie *"
                  onChange={handleChange('categorie')}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ville *"
                value={formData.ville}
                onChange={handleChange('ville')}
                error={!!errors.ville}
                helperText={errors.ville}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Région *</InputLabel>
                <Select
                  value={formData.region}
                  label="Région *"
                  onChange={handleChange('region')}
                  error={!!errors.region}
                >
                  {regions.map((region) => (
                    <MenuItem key={region} value={region}>{region}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse complète"
                value={formData.adresse}
                onChange={handleChange('adresse')}
                multiline
                rows={2}
                placeholder="Rue, quartier, arrondissement..."
              />
            </Grid>
          </Grid>
        );
      
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Téléphone"
                value={formData.telephone}
                onChange={handleChange('telephone')}
                placeholder="01 23 45 67 89"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                onChange={handleChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                placeholder="contact@centre.com"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Directeur/Responsable"
                value={formData.directeur}
                onChange={handleChange('directeur')}
                placeholder="Nom et prénom du directeur"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacité (nombre de lits) *"
                type="number"
                value={formData.capacite_lits}
                onChange={handleChange('capacite_lits')}
                error={!!errors.capacite_lits}
                helperText={errors.capacite_lits}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacité urgences"
                type="number"
                value={formData.capacite_urgences}
                onChange={handleChange('capacite_urgences')}
                error={!!errors.capacite_urgences}
                helperText={errors.capacite_urgences}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
          </Grid>
        );
      
      case 3:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Services proposés"
                value={formData.services}
                onChange={handleChange('services')}
                multiline
                rows={3}
                placeholder="Consultations, Urgences, Radiologie, Laboratoire, Maternité, Chirurgie..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Équipements disponibles"
                value={formData.equipements}
                onChange={handleChange('equipements')}
                multiline
                rows={3}
                placeholder="Scanner, Échographe, Laboratoire d'analyses, Bloc opératoire..."
              />
            </Grid>
          </Grid>
        );
      
      case 4:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={formData.statut}
                  label="Statut"
                  onChange={handleChange('statut')}
                >
                  {statuts.map((statut) => (
                    <MenuItem key={statut} value={statut}>{statut}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date d'ouverture"
                type="date"
                value={formData.date_ouverture}
                onChange={handleChange('date_ouverture')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.actif === 1}
                    onChange={(e) => handleChange('actif')({ 
                      target: { type: 'checkbox', value: e.target.checked ? 1 : 0 } 
                    })}
                    color="primary"
                  />
                }
                label="Centre actif"
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                Vérifiez toutes les informations avant de valider la création du centre.
              </Alert>
            </Grid>
          </Grid>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {isEditing ? 'Modifier le Centre' : 'Nouveau Centre de Santé'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="subtitle1">{step.label}</Typography>
                </StepLabel>
                <StepContent>
                  {renderStepContent(index)}
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                    >
                      Retour
                    </Button>
                    {index === steps.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                        disabled={loading}
                      >
                        {isEditing ? 'Mettre à jour' : 'Créer le centre'}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                      >
                        Continuer
                      </Button>
                    )}
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const CentresSantePage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  // États pour les données
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour la pagination et le tri
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('date_creation');
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    statut: '',
    categorie: '',
    region: ''
  });
  
  // États pour les actions
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // États pour les formulaires
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [formMode, setFormMode] = useState('create');
  
  // États pour les notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Vérifier les permissions
  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    
    const rolePermissions = {
      'create_centre': ['ADMIN', 'GESTIONNAIRE', 'SECRETAIRE'],
      'edit_centre': ['ADMIN', 'GESTIONNAIRE', 'SECRETAIRE'],
      'delete_centre': ['ADMIN', 'GESTIONNAIRE'],
      'view_centre': ['ADMIN', 'GESTIONNAIRE', 'SECRETAIRE', 'MEDECIN']
    };
    
    const rolesAutorises = rolePermissions[permission] || [];
    return hasRole(rolesAutorises);
  }, [user, hasRole]);

  // Chargement des centres - CORRIGÉ avec la vraie API
  const loadCentres = useCallback(async () => {
    setLoading(true);
    try {
      const response = await centresAPI.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        ...filters
      });
      
      console.log('📊 Centres chargés:', response);
      
      if (response.success) {
        setCentres(response.centres || []);
        setTotal(response.pagination?.total || 0);
        setError(null);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des centres');
      }
    } catch (error) {
      console.error('❌ Erreur chargement centres:', error);
      setError(error.message || 'Erreur lors du chargement des centres');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, filters]);

  useEffect(() => {
    loadCentres();
  }, [loadCentres]);

  // Gestionnaires d'événements
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      statut: '',
      categorie: '',
      region: ''
    });
    setSearchTerm('');
    setPage(0);
  };

  const handleMenuClick = (event, centre) => {
    setAnchorEl(event.currentTarget);
    setSelectedCentre(centre);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCentre(null);
  };

  const handleViewDetails = () => {
    if (selectedCentre) {
      setShowDetailsDialog(true);
      handleMenuClose();
    }
  };

  const handleEdit = () => {
    if (selectedCentre) {
      setFormMode('edit');
      setShowFormDialog(true);
      handleMenuClose();
    }
  };

  const handleCreate = () => {
    setFormMode('create');
    setSelectedCentre(null);
    setShowFormDialog(true);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
    handleMenuClose();
  };

  // CRUD OPERATIONS - IMPLÉMENTÉES
  const handleDeleteConfirm = async () => {
    try {
      if (selectedCentre) {
        const response = await centresAPI.delete(selectedCentre.id || selectedCentre.COD_CEN);
        if (response.success) {
          showSnackbar('Centre supprimé avec succès', 'success');
          loadCentres();
        } else {
          showSnackbar(response.message || 'Erreur lors de la suppression', 'error');
        }
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      showSnackbar(`Erreur lors de la suppression: ${error.message}`, 'error');
    }
  };

  const handleFormSubmit = async (formData, id = null) => {
    try {
      let response;
      
      if (formMode === 'create') {
        // Création
        response = await centresAPI.create(formData);
        if (response.success) {
          showSnackbar('Centre créé avec succès', 'success');
          loadCentres();
        } else {
          throw new Error(response.message);
        }
      } else {
        // Mise à jour
        response = await centresAPI.update(id, formData);
        if (response.success) {
          showSnackbar('Centre mis à jour avec succès', 'success');
          loadCentres();
        } else {
          throw new Error(response.message);
        }
      }
    } catch (error) {
      console.error('❌ Erreur soumission formulaire:', error);
      showSnackbar(`Erreur: ${error.message}`, 'error');
      throw error;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await centresAPI.exportData();
      if (response.success && response.data) {
        downloadJSON(response.data, `centres-sante_${new Date().toISOString().split('T')[0]}.json`);
      } else {
        // Fallback: exporter les données actuelles
        downloadJSON(centres, `centres-sante_${new Date().toISOString().split('T')[0]}.json`);
      }
    } catch (error) {
      console.error('❌ Erreur export:', error);
      showSnackbar(`Erreur lors de l'export: ${error.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showSnackbar('Export terminé avec succès', 'success');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Données pour les filtres
  const types = [...new Set(centres.map(c => c.type || c.TYPE_CENTRE).filter(Boolean))];
  const statuts = [...new Set(centres.map(c => c.statut || c.STATUT).filter(Boolean))];
  const categories = [...new Set(centres.map(c => c.categorie || c.CATEGORIE_CENTRE).filter(Boolean))];
  const regions = [...new Set(centres.map(c => c.region || c.REGION).filter(Boolean))];

  if (loading && centres.length === 0) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 3, color: 'text.secondary' }}>
          Chargement des centres de santé...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* En-tête avec statistiques */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Centres de Santé
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Gérez l'ensemble des centres de santé et leurs informations
        </Typography>

        {/* Cartes de statistiques */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <MedicalIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5">{total}</Typography>
                <Typography color="text.secondary">Centres au total</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <MedicalIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5">
                  {centres.filter(c => c.statut === 'Actif' || c.STATUT === 'Actif').length}
                </Typography>
                <Typography color="text.secondary">Centres actifs</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <LocationIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5">{regions.length}</Typography>
                <Typography color="text.secondary">Régions</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PeopleIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5">
                  {centres.reduce((acc, c) => acc + (c.capacite_lits || 0), 0)}
                </Typography>
                <Typography color="text.secondary">Lits au total</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Barre d'outils */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Rechercher un centre (nom, ville, région...)"
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Tooltip title="Filtres avancés">
                <Button
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  variant={showFilters ? 'contained' : 'outlined'}
                >
                  Filtres
                </Button>
              </Tooltip>
              
              <Tooltip title="Actualiser">
                <IconButton onClick={loadCentres}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Exporter">
                <IconButton onClick={handleExport} disabled={isExporting}>
                  {isExporting ? <CircularProgress size={24} /> : <DownloadIcon />}
                </IconButton>
              </Tooltip>
              
              {hasPermission('create_centre') && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreate}
                >
                  Nouveau centre
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Filtres avancés */}
        {showFilters && (
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    label="Type"
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    {types.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={filters.statut}
                    label="Statut"
                    onChange={(e) => handleFilterChange('statut', e.target.value)}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    {statuts.map((statut) => (
                      <MenuItem key={statut} value={statut}>
                        {statut}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Catégorie</InputLabel>
                  <Select
                    value={filters.categorie}
                    label="Catégorie"
                    onChange={(e) => handleFilterChange('categorie', e.target.value)}
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    {categories.map((categorie) => (
                      <MenuItem key={categorie} value={categorie}>
                        {categorie}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Région</InputLabel>
                  <Select
                    value={filters.region}
                    label="Région"
                    onChange={(e) => handleFilterChange('region', e.target.value)}
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    {regions.map((region) => (
                      <MenuItem key={region} value={region}>
                        {region}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button onClick={handleClearFilters} variant="text" size="small">
                  Effacer tous les filtres
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Tableau des centres */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'nom'}
                    direction={orderBy === 'nom' ? order : 'asc'}
                    onClick={() => handleSort('nom')}
                  >
                    Nom du centre
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'type'}
                    direction={orderBy === 'type' ? order : 'asc'}
                    onClick={() => handleSort('type')}
                  >
                    Type
                  </TableSortLabel>
                </TableCell>
                <TableCell>Localisation</TableCell>
                <TableCell>Capacité</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'statut'}
                    direction={orderBy === 'statut' ? order : 'asc'}
                    onClick={() => handleSort('statut')}
                  >
                    Statut
                  </TableSortLabel>
                </TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {error ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Alert severity="error">
                      <Typography>{error}</Typography>
                      <Button onClick={loadCentres} sx={{ mt: 1 }}>
                        Réessayer
                      </Button>
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : centres.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Aucun centre de santé trouvé
                    </Typography>
                    {searchTerm || Object.values(filters).some(f => f) ? (
                      <Button onClick={handleClearFilters} sx={{ mt: 1 }}>
                        Effacer les filtres
                      </Button>
                    ) : hasPermission('create_centre') ? (
                      <Button
                        startIcon={<AddIcon />}
                        onClick={handleCreate}
                        sx={{ mt: 1 }}
                      >
                        Créer un centre
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ) : (
                centres.map((centre) => (
                  <TableRow
                    key={centre.id || centre.COD_CEN}
                    hover
                    sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          <MedicalIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {centre.nom || centre.NOM_CENTRE}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {centre.code || centre.CODE_CENTRE}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={centre.type || centre.TYPE_CENTRE}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2">
                            {centre.ville || centre.VILLE}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {centre.region || centre.REGION}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {centre.capacite_lits ? (
                        <Box>
                          <Typography variant="body2">
                            {centre.capacite_lits} lits
                          </Typography>
                          {centre.capacite_urgences && (
                            <Typography variant="caption" color="text.secondary">
                              + {centre.capacite_urgences} urgences
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Non spécifiée
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={centre.statut || centre.STATUT}
                        size="small"
                        color={
                          centre.statut === 'Actif' || centre.STATUT === 'Actif'
                            ? 'success'
                            : 'error'
                        }
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        {centre.telephone && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon fontSize="small" />
                            {formatPhone(centre.telephone)}
                          </Typography>
                        )}
                        {centre.email && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon fontSize="small" />
                            {centre.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, centre)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {centres.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} sur ${count}`
            }
          />
        )}
      </Paper>

      {/* Menu contextuel */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Voir détails</ListItemText>
        </MenuItem>
        {hasPermission('edit_centre') && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Modifier</ListItemText>
          </MenuItem>
        )}
        {hasPermission('delete_centre') && (
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Supprimer</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le centre{' '}
            <strong>{selectedCentre?.nom || selectedCentre?.NOM_CENTRE}</strong> ?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Cette action est irréversible. Toutes les données associées seront perdues.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de détails rapides */}
      <QuickDetailsDialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        centre={selectedCentre}
      />

      {/* Formulaire de création/édition */}
      <CentreForm
        open={showFormDialog}
        onClose={() => setShowFormDialog(false)}
        centre={selectedCentre}
        onSubmit={handleFormSubmit}
        isEditing={formMode === 'edit'}
      />

      {/* Bouton flottant pour mobile */}
      {hasPermission('create_centre') && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={handleCreate}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={closeSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CentresSantePage;