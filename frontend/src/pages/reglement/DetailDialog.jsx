// components/DetailDialog.jsx - VERSION CORRIGÉE
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Divider,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Stack,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Share as ShareIcon,
  PictureAsPdf as PdfIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  AttachFile as AttachFileIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Paid as PaidIcon,
  LocalHospital as HospitalIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  Description as DescriptionIcon,
  Payments as PaymentsIcon,
  Business as BusinessIcon,
  MedicalServices as MedicalServicesIcon
} from '@mui/icons-material';
import PrintDetails from './PrintDetails';
import { facturationAPI, financesAPI } from '../../services/api';

// Fonction pour extraire les valeurs de manière sécurisée
const extractValue = (data, keys, defaultValue = 'N/A') => {
  if (!data) return defaultValue;
  
  for (const key of keys) {
    const value = data[key];
    if (value !== undefined && value !== null) {
      // Si c'est un objet, essayer d'extraire les valeurs courantes
      if (typeof value === 'object' && !Array.isArray(value)) {
        return value.NOM_BEN || value.nom || value.PRE_BEN || value.prenom || 
               value.numero || value.NUMERO_FACTURE || value.reference || 
               value.toString();
      }
      return value;
    }
  }
  return defaultValue;
};

// Fonction pour normaliser les données
const normalizeData = (data, type) => {
  if (!data) return null;
  
  const normalized = { ...data };
  
  // Normaliser les champs communs
  normalized.id = extractValue(data, ['id', 'ID', 'COD_FACTURE', 'COD_TRANS', 'COD_DECL']);
  normalized.numero = extractValue(data, ['numero', 'NUMERO_FACTURE', 'numero_facture', 'NUM_DECLARATION']);
  normalized.reference = extractValue(data, ['REFERENCE_TRANSACTION', 'reference', 'reference_transaction']);
  
  // Normaliser les informations de bénéficiaire
  normalized.nom = extractValue(data, ['NOM_BEN', 'nom_ben', 'nom', 'BENEFICIAIRE', 'NOM_CLIENT']);
  normalized.prenom = extractValue(data, ['PRE_BEN', 'PRENOM_BEN', 'prenom_ben', 'prenom', 'PRENOM_CLIENT']);
  
  // Normaliser les montants
  normalized.montant = parseFloat(extractValue(data, ['MONTANT', 'montant'], 0));
  normalized.montant_total = parseFloat(extractValue(data, ['MONTANT_TOTAL', 'montant_total'], 0));
  normalized.montant_paye = parseFloat(extractValue(data, ['MONTANT_PAYE', 'montant_paye'], 0));
  normalized.montant_restant = parseFloat(extractValue(data, ['MONTANT_RESTANT', 'montant_restant'], 0));
  
  // Normaliser les dates
  normalized.date = extractValue(data, ['DATE_INITIATION', 'date_initiation', 'date', 'created_at']);
  normalized.date_facture = extractValue(data, ['DATE_FACTURE', 'date_facture']);
  normalized.date_echeance = extractValue(data, ['DATE_ECHEANCE', 'date_echeance']);
  
  // Normaliser les statuts
  normalized.statut = extractValue(data, ['STATUT_TRANSACTION', 'statut', 'STATUT_FACTURE', 'STATUT']);
  
  // Normaliser les autres champs
  normalized.observations = extractValue(data, ['OBSERVATIONS', 'observations']);
  normalized.description = extractValue(data, ['DESCRIPTION', 'description']);
  normalized.methode_paiement = extractValue(data, ['METHODE_PAIEMENT', 'methode_paiement', 'method']);
  normalized.telephone = extractValue(data, ['TELEPHONE', 'telephone', 'phone']);
  
  return normalized;
};

const DetailDialog = ({ 
  open, 
  type, 
  data: initialData, 
  id, // ID optionnel si data n'est pas fourni
  onClose, 
  onDownload,
  statusConfig,
  paymentMethods,
  formatCurrency,
  formatDate
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showPrintView, setShowPrintView] = useState(false);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [data, setData] = useState(() => normalizeData(initialData, type));
  const [paiements, setPaiements] = useState([]);
  const [loadingPaiements, setLoadingPaiements] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'info' });

  useEffect(() => {
    if (open && !initialData && id) {
      loadData();
    } else if (initialData) {
      setData(normalizeData(initialData, type));
      setLoading(false);
    }
  }, [open, id, type, initialData]);

  const showNotification = (message, type = 'info') => {
    setSnackbar({ open: true, message, type });
  };

  const handleCloseNotification = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (type === 'transaction') {
        // Utiliser l'API des finances pour les transactions
        response = await financesAPI.getTransactions({
          reference: id,
          limit: 1
        });
        
        if (response.success && response.transactions && response.transactions.length > 0) {
          setData(normalizeData(response.transactions[0], type));
        } else {
          throw new Error('Transaction non trouvée');
        }
      } else if (type === 'facture') {
        // Utiliser l'API de facturation pour les factures
        response = await facturationAPI.getFactureById(id);
        
        if (response.success && response.facture) {
          const normalizedData = normalizeData(response.facture, type);
          setData(normalizedData);
          loadPaiements(normalizedData.id);
        } else {
          throw new Error('Facture non trouvée');
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const loadPaiements = async (factureId) => {
    try {
      setLoadingPaiements(true);
      const response = await facturationAPI.getPaiements(factureId);
      
      if (response.success) {
        // Normaliser les paiements
        const normalizedPaiements = (response.paiements || []).map(p => ({
          id: extractValue(p, ['id', 'ID_PAIEMENT']),
          montant: parseFloat(extractValue(p, ['MONTANT', 'montant'], 0)),
          mode_paiement: extractValue(p, ['MODE_PAIEMENT', 'mode_paiement', 'method']),
          date_paiement: extractValue(p, ['DATE_PAIEMENT', 'date_paiement']),
          reference: extractValue(p, ['REFERENCE', 'reference'])
        }));
        setPaiements(normalizedPaiements);
      }
      setLoadingPaiements(false);
    } catch (error) {
      console.error('❌ Erreur chargement paiements:', error);
      setLoadingPaiements(false);
    }
  };

  const getStatutColor = (statut) => {
    if (!statut) return 'default';
    
    const statutLower = statut.toLowerCase();
    if (statutLower.includes('payé') || statutLower.includes('success') || statutLower.includes('reussi')) {
      return 'success';
    }
    if (statutLower.includes('en attente') || statutLower.includes('pending') || statutLower.includes('soumis')) {
      return 'warning';
    }
    if (statutLower.includes('échoué') || statutLower.includes('failed') || statutLower.includes('rejeté')) {
      return 'error';
    }
    if (statutLower.includes('annulé') || statutLower.includes('cancelled')) {
      return 'default';
    }
    return 'info';
  };

  const getStatutText = (statut) => {
    if (!statut) return 'Inconnu';
    return statut.charAt(0).toUpperCase() + statut.slice(1).toLowerCase();
  };

  const handlePrint = () => {
    setShowPrintView(true);
  };

  const handleBackFromPrint = () => {
    setShowPrintView(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${type === 'transaction' ? 'Transaction' : 'Facture'} ${data.reference || data.numero || id}`,
        text: `Détails de ${type === 'transaction' ? 'la transaction' : 'la facture'}`,
        url: window.location.href,
      });
    }
  };

  const handleDownload = async () => {
    try {
      showNotification('Téléchargement en cours...', 'info');
      
      if (onDownload) {
        const reference = data.reference || data.numero || id;
        await onDownload(reference, type);
      } else {
        showNotification('Fonction de téléchargement non disponible', 'error');
      }
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      showNotification('Erreur lors du téléchargement', 'error');
    }
  };

  const renderQuickStats = () => {
    if (!data) return null;
    
    if (type === 'transaction') {
      return (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Montant
            </Typography>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {formatCurrency ? formatCurrency(data.montant) : `${data.montant} XAF`}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Statut
            </Typography>
            <Chip
              label={getStatutText(data.statut)}
              color={getStatutColor(data.statut)}
              sx={{ mt: 0.5, fontWeight: 'medium' }}
            />
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Date
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {formatDate ? formatDate(data.date) : data.date}
            </Typography>
          </Paper>
        </Box>
      );
    } else if (type === 'facture') {
      return (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Montant Total
            </Typography>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {formatCurrency ? formatCurrency(data.montant_total) : `${data.montant_total} XAF`}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Statut
            </Typography>
            <Chip
              label={getStatutText(data.statut)}
              color={getStatutColor(data.statut)}
              sx={{ mt: 0.5, fontWeight: 'medium' }}
            />
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Restant à Payer
            </Typography>
            <Typography variant="h6" color={data.montant_restant > 0 ? 'error' : 'success'} fontWeight="bold">
              {formatCurrency ? formatCurrency(data.montant_restant) : `${data.montant_restant} XAF`}
            </Typography>
          </Paper>
        </Box>
      );
    }
    return null;
  };

  const renderTransactionDetails = () => {
    if (!data) return null;
    
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon color="primary" />
          Informations Transaction
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Référence Transaction
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {data.reference || 'N/A'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Bénéficiaire
              </Typography>
              <Typography variant="body1">
                {data.nom || 'N/A'} {data.prenom || ''}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Méthode de paiement
              </Typography>
              <Typography variant="body1">
                {data.methode_paiement || 'N/A'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Montant
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="primary">
                {formatCurrency ? formatCurrency(data.montant) : `${data.montant} XAF`}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Statut
              </Typography>
              <Chip
                label={getStatutText(data.statut)}
                color={getStatutColor(data.statut)}
                size="small"
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Date
              </Typography>
              <Typography variant="body1">
                {formatDate ? formatDate(data.date) : data.date}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {(data.observations || data.description) && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {data.description ? 'Description' : 'Observations'}
            </Typography>
            <Typography variant="body2">
              {data.description || data.observations}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const renderFactureDetails = () => {
    if (!data) return null;
    
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon color="primary" />
          Informations Facture
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Numéro Facture
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {data.numero || 'N/A'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Date Facturation
              </Typography>
              <Typography variant="body1">
                {formatDate ? formatDate(data.date_facture) : data.date_facture}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Échéance
              </Typography>
              <Typography variant="body1" color={data.date_echeance && new Date(data.date_echeance) < new Date() ? 'error' : 'inherit'}>
                {formatDate ? formatDate(data.date_echeance) : data.date_echeance}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Bénéficiaire
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <PersonIcon fontSize="small" />
                <Typography variant="body1">
                  {data.nom || 'N/A'} {data.prenom || ''}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Montant Total
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="primary">
                {formatCurrency ? formatCurrency(data.montant_total) : `${data.montant_total} XAF`}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Montant Payé
              </Typography>
              <Typography variant="body1" color="success.main">
                {formatCurrency ? formatCurrency(data.montant_paye) : `${data.montant_paye} XAF`}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Restant à Payer
              </Typography>
              <Typography variant="body1" fontWeight="bold" color={data.montant_restant > 0 ? 'error' : 'success'}>
                {formatCurrency ? formatCurrency(data.montant_restant) : `${data.montant_restant} XAF`}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Statut
              </Typography>
              <Chip
                label={getStatutText(data.statut)}
                color={getStatutColor(data.statut)}
                size="small"
              />
            </Box>
          </Grid>
        </Grid>
        
        {data.observations && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Observations
            </Typography>
            <Typography variant="body2">
              {data.observations}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const renderHistorique = () => {
    if (!data) return null;
    
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          Historique
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <List>
          <ListItem>
            <ListItemIcon>
              <CalendarIcon color="info" />
            </ListItemIcon>
            <ListItemText
              primary="Date"
              secondary={formatDate ? formatDate(data.date) : data.date}
            />
          </ListItem>
          
          {type === 'facture' && data.date_echeance && (
            <ListItem>
              <ListItemIcon>
                <PaidIcon color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Date d'échéance"
                secondary={formatDate ? formatDate(data.date_echeance) : data.date_echeance}
              />
            </ListItem>
          )}
        </List>
      </Paper>
    );
  };

  const renderPaiements = () => {
    if (loadingPaiements) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (paiements.length === 0) {
      return (
        <Alert severity="info">
          Aucun paiement enregistré pour cette facture
        </Alert>
      );
    }

    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentsIcon color="primary" />
          Paiements enregistrés
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <List>
          {paiements.map((paiement, index) => (
            <ListItem
              key={paiement.id || index}
              divider={index < paiements.length - 1}
            >
              <ListItemIcon>
                <PaidIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency ? formatCurrency(paiement.montant) : `${paiement.montant} XAF`}
                    </Typography>
                    <Chip
                      label={paiement.mode_paiement || 'N/A'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Date: {formatDate ? formatDate(paiement.date_paiement) : paiement.date_paiement}
                    </Typography>
                    {paiement.reference && (
                      <Typography variant="body2" color="text.secondary">
                        Référence: {paiement.reference}
                      </Typography>
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  };

  const renderAttachments = () => (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AttachFileIcon color="primary" />
        Documents
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PdfIcon />}
          onClick={handleDownload}
          sx={{ justifyContent: 'flex-start' }}
          disabled={!data}
        >
          Télécharger {type === 'transaction' ? 'le reçu' : 'la facture'} (PDF)
        </Button>
      </Box>
    </Paper>
  );

  if (showPrintView) {
    return (
      <PrintDetails
        type={type}
        data={data}
        onClose={handleBackFromPrint}
      />
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '95vh',
            minHeight: '70vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: type === 'transaction' ? 'primary.main' : 'secondary.main',
          color: 'white',
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          position: 'sticky',
          top: 0,
          zIndex: 1
        }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {type === 'transaction' ? <ReceiptIcon /> : <AssignmentIcon />}
              {type === 'transaction' && `Transaction ${data?.reference || id || ''}`}
              {type === 'facture' && `Facture ${data?.numero || id || ''}`}
            </Typography>
            {data?.date && (
              <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                {type === 'transaction' && `Initée le ${formatDate ? formatDate(data.date) : data.date}`}
                {type === 'facture' && `Créée le ${formatDate ? formatDate(data.date_facture) : data.date_facture}`}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ 
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            px: 3,
            position: 'sticky',
            top: 64,
            zIndex: 1
          }}
        >
          <Tab label="Détails" icon={<ReceiptIcon />} iconPosition="start" />
          <Tab label="Historique" icon={<HistoryIcon />} iconPosition="start" />
          {type === 'facture' && <Tab label="Paiements" icon={<PaymentsIcon />} iconPosition="start" />}
          <Tab label="Documents" icon={<AttachFileIcon />} iconPosition="start" />
        </Tabs>

        <DialogContent sx={{ p: 0, overflow: 'auto' }}>
          <Box sx={{ p: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : !data ? (
              <Alert severity="warning">
                Aucune donnée disponible
              </Alert>
            ) : (
              <>
                {renderQuickStats()}
                
                {activeTab === 0 && (
                  <>
                    {type === 'transaction' && renderTransactionDetails()}
                    {type === 'facture' && renderFactureDetails()}
                  </>
                )}

                {activeTab === 1 && (
                  renderHistorique()
                )}

                {activeTab === 2 && type === 'facture' && (
                  renderPaiements()
                )}

                {activeTab === (type === 'facture' ? 3 : 2) && (
                  renderAttachments()
                )}
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          bgcolor: 'background.paper', 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          position: 'sticky',
          bottom: 0,
          zIndex: 1
        }}>
          <Button onClick={onClose} variant="outlined">
            Fermer
          </Button>
          
          <Box sx={{ flex: 1 }} />
          
          {navigator.share && (
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              disabled={!data}
            >
              Partager
            </Button>
          )}
          
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ ml: 1 }}
            disabled={!data}
          >
            Imprimer
          </Button>
          
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ ml: 1 }}
            color={type === 'transaction' ? 'primary' : 'secondary'}
            disabled={!data}
          >
            Télécharger
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={snackbar.type} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DetailDialog;