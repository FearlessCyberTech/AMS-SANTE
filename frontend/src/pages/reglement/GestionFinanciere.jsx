import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  Stack,
  useTheme,
  alpha,
  LinearProgress,
  InputAdornment,
  TablePagination,
  Container,
  Divider,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  AttachMoney as AttachMoneyIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  BarChart as BarChartIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Search as SearchIcon,
  CalendarMonth as CalendarMonthIcon,
  FilterList as FilterListIcon,
  Analytics as AnalyticsIcon,
  ReceiptLong as ReceiptLongIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TrendingDown as TrendingDownIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import DeclarationDialog from './DeclarationDialog';
import AMSlogo from "../../assets/AMS-logo.png";

// API imports - Utilisation des bonnes API pour les déclarations
import { remboursementsAPI, beneficiairesAPI } from '../../services/api';

// Import pour la génération PDF
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

// Composant StatCard défini à l'extérieur pour éviter les re-créations
const StatCard = ({ title, value, icon: Icon, color, subtitle, trend, loading }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        borderRadius: 3,
        height: '100%',
        background: `linear-gradient(145deg, ${alpha(theme.palette[color].main, 0.15)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        boxShadow: `0 4px 20px ${alpha(theme.palette[color].main, 0.1)}`,
        transition: 'all 0.3s',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 32px ${alpha(theme.palette[color].main, 0.2)}`,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="overline" color="text.secondary" sx={{ 
              fontWeight: 600, 
              letterSpacing: 0.5,
              opacity: 0.8 
            }}>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ 
              fontWeight: 700, 
              mb: 1,
              color: theme.palette[color].main
            }}>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                value
              )}
            </Typography>
            {trend !== undefined && (
              <Box display="flex" alignItems="center" gap={1}>
                {trend > 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                )}
                <Typography variant="caption" fontWeight="bold" color={trend > 0 ? 'success.main' : 'error.main'}>
                  {trend > 0 ? '+' : ''}{trend}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs mois dernier
                </Typography>
              </Box>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, opacity: 0.7 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon sx={{ fontSize: 24 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Composant StatusChip
const StatusChip = ({ status }) => {
  const statusConfig = {
    'Soumis': { color: 'info', label: 'Soumis', icon: <ReceiptLongIcon fontSize="small" /> },
    'Validé': { color: 'success', label: 'Validé', icon: <CheckCircleIcon fontSize="small" /> },
    'Rejeté': { color: 'error', label: 'Rejeté', icon: <ErrorIcon fontSize="small" /> },
    'Payé': { color: 'primary', label: 'Payé', icon: <PaymentIcon fontSize="small" /> },
    'En traitement': { color: 'warning', label: 'En traitement', icon: <RefreshIcon fontSize="small" /> },
    'En attente': { color: 'warning', label: 'En attente', icon: <RefreshIcon fontSize="small" /> },
    'default': { color: 'default', label: status, icon: null }
  };

  const config = statusConfig[status] || statusConfig.default;

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
      sx={{
        fontWeight: 600,
        borderRadius: 1,
        borderWidth: 1
      }}
    />
  );
};

const FinancialSettlementModule = () => {
  const theme = useTheme();
  
  // ==============================================
  // ÉTATS PRINCIPAUX
  // ==============================================
  
  const [dashboardStats, setDashboardStats] = useState({
    nbSoumis: 0,
    montantAPayer: 0,
    payesMois: 0,
    ticketMoyen: 0,
    nbValides: 0,
    nbRejetes: 0,
    evolutionMensuelle: 0
  });
  
  const [declarations, setDeclarations] = useState([]);
  const [filteredDeclarations, setFilteredDeclarations] = useState([]);
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [loading, setLoading] = useState({
    dashboard: false,
    declarations: false,
    beneficiaires: false,
    traitement: false
  });
  
  // États pour les filtres et pagination
  const [declarationFilters, setDeclarationFilters] = useState({
    page: 0,
    rowsPerPage: 10,
    status: 'all',
    dateDebut: null,
    dateFin: null,
    search: '',
    sortBy: 'DATE_DECLARATION',
    sortOrder: 'desc'
  });
  
  const [activeTab, setActiveTab] = useState(0);
  const [chartType, setChartType] = useState('bar');
  
  // États pour les dialogues
  const [openPaiementDialog, setOpenPaiementDialog] = useState(false);
  const [openNewDeclarationDialog, setOpenNewDeclarationDialog] = useState(false);
  const [openTraitementDialog, setOpenTraitementDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  
  // États pour les formulaires
  const [paiementForm, setPaiementForm] = useState({
    COD_DECL: '',
    MONTANT: '',
    METHODE: 'MobileMoney',
    COD_BEN: '',
    REFERENCE: '',
    OBSERVATIONS: ''
  });
  
  const [traitementForm, setTraitementForm] = useState({
    COD_DECL: null,
    action: 'Valider',
    motif_rejet: '',
    utilisateur: ''
  });
  
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  
  // États pour les notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // ==============================================
  // FONCTIONS UTILITAIRES
  // ==============================================

  const showNotification = useCallback((message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  const formatMontant = (montant) => {
    if (!montant) return '0 XAF';
    return `${parseFloat(montant).toLocaleString('fr-FR')} XAF`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // ==============================================
  // CHARGEMENT DES DONNÉES - DÉCLARATIONS
  // ==============================================

  const loadDeclarations = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, declarations: true }));
      
      // Utilisation de l'API remboursements pour les déclarations
      const filters = {
        page: declarationFilters.page + 1,
        limit: declarationFilters.rowsPerPage
      };
      
      if (declarationFilters.status !== 'all') {
        filters.status = declarationFilters.status;
      }
      
      if (declarationFilters.search) {
        filters.search = declarationFilters.search;
      }
      
      console.log('🔍 Chargement déclarations avec filtres:', filters);
      
      const response = await remboursementsAPI.getDeclarations(filters);
      
      if (response.success) {
        console.log('✅ Déclarations récupérées:', response.declarations?.length || 0);
        
        // Formatage des déclarations
        const formattedDeclarations = (response.declarations || []).map(decl => {
          // Trouver le bénéficiaire correspondant
          const beneficiaire = beneficiaires.find(b => 
            b.id && decl.COD_BEN && b.id.toString() === decl.COD_BEN.toString()
          );
          
          return {
            id: decl.COD_DECL || decl.id,
            ...decl,
            displayId: `DECL-${decl.COD_DECL || decl.id}`,
            nomComplet: `${decl.NOM_BEN || ''} ${decl.PRE_BEN || ''}`.trim(),
            dateFormatted: decl.DATE_DECLARATION ? formatDate(decl.DATE_DECLARATION) : '-',
            beneficiaireInfo: beneficiaire ? {
              nom: beneficiaire.nom,
              prenom: beneficiaire.prenom,
              identifiant: beneficiaire.identifiant,
              telephone: beneficiaire.telephone,
              email: beneficiaire.email
            } : null,
            STATUT: decl.statut || decl.STATUT || 'Soumis',
            MONTANT_TOTAL: decl.MONTANT_TOTAL || 0,
            MONTANT_PRISE_CHARGE: decl.MONTANT_PRISE_CHARGE || 0,
            MONTANT_TICKET_MODERATEUR: decl.MONTANT_TICKET_MODERATEUR || 0,
            MONTANT_REMBOURSABLE: decl.MONTANT_REMBOURSABLE || decl.MONTANT_PRISE_CHARGE || 0,
            IDENTIFIANT_NATIONAL: decl.IDENTIFIANT_NATIONAL || '',
            DATE_DECLARATION: decl.DATE_DECLARATION,
            COD_BEN: decl.COD_BEN,
            COD_DECL: decl.COD_DECL || decl.id,
            MOTIF_REJET: decl.MOTIF_REJET || decl.motif_rejet || ''
          };
        });
        
        setDeclarations(formattedDeclarations);
        setFilteredDeclarations(formattedDeclarations);
        
        // Mettre à jour les statistiques du dashboard
        updateDashboardStats(formattedDeclarations);
      } else {
        showNotification(response.message || 'Erreur lors du chargement des déclarations', 'error');
      }
    } catch (error) {
      console.error('❌ Erreur chargement déclarations:', error);
      showNotification('Erreur lors du chargement des déclarations', 'error');
    } finally {
      setLoading(prev => ({ ...prev, declarations: false }));
    }
  }, [declarationFilters, beneficiaires, showNotification]);

  const updateDashboardStats = useCallback((declarationsList) => {
    try {
      const totalDeclarations = declarationsList.length;
      const declarationsValidees = declarationsList.filter(d => d.STATUT === 'Validé');
      const declarationsSoumises = declarationsList.filter(d => d.STATUT === 'Soumis');
      const declarationsPayees = declarationsList.filter(d => d.STATUT === 'Payé');
      
      const montantAPayer = declarationsValidees.reduce((sum, d) => sum + (d.MONTANT_REMBOURSABLE || 0), 0);
      const payesMois = declarationsPayees.reduce((sum, d) => sum + (d.MONTANT_REMBOURSABLE || 0), 0);
      const ticketMoyen = totalDeclarations > 0 
        ? declarationsList.reduce((sum, d) => sum + (d.MONTANT_TOTAL || 0), 0) / totalDeclarations
        : 0;
      
      setDashboardStats({
        nbSoumis: declarationsSoumises.length,
        montantAPayer,
        payesMois,
        ticketMoyen: Math.round(ticketMoyen),
        nbValides: declarationsValidees.length,
        nbRejetes: declarationsList.filter(d => d.STATUT === 'Rejeté').length,
        evolutionMensuelle: 0 // À calculer avec les données historiques
      });
    } catch (error) {
      console.error('Erreur mise à jour statistiques:', error);
    }
  }, []);

  // ==============================================
  // CHARGEMENT DES BÉNÉFICIAIRES
  // ==============================================

  const loadBeneficiaires = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, beneficiaires: true }));
      
      const response = await beneficiairesAPI.getAll(100, 1);
      
      if (response.success) {
        const formattedBeneficiaires = (response.beneficiaires || []).map(ben => ({
          id: ben.id || ben.ID_BEN,
          nom: ben.nom || ben.NOM_BEN,
          prenom: ben.prenom || ben.PRE_BEN,
          telephone: ben.telephone || ben.TELEPHONE_MOBILE,
          identifiant: ben.identifiant || ben.IDENTIFIANT_NATIONAL,
          email: ben.email || ben.EMAIL,
          profession: ben.profession || ben.PROFESSION,
          pays: ben.pays || ben.PAYS,
          displayName: `${ben.nom || ben.NOM_BEN} ${ben.prenom || ben.PRE_BEN}`,
          type_beneficiaire: ben.type_beneficiaire || 'Assuré Principal'
        }));
        
        setBeneficiaires(formattedBeneficiaires);
        console.log('✅ Bénéficiaires chargés:', formattedBeneficiaires.length);
      } else {
        showNotification(response.message || 'Erreur lors du chargement des bénéficiaires', 'error');
      }
    } catch (error) {
      console.error('❌ Erreur chargement bénéficiaires:', error);
      showNotification('Erreur lors du chargement des bénéficiaires', 'error');
    } finally {
      setLoading(prev => ({ ...prev, beneficiaires: false }));
    }
  }, [showNotification]);

  // ==============================================
  // FONCTIONS DE FILTRAGE
  // ==============================================

  const applyFilters = useCallback(() => {
    let filtered = [...declarations];
    
    // Filtre par statut
    if (declarationFilters.status !== 'all') {
      filtered = filtered.filter(decl => decl.STATUT === declarationFilters.status);
    }
    
    // Filtre par recherche
    if (declarationFilters.search) {
      const searchLower = declarationFilters.search.toLowerCase();
      filtered = filtered.filter(decl => 
        decl.displayId?.toLowerCase().includes(searchLower) ||
        decl.nomComplet?.toLowerCase().includes(searchLower) ||
        decl.IDENTIFIANT_NATIONAL?.toLowerCase().includes(searchLower) ||
        decl.beneficiaireInfo?.telephone?.includes(searchLower)
      );
    }
    
    // Filtre par date début
    if (declarationFilters.dateDebut) {
      const dateDebut = new Date(declarationFilters.dateDebut);
      filtered = filtered.filter(decl => {
        if (!decl.DATE_DECLARATION) return false;
        const declDate = new Date(decl.DATE_DECLARATION);
        return declDate >= dateDebut;
      });
    }
    
    // Filtre par date fin
    if (declarationFilters.dateFin) {
      const dateFin = new Date(declarationFilters.dateFin);
      dateFin.setHours(23, 59, 59, 999);
      filtered = filtered.filter(decl => {
        if (!decl.DATE_DECLARATION) return false;
        const declDate = new Date(decl.DATE_DECLARATION);
        return declDate <= dateFin;
      });
    }
    
    // Tri
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (declarationFilters.sortBy) {
        case 'DATE_DECLARATION':
          aValue = a.DATE_DECLARATION ? new Date(a.DATE_DECLARATION).getTime() : 0;
          bValue = b.DATE_DECLARATION ? new Date(b.DATE_DECLARATION).getTime() : 0;
          break;
        case 'MONTANT_TOTAL':
          aValue = a.MONTANT_TOTAL || 0;
          bValue = b.MONTANT_TOTAL || 0;
          break;
        default:
          aValue = a[declarationFilters.sortBy] || '';
          bValue = b[declarationFilters.sortBy] || '';
      }
      
      if (declarationFilters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredDeclarations(filtered);
  }, [declarations, declarationFilters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ==============================================
  // GESTION DES DÉCLARATIONS
  // ==============================================

  const handleInitierPaiement = async () => {
    try {
      setLoading(prev => ({ ...prev, traitement: true }));
      
      const paiementData = {
        COD_DECL: paiementForm.COD_DECL,
        MONTANT: parseFloat(paiementForm.MONTANT) || 0,
        COD_BEN: paiementForm.COD_BEN,
        METHODE: paiementForm.METHODE,
        reference_paiement: paiementForm.REFERENCE || `PAY-${Date.now()}`
      };
      
      // CORRECTION : Utiliser l'API remboursements pour initier le paiement d'une déclaration
      const response = await remboursementsAPI.initierPaiement(paiementData);
      
      if (response.success) {
        showNotification('Paiement initié avec succès', 'success');
        setOpenPaiementDialog(false);
        setPaiementForm({
          COD_DECL: '',
          MONTANT: '',
          METHODE: 'MobileMoney',
          COD_BEN: '',
          REFERENCE: '',
          OBSERVATIONS: ''
        });
        await refreshData();
      } else {
        throw new Error(response.message || 'Erreur lors de l\'initiation du paiement');
      }
    } catch (error) {
      console.error('❌ Erreur initiation paiement:', error);
      showNotification(error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, traitement: false }));
    }
  };

  const handleTraiterDeclaration = async () => {
    try {
      if (!traitementForm.COD_DECL) {
        throw new Error('Aucune déclaration sélectionnée');
      }
      
      setLoading(prev => ({ ...prev, traitement: true }));
      
      const action = traitementForm.action === 'Valider' ? 'valider' : 'rejeter';
      const response = await remboursementsAPI.traiterDeclaration(
        traitementForm.COD_DECL,
        action,
        traitementForm.motif_rejet
      );
      
      if (response.success) {
        showNotification(
          `Déclaration ${traitementForm.action === 'Valider' ? 'validée' : 'rejetée'} avec succès`,
          'success'
        );
        
        setOpenTraitementDialog(false);
        setTraitementForm({
          COD_DECL: null,
          action: 'Valider',
          motif_rejet: '',
          utilisateur: ''
        });
        
        await refreshData();
      } else {
        throw new Error(response.message || 'Erreur lors du traitement');
      }
    } catch (error) {
      console.error('❌ Erreur traitement déclaration:', error);
      showNotification(error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, traitement: false }));
    }
  };

 const handleSubmitDeclaration = async (declarationData) => {
  try {
    console.log('📝 Création de déclaration:', declarationData);
    
    // Validation des données
    if (!declarationData.cod_ben) {
      showNotification('Le bénéficiaire est requis', 'error');
      return;
    }
    
    if (!declarationData.prestations || declarationData.prestations.length === 0) {
      showNotification('Au moins une prestation est requise', 'error');
      return;
    }
    
    // Calculer les montants
    const montantTotal = declarationData.prestations.reduce((sum, p) => sum + (p.montant || 0), 0);
    const montantPriseCharge = declarationData.prestations.reduce((sum, p) => sum + (p.montant_prise_charge || 0), 0);
    const ticketModerateur = montantTotal - montantPriseCharge;
    
    // Formatage des données pour l'API
    const formattedData = {
      COD_BEN: parseInt(declarationData.cod_ben),
      TYPE_DECLARANT: declarationData.type_declarant || 'Beneficiaire',
      NOM_DECLARANT: `${declarationData.nom_ben} ${declarationData.prenom_ben}`,
      details: declarationData.prestations.map(p => ({
        TYPE_PRESTATION: p.type_prestation || 'Consultation',
        LIBELLE_PRESTATION: p.libelle || p.nom,
        MONTANT: p.montant || 0,
        QUANTITE: p.quantite || 1,
        DATE_PRESTATION: p.date_prestation || new Date().toISOString().split('T')[0],
        TAUX_PRISE_CHARGE: p.taux_prise_charge || 100,
        MONTANT_PRISE_CHARGE: p.montant_prise_charge || p.montant,
        ID_PRESTATION: p.id_prestation || p.COD_PREST
      })),
      MONTANT_TOTAL: montantTotal,
      MONTANT_PRISE_CHARGE: montantPriseCharge,
      MONTANT_TICKET_MODERATEUR: ticketModerateur,
      MONTANT_REMBOURSABLE: montantPriseCharge,
      OBSERVATIONS: declarationData.observations || '',
      PIECES_JOINTES: declarationData.pieces_jointes || ''
    };
    
    console.log('📤 Données envoyées à l\'API:', formattedData);
    
    const response = await remboursementsAPI.creerDeclaration(formattedData);
    
    if (response.success) {
      showNotification('Déclaration créée avec succès', 'success');
      setOpenNewDeclarationDialog(false);
      await refreshData();
    } else {
      throw new Error(response.message || 'Erreur lors de la création');
    }
  } catch (error) {
    console.error('❌ Erreur création déclaration:', error);
    showNotification(error.message || 'Erreur lors de la création de la déclaration', 'error');
  }
};

  // ==============================================
  // FONCTIONS UTILITAIRES
  // ==============================================

  const refreshData = async () => {
    try {
      await Promise.all([
        loadDeclarations(),
        loadBeneficiaires()
      ]);
      showNotification('Données actualisées avec succès', 'success');
    } catch (error) {
      console.error('Erreur actualisation:', error);
      showNotification('Erreur lors de l\'actualisation', 'error');
    }
  };

  const exportDeclarations = () => {
    try {
      const dataToExport = filteredDeclarations.map(decl => ({
        'N° Déclaration': `DECL-${decl.COD_DECL}`,
        'Bénéficiaire': decl.nomComplet,
        'Date déclaration': decl.dateFormatted,
        'Montant total': formatMontant(decl.MONTANT_TOTAL),
        'Prise en charge': formatMontant(decl.MONTANT_PRISE_CHARGE),
        'Ticket modérateur': formatMontant(decl.MONTANT_TICKET_MODERATEUR),
        'Montant remboursable': formatMontant(decl.MONTANT_REMBOURSABLE),
        'Statut': decl.STATUT,
        'Identifiant': decl.IDENTIFIANT_NATIONAL || '-',
        'Téléphone': decl.beneficiaireInfo?.telephone || '-'
      }));

      const csvContent = [
        Object.keys(dataToExport[0] || {}).join(','),
        ...dataToExport.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `declarations-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('Export CSV généré avec succès', 'success');
    } catch (error) {
      console.error('Erreur export CSV:', error);
      showNotification('Erreur lors de l\'export', 'error');
    }
  };

  const genererRapportPDF = async (declarationId) => {
    try {
      showNotification('Génération du PDF en cours...', 'info');
      
      // CORRECTION DU BUG : Rechercher la déclaration dans l'état local au lieu d'appeler l'API
      let declaration = declarations.find(d => d.COD_DECL === declarationId);
      
      if (!declaration) {
        // Si non trouvée dans declarations, chercher dans filteredDeclarations
        declaration = filteredDeclarations.find(d => d.COD_DECL === declarationId);
      }
      
      if (!declaration) {
        throw new Error('Déclaration non trouvée. Veuillez actualiser la page et réessayer.');
      }
      
      // Création du PDF avec jsPDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Dimensions de la page
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Couleurs
      const primaryColor = [41, 128, 185]; // Bleu AMS
      const secondaryColor = [52, 152, 219];
      const lightColor = [236, 240, 241];
      const darkColor = [44, 62, 80];
      
      // ==============================================
      // FONCTIONS AUXILIAIRES
      // ==============================================
      
      const addWatermark = () => {
        // Sauvegarde de l'état graphique
        doc.saveGraphicsState();
        
        // Définition de la transparence
        doc.setGState(new doc.GState({ opacity: 0.05 }));
        
        // Texte du filigrane
        const watermarkText = "CONFIDENTIEL";
        
        // Position et rotation du filigrane
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(60);
        doc.setFont('helvetica', 'bold');
        
        // Rotation à 45 degrés
        doc.text(watermarkText, pageWidth / 2, pageHeight / 2, {
          angle: 45,
          align: 'center',
          baseline: 'middle'
        });
        
        // Restauration de l'état graphique
        doc.restoreGraphicsState();
      };
      
      const formatDatePDF = (dateString) => {
        if (!dateString) return 'Non spécifiée';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      };
      
      // ==============================================
      // PAGE 1 : EN-TÊTE ET INFORMATIONS GÉNÉRALES
      // ==============================================
      
      // Ajout du filigrane
      addWatermark();
      
      // En-tête avec logo (à adapter selon l'emplacement de votre logo)
      // Note: En production, vous devrez charger l'image correctement
      try {
        const imgData = AMSlogo; // Utilisation de l'import du logo
        doc.addImage(imgData, 'PNG', 20, 15, 30, 15);
      } catch (error) {
        console.warn('Erreur chargement logo:', error);
        // Rectangle de remplacement si le logo ne charge pas
        doc.setFillColor(...primaryColor);
        doc.rect(20, 15, 30, 15, 'F');
        
        // Texte "LOGO" dans le rectangle
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text("LOGO", 35, 23, { align: 'center' });
      } 
      
      // Informations de l'entreprise à droite
      doc.setTextColor(...darkColor);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      const companyInfo = [
        'COURTIER D\'ASSURANCES',
        'Bonapriso Rue VASNITEX, Immeuble ATLANTIS,',
        'BP 4962 Douala – Cameroun',
        'Tel : 2 33 42 08 74 / 6 99 90 60 88'
      ];
      
      companyInfo.forEach((line, index) => {
        doc.text(line, pageWidth - 20, 18 + (index * 4), { align: 'right' });
      });
      
      // Ligne de séparation
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(20, 35, pageWidth - 20, 35);
      
      // Titre principal
      doc.setTextColor(...primaryColor);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('DÉCLARATION DE REMBOURSEMENT', pageWidth / 2, 45, { align: 'center' });
      
      // Sous-titre
      doc.setTextColor(...darkColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`N° : DECL-${declaration.COD_DECL}`, pageWidth / 2, 52, { align: 'center' });
      
      // Date de génération
      doc.setFontSize(10);
      doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 20, 52, { align: 'right' });
      
      // ==============================================
      // SECTION INFORMATIONS DE LA DÉCLARATION
      // ==============================================
      
      let yPosition = 65;
      
      // Cadre pour les informations générales
      doc.setDrawColor(...lightColor);
      doc.setFillColor(...lightColor);
      doc.roundedRect(20, yPosition, pageWidth - 40, 35, 3, 3, 'F');
      doc.setDrawColor(...darkColor);
      doc.roundedRect(20, yPosition, pageWidth - 40, 35, 3, 3, 'D');
      
      // Titre de la section
      doc.setTextColor(...primaryColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMATIONS GÉNÉRALES', 25, yPosition + 7);
      
      // Contenu des informations
      doc.setTextColor(...darkColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Colonne gauche
      doc.text(`N° Déclaration : DECL-${declaration.COD_DECL}`, 25, yPosition + 15);
      doc.text(`Date déclaration : ${declaration.dateFormatted || 'Non spécifiée'}`, 25, yPosition + 20);
      doc.text(`Statut : ${declaration.STATUT || 'Non spécifié'}`, 25, yPosition + 25);
      
      // Colonne droite
      doc.text(`Identifiant : ${declaration.IDENTIFIANT_NATIONAL || 'Non spécifié'}`, pageWidth / 2 + 10, yPosition + 15);
      doc.text(`Téléphone : ${declaration.beneficiaireInfo?.telephone || 'Non spécifié'}`, pageWidth / 2 + 10, yPosition + 20);
      doc.text(`Email : ${declaration.beneficiaireInfo?.email || 'Non spécifié'}`, pageWidth / 2 + 10, yPosition + 25);
      
      yPosition += 45;
      
      // ==============================================
      // SECTION INFORMATIONS DU BÉNÉFICIAIRE
      // ==============================================
      
      // Cadre pour les informations du bénéficiaire
      doc.setDrawColor(...lightColor);
      doc.setFillColor(...lightColor);
      doc.roundedRect(20, yPosition, pageWidth - 40, 30, 3, 3, 'F');
      doc.setDrawColor(...darkColor);
      doc.roundedRect(20, yPosition, pageWidth - 40, 30, 3, 3, 'D');
      
      // Titre de la section
      doc.setTextColor(...primaryColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMATIONS DU BÉNÉFICIAIRE', 25, yPosition + 7);
      
      // Contenu
      doc.setTextColor(...darkColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`Nom complet : ${declaration.nomComplet || 'Non spécifié'}`, 25, yPosition + 15);
      doc.text(`Profession : ${declaration.beneficiaireInfo?.profession || 'Non spécifiée'}`, 25, yPosition + 20);
      doc.text(`Pays : ${declaration.beneficiaireInfo?.pays || 'Non spécifié'}`, pageWidth / 2 + 10, yPosition + 15);
      doc.text(`Type bénéficiaire : ${declaration.beneficiaireInfo?.type_beneficiaire || 'Non spécifié'}`, pageWidth / 2 + 10, yPosition + 20);
      
      yPosition += 40;
      
      // ==============================================
      // TABLEAU DES MONTANTS
      // ==============================================
      
      // Titre de la section
      doc.setTextColor(...primaryColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DÉTAIL DES MONTANTS', 25, yPosition);
      
      yPosition += 5;
      
      // Données du tableau
      const tableData = [
        ['Description', 'Montant (XAF)'],
        ['Montant total des prestations', formatMontant(declaration.MONTANT_TOTAL)],
        ['Prise en charge', formatMontant(declaration.MONTANT_PRISE_CHARGE)],
        ['Ticket modérateur', formatMontant(declaration.MONTANT_TICKET_MODERATEUR)],
        ['Montant remboursable', formatMontant(declaration.MONTANT_REMBOURSABLE)]
      ];
      
      // Configuration du tableau
      autoTable(doc, {
        startY: yPosition,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 10,
          textColor: darkColor
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 20, right: 20 },
        styles: {
          cellPadding: 5,
          overflow: 'linebreak',
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left' },
          1: { cellWidth: 60, halign: 'right' }
        },
        didDrawPage: function(data) {
          // Position après le tableau
          yPosition = data.cursor.y + 10;
        }
      });
      
      // ==============================================
      // SECTION OBSERVATIONS ET MOTIF DE REJET
      // ==============================================
      
      if (declaration.MOTIF_REJET || declaration.OBSERVATIONS) {
        doc.setDrawColor(...lightColor);
        doc.setFillColor(255, 243, 224); // Couleur claire pour les observations
        doc.roundedRect(20, yPosition, pageWidth - 40, 25, 3, 3, 'F');
        doc.setDrawColor(230, 126, 34); // Orange
        doc.roundedRect(20, yPosition, pageWidth - 40, 25, 3, 3, 'D');
        
        // Titre
        doc.setTextColor(230, 126, 34); // Orange
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMATIONS COMPLÉMENTAIRES', 25, yPosition + 7);
        
        // Contenu
        doc.setTextColor(darkColor);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const infoText = declaration.MOTIF_REJET 
          ? `Motif de rejet : ${declaration.MOTIF_REJET}`
          : `Observations : ${declaration.OBSERVATIONS || 'Aucune'}`;
        
        // Gestion du texte long
        const maxWidth = pageWidth - 50;
        const lines = doc.splitTextToSize(infoText, maxWidth);
        doc.text(lines, 25, yPosition + 15);
        
        yPosition += 35;
      }
      
      // ==============================================
      // PIED DE PAGE ET SIGNATURES
      // ==============================================
      
      // Ligne de séparation
      doc.setDrawColor(...lightColor);
      doc.setLineWidth(0.5);
      doc.line(20, pageHeight - 40, pageWidth - 20, pageHeight - 40);
      
      // Date et lieu
      doc.setTextColor(...darkColor);
      doc.setFontSize(9);
      doc.text(`Fait à Douala, le ${new Date().toLocaleDateString('fr-FR')}`, 20, pageHeight - 30);
      
      // Espace pour les signatures
      const signatureY = pageHeight - 25;
      
      // Signature bénéficiaire
      doc.setFontSize(9);
      doc.text('Signature du bénéficiaire', 60, signatureY, { align: 'center' });
      doc.setDrawColor(...darkColor);
      doc.setLineWidth(0.3);
      doc.line(40, signatureY + 2, 80, signatureY + 2);
      
      // Signature agent
      doc.text('Signature de l\'agent', pageWidth - 60, signatureY, { align: 'center' });
      doc.line(pageWidth - 80, signatureY + 2, pageWidth - 40, signatureY + 2);
      
      // Cachet
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Cachet de l\'entreprise', pageWidth / 2, signatureY, { align: 'center' });
      doc.setDrawColor(200, 200, 200);
      doc.circle(pageWidth / 2, signatureY + 5, 15);
      
      // ==============================================
      // PAGE 2 : INFORMATIONS COMPLÉMENTAIRES (si nécessaire)
      // ==============================================
      
      // Ajout d'une deuxième page pour les détails supplémentaires si nécessaire
      if (declaration.details && declaration.details.length > 0) {
        doc.addPage();
        
        // Réinitialiser la position Y
        yPosition = 30;
        
        // Ajouter le filigrane sur la deuxième page
        addWatermark();
        
        // En-tête de la deuxième page
        doc.setTextColor(...primaryColor);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('DÉTAIL DES PRESTATIONS', pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 10;
        
        // Tableau des prestations
        const prestationsData = declaration.details.map((prestation, index) => [
          index + 1,
          prestation.LIBELLE_PRESTATION || 'Non spécifié',
          prestation.TYPE_PRESTATION || 'Non spécifié',
          formatDatePDF(prestation.DATE_PRESTATION),
          `${prestation.QUANTITE || 1}`,
          formatMontant(prestation.MONTANT || 0)
        ]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Libellé', 'Type', 'Date', 'Qté', 'Montant (XAF)']],
          body: prestationsData,
          theme: 'grid',
          headStyles: {
            fillColor: secondaryColor,
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9
          },
          bodyStyles: {
            fontSize: 9,
            textColor: darkColor
          },
          margin: { left: 20, right: 20 },
          styles: {
            cellPadding: 4,
            overflow: 'linebreak',
            halign: 'center'
          },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 60, halign: 'left' },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 },
            4: { cellWidth: 20 },
            5: { cellWidth: 30, halign: 'right' }
          }
        });
        
        // Calcul du total
        const totalPrestations = declaration.details.reduce((sum, p) => sum + (p.MONTANT || 0), 0);
        
        // Ajout du total
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total des prestations : ${formatMontant(totalPrestations)}`, 
                pageWidth - 20, doc.internal.pageSize.height - 20, 
                { align: 'right' });
      }
      
      // ==============================================
      // FINALISATION DU PDF
      // ==============================================
      
      // Ajout du numéro de page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} sur ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
      }
      
      // Sauvegarde du PDF
      const fileName = `declaration-remboursement-DECL-${declaration.COD_DECL}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      showNotification('PDF généré avec succès', 'success');
    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      showNotification(error.message || 'Erreur lors de la génération du PDF', 'error');
    }
  };

  // ==============================================
  // PRÉPARATION DES DONNÉES POUR LES GRAPHIQUES
  // ==============================================

  const getChartData = useMemo(() => {
    try {
      // Données par statut
      const statsByStatus = declarations.reduce((acc, decl) => {
        const statut = decl.STATUT || 'Soumis';
        acc[statut] = (acc[statut] || 0) + 1;
        return acc;
      }, {});

      const statusData = Object.keys(statsByStatus).map(key => ({
        name: key,
        value: statsByStatus[key],
        color: {
          'Soumis': '#2196F3',
          'Validé': '#4CAF50',
          'Rejeté': '#F44336',
          'Payé': '#9C27B0',
          'En traitement': '#FF9800'
        }[key] || '#607D8B'
      }));

      // Top 5 déclarations par montant
      const topDeclarations = [...declarations]
        .sort((a, b) => (b.MONTANT_TOTAL || 0) - (a.MONTANT_TOTAL || 0))
        .slice(0, 5)
        .map(decl => ({
          name: decl.displayId?.substring(0, 10) + '...' || 'DECL-' + decl.COD_DECL,
          montant: decl.MONTANT_TOTAL || 0,
          beneficiaire: decl.nomComplet || 'N/A'
        }));

      // Évolution par mois
      const montantsParMois = declarations.reduce((acc, decl) => {
        if (!decl.DATE_DECLARATION) return acc;
        const date = new Date(decl.DATE_DECLARATION);
        const mois = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        acc[mois] = (acc[mois] || 0) + (decl.MONTANT_TOTAL || 0);
        return acc;
      }, {});

      const evolutionData = Object.keys(montantsParMois)
        .sort()
        .slice(-6)
        .map(mois => {
          const [year, month] = mois.split('-');
          return {
            name: `${month}/${year}`,
            montant: montantsParMois[mois]
          };
        });

      // Répartition
      const repartitionData = [
        { name: 'Validé', value: dashboardStats.nbValides, color: '#4CAF50' },
        { name: 'Soumis', value: dashboardStats.nbSoumis, color: '#2196F3' },
        { name: 'Rejeté', value: dashboardStats.nbRejetes, color: '#F44336' },
        { name: 'Payé', value: Math.floor(dashboardStats.payesMois / (dashboardStats.ticketMoyen || 1)) || 0, color: '#9C27B0' }
      ].filter(item => item.value > 0);

      return {
        statusData,
        topDeclarationsData: topDeclarations,
        evolutionData,
        repartitionData
      };
    } catch (error) {
      console.error('Erreur préparation données graphiques:', error);
      return {
        statusData: [],
        topDeclarationsData: [],
        evolutionData: [],
        repartitionData: []
      };
    }
  }, [declarations, dashboardStats]);

  // ==============================================
  // RENDU DES GRAPHIQUES
  // ==============================================

  const renderChart = (type) => {
    if (!getChartData) return null;

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getChartData.statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar 
                dataKey="value" 
                name="Nombre de déclarations" 
                fill={theme.palette.primary.main}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getChartData.repartitionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                innerRadius={50}
                paddingAngle={5}
                dataKey="value"
              >
                {getChartData.repartitionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={getChartData.evolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip formatter={(value) => [`${parseFloat(value).toLocaleString('fr-FR')} XAF`, 'Montant']} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="montant" 
                name="Montant total (XAF)" 
                stroke={theme.palette.success.main} 
                fill={alpha(theme.palette.success.main, 0.3)}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  // ==============================================
  // GESTION DE LA PAGINATION
  // ==============================================

  const handleChangePage = (event, newPage) => {
    setDeclarationFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setDeclarationFilters(prev => ({ 
      ...prev, 
      rowsPerPage: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  // ==============================================
  // EFFETS
  // ==============================================

  useEffect(() => {
    refreshData();
  }, [declarationFilters.page, declarationFilters.rowsPerPage, declarationFilters.status]);

  // ==============================================
  // RENDU DE L'INTERFACE
  // ==============================================

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* En-tête */}
        <Paper 
          elevation={0} 
          sx={{ 
            bgcolor: 'primary.main',
            color: 'white',
            py: 3,
            px: 4,
            mb: 4,
            borderRadius: 0
          }}
        >
          <Container maxWidth="xl">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                  <AccountBalanceWalletIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
                  Module de Déclaration et Remboursement
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Gestion des déclarations de remboursement et suivi des paiements
                </Typography>
              </Box>
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={refreshData}
                  disabled={loading.declarations || loading.beneficiaires}
                  sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 600 }}
                >
                  Actualiser
                </Button>
              </Box>
            </Box>
            
            <Breadcrumbs sx={{ color: 'white', opacity: 0.8 }}>
              <Link underline="hover" color="inherit" href="#">
                Tableau de bord
              </Link>
              <Link underline="hover" color="inherit" href="#">
                Remboursements
              </Link>
              <Typography color="inherit">Déclarations</Typography>
            </Breadcrumbs>
          </Container>
        </Paper>

        {/* Statistiques */}
        <Container maxWidth="xl" sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Déclarations soumises"
                value={dashboardStats.nbSoumis}
                icon={DescriptionIcon}
                color="info"
                subtitle="En attente de traitement"
                trend={dashboardStats.evolutionMensuelle}
                loading={loading.declarations}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Montant à payer"
                value={formatMontant(dashboardStats.montantAPayer)}
                icon={PaymentIcon}
                color="warning"
                subtitle="Total des déclarations validées"
                loading={loading.declarations}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Payés ce mois"
                value={formatMontant(dashboardStats.payesMois)}
                icon={CheckCircleIcon}
                color="success"
                subtitle="Montant déjà remboursé"
                loading={loading.declarations}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Ticket moyen"
                value={formatMontant(dashboardStats.ticketMoyen)}
                icon={AttachMoneyIcon}
                color="primary"
                subtitle="Montant moyen par déclaration"
                loading={loading.declarations}
              />
            </Grid>
          </Grid>
        </Container>

        {/* Statistiques supplémentaires */}
        <Container maxWidth="xl" sx={{ mb: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Statistiques détaillées
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {declarations.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total déclarations
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {declarations.length > 0 ? Math.round((dashboardStats.nbValides / declarations.length) * 100) : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Taux de validation
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {formatMontant(declarations.reduce((sum, d) => sum + (d.MONTANT_TOTAL || 0), 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total déclaré
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {beneficiaires.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bénéficiaires
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Container>

        {/* Contenu principal */}
        <Container maxWidth="xl">
          <Paper 
            elevation={1} 
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              mb: 4
            }}
          >
            {/* Navigation par onglets */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
              >
                <Tab icon={<DashboardIcon />} label="Tableau de bord" />
                <Tab icon={<ReceiptLongIcon />} label="Déclarations" />
                <Tab icon={<AssessmentIcon />} label="Rapports" />
              </Tabs>
            </Box>

            <Box sx={{ p: 3 }}>
              {/* Onglet Tableau de bord */}
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography variant="h6" fontWeight="bold">
                          <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Visualisation des données
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          {['bar', 'pie', 'line'].map((type) => (
                            <Button
                              key={type}
                              variant={chartType === type ? "contained" : "outlined"}
                              size="small"
                              onClick={() => setChartType(type)}
                            >
                              {type === 'bar' && 'Barres'}
                              {type === 'pie' && 'Secteurs'}
                              {type === 'line' && 'Évolution'}
                            </Button>
                          ))}
                        </Stack>
                      </Box>
                      {declarations.length > 0 ? (
                        renderChart(chartType)
                      ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                          <CircularProgress />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                            Chargement des données...
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Onglet Déclarations */}
              {activeTab === 1 && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" fontWeight="bold">
                      <ReceiptLongIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Liste des déclarations
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={exportDeclarations}
                        disabled={filteredDeclarations.length === 0}
                      >
                        Exporter CSV
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenNewDeclarationDialog(true)}
                      >
                        Nouvelle déclaration
                      </Button>
                    </Stack>
                  </Box>

                  {/* Filtres */}
                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      <FilterListIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Filtres de recherche
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Rechercher déclaration..."
                          value={declarationFilters.search}
                          onChange={(e) => setDeclarationFilters(prev => ({ ...prev, search: e.target.value }))}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon />
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Statut</InputLabel>
                          <Select
                            value={declarationFilters.status}
                            label="Statut"
                            onChange={(e) => setDeclarationFilters(prev => ({ ...prev, status: e.target.value }))}
                          >
                            <MenuItem value="all">Tous</MenuItem>
                            <MenuItem value="Soumis">Soumis</MenuItem>
                            <MenuItem value="Validé">Validé</MenuItem>
                            <MenuItem value="Rejeté">Rejeté</MenuItem>
                            <MenuItem value="Payé">Payé</MenuItem>
                            <MenuItem value="En traitement">En traitement</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <DatePicker
                          label="Date début"
                          value={declarationFilters.dateDebut}
                          onChange={(date) => setDeclarationFilters(prev => ({ ...prev, dateDebut: date }))}
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <DatePicker
                          label="Date fin"
                          value={declarationFilters.dateFin}
                          onChange={(date) => setDeclarationFilters(prev => ({ ...prev, dateFin: date }))}
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={1}>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() => setDeclarationFilters({
                            page: 0,
                            rowsPerPage: 10,
                            status: 'all',
                            dateDebut: null,
                            dateFin: null,
                            search: '',
                            sortBy: 'DATE_DECLARATION',
                            sortOrder: 'desc'
                          })}
                        >
                          Reset
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Table des déclarations */}
                  <Paper>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>N° Déclaration</TableCell>
                            <TableCell>Bénéficiaire</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Montant total</TableCell>
                            <TableCell>Prise en charge</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {loading.declarations ? (
                            <TableRow>
                              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                <CircularProgress />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  Chargement des déclarations...
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : filteredDeclarations.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                                  Aucune déclaration trouvée
                                </Typography>
                                <Button
                                  variant="outlined"
                                  startIcon={<AddIcon />}
                                  onClick={() => setOpenNewDeclarationDialog(true)}
                                >
                                  Créer une déclaration
                                </Button>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredDeclarations
                              .slice(
                                declarationFilters.page * declarationFilters.rowsPerPage,
                                declarationFilters.page * declarationFilters.rowsPerPage + declarationFilters.rowsPerPage
                              )
                              .map((declaration) => (
                                <TableRow key={declaration.id} hover>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="600">
                                      {declaration.displayId}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="body2" fontWeight="600">
                                        {declaration.nomComplet || 'N/A'}
                                      </Typography>
                                      {declaration.IDENTIFIANT_NATIONAL && (
                                        <Typography variant="caption" color="text.secondary">
                                          {declaration.IDENTIFIANT_NATIONAL}
                                        </Typography>
                                      )}
                                      {declaration.beneficiaireInfo?.telephone && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                          📞 {declaration.beneficiaireInfo.telephone}
                                        </Typography>
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <CalendarMonthIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                                      {declaration.dateFormatted}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="600">
                                      {formatMontant(declaration.MONTANT_TOTAL)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {formatMontant(declaration.MONTANT_PRISE_CHARGE)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <StatusChip status={declaration.STATUT} />
                                      {declaration.MOTIF_REJET && (
                                        <Tooltip title={declaration.MOTIF_REJET}>
                                          <WarningIcon color="error" fontSize="small" />
                                        </Tooltip>
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Tooltip title="Voir détails">
                                        <IconButton
                                          size="small"
                                          onClick={() => {
                                            setSelectedDeclaration(declaration);
                                            setOpenDetailDialog(true);
                                          }}
                                        >
                                          <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      {declaration.STATUT === 'Validé' && (
                                        <Tooltip title="Initier paiement">
                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              setPaiementForm({
                                                COD_DECL: declaration.COD_DECL,
                                                MONTANT: declaration.MONTANT_REMBOURSABLE || declaration.MONTANT_PRISE_CHARGE,
                                                METHODE: 'MobileMoney',
                                                COD_BEN: declaration.COD_BEN,
                                                REFERENCE: `PAY-${declaration.COD_DECL}-${Date.now()}`,
                                                OBSERVATIONS: ''
                                              });
                                              setOpenPaiementDialog(true);
                                            }}
                                          >
                                            <PaymentIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      {declaration.STATUT === 'Soumis' && (
                                        <>
                                          <Tooltip title="Valider">
                                            <IconButton
                                              size="small"
                                              onClick={() => {
                                                setTraitementForm({
                                                  COD_DECL: declaration.COD_DECL,
                                                  action: 'Valider',
                                                  motif_rejet: '',
                                                  utilisateur: 'SYSTEM'
                                                });
                                                setOpenTraitementDialog(true);
                                              }}
                                            >
                                              <CheckCircleIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Rejeter">
                                            <IconButton
                                              size="small"
                                              onClick={() => {
                                                setTraitementForm({
                                                  COD_DECL: declaration.COD_DECL,
                                                  action: 'Rejeter',
                                                  motif_rejet: '',
                                                  utilisateur: 'SYSTEM'
                                                });
                                                setOpenTraitementDialog(true);
                                              }}
                                            >
                                              <ErrorIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        </>
                                      )}
                                      <Tooltip title="Générer PDF">
                                        <IconButton
                                          size="small"
                                          onClick={() => genererRapportPDF(declaration.COD_DECL)}
                                        >
                                          <PictureAsPdfIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      component="div"
                      count={filteredDeclarations.length}
                      rowsPerPage={declarationFilters.rowsPerPage}
                      page={declarationFilters.page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      labelRowsPerPage="Lignes par page:"
                    />
                  </Paper>
                </Box>
              )}

              {/* Onglet Rapports */}
              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" mb={3}>
                    <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Rapports et Statistiques
                  </Typography>
                  
                  <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} md={6}>
                      <Card sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                          Rapport Financier
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Analyse financière des déclarations et paiements
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<PictureAsPdfIcon />}
                          onClick={() => {
                            showNotification('Génération du rapport financier en cours...', 'info');
                          }}
                        >
                          Générer PDF
                        </Button>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Card sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                          Rapport d'Activité
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Activité mensuelle et statistiques de traitement
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={exportDeclarations}
                        >
                          Exporter Excel
                        </Button>
                      </Card>
                    </Grid>
                  </Grid>
                  
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Statistiques Détaillées
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Box textAlign="center" p={2}>
                          <Typography variant="h4" fontWeight="bold" color="primary.main">
                            {declarations.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total déclarations
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box textAlign="center" p={2}>
                          <Typography variant="h4" fontWeight="bold" color="success.main">
                            {declarations.length > 0 ? Math.round((dashboardStats.nbValides / declarations.length) * 100) : 0}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Taux de validation
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box textAlign="center" p={2}>
                          <Typography variant="h4" fontWeight="bold" color="warning.main">
                            {formatMontant(declarations.reduce((sum, d) => sum + (d.MONTANT_TOTAL || 0), 0))}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Montant total
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box textAlign="center" p={2}>
                          <Typography variant="h4" fontWeight="bold" color="info.main">
                            {beneficiaires.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Bénéficiaires
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              )}
            </Box>
          </Paper>
        </Container>

        {/* Dialogue Nouvelle Déclaration */}
        <DeclarationDialog
          open={openNewDeclarationDialog}
          mode="create"
          onClose={() => setOpenNewDeclarationDialog(false)}
          onSubmit={handleSubmitDeclaration}
          loading={loading.traitement}
          beneficiaires={beneficiaires}
        />

        {/* Dialogue Initier Paiement */}
        <Dialog open={openPaiementDialog} onClose={() => setOpenPaiementDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <Box display="flex" alignItems="center">
              <PaymentIcon sx={{ mr: 1 }} />
              Initier un paiement
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Numéro de déclaration"
                  value={paiementForm.COD_DECL}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Montant (XAF)"
                  type="number"
                  value={paiementForm.MONTANT}
                  onChange={(e) => setPaiementForm(prev => ({ ...prev, MONTANT: e.target.value }))}
                  fullWidth
                  size="small"
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">XAF</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Méthode de paiement</InputLabel>
                  <Select
                    value={paiementForm.METHODE}
                    label="Méthode de paiement"
                    onChange={(e) => setPaiementForm(prev => ({ ...prev, METHODE: e.target.value }))}
                  >
                    <MenuItem value="MobileMoney">Mobile Money</MenuItem>
                    <MenuItem value="Banque">Virement bancaire</MenuItem>
                    <MenuItem value="Espece">Espèce</MenuItem>
                    <MenuItem value="Cheque">Chèque</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Référence"
                  value={paiementForm.REFERENCE}
                  onChange={(e) => setPaiementForm(prev => ({ ...prev, REFERENCE: e.target.value }))}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Observations"
                  value={paiementForm.OBSERVATIONS}
                  onChange={(e) => setPaiementForm(prev => ({ ...prev, OBSERVATIONS: e.target.value }))}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info">
                  Cette action créera une transaction de paiement pour le bénéficiaire.
                </Alert>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPaiementDialog(false)}>Annuler</Button>
            <Button 
              onClick={handleInitierPaiement} 
              variant="contained" 
              color="primary"
              disabled={!paiementForm.MONTANT || loading.traitement}
            >
              {loading.traitement ? <CircularProgress size={24} /> : 'Initier le paiement'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialogue Traiter Déclaration */}
        <Dialog open={openTraitementDialog} onClose={() => setOpenTraitementDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ 
            bgcolor: traitementForm.action === 'Valider' ? 'success.main' : 'warning.main',
            color: 'white'
          }}>
            {traitementForm.action === 'Valider' ? 'Valider la déclaration' : 'Rejeter la déclaration'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {traitementForm.action === 'Rejeter' && (
                <Grid item xs={12}>
                  <TextField
                    label="Motif du rejet *"
                    value={traitementForm.motif_rejet}
                    onChange={(e) => setTraitementForm(prev => ({ ...prev, motif_rejet: e.target.value }))}
                    fullWidth
                    multiline
                    rows={3}
                    required
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Alert severity={traitementForm.action === 'Valider' ? 'success' : 'warning'}>
                  {traitementForm.action === 'Valider' 
                    ? 'Cette action marquera la déclaration comme validée et prête pour le paiement.' 
                    : 'Le bénéficiaire sera notifié du rejet de sa déclaration.'}
                </Alert>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenTraitementDialog(false)}>Annuler</Button>
            <Button 
              onClick={handleTraiterDeclaration} 
              variant="contained" 
              color={traitementForm.action === 'Valider' ? 'success' : 'error'}
              disabled={(traitementForm.action === 'Rejeter' && !traitementForm.motif_rejet.trim()) || loading.traitement}
            >
              {loading.traitement ? <CircularProgress size={24} /> : traitementForm.action}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialogue Détails Déclaration */}
        <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
            Détails de la déclaration {selectedDeclaration?.displayId}
          </DialogTitle>
          <DialogContent>
            {selectedDeclaration && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Informations générales
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Statut:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <StatusChip status={selectedDeclaration.STATUT} />
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Date déclaration:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {selectedDeclaration.dateFormatted}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Bénéficiaire:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {selectedDeclaration.nomComplet}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Identifiant:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {selectedDeclaration.IDENTIFIANT_NATIONAL || '-'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Téléphone:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {selectedDeclaration.beneficiaireInfo?.telephone || '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Montants
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Total déclaré:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="medium">
                          {formatMontant(selectedDeclaration.MONTANT_TOTAL)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Prise en charge:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {formatMontant(selectedDeclaration.MONTANT_PRISE_CHARGE)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Ticket modérateur:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {formatMontant(selectedDeclaration.MONTANT_TICKET_MODERATEUR)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold">
                          Remboursable:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          {formatMontant(selectedDeclaration.MONTANT_REMBOURSABLE)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                
                {selectedDeclaration.MOTIF_REJET && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      <Typography variant="subtitle2" fontWeight="bold">Motif du rejet:</Typography>
                      <Typography variant="body2">{selectedDeclaration.MOTIF_REJET}</Typography>
                    </Alert>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      startIcon={<PictureAsPdfIcon />}
                      onClick={() => genererRapportPDF(selectedDeclaration.COD_DECL)}
                    >
                      Générer PDF
                    </Button>
                    {selectedDeclaration.STATUT === 'Validé' && (
                      <Button
                        variant="contained"
                        startIcon={<PaymentIcon />}
                        onClick={() => {
                          setPaiementForm({
                            COD_DECL: selectedDeclaration.COD_DECL,
                            MONTANT: selectedDeclaration.MONTANT_REMBOURSABLE || selectedDeclaration.MONTANT_PRISE_CHARGE,
                            METHODE: 'MobileMoney',
                            COD_BEN: selectedDeclaration.COD_BEN,
                            REFERENCE: `PAY-${selectedDeclaration.COD_DECL}-${Date.now()}`,
                            OBSERVATIONS: ''
                          });
                          setOpenDetailDialog(false);
                          setOpenPaiementDialog(true);
                        }}
                      >
                        Initier paiement
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDetailDialog(false)}>
              Fermer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notifications */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>

        {/* Barre de chargement globale */}
        <LinearProgress 
          sx={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            visibility: (loading.declarations || loading.beneficiaires || loading.traitement) ? 'visible' : 'hidden'
          }} 
        />
      </Box>
    </LocalizationProvider>
  );
};

export default FinancialSettlementModule;