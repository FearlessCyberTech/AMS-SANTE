// src/pages/prestataires/PrestataireForm.jsx
import React, { useState, useEffect } from 'react';
import './prestataires.css';

const PrestataireForm = ({ prestataire, centres, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    NOM_PRESTATAIRE: '',
    PRENOM_PRESTATAIRE: '',
    SPECIALITE: '',
    TITRE: '',
    TYPE_PRESTATAIRE: 'Medecin',
    TELEPHONE: '',
    EMAIL: '',
    COD_CEN: '',
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
        ACTIF: prestataire.ACTIF || 1
      });
    }
  }, [prestataire]);

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
              <label className="form-label required">Nom</label>
              <input
                type="text"
                className={`form-control ${errors.NOM_PRESTATAIRE ? 'is-invalid' : ''}`}
                name="NOM_PRESTATAIRE"
                value={formData.NOM_PRESTATAIRE}
                onChange={handleChange}
                placeholder="Nom du prestataire"
              />
              {errors.NOM_PRESTATAIRE && (
                <div className="invalid-feedback">{errors.NOM_PRESTATAIRE}</div>
              )}
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Prénom</label>
              <input
                type="text"
                className="form-control"
                name="PRENOM_PRESTATAIRE"
                value={formData.PRENOM_PRESTATAIRE}
                onChange={handleChange}
                placeholder="Prénom du prestataire"
              />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label required">Type de prestataire</label>
              <select
                className={`form-select ${errors.TYPE_PRESTATAIRE ? 'is-invalid' : ''}`}
                name="TYPE_PRESTATAIRE"
                value={formData.TYPE_PRESTATAIRE}
                onChange={handleChange}
              >
                <option value="">Sélectionner un type</option>
                {typesPrestataires.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.TYPE_PRESTATAIRE && (
                <div className="invalid-feedback">{errors.TYPE_PRESTATAIRE}</div>
              )}
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Spécialité</label>
              <input
                type="text"
                className="form-control"
                name="SPECIALITE"
                value={formData.SPECIALITE}
                onChange={handleChange}
                placeholder="Spécialité médicale"
              />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Titre</label>
              <input
                type="text"
                className="form-control"
                name="TITRE"
                value={formData.TITRE}
                onChange={handleChange}
                placeholder="Docteur, Professeur, etc."
              />
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Centre de santé</label>
              <select
                className="form-select"
                name="COD_CEN"
                value={formData.COD_CEN}
                onChange={handleChange}
              >
                <option value="">Sélectionner un centre</option>
                {centres.map(centre => (
                  <option key={centre.COD_CEN} value={centre.COD_CEN}>
                    {centre.NOM_CENTRE}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Téléphone</label>
              <input
                type="tel"
                className="form-control"
                name="TELEPHONE"
                value={formData.TELEPHONE}
                onChange={handleChange}
                placeholder="Téléphone"
              />
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-control ${errors.EMAIL ? 'is-invalid' : ''}`}
                name="EMAIL"
                value={formData.EMAIL}
                onChange={handleChange}
                placeholder="Email"
              />
              {errors.EMAIL && (
                <div className="invalid-feedback">{errors.EMAIL}</div>
              )}
            </div>
          </div>
        </div>

        <div className="form-group mb-4">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="actif"
              name="ACTIF"
              checked={formData.ACTIF === 1}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="actif">
              Prestataire actif
            </label>
          </div>
        </div>

        <div className="form-actions">
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
            className="btn btn-primary"
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