// src/pages/NouvelleConsultation.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ConsultationWorkflow from '../components/consultations/ConsultationWorkflow';

const NouvelleConsultation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const handleSave = (consultation) => {
    console.log('Consultation sauvegardée:', consultation);
    navigate('/consultations');
  };

  const handleCancel = () => {
    navigate('/consultations');
  };

  return (
    <ConsultationWorkflow
      consultation={id ? { id: parseInt(id) } : null} // En production, charger les données
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default NouvelleConsultation;