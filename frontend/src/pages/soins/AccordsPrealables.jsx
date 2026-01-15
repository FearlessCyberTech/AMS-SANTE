// src/pages/AccordsPrealables.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  ListItemSecondaryAction,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as ValidIcon,
  Cancel as RejectIcon,
  PlayCircle as ExecuteIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
  ExpandMore as ExpandMoreIcon,
  Description as DescriptionIcon,
  LocalHospital as HospitalIcon,
  Medication as MedicationIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import api, { prescriptionsAPI } from '../../services/api';

const AccordsPrealables = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(false);
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
  const [openDialog, setOpenDialog] = useState(false);
  const [openExecutionDialog, setOpenExecutionDialog] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [creationStep, setCreationStep] = useState(0);
  const [newDemande, setNewDemande] = useState({
    // Étape 1: Informations générales
    patientId: null,
    patientInfo: null,
    prescriptionId: null,
    prescriptionInfo: null,
    typePrestation: '',
    prestataireId: null,
    codeAffectation: '',
    codeAffectationInfo: null,
    remarques: '',
    hospitalisation: false,
    dateDebutHospitalisation: null,
    dateFinHospitalisation: null,
    dureeHospitalisation: null,
    piecesJointes: [],
    
    // Étape 2: Actes médicaux
    actes: [],
    
    // Étape 3: Récapitulatif
    montantTotal: 0,
    tauxCouverture: 80
  });
  const [searchPatientTerm, setSearchPatientTerm] = useState('');
  const [searchPrescriptionTerm, setSearchPrescriptionTerm] = useState('');
  const [searchActeTerm, setSearchActeTerm] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [prescriptionResults, setPrescriptionResults] = useState([]);
  const [acteResults, setActeResults] = useState([]);
  const [executionData, setExecutionData] = useState({
    actesSelectionnes: [],
    montantTotal: 0,
    feuilleDeSoins: null
  });

  const statuts = [
    { value: 'En attente', label: 'En attente', color: 'warning' },
    { value: 'Validee', label: 'Validée', color: 'success' },
    { value: 'Rejetee', label: 'Rejetée', color: 'error' },
    { value: 'Executee', label: 'Exécutée', color: 'info' }
  ];

  const typesPrestation = [
    { value: 'Consultation', label: 'Consultation' },
    { value: 'Pharmacie', label: 'Pharmacie' },
    { value: 'Biologie', label: 'Biologie' },
    { value: 'Imagerie', label: 'Imagerie' },
    { value: 'Hospitalisation', label: 'Hospitalisation' },
    { value: 'Chirurgie', label: 'Chirurgie' },
    { value: 'Rééducation', label: 'Rééducation' }
  ];

  // Charger les demandes
 // Charger les demandes
const loadDemandes = useCallback(async () => {
  setLoading(true);
  try {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      ...filters
    };
    
    // Nettoyer les paramètres null
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === '') {
        delete params[key];
      }
    });
    
    const response = await prescriptionsAPI.getAll(params);
    console.log('📋 Réponse des demandes:', response);
    
    if (response.success) {
      // Pour chaque demande, récupérer les détails si nécessaire
      const demandesAvecDetails = await Promise.all(
        response.prescriptions.map(async (demande) => {
          try {
            // Récupérer les détails pour chaque prescription
            const detailsResponse = await prescriptionsAPI.getById(demande.COD_PRES);
            if (detailsResponse.success && detailsResponse.prescription) {
              return {
                ...demande,
                details: detailsResponse.prescription.details || []
              };
            }
          } catch (error) {
            console.error(`Erreur chargement détails prescription ${demande.COD_PRES}:`, error);
          }
          return demande;
        })
      );
      
      setDemandes(demandesAvecDetails);
      setTotalCount(response.pagination.total);
    }
  } catch (error) {
    console.error('Erreur chargement demandes:', error);
    setSnackbar({
      open: true,
      message: 'Erreur lors du chargement des demandes',
      severity: 'error'
    });
  } finally {
    setLoading(false);
  }
}, [page, rowsPerPage, filters]);

  useEffect(() => {
    loadDemandes();
  }, [loadDemandes]);

  // Recherche de patients
  const searchPatients = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setPatientResults([]);
      return;
    }
    
    try {
      const response = await prescriptionsAPI.searchPatients(searchTerm);
      if (response.success) {
        setPatientResults(response.patients || []);
      }
    } catch (error) {
      console.error('Erreur recherche patients:', error);
    }
  };

  // Recherche de prescriptions
  const searchPrescriptions = async (searchTerm) => {
    if (!searchTerm) {
      setPrescriptionResults([]);
      return;
    }
    
    try {
      const response = await prescriptionsAPI.getByNumeroOrId(searchTerm);
      if (response.success && response.prescription) {
        setPrescriptionResults([response.prescription]);
      } else {
        setPrescriptionResults([]);
      }
    } catch (error) {
      console.error('Erreur recherche prescriptions:', error);
    }
  };

  // Recherche d'actes médicaux
  const searchActes = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setActeResults([]);
      return;
    }
    
    try {
      const response = await prescriptionsAPI.searchMedicalItems(searchTerm);
      if (response.success) {
        setActeResults(response.items || []);
      }
    } catch (error) {
      console.error('Erreur recherche actes:', error);
    }
  };

  // Sélectionner un patient
  const handleSelectPatient = (patient) => {
    setNewDemande({
      ...newDemande,
      patientId: patient.id,
      patientInfo: patient,
      patientSearch: `${patient.nom} ${patient.prenom} - ${patient.identifiant || patient.matricule}`
    });
    setPatientResults([]);
  };

  // Sélectionner une prescription
  const handleSelectPrescription = (prescription) => {
    setNewDemande({
      ...newDemande,
      prescriptionId: prescription.COD_PRES,
      prescriptionInfo: prescription,
      patientId: prescription.COD_BEN,
      patientInfo: {
        id: prescription.COD_BEN,
        nom: prescription.NOM_BEN,
        prenom: prescription.PRE_BEN,
        identifiant: prescription.IDENTIFIANT_NATIONAL
      },
      codeAffectation: prescription.COD_AFF,
      codeAffectationInfo: {
        code: prescription.COD_AFF,
        libelle: prescription.LIB_AFF
      }
    });
    setPrescriptionResults([]);
  };

  // Ajouter un acte médical
  const handleAddActe = (acte) => {
    const nouvelActe = {
      id: acte.id,
      type: acte.type || 'medicament',
      code: acte.code || acte.id,
      libelle: acte.libelle || acte.libelle_complet,
      quantite: 1,
      prixUnitaire: acte.prix || 0,
      remboursable: acte.remboursable !== undefined ? acte.remboursable : true,
      tauxPriseEnCharge: 80
    };
    
    setNewDemande({
      ...newDemande,
      actes: [...newDemande.actes, nouvelActe],
      montantTotal: newDemande.montantTotal + (nouvelActe.quantite * nouvelActe.prixUnitaire)
    });
    setActeResults([]);
  };

  // Mettre à jour un acte
  const handleUpdateActe = (index, field, value) => {
    const updatedActes = [...newDemande.actes];
    const oldActe = updatedActes[index];
    updatedActes[index] = { ...oldActe, [field]: value };
    
    // Recalculer le montant total
    const montantTotal = updatedActes.reduce((total, acte) => {
      return total + (acte.quantite * acte.prixUnitaire);
    }, 0);
    
    setNewDemande({
      ...newDemande,
      actes: updatedActes,
      montantTotal
    });
  };

  // Supprimer un acte
  const handleRemoveActe = (index) => {
    const removedActe = newDemande.actes[index];
    const updatedActes = newDemande.actes.filter((_, i) => i !== index);
    
    setNewDemande({
      ...newDemande,
      actes: updatedActes,
      montantTotal: newDemande.montantTotal - (removedActe.quantite * removedActe.prixUnitaire)
    });
  };

  // Soumettre une nouvelle demande
  const handleSubmitDemande = async () => {
    try {
      const demandeData = {
        COD_BEN: newDemande.patientId,
        COD_PRE: newDemande.prestataireId,
        TYPE_PRESTATION: newDemande.typePrestation,
        COD_AFF: newDemande.codeAffectation,
        OBSERVATIONS: newDemande.remarques,
        details: newDemande.actes.map(acte => ({
          TYPE_ELEMENT: acte.type,
          COD_ELEMENT: acte.code,
          LIBELLE: acte.libelle,
          QUANTITE: acte.quantite,
          PRIX_UNITAIRE: acte.prixUnitaire,
          REMBOURSABLE: acte.remboursable,
          TAUX_PRISE_EN_CHARGE: acte.tauxPriseEnCharge
        }))
      };
      
      // Ajouter les données d'hospitalisation si nécessaire
      if (newDemande.hospitalisation) {
        demandeData.DATE_DEBUT_HOSPITALISATION = newDemande.dateDebutHospitalisation;
        demandeData.DATE_FIN_HOSPITALISATION = newDemande.dateFinHospitalisation;
        demandeData.DUREE_HOSPITALISATION = newDemande.dureeHospitalisation;
      }
      
      const response = await prescriptionsAPI.create(demandeData);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: `Demande créée avec succès. Numéro: ${response.numero}`,
          severity: 'success'
        });
        setOpenDialog(false);
        setNewDemande({
          patientId: null,
          patientInfo: null,
          prescriptionId: null,
          prescriptionInfo: null,
          typePrestation: '',
          prestataireId: null,
          codeAffectation: '',
          codeAffectationInfo: null,
          remarques: '',
          hospitalisation: false,
          dateDebutHospitalisation: null,
          dateFinHospitalisation: null,
          dureeHospitalisation: null,
          piecesJointes: [],
          actes: [],
          montantTotal: 0,
          tauxCouverture: 80
        });
        setCreationStep(0);
        loadDemandes();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Erreur lors de la création: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Valider une demande
  // Valider une demande
const handleValidateDemande = async (id) => {
  try {
    // Données d'accord
    const accordData = {
      statut: 'Validee',
      dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      conditions: {
        tauxCouverture: 80,
        plafond: 500000,
        validite: 30
      },
      raison: 'Accord accordé suite à analyse médicale'
    };
    
    const response = await api.prescriptions.updateStatus(id, accordData);
    if (response.success) {
      setSnackbar({
        open: true,
        message: 'Accord préalable validé avec succès',
        severity: 'success'
      });
      loadDemandes();
    }
  } catch (error) {
    setSnackbar({
      open: true,
      message: `Erreur lors de la validation: ${error.message}`,
      severity: 'error'
    });
  }
};

// Rejeter une demande
const handleRejectDemande = async (id) => {
  try {
    const raison = prompt('Veuillez saisir la raison du rejet :');
    if (!raison) return;
    
    const accordData = {
      statut: 'Rejetee',
      raison: raison
    };
    
    const response = await api.prescriptions.updateStatus(id, accordData);
    if (response.success) {
      setSnackbar({
        open: true,
        message: 'Accord préalable rejeté',
        severity: 'success'
      });
      loadDemandes();
    }
  } catch (error) {
    setSnackbar({
      open: true,
      message: 'Erreur lors du rejet',
      severity: 'error'
    });
  }
};

 

  // Exécuter une demande
 // Exécuter une demande
const handleExecuteDemande = (demande) => {
  console.log('📋 Demande sélectionnée pour exécution:', demande);
  console.log('📋 Détails de la demande:', demande.details);
  
  setSelectedDemande(demande);
  
  // S'assurer que les détails existent et ont la bonne structure
  const actesSelectionnes = demande.details?.map((detail, index) => ({
    id: detail.COD_PRES_DET || detail.ID || index, // Utiliser différents champs possibles
    cod_pres_det: detail.COD_PRES_DET || detail.ID || index,
    libelle: detail.LIBELLE || detail.NOM || `Acte ${index + 1}`,
    quantitePrescrite: detail.QUANTITE || detail.quantite || 1,
    quantiteExecutee: detail.QUANTITE_EXECUTEE || 0,
    prixUnitaire: detail.PRIX_UNITAIRE || detail.prix || 0
  })) || [];
  
  console.log('📋 Actes sélectionnés préparés:', actesSelectionnes);
  
  setExecutionData({
    actesSelectionnes: actesSelectionnes,
    montantTotal: 0,
    feuilleDeSoins: null
  });
  setOpenExecutionDialog(true);
};

  // Générer la feuille de soins
const handleGenerateFeuilleSoins = () => {
  try {
    console.log('=== DÉBUT GÉNÉRATION FEUILLE DE SOINS ===');
    
    // Vérifier que nous avons une demande sélectionnée
    if (!selectedDemande) {
      console.error('❌ Aucune demande sélectionnée');
      return;
    }
    
    // Vérifier qu'il y a des actes
    if (!executionData.actesSelectionnes || executionData.actesSelectionnes.length === 0) {
      console.error('❌ Aucun acte sélectionné');
      return;
    }
    
    // Calculer le total
    let total = 0;
    const actesExecutes = [];
    
    executionData.actesSelectionnes.forEach((acte, index) => {
      const quantite = Number(acte.quantiteExecutee) || 0;
      const prix = Number(acte.prixUnitaire) || 0;
      const sousTotal = quantite * prix;
      
      if (quantite > 0) {
        total += sousTotal;
        actesExecutes.push({
          libelle: acte.libelle || `Acte ${index + 1}`,
          quantiteExecutee: quantite,
          prixUnitaire: prix,
          sousTotal: sousTotal
        });
      }
      
      console.log(`📊 ${index + 1}. ${acte.libelle}: ${quantite} × ${prix} = ${sousTotal}`);
    });
    
    console.log('💰 Total:', total);
    console.log('🎯 Actes exécutés:', actesExecutes.length);
    
    // Générer un numéro unique
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    const numeroFeuille = `FDS-${new Date().getFullYear()}-${timestamp.toString().substr(-6)}-${random}`;
    
    // Créer l'objet feuille de soins
    const feuilleDeSoins = {
      numero: numeroFeuille,
      date: new Date().toLocaleDateString('fr-FR'),
      patient: `${selectedDemande.NOM_BEN} ${selectedDemande.PRE_BEN}`,
      prestataire: selectedDemande.NOM_PRESTATAIRE || 'Non spécifié',
      actes: actesExecutes,
      montantTotal: total
    };
    
    console.log('📄 Feuille de soins créée:', feuilleDeSoins);
    
    // Mettre à jour l'état
    setExecutionData(prev => ({
      ...prev,
      montantTotal: total,
      feuilleDeSoins: feuilleDeSoins
    }));
    
    // Notification
    setSnackbar({
      open: true,
      message: `Feuille de soins générée: ${numeroFeuille}`,
      severity: 'success'
    });
    
    console.log('=== FIN GÉNÉRATION FEUILLE DE SOINS ===');
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    setSnackbar({
      open: true,
      message: `Erreur: ${error.message}`,
      severity: 'error'
    });
  }
};
  // Télécharger la feuille de soins
  const handleDownloadFeuilleSoins = () => {
    if (!executionData.feuilleDeSoins) return;
    
    const content = `
      FEUILLE DE SOINS
      ================
      
      Numéro: ${executionData.feuilleDeSoins.numero}
      Date: ${executionData.feuilleDeSoins.date}
      
      Patient: ${executionData.feuilleDeSoins.patient}
      Prestataire: ${executionData.feuilleDeSoins.prestataire}
      
      ACTES EXÉCUTÉS:
      ${executionData.feuilleDeSoins.actes.map(acte => `
        - ${acte.libelle}
          Quantité: ${acte.quantiteExecutee}
          Prix unitaire: ${acte.prixUnitaire.toFixed(2)} FCFA
          Total: ${(acte.quantiteExecutee * acte.prixUnitaire).toFixed(2)} FCFA
      `).join('')}
      
      MONTANT TOTAL: ${executionData.feuilleDeSoins.montantTotal.toFixed(2)} FCFA
      
      Signature: ____________________
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FeuilleSoins-${executionData.feuilleDeSoins.numero}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const steps = ['Informations générales', 'Actes médicaux', 'Récapitulatif'];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Gestion des Accords Préalables / Prise en charge
          </Typography>
          <Typography color="textSecondary">
            Gestion des demandes d'accord préalable et de prise en charge des soins
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Tableau de bord" />
                <Tab label="Créer une demande" />
                <Tab label="Exécution" />
                <Tab label="Conditions de prise en charge" />
              </Tabs>
            </Box>

            {/* Tableau de bord */}
            {activeTab === 0 && (
              <Box>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Liste des demandes</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                  >
                    Nouvelle demande
                  </Button>
                </Box>

                {/* Filtres */}
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Recherche"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        InputProps={{
                          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Statut</InputLabel>
                        <Select
                          value={filters.statut}
                          label="Statut"
                          onChange={(e) => handleFilterChange('statut', e.target.value)}
                        >
                          <MenuItem value="">Tous</MenuItem>
                          {statuts.map(statut => (
                            <MenuItem key={statut.value} value={statut.value}>
                              {statut.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Type prestation</InputLabel>
                        <Select
                          value={filters.type_prestation}
                          label="Type prestation"
                          onChange={(e) => handleFilterChange('type_prestation', e.target.value)}
                        >
                          <MenuItem value="">Tous</MenuItem>
                          {typesPrestation.map(type => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <DatePicker
                        label="Date début"
                        value={filters.date_debut}
                        onChange={(date) => handleFilterChange('date_debut', date)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <DatePicker
                        label="Date fin"
                        value={filters.date_fin}
                        onChange={(date) => handleFilterChange('date_fin', date)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <Button
                        variant="outlined"
                        onClick={loadDemandes}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Filtrer'}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Tableau des demandes */}
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Numéro</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Affection</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Montant</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            <CircularProgress />
                          </TableCell>
                        </TableRow>
                      ) : demandes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            Aucune demande trouvée
                          </TableCell>
                        </TableRow>
                      ) : (
                        demandes.map((demande) => (
                          <TableRow key={demande.COD_PRES}>
                            <TableCell>{demande.NUM_PRESCRIPTION}</TableCell>
                            <TableCell>
                              {demande.NOM_BEN} {demande.PRE_BEN}
                              <br />
                              <Typography variant="caption" color="textSecondary">
                                {demande.IDENTIFIANT_NATIONAL}
                              </Typography>
                            </TableCell>
                            <TableCell>{demande.TYPE_PRESTATION}</TableCell>
                            <TableCell>{demande.LIB_AFF}</TableCell>
                            <TableCell>
                              {new Date(demande.DATE_PRESCRIPTION).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={demande.STATUT}
                                color={statuts.find(s => s.value === demande.STATUT)?.color || 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {demande.MONTANT_TOTAL ? `${demande.MONTANT_TOTAL.toFixed(2)} FCFA` : '-'}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Voir détails">
                                  <IconButton size="small" onClick={() => setSelectedDemande(demande)}>
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                                {demande.STATUT === 'En attente' && (
                                  <>
                                    <Tooltip title="Valider">
                                      <IconButton
                                        size="small"
                                        color="success"
                                        onClick={() => handleValidateDemande(demande.COD_PRES)}
                                      >
                                        <ValidIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Rejeter">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRejectDemande(demande.COD_PRES)}
                                      >
                                        <RejectIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                                {demande.STATUT === 'Validee' && (
                                  <Tooltip title="Exécuter">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleExecuteDemande(demande)}
                                    >
                                      <ExecuteIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
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
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </Box>
            )}

            {/* Création de demande */}
            {activeTab === 1 && (
              <Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setOpenDialog(true);
                    setCreationStep(0);
                  }}
                  sx={{ mb: 3 }}
                >
                  Nouvelle demande
                </Button>
                <Alert severity="info">
                  Cliquez sur le bouton ci-dessus pour créer une nouvelle demande d'accord préalable.
                </Alert>
              </Box>
            )}

            {/* Exécution */}
            {activeTab === 2 && (
              <Box>
                <Alert severity="warning">
                  Sélectionnez une demande validée dans le tableau de bord pour l'exécuter.
                </Alert>
              </Box>
            )}

            {/* Conditions de prise en charge */}
            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Conditions de prise en charge
                </Typography>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Taux de couverture par type de prestation
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText primary="Consultations" secondary="Taux de couverture: 80%" />
                        <Chip label="Couvert" color="success" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Médicaments" secondary="Taux de couverture: 70% (liste positive)" />
                        <Chip label="Partiellement couvert" color="warning" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Analyses biologiques" secondary="Taux de couverture: 90%" />
                        <Chip label="Couvert" color="success" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Imagerie médicale" secondary="Taux de couverture: 85%" />
                        <Chip label="Couvert" color="success" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Hospitalisation" secondary="Taux de couverture: 95% (plafond: 500,000 FCFA/jour)" />
                        <Chip label="Couvert avec plafond" color="info" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Exclusions
                    </Typography>
                    <Typography paragraph>
                      Les prestations suivantes ne sont pas couvertes par le régime de prise en charge :
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText primary="Médicaments non inscrits sur la liste positive" />
                        <Chip label="Non couvert" color="error" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Soins esthétiques non thérapeutiques" />
                        <Chip label="Non couvert" color="error" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Médecines alternatives non conventionnelles" />
                        <Chip label="Non couvert" color="error" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Transports sanitaires non urgents" />
                        <Chip label="Non couvert" color="error" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Dialog de création de demande */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddIcon />
              <Typography variant="h6">Nouvelle demande d'accord préalable</Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Stepper activeStep={creationStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Étape 1: Informations générales */}
            {creationStep === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>1. Recherche du patient</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Rechercher par matricule ou nom"
                      value={searchPatientTerm}
                      onChange={(e) => {
                        setSearchPatientTerm(e.target.value);
                        searchPatients(e.target.value);
                      }}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                    <Typography variant="body2" sx={{ alignSelf: 'center' }}>
                      OU
                    </Typography>
                    <TextField
                      fullWidth
                      label="Lien à une prescription existante"
                      value={searchPrescriptionTerm}
                      onChange={(e) => {
                        setSearchPrescriptionTerm(e.target.value);
                        searchPrescriptions(e.target.value);
                      }}
                      placeholder="Numéro de prescription"
                    />
                  </Box>

                  {patientResults.length > 0 && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Résultats de recherche:
                      </Typography>
                      <List dense>
                        {patientResults.map((patient) => (
                          <ListItem
                            key={patient.id}
                            button
                            onClick={() => handleSelectPatient(patient)}
                          >
                            <ListItemText
                              primary={`${patient.nom} ${patient.prenom}`}
                              secondary={`Matricule: ${patient.identifiant || patient.matricule} | Âge: ${patient.age || 'N/A'}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}

                  {prescriptionResults.length > 0 && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Prescription trouvée:
                      </Typography>
                      {prescriptionResults.map((prescription) => (
                        <Card key={prescription.COD_PRES} sx={{ mb: 1 }}>
                          <CardContent>
                            <Typography variant="body2">
                              <strong>Numéro:</strong> {prescription.NUM_PRESCRIPTION}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Patient:</strong> {prescription.NOM_BEN} {prescription.PRE_BEN}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Affection:</strong> {prescription.LIB_AFF}
                            </Typography>
                            <Button
                              size="small"
                              onClick={() => handleSelectPrescription(prescription)}
                              sx={{ mt: 1 }}
                            >
                              Utiliser cette prescription
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </Paper>
                  )}

                  {newDemande.patientInfo && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Patient sélectionné: <strong>{newDemande.patientInfo.nom} {newDemande.patientInfo.prenom}</strong>
                    </Alert>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type de prestation *</InputLabel>
                    <Select
                      value={newDemande.typePrestation}
                      label="Type de prestation *"
                      onChange={(e) => setNewDemande({ ...newDemande, typePrestation: e.target.value })}
                    >
                      <MenuItem value="">Sélectionnez un type</MenuItem>
                      {typesPrestation.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Code affectation *"
                    value={newDemande.codeAffectation}
                    onChange={(e) => setNewDemande({ ...newDemande, codeAffectation: e.target.value })}
                    helperText="Code CIM ou interne de l'affection"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newDemande.hospitalisation}
                        onChange={(e) => setNewDemande({ ...newDemande, hospitalisation: e.target.checked })}
                      />
                    }
                    label="Hospitalisation"
                  />
                </Grid>

                {newDemande.hospitalisation && (
                  <>
                    <Grid item xs={12} md={4}>
                      <DatePicker
                        label="Date d'entrée"
                        value={newDemande.dateDebutHospitalisation}
                        onChange={(date) => setNewDemande({ ...newDemande, dateDebutHospitalisation: date })}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <DatePicker
                        label="Date de sortie prévue"
                        value={newDemande.dateFinHospitalisation}
                        onChange={(date) => setNewDemande({ ...newDemande, dateFinHospitalisation: date })}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Durée (jours)"
                        type="number"
                        value={newDemande.dureeHospitalisation || ''}
                        onChange={(e) => setNewDemande({ ...newDemande, dureeHospitalisation: parseInt(e.target.value) || null })}
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Remarques"
                    value={newDemande.remarques}
                    onChange={(e) => setNewDemande({ ...newDemande, remarques: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    startIcon={<AttachFileIcon />}
                    variant="outlined"
                    onClick={() => document.getElementById('file-upload').click()}
                  >
                    Ajouter des pièces jointes
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      setNewDemande({
                        ...newDemande,
                        piecesJointes: [...newDemande.piecesJointes, ...files]
                      });
                    }}
                  />
                  {newDemande.piecesJointes.length > 0 && (
                    <List dense sx={{ mt: 1 }}>
                      {newDemande.piecesJointes.map((file, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(2)} KB`} />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => {
                                const newFiles = [...newDemande.piecesJointes];
                                newFiles.splice(index, 1);
                                setNewDemande({ ...newDemande, piecesJointes: newFiles });
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Grid>
              </Grid>
            )}

            {/* Étape 2: Actes médicaux */}
            {creationStep === 1 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>2. Saisie des actes médicaux</strong>
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Rechercher un acte médical"
                    value={searchActeTerm}
                    onChange={(e) => {
                      setSearchActeTerm(e.target.value);
                      searchActes(e.target.value);
                    }}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    helperText="Recherchez par nom de médicament, acte ou code"
                  />
                  
                  {acteResults.length > 0 && (
                    <Paper sx={{ p: 2, mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Résultats:
                      </Typography>
                      <List dense>
                        {acteResults.map((acte) => (
                          <ListItem
                            key={acte.id}
                            button
                            onClick={() => handleAddActe(acte)}
                          >
                            <ListItemText
                              primary={acte.libelle || acte.libelle_complet}
                              secondary={`Prix: ${acte.prix ? `${acte.prix} FCFA` : 'Non spécifié'} | Type: ${acte.type || 'Médicament'}`}
                            />
                            <Button size="small">Ajouter</Button>
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Box>

                {newDemande.actes.length === 0 ? (
                  <Alert severity="info">
                    Aucun acte médical ajouté. Veuillez rechercher et ajouter des actes.
                  </Alert>
                ) : (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Acte</TableCell>
                          <TableCell align="center">Quantité</TableCell>
                          <TableCell align="right">Prix unitaire</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell align="center">Remboursable</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {newDemande.actes.map((acte, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2">{acte.libelle}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                Code: {acte.code}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                type="number"
                                size="small"
                                value={acte.quantite}
                                onChange={(e) => handleUpdateActe(index, 'quantite', parseFloat(e.target.value))}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                value={acte.prixUnitaire}
                                onChange={(e) => handleUpdateActe(index, 'prixUnitaire', parseFloat(e.target.value))}
                                sx={{ width: 100 }}
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
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <strong>Total:</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{newDemande.montantTotal.toFixed(2)} FCFA</strong>
                          </TableCell>
                          <TableCell colSpan={2} />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* Étape 3: Récapitulatif */}
            {creationStep === 2 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>3. Récapitulatif de la demande</strong>
                </Typography>
                
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Informations générales
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2">
                          <strong>Patient:</strong> {newDemande.patientInfo ? `${newDemande.patientInfo.nom} ${newDemande.patientInfo.prenom}` : 'Non spécifié'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2">
                          <strong>Type de prestation:</strong> {newDemande.typePrestation || 'Non spécifié'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2">
                          <strong>Code affectation:</strong> {newDemande.codeAffectation || 'Non spécifié'}
                        </Typography>
                      </Grid>
                      {newDemande.hospitalisation && (
                        <>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2">
                              <strong>Hospitalisation:</strong> Oui
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2">
                              <strong>Durée:</strong> {newDemande.dureeHospitalisation} jours
                            </Typography>
                          </Grid>
                        </>
                      )}
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <strong>Remarques:</strong> {newDemande.remarques || 'Aucune'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Actes médicaux ({newDemande.actes.length})
                    </Typography>
                    <List dense>
                      {newDemande.actes.map((acte, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={acte.libelle}
                            secondary={`Quantité: ${acte.quantite} | Prix unitaire: ${acte.prixUnitaire.toFixed(2)} FCFA | Total: ${(acte.quantite * acte.prixUnitaire).toFixed(2)} FCFA`}
                          />
                          <Chip
                            label={acte.remboursable ? 'Remboursable' : 'Non remboursable'}
                            color={acte.remboursable ? 'success' : 'error'}
                            size="small"
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">
                        Montant total:
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {newDemande.montantTotal.toFixed(2)} FCFA
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                <Alert severity="info">
                  Vérifiez toutes les informations avant de soumettre la demande. Une fois soumise, elle sera en statut "En attente" de validation.
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {creationStep > 0 && (
              <Button onClick={() => setCreationStep(creationStep - 1)}>
                Retour
              </Button>
            )}
            <Box sx={{ flex: 1 }} />
            <Button onClick={() => setOpenDialog(false)}>
              Annuler
            </Button>
            {creationStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={() => {
                  if (creationStep === 0 && (!newDemande.patientId || !newDemande.typePrestation || !newDemande.codeAffectation)) {
                    setSnackbar({
                      open: true,
                      message: 'Veuillez remplir tous les champs obligatoires',
                      severity: 'error'
                    });
                    return;
                  }
                  if (creationStep === 1 && newDemande.actes.length === 0) {
                    setSnackbar({
                      open: true,
                      message: 'Veuillez ajouter au moins un acte médical',
                      severity: 'error'
                    });
                    return;
                  }
                  setCreationStep(creationStep + 1);
                }}
              >
                Suivant
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
          </DialogActions>
        </Dialog>

        {/* Dialog d'exécution */}
        {/* Dialog d'exécution */}
<Dialog
  open={openExecutionDialog}
  onClose={() => setOpenExecutionDialog(false)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ExecuteIcon />
      <Typography variant="h6">Exécution de la demande</Typography>
    </Box>
  </DialogTitle>
  <DialogContent dividers>
    {selectedDemande && (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          <strong>Demande:</strong> {selectedDemande.NUM_PRESCRIPTION}
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Patient: {selectedDemande.NOM_BEN} {selectedDemande.PRE_BEN}
        </Typography>

        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>
              Sélection des actes à exécuter ({executionData.actesSelectionnes.length} actes)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {executionData.actesSelectionnes.length === 0 ? (
              <Alert severity="warning">
                Aucun acte trouvé pour cette prescription. Vérifiez les détails de la prescription.
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Acte</TableCell>
                        <TableCell align="center">Quantité prescrite</TableCell>
                        <TableCell align="center">Quantité à exécuter</TableCell>
                        <TableCell align="right">Prix unitaire</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {executionData.actesSelectionnes.map((acte, index) => (
                        <TableRow key={acte.id || index}>
                          <TableCell>{acte.libelle || `Acte ${index + 1}`}</TableCell>
                          <TableCell align="center">{acte.quantitePrescrite || 0}</TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={acte.quantiteExecutee || 0}
                              onChange={(e) => {
                                const newActes = [...executionData.actesSelectionnes];
                                newActes[index].quantiteExecutee = Math.min(
                                  parseFloat(e.target.value) || 0,
                                  acte.quantitePrescrite || 0
                                );
                                setExecutionData({ ...executionData, actesSelectionnes: newActes });
                              }}
                              sx={{ width: 80 }}
                              inputProps={{ 
                                min: 0, 
                                max: acte.quantitePrescrite || 0 
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {acte.prixUnitaire ? `${acte.prixUnitaire.toFixed(2)} FCFA` : '0 FCFA'}
                          </TableCell>
                          <TableCell align="right">
                            {((acte.quantiteExecutee || 0) * (acte.prixUnitaire || 0)).toFixed(2)} FCFA
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} align="right">
                          <strong>Total à exécuter:</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>{executionData.montantTotal.toFixed(2)} FCFA</strong>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<DescriptionIcon />}
                    onClick={handleGenerateFeuilleSoins}
                    disabled={executionData.actesSelectionnes.every(a => (a.quantiteExecutee || 0) === 0)}
                  >
                    Générer la feuille de soins
                  </Button>
                </Box>
              </>
            )}
          </AccordionDetails>
        </Accordion>
        {/* ... reste du code ... */}
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenExecutionDialog(false)}>
      Fermer
    </Button>
  </DialogActions>
</Dialog>

        {/* Dialog de détails */}
        {selectedDemande && !openExecutionDialog && (
          <Dialog
            open={!!selectedDemande && !openExecutionDialog}
            onClose={() => setSelectedDemande(null)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Détails de la demande
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Numéro
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedDemande.NUM_PRESCRIPTION}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Statut
                  </Typography>
                  <Chip
                    label={selectedDemande.STATUT}
                    color={statuts.find(s => s.value === selectedDemande.STATUT)?.color || 'default'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Patient
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedDemande.NOM_BEN} {selectedDemande.PRE_BEN}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Type de prestation
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedDemande.TYPE_PRESTATION}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Affection
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedDemande.LIB_AFF} ({selectedDemande.COD_AFF})
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Date de prescription
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(selectedDemande.DATE_PRESCRIPTION).toLocaleDateString('fr-FR')}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Montant total
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedDemande.MONTANT_TOTAL ? `${selectedDemande.MONTANT_TOTAL.toFixed(2)} FCFA` : 'Non spécifié'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Observations
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedDemande.OBSERVATIONS || 'Aucune observation'}
                  </Typography>
                </Grid>
              </Grid>
              
              {selectedDemande.details && selectedDemande.details.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
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
                          <TableCell align="center">Statut</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedDemande.details.map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell>{detail.LIBELLE}</TableCell>
                            <TableCell align="center">{detail.QUANTITE}</TableCell>
                            <TableCell align="right">{detail.PRIX_UNITAIRE ? `${detail.PRIX_UNITAIRE.toFixed(2)} FCFA` : '-'}</TableCell>
                            <TableCell align="right">{detail.MONTANT_TOTAL ? `${detail.MONTANT_TOTAL.toFixed(2)} FCFA` : '-'}</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={detail.STATUT_EXECUTION || 'Non exécuté'}
                                size="small"
                                color={detail.STATUT_EXECUTION === 'Execute' ? 'success' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedDemande(null)}>
                Fermer
              </Button>
              {selectedDemande.STATUT === 'Validee' && (
                <Button
                  variant="contained"
                  startIcon={<ExecuteIcon />}
                  onClick={() => handleExecuteDemande(selectedDemande)}
                >
                  Exécuter
                </Button>
              )}
            </DialogActions>
          </Dialog>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
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
    </LocalizationProvider>
  );
};

export default AccordsPrealables;