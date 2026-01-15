// src/services/LanguageService.js
import i18n from '../services/i18n';

const LanguageService = {
  changeLanguage: (languageCode) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('language', languageCode);
    document.documentElement.lang = languageCode;
  },

  getLanguageForCountry: (countryCode) => {
    const countryLanguageMap = {
      'CMF': 'fr-FR', // Cameroun Francophone
      'CMA': 'en-GB', // Cameroun Anglophone
      'RCA': 'fr-FR', // République Centrafricaine
      'TCD': 'fr-FR', // Tchad
      'GNQ': 'es-ES', // Guinée Équatoriale
      'BDI': 'en-GB', // Burundi
      'COG': 'fr-FR'  // République du Congo
    };
    return countryLanguageMap[countryCode] || 'fr-FR';
  },

  getCountryInfo: (countryCode) => {
    const countries = {
      'CMF': { code: 'CMF', name: 'Cameroun Francophone', flag: '🇨🇲', language: 'fr-FR', capital: 'Yaoundé' },
      'CMA': { code: 'CMA', name: 'Cameroun Anglophone', flag: '🇨🇲', language: 'en-GB', capital: 'Buea' },
      'RCA': { code: 'RCA', name: 'République Centrafricaine', flag: '🇨🇫', language: 'fr-FR', capital: 'Bangui' },
      'TCD': { code: 'TCD', name: 'Tchad', flag: '🇹🇩', language: 'fr-FR', capital: 'N\'Djamena' },
      'GNQ': { code: 'GNQ', name: 'Guinée Équatoriale', flag: '🇬🇶', language: 'es-ES', capital: 'Malabo' },
      'BDI': { code: 'BDI', name: 'Burundi', flag: '🇧🇮', language: 'en-GB', capital: 'Gitega' },
      'COG': { code: 'COG', name: 'République du Congo', flag: '🇨🇬', language: 'fr-FR', capital: 'Brazzaville' }
    };
    return countries[countryCode] || { code: countryCode, name: countryCode, flag: '🏳️', language: 'fr-FR', capital: '' };
  },

  getCurrentLanguage: () => {
    return i18n.language;
  },

  getAvailableLanguages: () => {
    return [
      { code: 'fr-FR', name: 'Français', flag: '🇫🇷', country: 'France' },
      { code: 'en-GB', name: 'English', flag: '🇬🇧', country: 'United Kingdom' },
      { code: 'es-ES', name: 'Español', flag: '🇪🇸', country: 'Spain' }
    ];
  }
};

export default LanguageService;