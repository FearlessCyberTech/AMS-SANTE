// src/pages/Administration/SystemSettings.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Save as SaveIcon,
  Restore as RestoreIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Backup as BackupIcon
} from '@mui/icons-material';

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    // Général
    siteName: 'MediSystem',
    siteUrl: 'https://medisystem.example.com',
    timezone: 'Europe/Paris',
    
    // Email
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    
    // Sécurité
    require2FA: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    notificationSound: true
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Simuler sauvegarde
    showSnackbar('Paramètres sauvegardés avec succès', 'success');
  };

  const handleReset = () => {
    // Réinitialiser aux valeurs par défaut
    setSettings({
      siteName: 'MediSystem',
      siteUrl: 'https://medisystem.example.com',
      timezone: 'Europe/Paris',
      smtpHost: '',
      smtpPort: '587',
      smtpUser: '',
      smtpPassword: '',
      require2FA: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      emailNotifications: true,
      pushNotifications: true,
      notificationSound: true
    });
    showSnackbar('Paramètres réinitialisés', 'info');
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const renderGeneralSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Nom du site"
          value={settings.siteName}
          onChange={(e) => handleChange('siteName', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="URL du site"
          value={settings.siteUrl}
          onChange={(e) => handleChange('siteUrl', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          select
          label="Fuseau horaire"
          value={settings.timezone}
          onChange={(e) => handleChange('timezone', e.target.value)}
        >
          <option value="Europe/Paris">Europe/Paris</option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">America/New_York</option>
        </TextField>
      </Grid>
    </Grid>
  );

  const renderEmailSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Serveur SMTP"
          value={settings.smtpHost}
          onChange={(e) => handleChange('smtpHost', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Port SMTP"
          value={settings.smtpPort}
          onChange={(e) => handleChange('smtpPort', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Utilisateur SMTP"
          value={settings.smtpUser}
          onChange={(e) => handleChange('smtpUser', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="password"
          label="Mot de passe SMTP"
          value={settings.smtpPassword}
          onChange={(e) => handleChange('smtpPassword', e.target.value)}
        />
      </Grid>
    </Grid>
  );

  const renderSecuritySettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.require2FA}
              onChange={(e) => handleChange('require2FA', e.target.checked)}
            />
          }
          label="Requérir l'authentification à deux facteurs pour les administrateurs"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Durée de session (minutes)"
          value={settings.sessionTimeout}
          onChange={(e) => handleChange('sessionTimeout', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Tentatives de connexion maximales"
          value={settings.maxLoginAttempts}
          onChange={(e) => handleChange('maxLoginAttempts', e.target.value)}
        />
      </Grid>
    </Grid>
  );

  const renderNotificationSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.emailNotifications}
              onChange={(e) => handleChange('emailNotifications', e.target.checked)}
            />
          }
          label="Notifications par email"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.pushNotifications}
              onChange={(e) => handleChange('pushNotifications', e.target.checked)}
            />
          }
          label="Notifications push"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.notificationSound}
              onChange={(e) => handleChange('notificationSound', e.target.checked)}
            />
          }
          label="Son de notification"
        />
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Paramètres système
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab label="Général" icon={<SettingsIcon />} />
            <Tab label="Email" icon={<EmailIcon />} />
            <Tab label="Sécurité" icon={<SecurityIcon />} />
            <Tab label="Notifications" icon={<NotificationsIcon />} />
          </Tabs>

          {activeTab === 0 && renderGeneralSettings()}
          {activeTab === 1 && renderEmailSettings()}
          {activeTab === 2 && renderSecuritySettings()}
          {activeTab === 3 && renderNotificationSettings()}
        </CardContent>
        <Divider />
        <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={handleReset}
            sx={{ mr: 2 }}
          >
            Réinitialiser
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Sauvegarder
          </Button>
        </CardActions>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Actions système
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Sauvegarde automatique"
                secondary="Tous les jours à 02:00"
              />
              <ListItemSecondaryAction>
                <Switch defaultChecked />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Nettoyage des logs"
                secondary="Suppression des logs après 30 jours"
              />
              <ListItemSecondaryAction>
                <Switch defaultChecked />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Mise à jour automatique"
                secondary="Vérifier les mises à jour"
              />
              <ListItemSecondaryAction>
                <Switch />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemSettings;