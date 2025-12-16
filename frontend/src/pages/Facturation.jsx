// src/pages/Facturation.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiFileText, FiPlus, FiSearch, FiFilter, FiEdit, FiTrash2, FiPrinter } from 'react-icons/fi';
import { facturationAPI } from '../services/api';

const Facturation = () => {
  const [factures, setFactures] = useState([]);
  const [payeurs, setPayeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayeur, setSelectedPayeur] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Utiliser des données mock temporairement
        const facturesData = await facturationAPI.getAll().catch(() => []);
        setFactures(facturesData);
        
        // Données mock pour les payeurs en attendant la route
        setPayeurs([
          { id: 1, nom: 'Sécurité Sociale' },
          { id: 2, nom: 'Mutuelle Générale' },
          { id: 3, nom: 'Assurance Santé Plus' },
          { id: 4, nom: 'MGEN' }
        ]);
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        // Données de démonstration
        setFactures([
          {
            id: 1,
            numero_facture: 'FACT-2024-0001',
            payeur_nom: 'Sécurité Sociale',
            periode_debut: '2024-01-01',
            periode_fin: '2024-01-31',
            date_emission: '2024-02-01',
            montant_total: 1500.00,
            statut: 'payee'
          },
          {
            id: 2,
            numero_facture: 'FACT-2024-0002',
            payeur_nom: 'Mutuelle Générale',
            periode_debut: '2024-01-01',
            periode_fin: '2024-01-31',
            date_emission: '2024-02-01',
            montant_total: 850.50,
            statut: 'envoyee'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredFactures = factures.filter(facture => {
    const matchSearch = facture.numero_facture.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facture.payeur_nom?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPayeur = selectedPayeur ? facture.payeur_id === parseInt(selectedPayeur) : true;
    const matchDate = (!dateDebut || facture.date_emission >= dateDebut) &&
      (!dateFin || facture.date_emission <= dateFin);
    return matchSearch && matchPayeur && matchDate;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturation</h1>
          <p className="text-gray-600 mt-2">Gérez les factures et états récapitulatifs</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg transition-colors"
        >
          <FiPlus size={20} />
          <span>Nouvelle Facture</span>
        </motion.button>
      </motion.div>

      {/* Filtres et recherche */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par numéro de facture ou payeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          <div>
            <select
              value={selectedPayeur}
              onChange={(e) => setSelectedPayeur(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Tous les payeurs</option>
              {payeurs.map(payeur => (
                <option key={payeur.id} value={payeur.id}>{payeur.nom}</option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-2">
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Date début"
            />
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Date fin"
            />
          </div>
        </div>
      </motion.div>

      {/* Liste des factures */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des factures...</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Factures ({filteredFactures.length})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Numéro</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Payeur</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Période</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Montant Total</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredFactures.map((facture) => (
                    <motion.tr
                      key={facture.id}
                      variants={itemVariants}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FiFileText className="text-blue-600" size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{facture.numero_facture}</p>
                            <p className="text-sm text-gray-500">
                              Émis le {new Date(facture.date_emission).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{facture.payeur_nom}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">
                          {new Date(facture.periode_debut).toLocaleDateString()} - {new Date(facture.periode_fin).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          {facture.montant_total?.toFixed(2)} €
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          facture.statut === 'payee' 
                            ? 'bg-green-100 text-green-800'
                            : facture.statut === 'envoyee'
                            ? 'bg-blue-100 text-blue-800'
                            : facture.statut === 'partiellement_payee'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {facture.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FiEdit size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <FiPrinter size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 size={18} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Facturation;