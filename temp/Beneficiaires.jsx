import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User,
  Filter,
  Download,
  Upload,
  Globe,
  Phone,
  Droplets,
  Mail,
  Briefcase,
  MapPin,
  Home,
  Heart,
  Calendar
} from 'lucide-react';
import { beneficiairesAPI } from '../services/api';
import './Beneficiaires.css';

const Beneficiaires = () => {
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [paysList, setPaysList] = useState([]);
  const [languesList, setLanguesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedBeneficiaire, setSelectedBeneficiaire] = useState(null);
  const [filters, setFilters] = useState({
    cod_pay: '',
    sex_ben: '',
    groupe_sanguin: '',
    situation_familiale: ''
  });

  useEffect(() => {
    loadBeneficiaires();
    loadReferenceData();
  }, []);

  const loadBeneficiaires = async () => {
    setLoading(true);
    try {
      const data = await beneficiairesAPI.getBeneficiaires();
      setBeneficiaires(data.beneficiaires || []);
    } catch (error) {
      console.error('Erreur chargement bénéficiaires:', error);
      setBeneficiaires([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [paysData, languesData] = await Promise.all([
        beneficiairesAPI.getPays(),
        beneficiairesAPI.getLangues()
      ]);
      setPaysList(paysData.pays || []);
      setLanguesList(languesData.langues || []);
    } catch (error) {
      console.error('Erreur chargement données de référence:', error);
    }
  };

  const filteredBeneficiaires = beneficiaires.filter(beneficiaire => {
    const matchesSearch = 
      beneficiaire.nom_ben?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiaire.pre_ben?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiaire.identifiant_national?.includes(searchTerm) ||
      beneficiaire.telephone_mobile?.includes(searchTerm) ||
      beneficiaire.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPays = !filters.cod_pay || beneficiaire.cod_pay === filters.cod_pay;
    const matchesSex = !filters.sex_ben || beneficiaire.sex_ben === filters.sex_ben;
    const matchesGroupeSanguin = !filters.groupe_sanguin || beneficiaire.groupe_sanguin === filters.groupe_sanguin;
    const matchesSituation = !filters.situation_familiale || beneficiaire.situation_familiale === filters.situation_familiale;
    
    return matchesSearch && matchesPays && matchesSex && matchesGroupeSanguin && matchesSituation;
  });

  const getPaysInfo = (cod_pay) => {
    return paysList.find(p => p.cod_pay === cod_pay) || {};
  };

  const calculateAge = (dateNaissance) => {
    if (!dateNaissance) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleAddBeneficiaire = async (beneficiaireData) => {
    try {
      const result = await beneficiairesAPI.createBeneficiaire(beneficiaireData);
      if (result.success) {
        setBeneficiaires(prev => [...prev, result.beneficiaire]);
        setShowAddForm(false);
        alert('Bénéficiaire créé avec succès');
      } else {
        alert('Erreur: ' + result.message);
      }
    } catch (error) {
      console.error('Erreur création bénéficiaire:', error);
      alert('Erreur lors de la création du bénéficiaire');
    }
  };

  const handleEditBeneficiaire = async (beneficiaireData) => {
    try {
      const result = await beneficiairesAPI.updateBeneficiaire(selectedBeneficiaire.id_ben, beneficiaireData);
      if (result.success) {
        setBeneficiaires(prev =>
          prev.map(b =>
            b.id_ben === selectedBeneficiaire.id_ben
              ? { ...b, ...beneficiaireData }
              : b
          )
        );
        setSelectedBeneficiaire(null);
        alert('Bénéficiaire modifié avec succès');
      } else {
        alert('Erreur: ' + result.message);
      }
    } catch (error) {
      console.error('Erreur modification bénéficiaire:', error);
      alert('Erreur lors de la modification du bénéficiaire');
    }
  };

  const handleDeleteBeneficiaire = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce bénéficiaire ?')) {
      try {
        const result = await beneficiairesAPI.deleteBeneficiaire(id);
        if (result.success) {
          setBeneficiaires(prev => prev.filter(b => b.id_ben !== id));
          alert('Bénéficiaire supprimé avec succès');
        } else {
          alert('Erreur: ' + result.message);
        }
      } catch (error) {
        console.error('Erreur suppression bénéficiaire:', error);
        alert('Erreur lors de la suppression du bénéficiaire');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getSituationFamilialeLabel = (situation) => {
    const situations = {
      'celibataire': 'Célibataire',
      'marie': 'Marié(e)',
      'divorce': 'Divorcé(e)',
      'veuf': 'Veuf/Veuve',
      'concubinage': 'Concubinage'
    };
    return situations[situation] || situation || 'Non spécifié';
  };

  return (
    <div className="beneficiaires-page">
      <div className="page-header">
        <div className="header-left">
          <h1>
            <Users className="header-icon" />
            Gestion des Bénéficiaires - Afrique Centrale
          </h1>
          <p>Gérez les bénéficiaires de santé dans les 7 pays de la région</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <Download size={18} />
            Exporter
          </button>
          <button className="btn-secondary">
            <Upload size={18} />
            Importer
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={18} />
            Nouveau Bénéficiaire
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <div className="search-container">
            <div className="search-bar">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom, identifiant ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="filters-container">
            <select 
              value={filters.cod_pay}
              onChange={(e) => setFilters(prev => ({ ...prev, cod_pay: e.target.value }))}
              className="filter-select"
            >
              <option value="">Tous les pays</option>
              {paysList.map(pays => (
                <option key={pays.cod_pay} value={pays.cod_pay}>
                  {pays.lib_pay}
                </option>
              ))}
            </select>
            
            <select 
              value={filters.sex_ben}
              onChange={(e) => setFilters(prev => ({ ...prev, sex_ben: e.target.value }))}
              className="filter-select"
            >
              <option value="">Tous les genres</option>
              <option value="M">Homme</option>
              <option value="F">Femme</option>
              <option value="O">Autre</option>
            </select>
            
            <select 
              value={filters.groupe_sanguin}
              onChange={(e) => setFilters(prev => ({ ...prev, groupe_sanguin: e.target.value }))}
              className="filter-select"
            >
              <option value="">Tous les groupes sanguins</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </select>
            
            <button className="btn-secondary" onClick={() => setFilters({
              cod_pay: '',
              sex_ben: '',
              groupe_sanguin: '',
              situation_familiale: ''
            })}>
              <Filter size={18} />
              Réinitialiser
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Chargement des bénéficiaires...</p>
          </div>
        ) : (
          <div className="beneficiaires-table-container">
            <table className="beneficiaires-table">
              <thead>
                <tr>
                  <th>Pays</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Âge</th>
                  <th>Genre</th>
                  <th>Identifiant</th>
                  <th>Téléphone</th>
                  <th>Groupe Sanguin</th>
                  <th>Situation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeneficiaires.map((beneficiaire, index) => (
                  <motion.tr
                    key={beneficiaire.id_ben}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="beneficiaire-row"
                  >
                    <td>
                      <div className="country-info">
                        <Globe size={14} />
                        <span className="country-name">
                          {getPaysInfo(beneficiaire.cod_pay).lib_pay || beneficiaire.cod_pay}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="beneficiaire-name">
                        <User size={16} />
                        {beneficiaire.nom_ben}
                      </div>
                    </td>
                    <td>{beneficiaire.pre_ben}</td>
                    <td>
                      <div className="age-info">
                        <Calendar size={14} />
                        {calculateAge(beneficiaire.nai_ben)} ans
                        <span className="date-small">
                          ({formatDate(beneficiaire.nai_ben)})
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`genre-badge ${beneficiaire.sex_ben}`}>
                        {beneficiaire.sex_ben === 'M' ? 'Homme' : 
                         beneficiaire.sex_ben === 'F' ? 'Femme' : 'Autre'}
                      </span>
                    </td>
                    <td>
                      <span className="identifiant-badge">
                        {beneficiaire.identifiant_national || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className="phone-info">
                        <Phone size={14} />
                        {beneficiaire.telephone_mobile || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="blood-info">
                        <Droplets size={14} />
                        <span className={`blood-badge ${beneficiaire.groupe_sanguin}`}>
                          {beneficiaire.groupe_sanguin || 'N/A'}{beneficiaire.rhesus || ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="situation-badge">
                        {getSituationFamilialeLabel(beneficiaire.situation_familiale)}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn-icon"
                          onClick={() => setSelectedBeneficiaire(beneficiaire)}
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn-icon danger"
                          onClick={() => handleDeleteBeneficiaire(beneficiaire.id_ben)}
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          className="btn-icon info"
                          onClick={() => {
                            // Fonction pour voir les détails
                            alert(`Détails du bénéficiaire:
Nom: ${beneficiaire.nom_ben} ${beneficiaire.pre_ben}
Email: ${beneficiaire.email || 'N/A'}
Profession: ${beneficiaire.profession || 'N/A'}
Langue maternelle: ${beneficiaire.langue_maternel || 'N/A'}
Religion: ${beneficiaire.religion || 'N/A'}
Enfants: ${beneficiaire.nombre_enfants || '0'}
Antécédents: ${beneficiaire.antecedents_medicaux || 'Aucun'}`);
                          }}
                          title="Détails"
                        >
                          <User size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredBeneficiaires.length === 0 && !loading && (
          <div className="empty-state">
            <Users size={48} />
            <h3>Aucun bénéficiaire trouvé</h3>
            <p>Aucun bénéficiaire ne correspond à votre recherche.</p>
            <button 
              className="btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={18} />
              Ajouter un bénéficiaire
            </button>
          </div>
        )}

        <div className="table-footer">
          <div className="pagination-info">
            <span>Affichage de {filteredBeneficiaires.length} bénéficiaire(s) sur {beneficiaires.length}</span>
            <span className="stats-info">
              {paysList.length > 0 && `${paysList.length} pays de la région`}
            </span>
          </div>
        </div>
      </div>

      {/* Modal d'ajout/édition */}
      {(showAddForm || selectedBeneficiaire) && (
        <BeneficiaireForm
          beneficiaire={selectedBeneficiaire}
          paysList={paysList}
          languesList={languesList}
          onSave={selectedBeneficiaire ? handleEditBeneficiaire : handleAddBeneficiaire}
          onCancel={() => {
            setShowAddForm(false);
            setSelectedBeneficiaire(null);
          }}
        />
      )}
    </div>
  );
};

// Composant de formulaire pour ajouter/modifier un bénéficiaire
const BeneficiaireForm = ({ beneficiaire, paysList, languesList, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    cod_pay: beneficiaire?.cod_pay || 'CMF',
    nom_ben: beneficiaire?.nom_ben || '',
    pre_ben: beneficiaire?.pre_ben || '',
    fil_ben: beneficiaire?.fil_ben || '',
    sex_ben: beneficiaire?.sex_ben || 'M',
    nai_ben: beneficiaire?.nai_ben ? beneficiaire.nai_ben.substring(0, 10) : '',
    lieu_naissance: beneficiaire?.lieu_naissance || '',
    identifiant_national: beneficiaire?.identifiant_national || '',
    num_passeport: beneficiaire?.num_passeport || '',
    telephone_mobile: beneficiaire?.telephone_mobile || '',
    telephone: beneficiaire?.telephone || '',
    email: beneficiaire?.email || '',
    groupe_sanguin: beneficiaire?.groupe_sanguin || '',
    rhesus: beneficiaire?.rhesus || '+',
    profession: beneficiaire?.profession || '',
    employeur: beneficiaire?.employeur || '',
    salaire: beneficiaire?.salaire || '',
    situation_familiale: beneficiaire?.situation_familiale || 'celibataire',
    nombre_enfants: beneficiaire?.nombre_enfants || 0,
    langue_maternel: beneficiaire?.langue_maternel || 'FR',
    langue_parlee: beneficiaire?.langue_parlee || '',
    religion: beneficiaire?.religion || '',
    niveau_etude: beneficiaire?.niveau_etude || '',
    antecedents_medicaux: beneficiaire?.antecedents_medicaux || '',
    allergies: beneficiaire?.allergies || '',
    traitements_en_cours: beneficiaire?.traitements_en_cours || '',
    contact_urgence: beneficiaire?.contact_urgence || '',
    tel_urgence: beneficiaire?.tel_urgence || '',
    zone_habitation: beneficiaire?.zone_habitation || '',
    type_habitat: beneficiaire?.type_habitat || '',
    acces_eau: beneficiaire?.acces_eau || true,
    acces_electricite: beneficiaire?.acces_electricite || true,
    distance_centre_sante: beneficiaire?.distance_centre_sante || '',
    moyen_transport: beneficiaire?.moyen_transport || '',
    assurance_privee: beneficiaire?.assurance_privee || false,
    mutuelle: beneficiaire?.mutuelle || ''
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.nom_ben.trim()) newErrors.nom_ben = 'Le nom est requis';
    if (!formData.pre_ben.trim()) newErrors.pre_ben = 'Le prénom est requis';
    if (!formData.nai_ben) newErrors.nai_ben = 'La date de naissance est requise';
    if (!formData.cod_pay) newErrors.cod_pay = 'Le pays est requis';
    if (!formData.sex_ben) newErrors.sex_ben = 'Le genre est requis';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };

  return (
    <div className="modal-overlay">
      <motion.div
        className="modal large-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="modal-header">
          <h2>
            {beneficiaire ? 'Modifier le bénéficiaire' : 'Nouveau bénéficiaire'}
          </h2>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-section">
            <h3><User size={18} /> Informations personnelles</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Pays *</label>
                <select
                  name="cod_pay"
                  value={formData.cod_pay}
                  onChange={handleChange}
                  className={errors.cod_pay ? 'error' : ''}
                >
                  <option value="">Sélectionnez un pays</option>
                  {paysList.map(pays => (
                    <option key={pays.cod_pay} value={pays.cod_pay}>
                      {pays.lib_pay} ({pays.langue_defaut})
                    </option>
                  ))}
                </select>
                {errors.cod_pay && <span className="error-message">{errors.cod_pay}</span>}
              </div>

              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  name="nom_ben"
                  value={formData.nom_ben}
                  onChange={handleChange}
                  className={errors.nom_ben ? 'error' : ''}
                  placeholder="NDONGO"
                />
                {errors.nom_ben && <span className="error-message">{errors.nom_ben}</span>}
              </div>

              <div className="form-group">
                <label>Prénom *</label>
                <input
                  type="text"
                  name="pre_ben"
                  value={formData.pre_ben}
                  onChange={handleChange}
                  className={errors.pre_ben ? 'error' : ''}
                  placeholder="Jean"
                />
                {errors.pre_ben && <span className="error-message">{errors.pre_ben}</span>}
              </div>

              <div className="form-group">
                <label>Nom du père</label>
                <input
                  type="text"
                  name="fil_ben"
                  value={formData.fil_ben}
                  onChange={handleChange}
                  placeholder="Nom du père"
                />
              </div>

              <div className="form-group">
                <label>Genre *</label>
                <select
                  name="sex_ben"
                  value={formData.sex_ben}
                  onChange={handleChange}
                  className={errors.sex_ben ? 'error' : ''}
                >
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                  <option value="O">Autre</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date de naissance *</label>
                <input
                  type="date"
                  name="nai_ben"
                  value={formData.nai_ben}
                  onChange={handleChange}
                  className={errors.nai_ben ? 'error' : ''}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.nai_ben && <span className="error-message">{errors.nai_ben}</span>}
              </div>

              <div className="form-group">
                <label>Lieu de naissance</label>
                <input
                  type="text"
                  name="lieu_naissance"
                  value={formData.lieu_naissance}
                  onChange={handleChange}
                  placeholder="Ville de naissance"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3><Phone size={18} /> Coordonnées et identification</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Identifiant national</label>
                <input
                  type="text"
                  name="identifiant_national"
                  value={formData.identifiant_national}
                  onChange={handleChange}
                  placeholder="CM12345678"
                />
              </div>

              <div className="form-group">
                <label>Numéro de passeport</label>
                <input
                  type="text"
                  name="num_passeport"
                  value={formData.num_passeport}
                  onChange={handleChange}
                  placeholder="AB123456"
                />
              </div>

              <div className="form-group">
                <label>Téléphone mobile *</label>
                <input
                  type="tel"
                  name="telephone_mobile"
                  value={formData.telephone_mobile}
                  onChange={handleChange}
                  placeholder="+237690123456"
                />
              </div>

              <div className="form-group">
                <label>Téléphone fixe</label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="+237222123456"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jean.ndongo@email.cm"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3><Heart size={18} /> Informations médicales et sociales</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Groupe sanguin</label>
                <select
                  name="groupe_sanguin"
                  value={formData.groupe_sanguin}
                  onChange={handleChange}
                >
                  <option value="">Non spécifié</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>

              <div className="form-group">
                <label>Rhésus</label>
                <select
                  name="rhesus"
                  value={formData.rhesus}
                  onChange={handleChange}
                >
                  <option value="+">Rhésus +</option>
                  <option value="-">Rhésus -</option>
                </select>
              </div>

              <div className="form-group">
                <label>Profession</label>
                <input
                  type="text"
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  placeholder="Enseignant"
                />
              </div>

              <div className="form-group">
                <label>Employeur</label>
                <input
                  type="text"
                  name="employeur"
                  value={formData.employeur}
                  onChange={handleChange}
                  placeholder="École publique"
                />
              </div>

              <div className="form-group">
                <label>Salaire (en FCFA)</label>
                <input
                  type="number"
                  name="salaire"
                  value={formData.salaire}
                  onChange={handleNumberChange}
                  placeholder="150000"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Situation familiale</label>
                <select
                  name="situation_familiale"
                  value={formData.situation_familiale}
                  onChange={handleChange}
                >
                  <option value="celibataire">Célibataire</option>
                  <option value="marie">Marié(e)</option>
                  <option value="divorce">Divorcé(e)</option>
                  <option value="veuf">Veuf/Veuve</option>
                  <option value="concubinage">Concubinage</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nombre d'enfants</label>
                <input
                  type="number"
                  name="nombre_enfants"
                  value={formData.nombre_enfants}
                  onChange={handleNumberChange}
                  min="0"
                  max="20"
                />
              </div>

              <div className="form-group">
                <label>Langue maternelle</label>
                <select
                  name="langue_maternel"
                  value={formData.langue_maternel}
                  onChange={handleChange}
                >
                  <option value="">Sélectionnez</option>
                  {languesList.map(langue => (
                    <option key={langue.cod_lang} value={langue.cod_lang}>
                      {langue.lib_lang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Religion</label>
                <input
                  type="text"
                  name="religion"
                  value={formData.religion}
                  onChange={handleChange}
                  placeholder="Christianisme"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3><Home size={18} /> Conditions de vie</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Zone d'habitation</label>
                <input
                  type="text"
                  name="zone_habitation"
                  value={formData.zone_habitation}
                  onChange={handleChange}
                  placeholder="Quartier, ville"
                />
              </div>

              <div className="form-group">
                <label>Type d'habitat</label>
                <select
                  name="type_habitat"
                  value={formData.type_habitat}
                  onChange={handleChange}
                >
                  <option value="">Non spécifié</option>
                  <option value="maison">Maison</option>
                  <option value="appartement">Appartement</option>
                  <option value="bidonville">Bidonville</option>
                  <option value="rurale">Zone rurale</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="acces_eau"
                    checked={formData.acces_eau}
                    onChange={handleChange}
                  />
                  Accès à l'eau potable
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="acces_electricite"
                    checked={formData.acces_electricite}
                    onChange={handleChange}
                  />
                  Accès à l'électricité
                </label>
              </div>

              <div className="form-group">
                <label>Distance du centre de santé (km)</label>
                <input
                  type="number"
                  name="distance_centre_sante"
                  value={formData.distance_centre_sante}
                  onChange={handleNumberChange}
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label>Moyen de transport principal</label>
                <select
                  name="moyen_transport"
                  value={formData.moyen_transport}
                  onChange={handleChange}
                >
                  <option value="">Non spécifié</option>
                  <option value="marche">Marche</option>
                  <option value="velo">Vélo</option>
                  <option value="moto">Moto</option>
                  <option value="voiture">Voiture</option>
                  <option value="transport_en_commun">Transport en commun</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3><MapPin size={18} /> Autres informations</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Antécédents médicaux</label>
                <textarea
                  name="antecedents_medicaux"
                  value={formData.antecedents_medicaux}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Maladies chroniques, interventions chirurgicales..."
                />
              </div>

              <div className="form-group full-width">
                <label>Allergies connues</label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Allergies médicamenteuses, alimentaires..."
                />
              </div>

              <div className="form-group full-width">
                <label>Traitements en cours</label>
                <textarea
                  name="traitements_en_cours"
                  value={formData.traitements_en_cours}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Médicaments réguliers..."
                />
              </div>

              <div className="form-group">
                <label>Contact d'urgence</label>
                <input
                  type="text"
                  name="contact_urgence"
                  value={formData.contact_urgence}
                  onChange={handleChange}
                  placeholder="Nom du contact"
                />
              </div>

              <div className="form-group">
                <label>Téléphone d'urgence</label>
                <input
                  type="tel"
                  name="tel_urgence"
                  value={formData.tel_urgence}
                  onChange={handleChange}
                  placeholder="+237690987654"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="assurance_privee"
                    checked={formData.assurance_privee}
                    onChange={handleChange}
                  />
                  Assurance privée
                </label>
              </div>

              <div className="form-group">
                <label>Mutuelle de santé</label>
                <input
                  type="text"
                  name="mutuelle"
                  value={formData.mutuelle}
                  onChange={handleChange}
                  placeholder="Nom de la mutuelle"
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              {beneficiaire ? 'Modifier' : 'Ajouter'} le bénéficiaire
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Beneficiaires;