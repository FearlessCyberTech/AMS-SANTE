// src/components/admin/RoleModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { adminAPI } from '../../services/api';

const RoleModal = ({ open, onClose, role, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  useEffect(() => {
    if (open && role) {
      setFormData({
        name: role.name || '',
        description: role.description || ''
      });
    } else {
      resetForm();
    }
  }, [open, role]);
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
    setError(null);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      const response = role
        ? await adminAPI.updateRole(role.id, formData)
        : await adminAPI.createRole(formData);
      
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {role ? 'Modifier le rôle' : 'Nouveau rôle'}
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            name="name"
            label="Nom du rôle"
            value={formData.name}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
            disabled={role?.is_system}
          />
          
          <TextField
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={3}
            fullWidth
            margin="normal"
          />
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
            {role ? 'Mettre à jour' : 'Créer'}
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RoleModal;