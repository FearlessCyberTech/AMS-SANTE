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
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Divider,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  LocalAtm as CashIcon,
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  Smartphone as MobileIcon,
  Payment as PaymentIcon,
  AccountBalanceWallet as WalletIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { facturationAPI, remboursementsAPI } from '../../services/api';

const PaymentDialog = ({ open, type, data, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    method: 'Espèces',
    montant: 0,
    reference: '',
    observations: '',
    numeroTelephone: '',
    numeroCarte: '',
    dateExpiration: '',
    cvv: '',
    numeroCompte: '',
    notifierClient: true
  });

  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [clientInfo, setClientInfo] = useState(null);
  const [montantRestant, setMontantRestant] = useState(0);

  useEffect(() => {
    if (open) {
      // Réinitialiser
      setErrors({});
      setProcessing(false);
      
      let montant = 0;
      let clientData = null;
      let montantRestantCalcul = 0;
      
      try {
        if (data) {
          console.log('📋 Données complètes reçues:', data);
          
          if (type === 'facture') {
            // EXTRAIRE L'ID DE FACTURE CORRECTEMENT
            const factureId = data.COD_FACT || data.id || data.facture_id || data.cod_fact;
            
            console.log('🔍 Extraction ID facture:', { 
              COD_FACT: data.COD_FACT,
              id: data.id,
              facture_id: data.facture_id,
              cod_fact: data.cod_fact,
              résultat: factureId
            });
            
            if (!factureId) {
              throw new Error('ID de facture manquant dans les données');
            }
            
            const montantTotal = parseFloat(data.MONTANT_TOTAL || data.montant_total || 0);
            const montantPaye = parseFloat(data.MONTANT_PAYE || data.montant_paye || 0);
            montantRestantCalcul = montantTotal - montantPaye;
            
            montant = montantRestantCalcul > 0 ? montantRestantCalcul : montantTotal;
            
            clientData = {
              type: 'facture',
              factureId: factureId, // Ne pas convertir en entier si ce n'est pas nécessaire
              beneficiaireId: data.COD_BEN || data.beneficiaire_id,
              reference: data.NUMERO_FACTURE || data.numero || `FACT-${factureId}`,
              nom: data.NOM_BEN || data.nom_ben || 'N/A',
              prenom: data.PRE_BEN || data.prenom_ben || '',
              telephone: data.TELEPHONE_MOBILE || data.telephone || '',
              montantTotal,
              montantPaye,
              montantRestant: montantRestantCalcul,
              estDejaPayee: montantRestantCalcul <= 0
            };
            
          } else if (type === 'remboursement') {
            // EXTRAIRE L'ID DE DÉCLARATION
            const declarationId = data.COD_DECL || data.id || data.declaration_id || data.cod_decl;
            
            console.log('🔍 Extraction ID déclaration:', { 
              COD_DECL: data.COD_DECL,
              id: data.id,
              declaration_id: data.declaration_id,
              cod_decl: data.cod_decl,
              résultat: declarationId
            });
            
            if (!declarationId) {
              throw new Error('ID de déclaration manquant dans les données');
            }
            
            montantRestantCalcul = parseFloat(data.MONTANT_REMBOURSABLE || data.montant_remboursable || 0);
            montant = montantRestantCalcul;
            
            clientData = {
              type: 'remboursement',
              declarationId: declarationId, // Ne pas convertir en entier si ce n'est pas nécessaire
              beneficiaireId: data.COD_BEN || data.beneficiaire_id,
              reference: data.NUMERO_FACTURE || data.numero || `DECL-${declarationId}`,
              nom: data.NOM_BEN || data.nom_ben || 'N/A',
              prenom: data.PRE_BEN || data.prenom_ben || '',
              telephone: data.TELEPHONE_MOBILE || data.telephone || '',
              montantRemboursable: montantRestantCalcul,
              estDejaRembourse: montantRestantCalcul <= 0
            };
          }
        } else {
          // Paiement manuel
          clientData = {
            type: type || 'manuel',
            reference: `MANUEL-${Date.now()}`,
            nom: 'Client non spécifié',
            telephone: '',
            montantRestant: 0,
            montantRemboursable: 0,
            estDejaPayee: false,
            estDejaRembourse: false
          };
        }
        
        setClientInfo(clientData);
        setMontantRestant(montantRestantCalcul);
        
        if (clientData) {
          setFormData(prev => ({
            ...prev,
            montant: montant > 0 ? montant : 0,
            reference: generateReference(),
            numeroTelephone: clientData.telephone || ''
          }));
        }
        
      } catch (error) {
        console.error('❌ Erreur initialisation paiement:', error);
        setErrors({ GENERAL: error.message });
      }
    }

    loadPaymentMethods();
  }, [data, type, open]);

  const loadPaymentMethods = async () => {
    try {
      // Méthodes de paiement standards selon la BD
      const methods = [
        { value: 'Espèces', label: 'Espèces', icon: <CashIcon /> },
        { value: 'MobileMoney', label: 'Mobile Money', icon: <MobileIcon />, requirePhone: true },
        { value: 'CarteBancaire', label: 'Carte Bancaire', icon: <CardIcon />, requireCard: true },
        { value: 'Virement', label: 'Virement Bancaire', icon: <BankIcon />, requireAccount: true },
        { value: 'Chèque', label: 'Chèque', icon: <WalletIcon /> }
      ];
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Erreur chargement méthodes paiement:', error);
    }
  };

  const generateReference = () => {
    const prefix = type === 'facture' ? 'PAY-FACT' : 'PAY-REM';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    return `${prefix}-${date}-${random}`;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validation générale pour les types facture/remboursement
    if (type === 'facture' && (!clientInfo || !clientInfo.factureId)) {
      newErrors.GENERAL = 'ID de facture manquant. Impossible de procéder au paiement.';
    }
    
    if (type === 'remboursement' && (!clientInfo || !clientInfo.declarationId)) {
      newErrors.GENERAL = 'ID de déclaration manquant. Impossible de procéder au remboursement.';
    }
    
    // Vérifier si déjà payé/remboursé
    if (type === 'facture' && clientInfo?.estDejaPayee) {
      newErrors.GENERAL = 'Cette facture est déjà entièrement payée. Aucun paiement supplémentaire requis.';
    }
    
    if (type === 'remboursement' && clientInfo?.estDejaRembourse) {
      newErrors.GENERAL = 'Cette déclaration est déjà entièrement remboursée. Aucun paiement supplémentaire requis.';
    }
    
    if (!formData.method) {
      newErrors.method = 'Méthode de paiement requise';
    }
    
    if (formData.montant <= 0) {
      newErrors.montant = 'Le montant doit être supérieur à 0';
    } else if (clientInfo) {
      const maxAmount = type === 'facture' 
        ? clientInfo.montantRestant
        : clientInfo.montantRemboursable;
      
      if (formData.montant > maxAmount) {
        newErrors.montant = `Le montant ne peut pas dépasser ${formatCurrency(maxAmount)}`;
      }
    }
    
    if (!formData.reference.trim()) {
      newErrors.reference = 'Référence requise';
    }
    
    // Validation spécifique selon la méthode
    if (formData.method === 'MobileMoney' && !formData.numeroTelephone) {
      newErrors.numeroTelephone = 'Numéro de téléphone requis pour Mobile Money';
    } else if (formData.method === 'MobileMoney' && formData.numeroTelephone) {
      const phoneRegex = /^[67]\d{8}$/;
      if (!phoneRegex.test(formData.numeroTelephone)) {
        newErrors.numeroTelephone = 'Numéro de téléphone invalide (format: 6XXXXXXX ou 7XXXXXXX)';
      }
    }
    
    if (formData.method === 'CarteBancaire') {
      if (!formData.numeroCarte) {
        newErrors.numeroCarte = 'Numéro de carte requis';
      } else if (!/^\d{16}$/.test(formData.numeroCarte.replace(/\s/g, ''))) {
        newErrors.numeroCarte = 'Numéro de carte invalide (16 chiffres requis)';
      }
      
      if (!formData.dateExpiration) {
        newErrors.dateExpiration = 'Date d\'expiration requise';
      }
      
      if (!formData.cvv) {
        newErrors.cvv = 'CVV requis';
      } else if (!/^\d{3,4}$/.test(formData.cvv)) {
        newErrors.cvv = 'CVV invalide (3 ou 4 chiffres)';
      }
    }
    
    if (formData.method === 'Virement' && !formData.numeroCompte) {
      newErrors.numeroCompte = 'Numéro de compte requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  setProcessing(true);
  
  try {
    // Préparer les données selon le type de transaction
    let paymentRequest = {};
    
    if (type === 'facture') {
      // Structure pour les factures - CORRECTION ICI
      paymentRequest = {
        // Le backend attend "factureId" et non "COD_FACT"
        factureId: clientInfo?.factureId,
        // Conserver les autres champs pour compatibilité
        COD_FACT: clientInfo?.factureId,
        COD_BEN: clientInfo?.beneficiaireId,
        METHODE: formData.method,
        MONTANT: parseFloat(formData.montant),
        montant: parseFloat(formData.montant), // Ajouter aussi en minuscule
        reference: formData.reference,
        REFERENCE_PAIEMENT: formData.reference,
        OBSERVATIONS: formData.observations,
        NOTIFIER_CLIENT: formData.notifierClient,
        // Informations supplémentaires selon la méthode de paiement
        NUMERO_TELEPHONE: formData.method === 'MobileMoney' ? formData.numeroTelephone : null,
        NUMERO_CARTE: formData.method === 'CarteBancaire' ? formData.numeroCarte.replace(/\s/g, '') : null,
        DATE_EXPIRATION: formData.method === 'CarteBancaire' ? formData.dateExpiration : null,
        CVV: formData.method === 'CarteBancaire' ? formData.cvv : null,
        NUMERO_COMPTE: formData.method === 'Virement' ? formData.numeroCompte : null,
        method: formData.method, // Ajouter en minuscule aussi
        observations: formData.observations,
        notifierClient: formData.notifierClient
      };
    } else if (type === 'remboursement') {
      // Structure pour les remboursements
      paymentRequest = {
        // CORRECTION : Le backend pour les remboursements attend probablement "declarationId"
        declarationId: clientInfo?.declarationId,
        COD_DECL: clientInfo?.declarationId,
        COD_BEN: clientInfo?.beneficiaireId,
        METHODE: formData.method,
        method: formData.method,
        MONTANT: parseFloat(formData.montant),
        montant: parseFloat(formData.montant),
        REFERENCE_PAIEMENT: formData.reference,
        reference: formData.reference,
        OBSERVATIONS: formData.observations,
        observations: formData.observations,
        NOTIFIER_CLIENT: formData.notifierClient,
        notifierClient: formData.notifierClient,
        // Informations supplémentaires selon la méthode de paiement
        NUMERO_TELEPHONE: formData.method === 'MobileMoney' ? formData.numeroTelephone : null,
        NUMERO_CARTE: formData.method === 'CarteBancaire' ? formData.numeroCarte.replace(/\s/g, '') : null,
        DATE_EXPIRATION: formData.method === 'CarteBancaire' ? formData.dateExpiration : null,
        CVV: formData.method === 'CarteBancaire' ? formData.cvv : null,
        NUMERO_COMPTE: formData.method === 'Virement' ? formData.numeroCompte : null
      };
    }

    console.log('📤 Données envoyées au paiement:', JSON.stringify(paymentRequest, null, 2));

      // Appel API avec timeout
      let response;
      const apiTimeout = 30000; // 30 secondes
      const maxRetries = 2;
      let lastError;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Tentative ${attempt + 1}/${maxRetries + 1}`);
          
          if (type === 'facture') {
            response = await Promise.race([
              facturationAPI.initierPaiement(paymentRequest),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout: Le serveur ne répond pas (30s)')), apiTimeout)
              )
            ]);
          } else {
            response = await Promise.race([
              remboursementsAPI.initierPaiement(paymentRequest),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout: Le serveur ne répond pas (30s)')), apiTimeout)
              )
            ]);
          }
          
          break; // Sortir de la boucle si réussite
        } catch (error) {
          lastError = error;
          console.warn(`⚠️ Tentative ${attempt + 1} échouée:`, error.message);
          
          if (attempt < maxRetries) {
            // Attendre avant de réessayer (backoff exponentiel)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
            continue;
          }
        }
      }

      if (!response && lastError) {
        throw lastError;
      }

      console.log('📥 Réponse reçue:', response);

      if (response && response.success) {
        setErrors({ SUCCESS: response.message || 'Paiement initié avec succès!' });
        
        if (onSubmit && typeof onSubmit === 'function') {
          onSubmit(response);
        }
        
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setErrors({ 
          SUBMIT: response?.message || 'Erreur lors du paiement. Veuillez réessayer.' 
        });
      }
    } catch (error) {
      console.error('❌ Erreur finale:', error);
      
      let errorMessage = error.message || 'Erreur lors du traitement du paiement.';
      
      // Messages d'erreur plus clairs
      if (error.message.includes('Timeout')) {
        errorMessage = 'Le serveur ne répond pas dans le délai imparti. Vérifiez:';
        errorMessage += '\n1. Votre connexion internet';
        errorMessage += '\n2. Que le serveur backend est en marche';
        errorMessage += '\n3. Les logs du serveur pour les erreurs';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Erreur réseau. Impossible de contacter le serveur.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Endpoint API non trouvé. Vérifiez la configuration.';
      } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
        errorMessage = 'Données invalides. Vérifiez les informations saisies.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Erreur interne du serveur. Contactez l\'administrateur.';
      }
      
      setErrors({ SUBMIT: errorMessage });
    } finally {
      setProcessing(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    
    if (field === 'montant') {
      const numericValue = parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [field]: numericValue }));
      
      // Effacer l'erreur montant s'il y en a
      if (errors.montant) {
        setErrors(prev => ({ ...prev, montant: null }));
      }
    } else if (field === 'numeroTelephone') {
      // Nettoyer le numéro de téléphone
      const cleaned = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [field]: cleaned }));
      
      if (errors.numeroTelephone) {
        setErrors(prev => ({ ...prev, numeroTelephone: null }));
      }
    } else if (field === 'numeroCarte') {
      // Formater le numéro de carte (groupes de 4)
      const cleaned = value.replace(/\D/g, '');
      const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
      setFormData(prev => ({ ...prev, [field]: formatted }));
      
      if (errors.numeroCarte) {
        setErrors(prev => ({ ...prev, numeroCarte: null }));
      }
    } else if (field === 'dateExpiration') {
      // Formater MM/AA
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      if (cleaned.length >= 2) {
        formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
      }
      setFormData(prev => ({ ...prev, [field]: formatted }));
      
      if (errors.dateExpiration) {
        setErrors(prev => ({ ...prev, dateExpiration: null }));
      }
    } else if (field === 'cvv') {
      const cleaned = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, [field]: cleaned }));
      
      if (errors.cvv) {
        setErrors(prev => ({ ...prev, cvv: null }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Effacer l'erreur correspondante
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }));
      }
    }
    
    // Effacer les erreurs générales
    if (errors.GENERAL || errors.SUBMIT || errors.SUCCESS) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.GENERAL;
        delete newErrors.SUBMIT;
        delete newErrors.SUCCESS;
        return newErrors;
      });
    }
  };

  const getTitle = () => {
    if (!clientInfo) {
      return type === 'facture' ? 'Nouveau paiement de facture' : 'Nouveau remboursement';
    }
    
    if (type === 'facture') {
      return `Payer la facture ${clientInfo.reference}`;
    } else {
      return `Payer le remboursement ${clientInfo.reference}`;
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('fr-FR');
    } catch {
      return 'N/A';
    }
  };

  const renderClientInfo = () => {
    if (errors.GENERAL) {
      return (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {errors.GENERAL}
          </Typography>
        </Alert>
      );
    }

    if (!clientInfo) {
      return (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Aucune donnée client spécifique. Veuillez remplir manuellement les informations de paiement.
          </Typography>
        </Alert>
      );
    }

    // Vérifier si déjà entièrement payé/remboursé
    const estEntierementPaye = type === 'facture' 
      ? clientInfo.estDejaPayee 
      : clientInfo.estDejaRembourse;

    if (estEntierementPaye) {
      return (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircleIcon />
            <Typography fontWeight="bold">
              {type === 'facture' ? 'Facture déjà payée' : 'Remboursement déjà effectué'}
            </Typography>
          </Box>
          <Typography variant="body2">
            {type === 'facture' 
              ? `La facture ${clientInfo.reference} est entièrement payée.`
              : `La déclaration ${clientInfo.reference} est entièrement remboursée.`
            }
          </Typography>
          {type === 'facture' ? (
            <>
              <Typography variant="body2">
                Montant total: {formatCurrency(clientInfo.montantTotal)}
              </Typography>
              <Typography variant="body2">
                Montant déjà payé: {formatCurrency(clientInfo.montantPaye)}
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="success.main">
                Reste à payer: {formatCurrency(clientInfo.montantRestant)}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body2">
                Montant remboursable: {formatCurrency(clientInfo.montantRemboursable)}
              </Typography>
            </>
          )}
        </Alert>
      );
    }

    if (type === 'facture') {
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
            {clientInfo.date && (
              <Grid item xs={12}>
                <Typography variant="body2">
                  <strong>Date facture:</strong> {formatDate(clientInfo.date)}
                </Typography>
              </Grid>
            )}
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Montant total:</strong> {formatCurrency(clientInfo.montantTotal)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Déjà payé:</strong> {formatCurrency(clientInfo.montantPaye)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" color={clientInfo.montantRestant > 0 ? "primary" : "success.main"}>
                Reste à payer: {formatCurrency(clientInfo.montantRestant)}
              </Typography>
            </Grid>
          </Grid>
        </Alert>
      );
    } else {
      return (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography fontWeight="bold" gutterBottom>
            Déclaration: {clientInfo.reference}
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography variant="body2">
                <strong>Bénéficiaire:</strong> {clientInfo.nom} {clientInfo.prenom}
              </Typography>
            </Grid>
            {clientInfo.date && (
              <Grid item xs={12}>
                <Typography variant="body2">
                  <strong>Date déclaration:</strong> {formatDate(clientInfo.date)}
                </Typography>
              </Grid>
            )}
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Montant total:</strong> {formatCurrency(clientInfo.montantTotal)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Prise en charge:</strong> {formatCurrency(clientInfo.montantPriseCharge)}
              </Typography>
            </Grid>
            {clientInfo.montantTicket > 0 && (
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Ticket modérateur:</strong> {formatCurrency(clientInfo.montantTicket)}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" color="primary">
                Montant remboursable: {formatCurrency(clientInfo.montantRemboursable)}
              </Typography>
            </Grid>
          </Grid>
        </Alert>
      );
    }
  };

  const isProcessing = loading || processing;
  const estEntierementPaye = clientInfo ? 
    (type === 'facture' ? clientInfo.estDejaPayee : clientInfo.estDejaRembourse) : 
    false;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={2}>
          {estEntierementPaye ? <CheckCircleIcon color="success" /> : <PaymentIcon color="primary" />}
          <Typography variant="h6">
            {getTitle()}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
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
        
        {renderClientInfo()}
        
        {!estEntierementPaye && montantRestant > 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.method}>
                <InputLabel>Méthode de paiement</InputLabel>
                <Select
                  value={formData.method}
                  label="Méthode de paiement"
                  onChange={handleChange('method')}
                  disabled={isProcessing || !!errors.GENERAL}
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
                {errors.method && (
                  <Typography variant="caption" color="error">
                    {errors.method}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Montant"
                type="number"
                value={formData.montant}
                onChange={handleChange('montant')}
                error={!!errors.montant}
                helperText={errors.montant}
                disabled={isProcessing || !!errors.GENERAL}
                InputProps={{
                  endAdornment: <InputAdornment position="end">XAF</InputAdornment>,
                  inputProps: { 
                    min: 0, 
                    max: clientInfo ? (type === 'facture' ? clientInfo.montantRestant : clientInfo.montantRemboursable) : undefined,
                    step: 100 
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Référence du paiement"
                value={formData.reference}
                onChange={handleChange('reference')}
                error={!!errors.reference}
                helperText={errors.reference || "Référence unique du paiement"}
                disabled={isProcessing || !!errors.GENERAL}
              />
            </Grid>
            
            {formData.method === 'MobileMoney' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Numéro de téléphone"
                  value={formData.numeroTelephone}
                  onChange={handleChange('numeroTelephone')}
                  placeholder="6XXXXXXXX ou 7XXXXXXXX"
                  error={!!errors.numeroTelephone}
                  helperText={errors.numeroTelephone || "Numéro de téléphone pour le paiement Mobile Money"}
                  disabled={isProcessing || !!errors.GENERAL}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">+237</InputAdornment>
                  }}
                />
              </Grid>
            )}
            
            {formData.method === 'CarteBancaire' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Numéro de carte"
                    value={formData.numeroCarte}
                    onChange={handleChange('numeroCarte')}
                    placeholder="XXXX XXXX XXXX XXXX"
                    error={!!errors.numeroCarte}
                    helperText={errors.numeroCarte}
                    disabled={isProcessing || !!errors.GENERAL}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Date d'expiration (MM/AA)"
                    value={formData.dateExpiration}
                    onChange={handleChange('dateExpiration')}
                    placeholder="MM/AA"
                    error={!!errors.dateExpiration}
                    helperText={errors.dateExpiration}
                    disabled={isProcessing || !!errors.GENERAL}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="CVV"
                    value={formData.cvv}
                    onChange={handleChange('cvv')}
                    placeholder="XXX"
                    type="password"
                    error={!!errors.cvv}
                    helperText={errors.cvv}
                    disabled={isProcessing || !!errors.GENERAL}
                  />
                </Grid>
              </>
            )}
            
            {formData.method === 'Virement' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Numéro de compte bancaire"
                  value={formData.numeroCompte}
                  onChange={handleChange('numeroCompte')}
                  placeholder="XXXXXXXXXXXXXX"
                  error={!!errors.numeroCompte}
                  helperText={errors.numeroCompte || "Numéro de compte pour virement bancaire"}
                  disabled={isProcessing || !!errors.GENERAL}
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observations"
                multiline
                rows={3}
                value={formData.observations}
                onChange={handleChange('observations')}
                placeholder="Notes additionnelles sur ce paiement..."
                disabled={isProcessing || !!errors.GENERAL}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.notifierClient}
                    onChange={(e) => setFormData(prev => ({ ...prev, notifierClient: e.target.checked }))}
                    disabled={isProcessing || !!errors.GENERAL}
                  />
                }
                label="Notifier le client par SMS/Email de ce paiement"
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={onClose}
          disabled={isProcessing}
          sx={{ mr: 2 }}
        >
          {estEntierementPaye ? 'Fermer' : 'Annuler'}
        </Button>
        {!estEntierementPaye && montantRestant > 0 && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isProcessing || !!errors.GENERAL}
            startIcon={isProcessing ? <CircularProgress size={20} /> : <PaymentIcon />}
            color="primary"
          >
            {isProcessing ? 'Traitement en cours...' : 'Confirmer le paiement'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;