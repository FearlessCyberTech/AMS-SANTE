// src/pages/beneficiaires/Card.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Shield, 
  CreditCard, 
  ArrowLeft,
  Printer,
  Download,
  Heart,
  Users,
  Home,
  Building,
  BriefcaseMedical,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  QrCode,
  Camera,
  Fingerprint,
  Globe,
  Activity,
  Tag,
  Clock,
  ChevronRight,
  BadgeCheck,
  ShieldCheck,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Card.css';

const Card = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [beneficiaire, setBeneficiaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showQrCode, setShowQrCode] = useState(false);
  const cardRef = useRef(null);

  // Simuler le chargement des données
  useEffect(() => {
    const fetchBeneficiaire = async () => {
      try {
        setLoading(true);
        // Dans la vraie application, vous appelleriez votre API
        // const response = await api.get(`/beneficiaires/${id}`);
        
        // Données mockées pour la démo
        setTimeout(() => {
          const mockBeneficiaire = {
            id: id,
            matricule: 'AMS-2023-001',
            nom: 'Doe',
            prenom: 'John',
            date_naissance: '1985-05-15',
            lieu_naissance: 'Yaoundé',
            adresse: '123 Rue de la Paix, Yaoundé',
            telephone: '+237 6 12 34 56 78',
            email: 'john.doe@example.com',
            numero_carte: 'CARD-AMS-001',
            date_adhesion: '2023-01-15',
            statut: 'Actif',
            groupe_sanguin: 'O+',
            assureur: 'AMSA Assurance',
            contrat: 'Contrat Gold',
            date_expiration: '2024-12-31',
            photo_url: 'https://via.placeholder.com/200x250',
            qr_code: `AMS-BENEF-${id}`,
            
            // Informations famille
            famille: {
              id: 'FAM-001',
              nom: 'Doe Family',
              chef_famille: true,
              membres: [
                { id: 'B002', nom: 'Doe', prenom: 'Jane', relation: 'Conjoint' },
                { id: 'B003', nom: 'Doe', prenom: 'Alice', relation: 'Enfant' },
                { id: 'B004', nom: 'Doe', prenom: 'Bob', relation: 'Enfant' }
              ]
            },
            
            // Informations médicales
            medical: {
              medecin_traitant: 'Dr. Martin',
              derniere_consultation: '2024-01-15',
              allergies: 'Pénicilline, Pollen',
              maladies_chroniques: 'Hypertension',
              dernier_bilan: '2023-12-01'
            },
            
            // Informations financières
            financier: {
              solde: 125000,
              plafond_annuel: 500000,
              consommation_annuelle: 375000,
              derniere_facture: '2024-01-10',
              statut_paiement: 'À jour'
            },
            
            // Historique
            historique: [
              { date: '2024-01-15', type: 'Consultation', montant: 15000, prestataire: 'Hôpital Central' },
              { date: '2023-12-01', type: 'Bilan', montant: 25000, prestataire: 'Labo Médical' },
              { date: '2023-10-20', type: 'Médicaments', montant: 45000, prestataire: 'Pharmacie Santé' },
              { date: '2023-08-05', type: 'Consultation', montant: 15000, prestataire: 'Clinique Espoir' }
            ]
          };
          
          setBeneficiaire(mockBeneficiaire);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Erreur lors du chargement du bénéficiaire:', err);
        setError(t('errorLoadingBeneficiary'));
        setLoading(false);
      }
    };

    if (id) {
      fetchBeneficiaire();
    }
  }, [id, t]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Logique pour télécharger la carte
    const element = cardRef.current;
    if (element) {
      const html2canvas = require('html2canvas');
      html2canvas(element).then(canvas => {
        const link = document.createElement('a');
        link.download = `carte-beneficiaire-${beneficiaire.matricule}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };

  const handleRenouveler = () => {
    // Logique de renouvellement
    alert(t('renewalInProgress'));
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'Actif': return 'status-active';
      case 'Inactif': return 'status-inactive';
      case 'En attente': return 'status-pending';
      case 'Expiré': return 'status-expired';
      default: return 'status-default';
    }
  };

  const getPaymentStatusColor = (statut) => {
    switch (statut) {
      case 'À jour': return 'payment-good';
      case 'En retard': return 'payment-late';
      case 'Suspendu': return 'payment-suspended';
      default: return 'payment-default';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('loadingBeneficiary')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertCircle size={48} />
        <h3>{error}</h3>
        <button onClick={() => navigate('/beneficiaires')} className="btn btn-primary">
          {t('backToBeneficiaries')}
        </button>
      </div>
    );
  }

  if (!beneficiaire) {
    return (
      <div className="not-found">
        <XCircle size={48} />
        <h3>{t('beneficiaryNotFound')}</h3>
        <button onClick={() => navigate('/beneficiaires')} className="btn btn-primary">
          {t('backToBeneficiaries')}
        </button>
      </div>
    );
  }

  return (
    <div className="card-page">
      {/* En-tête */}
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/beneficiaires')}>
          <ArrowLeft size={20} />
          {t('backToBeneficiaries')}
        </button>
        
        <div className="header-title">
          <h1>{t('beneficiaryCard')}</h1>
          <div className="header-subtitle">
            <span className="badge badge-light">{beneficiaire.matricule}</span>
            <span className={`status-badge ${getStatusColor(beneficiaire.statut)}`}>
              {beneficiaire.statut}
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-outline" 
            onClick={() => navigate(`/beneficiaires/${id}/edit`)}
            title={t('edit')}
          >
            <Edit size={18} />
            <span>{t('edit')}</span>
          </button>
          <button className="btn btn-outline" onClick={handlePrint} title={t('print')}>
            <Printer size={18} />
            <span>{t('print')}</span>
          </button>
          <button className="btn btn-outline" onClick={handleDownload} title={t('downloadCard')}>
            <Download size={18} />
            <span>{t('download')}</span>
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowQrCode(!showQrCode)}
            title={t('showQRCode')}
          >
            <QrCode size={18} />
            <span>{t('qrCode')}</span>
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrCode && (
        <div className="qr-modal">
          <div className="qr-modal-content">
            <div className="qr-modal-header">
              <h3>{t('beneficiaryQRCode')}</h3>
              <button className="close-modal" onClick={() => setShowQrCode(false)}>
                ×
              </button>
            </div>
            <div className="qr-code-container">
              <div className="qr-code">
                {/* Placeholder pour le vrai QR code */}
                <div className="qr-placeholder">
                  <QrCode size={120} />
                  <div className="qr-text">{beneficiaire.qr_code}</div>
                </div>
              </div>
              <div className="qr-info">
                <p><strong>{t('cardNumber')}:</strong> {beneficiaire.numero_carte}</p>
                <p><strong>{t('beneficiary')}:</strong> {beneficiaire.prenom} {beneficiaire.nom}</p>
                <p><strong>{t('expiryDate')}:</strong> {beneficiaire.date_expiration}</p>
              </div>
            </div>
            <div className="qr-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowQrCode(false)}>
                {t('close')}
              </button>
              <button className="btn btn-primary" onClick={handleDownload}>
                <Download size={18} />
                {t('downloadQRCode')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card-layout">
        {/* Côté gauche - Carte physique */}
        <div className="card-side">
          <div className="card-preview" ref={cardRef}>
            <div className="physical-card">
              <div className="card-header">
                <div className="card-logo">
                  <Heart className="logo-icon" />
                  <span className="logo-text">AMS Santé</span>
                </div>
                <div className="card-region">
                  <Globe size={12} />
                  <span>{t('centralAfrica')}</span>
                </div>
              </div>
              
              <div className="card-body">
                <div className="card-photo-section">
                  <div className="card-photo">
                    <img src={beneficiaire.photo_url} alt={`${beneficiaire.prenom} ${beneficiaire.nom}`} />
                  </div>
                  <div className="card-biometric">
                    <Fingerprint size={16} />
                    <span>{t('biometricVerified')}</span>
                  </div>
                </div>
                
                <div className="card-info-section">
                  <div className="card-name">
                    <h2>{beneficiaire.prenom} {beneficiaire.nom}</h2>
                    <BadgeCheck className="verified-icon" size={20} />
                  </div>
                  
                  <div className="card-details-grid">
                    <div className="card-detail">
                      <User size={14} />
                      <span><strong>{t('cardNumber')}:</strong> {beneficiaire.numero_carte}</span>
                    </div>
                    <div className="card-detail">
                      <Calendar size={14} />
                      <span><strong>{t('birthDate')}:</strong> {beneficiaire.date_naissance}</span>
                    </div>
                    <div className="card-detail">
                      <Shield size={14} />
                      <span><strong>{t('insurer')}:</strong> {beneficiaire.assureur}</span>
                    </div>
                    <div className="card-detail">
                      <CreditCard size={14} />
                      <span><strong>{t('contract')}:</strong> {beneficiaire.contrat}</span>
                    </div>
                  </div>
                  
                  <div className="card-qr-small">
                    <QrCode size={60} />
                  </div>
                </div>
              </div>
              
              <div className="card-footer">
                <div className="card-validity">
                  <div className="validity-label">{t('validUntil')}</div>
                  <div className="validity-date">{beneficiaire.date_expiration}</div>
                </div>
                <div className="card-status-indicator">
                  <div className={`status-dot ${beneficiaire.statut === 'Actif' ? 'active' : 'inactive'}`}></div>
                  <span>{beneficiaire.statut}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card-actions-section">
            <button className="btn btn-warning" onClick={handleRenouveler}>
              <RefreshCw size={18} />
              {t('renewCard')}
            </button>
            <div className="card-metadata">
              <div className="metadata-item">
                <Clock size={14} />
                <span>{t('lastUpdate')}: 2024-01-20</span>
              </div>
              <div className="metadata-item">
                <User size={14} />
                <span>{t('createdBy')}: {user?.prenom_uti} {user?.nom_uti}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Côté droit - Informations détaillées */}
        <div className="details-side">
          <div className="details-tabs">
            <button 
              className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              <User size={18} />
              {t('personalInfo')}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'medical' ? 'active' : ''}`}
              onClick={() => setActiveTab('medical')}
            >
              <Stethoscope size={18} />
              {t('medicalInfo')}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'financial' ? 'active' : ''}`}
              onClick={() => setActiveTab('financial')}
            >
              <CreditCard size={18} />
              {t('financialInfo')}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'family' ? 'active' : ''}`}
              onClick={() => setActiveTab('family')}
            >
              <Users size={18} />
              {t('family')}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <Activity size={18} />
              {t('history')}
            </button>
          </div>

          <div className="tab-content">
            {/* Onglet Informations personnelles */}
            {activeTab === 'info' && (
              <div className="info-grid">
                <div className="info-section">
                  <h3><User size={18} /> {t('identity')}</h3>
                  <div className="info-row">
                    <span className="info-label">{t('lastName')}:</span>
                    <span className="info-value">{beneficiaire.nom}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('firstName')}:</span>
                    <span className="info-value">{beneficiaire.prenom}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('birthDate')}:</span>
                    <span className="info-value">{beneficiaire.date_naissance}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('birthPlace')}:</span>
                    <span className="info-value">{beneficiaire.lieu_naissance}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('bloodGroup')}:</span>
                    <span className="info-value badge badge-medical">{beneficiaire.groupe_sanguin}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h3><MapPin size={18} /> {t('contact')}</h3>
                  <div className="info-row">
                    <span className="info-label">{t('address')}:</span>
                    <span className="info-value">{beneficiaire.adresse}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('phone')}:</span>
                    <span className="info-value">{beneficiaire.telephone}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('email')}:</span>
                    <span className="info-value">{beneficiaire.email}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h3><ShieldCheck size={18} /> {t('insurance')}</h3>
                  <div className="info-row">
                    <span className="info-label">{t('insurer')}:</span>
                    <span className="info-value">{beneficiaire.assureur}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('contract')}:</span>
                    <span className="info-value badge badge-contract">{beneficiaire.contrat}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('membershipDate')}:</span>
                    <span className="info-value">{beneficiaire.date_adhesion}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('expiryDate')}:</span>
                    <span className={`info-value ${new Date(beneficiaire.date_expiration) < new Date() ? 'text-danger' : ''}`}>
                      {beneficiaire.date_expiration}
                    </span>
                  </div>
                </div>

                <div className="info-section">
                  <h3><FileCheck size={18} /> {t('cardInfo')}</h3>
                  <div className="info-row">
                    <span className="info-label">{t('cardNumber')}:</span>
                    <span className="info-value text-monospace">{beneficiaire.numero_carte}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('matricule')}:</span>
                    <span className="info-value">{beneficiaire.matricule}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('status')}:</span>
                    <span className={`info-value status-badge ${getStatusColor(beneficiaire.statut)}`}>
                      {beneficiaire.statut}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Informations médicales */}
            {activeTab === 'medical' && (
              <div className="medical-info">
                <div className="info-section">
                  <h3><Stethoscope size={18} /> {t('medicalInformation')}</h3>
                  <div className="info-row">
                    <span className="info-label">{t('treatingDoctor')}:</span>
                    <span className="info-value">{beneficiaire.medical.medecin_traitant}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('lastConsultation')}:</span>
                    <span className="info-value">{beneficiaire.medical.derniere_consultation}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('lastCheckup')}:</span>
                    <span className="info-value">{beneficiaire.medical.dernier_bilan}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h3><AlertCircle size={18} /> {t('medicalAlerts')}</h3>
                  <div className="info-row">
                    <span className="info-label">{t('allergies')}:</span>
                    <span className="info-value badge badge-warning">{beneficiaire.medical.allergies}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('chronicDiseases')}:</span>
                    <span className="info-value badge badge-danger">{beneficiaire.medical.maladies_chroniques}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h3><Activity size={18} /> {t('medicalHistory')}</h3>
                  <button className="btn btn-outline btn-sm">
                    {t('viewMedicalRecord')} <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Onglet Informations financières */}
            {activeTab === 'financial' && (
              <div className="financial-info">
                <div className="financial-stats">
                  <div className="stat-card">
                    <div className="stat-label">{t('annualBalance')}</div>
                    <div className="stat-value">{beneficiaire.financier.solde.toLocaleString()} FCFA</div>
                    <div className="stat-progress">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${(beneficiaire.financier.consommation_annuelle / beneficiaire.financier.plafond_annuel) * 100}%` }}
                      ></div>
                    </div>
                    <div className="stat-info">
                      {t('consumed')}: {beneficiaire.financier.consommation_annuelle.toLocaleString()} / {beneficiaire.financier.plafond_annuelle.toLocaleString()} FCFA
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-label">{t('paymentStatus')}</div>
                    <div className={`stat-value ${getPaymentStatusColor(beneficiaire.financier.statut_paiement)}`}>
                      {beneficiaire.financier.statut_paiement}
                    </div>
                    <div className="stat-info">
                      {t('lastInvoice')}: {beneficiaire.financier.derniere_facture}
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h3><CreditCard size={18} /> {t('recentTransactions')}</h3>
                  <button className="btn btn-outline" onClick={() => navigate(`/beneficiaires/${id}/transactions`)}>
                    {t('viewAllTransactions')} <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Onglet Famille */}
            {activeTab === 'family' && (
              <div className="family-info">
                <div className="info-section">
                  <h3><Users size={18} /> {t('familyInformation')}</h3>
                  <div className="info-row">
                    <span className="info-label">{t('familyName')}:</span>
                    <span className="info-value">{beneficiaire.famille.nom}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('familyRole')}:</span>
                    <span className="info-value">
                      {beneficiaire.famille.chef_famille ? t('familyHead') : t('familyMember')}
                    </span>
                  </div>
                </div>

                <div className="info-section">
                  <h3>{t('familyMembers')} ({beneficiaire.famille.membres.length})</h3>
                  <div className="family-members">
                    {beneficiaire.famille.membres.map(membre => (
                      <div key={membre.id} className="family-member">
                        <div className="member-avatar">
                          {membre.prenom.charAt(0)}
                        </div>
                        <div className="member-info">
                          <div className="member-name">{membre.prenom} {membre.nom}</div>
                          <div className="member-relation">{t(membre.relation)}</div>
                        </div>
                        <Link to={`/beneficiaires/${membre.id}/card`} className="member-action">
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Historique */}
            {activeTab === 'history' && (
              <div className="history-info">
                <div className="info-section">
                  <h3><Activity size={18} /> {t('recentActivity')}</h3>
                  <div className="activity-timeline">
                    {beneficiaire.historique.map((item, index) => (
                      <div key={index} className="activity-item">
                        <div className="activity-date">{item.date}</div>
                        <div className="activity-content">
                          <div className="activity-type">{item.type}</div>
                          <div className="activity-details">
                            {item.prestataire} • {item.montant.toLocaleString()} FCFA
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;