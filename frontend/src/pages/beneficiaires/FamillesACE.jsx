// src/pages/beneficiaires/FamillesACE.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, UserPlus, Family, Baby, Heart, 
  Edit, Trash2, Search, Filter
} from 'lucide-react';
import './FamillesACE.css';

const FamillesACE = () => {
  const { t } = useTranslation();
  const [familles, setFamilles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    // Simuler le chargement des données
    const mockFamilles = [
      {
        id: 1,
        assurePrincipal: { nom: 'Dupont', prenom: 'Jean', matricule: 'AMS001' },
        ayantsDroit: [
          { id: 2, nom: 'Dupont', prenom: 'Marie', type: 'Conjoint', dateNaissance: '1982-08-20' },
          { id: 3, nom: 'Dupont', prenom: 'Luc', type: 'Enfant', dateNaissance: '2010-05-15' },
          { id: 4, nom: 'Dupont', prenom: 'Sophie', type: 'Enfant', dateNaissance: '2015-11-30' }
        ]
      },
      {
        id: 5,
        assurePrincipal: { nom: 'Martin', prenom: 'Paul', matricule: 'AMS005' },
        ayantsDroit: [
          { id: 6, nom: 'Martin', prenom: 'Julie', type: 'Conjoint', dateNaissance: '1985-03-22' }
        ]
      }
    ];
    setFamilles(mockFamilles);
  }, []);

  const filteredFamilles = familles.filter(famille =>
    famille.assurePrincipal.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    famille.assurePrincipal.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    famille.assurePrincipal.matricule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAyantDroitIcon = (type) => {
    switch(type) {
      case 'Conjoint': return <Heart size={16} />;
      case 'Enfant': return <Baby size={16} />;
      default: return <Users size={16} />;
    }
  };

  return (
    <div className="familles-page">
      <div className="page-header">
        <h1>
          <Family size={24} />
          {t('aceFamilies')}
        </h1>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowAddForm(true)}>
            <UserPlus size={18} />
            {t('addFamily')}
          </button>
        </div>
      </div>

      <div className="controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder={t('searchFamilies')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="stats">
          <div className="stat">
            <span className="stat-value">{familles.length}</span>
            <span className="stat-label">{t('families')}</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {familles.reduce((total, f) => total + f.ayantsDroit.length, 0)}
            </span>
            <span className="stat-label">{t('dependents')}</span>
          </div>
        </div>
      </div>

      <div className="familles-grid">
        {filteredFamilles.map(famille => (
          <div key={famille.id} className="famille-card">
            <div className="famille-header">
              <div className="assure-principal">
                <div className="assure-icon">
                  <Users size={20} />
                </div>
                <div className="assure-info">
                  <h3>{famille.assurePrincipal.prenom} {famille.assurePrincipal.nom}</h3>
                  <p className="matricule">{famille.assurePrincipal.matricule}</p>
                </div>
              </div>
              <div className="famille-actions">
                <button className="btn-action edit" title={t('edit')}>
                  <Edit size={16} />
                </button>
                <button className="btn-action delete" title={t('delete')}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="ayants-droit-list">
              <h4>{t('dependents')} ({famille.ayantsDroit.length})</h4>
              {famille.ayantsDroit.map(ayant => (
                <div key={ayant.id} className="ayant-droit-item">
                  <div className="ayant-icon">
                    {getAyantDroitIcon(ayant.type)}
                  </div>
                  <div className="ayant-info">
                    <div className="ayant-name">
                      {ayant.prenom} {ayant.nom}
                    </div>
                    <div className="ayant-details">
                      <span className="ayant-type">{t(ayant.type.toLowerCase())}</span>
                      <span className="ayant-birth">{t('born')}: {ayant.dateNaissance}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="famille-footer">
              <button className="btn-secondary btn-sm">
                {t('addDependent')}
              </button>
              <button className="btn-primary btn-sm">
                {t('viewDetails')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredFamilles.length === 0 && (
        <div className="empty-state">
          <Family size={48} />
          <h3>{t('noFamiliesFound')}</h3>
          <p>{t('addFirstFamily')}</p>
          <button className="btn-primary" onClick={() => setShowAddForm(true)}>
            <UserPlus size={18} />
            {t('addFamily')}
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{t('addNewFamily')}</h2>
              <button className="close-modal" onClick={() => setShowAddForm(false)}>×</button>
            </div>
            <div className="modal-content">
              <p>{t('familyFormInstructions')}</p>
              {/* Formulaire d'ajout de famille */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamillesACE;