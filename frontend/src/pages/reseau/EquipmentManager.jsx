// src/components/centres-sante/EquipmentManager.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Devices as DevicesIcon,
  LocalHospital as HospitalIcon,
  Science as ScienceIcon,
  Vaccines as VaccineIcon
} from '@mui/icons-material';

const EquipmentManager = ({ centreId, equipements, onUpdate }) => {
  const [equipmentList, setEquipmentList] = useState(equipements || []);
  const [newEquipment, setNewEquipment] = useState({
    nom: '',
    type: 'Médical',
    quantite: 1,
    etat: 'Fonctionnel',
    date_acquisition: new Date().toISOString().split('T')[0],
    date_maintenance: '',
    fabricant: '',
    modele: '',
    numero_serie: '',
    garantie: false,
    date_fin_garantie: ''
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const equipmentTypes = [
    'Médical',
    'Chirurgical',
    'Diagnostic',
    'Laboratoire',
    'Imagerie',
    'Mobilier',
    'Informatique',
    'Autre'
  ];

  const equipmentStates = [
    'Fonctionnel',
    'En maintenance',
    'En panne',
    'Hors service',
    'À réviser'
  ];

  const handleAddEquipment = () => {
    if (newEquipment.nom.trim()) {
      const updatedList = editingIndex !== null 
        ? equipmentList.map((item, index) => 
            index === editingIndex ? newEquipment : item
          )
        : [...equipmentList, newEquipment];
      
      setEquipmentList(updatedList);
      onUpdate(updatedList);
      resetForm();
      setShowAddDialog(false);
    }
  };

  const handleEditEquipment = (index) => {
    setNewEquipment(equipmentList[index]);
    setEditingIndex(index);
    setShowAddDialog(true);
  };

  const handleDeleteEquipment = (index) => {
    const updatedList = equipmentList.filter((_, i) => i !== index);
    setEquipmentList(updatedList);
    onUpdate(updatedList);
  };

  const resetForm = () => {
    setNewEquipment({
      nom: '',
      type: 'Médical',
      quantite: 1,
      etat: 'Fonctionnel',
      date_acquisition: new Date().toISOString().split('T')[0],
      date_maintenance: '',
      fabricant: '',
      modele: '',
      numero_serie: '',
      garantie: false,
      date_fin_garantie: ''
    });
    setEditingIndex(null);
  };

  const getEquipmentIcon = (type) => {
    switch(type) {
      case 'Médical': return <HospitalIcon />;
      case 'Chirurgical': return <VaccineIcon />;
      case 'Laboratoire': return <ScienceIcon />;
      default: return <DevicesIcon />;
    }
  };

  const getEquipmentColor = (etat) => {
    switch(etat) {
      case 'Fonctionnel': return 'success';
      case 'En maintenance': return 'warning';
      case 'En panne': return 'error';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          <DevicesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Gestion des équipements ({equipmentList.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setShowAddDialog(true);
          }}
        >
          Ajouter équipement
        </Button>
      </Box>

      {equipmentList.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Aucun équipement enregistré. Ajoutez vos premiers équipements.
        </Alert>
      ) : (
        <List>
          {equipmentList.map((equipement, index) => (
            <ListItem
              key={index}
              divider={index < equipmentList.length - 1}
              secondaryAction={
                <>
                  <IconButton edge="end" onClick={() => handleEditEquipment(index)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDeleteEquipment(index)}>
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getEquipmentIcon(equipement.type)}
                    <Typography variant="subtitle1">
                      {equipement.nom}
                    </Typography>
                    <Chip
                      label={equipement.type}
                      size="small"
                      variant="outlined"
                    />
                    {equipement.quantite > 1 && (
                      <Chip
                        label={`x${equipement.quantite}`}
                        size="small"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {equipement.fabricant} {equipement.modele && `• ${equipement.modele}`}
                      {equipement.numero_serie && ` • S/N: ${equipement.numero_serie}`}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={equipement.etat}
                        size="small"
                        color={getEquipmentColor(equipement.etat)}
                      />
                      {equipement.date_acquisition && (
                        <Typography variant="caption" color="text.secondary">
                          Acheté le: {new Date(equipement.date_acquisition).toLocaleDateString('fr-FR')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Statistiques */}
      {equipmentList.length > 0 && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Statistiques des équipements
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
              <Typography variant="h6">
                {equipmentList.reduce((sum, eq) => sum + eq.quantite, 0)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">
                Fonctionnels
              </Typography>
              <Typography variant="h6" color="success.main">
                {equipmentList.filter(eq => eq.etat === 'Fonctionnel').length}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">
                En maintenance
              </Typography>
              <Typography variant="h6" color="warning.main">
                {equipmentList.filter(eq => eq.etat === 'En maintenance').length}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">
                Hors service
              </Typography>
              <Typography variant="h6" color="error.main">
                {equipmentList.filter(eq => eq.etat === 'Hors service').length}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Dialog d'ajout/modification */}
      <Dialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          resetForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingIndex !== null ? 'Modifier l\'équipement' : 'Nouvel équipement'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Nom de l'équipement"
                value={newEquipment.nom}
                onChange={(e) => setNewEquipment({...newEquipment, nom: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newEquipment.type}
                  onChange={(e) => setNewEquipment({...newEquipment, type: e.target.value})}
                  label="Type"
                >
                  {equipmentTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantité"
                value={newEquipment.quantite}
                onChange={(e) => setNewEquipment({...newEquipment, quantite: parseInt(e.target.value) || 1})}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>État</InputLabel>
                <Select
                  value={newEquipment.etat}
                  onChange={(e) => setNewEquipment({...newEquipment, etat: e.target.value})}
                  label="État"
                >
                  {equipmentStates.map(etat => (
                    <MenuItem key={etat} value={etat}>{etat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Date d'acquisition"
                value={newEquipment.date_acquisition}
                onChange={(e) => setNewEquipment({...newEquipment, date_acquisition: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fabricant"
                value={newEquipment.fabricant}
                onChange={(e) => setNewEquipment({...newEquipment, fabricant: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Modèle"
                value={newEquipment.modele}
                onChange={(e) => setNewEquipment({...newEquipment, modele: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Numéro de série"
                value={newEquipment.numero_serie}
                onChange={(e) => setNewEquipment({...newEquipment, numero_serie: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newEquipment.garantie}
                    onChange={(e) => setNewEquipment({...newEquipment, garantie: e.target.checked})}
                  />
                }
                label="Sous garantie"
              />
            </Grid>
            {newEquipment.garantie && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date fin de garantie"
                  value={newEquipment.date_fin_garantie}
                  onChange={(e) => setNewEquipment({...newEquipment, date_fin_garantie: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Date de maintenance prévue"
                value={newEquipment.date_maintenance}
                onChange={(e) => setNewEquipment({...newEquipment, date_maintenance: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowAddDialog(false);
            resetForm();
          }}>
            Annuler
          </Button>
          <Button
            onClick={handleAddEquipment}
            variant="contained"
            disabled={!newEquipment.nom.trim()}
          >
            {editingIndex !== null ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EquipmentManager;