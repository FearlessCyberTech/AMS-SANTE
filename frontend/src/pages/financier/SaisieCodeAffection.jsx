// src/components/facturation/SaisieCodeAffection.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// Modifier les imports pour enlever FiRefresh et utiliser les icônes disponibles
import {
  FiSearch, FiSave, FiCheckCircle, FiXCircle,
  FiFilter, FiDownload, FiUpload,
  FiFileText, FiUser, FiCalendar, FiDollarSign,
  FiRotateCw
} from 'react-icons/fi';
import { facturationAPI, consultationsAPI } from '../../services/api';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const SaisieCodeAffection = ({ onUpdate, showNotification }) => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    medecin: '',
    statut: 'non_facture'
  });
  const [medecins, setMedecins] = useState([]);
  const [affectionOptions, setAffectionOptions] = useState([]);
  const [selectedConsultations, setSelectedConsultations] = useState(new Set());
  const [saving, setSaving] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    sansCode: 0,
    avecCode: 0
  });

  // Charger les données initiales
  useEffect(() => {
    fetchConsultations();
    fetchMedecins();
  }, []);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const response = await facturationAPI.getConsultationsSansAffection({
        limit: 50,
        offset: 0,
        search: searchTerm,
        dateDebut: filters.dateDebut || null,
        dateFin: filters.dateFin || null,
        medecinId: filters.medecin || null,
        statut: filters.statut
      });

      if (response.success) {
        setConsultations(response.consultations || []);
        setStats({
          total: response.pagination?.total || response.consultations?.length || 0,
          sansCode: response.consultations?.filter(c => !c.COD_AFF).length || 0,
          avecCode: response.consultations?.filter(c => c.COD_AFF).length || 0
        });
      } else {
        showNotification('Erreur lors du chargement des consultations');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedecins = async () => {
    try {
      const response = await consultationsAPI.getMedecins();
      if (response.success) {
        setMedecins(response.medecins || []);
      }
    } catch (error) {
      console.error('Erreur chargement médecins:', error);
    }
  };

  const searchAffections = async (searchValue) => {
    if (searchValue.length < 2) {
      setAffectionOptions([]);
      return;
    }

    try {
      const response = await consultationsAPI.searchAffections(searchValue, 20);
      if (response.success) {
        setAffectionOptions(response.affections || []);
      }
    } catch (error) {
      console.error('Erreur recherche affections:', error);
      setAffectionOptions([]);
    }
  };

  const handleSaveCodeAffection = async (consultationId, codeAffection) => {
    if (!codeAffection.trim()) {
      showNotification('Veuillez entrer un code affection valide');
      return;
    }

    setSaving(prev => ({ ...prev, [consultationId]: true }));

    try {
      // Note: L'API doit être implémentée dans le backend
      // const response = await facturationAPI.updateConsultationCodeAffection(consultationId, codeAffection);
      
      // Simulation temporaire
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mise à jour locale
      setConsultations(prev =>
        prev.map(consult =>
          consult.id === consultationId
            ? { ...consult, COD_AFF: codeAffection, updated: true }
            : consult
        )
      );

      // Retirer de la sélection
      setSelectedConsultations(prev => {
        const newSet = new Set(prev);
        newSet.delete(consultationId);
        return newSet;
      });

      showNotification('Code affection enregistré avec succès');
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      showNotification('Erreur lors de la sauvegarde');
    } finally {
      setSaving(prev => ({ ...prev, [consultationId]: false }));
    }
  };

  const handleSaveMultiple = async () => {
    if (selectedConsultations.size === 0) {
      showNotification('Veuillez sélectionner au moins une consultation');
      return;
    }

    const codeAffection = prompt('Entrez le code affection pour les consultations sélectionnées:');
    if (!codeAffection || !codeAffection.trim()) {
      showNotification('Code affection invalide');
      return;
    }

    // Sauvegarder toutes les consultations sélectionnées
    for (const consultationId of selectedConsultations) {
      await handleSaveCodeAffection(consultationId, codeAffection);
    }

    showNotification(`${selectedConsultations.size} consultation(s) mise(s) à jour`);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(consultations.filter(c => !c.COD_AFF).map(c => c.id));
      setSelectedConsultations(allIds);
    } else {
      setSelectedConsultations(new Set());
    }
  };

  const handleSelectConsultation = (consultationId, hasCode) => {
    if (hasCode) return; // Ne pas sélectionner celles avec code

    setSelectedConsultations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(consultationId)) {
        newSet.delete(consultationId);
      } else {
        newSet.add(consultationId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(montant || 0);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saisie des codes affection</h1>
          <p className="text-gray-600 mt-1">
            Attribuez un code affection aux consultations pour les rendre facturables
          </p>
        </div>
        
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchConsultations}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <FiRotateCw size={18} />
            <span>Actualiser</span>
          </motion.button>
          
          {selectedConsultations.size > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveMultiple}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <FiSave size={18} />
              <span>Appliquer à {selectedConsultations.size} sélection(s)</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Statistiques */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total consultations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiFileText className="text-blue-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sans code affection</p>
              <p className="text-2xl font-bold text-red-600">{stats.sansCode}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FiXCircle className="text-red-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avec code affection</p>
              <p className="text-2xl font-bold text-green-600">{stats.avecCode}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiCheckCircle className="text-green-600" size={20} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par patient, identifiant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <select
              value={filters.medecin}
              onChange={(e) => handleFilterChange('medecin', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les médecins</option>
              {medecins.map(medecin => (
                <option key={medecin.COD_PRE} value={medecin.COD_PRE}>
                  Dr. {medecin.NOM_PRESTATAIRE} {medecin.PRENOM_PRESTATAIRE}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-2">
            <input
              type="date"
              value={filters.dateDebut}
              onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Date début"
            />
            <input
              type="date"
              value={filters.dateFin}
              onChange={(e) => handleFilterChange('dateFin', e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Date fin"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={() => {
              setSearchTerm('');
              setFilters({ dateDebut: '', dateFin: '', medecin: '', statut: 'non_facture' });
              fetchConsultations();
            }}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Réinitialiser
          </button>
          <button
            onClick={fetchConsultations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Appliquer les filtres
          </button>
        </div>
      </motion.div>

      {/* Liste des consultations */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des consultations...</p>
          </div>
        ) : consultations.length === 0 ? (
          <div className="p-8 text-center">
            <FiFileText className="mx-auto text-gray-300" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune consultation trouvée</h3>
            <p className="mt-2 text-gray-500">
              {searchTerm || filters.dateDebut || filters.dateFin || filters.medecin
                ? "Aucune consultation ne correspond à vos critères"
                : "Toutes les consultations ont un code affection"}
            </p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Consultations ({consultations.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedConsultations.size === consultations.filter(c => !c.COD_AFF).length && consultations.filter(c => !c.COD_AFF).length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    Sélectionner toutes ({consultations.filter(c => !c.COD_AFF).length} sans code)
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {selectedConsultations.size} sélectionné(s)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-12"></th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Patient</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Médecin</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Montant</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Code affection</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {consultations.map((consultation) => {
                    const hasCode = !!consultation.COD_AFF;
                    const isSelected = selectedConsultations.has(consultation.id);
                    
                    return (
                      <motion.tr
                        key={consultation.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`hover:bg-gray-50 ${hasCode ? 'bg-green-50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectConsultation(consultation.id, hasCode)}
                            disabled={hasCode}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-600">
                            <p className="font-medium">{formatDate(consultation.DATE_CONSULTATION)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {consultation.patient_nom} {consultation.patient_prenom}
                            </p>
                            <p className="text-sm text-gray-500">
                              {consultation.patient_identifiant}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900">
                            {consultation.medecin_nom} {consultation.medecin_prenom}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {consultation.type_consultation}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {formatMontant(consultation.montant)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <input
                              type="text"
                              value={consultation.COD_AFF || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                searchAffections(value);
                                // Mise à jour locale
                                setConsultations(prev =>
                                  prev.map(cons =>
                                    cons.id === consultation.id
                                      ? { ...cons, COD_AFF: value }
                                      : cons
                                  )
                                );
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && consultation.COD_AFF) {
                                  handleSaveCodeAffection(consultation.id, consultation.COD_AFF);
                                }
                              }}
                              placeholder="Rechercher un code..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              list={`affection-list-${consultation.id}`}
                            />
                            
                            {/* Liste des suggestions */}
                            {affectionOptions.length > 0 && (
                              <datalist id={`affection-list-${consultation.id}`}>
                                {affectionOptions.map((affection) => (
                                  <option
                                    key={affection.code}
                                    value={affection.code}
                                  >
                                    {affection.libelle}
                                  </option>
                                ))}
                              </datalist>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            hasCode
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {hasCode ? (
                              <>
                                <FiCheckCircle className="mr-1" size={14} />
                                Codée
                              </>
                            ) : (
                              <>
                                <FiXCircle className="mr-1" size={14} />
                                Non codée
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                if (consultation.COD_AFF) {
                                  handleSaveCodeAffection(consultation.id, consultation.COD_AFF);
                                }
                              }}
                              disabled={!consultation.COD_AFF || saving[consultation.id]}
                              className={`px-3 py-1 rounded-lg flex items-center space-x-1 text-sm ${
                                consultation.COD_AFF
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {saving[consultation.id] ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Sauvegarde...</span>
                                </>
                              ) : (
                                <>
                                  <FiSave size={14} />
                                  <span>Sauvegarder</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default SaisieCodeAffection;