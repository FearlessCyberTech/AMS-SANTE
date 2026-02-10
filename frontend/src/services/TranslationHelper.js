// src/services/TranslationHelper.js
/**
 * Service Helper pour la traduction
 * Fournit des fonctions utiles pour la traduction cohérente à travers l'application
 */

import i18n from './i18n';

export const TranslationHelper = {
  /**
   * Obtenir une traduction
   * @param {string} key - Clé de traduction
   * @param {object} options - Options (ex: { count: 5 })
   */
  t: (key, options) => {
    return i18n.t(key, options);
  },

  /**
   * Vérifier si une clé de traduction existe
   * @param {string} key - Clé de traduction
   */
  hasTranslation: (key) => {
    return i18n.exists(key);
  },

  /**
   * Obtenir la langue actuelle
   */
  getCurrentLanguage: () => {
    return i18n.language;
  },

  /**
   * Obtenir le code pays de la langue
   */
  getCountryFromLanguage: () => {
    const languageCountryMap = {
      'fr-FR': ['CMF', 'RCA', 'TCD', 'COG'],
      'en-GB': ['CMA', 'BDI'],
      'es-ES': ['GNQ']
    };
    return languageCountryMap[i18n.language] || ['CMF'];
  },

  /**
   * Obtenir le nom du pays traduit
   * @param {string} countryCode - Code pays (ex: CMF)
   */
  getCountryName: (countryCode) => {
    return i18n.t(`countries.${countryCode}`, countryCode);
  },

  /**
   * Obtenir le nom du rôle traduit
   * @param {string} role - Code rôle
   */
  getRoleName: (role) => {
    const roleMap = {
      'SuperAdmin': 'roles.administrator',
      'Admin': 'roles.administrator',
      'Medecin': 'roles.doctor',
      'Infirmier': 'roles.nurse',
      'Producteur': 'roles.secretary',
      'Caissier': 'roles.cashier',
      'Utilisateur': 'roles.user'
    };
    const key = roleMap[role] || `roles.${role.toLowerCase()}`;
    return i18n.t(key, role);
  },

  /**
   * Formater un nombre selon la locale
   * @param {number} num - Nombre à formater
   */
  formatNumber: (num) => {
    const locale = i18n.language.replace('-', '-');
    return new Intl.NumberFormat(locale).format(num);
  },

  /**
   * Formater une devise
   * @param {number} amount - Montant
   * @param {string} currency - Code devise (ex: XAF)
   */
  formatCurrency: (amount, currency = 'XAF') => {
    const locale = i18n.language.replace('-', '-');
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  /**
   * Formater une date
   * @param {Date|string} date - Date à formater
   * @param {object} options - Options de formatage
   */
  formatDate: (date, options = {}) => {
    const locale = i18n.language.replace('-', '-');
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  },

  /**
   * Obtenir une clé manquante (pour debug)
   * @param {string} key - Clé cherchée
   */
  getMissingKey: (key) => {
    console.warn(`Traduction manquante: ${key} pour ${i18n.language}`);
    return key;
  }
};

export default TranslationHelper;
