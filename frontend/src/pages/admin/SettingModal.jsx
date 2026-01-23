// src/components/admin/SettingModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { adminAPI } from '../../services/api';

const SettingModal = ({ open, onClose, setting, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    value: '',
    description: ''
  });
  
  useEffect(() => {
    if (open && setting) {
      setFormData({
        value: setting.value || '',
        description: setting.description || ''
      });
    }
  }, [open, setting]);
  
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === 'value' && setting?.type === 'boolean') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      const response = await adminAPI.updateSetting(
        setting.key,
        formData.value,
        formData.description
      );
      
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
  
  const handleReset = async () => {
    if (!window.confirm('Réinitialiser ce paramètre à sa valeur par défaut ?')) {
      return;
    }
    
    setSaving(true);
    try {
      const response = await adminAPI.resetSettingToDefault(setting.key);
      if (response.success) {
        onSave();
        onClose();
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };
  
  const renderInput = () => {
    if (!setting) return null;
    
    switch (setting.type) {
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={formData.value === 'true' || formData.value === true}
                onChange={handleChange}
                name="value"
              />
            }
            label="Activé"
          />
        );
      
      case 'select':
        return (
          <FormControl fullWidth margin="normal">
            <InputLabel>Valeur</InputLabel>
            <Select
              name="value"
              value={formData.value}
              onChange={handleChange}
              label="Valeur"
            >
              {setting.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      case 'number':
        return (
          <TextField
            name="value"
            label="Valeur"
            type="number"
            value={formData.value}
            onChange={handleChange}
            fullWidth
            margin="normal"
            inputProps={{ step: setting.step || 1 }}
          />
        );
      
      case 'text':
      default:
        return (
          <TextField
            name="value"
            label="Valeur"
            value={formData.value}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline={setting.multiline}
            rows={setting.multiline ? 4 : 1}
          />
        );
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {setting?.key}
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {setting && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Catégorie: {setting.category}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: {setting.type}
                </Typography>
                {setting.default_value && (
                  <Typography variant="body2" color="text.secondary">
                    Valeur par défaut: {setting.default_value}
                  </Typography>
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {renderInput()}
              
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={2}
                fullWidth
                margin="normal"
              />
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          {setting && (
            <Button
              onClick={handleReset}
              color="warning"
              disabled={saving}
            >
              Réinitialiser
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={saving}
          >
            Enregistrer
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SettingModal;