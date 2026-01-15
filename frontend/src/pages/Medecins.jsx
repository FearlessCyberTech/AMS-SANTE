// src/pages/Medecins.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiUserPlus, FiPlus, FiSearch } from 'react-icons/fi';

const Medecins = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <FiUserPlus className="header-icon" size={32} />
            <div>
              <h1>Gestion des Médecins</h1>
              <p>Administrez le personnel médical et leurs spécialités</p>
            </div>
          </div>
          <motion.button 
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlus size={20} />
            Nouveau Médecin
          </motion.button>
        </div>
      </div>

      <div className="page-content">
        <div className="search-section">
          <div className="search-container">
            <FiSearch className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Rechercher un médecin..."
              className="search-input"
            />
          </div>
        </div>

        <div className="content-card">
          <h3>Liste des Médecins</h3>
          <p>Fonctionnalité en cours de développement...</p>
        </div>
      </div>
    </div>
  );
};

export default Medecins;