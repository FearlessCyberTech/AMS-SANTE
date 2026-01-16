// src/pages/Administration/UsersManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Simulation - à remplacer par une vraie API
      const mockUsers = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          status: 'active',
          lastLogin: '2024-12-01 10:30:00',
          createdAt: '2024-01-01'
        },
        {
          id: 2,
          username: 'medecin1',
          email: 'medecin@example.com',
          role: 'doctor',
          status: 'active',
          lastLogin: '2024-12-01 09:15:00',
          createdAt: '2024-02-15'
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      showSnackbar('Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (userId) => {
    try {
      // API call to toggle user status
      showSnackbar('Statut utilisateur mis à jour', 'success');
      loadUsers();
    } catch (error) {
      showSnackbar('Erreur mise à jour statut', 'error');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestion des utilisateurs</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
            sx={{ mr: 2 }}
          >
            Rafraîchir
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
          >
            Nouvel utilisateur
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                placeholder="Rechercher utilisateur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Chip label={`Total: ${users.length}`} color="primary" />
                <Chip 
                  label={`Actifs: ${users.filter(u => u.status === 'active').length}`} 
                  color="success" 
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom d'utilisateur</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Dernière connexion</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.role} 
                    color={user.role === 'admin' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.status === 'active' ? 'Actif' : 'Inactif'}
                    color={user.status === 'active' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.lastLogin}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEditUser(user)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleToggleStatus(user.id)}>
                    {user.status === 'active' ? <LockIcon /> : <LockOpenIcon />}
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Modifier utilisateur' : 'Nouvel utilisateur'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nom d'utilisateur"
            margin="normal"
            defaultValue={selectedUser?.username || ''}
          />
          <TextField
            fullWidth
            label="Email"
            margin="normal"
            defaultValue={selectedUser?.email || ''}
          />
          <TextField
            fullWidth
            select
            label="Rôle"
            margin="normal"
            defaultValue={selectedUser?.role || 'user'}
          >
            <MenuItem value="admin">Administrateur</MenuItem>
            <MenuItem value="doctor">Médecin</MenuItem>
            <MenuItem value="nurse">Infirmier</MenuItem>
            <MenuItem value="accountant">Comptable</MenuItem>
            <MenuItem value="user">Utilisateur</MenuItem>
          </TextField>
          {!selectedUser && (
            <TextField
              fullWidth
              type="password"
              label="Mot de passe"
              margin="normal"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={() => {
            showSnackbar(selectedUser ? 'Utilisateur mis à jour' : 'Utilisateur créé', 'success');
            setDialogOpen(false);
            loadUsers();
          }}>
            {selectedUser ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default UsersManagement;