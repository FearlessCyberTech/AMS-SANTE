// src/pages/TypesConsultation.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiSettings, FiPlus, FiList } from 'react-icons/fi';

const TypesConsultation = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <FiSettings className="header-icon" size={32} />
            <div>
              <h1>Types de Consultation</h1>
              <p>Configurez les différents types de consultations et leurs tarifs</p>
            </div>
          </div>
          <motion.button 
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlus size={20} />
            Nouveau Type
          </motion.button>
        </div>
      </div>

      <div className="page-content">
        <div className="content-card">
          <div className="card-header">
            <FiList size={24} />
            <h3>Types de consultations disponibles</h3>
          </div>
          <p>Fonctionnalité en cours de développement...</p>
        </div>
      </div>
    </div>
  );
};

export default TypesConsultation;