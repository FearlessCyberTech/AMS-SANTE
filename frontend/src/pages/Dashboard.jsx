import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Activity,
  Building,
  Clock,
  AlertCircle,
  UserPlus,
  FileText,
  RefreshCw,
  Heart,
  Shield,
  BarChart3,
  Globe,
  ChevronRight,
  CheckCircle,
  XCircle,
  Wifi,
  Database,
  Server,
  Download,
  Upload,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import LanguageService from '../services/LanguageService';
import './Dashboard.css';

const Dashboard = () => {
  const { user, getToken, logout, userLanguage } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    loading: true,
    error: null
  });

  const [activePeriod, setActivePeriod] = useState('today');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [countryInfo, setCountryInfo] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState(null);

  // Initialize language and country info
  useEffect(() => {
    // Get current language info
    const languages = LanguageService.getAvailableLanguages();
    const currentLang = languages.find(lang => lang.code === userLanguage) || languages[0];
    setCurrentLanguage(currentLang);
    
    // Get country info based on user's country
    if (user?.cod_pay) {
      const info = LanguageService.getCountryInfo(user.cod_pay);
      setCountryInfo(info);
    } else if (user?.country) {
      // Try to get country from user data
      const info = LanguageService.getCountryInfo(user.country);
      setCountryInfo(info);
    }
  }, [user, userLanguage]);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      
      const token = getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      console.log('Fetching dashboard data from:', `${apiUrl}/api/dashboard/stats`);
      
      const response = await fetch(`${apiUrl}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept-Language': i18n.language
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error(t('sessionExpired'));
        }
        throw new Error(`${t('serverError')}: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data) {
        throw new Error(t('noData'));
      }

      setDashboardData({
        stats: data,
        loading: false,
        error: null
      });
      
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message || t('loadError')
      }));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data when language changes
    const handleLanguageChange = () => {
      fetchDashboardData();
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n.language]);

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat(i18n.language).format(num);
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0 FCFA';
    
    // Format based on language
    if (i18n.language === 'en-GB') {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'XAF',
        currencyDisplay: 'code'
      }).format(amount).replace('XAF', 'FCFA');
    } else if (i18n.language === 'es-ES') {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'XAF',
        currencyDisplay: 'code'
      }).format(amount).replace('XAF', 'FCFA');
    }
    
    // Default to French format
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      currencyDisplay: 'code'
    }).format(amount).replace('XAF', 'FCFA');
  };

  const formatDate = (date) => {
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    
    if (i18n.language === 'en-GB') {
      return new Intl.DateTimeFormat('en-GB', options).format(date);
    } else if (i18n.language === 'es-ES') {
      return new Intl.DateTimeFormat('es-ES', options).format(date);
    }
    
    return new Intl.DateTimeFormat('fr-FR', options).format(date);
  };

  // Données par défaut si l'API ne répond pas
  const defaultStats = {
    totalPatients: 1245,
    totalConsultations: 3421,
    revenue: 152300,
    pendingAppointments: 23,
    activeDoctors: 8,
    monthlyRevenue: 450000,
    todayAppointments: 42,
    patientSatisfaction: 92,
    averageWaitTime: 15,
    todayRevenue: 25000,
    activeCenters: 12,
    onlineUsers: 8
  };

  const stats = dashboardData.stats || defaultStats;

  const statCards = [
    {
      id: 1,
      title: t('totalPatients'),
      value: formatNumber(stats.totalPatients),
      icon: Users,
      color: 'blue',
      trend: t('trendThisMonth'),
      description: t('registeredPatients')
    },
    {
      id: 2,
      title: t('consultations'),
      value: formatNumber(stats.totalConsultations),
      icon: Stethoscope,
      color: 'green',
      trend: t('trendThisWeek'),
      description: t('completedConsultations')
    },
    {
      id: 3,
      title: t('activeDoctors'),
      value: formatNumber(stats.activeDoctors),
      icon: UserPlus,
      color: 'purple',
      trend: t('trendThisQuarter'),
      description: t('availableProfessionals')
    },
    {
      id: 4,
      title: t('pendingAppointments'),
      value: formatNumber(stats.pendingAppointments),
      icon: Clock,
      color: 'yellow',
      trend: t('trendYesterday'),
      description: t('toProcessToday')
    },
    {
      id: 5,
      title: t('monthlyRevenue'),
      value: formatCurrency(stats.monthlyRevenue || stats.revenue),
      icon: DollarSign,
      color: 'emerald',
      trend: t('trendMonthRevenue'),
      description: t('totalMonthlyRevenue')
    },
    {
      id: 6,
      title: t('patientSatisfaction'),
      value: `${stats.patientSatisfaction || 92}%`,
      icon: Heart,
      color: 'pink',
      trend: t('trendSatisfaction'),
      description: t('satisfactionRate')
    }
  ];

  const periods = [
    { id: 'today', label: t('today') },
    { id: 'week', label: t('thisWeek') },
    { id: 'month', label: t('thisMonth') },
    { id: 'year', label: t('thisYear') }
  ];

  const quickActions = [
    { icon: Stethoscope, label: t('newConsultationBtn'), color: 'blue', path: '/consultations' },
    { icon: UserPlus, label: t('newPatient'), color: 'green', path: '/patients' },
    { icon: FileText, label: t('prescription'), color: 'purple', path: '/prescriptions' },
    { icon: DollarSign, label: t('billing'), color: 'yellow', path: '/facturation' },
    { icon: Calendar, label: t('schedule'), color: 'red', path: '/consultations' },
    { icon: BarChart3, label: t('reports'), color: 'teal', path: '/admin' }
  ];

  // Recent activities with localized times
  const getTimeAgo = (minutes) => {
    if (i18n.language === 'en-GB') {
      if (minutes === 5) return '5 minutes ago';
      if (minutes === 15) return '15 minutes ago';
      if (minutes === 30) return '30 minutes ago';
      if (minutes === 60) return '1 hour ago';
      return '2 hours ago';
    } else if (i18n.language === 'es-ES') {
      if (minutes === 5) return 'Hace 5 minutos';
      if (minutes === 15) return 'Hace 15 minutos';
      if (minutes === 30) return 'Hace 30 minutos';
      if (minutes === 60) return 'Hace 1 hora';
      return 'Hace 2 horas';
    }
    
    // French by default
    if (minutes === 5) return 'Il y a 5 min';
    if (minutes === 15) return 'Il y a 15 min';
    if (minutes === 30) return 'Il y a 30 min';
    if (minutes === 60) return 'Il y a 1h';
    return 'Il y a 2h';
  };

  const recentActivities = [
    { icon: Stethoscope, text: `${t('newConsultation')} Jean Dupont`, time: getTimeAgo(5) },
    { icon: UserPlus, text: `${t('patientAdded')} Marie Martin`, time: getTimeAgo(15) },
    { icon: FileText, text: `${t('prescriptionCreated')} Paul Durand`, time: getTimeAgo(30) },
    { icon: DollarSign, text: `${t('invoicePaid')} #2024-001`, time: getTimeAgo(60) },
    { icon: Calendar, text: `${t('appointmentCancelled')} - Sophie Bernard`, time: getTimeAgo(120) }
  ];

  if (dashboardData.loading && !refreshing) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="spinner-large"></div>
          <p>{t('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <motion.div 
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-left">
          <h1 className="page-title">
            <Shield size={28} />
            {t('dashboard')}
          </h1>
          <div className="welcome-section">
            <p className="welcome-message">
              {t('welcome')}, <strong>{user?.username || user?.prenom || user?.nom_uti || t('user')}</strong>
              {user?.role && ` | ${t('role')}: ${user.role}`}
            </p>
            {countryInfo && (
              <div className="country-badge">
                <span className="country-flag-small">{countryInfo.flag}</span>
                <span className="country-name-small">{countryInfo.name}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="header-right">
          <div className="period-selector">
            {periods.map(period => (
              <button
                key={period.id}
                className={`period-btn ${activePeriod === period.id ? 'active' : ''}`}
                onClick={() => setActivePeriod(period.id)}
              >
                {period.label}
              </button>
            ))}
          </div>
          
          <div className="header-actions">
           
            
            <div className="update-info">
              <span className="last-update">
                {t('lastUpdate') || 'Dernière mise à jour'}: {formatDate(lastUpdate)}
              </span>
            </div>
            
            <motion.button
              className="refresh-btn"
              onClick={fetchDashboardData}
              disabled={refreshing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={refreshing ? 'spinning' : ''} size={18} />
              {refreshing ? t('refreshing') : t('refresh')}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Error Display */}
      {dashboardData.error && (
        <motion.div 
          className="dashboard-error"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <AlertCircle size={24} />
          <div className="error-content">
            <h4>{t('errorLoading')}</h4>
            <p>{dashboardData.error}</p>
          </div>
          <button onClick={fetchDashboardData} className="retry-btn">
            {t('retry')}
          </button>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <motion.div
            key={card.id}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <div className={`card-header ${card.color}`}>
              <div className="card-icon">
                <card.icon size={24} />
              </div>
              <div className="trend-badge">
                <TrendingUp size={12} />
                <span>{card.trend}</span>
              </div>
            </div>
            
            <div className="card-content">
              <h3 className="stat-value">{card.value}</h3>
              <p className="stat-title">{card.title}</p>
              <p className="stat-description">{card.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Left Column */}
        <div className="content-left">
          {/* Chart Section */}
          <motion.div 
            className="chart-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="chart-header">
              <h3>{t('consultationActivity')}</h3>
              <div className="chart-legend">
                <span className="legend-item blue">{t('consultations')}</span>
                <span className="legend-item green">{t('revenues')}</span>
              </div>
            </div>
            
            <div className="chart-placeholder">
              <Activity size={48} />
              <p>{t('consultationActivity')}</p>
              <small>{t('realTimeData')}</small>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            className="activity-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="activity-header">
              <h3>{t('activity')}</h3>
              <button className="view-all">{t('seeAll')} <ChevronRight size={14} /></button>
            </div>
            
            <div className="activity-list">
              {recentActivities.map((activity, idx) => (
                <div key={idx} className="activity-item">
                  <div className="activity-icon">
                    <activity.icon size={16} />
                  </div>
                  <div className="activity-content">
                    <p>{activity.text}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="content-right">
          {/* Quick Stats */}
          <motion.div 
            className="quick-stats-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h3>{t('quickStats') || 'Statistiques rapides'}</h3>
            <div className="quick-stats-grid">
              <div className="quick-stat">
                <div className="stat-indicator blue">
                  <Users size={20} />
                </div>
                <div>
                  <p className="stat-number">42</p>
                  <p className="stat-label">{t('patientsToday')}</p>
                </div>
              </div>
              
              <div className="quick-stat">
                <div className="stat-indicator green">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="stat-number">{stats.averageWaitTime || 15} {t('minutes')}</p>
                  <p className="stat-label">{t('averageWaitTime')}</p>
                </div>
              </div>
              
              <div className="quick-stat">
                <div className="stat-indicator purple">
                  <Building size={20} />
                </div>
                <div>
                  <p className="stat-number">{stats.activeCenters || 12}</p>
                  <p className="stat-label">{t('activeCenters')}</p>
                </div>
              </div>
              
              <div className="quick-stat">
                <div className="stat-indicator orange">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="stat-number">{formatCurrency(stats.todayRevenue || 25000)}</p>
                  <p className="stat-label">{t('revenueToday')}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* System Info */}
          <motion.div 
            className="system-info-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="system-info-header">
              <h3>{t('systemInfo')}</h3>
              <div className="system-status">
                <span className="status-indicator active"></span>
                <span className="status-text">{t('systemOnline') || 'Système en ligne'}</span>
              </div>
            </div>
            
            <div className="info-list">
              <div className="info-item">
                <div className="info-icon">
                  <Server size={16} />
                </div>
                <span className="info-label">{t('version')}:</span>
                <span className="info-value">HealthCenterSoft 2.0</span>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <Database size={16} />
                </div>
                <span className="info-label">{t('database')}:</span>
                <span className="info-value">SQL Server</span>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <Wifi size={16} />
                </div>
                <span className="info-label">{t('apiStatus')}:</span>
                <span className="info-value success">● {t('connected')}</span>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <Download size={16} />
                </div>
                <span className="info-label">{t('lastBackup')}:</span>
                <span className="info-value">{formatDate(new Date())}</span>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <Users size={16} />
                </div>
                <span className="info-label">{t('onlineUsers')}:</span>
                <span className="info-value">{stats.onlineUsers || 8}</span>
              </div>
              
              {countryInfo && (
                <div className="info-item">
                  <div className="info-icon">
                    <Globe size={16} />
                  </div>
                  <span className="info-label">{t('country') || 'Pays'}:</span>
                  <span className="info-value">{countryInfo.name}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div 
        className="quick-actions-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="actions-header">
          <h3>{t('quickActions')}</h3>
          <p className="actions-subtitle">{t('actionsDescription') || 'Accédez rapidement aux fonctionnalités principales'}</p>
        </div>
        
        <div className="actions-grid">
          {quickActions.map((action, idx) => (
            <motion.button
              key={idx}
              className="action-btn"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = action.path}
            >
              <div className={`action-icon ${action.color}`}>
                <action.icon size={24} />
              </div>
              <span>{action.label}</span>
              <ChevronRight className="action-arrow" size={16} />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <div className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-info">
            <p>© {new Date().getFullYear()} HealthCenterSoft - {t('copyright')}</p>
            <p className="footer-details">
              {t('version')}: 2.0.0 | {t('environment')}: {t('development') || 'Développement'} | 
              {t('language') || 'Langue'}: {currentLanguage ? currentLanguage.name : userLanguage} | 
              {t('country') || 'Pays'}: {countryInfo?.name || t('notSpecified') || 'Non spécifié'}
            </p>
          </div>
          <div className="footer-links">
            <a href="#"><FileText size={14} /> {t('documentation')}</a>
            <a href="#"><HelpCircle size={14} /> {t('support')}</a>
            <a href="#"><Shield size={14} /> {t('legal')}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;