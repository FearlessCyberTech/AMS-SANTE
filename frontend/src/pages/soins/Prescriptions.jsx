import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Row, Col, Button, Modal, Form,
  Select, Input, Table, Tag, Space, message, Tabs,
  Descriptions, Alert, Typography,
  InputNumber, DatePicker, AutoComplete,
  Spin, Empty, Divider, Steps, Result, Statistic,
  Checkbox, Radio, Upload, Drawer, Popover, Tooltip,
  Badge, Progress, TimePicker, List, Avatar,
  Timeline, Switch, Cascader
} from 'antd';
import {
  FileTextOutlined, MedicineBoxOutlined, SearchOutlined,
  PlusOutlined, DeleteOutlined, EyeOutlined,
  PrinterOutlined, CheckCircleOutlined, SyncOutlined,
  UserOutlined, CloseCircleOutlined, DownloadOutlined,
  HistoryOutlined, CalculatorOutlined, DollarOutlined,
  TeamOutlined, HeartOutlined, DatabaseOutlined,
  PercentageOutlined, InfoCircleOutlined, LoadingOutlined,
  EditOutlined, InfoCircleFilled, AppstoreAddOutlined,
  PlayCircleOutlined, StopOutlined, ClockCircleOutlined,
  CheckOutlined, CloseOutlined, FilterOutlined,
  FilePdfOutlined, FileExcelOutlined, ShareAltOutlined,
  CalendarOutlined, ArrowRightOutlined, ReloadOutlined,
  BellOutlined, SettingOutlined, ProfileOutlined,
  SafetyCertificateOutlined, QrcodeOutlined, BarcodeOutlined,
  CheckCircleFilled
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/fr';
import {
  prestationsAPI, beneficiairesAPI, prescriptionsAPI,
  prestatairesAPI, centresAPI, affectionsAPI, baremesAPI
} from '../../services/api'; 
import AMSlogo from "../../assets/AMS-logo.png";

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;
const { TabPane } = Tabs;
const { Step } = Steps;
const { RangePicker } = DatePicker;

const Prescriptions = () => {
  // ==================== ÉTATS PRINCIPAUX ====================
  const [activeTab, setActiveTab] = useState('saisie');
  const [loading, setLoading] = useState({
    patient: false,
    prestations: false,
    prescrire: false,
    impression: false,
    prestataires: false,
    centres: false,
    actes: false,
    affections: false,
    execution: false,
    historique: false,
    details: false
  });

  // États pour la saisie de prescription
  const [patient, setPatient] = useState(null);
  const [prescriptionForm] = Form.useForm();
  const [selectedPrestations, setSelectedPrestations] = useState([]);
  const [typePrestation, setTypePrestation] = useState('PHARMACIE');
  const [searchPrestation, setSearchPrestation] = useState('');
  
  // États pour les affections avec COD_PAY = 'CMF' par défaut
  const [affectionCode, setAffectionCode] = useState('');
  const [affectionLibelle, setAffectionLibelle] = useState('');
  const [affectionDetails, setAffectionDetails] = useState(null);
  const [affectionOptions, setAffectionOptions] = useState([]);
  const [searchingAffections, setSearchingAffections] = useState(false);
  const COD_PAY_DEFAULT = 'CMF';
  
  // Gestion des centres
  const [centreId, setCentreId] = useState(() => {
    const savedCentre = localStorage.getItem('selectedCentre');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userCentreId = user?.centre_id || user?.COD_CEN || user?.prestataire?.centre_id;
    return userCentreId || savedCentre || null;
  });
  
  const [centres, setCentres] = useState([]);
  const [centreNom, setCentreNom] = useState('');
  const [loadingCentres, setLoadingCentres] = useState(false);
  const [centreDetails, setCentreDetails] = useState(null);

  // États pour les actes médicaux
  const [actesMedicaux, setActesMedicaux] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loadingActes, setLoadingActes] = useState(false);
  
  // États pour les prestataires (médecins)
  const [prestataires, setPrestataires] = useState([]);
  const [selectedPrestataire, setSelectedPrestataire] = useState(null);
  const [modalPrestataires, setModalPrestataires] = useState(false);
  const [loadingPrestataires, setLoadingPrestataires] = useState(false);

  // États pour la saisie manuelle
  const [manualEntryModal, setManualEntryModal] = useState(false);
  const [manualForm] = Form.useForm();
  const [manualEntryType, setManualEntryType] = useState('MEDICAMENT');
  
  // États pour l'impression
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [ordonnanceToPrint, setOrdonnanceToPrint] = useState(null);
  const [printingOrdonnance, setPrintingOrdonnance] = useState(false);
  
  // ==================== ONGLET EXÉCUTION ====================
  const [prescriptionNumero, setPrescriptionNumero] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [actesExecutes, setActesExecutes] = useState([]);
  const [totalFacture, setTotalFacture] = useState(0);
  
  // ==================== ONGLET HISTORIQUE ====================
  const [mesPrescriptions, setMesPrescriptions] = useState([]);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedPrescriptionDetails, setSelectedPrescriptionDetails] = useState(null);
  
  // ==================== FONCTIONS UTILITAIRES ====================
  
  const getTypeLabel = (type) => {
    const typeMap = {
      'PHARMACIE': 'PHARMACIE',
      'BIOLOGIE': 'BIOLOGIE',
      'IMAGERIE': 'IMAGERIE',
      'HOSPITALISATION': 'HOSPITALISATION',
      'CONSULTATION': 'CONSULTATION',
      'KINESITHERAPIE': 'KINÉSITHÉRAPIE',
      'INFIRMIER': 'SOINS INFIRMIERS',
      'MEDICAMENT': 'MÉDICAMENT',
      'EXAMEN': 'EXAMEN',
      'ACTE': 'ACTE MÉDICAL'
    };
    return typeMap[type] || 'PRESCRIPTION MÉDICALE';
  };

  const getTypeColor = (type) => {
    const colorMap = {
      'PHARMACIE': '#1890ff',
      'BIOLOGIE': '#722ed1',
      'IMAGERIE': '#13c2c2',
      'HOSPITALISATION': '#f5222d',
      'CONSULTATION': '#52c41a',
      'KINESITHERAPIE': '#fa8c16',
      'INFIRMIER': '#faad14',
      'MEDICAMENT': '#2f54eb',
      'EXAMEN': '#eb2f96',
      'ACTE': '#08979c'
    };
    return colorMap[type] || '#1890ff';
  };

  const generatePrescriptionNumber = () => {
    const date = moment().format('YYMMDD');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const prefix = typePrestation.substring(0, 3);
    return `${prefix}-${date}-${random}`;
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    try {
      const birthDate = moment(dateOfBirth);
      const age = moment().diff(birthDate, 'years');
      return age;
    } catch (error) {
      return 'N/A';
    }
  };

  // Fonction pour obtenir le nom du centre à partir de son ID
  const getCentreNameById = (centreId) => {
    if (!centreId) return 'Centre inconnu';
    
    const centre = centres.find(c => 
      (c.id && c.id.toString() === centreId.toString()) || 
      (c.COD_CEN && c.COD_CEN.toString() === centreId.toString())
    );
    
    if (centre) {
      return centre.nom || centre.LIB_CEN || centre.NOM_CENTRE || `Centre ${centreId}`;
    }
    
    return `Centre ${centreId}`;
  };

  // ==================== CHARGEMENT DES DONNÉES RÉELLES ====================
  
  // Charger les centres de santé
  const loadCentres = useCallback(async () => {
    try {
      setLoadingCentres(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userCentreId = user?.centre_id || user?.COD_CEN || user?.prestataire?.centre_id;
      
      let response;
      
      if (user && !user.super_admin && userCentreId) {
        response = await centresAPI.getById(userCentreId);
        
        if (response.success && response.centre) {
          setCentres([response.centre]);
          const centreIdToSet = response.centre.id || response.centre.COD_CEN;
          setCentreId(centreIdToSet?.toString());
          localStorage.setItem('selectedCentre', centreIdToSet?.toString());
          setCentreNom(response.centre.nom || response.centre.LIB_CEN || `Centre ${centreIdToSet}`);
          setCentreDetails(response.centre);
        } else {
          response = await centresAPI.getAll();
        }
      } else {
        response = await centresAPI.getAll();
      }
      
      if (response.success && Array.isArray(response.centres)) {
        const validCentres = response.centres.filter(centre => centre && (centre.id || centre.COD_CEN));
        setCentres(validCentres);
        
        if (validCentres.length > 0 && !centreId) {
          const firstCentre = validCentres[0];
          const newCentreId = firstCentre.id || firstCentre.COD_CEN;
          setCentreId(newCentreId.toString());
          localStorage.setItem('selectedCentre', newCentreId.toString());
          setCentreNom(firstCentre.nom || firstCentre.LIB_CEN || `Centre ${newCentreId}`);
          setCentreDetails(firstCentre);
        }
      } else if (response.success && response.centre) {
        setCentres([response.centre]);
        const centreIdToSet = response.centre.id || response.centre.COD_CEN;
        setCentreId(centreIdToSet?.toString());
        setCentreNom(response.centre.nom || response.centre.LIB_CEN || `Centre ${centreIdToSet}`);
        setCentreDetails(response.centre);
      }
      
    } catch (error) {
      console.error('Erreur chargement centres:', error);
      message.error('Erreur lors du chargement des centres de santé');
    } finally {
      setLoadingCentres(false);
    }
  }, [centreId]);

  // Mettre à jour le nom du centre
  useEffect(() => {
    if (centreId && centres.length > 0) {
      const centre = centres.find(c => 
        (c.id && c.id.toString() === centreId.toString()) || 
        (c.COD_CEN && c.COD_CEN.toString() === centreId.toString())
      );
      if (centre) {
        setCentreNom(centre.nom || centre.LIB_CEN || centre.NOM_CENTRE || `Centre ${centreId}`);
        setCentreDetails(centre);
      }
    }
  }, [centreId, centres]);

  // Charger les prestataires du centre
  const loadPrestataires = useCallback(async () => {
    try {
      if (!centreId || centreId === 'null' || centreId === 'undefined') {
        return;
      }
      
      setLoadingPrestataires(true);
      
      const response = await centresAPI.getPrestatairesByCentre(centreId, {
        type_prestataire: 'MEDECIN',
        actif: '1',
        affectation_active: '1',
        limit: 100
      });
      
      if (response.success && Array.isArray(response.prestataires)) {
        const formattedPrestataires = response.prestataires.map(p => ({
          id: p.id || p.COD_PRE,
          COD_PRE: p.COD_PRE || p.id,
          NOM_PRESTATAIRE: p.NOM_PRESTATAIRE || p.nom || 'Nom non spécifié',
          PRENOM_PRESTATAIRE: p.PRENOM_PRESTATAIRE || p.prenom || '',
          SPECIALITE: p.SPECIALITE || p.specialite || '',
          TELEPHONE: p.TELEPHONE || p.telephone || '',
          EMAIL: p.EMAIL || p.email || '',
          MATRICULE: p.MATRICULE || p.matricule || '',
          SEXE: p.SEXE || p.sexe || '',
          GRADE: p.GRADE || p.grade || '',
          nom_complet: `${p.PRENOM_PRESTATAIRE || ''} ${p.NOM_PRESTATAIRE || ''}`.trim(),
          specialite: p.SPECIALITE || p.specialite || '',
          telephone: p.TELEPHONE || p.telephone || ''
        }));
        
        setPrestataires(formattedPrestataires);
        
        if (formattedPrestataires.length > 0 && !selectedPrestataire) {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const userPrestataireId = user?.prestataire_id || user?.COD_PRE;
          
          let defaultPrestataire = formattedPrestataires[0];
          
          if (userPrestataireId) {
            const userPrestataire = formattedPrestataires.find(p => 
              p.id === userPrestataireId || p.COD_PRE === userPrestataireId
            );
            if (userPrestataire) {
              defaultPrestataire = userPrestataire;
            }
          }
          
          setSelectedPrestataire(defaultPrestataire);
          prescriptionForm.setFieldValue('COD_PRESCRIPTEUR', defaultPrestataire.id);
        }
      } else {
        setPrestataires([]);
      }
    } catch (error) {
      console.error('Erreur chargement prestataires:', error);
      message.error('Erreur lors du chargement des médecins');
    } finally {
      setLoadingPrestataires(false);
    }
  }, [centreId, selectedPrestataire, prescriptionForm]);

  // Charger les actes médicaux selon le type
  const loadActesMedicaux = useCallback(async (searchTerm = '') => {
    try {
      if (!typePrestation) return;
      
      setLoadingActes(true);
      
      let actesData = [];
      
      // Récupérer les actes selon le type
      if (typePrestation === 'PHARMACIE' || typePrestation === 'MEDICAMENT') {
        // Charger les médicaments du barème CMF
        const response = await baremesAPI.getActesMedicaux(COD_PAY_DEFAULT, { 
          search: searchTerm, 
          limit: 100 
        });
        
        if (response.success && Array.isArray(response.actes)) {
          actesData = response.actes;
        }
      } else if (typePrestation === 'BIOLOGIE') {
        // Charger les examens biologiques
        const response = await prestationsAPI.getAllPrestations(
          { type: 'BIOLOGIE', search: searchTerm },
          { limit: 100 }
        );
        
        if (response.success && Array.isArray(response.prestations)) {
          actesData = response.prestations;
        }
      } else if (typePrestation === 'CONSULTATION') {
        // Charger les consultations
        const response = await prestationsAPI.getAllPrestations(
          { type: 'CONSULTATION', search: searchTerm },
          { limit: 100 }
        );
        
        if (response.success && Array.isArray(response.prestations)) {
          actesData = response.prestations;
        }
      } else {
        // Pour les autres types, charger depuis l'API générale
        const response = await prestationsAPI.getAllPrestations(
          { type: typePrestation, search: searchTerm },
          { limit: 100 }
        );
        
        if (response.success && Array.isArray(response.prestations)) {
          actesData = response.prestations;
        }
      }
      
      // Formater les actes pour l'affichage
      const formattedActes = actesData.map((item, index) => ({
        key: `acte_${item.COD_PREST || item.COD_ACTE || item.id || index}_${Date.now()}`,
        id: item.id || item.COD_PREST || item.COD_ACTE,
        CODE_ACTE: item.COD_PREST || item.COD_ACTE || item.CODE || item.id,
        LIBELLE: item.LIB_PREST || item.LIB_ACTE || item.LIBELLE_PRESTATION || item.nom || item.LIB || `Acte ${typePrestation}`,
        PRIX: item.MONTANT || item.prix_unitaire || item.MLT_PRE || item.PRIX || item.tarif || item.PRIX_UNITAIRE || 0,
        UNITE: item.UNITE || item.unite || 'unité',
        CATEGORIE: item.CATEGORIE || typePrestation,
        REMBOURSABLE: item.REMBOURSABLE || 1,
        TYPE_ELEMENT: 'PRESTATION',
        DESCRIPTION: item.DESCRIPTION || item.OBSERVATIONS || item.OBS_PRE || '',
        TAUX_PRISE_EN_CHARGE: item.TAUX_PRISE_CHARGE || item.TAUX_PRISE_EN_CHARGE || 80,
        PRIX_PRISE_EN_CHARGE: item.MONTANT_PRISE_CHARGE || item.PRIX_PRISE_EN_CHARGE || 0
      }));
      
      setActesMedicaux(formattedActes);
      
      // Filtrer les résultats si un terme de recherche est fourni
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const filtered = formattedActes.filter(acte =>
          (acte.LIBELLE || '').toLowerCase().includes(searchLower) ||
          (acte.CODE_ACTE || '').toLowerCase().includes(searchLower) ||
          (acte.DESCRIPTION || '').toLowerCase().includes(searchLower)
        );
        setSearchResults(filtered);
      } else {
        setSearchResults(formattedActes);
      }
    } catch (error) {
      console.error('Erreur chargement actes:', error);
      message.error(`Erreur lors du chargement des ${getTypeLabel(typePrestation)}`);
      setActesMedicaux([]);
      setSearchResults([]);
    } finally {
      setLoadingActes(false);
    }
  }, [typePrestation]);

  // Rechercher des affections avec COD_PAY = 'CMF'
  const searchAffections = async (searchText) => {
    if (!searchText || searchText.trim().length < 2) {
      setAffectionOptions([]);
      return;
    }
    
    try {
      setSearchingAffections(true);
      
      const response = await affectionsAPI.search(searchText, 10);
      
      if (response.success && Array.isArray(response.affections)) {
        const options = response.affections.map(aff => {
          const id = aff.id || aff.COD_AFF || aff.CODE_AFF || aff.cod_aff;
          const code = aff.CODE_AFF || aff.COD_AFF || aff.id;
          const libelle = aff.LIBELLE_AFF || aff.LIB_AFF || aff.libelle || '';
          
          return {
            value: id,
            key: id,
            label: (
              <div>
                <div><strong>{code}</strong> - {libelle}</div>
                {aff.TYPE_AFFECTION && (
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    Type: {aff.TYPE_AFFECTION}
                  </div>
                )}
              </div>
            ),
            code: code,
            libelle: libelle,
            data: aff
          };
        });
        
        setAffectionOptions(options);
      } else {
        setAffectionOptions([]);
      }
    } catch (error) {
      console.error('Erreur recherche affections:', error);
      message.error('Erreur lors de la recherche des affections');
      setAffectionOptions([]);
    } finally {
      setSearchingAffections(false);
    }
  };

  // Gérer la sélection d'une affection
  const handleSelectAffection = (value, option) => {
    if (!option) return;
    
    const selectedAffection = option.data;
    const code = option.code || value;
    const libelle = option.libelle || '';
    
    if (code && libelle) {
      setAffectionCode(code);
      setAffectionLibelle(libelle);
      setAffectionDetails(selectedAffection);
    } else {
      const parts = value?.split(' - ') || [];
      const fallbackCode = parts[0] || value || '';
      const fallbackLibelle = parts.slice(1).join(' - ') || '';
      
      setAffectionCode(fallbackCode);
      setAffectionLibelle(fallbackLibelle);
    }
  };

  // Rechercher le patient par numéro de carte
  const searchPatient = async (cardNumber) => {
    if (!cardNumber || cardNumber.trim().length < 3) {
      message.warning('Veuillez entrer un numéro de carte valide (minimum 3 caractères)');
      return;
    }
    
    setLoading(prev => ({ ...prev, patient: true }));
    try {
      let response;
      
      if (beneficiairesAPI.searchAdvanced) {
        response = await beneficiairesAPI.searchAdvanced(cardNumber, {}, 10, 1);
      } else if (beneficiairesAPI.getAll) {
        response = await beneficiairesAPI.getAll({ 
          NUMERO_CARTE: cardNumber,
          limit: 1 
        });
      } else {
        throw new Error('API bénéficiaires non disponible');
      }
      
      if (response.success && Array.isArray(response.beneficiaires) && response.beneficiaires.length > 0) {
        const patientData = response.beneficiaires[0];
        
        const formattedPatient = {
          id: patientData.ID_BEN || patientData.COD_BEN || patientData.id,
          COD_BEN: patientData.COD_BEN || patientData.ID_BEN || patientData.id,
          ID_BEN: patientData.COD_BEN || patientData.ID_BEN || patientData.id,
          nom: patientData.NOM_BEN || patientData.nom,
          prenom: patientData.PRE_BEN || patientData.prenom,
          nom_complet: `${patientData.PRE_BEN || patientData.prenom || ''} ${patientData.NOM_BEN || patientData.nom || ''}`.trim(),
          identifiant_national: patientData.IDENTIFIANT_NATIONAL,
          numero_carte: patientData.NUMERO_CARTE || cardNumber,
          date_naissance: patientData.NAI_BEN || patientData.date_naissance,
          age: patientData.AGE || calculateAge(patientData.NAI_BEN || patientData.date_naissance),
          sexe: patientData.SEX_BEN || patientData.sexe,
          telephone: patientData.TELEPHONE || patientData.telephone,
          groupe_sanguin: patientData.GROUPE_SANGUIN,
          rhesus: patientData.RHESUS,
          taux_couverture: patientData.TAUX_COUVERTURE || 80,
          statut: patientData.STATUT || 'Actif',
          adresse: patientData.ADRESSE || patientData.adresse,
          profession: patientData.PROFESSION || patientData.profession,
          assureur: patientData.ASSUREUR || patientData.assureur,
          numero_assurance: patientData.NUMERO_ASSURANCE || patientData.numero_assurance
        };
        
        setPatient(formattedPatient);
        prescriptionForm.setFieldsValue({
          COD_BEN: formattedPatient.COD_BEN,
          NOM_BEN: formattedPatient.nom_complet
        });
        
        message.success(`Patient trouvé: ${formattedPatient.nom_complet}`);
      } else {
        message.warning('Aucun patient trouvé avec ce numéro de carte');
        setPatient(null);
      }
    } catch (error) {
      console.error('Erreur recherche patient:', error);
      message.error('Erreur lors de la recherche du patient: ' + error.message);
      setPatient(null);
    } finally {
      setLoading(prev => ({ ...prev, patient: false }));
    }
  };

  // ==================== GESTION DES ACTES ====================
  
  const handleSearchActes = (value) => {
    setSearchPrestation(value);
    
    if (!value || value.trim().length < 2) {
      setSearchResults(actesMedicaux);
      return;
    }
    
    const searchLower = value.toLowerCase();
    const filtered = actesMedicaux.filter(acte =>
      (acte.LIBELLE || '').toLowerCase().includes(searchLower) ||
      (acte.CODE_ACTE || '').toLowerCase().includes(searchLower) ||
      (acte.DESCRIPTION || '').toLowerCase().includes(searchLower)
    );
    
    setSearchResults(filtered);
  };

  const ajouterActe = (acte) => {
    const nouvelleActe = {
      ...acte,
      key: `acte_${acte.CODE_ACTE || acte.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      QUANTITE: 1,
      UNITE: acte.UNITE || 'unité',
      POSOLOGIE: (typePrestation === 'PHARMACIE' || typePrestation === 'MEDICAMENT') ? '1 comprimé matin et soir' : '',
      DUREE: (typePrestation === 'PHARMACIE' || typePrestation === 'MEDICAMENT') ? '7' : '1',
      PRIX_UNITAIRE: acte.PRIX || 0,
      TYPE_ELEMENT: 'PRESTATION',
      TAUX_PRISE_EN_CHARGE: acte.TAUX_PRISE_EN_CHARGE || 80,
      PRIX_PRISE_EN_CHARGE: Math.round((acte.PRIX || 0) * (acte.TAUX_PRISE_EN_CHARGE || 80) / 100)
    };
    
    setSelectedPrestations(prev => [...prev, nouvelleActe]);
    setSearchPrestation('');
    setSearchResults(actesMedicaux);
    message.success(`${acte.LIBELLE} ajouté à la prescription`);
  };

  // ==================== GESTION DE LA SAISIE MANUELLE ====================
  
  const ouvrirSaisieManuelle = (type) => {
    setManualEntryType(type);
    manualForm.resetFields();
    
    const defaultValues = {
      quantite: 1,
      prix_unitaire: 0,
      duree: type === 'MEDICAMENT' ? '7' : '1'
    };
    
    if (type === 'MEDICAMENT') {
      defaultValues.posologie = '1 comprimé matin et soir';
    }
    
    manualForm.setFieldsValue(defaultValues);
    setManualEntryModal(true);
  };

  const ajouterManuellement = async () => {
    try {
      const values = await manualForm.validateFields();
      
      const nouvelleActe = {
        key: `manuel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        CODE_ACTE: values.code_acte || `MANUEL_${Date.now()}`,
        LIBELLE: values.libelle,
        QUANTITE: values.quantite || 1,
        UNITE: 'unité',
        POSOLOGIE: manualEntryType === 'MEDICAMENT' ? values.posologie : '',
        DUREE: manualEntryType === 'MEDICAMENT' ? values.duree : '1',
        PRIX_UNITAIRE: values.prix_unitaire || 0,
        TYPE_ELEMENT: 'MANUEL',
        CATEGORIE: manualEntryType,
        REMBOURSABLE: 1,
        DESCRIPTION: values.description || '',
        TAUX_PRISE_EN_CHARGE: 80,
        PRIX_PRISE_EN_CHARGE: Math.round((values.prix_unitaire || 0) * 0.8)
      };
      
      setSelectedPrestations(prev => [...prev, nouvelleActe]);
      setManualEntryModal(false);
      message.success('Élément ajouté manuellement avec succès');
    } catch (error) {
      console.error('Erreur validation saisie manuelle:', error);
    }
  };

  // ==================== GESTION DES PRESCRIPTIONS ====================
  
  const calculerTotal = () => {
    return selectedPrestations.reduce((total, acte) => {
      const prix = parseFloat(acte.PRIX_UNITAIRE) || 0;
      const quantite = parseInt(acte.QUANTITE) || 1;
      return total + (prix * quantite);
    }, 0);
  };

  const calculerTotalPriseEnCharge = () => {
    return selectedPrestations.reduce((total, acte) => {
      const prix = parseFloat(acte.PRIX_UNITAIRE) || 0;
      const quantite = parseInt(acte.QUANTITE) || 1;
      const taux = parseInt(acte.TAUX_PRISE_EN_CHARGE) || 80;
      return total + (prix * quantite * taux / 100);
    }, 0);
  };

  const calculerTotalRestant = () => {
    return calculerTotal() - calculerTotalPriseEnCharge();
  };

  const updateActe = (key, field, value) => {
    setSelectedPrestations(prev => 
      prev.map(acte => {
        if (acte.key === key) {
          const updatedActe = { ...acte, [field]: value };
          if (field === 'PRIX_UNITAIRE' || field === 'TAUX_PRISE_EN_CHARGE') {
            const prix = parseFloat(updatedActe.PRIX_UNITAIRE) || 0;
            const taux = parseInt(updatedActe.TAUX_PRISE_EN_CHARGE) || 80;
            updatedActe.PRIX_PRISE_EN_CHARGE = Math.round(prix * taux / 100);
          }
          return updatedActe;
        }
        return acte;
      })
    );
  };

  const supprimerActe = (key) => {
    setSelectedPrestations(prev => prev.filter(acte => acte.key !== key));
  };

  const validerPrescription = async () => {
    try {
      if (!patient) {
        message.error('Veuillez d\'abord rechercher un patient');
        return;
      }
      
      if (!selectedPrestataire) {
        message.error('Veuillez sélectionner un médecin prescripteur');
        return;
      }
      
      if (selectedPrestations.length === 0) {
        message.error('Veuillez ajouter au moins un acte');
        return;
      }
      
      if (!affectionCode) {
        message.error('Veuillez sélectionner une affection');
        return;
      }
      
      if (!centreId) {
        message.error('Veuillez sélectionner un centre de santé');
        return;
      }
      
      setValidationModalVisible(true);
      
    } catch (error) {
      console.error('Erreur validation:', error);
      message.error('Erreur lors de la validation de la prescription');
    }
  };

  const confirmerPrescription = async () => {
    setLoading(prev => ({ ...prev, prescrire: true }));
    
    try {
      const prescriptionNum = generatePrescriptionNumber();
      
      // Préparer les données pour l'API
      const prescriptionData = {
        COD_BEN: patient.COD_BEN || patient.ID_BEN || patient.id,
        COD_PRE: selectedPrestataire.COD_PRE || selectedPrestataire.id,
        COD_CEN: centreId,
        TYPE_PRESTATION: typePrestation,
        COD_AFF: affectionCode || null,
        OBSERVATIONS: `Affection: ${affectionLibelle || 'Non spécifiée'}`,
        ORIGINE: 'Electronique',
        DATE_VALIDITE: moment().add(30, 'days').format('YYYY-MM-DD'),
        MONTANT_TOTAL: calculerTotal(),
        MONTANT_PRISE_EN_CHARGE: calculerTotalPriseEnCharge(),
        MONTANT_RESTANT: calculerTotalRestant(),
        STATUT: 'EN_COURS',
        URGENT: false,
        
        // Détails des actes
        details: selectedPrestations.map((acte, index) => ({
          ORDRE: index + 1,
          TYPE_ELEMENT: acte.TYPE_ELEMENT || 'PRESTATION',
          COD_ELEMENT: acte.CODE_ACTE,
          LIBELLE: acte.LIBELLE,
          QUANTITE: acte.QUANTITE,
          UNITE: acte.UNITE || 'unité',
          POSOLOGIE: acte.POSOLOGIE || '',
          DUREE_TRAITEMENT: acte.DUREE,
          PRIX_UNITAIRE: acte.PRIX_UNITAIRE || 0,
          REMBOURSABLE: acte.REMBOURSABLE || 1,
          TAUX_PRISE_EN_CHARGE: acte.TAUX_PRISE_EN_CHARGE || 80,
          PRIX_PRISE_EN_CHARGE: acte.PRIX_PRISE_EN_CHARGE || 0,
          DESCRIPTION: acte.DESCRIPTION || ''
        }))
      };
      
      // Appel API pour créer la prescription
      const response = await prescriptionsAPI.create(prescriptionData);
      
      if (response.success) {
        const ordonnanceData = {
          numero: prescriptionNum,
          COD_PRES: response.data?.COD_PRES || prescriptionNum,
          patient,
          selectedPrestataire,
          selectedPrestations,
          centreId,
          centreNom,
          centreDetails,
          typePrestation,
          affectionCode,
          affectionLibelle,
          affectionDetails,
          urgent: false,
          dateValidite: moment().add(30, 'days').format('DD/MM/YYYY'),
          statut: 'EN_COURS',
          nombrePrestations: selectedPrestations.length,
          total: calculerTotal(),
          totalPriseEnCharge: calculerTotalPriseEnCharge(),
          totalRestant: calculerTotalRestant(),
          dateCreation: moment().format('DD/MM/YYYY HH:mm'),
          datePrescription: moment().format('DD/MM/YYYY'),
          observations: `Affection: ${affectionLibelle || 'Non spécifiée'}`,
          qrCodeData: JSON.stringify({
            numero: prescriptionNum,
            patient: patient.nom_complet,
            date: moment().format('DD/MM/YYYY'),
            centre: centreNom,
            type: typePrestation
          })
        };
        
        setOrdonnanceToPrint(ordonnanceData);
        resetPrescriptionForm();
        setPrintModalVisible(true);
        
        // Recharger les données
        loadMesPrescriptions();
        
        message.success(`Prescription créée avec succès! Numéro: ${response.data?.NUM_PRESCRIPTION || prescriptionNum}`);
      } else {
        let errorMessage = response.message || 'Erreur lors de la création de la prescription';
        message.error(errorMessage);
      }
    } catch (error) {
      console.error('Erreur création prescription:', error);
      message.error('Erreur lors de la création de la prescription: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, prescrire: false }));
      setValidationModalVisible(false);
    }
  };

  const resetPrescriptionForm = () => {
    setPatient(null);
    setSelectedPrestations([]);
    setAffectionCode('');
    setAffectionLibelle('');
    setAffectionDetails(null);
    setAffectionOptions([]);
    setSearchPrestation('');
    setSearchResults(actesMedicaux);
    prescriptionForm.resetFields();
  };

  const searchPrescription = async (numero) => {
    if (!numero || numero.trim().length < 3) {
      message.warning('Veuillez entrer un numéro de prescription valide');
      return;
    }
    
    setLoading(prev => ({ ...prev, execution: true }));
    try {
      const response = await prescriptionsAPI.getByNumeroOrId(numero);
      
      if (response.success && response.prescription) {
        const prescription = response.prescription;
        
        // Obtenir le nom du centre de la prescription
        const prescriptionCentreName = getCentreNameById(prescription.COD_CEN);
        
        // Vérifier si la prescription appartient au centre actuel
        if (centreId && prescription.COD_CEN && prescription.COD_CEN.toString() !== centreId.toString()) {
          message.error({
            content: (
              <div>
                <p><strong>Cette prescription n'appartient pas à votre centre de santé.</strong></p>
                <p>Centre actuel: <strong>{centreNom}</strong></p>
                <p>Centre de la prescription: <strong>{prescriptionCentreName}</strong></p>
                <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                  Vous ne pouvez exécuter que les prescriptions de votre propre centre.
                </p>
              </div>
            ),
            duration: 8,
            style: {
              maxWidth: '500px'
            }
          });
          setSelectedPrescription(null);
          setActesExecutes([]);
          return;
        }
        
        // Vérifier si la prescription peut être exécutée (statut EN_COURS ou EN_ATTENTE)
        if (prescription.STATUT === 'EXECUTEE' || prescription.STATUT === 'VALIDEE' || prescription.STATUT === 'ANNULEE') {
          message.warning(`Cette prescription est déjà ${prescription.STATUT.toLowerCase()}`);
          setSelectedPrescription(null);
          setActesExecutes([]);
          return;
        }
        
        // Préparer les actes à exécuter
        const details = prescription.details || [];
        const actes = details.map((detail, index) => ({
          key: `acte_${detail.COD_ELEMENT || detail.id || index}_${Date.now()}`,
          ...detail,
          COD_ELEMENT: detail.COD_ELEMENT || detail.CODE_ACTE || detail.id,
          LIBELLE: detail.LIBELLE || detail.NOM_COMMERCIAL || 'Acte non spécifié',
          prix: parseFloat(detail.PRIX_UNITAIRE || detail.prix_unitaire || detail.PRIX || 0),
          quantite: parseInt(detail.QUANTITE || 1),
          total: parseFloat(detail.PRIX_UNITAIRE || detail.prix_unitaire || detail.PRIX || 0) * parseInt(detail.QUANTITE || 1),
          execute: false,
          STATUT: detail.STATUT || 'EN_ATTENTE'
        }));
        
        setSelectedPrescription({
          ...prescription,
          centreNom: prescriptionCentreName,
          nombreActes: details.length,
          total: prescription.MONTANT_TOTAL || actes.reduce((sum, acte) => sum + acte.total, 0),
          NOM_BEN: prescription.NOM_BEN || prescription.patient_nom || 'Patient inconnu',
          NOM_MEDECIN: prescription.NOM_MEDECIN || selectedPrestataire?.nom_complet || 'Médecin inconnu'
        });
        
        setActesExecutes(actes);
        calculerTotalFacture(actes);
        
        message.success(`Prescription trouvée: ${prescription.NUM_PRESCRIPTION || prescription.numero || numero}`);
      } else {
        message.warning('Aucune prescription trouvée avec ce numéro ou cette prescription ne peut pas être exécutée');
        setSelectedPrescription(null);
        setActesExecutes([]);
      }
    } catch (error) {
      console.error('Erreur recherche prescription:', error);
      message.error('Erreur lors de la recherche de la prescription: ' + error.message);
      setSelectedPrescription(null);
      setActesExecutes([]);
    } finally {
      setLoading(prev => ({ ...prev, execution: false }));
    }
  };

  const calculerTotalFacture = (actes) => {
    const total = actes
      .filter(acte => acte.execute)
      .reduce((sum, acte) => sum + (acte.total || 0), 0);
    setTotalFacture(total);
  };

  const toggleActeExecution = (key, execute) => {
    const newActes = actesExecutes.map(acte => 
      acte.key === key ? { ...acte, execute } : acte
    );
    setActesExecutes(newActes);
    calculerTotalFacture(newActes);
  };

  const validerExecution = async () => {
    if (!selectedPrestataire) {
      message.error('Veuillez sélectionner un médecin exécutant');
      return;
    }
    
    const actesExecutesCount = actesExecutes.filter(a => a.execute).length;
    if (actesExecutesCount === 0) {
      message.error('Veuillez sélectionner au moins un acte à exécuter');
      return;
    }
    
    setLoading(prev => ({ ...prev, execution: true }));
    try {
      const response = await prescriptionsAPI.updateStatus(
        selectedPrescription.COD_PRES || selectedPrescription.id, 
        {
          statut: 'EXECUTEE',
          date_execution: moment().format('YYYY-MM-DD HH:mm:ss'),
          executant_id: selectedPrestataire.COD_PRE || selectedPrestataire.id,
          executant_nom: selectedPrestataire.nom_complet
        }
      );
      
      if (response.success) {
        // Préparer les données pour l'impression de la fiche d'exécution
        const ficheExecutionData = {
          numero: selectedPrescription.NUM_PRESCRIPTION || selectedPrescription.numero || selectedPrescription.COD_PRES,
          COD_PRES: selectedPrescription.COD_PRES || selectedPrescription.id,
          patient: {
            nom_complet: selectedPrescription.NOM_BEN || 'Patient inconnu',
            numero_carte: selectedPrescription.rawData?.NUMERO_CARTE || 'N/A',
            age: selectedPrescription.rawData?.AGE || 'N/A',
            sexe: selectedPrescription.rawData?.SEXE || 'N/A',
            telephone: selectedPrescription.rawData?.TELEPHONE || 'N/A',
            taux_couverture: selectedPrescription.rawData?.TAUX_COUVERTURE || 80
          },
          selectedPrestataire: {
            nom_complet: selectedPrestataire.nom_complet,
            specialite: selectedPrestataire?.specialite || 'Médecin Généraliste',
            MATRICULE: selectedPrestataire?.MATRICULE || 'N/A'
          },
          centreNom: centreNom,
          centreDetails: centreDetails,
          typePrestation: selectedPrescription.TYPE_PRESTATION || 'PRESCRIPTION',
          affectionCode: selectedPrescription.COD_AFF || 'N/A',
          affectionLibelle: selectedPrescription.rawData?.LIB_AFF || 'Non spécifiée',
          dateValidite: selectedPrescription.rawData?.DATE_VALIDITE ? 
            moment(selectedPrescription.rawData.DATE_VALIDITE).format('DD/MM/YYYY') : 
            moment().add(30, 'days').format('DD/MM/YYYY'),
          statut: 'EXECUTEE',
          nombrePrestations: actesExecutes.filter(a => a.execute).length,
          total: totalFacture,
          totalPriseEnCharge: Math.round(totalFacture * (selectedPrescription.rawData?.TAUX_COUVERTURE || 80) / 100),
          totalRestant: totalFacture - Math.round(totalFacture * (selectedPrescription.rawData?.TAUX_COUVERTURE || 80) / 100),
          dateCreation: moment().format('DD/MM/YYYY HH:mm'),
          dateExecution: moment().format('DD/MM/YYYY HH:mm'),
          datePrescription: selectedPrescription.DATE_PRESCRIPTION ? 
            moment(selectedPrescription.DATE_PRESCRIPTION).format('DD/MM/YYYY') : 
            'Date inconnue',
          selectedPrestations: actesExecutes.filter(a => a.execute).map((acte, index) => ({
            key: `acte_${acte.COD_ELEMENT || acte.id || index}_${Date.now()}`,
            CODE_ACTE: acte.COD_ELEMENT || acte.CODE_ACTE || acte.id,
            LIBELLE: acte.LIBELLE || 'Acte non spécifié',
            QUANTITE: acte.quantite || 1,
            UNITE: acte.UNITE || 'unité',
            POSOLOGIE: acte.POSOLOGIE || '',
            DUREE: acte.DUREE || '1',
            PRIX_UNITAIRE: acte.prix || 0,
            PRIX: acte.prix || 0,
            TAUX_PRISE_EN_CHARGE: selectedPrescription.rawData?.TAUX_COUVERTURE || 80,
            PRIX_PRISE_EN_CHARGE: Math.round((acte.prix || 0) * (selectedPrescription.rawData?.TAUX_COUVERTURE || 80) / 100),
            CATEGORIE: selectedPrescription.TYPE_PRESTATION || 'PRESCRIPTION',
            DESCRIPTION: acte.DESCRIPTION || '',
            TYPE_ELEMENT: acte.TYPE_ELEMENT || 'PRESTATION',
            REMBOURSABLE: acte.REMBOURSABLE || 1
          })),
          qrCodeData: JSON.stringify({
            numero: selectedPrescription.NUM_PRESCRIPTION || selectedPrescription.numero || selectedPrescription.COD_PRES,
            patient: selectedPrescription.NOM_BEN || 'Patient inconnu',
            date: moment().format('DD/MM/YYYY'),
            centre: centreNom,
            type: selectedPrescription.TYPE_PRESTATION || 'PRESCRIPTION',
            execution: true
          })
        };
        
        setOrdonnanceToPrint(ficheExecutionData);
        message.success(`Prescription exécutée avec succès! ${actesExecutesCount} acte(s) validé(s)`);
        
        // Afficher la modale d'impression de la fiche d'exécution
        setPrintModalVisible(true);
        
        setSelectedPrescription(null);
        setActesExecutes([]);
        setPrescriptionNumero('');
        setTotalFacture(0);
        
        // Recharger l'historique
        loadMesPrescriptions();
      } else {
        message.error('Erreur lors de l\'exécution de la prescription: ' + (response.message || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Erreur exécution:', error);
      message.error('Erreur lors de l\'exécution de la prescription: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, execution: false }));
    }
  };

  // ==================== ONGLET HISTORIQUE ====================
  const loadMesPrescriptions = async () => {
    try {
      if (!selectedPrestataire) {
        setMesPrescriptions([]);
        return;
      }
      
      setLoading(prev => ({ ...prev, historique: true }));
      
      const params = {
        limit: 50,
        page: 1,
        COD_PRE: selectedPrestataire.COD_PRE || selectedPrestataire.id,
        COD_CEN: centreId,
      };
      
      const response = await prescriptionsAPI.getAll(params);
      
      if (response.success && Array.isArray(response.prescriptions)) {
        let filteredPrescriptions = response.prescriptions;
        
        if (centreId) {
          filteredPrescriptions = response.prescriptions.filter(pres => {
            if (!pres.COD_CEN) return true;
            return pres.COD_CEN.toString() === centreId.toString();
          });
        }
        
        // Pour chaque prescription, nous devons récupérer les détails
        const formattedPrescriptions = await Promise.all(filteredPrescriptions.map(async (pres) => {
          const getDisplayStatut = (statut) => {
            const statutMap = {
              'EN_ATTENTE': 'En attente',
              'EN_COURS': 'En cours', 
              'EXECUTEE': 'Exécutée',
              'VALIDEE': 'Validée',
              'REJETEE': 'Rejetée',
              'ANNULEE': 'Annulée'
            };
            return statutMap[statut] || statut;
          };
          
          const displayStatut = getDisplayStatut(pres.STATUT);
          
          let numero = '';
          if (pres.NUM_PRESCRIPTION) {
            numero = pres.NUM_PRESCRIPTION;
          } else if (pres.numero) {
            numero = pres.numero;
          } else {
            const prefix = (pres.TYPE_PRESTATION || 'PRES').substring(0, 3).toUpperCase();
            const datePart = moment(pres.DATE_PRESCRIPTION || pres.date_creation).format('YYMMDD');
            const idPart = (pres.COD_PRES || pres.id || '').toString().padStart(4, '0');
            numero = `${prefix}-${datePart}-${idPart}`;
          }
          
          let patientNom = '';
          if (pres.NOM_BEN && pres.PRE_BEN) {
            patientNom = `${pres.PRE_BEN} ${pres.NOM_BEN}`;
          } else if (pres.patient_nom) {
            patientNom = pres.patient_nom;
          } else if (pres.patient && pres.patient.nom_complet) {
            patientNom = pres.patient.nom_complet;
          } else {
            patientNom = 'Patient inconnu';
          }
          
          // Récupérer les détails de la prescription
          let details = [];
          let total = 0;
          
          try {
            if (pres.COD_PRES || pres.id) {
              const detailResponse = await prescriptionsAPI.getById(pres.COD_PRES || pres.id);
              if (detailResponse.success && detailResponse.prescription && detailResponse.prescription.details) {
                details = detailResponse.prescription.details;
                // Calculer le total basé sur les détails
                total = details.reduce((sum, detail) => {
                  const prix = parseFloat(detail.PRIX_UNITAIRE || detail.prix_unitaire || 0);
                  const quantite = parseFloat(detail.QUANTITE || detail.quantite || 1);
                  return sum + (prix * quantite);
                }, 0);
              }
            }
          } catch (error) {
            console.warn(`Impossible de récupérer les détails de la prescription ${pres.COD_PRES}:`, error);
          }
          
          // Si pas de détails mais qu'on a des montants dans la prescription
          if (total === 0) {
            if (pres.MONTANT_TOTAL) {
              total = pres.MONTANT_TOTAL;
            } else if (pres.montant_total) {
              total = pres.montant_total;
            }
          }
          
          // Obtenir le nom du centre de la prescription
          const prescriptionCentreName = getCentreNameById(pres.COD_CEN);
          
          return {
            id: pres.COD_PRES || pres.id,
            COD_PRES: pres.COD_PRES || pres.id,
            COD_CEN: pres.COD_CEN,
            centreNom: prescriptionCentreName,
            NUMERO_PRESCRIPTION: numero,
            NOM_BEN: patientNom,
            patient: patientNom,
            DATE_PRESCRIPTION: pres.DATE_PRESCRIPTION ? 
              moment(pres.DATE_PRESCRIPTION).format('DD/MM/YYYY HH:mm') : 
              (pres.date_creation ? moment(pres.date_creation).format('DD/MM/YYYY HH:mm') : 'Date inconnue'),
            TYPE_PRESTATION: pres.TYPE_PRESTATION || 'PHARMACIE',
            type: pres.TYPE_PRESTATION || 'PHARMACIE',
            STATUT: displayStatut,
            statut: displayStatut,
            nombreActes: details.length || pres.nombre_elements || 0,
            total: total,
            NOM_MEDECIN: selectedPrestataire.nom_complet,
            medecin: selectedPrestataire.nom_complet,
            COD_AFF: pres.COD_AFF,
            details: details, // Inclure les détails récupérés
            rawData: pres
          };
        }));
        
        setMesPrescriptions(formattedPrescriptions);
      } else {
        setMesPrescriptions([]);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      message.error('Erreur lors du chargement de l\'historique');
      setMesPrescriptions([]);
    } finally {
      setLoading(prev => ({ ...prev, historique: false }));
    }
  };

  // Fonction pour préparer une prescription pour l'impression
  const preparePrescriptionForPrint = (prescription) => {
    // Transformer les détails en format pour l'impression
    const selectedPrestationsForPrint = prescription.details ? prescription.details.map((detail, index) => ({
      key: `acte_${detail.COD_ELEMENT || detail.id || index}_${Date.now()}`,
      CODE_ACTE: detail.COD_ELEMENT || detail.CODE_ACTE || detail.id,
      LIBELLE: detail.LIBELLE || detail.NOM_COMMERCIAL || 'Acte non spécifié',
      QUANTITE: detail.QUANTITE || 1,
      UNITE: detail.UNITE || 'unité',
      POSOLOGIE: detail.POSOLOGIE || '',
      DUREE: detail.DUREE_TRAITEMENT || detail.DUREE || '1',
      PRIX_UNITAIRE: detail.PRIX_UNITAIRE || detail.prix_unitaire || 0,
      PRIX: detail.PRIX_UNITAIRE || detail.prix_unitaire || 0,
      TAUX_PRISE_EN_CHARGE: detail.TAUX_PRISE_EN_CHARGE || 80,
      PRIX_PRISE_EN_CHARGE: detail.PRIX_PRISE_EN_CHARGE || 0,
      CATEGORIE: detail.CATEGORIE || prescription.TYPE_PRESTATION,
      DESCRIPTION: detail.DESCRIPTION || '',
      TYPE_ELEMENT: detail.TYPE_ELEMENT || 'PRESTATION',
      REMBOURSABLE: detail.REMBOURSABLE || 1
    })) : [];
    
    // Calculer les totaux
    const total = selectedPrestationsForPrint.reduce((sum, acte) => {
      const prix = parseFloat(acte.PRIX_UNITAIRE) || 0;
      const quantite = parseInt(acte.QUANTITE) || 1;
      return sum + (prix * quantite);
    }, 0);
    
    const totalPriseEnCharge = selectedPrestationsForPrint.reduce((sum, acte) => {
      const prix = parseFloat(acte.PRIX_UNITAIRE) || 0;
      const quantite = parseInt(acte.QUANTITE) || 1;
      const taux = parseInt(acte.TAUX_PRISE_EN_CHARGE) || 80;
      return sum + (prix * quantite * taux / 100);
    }, 0);
    
    const totalRestant = total - totalPriseEnCharge;
    
    return {
      numero: prescription.NUMERO_PRESCRIPTION,
      COD_PRES: prescription.COD_PRES,
      patient: {
        nom_complet: prescription.NOM_BEN,
        numero_carte: prescription.rawData?.NUMERO_CARTE || 'N/A',
        age: prescription.rawData?.AGE || 'N/A',
        sexe: prescription.rawData?.SEXE || 'N/A',
        telephone: prescription.rawData?.TELEPHONE || 'N/A',
        taux_couverture: prescription.rawData?.TAUX_COUVERTURE || 80
      },
      selectedPrestataire: {
        nom_complet: prescription.NOM_MEDECIN || selectedPrestataire.nom_complet,
        specialite: selectedPrestataire?.specialite || 'Médecin Généraliste',
        MATRICULE: selectedPrestataire?.MATRICULE || 'N/A'
      },
      centreNom: prescription.centreNom || centreNom,
      centreDetails: centreDetails,
      typePrestation: prescription.TYPE_PRESTATION,
      affectionCode: prescription.COD_AFF || 'N/A',
      affectionLibelle: prescription.rawData?.LIB_AFF || 'Non spécifiée',
      dateValidite: prescription.rawData?.DATE_VALIDITE ? 
        moment(prescription.rawData.DATE_VALIDITE).format('DD/MM/YYYY') : 
        moment().add(30, 'days').format('DD/MM/YYYY'),
      statut: prescription.STATUT,
      total: total,
      totalPriseEnCharge: totalPriseEnCharge,
      totalRestant: totalRestant,
      dateCreation: prescription.DATE_PRESCRIPTION,
      datePrescription: prescription.DATE_PRESCRIPTION ? 
        moment(prescription.DATE_PRESCRIPTION).format('DD/MM/YYYY') : 
        'Date inconnue',
      selectedPrestations: selectedPrestationsForPrint,
      qrCodeData: JSON.stringify({
        numero: prescription.NUMERO_PRESCRIPTION,
        patient: prescription.NOM_BEN,
        date: prescription.DATE_PRESCRIPTION ? 
          moment(prescription.DATE_PRESCRIPTION).format('DD/MM/YYYY') : 
          'Date inconnue',
        centre: prescription.centreNom || centreNom,
        type: prescription.TYPE_PRESTATION
      })
    };
  };

  const handleViewPrescriptionDetails = async (prescription) => {
    try {
      setSelectedPrescriptionDetails(prescription);
      
      // Si la prescription n'a pas de détails, les charger
      if (!prescription.details || prescription.details.length === 0) {
        setLoading(prev => ({ ...prev, details: true }));
        const response = await prescriptionsAPI.getById(prescription.COD_PRES || prescription.id);
        if (response.success && response.prescription) {
          setSelectedPrescriptionDetails({
            ...prescription,
            details: response.prescription.details || []
          });
        }
        setLoading(prev => ({ ...prev, details: false }));
      }
      
      setDetailsModalVisible(true);
    } catch (error) {
      console.error('Erreur chargement détails:', error);
      message.error('Erreur lors du chargement des détails');
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  const handlePrintPrescriptionFromHistory = async (prescription) => {
    try {
      // Préparer les données pour l'impression
      const ordonnanceData = preparePrescriptionForPrint(prescription);
      
      setOrdonnanceToPrint(ordonnanceData);
      setPrintModalVisible(true);
      
      message.success(`Prescription ${prescription.NUMERO_PRESCRIPTION} prête pour l'impression`);
    } catch (error) {
      console.error('Erreur préparation impression:', error);
      message.error('Erreur lors de la préparation de l\'impression: ' + error.message);
    }
  };

  // ==================== NOUVELLE FONCTION POUR IMPRIMER FICHE D'EXÉCUTION ====================
  const imprimerFicheExecution = async () => {
    if (!selectedPrescription) {
      message.error('Aucune prescription sélectionnée');
      return;
    }
    
    if (!selectedPrestataire) {
      message.error('Veuillez sélectionner un médecin exécutant');
      return;
    }
    
    const actesExecutesList = actesExecutes.filter(a => a.execute);
    if (actesExecutesList.length === 0) {
      message.error('Veuillez sélectionner au moins un acte à exécuter');
      return;
    }
    
    try {
      setPrintingOrdonnance(true);
      
      // Préparer les données pour la fiche d'exécution
      const ficheExecutionData = {
        numero: selectedPrescription.NUM_PRESCRIPTION || selectedPrescription.numero || selectedPrescription.COD_PRES,
        COD_PRES: selectedPrescription.COD_PRES || selectedPrescription.id,
        patient: {
          nom_complet: selectedPrescription.NOM_BEN || 'Patient inconnu',
          numero_carte: selectedPrescription.rawData?.NUMERO_CARTE || 'N/A',
          age: selectedPrescription.rawData?.AGE || 'N/A',
          sexe: selectedPrescription.rawData?.SEXE || 'N/A',
          telephone: selectedPrescription.rawData?.TELEPHONE || 'N/A',
          taux_couverture: selectedPrescription.rawData?.TAUX_COUVERTURE || 80
        },
        selectedPrestataire: {
          nom_complet: selectedPrestataire.nom_complet,
          specialite: selectedPrestataire?.specialite || 'Médecin Généraliste',
          MATRICULE: selectedPrestataire?.MATRICULE || 'N/A'
        },
        centreNom: centreNom,
        centreDetails: centreDetails,
        typePrestation: selectedPrescription.TYPE_PRESTATION || 'PRESCRIPTION',
        affectionCode: selectedPrescription.COD_AFF || 'N/A',
        affectionLibelle: selectedPrescription.rawData?.LIB_AFF || 'Non spécifiée',
        dateValidite: selectedPrescription.rawData?.DATE_VALIDITE ? 
          moment(selectedPrescription.rawData.DATE_VALIDITE).format('DD/MM/YYYY') : 
          moment().add(30, 'days').format('DD/MM/YYYY'),
        statut: 'À EXÉCUTER',
        nombrePrestations: actesExecutesList.length,
        total: totalFacture,
        totalPriseEnCharge: Math.round(totalFacture * (selectedPrescription.rawData?.TAUX_COUVERTURE || 80) / 100),
        totalRestant: totalFacture - Math.round(totalFacture * (selectedPrescription.rawData?.TAUX_COUVERTURE || 80) / 100),
        dateCreation: moment().format('DD/MM/YYYY HH:mm'),
        datePrescription: selectedPrescription.DATE_PRESCRIPTION ? 
          moment(selectedPrescription.DATE_PRESCRIPTION).format('DD/MM/YYYY') : 
          'Date inconnue',
        selectedPrestations: actesExecutesList.map((acte, index) => ({
          key: `acte_${acte.COD_ELEMENT || acte.id || index}_${Date.now()}`,
          CODE_ACTE: acte.COD_ELEMENT || acte.CODE_ACTE || acte.id,
          LIBELLE: acte.LIBELLE || 'Acte non spécifié',
          QUANTITE: acte.quantite || 1,
          UNITE: acte.UNITE || 'unité',
          POSOLOGIE: acte.POSOLOGIE || '',
          DUREE: acte.DUREE || '1',
          PRIX_UNITAIRE: acte.prix || 0,
          PRIX: acte.prix || 0,
          TAUX_PRISE_EN_CHARGE: selectedPrescription.rawData?.TAUX_COUVERTURE || 80,
          PRIX_PRISE_EN_CHARGE: Math.round((acte.prix || 0) * (selectedPrescription.rawData?.TAUX_COUVERTURE || 80) / 100),
          CATEGORIE: selectedPrescription.TYPE_PRESTATION || 'PRESCRIPTION',
          DESCRIPTION: acte.DESCRIPTION || '',
          TYPE_ELEMENT: acte.TYPE_ELEMENT || 'PRESTATION',
          REMBOURSABLE: acte.REMBOURSABLE || 1
        })),
        qrCodeData: JSON.stringify({
          numero: selectedPrescription.NUM_PRESCRIPTION || selectedPrescription.numero || selectedPrescription.COD_PRES,
          patient: selectedPrescription.NOM_BEN || 'Patient inconnu',
          date: moment().format('DD/MM/YYYY'),
          centre: centreNom,
          type: selectedPrescription.TYPE_PRESTATION || 'PRESCRIPTION',
          execution: true
        })
      };
      
      // Générer la fenêtre d'impression
      await genererFicheExecutionHTML(ficheExecutionData);
      
      message.success('Fiche d\'exécution générée avec succès');
    } catch (error) {
      console.error('Erreur impression fiche d\'exécution:', error);
      message.error('Erreur lors de la génération de la fiche d\'exécution: ' + error.message);
    } finally {
      setPrintingOrdonnance(false);
    }
  };

  // ==================== COLONNES DES TABLES ====================
  
  const actesColumns = [
    {
      title: 'Code',
      dataIndex: 'CODE_ACTE',
      key: 'CODE_ACTE',
      width: 100,
      render: (code) => <Tag color="blue">{code}</Tag>
    },
    {
      title: 'Désignation',
      dataIndex: 'LIBELLE',
      key: 'LIBELLE',
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          {record.DESCRIPTION && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              {record.DESCRIPTION.substring(0, 50)}...
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Prix (FCFA)',
      dataIndex: 'PRIX',
      key: 'PRIX',
      width: 100,
      render: (prix) => (
        <span style={{ fontWeight: 'bold' }}>
          {parseFloat(prix || 0).toLocaleString('fr-FR')}
        </span>
      )
    },
    {
      title: 'Taux',
      dataIndex: 'TAUX_PRISE_EN_CHARGE',
      key: 'TAUX_PRISE_EN_CHARGE',
      width: 80,
      render: (taux) => (
        <Tag color="green">{taux || 80}%</Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 90,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => ajouterActe(record)}
          disabled={selectedPrestations.some(p => p.CODE_ACTE === record.CODE_ACTE)}
        >
          Ajouter
        </Button>
      )
    }
  ];

  const prescriptionActesColumns = [
    {
      title: 'Type',
      dataIndex: 'TYPE_ELEMENT',
      key: 'TYPE_ELEMENT',
      width: 80,
      render: (type) => (
        <Tag color={type === 'MANUEL' ? 'orange' : 'blue'}>
          {type === 'MANUEL' ? 'Manuel' : 'Nomenclature'}
        </Tag>
      )
    },
    {
      title: 'Code',
      dataIndex: 'CODE_ACTE',
      key: 'CODE_ACTE',
      width: 100,
      render: (code) => <Tag color="blue">{code}</Tag>
    },
    {
      title: 'Désignation',
      dataIndex: 'LIBELLE',
      key: 'LIBELLE',
      width: 200,
      ellipsis: true
    },
    {
      title: 'Qté',
      dataIndex: 'QUANTITE',
      key: 'QUANTITE',
      width: 70,
      render: (text, record) => (
        <InputNumber
          min={1}
          max={999}
          value={text}
          onChange={(value) => updateActe(record.key, 'QUANTITE', value)}
          style={{ width: '70px' }}
          size="small"
        />
      )
    },
    ...((typePrestation === 'PHARMACIE' || typePrestation === 'MEDICAMENT') ? [{
      title: 'Posologie',
      dataIndex: 'POSOLOGIE',
      key: 'POSOLOGIE',
      width: 150,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updateActe(record.key, 'POSOLOGIE', e.target.value)}
          placeholder="Posologie"
          size="small"
        />
      )
    }] : []),
    ...((typePrestation === 'PHARMACIE' || typePrestation === 'MEDICAMENT') ? [{
      title: 'Durée (j)',
      dataIndex: 'DUREE',
      key: 'DUREE',
      width: 80,
      render: (text, record) => (
        <InputNumber
          min={1}
          max={365}
          value={text}
          onChange={(value) => updateActe(record.key, 'DUREE', value)}
          style={{ width: '70px' }}
          size="small"
        />
      )
    }] : []),
    {
      title: 'Prix unit.',
      dataIndex: 'PRIX_UNITAIRE',
      key: 'PRIX_UNITAIRE',
      width: 100,
      render: (prix, record) => (
        <InputNumber
          value={parseFloat(prix || 0)}
          onChange={(value) => updateActe(record.key, 'PRIX_UNITAIRE', value)}
          placeholder="0"
          size="small"
          style={{ width: '100%' }}
          min={0}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
        />
      )
    },
    {
      title: 'Taux %',
      dataIndex: 'TAUX_PRISE_EN_CHARGE',
      key: 'TAUX_PRISE_EN_CHARGE',
      width: 80,
      render: (taux, record) => (
        <InputNumber
          value={parseInt(taux || 80)}
          onChange={(value) => updateActe(record.key, 'TAUX_PRISE_EN_CHARGE', value)}
          placeholder="80"
          size="small"
          style={{ width: '70px' }}
          min={0}
          max={100}
          suffix="%"
        />
      )
    },
    {
      title: 'Total',
      key: 'total',
      width: 120,
      render: (_, record) => {
        const prix = parseFloat(record.PRIX_UNITAIRE) || 0;
        const quantite = parseInt(record.QUANTITE) || 1;
        const taux = parseInt(record.TAUX_PRISE_EN_CHARGE) || 80;
        const total = prix * quantite;
        const priseEnCharge = Math.round(total * taux / 100);
        const restant = total - priseEnCharge;
        
        return (
          <div>
            <div style={{ fontSize: '11px', color: '#666' }}>Total: {total.toLocaleString('fr-FR')}</div>
            <div style={{ fontSize: '10px', color: '#1890ff' }}>Prise en charge: {priseEnCharge.toLocaleString('fr-FR')}</div>
            <div style={{ fontSize: '10px', color: '#f5222d' }}>Reste: {restant.toLocaleString('fr-FR')}</div>
          </div>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => supprimerActe(record.key)}
          size="small"
        />
      )
    }
  ];

  const executionColumns = [
    {
      title: 'Acte',
      dataIndex: 'LIBELLE',
      key: 'LIBELLE',
      width: 200,
      render: (text, record) => (
        <div>
          <div><strong>{text}</strong></div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            Code: {record.COD_ELEMENT} | Qté: {record.quantite}
          </div>
        </div>
      )
    },
    {
      title: 'Prix unit.',
      dataIndex: 'prix',
      key: 'prix',
      width: 100,
      render: (prix) => `${parseFloat(prix || 0).toLocaleString('fr-FR')} FCFA`
    },
    {
      title: 'Quantité',
      dataIndex: 'quantite',
      key: 'quantite',
      width: 80,
      render: (quantite) => <Tag color="blue">{quantite}</Tag>
    },
    {
      title: 'Total',
      key: 'total',
      width: 100,
      render: (_, record) => (
        <span style={{ fontWeight: 'bold' }}>
          {record.total?.toLocaleString('fr-FR') || '0'} FCFA
        </span>
      )
    },
    {
      title: 'Statut',
      dataIndex: 'STATUT',
      key: 'STATUT',
      width: 100,
      render: (statut) => (
        <Tag color={statut === 'EXECUTE' ? 'green' : 'orange'}>
          {statut === 'EXECUTE' ? 'Exécuté' : 'En attente'}
        </Tag>
      )
    },
    {
      title: 'Exécuter',
      key: 'execute',
      width: 100,
      render: (_, record) => (
        <Checkbox
          checked={record.execute}
          onChange={(e) => toggleActeExecution(record.key, e.target.checked)}
          disabled={record.STATUT === 'EXECUTE'}
        >
          {record.execute ? 'Oui' : 'Non'}
        </Checkbox>
      )
    }
  ];

  const prestatairesColumns = [
    {
      title: 'Médecin',
      dataIndex: 'nom_complet',
      key: 'nom_complet',
      render: (text, record) => (
        <div>
          <div><strong>{text}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.specialite || 'Généraliste'}
            {record.GRADE && ` | ${record.GRADE}`}
          </div>
        </div>
      )
    },
    {
      title: 'Matricule',
      dataIndex: 'MATRICULE',
      key: 'MATRICULE',
      width: 100,
      render: (matricule) => (
        <Tag color="blue">{matricule || 'N/A'}</Tag>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div>{record.telephone || 'Non renseigné'}</div>
          {record.email && (
            <div style={{ fontSize: '11px', color: '#666' }}>{record.email}</div>
          )}
        </div>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type={selectedPrestataire?.id === record.id ? 'default' : 'primary'}
          size="small"
          onClick={() => {
            setSelectedPrestataire(record);
            prescriptionForm.setFieldValue('COD_PRESCRIPTEUR', record.id);
            setModalPrestataires(false);
            message.success(`Médecin sélectionné: ${record.nom_complet}`);
          }}
        >
          {selectedPrestataire?.id === record.id ? 'Sélectionné' : 'Sélectionner'}
        </Button>
      )
    }
  ];

  // Colonnes pour la modal des détails des actes
  const detailsActesColumns = [
    {
      title: '#',
      key: 'ordre',
      width: 50,
      render: (_, record, index) => index + 1
    },
    {
      title: 'Code',
      dataIndex: 'COD_ELEMENT',
      key: 'COD_ELEMENT',
      width: 100,
      render: (code) => <Tag color="blue">{code}</Tag>
    },
    {
      title: 'Libellé',
      dataIndex: 'LIBELLE',
      key: 'LIBELLE',
      width: 200
    },
    {
      title: 'Qté',
      dataIndex: 'QUANTITE',
      key: 'QUANTITE',
      width: 80,
      render: (quantite) => <Tag color="blue">{quantite}</Tag>
    },
    {
      title: 'Prix unit.',
      dataIndex: 'PRIX_UNITAIRE',
      key: 'PRIX_UNITAIRE',
      width: 100,
      render: (prix) => `${parseFloat(prix || 0).toLocaleString('fr-FR')} FCFA`
    },
    {
      title: 'Total',
      key: 'total',
      width: 120,
      render: (_, record) => {
        const prix = parseFloat(record.PRIX_UNITAIRE || 0);
        const quantite = parseFloat(record.QUANTITE || 1);
        return `${(prix * quantite).toLocaleString('fr-FR')} FCFA`;
      }
    }
  ];

  // ==================== FONCTION POUR GÉNÉRER LA FICHE D'EXÉCUTION ====================
  const genererFicheExecutionHTML = async (ficheExecutionData) => {
    // Créer la fenêtre d'impression
    const printWindow = window.open('', '_blank');
    const typeColor = getTypeColor(ficheExecutionData.typePrestation);
    const typeLabel = getTypeLabel(ficheExecutionData.typePrestation);
    
    // Calculer les totaux par catégorie
    const categories = {};
    ficheExecutionData.selectedPrestations?.forEach(acte => {
      const cat = acte.CATEGORIE || 'DIVERS';
      if (!categories[cat]) categories[cat] = { total: 0, priseEnCharge: 0, restant: 0 };
      
      const prix = parseFloat(acte.PRIX_UNITAIRE || 0);
      const quantite = parseInt(acte.QUANTITE || 1);
      const taux = parseInt(acte.TAUX_PRISE_EN_CHARGE || 80);
      const total = prix * quantite;
      const priseEnCharge = Math.round(total * taux / 100);
      const restant = total - priseEnCharge;
      
      categories[cat].total += total;
      categories[cat].priseEnCharge += priseEnCharge;
      categories[cat].restant += restant;
    });
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fiche d'Exécution - ${ficheExecutionData.numero}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            margin: 0;
            padding: 0;
            font-size: 10px;
            line-height: 1.4;
            color: #333;
            background: #fff;
          }
          
          .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
          }
          
          /* En-tête moderne avec logo */
          .header {
            border-bottom: 3px solid ${typeColor};
            padding-bottom: 10px;
            margin-bottom: 15px;
            position: relative;
          }
          
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          
          .logo-container {
            flex: 0 0 auto;
          }
          
          .logo {
            height: 70px;
            width: auto;
          }
          
          .header-text {
            flex: 1;
            text-align: center;
            padding: 0 15px;
          }
          
          .header-title {
            font-size: 16px;
            font-weight: bold;
            color: ${typeColor};
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .header-subtitle {
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
          }
          
          .header-info {
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            background: #f8f9fa;
            padding: 6px 10px;
            border-radius: 4px;
            border: 1px solid #e9ecef;
          }
          
          /* Grille moderne */
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 12px;
          }
          
          .grid-3 {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .info-box {
            border: 1px solid #e0e0e0;
            padding: 6px 8px;
            border-radius: 5px;
            background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            transition: all 0.2s ease;
          }
          
          .info-box:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .info-label {
            font-weight: bold;
            font-size: 8px;
            color: #666;
            margin-bottom: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .info-value {
            font-size: 9px;
            font-weight: 500;
          }
          
          /* Tableau moderne */
          .table-container {
            margin: 12px 0;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
          }
          
          th {
            background: linear-gradient(135deg, ${typeColor}, ${typeColor}dd);
            color: white;
            padding: 6px 5px;
            text-align: left;
            font-weight: bold;
            border: none;
            font-size: 9px;
          }
          
          td {
            padding: 5px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
          }
          
          tr:nth-child(even) {
            background: #f8fafc;
          }
          
          tr:hover {
            background: #f1f5f9;
          }
          
          /* Totaux modernes */
          .totals {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin: 12px 0;
            font-size: 9px;
          }
          
          .total-box {
            border: 1px solid #e0e0e0;
            padding: 8px;
            text-align: center;
            border-radius: 6px;
            background: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          
          .total-label {
            font-weight: bold;
            margin-bottom: 4px;
            font-size: 8px;
            color: #666;
            text-transform: uppercase;
          }
          
          .total-value {
            font-size: 14px;
            font-weight: bold;
          }
          
          /* Signatures modernes */
          .signatures {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 2px solid #e0e0e0;
          }
          
          .signature-box {
            text-align: center;
          }
          
          .signature-line {
            width: 70%;
            height: 1px;
            background: #333;
            margin: 20px auto 5px;
          }
          
          .signature-text {
            font-size: 9px;
            margin-top: 3px;
            color: #666;
          }
          
          /* Footer moderne */
          .footer {
            font-size: 7px;
            text-align: center;
            margin-top: 15px;
            color: #888;
            padding-top: 8px;
            border-top: 1px solid #eee;
          }
          
          /* Badges */
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 7px;
            font-weight: bold;
            margin-right: 3px;
          }
          
          .badge-success {
            background: #d4edda;
            color: #155724;
          }
          
          .badge-warning {
            background: #fff3cd;
            color: #856404;
          }
          
          .badge-info {
            background: #d1ecf1;
            color: #0c5460;
          }
          
          /* Optimisations pour impression */
          @media print {
            body {
              font-size: 9px;
            }
            
            .no-print {
              display: none;
            }
            
            .table-container {
              page-break-inside: avoid;
            }
            
            .signatures {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- En-tête moderne avec logo -->
          <div class="header">
            <div class="header-content">
              <div class="logo-container">
                <img src="${AMSlogo}" alt="Logo AMS" class="logo">
              </div>
              <div class="header-text">
                <div class="header-title">
                  FICHE D'EXÉCUTION MÉDICALE
                </div>
                <div class="header-subtitle">
                  ${typeLabel} | N° ${ficheExecutionData.numero}
                </div>
                <div style="font-size: 9px; color: #666; margin-top: 2px;">
                  Document d'exécution des actes médicaux
                </div>
              </div>
              <div style="flex: 0 0 auto; text-align: right;">
                <div style="font-size: 9px; color: #666;">Statut: <span class="badge badge-warning">À EXÉCUTER</span></div>
                <div style="font-size: 8px; margin-top: 2px;">${moment().format('DD/MM/YYYY HH:mm')}</div>
              </div>
            </div>
            
            <div class="header-info">
              <div><strong>Date prescription:</strong> ${ficheExecutionData.datePrescription}</div>
              <div><strong>Centre:</strong> ${ficheExecutionData.centreNom}</div>
              <div><strong>Validité:</strong> ${ficheExecutionData.dateValidite}</div>
            </div>
          </div>
          
          <!-- Section patient -->
          <div class="grid grid-3" style="margin-bottom: 10px;">
            <div class="info-box">
              <div class="info-label">PATIENT</div>
              <div class="info-value" style="font-size: 10px; font-weight: bold;">${ficheExecutionData.patient?.nom_complet || 'N/A'}</div>
              <div style="font-size: 7px; color: #666; margin-top: 2px;">
                <span class="badge badge-info">Carte: ${ficheExecutionData.patient?.numero_carte || 'N/A'}</span>
              </div>
            </div>
            
            <div class="info-box">
              <div class="info-label">INFORMATIONS MÉDICALES</div>
              <div class="info-value">
                ${ficheExecutionData.patient?.age || 'N/A'} ans | 
                ${ficheExecutionData.patient?.sexe === 'M' ? 'Masculin' : ficheExecutionData.patient?.sexe === 'F' ? 'Féminin' : 'N/A'}
              </div>
              <div style="font-size: 7px; color: #666; margin-top: 2px;">
                GS: ${ficheExecutionData.patient?.groupe_sanguin || 'N/A'} | 
                Tél: ${ficheExecutionData.patient?.telephone || 'N/A'}
              </div>
            </div>
            
            <div class="info-box">
              <div class="info-label">COUVERTURE</div>
              <div class="info-value" style="color: #1890ff; font-weight: bold;">
                ${ficheExecutionData.patient?.taux_couverture || 80}%
              </div>
              <div style="font-size: 7px; color: #666; margin-top: 2px;">
                ${ficheExecutionData.patient?.assureur || 'Assureur N/A'}
                ${ficheExecutionData.patient?.numero_assurance ? `| N°: ${ficheExecutionData.patient.numero_assurance}` : ''}
              </div>
            </div>
          </div>
          
          <!-- Section médicale -->
          <div class="grid" style="margin-bottom: 10px;">
            <div class="info-box">
              <div class="info-label">MÉDECIN PRESCRIPTEUR</div>
              <div class="info-value" style="font-size: 10px;">${ficheExecutionData.selectedPrestataire?.nom_complet || 'N/A'}</div>
              <div style="font-size: 7px; color: #666; margin-top: 2px;">
                ${ficheExecutionData.selectedPrestataire?.specialite || 'Médecin'} | 
                Matricule: ${ficheExecutionData.selectedPrestataire?.MATRICULE || 'N/A'}
              </div>
            </div>
            
            <div class="info-box">
              <div class="info-label">AFFECTION / DIAGNOSTIC</div>
              <div class="info-value" style="font-size: 9px;">${ficheExecutionData.affectionLibelle || 'Non spécifiée'}</div>
              <div style="font-size: 7px; color: #666; margin-top: 2px;">
                Code: ${ficheExecutionData.affectionCode || 'N/A'}
              </div>
            </div>
          </div>
          
          <!-- Tableau des actes à exécuter -->
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th width="5%">#</th>
                  <th width="15%">Code</th>
                  <th width="30%">Désignation</th>
                  <th width="8%">Qté</th>
                  ${ficheExecutionData.typePrestation === 'PHARMACIE' || ficheExecutionData.typePrestation === 'MEDICAMENT' ? '<th width="12%">Posologie</th><th width="5%">Durée</th>' : ''}
                  <th width="10%">Prix Unit.</th>
                  <th width="8%">Taux</th>
                  <th width="8%">Total</th>
                  <th width="10%">PEC</th>
                </tr>
              </thead>
              <tbody>
                ${ficheExecutionData.selectedPrestations?.map((acte, index) => {
                  const prix = parseFloat(acte.PRIX_UNITAIRE || 0);
                  const quantite = parseInt(acte.QUANTITE || 1);
                  const taux = parseInt(acte.TAUX_PRISE_EN_CHARGE || 80);
                  const total = prix * quantite;
                  const priseEnCharge = Math.round(total * taux / 100);
                  
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td><span class="badge badge-info">${acte.CODE_ACTE || ''}</span></td>
                      <td>
                        <div style="font-weight: 500;">${acte.LIBELLE || ''}</div>
                        ${acte.POSOLOGIE ? `<div style="font-size: 7px; color: #666; margin-top: 1px;">${acte.POSOLOGIE}</div>` : ''}
                      </td>
                      <td>${quantite} ${acte.UNITE || 'unité'}</td>
                      ${ficheExecutionData.typePrestation === 'PHARMACIE' || ficheExecutionData.typePrestation === 'MEDICAMENT' ? `
                        <td>${acte.POSOLOGIE || ''}</td>
                        <td>${acte.DUREE || ''} j</td>
                      ` : ''}
                      <td style="font-weight: bold;">${prix.toLocaleString('fr-FR')}</td>
                      <td><span class="badge badge-success">${taux}%</span></td>
                      <td style="font-weight: bold;">${total.toLocaleString('fr-FR')}</td>
                      <td style="color: #52c41a; font-weight: bold;">${priseEnCharge.toLocaleString('fr-FR')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Résumé par catégorie -->
          <div style="margin: 10px 0; padding: 8px; background: #f8fafc; border-radius: 6px; border: 1px solid #e9ecef;">
            <div style="font-weight: bold; font-size: 9px; margin-bottom: 6px; color: #666;">RÉSUMÉ PAR CATÉGORIE</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 8px;">
              ${Object.entries(categories).map(([categorie, montants]) => `
                <div style="padding: 4px; background: #fff; border-radius: 4px; border: 1px solid #e0e0e0;">
                  <div style="font-weight: bold; color: ${typeColor};">${categorie}</div>
                  <div style="margin-top: 2px;">
                    <div>Total: <strong>${montants.total.toLocaleString('fr-FR')}</strong></div>
                    <div>PEC: <strong style="color: #52c41a;">${montants.priseEnCharge.toLocaleString('fr-FR')}</strong></div>
                    <div>Reste: <strong style="color: #f5222d;">${montants.restant.toLocaleString('fr-FR')}</strong></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Totaux -->
          <div class="totals">
            <div class="total-box" style="border-color: #1890ff;">
              <div class="total-label">TOTAL À FACTURER</div>
              <div class="total-value" style="color: #1890ff;">
                ${ficheExecutionData.total?.toLocaleString('fr-FR') || '0'} FCFA
              </div>
              <div style="font-size: 7px; color: #666; margin-top: 2px;">
                ${ficheExecutionData.nombrePrestations || 0} acte(s)
              </div>
            </div>
            
            <div class="total-box" style="border-color: #52c41a;">
              <div class="total-label">PRISE EN CHARGE</div>
              <div class="total-value" style="color: #52c41a;">
                ${ficheExecutionData.totalPriseEnCharge?.toLocaleString('fr-FR') || '0'} FCFA
              </div>
              <div style="font-size: 7px; color: #666; margin-top: 2px;">
                (${ficheExecutionData.patient?.taux_couverture || 80}% couverture)
              </div>
            </div>
            
            <div class="total-box" style="border-color: #f5222d;">
              <div class="total-label">RESTE À CHARGE</div>
              <div class="total-value" style="color: #f5222d;">
                ${ficheExecutionData.totalRestant?.toLocaleString('fr-FR') || '0'} FCFA
              </div>
              <div style="font-size: 7px; color: #666; margin-top: 2px;">
                À la charge du patient
              </div>
            </div>
          </div>
          
          <!-- Observations -->
          <div style="margin: 10px 0; padding: 8px; background: #fff8e1; border-radius: 6px; border: 1px solid #ffd54f;">
            <div style="font-weight: bold; font-size: 9px; color: #ff9800; margin-bottom: 4px;">
              <i class="fas fa-exclamation-circle"></i> OBSERVATIONS
            </div>
            <div style="font-size: 8px;">
              Cette fiche d'exécution liste les actes médicaux à réaliser pour le patient. 
              Tous les actes doivent être validés par le médecin exécutant avant facturation.
            </div>
          </div>
          
          <!-- Signatures -->
          <div class="signatures">
            <div class="signature-box">
              <div class="signature-text"><strong>LE MÉDECIN EXÉCUTANT</strong></div>
              <div class="signature-line"></div>
              <div class="signature-text">
                ${ficheExecutionData.selectedPrestataire?.nom_complet || ''}<br>
                ${ficheExecutionData.selectedPrestataire?.specialite || 'Médecin Généraliste'}<br>
                <span style="font-size: 7px; color: #999;">Date et signature</span>
              </div>
            </div>
            
            <div class="signature-box">
              <div class="signature-text"><strong>LE CENTRE DE SANTÉ</strong></div>
              <div class="signature-line"></div>
              <div class="signature-text">
                ${ficheExecutionData.centreNom || ''}<br>
                Centre de Santé Agréé<br>
                <span style="font-size: 7px; color: #999;">Cachet et signature</span>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div>
              Document généré électroniquement par le Système de Gestion Médicale (SGM) | 
              ${moment().format('DD/MM/YYYY à HH:mm')}
            </div>
            <div style="margin-top: 4px; font-size: 6px; color: #aaa;">
              © ${new Date().getFullYear()} AMS - Advanced Medical System | Document confidentiel - Reproduction interdite
            </div>
          </div>
        </div>
        
        <script>
          // Imprimer automatiquement
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // ==================== IMPRESSION SUR FORMAT A4 MODERNE AVEC LOGO ====================
  
  const imprimerOrdonnanceA4 = async () => {
    try {
      setPrintingOrdonnance(true);
      
      if (!ordonnanceToPrint) {
        message.error('Aucune ordonnance à imprimer');
        return;
      }
      
      // Calculer les totaux par catégorie
      const categories = {};
      ordonnanceToPrint.selectedPrestations?.forEach(acte => {
        const cat = acte.CATEGORIE || 'DIVERS';
        if (!categories[cat]) categories[cat] = { total: 0, priseEnCharge: 0, restant: 0 };
        
        const prix = parseFloat(acte.PRIX_UNITAIRE || 0);
        const quantite = parseInt(acte.QUANTITE || 1);
        const taux = parseInt(acte.TAUX_PRISE_EN_CHARGE || 80);
        const total = prix * quantite;
        const priseEnCharge = Math.round(total * taux / 100);
        const restant = total - priseEnCharge;
        
        categories[cat].total += total;
        categories[cat].priseEnCharge += priseEnCharge;
        categories[cat].restant += restant;
      });
      
      // Créer la fenêtre d'impression
      const printWindow = window.open('', '_blank');
      const typeColor = getTypeColor(ordonnanceToPrint.typePrestation);
      const typeLabel = getTypeLabel(ordonnanceToPrint.typePrestation);
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Feuille de Prise en Charge - ${ordonnanceToPrint.numero}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              margin: 0;
              padding: 0;
              font-size: 10px;
              line-height: 1.4;
              color: #333;
              background: #fff;
            }
            
            .container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 0;
            }
            
            /* En-tête moderne avec logo */
            .header {
              border-bottom: 3px solid ${typeColor};
              padding-bottom: 10px;
              margin-bottom: 15px;
              position: relative;
            }
            
            .header-content {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            
            .logo-container {
              flex: 0 0 auto;
            }
            
            .logo {
              height: 70px;
              width: auto;
            }
            
            .header-text {
              flex: 1;
              text-align: center;
              padding: 0 15px;
            }
            
            .header-title {
              font-size: 16px;
              font-weight: bold;
              color: ${typeColor};
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .header-subtitle {
              font-size: 12px;
              color: #666;
              margin-bottom: 4px;
            }
            
            .header-info {
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              background: #f8f9fa;
              padding: 6px 10px;
              border-radius: 4px;
              border: 1px solid #e9ecef;
            }
            
            /* Grille moderne */
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
              margin-bottom: 12px;
            }
            
            .grid-3 {
              grid-template-columns: repeat(3, 1fr);
            }
            
            .info-box {
              border: 1px solid #e0e0e0;
              padding: 6px 8px;
              border-radius: 5px;
              background: #fff;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
              transition: all 0.2s ease;
            }
            
            .info-box:hover {
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .info-label {
              font-weight: bold;
              font-size: 8px;
              color: #666;
              margin-bottom: 2px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .info-value {
              font-size: 9px;
              font-weight: 500;
            }
            
            /* Tableau moderne */
            .table-container {
              margin: 12px 0;
              border-radius: 6px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8px;
            }
            
            th {
              background: linear-gradient(135deg, ${typeColor}, ${typeColor}dd);
              color: white;
              padding: 6px 5px;
              text-align: left;
              font-weight: bold;
              border: none;
              font-size: 9px;
            }
            
            td {
              padding: 5px;
              border-bottom: 1px solid #eee;
              vertical-align: top;
            }
            
            tr:nth-child(even) {
              background: #f8fafc;
            }
            
            tr:hover {
              background: #f1f5f9;
            }
            
            /* Totaux modernes */
            .totals {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
              margin: 12px 0;
              font-size: 9px;
            }
            
            .total-box {
              border: 1px solid #e0e0e0;
              padding: 8px;
              text-align: center;
              border-radius: 6px;
              background: #fff;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .total-label {
              font-weight: bold;
              margin-bottom: 4px;
              font-size: 8px;
              color: #666;
              text-transform: uppercase;
            }
            
            .total-value {
              font-size: 14px;
              font-weight: bold;
            }
            
            /* Signatures modernes */
            .signatures {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-top: 25px;
              padding-top: 15px;
              border-top: 2px solid #e0e0e0;
            }
            
            .signature-box {
              text-align: center;
            }
            
            .signature-line {
              width: 70%;
              height: 1px;
              background: #333;
              margin: 20px auto 5px;
            }
            
            .signature-text {
              font-size: 9px;
              margin-top: 3px;
              color: #666;
            }
            
            /* Footer moderne */
            .footer {
              font-size: 7px;
              text-align: center;
              margin-top: 15px;
              color: #888;
              padding-top: 8px;
              border-top: 1px solid #eee;
            }
            
            /* Badges */
            .badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 7px;
              font-weight: bold;
              margin-right: 3px;
            }
            
            .badge-success {
              background: #d4edda;
              color: #155724;
            }
            
            .badge-warning {
              background: #fff3cd;
              color: #856404;
            }
            
            .badge-info {
              background: #d1ecf1;
              color: #0c5460;
            }
            
            /* QR Code style */
            .qrcode-container {
              text-align: center;
              margin: 10px 0;
              padding: 8px;
              background: #f8f9fa;
              border-radius: 6px;
              border: 1px solid #e9ecef;
            }
            
            /* Optimisations pour impression */
            @media print {
              body {
                font-size: 9px;
              }
              
              .no-print {
                display: none;
              }
              
              .table-container {
                page-break-inside: avoid;
              }
              
              .signatures {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- En-tête moderne avec logo -->
            <div class="header">
              <div class="header-content">
                <div class="logo-container">
                  <img src="${AMSlogo}" alt="Logo AMS" class="logo">
                </div>
                <div class="header-text">
                  <div class="header-title">
                    FEUILLE DE PRISE EN CHARGE MÉDICALE
                  </div>
                  <div class="header-subtitle">
                    ${typeLabel} | N° ${ordonnanceToPrint.numero}
                  </div>
                  <div style="font-size: 9px; color: #666; margin-top: 2px;">
                    Document officiel de prescription médicale
                  </div>
                </div>
                <div style="flex: 0 0 auto; text-align: right;">
                  <div style="font-size: 9px; color: #666;">Statut: <span class="badge badge-success">${ordonnanceToPrint.statut || 'EN COURS'}</span></div>
                  <div style="font-size: 8px; margin-top: 2px;">${ordonnanceToPrint.dateCreation}</div>
                </div>
              </div>
              
              <div class="header-info">
                <div><strong>Date prescription:</strong> ${ordonnanceToPrint.datePrescription}</div>
                <div><strong>Centre:</strong> ${ordonnanceToPrint.centreNom}</div>
                <div><strong>Validité:</strong> ${ordonnanceToPrint.dateValidite}</div>
              </div>
            </div>
            
            <!-- Section patient -->
            <div class="grid grid-3" style="margin-bottom: 10px;">
              <div class="info-box">
                <div class="info-label">PATIENT</div>
                <div class="info-value" style="font-size: 10px; font-weight: bold;">${ordonnanceToPrint.patient?.nom_complet || 'N/A'}</div>
                <div style="font-size: 7px; color: #666; margin-top: 2px;">
                  <span class="badge badge-info">Carte: ${ordonnanceToPrint.patient?.numero_carte || 'N/A'}</span>
                </div>
              </div>
              
              <div class="info-box">
                <div class="info-label">INFORMATIONS MÉDICALES</div>
                <div class="info-value">
                  ${ordonnanceToPrint.patient?.age || 'N/A'} ans | 
                  ${ordonnanceToPrint.patient?.sexe === 'M' ? 'Masculin' : ordonnanceToPrint.patient?.sexe === 'F' ? 'Féminin' : 'N/A'}
                </div>
                <div style="font-size: 7px; color: #666; margin-top: 2px;">
                  GS: ${ordonnanceToPrint.patient?.groupe_sanguin || 'N/A'} | 
                  Tél: ${ordonnanceToPrint.patient?.telephone || 'N/A'}
                </div>
              </div>
              
              <div class="info-box">
                <div class="info-label">COUVERTURE</div>
                <div class="info-value" style="color: #1890ff; font-weight: bold;">
                  ${ordonnanceToPrint.patient?.taux_couverture || 80}%
                </div>
                <div style="font-size: 7px; color: #666; margin-top: 2px;">
                  ${ordonnanceToPrint.patient?.assureur || 'Assureur N/A'}
                  ${ordonnanceToPrint.patient?.numero_assurance ? `| N°: ${ordonnanceToPrint.patient.numero_assurance}` : ''}
                </div>
              </div>
            </div>
            
            <!-- Section médicale -->
            <div class="grid" style="margin-bottom: 10px;">
              <div class="info-box">
                <div class="info-label">MÉDECIN PRESCRIPTEUR</div>
                <div class="info-value" style="font-size: 10px;">${ordonnanceToPrint.selectedPrestataire?.nom_complet || 'N/A'}</div>
                <div style="font-size: 7px; color: #666; margin-top: 2px;">
                  ${ordonnanceToPrint.selectedPrestataire?.specialite || 'Médecin'} | 
                  Matricule: ${ordonnanceToPrint.selectedPrestataire?.MATRICULE || 'N/A'}
                </div>
              </div>
              
              <div class="info-box">
                <div class="info-label">AFFECTION / DIAGNOSTIC</div>
                <div class="info-value" style="font-size: 9px;">${ordonnanceToPrint.affectionLibelle || 'Non spécifiée'}</div>
                <div style="font-size: 7px; color: #666; margin-top: 2px;">
                  Code: ${ordonnanceToPrint.affectionCode || 'N/A'}
                </div>
              </div>
            </div>
            
            <!-- Tableau des actes -->
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th width="5%">#</th>
                    <th width="15%">Code</th>
                    <th width="30%">Désignation</th>
                    <th width="8%">Qté</th>
                    ${ordonnanceToPrint.typePrestation === 'PHARMACIE' || ordonnanceToPrint.typePrestation === 'MEDICAMENT' ? '<th width="12%">Posologie</th><th width="5%">Durée</th>' : ''}
                    <th width="10%">Prix Unit.</th>
                    <th width="8%">Taux</th>
                    <th width="8%">Total</th>
                    <th width="10%">PEC</th>
                  </tr>
                </thead>
                <tbody>
                  ${ordonnanceToPrint.selectedPrestations?.map((acte, index) => {
                    const prix = parseFloat(acte.PRIX_UNITAIRE || 0);
                    const quantite = parseInt(acte.QUANTITE || 1);
                    const taux = parseInt(acte.TAUX_PRISE_EN_CHARGE || 80);
                    const total = prix * quantite;
                    const priseEnCharge = Math.round(total * taux / 100);
                    
                    return `
                      <tr>
                        <td>${index + 1}</td>
                        <td><span class="badge badge-info">${acte.CODE_ACTE || ''}</span></td>
                        <td>
                          <div style="font-weight: 500;">${acte.LIBELLE || ''}</div>
                          ${acte.POSOLOGIE ? `<div style="font-size: 7px; color: #666; margin-top: 1px;">${acte.POSOLOGIE}</div>` : ''}
                        </td>
                        <td>${quantite} ${acte.UNITE || 'unité'}</td>
                        ${ordonnanceToPrint.typePrestation === 'PHARMACIE' || ordonnanceToPrint.typePrestation === 'MEDICAMENT' ? `
                          <td>${acte.POSOLOGIE || ''}</td>
                          <td>${acte.DUREE || ''} j</td>
                        ` : ''}
                        <td style="font-weight: bold;">${prix.toLocaleString('fr-FR')}</td>
                        <td><span class="badge badge-success">${taux}%</span></td>
                        <td style="font-weight: bold;">${total.toLocaleString('fr-FR')}</td>
                        <td style="color: #52c41a; font-weight: bold;">${priseEnCharge.toLocaleString('fr-FR')}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            
            <!-- Résumé par catégorie -->
            <div style="margin: 10px 0; padding: 8px; background: #f8fafc; border-radius: 6px; border: 1px solid #e9ecef;">
              <div style="font-weight: bold; font-size: 9px; margin-bottom: 6px; color: #666;">RÉSUMÉ PAR CATÉGORIE</div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 8px;">
                ${Object.entries(categories).map(([categorie, montants]) => `
                  <div style="padding: 4px; background: #fff; border-radius: 4px; border: 1px solid #e0e0e0;">
                    <div style="font-weight: bold; color: ${typeColor};">${categorie}</div>
                    <div style="margin-top: 2px;">
                      <div>Total: <strong>${montants.total.toLocaleString('fr-FR')}</strong></div>
                      <div>PEC: <strong style="color: #52c41a;">${montants.priseEnCharge.toLocaleString('fr-FR')}</strong></div>
                      <div>Reste: <strong style="color: #f5222d;">${montants.restant.toLocaleString('fr-FR')}</strong></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- Totaux -->
            <div class="totals">
              <div class="total-box" style="border-color: #1890ff;">
                <div class="total-label">TOTAL PRESCRIPTION</div>
                <div class="total-value" style="color: #1890ff;">
                  ${ordonnanceToPrint.total?.toLocaleString('fr-FR') || '0'} FCFA
                </div>
                <div style="font-size: 7px; color: #666; margin-top: 2px;">
                  ${ordonnanceToPrint.selectedPrestations?.length || 0} élément(s)
                </div>
              </div>
              
              <div class="total-box" style="border-color: #52c41a;">
                <div class="total-label">PRISE EN CHARGE</div>
                <div class="total-value" style="color: #52c41a;">
                  ${ordonnanceToPrint.totalPriseEnCharge?.toLocaleString('fr-FR') || '0'} FCFA
                </div>
                <div style="font-size: 7px; color: #666; margin-top: 2px;">
                  (${ordonnanceToPrint.patient?.taux_couverture || 80}% couverture)
                </div>
              </div>
              
              <div class="total-box" style="border-color: #f5222d;">
                <div class="total-label">RESTE À CHARGE</div>
                <div class="total-value" style="color: #f5222d;">
                  ${ordonnanceToPrint.totalRestant?.toLocaleString('fr-FR') || '0'} FCFA
                </div>
                <div style="font-size: 7px; color: #666; margin-top: 2px;">
                  À la charge du patient
                </div>
              </div>
            </div>
            
            <!-- Observations -->
            <div style="margin: 10px 0; padding: 8px; background: #e8f4fd; border-radius: 6px; border: 1px solid #b6d4fe;">
              <div style="font-weight: bold; font-size: 9px; color: #1890ff; margin-bottom: 4px;">
                <i class="fas fa-info-circle"></i> OBSERVATIONS
              </div>
              <div style="font-size: 8px;">
                ${ordonnanceToPrint.observations || 'Aucune observation particulière.'}
                ${ordonnanceToPrint.dateExecution ? `<br><strong>Date d'exécution:</strong> ${ordonnanceToPrint.dateExecution}` : ''}
              </div>
            </div>
            
            <!-- QR Code -->
            <div class="qrcode-container">
              <div style="font-size: 8px; color: #666; margin-bottom: 4px;">
                <strong>CODE DE VÉRIFICATION</strong>
              </div>
              <div style="font-size: 7px; color: #999; margin-bottom: 6px;">
                Scannez ce code pour vérifier l'authenticité de la prescription
              </div>
              <div style="font-family: monospace; font-size: 6px; background: #f8f9fa; padding: 4px; border-radius: 3px;">
                ${ordonnanceToPrint.qrCodeData || ''}
              </div>
            </div>
            
            <!-- Signatures -->
            <div class="signatures">
              <div class="signature-box">
                <div class="signature-text"><strong>LE MÉDECIN PRESCRIPTEUR</strong></div>
                <div class="signature-line"></div>
                <div class="signature-text">
                  ${ordonnanceToPrint.selectedPrestataire?.nom_complet || ''}<br>
                  ${ordonnanceToPrint.selectedPrestataire?.specialite || 'Médecin Généraliste'}<br>
                  <span style="font-size: 7px; color: #999;">Date et signature</span>
                </div>
              </div>
              
              <div class="signature-box">
                <div class="signature-text"><strong>LE CENTRE DE SANTÉ</strong></div>
                <div class="signature-line"></div>
                <div class="signature-text">
                  ${ordonnanceToPrint.centreNom || ''}<br>
                  Centre de Santé Agréé<br>
                  <span style="font-size: 7px; color: #999;">Cachet et signature</span>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <div>
                Document généré électroniquement par le Système de Gestion Médicale (SGM) | 
                ${moment().format('DD/MM/YYYY à HH:mm')}
              </div>
              <div style="margin-top: 4px; font-size: 6px; color: #aaa;">
                © ${new Date().getFullYear()} AMS - Advanced Medical System | Document confidentiel - Reproduction interdite
              </div>
            </div>
          </div>
          
          <script>
            // Imprimer automatiquement
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }, 500);
            };
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      message.success('Feuille de prise en charge générée avec succès');
    } catch (error) {
      console.error('Erreur impression:', error);
      message.error('Erreur lors de la génération du document: ' + error.message);
    } finally {
      setPrintingOrdonnance(false);
    }
  };

  // ==================== EFFETS ====================
  useEffect(() => {
    loadCentres();
  }, []);

  useEffect(() => {
    if (centreId) {
      loadPrestataires();
    }
  }, [centreId]);

  useEffect(() => {
    if (typePrestation) {
      loadActesMedicaux();
    }
  }, [typePrestation]);

  useEffect(() => {
    if (activeTab === 'historique' && selectedPrestataire) {
      loadMesPrescriptions();
    }
  }, [activeTab, selectedPrestataire]);

  // ==================== RENDU PRINCIPAL ====================
  
  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MedicineBoxOutlined style={{ marginRight: 8, fontSize: '20px', color: '#1890ff' }} />
            <span>Gestion des Prescriptions Médicales</span>
            {centreNom && (
              <Tag color="blue" style={{ marginLeft: 16 }}>
                <DatabaseOutlined /> {centreNom}
              </Tag>
            )}
          </div>
        }
        extra={
          <Space>
            <Select
              value={centreId}
              onChange={(value) => {
                if (value) {
                  setCentreId(value.toString());
                  localStorage.setItem('selectedCentre', value.toString());
                }
              }}
              style={{ width: 250 }}
              placeholder="Sélectionner un centre"
              loading={loadingCentres}
              disabled={loadingCentres}
            >
              {centres.map(centre => {
                const centreValue = centre.id || centre.COD_CEN;
                if (!centreValue) return null;
                return (
                  <Option key={centreValue} value={centreValue.toString()}>
                    {centre.nom || centre.LIB_CEN || centre.NOM_CENTRE || `Centre ${centreValue}`}
                    {centre.TYP_CEN && ` (${centre.TYP_CEN})`}
                  </Option>
                );
              })}
            </Select>
            
            <Button
              type={selectedPrestataire ? 'default' : 'primary'}
              icon={<TeamOutlined />}
              onClick={() => setModalPrestataires(true)}
              loading={loadingPrestataires}
              disabled={!centreId}
            >
              {selectedPrestataire ? 
                `Dr. ${selectedPrestataire.nom_complet.split(' ')[0]}` : 
                'Choisir médecin'}
            </Button>
          </Space>
        }
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          animated
        >
          {/* TAB 1: SAISIE DE PRESCRIPTION */}
          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                Saisie de Prescription
              </span>
            } 
            key="saisie"
          >
            <Form
              form={prescriptionForm}
              layout="vertical"
              onFinish={validerPrescription}
            >
              {/* SECTION PATIENT */}
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <UserOutlined style={{ marginRight: 8 }} />
                    <span>Étape 1: Identification du Patient</span>
                  </div>
                }
                style={{ marginBottom: 16 }}
                size="small"
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Numéro de carte du patient"
                      required
                      rules={[{ required: true, message: 'Veuillez entrer un numéro de carte' }]}
                    >
                      <Input.Search
                        placeholder="Entrez le numéro de la carte d'assurance"
                        enterButton={<SearchOutlined />}
                        size="large"
                        onSearch={searchPatient}
                        loading={loading.patient}
                        allowClear
                        disabled={!centreId}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Type de prestation"
                      required
                      initialValue="PHARMACIE"
                    >
                      <Select
                        value={typePrestation}
                        onChange={(value) => {
                          setTypePrestation(value);
                          setSelectedPrestations([]);
                          setSearchPrestation('');
                        }}
                        size="large"
                        disabled={!centreId}
                      >
                        <Option value="PHARMACIE">Pharmacie</Option>
                        <Option value="MEDICAMENT">Médicament</Option>
                        <Option value="EXAMEN">Examen</Option>
                        <Option value="BIOLOGIE">Biologie</Option>
                        <Option value="IMAGERIE">Imagerie Médicale</Option>
                        <Option value="HOSPITALISATION">Hospitalisation</Option>
                        <Option value="CONSULTATION">Consultation Spécialisée</Option>
                        <Option value="KINESITHERAPIE">Kinésithérapie</Option>
                        <Option value="INFIRMIER">Soins infirmiers</Option>
                        <Option value="ACTE">Acte Médical</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {patient && (
                  <Alert
                    message="Informations du Patient"
                    description={
                      <Descriptions size="small" column={3}>
                        <Descriptions.Item label="Nom">
                          <strong>{patient.nom_complet}</strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="Identifiant">
                          {patient.identifiant_national || patient.numero_carte}
                        </Descriptions.Item>
                        <Descriptions.Item label="Âge/Sexe">
                          {patient.age} ans / {patient.sexe || 'Non spécifié'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Groupe Sanguin">
                          {patient.groupe_sanguin || 'Non renseigné'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Téléphone">
                          {patient.telephone || 'Non renseigné'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Taux Couverture">
                          <Tag color="green">{patient.taux_couverture || 80}%</Tag>
                        </Descriptions.Item>
                      </Descriptions>
                    }
                    type="success"
                    showIcon
                    style={{ marginBottom: 16 }}
                    action={
                      <Button size="small" onClick={() => setPatient(null)}>
                        Changer
                      </Button>
                    }
                  />
                )}
              </Card>

              {/* SECTION AFFECTION */}
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <HeartOutlined style={{ marginRight: 8 }} />
                    <span>Étape 2: Diagnostic et Affection</span>
                    <Tag color="green" style={{ marginLeft: 8 }}>
                      COD_PAY: {COD_PAY_DEFAULT}
                    </Tag>
                  </div>
                }
                style={{ marginBottom: 16 }}
                size="small"
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      label="Recherche d'affection"
                      required
                      help="Tapez au moins 2 caractères pour rechercher une affection (COD_PAY = CMF)"
                      validateStatus={affectionCode ? 'success' : ''}
                      hasFeedback={affectionCode}
                    >
                      <AutoComplete
                        options={affectionOptions}
                        style={{ width: '100%' }}
                        onSearch={searchAffections}
                        onSelect={handleSelectAffection}
                        placeholder="Ex: Hypertension, Diabète, Grippe..."
                        notFoundContent={
                          searchingAffections ? 
                            <div style={{ padding: 8, textAlign: 'center' }}>
                              <Spin size="small" /> Recherche en cours...
                            </div> : 
                            "Aucune affection trouvée"
                        }
                        disabled={!patient}
                        filterOption={false}
                        defaultActiveFirstOption={false}
                        allowClear
                        value={affectionCode ? `${affectionCode} - ${affectionLibelle}` : undefined}
                        onChange={(value) => {
                          if (value === '') {
                            setAffectionOptions([]);
                            setAffectionCode('');
                            setAffectionLibelle('');
                            setAffectionDetails(null);
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                {affectionCode && (
                  <Alert
                    message="Affection sélectionnée"
                    description={
                      <div>
                        <strong>Code:</strong> {affectionCode}
                        <br />
                        <strong>Libellé:</strong> {affectionLibelle || 'Non spécifié'}
                        {affectionDetails && (
                          <>
                            <br />
                            <strong>Type:</strong> {affectionDetails.TYPE_AFFECTION || 'Non spécifié'}
                          </>
                        )}
                      </div>
                    }
                    type="info"
                    showIcon
                    action={
                      <Button size="small" onClick={() => {
                        setAffectionCode('');
                        setAffectionLibelle('');
                        setAffectionDetails(null);
                      }}>
                        Changer
                      </Button>
                    }
                  />
                )}
              </Card>

              {/* SECTION ACTES MÉDICAUX */}
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <MedicineBoxOutlined style={{ marginRight: 8 }} />
                      <span>Étape 3: Actes Médicaux ({getTypeLabel(typePrestation)})</span>
                    </div>
                    <div>
                      <Tag color="blue">{selectedPrestations.length} élément(s)</Tag>
                      <Tag color="green">
                        Total: {calculerTotal().toLocaleString('fr-FR')} FCFA
                      </Tag>
                      <Tag color="cyan">
                        Prise en charge: {calculerTotalPriseEnCharge().toLocaleString('fr-FR')} FCFA
                      </Tag>
                    </div>
                  </div>
                }
                style={{ marginBottom: 16 }}
                size="small"
              >
                {!patient ? (
                  <Alert
                    message="Patient requis"
                    description="Veuillez d'abord rechercher un patient avant d'ajouter des actes"
                    type="warning"
                    showIcon
                  />
                ) : !affectionCode ? (
                  <Alert
                    message="Affection requise"
                    description="Veuillez d'abord sélectionner une affection avant d'ajouter des actes"
                    type="warning"
                    showIcon
                  />
                ) : (
                  <>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={18}>
                        <Input.Search
                          placeholder={`Rechercher des actes ${getTypeLabel(typePrestation).toLowerCase()}...`}
                          enterButton={<SearchOutlined />}
                          size="large"
                          value={searchPrestation}
                          onChange={(e) => handleSearchActes(e.target.value)}
                          loading={loadingActes}
                          disabled={!patient || !affectionCode}
                        />
                      </Col>
                      <Col span={6}>
                        <Space>
                          <Button
                            type="dashed"
                            icon={<AppstoreAddOutlined />}
                            onClick={() => ouvrirSaisieManuelle(typePrestation === 'PHARMACIE' ? 'MEDICAMENT' : 'ACTE')}
                            style={{ width: '100%' }}
                          >
                            Saisie manuelle
                          </Button>
                        </Space>
                      </Col>
                    </Row>
                    
                    {loadingActes ? (
                      <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin tip="Chargement des actes..." size="large" />
                      </div>
                    ) : searchResults.length > 0 ? (
                                               <Table
                        columns={actesColumns}
                        dataSource={searchResults}
                        pagination={{ pageSize: 10, size: 'small' }}
                        size="small"
                        scroll={{ y: 300 }}
                        rowKey="key"
                        locale={{
                          emptyText: (
                            <Empty
                              description="Aucun acte trouvé"
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                            >
                              <Button
                                type="primary"
                                size="small"
                                onClick={() => ouvrirSaisieManuelle(typePrestation === 'PHARMACIE' ? 'MEDICAMENT' : 'ACTE')}
                              >
                                Ajouter manuellement
                              </Button>
                            </Empty>
                          )
                        }}
                      />
                    ) : (
                      <Empty
                        description={`Aucun ${getTypeLabel(typePrestation).toLowerCase()} disponible`}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      >
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => ouvrirSaisieManuelle(typePrestation === 'PHARMACIE' ? 'MEDICAMENT' : 'ACTE')}
                        >
                          Ajouter manuellement
                        </Button>
                      </Empty>
                    )}
                    
                    {selectedPrestations.length > 0 && (
                      <>
                        <Divider orientation="left">
                          <strong>Liste des actes prescrits</strong> ({selectedPrestations.length} élément(s))
                        </Divider>
                        
                        <Table
                          columns={prescriptionActesColumns}
                          dataSource={selectedPrestations}
                          pagination={false}
                          size="small"
                          scroll={{ x: 1200 }}
                          rowKey="key"
                          summary={() => {
                            const total = calculerTotal();
                            const priseEnCharge = calculerTotalPriseEnCharge();
                            const restant = calculerTotalRestant();
                            
                            return (
                              <Table.Summary.Row style={{ background: '#fafafa' }}>
                                <Table.Summary.Cell colSpan={4} align="right">
                                  <strong>Total général:</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell>
                                  <strong>{total.toLocaleString('fr-FR')} FCFA</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell>
                                  <Tag color="green">Prise en charge:</Tag>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell>
                                  <strong style={{ color: '#52c41a' }}>
                                    {priseEnCharge.toLocaleString('fr-FR')} FCFA
                                  </strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell>
                                  <Tag color="red">Reste à charge:</Tag>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell>
                                  <strong style={{ color: '#f5222d' }}>
                                    {restant.toLocaleString('fr-FR')} FCFA
                                  </strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell></Table.Summary.Cell>
                              </Table.Summary.Row>
                            );
                          }}
                        />
                      </>
                    )}
                  </>
                )}
              </Card>
              
              {/* SECTION VALIDATION */}
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleOutlined style={{ marginRight: 8 }} />
                    <span>Étape 4: Validation de la Prescription</span>
                  </div>
                }
                style={{ marginBottom: 16 }}
                size="small"
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Alert
                      message="Informations importantes"
                      description={
                        <div>
                          <p>
                            <strong>Type de prescription:</strong> {getTypeLabel(typePrestation)}
                          </p>
                          <p>
                            <strong>Nombre d'actes:</strong> {selectedPrestations.length}
                          </p>
                          <p>
                            <strong>Total de la prescription:</strong> {calculerTotal().toLocaleString('fr-FR')} FCFA
                          </p>
                          <p>
                            <strong>Prise en charge estimée:</strong> {calculerTotalPriseEnCharge().toLocaleString('fr-FR')} FCFA
                          </p>
                          <p>
                            <strong>Reste à charge:</strong> {calculerTotalRestant().toLocaleString('fr-FR')} FCFA
                          </p>
                        </div>
                      }
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    
                    <Form.Item
                      label="Observations supplémentaires"
                      name="observations"
                    >
                      <TextArea
                        rows={3}
                        placeholder="Ajoutez des observations ou commentaires sur cette prescription..."
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                <div style={{ textAlign: 'right' }}>
                  <Space>
                    <Button
                      type="default"
                      icon={<DeleteOutlined />}
                      onClick={resetPrescriptionForm}
                      disabled={!patient && selectedPrestations.length === 0}
                    >
                      Réinitialiser
                    </Button>
                    
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={validerPrescription}
                      loading={loading.prescrire}
                      disabled={!patient || selectedPrestations.length === 0 || !affectionCode || !selectedPrestataire}
                      size="large"
                    >
                      Valider la prescription
                    </Button>
                    
                    <Button
                      type="primary"
                      icon={<PrinterOutlined />}
                      onClick={validerPrescription}
                      disabled={!patient || selectedPrestations.length === 0 || !affectionCode || !selectedPrestataire}
                      ghost
                      size="large"
                    >
                      Valider et imprimer
                    </Button>
                  </Space>
                </div>
              </Card>
            </Form>
          </TabPane>
          
          {/* TAB 2: EXÉCUTION */}
          <TabPane
            tab={
              <span>
                <PlayCircleOutlined />
                Exécution des Prescriptions
              </span>
            }
            key="execution"
          >
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <PlayCircleOutlined style={{ marginRight: 8 }} />
                    <span>Exécution des Prescriptions</span>
                  </div>
                  {selectedPrescription && (
                    <Tag color="blue" style={{ fontSize: '14px' }}>
                      <strong>Prescription: {selectedPrescription.NUM_PRESCRIPTION || selectedPrescription.numero || selectedPrescription.COD_PRES}</strong>
                    </Tag>
                  )}
                </div>
              }
              style={{ marginBottom: 16 }}
              size="small"
            >
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={16}>
                  <Input.Search
                    placeholder="Rechercher une prescription par numéro..."
                    enterButton={<SearchOutlined />}
                    size="large"
                    value={prescriptionNumero}
                    onChange={(e) => setPrescriptionNumero(e.target.value)}
                    onSearch={searchPrescription}
                    loading={loading.execution}
                    disabled={!selectedPrestataire}
                    allowClear
                  />
                </Col>
                <Col span={8}>
                  <Space>
                    <Button
                      type="default"
                      icon={<PrinterOutlined />}
                      onClick={imprimerFicheExecution}
                      disabled={!selectedPrescription || actesExecutes.filter(a => a.execute).length === 0}
                      loading={printingOrdonnance}
                    >
                      Imprimer fiche d'exécution
                    </Button>
                    <Button
                      type="dashed"
                      icon={<ReloadOutlined />}
                      onClick={() => {
                        setSelectedPrescription(null);
                        setPrescriptionNumero('');
                        setActesExecutes([]);
                        setTotalFacture(0);
                      }}
                    >
                      Réinitialiser
                    </Button>
                  </Space>
                </Col>
              </Row>
              
              {selectedPrescription && (
                <Alert
                  message="Informations de la prescription"
                  description={
                    <Descriptions size="small" column={3}>
                      <Descriptions.Item label="Patient">
                        <strong>{selectedPrescription.NOM_BEN || 'Patient inconnu'}</strong>
                      </Descriptions.Item>
                      <Descriptions.Item label="Type">
                        <Tag color={getTypeColor(selectedPrescription.TYPE_PRESTATION)}>
                          {getTypeLabel(selectedPrescription.TYPE_PRESTATION)}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Date prescription">
                        {selectedPrescription.DATE_PRESCRIPTION ? 
                          moment(selectedPrescription.DATE_PRESCRIPTION).format('DD/MM/YYYY HH:mm') : 
                          'Date inconnue'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Statut">
                        <Tag color={
                          selectedPrescription.STATUT === 'EN_ATTENTE' ? 'orange' :
                          selectedPrescription.STATUT === 'EN_COURS' ? 'blue' :
                          selectedPrescription.STATUT === 'EXECUTEE' ? 'green' :
                          'default'
                        }>
                          {selectedPrescription.STATUT}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Centre">
                        {selectedPrescription.centreNom || getCentreNameById(selectedPrescription.COD_CEN)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Nombre d'actes">
                        {selectedPrescription.nombreActes || actesExecutes.length}
                      </Descriptions.Item>
                    </Descriptions>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  action={
                    <Button size="small" onClick={() => {
                      setSelectedPrescription(null);
                      setPrescriptionNumero('');
                      setActesExecutes([]);
                      setTotalFacture(0);
                    }}>
                      Changer
                    </Button>
                  }
                />
              )}
              
              {actesExecutes.length > 0 && (
                <>
                  <Divider orientation="left">
                    <strong>Liste des actes à exécuter</strong> ({actesExecutes.length} acte(s))
                  </Divider>
                  
                  <Table
                    columns={executionColumns}
                    dataSource={actesExecutes}
                    pagination={false}
                    size="small"
                    scroll={{ x: 800 }}
                    rowKey="key"
                    style={{ marginBottom: 16 }}
                  />
                  
                  <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={12}>
                      <Card size="small" title="Résumé de l'exécution">
                        <Statistic
                          title="Actes sélectionnés"
                          value={actesExecutes.filter(a => a.execute).length}
                          suffix={`/ ${actesExecutes.length}`}
                          valueStyle={{ color: '#1890ff' }}
                        />
                        <Divider style={{ margin: '12px 0' }} />
                        <Statistic
                          title="Total à facturer"
                          value={totalFacture}
                          prefix="FCFA"
                          valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                          formatter={(value) => value.toLocaleString('fr-FR')}
                        />
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                          <ClockCircleOutlined /> 
                          Exécution à valider par: <strong>{selectedPrestataire?.nom_complet || 'Aucun médecin sélectionné'}</strong>
                        </div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" title="Validation de l'exécution">
                        <Alert
                          message="Instructions"
                          description="Sélectionnez les actes à exécuter, puis validez l'exécution de la prescription."
                          type="info"
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                        
                        <div style={{ textAlign: 'center' }}>
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={validerExecution}
                            loading={loading.execution}
                            size="large"
                            disabled={!selectedPrescription || actesExecutes.filter(a => a.execute).length === 0 || !selectedPrestataire}
                            style={{ width: '100%', marginBottom: 8 }}
                          >
                            Valider l'exécution ({actesExecutes.filter(a => a.execute).length} actes)
                          </Button>
                          
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            <CheckOutlined style={{ color: '#52c41a' }} /> 
                            Cette action enregistrera l'exécution et générera une fiche d'exécution
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </>
              )}
              
              {!selectedPrescription && !loading.execution && (
                <Result
                  icon={<PlayCircleOutlined style={{ color: '#1890ff' }} />}
                  title="Rechercher une prescription à exécuter"
                  subTitle="Entrez le numéro d'une prescription pour commencer l'exécution des actes médicaux."
                  extra={
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: 16 }}>
                        <InfoCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                        <span style={{ color: '#666' }}>
                          Seules les prescriptions du centre <strong>{centreNom}</strong> peuvent être exécutées
                        </span>
                      </div>
                      <Steps
                        current={0}
                        items={[
                          {
                            title: 'Recherche',
                            description: 'Trouver la prescription'
                          },
                          {
                            title: 'Sélection',
                            description: 'Choisir les actes à exécuter'
                          },
                          {
                            title: 'Validation',
                            description: 'Enregistrer l\'exécution'
                          }
                        ]}
                      />
                    </div>
                  }
                />
              )}
            </Card>
          </TabPane>
          
          {/* TAB 3: HISTORIQUE */}
          <TabPane
            tab={
              <span>
                <HistoryOutlined />
                Historique des Prescriptions
                {mesPrescriptions.length > 0 && (
                  <Badge
                    count={mesPrescriptions.length}
                    style={{ marginLeft: 8, backgroundColor: '#1890ff' }}
                  />
                )}
              </span>
            }
            key="historique"
          >
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <HistoryOutlined style={{ marginRight: 8 }} />
                    <span>Historique de mes Prescriptions</span>
                  </div>
                  <div>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={loadMesPrescriptions}
                      loading={loading.historique}
                      size="small"
                    >
                      Actualiser
                    </Button>
                  </div>
                </div>
              }
              size="small"
            >
              {loading.historique ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin tip="Chargement de l'historique..." size="large" />
                </div>
              ) : mesPrescriptions.length > 0 ? (
                <Table
                  columns={[
                    {
                      title: 'N° Prescription',
                      dataIndex: 'NUMERO_PRESCRIPTION',
                      key: 'NUMERO_PRESCRIPTION',
                      width: 150,
                      render: (text, record) => (
                        <div>
                          <Tag color="blue">{text}</Tag>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            {record.TYPE_PRESTATION}
                          </div>
                        </div>
                      )
                    },
                    {
                      title: 'Patient',
                      dataIndex: 'NOM_BEN',
                      key: 'NOM_BEN',
                      width: 180,
                      render: (text) => (
                        <div>
                          <UserOutlined style={{ marginRight: 4, color: '#666' }} />
                          {text}
                        </div>
                      )
                    },
                    {
                      title: 'Date Prescription',
                      dataIndex: 'DATE_PRESCRIPTION',
                      key: 'DATE_PRESCRIPTION',
                      width: 150,
                      sorter: (a, b) => moment(a.DATE_PRESCRIPTION, 'DD/MM/YYYY HH:mm').unix() - moment(b.DATE_PRESCRIPTION, 'DD/MM/YYYY HH:mm').unix(),
                      sortDirections: ['descend', 'ascend'],
                      defaultSortOrder: 'descend',
                      render: (text) => (
                        <div>
                          <CalendarOutlined style={{ marginRight: 4, color: '#666' }} />
                          {text}
                        </div>
                      )
                    },
                    {
                      title: 'Centre',
                      dataIndex: 'centreNom',
                      key: 'centreNom',
                      width: 150,
                      render: (text) => (
                        <div style={{ fontSize: '12px' }}>
                          <DatabaseOutlined style={{ marginRight: 4, color: '#666' }} />
                          {text}
                        </div>
                      )
                    },
                    {
                      title: 'Statut',
                      dataIndex: 'STATUT',
                      key: 'STATUT',
                      width: 120,
                      filters: [
                        { text: 'En attente', value: 'En attente' },
                        { text: 'En cours', value: 'En cours' },
                        { text: 'Exécutée', value: 'Exécutée' },
                        { text: 'Validée', value: 'Validée' },
                        { text: 'Annulée', value: 'Annulée' }
                      ],
                      onFilter: (value, record) => record.STATUT === value,
                      render: (statut) => {
                        let color = 'default';
                        if (statut === 'En attente') color = 'orange';
                        if (statut === 'En cours') color = 'blue';
                        if (statut === 'Exécutée') color = 'green';
                        if (statut === 'Validée') color = 'cyan';
                        if (statut === 'Annulée') color = 'red';
                        
                        return <Tag color={color}>{statut}</Tag>;
                      }
                    },
                    {
                      title: 'Nombre Actes',
                      dataIndex: 'nombreActes',
                      key: 'nombreActes',
                      width: 100,
                      render: (nombre) => (
                        <Tag color="geekblue">{nombre}</Tag>
                      )
                    },
                    {
                      title: 'Total (FCFA)',
                      dataIndex: 'total',
                      key: 'total',
                      width: 120,
                      sorter: (a, b) => (a.total || 0) - (b.total || 0),
                      render: (total) => (
                        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                          {parseFloat(total || 0).toLocaleString('fr-FR')}
                        </span>
                      )
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      width: 150,
                      fixed: 'right',
                      render: (_, record) => (
                        <Space>
                          <Tooltip title="Voir les détails">
                            <Button
                              type="text"
                              icon={<EyeOutlined />}
                              onClick={() => handleViewPrescriptionDetails(record)}
                              size="small"
                            />
                          </Tooltip>
                          
                          <Tooltip title="Imprimer la prescription">
                            <Button
                              type="text"
                              icon={<PrinterOutlined />}
                              onClick={() => handlePrintPrescriptionFromHistory(record)}
                              size="small"
                              disabled={!record.details || record.details.length === 0}
                            />
                          </Tooltip>
                          
                          {record.STATUT !== 'Exécutée' && record.STATUT !== 'Annulée' && (
                            <Tooltip title="Exécuter la prescription">
                              <Button
                                type="text"
                                icon={<PlayCircleOutlined />}
                                onClick={() => {
                                  setActiveTab('execution');
                                  setPrescriptionNumero(record.NUMERO_PRESCRIPTION);
                                  setTimeout(() => {
                                    searchPrescription(record.NUMERO_PRESCRIPTION);
                                  }, 500);
                                }}
                                size="small"
                              />
                            </Tooltip>
                          )}
                        </Space>
                      )
                    }
                  ]}
                  dataSource={mesPrescriptions}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} prescriptions`
                  }}
                  size="small"
                  scroll={{ x: 1000 }}
                  rowKey="id"
                  onChange={(pagination, filters, sorter) => {
                    console.log('Table changed:', { pagination, filters, sorter });
                  }}
                />
              ) : (
                <Result
                  icon={<HistoryOutlined style={{ color: '#d9d9d9' }} />}
                  title="Aucune prescription trouvée"
                  subTitle={
                    <div>
                      <p>Aucune prescription n'a été trouvée pour le médecin <strong>{selectedPrestataire?.nom_complet || 'non sélectionné'}</strong></p>
                      <p>au centre <strong>{centreNom}</strong>.</p>
                    </div>
                  }
                  extra={
                    <Button
                      type="primary"
                      onClick={() => setActiveTab('saisie')}
                      icon={<PlusOutlined />}
                    >
                      Créer une nouvelle prescription
                    </Button>
                  }
                />
              )}
            </Card>
          </TabPane>
        </Tabs>
      </Card>
      
      {/* ==================== MODALES ==================== */}
      
      {/* Modal de saisie manuelle */}
      <Modal
        title={
          <div>
            <EditOutlined style={{ marginRight: 8 }} />
            Saisie manuelle d'un élément
          </div>
        }
        open={manualEntryModal}
        onOk={ajouterManuellement}
        onCancel={() => setManualEntryModal(false)}
        okText="Ajouter"
        cancelText="Annuler"
        width={600}
      >
        <Form
          form={manualForm}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Type d'élément"
                name="type"
                initialValue={manualEntryType}
              >
                <Select disabled>
                  <Option value="MEDICAMENT">Médicament</Option>
                  <Option value="EXAMEN">Examen</Option>
                  <Option value="ACTE">Acte médical</Option>
                  <Option value="SOIN">Soin</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Code (optionnel)"
                name="code_acte"
              >
                <Input placeholder="Code interne ou référence" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="Libellé"
            name="libelle"
            rules={[{ required: true, message: 'Veuillez saisir un libellé' }]}
          >
            <Input placeholder="Ex: Paracétamol 500mg, Consultation spécialisée..." />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Quantité"
                name="quantite"
                rules={[{ required: true, message: 'Veuillez saisir la quantité' }]}
                initialValue={1}
              >
                <InputNumber min={1} max={999} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Prix unitaire (FCFA)"
                name="prix_unitaire"
                rules={[{ required: true, message: 'Veuillez saisir le prix unitaire' }]}
                initialValue={0}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              {manualEntryType === 'MEDICAMENT' && (
                <Form.Item
                  label="Durée (jours)"
                  name="duree"
                  initialValue="7"
                >
                  <Input placeholder="Durée du traitement" />
                </Form.Item>
              )}
            </Col>
          </Row>
          
          {manualEntryType === 'MEDICAMENT' && (
            <Form.Item
              label="Posologie"
              name="posologie"
              initialValue="1 comprimé matin et soir"
            >
              <Input placeholder="Ex: 1 comprimé matin et soir après le repas" />
            </Form.Item>
          )}
          
          <Form.Item
            label="Description (optionnel)"
            name="description"
          >
            <TextArea
              rows={3}
              placeholder="Ajoutez une description ou des instructions supplémentaires..."
            />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Modal de validation de prescription */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            <span>Validation de la prescription</span>
          </div>
        }
        open={validationModalVisible}
        onOk={confirmerPrescription}
        onCancel={() => setValidationModalVisible(false)}
        okText="Confirmer et enregistrer"
        cancelText="Annuler"
        width={700}
        confirmLoading={loading.prescrire}
      >
        {patient && (
          <div>
            <Alert
              message="Résumé de la prescription"
              description="Veuillez vérifier les informations ci-dessous avant de valider définitivement la prescription."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Patient" span={2}>
                <strong>{patient.nom_complet}</strong> (Carte: {patient.numero_carte})
              </Descriptions.Item>
              <Descriptions.Item label="Médecin prescripteur">
                {selectedPrestataire?.nom_complet || 'Non sélectionné'}
              </Descriptions.Item>
              <Descriptions.Item label="Centre de santé">
                {centreNom}
              </Descriptions.Item>
              <Descriptions.Item label="Type de prescription">
                <Tag color={getTypeColor(typePrestation)}>
                  {getTypeLabel(typePrestation)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Affection">
                {affectionCode} - {affectionLibelle}
              </Descriptions.Item>
              <Descriptions.Item label="Nombre d'actes">
                <strong>{selectedPrestations.length}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Total prescription">
                <strong style={{ color: '#1890ff' }}>
                  {calculerTotal().toLocaleString('fr-FR')} FCFA
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Prise en charge">
                <strong style={{ color: '#52c41a' }}>
                  {calculerTotalPriseEnCharge().toLocaleString('fr-FR')} FCFA
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Reste à charge">
                <strong style={{ color: '#f5222d' }}>
                  {calculerTotalRestant().toLocaleString('fr-FR')} FCFA
                </strong>
              </Descriptions.Item>
            </Descriptions>
            
            <div style={{ background: '#fafafa', padding: 12, borderRadius: 4, marginBottom: 16 }}>
              <strong>Liste des actes prescrits:</strong>
              <List
                size="small"
                dataSource={selectedPrestations}
                renderItem={(acte, index) => (
                  <List.Item>
                    <List.Item.Meta
                      title={`${index + 1}. ${acte.LIBELLE}`}
                      description={
                        <div>
                          Code: {acte.CODE_ACTE} | Qté: {acte.QUANTITE} | 
                          Prix: {parseFloat(acte.PRIX_UNITAIRE || 0).toLocaleString('fr-FR')} FCFA | 
                          Taux PEC: {acte.TAUX_PRISE_EN_CHARGE || 80}%
                          {acte.POSOLOGIE && ` | Posologie: ${acte.POSOLOGIE}`}
                          {acte.DUREE && ` | Durée: ${acte.DUREE} jour(s)`}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
            
            <Alert
              message="Consentement électronique"
              description={
                <div>
                  <p>En confirmant, vous certifiez que:</p>
                  <ul>
                    <li>Cette prescription est médicalement justifiée</li>
                    <li>Le patient a été correctement identifié</li>
                    <li>Les actes prescrits sont adaptés à l'affection diagnostiquée</li>
                    <li>Les tarifs appliqués sont conformes au barème en vigueur</li>
                  </ul>
                </div>
              }
              type="warning"
              showIcon
            />
          </div>
        )}
      </Modal>
      
      {/* Modal d'impression */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PrinterOutlined style={{ marginRight: 8 }} />
            <span>Impression de la prescription</span>
          </div>
        }
        open={printModalVisible}
        onCancel={() => setPrintModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPrintModalVisible(false)}>
            Fermer
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={imprimerOrdonnanceA4}
            loading={printingOrdonnance}
          >
            Imprimer
          </Button>
        ]}
        width={700}
      >
        {ordonnanceToPrint && (
          <div>
            <Alert
              message="Prescription prête pour l'impression"
              description={`La prescription N° ${ordonnanceToPrint.numero} a été enregistrée avec succès. Vous pouvez maintenant l'imprimer.`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Numéro">
                <Tag color="blue">{ordonnanceToPrint.numero}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag color={
                  ordonnanceToPrint.statut === 'EN_COURS' ? 'blue' :
                  ordonnanceToPrint.statut === 'EXECUTEE' ? 'green' :
                  'default'
                }>
                  {ordonnanceToPrint.statut}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Patient">
                {ordonnanceToPrint.patient?.nom_complet}
              </Descriptions.Item>
              <Descriptions.Item label="Date création">
                {ordonnanceToPrint.dateCreation}
              </Descriptions.Item>
              <Descriptions.Item label="Nombre d'actes">
                {ordonnanceToPrint.nombrePrestations || ordonnanceToPrint.selectedPrestations?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                <strong>{ordonnanceToPrint.total?.toLocaleString('fr-FR') || '0'} FCFA</strong>
              </Descriptions.Item>
            </Descriptions>
            
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Alert
                message="Format d'impression"
                description="Le document sera généré au format A4 avec en-tête professionnel, tableau des actes, totaux et signatures."
                type="info"
                showIcon
              />
              
              <div style={{ marginTop: 16 }}>
                <Button
                  type="dashed"
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    // Option pour télécharger en PDF (à implémenter)
                    message.info('Fonctionnalité de téléchargement PDF à venir');
                  }}
                  style={{ marginRight: 8 }}
                >
                  Télécharger PDF
                </Button>
                
                <Button
                  type="dashed"
                  icon={<FileExcelOutlined />}
                  onClick={() => {
                    // Option pour exporter en Excel (à implémenter)
                    message.info('Fonctionnalité d\'export Excel à venir');
                  }}
                >
                  Exporter Excel
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Modal des prestataires (médecins) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TeamOutlined style={{ marginRight: 8 }} />
            <span>Sélection du médecin prescripteur</span>
          </div>
        }
        open={modalPrestataires}
        onCancel={() => setModalPrestataires(false)}
        footer={null}
        width={800}
      >
        {!centreId ? (
          <Alert
            message="Centre de santé requis"
            description="Veuillez d'abord sélectionner un centre de santé pour afficher la liste des médecins."
            type="warning"
            showIcon
            action={
              <Button size="small" onClick={() => {
                setModalPrestataires(false);
                message.info('Veuillez sélectionner un centre de santé');
              }}>
                OK
              </Button>
            }
          />
        ) : loadingPrestataires ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin tip="Chargement des médecins..." size="large" />
          </div>
        ) : prestataires.length > 0 ? (
          <div>
            <Alert
              message={`Centre: ${centreNom}`}
              description={`${prestataires.length} médecin(s) disponible(s) dans ce centre`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Table
              columns={prestatairesColumns}
              dataSource={prestataires}
              pagination={{ pageSize: 10 }}
              size="small"
              scroll={{ y: 400 }}
              rowKey="id"
            />
          </div>
        ) : (
          <Result
            icon={<TeamOutlined style={{ color: '#d9d9d9' }} />}
            title="Aucun médecin disponible"
            subTitle={
              <div>
                <p>Aucun médecin n'a été trouvé pour le centre <strong>{centreNom}</strong>.</p>
                <p>Veuillez vérifier que des médecins sont affectés à ce centre.</p>
              </div>
            }
            extra={
              <Button
                type="primary"
                onClick={() => {
                  loadPrestataires();
                }}
                icon={<ReloadOutlined />}
              >
                Réessayer
              </Button>
            }
          />
        )}
      </Modal>
      
      {/* Modal des détails de prescription */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FileTextOutlined style={{ marginRight: 8 }} />
            <span>Détails de la prescription</span>
            {selectedPrescriptionDetails && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                N° {selectedPrescriptionDetails.NUMERO_PRESCRIPTION}
              </Tag>
            )}
          </div>
        }
        placement="right"
        onClose={() => setDetailsModalVisible(false)}
        open={detailsModalVisible}
        width={700}
      >
        {loading.details ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin tip="Chargement des détails..." size="large" />
          </div>
        ) : selectedPrescriptionDetails ? (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Patient" span={2}>
                <strong>{selectedPrescriptionDetails.NOM_BEN}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Date prescription">
                {selectedPrescriptionDetails.DATE_PRESCRIPTION}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color={getTypeColor(selectedPrescriptionDetails.TYPE_PRESTATION)}>
                  {selectedPrescriptionDetails.TYPE_PRESTATION}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag color={
                  selectedPrescriptionDetails.STATUT === 'En attente' ? 'orange' :
                  selectedPrescriptionDetails.STATUT === 'En cours' ? 'blue' :
                  selectedPrescriptionDetails.STATUT === 'Exécutée' ? 'green' :
                  'default'
                }>
                  {selectedPrescriptionDetails.STATUT}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Centre">
                {selectedPrescriptionDetails.centreNom}
              </Descriptions.Item>
              <Descriptions.Item label="Médecin">
                {selectedPrescriptionDetails.NOM_MEDECIN}
              </Descriptions.Item>
              <Descriptions.Item label="Nombre d'actes">
                {selectedPrescriptionDetails.nombreActes || selectedPrescriptionDetails.details?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                <strong>{parseFloat(selectedPrescriptionDetails.total || 0).toLocaleString('fr-FR')} FCFA</strong>
              </Descriptions.Item>
            </Descriptions>
            
            {selectedPrescriptionDetails.COD_AFF && (
              <Alert
                message="Affection / Diagnostic"
                description={`Code: ${selectedPrescriptionDetails.COD_AFF} - ${selectedPrescriptionDetails.rawData?.LIB_AFF || 'Non spécifié'}`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            
            {selectedPrescriptionDetails.details && selectedPrescriptionDetails.details.length > 0 ? (
              <>
                <Divider orientation="left">Liste des actes ({selectedPrescriptionDetails.details.length})</Divider>
                <Table
                  columns={detailsActesColumns}
                  dataSource={selectedPrescriptionDetails.details}
                  pagination={false}
                  size="small"
                  rowKey={(record) => record.COD_ELEMENT || record.id || Math.random()}
                  summary={() => {
                    const total = selectedPrescriptionDetails.details.reduce((sum, acte) => {
                      const prix = parseFloat(acte.PRIX_UNITAIRE || 0);
                      const quantite = parseFloat(acte.QUANTITE || 1);
                      return sum + (prix * quantite);
                    }, 0);
                    
                    return (
                      <Table.Summary.Row style={{ background: '#fafafa' }}>
                        <Table.Summary.Cell colSpan={5} align="right">
                          <strong>Total de la prescription:</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell>
                          <strong style={{ color: '#1890ff' }}>
                            {total.toLocaleString('fr-FR')} FCFA
                          </strong>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    );
                  }}
                />
              </>
            ) : (
              <Alert
                message="Aucun détail d'acte"
                description="Les détails de cette prescription ne sont pas disponibles."
                type="warning"
                showIcon
              />
            )}
            
            <div style={{ marginTop: 24 }}>
              <Space>
                <Button
                  type="primary"
                  icon={<PrinterOutlined />}
                  onClick={() => {
                    handlePrintPrescriptionFromHistory(selectedPrescriptionDetails);
                    setDetailsModalVisible(false);
                  }}
                >
                  Imprimer
                </Button>
                
                {selectedPrescriptionDetails.STATUT !== 'Exécutée' && selectedPrescriptionDetails.STATUT !== 'Annulée' && (
                  <Button
                    type="default"
                    icon={<PlayCircleOutlined />}
                    onClick={() => {
                      setActiveTab('execution');
                      setPrescriptionNumero(selectedPrescriptionDetails.NUMERO_PRESCRIPTION);
                      setDetailsModalVisible(false);
                      setTimeout(() => {
                        searchPrescription(selectedPrescriptionDetails.NUMERO_PRESCRIPTION);
                      }, 500);
                    }}
                  >
                    Exécuter
                  </Button>
                )}
                
                <Button onClick={() => setDetailsModalVisible(false)}>
                  Fermer
                </Button>
              </Space>
            </div>
          </div>
        ) : (
          <Alert
            message="Aucune donnée"
            description="Les détails de la prescription ne sont pas disponibles."
            type="warning"
            showIcon
          />
        )}
      </Drawer>
    </div>
  );
};

export default Prescriptions;