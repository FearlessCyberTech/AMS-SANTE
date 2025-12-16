// src/pages/Patients.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiPlus, FiSearch } from 'react-icons/fi';

const Patients = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <FiUsers className="header-icon" size={32} />
            <div>
              <h1>Gestion des Patients</h1>
              <p>Gérez les dossiers patients et les informations personnelles</p>
            </div>
          </div>
          <motion.button 
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlus size={20} />
            Nouveau Patient
          </motion.button>
        </div>
      </div>

      <div className="page-content">
        <div className="search-section">
          <div className="search-container">
            <FiSearch className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              className="search-input"
            />
          </div>
        </div>

        <div className="content-card">
          <h3>Liste des Patients</h3>
          <p>Fonctionnalité en cours de développement...</p>
        </div>
      </div>
    </div>
  );
};

export default Patients;