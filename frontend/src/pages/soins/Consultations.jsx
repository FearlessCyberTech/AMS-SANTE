import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../services/api';
import './Consultations.css';

// Composant Scanner de Code-Barres
const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef(null);
  const qrcodeRegionId = 'html5-qrcode-scanner-container';

  // Configuration pour le scanner
  const config = {
    fps: 10,
    qrbox: { width: 250, height: 150 },
    aspectRatio: 1.777778,
    rememberLastUsedCamera: true,
    formatsToSupport: [
      1, // QR_CODE
      2, // CODE_128
      3, // CODE_39
      10, // EAN_13
      14  // UPC_A
    ],
    showTorchButtonIfSupported: true
  };

  useEffect(() => {
    if (scannerRef.current) return;

    const onSuccess = (decodedText) => {
      console.log(`Scan réussi: ${decodedText}`);
      onScanSuccess(decodedText);
      stopScanner();
    };

    const onError = (error) => {
      console.warn('Erreur de scan:', error);
    };

    scannerRef.current = new Html5QrcodeScanner(qrcodeRegionId, config, false);
    scannerRef.current.render(onSuccess, onError);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Erreur lors du nettoyage:", error);
        });
        scannerRef.current = null;
      }
    };
  }, []);

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }
    if (onClose) onClose();
  };

  return (
    <div className="scanner-modal-overlay">
      <div className="scanner-modal">
        <div className="scanner-header">
          <h3>📷 Scanner le code-barres du patient</h3>
          <button onClick={stopScanner} className="close-button">×</button>
        </div>
        <div id={qrcodeRegionId} className="scanner-container" />
        <div className="scanner-instructions">
          <p>• Placez le code-barres dans le cadre</p>
          <p>• La lecture est automatique</p>
          <p>• Éclairage suffisant recommandé</p>
        </div>
      </div>
    </div>
  );
};

const Consultations = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  // ============= ÉTATS PRINCIPAUX =============
  const [searchType, setSearchType] = useState('identifiant');
  const [searchValue, setSearchValue] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medecins, setMedecins] = useState([]);
  const [selectedMedecin, setSelectedMedecin] = useState('');
  const [typesConsultation, setTypesConsultation] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [montant, setMontant] = useState(0);
  const [gratuite, setGratuite] = useState(false);
  const [centreMedecin, setCentreMedecin] = useState(null);
  const [tiersPayant, setTiersPayant] = useState(false);
  const [pourcentageCouverture, setPourcentageCouverture] = useState(0);
  const [montantTotal, setMontantTotal] = useState(0);
  const [montantPrisEnCharge, setMontantPrisEnCharge] = useState(0);
  const [resteCharge, setResteCharge] = useState(0);
  const [observations, setObservations] = useState('');
  const [examens, setExamens] = useState('');
  const [traitements, setTraitements] = useState('');
  const [recommandations, setRecommandations] = useState('');
  const [dateRendezVous, setDateRendezVous] = useState('');
  const [assurePrincipal, setAssurePrincipal] = useState('');
  const [typePaiement, setTypePaiement] = useState(null);
  const [feuilleData, setFeuilleData] = useState(null);
  const [consultationId, setConsultationId] = useState(null);
  const [ta, setTa] = useState('');
  const [poids, setPoids] = useState('');
  const [taille, setTaille] = useState('');
  const [temperature, setTemperature] = useState('');
  const [pouls, setPouls] = useState('');
  const [freqResp, setFreqResp] = useState('');
  const [glycemie, setGlycemie] = useState('');

  // ============= USE EFFECT =============
  useEffect(() => {
    loadMedecins();
    loadTypesConsultation();
  }, []);

  useEffect(() => {
    calculateDecompte();
  }, [montantTotal, gratuite, tiersPayant, pourcentageCouverture]);

  useEffect(() => {
    if (selectedPatient) {
      loadTypePaiement(selectedPatient.ID_BEN);
      if (selectedPatient.STATUT_ACE !== 'Principal' && selectedPatient.NOM_ASSURE_PRINCIPAL) {
        const nomAssure = `${selectedPatient.NOM_ASSURE_PRINCIPAL || ''} ${selectedPatient.PRE_ASSURE_PRINCIPAL || ''}`.trim();
        setAssurePrincipal(nomAssure);
      }
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (selectedMedecin) {
      const medecin = medecins.find(m => m.COD_PRE === parseInt(selectedMedecin));
      setCentreMedecin(medecin?.COD_CEN || null);
    } else {
      setCentreMedecin(null);
    }
  }, [selectedMedecin, medecins]);

  // ============= FONCTIONS D'INITIALISATION =============
  const loadMedecins = async () => {
    try {
      const response = await api.consultations.getMedecins();
      if (response.success) {
        setMedecins(response.medecins);
      } else {
        toast.error(response.message || 'Erreur lors du chargement des médecins');
      }
    } catch (error) {
      console.error('Erreur chargement médecins:', error);
      toast.error('Erreur réseau lors du chargement des médecins');
    }
  };

  const loadTypesConsultation = async () => {
    try {
      const response = await api.consultations.getTypesConsultation();
      if (response.success && response.types) {
        const transformedTypes = response.types.map(type => ({
          COD_TYP_CONS: type.id || type.COD_TYP_CONS,
          LIB_TYP_CONS: type.libelle || type.LIB_TYP_CONS,
          MONTANT: type.tarif || type.MONTANT
        }));
        setTypesConsultation(transformedTypes);
      } else {
        setTypesConsultation([]);
        toast.error('Aucun type de consultation disponible');
      }
    } catch (error) {
      console.error('Erreur chargement types:', error);
      toast.error('Erreur lors du chargement des types de consultation');
      setTypesConsultation([]);
    }
  };

  const loadTypePaiement = async (idBen) => {
    try {
      if (api.consultations && typeof api.consultations.getTypePaiementBeneficiaire === 'function') {
        const response = await api.consultations.getTypePaiementBeneficiaire(idBen);
        if (response.success && response.typePaiement) {
          const type = response.typePaiement;
          setTypePaiement(type);
          if (type.TAUX_COUVERTURE && type.TAUX_COUVERTURE > 0) {
            setTiersPayant(true);
            setPourcentageCouverture(type.TAUX_COUVERTURE);
          } else {
            setTiersPayant(false);
            setPourcentageCouverture(0);
          }
        }
      } else {
        const defaultTypePaiement = {
          LIB_PAI: selectedPatient?.STATUT_ACE === 'Principal' ? 'Tiers payant' : 'À charge',
          TAUX_COUVERTURE: selectedPatient?.STATUT_ACE === 'Principal' ? 80 : 50
        };
        setTypePaiement(defaultTypePaiement);
        if (defaultTypePaiement.TAUX_COUVERTURE > 0) {
          setTiersPayant(true);
          setPourcentageCouverture(defaultTypePaiement.TAUX_COUVERTURE);
        }
      }
    } catch (error) {
      console.error('Erreur chargement type paiement:', error);
      setTypePaiement({ LIB_PAI: 'Non disponible', TAUX_COUVERTURE: 0 });
      setTiersPayant(false);
      setPourcentageCouverture(0);
    }
  };

  // ============= ÉTAPE 1: RECHERCHE PATIENT =============
  const handleScanSuccess = (scannedData) => {
    setSearchValue(scannedData);
    setSearchType('carte');
    setShowScanner(false);
    handleSearchPatient(scannedData);
  };

  const handleSearchPatient = async (scannedValue = null) => {
    const valueToSearch = scannedValue || searchValue;
    if (!valueToSearch.trim()) {
      toast.warning('Veuillez saisir une valeur de recherche');
      return;
    }

    setLoading(true);
    try {
      let response;
      const searchMethod = scannedValue ? 'carte' : searchType;
      
      if (searchMethod === 'identifiant') {
        response = await api.consultations.searchPatients(valueToSearch);
      } else if (searchMethod === 'carte') {
        response = await api.consultations.searchByCard(valueToSearch);
      } else if (searchMethod === 'nom') {
        response = await api.consultations.searchPatients(valueToSearch);
      }
      
      if (response && response.success) {
        setPatients(response.patients || []);
        if (response.patients.length === 0) {
          toast.info('Aucun patient trouvé');
        }
      }
    } catch (error) {
      console.error('Erreur recherche patient:', error);
      toast.error('Erreur lors de la recherche du patient');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    toast.success(`Patient sélectionné: ${patient.NOM_BEN} ${patient.PRE_BEN}`);
    setTimeout(() => setCurrentStep(2), 500);
  };

  // ============= ÉTAPE 2: PARAMÉTRAGE =============
  const handleTypeChange = (typeValue) => {
    setSelectedType(typeValue);
    const typeData = typesConsultation.find(t => t.LIB_TYP_CONS === typeValue);
    if (typeData && typeData.MONTANT !== undefined) {
      setMontant(typeData.MONTANT);
      setMontantTotal(typeData.MONTANT);
    } else {
      setMontant(0);
      setMontantTotal(0);
    }
  };

  const handleGratuiteChange = (checked) => {
    setGratuite(checked);
    if (checked) {
      setMontant(0);
      setMontantTotal(0);
      setTiersPayant(false);
    } else {
      const typeData = typesConsultation.find(t => t.LIB_TYP_CONS === selectedType);
      if (typeData) {
        setMontant(typeData.MONTANT);
        setMontantTotal(typeData.MONTANT);
      }
    }
  };

  // ============= CALCUL DÉCOMPTE =============
  const calculateDecompte = () => {
    const total = montantTotal || 0;
    let prisEnCharge = 0;
    let reste = total;

    if (gratuite) {
      prisEnCharge = total;
      reste = 0;
    } else if (tiersPayant && pourcentageCouverture > 0) {
      prisEnCharge = total * (pourcentageCouverture / 100);
      reste = total - prisEnCharge;
    } else {
      prisEnCharge = 0;
      reste = total;
    }

    setMontantPrisEnCharge(prisEnCharge);
    setResteCharge(reste);
  };

  // ============= ÉTAPE 4: VALIDATION =============
  const handleValidate = async () => {
    if (!selectedPatient) {
      toast.error('Veuillez sélectionner un patient');
      return;
    }
    if (!selectedMedecin) {
      toast.error('Veuillez sélectionner un médecin');
      return;
    }
    if (!selectedType) {
      toast.error('Veuillez sélectionner un type de consultation');
      return;
    }

    const medecin = medecins.find(m => m.COD_PRE === parseInt(selectedMedecin));
    const confirmMessage = `⚠️ CONFIRMATION DÉFINITIVE\n\nCette action est irréversible. La consultation sera enregistrée et facturable.\n\nPatient: ${selectedPatient.NOM_BEN} ${selectedPatient.PRE_BEN}\nMédecin: ${medecin?.NOM_PRESTATAIRE || 'Non spécifié'}\nType: ${selectedType}\nMontant: ${montantTotal.toLocaleString()} FCFA\n${dateRendezVous ? `Rendez-vous: ${new Date(dateRendezVous).toLocaleDateString('fr-FR')}` : ''}\nCliquez sur OK pour confirmer.`;

    if (!window.confirm(confirmMessage.replace(/\n\n\n/g, '\n\n'))) return;

    setLoading(true);
    try {
      const now = new Date();
      const dateFormatted = now.toISOString().slice(0, 19).replace('T', ' ');
      const prochainRdvFormatted = dateRendezVous 
        ? new Date(dateRendezVous).toISOString().split('T')[0]
        : null;

      let statutPaiement = 'À payer';
      if (gratuite) {
        statutPaiement = 'Gratuit';
      } else if (tiersPayant && pourcentageCouverture > 0) {
        statutPaiement = 'Tiers Payant';
      }

      const consultationData = {
        COD_BEN: selectedPatient.ID_BEN,
        COD_CEN: centreMedecin,
        COD_PRE: parseInt(selectedMedecin),
        DATE_CONSULTATION: dateFormatted,
        TYPE_CONSULTATION: selectedType,
        MOTIF_CONSULTATION: 'Consultation médicale',
        OBSERVATIONS: observations,
        DIAGNOSTIC: 'À déterminer',
        TA: ta,
        POIDS: poids ? parseFloat(poids) : null,
        TAILLE: taille ? parseFloat(taille) : null,
        TEMPERATURE: temperature ? parseFloat(temperature) : null,
        POULS: pouls ? parseInt(pouls) : null,
        FREQUENCE_RESPIRATOIRE: freqResp ? parseInt(freqResp) : null,
        GLYCEMIE: glycemie ? parseFloat(glycemie) : null,
        EXAMENS_COMPLEMENTAIRES: examens,
        TRAITEMENT_PRESCRIT: traitements,
        PROCHAIN_RDV: prochainRdvFormatted,
        MONTANT_CONSULTATION: montantTotal,
        STATUT_PAIEMENT: statutPaiement,
        URGENT: false,
        HOSPITALISATION: false,
        MONTANT_PRISE_EN_CHARGE: montantPrisEnCharge,
        RESTE_A_CHARGE: resteCharge,
        TAUX_PRISE_EN_CHARGE: tiersPayant ? pourcentageCouverture : 0
      };

      console.log('Données envoyées pour création:', consultationData);
      const response = await api.consultations.create(consultationData);
      
      if (response.success) {
        setConsultationId(response.consultationId);
        toast.success('Consultation enregistrée avec succès!');
        setCurrentStep(5);
      } else {
        toast.error(response.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      toast.error('Erreur lors de l\'enregistrement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============= FONCTIONS UTILITAIRES =============
  const getStatutACE = () => {
    if (!selectedPatient?.STATUT_ACE) return 'Non spécifié';
    return selectedPatient.STATUT_ACE;
  };

  const getTransformedFeuilleData = () => {
    const medecin = medecins.find(m => m.COD_PRE === parseInt(selectedMedecin));
    return {
      page1: {
        entete: {
          numero: `CONS-${consultationId?.toString().padStart(6, '0') || '000000'}`,
          date: new Date().toLocaleDateString('fr-FR'),
          centre: 'Centre de Santé Principal'
        },
        patient: {
          nom: selectedPatient ? `${selectedPatient.NOM_BEN} ${selectedPatient.PRE_BEN}` : 'NOM DU PATIENT',
          sexe: selectedPatient?.SEX_BEN === 'M' ? 'Masculin' : 'Féminin',
          dateNaissance: selectedPatient?.NAI_BEN ? new Date(selectedPatient.NAI_BEN).toLocaleDateString('fr-FR') : 'N/A',
          age: selectedPatient?.AGE || 'N/A',
          identifiant: selectedPatient?.IDENTIFIANT_NATIONAL || 'N/A',
          entreprise: selectedPatient?.EMPLOYEUR || 'Non spécifié',
          statutACE: getStatutACE(),
          assurePrincipal: assurePrincipal || `${selectedPatient?.NOM_ASSURE_PRINCIPAL || ''} ${selectedPatient?.PRE_ASSURE_PRINCIPAL || ''}`.trim() || 'Non spécifié'
        },
        consultation: {
          date: new Date().toLocaleString('fr-FR'),
          medecin: medecin ? `${medecin.NOM_PRESTATAIRE} ${medecin.PRENOM_PRESTATAIRE || ''}` : 'DR. MÉDECIN',
          specialite: medecin?.SPECIALITE || 'Spécialité',
          type: selectedType || 'Type de consultation',
          motif: 'Consultation médicale',
          diagnostic: 'À déterminer'
        }
      },
      page2: {
        observations: observations || '______________________________________________________________________________________\n______________________________________________________________________________________',
        examens: examens || '______________________________________________________________________________________\n______________________________________________________________________________________',
        traitement: traitements || '______________________________________________________________________________________\n______________________________________________________________________________________',
        recommandations: recommandations || '______________________________________________________________________________________\n______________________________________________________________________________________',
        prochainRdv: dateRendezVous ? new Date(dateRendezVous).toLocaleDateString('fr-FR') : '_____________________________'
      },
      page3: {
        financier: {
          montantFormate: montantTotal.toLocaleString(),
          statutPaiement: gratuite ? 'Gratuit' : (tiersPayant ? 'Tiers Payant' : 'À payer'),
          montantPriseEnCharge: montantPrisEnCharge,
          resteCharge: resteCharge,
          tauxCouverture: pourcentageCouverture
        },
        administratif: {
          cachetCentre: 'Centre de Santé Principal',
          signatureMedecin: medecin ? `${medecin.NOM_PRESTATAIRE} ${medecin.PRENOM_PRESTATAIRE || ''}` : '________________________',
          dateGeneration: new Date().toLocaleDateString('fr-FR'),
          codeConsultation: consultationId?.toString() || 'N/A'
        }
      }
    };
  };

  const handleNewConsultation = () => {
    setCurrentStep(1);
    setSearchValue('');
    setPatients([]);
    setSelectedPatient(null);
    setSelectedMedecin('');
    setSelectedType('');
    setMontant(0);
    setGratuite(false);
    setTiersPayant(false);
    setPourcentageCouverture(0);
    setMontantTotal(0);
    setMontantPrisEnCharge(0);
    setResteCharge(0);
    setFeuilleData(null);
    setConsultationId(null);
    setTypePaiement(null);
    setCentreMedecin(null);
    setObservations('');
    setExamens('');
    setTraitements('');
    setRecommandations('');
    setTa('');
    setPoids('');
    setTaille('');
    setTemperature('');
    setPouls('');
    setFreqResp('');
    setGlycemie('');
    setDateRendezVous('');
    setAssurePrincipal('');
    toast.info('Nouvelle consultation prête');
  };

  const handlePrint = () => {
    const feuilleData = getTransformedFeuilleData();
    setFeuilleData(feuilleData);
    
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.error('Veuillez autoriser les popups pour l\'impression');
      return;
    }

    const htmlContent = `<!DOCTYPE html><html><head><title>Feuille de Prise en Charge - Consultation ${consultationId}</title><meta charset="UTF-8"><style>${printStyles}</style></head><body>${printContent(feuilleData)}<script>window.onload=function(){setTimeout(()=>window.print(),500);window.onafterprint=function(){setTimeout(()=>window.close(),500);};}</script></body></html>`;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // ============= COMPOSANTS INTERNES =============
  const MedicalInfoStep = () => {
    return (
      <div className="step-container">
        <h2 className="step-title">3. INFORMATIONS MÉDICALES</h2>
        <p className="step-description">Ces informations seront enregistrées et imprimées sur la feuille de prise en charge.</p>
        
        <div className="form-group">
          <label className="form-label">Date du prochain rendez-vous (optionnel)</label>
          <input
            type="date"
            value={dateRendezVous}
            onChange={(e) => setDateRendezVous(e.target.value)}
            className="form-input"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {selectedPatient && selectedPatient.STATUT_ACE !== 'Principal' && (
          <div className="section bordered">
            <h3 className="section-header">INFORMATION SUR L'ASSURÉ PRINCIPAL</h3>
            <div className="form-group">
              <label className="form-label">Nom de l'assuré principal</label>
              <input
                type="text"
                value={assurePrincipal}
                onChange={(e) => setAssurePrincipal(e.target.value)}
                placeholder="Saisir le nom complet de l'assuré principal"
                className="form-input"
              />
            </div>
          </div>
        )}

        <div className="section bordered">
          <h3 className="section-header">SIGNES VITAUX</h3>
          <div className="vitals-grid">
            <div className="form-group">
              <label className="form-label">Tension artérielle (TA)</label>
              <input type="text" value={ta} onChange={(e) => setTa(e.target.value)} placeholder="Ex: 120/80" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Poids (kg)</label>
              <input type="number" value={poids} onChange={(e) => setPoids(e.target.value)} placeholder="Ex: 70" className="form-input" min="0" step="0.1" />
            </div>
            <div className="form-group">
              <label className="form-label">Taille (cm)</label>
              <input type="number" value={taille} onChange={(e) => setTaille(e.target.value)} placeholder="Ex: 175" className="form-input" min="0" step="0.1" />
            </div>
            <div className="form-group">
              <label className="form-label">Température (°C)</label>
              <input type="number" value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="Ex: 37.5" className="form-input" min="0" step="0.1" />
            </div>
            <div className="form-group">
              <label className="form-label">Pouls (bpm)</label>
              <input type="number" value={pouls} onChange={(e) => setPouls(e.target.value)} placeholder="Ex: 72" className="form-input" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Fréquence respiratoire</label>
              <input type="number" value={freqResp} onChange={(e) => setFreqResp(e.target.value)} placeholder="Ex: 16" className="form-input" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Glycémie (g/L)</label>
              <input type="number" value={glycemie} onChange={(e) => setGlycemie(e.target.value)} placeholder="Ex: 1.0" className="form-input" min="0" step="0.1" />
            </div>
          </div>
        </div>

        <div className="medical-info-grid">
          <div className="medical-section">
            <div className="form-group">
              <label className="form-label">Observations médicales</label>
              <textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Saisir les observations médicales (optionnel)" className="medical-textarea" rows={3} />
              <p className="form-hint">(Limitez à 2-3 lignes maximum)</p>
            </div>
            <div className="form-group">
              <label className="form-label">Examens complémentaires prescrits</label>
              <textarea value={examens} onChange={(e) => setExamens(e.target.value)} placeholder="Liste des examens complémentaires (optionnel)" className="medical-textarea" rows={3} />
              <p className="form-hint">(Limitez à 2-3 lignes maximum)</p>
            </div>
          </div>
          <div className="medical-section">
            <div className="form-group">
              <label className="form-label">Traitement prescrit</label>
              <textarea value={traitements} onChange={(e) => setTraitements(e.target.value)} placeholder="Médicaments et posologie (optionnel)" className="medical-textarea" rows={3} />
              <p className="form-hint">(Limitez à 2-3 lignes maximum)</p>
            </div>
            <div className="form-group">
              <label className="form-label">Recommandations et conseils</label>
              <textarea value={recommandations} onChange={(e) => setRecommandations(e.target.value)} placeholder="Recommandations pour le patient (optionnel)" className="medical-textarea" rows={3} />
              <p className="form-hint">(Limitez à 2-3 lignes maximum)</p>
            </div>
          </div>
        </div>

        <div className="navigation-buttons">
          <button onClick={() => setCurrentStep(2)} className="secondary-button">← Retour au paramétrage</button>
          <button onClick={() => setCurrentStep(4)} className="primary-button">Continuer vers validation →</button>
        </div>
      </div>
    );
  };

  // ============= RENDU PRINCIPAL =============
  return (
    <div className="consultations-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="header-section">
        <button onClick={() => navigate('/dashboard')} className="back-button">← Retour</button>
        <h1 className="main-title">GESTION DES CONSULTATIONS</h1>
        <div className="steps-indicator">
          <div className="steps-line">
            <div className={`step-circle ${currentStep >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step-connector ${currentStep >= 2 ? 'active' : ''}`}></div>
            <div className={`step-circle ${currentStep >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step-connector ${currentStep >= 3 ? 'active' : ''}`}></div>
            <div className={`step-circle ${currentStep >= 3 ? 'active' : ''}`}>3</div>
            <div className={`step-connector ${currentStep >= 4 ? 'active' : ''}`}></div>
            <div className={`step-circle ${currentStep >= 4 ? 'active' : ''}`}>4</div>
            <div className={`step-connector ${currentStep >= 5 ? 'active' : ''}`}></div>
            <div className={`step-circle ${currentStep >= 5 ? 'active' : ''}`}>5</div>
          </div>
          <div className="steps-labels">
            <span>Patient</span><span>Paramétrage</span><span>Médical</span><span>Validation</span><span>Impression</span>
          </div>
        </div>
      </div>

      {currentStep === 1 && (
        <div className="step-container">
          <h2 className="step-title">1. IDENTIFICATION DU PATIENT</h2>
          
          <div className="search-section">
            <div className="search-type-selector">
              <button onClick={() => { setSearchType('identifiant'); setShowScanner(false); }} className={`search-type-btn ${searchType === 'identifiant' ? 'active' : ''}`}>Identifiant national</button>
              <button onClick={() => { setSearchType('carte'); setShowScanner(false); }} className={`search-type-btn ${searchType === 'carte' ? 'active' : ''}`}>Carte d'assuré</button>
              <button onClick={() => { setSearchType('nom'); setShowScanner(false); }} className={`search-type-btn ${searchType === 'nom' ? 'active' : ''}`}>Nom</button>
              <button onClick={() => { setSearchType('scanner'); setShowScanner(true); }} className={`search-type-btn ${searchType === 'scanner' ? 'active' : ''}`}>📷 Scanner code-barres</button>
            </div>

            <div className="search-input-group">
              {!showScanner ? (
                <>
                  <div className="form-group">
                    <label className="form-label">
                      {searchType === 'identifiant' ? 'Identifiant national' : 
                       searchType === 'carte' ? 'Numéro de carte' : 
                       'Nom du patient'}
                    </label>
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder={searchType === 'identifiant' ? 'Ex: CM12345678' : searchType === 'carte' ? 'Numéro de carte' : 'Nom ou prénom'}
                      className="form-input"
                    />
                  </div>
                  <button onClick={() => handleSearchPatient()} disabled={loading || !searchValue.trim()} className="search-button">
                    {loading ? 'Recherche en cours...' : 'Rechercher'}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p>Veuillez scanner le code-barres de la carte du patient.</p>
                  <button onClick={() => setShowScanner(false)} className="secondary-button">Annuler le scan</button>
                </div>
              )}
            </div>
          </div>

          {showScanner && (
            <BarcodeScanner
              onScanSuccess={handleScanSuccess}
              onClose={() => setShowScanner(false)}
            />
          )}

          {patients.length > 0 && (
            <div className="patients-list-section">
              <h3 className="section-subtitle">Patients trouvés:</h3>
              <div className="patients-list">
                {patients.map((patient, index) => (
                  <div key={`patient-${patient.ID_BEN || index}`} className={`patient-card ${selectedPatient?.ID_BEN === patient.ID_BEN ? 'selected' : ''}`} onClick={() => handleSelectPatient(patient)}>
                    <div className="patient-info">
                      <div>
                        <p className="patient-name">{patient.NOM_BEN} {patient.PRE_BEN}</p>
                        <p className="patient-details">ID: {patient.IDENTIFIANT_NATIONAL} | Âge: {patient.AGE} ans | Sexe: {patient.SEX_BEN === 'M' ? 'M' : 'F'}</p>
                        <p className="patient-details">Tél: {patient.TELEPHONE_MOBILE}</p>
                        {patient.EMPLOYEUR && <p className="patient-details"><strong>Employeur:</strong> {patient.EMPLOYEUR}</p>}
                        {patient.STATUT_ACE && <p className="patient-details"><strong>Statut ACE:</strong> {patient.STATUT_ACE}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedPatient && (
            <div className="selected-patient-card">
              <p className="success-message">Patient sélectionné:</p>
              <p>{selectedPatient.NOM_BEN} {selectedPatient.PRE_BEN}</p>
              <p>ID: {selectedPatient.IDENTIFIANT_NATIONAL} | Âge: {selectedPatient.AGE} ans</p>
              {selectedPatient.EMPLOYEUR && <p><strong>Employeur:</strong> {selectedPatient.EMPLOYEUR}</p>}
              {selectedPatient.STATUT_ACE && <p><strong>Statut ACE:</strong> {selectedPatient.STATUT_ACE}</p>}
              <button onClick={() => setCurrentStep(2)} className="continue-button">Continuer →</button>
            </div>
          )}
        </div>
      )}

      {currentStep === 2 && (
        <div className="step-container">
          <h2 className="step-title">2. PARAMÉTRAGE DE LA CONSULTATION</h2>
          <div className="configuration-grid">
            <div className="form-section">
              <div className="form-group">
                <label className="form-label">Médecin consulté <button type="button" onClick={loadMedecins} className="refresh-button" title="Rafraîchir">⟳</button></label>
                <select value={selectedMedecin} onChange={(e) => setSelectedMedecin(e.target.value)} className="form-select">
                  <option value="">Sélectionnez un médecin</option>
                  {medecins.map((medecin, index) => (
                    <option key={`medecin-${medecin.COD_PRE || index}`} value={medecin.COD_PRE}>{`${medecin.NOM_PRESTATAIRE || ''} ${medecin.PRENOM_PRESTATAIRE || ''}`.trim()} - {medecin.SPECIALITE}</option>
                  ))}
                </select>
                <p className="form-hint">{medecins.length === 0 ? 'Aucun médecin disponible. Cliquez sur ⟳ pour rafraîchir.' : `${medecins.length} médecin(s) disponible(s)`}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Type de consultation</label>
                <select value={selectedType} onChange={(e) => handleTypeChange(e.target.value)} className="form-select">
                  <option value="">Sélectionnez un type</option>
                  {typesConsultation.map((type, index) => (
                    <option key={`type-${type.COD_TYP_CONS || type.LIB_TYP_CONS || index}`} value={type.LIB_TYP_CONS}>{type.LIB_TYP_CONS} - {(type.MONTANT || 0).toLocaleString()} FCFA</option>
                  ))}
                </select>
              </div>
              <div className="checkbox-group">
                <label className="checkbox-label"><input type="checkbox" checked={gratuite} onChange={(e) => handleGratuiteChange(e.target.checked)} className="checkbox-input" /><span className="checkbox-text">Consultation gratuite (montant à 0)</span></label>
              </div>
            </div>
            <div className="summary-section">
              <div className="summary-card">
                <h3 className="summary-title">Résumé</h3>
                {selectedPatient && <div className="summary-item"><p><strong>Patient:</strong> {selectedPatient.NOM_BEN} {selectedPatient.PRE_BEN}</p><p><strong>Âge:</strong> {selectedPatient.AGE} ans</p><p><strong>Statut ACE:</strong> {getStatutACE()}</p>{selectedPatient.EMPLOYEUR && <p><strong>Employeur:</strong> {selectedPatient.EMPLOYEUR}</p>}</div>}
                {selectedMedecin && <div className="summary-item"><p><strong>Médecin:</strong> {medecins.find(m => m.COD_PRE === parseInt(selectedMedecin))?.NOM_PRESTATAIRE}</p></div>}
                {selectedType && <div className="summary-item"><p><strong>Type:</strong> {selectedType}</p><p><strong>Tarif:</strong> {(montant || 0).toLocaleString()} FCFA</p></div>}
                {typePaiement && <div className="summary-item"><p><strong>Type de paiement:</strong> {typePaiement.LIB_PAI}</p><p><strong>Taux couverture:</strong> {typePaiement.TAUX_COUVERTURE}%</p></div>}
                {gratuite && <div className="warning-box"><p className="warning-text">⚠️ Consultation gratuite activée</p></div>}
              </div>
              <div className="navigation-buttons">
                <button onClick={() => setCurrentStep(1)} className="secondary-button">← Retour</button>
                <button onClick={() => setCurrentStep(3)} disabled={!selectedMedecin || !selectedType} className="primary-button">Continuer vers informations médicales →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && <MedicalInfoStep />}

      {currentStep === 4 && (
        <div className="step-container">
          <h2 className="step-title">4. DÉCOMPTE FINANCIER ET VALIDATION</h2>
          <div className="decompte-grid">
            <div className="decompte-form-section">
              <div className="form-group">
                <label className="checkbox-label"><input type="checkbox" checked={tiersPayant} onChange={(e) => { if (gratuite) { toast.warning('La consultation gratuite ne peut pas avoir de tiers payant'); return; } setTiersPayant(e.target.checked); }} className="checkbox-input" disabled={gratuite} /><span>Tiers Payant</span></label>
                {tiersPayant && !gratuite && (
                  <div className="coverage-slider">
                    <label className="form-label">Pourcentage de couverture</label>
                    <input type="range" min="0" max="100" value={pourcentageCouverture} onChange={(e) => setPourcentageCouverture(parseInt(e.target.value))} className="slider-input" />
                    <div className="slider-labels"><span>0%</span><span className="current-percentage">{pourcentageCouverture}%</span><span>100%</span></div>
                  </div>
                )}
              </div>
              <div className="patient-details-card">
                <h3 className="card-title">Détails du patient</h3>
                <p><strong>Nom:</strong> {selectedPatient?.NOM_BEN} {selectedPatient?.PRE_BEN}</p>
                <p><strong>Identifiant:</strong> {selectedPatient?.IDENTIFIANT_NATIONAL}</p>
                <p><strong>Statut ACE:</strong> {getStatutACE()}</p>
                {selectedPatient?.EMPLOYEUR && <p><strong>Entreprise:</strong> {selectedPatient.EMPLOYEUR}</p>}
                {typePaiement && <div className="payment-type-info"><h4>Type de paiement:</h4><p><strong>{typePaiement.LIB_PAI}</strong> ({typePaiement.TAUX_COUVERTURE}% de couverture)</p></div>}
                {dateRendezVous && <div className="rendez-vous-summary"><h4>Rendez-vous:</h4><p><strong>Prochain RDV:</strong> {new Date(dateRendezVous).toLocaleDateString('fr-FR')}</p></div>}
              </div>
            </div>
            <div className="decompte-summary-section">
              <div className="financial-summary-card">
                <h3 className="summary-title center">DÉCOMPTE FINANCIER</h3>
                <div className="financial-details">
                  <div className="financial-row"><span>Montant total consultation:</span><span className="financial-value">{(montantTotal || 0).toLocaleString()} FCFA</span></div>
                  {tiersPayant && !gratuite && pourcentageCouverture > 0 && <div className="financial-row"><span>Prise en charge ({pourcentageCouverture}%):</span><span className="financial-discount">-{(montantPrisEnCharge || 0).toLocaleString()} FCFA</span></div>}
                  {gratuite && <div className="financial-row"><span>Consultation gratuite:</span><span className="financial-discount">-{(montantTotal || 0).toLocaleString()} FCFA</span></div>}
                  <div className="financial-total"><span>RESTE À CHARGE PATIENT:</span><span className={`total-amount ${resteCharge > 0 ? 'positive' : 'zero'}`}>{(resteCharge || 0).toLocaleString()} FCFA</span></div>
                </div>
                <div className="warning-banner"><p className="warning-title">⚠️ AVERTISSEMENT</p><p className="warning-message">La validation est IRREVERSIBLE. La consultation sera enregistrée et facturable.</p></div>
              </div>
              <div className="navigation-buttons">
                <button onClick={() => setCurrentStep(3)} className="secondary-button">← Retour aux infos médicales</button>
                <button onClick={handleValidate} disabled={loading} className="validate-button">{loading ? 'Validation en cours...' : 'VALIDER LA CONSULTATION'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 5 && (
        <div className="step-container">
          <h2 className="step-title">5. FEUILLE DE PRISE EN CHARGE</h2>
          <div className="success-section">
            <div className="success-icon">✅</div>
            <p className="success-title">Consultation enregistrée avec succès!</p>
            <div className="success-details">
              <p><strong>N° de consultation:</strong> <span className="highlight">{consultationId}</span></p>
              <p><strong>Patient:</strong> <span className="highlight">{selectedPatient?.NOM_BEN} {selectedPatient?.PRE_BEN}</span></p>
              <p><strong>Statut ACE:</strong> <span className="highlight">{getStatutACE()}</span></p>
              {selectedPatient?.EMPLOYEUR && <p><strong>Employeur:</strong> <span className="highlight">{selectedPatient.EMPLOYEUR}</span></p>}
              {selectedPatient?.STATUT_ACE !== 'Principal' && assurePrincipal && <p><strong>Assuré Principal:</strong> <span className="highlight">{assurePrincipal}</span></p>}
              <p><strong>Montant total:</strong> <span className="highlight">{(montantTotal || 0).toLocaleString()} FCFA</span></p>
              <p><strong>Statut paiement:</strong> <span className={`status ${gratuite ? 'gratuit' : tiersPayant ? 'tiers' : 'apayer'}`}>{gratuite ? 'Gratuit' : (tiersPayant ? 'Tiers Payant' : 'À payer')}</span></p>
            </div>
            <div className="action-buttons">
              <button onClick={handlePrint} className="print-button">📄 IMPRIMER LA FEUILLE (1 page)</button>
              <button onClick={handleNewConsultation} className="new-button">➕ NOUVELLE CONSULTATION</button>
            </div>
            <div className="print-preview-note">
              <p><strong>La feuille s'ouvrira dans un nouvel onglet pour impression.</strong></p>
              <p><em>Format: 1 page A4 | Vérifiez les paramètres de popup de votre navigateur.</em></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles et contenu d'impression (à placer à la fin du fichier ou dans un fichier séparé)
const printStyles = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;line-height:1.3;color:#000;background:#fff;margin:0;padding:0}.print-container{width:21cm;min-height:29.7cm;margin:0 auto;padding:0.5cm;background:#fff;position:relative}@media print{@page{size:A4;margin:0.5cm}body{margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.print-container{width:100%;min-height:100%;margin:0;padding:0}.page-break{page-break-after:always;break-after:page}.no-print{display:none!important}}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #000}.header-left .logo-placeholder{width:60px;height:60px;border:1px solid #000;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:10px}.header-center{text-align:center;flex-grow:1;padding:0 10px}.main-title{font-size:16px;font-weight:bold;margin:2px 0;text-transform:uppercase}.subtitle{font-size:12px;margin:2px 0;color:#333}.address{font-size:10px;margin:2px 0;color:#666}.header-right{text-align:right;min-width:120px}.header-box{background:#f5f5f5;padding:5px 8px;border-radius:3px;margin-bottom:3px;border:1px solid #ddd}.consultation-number{font-weight:bold;font-size:12px;color:#d32f2f}.section-title{text-align:center;margin:15px 0}.section-title h2{font-size:14px;margin:5px 0;text-transform:uppercase}.title-line{height:1px;background:#000;margin:3px 0}.section{margin:12px 0;padding:10px}.bordered{border:1px solid #000;border-radius:3px}.section-header{background:#f0f0f0;margin:-10px -10px 8px -10px;padding:6px 10px;font-size:12px;font-weight:bold;border-bottom:1px solid #000}.patient-grid,.consultation-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:5px}.patient-field,.consultation-field{margin-bottom:6px}.full-width{grid-column:1/-1}.patient-field label,.consultation-field label{display:block;font-weight:bold;font-size:10px;margin-bottom:2px;color:#555}.field-value{padding:5px;background:#fff;border:1px solid #ddd;border-radius:2px;min-height:18px;font-size:11px}.highlight{background:#fff3cd;border-color:#ffeaa7;font-weight:bold}.page-footer{margin-top:15px;padding-top:5px;border-top:1px dashed #999;text-align:center;font-size:9px;color:#666;position:absolute;bottom:10px;left:0.5cm;right:0.5cm}.financial-table{width:100%;border-collapse:collapse;margin:12px 0;font-size:11px}.financial-table th{background-color:#f5f5f5;font-weight:600;padding:8px 10px;text-align:left;border:1px solid #ddd;font-size:11px}.financial-table td{padding:6px 8px;border:1px solid #ddd;font-size:11px}.financial-table .amount-cell{text-align:right;font-family:'Courier New',monospace;font-weight:600;white-space:nowrap}.financial-table .percentage-cell{text-align:center;color:#666;white-space:nowrap}.financial-table .discount{color:#d9534f}.financial-table .patient-charge{color:#0275d8;font-weight:700}.financial-table tfoot{background-color:#f8f9fa;border-top:2px solid #ddd}.payment-status{display:flex;align-items:center;justify-content:center;gap:8px;font-size:11px}.status-badge{padding:3px 8px;border-radius:15px;font-size:10px;font-weight:600}.status-badge.gratuit{background-color:#d4edda;color:#155724}.status-badge.tiers{background-color:#d1ecf1;color:#0c5460}.status-badge.apayer{background-color:#f8d7da;color:#721c24}.manuscript-section{background:#fff;margin-bottom:10px}.manuscript-field{min-height:60px;max-height:80px;border:1px solid #ddd;padding:8px;margin:6px 0;font-size:11px;line-height:1.2;overflow:hidden}.manuscript-placeholder{white-space:pre-wrap;line-height:1.2;margin:0;color:#555;font-size:11px}.signatures-section{display:flex;justify-content:space-between;margin:25px 0 15px 0}.signature-box{flex:1;margin:0 10px}.signature-field{text-align:center}.signature-field label{display:block;font-weight:bold;margin-bottom:5px;font-size:11px}.signature-space{display:inline-block;width:150px;border-bottom:1px solid #000;margin:0 5px}.signature-space.large{width:200px;height:40px;border:1px solid #000;display:block;margin:5px auto}.doctor-name{margin-top:5px;font-style:italic;font-size:11px}.admin-info{margin-top:20px;padding:10px;background:#f8f9fa;border-radius:3px;font-size:10px;border:1px solid #ddd}.disclaimer{font-style:italic;color:#666;margin-top:5px;font-size:9px}.rdv-section{text-align:center;padding:12px;margin:10px 0}.rdv-date{font-weight:bold;color:#0275d8;font-size:12px}.rdv-note{font-size:10px;color:#666;margin-top:5px}.prescription-note{font-size:10px;color:#666;margin-top:5px;font-style:italic}.signature-line{text-align:right;margin-top:8px;font-size:10px}.page-content{min-height:24cm;position:relative}.compact{margin-bottom:8px}.small-text{font-size:10px}.no-margin{margin:0}.no-padding{padding:0}`;

const printContent = (feuilleData) => `
  <div class="print-container">
    <div class="page-content">
      <div class="page-header">
        <div class="header-left"><div class="logo-placeholder">LOGO<br>CENTRE</div></div>
        <div class="header-center">
          <h1 class="main-title">FEUILLE DE PRISE EN CHARGE</h1>
          <div class="subtitle">CONSULTATION MÉDICALE</div>
          <div class="address">Centre de Santé Principal - B.P. 1234</div>
          <div class="address">Tél: 01 23 45 67 89</div>
        </div>
        <div class="header-right">
          <div class="header-box consultation-number">N° ${feuilleData.page1.entete.numero}</div>
          <div class="header-box">Date: ${feuilleData.page1.entete.date}</div>
          <div class="header-box small-text">Centre: ${feuilleData.page1.entete.centre}</div>
        </div>
      </div>
      <div class="section-title"><h2>FICHE DE SUIVI MÉDICAL</h2><div class="title-line"></div></div>
      <div class="section bordered">
        <div class="section-header">INFORMATIONS DU PATIENT</div>
        <div class="patient-grid">
          <div class="patient-field"><label>Nom & Prénoms</label><div class="field-value highlight">${feuilleData.page1.patient.nom}</div></div>
          <div class="patient-field"><label>Sexe</label><div class="field-value">${feuilleData.page1.patient.sexe}</div></div>
          <div class="patient-field"><label>Date de naissance</label><div class="field-value">${feuilleData.page1.patient.dateNaissance}</div></div>
          <div class="patient-field"><label>Âge</label><div class="field-value">${feuilleData.page1.patient.age} ans</div></div>
          <div class="patient-field"><label>Identifiant national</label><div class="field-value">${feuilleData.page1.patient.identifiant}</div></div>
          <div class="patient-field"><label>Entreprise/Employeur</label><div class="field-value">${feuilleData.page1.patient.entreprise}</div></div>
          <div class="patient-field"><label>Statut ACE</label><div class="field-value">${feuilleData.page1.patient.statutACE}</div></div>
          <div class="patient-field full-width"><label>Assuré principal (pour ayant droit)</label><div class="field-value">${feuilleData.page1.patient.assurePrincipal}</div></div>
        </div>
      </div>
      <div class="section bordered">
        <div class="section-header">INFORMATIONS DE LA CONSULTATION</div>
        <div class="consultation-grid">
          <div class="consultation-field"><label>Date & Heure</label><div class="field-value">${feuilleData.page1.consultation.date}</div></div>
          <div class="consultation-field"><label>Médecin consulté</label><div class="field-value">${feuilleData.page1.consultation.medecin}</div></div>
          <div class="consultation-field"><label>Spécialité</label><div class="field-value">${feuilleData.page1.consultation.specialite}</div></div>
          <div class="consultation-field"><label>Type de consultation</label><div class="field-value">${feuilleData.page1.consultation.type}</div></div>
          <div class="consultation-field"><label>Motif de consultation</label><div class="field-value">${feuilleData.page1.consultation.motif}</div></div>
          <div class="consultation-field"><label>Diagnostic principal</label><div class="field-value">${feuilleData.page1.consultation.diagnostic}</div></div>
        </div>
      </div>
      <div class="section bordered">
        <div class="section-header">DÉCOMPTE FINANCIER</div>
        <table class="financial-table">
          <thead><tr><th>Description</th><th>Montant (FCFA)</th><th>Taux</th><th>Prise en charge</th><th>Reste à charge</th></tr></thead>
          <tbody><tr><td>Consultation médicale</td><td class="amount-cell">${feuilleData.page3.financier.montantFormate}</td><td class="percentage-cell">${feuilleData.page3.financier.tauxCouverture}%</td><td class="amount-cell discount">-${feuilleData.page3.financier.montantPriseEnCharge.toLocaleString()}</td><td class="amount-cell patient-charge">${feuilleData.page3.financier.resteCharge.toLocaleString()}</td></tr></tbody>
          <tfoot><tr><td colspan="4" style="text-align:right;font-weight:bold;">TOTAL À PAYER PAR LE PATIENT:</td><td class="amount-cell patient-charge">${feuilleData.page3.financier.resteCharge.toLocaleString()} FCFA</td></tr></tfoot>
        </table>
        <div class="payment-status"><span>Statut de paiement:</span><span class="status-badge ${feuilleData.page3.financier.statutPaiement.toLowerCase().replace(' ', '')}">${feuilleData.page3.financier.statutPaiement}</span></div>
      </div>
      <div class="section manuscript-section"><div class="section-header">OBSERVATIONS MÉDICALES</div><div class="manuscript-field"><pre class="manuscript-placeholder">${feuilleData.page2.observations}</pre></div></div>
      <div class="section manuscript-section"><div class="section-header">EXAMENS COMPLÉMENTAIRES PRESCRITS</div><div class="manuscript-field"><pre class="manuscript-placeholder">${feuilleData.page2.examens}</pre></div></div>
      <div class="section manuscript-section"><div class="section-header">TRAITEMENT PRESCRIT</div><div class="manuscript-field"><pre class="manuscript-placeholder">${feuilleData.page2.traitement}</pre></div><div class="prescription-note">* À prendre selon la posologie indiquée</div></div>
      <div class="section manuscript-section"><div class="section-header">RECOMMANDATIONS ET CONSEILS</div><div class="manuscript-field"><pre class="manuscript-placeholder">${feuilleData.page2.recommandations}</pre></div></div>
      <div class="section rdv-section"><div class="section-header">PROCHAIN RENDEZ-VOUS</div><div class="rdv-date">${feuilleData.page2.prochainRdv}</div><div class="rdv-note">Merci de vous présenter 10 minutes avant l'heure du rendez-vous</div></div>
      <div class="signatures-section">
        <div class="signature-box"><div class="signature-field"><label>Signature du médecin</label><div class="signature-space large"></div><div class="doctor-name">${feuilleData.page3.administratif.signatureMedecin}</div></div></div>
        <div class="signature-box"><div class="signature-field"><label>Signature du patient</label><div class="signature-space large"></div><div class="doctor-name">Lu et approuvé</div></div></div>
      </div>
      <div class="admin-info">
        <div><strong>Cachet du centre:</strong> ${feuilleData.page3.administratif.cachetCentre}</div>
        <div><strong>Code de consultation:</strong> ${feuilleData.page3.administratif.codeConsultation}</div>
        <div><strong>Date de génération:</strong> ${feuilleData.page3.administratif.dateGeneration}</div>
        <div class="disclaimer">Document confidentiel - Ne pas dupliquer sans autorisation</div>
      </div>
      <div class="page-footer">Page 1/1 - Consultation N° ${feuilleData.page1.entete.numero} - Généré le ${feuilleData.page3.administratif.dateGeneration}</div>
    </div>
  </div>
`;

export default Consultations;