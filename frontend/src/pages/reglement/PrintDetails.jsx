// components/PrintDetails.jsx
import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  LocalHospital as LocalHospitalIcon,
  Payment as PaymentIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { facturationAPI, financesAPI } from '../../services/api';

const PrintDetails = ({
  type,
  id,
  data: staticData,
  onClose,
  companyInfo = {
    name: "AMS INSURANCE",
    address: "123 Avenue de la Finance, 75001 Paris",
    phone: "+237 657 12 01 36",
    email: "contact@finance-services.fr",
    website: "www.finance-services.fr",
    siret: "123 456 789 00012",
    vat: "FR12 345678901"
  }
}) => {
  const printRef = useRef();
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Fonctions de formatage
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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  };

  // Charger les données selon le type
  useEffect(() => {
    const fetchDocumentData = async () => {
      // Si on a déjà des données statiques, on les utilise
      if (staticData) {
        setDocumentData(staticData);
        return;
      }

      // Sinon, on charge depuis l'API
      if (!id) {
        setError('Identifiant du document requis');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let response;
        switch (type) {
          case 'transaction':
            // Récupérer la transaction par ID
            response = await financesAPI.getTransactions({ id });
            if (response.success && response.transactions?.[0]) {
              setDocumentData(response.transactions[0]);
            } else if (response.success && response.data) {
              setDocumentData(response.data);
            } else {
              throw new Error(response.message || 'Transaction non trouvée');
            }
            break;

          case 'facture':
            // Récupérer la facture par ID
            response = await facturationAPI.getFactureById(id);
            if (response.success && response.facture) {
              setDocumentData(response.facture);
            } else if (response.success && response.data) {
              setDocumentData(response.data);
            } else {
              throw new Error(response.message || 'Facture non trouvée');
            }
            break;

          case 'quittance':
            // Récupérer la facture et formater comme une quittance
            response = await facturationAPI.getFactureById(id);
            if (response.success && response.facture) {
              const facture = response.facture;
              setDocumentData({
                ...facture,
                type: 'quittance',
                titre: 'QUITTANCE',
                estQuittance: true
              });
            } else {
              throw new Error(response.message || 'Facture non trouvée pour la quittance');
            }
            break;

          case 'recu':
            // Récupérer la transaction et formater comme un reçu
            response = await financesAPI.getTransactions({ id });
            if (response.success && response.transactions?.[0]) {
              const transaction = response.transactions[0];
              setDocumentData({
                ...transaction,
                type: 'recu',
                titre: 'REÇU DE PAIEMENT',
                estRecu: true
              });
            } else {
              throw new Error(response.message || 'Transaction non trouvée pour le reçu');
            }
            break;

          default:
            throw new Error('Type de document non supporté');
        }
      } catch (error) {
        console.error('Erreur lors du chargement du document:', error);
        setError(error.message || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentData();
  }, [type, id, staticData]);

  // Transformer les données selon le type
  const transformDataForDisplay = (data) => {
    if (!data) return null;

    switch (type) {
      case 'transaction':
        return {
          // Informations de base
          reference: data.REFERENCE_TRANSACTION || data.reference,
          type: data.TYPE_TRANSACTION || data.type_transaction,
          dateInitiation: data.DATE_INITIATION || data.date_initiation,
          montant: data.MONTANT || data.montant,
          methodePaiement: data.METHODE_PAIEMENT || data.methode_paiement,
          statut: data.STATUT_TRANSACTION || data.statut,
          
          // Bénéficiaire
          beneficiaire: data.BENEFICIAIRE || data.beneficiaire,
          nomBeneficiaire: data.NOM_BEN || data.nom_ben,
          prenomBeneficiaire: data.PRE_BEN || data.prenom_ben,
          identifiantNational: data.IDENTIFIANT_NATIONAL || data.identifiant,
          
          // Informations bancaires
          referenceBanque: data.REFERENCE_BANQUE || data.reference_banque,
          details: data.DETAILS || data.details,
          
          // Informations supplémentaires
          modePaiement: data.MODE_PAIEMENT || data.mode_paiement,
          commission: data.COMMISSION || data.commission,
          taxes: data.TAXES || data.taxes,
          montantNet: data.MONTANT_NET || data.montant_net
        };

      case 'facture':
      case 'quittance':
        return {
          // Informations de base
          numero: data.NUM_FACTURE || data.numero || data.NUMERO,
          dateFacture: data.DATE_FACTURE || data.date_facture,
          dateEcheance: data.DATE_ECHEANCE || data.date_echeance,
          statut: data.STATUT_FACTURE || data.statut,
          
          // Montants
          montantTotal: data.MONTANT_TOTAL || data.montant_total,
          montantPaye: data.MONTANT_PAYE || data.montant_paye,
          montantRestant: data.MONTANT_RESTANT || data.montant_restant,
          montantCouvert: data.MONTANT_COUVERT || data.montant_couvert,
          
          // Bénéficiaire
          nomBeneficiaire: data.NOM_BEN || data.nom_ben,
          prenomBeneficiaire: data.PRE_BEN || data.prenom_ben,
          identifiantBeneficiaire: data.IDENTIFIANT_NATIONAL || data.identifiant,
          telephoneBeneficiaire: data.TELEPHONE_MOBILE || data.telephone,
          emailBeneficiaire: data.EMAIL || data.email,
          
          // Payeur
          libellePayeur: data.LIBELLE_PAYEUR || data.libelle_payeur,
          tauxCouverture: data.TAUX_COUVERTURE || data.taux_couverture,
          typePayeur: data.TYPE_PAYEUR || data.type_payeur,
          
          // Informations de paiement
          modePaiement: data.MODE_PAIEMENT || data.mode_paiement,
          referencePaiement: data.REFERENCE_PAIEMENT || data.reference_paiement,
          datePaiement: data.DATE_PAIEMENT || data.date_paiement,
          
          // Prestations
          prestations: data.prestations || [],
          observations: data.OBSERVATIONS || data.observations,
          
          // Pour les quittances
          titre: data.titre,
          estQuittance: data.estQuittance
        };

      case 'recu':
        return {
          // Informations de base
          reference: data.REFERENCE_TRANSACTION || data.reference,
          type: 'Reçu de paiement',
          date: data.DATE_INITIATION || data.date,
          montant: data.MONTANT || data.montant,
          methodePaiement: data.METHODE_PAIEMENT || data.methode_paiement,
          statut: data.STATUT_TRANSACTION || data.statut,
          
          // Bénéficiaire
          nomBeneficiaire: data.NOM_BEN || data.nom_ben,
          prenomBeneficiaire: data.PRE_BEN || data.prenom_ben,
          identifiantNational: data.IDENTIFIANT_NATIONAL || data.identifiant,
          
          // Facture associée
          factureReference: data.FACTURE_REFERENCE || data.facture_reference,
          factureMontant: data.FACTURE_MONTANT || data.facture_montant,
          
          // Pour les reçus
          titre: 'REÇU DE PAIEMENT',
          estRecu: true
        };

      default:
        return data;
    }
  };

  const displayData = transformDataForDisplay(documentData);

  const getStatusConfig = (status) => {
    if (!status) return { label: 'INCONNU', className: 'status-default' };
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('payé') || statusLower.includes('terminé') || statusLower.includes('réussi')) {
      return { label: status.toUpperCase(), className: 'status-success' };
    } else if (statusLower.includes('en cours') || statusLower.includes('en attente') || statusLower.includes('ouvert')) {
      return { label: status.toUpperCase(), className: 'status-warning' };
    } else if (statusLower.includes('annulé') || statusLower.includes('échec') || statusLower.includes('rejeté')) {
      return { label: status.toUpperCase(), className: 'status-error' };
    } else if (statusLower.includes('résolu') || statusLower.includes('validé')) {
      return { label: status.toUpperCase(), className: 'status-info' };
    } else {
      return { label: status.toUpperCase(), className: 'status-default' };
    }
  };

  const getPaymentMethodIcon = (method) => {
    if (!method) return '💳';
    
    const methodLower = method.toLowerCase();
    if (methodLower.includes('carte')) return '💳';
    if (methodLower.includes('virement')) return '🏦';
    if (methodLower.includes('espèce')) return '💵';
    if (methodLower.includes('mobile')) return '📱';
    if (methodLower.includes('chèque')) return '📄';
    return '💳';
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    
    if (!printContent) {
      alert('Erreur: Impossible de trouver le contenu à imprimer');
      return;
    }

    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Document - ${type}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            
            body {
              margin: 0;
              padding: 20px;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 12px;
              color: #333;
              line-height: 1.4;
            }
            
            .print-container {
              max-width: 210mm;
              margin: 0 auto;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #1976d2;
              padding-bottom: 20px;
            }
            
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #1976d2;
              margin-bottom: 10px;
            }
            
            .document-title {
              font-size: 20px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
              text-transform: uppercase;
            }
            
            .section {
              margin: 20px 0;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            
            .section-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #1976d2;
            }
            
            .data-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 15px;
              margin-top: 15px;
            }
            
            .data-item {
              margin-bottom: 8px;
            }
            
            .data-label {
              font-weight: bold;
              color: #666;
              margin-bottom: 3px;
            }
            
            .data-value {
              font-size: 13px;
            }
            
            .data-value-large {
              font-size: 16px;
              font-weight: bold;
            }
            
            .amount-section {
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            
            th {
              background-color: #f5f5f5;
              padding: 8px;
              text-align: left;
              border: 1px solid #ddd;
              font-weight: bold;
            }
            
            td {
              padding: 8px;
              border: 1px solid #ddd;
            }
            
            .total-row {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
            }
            
            .status-success { background-color: #d4edda; color: #155724; }
            .status-warning { background-color: #fff3cd; color: #856404; }
            .status-error { background-color: #f8d7da; color: #721c24; }
            .status-info { background-color: #d1ecf1; color: #0c5460; }
            .status-default { background-color: #e2e3e5; color: #383d41; }
            
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 11px;
              color: #666;
            }
            
            .print-date {
              font-size: 11px;
              color: #666;
              text-align: right;
              margin-bottom: 20px;
            }
            
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Attendre que le contenu soit chargé avant d'imprimer
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadPDF = async () => {
    if (!id) {
      alert('Impossible de télécharger: identifiant du document manquant');
      return;
    }

    setDownloadLoading(true);
    try {
      let blob;
      
      switch (type) {
        case 'facture':
        case 'quittance':
          blob = await facturationAPI.genererQuittancePDF(id);
          break;
          
        case 'recu':
          blob = await facturationAPI.genererRecuPDF(id);
          break;
          
        default:
          throw new Error('Téléchargement PDF non disponible pour ce type de document');
      }
      
      // Créer l'URL et déclencher le téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${id}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert(`Erreur lors du téléchargement: ${error.message}`);
    } finally {
      setDownloadLoading(false);
    }
  };

  const renderCompanyHeader = () => (
    <Box sx={{ textAlign: 'center', mb: 4, borderBottom: 2, borderColor: 'primary.main', pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <Box sx={{
          width: 48,
          height: 48,
          bgcolor: 'primary.main',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          mr: 2
        }}>
          AI
        </Box>
        <Typography variant="h4" sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #1976d2, #2196f3)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {companyInfo.name}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 3, mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <DescriptionIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
          {companyInfo.address}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <PhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
          {companyInfo.phone}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
          {companyInfo.email}
        </Typography>
      </Box>
      
      <Box sx={{ 
        bgcolor: 'grey.100',
        p: 1,
        borderRadius: 1,
        display: 'inline-block',
        mt: 1
      }}>
        <Typography variant="caption" color="text.secondary">
          SIRET: {companyInfo.siret} • TVA: {companyInfo.vat}
        </Typography>
      </Box>
    </Box>
  );

  const renderDocumentHeader = () => {
    if (!displayData) return null;
    
    const statusConfig = getStatusConfig(displayData.statut);
    
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
              {type === 'facture' ? 'FACTURE' : 
               type === 'quittance' ? 'QUITTANCE' :
               type === 'recu' ? 'REÇU DE PAIEMENT' :
               'TRANSACTION'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {type === 'facture' || type === 'quittance' ? `N° ${displayData.numero}` : 
               `Référence: ${displayData.reference}`}
            </Typography>
          </Box>
          <Chip 
            label={statusConfig.label}
            sx={{ 
              bgcolor: statusConfig.className === 'status-success' ? 'success.light' :
                      statusConfig.className === 'status-warning' ? 'warning.light' :
                      statusConfig.className === 'status-error' ? 'error.light' :
                      statusConfig.className === 'status-info' ? 'info.light' : 'grey.300',
              color: statusConfig.className === 'status-success' ? 'success.dark' :
                     statusConfig.className === 'status-warning' ? 'warning.dark' :
                     statusConfig.className === 'status-error' ? 'error.dark' :
                     statusConfig.className === 'status-info' ? 'info.dark' : 'grey.700',
              fontWeight: 'bold',
              fontSize: '0.75rem'
            }}
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
      </Box>
    );
  };

  const renderTransactionDetails = () => {
    if (!displayData) return null;
    
    const statusConfig = getStatusConfig(displayData.statut);
    
    return (
      <Box>
        {renderDocumentHeader()}
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  <ReceiptIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Informations Générales
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Référence:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {displayData.reference}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Type:</Typography>
                    <Typography variant="body2">{displayData.type}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Date:</Typography>
                    <Typography variant="body2">{formatDate(displayData.dateInitiation)}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Méthode:</Typography>
                    <Typography variant="body2">
                      <span style={{ marginRight: '8px' }}>{getPaymentMethodIcon(displayData.methodePaiement)}</span>
                      {displayData.methodePaiement}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  <AccountBalanceIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Montant
                </Typography>
                
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {formatCurrency(displayData.montant)}
                  </Typography>
                  {displayData.montantNet && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Net: {formatCurrency(displayData.montantNet)}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Bénéficiaire
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                    {displayData.nomBeneficiaire} {displayData.prenomBeneficiaire}
                  </Typography>
                  
                  {displayData.identifiantNational && (
                    <Typography variant="body2" color="text.secondary">
                      Identifiant: {displayData.identifiantNational}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  <DescriptionIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Informations Supplémentaires
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  {displayData.referenceBanque && (
                    <Typography variant="body2">
                      <strong>Référence bancaire:</strong> {displayData.referenceBanque}
                    </Typography>
                  )}
                  
                  {displayData.details && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Détails:</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        p: 1, 
                        bgcolor: 'grey.50', 
                        borderRadius: 1, 
                        mt: 0.5,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {typeof displayData.details === 'string' 
                          ? displayData.details 
                          : JSON.stringify(displayData.details, null, 2)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderFactureDetails = () => {
    if (!displayData) return null;
    
    const statusConfig = getStatusConfig(displayData.statut);
    const isQuittance = type === 'quittance';
    
    return (
      <Box>
        {renderDocumentHeader()}
        
        {/* Section Montants */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              <PaymentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              {isQuittance ? 'Montant Payé' : 'Récapitulatif Financier'}
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2, borderRight: { md: 1 }, borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total {isQuittance ? 'Facture' : 'TTC'}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {formatCurrency(displayData.montantTotal)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2, borderRight: { md: 1 }, borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {isQuittance ? 'Montant Réglé' : 'Déjà Payé'}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {formatCurrency(displayData.montantPaye)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {isQuittance ? 'Solde' : 'Reste à Payer'}
                  </Typography>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 'bold', 
                    color: displayData.montantRestant > 0 ? 'error.main' : 'success.main'
                  }}>
                    {formatCurrency(displayData.montantRestant)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {displayData.montantCouvert && (
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="body2">
                  <strong>Prise en charge:</strong> {formatCurrency(displayData.montantCouvert)}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        
        {/* Informations des parties */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  BÉNÉFICIAIRE
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                    {displayData.nomBeneficiaire} {displayData.prenomBeneficiaire}
                  </Typography>
                  
                  {displayData.identifiantBeneficiaire && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Identifiant:</strong> {displayData.identifiantBeneficiaire}
                    </Typography>
                  )}
                  
                  {displayData.telephoneBeneficiaire && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Téléphone:</strong> {displayData.telephoneBeneficiaire}
                    </Typography>
                  )}
                  
                  {displayData.emailBeneficiaire && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Email:</strong> {displayData.emailBeneficiaire}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  <AccountBalanceIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  PAYEUR / ASSUREUR
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                    {displayData.libellePayeur}
                  </Typography>
                  
                  {displayData.tauxCouverture && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Taux de couverture:</strong> {displayData.tauxCouverture}%
                    </Typography>
                  )}
                  
                  {displayData.typePayeur && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Type:</strong> {displayData.typePayeur}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Dates */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              <CalendarIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Dates Importantes
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Date de facturation:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {formatDate(displayData.dateFacture)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">Date d'échéance:</Typography>
                <Typography variant="body1" sx={{ 
                  fontWeight: 'medium',
                  color: new Date(displayData.dateEcheance) < new Date() && displayData.statut !== 'Payée' ? 'error.main' : 'inherit'
                }}>
                  {formatDate(displayData.dateEcheance)}
                </Typography>
              </Grid>
              
              {displayData.datePaiement && (
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">Date de paiement:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {formatDate(displayData.datePaiement)}
                  </Typography>
                </Grid>
              )}
            </Grid>
            
            {displayData.referencePaiement && (
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="body2">
                  <strong>Référence paiement:</strong> {displayData.referencePaiement}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        
        {/* Prestations */}
        {displayData.prestations && displayData.prestations.length > 0 && (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                <LocalHospitalIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Prestations Facturées
              </Typography>
              
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Libellé</TableCell>
                      <TableCell align="right">Quantité</TableCell>
                      <TableCell align="right">Prix unitaire</TableCell>
                      <TableCell align="right">Montant</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayData.prestations.map((prestation, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {prestation.libelle || prestation.LIBELLE}
                        </TableCell>
                        <TableCell align="right">
                          {prestation.quantite || prestation.QUANTITE || 1}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(prestation.prix_unitaire || prestation.PRIX_UNITAIRE || 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                          {formatCurrency(prestation.montant || prestation.MONTANT || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
        
        {/* Observations */}
        {displayData.observations && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Observations
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {displayData.observations}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  const renderRecuDetails = () => {
    if (!displayData) return null;
    
    return (
      <Box>
        {renderDocumentHeader()}
        
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ 
            display: 'inline-block', 
            p: 3, 
            border: '2px solid',
            borderColor: 'success.main',
            borderRadius: 2,
            bgcolor: 'success.light',
            color: 'success.dark'
          }}>
            <Typography variant="h6" gutterBottom>
              PAIEMENT CONFIRMÉ
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(displayData.montant)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Le {formatDate(displayData.date)}
            </Typography>
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Bénéficiaire
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                    {displayData.nomBeneficiaire} {displayData.prenomBeneficiaire}
                  </Typography>
                  
                  {displayData.identifiantNational && (
                    <Typography variant="body2" color="text.secondary">
                      Identifiant: {displayData.identifiantNational}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  <ReceiptIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Détails du Paiement
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Méthode:</strong> {displayData.methodePaiement}
                  </Typography>
                  
                  <Typography variant="body2">
                    <strong>Statut:</strong> {displayData.statut}
                  </Typography>
                  
                  {displayData.factureReference && (
                    <Typography variant="body2">
                      <strong>Facture:</strong> {displayData.factureReference}
                    </Typography>
                  )}
                  
                  {displayData.factureMontant && (
                    <Typography variant="body2">
                      <strong>Montant facture:</strong> {formatCurrency(displayData.factureMontant)}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" align="center">
              Ce reçu atteste que le paiement a été effectué avec succès.
              Conservez-le comme justificatif de paiement.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>
            Chargement du document...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          action={
            <Button color="inherit" size="small" onClick={onClose}>
              RETOUR
            </Button>
          }
        >
          <Typography variant="h6" gutterBottom>
            Erreur de chargement
          </Typography>
          <Typography>{error}</Typography>
        </Alert>
      );
    }

    if (!displayData) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucune donnée disponible pour ce document.
        </Alert>
      );
    }

    switch (type) {
      case 'transaction':
        return renderTransactionDetails();
      case 'facture':
      case 'quittance':
        return renderFactureDetails();
      case 'recu':
        return renderRecuDetails();
      default:
        return (
          <Alert severity="warning">
            Type de document non supporté: {type}
          </Alert>
        );
    }
  };

  const renderFooter = () => (
    <Box sx={{ 
      mt: 4, 
      pt: 2, 
      borderTop: 1, 
      borderColor: 'divider',
      textAlign: 'center',
      color: 'text.secondary'
    }}>
      <Typography variant="body2" gutterBottom>
        <strong>Document généré automatiquement</strong> • {formatDate(new Date())}
      </Typography>
      <Typography variant="caption">
        Pour toute question, contactez notre service client au {companyInfo.phone}
      </Typography>
    </Box>
  );

  return (
    <Box>
      {/* Contenu principal pour l'impression */}
      <Box sx={{ p: 3, bgcolor: 'white' }} ref={printRef}>
        {renderCompanyHeader()}
        {renderContent()}
        {renderFooter()}
      </Box>

      {/* Actions */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        mt: 3,
        p: 2,
        bgcolor: 'grey.50',
        borderRadius: 1
      }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onClose}
          variant="outlined"
        >
          Retour
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(type === 'facture' || type === 'quittance' || type === 'recu') && (
            <Button
              startIcon={downloadLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
              onClick={handleDownloadPDF}
              variant="outlined"
              disabled={downloadLoading || !id}
              sx={{ minWidth: 180 }}
            >
              {downloadLoading ? 'Téléchargement...' : 'Télécharger PDF'}
            </Button>
          )}
          
          <Button
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            variant="contained"
            color="primary"
            sx={{ minWidth: 140 }}
          >
            Imprimer
          </Button>
        </Box>
      </Box>

      {/* Instructions d'impression */}
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Instructions d'impression
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Le document sera imprimé au format A4. Assurez-vous que votre imprimante est configurée correctement.
            Pour une meilleure qualité, utilisez l'impression recto-verso.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PrintDetails;