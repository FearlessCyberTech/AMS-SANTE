import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Layout as AntLayout,
  Card,
  Row,
  Col,
  Avatar,
  Button,
  Typography,
  Space,
  Divider,
  Badge,
  Tooltip,
  ConfigProvider,
  theme,
  Dropdown,
  Menu as AntMenu,
  Modal,
  Drawer,
  Switch
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  GlobalOutlined,
  HomeOutlined,
  TeamOutlined,
  UserAddOutlined,
  HeartOutlined,
  FileTextOutlined,
  PhoneOutlined,
  WalletOutlined,
  PercentageOutlined,
  ReconciliationOutlined,
  CalculatorOutlined,
  PieChartOutlined,
  BarChartOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  MessageOutlined,
  ApartmentOutlined,
  BankOutlined,
  FileSearchOutlined,
  AlertOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
  ClusterOutlined,
  IdcardOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StarOutlined,
  DatabaseOutlined,
  FlagOutlined,
  BarChartOutlined as ChartBarOutlined,
  FileDoneOutlined,
  AuditOutlined,
  RocketOutlined,
  MedicineBoxOutlined,
  ScheduleOutlined,
  ContactsOutlined,
  BankOutlined as BankFilled,
  HddOutlined,
  ToolOutlined,
  CompassOutlined,
  BookOutlined
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/fr';
import './Layout.css';

const { Header, Sider, Content, Footer } = AntLayout;
const { Text, Title } = Typography;

const Layout = () => {
  const { user, logout, isAuthenticated, userCountry } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('');
  const [notifications, setNotifications] = useState(5);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { t, i18n } = useTranslation();

  // Thème configuration
  const themeConfig = {
    algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 8,
    },
  };

  // Configuration des catégories de menu avec couleurs
  const menuCategories = [
    {
      id: 'dashboard',
      title: t('menuSections.dashboard'),
      icon: <DashboardOutlined />,
      color: '#0ea5e9',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%)',
      items: [
        { key: '/dashboard', label: t('menu.dashboard'), icon: <HomeOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Producteur', 'Caissier', 'Utilisateur'] }
      ]
    },
    {
      id: 'beneficiary',
      title: t('menuSections.beneficiaryManagement'),
      icon: <TeamOutlined />,
      color: '#3B82F6',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #60a5fa 100%)',
      items: [
        { key: '/beneficiaires', label: t('menu.beneficiaries'), icon: <TeamOutlined />, roles: ['SuperAdmin', 'Admin', 'Producteur'] },
        { key: '/enrolement-biometrique', label: t('menu.biometricEnrollment'), icon: <UserAddOutlined />, roles: ['SuperAdmin', 'Admin', 'Producteur'] },
        { key: '/familles-ace', label: t('menu.aceFamilies'), icon: <ContactsOutlined />, roles: ['SuperAdmin', 'Admin', 'Producteur'] }
      ]
    },
    {
      id: 'medical',
      title: t('menuSections.carePathway'),
      icon: <HeartOutlined />,
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #10B981 0%, #34d399 100%)',
      items: [
        { key: '/consultations', label: t('menu.consultations'), icon: <MedicineBoxOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'] },
        { key: '/accords-prealables', label: t('menu.priorAgreements'), icon: <FileDoneOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'] },
        { key: '/prescriptions', label: t('menu.prescriptions'), icon: <FileTextOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'] },
        { key: '/dossiers-medicaux', label: t('menu.medicalRecords'), icon: <ScheduleOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'] },
        { key: '/teleconsultations', label: t('menu.teleconsultations'), icon: <PhoneOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'] },
        { key: '/urgences', label: t('menu.emergencies'), icon: < ApartmentOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'] }
      ]
    },
    {
      id: 'financial',
      title: t('menuSections.financial'),
      icon: <WalletOutlined />,
      color: '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #fbbf24 100%)',
      items: [
        { key: '/paiements', label: t('menu.payments'), icon: <WalletOutlined />, roles: ['SuperAdmin', 'Admin', 'Caissier'] },
        { key: '/ticket-moderateur', label: t('menu.ticketModerator'), icon: <PercentageOutlined />, roles: ['SuperAdmin', 'Admin', 'Caissier'] },
        { key: '/reglements', label: t('menu.settlements'), icon: <ReconciliationOutlined />, roles: ['SuperAdmin', 'Admin', 'Caissier'] },
        { key: '/gestion-financiere', label: t('menu.financialManagement'), icon: <CalculatorOutlined />, roles: ['SuperAdmin', 'Admin', 'Caissier'] },
        { key: '/litiges', label: t('menu.disputes'), icon: <ReconciliationOutlined  />, roles: ['SuperAdmin', 'Admin', 'Caissier'] }
      ]
    },
    {
      id: 'network',
      title: t('menuSections.careNetwork'),
      icon: <ApartmentOutlined />,
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #a78bfa 100%)',
      items: [
        { key: '/reseau-soins', label: t('menu.careNetwork'), icon: <ApartmentOutlined />, roles: ['SuperAdmin', 'Admin', 'Producteur'] },
        { key: '/prestataires', label: t('menu.providers'), icon: <BankFilled />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Producteur'] },
        { key: '/centres-sante', label: t('menu.healthCenters'), icon: <EnvironmentOutlined />, roles: ['SuperAdmin', 'Admin', 'Producteur'] },
        { key: '/conventions', label: t('menu.agreements'), icon: <MessageOutlined />, roles: ['SuperAdmin', 'Admin', 'Producteur'] },
        { key: '/evaluation-prestataires', label: t('menu.providerEvaluation'), icon: <StarOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Producteur', 'Utilisateur'] }
      ]
    },
    {
      id: 'analytics',
      title: t('menuSections.statistics'),
      icon: <PieChartOutlined />,
      color: '#EC4899',
      gradient: 'linear-gradient(135deg, #EC4899 0%, #f472b6 100%)',
      items: [
        { key: '/statistiques', label: t('menu.statistics'), icon: <PieChartOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'] },
        { key: '/rapports', label: t('menu.reports'), icon: <BarChartOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'] },
        { key: '/tableaux-bord', label: t('menu.dashboards'), icon: <DashboardOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Producteur', 'Caissier'] }
      ]
    },
    {
      id: 'evacuation',
      title: t('menuSections.evacuation'),
      icon: < ApartmentOutlined />,
      color: '#EF4444',
      gradient: 'linear-gradient(135deg, #EF4444 0%, #f87171 100%)',
      items: [
        { key: '/evacuations', label: t('menu.evacuations'), icon: <RocketOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'] },
        { key: '/suivi-evacuations', label: t('menu.evacuationTracking'), icon: <EnvironmentOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'] }
      ]
    },
    {
      id: 'control',
      title: t('menuSections.control'),
      icon: <PieChartOutlined />,
      color: '#6366F1',
      gradient: 'linear-gradient(135deg, #6366F1 0%, #818cf8 100%)',
      items: [
        { key: '/controle-fraudes', label: t('menu.fraudControl'), icon: <PieChartOutlined />, roles: ['SuperAdmin', 'Admin'] },
        { key: '/audit', label: t('menu.audit'), icon: <AuditOutlined />, roles: ['SuperAdmin', 'Admin'] },
        { key: '/alertes-anomalies', label: t('menu.anomalyAlerts'), icon: <AlertOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Caissier'] }
      ]
    },
    {
      id: 'administration',
      title: t('menuSections.administration'),
      icon: <AppstoreOutlined />,
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #c4b5fd 100%)',
      items: [
        { key: '/administration', label: t('menu.administration'), icon: <HddOutlined />, roles: ['SuperAdmin', 'Admin'] },
        { key: '/parametres', label: t('menu.settings'), icon: <ToolOutlined />, roles: ['SuperAdmin', 'Admin'] },
        { key: '/geographie', label: t('menu.geography'), icon: <CompassOutlined />, roles: ['SuperAdmin', 'Admin'] },
        { key: '/nomenclatures', label: t('menu.nomenclatures'), icon: <BookOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'] }
      ]
    },
    {
      id: 'profile',
      title: t('menuSections.profile'),
      icon: <IdcardOutlined />,
      color: '#14B8A6',
      gradient: 'linear-gradient(135deg, #14B8A6 0%, #2dd4bf 100%)',
      items: [
        { key: '/profil', label: t('menu.myProfile'), icon: <IdcardOutlined />, roles: ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Producteur', 'Caissier', 'Utilisateur'] }
      ]
    }
  ];

  // Formater le rôle
  const formatRole = (role) => {
    const roleTranslations = {
      'SuperAdmin': t('roles.administrator'),
      'Admin': t('roles.administrator'),
      'Medecin': t('roles.doctor'),
      'Infirmier': t('roles.nurse'),
      'Producteur': t('roles.producer'),
      'Caissier': t('roles.cashier'),
      'Utilisateur': t('roles.user')
    };
    return roleTranslations[role] || role;
  };

  // Formater le pays
  const formatCountryName = (codPay) => {
    const countries = {
      'CMF': t('countries.CMF'),
      'CMA': t('countries.CMA'),
      'RCA': t('countries.RCA'),
      'TCD': t('countries.TCD'),
      'GNQ': t('countries.GNQ'),
      'BDI': t('countries.BDI'),
      'COG': t('countries.COG')
    };
    return countries[codPay] || codPay;
  };

  // Vérifier les permissions d'accès
  const hasAccessToRoute = useMemo(() => {
    return (path) => {
      const role = user?.profil_uti || user?.role;
      if (!role) return false;

      const routePermissions = {
        '/dashboard': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Producteur', 'Caissier', 'Utilisateur'],
        '/beneficiaires': ['SuperAdmin', 'Admin', 'Producteur'],
        '/beneficiaires/:id': ['SuperAdmin', 'Admin', 'Producteur', 'Medecin', 'Infirmier'],
        '/enrolement-biometrique': ['SuperAdmin', 'Admin', 'Producteur'],
        '/familles-ace': ['SuperAdmin', 'Admin', 'Producteur'],
        '/consultations': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/accords-prealables': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/prescriptions': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/dossiers-medicaux': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/teleconsultations': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/urgences': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/paiements': ['SuperAdmin', 'Admin', 'Caissier'],
        '/ticket-moderateur': ['SuperAdmin', 'Admin', 'Caissier'],
        '/reglements': ['SuperAdmin', 'Admin', 'Caissier'],
        '/gestion-financiere': ['SuperAdmin', 'Admin', 'Caissier'],
        '/litiges': ['SuperAdmin', 'Admin', 'Caissier'],
        '/statistiques': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/rapports': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/tableaux-bord': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Producteur', 'Caissier'],
        '/evacuations': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/suivi-evacuations': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/controle-fraudes': ['SuperAdmin', 'Admin'],
        '/audit': ['SuperAdmin', 'Admin'],
        '/alertes-anomalies': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Caissier'],
        '/reseau-soins': ['SuperAdmin', 'Admin', 'Producteur'],
        '/prestataires': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Producteur'],
        '/centres-sante': ['SuperAdmin', 'Admin', 'Producteur'],
        '/conventions': ['SuperAdmin', 'Admin', 'Producteur'],
        '/evaluation-prestataires': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Producteur', 'Utilisateur'],
        '/administration': ['SuperAdmin', 'Admin'],
        '/parametres': ['SuperAdmin', 'Admin'],
        '/geographie': ['SuperAdmin', 'Admin'],
        '/nomenclatures': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
        '/profil': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Producteur', 'Caissier', 'Utilisateur']
      };

      if (routePermissions[path]) {
        return routePermissions[path].includes(role);
      }

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

  // Filtrer les catégories accessibles
  const accessibleCategories = useMemo(() => {
    const role = user?.profil_uti || user?.role;
    if (!role) return [];

    return menuCategories.map(category => {
      const accessibleItems = category.items.filter(item => 
        item.roles.includes(role) && hasAccessToRoute(item.key)
      );
      
      return {
        ...category,
        items: accessibleItems,
        accessible: accessibleItems.length > 0
      };
    }).filter(category => category.accessible);
  }, [user, hasAccessToRoute]);

  // Gérer la navigation
  const handleNavigation = (path) => {
    if (hasAccessToRoute(path)) {
      navigate(path);
      setSelectedKey(path);
    } else {
      Modal.error({
        title: t('alerts.accessDenied'),
        content: t('alerts.noPermission')
      });
    }
  };

  // Gérer la déconnexion
  const handleLogout = () => {
    Modal.confirm({
      title: t('actions.logoutConfirm'),
      content: t('actions.logoutMessage'),
      onOk: () => {
        logout();
        navigate('/login');
      },
      okText: t('actions.confirm'),
      cancelText: t('actions.cancel')
    });
  };

  // Mettre à jour la clé sélectionnée
  useEffect(() => {
    setSelectedKey(location.pathname);
  }, [location]);

  // Obtenir le titre de la page
  const getPageTitle = () => {
    for (const category of menuCategories) {
      const item = category.items.find(item => item.key === location.pathname);
      if (item) return item.label;
    }
    return t('app.name');
  };

  // Menu utilisateur
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('menu.myProfile'),
      onClick: () => handleNavigation('/profil')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('menu.settings'),
      onClick: () => setSettingsVisible(true)
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('actions.logout'),
      onClick: handleLogout
    }
  ];

  // Menu notifications
  const notificationItems = [
    {
      key: '1',
      label: (
        <div>
          <Text strong>Nouvelle consultation</Text>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Dr. Martin a effectué une consultation
          </div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Il y a 5 minutes
          </Text>
        </div>
      )
    },
    {
      key: '2',
      label: (
        <div>
          <Text strong>Paiement validé</Text>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Transaction #45678 approuvée
          </div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Il y a 1 heure
          </Text>
        </div>
      )
    }
  ];

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <ConfigProvider theme={themeConfig}>
      <AntLayout style={{ minHeight: '100vh' }} className={darkMode ? 'dark-mode' : ''}>
        {/* Sidebar */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={collapsed ? 80 : 320}
          style={{
            background: darkMode ? '#141414' : '#fff',
            boxShadow: '2px 0 8px 0 rgba(29, 35, 41, 0.05)',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {/* Logo */}
          <div style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 24px',
            borderBottom: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}`
          }}>
            {collapsed ? (
              <Avatar
                size="large"
                style={{ 
                  background: 'linear-gradient(135deg, #0ea5e9, #a855f7)',
                  color: '#fff'
                }}
                icon={<HeartOutlined />}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                <Avatar
                  size="large"
                  style={{ 
                    background: 'linear-gradient(135deg, #0ea5e9, #a855f7)',
                    color: '#fff'
                  }}
                  icon={<HeartOutlined />}
                />
                <div>
                  <Text strong style={{ color: darkMode ? '#fff' : '#000', display: 'block' }}>
                    {t('app.name')}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                    {t('app.centralAfrica')}
                  </Text>
                </div>
              </div>
            )}
          </div>

          {/* Menu par catégories */}
          <div style={{ 
            padding: collapsed ? '16px 8px' : '16px 20px',
            overflowY: 'auto',
            height: 'calc(100vh - 180px)'
          }}>
            {accessibleCategories.map((category) => (
              <div key={category.id} style={{ marginBottom: collapsed ? 12 : 20 }}>
                {/* Titre de catégorie */}
                {!collapsed && (
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 12,
                    padding: '8px 12px',
                    background: `${category.color}15`,
                    borderRadius: 8,
                    borderLeft: `4px solid ${category.color}`
                  }}>
                    <div style={{ 
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: category.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                      color: '#fff'
                    }}>
                      {category.icon}
                    </div>
                    <Text strong style={{ 
                      fontSize: 14,
                      color: category.color,
                      flex: 1
                    }}>
                      {category.title}
                    </Text>
                    <Badge 
                      count={category.items.length} 
                      style={{ 
                        backgroundColor: category.color,
                        fontSize: 10
                      }} 
                    />
                  </div>
                )}

                {/* Items de la catégorie */}
                {category.items.map((item) => {
                  const isActive = selectedKey === item.key;
                  return (
                    <Tooltip 
                      key={item.key}
                      title={collapsed ? item.label : ''}
                      placement="right"
                    >
                      <div
                        onClick={() => handleNavigation(item.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: collapsed ? '12px' : '12px 16px',
                          marginBottom: 4,
                          borderRadius: 8,
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          background: isActive ? `${category.color}20` : 'transparent',
                          borderLeft: collapsed ? 'none' : isActive ? `4px solid ${category.color}` : 'none',
                          borderRight: collapsed && isActive ? `4px solid ${category.color}` : 'none',
                          ...(isActive ? {
                            boxShadow: `0 2px 8px ${category.color}30`,
                            transform: 'translateX(2px)'
                          } : {}),
                          ...(!isActive && !darkMode ? {
                            '&:hover': {
                              background: `${category.color}10`,
                              transform: 'translateX(2px)'
                            }
                          } : {})
                        }}
                      >
                        <div style={{
                          width: collapsed ? 32 : 36,
                          height: collapsed ? 32 : 36,
                          borderRadius: 8,
                          background: isActive ? category.gradient : `${category.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: collapsed ? 0 : 12,
                          color: isActive ? '#fff' : category.color,
                          transition: 'all 0.3s'
                        }}>
                          {item.icon}
                        </div>
                        
                        {!collapsed && (
                          <div style={{ flex: 1 }}>
                            <Text style={{
                              color: isActive ? category.color : (darkMode ? '#fff' : '#000'),
                              fontWeight: isActive ? 600 : 400,
                              fontSize: 14
                            }}>
                              {item.label}
                            </Text>
                          </div>
                        )}
                        
                        {isActive && !collapsed && (
                          <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: category.color,
                            animation: 'pulse 2s infinite'
                          }} />
                        )}
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Information utilisateur en bas */}
          <div style={{
            padding: collapsed ? '12px 8px' : '16px 20px',
            borderTop: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}`,
            position: 'absolute',
            bottom: 0,
            width: '100%',
            background: darkMode ? '#141414' : '#fff'
          }}>
            {collapsed ? (
              <Tooltip title={t('menu.myProfile')} placement="right">
                <Avatar
                  size="large"
                  style={{ 
                    background: 'linear-gradient(135deg, #0ea5e9, #a855f7)',
                    color: '#fff',
                    cursor: 'pointer',
                    margin: '0 auto',
                    display: 'block'
                  }}
                  onClick={() => handleNavigation('/profil')}
                >
                  {user?.prenom_uti?.charAt(0) || user?.nom_uti?.charAt(0) || 'U'}
                </Avatar>
              </Tooltip>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar
                  size="large"
                  style={{ 
                    background: 'linear-gradient(135deg, #0ea5e9, #a855f7)',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleNavigation('/profil')}
                >
                  {user?.prenom_uti?.charAt(0) || user?.nom_uti?.charAt(0) || 'U'}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ 
                    color: darkMode ? '#fff' : '#000', 
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user?.prenom_uti} {user?.nom_uti}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                    {formatRole(user?.profil_uti || user?.role)}
                  </Text>
                  <Space size={4} style={{ marginTop: '4px' }}>
                    <GlobalOutlined style={{ fontSize: '12px', color: '#666' }} />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {formatCountryName(userCountry)}
                    </Text>
                  </Space>
                </div>
              </div>
            )}
          </div>
        </Sider>

        <AntLayout>
          {/* Header */}
          <Header style={{
            background: darkMode ? '#141414' : '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}`,
            height: '64px'
          }}>
            <Space size="large">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '16px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Text strong style={{ fontSize: '18px', color: darkMode ? '#fff' : '#000' }}>
                  {getPageTitle()}
                </Text>
                <Divider type="vertical" />
                <Space size={4}>
                  <GlobalOutlined style={{ color: '#666' }} />
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    {formatCountryName(userCountry)}
                  </Text>
                </Space>
              </div>
            </Space>

            <Space size="large">
              {/* Bouton notifications */}
              <Dropdown
                menu={{ items: notificationItems }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Badge count={notifications} overflowCount={99} style={{ 
                  boxShadow: 'none'
                }}>
                  <Button
                    type="text"
                    icon={<BellOutlined />}
                    size="large"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  />
                </Badge>
              </Dropdown>

              {/* Bouton paramètres */}
              <Tooltip title={t('menu.settings')}>
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={() => setSettingsVisible(true)}
                  size="large"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                />
              </Tooltip>

              {/* Menu utilisateur */}
              <Dropdown
                menu={{ items: userMenuItems }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
                  <Avatar
                    style={{ 
                      background: 'linear-gradient(135deg, #0ea5e9, #a855f7)',
                      color: '#fff'
                    }}
                    icon={<UserOutlined />}
                  />
                  {!collapsed && (
                    <div style={{ textAlign: 'left' }}>
                      <Text strong style={{ display: 'block', color: darkMode ? '#fff' : '#000' }}>
                        {user?.prenom_uti} {user?.nom_uti}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                        {formatRole(user?.profil_uti || user?.role)}
                      </Text>
                    </div>
                  )}
                </Space>
              </Dropdown>
            </Space>
          </Header>

          {/* Contenu principal */}
          <Content style={{
            margin: '24px',
            padding: 24,
            background: darkMode ? '#141414' : '#f0f2f5',
            borderRadius: '12px',
            minHeight: 'calc(100vh - 112px)',
            overflow: 'auto'
          }}>
            <Outlet />
          </Content>

          {/* Footer */}
          <Footer style={{
            textAlign: 'center',
            background: darkMode ? '#141414' : '#fff',
            borderTop: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}`,
            padding: '16px 24px'
          }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space split={<Divider type="vertical" />}>
                  <Text type="secondary">
                    © {new Date().getFullYear()} {t('app.name')} - {t('app.centralAfrica')}
                  </Text>
                  <Text type="secondary">
                    {t('footer.version')} MVP 1.0
                  </Text>
                  <Text type="secondary">
                    {t('footer.regionalDatabase')}
                  </Text>
                </Space>
              </Col>
              <Col>
                <Space split={<Divider type="vertical" />}>
                  <Text type="secondary">
                    {t('footer.loggedInAs')}: {user?.log_uti || user?.username || 'Utilisateur'}
                  </Text>
                  <Text type="secondary">
                    {t('footer.country')}: {formatCountryName(userCountry)}
                  </Text>
                  <Badge 
                    status="success" 
                    text={t('footer.systemOnline')}
                    style={{ 
                      background: 'transparent',
                      color: darkMode ? '#fff' : '#000'
                    }}
                  />
                </Space>
              </Col>
            </Row>
          </Footer>
        </AntLayout>

        {/* Modal paramètres */}
        <Drawer
          title={
            <Space>
              <SettingOutlined />
              <span>{t('menu.settings')}</span>
            </Space>
          }
          placement="right"
          onClose={() => setSettingsVisible(false)}
          open={settingsVisible}
          width={350}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card size="small" title="Apparence">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>Mode sombre</Text>
                  <Switch
                    checked={darkMode}
                    onChange={setDarkMode}
                    checkedChildren="ON"
                    unCheckedChildren="OFF"
                  />
                </div>
              </Space>
            </Card>

            <Card size="small" title="Langue">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type={i18n.language === 'fr' ? 'primary' : 'default'}
                  block
                  onClick={() => i18n.changeLanguage('fr')}
                >
                  Français
                </Button>
                <Button
                  type={i18n.language === 'en' ? 'primary' : 'default'}
                  block
                  onClick={() => i18n.changeLanguage('en')}
                >
                  English
                </Button>
              </Space>
            </Card>

            <Card size="small" title="Système">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>Statut</Text>
                  <Badge status="success" text="En ligne" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>Version</Text>
                  <Text type="secondary">MVP 1.0</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>Modules actifs</Text>
                  <Text type="secondary">11/11</Text>
                </div>
              </Space>
            </Card>
          </div>
        </Drawer>
      </AntLayout>
    </ConfigProvider>
  );
};

export default Layout;