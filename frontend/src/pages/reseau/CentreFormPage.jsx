// src/pages/centres-sante/CentreFormPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Divider,
  Alert,
  AlertTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Autocomplete,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  MedicalServices as MedicalIcon,
  Bed as BedIcon,
  Emergency as EmergencyIcon,
  Devices as DevicesIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { centresAPI, paysAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CentreFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const isEditMode = !!id;

  // États du formulaire
  const [formData, setFormData] = useState({
    // Informations de base
    nom: '',
    code: '',
    type: '',
    categorie: '',
    statut: 'Actif',
    
    // Localisation
    adresse: '',
    ville: '',
    region: '',
    code_postal: '',
    cod_pay: 'FR',
    coordonnees_gps: '',
    
    // Contact
    telephone: '',
    telephone_urgence: '',
    fax: '',
    email: '',
    email_secretariat: '',
    site_web: '',
    
    // Direction
    directeur: '',
    poste_directeur: '',
    
    // Capacités
    capacite_lits: 0,
    capacite_urgences: 0,
    capacite_consultations_jour: 0,
    
    // Horaires
    horaires_ouverture: '08:00',
    horaires_fermeture: '18:00',
    jours_ouverture: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
    urgences_24h: false,
    horaires_urgences: '',
    
    // Services
    services: [],
    equipements: [],
    
    // Classification
    grade: '',
    accreditations: [],
    
    // Financier
    tarif_consultation: 0,
    tarif_urgence: 0,
    
    // Notes
    notes: ''
  });

  const [newService, setNewService] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [newAccreditation, setNewAccreditation] = useState('');

  // États UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [pays, setPays] = useState([]);

  // Chargement des données
  useEffect(() => {
    const loadData = async () => {
      if (isEditMode) {
        setLoading(true);
        try {
          const response = await centresAPI.getById(id);
          if (response.success && response.data) {
            setFormData({
              nom: response.data.nom || response.data.NOM_CENTRE || '',
              code: response.data.code || response.data.CODE_CENTRE || '',
              type: response.data.type || response.data.TYPE_CENTRE || '',
              categorie: response.data.categorie || response.data.CATEGORIE_CENTRE || '',
              statut: response.data.statut || response.data.STATUT || 'Actif',
              
              adresse: response.data.adresse || response.data.ADRESSE || '',
              ville: response.data.ville || response.data.VILLE || '',
              region: response.data.region || response.data.REGION || '',
              code_postal: response.data.code_postal || '',
              cod_pay: response.data.cod_pay || 'FR',
              coordonnees_gps: response.data.coordonnees_gps || '',
              
              telephone: response.data.telephone || response.data.TELEPHONE || '',
              telephone_urgence: response.data.telephone_urgence || '',
              fax: response.data.fax || '',
              email: response.data.email || response.data.EMAIL || '',
              email_secretariat: response.data.email_secretariat || '',
              site_web: response.data.site_web || '',
              
              directeur: response.data.directeur || '',
              poste_directeur: response.data.poste_directeur || '',
              
              capacite_lits: response.data.capacite_lits || 0,
              capacite_urgences: response.data.capacite_urgences || 0,
              capacite_consultations_jour: response.data.capacite_consultations_jour || 0,
              
              horaires_ouverture: response.data.horaires_ouverture || '08:00',
              horaires_fermeture: response.data.horaires_fermeture || '18:00',
              jours_ouverture: response.data.jours_ouverture || ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
              urgences_24h: response.data.urgences_24h || false,
              horaires_urgences: response.data.horaires_urgences || '',
              
              services: response.data.services || [],
              equipements: response.data.equipements || [],
              
              grade: response.data.grade || '',
              accreditations: response.data.accreditations || [],
              
              tarif_consultation: response.data.tarif_consultation || 0,
              tarif_urgence: response.data.tarif_urgence || 0,
              
              notes: response.data.notes || ''
            });
          } else {
            throw new Error(response.message || 'Centre non trouvé');
          }
        } catch (error) {
          console.error('❌ Erreur chargement centre:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      }

      // Charger la liste des pays
      try {
        const paysResponse = await paysAPI.getAll();
        if (paysResponse.success) {
          setPays(paysResponse.pays || []);
        }
      } catch (error) {
        console.error('❌ Erreur chargement pays:', error);
      }
    };

    loadData();
  }, [id, isEditMode]);

  // Gestionnaires
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddService = () => {
    if (newService.trim()) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, newService.trim()]
      }));
      setNewService('');
    }
  };

  const handleRemoveService = (index) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const handleAddEquipment = () => {
    if (newEquipment.trim()) {
      setFormData(prev => ({
        ...prev,
        equipements: [...prev.equipements, newEquipment.trim()]
      }));
      setNewEquipment('');
    }
  };

  const handleRemoveEquipment = (index) => {
    setFormData(prev => ({
      ...prev,
      equipements: prev.equipements.filter((_, i) => i !== index)
    }));
  };

  const handleAddAccreditation = () => {
    if (newAccreditation.trim()) {
      setFormData(prev => ({
        ...prev,
        accreditations: [...prev.accreditations, newAccreditation.trim()]
      }));
      setNewAccreditation('');
    }
  };

  const handleRemoveAccreditation = (index) => {
    setFormData(prev => ({
      ...prev,
      accreditations: prev.accreditations.filter((_, i) => i !== index)
    }));
  };

  const handleJoursOuvertureChange = (jours) => {
    setFormData(prev => ({
      ...prev,
      jours_ouverture: jours
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validation
      if (!formData.nom.trim()) {
        throw new Error('Le nom du centre est obligatoire');
      }
      if (!formData.type.trim()) {
        throw new Error('Le type de centre est obligatoire');
      }
      if (!formData.adresse.trim()) {
        throw new Error('L\'adresse est obligatoire');
      }
      if (!formData.ville.trim()) {
        throw new Error('La ville est obligatoire');
      }

      const dataToSend = { ...formData };

      let response;
      if (isEditMode) {
        response = await centresAPI.update(id, dataToSend);
      } else {
        response = await centresAPI.create(dataToSend);
      }

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/centres-sante/${isEditMode ? id : response.data.id}`);
        }, 1500);
      } else {
        throw new Error(response.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Étapes du formulaire
  const steps = [
    'Informations de base',
    'Localisation',
    'Capacités et horaires',
    'Services et équipements',
    'Finalisation'
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
  };

  // Options pour les sélecteurs
  const typesCentre = [
    'Hôpital',
    'Clinique',
    'Centre de santé',
    'Dispensaire',
    'Centre médical',
    'Polyclinique',
    'Urgences',
    'Maternité',
    'Laboratoire'
  ];

  const categoriesCentre = [
    'Public',
    'Privé',
    'Associatif',
    'Universitaire',
    'Militaire'
  ];

  const statutsCentre = [
    'Actif',
    'Inactif',
    'En construction',
    'En rénovation',
    'Fermé temporairement'
  ];

  const joursSemaine = [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
    'Dimanche'
  ];

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 3, color: 'text.secondary' }}>
          Chargement du centre...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Navigation */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/centres-sante')}
          sx={{ mb: 2 }}
        >
          Retour à la liste
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {isEditMode ? 'Modifier le centre' : 'Nouveau centre de santé'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEditMode
            ? 'Modifiez les informations du centre de santé'
            : 'Créez un nouveau centre de santé'}
        </Typography>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>
                <Button
                  onClick={() => handleStepClick(index)}
                  disabled={saving}
                  sx={{ textTransform: 'none' }}
                >
                  {label}
                </Button>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Messages d'état */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Erreur</AlertTitle>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>Succès</AlertTitle>
          {isEditMode
            ? 'Centre mis à jour avec succès'
            : 'Centre créé avec succès'}
        </Alert>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3 }}>
          {/* Étape 1: Informations de base */}
          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  <MedicalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Informations de base
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Nom du centre"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  disabled={saving}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Code du centre"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  disabled={saving}
                  helperText="Code interne d'identification"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Type de centre</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    label="Type de centre"
                    disabled={saving}
                  >
                    <MenuItem value="">Sélectionnez un type</MenuItem>
                    {typesCentre.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Catégorie</InputLabel>
                  <Select
                    name="categorie"
                    value={formData.categorie}
                    onChange={handleChange}
                    label="Catégorie"
                    disabled={saving}
                  >
                    <MenuItem value="">Sélectionnez une catégorie</MenuItem>
                    {categoriesCentre.map((categorie) => (
                      <MenuItem key={categorie} value={categorie}>
                        {categorie}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    label="Statut"
                    disabled={saving}
                  >
                    {statutsCentre.map((statut) => (
                      <MenuItem key={statut} value={statut}>
                        {statut}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  disabled={saving}
                  helperText="Niveau de classification (ex: CHU, CHR, CHG)"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Directeur"
                  name="directeur"
                  value={formData.directeur}
                  onChange={handleChange}
                  disabled={saving}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Poste du directeur"
                  name="poste_directeur"
                  value={formData.poste_directeur}
                  onChange={handleChange}
                  disabled={saving}
                />
              </Grid>
            </Grid>
          )}

          {/* Étape 2: Localisation */}
          {activeStep === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Localisation
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Adresse"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  disabled={saving}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Ville"
                  name="ville"
                  value={formData.ville}
                  onChange={handleChange}
                  disabled={saving}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Code postal"
                  name="code_postal"
                  value={formData.code_postal}
                  onChange={handleChange}
                  disabled={saving}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Région"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  disabled={saving}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Pays</InputLabel>
                  <Select
                    name="cod_pay"
                    value={formData.cod_pay}
                    onChange={handleChange}
                    label="Pays"
                    disabled={saving}
                  >
                    {pays.map((paysItem) => (
                      <MenuItem key={paysItem.COD_PAY} value={paysItem.COD_PAY}>
                        {paysItem.LIB_PAY}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Coordonnées GPS"
                  name="coordonnees_gps"
                  value={formData.coordonnees_gps}
                  onChange={handleChange}
                  disabled={saving}
                  helperText="Format: latitude,longitude"
                  placeholder="48.8566,2.3522"
                />
              </Grid>
            </Grid>
          )}

          {/* Étape 3: Capacités et horaires */}
          {activeStep === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  <BedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Capacités
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Capacité lits"
                  name="capacite_lits"
                  value={formData.capacite_lits}
                  onChange={handleChange}
                  disabled={saving}
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Capacité urgences"
                  name="capacite_urgences"
                  value={formData.capacite_urgences}
                  onChange={handleChange}
                  disabled={saving}
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Capacité consultations/jour"
                  name="capacite_consultations_jour"
                  value={formData.capacite_consultations_jour}
                  onChange={handleChange}
                  disabled={saving}
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Horaires d'ouverture
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Heure d'ouverture"
                  name="horaires_ouverture"
                  value={formData.horaires_ouverture}
                  onChange={handleChange}
                  disabled={saving}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Heure de fermeture"
                  name="horaires_fermeture"
                  value={formData.horaires_fermeture}
                  onChange={handleChange}
                  disabled={saving}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Autocomplete
                    multiple
                    options={joursSemaine}
                    value={formData.jours_ouverture}
                    onChange={(event, newValue) => handleJoursOuvertureChange(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Jours d'ouverture"
                        placeholder="Sélectionnez les jours"
                      />
                    )}
                    disabled={saving}
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="urgences_24h"
                      checked={formData.urgences_24h}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  }
                  label="Urgences 24h/24"
                />
              </Grid>
              
              {!formData.urgences_24h && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Horaires urgences"
                    name="horaires_urgences"
                    value={formData.horaires_urgences}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="ex: 08h-20h, samedi 08h-12h"
                  />
                </Grid>
              )}
            </Grid>
          )}

          {/* Étape 4: Services et équipements */}
          {activeStep === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  <WorkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Services offerts
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Ajouter un service"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    disabled={saving}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddService();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddService}
                    disabled={!newService.trim() || saving}
                    startIcon={<AddIcon />}
                  >
                    Ajouter
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {formData.services.map((service, index) => (
                    <Chip
                      key={index}
                      label={service}
                      onDelete={() => handleRemoveService(index)}
                      disabled={saving}
                    />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  <DevicesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Équipements
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Ajouter un équipement"
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    disabled={saving}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEquipment();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddEquipment}
                    disabled={!newEquipment.trim() || saving}
                    startIcon={<AddIcon />}
                  >
                    Ajouter
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {formData.equipements.map((equipement, index) => (
                    <Chip
                      key={index}
                      label={equipement}
                      onDelete={() => handleRemoveEquipment(index)}
                      disabled={saving}
                    />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Accréditations
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Ajouter une accréditation"
                    value={newAccreditation}
                    onChange={(e) => setNewAccreditation(e.target.value)}
                    disabled={saving}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAccreditation();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddAccreditation}
                    disabled={!newAccreditation.trim() || saving}
                    startIcon={<AddIcon />}
                  >
                    Ajouter
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.accreditations.map((accreditation, index) => (
                    <Chip
                      key={index}
                      label={accreditation}
                      color="primary"
                      variant="outlined"
                      onDelete={() => handleRemoveAccreditation(index)}
                      disabled={saving}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Étape 5: Contact et finalisation */}
          {activeStep === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  <PhoneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Contact
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Téléphone principal"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  disabled={saving}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Téléphone urgences"
                  name="telephone_urgence"
                  value={formData.telephone_urgence}
                  onChange={handleChange}
                  disabled={saving}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmergencyIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fax"
                  name="fax"
                  value={formData.fax}
                  onChange={handleChange}
                  disabled={saving}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email principal"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={saving}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email secrétariat"
                  name="email_secretariat"
                  value={formData.email_secretariat}
                  onChange={handleChange}
                  disabled={saving}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Site web"
                  name="site_web"
                  value={formData.site_web}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="https://www.exemple.com"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Tarifs
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tarif consultation standard"
                  name="tarif_consultation"
                  value={formData.tarif_consultation}
                  onChange={handleChange}
                  disabled={saving}
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                    startAdornment: (
                      <InputAdornment position="start">€</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tarif urgences"
                  name="tarif_urgence"
                  value={formData.tarif_urgence}
                  onChange={handleChange}
                  disabled={saving}
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                    startAdornment: (
                      <InputAdornment position="start">€</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Notes et observations
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={saving}
                  helperText="Informations complémentaires sur le centre"
                />
              </Grid>
            </Grid>
          )}

          {/* Navigation entre étapes */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0 || saving}
              startIcon={<ArrowBackIcon />}
            >
              Retour
            </Button>
            
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={saving}
              >
                Suivant
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {saving ? 'Enregistrement...' : isEditMode ? 'Mettre à jour' : 'Créer le centre'}
              </Button>
            )}
          </Box>
        </Paper>
      </form>
    </Container>
  );
};

export default CentreFormPage;