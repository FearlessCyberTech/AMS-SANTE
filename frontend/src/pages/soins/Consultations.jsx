import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Modal, Spin, Card, Row, Col, Form, Input, Select, DatePicker, 
         Button, Steps, Tag, Descriptions, Divider, Upload, Checkbox, Slider, 
         Tooltip, Badge, Tabs, Progress, Alert, Collapse, Statistic, Radio, 
         Table, Space, Typography, Empty, Popconfirm } from 'antd';
import { 
  SearchOutlined, UserOutlined, MedicineBoxOutlined, FileTextOutlined,
  DollarOutlined, PrinterOutlined, CameraOutlined, ArrowLeftOutlined,
  ArrowRightOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined,
  PlusOutlined, 
  FileDoneOutlined,
  IdcardOutlined, BarcodeOutlined, TagsOutlined, ReloadOutlined,
  HistoryOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';
import api, { centresAPI, beneficiairesAPI, prestatairesAPI, consultationsAPI } from '../../services/api';
// Import de moment pour le formatage des dates
import moment from 'moment';

// Logo AMS
import AMSLogo from '../../assets/AMS-logo.png';

const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;
const { Text } = Typography;
const { TabPane } = Tabs;

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
    <Modal
      title={
        <Space>
          <CameraOutlined />
          {t('consultations.scanner.title', 'Scanner le code-barres du patient')}
        </Space>
      }
      open={true}
      onCancel={stopScanner}
      footer={null}
      width={600}
    >
      <div id={qrcodeRegionId} style={{ width: '100%', height: '300px', marginBottom: '20px' }} />
      <Alert
        message="Instructions de scan"
        description={
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Placez le code-barres dans le cadre</li>
            <li>La lecture est automatique</li>
            <li>Éclairage suffisant recommandé</li>
          </ul>
        }
        type="info"
        showIcon
      />
    </Modal>
  );
};

const Consultations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  // ============= ÉTATS PRINCIPAUX =============
  const [currentStep, setCurrentStep] = useState(0);
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

  // ============= ÉTATS POUR L'HISTORIQUE =============
  const [historiqueConsultations, setHistoriqueConsultations] = useState([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);
  const [selectedHistorique, setSelectedHistorique] = useState(null);
  const [modalHistoriqueVisible, setModalHistoriqueVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('nouvelle');

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
      // Charger l'historique des consultations du patient
      loadHistoriqueConsultations(selectedPatient.id);
      
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
      message.error(t('consultations.errors.centreChange', 'Erreur lors du changement de centre'));
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
          message.warning(t('consultations.warnings.noActiveDoctors', 'Aucun médecin actif disponible.'));
        }
      } else {
        console.error('❌ Erreur API prestatairesAPI.getAll:', response?.message);
        setPrestataires([]);
        message.error(response?.message || t('consultations.errors.loadingDoctors', 'Erreur lors du chargement des médecins'));
      }
    } catch (error) {
      console.error('❌ Erreur chargement médecins:', error);
      message.error(t('consultations.errors.networkDoctors', 'Erreur réseau lors du chargement des médecins'));
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
            message.info(t('consultations.info.doctorReset', 'Le médecin sélectionné a été réinitialisé car il n\'est pas affecté à ce centre'));
          }
        }
        
        if (formattedPrestataires.length === 0) {
          message.warning(t('consultations.warnings.noDoctorsForCentre', 'Aucun médecin actif disponible pour ce centre.'));
        }
      } else {
        console.error('❌ Erreur API centresAPI.getPrestatairesByCentre:', response?.message);
        setPrestataires([]);
        message.error(response?.message || t('consultations.errors.loadingDoctors', 'Erreur lors du chargement des médecins'));
      }
    } catch (error) {
      console.error('❌ Erreur chargement médecins par centre:', error);
      message.error(t('consultations.errors.networkDoctors', 'Erreur réseau lors du chargement des médecins'));
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
        message.error(t('consultations.errors.noConsultationTypes', 'Aucun type de consultation disponible'));
      }
    } catch (error) {
      console.error('Erreur chargement types:', error);
      message.error(t('consultations.errors.loadingTypes', 'Erreur lors du chargement des types de consultation'));
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
          message.info(t('consultations.info.noCentres', 'Aucun centre de santé disponible'));
        }
      } else {
        console.error('Format de réponse inattendu ou échec:', response);
        setCentresSante([]);
        message.error(t('consultations.errors.loadingCentres', 'Erreur lors du chargement des centres de santé'));
      }
    } catch (error) {
      console.error('Erreur chargement centres santé:', error);
      setCentresSante([]);
      message.error(t('consultations.errors.networkCentres', 'Erreur réseau lors du chargement des centres de santé'));
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

// ============= FONCTIONS POUR L'HISTORIQUE =============
const loadHistoriqueConsultations = async (patientId) => {
  if (!patientId) return;
  
  setLoadingHistorique(true);
  try {
    // CORRECTION : utiliser getByPatientId au lieu de getByPatient
    const response = await consultationsAPI.getByPatientId(patientId);
    
    console.log('📋 Réponse API historique:', response);
    
    if (response && response.success && response.consultations) {
      const formattedConsultations = response.consultations.map(consult => ({
        id: consult.id || consult.COD_CONS,
        COD_CONS: consult.id || consult.COD_CONS,
        DATE_CONSULTATION: consult.date_consultation || consult.DATE_CONSULTATION,
        TYPE_CONSULTATION: consult.type_consultation || consult.TYPE_CONSULTATION,
        MONTANT_CONSULTATION: consult.montant_consultation || consult.MONTANT_CONSULTATION || 0,
        STATUT_PAIEMENT: consult.statut_paiement || consult.STATUT_PAIEMENT || 'Non spécifié',
        NOM_MEDECIN: consult.nom_medecin || consult.NOM_MEDECIN || 'Non spécifié',
        SPECIALITE_MEDECIN: consult.specialite_medecin || consult.SPECIALITE_MEDECIN || '',
        OBSERVATIONS: consult.observations || consult.OBSERVATIONS || '',
        EXAMENS_COMPLEMENTAIRES: consult.examens_complementaires || consult.EXAMENS_COMPLEMENTAIRES || '',
        TRAITEMENT_PRESCRIT: consult.traitement_prescrit || consult.TRAITEMENT_PRESCRIT || '',
        TA: consult.ta || consult.TA || '',
        POIDS: consult.poids || consult.POIDS || '',
        TAILLE: consult.taille || consult.TAILLE || '',
        TEMPERATURE: consult.temperature || consult.TEMPERATURE || '',
        POULS: consult.pouls || consult.POULS || '',
        GLYCEMIE: consult.glycemie || consult.GLYCEMIE || '',
        CENTRE_NOM: consult.centre_nom || consult.CENTRE_NOM || 'Non spécifié',
        PROCHAIN_RDV: consult.prochain_rdv || consult.PROCHAIN_RDV || '',
        MONTANT_PRISE_EN_CHARGE: consult.montant_prise_en_charge || consult.MONTANT_PRISE_EN_CHARGE || 0,
        RESTE_A_CHARGE: consult.reste_a_charge || consult.RESTE_A_CHARGE || 0,
        TAUX_PRISE_EN_CHARGE: consult.taux_prise_en_charge || consult.TAUX_PRISE_EN_CHARGE || 0,
        STATUT_ACE: consult.statut_ace || consult.STATUT_ACE || '',
        NOM_ASSURE_PRINCIPAL: consult.nom_assure_principal || consult.NOM_ASSURE_PRINCIPAL || ''
      }));
      
      console.log(`✅ ${formattedConsultations.length} consultations chargées pour le patient`);
      setHistoriqueConsultations(formattedConsultations);
    } else {
      console.warn('⚠️ Aucune consultation trouvée ou réponse inattendue:', response);
      setHistoriqueConsultations([]);
      if (response && !response.success) {
        message.warning(response.message || t('consultations.warnings.noHistory', 'Aucun historique de consultation disponible'));
      }
    }
  } catch (error) {
    console.error('❌ Erreur chargement historique consultations:', error);
    setHistoriqueConsultations([]);
    message.error(t('consultations.errors.loadingHistory', 'Erreur lors du chargement de l\'historique'));
  } finally {
    setLoadingHistorique(false);
  }
};

  const handleViewHistorique = (consultation) => {
    setSelectedHistorique(consultation);
    setModalHistoriqueVisible(true);
  };

  const handlePrintHistorique = (consultation) => {
    const feuilleData = generateFeuilleDataForHistorique(consultation);
    
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      message.error(t('consultations.errors.popupBlocked', 'Veuillez autoriser les popups pour l\'impression'));
      return;
    }

    const htmlContent = `<!DOCTYPE html><html><head><title>FICHE DE SOINS - Consultation ${consultation.id}</title><meta charset="UTF-8"><style>${printStyles}</style></head><body>${printContent(feuilleData, t)}<script>window.onload=function(){setTimeout(()=>window.print(),500);window.onafterprint=function(){setTimeout(()=>window.close(),500);};}</script></body></html>`;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const generateFeuilleDataForHistorique = (consultation) => {
    const consultationDate = consultation.DATE_CONSULTATION ? 
      new Date(consultation.DATE_CONSULTATION) : new Date();
    
    const patientInfo = {
      id: selectedPatient?.id || 'N/A',
      identifiant: selectedPatient?.identifiant_national || selectedPatient?.IDENTIFIANT_NATIONAL || 'N/A',
      nom: `${selectedPatient?.nom} ${selectedPatient?.prenom}` || 'N/A',
      age: selectedPatient?.age || 'N/A',
      sexe: selectedPatient?.sexe || 'N/A',
      telephone: selectedPatient?.telephone_mobile || selectedPatient?.telephone || selectedPatient?.TELEPHONE_MOBILE || 'N/A',
      assurePrincipal: consultation.NOM_ASSURE_PRINCIPAL || assurePrincipal || 'N/A',
      statutACE: consultation.STATUT_ACE || statutACE || selectedPatient?.statut_ace || selectedPatient?.STATUT_ACE || 'N/A',
      employeur: getEmployeurFromPatient() || 'N/A'
    };
    
    return {
      entete: {
        logoUrl: AMSLogo,
        titre: "FICHE DE CONSULTATION",
        sousTitre: "AMS-CONSULTATIONS MÉDICALES",
        centreNom: consultation.CENTRE_NOM || selectedCentre?.nom || selectedCentre?.NOM_CENTRE || 'Centre de santé',
        centreTelephone: selectedCentre?.TELEPHONE || 'Téléphone non disponible',
        centreEmail: selectedCentre?.EMAIL || 'Email non disponible',
        dateHeure: consultationDate.toLocaleString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        numero: consultation.id ? `CONS-${consultation.id.toString().padStart(8, '0')}` : 'CONS-00000000',
        dateCreation: consultationDate.toLocaleDateString('fr-FR'),
        courtier: COURTIER_ASSURANCES
      },
      patient: {
        nomComplet: selectedPatient ? `${selectedPatient.nom} ${selectedPatient.prenom}` : '___________________________________',
        age: selectedPatient?.age || '____',
        dateNaissance: selectedPatient?.date_naissance ? new Date(selectedPatient.date_naissance).toLocaleDateString('fr-FR') : '__/__/____',
        sexe: selectedPatient?.sexe === 'M' ? 'M' : (selectedPatient?.sexe === 'F' ? 'F' : '_'),
        identifiant: selectedPatient?.identifiant_national || selectedPatient?.IDENTIFIANT_NATIONAL || '_________________',
        telephone: selectedPatient?.telephone_mobile || selectedPatient?.telephone || selectedPatient?.TELEPHONE_MOBILE || '_________________',
        assurePrincipal: consultation.NOM_ASSURE_PRINCIPAL || assurePrincipal || '_________________',
        etablissement: getEmployeurFromPatient(),
        statutACE: consultation.STATUT_ACE || statutACE || '__________',
        idAssurePrincipal: selectedPatient?.id_assure_principal || '__________',
        patientInfo: patientInfo
      },
      consultation: {
        date: consultationDate.toLocaleDateString('fr-FR'),
        heure: consultationDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        medecin: consultation.NOM_MEDECIN || '_____________________________',
        specialite: consultation.SPECIALITE_MEDECIN || '_____________________________',
        type: consultation.TYPE_CONSULTATION || '_________________________',
        motif: 'Consultation médicale',
        diagnostic: consultation.OBSERVATIONS || '___________________________________'
      },
      financier: {
        montantTotal: consultation.MONTANT_CONSULTATION || 0,
        tauxCouverture: consultation.TAUX_PRISE_EN_CHARGE || 0,
        montantPrisEnCharge: consultation.MONTANT_PRISE_EN_CHARGE || 0,
        resteCharge: consultation.RESTE_A_CHARGE || 0,
        statutPaiement: consultation.STATUT_PAIEMENT || 'À payer',
        typePaiement: consultation.STATUT_PAIEMENT || '___________________'
      },
      signatures: {
        prestataire: consultation.NOM_MEDECIN || '________________________',
        patient: selectedPatient ? `${selectedPatient.nom} ${selectedPatient.prenom}` : '________________________',
        dateSignature: consultationDate.toLocaleDateString('fr-FR')
      }
    };
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
    message.success(t('consultations.success.primaryInsuredSelected', 'Assuré principal sélectionné: {{name}}', { name: nomComplet }));
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
        message.success(t('consultations.success.primaryInsuredAutoLoaded', 'Assuré principal chargé automatiquement'));
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
          message.info(t('consultations.info.noPatientsFound', 'Aucun patient trouvé'));
        }
      } else {
        setPatients([]);
        message.error(response?.message || t('consultations.errors.searchFailed', 'Erreur lors de la recherche'));
      }
    } catch (error) {
      console.error('Erreur recherche patient:', error);
      message.error(t('consultations.errors.searchPatient', 'Erreur lors de la recherche du patient'));
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
    message.success(t('consultations.success.patientSelected', 'Patient sélectionné: {{name}}', { name: `${patient.nom} ${patient.prenom}` }));
    setTimeout(() => setCurrentStep(1), 500);
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
      message.error(t('consultations.errors.noPatientSelected', 'Veuillez sélectionner un patient'));
      return;
    }
    
    if (!selectedPrestataire) {
      message.error(t('consultations.errors.noDoctorSelected', 'Veuillez sélectionner un médecin'));
      return;
    }
    
    const prestataireId = parseInt(selectedPrestataire);
    if (isNaN(prestataireId)) {
      message.error(t('consultations.errors.invalidDoctorId', 'ID de médecin invalide'));
      return;
    }
    
    const prestataire = prestataires.find(p => p.id === prestataireId);
    if (!prestataire) {
      message.error(t('consultations.errors.doctorNotFound', 'Médecin non trouvé dans la liste des prestataires actifs'));
      return;
    }
    
    console.log('✅ ID du médecin à envoyer:', prestataireId, 'Nom:', prestataire.nom_complet, 'Spécialité:', prestataire.specialite || prestataire.SPECIALITE);    
    if (!selectedCentreId) {
      message.error(t('consultations.errors.noCentreSelected', 'Veuillez sélectionner un centre de santé'));
      return;
    }
    
    const centreId = parseInt(selectedCentreId);
    if (isNaN(centreId)) {
      message.error(t('consultations.errors.invalidCentreId', 'ID de centre de santé invalide'));
      return;
    }

    const centreExists = centresSante.some(centre => 
      centre.id === centreId || centre.COD_CEN === centreId
    );
    
    if (!centreExists && centresSante.length > 0) {
      message.error(t('consultations.errors.centreNotInList', 'Le centre sélectionné n\'est pas valide'));
      return;
    }
    
    if (!statutACE) {
      const recoveredStatutACE = selectedPatient?.statut_ace || selectedPatient?.STATUT_ACE;
      
      if (!recoveredStatutACE) {
        message.error(t('consultations.errors.aceStatusNotFound', 'Le statut ACE n\'a pas pu être récupéré depuis les informations du bénéficiaire. Veuillez vérifier les données du patient.'));
        return;
      }
      
      setStatutACE(recoveredStatutACE);
      message.info(t('consultations.info.aceStatusRecovered', 'Statut ACE récupéré automatiquement: {{statut}}', { statut: recoveredStatutACE }));
    }

    if (statutACE !== 'Principal' && !assurePrincipal) {
      message.error(t('consultations.errors.noPrimaryInsured', 'Veuillez sélectionner un assuré principal'));
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

    Modal.confirm({
      title: 'Confirmation de validation',
      content: confirmMessage.replace(/\n\n\n/g, '\n\n'),
      okText: 'Confirmer',
      okType: 'primary',
      cancelText: 'Annuler',
      onOk: async () => {
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
            message.success(t('consultations.success.consultationSaved', 'Consultation enregistrée avec succès!'));
            // Recharger l'historique après création
            loadHistoriqueConsultations(selectedPatient.id);
            setCurrentStep(4);
          } else {
            message.error(response.message || t('consultations.errors.saveConsultation', 'Erreur lors de l\'enregistrement'));
          }
        } catch (error) {
          console.error('❌ Erreur validation:', error);
          console.error('Détails de l\'erreur:', error.response?.data || error.message);
          message.error(t('consultations.errors.saveError', 'Erreur lors de l\'enregistrement: ') + error.message);
        } finally {
          setLoading(false);
        }
      }
    });
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
    setCurrentStep(0);
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
    setHistoriqueConsultations([]);
    setSelectedHistorique(null);
    setActiveTab('nouvelle');
    message.info(t('consultations.info.newConsultationReady', 'Nouvelle consultation prête'));
  };

  const handlePrint = () => {
    const feuilleData = getTransformedFeuilleData();
    setFeuilleData(feuilleData);
    
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      message.error(t('consultations.errors.popupBlocked', 'Veuillez autoriser les popups pour l\'impression'));
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

  // ============= STEPS CONFIGURATION =============
  const steps = [
    {
      title: 'Identification Patient',
      icon: <UserOutlined />,
      content: (
        <Card
          title={
            <Space>
              <UserOutlined />
              <span>Identification du Patient</span>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={() => selectedPatient && setCurrentStep(1)}
              disabled={!selectedPatient}
            >
              Continuer
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card size="small">
                <Radio.Group
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  buttonStyle="solid"
                  style={{ width: '100%' }}
                >
                  <Row gutter={[8, 8]}>
                    <Col span={6}>
                      <Radio.Button value="identifiant" style={{ width: '100%', textAlign: 'center' }}>
                        <IdcardOutlined /> Identifiant
                      </Radio.Button>
                    </Col>
                    <Col span={6}>
                      <Radio.Button value="carte" style={{ width: '100%', textAlign: 'center' }}>
                        <IdcardOutlined /> Carte
                      </Radio.Button>
                    </Col>
                    <Col span={6}>
                      <Radio.Button value="nom" style={{ width: '100%', textAlign: 'center' }}>
                        <UserOutlined /> Nom
                      </Radio.Button>
                    </Col>
                    <Col span={6}>
                      <Radio.Button 
                        value="scanner" 
                        style={{ width: '100%', textAlign: 'center' }}
                        onClick={() => setShowScanner(true)}
                      >
                        <BarcodeOutlined /> Scanner
                      </Radio.Button>
                    </Col>
                  </Row>
                </Radio.Group>
              </Card>
            </Col>

            <Col span={24}>
              <Card size="small">
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder={
                      searchType === 'identifiant' ? 'Ex: CM12345678' :
                      searchType === 'carte' ? 'Numéro de carte' :
                      'Nom ou prénom du patient'
                    }
                    value={searchValue}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    prefix={<SearchOutlined />}
                    size="large"
                  />
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={() => handleSearchPatient()}
                    loading={loading}
                    disabled={searchValue.trim().length < 2}
                    size="large"
                  >
                    Rechercher
                  </Button>
                </Space.Compact>
              </Card>
            </Col>

            {patients.length > 0 && (
              <Col span={24}>
                <Card
                  title={`Patients trouvés (${patients.length})`}
                  size="small"
                >
                  <Table
                    dataSource={patients}
                    columns={[
                      {
                        title: 'Nom',
                        dataIndex: 'nom',
                        key: 'nom',
                        render: (text, record) => `${record.nom} ${record.prenom}`
                      },
                      {
                        title: 'Identifiant',
                        dataIndex: 'identifiant_national',
                        key: 'identifiant_national'
                      },
                      {
                        title: 'Âge',
                        dataIndex: 'age',
                        key: 'age',
                        render: (age) => `${age} ans`
                      },
                      {
                        title: 'Sexe',
                        dataIndex: 'sexe',
                        key: 'sexe',
                        render: (sexe) => sexe === 'M' ? 'Masculin' : 'Féminin'
                      },
                      {
                        title: 'Statut ACE',
                        dataIndex: 'statut_ace',
                        key: 'statut_ace'
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: (_, record) => (
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleSelectPatient(record)}
                          >
                            Sélectionner
                          </Button>
                        )
                      }
                    ]}
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                </Card>
              </Col>
            )}

            {selectedPatient && (
              <Col span={24}>
                <Card
                  type="inner"
                  title="Patient sélectionné"
                  extra={
                    <Tag color="green">
                      <CheckCircleOutlined /> Sélectionné
                    </Tag>
                  }
                >
                  <Tabs defaultActiveKey="informations" onChange={setActiveTab} activeKey={activeTab}>
                    <TabPane tab="Informations" key="informations">
                      <Descriptions size="small" column={2}>
                        <Descriptions.Item label="Nom complet">
                          <strong>{selectedPatient.nom} {selectedPatient.prenom}</strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="Identifiant">
                          {selectedPatient.identifiant_national}
                        </Descriptions.Item>
                        <Descriptions.Item label="Âge">
                          {selectedPatient.age} ans
                        </Descriptions.Item>
                        <Descriptions.Item label="Sexe">
                          {selectedPatient.sexe === 'M' ? 'Masculin' : 'Féminin'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Statut ACE">
                          <Tag color="blue">{selectedPatient.statut_ace || 'Non spécifié'}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Employeur">
                          {selectedPatient.employeur || 'Non spécifié'}
                        </Descriptions.Item>
                      </Descriptions>
                    </TabPane>
                    <TabPane 
                      tab={
                        <span>
                          <HistoryOutlined />
                          Historique des consultations ({historiqueConsultations.length})
                        </span>
                      } 
                      key="historique"
                    >
                      <Table
                        dataSource={historiqueConsultations}
                        loading={loadingHistorique}
                        columns={[
                          {
                            title: 'Date',
                            dataIndex: 'DATE_CONSULTATION',
                            key: 'DATE_CONSULTATION',
                            render: (date) => moment(date).format('DD/MM/YYYY HH:mm')
                          },
                          {
                            title: 'Médecin',
                            dataIndex: 'NOM_MEDECIN',
                            key: 'NOM_MEDECIN'
                          },
                          {
                            title: 'Type',
                            dataIndex: 'TYPE_CONSULTATION',
                            key: 'TYPE_CONSULTATION'
                          },
                          {
                            title: 'Montant',
                            dataIndex: 'MONTANT_CONSULTATION',
                            key: 'MONTANT_CONSULTATION',
                            render: (montant) => `${parseFloat(montant || 0).toLocaleString()} FCFA`
                          },
                          {
                            title: 'Statut Paiement',
                            dataIndex: 'STATUT_PAIEMENT',
                            key: 'STATUT_PAIEMENT',
                            render: (statut) => {
                              let color = 'default';
                              if (statut === 'Gratuit') color = 'green';
                              else if (statut === 'Tiers Payant') color = 'blue';
                              else if (statut === 'À payer') color = 'orange';
                              else if (statut === 'Payé') color = 'green';
                              return <Tag color={color}>{statut}</Tag>;
                            }
                          },
                          {
                            title: 'Actions',
                            key: 'actions',
                            render: (_, record) => (
                              <Space>
                                <Button
                                  size="small"
                                  icon={<EyeOutlined />}
                                  onClick={() => handleViewHistorique(record)}
                                >
                                  Détails
                                </Button>
                                <Button
                                  size="small"
                                  icon={<PrinterOutlined />}
                                  onClick={() => handlePrintHistorique(record)}
                                >
                                  Imprimer
                                </Button>
                              </Space>
                            )
                          }
                        ]}
                        pagination={{ pageSize: 5 }}
                        size="small"
                        locale={{
                          emptyText: (
                            <Empty
                              description="Aucune consultation trouvée"
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                          )
                        }}
                      />
                      <div style={{ marginTop: 16, textAlign: 'center' }}>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={() => loadHistoriqueConsultations(selectedPatient.id)}
                          loading={loadingHistorique}
                        >
                          Actualiser l'historique
                        </Button>
                      </div>
                    </TabPane>
                  </Tabs>
                </Card>
              </Col>
            )}
          </Row>
        </Card>
      )
    },
    {
      title: 'Paramétrage',
      icon: <FileTextOutlined />,
      content: (
        <Card
          title={
            <Space>
              <FileTextOutlined />
              <span>Paramétrage de la Consultation</span>
            </Space>
          }
          extra={
            <Space>
              <Button onClick={() => setCurrentStep(0)}>
                <ArrowLeftOutlined /> Retour
              </Button>
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={() => setCurrentStep(2)}
                disabled={!selectedPrestataire || !selectedCentreId}
              >
                Continuer
              </Button>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card size="small" title="Configuration">
                <Form layout="vertical">
                  <Form.Item label="Centre de santé">
                    <Select
                      value={selectedCentreId}
                      onChange={handleCentreChange}
                      loading={loadingCentres}
                      placeholder="Sélectionnez un centre"
                      style={{ width: '100%' }}
                    >
                      <Option value="">Tous les centres</Option>
                      {centresSante.map(centre => (
                        <Option key={centre.id} value={centre.id}>
                          {centre.nom}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item label="Médecin">
                    <Select
                      value={selectedPrestataire}
                      onChange={setSelectedPrestataire}
                      disabled={!selectedCentreId}
                      placeholder="Sélectionnez un médecin"
                      style={{ width: '100%' }}
                    >
                      {prestataires.map(prestataire => (
                        <Option key={prestataire.id} value={prestataire.id}>
                          {prestataire.nom_complet} - {prestataire.specialite}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item label="Type de consultation">
                    <Select
                      value={selectedType}
                      onChange={handleTypeChange}
                      placeholder="Sélectionnez un type"
                      style={{ width: '100%' }}
                    >
                      {typesConsultation.map(type => (
                        <Option key={type.LIB_TYP_CONS} value={type.LIB_TYP_CONS}>
                          {type.LIB_TYP_CONS} - {(type.MONTANT || 0).toLocaleString()} FCFA
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item>
                    <Checkbox
                      checked={gratuite}
                      onChange={(e) => handleGratuiteChange(e.target.checked)}
                    >
                      Consultation gratuite
                    </Checkbox>
                  </Form.Item>

                  <Form.Item label="Montant de la consultation (FCFA)">
                    <Input
                      type="number"
                      value={montantEditable}
                      onChange={(e) => handleMontantChange(e.target.value)}
                      disabled={gratuite}
                      addonAfter="FCFA"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col span={12}>
              <Card size="small" title="Résumé">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Patient">
                    <strong>{selectedPatient?.nom} {selectedPatient?.prenom}</strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Statut ACE">
                    <Tag color="blue">{statutACE || selectedPatient?.statut_ace}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Centre de santé">
                    {selectedCentre?.nom || 'Non sélectionné'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Médecin">
                    {selectedPrestataire ? 
                      prestataires.find(p => p.id === parseInt(selectedPrestataire))?.nom_complet : 
                      'Non sélectionné'
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Type de consultation">
                    {selectedType || 'Non sélectionné'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Montant">
                    <Tag color={gratuite ? 'green' : 'blue'}>
                      {gratuite ? 'GRATUIT' : `${montantTotal.toLocaleString()} FCFA`}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </Card>
      )
    },
    {
      title: 'Informations Médicales',
      icon: <MedicineBoxOutlined />,
      content: (
        <Card
          title={
            <Space>
              <MedicineBoxOutlined />
              <span>Informations Médicales</span>
            </Space>
          }
          extra={
            <Space>
              <Button onClick={() => setCurrentStep(1)}>
                <ArrowLeftOutlined /> Retour
              </Button>
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={() => setCurrentStep(3)}
              >
                Continuer
              </Button>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Collapse defaultActiveKey={['1']}>
                <Panel header="Statut ACE et Assuré Principal" key="1">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item label="Statut ACE">
                        <Input
                          value={statutACE}
                          readOnly
                          prefix={<TagsOutlined />}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Assuré Principal">
                        {statutACE === 'Principal' ? (
                          <Input
                            value={`${selectedPatient?.nom} ${selectedPatient?.prenom} (Lui-même)`}
                            readOnly
                          />
                        ) : (
                          <Space.Compact style={{ width: '100%' }}>
                            <Input
                              value={assurePrincipal}
                              readOnly
                              placeholder="Rechercher un assuré principal"
                              onClick={() => setShowAssureSearch(true)}
                            />
                            <Button
                              type="primary"
                              icon={<SearchOutlined />}
                              onClick={() => setShowAssureSearch(true)}
                            />
                          </Space.Compact>
                        )}
                      </Form.Item>
                    </Col>
                  </Row>
                </Panel>

                <Panel header="Signes Vitaux" key="2">
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Form.Item label="Tension artérielle (TA)">
                        <Input
                          value={ta}
                          onChange={(e) => setTa(e.target.value)}
                          placeholder="Ex: 120/80"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Poids (kg)">
                        <Input
                          type="number"
                          value={poids}
                          onChange={(e) => setPoids(e.target.value)}
                          placeholder="Ex: 70"
                          addonAfter="kg"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Taille (cm)">
                        <Input
                          type="number"
                          value={taille}
                          onChange={(e) => setTaille(e.target.value)}
                          placeholder="Ex: 175"
                          addonAfter="cm"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Température (°C)">
                        <Input
                          type="number"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          placeholder="Ex: 37.5"
                          addonAfter="°C"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Pouls (bpm)">
                        <Input
                          type="number"
                          value={pouls}
                          onChange={(e) => setPouls(e.target.value)}
                          placeholder="Ex: 72"
                          addonAfter="bpm"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Glycémie (g/L)">
                        <Input
                          type="number"
                          value={glycemie}
                          onChange={(e) => setGlycemie(e.target.value)}
                          placeholder="Ex: 1.0"
                          addonAfter="g/L"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Panel>

                <Panel header="Prescription Médicale" key="3">
                  <Form layout="vertical">
                    <Form.Item label="Observations médicales">
                      <TextArea
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        rows={3}
                        placeholder="Saisir les observations médicales"
                      />
                    </Form.Item>
                    <Form.Item label="Examens complémentaires">
                      <TextArea
                        value={examens}
                        onChange={(e) => setExamens(e.target.value)}
                        rows={2}
                        placeholder="Liste des examens complémentaires"
                      />
                    </Form.Item>
                    <Form.Item label="Traitement prescrit">
                      <TextArea
                        value={traitements}
                        onChange={(e) => setTraitements(e.target.value)}
                        rows={2}
                        placeholder="Médicaments et posologie"
                      />
                    </Form.Item>
                    <Form.Item label="Recommandations">
                      <TextArea
                        value={recommandations}
                        onChange={(e) => setRecommandations(e.target.value)}
                        rows={2}
                        placeholder="Recommandations pour le patient"
                      />
                    </Form.Item>
                  </Form>
                </Panel>

                <Panel header="Informations Complémentaires" key="4">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item label="Code affection">
                        <Input
                          value={codeAffection}
                          onChange={(e) => setCodeAffection(e.target.value)}
                          placeholder="Saisir le code affection"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Prochain rendez-vous">
                        <DatePicker
                          value={dateRendezVous ? moment(dateRendezVous) : null}
                          onChange={(date) => setDateRendezVous(date ? date.format('YYYY-MM-DD') : '')}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item>
                        <Checkbox
                          checked={accidentTiers}
                          onChange={(e) => setAccidentTiers(e.target.checked)}
                        >
                          Accident causé par un tiers
                        </Checkbox>
                      </Form.Item>
                      {accidentTiers && (
                        <Form.Item label="Date de l'accident">
                          <DatePicker
                            value={dateAccident ? moment(dateAccident) : null}
                            onChange={(date) => setDateAccident(date ? date.format('YYYY-MM-DD') : '')}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      )}
                    </Col>
                  </Row>
                </Panel>
              </Collapse>
            </Col>
          </Row>
        </Card>
      )
    },
    {
      title: 'Décompte Financier',
      icon: <DollarOutlined />,
      content: (
        <Card
          title={
            <Space>
              <DollarOutlined />
              <span>Décompte Financier et Validation</span>
            </Space>
          }
          extra={
            <Space>
              <Button onClick={() => setCurrentStep(2)}>
                <ArrowLeftOutlined /> Retour
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleValidate}
                loading={loading}
                disabled={!selectedCentreId || !statutACE || (statutACE !== 'Principal' && !assurePrincipal)}
              >
                Valider
              </Button>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card size="small" title="Configuration du paiement">
                <Form layout="vertical">
                  <Form.Item>
                    <Checkbox
                      checked={tiersPayant}
                      onChange={(e) => setTiersPayant(e.target.checked)}
                      disabled={gratuite}
                    >
                      Tiers Payant
                    </Checkbox>
                  </Form.Item>

                  {tiersPayant && !gratuite && (
                    <Form.Item label={`Pourcentage de couverture: ${pourcentageCouverture}%`}>
                      <Slider
                        min={0}
                        max={100}
                        value={pourcentageCouverture}
                        onChange={setPourcentageCouverture}
                        disabled={gratuite}
                      />
                    </Form.Item>
                  )}

                  <Divider />

                  <Form.Item label="Détails du patient">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Nom">
                        {selectedPatient?.nom} {selectedPatient?.prenom}
                      </Descriptions.Item>
                      <Descriptions.Item label="Statut ACE">
                        <Tag color="blue">{statutACE}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Assuré principal">
                        {statutACE === 'Principal' ? 
                          `${selectedPatient?.nom} ${selectedPatient?.prenom} (Lui-même)` : 
                          assurePrincipal || 'Non spécifié'
                        }
                      </Descriptions.Item>
                      <Descriptions.Item label="Centre de santé">
                        {selectedCentre?.nom}
                      </Descriptions.Item>
                    </Descriptions>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col span={12}>
              <Card size="small" title="Résumé financier">
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Statistic
                      title="Montant total consultation"
                      value={montantTotal}
                      precision={0}
                      prefix={<DollarOutlined />}
                      suffix="FCFA"
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>

                  {tiersPayant && !gratuite && pourcentageCouverture > 0 && (
                    <Col span={24}>
                      <Statistic
                        title={`Prise en charge (${pourcentageCouverture}%)`}
                        value={montantPrisEnCharge}
                        precision={0}
                        prefix={<DollarOutlined />}
                        suffix="FCFA"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                  )}

                  {gratuite && (
                    <Col span={24}>
                      <Alert
                        message="Consultation gratuite"
                        type="success"
                        showIcon
                      />
                    </Col>
                  )}

                  <Col span={24}>
                    <Card
                      type="inner"
                      title="RESTE À CHARGE PATIENT"
                      style={{ background: '#f6ffed' }}
                    >
                      <Statistic
                        value={resteCharge}
                        precision={0}
                        prefix={<DollarOutlined />}
                        suffix="FCFA"
                        valueStyle={{ 
                          fontSize: '24px',
                          color: resteCharge > 0 ? '#cf1322' : '#52c41a'
                        }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Divider />

                <Alert
                  message="Avertissement"
                  description="La validation est IRREVERSIBLE. La consultation sera enregistrée et facturable."
                  type="warning"
                  showIcon
                />
              </Card>
            </Col>
          </Row>
        </Card>
      )
    },
    {
      title: 'Fiche de Soins',
      icon: <FileDoneOutlined />,
      content: (
        <Card
          title={
            <Space>
              <FileDoneOutlined />
              <span>Fiche de Soins</span>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
            >
              Imprimer
            </Button>
          }
        >
          <Row justify="center" gutter={[16, 16]}>
            <Col span={24}>
              <Alert
                message="Consultation enregistrée avec succès!"
                description={`Numéro de consultation: ${consultationId}`}
                type="success"
                showIcon
                style={{ marginBottom: '20px' }}
              />
            </Col>

            <Col span={24}>
              <Card size="small">
                <Descriptions title="Détails de la consultation" column={2} bordered>
                  <Descriptions.Item label="Patient" span={2}>
                    <strong>{selectedPatient?.nom} {selectedPatient?.prenom}</strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Statut ACE">
                    <Tag color="blue">{statutACE}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Assuré principal">
                    {statutACE === 'Principal' ? 
                      `${selectedPatient?.nom} ${selectedPatient?.prenom}` : 
                      assurePrincipal
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Centre de santé">
                    {selectedCentre?.nom}
                  </Descriptions.Item>
                  <Descriptions.Item label="Médecin">
                    {prestataires.find(p => p.id === parseInt(selectedPrestataire))?.nom_complet}
                  </Descriptions.Item>
                  <Descriptions.Item label="Type de consultation">
                    {selectedType}
                  </Descriptions.Item>
                  <Descriptions.Item label="Montant total">
                    <Tag color="blue">{montantTotal.toLocaleString()} FCFA</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Statut paiement">
                    <Tag color={gratuite ? 'green' : tiersPayant ? 'orange' : 'red'}>
                      {gratuite ? 'Gratuit' : tiersPayant ? 'Tiers Payant' : 'À payer'}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            <Col span={24}>
              <Space>
                <Button
                  type="primary"
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                  size="large"
                >
                  Imprimer la fiche de soins
                </Button>
                <Button
                  icon={<PlusOutlined />}
                  onClick={handleNewConsultation}
                  size="large"
                >
                  Nouvelle consultation
                </Button>
                <Button
                  icon={<HistoryOutlined />}
                  onClick={() => {
                    setCurrentStep(0);
                    setActiveTab('historique');
                  }}
                  size="large"
                >
                  Voir l'historique
                </Button>
              </Space>
            </Col>

            <Col span={24}>
              <Alert
                message="Information"
                description="La fiche de soins s'ouvrira dans un nouvel onglet pour impression."
                type="info"
                showIcon
              />
            </Col>
          </Row>
        </Card>
      )
    }
  ];

  // ============= MODAL POUR DÉTAILS HISTORIQUE =============
  const HistoriqueDetailModal = () => {
    if (!selectedHistorique) return null;
    
    return (
      <Modal
        title={`Détails de la consultation - ${moment(selectedHistorique.DATE_CONSULTATION).format('DD/MM/YYYY HH:mm')}`}
        open={modalHistoriqueVisible}
        onCancel={() => setModalHistoriqueVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalHistoriqueVisible(false)}>
            Fermer
          </Button>,
          <Button 
            key="print" 
            type="primary" 
            icon={<PrinterOutlined />}
            onClick={() => {
              handlePrintHistorique(selectedHistorique);
              setModalHistoriqueVisible(false);
            }}
          >
            Imprimer
          </Button>
        ]}
        width={800}
      >
        <Card size="small">
          <Descriptions title="Informations générales" column={1} bordered>
            <Descriptions.Item label="Date">
              {moment(selectedHistorique.DATE_CONSULTATION).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Médecin">
              {selectedHistorique.NOM_MEDECIN}
            </Descriptions.Item>
            <Descriptions.Item label="Spécialité">
              {selectedHistorique.SPECIALITE_MEDECIN || 'Non spécifiée'}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              {selectedHistorique.TYPE_CONSULTATION}
            </Descriptions.Item>
            <Descriptions.Item label="Centre">
              {selectedHistorique.CENTRE_NOM}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Descriptions title="Informations médicales" column={1} bordered>
            <Descriptions.Item label="Observations">
              {selectedHistorique.OBSERVATIONS || 'Aucune observation'}
            </Descriptions.Item>
            <Descriptions.Item label="Examens complémentaires">
              {selectedHistorique.EXAMENS_COMPLEMENTAIRES || 'Aucun examen'}
            </Descriptions.Item>
            <Descriptions.Item label="Traitement prescrit">
              {selectedHistorique.TRAITEMENT_PRESCRIT || 'Aucun traitement'}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Descriptions title="Signes vitaux" column={2} bordered>
            <Descriptions.Item label="TA">
              {selectedHistorique.TA || 'Non mesuré'}
            </Descriptions.Item>
            <Descriptions.Item label="Poids">
              {selectedHistorique.POIDS ? `${selectedHistorique.POIDS} kg` : 'Non mesuré'}
            </Descriptions.Item>
            <Descriptions.Item label="Taille">
              {selectedHistorique.TAILLE ? `${selectedHistorique.TAILLE} cm` : 'Non mesuré'}
            </Descriptions.Item>
            <Descriptions.Item label="Température">
              {selectedHistorique.TEMPERATURE ? `${selectedHistorique.TEMPERATURE} °C` : 'Non mesuré'}
            </Descriptions.Item>
            <Descriptions.Item label="Pouls">
              {selectedHistorique.POULS ? `${selectedHistorique.POULS} bpm` : 'Non mesuré'}
            </Descriptions.Item>
            <Descriptions.Item label="Glycémie">
              {selectedHistorique.GLYCEMIE ? `${selectedHistorique.GLYCEMIE} g/L` : 'Non mesuré'}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Descriptions title="Informations financières" column={2} bordered>
            <Descriptions.Item label="Montant consultation">
              <Tag color="blue">{parseFloat(selectedHistorique.MONTANT_CONSULTATION || 0).toLocaleString()} FCFA</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Statut paiement">
              <Tag color={
                selectedHistorique.STATUT_PAIEMENT === 'Gratuit' ? 'green' :
                selectedHistorique.STATUT_PAIEMENT === 'Tiers Payant' ? 'blue' :
                selectedHistorique.STATUT_PAIEMENT === 'Payé' ? 'green' : 'orange'
              }>
                {selectedHistorique.STATUT_PAIEMENT}
              </Tag>
            </Descriptions.Item>
            {selectedHistorique.TAUX_PRISE_EN_CHARGE > 0 && (
              <>
                <Descriptions.Item label="Taux prise en charge">
                  {selectedHistorique.TAUX_PRISE_EN_CHARGE}%
                </Descriptions.Item>
                <Descriptions.Item label="Montant pris en charge">
                  {parseFloat(selectedHistorique.MONTANT_PRISE_EN_CHARGE || 0).toLocaleString()} FCFA
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="Reste à charge">
              <Tag color={selectedHistorique.RESTE_A_CHARGE > 0 ? 'red' : 'green'}>
                {parseFloat(selectedHistorique.RESTE_A_CHARGE || 0).toLocaleString()} FCFA
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Descriptions title="Informations ACE" column={2} bordered>
            <Descriptions.Item label="Statut ACE">
              <Tag color="blue">{selectedHistorique.STATUT_ACE || statutACE}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Assuré principal">
              {selectedHistorique.NOM_ASSURE_PRINCIPAL || assurePrincipal}
            </Descriptions.Item>
          </Descriptions>

          {selectedHistorique.PROCHAIN_RDV && (
            <>
              <Divider />
              <Alert
                message={`Prochain rendez-vous: ${moment(selectedHistorique.PROCHAIN_RDV).format('DD/MM/YYYY')}`}
                type="info"
                showIcon
              />
            </>
          )}
        </Card>
      </Modal>
    );
  };

  // ============= MODAL POUR RECHERCHE ASSURÉ PRINCIPAL =============
  const AssureSearchModal = () => (
    <Modal
      title="Rechercher un assuré principal"
      open={showAssureSearch}
      onCancel={() => {
        setShowAssureSearch(false);
        setSearchAssureValue('');
        setAssuresPrincipaux([]);
      }}
      footer={null}
      width={800}
    >
      <Space.Compact style={{ width: '100%', marginBottom: '20px' }}>
        <Input
          placeholder="Rechercher un assuré principal (nom, prénom, identifiant)"
          value={searchAssureValue}
          onChange={(e) => handleSearchAssureChange(e.target.value)}
          prefix={<SearchOutlined />}
        />
        <Button
          icon={<CloseCircleOutlined />}
          onClick={() => {
            setShowAssureSearch(false);
            setSearchAssureValue('');
            setAssuresPrincipaux([]);
          }}
        />
      </Space.Compact>

      {assuresPrincipaux.length > 0 ? (
        <Table
          dataSource={assuresPrincipaux}
          columns={[
            {
              title: 'Nom',
              dataIndex: 'NOM_BEN',
              key: 'NOM_BEN',
              render: (text, record) => `${record.NOM_BEN} ${record.PRE_BEN}`
            },
            {
              title: 'Identifiant',
              dataIndex: 'IDENTIFIANT_NATIONAL',
              key: 'IDENTIFIANT_NATIONAL'
            },
            {
              title: 'Téléphone',
              dataIndex: 'TELEPHONE_MOBILE',
              key: 'TELEPHONE_MOBILE'
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleSelectAssurePrincipal(record)}
                >
                  Sélectionner
                </Button>
              )
            }
          ]}
          pagination={{ pageSize: 5 }}
          size="small"
        />
      ) : searchAssureValue.length >= 2 ? (
        <Empty description="Aucun assuré principal trouvé" />
      ) : (
        <Alert
          message="Astuce"
          description="Saisissez au moins 2 caractères pour lancer la recherche"
          type="info"
          showIcon
        />
      )}
    </Modal>
  );

  // ============= RENDU PRINCIPAL =============
  return (
    <div style={{ padding: '20px' }}>
      <Card 
        title={
          <Space>
            <MedicineBoxOutlined />
            <span>Gestion des Consultations</span>
          </Space>
        }
        extra={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/dashboard')}
          >
            Retour
          </Button>
        }
        style={{ marginBottom: '20px' }}
      >
        <Steps current={currentStep} style={{ marginBottom: '40px' }}>
          {steps.map((item, index) => (
            <Step 
              key={index} 
              title={item.title} 
              icon={item.icon}
              disabled={index > currentStep && !selectedPatient}
            />
          ))}
        </Steps>

        <div>{steps[currentStep].content}</div>
      </Card>

      {showScanner && (
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      <AssureSearchModal />
      <HistoriqueDetailModal />
    </div>
  );
};

// Styles d'impression (inchangés)
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

// Fiche de soins avec écritures agrandies (inchangée)
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