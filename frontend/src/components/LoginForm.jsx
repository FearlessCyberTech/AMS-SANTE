import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, EyeOff, LogIn, Globe, AlertCircle, Chrome, 
  Shield, Users, Activity, Languages, Cpu, Lock,
  Heart, MapPin, Clock, Database, Sparkles, Target,
  ChevronDown, CheckCircle, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './LoginForm.css';

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
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [activeFeature, setActiveFeature] = useState(0);
  const [particles, setParticles] = useState([]);

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

  const features = [
    { icon: Heart, label: t('feature1', 'Système de Santé Intelligent'), desc: t('feature1Desc', 'Gestion médicale avancée') },
    { icon: Database, label: t('feature2', 'Base de Données Régionale'), desc: t('feature2Desc', 'Données synchronisées') },
    { icon: Cpu, label: t('feature3', 'Performance Optimisée'), desc: t('feature3Desc', 'Temps de réponse rapide') },
    { icon: Shield, label: t('feature4', 'Sécurité Maximale'), desc: t('feature4Desc', 'Chiffrement AES-256') }
  ];

  // Générer des particules pour le fond animé
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        speed: Math.random() * 2 + 0.5,
        delay: Math.random() * 5
      });
    }
    setParticles(newParticles);
  }, []);

  // Animation des fonctionnalités
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  // Mettre à jour la langue quand le pays change
  useEffect(() => {
    updateLanguage(formData.country);
  }, [formData.country]);

  // Effet pour charger les informations sauvegardées
  useEffect(() => {
    const savedCredentials = localStorage.getItem('healthcenter_credentials');
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
        'fr-FR': 'Connexion - HealthCenterSoft',
        'en-GB': 'Login - HealthCenterSoft',
        'es-ES': 'Inicio de sesión - HealthCenterSoft'
      };
      document.title = pageTitles[selectedCountry.sysLangue] || 'HealthCenterSoft';
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = t('usernameRequired');
    }
    
    if (!formData.password) {
      newErrors.password = t('passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await login(formData.username, formData.password, formData.country);
      
      if (formData.rememberMe) {
        localStorage.setItem('healthcenter_credentials', JSON.stringify({
          username: formData.username,
          password: formData.password,
          country: formData.country,
          rememberMe: true
        }));
      } else {
        localStorage.removeItem('healthcenter_credentials');
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.message && error.message.includes("parameter 'id'")) {
        setErrors({ 
          submit: t('loginError') + ' : Erreur de validation du serveur. Veuillez réessayer.'
        });
      } else {
        setErrors({ 
          submit: error.message || t('loginError')
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedCountry = () => {
    return countries.find(c => c.code === formData.country) || countries[0];
  };

  const formatCountryList = () => {
    return countries.map(country => ({
      ...country,
      displayName: `${country.flag} ${country.name}`
    }));
  };

  // Si l'utilisateur est en train de se charger, afficher un loader
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner-container">
          <div className="spinner-ring"></div>
          <div className="spinner-core"></div>
          <Heart className="spinner-icon" />
        </div>
        <p>{t('checkingSession') || 'Initialisation du système...'}</p>
      </div>
    );
  }

  return (
    <div className="login-page-wrapper">
      {/* Fond animé */}
      <div className="animated-background">
        {/* Particules */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: particle.speed * 3,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}

        {/* Cercles flous animés */}
        <motion.div 
          className="blob blob-1"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="blob blob-2"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="blob blob-3"
          animate={{
            x: [0, 120, 0],
            y: [0, 40, 0],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Contenu principal */}
      <div className="login-main-container">
        {/* Côté gauche - Présentation */}
        <div className="login-sidebar">
          <motion.div 
            className="sidebar-content"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="sidebar-header">
              <motion.div 
                className="logo-wrapper"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="logo-glow">
                  <Shield className="logo-main-icon" />
                </div>
                <div className="logo-text-wrapper">
                  <h1 className="system-name">
                    HealthCenter<span className="gradient-text">Soft</span>
                  </h1>
                  <div className="system-badge">
                    <span className="badge-version">v2.0</span>
                    <span className="badge-region">{t('centralAfrica')}</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.p 
                className="system-tagline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {t('systemDescription') || 'Système de Gestion Médicale Intelligent'}
              </motion.p>
            </div>

            {/* Carrousel de fonctionnalités */}
            <div className="features-carousel">
              <AnimatePresence mode="wait">
                {features.map((feature, index) => (
                  index === activeFeature && (
                    <motion.div
                      key={index}
                      className="feature-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="feature-icon-wrapper">
                        <feature.icon className="feature-icon" />
                      </div>
                      <div className="feature-content">
                        <h3 className="feature-title">{feature.label}</h3>
                        <p className="feature-desc">{feature.desc}</p>
                      </div>
                      <motion.div 
                        className="feature-progress"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3, ease: "linear" }}
                      />
                    </motion.div>
                  )
                ))}
              </AnimatePresence>

              {/* Indicateurs de fonctionnalités */}
              <div className="feature-indicators">
                {features.map((_, index) => (
                  <button
                    key={index}
                    className={`indicator ${index === activeFeature ? 'active' : ''}`}
                    onClick={() => setActiveFeature(index)}
                  >
                    <div className="indicator-dot" />
                  </button>
                ))}
              </div>
            </div>

            {/* Statistiques système */}
            <div className="system-stats">
              <div className="stat-item">
                <div className="stat-icon">
                  <Users className="stat-icon-svg" />
                </div>
                <div className="stat-content">
                  <span className="stat-value">24K+</span>
                  <span className="stat-label">{t('patients') || 'Patients'}</span>
                </div>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <div className="stat-icon">
                  <Heart className="stat-icon-svg" />
                </div>
                <div className="stat-content">
                  <span className="stat-value">850+</span>
                  <span className="stat-label">{t('doctors') || 'Médecins'}</span>
                </div>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <div className="stat-icon">
                  <Database className="stat-icon-svg" />
                </div>
                <div className="stat-content">
                  <span className="stat-value">99.9%</span>
                  <span className="stat-label">{t('uptime') || 'Disponibilité'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Côté droit - Formulaire */}
        <motion.div 
          className="login-form-container"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* En-tête du formulaire */}
          <div className="form-header">
            <motion.div
              className="form-title-wrapper"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Lock className="form-title-icon" />
              <h2 className="form-title">{t('secureAccess') || 'Accès Sécurisé'}</h2>
            </motion.div>
            
            <AnimatePresence>
              {showWelcomeMessage && (
                <motion.div 
                  className="welcome-banner"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="welcome-content">
                    <Sparkles className="welcome-icon" />
                    <span className="welcome-text">
                      {t('welcomeBack') || 'Bienvenue sur HealthCenterSoft'}
                    </span>
                  </div>
                  <button 
                    className="close-welcome"
                    onClick={() => setShowWelcomeMessage(false)}
                  >
                    ×
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sélection de pays */}
          <div className="country-card">
            <div className="country-card-header">
              <Globe className="country-header-icon" />
              <span className="country-header-label">
                {t('selectedCountry') || 'Pays sélectionné'}
              </span>
            </div>
            <div className="country-card-content">
              <div className="country-flag-large">
                <span className="flag-emoji">{getSelectedCountry().flag}</span>
                <div className="country-info">
                  <h3 className="country-name">{getSelectedCountry().name}</h3>
                  <div className="country-details">
                    <div className="country-detail">
                      <MapPin className="detail-icon" size={12} />
                      <span>{getSelectedCountry().capital}</span>
                    </div>
                    <div className="country-detail">
                      <Languages className="detail-icon" size={12} />
                      <span>{getSelectedCountry().langueDefaut}</span>
                    </div>
                  </div>
                </div>
              </div>
              <ChevronDown className="country-dropdown-arrow" />
            </div>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="country-select-hidden"
              disabled={isLoading}
            >
              {formatCountryList().map(country => (
                <option key={country.code} value={country.code}>
                  {country.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Formulaire de connexion */}
          <form onSubmit={handleSubmit} className="modern-form">
            {/* Champ nom d'utilisateur */}
            <div className="input-group floating-label">
              <div className="input-icon">
                <Users className="input-icon-svg" />
              </div>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`form-input-modern ${errors.username ? 'error' : ''}`}
                placeholder=" "
                disabled={isLoading}
                autoComplete="username"
              />
              <label htmlFor="username" className="floating-label-text">
                {t('username') || 'Nom d\'utilisateur'}
              </label>
              {formData.username && (
                <motion.div
                  className="input-check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <CheckCircle size={16} />
                </motion.div>
              )}
            </div>
            {errors.username && (
              <motion.div
                className="error-bubble"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="error-bubble-icon" />
                <span>{errors.username}</span>
              </motion.div>
            )}

            {/* Champ mot de passe */}
            <div className="input-group floating-label">
              <div className="input-icon">
                <Lock className="input-icon-svg" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input-modern ${errors.password ? 'error' : ''}`}
                placeholder=" "
                disabled={isLoading}
                autoComplete="current-password"
              />
              <label htmlFor="password" className="floating-label-text">
                {t('password') || 'Mot de passe'}
              </label>
              <button
                type="button"
                className="password-toggle-modern"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="toggle-icon" />
                ) : (
                  <Eye className="toggle-icon" />
                )}
              </button>
            </div>
            {errors.password && (
              <motion.div
                className="error-bubble"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="error-bubble-icon" />
                <span>{errors.password}</span>
              </motion.div>
            )}

            {/* Options */}
            <div className="form-options-modern">
              <label className="checkbox-modern">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="checkbox-modern-input"
                  disabled={isLoading}
                />
                <span className="checkbox-modern-custom">
                  {formData.rememberMe && (
                    <motion.div
                      className="checkbox-check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      ✓
                    </motion.div>
                  )}
                </span>
                <span className="checkbox-modern-label">
                  {t('rememberMe') || 'Se souvenir de moi'}
                </span>
              </label>
              
              <motion.button
                type="button"
                className="forgot-password-modern"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => alert(t('forgotPasswordMessage'))}
              >
                {t('forgotPassword') || 'Mot de passe oublié ?'}
              </motion.button>
            </div>

            {/* Message d'erreur général */}
            <AnimatePresence>
              {errors.submit && (
                <motion.div
                  className="global-error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <AlertTriangle className="global-error-icon" />
                  <div className="global-error-content">
                    <strong>{t('error') || 'Erreur'}</strong>
                    <p>{errors.submit}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton de connexion */}
            <motion.button
              type="submit"
              className="login-button-modern"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner-modern"></div>
                  <span>{t('connecting') || 'Connexion en cours...'}</span>
                </>
              ) : (
                <>
                  <LogIn className="login-button-icon" />
                  <span>{t('login') || 'Se connecter'}</span>
                </>
              )}
            </motion.button>

            {/* Message de sécurité */}
            <div className="security-footer">
              <Shield className="security-icon" />
              <span className="security-text">
                {t('secureConnection') || 'Connexion sécurisée par HTTPS'}
              </span>
            </div>
          </form>

          {/* Pied de page du formulaire */}
          <div className="form-footer">
            <div className="tech-badges">
              <div className="tech-badge">
                <Cpu className="tech-badge-icon" />
                <span>Node.js</span>
              </div>
              <div className="tech-badge">
                <Database className="tech-badge-icon" />
                <span>SQL Server</span>
              </div>
              <div className="tech-badge">
                <Shield className="tech-badge-icon" />
                <span>AES-256</span>
              </div>
            </div>
            
            <div className="region-info-modern">
              <div className="region-icon-modern">
                <Target className="region-icon-svg" />
              </div>
              <div className="region-text-modern">
                <strong>{t('centralAfrica') || 'Internationale'}</strong>
                <small>{t('sevenCountries') || '7 pays supportés'}</small>
              </div>
            </div>

            <div className="copyright">
              <span>© 2024 HealthCenterSoft v2.0</span>
              <span className="copyright-separator">•</span>
              <span>{t('medicalSystem') || 'Système Médical Professionnel'}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginForm;