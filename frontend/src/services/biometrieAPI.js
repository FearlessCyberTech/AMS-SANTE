// src/services/biometrieAPI.js
import api from './api.js';

export const biometrieAPI = {
  // Enregistrer des données biométriques
  async enregistrer(donnees) {
    try {
      console.log('📤 Envoi données biométriques:', {
        ID_BEN: donnees.ID_BEN,
        TYPE_BIOMETRIE: donnees.TYPE_BIOMETRIE,
        dataLength: donnees.DATA_BASE64 ? donnees.DATA_BASE64.length : 0
      });
      
      const response = await api.fetchAPI('/biometrie/enregistrer', {
        method: 'POST',
        body: donnees,
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur enregistrement biométrique:', error);
      throw error;
    }
  },

  // Récupérer les données biométriques d'un patient
  async getByPatient(id) {
    try {
      const response = await api.fetchAPI(`/biometrie/patient/${id}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération biométrie patient ${id}:`, error);
      throw error;
    }
  },

  // Récupérer les données spécifiques
  async getDonnees(id, type, doigt) {
    try {
      let url = `/biometrie/donnees/${id}`;
      const params = [];
      if (type) params.push(`type=${encodeURIComponent(type)}`);
      if (doigt) params.push(`doigt=${encodeURIComponent(doigt)}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      const response = await api.fetchAPI(url);
      return response;
    } catch (error) {
      console.error(`❌ Erreur récupération données ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un enregistrement
  async supprimer(id) {
    try {
      const response = await api.fetchAPI(`/biometrie/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error(`❌ Erreur suppression biométrie ${id}:`, error);
      throw error;
    }
  },

  // Vérifier l'état d'un patient
  async verifierEtat(id) {
    try {
      const response = await api.fetchAPI(`/biometrie/patient/${id}`);
      return response;
    } catch (error) {
      console.error(`❌ Erreur vérification état ${id}:`, error);
      return {
        success: true,
        stats: {
          total: 0,
          photos: 0,
          empreintes: 0,
          signatures: 0,
          complet: false
        }
      };
    }
  }
};

export default biometrieAPI;