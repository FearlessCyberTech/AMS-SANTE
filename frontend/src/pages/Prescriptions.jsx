// src/pages/Prescriptions.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiFilter } from 'react-icons/fi';
import { prescriptionsAPI } from '../services/api';
import PrescriptionWorkflow from '../components/prescriptions/PrescriptionWorkflow';
import PrescriptionsList from '../components/prescriptions/PrescriptionsList';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWorkflow, setShowWorkflow] = useState(false);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        const data = await prescriptionsAPI.getAll();
        setPrescriptions(data);
      } catch (error) {
        console.error('Erreur lors du chargement des prescriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  const filteredPrescriptions = prescriptions.filter(prescription =>
    prescription.patient_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.patient_prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.numero_prescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-600 mt-2">Gérez les prescriptions électroniques</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowWorkflow(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg transition-colors"
        >
          <FiPlus size={20} />
          <span>Nouvelle Prescription</span>
        </motion.button>
      </motion.div>

      {/* Filtres et recherche */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom patient, prénom ou numéro de prescription..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          <button className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center space-x-2 transition-colors">
            <FiFilter size={18} />
            <span>Filtres</span>
          </button>
        </div>
      </motion.div>

      {/* Liste des prescriptions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Prescriptions ({filteredPrescriptions.length})
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des prescriptions...</p>
          </div>
        ) : (
          <PrescriptionsList
            prescriptions={filteredPrescriptions}
            onEdit={(prescription) => {
              console.log('Modifier prescription:', prescription);
            }}
            onDelete={(prescription) => {
              console.log('Supprimer prescription:', prescription);
            }}
            onView={(prescription) => {
              console.log('Voir prescription:', prescription);
            }}
          />
        )}
      </motion.div>

      {showWorkflow && (
        <PrescriptionWorkflow onClose={() => setShowWorkflow(false)} />
      )}
    </div>
  );
};

export default Prescriptions;