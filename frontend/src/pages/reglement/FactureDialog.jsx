// components/FactureDialog.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Alert,
  Typography,
  Grid,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { facturationAPI, patientsAPI } from '../../services/api';

const FactureDialog = ({ open, mode, data, onClose, onSubmit, loading }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    cod_ben: '',
    cod_payeur: '',
    date_facture: new Date(),
    date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    observations: '',
    factures: [
      {
        id: Date.now(),
        type: 'consultation',
        libelle: 'Facture Consultation',
        prestations: [
          {
            id: Date.now() + 1,
            type_prestation: 'consultation',
            libelle: 'Consultation médicale',
            quantite: 1,
            prix_unitaire: 5000,
            montant: 5000,
            date_execution: new Date()
          }
        ]
      }
    ]
  });
  
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [payeurs, setPayeurs] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiLoading, setApiLoading] = useState(false);

  const steps = ['Information client', 'Détails des factures', 'Validation'];

  const generateUniqueId = () => Date.now() + Math.floor(Math.random() * 1000);

  useEffect(() => {
    if (mode === 'edit' && data && open) {
      const formattedData = {
        cod_ben: data.cod_ben || '',
        cod_payeur: data.cod_payeur || '',
        date_facture: data.date_facture ? new Date(data.date_facture) : new Date(),
        date_echeance: data.date_echeance ? new Date(data.date_echeance) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        observations: data.observations || '',
        factures: (Array.isArray(data.factures) ? data.factures : [data]).map((f, idx) => ({
          id: f.id || generateUniqueId(),
          type: f.type || f.type_facture || 'consultation',
          libelle: f.libelle || f.libelle_facture || `Facture ${idx + 1}`,
          prestations: (Array.isArray(f.prestations) ? f.prestations : []).map((p, pIdx) => ({
            id: p.id || generateUniqueId(),
            type_prestation: p.type_prestation || 'consultation',
            libelle: p.libelle || '',
            quantite: Number(p.quantite) || 1,
            prix_unitaire: Number(p.prix_unitaire) || 0,
            montant: Number(p.montant) || 0,
            date_execution: p.date_execution ? new Date(p.date_execution) : new Date()
          }))
        }))
      };
      
      setFormData(formattedData);
    } else if (!open) {
      // Reset form when dialog closes
      setFormData({
        cod_ben: '',
        cod_payeur: '',
        date_facture: new Date(),
        date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        observations: '',
        factures: [
          {
            id: generateUniqueId(),
            type: 'consultation',
            libelle: 'Facture Consultation',
            prestations: [
              {
                id: generateUniqueId(),
                type_prestation: 'consultation',
                libelle: 'Consultation médicale',
                quantite: 1,
                prix_unitaire: 5000,
                montant: 5000,
                date_execution: new Date()
              }
            ]
          }
        ]
      });
      setActiveStep(0);
      setActiveTab(0);
      setErrors({});
    }
  }, [mode, data, open]);

  const loadBeneficiaires = useCallback(async () => {
    if (!open) return;
    
    setApiLoading(true);
    try {
      const response = await patientsAPI.getAll(100, 1);
      
      let formattedBeneficiaires = [];
      
      if (response.success && Array.isArray(response.beneficiaires)) {
        formattedBeneficiaires = response.beneficiaires.map(ben => ({
          id: ben.id || ben.ID_BEN,
          nom: ben.nom || ben.NOM_BEN || '',
          prenom: ben.prenom || ben.PRE_BEN || '',
          identifiant: ben.identifiant || ben.IDENTIFIANT_NATIONAL || '',
          sexe: ben.sexe || ben.SEX_BEN || '',
          date_naissance: ben.date_naissance || ben.NAI_BEN || null,
          telephone: ben.telephone || ben.TELEPHONE_MOBILE || '',
          email: ben.email || ben.EMAIL || ''
        }));
      } else if (Array.isArray(response)) {
        formattedBeneficiaires = response.map(ben => ({
          id: ben.ID_BEN || ben.id,
          nom: ben.NOM_BEN || ben.nom || '',
          prenom: ben.PRE_BEN || ben.prenom || '',
          identifiant: ben.IDENTIFIANT_NATIONAL || ben.identifiant || '',
          sexe: ben.SEX_BEN || ben.sexe || '',
          date_naissance: ben.NAI_BEN || ben.date_naissance || null,
          telephone: ben.TELEPHONE_MOBILE || ben.telephone || '',
          email: ben.EMAIL || ben.email || ''
        }));
      }
      
      setBeneficiaires(formattedBeneficiaires);
    } catch (error) {
      console.error('Erreur lors du chargement des bénéficiaires:', error);
      setBeneficiaires([]);
    } finally {
      setApiLoading(false);
    }
  }, [open]);

  const loadPayeurs = useCallback(async () => {
    if (!open) return;
    
    try {
      const response = await facturationAPI.getPayeurs();
      
      let formattedPayeurs = [];
      
      if (response.success && Array.isArray(response.payeurs)) {
        formattedPayeurs = response.payeurs.map(payeur => ({
          id: payeur.cod_payeur || payeur.id,
          libelle: payeur.libelle || payeur.LIBELLE || 'Payeur inconnu',
          taux_couverture: Number(payeur.taux_couverture) || Number(payeur.TAUX_COUVERTURE) || 0,
          type_payeur: payeur.type_payeur || payeur.TYPE_PAYEUR || 'assurance'
        }));
      } else if (Array.isArray(response)) {
        formattedPayeurs = response.map(payeur => ({
          id: payeur.cod_payeur || payeur.id,
          libelle: payeur.libelle || payeur.LIBELLE || 'Payeur inconnu',
          taux_couverture: Number(payeur.taux_couverture) || Number(payeur.TAUX_COUVERTURE) || 0,
          type_payeur: payeur.type_payeur || payeur.TYPE_PAYEUR || 'assurance'
        }));
      } else {
        formattedPayeurs = [
          { id: 1, libelle: 'Assurance Santé A', taux_couverture: 80, type_payeur: 'assurance' },
          { id: 2, libelle: 'Mutuelle B', taux_couverture: 70, type_payeur: 'mutuelle' },
          { id: 3, libelle: 'Patient (paiement direct)', taux_couverture: 0, type_payeur: 'patient' },
          { id: 4, libelle: 'État/CNSS', taux_couverture: 100, type_payeur: 'etat' }
        ];
      }
      
      setPayeurs(formattedPayeurs);
    } catch (error) {
      console.error('Erreur lors du chargement des payeurs:', error);
      setPayeurs([
        { id: 1, libelle: 'Assurance Santé A', taux_couverture: 80, type_payeur: 'assurance' },
        { id: 2, libelle: 'Mutuelle B', taux_couverture: 70, type_payeur: 'mutuelle' },
        { id: 3, libelle: 'Patient (paiement direct)', taux_couverture: 0, type_payeur: 'patient' }
      ]);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      loadBeneficiaires();
      loadPayeurs();
    }
  }, [open, loadBeneficiaires, loadPayeurs]);

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0:
        if (!formData.cod_ben) {
          newErrors.cod_ben = 'Bénéficiaire requis';
        }
        if (!formData.cod_payeur) {
          newErrors.cod_payeur = 'Payeur requis';
        }
        if (formData.date_echeance && formData.date_facture && formData.date_echeance < formData.date_facture) {
          newErrors.date_echeance = 'La date d\'échéance doit être postérieure à la date de facturation';
        }
        break;
        
      case 1:
        formData.factures.forEach((facture, factureIndex) => {
          if (!facture.libelle || facture.libelle.trim() === '') {
            newErrors[`facture_${factureIndex}_libelle`] = 'Libellé de la facture requis';
          }
          
          if (!facture.prestations || facture.prestations.length === 0) {
            newErrors[`facture_${factureIndex}_prestations`] = 'Au moins une prestation est requise';
          } else {
            facture.prestations.forEach((prestation, prestationIndex) => {
              if (!prestation.libelle || prestation.libelle.trim() === '') {
                newErrors[`facture_${factureIndex}_prestation_${prestationIndex}_libelle`] = 'Libellé requis';
              }
              if (!prestation.prix_unitaire || prestation.prix_unitaire <= 0) {
                newErrors[`facture_${factureIndex}_prestation_${prestationIndex}_prix`] = 'Prix unitaire invalide';
              }
              if (!prestation.quantite || prestation.quantite <= 0) {
                newErrors[`facture_${factureIndex}_prestation_${prestationIndex}_quantite`] = 'Quantité invalide';
              }
            });
          }
        });
        break;
    }
    
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
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleDateChange = (field) => (date) => {
    setFormData(prev => ({ ...prev, [field]: date }));
    if (field === 'date_facture' && date && formData.date_echeance && formData.date_echeance < date) {
      setErrors(prev => ({ ...prev, date_echeance: 'La date d\'échéance doit être postérieure à la date de facturation' }));
    } else {
      setErrors(prev => ({ ...prev, date_echeance: null }));
    }
  };

  const handleFactureChange = (factureIndex, field, value) => {
    const updatedFactures = [...formData.factures];
    updatedFactures[factureIndex] = {
      ...updatedFactures[factureIndex],
      [field]: value
    };
    
    setFormData(prev => ({ ...prev, factures: updatedFactures }));
  };

  const handlePrestationChange = (factureIndex, prestationIndex, field, value) => {
    const updatedFactures = [...formData.factures];
    const updatedPrestations = [...updatedFactures[factureIndex].prestations];
    
    updatedPrestations[prestationIndex] = {
      ...updatedPrestations[prestationIndex],
      [field]: field === 'quantite' || field === 'prix_unitaire' ? Number(value) : value
    };
    
    if (field === 'prix_unitaire' || field === 'quantite') {
      const prix = Number(updatedPrestations[prestationIndex].prix_unitaire) || 0;
      const quantite = Number(updatedPrestations[prestationIndex].quantite) || 1;
      updatedPrestations[prestationIndex].montant = prix * quantite;
    }
    
    updatedFactures[factureIndex].prestations = updatedPrestations;
    setFormData(prev => ({ ...prev, factures: updatedFactures }));
    
    const errorKey = `facture_${factureIndex}_prestation_${prestationIndex}_${field}`;
    setErrors(prev => ({ ...prev, [errorKey]: null }));
  };

  const addPrestation = (factureIndex) => {
    const updatedFactures = [...formData.factures];
    const newPrestation = {
      id: generateUniqueId(),
      type_prestation: 'consultation',
      libelle: '',
      quantite: 1,
      prix_unitaire: 0,
      montant: 0,
      date_execution: new Date()
    };
    
    updatedFactures[factureIndex].prestations.push(newPrestation);
    setFormData(prev => ({ ...prev, factures: updatedFactures }));
  };

  const removePrestation = (factureIndex, prestationIndex) => {
    const updatedFactures = [...formData.factures];
    if (updatedFactures[factureIndex].prestations.length > 1) {
      updatedFactures[factureIndex].prestations = updatedFactures[factureIndex].prestations.filter((_, i) => i !== prestationIndex);
      setFormData(prev => ({ ...prev, factures: updatedFactures }));
    }
  };

  const duplicateFacture = (factureIndex) => {
    const updatedFactures = [...formData.factures];
    const factureToDuplicate = { ...updatedFactures[factureIndex] };
    const duplicatedFacture = {
      ...factureToDuplicate,
      id: generateUniqueId(),
      libelle: `${factureToDuplicate.libelle} (Copie)`,
      prestations: factureToDuplicate.prestations.map(prestation => ({
        ...prestation,
        id: generateUniqueId()
      }))
    };
    
    updatedFactures.push(duplicatedFacture);
    setFormData(prev => ({ ...prev, factures: updatedFactures }));
    setActiveTab(updatedFactures.length - 1);
  };

  const addFacture = () => {
    const newFacture = {
      id: generateUniqueId(),
      type: 'consultation',
      libelle: `Facture ${formData.factures.length + 1}`,
      prestations: [{
        id: generateUniqueId(),
        type_prestation: 'consultation',
        libelle: '',
        quantite: 1,
        prix_unitaire: 0,
        montant: 0,
        date_execution: new Date()
      }]
    };
    setFormData(prev => ({ 
      ...prev, 
      factures: [...prev.factures, newFacture] 
    }));
    setActiveTab(formData.factures.length);
  };

  const removeFacture = (factureIndex) => {
    if (formData.factures.length <= 1) {
      alert('Vous devez avoir au moins une facture');
      return;
    }
    
    const updatedFactures = formData.factures.filter((_, i) => i !== factureIndex);
    setFormData(prev => ({ ...prev, factures: updatedFactures }));
    
    if (activeTab >= updatedFactures.length) {
      setActiveTab(updatedFactures.length - 1);
    }
  };

  const calculateTotals = () => {
    const totals = [];
    let grandTotal = 0;
    let grandPriseEnCharge = 0;
    let grandReste = 0;
    
    const selectedPayeur = payeurs.find(p => p.id === Number(formData.cod_payeur));
    const tauxCouverture = selectedPayeur?.taux_couverture || 0;
    
    formData.factures.forEach(facture => {
      const total = facture.prestations.reduce((sum, prestation) => sum + (Number(prestation.montant) || 0), 0);
      const priseEnCharge = (total * tauxCouverture) / 100;
      const reste = total - priseEnCharge;
      
      totals.push({
        total,
        priseEnCharge,
        reste,
        tauxCouverture
      });
      
      grandTotal += total;
      grandPriseEnCharge += priseEnCharge;
      grandReste += reste;
    });
    
    return { totals, grandTotal, grandPriseEnCharge, grandReste, tauxCouverture };
  };

  const handleSubmit = async () => {
    if (validateStep(activeStep)) {
      const { totals } = calculateTotals();
      const selectedPayeur = payeurs.find(p => p.id === Number(formData.cod_payeur));
      
      try {
        const facturesToSubmit = formData.factures.map((facture, index) => {
          const factureTotals = totals[index];
          
          return {
            cod_ben: Number(formData.cod_ben),
            cod_payeur: Number(formData.cod_payeur),
            date_facture: formData.date_facture,
            date_echeance: formData.date_echeance,
            observations: formData.observations || '',
            montant_total: factureTotals.total,
            montant_couvert: factureTotals.priseEnCharge,
            montant_restant: factureTotals.reste,
            statut: 'brouillon',
            type_facture: facture.type,
            libelle_facture: facture.libelle,
            prestations: (facture.prestations || []).map(prestation => ({
              type_prestation: prestation.type_prestation || 'consultation',
              libelle: prestation.libelle || '',
              quantite: Number(prestation.quantite) || 1,
              prix_unitaire: Number(prestation.prix_unitaire) || 0,
              montant: Number(prestation.montant) || 0,
              date_execution: prestation.date_execution || new Date()
            }))
          };
        });
        
        onSubmit(facturesToSubmit);
        
      } catch (error) {
        console.error('Erreur lors de la préparation des factures:', error);
        alert(`Erreur: ${error.message}`);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'Non définie';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Date invalide';
      
      return dateObj.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const getStepContent = (step) => {
    const selectedPayeur = payeurs.find(p => p.id === Number(formData.cod_payeur));
    const selectedBeneficiaire = beneficiaires.find(b => b.id === Number(formData.cod_ben));
    const { totals, grandTotal, grandPriseEnCharge, grandReste } = calculateTotals();

    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.cod_ben} disabled={apiLoading}>
                <InputLabel>Bénéficiaire</InputLabel>
                <Select
                  value={formData.cod_ben}
                  label="Bénéficiaire"
                  onChange={handleChange('cod_ben')}
                >
                  <MenuItem value="">Sélectionner un bénéficiaire</MenuItem>
                  {beneficiaires.map((ben) => (
                    <MenuItem key={ben.id} value={ben.id}>
                      {ben.nom} {ben.prenom} {ben.identifiant ? `(${ben.identifiant})` : ''}
                    </MenuItem>
                  ))}
                </Select>
                {errors.cod_ben && (
                  <Typography variant="caption" color="error">
                    {errors.cod_ben}
                  </Typography>
                )}
              </FormControl>
              
              {selectedBeneficiaire && (
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="body2">
                      <strong>Nom:</strong> {selectedBeneficiaire.nom} {selectedBeneficiaire.prenom}
                    </Typography>
                    {selectedBeneficiaire.identifiant && (
                      <Typography variant="body2">
                        <strong>Identifiant:</strong> {selectedBeneficiaire.identifiant}
                      </Typography>
                    )}
                    {selectedBeneficiaire.date_naissance && (
                      <Typography variant="body2">
                        <strong>Date naissance:</strong> {formatDate(selectedBeneficiaire.date_naissance)}
                      </Typography>
                    )}
                    {selectedBeneficiaire.telephone && (
                      <Typography variant="body2">
                        <strong>Téléphone:</strong> {selectedBeneficiaire.telephone}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.cod_payeur}>
                <InputLabel>Payeur</InputLabel>
                <Select
                  value={formData.cod_payeur}
                  label="Payeur"
                  onChange={handleChange('cod_payeur')}
                >
                  <MenuItem value="">Sélectionner un payeur</MenuItem>
                  {payeurs.map((payeur) => (
                    <MenuItem key={payeur.id} value={payeur.id}>
                      {payeur.libelle} ({payeur.taux_couverture}% couverture)
                    </MenuItem>
                  ))}
                </Select>
                {errors.cod_payeur && (
                  <Typography variant="caption" color="error">
                    {errors.cod_payeur}
                  </Typography>
                )}
              </FormControl>
              
              {selectedPayeur && (
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="body2">
                      <strong>Type de payeur:</strong> {selectedPayeur.type_payeur || 'Non spécifié'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Taux de couverture:</strong> {selectedPayeur.taux_couverture}%
                    </Typography>
                    {grandTotal > 0 && (
                      <>
                        <Typography variant="body2">
                          <strong>Prise en charge totale estimée:</strong> {formatCurrency(grandPriseEnCharge)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Reste à charge total:</strong> {formatCurrency(grandReste)}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DatePicker
                  label="Date de facturation"
                  value={formData.date_facture}
                  onChange={handleDateChange('date_facture')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.date_facture
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DatePicker
                  label="Date d'échéance"
                  value={formData.date_echeance}
                  onChange={handleDateChange('date_echeance')}
                  minDate={formData.date_facture}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.date_echeance,
                      helperText: errors.date_echeance
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Factures à créer ({formData.factures.length})
              </Typography>
              <Box>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addFacture}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Ajouter une facture
                </Button>
              </Box>
            </Box>
            
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              {formData.factures.map((facture, index) => (
                <Tab 
                  key={facture.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <span>Facture {index + 1}</span>
                      {formData.factures.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFacture(index);
                          }}
                          sx={{ ml: 1, p: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  }
                />
              ))}
            </Tabs>
            
            {formData.factures.map((facture, factureIndex) => (
              activeTab === factureIndex && (
                <Box key={facture.id}>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Libellé de la facture"
                        value={facture.libelle}
                        onChange={(e) => handleFactureChange(factureIndex, 'libelle', e.target.value)}
                        error={!!errors[`facture_${factureIndex}_libelle`]}
                        helperText={errors[`facture_${factureIndex}_libelle`]}
                        placeholder="Ex: Facture Consultation"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Type de facture</InputLabel>
                        <Select
                          value={facture.type}
                          label="Type de facture"
                          onChange={(e) => handleFactureChange(factureIndex, 'type', e.target.value)}
                        >
                          <MenuItem value="consultation">Consultation</MenuItem>
                          <MenuItem value="pharmacie">Pharmacie</MenuItem>
                          <MenuItem value="analyse">Analyse</MenuItem>
                          <MenuItem value="radio">Radiologie</MenuItem>
                          <MenuItem value="hospitalisation">Hospitalisation</MenuItem>
                          <MenuItem value="urgence">Urgence</MenuItem>
                          <MenuItem value="chirurgie">Chirurgie</MenuItem>
                          <MenuItem value="divers">Divers</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Prestations de la facture {factureIndex + 1}
                    </Typography>
                    <Box>
                      <Button
                        startIcon={<CopyIcon />}
                        onClick={() => duplicateFacture(factureIndex)}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Dupliquer
                      </Button>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => addPrestation(factureIndex)}
                        variant="outlined"
                        size="small"
                      >
                        Ajouter une prestation
                      </Button>
                    </Box>
                  </Box>
                  
                  {errors[`facture_${factureIndex}_prestations`] && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {errors[`facture_${factureIndex}_prestations`]}
                    </Alert>
                  )}
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Libellé</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="center">Quantité</TableCell>
                          <TableCell align="right">Prix unitaire</TableCell>
                          <TableCell align="right">Montant</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {facture.prestations.map((prestation, prestationIndex) => (
                          <TableRow key={prestation.id}>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                value={prestation.libelle}
                                onChange={(e) => handlePrestationChange(factureIndex, prestationIndex, 'libelle', e.target.value)}
                                error={!!errors[`facture_${factureIndex}_prestation_${prestationIndex}_libelle`]}
                                helperText={errors[`facture_${factureIndex}_prestation_${prestationIndex}_libelle`]}
                                placeholder="Description de la prestation"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                value={prestation.type_prestation}
                                onChange={(e) => handlePrestationChange(factureIndex, prestationIndex, 'type_prestation', e.target.value)}
                                sx={{ minWidth: 120 }}
                              >
                                <MenuItem value="consultation">Consultation</MenuItem>
                                <MenuItem value="analyse">Analyse</MenuItem>
                                <MenuItem value="radio">Radiologie</MenuItem>
                                <MenuItem value="pharmacie">Pharmacie</MenuItem>
                                <MenuItem value="hospitalisation">Hospitalisation</MenuItem>
                                <MenuItem value="urgence">Urgence</MenuItem>
                                <MenuItem value="chirurgie">Chirurgie</MenuItem>
                                <MenuItem value="divers">Divers</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={prestation.quantite}
                                onChange={(e) => handlePrestationChange(factureIndex, prestationIndex, 'quantite', e.target.value)}
                                error={!!errors[`facture_${factureIndex}_prestation_${prestationIndex}_quantite`]}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={prestation.prix_unitaire}
                                onChange={(e) => handlePrestationChange(factureIndex, prestationIndex, 'prix_unitaire', e.target.value)}
                                error={!!errors[`facture_${factureIndex}_prestation_${prestationIndex}_prix`]}
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">XAF</InputAdornment>
                                }}
                                sx={{ width: 120 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight="medium">
                                {formatCurrency(prestation.montant)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => removePrestation(factureIndex, prestationIndex)}
                                color="error"
                                disabled={facture.prestations.length === 1}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <Card sx={{ mt: 3 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total de la facture {factureIndex + 1}:
                          </Typography>
                          <Typography variant="h6">
                            {formatCurrency(totals[factureIndex]?.total || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Payeur: {selectedPayeur?.libelle || 'Non sélectionné'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Taux de couverture: {selectedPayeur?.taux_couverture || 0}%
                          </Typography>
                          <Typography variant="body2" color="success.main">
                            Prise en charge: {formatCurrency(totals[factureIndex]?.priseEnCharge || 0)}
                          </Typography>
                          <Typography variant="body2" color="error.main">
                            Reste à charge: {formatCurrency(totals[factureIndex]?.reste || 0)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Box>
              )
            ))}
            
            <Card sx={{ mt: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Total général des {formData.factures.length} factures:</strong>
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(grandTotal)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Prise en charge totale:</strong> {formatCurrency(grandPriseEnCharge)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Reste à charge total:</strong> {formatCurrency(grandReste)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );
        
      case 2:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Récapitulatif des {formData.factures.length} factures
              </Typography>
              Vérifiez les informations ci-dessous avant de générer les factures.
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      Informations client
                    </Typography>
                    <Typography variant="body2">
                      <strong>Bénéficiaire:</strong> {selectedBeneficiaire ? `${selectedBeneficiaire.nom} ${selectedBeneficiaire.prenom}` : 'Non sélectionné'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Identifiant:</strong> {selectedBeneficiaire?.identifiant || 'Non disponible'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Payeur:</strong> {selectedPayeur?.libelle || 'Non sélectionné'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Type payeur:</strong> {selectedPayeur?.type_payeur || 'Non spécifié'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Taux couverture:</strong> {selectedPayeur?.taux_couverture || 0}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      Dates
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date facture:</strong> {formatDate(formData.date_facture)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date échéance:</strong> {formatDate(formData.date_echeance)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Observations générales:</strong> {formData.observations || 'Aucune'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {formData.factures.map((facture, index) => (
                <Grid item xs={12} key={facture.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom color="primary">
                        Facture {index + 1}: {facture.libelle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Type: {facture.type}
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2">
                            <strong>Total prestations:</strong> {formatCurrency(totals[index]?.total || 0)}
                          </Typography>
                          <Typography variant="body2" color="success.main">
                            <strong>Prise en charge:</strong> {formatCurrency(totals[index]?.priseEnCharge || 0)}
                          </Typography>
                          <Typography variant="body2" color="error.main">
                            <strong>Reste à charge:</strong> {formatCurrency(totals[index]?.reste || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2">
                            <strong>Nombre de prestations:</strong> {facture.prestations.length}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Prestations:</strong>
                          </Typography>
                          <Box sx={{ maxHeight: 100, overflow: 'auto', mt: 1 }}>
                            {facture.prestations.map((p, i) => (
                              <Typography key={p.id} variant="body2" fontSize="small">
                                • {p.libelle} ({p.quantite} × {formatCurrency(p.prix_unitaire)})
                              </Typography>
                            ))}
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1">
                          TOTAL GÉNÉRAL
                        </Typography>
                        <Typography variant="h5">
                          {formatCurrency(grandTotal)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2">
                          Prise en charge totale: {formatCurrency(grandPriseEnCharge)}
                        </Typography>
                        <Typography variant="body2">
                          Reste à charge total: {formatCurrency(grandReste)}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Nombre de factures: {formData.factures.length}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observations additionnelles"
                  value={formData.observations}
                  onChange={handleChange('observations')}
                  placeholder="Ajoutez des notes ou instructions supplémentaires pour toutes les factures..."
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      default:
        return 'Étape inconnue';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, minHeight: 700 }
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <ReceiptIcon color="primary" />
          <Typography variant="h6">
            {mode === 'create' ? 'Créer plusieurs factures' : 'Modifier les factures'}
          </Typography>
          <Chip 
            label={`${formData.factures.length} facture(s)`} 
            color="primary" 
            size="small"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {apiLoading && activeStep === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Chargement des données...</Typography>
          </Box>
        ) : (
          getStepContent(activeStep)
        )}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box>
          {activeStep > 0 && (
            <Button onClick={handleBack} disabled={loading || apiLoading}>
              Retour
            </Button>
          )}
        </Box>
        
        <Box>
          <Button 
            onClick={onClose}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            Annuler
          </Button>
          
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading || apiLoading}
            >
              Suivant
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmit}
              disabled={loading || apiLoading}
              startIcon={loading ? <CircularProgress size={20} /> : <ReceiptIcon />}
            >
              {loading ? 'Génération...' : `Générer ${formData.factures.length} facture(s)`}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default FactureDialog;