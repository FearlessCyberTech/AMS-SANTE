// frontend/src/pages/ConsultationDetail.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { consultationsAPI } from '../services/api';
import './ConsultationDetail.css';

const ConsultationDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingSheet, setGeneratingSheet] = useState(false);

  useEffect(() => {
    fetchConsultation();
  }, [id]);

  const fetchConsultation = async () => {
    try {
      setLoading(true);
      const response = await consultationsAPI.getById(id);
      setConsultation(response.consultation || response.data || response);
    } catch (err) {
      setError(t('consultation.detailError'));
      console.error('Erreur chargement consultation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSheet = async () => {
    try {
      setGeneratingSheet(true);
      const response = await consultationsAPI.generateFeuillePriseEnCharge(id);
      
      if (response.success || response.feuille) {
        const printWindow = window.open('', '_blank');
        const feuille = response.feuille || response.data || response;
        
        // Même code de génération que dans Consultations.jsx
        // ... (code de génération de la feuille)
        
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
    } catch (err) {
      console.error('Erreur génération feuille:', err);
      alert(t('consultation.sheetGenerationError'));
    } finally {
      setGeneratingSheet(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('consultation.confirmDelete'))) {
      return;
    }

    try {
      await consultationsAPI.delete(id);
      navigate('/consultations');
    } catch (err) {
      setError(t('consultation.deleteError'));
      console.error('Erreur suppression:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin fa-3x"></i>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="not-found-container">
        <div className="not-found">
          <i className="fas fa-exclamation-triangle fa-3x"></i>
          <h2>{t('consultation.notFound')}</h2>
          <p>{t('consultation.notFoundText')}</p>
          <Link to="/consultations" className="btn btn-primary">
            {t('consultation.backToList')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="consultation-detail-page">
      <div className="page-header">
        <div className="header-left">
          <h1>
            {t('consultation.detailTitle')} - CONS-{consultation.COD_CONS || consultation.id}
          </h1>
          <p className="consultation-date">
            {new Date(consultation.DATE_CONSULTATION || consultation.date).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="header-actions">
          <Link to="/consultations" className="btn btn-secondary">
            <i className="fas fa-arrow-left"></i> {t('common.back')}
          </Link>
          <Link 
            to={`/consultations/${id}/edit`}
            className="btn btn-warning"
          >
            <i className="fas fa-edit"></i> {t('common.edit')}
          </Link>
          <button 
            onClick={handleGenerateSheet}
            disabled={generatingSheet}
            className="btn btn-primary"
          >
            {generatingSheet ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> {t('common.generating')}
              </>
            ) : (
              <>
                <i className="fas fa-print"></i> {t('consultation.printSheet')}
              </>
            )}
          </button>
          <button 
            onClick={handleDelete}
            className="btn btn-danger"
          >
            <i className="fas fa-trash"></i> {t('common.delete')}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-content">
        <div className="detail-grid">
          {/* Section Patient */}
          <div className="detail-card">
            <h3 className="card-title">
              <i className="fas fa-user"></i> {t('consultation.patientInfo')}
            </h3>
            <div className="card-content">
              <div className="info-row">
                <span className="info-label">{t('patient.name')}:</span>
                <span className="info-value">
                  {consultation.NOM_BEN || consultation.patientNom} {consultation.PRE_BEN || consultation.patientPrenom}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('patient.sexe')}:</span>
                <span className="info-value">
                  {consultation.SEX_BEN || consultation.sexe === 'M' ? 'Masculin' : 'Féminin'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('patient.age')}:</span>
                <span className="info-value">
                  {consultation.AGE || consultation.age} {t('common.years')}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('patient.idCard')}:</span>
                <span className="info-value">
                  {consultation.IDENTIFIANT_NATIONAL || consultation.idCard}
                </span>
              </div>
            </div>
          </div>

          {/* Section Consultation */}
          <div className="detail-card">
            <h3 className="card-title">
              <i className="fas fa-stethoscope"></i> {t('consultation.consultationInfo')}
            </h3>
            <div className="card-content">
              <div className="info-row">
                <span className="info-label">{t('consultation.type')}:</span>
                <span className="info-value">
                  {consultation.TYPE_CONSULTATION || consultation.type}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('consultation.doctor')}:</span>
                <span className="info-value">
                  {consultation.NOM_PRESTATAIRE || consultation.medecinNom}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('consultation.speciality')}:</span>
                <span className="info-value">
                  {consultation.SPECIALITE || consultation.specialite}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('consultation.motif')}:</span>
                <span className="info-value">
                  {consultation.MOTIF_CONSULTATION || consultation.motif}
                </span>
              </div>
            </div>
          </div>

          {/* Section Signes Vitaux */}
          <div className="detail-card">
            <h3 className="card-title">
              <i className="fas fa-heartbeat"></i> {t('consultation.vitalSigns')}
            </h3>
            <div className="card-content">
              <div className="vital-signs-grid">
                <div className="vital-sign">
                  <span className="vital-label">TA:</span>
                  <span className="vital-value">{consultation.TA || consultation.ta || 'NR'}</span>
                </div>
                <div className="vital-sign">
                  <span className="vital-label">{t('consultation.weight')}:</span>
                  <span className="vital-value">{consultation.POIDS || consultation.poids || 'NR'} kg</span>
                </div>
                <div className="vital-sign">
                  <span className="vital-label">{t('consultation.height')}:</span>
                  <span className="vital-value">{consultation.TAILLE || consultation.taille || 'NR'} cm</span>
                </div>
                <div className="vital-sign">
                  <span className="vital-label">{t('consultation.temperature')}:</span>
                  <span className="vital-value">{consultation.TEMPERATURE || consultation.temperature || 'NR'} °C</span>
                </div>
                <div className="vital-sign">
                  <span className="vital-label">{t('consultation.pulse')}:</span>
                  <span className="vital-value">{consultation.POULS || consultation.pouls || 'NR'} bpm</span>
                </div>
                <div className="vital-sign">
                  <span className="vital-label">{t('consultation.respiratoryRate')}:</span>
                  <span className="vital-value">{consultation.FREQUENCE_RESPIRATOIRE || consultation.fr || 'NR'}</span>
                </div>
                <div className="vital-sign">
                  <span className="vital-label">{t('consultation.glycemia')}:</span>
                  <span className="vital-value">{consultation.GLYCEMIE || consultation.glycemie || 'NR'} mg/dL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Financière */}
          <div className="detail-card">
            <h3 className="card-title">
              <i className="fas fa-money-bill-wave"></i> {t('consultation.financialInfo')}
            </h3>
            <div className="card-content">
              <div className="info-row">
                <span className="info-label">{t('consultation.amount')}:</span>
                <span className="info-value amount">
                  {(consultation.MONTANT_CONSULTATION || consultation.montant || 0).toLocaleString()} FCFA
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('consultation.status')}:</span>
                <span className={`info-value status-badge ${consultation.STATUT_PAIEMENT || consultation.statut}`}>
                  {consultation.STATUT_PAIEMENT || consultation.statut}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('consultation.urgent')}:</span>
                <span className="info-value">
                  {consultation.URGENT || consultation.urgent ? t('common.yes') : t('common.no')}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('consultation.hospitalization')}:</span>
                <span className="info-value">
                  {consultation.HOSPITALISATION || consultation.hospitalisation ? t('common.yes') : t('common.no')}
                </span>
              </div>
            </div>
          </div>

          {/* Section Diagnostic et Traitement */}
          <div className="detail-card full-width">
            <h3 className="card-title">
              <i className="fas fa-file-medical"></i> {t('consultation.medicalInfo')}
            </h3>
            <div className="card-content">
              <div className="info-section">
                <h4>{t('consultation.diagnosis')}</h4>
                <p className="medical-text">
                  {consultation.DIAGNOSTIC || consultation.diagnostic || t('consultation.noDiagnosis')}
                </p>
              </div>
              <div className="info-section">
                <h4>{t('consultation.treatment')}</h4>
                <p className="medical-text">
                  {consultation.TRAITEMENT_PRESCRIT || consultation.traitement || t('consultation.noTreatment')}
                </p>
              </div>
              <div className="info-section">
                <h4>{t('consultation.exams')}</h4>
                <p className="medical-text">
                  {consultation.EXAMENS_COMPLEMENTAIRES || consultation.examens || t('consultation.noExams')}
                </p>
              </div>
              <div className="info-section">
                <h4>{t('consultation.observations')}</h4>
                <p className="medical-text">
                  {consultation.OBSERVATIONS || consultation.observations || t('consultation.noObservations')}
                </p>
              </div>
              <div className="info-section">
                <h4>{t('consultation.nextAppointment')}</h4>
                <p className="medical-text">
                  {consultation.PROCHAIN_RDV ? 
                    new Date(consultation.PROCHAIN_RDV).toLocaleDateString('fr-FR') : 
                    t('consultation.noNextAppointment')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationDetail;