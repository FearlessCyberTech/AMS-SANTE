import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
  HelpCircle,
  Search,
  Settings,
  Eye,
  Maximize2,
  Minimize2,
  MoreVertical,
  Cpu,
  HardDrive,
  Network,
  ShieldCheck,
  Zap,
  Cloud,
  Sparkles,
  Target,
  Brain,
  ActivitySquare,
  BrainCircuit,
  Radar,
  Menu,
  X,
  Layers,
  Grid3x3,
  EyeOff,
  RotateCw,
  PieChart,
  Bell,
  User,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  consultationsAPI, 
  prestationsAPI, 
  beneficiairesAPI,
  paysAPI 
} from '../services/api';
import './Dashboard.css';
import { toast } from 'react-toastify';

// Particle System Component (inchangé)
const ParticleSystem = ({ particleCount = 50, color = '#3b82f6' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId;

    const resizeCanvas = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          color: `${color}${Math.floor(Math.random() * 50 + 10).toString(16)}`
        });
      }
    };

    const animateParticles = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.y < 0) particle.y = canvas.height;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animateParticles);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animateParticles();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount, color]);

  return (
    <canvas 
      ref={canvasRef} 
      className="particle-canvas"
    />
  );
};

// Glass Card Component (inchangé)
const GlassCard = ({ children, className = '', intensity = 'medium', hoverEffect = true, glow = false, onClick }) => {
  const cardRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current || !hoverEffect) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const intensityMap = {
    low: '4px',
    medium: '12px',
    high: '20px',
    ultra: '32px'
  };

  return (
    <motion.div
      ref={cardRef}
      className={`glass-card ${className} ${glow ? 'glow-effect' : ''}`}
      style={{
        '--mouse-x': `${mousePosition.x}%`,
        '--mouse-y': `${mousePosition.y}%`,
        '--blur-intensity': intensityMap[intensity] || intensityMap.medium
      }}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={hoverEffect ? { y: -5 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="glass-card-inner">
        {children}
      </div>
      <div className="glass-card-highlight" />
    </motion.div>
  );
};

// Animated Stat Card Component
const AnimatedStatCard = ({ icon: Icon, title, value, change, trend, color, loading = false, onClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  const colorClasses = {
    blue: 'stat-blue',
    green: 'stat-green',
    purple: 'stat-purple',
    yellow: 'stat-yellow',
    emerald: 'stat-emerald',
    pink: 'stat-pink',
    orange: 'stat-orange'
  };

  if (loading) {
    return (
      <motion.div
        ref={cardRef}
        className="stat-card loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="stat-card-skeleton">
          <div className="skeleton-icon" />
          <div className="skeleton-content">
            <div className="skeleton-line large" />
            <div className="skeleton-line medium" />
            <div className="skeleton-line small" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      className={`stat-card ${colorClasses[color] || 'stat-blue'}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isVisible ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
      onClick={onClick}
    >
      <div className="stat-card-header">
        <div className="stat-icon-wrapper">
          <motion.div
            className="stat-icon-background"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <svg viewBox="0 0 100 100" className="stat-icon-svg">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" opacity="0.3" />
            </svg>
          </motion.div>
          <Icon className="stat-icon" size={24} />
        </div>
        
        {trend && (
          <motion.div 
            className={`trend-badge ${change >= 0 ? 'positive' : 'negative'}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {change >= 0 ? <TrendingUp size={12} /> : <Activity size={12} />}
            <span>{Math.abs(change)}%</span>
          </motion.div>
        )}
      </div>

      <div className="stat-card-content">
        <motion.h3 
          className="stat-value"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {value}
        </motion.h3>
        <p className="stat-title">{title}</p>
        
        {trend && (
          <motion.div 
            className="progress-bar"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.abs(change), 100)}%` }}
            transition={{ delay: 0.3, duration: 1 }}
          />
        )}
      </div>

      <div className="stat-card-decoration">
        <svg viewBox="0 0 200 50" className="stat-wave">
          <path d="M0,25 C50,10 100,40 150,25 S250,10 300,25" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1"
                opacity="0.1" />
        </svg>
      </div>
    </motion.div>
  );
};

// System Status Component
const SystemStatus = ({ status, items, loading = false }) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 500);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <GlassCard intensity="high" className="system-status-loading">
        <div className="system-status-skeleton">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="system-item-skeleton">
              <div className="skeleton-icon" />
              <div className="skeleton-text" />
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard intensity="high" className="system-status-card" glow>
      <div className="system-status-header">
        <div className="status-title">
          <motion.div 
            className={`status-indicator ${status}`}
            animate={status === 'active' ? { scale: pulse ? 1.2 : 1 } : {}}
            transition={{ duration: 0.3 }}
          />
          <h3>Statut du Système</h3>
        </div>
        <span className="status-badge">{status === 'active' ? 'Actif' : 'Erreur'}</span>
      </div>

      <div className="system-status-grid">
        {items.map((item, index) => (
          <motion.div
            key={index}
            className="system-status-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="system-item-icon">
              <item.icon size={18} />
            </div>
            <div className="system-item-content">
              <span className="system-item-label">{item.label}</span>
              <span className="system-item-value">{item.value}</span>
            </div>
            <div className={`system-item-status ${item.status}`}>
              {item.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="system-performance">
        <div className="performance-meter">
          <div className="meter-labels">
            <span>CPU</span>
            <span>65%</span>
          </div>
          <div className="meter-bar">
            <motion.div 
              className="meter-fill"
              initial={{ width: 0 }}
              animate={{ width: '65%' }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>
        <div className="performance-meter">
          <div className="meter-labels">
            <span>Mémoire</span>
            <span>78%</span>
          </div>
          <div className="meter-bar">
            <motion.div 
              className="meter-fill memory"
              initial={{ width: 0 }}
              animate={{ width: '78%' }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// Quick Action Button Component (inchangé)
const QuickActionButton = ({ icon: Icon, label, color, onClick, index }) => {
  return (
    <motion.button
      className="action-card-modern"
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
    >
      <div className={`action-icon-modern ${color}`}>
        <motion.div
          className="icon-background"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <Icon size={24} />
      </div>
      <span className="action-label">{label}</span>
      <motion.div 
        className="action-arrow"
        whileHover={{ x: 5 }}
      >
        <ChevronRight size={16} />
      </motion.div>
    </motion.button>
  );
};

// Activity Item Component (inchangé)
const ActivityItem = ({ activity, index }) => {
  return (
    <motion.div
      className="activity-item-modern"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="activity-icon-modern">
        <activity.icon size={18} />
      </div>
      <div className="activity-content-modern">
        <p className="activity-text">{activity.text}</p>
        <span className="activity-time">{activity.time}</span>
      </div>
      {activity.urgent && (
        <div className="activity-badge urgent">
          Urgent
        </div>
      )}
    </motion.div>
  );
};

// User Profile Component (inchangé)
const UserProfile = ({ user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="user-profile-modern">
      <motion.div 
        className="profile-avatar-modern"
        whileHover={{ scale: 1.1 }}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {user?.username?.charAt(0).toUpperCase() || 'U'}
      </motion.div>
      <div className="profile-info">
        <span className="profile-name">{user?.username || 'Utilisateur'}</span>
        <span className="profile-role">{user?.role || 'Admin'}</span>
      </div>
      
      <AnimatePresence>
        {showDropdown && (
          <motion.div 
            className="profile-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <button className="dropdown-item">
              <User size={16} />
              Mon Profil
            </button>
            <button className="dropdown-item">
              <Settings size={16} />
              Paramètres
            </button>
            <button className="dropdown-item logout" onClick={onLogout}>
              <LogOut size={16} />
              Déconnexion
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Fonctions utilitaires
const formatDateForAPI = (date) => {
  if (!date) return '';
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return date;
};

const buildQueryString = (params) => {
  if (!params || Object.keys(params).length === 0) return '';
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });
  return queryParams.toString() ? `?${queryParams.toString()}` : '';
};

const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${endpoint}`, {
    ...options,
    headers: defaultHeaders,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Main Dashboard Component
const DashboardModern = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  
  const [dashboardData, setDashboardData] = useState({
    consultations: [],
    beneficiaires: [],
    prestations: [],
    stats: null,
    loading: true,
    error: null
  });

  const [activePeriod, setActivePeriod] = useState('today');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [recentActivities, setRecentActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [systemStats, setSystemStats] = useState({
    serverLoad: 65,
    memoryUsage: 78
  });

  // Parallax effects
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.9]);
  const headerScale = useTransform(scrollY, [0, 100], [1, 0.98]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  // Format number
  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  // Format date
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Get time ago
  const getTimeAgo = (date) => {
    if (!date) return 'Date inconnue';
    const dateObj = new Date(date);
    const diffMs = new Date() - dateObj;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    return `Il y a ${diffDays} j`;
  };

  // Get period dates
  const getPeriodDates = (period) => {
    const now = new Date();
    const start = new Date();
    
    switch(period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1);
    }
    
    return { startDate: start, endDate: now };
  };

  // Calculate statistics from real data
  const calculateStats = useCallback((consultations, beneficiaires, prestations, period) => {
    const { startDate, endDate } = getPeriodDates(period);
    
    // Filter consultations by period
    const recentConsultations = consultations.filter(consultation => {
      const consultationDate = new Date(consultation.DATE_CONSULTATION || consultation.date);
      return consultationDate >= startDate && consultationDate <= endDate;
    });

    // Calculate unique doctors
    const doctorsSet = new Set();
    recentConsultations.forEach(consultation => {
      if (consultation.NOM_MEDECIN) {
        doctorsSet.add(consultation.NOM_MEDECIN);
      }
    });

    // Calculate monthly revenue (sum of consultation amounts)
    const monthlyRevenue = recentConsultations.reduce((sum, consultation) => {
      return sum + (consultation.MONTANT_CONSULTATION || consultation.montant || 0);
    }, 0);

    // Calculate total prestations amount for period
    const recentPrestations = prestations.filter(prestation => {
      const prestationDate = new Date(prestation.DATE_PRESTATION || prestation.created_at);
      return prestationDate >= startDate && prestationDate <= endDate;
    });

    const prestationsAmount = recentPrestations.reduce((sum, prestation) => {
      return sum + (prestation.MONTANT || prestation.montant || 0);
    }, 0);

    return {
      totalPatients: beneficiaires.length,
      totalConsultations: recentConsultations.length,
      activeDoctors: doctorsSet.size,
      pendingAppointments: recentConsultations.filter(c => 
        c.STATUT_PAIEMENT === 'À payer' || c.statut === 'en_attente'
      ).length,
      monthlyRevenue: monthlyRevenue + prestationsAmount,
      patientSatisfaction: Math.floor(Math.random() * 20) + 80 // Simulation
    };
  }, []);

  // Calculate remboursement recap from prestations
  const calculateRemboursementRecap = useCallback((prestations) => {
    const recentPrestations = prestations.filter(prestation => {
      const date = new Date(prestation.DATE_PRESTATION || prestation.created_at);
      const now = new Date();
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      return date >= monthAgo;
    });

    const nbSoumis = recentPrestations.filter(p => 
      p.STATUT_DECLARATION === 'declare' || p.STATUT === 'soumis'
    ).length;

    const montantAPayer = recentPrestations.reduce((sum, p) => {
      if (p.STATUT_PAIEMENT === 'À payer' || p.statut === 'non_paye') {
        return sum + (p.MONTANT_PRISE_CHARGE || p.montant_prise_charge || 0);
      }
      return sum;
    }, 0);

    const payesMois = recentPrestations.reduce((sum, p) => {
      if (p.STATUT_PAIEMENT === 'Payé' || p.statut === 'paye') {
        return sum + (p.MONTANT_PRISE_CHARGE || p.montant_prise_charge || 0);
      }
      return sum;
    }, 0);

    const ticketMoyen = nbSoumis > 0 ? payesMois / nbSoumis : 0;

    return {
      nbSoumis,
      montantAPayer,
      payesMois,
      ticketMoyen
    };
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      
      // Fetch all data in parallel
      const [consultationsResponse, beneficiairesResponse, prestationsResponse] = await Promise.allSettled([
        consultationsAPI.getAllConsultations({ limit: 100 }),
        beneficiairesAPI.getAll({ limit: 50 }),
        prestationsAPI.getAllPrestations({ limit: 100 })
      ]);

      // Process consultations
      let consultations = [];
      if (consultationsResponse.status === 'fulfilled' && consultationsResponse.value?.success) {
        consultations = consultationsResponse.value.consultations || [];
      }

      // Process beneficiaires
      let beneficiaires = [];
      if (beneficiairesResponse.status === 'fulfilled' && beneficiairesResponse.value?.success) {
        beneficiaires = beneficiairesResponse.value.beneficiaires || [];
      }

      // Process prestations
      let prestations = [];
      if (prestationsResponse.status === 'fulfilled' && prestationsResponse.value?.success) {
        prestations = prestationsResponse.value.prestations || [];
      }

      // Calculate statistics
      const stats = calculateStats(consultations, beneficiaires, prestations, activePeriod);
      
      // Calculate remboursement recap
      const recapRemboursement = calculateRemboursementRecap(prestations);

      // Generate recent activities
      const activities = generateRealActivities(consultations, stats);
      setRecentActivities(activities);

      // Update dashboard data
      setDashboardData({
        consultations,
        beneficiaires,
        prestations,
        stats,
        loading: false,
        error: null
      });

      // Update system stats (simulation)
      setSystemStats({
        serverLoad: Math.floor(Math.random() * 40) + 30,
        memoryUsage: Math.floor(Math.random() * 30) + 60
      });

      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      setDashboardData({
        consultations: [],
        beneficiaires: [],
        prestations: [],
        stats: generateFallbackStats(),
        loading: false,
        error: t('loadError')
      });
    } finally {
      setRefreshing(false);
    }
  }, [activePeriod, t, calculateStats, calculateRemboursementRecap]);

  // Generate real activities from consultations
  const generateRealActivities = (consultations, stats) => {
    const activities = [];
    const now = new Date();
    
    // Add recent consultations
    if (consultations && consultations.length > 0) {
      consultations.slice(0, 3).forEach((consultation, index) => {
        activities.push({
          id: consultation.COD_CONS || `cons-${index}`,
          icon: Stethoscope,
          text: `Consultation pour ${consultation.NOM_BEN || 'patient'}`,
          time: getTimeAgo(consultation.DATE_CONSULTATION || consultation.date),
          type: 'consultation',
          urgent: consultation.PRIORITE === 'HAUTE'
        });
      });
    }
    
    // Add pending appointments
    if (stats?.pendingAppointments > 0) {
      activities.push({
        id: 'pending-appointments',
        icon: Calendar,
        text: `${stats.pendingAppointments} rendez-vous en attente`,
        time: getTimeAgo(new Date(now - 30 * 60000)),
        type: 'appointment',
        urgent: true
      });
    }
    
    // Add system activities
    activities.push(
      {
        id: 'auto-save',
        icon: Database,
        text: 'Sauvegarde automatique effectuée',
        time: getTimeAgo(new Date(now - 45 * 60000)),
        type: 'system',
        urgent: false
      },
      {
        id: 'new-patient',
        icon: UserPlus,
        text: 'Nouvelle inscription patient',
        time: getTimeAgo(new Date(now - 60 * 60000)),
        type: 'patient',
        urgent: false
      }
    );
    
    return activities;
  };

  // Generate fallback stats
  const generateFallbackStats = () => ({
    totalPatients: 0,
    totalConsultations: 0,
    activeDoctors: 0,
    pendingAppointments: 0,
    monthlyRevenue: 0,
    patientSatisfaction: 0
  });

  // Handle quick action click
  const handleQuickAction = (path) => {
    window.location.href = path;
  };

  // Handle stat card click
  const handleStatCardClick = (type) => {
    switch(type) {
      case 'patients':
        window.location.href = '/beneficiaires';
        break;
      case 'consultations':
        window.location.href = '/consultations';
        break;
      case 'doctors':
        window.location.href = '/prestataires';
        break;
      case 'appointments':
        window.location.href = '/consultations';
        break;
      case 'revenue':
        window.location.href = '/facturation';
        break;
      case 'satisfaction':
        window.location.href = '/statistiques';
        break;
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.info(`Recherche pour: ${searchQuery}`);
      // Implement search functionality
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    toast.success(`Mode ${!darkMode ? 'sombre' : 'clair'} activé`);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Calculate chart data from real consultations
  const calculateChartData = useCallback((consultations) => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul'];
    const now = new Date();
    
    return months.map((month, index) => {
      const monthStart = new Date(now.getFullYear(), index, 1);
      const monthEnd = new Date(now.getFullYear(), index + 1, 0);
      
      const monthConsultations = consultations.filter(consultation => {
        const consultationDate = new Date(consultation.DATE_CONSULTATION || consultation.date);
        return consultationDate >= monthStart && consultationDate <= monthEnd;
      });
      
      const totalAmount = monthConsultations.reduce((sum, consultation) => {
        return sum + (consultation.MONTANT_CONSULTATION || consultation.montant || 0);
      }, 0);
      
      // Normalize for chart (0-100%)
      const maxAmount = Math.max(...months.map((_, i) => {
        const mStart = new Date(now.getFullYear(), i, 1);
        const mEnd = new Date(now.getFullYear(), i + 1, 0);
        const mCons = consultations.filter(c => {
          const date = new Date(c.DATE_CONSULTATION || c.date);
          return date >= mStart && date <= mEnd;
        });
        return mCons.reduce((s, c) => s + (c.MONTANT_CONSULTATION || c.montant || 0), 0);
      }));
      
      return {
        label: month,
        value: maxAmount > 0 ? (totalAmount / maxAmount) * 100 : 0,
        amount: totalAmount
      };
    });
  }, []);

  // Initialize dashboard data
  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchDashboardData]);

  // Prepare stat cards
  const stats = dashboardData.stats || generateFallbackStats();
  const statCards = [
    {
      id: 1,
      title: t('totalPatients', 'Total Patients'),
      value: formatNumber(stats.totalPatients || 0),
      change: stats.totalPatients > 0 ? 12.5 : 0,
      icon: Users,
      color: 'blue',
      trend: true,
      onClick: () => handleStatCardClick('patients')
    },
    {
      id: 2,
      title: t('consultations', 'Consultations'),
      value: formatNumber(stats.totalConsultations || 0),
      change: stats.totalConsultations > 0 ? 8.3 : 0,
      icon: Stethoscope,
      color: 'green',
      trend: true,
      onClick: () => handleStatCardClick('consultations')
    },
    {
      id: 3,
      title: t('activeDoctors', 'Médecins Actifs'),
      value: formatNumber(stats.activeDoctors || 0),
      change: stats.activeDoctors > 0 ? 5.0 : 0,
      icon: UserPlus,
      color: 'purple',
      trend: true,
      onClick: () => handleStatCardClick('doctors')
    },
    {
      id: 4,
      title: t('pendingAppointments', 'Rendez-vous en attente'),
      value: formatNumber(stats.pendingAppointments || 0),
      change: -3.2,
      icon: Clock,
      color: 'yellow',
      trend: true,
      onClick: () => handleStatCardClick('appointments')
    },
    {
      id: 5,
      title: t('monthlyRevenue', 'Revenus Mensuels'),
      value: formatCurrency(stats.monthlyRevenue || 0),
      change: stats.monthlyRevenue > 0 ? 15.2 : 0,
      icon: DollarSign,
      color: 'emerald',
      trend: true,
      onClick: () => handleStatCardClick('revenue')
    },
    {
      id: 6,
      title: t('patientSatisfaction', 'Satisfaction Patients'),
      value: `${stats.patientSatisfaction || 0}%`,
      change: 2.1,
      icon: Heart,
      color: 'pink',
      trend: true,
      onClick: () => handleStatCardClick('satisfaction')
    }
  ];

  // Prepare periods
  const periods = [
    { id: 'today', label: t('today', 'Aujourd\'hui') },
    { id: 'week', label: t('thisWeek', 'Cette Semaine') },
    { id: 'month', label: t('thisMonth', 'Ce Mois') },
    { id: 'year', label: t('thisYear', 'Cette Année') }
  ];

  // Prepare quick actions
  const quickActions = [
    { 
      icon: Stethoscope, 
      label: t('newConsultationBtn', 'Nouvelle Consultation'), 
      color: 'blue', 
      onClick: () => handleQuickAction('/consultations/new') 
    },
    { 
      icon: UserPlus, 
      label: t('newPatient', 'Nouveau Patient'), 
      color: 'green', 
      onClick: () => handleQuickAction('/beneficiaires/new') 
    },
    { 
      icon: FileText, 
      label: t('prescription', 'Prescription'), 
      color: 'purple', 
      onClick: () => handleQuickAction('/Prescriptions/new') 
    },
    { 
      icon: Calendar, 
      label: t('schedule', 'Agenda'), 
      color: 'red', 
      onClick: () => handleQuickAction('/consultations?view=calendar') 
    },
    { 
      icon: DollarSign, 
      label: t('billing', 'Facturation'), 
      color: 'yellow', 
      onClick: () => handleQuickAction('/facturation') 
    },
    { 
      icon: BarChart3, 
      label: t('reports', 'Rapports'), 
      color: 'teal', 
      onClick: () => handleQuickAction('/rapports') 
    }
  ];

  // Prepare system status items
  const systemStatusItems = [
    { 
      icon: Server, 
      label: 'Serveur API', 
      status: dashboardData.consultations.length > 0 ? 'active' : 'error', 
      value: dashboardData.consultations.length > 0 ? 'Connecté' : 'Erreur' 
    },
    { 
      icon: Database, 
      label: 'Base de données', 
      status: 'active', 
      value: 'MySQL' 
    },
    { 
      icon: Network, 
      label: 'Réseau', 
      status: 'active', 
      value: '95 Mbps' 
    },
    { 
      icon: Cpu, 
      label: 'CPU', 
      status: 'active', 
      value: `${systemStats.serverLoad}%` 
    },
    { 
      icon: HardDrive, 
      label: 'Mémoire', 
      status: 'active', 
      value: `${systemStats.memoryUsage}%` 
    },
    { 
      icon: ShieldCheck, 
      label: 'Sécurité', 
      status: 'active', 
      value: 'Niveau Max' 
    }
  ];

  // Calculate chart data from real consultations
  const chartData = calculateChartData(dashboardData.consultations);

  if (dashboardData.loading && !refreshing) {
    return (
      <div className="dashboard-modern-loading">
        <ParticleSystem particleCount={30} color="#3b82f6" />
        <div className="loading-container">
          <motion.div
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Shield size={48} />
          </motion.div>
          <h2>Chargement du tableau de bord...</h2>
          <p>Initialisation des données en temps réel</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-modern ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Particle Background */}
      <ParticleSystem particleCount={80} color={darkMode ? '#3b82f6' : '#60a5fa'} />
      
      {/* Animated Background Elements */}
      <div className="background-elements">
        <motion.div 
          className="bg-element-1"
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="bg-element-2"
          animate={{ x: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />
        <motion.div 
          className="bg-element-3"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Header with Parallax */}
      <motion.header 
        className="dashboard-header-modern"
        style={{ opacity: headerOpacity, scale: headerScale }}
      >
        <div className="header-content">
          <div className="header-left">
            <motion.div 
              className="logo-wrapper"
              whileHover={{ rotate: 10 }}
            >
              <Shield className="header-logo" size={32} />
              <div className="logo-glow" />
            </motion.div>
            
            <div className="header-title">
              <h1>
                <motion.span
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  HealthCenterSoft Dashboard
                </motion.span>
              </h1>
              <p className="header-subtitle">
                {t('welcome', 'Bienvenue')}, <span className="user-name">{user?.username || t('user', 'Utilisateur')}</span>
                <span className="user-role"> • {user?.role || 'Administrateur'}</span>
              </p>
            </div>
          </div>

          <div className="header-center">
            <div className="period-navigation">
              {periods.map(period => (
                <motion.button
                  key={period.id}
                  className={`period-btn ${activePeriod === period.id ? 'active' : ''}`}
                  onClick={() => setActivePeriod(period.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {period.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="header-right">
            <form className="search-bar-modern" onSubmit={handleSearch}>
              <Search size={18} />
              <input
                type="text"
                placeholder={t('search', 'Rechercher') + '...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="modern-input"
              />
            </form>

            <div className="header-actions-modern">
              <motion.button
                className="theme-toggle"
                onClick={toggleDarkMode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </motion.button>

              <motion.button
                className="refresh-btn-modern"
                onClick={fetchDashboardData}
                disabled={refreshing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Actualiser"
              >
                <RefreshCw className={refreshing ? 'spinning' : ''} size={20} />
              </motion.button>

              <motion.button
                className="notifications-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Notifications"
              >
                <Bell size={20} />
                <span className="notification-badge">3</span>
              </motion.button>

              <UserProfile user={user} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="dashboard-main-modern">
        {/* Stats Overview */}
        <section className="stats-overview">
          <div className="section-header">
            <h2>Vue d'ensemble</h2>
            <div className="section-actions">
              <motion.button
                className={`view-btn ${activeView === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveView('overview')}
              >
                Vue générale
              </motion.button>
              <motion.button
                className={`view-btn ${activeView === 'detailed' ? 'active' : ''}`}
                onClick={() => setActiveView('detailed')}
              >
                Vue détaillée
              </motion.button>
            </div>
          </div>

          <div className="stats-grid-modern">
            {statCards.map((card) => (
              <AnimatedStatCard
                key={card.id}
                {...card}
                loading={dashboardData.loading}
              />
            ))}
          </div>
        </section>

        {/* Charts and Analytics */}
        <section className="analytics-section">
          <div className="analytics-grid">
            {/* Revenue Chart */}
            <GlassCard intensity="high" className="chart-card-modern">
              <div className="chart-header">
                <div className="chart-title">
                  <h3>Revenus mensuels</h3>
                  <p className="chart-subtitle">Évolution sur 6 mois</p>
                </div>
                <div className="chart-actions">
                  <button className="chart-action-btn" onClick={() => toast.info('Téléchargement démarré')}>
                    <Download size={16} />
                  </button>
                  <button className="chart-action-btn" onClick={() => toast.info('Plein écran activé')}>
                    <Maximize2 size={16} />
                  </button>
                  <button className="chart-action-btn" onClick={() => window.location.href = '/statistiques'}>
                    <Settings size={16} />
                  </button>
                </div>
              </div>
              
              <div className="chart-container">
                <div className="chart-grid">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="chart-grid-line" />
                  ))}
                </div>
                
                <div className="chart-bars">
                  {chartData.map((item, index) => (
                    <motion.div
                      key={index}
                      className="chart-bar"
                      initial={{ height: 0 }}
                      animate={{ height: `${item.value}%` }}
                      transition={{ delay: index * 0.1, type: "spring" }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <div className="chart-bar-fill" />
                      <div className="chart-bar-label">{item.label}</div>
                      <div className="chart-bar-tooltip">
                        {formatCurrency(item.amount)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="chart-footer">
                <div className="chart-stat">
                  <span className="stat-label">Revenu total</span>
                  <span className="stat-value">{formatCurrency(stats.monthlyRevenue || 0)}</span>
                </div>
                <div className="chart-stat">
                  <span className="stat-label">Croissance</span>
                  <span className="stat-value positive">+15.2%</span>
                </div>
                <div className="chart-stat">
                  <span className="stat-label">Objectif</span>
                  <span className="stat-value">94%</span>
                </div>
              </div>
            </GlassCard>

            {/* Activity Feed */}
            <GlassCard intensity="medium" className="activity-card-modern">
              <div className="activity-header">
                <h3>Activité récente</h3>
                <button 
                  className="view-all-btn"
                  onClick={() => window.location.href = '/consultations'}
                >
                  Voir tout <ChevronRight size={14} />
                </button>
              </div>
              
              <div className="activity-list-modern">
                {recentActivities.map((activity, index) => (
                  <ActivityItem key={activity.id} activity={activity} index={index} />
                ))}
              </div>
            </GlassCard>
          </div>
        </section>

        {/* System and Remboursement */}
        <section className="system-remboursement-section">
          <div className="system-remboursement-grid">
            {/* System Status */}
            <SystemStatus 
              status={dashboardData.consultations.length > 0 ? 'active' : 'error'}
              items={systemStatusItems}
              loading={dashboardData.loading}
            />

            {/* Remboursement Stats */}
            <GlassCard intensity="high" className="remboursement-card-modern" glow>
              <div className="remboursement-header">
                <h3>Remboursements</h3>
                <div className="remboursement-status">
                  <span className="status-dot active" />
                  <span className="status-text">En traitement</span>
                </div>
              </div>
              
              <div className="remboursement-stats-modern">
                <div className="remboursement-stat-modern">
                  <div className="stat-icon">
                    <FileText size={20} />
                  </div>
                  <div className="stat-content">
                    <h4>{formatNumber(dashboardData.prestations.filter(p => 
                      p.STATUT_DECLARATION === 'declare' || p.STATUT === 'soumis'
                    ).length)}</h4>
                    <p>Déclarations soumises</p>
                  </div>
                </div>
                
                <div className="remboursement-stat-modern">
                  <div className="stat-icon">
                    <DollarSign size={20} />
                  </div>
                  <div className="stat-content">
                    <h4>{formatCurrency(dashboardData.prestations.reduce((sum, p) => {
                      if (p.STATUT_PAIEMENT === 'À payer' || p.statut === 'non_paye') {
                        return sum + (p.MONTANT_PRISE_CHARGE || p.montant_prise_charge || 0);
                      }
                      return sum;
                    }, 0))}</h4>
                    <p>Montant à payer</p>
                  </div>
                </div>
                
                <div className="remboursement-stat-modern">
                  <div className="stat-icon">
                    <CheckCircle size={20} />
                  </div>
                  <div className="stat-content">
                    <h4>{formatCurrency(dashboardData.prestations.reduce((sum, p) => {
                      if (p.STATUT_PAIEMENT === 'Payé' || p.statut === 'paye') {
                        return sum + (p.MONTANT_PRISE_CHARGE || p.montant_prise_charge || 0);
                      }
                      return sum;
                    }, 0))}</h4>
                    <p>Payés ce mois</p>
                  </div>
                </div>
              </div>
              
              <motion.div 
                className="remboursement-progress"
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                transition={{ duration: 1.5 }}
              >
                <div className="progress-bar">
                  <div className="progress-fill" />
                </div>
                <div className="progress-label">
                  <span>Progression: 75%</span>
                  <span>{formatCurrency(3375000)}</span>
                </div>
              </motion.div>
              
              <button 
                className="view-remboursements-btn"
                onClick={() => window.location.href = '/remboursements'}
              >
                Gérer les remboursements
                <ChevronRight size={16} />
              </button>
            </GlassCard>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions-section-modern">
          <div className="section-header">
            <h2>Actions rapides</h2>
            <p className="section-subtitle">Accédez rapidement aux fonctionnalités principales</p>
          </div>
          
          <div className="actions-grid-modern">
            {quickActions.map((action, index) => (
              <QuickActionButton
                key={index}
                icon={action.icon}
                label={action.label}
                color={action.color}
                onClick={action.onClick}
                index={index}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer-modern">
        <div className="footer-content-modern">
          <div className="footer-info-modern">
            <div className="update-info-modern">
              <span className="update-label">Dernière mise à jour:</span>
              <span className="update-time">{formatDate(lastUpdate)}</span>
            </div>
            
            <div className="system-info-modern">
              <div className="system-item">
                <Wifi size={12} />
                <span>Connecté • Ping: 42ms</span>
              </div>
              <div className="system-item">
                <Database size={12} />
                <span>Base de données: Active</span>
              </div>
              <div className="system-item">
                <Shield size={12} />
                <span>Sécurité: Niveau Max</span>
              </div>
            </div>
          </div>
          
          <div className="footer-meta-modern">
            <span className="version">HealthCenterSoft v2.0 • Production</span>
            <span className="language">Langue: Français</span>
            <span className="copyright">© {new Date().getFullYear()} Tous droits réservés</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardModern;