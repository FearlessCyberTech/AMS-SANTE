// src/pages/beneficiaires/BeneficiaireDetail.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Calendar, Phone, Mail, MapPin, 
  FileText, Stethoscope, DollarSign, History,
  Edit, Download, Printer, Share2, ArrowLeft
} from 'lucide-react';
import './BeneficiaireDetail.css';

const BeneficiaireDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [beneficiaire, setBeneficiaire] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    // Simuler le chargement des données
    const mockBeneficiaire = {
      id: id,
      matricule: 'AMS001',
      nom: 'Dupont',
      prenom: 'Jean',
      dateNaissance: '1980-05-15',
      lieuNaissance: 'Yaoundé',
      sexe: 'M',
      telephone: '+237 612345678',
      email: 'jean.dupont@example.com',
      adresse: 'Rue 1234, Yaoundé',
      profession: 'Ingénieur',
      groupeSanguin: 'A+',
      situationFamiliale: 'Marié',
      nombreEnfants: 2,
      employeur: 'Société XYZ',
      dateEnrolement: '2020-01-15',
      statut: 'Actif'
    };
    setBeneficiaire(mockBeneficiaire);
  }, [id]);

  if (!beneficiaire) {
    return <div className="loading">{t('loading')}</div>;
  }

  const tabs = [
    { id: 'info', label: t('personalInfo'), icon: User },
    { id: 'medical', label: t('medicalInfo'), icon: Stethoscope },
    { id: 'financial', label: t('financialInfo'), icon: DollarSign },
    { id: 'history', label: t('history'), icon: History }
  ];

  return (
    <div className="beneficiaire-detail-page">
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate('/beneficiaires')}>
          <ArrowLeft size={18} />
          {t('backToList')}
        </button>
        
        <div className="header-actions">
          <button className="btn-action">
            <Edit size={18} />
            {t('edit')}
          </button>
          <button className="btn-action">
            <Download size={18} />
            {t('download')}
          </button>
          <button className="btn-action">
            <Printer size={18} />
            {t('print')}
          </button>
          <button className="btn-action">
            <Share2 size={18} />
            {t('share')}
          </button>
        </div>
      </div>

      <div className="beneficiaire-card">
        <div className="beneficiaire-header">
          <div className="avatar-large">
            {beneficiaire.prenom.charAt(0)}{beneficiaire.nom.charAt(0)}
          </div>
          <div className="header-info">
            <h1>{beneficiaire.prenom} {beneficiaire.nom}</h1>
            <div className="header-details">
              <span className="matricule">
                <FileText size={14} />
                {beneficiaire.matricule}
              </span>
              <span className={`status status-${beneficiaire.statut.toLowerCase()}`}>
                {beneficiaire.statut}
              </span>
              <span className="enrollment-date">
                <Calendar size={14} />
                {t('enrolledOn')}: {beneficiaire.dateEnrolement}
              </span>
            </div>
          </div>
        </div>

        <div className="quick-info">
          <div className="info-item">
            <Phone size={16} />
            <span>{beneficiaire.telephone}</span>
          </div>
          <div className="info-item">
            <Mail size={16} />
            <span>{beneficiaire.email}</span>
          </div>
          <div className="info-item">
            <MapPin size={16} />
            <span>{beneficiaire.adresse}</span>
          </div>
        </div>
      </div>

      <div className="detail-tabs">
        <div className="tabs-header">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="tab-content">
          {activeTab === 'info' && (
            <div className="personal-info">
              <div className="info-section">
                <h3>{t('personalInformation')}</h3>
                <div className="info-grid">
                  <InfoField label={t('birthDate')} value={beneficiaire.dateNaissance} />
                  <InfoField label={t('birthPlace')} value={beneficiaire.lieuNaissance} />
                  <InfoField label={t('gender')} value={t(beneficiaire.sexe === 'M' ? 'male' : 'female')} />
                  <InfoField label={t('maritalStatus')} value={beneficiaire.situationFamiliale} />
                  <InfoField label={t('childrenCount')} value={beneficiaire.nombreEnfants} />
                  <InfoField label={t('profession')} value={beneficiaire.profession} />
                </div>
              </div>

              <div className="info-section">
                <h3>{t('medicalInformation')}</h3>
                <div className="info-grid">
                  <InfoField label={t('bloodGroup')} value={beneficiaire.groupeSanguin} />
                  <InfoField label={t('allergies')} value="Aucune connue" />
                  <InfoField label={t('chronicDiseases')} value="Aucune" />
                  <InfoField label={t('currentTreatments')} value="Aucun" />
                </div>
              </div>

              <div className="info-section">
                <h3>{t('employerInformation')}</h3>
                <div className="info-grid">
                  <InfoField label={t('employer')} value={beneficiaire.employeur} />
                  <InfoField label={t('contractType')} value="CDI" />
                  <InfoField label={t('startDate')} value="2015-03-01" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'medical' && (
            <div className="medical-info">
              <h3>{t('medicalHistory')}</h3>
              <p>{t('noMedicalRecords')}</p>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="financial-info">
              <h3>{t('financialInformation')}</h3>
              <p>{t('noFinancialRecords')}</p>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-info">
              <h3>{t('activityHistory')}</h3>
              <p>{t('noActivityRecords')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoField = ({ label, value }) => (
  <div className="info-field">
    <label>{label}</label>
    <div className="value">{value || '-'}</div>
  </div>
);

export default BeneficiaireDetail;