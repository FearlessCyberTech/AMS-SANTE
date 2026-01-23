// src/components/admin/SecurityModal.jsx
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
  Grid,
  Switch,
  FormControlLabel,
  Slider,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  Security as SecurityIcon,
  Lock as LockIcon,
  VpnKey as VpnKeyIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';

const SecurityModal = ({ open, onClose, type, data, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [policy, setPolicy] = useState({
    min_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special: true,
    max_age_days: 90,
    history_size: 5,
    max_login_attempts: 5,
    lockout_duration: 30,
    require_2fa: false
  });
  
  useEffect(() => {
    if (open) {
      loadPolicy();
    }
  }, [open]);
  
  const loadPolicy = async () => {
    try {
      const response = await adminAPI.getPasswordPolicy();
      if (response.success && response.policy) {
        setPolicy(response.policy);
      }
    } catch (error) {
      console.error('Erreur chargement politique:', error);
    }
  };
  
  const handlePolicyChange = (field, value) => {
    setPolicy(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await adminAPI.updatePasswordPolicy(policy);
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
  
  const renderContent = () => {
    switch (type) {
      case 'policy':
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Politique de mot de passe
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography gutterBottom>
                  Longueur minimale: {policy.min_length} caractères
                </Typography>
                <Slider
                  value={policy.min_length}
                  onChange={(e, value) => handlePolicyChange('min_length', value)}
                  min={6}
                  max={20}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policy.require_uppercase}
                      onChange={(e) => handlePolicyChange('require_uppercase', e.target.checked)}
                    />
                  }
                  label="Majuscule requise"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policy.require_lowercase}
                      onChange={(e) => handlePolicyChange('require_lowercase', e.target.checked)}
                    />
                  }
                  label="Minuscule requise"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policy.require_numbers}
                      onChange={(e) => handlePolicyChange('require_numbers', e.target.checked)}
                    />
                  }
                  label="Chiffre requis"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policy.require_special}
                      onChange={(e) => handlePolicyChange('require_special', e.target.checked)}
                    />
                  }
                  label="Caractère spécial"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography gutterBottom>
                  Durée maximale: {policy.max_age_days} jours
                </Typography>
                <Slider
                  value={policy.max_age_days}
                  onChange={(e, value) => handlePolicyChange('max_age_days', value)}
                  min={30}
                  max={365}
                  marks={[
                    { value: 30, label: '30j' },
                    { value: 90, label: '90j' },
                    { value: 180, label: '180j' },
                    { value: 365, label: '365j' }
                  ]}
                  valueLabelDisplay="auto"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography gutterBottom>
                  Historique: {policy.history_size} mots de passe
                </Typography>
                <Slider
                  value={policy.history_size}
                  onChange={(e, value) => handlePolicyChange('history_size', value)}
                  min={0}
                  max={10}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
            </Grid>
          </>
        );
        
      case 'block_ip':
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Bloquer une adresse IP
            </Typography>
            
            <TextField
              fullWidth
              label="Adresse IP"
              placeholder="Ex: 192.168.1.1"
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Raison du blocage"
              multiline
              rows={3}
              placeholder="Ex: Tentatives de connexion suspectes"
              margin="normal"
            />
            
            <Alert severity="warning" sx={{ mt: 2 }}>
              Cette IP sera bloquée immédiatement et ne pourra plus accéder au système.
            </Alert>
          </>
        );
        
      default:
        return (
          <Typography color="text.secondary">
            Sélectionnez une action de sécurité
          </Typography>
        );
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Sécurité
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {renderContent()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSubmit}
          loading={saving}
        >
          Enregistrer
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default SecurityModal;