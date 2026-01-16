// NetworkPage.jsx - Version avec affichage des régions et statistiques corrigées
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Tooltip,
  Fade,
  LinearProgress,
  Snackbar,
  InputAdornment,
  FormControlLabel,
  Switch,
  ListItemButton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Web as WebIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  GroupAdd as GroupAddIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Person as PersonIcon,
  MedicalServices as MedicalServicesIcon,
  LocalHospital as LocalHospitalIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import './ReseauSoins.css';

const NetworkPage = () => {
  const { user } = useAuth();
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('create');
  const [openAddMemberDialog, setOpenAddMemberDialog] = useState(false);
  const [openAddActivityDialog, setOpenAddActivityDialog] = useState(false);
  const [openAddContractDialog, setOpenAddContractDialog] = useState(false);
  const [openSearchModal, setOpenSearchModal] = useState(false);
  
  const [tabValue, setTabValue] = useState(0);
  const [statistics, setStatistics] = useState({
    total_reseaux: 0,
    reseaux_actifs: 0,
    reseaux_inactifs: 0,
    total_membres: 0,
    regions_couvertes: 0,
    membres_totaux: 0
  });
  const [regions, setRegions] = useState([]);
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [centresSante, setCentresSante] = useState([]);
  const [prestataires, setPrestataires] = useState([]);
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
    region: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('beneficiaire');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Member form state
  const [memberForm, setMemberForm] = useState({
    type_membre: 'Beneficiaire',
    cod_ben: '',
    cod_cen: '',
    cod_pre: '',
    date_adhesion: new Date().toISOString().split('T')[0],
    statut: 'Actif'
  });
  
  // Activity form state
  const [activityForm, setActivityForm] = useState({
    type_activite: '',
    libelle_activite: '',
    description: '',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '',
    lieu: '',
    nombre_participants: '',
    status: 'Planifie'
  });
  
  // Contract form state
  const [contractForm, setContractForm] = useState({
    numero_contrat: '',
    type_contrat: '',
    objet_contrat: '',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '',
    montant_contrat: '',
    renouvelable: true,
    date_signature: new Date().toISOString().split('T')[0],
    partenaire: '',
    contact_partenaire: '',
    status: 'Actif'
  });

  // Form state for network
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    type: '',
    objectifs: '',
    zone_couverture: '',
    population_cible: '',
    region_code: '',
    contact_principal: '',
    telephone_contact: '',
    email_contact: '',
    site_web: '',
    status: 'Actif'
  });

  const networkTypes = [
    { value: 'Hospitalier', label: 'Réseau Hospitalier' },
    { value: 'Primaire', label: 'Réseau de Soins Primaires' },
    { value: 'Specialise', label: 'Réseau Spécialisé' },
    { value: 'Territorial', label: 'Réseau Territorial' },
    { value: 'Thematique', label: 'Réseau Thématique' },
    { value: 'Numerique', label: 'Réseau Numérique' }
  ];

  const statusOptions = [
    { value: 'Actif', label: 'Actif', color: 'success' },
    { value: 'Inactif', label: 'Inactif', color: 'error' },
    { value: 'En attente', label: 'En attente', color: 'warning' }
  ];

  const memberTypes = [
    { value: 'Beneficiaire', label: 'Bénéficiaire', icon: <PersonIcon /> },
    { value: 'Centre de santé', label: 'Centre de Santé', icon: <LocalHospitalIcon /> },
    { value: 'Prestataire', label: 'Prestataire', icon: <MedicalServicesIcon /> }
  ];

  const activityTypes = [
    { value: 'Formation', label: 'Formation' },
    { value: 'Reunion', label: 'Réunion' },
    { value: 'Atelier', label: 'Atelier' },
    { value: 'Conference', label: 'Conférence' },
    { value: 'Visite', label: 'Visite' },
    { value: 'Evaluation', label: 'Évaluation' }
  ];

  const contractTypes = [
    { value: 'Partenariat', label: 'Partenariat' },
    { value: 'Financement', label: 'Financement' },
    { value: 'Collaboration', label: 'Collaboration' },
    { value: 'Service', label: 'Service' },
    { value: 'Maintenance', label: 'Maintenance' }
  ];

  // Fetch networks avec filtres
  const fetchNetworks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setInfo('');
      
      const result = await api.reseauSoins.getAllNetworks({
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status,
        type: filters.type,
        search: filters.search,
        region: filters.region
      });
      
      if (result.success) {
        setNetworks(result.networks);
        setPagination(result.pagination);
        
        // Calculer les statistiques à partir des données filtrées
        if (result.networks.length > 0) {
          const totalMembres = result.networks.reduce((sum, network) => sum + (network.nombre_membres || 0), 0);
          const regionsUniques = [...new Set(result.networks.filter(n => n.region_code).map(n => n.region_code))];
          
          // Mettre à jour les statistiques avec les données filtrées
          setStatistics(prev => ({
            ...prev,
            total_reseaux: result.pagination.total,
            membres_totaux: totalMembres,
            regions_couvertes: regionsUniques.length
          }));
        } else {
          setStatistics(prev => ({
            ...prev,
            total_reseaux: 0,
            membres_totaux: 0,
            regions_couvertes: 0
          }));
        }
        
        if (result.networks.length === 0) {
          setInfo('Aucun réseau trouvé avec les critères sélectionnés');
        }
      } else {
        setError(result.message || 'Erreur lors de la récupération des réseaux');
        setNetworks([]);
        setSnackbarMessage(result.message || 'Erreur lors du chargement des réseaux');
        setSnackbarSeverity('error');
        setShowSnackbar(true);
      }
    } catch (err) {
      console.error('❌ Erreur fetchNetworks:', err);
      setError(err.message || 'Erreur réseau');
      setNetworks([]);
      setSnackbarMessage('Erreur lors du chargement des réseaux');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // Fetch statistics globales (non filtrées)
  const fetchStatistics = async () => {
    try {
      const response = await api.reseauSoins.getStatistics();
      if (response.success) {
        setStatistics(prev => ({
          ...prev,
          reseaux_actifs: response.statistiques?.reseaux_actifs || 0,
          reseaux_inactifs: response.statistiques?.reseaux_inactifs || 0,
          // Garder total_reseaux, membres_totaux et regions_couvertes des données filtrées
        }));
      }
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
    }
  };

  // Fetch regions
  const fetchRegions = async () => {
    try {
      const response = await api.reseauSoins.getRegions();
      if (response.success) {
        setRegions(response.regions || []);
      }
    } catch (error) {
      console.error('Erreur récupération régions:', error);
    }
  };

  // Fetch network details
  const fetchNetworkDetails = async (id) => {
    try {
      setLoadingDetails(true);
      setSelectedNetwork(null);
      
      const result = await api.reseauSoins.getNetworkById(id);
      
      if (result.success) {
        setSelectedNetwork(result);
      } else {
        setSnackbarMessage(result.message || 'Impossible de charger les détails du réseau');
        setSnackbarSeverity('error');
        setShowSnackbar(true);
      }
    } catch (err) {
      console.error(`❌ Erreur fetchNetworkDetails:`, err);
      setSnackbarMessage(err.message || 'Erreur lors du chargement des détails');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      let response;
      switch (searchType) {
        case 'beneficiaire':
          response = await api.reseauSoins.searchBeneficiaires(searchQuery);
          break;
        case 'centre':
          response = await api.reseauSoins.searchCentresSante(searchQuery);
          break;
        case 'prestataire':
          response = await api.reseauSoins.searchPrestataires(searchQuery);
          break;
        default:
          break;
      }
      
      if (response && response.success) {
        setSearchResults(response[`${searchType}s`] || []);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      setSnackbarMessage('Erreur lors de la recherche');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    } finally {
      setSearching(false);
    }
  };

  // Handle select member
  const handleSelectMember = (item) => {
    if (searchType === 'beneficiaire') {
      setMemberForm(prev => ({
        ...prev,
        cod_ben: item.id,
        type_membre: 'Beneficiaire'
      }));
    } else if (searchType === 'centre') {
      setMemberForm(prev => ({
        ...prev,
        cod_cen: item.id,
        type_membre: 'Centre de santé'
      }));
    } else if (searchType === 'prestataire') {
      setMemberForm(prev => ({
        ...prev,
        cod_pre: item.id,
        type_membre: 'Prestataire'
      }));
    }
    setOpenSearchModal(false);
  };

  // Handle add member
 const handleAddMember = async () => {
  try {
    setSubmitting(true);
    
    if (!selectedNetwork?.network?.id) {
      throw new Error('Aucun réseau sélectionné');
    }

    // VALIDATION AVANT ENVOI
    console.log('📋 Données du formulaire:', memberForm);

    // S'assurer que les noms de champs sont corrects
    const memberDataToSend = {
      type_membre: memberForm.type_membre,
      // Selon le type, utiliser le bon champ
      ...(memberForm.type_membre === 'Bénéficiaire' && { 
        cod_ben: memberForm.cod_ben 
      }),
      ...(memberForm.type_membre === 'Centre de santé' && { 
        cod_cen: memberForm.cod_cen 
      }),
      ...(memberForm.type_membre === 'Prestataire' && { 
        cod_pre: memberForm.cod_pre 
      }),
      date_adhesion: memberForm.date_adhesion || new Date().toISOString().split('T')[0],
      status_adhesion: memberForm.status_adhesion || 'Actif'
    };

    // Validation spécifique
    if (memberForm.type_membre === 'Bénéficiaire' && !memberForm.cod_ben) {
      throw new Error('Veuillez sélectionner un bénéficiaire');
    }
    if (memberForm.type_membre === 'Centre de santé' && !memberForm.cod_cen) {
      throw new Error('Veuillez sélectionner un centre de santé');
    }
    if (memberForm.type_membre === 'Prestataire' && !memberForm.cod_pre) {
      throw new Error('Veuillez sélectionner un prestataire');
    }

    const result = await api.reseauSoins.addMemberToNetwork(
      selectedNetwork.network.id,
      memberDataToSend
    );

    if (result.success) {
      setSnackbarMessage('Membre ajouté avec succès');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
      setOpenAddMemberDialog(false);
      resetMemberForm();
      
      // Rafraîchir les détails du réseau
      fetchNetworkDetails(selectedNetwork.network.id);
      // Rafraîchir la liste des réseaux pour mettre à jour les statistiques
      fetchNetworks();
    } else {
      throw new Error(result.message || 'Échec de l\'ajout du membre');
    }
  } catch (error) {
    console.error('❌ Erreur ajout membre:', error);
    setSnackbarMessage(error.message || 'Erreur lors de l\'ajout du membre');
    setSnackbarSeverity('error');
    setShowSnackbar(true);
  } finally {
    setSubmitting(false);
  }
};

  // Handle add activity
  const handleAddActivity = async () => {
    try {
      setSubmitting(true);
      
      if (!selectedNetwork?.network?.id) {
        throw new Error('Aucun réseau sélectionné');
      }

      if (!activityForm.type_activite || !activityForm.libelle_activite || !activityForm.date_debut) {
        throw new Error('Le type, le libellé et la date de début sont obligatoires');
      }

      const result = await api.reseauSoins.createActivity(
        selectedNetwork.network.id,
        activityForm
      );

      if (result.success) {
        setSnackbarMessage('Activité créée avec succès');
        setSnackbarSeverity('success');
        setShowSnackbar(true);
        setOpenAddActivityDialog(false);
        resetActivityForm();
        
        // Rafraîchir les détails du réseau
        fetchNetworkDetails(selectedNetwork.network.id);
      } else {
        throw new Error(result.message || 'Échec de la création de l\'activité');
      }
    } catch (error) {
      console.error('❌ Erreur création activité:', error);
      setSnackbarMessage(error.message || 'Erreur lors de la création de l\'activité');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle add contract
  const handleAddContract = async () => {
    try {
      setSubmitting(true);
      
      if (!selectedNetwork?.network?.id) {
        throw new Error('Aucun réseau sélectionné');
      }

      if (!contractForm.numero_contrat || !contractForm.type_contrat || !contractForm.date_debut) {
        throw new Error('Le numéro, le type et la date de début sont obligatoires');
      }

      const result = await api.reseauSoins.createContract(
        selectedNetwork.network.id,
        contractForm
      );

      if (result.success) {
        setSnackbarMessage('Contrat créé avec succès');
        setSnackbarSeverity('success');
        setShowSnackbar(true);
        setOpenAddContractDialog(false);
        resetContractForm();
        
        // Rafraîchir les détails du réseau
        fetchNetworkDetails(selectedNetwork.network.id);
      } else {
        throw new Error(result.message || 'Échec de la création du contrat');
      }
    } catch (error) {
      console.error('❌ Erreur création contrat:', error);
      setSnackbarMessage(error.message || 'Erreur lors de la création du contrat');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset forms
  const resetMemberForm = () => {
    setMemberForm({
      type_membre: 'Beneficiaire',
      cod_ben: '',
      cod_cen: '',
      cod_pre: '',
      date_adhesion: new Date().toISOString().split('T')[0],
      statut: 'Actif'
    });
  };

  const resetActivityForm = () => {
    setActivityForm({
      type_activite: '',
      libelle_activite: '',
      description: '',
      date_debut: new Date().toISOString().split('T')[0],
      date_fin: '',
      lieu: '',
      nombre_participants: '',
      status: 'Planifie'
    });
  };

  const resetContractForm = () => {
    setContractForm({
      numero_contrat: '',
      type_contrat: '',
      objet_contrat: '',
      date_debut: new Date().toISOString().split('T')[0],
      date_fin: '',
      montant_contrat: '',
      renouvelable: true,
      date_signature: new Date().toISOString().split('T')[0],
      partenaire: '',
      contact_partenaire: '',
      status: 'Actif'
    });
  };

  // Handle network dialog open
  const handleOpenDialog = (type = 'create', network = null) => {
    setDialogType(type);
    if (type === 'edit' && network) {
      setFormData({
        nom: network.nom || '',
        description: network.description || '',
        type: network.type || '',
        objectifs: network.objectifs || '',
        zone_couverture: network.zone_couverture || '',
        population_cible: network.population_cible || '',
        region_code: network.region_code || '',
        contact_principal: network.contact_principal || '',
        telephone_contact: network.telephone_contact || '',
        email_contact: network.email_contact || '',
        site_web: network.site_web || '',
        status: network.status || 'Actif'
      });
      setSelectedNetwork({ network });
    } else {
      setFormData({
        nom: '',
        description: '',
        type: '',
        objectifs: '',
        zone_couverture: '',
        population_cible: '',
        region_code: '',
        contact_principal: '',
        telephone_contact: '',
        email_contact: '',
        site_web: '',
        status: 'Actif'
      });
    }
    setOpenDialog(true);
  };

  // Handle network dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      nom: '',
      description: '',
      type: '',
      objectifs: '',
      zone_couverture: '',
      population_cible: '',
      region_code: '',
      contact_principal: '',
      telephone_contact: '',
      email_contact: '',
      site_web: '',
      status: 'Actif'
    });
  };

  // Handle network form submit
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      if (!formData.nom || !formData.type) {
        setSnackbarMessage('Le nom et le type du réseau sont obligatoires');
        setSnackbarSeverity('warning');
        setShowSnackbar(true);
        setSubmitting(false);
        return;
      }
      
      let result;
      
      if (dialogType === 'create') {
        result = await api.reseauSoins.createNetwork(formData);
      } else {
        if (!selectedNetwork?.network?.id) {
          throw new Error('ID réseau non défini');
        }
        result = await api.reseauSoins.updateNetwork(selectedNetwork.network.id, formData);
      }
      
      if (result.success) {
        setSnackbarMessage(result.message || 'Opération réussie');
        setSnackbarSeverity('success');
        setShowSnackbar(true);
        handleCloseDialog();
        fetchNetworks();
        fetchStatistics();
        
        if (selectedNetwork?.network?.id) {
          fetchNetworkDetails(selectedNetwork.network.id);
        }
      } else {
        throw new Error(result.message || 'Échec de l\'opération');
      }
    } catch (error) {
      console.error('❌ Erreur soumission réseau:', error);
      setSnackbarMessage(error.message || 'Erreur lors de l\'enregistrement');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: '',
      type: '',
      search: '',
      region: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Date invalide';
    }
  };

  // Get region name from code
  const getRegionName = (regionCode) => {
    if (!regionCode) return '-';
    const region = regions.find(r => r.code === regionCode);
    return region ? region.nom : regionCode;
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : 'default';
  };

  // Get type color
  const getTypeColor = (type) => {
    const typeMap = {
      'Hospitalier': 'primary',
      'Primaire': 'secondary',
      'Specialise': 'success',
      'Territorial': 'warning',
      'Thematique': 'info',
      'Numerique': 'error'
    };
    return typeMap[type] || 'default';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Actif': return <CheckCircleIcon fontSize="small" />;
      case 'Inactif': return <CancelIcon fontSize="small" />;
      case 'En attente': return <PendingIcon fontSize="small" />;
      default: return null;
    }
  };

  // NetworkPage.jsx - useEffect corrigé
useEffect(() => {
  // Charger d'abord les régions
  const loadData = async () => {
    try {
      await fetchRegions();
      await fetchNetworks();
      await fetchStatistics();
    } catch (error) {
      console.error('Erreur initialisation:', error);
      setError('Erreur lors du chargement des données');
    }
  };
  
  loadData();
}, [fetchNetworks]); // Seulement fetchNetworks dans les dépendances

  // Initial fetch
  useEffect(() => {
    fetchNetworks();
    fetchStatistics();
    fetchRegions();
  }, [fetchNetworks]);

  // Search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchType]);

  if (loading && networks.length === 0) {
    return (
      <Container className="network-page-container" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Chargement des réseaux de soins...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className="network-page-container particle-effect" sx={{ mt: 4, mb: 4 }}>
      {/* Snackbar for notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box className="network-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Réseaux de Soins
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Gestion des réseaux de santé et de leurs membres
          </Typography>
        </Box>
        <Button
          className="network-action-button"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Nouveau Réseau
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 4, borderRadius: '20px' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Filtres
            </Typography>
            <Box>
              <Tooltip title="Afficher/Masquer les filtres">
                <IconButton onClick={() => setShowFilters(!showFilters)} size="small">
                  <FilterIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Actualiser">
                <IconButton onClick={fetchNetworks} size="small" sx={{ ml: 1 }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Fade in={showFilters}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Rechercher"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  size="small"
                  className="MuiTextField-root"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={filters.status}
                    label="Statut"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="MuiOutlinedInput-root"
                  >
                    <MenuItem value="">Tous</MenuItem>
                    {statusOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    label="Type"
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="MuiOutlinedInput-root"
                  >
                    <MenuItem value="">Tous</MenuItem>
                    {networkTypes.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Région</InputLabel>
                  <Select
                    value={filters.region}
                    label="Région"
                    onChange={(e) => handleFilterChange('region', e.target.value)}
                    className="MuiOutlinedInput-root"
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    {regions.map(region => (
                      <MenuItem key={region.code} value={region.code}>
                        {region.nom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={resetFilters}
                    fullWidth
                    size="small"
                    className="network-action-button"
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    variant="contained"
                    onClick={fetchNetworks}
                    fullWidth
                    size="small"
                    className="network-action-button"
                  >
                    Appliquer
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Fade>
        </CardContent>
      </Card>

      {/* Error and Info Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {info && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setInfo('')}>
          {info}
        </Alert>
      )}

      {/* Statistics Cards - CORRIGÉ pour afficher membres totaux et régions couvertes */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { 
            title: 'Réseaux Totaux', 
            value: statistics.total_reseaux || 0, 
            subtitle: `${statistics.reseaux_actifs || 0} actifs, ${statistics.reseaux_inactifs || 0} inactifs`,
            icon: <BusinessIcon />,
            color: 'primary'
          },
          { 
            title: 'Membres Totaux', 
            value: statistics.membres_totaux || 0, 
            subtitle: `Répartis sur ${statistics.total_reseaux || 0} réseaux`,
            icon: <PeopleIcon />,
            color: 'success'
          },
          { 
            title: 'Réseaux Actifs', 
            value: statistics.reseaux_actifs || 0, 
            subtitle: `${statistics.reseaux_actifs || 0} / ${statistics.total_reseaux || 0} réseaux`,
            icon: <AssignmentIcon />,
            color: 'warning'
          },
          { 
            title: 'Régions Couvertes', 
            value: statistics.regions_couvertes || 0, 
            subtitle: `Sur ${regions.length} régions disponibles`,
            icon: <LocationIcon />,
            color: 'error'
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card className="stat-card floating-element">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: `${stat.color}.main`, 
                    mr: 2,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    {stat.icon}
                  </Avatar>
                  <Typography variant="h6" component="div">
                    {stat.title}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div" fontWeight="bold">
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {stat.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Networks Table - CORRIGÉ pour afficher correctement les régions */}
      <Card sx={{ borderRadius: '20px' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Liste des Réseaux ({pagination.total})
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Page {pagination.page} sur {pagination.totalPages}
            </Typography>
          </Box>
          
          {loading && networks.length > 0 && <LinearProgress sx={{ mb: 2 }} />}
          
          <TableContainer component={Paper} className="networks-table-container">
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Région</TableCell>
                  <TableCell>Membres</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Création</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {networks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Box className="empty-state">
                        <BusinessIcon className="empty-state-icon" sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary">
                          Aucun réseau trouvé
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          {filters.status || filters.type || filters.search ? 
                            "Essayez de modifier vos filtres" : 
                            "Créez votre premier réseau"}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  networks.map((network) => (
                    <TableRow 
                      key={network.id}
                      hover
                      onClick={() => fetchNetworkDetails(network.id)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ 
                            bgcolor: getTypeColor(network.type), 
                            mr: 2, 
                            width: 40, 
                            height: 40,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}>
                            <BusinessIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {network.nom}
                            </Typography>
                            {network.description && (
                              <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 300 }}>
                                {network.description.substring(0, 50)}...
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          className="MuiChip-root"
                          label={network.type} 
                          size="small"
                          color={getTypeColor(network.type)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
                          <Typography>
                            {getRegionName(network.region_code)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
                          <Typography fontWeight="medium">
                            {network.nombre_membres || 0}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          className="MuiChip-root"
                          icon={getStatusIcon(network.status)}
                          label={network.status} 
                          size="small"
                          color={getStatusColor(network.status)}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(network.date_creation)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="Voir détails">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchNetworkDetails(network.id);
                              }}
                              color="primary"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Modifier">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDialog('edit', network);
                              }}
                              color="secondary"
                            >
                              <EditIcon fontSize="small" />
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
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
                className="MuiPagination-root"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Network Details Panel */}
      {selectedNetwork && selectedNetwork.network && (
        <Fade in={!!selectedNetwork}>
          <Card className="network-details-card" sx={{ mt: 4 }}>
            <CardContent>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ 
                      bgcolor: getTypeColor(selectedNetwork.network.type), 
                      mr: 2, 
                      width: 60, 
                      height: 60,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                      <BusinessIcon fontSize="large" />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" component="h2" fontWeight="bold">
                        {selectedNetwork.network.nom}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Chip 
                          className="MuiChip-root"
                          label={selectedNetwork.network.type} 
                          color={getTypeColor(selectedNetwork.network.type)}
                          sx={{ mr: 1 }}
                          size="small"
                        />
                        <Chip 
                          className="MuiChip-root"
                          icon={getStatusIcon(selectedNetwork.network.status)}
                          label={selectedNetwork.network.status} 
                          color={getStatusColor(selectedNetwork.network.status)}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Box>
                  {selectedNetwork.network.description && (
                    <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                      {selectedNetwork.network.description}
                    </Typography>
                  )}
                </Box>
                <Button
                  className="network-action-button"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenDialog('edit', selectedNetwork.network)}
                >
                  Modifier
                </Button>
              </Box>
              
              {loadingDetails ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {/* Tabs */}
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} className="MuiTabs-root">
                      <Tab icon={<DescriptionIcon />} label="Informations" />
                      <Tab icon={<PeopleIcon />} label={`Membres (${selectedNetwork.statistics?.total_membres || 0})`} />
                      <Tab icon={<AssignmentIcon />} label={`Contrats (${selectedNetwork.contracts?.length || 0})`} />
                      <Tab icon={<CalendarIcon />} label={`Activités (${selectedNetwork.activities?.length || 0})`} />
                      <Tab icon={<BusinessIcon />} label="Statistiques" />
                    </Tabs>
                  </Box>

                  {/* Tab Content */}
                  {tabValue === 0 && (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined" sx={{ borderRadius: '16px' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                              <DescriptionIcon sx={{ mr: 1 }} /> Description détaillée
                            </Typography>
                            <Typography variant="body1" color="textSecondary">
                              {selectedNetwork.network.description || 'Aucune description disponible'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined" sx={{ borderRadius: '16px' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarIcon sx={{ mr: 1 }} /> Informations générales
                            </Typography>
                            <List dense>
                              <ListItem>
                                <ListItemAvatar>
                                  <Avatar sx={{ width: 32, height: 32 }}>
                                    <CalendarIcon fontSize="small" />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                  primary="Date de Création" 
                                  secondary={formatDate(selectedNetwork.network.date_creation)}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemAvatar>
                                  <Avatar sx={{ width: 32, height: 32 }}>
                                    <CalendarIcon fontSize="small" />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                  primary="Dernière Modification" 
                                  secondary={formatDate(selectedNetwork.network.date_modification)}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemAvatar>
                                  <Avatar sx={{ width: 32, height: 32 }}>
                                    <LocationIcon fontSize="small" />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                  primary="Région" 
                                  secondary={getRegionName(selectedNetwork.network.region_code) || 'Non spécifiée'}
                                />
                              </ListItem>
                            </List>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  )}

                  {tabValue === 1 && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">
                          Membres du Réseau ({selectedNetwork.statistics?.total_membres || 0})
                        </Typography>
                        <Button
                          className="network-action-button"
                          variant="contained"
                          startIcon={<GroupAddIcon />}
                          size="small"
                          onClick={() => setOpenAddMemberDialog(true)}
                        >
                          Ajouter un Membre
                        </Button>
                      </Box>
                      
                      {selectedNetwork.members?.length > 0 ? (
                        <Grid container spacing={2}>
                        // NetworkPage.jsx - Dans l'affichage des membres (tabValue === 1)
{selectedNetwork.members.map((member) => (
  <Grid item xs={12} sm={6} md={4} key={member.id}>
    <Card variant="outlined" className="member-card" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          {/* ... code existant ... */}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={1}>
          {/* Adhésion */}
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary" display="block">
              Adhésion
            </Typography>
            <Typography variant="body2">
              {formatDate(member.date_adhesion)}
            </Typography>
          </Grid>
          
          {/* Statut */}
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary" display="block">
              Statut
            </Typography>
            <Chip 
              className="MuiChip-root"
              label={member.statut} 
              size="small"
              color={getStatusColor(member.statut)}
              sx={{ mt: 0.5 }}
            />
          </Grid>
          
          {/* AJOUTER LA RÉGION POUR LES CENTRES DE SANTÉ */}
          {member.type_membre === 'Centre de santé' && member.region_code && (
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="caption" color="textSecondary">
                  Région: {getRegionName(member.region_code)}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  </Grid>
))}
                        </Grid>
                      ) : (
                        <Box className="empty-state">
                          <PeopleIcon className="empty-state-icon" sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="textSecondary">
                            Aucun membre dans ce réseau
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Ajoutez des bénéficiaires, centres de santé ou prestataires au réseau
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {tabValue === 2 && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">
                          Contrats ({selectedNetwork.contracts?.length || 0})
                        </Typography>
                        <Button
                          className="network-action-button"
                          variant="contained"
                          startIcon={<AddIcon />}
                          size="small"
                          onClick={() => setOpenAddContractDialog(true)}
                        >
                          Nouveau Contrat
                        </Button>
                      </Box>
                      
                      {selectedNetwork.contracts?.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '16px' }}>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Numéro</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Date Début</TableCell>
                                <TableCell>Date Fin</TableCell>
                                <TableCell align="right">Montant</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell>Partenaire</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedNetwork.contracts.map((contract) => (
                                <TableRow key={contract.id} hover>
                                  <TableCell>
                                    <Typography fontWeight="medium">
                                      {contract.numero_contrat || contract.NUMERO_CONTRAT}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>{contract.type_contrat || contract.TYPE_CONTRAT}</TableCell>
                                  <TableCell>{formatDate(contract.date_debut || contract.DATE_DEBUT)}</TableCell>
                                  <TableCell>{formatDate(contract.date_fin || contract.DATE_FIN)}</TableCell>
                                  <TableCell align="right">
                                    {contract.montant_contrat || contract.MONTANT_CONTRAT ? 
                                      `${parseFloat(contract.montant_contrat || contract.MONTANT_CONTRAT).toLocaleString()} XAF` : 
                                      '-'
                                    }
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      className="MuiChip-root"
                                      label={contract.status || contract.STATUS} 
                                      size="small"
                                      color={getStatusColor(contract.status || contract.STATUS)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {contract.partenaire || contract.PARTENAIRE || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Box className="empty-state">
                          <AssignmentIcon className="empty-state-icon" sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="textSecondary">
                            Aucun contrat pour ce réseau
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Créez le premier contrat pour ce réseau
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {tabValue === 3 && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">
                          Activités ({selectedNetwork.activities?.length || 0})
                        </Typography>
                        <Button
                          className="network-action-button"
                          variant="contained"
                          startIcon={<AddIcon />}
                          size="small"
                          onClick={() => setOpenAddActivityDialog(true)}
                        >
                          Nouvelle Activité
                        </Button>
                      </Box>
                      
                      {selectedNetwork.activities?.length > 0 ? (
                        <Grid container spacing={2}>
                          {selectedNetwork.activities.map((activity) => (
                            <Grid item xs={12} sm={6} md={4} key={activity.id}>
                              <Card variant="outlined" className="member-card" sx={{ height: '100%' }}>
                                <CardContent>
                                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                    {activity.libelle_activite || activity.LIBELLE_ACTIVITE}
                                  </Typography>
                                  
                                  <Typography variant="body2" color="textSecondary" paragraph>
                                    {activity.description || activity.DESCRIPTION || 'Aucune description'}
                                  </Typography>
                                  
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="body2">
                                      {formatDate(activity.date_debut || activity.DATE_DEBUT)}
                                    </Typography>
                                    {activity.date_fin && (
                                      <>
                                        <Typography variant="body2" sx={{ mx: 1 }}>→</Typography>
                                        <Typography variant="body2">
                                          {formatDate(activity.date_fin || activity.DATE_FIN)}
                                        </Typography>
                                      </>
                                    )}
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="body2">
                                      {activity.lieu || activity.LIEU || 'Non spécifié'}
                                    </Typography>
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                    <Chip 
                                      className="MuiChip-root"
                                      label={activity.status || activity.STATUS} 
                                      size="small"
                                      color={getStatusColor(activity.status || activity.STATUS)}
                                    />
                                    <Typography variant="body2" color="textSecondary">
                                      {activity.nombre_participants || activity.NOMBRE_PARTICIPANTS || 0} participants
                                    </Typography>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Box className="empty-state">
                          <CalendarIcon className="empty-state-icon" sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="textSecondary">
                            Aucune activité planifiée
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Planifiez la première activité pour ce réseau
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {tabValue === 4 && (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: '16px' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                              <PeopleIcon sx={{ mr: 1 }} /> Statistiques des Membres
                            </Typography>
                            <List dense>
                              <ListItem>
                                <ListItemText 
                                  primary="Total des Membres" 
                                  secondary={selectedNetwork.statistics?.total_membres || 0}
                                  primaryTypographyProps={{ fontWeight: 'medium' }}
                                />
                              </ListItem>
                              <Divider />
                              <ListItem>
                                <ListItemText 
                                  primary="Bénéficiaires" 
                                  secondary={selectedNetwork.statistics?.beneficiaires || 0}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText 
                                  primary="Centres de Santé" 
                                  secondary={selectedNetwork.statistics?.centres_sante || 0}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText 
                                  primary="Prestataires" 
                                  secondary={selectedNetwork.statistics?.prestataires || 0}
                                />
                              </ListItem>
                              <Divider />
                              <ListItem>
                                <ListItemText 
                                  primary="Membres Actifs" 
                                  secondary={selectedNetwork.statistics?.membres_actifs || 0}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText 
                                  primary="Membres Inactifs" 
                                  secondary={selectedNetwork.statistics?.membres_inactifs || 0}
                                />
                              </ListItem>
                            </List>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: '16px' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                              <BusinessIcon sx={{ mr: 1 }} /> Activité du Réseau
                            </Typography>
                            <List dense>
                              <ListItem>
                                <ListItemAvatar>
                                  <Avatar sx={{ width: 32, height: 32 }}>
                                    <AssignmentIcon fontSize="small" />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                  primary="Contrats Actifs" 
                                  secondary={selectedNetwork.contracts?.filter(c => (c.status || c.STATUS) === 'Actif').length || 0}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemAvatar>
                                  <Avatar sx={{ width: 32, height: 32 }}>
                                    <CalendarIcon fontSize="small" />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                  primary="Activités Planifiées" 
                                  secondary={selectedNetwork.activities?.filter(a => (a.status || a.STATUS) === 'Planifie').length || 0}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemAvatar>
                                  <Avatar sx={{ width: 32, height: 32 }}>
                                    <CheckCircleIcon fontSize="small" />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                  primary="Activités Terminées" 
                                  secondary={selectedNetwork.activities?.filter(a => (a.status || a.STATUS) === 'Termine').length || 0}
                                />
                              </ListItem>
                            </List>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* ============================================= */}
      {/* MODALS */}
      {/* ============================================= */}

      {/* Create/Edit Network Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'create' ? 'Créer un Nouveau Réseau' : 'Modifier le Réseau'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Nom du Réseau *"
                fullWidth
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                error={!formData.nom}
                helperText={!formData.nom ? "Ce champ est requis" : ""}
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez les objectifs et caractéristiques du réseau..."
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Type de Réseau *"
                fullWidth
                required
                select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                error={!formData.type}
                helperText={!formData.type ? "Ce champ est requis" : ""}
                className="MuiTextField-root"
              >
                <MenuItem value="">Sélectionnez un type</MenuItem>
                {networkTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  label="Statut"
                  value={formData.status || 'Actif'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="MuiOutlinedInput-root"
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Objectifs"
                fullWidth
                multiline
                rows={2}
                value={formData.objectifs}
                onChange={(e) => setFormData({ ...formData, objectifs: e.target.value })}
                placeholder="Définissez les objectifs principaux du réseau..."
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Zone de Couverture"
                fullWidth
                value={formData.zone_couverture}
                onChange={(e) => setFormData({ ...formData, zone_couverture: e.target.value })}
                placeholder="Ex: Département, ville, bassin de vie..."
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Population Cible"
                fullWidth
                value={formData.population_cible}
                onChange={(e) => setFormData({ ...formData, population_cible: e.target.value })}
                placeholder="Ex: Adultes, enfants, patients chroniques..."
                className="MuiTextField-root"
              />
            </Grid>
            {/* AJOUT DU CHAMP RÉGION ICI */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Région</InputLabel>
                <Select
                  label="Région"
                  value={formData.region_code}
                  onChange={(e) => setFormData({ ...formData, region_code: e.target.value })}
                  className="MuiOutlinedInput-root"
                >
                  <MenuItem value="">Sélectionnez une région</MenuItem>
                  {regions.map((region) => (
                    <MenuItem key={region.code} value={region.code}>
                      {region.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              {/* Champ vide pour maintenir la structure de grille */}
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Contact Principal"
                fullWidth
                value={formData.contact_principal}
                onChange={(e) => setFormData({ ...formData, contact_principal: e.target.value })}
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Téléphone"
                fullWidth
                value={formData.telephone_contact}
                onChange={(e) => setFormData({ ...formData, telephone_contact: e.target.value })}
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                fullWidth
                type="email"
                value={formData.email_contact}
                onChange={(e) => setFormData({ ...formData, email_contact: e.target.value })}
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Site Web"
                fullWidth
                value={formData.site_web}
                onChange={(e) => setFormData({ ...formData, site_web: e.target.value })}
                placeholder="https://..."
                className="MuiTextField-root"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Annuler
          </Button>
          <Button 
            className="network-action-button"
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting || !formData.nom || !formData.type}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Enregistrement...' : dialogType === 'create' ? 'Créer' : 'Modifier'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={openAddMemberDialog} onClose={() => setOpenAddMemberDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GroupAddIcon sx={{ mr: 1 }} />
            Ajouter un Membre au Réseau
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type de Membre *</InputLabel>
                <Select
                  label="Type de Membre *"
                  value={memberForm.type_membre}
                  onChange={(e) => {
                    setMemberForm({ ...memberForm, type_membre: e.target.value });
                    setSearchType(e.target.value === 'Beneficiaire' ? 'beneficiaire' : 
                                 e.target.value === 'Centre de santé' ? 'centre' : 'prestataire');
                  }}
                  className="MuiOutlinedInput-root"
                >
                  {memberTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {option.icon}
                        <Typography sx={{ ml: 1 }}>{option.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                  fullWidth
                  label="Rechercher"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  placeholder={`Rechercher un ${memberForm.type_membre.toLowerCase()}...`}
                  className="MuiTextField-root"
                />
                <Button
                  className="network-action-button"
                  variant="outlined"
                  sx={{ ml: 2 }}
                  onClick={() => setOpenSearchModal(true)}
                >
                  Rechercher
                </Button>
              </Box>
            </Grid>

            {memberForm.type_membre === 'Beneficiaire' && memberForm.cod_ben && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderRadius: '16px' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Bénéficiaire sélectionné
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1">
                          {beneficiaires.find(b => b.id === memberForm.cod_ben)?.nom || 'Bénéficiaire'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          ID: {memberForm.cod_ben}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {memberForm.type_membre === 'Centre de santé' && memberForm.cod_cen && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderRadius: '16px' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Centre de santé sélectionné
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2 }}>
                        <LocalHospitalIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1">
                          {centresSante.find(c => c.id === memberForm.cod_cen)?.nom || 'Centre de santé'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          ID: {memberForm.cod_cen}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {memberForm.type_membre === 'Prestataire' && memberForm.cod_pre && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderRadius: '16px' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Prestataire sélectionné
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2 }}>
                        <MedicalServicesIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1">
                          {prestataires.find(p => p.id === memberForm.cod_pre)?.nom || 'Prestataire'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          ID: {memberForm.cod_pre}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                label="Date d'Adhésion"
                type="date"
                fullWidth
                value={memberForm.date_adhesion}
                onChange={(e) => setMemberForm({ ...memberForm, date_adhesion: e.target.value })}
                InputLabelProps={{ shrink: true }}
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  label="Statut"
                  value={memberForm.statut}
                  onChange={(e) => setMemberForm({ ...memberForm, statut: e.target.value })}
                  className="MuiOutlinedInput-root"
                >
                  <MenuItem value="Actif">Actif</MenuItem>
                  <MenuItem value="Inactif">Inactif</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenAddMemberDialog(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button 
            className="network-action-button"
            onClick={handleAddMember} 
            variant="contained" 
            disabled={submitting || 
              (memberForm.type_membre === 'Beneficiaire' && !memberForm.cod_ben) ||
              (memberForm.type_membre === 'Centre de santé' && !memberForm.cod_cen) ||
              (memberForm.type_membre === 'Prestataire' && !memberForm.cod_pre)}
            startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {submitting ? 'Ajout en cours...' : 'Ajouter le Membre'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Search Modal */}
      <Dialog open={openSearchModal} onClose={() => setOpenSearchModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SearchIcon sx={{ mr: 1 }} />
            Rechercher un {searchType === 'beneficiaire' ? 'Bénéficiaire' : 
                          searchType === 'centre' ? 'Centre de Santé' : 'Prestataire'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Rechercher"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              placeholder={`Rechercher par nom...`}
              className="MuiTextField-root"
            />
            
            {searching ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
                {searchResults.map((item) => (
                  <ListItemButton
                    key={item.id}
                    onClick={() => handleSelectMember(item)}
                    sx={{ mb: 1, borderRadius: 1 }}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        {searchType === 'beneficiaire' ? <PersonIcon /> :
                         searchType === 'centre' ? <LocalHospitalIcon /> :
                         <MedicalServicesIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.nom || item.nom_centre || item.nom_prestataire}
                      secondary={
                        searchType === 'beneficiaire' ? 
                          `${item.prenom || ''} - ${item.telephone || 'N/A'}` :
                        searchType === 'centre' ? 
                          `${item.type || 'Centre de santé'} - ${item.telephone || 'N/A'}` :
                          `${item.specialite || 'Prestataire'} - ${item.telephone || 'N/A'}`
                      }
                    />
                  </ListItemButton>
                ))}
                
                {searchResults.length === 0 && searchQuery && (
                  <Box className="empty-state">
                    <SearchIcon className="empty-state-icon" sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                      Aucun résultat trouvé
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Essayez avec d'autres termes de recherche
                    </Typography>
                  </Box>
                )}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenSearchModal(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Activity Dialog */}
      <Dialog open={openAddActivityDialog} onClose={() => setOpenAddActivityDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CalendarIcon sx={{ mr: 1 }} />
            Ajouter une Activité
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Libellé de l'Activité *"
                fullWidth
                required
                value={activityForm.libelle_activite}
                onChange={(e) => setActivityForm({ ...activityForm, libelle_activite: e.target.value })}
                error={!activityForm.libelle_activite}
                helperText={!activityForm.libelle_activite ? "Ce champ est requis" : ""}
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Type d'Activité *"
                fullWidth
                required
                select
                value={activityForm.type_activite}
                onChange={(e) => setActivityForm({ ...activityForm, type_activite: e.target.value })}
                error={!activityForm.type_activite}
                helperText={!activityForm.type_activite ? "Ce champ est requis" : ""}
                className="MuiTextField-root"
              >
                <MenuItem value="">Sélectionnez un type</MenuItem>
                {activityTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  label="Statut"
                  value={activityForm.status}
                  onChange={(e) => setActivityForm({ ...activityForm, status: e.target.value })}
                  className="MuiOutlinedInput-root"
                >
                  <MenuItem value="Planifie">Planifié</MenuItem>
                  <MenuItem value="En cours">En cours</MenuItem>
                  <MenuItem value="Termine">Terminé</MenuItem>
                  <MenuItem value="Annule">Annulé</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Décrivez l'activité..."
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date de Début *"
                type="date"
                fullWidth
                required
                value={activityForm.date_debut}
                onChange={(e) => setActivityForm({ ...activityForm, date_debut: e.target.value })}
                InputLabelProps={{ shrink: true }}
                error={!activityForm.date_debut}
                helperText={!activityForm.date_debut ? "Ce champ est requis" : ""}
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date de Fin"
                type="date"
                fullWidth
                value={activityForm.date_fin}
                onChange={(e) => setActivityForm({ ...activityForm, date_fin: e.target.value })}
                InputLabelProps={{ shrink: true }}
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Lieu"
                fullWidth
                value={activityForm.lieu}
                onChange={(e) => setActivityForm({ ...activityForm, lieu: e.target.value })}
                placeholder="Ex: Siège du réseau, centre de santé..."
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nombre de Participants"
                type="number"
                fullWidth
                value={activityForm.nombre_participants}
                onChange={(e) => setActivityForm({ ...activityForm, nombre_participants: e.target.value })}
                className="MuiTextField-root"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenAddActivityDialog(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button 
            className="network-action-button"
            onClick={handleAddActivity} 
            variant="contained" 
            disabled={submitting || !activityForm.libelle_activite || !activityForm.type_activite || !activityForm.date_debut}
            startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {submitting ? 'Création en cours...' : 'Créer l\'Activité'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Contract Dialog */}
      <Dialog open={openAddContractDialog} onClose={() => setOpenAddContractDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 1 }} />
            Ajouter un Contrat
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Numéro de Contrat *"
                fullWidth
                required
                value={contractForm.numero_contrat}
                onChange={(e) => setContractForm({ ...contractForm, numero_contrat: e.target.value })}
                error={!contractForm.numero_contrat}
                helperText={!contractForm.numero_contrat ? "Ce champ est requis" : ""}
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Type de Contrat *"
                fullWidth
                required
                select
                value={contractForm.type_contrat}
                onChange={(e) => setContractForm({ ...contractForm, type_contrat: e.target.value })}
                error={!contractForm.type_contrat}
                helperText={!contractForm.type_contrat ? "Ce champ est requis" : ""}
                className="MuiTextField-root"
              >
                <MenuItem value="">Sélectionnez un type</MenuItem>
                {contractTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Objet du Contrat"
                fullWidth
                multiline
                rows={2}
                value={contractForm.objet_contrat}
                onChange={(e) => setContractForm({ ...contractForm, objet_contrat: e.target.value })}
                placeholder="Décrivez l'objet du contrat..."
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date de Début *"
                type="date"
                fullWidth
                required
                value={contractForm.date_debut}
                onChange={(e) => setContractForm({ ...contractForm, date_debut: e.target.value })}
                InputLabelProps={{ shrink: true }}
                error={!contractForm.date_debut}
                helperText={!contractForm.date_debut ? "Ce champ est requis" : ""}
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date de Fin"
                type="date"
                fullWidth
                value={contractForm.date_fin}
                onChange={(e) => setContractForm({ ...contractForm, date_fin: e.target.value })}
                InputLabelProps={{ shrink: true }}
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date de Signature"
                type="date"
                fullWidth
                value={contractForm.date_signature}
                onChange={(e) => setContractForm({ ...contractForm, date_signature: e.target.value })}
                InputLabelProps={{ shrink: true }}
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Montant (XAF)"
                type="number"
                fullWidth
                value={contractForm.montant_contrat}
                onChange={(e) => setContractForm({ ...contractForm, montant_contrat: e.target.value })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">XAF</InputAdornment>,
                }}
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Partenaire"
                fullWidth
                value={contractForm.partenaire}
                onChange={(e) => setContractForm({ ...contractForm, partenaire: e.target.value })}
                placeholder="Nom du partenaire..."
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Contact Partenaire"
                fullWidth
                value={contractForm.contact_partenaire}
                onChange={(e) => setContractForm({ ...contractForm, contact_partenaire: e.target.value })}
                placeholder="Nom et coordonnées du contact..."
                className="MuiTextField-root"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={contractForm.renouvelable}
                    onChange={(e) => setContractForm({ ...contractForm, renouvelable: e.target.checked })}
                  />
                }
                label="Contrat renouvelable"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  label="Statut"
                  value={contractForm.status}
                  onChange={(e) => setContractForm({ ...contractForm, status: e.target.value })}
                  className="MuiOutlinedInput-root"
                >
                  <MenuItem value="Actif">Actif</MenuItem>
                  <MenuItem value="Expire">Expiré</MenuItem>
                  <MenuItem value="Resilie">Résilié</MenuItem>
                  <MenuItem value="En attente">En attente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenAddContractDialog(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button 
            className="network-action-button"
            onClick={handleAddContract} 
            variant="contained" 
            disabled={submitting || !contractForm.numero_contrat || !contractForm.type_contrat || !contractForm.date_debut}
            startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {submitting ? 'Création en cours...' : 'Créer le Contrat'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NetworkPage;