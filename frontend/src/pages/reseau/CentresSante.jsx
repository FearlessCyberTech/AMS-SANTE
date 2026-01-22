import React, { useState, useEffect } from 'react';
import { centresAPI } from '../../services/api';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  TablePagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  MedicalServices as MedicalIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  LocalHospital as HospitalIcon,
  Groups as GroupsIcon,
  Visibility as ViewIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

const GestionCentresSante = () => {
  // États principaux
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États de recherche et filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    type: ''
  });
  
  // États pour les détails du centre
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [centreDetailsDialog, setCentreDetailsDialog] = useState(false);
  
  // États pour les prestataires
  const [selectedCentreForPrestataires, setSelectedCentreForPrestataires] = useState(null);
  const [prestataires, setPrestataires] = useState([]);
  const [prestatairesLoading, setPrestatairesLoading] = useState(false);
  const [prestatairesDialogOpen, setPrestatairesDialogOpen] = useState(false);
  const [prestatairesPage, setPrestatairesPage] = useState(0);
  const [prestatairesRowsPerPage, setPrestatairesRowsPerPage] = useState(10);
  const [prestatairesFilters, setPrestatairesFilters] = useState({
    specialite: '',
    statut: ''
  });

  // Charger les centres au montage
  useEffect(() => {
    fetchCentres();
  }, []);

  const fetchCentres = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await centresAPI.getAll();
      
      if (response.success) {
        // Gérer différents formats de réponse de l'API
        const centresData = response.centres || response.data || [];
        setCentres(centresData);
        console.log(`✅ ${centresData.length} centres chargés`);
      } else {
        setError(response.message || 'Erreur lors du chargement des centres');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Recherche de centres
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchCentres();
      return;
    }

    setLoading(true);
    try {
      const response = await centresAPI.searchCentres(searchTerm);
      if (response.success) {
        const searchResults = response.centres || response.data || [];
        setCentres(searchResults);
        console.log(`🔍 ${searchResults.length} résultats trouvés pour "${searchTerm}"`);
      }
    } catch (err) {
      console.error('Erreur recherche:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir les détails d'un centre
  const handleViewDetails = async (centre) => {
    try {
      const response = await centresAPI.getById(centre.id);
      if (response.success) {
        const centreDetails = response.centre || response.data || centre;
        setSelectedCentre(centreDetails);
        setCentreDetailsDialog(true);
      } else {
        // Si l'API échoue, afficher au moins les données de base
        setSelectedCentre(centre);
        setCentreDetailsDialog(true);
      }
    } catch (err) {
      console.error('Erreur détails:', err);
      // En cas d'erreur, afficher les données de base
      setSelectedCentre(centre);
      setCentreDetailsDialog(true);
    }
  };

  // Charger et afficher les prestataires d'un centre
  const handleViewPrestataires = async (centre) => {
    setSelectedCentreForPrestataires(centre);
    setPrestatairesLoading(true);
    setPrestatairesDialogOpen(true);
    
    try {
      console.log(`📊 Chargement des prestataires pour le centre: ${centre.nom} (ID: ${centre.id})`);
      
      const response = await centresAPI.getPrestatairesByCentre(centre.id, {
        page: prestatairesPage + 1,
        limit: prestatairesRowsPerPage,
        ...prestatairesFilters
      });
      
      console.log('📋 Réponse prestataires:', response);
      
      if (response.success) {
        const prestatairesData = response.prestataires || [];
        setPrestataires(prestatairesData);
        console.log(`✅ ${prestatairesData.length} prestataires chargés`);
      } else {
        setPrestataires([]);
        console.warn('⚠️ Aucun prestataire trouvé ou erreur API:', response.message);
      }
    } catch (err) {
      console.error('❌ Erreur prestataires:', err);
      setPrestataires([]);
    } finally {
      setPrestatairesLoading(false);
    }
  };

  // Filtrer les centres
  const filteredCentres = centres.filter(centre => {
    const matchesSearch = searchTerm === '' || 
      centre.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      centre.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      centre.adresse?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || centre.statut === filters.status;
    const matchesType = !filters.type || centre.type === filters.type;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination des centres
  const paginatedCentres = filteredCentres.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Pagination des prestataires
  const paginatedPrestataires = prestataires.slice(
    prestatairesPage * prestatairesRowsPerPage,
    prestatairesPage * prestatairesRowsPerPage + prestatairesRowsPerPage
  );

  // Statistiques
  const stats = {
    total: centres.length,
    actifs: centres.filter(c => c.statut === 'actif').length,
    inactifs: centres.filter(c => c.statut === 'inactif').length,
    types: [...new Set(centres.map(c => c.type).filter(Boolean))].length,
    totalPrestataires: prestataires.length
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Statut badge
  const getStatusChip = (status) => {
    const config = {
      actif: { color: 'success', label: 'Actif' },
      active: { color: 'success', label: 'Actif' },
      inactif: { color: 'error', label: 'Inactif' },
      inactive: { color: 'error', label: 'Inactif' },
      maintenance: { color: 'warning', label: 'Maintenance' },
      pending: { color: 'warning', label: 'En attente' }
    };
    
    const { color = 'default', label = status || 'Inconnu' } = config[status] || {};
    return <Chip label={label} color={color} size="small" />;
  };

  // Générer des initiales pour avatar
  const getInitials = (nom, prenom) => {
    if (!nom && !prenom) return '?';
    const first = prenom ? prenom[0] : '';
    const last = nom ? nom[0] : '';
    return `${first}${last}`.toUpperCase();
  };

  // Fermer le modal des prestataires
  const handleClosePrestatairesDialog = () => {
    setPrestatairesDialogOpen(false);
    setSelectedCentreForPrestataires(null);
    setPrestataires([]);
    setPrestatairesPage(0);
    setPrestatairesFilters({ specialite: '', statut: '' });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            <MedicalIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Gestion des Centres de Santé
          </Typography>
          <Button
            variant="outlined"
            onClick={fetchCentres}
            startIcon={<RefreshIcon />}
          >
            Actualiser
          </Button>
        </Box>
        <Typography color="textSecondary" variant="subtitle1">
          {stats.total} centres de santé répertoriés • {stats.actifs} actifs • {stats.types} types différents
        </Typography>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <HospitalIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary">
                  Total Centres
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <HospitalIcon color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary">
                  Centres Actifs
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {stats.actifs}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <HospitalIcon color="error" sx={{ mr: 1 }} />
                <Typography color="textSecondary">
                  Centres Inactifs
                </Typography>
              </Box>
              <Typography variant="h4" color="error.main">
                {stats.inactifs}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <GroupsIcon color="info" sx={{ mr: 1 }} />
                <Typography color="textSecondary">
                  Prestataires
                </Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {prestataires.length > 0 ? prestataires.length : '--'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Barre de recherche et filtres */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Rechercher un centre par nom, ville, adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.status}
                label="Statut"
                onChange={(e) => {
                  setFilters({...filters, status: e.target.value});
                  setPage(0);
                }}
              >
                <MenuItem value="">Tous les statuts</MenuItem>
                <MenuItem value="actif">Actif</MenuItem>
                <MenuItem value="inactif">Inactif</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                label="Type"
                onChange={(e) => {
                  setFilters({...filters, type: e.target.value});
                  setPage(0);
                }}
              >
                <MenuItem value="">Tous les types</MenuItem>
                <MenuItem value="hopital">Hôpital</MenuItem>
                <MenuItem value="clinique">Clinique</MenuItem>
                <MenuItem value="dispensaire">Dispensaire</MenuItem>
                <MenuItem value="centre_sante">Centre de Santé</MenuItem>
                <MenuItem value="cabinet">Cabinet médical</MenuItem>
                <MenuItem value="laboratoire">Laboratoire</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
            >
              Rechercher
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setFilters({ status: '', type: '' });
                setPage(0);
                fetchCentres();
              }}
            >
              Réinitialiser
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tableau des centres */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Chargement des centres...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
            <Button size="small" onClick={fetchCentres} sx={{ ml: 2 }}>
              Réessayer
            </Button>
          </Alert>
        ) : filteredCentres.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            Aucun centre trouvé. Essayez de modifier vos critères de recherche.
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom du Centre</TableCell>
                    <TableCell>Ville</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCentres.map((centre) => (
                    <TableRow key={centre.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {centre.nom}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
                            {centre.adresse}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{centre.ville || 'Non spécifié'}</TableCell>
                      <TableCell>
                        <Chip
                          label={centre.type || 'Non spécifié'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {getStatusChip(centre.statut)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {centre.telephone && (
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                              {centre.telephone}
                            </Typography>
                          )}
                          {centre.email && (
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <EmailIcon sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                              {centre.email}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Tooltip title="Voir les détails">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewDetails(centre)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Voir les prestataires">
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleViewPrestataires(centre)}
                              startIcon={<PersonIcon />}
                            >
                              Prestataires
                            </Button>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredCentres.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
              }
            />
          </>
        )}
      </Paper>

      {/* Modal Détails du Centre */}
      <Dialog
        open={centreDetailsDialog}
        onClose={() => setCentreDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedCentre && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  <MedicalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {selectedCentre.nom}
                </Typography>
                <IconButton onClick={() => setCentreDetailsDialog(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {getStatusChip(selectedCentre.statut)}
                    <Chip label={selectedCentre.type} variant="outlined" />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Informations Générales
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>ID:</strong> {selectedCentre.id}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Date création:</strong> {formatDate(selectedCentre.date_creation || selectedCentre.created_at)}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Dernière mise à jour:</strong> {formatDate(selectedCentre.updated_at)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Contact
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                      <LocationIcon sx={{ mr: 1, mt: 0.25, fontSize: 'small' }} />
                      <span>
                        <strong>Adresse:</strong><br />
                        {selectedCentre.adresse || 'Non spécifiée'}<br />
                        {selectedCentre.ville && `${selectedCentre.ville}, `}
                        {selectedCentre.code_postal}
                      </span>
                    </Typography>
                    {selectedCentre.telephone && (
                      <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon sx={{ mr: 1, fontSize: 'small' }} />
                        {selectedCentre.telephone}
                      </Typography>
                    )}
                    {selectedCentre.email && (
                      <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <EmailIcon sx={{ mr: 1, fontSize: 'small' }} />
                        {selectedCentre.email}
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                {selectedCentre.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      {selectedCentre.description}
                    </Typography>
                  </Grid>
                )}
                
                {selectedCentre.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Notes
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                      {selectedCentre.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCentreDetailsDialog(false)}>Fermer</Button>
              <Button
                variant="contained"
                onClick={() => {
                  setCentreDetailsDialog(false);
                  handleViewPrestataires(selectedCentre);
                }}
                startIcon={<PersonIcon />}
              >
                Voir les Prestataires
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal Prestataires */}
      <Dialog
        open={prestatairesDialogOpen}
        onClose={handleClosePrestatairesDialog}
        maxWidth="lg"
        fullWidth
        fullScreen={window.innerWidth < 900}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton 
                onClick={handleClosePrestatairesDialog}
                size="small"
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h6">
                  <GroupsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Prestataires
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedCentreForPrestataires?.nom || 'Centre de santé'}
                  {selectedCentreForPrestataires?.ville && ` • ${selectedCentreForPrestataires.ville}`}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleClosePrestatairesDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {/* Informations du centre */}
          {selectedCentreForPrestataires && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Centre
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedCentreForPrestataires.nom}
                  </Typography>
                  <Typography variant="body2">
                    {selectedCentreForPrestataires.adresse}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Contact
                  </Typography>
                  <Typography variant="body2">
                    {selectedCentreForPrestataires.telephone && `📞 ${selectedCentreForPrestataires.telephone}`}
                  </Typography>
                  <Typography variant="body2">
                    {selectedCentreForPrestataires.email && `✉️ ${selectedCentreForPrestataires.email}`}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Filtres pour les prestataires */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Rechercher un prestataire..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Spécialité</InputLabel>
                  <Select
                    value={prestatairesFilters.specialite}
                    label="Spécialité"
                    onChange={(e) => setPrestatairesFilters({...prestatairesFilters, specialite: e.target.value})}
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    <MenuItem value="medecin">Médecin</MenuItem>
                    <MenuItem value="infirmier">Infirmier</MenuItem>
                    <MenuItem value="specialiste">Spécialiste</MenuItem>
                    <MenuItem value="administratif">Administratif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={prestatairesFilters.statut}
                    label="Statut"
                    onChange={(e) => setPrestatairesFilters({...prestatairesFilters, statut: e.target.value})}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="actif">Actif</MenuItem>
                    <MenuItem value="inactif">Inactif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Liste des prestataires */}
          {prestatairesLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Chargement des prestataires...</Typography>
            </Box>
          ) : prestataires.length === 0 ? (
            <Alert severity="info">
              Aucun prestataire trouvé pour ce centre
            </Alert>
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                {prestataires.length} prestataire{prestataires.length > 1 ? 's' : ''} trouvé{prestataires.length > 1 ? 's' : ''}
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Prénom & Nom</TableCell>
                      <TableCell>Spécialité</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Téléphone</TableCell>
                      <TableCell>Rôle</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPrestataires.map((prestataire) => (
                      <TableRow key={prestataire.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32, 
                                bgcolor: prestataire.statut === 'actif' ? 'primary.main' : 'grey.500',
                                fontSize: '0.8rem'
                              }}
                            >
                              {getInitials(prestataire.nom, prestataire.prenom)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {prestataire.prenom} {prestataire.nom}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                ID: {prestataire.id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={prestataire.specialite || 'Non spécifié'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {prestataire.email ? (
                            <Typography variant="body2" sx={{ 
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              color: 'primary.main'
                            }}>
                              {prestataire.email}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              Non spécifié
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {prestataire.telephone || '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={prestataire.role || 'Prestataire'}
                            size="small"
                            color="secondary"
                          />
                        </TableCell>
                        <TableCell>
                          {prestataire.statut === 'actif' ? (
                            <Chip label="Actif" color="success" size="small" />
                          ) : (
                            <Chip label="Inactif" color="error" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={prestataires.length}
                rowsPerPage={prestatairesRowsPerPage}
                page={prestatairesPage}
                onPageChange={(e, newPage) => setPrestatairesPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setPrestatairesRowsPerPage(parseInt(e.target.value, 10));
                  setPrestatairesPage(0);
                }}
                labelRowsPerPage="Prestataires par page:"
              />
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClosePrestatairesDialog}>
            Fermer
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              if (selectedCentreForPrestataires) {
                handleViewPrestataires(selectedCentreForPrestataires);
              }
            }}
            startIcon={<RefreshIcon />}
          >
            Actualiser la liste
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionCentresSante;