// src/pages/PriseEnCharge.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiFilter } from 'react-icons/fi';
import { priseEnChargeAPI } from '../services/api';
import DemandesList from '../components/prise-en-charge/DemandesList';
import DemandeWorkflow from '../components/prise-en-charge/DemandeWorkflow';

const PriseEnCharge = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [selectedStatut, setSelectedStatut] = useState('');

  useEffect(() => {
    const fetchDemandes = async () => {
      setLoading(true);
      try {
        const data = await priseEnChargeAPI.getAll();
        setDemandes(data);
      } catch (error) {
        console.error('Erreur lors du chargement des demandes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDemandes();
  }, []);

  const filteredDemandes = demandes.filter(demande => {
    const matchSearch = demande.patient_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.patient_prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.numero_demande.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatut = selectedStatut ? demande.statut === selectedStatut : true;
    
    return matchSearch && matchStatut;
  });

  const stats = {
    total: demandes.length,
    enAttente: demandes.filter(d => d.statut === 'en_attente').length,
    validees: demandes.filter(d => d.statut === 'validee').length,
    rejetees: demandes.filter(d => d.statut === 'rejetee').length
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accords Préalables</h1>
          <p className="text-gray-600 mt-2">Gérez les demandes de prise en charge</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowWorkflow(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg transition-colors"
        >
          <FiPlus size={20} />
          <span>Nouvelle Demande</span>
        </motion.button>
      </motion.div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Demandes', value: stats.total, color: 'blue' },
          { label: 'En Attente', value: stats.enAttente, color: 'yellow' },
          { label: 'Validées', value: stats.validees, color: 'green' },
          { label: 'Rejetées', value: stats.rejetees, color: 'red' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                <FiPlus className={`text-${stat.color}-600`} size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filtres et recherche */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom patient, prénom ou numéro de demande..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          <select
            value={selectedStatut}
            onChange={(e) => setSelectedStatut(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="validee">Validée</option>
            <option value="rejetee">Rejetée</option>
            <option value="executee">Exécutée</option>
          </select>
          
          <button className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center space-x-2 transition-colors">
            <FiFilter size={18} />
            <span>Plus de filtres</span>
          </button>
        </div>
      </motion.div>

      {/* Liste des demandes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Demandes de Prise en Charge ({filteredDemandes.length})
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des demandes...</p>
          </div>
        ) : (
          <DemandesList
            demandes={filteredDemandes}
            onEdit={(demande) => {
              console.log('Modifier demande:', demande);
            }}
            onDelete={(demande) => {
              console.log('Supprimer demande:', demande);
            }}
            onView={(demande) => {
              console.log('Voir demande:', demande);
            }}
          />
        )}
      </motion.div>

      {showWorkflow && (
        <DemandeWorkflow onClose={() => setShowWorkflow(false)} />
      )}
    </div>
  );
};

export default PriseEnCharge;