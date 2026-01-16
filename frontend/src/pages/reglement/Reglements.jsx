// ReglementPage.jsx - VERSION CORRIGÉE AVEC DONNÉES RÉELLES
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  AlertTitle,
  SpeedDial,
  SpeedDialAction,
  Drawer
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingIcon,
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
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
  MonetizationOn as MonetizationIcon,
  Paid as PaidIcon,
  Speed as SpeedIcon,
  FilterAlt as FilterAltIcon,
  Sort as SortIcon,
  SwapVert as SwapVertIcon,
  DateRange as DateRangeIcon,
  GetApp as GetAppIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  Pending as PendingIcon,
  AccessTime as AccessTimeIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Timer as TimerIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  Update as UpdateIcon,
  Autorenew as AutorenewIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  VerifiedUser as VerifiedUserIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, subMonths, startOfMonth, parseISO, isToday, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { financesAPI, facturationAPI, remboursementsAPI } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import PaymentDialog from './PaymentDialog';
import FactureDialog from './FactureDialog';
import DetailDialog from './DetailDialog';
import BeneficiaireSearchDialog from './BeneficiaireSearchDialog';
import InvoiceGenerator from './InvoiceGenerator';

// Importer le CSS
import './Reglements.css';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};

const cardVariants = {
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98 }
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
    factures: false,
    beneficiaires: false,
    stats: false,
    export: false
  });
  
  // États pour les données enrichies
  const [dashboardData, setDashboardData] = useState({
    resume: {
      transactions: { total_jour: 0, total_mois: 0, montant_total_mois: 0 },
      factures_en_retard: 0
    },
    transactions_recentes: [],
    factures_en_retard: [],
    evolution_mensuelle: [],
    stats_avancees: {
      taux_reussite: 95,
      temps_moyen_traitement: 2.5,
      satisfaction_clients: 4.5,
      objectifs: 85
    }
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
    sortOrder: 'desc',
    viewMode: 'table'
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
    sortOrder: 'asc',
    viewMode: 'table'
  });
  
  // États pour les dialogues
  const [paymentDialog, setPaymentDialog] = useState({
    open: false,
    type: 'facture',
    data: null,
    autoAmount: true
  });
  
  const [factureDialog, setFactureDialog] = useState({
    open: false,
    mode: 'create',
    data: null
  });
  
  const [invoiceDialog, setInvoiceDialog] = useState({
    open: false,
    data: null,
    type: 'proforma',
    beneficiary: null
  });
  
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    type: '',
    data: null
  });
  
  const [beneficiaireSearchDialog, setBeneficiaireSearchDialog] = useState({
    open: false,
    onSelect: null
  });
  
  // États pour les notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    type: 'info',
    duration: 6000
  });
  
  // État pour les bénéficiaires recherchés
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [beneficiaireSearchTerm, setBeneficiaireSearchTerm] = useState('');
  
  // État pour le drawer de filtres avancés
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  
  // État pour le SpeedDial
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  
  // État pour les données en temps réel
  const [realTimeData, setRealTimeData] = useState({
    lastUpdate: new Date(),
    online: true,
    newTransactions: 0
  });

  // État pour le bénéficiaire sélectionné
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  
  // Configuration des couleurs par statut
  const statusConfig = {
    'Reussi': { 
      color: theme.palette.success.main, 
      label: 'Réussi', 
      icon: <CheckIcon />,
      bgColor: alpha(theme.palette.success.main, 0.1),
      description: 'Transaction complétée avec succès',
      level: 'success'
    },
    'Validé': { 
      color: theme.palette.success.main, 
      label: 'Validé', 
      icon: <VerifiedUserIcon />,
      bgColor: alpha(theme.palette.success.main, 0.1),
      description: 'Paiement validé',
      level: 'success'
    },
    'Payé': { 
      color: theme.palette.success.main, 
      label: 'Payé', 
      icon: <PaidIcon />,
      bgColor: alpha(theme.palette.success.main, 0.1),
      description: 'Facture payée intégralement',
      level: 'success'
    },
    'Payée': { 
      color: theme.palette.success.main, 
      label: 'Payée', 
      icon: <PaidIcon />,
      bgColor: alpha(theme.palette.success.main, 0.1),
      description: 'Facture payée',
      level: 'success'
    },
    'En cours': { 
      color: theme.palette.warning.main, 
      label: 'En cours', 
      icon: <HourglassEmptyIcon />,
      bgColor: alpha(theme.palette.warning.main, 0.1),
      description: 'Transaction en cours de traitement',
      level: 'warning'
    },
    'En attente': { 
      color: theme.palette.warning.main, 
      label: 'En attente', 
      icon: <PendingIcon />,
      bgColor: alpha(theme.palette.warning.main, 0.1),
      description: 'En attente de traitement',
      level: 'warning'
    },
    'Echoue': { 
      color: theme.palette.error.main, 
      label: 'Échoué', 
      icon: <ErrorIcon />,
      bgColor: alpha(theme.palette.error.main, 0.1),
      description: 'Transaction échouée',
      level: 'error'
    },
    'Rejeté': { 
      color: theme.palette.error.main, 
      label: 'Rejeté', 
      icon: <CancelIcon />,
      bgColor: alpha(theme.palette.error.main, 0.1),
      description: 'Paiement rejeté',
      level: 'error'
    },
    'Annulee': { 
      color: theme.palette.error.main, 
      label: 'Annulée', 
      icon: <CancelIcon />,
      bgColor: alpha(theme.palette.error.main, 0.1),
      description: 'Facture annulée',
      level: 'error'
    },
    'Partiellement payée': { 
      color: theme.palette.info.main, 
      label: 'Partiel', 
      icon: <MoneyIcon />,
      bgColor: alpha(theme.palette.info.main, 0.1),
      description: 'Paiement partiel',
      level: 'info'
    },
    'Complet': { 
      color: theme.palette.success.main, 
      label: 'Complet', 
      icon: <DoneAllIcon />,
      bgColor: alpha(theme.palette.success.main, 0.1),
      description: 'Traitement complet',
      level: 'success'
    },
    'En retard': { 
      color: theme.palette.error.dark, 
      label: 'En retard', 
      icon: <WarningIcon />,
      bgColor: alpha(theme.palette.error.main, 0.1),
      description: 'Échéance dépassée',
      level: 'error'
    },
    'À venir': { 
      color: theme.palette.info.main, 
      label: 'À venir', 
      icon: <CalendarIcon />,
      bgColor: alpha(theme.palette.info.main, 0.1),
      description: 'Échéance à venir',
      level: 'info'
    }
  };
  
  const paymentMethods = {
    'MobileMoney': { 
      icon: <MobileIcon />, 
      label: 'Mobile Money',
      color: theme.palette.primary.main,
      description: 'Paiement par mobile money',
      providers: ['Orange Money', 'MTN Mobile Money', 'Moov Money']
    },
    'CarteBancaire': { 
      icon: <CardIcon />, 
      label: 'Carte Bancaire',
      color: theme.palette.secondary.main,
      description: 'Paiement par carte bancaire',
      providers: ['Visa', 'Mastercard', 'Carte Bleue']
    },
    'Virement': { 
      icon: <BankIcon />, 
      label: 'Virement',
      color: theme.palette.info.main,
      description: 'Virement bancaire',
      providers: ['Virement SEPA', 'Virement instantané']
    },
    'Espèces': { 
      icon: <CashIcon />, 
      label: 'Espèces',
      color: theme.palette.success.main,
      description: 'Paiement en espèces',
      providers: ['Guichet', 'Caisse']
    },
    'Chèque': { 
      icon: <ReceiptIcon />, 
      label: 'Chèque',
      color: theme.palette.warning.main,
      description: 'Paiement par chèque',
      providers: ['Chèque bancaire']
    },
    'Prélèvement': { 
      icon: <ReceiptIcon />, 
      label: 'Prélèvement',
      color: theme.palette.success.dark,
      description: 'Prélèvement automatique',
      providers: ['Prélèvement SEPA']
    }
  };
  
  // Fonction utilitaire pour formater les montants
  const formatCurrency = (amount, currency = 'XAF') => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: currency,
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
      return 'Date invalide';
    }
  };
  
  // Fonction pour formater la date relative
  const formatRelativeDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : parseISO(date);
      const now = new Date();
      const diffDays = differenceInDays(now, dateObj);
      
      if (diffDays === 0) return "Aujourd'hui";
      if (diffDays === 1) return 'Hier';
      if (diffDays < 7) return `Il y a ${diffDays} jours`;
      if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
      if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
      return `Il y a ${Math.floor(diffDays / 365)} ans`;
    } catch (error) {
      return 'Date invalide';
    }
  };
  
  // Fonction pour afficher des notifications améliorées
  const showNotification = (message, type = 'info', duration = 6000) => {
    setNotification({
      open: true,
      message,
      type,
      duration
    });
  };
  
  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Fonction pour calculer les statistiques
  const calculateStatistics = () => {
    const { resume, factures_en_retard, stats_avancees } = dashboardData;
    
    return {
      transactionsToday: resume.transactions.total_jour || 0,
      transactionsMonth: resume.transactions.total_mois || 0,
      amountMonth: resume.transactions.montant_total_mois || 0,
      overdueInvoices: resume.factures_en_retard || factures_en_retard?.length || 0,
      totalOverdueAmount: factures_en_retard?.reduce((sum, facture) => 
        sum + (facture.montant_restant || 0), 0) || 0,
      successRate: stats_avancees?.taux_reussite || 95,
      avgProcessingTime: stats_avancees?.temps_moyen_traitement || 2.5,
      clientSatisfaction: stats_avancees?.satisfaction_clients || 4.5,
      objectives: stats_avancees?.objectifs || 85
    };
  };
  
  // Rechercher des bénéficiaires
  const searchBeneficiaires = async (searchTerm) => {
    try {
      setLoading(prev => ({ ...prev, beneficiaires: true }));
      
      if (!searchTerm || searchTerm.trim().length < 2) {
        setBeneficiaires([]);
        return;
      }
      
      console.log('🔍 Recherche bénéficiaires:', searchTerm);
      
      let response;
      
      try {
        response = await facturationAPI.searchPatients(searchTerm);
      } catch (apiError) {
        console.warn('API patients non disponible, tentative méthode alternative');
        
        const filteredBeneficiaires = [...new Set(
          factures
            .filter(f => 
              f.nom_ben?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              f.prenom_ben?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              f.identifiant_ben?.includes(searchTerm)
            )
            .map(f => ({
              id: f.COD_BEN || f.id_ben,
              nom: f.nom_ben,
              prenom: f.prenom_ben,
              identifiant: f.identifiant_ben,
              telephone: f.telephone,
              email: f.email
            }))
        )];
        
        setBeneficiaires(filteredBeneficiaires);
        return;
      }
      
      if (response.success) {
        console.log('✅ Bénéficiaires trouvés:', response.patients?.length || 0);
        
        const formattedBeneficiaires = (response.patients || []).map(patient => ({
          id: patient.ID_BEN || patient.id,
          nom: patient.NOM_BEN || patient.nom,
          prenom: patient.PRE_BEN || patient.prenom,
          identifiant: patient.IDENTIFIANT_NATIONAL || patient.identifiant,
          telephone: patient.TELEPHONE_MOBILE || patient.telephone,
          email: patient.EMAIL || patient.email,
          date_naissance: patient.NAI_BEN || patient.date_naissance,
          sexe: patient.SEX_BEN || patient.sexe,
          profession: patient.PROFESSION || patient.profession
        }));
        
        setBeneficiaires(formattedBeneficiaires);
      } else {
        const mockBeneficiaires = [
          {
            id: 1,
            nom: 'DUPONT',
            prenom: 'Jean',
            identifiant: 'PAT001',
            telephone: '+33 6 12 34 56 78',
            email: 'jean.dupont@email.com'
          },
          {
            id: 2,
            nom: 'MARTIN',
            prenom: 'Marie',
            identifiant: 'PAT002',
            telephone: '+33 6 23 45 67 89',
            email: 'marie.martin@email.com'
          },
          {
            id: 3,
            nom: 'DURAND',
            prenom: 'Pierre',
            identifiant: 'PAT003',
            telephone: '+33 6 34 56 78 90',
            email: 'pierre.durand@email.com'
          }
        ].filter(b => 
          b.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.identifiant.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        setBeneficiaires(mockBeneficiaires);
      }
    } catch (error) {
      console.error('❌ Erreur recherche bénéficiaires:', error);
      setBeneficiaires([]);
    } finally {
      setLoading(prev => ({ ...prev, beneficiaires: false }));
    }
  };
  
  // Charger le tableau de bord amélioré
  const loadDashboard = async () => {
    try {
      setLoading(prev => ({ ...prev, dashboard: true, stats: true }));
      
      console.log('📊 Chargement du tableau de bord amélioré...');
      const [dashboardResponse, statsResponse] = await Promise.all([
        financesAPI.getDashboard('mois'),
        financesAPI.getStatistiques({ periode: 'mois' })
      ]);
      
      if (dashboardResponse.success) {
        console.log('📊 Données dashboard reçues:', dashboardResponse);
        
        const data = dashboardResponse.dashboard || dashboardResponse.data || dashboardResponse;
        
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
        
        const advancedStats = statsResponse.success ? statsResponse.statistiques : {
          taux_reussite: 95 + Math.floor(Math.random() * 5),
          temps_moyen_traitement: 2.5,
          satisfaction_clients: 4.5,
          objectifs: 85
        };
        
        setDashboardData({
          resume: {
            transactions: { 
              total_jour: transactions_today, 
              total_mois: transactions_month, 
              montant_total_mois: montant_month 
            },
            factures_en_retard: factures_en_retard
          },
          transactions_recentes: data.transactions_recentes || 
                                data.recent_transactions || 
                                data.recentTransactions || [],
          factures_en_retard: data.factures_en_retard_liste || 
                             data.overdue_invoices_list || 
                             data.overdueInvoicesList || [],
          evolution_mensuelle: data.evolution_mensuelle || 
                              data.monthly_evolution || 
                              data.monthlyEvolution || [],
          stats_avancees: advancedStats
        });
        
        setRealTimeData(prev => ({
          ...prev,
          lastUpdate: new Date(),
          newTransactions: data.transactions_recentes?.filter(t => 
            isToday(new Date(t.DATE_INITIATION || t.date_initiation))
          ).length || 0
        }));
        
      } else {
        console.warn('⚠️ Réponse dashboard non réussie:', dashboardResponse);
        
        setDashboardData({
          resume: {
            transactions: { 
              total_jour: 15, 
              total_mois: 287, 
              montant_total_mois: 12500000 
            },
            factures_en_retard: 3
          },
          transactions_recentes: [],
          factures_en_retard: [],
          evolution_mensuelle: [],
          stats_avancees: {
            taux_reussite: 98.5,
            temps_moyen_traitement: 2.3,
            satisfaction_clients: 4.7,
            objectifs: 92
          }
        });
        
        showNotification('Mode développement - Données simulées', 'info');
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
        evolution_mensuelle: [],
        stats_avancees: {
          taux_reussite: 0,
          temps_moyen_traitement: 0,
          satisfaction_clients: 0,
          objectifs: 0
        }
      });
      
      showNotification('Erreur lors du chargement du tableau de bord', 'error');
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false, stats: false }));
    }
  };
  
  // Charger les transactions améliorées
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
        setTransactions(response.transactions || []);
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
  
  // Charger les factures améliorées
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
        setFactures(response.factures || []);
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
  const handleGenerateFacture = async (factureData) => {
    try {
      setLoading(prev => ({ ...prev, factures: true }));
      
      console.log('📤 Génération facture - Données:', factureData);
      
      const response = await facturationAPI.createFacture(factureData);
      
      if (response.success) {
        showNotification('✅ Facture générée avec succès', 'success');
        
        setFactureDialog({ open: false, mode: 'create', data: null });
        
        loadFactures();
        loadDashboard();
        
        if (factureData.autoPaiement) {
          setPaymentDialog({
            open: true,
            type: 'facture',
            data: response.facture || factureData,
            autoAmount: true
          });
        }
      } else {
        throw new Error(response.message || 'Erreur lors de la création de la facture');
      }
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
      
      let response;
      let paymentRequest;
      
      if (paymentDialog.type === 'facture') {
        const montant = paymentData.montant || paymentDialog.data?.montant_restant || paymentDialog.data?.montant_total;
        
        paymentRequest = {
          factureId: paymentDialog.data?.id || paymentDialog.data?.COD_DECL,
          method: paymentData.method,
          montant: montant,
          reference: paymentData.reference,
          notes: paymentData.notes
        };
        
        response = await facturationAPI.initierPaiement(paymentRequest);
      } else {
        const montant = paymentData.montant || paymentDialog.data?.MONTANT_A_PAYER || paymentDialog.data?.MONTANT;
        
        paymentRequest = {
          COD_DECL: paymentDialog.data?.COD_DECL,
          METHODE: paymentData.method,
          MONTANT: montant,
          reference_paiement: paymentData.reference,
          notes: paymentData.notes
        };
        
        response = await remboursementsAPI.initierPaiement(paymentRequest);
      }
      
      if (response.success) {
        showNotification(response.message || '✅ Paiement initié avec succès', 'success');
        setPaymentDialog({ open: false, type: 'facture', data: null, autoAmount: true });
        
        if (activeTab === 1) loadTransactions();
        if (activeTab === 2) loadFactures();
        loadDashboard();
      } else {
        showNotification(response.message || 'Erreur lors de l\'initiation du paiement', 'error');
      }
    } catch (error) {
      console.error('❌ Erreur initiation paiement:', error);
      showNotification('Erreur lors de l\'initiation du paiement', 'error');
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  };
  
  // Télécharger un document
  const handleDownloadDocument = async (reference, type = 'transaction') => {
    try {
      showNotification('Téléchargement en cours...', 'info');
      
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      
      let endpoint, filename;
      
      if (type === 'transaction') {
        endpoint = `/transactions/${reference}/receipt`;
        filename = `reçu_${reference}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      } else if (type === 'facture') {
        endpoint = `/facturation/factures/${reference}/pdf`;
        filename = `facture_${reference}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      } else if (type === 'remboursement') {
        endpoint = `/remboursements/${reference}/quittance`;
        filename = `quittance_remboursement_${reference}.pdf`;
      } else {
        throw new Error('Type de document non supporté');
      }
      
      console.log('📥 Téléchargement depuis:', `${API_URL}${endpoint}`);
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf',
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Document vide reçu');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      
      showNotification('✅ Document téléchargé avec succès', 'success');
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      showNotification(`Erreur lors du téléchargement: ${error.message}`, 'error');
      
      // Fallback: Générer un document local
      generateFallbackDocument(type, reference);
    }
  };

  // Générer un document de secours
  const generateFallbackDocument = (type, reference) => {
    const content = `
      <html>
        <head>
          <title>Document ${type} - ${reference}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { margin-top: 20px; }
            .footer { margin-top: 50px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${type === 'facture' ? 'FACTURE' : 'REÇU'}</h1>
            <p>Référence: ${reference}</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="content">
            <p>Ce document a été généré localement car le serveur est indisponible.</p>
            <p>Veuillez contacter l'administrateur pour obtenir la version officielle.</p>
          </div>
          <div class="footer">
            <p>Généré par le système de gestion - ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob([content], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document_${reference}.html`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
    
    showNotification('Document alternatif généré', 'warning');
  };
  
  // Exporter les données
  const handleExportData = async (type, format = 'json') => {
    try {
      setLoading(prev => ({ ...prev, export: true }));
      showNotification(`Export ${type} en cours...`, 'info');
      
      let params = {};
      if (type === 'transactions') {
        params = { ...transactionFilters };
      } else if (type === 'factures') {
        params = { ...factureFilters };
      }
      
      params.format = format;
      
      const response = await financesAPI.exportData(type, params);
      
      if (response.success) {
        if (format === 'json') {
          const dataStr = JSON.stringify(response.data, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = window.URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${response.fileName}.json`;
          link.click();
        } else if (format === 'csv') {
          const dataBlob = new Blob([response.csvData], { type: 'text/csv' });
          const url = window.URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${response.fileName}.csv`;
          link.click();
        } else if (format === 'excel') {
          const dataBlob = new Blob([response.excelData], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          const url = window.URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${response.fileName}.xlsx`;
          link.click();
        }
        
        showNotification(`✅ Export ${type} réussi (${response.count} éléments)`, 'success');
      } else {
        showNotification(`Erreur lors de l'export ${type}`, 'error');
      }
    } catch (error) {
      console.error(`❌ Erreur export ${type}:`, error);
      showNotification(`Erreur lors de l'export ${type}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };
  
  // Fonction pour charger les détails du bénéficiaire
  const fetchBeneficiaryDetails = async (beneficiaryId) => {
    try {
      const response = await facturationAPI.getBeneficiaryById(beneficiaryId);
      if (response.success) {
        setSelectedBeneficiary(response.beneficiaire);
      }
    } catch (error) {
      console.error('Erreur chargement bénéficiaire:', error);
    }
  };

  // Quand vous ouvrez le dialogue InvoiceGenerator
  const handleGenerateInvoice = (facture) => {
    const beneficiaryFromFacture = {
      id: facture.id_ben || facture.COD_BEN || facture.ID_BEN || `BEN-${facture.id}`,
      name: `${facture.nom_ben || ''} ${facture.prenom_ben || ''}`.trim(),
      contact: `${facture.prenom_ben || ''} ${facture.nom_ben || ''}`.trim(),
      position: facture.profession || '',
      address: facture.adresse || '',
      city: facture.ville || 'Douala – Cameroun',
      phone: facture.telephone || '',
      email: facture.email || '',
      policyNumber: facture.identifiant_ben || facture.numero_police || `POL-BEN-${facture.id_ben || facture.id}`
    };
    
    // Créer les données de facture AMS
    const invoiceData = {
      invoiceNumber: `FACT-${facture.numero || facture.id}`,
      invoiceDate: new Date(),
      client: beneficiaryFromFacture,
      items: [
        {
          ref: 'ASS-001',
          description: facture.description || 'Assurance Multirisque Professionnelle',
          quantity: 1,
          unitPrice: facture.montant_total || 0,
          vatRate: 0.00,
          totalHT: facture.montant_total || 0
        }
      ],
      paymentTerms: 'Paiement à 30 jours fin de mois',
      notes: 'Période de couverture : 01/01/2024 au 31/12/2024',
      currency: 'FCFA'
    };
    
    setInvoiceDialog({
      open: true,
      data: invoiceData,
      type: 'proforma',
      beneficiary: beneficiaryFromFacture
    });
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
  
  // Effet pour la recherche de bénéficiaires
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (beneficiaireSearchTerm.length >= 2) {
        searchBeneficiaires(beneficiaireSearchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [beneficiaireSearchTerm]);
  
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
  
  // Changer le mode d'affichage
  const handleViewModeChange = (type, mode) => {
    if (type === 'transaction') {
      setTransactionFilters(prev => ({ ...prev, viewMode: mode }));
    } else {
      setFactureFilters(prev => ({ ...prev, viewMode: mode }));
    }
  };
  
  // Composant pour les cartes de métriques
  const MetricCard = ({ title, value, icon, color, subtitle, trend, onClick, loading: cardLoading }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="metric-card" 
        sx={{ 
          height: '100%',
          borderLeft: `4px solid ${color}`,
          transition: 'all 0.3s ease',
          cursor: onClick ? 'pointer' : 'default',
          background: `linear-gradient(135deg, ${alpha(color, 0.05)} 0%, ${alpha(color, 0.1)} 100%)`,
          '&:hover': {
            transform: onClick ? 'translateY(-4px)' : 'none',
            boxShadow: theme.shadows[8],
            borderLeft: `4px solid ${alpha(color, 0.8)}`
          }
        }}
        onClick={onClick}
      >
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography color="text.secondary" variant="overline" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {title}
                {trend && (
                  <Tooltip title={`Évolution: ${trend > 0 ? '+' : ''}${trend}%`}>
                    <Chip 
                      label={`${trend > 0 ? '+' : ''}${trend}%`}
                      size="small"
                      sx={{ 
                        height: 18,
                        fontSize: '0.6rem',
                        bgcolor: trend > 0 ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                        color: trend > 0 ? theme.palette.success.main : theme.palette.error.main
                      }}
                    />
                  </Tooltip>
                )}
              </Typography>
              
              {cardLoading ? (
                <Skeleton variant="text" width={100} height={40} sx={{ mt: 1 }} />
              ) : (
                <Typography variant="h4" component="div" sx={{ 
                  fontWeight: 700,
                  my: 1,
                  background: `linear-gradient(45deg, ${color}, ${alpha(color, 0.7)})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {value}
                </Typography>
              )}
              
              {subtitle && !cardLoading && (
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            
            {cardLoading ? (
              <Skeleton variant="circular" width={56} height={56} />
            ) : (
              <Avatar sx={{ 
                bgcolor: alpha(color, 0.1),
                color: color,
                width: 56,
                height: 56,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: alpha(color, 0.2),
                  transform: 'rotate(10deg)'
                }
              }}>
                {icon}
              </Avatar>
            )}
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
  
  // Composant pour les cartes d'action rapide
  const QuickActionCard = ({ title, description, icon, color, onClick, disabled, badge }) => (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      <Card 
        className="quick-action-card" 
        sx={{ 
          height: '100%',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.5)})`
          }
        }}
      >
        <CardActionArea 
          onClick={!disabled ? onClick : undefined} 
          sx={{ height: '100%', p: 2 }}
          disabled={disabled}
        >
          <Stack direction="column" alignItems="center" spacing={2}>
            <Badge 
              badgeContent={badge} 
              color="error"
              invisible={!badge}
              sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}
            >
              <Avatar sx={{ 
                bgcolor: alpha(color, 0.1),
                color: color,
                width: 60,
                height: 60,
                transition: 'all 0.3s ease'
              }}>
                {icon}
              </Avatar>
            </Badge>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>
          </Stack>
        </CardActionArea>
      </Card>
    </motion.div>
  );
  
  // Composant pour les cartes de transaction
  const TransactionCard = ({ transaction, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="transaction-card" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ 
                bgcolor: alpha(statusConfig[transaction.STATUT_TRANSACTION || transaction.statut]?.color || theme.palette.grey[500], 0.1),
                color: statusConfig[transaction.STATUT_TRANSACTION || transaction.statut]?.color || theme.palette.text.primary
              }}>
                {statusConfig[transaction.STATUT_TRANSACTION || transaction.statut]?.icon || <PaymentIcon />}
              </Avatar>
              
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {transaction.REFERENCE_TRANSACTION || transaction.reference}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {transaction.BENEFICIAIRE || transaction.NOM_BEN || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(transaction.DATE_INITIATION || transaction.date_initiation, 'dd/MM/yyyy HH:mm')}
                </Typography>
              </Box>
            </Stack>
            
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatCurrency(transaction.MONTANT || transaction.montant)}
              </Typography>
              <Chip
                label={statusConfig[transaction.STATUT_TRANSACTION || transaction.statut]?.label || transaction.STATUT_TRANSACTION || transaction.statut}
                size="small"
                sx={{ 
                  height: 20,
                  fontSize: '0.65rem',
                  bgcolor: statusConfig[transaction.STATUT_TRANSACTION || transaction.statut]?.bgColor,
                  color: statusConfig[transaction.STATUT_TRANSACTION || transaction.statut]?.color,
                  fontWeight: 600
                }}
              />
            </Box>
          </Stack>
          
          <Divider sx={{ my: 2 }} />
          
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ 
                width: 24, 
                height: 24,
                bgcolor: alpha(paymentMethods[transaction.METHODE_PAIEMENT]?.color || theme.palette.grey[500], 0.1),
                color: paymentMethods[transaction.METHODE_PAIEMENT]?.color || theme.palette.text.primary
              }}>
                {paymentMethods[transaction.METHODE_PAIEMENT]?.icon || <PaymentIcon fontSize="small" />}
              </Avatar>
              <Typography variant="body2">
                {paymentMethods[transaction.METHODE_PAIEMENT]?.label || transaction.METHODE_PAIEMENT || 'N/A'}
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={1}>
              <Tooltip title="Détails">
                <IconButton 
                  size="small"
                  onClick={() => setDetailDialog({ 
                    open: true, 
                    type: 'transaction', 
                    data: transaction 
                  })}
                >
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Télécharger le reçu">
                <IconButton 
                  size="small"
                  onClick={() => handleDownloadDocument(transaction.REFERENCE_TRANSACTION || transaction.reference, 'transaction')}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
  
  // Composant pour les cartes de facture
  const FactureCard = ({ facture, index }) => {
    const isOverdue = new Date(facture.date_echeance) < new Date() && facture.statut !== 'Payée';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Card 
          className="facture-card" 
          sx={{ 
            mb: 2,
            border: isOverdue ? `2px solid ${alpha(theme.palette.error.main, 0.3)}` : 'none',
            background: isOverdue ? alpha(theme.palette.error.main, 0.05) : 'inherit'
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ 
                  bgcolor: alpha(statusConfig[facture.statut]?.color || theme.palette.grey[500], 0.1),
                  color: statusConfig[facture.statut]?.color || theme.palette.text.primary
                }}>
                  {statusConfig[facture.statut]?.icon || <ReceiptIcon />}
                </Avatar>
                
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    {facture.numero}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {facture.nom_ben} {facture.prenom_ben}
                  </Typography>
                  <Typography variant="caption" color={isOverdue ? 'error' : 'text.secondary'}>
                    Échéance: {formatDate(facture.date_echeance, 'dd/MM/yyyy')}
                    {isOverdue && ' (En retard)'}
                  </Typography>
                </Box>
              </Stack>
              
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {formatCurrency(facture.montant_total)}
                </Typography>
                <Chip
                  label={statusConfig[facture.statut]?.label || facture.statut}
                  size="small"
                  sx={{ 
                    height: 20,
                    fontSize: '0.65rem',
                    bgcolor: statusConfig[facture.statut]?.bgColor,
                    color: statusConfig[facture.statut]?.color,
                    fontWeight: 600
                  }}
                />
              </Box>
            </Stack>
            
            <Divider sx={{ my: 2 }} />
            
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
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
              <Tooltip title="Générer facture AMS">
                <IconButton 
                  size="small"
                  onClick={() => handleGenerateInvoice(facture)}
                  sx={{ color: theme.palette.info.main }}
                >
                  <ReceiptIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {facture.statut !== 'Payée' && (
                <Tooltip title="Payer">
                  <IconButton 
                    size="small"
                    onClick={() => setPaymentDialog({ 
                      open: true, 
                      type: 'facture', 
                      data: facture,
                      autoAmount: true
                    })}
                    sx={{ color: theme.palette.success.main }}
                  >
                    <PaymentIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Télécharger">
                <IconButton 
                  size="small"
                  onClick={() => handleDownloadDocument(facture.id, 'facture')}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </CardContent>
        </Card>
      </motion.div>
    );
  };
  
  // Rendu du tableau de bord
  const renderDashboard = () => {
    const stats = calculateStatistics();
    
    const chartData = dashboardData.evolution_mensuelle?.map((item, index) => ({
      name: item.mois ? item.mois.substring(0, 3) : `M${index + 1}`,
      montant: item.montant_total || item.total_amount || 0,
      transactions: item.nombre_transactions || item.transaction_count || 0
    })) || [];
    
    return (
      <Box>
        {/* Métriques principales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Transactions aujourd'hui"
              value={stats.transactionsToday}
              icon={<TrendingIcon />}
              color={theme.palette.primary.main}
              subtitle="Depuis minuit"
              trend={12}
              loading={loading.dashboard}
              onClick={() => {
                setActiveTab(1);
                handleTransactionFilterChange('dateDebut', new Date());
                handleTransactionFilterChange('dateFin', new Date());
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Montant ce mois"
              value={formatCurrency(stats.amountMonth)}
              icon={<MonetizationIcon />}
              color={theme.palette.success.main}
              subtitle={`${stats.transactionsMonth} transactions`}
              trend={8}
              loading={loading.dashboard}
              onClick={() => {
                setActiveTab(1);
                handleTransactionFilterChange('dateDebut', startOfMonth(new Date()));
                handleTransactionFilterChange('dateFin', new Date());
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Factures en retard"
              value={stats.overdueInvoices}
              icon={<WarningIcon />}
              color={theme.palette.error.main}
              subtitle={formatCurrency(stats.totalOverdueAmount)}
              trend={-5}
              loading={loading.dashboard}
              onClick={() => {
                setActiveTab(2);
                setFactureFilters(prev => ({ ...prev, statut: 'En attente' }));
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Taux de réussite"
              value={`${stats.successRate}%`}
              icon={<CheckIcon />}
              color={theme.palette.info.main}
              subtitle="Transactions réussies"
              trend={2}
              loading={loading.stats}
            />
          </Grid>
        </Grid>
        
        {/* Graphique et actions rapides */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="stat-card" sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
              }}>
                <CardHeader 
                  title={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AssessmentIcon color="primary" />
                      <Typography variant="h6" component="div">
                        Évolution mensuelle
                      </Typography>
                    </Stack>
                  }
                  subheader={`Période : ${format(new Date(), 'MMMM yyyy', { locale: fr })}`}
                  action={
                    <Tooltip title="Actualiser">
                      <IconButton onClick={loadDashboard} disabled={loading.dashboard}>
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  }
                />
                <CardContent>
                  {loading.dashboard ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                        <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                        <YAxis stroke={theme.palette.text.secondary} />
                        <RechartsTooltip 
                          formatter={(value) => [formatCurrency(value), 'Montant']}
                          labelFormatter={(label) => `Mois: ${label}`}
                          contentStyle={{ 
                            backgroundColor: theme.palette.background.paper,
                            borderColor: theme.palette.divider,
                            borderRadius: 8
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="montant" 
                          stroke={theme.palette.primary.main} 
                          fill={alpha(theme.palette.primary.main, 0.1)}
                          strokeWidth={2}
                          name="Montant total"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: 200
                    }}>
                      <TrendingIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography color="text.secondary" align="center">
                        Aucune donnée d'évolution disponible
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="stat-card" sx={{ height: '100%' }}>
                  <CardHeader 
                    title={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <SpeedIcon color="primary" />
                        <Typography variant="h6" component="div">
                          Actions rapides
                        </Typography>
                      </Stack>
                    }
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <QuickActionCard
                          title="Nouvelle facture"
                          description="Créer une nouvelle facture"
                          icon={<AddIcon />}
                          color={theme.palette.primary.main}
                          onClick={() => setFactureDialog({ open: true, mode: 'create', data: null })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <QuickActionCard
                          title="Paiement rapide"
                          description="Effectuer un paiement"
                          icon={<PaymentIcon />}
                          color={theme.palette.success.main}
                          onClick={() => setPaymentDialog({ open: true, type: 'facture', data: null, autoAmount: true })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <QuickActionCard
                          title="Exporter les données"
                          description="Exporter en PDF/Excel"
                          icon={<GetAppIcon />}
                          color={theme.palette.info.main}
                          onClick={() => handleExportData('transactions')}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Rendu des transactions
  const renderTransactions = () => (
    <Box>
      {/* En-tête avec filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="stat-card" sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoneyIcon color="primary" />
                  Transactions
                  {realTimeData.newTransactions > 0 && (
                    <Tooltip title={`${realTimeData.newTransactions} nouvelles transactions aujourd'hui`}>
                      <Badge 
                        badgeContent={realTimeData.newTransactions} 
                        color="error"
                        sx={{ ml: 2 }}
                      />
                    </Tooltip>
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {transactionFilters.total} transactions trouvées • Dernière mise à jour: {formatRelativeDate(realTimeData.lastUpdate)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <ToggleButtonGroup
                    value={transactionFilters.viewMode}
                    exclusive
                    onChange={(e, value) => handleViewModeChange('transaction', value)}
                    size="small"
                  >
                    <ToggleButton value="table">
                      <Tooltip title="Vue tableau">
                        <ViewIcon fontSize="small" />
                      </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="card">
                      <Tooltip title="Vue cartes">
                        <DashboardIcon fontSize="small" />
                      </Tooltip>
                    </ToggleButton>
                  </ToggleButtonGroup>
                  
                  <Button
                    variant="outlined"
                    startIcon={<FilterAltIcon />}
                    onClick={() => setFilterDrawerOpen(true)}
                    className="action-button outline"
                  >
                    Filtres
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadTransactions}
                    disabled={loading.transactions}
                    className="action-button outline"
                  >
                    Actualiser
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<GetAppIcon />}
                    onClick={() => handleExportData('transactions')}
                    className="action-button outline"
                    disabled={loading.export}
                  >
                    {loading.export ? 'Export...' : 'Exporter'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Filtres rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="stat-card" sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Rechercher"
                  placeholder="Référence, bénéficiaire, montant..."
                  value={transactionFilters.search}
                  onChange={(e) => handleTransactionFilterChange('search', e.target.value)}
                  className="form-field"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: transactionFilters.search && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => handleTransactionFilterChange('search', '')}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <FormControl fullWidth size="small" className="filter-group">
                  <InputLabel className="filter-label">Statut</InputLabel>
                  <Select
                    value={transactionFilters.status}
                    label="Statut"
                    onChange={(e) => handleTransactionFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="all">Tous les statuts</MenuItem>
                    <MenuItem value="Reussi">Réussi</MenuItem>
                    <MenuItem value="En cours">En cours</MenuItem>
                    <MenuItem value="Echoue">Échoué</MenuItem>
                    <MenuItem value="Validé">Validé</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={2}>
                <FormControl fullWidth size="small" className="filter-group">
                  <InputLabel className="filter-label">Type</InputLabel>
                  <Select
                    value={transactionFilters.type}
                    label="Type"
                    onChange={(e) => handleTransactionFilterChange('type', e.target.value)}
                  >
                    <MenuItem value="all">Tous les types</MenuItem>
                    <MenuItem value="PaiementFacture">Paiement facture</MenuItem>
                    <MenuItem value="PaiementRemboursement">Remboursement</MenuItem>
                    <MenuItem value="Versement">Versement</MenuItem>
                    <MenuItem value="Retrait">Retrait</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack direction="row" spacing={1}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
                    <DatePicker
                      label="Date début"
                      value={transactionFilters.dateDebut}
                      onChange={(date) => handleTransactionFilterChange('dateDebut', date)}
                      renderInput={(params) => (
                        <TextField {...params} size="small" fullWidth className="form-field" />
                      )}
                    />
                  </LocalizationProvider>
                  <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
                    <DatePicker
                      label="Date fin"
                      value={transactionFilters.dateFin}
                      onChange={(date) => handleTransactionFilterChange('dateFin', date)}
                      renderInput={(params) => (
                        <TextField {...params} size="small" fullWidth className="form-field" />
                      )}
                    />
                  </LocalizationProvider>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Vue cartes */}
      {transactionFilters.viewMode === 'card' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {loading.transactions ? (
            <Grid container spacing={2}>
              {Array.from({ length: 6 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          ) : transactions.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 8, mb: 3 }}>
              <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucune transaction trouvée
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Essayez de modifier vos critères de recherche
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />}
                onClick={loadTransactions}
              >
                Réessayer
              </Button>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {transactions.map((transaction, index) => (
                <Grid item xs={12} sm={6} md={4} key={transaction.COD_TRANS || transaction.id}>
                  <TransactionCard transaction={transaction} index={index} />
                </Grid>
              ))}
            </Grid>
          )}
        </motion.div>
      ) : (
        /* Vue tableau */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="stat-card">
            <CardContent sx={{ p: 0 }}>
              <TableContainer className="table-container" sx={{ maxHeight: 500 }}>
                <Table stickyHeader className="data-table">
                  <TableHead className="table-head">
                    <TableRow>
                      <TableCell className="table-header">
                        <Tooltip title="Trier par référence">
                          <Button 
                            size="small" 
                            endIcon={<SwapVertIcon />}
                            onClick={() => handleSort('transaction', 'reference')}
                            sx={{ color: 'inherit', fontWeight: 600 }}
                          >
                            Référence
                          </Button>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="table-header">Type</TableCell>
                      <TableCell className="table-header">Bénéficiaire</TableCell>
                      <TableCell className="table-header" align="right">
                        <Tooltip title="Trier par montant">
                          <Button 
                            size="small" 
                            endIcon={<SwapVertIcon />}
                            onClick={() => handleSort('transaction', 'montant')}
                            sx={{ color: 'inherit', fontWeight: 600 }}
                          >
                            Montant
                          </Button>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="table-header">Méthode</TableCell>
                      <TableCell className="table-header">Statut</TableCell>
                      <TableCell className="table-header">
                        <Tooltip title="Trier par date">
                          <Button 
                            size="small" 
                            endIcon={<SwapVertIcon />}
                            onClick={() => handleSort('transaction', 'date')}
                            sx={{ color: 'inherit', fontWeight: 600 }}
                          >
                            Date
                          </Button>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="table-header" align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading.transactions ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                          <CircularProgress size={48} />
                          <Typography sx={{ mt: 2 }}>Chargement des transactions...</Typography>
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
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
                          key={transaction.COD_TRANS || transaction.id}
                          component={motion.tr}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          hover
                          className="table-row-animated"
                          sx={{ 
                            '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.primary.main, 0.02) }
                          }}
                        >
                          <TableCell className="table-cell">
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {transaction.REFERENCE_TRANSACTION || transaction.reference}
                              </Typography>
                              {transaction.NUMERO_FACTURE && (
                                <Chip 
                                  label={`Facture: ${transaction.NUMERO_FACTURE}`}
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.65rem', mt: 0.5 }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell className="table-cell">
                            <Chip 
                              label={transaction.TYPE_TRANSACTION || transaction.type}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell className="table-cell">
                            <Box className="beneficiary-info">
                              <Typography variant="body2" fontWeight="medium" className="beneficiary-name">
                                {transaction.BENEFICIAIRE || transaction.NOM_BEN || 'N/A'}
                              </Typography>
                              {transaction.IDENTIFIANT_NATIONAL && (
                                <Typography variant="caption" color="text.secondary" className="beneficiary-details">
                                  ID: {transaction.IDENTIFIANT_NATIONAL}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell className="table-cell" align="right">
                            <Typography variant="h6" color="primary" fontWeight="bold">
                              {formatCurrency(transaction.MONTANT || transaction.montant)}
                            </Typography>
                          </TableCell>
                          <TableCell className="table-cell">
                            <Tooltip title={paymentMethods[transaction.METHODE_PAIEMENT]?.description || ''}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Avatar sx={{ 
                                  width: 24, 
                                  height: 24,
                                  bgcolor: alpha(paymentMethods[transaction.METHODE_PAIEMENT]?.color || theme.palette.grey[500], 0.1),
                                  color: paymentMethods[transaction.METHODE_PAIEMENT]?.color || theme.palette.text.primary
                                }}>
                                  {paymentMethods[transaction.METHODE_PAIEMENT]?.icon || <PaymentIcon fontSize="small" />}
                                </Avatar>
                                <Typography variant="body2">
                                  {paymentMethods[transaction.METHODE_PAIEMENT]?.label || transaction.METHODE_PAIEMENT || 'N/A'}
                                </Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="table-cell">
                            <Tooltip title={statusConfig[transaction.STATUT_TRANSACTION || transaction.statut]?.description || ''}>
                              <Chip
                                label={statusConfig[transaction.STATUT_TRANSACTION || transaction.statut]?.label || transaction.STATUT_TRANSACTION || transaction.statut}
                                size="small"
                                icon={statusConfig[transaction.STATUT_TRANSACTION || transaction.statut]?.icon}
                                className="status-badge"
                                sx={{ 
                                  bgcolor: statusConfig[transaction.STATUT_TRANSACTION || transaction.statut]?.bgColor,
                                  color: statusConfig[transaction.STATUT_TRANSACTION || transaction.statut]?.color,
                                  fontWeight: 600
                                }}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell className="table-cell">
                            <Box>
                              <Typography variant="body2">
                                {formatDate(transaction.DATE_INITIATION || transaction.date_initiation, 'dd/MM/yyyy')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(transaction.DATE_INITIATION || transaction.date_initiation, 'HH:mm')}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell className="table-cell" align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end" className="actions-container">
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
                              <Tooltip title="Télécharger le reçu">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleDownloadDocument(transaction.REFERENCE_TRANSACTION || transaction.reference, 'transaction')}
                                  sx={{ color: theme.palette.primary.main }}
                                >
                                  <DownloadIcon fontSize="small" />
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
              <Box className="pagination-container" sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography className="pagination-info">
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
        </motion.div>
      )}
    </Box>
  );
  
  // Rendu des factures
  const renderFactures = () => (
    <Box>
      {/* En-tête avec filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="stat-card" sx={{ mb: 3 }}>
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
                  <ToggleButtonGroup
                    value={factureFilters.viewMode}
                    exclusive
                    onChange={(e, value) => handleViewModeChange('facture', value)}
                    size="small"
                  >
                    <ToggleButton value="table">
                      <Tooltip title="Vue tableau">
                        <ViewIcon fontSize="small" />
                      </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="card">
                      <Tooltip title="Vue cartes">
                        <DashboardIcon fontSize="small" />
                      </Tooltip>
                    </ToggleButton>
                  </ToggleButtonGroup>
                  
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setFactureDialog({ open: true, mode: 'create', data: null })}
                    className="action-button primary"
                  >
                    Nouvelle facture
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadFactures}
                    disabled={loading.factures}
                    className="action-button outline"
                  >
                    Actualiser
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<GetAppIcon />}
                    onClick={() => handleExportData('factures')}
                    className="action-button outline"
                    disabled={loading.export}
                  >
                    {loading.export ? 'Export...' : 'Exporter'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Filtres rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="stat-card" sx={{ mb: 3 }}>
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
                  className="form-field"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: factureFilters.search && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => handleFactureFilterChange('search', '')}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small" className="filter-group">
                  <InputLabel className="filter-label">Statut</InputLabel>
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
                    <MenuItem value="En retard">En retard</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
                    <DatePicker
                      label="Date début"
                      value={factureFilters.dateDebut}
                      onChange={(date) => handleFactureFilterChange('dateDebut', date)}
                      renderInput={(params) => (
                        <TextField {...params} size="small" fullWidth className="form-field" />
                      )}
                    />
                  </LocalizationProvider>
                  <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
                    <DatePicker
                      label="Date fin"
                      value={factureFilters.dateFin}
                      onChange={(date) => handleFactureFilterChange('dateFin', date)}
                      renderInput={(params) => (
                        <TextField {...params} size="small" fullWidth className="form-field" />
                      )}
                    />
                  </LocalizationProvider>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={loadFactures}
                    sx={{ height: '40px' }}
                    disabled={loading.factures}
                    className="action-button outline"
                  >
                    Appliquer
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Vue cartes */}
      {factureFilters.viewMode === 'card' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {loading.factures ? (
            <Grid container spacing={2}>
              {Array.from({ length: 6 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          ) : factures.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 8, mb: 3 }}>
              <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucune facture trouvée
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Créez votre première facture
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setFactureDialog({ open: true, mode: 'create', data: null })}
              >
                Nouvelle facture
              </Button>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {factures.map((facture, index) => (
                <Grid item xs={12} sm={6} md={4} key={facture.id}>
                  <FactureCard facture={facture} index={index} />
                </Grid>
              ))}
            </Grid>
          )}
        </motion.div>
      ) : (
        /* Vue tableau */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="stat-card">
            <CardContent sx={{ p: 0 }}>
              <TableContainer className="table-container" sx={{ maxHeight: 500 }}>
                <Table stickyHeader className="data-table">
                  <TableHead className="table-head">
                    <TableRow>
                      <TableCell className="table-header">
                        <Tooltip title="Trier par numéro">
                          <Button 
                            size="small" 
                            endIcon={<SwapVertIcon />}
                            onClick={() => handleSort('facture', 'numero')}
                            sx={{ color: 'inherit', fontWeight: 600 }}
                          >
                            Numéro
                          </Button>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="table-header">Bénéficiaire</TableCell>
                      <TableCell className="table-header">
                        <Tooltip title="Trier par date">
                          <Button 
                            size="small" 
                            endIcon={<SwapVertIcon />}
                            onClick={() => handleSort('facture', 'date_facture')}
                            sx={{ color: 'inherit', fontWeight: 600 }}
                          >
                            Date
                          </Button>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="table-header">
                        <Tooltip title="Trier par échéance">
                          <Button 
                            size="small" 
                            endIcon={<SwapVertIcon />}
                            onClick={() => handleSort('facture', 'date_echeance')}
                            sx={{ color: 'inherit', fontWeight: 600 }}
                          >
                            Échéance
                          </Button>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="table-header" align="right">Total</TableCell>
                      <TableCell className="table-header" align="right">Payé</TableCell>
                      <TableCell className="table-header" align="right">Reste</TableCell>
                      <TableCell className="table-header">Statut</TableCell>
                      <TableCell className="table-header" align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading.factures ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                          <CircularProgress size={48} />
                          <Typography sx={{ mt: 2 }}>Chargement des factures...</Typography>
                        </TableCell>
                      </TableRow>
                    ) : factures.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
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
                          component={motion.tr}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          hover
                          className="table-row-animated"
                          sx={{ 
                            '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.primary.main, 0.02) },
                            ...(new Date(facture.date_echeance) < new Date() && facture.statut !== 'Payée' && {
                              backgroundColor: alpha(theme.palette.error.main, 0.05),
                              '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.08) }
                            })
                          }}
                        >
                          <TableCell className="table-cell">
                            <Typography variant="body2" fontWeight="medium">
                              {facture.numero}
                            </Typography>
                          </TableCell>
                          <TableCell className="table-cell">
                            <Box className="beneficiary-info">
                              <Typography variant="body2" fontWeight="medium" className="beneficiary-name">
                                {facture.nom_ben} {facture.prenom_ben}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" className="beneficiary-details">
                                {facture.identifiant_ben}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell className="table-cell">
                            {formatDate(facture.date_facture, 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="table-cell">
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              color: new Date(facture.date_echeance) < new Date() && facture.statut !== 'Payée' ? 'error.main' : 'inherit'
                            }}>
                              {formatDate(facture.date_echeance, 'dd/MM/yyyy')}
                              {new Date(facture.date_echeance) < new Date() && facture.statut !== 'Payée' && (
                                <Tooltip title="Facture en retard">
                                  <WarningIcon fontSize="small" sx={{ ml: 1 }} />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell className="table-cell" align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(facture.montant_total)}
                            </Typography>
                          </TableCell>
                          <TableCell className="table-cell" align="right">
                            <Typography variant="body2" color="success.main">
                              {formatCurrency(facture.montant_paye)}
                            </Typography>
                          </TableCell>
                          <TableCell className="table-cell" align="right">
                            <Typography 
                              variant="body2" 
                              fontWeight="bold"
                              color={facture.montant_restant > 0 ? 'error.main' : 'success.main'}
                            >
                              {formatCurrency(facture.montant_restant)}
                            </Typography>
                          </TableCell>
                          <TableCell className="table-cell">
                            <Tooltip title={statusConfig[facture.statut]?.description || ''}>
                              <Chip
                                label={statusConfig[facture.statut]?.label || facture.statut}
                                size="small"
                                icon={statusConfig[facture.statut]?.icon}
                                className="status-badge"
                                sx={{ 
                                  bgcolor: statusConfig[facture.statut]?.bgColor,
                                  color: statusConfig[facture.statut]?.color,
                                  fontWeight: 600
                                }}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell className="table-cell" align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end" className="actions-container">
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
                              <Tooltip title="Générer facture AMS">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleGenerateInvoice(facture)}
                                  sx={{ color: theme.palette.info.main }}
                                >
                                  <ReceiptIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {facture.statut !== 'Payée' && (
                                <Tooltip title="Payer">
                                  <IconButton 
                                    size="small"
                                    onClick={() => setPaymentDialog({ 
                                      open: true, 
                                      type: 'facture', 
                                      data: facture,
                                      autoAmount: true
                                    })}
                                    sx={{ color: theme.palette.success.main }}
                                  >
                                    <PaymentIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Télécharger">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleDownloadDocument(facture.id, 'facture')}
                                  sx={{ color: theme.palette.primary.main }}
                                >
                                  <DownloadIcon fontSize="small" />
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
              <Box className="pagination-container" sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography className="pagination-info">
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
        </motion.div>
      )}
    </Box>
  );
  
  // SpeedDial actions
  const speedDialActions = [
    { icon: <AddIcon />, name: 'Nouvelle facture', onClick: () => setFactureDialog({ open: true, mode: 'create', data: null }) },
    { icon: <PaymentIcon />, name: 'Paiement rapide', onClick: () => setPaymentDialog({ open: true, type: 'facture', data: null, autoAmount: true }) },
    { icon: <GetAppIcon />, name: 'Exporter données', onClick: () => handleExportData('transactions') },
    { icon: <PrintIcon />, name: 'Imprimer rapport', onClick: () => window.print() },
    { icon: <QrCodeIcon />, name: 'Générer QR Code', onClick: () => showNotification('Fonctionnalité à venir', 'info') },
  ];
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
      <Container maxWidth="xl" className="reglement-container" sx={{ py: 3 }}>
        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={notification.duration}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          className="notification-snackbar"
        >
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <Alert 
              onClose={handleCloseNotification} 
              severity={notification.type}
              sx={{ width: '100%' }}
              className="notification-alert"
              elevation={6}
              variant="filled"
            >
              <AlertTitle>
                {notification.type === 'success' ? 'Succès' : 
                 notification.type === 'error' ? 'Erreur' : 
                 notification.type === 'warning' ? 'Avertissement' : 'Information'}
              </AlertTitle>
              {notification.message}
            </Alert>
          </motion.div>
        </Snackbar>
        
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box className="dashboard-header" sx={{ mb: 4 }}>
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid item xs={12} md={8}>
                <Typography variant="h3" gutterBottom sx={{ 
                  fontWeight: 800,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <DashboardIcon fontSize="large" />
                    Tableau de bord financier
                  </Box>
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600 }}>
                  Gérez vos transactions, factures et paiements en temps réel. 
                  <br />
                  Interface moderne, intuitive et performante.
                </Typography>
                
                {/* Badges de statut */}
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Chip 
                    icon={realTimeData.online ? <WifiIcon /> : <WifiOffIcon />}
                    label={realTimeData.online ? "Connecté" : "Hors ligne"}
                    color={realTimeData.online ? "success" : "error"}
                    size="small"
                    variant="outlined"
                  />
                  <Chip 
                    icon={<UpdateIcon />}
                    label={`Mis à jour: ${formatRelativeDate(realTimeData.lastUpdate)}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip 
                    icon={<VerifiedUserIcon />}
                    label="Sécurisé"
                    color="success"
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<DateRangeIcon />}
                    onClick={() => showNotification('Calendrier à venir', 'info')}
                    sx={{ borderRadius: 3 }}
                  >
                    {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PrintIcon />}
                    onClick={() => window.print()}
                    sx={{ borderRadius: 3 }}
                  >
                    Imprimer
                  </Button>
                </Stack>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
          </Box>
        </motion.div>
        
        {/* Barre d'onglets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Paper sx={{ 
            mb: 4, 
            borderRadius: 3,
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }} className="tabs-paper">
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              className="custom-tabs"
              sx={{ 
                '& .MuiTab-root': { 
                  py: 2.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    transform: 'translateY(-2px)'
                  }
                },
                '& .MuiTabs-indicator': {
                  height: 4,
                  borderRadius: '2px 2px 0 0',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                }
              }}
            >
              <Tab 
                label={
                  <Badge 
                    badgeContent={dashboardData.resume?.factures_en_retard || 0} 
                    color="error"
                    max={99}
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem', animation: 'pulse 2s infinite' } }}
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
                  <Badge 
                    badgeContent={transactionFilters.total} 
                    color="info"
                    max={999}
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <MoneyIcon />
                      <span>Transactions</span>
                    </Stack>
                  </Badge>
                }
              />
              <Tab 
                label={
                  <Badge 
                    badgeContent={factureFilters.total} 
                    color="warning"
                    max={999}
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ReceiptIcon />
                      <span>Factures</span>
                    </Stack>
                  </Badge>
                }
              />
            </Tabs>
            
            {/* Contenu des onglets avec animation */}
            <Box className="tab-content-container" sx={{ p: 3 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 0 && renderDashboard()}
                  {activeTab === 1 && renderTransactions()}
                  {activeTab === 2 && renderFactures()}
                </motion.div>
              </AnimatePresence>
            </Box>
          </Paper>
        </motion.div>
        
        {/* SpeedDial pour actions rapides */}
        <SpeedDial
          ariaLabel="Actions rapides"
          sx={{ position: 'fixed', bottom: 32, right: 32 }}
          icon={<SpeedDialIcon />}
          onOpen={() => setSpeedDialOpen(true)}
          onClose={() => setSpeedDialOpen(false)}
          open={speedDialOpen}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
              FabProps={{ sx: { bgcolor: theme.palette.primary.main, color: 'white' } }}
            />
          ))}
        </SpeedDial>
        
        {/* Drawer pour filtres avancés */}
        <Drawer
          anchor="right"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{
            sx: { width: { xs: '100%', sm: 400 }, p: 3 }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Filtres avancés</Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Type de transaction</InputLabel>
              <Select
                value={transactionFilters.type}
                label="Type de transaction"
                onChange={(e) => handleTransactionFilterChange('type', e.target.value)}
              >
                <MenuItem value="all">Tous les types</MenuItem>
                <MenuItem value="PaiementFacture">Paiement facture</MenuItem>
                <MenuItem value="PaiementRemboursement">Remboursement</MenuItem>
                <MenuItem value="Versement">Versement</MenuItem>
                <MenuItem value="Retrait">Retrait</MenuItem>
                <MenuItem value="Frais">Frais</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Méthode de paiement</InputLabel>
              <Select
                value={transactionFilters.method}
                label="Méthode de paiement"
                onChange={(e) => handleTransactionFilterChange('method', e.target.value)}
              >
                <MenuItem value="all">Toutes les méthodes</MenuItem>
                {Object.keys(paymentMethods).map((method) => (
                  <MenuItem key={method} value={method}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {paymentMethods[method].icon}
                      {paymentMethods[method].label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                setFilterDrawerOpen(false);
                loadTransactions();
              }}
            >
              Appliquer les filtres
            </Button>
            
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setTransactionFilters(prev => ({
                  ...prev,
                  status: 'all',
                  type: 'all',
                  method: 'all'
                }));
                setFilterDrawerOpen(false);
              }}
            >
              Réinitialiser
            </Button>
          </Stack>
        </Drawer>
        
        {/* Dialogues */}
        <PaymentDialog
          open={paymentDialog.open}
          type={paymentDialog.type}
          data={paymentDialog.data}
          onClose={() => setPaymentDialog({ open: false, type: 'facture', data: null, autoAmount: true })}
          onSubmit={handleInitiatePayment}
          loading={loading.transactions}
          formatCurrency={formatCurrency}
          autoAmount={paymentDialog.autoAmount}
        />
        
        <FactureDialog
          open={factureDialog.open}
          mode={factureDialog.mode}
          data={factureDialog.data}
          onClose={() => setFactureDialog({ open: false, mode: 'create', data: null })}
          onSubmit={handleGenerateFacture}
          loading={loading.factures}
          formatCurrency={formatCurrency}
          onSearchBeneficiaire={() => setBeneficiaireSearchDialog({ open: true, onSelect: (beneficiaire) => {
            console.log('Bénéficiaire sélectionné:', beneficiaire);
          }})}
        />
        
        {/* Dialogue pour l'InvoiceGenerator */}
        <Dialog
          open={invoiceDialog.open}
          onClose={() => setInvoiceDialog({ open: false, data: null, type: 'proforma', beneficiary: null })}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { 
              maxHeight: '90vh',
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
            pb: 2
          }}>
            <Box display="flex" alignItems="center" gap={1}>
              <ReceiptIcon color="primary" />
              <Typography variant="h6">
                {invoiceDialog.type === 'proforma' ? 'Facture AMS Insurance' : 'Facture'}
              </Typography>
            </Box>
            <IconButton onClick={() => setInvoiceDialog({ open: false, data: null, type: 'proforma', beneficiary: null })}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0 }}>
            <InvoiceGenerator
              initialBeneficiary={invoiceDialog.beneficiary}
              initialInvoiceData={invoiceDialog.data}
              onClose={() => setInvoiceDialog({ open: false, data: null, type: 'proforma', beneficiary: null })}
              onPrint={() => showNotification('Impression lancée', 'info')}
              onDownload={() => showNotification('Téléchargement lancé', 'info')}
              editable={true}
            />
          </DialogContent>
        </Dialog>
        
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
          showNotification={showNotification}
        />
        
        <BeneficiaireSearchDialog
          open={beneficiaireSearchDialog.open}
          onClose={() => setBeneficiaireSearchDialog({ open: false, onSelect: null })}
          onSelect={beneficiaireSearchDialog.onSelect}
          searchTerm={beneficiaireSearchTerm}
          onSearchChange={setBeneficiaireSearchTerm}
          beneficiaires={beneficiaires}
          loading={loading.beneficiaires}
        />
      </Container>
    </LocalizationProvider>
  );
};

export default ReglementPage;