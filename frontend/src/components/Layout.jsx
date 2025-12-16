import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Stethoscope, 
  FileText, 
  DollarSign, 
  LogOut,
  Menu,
  X,
  User,
  Settings,
  Heart,
  ClipboardList,
  Shield,
  BarChart3,
  Building,
  Globe,
  Activity,
  MapPin,
  BriefcaseMedical,
  CreditCard,
  AlertTriangle,
  FileArchive,
  MessageSquare,
  TrendingUp,
  Network,
  Video,
  Ambulance,
  Banknote,
  Bell,
  Mail,
  HelpCircle,
  FileSearch,
  CheckCircle,
  ClipboardCheck,
  Percent,
  Star 
} from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { t, i18n } = useTranslation();

  // Fonction pour obtenir la langue selon le pays de l'utilisateur
  const getLanguageFromCountry = (codPay) => {
    const countryLanguageMap = {
      'CMF': 'fr-FR',
      'CMA': 'en-GB',
      'RCA': 'fr-FR',
      'TCD': 'fr-FR',
      'GNQ': 'es-ES',
      'BDI': 'en-GB',
      'COG': 'fr-FR'
    };
    return countryLanguageMap[codPay] || 'fr-FR';
  };

  // Changer la langue automatiquement selon le pays de l'utilisateur
  useEffect(() => {
    if (user?.cod_pay) {
      const language = getLanguageFromCountry(user.cod_pay);
      i18n.changeLanguage(language);
    }
  }, [user?.cod_pay, i18n]);

  // Vérifier les permissions d'accès aux routes
  const hasAccessToRoute = useMemo(() => {
    return (path) => {
      const role = user?.profil_uti || user?.role;
      if (!role) return false;

      const routePermissions = {
        '/dashboard': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        
        // Gestion des bénéficiaires
        '/beneficiaires': ['SuperAdmin', 'Admin', 'Secretaire'],
        '/beneficiaires/:id': ['SuperAdmin', 'Admin', 'Secretaire'],
        '/enrolement-biometrique': ['SuperAdmin', 'Admin', 'Secretaire'],
        '/familles-ace': ['SuperAdmin', 'Admin', 'Secretaire'],
        
        // Parcours de soins
        '/consultations': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/accords-prealables': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/prescriptions': ['SuperAdmin', 'Admin', 'Medecin'],
        '/execution-prescriptions': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/dossiers-medicaux': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/teleconsultations': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/urgences': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        
        // Remboursements et facturation
        '/facturation': ['SuperAdmin', 'Admin', 'Caissier'],
        '/remboursements': ['SuperAdmin', 'Admin', 'Caissier'],
        '/paiements': ['SuperAdmin', 'Admin', 'Caissier'],
        '/ticket-moderateur': ['SuperAdmin', 'Admin', 'Caissier'],
        
        // Statistiques
        '/statistiques': ['SuperAdmin', 'Admin', 'Medecin'],
        '/rapports': ['SuperAdmin', 'Admin', 'Medecin'],
        '/tableaux-bord': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier'],
        
        // Évacuation sanitaire
        '/evacuations': ['SuperAdmin', 'Admin', 'Medecin'],
        '/suivi-evacuations': ['SuperAdmin', 'Admin', 'Medecin'],
        
        // Contrôle et audit
        '/controle-fraudes': ['SuperAdmin', 'Admin'],
        '/audit': ['SuperAdmin', 'Admin'],
        '/alertes-anomalies': ['SuperAdmin', 'Admin', 'Medecin', 'Caissier'],
        
        // Interaction
        '/messagerie': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        '/notifications': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        
        // Documentation
        '/archivage': ['SuperAdmin', 'Admin', 'Secretaire'],
        '/documents': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire'],
        
        // Règlement
        '/reglements': ['SuperAdmin', 'Admin', 'Caissier'],
        '/gestion-financiere': ['SuperAdmin', 'Admin'],
        '/litiges': ['SuperAdmin', 'Admin', 'Caissier'],
        
        // Réseau de soins
        '/reseau-soins': ['SuperAdmin', 'Admin'],
        '/prestataires': ['SuperAdmin', 'Admin', 'Medecin'],
        '/centres-sante': ['SuperAdmin', 'Admin'],
        '/conventions': ['SuperAdmin', 'Admin'],
        '/evaluation-prestataires': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Utilisateur'],
        
        // Administration
        '/administration': ['SuperAdmin', 'Admin'],
        '/parametres': ['SuperAdmin', 'Admin'],
        '/geographie': ['SuperAdmin', 'Admin'],
        '/nomenclatures': ['SuperAdmin', 'Admin', 'Medecin'],
        
        // Support
        '/support': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        '/feedback': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        '/documentation-utilisateur': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        
        // Profil
        '/profil': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur']
      };

      if (routePermissions[path]) {
        return routePermissions[path].includes(role);
      }

      // Vérifier les routes avec paramètres
      const paramRoutes = Object.keys(routePermissions).filter(key => key.includes(':'));
      for (const routePattern of paramRoutes) {
        const basePath = routePattern.split('/:')[0];
        if (path.startsWith(basePath + '/') && path.split('/').length === basePath.split('/').length + 1) {
          return routePermissions[routePattern].includes(role);
        }
      }

      return false;
    };
  }, [user]);

  // Obtenir les éléments de menu selon le rôle
  const getMenuItems = useMemo(() => {
    const role = user?.profil_uti || user?.role;
    if (!role) return [];
    
    const allItems = [
      // 🏠 Tableau de bord
      { 
        path: '/dashboard', 
        icon: BarChart3, 
        label: t('menu.dashboard', 'Tableau de Bord'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        translationKey: 'dashboard'
      },
      
      // 👥 Gestion des bénéficiaires
      { 
        path: '/beneficiaires', 
        icon: Users, 
        label: t('menu.beneficiaries', 'Bénéficiaires'), 
        roles: ['SuperAdmin', 'Admin', 'Secretaire'],
        translationKey: 'beneficiaries'
      },
      { 
        path: '/enrolement-biometrique', 
        icon: Users, 
        label: t('menu.biometricEnrollment', 'Enrôlement Biométrique'), 
        roles: ['SuperAdmin', 'Admin', 'Secretaire'],
        translationKey: 'biometricEnrollment'
      },
      { 
        path: '/familles-ace', 
        icon: Users, 
        label: t('menu.aceFamilies', 'Familles ACE'), 
        roles: ['SuperAdmin', 'Admin', 'Secretaire'],
        translationKey: 'aceFamilies'
      },
      
      // 🏥 Parcours de soins
      { 
        path: '/consultations', 
        icon: Stethoscope, 
        label: t('menu.consultations', 'Consultations'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        translationKey: 'consultations'
      },
      { 
        path: '/accords-prealables', 
        icon: FileText, 
        label: t('menu.priorAgreements', 'Accords Préalables'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        translationKey: 'priorAgreements'
      },
      { 
        path: '/prescriptions', 
        icon: ClipboardList, 
        label: t('menu.prescriptions', 'Prescriptions'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin'],
        translationKey: 'prescriptions'
      },
      { 
        path: '/dossiers-medicaux', 
        icon: ClipboardCheck, 
        label: t('menu.medicalRecords', 'Dossiers Médicaux'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        translationKey: 'medicalRecords'
      },
      { 
        path: '/teleconsultations', 
        icon: Video, 
        label: t('menu.teleconsultations', 'Téléconsultations'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        translationKey: 'teleconsultations'
      },
      { 
        path: '/urgences', 
        icon: Ambulance, 
        label: t('menu.emergencies', 'Urgences'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        translationKey: 'emergencies'
      },
      
      // 💰 Remboursements et facturation
      { 
        path: '/facturation', 
        icon: DollarSign, 
        label: t('menu.billing', 'Facturation'), 
        roles: ['SuperAdmin', 'Admin', 'Caissier'],
        translationKey: 'billing'
      },
      { 
        path: '/remboursements', 
        icon: CreditCard, 
        label: t('menu.reimbursements', 'Remboursements'), 
        roles: ['SuperAdmin', 'Admin', 'Caissier'],
        translationKey: 'reimbursements'
      },
      { 
        path: '/paiements', 
        icon: Banknote, 
        label: t('menu.payments', 'Paiements'), 
        roles: ['SuperAdmin', 'Admin', 'Caissier'],
        translationKey: 'payments'
      },
      { 
        path: '/ticket-moderateur', 
        icon: Percent, 
        label: t('menu.ticketModerator', 'Ticket Modérateur'), 
        roles: ['SuperAdmin', 'Admin', 'Caissier'],
        translationKey: 'ticketModerator'
      },
      
      // 📊 Statistiques et reporting
      { 
        path: '/statistiques', 
        icon: TrendingUp, 
        label: t('menu.statistics', 'Statistiques'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin'],
        translationKey: 'statistics'
      },
      { 
        path: '/rapports', 
        icon: Activity, 
        label: t('menu.reports', 'Rapports'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin'],
        translationKey: 'reports'
      },
      { 
        path: '/tableaux-bord', 
        icon: BarChart3, 
        label: t('menu.dashboards', 'Tableaux de Bord'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier'],
        translationKey: 'dashboards'
      },
      
      // 🚑 Évacuation sanitaire
      { 
        path: '/evacuations', 
        icon: Ambulance, 
        label: t('menu.evacuations', 'Évacuations'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin'],
        translationKey: 'evacuations'
      },
      { 
        path: '/suivi-evacuations', 
        icon: MapPin, 
        label: t('menu.evacuationTracking', 'Suivi des Évacuations'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin'],
        translationKey: 'evacuationTracking'
      },
      
      // 🛡️ Contrôle et audit
      { 
        path: '/controle-fraudes', 
        icon: Shield, 
        label: t('menu.fraudControl', 'Contrôle des Fraudes'), 
        roles: ['SuperAdmin', 'Admin'],
        translationKey: 'fraudControl'
      },
      { 
        path: '/audit', 
        icon: FileSearch, 
        label: t('menu.audit', 'Audit'), 
        roles: ['SuperAdmin', 'Admin'],
        translationKey: 'audit'
      },
      { 
        path: '/alertes-anomalies', 
        icon: AlertTriangle, 
        label: t('menu.anomalyAlerts', 'Alertes Anomalies'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Caissier'],
        translationKey: 'anomalyAlerts'
      },
      
      // 🤝 Interaction multi-acteurs
      { 
        path: '/messagerie', 
        icon: Mail, 
        label: t('menu.messaging', 'Messagerie'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        translationKey: 'messaging'
      },
      { 
        path: '/notifications', 
        icon: Bell, 
        label: t('menu.notifications', 'Notifications'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        translationKey: 'notifications'
      },
      
      // 📚 Documentation et archivage
      { 
        path: '/archivage', 
        icon: FileArchive, 
        label: t('menu.archiving', 'Archivage'), 
        roles: ['SuperAdmin', 'Admin', 'Secretaire'],
        translationKey: 'archiving'
      },
      { 
        path: '/documents', 
        icon: FileText, 
        label: t('menu.documents', 'Documents'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire'],
        translationKey: 'documents'
      },
      
      // 💳 Module de règlement
      { 
        path: '/reglements', 
        icon: CreditCard, 
        label: t('menu.settlements', 'Règlements'), 
        roles: ['SuperAdmin', 'Admin', 'Caissier'],
        translationKey: 'settlements'
      },
      { 
        path: '/gestion-financiere', 
        icon: Banknote, 
        label: t('menu.financialManagement', 'Gestion Financière'), 
        roles: ['SuperAdmin', 'Admin'],
        translationKey: 'financialManagement'
      },
      { 
        path: '/litiges', 
        icon: AlertTriangle, 
        label: t('menu.disputes', 'Litiges'), 
        roles: ['SuperAdmin', 'Admin', 'Caissier'],
        translationKey: 'disputes'
      },
      
      // 🏥 Gestion du réseau de soins
      { 
        path: '/reseau-soins', 
        icon: Network, 
        label: t('menu.careNetwork', 'Réseau de Soins'), 
        roles: ['SuperAdmin', 'Admin'],
        translationKey: 'careNetwork'
      },
      { 
        path: '/prestataires', 
        icon: BriefcaseMedical, 
        label: t('menu.providers', 'Prestataires'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin'],
        translationKey: 'providers'
      },
      { 
        path: '/centres-sante', 
        icon: Building, 
        label: t('menu.healthCenters', 'Centres de Santé'), 
        roles: ['SuperAdmin', 'Admin'],
        translationKey: 'healthCenters'
      },
      { 
        path: '/conventions', 
        icon: FileText, 
        label: t('menu.agreements', 'Conventions'), 
        roles: ['SuperAdmin', 'Admin'],
        translationKey: 'agreements'
      },
      { 
        path: '/evaluation-prestataires', 
        icon: Star, 
        label: t('menu.providerEvaluation', 'Évaluation Prestataires'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Utilisateur'],
        translationKey: 'providerEvaluation'
      },
      
      // ⚙️ Administration et configuration
      { 
        path: '/administration', 
        icon: Settings, 
        label: t('menu.administration', 'Administration'), 
        roles: ['SuperAdmin', 'Admin'],
        translationKey: 'administration'
      },
      { 
        path: '/parametres', 
        icon: Settings, 
        label: t('menu.settings', 'Paramètres'), 
        roles: ['SuperAdmin', 'Admin'],
        translationKey: 'settings'
      },
      { 
        path: '/geographie', 
        icon: MapPin, 
        label: t('menu.geography', 'Géographie'), 
        roles: ['SuperAdmin', 'Admin'],
        translationKey: 'geography'
      },
      { 
        path: '/nomenclatures', 
        icon: ClipboardList, 
        label: t('menu.nomenclatures', 'Nomenclatures'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin'],
        translationKey: 'nomenclatures'
      },
      
      // 🆘 Support et documentation utilisateur
      { 
        path: '/support', 
        icon: HelpCircle, 
        label: t('menu.support', 'Support'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        translationKey: 'support'
      },
      { 
        path: '/feedback', 
        icon: MessageSquare, 
        label: t('menu.feedback', 'Feedback'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        translationKey: 'feedback'
      },
      { 
        path: '/documentation-utilisateur', 
        icon: FileText, 
        label: t('menu.userDocumentation', 'Documentation Utilisateur'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        translationKey: 'userDocumentation'
      },

      // 👤 Profil utilisateur
      { 
        path: '/profil', 
        icon: User, 
        label: t('menu.myProfile', 'Mon Profil'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        translationKey: 'myProfile'
      }
    ];

    return allItems.filter(item => item.roles.includes(role));
  }, [user, t]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getPageTitle = () => {
    const menuItems = getMenuItems;
    
    if (location.pathname.match(/\/beneficiaires\/\d+/)) {
      return t('pageTitles.beneficiaryDetail', 'Détail du Bénéficiaire');
    }
    
    const currentItem = menuItems.find(item => location.pathname === item.path);
    return currentItem ? currentItem.label : t('pageTitles.medicalManagementSystem', 'Système de Gestion Médicale');
  };

  const formatRole = (role) => {
    const roleTranslations = {
      'SuperAdmin': t('roles.administrator', 'Administrateur'),
      'Admin': t('roles.administrator', 'Administrateur'),
      'Medecin': t('roles.doctor', 'Médecin'),
      'Infirmier': t('roles.nurse', 'Infirmier'),
      'Secretaire': t('roles.secretary', 'Secrétaire'),
      'Caissier': t('roles.cashier', 'Caissier'),
      'Utilisateur': t('roles.user', 'Utilisateur')
    };
    return roleTranslations[role] || role;
  };

  const formatCountryName = (codPay) => {
    const countries = {
      'CMF': t('countries.CMF', 'Cameroun-Francophone'),
      'CMA': t('countries.CMA', 'Cameroun-Anglophone'),
      'RCA': t('countries.RCA', 'République Centrafricaine'),
      'TCD': t('countries.TCD', 'Tchad'),
      'GNQ': t('countries.GNQ', 'Guinée Équatoriale'),
      'BDI': t('countries.BDI', 'Burundi'),
      'COG': t('countries.COG', 'République du Congo')
    };
    return countries[codPay] || codPay;
  };

  // Navigation avec vérification des permissions
  const handleNavigation = (path) => {
    if (hasAccessToRoute(path)) {
      navigate(path);
    } else {
      alert(t('alerts.accessDenied', 'Accès refusé'));
      navigate('/dashboard');
    }
  };

  // Grouper les menus par catégorie
  const groupedMenuItems = useMemo(() => {
    const items = getMenuItems;
    return {
      dashboard: items.filter(item => item.path === '/dashboard'),
      gestionBeneficiaires: items.filter(item => 
        ['/beneficiaires', '/enrolement-biometrique', '/familles-ace'].includes(item.path)
      ),
      parcoursSoins: items.filter(item => 
        ['/consultations', '/accords-prealables', '/prescriptions', '/dossiers-medicaux', '/teleconsultations', '/urgences'].includes(item.path)
      ),
      financier: items.filter(item => 
        ['/facturation', '/remboursements', '/paiements', '/ticket-moderateur'].includes(item.path)
      ),
      statistiques: items.filter(item => 
        ['/statistiques', '/rapports', '/tableaux-bord'].includes(item.path)
      ),
      evacuation: items.filter(item => 
        ['/evacuations', '/suivi-evacuations'].includes(item.path)
      ),
      controle: items.filter(item => 
        ['/controle-fraudes', '/audit', '/alertes-anomalies'].includes(item.path)
      ),
      interaction: items.filter(item => 
        ['/messagerie', '/notifications'].includes(item.path)
      ),
      documentation: items.filter(item => 
        ['/archivage', '/documents'].includes(item.path)
      ),
      reglement: items.filter(item => 
        ['/reglements', '/gestion-financiere', '/litiges'].includes(item.path)
      ),
      reseauSoins: items.filter(item => 
        ['/reseau-soins', '/prestataires', '/centres-sante', '/conventions', '/evaluation-prestataires'].includes(item.path)
      ),
      administration: items.filter(item => 
        ['/administration', '/parametres', '/geographie', '/nomenclatures'].includes(item.path)
      ),
      support: items.filter(item => 
        ['/support', '/feedback', '/documentation-utilisateur'].includes(item.path)
      ),
      profil: items.filter(item => 
        item.path === '/profil'
      )
    };
  }, [getMenuItems]);

  const renderMenuSection = (titleKey, items, Icon) => {
    if (items.length === 0) return null;
    
    return (
      <div className="menu-section">
        <div className="menu-section-header">
          {Icon && <Icon className="section-icon" size={16} />}
          <span className="section-title">{t(titleKey, 'Section')}</span>
        </div>
        <div className="menu-section-items">
          {items.map((item) => {
            const ItemIcon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path === '/beneficiaires' && location.pathname.startsWith('/beneficiaires/'));
            
            return (
              <button
                key={item.path}
                className={`nav-item ${hasAccessToRoute(item.path) ? '' : 'disabled'} ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
                disabled={!hasAccessToRoute(item.path)}
                title={!hasAccessToRoute(item.path) ? t('alerts.accessDenied', 'Accès refusé') : ''}
              >
                <ItemIcon className="nav-icon" size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="layout">
      {/* Barre latérale */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="app-logo">
            <Heart className="logo-icon" />
            <span className="app-name">{t('app.name', 'AMS SANTE')}</span>
          </div>
          <button className="close-sidebar" onClick={toggleSidebar}>
            <X size={20} />
          </button>
        </div>

        <div className="region-badge">
          <Globe size={14} />
          <span>{formatCountryName(user?.cod_pay)} - {t('app.centralAfrica', 'Afrique Centrale')}</span>
        </div>

        <nav className="sidebar-nav">
          {/* Tableau de Bord */}
          {renderMenuSection('menuSections.dashboard', groupedMenuItems.dashboard)}
          
          {/* Gestion des bénéficiaires */}
          {renderMenuSection('menuSections.beneficiaryManagement', groupedMenuItems.gestionBeneficiaires, Users)}
          
          {/* Parcours de soins */}
          {renderMenuSection('menuSections.carePathway', groupedMenuItems.parcoursSoins, Stethoscope)}
          
          {/* Remboursements et facturation */}
          {renderMenuSection('menuSections.financial', groupedMenuItems.financier, DollarSign)}
          
          {/* Module de règlement */}
          {renderMenuSection('menuSections.settlements', groupedMenuItems.reglement, CreditCard)}
          
          {/* Gestion du réseau de soins */}
          {renderMenuSection('menuSections.careNetwork', groupedMenuItems.reseauSoins, Network)}
          
          {/* Statistiques et reporting */}
          {renderMenuSection('menuSections.statistics', groupedMenuItems.statistiques, BarChart3)}
          
          {/* Évacuation sanitaire */}
          {renderMenuSection('menuSections.evacuation', groupedMenuItems.evacuation, Ambulance)}
          
          {/* Contrôle et audit */}
          {renderMenuSection('menuSections.control', groupedMenuItems.controle, Shield)}
          
          {/* Documentation et archivage */}
          {renderMenuSection('menuSections.documentation', groupedMenuItems.documentation, FileArchive)}
          
          {/* Interaction multi-acteurs */}
          {renderMenuSection('menuSections.interaction', groupedMenuItems.interaction, Mail)}
          
          {/* Administration */}
          {renderMenuSection('menuSections.administration', groupedMenuItems.administration, Settings)}
          
          {/* Support */}
          {renderMenuSection('menuSections.support', groupedMenuItems.support, HelpCircle)}
          
          {/* Profil */}
          {renderMenuSection('menuSections.profile', groupedMenuItems.profil, User)}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info-sidebar">
            <div className="user-avatar-sidebar">
              {user?.prenom_uti?.charAt(0) || user?.nom_uti?.charAt(0)}
            </div>
            <div className="user-details-sidebar">
              <div className="user-name-sidebar">
                {user?.prenom_uti} {user?.nom_uti}
              </div>
              <div className="user-role-sidebar">
                {formatRole(user?.profil_uti || user?.role)}
              </div>
              <div className="user-info-row">
                <Globe size={10} />
                <span>{formatCountryName(user?.cod_pay)}</span>
              </div>
              <div className="user-info-row">
                <Mail size={10} />
                <span>{user?.email_uti}</span>
              </div>
            </div>
          </div>
          <button 
            className="logout-button-sidebar" 
            onClick={handleLogout}
            title={t('actions.logout', 'Déconnexion')}
          >
            <LogOut size={18} />
            <span>{t('actions.logout', 'Déconnexion')}</span>
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="main-content">
        {/* Barre supérieure */}
        <header className="top-bar">
          <div className="top-bar-left">
            <button className="menu-button" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <h1 className="page-title">{getPageTitle()}</h1>
            <div className="module-indicator">
              {(() => {
                const path = location.pathname;
                if (path.includes('/beneficiaires')) return t('modules.beneficiaryManagement', 'Gestion des bénéficiaires');
                if (path.includes('/consultations')) return t('modules.carePathway', 'Parcours de soins');
                if (path.includes('/facturation')) return t('modules.financial', 'Financier');
                if (path.includes('/prestataires')) return t('modules.careNetwork', 'Réseau de soins');
                if (path.includes('/statistiques')) return t('modules.statistics', 'Statistiques');
                if (path.includes('/audit')) return t('modules.control', 'Contrôle');
                if (path.includes('/reglements')) return t('modules.settlements', 'Règlement');
                if (path.includes('/profil')) return t('modules.profile', 'Profil');
                return t('modules.managementSystem', 'Système de gestion');
              })()}
            </div>
          </div>

          <div className="top-bar-right">
            <div className="quick-actions">
              <button 
                className="btn-icon" 
                title={t('menu.notifications', 'Notifications')}
                onClick={() => handleNavigation('/notifications')}
              >
                <Bell size={18} />
                <span className="notification-badge">3</span>
              </button>
              <button 
                className="btn-icon" 
                title={t('menu.messaging', 'Messagerie')}
                onClick={() => handleNavigation('/messagerie')}
              >
                <Mail size={18} />
              </button>
              <button 
                className="btn-icon" 
                title={t('menu.support', 'Support')}
                onClick={() => handleNavigation('/support')}
              >
                <HelpCircle size={18} />
              </button>
            </div>
            
            <div className="country-info">
              <Globe size={16} />
              <span>{formatCountryName(user?.cod_pay)}</span>
            </div>
            
            <div className="user-menu">
              <div className="user-info">
                <div className="user-avatar">
                  {user?.prenom_uti?.charAt(0) || user?.nom_uti?.charAt(0)}
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.prenom_uti} {user?.nom_uti}</span>
                  <span className="user-role">{formatRole(user?.profil_uti || user?.role)}</span>
                  {user?.super_admin && (
                    <span className="super-admin-badge">{t('roles.administrator', 'Administrateur')}</span>
                  )}
                </div>
              </div>
              <div className="user-actions">
                <button 
                  className="btn-icon" 
                  title={t('menu.myProfile', 'Mon Profil')}
                  onClick={() => handleNavigation('/profil')}
                >
                  <User size={18} />
                </button>
                <button 
                  className="btn-icon" 
                  title={t('menu.settings', 'Paramètres')}
                  onClick={() => handleNavigation('/parametres')}
                >
                  <Settings size={18} />
                </button>
                <button 
                  className="btn-icon logout-btn" 
                  title={t('actions.logout', 'Déconnexion')} 
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu de la page */}
        <main className="page-content">
          <Outlet />
        </main>

        {/* Pied de page */}
        <footer className="page-footer">
          <div className="footer-content">
            <div className="footer-left">
              <span>© {new Date().getFullYear()} {t('app.name', 'AMS SANTE')} - {t('app.centralAfrica', 'Afrique Centrale')}</span>
              <span className="footer-divider">|</span>
              <span>{t('footer.version', 'Version')} MVP 1.0 - {t('footer.regionalDatabase', 'Base de données régionale')}</span>
              <span className="footer-divider">|</span>
              <span>{t('footer.activeModules', 'Modules actifs')}: 11/11</span>
            </div>
            <div className="footer-right">
              <span>{t('footer.loggedInAs', 'Connecté en tant que')}: {user?.log_uti}</span>
              <span className="footer-divider">|</span>
              <span>{t('footer.country', 'Pays')}: {formatCountryName(user?.cod_pay)}</span>
              <span className="footer-divider">|</span>
              <span>{t('footer.language', 'Langue')}: {i18n.language}</span>
              <span className="footer-divider">|</span>
              <span className="system-status active">{t('footer.systemOnline', 'Système en ligne')}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;