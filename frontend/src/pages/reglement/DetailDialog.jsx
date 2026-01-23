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
  Snackbar,
  alpha
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
  MedicalServices as MedicalServicesIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import PrintDetails from './PrintDetails';
import { facturationAPI, financesAPI } from '../../services/api';

// Fonction utilitaire pour valider et formater les données
const validateData = (data, type = 'transaction') => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }
  
  // Fonction récursive pour nettoyer un objet
  const cleanObject = (obj, depth = 0) => {
    if (depth > 3) return '[Objet trop profond]'; // Limite de récursion
    if (!obj || typeof obj !== 'object') return obj;
    
    // Si c'est une date
    if (obj instanceof Date) return obj;
    
    // Si c'est un tableau, nettoyer chaque élément
    if (Array.isArray(obj)) {
      return obj.map(item => cleanObject(item, depth + 1));
    }
    
    // Si c'est un objet, nettoyer chaque propriété
    const cleaned = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        // Gérer les types primitifs
        if (value === null || value === undefined) {
          cleaned[key] = '';
        } else if (typeof value === 'string') {
          cleaned[key] = value;
        } else if (typeof value === 'number') {
          cleaned[key] = value;
        } else if (typeof value === 'boolean') {
          cleaned[key] = value;
        } else if (value instanceof Date) {
          cleaned[key] = value;
        } else if (Array.isArray(value)) {
          cleaned[key] = cleanObject(value, depth + 1);
        } else if (typeof value === 'object') {
          // Pour les sous-objets, les convertir en string
          try {
            // Essayer d'extraire une valeur utile
            if (value._id || value.id || value.code || value.nom || value.name) {
              cleaned[key] = value._id || value.id || value.code || value.nom || value.name || '';
            } else {
              const str = JSON.stringify(value);
              cleaned[key] = str.length > 100 ? str.substring(0, 100) + '...' : str;
            }
          } catch {
            cleaned[key] = '[Objet non sérialisable]';
          }
        } else {
          cleaned[key] = String(value);
        }
      }
    }
    return cleaned;
  };

  // Fonction pour extraire une valeur en string
  const extractString = (value, defaultValue = '') => {
    if (!value && value !== 0) return defaultValue;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
      try {
        // Essayer d'extraire une valeur significative
        if (value._id || value.id || value.code || value.nom || value.name || value.label) {
          return value._id || value.id || value.code || value.nom || value.name || value.label || '';
        }
        const str = JSON.stringify(value);
        return str.length > 50 ? str.substring(0, 50) + '...' : str;
      } catch {
        return '[Objet]';
      }
    }
    return String(value || defaultValue);
  };

  // Nettoyer l'objet de base
  const cleanedData = cleanObject(data);

  if (type === 'transaction') {
    return {
      COD_TRANS: cleanedData.COD_TRANS || cleanedData.id || null,
      REFERENCE_TRANSACTION: extractString(cleanedData.REFERENCE_TRANSACTION || cleanedData.reference, 'N/A'),
      BENEFICIAIRE: extractString(cleanedData.BENEFICIAIRE || cleanedData.NOM_BEN || cleanedData.nom_ben, 'N/A'),
      DATE_INITIATION: cleanedData.DATE_INITIATION || cleanedData.date_initiation,
      MONTANT: Number(cleanedData.MONTANT || cleanedData.montant || 0),
      STATUT_TRANSACTION: extractString(cleanedData.STATUT_TRANSACTION || cleanedData.statut, 'N/A'),
      METHODE_PAIEMENT: extractString(cleanedData.METHODE_PAIEMENT || cleanedData.methode, 'N/A'),
      TYPE_TRANSACTION: extractString(cleanedData.TYPE_TRANSACTION || cleanedData.type_transaction, 'N/A'),
      CANAL: extractString(cleanedData.CANAL || cleanedData.canal, 'N/A'),
      NUMERO_FACTURE: extractString(cleanedData.NUMERO_FACTURE || cleanedData.numero_facture, 'N/A'),
      NOM_CLIENT: extractString(cleanedData.NOM_CLIENT || cleanedData.nom_client, 'N/A'),
      MOYEN_PAIEMENT: extractString(cleanedData.MOYEN_PAIEMENT || cleanedData.moyen_paiement, 'N/A'),
      DESCRIPTION: extractString(cleanedData.DESCRIPTION || cleanedData.description, ''),
      ...cleanedData
    };
  } else if (type === 'facture') {
    return {
      id: cleanedData.id || cleanedData.COD_FACTURE || null,
      numero: extractString(cleanedData.numero || cleanedData.numero_facture, 'N/A'),
      numero_facture: extractString(cleanedData.numero_facture || cleanedData.numero, 'N/A'),
      nom_ben: extractString(cleanedData.nom_ben || cleanedData.NOM_BEN, ''),
      prenom_ben: extractString(cleanedData.prenom_ben || cleanedData.PRE_BEN, ''),
      date_facture: cleanedData.date_facture || cleanedData.DATE_FACTURE,
      date_echeance: cleanedData.date_echeance || cleanedData.DATE_ECHEANCE,
      date_creation: cleanedData.date_creation || cleanedData.created_at,
      date_modification: cleanedData.date_modification,
      montant_total: Number(cleanedData.montant_total || cleanedData.MONTANT_TOTAL || 0),
      montant_paye: Number(cleanedData.montant_paye || cleanedData.MONTANT_PAYE || 0),
      montant_restant: Number(cleanedData.montant_restant || cleanedData.MONTANT_RESTANT || 0),
      statut: extractString(cleanedData.statut, 'N/A'),
      telephone: extractString(cleanedData.telephone || cleanedData.TELEPHONE, ''),
      NOM_MEDECIN: extractString(cleanedData.NOM_MEDECIN || cleanedData.medecin_nom, ''),
      NOM_CENTRE: extractString(cleanedData.NOM_CENTRE || cleanedData.centre_nom, ''),
      MONTANT_ASSURANCE: Number(cleanedData.MONTANT_ASSURANCE || 0),
      MONTANT_PATIENT: Number(cleanedData.MONTANT_PATIENT || 0),
      OBSERVATIONS: extractString(cleanedData.OBSERVATIONS || cleanedData.observations, ''),
      TYPE_FACTURE: extractString(cleanedData.TYPE_FACTURE || cleanedData.type_facture, ''),
      IDENTIFIANT_NATIONAL: extractString(cleanedData.IDENTIFIANT_NATIONAL, ''),
      ...cleanedData
    };
  }
  return cleanedData;
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
  formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CFA'
    }).format(amount || 0);
  },
  formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Date invalide';
      
      return dateObj.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  }
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showPrintView, setShowPrintView] = useState(false);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [data, setData] = useState(initialData ? validateData(initialData, type) : null);
  const [paiements, setPaiements] = useState([]);
  const [loadingPaiements, setLoadingPaiements] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    type: 'info'
  });

  // Afficher une notification
  const showNotification = (message, type = 'info') => {
    setNotification({
      open: true,
      message: message.toString(),
      type
    });
  };

  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    if (open && !initialData && id) {
      loadData();
    } else if (initialData && open) {
      const validatedData = validateData(initialData, type);
      setData(validatedData);
      setLoading(false);
      
      // Charger les paiements si c'est une facture
      if (type === 'facture') {
        const factureId = validatedData?.id || validatedData?.COD_FACTURE;
        if (factureId) {
          loadPaiements(factureId);
        }
      }
    }
  }, [open, id, type, initialData]);

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
          setData(validateData(response.transactions[0], type));
        } else {
          throw new Error('Transaction non trouvée');
        }
      } else if (type === 'facture') {
        // Utiliser l'API de facturation pour les factures
        response = await facturationAPI.getFactureById(id);
        
        if (response.success && response.facture) {
          const validatedData = validateData(response.facture, type);
          setData(validatedData);
          
          // Charger les paiements associés
          const factureId = validatedData.id || validatedData.COD_FACTURE;
          if (factureId) {
            loadPaiements(factureId);
          }
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
        setPaiements(response.paiements || []);
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
        title: `${type === 'transaction' ? 'Transaction' : 'Facture'} ${data?.REFERENCE_TRANSACTION || data?.numero || data?.id}`,
        text: `Détails de ${type === 'transaction' ? 'la transaction' : 'la facture'}`,
        url: window.location.href,
      });
    }
  };

  const handleDownload = async () => {
    try {
      showNotification('Téléchargement en cours...', 'info');
      
      // Vérifier le type de document
      if (type === 'transaction') {
        // Télécharger le reçu de transaction
        const reference = data?.REFERENCE_TRANSACTION || data?.reference;
        if (reference && onDownload) {
          await onDownload(reference, 'transaction');
        } else {
          downloadAsJSON(data, 'transaction');
        }
      } else if (type === 'facture') {
        // Télécharger la quittance PDF
        const factureId = data?.id || data?.COD_FACTURE;
        if (factureId) {
          await handleDownloadQuittancePDF(factureId);
        } else {
          downloadAsJSON(data, 'facture');
        }
      }
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      showNotification('Erreur lors du téléchargement', 'error');
    }
  };

  // Nouvelle fonction pour télécharger la quittance PDF
  const handleDownloadQuittancePDF = async (factureId) => {
    try {
      const response = await facturationAPI.genererQuittancePDF(factureId);
      
      if (response.success && response.pdf) {
        // Créer et télécharger le fichier PDF
        const blob = response.pdf instanceof Blob ? response.pdf : new Blob([response.pdf], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = response.fileName || `quittance_${factureId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        // Nettoyer l'URL
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
        
        showNotification('✅ Quittance téléchargée avec succès', 'success');
      } else {
        // Fallback: Télécharger les données JSON
        downloadAsJSON(data, 'facture');
      }
    } catch (error) {
      console.error('❌ Erreur téléchargement quittance PDF:', error);
      // Fallback: Télécharger les données JSON
      downloadAsJSON(data, 'facture');
    }
  };

  // Télécharger en JSON
  const downloadAsJSON = (data, type) => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_${data?.id || data?.COD_TRANS || 'data'}.json`;
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
    showNotification('Données téléchargées en JSON', 'info');
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
              {formatCurrency(data.MONTANT)}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Statut
            </Typography>
            <Chip
              label={getStatutText(data.STATUT_TRANSACTION)}
              color={getStatutColor(data.STATUT_TRANSACTION)}
              sx={{ mt: 0.5, fontWeight: 'medium' }}
            />
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Date
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {formatDate(data.DATE_INITIATION)}
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
              {formatCurrency(data.montant_total)}
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
              {formatCurrency(data.montant_restant)}
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
                {data.REFERENCE_TRANSACTION}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Type de Transaction
              </Typography>
              <Typography variant="body1">
                {data.TYPE_TRANSACTION || 'N/A'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Canal
              </Typography>
              <Typography variant="body1">
                {data.CANAL || 'N/A'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Méthode de Paiement
              </Typography>
              <Typography variant="body1">
                {data.METHODE_PAIEMENT || 'N/A'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Numéro Facture Associée
              </Typography>
              <Typography variant="body1">
                {data.NUMERO_FACTURE || 'Aucune'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Client/Bénéficiaire
              </Typography>
              <Typography variant="body1">
                {data.BENEFICIAIRE}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Montant
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="primary">
                {formatCurrency(data.MONTANT)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {data.DESCRIPTION && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body2">
              {data.DESCRIPTION}
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
                {data.numero}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Date Facturation
              </Typography>
              <Typography variant="body1">
                {formatDate(data.date_facture)}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Date Échéance
              </Typography>
              <Typography variant="body1" color={new Date(data.date_echeance) < new Date() ? 'error' : 'inherit'}>
                {formatDate(data.date_echeance)}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Type de Facture
              </Typography>
              <Typography variant="body1">
                {data.TYPE_FACTURE || 'Consultation'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Patient/Bénéficiaire
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <PersonIcon fontSize="small" />
                <Typography variant="body1">
                  {data.nom_ben} {data.prenom_ben}
                  {data.IDENTIFIANT_NATIONAL && ` (${data.IDENTIFIANT_NATIONAL})`}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Montant Total
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="primary">
                {formatCurrency(data.montant_total)}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Montant Payé
              </Typography>
              <Typography variant="body1" color="success.main">
                {formatCurrency(data.montant_paye)}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Reste à Payer
              </Typography>
              <Typography variant="body1" color={data.montant_restant > 0 ? 'error' : 'success'} fontWeight="bold">
                {formatCurrency(data.montant_restant)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {data.OBSERVATIONS && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Observations
            </Typography>
            <Typography variant="body2">
              {data.OBSERVATIONS}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const renderHistorique = () => {
    if (!data) return null;
    
    if (type === 'transaction') {
      return (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="primary" />
            Historique Transaction
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <List>
            <ListItem>
              <ListItemIcon>
                <CalendarIcon color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Date d'initiation"
                secondary={formatDate(data.DATE_INITIATION)}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Statut"
                secondary={
                  <Chip
                    label={getStatutText(data.STATUT_TRANSACTION)}
                    color={getStatutColor(data.STATUT_TRANSACTION)}
                    size="small"
                  />
                }
              />
            </ListItem>
            
            {data.date_modification && (
              <ListItem>
                <ListItemIcon>
                  <HistoryIcon color="info" />
                </ListItemIcon>
                <ListItemText
                  primary="Dernière mise à jour"
                  secondary={formatDate(data.date_modification)}
                />
              </ListItem>
            )}
          </List>
        </Paper>
      );
    } else if (type === 'facture') {
      return (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="primary" />
            Historique Facture
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <List>
            <ListItem>
              <ListItemIcon>
                <CalendarIcon color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Date de création"
                secondary={formatDate(data.date_creation)}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <PaidIcon color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Date d'échéance"
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>{formatDate(data.date_echeance)}</Typography>
                    {new Date(data.date_echeance) < new Date() && (
                      <Chip label="En retard" color="error" size="small" />
                    )}
                  </Box>
                }
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Statut"
                secondary={
                  <Chip
                    label={getStatutText(data.statut)}
                    color={getStatutColor(data.statut)}
                    size="small"
                  />
                }
              />
            </ListItem>
          </List>
        </Paper>
      );
    }
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
          {paiements.map((paiement, index) => {
            const validatedPaiement = validateData(paiement, 'transaction');
            if (!validatedPaiement) return null;
            
            return (
              <ListItem
                key={validatedPaiement.COD_TRANS || validatedPaiement.id || index}
                divider={index < paiements.length - 1}
              >
                <ListItemIcon>
                  <PaidIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" fontWeight="medium">
                        {formatCurrency(validatedPaiement.MONTANT)}
                      </Typography>
                      <Chip
                        label={validatedPaiement.METHODE_PAIEMENT || 'N/A'}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Date: {formatDate(validatedPaiement.DATE_INITIATION)}
                      </Typography>
                      {validatedPaiement.REFERENCE_TRANSACTION && (
                        <Typography variant="body2" color="text.secondary">
                          Référence: {validatedPaiement.REFERENCE_TRANSACTION}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Statut: {getStatutText(validatedPaiement.STATUT_TRANSACTION)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            );
          })}
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
        >
          Télécharger le {type === 'transaction' ? 'reçu' : 'quittance'} (PDF)
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ justifyContent: 'flex-start' }}
        >
          Imprimer les détails
        </Button>
        
        {navigator.share && (
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleShare}
            sx={{ justifyContent: 'flex-start' }}
          >
            Partager les informations
          </Button>
        )}
      </Box>
    </Paper>
  );

  if (showPrintView && data) {
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
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.type}
          sx={{ width: '100%' }}
          elevation={6}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      
      {/* Dialogue principal */}
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
              {type === 'transaction' && `Transaction ${data?.REFERENCE_TRANSACTION || id}`}
              {type === 'facture' && `Facture ${data?.numero || id}`}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
              {type === 'transaction' && data?.DATE_INITIATION && `Initée le ${formatDate(data.DATE_INITIATION)}`}
              {type === 'facture' && data?.date_facture && `Créée le ${formatDate(data.date_facture)}`}
            </Typography>
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
          
          {data && (
            <>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ ml: 1 }}
              >
                Imprimer
              </Button>
              
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ ml: 1 }}
                color={type === 'transaction' ? 'primary' : 'secondary'}
              >
                Télécharger
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DetailDialog;