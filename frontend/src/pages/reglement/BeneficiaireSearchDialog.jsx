import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  CircularProgress,
  Box,
  Typography,
  Divider,
  InputAdornment,
  Badge,
  Tooltip,
  Stack,
  Paper,
  Fade,
  Slide,
  Zoom,
  alpha,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AssignmentInd as IdIcon,
  CalendarToday as CalendarIcon,
  Check as CheckIcon,
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  History as HistoryIcon,
  RecentActors as RecentIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  Paid as PaidIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const BeneficiaireSearchDialog = ({ 
  open, 
  onClose, 
  onSelect, 
  searchTerm, 
  onSearchChange, 
  beneficiaires, 
  loading,
  recentBeneficiaires = []
}) => {
  const theme = useTheme();
  const [selectedBeneficiaire, setSelectedBeneficiaire] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'grid'
  const [favorites, setFavorites] = useState([]);

  // Effet pour charger l'historique de recherche
  useEffect(() => {
    const savedHistory = localStorage.getItem('beneficiaireSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
    
    const savedFavorites = localStorage.getItem('favoriteBeneficiaires');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Gérer la sélection d'un bénéficiaire
  const handleSelect = (beneficiaire) => {
    setSelectedBeneficiaire(beneficiaire);
    
    // Ajouter à l'historique
    const newHistory = [
      { ...beneficiaire, searchedAt: new Date().toISOString() },
      ...searchHistory.filter(item => item.id !== beneficiaire.id).slice(0, 9)
    ];
    setSearchHistory(newHistory);
    localStorage.setItem('beneficiaireSearchHistory', JSON.stringify(newHistory));
    
    if (onSelect) {
      onSelect(beneficiaire);
    }
  };

  // Gérer les favoris
  const handleToggleFavorite = (beneficiaire, e) => {
    e.stopPropagation();
    
    const isFavorite = favorites.some(fav => fav.id === beneficiaire.id);
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter(fav => fav.id !== beneficiaire.id);
    } else {
      newFavorites = [...favorites, beneficiaire];
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('favoriteBeneficiaires', JSON.stringify(newFavorites));
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calculer l'âge
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Données de démo si pas de données
  const demoBeneficiaires = [
    {
      id: 1,
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@email.com',
      telephone: '+33 6 12 34 56 78',
      adresse: '12 Rue de la Paix, Paris',
      identifiant: 'BEN001234',
      date_naissance: '1985-06-15',
      derniere_facture: '2024-01-15',
      montant_total: 2500,
      statut: 'Actif',
      couleur: theme.palette.primary.main
    },
    {
      id: 2,
      nom: 'Martin',
      prenom: 'Marie',
      email: 'marie.martin@email.com',
      telephone: '+33 6 23 45 67 89',
      adresse: '25 Avenue des Champs-Élysées, Paris',
      identifiant: 'BEN001235',
      date_naissance: '1990-03-22',
      derniere_facture: '2024-01-10',
      montant_total: 1800,
      statut: 'Actif',
      couleur: theme.palette.secondary.main
    },
    {
      id: 3,
      nom: 'Bernard',
      prenom: 'Pierre',
      email: 'pierre.bernard@email.com',
      telephone: '+33 6 34 56 78 90',
      adresse: '8 Rue du Commerce, Lyon',
      identifiant: 'BEN001236',
      date_naissance: '1978-11-30',
      derniere_facture: '2023-12-20',
      montant_total: 3200,
      statut: 'Inactif',
      couleur: theme.palette.error.main
    }
  ];

  // Utiliser les données de démo si pas de données réelles
  const displayedBeneficiaires = beneficiaires.length > 0 ? beneficiaires : demoBeneficiaires;
  const displayedRecent = recentBeneficiaires.length > 0 ? recentBeneficiaires : searchHistory;

  // Composant de carte de bénéficiaire
  const BeneficiaireCard = ({ beneficiaire, index }) => {
    const age = calculateAge(beneficiaire.date_naissance);
    const isFavorite = favorites.some(fav => fav.id === beneficiaire.id);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            cursor: 'pointer',
            border: selectedBeneficiaire?.id === beneficiaire.id 
              ? `2px solid ${theme.palette.primary.main}` 
              : '1px solid transparent',
            background: selectedBeneficiaire?.id === beneficiaire.id
              ? alpha(theme.palette.primary.main, 0.05)
              : 'white',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: theme.shadows[8],
              borderColor: alpha(theme.palette.primary.main, 0.3)
            }
          }}
          onClick={() => handleSelect(beneficiaire)}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Tooltip title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}>
                    <IconButton
                      size="small"
                      onClick={(e) => handleToggleFavorite(beneficiaire, e)}
                      sx={{
                        bgcolor: isFavorite ? theme.palette.warning.main : 'white',
                        color: isFavorite ? 'white' : theme.palette.text.secondary,
                        width: 24,
                        height: 24,
                        '&:hover': {
                          bgcolor: isFavorite ? theme.palette.warning.dark : alpha(theme.palette.warning.main, 0.1)
                        }
                      }}
                    >
                      {isFavorite ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                }
              >
                <Avatar
                  sx={{
                    bgcolor: beneficiaire.couleur || alpha(theme.palette.primary.main, 0.1),
                    color: beneficiaire.couleur || theme.palette.primary.main,
                    width: 56,
                    height: 56,
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  {beneficiaire.prenom?.[0]?.toUpperCase() || '?'}
                </Avatar>
              </Badge>
              
              <Box>
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                  {beneficiaire.prenom} {beneficiaire.nom}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                  <Chip
                    icon={<IdIcon fontSize="small" />}
                    label={beneficiaire.identifiant || 'N/A'}
                    size="small"
                    variant="outlined"
                    sx={{ height: 24 }}
                  />
                  {age && (
                    <Chip
                      icon={<CalendarIcon fontSize="small" />}
                      label={`${age} ans`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 24 }}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
            
            <IconButton 
              color="primary"
              onClick={() => handleSelect(beneficiaire)}
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Stack>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <EmailIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {beneficiaire.email || 'N/A'}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} md={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PhoneIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {beneficiaire.telephone || 'N/A'}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} md={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocationIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {beneficiaire.adresse?.split(',')[0] || 'N/A'}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} md={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PaidIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {beneficiaire.montant_total ? `${beneficiaire.montant_total} €` : 'N/A'}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
          
          {beneficiaire.derniere_facture && (
            <Box sx={{ 
              mt: 2, 
              p: 1, 
              bgcolor: alpha(theme.palette.info.main, 0.05),
              borderRadius: 1
            }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ReceiptIcon fontSize="small" color="info" />
                <Typography variant="caption" color="text.secondary">
                  Dernière facture: {formatDate(beneficiaire.derniere_facture)}
                </Typography>
              </Stack>
            </Box>
          )}
        </Paper>
      </motion.div>
    );
  };

  // Composant de statistiques
  const StatsCard = () => (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Stack alignItems="center">
            <Typography variant="h4" color="primary" fontWeight="bold">
              {displayedBeneficiaires.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bénéficiaires trouvés
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Stack alignItems="center">
            <Typography variant="h4" color="secondary" fontWeight="bold">
              {favorites.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Favoris
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Stack alignItems="center">
            <Typography variant="h4" color="info" fontWeight="bold">
              {searchHistory.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recherches récentes
            </Typography>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          height: '80vh',
          maxHeight: '800px'
        }
      }}
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main',
        color: 'white',
        py: 3,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)'
        }} />
        
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <PersonIcon sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" component="div" fontWeight="bold">
                Recherche de bénéficiaires
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Sélectionnez un bénéficiaire pour créer une facture
              </Typography>
            </Box>
          </Stack>
          
          <IconButton 
            onClick={onClose} 
            sx={{ 
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {/* Barre de recherche */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Rechercher par nom, prénom, email, identifiant..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => onSearchChange('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          {/* Filtres rapides */}
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Chip
              icon={<RecentIcon />}
              label="Récents"
              clickable
              onClick={() => onSearchChange('')}
              color={!searchTerm ? "primary" : "default"}
              variant={!searchTerm ? "filled" : "outlined"}
              size="small"
            />
            <Chip
              icon={<StarIcon />}
              label="Favoris"
              clickable
              onClick={() => {
                // Filtrer pour n'afficher que les favoris
                onSearchChange('FAVORIS');
              }}
              color={searchTerm === 'FAVORIS' ? "primary" : "default"}
              variant={searchTerm === 'FAVORIS' ? "filled" : "outlined"}
              size="small"
            />
            <Chip
              icon={<TrendingIcon />}
              label="Actifs"
              clickable
              onClick={() => onSearchChange('ACTIF')}
              color={searchTerm === 'ACTIF' ? "primary" : "default"}
              variant={searchTerm === 'ACTIF' ? "filled" : "outlined"}
              size="small"
            />
          </Stack>
        </Box>
        
        {/* Statistiques */}
        <StatsCard />
        
        {/* Contenu principal */}
        <Box sx={{ height: 'calc(100% - 200px)', overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
              <CircularProgress size={60} />
            </Box>
          ) : searchTerm === 'FAVORIS' && favorites.length === 0 ? (
            <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
              <StarBorderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucun bénéficiaire favori
              </Typography>
              <Typography color="text.secondary">
                Ajoutez des bénéficiaires à vos favoris en cliquant sur l'étoile
              </Typography>
            </Paper>
          ) : displayedBeneficiaires.length === 0 ? (
            <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
              <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucun bénéficiaire trouvé
              </Typography>
              <Typography color="text.secondary">
                Essayez avec d'autres termes de recherche
              </Typography>
            </Paper>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Historique récent (si pas de recherche) */}
                {!searchTerm && displayedRecent.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <HistoryIcon color="primary" />
                      <Typography variant="h6">Recherches récentes</Typography>
                    </Stack>
                    
                    {displayedRecent.slice(0, 3).map((beneficiaire, index) => (
                      <BeneficiaireCard key={`recent-${beneficiaire.id}`} beneficiaire={beneficiaire} index={index} />
                    ))}
                    
                    {displayedRecent.length > 3 && (
                      <Button
                        fullWidth
                        variant="text"
                        startIcon={<ArrowForwardIcon />}
                        sx={{ mt: 1 }}
                        onClick={() => onSearchChange('')}
                      >
                        Voir tout l'historique ({displayedRecent.length})
                      </Button>
                    )}
                    
                    <Divider sx={{ my: 3 }} />
                  </Box>
                )}
                
                {/* Résultats de recherche */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <PersonIcon color="primary" />
                  <Typography variant="h6">
                    {searchTerm === 'FAVORIS' 
                      ? 'Bénéficiaires favoris' 
                      : searchTerm 
                        ? `Résultats (${displayedBeneficiaires.length})`
                        : 'Tous les bénéficiaires'}
                  </Typography>
                </Stack>
                
                {displayedBeneficiaires.map((beneficiaire, index) => (
                  <BeneficiaireCard 
                    key={beneficiaire.id} 
                    beneficiaire={beneficiaire} 
                    index={index} 
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 3, 
        borderTop: `1px solid ${theme.palette.divider}`,
        justifyContent: 'space-between'
      }}>
        <Stack direction="row" spacing={1}>
          <Chip
            label={`${displayedBeneficiaires.length} résultat(s)`}
            color="primary"
            variant="outlined"
          />
          {selectedBeneficiaire && (
            <Chip
              icon={<CheckIcon />}
              label={`${selectedBeneficiaire.prenom} ${selectedBeneficiaire.nom}`}
              color="primary"
              variant="filled"
              onDelete={() => setSelectedBeneficiaire(null)}
              deleteIcon={<CloseIcon />}
            />
          )}
        </Stack>
        
        <Stack direction="row" spacing={2}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              if (selectedBeneficiaire) {
                handleSelect(selectedBeneficiaire);
                onClose();
              }
            }}
            variant="contained"
            disabled={!selectedBeneficiaire}
            startIcon={<CheckIcon />}
            sx={{ borderRadius: 2 }}
          >
            Sélectionner
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

// Composants Grid manquants
import Grid from '@mui/material/Grid';

export default BeneficiaireSearchDialog;