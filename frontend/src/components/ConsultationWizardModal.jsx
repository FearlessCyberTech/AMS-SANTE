import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Users, Fingerprint, Stethoscope, DollarSign, 
  FileText, Printer, AlertCircle, ChevronRight, 
  ChevronLeft, CheckCircle, CreditCard, UserCheck,
  Camera, Scan
} from 'lucide-react';
import { consultationsAPI } from '../services/api';

const ConsultationWizardModal = ({ onClose, onComplete }) => {
  // États pour les étapes
  const [currentStep, setCurrentStep] = useState(1);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isBiometricMode, setIsBiometricMode] = useState(false);
  const [medecins, setMedecins] = useState([]);
  const [typesConsultation, setTypesConsultation] = useState([]);
  const [selectedMedecin, setSelectedMedecin] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [tarif, setTarif] = useState(0);
  const [isGratuit, setIsGratuit] = useState(false);
  const [decompte, setDecompte] = useState({
    montantTotal: 0,
    montantPrisEnCharge: 0,
    resteCharge: 0,
    pourcentageCouverture: 80
  });
  const [validationInProgress, setValidationInProgress] = useState(false);
  const [generatedConsultationId, setGeneratedConsultationId] = useState(null);
  
  // Références pour l'interface biométrique
  const biometricVideoRef = useRef(null);
  const biometricCanvasRef = useRef(null);
  const [biometricStatus, setBiometricStatus] = useState('ready');
  const [biometricScan, setBiometricScan] = useState(null);

  // Initialisation
  useEffect(() => {
    loadMedecins();
    loadTypesConsultation();
  }, []);

  const loadMedecins = async () => {
    try {
      const data = await consultationsAPI.getMedecins();
      setMedecins(data.medecins || []);
    } catch (error) {
      console.error('Erreur chargement médecins:', error);
      setMedecins([
        { COD_PRE: 1, NOM_COMPLET: 'Dr. Martin Dupont', SPECIALITE: 'Médecine Générale' },
        { COD_PRE: 2, NOM_COMPLET: 'Dr. Sophie Laurent', SPECIALITE: 'Cardiologie' },
        { COD_PRE: 3, NOM_COMPLET: 'Dr. Pierre Bernard', SPECIALITE: 'Pédiatrie' },
        { COD_PRE: 4, NOM_COMPLET: 'Dr. Marie Dubois', SPECIALITE: 'Gynécologie' }
      ]);
    }
  };

  const loadTypesConsultation = async () => {
    try {
      const data = await consultationsAPI.getTypesConsultation();
      setTypesConsultation(data.types || []);
    } catch (error) {
      console.error('Erreur chargement types:', error);
      setTypesConsultation([
        { type: 'Consultation Généraliste', tarif: 5000 },
        { type: 'Consultation Spécialiste', tarif: 10000 },
        { type: 'Consultation Urgence', tarif: 15000 },
        { type: 'Consultation Suivi', tarif: 3000 },
        { type: 'Consultation Pédiatrique', tarif: 4000 },
        { type: 'Consultation Gynécologique', tarif: 8000 }
      ]);
    }
  };

  // Étape 1: Recherche patient
  const handlePatientSearch = async () => {
    if (patientSearch.length < 2) return;
    
    try {
      const data = await consultationsAPI.searchPatients(patientSearch);
      setSearchResults(data.patients || []);
    } catch (error) {
      console.error('Erreur recherche patients:', error);
      // Données mock
      setSearchResults([
        { ID_BEN: 1, NOM_BEN: 'NDONGO', PRE_BEN: 'Jean', AGE: 44, TELEPHONE_MOBILE: '+237690123456' },
        { ID_BEN: 2, NOM_BEN: 'TCHUIDJANG', PRE_BEN: 'Marie', AGE: 34, TELEPHONE_MOBILE: '+237677890123' },
        { ID_BEN: 3, NOM_BEN: 'TABI', PRE_BEN: 'Paul', AGE: 39, TELEPHONE_MOBILE: '+237670987654' }
      ]);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.NOM_BEN} ${patient.PRE_BEN}`);
    setSearchResults([]);
    nextStep();
  };

  // Étape 2: Interface biométrique
  const startBiometricScan = () => {
    setIsBiometricMode(true);
    setBiometricStatus('scanning');
    
    // Simulation d'un scan biométrique
    setTimeout(() => {
      setBiometricScan('scan_success');
      setBiometricStatus('success');
      
      // Simulation de correspondance patient
      setTimeout(() => {
        const mockPatient = {
          ID_BEN: 1,
          NOM_BEN: 'NDONGO',
          PRE_BEN: 'Jean',
          AGE: 44,
          TELEPHONE_MOBILE: '+237690123456'
        };
        setSelectedPatient(mockPatient);
        setIsBiometricMode(false);
        nextStep();
      }, 1500);
    }, 3000);
  };

  // Étape 3: Paramétrage consultation
  const handleTypeChange = (type) => {
    setSelectedType(type);
    const selectedTypeObj = typesConsultation.find(t => t.type === type);
    if (selectedTypeObj) {
      const montant = isGratuit ? 0 : selectedTypeObj.tarif;
      setTarif(montant);
      calculateDecompte(montant);
    }
  };

  const handleGratuitToggle = () => {
    const newIsGratuit = !isGratuit;
    setIsGratuit(newIsGratuit);
    
    if (selectedType) {
      const selectedTypeObj = typesConsultation.find(t => t.type === selectedType);
      if (selectedTypeObj) {
        const montant = newIsGratuit ? 0 : selectedTypeObj.tarif;
        setTarif(montant);
        calculateDecompte(montant);
      }
    }
  };

  const calculateDecompte = (montant) => {
    const pourcentage = isGratuit ? 100 : 80;
    const montantPrisEnCharge = montant * (pourcentage / 100);
    const resteCharge = montant - montantPrisEnCharge;
    
    setDecompte({
      montantTotal: montant,
      montantPrisEnCharge,
      resteCharge,
      pourcentageCouverture: pourcentage
    });
  };

  // Étape 4: Validation
  const validateConsultation = async () => {
    if (!selectedPatient || !selectedMedecin || !selectedType) {
      alert('Veuillez compléter tous les champs obligatoires');
      return;
    }

    if (!confirm('⚠️ ÊTES-VOUS SÛR DE VOULOIR VALIDER CETTE CONSULTATION ?\n\nCette action est IRRÉVERSIBLE et rendra la consultation facturable.')) {
      return;
    }

    setValidationInProgress(true);

    try {
      const consultationData = {
        COD_BEN: selectedPatient.ID_BEN,
        COD_PRE: selectedMedecin,
        TYPE_CONSULTATION: selectedType,
        MONTANT_CONSULTATION: tarif,
        STATUT_PAIEMENT: isGratuit ? 'Gratuit' : (decompte.resteCharge > 0 ? 'À payer' : 'Tiers Payant'),
        COD_CREUTIL: localStorage.getItem('username') || 'SYSTEM'
      };

      const result = await consultationsAPI.create(consultationData);
      
      if (result.success && result.consultationId) {
        setGeneratedConsultationId(result.consultationId);
        setCurrentStep(5);
      } else {
        throw new Error(result.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setValidationInProgress(false);
    }
  };

  // Étape 5: Impression
  const handlePrintFeuille = async () => {
    if (!generatedConsultationId) return;
    
    try {
      const data = await consultationsAPI.generateFeuillePriseEnCharge(generatedConsultationId);
      if (data.success) {
        openPrintWindow(data.feuille, generatedConsultationId);
      }
    } catch (error) {
      console.error('Erreur impression:', error);
      alert('Erreur lors de la génération de la feuille');
    }
  };

  const openPrintWindow = (feuille, consultationId) => {
    const printWindow = window.open('', '_blank');
    
    // Structure HTML simplifiée pour l'impression
    const htmlContent = `
      <html>
        <head>
          <title>Feuille de Prise en Charge - ${consultationId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .page-break { page-break-after: always; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #000; padding: 8px; }
            .financial { background: #f5f5f5; padding: 15px; border-radius: 5px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FEUILLE DE PRISE EN CHARGE</h1>
            <h2>Consultation Médicale</h2>
            <p>Numéro: CONS-${consultationId} | Date: ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          
          <div class="section">
            <h3 class="section-title">INFORMATIONS PATIENT</h3>
            <table>
              <tr><th>Nom:</th><td>${selectedPatient?.NOM_BEN} ${selectedPatient?.PRE_BEN}</td></tr>
              <tr><th>Age:</th><td>${selectedPatient?.AGE} ans</td></tr>
              <tr><th>Téléphone:</th><td>${selectedPatient?.TELEPHONE_MOBILE}</td></tr>
            </table>
          </div>
          
          <div class="section">
            <h3 class="section-title">DÉTAILS CONSULTATION</h3>
            <table>
              <tr><th>Médecin:</th><td>${medecins.find(m => m.COD_PRE == selectedMedecin)?.NOM_COMPLET}</td></tr>
              <tr><th>Type:</th><td>${selectedType}</td></tr>
              <tr><th>Date:</th><td>${new Date().toLocaleString('fr-FR')}</td></tr>
            </table>
          </div>
          
          <div class="section">
            <h3 class="section-title">DÉCOMPTE FINANCIER</h3>
            <div class="financial">
              <p>Montant Total: <strong>${tarif.toLocaleString()} FCFA</strong></p>
              <p>Montant Prise en Charge: <strong>${decompte.montantPrisEnCharge.toLocaleString()} FCFA</strong></p>
              <p>Reste à Charge: <strong>${decompte.resteCharge.toLocaleString()} FCFA</strong></p>
              <p>Statut: <strong>${isGratuit ? 'GRATUIT' : decompte.resteCharge > 0 ? 'À PAYER' : 'TIERS PAYANT'}</strong></p>
            </div>
          </div>
          
          <div class="section signature">
            <p>Signature du Médecin:</p>
            <div style="margin-top: 50px; border-top: 1px solid #000; width: 300px;"></div>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Imprimer
            </button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Navigation
  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Étapes du workflow
  const steps = [
    { id: 1, title: 'Recherche Patient', icon: Users },
    { id: 2, title: 'Vérification Biométrique', icon: Fingerprint },
    { id: 3, title: 'Paramétrage', icon: Stethoscope },
    { id: 4, title: 'Validation', icon: CheckCircle },
    { id: 5, title: 'Impression', icon: Printer }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* En-tête */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Nouvelle Consultation</h2>
            <p className="text-gray-600">Workflow de création de consultation en 5 étapes</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Barre de progression */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep > step.id ? 'bg-green-500 border-green-500 text-white' :
                  currentStep === step.id ? 'bg-blue-600 border-blue-600 text-white' :
                  'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle size={20} />
                  ) : (
                    <step.icon size={20} />
                  )}
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    Étape {step.id}: {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-4 w-16 h-1 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Étape 1: Recherche patient */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Recherche du Patient</h3>
                <p className="text-gray-600">Saisissez le numéro de carte du patient ou utilisez le contrôle biométrique</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Recherche par carte */}
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Users className="text-blue-600" size={24} />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">Recherche par Carte</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numéro de Carte Patient
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            placeholder="Ex: CM12345678"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            onClick={handlePatientSearch}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Rechercher
                          </button>
                        </div>
                      </div>

                      {searchResults.length > 0 && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <p className="text-sm font-medium text-gray-700">Résultats de recherche</p>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {searchResults.map(patient => (
                              <div
                                key={patient.ID_BEN}
                                onClick={() => handlePatientSelect(patient)}
                                className="p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-gray-900">{patient.NOM_BEN} {patient.PRE_BEN}</p>
                                    <p className="text-sm text-gray-600">ID: {patient.ID_BEN} | Age: {patient.AGE} ans</p>
                                    <p className="text-sm text-gray-600">{patient.TELEPHONE_MOBILE}</p>
                                  </div>
                                  <ChevronRight className="text-gray-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interface biométrique */}
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Fingerprint className="text-purple-600" size={24} />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">Contrôle Biométrique</h4>
                    </div>
                    
                    <div className="text-center py-8">
                      <div className="mb-6">
                        <div className="relative mx-auto w-64 h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center border-4 border-purple-300">
                          <Camera className="text-purple-500" size={64} />
                          <div className="absolute inset-0 border-2 border-purple-400 rounded-full animate-ping opacity-20"></div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4">
                        Placez votre doigt sur le lecteur biométrique pour vérification
                      </p>
                      
                      <button
                        onClick={() => {
                          setIsBiometricMode(true);
                          setCurrentStep(2);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Scan size={20} />
                        Démarrer la vérification biométrique
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Vérification biométrique */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Vérification Biométrique</h3>
                <p className="text-gray-600">Authentification par empreinte digitale</p>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-8">
                  <div className="text-center">
                    <div className="mb-8">
                      <div className="relative mx-auto w-48 h-48">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full"></div>
                        
                        {biometricStatus === 'ready' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-32 h-32 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full flex items-center justify-center mb-4">
                              <Fingerprint className="text-white" size={64} />
                            </div>
                            <p className="text-purple-700 font-medium">Prêt à scanner</p>
                          </div>
                        )}
                        
                        {biometricStatus === 'scanning' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="relative">
                              <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center animate-pulse">
                                <Fingerprint className="text-white" size={64} />
                              </div>
                              <div className="absolute inset-0 border-4 border-purple-300 rounded-full animate-ping"></div>
                            </div>
                            <p className="text-purple-700 font-medium mt-4">Scan en cours...</p>
                            <p className="text-gray-600 text-sm">Ne retirez pas votre doigt</p>
                          </div>
                        )}
                        
                        {biometricStatus === 'success' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center mb-4">
                              <CheckCircle className="text-white" size={64} />
                            </div>
                            <p className="text-green-700 font-medium">Authentification réussie</p>
                            <p className="text-gray-600 text-sm">Patient identifié avec succès</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {biometricStatus === 'ready' && (
                      <button
                        onClick={startBiometricScan}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Fingerprint size={20} />
                        Commencer le scan biométrique
                      </button>
                    )}

                    {biometricStatus === 'scanning' && (
                      <div className="space-y-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                        </div>
                        <p className="text-gray-600">Analyse de l'empreinte en cours...</p>
                      </div>
                    )}

                    {biometricStatus === 'success' && (
                      <div className="space-y-4">
                        <div className="bg-white border border-green-200 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <UserCheck className="text-green-600" size={20} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Patient identifié: {selectedPatient?.NOM_BEN} {selectedPatient?.PRE_BEN}</p>
                              <p className="text-sm text-gray-600">Age: {selectedPatient?.AGE} ans | ID: {selectedPatient?.ID_BEN}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={nextStep}
                          className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Continuer vers le paramétrage
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Paramétrage consultation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Paramétrage de la Consultation</h3>
                <p className="text-gray-600">Configurez les détails de la consultation médicale</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Patient sélectionné */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <UserCheck className="text-blue-600" size={24} />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">Patient Sélectionné</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Nom Complet:</span>
                        <span className="font-semibold">{selectedPatient?.NOM_BEN} {selectedPatient?.PRE_BEN}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span className="font-semibold">{selectedPatient?.AGE} ans</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Téléphone:</span>
                        <span className="font-semibold">{selectedPatient?.TELEPHONE_MOBILE}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sélection médecin */}
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">Médecin Consulté *</span>
                      <select
                        value={selectedMedecin}
                        onChange={(e) => setSelectedMedecin(e.target.value)}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionnez un médecin</option>
                        {medecins.map(medecin => (
                          <option key={medecin.COD_PRE} value={medecin.COD_PRE}>
                            {medecin.NOM_COMPLET} - {medecin.SPECIALITE}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Type consultation et tarif */}
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">Type de Consultation *</span>
                      <select
                        value={selectedType}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionnez un type</option>
                        {typesConsultation.map(type => (
                          <option key={type.type} value={type.type}>
                            {type.type} - {type.tarif.toLocaleString()} FCFA
                          </option>
                        ))}
                      </select>
                    </label>

                    {/* Tarif automatique */}
                    {tarif > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Tarif automatique:</span>
                          <span className="text-xl font-bold text-blue-600">{tarif.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    )}

                    {/* Option gratuite */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="gratuit"
                        checked={isGratuit}
                        onChange={handleGratuitToggle}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="gratuit" className="ml-2 text-sm text-gray-700">
                        Consultation gratuite (forcer le montant à 0)
                      </label>
                    </div>

                    {/* Prévisualisation décompte */}
                    {tarif > 0 && (
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="text-blue-600" size={20} />
                          <h5 className="font-semibold text-gray-800">Prévisualisation du Décompte</h5>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Montant Total:</span>
                            <span className="font-semibold">{decompte.montantTotal.toLocaleString()} FCFA</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Prise en Charge ({decompte.pourcentageCouverture}%):</span>
                            <span className="text-green-600 font-semibold">{decompte.montantPrisEnCharge.toLocaleString()} FCFA</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span>Reste à Charge:</span>
                            <span className="text-red-600 font-bold">{decompte.resteCharge.toLocaleString()} FCFA</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 4: Validation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Validation et Décompte Final</h3>
                <p className="text-gray-600">Vérifiez les informations avant validation définitive</p>
              </div>

              <div className="max-w-3xl mx-auto">
                {/* Résumé complet */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl p-8 mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-6 text-center">Récapitulatif de la Consultation</h4>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Informations patient */}
                    <div className="space-y-4">
                      <h5 className="font-medium text-gray-700 border-b pb-2">Informations Patient</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nom:</span>
                          <span className="font-semibold">{selectedPatient?.NOM_BEN} {selectedPatient?.PRE_BEN}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Age:</span>
                          <span className="font-semibold">{selectedPatient?.AGE} ans</span>
                        </div>
                      </div>
                    </div>

                    {/* Informations consultation */}
                    <div className="space-y-4">
                      <h5 className="font-medium text-gray-700 border-b pb-2">Détails Consultation</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Médecin:</span>
                          <span className="font-semibold">
                            {medecins.find(m => m.COD_PRE == selectedMedecin)?.NOM_COMPLET}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-semibold">{selectedType}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Décompte financier */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h5 className="font-medium text-gray-700 mb-4 text-center">Décompte Financier</h5>
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-gray-700">Montant Consultation</span>
                          <span className="text-xl font-bold text-gray-800">{tarif.toLocaleString()} FCFA</span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-gray-700">
                            Prise en Charge ({isGratuit ? '100%' : '80%'})
                          </span>
                          <span className="text-lg font-semibold text-green-600">
                            {decompte.montantPrisEnCharge.toLocaleString()} FCFA
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-700 font-medium">RESTE À CHARGE</span>
                          <span className={`text-2xl font-bold ${
                            decompte.resteCharge === 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {decompte.resteCharge.toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Avertissement important */}
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <AlertCircle className="text-red-600" size={24} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-red-800 mb-2">ATTENTION - ACTION IRRÉVERSIBLE</h5>
                      <p className="text-red-700">
                        La validation de cette consultation la rendra définitive et facturable. 
                        Cette action ne peut pas être annulée. Vérifiez soigneusement toutes les informations avant de continuer.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Boutons action */}
                <div className="flex justify-between">
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <ChevronLeft size={20} />
                    Retour au paramétrage
                  </button>
                  
                  <button
                    onClick={validateConsultation}
                    disabled={validationInProgress || !selectedPatient || !selectedMedecin || !selectedType}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {validationInProgress ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Validation en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        Valider définitivement la consultation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Étape 5: Impression */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="text-white" size={48} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Consultation Créée avec Succès!</h3>
                <p className="text-gray-600">
                  La consultation a été enregistrée et est maintenant facturable.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
                  <span className="font-mono font-bold">CONS-{generatedConsultationId?.toString().padStart(6, '0')}</span>
                </div>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-6 text-center">Génération de la Feuille de Prise en Charge</h4>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
                      <div className="mb-4">
                        <FileText className="mx-auto text-blue-600" size={48} />
                      </div>
                      <h5 className="font-semibold text-gray-800 mb-2">Visualiser la Feuille</h5>
                      <p className="text-sm text-gray-600">Aperçu avant impression</p>
                    </div>
                    
                    <div 
                      onClick={handlePrintFeuille}
                      className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="mb-4">
                        <Printer className="mx-auto text-green-600" size={48} />
                      </div>
                      <h5 className="font-semibold text-gray-800 mb-2">Imprimer la Feuille</h5>
                      <p className="text-sm text-gray-600">3 pages format A4</p>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-amber-600 mt-1" size={20} />
                      <div>
                        <p className="text-amber-800 text-sm">
                          <strong>Important:</strong> La feuille de prise en charge comprend 3 pages : 
                          page 1 pour la consultation, pages 2-3 pour les prescriptions futures.
                          Assurez-vous de distribuer toutes les pages au patient.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={handlePrintFeuille}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Printer size={20} />
                  Imprimer la Feuille Complète
                </button>
                
                <button
                  onClick={() => {
                    onComplete();
                    if (generatedConsultationId) {
                      handlePrintFeuille();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Terminer et Retour au Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pied de page */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Étape {currentStep} sur {steps.length} • HealthCenterSoft
            </div>
            
            <div className="flex gap-3">
              {currentStep > 1 && currentStep < 5 && (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  <ChevronLeft size={18} />
                  Étape précédente
                </button>
              )}
              
              {currentStep < 4 && (
                <button
                  onClick={nextStep}
                  disabled={!selectedPatient && currentStep === 1}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Étape suivante
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationWizardModal;