// src/hooks/usePageTranslation.js
/**
 * Hook personnalisé pour la traduction des pages
 * Combine useTranslation + TranslationHelper pour une utilisation facile
 */

import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import TranslationHelper from '../services/TranslationHelper';

export const usePageTranslation = () => {
  const { t, i18n } = useTranslation();
  const { user, userCountry } = useAuth();

  return {
    // Traduction basique
    t,
    i18n,

    // Informations utilisateur
    user,
    userCountry,
    currentLanguage: i18n.language,

    // Formatage
    formatNumber: (num) => TranslationHelper.formatNumber(num),
    formatCurrency: (amount, currency = 'XAF') => 
      TranslationHelper.formatCurrency(amount, currency),
    formatDate: (date, options) => 
      TranslationHelper.formatDate(date, options),

    // Traductions spéciales
    getRoleName: (role) => TranslationHelper.getRoleName(role),
    getCountryName: (code) => TranslationHelper.getCountryName(code),

    // Vérification
    hasTranslation: (key) => TranslationHelper.hasTranslation(key),

    // Utilitaires
    isEnglish: () => i18n.language === 'en-GB',
    isFrench: () => i18n.language === 'fr-FR',
    isSpanish: () => i18n.language === 'es-ES',
  };
};

export default usePageTranslation;
