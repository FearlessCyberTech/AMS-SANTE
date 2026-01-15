import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const authService = {
  login: async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      });
      
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('lastActivity', Date.now());
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur de connexion' };
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('lastActivity');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const lastActivity = localStorage.getItem('lastActivity');
    const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 heure

    if (!token || !lastActivity) return false;

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    if (timeSinceLastActivity > SESSION_TIMEOUT) {
      this.logout();
      return false;
    }

    // Mettre à jour le timestamp d'activité
    localStorage.setItem('lastActivity', Date.now());
    return true;
  },

  updateActivity: () => {
    localStorage.setItem('lastActivity', Date.now());
  }
};

export default authService;