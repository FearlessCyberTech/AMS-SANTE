// src/pages/reseau/Prestataires.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BriefcaseMedical, Search, Filter, MapPin,
  Star, Phone, Mail, Edit, Eye, Trash2
} from 'lucide-react';
import './Prestataires.css';

const Prestataires = () => {
  const { t } = useTranslation();
  const [prestataires, setPrestataires] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simuler le chargement des données
    const mockPrestataires = [
      {
        id: 1,
        nom: 'Dr. Martin',
        specialite: 'Médecin généraliste',
        centre: 'Centre Médical Central',
        telephone: '+237 612345678',
        email: 'dr.martin@cmc.cm',
        evaluation: 4.5,
        statut: 'Actif',
        disponible: true
      },
      {
        id: 2,
        nom: 'Dr. Johnson',
        specialite: 'Chirurgien',
        centre: 'Hôpital Général',
        telephone: '+237 698765432',
        email: 'dr.johnson@hopital.cm',
        evaluation: 4.8,
        statut: 'Actif',
        disponible: false
      }
    ];
    setPrestataires(mockPrestataires);
  }, []);

  return (
    <div className="prestataires-page">
      <h1><BriefcaseMedical size={24} /> {t('providers')}</h1>
      
      <div className="prestataires-grid">
        {prestataires.map(prestataire => (
          <div key={prestataire.id} className="prestataire-card">
            <div className="prestataire-header">
              <div className="prestataire-avatar">
                {prestataire.nom.charAt(0)}
                {prestataire.disponible && <div className="available-indicator"></div>}
              </div>
              <div className="prestataire-info">
                <h3>{prestataire.nom}</h3>
                <p className="specialite">{prestataire.specialite}</p>
                <div className="evaluation">
                  <Star size={14} fill="gold" />
                  <span>{prestataire.evaluation}</span>
                </div>
              </div>
            </div>

            <div className="prestataire-details">
              <div className="detail">
                <Building size={14} />
                <span>{prestataire.centre}</span>
              </div>
              <div className="detail">
                <Phone size={14} />
                <span>{prestataire.telephone}</span>
              </div>
              <div className="detail">
                <Mail size={14} />
                <span>{prestataire.email}</span>
              </div>
            </div>

            <div className="prestataire-actions">
              <button className="btn-action view">
                <Eye size={16} />
              </button>
              <button className="btn-action edit">
                <Edit size={16} />
              </button>
              <button className="btn-action delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Prestataires;