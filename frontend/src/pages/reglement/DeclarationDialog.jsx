// DeclarationDialog.jsx - Composant pour créer/éditer des déclarations
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  IconButton,
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
  Paper,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Tooltip,
  Autocomplete,
  Chip,
  Divider,
  InputAdornment,
  Slider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AttachMoney as MoneyIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Medication as MedicationIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { facturationAPI } from '../../services/api';

// Composant pour une ligne de prestation
const PrestationRow = ({ prestation, index, onUpdate, onRemove, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrestation, setEditedPrestation] = useState(prestation);

  const handleSave = () => {
    onUpdate(index, editedPrestation);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPrestation(prestation);
    setIsEditing(false);
  };

  const total = (prestation.quantite || 0) * (prestation.prix_unitaire || 0);

  return (
    <TableRow>
      {isEditing ? (
        <>
          <TableCell>
            <TextField
              size="small"
              fullWidth
              value={editedPrestation.libelle || ''}
              onChange={(e) => setEditedPrestation(prev => ({ ...prev, libelle: e.target.value }))}
              placeholder="Libellé"
            />
          </TableCell>
          <TableCell>
            <TextField
              size="small"
              type="number"
              value={editedPrestation.quantite || 1}
              onChange={(e) => setEditedPrestation(prev => ({ 
                ...prev, 
                quantite: parseInt(e.target.value) || 1 
              }))}
              inputProps={{ min: 1 }}
              sx={{ width: 80 }}
            />
          </TableCell>
          <TableCell>
            <TextField
              size="small"
              type="number"
              value={editedPrestation.prix_unitaire || 0}
              onChange={(e) => setEditedPrestation(prev => ({ 
                ...prev, 
                prix_unitaire: parseFloat(e.target.value) || 0 
              }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">FCFA</InputAdornment>,
              }}
              sx={{ width: 120 }}
            />
          </TableCell>
          <TableCell align="right">
            {total.toLocaleString('fr-FR')} FCFA
          </TableCell>
          <TableCell>
            <Box display="flex" gap={1}>
              <Button size="small" variant="contained" onClick={handleSave}>
                Valider
              </Button>
              <Button size="small" variant="outlined" onClick={handleCancel}>
                Annuler
              </Button>
            </Box>
          </TableCell>
        </>
      ) : (
        <>
          <TableCell>
            <Box display="flex" alignItems="center" gap={1}>
              {prestation.type === 'medicament' ? (
                <MedicationIcon fontSize="small" color="primary" />
              ) : (
                <HospitalIcon fontSize="small" color="secondary" />
              )}
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {prestation.libelle || prestation.nom}
                </Typography>
                {prestation.code && (
                  <Typography variant="caption" color="text.secondary">
                    Code: {prestation.code}
                  </Typography>
                )}
              </Box>
            </Box>
          </TableCell>
          <TableCell>{prestation.quantite || 1}</TableCell>
          <TableCell>{prestation.prix_unitaire?.toLocaleString('fr-FR') || '0'} FCFA</TableCell>
          <TableCell align="right">
            <Typography fontWeight="bold">
              {total.toLocaleString('fr-FR')} FCFA
            </Typography>
          </TableCell>
          <TableCell>
            <Box display="flex" gap={1}>
              <Tooltip title="Modifier">
                <IconButton size="small" onClick={() => setIsEditing(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Supprimer">
                <IconButton size="small" color="error" onClick={() => onRemove(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </TableCell>
        </>
      )}
    </TableRow>
  );
};

const DeclarationDialog = ({ 
  open, 
  mode, 
  data, 
  onClose, 
  onSubmit, 
  loading,
  formatCurrency,
  DialogPaperProps,
  DialogTitleProps,
  DialogContentProps,
  DialogActionsProps
}) => {
  // États pour le formulaire
  const [formData, setFormData] = useState({
    patient_id: '',
    nom_ben: '',
    prenom_ben: '',
    identifiant_ben: '',
    date_facture: new Date(),
    date_echeance: addDays(new Date(), 30),
    cod_payeur: '',
    prestations: [],
    observations: ''
  });

  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // États pour la recherche de prestations
  const [prestationSearch, setPrestationSearch] = useState('');
  const [prestationResults, setPrestationResults] = useState([]);
  const [prestationLoading, setPrestationLoading] = useState(false);

  // États pour les payeurs
  const [payeurs, setPayeurs] = useState([]);
  const [payeursLoading, setPayeursLoading] = useState(false);

  // États pour les erreurs
  const [errors, setErrors] = useState({});

  // Calculer le total
  const totalAmount = formData.prestations.reduce((sum, p) => {
    return sum + ((p.quantite || 1) * (p.prix_unitaire || 0));
  }, 0);

  // Charger les payeurs au montage
  useEffect(() => {
    const loadPayeurs = async () => {
      try {
        setPayeursLoading(true);
        const response = await facturationAPI.getPayeurs();
        if (response.success) {
          setPayeurs(response.payeurs || []);
        }
      } catch (error) {
        console.error('Erreur chargement payeurs:', error);
      } finally {
        setPayeursLoading(false);
      }
    };

    if (open) {
      loadPayeurs();
    }
  }, [open]);

  // Initialiser les données si en mode édition
 // Dans le useEffect d'initialisation
useEffect(() => {
  if (mode === 'edit' && data) {
    setFormData({
      patient_id: data.patient_id || data.COD_BEN || data.cod_ben || '',
      nom_ben: data.nom_ben || data.NOM_BEN || '',
      prenom_ben: data.prenom_ben || data.PRE_BEN || '',
      identifiant_ben: data.identifiant_ben || data.IDENTIFIANT_NATIONAL || '',
      date_facture: data.date_facture ? new Date(data.date_facture) : new Date(),
      date_echeance: data.date_echeance ? new Date(data.date_echeance) : addDays(new Date(), 30),
      // CORRECTION: S'assurer que cod_payeur est une chaîne pour le Select
      cod_payeur: data.cod_payeur ? data.cod_payeur.toString() : data.COD_PAYEUR ? data.COD_PAYEUR.toString() : '',
      prestations: data.prestations || [],
      observations: data.observations || ''
    });
  } else if (open) {
    // Réinitialiser pour la création
    setFormData({
      patient_id: '',
      nom_ben: '',
      prenom_ben: '',
      identifiant_ben: '',
      date_facture: new Date(),
      date_echeance: addDays(new Date(), 30),
      cod_payeur: '', // Laisser comme chaîne vide
      prestations: [],
      observations: ''
    });
    setSearchTerm('');
    setPrestationSearch('');
  }
}, [mode, data, open]);

  // Recherche de patients
  const handlePatientSearch = async (searchValue) => {
    setSearchTerm(searchValue);
    
    if (!searchValue || searchValue.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await facturationAPI.searchPatients(searchValue, 10);
      
      if (response.success && response.patients) {
        setSearchResults(response.patients);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Erreur recherche patient:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Recherche de prestations
  const handlePrestationSearch = async (searchValue) => {
    setPrestationSearch(searchValue);
    
    if (!searchValue || searchValue.length < 2) {
      setPrestationResults([]);
      return;
    }

    try {
      setPrestationLoading(true);
      const response = await facturationAPI.searchPrestations(searchValue, 10);
      
      if (response.success && response.prestations) {
        setPrestationResults(response.prestations);
      } else {
        setPrestationResults([]);
      }
    } catch (error) {
      console.error('Erreur recherche prestation:', error);
      setPrestationResults([]);
    } finally {
      setPrestationLoading(false);
    }
  };

  // Sélectionner un patient
  const handleSelectPatient = (patient) => {
    setFormData(prev => ({
      ...prev,
      patient_id: patient.id,
      nom_ben: patient.nom,
      prenom_ben: patient.prenom,
      identifiant_ben: patient.identifiant,
    }));
    setSearchTerm(`${patient.nom} ${patient.prenom}`);
    setSearchResults([]);
  };

  // Ajouter une prestation
  const handleAddPrestation = (prestation) => {
    const newPrestation = {
      id: prestation.id,
      type: prestation.type || 'medicament',
      libelle: prestation.libelle || prestation.nom,
      code: prestation.code,
      quantite: 1,
      prix_unitaire: prestation.prix || prestation.prix_unitaire || 0,
      libelle_complet: prestation.libelle_complet || prestation.libelle || prestation.nom
    };

    setFormData(prev => ({
      ...prev,
      prestations: [...prev.prestations, newPrestation]
    }));
    setPrestationSearch('');
    setPrestationResults([]);
  };

  // Mettre à jour une prestation
  const handleUpdatePrestation = (index, updatedPrestation) => {
    setFormData(prev => {
      const newPrestations = [...prev.prestations];
      newPrestations[index] = updatedPrestation;
      return { ...prev, prestations: newPrestations };
    });
  };

  // Supprimer une prestation
  const handleRemovePrestation = (index) => {
    setFormData(prev => {
      const newPrestations = prev.prestations.filter((_, i) => i !== index);
      return { ...prev, prestations: newPrestations };
    });
  };

  // Valider le formulaire
 const validateForm = () => {
  const newErrors = {};

  if (!formData.patient_id) {
    newErrors.patient = 'Veuillez sélectionner un patient';
  }

  if (!formData.cod_payeur) {
    newErrors.payeur = 'Veuillez sélectionner un payeur';
  } else {
    // Vérifier que le payeur existe dans la liste
    const selectedPayeur = payeurs.find(p => p.cod_payeur.toString() === formData.cod_payeur.toString());
    if (!selectedPayeur) {
      newErrors.payeur = 'Payeur invalide';
    }
  }

  if (!formData.date_facture) {
    newErrors.date_facture = 'Veuillez sélectionner une date de déclaration';
  }

  if (!formData.date_echeance) {
    newErrors.date_echeance = 'Veuillez sélectionner une date d\'échéance';
  }

  if (formData.prestations.length === 0) {
    newErrors.prestations = 'Veuillez ajouter au moins une prestation';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  // Soumettre le formulaire
  // Modifier la fonction handleSubmit
const handleSubmit = () => {
  if (!validateForm()) {
    return;
  }

  // Préparer les données pour l'API
  const submissionData = {
    // CORRECTION: Utiliser cod_ben au lieu de patient_id
    cod_ben: formData.patient_id,
    // CORRECTION: Assurer que cod_payeur est un nombre
    cod_payeur: parseInt(formData.cod_payeur) || formData.cod_payeur,
    
    // CORRECTION: Formater correctement les prestations
    prestations: formData.prestations.map(p => ({
      id_prestation: p.id,
      type_prestation: p.type || 'medicament',
      libelle: p.libelle || p.nom || p.libelle_complet,
      quantite: p.quantite || 1,
      prix_unitaire: p.prix_unitaire || p.prix || 0,
      // CORRECTION: Calculer le montant pour chaque prestation
      montant: (p.quantite || 1) * (p.prix_unitaire || p.prix || 0)
    })),
    
    date_facture: formData.date_facture,
    date_echeance: formData.date_echeance,
    observations: formData.observations,
    // CORRECTION: Le backend calcule montant_total lui-même
    // Ne pas envoyer montant_total ici
    statut: 'Soumis'
  };

  // Debug: afficher les données envoyées
  console.log('📤 Données envoyées à l\'API:', submissionData);
  console.log('🔍 Détails bénéficiaire:', {
    cod_ben: formData.patient_id,
    nom_ben: formData.nom_ben,
    prenom_ben: formData.prenom_ben
  });
  console.log('🔍 Détails payeur:', {
    cod_payeur: formData.cod_payeur,
    payeur_selected: payeurs.find(p => p.cod_payeur == formData.cod_payeur)
  });

  onSubmit(submissionData);
};

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      {...DialogPaperProps}
    >
      <DialogTitle {...DialogTitleProps}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {mode === 'create' ? 'Nouvelle déclaration' : 'Modifier la déclaration'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent {...DialogContentProps}>
        <Grid container spacing={3}>
          {/* Section Informations patient */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon />
                Informations du bénéficiaire
              </Box>
            </Typography>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    freeSolo
                    options={searchResults}
                    loading={searchLoading}
                    onInputChange={(_, value) => handlePatientSearch(value)}
                    onChange={(_, value) => {
                      if (value && typeof value === 'object') {
                        handleSelectPatient(value);
                      }
                    }}
                    getOptionLabel={(option) => 
                      typeof option === 'string' 
                        ? option 
                        : `${option.nom} ${option.prenom}${option.identifiant ? ` (${option.identifiant})` : ''}`
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Rechercher un patient"
                        placeholder="Nom, prénom ou identifiant"
                        error={!!errors.patient}
                        helperText={errors.patient}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <SearchIcon />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography variant="body1">
                            {option.nom} {option.prenom}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.identifiant} • {option.age ? `${option.age} ans` : 'Âge non spécifié'}
                          </Typography>
                        </Box>
                      </li>
                    )}
                  />
                </Grid>

                {formData.nom_ben && (
                  <Grid item xs={12}>
                    <Alert severity="info" icon={false}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography fontWeight="bold">
                            {formData.nom_ben} {formData.prenom_ben}
                          </Typography>
                          <Typography variant="body2">
                            Identifiant: {formData.identifiant_ben}
                          </Typography>
                        </Box>
                        <Chip 
                          label="Sélectionné" 
                          color="success" 
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Section Dates et Payeur */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              Paramètres de la déclaration
            </Typography>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
                    <DatePicker
                      label="Date de déclaration"
                      value={formData.date_facture}
                      onChange={(date) => setFormData(prev => ({ ...prev, date_facture: date }))}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          fullWidth 
                          error={!!errors.date_facture}
                          helperText={errors.date_facture}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
                    <DatePicker
                      label="Date d'échéance"
                      value={formData.date_echeance}
                      onChange={(date) => setFormData(prev => ({ ...prev, date_echeance: date }))}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          fullWidth 
                          error={!!errors.date_echeance}
                          helperText={errors.date_echeance}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth error={!!errors.payeur}>
                    <InputLabel>Payeur</InputLabel>
                    <Select
                      value={formData.cod_payeur}
                      label="Payeur"
                      onChange={(e) => setFormData(prev => ({ ...prev, cod_payeur: e.target.value }))}
                      disabled={payeursLoading}
                    >
                      {payeursLoading ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} /> Chargement...
                        </MenuItem>
                      ) : (
                        payeurs.map((payeur) => (
                          <MenuItem key={payeur.cod_payeur} value={payeur.cod_payeur}>
                            {payeur.libelle}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {errors.payeur && (
                      <Typography variant="caption" color="error">
                        {errors.payeur}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Observations"
                    multiline
                    rows={2}
                    fullWidth
                    value={formData.observations}
                    onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Notes supplémentaires..."
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Section Prestations */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="primary">
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                  <HospitalIcon />
                  Prestations
                </Box>
                <Typography variant="body1" fontWeight="bold">
                  Total: {totalAmount.toLocaleString('fr-FR')} FCFA
                </Typography>
              </Box>
            </Typography>

            {errors.prestations && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.prestations}
              </Alert>
            )}

            {/* Recherche de prestations */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Autocomplete
                freeSolo
                options={prestationResults}
                loading={prestationLoading}
                onInputChange={(_, value) => handlePrestationSearch(value)}
                onChange={(_, value) => {
                  if (value && typeof value === 'object') {
                    handleAddPrestation(value);
                  }
                }}
                inputValue={prestationSearch}
                getOptionLabel={(option) => 
                  typeof option === 'string' 
                    ? option 
                    : `${option.libelle || option.nom}${option.prix ? ` - ${option.prix.toLocaleString('fr-FR')} FCFA` : ''}`
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Ajouter une prestation"
                    placeholder="Rechercher un médicament, une affection..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Box>
                        <Typography variant="body1">
                          {option.libelle || option.nom}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.type === 'medicament' ? 'Médicament' : 'Affection'} • {option.code || 'Sans code'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {option.prix?.toLocaleString('fr-FR') || '0'} FCFA
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Paper>

            {/* Liste des prestations */}
            {formData.prestations.length > 0 ? (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="40%">Prestation</TableCell>
                      <TableCell width="15%">Quantité</TableCell>
                      <TableCell width="20%">Prix unitaire</TableCell>
                      <TableCell width="15%" align="right">Total</TableCell>
                      <TableCell width="10%">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.prestations.map((prestation, index) => (
                      <PrestationRow
                        key={`${prestation.id}-${index}`}
                        prestation={prestation}
                        index={index}
                        onUpdate={handleUpdatePrestation}
                        onRemove={handleRemovePrestation}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Aucune prestation ajoutée. Recherchez et ajoutez des prestations ci-dessus.
                </Typography>
              </Paper>
            )}
          </Grid>

          {/* Résumé */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>
                Récapitulatif
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Nombre de prestations:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body2">
                    {formData.prestations.length}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Montant total:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="h6" color="primary">
                    {totalAmount.toLocaleString('fr-FR')} FCFA
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date de déclaration:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body2">
                    {format(formData.date_facture, 'dd/MM/yyyy')}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date d'échéance:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body2">
                    {format(formData.date_echeance, 'dd/MM/yyyy')}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions {...DialogActionsProps}>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading || formData.prestations.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Traitement...' : mode === 'create' ? 'Créer la déclaration' : 'Mettre à jour'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeclarationDialog;