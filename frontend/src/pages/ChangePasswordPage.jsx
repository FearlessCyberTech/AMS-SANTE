// src/pages/ChangePasswordPage.jsx
import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { Lock as LockIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { authAPI } from '../services/api';

const ChangePasswordPage = () => {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Les nouveaux mots de passe ne correspondent pas',
      });
      setOpenSnackbar(true);
      return;
    }

    if (passwords.newPassword.length < 8) {
      setMessage({
        type: 'error',
        text: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
      });
      setOpenSnackbar(true);
      return;
    }

    try {
      setLoading(true);
      
      const response = await authAPI.changePassword({
        current_password: passwords.currentPassword,
        new_password: passwords.newPassword,
      });

      if (response.success) {
        setMessage({
          type: 'success',
          text: 'Mot de passe changé avec succès',
        });
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setMessage({
          type: 'error',
          text: response.message || 'Erreur lors du changement de mot de passe',
        });
      }
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      setMessage({
        type: 'error',
        text: 'Erreur lors du changement de mot de passe',
      });
    } finally {
      setLoading(false);
      setOpenSnackbar(true);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
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

      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => window.history.back()}
            sx={{ mr: 2 }}
          >
            Retour
          </Button>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
            <LockIcon sx={{ mr: 1 }} />
            Changer le mot de passe
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Mot de passe actuel"
            name="currentPassword"
            type="password"
            value={passwords.currentPassword}
            onChange={handleInputChange}
            required
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Nouveau mot de passe"
            name="newPassword"
            type="password"
            value={passwords.newPassword}
            onChange={handleInputChange}
            required
            helperText="Minimum 8 caractères"
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Confirmer le nouveau mot de passe"
            name="confirmPassword"
            type="password"
            value={passwords.confirmPassword}
            onChange={handleInputChange}
            required
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Changer le mot de passe'}
          </Button>
        </form>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Conseils de sécurité :</strong>
            <ul>
              <li>Utilisez au moins 8 caractères</li>
              <li>Combinez lettres, chiffres et caractères spéciaux</li>
              <li>Évitez les mots de passe faciles à deviner</li>
              <li>Ne réutilisez pas d'anciens mots de passe</li>
            </ul>
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
};

export default ChangePasswordPage;