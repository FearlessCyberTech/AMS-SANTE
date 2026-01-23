// src/components/admin/BackupModal.jsx
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
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { adminAPI } from '../../services/api';

const BackupModal = ({ open, onClose, backup, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [action, setAction] = useState(backup ? 'restore' : 'create');
  const [formData, setFormData] = useState({
    description: '',
    include_data: true,
    include_files: true,
    compress: true
  });
  
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, backup]);
  
  const resetForm = () => {
    setFormData({
      description: '',
      include_data: true,
      include_files: true,
      compress: true
    });
    setError(null);
    setProgress(0);
  };
  
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'description' ? value : checked
    }));
  };
  
  const handleCreateBackup = async () => {
    setSaving(true);
    setProgress(0);
    
    // Simulation de progression
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);
    
    try {
      const response = await adminAPI.createBackup(formData);
      clearInterval(interval);
      setProgress(100);
      
      if (response.success) {
        setTimeout(() => {
          onSave();
          onClose();
        }, 1000);
      } else {
        setError(response.message);
      }
    } catch (error) {
      clearInterval(interval);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleRestoreBackup = async () => {
    if (!window.confirm(
      '⚠️ ATTENTION: La restauration écrasera les données actuelles.\n' +
      'Cette action est irréversible. Confirmez-vous la restauration ?'
    )) {
      return;
    }
    
    setSaving(true);
    setProgress(0);
    
    try {
      const response = await adminAPI.restoreBackup(backup.id, {
        confirm: true
      });
      
      if (response.success) {
        setProgress(100);
        setTimeout(() => {
          onSave();
          onClose();
        }, 2000);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };
  
  const getBackupStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon color="success" />;
      case 'failed': return <ErrorIcon color="error" />;
      case 'in_progress': return <WarningIcon color="warning" />;
      default: return <BackupIcon />;
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {backup ? `Sauvegarde: ${backup.description}` : 'Nouvelle sauvegarde'}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {progress > 0 && progress < 100 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Progression: {progress}%
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        )}
        
        {backup ? (
          <>
            <List>
              <ListItem>
                <ListItemIcon>
                  {getBackupStatusIcon(backup.status)}
                </ListItemIcon>
                <ListItemText
                  primary="Statut"
                  secondary={
                    <Chip
                      label={backup.status}
                      color={
                        backup.status === 'completed' ? 'success' :
                        backup.status === 'failed' ? 'error' : 'warning'
                      }
                      size="small"
                    />
                  }
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <ScheduleIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Date de création"
                  secondary={format(new Date(backup.created_at), 'PPPpp', { locale: fr })}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <BackupIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Taille"
                  secondary={backup.size || 'Inconnue'}
                />
              </ListItem>
              
              {backup.notes && (
                <ListItem>
                  <ListItemText
                    primary="Notes"
                    secondary={backup.notes}
                  />
                </ListItem>
              )}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              La restauration écrasera toutes les données actuelles.
              Assurez-vous d'avoir une sauvegarde récente avant de continuer.
            </Alert>
          </>
        ) : (
          <>
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              margin="normal"
              placeholder="Ex: Sauvegarde avant mise à jour majeure"
            />
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Options de sauvegarde
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Inclure les données"
                  secondary="Base de données complète"
                />
                <Chip label="Recommandé" size="small" color="primary" />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Inclure les fichiers"
                  secondary="Documents, images, configurations"
                />
                <Chip label="Optionnel" size="small" />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Compresser"
                  secondary="Réduit la taille de la sauvegarde"
                />
                <Chip label="Recommandé" size="small" color="primary" />
              </ListItem>
            </List>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              La sauvegarde peut prendre plusieurs minutes selon la taille des données.
            </Alert>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        {backup ? (
          <>
            <Button
              startIcon={<DownloadIcon />}
              disabled={saving}
            >
              Télécharger
            </Button>
            <LoadingButton
              variant="contained"
              color="warning"
              startIcon={<RestoreIcon />}
              onClick={handleRestoreBackup}
              loading={saving}
            >
              Restaurer
            </LoadingButton>
          </>
        ) : (
          <LoadingButton
            variant="contained"
            startIcon={<BackupIcon />}
            onClick={handleCreateBackup}
            loading={saving}
          >
            Créer la sauvegarde
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BackupModal;