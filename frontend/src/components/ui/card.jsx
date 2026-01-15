import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Heart
} from 'lucide-react';
import './Card.css';

const Card = () => {
  const { id } = useParams(); // Si on passe l'ID dans l'URL
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [beneficiaire, setBeneficiaire] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simuler le chargement des données
  useEffect(() => {
    // Ici, vous feriez un appel API pour récupérer les données du bénéficiaire par ID
    // Pour l'exemple, nous simulons un chargement
    const fetchBeneficiaire = async () => {
      try {
        // Simulation d'un appel API
        // const response = await api.get(`/beneficiaires/${id}`);
        // setBeneficiaire(response.data);
        
        // Données mockées pour l'exemple
        const mockBeneficiaire = {
          id: id,
          nom: 'Doe',
          prenom: 'John',
          dateNaissance: '1985-05-15',
          lieuNaissance: 'Yaoundé',
          adresse: '123 Rue de la Paix, Yaoundé',
          telephone: '+237 6 12 34 56 78',
          email: 'john.doe@example.com',
          numeroCarte: 'AMS-2023-001',
          dateAdhesion: '2023-01-15',
          statut: 'Actif',
          groupeSanguin: 'O+',
          assureur: 'AMSA Assurance',
          contrat: 'Contrat Gold',
          dateExpiration: '2024-12-31',
          photoUrl: 'https://via.placeholder.com/150'
        };
        setBeneficiaire(mockBeneficiaire);
      } catch (error) {
        console.error('Erreur lors du chargement du bénéficiaire:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBeneficiaire();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Logique pour télécharger la carte
    alert('Téléchargement de la carte');
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!beneficiaire) {
    return <div className="error">Bénéficiaire non trouvé</div>;
  }

  return (
    <div className="card-page">
      <div className="card-page-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          {t('back')}
        </button>
        <h1>{t('beneficiaryCard')}</h1>
        <div className="card-actions">
          <button className="btn-icon" onClick={handlePrint} title={t('print')}>
            <Printer size={20} />
          </button>
          <button className="btn-icon" onClick={handleDownload} title={t('download')}>
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="card-container">
        {/* Carte physique */}
        <div className="physical-card">
          <div className="card-header">
            <Heart className="card-logo" />
            <span className="card-title">AMS Santé</span>
          </div>
          <div className="card-body">
            <div className="card-photo">
              <img src={beneficiaire.photoUrl} alt={`${beneficiaire.prenom} ${beneficiaire.nom}`} />
            </div>
            <div className="card-info">
              <h2>{beneficiaire.prenom} {beneficiaire.nom}</h2>
              <div className="card-field">
                <User size={16} />
                <span>{beneficiaire.numeroCarte}</span>
              </div>
              <div className="card-field">
                <Calendar size={16} />
                <span>{t('birthDate')}: {beneficiaire.dateNaissance}</span>
              </div>
              <div className="card-field">
                <Shield size={16} />
                <span>{beneficiaire.assureur}</span>
              </div>
              <div className="card-field">
                <CreditCard size={16} />
                <span>{beneficiaire.contrat}</span>
              </div>
            </div>
          </div>
          <div className="card-footer">
            <div className="card-expiry">
              {t('expiryDate')}: {beneficiaire.dateExpiration}
            </div>
            <div className="card-status">
              {beneficiaire.statut}
            </div>
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="card-details">
          <h3>{t('detailedInformation')}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <div className="detail-label">
                <User size={16} />
                {t('lastName')}:
              </div>
              <div className="detail-value">{beneficiaire.nom}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">
                <User size={16} />
                {t('firstName')}:
              </div>
              <div className="detail-value">{beneficiaire.prenom}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">
                <Calendar size={16} />
                {t('birthDate')}:
              </div>
              <div className="detail-value">{beneficiaire.dateNaissance}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">
                <MapPin size={16} />
                {t('birthPlace')}:
              </div>
              <div className="detail-value">{beneficiaire.lieuNaissance}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">
                <MapPin size={16} />
                {t('address')}:
              </div>
              <div className="detail-value">{beneficiaire.adresse}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">
                <Phone size={16} />
                {t('phone')}:
              </div>
              <div className="detail-value">{beneficiaire.telephone}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">
                <Mail size={16} />
                {t('email')}:
              </div>
              <div className="detail-value">{beneficiaire.email}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">
                <FileText size={16} />
                {t('cardNumber')}:
              </div>
              <div className="detail-value">{beneficiaire.numeroCarte}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">
                <Calendar size={16} />
                {t('membershipDate')}:
              </div>
              <div className="detail-value">{beneficiaire.dateAdhesion}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">
                <Shield size={16} />
                {t('status')}:
              </div>
              <div className="detail-value">{beneficiaire.statut}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">
                <Heart size={16} />
                {t('bloodGroup')}:
              </div>
              <div className="detail-value">{beneficiaire.groupeSanguin}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;