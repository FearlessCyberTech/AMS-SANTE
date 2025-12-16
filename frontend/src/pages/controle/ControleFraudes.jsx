// src/pages/controle/ControleFraudes.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, Search, Filter, AlertTriangle, CheckCircle,
  XCircle, Eye, FileText, Download, User, DollarSign
} from 'lucide-react';
import './ControleFraudes.css';

const ControleFraudes = () => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState([]);
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  useEffect(() => {
    // Simuler le chargement des données
    const mockAlerts = [
      {
        id: 1,
        type: 'Doublon consultation',
        beneficiary: 'Jean Dupont',
        matricule: 'AMS001',
        date: '2024-01-15',
        amount: 15000,
        severity: 'Haute',
        status: 'Non traité',
        description: 'Consultation identique enregistrée deux fois le même jour'
      },
      {
        id: 2,
        type: 'Montant anormal',
        beneficiary: 'Marie Martin',
        matricule: 'AMS002',
        date: '2024-01-14',
        amount: 500000,
        severity: 'Moyenne',
        status: 'En investigation',
        description: 'Montant de consultation supérieur à la moyenne'
      }
    ];
    setAlerts(mockAlerts);
  }, []);

  return (
    <div className="controle-fraudes-page">
      <h1><Shield size={24} /> {t('fraudControl')}</h1>
      
      <div className="fraud-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{alerts.length}</div>
            <div className="stat-label">{t('totalAlerts')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon high">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {alerts.filter(a => a.severity === 'Haute').length}
            </div>
            <div className="stat-label">{t('highSeverity')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {alerts.filter(a => a.status === 'Non traité').length}
            </div>
            <div className="stat-label">{t('pending')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon resolved">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {alerts.filter(a => a.status === 'Résolu').length}
            </div>
            <div className="stat-label">{t('resolved')}</div>
          </div>
        </div>
      </div>

      <div className="alerts-list">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert-card severity-${alert.severity.toLowerCase()}`}>
            <div className="alert-header">
              <div className="alert-title">
                <AlertTriangle size={18} />
                <h3>{alert.type}</h3>
                <span className={`severity-badge severity-${alert.severity.toLowerCase()}`}>
                  {alert.severity}
                </span>
              </div>
              <div className="alert-status">
                <span className={`status-badge status-${alert.status.toLowerCase().replace(' ', '-')}`}>
                  {alert.status}
                </span>
              </div>
            </div>

            <div className="alert-content">
              <div className="alert-info">
                <div className="info-row">
                  <User size={14} />
                  <span>
                    <strong>{alert.beneficiary}</strong> ({alert.matricule})
                  </span>
                </div>
                <div className="info-row">
                  <Calendar size={14} />
                  <span>{alert.date}</span>
                </div>
                <div className="info-row">
                  <DollarSign size={14} />
                  <span>{alert.amount.toLocaleString()} FCFA</span>
                </div>
              </div>
              
              <div className="alert-description">
                <p>{alert.description}</p>
              </div>
            </div>

            <div className="alert-actions">
              <button className="btn-action view">
                <Eye size={16} />
                {t('viewDetails')}
              </button>
              <button className="btn-action resolve">
                <CheckCircle size={16} />
                {t('markAsResolved')}
              </button>
              <button className="btn-action report">
                <FileText size={16} />
                {t('generateReport')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ControleFraudes;