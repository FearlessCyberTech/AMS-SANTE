// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import i18n from '../services/i18n'; // Importez i18n directement

// Créer le contexte
const AuthContext = createContext();

// Hook personnalisé
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
};

// Fonction pour décoder le token JWT
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erreur décodage token:', error);
    return null;
  }
};

// Fonction pour mapper le code pays à la langue
const getLanguageForCountry = (countryCode) => {
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
};

// Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLanguage, setUserLanguage] = useState('fr-FR');
  const [userCountry, setUserCountry] = useState(null);

  // Fonction pour changer la langue globale
  const changeApplicationLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setUserLanguage(languageCode);
    localStorage.setItem('language', languageCode);
    document.documentElement.lang = languageCode;
  };

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    const loadUser = () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedLanguage = localStorage.getItem('language');
        const storedCountry = localStorage.getItem('country');

        if (token) {
          const decoded = decodeToken(token);
          if (decoded && decoded.exp > Date.now() / 1000) {
            setUser(decoded);
            
            // Récupérer le pays
            let country = storedCountry || decoded.cod_pay || decoded.country;
            if (country) {
              setUserCountry(country);
              const language = getLanguageForCountry(country);
              changeApplicationLanguage(language);
            } else if (storedLanguage) {
              changeApplicationLanguage(storedLanguage);
            }
          } else {
            // Token expiré
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('language');
            localStorage.removeItem('country');
            changeApplicationLanguage('fr-FR');
          }
        } else if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            if (parsedUser.cod_pay || parsedUser.country) {
              const country = parsedUser.cod_pay || parsedUser.country;
              setUserCountry(country);
              const language = getLanguageForCountry(country);
              changeApplicationLanguage(language);
            }
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
      } catch (err) {
        console.error('Erreur chargement utilisateur:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('language');
        localStorage.removeItem('country');
        changeApplicationLanguage('fr-FR');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Connexion SIMPLIFIÉE - n'envoyez PAS de country dans le body
  const login = async (username, password, selectedCountry = 'CMF') => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // CORRECTION IMPORTANTE : N'envoyez PAS le country dans le body
      // L'API attend probablement seulement username et password
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          password
          // NE PAS ENVOYER country ici
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API:', errorText);
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Échec de la connexion');
      }

      if (!data.token) {
        throw new Error('Token manquant dans la réponse');
      }

      // Stocker le token
      localStorage.setItem('token', data.token);
      
      // Stocker les données utilisateur
      if (data.user) {
        // Ajouter le pays sélectionné à l'utilisateur
        const userWithCountry = {
          ...data.user,
          cod_pay: data.user.cod_pay || selectedCountry
        };
        
        localStorage.setItem('user', JSON.stringify(userWithCountry));
        localStorage.setItem('country', userWithCountry.cod_pay);
        setUser(userWithCountry);
        setUserCountry(userWithCountry.cod_pay);
        
        // Appliquer la langue selon le pays
        const language = getLanguageForCountry(userWithCountry.cod_pay);
        changeApplicationLanguage(language);
      } else {
        // Si pas de données utilisateur, décoder depuis le token
        const decoded = decodeToken(data.token);
        const userWithCountry = {
          ...decoded,
          cod_pay: decoded.cod_pay || selectedCountry
        };
        setUser(userWithCountry);
        setUserCountry(userWithCountry.cod_pay);
        localStorage.setItem('user', JSON.stringify(userWithCountry));
        localStorage.setItem('country', userWithCountry.cod_pay);
        
        const language = getLanguageForCountry(userWithCountry.cod_pay);
        changeApplicationLanguage(language);
      }
      
      return { success: true, data };
      
    } catch (err) {
      console.error('Erreur connexion:', err);
      setError(err.message || 'Erreur de connexion');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('language');
      localStorage.removeItem('country');
      setUser(null);
      setUserCountry(null);
      changeApplicationLanguage('fr-FR');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('language');
    localStorage.removeItem('country');
    setUser(null);
    setUserCountry(null);
    changeApplicationLanguage('fr-FR');
    setError(null);
  };

  // Vérifier l'authentification
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const decoded = decodeToken(token);
      return decoded && decoded.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  };

  // Vérifier le rôle
  const hasRole = (roles) => {
    if (!user || !user.role) return false;
    return Array.isArray(roles) ? roles.includes(user.role) : roles === user.role;
  };

  // Obtenir le token
  const getToken = () => localStorage.getItem('token');

  // Changer la langue manuellement
  const changeLanguage = (languageCode) => {
    changeApplicationLanguage(languageCode);
  };

  // Mettre à jour l'utilisateur
  const updateUser = (updatedUser) => {
    const userWithCountry = {
      ...updatedUser,
      cod_pay: updatedUser.cod_pay || userCountry
    };
    
    setUser(userWithCountry);
    localStorage.setItem('user', JSON.stringify(userWithCountry));
    
    if (updatedUser.cod_pay && updatedUser.cod_pay !== userCountry) {
      setUserCountry(updatedUser.cod_pay);
      localStorage.setItem('country', updatedUser.cod_pay);
      const language = getLanguageForCountry(updatedUser.cod_pay);
      changeApplicationLanguage(language);
    }
  };

  const value = {
    user,
    loading,
    error,
    userLanguage,
    userCountry,
    login,
    logout,
    isAuthenticated,
    hasRole,
    getToken,
    changeLanguage,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;