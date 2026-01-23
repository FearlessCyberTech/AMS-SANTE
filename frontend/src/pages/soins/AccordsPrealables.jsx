// src/pages/AccordsPrealables.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Paper,
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
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as ValidIcon,
  Cancel as RejectIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Description as DescriptionIcon,
  LocalHospital as HospitalIcon,
  Medication as MedicationIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { prescriptionsAPI, beneficiairesAPI } from '../../services/api';
import { styled } from '@mui/material/styles';

// Composants stylisés
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[2],
  transition: 'box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const StatusBadge = styled(Chip)(({ theme, statuscolor }) => {
  const colorMap = {
    'warning': theme.palette.warning,
    'success': theme.palette.success,
    'error': theme.palette.error,
    'info': theme.palette.info,
    'primary': theme.palette.primary,
    'default': theme.palette.grey[500]
  };
  
  const colorObj = colorMap[statuscolor] || theme.palette.primary;
  
  return {
    fontWeight: 600,
    textTransform: 'uppercase',
    fontSize: '0.7rem',
    letterSpacing: '0.5px',
    backgroundColor: colorObj.light || colorObj[100],
    color: colorObj.main || colorObj[700],
    border: `1px solid ${colorObj.main || colorObj[400]}`,
  };
});

const ActionButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    boxShadow: theme.shadows[2],
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const StatCard = styled(Card)(({ theme, color = 'primary' }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  background: `linear-gradient(135deg, ${theme.palette[color].light}20 0%, ${theme.palette[color].light}10 100%)`,
  border: `1px solid ${theme.palette[color].light}30`,
}));

const AccordsPrealables = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [affectionsLoading, setAffectionsLoading] = useState(false);
  const [affectionsList, setAffectionsList] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    statut: '',
    type_prestation: '',
    date_debut: null,
    date_fin: null
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [creationStep, setCreationStep] = useState(0);
  const [newDemande, setNewDemande] = useState({
    patientId: null,
    patientInfo: null,
    typePrestation: '',
    prestataireId: null,
    prestataireInfo: null,
    codeAffectation: '',
    codeAffectationInfo: null,
    remarques: '',
    hospitalisation: false,
    dateDebutHospitalisation: null,
    dateFinHospitalisation: null,
    dureeHospitalisation: null,
    actes: [],
    montantTotal: 0,
    tauxCouverture: 80
  });
  const [searchPatientTerm, setSearchPatientTerm] = useState('');
  const [searchActeTerm, setSearchActeTerm] = useState('');
  const [searchAffectionTerm, setSearchAffectionTerm] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [acteResults, setActeResults] = useState([]);

  const statuts = [
    { value: 'En attente', label: 'En attente', color: 'warning', icon: '⏳' },
    { value: 'Validee', label: 'Validée', color: 'success', icon: '✅' },
    { value: 'Rejetee', label: 'Rejetée', color: 'error', icon: '❌' },
    { value: 'Executee', label: 'Exécutée', color: 'info', icon: '✅' },
    { value: 'Annulée', label: 'Annulée', color: 'default', icon: '🚫' }
  ];

  const typesPrestation = [
    { value: 'Consultation', label: 'Consultation', icon: '🩺' },
    { value: 'Pharmacie', label: 'Pharmacie', icon: '💊' },
    { value: 'Biologie', label: 'Biologie', icon: '🧪' },
    { value: 'Imagerie', label: 'Imagerie', icon: '📷' },
    { value: 'Hospitalisation', label: 'Hospitalisation', icon: '🏥' },
    { value: 'Chirurgie', label: 'Chirurgie', icon: '🔪' },
    { value: 'Rééducation', label: 'Rééducation', icon: '🦿' }
  ];

  const stats = useMemo(() => ({
    total: demandes.length,
    enAttente: demandes.filter(d => d.STATUT === 'En attente').length,
    validees: demandes.filter(d => d.STATUT === 'Validee').length,
    executees: demandes.filter(d => d.STATUT === 'Executee').length,
    rejetees: demandes.filter(d => d.STATUT === 'Rejetee').length,
    annulees: demandes.filter(d => d.STATUT === 'Annulée').length,
  }), [demandes]);

  const getStatusColor = (statut) => {
    const statusObj = statuts.find(s => s.value === statut);
    return statusObj ? statusObj.color : 'default';
  };

  const loadAffections = useCallback(async (search = '') => {
    setAffectionsLoading(true);
    try {
      const response = await prescriptionsAPI.searchAffections(search, 50);
      
      if (response.success && response.affections) {
        const transformedAffections = response.affections.map(affection => ({
          id: affection.id || affection.COD_AFF,
          label: `${affection.libelle || affection.LIB_AFF} (${affection.id || affection.COD_AFF})`,
          libelle: affection.libelle || affection.LIB_AFF,
          code: affection.id || affection.COD_AFF,
          ncp: affection.ncp,
          sexe: affection.sexe || affection.SEXE,
          etat: affection.etat || affection.ETAT
        }));
        setAffectionsList(transformedAffections);
      } else {
        setAffectionsList([]);
      }
    } catch (error) {
      console.error('Erreur chargement affections:', error);
      setAffectionsList([]);
    } finally {
      setAffectionsLoading(false);
    }
  }, []);

  const loadDemandes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== null && v !== '')
        )
      };

      const response = await prescriptionsAPI.getAll(params);
      
      if (response.success) {
        setDemandes(response.prescriptions || []);
        setTotalCount(response.pagination?.total || 0);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Erreur lors du chargement',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]);

  useEffect(() => {
    if (activeTab === 1) {
      loadAffections();
    }
  }, [activeTab, loadAffections]);

  useEffect(() => {
    loadDemandes();
  }, [loadDemandes]);

  const searchPatients = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setPatientResults([]);
      return;
    }
    
    try {
      const response = await prescriptionsAPI.searchPatients(searchTerm, 10);
      setPatientResults(response.success ? response.patients || [] : []);
    } catch (error) {
      setPatientResults([]);
    }
  };

  const searchActes = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setActeResults([]);
      return;
    }
    
    try {
      const response = await prescriptionsAPI.searchMedicalItems(searchTerm);
      setActeResults(response.success ? response.items || [] : []);
    } catch (error) {
      setActeResults([]);
    }
  };

  const handleSelectPatient = (patient) => {
    setNewDemande(prev => ({
      ...prev,
      patientId: patient.id,
      patientInfo: patient
    }));
    setPatientResults([]);
    setSearchPatientTerm(`${patient.nom} ${patient.prenom}`);
  };

  const handleSelectAffection = (affection) => {
    setNewDemande(prev => ({
      ...prev,
      codeAffectation: affection?.code || '',
      codeAffectationInfo: affection || null
    }));
  };

  const handleAddActe = (acte) => {
    const nouvelActe = {
      id: acte.id,
      code: acte.code || acte.id,
      libelle: acte.libelle || acte.libelle_complet,
      quantite: 1,
      prixUnitaire: acte.prix || 0,
      remboursable: acte.remboursable !== false,
      tauxPriseEnCharge: 80
    };
    
    setNewDemande(prev => ({
      ...prev,
      actes: [...prev.actes, nouvelActe],
      montantTotal: prev.montantTotal + nouvelActe.prixUnitaire
    }));
    setActeResults([]);
    setSearchActeTerm('');
  };

  const handleUpdateActe = (index, field, value) => {
    setNewDemande(prev => {
      const updatedActes = [...prev.actes];
      const oldActe = updatedActes[index];
      
      if (field === 'quantite' || field === 'prixUnitaire') {
        const oldTotal = oldActe.quantite * oldActe.prixUnitaire;
        updatedActes[index] = { 
          ...oldActe, 
          [field]: field === 'quantite' ? parseInt(value) || 0 : parseFloat(value) || 0 
        };
        const newTotal = updatedActes[index].quantite * updatedActes[index].prixUnitaire;
        return {
          ...prev,
          actes: updatedActes,
          montantTotal: prev.montantTotal - oldTotal + newTotal
        };
      }
      
      updatedActes[index] = { ...oldActe, [field]: value };
      return { ...prev, actes: updatedActes };
    });
  };

  const handleRemoveActe = (index) => {
    setNewDemande(prev => {
      const removedActe = prev.actes[index];
      const updatedActes = prev.actes.filter((_, i) => i !== index);
      return {
        ...prev,
        actes: updatedActes,
        montantTotal: prev.montantTotal - (removedActe.quantite * removedActe.prixUnitaire)
      };
    });
  };

  const handleSubmitDemande = async () => {
    try {
      if (!newDemande.patientId || !newDemande.typePrestation) {
        throw new Error('Patient et type de prestation sont obligatoires');
      }

      const demandeData = {
        COD_BEN: newDemande.patientId,
        COD_PRE: newDemande.prestataireId || null,
        TYPE_PRESTATION: newDemande.typePrestation,
        COD_AFF: newDemande.codeAffectation || 'NSP',
        OBSERVATIONS: newDemande.remarques || '',
        STATUT: 'En attente',
        details: newDemande.actes.map(acte => ({
          COD_ELEMENT: acte.code,
          LIBELLE: acte.libelle,
          QUANTITE: acte.quantite,
          PRIX_UNITAIRE: acte.prixUnitaire,
          REMBOURSABLE: acte.remboursable ? 1 : 0,
          TAUX_PRISE_EN_CHARGE: acte.tauxPriseEnCharge
        }))
      };
      
      if (newDemande.hospitalisation) {
        demandeData.DATE_DEBUT_HOSPITALISATION = newDemande.dateDebutHospitalisation;
        demandeData.DATE_FIN_HOSPITALISATION = newDemande.dateFinHospitalisation;
        demandeData.DUREE_HOSPITALISATION = newDemande.dureeHospitalisation;
      }
      
      const response = await prescriptionsAPI.create(demandeData);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: `Demande créée avec succès. Numéro: ${response.numero || response.COD_PRES}`,
          severity: 'success'
        });
        resetNewDemande();
        setActiveTab(0);
        loadDemandes();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const resetNewDemande = () => {
    setNewDemande({
      patientId: null,
      patientInfo: null,
      typePrestation: '',
      prestataireId: null,
      prestataireInfo: null,
      codeAffectation: '',
      codeAffectationInfo: null,
      remarques: '',
      hospitalisation: false,
      dateDebutHospitalisation: null,
      dateFinHospitalisation: null,
      dureeHospitalisation: null,
      actes: [],
      montantTotal: 0,
      tauxCouverture: 80
    });
    setCreationStep(0);
    setSearchPatientTerm('');
    setSearchActeTerm('');
    setSearchAffectionTerm('');
  };

  const handleValidateDemande = async (id) => {
    try {
      const response = await prescriptionsAPI.updateStatus(id, {
        statut: 'Validee'
      });
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Demande validée avec succès',
          severity: 'success'
        });
        loadDemandes();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleRejectDemande = async (id) => {
    const raison = prompt('Raison du rejet :');
    if (!raison) return;
    
    try {
      const response = await prescriptionsAPI.updateStatus(id, {
        statut: 'Rejetee',
        motif: raison
      });
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Demande rejetée',
          severity: 'success'
        });
        loadDemandes();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleCancelDemande = async (id) => {
    const raison = prompt('Raison de l\'annulation :');
    if (!raison) return;
    
    try {
      const response = await prescriptionsAPI.cancel(id, raison);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Demande annulée',
          severity: 'success'
        });
        loadDemandes();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const steps = ['Patient & Affection', 'Actes médicaux', 'Validation'];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Accords Préalables
          </Typography>
          <Typography color="text.secondary">
            Gestion des demandes de prise en charge médicale
          </Typography>
        </Box>

        <StyledCard>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={activeTab} 
                onChange={(e, v) => setActiveTab(v)}
                sx={{ px: 2, pt: 1 }}
              >
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ReceiptIcon fontSize="small" />
                      <span>Demandes</span>
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AddIcon fontSize="small" />
                      <span>Nouvelle demande</span>
                    </Box>
                  } 
                />
              </Tabs>
            </Box>

            {activeTab === 0 && (
              <Box sx={{ p: 3 }}>
                {/* Statistiques */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={4} md={2.4}>
                    <StatCard>
                      <Typography variant="h6" color="primary" fontWeight={600}>
                        {stats.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total
                      </Typography>
                    </StatCard>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2.4}>
                    <StatCard color="warning">
                      <Typography variant="h6" color="warning.main" fontWeight={600}>
                        {stats.enAttente}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        En attente
                      </Typography>
                    </StatCard>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2.4}>
                    <StatCard color="success">
                      <Typography variant="h6" color="success.main" fontWeight={600}>
                        {stats.validees}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Validées
                      </Typography>
                    </StatCard>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2.4}>
                    <StatCard color="info">
                      <Typography variant="h6" color="info.main" fontWeight={600}>
                        {stats.executees}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Exécutées
                      </Typography>
                    </StatCard>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2.4}>
                    <StatCard color="error">
                      <Typography variant="h6" color="error.main" fontWeight={600}>
                        {stats.rejetees + stats.annulees}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Rejetées/Annulées
                      </Typography>
                    </StatCard>
                  </Grid>
                </Grid>

                {/* Barre d'actions */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 3,
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1
                }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setActiveTab(1)}
                  >
                    Nouvelle demande
                  </Button>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<FilterIcon />}
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      Filtres
                    </Button>
                    <Button
                      startIcon={<RefreshIcon />}
                      onClick={loadDemandes}
                      disabled={loading}
                    >
                      Actualiser
                    </Button>
                  </Box>
                </Box>

                {/* Filtres */}
                {showFilters && (
                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Rechercher"
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Statut</InputLabel>
                          <Select
                            value={filters.statut}
                            label="Statut"
                            onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value }))}
                          >
                            <MenuItem value="">Tous</MenuItem>
                            {statuts.map(statut => (
                              <MenuItem key={statut.value} value={statut.value}>
                                {statut.icon} {statut.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={filters.type_prestation}
                            label="Type"
                            onChange={(e) => setFilters(prev => ({ ...prev, type_prestation: e.target.value }))}
                          >
                            <MenuItem value="">Tous</MenuItem>
                            {typesPrestation.map(type => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.icon} {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <DatePicker
                          label="Date début"
                          value={filters.date_debut}
                          onChange={(date) => setFilters(prev => ({ ...prev, date_debut: date }))}
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <DatePicker
                          label="Date fin"
                          value={filters.date_fin}
                          onChange={(date) => setFilters(prev => ({ ...prev, date_fin: date }))}
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={1}>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={loadDemandes}
                          disabled={loading}
                        >
                          OK
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Tableau */}
                <TableContainer sx={{ borderRadius: 1, border: 1, borderColor: 'divider' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                      <TableRow>
                        <TableCell>N°</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Affection</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Montant</TableCell>
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
                      ) : demandes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">
                              Aucune demande trouvée
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        demandes.map((demande) => (
                          <StyledTableRow key={demande.COD_PRES} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {demande.NUM_PRESCRIPTION || demande.COD_PRES}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {demande.NOM_BEN} {demande.PRE_BEN}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {demande.IDENTIFIANT_NATIONAL || '-'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={demande.TYPE_PRESTATION} 
                                size="small" 
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {demande.LIB_AFF || '-'}
                              </Typography>
                              {demande.COD_AFF && (
                                <Typography variant="caption" color="text.secondary">
                                  {demande.COD_AFF}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {demande.DATE_PRESCRIPTION 
                                ? new Date(demande.DATE_PRESCRIPTION).toLocaleDateString('fr-FR')
                                : '-'
                              }
                            </TableCell>
                            <TableCell>
                              <Typography fontWeight={500}>
                                {demande.MONTANT_TOTAL 
                                  ? `${parseFloat(demande.MONTANT_TOTAL).toLocaleString('fr-FR')} FCFA`
                                  : '-'
                                }
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <StatusBadge
                                label={demande.STATUT}
                                statuscolor={getStatusColor(demande.STATUT)}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                <ActionButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedDemande(demande);
                                    setOpenDetailsDialog(true);
                                  }}
                                >
                                  <ViewIcon fontSize="small" />
                                </ActionButton>
                                
                                {demande.STATUT === 'En attente' && (
                                  <>
                                    <ActionButton
                                      size="small"
                                      color="success"
                                      onClick={() => handleValidateDemande(demande.COD_PRES)}
                                    >
                                      <ValidIcon fontSize="small" />
                                    </ActionButton>
                                    <ActionButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleRejectDemande(demande.COD_PRES)}
                                    >
                                      <RejectIcon fontSize="small" />
                                    </ActionButton>
                                    <ActionButton
                                      size="small"
                                      color="default"
                                      onClick={() => handleCancelDemande(demande.COD_PRES)}
                                      title="Annuler"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </ActionButton>
                                  </>
                                )}
                                
                                {(demande.STATUT === 'Rejetee' || demande.STATUT === 'Annulée') && (
                                  <ActionButton
                                    size="small"
                                    color="default"
                                    onClick={() => handleCancelDemande(demande.COD_PRES)}
                                    title="Supprimer définitivement"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </ActionButton>
                                )}
                              </Box>
                            </TableCell>
                          </StyledTableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={totalCount}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  sx={{ mt: 2 }}
                />
              </Box>
            )}

            {/* Formulaire de création */}
            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                  <Box sx={{ mb: 4 }}>
                    <Stepper activeStep={creationStep} sx={{ mb: 4 }}>
                      {steps.map((label) => (
                        <Step key={label}>
                          <StepLabel>{label}</StepLabel>
                        </Step>
                      ))}
                    </Stepper>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                      <Typography variant="h5" fontWeight={600}>
                        Nouvelle demande
                      </Typography>
                      <Button
                        onClick={resetNewDemande}
                        disabled={creationStep === 0 && !newDemande.patientId}
                      >
                        Réinitialiser
                      </Button>
                    </Box>
                  </Box>

                  {/* Étape 1: Patient & Affection */}
                  {creationStep === 0 && (
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                          Sélection du patient
                        </Typography>
                        <TextField
                          fullWidth
                          label="Rechercher un patient"
                          value={searchPatientTerm}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSearchPatientTerm(value);
                            searchPatients(value);
                          }}
                          InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                          helperText="Nom, prénom ou numéro d'identification"
                        />
                        
                        {patientResults.length > 0 && (
                          <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                            <List dense>
                              {patientResults.map((patient) => (
                                <ListItem
                                  key={patient.id}
                                  button
                                  onClick={() => handleSelectPatient(patient)}
                                  selected={newDemande.patientId === patient.id}
                                >
                                  <ListItemText
                                    primary={`${patient.nom} ${patient.prenom}`}
                                    secondary={`ID: ${patient.identifiant || patient.matricule} • Âge: ${patient.age || 'N/A'}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Paper>
                        )}

                        {newDemande.patientInfo && (
                          <Alert 
                            severity="success" 
                            sx={{ mt: 2 }}
                            icon={<PersonIcon />}
                          >
                            Patient sélectionné : <strong>{newDemande.patientInfo.nom} {newDemande.patientInfo.prenom}</strong>
                          </Alert>
                        )}
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                          Informations médicales
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                              <InputLabel>Type de prestation</InputLabel>
                              <Select
                                value={newDemande.typePrestation}
                                label="Type de prestation"
                                onChange={(e) => setNewDemande(prev => ({ ...prev, typePrestation: e.target.value }))}
                              >
                                <MenuItem value="">Sélectionner</MenuItem>
                                {typesPrestation.map(type => (
                                  <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Autocomplete
                              fullWidth
                              options={affectionsList}
                              getOptionLabel={(option) => option.label}
                              value={newDemande.codeAffectationInfo}
                              onChange={(event, newValue) => handleSelectAffection(newValue)}
                              onInputChange={(event, newInputValue) => {
                                setSearchAffectionTerm(newInputValue);
                                loadAffections(newInputValue);
                              }}
                              loading={affectionsLoading}
                              loadingText="Chargement..."
                              noOptionsText="Aucune affection trouvée"
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Affection"
                                  helperText="Sélectionnez l'affection principale"
                                  InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                      <>
                                        {affectionsLoading && <CircularProgress size={20} />}
                                        {params.InputProps.endAdornment}
                                      </>
                                    ),
                                  }}
                                />
                              )}
                            />
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={newDemande.hospitalisation}
                              onChange={(e) => setNewDemande(prev => ({ ...prev, hospitalisation: e.target.checked }))}
                            />
                          }
                          label="Hospitalisation"
                        />
                        
                        {newDemande.hospitalisation && (
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={4}>
                              <DatePicker
                                label="Date d'entrée"
                                value={newDemande.dateDebutHospitalisation}
                                onChange={(date) => setNewDemande(prev => ({ ...prev, dateDebutHospitalisation: date }))}
                                slotProps={{ textField: { fullWidth: true } }}
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <DatePicker
                                label="Date de sortie"
                                value={newDemande.dateFinHospitalisation}
                                onChange={(date) => setNewDemande(prev => ({ ...prev, dateFinHospitalisation: date }))}
                                slotProps={{ textField: { fullWidth: true } }}
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                label="Durée (jours)"
                                type="number"
                                value={newDemande.dureeHospitalisation || ''}
                                onChange={(e) => setNewDemande(prev => ({ ...prev, dureeHospitalisation: parseInt(e.target.value) || null }))}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Remarques supplémentaires"
                          value={newDemande.remarques}
                          onChange={(e) => setNewDemande(prev => ({ ...prev, remarques: e.target.value }))}
                          placeholder="Informations complémentaires..."
                        />
                      </Grid>
                    </Grid>
                  )}

                  {/* Étape 2: Actes médicaux */}
                  {creationStep === 1 && (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                        Actes et prestations
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <TextField
                          fullWidth
                          label="Rechercher un acte, médicament ou prestation"
                          value={searchActeTerm}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSearchActeTerm(value);
                            searchActes(value);
                          }}
                          InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                        
                        {acteResults.length > 0 && (
                          <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                            <List dense>
                              {acteResults.map((acte) => (
                                <ListItem
                                  key={acte.id}
                                  button
                                  onClick={() => handleAddActe(acte)}
                                  secondaryAction={
                                    <Button size="small">Ajouter</Button>
                                  }
                                >
                                  <ListItemText
                                    primary={acte.libelle || acte.libelle_complet}
                                    secondary={`${acte.prix ? `${acte.prix.toFixed(2)} FCFA` : 'Prix non spécifié'}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Paper>
                        )}
                      </Box>

                      {newDemande.actes.length === 0 ? (
                        <Alert severity="info">
                          Aucun acte ajouté. Recherchez et ajoutez des actes médicaux.
                        </Alert>
                      ) : (
                        <TableContainer component={Paper} sx={{ mb: 3 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Acte</TableCell>
                                <TableCell width={100} align="center">Qté</TableCell>
                                <TableCell width={120} align="right">Prix unit.</TableCell>
                                <TableCell width={120} align="right">Total</TableCell>
                                <TableCell width={80} align="center">Remb.</TableCell>
                                <TableCell width={60} align="center"></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {newDemande.actes.map((acte, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Typography variant="body2">{acte.libelle}</Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={acte.quantite}
                                      onChange={(e) => handleUpdateActe(index, 'quantite', e.target.value)}
                                      inputProps={{ min: 1 }}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={acte.prixUnitaire}
                                      onChange={(e) => handleUpdateActe(index, 'prixUnitaire', e.target.value)}
                                      InputProps={{
                                        endAdornment: <Typography variant="caption">FCFA</Typography>
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    {(acte.quantite * acte.prixUnitaire).toFixed(2)} FCFA
                                  </TableCell>
                                  <TableCell align="center">
                                    <Checkbox
                                      checked={acte.remboursable}
                                      onChange={(e) => handleUpdateActe(index, 'remboursable', e.target.checked)}
                                      color="success"
                                    />
                                  </TableCell>
                                  <TableCell align="center">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleRemoveActe(index)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell colSpan={3} align="right">
                                  <Typography fontWeight={600}>Total</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography fontWeight={600} color="primary">
                                    {newDemande.montantTotal.toFixed(2)} FCFA
                                  </Typography>
                                </TableCell>
                                <TableCell colSpan={2} />
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  )}

                  {/* Étape 3: Validation */}
                  {creationStep === 2 && (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                        Validation de la demande
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6" gutterBottom color="primary">
                                Récapitulatif
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2">
                                    <strong>Patient:</strong> {newDemande.patientInfo ? `${newDemande.patientInfo.nom} ${newDemande.patientInfo.prenom}` : 'Non spécifié'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2">
                                    <strong>Type:</strong> {newDemande.typePrestation || 'Non spécifié'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2">
                                    <strong>Affection:</strong> {newDemande.codeAffectationInfo ? `${newDemande.codeAffectationInfo.libelle}` : 'Non spécifiée'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="body2">
                                    <strong>Actes:</strong> {newDemande.actes.length} article(s)
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Divider sx={{ my: 1 }} />
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6">Montant total</Typography>
                                    <Typography variant="h5" color="primary">
                                      {newDemande.montantTotal.toFixed(2)} FCFA
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid item xs={12}>
                          <Alert severity="info">
                            Vérifiez les informations avant de soumettre. La demande passera en statut "En attente" de validation.
                          </Alert>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* Boutons de navigation */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                    <Button
                      onClick={() => creationStep > 0 ? setCreationStep(prev => prev - 1) : setActiveTab(0)}
                    >
                      {creationStep === 0 ? 'Retour aux demandes' : 'Précédent'}
                    </Button>
                    
                    {creationStep < steps.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={() => {
                          if (creationStep === 0 && (!newDemande.patientId || !newDemande.typePrestation)) {
                            setSnackbar({
                              open: true,
                              message: 'Veuillez sélectionner un patient et un type de prestation',
                              severity: 'warning'
                            });
                            return;
                          }
                          setCreationStep(prev => prev + 1);
                        }}
                        disabled={creationStep === 0 && (!newDemande.patientId || !newDemande.typePrestation)}
                      >
                        Continuer
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleSubmitDemande}
                        disabled={!newDemande.patientId || newDemande.actes.length === 0}
                      >
                        Soumettre la demande
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
          </CardContent>
        </StyledCard>

        {/* Dialog Détails */}
        <Dialog
          open={openDetailsDialog}
          onClose={() => setOpenDetailsDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight={600}>
              Détails de la demande
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            {selectedDemande && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Numéro
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedDemande.NUM_PRESCRIPTION || selectedDemande.COD_PRES}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Statut
                  </Typography>
                  <StatusBadge
                    label={selectedDemande.STATUT}
                    statuscolor={getStatusColor(selectedDemande.STATUT)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Patient
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedDemande.NOM_BEN} {selectedDemande.PRE_BEN}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Type de prestation
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedDemande.TYPE_PRESTATION}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Affection
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedDemande.LIB_AFF || selectedDemande.COD_AFF || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedDemande.DATE_PRESCRIPTION 
                      ? new Date(selectedDemande.DATE_PRESCRIPTION).toLocaleDateString('fr-FR')
                      : '-'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Montant
                  </Typography>
                  <Typography variant="body1" gutterBottom fontWeight={600}>
                    {selectedDemande.MONTANT_TOTAL 
                      ? `${parseFloat(selectedDemande.MONTANT_TOTAL).toFixed(2)} FCFA`
                      : '-'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Observations
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedDemande.OBSERVATIONS || 'Aucune observation'}
                  </Typography>
                </Grid>
                
                {selectedDemande.details && selectedDemande.details.length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                      Détails des actes
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Acte</TableCell>
                            <TableCell align="center">Quantité</TableCell>
                            <TableCell align="right">Prix unitaire</TableCell>
                            <TableCell align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedDemande.details.map((detail, index) => (
                            <TableRow key={index}>
                              <TableCell>{detail.LIBELLE || 'N/A'}</TableCell>
                              <TableCell align="center">{detail.QUANTITE || 0}</TableCell>
                              <TableCell align="right">
                                {detail.PRIX_UNITAIRE 
                                  ? `${parseFloat(detail.PRIX_UNITAIRE).toFixed(2)} FCFA`
                                  : '-'
                                }
                              </TableCell>
                              <TableCell align="right">
                                {detail.MONTANT_TOTAL 
                                  ? `${parseFloat(detail.MONTANT_TOTAL).toFixed(2)} FCFA`
                                  : '-'
                                }
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDetailsDialog(false)}>
              Fermer
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={snackbar.severity}
            sx={{ width: '100%' }}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default AccordsPrealables;