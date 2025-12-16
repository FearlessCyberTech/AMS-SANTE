import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageService from '../services/LanguageService';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { userLanguage, changeLanguage, userCountry } = useAuth();
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [currentCountry, setCurrentCountry] = useState(null);

  useEffect(() => {
    // Get available languages
    const availableLanguages = LanguageService.getAvailableLanguages();
    setLanguages(availableLanguages);
    
    // Get current country info
    if (userCountry) {
      const countryInfo = LanguageService.getCountryInfo(userCountry);
      setCurrentCountry(countryInfo);
    }
  }, [userCountry]);

  const currentLanguage = languages.find(lang => lang.code === userLanguage);

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  // Get appropriate greeting based on language
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (i18n.language === 'fr-FR') {
      if (hour < 12) return 'Bonjour';
      if (hour < 18) return 'Bon après-midi';
      return 'Bonsoir';
    } else if (i18n.language === 'en-GB') {
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    } else if (i18n.language === 'es-ES') {
      if (hour < 12) return 'Buenos días';
      if (hour < 18) return 'Buenas tardes';
      return 'Buenas noches';
    }
    return 'Hello';
  };

  return (
    <div className="language-selector-container">
      {/* Current language display */}
      <motion.div 
        className="language-display"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="country-info">
          {currentCountry && (
            <div className="country-flag">
              {currentCountry.flag}
            </div>
          )}
          <div className="country-details">
            {currentCountry && (
              <span className="country-name">{currentCountry.name}</span>
            )}
            <div className="language-info">
              <Globe size={14} />
              <span className="language-name">{currentLanguage?.name}</span>
            </div>
          </div>
        </div>
        
        <motion.button
          className="language-toggle"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ backgroundColor: 'var(--hover-color)' }}
        >
          <ChevronDown size={16} className={isOpen ? 'rotated' : ''} />
        </motion.button>
      </motion.div>

      {/* Language dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="language-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="dropdown-header">
              <h4>{t('selectLanguage') || 'Sélectionner la langue'}</h4>
              <p className="dropdown-subtitle">{getGreeting()}</p>
            </div>
            
            <div className="languages-list">
              {languages.map((language) => (
                <motion.button
                  key={language.code}
                  className={`language-option ${userLanguage === language.code ? 'selected' : ''}`}
                  onClick={() => handleLanguageChange(language.code)}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="option-left">
                    <span className="option-flag">{language.flag}</span>
                    <span className="option-name">{language.name}</span>
                  </div>
                  {userLanguage === language.code && (
                    <div className="selected-indicator">
                      <div className="selected-dot"></div>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
            
            {currentCountry && (
              <div className="country-footer">
                <div className="footer-flag">{currentCountry.flag}</div>
                <div className="footer-text">
                  <span>{currentCountry.name}</span>
                  <small>{t('basedOnCountry') || 'Basé sur votre pays'}</small>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;