import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Stethoscope, 
  DollarSign, 
  LogOut,
  Menu,
  X,
  User,
  Settings,
  Heart,
  ClipboardList,
  BarChart3,
  Globe,
  Activity,
  MapPin,
  AlertTriangle,
  MessageSquare,
  Network,
  Ambulance,
  Bell,
  Mail,
  FileSearch,
  CheckCircle,
  Percent,
  Home,
  ShieldCheck,
  ShieldAlert,
  Calculator,
  PieChart,
  FileBarChart,
  Map,
  Hospital,
  UserPlus,
  Users2,
  FileCheck,
  PhoneCall,
  ActivitySquare,
  BadgeCheck,
  Wallet,
  Receipt,
  Scale,
  Cpu,
  FileDigit,
  ChevronLeft,
  ChevronRight,
  PenTool,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import './Layout.css';
import amsLogo from '../../src/assets/HealthCenterSoft-logo.png';

const Layout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeBubbleSection, setActiveBubbleSection] = useState(null);
  const [bubblePosition, setBubblePosition] = useState({ x: 0, y: 0 });
  const { t, i18n } = useTranslation();
  const bubbleRef = useRef(null);
  const sectionRefs = useRef({});

  // Vérifier les permissions d'accès aux routes
  const hasAccessToRoute = useMemo(() => {
    return (path) => {
      const role = user?.profil_uti || user?.role;
      if (!role) return false;

      const routePermissions = {
        '/dashboard': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        '/beneficiaires': ['SuperAdmin', 'Admin', 'Secretaire'],
        '/beneficiaires/:id': ['SuperAdmin', 'Admin', 'Secretaire'],
        '/enrolement-biometrique': ['SuperAdmin', 'Admin', 'Secretaire'],
        '/familles-ace': ['SuperAdmin', 'Admin', 'Secretaire'],
        '/consultations': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/accords-prealables': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/prescriptions': ['SuperAdmin', 'Admin', 'Medecin'],
        '/dossiers-medicaux': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/teleconsultations': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/urgences': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/paiements': ['SuperAdmin', 'Admin', 'Caissier'],
        '/ticket-moderateur': ['SuperAdmin', 'Admin', 'Caissier'],
        '/reglements': ['SuperAdmin', 'Admin', 'Caissier'],
        '/gestion-financiere': ['SuperAdmin', 'Admin'],
        '/Prestations': ['SuperAdmin', 'Admin', 'Caissier'],
        // '/statistiques': ['SuperAdmin', 'Admin', 'Medecin'],
        '/rapports': ['SuperAdmin', 'Admin', 'Medecin'],
        '/tableaux-bord': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier'],
        '/evacuations': ['SuperAdmin', 'Admin', 'Medecin'],
        /*'/suivi-evacuations': ['SuperAdmin', 'Admin', 'Medecin'],*/
        '/controle-fraudes': ['SuperAdmin', 'Admin'],
        '/audit': ['SuperAdmin', 'Admin'],
        '/alertes-anomalies': ['SuperAdmin', 'Admin', 'Medecin', 'Caissier'],
        '/reseau-soins': ['SuperAdmin', 'Admin'],
        '/prestataires': ['SuperAdmin', 'Admin', 'Medecin'],
        '/centres-sante': ['SuperAdmin', 'Admin'],
        '/conventions': ['SuperAdmin', 'Admin'],
        '/evaluation-prestataires': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Utilisateur'],
        '/administration': ['SuperAdmin', 'Admin'],
        '/parametres': ['SuperAdmin', 'Admin'],
        '/importation': ['SuperAdmin', 'Admin'],
        '/nomenclatures': ['SuperAdmin', 'Admin', 'Medecin'],
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
      { 
        path: '/dashboard', 
        icon: Home, 
        label: t('menu.dashboard', 'Tableau de Bord'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        translationKey: 'dashboard'
      },
      // Gestion médicale
      { 
        path: '/beneficiaires', 
        icon: Users2, 
        label: t('menu.beneficiaries', 'Bénéficiaires'), 
        roles: ['SuperAdmin', 'Admin', 'Secretaire'],
        translationKey: 'beneficiaries'
      },
      { 
        path: '/enrolement-biometrique', 
        icon: UserPlus, 
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
      { 
        path: '/consultations', 
        icon: Stethoscope, 
        label: t('menu.consultations', 'Consultations'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        translationKey: 'consultations'
      },
      { 
        path: '/accords-prealables', 
        icon: FileCheck, 
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
        icon: Activity, 
        label: t('menu.medicalRecords', 'Dossiers Médicaux'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        translationKey: 'medicalRecords'
      },
      // { 
      //   path: '/teleconsultations', 
      //   icon: PhoneCall, 
      //   label: t('menu.teleconsultations', 'Téléconsultations'), 
      //   roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
      //   translationKey: 'teleconsultations'
      // },
      { 
        path: '/urgences', 
        icon: Ambulance, 
        label: t('menu.emergencies', 'Urgences'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        translationKey: 'emergencies'
      },
      // Gestion financière
      { 
        path: '/paiements', 
        icon: Wallet, 
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
      { 
        path: '/reglements', 
        icon: Receipt, 
        label: t('menu.settlements', 'Règlements'), 
        roles: ['SuperAdmin', 'Admin', 'Caissier'],
        translationKey: 'settlements'
      },
      { 
        path: '/gestion-financiere', 
        icon: Calculator, 
        label: t('menu.declarationReimbursement', 'Déclaration et remboursement'), 
        roles: ['SuperAdmin', 'Admin'],
        translationKey: 'declarationReimbursement'
      },
      //  { 
      //   path: '/Prestations', 
      //   icon: Scale, 
      //     label: t('menu.prestations','Prestations'), 
      //     roles: ['SuperAdmin', 'Admin', 'Caissier'],
      //    translationKey: 'prestations'
      //  },
      // // Statistiques et rapports (partie administration)
      // { 
      //   path: '/statistiques', 
      //   icon: PieChart, 
      //   label: t('menu.statistics', 'Statistiques'), 
      //   roles: ['SuperAdmin', 'Admin', 'Medecin'],
      //   translationKey: 'statistics'
      // },
      { 
        path: '/rapports', 
        icon: FileBarChart, 
        label: t('menu.reports', 'Rapports'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin'],
        translationKey: 'reports'
      },
      // { 
      //   path: '/tableaux-bord', 
      //   icon: ActivitySquare, 
      //   label: t('menu.dashboards', 'Tableaux de Bord'), 
      //   roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier'],
      //   translationKey: 'dashboards'
      // },
      // Gestion médicale : Évacuations
      { 
        path: '/evacuations', 
        icon: Ambulance, 
        label: t('menu.evacuations', 'Évacuations'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin'],
        translationKey: 'evacuations'
      },
      // { 
      //   path: '/suivi-evacuations', 
      //   icon: MapPin, 
      //   label: t('menu.evacuationTracking', 'Suivi des Évacuations'), 
      //   roles: ['SuperAdmin', 'Admin', 'Medecin'],
      //   translationKey: 'evacuationTracking'
      // },
      // Contrôle et audit (administration)
      // { 
      //   path: '/controle-fraudes', 
      //   icon: ShieldAlert, 
      //   label: t('menu.fraudControl', 'Contrôle des Fraudes'), 
      //   roles: ['SuperAdmin', 'Admin'],
      //   translationKey: 'fraudControl'
      // },
      // { 
      //   path: '/audit', 
      //   icon: FileSearch, 
      //   label: t('menu.audit', 'Audit'), 
      //   roles: ['SuperAdmin', 'Admin'],
      //   translationKey: 'audit'
      // },
      // { 
      //   path: '/alertes-anomalies', 
      //   icon: AlertTriangle, 
      //   label: t('menu.anomalyAlerts', 'Alertes Anomalies'), 
      //   roles: ['SuperAdmin', 'Admin', 'Medecin', 'Caissier'],
      //   translationKey: 'anomalyAlerts'
      // },
      // Réseau de soins (partie médicale)
      { 
        path: '/reseau-soins', 
        icon: Network, 
        label: t('menu.careNetwork', 'Réseau de Soins'), 
        roles: ['SuperAdmin', 'Admin'],
        translationKey: 'careNetwork'
      },
      { 
        path: '/prestataires', 
        icon: Hospital, 
        label: t('menu.providers', 'Prestataires'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin'],
        translationKey: 'providers'
      },
      { 
        path: '/centres-sante', 
        icon: Map, 
        label: t('menu.healthCenters', 'Centres de Santé'), 
        roles: ['SuperAdmin', 'Admin'],
        translationKey: 'healthCenters'
      },
      // { 
      //   path: '/conventions', 
      //   icon: MessageSquare, 
      //   label: t('menu.agreements', 'Conventions'), 
      //   roles: ['SuperAdmin', 'Admin'],
      //   translationKey: 'agreements'
      // },
      { 
        path: '/evaluation-prestataires', 
        icon: BarChart3, 
        label: t('menu.providerEvaluation', 'Évaluation Prestataires'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Utilisateur'],
        translationKey: 'providerEvaluation'
      },
      // Administration système
      { 
        path: '/administration', 
        icon: Cpu, 
        label: t('menu.administration', 'Administration'), 
        roles: ['SuperAdmin', 'Admin'],
        translationKey: 'administration'
      },
      // { 
      //   path: '/parametres', 
      //   icon: Settings, 
      //   label: t('menu.settings', 'Paramètres'), 
      //   roles: ['SuperAdmin', 'Admin'],
      //   translationKey: 'settings'
      // },
      { 
        path: '/importation', 
        icon: Map, 
        label: t('menu.importation', 'Importation'), 
        roles: ['SuperAdmin', 'Admin'],
        translationKey: 'importation'
      },
      // { 
      //   path: '/nomenclatures', 
      //   icon: FileDigit, 
      //   label: t('menu.nomenclatures', 'Nomenclatures'), 
      //   roles: ['SuperAdmin', 'Admin', 'Medecin'],
      //   translationKey: 'nomenclatures'
      // },
      // Gestion du profil
      { 
        path: '/profil', 
        icon: BadgeCheck, 
        label: t('menu.myProfile', 'Mon Profil'), 
        roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
        translationKey: 'myProfile'
      }
    ];

    return allItems.filter(item => item.roles.includes(role));
  }, [user, t]);

  // Gestion de session
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Interface utilisateur : basculer la barre latérale
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    setActiveBubbleSection(null);
  };

  // Interface utilisateur : gestion du clic sur section
  const handleSectionClick = (sectionKey, event) => {
    if (sidebarCollapsed) {
      const rect = event.currentTarget.getBoundingClientRect();
      setBubblePosition({
        x: rect.right + 10,
        y: rect.top
      });
      setActiveBubbleSection(activeBubbleSection === sectionKey ? null : sectionKey);
    }
  };

  // Interface utilisateur : obtenir le titre de la page
  const getPageTitle = () => {
    const menuItems = getMenuItems;
    
    if (location.pathname.match(/\/beneficiaires\/\d+/)) {
      return t('pageTitles.beneficiaryDetail', 'Détail du Bénéficiaire');
    }
    
    const currentItem = menuItems.find(item => location.pathname === item.path);
    return currentItem ? currentItem.label : t('pageTitles.medicalManagementSystem', 'Système de Gestion Médicale');
  };

  // Interface utilisateur : formater le rôle
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

  // Configuration régionale : formater le nom du pays
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
      setActiveBubbleSection(null);
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
        ['/paiements', '/ticket-moderateur', '/reglements', '/gestion-financiere', '/Prestations'].includes(item.path)
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
      reseauSoins: items.filter(item => 
        ['/reseau-soins', '/prestataires', '/centres-sante', '/conventions', '/evaluation-prestataires'].includes(item.path)
      ),
      administration: items.filter(item => 
        ['/administration', '/parametres', '/importation', '/nomenclatures'].includes(item.path)
      ),
      profil: items.filter(item => 
        item.path === '/profil'
      )
    };
  }, [getMenuItems]);

  // Configuration des sections de menu
  const menuSections = [
    {
      key: 'dashboard',
      titleKey: 'menuSections.dashboard',
      icon: Home,
      items: groupedMenuItems.dashboard,
      color: '#0ea5e9',
      accentIcon: Sparkles,
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%)'
    },
    {
      key: 'gestionBeneficiaires',
      titleKey: 'menuSections.beneficiaryManagement',
      icon: Users2,
      items: groupedMenuItems.gestionBeneficiaires,
      color: '#3B82F6',
      accentIcon: UserPlus,
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #60a5fa 100%)'
    },
    {
      key: 'parcoursSoins',
      titleKey: 'menuSections.carePathway',
      icon: Stethoscope,
      items: groupedMenuItems.parcoursSoins,
      color: '#10B981',
      accentIcon: Activity,
      gradient: 'linear-gradient(135deg, #10B981 0%, #34d399 100%)'
    },
    {
      key: 'financier',
      titleKey: 'menuSections.financial',
      icon: DollarSign,
      items: groupedMenuItems.financier,
      color: '#F59E0B',
      accentIcon: BarChart3,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #fbbf24 100%)'
    },
    {
      key: 'reseauSoins',
      titleKey: 'menuSections.careNetwork',
      icon: Network,
      items: groupedMenuItems.reseauSoins,
      color: '#8B5CF6',
      accentIcon: Hospital,
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #a78bfa 100%)'
    },
    {
      key: 'statistiques',
      titleKey: 'menuSections.statistics',
      icon: PieChart,
      items: groupedMenuItems.statistiques,
      color: '#EC4899',
      accentIcon: BarChart3,
      gradient: 'linear-gradient(135deg, #EC4899 0%, #f472b6 100%)'
    },
    {
      key: 'evacuation',
      titleKey: 'menuSections.evacuation',
      icon: Ambulance,
      items: groupedMenuItems.evacuation,
      color: '#EF4444',
      accentIcon: MapPin,
      gradient: 'linear-gradient(135deg, #EF4444 0%, #f87171 100%)'
    },
    {
      key: 'controle',
      titleKey: 'menuSections.control',
      icon: ShieldCheck,
      items: groupedMenuItems.controle,
      color: '#6366F1',
      accentIcon: ShieldAlert,
      gradient: 'linear-gradient(135deg, #6366F1 0%, #818cf8 100%)'
    },
    {
      key: 'administration',
      titleKey: 'menuSections.administration',
      icon: Cpu,
      items: groupedMenuItems.administration,
      color: '#8B5CF6',
      accentIcon: Settings,
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #c4b5fd 100%)'
    },
    {
      key: 'profil',
      titleKey: 'menuSections.profile',
      icon: BadgeCheck,
      items: groupedMenuItems.profil,
      color: '#14B8A6',
      accentIcon: User,
      gradient: 'linear-gradient(135deg, #14B8A6 0%, #2dd4bf 100%)'
    }
  ];

  // Gérer le clic en dehors de la bulle
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target)) {
        setActiveBubbleSection(null);
      }
    };

    if (activeBubbleSection) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeBubbleSection]);

  // Composant Bubble Menu
  const BubbleMenu = ({ section, position }) => {
    if (!section || !section.items.length) return null;

    return (
      <div 
        ref={bubbleRef}
        className="bubble-menu"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="bubble-header" style={{ background: section.gradient }}>
          <div className="bubble-icon-wrapper">
            <section.icon size={20} />
          </div>
          <span className="bubble-title">{t(section.titleKey, section.titleKey.replace('menuSections.', ''))}</span>
          <button className="bubble-close" onClick={() => setActiveBubbleSection(null)}>
            <X size={16} />
          </button>
        </div>
        <div className="bubble-content">
          {section.items.map((item) => {
            const ItemIcon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                className={`bubble-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <div className="bubble-item-icon" style={{ color: section.color }}>
                  <ItemIcon size={18} />
                </div>
                <span className="bubble-item-label">{item.label}</span>
                {isActive && (
                  <div className="bubble-item-indicator" style={{ background: section.color }} />
                )}
              </button>
            );
          })}
        </div>
        <div className="bubble-footer">
          <div className="bubble-ink-effect" style={{ background: section.gradient }} />
        </div>
      </div>
    );
  };

  // Rendu d'une section de menu
  const renderMenuSection = ({ key, titleKey, icon: SectionIcon, items, color, accentIcon: AccentIcon, gradient }) => {
    if (items.length === 0) return null;
    
    const isActive = activeBubbleSection === key;
    const isActiveItem = items.some(item => 
      location.pathname === item.path || 
      (item.path === '/beneficiaires' && location.pathname.startsWith('/beneficiaires/'))
    );

    return (
      <div className="menu-section" key={key}>
        {sidebarCollapsed ? (
          <button
            className={`section-icon-button ${isActive ? 'active' : ''} ${isActiveItem ? 'has-active-item' : ''}`}
            onClick={(e) => handleSectionClick(key, e)}
            style={{ '--section-gradient': gradient }}
            ref={el => sectionRefs.current[key] = el}
          >
            <div className="section-icon-button-inner">
              <div className="gradient-circle">
                <SectionIcon className="section-icon" size={18} />
                <div className="gradient-circle-pulse" />
              </div>
              {isActiveItem && <div className="active-dot" />}
            </div>
            {AccentIcon && (
              <div className="accent-icon">
                <AccentIcon size={10} />
              </div>
            )}
          </button>
        ) : (
          <>
            <div className="menu-section-header" style={{ borderLeftColor: color }}>
              <div className="section-icon-wrapper" style={{ background: gradient }}>
                <SectionIcon className="section-icon" size={18} />
                {AccentIcon && (
                  <div className="accent-icon-badge">
                    <AccentIcon size={10} />
                  </div>
                )}
              </div>
              <span className="section-title">{t(titleKey, titleKey.replace('menuSections.', ''))}</span>
            </div>
            <div className="menu-section-items">
              {items.map((item) => {
                const ItemIcon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <button
                    key={item.path}
                    className={`nav-item ${hasAccessToRoute(item.path) ? '' : 'disabled'} ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavigation(item.path)}
                    disabled={!hasAccessToRoute(item.path)}
                    title={!hasAccessToRoute(item.path) ? t('alerts.accessDenied', 'Accès refusé') : ''}
                  >
                    <div className="nav-icon-wrapper" style={{ background: `${color}15` }}>
                      <ItemIcon className="nav-icon" size={18} style={{ color }} />
                    </div>
                    <span className="nav-label">{item.label}</span>
                    {isActive && <div className="nav-item-indicator" style={{ background: gradient }} />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="layout">
      {/* Barre latérale */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : 'open'}`}>
        <div className="sidebar-header">
          <div className="app-logo">
            <div className="logo-icon-wrapper">
              <img src={amsLogo} alt="AMS Insurance Logo" className="logo-icon"/>
              <div className="logo-icon-glow" />
            </div>
            {!sidebarCollapsed && (
              <span className="app-name">{t('app.name', 'HealthCenterSoft')}</span>
            )}
          </div>
          
          {/* Bouton de réduction de la barre latérale */}
          <button 
            className="ink-toggle-button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Développer le menu" : "Réduire le menu"}
          >
            <div className="ink-container">
              <PenTool className="ink-pen" size={18} />
              <div className="ink-blot" />
              <div className="ink-splash" />
              {sidebarCollapsed ? (
                <ChevronRight className="ink-arrow" size={16} />
              ) : (
                <ChevronLeft className="ink-arrow" size={16} />
              )}
            </div>
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="region-badge">
            <Globe size={16} />
            <span>{formatCountryName(user?.cod_pay)} - {t('app.centralAfrica', 'Afrique Centrale')}</span>
          </div>
        )}

        <nav className="sidebar-nav">
          {menuSections.map(section => renderMenuSection(section))}
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed ? (
            <>
              <div className="user-info-sidebar">
                <div className="user-avatar-sidebar" style={{ background: 'linear-gradient(135deg, #0ea5e9, #a855f7)' }}>
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
                    <Globe size={12} />
                    <span>{formatCountryName(user?.cod_pay)}</span>
                  </div>
                  <div className="user-info-row">
                    <Mail size={12} />
                    <span>{user?.email_uti}</span>
                  </div>
                </div>
              </div>
              <button 
                className="logout-button-sidebar" 
                onClick={handleLogout}
                title={t('actions.logout', 'Déconnexion')}
              >
                <LogOut size={20} />
                <span>{t('actions.logout', 'Déconnexion')}</span>
              </button>
            </>
          ) : (
            <div className="collapsed-user-info">
              <div 
                className="user-avatar-collapsed"
                onClick={() => handleNavigation('/profil')}
                title="Mon profil"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #a855f7)' }}
              >
                {user?.prenom_uti?.charAt(0) || user?.nom_uti?.charAt(0)}
              </div>
              <button 
                className="logout-button-collapsed" 
                onClick={handleLogout}
                title={t('actions.logout', 'Déconnexion')}
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Bubble Menu */}
      {sidebarCollapsed && activeBubbleSection && (
        <BubbleMenu 
          section={menuSections.find(s => s.key === activeBubbleSection)} 
          position={bubblePosition}
        />
      )}

      {/* Contenu principal */}
      <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Barre supérieure */}
        <header className="top-bar">
          <div className="top-bar-left">
            {sidebarCollapsed && (
              <button className="menu-button expanded" onClick={toggleSidebar}>
                <Menu size={24} />
              </button>
            )}
            <h1 className="page-title">{getPageTitle()}</h1>
            <div className="module-indicator">
              {(() => {
                const path = location.pathname;
                if (path.includes('/beneficiaires')) return t('modules.beneficiaryManagement', 'Gestion des bénéficiaires');
                if (path.includes('/consultations')) return t('modules.carePathway', 'Parcours de soins');
                if (path.includes('/paiements') || path.includes('/reglements') || path.includes('/gestion-financiere') || path.includes('/Prestations')) 
                  return t('modules.financial', 'Financier');
                if (path.includes('/prestataires')) return t('modules.careNetwork', 'Réseau de soins');
                if (path.includes('/statistiques')) return t('modules.statistics', 'Statistiques');
                if (path.includes('/audit')) return t('modules.control', 'Contrôle');
                if (path.includes('/profil')) return t('modules.profile', 'Profil');
                return t('modules.managementSystem', 'Système de gestion');
              })()}
            </div>
          </div>

          <div className="top-bar-right">
            <div className="country-info">
              <Globe size={18} />
              <span>{formatCountryName(user?.cod_pay)}</span>
            </div>
            
            <div className="user-menu">
              <div className="user-info">
                <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #0ea5e9, #a855f7)' }}>
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
                  <BadgeCheck size={20} />
                </button>
                {/* <button 
                  className="btn-icon" 
                  title={t('menu.settings', 'Paramètres')}
                  onClick={() => handleNavigation('/parametres')}
                >
                  <Settings size={20} />
                </button> */}
                <button 
                  className="btn-icon logout-btn" 
                  title={t('actions.logout', 'Déconnexion')} 
                  onClick={handleLogout}
                >
                  <LogOut size={20} />
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
              <span>© {new Date().getFullYear()} {t('app.name', 'HealthCenterSoft')} - {t('app.centralAfrica', 'Afrique Centrale')}</span>
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