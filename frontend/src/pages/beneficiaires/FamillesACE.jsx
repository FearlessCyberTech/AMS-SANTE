import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Plus, Search, Edit, Trash2, Filter, 
  RefreshCw, User, Heart, Baby, Users as FamilyIcon,
  Phone, Mail, FileText, Calendar, MapPin,
  Save, X, Loader2, CheckCircle, AlertCircle,
  ChevronRight, ChevronDown, UserCheck, UserX
} from 'lucide-react';
import { famillesACEAPI } from '../../services/api';
import './FamillesACE.css';

const FamillesACE = () => {
  // États principaux
  const [familles, setFamilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showAssureDetails, setShowAssureDetails] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statistiques, setStatistiques] = useState(null);
  
  // États pour les données
  const [assuresPrincipaux, setAssuresPrincipaux] = useState([]);
  const [ayantsDroitDisponibles, setAyantsDroitDisponibles] = useState([]);
  const [rechercheAssure, setRechercheAssure] = useState('');
  const [rechercheAyantDroit, setRechercheAyantDroit] = useState('');
  const [filtres, setFiltres] = useState({
    type_ayant_droit: '',
    actif: ''
  });
  
  // Données du formulaire
  const [formData, setFormData] = useState({
    ID_ASSURE_PRINCIPAL: null,
    ID_AYANT_DROIT: null,
    TYPE_AYANT_DROIT: 'CONJOINT',
    DATE_MARIAGE: '',
    LIEU_MARIAGE: '',
    NUM_ACTE_MARIAGE: '',
    ACTIF: true
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Options pour les listes déroulantes
  const typeAyantDroitOptions = [
    { value: 'CONJOINT', label: 'Conjoint/Conjointe', icon: '❤️' },
    { value: 'ENFANT', label: 'Enfant', icon: '👶' },
    { value: 'ASCENDANT', label: 'Ascendant', icon: '👵' }
  ];

 const loadData = useCallback(async () => {
  try {
    setLoading(true);
    console.log('🚀 Début chargement données...');
    
    // Charger les familles AVEC les filtres actuels
    const famillesResponse = await famillesACEAPI.getAll(searchTerm, filtres);
    console.log('📋 Réponse familles:', famillesResponse);
    
    if (famillesResponse.success) {
      setFamilles(famillesResponse.familles || []);
    } else {
      showNotification(famillesResponse.message || 'Erreur chargement familles', 'error');
      setFamilles([]);
    }
    
    // Charger les statistiques
    const statsResponse = await famillesACEAPI.getStatistiques();
    console.log('📊 Réponse statistiques:', statsResponse);
    if (statsResponse.success) {
      setStatistiques(statsResponse.data);
    }
    
    // Charger les assurés principaux
    try {
      console.log('🔍 Chargement assurés principaux...');
      const assuresResponse = await famillesACEAPI.getAssuresPrincipaux(100, '');
      console.log('✅ Assurés principaux reçus:', assuresResponse);
      
      if (assuresResponse.success) {
        const assuresData = assuresResponse.beneficiaires || [];
        console.log(`📝 Nombre d'assurés trouvés: ${assuresData.length}`);
        setAssuresPrincipaux(assuresData);
      } else {
        console.error('❌ Erreur assurés principaux:', assuresResponse.message);
        setAssuresPrincipaux([]);
      }
    } catch (assureError) {
      console.error('❌ Exception assurés principaux:', assureError);
      setAssuresPrincipaux([]);
    }
    
    // Charger les ayants droit disponibles
    try {
      console.log('🔍 Chargement ayants droit...');
      const ayantsResponse = await famillesACEAPI.search('', false, 100);
      console.log('✅ Ayants droit reçus:', ayantsResponse);
      
      if (ayantsResponse.success && ayantsResponse.beneficiaires) {
        setAyantsDroitDisponibles(ayantsResponse.beneficiaires || []);
      } else {
        setAyantsDroitDisponibles([]);
      }
    } catch (ayantError) {
      console.error('❌ Exception ayants droit:', ayantError);
      setAyantsDroitDisponibles([]);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale chargement données:', error);
    showNotification('Erreur lors du chargement des données', 'error');
  } finally {
    console.log('✅ Chargement terminé');
    setLoading(false);
  }
}, [searchTerm, filtres]);

  // Charger les détails d'un assuré principal
  const loadAssureDetails = useCallback(async (idAssure) => {
    try {
      const response = await famillesACEAPI.getAyantsDroitByAssure(idAssure);
      if (response.success) {
        setShowAssureDetails(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement détails:', error);
      showNotification('Erreur lors du chargement des détails', 'error');
    }
  }, []);

  // Effet pour charger les données initiales
  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // Sélectionner un assuré principal
  const selectAssurePrincipal = (assure) => {
    setFormData(prev => ({
      ...prev,
      ID_ASSURE_PRINCIPAL: assure.id || assure.ID_BEN
    }));
    setRechercheAssure(`${assure.nom || assure.NOM_BEN} ${assure.prenom || assure.PRE_BEN}`);
  };

  // Sélectionner un ayant droit
  const selectAyantDroit = (ayantDroit) => {
    setFormData(prev => ({
      ...prev,
      ID_AYANT_DROIT: ayantDroit.id || ayantDroit.ID_BEN
    }));
    setRechercheAyantDroit(`${ayantDroit.nom || ayantDroit.NOM_BEN} ${ayantDroit.prenom || ayantDroit.PRE_BEN}`);
  };

  // Valider le formulaire
  const validateForm = () => {
    const errors = {};
    
    if (!formData.ID_ASSURE_PRINCIPAL) {
      errors.ID_ASSURE_PRINCIPAL = 'L\'assuré principal est requis';
    }
    
    if (!formData.ID_AYANT_DROIT) {
      errors.ID_AYANT_DROIT = 'L\'ayant droit est requis';
    }
    
    if (!formData.TYPE_AYANT_DROIT) {
      errors.TYPE_AYANT_DROIT = 'Le type d\'ayant droit est requis';
    }
    
    // Vérifier que l'assuré et l'ayant droit ne sont pas la même personne
    if (formData.ID_ASSURE_PRINCIPAL === formData.ID_AYANT_DROIT) {
      errors.ID_AYANT_DROIT = 'L\'assuré principal et l\'ayant droit ne peuvent pas être la même personne';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Sauvegarder la famille
  const handleSave = async () => {
    if (!validateForm()) {
      showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
      return;
    }

    setSaving(true);
    
    try {
      let response;
      
      if (editingId) {
        response = await famillesACEAPI.update(editingId, formData);
      } else {
        response = await famillesACEAPI.create(formData);
      }

      if (response.success) {
        showNotification(
          editingId 
            ? 'Famille mise à jour avec succès' 
            : 'Famille créée avec succès',
          'success'
        );
        
        resetForm();
        loadData();
      } else {
        showNotification(response.message || 'Erreur lors de la sauvegarde', 'error');
      }
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      showNotification('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      ID_ASSURE_PRINCIPAL: null,
      ID_AYANT_DROIT: null,
      TYPE_AYANT_DROIT: 'CONJOINT',
      DATE_MARIAGE: '',
      LIEU_MARIAGE: '',
      NUM_ACTE_MARIAGE: '',
      ACTIF: true
    });
    setEditingId(null);
    setShowForm(false);
    setValidationErrors({});
    setRechercheAssure('');
    setRechercheAyantDroit('');
  };

  // Charger pour édition
  const handleEdit = async (famille) => {
    try {
      const response = await famillesACEAPI.getById(famille.ID_FAMILLE);
      
      if (response.success && response.data) {
        const data = response.data;
        
        setFormData({
          ID_ASSURE_PRINCIPAL: data.id_assure_principal,
          ID_AYANT_DROIT: data.id_ayant_droit,
          TYPE_AYANT_DROIT: data.type_ayant_droit,
          DATE_MARIAGE: data.date_mariage || '',
          LIEU_MARIAGE: data.lieu_mariage || '',
          NUM_ACTE_MARIAGE: data.num_acte_mariage || '',
          ACTIF: data.actif
        });
        
        setRechercheAssure(`${data.assure_principal.nom} ${data.assure_principal.prenom}`);
        setRechercheAyantDroit(`${data.ayant_droit.nom} ${data.ayant_droit.prenom}`);
        setEditingId(famille.ID_FAMILLE);
        setShowForm(true);
      }
    } catch (error) {
      console.error('Erreur chargement famille:', error);
      showNotification('Erreur lors du chargement de la famille', 'error');
    }
  };

  // Supprimer une famille
  const handleDelete = async (famille) => {
    if (!window.confirm(`Confirmer la désactivation de la famille ?`)) {
      return;
    }
    
    try {
      const response = await famillesACEAPI.delete(famille.ID_FAMILLE);
      
      if (response.success) {
        showNotification('Famille désactivée avec succès', 'success');
        loadData();
      } else {
        showNotification(response.message || 'Erreur lors de la désactivation', 'error');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      showNotification('Erreur lors de la désactivation', 'error');
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
    try {
      const birthDate = new Date(dateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch {
      return 'N/A';
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch {
      return 'N/A';
    }
  };

  // Filtrer les familles
  const filteredFamilles = familles.filter(famille => {
    if (!searchTerm && !filtres.type_ayant_droit && filtres.actif === '') return true;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      famille.ap_nom?.toLowerCase().includes(searchLower) ||
      famille.ap_prenom?.toLowerCase().includes(searchLower) ||
      famille.ad_nom?.toLowerCase().includes(searchLower) ||
      famille.ad_prenom?.toLowerCase().includes(searchLower) ||
      famille.ap_telephone?.includes(searchTerm) ||
      famille.ad_telephone?.includes(searchTerm);
    
    const matchesType = !filtres.type_ayant_droit || 
      famille.TYPE_AYANT_DROIT === filtres.type_ayant_droit;
    
    const matchesActif = filtres.actif === '' || 
      (filtres.actif === 'true' && famille.ACTIF) ||
      (filtres.actif === 'false' && !famille.ACTIF);
    
    return matchesSearch && matchesType && matchesActif;
  });

  // Filtrer les assurés principaux pour la recherche
  const filteredAssuresPrincipaux = assuresPrincipaux.filter(assure => {
    if (!rechercheAssure) return true;
    
    const searchLower = rechercheAssure.toLowerCase();
    return (
      (assure.nom || assure.NOM_BEN || '').toLowerCase().includes(searchLower) ||
      (assure.prenom || assure.PRE_BEN || '').toLowerCase().includes(searchLower) ||
      (assure.identifiant_national || assure.IDENTIFIANT_NATIONAL || '').includes(rechercheAssure)
    );
  });

  // Filtrer les ayants droit pour la recherche
  const filteredAyantsDroit = ayantsDroitDisponibles.filter(ayantDroit => {
    if (!rechercheAyantDroit) return true;
    
    const searchLower = rechercheAyantDroit.toLowerCase();
    return (
      (ayantDroit.nom || ayantDroit.NOM_BEN || '').toLowerCase().includes(searchLower) ||
      (ayantDroit.prenom || ayantDroit.PRE_BEN || '').toLowerCase().includes(searchLower) ||
      (ayantDroit.identifiant_national || ayantDroit.IDENTIFIANT_NATIONAL || '').includes(rechercheAyantDroit)
    );
  });

  // Rendu du formulaire
  const renderFamilleForm = () => (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target.className === 'modal-overlay') {
        resetForm();
      }
    }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{editingId ? 'Modifier Famille ACE' : 'Nouvelle Famille ACE'}</h2>
          <button onClick={resetForm} className="modal-close">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            
            {/* Section Assuré Principal */}
            <div className="form-section">
              <h3><User size={18} /> Assuré Principal *</h3>
              <div className="search-container">
                <div className="search-input-group">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher un assuré principal..."
                    value={rechercheAssure}
                    onChange={(e) => setRechercheAssure(e.target.value)}
                    className={validationErrors.ID_ASSURE_PRINCIPAL ? 'error' : ''}
                  />
                </div>
                
                {rechercheAssure && (
                  <div className="search-results">
                    {filteredAssuresPrincipaux
                      .slice(0, 10)
                      .map(assure => (
                        <div 
                          key={`assure-${assure.id || assure.ID_BEN}`}
                          className={`search-result-item ${formData.ID_ASSURE_PRINCIPAL === (assure.id || assure.ID_BEN) ? 'selected' : ''}`}
                          onClick={() => selectAssurePrincipal(assure)}
                        >
                          <div className="assure-avatar">
                            {(assure.sexe || assure.SEX_BEN) === 'M' ? '♂' : '♀'}
                          </div>
                          <div className="assure-details">
                            <div className="assure-name">
                              <strong>{(assure.nom || assure.NOM_BEN) || ''} {(assure.prenom || assure.PRE_BEN) || ''}</strong>
                              <span className="assure-id">ID: {assure.id || assure.ID_BEN}</span>
                            </div>
                            <div className="assure-info">
                              {(assure.identifiant_national || assure.IDENTIFIANT_NATIONAL) && (
                                <span><FileText size={12} /> {assure.identifiant_national || assure.IDENTIFIANT_NATIONAL}</span>
                              )}
                              {(assure.telephone || assure.TELEPHONE) && (
                                <span><Phone size={12} /> {assure.telephone || assure.TELEPHONE}</span>
                              )}
                              <span>{calculateAge(assure.date_naissance || assure.NAI_BEN)} ans</span>
                            </div>
                          </div>
                          {formData.ID_ASSURE_PRINCIPAL === (assure.id || assure.ID_BEN) && (
                            <CheckCircle size={16} className="selected-icon" />
                          )}
                        </div>
                      ))}
                  </div>
                )}
                
                {validationErrors.ID_ASSURE_PRINCIPAL && (
                  <span className="error-message">{validationErrors.ID_ASSURE_PRINCIPAL}</span>
                )}
              </div>
            </div>

            {/* Section Ayant Droit */}
            <div className="form-section">
              <h3><Users size={18} /> Ayant Droit *</h3>
              <div className="search-container">
                <div className="search-input-group">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher un ayant droit..."
                    value={rechercheAyantDroit}
                    onChange={(e) => setRechercheAyantDroit(e.target.value)}
                    className={validationErrors.ID_AYANT_DROIT ? 'error' : ''}
                  />
                </div>
                
                {rechercheAyantDroit && (
                  <div className="search-results">
                    {filteredAyantsDroit
                      .filter(ayantDroit => 
                        (ayantDroit.id || ayantDroit.ID_BEN) !== formData.ID_ASSURE_PRINCIPAL
                      )
                      .slice(0, 10)
                      .map(ayantDroit => (
                        <div 
                          key={`ayant-${ayantDroit.id || ayantDroit.ID_BEN}`}
                          className={`search-result-item ${formData.ID_AYANT_DROIT === (ayantDroit.id || ayantDroit.ID_BEN) ? 'selected' : ''}`}
                          onClick={() => selectAyantDroit(ayantDroit)}
                        >
                          <div className="assure-avatar">
                            {(ayantDroit.sexe || ayantDroit.SEX_BEN) === 'M' ? '♂' : '♀'}
                          </div>
                          <div className="assure-details">
                            <div className="assure-name">
                              <strong>{(ayantDroit.nom || ayantDroit.NOM_BEN) || ''} {(ayantDroit.prenom || ayantDroit.PRE_BEN) || ''}</strong>
                              <span className="assure-id">ID: {ayantDroit.id || ayantDroit.ID_BEN}</span>
                            </div>
                            <div className="assure-info">
                              {(ayantDroit.identifiant_national || ayantDroit.IDENTIFIANT_NATIONAL) && (
                                <span><FileText size={12} /> {ayantDroit.identifiant_national || ayantDroit.IDENTIFIANT_NATIONAL}</span>
                              )}
                              {(ayantDroit.telephone || ayantDroit.TELEPHONE) && (
                                <span><Phone size={12} /> {ayantDroit.telephone || ayantDroit.TELEPHONE}</span>
                              )}
                              <span>{calculateAge(ayantDroit.date_naissance || ayantDroit.NAI_BEN)} ans</span>
                            </div>
                          </div>
                          {formData.ID_AYANT_DROIT === (ayantDroit.id || ayantDroit.ID_BEN) && (
                            <CheckCircle size={16} className="selected-icon" />
                          )}
                        </div>
                      ))}
                  </div>
                )}
                
                {validationErrors.ID_AYANT_DROIT && (
                  <span className="error-message">{validationErrors.ID_AYANT_DROIT}</span>
                )}
              </div>
            </div>

            {/* Section Type et Informations */}
            <div className="form-section">
              <h3><FamilyIcon size={18} /> Type et Informations</h3>
              
              <div className="form-group">
                <label>Type d'Ayant Droit *</label>
                <select
                  name="TYPE_AYANT_DROIT"
                  value={formData.TYPE_AYANT_DROIT}
                  onChange={handleInputChange}
                  className={validationErrors.TYPE_AYANT_DROIT ? 'error' : ''}
                >
                  {typeAyantDroitOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
                {validationErrors.TYPE_AYANT_DROIT && (
                  <span className="error-message">{validationErrors.TYPE_AYANT_DROIT}</span>
                )}
              </div>

              {formData.TYPE_AYANT_DROIT === 'CONJOINT' && (
                <>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Date de Mariage</label>
                      <input
                        type="date"
                        name="DATE_MARIAGE"
                        value={formData.DATE_MARIAGE}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Lieu de Mariage</label>
                      <input
                        type="text"
                        name="LIEU_MARIAGE"
                        value={formData.LIEU_MARIAGE}
                        onChange={handleInputChange}
                        placeholder="Lieu de mariage"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Numéro d'Acte de Mariage</label>
                    <input
                      type="text"
                      name="NUM_ACTE_MARIAGE"
                      value={formData.NUM_ACTE_MARIAGE}
                      onChange={handleInputChange}
                      placeholder="Numéro d'acte de mariage"
                    />
                  </div>
                </>
              )}
              
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="ACTIF"
                    checked={formData.ACTIF}
                    onChange={handleInputChange}
                  />
                  <span>Actif</span>
                </label>
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
                    <Plus size={18} />
                    Créer la famille
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Rendu des statistiques
  const renderStatistiques = () => (
    <div className="stats-container">
      <div className="stat-card">
        <div className="stat-icon primary">
          <User size={24} />
        </div>
        <div className="stat-content">
          <h3>{statistiques?.total_assures_principaux || 0}</h3>
          <p>Assurés principaux</p>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon success">
          <Users size={24} />
        </div>
        <div className="stat-content">
          <h3>{statistiques?.total_ayants_droit_actifs || 0}</h3>
          <p>Ayants droit actifs</p>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon warning">
          <Heart size={24} />
        </div>
        <div className="stat-content">
          <h3>{statistiques?.conjoints || 0}</h3>
          <p>Conjoints</p>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon info">
          <Baby size={24} />
        </div>
        <div className="stat-content">
          <h3>{statistiques?.enfants || 0}</h3>
          <p>Enfants</p>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon secondary">
          <UserCheck size={24} />
        </div>
        <div className="stat-content">
          <h3>{statistiques?.ascendants || 0}</h3>
          <p>Ascendants</p>
        </div>
      </div>
    </div>
  );

  // Rendu d'une carte famille
  const renderFamilleCard = (famille, index) => {
    const isExpanded = showAssureDetails?.assure?.id === famille.ID_ASSURE_PRINCIPAL;
    
    return (
      <div key={`famille-${famille.ID_FAMILLE}-${index}`} className="famille-card">
        <div className="famille-header" onClick={() => {
          if (isExpanded) {
            setShowAssureDetails(null);
          } else {
            loadAssureDetails(famille.ID_ASSURE_PRINCIPAL);
          }
        }}>
          <div className="famille-info">
            <div className="assure-principal">
              <div className="assure-avatar">
                {famille.ap_sexe === 'M' ? '♂' : '♀'}
              </div>
              <div>
                <h4>{famille.ap_nom} {famille.ap_prenom}</h4>
                <p className="assure-details">
                  ID: {famille.ap_id} • {famille.ap_age} ans • {famille.ap_telephone || 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="famille-relation">
              <ChevronRight size={20} className={`relation-arrow ${isExpanded ? 'expanded' : ''}`} />
              <span className={`type-ayant-droit ${famille.TYPE_AYANT_DROIT.toLowerCase()}`}>
                {famille.TYPE_AYANT_DROIT === 'CONJOINT' ? 'Conjoint(e)' :
                 famille.TYPE_AYANT_DROIT === 'ENFANT' ? 'Enfant' : 'Ascendant'}
              </span>
              <ChevronRight size={20} className={`relation-arrow ${isExpanded ? 'expanded' : ''}`} />
            </div>
            
            <div className="ayant-droit">
              <div className="assure-avatar">
                {famille.ad_sexe === 'M' ? '♂' : '♀'}
              </div>
              <div>
                <h4>{famille.ad_nom} {famille.ad_prenom}</h4>
                <p className="assure-details">
                  ID: {famille.ad_id} • {famille.ad_age} ans • {famille.ad_telephone || 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="famille-actions">
            <span className={`status-badge ${famille.ACTIF ? 'active' : 'inactive'}`}>
              {famille.ACTIF ? 'Actif' : 'Inactif'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(famille);
              }}
              className="btn-action edit"
              title="Modifier"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(famille);
              }}
              className="btn-action delete"
              title="Désactiver"
            >
              <Trash2 size={16} />
            </button>
            <ChevronDown size={20} className={`expand-icon ${isExpanded ? 'expanded' : ''}`} />
          </div>
        </div>
        
        {isExpanded && showAssureDetails && (
          <div className="famille-details">
            <div className="ayants-droit-list">
              <h5>Ayants droit de {showAssureDetails.assure.nom} {showAssureDetails.assure.prenom}</h5>
              
              {showAssureDetails.ayantsDroit.length === 0 ? (
                <div className="empty-ayants">
                  <UserX size={24} />
                  <p>Aucun ayant droit</p>
                </div>
              ) : (
                <div className="ayants-grid">
                  {showAssureDetails.ayantsDroit.map(ayant => (
                    <div key={`ayant-details-${ayant.id_famille}`} className="ayant-card">
                      <div className="ayant-header">
                        <div className="ayant-avatar">
                          {ayant.sexe === 'M' ? '♂' : '♀'}
                        </div>
                        <div>
                          <h6>{ayant.nom} {ayant.prenom}</h6>
                          <p className="ayant-type">{ayant.type_ayant_droit}</p>
                        </div>
                        <span className={`status-badge ${ayant.actif ? 'active' : 'inactive'}`}>
                          {ayant.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      
                      <div className="ayant-details">
                        <div className="detail-row">
                          <span className="detail-label">Âge:</span>
                          <span className="detail-value">{ayant.age} ans</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Téléphone:</span>
                          <span className="detail-value">{ayant.telephone || 'N/A'}</span>
                        </div>
                        {ayant.date_mariage && (
                          <div className="detail-row">
                            <span className="detail-label">Date mariage:</span>
                            <span className="detail-value">{formatDate(ayant.date_mariage)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="familles-ace-container">
      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="page-header">
        <div className="header-title">
          <h1><FamilyIcon size={24} /> Gestion des Familles ACE</h1>
          <p>Gérez les liens familiaux entre assurés principaux et ayants droit</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={18} /> Nouvelle Famille
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {statistiques && renderStatistiques()}

      {/* Barre de recherche et filtres */}
      <div className="search-filters-container">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="clear-search">
                <X size={18} />
              </button>
            )}
          </div>
          <button onClick={loadData} className="btn-refresh" title="Rafraîchir">
            <RefreshCw size={18} />
          </button>
        </div>
        
        <div className="filters-container">
          <div className="filter-group">
            <label>Type d'ayant droit:</label>
            <select
              value={filtres.type_ayant_droit}
              onChange={(e) => setFiltres(prev => ({ ...prev, type_ayant_droit: e.target.value }))}
            >
              <option value="">Tous</option>
              {typeAyantDroitOptions.map(option => (
                <option key={`filter-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Statut:</label>
            <select
              value={filtres.actif}
              onChange={(e) => setFiltres(prev => ({ ...prev, actif: e.target.value }))}
            >
              <option value="">Tous</option>
              <option value="true">Actifs</option>
              <option value="false">Inactifs</option>
            </select>
          </div>
          
          <button
            onClick={() => setFiltres({ type_ayant_droit: '', actif: '' })}
            className="btn-clear-filters"
          >
            <X size={16} /> Effacer les filtres
          </button>
        </div>
      </div>

      {/* Liste des familles */}
      <div className="familles-list-container">
        {loading ? (
          <div className="loading">
            <Loader2 size={32} className="animate-spin" />
            <p>Chargement des familles...</p>
          </div>
        ) : filteredFamilles.length === 0 ? (
          <div className="empty-state">
            <FamilyIcon size={48} />
            <h4>Aucune famille trouvée</h4>
            <p>
              {searchTerm || filtres.type_ayant_droit || filtres.actif !== ''
                ? 'Aucun résultat pour votre recherche'
                : 'Commencez par créer une nouvelle famille'}
            </p>
            {!searchTerm && !filtres.type_ayant_droit && filtres.actif === '' && (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus size={18} /> Créer une famille
              </button>
            )}
          </div>
        ) : (
          <div className="familles-list">
            {filteredFamilles.map((famille, index) => renderFamilleCard(famille, index))}
          </div>
        )}
      </div>

      {/* Modal de formulaire */}
      {showForm && renderFamilleForm()}
    </div>
  );
};

export default FamillesACE;