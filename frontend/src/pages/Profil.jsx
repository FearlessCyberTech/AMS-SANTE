// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { authAPI } from '../services/api';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    code_postal: '',
    profession: '',
    date_naissance: '',
  });

  // Initialiser les données utilisateur
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = authAPI.getUser();
      
      if (!userData) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer les détails complets du profil
      const response = await authAPI.getProfileDetails();
      
      if (response.success) {
        const userProfile = response.user || userData;
        setUser(userProfile);
        setFormData({
          nom: userProfile.nom || userProfile.NOM_UTI || '',
          prenom: userProfile.prenom || userProfile.PRE_UTI || '',
          email: userProfile.email || userProfile.EMAIL_UTI || '',
          telephone: userProfile.telephone || userProfile.TEL_UTI || '',
          adresse: userProfile.adresse || userProfile.ADRESSE || '',
          ville: userProfile.ville || userProfile.VILLE || '',
          code_postal: userProfile.code_postal || userProfile.CODE_POSTAL || '',
          profession: userProfile.profession || userProfile.PROFESSION || '',
          date_naissance: userProfile.date_naissance || userProfile.DATE_NAISSANCE || '',
        });
      } else {
        setUser(userData);
        setFormData({
          nom: userData.nom || userData.NOM_UTI || '',
          prenom: userData.prenom || userData.PRE_UTI || '',
          email: userData.email || userData.EMAIL_UTI || '',
          telephone: userData.telephone || userData.TEL_UTI || '',
          adresse: '',
          ville: '',
          code_postal: '',
          profession: '',
          date_naissance: '',
        });
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      setMessage({
        type: 'error',
        text: 'Erreur lors du chargement du profil',
      });
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Formater les données selon les noms de champ de la BD
      const profileData = {
        NOM_UTI: formData.nom,
        PRE_UTI: formData.prenom,
        EMAIL_UTI: formData.email,
        TEL_UTI: formData.telephone,
        ADRESSE: formData.adresse,
        VILLE: formData.ville,
        CODE_POSTAL: formData.code_postal,
        PROFESSION: formData.profession,
        DATE_NAISSANCE: formData.date_naissance,
      };
      
      // Appeler l'API pour mettre à jour le profil
      const response = await authAPI.updateProfile(profileData);
      
      if (response.success) {
        setMessage({
          type: 'success',
          text: 'Profil mis à jour avec succès',
        });
        
        // Mettre à jour les données locales
        const updatedUser = response.user || { ...user, ...formData };
        setUser(updatedUser);
        
        // Mettre à jour le stockage local
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setEditing(false);
      } else {
        setMessage({
          type: 'error',
          text: response.message || 'Erreur lors de la mise à jour',
        });
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      setMessage({
        type: 'error',
        text: 'Erreur lors de la mise à jour du profil',
      });
    } finally {
      setSaving(false);
      setOpenSnackbar(true);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    if (user) {
      setFormData({
        nom: user.nom || user.NOM_UTI || '',
        prenom: user.prenom || user.PRE_UTI || '',
        email: user.email || user.EMAIL_UTI || '',
        telephone: user.telephone || user.TEL_UTI || '',
        adresse: user.adresse || user.ADRESSE || '',
        ville: user.ville || user.VILLE || '',
        code_postal: user.code_postal || user.CODE_POSTAL || '',
        profession: user.profession || user.PROFESSION || '',
        date_naissance: user.date_naissance || user.DATE_NAISSANCE || '',
      });
    }
  };

  const handleChangePassword = () => {
    // Redirection vers la page de changement de mot de passe
    window.location.href = '/change-password';
  };

  const getInitials = (nom, prenom) => {
    const first = nom?.charAt(0)?.toUpperCase() || '';
    const second = prenom?.charAt(0)?.toUpperCase() || '';
    return `${first}${second}` || '?';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Vous devez être connecté pour accéder à cette page.
          <Button href="/login" sx={{ ml: 2 }}>
            Se connecter
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={message.type}
          sx={{ width: '100%' }}
        >
          {message.text}
        </Alert>
      </Snackbar>

      <Grid container spacing={3}>
        {/* En-tête du profil */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  mr: 3,
                }}
              >
                {getInitials(formData.nom, formData.prenom)}
              </Avatar>
              <Box>
                <Typography variant="h4" gutterBottom>
                  {formData.prenom} {formData.nom}
                </Typography>
                <Chip
                  icon={<BadgeIcon />}
                  label={user.PROFIL_UTI || 'Utilisateur'}
                  color="primary"
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
                <Chip
                  icon={<BusinessIcon />}
                  label={user.SERVICE_UTI || user.FONCTION_UTI || 'Non spécifié'}
                  color="secondary"
                  variant="outlined"
                />
              </Box>
            </Box>
            
            <Box>
              {!editing ? (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setEditing(true)}
                >
                  Modifier le profil
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Enregistrer'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelEdit}
                  >
                    Annuler
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Informations personnelles */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PersonIcon sx={{ mr: 1 }} />
              Informations personnelles
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  disabled={!editing}
                  variant={editing ? "outlined" : "filled"}
                  InputProps={{
                    readOnly: !editing,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prénom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  disabled={!editing}
                  variant={editing ? "outlined" : "filled"}
                  InputProps={{
                    readOnly: !editing,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!editing}
                  variant={editing ? "outlined" : "filled"}
                  InputProps={{
                    readOnly: !editing,
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  disabled={!editing}
                  variant={editing ? "outlined" : "filled"}
                  InputProps={{
                    readOnly: !editing,
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Adresse"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  disabled={!editing}
                  variant={editing ? "outlined" : "filled"}
                  InputProps={{
                    readOnly: !editing,
                    startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ville"
                  name="ville"
                  value={formData.ville}
                  onChange={handleInputChange}
                  disabled={!editing}
                  variant={editing ? "outlined" : "filled"}
                  InputProps={{
                    readOnly: !editing,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Code postal"
                  name="code_postal"
                  value={formData.code_postal}
                  onChange={handleInputChange}
                  disabled={!editing}
                  variant={editing ? "outlined" : "filled"}
                  InputProps={{
                    readOnly: !editing,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Profession"
                  name="profession"
                  value={formData.profession}
                  onChange={handleInputChange}
                  disabled={!editing}
                  variant={editing ? "outlined" : "filled"}
                  InputProps={{
                    readOnly: !editing,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date de naissance"
                  name="date_naissance"
                  type="date"
                  value={formData.date_naissance}
                  onChange={handleInputChange}
                  disabled={!editing}
                  variant={editing ? "outlined" : "filled"}
                  InputProps={{
                    readOnly: !editing,
                    startAdornment: <CalendarIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Informations de compte et sécurité */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: '-flex', alignItems: 'center' }}>
              <SecurityIcon sx={{ mr: 1 }} />
              Sécurité du compte
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <BadgeIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Identifiant"
                  secondary={user.ID_UTI || user.COD_UTIL || 'N/A'}
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email vérifié"
                  secondary={user.EMAIL_VERIFIE ? 'Oui' : 'Non'}
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Membre depuis"
                  secondary={user.DAT_CREUTIL ? new Date(user.DAT_CREUTIL).toLocaleDateString('fr-FR') : 'Non disponible'}
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            </List>
            
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={handleChangePassword}
              sx={{ mt: 2 }}
            >
              Changer le mot de passe
            </Button>
          </Paper>

          {/* Statut du compte */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon sx={{ mr: 1 }} />
              Statut du compte
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText
                  primary="Statut"
                  secondary={
                    <Chip
                      label={user.ACTIF === 1 ? 'Actif' : 'Inactif'}
                      color={user.ACTIF === 1 ? 'success' : 'error'}
                      size="small"
                    />
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Dernière connexion"
                  secondary={
                    user.DATE_DERNIERE_CONNEXION
                      ? new Date(user.DATE_DERNIERE_CONNEXION).toLocaleString('fr-FR')
                      : 'Jamais'
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Type de compte"
                  secondary={user.SUPER_ADMIN === 1 ? 'Super Admin' : (user.PROFIL_UTI || 'Standard')}
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Statistiques d'activité - Optionnel */}
        {user.activity_stats && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Statistiques d'activité
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="primary">
                        {user.activity_stats.consultations || 0}
                      </Typography>
                      <Typography color="textSecondary">
                        Consultations
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="secondary">
                        {user.activity_stats.prescriptions || 0}
                      </Typography>
                      <Typography color="textSecondary">
                        Prescriptions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="success">
                        {user.activity_stats.patients || 0}
                      </Typography>
                      <Typography color="textSecondary">
                        Patients traités
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="warning">
                        {user.activity_stats.years_experience || 0}
                      </Typography>
                      <Typography color="textSecondary">
                        Années d'expérience
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default ProfilePage;