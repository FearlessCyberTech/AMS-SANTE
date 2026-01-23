// src/components/admin/UserModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Typography
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { adminAPI } from '../../services/api';

const UserModal = ({ open, onClose, user, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState([]);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: '',
    is_active: true,
    must_change_password: false,
    phone: '',
    department: '',
    position: '',
    notes: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    password: '',
    password_confirmation: ''
  });
  
  useEffect(() => {
    if (open) {
      loadRoles();
      if (user) {
        setFormData({
          username: user.username || '',
          email: user.email || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          role: user.role || '',
          is_active: user.is_active !== false,
          must_change_password: user.must_change_password || false,
          phone: user.phone || '',
          department: user.department || '',
          position: user.position || '',
          notes: user.notes || ''
        });
      } else {
        resetForm();
      }
    }
  }, [open, user]);
  
  const loadRoles = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAvailableRoles();
      if (response.success) {
        setRoles(response.roles);
      }
    } catch (error) {
      setError('Erreur lors du chargement des rôles');
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      role: '',
      is_active: true,
      must_change_password: false,
      phone: '',
      department: '',
      position: '',
      notes: ''
    });
    setPasswordData({
      password: '',
      password_confirmation: ''
    });
    setError(null);
  };
  
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === 'is_active' || name === 'must_change_password') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      const dataToSend = { ...formData };
      
      // Si c'est une création et qu'un mot de passe est fourni
      if (!user && passwordData.password) {
        dataToSend.password = passwordData.password;
        dataToSend.password_confirmation = passwordData.password_confirmation;
      }
      
      const response = user 
        ? await adminAPI.updateUser(user.id, dataToSend)
        : await adminAPI.createUser(dataToSend);
      
      if (response.success) {
        onSave();
        onClose();
      } else {
        setError(response.message || 'Une erreur est survenue');
      }
    } catch (error) {
      setError(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="username"
                  label="Nom d'utilisateur"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  fullWidth
                  margin="normal"
                  disabled={!!user}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  fullWidth
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="first_name"
                  label="Prénom"
                  value={formData.first_name}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="last_name"
                  label="Nom"
                  value={formData.last_name}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Rôle *</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    label="Rôle *"
                    required
                  >
                    <MenuItem value=""><em>Sélectionner un rôle</em></MenuItem>
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.name}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label="Téléphone"
                  value={formData.phone}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="department"
                  label="Département"
                  value={formData.department}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="position"
                  label="Poste"
                  value={formData.position}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                    />
                  }
                  label="Utilisateur actif"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      name="must_change_password"
                      checked={formData.must_change_password}
                      onChange={handleChange}
                    />
                  }
                  label="Doit changer le mot de passe à la prochaine connexion"
                />
              </Grid>
              
              {!user && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Mot de passe
                      </Typography>
                    </Divider>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="password"
                      label="Mot de passe"
                      type="password"
                      value={passwordData.password}
                      onChange={handlePasswordChange}
                      fullWidth
                      margin="normal"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="password_confirmation"
                      label="Confirmation du mot de passe"
                      type="password"
                      value={passwordData.password_confirmation}
                      onChange={handlePasswordChange}
                      fullWidth
                      margin="normal"
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  fullWidth
                  margin="normal"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={saving}
          >
            {user ? 'Mettre à jour' : 'Créer'}
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserModal;