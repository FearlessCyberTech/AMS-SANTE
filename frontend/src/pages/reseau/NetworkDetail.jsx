// src/pages/ReseauxDeSoins/NetworkDetail.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Divider,
  LinearProgress,
  Alert,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  useTheme,
  alpha
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Public as PublicIcon,
  BarChart as BarChartIcon,
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { reseauSoinsAPI } from '../../services/api';

const NetworkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [members, setMembers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadNetworkDetails();
  }, [id]);

  const loadNetworkDetails = async () => {
    setLoading(true);
    try {
      const response = await reseauSoinsAPI.getNetworkById(id);
      
      if (response.success) {
        setNetwork(response.network);
        setMembers(response.members || []);
        setContracts(response.contracts || []);
        setActivities(response.activities || []);
        setStats(response.statistics || {});
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce réseau ?')) {
      try {
        const response = await reseauSoinsAPI.delete(id);
        if (response.success) {
          navigate('/reseaux-de-soins');
        }
      } catch (err) {
        console.error('Erreur suppression:', err);
      }
    }
  };

  const handleEdit = () => {
    navigate(`/reseaux-de-soins/${id}/edit`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Actif': return 'success';
      case 'Inactif': return 'error';
      case 'En attente': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <LinearProgress />
      </Container>
    );
  }

  if (error || !network) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Réseau non trouvé'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/reseaux-de-soins')}
        >
          Retour à la liste
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/reseaux-de-soins')}
          sx={{ mb: 3 }}
        >
          Retour aux réseaux
        </Button>

        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mr: 3,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '2rem'
                }}
              >
                <BusinessIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  {network.nom}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip
                    label={network.type}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={network.status}
                    color={getStatusColor(network.status)}
                    size="small"
                  />
                </Box>
              </Box>
            </Box>

            <Typography variant="body1" color="textSecondary" paragraph>
              {network.description}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{network.region_nom}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{stats?.total_membres || 0} membres</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Créé le {format(parseISO(network.date_creation), 'dd/MM/yyyy', { locale: fr })}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BarChartIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{contracts.length} contrats</Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                    fullWidth
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/reseaux-de-soins/${id}/add-member`)}
                    fullWidth
                  >
                    Ajouter un membre
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DescriptionIcon />}
                    onClick={() => navigate(`/reseaux-de-soins/${id}/add-contract`)}
                    fullWidth
                  >
                    Nouveau contrat
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                    fullWidth
                  >
                    Supprimer
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Onglets */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Aperçu" icon={<BarChartIcon />} />
          <Tab label={`Membres (${members.length})`} icon={<PeopleIcon />} />
          <Tab label={`Contrats (${contracts.length})`} icon={<DescriptionIcon />} />
          <Tab label={`Activités (${activities.length})`} icon={<EventIcon />} />
          <Tab label="Informations" icon={<BusinessIcon />} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Onglet Aperçu */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Statistiques du réseau
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="primary">
                            {stats?.total_membres || 0}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Membres totaux
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="secondary">
                            {stats?.etablissements || 0}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Établissements
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="info">
                            {stats?.prestataires || 0}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Prestataires
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h3" color="warning">
                            {stats?.membres_actifs || 0}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Membres actifs
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Derniers membres
                    </Typography>
                    <List dense>
                      {members.slice(0, 5).map((member) => (
                        <ListItem key={member.id}>
                          <ListItemAvatar>
                            <Avatar>
                              {member.type_membre === 'Etablissement' ? <HospitalIcon /> :
                               member.type_membre === 'Prestataire' ? <PersonIcon /> :
                               <GroupIcon />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={member.nom_complet}
                            secondary={`${member.type_membre} • ${member.role || 'Membre'}`}
                          />
                          <ListItemSecondaryAction>
                            <Chip
                              label={member.status_adhesion}
                              size="small"
                              color={member.status_adhesion === 'Actif' ? 'success' : 'default'}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Derniers contrats
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Numéro</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Objet</TableCell>
                            <TableCell>Date début</TableCell>
                            <TableCell>Montant</TableCell>
                            <TableCell>Statut</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {contracts.slice(0, 5).map((contract) => (
                            <TableRow key={contract.id}>
                              <TableCell>{contract.numero_contrat}</TableCell>
                              <TableCell>{contract.type_contrat}</TableCell>
                              <TableCell>{contract.objet_contrat.substring(0, 50)}...</TableCell>
                              <TableCell>
                                {format(parseISO(contract.date_debut), 'dd/MM/yyyy', { locale: fr })}
                              </TableCell>
                              <TableCell>{contract.montant_contrat} €</TableCell>
                              <TableCell>
                                <Chip
                                  label={contract.status}
                                  size="small"
                                  color={contract.status === 'Actif' ? 'success' : 'default'}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Onglet Membres */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">
                  Liste des membres ({members.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate(`/reseaux-de-soins/${id}/add-member`)}
                >
                  Ajouter un membre
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Nom</TableCell>
                      <TableCell>Rôle</TableCell>
                      <TableCell>Date d'adhésion</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Chip
                            icon={member.type_membre === 'Etablissement' ? <HospitalIcon /> :
                                  member.type_membre === 'Prestataire' ? <PersonIcon /> :
                                  <GroupIcon />}
                            label={member.type_membre}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{member.nom_complet}</TableCell>
                        <TableCell>{member.role || 'Membre'}</TableCell>
                        <TableCell>
                          {format(parseISO(member.date_adhesion), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={member.status_adhesion}
                            size="small"
                            color={member.status_adhesion === 'Actif' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Voir détails">
                            <IconButton size="small">
                              <SearchIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Retirer">
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Onglet Contrats */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">
                  Liste des contrats ({contracts.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate(`/reseaux-de-soins/${id}/add-contract`)}
                >
                  Nouveau contrat
                </Button>
              </Box>

              <Grid container spacing={3}>
                {contracts.map((contract) => (
                  <Grid item xs={12} md={6} key={contract.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6">
                            {contract.numero_contrat}
                          </Typography>
                          <Chip
                            label={contract.status}
                            size="small"
                            color={contract.status === 'Actif' ? 'success' : 'default'}
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {contract.type_contrat}
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {contract.objet_contract.substring(0, 100)}...
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">
                              Date début
                            </Typography>
                            <Typography variant="body2">
                              {format(parseISO(contract.date_debut), 'dd/MM/yyyy', { locale: fr })}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">
                              Montant
                            </Typography>
                            <Typography variant="body2">
                              {contract.montant_contrat} €
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                      <CardActions>
                        <Button size="small">Voir détails</Button>
                        <Button size="small" color="primary">
                          Télécharger
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Onglet Activités */}
          {activeTab === 3 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">
                  Activités du réseau ({activities.length})
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />}>
                  Nouvelle activité
                </Button>
              </Box>

              {activities.length === 0 ? (
                <Alert severity="info">
                  Aucune activité planifiée pour le moment.
                </Alert>
              ) : (
                <List>
                  {activities.map((activity) => (
                    <ListItem key={activity.id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <EventIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.libelle_activite}
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2" color="textPrimary">
                              {activity.type_activite} • {activity.lieu}
                            </Typography>
                            <br />
                            {format(parseISO(activity.date_debut), 'dd/MM/yyyy', { locale: fr })} - 
                            {format(parseISO(activity.date_fin), 'dd/MM/yyyy', { locale: fr })}
                          </React.Fragment>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={activity.status}
                          size="small"
                          color={activity.status === 'Terminé' ? 'success' : 
                                 activity.status === 'En cours' ? 'warning' : 'default'}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Onglet Informations */}
          {activeTab === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Informations générales
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Type
                        </Typography>
                        <Typography variant="body1">{network.type}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Statut
                        </Typography>
                        <Typography variant="body1">
                          <Chip
                            label={network.status}
                            size="small"
                            color={getStatusColor(network.status)}
                          />
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">
                          Région
                        </Typography>
                        <Typography variant="body1">{network.region_nom}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">
                          Zone de couverture
                        </Typography>
                        <Typography variant="body1">{network.zone_couverture}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">
                          Population cible
                        </Typography>
                        <Typography variant="body1">{network.population_cible}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Contact
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            {network.contact_principal || 'Non spécifié'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            {network.telephone_contact || 'Non spécifié'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            {network.email_contact || 'Non spécifié'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PublicIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            {network.site_web || 'Non spécifié'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Objectifs du réseau
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {network.objectifs || 'Aucun objectif spécifié'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default NetworkDetail;