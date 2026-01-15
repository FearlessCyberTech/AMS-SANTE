import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Edit, Trash2, User, Download, 
  RefreshCw, ChevronLeft, ChevronRight,
  Users, Phone, Mail, UserPlus, Save, X, 
  Loader2, CheckCircle, AlertCircle, FileText
} from 'lucide-react';
import { beneficiairesAPI, patientsAPI, paysAPI, searchPatientsFallback } from '../../services/api';
import './Beneficiaires.css';

const Beneficiaires = () => {
  // États principaux
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Données de référence
  const [paysList, setPaysList] = useState([]);
  const [assuresPrincipaux, setAssuresPrincipaux] = useState([]);
  const [rechercheAssure, setRechercheAssure] = useState('');
  const [resultatsRechercheAssure, setResultatsRechercheAssure] = useState([]);

  const statutAceOptions = [
    { value: 'Principal', label: 'Assuré Principal' },
    { value: 'Conjoint', label: 'Conjoint/Conjointe' },
    { value: 'Enfant', label: 'Enfant' },
    { value: 'Autre', label: 'Autre ayant droit' }
  ];

  // Données du formulaire - SEULEMENT LES CHAMPS OBLIGATOIRES
  const [formData, setFormData] = useState({
    // Données obligatoires
    NOM_BEN: '',
    PRE_BEN: '',
    SEX_BEN: 'M',
    NAI_BEN: '',
    TELEPHONE_MOBILE: '',
    COD_PAY: 'CMF',
    STATUT_ACE: 'Principal',
    
    // Informations d'identification
    IDENTIFIANT_NATIONAL: '',
    NUM_PASSEPORT: '',
    
    // Autres champs optionnels fréquents
    EMAIL: '',
    PROFESSION: '',
    ID_ASSURE_PRINCIPAL: null,
    LIEU_NAISSANCE: '',
    GROUPE_SANGUIN: '',
    RHESUS: '+',
    SITUATION_FAMILIALE: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Charger les données de référence
  const loadReferenceData = useCallback(async () => {
    try {
      // Charger les pays
      const paysResponse = await paysAPI.getAll();
      if (paysResponse.success) {
        setPaysList(paysResponse.pays || []);
      }
    } catch (error) {
      console.error('Erreur chargement données de référence:', error);
    }
  }, []);

  // Charger les assurés principaux
  const loadAssuresPrincipaux = useCallback(async () => {
    try {
      const response = await patientsAPI.getAll(1000);
      if (response.success) {
        const assuresPrincipauxList = response.patients?.filter(p => 
          p.STATUT_ACE === 'Principal' || !p.STATUT_ACE
        ) || [];
        setAssuresPrincipaux(assuresPrincipauxList);
      }
    } catch (error) {
      console.error('Erreur chargement assurés principaux:', error);
    }
  }, []);

  // Rechercher un assuré principal
  const rechercherAssurePrincipal = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResultatsRechercheAssure([]);
      return;
    }
    
    try {
      const response = await searchPatientsFallback(
        searchTerm, 
        { STATUT_ACE: 'Principal' }, 
        10
      );
      
      if (response.success) {
        setResultatsRechercheAssure(response.patients || []);
      } else {
        const filtered = assuresPrincipaux.filter(p => 
          p.NOM_BEN?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.PRE_BEN?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setResultatsRechercheAssure(filtered.slice(0, 10));
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      setResultatsRechercheAssure([]);
    }
  }, [assuresPrincipaux]);

  // Charger les bénéficiaires
  const loadBeneficiaires = useCallback(async () => {
    try {
      setLoading(true);
      const response = await patientsAPI.getAll(1000);
      
      if (response.success) {
        const patients = response.patients || [];
        setBeneficiaires(patients);
      } else {
        showNotification('Erreur lors du chargement des bénéficiaires', 'error');
      }
    } catch (error) {
      console.error('Erreur chargement bénéficiaires:', error);
      showNotification('Erreur de connexion avec le serveur', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Effet pour charger les données
  useEffect(() => {
    loadBeneficiaires();
    loadReferenceData();
    loadAssuresPrincipaux();
  }, [loadBeneficiaires, loadReferenceData, loadAssuresPrincipaux]);

  // Effet pour la recherche d'assuré principal
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (rechercheAssure) {
        rechercherAssurePrincipal(rechercheAssure);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [rechercheAssure, rechercherAssurePrincipal]);

  // Gestion des changements de formulaire
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const errors = {};
    
    // Validation des champs obligatoires
    if (!formData.NOM_BEN.trim()) errors.NOM_BEN = 'Le nom est requis';
    if (!formData.PRE_BEN.trim()) errors.PRE_BEN = 'Le prénom est requis';
    if (!formData.SEX_BEN) errors.SEX_BEN = 'Le sexe est requis';
    if (!formData.NAI_BEN) errors.NAI_BEN = 'La date de naissance est requise';
    if (!formData.TELEPHONE_MOBILE.trim()) errors.TELEPHONE_MOBILE = 'Le téléphone mobile est requis';
    if (!formData.STATUT_ACE) errors.STATUT_ACE = 'Le statut ACE est requis';
    
    // Validation de la date
    if (formData.NAI_BEN) {
      const birthDate = new Date(formData.NAI_BEN);
      const today = new Date();
      if (birthDate > today) {
        errors.NAI_BEN = 'La date de naissance ne peut pas être dans le futur';
      }
    }
    
    // Validation téléphone
    const phoneRegex = /^[\d\s\+\(\)\-]{8,}$/;
    if (formData.TELEPHONE_MOBILE && !phoneRegex.test(formData.TELEPHONE_MOBILE)) {
      errors.TELEPHONE_MOBILE = 'Numéro de téléphone invalide';
    }
    
    // Validation pour les ayants droit
    if (formData.STATUT_ACE !== 'Principal' && !formData.ID_ASSURE_PRINCIPAL) {
      errors.ID_ASSURE_PRINCIPAL = 'L\'assuré principal est requis pour les ayants droit';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Sauvegarder le bénéficiaire
  const handleSave = async () => {
    if (!validateForm()) {
      showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
      return;
    }

    setSaving(true);
    
    try {
      // Préparer les données
      const dataToSave = {
        ...formData,
        NAI_BEN: formData.NAI_BEN ? new Date(formData.NAI_BEN).toISOString().split('T')[0] : null,
        NOMBRE_ENFANTS: 0,
        COD_PAI: 1,
        ACCES_EAU: 1,
        ACCES_ELECTRICITE: 1,
        DISTANCE_CENTRE_SANTE: 0
      };

      let response;
      
      if (editingId) {
        response = await patientsAPI.update(editingId, dataToSave);
      } else {
        response = await patientsAPI.create(dataToSave);
      }

      if (response.success) {
        showNotification(
          editingId 
            ? 'Bénéficiaire mis à jour avec succès' 
            : 'Bénéficiaire créé avec succès',
          'success'
        );
        
        resetForm();
        loadBeneficiaires();
      } else {
        showNotification(
          response.message || 'Erreur lors de la sauvegarde',
          'error'
        );
      }
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      showNotification('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Réinitialiser formulaire
  const resetForm = () => {
    setFormData({
      NOM_BEN: '',
      PRE_BEN: '',
      SEX_BEN: 'M',
      NAI_BEN: '',
      TELEPHONE_MOBILE: '',
      COD_PAY: 'CMF',
      STATUT_ACE: 'Principal',
      IDENTIFIANT_NATIONAL: '',
      NUM_PASSEPORT: '',
      EMAIL: '',
      PROFESSION: '',
      ID_ASSURE_PRINCIPAL: null,
      LIEU_NAISSANCE: '',
      GROUPE_SANGUIN: '',
      RHESUS: '+',
      SITUATION_FAMILIALE: ''
    });
    setEditingId(null);
    setShowForm(false);
    setValidationErrors({});
    setRechercheAssure('');
    setResultatsRechercheAssure([]);
  };

  // Charger pour édition
  const handleEdit = async (beneficiaire) => {
    try {
      const response = await patientsAPI.getById(beneficiaire.ID_BEN);
      
      if (response.success && response.patient) {
        const patient = response.patient;
        
        setFormData({
          NOM_BEN: patient.NOM_BEN || '',
          PRE_BEN: patient.PRE_BEN || '',
          SEX_BEN: patient.SEX_BEN || 'M',
          NAI_BEN: patient.NAI_BEN ? patient.NAI_BEN.split('T')[0] : '',
          TELEPHONE_MOBILE: patient.TELEPHONE_MOBILE || '',
          COD_PAY: patient.COD_PAY || 'CMF',
          STATUT_ACE: patient.STATUT_ACE || 'Principal',
          IDENTIFIANT_NATIONAL: patient.IDENTIFIANT_NATIONAL || '',
          NUM_PASSEPORT: patient.NUM_PASSEPORT || '',
          EMAIL: patient.EMAIL || '',
          PROFESSION: patient.PROFESSION || '',
          ID_ASSURE_PRINCIPAL: patient.ID_ASSURE_PRINCIPAL || null,
          LIEU_NAISSANCE: patient.LIEU_NAISSANCE || '',
          GROUPE_SANGUIN: patient.GROUPE_SANGUIN || '',
          RHESUS: patient.RHESUS || '+',
          SITUATION_FAMILIALE: patient.SITUATION_FAMILIALE || ''
        });
        
        setEditingId(patient.ID_BEN);
        setShowForm(true);
        
        // Pré-remplir la recherche d'assuré principal si applicable
        if (patient.ID_ASSURE_PRINCIPAL) {
          const assurePrincipal = assuresPrincipaux.find(
            a => a.ID_BEN === patient.ID_ASSURE_PRINCIPAL
          );
          if (assurePrincipal) {
            setRechercheAssure(`${assurePrincipal.NOM_BEN} ${assurePrincipal.PRE_BEN}`);
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement bénéficiaire:', error);
      showNotification('Erreur lors du chargement du bénéficiaire', 'error');
    }
  };

  // Afficher une notification
  const showNotification = (message, type = 'info', duration = 5000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  // Calculer l'âge
  const calculateAge = (dateString) => {
    if (!dateString) return 'N/A';
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Rendu du formulaire simplifié
  const renderBeneficiaireForm = () => (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target.className === 'modal-overlay') {
        resetForm();
      }
    }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{editingId ? 'Modifier Bénéficiaire' : 'Nouveau Bénéficiaire'}</h2>
          <button onClick={resetForm} className="modal-close">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            
            {/* Section 1: Informations personnelles obligatoires */}
            <div className="form-section">
              <h3>Informations Personnelles *</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    name="NOM_BEN"
                    value={formData.NOM_BEN}
                    onChange={handleInputChange}
                    className={validationErrors.NOM_BEN ? 'error' : ''}
                    placeholder="Entrez le nom"
                    required
                  />
                  {validationErrors.NOM_BEN && (
                    <span className="error-message">{validationErrors.NOM_BEN}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Prénom *</label>
                  <input
                    type="text"
                    name="PRE_BEN"
                    value={formData.PRE_BEN}
                    onChange={handleInputChange}
                    className={validationErrors.PRE_BEN ? 'error' : ''}
                    placeholder="Entrez le prénom"
                    required
                  />
                  {validationErrors.PRE_BEN && (
                    <span className="error-message">{validationErrors.PRE_BEN}</span>
                  )}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Sexe *</label>
                  <select
                    name="SEX_BEN"
                    value={formData.SEX_BEN}
                    onChange={handleInputChange}
                    className={validationErrors.SEX_BEN ? 'error' : ''}
                    required
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                    <option value="O">Autre</option>
                  </select>
                  {validationErrors.SEX_BEN && (
                    <span className="error-message">{validationErrors.SEX_BEN}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Date de Naissance *</label>
                  <input
                    type="date"
                    name="NAI_BEN"
                    value={formData.NAI_BEN}
                    onChange={handleInputChange}
                    className={validationErrors.NAI_BEN ? 'error' : ''}
                    required
                  />
                  {validationErrors.NAI_BEN && (
                    <span className="error-message">{validationErrors.NAI_BEN}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Lieu de Naissance</label>
                <input
                  type="text"
                  name="LIEU_NAISSANCE"
                  value={formData.LIEU_NAISSANCE}
                  onChange={handleInputChange}
                  placeholder="Ville de naissance"
                />
              </div>
            </div>

            {/* Section 2: Informations d'identification */}
            <div className="form-section">
              <h3>Informations d'Identification</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Identifiant National</label>
                  <input
                    type="text"
                    name="IDENTIFIANT_NATIONAL"
                    value={formData.IDENTIFIANT_NATIONAL}
                    onChange={handleInputChange}
                    placeholder="Numéro d'identification national"
                  />
                </div>

                <div className="form-group">
                  <label>Numéro de Passeport</label>
                  <input
                    type="text"
                    name="NUM_PASSEPORT"
                    value={formData.NUM_PASSEPORT}
                    onChange={handleInputChange}
                    placeholder="Numéro de passeport"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Coordonnées */}
            <div className="form-section">
              <h3>Coordonnées</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Téléphone Mobile *</label>
                  <input
                    type="tel"
                    name="TELEPHONE_MOBILE"
                    value={formData.TELEPHONE_MOBILE}
                    onChange={handleInputChange}
                    className={validationErrors.TELEPHONE_MOBILE ? 'error' : ''}
                    placeholder="+237 XXX XXX XXX"
                    required
                  />
                  {validationErrors.TELEPHONE_MOBILE && (
                    <span className="error-message">{validationErrors.TELEPHONE_MOBILE}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="EMAIL"
                    value={formData.EMAIL}
                    onChange={handleInputChange}
                    placeholder="email@exemple.com"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Statut ACE */}
            <div className="form-section">
              <h3>Statut ACE *</h3>
              <div className="form-group">
                <select
                  name="STATUT_ACE"
                  value={formData.STATUT_ACE}
                  onChange={(e) => {
                    handleInputChange(e);
                    if (e.target.value === 'Principal') {
                      setFormData(prev => ({
                        ...prev,
                        ID_ASSURE_PRINCIPAL: null
                      }));
                      setRechercheAssure('');
                    }
                  }}
                  className={validationErrors.STATUT_ACE ? 'error' : ''}
                  required
                >
                  {statutAceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {validationErrors.STATUT_ACE && (
                  <span className="error-message">{validationErrors.STATUT_ACE}</span>
                )}
              </div>

              {(formData.STATUT_ACE !== 'Principal') && (
                <div className="form-group">
                  <label>Assuré Principal *</label>
                  <div className="search-assure-container">
                    <input
                      type="text"
                      placeholder="Rechercher l'assuré principal..."
                      value={rechercheAssure}
                      onChange={(e) => setRechercheAssure(e.target.value)}
                      className={`search-assure-input ${validationErrors.ID_ASSURE_PRINCIPAL ? 'error' : ''}`}
                    />
                    
                    {resultatsRechercheAssure.length > 0 && (
                      <div className="search-results">
                        {resultatsRechercheAssure.map(assure => (
                          <div 
                            key={assure.ID_BEN}
                            className="search-result-item"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                ID_ASSURE_PRINCIPAL: assure.ID_BEN
                              }));
                              setRechercheAssure(`${assure.NOM_BEN} ${assure.PRE_BEN}`);
                              setResultatsRechercheAssure([]);
                            }}
                          >
                            <div className="assure-info">
                              <strong>{assure.NOM_BEN} {assure.PRE_BEN}</strong>
                              <div className="assure-details">
                                <span>Tél: {assure.TELEPHONE_MOBILE || 'N/A'}</span>
                                <span>ID: {assure.ID_BEN}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {validationErrors.ID_ASSURE_PRINCIPAL && (
                    <span className="error-message">{validationErrors.ID_ASSURE_PRINCIPAL}</span>
                  )}
                </div>
              )}
            </div>

            {/* Section 5: Informations supplémentaires */}
            <div className="form-section">
              <h3>Informations Supplémentaires</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Profession</label>
                  <input
                    type="text"
                    name="PROFESSION"
                    value={formData.PROFESSION}
                    onChange={handleInputChange}
                    placeholder="Profession"
                  />
                </div>

                <div className="form-group">
                  <label>Groupe Sanguin</label>
                  <select
                    name="GROUPE_SANGUIN"
                    value={formData.GROUPE_SANGUIN}
                    onChange={handleInputChange}
                  >
                    <option value="">Sélectionner</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Rhésus</label>
                  <select
                    name="RHESUS"
                    value={formData.RHESUS}
                    onChange={handleInputChange}
                  >
                    <option value="+">Positif (+)</option>
                    <option value="-">Négatif (-)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="form-actions">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
                disabled={saving}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : editingId ? (
                  <>
                    <Save size={18} />
                    Mettre à jour
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Créer le bénéficiaire
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Filtrer les bénéficiaires
  const filteredBeneficiaires = beneficiaires.filter(ben => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      ben.NOM_BEN?.toLowerCase().includes(searchLower) ||
      ben.PRE_BEN?.toLowerCase().includes(searchLower) ||
      ben.IDENTIFIANT_NATIONAL?.includes(searchTerm) ||
      ben.TELEPHONE_MOBILE?.includes(searchTerm) ||
      ben.EMAIL?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="beneficiaires-container">
      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* En-tête */}
      <div className="page-header">
        <div className="header-title">
          <h1><Users size={24} /> Gestion des Bénéficiaires</h1>
          <p>Gérez l'ensemble des bénéficiaires du système</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={18} /> Nouveau Bénéficiaire
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={20} />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, téléphone, identifiant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search">
              <X size={18} />
            </button>
          )}
        </div>
        <button onClick={loadBeneficiaires} className="btn-refresh">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Tableau */}
      <div className="table-container">
        {loading ? (
          <div className="loading">
            <Loader2 size={32} className="animate-spin" />
            <p>Chargement des bénéficiaires...</p>
          </div>
        ) : filteredBeneficiaires.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h4>Aucun bénéficiaire trouvé</h4>
            <p>
              {searchTerm 
                ? 'Aucun résultat pour votre recherche'
                : 'Commencez par ajouter un nouveau bénéficiaire'}
            </p>
            {!searchTerm && (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus size={18} /> Ajouter un bénéficiaire
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom & Prénom</th>
                  <th>Âge/Sexe</th>
                  <th>Contact</th>
                  <th>Statut ACE</th>
                  <th>Identifiant</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeneficiaires.map(ben => (
                  <tr key={ben.ID_BEN}>
                    <td className="id-cell">#{ben.ID_BEN}</td>
                    <td>
                      <div className="patient-info">
                        <div className="patient-avatar">
                          {ben.SEX_BEN === 'M' ? '♂' : ben.SEX_BEN === 'F' ? '♀' : '⚧'}
                        </div>
                        <div>
                          <strong>{ben.NOM_BEN} {ben.PRE_BEN}</strong>
                          <div className="patient-profession">
                            {ben.PROFESSION || 'Non spécifié'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="age-sex">
                        <span className="age">{calculateAge(ben.NAI_BEN)} ans</span>
                        <span className={`sex ${ben.SEX_BEN === 'M' ? 'male' : 'female'}`}>
                          {ben.SEX_BEN === 'M' ? '♂' : '♀'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div><Phone size={14} /> {ben.TELEPHONE_MOBILE || 'N/A'}</div>
                        {ben.EMAIL && <div><Mail size={14} /> {ben.EMAIL}</div>}
                      </div>
                    </td>
                    <td>
                      <span className={`statut-ace ${ben.STATUT_ACE || 'non-defini'}`}>
                        {ben.STATUT_ACE === 'Principal' ? 'Assuré Principal' :
                         ben.STATUT_ACE === 'Conjoint' ? 'Conjoint' :
                         ben.STATUT_ACE === 'Enfant' ? 'Enfant' :
                         ben.STATUT_ACE || 'Non défini'}
                      </span>
                    </td>
                    <td>
                      <div className="identifiant">
                        <FileText size={14} />
                        {ben.IDENTIFIANT_NATIONAL || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(ben)}
                          className="btn-action edit"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Confirmer la suppression de ${ben.NOM_BEN} ${ben.PRE_BEN} ?`)) {
                              // Implémenter la suppression
                            }
                          }}
                          className="btn-action delete"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de formulaire */}
      {showForm && renderBeneficiaireForm()}
    </div>
  );
};

export default Beneficiaires;