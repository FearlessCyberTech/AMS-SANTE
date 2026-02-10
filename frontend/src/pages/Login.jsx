import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fingerprint, Shield, Activity, HeartPulse, Globe2, Users,
  Eye, EyeOff, LogIn, Lock, CheckCircle, AlertCircle,
  Sparkles, Cpu, Database, Zap, Target, MapPin,
  Clock, ShieldCheck, Scan, Key, Smartphone, Cloud,
  Award, Bell, Battery, Wifi, Settings,
  ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Login.css';

// Import du logo SaniCare
import SaniCareLogo from '../assets/SaniCareOnlyLogo.png';

const LoginForm = () => {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [formData, setFormData] = useState({
    country: 'CMF',
    username: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeSecurityLayer, setActiveSecurityLayer] = useState(0);
  const [biometricScan, setBiometricScan] = useState(false);
  const [connectionStrength, setConnectionStrength] = useState(100);
  const [activeGlobe, setActiveGlobe] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(87);
  const [systemStatus, setSystemStatus] = useState('optimal');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const canvasRef = useRef(null);
  const countryDropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const particlesRef = useRef([]);
  
  // Pays d'Internationale selon la nouvelle base de données
  const countries = [
    { code: 'CMF', name: 'Cameroun-Francophone', language: 'fr', flag: '🇨🇲', capital: 'Yaoundé', sysLangue: 'fr-FR', langueDefaut: 'Français' },
    { code: 'CMA', name: 'Cameroun-Anglophone', language: 'en', flag: '🇨🇲', capital: 'Buea', sysLangue: 'en-GB', langueDefaut: 'Anglais' },
    { code: 'RCA', name: 'République Centrafricaine', language: 'fr', flag: '🇨🇫', capital: 'Bangui', sysLangue: 'fr-FR', langueDefaut: 'Français' },
    { code: 'TCD', name: 'Tchad', language: 'fr', flag: '🇹🇩', capital: 'N\'Djamena', sysLangue: 'fr-FR', langueDefaut: 'Français' },
    { code: 'GNQ', name: 'Guinée Équatoriale', language: 'es', flag: '🇬🇶', capital: 'Malabo', sysLangue: 'es-ES', langueDefaut: 'Espagnol' },
    { code: 'BDI', name: 'Burundi', language: 'en', flag: '🇧🇮', capital: 'Gitega', sysLangue: 'en-GB', langueDefaut: 'Anglais' },
    { code: 'COG', name: 'République du Congo', language: 'fr', flag: '🇨🇬', capital: 'Brazzaville', sysLangue: 'fr-FR', langueDefaut: 'Français' }
  ];

  const securityLayers = [
    { icon: Shield, label: t('layer1', 'Chiffrement 256-bit'), desc: t('layer1Desc', 'Protection militaire') },
    { icon: Fingerprint, label: t('layer2', 'Biométrie Digitale'), desc: t('layer2Desc', 'Authentification unique') },
    { icon: Activity, label: t('layer3', 'Surveillance Active'), desc: t('layer3Desc', 'Détection d\'intrusion') },
    { icon: Cloud, label: t('layer4', 'Synchronisation Cloud'), desc: t('layer4Desc', 'Données sécurisées') }
  ];

  // Filtrer les pays selon la recherche
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.capital.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.langueDefaut.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus sur le champ de recherche quand le dropdown s'ouvre
  useEffect(() => {
    if (isCountryDropdownOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [isCountryDropdownOpen]);

  // Système de particules avancé avec Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.color = `rgba(0, 150, 255, ${Math.random() * 0.3 + 0.1})`;
        this.pulse = Math.random() * Math.PI * 2;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulse += 0.05;
        
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }
      
      draw() {
        const pulseSize = this.size * (1 + 0.3 * Math.sin(this.pulse));
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < 100; i++) {
        particlesRef.current.push(new Particle());
      }
    };
    
    const drawConnections = () => {
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const dx = particlesRef.current[i].x - particlesRef.current[j].x;
          const dy = particlesRef.current[i].y - particlesRef.current[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            ctx.beginPath();
            const alpha = 0.1 * (1 - distance/150);
            ctx.strokeStyle = `rgba(0, 150, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y);
            ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y);
            ctx.stroke();
          }
        }
      }
    };
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Dessiner les particules
      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      // Dessiner les connexions
      drawConnections();
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    resizeCanvas();
    initParticles();
    animate();
    
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Animation des couches de sécurité
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSecurityLayer((prev) => (prev + 1) % securityLayers.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [securityLayers.length]);

  // Animation du globe
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGlobe((prev) => (prev + 1) % countries.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [countries.length]);

  // Simulation de scan biométrique
  useEffect(() => {
    if (biometricScan) {
      const interval = setInterval(() => {
        setConnectionStrength(prev => {
          if (prev >= 100) return 100;
          return prev + 10;
        });
      }, 100);
      
      setTimeout(() => {
        setBiometricScan(false);
        setConnectionStrength(100);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [biometricScan]);

  // Simulation de niveau de batterie
  useEffect(() => {
    const interval = setInterval(() => {
      setBatteryLevel(prev => {
        if (prev <= 5) return 100;
        return prev - 0.1;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mettre à jour la langue quand le pays change
  useEffect(() => {
    updateLanguage(formData.country);
  }, [formData.country]);

  // Effet pour charger les informations sauvegardées
  useEffect(() => {
    const savedCredentials = localStorage.getItem('sanicare_credentials');
    if (savedCredentials) {
      try {
        const { username, password, country, rememberMe } = JSON.parse(savedCredentials);
        setFormData(prev => ({
          ...prev,
          username: rememberMe ? username : '',
          password: rememberMe ? password : '',
          country: country || 'CMF',
          rememberMe
        }));
        updateLanguage(country || 'CMF');
      } catch (error) {
        console.error('Erreur lors du chargement des identifiants:', error);
      }
    }
  }, []);

  // Rediriger si l'utilisateur est déjà connecté
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const updateLanguage = (countryCode) => {
    const selectedCountry = countries.find(c => c.code === countryCode);
    if (selectedCountry && selectedCountry.sysLangue) {
      i18n.changeLanguage(selectedCountry.sysLangue);
      document.documentElement.lang = selectedCountry.sysLangue;
      
      const pageTitles = {
        'fr-FR': 'SaniCare - Connexion Sécurisée',
        'en-GB': 'SaniCare - Secure Login',
        'es-ES': 'SaniCare - Inicio de Sesión Seguro'
      };
      document.title = pageTitles[selectedCountry.sysLangue] || 'SaniCare Assurance';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: '' }));
    }
  };

  const selectCountry = (countryCode) => {
    setFormData(prev => ({
      ...prev,
      country: countryCode
    }));
    setIsCountryDropdownOpen(false);
    setSearchQuery('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = t('usernameRequired', 'Identifiant requis');
    }
    
    if (!formData.password) {
      newErrors.password = t('passwordRequired', 'Mot de passe requis');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setBiometricScan(true);
    setSystemStatus('scanning');
    setErrors({});

    try {
      await login(formData.username, formData.password, formData.country);
      
      if (formData.rememberMe) {
        localStorage.setItem('sanicare_credentials', JSON.stringify({
          username: formData.username,
          password: formData.password,
          country: formData.country,
          rememberMe: true
        }));
      } else {
        localStorage.removeItem('sanicare_credentials');
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ 
        submit: error.message || t('loginError', 'Erreur de connexion')
      });
      setBiometricScan(false);
      setSystemStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedCountry = () => {
    return countries.find(c => c.code === formData.country) || countries[0];
  };

  // Si l'utilisateur est en train de se charger, afficher un loader
  if (authLoading) {
    return (
      <div className="sanicare-loading-screen">
        <div className="logo-loading-container">
          <motion.div
            className="logo-loading"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <img src={SaniCareLogo} alt="SaniCare" className="loading-logo" />
          </motion.div>
          <div className="loading-rings">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
          </div>
        </div>
        <div className="loading-status-container">
          <div className="loading-progress-bar">
            <motion.div 
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <p className="loading-message">Initialisation du système SaniCare...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sanicare-login-container">
      {/* Canvas pour fond animé */}
      <canvas ref={canvasRef} className="network-canvas" />
      
      {/* Effets de lumière */}
      <div className="light-orbs">
        <div className="light-orb orb-1"></div>
        <div className="light-orb orb-2"></div>
        <div className="light-orb orb-3"></div>
      </div>
      
      {/* Barre de status système */}
      <div className="system-status-bar">
        <div className="status-left">
          <div className="status-item">
            <Wifi className="status-icon" size={14} />
            <span>SaniCare Secure Network</span>
          </div>
          <div className="status-item">
            <div className="battery-indicator">
              <Battery className="battery-icon" size={14} />
              <div className="battery-level">
                <div className="battery-fill" style={{ width: `${batteryLevel}%` }}></div>
              </div>
              <span className="battery-percent">{Math.round(batteryLevel)}%</span>
            </div>
          </div>
        </div>
        <div className="status-center">
          <div className={`system-status ${systemStatus}`}>
            <div className="status-dot"></div>
            <span>Système {systemStatus === 'optimal' ? 'Optimal' : systemStatus === 'scanning' ? 'En Scan' : 'Erreur'}</span>
          </div>
        </div>
        <div className="status-right">
          <Clock className="status-icon" size={14} />
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Globe interactif avec pays */}
      <div className="globe-visualization">
        {countries.map((country, index) => (
          <motion.div
            key={country.code}
            className={`globe-point ${index === activeGlobe ? 'active' : ''} ${formData.country === country.code ? 'selected' : ''}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: index === activeGlobe ? 1 : 0.3,
              scale: formData.country === country.code ? 1.2 : (index === activeGlobe ? 1.1 : 0.8)
            }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="point-glow"></div>
            <span className="point-flag">{country.flag}</span>
            <div className="point-tooltip">
              <span className="tooltip-name">{country.name}</span>
              <span className="tooltip-capital">{country.capital}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="login-main-grid">
        {/* Panneau gauche - Branding & Sécurité avec Logo */}
        <motion.div 
          className="branding-panel"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Logo SaniCare - Version Premium */}
          <div className="sanicare-logo-container">
            <motion.div 
              className="logo-orb"
              animate={{ 
                rotate: 360,
              }}
              transition={{ 
                rotate: { duration: 40, repeat: Infinity, ease: "linear" }
              }}
            >
              <div className="logo-glow-effect"></div>
              <img src={SaniCareLogo} alt="SaniCare" className="sanicare-logo" />
              <div className="logo-rings">
                <div className="logo-ring ring-1"></div>
                <div className="logo-ring ring-2"></div>
                <div className="logo-ring ring-3"></div>
              </div>
            </motion.div>
            <div className="logo-text-content">
              <h1 className="sanicare-title">
                Sani<span className="care-text">Care</span>
              </h1>
              <p className="sanicare-subtitle">Assurance Santé Intelligente</p>
              <div className="logo-badges">
                <div className="badge premium">
                  <Award size={12} />
                  <span>Premium</span>
                </div>
                <div className="badge secure">
                  <Shield size={12} />
                  <span>Sécurisé</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques en temps réel */}
          <div className="realtime-stats">
            <div className="stats-header">
              <Activity className="stats-icon" />
              <h3>Statistiques en Direct</h3>
              <div className="live-indicator">
                <div className="live-pulse"></div>
                <span>LIVE</span>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper">
                  <Users className="stat-icon" />
                </div>
                <div className="stat-info">
                  <span className="stat-value">24.8K</span>
                  <span className="stat-label">Assurés Actifs</span>
                </div>
                <div className="stat-trend positive">
                  <span>+2.4%</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon-wrapper">
                  <HeartPulse className="stat-icon" />
                </div>
                <div className="stat-info">
                  <span className="stat-value">98.7%</span>
                  <span className="stat-label">Satisfaction</span>
                </div>
                <div className="stat-trend positive">
                  <span>+0.8%</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon-wrapper">
                  <Clock className="stat-icon" />
                </div>
                <div className="stat-info">
                  <span className="stat-value">24/7</span>
                  <span className="stat-label">Assistance</span>
                </div>
                <div className="stat-trend neutral">
                  <span>100% uptime</span>
                </div>
              </div>
            </div>
          </div>

          {/* Indicateur de sécurité multi-couches */}
          <div className="security-indicator">
            <div className="security-header">
              <ShieldCheck className="security-icon" />
              <h3>Système de Sécurité Multi-couches</h3>
            </div>
            
            <div className="security-layers-visual">
              {securityLayers.map((layer, index) => (
                <motion.div
                  key={index}
                  className={`security-layer ${index === activeSecurityLayer ? 'active' : ''}`}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="layer-visual">
                    <div className="layer-circle">
                      <layer.icon className="layer-icon" />
                    </div>
                    <div className="layer-wave"></div>
                  </div>
                  <div className="layer-info">
                    <h4>{layer.label}</h4>
                    <p>{layer.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Panneau droit - Formulaire avec Interface Médicale */}
        <motion.div 
          className="login-panel"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Header avec identité visuelle */}
          <div className="panel-header">
            <div className="header-branding">
              <div className="mini-logo">
                <img src={SaniCareLogo} alt="SaniCare" />
              </div>
              <div className="header-title">
                <h2>Portail Professionnel</h2>
                <p>Accès sécurisé aux services d'assurance</p>
              </div>
            </div>
            
            <div className="header-actions">
              <button className="action-btn">
                <Settings size={18} />
              </button>
              <button className="action-btn">
                <Bell size={18} />
                <span className="notification-badge">3</span>
              </button>
            </div>
          </div>

          {/* Indicateur de connexion */}
          <div className="connection-indicator">
            <div className="connection-status">
              <div className="status-visual">
                <div className="status-dots">
                  <div className="dot dot-1"></div>
                  <div className="dot dot-2"></div>
                  <div className="dot dot-3"></div>
                </div>
                <Zap className="zap-icon" />
              </div>
              <div className="status-info">
                <div className="connection-strength">
                  <span>Force de connexion</span>
                  <div className="strength-meter">
                    <motion.div 
                      className="strength-fill"
                      style={{ width: `${connectionStrength}%` }}
                      animate={biometricScan ? {
                        background: ['#00ff9d', '#00f3ff', '#00ff9d']
                      } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </div>
                  <span className="strength-value">{connectionStrength}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sélecteur de région médicale (Liste déroulante) */}
          <div className="region-selector-dropdown" ref={countryDropdownRef}>
            <div className="dropdown-header">
              <div className="header-left">
                <Target className="selector-icon" />
                <div>
                  <h4>Région d'Assurance</h4>
                  <p>Sélectionnez votre zone de couverture</p>
                </div>
              </div>
            </div>
            
            {/* Bouton pour ouvrir le dropdown */}
            <motion.button
              className={`country-dropdown-button ${isCountryDropdownOpen ? 'open' : ''}`}
              onClick={() => {
                setIsCountryDropdownOpen(!isCountryDropdownOpen);
                if (!isCountryDropdownOpen) setSearchQuery('');
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="selected-country-display">
                <span className="selected-flag">{getSelectedCountry().flag}</span>
                <div className="selected-country-info">
                  <span className="country-name">{getSelectedCountry().name}</span>
                  <div className="country-details">
                    <span className="country-capital">{getSelectedCountry().capital}</span>
                    <span className="country-language">{getSelectedCountry().langueDefaut}</span>
                  </div>
                </div>
              </div>
              <div className="dropdown-arrow">
                {isCountryDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </motion.button>

            {/* Dropdown avec liste des pays */}
            <AnimatePresence>
              {isCountryDropdownOpen && (
                <motion.div 
                  className="country-dropdown-menu"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Barre de recherche */}
                  <div className="dropdown-search">
                    <Search className="search-icon" size={16} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                      placeholder="Rechercher un pays..."
                    />
                    {searchQuery && (
                      <button 
                        className="clear-search"
                        onClick={() => setSearchQuery('')}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Liste des pays */}
                  <div className="countries-list">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map(country => (
                        <motion.button
                          key={country.code}
                          className={`country-option ${formData.country === country.code ? 'selected' : ''}`}
                          onClick={() => selectCountry(country.code)}
                          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="option-flag">{country.flag}</div>
                          <div className="option-info">
                            <span className="option-name">{country.name}</span>
                            <div className="option-details">
                              <span className="option-capital">
                                <MapPin size={10} /> {country.capital}
                              </span>
                              <span className="option-language">
                                <Globe2 size={10} /> {country.langueDefaut}
                              </span>
                            </div>
                          </div>
                          {formData.country === country.code && (
                            <motion.div 
                              className="option-check"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <CheckCircle size={16} />
                            </motion.div>
                          )}
                        </motion.button>
                      ))
                    ) : (
                      <div className="no-results">
                        <span>Aucun pays trouvé pour "{searchQuery}"</span>
                      </div>
                    )}
                  </div>

                  {/* Nombre de résultats */}
                  <div className="results-count">
                    <span>
                      {filteredCountries.length} pays{filteredCountries.length !== 1 ? 's' : ''} trouvé{filteredCountries.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Formulaire d'authentification */}
          <form onSubmit={handleSubmit} className="sanicare-auth-form">
            <div className="form-header">
              <Fingerprint className="auth-icon" />
              <div>
                <h3>Authentification SaniCare</h3>
                <p>Entrez vos identifiants sécurisés</p>
              </div>
            </div>

            {/* Champ identifiant */}
            <div className="input-group">
              <div className="input-label">
                <Users className="label-icon" />
                <label htmlFor="username">Identifiant Professionnel</label>
              </div>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`auth-input ${errors.username ? 'error' : ''}`}
                  placeholder="Votre identifiant SaniCare"
                  disabled={isLoading}
                />
                {formData.username && !errors.username && (
                  <motion.div 
                    className="input-valid"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <CheckCircle size={16} />
                  </motion.div>
                )}
              </div>
              {errors.username && (
                <motion.div 
                  className="input-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle size={14} />
                  <span>{errors.username}</span>
                </motion.div>
              )}
            </div>

            {/* Champ mot de passe */}
            <div className="input-group">
              <div className="input-label">
                <Lock className="label-icon" />
                <label htmlFor="password">Code d'Accès</label>
              </div>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`auth-input ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <motion.div 
                  className="input-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle size={14} />
                  <span>{errors.password}</span>
                </motion.div>
              )}
            </div>

            {/* Options et sécurité */}
            <div className="form-options">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="checkbox-input"
                  disabled={isLoading}
                />
                <div className="checkbox-custom">
                  {formData.rememberMe && (
                    <motion.div
                      className="checkbox-check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      ✓
                    </motion.div>
                  )}
                </div>
                <span>Maintenir la session active</span>
              </label>
              
              <motion.button
                type="button"
                className="security-help"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => alert('Assistance sécurité disponible 24/7')}
              >
                <Shield size={14} />
                <span>Aide Sécurité</span>
              </motion.button>
            </div>

            {/* Messages d'erreur */}
            <AnimatePresence>
              {errors.submit && (
                <motion.div
                  className="error-alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="alert-content">
                    <AlertCircle className="alert-icon" />
                    <div>
                      <strong>Vérification requise</strong>
                      <p>{errors.submit}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton de connexion biométrique */}
            <motion.button
              type="submit"
              className="auth-button"
              disabled={isLoading}
              whileHover={isLoading ? {} : { scale: 1.02 }}
              whileTap={isLoading ? {} : { scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <div className="scan-animation">
                    <div className="scan-line"></div>
                    <Scan className="scan-icon" />
                  </div>
                  <span>Analyse biométrique en cours...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="button-icon" />
                  <span>Connexion Biométrique</span>
                  <Sparkles className="sparkle-icon" />
                </>
              )}
            </motion.button>

            {/* Technologies et certifications */}
            <div className="tech-certifications">
              <div className="cert-badge">
                <ShieldCheck size={14} />
                <span>HIPAA Compliant</span>
              </div>
              <div className="cert-badge">
                <Database size={14} />
                <span>GDPR Ready</span>
              </div>
              <div className="cert-badge">
                <Cpu size={14} />
                <span>ISO 27001</span>
              </div>
            </div>
          </form>

          {/* Footer avec informations */}
          <div className="panel-footer">
            <div className="footer-grid">
              <div className="footer-item">
                <div className="item-icon">
                  <Smartphone />
                </div>
                <div className="item-content">
                  <strong>App Mobile</strong>
                  <small>Télécharger notre application</small>
                </div>
              </div>
              
              <div className="footer-item">
                <div className="item-icon">
                  <Clock />
                </div>
                <div className="item-content">
                  <strong>24/7 Support</strong>
                  <small>Assistance médicale continue</small>
                </div>
              </div>
              
              <div className="footer-item">
                <div className="item-icon">
                  <Cloud />
                </div>
                <div className="item-content">
                  <strong>Cloud Secure</strong>
                  <small>Données chiffrées</small>
                </div>
              </div>
            </div>
            
            <div className="footer-copyright">
              <div className="copyright-logo">
                <img src={SaniCareLogo} alt="SaniCare" className="footer-logo" />
                <span>SaniCare Assurance</span>
              </div>
              <div className="copyright-text">
                <span>© 2024 SaniCare v4.0 • Tous droits réservés</span>
                <span className="secure-tag">Système certifié de sécurité médicale</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginForm;