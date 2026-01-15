// src/pages/admin/Administration.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Settings, Users, Shield, Database, Bell,
  Lock, Globe, FileText, BarChart3, Cpu
} from 'lucide-react';
import './Administration.css';

const Administration = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('users');

  const sections = [
    { id: 'users', label: t('userManagement'), icon: Users, color: 'blue' },
    { id: 'roles', label: t('rolesPermissions'), icon: Shield, color: 'purple' },
    { id: 'database', label: t('database'), icon: Database, color: 'green' },
    { id: 'notifications', label: t('notifications'), icon: Bell, color: 'orange' },
    { id: 'security', label: t('security'), icon: Lock, color: 'red' },
    { id: 'system', label: t('systemSettings'), icon: Settings, color: 'gray' }
  ];

  return (
    <div className="administration-page">
      <h1><Settings size={24} /> {t('administration')}</h1>
      
      <div className="admin-sections">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <div 
              key={section.id}
              className={`admin-section ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <div className={`section-icon ${section.color}`}>
                <Icon size={24} />
              </div>
              <div className="section-info">
                <h3>{section.label}</h3>
                <p>{t(`${section.id}Description`)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-content">
        {activeSection === 'users' && (
          <div className="section-content">
            <h2>{t('userManagement')}</h2>
            <p>{t('manageSystemUsers')}</p>
            {/* Contenu de gestion des utilisateurs */}
          </div>
        )}
        
        {activeSection === 'roles' && (
          <div className="section-content">
            <h2>{t('rolesPermissions')}</h2>
            <p>{t('manageRolesPermissions')}</p>
            {/* Contenu de gestion des rôles */}
          </div>
        )}
        
        {/* Autres sections */}
      </div>
    </div>
  );
};

export default Administration;