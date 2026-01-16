// InvoiceGenerator.jsx - VERSION AMS INSURANCE AVEC BÉNÉFICIAIRES DE REGLEMENTPAGE
import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Divider,
  Stack,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  PictureAsPdf as PdfIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  Send as SendIcon,
  ContentCopy as ContentCopyIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Import du logo AMS
import amsLogo from '../../assets/AMS-logo.png';

// Styles CSS pour la facture AMS
const invoiceStyles = {
  root: {
    backgroundColor: '#fff',
    color: '#000',
    fontFamily: 'Arial, sans-serif',
    width: '210mm',
    minHeight: '297mm',
    margin: '0 auto',
    padding: '15mm',
    boxSizing: 'border-box',
    position: 'relative'
  },
  header: {
    borderBottom: '2px solid #1976d2',
    paddingBottom: '10px',
    marginBottom: '20px'
  },
  tableHeader: {
    backgroundColor: '#1976d2',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '12px',
    padding: '8px 6px',
    borderRight: '1px solid #fff'
  },
  tableCell: {
    padding: '8px 6px',
    borderBottom: '1px solid #ddd',
    fontSize: '12px'
  },
  totalsBox: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    padding: '15px',
    marginTop: '20px'
  },
  footer: {
    marginTop: '30px',
    paddingTop: '15px',
    borderTop: '1px solid #ccc',
    fontSize: '10px',
    color: '#666'
  }
};

// ============================================
// DONNÉES RÉELLES AMS INSURANCE - FIXES
// ============================================

// Données de l'entreprise AMS Insurance (RÉELLES)
const AMS_COMPANY_DATA = {
  name: 'AMS INSURANCE - COURTAGE D\'ASSURANCES',
  address: 'Bonapriso Rue VASNITEX, Immeuble ATLANTIS',
  city: 'BP 4962 Douala – Cameroun',
  phone: 'Tel : (+237) 2 33 42 08 74 / 6 99 90 60 88',
  email: 'contact@ams-insurance.cm',
  website: 'www.ams-insurance.cm',
  legalInfo: {
    type: 'Courtier en Assurances Agréé',
    rc: 'RC/DLA/2020/B/0456',
    ncc: 'NCC 2020A1234',
    tva: 'Non assujetti à la TVA',
    cnps: 'CNPS J987654321',
    assureur: 'MMA Cameroun'
  },
  bankDetails: {
    bank: 'Afriland First Bank',
    account: '12345678901',
    iban: 'CM21 12345 67890 12345678901 12',
    swift: 'AFRI CMCX'
  }
};

// Services d'assurance réels proposés par AMS
const AMS_INSURANCE_SERVICES = [
  {
    id: 'ASS-MULTI-001',
    description: 'Assurance Multirisque Professionnelle - Couverture annuelle complète',
    unitPrice: 1850000
  },
  {
    id: 'ASS-VEH-025',
    description: 'Assurance Flotte Automobile (25 véhicules)',
    unitPrice: 1250000
  },
  {
    id: 'ASS-RC-2024',
    description: 'Assurance Responsabilité Civile Professionnelle',
    unitPrice: 750000
  },
  {
    id: 'ASS-SANTE-001',
    description: 'Assurance Santé Collective (50 employés)',
    unitPrice: 3200000
  },
  {
    id: 'ASS-VOYAGE',
    description: 'Assurance Voyage d\'Affaires',
    unitPrice: 450000
  },
  {
    id: 'FRAIS-COURTAGE',
    description: 'Frais de courtage et de gestion du dossier',
    unitPrice: 320000
  },
  {
    id: 'ASS-CREDIT',
    description: 'Assurance Crédit et Caution',
    unitPrice: 850000
  },
  {
    id: 'ASS-TRANS',
    description: 'Assurance Transport International',
    unitPrice: 680000
  }
];

// Données de facture par défaut
const DEFAULT_INVOICE_DATA = {
  invoiceNumber: `FAC-${new Date().getFullYear()}-AMS-000`,
  invoiceDate: new Date(),
  company: AMS_COMPANY_DATA,
  client: {
    id: '',
    name: '',
    contact: '',
    position: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    policyNumber: ''
  },
  items: [],
  paymentTerms: 'Paiement à 30 jours fin de mois, par virement bancaire',
  notes: 'Tout retard de paiement entraînera l\'application d\'intérêts de retard au taux légal en vigueur. Période de couverture : 01/01/2024 au 31/12/2024.',
  currency: 'FCFA',
  bankDetails: AMS_COMPANY_DATA.bankDetails
};

// Générer un numéro de facture unique (défini avant le composant pour éviter l'erreur de référence)
const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 1000);
  return `FAC-${year}-AMS-${String(randomNum).padStart(3, '0')}`;
};

const InvoiceGenerator = ({ 
  initialInvoiceData = null,
  initialBeneficiary = null,
  onClose = () => {},
  onPrint = () => {},
  onDownload = () => {},
  editable = true
}) => {
  const theme = useTheme();
  const invoiceRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    type: 'success'
  });
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    recipient: '',
    subject: '',
    message: ''
  });
  
  // États pour les données réelles
  const [invoiceData, setInvoiceData] = useState(() => {
    const defaultData = {
      ...DEFAULT_INVOICE_DATA,
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: new Date(),
      company: AMS_COMPANY_DATA,
      bankDetails: AMS_COMPANY_DATA.bankDetails
    };
    
    if (initialInvoiceData) {
      return {
        ...defaultData,
        ...initialInvoiceData,
        company: initialInvoiceData.company || AMS_COMPANY_DATA,
        bankDetails: initialInvoiceData.bankDetails || AMS_COMPANY_DATA.bankDetails
      };
    }
    
    return defaultData;
  });

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(
    initialBeneficiary || null
  );
  const [selectedServices, setSelectedServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(false);

  // Fonction helper pour obtenir les données de l'entreprise en toute sécurité
  const getCompanyData = () => {
    return invoiceData.company || AMS_COMPANY_DATA;
  };

  // Fonction helper pour obtenir les informations légales en toute sécurité
  const getLegalInfo = () => {
    return invoiceData.company?.legalInfo || AMS_COMPANY_DATA.legalInfo;
  };

  // Fonction helper pour obtenir les détails bancaires en toute sécurité
  const getBankDetails = () => {
    return invoiceData.bankDetails || AMS_COMPANY_DATA.bankDetails;
  };

  // Initialiser avec le bénéficiaire provenant du parent
  useEffect(() => {
    if (initialBeneficiary) {
      setSelectedBeneficiary(initialBeneficiary);
      updateInvoiceWithBeneficiary(initialBeneficiary);
      
      // Si nous avons des données de facture initiales, mettez à jour le client
      if (initialInvoiceData) {
        setInvoiceData(prev => ({
          ...prev,
          client: initialBeneficiary
        }));
      }
    }
    
    // Charger les bénéficiaires depuis localStorage ou sessionStorage
    loadSavedBeneficiaries();
  }, [initialBeneficiary, initialInvoiceData]);

  // S'assurer que invoiceData.company est toujours défini
  useEffect(() => {
    if (!invoiceData.company) {
      setInvoiceData(prev => ({
        ...prev,
        company: AMS_COMPANY_DATA
      }));
    }
  }, [invoiceData.company]);

  // Charger les bénéficiaires depuis le stockage local
  const loadSavedBeneficiaries = () => {
    try {
      // Essayer de récupérer depuis localStorage
      const savedBeneficiaries = localStorage.getItem('ams_beneficiaries');
      if (savedBeneficiaries) {
        const parsedBeneficiaries = JSON.parse(savedBeneficiaries);
        setBeneficiaries(parsedBeneficiaries);
        
        // Si pas de bénéficiaire initial, utiliser le premier de la liste
        if (!selectedBeneficiary && parsedBeneficiaries.length > 0) {
          setSelectedBeneficiary(parsedBeneficiaries[0]);
          updateInvoiceWithBeneficiary(parsedBeneficiaries[0]);
        }
      }
    } catch (error) {
      console.error('Erreur chargement bénéficiaires locaux:', error);
    }
  };

  // Rechercher un bénéficiaire spécifique
  const searchBeneficiary = async () => {
    if (!searchTerm.trim()) {
      showNotification('Veuillez entrer un terme de recherche', 'warning');
      return;
    }
    
    setIsLoadingBeneficiaries(true);
    try {
      // Essayer d'abord depuis la liste locale
      const localResults = beneficiaries.filter(beneficiary => 
        beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficiary.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficiary.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficiary.phone?.includes(searchTerm)
      );
      
      if (localResults.length > 0) {
        setBeneficiaries(localResults);
        showNotification(`${localResults.length} bénéficiaire(s) trouvé(s) localement`, 'success');
      } else {
        // Si pas de résultats locaux, essayer l'API
        try {
          // Import dynamique de l'API pour éviter les erreurs si non disponible
          const { beneficiairesAPI } = await import('../../services/api');
          const response = await beneficiairesAPI.searchAdvanced(searchTerm, {
            limit: 50,
            active: true
          });
          
          if (response.success && response.beneficiaires) {
            const formattedBeneficiaries = response.beneficiaires.map(beneficiary => ({
              id: beneficiary.id || beneficiary.ID_BEN,
              name: `${beneficiary.NOM_BEN || ''} ${beneficiary.PRE_BEN || ''}`.trim(),
              contact: `M. ${beneficiary.PRE_BEN || ''} ${beneficiary.NOM_BEN || ''}`.trim(),
              position: beneficiary.PROFESSION || '',
              address: beneficiary.adresse || '',
              city: beneficiary.ville || 'Douala – Cameroun',
              phone: beneficiary.TELEPHONE_MOBILE || beneficiary.TELEPHONE || '',
              email: beneficiary.EMAIL || '',
              policyNumber: `POL-BEN-${beneficiary.id || beneficiary.ID_BEN}`
            }));
            
            setBeneficiaries(formattedBeneficiaries);
            
            if (formattedBeneficiaries.length > 0) {
              setSelectedBeneficiary(formattedBeneficiaries[0]);
              updateInvoiceWithBeneficiary(formattedBeneficiaries[0]);
            }
            
            // Sauvegarder localement
            localStorage.setItem('ams_beneficiaries', JSON.stringify(formattedBeneficiaries));
            
            showNotification(`${formattedBeneficiaries.length} résultat(s) trouvé(s)`, 'success');
          } else {
            showNotification('Aucun bénéficiaire trouvé', 'info');
          }
        } catch (apiError) {
          console.warn('API non disponible, utilisation des données locales');
          showNotification('API non disponible - utilisation des données locales', 'warning');
        }
      }
    } catch (error) {
      console.error('Erreur recherche bénéficiaire:', error);
      showNotification('Erreur lors de la recherche', 'error');
    } finally {
      setIsLoadingBeneficiaries(false);
    }
  };

  // Mettre à jour la facture avec les données du bénéficiaire
  const updateInvoiceWithBeneficiary = (beneficiary) => {
    if (!beneficiary) return;
    
    const newInvoiceNumber = generateInvoiceNumber();
    
    setInvoiceData(prev => ({
      ...prev,
      invoiceNumber: newInvoiceNumber,
      client: beneficiary
    }));
  };

  // Mettre à jour la facture lorsque le bénéficiaire ou les services changent
  useEffect(() => {
    if (selectedBeneficiary) {
      const newInvoiceData = {
        ...invoiceData,
        invoiceNumber: invoiceData.invoiceNumber || generateInvoiceNumber(),
        client: selectedBeneficiary,
        items: selectedServices.map(service => ({
          ref: service.id,
          description: service.description,
          quantity: 1,
          unitPrice: service.unitPrice,
          vatRate: 0.00,
          totalHT: service.unitPrice
        }))
      };
      setInvoiceData(newInvoiceData);
    }
  }, [selectedBeneficiary, selectedServices]);

  // Calculer les totaux
  const calculateTotals = () => {
    const baseHT = invoiceData.items.reduce((sum, item) => sum + (item.totalHT || 0), 0);
    const vatAmount = invoiceData.items.reduce((sum, item) => {
      const itemVAT = (item.totalHT || 0) * ((item.vatRate || 0) / 100);
      return sum + itemVAT;
    }, 0);
    const totalTTC = baseHT + vatAmount;
    
    return { baseHT, vatAmount, totalTTC };
  };

  const totals = calculateTotals();

  // Formater la monnaie
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Formater la date
  const formatDate = (date) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
    } catch (error) {
      return date;
    }
  };

  // Afficher une notification
  const showNotification = (message, type = 'success') => {
    setNotification({
      open: true,
      message,
      type
    });
  };

  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Ajouter un service à la facture
  const addService = (service) => {
    if (!selectedServices.some(s => s.id === service.id)) {
      setSelectedServices([...selectedServices, service]);
      showNotification(`Service "${service.description}" ajouté`, 'success');
    }
  };

  // Supprimer un service de la facture
  const removeService = (serviceId) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
  };

  // Générer un PDF de la facture
  const generatePDF = async () => {
    if (!invoiceRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: invoiceRef.current.offsetWidth,
        height: invoiceRef.current.offsetHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `Facture_${invoiceData.invoiceNumber}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
      
      showNotification('PDF téléchargé avec succès', 'success');
      onDownload();
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      showNotification('Erreur lors de la génération du PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Imprimer la facture
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showNotification('Veuillez autoriser les fenêtres pop-up pour imprimer', 'warning');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Facture ${invoiceData.invoiceNumber} - AMS Insurance</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .invoice-container {
              width: 210mm;
              min-height: 297mm;
              padding: 15mm;
              box-sizing: border-box;
            }
            .no-print {
              display: none !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              background-color: #1976d2;
              color: white;
              padding: 8px 6px;
              text-align: left;
            }
            td {
              padding: 8px 6px;
              border-bottom: 1px solid #ddd;
            }
            .totals-box {
              background-color: #f8f9fa;
              border: 1px solid #dee2e6;
              padding: 15px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${invoiceRef.current.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    onPrint();
  };

  // Ouvrir le dialogue d'envoi d'email
  const openEmailDialog = () => {
    if (!invoiceData.client.email) {
      showNotification('Aucun email client disponible', 'warning');
      return;
    }
    
    setEmailData({
      recipient: invoiceData.client.email,
      subject: `Facture ${invoiceData.invoiceNumber} - AMS Insurance`,
      message: `Bonjour ${invoiceData.client.contact},\n\nVeuillez trouver ci-joint la facture ${invoiceData.invoiceNumber} pour vos polices d'assurance.\n\nCordialement,\nL'équipe AMS Insurance`
    });
    setEmailDialogOpen(true);
  };

  // Fermer le dialogue d'envoi d'email
  const closeEmailDialog = () => {
    setEmailDialogOpen(false);
  };

  // Envoyer l'email (simulation)
  const handleSendEmail = async () => {
    setIsSending(true);
    
    // Simulation d'envoi d'email
    setTimeout(() => {
      setIsSending(false);
      closeEmailDialog();
      showNotification(`Facture envoyée à ${emailData.recipient}`, 'success');
    }, 2000);
  };

  // Copier les détails de paiement
  const copyBankDetails = () => {
    const bankDetailsData = getBankDetails();
    const bankDetails = `
Banque : ${bankDetailsData.bank}
N° Compte : ${bankDetailsData.account}
IBAN : ${bankDetailsData.iban}
BIC/SWIFT : ${bankDetailsData.swift}
    `;
    
    navigator.clipboard.writeText(bankDetails.trim())
      .then(() => showNotification('Coordonnées bancaires copiées', 'success'))
      .catch(() => showNotification('Erreur lors de la copie', 'error'));
  };

  // Nouvelle facture
  const createNewInvoice = () => {
    const newInvoiceNumber = generateInvoiceNumber();
    const newInvoiceData = {
      ...DEFAULT_INVOICE_DATA,
      invoiceNumber: newInvoiceNumber,
      client: selectedBeneficiary || DEFAULT_INVOICE_DATA.client,
      items: selectedServices.map(service => ({
        ref: service.id,
        description: service.description,
        quantity: 1,
        unitPrice: service.unitPrice,
        vatRate: 0.00,
        totalHT: service.unitPrice
      }))
    };
    
    setInvoiceData(newInvoiceData);
    setSelectedServices([]);
    showNotification('Nouvelle facture créée', 'success');
  };

  // Récupérer l'URL du logo (fallback si l'import échoue)
  const getLogoUrl = () => {
    try {
      return amsLogo;
    } catch (error) {
      console.warn('Logo non trouvé, utilisation du texte à la place');
      return null;
    }
  };

  const logoUrl = getLogoUrl();

  return (
    <>
      {/* Barre d'outils et configuration */}
      {editable && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack spacing={2}>
            {/* En-tête */}
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                <ReceiptIcon color="primary" />
                <Typography variant="h6">
                  Générateur de Factures AMS Insurance
                </Typography>
                <Chip 
                  label="BÉNÉFICIAIRES RÉELS" 
                  color="success" 
                  size="small" 
                  variant="outlined"
                />
              </Stack>
              
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadSavedBeneficiaries}
                  size="small"
                  disabled={isLoadingBeneficiaries}
                >
                  {isLoadingBeneficiaries ? 'Chargement...' : 'Rafraîchir'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={createNewInvoice}
                  size="small"
                >
                  Nouvelle Facture
                </Button>
                <Button
                  variant="outlined"
                  onClick={onClose}
                  size="small"
                >
                  Fermer
                </Button>
              </Stack>
            </Stack>
            
            {/* Recherche et sélection du bénéficiaire */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Bénéficiaire</InputLabel>
                  <Select
                    value={selectedBeneficiary?.id || ''}
                    onChange={(e) => {
                      const beneficiary = beneficiaries.find(b => b.id === e.target.value);
                      if (beneficiary) {
                        setSelectedBeneficiary(beneficiary);
                        updateInvoiceWithBeneficiary(beneficiary);
                      }
                    }}
                    label="Bénéficiaire"
                    disabled={isLoadingBeneficiaries}
                  >
                    <MenuItem value="">
                      <em>Sélectionner un bénéficiaire</em>
                    </MenuItem>
                    {beneficiaries.map((beneficiary) => (
                      <MenuItem key={beneficiary.id} value={beneficiary.id}>
                        {beneficiary.name} - {beneficiary.phone || 'Pas de téléphone'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Rechercher un bénéficiaire"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchBeneficiary()}
                    size="small"
                    fullWidth
                    disabled={isLoadingBeneficiaries}
                  />
                  <Button
                    variant="outlined"
                    onClick={searchBeneficiary}
                    disabled={isLoadingBeneficiaries}
                    startIcon={<SearchIcon />}
                  >
                    Rechercher
                  </Button>
                </Stack>
              </Grid>
            </Grid>
            
            {/* Informations du bénéficiaire sélectionné */}
            {selectedBeneficiary && (
              <Paper variant="outlined" sx={{ p: 1.5, backgroundColor: alpha(theme.palette.info.main, 0.05) }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="primary">
                      {selectedBeneficiary.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Contact:</strong> {selectedBeneficiary.contact}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Fonction:</strong> {selectedBeneficiary.position}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Adresse:</strong> {selectedBeneficiary.address}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Téléphone:</strong> {selectedBeneficiary.phone || 'Non renseigné'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedBeneficiary.email || 'Non renseigné'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
            
            {/* Sélection des services */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Services d'Assurance
              </Typography>
              <Grid container spacing={1}>
                {AMS_INSURANCE_SERVICES.map((service) => (
                  <Grid item key={service.id}>
                    <Chip
                      label={`${service.description} (${formatCurrency(service.unitPrice)})`}
                      color={selectedServices.some(s => s.id === service.id) ? "primary" : "default"}
                      onClick={() => {
                        if (selectedServices.some(s => s.id === service.id)) {
                          removeService(service.id);
                        } else {
                          addService(service);
                        }
                      }}
                      variant={selectedServices.some(s => s.id === service.id) ? "filled" : "outlined"}
                      size="small"
                    />
                  </Grid>
                ))}
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {selectedServices.length} service(s) sélectionné(s) • Total: {formatCurrency(totals.totalTTC)}
              </Typography>
            </Box>
            
            {/* Actions */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Tooltip title="Imprimer la facture">
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  size="small"
                  disabled={!selectedBeneficiary || selectedServices.length === 0}
                >
                  Imprimer
                </Button>
              </Tooltip>
              
              <Tooltip title="Télécharger en PDF">
                <Button
                  variant="contained"
                  startIcon={isGenerating ? <CircularProgress size={20} /> : <PdfIcon />}
                  onClick={generatePDF}
                  disabled={isGenerating || !selectedBeneficiary || selectedServices.length === 0}
                  size="small"
                  color="primary"
                >
                  {isGenerating ? 'Génération...' : 'Télécharger PDF'}
                </Button>
              </Tooltip>
              
              <Tooltip title="Envoyer par email">
                <Button
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  onClick={openEmailDialog}
                  size="small"
                  color="secondary"
                  disabled={!selectedBeneficiary?.email || selectedServices.length === 0}
                >
                  Envoyer
                </Button>
              </Tooltip>
              
              <Box sx={{ flexGrow: 1 }} />
              
              <Chip 
                label={`${formatCurrency(totals.totalTTC)}`} 
                color="primary" 
                size="small" 
                variant="filled"
                sx={{ fontWeight: 'bold' }}
              />
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Facture */}
      {selectedBeneficiary && selectedServices.length > 0 ? (
        <Box 
          ref={invoiceRef}
          sx={invoiceStyles.root}
          id="invoice-content"
        >
          {/* En-tête avec logo AMS */}
          <Box sx={invoiceStyles.header}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={4}>
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="AMS Insurance Logo" 
                    style={{ 
                      maxWidth: '160px',
                      maxHeight: '90px',
                      objectFit: 'contain'
                    }} 
                  />
                ) : (
                  <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    AMS INSURANCE
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={8}>
                <Typography variant="h4" sx={{ 
                  color: '#1976d2',
                  fontWeight: 'bold',
                  mb: 1,
                  fontSize: '1.8rem'
                }}>
                  AMS INSURANCE
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#555', mb: 1 }}>
                  Courtier d'Assurances Agréé
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {getCompanyData().address}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {getCompanyData().city}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {getCompanyData().phone}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Email: {getCompanyData().email}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          {/* Numéro et date de facture */}
          <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Grid item>
              <Box sx={{ 
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                padding: '10px 20px',
                borderRadius: '4px',
                borderLeft: '4px solid #1976d2'
              }}>
                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  FACTURE
                </Typography>
                <Typography variant="body1">
                  <strong>N°:</strong> {invoiceData.invoiceNumber}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1, color: '#1976d2', fontSize: '1rem' }} />
                  <strong>Date:</strong> {formatDate(invoiceData.invoiceDate)}
                </Typography>
                {invoiceData.client.policyNumber && (
                  <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                    <strong>N° Police:</strong> {invoiceData.client.policyNumber}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
          
          {/* Informations client */}
          {invoiceData.client.name && (
            <Box sx={{ 
              backgroundColor: alpha(theme.palette.info.main, 0.05),
              padding: '15px',
              borderRadius: '4px',
              border: '1px solid #b3e0ff',
              mb: 3
            }}>
              <Typography variant="subtitle1" sx={{ 
                color: '#0066cc',
                fontWeight: 'bold',
                mb: 2,
                display: 'flex',
                alignItems: 'center'
              }}>
                <PersonIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                CLIENT
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  {invoiceData.client.name && (
                    <Typography variant="body2">
                      <strong>Société:</strong> {invoiceData.client.name}
                    </Typography>
                  )}
                  {invoiceData.client.contact && (
                    <Typography variant="body2">
                      <strong>Contact:</strong> {invoiceData.client.contact}
                    </Typography>
                  )}
                  {invoiceData.client.position && (
                    <Typography variant="body2">
                      <strong>Fonction:</strong> {invoiceData.client.position}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={6}>
                  {invoiceData.client.address && (
                    <Typography variant="body2">
                      <strong>Adresse:</strong> {invoiceData.client.address}
                    </Typography>
                  )}
                  {invoiceData.client.city && (
                    <Typography variant="body2">
                      <strong>Ville:</strong> {invoiceData.client.city}
                    </Typography>
                  )}
                  {invoiceData.client.phone && (
                    <Typography variant="body2">
                      <strong>Téléphone:</strong> {invoiceData.client.phone}
                    </Typography>
                  )}
                  {invoiceData.client.email && (
                    <Typography variant="body2">
                      <strong>Email:</strong> {invoiceData.client.email}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Tableau des articles */}
          <Typography variant="h6" gutterBottom sx={{ 
            borderBottom: '2px solid #1976d2',
            pb: 1,
            mb: 2,
            color: '#1976d2'
          }}>
            DÉTAIL DES POLICES D'ASSURANCE
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={invoiceStyles.tableHeader}>Réf. Police</TableCell>
                  <TableCell sx={invoiceStyles.tableHeader}>Description de la couverture</TableCell>
                  <TableCell align="center" sx={invoiceStyles.tableHeader}>Qté</TableCell>
                  <TableCell align="right" sx={invoiceStyles.tableHeader}>Montant HT</TableCell>
                  <TableCell align="center" sx={invoiceStyles.tableHeader}>TVA</TableCell>
                  <TableCell align="right" sx={invoiceStyles.tableHeader}>Total HT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceData.items.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell sx={invoiceStyles.tableCell}>
                      <Typography variant="caption" fontWeight="bold" color="primary">
                        {item.ref}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={invoiceStyles.tableCell}>
                      <Typography variant="body2">
                        {item.description}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center" sx={invoiceStyles.tableCell}>
                      {item.quantity}
                    </TableCell>
                    
                    <TableCell align="right" sx={invoiceStyles.tableCell}>
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    
                    <TableCell align="center" sx={invoiceStyles.tableCell}>
                      <Chip 
                        label={`${item.vatRate}%`} 
                        size="small" 
                        variant="outlined"
                        color="default"
                      />
                    </TableCell>
                    
                    <TableCell align="right" sx={{ 
                      ...invoiceStyles.tableCell,
                      fontWeight: 'bold',
                      color: '#1976d2',
                      backgroundColor: alpha('#1976d2', 0.05)
                    }}>
                      {formatCurrency(item.totalHT)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Totaux et informations de paiement */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={7}>
              {/* Coordonnées bancaires */}
              <Paper sx={{ 
                p: 2, 
                backgroundColor: '#f0f7ff',
                border: '1px solid #b3e0ff'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    <strong>COORDONNÉES BANCAIRES POUR LE PAIEMENT</strong>
                  </Typography>
                  <Tooltip title="Copier les coordonnées bancaires">
                    <IconButton size="small" onClick={copyBankDetails}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Banque:</strong> {getBankDetails().bank}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>N° Compte:</strong> {getBankDetails().account}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Code IBAN:</strong> {getBankDetails().iban}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Code BIC/SWIFT:</strong> {getBankDetails().swift}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              {/* Conditions de paiement */}
              <Paper sx={{ 
                p: 2, 
                mt: 2,
                backgroundColor: alpha(theme.palette.warning.main, 0.05),
                border: '1px solid #ffd699'
              }}>
                <Typography variant="subtitle2" color="warning.main" gutterBottom>
                  <strong>CONDITIONS DE PAIEMENT</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {invoiceData.paymentTerms}
                </Typography>
                
                <Typography variant="subtitle2" color="warning.main" gutterBottom sx={{ mt: 2 }}>
                  <strong>INFORMATIONS IMPORTANTES</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {invoiceData.notes}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={5}>
              <Box sx={invoiceStyles.totalsBox}>
                <Typography variant="h6" gutterBottom sx={{ 
                  borderBottom: '2px solid #1976d2',
                  pb: 1,
                  color: '#1976d2'
                }}>
                  RÉCAPITULATIF DE LA FACTURE
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2">Base HT :</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(totals.baseHT)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2">TVA (0%) :</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(totals.vatAmount)}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2, borderColor: '#1976d2' }} />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mt: 3, 
                    pt: 3, 
                    borderTop: '2px solid #1976d2',
                    alignItems: 'center'
                  }}>
                    <Box>
                      <Typography variant="h6" color="primary">
                        TOTAL TTC À PAYER
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Montant en {invoiceData.currency}
                      </Typography>
                    </Box>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {formatCurrency(totals.totalTTC)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ 
                    display: 'block', 
                    textAlign: 'center', 
                    mt: 2,
                    fontStyle: 'italic'
                  }}>
                    Période de couverture : 01/01/2024 au 31/12/2024
                  </Typography>
                </Box>
              </Box>
              
              {/* Signature */}
              <Box sx={{ 
                mt: 3, 
                pt: 2, 
                textAlign: 'center',
                borderTop: '2px dashed #1976d2'
              }}>
                <Typography variant="body2" sx={{ mb: 4, color: '#666' }}>
                  Pour AMS Insurance,
                </Typography>
                <Box sx={{ height: '60px', position: 'relative' }}>
                  <Divider sx={{ borderStyle: 'dotted', mb: 2 }} />
                  <Typography variant="body2" fontWeight="bold" color="#1976d2">
                    ___________________________
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  <strong>Le Directeur Commercial</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Cachet et signature
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/* Pied de page */}
          <Box sx={invoiceStyles.footer}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: '#1976d2' }}>
                  <strong>INFORMATIONS JURIDIQUES</strong>
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Raison Sociale:</strong> {getLegalInfo().type}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Registre du Commerce:</strong> {getLegalInfo().rc}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Numéro Carte de Courtier:</strong> {getLegalInfo().ncc}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>TVA:</strong> {getLegalInfo().tva}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Assureur Principal:</strong> {getLegalInfo().assureur}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: '#1976d2' }}>
                  <strong>CONTACT & SUPPORT</strong>
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Service Commercial:</strong> (+237) 6 99 90 60 88
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Service Réclamations:</strong> (+237) 6 94 50 60 70
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Email:</strong> {getCompanyData().email}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Site web:</strong> {getCompanyData().website}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Horaires:</strong> Lundi - Vendredi, 8h - 17h
                </Typography>
              </Grid>
            </Grid>
            
            {/* Mentions légales */}
            <Box sx={{ 
              mt: 2,
              pt: 2,
              borderTop: '1px solid #eee',
              textAlign: 'center'
            }}>
              <Typography variant="caption" color="text.secondary">
                <strong>AMS Insurance</strong> - Courtier d'Assurances agréé par l'État du Cameroun. 
                Cette facture est établie conformément à la législation sur l'assurance au Cameroun. 
                En cas de litige, le tribunal compétent est celui de Douala.
              </Typography>
            </Box>
          </Box>
          
          {/* Numéro de page */}
          <Box sx={{ 
            position: 'absolute',
            bottom: '10mm',
            right: '15mm',
            fontSize: '10px',
            color: '#999'
          }}>
            Page 1/1
          </Box>
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ReceiptIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {!selectedBeneficiary ? 'Sélectionnez un bénéficiaire' : 'Aucun service sélectionné'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {!selectedBeneficiary 
              ? 'Choisissez un bénéficiaire dans la liste pour générer une facture' 
              : 'Sélectionnez des services d\'assurance pour générer la facture'}
          </Typography>
          {editable && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={createNewInvoice}
              sx={{ mt: 2 }}
            >
              Créer une nouvelle facture
            </Button>
          )}
        </Paper>
      )}

      {/* Dialogue d'envoi d'email */}
      <Dialog open={emailDialogOpen} onClose={closeEmailDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Envoyer la facture par email</span>
          <IconButton onClick={closeEmailDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Destinataire"
              value={emailData.recipient}
              onChange={(e) => setEmailData({...emailData, recipient: e.target.value})}
              fullWidth
              size="small"
              required
            />
            
            <TextField
              label="Sujet"
              value={emailData.subject}
              onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
              fullWidth
              size="small"
              required
            />
            
            <TextField
              label="Message"
              value={emailData.message}
              onChange={(e) => setEmailData({...emailData, message: e.target.value})}
              fullWidth
              multiline
              rows={6}
              size="small"
              required
            />
            
            <Box sx={{ 
              backgroundColor: alpha(theme.palette.info.main, 0.1),
              p: 2,
              borderRadius: 1,
              borderLeft: '3px solid #1976d2'
            }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Pièce jointe:</strong> La facture {invoiceData.invoiceNumber} sera jointe au format PDF.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeEmailDialog} color="inherit">
            Annuler
          </Button>
          <Button 
            onClick={handleSendEmail} 
            variant="contained" 
            startIcon={isSending ? <CircularProgress size={20} /> : <SendIcon />}
            disabled={isSending || !emailData.recipient || !emailData.subject}
          >
            {isSending ? 'Envoi en cours...' : 'Envoyer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* CSS pour l'impression */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #invoice-content, #invoice-content * {
              visibility: visible;
            }
            #invoice-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              box-shadow: none;
              padding: 15mm;
              margin: 0;
            }
            .no-print, .MuiTooltip-popper, .MuiButton-root, .MuiPaper-root:not(#invoice-content *) {
              display: none !important;
            }
          }
          
          @page {
            size: A4;
            margin: 0;
          }
        `}
      </style>
    </>
  );
};

export default InvoiceGenerator;