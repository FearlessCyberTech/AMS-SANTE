// frontend/src/pages/ConsultationsList.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { consultationsAPI } from '../services/api';
import './ConsultationsList.css';

const ConsultationsList = () => {
  const { t } = useTranslation();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: '',
    status: ''
  });

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await consultationsAPI.getAll();
      setConsultations(response.consultations || response.data || []);
    } catch (err) {
      setError(t('consultation.listError'));
      console.error('Erreur chargement consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    // Implémentez la logique de filtrage ici
    console.log('Filtres appliqués:', filters);
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      type: '',
      status: ''
    });
    fetchConsultations();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount) => {
    return amount ? amount.toLocaleString() + ' FCFA' : '0 FCFA';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Tiers Payant': return 'badge-success';
      case 'Gratuit': return 'badge-info';
      case 'À payer': return 'badge-warning';
      case 'Payé': return 'badge-success';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="consultations-list-page">
      <div className="page-header">
        <h1>{t('consultation.listTitle')}</h1>
        <div className="header-actions">
          <Link to="/consultations/new" className="btn btn-primary">
            <i className="fas fa-plus"></i> {t('consultation.newConsultation')}
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filtres */}
      <div className="filters-section">
        <h3>{t('common.filters')}</h3>
        <div className="filter-form">
          <div className="form-row">
            <div className="form-group">
              <label>{t('consultation.dateFrom')}</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
              />
            </div>
            <div className="form-group">
              <label>{t('consultation.dateTo')}</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
              />
            </div>
            <div className="form-group">
              <label>{t('consultation.type')}</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">{t('common.all')}</option>
                <option value="Consultation Généraliste">Consultation Généraliste</option>
                <option value="Consultation Spécialiste">Consultation Spécialiste</option>
                <option value="Consultation Urgence">Consultation Urgence</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t('consultation.status')}</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">{t('common.all')}</option>
                <option value="Tiers Payant">Tiers Payant</option>
                <option value="Gratuit">Gratuit</option>
                <option value="À payer">À payer</option>
                <option value="Payé">Payé</option>
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <button onClick={applyFilters} className="btn btn-primary">
              <i className="fas fa-filter"></i> {t('common.applyFilters')}
            </button>
            <button onClick={resetFilters} className="btn btn-secondary">
              <i className="fas fa-redo"></i> {t('common.resetFilters')}
            </button>
          </div>
        </div>
      </div>

      {/* Liste des consultations */}
      <div className="consultations-section">
        <div className="section-header">
          <h2>{t('consultation.consultations')} ({consultations.length})</h2>
          <button onClick={fetchConsultations} className="btn btn-sm btn-secondary">
            <i className="fas fa-sync"></i> {t('common.refresh')}
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i> {t('common.loading')}
          </div>
        ) : consultations.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-clipboard-list fa-3x"></i>
            <h3>{t('consultation.noConsultations')}</h3>
            <p>{t('consultation.noConsultationsText')}</p>
            <Link to="/consultations/new" className="btn btn-primary">
              {t('consultation.createFirst')}
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="consultations-table">
              <thead>
                <tr>
                  <th>{t('consultation.id')}</th>
                  <th>{t('consultation.date')}</th>
                  <th>{t('patient.name')}</th>
                  <th>{t('consultation.type')}</th>
                  <th>{t('consultation.doctor')}</th>
                  <th>{t('consultation.amount')}</th>
                  <th>{t('consultation.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map(consultation => (
                  <tr key={consultation.COD_CONS || consultation.id}>
                    <td>CONS-{consultation.COD_CONS || consultation.id}</td>
                    <td>{formatDate(consultation.DATE_CONSULTATION || consultation.date)}</td>
                    <td>
                      {consultation.NOM_BEN || consultation.patientNom} {consultation.PRE_BEN || consultation.patientPrenom}
                    </td>
                    <td>{consultation.TYPE_CONSULTATION || consultation.type}</td>
                    <td>{consultation.NOM_PRESTATAIRE || consultation.medecinNom}</td>
                    <td>{formatAmount(consultation.MONTANT_CONSULTATION || consultation.montant)}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(consultation.STATUT_PAIEMENT || consultation.statut)}`}>
                        {consultation.STATUT_PAIEMENT || consultation.statut}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link 
                          to={`/consultations/${consultation.COD_CONS || consultation.id}`}
                          className="btn btn-sm btn-info"
                          title={t('common.view')}
                        >
                          <i className="fas fa-eye"></i>
                        </Link>
                        <Link 
                          to={`/consultations/${consultation.COD_CONS || consultation.id}/edit`}
                          className="btn btn-sm btn-warning"
                          title={t('common.edit')}
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button 
                          onClick={() => generateFeuille(consultation.COD_CONS || consultation.id)}
                          className="btn btn-sm btn-primary"
                          title={t('consultation.generateSheet')}
                        >
                          <i className="fas fa-print"></i>
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
    </div>
  );
};

export default ConsultationsList;