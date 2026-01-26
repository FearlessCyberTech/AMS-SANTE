// src/pages/prestataires/PrestataireForm.jsx
import React, { useState, useEffect } from 'react';
import { TextField, MenuItem, Select, FormControl, InputLabel, FormHelperText, Checkbox, FormControlLabel } from '@mui/material';
import './prestataires.css';

const PrestataireForm = ({ prestataire, centres, pays, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    NOM_PRESTATAIRE: '',
    PRENOM_PRESTATAIRE: '',
    SPECIALITE: '',
    TITRE: '',
    TYPE_PRESTATAIRE: 'Medecin',
    TELEPHONE: '',
    EMAIL: '',
    COD_CEN: '',
    COD_PAY: '', // Ajout du champ pour le pays
    ACTIF: 1
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const typesPrestataires = [
    { value: 'Medecin', label: 'Médecin' },
    { value: 'Infirmier', label: 'Infirmier' },
    { value: 'Pharmacien', label: 'Pharmacien' },
    { value: 'Technicien', label: 'Technicien de laboratoire' },
    { value: 'Administratif', label: 'Personnel administratif' },
    { value: 'Aide-soignant', label: 'Aide-soignant' },
    { value: 'Sage-femme', label: 'Sage-femme' },
    { value: 'Chirurgien', label: 'Chirurgien' }
  ];

  useEffect(() => {
    if (prestataire) {
      setFormData({
        NOM_PRESTATAIRE: prestataire.NOM_PRESTATAIRE || '',
        PRENOM_PRESTATAIRE: prestataire.PRENOM_PRESTATAIRE || '',
        SPECIALITE: prestataire.SPECIALITE || '',
        TITRE: prestataire.TITRE || '',
        TYPE_PRESTATAIRE: prestataire.TYPE_PRESTATAIRE || 'Medecin',
        TELEPHONE: prestataire.TELEPHONE || '',
        EMAIL: prestataire.EMAIL || '',
        COD_CEN: prestataire.COD_CEN || '',
        COD_PAY: prestataire.COD_PAY || '', // Récupération du pays
        ACTIF: prestataire.ACTIF || 1
      });
    }
  }, [prestataire]);

  // S'assurer que la valeur du pays est valide
  useEffect(() => {
    if (formData.COD_PAY && pays && pays.length > 0) {
      const paysExists = pays.find(p => p.COD_PAY === formData.COD_PAY);
      if (!paysExists) {
        setFormData(prev => ({ ...prev, COD_PAY: '' }));
      }
    }
  }, [pays, formData.COD_PAY]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.NOM_PRESTATAIRE.trim()) {
      newErrors.NOM_PRESTATAIRE = 'Le nom est obligatoire';
    }
    
    if (!formData.TYPE_PRESTATAIRE) {
      newErrors.TYPE_PRESTATAIRE = 'Le type de prestataire est obligatoire';
    }

    if (formData.EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.EMAIL)) {
      newErrors.EMAIL = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erreur soumission:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="prestataire-form-container">
      <h2>{prestataire ? 'Modifier le prestataire' : 'Nouveau prestataire'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group mb-3">
              <FormControl fullWidth error={!!errors.NOM_PRESTATAIRE}>
                <TextField
                  label="Nom *"
                  name="NOM_PRESTATAIRE"
                  value={formData.NOM_PRESTATAIRE}
                  onChange={handleChange}
                  placeholder="Nom du prestataire"
                  error={!!errors.NOM_PRESTATAIRE}
                  helperText={errors.NOM_PRESTATAIRE}
                  required
                />
              </FormControl>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="form-group mb-3">
              <TextField
                label="Prénom"
                name="PRENOM_PRESTATAIRE"
                value={formData.PRENOM_PRESTATAIRE}
                onChange={handleChange}
                placeholder="Prénom du prestataire"
                fullWidth
              />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="form-group mb-3">
              <FormControl fullWidth error={!!errors.TYPE_PRESTATAIRE}>
                <InputLabel id="type-prestataire-label">Type de prestataire *</InputLabel>
                <Select
                  labelId="type-prestataire-label"
                  label="Type de prestataire *"
                  name="TYPE_PRESTATAIRE"
                  value={formData.TYPE_PRESTATAIRE}
                  onChange={handleChange}
                  error={!!errors.TYPE_PRESTATAIRE}
                >
                  {typesPrestataires.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.TYPE_PRESTATAIRE && (
                  <FormHelperText error>{errors.TYPE_PRESTATAIRE}</FormHelperText>
                )}
              </FormControl>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="form-group mb-3">
              <TextField
                label="Spécialité"
                name="SPECIALITE"
                value={formData.SPECIALITE}
                onChange={handleChange}
                placeholder="Spécialité médicale"
                fullWidth
              />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="form-group mb-3">
              <TextField
                label="Titre"
                name="TITRE"
                value={formData.TITRE}
                onChange={handleChange}
                placeholder="Docteur, Professeur, etc."
                fullWidth
              />
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="form-group mb-3">
              <FormControl fullWidth>
                <InputLabel id="pays-label">Pays</InputLabel>
                <Select
                  labelId="pays-label"
                  label="Pays"
                  name="COD_PAY"
                  value={formData.COD_PAY || ''}
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Sélectionner un pays</em>
                  </MenuItem>
                  {/* CORRECTION : Ne pas utiliser Fragment, directement les MenuItem */}
                  {pays && pays.map(paysItem => (
                    <MenuItem key={paysItem.COD_PAY} value={paysItem.COD_PAY}>
                      {paysItem.NOM_PAY}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="form-group mb-3">
              <FormControl fullWidth>
                <InputLabel id="centre-label">Centre de santé</InputLabel>
                <Select
                  labelId="centre-label"
                  label="Centre de santé"
                  name="COD_CEN"
                  value={formData.COD_CEN || ''}
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Sélectionner un centre</em>
                  </MenuItem>
                  {centres.map(centre => (
                    <MenuItem key={centre.COD_CEN} value={centre.COD_CEN}>
                      {centre.NOM_CENTRE}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="form-group mb-3">
              <TextField
                label="Téléphone"
                name="TELEPHONE"
                value={formData.TELEPHONE}
                onChange={handleChange}
                placeholder="Téléphone"
                fullWidth
              />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="form-group mb-3">
              <TextField
                label="Email"
                name="EMAIL"
                value={formData.EMAIL}
                onChange={handleChange}
                placeholder="Email"
                error={!!errors.EMAIL}
                helperText={errors.EMAIL}
                fullWidth
              />
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="form-group mb-3">
              <FormControlLabel
                control={
                  <Checkbox
                    name="ACTIF"
                    checked={formData.ACTIF === 1}
                    onChange={handleChange}
                  />
                }
                label="Prestataire actif"
              />
            </div>
          </div>
        </div>

        <div className="form-actions mt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary ms-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrestataireForm;