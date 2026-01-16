import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  MedicalServices as MedicalIcon,
  People as PeopleIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { centresAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CentreSanteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const [centre, setCentre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadCentre();
  }, [id]);

  const loadCentre = async () => {
    try {
      setLoading(true);
      const response = await centresAPI.getById(id);
      if (response.success) {
        setCentre(response.centre || response.data);
        setError(null);
      } else {
        setError(response.message || 'Centre non trouvé');
      }
    } catch (error) {
      console.error('❌ Erreur chargement centre:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await centresAPI.delete(id);
      if (response.success) {
        navigate('/centres-sante', { state: { message: 'Centre supprimé avec succès' } });
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      setError('Erreur lors de la suppression');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <Button onClick={() => navigate('/centres-sante')} sx={{ ml: 2 }}>
            Retour à la liste
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!centre) {
    return (
      <Container>
        <Typography variant="h5" sx={{ mt: 2 }}>
          Centre non trouvé
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* En-tête */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt: 2 }}>
        <IconButton onClick={() => navigate('/centres-sante')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {centre.nom || centre.NOM_CENTRE}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {hasPermission('edit_centre') && (
          <Button
            startIcon={<EditIcon />}
            onClick={() => navigate(`/centres-sante/${id}/edit`)}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Modifier
          </Button>
        )}
        {hasPermission('delete_centre') && (
          <Button
            startIcon={<DeleteIcon />}
            onClick={() => setShowDeleteDialog(true)}
            variant="outlined"
            color="error"
          >
            Supprimer
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Informations principales */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informations générales
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Code
                </Typography>
                <Typography variant="body1">
                  {centre.code || centre.CODE_CENTRE || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Type
                </Typography>
                <Chip
                  label={centre.type || centre.TYPE_CENTRE || 'Non spécifié'}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Catégorie
                </Typography>
                <Typography variant="body1">
                  {centre.categorie || centre.CATEGORIE_CENTRE || 'Non spécifiée'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Statut
                </Typography>
                <Chip
                  label={centre.statut || centre.STATUT || 'Inconnu'}
                  color={(centre.statut || centre.STATUT) === 'Actif' ? 'success' : 'error'}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Localisation */}
            <Typography variant="h6" gutterBottom>
              <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Localisation
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Adresse
                </Typography>
                <Typography variant="body1">
                  {centre.adresse || centre.ADRESSE || 'Non spécifiée'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Ville
                </Typography>
                <Typography variant="body1">
                  {centre.ville || centre.VILLE || 'Non spécifiée'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Région
                </Typography>
                <Typography variant="body1">
                  {centre.region || centre.REGION || 'Non spécifiée'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Pays
                </Typography>
                <Typography variant="body1">
                  {centre.pays || centre.PAYS || 'Non spécifié'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Informations secondaires */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Capacité
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <MedicalIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Lits"
                    secondary={centre.capacite_lits || centre.capacite_lits || '0'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Urgences"
                    secondary={centre.capacite_urgences || centre.capacite_urgences || '0'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Téléphone"
                    secondary={centre.telephone || centre.TELEPHONE || 'Non spécifié'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={centre.email || centre.EMAIL || 'Non spécifié'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dates
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <EventIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Création"
                    secondary={new Date(centre.date_creation || centre.DAT_CREATION).toLocaleDateString()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AccessTimeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dernière modification"
                    secondary={new Date(centre.date_modification || centre.DAT_MODIFICATION).toLocaleDateString()}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          Êtes-vous sûr de vouloir supprimer ce centre ? Cette action est irréversible.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CentreSanteDetailPage;