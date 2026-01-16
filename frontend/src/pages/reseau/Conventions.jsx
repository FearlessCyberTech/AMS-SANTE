// src/pages/GestionAssurance.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Fade,
  Snackbar,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Web as WebIcon,
  CalendarToday as CalendarIcon,
  AccountBalance as AccountBalanceIcon,
  CloudUpload as UploadIcon,
  People as PeopleIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import {
  compagniesAPI,
  conventionsAPI,
  tarifsAPI,
  baremesAPI,
  typesAssureursAPI
} from '../../services/api';
import './Conventions.css';

// Composant principal de gestion d'assurance
const GestionAssurance = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const messageRef = useRef({ type: '', text: '' });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const showMessage = useCallback((type, text) => {
    const newMessage = { type, text };
    setMessage(newMessage);
    messageRef.current = newMessage;
  }, []);

  const handleCloseMessage = () => {
    setMessage({ type: '', text: '' });
    messageRef.current = { type: '', text: '' };
  };

  const tabs = [
    { label: 'Compagnies', icon: <BusinessIcon /> },
    { label: 'Conventions', icon: <DescriptionIcon /> },
    { label: 'Tarifs', icon: <MoneyIcon /> },
    { label: 'Barèmes', icon: <AssessmentIcon /> },
    { label: 'Polices', icon: <SecurityIcon /> }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          {/* En-tête */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom color="primary">
                Gestion Assurance
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Gérez les compagnies, conventions, tarifs, barèmes et polices d'assurance
              </Typography>
            </Box>
          </Box>

          {/* Message d'alerte */}
          {message.text && (
            <Alert 
              severity={message.type} 
              onClose={handleCloseMessage}
              sx={{ mb: 3 }}
            >
              {message.text}
            </Alert>
          )}

          {/* Onglets */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="onglets gestion assurance"
            >
              {tabs.map((tab, index) => (
                <Tab 
                  key={index}
                  label={tab.label}
                  icon={tab.icon}
                  iconPosition="start"
                  sx={{ minHeight: 60 }}
                />
              ))}
            </Tabs>
          </Box>

          {/* Contenu des onglets */}
          <Box sx={{ mt: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Fade in={!loading} timeout={500}>
                <div>
                  {activeTab === 0 && <CompagniesTab showMessage={showMessage} />}
                  {activeTab === 1 && <ConventionsTab showMessage={showMessage} />}
                  {activeTab === 2 && <TarifsTab showMessage={showMessage} />}
                  {activeTab === 3 && <BaremesTab showMessage={showMessage} />}
                  {activeTab === 4 && <PolicesTab showMessage={showMessage} />}
                </div>
              </Fade>
            )}
          </Box>
        </Paper>
      </Container>

      <Snackbar
        open={message.text !== ''}
        autoHideDuration={6000}
        onClose={handleCloseMessage}
        message={message.text}
      />
    </LocalizationProvider>
  );
};

// Composant pour l'onglet Compagnies
 const CompagniesTab = ({ showMessage }) => {
  const [compagnies, setCompagnies] = useState([]);
  const [filteredCompagnies, setFilteredCompagnies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: ''
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCompagnie, setSelectedCompagnie] = useState(null);
  const [dialogMode, setDialogMode] = useState('create');
  const [typesAssureurs, setTypesAssureurs] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Fonction pour charger les types d'assureurs
  const chargerTypesAssureurs = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const response = await typesAssureursAPI.getList();
      if (response.success) {
        setTypesAssureurs(response.types_assureurs || []);
        return response.types_assureurs || [];
      } else {
        showMessage('error', response.message || 'Erreur lors du chargement des types d\'assureurs');
        return [];
      }
    } catch (error) {
      console.error('Erreur chargement types assureurs:', error);
      showMessage('error', 'Erreur lors du chargement des types d\'assureurs');
      return [];
    } finally {
      setLoadingTypes(false);
    }
  }, [showMessage]);

  // Fonction pour charger les compagnies avec les types d'assureurs
  const chargerCompagnies = useCallback(async (typesList = null) => {
    setLoading(true);
    try {
      const response = await compagniesAPI.getAll();
      
      if (response.success) {
        // Utiliser les types passés en paramètre ou ceux du state
       const typesToUse = localTypesAssureurs.length > 0 ? localTypesAssureurs : (typesAssureurs || []);
        
        // Formater les compagnies avec les informations des types d'assureurs
        const compagniesFormatees = response.compagnies.map(compagnie => {
          // Chercher le type d'assureur correspondant
          const typeAssureur = typesToUse.find(t => t.cod_sta === compagnie.COD_STA);
          
          return {
            ...compagniesAPI.formatCompagnieForDisplay(compagnie),
            // Propriétés originales pour la compatibilité
            COD_STA: compagnie.COD_STA,
            // Informations du type d'assureur
            type_assureur_libelle: typeAssureur ? typeAssureur.lib_sta : 'Non défini',
            type_assureur_status: typeAssureur ? typeAssureur.status : 'INACTIF'
          };
        });
        
        setCompagnies(compagniesFormatees);
        setFilteredCompagnies(compagniesFormatees);
      } else {
        showMessage('error', response.message || 'Erreur lors du chargement des compagnies');
      }
    } catch (error) {
      console.error('Erreur chargement compagnies:', error);
      showMessage('error', 'Erreur lors du chargement des compagnies');
    } finally {
      setLoading(false);
    }
  }, [showMessage, typesAssureurs]);

  // Charger au montage
  useEffect(() => {
    const loadData = async () => {
      await chargerTypesAssureurs();
      await chargerCompagnies();
    };
    loadData();
  }, []);

  // Recharger les compagnies quand les types d'assureurs changent
  useEffect(() => {
    if (typesAssureurs.length > 0 && compagnies.length > 0) {
      // Mettre à jour les compagnies avec les nouveaux types d'assureurs
      const compagniesFormatees = compagnies.map(compagnie => {
        const typeAssureur = typesAssureurs.find(t => t.cod_sta === compagnie.COD_STA);
        return {
          ...compagnie,
          type_assureur_libelle: typeAssureur ? typeAssureur.lib_sta : 'Non défini',
          type_assureur_status: typeAssureur ? typeAssureur.status : 'INACTIF'
        };
      });
      setCompagnies(compagniesFormatees);
      setFilteredCompagnies(compagniesFormatees);
    }
  }, [typesAssureurs]);

  // Filtrage
  useEffect(() => {
    let result = compagnies;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(comp => 
        comp.nom?.toLowerCase().includes(term) ||
        comp.email?.toLowerCase().includes(term) ||
        comp.telephone?.includes(term) ||
        comp.num_agrement?.toLowerCase().includes(term) ||
        comp.type_assureur_libelle?.toLowerCase().includes(term)
      );
    }

    if (filters.type) {
      result = result.filter(comp => comp.type_compagnie === filters.type);
    }

    if (filters.status) {
      const isActive = filters.status === 'actif';
      result = result.filter(comp => comp.actif === isActive);
    }

    setFilteredCompagnies(result);
    setPage(0);
  }, [searchTerm, filters, compagnies]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (mode, compagnie = null) => {
    setDialogMode(mode);
    setSelectedCompagnie(compagnie);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCompagnie(null);
  };

  const handleSaveCompagnie = async (data) => {
    try {
      let response;
      
      if (dialogMode === 'create') {
        response = await compagniesAPI.create(data);
        if (response.success) {
          showMessage('success', 'Compagnie créée avec succès');
        }
      } else {
        response = await compagniesAPI.update(selectedCompagnie.id, data);
        if (response.success) {
          showMessage('success', 'Compagnie modifiée avec succès');
        }
      }
      
      if (response.success) {
        chargerCompagnies();
        handleCloseDialog();
      } else {
        showMessage('error', response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde compagnie:', error);
      showMessage('error', 'Erreur lors de la sauvegarde de la compagnie');
    }
  };

  const handleDeleteCompagnie = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir désactiver cette compagnie ?')) {
      try {
        const response = await compagniesAPI.delete(id);
        
        if (response.success) {
          showMessage('success', 'Compagnie désactivée avec succès');
          chargerCompagnies();
        } else {
          showMessage('error', response.message || 'Erreur lors de la désactivation');
        }
      } catch (error) {
        console.error('Erreur suppression compagnie:', error);
        showMessage('error', 'Erreur lors de la désactivation de la compagnie');
      }
    }
  };

  const handleActivateCompagnie = async (id) => {
    try {
      const response = await compagniesAPI.activate(id);
      
      if (response.success) {
        showMessage('success', 'Compagnie activée avec succès');
        chargerCompagnies();
      } else {
        showMessage('error', response.message || 'Erreur lors de l\'activation');
      }
    } catch (error) {
      console.error('Erreur activation compagnie:', error);
      showMessage('error', 'Erreur lors de l\'activation de la compagnie');
    }
  };

  const totalCompagnies = compagnies.length;
  const activesCompagnies = compagnies.filter(c => c.actif).length;
  const inactivesCompagnies = compagnies.filter(c => !c.actif).length;

  return (
    <Box>
      {/* Barre d'outils */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Rechercher une compagnie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type Compagnie</InputLabel>
              <Select
                value={filters.type}
                label="Type Compagnie"
                onChange={(e) => setFilters({...filters, type: e.target.value || ''})}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="ASSURANCE">Assurance</MenuItem>
                <MenuItem value="MUTUELLE">Mutuelle</MenuItem>
                <MenuItem value="BANQUE">Banque</MenuItem>
                <MenuItem value="FINANCE">Finance</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.status}
                label="Statut"
                onChange={(e) => setFilters({...filters, status: e.target.value || ''})}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="actif">Actif</MenuItem>
                <MenuItem value="inactif">Inactif</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={chargerCompagnies}
            >
              Actualiser
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
            >
              Nouvelle
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total"
            value={totalCompagnies}
            icon={<BusinessIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Actives"
            value={activesCompagnies}
            icon={<CheckIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Inactives"
            value={inactivesCompagnies}
            icon={<WarningIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Types Assureurs"
            value={[...new Set(compagnies.map(c => c.type_assureur_libelle))].filter(Boolean).length}
            icon={<CategoryIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Tableau */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.light' }}>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Type Compagnie</TableCell>
              <TableCell>Type Assureur</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>RIB/Agrément</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredCompagnies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Aucune compagnie trouvée
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCompagnies
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((compagnie) => (
                  <TableRow key={compagnie.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {compagnie.id || compagnie.COD_ASS}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          {compagnie.nom?.charAt(0) || 'C'}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {compagnie.nom}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {compagnie.adresse?.substring(0, 30)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={compagnie.type_compagnie || 'Non défini'} 
                        size="small" 
                        variant="outlined"
                        color={
                          compagnie.type_compagnie === 'ASSURANCE' ? 'primary' :
                          compagnie.type_compagnie === 'MUTUELLE' ? 'secondary' :
                          compagnie.type_compagnie === 'BANQUE' ? 'success' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={`Statut: ${compagnie.type_assureur_status === 'ACTIF' ? 'Actif' : 'Inactif'}`}>
                        <Chip 
                          label={compagnie.type_assureur_libelle || 'Non défini'} 
                          size="small" 
                          variant="outlined"
                          color={
                            compagnie.type_assureur_status === 'ACTIF' ? 'success' :
                            compagnie.type_assureur_status === 'INACTIF' ? 'error' : 'default'
                          }
                          icon={
                            compagnie.type_assureur_status === 'ACTIF' ? 
                              <CheckIcon fontSize="small" /> : 
                              <WarningIcon fontSize="small" />
                          }
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2">{compagnie.email || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2">{compagnie.telephone || 'N/A'}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {compagnie.num_agrement || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={compagnie.actif ? 'Active' : 'Inactive'}
                        color={compagnie.actif ? 'success' : 'error'}
                        size="small"
                        onClick={compagnie.actif ? 
                          () => handleDeleteCompagnie(compagnie.id) : 
                          () => handleActivateCompagnie(compagnie.id)
                        }
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Voir détails">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => showMessage('info', `Détails de ${compagnie.nom}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenDialog('edit', compagnie)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteCompagnie(compagnie.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCompagnies.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page:"
        />
      </TableContainer>

      {/* Dialog de création/édition */}
      <CompagnieDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveCompagnie}
        mode={dialogMode}
        compagnie={selectedCompagnie}
        typesAssureurs={typesAssureurs}
        showMessage={showMessage}
      />
    </Box>
  );
};

// Composant pour l'onglet Conventions
const ConventionsTab = ({ showMessage }) => {
  const [conventions, setConventions] = useState([]);
  const [filteredConventions, setFilteredConventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConvention, setSelectedConvention] = useState(null);
  const [dialogMode, setDialogMode] = useState('create');
  const [compagniesList, setCompagniesList] = useState([]);

  const chargerConventions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await conventionsAPI.getAll();
      
      if (response.success) {
        setConventions(response.conventions || []);
        setFilteredConventions(response.conventions || []);
      } else {
        showMessage('error', response.message || 'Erreur lors du chargement des conventions');
      }
    } catch (error) {
      console.error('Erreur chargement conventions:', error);
      showMessage('error', 'Erreur lors du chargement des conventions');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  const chargerCompagnies = useCallback(async () => {
    try {
      const response = await compagniesAPI.getAll();
      if (response.success) {
        setCompagniesList(response.compagnies || []);
      }
    } catch (error) {
      console.error('Erreur chargement compagnies:', error);
    }
  }, []);

  useEffect(() => {
    chargerConventions();
    chargerCompagnies();
  }, []);

  useEffect(() => {
    let result = conventions;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(conv => 
        conv.LIB_CNV?.toLowerCase().includes(term) ||
        conv.COD_CNV?.toLowerCase().includes(term)
      );
    }

    setFilteredConventions(result);
    setPage(0);
  }, [searchTerm, conventions]);

  const handleOpenDialog = (mode, convention = null) => {
    setDialogMode(mode);
    setSelectedConvention(convention);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedConvention(null);
  };

  const handleSaveConvention = async (data) => {
    try {
      let response;
      
      if (dialogMode === 'create') {
        response = await conventionsAPI.create(data);
        if (response.success) {
          showMessage('success', 'Convention créée avec succès');
        }
      } else {
        response = await conventionsAPI.update(selectedConvention.id, data);
        if (response.success) {
          showMessage('success', 'Convention modifiée avec succès');
        }
      }
      
      if (response.success) {
        chargerConventions();
        handleCloseDialog();
      } else {
        showMessage('error', response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde convention:', error);
      showMessage('error', 'Erreur lors de la sauvegarde de la convention');
    }
  };

  const handleDeleteConvention = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette convention ?')) {
      try {
        const response = await conventionsAPI.delete(id);
        
        if (response.success) {
          showMessage('success', 'Convention supprimée avec succès');
          chargerConventions();
        } else {
          showMessage('error', response.message || 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur suppression convention:', error);
        showMessage('error', 'Erreur lors de la suppression de la convention');
      }
    }
  };

  const getCompagnieName = (codAss) => {
    const compagnie = compagniesList.find(c => c.COD_ASS === codAss || c.id === codAss);
    return compagnie?.LIB_ASS || compagnie?.nom || codAss;
  };

  return (
    <Box>
      {/* Barre d'outils */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Rechercher une convention..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={chargerConventions}
            >
              Actualiser
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
            >
              Nouvelle
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Conventions"
            value={conventions.length}
            icon={<DescriptionIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Actives"
            value={conventions.filter(c => c.ACTIF === 1 || c.actif).length}
            icon={<CheckIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="En attente"
            value={conventions.filter(c => c.ETAT_CNV === 'EN_ATTENTE').length}
            icon={<WarningIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Expirées"
            value={conventions.filter(c => {
              if (!c.DATE_FIN) return false;
              return new Date(c.DATE_FIN) < new Date();
            }).length}
            icon={<InfoIcon />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Tableau */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.light' }}>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Libellé</TableCell>
              <TableCell>Compagnie</TableCell>
              <TableCell>Date Début</TableCell>
              <TableCell>Date Fin</TableCell>
              <TableCell>État</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredConventions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Aucune convention trouvée
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredConventions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((convention) => (
                  <TableRow key={convention.id || convention.COD_CNV} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {convention.COD_CNV || convention.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {convention.LIB_CNV || 'Sans libellé'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getCompagnieName(convention.COD_ASS)} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {convention.DAT_CNV ? new Date(convention.DAT_CNV).toLocaleDateString('fr-FR') : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {convention.DATE_FIN ? new Date(convention.DATE_FIN).toLocaleDateString('fr-FR') : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={convention.ETAT_CNV || (convention.actif ? 'ACTIVE' : 'INACTIVE')}
                        size="small"
                        color={
                          convention.ETAT_CNV === 'ACTIVE' || convention.actif ? 'success' :
                          convention.ETAT_CNV === 'EN_ATTENTE' ? 'warning' :
                          convention.ETAT_CNV === 'EXPIRED' ? 'error' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Voir détails">
                          <IconButton size="small" color="info">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenDialog('edit', convention)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteConvention(convention.id || convention.COD_CNV)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredConventions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Lignes par page:"
        />
      </TableContainer>

      {/* Dialog de création/édition */}
      <ConventionDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveConvention}
        mode={dialogMode}
        convention={selectedConvention}
        compagniesList={compagniesList}
      />
    </Box>
  );
};

// Composant pour l'onglet Tarifs
const TarifsTab = ({ showMessage }) => {
  const [tarifs, setTarifs] = useState([]);
  const [filteredTarifs, setFilteredTarifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTarif, setSelectedTarif] = useState(null);
  const [dialogMode, setDialogMode] = useState('create');

  const chargerTarifs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await tarifsAPI.getAll();
      
      if (response.success) {
        setTarifs(response.tarifs || []);
        setFilteredTarifs(response.tarifs || []);
      } else {
        showMessage('error', response.message || 'Erreur lors du chargement des tarifs');
      }
    } catch (error) {
      console.error('Erreur chargement tarifs:', error);
      showMessage('error', 'Erreur lors du chargement des tarifs');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    chargerTarifs();
  }, []);

  useEffect(() => {
    let result = tarifs;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.LIB_TAR?.toLowerCase().includes(term) ||
        t.COD_TAR?.toString().includes(term)
      );
    }

    setFilteredTarifs(result);
  }, [searchTerm, tarifs]);

  const handleOpenDialog = (mode, tarif = null) => {
    setDialogMode(mode);
    setSelectedTarif(tarif);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTarif(null);
  };

  const handleSaveTarif = async (data) => {
    try {
      let response;
      
      if (dialogMode === 'create') {
        response = await tarifsAPI.create(data);
        if (response.success) {
          showMessage('success', 'Tarif créé avec succès');
        }
      } else {
        response = await tarifsAPI.update(selectedTarif.id || selectedTarif.COD_TAR, data);
        if (response.success) {
          showMessage('success', 'Tarif modifié avec succès');
        }
      }
      
      if (response.success) {
        chargerTarifs();
        handleCloseDialog();
      } else {
        showMessage('error', response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde tarif:', error);
      showMessage('error', 'Erreur lors de la sauvegarde du tarif');
    }
  };

  const handleDeleteTarif = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce tarif ?')) {
      try {
        const response = await tarifsAPI.delete(id);
        
        if (response.success) {
          showMessage('success', 'Tarif supprimé avec succès');
          chargerTarifs();
        } else {
          showMessage('error', response.message || 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur suppression tarif:', error);
        showMessage('error', 'Erreur lors de la suppression du tarif');
      }
    }
  };

  return (
    <Box>
      {/* Barre d'outils */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Rechercher un tarif..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={chargerTarifs}
            >
              Actualiser
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
            >
              Nouveau
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tarifs"
            value={tarifs.length}
            icon={<MoneyIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Type Standard"
            value={tarifs.filter(t => t.TYP_TAR === 0).length}
            icon={<CheckIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Type Premium"
            value={tarifs.filter(t => t.TYP_TAR === 1).length}
            icon={<AssessmentIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pays Sénégal"
            value={tarifs.filter(t => t.COD_PAY === 'SN').length}
            icon={<LocationIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Tableau */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.light' }}>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Libellé</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Pays</TableCell>
              <TableCell>Date création</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredTarifs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Aucun tarif trouvé
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTarifs.map((tarif) => (
                <TableRow key={tarif.id || tarif.COD_TAR} hover>
                  <TableCell>{tarif.COD_TAR || tarif.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {tarif.LIB_TAR || tarif.nom_tarif || 'Sans libellé'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`Type ${tarif.TYP_TAR || tarif.type_tarif || 0}`}
                      size="small"
                      color={
                        tarif.TYP_TAR === 0 ? 'primary' :
                        tarif.TYP_TAR === 1 ? 'secondary' :
                        tarif.TYP_TAR === 2 ? 'warning' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={tarif.COD_PAY || tarif.cod_pay || 'N/A'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {tarif.dat_creutil ? new Date(tarif.dat_creutil).toLocaleDateString('fr-FR') : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Modifier">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenDialog('edit', tarif)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteTarif(tarif.id || tarif.COD_TAR)}
                        >
                          <DeleteIcon />
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

      {/* Dialog de création/édition */}
      <TarifDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveTarif}
        mode={dialogMode}
        tarif={selectedTarif}
      />
    </Box>
  );
};

// Composant pour l'onglet Barèmes
const BaremesTab = ({ showMessage }) => {
  const [baremes, setBaremes] = useState([]);
  const [filteredBaremes, setFilteredBaremes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBareme, setSelectedBareme] = useState(null);
  const [dialogMode, setDialogMode] = useState('create');

  const chargerBaremes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await baremesAPI.getAll();
      
      if (response.success) {
        setBaremes(response.baremes || []);
        setFilteredBaremes(response.baremes || []);
      } else {
        showMessage('error', response.message || 'Erreur lors du chargement des barèmes');
      }
    } catch (error) {
      console.error('Erreur chargement barèmes:', error);
      showMessage('error', 'Erreur lors du chargement des barèmes');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    chargerBaremes();
  }, []);

  useEffect(() => {
    let result = baremes;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(b => 
        b.LIB_BAR?.toLowerCase().includes(term) ||
        b.COD_BAR?.toString().includes(term)
      );
    }

    setFilteredBaremes(result);
  }, [searchTerm, baremes]);

  const handleOpenDialog = (mode, bareme = null) => {
    setDialogMode(mode);
    setSelectedBareme(bareme);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBareme(null);
  };

  const handleSaveBareme = async (data) => {
    try {
      let response;
      
      if (dialogMode === 'create') {
        response = await baremesAPI.create(data);
        if (response.success) {
          showMessage('success', 'Barème créé avec succès');
        }
      } else {
        response = await baremesAPI.update(selectedBareme.id || selectedBareme.COD_BAR, data);
        if (response.success) {
          showMessage('success', 'Barème modifié avec succès');
        }
      }
      
      if (response.success) {
        chargerBaremes();
        handleCloseDialog();
      } else {
        showMessage('error', response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde barème:', error);
      showMessage('error', 'Erreur lors de la sauvegarde du barème');
    }
  };

  const handleDeleteBareme = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce barème ?')) {
      try {
        const response = await baremesAPI.delete(id);
        
        if (response.success) {
          showMessage('success', 'Barème supprimé avec succès');
          chargerBaremes();
        } else {
          showMessage('error', response.message || 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur suppression barème:', error);
        showMessage('error', 'Erreur lors de la suppression du barème');
      }
    }
  };

  return (
    <Box>
      {/* Barre d'outils */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Rechercher un barème..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={chargerBaremes}
            >
              Actualiser
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
            >
              Nouveau
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Barèmes"
            value={baremes.length}
            icon={<AssessmentIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Type Standard"
            value={baremes.filter(b => b.TYP_BAR === 0).length}
            icon={<CheckIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Utilisés"
            value={baremes.filter(b => b.used_in_conventions > 0).length}
            icon={<InfoIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Non utilisés"
            value={baremes.filter(b => !b.used_in_conventions).length}
            icon={<WarningIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Tableau */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.light' }}>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Libellé</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Pays</TableCell>
              <TableCell>Conventions</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredBaremes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Aucun barème trouvé
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredBaremes.map((bareme) => (
                <TableRow key={bareme.id || bareme.COD_BAR} hover>
                  <TableCell>{bareme.COD_BAR || bareme.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {bareme.LIB_BAR || bareme.nom_bareme || 'Sans libellé'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`Type ${bareme.TYP_BAR || bareme.type_bareme || 0}`}
                      size="small"
                      color={
                        bareme.TYP_BAR === 0 ? 'primary' :
                        bareme.TYP_BAR === 1 ? 'secondary' :
                        bareme.TYP_BAR === 2 ? 'warning' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={bareme.COD_PAY || bareme.cod_pay || 'N/A'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge 
                      badgeContent={bareme.used_in_conventions || 0} 
                      color="primary"
                      sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
                    >
                      <DescriptionIcon color="action" />
                    </Badge>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Modifier">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenDialog('edit', bareme)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteBareme(bareme.id || bareme.COD_BAR)}
                        >
                          <DeleteIcon />
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

      {/* Dialog de création/édition */}
      <BaremeDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveBareme}
        mode={dialogMode}
        bareme={selectedBareme}
      />
    </Box>
  );
};

// Composant pour l'onglet Polices
const PolicesTab = ({ showMessage }) => {
  const [polices, setPolices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSavePolice = async (data) => {
    try {
      // Simuler la sauvegarde
      showMessage('success', 'Police enregistrée avec succès (simulation)');
      handleCloseDialog();
    } catch (error) {
      console.error('Erreur sauvegarde police:', error);
      showMessage('error', 'Erreur lors de la sauvegarde de la police');
    }
  };

  return (
    <Box>
      {/* Barre d'outils */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Rechercher une police..."
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => showMessage('info', 'Actualisation des polices')}
            >
              Actualiser
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              Nouvelle
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Polices"
            value="0"
            icon={<SecurityIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Actives"
            value="0"
            icon={<CheckIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="En attente"
            value="0"
            icon={<WarningIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Expirées"
            value="0"
            icon={<InfoIcon />}
            color="error"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
        <SecurityIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
        <Typography variant="h6" gutterBottom>
          Interface polices d'assurance
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Cette fonctionnalité est en cours de développement
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleOpenDialog}
        >
          Ajouter une police
        </Button>
      </Paper>

      {/* Dialog de création/édition */}
      <PoliceDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSavePolice}
      />
    </Box>
  );
};

// Composant de carte statistique
const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ 
    borderRadius: 2, 
    height: '100%',
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: 4
    }
  }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          bgcolor: `${color}.light`, 
          color: `${color}.main`, 
          p: 1.5, 
          borderRadius: 2,
          mr: 2 
        }}>
          {React.cloneElement(icon, { fontSize: 'medium' })}
        </Box>
        <Typography variant="h6" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" color="primary" fontWeight="bold">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

// Fonction pour générer le COD_ASS
const generateCODASS = (libelle) => {
  const words = libelle.split(' ').filter(word => word.length > 0);
  let prefix = '';
  
  if (words.length >= 3) {
    prefix = words.slice(0, 3).map(word => word.charAt(0).toUpperCase()).join('');
  } else if (words.length === 2) {
    prefix = words[0].charAt(0).toUpperCase() + words[1].substring(0, 2).toUpperCase();
  } else if (words.length === 1) {
    prefix = words[0].substring(0, 3).toUpperCase();
  } else {
    prefix = 'CMP';
  }
  
  prefix = prefix.substring(0, 3).padEnd(3, 'X');
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${timestamp}`;
};

// Dialog de création/modification de compagnie
const CompagnieDialog = ({ open, onClose, onSave, mode, compagnie, typesAssureurs, showMessage }) => {
  const [formData, setFormData] = useState({
    LIB_ASS: '',
    TYPE_COMPAGNIE: 'ASSURANCE',
    COD_STA: '',
    ADRESSE: '',
    TELEPHONE: '',
    EMAIL: '',
    SITE_WEB: '',
    NUM_AGREMENT: '',
    CONTACT_PRINCIPAL: '',
    CAPITAL_SOCIAL: '',
    NUMERO_RC: '',
    NUMERO_FISCAL: '',
    NOTES: '',
    ACTIF: true
  });

  const [nextId, setNextId] = useState(null);
  const [errors, setErrors] = useState({});
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [localTypesAssureurs, setLocalTypesAssureurs] = useState([]);

  // Charger les types d'assureurs si non fournis
  useEffect(() => {
    const chargerTypes = async () => {
      if (open) {
        setLoadingTypes(true);
        try {
          // Si les types ne sont pas fournis, les charger
          if (!typesAssureurs || typesAssureurs.length === 0) {
            const response = await typesAssureursAPI.getList();
            if (response.success) {
              setLocalTypesAssureurs(response.types_assureurs || []);
            } else {
              showMessage('error', 'Erreur lors du chargement des types d\'assureurs');
            }
          } else {
            setLocalTypesAssureurs(typesAssureurs);
          }
        } catch (error) {
          console.error('Erreur chargement types assureurs:', error);
          showMessage('error', 'Erreur lors du chargement des types d\'assureurs');
        } finally {
          setLoadingTypes(false);
        }
      }
    };
    
    chargerTypes();
  }, [open, typesAssureurs, showMessage]);

  // Récupérer le prochain ID lors de l'ouverture en mode création
  useEffect(() => {
    const fetchNextId = async () => {
      if (mode === 'create' && open) {
        try {
          const response = await compagniesAPI.getNextId();
          if (response.success) {
            setNextId(response.next_id);
          }
        } catch (error) {
          console.error('Erreur récupération next ID:', error);
        }
      }
    };
    
    fetchNextId();
  }, [mode, open]);

   useEffect(() => {
    if (mode === 'edit' && compagnie) {
      setFormData({
        LIB_ASS: compagnie.nom || compagnie.LIB_ASS || '',
        TYPE_COMPAGNIE: compagnie.type_compagnie || compagnie.TYPE_COMPAGNIE || 'ASSURANCE',
        COD_STA: compagnie.COD_STA || compagnie.cod_sta || '',
        ADRESSE: compagnie.adresse || compagnie.NUM_ADR || '',
        TELEPHONE: compagnie.telephone || compagnie.AUT_ASS || '',
        EMAIL: compagnie.email || compagnie.EMA_ASS || '',
        SITE_WEB: compagnie.site_web || compagnie.SITE_WEB || '',
        NUM_AGREMENT: compagnie.num_agrement || compagnie.NUM_RIB || '',
        CONTACT_PRINCIPAL: compagnie.contact_principal || '',
        CAPITAL_SOCIAL: compagnie.capital_social || '',
        NUMERO_RC: compagnie.numero_rc || '',
        NUMERO_FISCAL: compagnie.numero_fiscal || '',
        NOTES: compagnie.notes || compagnie.OBS_ASS || '',
        ACTIF: compagnie.actif !== undefined ? compagnie.actif : true
      });
    } else {
      // Réinitialiser pour création
      setFormData({
        LIB_ASS: '',
        TYPE_COMPAGNIE: 'ASSURANCE',
        COD_STA: '',
        ADRESSE: '',
        TELEPHONE: '',
        EMAIL: '',
        SITE_WEB: '',
        NUM_AGREMENT: '',
        CONTACT_PRINCIPAL: '',
        CAPITAL_SOCIAL: '',
        NUMERO_RC: '',
        NUMERO_FISCAL: '',
        NOTES: '',
        ACTIF: true
      });
    }
    setErrors({});
  }, [mode, compagnie]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value === undefined ? '' : value)
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.LIB_ASS.trim()) {
      newErrors.LIB_ASS = 'Le nom de la compagnie est obligatoire';
    }
    
    if (!formData.TYPE_COMPAGNIE) {
      newErrors.TYPE_COMPAGNIE = 'Le type de compagnie est obligatoire';
    }
    
    if (!formData.COD_STA) {
      newErrors.COD_STA = 'Le type d\'assureur est obligatoire';
    }
    
    if (formData.EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.EMAIL)) {
      newErrors.EMAIL = 'Email invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        {mode === 'create' ? 'Nouvelle Compagnie' : 'Modifier Compagnie'}
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        <Grid container spacing={2}>
          {/* Afficher le prochain ID en mode création */}
          {mode === 'create' && nextId && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Le code compagnie sera automatiquement généré: <strong>#{nextId}</strong>
              </Alert>
            </Grid>
          )}
          
          {mode === 'edit' && compagnie && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Code Compagnie"
                value={compagnie.id || compagnie.COD_ASS || 'N/A'}
                margin="normal"
                InputProps={{
                  readOnly: true
                }}
                helperText="Code attribué par le système"
              />
            </Grid>
          )}
          
          <Grid item xs={12} md={mode === 'edit' ? 6 : 12}>
            <TextField
              fullWidth
              label="Nom de la compagnie *"
              name="LIB_ASS"
              value={formData.LIB_ASS}
              onChange={handleChange}
              error={!!errors.LIB_ASS}
              helperText={errors.LIB_ASS}
              required
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal" error={!!errors.TYPE_COMPAGNIE}>
              <InputLabel>Type de compagnie *</InputLabel>
              <Select
                name="TYPE_COMPAGNIE"
                value={formData.TYPE_COMPAGNIE || 'ASSURANCE'}
                label="Type de compagnie *"
                onChange={handleChange}
              >
                <MenuItem value="ASSURANCE">Assurance</MenuItem>
                <MenuItem value="MUTUELLE">Mutuelle</MenuItem>
                <MenuItem value="BANQUE">Banque</MenuItem>
                <MenuItem value="FINANCE">Finance</MenuItem>
              </Select>
              {errors.TYPE_COMPAGNIE && (
                <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                  {errors.TYPE_COMPAGNIE}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl 
              fullWidth 
              margin="normal" 
              error={!!errors.COD_STA}
              disabled={loadingTypes}
            >
              <InputLabel>Type d'assureur *</InputLabel>
              <Select
                name="COD_STA"
                value={formData.COD_STA || ''}
                label="Type d'assureur *"
                onChange={handleChange}
              >
                <MenuItem value="">Sélectionnez un type d'assureur</MenuItem>
                {typesAssureurs && typesAssureurs.map((type) => (
                  <MenuItem key={type.cod_sta} value={type.cod_sta || ''}>
                    {type.lib_sta} ({type.cod_sta}) {type.status === 'ACTIF' ? '✓' : '✗'}
                  </MenuItem>
                ))}
              </Select>
              {errors.COD_STA && (
                <Typography variant="caption" color="error">
                  {errors.COD_STA}
                </Typography>
              )}
              {loadingTypes && (
                <Typography variant="caption" color="text.secondary">
                  Chargement des types d'assureurs...
                </Typography>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Adresse"
              name="ADRESSE"
              value={formData.ADRESSE}
              onChange={handleChange}
              multiline
              rows={2}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Téléphone"
              name="TELEPHONE"
              value={formData.TELEPHONE}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="EMAIL"
              type="email"
              value={formData.EMAIL}
              onChange={handleChange}
              error={!!errors.EMAIL}
              helperText={errors.EMAIL}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Site web"
              name="SITE_WEB"
              value={formData.SITE_WEB}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Numéro d'agrément/RIB"
              name="NUM_AGREMENT"
              value={formData.NUM_AGREMENT}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Contact principal"
              name="CONTACT_PRINCIPAL"
              value={formData.CONTACT_PRINCIPAL}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Capital social"
              name="CAPITAL_SOCIAL"
              type="number"
              value={formData.CAPITAL_SOCIAL}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Numéro RC"
              name="NUMERO_RC"
              value={formData.NUMERO_RC}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Numéro fiscal"
              name="NUMERO_FISCAL"
              value={formData.NUMERO_FISCAL}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes/observations"
              name="NOTES"
              value={formData.NOTES}
              onChange={handleChange}
              multiline
              rows={3}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  name="ACTIF"
                  checked={formData.ACTIF}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Compagnie active"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          startIcon={mode === 'create' ? <AddIcon /> : <EditIcon />}
        >
          {mode === 'create' ? 'Créer' : 'Modifier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Dialog de création/modification de convention
const ConventionDialog = ({ open, onClose, onSave, mode, convention, compagniesList }) => {
  const [formData, setFormData] = useState({
    LIB_CNV: '',
    COD_ASS: '',
    DAT_CNV: new Date(),
    DATE_FIN: null,
    ETAT_CNV: 'EN_ATTENTE',
    MONTANT: '',
    DEVISE: 'FCFA',
    OBSERVATIONS: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === 'edit' && convention) {
      setFormData({
        LIB_CNV: convention.LIB_CNV || '',
        COD_ASS: convention.COD_ASS || '',
        DAT_CNV: convention.DAT_CNV ? new Date(convention.DAT_CNV) : new Date(),
        DATE_FIN: convention.DATE_FIN ? new Date(convention.DATE_FIN) : null,
        ETAT_CNV: convention.ETAT_CNV || 'EN_ATTENTE',
        MONTANT: convention.MONTANT || '',
        DEVISE: convention.DEVISE || 'FCFA',
        OBSERVATIONS: convention.OBSERVATIONS || ''
      });
    } else {
      setFormData({
        LIB_CNV: '',
        COD_ASS: '',
        DAT_CNV: new Date(),
        DATE_FIN: null,
        ETAT_CNV: 'EN_ATTENTE',
        MONTANT: '',
        DEVISE: 'FCFA',
        OBSERVATIONS: ''
      });
    }
    setErrors({});
  }, [mode, convention]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === undefined ? '' : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.LIB_CNV.trim()) {
      newErrors.LIB_CNV = 'Le libellé est obligatoire';
    }
    
    if (!formData.COD_ASS) {
      newErrors.COD_ASS = 'La compagnie est obligatoire';
    }
    
    if (!formData.DAT_CNV) {
      newErrors.DAT_CNV = 'La date de début est obligatoire';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Format dates for API
      const dataToSend = {
        ...formData,
        DAT_CNV: formData.DAT_CNV ? formData.DAT_CNV.toISOString().split('T')[0] : null,
        DATE_FIN: formData.DATE_FIN ? formData.DATE_FIN.toISOString().split('T')[0] : null
      };
      onSave(dataToSend);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white' }}>
        {mode === 'create' ? 'Nouvelle Convention' : 'Modifier Convention'}
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Libellé de la convention *"
              name="LIB_CNV"
              value={formData.LIB_CNV}
              onChange={handleChange}
              error={!!errors.LIB_CNV}
              helperText={errors.LIB_CNV}
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal" error={!!errors.COD_ASS}>
              <InputLabel>Compagnie *</InputLabel>
              <Select
                name="COD_ASS"
                value={formData.COD_ASS || ''}
                label="Compagnie *"
                onChange={handleChange}
              >
                <MenuItem value="">Sélectionnez une compagnie</MenuItem>
                {compagniesList.map((compagnie) => (
                  <MenuItem key={compagnie.COD_ASS || compagnie.id} value={compagnie.COD_ASS || compagnie.id || ''}>
                    {compagnie.LIB_ASS || compagnie.nom} ({compagnie.COD_ASS || compagnie.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>État</InputLabel>
              <Select
                name="ETAT_CNV"
                value={formData.ETAT_CNV || 'EN_ATTENTE'}
                label="État"
                onChange={handleChange}
              >
                <MenuItem value="EN_ATTENTE">En attente</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="SUSPENDUE">Suspendue</MenuItem>
                <MenuItem value="EXPIRED">Expirée</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date de début *"
                value={formData.DAT_CNV}
                onChange={(date) => handleDateChange('DAT_CNV', date)}
                slotProps={{ textField: { fullWidth: true, margin: 'normal', error: !!errors.DAT_CNV, helperText: errors.DAT_CNV } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date de fin"
                value={formData.DATE_FIN}
                onChange={(date) => handleDateChange('DATE_FIN', date)}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Montant"
              name="MONTANT"
              type="number"
              value={formData.MONTANT}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                endAdornment: formData.DEVISE
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Devise</InputLabel>
              <Select
                name="DEVISE"
                value={formData.DEVISE || 'FCFA'}
                label="Devise"
                onChange={handleChange}
              >
                <MenuItem value="FCFA">FCFA</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observations"
              name="OBSERVATIONS"
              value={formData.OBSERVATIONS}
              onChange={handleChange}
              multiline
              rows={3}
              margin="normal"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          startIcon={mode === 'create' ? <AddIcon /> : <EditIcon />}
        >
          {mode === 'create' ? 'Créer' : 'Modifier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Dialog de création/modification de tarif
const TarifDialog = ({ open, onClose, onSave, mode, tarif }) => {
  const [formData, setFormData] = useState({
    LIB_TAR: '',
    TYP_TAR: 0,
    COD_PAY: 'SN',
    DESCRIPTION: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === 'edit' && tarif) {
      setFormData({
        LIB_TAR: tarif.LIB_TAR || tarif.nom_tarif || '',
        TYP_TAR: tarif.TYP_TAR || tarif.type_tarif || 0,
        COD_PAY: tarif.COD_PAY || tarif.cod_pay || 'SN',
        DESCRIPTION: tarif.DESCRIPTION || ''
      });
    } else {
      setFormData({
        LIB_TAR: '',
        TYP_TAR: 0,
        COD_PAY: 'SN',
        DESCRIPTION: ''
      });
    }
    setErrors({});
  }, [mode, tarif]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === undefined ? (name === 'TYP_TAR' ? 0 : '') : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.LIB_TAR.trim()) {
      newErrors.LIB_TAR = 'Le libellé est obligatoire';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const typeOptions = [
    { value: 0, label: 'Type Standard' },
    { value: 1, label: 'Type Premium' },
    { value: 2, label: 'Type Entreprise' },
    { value: 3, label: 'Type Spécial' }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: 'info.main', color: 'white' }}>
        {mode === 'create' ? 'Nouveau Tarif' : 'Modifier Tarif'}
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Libellé du tarif *"
              name="LIB_TAR"
              value={formData.LIB_TAR}
              onChange={handleChange}
              error={!!errors.LIB_TAR}
              helperText={errors.LIB_TAR}
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Type de tarif</InputLabel>
              <Select
                name="TYP_TAR"
                value={formData.TYP_TAR ?? 0}
                label="Type de tarif"
                onChange={handleChange}
              >
                {typeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Code pays"
              name="COD_PAY"
              value={formData.COD_PAY}
              onChange={handleChange}
              margin="normal"
              helperText="Ex: SN pour Sénégal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="DESCRIPTION"
              value={formData.DESCRIPTION}
              onChange={handleChange}
              multiline
              rows={3}
              margin="normal"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          startIcon={mode === 'create' ? <AddIcon /> : <EditIcon />}
        >
          {mode === 'create' ? 'Créer' : 'Modifier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Dialog de création/modification de barème
const BaremeDialog = ({ open, onClose, onSave, mode, bareme }) => {
  const [formData, setFormData] = useState({
    LIB_BAR: '',
    TYP_BAR: 0,
    COD_PAY: 'SN',
    DESCRIPTION: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === 'edit' && bareme) {
      setFormData({
        LIB_BAR: bareme.LIB_BAR || bareme.nom_bareme || '',
        TYP_BAR: bareme.TYP_BAR || bareme.type_bareme || 0,
        COD_PAY: bareme.COD_PAY || bareme.cod_pay || 'SN',
        DESCRIPTION: bareme.DESCRIPTION || ''
      });
    } else {
      setFormData({
        LIB_BAR: '',
        TYP_BAR: 0,
        COD_PAY: 'SN',
        DESCRIPTION: ''
      });
    }
    setErrors({});
  }, [mode, bareme]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === undefined ? (name === 'TYP_BAR' ? 0 : '') : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.LIB_BAR.trim()) {
      newErrors.LIB_BAR = 'Le libellé est obligatoire';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const typeOptions = [
    { value: 0, label: 'Type Standard' },
    { value: 1, label: 'Type Premium' },
    { value: 2, label: 'Type Entreprise' },
    { value: 3, label: 'Type Spécial' }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white' }}>
        {mode === 'create' ? 'Nouveau Barème' : 'Modifier Barème'}
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Libellé du barème *"
              name="LIB_BAR"
              value={formData.LIB_BAR}
              onChange={handleChange}
              error={!!errors.LIB_BAR}
              helperText={errors.LIB_BAR}
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Type de barème</InputLabel>
              <Select
                name="TYP_BAR"
                value={formData.TYP_BAR ?? 0}
                label="Type de barème"
                onChange={handleChange}
              >
                {typeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Code pays"
              name="COD_PAY"
              value={formData.COD_PAY}
              onChange={handleChange}
              margin="normal"
              helperText="Ex: SN pour Sénégal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="DESCRIPTION"
              value={formData.DESCRIPTION}
              onChange={handleChange}
              multiline
              rows={3}
              margin="normal"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          startIcon={mode === 'create' ? <AddIcon /> : <EditIcon />}
        >
          {mode === 'create' ? 'Créer' : 'Modifier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Dialog de création/modification de police
const PoliceDialog = ({ open, onClose, onSave }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    NUMERO_POLICE: '',
    TYPE_POLICE: 'AUTOMOBILE',
    COMPAGNIE_ID: '',
    ASSURE: '',
    DATE_EFFET: new Date(),
    DATE_EXPIRATION: null,
    PRIME_TOTALE: '',
    FRACTIONNEMENT: 'ANNUEL',
    GARANTIES: '',
    EXCLUSIONS: ''
  });

  const steps = ['Information de base', 'Garanties', 'Validation'];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === undefined ? '' : value
    }));
  };

  const handleDateChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'success.main', color: 'white' }}>
        Nouvelle Police d'Assurance
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Numéro de police"
                name="NUMERO_POLICE"
                value={formData.NUMERO_POLICE}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Type de police</InputLabel>
                <Select
                  name="TYPE_POLICE"
                  value={formData.TYPE_POLICE || 'AUTOMOBILE'}
                  label="Type de police"
                  onChange={handleChange}
                >
                  <MenuItem value="AUTOMOBILE">Automobile</MenuItem>
                  <MenuItem value="HABITATION">Habitation</MenuItem>
                  <MenuItem value="SANTE">Santé</MenuItem>
                  <MenuItem value="VIE">Vie</MenuItem>
                  <MenuItem value="PROFESSIONNELLE">Professionnelle</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom de l'assuré"
                name="ASSURE"
                value={formData.ASSURE}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DatePicker
                  label="Date d'effet"
                  value={formData.DATE_EFFET}
                  onChange={(date) => handleDateChange('DATE_EFFET', date)}
                  slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        )}

        {activeStep === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prime totale"
                name="PRIME_TOTALE"
                type="number"
                value={formData.PRIME_TOTALE}
                onChange={handleChange}
                margin="normal"
                InputProps={{
                  endAdornment: 'FCFA'
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Fractionnement</InputLabel>
                <Select
                  name="FRACTIONNEMENT"
                  value={formData.FRACTIONNEMENT || 'ANNUEL'}
                  label="Fractionnement"
                  onChange={handleChange}
                >
                  <MenuItem value="ANNUEL">Annuel</MenuItem>
                  <MenuItem value="SEMESTRIEL">Semestriel</MenuItem>
                  <MenuItem value="TRIMESTRIEL">Trimestriel</MenuItem>
                  <MenuItem value="MENSUEL">Mensuel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Garanties"
                name="GARANTIES"
                value={formData.GARANTIES}
                onChange={handleChange}
                multiline
                rows={3}
                margin="normal"
                helperText="Listez les garanties couvertes"
              />
            </Grid>
          </Grid>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Récapitulatif
            </Typography>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography><strong>Type:</strong> {formData.TYPE_POLICE}</Typography>
              <Typography><strong>Assuré:</strong> {formData.ASSURE}</Typography>
              <Typography><strong>Date d'effet:</strong> {formData.DATE_EFFET.toLocaleDateString('fr-FR')}</Typography>
              <Typography><strong>Prime totale:</strong> {formData.PRIME_TOTALE} FCFA</Typography>
            </Paper>
            <Typography variant="body2" color="text.secondary">
              Vérifiez les informations avant de créer la police.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Annuler
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep > 0 && (
          <Button onClick={handleBack} variant="outlined">
            Retour
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained">
            Suivant
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
          >
            Créer la police
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GestionAssurance;