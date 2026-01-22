// components/PaymentDialog.jsx
import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  Divider,
  FormControlLabel,
  Checkbox,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import {
  LocalAtm as CashIcon,
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  Smartphone as MobileIcon,
  Payment as PaymentIcon,
  AccountBalanceWallet as WalletIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';

// Fonction utilitaire pour valider et formater les données
const validateData = (data, type = 'transaction') => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }
  
  if (type === 'transaction') {
    return {
      COD_TRANS: data.COD_TRANS || data.id || null,
      REFERENCE_TRANSACTION: data.REFERENCE_TRANSACTION || data.reference || 'N/A',
      BENEFICIAIRE: data.BENEFICIAIRE || data.NOM_BEN || 'N/A',
      DATE_INITIATION: data.DATE_INITIATION || data.date_initiation,
      MONTANT: data.MONTANT || data.montant || 0,
      STATUT_TRANSACTION: data.STATUT_TRANSACTION || data.statut || 'N/A',
      METHODE_PAIEMENT: data.METHODE_PAIEMENT || data.methode,
      TYPE_TRANSACTION: data.TYPE_TRANSACTION || data.type_transaction,
      CANAL: data.CANAL || data.canal,
      NUMERO_FACTURE: data.NUMERO_FACTURE || data.numero_facture,
      NOM_CLIENT: data.NOM_CLIENT || data.nom_client,
      MOYEN_PAIEMENT: data.MOYEN_PAIEMENT || data.moyen_paiement,
      DESCRIPTION: data.DESCRIPTION || data.description,
      ...data
    };
  } else {
    return {
      id: data.id || data.COD_FACTURE || null,
      numero: data.numero || data.numero_facture || 'N/A',
      numero_facture: data.numero_facture || data.numero || 'N/A',
      nom_ben: data.nom_ben || data.NOM_BEN || '',
      prenom_ben: data.prenom_ben || data.PRE_BEN || '',
      date_echeance: data.date_echeance || data.DATE_ECHEANCE,
      date_facture: data.date_facture || data.DATE_FACTURE,
      montant_total: data.montant_total || data.MONTANT_TOTAL || 0,
      montant_restant: data.montant_restant || data.MONTANT_RESTANT || 0,
      statut: data.statut || 'N/A',
      telephone: data.telephone || data.TELEPHONE,
      ...data
    };
  }
};

const PaymentDialog = ({ open, type, data, onClose, onSubmit, loading }) => {
  // ==================== ÉTATS ====================
  const [formData, setFormData] = useState({
    method: 'Espèces',
    montant: 0,
    reference: '',
    observations: '',
    numeroTelephone: '',
    notifierClient: true
  });

  const [modeManuel, setModeManuel] = useState(false);
  const [manuelData, setManuelData] = useState({
    factureId: '',
    numeroFacture: ''
  });

  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [clientInfo, setClientInfo] = useState(null);
  const [montantRestant, setMontantRestant] = useState(0);
  const [debugMode, setDebugMode] = useState(false);

  const paymentMethods = [
    { value: 'Espèces', label: 'Espèces', icon: <CashIcon /> },
    { value: 'MobileMoney', label: 'Mobile Money', icon: <MobileIcon />, requirePhone: true },
    { value: 'CarteBancaire', label: 'Carte Bancaire', icon: <CardIcon /> },
    { value: 'Virement', label: 'Virement Bancaire', icon: <BankIcon /> },
    { value: 'Chèque', label: 'Chèque', icon: <WalletIcon /> }
  ];

  // ==================== FONCTIONS UTILITAIRES ====================

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const generateReference = () => {
    const prefix = type === 'facture' ? 'PAY-FACT' : 'PAY-REM';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  // ==================== EXTRACTION DES DONNÉES ====================

  const extractFactureInfo = (rawData) => {
    console.log('🔍 EXTRACTION - Données brutes:', rawData);
    
    try {
      if (!rawData) {
        return {
          error: 'Aucune donnée fournie',
          factureId: null,
          numeroFacture: null,
          montantTotal: 0,
          montantPaye: 0,
          montantRestant: 0,
          nom: 'N/A',
          prenom: '',
          telephone: '',
          beneficiaireId: null,
          estDejaPayee: false,
          reference: 'N/A'
        };
      }

      // Chercher l'ID de la facture
      const factureId = rawData.COD_FACTURE || 
                       rawData.id || 
                       rawData.factureId || 
                       rawData.ID_FACTURE ||
                       rawData.cod_facture;

      // Chercher le numéro de facture
      const numeroFacture = rawData.NUMERO_FACTURE || 
                           rawData.numero || 
                           rawData.numero_facture ||
                           rawData.numeroFacture;

      // Extraire les montants
      const montantTotal = parseFloat(rawData.MONTANT_TOTAL || 
                                     rawData.montant_total || 
                                     rawData.montantTotal || 0);
      
      const montantPaye = parseFloat(rawData.MONTANT_PAYE || 
                                    rawData.montant_paye || 
                                    rawData.montantPaye || 0);
      
      const montantRestant = parseFloat(rawData.MONTANT_RESTANT || 
                                       rawData.montant_restant || 
                                       rawData.montantRestant || 
                                       Math.max(0, montantTotal - montantPaye));

      // Infos bénéficiaire
      const nom = rawData.NOM_BEN || rawData.nom_ben || rawData.nom || 'N/A';
      const prenom = rawData.PRENOM_BEN || rawData.prenom_ben || rawData.prenom || '';
      const telephone = rawData.TELEPHONE || rawData.telephone || rawData.phone || '';
      const beneficiaireId = rawData.COD_BEN || rawData.cod_ben || rawData.beneficiaryId;

      const estDejaPayee = montantRestant <= 0;
      const reference = numeroFacture || (factureId ? `FACT-${factureId}` : 'FACT-INCONNUE');

      const result = {
        type: 'facture',
        factureId: factureId ? parseInt(factureId) : null,
        numeroFacture,
        beneficiaireId,
        reference,
        nom,
        prenom,
        telephone,
        montantTotal,
        montantPaye,
        montantRestant,
        estDejaPayee,
        rawData: rawData
      };

      console.log('✅ RÉSULTATS EXTRACTION:', result);
      return result;

    } catch (error) {
      console.error('❌ ERREUR EXTRACTION:', error);
      return {
        error: `Erreur technique: ${error.message}`,
        factureId: null,
        numeroFacture: null,
        montantRestant: 0,
        nom: 'N/A',
        reference: 'ERREUR'
      };
    }
  };

  // ==================== EFFET D'INITIALISATION ====================
  useEffect(() => {
    if (open) {
      console.log('🚀 PAYMENT DIALOG OUVERT - Type:', type, 'Données:', data);
      
      // Réinitialisation
      setErrors({});
      setProcessing(false);
      
      // Générer une nouvelle référence
      const newReference = generateReference();
      setFormData(prev => ({
        ...prev,
        reference: newReference,
        method: 'Espèces',
        montant: 0,
        observations: '',
        numeroTelephone: '',
        notifierClient: true
      }));

      if (data) {
        const validatedData = validateData(data, 'facture');
        const extractedInfo = extractFactureInfo(validatedData);
        console.log('🔍 Info extraite:', extractedInfo);

        setClientInfo(extractedInfo);
        
        // Définir le montant restant
        const montantRest = extractedInfo.montantRestant || 0;
        setMontantRestant(montantRest);

        // Vérifier les identifiants
        const hasValidId = extractedInfo.factureId && extractedInfo.factureId > 0;
        const hasValidNumero = extractedInfo.numeroFacture && extractedInfo.numeroFacture.trim() !== '';
        
        console.log('🔍 VÉRIFICATION IDENTIFIANTS:', {
          hasValidId,
          hasValidNumero,
          factureId: extractedInfo.factureId,
          numeroFacture: extractedInfo.numeroFacture
        });

        if (!hasValidId && !hasValidNumero) {
          console.warn('❌ AUCUN IDENTIFIANT VALIDE - Activation mode manuel');
          setModeManuel(true);
          setErrors({ 
            INFO: 'Aucun identifiant de facture trouvé. Veuillez saisir manuellement.' 
          });
        } else {
          setModeManuel(false);
          
          // Pré-remplir le formulaire
          setFormData(prev => ({
            ...prev,
            montant: montantRest > 0 ? montantRest : 0,
            reference: newReference,
            numeroTelephone: extractedInfo.telephone || ''
          }));
        }
      } else {
        // Mode manuel par défaut si pas de données
        setModeManuel(true);
        setClientInfo(null);
        setMontantRestant(0);
      }
    }
  }, [open, data, type]);

  // ==================== VALIDATION ====================

  const validateForm = () => {
    const newErrors = {};
    
    if (type === 'facture') {
      if (modeManuel) {
        const hasManualId = manuelData.factureId && manuelData.factureId.trim() !== '';
        const hasManualNumero = manuelData.numeroFacture && manuelData.numeroFacture.trim() !== '';
        
        if (!hasManualId && !hasManualNumero) {
          newErrors.MANUAL = 'Veuillez saisir soit l\'ID de la facture, soit le numéro de facture';
        }
        
        if (hasManualId) {
          const idNum = parseInt(manuelData.factureId);
          if (isNaN(idNum) || idNum <= 0) {
            newErrors.MANUAL_ID = 'L\'ID de facture doit être un nombre positif';
          }
        }
      } else if (clientInfo) {
        const hasValidIdentifier = (clientInfo.factureId && clientInfo.factureId > 0) || 
                                  (clientInfo.numeroFacture && clientInfo.numeroFacture.trim() !== '');
        
        if (!hasValidIdentifier) {
          newErrors.GENERAL = 'Informations de facture incomplètes. Veuillez activer le mode manuel.';
        }
        
        if (clientInfo.estDejaPayee) {
          newErrors.GENERAL = 'Cette facture est déjà entièrement payée.';
        }
      }
    }
    
    if (!formData.method) {
      newErrors.method = 'Méthode de paiement requise';
    }
    
    if (formData.montant <= 0) {
      newErrors.montant = 'Le montant doit être supérieur à 0';
    } else if (clientInfo && type === 'facture' && clientInfo.montantRestant > 0) {
      if (formData.montant > clientInfo.montantRestant) {
        newErrors.montant = `Le montant ne peut pas dépasser ${formatCurrency(clientInfo.montantRestant)}`;
      }
    }
    
    if (!formData.reference.trim()) {
      newErrors.reference = 'Référence requise';
    }
    
    if (formData.method === 'MobileMoney' && !formData.numeroTelephone) {
      newErrors.numeroTelephone = 'Numéro de téléphone requis pour Mobile Money';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==================== CONSTRUCTION DE LA REQUÊTE ====================

  const buildRequestData = () => {
    let requestData = {
      // Champs de base
      method: formData.method,
      montant: formData.montant,
      reference: formData.reference,
      observations: formData.observations,
      notifierClient: formData.notifierClient,
      typeTransaction: type,
    };

    if (type === 'facture') {
      let factureIdToSend = null;
      let numeroFactureToSend = null;

      if (modeManuel) {
        if (manuelData.factureId && manuelData.factureId.trim() !== '') {
          const idNum = parseInt(manuelData.factureId);
          if (!isNaN(idNum) && idNum > 0) {
            factureIdToSend = idNum;
          }
        }
        
        if (manuelData.numeroFacture && manuelData.numeroFacture.trim() !== '') {
          numeroFactureToSend = manuelData.numeroFacture;
        }
      } else if (clientInfo) {
        factureIdToSend = clientInfo.factureId;
        numeroFactureToSend = clientInfo.numeroFacture;
      }

      // VÉRIFICATION CRITIQUE - S'assurer qu'on a un ID
      if (!factureIdToSend && !numeroFactureToSend) {
        throw new Error('Aucun identifiant de facture valide trouvé.');
      }

      // Ajouter l'ID facture sous les noms attendus par l'API
      if (factureIdToSend) {
        requestData.factureId = factureIdToSend;
        requestData.COD_FACTURE = factureIdToSend;
      }

      // Ajouter le numéro de facture
      if (numeroFactureToSend) {
        requestData.numeroFacture = numeroFactureToSend;
      }

      console.log('📤 DONNÉES FACTURE POUR L\'API:', {
        factureId: requestData.factureId,
        COD_FACTURE: requestData.COD_FACTURE,
        numeroFacture: requestData.numeroFacture
      });
      
    } else if (type === 'remboursement') {
      if (clientInfo?.declarationId) {
        requestData.declarationId = clientInfo.declarationId;
      }
      if (clientInfo?.beneficiaireId) {
        requestData.codBen = clientInfo.beneficiaireId;
      }
    }

    // Champs spécifiques à la méthode
    if (formData.method === 'MobileMoney' && formData.numeroTelephone) {
      requestData.numeroTelephone = formData.numeroTelephone;
    }

    return requestData;
  };

  // ==================== SOUMISSION ====================

  const handleSubmit = async () => {
    try {
      console.log('📤 Début de la soumission du paiement');
      
      // Validation
      if (!validateForm()) {
        console.warn('❌ Validation échouée:', errors);
        return;
      }

      setProcessing(true);
      setErrors({});

      // Construire la requête
      const requestData = buildRequestData();
      
      // Log COMPLET de la requête
      console.log('📤 REQUÊTE COMPLÈTE POUR L\'API:', JSON.stringify(requestData, null, 2));
      console.log('🔍 Détails critiques:');
      console.log('   - factureId:', requestData.factureId);
      console.log('   - COD_FACTURE:', requestData.COD_FACTURE);
      console.log('   - type:', requestData.typeTransaction);
      console.log('   - montant:', requestData.montant);

      // Appel de l'API via la fonction onSubmit passée en prop
      console.log('🚀 Appel de onSubmit avec les données...');
      await onSubmit(requestData);
      
    } catch (error) {
      console.error('❌ ERREUR lors de la soumission:', error);
      setErrors({ 
        SUBMIT: error.message || 'Une erreur est survenue lors du traitement.' 
      });
    } finally {
      setProcessing(false);
    }
  };

  // ==================== HANDLERS ====================

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    
    if (field === 'montant') {
      const numericValue = parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [field]: numericValue }));
    } else if (field === 'numeroTelephone') {
      const cleaned = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [field]: cleaned }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Effacer les erreurs
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleManualDataChange = (field) => (event) => {
    const value = event.target.value;
    
    if (field === 'factureId') {
      const cleaned = value.replace(/\D/g, '');
      setManuelData(prev => ({ ...prev, [field]: cleaned }));
    } else {
      setManuelData(prev => ({ ...prev, [field]: value }));
    }
    
    if (errors.MANUAL || errors.MANUAL_ID) {
      setErrors(prev => ({ ...prev, MANUAL: null, MANUAL_ID: null }));
    }
  };

  const toggleModeManuel = () => {
    setModeManuel(!modeManuel);
    setErrors({});
  };

  // ==================== RENDU ====================

  const getTitle = () => {
    if (modeManuel) {
      return `Paiement manuel ${type === 'facture' ? 'de facture' : 'de remboursement'}`;
    }
    
    if (!clientInfo) {
      return type === 'facture' ? 'Nouveau paiement de facture' : 'Nouveau remboursement';
    }
    
    if (type === 'facture') {
      return clientInfo.estDejaPayee 
        ? `Facture ${clientInfo.reference} - Déjà payée`
        : `Payer la facture ${clientInfo.reference}`;
    }
    
    return `Payer le remboursement ${clientInfo.reference}`;
  };

  const renderClientInfo = () => {
    if (modeManuel) {
      return (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon />
            <Typography fontWeight="bold">
              Mode manuel activé
            </Typography>
          </Box>
          <Typography variant="body2">
            Veuillez saisir les informations de la facture.
          </Typography>
          {clientInfo && (
            <Button 
              size="small" 
              onClick={toggleModeManuel}
              sx={{ mt: 1 }}
            >
              Revenir au mode automatique
            </Button>
          )}
        </Alert>
      );
    }

    if (errors.GENERAL || errors.INFO) {
      return (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {errors.GENERAL || errors.INFO}
          </Typography>
          <Button 
            size="small" 
            onClick={toggleModeManuel}
            sx={{ mt: 1 }}
          >
            Passer en mode manuel
          </Button>
        </Alert>
      );
    }

    if (!clientInfo || clientInfo.error) {
      return (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {clientInfo?.error || 'Aucune donnée client trouvée.'}
          </Typography>
          <Button 
            size="small" 
            onClick={toggleModeManuel}
            sx={{ mt: 1 }}
          >
            Utiliser le mode manuel
          </Button>
        </Alert>
      );
    }

    if (clientInfo.estDejaPayee) {
      return (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircleIcon />
            <Typography fontWeight="bold">
              Facture déjà payée
            </Typography>
          </Box>
          <Typography variant="body2">
            La facture {clientInfo.reference} est entièrement payée.
          </Typography>
        </Alert>
      );
    }

    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography fontWeight="bold" gutterBottom>
          Facture: {clientInfo.reference}
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Typography variant="body2">
              <strong>Bénéficiaire:</strong> {clientInfo.nom} {clientInfo.prenom}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">
              <strong>Total:</strong> {formatCurrency(clientInfo.montantTotal)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">
              <strong>Payé:</strong> {formatCurrency(clientInfo.montantPaye)}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" fontWeight="bold" color="primary">
              Reste à payer: {formatCurrency(clientInfo.montantRestant)}
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          {clientInfo.factureId && (
            <Chip 
              label={`ID: ${clientInfo.factureId}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {clientInfo.numeroFacture && (
            <Chip 
              label={`N°: ${clientInfo.numeroFacture}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
        </Box>
      </Alert>
    );
  };

  const isProcessing = loading || processing;
  const estEntierementPaye = modeManuel ? false : (clientInfo ? clientInfo.estDejaPayee : false);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        py: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <PaymentIcon />
        <Typography variant="h6" fontWeight="bold">
          {getTitle()}
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        {/* Messages d'erreur/succès */}
        {errors.SUCCESS && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography>{errors.SUCCESS}</Typography>
          </Alert>
        )}
        
        {errors.SUBMIT && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography>{errors.SUBMIT}</Typography>
          </Alert>
        )}
        
        {/* Informations client */}
        {renderClientInfo()}
        
        {/* Section mode manuel */}
        {modeManuel && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Saisie manuelle
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ID Facture"
                  value={manuelData.factureId}
                  onChange={handleManualDataChange('factureId')}
                  placeholder="2015"
                  error={!!errors.MANUAL_ID}
                  helperText={errors.MANUAL_ID || "Numérique uniquement"}
                  disabled={isProcessing}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Numéro de Facture"
                  value={manuelData.numeroFacture}
                  onChange={handleManualDataChange('numeroFacture')}
                  placeholder="FACT-2026-891722-6827"
                  disabled={isProcessing}
                  size="small"
                />
              </Grid>
            </Grid>
            
            {errors.MANUAL && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.MANUAL}
              </Alert>
            )}
          </Paper>
        )}
        
        {/* Formulaire de paiement */}
        {!estEntierementPaye && (modeManuel || (clientInfo && clientInfo.montantRestant > 0)) && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Détails du paiement
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.method} size="small">
                  <InputLabel>Méthode de paiement</InputLabel>
                  <Select
                    value={formData.method}
                    label="Méthode de paiement"
                    onChange={handleChange('method')}
                    disabled={isProcessing}
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method.value} value={method.value}>
                        <Box display="flex" alignItems="center" gap={2}>
                          {method.icon}
                          {method.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Montant (XAF)"
                  type="number"
                  value={formData.montant}
                  onChange={handleChange('montant')}
                  error={!!errors.montant}
                  helperText={errors.montant || `Maximum: ${formatCurrency(montantRestant)}`}
                  disabled={isProcessing}
                  size="small"
                  InputProps={{
                    inputProps: { min: 0, max: montantRestant }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Référence"
                  value={formData.reference}
                  onChange={handleChange('reference')}
                  error={!!errors.reference}
                  disabled={isProcessing}
                  size="small"
                />
              </Grid>
              
              {formData.method === 'MobileMoney' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Numéro de téléphone"
                    value={formData.numeroTelephone}
                    onChange={handleChange('numeroTelephone')}
                    error={!!errors.numeroTelephone}
                    disabled={isProcessing}
                    size="small"
                    placeholder="65889685"
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observations"
                  multiline
                  rows={2}
                  value={formData.observations}
                  onChange={handleChange('observations')}
                  disabled={isProcessing}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.notifierClient}
                      onChange={(e) => setFormData(prev => ({ ...prev, notifierClient: e.target.checked }))}
                      disabled={isProcessing}
                    />
                  }
                  label="Notifier le client"
                />
              </Grid>
            </Grid>
            
            {/* Section débogage */}
            {debugMode && (
              <Box sx={{ mt: 3 }}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <BugReportIcon />
                      <Typography>Débogage</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="caption" component="div">
                      <strong>Données reçues:</strong>
                      <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '100px' }}>
                        {JSON.stringify(data, null, 2)}
                      </pre>
                      
                      <strong>Données extraites:</strong>
                      <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '100px' }}>
                        {JSON.stringify(clientInfo, null, 2)}
                      </pre>
                      
                      <strong>Données formulaire:</strong>
                      <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '100px' }}>
                        {JSON.stringify(formData, null, 2)}
                      </pre>
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Box>
            <Button onClick={() => setDebugMode(!debugMode)} size="small">
              {debugMode ? 'Masquer débogage' : 'Débogage'}
            </Button>
          </Box>
          
          <Box>
            <Button 
              onClick={onClose}
              disabled={isProcessing}
              sx={{ mr: 2 }}
            >
              Annuler
            </Button>
            
            {!estEntierementPaye && (modeManuel || (clientInfo && clientInfo.montantRestant > 0)) && (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isProcessing}
                startIcon={isProcessing ? <CircularProgress size={20} /> : <PaymentIcon />}
              >
                {isProcessing ? 'Traitement...' : 'Payer'}
              </Button>
            )}
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;