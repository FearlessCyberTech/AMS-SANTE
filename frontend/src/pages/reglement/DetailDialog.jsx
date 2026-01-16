// components/DetailDialog.jsx
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
  Tooltip
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

const DetailDialog = ({ 
  open, 
  type, 
  data: initialData, 
  id, // ID optionnel si data n'est pas fourni
  onClose, 
  onDownload,
  statusConfig,
  paymentMethods
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showPrintView, setShowPrintView] = useState(false);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [data, setData] = useState(initialData);
  const [paiements, setPaiements] = useState([]);
  const [loadingPaiements, setLoadingPaiements] = useState(false);

  useEffect(() => {
    if (open && !initialData && id) {
      loadData();
    } else if (initialData) {
      setData(initialData);
      setLoading(false);
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
          setData(response.transactions[0]);
        } else {
          throw new Error('Transaction non trouvée');
        }
      } else if (type === 'facture') {
        // Utiliser l'API de facturation pour les factures
        response = await facturationAPI.getFactureById(id);
        
        if (response.success && response.facture) {
          setData(response.facture);
          loadPaiements(response.facture.id || response.facture.ID_FACTURE);
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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CFA'
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return date;
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
        title: `${type === 'transaction' ? 'Transaction' : 'Facture'} ${data.REFERENCE_TRANSACTION || data.numero || data.ID_FACTURE}`,
        text: `Détails de ${type === 'transaction' ? 'la transaction' : 'la facture'}`,
        url: window.location.href,
      });
    }
  };

// Dans DetailDialog.jsx - VERSION CORRIGÉE
const handleDownload = async () => {
  try {
    showNotification('Téléchargement en cours...', 'info');
    
    // Vérifier le type de document
    if (type === 'transaction') {
      // Télécharger le reçu de transaction
      await handleDownloadDocument(
        data.REFERENCE_TRANSACTION || data.reference, 
        'transaction'
      );
    } else if (type === 'facture') {
      // Télécharger la quittance PDF
      await handleDownloadQuittancePDF(data.id || data.COD_FACTURE);
    } else if (type === 'remboursement') {
      // Télécharger le reçu de remboursement
      await handleDownloadDocument(
        data.REFERENCE || data.COD_DECL, 
        'remboursement'
      );
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
    
    if (response.success) {
      // Créer et télécharger le fichier PDF
      const url = window.URL.createObjectURL(response.pdf);
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
      await handleDownloadQuittanceFallback(factureId);
    }
  } catch (error) {
    console.error('❌ Erreur téléchargement quittance PDF:', error);
    // Fallback: Télécharger les données JSON
    await handleDownloadQuittanceFallback(factureId);
  }
};

// Fallback: Générer un PDF côté client avec jsPDF
const handleDownloadQuittanceFallback = async (factureId) => {
  try {
    // Option 1: Récupérer les données et générer avec jsPDF
    const response = await facturationAPI.genererQuittance(factureId);
    
    if (response.success) {
      // Générer un PDF simple avec jsPDF
      await generatePDFFromData(response.quittance || response.data);
      
      showNotification('✅ Quittance générée avec succès', 'success');
    } else {
      showNotification(response.message || 'Erreur lors de la génération de la quittance', 'error');
    }
  } catch (error) {
    console.error('❌ Erreur fallback quittance:', error);
    showNotification('Impossible de générer la quittance', 'error');
  }
};

// Fonction pour générer un PDF avec jsPDF
const generatePDFFromData = async (quittanceData) => {
  try {
    // Vérifier si jsPDF est disponible
    const { jsPDF } = window.jspdf;
    
    if (!jsPDF) {
      // Si jsPDF n'est pas disponible, télécharger un JSON
      downloadAsJSON(quittanceData);
      return;
    }
    
    // Créer un nouveau document PDF
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(20);
    doc.text('QUITTANCE', 105, 20, { align: 'center' });
    
    // Informations de la facture
    doc.setFontSize(12);
    doc.text(`Numéro: ${quittanceData.facture?.numero || 'N/A'}`, 20, 40);
    doc.text(`Date: ${formatDate(quittanceData.facture?.date_facture)}`, 20, 50);
    
    // Informations du patient
    doc.text(`Patient: ${quittanceData.patient?.nom || ''} ${quittanceData.patient?.prenom || ''}`, 20, 70);
    
    // Montant
    doc.text(`Montant total: ${formatCurrency(quittanceData.facture?.montant_total || 0)}`, 20, 90);
    doc.text(`Montant payé: ${formatCurrency(quittanceData.facture?.montant_paye || 0)}`, 20, 100);
    doc.text(`Reste à payer: ${formatCurrency(quittanceData.facture?.montant_restant || 0)}`, 20, 110);
    
    // Date de génération
    doc.setFontSize(10);
    doc.text(`Généré le: ${formatDate(new Date())}`, 20, 140);
    
    // Sauvegarder le PDF
    doc.save(`quittance_${quittanceData.facture?.numero || 'document'}.pdf`);
    
  } catch (error) {
    console.error('❌ Erreur génération PDF:', error);
    // Fallback au format JSON
    downloadAsJSON(quittanceData);
  }
};

// Télécharger en JSON
const downloadAsJSON = (data) => {
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `quittance_${data.facture?.numero || 'data'}.json`;
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 100);
};

  const renderQuickStats = () => {
    if (type === 'transaction') {
      return (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Montant
            </Typography>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {formatCurrency(data.MONTANT || data.montant)}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Statut
            </Typography>
            <Chip
              label={getStatutText(data.STATUT_TRANSACTION || data.statut)}
              color={getStatutColor(data.STATUT_TRANSACTION || data.statut)}
              sx={{ mt: 0.5, fontWeight: 'medium' }}
            />
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Date
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {formatDate(data.DATE_INITIATION || data.date_transaction || data.created_at)}
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
              {formatCurrency(data.MONTANT_TOTAL || data.montant_total)}
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
            <Typography variant="h6" color={data.MONTANT_RESTANT > 0 ? 'error' : 'success'} fontWeight="bold">
              {formatCurrency(data.MONTANT_RESTANT || data.montant_restant || 0)}
            </Typography>
          </Paper>
        </Box>
      );
    }
    return null;
  };

  const renderTransactionDetails = () => (
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
              {data.REFERENCE_TRANSACTION || 'N/A'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Type de Transaction
            </Typography>
            <Typography variant="body1">
              {data.TYPE_TRANSACTION || data.type_transaction || 'N/A'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Canal
            </Typography>
            <Typography variant="body1">
              {data.CANAL || data.canal || 'N/A'}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Numéro Facture Associée
            </Typography>
            <Typography variant="body1">
              {data.NUMERO_FACTURE || data.numero_facture || 'Aucune'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Client/Bénéficiaire
            </Typography>
            <Typography variant="body1">
              {data.NOM_CLIENT || data.nom_client || data.NOM_BEN || 'N/A'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Moyen de Paiement
            </Typography>
            <Typography variant="body1">
              {data.MOYEN_PAIEMENT || data.moyen_paiement || 'N/A'}
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

  const renderFactureDetails = () => (
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
              {data.numero || data.NUMERO_FACTURE || 'N/A'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Date Facturation
            </Typography>
            <Typography variant="body1">
              {formatDate(data.DATE_FACTURE || data.date_facture)}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Type de Facture
            </Typography>
            <Typography variant="body1">
              {data.TYPE_FACTURE || data.type_facture || 'Consultation'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Patient/Bénéficiaire
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <PersonIcon fontSize="small" />
              <Typography variant="body1">
                {data.NOM_BEN} {data.PRE_BEN}
                {data.IDENTIFIANT_NATIONAL && ` (${data.IDENTIFIANT_NATIONAL})`}
              </Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Médecin/Praticien
            </Typography>
            <Typography variant="body1">
              {data.NOM_MEDECIN || data.medecin_nom || 'N/A'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Centre de Santé
            </Typography>
            <Typography variant="body1">
              {data.NOM_CENTRE || data.centre_nom || 'N/A'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Montant Assurance
            </Typography>
            <Typography variant="body1" color="info.main">
              {formatCurrency(data.MONTANT_ASSURANCE || 0)}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Montant Patient
            </Typography>
            <Typography variant="body1" color="warning.main">
              {formatCurrency(data.MONTANT_PATIENT || 0)}
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

  const renderHistorique = () => {
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
                <CreditCardIcon color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Date de validation"
                secondary={data.DATE_VALIDATION ? formatDate(data.DATE_VALIDATION) : 'Non validée'}
              />
            </ListItem>
            
            {data.DATE_MAJ && (
              <ListItem>
                <ListItemIcon>
                  <HistoryIcon color="info" />
                </ListItemIcon>
                <ListItemText
                  primary="Dernière mise à jour"
                  secondary={formatDate(data.DATE_MAJ)}
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
                secondary={formatDate(data.DATE_CREATION || data.created_at)}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <PaidIcon color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Date d'échéance"
                secondary={data.DATE_ECHEANCE ? formatDate(data.DATE_ECHEANCE) : 'Non définie'}
              />
            </ListItem>
            
            {data.DATE_MODIFICATION && (
              <ListItem>
                <ListItemIcon>
                  <HistoryIcon color="info" />
                </ListItemIcon>
                <ListItemText
                  primary="Dernière modification"
                  secondary={formatDate(data.DATE_MODIFICATION)}
                />
              </ListItem>
            )}
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
                      {formatCurrency(paiement.MONTANT || paiement.montant)}
                    </Typography>
                    <Chip
                      label={paiement.MODE_PAIEMENT || paiement.mode_paiement}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Date: {formatDate(paiement.DATE_PAIEMENT || paiement.date_paiement)}
                    </Typography>
                    {paiement.REFERENCE && (
                      <Typography variant="body2" color="text.secondary">
                        Référence: {paiement.REFERENCE}
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
        Pièces Jointes
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
        
        {type === 'facture' && data.FICHIER_JOINT && (
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={async () => {
              try {
                const blob = await facturationAPI.downloadPDF(data.id || data.ID_FACTURE);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `facture-${data.numero}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (error) {
                console.error('❌ Erreur téléchargement facture:', error);
                alert('Erreur lors du téléchargement: ' + error.message);
              }
            }}
            sx={{ justifyContent: 'flex-start' }}
          >
            Télécharger la facture originale (PDF)
          </Button>
        )}
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
            {type === 'facture' && data?.DATE_FACTURE && `Créée le ${formatDate(data.DATE_FACTURE)}`}
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
        
        {navigator.share && (
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleShare}
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
  );
};

export default DetailDialog;