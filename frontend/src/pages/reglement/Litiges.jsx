// src/pages/LitigesPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Tooltip,
  CircularProgress,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Divider,
  Avatar,
  Stack,
  LinearProgress,
  Breadcrumbs,
  Link,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Chat as ChatIcon,
  AttachFile as AttachFileIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  ViewList as ViewListIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  LocalHospital as HospitalIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import de l'API
import api, { facturationAPI } from '../../services/api';

// Composant pour les statistiques des litiges
const LitigesStats = ({ stats, loading }) => {
  const theme = useTheme();
  
  const statCards = [
    {
      title: 'Total Litiges',
      value: stats?.total || 0,
      color: theme.palette.primary.main,
      icon: <WarningIcon />,
      subText: stats?.evolution ? `Évolution: ${stats.evolution}%` : 'Total actuel'
    },
    {
      title: 'En Attente',
      value: stats?.enAttente || 0,
      color: theme.palette.warning.main,
      icon: <PendingIcon />,
      subText: stats?.pourcentageAttente ? `${stats.pourcentageAttente}% du total` : 'À traiter'
    },
    {
      title: 'Résolus',
      value: stats?.resolus || 0,
      color: theme.palette.success.main,
      icon: <CheckCircleIcon />,
      subText: stats?.tauxResolution ? `${stats.tauxResolution}% de résolution` : 'Clôturés'
    },
    {
      title: 'Montant Impacté',
      value: stats?.montantImpacte ? 
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stats.montantImpacte) : 
        '0 FCFA',
      color: theme.palette.error.main,
      icon: <AttachFileIcon />,
      subText: 'Total en litige'
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card 
            elevation={2}
            sx={{
              borderRadius: 2,
              borderLeft: `4px solid ${card.color}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <CardContent>
              {loading ? (
                <Box display="flex" alignItems="center" justifyContent="center" height={120}>
                  <CircularProgress size={40} />
                </Box>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {card.value}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {card.subText}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: `${card.color}15`,
                      color: card.color,
                      width: 48,
                      height: 48
                    }}
                  >
                    {card.icon}
                  </Avatar>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Composant pour les filtres
const FiltresLitiges = ({ filters, onFilterChange, onExport }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const statuts = [
    { value: 'tous', label: 'Tous les statuts' },
    { value: 'nouveau', label: 'Nouveau' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'resolu', label: 'Résolu' },
    { value: 'ferme', label: 'Fermé' }
  ];

  const types = [
    { value: 'tous', label: 'Tous les types' },
    { value: 'facturation', label: 'Facturation' },
    { value: 'paiement', label: 'Paiement' },
    { value: 'remboursement', label: 'Remboursement' },
    { value: 'prestation', label: 'Prestation' },
    { value: 'documentation', label: 'Documentation' }
  ];

  const handleChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      statut: 'tous',
      type: 'tous',
      dateDebut: null,
      dateFin: null,
      montantMin: '',
      montantMax: ''
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Filtres de recherche
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            size="small"
            onClick={() => setShowAdvanced(!showAdvanced)}
            startIcon={<FilterIcon />}
            sx={{ mr: 1 }}
          >
            {showAdvanced ? 'Filtres simples' : 'Filtres avancés'}
          </Button>
          <Button
            size="small"
            onClick={handleReset}
            startIcon={<RefreshIcon />}
          >
            Réinitialiser
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Rechercher..."
            value={localFilters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Référence, client, facture..."
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
            size="small"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Statut</InputLabel>
            <Select
              value={localFilters.statut}
              label="Statut"
              onChange={(e) => handleChange('statut', e.target.value)}
            >
              {statuts.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Chip
                    label={option.label}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      mr: 1,
                      bgcolor: option.value === 'nouveau' ? 'warning.light' :
                               option.value === 'en_cours' ? 'info.light' :
                               option.value === 'resolu' ? 'success.light' :
                               option.value === 'ferme' ? 'grey.300' : 'transparent'
                    }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select
              value={localFilters.type}
              label="Type"
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {types.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {showAdvanced && (
          <>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
                <DatePicker
                  label="Date début"
                  value={localFilters.dateDebut}
                  onChange={(date) => handleChange('dateDebut', date)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
                <DatePicker
                  label="Date fin"
                  value={localFilters.dateFin}
                  onChange={(date) => handleChange('dateFin', date)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Montant minimum (FCFA)"
                type="number"
                value={localFilters.montantMin}
                onChange={(e) => handleChange('montantMin', e.target.value)}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">FCFA</Typography>
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Montant maximum (FCFA)"
                type="number"
                value={localFilters.montantMax}
                onChange={(e) => handleChange('montantMax', e.target.value)}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="caption">FCFA</Typography>
                }}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Paper>
  );
};

// Composant pour une ligne de litige
const LitigeRow = ({ litige, onResolve, onViewDetails }) => {
  const theme = useTheme();

  const getStatutColor = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'nouveau': return 'warning';
      case 'en_cours': return 'info';
      case 'resolu': return 'success';
      case 'ferme': return 'default';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'facturation': return <ReceiptIcon />;
      case 'paiement': return <AttachFileIcon />;
      case 'remboursement': return <WarningIcon />;
      case 'prestation': return <HospitalIcon />;
      default: return <WarningIcon />;
    }
  };

  const formatMontant = (montant) => {
    if (!montant) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(montant);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  return (
    <TableRow hover>
      <TableCell>
        <Box display="flex" alignItems="center">
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
              mr: 2,
              width: 32,
              height: 32
            }}
          >
            {getTypeIcon(litige.type)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {litige.reference || litige.id}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {litige.type}
            </Typography>
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {litige.clientNom || litige.patientNom || 'Non spécifié'}
        </Typography>
        {litige.clientId && (
          <Typography variant="caption" color="textSecondary">
            ID: {litige.clientId}
          </Typography>
        )}
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {litige.factureNumero || litige.consultationId || '-'}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2" fontWeight="bold">
          {formatMontant(litige.montant)}
        </Typography>
      </TableCell>

      <TableCell>
        <Chip
          label={litige.statut}
          size="small"
          color={getStatutColor(litige.statut)}
          sx={{ fontWeight: 'medium' }}
        />
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {formatDate(litige.dateCreation)}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Voir détails">
            <IconButton
              size="small"
              onClick={() => onViewDetails(litige)}
              color="primary"
            >
              <ChatIcon />
            </IconButton>
          </Tooltip>
          
          {litige.statut?.toLowerCase() !== 'resolu' && litige.statut?.toLowerCase() !== 'ferme' && (
            <Tooltip title="Résoudre">
              <IconButton
                size="small"
                onClick={() => onResolve(litige)}
                color="success"
              >
                <CheckCircleIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// Modal pour les détails d'un litige
const DetailLitigeModal = ({ open, litige, onClose, onResolve }) => {
  const theme = useTheme();

  const getStatutColor = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'nouveau': return 'warning';
      case 'en_cours': return 'info';
      case 'resolu': return 'success';
      case 'ferme': return 'default';
      default: return 'default';
    }
  };

  const formatMontant = (montant) => {
    if (!montant) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(montant);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  if (!litige) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            <WarningIcon />
          </Avatar>
          <Box>
            <Typography variant="h6">Détails du litige</Typography>
            <Typography variant="caption" color="textSecondary">
              Référence: {litige.reference || litige.id}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Informations générales
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Type
                </Typography>
                <Typography variant="body2">{litige.type}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Statut
                </Typography>
                <Typography variant="body2">
                  <Chip
                    label={litige.statut}
                    size="small"
                    color={getStatutColor(litige.statut)}
                  />
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Date création
                </Typography>
                <Typography variant="body2">
                  {formatDate(litige.dateCreation)}
                </Typography>
              </Box>
              {litige.dateResolution && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Date résolution
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(litige.dateResolution)}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Informations financières
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Montant
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatMontant(litige.montant)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Client/Bénéficiaire
                </Typography>
                <Typography variant="body2">
                  {litige.clientNom || litige.patientNom || 'Non spécifié'}
                </Typography>
                {litige.clientId && (
                  <Typography variant="caption" color="textSecondary">
                    ID: {litige.clientId}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Facture/Consultation
                </Typography>
                <Typography variant="body2">
                  {litige.factureNumero || litige.consultationId || '-'}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Description
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
              <Typography variant="body2">
                {litige.description || 'Aucune description disponible'}
              </Typography>
            </Paper>
          </Grid>

          {litige.commentaires && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Commentaires
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                  {litige.commentaires}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
        {litige.statut?.toLowerCase() !== 'resolu' && litige.statut?.toLowerCase() !== 'ferme' && (
          <Button
            variant="contained"
            onClick={() => {
              onClose();
              onResolve(litige);
            }}
            startIcon={<CheckCircleIcon />}
          >
            Résoudre ce litige
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// Modal pour résoudre un litige
const ResoudreLitigeModal = ({ open, litige, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    resolution: '',
    commentaire: '',
    montantAjuste: litige?.montant || '',
    dateResolution: new Date()
  });

  const handleSubmit = async () => {
    if (!formData.resolution.trim()) {
      alert('Veuillez saisir une résolution');
      return;
    }

    setLoading(true);
    try {
      const response = await facturationAPI.resoudreLitige(litige.id, {
        resolution: formData.resolution,
        commentaire: formData.commentaire,
        montantAjuste: formData.montantAjuste ? parseFloat(formData.montantAjuste) : null,
        dateResolution: formData.dateResolution,
        statut: 'resolu'
      });

      if (response.success) {
        alert('Litige résolu avec succès !');
        onSuccess();
        onClose();
      } else {
        alert(`Erreur: ${response.message}`);
      }
    } catch (error) {
      console.error('Erreur résolution litige:', error);
      alert('Erreur lors de la résolution du litige');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CheckCircleIcon color="primary" />
          <Typography variant="h6">Résoudre le litige</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {litige && (
          <Box mb={2}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Référence: {litige.reference || litige.id}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {litige.description}
            </Typography>
          </Box>
        )}

        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Décision/Résolution *"
            multiline
            rows={3}
            value={formData.resolution}
            onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
            placeholder="Décrivez la décision prise, les mesures correctives..."
          />

          <TextField
            fullWidth
            label="Commentaires additionnels"
            multiline
            rows={2}
            value={formData.commentaire}
            onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
            placeholder="Ajoutez des commentaires pour l'historique..."
          />

          <TextField
            fullWidth
            label="Montant ajusté (FCFA)"
            type="number"
            value={formData.montantAjuste}
            onChange={(e) => setFormData({ ...formData, montantAjuste: e.target.value })}
            InputProps={{
              endAdornment: <Typography variant="caption">FCFA</Typography>
            }}
            helperText="Laissez vide pour conserver le montant initial"
          />

          <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
            <DatePicker
              label="Date de résolution"
              value={formData.dateResolution}
              onChange={(date) => setFormData({ ...formData, dateResolution: date })}
              renderInput={(params) => (
                <TextField {...params} fullWidth />
              )}
            />
          </LocalizationProvider>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.resolution.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
        >
          {loading ? 'Traitement...' : 'Valider la résolution'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Composant principal de la page des litiges
const LitigesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // États
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [litiges, setLitiges] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    statut: 'tous',
    type: 'tous',
    dateDebut: null,
    dateFin: null,
    montantMin: '',
    montantMax: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    total: 0
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'dateCreation',
    direction: 'desc'
  });
  const [selectedLitige, setSelectedLitige] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('liste');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  // Charger les litiges
  const fetchLitiges = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Construire les paramètres de requête
      const params = {};
      
      if (filters.search) {
        params.search = filters.search;
      }
      
      if (filters.statut && filters.statut !== 'tous') {
        params.statut = filters.statut;
      }
      
      if (filters.type && filters.type !== 'tous') {
        params.type = filters.type;
      }
      
      if (filters.dateDebut) {
        params.dateDebut = format(filters.dateDebut, 'yyyy-MM-dd');
      }
      
      if (filters.dateFin) {
        params.dateFin = format(filters.dateFin, 'yyyy-MM-dd');
      }
      
      if (filters.montantMin) {
        params.montantMin = parseFloat(filters.montantMin);
      }
      
      if (filters.montantMax) {
        params.montantMax = parseFloat(filters.montantMax);
      }
      
      // Ajouter la pagination
      params.page = pagination.page + 1;
      params.limit = pagination.rowsPerPage;
      
      console.log('🔍 Chargement litiges avec params:', params);
      
      const response = await facturationAPI.getLitiges(params);
      
      console.log('📊 Réponse API litiges:', response);
      
      if (response.success) {
        setLitiges(response.litiges || []);
        setStats(response.statistiques || {});
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || response.litiges?.length || 0
        }));
      } else {
        setError(response.message || 'Erreur lors du chargement des litiges');
      }
    } catch (error) {
      console.error('❌ Erreur chargement litiges:', error);
      setError('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
      
      // Données de démonstration en cas d'erreur
      setLitiges(getDemoLitiges());
      setStats(getDemoStats());
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.rowsPerPage]);

  // Charger les statistiques
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      // Utiliser l'endpoint des statistiques des litiges
      const response = await facturationAPI.getLitigesStats('mois');
      
      if (response.success) {
        setStats(prev => ({
          ...prev,
          ...response.stats
        }));
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      // Utiliser les stats des litiges chargés
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Données de démonstration (fallback)
  const getDemoLitiges = () => {
    return [
      {
        id: 'LIT-2024-001',
        reference: 'LIT-2024-001',
        type: 'facturation',
        statut: 'nouveau',
        description: 'Facture incorrecte pour consultation cardiologie',
        montant: 75000,
        clientNom: 'Jean Dupont',
        clientId: 'PAT-00123',
        factureNumero: 'FAC-2024-0456',
        dateCreation: subDays(new Date(), 2).toISOString(),
        dateResolution: null
      },
      {
        id: 'LIT-2024-002',
        reference: 'LIT-2024-002',
        type: 'paiement',
        statut: 'en_cours',
        description: 'Paiement en double détecté',
        montant: 45000,
        clientNom: 'Marie Martin',
        clientId: 'PAT-00234',
        factureNumero: 'FAC-2024-0457',
        dateCreation: subDays(new Date(), 5).toISOString(),
        dateResolution: null,
        commentaires: 'En attente de validation du service financier'
      },
      {
        id: 'LIT-2024-003',
        reference: 'LIT-2024-003',
        type: 'remboursement',
        statut: 'resolu',
        description: 'Remboursement non reçu',
        montant: 120000,
        clientNom: 'Pierre Dubois',
        clientId: 'PAT-00345',
        factureNumero: 'FAC-2024-0389',
        dateCreation: subDays(new Date(), 10).toISOString(),
        dateResolution: subDays(new Date(), 1).toISOString(),
        commentaires: 'Remboursement effectué le 15/01/2024'
      }
    ];
  };

  const getDemoStats = () => {
    return {
      total: 3,
      enAttente: 1,
      enCours: 1,
      resolus: 1,
      montantImpacte: 240000,
      evolution: 15.5,
      tauxResolution: 33.3
    };
  };

  // Effet pour charger les données
  useEffect(() => {
    fetchLitiges();
    fetchStats();
  }, [fetchLitiges, fetchStats]);

  // Gestion du tri
  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Gestion de la pagination
  const handleChangePage = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination(prev => ({
      ...prev,
      rowsPerPage: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  // Filtrage et tri des litiges côté client
  const filteredLitiges = useMemo(() => {
    let filtered = [...litiges];

    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(litige =>
        (litige.reference?.toLowerCase().includes(searchLower) ||
         litige.clientNom?.toLowerCase().includes(searchLower) ||
         litige.description?.toLowerCase().includes(searchLower) ||
         litige.factureNumero?.toLowerCase().includes(searchLower))
      );
    }

    // Filtre par statut
    if (filters.statut && filters.statut !== 'tous') {
      filtered = filtered.filter(litige =>
        litige.statut?.toLowerCase() === filters.statut.toLowerCase()
      );
    }

    // Filtre par type
    if (filters.type && filters.type !== 'tous') {
      filtered = filtered.filter(litige =>
        litige.type?.toLowerCase() === filters.type.toLowerCase()
      );
    }

    // Filtre par date
    if (filters.dateDebut) {
      const startDate = new Date(filters.dateDebut);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(litige => {
        if (!litige.dateCreation) return false;
        const litigeDate = new Date(litige.dateCreation);
        return litigeDate >= startDate;
      });
    }

    if (filters.dateFin) {
      const endDate = new Date(filters.dateFin);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(litige => {
        if (!litige.dateCreation) return false;
        const litigeDate = new Date(litige.dateCreation);
        return litigeDate <= endDate;
      });
    }

    // Filtre par montant
    if (filters.montantMin) {
      filtered = filtered.filter(litige =>
        (litige.montant || 0) >= parseFloat(filters.montantMin)
      );
    }

    if (filters.montantMax) {
      filtered = filtered.filter(litige =>
        (litige.montant || 0) <= parseFloat(filters.montantMax)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.field];
      let bValue = b[sortConfig.field];

      // Gestion des dates
      if (sortConfig.field.includes('date')) {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      // Gestion des valeurs nulles
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [litiges, filters, sortConfig]);

  // Gestion de la résolution
  const handleResolveLitige = (litige) => {
    setSelectedLitige(litige);
    setResolveModalOpen(true);
  };

  const handleResolveSuccess = () => {
    fetchLitiges(); // Recharger les données
    fetchStats(); // Recharger les statistiques
  };

  // Gestion des détails
  const handleViewDetails = (litige) => {
    setSelectedLitige(litige);
    setDetailModalOpen(true);
  };

  // Export des données
  const handleExport = async () => {
    setExporting(true);
    try {
      const headers = ['Référence', 'Type', 'Statut', 'Description', 'Montant', 'Client', 'Facture', 'Date création', 'Date résolution'];
      const csvContent = [
        headers.join(';'),
        ...filteredLitiges.map(litige => [
          litige.reference,
          litige.type,
          litige.statut,
          `"${litige.description?.replace(/"/g, '""')}"`,
          litige.montant,
          litige.clientNom,
          litige.factureNumero,
          litige.dateCreation ? format(parseISO(litige.dateCreation), 'dd/MM/yyyy HH:mm') : '',
          litige.dateResolution ? format(parseISO(litige.dateResolution), 'dd/MM/yyyy HH:mm') : ''
        ].join(';'))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `litiges_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('Export terminé avec succès !');
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} locale={fr}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Fil d'Ariane */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link color="inherit" href="/" sx={{ display: 'flex', alignItems: 'center' }}>
            <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
            Accueil
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 0.5 }} fontSize="small" />
            Gestion des Litiges
          </Typography>
        </Breadcrumbs>

        {/* En-tête */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Gestion des Litiges
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Suivi et résolution des litiges financiers et administratifs
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                disabled={exporting || loading}
              >
                {exporting ? 'Export...' : 'Exporter CSV'}
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  fetchLitiges();
                  fetchStats();
                }}
                disabled={loading}
              >
                Actualiser
              </Button>
            </Box>
          </Box>

          {/* Sélecteur de vue */}
          <Paper elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
            <Tabs
              value={viewMode}
              onChange={(e, newValue) => setViewMode(newValue)}
              variant="fullWidth"
            >
              <Tab
                value="liste"
                label="Liste des litiges"
                icon={<ViewListIcon />}
                iconPosition="start"
              />
              <Tab
                value="stats"
                label="Tableau de bord"
                icon={<BarChartIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Paper>
        </Box>

        {/* Affichage des erreurs */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Erreur</AlertTitle>
            {error}
          </Alert>
        )}

        {/* Statistiques */}
        {viewMode === 'liste' && (
          <LitigesStats stats={stats} loading={loadingStats} />
        )}

        {/* Filtres */}
        <FiltresLitiges 
          filters={filters} 
          onFilterChange={setFilters}
          onExport={handleExport}
        />

        {/* Tableau des litiges */}
        {viewMode === 'liste' && (
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Chargement des litiges...</Typography>
              </Box>
            ) : error ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Alert severity="warning">
                  <AlertTitle>Mode démonstration</AlertTitle>
                  Affichage des données de démonstration. Les données réelles seront chargées lorsque le serveur sera disponible.
                </Alert>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sortDirection={sortConfig.field === 'reference' ? sortConfig.direction : false}>
                          <TableSortLabel
                            active={sortConfig.field === 'reference'}
                            direction={sortConfig.field === 'reference' ? sortConfig.direction : 'asc'}
                            onClick={() => handleSort('reference')}
                          >
                            Référence
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Client</TableCell>
                        <TableCell>Facture/Consultation</TableCell>
                        <TableCell sortDirection={sortConfig.field === 'montant' ? sortConfig.direction : false}>
                          <TableSortLabel
                            active={sortConfig.field === 'montant'}
                            direction={sortConfig.field === 'montant' ? sortConfig.direction : 'asc'}
                            onClick={() => handleSort('montant')}
                          >
                            Montant
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell sortDirection={sortConfig.field === 'dateCreation' ? sortConfig.direction : false}>
                          <TableSortLabel
                            active={sortConfig.field === 'dateCreation'}
                            direction={sortConfig.field === 'dateCreation' ? sortConfig.direction : 'asc'}
                            onClick={() => handleSort('dateCreation')}
                          >
                            Date création
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredLitiges.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <WarningIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="textSecondary">
                              Aucun litige trouvé
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Aucun litige ne correspond à vos critères de recherche
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLitiges
                          .slice(
                            pagination.page * pagination.rowsPerPage,
                            pagination.page * pagination.rowsPerPage + pagination.rowsPerPage
                          )
                          .map((litige, index) => (
                            <LitigeRow
                              key={litige.id || index}
                              litige={litige}
                              onResolve={handleResolveLitige}
                              onViewDetails={handleViewDetails}
                            />
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={filteredLitiges.length}
                  page={pagination.page}
                  onPageChange={handleChangePage}
                  rowsPerPage={pagination.rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Lignes par page:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} sur ${count}`
                  }
                />
              </>
            )}
          </Paper>
        )}

        {/* Vue tableau de bord */}
        {viewMode === 'stats' && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Statistiques détaillées
                </Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <AlertTitle>En développement</AlertTitle>
                  Les graphiques et analyses avancés seront disponibles dans une prochaine version.
                </Alert>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Modal des détails */}
        <DetailLitigeModal
          open={detailModalOpen}
          litige={selectedLitige}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedLitige(null);
          }}
          onResolve={handleResolveLitige}
        />

        {/* Modal de résolution */}
        {selectedLitige && (
          <ResoudreLitigeModal
            open={resolveModalOpen}
            litige={selectedLitige}
            onClose={() => {
              setResolveModalOpen(false);
              setSelectedLitige(null);
            }}
            onSuccess={handleResolveSuccess}
          />
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default LitigesPage;