// src/pages/evacuation/Evacuations.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Ambulance, Plus, Search, Filter, MapPin,
  Clock, AlertTriangle, CheckCircle, XCircle,
  Eye, Edit, Download, Phone
} from 'lucide-react';
import './Evacuations.css';

const Evacuations = () => {
  const { t } = useTranslation();
  const [evacuations, setEvacuations] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    // Simuler le chargement des données
    const mockEvacuations = [
      {
        id: 'EVAC-001',
        patient: 'Jean Dupont',
        matricule: 'AMS001',
        dateDemande: '2024-01-15',
        dateEvacuation: '2024-01-16',
        from: 'Centre Médical Central',
        to: 'Hôpital Général',
        type: 'Urgente',
        status: 'En cours',
        priority: 'Haute',
        accompagnateur: 'Marie Dupont'
      },
      {
        id: 'EVAC-002',
        patient: 'Marie Martin',
        matricule: 'AMS002',
        dateDemande: '2024-01-14',
        dateEvacuation: '2024-01-15',
        from: 'Polyclinique',
        to: 'Clinique Spécialisée',
        type: 'Planifiée',
        status: 'Terminée',
        priority: 'Moyenne',
        accompagnateur: 'Paul Martin'
      }
    ];
    setEvacuations(mockEvacuations);
  }, []);

  return (
    <div className="evacuations-page">
      <div className="page-header">
        <h1><Ambulance size={24} /> {t('evacuations')}</h1>
        <div className="header-actions">
          <button className="btn-primary">
            <Plus size={18} />
            {t('newEvacuation')}
          </button>
          <button className="btn-secondary">
            <Download size={18} />
            {t('export')}
          </button>
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon total">
            <Ambulance size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{evacuations.length}</div>
            <div className="stat-label">{t('totalEvacuations')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon in-progress">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {evacuations.filter(e => e.status === 'En cours').length}
            </div>
            <div className="stat-label">{t('inProgress')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon completed">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {evacuations.filter(e => e.status === 'Terminée').length}
            </div>
            <div className="stat-label">{t('completed')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon urgent">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {evacuations.filter(e => e.priority === 'Haute').length}
            </div>
            <div className="stat-label">{t('urgent')}</div>
          </div>
        </div>
      </div>

      <div className="evacuations-list">
        {evacuations.map(evacuation => (
          <div key={evacuation.id} className="evacuation-card">
            <div className="evacuation-header">
              <div className="evacuation-id">
                <Ambulance size={16} />
                <strong>{evacuation.id}</strong>
                <span className={`priority-badge priority-${evacuation.priority.toLowerCase()}`}>
                  {evacuation.priority}
                </span>
              </div>
              <div className="evacuation-status">
                <span className={`status-badge status-${evacuation.status.toLowerCase().replace(' ', '-')}`}>
                  {evacuation.status}
                </span>
              </div>
            </div>

            <div className="evacuation-content">
              <div className="patient-info">
                <div className="patient-name">
                  {evacuation.patient}
                  <small>{evacuation.matricule}</small>
                </div>
                <div className="patient-contact">
                  <Phone size={14} />
                  +237 6XXXXXX
                </div>
              </div>

              <div className="route-info">
                <div className="route">
                  <div className="from">
                    <MapPin size={14} />
                    <span>{evacuation.from}</span>
                  </div>
                  <div className="route-arrow">→</div>
                  <div className="to">
                    <MapPin size={14} />
                    <span>{evacuation.to}</span>
                  </div>
                </div>
              </div>

              <div className="evacuation-details">
                <div className="detail">
                  <label>{t('requestDate')}:</label>
                  <span>{evacuation.dateDemande}</span>
                </div>
                <div className="detail">
                  <label>{t('evacuationDate')}:</label>
                  <span>{evacuation.dateEvacuation}</span>
                </div>
                <div className="detail">
                  <label>{t('type')}:</label>
                  <span>{evacuation.type}</span>
                </div>
                <div className="detail">
                  <label>{t('companion')}:</label>
                  <span>{evacuation.accompagnateur}</span>
                </div>
              </div>
            </div>

            <div className="evacuation-actions">
              <button className="btn-action view">
                <Eye size={16} />
                {t('view')}
              </button>
              <button className="btn-action edit">
                <Edit size={16} />
                {t('edit')}
              </button>
              <button className="btn-action track">
                <MapPin size={16} />
                {t('track')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Evacuations;