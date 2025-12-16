// src/pages/Profil.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, Shield, Key, Bell } from 'lucide-react';
import './Profil.css';

const Profil = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="profile-page">
      <h1>{t('myProfile')}</h1>
      
      <div className="profile-container">
        <div className="profile-header">
          <div className="avatar-large">
            {user?.prenom_uti?.charAt(0)}{user?.nom_uti?.charAt(0)}
          </div>
          <div className="profile-info">
            <h2>{user?.prenom_uti} {user?.nom_uti}</h2>
            <p className="profile-role">{user?.profil_uti}</p>
            <p className="profile-email">{user?.email_uti}</p>
          </div>
        </div>

        <div className="profile-sections">
          <div className="profile-section">
            <h3><User size={18} /> {t('personalInformation')}</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>{t('firstName')}</label>
                <div className="info-value">{user?.prenom_uti}</div>
              </div>
              <div className="info-item">
                <label>{t('lastName')}</label>
                <div className="info-value">{user?.nom_uti}</div>
              </div>
              <div className="info-item">
                <label>{t('email')}</label>
                <div className="info-value">{user?.email_uti}</div>
              </div>
              <div className="info-item">
                <label>{t('phone')}</label>
                <div className="info-value">{user?.tel_uti || t('notSpecified')}</div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3><Shield size={18} /> {t('security')}</h3>
            <button className="security-btn">
              <Key size={16} />
              {t('changePassword')}
            </button>
            <button className="security-btn">
              <Bell size={16} />
              {t('twoFactorAuth')}
            </button>
          </div>

          <div className="profile-section">
            <h3><Mail size={18} /> {t('preferences')}</h3>
            <div className="preferences">
              <label className="preference-item">
                <input type="checkbox" defaultChecked />
                <span>{t('emailNotifications')}</span>
              </label>
              <label className="preference-item">
                <input type="checkbox" defaultChecked />
                <span>{t('smsNotifications')}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profil;