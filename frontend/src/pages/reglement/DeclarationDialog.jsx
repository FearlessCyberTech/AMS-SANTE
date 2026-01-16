import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Autocomplete,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
  MedicalServices as MedicalServicesIcon
} from '@mui/icons-material';
import { prestationsAPI } from '../../services/api';

const DeclarationDialog = ({ open, mode, onClose, onSubmit, loading, beneficiaires }) => {
  const [formData, setFormData] = useState({
    cod_ben: '',
    nom_ben: '',
    prenom_ben: '',
    type_declarant: 'Beneficiaire',
    prestations: [],
    observations: '',
    pieces_jointes: '',
    montant_total: 0
  });

  const [availablePrestations, setAvailablePrestations] = useState([]);
  const [loadingPrestations, setLoadingPrestations] = useState(false);
  const [selectedPrestation, setSelectedPrestation] = useState(null);
  const [typesPrestations, setTypesPrestations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Charger les types de prestations
  useEffect(() => {
    const loadTypesPrestations = async () => {
      try {
        const response = await prestationsAPI.getTypesPrestations();
        if (response.success) {
          setTypesPrestations(response.types_prestations || []);
        }
      } catch (error) {
        console.error('Erreur chargement types prestations:', error);
      }
    };
    loadTypesPrestations();
  }, []);

  // Charger les prestations disponibles lorsque le bénéficiaire est sélectionné
  useEffect(() => {
    const loadAvailablePrestations = async () => {
      if (!formData.cod_ben) {
        setAvailablePrestations([]);
        return;
      }

      setLoadingPrestations(true);
      try {
        const filters = {};
        if (filterType !== 'all') {
          filters.type = filterType;
        }
        if (searchTerm) {
          filters.search = searchTerm;
        }

        const response = await prestationsAPI.getPrestationsByBeneficiaire(formData.cod_ben, filters);
        
        if (response.success) {
          // Filtrer les prestations déjà sélectionnées
          const selectedIds = formData.prestations.map(p => p.COD_PREST || p.id);
          const filtered = (response.prestations || []).filter(
            prestation => !selectedIds.includes(prestation.COD_PREST || prestation.id)
          );
          setAvailablePrestations(filtered);
        }
      } catch (error) {
        console.error('Erreur chargement prestations:', error);
      } finally {
        setLoadingPrestations(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      loadAvailablePrestations();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [formData.cod_ben, searchTerm, filterType, formData.prestations]);

  // Mettre à jour le nom du bénéficiaire lorsqu'il est sélectionné
  const handleBeneficiaireChange = (cod_ben) => {
    const beneficiaire = beneficiaires.find(b => b.id === cod_ben || b.COD_BEN === cod_ben);
    setFormData(prev => ({
      ...prev,
      cod_ben,
      nom_ben: beneficiaire?.nom || '',
      prenom_ben: beneficiaire?.prenom || ''
    }));
  };

  // Ajouter une prestation à la déclaration
  const handleAddPrestation = (prestation) => {
    if (!prestation) return;

    const newPrestation = {
      COD_PREST: prestation.COD_PREST || prestation.id,
      TYPE_PRESTATION: prestation.TYPE_PRESTATION || 'Consultation',
      LIBELLE_PRESTATION: prestation.LIB_PREST || prestation.libelle,
      MONTANT: prestation.MONTANT || 0,
      QUANTITE: prestation.QUANTITE || 1,
      DATE_PRESTATION: prestation.DATE_PRESTATION || new Date().toISOString().split('T')[0],
      TAUX_PRISE_CHARGE: prestation.TAUX_PRISE_CHARGE || 100,
      MONTANT_PRISE_CHARGE: (prestation.MONTANT || 0) * (prestation.TAUX_PRISE_CHARGE || 100) / 100,
      // Champs supplémentaires pour le backend
      id_prestation: prestation.COD_PREST || prestation.id,
      montant: prestation.MONTANT || 0,
      libelle: prestation.LIB_PREST || prestation.libelle
    };

    setFormData(prev => ({
      ...prev,
      prestations: [...prev.prestations, newPrestation],
      montant_total: prev.montant_total + (newPrestation.MONTANT || 0)
    }));

    setSelectedPrestation(null);
  };

  // Ajouter une prestation manuelle
  const handleAddManualPrestation = () => {
    const newPrestation = {
      COD_PREST: Date.now(), // ID temporaire
      TYPE_PRESTATION: 'Consultation',
      LIBELLE_PRESTATION: '',
      MONTANT: 0,
      QUANTITE: 1,
      DATE_PRESTATION: new Date().toISOString().split('T')[0],
      TAUX_PRISE_CHARGE: 100,
      MONTANT_PRISE_CHARGE: 0,
      isManual: true
    };

    setFormData(prev => ({
      ...prev,
      prestations: [...prev.prestations, newPrestation]
    }));
  };

  // Supprimer une prestation
  const handleRemovePrestation = (index) => {
    const prestationToRemove = formData.prestations[index];
    setFormData(prev => ({
      ...prev,
      prestations: prev.prestations.filter((_, i) => i !== index),
      montant_total: prev.montant_total - (prestationToRemove.MONTANT || 0)
    }));
  };

  // Mettre à jour une prestation
  const handleUpdatePrestation = (index, field, value) => {
    const updatedPrestations = [...formData.prestations];
    const oldPrestation = updatedPrestations[index];
    
    updatedPrestations[index] = {
      ...oldPrestation,
      [field]: value
    };

    // Recalculer le montant de prise en charge si nécessaire
    if (field === 'MONTANT' || field === 'TAUX_PRISE_CHARGE') {
      const montant = field === 'MONTANT' ? value : oldPrestation.MONTANT;
      const taux = field === 'TAUX_PRISE_CHARGE' ? value : oldPrestation.TAUX_PRISE_CHARGE;
      updatedPrestations[index].MONTANT_PRISE_CHARGE = montant * (taux || 100) / 100;
    }

    // Recalculer le montant total
    const montantTotal = updatedPrestations.reduce((sum, p) => sum + (p.MONTANT || 0), 0);

    setFormData(prev => ({
      ...prev,
      prestations: updatedPrestations,
      montant_total: montantTotal
    }));
  };

  // Valider et soumettre la déclaration
  const handleSubmit = () => {
    // Validation
    if (!formData.cod_ben) {
      alert('Veuillez sélectionner un bénéficiaire');
      return;
    }

    if (formData.prestations.length === 0) {
      alert('Veuillez ajouter au moins une prestation');
      return;
    }

    // Vérifier que toutes les prestations ont les champs requis
    const invalidPrestations = formData.prestations.filter(p => 
      !p.LIBELLE_PRESTATION || !p.MONTANT || p.MONTANT <= 0
    );

    if (invalidPrestations.length > 0) {
      alert('Certaines prestations sont incomplètes. Veuillez vérifier les libellés et montants.');
      return;
    }

    // Préparer les données pour l'API
    const declarationData = {
      cod_ben: formData.cod_ben,
      type_declarant: formData.type_declarant,
      nom_ben: formData.nom_ben,
      prenom_ben: formData.prenom_ben,
      prestations: formData.prestations.map(p => ({
        type_prestation: p.TYPE_PRESTATION,
        libelle: p.LIBELLE_PRESTATION,
        montant: p.MONTANT,
        quantite: p.QUANTITE || 1,
        date_prestation: p.DATE_PRESTATION,
        taux_prise_charge: p.TAUX_PRISE_CHARGE || 100,
        montant_prise_charge: p.MONTANT_PRISE_CHARGE || p.MONTANT
      })),
      montant_total: formData.montant_total,
      observations: formData.observations,
      pieces_jointes: formData.pieces_jointes
    };

    onSubmit(declarationData);
  };

  // Réinitialiser le formulaire
  const handleReset = () => {
    setFormData({
      cod_ben: '',
      nom_ben: '',
      prenom_ben: '',
      type_declarant: 'Beneficiaire',
      prestations: [],
      observations: '',
      pieces_jointes: '',
      montant_total: 0
    });
    setAvailablePrestations([]);
    setSelectedPrestation(null);
    setSearchTerm('');
    setFilterType('all');
  };

  // Formater le montant
  const formatMontant = (montant) => {
    return `${parseFloat(montant || 0).toLocaleString('fr-FR')} XAF`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <Box display="flex" alignItems="center">
          <DescriptionIcon sx={{ mr: 1 }} />
          {mode === 'create' ? 'Nouvelle Déclaration' : 'Modifier Déclaration'}
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Section Bénéficiaire */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              1. Informations du Bénéficiaire
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Bénéficiaire *</InputLabel>
                  <Select
                    value={formData.cod_ben}
                    label="Bénéficiaire *"
                    onChange={(e) => handleBeneficiaireChange(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="">Sélectionner un bénéficiaire</MenuItem>
                    {beneficiaires.map(beneficiaire => (
                      <MenuItem 
                        key={beneficiaire.id || beneficiaire.COD_BEN} 
                        value={beneficiaire.id || beneficiaire.COD_BEN}
                      >
                        {beneficiaire.nom} {beneficiaire.prenom} 
                        {beneficiaire.identifiant && ` (${beneficiaire.identifiant})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type de déclarant</InputLabel>
                  <Select
                    value={formData.type_declarant}
                    label="Type de déclarant"
                    onChange={(e) => setFormData(prev => ({ ...prev, type_declarant: e.target.value }))}
                  >
                    <MenuItem value="Beneficiaire">Bénéficiaire</MenuItem>
                    <MenuItem value="Medecin">Médecin</MenuItem>
                    <MenuItem value="Hopital">Hôpital</MenuItem>
                    <MenuItem value="Pharmacie">Pharmacie</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          {/* Section Recherche de Prestations */}
          {formData.cod_ben && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                2. Sélection des Prestations
              </Typography>
              
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Rechercher une prestation..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type de prestation</InputLabel>
                      <Select
                        value={filterType}
                        label="Type de prestation"
                        onChange={(e) => setFilterType(e.target.value)}
                      >
                        <MenuItem value="all">Tous les types</MenuItem>
                        {typesPrestations.map(type => (
                          <MenuItem key={type.id || type.code} value={type.code || type.libelle}>
                            {type.libelle}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      size="small"
                      options={availablePrestations}
                      getOptionLabel={(option) => 
                        `${option.LIB_PREST || option.libelle} - ${formatMontant(option.MONTANT)}`
                      }
                      value={selectedPrestation}
                      onChange={(event, newValue) => setSelectedPrestation(newValue)}
                      loading={loadingPrestations}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Sélectionner une prestation"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingPrestations ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddPrestation(selectedPrestation)}
                      disabled={!selectedPrestation}
                    >
                      Ajouter
                    </Button>
                  </Grid>
                </Grid>
                
                {loadingPrestations && (
                  <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      Chargement des prestations...
                    </Typography>
                  </Box>
                )}
                
                {availablePrestations.length > 0 && !loadingPrestations && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {availablePrestations.length} prestations disponibles
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* Bouton pour ajouter une prestation manuelle */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">
                  Prestations sélectionnées ({formData.prestations.length})
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddManualPrestation}
                >
                  Ajouter manuellement
                </Button>
              </Box>

              {/* Tableau des prestations sélectionnées */}
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Libellé</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Montant (XAF)</TableCell>
                      <TableCell align="center">Qté</TableCell>
                      <TableCell align="right">Prise en charge</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.prestations.map((prestation, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={prestation.TYPE_PRESTATION}
                              onChange={(e) => handleUpdatePrestation(index, 'TYPE_PRESTATION', e.target.value)}
                            >
                              {typesPrestations.map(type => (
                                <MenuItem key={type.id || type.code} value={type.code || type.libelle}>
                                  {type.libelle}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={prestation.LIBELLE_PRESTATION}
                            onChange={(e) => handleUpdatePrestation(index, 'LIBELLE_PRESTATION', e.target.value)}
                            placeholder="Libellé de la prestation"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="date"
                            value={prestation.DATE_PRESTATION}
                            onChange={(e) => handleUpdatePrestation(index, 'DATE_PRESTATION', e.target.value)}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={prestation.MONTANT}
                            onChange={(e) => handleUpdatePrestation(index, 'MONTANT', parseFloat(e.target.value) || 0)}
                            InputProps={{
                              endAdornment: 'XAF'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={prestation.QUANTITE}
                            onChange={(e) => handleUpdatePrestation(index, 'QUANTITE', parseInt(e.target.value) || 1)}
                            style={{ width: 70 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" gap={1}>
                            <TextField
                              size="small"
                              type="number"
                              value={prestation.TAUX_PRISE_CHARGE}
                              onChange={(e) => handleUpdatePrestation(index, 'TAUX_PRISE_CHARGE', parseFloat(e.target.value) || 100)}
                              style={{ width: 80 }}
                              InputProps={{
                                endAdornment: '%'
                              }}
                            />
                            <Typography variant="body2">
                              = {formatMontant(prestation.MONTANT_PRISE_CHARGE)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemovePrestation(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {formData.prestations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            Aucune prestation ajoutée. Recherchez et ajoutez des prestations disponibles.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Résumé des montants */}
              {formData.prestations.length > 0 && (
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Récapitulatif des montants
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">Montant total déclaré:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body1" fontWeight="bold" align="right">
                        {formatMontant(formData.montant_total)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2">Montant total pris en charge:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body1" fontWeight="bold" color="primary.main" align="right">
                        {formatMontant(
                          formData.prestations.reduce((sum, p) => sum + (p.MONTANT_PRISE_CHARGE || 0), 0)
                        )}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2">Ticket modérateur:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body1" color="error.main" align="right">
                        {formatMontant(
                          formData.prestations.reduce((sum, p) => sum + (p.MONTANT - (p.MONTANT_PRISE_CHARGE || 0)), 0)
                        )}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Grid>
          )}

          {/* Section Observations */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              3. Informations complémentaires
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observations"
              value={formData.observations}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              placeholder="Ajoutez ici toute information complémentaire..."
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Pièces jointes (références)"
              value={formData.pieces_jointes}
              onChange={(e) => setFormData(prev => ({ ...prev, pieces_jointes: e.target.value }))}
              placeholder="Références des factures, ordonnances, etc."
              helperText="Séparez les références par des virgules"
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button onClick={handleReset} variant="outlined" disabled={loading}>
          Réinitialiser
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !formData.cod_ben || formData.prestations.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <DescriptionIcon />}
        >
          {loading ? 'Envoi en cours...' : 'Soumettre la déclaration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeclarationDialog;