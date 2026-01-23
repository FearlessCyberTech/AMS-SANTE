import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, LogIn, Globe, AlertCircle, Chrome, Shield, Users, Activity, Languages } from 'lucide-react';
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

  // Pays d'Afrique Centrale selon la nouvelle base de données
  const countries = [
    { code: 'CMF', name: 'Cameroun-Francophone', language: 'fr', flag: '🇨🇲', capital: 'Yaoundé', sysLangue: 'fr-FR', langueDefaut: 'Français' },
    { code: 'CMA', name: 'Cameroun-Anglophone', language: 'en', flag: '🇨🇲', capital: 'Buea', sysLangue: 'en-GB', langueDefaut: 'Anglais' },
    { code: 'RCA', name: 'République Centrafricaine', language: 'fr', flag: '🇨🇫', capital: 'Bangui', sysLangue: 'fr-FR', langueDefaut: 'Français' },
    { code: 'TCD', name: 'Tchad', language: 'fr', flag: '🇹🇩', capital: 'N\'Djamena', sysLangue: 'fr-FR', langueDefaut: 'Français' },
    { code: 'GNQ', name: 'Guinée Équatoriale', language: 'es', flag: '🇬🇶', capital: 'Malabo', sysLangue: 'es-ES', langueDefaut: 'Espagnol' },
    { code: 'BDI', name: 'Burundi', language: 'en', flag: '🇧🇮', capital: 'Gitega', sysLangue: 'en-GB', langueDefaut: 'Anglais' },
    { code: 'COG', name: 'République du Congo', language: 'fr', flag: '🇨🇬', capital: 'Brazzaville', sysLangue: 'fr-FR', langueDefaut: 'Français' }
  ];

  // Mettre à jour la langue quand le pays change
  useEffect(() => {
    updateLanguage(formData.country);
  }, [formData.country]);

  // Effet pour charger les informations sauvegardées
  useEffect(() => {
    // Charger les informations sauvegardées si "Se souvenir de moi" était coché
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
        
        // Mettre à jour la langue selon le pays
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
      // Changez la langue globale via i18n
      i18n.changeLanguage(selectedCountry.sysLangue);
      
      // Mettre à jour l'attribut lang du document HTML
      document.documentElement.lang = selectedCountry.sysLangue;
      
      // Mettre à jour le titre de la page en fonction de la langue
      const pageTitles = {
        'fr-FR': 'Connexion - AMS SANTE',
        'en-GB': 'Login - AMS SANTE',
        'es-ES': 'Inicio de sesión - AMS SANTE'
      };
      document.title = pageTitles[selectedCountry.sysLangue] || 'AMS SANTE';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Effacer l'erreur générale
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
      // Appel de la fonction login avec username, password et country
      await login(formData.username, formData.password, formData.country);
      
      // Sauvegarder les identifiants
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
      
      // Redirection vers le dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      
      // Gérer l'erreur spécifique du paramètre 'id'
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
        <div className="spinner"></div>
        <p>{t('checkingSession') || 'Vérification de la session...'}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="login-form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* En-tête avec informations régionales */}
      <div className="login-header">
        <motion.div
          className="login-logo"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <div className="logo-circle">
            <Shield className="logo-icon" />
          </div>
          <div className="logo-text">
            <h1>{t('AMS SANTE')}</h1>
            <span className="logo-subtitle">{t('Insurance')}</span>
          </div>
        </motion.div>
        
        <AnimatePresence>
          {showWelcomeMessage && (
            <motion.div 
              className="welcome-message"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Activity size={16} />
              <span>{t('welcome')}</span>
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

      {/* Informations sur le pays sélectionné */}
      <div className="country-selection-info">
        <div className="country-flag">
          <span className="flag-emoji">{getSelectedCountry().flag}</span>
          <div className="country-details">
            <strong>{getSelectedCountry().name}</strong>
            <small>{t('capital')}: {getSelectedCountry().capital}</small>
            <div className="language-indicator">
              <Languages size={12} />
              <span>{getSelectedCountry().langueDefaut}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="country" className="form-label">
            <Globe className="label-icon" />
            {t('selectCountry')}
          </label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="form-select"
            disabled={isLoading}
          >
            {formatCountryList().map(country => (
              <option key={country.code} value={country.code}>
                {country.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="username" className="form-label">
            <Users className="label-icon" />
            {t('username')}
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`form-input ${errors.username ? 'error' : ''}`}
            placeholder={t('usernamePlaceholder')}
            disabled={isLoading}
            autoComplete="username"
          />
          <AnimatePresence>
            {errors.username && (
              <motion.span
                className="error-message"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AlertCircle className="error-icon" />
                {errors.username}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            {t('password')}
          </label>
          <div className="password-input-container">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder={t('passwordPlaceholder')}
              disabled={isLoading}
              autoComplete="current-password"
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
          <AnimatePresence>
            {errors.password && (
              <motion.span
                className="error-message"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AlertCircle className="error-icon" />
                {errors.password}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="form-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="checkbox-input"
              disabled={isLoading}
            />
            <span className="checkbox-custom"></span>
            {t('rememberMe')}
          </label>
          <button 
            type="button" 
            className="forgot-password" 
            disabled={isLoading}
            onClick={() => alert(t('forgotPasswordMessage'))}
          >
            {t('forgotPassword')}
          </button>
        </div>

        <AnimatePresence>
          {errors.submit && (
            <motion.div
              className="submit-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertCircle className="error-icon" />
              {errors.submit}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          className="login-button"
          disabled={isLoading}
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
        >
          {isLoading ? (
            <div className="loading-spinner"></div>
          ) : (
            <LogIn className="button-icon" />
          )}
          {isLoading ? t('loggingIn') : t('login')}
        </motion.button>
      </form>

      <div className="login-footer">
        <div className="region-info">
          <Globe className="region-icon" />
          <div className="region-text">
            <strong>{t('systemDescription')}</strong>
            <small>{t('supportedCountries')}: {countries.map(c => c.name).join(', ')}</small>
          </div>
        </div>
        
        <div className="browser-recommendation">
          <Chrome className="browser-icon" />
          <span>{t('browserRecommendation')}</span>
        </div>

        <div className="security-notice">
          <Shield size={14} />
          <span>{t('securityNotice')}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginForm;