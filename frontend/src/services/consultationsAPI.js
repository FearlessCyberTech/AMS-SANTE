// src/services/consultationsAPI.js
const API_URL = 'http://localhost:5000/api';

export const consultationsAPI = {
  // Récupérer toutes les consultations
  async getAll() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/consultations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Données reçues:', data); // Debug
      return data.data || data; // Supporte les deux formats
    } catch (error) {
      console.error('Erreur API consultations:', error);
      throw error;
    }
  },

  // Créer une nouvelle consultation
  async create(consultationData) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/consultations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(consultationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur API création consultation:', error);
      throw error;
    }
  },

  // Mettre à jour une consultation
  async update(id, consultationData) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/consultations/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(consultationData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la consultation');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur API mise à jour consultation:', error);
      throw error;
    }
  },

  // Supprimer une consultation
  async delete(id) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/consultations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur API suppression consultation:', error);
      throw error;
    }
  },

  // Récupérer les statistiques
  async getStats() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/consultations/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Erreur API statistiques:', error);
      throw error;
    }
  }
};

// Services pour les données liées
export const patientsAPI = {
  async getAll() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erreur lors du chargement des patients');
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Erreur API patients:', error);
      throw error;
    }
  }
};

export const medecinsAPI = {
  async getAll() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/medecins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erreur lors du chargement des médecins');
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Erreur API médecins:', error);
      throw error;
    }
  }
};

export const typesConsultationAPI = {
  async getAll() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/types-consultation`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erreur lors du chargement des types');
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Erreur API types consultation:', error);
      throw error;
    }
  }
};