// src/components/facturation/GenerationFacture.js
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Grid,
  TextField,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { facturationAPI, consultationsAPI } from '../../services/api';

const GenerationFacture = ({ onFactureGenerated, showNotification }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [payeurs, setPayeurs] = useState([]);
  const [selectedPayeur, setSelectedPayeur] = useState(null);
  const [dateDebut, setDateDebut] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [dateFin, setDateFin] = useState(new Date());
  const [prestations, setPrestations] = useState([]);
  const [selectedPrestations, setSelectedPrestations] = useState([]);
  const [facturePreview, setFacturePreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);

  const steps = ['Sélection du payeur', 'Sélection des prestations', 'Validation et génération'];

  useEffect(() => {
    loadPayeurs();
  }, []);

  const loadPayeurs = async () => {
    try {
      const response = await facturationAPI.getPayeurs();
      if (response.success) {
        setPayeurs(response.payeurs || []);
      }
    } catch (error) {
      console.error('Erreur chargement payeurs:', error);
      showNotification(error.message);
    }
  };

  const handleSearchPrestations = async () => {
    if (!selectedPayeur) {
      showNotification('Veuillez sélectionner un payeur');
      return;
    }

    try {
      setLoading(true);
      const params = {
        payeurId: selectedPayeur.id,
        dateDebut: dateDebut.toISOString().split('T')[0],
        dateFin: dateFin.toISOString().split('T')[0],
        statut: 'non_facture'
      };

      const response = await facturationAPI.getTransactions(params);
      
      if (response.success) {
        setPrestations(response.transactions || []);
        // Sélectionner toutes les prestations par défaut
        setSelectedPrestations(response.transactions?.map(p => p.id) || []);
        setStep(1);
      } else {
        showNotification(response.message || 'Erreur lors de la recherche');
      }
    } catch (error) {
      console.error('Erreur recherche prestations:', error);
      showNotification(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedPrestations(prestations.map(p => p.id));
    } else {
      setSelectedPrestations([]);
    }
  };

  const handleSelectPrestation = (prestationId) => {
    setSelectedPrestations(prev => {
      if (prev.includes(prestationId)) {
        return prev.filter(id => id !== prestationId);
      } else {
        return [...prev, prestationId];
      }
    });
  };

  const handleRemovePrestation = (prestationId) => {
    setSelectedPrestations(prev => prev.filter(id => id !== prestationId));
  };

  const calculateTotals = () => {
    const selected = prestations.filter(p => selectedPrestations.includes(p.id));
    
    const montantTotal = selected.reduce((sum, p) => sum + (p.montant || 0), 0);
    const montantDejaPaye = selected.reduce((sum, p) => sum + (p.montant_paye || 0), 0);
    const montantReclame = montantTotal - montantDejaPaye;

    return {
      montantTotal,
      montantDejaPaye,
      montantReclame,
      nombrePrestations: selected.length,
      nombrePatients: new Set(selected.map(p => p.patient_id)).size
    };
  };

  const handlePreview = () => {
    const totals = calculateTotals();
    setFacturePreview({
      payeur: selectedPayeur,
      periode: {
        debut: dateDebut,
        fin: dateFin
      },
      prestations: prestations.filter(p => selectedPrestations.includes(p.id)),
      ...totals
    });
    setStep(2);
  };

  const handleGenerateFacture = async () => {
    try {
      setGenerating(true);
      
      const factureData = {
        payeurId: selectedPayeur.id,
        dateDebut: dateDebut.toISOString().split('T')[0],
        dateFin: dateFin.toISOString().split('T')[0],
        prestationIds: selectedPrestations,
        montantTotal: facturePreview.montantReclame,
        notes: '',
        type: 'etat_recapitulatif'
      };

      const response = await facturationAPI.genererFacture(factureData);
      
      if (response.success) {
        showNotification('Facture générée avec succès');
        setDetailsDialog(true);
        
        if (onFactureGenerated) {
          onFactureGenerated();
        }
      } else {
        showNotification(response.message || 'Erreur lors de la génération');
      }
    } catch (error) {
      console.error('Erreur génération facture:', error);
      showNotification(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintFacture = () => {
    window.open(`/api/facturation/facture/${facturePreview.id}/print`, '_blank');
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sélection du payeur et de la période
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Payeur</InputLabel>
                  <Select
                    value={selectedPayeur?.id || ''}
                    onChange={(e) => {
                      const payeur = payeurs.find(p => p.id === e.target.value);
                      setSelectedPayeur(payeur || null);
                    }}
                    label="Payeur"
                    startAdornment={
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    }
                  >
                    {payeurs.map((payeur) => (
                      <MenuItem key={payeur.id} value={payeur.id}>
                        {payeur.nom} - {payeur.type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Date début"
                  value={dateDebut}
                  onChange={(newValue) => setDateDebut(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Date fin"
                  value={dateFin}
                  onChange={(newValue) => setDateFin(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
            </Grid>

            {selectedPayeur && (
              <Card sx={{ mt: 3, bgcolor: 'info.light' }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Informations payeur
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Nom:</strong> {selectedPayeur.nom}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Type:</strong> {selectedPayeur.type}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Taux couverture:</strong> {selectedPayeur.taux_couverture || 80}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Contact:</strong> {selectedPayeur.contact}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSearchPrestations}
                disabled={!selectedPayeur || loading}
                startIcon={<SearchIcon />}
              >
                {loading ? <CircularProgress size={20} /> : 'Rechercher les prestations'}
              </Button>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Sélection des prestations
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedPrestations.length} prestations sélectionnées
                </Typography>
                <Button
                  size="small"
                  onClick={() => setSelectedPrestations(prestations.map(p => p.id))}
                >
                  Tout sélectionner
                </Button>
                <Button
                  size="small"
                  onClick={() => setSelectedPrestations([])}
                >
                  Tout désélectionner
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedPrestations.length > 0 && selectedPrestations.length < prestations.length}
                        checked={prestations.length > 0 && selectedPrestations.length === prestations.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Patient</strong></TableCell>
                    <TableCell><strong>Prestation</strong></TableCell>
                    <TableCell><strong>Montant total (FCFA)</strong></TableCell>
                    <TableCell><strong>Déjà payé (FCFA)</strong></TableCell>
                    <TableCell><strong>À réclamer (FCFA)</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prestations.map((prestation) => {
                    const isSelected = selectedPrestations.includes(prestation.id);
                    const montantReclame = (prestation.montant || 0) - (prestation.montant_paye || 0);
                    
                    return (
                      <TableRow 
                        key={prestation.id}
                        selected={isSelected}
                        sx={{ 
                          '&:hover': { bgcolor: 'action.hover' },
                          opacity: isSelected ? 1 : 0.6
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleSelectPrestation(prestation.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(prestation.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {prestation.patient_nom} {prestation.patient_prenom}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {prestation.patient_identifiant}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={prestation.type_prestation} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="medium">
                            {(prestation.montant || 0).toLocaleString('fr-FR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography color="success.main">
                            {(prestation.montant_paye || 0).toLocaleString('fr-FR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography color="warning.main" fontWeight="bold">
                            {montantReclame.toLocaleString('fr-FR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleRemovePrestation(prestation.id)}
                            disabled={!isSelected}
                            color="error"
                          >
                            <RemoveIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Récapitulatif */}
            {selectedPrestations.length > 0 && (
              <Card sx={{ mt: 3, bgcolor: 'primary.light' }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Nombre de prestations
                      </Typography>
                      <Typography variant="h6">
                        {calculateTotals().nombrePrestations}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Nombre de patients
                      </Typography>
                      <Typography variant="h6">
                        {calculateTotals().nombrePatients}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Montant total
                      </Typography>
                      <Typography variant="h6">
                        {calculateTotals().montantReclame.toLocaleString('fr-FR')} FCFA
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                        <Button
                          variant="contained"
                          onClick={handlePreview}
                          startIcon={<ReceiptIcon />}
                        >
                          Valider et prévisualiser
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setStep(0)}>
                Retour
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setPrestations([]);
                  setSelectedPrestations([]);
                  setStep(0);
                }}
              >
                Nouvelle recherche
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Validation de la facture
            </Typography>

            {facturePreview && (
              <>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Payeur
                        </Typography>
                        <Typography variant="h6">
                          {facturePreview.payeur.nom}
                        </Typography>
                        <Typography variant="body2">
                          {facturePreview.payeur.type} • {facturePreview.payeur.contact}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Période
                        </Typography>
                        <Typography variant="h6">
                          Du {facturePreview.periode.debut.toLocaleDateString('fr-FR')} 
                          au {facturePreview.periode.fin.toLocaleDateString('fr-FR')}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Détails des montants */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                      <Typography variant="body2" color="text.secondary">
                        Montant total
                      </Typography>
                      <Typography variant="h4" color="primary.main">
                        {facturePreview.montantTotal.toLocaleString('fr-FR')}
                      </Typography>
                      <Typography variant="caption">
                        FCFA
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                      <Typography variant="body2" color="text.secondary">
                        Déjà payé
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {facturePreview.montantDejaPaye.toLocaleString('fr-FR')}
                      </Typography>
                      <Typography variant="caption">
                        FCFA
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                      <Typography variant="body2" color="text.secondary">
                        À réclamer
                      </Typography>
                      <Typography variant="h4" color="warning.main">
                        {facturePreview.montantReclame.toLocaleString('fr-FR')}
                      </Typography>
                      <Typography variant="caption">
                        FCFA
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Liste des prestations */}
                <Typography variant="subtitle1" gutterBottom>
                  Détail des {facturePreview.nombrePrestations} prestations
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Patient</strong></TableCell>
                        <TableCell><strong>Prestation</strong></TableCell>
                        <TableCell align="right"><strong>Montant (FCFA)</strong></TableCell>
                        <TableCell align="right"><strong>Déjà payé (FCFA)</strong></TableCell>
                        <TableCell align="right"><strong>À réclamer (FCFA)</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {facturePreview.prestations.map((prestation, index) => (
                        <TableRow key={prestation.id}>
                          <TableCell>
                            {prestation.patient_nom} {prestation.patient_prenom}
                          </TableCell>
                          <TableCell>{prestation.type_prestation}</TableCell>
                          <TableCell align="right">
                            {(prestation.montant || 0).toLocaleString('fr-FR')}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'success.main' }}>
                            {(prestation.montant_paye || 0).toLocaleString('fr-FR')}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                            {((prestation.montant || 0) - (prestation.montant_paye || 0)).toLocaleString('fr-FR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button onClick={() => setStep(1)}>
                    Retour pour modifications
                  </Button>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={handlePrintFacture}
                    >
                      Prévisualiser
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircleIcon />}
                      onClick={handleGenerateFacture}
                      disabled={generating}
                    >
                      {generating ? 'Génération...' : 'Générer la facture'}
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Paper elevation={2}>
      {/* Stepper */}
      <Box sx={{ px: 3, pt: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Stepper activeStep={step} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Contenu de l'étape */}
      {renderStepContent()}

      {/* Dialog de confirmation */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" />
            Facture générée avec succès
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            La facture a été générée et enregistrée dans le système.
          </Alert>
          <Typography variant="body2" paragraph>
            Vous pouvez maintenant :
          </Typography>
          <ul>
            <li>Imprimer la facture</li>
            <li>Envoyer la facture par email</li>
            <li>Suivre le statut du paiement</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>
            Fermer
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrintFacture}
          >
            Imprimer la facture
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default GenerationFacture;