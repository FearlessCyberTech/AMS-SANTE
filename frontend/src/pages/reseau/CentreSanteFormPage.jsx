import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  FormHelperText
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { centresAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CentreSanteFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    type: '',
    categorie: '',
    statut: 'Actif',
    adresse: '',
    ville: '',
    region: '',
    pays: '',
    telephone: '',
    email: '',
    capacite_lits: '',
    capacite_urgences: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      loadCentre();
    }
  }, [id]);

  const loadCentre = async () => {
    try {
      setLoading(true);
      const response = await centresAPI.getById(id);
      if (response.success) {
        const centre = response.centre || response.data;
        setFormData({
          nom: centre.nom || centre.NOM_CENTRE || '',
          code: centre.code || centre.CODE_CENTRE || '',
          type: centre.type || centre.TYPE_CENTRE || '',
          categorie: centre.categorie || centre.CATEGORIE_CENTRE || '',
          statut: centre.statut || centre.STATUT || 'Actif',
          adresse: centre.adresse || centre.ADRESSE || '',
          ville: centre.ville || centre.VILLE || '',
          region: centre.region || centre.REGION || '',
          pays: centre.pays || centre.PAYS || '',
          telephone: centre.telephone || centre.TELEPHONE || '',
          email: centre.email || centre.EMAIL || '',
          capacite_lits: centre.capacite_lits || centre.capacite_lits || '',
          capacite_urgences: centre.capacite_urgences || centre.capacite_urgences || ''
        });
      } else {
        setError(response.message);
      }
    } catch (error) {
      console.error('❌ Erreur chargement centre:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (!formData.type.trim()) newErrors.type = 'Le type est requis';
    if (!formData.ville.trim()) newErrors.ville = 'La ville est requise';
    if (!formData.telephone.trim()) newErrors.telephone = 'Le téléphone est requis';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const dataToSend = {
        NOM_CENTRE: formData.nom,
        CODE_CENTRE: formData.code,
        TYPE_CENTRE: formData.type,
        CATEGORIE_CENTRE: formData.categorie,
        STATUT: formData.statut,
        ADRESSE: formData.adresse,
        VILLE: formData.ville,
        REGION: formData.region,
        PAYS: formData.pays,
        TELEPHONE: formData.telephone,
        EMAIL: formData.email,
        CAPACITE_LITS: parseInt(formData.capacite_lits) || 0,
        CAPACITE_URGENCES: parseInt(formData.capacite_urgences) || 0
      };

      let response;
      if (isEdit) {
        response = await centresAPI.update(id, dataToSend);
      } else {
        response = await centresAPI.create(dataToSend);
      }

      if (response.success) {
        navigate('/centres-sante', {
          state: {
            message: isEdit 
              ? 'Centre modifié avec succès' 
              : 'Centre créé avec succès'
          }
        });
      } else {
        setError(response.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('❌ Erreur enregistrement:', error);
      setError(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/centres-sante')}
          sx={{ mr: 2 }}
        >
          Retour
        </Button>
        <Typography variant="h4" component="h1">
          {isEdit ? 'Modifier le centre' : 'Nouveau centre'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Informations de base */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Informations de base
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom du centre *"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                error={!!errors.nom}
                helperText={errors.nom}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Code *"
                name="code"
                value={formData.code}
                onChange={handleChange}
                error={!!errors.code}
                helperText={errors.code}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.type} disabled={saving}>
                <InputLabel>Type *</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  label="Type *"
                  onChange={handleChange}
                >
                  <MenuItem value="Hôpital">Hôpital</MenuItem>
                  <MenuItem value="Clinique">Clinique</MenuItem>
                  <MenuItem value="Centre de santé">Centre de santé</MenuItem>
                  <MenuItem value="Dispensaire">Dispensaire</MenuItem>
                  <MenuItem value="Laboratoire">Laboratoire</MenuItem>
                  <MenuItem value="Pharmacie">Pharmacie</MenuItem>
                </Select>
                {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={saving}>
                <InputLabel>Catégorie</InputLabel>
                <Select
                  name="categorie"
                  value={formData.categorie}
                  label="Catégorie"
                  onChange={handleChange}
                >
                  <MenuItem value="Public">Public</MenuItem>
                  <MenuItem value="Privé">Privé</MenuItem>
                  <MenuItem value="Mixte">Mixte</MenuItem>
                  <MenuItem value="Associatif">Associatif</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={saving}>
                <InputLabel>Statut</InputLabel>
                <Select
                  name="statut"
                  value={formData.statut}
                  label="Statut"
                  onChange={handleChange}
                >
                  <MenuItem value="Actif">Actif</MenuItem>
                  <MenuItem value="Inactif">Inactif</MenuItem>
                  <MenuItem value="En travaux">En travaux</MenuItem>
                  <MenuItem value="Fermé">Fermé</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Localisation */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Localisation
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                disabled={saving}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ville *"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                error={!!errors.ville}
                helperText={errors.ville}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Région"
                name="region"
                value={formData.region}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pays"
                name="pays"
                value={formData.pays}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>

            {/* Contact */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Contact
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Téléphone *"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                error={!!errors.telephone}
                helperText={errors.telephone}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>

            {/* Capacité */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Capacité
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre de lits"
                name="capacite_lits"
                type="number"
                value={formData.capacite_lits}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacité urgences"
                name="capacite_urgences"
                type="number"
                value={formData.capacite_urgences}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>

            {/* Actions */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/centres-sante')}
                  disabled={saving}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default CentreSanteFormPage;