// src/pages/EvaluationPrestataires.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  Avatar,
  Divider,
  LinearProgress,
  CardHeader,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { prestatairesAPI, consultationsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

// Composant pour les indicateurs d'évaluation
const IndicateurEvaluation = ({ label, valeur, max = 5, couleur = 'primary' }) => {
  const pourcentage = (valeur / max) * 100;
  
  const getColor = (percent) => {
    if (percent >= 80) return '#4caf50';
    if (percent >= 60) return '#ff9800';
    return '#f44336';
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          {valeur.toFixed(1)}/{max}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pourcentage}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'action.disabled',
          '& .MuiLinearProgress-bar': {
            backgroundColor: getColor(pourcentage),
            borderRadius: 4
          }
        }}
      />
    </Box>
  );
};

// Composant de carte de prestataire
const CartePrestataire = ({ prestataire, onView, onEvaluate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getStatusColor = (status) => {
    switch (status) {
      case 'Actif': return 'success';
      case 'Inactif': return 'error';
      case 'En congés': return 'warning';
      case 'En formation': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Actif': return <CheckCircleIcon fontSize="small" />;
      case 'Inactif': return <CancelIcon fontSize="small" />;
      case 'En congés': return <WarningIcon fontSize="small" />;
      case 'En formation': return <WarningIcon fontSize="small" />;
      default: return null;
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8]
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 56,
              height: 56,
              mr: 2
            }}
          >
            {prestataire.prenom?.charAt(0)}{prestataire.nom?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {prestataire.titre ? `${prestataire.titre} ` : ''}{prestataire.prenom} {prestataire.nom}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {prestataire.specialite || 'Spécialité non définie'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip
            label={prestataire.status || 'Inactif'}
            size="small"
            color={getStatusColor(prestataire.status)}
            icon={getStatusIcon(prestataire.status)}
            sx={{ mb: 1 }}
          />
          {prestataire.disponibilite && (
            <Chip
              label={prestataire.disponibilite}
              size="small"
              variant="outlined"
              sx={{ ml: 1 }}
            />
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <PhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              {prestataire.telephone || 'Non renseigné'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              {prestataire.email || 'Non renseigné'}
            </Typography>
          </Stack>
        </Box>

        {/* Indicateurs d'évaluation */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Évaluation
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating
              value={prestataire.note_moyenne || 0}
              precision={0.5}
              readOnly
              size="small"
            />
            <Typography variant="body2" sx={{ ml: 1 }}>
              ({prestataire.nb_evaluations || 0} avis)
            </Typography>
          </Box>
          
          {prestataire.indicateurs && (
            <>
              <IndicateurEvaluation 
                label="Qualité des soins" 
                valeur={prestataire.indicateurs.qualite_soins || 0} 
              />
              <IndicateurEvaluation 
                label="Ponctualité" 
                valeur={prestataire.indicateurs.ponctualite || 0} 
              />
              <IndicateurEvaluation 
                label="Communication" 
                valeur={prestataire.indicateurs.communication || 0} 
              />
            </>
          )}
        </Box>

        {/* Statistiques */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary" align="center">
                Consultations
              </Typography>
              <Typography variant="h6" align="center" fontWeight="bold">
                {prestataire.stats?.consultations_mois || 0}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary" align="center">
                Satisfaction
              </Typography>
              <Typography variant="h6" align="center" fontWeight="bold" color="primary">
                {prestataire.stats?.taux_satisfaction || 0}%
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>

      <Box sx={{ p: 2, pt: 0 }}>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={() => onView(prestataire.id)}
            >
              Détails
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              size="small"
              startIcon={<StarIcon />}
              onClick={() => onEvaluate(prestataire.id)}
            >
              Évaluer
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
};

// Composant de modal d'évaluation
const ModalEvaluation = ({ open, onClose, prestataireId, onEvaluate }) => {
  const [evaluation, setEvaluation] = useState({
    note: 0,
    qualite_soins: 0,
    ponctualite: 0,
    communication: 0,
    commentaire: '',
    anonyme: false
  });
  const [loading, setLoading] = useState(false);
  const [prestataire, setPrestataire] = useState(null);

  useEffect(() => {
    if (prestataireId && open) {
      chargerPrestataire();
    }
  }, [prestataireId, open]);

  const chargerPrestataire = async () => {
    try {
      const response = await prestatairesAPI.getById(prestataireId);
      if (response.success) {
        setPrestataire(response.prestataire);
      }
    } catch (error) {
      console.error('Erreur chargement prestataire:', error);
    }
  };

  const handleSubmit = async () => {
    if (!evaluation.note) {
      alert('Veuillez donner une note globale');
      return;
    }

    setLoading(true);
    try {
      // Simulation d'envoi d'évaluation
      // À adapter avec votre API réelle d'évaluation
      console.log('Évaluation soumise:', {
        prestataireId,
        evaluation
      });

      // Mise à jour locale
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onEvaluate(evaluation);
      onClose();
      
      alert('Évaluation enregistrée avec succès');
    } catch (error) {
      console.error('Erreur enregistrement évaluation:', error);
      alert('Erreur lors de l\'enregistrement de l\'évaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setEvaluation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Évaluer le prestataire
        {prestataire && (
          <Typography variant="body2" color="text.secondary">
            {prestataire.titre ? `${prestataire.titre} ` : ''}{prestataire.prenom} {prestataire.nom} - {prestataire.specialite || 'Spécialité non définie'}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Note globale */}
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>Note globale</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Rating
                value={evaluation.note}
                onChange={(event, newValue) => handleChange('note', newValue)}
                precision={0.5}
                size="large"
              />
              <Typography variant="body1" sx={{ ml: 2 }}>
                {evaluation.note}/5
              </Typography>
            </Box>
          </Box>

          {/* Critères détaillés */}
          <Typography gutterBottom sx={{ mb: 2 }}>Critères détaillés</Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Qualité des soins
            </Typography>
            <Rating
              value={evaluation.qualite_soins}
              onChange={(event, newValue) => handleChange('qualite_soins', newValue)}
              precision={0.5}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Ponctualité
            </Typography>
            <Rating
              value={evaluation.ponctualite}
              onChange={(event, newValue) => handleChange('ponctualite', newValue)}
              precision={0.5}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Communication
            </Typography>
            <Rating
              value={evaluation.communication}
              onChange={(event, newValue) => handleChange('communication', newValue)}
              precision={0.5}
            />
          </Box>

          {/* Commentaire */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Commentaire (optionnel)"
            value={evaluation.commentaire}
            onChange={(e) => handleChange('commentaire', e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Option anonyme */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="anonyme"
              checked={evaluation.anonyme}
              onChange={(e) => handleChange('anonyme', e.target.checked)}
              style={{ marginRight: 8 }}
            />
            <label htmlFor="anonyme">
              <Typography variant="body2">
                Publier cette évaluation de manière anonyme
              </Typography>
            </label>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Enregistrement...' : 'Envoyer l\'évaluation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Page principale d'évaluation des prestataires
const EvaluationPrestataires = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // États
  const [loading, setLoading] = useState(true);
  const [prestataires, setPrestataires] = useState([]);
  const [tousPrestatairesFiltres, setTousPrestatairesFiltres] = useState([]);
  const [filtres, setFiltres] = useState({
    search: '',
    specialite: '',
    status: '',
    disponibilite: '',
    noteMin: 0,
    noteMax: 5,
    dateDebut: null,
    dateFin: null,
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPrestataire, setSelectedPrestataire] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [specialites, setSpecialites] = useState([]);
  const [showFiltresAvances, setShowFiltresAvances] = useState(false);

  // Fonction pour charger les données depuis l'API
  const chargerDonnees = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Récupérer les prestataires avec les filtresAPI (sans pagination côté serveur)
      const paramsAPI = {
        search: filtres.search,
        specialite: filtres.specialite,
        status: filtres.status,
        limit: 1000 // limite élevée pour tout récupérer
      };

      const response = await prestatairesAPI.getAll(paramsAPI);
      
      if (response.success && response.prestataires) {
        // Ajouter les données d'évaluation simulées (à remplacer par des données réelles de l'API)
        const prestatairesAvecEvaluation = response.prestataires.map(prestataire => {
          // Si le prestataire a déjà des données d'évaluation, les utiliser
          const noteMoyenne = prestataire.note_moyenne || Math.random() * 5;
          const nbEvaluations = prestataire.nb_evaluations || Math.floor(Math.random() * 100);
          
          return {
            ...prestataire,
            note_moyenne: noteMoyenne,
            nb_evaluations: nbEvaluations,
            indicateurs: prestataire.indicateurs || {
              qualite_soins: Math.random() * 5,
              ponctualite: Math.random() * 5,
              communication: Math.random() * 5
            },
            stats: prestataire.stats || {
              consultations_mois: Math.floor(Math.random() * 100),
              taux_satisfaction: Math.random() * 100
            }
          };
        });

        // 2. Appliquer les filtres frontend
        let prestatairesFiltres = prestatairesAvecEvaluation;

        // Filtre par note minimale
        if (filtres.noteMin) {
          prestatairesFiltres = prestatairesFiltres.filter(p => 
            p.note_moyenne >= filtres.noteMin
          );
        }

        // Filtre par note maximale
        if (filtres.noteMax && filtres.noteMax < 5) {
          prestatairesFiltres = prestatairesFiltres.filter(p => 
            p.note_moyenne <= filtres.noteMax
          );
        }

        // Filtre par disponibilité
        if (filtres.disponibilite) {
          prestatairesFiltres = prestatairesFiltres.filter(p => 
            p.disponibilite === filtres.disponibilite
          );
        }

        // 3. Pagination
        const startIndex = (filtres.page - 1) * filtres.limit;
        const endIndex = startIndex + filtres.limit;
        const prestatairesPagine = prestatairesFiltres.slice(startIndex, endIndex);

        // 4. Mettre à jour les états
        setTousPrestatairesFiltres(prestatairesFiltres);
        setPrestataires(prestatairesPagine);
        setPagination({
          total: prestatairesFiltres.length,
          page: filtres.page,
          limit: filtres.limit,
          totalPages: Math.ceil(prestatairesFiltres.length / filtres.limit)
        });
      } else {
        setPrestataires([]);
        setTousPrestatairesFiltres([]);
        setPagination({
          total: 0,
          page: 1,
          limit: 12,
          totalPages: 0
        });
      }

      // 5. Charger les spécialités
      const specialitesResponse = await prestatairesAPI.getSpecialites();
      if (specialitesResponse.success) {
        setSpecialites(specialitesResponse.specialites || []);
      }

    } catch (error) {
      console.error('Erreur chargement données:', error);
      setPrestataires([]);
      setTousPrestatairesFiltres([]);
    } finally {
      setLoading(false);
    }
  }, [filtres]);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  const handleSearchChange = (event) => {
    setFiltres(prev => ({
      ...prev,
      search: event.target.value,
      page: 1
    }));
  };

  const handleFiltreChange = (field, value) => {
    setFiltres(prev => ({
      ...prev,
      [field]: value,
      page: 1
    }));
  };

  const handleViewDetails = (id) => {
    navigate(`/prestataires/${id}`);
  };

  const handleEvaluate = (id) => {
    setSelectedPrestataire(id);
    setModalOpen(true);
  };

  const handleEvaluationSubmit = (evaluation) => {
    // Mettre à jour localement les données du prestataire
    setPrestataires(prev => prev.map(p => {
      if (p.id === selectedPrestataire) {
        const newNbEval = (p.nb_evaluations || 0) + 1;
        const newNote = ((p.note_moyenne || 0) * (newNbEval - 1) + evaluation.note) / newNbEval;
        
        return {
          ...p,
          note_moyenne: newNote,
          nb_evaluations: newNbEval,
          indicateurs: {
            qualite_soins: evaluation.qualite_soins,
            ponctualite: evaluation.ponctualite,
            communication: evaluation.communication
          }
        };
      }
      return p;
    }));

    // Mettre à jour aussi tousPrestatairesFiltres
    setTousPrestatairesFiltres(prev => prev.map(p => {
      if (p.id === selectedPrestataire) {
        const newNbEval = (p.nb_evaluations || 0) + 1;
        const newNote = ((p.note_moyenne || 0) * (newNbEval - 1) + evaluation.note) / newNbEval;
        
        return {
          ...p,
          note_moyenne: newNote,
          nb_evaluations: newNbEval,
          indicateurs: {
            qualite_soins: evaluation.qualite_soins,
            ponctualite: evaluation.ponctualite,
            communication: evaluation.communication
          }
        };
      }
      return p;
    }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    let nouveauxFiltres = { 
      ...filtres, 
      page: 1,
      noteMin: 0,
      noteMax: 5,
      status: '',
      disponibilite: ''
    };
    
    switch (newValue) {
      case 0: // Tous
        break;
      case 1: // Meilleurs
        nouveauxFiltres.noteMin = 4;
        nouveauxFiltres.status = 'Actif';
        break;
      case 2: // À améliorer
        nouveauxFiltres.noteMin = 0;
        nouveauxFiltres.noteMax = 3;
        nouveauxFiltres.status = 'Actif';
        break;
      case 3: // Disponibles
        nouveauxFiltres.disponibilite = 'Disponible';
        nouveauxFiltres.status = 'Actif';
        break;
      case 4: // Nouveaux (derniers 30 jours)
        nouveauxFiltres.dateDebut = subMonths(new Date(), 1);
        nouveauxFiltres.dateFin = new Date();
        break;
      default:
        break;
    }
    
    setFiltres(nouveauxFiltres);
  };

  const exporterEvaluations = async () => {
    try {
      // Préparer les données à exporter
      const dataToExport = tousPrestatairesFiltres.map(p => ({
        'Nom': p.nom,
        'Prénom': p.prenom,
        'Spécialité': p.specialite,
        'Statut': p.status,
        'Note moyenne': p.note_moyenne?.toFixed(1) || '0.0',
        "Nombre d'évaluations": p.nb_evaluations || 0,
        'Qualité des soins': p.indicateurs?.qualite_soins?.toFixed(1) || '0.0',
        'Ponctualité': p.indicateurs?.ponctualite?.toFixed(1) || '0.0',
        'Communication': p.indicateurs?.communication?.toFixed(1) || '0.0',
        'Consultations/mois': p.stats?.consultations_mois || 0,
        'Taux satisfaction': `${p.stats?.taux_satisfaction?.toFixed(0) || 0}%`
      }));

      // Créer un fichier CSV
      const csvContent = [
        Object.keys(dataToExport[0] || {}).join(','),
        ...dataToExport.map(row => Object.values(row).join(','))
      ].join('\n');

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `evaluations_prestataires_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Export réussi:', dataToExport.length, 'prestataires exportés');
    } catch (error) {
      console.error('Erreur export évaluations:', error);
      alert('Erreur lors de l\'export des évaluations');
    }
  };

  const resetFiltres = () => {
    setFiltres({
      search: '',
      specialite: '',
      status: '',
      disponibilite: '',
      noteMin: 0,
      noteMax: 5,
      dateDebut: null,
      dateFin: null,
      page: 1,
      limit: 12
    });
    setShowFiltresAvances(false);
    setTabValue(0);
  };

  // Calculer les statistiques en temps réel
  const calculerStatsTempsReel = () => {
    const total = tousPrestatairesFiltres.length;
    const actifs = tousPrestatairesFiltres.filter(p => p.status === 'Actif').length;
    const moyenne = tousPrestatairesFiltres.length > 0 
      ? tousPrestatairesFiltres.reduce((sum, p) => sum + (p.note_moyenne || 0), 0) / total 
      : 0;
    const evaluationsMois = tousPrestatairesFiltres.reduce((sum, p) => sum + (p.nb_evaluations || 0), 0);

    return { total, actifs, moyenne, evaluationsMois };
  };

  const statsReel = calculerStatsTempsReel();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* En-tête avec statistiques */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Évaluation des Prestataires
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Évaluez et suivez la performance des prestataires de soins
          </Typography>

          {/* Cartes de statistiques */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {statsReel.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Prestataires
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <CheckCircleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {statsReel.actifs}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Actifs
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <StarIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {statsReel.moyenne.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Note moyenne
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                      <CalendarIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {statsReel.evaluationsMois}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Évaluations ce mois
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Barre de recherche et filtres */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Rechercher un prestataire..."
                  value={filtres.search}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: filtres.search && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => handleFiltreChange('search', '')}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Spécialité</InputLabel>
                    <Select
                      value={filtres.specialite}
                      label="Spécialité"
                      onChange={(e) => handleFiltreChange('specialite', e.target.value)}
                    >
                      <MenuItem value="">Toutes</MenuItem>
                      {specialites.map((spec) => (
                        <MenuItem key={spec.value} value={spec.value}>
                          {spec.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={filtres.status}
                      label="Statut"
                      onChange={(e) => handleFiltreChange('status', e.target.value)}
                    >
                      <MenuItem value="">Tous</MenuItem>
                      <MenuItem value="Actif">Actif</MenuItem>
                      <MenuItem value="Inactif">Inactif</MenuItem>
                      <MenuItem value="En congés">En congés</MenuItem>
                      <MenuItem value="En formation">En formation</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => setShowFiltresAvances(!showFiltresAvances)}
                  >
                    Filtres avancés
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={resetFiltres}
                  >
                    Réinitialiser
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {/* Filtres avancés */}
            {showFiltresAvances && (
              <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Note minimale"
                      value={filtres.noteMin}
                      onChange={(e) => handleFiltreChange('noteMin', parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, max: 5, step: 0.5 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">/5</InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Note maximale"
                      value={filtres.noteMax}
                      onChange={(e) => handleFiltreChange('noteMax', parseFloat(e.target.value) || 5)}
                      inputProps={{ min: 0, max: 5, step: 0.5 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">/5</InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Disponibilité</InputLabel>
                      <Select
                        value={filtres.disponibilite}
                        label="Disponibilité"
                        onChange={(e) => handleFiltreChange('disponibilite', e.target.value)}
                      >
                        <MenuItem value="">Toutes</MenuItem>
                        <MenuItem value="Disponible">Disponible</MenuItem>
                        <MenuItem value="Indisponible">Indisponible</MenuItem>
                        <MenuItem value="En congés">En congés</MenuItem>
                        <MenuItem value="En formation">En formation</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="Date début"
                      value={filtres.dateDebut}
                      onChange={(date) => handleFiltreChange('dateDebut', date)}
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="Date fin"
                      value={filtres.dateFin}
                      onChange={(date) => handleFiltreChange('dateFin', date)}
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Onglets */}
        <Box sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable">
            <Tab 
              label="Tous les prestataires" 
              icon={<PersonIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="Meilleurs évalués" 
              icon={<StarIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="À améliorer" 
              icon={<WarningIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="Disponibles" 
              icon={<CheckCircleIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="Nouveaux" 
              icon={<AddIcon />} 
              iconPosition="start" 
            />
          </Tabs>
        </Box>

        {/* Liste des prestataires */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : prestataires.length === 0 ? (
          <Alert severity="info" sx={{ mb: 4 }}>
            Aucun prestataire trouvé avec les filtres sélectionnés.
          </Alert>
        ) : (
          <>
            <Grid container spacing={3}>
              {prestataires.map((prestataire) => (
                <Grid item key={prestataire.id} xs={12} sm={6} md={4} lg={3}>
                  <CartePrestataire
                    prestataire={prestataire}
                    onView={handleViewDetails}
                    onEvaluate={handleEvaluate}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    disabled={filtres.page === 1}
                    onClick={() => handleFiltreChange('page', filtres.page - 1)}
                  >
                    Précédent
                  </Button>
                  
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                    const pageNum = Math.max(1, Math.min(
                      filtres.page - 2,
                      pagination.totalPages - 4
                    )) + index;
                    
                    if (pageNum > 0 && pageNum <= pagination.totalPages) {
                      return (
                        <Button
                          key={pageNum}
                          variant={filtres.page === pageNum ? "contained" : "outlined"}
                          onClick={() => handleFiltreChange('page', pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                    return null;
                  })}
                  
                  <Button
                    variant="outlined"
                    disabled={filtres.page === pagination.totalPages}
                    onClick={() => handleFiltreChange('page', filtres.page + 1)}
                  >
                    Suivant
                  </Button>
                </Stack>
              </Box>
            )}
          </>
        )}

        {/* Bouton d'export */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exporterEvaluations}
            disabled={tousPrestatairesFiltres.length === 0}
          >
            Exporter les évaluations ({tousPrestatairesFiltres.length})
          </Button>
        </Box>
      </Container>

      {/* Modal d'évaluation */}
      <ModalEvaluation
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        prestataireId={selectedPrestataire}
        onEvaluate={handleEvaluationSubmit}
      />
    </LocalizationProvider>
  );
};

export default EvaluationPrestataires;