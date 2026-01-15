// src/components/PrescriptionExecution.jsx - Fichier à créer
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Check, 
  X, 
  FileText, 
  Printer, 
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Pill,
  Stethoscope
} from 'lucide-react';
import { prescriptionsAPI } from '../services/prescriptions';

const PrescriptionExecution = () => {
  const [step, setStep] = useState(1); // 1: Recherche, 2: Détails, 3: Exécution
  const [searchNumero, setSearchNumero] = useState('');
  const [loading, setLoading] = useState(false);
  const [prescription, setPrescription] = useState(null);
  const [details, setDetails] = useState([]);
  const [executionData, setExecutionData] = useState({
    cod_executant: null,
    cod_cen: null,
    observations: '',
    details: []
  });

  useEffect(() => {
    // Charger l'utilisateur connecté
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setExecutionData(prev => ({
      ...prev,
      cod_executant: user.id || 1,
      cod_cen: user.centre || 1
    }));
  }, []);

  const handleSearch = async () => {
    if (!searchNumero.trim()) {
      alert('Veuillez saisir un numéro de prescription');
      return;
    }

    setLoading(true);
    try {
      const response = await prescriptionsAPI.getByNumero(searchNumero);
      
      if (response.success) {
        setPrescription(response.prescription);
        setDetails(response.details || []);
        
        // Initialiser les données d'exécution
        const initialDetails = (response.details || []).map(detail => ({
          cod_pres_det: detail.COD_PRES_DET,
          quantite_executee: detail.QUANTITE_EXECUTEE || 0,
          selected: false
        }));
        
        setExecutionData(prev => ({
          ...prev,
          details: initialDetails
        }));
        
        setStep(2);
      } else {
        alert('Prescription non trouvée');
      }
    } catch (error) {
      console.error('Erreur recherche prescription:', error);
      alert('Erreur lors de la recherche de la prescription');
    } finally {
      setLoading(false);
    }
  };

  const toggleDetailSelection = (index) => {
    const newDetails = [...executionData.details];
    newDetails[index].selected = !newDetails[index].selected;
    setExecutionData(prev => ({
      ...prev,
      details: newDetails
    }));
  };

  const updateQuantiteExecutee = (index, value) => {
    const newDetails = [...executionData.details];
    const quantiteMax = details[index]?.QUANTITE || 0;
    const quantite = Math.min(Math.max(0, parseFloat(value) || 0), quantiteMax);
    
    newDetails[index].quantite_executee = quantite;
    newDetails[index].selected = quantite > 0;
    
    setExecutionData(prev => ({
      ...prev,
      details: newDetails
    }));
  };

  const handleExecute = async () => {
    if (!prescription) return;

    const hasSelection = executionData.details.some(detail => detail.selected && detail.quantite_executee > 0);
    if (!hasSelection) {
      alert('Veuillez sélectionner au moins un élément à exécuter');
      return;
    }

    if (!window.confirm('Confirmer l\'exécution des éléments sélectionnés ?')) {
      return;
    }

    setLoading(true);
    try {
      const filteredDetails = executionData.details
        .filter(detail => detail.selected && detail.quantite_executee > 0)
        .map(detail => ({
          cod_pres_det: detail.cod_pres_det,
          quantite_executee: detail.quantite_executee
        }));

      const data = {
        details: filteredDetails,
        cod_executant: executionData.cod_executant,
        cod_cen: executionData.cod_cen,
        observations: executionData.observations
      };

      const response = await prescriptionsAPI.execute(prescription.NUM_PRESCRIPTION, data);
      
      if (response.success) {
        alert('Prescription exécutée avec succès !');
        
        // Recharger les données
        const updatedResponse = await prescriptionsAPI.getByNumero(prescription.NUM_PRESCRIPTION);
        if (updatedResponse.success) {
          setPrescription(updatedResponse.prescription);
          setDetails(updatedResponse.details || []);
          
          // Mettre à jour les données d'exécution
          const updatedDetails = (updatedResponse.details || []).map(detail => ({
            cod_pres_det: detail.COD_PRES_DET,
            quantite_executee: detail.QUANTITE_EXECUTEE || 0,
            selected: false
          }));
          
          setExecutionData(prev => ({
            ...prev,
            details: updatedDetails,
            observations: ''
          }));
        }
        
        // Demander l'impression de la feuille de soins
        if (window.confirm('Voulez-vous imprimer la feuille de soins ?')) {
          handlePrintFeuilleSoins();
        }
      } else {
        alert('Erreur lors de l\'exécution: ' + response.message);
      }
    } catch (error) {
      console.error('Erreur exécution:', error);
      alert('Erreur lors de l\'exécution de la prescription');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintFeuilleSoins = () => {
    if (!prescription) return;

    const elementsExecutes = details.filter(detail => 
      executionData.details.find(d => 
        d.cod_pres_det === detail.COD_PRES_DET && d.quantite_executee > 0
      )
    );

    const printContent = `
      <html>
        <head>
          <title>Feuille de Soins - ${prescription.NUM_PRESCRIPTION}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .patient-info, .prescription-info { margin-bottom: 20px; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #000; padding: 8px; text-align: left; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #000; }
            .total { font-weight: bold; font-size: 1.2em; text-align: right; margin-top: 20px; }
            .executed { background-color: #f0fff0; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FEUILLE DE SOINS</h1>
            <p>Centre de Santé - Système HCS</p>
          </div>
          
          <div class="patient-info">
            <p><strong>Patient:</strong> ${prescription.NOM_BEN} ${prescription.PRE_BEN}</p>
            <p><strong>Identifiant:</strong> ${prescription.IDENTIFIANT_NATIONAL || 'N/A'}</p>
            <p><strong>Âge:</strong> ${prescription.AGE || 'N/A'} ans</p>
          </div>
          
          <div class="prescription-info">
            <p><strong>Numéro prescription:</strong> ${prescription.NUM_PRESCRIPTION}</p>
            <p><strong>Date prescription:</strong> ${new Date(prescription.DATE_PRESCRIPTION).toLocaleDateString()}</p>
            <p><strong>Date exécution:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Affection:</strong> ${prescription.LIB_AFF || 'N/A'}</p>
          </div>
          
          <h3>Éléments exécutés</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Élément</th>
                <th>Quantité prescrite</th>
                <th>Quantité exécutée</th>
                <th>Prix unitaire</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              ${elementsExecutes.map(element => {
                const quantiteExecutee = executionData.details.find(d => 
                  d.cod_pres_det === element.COD_PRES_DET
                )?.quantite_executee || 0;
                const montant = quantiteExecutee * (element.PRIX_UNITAIRE || 0);
                
                return `
                  <tr class="executed">
                    <td>${element.LIBELLE}</td>
                    <td>${element.QUANTITE} ${element.UNITE || ''}</td>
                    <td>${quantiteExecutee} ${element.UNITE || ''}</td>
                    <td>${(element.PRIX_UNITAIRE || 0).toLocaleString()} FCFA</td>
                    <td>${montant.toLocaleString()} FCFA</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="total">
            <strong>Total exécuté: </strong>
            ${elementsExecutes.reduce((total, element) => {
              const quantiteExecutee = executionData.details.find(d => 
                d.cod_pres_det === element.COD_PRES_DET
              )?.quantite_executee || 0;
              return total + (quantiteExecutee * (element.PRIX_UNITAIRE || 0));
            }, 0).toLocaleString()} FCFA
          </div>
          
          ${executionData.observations ? `
            <div class="footer">
              <p><strong>Observations d'exécution:</strong></p>
              <p>${executionData.observations}</p>
            </div>
          ` : ''}
          
          <div class="footer">
            <p><strong>Signature et cachet de l'exécutant:</strong></p>
            <br><br><br>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="no-print" style="margin-top: 50px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Imprimer
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
              Fermer
            </button>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Execute': return 'bg-green-100 text-green-800';
      case 'Partiellement execute': return 'bg-yellow-100 text-yellow-800';
      case 'A executer': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'Execute': return 'Exécuté';
      case 'Partiellement execute': return 'Partiellement exécuté';
      case 'A executer': return 'À exécuter';
      default: return status;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-800">Exécution des Prescriptions</h1>
          </div>
          <div className="flex space-x-2">
            <div className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
              <span className="font-medium">1. Recherche</span>
            </div>
            <div className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
              <span className="font-medium">2. Détails</span>
            </div>
            <div className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
              <span className="font-medium">3. Exécution</span>
            </div>
          </div>
        </div>

        {/* Étape 1: Recherche */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-green-800">Recherche de prescription</h2>
              </div>
              <p className="text-green-700 mt-1">Saisissez le numéro de prescription à exécuter</p>
            </div>

            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchNumero}
                  onChange={(e) => setSearchNumero(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Numéro de prescription (ex: PRES-2024-00001)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Recherche...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Rechercher</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Étape 2: Détails de la prescription */}
        {step === 2 && prescription && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-blue-800">
                      Prescription: {prescription.NUM_PRESCRIPTION}
                    </h2>
                    <p className="text-blue-700 text-sm">
                      {prescription.TYPE_PRESTATION} • {new Date(prescription.DATE_PRESCRIPTION).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Nouvelle recherche
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations patient */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Patient</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Nom:</span>
                    <div className="font-medium">{prescription.NOM_BEN} {prescription.PRE_BEN}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Identifiant:</span>
                    <div className="font-medium">{prescription.IDENTIFIANT_NATIONAL || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Âge/Sexe:</span>
                    <div className="font-medium">{prescription.AGE} ans • {prescription.SEX_BEN === 'M' ? 'Homme' : 'Femme'}</div>
                  </div>
                </div>
              </div>

              {/* Informations prescription */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Prescription</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Statut:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(prescription.STATUT)}`}>
                      {getStatusText(prescription.STATUT)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Type:</span>
                    <div className="font-medium">{prescription.TYPE_PRESTATION}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Affection:</span>
                    <div className="font-medium">{prescription.LIB_AFF || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Médecin:</span>
                    <div className="font-medium">
                      {prescription.NOM_MEDECIN || 'N/A'} {prescription.PRENOM_MEDECIN || ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Éléments de la prescription */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Éléments à exécuter ({details.length})
                </h3>
                <div className="text-sm text-gray-600">
                  {prescription.ORIGINE === 'Electronique' ? 'Sélection par case à cocher' : 'Saisie manuelle'}
                </div>
              </div>

              {details.length > 0 ? (
                <div className="space-y-4">
                  {details.map((detail, index) => {
                    const executionDetail = executionData.details[index];
                    const isSelected = executionDetail?.selected || false;
                    const quantiteExecutee = executionDetail?.quantite_executee || 0;
                    const quantiteRestante = detail.QUANTITE - (detail.QUANTITE_EXECUTEE || 0);
                    
                    return (
                      <div 
                        key={detail.COD_PRES_DET} 
                        className={`bg-white border rounded-lg p-4 ${
                          isSelected ? 'border-green-300 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {detail.TYPE_ELEMENT === 'Medicament' ? (
                                <Pill className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Stethoscope className="w-5 h-5 text-green-600" />
                              )}
                              <h4 className="font-medium text-gray-900">{detail.LIBELLE}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(detail.STATUT_EXECUTION)}`}>
                                {getStatusText(detail.STATUT_EXECUTION_LIB || detail.STATUT_EXECUTION)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Quantité prescrite</label>
                                <div className="font-medium">
                                  {detail.QUANTITE} {detail.UNITE || ''}
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Déjà exécuté</label>
                                <div className="font-medium">
                                  {detail.QUANTITE_EXECUTEE || 0} {detail.UNITE || ''}
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Reste à exécuter</label>
                                <div className="font-medium text-blue-600">
                                  {quantiteRestante} {detail.UNITE || ''}
                                </div>
                              </div>
                            </div>
                            
                            {detail.POSOLOGIE && (
                              <div className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">Posologie:</span> {detail.POSOLOGIE}
                              </div>
                            )}
                            
                            {detail.PRIX_UNITAIRE > 0 && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Prix unitaire:</span> {detail.PRIX_UNITAIRE.toLocaleString()} FCFA
                              </div>
                            )}
                            
                            {detail.DATE_EXECUTION && (
                              <div className="text-sm text-gray-500 mt-2">
                                Dernière exécution: {new Date(detail.DATE_EXECUTION).toLocaleString()} 
                                {detail.NOM_EXECUTANT && ` par ${detail.NOM_EXECUTANT} ${detail.PRENOM_EXECUTANT}`}
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-4 flex flex-col items-end space-y-3">
                            {/* Case à cocher pour les prescriptions électroniques */}
                            {prescription.ORIGINE === 'Electronique' && quantiteRestante > 0 && (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleDetailSelection(index)}
                                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                />
                                <span className="text-sm text-gray-700">Exécuter</span>
                              </div>
                            )}
                            
                            {/* Saisie manuelle pour toutes les prescriptions */}
                            <div className="flex items-center space-x-2">
                              <label className="text-sm text-gray-700">Quantité:</label>
                              <input
                                type="number"
                                min="0"
                                max={quantiteRestante}
                                step={detail.UNITE === 'boite' ? '1' : '0.1'}
                                value={quantiteExecutee}
                                onChange={(e) => updateQuantiteExecutee(index, e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                disabled={quantiteRestante <= 0}
                              />
                              <span className="text-sm text-gray-600">{detail.UNITE || ''}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Observations */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">Observations d'exécution</h4>
                    <textarea
                      value={executionData.observations}
                      onChange={(e) => setExecutionData(prev => ({
                        ...prev,
                        observations: e.target.value
                      }))}
                      rows="3"
                      placeholder="Notes sur l'exécution..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Aucun élément trouvé dans cette prescription</p>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      // Sélectionner tous les éléments non exécutés
                      const newDetails = executionData.details.map((execDetail, idx) => {
                        const detail = details[idx];
                        const quantiteRestante = detail.QUANTITE - (detail.QUANTITE_EXECUTEE || 0);
                        
                        return {
                          ...execDetail,
                          selected: quantiteRestante > 0,
                          quantite_executee: quantiteRestante > 0 ? quantiteRestante : 0
                        };
                      });
                      
                      setExecutionData(prev => ({
                        ...prev,
                        details: newDetails
                      }));
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    Tout sélectionner
                  </button>
                  
                  <button
                    onClick={handleExecute}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Exécution...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Exécuter la sélection</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionExecution;