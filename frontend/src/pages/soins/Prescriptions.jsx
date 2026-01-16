// src/components/Prescriptions.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Stack,
  Divider,
  Avatar,
  InputAdornment,
  Fade,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Badge,
  alpha,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Print as PrintIcon,
  PlayCircle as ExecuteIcon,
  Assignment as PrescriptionIcon,
  LocalPharmacy as PharmacyIcon,
  Science as LabIcon,
  CameraAlt as RadiologyIcon,
  Description as ReportIcon,
  LocalHospital as HospitalIcon,
  MedicalServices as MedicalIcon,
  Person as PersonIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon,
  Notifications as NotificationIcon,
  EditNote as EditNoteIcon,
  LocalHospital as CenterIcon,
  People as BeneficiariesIcon,
  Medication as MedicationIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  Done as DoneIcon,
  Download as DownloadIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import fr from 'date-fns/locale/fr';
import api, { centresAPI } from '../../services/api';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import './Prescriptions.css';

// Import du logo AMS
import amsLogo from '../../assets/AMS-logo.png';

const Prescriptions = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState(0);
  const [creationStep, setCreationStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [warning, setWarning] = useState(null);

  // États pour la création de prescription
  const [patient, setPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSearchType, setPatientSearchType] = useState('identifiant');

  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState('');
  const [selectedCentreInfo, setSelectedCentreInfo] = useState(null);
  
  const [medecins, setMedecins] = useState([]);
  const [selectedMedecin, setSelectedMedecin] = useState('');
  const [loadingPrestataires, setLoadingPrestataires] = useState(false);

  const [typePrestation, setTypePrestation] = useState('');
  const [observations, setObservations] = useState('');
  const [dateValidite, setDateValidite] = useState(null);
  const [details, setDetails] = useState([]);
  const [remplirDetails, setRemplirDetails] = useState(true);

  // États pour la liste des prescriptions
  const [prescriptions, setPrescriptions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    statut: '',
    type_prestation: '',
    date_debut: null,
    date_fin: null
  });

  // États pour l'exécution de prescription
  const [prescriptionSearch, setPrescriptionSearch] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [executionDetails, setExecutionDetails] = useState([]);

  // États pour la recherche d'éléments
  const [searchElementDialog, setSearchElementDialog] = useState(false);
  const [elementSearch, setElementSearch] = useState('');
  const [elements, setElements] = useState([]);

  // États pour l'impression
  const [showFeuilleSoins, setShowFeuilleSoins] = useState(false);
  const [prescriptionToPrint, setPrescriptionToPrint] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  // Types de prestation
  const typesPrestation = [
    { 
      value: 'Pharmacie', 
      label: t('prescriptions.types.pharmacy'), 
      icon: <PharmacyIcon />, 
      color: '#4CAF50'
    },
    { 
      value: 'Biologie', 
      label: t('prescriptions.types.biology'), 
      icon: <LabIcon />, 
      color: '#2196F3'
    },
    { 
      value: 'Imagerie', 
      label: t('prescriptions.types.imaging'), 
      icon: <RadiologyIcon />, 
      color: '#9C27B0'
    },
    { 
      value: 'Consultation', 
      label: t('prescriptions.types.consultation'), 
      icon: <MedicalIcon />, 
      color: '#FF9800'
    },
    { 
      value: 'Hospitalisation', 
      label: t('prescriptions.types.hospitalization'), 
      icon: <HospitalIcon />, 
      color: '#F44336'
    }
  ];

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const translateStatus = (status) => {
    const statusMap = {
      'En attente': t('prescriptions.status.pending'),
      'En cours': t('prescriptions.status.inProgress'),
      'Executee': t('prescriptions.status.executed'),
      'Annulee': t('prescriptions.status.cancelled'),
      'Partiellement exécutée': t('prescriptions.status.partiallyExecuted'),
      'A executer': t('prescriptions.status.toExecute')
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (statut) => {
    const translatedStatut = translateStatus(statut);
    const statusMap = {
      [t('prescriptions.status.pending')]: 'warning',
      [t('prescriptions.status.inProgress')]: 'info',
      [t('prescriptions.status.executed')]: 'success',
      [t('prescriptions.status.cancelled')]: 'error',
      [t('prescriptions.status.partiallyExecuted')]: 'secondary'
    };
    return statusMap[translatedStatut] || 'default';
  };

  const StatusChip = ({ statut }) => {
    const translatedStatus = translateStatus(statut);
    const color = getStatusColor(statut);
    
    return (
      <Chip
        label={translatedStatus}
        color={color}
        size="small"
        variant="outlined"
      />
    );
  };

  const formatPrice = (price) => {
    if (!price || isNaN(Number(price))) return '';
    return Number(price).toLocaleString('fr-FR') + ' FCFA';
  };

  // ============================================
  // FONCTIONS POUR CHARGER LES DONNÉES
  // ============================================

  const loadCentres = async () => {
    try {
      setLoadingData(true);
      const response = await api.centres.getAll();
      
      if (response.success && response.centres) {
        const centresList = response.centres.map(centre => ({
          COD_CEN: centre.COD_CEN || centre.id,
          NOM_CENTRE: centre.NOM_CENTRE || centre.nom,
          TYPE_CENTRE: centre.TYPE_CENTRE || centre.type,
          ADRESSE: centre.ADRESSE || centre.adresse,
          TELEPHONE: centre.TELEPHONE || centre.telephone
        }));

        setCentres(centresList);
        
        // Sélectionner le premier centre par défaut
        if (centresList.length > 0) {
          setSelectedCentre(centresList[0].COD_CEN);
          setSelectedCentreInfo(centresList[0]);
          await loadPrestatairesByCentre(centresList[0].COD_CEN);
        }
      }
    } catch (err) {
      console.error('Erreur chargement centres:', err);
      setError(t('prescriptions.alerts.errorLoadingCenters'));
    } finally {
      setLoadingData(false);
    }
  };

  const loadPrestatairesByCentre = async (centreId) => {
    if (!centreId) {
      setMedecins([]);
      setSelectedMedecin('');
      return;
    }

    try {
      setLoadingPrestataires(true);
      
      // Utilisation de la même API que dans Consultations
      const filters = {
        page: 1,
        limit: 100,
        type_prestataire: 'MEDECIN',
        actif: '1',
        affectation_active: '1'
      };

      const response = await centresAPI.getPrestatairesByCentre(centreId, filters);
      
      if (response && response.success && response.prestataires) {
        const medecinsList = response.prestataires.map(prestataire => ({
          COD_PRE: prestataire.id || prestataire.COD_PRE,
          NOM_PRESTATAIRE: prestataire.NOM_PRESTATAIRE || prestataire.nom || '',
          PRENOM_PRESTATAIRE: prestataire.PRENOM_PRESTATAIRE || prestataire.prenom || '',
          SPECIALITE: prestataire.SPECIALITE || prestataire.specialite || 'Médecin',
          TELEPHONE: prestataire.TELEPHONE || prestataire.telephone || '',
          EMAIL: prestataire.EMAIL || prestataire.email || '',
          COD_CEN: centreId,
          ACTIF: prestataire.ACTIF !== undefined ? prestataire.ACTIF : (prestataire.actif || 1),
          statut_actif: prestataire.statut_actif || (prestataire.ACTIF === 1 ? 'Actif' : 'Inactif'),
          NOM_COMPLET: `${prestataire.PRENOM_PRESTATAIRE || prestataire.prenom || ''} ${prestataire.NOM_PRESTATAIRE || prestataire.nom || ''}`.trim()
        })).filter(medecin => {
          const isActive = medecin.ACTIF === 1 || medecin.statut_actif === 'Actif';
          const hasId = medecin.COD_PRE && medecin.COD_PRE.toString().trim() !== '';
          return hasId && isActive;
        });

        setMedecins(medecinsList);
        
        if (medecinsList.length > 0) {
          setSelectedMedecin(medecinsList[0].COD_PRE);
        } else {
          setSelectedMedecin('');
          setWarning(t('prescriptions.alerts.noDoctorsForCenter'));
        }
      } else {
        setMedecins([]);
        setSelectedMedecin('');
        setWarning(t('prescriptions.alerts.noDoctorsForCenter'));
      }
    } catch (err) {
      console.error('Erreur chargement médecins:', err);
      setMedecins([]);
      setSelectedMedecin('');
      setError(t('prescriptions.alerts.errorLoadingPrestataires'));
    } finally {
      setLoadingPrestataires(false);
    }
  };

  const handleCentreChange = async (event) => {
    const centreId = event.target.value;
    setSelectedCentre(centreId);
    
    const centreInfo = centres.find(c => c.COD_CEN === centreId);
    setSelectedCentreInfo(centreInfo);
    
    await loadPrestatairesByCentre(centreId);
  };

  const searchPatients = async () => {
    if (!patientSearch || patientSearch.trim().length < 2) {
      setPatients([]);
      return;
    }
    
    try {
      let response;
      if (patientSearchType === 'identifiant') {
        response = await api.beneficiaires.searchAdvanced(patientSearch, {}, 20, 1);
      } else if (patientSearchType === 'nom') {
        response = await api.beneficiaires.searchAdvanced(patientSearch, {}, 20, 1);
      }
      
      if (response && response.success) {
        const patientsList = response.beneficiaires || [];
        setPatients(patientsList.map(p => ({
          id: p.id || p.COD_BEN,
          nom: p.nom || p.NOM_BEN,
          prenom: p.prenom || p.PRE_BEN,
          age: p.age || p.AGE,
          sexe: p.sexe || p.SEX_BEN,
          identifiant: p.identifiant_national || p.IDENTIFIANT_NATIONAL,
          telephone: p.telephone_mobile || p.TELEPHONE_MOBILE,
          statut_ace: p.statut_ace || p.STATUT_ACE
        })));
      }
    } catch (err) {
      console.error('Erreur recherche patients:', err);
      setPatients([]);
    }
  };

  // ============================================
  // ÉTAPES DE CRÉATION DE PRESCRIPTION
  // ============================================

  const PatientSearchStep = () => (
    <Card sx={{ mb: 3, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: theme.palette.primary.main }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            Étape 1: Recherche du patient
          </Box>
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Type de recherche</InputLabel>
              <Select
                value={patientSearchType}
                label="Type de recherche"
                onChange={(e) => setPatientSearchType(e.target.value)}
              >
                <MenuItem value="identifiant">Identifiant</MenuItem>
                <MenuItem value="nom">Nom</MenuItem>
                <MenuItem value="carte">Carte</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Rechercher un patient"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={searchPatients}
              disabled={!patientSearch}
              sx={{ height: '56px' }}
            >
              Rechercher
            </Button>
          </Grid>
        </Grid>

        {patients.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Identifiant</TableCell>
                  <TableCell>Âge</TableCell>
                  <TableCell>Sexe</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                          {p.prenom?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {p.prenom} {p.nom}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {p.telephone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{p.identifiant}</TableCell>
                    <TableCell>{p.age}</TableCell>
                    <TableCell>
                      <Chip
                        label={p.sexe === 'M' ? 'Masculin' : 'Féminin'}
                        size="small"
                        color={p.sexe === 'M' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={p.statut_ace || 'Principal'}
                        size="small"
                        variant="outlined"
                        color="info"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setPatient(p);
                          setCreationStep(2);
                        }}
                      >
                        Sélectionner
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {patient && (
          <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2">
              Patient sélectionné: <strong>{patient.prenom} {patient.nom}</strong>
            </Typography>
            <Typography variant="body2">
              ID: {patient.identifiant} • Âge: {patient.age} • Statut: {patient.statut_ace || 'Principal'}
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setActiveTab(0)}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            disabled={!patient}
            onClick={() => setCreationStep(2)}
            endIcon={<ChevronRightIcon />}
          >
            Suivant
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const CentreAndDoctorStep = () => (
    <Card sx={{ mb: 3, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: theme.palette.primary.main }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CenterIcon />
            Étape 2: Sélection du centre et du médecin
          </Box>
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Centre de santé</InputLabel>
              <Select
                value={selectedCentre}
                label="Centre de santé"
                onChange={handleCentreChange}
                disabled={loadingData}
              >
                <MenuItem value="">
                  <em>Sélectionner un centre</em>
                </MenuItem>
                {centres.map((centre) => (
                  <MenuItem key={centre.COD_CEN} value={centre.COD_CEN}>
                    {centre.NOM_CENTRE}
                  </MenuItem>
                ))}
              </Select>
              {loadingData && (
                <LinearProgress sx={{ mt: 1 }} />
              )}
            </FormControl>

            {selectedCentreInfo && (
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                <Typography variant="subtitle2" gutterBottom>
                  <strong>Centre sélectionné:</strong>
                </Typography>
                <Typography variant="body2">
                  {selectedCentreInfo.NOM_CENTRE}
                </Typography>
                {selectedCentreInfo.ADRESSE && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedCentreInfo.ADRESSE}
                  </Typography>
                )}
                {selectedCentreInfo.TELEPHONE && (
                  <Typography variant="body2" color="text.secondary">
                    Tél: {selectedCentreInfo.TELEPHONE}
                  </Typography>
                )}
              </Card>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Médecin prescripteur</InputLabel>
              <Select
                value={selectedMedecin}
                label="Médecin prescripteur"
                onChange={(e) => setSelectedMedecin(e.target.value)}
                disabled={!selectedCentre || loadingPrestataires}
              >
                <MenuItem value="">
                  <em>Sélectionner un médecin</em>
                </MenuItem>
                {medecins.map((med) => (
                  <MenuItem key={med.COD_PRE} value={med.COD_PRE}>
                    {med.NOM_COMPLET} {med.SPECIALITE ? `- ${med.SPECIALITE}` : ''}
                  </MenuItem>
                ))}
              </Select>
              {loadingPrestataires && (
                <LinearProgress sx={{ mt: 1 }} />
              )}
            </FormControl>

            {selectedMedecin && (
              <Card variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                <Typography variant="subtitle2" gutterBottom>
                  <strong>Médecin sélectionné:</strong>
                </Typography>
                <Typography variant="body2">
                  {medecins.find(m => m.COD_PRE === selectedMedecin)?.NOM_COMPLET}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Spécialité: {medecins.find(m => m.COD_PRE === selectedMedecin)?.SPECIALITE || 'Médecin'}
                </Typography>
              </Card>
            )}
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setCreationStep(1)}
          >
            Retour
          </Button>
          <Button
            variant="contained"
            disabled={!selectedCentre || !selectedMedecin}
            onClick={() => setCreationStep(3)}
            endIcon={<ChevronRightIcon />}
          >
            Suivant
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const PrescriptionDetailsStep = () => (
    <Card sx={{ mb: 3, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: theme.palette.primary.main }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PrescriptionIcon />
            Étape 3: Détails de la prescription
          </Box>
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Type de prescription</InputLabel>
              <Select
                value={typePrestation}
                label="Type de prescription"
                onChange={(e) => setTypePrestation(e.target.value)}
              >
                <MenuItem value="">
                  <em>Sélectionner un type</em>
                </MenuItem>
                {typesPrestation.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {type.icon}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="Date de validité"
              value={dateValidite}
              onChange={setDateValidite}
              renderInput={(params) => (
                <TextField {...params} fullWidth />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Saisir les observations médicales..."
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Détails de la prescription
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant={remplirDetails ? "contained" : "outlined"}
              onClick={() => setRemplirDetails(true)}
              startIcon={<AddIcon />}
            >
              Remplir les détails
            </Button>
            <Button
              variant={!remplirDetails ? "contained" : "outlined"}
              onClick={() => setRemplirDetails(false)}
            >
              Prescription générale
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setCreationStep(2)}
          >
            Retour
          </Button>
          <Button
            variant="contained"
            disabled={!typePrestation}
            onClick={() => remplirDetails ? setCreationStep(4) : setCreationStep(5)}
            endIcon={<ChevronRightIcon />}
          >
            {remplirDetails ? 'Ajouter des éléments' : 'Passer à la validation'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const ItemsStep = () => {
    const calculateTotal = () => {
      return details.reduce((sum, detail) => {
        const quantite = parseFloat(detail.quantite) || 0;
        const prix = parseFloat(detail.prix_unitaire) || 0;
        return sum + (quantite * prix);
      }, 0);
    };

    const addElement = (element) => {
      const newDetail = {
        type_element: element.type || 'medicament',
        cod_element: element.id,
        libelle: element.libelle,
        quantite: 1,
        posologie: '',
        duree_traitement: element.type === 'medicament' ? 7 : null,
        unite: element.type === 'medicament' ? 'Boîte' : 'Unité',
        prix_unitaire: element.prix || 0,
        remboursable: element.remboursable || 1,
        taux_prise_en_charge: 80
      };
      
      setDetails([...details, newDetail]);
      setSearchElementDialog(false);
    };

    const removeElement = (index) => {
      const newDetails = [...details];
      newDetails.splice(index, 1);
      setDetails(newDetails);
    };

    const updateElement = (index, field, value) => {
      const newDetails = [...details];
      if (field === 'quantite' || field === 'prix_unitaire') {
        newDetails[index][field] = Math.max(0, parseFloat(value) || 0);
      } else {
        newDetails[index][field] = value;
      }
      setDetails(newDetails);
    };

    return (
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: theme.palette.primary.main }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MedicationIcon />
              Étape 4: Éléments de prescription
            </Box>
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="subtitle1">
              {details.length} élément(s) ajouté(s)
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setSearchElementDialog(true)}
            >
              Ajouter un élément
            </Button>
          </Box>

          {details.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
              Aucun élément ajouté. Cliquez sur "Ajouter un élément" pour commencer.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Libellé</TableCell>
                    <TableCell align="right">Quantité</TableCell>
                    <TableCell align="right">Prix unitaire</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell width="100px">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {details.map((detail, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{detail.libelle}</Typography>
                          {detail.posologie && (
                            <Typography variant="caption" color="text.secondary">
                              Posologie: {detail.posologie}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          value={detail.quantite}
                          onChange={(e) => updateElement(index, 'quantite', e.target.value)}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          value={detail.prix_unitaire}
                          onChange={(e) => updateElement(index, 'prix_unitaire', e.target.value)}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatPrice(detail.quantite * detail.prix_unitaire)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeElement(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} align="right">
                      <Typography variant="subtitle1" fontWeight="bold">
                        Total:
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="success.main">
                        {formatPrice(calculateTotal())}
                      </Typography>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setCreationStep(3)}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              disabled={details.length === 0}
              onClick={() => setCreationStep(5)}
              endIcon={<ChevronRightIcon />}
            >
              Passer à la validation
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const ValidationStep = () => {
    const createPrescription = async () => {
      if (!patient || !selectedCentre || !selectedMedecin || !typePrestation) {
        setError('Veuillez remplir tous les champs obligatoires');
        return;
      }

      if (remplirDetails && details.length === 0) {
        setError('Veuillez ajouter au moins un élément à la prescription');
        return;
      }

      setLoading(true);
      try {
        const prescriptionData = {
          COD_BEN: patient.id,
          COD_CEN: selectedCentre,
          COD_PRE: selectedMedecin,
          TYPE_PRESTATION: typePrestation,
          OBSERVATIONS: observations,
          DATE_VALIDITE: dateValidite,
          AVEC_DETAILS: remplirDetails ? 1 : 0
        };

        if (remplirDetails) {
          prescriptionData.details = details.map((detail, index) => ({
            TYPE_ELEMENT: detail.type_element,
            COD_ELEMENT: detail.cod_element,
            LIBELLE: detail.libelle,
            QUANTITE: detail.quantite,
            POSOLOGIE: detail.posologie,
            DUREE_TRAITEMENT: detail.duree_traitement,
            UNITE: detail.unite,
            PRIX_UNITAIRE: detail.prix_unitaire,
            REMBOURSABLE: detail.remboursable ? 1 : 0,
            TAUX_PRISE_EN_CHARGE: detail.taux_prise_en_charge,
            ORDRE: index + 1
          }));
        }

        const response = await api.prescriptions.create(prescriptionData);
        
        if (response.success) {
          setSuccess('Prescription créée avec succès !');
          
          // Générer le QR code
          const qrData = {
            numero: response.numero || `PRES-${response.prescriptionId}`,
            patient: `${patient.prenom} ${patient.nom}`,
            date: new Date().toISOString().split('T')[0],
            centre: selectedCentreInfo?.NOM_CENTRE,
            montant: prescriptionData.details?.reduce((sum, d) => sum + (d.QUANTITE * d.PRIX_UNITAIRE), 0) || 0
          };
          
          const qrUrl = await QRCode.toDataURL(JSON.stringify(qrData));
          setQrCodeUrl(qrUrl);
          
          // Préparer les données pour l'impression
          setPrescriptionToPrint({
            ...prescriptionData,
            NUM_PRESCRIPTION: response.numero,
            patient,
            centre: selectedCentreInfo,
            medecin: medecins.find(m => m.COD_PRE === selectedMedecin),
            details: prescriptionData.details || []
          });
          
          setTimeout(() => {
            setShowFeuilleSoins(true);
          }, 1000);
          
          // Réinitialiser le formulaire
          resetCreationForm();
          
        } else {
          setError(response.message || 'Erreur lors de la création');
        }
      } catch (err) {
        console.error('Erreur création prescription:', err);
        setError('Erreur lors de la création de la prescription');
      } finally {
        setLoading(false);
      }
    };

    const calculateTotal = () => {
      if (!remplirDetails) return 0;
      return details.reduce((sum, detail) => {
        const quantite = parseFloat(detail.quantite) || 0;
        const prix = parseFloat(detail.prix_unitaire) || 0;
        return sum + (quantite * prix);
      }, 0);
    };

    return (
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: theme.palette.primary.main }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon />
              Étape 5: Validation
            </Box>
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Patient
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {patient?.prenom} {patient?.nom}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {patient?.identifiant} • Âge: {patient?.age}
                    </Typography>
                  </Box>
                </Box>
              </Card>

              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Centre et médecin
                </Typography>
                <Typography variant="body2">
                  <strong>Centre:</strong> {selectedCentreInfo?.NOM_CENTRE}
                </Typography>
                <Typography variant="body2">
                  <strong>Médecin:</strong> {medecins.find(m => m.COD_PRE === selectedMedecin)?.NOM_COMPLET}
                </Typography>
              </Card>

              <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Détails de la prescription
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {typesPrestation.find(t => t.value === typePrestation)?.label}
                </Typography>
                {dateValidite && (
                  <Typography variant="body2">
                    <strong>Validité:</strong> {formatDateDisplay(dateValidite)}
                  </Typography>
                )}
                {observations && (
                  <Typography variant="body2">
                    <strong>Observations:</strong> {observations}
                  </Typography>
                )}
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Récapitulatif
                </Typography>
                
                {remplirDetails && details.length > 0 ? (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      <strong>Éléments prescrits:</strong>
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                      {details.map((detail, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">
                            {detail.libelle} × {detail.quantite}
                          </Typography>
                          <Typography variant="body2">
                            {formatPrice(detail.quantite * detail.prix_unitaire)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" fontWeight="bold">
                        Total:
                      </Typography>
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        {formatPrice(calculateTotal())}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Prescription générale (sans détails spécifiques)
                  </Alert>
                )}

                <Box sx={{ mt: 3 }}>
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      La validation est irréversible. La prescription sera enregistrée dans le système.
                    </Typography>
                  </Alert>
                </Box>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setCreationStep(remplirDetails ? 4 : 3)}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={createPrescription}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
              sx={{ px: 4 }}
            >
              {loading ? 'Création en cours...' : 'Valider et créer la prescription'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const resetCreationForm = () => {
    setPatient(null);
    setPatientSearch('');
    setPatients([]);
    setSelectedCentre('');
    setSelectedCentreInfo(null);
    setSelectedMedecin('');
    setTypePrestation('');
    setObservations('');
    setDateValidite(null);
    setDetails([]);
    setCreationStep(1);
  };

  // ============================================
  // EFFETS ET INITIALISATION
  // ============================================

  useEffect(() => {
    if (activeTab === 1 && creationStep >= 2) {
      loadCentres();
    }
  }, [activeTab, creationStep]);

  // ============================================
  // RENDU PRINCIPAL
  // ============================================

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                <PrescriptionIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  Prescriptions Médicales
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Gestion complète des prescriptions et ordonnances
                </Typography>
              </Box>
            </Box>
            <Badge color="error" variant="dot">
              <IconButton>
                <NotificationIcon />
              </IconButton>
            </Badge>
          </Box>

          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Tabs
              value={activeTab}
              onChange={(e, v) => {
                setActiveTab(v);
                if (v === 1) {
                  setCreationStep(1);
                  resetCreationForm();
                }
              }}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  py: 2,
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }
              }}
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PrescriptionIcon />
                    Liste des prescriptions
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddIcon />
                    Nouvelle prescription
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ExecuteIcon />
                    Exécution
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReportIcon />
                    Rapports
                  </Box>
                }
              />
            </Tabs>
          </Paper>
        </Box>

        {/* Messages d'alerte */}
        {error && (
          <Fade in={!!error}>
            <Alert 
              severity="error" 
              sx={{ mb: 2, borderRadius: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {success && (
          <Fade in={!!success}>
            <Alert 
              severity="success" 
              sx={{ mb: 2, borderRadius: 2 }}
              onClose={() => setSuccess(null)}
            >
              {success}
            </Alert>
          </Fade>
        )}

        {warning && (
          <Fade in={!!warning}>
            <Alert 
              severity="warning" 
              sx={{ mb: 2, borderRadius: 2 }}
              onClose={() => setWarning(null)}
            >
              {warning}
            </Alert>
          </Fade>
        )}

        {/* Contenu des onglets */}
        {activeTab === 0 && (
          <Box>
            <Card sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterIcon />
                    Filtres de recherche
                  </Box>
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Rechercher"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Statut</InputLabel>
                      <Select
                        value={filters.statut}
                        label="Statut"
                        onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                      >
                        <MenuItem value="">Tous</MenuItem>
                        <MenuItem value="En attente">En attente</MenuItem>
                        <MenuItem value="En cours">En cours</MenuItem>
                        <MenuItem value="Executee">Exécutée</MenuItem>
                        <MenuItem value="Annulee">Annulée</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={filters.type_prestation}
                        label="Type"
                        onChange={(e) => setFilters({ ...filters, type_prestation: e.target.value })}
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
                      onChange={(date) => setFilters({ ...filters, date_debut: date })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => {/* charger prescriptions */}}
                      sx={{ height: '56px' }}
                    >
                      Appliquer
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Tableau des prescriptions */}
            <Card sx={{ borderRadius: 3 }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: 'background.default' }}>
                    <TableRow>
                      <TableCell>N° Prescription</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Montant</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[].map((prescription, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            PRES-{index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              <PersonIcon fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography variant="body2">
                                Jean Dupont
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                35 ans
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label="Pharmacie"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>15/01/2024</TableCell>
                        <TableCell>
                          <StatusChip statut="En attente" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium" color="success.main">
                            25 000 FCFA
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Voir">
                              <IconButton size="small">
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Exécuter">
                              <IconButton size="small" color="primary">
                                <ExecuteIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Imprimer">
                              <IconButton size="small" color="secondary">
                                <PrintIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Indicateur d'étapes */}
            <Box sx={{ mb: 4 }}>
              <Stepper creationStep={creationStep} />
            </Box>

            {/* Contenu de l'étape */}
            {creationStep === 1 && <PatientSearchStep />}
            {creationStep === 2 && <CentreAndDoctorStep />}
            {creationStep === 3 && <PrescriptionDetailsStep />}
            {creationStep === 4 && <ItemsStep />}
            {creationStep === 5 && <ValidationStep />}
          </Box>
        )}

        {activeTab === 2 && (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Exécution de prescription
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  label="N° de prescription"
                  value={prescriptionSearch}
                  onChange={(e) => setPrescriptionSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
                <Button variant="contained" sx={{ minWidth: 120 }}>
                  Rechercher
                </Button>
              </Box>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Recherchez une prescription par son numéro pour l'exécuter
              </Alert>
            </CardContent>
          </Card>
        )}

        {activeTab === 3 && (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Rapports et statistiques
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ textAlign: 'center', p: 3, borderRadius: 2 }}>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      156
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Prescriptions ce mois
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ textAlign: 'center', p: 3, borderRadius: 2 }}>
                    <Typography variant="h4" color="success" fontWeight="bold">
                      142
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Exécutées
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ textAlign: 'center', p: 3, borderRadius: 2 }}>
                    <Typography variant="h4" color="warning" fontWeight="bold">
                      14
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      En attente
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Dialogue de recherche d'éléments */}
        <ElementSearchDialog
          open={searchElementDialog}
          onClose={() => setSearchElementDialog(false)}
          onSelect={addElement}
          search={elementSearch}
          onSearchChange={setElementSearch}
          elements={elements}
        />

        {/* Dialogue d'impression */}
        {showFeuilleSoins && prescriptionToPrint && (
          <PrintDialog
            open={showFeuilleSoins}
            onClose={() => setShowFeuilleSoins(false)}
            prescription={prescriptionToPrint}
            qrCodeUrl={qrCodeUrl}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
};

// Composant Stepper pour les étapes de création
const Stepper = ({ creationStep }) => {
  const steps = [
    { label: 'Patient', icon: <PersonIcon /> },
    { label: 'Centre & Médecin', icon: <CenterIcon /> },
    { label: 'Détails', icon: <PrescriptionIcon /> },
    { label: 'Éléments', icon: <MedicationIcon /> },
    { label: 'Validation', icon: <CheckIcon /> }
  ];

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
      {steps.map((step, index) => (
        <Box key={step.label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: index + 1 <= creationStep ? 'primary.main' : 'action.disabledBackground',
              color: index + 1 <= creationStep ? 'primary.contrastText' : 'action.disabled',
              mb: 1
            }}
          >
            {step.icon}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: index + 1 === creationStep ? 'bold' : 'regular' }}>
            {step.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Étape {index + 1}
          </Typography>
        </Box>
      ))}
      {/* Ligne de connexion */}
      <Box
        sx={{
          position: 'absolute',
          top: 28,
          left: '10%',
          right: '10%',
          height: 2,
          bgcolor: 'divider',
          zIndex: 0
        }}
      />
    </Box>
  );
};

// Composant de recherche d'éléments
// Composant de recherche d'éléments (à garder tel quel ou ajuster si nécessaire)
const ElementSearchDialog = ({ open, onClose, onSelect, search, onSearchChange, elements }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Rechercher un élément
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Rechercher un médicament ou un examen"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Libellé</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Prix</TableCell>
                <TableCell width="100px">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {elements.map((element, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{element.libelle}</Typography>
                      {element.libelle_complet && (
                        <Typography variant="caption" color="text.secondary">
                          {element.libelle_complet}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={element.type === 'medicament' ? 'Médicament' : 'Examen'}
                      size="small"
                      color={element.type === 'medicament' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {element.prix?.toLocaleString()} FCFA
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onSelect(element)} // CORRIGÉ : utilise onSelect
                    >
                      Ajouter
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
      </DialogActions>
    </Dialog>
  );
};

// Composant d'impression
const PrintDialog = ({ open, onClose, prescription, qrCodeUrl }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PrintIcon />
          Fiche de prescription
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ p: 2 }}>
          {/* En-tête */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight="bold" color="primary">
                FICHE DE PRESCRIPTION
              </Typography>
              <Typography variant="body2" color="text.secondary">
                N°: {prescription.NUM_PRESCRIPTION}
              </Typography>
            </Box>
            {qrCodeUrl && (
              <Box sx={{ textAlign: 'center' }}>
                <img src={qrCodeUrl} alt="QR Code" style={{ width: 100, height: 100 }} />
                <Typography variant="caption" display="block">
                  Code de vérification
                </Typography>
              </Box>
            )}
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Informations du patient
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {prescription.patient.prenom} {prescription.patient.nom}
                </Typography>
                <Typography variant="body2">
                  ID: {prescription.patient.identifiant} • Âge: {prescription.patient.age}
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Informations médicales
                </Typography>
                <Typography variant="body2">
                  <strong>Centre:</strong> {prescription.centre?.NOM_CENTRE}
                </Typography>
                <Typography variant="body2">
                  <strong>Médecin:</strong> {prescription.medecin?.NOM_COMPLET}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {new Date().toLocaleDateString('fr-FR')}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Détails de la prescription */}
          {prescription.details && prescription.details.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Détails de la prescription
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Libellé</TableCell>
                      <TableCell align="right">Quantité</TableCell>
                      <TableCell align="right">Posologie</TableCell>
                      <TableCell align="right">Prix unitaire</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prescription.details.map((detail, index) => (
                      <TableRow key={index}>
                        <TableCell>{detail.LIBELLE}</TableCell>
                        <TableCell align="right">{detail.QUANTITE} {detail.UNITE}</TableCell>
                        <TableCell align="right">{detail.POSOLOGIE}</TableCell>
                        <TableCell align="right">
                          {detail.PRIX_UNITAIRE?.toLocaleString()} FCFA
                        </TableCell>
                        <TableCell align="right">
                          {(detail.QUANTITE * detail.PRIX_UNITAIRE).toLocaleString()} FCFA
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Observations */}
          {prescription.OBSERVATIONS && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Observations
              </Typography>
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body2">
                  {prescription.OBSERVATIONS}
                </Typography>
              </Card>
            </Box>
          )}

          {/* Signatures */}
          <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={4}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" gutterBottom>
                    Le Médecin Prescripteur
                  </Typography>
                  <Box sx={{ height: 60, borderBottom: 1, borderColor: 'text.primary', mb: 1 }} />
                  <Typography variant="caption">
                    {prescription.medecin?.NOM_COMPLET}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" gutterBottom>
                    Cachet et signature
                  </Typography>
                  <Box sx={{ height: 60, borderBottom: 1, borderColor: 'text.primary', mb: 1 }} />
                  <Typography variant="caption">
                    Centre: {prescription.centre?.NOM_CENTRE}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={() => window.print()}
        >
          Imprimer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Prescriptions;