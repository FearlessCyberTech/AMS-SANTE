// src/components/admin/PermissionModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Box,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Typography,
  Divider,
  Chip,
  TextField,
  InputAdornment
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import SearchIcon from '@mui/icons-material/Search';
import { adminAPI } from '../../services/api';

const PermissionModal = ({ open, onClose, role, permissions, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupedPermissions, setGroupedPermissions] = useState({});
  
  useEffect(() => {
    if (open && role) {
      loadRolePermissions();
      groupPermissions();
    }
  }, [open, role, permissions]);
  
  const loadRolePermissions = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getRolePermissions(role.id);
      if (response.success) {
        setRolePermissions(response.permissions.map(p => p.id || p.name));
      }
    } catch (error) {
      setError('Erreur lors du chargement des permissions');
    } finally {
      setLoading(false);
    }
  };
  
  const groupPermissions = () => {
    const grouped = {};
    permissions.forEach(permission => {
      const [module] = permission.name.split('.');
      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push(permission);
    });
    setGroupedPermissions(grouped);
  };
  
  const handlePermissionToggle = (permissionId) => {
    setRolePermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };
  
  const handleSelectAll = (module) => {
    const modulePermissions = groupedPermissions[module] || [];
    const modulePermissionIds = modulePermissions.map(p => p.id || p.name);
    
    const allSelected = modulePermissionIds.every(id => 
      rolePermissions.includes(id)
    );
    
    if (allSelected) {
      // Désélectionner tous
      setRolePermissions(prev =>
        prev.filter(id => !modulePermissionIds.includes(id))
      );
    } else {
      // Sélectionner tous
      setRolePermissions(prev => [
        ...prev.filter(id => !modulePermissionIds.includes(id)),
        ...modulePermissionIds
      ]);
    }
  };
  
  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await adminAPI.assignPermissionsToRole(
        role.id,
        rolePermissions
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
  
  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Permissions du rôle: {role?.name}
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
          <>
            <TextField
              fullWidth
              placeholder="Rechercher des permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            
            <Box sx={{ maxHeight: 400, overflow: 'auto', mt: 2 }}>
              {searchTerm ? (
                <List>
                  {filteredPermissions.map((permission) => (
                    <ListItem key={permission.id || permission.name} dense>
                      <Checkbox
                        checked={rolePermissions.includes(permission.id || permission.name)}
                        onChange={() => handlePermissionToggle(permission.id || permission.name)}
                      />
                      <ListItemText
                        primary={permission.name}
                        secondary={permission.description}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                  <Box key={module} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {module.toUpperCase()}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => handleSelectAll(module)}
                      >
                        {modulePermissions.every(p => 
                          rolePermissions.includes(p.id || p.name)
                        ) ? 'Tout décocher' : 'Tout cocher'}
                      </Button>
                    </Box>
                    
                    <Divider sx={{ mb: 1 }} />
                    
                    <List dense>
                      {modulePermissions.map((permission) => (
                        <ListItem key={permission.id || permission.name}>
                          <Checkbox
                            checked={rolePermissions.includes(permission.id || permission.name)}
                            onChange={() => handlePermissionToggle(permission.id || permission.name)}
                          />
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2">
                                  {permission.name.split('.').slice(1).join('.')}
                                </Typography>
                                <Chip
                                  label={permission.type || 'action'}
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              </Box>
                            }
                            secondary={permission.description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ))
              )}
            </Box>
            
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {rolePermissions.length} permission(s) sélectionnée(s)
              </Typography>
            </Box>
          </>
        )}
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

export default PermissionModal;