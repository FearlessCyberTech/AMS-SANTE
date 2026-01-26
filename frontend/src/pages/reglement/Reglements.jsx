// ReglementPage.jsx - VERSION CORRIGÉE
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Badge,
  TablePagination,
  CircularProgress,
  useTheme,
  alpha,
  Stack,
  InputAdornment,
  Snackbar,
  Avatar,
  CardActionArea,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Fade,
  Slide,
  Grow,
  Fab
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  LocalAtm as CashIcon,
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  Smartphone as MobileIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  CalendarToday as CalendarIcon,
  BarChart as BarChartIcon,
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
  MonetizationOn as MonetizationIcon,
  Paid as PaidIcon,
  ReceiptLong as ReceiptLongIcon,
  Speed as SpeedIcon,
  DateRange as DateRangeIcon,
  Print as PrintIcon,
  SwapVert as SwapVertIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, subMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { financesAPI, facturationAPI } from '../../services/api';
import PaymentDialog from './PaymentDialog';
import FactureDialog from './FactureDialog';
import DetailDialog from './DetailDialog';

// Fonction pour extraire les valeurs de manière sécurisée
const extractValue = (data, keys) => {
  for (const key of keys) {
    const value = data[key];
    if (value !== undefined && value !== null) {
      // Si c'est un objet, extraire les valeurs communes
      if (typeof value === 'object') {
        return value.NOM_BEN || value.nom || value.PRE_BEN || value.prenom || 
               value.BENEFICIAIRE || value.numero || value.NUMERO_FACTURE || 
               JSON.stringify(value).substring(0, 50);
      }
      return value;
    }
  }
  return 'N/A';
};

// Fonction pour normaliser les données de facture
const normalizeFacture = (facture) => {
  if (!facture) return facture;
  
  return {
    ...facture,
    // Normalisation des noms de champs
    id: extractValue(facture, ['id', 'COD_FACTURE', 'ID_FACTURE']),
    numero: extractValue(facture, ['numero', 'NUMERO_FACTURE', 'numero_facture']),
    nom_ben: extractValue(facture, ['NOM_BEN', 'nom_ben', 'nom']),
    prenom_ben: extractValue(facture, ['PRE_BEN', 'PRENOM_BEN', 'prenom_ben', 'prenom']),
    montant_total: parseFloat(extractValue(facture, ['MONTANT_TOTAL', 'montant_total', 'montant']) || 0),
    montant_paye: parseFloat(extractValue(facture, ['MONTANT_PAYE', 'montant_paye']) || 0),
    montant_restant: parseFloat(extractValue(facture, ['MONTANT_RESTANT', 'montant_restant']) || 0),
    date_facture: extractValue(facture, ['DATE_FACTURE', 'date_facture']),
    date_echeance: extractValue(facture, ['DATE_ECHEANCE', 'date_echeance']),
    statut: extractValue(facture, ['STATUT_FACTURE', 'statut', 'STATUT']),
    cod_ben: extractValue(facture, ['COD_BEN', 'cod_ben', 'beneficiaryId']),
    telephone: extractValue(facture, ['TELEPHONE', 'telephone', 'phone'])
  };
};

// Fonction pour normaliser les données de transaction
const normalizeTransaction = (transaction) => {
  if (!transaction) return transaction;
  
  return {
    ...transaction,
    id: extractValue(transaction, ['id', 'COD_TRANS', 'ID_TRANSACTION']),
    reference: extractValue(transaction, ['REFERENCE_TRANSACTION', 'reference', 'reference_transaction']),
    beneficiaire: extractValue(transaction, ['BENEFICIAIRE', 'beneficiaire', 'NOM_BEN', 'nom_ben']),
    nom_ben: extractValue(transaction, ['NOM_BEN', 'nom_ben', 'nom']),
    prenom_ben: extractValue(transaction, ['PRENOM_BEN', 'prenom_ben', 'prenom']),
    montant: parseFloat(extractValue(transaction, ['MONTANT', 'montant']) || 0),
    methode_paiement: extractValue(transaction, ['METHODE_PAIEMENT', 'methode_paiement', 'method']),
    statut: extractValue(transaction, ['STATUT_TRANSACTION', 'statut', 'STATUT']),
    date_initiation: extractValue(transaction, ['DATE_INITIATION', 'date_initiation', 'date']),
    cod_ben: extractValue(transaction, ['COD_BEN', 'cod_ben']),
    observations: extractValue(transaction, ['OBSERVATIONS', 'observations'])
  };
};

// Fonction pour formater les dates pour l'API
const formatDateForAPI = (date) => {
  if (!date) return null;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      console.warn('⚠️ Date invalide pour formatage:', date);
      return null;
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('❌ Erreur formatage date:', error);
    return null;
  }
};

const ReglementPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
  // États principaux
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState({
    dashboard: false,
    transactions: false,
    factures: false
  });
  
  // États pour les données
  const [dashboardData, setDashboardData] = useState({
    resume: {
      transactions: { total_jour: 0, total_mois: 0, montant_total_mois: 0 },
      factures_en_retard: 0
    },
    transactions_recentes: [],
    factures_en_retard: [],
    evolution_mensuelle: []
  });
  
  const [transactions, setTransactions] = useState([]);
  const [transactionFilters, setTransactionFilters] = useState({
    status: 'all',
    type: 'all',
    method: 'all',
    search: '',
    dateDebut: subDays(new Date(), 30),
    dateFin: new Date(),
    page: 0,
    limit: 10,
    total: 0,
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  const [factures, setFactures] = useState([]);
  const [factureFilters, setFactureFilters] = useState({
    statut: 'all',
    search: '',
    dateDebut: subMonths(new Date(), 1),
    dateFin: new Date(),
    page: 0,
    limit: 10,
    total: 0,
    sortBy: 'date_echeance',
    sortOrder: 'asc'
  });
  
  // États pour les dialogues
  const [paymentDialog, setPaymentDialog] = useState({
    open: false,
    type: 'facture',
    data: null
  });
  
  const [factureDialog, setFactureDialog] = useState({
    open: false,
    mode: 'create',
    data: null
  });
  
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    type: '',
    data: null
  });
  
  // États pour les notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    type: 'info'
  });
  
  // Configuration des couleurs par statut
  const statusConfig = {
    'Reussi': { 
      color: theme.palette.success.main, 
      label: 'Réussi', 
      icon: <CheckIcon />,
      bgColor: alpha(theme.palette.success.main, 0.1)
    },
    'Validé': { 
      color: theme.palette.success.main, 
      label: 'Validé', 
      icon: <CheckIcon />,
      bgColor: alpha(theme.palette.success.main, 0.1)
    },
    'Payé': { 
      color: theme.palette.success.main, 
      label: 'Payé', 
      icon: <CheckIcon />,
      bgColor: alpha(theme.palette.success.main, 0.1)
    },
    'Payée': { 
      color: theme.palette.success.main, 
      label: 'Payée', 
      icon: <CheckIcon />,
      bgColor: alpha(theme.palette.success.main, 0.1)
    },
    'En cours': { 
      color: theme.palette.warning.main, 
      label: 'En cours', 
      icon: <RefreshIcon />,
      bgColor: alpha(theme.palette.warning.main, 0.1)
    },
    'En attente': { 
      color: theme.palette.warning.main, 
      label: 'En attente', 
      icon: <WarningIcon />,
      bgColor: alpha(theme.palette.warning.main, 0.1)
    },
    'Echoue': { 
      color: theme.palette.error.main, 
      label: 'Échoué', 
      icon: <ErrorIcon />,
      bgColor: alpha(theme.palette.error.main, 0.1)
    },
    'Annulee': { 
      color: theme.palette.error.main, 
      label: 'Annulée', 
      icon: <ErrorIcon />,
      bgColor: alpha(theme.palette.error.main, 0.1)
    },
    'Partiellement payée': { 
      color: theme.palette.info.main, 
      label: 'Partiel', 
      icon: <WarningIcon />,
      bgColor: alpha(theme.palette.info.main, 0.1)
    }
  };
  
  const paymentMethods = {
    'MobileMoney': { 
      icon: <MobileIcon />, 
      label: 'Mobile Money',
      color: theme.palette.primary.main
    },
    'CarteBancaire': { 
      icon: <CardIcon />, 
      label: 'Carte Bancaire',
      color: theme.palette.secondary.main
    },
    'Virement': { 
      icon: <BankIcon />, 
      label: 'Virement',
      color: theme.palette.info.main
    },
    'Espèces': { 
      icon: <CashIcon />, 
      label: 'Espèces',
      color: theme.palette.success.main
    }
  };
  
  // Fonction utilitaire pour formater les montants
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };
  
  // Fonction utilitaire pour formater les dates
  const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : parseISO(date);
      return format(dateObj, formatStr, { locale: fr });
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return 'Date invalide';
    }
  };
  
  // Fonction pour afficher des notifications
  const showNotification = (message, type = 'info') => {
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
  
  // Charger le tableau de bord
  const loadDashboard = async () => {
    try {
      setLoading(prev => ({ ...prev, dashboard: true }));
      
      console.log('📊 Chargement du tableau de bord...');
      const response = await financesAPI.getDashboard('mois');
      
      if (response.success) {
        console.log('📊 Données dashboard reçues:', response);
        
        const data = response.dashboard || response.data || response;
        
        const transactions_today = data.transactions_aujourdhui || 
                                  data.today_transactions || 
                                  data.resume?.transactions?.total_jour || 0;
        
        const transactions_month = data.transactions_mois || 
                                  data.month_transactions || 
                                  data.resume?.transactions?.total_mois || 0;
        
        const montant_month = data.montant_total_mois || 
                             data.monthly_amount || 
                             data.resume?.transactions?.montant_total_mois || 0;
        
        const factures_en_retard = data.factures_en_retard || 
                                  data.overdue_invoices || 
                                  data.resume?.factures_en_retard || 0;
        
        // Normaliser les données
        const normalizedTransactions = (data.transactions_recentes || 
                                      data.recent_transactions || 
                                      data.recentTransactions || []).map(normalizeTransaction);
        
        const normalizedFactures = (data.factures_en_retard_liste || 
                                   data.overdue_invoices_list || 
                                   data.overdueInvoicesList || []).map(normalizeFacture);
        
        setDashboardData({
          resume: {
            transactions: { 
              total_jour: transactions_today, 
              total_mois: transactions_month, 
              montant_total_mois: montant_month 
            },
            factures_en_retard: factures_en_retard
          },
          transactions_recentes: normalizedTransactions,
          factures_en_retard: normalizedFactures,
          evolution_mensuelle: data.evolution_mensuelle || 
                              data.monthly_evolution || 
                              data.monthlyEvolution || []
        });
        
      } else {
        console.warn('⚠️ Réponse dashboard non réussie:', response);
        
        setDashboardData({
          resume: {
            transactions: { 
              total_jour: 0, 
              total_mois: 0, 
              montant_total_mois: 0 
            },
            factures_en_retard: 0
          },
          transactions_recentes: [],
          factures_en_retard: [],
          evolution_mensuelle: []
        });
        
        showNotification(response.message || 'Erreur lors du chargement du tableau de bord', 'error');
      }
    } catch (error) {
      console.error('❌ Erreur chargement dashboard:', error);
      
      setDashboardData({
        resume: {
          transactions: { 
            total_jour: 0, 
            total_mois: 0, 
            montant_total_mois: 0 
          },
          factures_en_retard: 0
        },
        transactions_recentes: [],
        factures_en_retard: [],
        evolution_mensuelle: []
      });
      
      showNotification('Erreur lors du chargement du tableau de bord', 'error');
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  };
  
  // Charger les transactions
  const loadTransactions = async () => {
    try {
      setLoading(prev => ({ ...prev, transactions: true }));
      
      const params = {
        page: transactionFilters.page + 1,
        limit: transactionFilters.limit,
        dateDebut: formatDateForAPI(transactionFilters.dateDebut),
        dateFin: formatDateForAPI(transactionFilters.dateFin),
        search: transactionFilters.search || undefined,
        sortBy: transactionFilters.sortBy,
        sortOrder: transactionFilters.sortOrder
      };
      
      if (transactionFilters.status !== 'all') params.status = transactionFilters.status;
      if (transactionFilters.type !== 'all') params.type = transactionFilters.type;
      if (transactionFilters.method !== 'all') params.method = transactionFilters.method;
      
      console.log('🔍 Chargement transactions avec params:', params);
      
      const response = await facturationAPI.getTransactions(params);
      
      if (response.success) {
        console.log('✅ Transactions reçues:', response.transactions?.length || 0, 'éléments');
        
        // Normaliser les transactions
        const normalizedTransactions = (response.transactions || []).map(normalizeTransaction);
        
        setTransactions(normalizedTransactions);
        setTransactionFilters(prev => ({
          ...prev,
          total: response.pagination?.total || response.total || 0
        }));
      } else {
        showNotification(response.message || 'Erreur lors du chargement des transactions', 'error');
      }
    } catch (error) {
      console.error('❌ Erreur chargement transactions:', error);
      showNotification('Erreur lors du chargement des transactions', 'error');
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  };
  
  // Charger les factures
  const loadFactures = async () => {
    try {
      setLoading(prev => ({ ...prev, factures: true }));
      
      const params = {
        page: factureFilters.page + 1,
        limit: factureFilters.limit,
        date_debut: formatDateForAPI(factureFilters.dateDebut),
        date_fin: formatDateForAPI(factureFilters.dateFin),
        search: factureFilters.search || undefined,
        sortBy: factureFilters.sortBy,
        sortOrder: factureFilters.sortOrder
      };
      
      if (factureFilters.statut !== 'all') params.statut = factureFilters.statut;
      
      console.log('🔍 Chargement factures avec params:', params);
      
      const response = await facturationAPI.getFactures(params);
      
      if (response.success) {
        console.log('✅ Factures reçues:', response.factures?.length || 0, 'éléments');
        
        // Normaliser les factures
        const normalizedFactures = (response.factures || []).map(normalizeFacture);
        
        setFactures(normalizedFactures);
        setFactureFilters(prev => ({
          ...prev,
          total: response.pagination?.total || response.total || 0
        }));
      } else {
        showNotification(response.message || 'Erreur lors du chargement des factures', 'error');
      }
    } catch (error) {
      console.error('❌ Erreur chargement factures:', error);
      showNotification('Erreur lors du chargement des factures', 'error');
    } finally {
      setLoading(prev => ({ ...prev, factures: false }));
    }
  };
  
  // Générer une nouvelle facture
  const handleGenerateFacture = async (facturesData) => {
    try {
      setLoading(prev => ({ ...prev, factures: true }));
      
      console.log('📤 Génération factures - Données:', facturesData);
      
      const facturesArray = Array.isArray(facturesData) ? facturesData : [facturesData];
      
      for (const factureData of facturesArray) {
        const formattedData = {
          ...factureData,
          date_facture: formatDateForAPI(factureData.date_facture),
          date_echeance: formatDateForAPI(factureData.date_echeance),
          prestations: (factureData.prestations || []).map(p => ({
            ...p,
            date_execution: formatDateForAPI(p.date_execution)
          }))
        };
        
        console.log('📤 Données formatées pour API:', formattedData);
        
        const response = await facturationAPI.createFacture(formattedData);
        
        if (!response.success) {
          throw new Error(`Erreur création facture ${factureData.libelle_facture || factureData.libelle}: ${response.message}`);
        }
      }
      
      showNotification(`✅ ${facturesArray.length} facture(s) générée(s) avec succès`, 'success');
      
      setFactureDialog({ open: false, mode: 'create', data: null });
      
      loadFactures();
      loadDashboard();
      
    } catch (error) {
      console.error('❌ Erreur génération facture:', error);
      
      let errorMessage = 'Erreur lors de la génération de la facture';
      
      if (error.status === 403) {
        errorMessage = 'Permission refusée. Vérifiez vos droits d\'accès.';
      } else if (error.status === 401) {
        errorMessage = 'Session expirée. Redirection...';
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 2000);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(`❌ ${errorMessage}`, 'error');
      
    } finally {
      setLoading(prev => ({ ...prev, factures: false }));
    }
  };

  // Initier un paiement
  const handleInitiatePayment = async (paymentData) => {
    try {
      setLoading(prev => ({ ...prev, transactions: true }));
      
      console.log('🚀 Envoi paiement - Données reçues du PaymentDialog:', paymentData);

      // VALIDATION CRITIQUE - S'assurer qu'on a un ID facture
      const factureId = paymentData.factureId || 
                       paymentData.COD_FACTURE || 
                       paymentData.cod_facture ||
                       paymentData.ID_FACTURE;

      console.log('🔍 ID Facture extrait:', factureId);

      if (!factureId) {
        throw new Error(`ID facture manquant. Données reçues: ${JSON.stringify({
          factureId: paymentData.factureId,
          COD_FACTURE: paymentData.COD_FACTURE,
          cod_facture: paymentData.cod_facture,
          ID_FACTURE: paymentData.ID_FACTURE
        })}`);
      }

      // Construire la requête pour l'API backend
      const requestData = {
        // Champs de base
        method: paymentData.method,
        montant: paymentData.montant,
        reference: paymentData.reference,
        observations: paymentData.observations,
        notifierClient: paymentData.notifierClient,
        typeTransaction: paymentData.typeTransaction || 'facture',
        
        // Identifiant facture
        factureId: parseInt(factureId),
        COD_FACTURE: parseInt(factureId),
        
        // Autres champs optionnels
        ...(paymentData.numeroTelephone && { numeroTelephone: paymentData.numeroTelephone }),
        ...(paymentData.numeroFacture && { numeroFacture: paymentData.numeroFacture })
      };

      console.log('📤 REQUÊTE FINALE pour l\'API:', JSON.stringify(requestData, null, 2));

      // Appel API
      const response = await facturationAPI.initierPaiement(requestData);
      
      console.log('✅ Réponse API:', response);

      if (response.success) {
        showNotification(response.message || 'Paiement initié avec succès', 'success');
        
        // Recharger les données
        setTimeout(() => {
          loadDashboard();
          if (activeTab === 1) loadTransactions();
          if (activeTab === 2) loadFactures();
        }, 1000);
        
      } else {
        showNotification(response.message || 'Erreur lors du paiement', 'error');
      }
      
    } catch (error) {
      console.error('❌ Erreur initiation paiement:', error);
      showNotification(`❌ ${error.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  };

  // Télécharger un document
  const handleDownloadDocument = async (reference, type = 'transaction') => {
    try {
      const token = localStorage.getItem('token');
      let endpoint, filename;
      
      if (type === 'transaction') {
        endpoint = `/transactions/${reference}/receipt`;
        filename = `reçu_${reference}.pdf`;
      } else if (type === 'facture') {
        endpoint = `/facturation/factures/${reference}/pdf`;
        filename = `facture_${reference}.pdf`;
      } else {
        throw new Error('Type de document non supporté');
      }
      
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showNotification('Document téléchargé avec succès', 'success');
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      showNotification('Erreur lors du téléchargement', 'error');
    }
  };
  
  // Effet pour charger les données
  useEffect(() => {
    switch (activeTab) {
      case 0:
        loadDashboard();
        break;
      case 1:
        loadTransactions();
        break;
      case 2:
        loadFactures();
        break;
      default:
        break;
    }
  }, [activeTab, transactionFilters.page, transactionFilters.limit, factureFilters.page, factureFilters.limit]);
  
  // Handler pour les filtres
  const handleTransactionFilterChange = (key, value) => {
    setTransactionFilters(prev => ({ ...prev, [key]: value, page: 0 }));
  };
  
  const handleFactureFilterChange = (key, value) => {
    setFactureFilters(prev => ({ ...prev, [key]: value, page: 0 }));
  };
  
  // Trier les données
  const handleSort = (type, field) => {
    if (type === 'transaction') {
      setTransactionFilters(prev => ({
        ...prev,
        sortBy: field,
        sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
        page: 0
      }));
    } else {
      setFactureFilters(prev => ({
        ...prev,
        sortBy: field,
        sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
        page: 0
      }));
    }
  };
  
  // Composant pour les cartes de métriques
  const MetricCard = ({ title, value, icon, color, subtitle, trend }) => (
    <Grow in={true}>
      <Card sx={{ 
        height: '100%',
        borderLeft: `4px solid ${color}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8]
        }
      }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography color="text.secondary" variant="overline" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
              <Typography variant="h4" component="div" sx={{ 
                fontWeight: 700,
                my: 1
              }}>
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Avatar sx={{ 
              bgcolor: alpha(color, 0.1),
              color: color,
              width: 56,
              height: 56
            }}>
              {icon}
            </Avatar>
          </Stack>
        </CardContent>
      </Card>
    </Grow>
  );
  
  // Rendu du tableau de bord
  const renderDashboard = () => {
    const stats = dashboardData.resume.transactions;
    
    return (
      <Box>
        {/* Métriques principales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Transactions aujourd'hui"
              value={stats.total_jour}
              icon={<TrendingIcon />}
              color={theme.palette.primary.main}
              subtitle="Depuis minuit"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Montant ce mois"
              value={formatCurrency(stats.montant_total_mois)}
              icon={<MonetizationIcon />}
              color={theme.palette.success.main}
              subtitle={`${stats.total_mois} transactions`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Factures en retard"
              value={dashboardData.resume.factures_en_retard}
              icon={<WarningIcon />}
              color={theme.palette.error.main}
              subtitle="À régler"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Taux de réussite"
              value="98.5%"
              icon={<CheckIcon />}
              color={theme.palette.info.main}
              subtitle="Transactions réussies"
            />
          </Grid>
        </Grid>
        
        {/* Transactions récentes et factures en retard */}
        <Grid container spacing={3}>
          {/* Transactions récentes */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title={
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ReceiptLongIcon color="primary" />
                      <Typography variant="h6" component="div">
                        Transactions récentes
                      </Typography>
                    </Stack>
                    <Button 
                      size="small" 
                      onClick={() => setActiveTab(1)}
                      endIcon={<ArrowUpIcon />}
                      variant="outlined"
                    >
                      Voir tout
                    </Button>
                  </Stack>
                }
              />
              <CardContent>
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {dashboardData.transactions_recentes.slice(0, 5).map((transaction, index) => (
                    <Slide key={index} direction="up" in={true} timeout={index * 100}>
                      <ListItem 
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            size="small"
                            onClick={() => setDetailDialog({ 
                              open: true, 
                              type: 'transaction', 
                              data: transaction 
                            })}
                          >
                            <ViewIcon />
                          </IconButton>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: alpha(statusConfig[transaction.statut]?.color || theme.palette.grey[500], 0.1),
                            color: statusConfig[transaction.statut]?.color || theme.palette.text.primary
                          }}>
                            {statusConfig[transaction.statut]?.icon || <PaymentIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight="medium">
                              {transaction.reference || 'N/A'}
                            </Typography>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography variant="caption" display="block">
                                {transaction.beneficiaire || transaction.nom_ben || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(transaction.date_initiation, 'dd/MM HH:mm')}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                        <Box sx={{ textAlign: 'right', ml: 2 }}>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {formatCurrency(transaction.montant)}
                          </Typography>
                          <Chip
                            label={statusConfig[transaction.statut]?.label || transaction.statut}
                            size="small"
                            sx={{ 
                              height: 20,
                              fontSize: '0.65rem',
                              bgcolor: statusConfig[transaction.statut]?.bgColor,
                              color: statusConfig[transaction.statut]?.color
                            }}
                          />
                        </Box>
                      </ListItem>
                    </Slide>
                  ))}
                </List>
                {dashboardData.transactions_recentes.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">
                      Aucune transaction récente
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Factures en retard */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%',
              border: `2px solid ${alpha(theme.palette.error.main, 0.2)}`
            }}>
              <CardHeader 
                title={
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <WarningIcon color="error" />
                      <Typography variant="h6" component="div" color="error">
                        Factures en retard
                      </Typography>
                    </Stack>
                    <Button 
                      size="small" 
                      onClick={() => setActiveTab(2)}
                      endIcon={<ArrowUpIcon />}
                      variant="outlined"
                      sx={{ color: theme.palette.error.main, borderColor: theme.palette.error.main }}
                    >
                      Voir tout
                    </Button>
                  </Stack>
                }
              />
              <CardContent>
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {dashboardData.factures_en_retard.slice(0, 5).map((facture, index) => (
                    <Slide key={index} direction="up" in={true} timeout={index * 100}>
                      <ListItem 
                        secondaryAction={
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Payer">
                              <IconButton 
                                size="small"
                                onClick={() => {
                                  // Utiliser les données normalisées
                                  const factureData = {
                                    COD_FACTURE: facture.id,
                                    NUMERO_FACTURE: facture.numero,
                                    NOM_BEN: facture.nom_ben,
                                    PRENOM_BEN: facture.prenom_ben,
                                    MONTANT_RESTANT: facture.montant_restant,
                                    ...facture
                                  };
                                  setPaymentDialog({ 
                                    open: true, 
                                    type: 'facture', 
                                    data: factureData 
                                  });
                                }}
                                sx={{ color: theme.palette.success.main }}
                              >
                                <PaymentIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Détails">
                              <IconButton 
                                size="small"
                                onClick={() => setDetailDialog({ 
                                  open: true, 
                                  type: 'facture', 
                                  data: facture 
                                })}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                            color: theme.palette.error.main
                          }}>
                            <WarningIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight="medium">
                              {facture.numero || 'N/A'}
                            </Typography>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography variant="caption" display="block">
                                {facture.nom_ben || 'N/A'} {facture.prenom_ben || ''}
                              </Typography>
                              <Typography variant="caption" color="error">
                                Échéance: {formatDate(facture.date_echeance, 'dd/MM/yyyy')}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                        <Box sx={{ textAlign: 'right', ml: 2 }}>
                          <Typography variant="body2" fontWeight="bold" color="error">
                            {formatCurrency(facture.montant_restant)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Retard: {facture.date_echeance ? 
                              Math.max(0, Math.floor((new Date() - new Date(facture.date_echeance)) / (1000 * 60 * 60 * 24))) : 
                              0} jours
                          </Typography>
                        </Box>
                      </ListItem>
                    </Slide>
                  ))}
                </List>
                {dashboardData.factures_en_retard.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    <Typography color="success.main" fontWeight="medium">
                      Aucune facture en retard
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Rendu des transactions
  const renderTransactions = () => (
    <Box>
      {/* En-tête avec filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon color="primary" />
                Transactions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {transactionFilters.total} transactions trouvées
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadTransactions}
                  disabled={loading.transactions}
                >
                  Actualiser
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Filtres rapides */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Rechercher"
                placeholder="Référence, bénéficiaire..."
                value={transactionFilters.search}
                onChange={(e) => handleTransactionFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={transactionFilters.status}
                  label="Statut"
                  onChange={(e) => handleTransactionFilterChange('status', e.target.value)}
                >
                  <MenuItem value="all">Tous les statuts</MenuItem>
                  <MenuItem value="Reussi">Réussi</MenuItem>
                  <MenuItem value="En cours">En cours</MenuItem>
                  <MenuItem value="Echoue">Échoué</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1}>
                <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
                  <DatePicker
                    label="Date début"
                    value={transactionFilters.dateDebut}
                    onChange={(date) => handleTransactionFilterChange('dateDebut', date)}
                    renderInput={(params) => (
                      <TextField {...params} size="small" fullWidth />
                    )}
                  />
                </LocalizationProvider>
                <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
                  <DatePicker
                    label="Date fin"
                    value={transactionFilters.dateFin}
                    onChange={(date) => handleTransactionFilterChange('dateFin', date)}
                    renderInput={(params) => (
                      <TextField {...params} size="small" fullWidth />
                    )}
                  />
                </LocalizationProvider>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Tableau des transactions */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Button 
                      size="small" 
                      endIcon={<SwapVertIcon />}
                      onClick={() => handleSort('transaction', 'reference')}
                      sx={{ color: 'inherit', fontWeight: 600 }}
                    >
                      Référence
                    </Button>
                  </TableCell>
                  <TableCell>Bénéficiaire</TableCell>
                  <TableCell align="right">
                    <Button 
                      size="small" 
                      endIcon={<SwapVertIcon />}
                      onClick={() => handleSort('transaction', 'montant')}
                      sx={{ color: 'inherit', fontWeight: 600 }}
                    >
                      Montant
                    </Button>
                  </TableCell>
                  <TableCell>Méthode</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      endIcon={<SwapVertIcon />}
                      onClick={() => handleSort('transaction', 'date')}
                      sx={{ color: 'inherit', fontWeight: 600 }}
                    >
                      Date
                    </Button>
                  </TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading.transactions ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={48} />
                      <Typography sx={{ mt: 2 }}>Chargement des transactions...</Typography>
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography color="text.secondary" variant="h6">
                        Aucune transaction trouvée
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Essayez de modifier vos critères de recherche
                      </Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<RefreshIcon />}
                        onClick={loadTransactions}
                      >
                        Réessayer
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction, index) => (
                    <TableRow 
                      key={transaction.id} 
                      hover 
                      sx={{ 
                        '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.primary.main, 0.02) }
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {transaction.reference || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {transaction.beneficiaire || transaction.nom_ben || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          {formatCurrency(transaction.montant)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">
                            {paymentMethods[transaction.methode_paiement]?.label || transaction.methode_paiement || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusConfig[transaction.statut]?.label || transaction.statut}
                          size="small"
                          sx={{ 
                            bgcolor: statusConfig[transaction.statut]?.bgColor,
                            color: statusConfig[transaction.statut]?.color,
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {formatDate(transaction.date_initiation, 'dd/MM/yyyy')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Détails">
                            <IconButton 
                              size="small"
                              onClick={() => setDetailDialog({ 
                                open: true, 
                                type: 'transaction', 
                                data: transaction 
                              })}
                              sx={{ color: theme.palette.info.main }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography>
              Page {transactionFilters.page + 1} sur {Math.ceil(transactionFilters.total / transactionFilters.limit)}
            </Typography>
            <TablePagination
              component="div"
              count={transactionFilters.total}
              page={transactionFilters.page}
              onPageChange={(e, newPage) => setTransactionFilters(prev => ({ ...prev, page: newPage }))}
              rowsPerPage={transactionFilters.limit}
              onRowsPerPageChange={(e) => setTransactionFilters(prev => ({ 
                ...prev, 
                limit: parseInt(e.target.value, 10), 
                page: 0 
              }))}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
  
  // Rendu des factures
  const renderFactures = () => (
    <Box>
      {/* En-tête avec filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon color="primary" />
                Factures
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {factureFilters.total} factures trouvées
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setFactureDialog({ open: true, mode: 'create', data: null })}
                >
                  Nouvelle facture
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadFactures}
                  disabled={loading.factures}
                >
                  Actualiser
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Filtres rapides */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Rechercher"
                placeholder="Numéro, bénéficiaire..."
                value={factureFilters.search}
                onChange={(e) => handleFactureFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={factureFilters.statut}
                  label="Statut"
                  onChange={(e) => handleFactureFilterChange('statut', e.target.value)}
                >
                  <MenuItem value="all">Tous les statuts</MenuItem>
                  <MenuItem value="En attente">En attente</MenuItem>
                  <MenuItem value="Payée">Payée</MenuItem>
                  <MenuItem value="Partiellement payée">Partiellement payée</MenuItem>
                  <MenuItem value="Annulee">Annulée</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={1}>
                <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
                  <DatePicker
                    label="Date début"
                    value={factureFilters.dateDebut}
                    onChange={(date) => handleFactureFilterChange('dateDebut', date)}
                    renderInput={(params) => (
                      <TextField {...params} size="small" fullWidth />
                    )}
                  />
                </LocalizationProvider>
                <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
                  <DatePicker
                    label="Date fin"
                    value={factureFilters.dateFin}
                    onChange={(date) => handleFactureFilterChange('dateFin', date)}
                    renderInput={(params) => (
                      <TextField {...params} size="small" fullWidth />
                    )}
                  />
                </LocalizationProvider>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Tableau des factures */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Button 
                      size="small" 
                      endIcon={<SwapVertIcon />}
                      onClick={() => handleSort('facture', 'numero')}
                      sx={{ color: 'inherit', fontWeight: 600 }}
                    >
                      Numéro
                    </Button>
                  </TableCell>
                  <TableCell>Bénéficiaire</TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      endIcon={<SwapVertIcon />}
                      onClick={() => handleSort('facture', 'date_facture')}
                      sx={{ color: 'inherit', fontWeight: 600 }}
                    >
                      Date
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      endIcon={<SwapVertIcon />}
                      onClick={() => handleSort('facture', 'date_echeance')}
                      sx={{ color: 'inherit', fontWeight: 600 }}
                    >
                      Échéance
                    </Button>
                  </TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Reste</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading.factures ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={48} />
                      <Typography sx={{ mt: 2 }}>Chargement des factures...</Typography>
                    </TableCell>
                  </TableRow>
                ) : factures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography color="text.secondary" variant="h6">
                        Aucune facture trouvée
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Créez votre première facture
                      </Typography>
                      <Button 
                        variant="contained" 
                        startIcon={<AddIcon />}
                        onClick={() => setFactureDialog({ open: true, mode: 'create', data: null })}
                      >
                        Nouvelle facture
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  factures.map((facture, index) => (
                    <TableRow 
                      key={facture.id} 
                      hover 
                      sx={{ 
                        '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.primary.main, 0.02) }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {facture.numero || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {facture.nom_ben || 'N/A'} {facture.prenom_ben || ''}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {formatDate(facture.date_facture, 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center'
                        }}>
                          {formatDate(facture.date_echeance, 'dd/MM/yyyy')}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(facture.montant_total)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={facture.montant_restant > 0 ? 'error.main' : 'success.main'}
                        >
                          {formatCurrency(facture.montant_restant)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusConfig[facture.statut]?.label || facture.statut}
                          size="small"
                          sx={{ 
                            bgcolor: statusConfig[facture.statut]?.bgColor,
                            color: statusConfig[facture.statut]?.color,
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Détails">
                            <IconButton 
                              size="small"
                              onClick={() => setDetailDialog({ 
                                open: true, 
                                type: 'facture', 
                                data: facture 
                              })}
                              sx={{ color: theme.palette.info.main }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {facture.statut !== 'Payée' && (
                            <Tooltip title="Payer">
                              <IconButton 
                                size="small"
                                onClick={() => {
                                  // Préparer les données de la facture normalisées
                                  const factureData = {
                                    COD_FACTURE: facture.id,
                                    NUMERO_FACTURE: facture.numero,
                                    NOM_BEN: facture.nom_ben,
                                    PRENOM_BEN: facture.prenom_ben,
                                    MONTANT_TOTAL: facture.montant_total,
                                    MONTANT_PAYE: facture.montant_paye || 0,
                                    MONTANT_RESTANT: facture.montant_restant,
                                    TELEPHONE: facture.telephone,
                                    ...facture
                                  };
                                  
                                  console.log('📤 Envoi facture au PaymentDialog:', factureData);
                                  
                                  setPaymentDialog({ 
                                    open: true, 
                                    type: 'facture', 
                                    data: factureData 
                                  });
                                }}
                                sx={{ color: theme.palette.success.main }}
                              >
                                <PaymentIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography>
              Page {factureFilters.page + 1} sur {Math.ceil(factureFilters.total / factureFilters.limit)}
            </Typography>
            <TablePagination
              component="div"
              count={factureFilters.total}
              page={factureFilters.page}
              onPageChange={(e, newPage) => setFactureFilters(prev => ({ ...prev, page: newPage }))}
              rowsPerPage={factureFilters.limit}
              onRowsPerPageChange={(e) => setFactureFilters(prev => ({ 
                ...prev, 
                limit: parseInt(e.target.value, 10), 
                page: 0 
              }))}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
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
        
        {/* En-tête */}
        <Box sx={{ mb: 4 }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={8}>
              <Typography variant="h3" gutterBottom sx={{ 
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <DashboardIcon fontSize="large" />
                  Tableau de bord financier
                </Box>
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600 }}>
                Gérez vos transactions, factures et paiements en toute simplicité.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<DateRangeIcon />}
                >
                  {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
                </Button>
              </Stack>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
        </Box>
        
        {/* Barre d'onglets */}
        <Paper sx={{ 
          mb: 4, 
          borderRadius: 3,
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
        }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            <Tab 
              label={
                <Badge 
                  badgeContent={dashboardData.resume?.factures_en_retard || 0} 
                  color="error"
                  max={99}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <DashboardIcon />
                    <span>Tableau de bord</span>
                  </Stack>
                </Badge>
              }
            />
            <Tab 
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <MoneyIcon />
                  <span>Transactions</span>
                </Stack>
              }
            />
            <Tab 
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ReceiptIcon />
                  <span>Factures</span>
                </Stack>
              }
            />
          </Tabs>
          
          {/* Contenu des onglets */}
          <Box sx={{ p: 3 }}>
            <Fade in={activeTab === 0} timeout={300}>
              <Box>{activeTab === 0 && renderDashboard()}</Box>
            </Fade>
            <Fade in={activeTab === 1} timeout={300}>
              <Box>{activeTab === 1 && renderTransactions()}</Box>
            </Fade>
            <Fade in={activeTab === 2} timeout={300}>
              <Box>{activeTab === 2 && renderFactures()}</Box>
            </Fade>
          </Box>
        </Paper>
        
        {/* Bouton flottant pour actions rapides */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{ 
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 1000
          }}
          onClick={() => setFactureDialog({ open: true, mode: 'create', data: null })}
        >
          <AddIcon />
        </Fab>
        
        {/* Dialogues */}
        <PaymentDialog
          open={paymentDialog.open}
          type={paymentDialog.type}
          data={paymentDialog.data}
          onClose={() => setPaymentDialog({ open: false, type: 'facture', data: null })}
          onSubmit={handleInitiatePayment}
          loading={loading.transactions}
          formatCurrency={formatCurrency}
        />
        
        <FactureDialog
          open={factureDialog.open}
          mode={factureDialog.mode}
          data={factureDialog.data}
          onClose={() => setFactureDialog({ open: false, mode: 'create', data: null })}
          onSubmit={handleGenerateFacture}
          loading={loading.factures}
          formatCurrency={formatCurrency}
        />
        
        <DetailDialog
          open={detailDialog.open}
          type={detailDialog.type}
          data={detailDialog.data}
          onClose={() => setDetailDialog({ open: false, type: '', data: null })}
          onDownload={handleDownloadDocument}
          statusConfig={statusConfig}
          paymentMethods={paymentMethods}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      </Container>
    </LocalizationProvider>
  );
};

export default ReglementPage;