import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';
import api, { centresAPI, beneficiairesAPI, prestatairesAPI, consultationsAPI } from '../../services/api';
import './Consultations.css';

// Icônes
import {
  FaUserMd,
  FaUserInjured,
  FaFileMedical,
  FaMoneyBillWave,
  FaPrint,
  FaCamera,
  FaSearch,
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaPlus,
  FaEuroSign,
  FaStethoscope,
  FaNotesMedical,
  FaClipboardCheck,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaWeight,
  FaRulerVertical,
  FaThermometerHalf,
  FaHeartbeat,
  FaTint,
  FaIdCard,
  FaBarcode,
  FaUserTag,
  FaSyncAlt,
  FaTimes,
  FaExclamationTriangle,
  FaList,
  FaHospital,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaUsers,
  FaInfoCircle,
  FaFilter,
  FaUserPlus,
  FaBriefcaseMedical
} from 'react-icons/fa';

// Logo AMS
import AMSLogo from '../../assets/AMS-logo.png';

// Informations Courtier d'Assurances
const COURTIER_ASSURANCES = {
  titre: "COURTIER D'ASSURANCES",
  adresse: "Bonapriso Rue VASNITEX, Immeuble ATLANTIS",
  bp: "BP 4962 Douala – Cameroun",
  telephone: "Tel : 2 33 42 08 74 / 6 99 90 60 88"
};

// Composant Scanner de Code-Barres
const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const { t } = useTranslation();
  const scannerRef = useRef(null);
  const qrcodeRegionId = 'html5-qrcode-scanner-container';

  const config = {
    fps: 10,
    qrbox: { width: 250, height: 150 },
    aspectRatio: 1.777778,
    rememberLastUsedCamera: true,
    formatsToSupport: [1, 2, 3, 10, 14],
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
  }, [config, onScanSuccess]);

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
          <h3>
            <div className="scanner-icon">
              <FaCamera />
            </div>
            {t('consultations.scanner.title', 'Scanner le code-barres du patient')}
          </h3>
          <button onClick={stopScanner} className="close-button">
            <FaTimes />
          </button>
        </div>
        <div id={qrcodeRegionId} className="scanner-container" />
        <div className="scanner-instructions">
          <p>• {t('consultations.scanner.instruction1', 'Placez le code-barres dans le cadre')}</p>
          <p>• {t('consultations.scanner.instruction2', 'La lecture est automatique')}</p>
          <p>• {t('consultations.scanner.instruction3', 'Éclairage suffisant recommandé')}</p>
        </div>
      </div>
    </div>
  );
};

const Consultations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // ============= ÉTATS PRINCIPAUX =============
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchType, setSearchType] = useState('identifiant');
  const [searchValue, setSearchValue] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prestataires, setPrestataires] = useState([]);
  const [selectedPrestataire, setSelectedPrestataire] = useState('');
  const [typesConsultation, setTypesConsultation] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [montant, setMontant] = useState(0);
  const [gratuite, setGratuite] = useState(false);
  const [centrePrestataire, setCentrePrestataire] = useState(null);
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
  const [accidentTiers, setAccidentTiers] = useState(false);
  const [dateAccident, setDateAccident] = useState('');
  const [codeAffection, setCodeAffection] = useState('');
  const [statutACE, setStatutACE] = useState('');
  
  // ============= ÉTATS POUR MONTANT ÉDITABLE =============
  const [customAmount, setCustomAmount] = useState(false);
  const [montantEditable, setMontantEditable] = useState(0);
  
  // ============= ÉTATS POUR CENTRES DE SANTÉ =============
  const [centresSante, setCentresSante] = useState([]);
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [loadingCentres, setLoadingCentres] = useState(false);
  
  // ============= ÉTATS POUR ASSURÉS PRINCIPAUX =============
  const [assuresPrincipaux, setAssuresPrincipaux] = useState([]);
  const [searchAssureValue, setSearchAssureValue] = useState('');
  const [showAssureSearch, setShowAssureSearch] = useState(false);

  // ============= REF POUR DEBOUNCE =============
  const searchTimeoutRef = useRef(null);

  // ============= USE EFFECT =============
  useEffect(() => {
    loadPrestataires();
    loadTypesConsultation();
    loadCentresSante();
  }, []);

  useEffect(() => {
    if (selectedCentreId) {
      loadPrestatairesByCentre(selectedCentreId);
    } else {
      loadPrestataires();
    }
  }, [selectedCentreId]);

  useEffect(() => {
    calculateDecompte();
  }, [montantTotal, gratuite, tiersPayant, pourcentageCouverture]);

  useEffect(() => {
    if (selectedPatient) {
      loadTypePaiement(selectedPatient.id);
      
      // Récupérer le statut ACE du patient
      const patientStatutACE = selectedPatient.statut_ace || selectedPatient.STATUT_ACE;
      if (patientStatutACE) {
        setStatutACE(patientStatutACE);
        console.log('📋 Statut ACE récupéré:', patientStatutACE);
      } else {
        setStatutACE('Principal');
        console.warn('⚠️ Statut ACE non trouvé, utilisation de "Principal" par défaut');
      }
      
      // Déterminer l'assuré principal
      if (patientStatutACE === 'Principal' || selectedPatient.statut_ace === 'Principal') {
        setAssurePrincipal(`${selectedPatient.nom} ${selectedPatient.prenom}`);
      } else {
        if (selectedPatient.nom_assure_principal) {
          const nomAssure = `${selectedPatient.nom_assure_principal || ''} ${selectedPatient.prenom_assure_principal || ''}`.trim();
          setAssurePrincipal(nomAssure);
        } else {
          loadAssurePrincipalFromPatient();
        }
      }
    }
  }, [selectedPatient]);

  const handleCentreChange = async (centreId) => {
    console.log('🔄 Changement de centre:', centreId);
    
    setSelectedCentreId(centreId);
    
    if (!centreId) {
      console.log('❌ Aucun centre sélectionné, réinitialisation des médecins');
      setPrestataires([]);
      setSelectedPrestataire('');
      setSelectedCentre(null);
      return;
    }
    
    try {
      // Charger les détails du centre
      const centreResponse = await centresAPI.getById(parseInt(centreId));
      if (centreResponse && centreResponse.success && centreResponse.centre) {
        console.log('✅ Détails du centre chargés:', centreResponse.centre);
        setSelectedCentre(centreResponse.centre);
      }
      
      // Charger les médecins du centre sélectionné
      const centreIdNum = parseInt(centreId);
      if (!isNaN(centreIdNum)) {
        console.log('🔄 Chargement des médecins pour le centre ID:', centreIdNum);
        await loadPrestatairesByCentre(centreIdNum);
      } else {
        console.error('❌ ID de centre invalide:', centreId);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du changement de centre:', error);
      toast.error(t('consultations.errors.centreChange', 'Erreur lors du changement de centre'));
    }
  };

  // ============= FONCTIONS D'INITIALISATION =============
  const loadPrestataires = async () => {
    try {
      console.log('🔍 Chargement de tous les médecins actifs');
      
      const params = {
        status: 'Actif',
        type_prestataire: 'Médecin',
        limit: 200,
        affectation_active: '1'
      };
      
      const response = await prestatairesAPI.getAll(params);
      
      if (response.success && response.prestataires) {
        const formattedPrestataires = response.prestataires.map(p => ({
          id: p.id || p.COD_PRE,
          nom: p.nom || p.NOM_PRESTATAIRE || '',
          prenom: p.prenom || p.PRENOM_PRESTATAIRE || '',
          nom_complet: p.nom_complet || `${p.prenom || ''} ${p.nom || ''}`.trim(),
          specialite: p.specialite || p.SPECIALITE || '',
          telephone: p.telephone || p.TELEPHONE || '',
          email: p.email || p.EMAIL || '',
          cod_cen: p.cod_cen || p.COD_CEN || null,
          actif: p.actif || p.ACTIF || 1,
          status: p.status || (p.ACTIF === 1 ? 'Actif' : 'Inactif'),
          affectation: p.affectation || null
        }));
        
        console.log(`✅ ${formattedPrestataires.length} médecins actifs chargés pour tous les centres`);
        setPrestataires(formattedPrestataires);
        
        if (formattedPrestataires.length === 0) {
          toast.warning(t('consultations.warnings.noActiveDoctors', 'Aucun médecin actif disponible.'));
        }
      } else {
        console.error('❌ Erreur API prestatairesAPI.getAll:', response?.message);
        setPrestataires([]);
        toast.error(response?.message || t('consultations.errors.loadingDoctors', 'Erreur lors du chargement des médecins'));
      }
    } catch (error) {
      console.error('❌ Erreur chargement médecins:', error);
      toast.error(t('consultations.errors.networkDoctors', 'Erreur réseau lors du chargement des médecins'));
      setPrestataires([]);
    }
  };

  const loadPrestatairesByCentre = async (centreId) => {
    try {
      console.log(`🔍 Chargement des médecins pour le centre: ${centreId}`);
      
      const filters = {
        page: 1,
        limit: 100,
        type_prestataire: 'MEDECIN',
        actif: '1',
        affectation_active: '1'
      };
      
      const response = await centresAPI.getPrestatairesByCentre(centreId, filters);
      
      console.log('Réponse API getPrestatairesByCentre:', response);
      console.log('Détails des prestataires reçus:', response.prestataires);
      
      if (response && response.success && response.prestataires) {
        const formattedPrestataires = response.prestataires.map(p => {
          const specialite = p.SPECIALITE || p.specialite || '';
          console.log(`Médecin ${p.NOM_PRESTATAIRE} ${p.PRENOM_PRESTATAIRE}: spécialité="${specialite}"`);
          
          const prestataireData = {
            id: p.id || p.COD_PRE,
            COD_PRE: p.COD_PRE || p.id,
            NOM_PRESTATAIRE: p.NOM_PRESTATAIRE || p.nom || '',
            PRENOM_PRESTATAIRE: p.PRENOM_PRESTATAIRE || p.prenom || '',
            SPECIALITE: specialite,
            specialite: specialite,
            TELEPHONE: p.TELEPHONE || p.telephone || '',
            EMAIL: p.EMAIL || p.email || '',
            COD_CEN: centreId,
            ACTIF: p.ACTIF !== undefined ? p.ACTIF : (p.actif || (p.statut_actif === 'Actif' ? 1 : 0)),
            statut_actif: p.statut_actif || (p.ACTIF === 1 ? 'Actif' : 'Inactif')
          };
          
          prestataireData.nom_complet = `${prestataireData.PRENOM_PRESTATAIRE} ${prestataireData.NOM_PRESTATAIRE}`.trim();
          
          return prestataireData;
        }).filter(p => {
          const isActive = p.ACTIF === 1 || p.statut_actif === 'Actif';
          const hasId = p.id && p.id.toString().trim() !== '';
          console.log(`Prestataire ${p.nom_complet}: id=${p.id}, ACTIF=${p.ACTIF}, statut_actif=${p.statut_actif}, isActive=${isActive}, hasId=${hasId}`);
          return hasId && isActive;
        });
        
        console.log(`✅ ${formattedPrestataires.length} médecins formatés pour le centre ${centreId}`);
        
        if (formattedPrestataires.length > 0) {
          console.log('Exemple de médecin formaté:', formattedPrestataires[0]);
        } else {
          console.log('❌ Aucun médecin formaté après filtrage');
          console.log('Prestataires reçus avant filtrage:', response.prestataires);
        }
        
        setPrestataires(formattedPrestataires);
        
        // Vérifier si le médecin sélectionné appartient à ce centre
        if (selectedPrestataire && formattedPrestataires.length > 0) {
          const currentPrestataire = formattedPrestataires.find(p => p.id === parseInt(selectedPrestataire));
          if (!currentPrestataire) {
            setSelectedPrestataire('');
            toast.info(t('consultations.info.doctorReset', 'Le médecin sélectionné a été réinitialisé car il n\'est pas affecté à ce centre'));
          }
        }
        
        if (formattedPrestataires.length === 0) {
          toast.warning(t('consultations.warnings.noDoctorsForCentre', 'Aucun médecin actif disponible pour ce centre.'));
        }
      } else {
        console.error('❌ Erreur API centresAPI.getPrestatairesByCentre:', response?.message);
        setPrestataires([]);
        toast.error(response?.message || t('consultations.errors.loadingDoctors', 'Erreur lors du chargement des médecins'));
      }
    } catch (error) {
      console.error('❌ Erreur chargement médecins par centre:', error);
      toast.error(t('consultations.errors.networkDoctors', 'Erreur réseau lors du chargement des médecins'));
      setPrestataires([]);
    }
  };
  
  const loadTypesConsultation = async () => {
    try {
      const response = await consultationsAPI.getTypesConsultation();
      if (response.success && response.types) {
        const transformedTypes = response.types.map(type => ({
          COD_TYP_CONS: type.id || type.COD_TYP_CONS,
          LIB_TYP_CONS: type.libelle || type.LIB_TYP_CONS,
          MONTANT: type.tarif || type.MONTANT
        }));
        setTypesConsultation(transformedTypes);
      } else {
        setTypesConsultation([]);
        toast.error(t('consultations.errors.noConsultationTypes', 'Aucun type de consultation disponible'));
      }
    } catch (error) {
      console.error('Erreur chargement types:', error);
      toast.error(t('consultations.errors.loadingTypes', 'Erreur lors du chargement des types de consultation'));
      setTypesConsultation([]);
    }
  };

  const loadCentresSante = async () => {
    setLoadingCentres(true);
    try {
      const response = await centresAPI.getAll();
      console.log('Réponse API centres santé:', response);
      
      if (response && response.success && response.centres) {
        const centresArray = Array.isArray(response.centres) ? response.centres : [];
        
        const formattedCentres = centresArray.map(centre => ({
          id: parseInt(centre.id || centre.COD_CEN),
          COD_CEN: parseInt(centre.COD_CEN || centre.id),
          nom: centre.nom || centre.LIB_CEN || centre.NOM_CENTRE || `Centre ${centre.id || centre.COD_CEN}`,
          type: centre.type || centre.TYP_CEN || centre.TYPE_CENTRE,
          adresse: centre.adresse || centre.NUM_ADR,
          TELEPHONE: centre.TELEPHONE || centre.telephone,
          EMAIL: centre.EMAIL || centre.email
        }));
        
        setCentresSante(formattedCentres);
        
        if (formattedCentres.length === 0) {
          console.warn('Aucun centre de santé disponible');
          toast.info(t('consultations.info.noCentres', 'Aucun centre de santé disponible'));
        }
      } else {
        console.error('Format de réponse inattendu ou échec:', response);
        setCentresSante([]);
        toast.error(t('consultations.errors.loadingCentres', 'Erreur lors du chargement des centres de santé'));
      }
    } catch (error) {
      console.error('Erreur chargement centres santé:', error);
      setCentresSante([]);
      toast.error(t('consultations.errors.networkCentres', 'Erreur réseau lors du chargement des centres de santé'));
    } finally {
      setLoadingCentres(false);
    }
  };

  const loadCentreDetails = async (centreId) => {
    try {
      const response = await centresAPI.getById(centreId);
      if (response && response.success && response.centre) {
        const centre = response.centre;
        setSelectedCentre({
          id: centre.id || centre.COD_CEN,
          COD_CEN: centre.COD_CEN || centre.id,
          nom: centre.nom || centre.LIB_CEN || centre.NOM_CENTRE || `Centre ${centre.id || centre.COD_CEN}`,
          type: centre.type || centre.TYP_CEN || centre.TYPE_CENTRE,
          adresse: centre.adresse || centre.NUM_ADR,
          TELEPHONE: centre.TELEPHONE || centre.telephone,
          EMAIL: centre.EMAIL || centre.email
        });
        
      } else {
        console.error('Erreur lors du chargement des détails du centre:', response);
        const centreFromList = centresSante.find(c => 
          c.id == centreId || c.COD_CEN == centreId
        );
        if (centreFromList) {
          setSelectedCentre(centreFromList);
        }
      }
    } catch (error) {
      console.error('Erreur chargement détails centre:', error);
      const centreFromList = centresSante.find(c => 
        c.id == centreId || c.COD_CEN == centreId
      );
      if (centreFromList) {
        setSelectedCentre(centreFromList);
      }
    }
  };

  const loadTypePaiement = async (idBen) => {
    try {
      const response = await consultationsAPI.getTypePaiementBeneficiaire(idBen);
      if (response.success && response.typePaiement) {
        setTypePaiement(response.typePaiement);
        if (response.typePaiement.TAUX_COUVERTURE > 0) {
          setTiersPayant(true);
          setPourcentageCouverture(response.typePaiement.TAUX_COUVERTURE);
        }
      } else {
        const defaultTypePaiement = {
          LIB_PAI: statutACE === 'Principal' ? t('consultations.payment.tiers', 'Tiers payant') : t('consultations.payment.dependent', 'À charge'),
          TAUX_COUVERTURE: statutACE === 'Principal' ? 80 : 50
        };
        setTypePaiement(defaultTypePaiement);
        if (defaultTypePaiement.TAUX_COUVERTURE > 0) {
          setTiersPayant(true);
          setPourcentageCouverture(defaultTypePaiement.TAUX_COUVERTURE);
        }
      }
    } catch (error) {
      console.error('Erreur chargement type paiement:', error);
      setTypePaiement({ LIB_PAI: t('common.notAvailable', 'Non disponible'), TAUX_COUVERTURE: 0 });
      setTiersPayant(false);
      setPourcentageCouverture(0);
    }
  };

  // ============= FONCTIONS POUR ASSURÉS PRINCIPAUX =============
  const searchAssuresPrincipaux = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setAssuresPrincipaux([]);
      return;
    }

    try {
      const response = await beneficiairesAPI.searchAdvanced(searchTerm, { statut_ace: 'Principal' }, 20, 1);
      
      if (response && response.success && response.beneficiaires) {
        const assures = response.beneficiaires.map(ben => ({
          id: ben.id,
          NOM_BEN: ben.nom || ben.NOM_BEN,
          PRE_BEN: ben.prenom || ben.PRE_BEN,
          IDENTIFIANT_NATIONAL: ben.identifiant_national || ben.IDENTIFIANT_NATIONAL,
          TELEPHONE_MOBILE: ben.telephone_mobile || ben.telephone || ben.TELEPHONE_MOBILE,
          STATUT_ACE: 'Principal'
        }));
        
        const filteredAssures = assures.filter(assure => 
          assure.id !== selectedPatient?.id
        );
        setAssuresPrincipaux(filteredAssures);
      } else {
        setAssuresPrincipaux([]);
      }
    } catch (error) {
      console.error('Erreur recherche assurés principaux:', error);
      setAssuresPrincipaux([]);
    }
  };

  const handleSearchAssureChange = (value) => {
    setSearchAssureValue(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchAssuresPrincipaux(value);
    }, 500);
  };

  const handleSelectAssurePrincipal = (assure) => {
    const nomComplet = `${assure.NOM_BEN} ${assure.PRE_BEN}`;
    setAssurePrincipal(nomComplet);
    setAssuresPrincipaux([]);
    setShowAssureSearch(false);
    toast.success(t('consultations.success.primaryInsuredSelected', 'Assuré principal sélectionné: {{name}}', { name: nomComplet }));
  };

  // ============= GESTION DU STATUT ACE =============
  const getAssurePrincipalFromPatient = useCallback(async (patientId) => {
    try {
      const response = await beneficiairesAPI.getById(patientId);
      
      if (response && response.success && response.beneficiaire) {
        const patient = response.beneficiaire;
        
        if (patient.id_assure_principal) {
          const assureResponse = await beneficiairesAPI.getById(patient.id_assure_principal);
          
          if (assureResponse && assureResponse.success && assureResponse.beneficiaire) {
            const assure = assureResponse.beneficiaire;
            const nomComplet = `${assure.nom} ${assure.prenom}`;
            
            return {
              id: patient.id_assure_principal,
              nom: nomComplet,
              assure: assure
            };
          }
        }
        
        if (patient.nom_assure_principal && patient.prenom_assure_principal) {
          const nomComplet = `${patient.nom_assure_principal} ${patient.prenom_assure_principal}`;
          return {
            id: null,
            nom: nomComplet,
            assure: null
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'assuré principal:', error);
      return null;
    }
  }, []);

  const loadAssurePrincipalFromPatient = useCallback(async () => {
    if (!selectedPatient) return;
    
    try {
      const assureData = await getAssurePrincipalFromPatient(selectedPatient.id);
      
      if (assureData) {
        setAssurePrincipal(assureData.nom);
        toast.success(t('consultations.success.primaryInsuredAutoLoaded', 'Assuré principal chargé automatiquement'));
      }
    } catch (error) {
      console.error('Erreur chargement assuré principal:', error);
    }
  }, [selectedPatient, getAssurePrincipalFromPatient]);

  const findAssurePrincipalId = async (assurePrincipalName) => {
    try {
      const response = await beneficiairesAPI.searchAdvanced(assurePrincipalName, { statut_ace: 'Principal' }, 5, 1);
      
      if (response && response.success && response.beneficiaires && response.beneficiaires.length > 0) {
        const assure = response.beneficiaires[0];
        return assure.id;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la recherche de l\'ID assuré principal:', error);
      return null;
    }
  };
  
  // ============= ÉTAPE 1: RECHERCHE PATIENT =============
  const handleScanSuccess = (scannedData) => {
    setSearchValue(scannedData);
    setSearchType('carte');
    setShowScanner(false);
    handleSearchPatient(scannedData, 'carte');
  };

  const handleSearchPatient = async (searchValueParam = null, searchTypeParam = null) => {
    const valueToSearch = searchValueParam || searchValue;
    const typeToUse = searchTypeParam || searchType;
    
    if (!valueToSearch.trim()) {
      setPatients([]);
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (typeToUse === 'carte') {
        response = await consultationsAPI.searchByCard(valueToSearch);
      } else {
        response = await beneficiairesAPI.searchAdvanced(valueToSearch, {}, 20, 1);
      }
      
      if (response && response.success) {
        const patientsWithDetails = response.beneficiaires || response.patients || [];
        
        const enhancedPatients = await Promise.all(
          patientsWithDetails.map(async (patient) => {
            try {
              const detailsResponse = await beneficiairesAPI.getById(patient.id);
              if (detailsResponse && detailsResponse.success && detailsResponse.beneficiaire) {
                return { ...patient, ...detailsResponse.beneficiaire };
              }
              return patient;
            } catch (error) {
              console.error(`Erreur chargement détails patient ${patient.id}:`, error);
              return patient;
            }
          })
        );
        
        setPatients(enhancedPatients);
        if (enhancedPatients.length === 0) {
          toast.info(t('consultations.info.noPatientsFound', 'Aucun patient trouvé'));
        }
      } else {
        setPatients([]);
        toast.error(response?.message || t('consultations.errors.searchFailed', 'Erreur lors de la recherche'));
      }
    } catch (error) {
      console.error('Erreur recherche patient:', error);
      toast.error(t('consultations.errors.searchPatient', 'Erreur lors de la recherche du patient'));
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (value) => {
    setSearchValue(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        handleSearchPatient(value);
      } else if (value.trim().length === 0) {
        setPatients([]);
      }
    }, 500);
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    toast.success(t('consultations.success.patientSelected', 'Patient sélectionné: {{name}}', { name: `${patient.nom} ${patient.prenom}` }));
    setTimeout(() => setCurrentStep(2), 500);
  };

  // ============= ÉTAPE 2: PARAMÉTRAGE =============
  const handleTypeChange = (typeValue) => {
    setSelectedType(typeValue);
    const typeData = typesConsultation.find(t => t.LIB_TYP_CONS === typeValue);
    if (typeData && typeData.MONTANT !== undefined) {
      setMontant(typeData.MONTANT);
      setMontantEditable(typeData.MONTANT);
      setMontantTotal(typeData.MONTANT);
    } else {
      setMontant(0);
      setMontantEditable(0);
      setMontantTotal(0);
    }
    setCustomAmount(false);
  };

  const handleGratuiteChange = (checked) => {
    setGratuite(checked);
    if (checked) {
      setMontant(0);
      setMontantEditable(0);
      setMontantTotal(0);
      setTiersPayant(false);
    } else {
      const typeData = typesConsultation.find(t => t.LIB_TYP_CONS === selectedType);
      if (typeData) {
        setMontant(typeData.MONTANT);
        setMontantEditable(typeData.MONTANT);
        setMontantTotal(typeData.MONTANT);
      }
    }
  };

  const handleMontantChange = (value) => {
    const numValue = parseFloat(value) || 0;
    setMontantEditable(numValue);
    setMontantTotal(numValue);
    setCustomAmount(true);
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
      toast.error(t('consultations.errors.noPatientSelected', 'Veuillez sélectionner un patient'));
      return;
    }
    
    if (!selectedPrestataire) {
      toast.error(t('consultations.errors.noDoctorSelected', 'Veuillez sélectionner un médecin'));
      return;
    }
    
    const prestataireId = parseInt(selectedPrestataire);
    if (isNaN(prestataireId)) {
      toast.error(t('consultations.errors.invalidDoctorId', 'ID de médecin invalide'));
      return;
    }
    
    const prestataire = prestataires.find(p => p.id === prestataireId);
    if (!prestataire) {
      toast.error(t('consultations.errors.doctorNotFound', 'Médecin non trouvé dans la liste des prestataires actifs'));
      return;
    }
    
    console.log('✅ ID du médecin à envoyer:', prestataireId, 'Nom:', prestataire.nom_complet, 'Spécialité:', prestataire.specialite || prestataire.SPECIALITE);    
    if (!selectedCentreId) {
      toast.error(t('consultations.errors.noCentreSelected', 'Veuillez sélectionner un centre de santé'));
      return;
    }
    
    const centreId = parseInt(selectedCentreId);
    if (isNaN(centreId)) {
      toast.error(t('consultations.errors.invalidCentreId', 'ID de centre de santé invalide'));
      return;
    }

    const centreExists = centresSante.some(centre => 
      centre.id === centreId || centre.COD_CEN === centreId
    );
    
    if (!centreExists && centresSante.length > 0) {
      toast.error(t('consultations.errors.centreNotInList', 'Le centre sélectionné n\'est pas valide'));
      return;
    }
    
    if (!statutACE) {
      const recoveredStatutACE = selectedPatient?.statut_ace || selectedPatient?.STATUT_ACE;
      
      if (!recoveredStatutACE) {
        toast.error(t('consultations.errors.aceStatusNotFound', 'Le statut ACE n\'a pas pu être récupéré depuis les informations du bénéficiaire. Veuillez vérifier les données du patient.'));
        return;
      }
      
      setStatutACE(recoveredStatutACE);
      toast.info(t('consultations.info.aceStatusRecovered', 'Statut ACE récupéré automatiquement: {{statut}}', { statut: recoveredStatutACE }));
    }

    if (statutACE !== 'Principal' && !assurePrincipal) {
      toast.error(t('consultations.errors.noPrimaryInsured', 'Veuillez sélectionner un assuré principal'));
      return;
    }

    let idAssurePrincipal = null;
    if (statutACE !== 'Principal' && assurePrincipal) {
      try {
        if (selectedPatient.id_assure_principal) {
          idAssurePrincipal = selectedPatient.id_assure_principal;
        } else {
          idAssurePrincipal = await findAssurePrincipalId(assurePrincipal);
        }
      } catch (error) {
        console.error('Erreur lors de la recherche de l\'ID assuré principal:', error);
      }
    }
    
    const confirmMessage = t('consultations.confirmation.message', 
      `⚠️ CONFIRMATION DÉFINITIVE\n\nCette action est irréversible. La consultation sera enregistrée et facturable.\n\nPatient: {{patientName}}\nStatut ACE: {{statutACE}}\nAssuré Principal: {{assurePrincipal}}\nMédecin: {{doctorName}}\nCentre: {{centreName}}\nType: {{consultationType}}\nMontant: {{amount}} FCFA\n{{appointment}}\nCliquez sur OK pour confirmer.`, {
      patientName: `${selectedPatient.nom} ${selectedPatient.prenom}`,
      statutACE: statutACE,
      assurePrincipal: statutACE === 'Principal' ? t('consultations.info.patientIsPrimary', 'Le patient lui-même') : assurePrincipal,
      doctorName: prestataire?.nom_complet || prestataire?.nom || t('common.notSpecified', 'Non spécifié'),
      centreName: selectedCentre?.nom || selectedCentre?.NOM_CENTRE || t('common.notSpecified', 'Non spécifié'),
      consultationType: selectedType || t('consultations.default.consultationType', 'Consultation'),
      amount: montantTotal.toLocaleString(),
      appointment: dateRendezVous ? t('consultations.confirmation.appointment', `Rendez-vous: {{date}}`, { date: new Date(dateRendezVous).toLocaleDateString('fr-FR') }) : ''
    });

    if (!window.confirm(confirmMessage.replace(/\n\n\n/g, '\n\n'))) return;

    setLoading(true);
    try {
      const now = new Date();
      const dateFormatted = now.toISOString().slice(0, 19).replace('T', ' ');
      const prochainRdvFormatted = dateRendezVous 
        ? new Date(dateRendezVous).toISOString().split('T')[0]
        : null;

      let statutPaiement = t('consultations.payment.toPay', 'À payer');
      if (gratuite) {
        statutPaiement = t('consultations.payment.free', 'Gratuit');
      } else if (tiersPayant && pourcentageCouverture > 0) {
        statutPaiement = t('consultations.payment.tiers', 'Tiers Payant');
      }

      const consultationData = {
        COD_BEN: selectedPatient.id,
        COD_CEN: centreId,
        COD_PRE: prestataireId,
        DATE_CONSULTATION: dateFormatted,
        TYPE_CONSULTATION: selectedType || 'Consultation générale',
        MOTIF_CONSULTATION: t('consultations.default.motif', 'Consultation médicale'),
        OBSERVATIONS: observations,
        DIAGNOSTIC: t('consultations.default.diagnostic', 'À déterminer'),
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
        NOM_MEDECIN: prestataire.nom_complet || `${prestataire.prenom || prestataire.PRENOM_PRESTATAIRE || ''} ${prestataire.nom || prestataire.NOM_PRESTATAIRE || ''}`.trim(),
        SPECIALITE_MEDECIN: prestataire.specialite || prestataire.SPECIALITE || '',
        URGENT: false,
        HOSPITALISATION: false,
        MONTANT_PRISE_EN_CHARGE: montantPrisEnCharge,
        RESTE_A_CHARGE: resteCharge,
        TAUX_PRISE_EN_CHARGE: tiersPayant ? pourcentageCouverture : 0,
        ACCIDENT_TIERS: accidentTiers,
        DATE_ACCIDENT: dateAccident,
        CODE_AFFECTION: codeAffection,
        STATUT_ACE: statutACE,
        ID_ASSURE_PRINCIPAL: statutACE === 'Principal' ? selectedPatient.id : idAssurePrincipal,
        NOM_ASSURE_PRINCIPAL: statutACE === 'Principal' ? `${selectedPatient.nom} ${selectedPatient.prenom}` : assurePrincipal
      };

      console.log('✅ Données envoyées pour création:', consultationData);
      console.log('📋 Détails du médecin:', {
        id: prestataireId,
        nom: prestataire.nom_complet || prestataire.nom,
        spécialité: prestataire.specialite,
        code_centre: prestataire.cod_cen
      });

      const response = await consultationsAPI.create(consultationData);
      
      if (response.success) {
        setConsultationId(response.consultationId || response.id || response.COD_CONS);
        toast.success(t('consultations.success.consultationSaved', 'Consultation enregistrée avec succès!'));
        setCurrentStep(5);
      } else {
        toast.error(response.message || t('consultations.errors.saveConsultation', 'Erreur lors de l\'enregistrement'));
      }
    } catch (error) {
      console.error('❌ Erreur validation:', error);
      console.error('Détails de l\'erreur:', error.response?.data || error.message);
      toast.error(t('consultations.errors.saveError', 'Erreur lors de l\'enregistrement: ') + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // ============= FONCTIONS UTILITAIRES =============
  const getEmployeurFromPatient = () => {
    const employeur = selectedPatient?.employeur;
    
    if (employeur && typeof employeur === 'string' && employeur.trim() !== '') {
      return employeur.trim();
    }
    
    return t('consultations.patient.employerNotSpecified', 'Non spécifié');
  };

  const handleNewConsultation = () => {
    setCurrentStep(1);
    setSearchValue('');
    setPatients([]);
    setSelectedPatient(null);
    setSelectedPrestataire('');
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
    setCentrePrestataire(null);
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
    setAccidentTiers(false);
    setDateAccident('');
    setCodeAffection('');
    setStatutACE('');
    setSelectedCentreId('');
    setSelectedCentre(null);
    setAssuresPrincipaux([]);
    setSearchAssureValue('');
    setShowAssureSearch(false);
    setCustomAmount(false);
    setMontantEditable(0);
    toast.info(t('consultations.info.newConsultationReady', 'Nouvelle consultation prête'));
  };

  const handlePrint = () => {
    const feuilleData = getTransformedFeuilleData();
    setFeuilleData(feuilleData);
    
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.error(t('consultations.errors.popupBlocked', 'Veuillez autoriser les popups pour l\'impression'));
      return;
    }

    const htmlContent = `<!DOCTYPE html><html><head><title>FICHE DE SOINS - Consultation ${consultationId}</title><meta charset="UTF-8"><style>${printStyles}</style></head><body>${printContent(feuilleData, t)}<script>window.onload=function(){setTimeout(()=>window.print(),500);window.onafterprint=function(){setTimeout(()=>window.close(),500);};}</script></body></html>`;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getTransformedFeuilleData = () => {
    const prestataire = prestataires.find(p => p.id === parseInt(selectedPrestataire));
    const now = new Date();
    
    const specialite = prestataire?.specialite || 
                       prestataire?.SPECIALITE || 
                       '____________________';
    
    const patientInfo = {
      id: selectedPatient?.id || 'N/A',
      identifiant: selectedPatient?.identifiant_national || selectedPatient?.IDENTIFIANT_NATIONAL || 'N/A',
      nom: `${selectedPatient?.nom} ${selectedPatient?.prenom}` || 'N/A',
      age: selectedPatient?.age || 'N/A',
      sexe: selectedPatient?.sexe || 'N/A',
      telephone: selectedPatient?.telephone_mobile || selectedPatient?.telephone || selectedPatient?.TELEPHONE_MOBILE || 'N/A',
      assurePrincipal: assurePrincipal || 'N/A',
      statutACE: statutACE || selectedPatient?.statut_ace || selectedPatient?.STATUT_ACE || 'N/A',
      employeur: getEmployeurFromPatient() || 'N/A'
    };
    
    return {
      entete: {
        logoUrl: AMSLogo,
        titre: "FICHE DE CONSULTATION",
        sousTitre: "AMS-CONSULTATIONS MÉDICALES",
        centreNom: selectedCentre?.nom || selectedCentre?.NOM_CENTRE || 'Centre de santé',
        centreTelephone: selectedCentre?.TELEPHONE || 'Téléphone non disponible',
        centreEmail: selectedCentre?.EMAIL || 'Email non disponible',
        dateHeure: now.toLocaleString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        numero: consultationId ? `CONS-${consultationId.toString().padStart(8, '0')}` : 'CONS-00000000',
        dateCreation: now.toLocaleDateString('fr-FR'),
        courtier: COURTIER_ASSURANCES
      },
      patient: {
        nomComplet: selectedPatient ? `${selectedPatient.nom} ${selectedPatient.prenom}` : '___________________________________',
        age: selectedPatient?.age || '____',
        dateNaissance: selectedPatient?.date_naissance ? new Date(selectedPatient.date_naissance).toLocaleDateString('fr-FR') : '__/__/____',
        sexe: selectedPatient?.sexe === 'M' ? 'M' : (selectedPatient?.sexe === 'F' ? 'F' : '_'),
        identifiant: selectedPatient?.identifiant_national || selectedPatient?.IDENTIFIANT_NATIONAL || '_________________',
        telephone: selectedPatient?.telephone_mobile || selectedPatient?.telephone || selectedPatient?.TELEPHONE_MOBILE || '_________________',
        assurePrincipal: assurePrincipal || '_________________',
        etablissement: getEmployeurFromPatient(),
        statutACE: statutACE || '__________',
        idAssurePrincipal: selectedPatient?.id_assure_principal || '__________',
        patientInfo: patientInfo
      },
      consultation: {
        date: now.toLocaleDateString('fr-FR'),
        heure: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        medecin: prestataire ? `${prestataire.nom_complet || `${prestataire.prenom || ''} ${prestataire.nom || ''}`.trim()}` : '_____________________________',
        specialite: specialite,
        type: selectedType || '_________________________',
        motif: 'Consultation médicale',
        diagnostic: observations || '___________________________________'
      },
      financier: {
        montantTotal: montantTotal,
        tauxCouverture: tiersPayant ? pourcentageCouverture : 0,
        montantPrisEnCharge: montantPrisEnCharge,
        resteCharge: resteCharge,
        statutPaiement: gratuite ? 'Gratuit' : (tiersPayant ? 'Tiers Payant' : 'À payer'),
        typePaiement: typePaiement?.LIB_PAI || '___________________'
      },
      signatures: {
        prestataire: prestataire ? `${prestataire.nom_complet || `${prestataire.prenom || ''} ${prestataire.nom || ''}`.trim()}` : '________________________',
        patient: selectedPatient ? `${selectedPatient.nom} ${selectedPatient.prenom}` : '________________________',
        dateSignature: now.toLocaleDateString('fr-FR')
      }
    };
  };

  // ============= COMPOSANT D'EN-TÊTE =============
  const HeaderSection = () => (
    <div className="header-section">
      <div className="header-content">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          <FaArrowLeft /> {t('common.back', 'Retour')}
        </button>
        
        <div className="title-section">
          <h1 className="main-title">
            <div className="title-icon">
              <FaBriefcaseMedical />
            </div>
            {t('consultations.title', 'GESTION DES CONSULTATIONS')}
          </h1>
          <p className="title-subtitle">
            <FaFilter /> {t('consultations.subtitle', 'Sélectionnez un centre de santé pour filtrer les médecins disponibles')}
          </p>
        </div>

        <div className="steps-indicator">
          <div className="steps-line">
            {[1, 2, 3, 4, 5].map((step) => (
              <div 
                key={step} 
                className={`step-circle ${currentStep >= step ? 'active' : ''}`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="steps-labels">
            <span className={currentStep >= 1 ? 'active' : ''}>
              <FaUserInjured /> {t('consultations.steps.patient', 'Patient')}
            </span>
            <span className={currentStep >= 2 ? 'active' : ''}>
              <FaFileMedical /> {t('consultations.steps.settings', 'Paramétrage')}
            </span>
            <span className={currentStep >= 3 ? 'active' : ''}>
              <FaNotesMedical /> {t('consultations.steps.medical', 'Médical')}
            </span>
            <span className={currentStep >= 4 ? 'active' : ''}>
              <FaClipboardCheck /> {t('consultations.steps.validation', 'Validation')}
            </span>
            <span className={currentStep >= 5 ? 'active' : ''}>
              <FaFileInvoiceDollar /> {t('consultations.steps.print', 'Impression')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // ============= ÉTAPE 3: INFORMATIONS MÉDICALES =============
  const MedicalInfoStep = () => {
    return (
      <div className="step-container">
        <h2 className="step-title">
          <div className="step-icon">
            <FaNotesMedical />
          </div>
          {t('consultations.steps.medicalInfo', '3. INFORMATIONS MÉDICALES')}
        </h2>
        <p className="step-description">
          {t('consultations.descriptions.medicalInfo', 'Ces informations seront enregistrées et imprimées sur la feuille de prise en charge.')}
        </p>
        
        {statutACE && (
          <div className="section bordered">
            <h3 className="section-header">
              <FaUserTag /> {t('consultations.sections.aceStatus', 'STATUT ACE')}
            </h3>
            
            <div className="form-group">
              <label className="form-label">
                <FaUserTag /> {t('consultations.labels.aceStatus', 'Statut ACE')}
              </label>
              <div className="ace-status-display">
                <input
                  type="text"
                  value={statutACE}
                  readOnly
                  className="form-input readonly"
                />
                <p className="form-hint info">
                  <FaInfoCircle /> {t('consultations.info.aceStatusAuto', 'Statut ACE récupéré automatiquement depuis les informations du bénéficiaire')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="section bordered">
          <h3 className="section-header">
            <FaUserTag /> {t('consultations.sections.primaryInsured', 'INFORMATION SUR L\'ASSURÉ PRINCIPAL')}
          </h3>
          
          {statutACE === 'Principal' ? (
            <div className="info-box success">
              <p className="info-text">
                <FaCheck /> {t('consultations.info.primaryInsuredIsPatient', 'Le patient est l\'assuré principal.')}
              </p>
              <p><strong>{selectedPatient?.nom} {selectedPatient?.prenom}</strong></p>
              <p className="form-hint">
                {t('consultations.info.primaryInsuredAutoFilled', 'Le champ Assuré Principal sera automatiquement rempli avec le nom du patient.')}
              </p>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">
                  <FaUsers /> {t('consultations.labels.primaryInsuredName', 'Assuré Principal')}
                  <span className="required"> *</span>
                  {selectedPatient?.id_assure_principal && (
                    <button 
                      type="button" 
                      className="refresh-button-small"
                      onClick={loadAssurePrincipalFromPatient}
                      title={t('consultations.buttons.reloadPrimaryInsured', 'Recharger l\'assuré principal depuis la base')}
                    >
                      <FaSyncAlt />
                    </button>
                  )}
                </label>
                
                {!showAssureSearch ? (
                  <div className="assure-search-container">
                    <div className="assure-input-group">
                      <input
                        type="text"
                        value={assurePrincipal}
                        readOnly
                        className="form-input"
                        placeholder={t('consultations.placeholders.selectPrimaryInsured', 'Cliquez pour rechercher un assuré principal')}
                        onClick={() => setShowAssureSearch(true)}
                      />
                      <button 
                        type="button" 
                        className="search-assure-button"
                        onClick={() => setShowAssureSearch(true)}
                      >
                        <FaSearch />
                      </button>
                    </div>
                    <p className="form-hint">
                      {selectedPatient?.id_assure_principal 
                        ? t('consultations.hints.primaryInsuredAutoAvailable', 'Un assuré principal est lié à ce patient. Cliquez sur ⟳ pour le charger.')
                        : t('consultations.hints.primaryInsuredRequired', 'Champ obligatoire pour les bénéficiaires à charge')}
                    </p>
                  </div>
                ) : (
                  <div className="assure-search-active">
                    <div className="assure-input-group">
                      <input
                        type="text"
                        value={searchAssureValue}
                        onChange={(e) => handleSearchAssureChange(e.target.value)}
                        placeholder={t('consultations.placeholders.searchPrimaryInsured', 'Rechercher un assuré principal (nom, prénom, identifiant)')}
                        className="form-input"
                        autoFocus
                      />
                      <button 
                        type="button" 
                        className="cancel-assure-button"
                        onClick={() => {
                          setShowAssureSearch(false);
                          setSearchAssureValue('');
                          setAssuresPrincipaux([]);
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                    
                    {assuresPrincipaux.length > 0 && (
                      <div className="assures-list">
                        <div className="assures-list-header">
                          <span>{t('consultations.search.primaryInsuredsFound', 'Assurés principaux trouvés:')} ({assuresPrincipaux.length})</span>
                        </div>
                        <div className="assures-list-content">
                          {assuresPrincipaux.map((assure, index) => (
                            <div 
                              key={`assure-${assure.id || index}`}
                              className="assure-item"
                              onClick={() => handleSelectAssurePrincipal(assure)}
                            >
                              <div className="assure-info">
                                <p className="assure-name">
                                  <FaUserTag /> {assure.NOM_BEN} {assure.PRE_BEN}
                                </p>
                                <p className="assure-details">
                                  <FaIdCard /> {t('consultations.patient.id', 'ID')}: {assure.IDENTIFIANT_NATIONAL} | 
                                  <FaPhone /> {t('consultations.patient.phone', 'Tél')}: {assure.TELEPHONE_MOBILE || assure.TELEPHONE || 'Non renseigné'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {searchAssureValue.length >= 2 && assuresPrincipaux.length === 0 && (
                      <div className="no-results">
                        <p>{t('consultations.info.noPrimaryInsuredsFound', 'Aucun assuré principal trouvé. Essayez avec d\'autres termes.')}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {assurePrincipal && !showAssureSearch && (
                  <div className="selected-assure-info">
                    <p className="success-message">
                      <FaCheck /> {t('consultations.success.primaryInsuredSelectedShort', 'Assuré principal sélectionné:')}
                    </p>
                    <p><strong>{assurePrincipal}</strong></p>
                    <button 
                      type="button" 
                      className="change-assure-button"
                      onClick={() => setShowAssureSearch(true)}
                    >
                      <FaSyncAlt /> {t('consultations.buttons.changePrimaryInsured', 'Changer l\'assuré principal')}
                    </button>
                  </div>
                )}
              </div>
              
              {selectedPatient?.id_assure_principal && (
                <div className="info-box info">
                  <p className="info-text">
                    {t('consultations.info.primaryInsuredLinked', 'Ce patient est lié à un assuré principal dans la base de données.')}
                  </p>
                  <p>
                    <strong>{t('consultations.patient.primaryInsuredId', 'ID Assuré Principal')}:</strong> {selectedPatient.id_assure_principal}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="section bordered">
          <h3 className="section-header">
            <FaFileMedical /> {t('consultations.sections.medicalPrescription', 'A COMPLETER PAR LE MEDECIN PRESCRIPTEUR')}
          </h3>
          
          <div className="medical-prescription-grid">
            <div className="form-group">
              <label className="form-label">
                <FaList /> {t('consultations.labels.affectionCode', 'Code Affection')}
              </label>
              <input
                type="text"
                value={codeAffection}
                onChange={(e) => setCodeAffection(e.target.value)}
                placeholder={t('consultations.placeholders.affectionCode', 'Saisir le code affection (optionnel)')}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={accidentTiers} 
                  onChange={(e) => setAccidentTiers(e.target.checked)} 
                  className="checkbox-input" 
                />
                <span>{t('consultations.labels.accidentTiers', 'Accident causé par un tiers')}</span>
              </label>
              
              {accidentTiers && (
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label className="form-label">
                    {t('consultations.labels.accidentDate', 'Date de l\'accident')}
                  </label>
                  <input
                    type="date"
                    value={dateAccident}
                    onChange={(e) => setDateAccident(e.target.value)}
                    className="form-input"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="section bordered">
          <h3 className="section-header">
            <FaCalendarAlt /> {t('consultations.labels.nextAppointment', 'Date du prochain rendez-vous (optionnel)')}
          </h3>
          <div className="form-group">
            <input
              type="date"
              value={dateRendezVous}
              onChange={(e) => setDateRendezVous(e.target.value)}
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="section bordered">
          <h3 className="section-header">
            <FaHeartbeat /> {t('consultations.sections.vitalSigns', 'SIGNES VITAUX')}
          </h3>
          <div className="vitals-grid">
            <div className="form-group">
              <label className="form-label">
                {t('consultations.labels.bloodPressure', 'Tension artérielle (TA)')}
              </label>
              <input 
                type="text" 
                value={ta} 
                onChange={(e) => setTa(e.target.value)} 
                placeholder={t('consultations.placeholders.bloodPressure', 'Ex: 120/80')} 
                className="form-input" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <FaWeight /> {t('consultations.labels.weight', 'Poids (kg)')}
              </label>
              <input 
                type="number" 
                value={poids} 
                onChange={(e) => setPoids(e.target.value)} 
                placeholder={t('consultations.placeholders.weight', 'Ex: 70')} 
                className="form-input" 
                min="0" 
                step="0.1" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <FaRulerVertical /> {t('consultations.labels.height', 'Taille (cm)')}
              </label>
              <input 
                type="number" 
                value={taille} 
                onChange={(e) => setTaille(e.target.value)} 
                placeholder={t('consultations.placeholders.height', 'Ex: 175')} 
                className="form-input" 
                min="0" 
                step="0.1" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <FaThermometerHalf /> {t('consultations.labels.temperature', 'Température (°C)')}
              </label>
              <input 
                type="number" 
                value={temperature} 
                onChange={(e) => setTemperature(e.target.value)} 
                placeholder={t('consultations.placeholders.temperature', 'Ex: 37.5')} 
                className="form-input" 
                min="0" 
                step="0.1" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <FaHeartbeat /> {t('consultations.labels.pulse', 'Pouls (bpm)')}
              </label>
              <input 
                type="number" 
                value={pouls} 
                onChange={(e) => setPouls(e.target.value)} 
                placeholder={t('consultations.placeholders.pulse', 'Ex: 72')} 
                className="form-input" 
                min="0" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">
               {t('consultations.labels.respiratoryRate', 'Fréquence respiratoire')}
              </label>
              <input 
                type="number" 
                value={freqResp} 
                onChange={(e) => setFreqResp(e.target.value)} 
                placeholder={t('consultations.placeholders.respiratoryRate', 'Ex: 16')} 
                className="form-input" 
                min="0" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <FaTint /> {t('consultations.labels.glycemia', 'Glycémie (g/L)')}
              </label>
              <input 
                type="number" 
                value={glycemie} 
                onChange={(e) => setGlycemie(e.target.value)} 
                placeholder={t('consultations.placeholders.glycemia', 'Ex: 1.0')} 
                className="form-input" 
                min="0" 
                step="0.1" 
              />
            </div>
          </div>
        </div>

        <div className="medical-info-grid">
          <div className="medical-section">
            <div className="form-group">
              <label className="form-label">
                {t('consultations.labels.observations', 'Observations médicales')}
              </label>
              <textarea 
                value={observations} 
                onChange={(e) => setObservations(e.target.value)} 
                placeholder={t('consultations.placeholders.observations', 'Saisir les observations médicales (optionnel)')} 
                className="medical-textarea" 
                rows={4} 
              />
              <p className="form-hint">
                {t('consultations.hints.maxLines', '(Ces observations seront utilisées comme diagnostic sur la feuille de soins)')}
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">
                {t('consultations.labels.complementaryExams', 'Examens complémentaires prescrits')}
              </label>
              <textarea 
                value={examens} 
                onChange={(e) => setExamens(e.target.value)} 
                placeholder={t('consultations.placeholders.complementaryExams', 'Liste des examens complémentaires (optionnel)')} 
                className="medical-textarea" 
                rows={3} 
              />
              <p className="form-hint">
                {t('consultations.hints.maxLines', '(Limitez à 2-3 lignes maximum)')}
              </p>
            </div>
          </div>
          <div className="medical-section">
            <div className="form-group">
              <label className="form-label">
                {t('consultations.labels.treatment', 'Traitement prescrit')}
              </label>
              <textarea 
                value={traitements} 
                onChange={(e) => setTraitements(e.target.value)} 
                placeholder={t('consultations.placeholders.treatment', 'Médicaments et posologie (optionnel)')} 
                className="medical-textarea" 
                rows={3} 
              />
              <p className="form-hint">
                {t('consultations.hints.maxLines', '(Limitez à 2-3 lignes maximum)')}
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">
                {t('consultations.labels.recommendations', 'Recommandations et conseils')}
              </label>
              <textarea 
                value={recommandations} 
                onChange={(e) => setRecommandations(e.target.value)} 
                placeholder={t('consultations.placeholders.recommendations', 'Recommandations pour le patient (optionnel)')} 
                className="medical-textarea" 
                rows={3} 
              />
              <p className="form-hint">
                {t('consultations.hints.maxLines', '(Limitez à 2-3 lignes maximum)')}
              </p>
            </div>
          </div>
        </div>

        <div className="navigation-buttons">
          <button onClick={() => setCurrentStep(2)} className="secondary-button">
            <FaArrowLeft /> {t('common.back', 'Retour')} {t('consultations.navigation.toSettings', 'au paramétrage')}
          </button>
          <button onClick={() => setCurrentStep(4)} className="primary-button">
            {t('consultations.navigation.continueToValidation', 'Continuer vers validation')} <FaArrowRight />
          </button>
        </div>
      </div>
    );
  };

  // ============= ÉTAPE 1: IDENTIFICATION PATIENT =============
  const Step1PatientIdentification = () => (
    <div className="step-container">
      <h2 className="step-title">
        <div className="step-icon">
          <FaUserInjured />
        </div>
        {t('consultations.steps.patientIdentification', '1. IDENTIFICATION DU PATIENT')}
      </h2>
      
      <div className="search-section">
        <div className="search-type-selector">
          <button 
            onClick={() => { 
              setSearchType('identifiant'); 
              setShowScanner(false); 
              setSearchValue('');
              setPatients([]);
            }} 
            className={`search-type-btn ${searchType === 'identifiant' ? 'active' : ''}`}
          >
            <div className="btn-icon">
              <FaIdCard />
            </div>
            {t('consultations.search.nationalId', 'Identifiant national')}
          </button>
          <button 
            onClick={() => { 
              setSearchType('carte'); 
              setShowScanner(false);
              setSearchValue('');
              setPatients([]);
            }} 
            className={`search-type-btn ${searchType === 'carte' ? 'active' : ''}`}
          >
            <div className="btn-icon">
              <FaIdCard />
            </div>
            {t('consultations.search.insuranceCard', 'Carte d\'assuré')}
          </button>
          <button 
            onClick={() => { 
              setSearchType('nom'); 
              setShowScanner(false);
              setSearchValue('');
              setPatients([]);
            }} 
            className={`search-type-btn ${searchType === 'nom' ? 'active' : ''}`}
          >
            <div className="btn-icon">
              <FaUserInjured />
            </div>
            {t('consultations.search.name', 'Nom')}
          </button>
          <button 
            onClick={() => { 
              setSearchType('scanner'); 
              setShowScanner(true); 
            }} 
            className={`search-type-btn ${searchType === 'scanner' ? 'active' : ''}`}
          >
            <div className="btn-icon">
              <FaBarcode />
            </div>
            {t('consultations.search.scanBarcode', 'Scanner code-barres')}
          </button>
        </div>

        <div className="search-input-group">
          {!showScanner ? (
            <>
              <div className="form-group">
                <label className="form-label">
                  {searchType === 'identifiant' ? (
                    <>
                      <FaIdCard /> {t('consultations.search.nationalId', 'Identifiant national')}
                    </>
                  ) : searchType === 'carte' ? (
                    <>
                      <FaIdCard /> {t('consultations.search.insuranceCard', 'Numéro de carte')}
                    </>
                  ) : (
                    <>
                      <FaUserInjured /> {t('consultations.search.patientName', 'Nom du patient')}
                    </>
                  )}
                </label>
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  placeholder={
                    searchType === 'identifiant' ? t('consultations.placeholders.nationalId', 'Ex: CM12345678') : 
                    searchType === 'carte' ? t('consultations.placeholders.cardNumber', 'Numéro de carte - min. 2 caractères') : 
                    t('consultations.placeholders.name', 'Nom ou prénom - min. 2 caractères')
                  }
                  className="form-input"
                  autoFocus
                />
                <p className="form-hint">
                  {t('consultations.search.debounceHint', 'La recherche se déclenche automatiquement après la saisie')}
                </p>
              </div>
              <button 
                onClick={() => handleSearchPatient()} 
                disabled={loading || searchValue.trim().length < 2} 
                className="search-button"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    {t('consultations.search.searching', 'Recherche en cours...')}
                  </>
                ) : (
                  <>
                    <FaSearch /> {t('common.search', 'Rechercher')}
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="scanner-placeholder">
              <p>{t('consultations.scanner.scanPrompt', 'Veuillez scanner le code-barres de la carte du patient.')}</p>
              <button onClick={() => setShowScanner(false)} className="secondary-button">
                <FaTimes /> {t('common.cancel', 'Annuler')} {t('consultations.scanner.scan', 'le scan')}
              </button>
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
          <h3 className="section-subtitle">
            {t('consultations.search.patientsFound', 'Patients trouvés:')} ({patients.length})
          </h3>
          <div className="patients-list">
            {patients.map((patient, index) => (
              <div 
                key={`patient-${patient.id || index}`} 
                className={`patient-card ${selectedPatient?.id === patient.id ? 'selected' : ''}`} 
                onClick={() => handleSelectPatient(patient)}
              >
                <div className="patient-info">
                  <div className="patient-info-content">
                    <p className="patient-name">
                      <FaUserInjured /> {patient.nom} {patient.prenom}
                    </p>
                    <p className="patient-details">
                      <FaIdCard /> {t('consultations.patient.id', 'ID')}: {patient.identifiant_national} | 
                      {t('consultations.patient.age', 'Âge')}: {patient.age} {t('consultations.patient.years', 'ans')} | 
                      {t('consultations.patient.gender', 'Sexe')}: {patient.sexe === 'M' ? t('common.male', 'M') : t('common.female', 'F')}
                    </p>
                    <p className="patient-details">
                      <FaPhone /> {t('consultations.patient.phone', 'Tél')}: {patient.telephone_mobile || patient.telephone || 'Non renseigné'}
                    </p>
                    
                    {patient.employeur && (
                      <p className="patient-details">
                        <FaBuilding /> <strong>{t('consultations.patient.employeur', 'Employeur')}:</strong> {patient.employeur}
                      </p>
                    )}
                    
                    {patient.statut_ace && (
                      <p className="patient-details">
                        <FaUserTag /> <strong>{t('consultations.patient.aceStatus', 'Statut ACE')}:</strong> {patient.statut_ace}
                      </p>
                    )}
                    
                    {patient.matricule && (
                      <p className="patient-details">
                        <strong>{t('consultations.patient.matricule', 'Matricule')}:</strong> {patient.matricule}
                      </p>
                    )}
                    {patient.fonction && (
                      <p className="patient-details">
                        <strong>{t('consultations.patient.function', 'Fonction')}:</strong> {patient.fonction}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPatient && (
        <div className="selected-patient-card">
          <p className="success-message">
            <FaCheck /> {t('consultations.success.patientSelectedShort', 'Patient sélectionné:')}
          </p>
          <p><strong>{selectedPatient.nom} {selectedPatient.prenom}</strong></p>
          <p>
            <FaIdCard /> {t('consultations.patient.id', 'ID')}: {selectedPatient.identifiant_national} | 
            {t('consultations.patient.age', 'Âge')}: {selectedPatient.age} {t('consultations.patient.years', 'ans')}
          </p>
          
          {selectedPatient.employeur && (
            <p><FaBuilding /> <strong>{t('consultations.patient.employer', 'Employeur')}:</strong> {selectedPatient.employeur}</p>
          )}
          
          {selectedPatient.statut_ace && (
            <p><FaUserTag /> <strong>{t('consultations.patient.aceStatus', 'Statut ACE')}:</strong> {selectedPatient.statut_ace}</p>
          )}
          
          <button onClick={() => setCurrentStep(2)} className="continue-button">
            {t('consultations.navigation.continue', 'Continuer')} <FaArrowRight />
          </button>
        </div>
      )}
    </div>
  );

  // ============= ÉTAPE 2: PARAMÉTRAGE CONSULTATION =============
  const Step2ConsultationSettings = () => {
    return (
      <div className="step-container">
        <h2 className="step-title">
          <div className="step-icon">
            <FaFileMedical />
          </div>
          {t('consultations.steps.consultationSettings', '2. PARAMÉTRAGE DE LA CONSULTATION')}
        </h2>
        <div className="configuration-grid">
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">
                <FaHospital /> {t('consultations.labels.healthCenter', 'Centre de santé')} 
                <button type="button" onClick={loadCentresSante} className="refresh-button" title={t('common.refresh', 'Rafraîchir')}>
                  <FaSyncAlt />
                </button>
              </label>
              <select 
                value={selectedCentreId} 
                onChange={(e) => handleCentreChange(e.target.value)}
                className="form-select"
                disabled={loadingCentres}
              >
                <option value="">{t('consultations.placeholders.selectCentre', 'Sélectionnez un centre de santé')}</option>
                {loadingCentres ? (
                  <option value="" disabled>{t('consultations.loading.centres', 'Chargement des centres...')}</option>
                ) : (
                  centresSante.map((centre, index) => {
                    const nom = centre.nom || `Centre ${centre.COD_CEN || centre.id}`;
                    const type = centre.type ? `(${centre.type})` : '';
                    
                    return (
                      <option key={`centre-${centre.COD_CEN || centre.id || index}`} value={centre.COD_CEN || centre.id}>
                        {nom} {type}
                      </option>
                    );
                  })
                )}
              </select>
              <p className="form-hint">
                {loadingCentres ? 
                  t('consultations.loading.centresInProgress', 'Chargement des centres en cours...') : 
                  centresSante.length === 0 ? 
                  t('consultations.hints.noCentres', 'Aucun centre de santé actif disponible. Cliquez sur ⟳ pour rafraîchir.') : 
                  selectedCentreId ? 
                  t('consultations.hints.doctorsFiltered', 'Seuls les médecins de ce centre sont affichés') :
                  t('consultations.hints.centresAvailable', '{{count}} centre(s) actif(s) disponible(s)', { count: centresSante.length })}
              </p>
            </div>

            {selectedCentre && (
              <div className="centre-details-card">
                <h4 className="card-subtitle">
                  <FaHospital /> {t('consultations.details.centreDetails', 'Détails du centre sélectionné')}
                </h4>
                <div className="details-grid">
                  <p><strong>{t('consultations.labels.name', 'Nom')}:</strong> {selectedCentre.nom}</p>
                  {selectedCentre.adresse && (
                    <p><FaMapMarkerAlt /> <strong>{t('consultations.labels.address', 'Adresse')}:</strong> {selectedCentre.adresse}</p>
                  )}
                  {selectedCentre.TELEPHONE && (
                    <p><FaPhone /> <strong>{t('consultations.labels.phone', 'Téléphone')}:</strong> {selectedCentre.TELEPHONE}</p>
                  )}
                  {selectedCentre.EMAIL && (
                    <p><FaEnvelope /> <strong>{t('consultations.labels.email', 'Email')}:</strong> {selectedCentre.EMAIL}</p>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <FaUserMd /> {t('consultations.labels.doctor', 'MEDECIN')}
                <button 
                  type="button" 
                  onClick={() => selectedCentreId ? loadPrestatairesByCentre(parseInt(selectedCentreId)) : loadPrestataires()} 
                  className="refresh-button" 
                  title={t('common.refresh', 'Rafraîchir')}
                >
                  <FaSyncAlt />
                </button>
              </label>
              <select 
                value={selectedPrestataire} 
                onChange={(e) => setSelectedPrestataire(e.target.value)} 
                className="form-select"
                disabled={!selectedCentreId}
              >
                <option value="">{t('consultations.placeholders.selectDoctor', 'Sélectionnez un médecin')}</option>
                {prestataires.length > 0 ? (
                  prestataires.map((prestataire, index) => {
                    const nomComplet = prestataire.nom_complet || 
                                      `${prestataire.PRENOM_PRESTATAIRE || prestataire.prenom || ''} ${prestataire.NOM_PRESTATAIRE || prestataire.nom || ''}`.trim();
                    
                    const specialite = prestataire.SPECIALITE || prestataire.specialite || '';
                    
                    return (
                      <option 
                        key={`prestataire-${prestataire.id || prestataire.COD_PRE || index}`} 
                        value={prestataire.id || prestataire.COD_PRE}
                      >
                        {nomComplet} {specialite ? ` - ${specialite}` : ''}
                      </option>
                    );
                  })
                ) : (
                  <option value="" disabled>
                    {selectedCentreId 
                      ? t('consultations.info.noDoctorsForCentre', 'Aucun médecin actif disponible pour ce centre')
                      : t('consultations.info.selectCentreFirst', 'Veuillez d\'abord sélectionner un centre')}
                  </option>
                )}
              </select>
              <p className="form-hint">
                {selectedCentreId ? (
                  prestataires.length > 0 
                    ? t('consultations.hints.filteredDoctors', '{{count}} médecin(s) affilié(s) à ce centre', { 
                        count: prestataires.length 
                      })
                    : t('consultations.hints.noDoctorsInCentre', 'Aucun médecin trouvé pour ce centre')
                ) : (
                  t('consultations.hints.selectCentreFirst', 'Veuillez d\'abord sélectionner un centre')
                )}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaStethoscope /> {t('consultations.labels.consultationType', 'Type de consultation')}
              </label>
              <select value={selectedType} onChange={(e) => handleTypeChange(e.target.value)} className="form-select">
                <option value="">{t('consultations.placeholders.selectType', 'Sélectionnez un type')}</option>
                {typesConsultation.map((type, index) => (
                  <option key={`type-${type.COD_TYP_CONS || type.LIB_TYP_CONS || index}`} value={type.LIB_TYP_CONS}>
                    {type.LIB_TYP_CONS} - {(type.MONTANT || 0).toLocaleString()} FCFA
                  </option>
                ))}
              </select>
              <p className="form-hint">
                {t('consultations.hints.consultationTypeOptional', 'Optionnel - pour les consultations standard')}
              </p>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={gratuite} 
                  onChange={(e) => handleGratuiteChange(e.target.checked)} 
                  className="checkbox-input" 
                />
                <span className="checkbox-text">
                  <FaEuroSign /> {t('consultations.labels.freeConsultation', 'Consultation gratuite (montant à 0)')}
                </span>
              </label>
            </div>
          </div>
          <div className="summary-section">
            <div className="summary-card">
              <h3 className="summary-title">
                <FaClipboardCheck /> {t('consultations.summary.title', 'Résumé')}
              </h3>
              {selectedPatient && (
                <div className="summary-item">
                  <p><strong><FaUserInjured /> {t('consultations.patient.patient', 'Patient')}:</strong> {selectedPatient.nom} {selectedPatient.prenom}</p>
                  <p><strong>{t('consultations.patient.age', 'Âge')}:</strong> {selectedPatient.age} {t('consultations.patient.years', 'ans')}</p>
                  <p><strong>{t('consultations.patient.aceStatus', 'Statut ACE')}:</strong> {statutACE || selectedPatient.statut_ace || 'Non spécifié'}</p>
                  
                  {selectedPatient.employeur && (
                    <p><FaBuilding /> <strong>{t('consultations.patient.employer', 'Employeur')}:</strong> {selectedPatient.employeur}</p>
                  )}
                </div>
              )}
              {selectedPrestataire && (
                <div className="summary-item">
                  <p><strong><FaUserMd /> {t('consultations.labels.doctor', 'Médecin')}:</strong> {prestataires.find(p => p.id === parseInt(selectedPrestataire))?.nom_complet}</p>
                  <p><strong>{t('consultations.labels.specialty', 'Spécialité')}:</strong> {prestataires.find(p => p.id === parseInt(selectedPrestataire))?.specialite}</p>
                </div>
              )}
              {selectedCentre && (
                <div className="summary-item">
                  <p><strong><FaHospital /> {t('consultations.labels.healthCenter', 'Centre de santé')}:</strong> {selectedCentre.nom}</p>
                  {selectedCentre.TELEPHONE && (
                    <p><FaPhone /> <strong>{t('consultations.labels.phone', 'Téléphone')}:</strong> {selectedCentre.TELEPHONE}</p>
                  )}
                </div>
              )}
              
              {selectedType && (
                <div className="summary-item">
                  <p><strong><FaStethoscope /> {t('consultations.labels.type', 'Type')}:</strong> {selectedType}</p>
                  <div className="summary-amount-details">
                    <p>
                      <strong><FaEuroSign /> {t('consultations.labels.rate', 'Tarif')}:</strong> 
                      {(montantEditable || 0).toLocaleString()} FCFA
                      {customAmount && <span className="custom-badge">{t('consultations.labels.custom', 'Personnalisé')}</span>}
                    </p>
                    {customAmount && montant !== montantEditable && (
                      <>
                        <p className="original-amount">
                          {t('consultations.labels.originalAmount', 'Tarif d\'origine:')} 
                          {(montant || 0).toLocaleString()} FCFA
                        </p>
                        <p className={`difference ${montantEditable > montant ? 'increase' : 'decrease'}`}>
                          {montantEditable > montant ? '+' : '-'}
                          {Math.abs(montantEditable - montant).toLocaleString()} FCFA
                          ({((Math.abs(montantEditable - montant) / montant) * 100).toFixed(1)}%)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {typePaiement && (
                <div className="summary-item">
                  <p><strong><FaMoneyBillWave /> {t('consultations.labels.paymentType', 'Type de paiement')}:</strong> {typePaiement.LIB_PAI}</p>
                  <p><strong>{t('consultations.labels.coverageRate', 'Taux couverture')}:</strong> {typePaiement.TAUX_COUVERTURE}%</p>
                </div>
              )}

              {selectedType && (
                <div className="form-group">
                  <label className="form-label">
                    <FaMoneyBillWave /> {t('consultations.labels.consultationAmount', 'Montant de la consultation (FCFA)')}
                  </label>
                  <div className="amount-input-group">
                    <input
                      type="number"
                      value={montantEditable}
                      onChange={(e) => handleMontantChange(e.target.value)}
                      className="form-input"
                      min="0"
                      step="100"
                      disabled={gratuite}
                    />
                    <div className="amount-actions">
                      <button
                        type="button"
                        className={`amount-button ${customAmount ? 'active' : ''}`}
                        onClick={() => {
                          if (customAmount) {
                            const typeData = typesConsultation.find(t => t.LIB_TYP_CONS === selectedType);
                            if (typeData) {
                              handleMontantChange(typeData.MONTANT);
                            }
                          }
                        }}
                        title={t('consultations.buttons.resetAmount', 'Rétablir le montant d\'origine')}
                        disabled={gratuite}
                      >
                        <FaSyncAlt />
                      </button>
                    </div>
                  </div>
                  <p className="form-hint">
                    {customAmount ? 
                      t('consultations.hints.customAmountActive', 'Montant personnalisé. Cliquez sur ⟳ pour rétablir le tarif standard.') : 
                      t('consultations.hints.amountEditable', 'Vous pouvez modifier ce montant si nécessaire.')}
                  </p>
                  
                  {customAmount && !gratuite && (
                    <div className="amount-difference">
                      <p className={`difference ${montantEditable > montant ? 'increase' : 'decrease'}`}>
                        {montantEditable > montant ? '▲' : '▼'} 
                        {t('consultations.info.amountDifference', 'Différence:')} 
                        {Math.abs(montantEditable - montant).toLocaleString()} FCFA
                        {montantEditable > montant ? 
                          t('consultations.info.amountIncrease', ' (augmentation)') : 
                          t('consultations.info.amountDecrease', ' (réduction)')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {gratuite && (
                <div className="warning-box">
                  <p className="warning-text">
                    <FaEuroSign /> {t('consultations.warnings.freeConsultation', 'Consultation gratuite activée')}
                  </p>
                </div>
              )}
            </div>
            <div className="navigation-buttons">
              <button onClick={() => setCurrentStep(1)} className="secondary-button">
                <FaArrowLeft /> {t('common.back', 'Retour')}
              </button>
              <button onClick={() => setCurrentStep(3)} disabled={!selectedPrestataire || !selectedCentreId} className="primary-button">
                {t('consultations.navigation.continueToMedical', 'Continuer vers informations médicales')} <FaArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============= ÉTAPE 4: DÉCOMPTE FINANCIER =============
  const Step4FinancialBreakdown = () => (
    <div className="step-container">
      <h2 className="step-title">
        <div className="step-icon">
          <FaClipboardCheck />
        </div>
        {t('consultations.steps.financialBreakdown', '4. DÉCOMPTE FINANCIER ET VALIDATION')}
      </h2>
      <div className="decompte-grid">
        <div className="decompte-form-section">
          <div className="form-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={tiersPayant} 
                onChange={(e) => { 
                  if (gratuite) { 
                    toast.warning(t('consultations.warnings.noTiersForFree', 'La consultation gratuite ne peut pas avoir de tiers payant')); 
                    return; 
                  } 
                  setTiersPayant(e.target.checked); 
                }} 
                className="checkbox-input" 
                disabled={gratuite} 
              />
              <span><FaMoneyBillWave /> {t('consultations.labels.tiersPayant', 'Tiers Payant')}</span>
            </label>
            {tiersPayant && !gratuite && (
              <div className="coverage-slider">
                <label className="form-label">
                  {t('consultations.labels.coveragePercentage', 'Pourcentage de couverture')}
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={pourcentageCouverture} 
                  onChange={(e) => setPourcentageCouverture(parseInt(e.target.value))} 
                  className="slider-input" 
                />
                <div className="slider-labels">
                  <span>0%</span>
                  <span className="current-percentage">{pourcentageCouverture}%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>
          <div className="patient-details-card">
            <h3 className="card-title">
              <FaUserInjured /> {t('consultations.sections.patientDetails', 'Détails du patient')}
            </h3>
            <p><strong>{t('consultations.patient.name', 'Nom')}:</strong> {selectedPatient?.nom} {selectedPatient?.prenom}</p>
            <p><strong>{t('consultations.patient.id', 'Identifiant')}:</strong> {selectedPatient?.identifiant_national}</p>
            <p><strong>{t('consultations.patient.aceStatus', 'Statut ACE')}:</strong> {statutACE || selectedPatient?.statut_ace || 'Non spécifié'}</p>
            
            {selectedPatient?.employeur && (
              <p><FaBuilding /> <strong>{t('consultations.patient.employer', 'Employeur')}:</strong> {selectedPatient.employeur}</p>
            )}
            
            <div className="assure-principal-info">
              <h4><FaUserTag /> {t('consultations.labels.primaryInsured', 'Assuré Principal')}:</h4>
              {statutACE === 'Principal' ? (
                <p><strong>{selectedPatient?.nom} {selectedPatient?.prenom} (Lui-même)</strong></p>
              ) : (
                <p><strong>{assurePrincipal || t('consultations.info.noPrimaryInsuredSelected', 'Non sélectionné')}</strong></p>
              )}
            </div>
            
            {selectedCentre && (
              <div className="centre-info">
                <h4><FaHospital /> {t('consultations.labels.healthCenter', 'Centre de santé')}:</h4>
                <p><strong>{selectedCentre.nom}</strong></p>
                {selectedCentre.TELEPHONE && (
                  <p><FaPhone /> {selectedCentre.TELEPHONE}</p>
                )}
                {selectedCentre.EMAIL && (
                  <p><FaEnvelope /> {selectedCentre.EMAIL}</p>
                )}
              </div>
            )}
            {typePaiement && (
              <div className="payment-type-info">
                <h4><FaMoneyBillWave /> {t('consultations.labels.paymentType', 'Type de paiement')}:</h4>
                <p><strong>{typePaiement.LIB_PAI}</strong> ({typePaiement.TAUX_COUVERTURE}% {t('consultations.labels.coverage', 'de couverture')})</p>
              </div>
            )}
            {dateRendezVous && (
              <div className="rendez-vous-summary">
                <h4><FaCalendarAlt /> {t('consultations.labels.appointment', 'Rendez-vous')}:</h4>
                <p><strong>{t('consultations.labels.nextAppointment', 'Prochain RDV')}:</strong> {new Date(dateRendezVous).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
          </div>
        </div>
        <div className="decompte-summary-section">
          <div className="financial-summary-card">
            <h3 className="summary-title center">
              <FaMoneyBillWave /> {t('consultations.sections.financialBreakdown', 'DÉCOMPTE FINANCIER')}
            </h3>
            <div className="financial-details">
              <div className="financial-row">
                <span>{t('consultations.financial.totalAmount', 'Montant total consultation')}:</span>
                <span className="financial-value">{(montantTotal || 0).toLocaleString()} FCFA</span>
              </div>
              {tiersPayant && !gratuite && pourcentageCouverture > 0 && (
                <div className="financial-row">
                  <span>{t('consultations.financial.coverage', 'Prise en charge')} ({pourcentageCouverture}%):</span>
                  <span className="financial-discount">-{(montantPrisEnCharge || 0).toLocaleString()} FCFA</span>
                </div>
              )}
              {gratuite && (
                <div className="financial-row">
                  <span>{t('consultations.financial.freeConsultation', 'Consultation gratuite')}:</span>
                  <span className="financial-discount">-{(montantTotal || 0).toLocaleString()} FCFA</span>
                </div>
              )}
              <div className="financial-total">
                <span>{t('consultations.financial.patientRemaining', 'RESTE À CHARGE PATIENT')}:</span>
                <span className={`total-amount ${resteCharge > 0 ? 'positive' : 'zero'}`}>
                  {(resteCharge || 0).toLocaleString()} FCFA
                </span>
              </div>
            </div>
            <div className="warning-banner">
              <p className="warning-title">
                <FaExclamationTriangle /> {t('consultations.warnings.warning', 'AVERTISSEMENT')}
              </p>
              <p className="warning-message">
                {t('consultations.warnings.irreversible', 'La validation est IRREVERSIBLE. La consultation sera enregistrée et facturable.')}
              </p>
            </div>
          </div>
          <div className="navigation-buttons">
            <button onClick={() => setCurrentStep(3)} className="secondary-button">
              <FaArrowLeft /> {t('common.back', 'Retour')} {t('consultations.navigation.toMedicalInfo', 'aux infos médicales')}
            </button>
            <button onClick={handleValidate} disabled={loading || !selectedCentreId || !statutACE || (statutACE !== 'Principal' && !assurePrincipal)} className="validate-button">
              {loading ? (
                <>
                  <FaSyncAlt /> {t('consultations.buttons.validating', 'Validation en cours...')}
                </>
              ) : (
                <>
                  <FaCheck /> {t('consultations.buttons.validateConsultation', 'VALIDER LA CONSULTATION')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ============= ÉTAPE 5: FICHE DE SOINS =============
  const Step5InsuranceSheet = () => (
    <div className="step-container">
      <h2 className="step-title">
        <div className="step-icon">
          <FaFileInvoiceDollar />
        </div>
        {t('consultations.steps.insuranceSheet', '5. FICHE DE SOINS')}
      </h2>
      <div className="success-section">
        <div className="success-icon"><FaCheck /></div>
        <p className="success-title">
          {t('consultations.success.consultationSaved', 'Consultation enregistrée avec succès!')}
        </p>
        <div className="success-details">
          <p>
            <strong>{t('consultations.labels.consultationNumber', 'N° de consultation')}:</strong> 
            <span className="highlight">{consultationId}</span>
          </p>
          <p>
            <strong><FaUserInjured /> {t('consultations.patient.patient', 'Patient')}:</strong> 
            <span className="highlight">{selectedPatient?.nom} {selectedPatient?.prenom}</span>
          </p>
          <p>
            <strong>{t('consultations.patient.aceStatus', 'Statut ACE')}:</strong> 
            <span className="highlight">{statutACE || selectedPatient?.statut_ace || 'Non spécifié'}</span>
          </p>
          
          {selectedPatient?.employeur && (
            <p>
              <FaBuilding /> <strong>{t('consultations.patient.employer', 'Employeur')}:</strong> 
              <span className="highlight">{selectedPatient.employeur}</span>
            </p>
          )}
          
          <p>
            <strong><FaUserTag /> {t('consultations.labels.primaryInsured', 'Assuré Principal')}:</strong> 
            <span className="highlight">
              {statutACE === 'Principal' 
                ? `${selectedPatient?.nom} ${selectedPatient?.prenom} (Lui-même)`
                : assurePrincipal || t('consultations.info.noPrimaryInsured', 'Non spécifié')}
            </span>
          </p>
          <p>
            <strong><FaStethoscope /> {t('consultations.labels.consultationType', 'Type de consultation')}:</strong> 
            <span className="highlight">{selectedType || t('consultations.print.generalConsultation', 'Consultation générale')}</span>
          </p>
          <p>
            <strong><FaHospital /> {t('consultations.labels.healthCenter', 'Centre de santé')}:</strong> 
            <span className="highlight">{selectedCentre?.nom}</span>
          </p>
          {selectedCentre?.TELEPHONE && (
            <p>
              <FaPhone /> <strong>{t('consultations.labels.phone', 'Téléphone')}:</strong> 
              <span className="highlight">{selectedCentre.TELEPHONE}</span>
            </p>
          )}
          <p>
            <strong><FaEuroSign /> {t('consultations.labels.totalAmount', 'Montant total')}:</strong> 
            <span className="highlight">{(montantTotal || 0).toLocaleString()} FCFA</span>
          </p>
          <p>
            <strong>{t('consultations.labels.paymentStatus', 'Statut paiement')}:</strong> 
            <span className={`status ${gratuite ? 'gratuit' : tiersPayant ? 'tiers' : 'apayer'}`}>
              {gratuite ? t('consultations.payment.free', 'Gratuit') : (tiersPayant ? t('consultations.payment.tiers', 'Tiers Payant') : t('consultations.payment.toPay', 'À payer'))}
            </span>
          </p>
        </div>
        <div className="action-buttons">
          <button onClick={handlePrint} className="print-button">
            <FaPrint /> {t('consultations.buttons.printSheet', 'IMPRIMER LA FICHE DE SOINS')}
          </button>
          <button onClick={handleNewConsultation} className="new-button">
            <FaPlus /> {t('consultations.buttons.newConsultation', 'NOUVELLE CONSULTATION')}
          </button>
        </div>
        <div className="print-preview-note">
          <p><strong>{t('consultations.print.sheetWillOpen', 'La fiche de soins s\'ouvrira dans un nouvel onglet pour impression.')}</strong></p>
          <p><em>{t('consultations.print.format', 'Format: 1 page A4 | Vérifiez les paramètres de popup de votre navigateur.')}</em></p>
        </div>
      </div>
    </div>
  );

  // ============= RENDU PRINCIPAL =============
  return (
    <div className="consultations-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <HeaderSection />

      <div className="step-transition">
        {currentStep === 1 && <Step1PatientIdentification />}
        {currentStep === 2 && <Step2ConsultationSettings />}
        {currentStep === 3 && <MedicalInfoStep />}
        {currentStep === 4 && <Step4FinancialBreakdown />}
        {currentStep === 5 && <Step5InsuranceSheet />}
      </div>
    </div>
  );
};

// Styles d'impression MODIFIÉS pour agrandir les écritures
const printStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Inter', 'Segoe UI', sans-serif;
  }
  
  body {
    font-size: 12px;
    line-height: 1.3;
    color: #1a1a1a;
    background: #fff;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    position: relative;
    min-height: 29.7cm;
  }
  
  .print-container {
    width: 20.8cm;
    min-height: 29.5cm;
    margin: 0 auto;
    padding: 0.5cm;
    background: #fff;
    position: relative;
    overflow: hidden;
  }
  
  .print-container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" opacity="0.05"><text x="50%" y="50%" font-family="Arial" font-weight="900" font-size="180" fill="%230066CC" text-anchor="middle" dominant-baseline="middle" transform="rotate(-30 300 150)">AMS</text></svg>'),
      url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="150" opacity="0.04"><text x="50%" y="50%" font-family="Arial" font-weight="700" font-size="60" fill="%23333" text-anchor="middle" dominant-baseline="middle" transform="rotate(30 400 75)">FICHE DE SOINS</text></svg>'),
      url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="150" opacity="0.03"><text x="50%" y="50%" font-family="Arial" font-weight="700" font-size="50" fill="%230066CC" text-anchor="middle" dominant-baseline="middle" transform="rotate(-15 400 75)">CONFIDENTIEL</text></svg>');
    background-repeat: repeat;
    background-position: center center;
    pointer-events: none;
    z-index: 0;
  }
  
  @media print {
    @page {
      size: A4;
      margin: 0.3cm;
    }
    
    body {
      margin: 0;
      padding: 0;
      width: 21cm;
      height: 29.7cm;
    }
    
    .print-container {
      width: 100%;
      min-height: 100%;
      margin: 0;
      padding: 0.3cm;
      page-break-inside: avoid;
    }
    
    .no-print {
      display: none !important;
    }
  }
  
  .header {
    display: grid;
    grid-template-columns: 120px 1fr 180px;
    gap: 12px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2.5px solid #0066CC;
    align-items: start;
    position: relative;
    z-index: 1;
  }
  
  .logo-container {
    padding: 8px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1.5px solid #eaeaea;
    text-align: center;
  }
  
  .logo-img {
    width: 100px;
    height: auto;
    display: block;
    margin: 0 auto;
  }
  
  .header-text {
    text-align: center;
    padding-top: 5px;
  }
  
  .header-title {
    font-size: 20px;
    font-weight: 800;
    color: #0066CC;
    margin-bottom: 3px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  
  .header-subtitle {
    font-size: 11px;
    color: #2e7d32;
    margin-bottom: 6px;
    font-weight: 600;
  }
  
  .centre-info {
    font-size: 9.5px;
    color: #555;
    line-height: 1.2;
    padding: 5px;
    background: #f8f9fa;
    border-radius: 4px;
    margin-top: 3px;
  }
  
  .header-info {
    text-align: right;
    padding: 8px;
    background: #f0f9ff;
    border-radius: 6px;
    border: 1.5px solid #d1e7ff;
  }
  
  .document-number {
    font-weight: 800;
    font-size: 11px;
    color: #d32f2f;
    margin-bottom: 4px;
    padding: 3px 6px;
    background: #fff;
    border: 1.5px solid #ffcdd2;
    border-radius: 4px;
    display: inline-block;
  }
  
  .date-info {
    font-size: 9px;
    color: #333;
    margin-top: 6px;
  }
  
  .courtier-box {
    background: #f0f9ff;
    border: 1.5px solid #0066CC;
    border-radius: 6px;
    padding: 8px;
    margin-bottom: 12px;
    font-size: 9.5px;
    line-height: 1.2;
    position: relative;
    z-index: 1;
  }
  
  .courtier-title {
    font-weight: 800;
    color: #0066CC;
    margin-bottom: 4px;
    text-align: center;
    font-size: 10.5px;
    padding-bottom: 4px;
    border-bottom: 1.5px dashed #0066CC;
  }
  
  .section {
    margin-bottom: 12px;
    padding: 9px;
    border: 1.5px solid #ddd;
    border-radius: 5px;
    background: #fff;
    page-break-inside: avoid;
    position: relative;
    z-index: 1;
    box-shadow: 0 1.5px 4px rgba(0,0,0,0.07);
  }
  
  .section-title {
    font-size: 11px;
    font-weight: 800;
    color: #0066CC;
    margin-bottom: 9px;
    padding-bottom: 6px;
    border-bottom: 1.5px solid #f0f0f0;
    display: flex;
    align-items: center;
  }
  
  .section-title::before {
    content: "";
    display: inline-block;
    width: 14px;
    height: 14px;
    background: #0066CC;
    color: white;
    border-radius: 50%;
    text-align: center;
    line-height: 14px;
    font-size: 8px;
    margin-right: 6px;
    flex-shrink: 0;
  }
  
  .section:nth-child(1) .section-title::before { content: "1"; }
  .section:nth-child(2) .section-title::before { content: "2"; }
  .section:nth-child(3) .section-title::before { content: "3"; }
  
  .grid-3col {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 9px;
  }
  
  .grid-2col {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 9px;
  }
  
  .field {
    margin-bottom: 6px;
  }
  
  .field-label {
    display: block;
    font-weight: 700;
    font-size: 9px;
    margin-bottom: 3px;
    color: #333;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  
  .field-value {
    padding: 5px 6px;
    background: #f8f9fa;
    border: 1.2px solid #e0e0e0;
    border-radius: 4px;
    min-height: 22px;
    font-size: 10.5px;
    line-height: 1.2;
    display: flex;
    align-items: center;
  }
  
  .field-employeur {
    background: #fff3cd !important;
    border-color: #ffeaa7 !important;
    border-left: 4px solid #ffc107 !important;
  }
  
  .financial-section {
    background: #f1f8e9;
    border: 1.5px solid #2e7d32;
    border-left: 4px solid #2e7d32;
  }
  
  .financial-rows {
    margin: 7px 0;
  }
  
  .financial-row {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    border-bottom: 1.2px solid #e0e0e0;
    font-size: 10.5px;
  }
  
  .financial-row:last-child {
    border-bottom: none;
  }
  
  .financial-total {
    display: flex;
    justify-content: space-between;
    padding: 7px 9px;
    background: #2e7d32;
    color: white;
    border-radius: 4px;
    margin-top: 8px;
    font-weight: 800;
    font-size: 11px;
  }
  
  .signatures-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1.5px solid #ddd;
    page-break-inside: avoid;
    position: relative;
    z-index: 1;
  }
  
  .signature-box {
    text-align: center;
    padding: 7px;
  }
  
  .signature-line {
    display: block;
    width: 100%;
    border-bottom: 1.5px solid #333;
    margin: 8px 0 4px;
    height: 30px;
  }
  
  .signature-label {
    display: block;
    font-weight: 800;
    margin-bottom: 7px;
    font-size: 10.5px;
    color: #333;
  }
  
  .signature-name {
    margin-top: 6px;
    font-size: 9px;
    color: #555;
    min-height: 16px;
  }
  
  .diagnostic-field {
    min-height: 60px !important;
    line-height: 1.4 !important;
    white-space: pre-wrap !important;
    overflow-wrap: break-word !important;
    font-size: 10.5px !important;
  }
  
  .qr-section {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1.5px dashed #ddd;
    text-align: center;
    position: relative;
    z-index: 1;
  }
  
  .qr-container {
    display: inline-block;
    padding: 5px;
    background: #fff;
    border: 1.2px solid #e0e0e0;
    border-radius: 5px;
    margin-bottom: 4px;
  }
  
  .qr-code {
    width: 65px;
    height: 65px;
    display: block;
    margin: 0 auto;
  }
  
  .qr-text {
    font-size: 7.5px;
    color: #666;
    margin-top: 3px;
    font-style: italic;
  }
  
  .footer {
    margin-top: 10px;
    padding-top: 6px;
    border-top: 1.5px solid #ddd;
    text-align: center;
    font-size: 7.5px;
    color: #666;
    position: relative;
    z-index: 1;
  }
  
  .footer-note {
    margin-top: 3px;
    font-style: italic;
    line-height: 1.2;
  }
  
  .text-center {
    text-align: center;
  }
  
  .mt-8 {
    margin-top: 10px;
  }
  
  .mb-4 {
    margin-bottom: 6px;
  }
  
  .highlighted {
    background: #e3f2fd;
    border-color: #0066CC;
    font-weight: 700;
  }
  
  .field-assure {
    background: #e8f5e9 !important;
    border-color: #c8e6c9 !important;
  }
  
  .section > *,
  .header > *,
  .courtier-box > *,
  .signatures-section > *,
  .qr-section > *,
  .footer > * {
    position: relative;
    z-index: 2;
  }
  
  .print-container::after {
    content: "DOCUMENT OFFICIEL - FEARLESS CYBERTECH";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    transform: translateY(-50%) rotate(-30deg);
    font-size: 60px;
    font-weight: 900;
    color: rgba(0, 102, 204, 0.07);
    text-align: center;
    pointer-events: none;
    z-index: 1;
    letter-spacing: 5px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
  }
`;

// Fiche de soins avec écritures agrandies
const printContent = (feuilleData, t) => {
  const qrData = {
    document: {
      type: "FICHE_DE_SOINS",
      numero: feuilleData.entete.numero,
      date: feuilleData.entete.dateCreation,
      centre: feuilleData.entete.centreNom.replace(/<[^>]*>/g, '').substring(0, 30)
    },
    
    patient: {
      id: feuilleData.patient.patientInfo.id,
      identifiant: feuilleData.patient.patientInfo.identifiant,
      nom_complet: feuilleData.patient.patientInfo.nom,
      age: feuilleData.patient.patientInfo.age,
      sexe: feuilleData.patient.patientInfo.sexe,
      telephone: feuilleData.patient.patientInfo.telephone,
      assure_principal: feuilleData.patient.patientInfo.assurePrincipal,
      statut_ace: feuilleData.patient.patientInfo.statutACE,
      employeur: feuilleData.patient.patientInfo.employeur,
      date_naissance: feuilleData.patient.dateNaissance
    },
    
    consultation: {
      medecin: feuilleData.consultation.medecin,
      specialite: feuilleData.consultation.specialite,
      type: feuilleData.consultation.type,
      date: feuilleData.consultation.date,
      heure: feuilleData.consultation.heure
    },
    
    financier: {
      montant_total: feuilleData.financier.montantTotal,
      prise_en_charge: feuilleData.financier.montantPrisEnCharge,
      reste_a_charge: feuilleData.financier.resteCharge,
      taux_couverture: feuilleData.financier.tauxCouverture,
      statut_paiement: feuilleData.financier.statutPaiement
    },
    
    metadata: {
      generateur: "AMS_SYSTEM",
      version: "2.0",
      timestamp: Date.now(),
      signature: `AMS-${feuilleData.entete.numero}-${Date.now()}`
    }
  };
  
  const qrString = JSON.stringify(qrData, null, 0);
  console.log('📊 Données du QR code:', qrData);
  console.log('📏 Longueur du QR string:', qrString.length, 'caractères');
  
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=65x65&data=${encodeURIComponent(qrString)}`;
  
  return `
  <div class="print-container">
    <div class="header">
      <div class="logo-container">
        <img src="${feuilleData.entete.logoUrl}" alt="AMS Logo" class="logo-img" />
      </div>
      
      <div class="header-text">
        <h1 class="header-title">${feuilleData.entete.titre}</h1>
        <div class="header-subtitle">${feuilleData.entete.sousTitre}</div>
        <div class="centre-info">
          ${feuilleData.entete.centreNom}<br>
          Tél: ${feuilleData.entete.centreTelephone}<br>
          Email: ${feuilleData.entete.centreEmail}
        </div>
      </div>
      
      <div class="header-info">
        <div class="document-number">${feuilleData.entete.numero}</div>
        <div class="date-info">
          <div><strong>Date:</strong> ${feuilleData.entete.dateCreation}</div>
          <div><strong>Heure:</strong> ${feuilleData.entete.dateHeure.split(' ')[1] || '--:--'}</div>
        </div>
      </div>
    </div>
    
    <div class="courtier-box">
      <div class="courtier-title">${feuilleData.entete.courtier.titre}</div>
      <div>${feuilleData.entete.courtier.adresse} - ${feuilleData.entete.courtier.bp}</div>
      <div>${feuilleData.entete.courtier.telephone}</div>
    </div>
    
    <div class="section">
      <div class="section-title">INFORMATIONS DU PATIENT</div>
      
      <div class="grid-3col">
        <div class="field">
          <div class="field-label">Nom complet</div>
          <div class="field-value highlighted">${feuilleData.patient.nomComplet}</div>
        </div>
        
        <div class="field">
          <div class="field-label">Date naissance</div>
          <div class="field-value">${feuilleData.patient.dateNaissance}</div>
        </div>
        
        <div class="field">
          <div class="field-label">Âge / Sexe</div>
          <div class="field-value">${feuilleData.patient.age} ans / ${feuilleData.patient.sexe}</div>
        </div>
        
        <div class="field">
          <div class="field-label">Identifiant</div>
          <div class="field-value">${feuilleData.patient.identifiant}</div>
        </div>
        
        <div class="field">
          <div class="field-label">Téléphone</div>
          <div class="field-value">${feuilleData.patient.telephone}</div>
        </div>
        
        <div class="field">
          <div class="field-label">Statut ACE</div>
          <div class="field-value highlighted">${feuilleData.patient.statutACE}</div>
        </div>
      </div>
      
      <div class="grid-2col mt-8">
        <div class="field">
          <div class="field-label">Assuré principal</div>
          <div class="field-value field-assure">${feuilleData.patient.assurePrincipal}</div>
        </div>
        
        <div class="field">
          <div class="field-label">Employeur</div>
          <div class="field-value field-employeur">${feuilleData.patient.etablissement}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">INFORMATIONS DE LA CONSULTATION</div>
      
      <div class="grid-3col">
        <div class="field">
          <div class="field-label">Date</div>
          <div class="field-value highlighted">${feuilleData.consultation.date}</div>
        </div>
        
        <div class="field">
          <div class="field-label">Heure</div>
          <div class="field-value">${feuilleData.consultation.heure}</div>
        </div>
        
        <div class="field">
          <div class="field-label">Type</div>
          <div class="field-value">${feuilleData.consultation.type}</div>
        </div>
      </div>
      
      <div class="grid-2col mt-8">
        <div class="field">
          <div class="field-label">Médecin</div>
          <div class="field-value highlighted">${feuilleData.consultation.medecin}</div>
        </div>
        
        <div class="field">
          <div class="field-label">Spécialité</div>
          <div class="field-value field-specialite">${feuilleData.consultation.specialite}</div>
        </div>
      </div>
      
      <div class="field mt-8">
        <div class="field-label">Diagnostic</div>
        <div class="field-value diagnostic-field">${feuilleData.consultation.diagnostic}</div>
      </div>
    </div>
    
    <div class="section financial-section">
      <div class="section-title">DÉCOMPTE FINANCIER</div>
      
      <div class="financial-rows">
        <div class="financial-row">
          <div><strong>Montant consultation</strong></div>
          <div><strong>${feuilleData.financier.montantTotal.toLocaleString()} FCFA</strong></div>
        </div>
        
        ${feuilleData.financier.tauxCouverture > 0 ? `
          <div class="financial-row">
            <div>Prise en charge Assureur (${feuilleData.financier.tauxCouverture}%)</div>
            <div style="color: #2e7d32; font-weight: 600;">- ${feuilleData.financier.montantPrisEnCharge.toLocaleString()} FCFA</div>
          </div>
        ` : ''}
        
        <div class="financial-row">
          <div>Statut paiement</div>
          <div><strong>${feuilleData.financier.statutPaiement}</strong></div>
        </div>
      </div>
      
      <div class="financial-total">
        <div><strong>PART PATIENT</strong></div>
        <div><strong>${feuilleData.financier.resteCharge.toLocaleString()} FCFA</strong></div>
      </div>
    </div>
    
    <div class="signatures-section">
      <div class="signature-box">
        <div class="signature-label">PRESTATAIRE DE SOINS</div>
        <div class="signature-line"></div>
        <div class="signature-name">${feuilleData.signatures.prestataire}</div>
        <div style="font-size: 8px; color: #777; margin-top: 4px;">
          Cachet et signature du médecin
        </div>
      </div>
      
      <div class="signature-box">
        <div class="signature-label">PATIENT OU REPRÉSENTANT</div>
        <div class="signature-line"></div>
        <div class="signature-name">${feuilleData.signatures.patient}</div>
        <div style="font-size: 8px; color: #777; margin-top: 4px;">
          Signature et empreinte digitale
        </div>
      </div>
    </div>
    
    <div class="qr-section">
      <div class="qr-container">
        <img src="${qrUrl}" alt="QR Code" class="qr-code" />
      </div>
      <div class="qr-text">
        <strong>QR Code contenant:</strong><br>
        • Informations du patient<br>
        • Détails de la consultation<br>
        • Données financières<br>
        • Signature électronique
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-note">
        ${feuilleData.entete.numero} • Généré le ${feuilleData.entete.dateHeure} • 
        Document confidentiel • Conserver pour toute réclamation • Page 1/1
      </div>
      <div style="margin-top: 3px; font-size: 7px; color: #888;">
        QR code contient les informations sécurisées du patient et de la consultation
      </div>
    </div>
  </div>
  `;
};

export default Consultations;