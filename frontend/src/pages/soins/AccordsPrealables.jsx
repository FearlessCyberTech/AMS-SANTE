// src/pages/soins/AccordsPrealables.jsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  InputNumber,
  Checkbox,
  AutoComplete,
  Typography,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
  Alert,
  Steps,
  Divider,
  Descriptions,
  Tabs,
  message,
  Spin,
  Progress,
  Switch
} from 'antd';
import {
  FileTextOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  PlusOutlined,
  SearchOutlined,
  SyncOutlined,
  PrinterOutlined,
  TeamOutlined,
  HomeOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  PercentageOutlined,
  DollarOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  CalendarOutlined,
  BankOutlined,
  FileDoneOutlined,
  HistoryOutlined,
  DownloadOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import moment from 'moment';
// IMPORT CORRIGÉ POUR jsPDF
import jsPDF from 'jspdf';
// IMPORT CORRIGÉ POUR autotable
import autoTable from 'jspdf-autotable';

// API imports
import { 
  consultationsAPI,
  beneficiairesAPI,
  affectionsAPI,
  prescriptionsAPI
} from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Step } = Steps;
const { TabPane } = Tabs;

const AccordsPrealables = () => {
  // ==================== ÉTATS ====================
  
  // États principaux
  const [demandes, setDemandes] = useState([]);
  const [beneficiairesListe, setBeneficiairesListe] = useState([]);
  const [beneficiairesTotaux, setBeneficiairesTotaux] = useState({});
  
  // États de chargement
  const [loading, setLoading] = useState({
    demandes: false,
    dashboard: false,
    creation: false,
    validation: false,
    patients: false,
    affections: false,
    actes: false,
    listeBeneficiaires: false
  });
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    total: 0,
    enAttente: 0,
    validees: 0,
    executees: 0,
    rejetees: 0,
    annulees: 0,
    montantTotal: 0,
    tauxValidation: 0,
    nombreBeneficiairesAtteintPlafond: 0
  });
  
  // États des modales
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [creationModalVisible, setCreationModalVisible] = useState(false);
  const [manualActeModalVisible, setManualActeModalVisible] = useState(false);
  const [beneficiairesModalVisible, setBeneficiairesModalVisible] = useState(false);
  
  // États des filtres
  const [filtres, setFiltres] = useState({
    dateDebut: moment().subtract(30, 'days'),
    dateFin: moment(),
    statut: 'tous',
    type: 'tous',
    search: '',
    priorite: 'tous',
    filtrePlafond: 'atteint'
  });
  
  // États de création
  const [creationStep, setCreationStep] = useState(0);
  const [newDemande, setNewDemande] = useState({
    COD_BEN: '',
    patientInfo: null,
    TYPE_PRESTATION: '',
    COD_AFF: '',
    codeAffectationInfo: null,
    OBSERVATIONS: '',
    hospitalisation: false,
    dateDebutHospitalisation: null,
    dateFinHospitalisation: null,
    dureeHospitalisation: null,
    plafondChambre: 50000,
    dateEntreePatient: moment().format('YYYY-MM-DD'),
    actes: [],
    MONTANT_TOTAL: 0,
    tauxCouverture: 80,
    PRIORITE: 'moyenne',
    STATUT: 'En attente',
    URGENCE: false
  });
  
  // États de recherche
  const [searchPatientTerm, setSearchPatientTerm] = useState('');
  const [searchActeTerm, setSearchActeTerm] = useState('');
  const [searchAffectionTerm, setSearchAffectionTerm] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [acteResults, setActeResults] = useState([]);
  const [affectionsList, setAffectionsList] = useState([]);
  
  // États de validation
  const [validationErreurs, setValidationErreurs] = useState({});
  
  // Acte manuel
  const [manualActe, setManualActe] = useState({
    code: '',
    libelle: '',
    libelle_complet: '',
    quantite: 1,
    prixUnitaire: 0,
    remboursable: true,
    tauxPriseEnCharge: 80
  });
  
  // Formulaires
  const [actionForm] = Form.useForm();
  const [manualActeForm] = Form.useForm();
  
  // Références
  const searchTimerRef = useRef(null);
  
  // ==================== CONSTANTES ====================
  
  const statuts = [
    { value: 'En attente', label: 'En attente', color: 'warning', icon: <ClockCircleOutlined /> },
    { value: 'Validee', label: 'Validée', color: 'success', icon: <CheckCircleOutlined /> },
    { value: 'Rejetee', label: 'Rejetée', color: 'error', icon: <CloseCircleOutlined /> },
    { value: 'Executee', label: 'Exécutée', color: 'processing', icon: <SafetyCertificateOutlined /> },
    { value: 'Annulée', label: 'Annulée', color: 'default', icon: <CloseCircleOutlined /> }
  ];
  
  const typesPrestation = [
    { value: 'Consultation', label: 'Consultation', color: 'blue', icon: <UserOutlined /> },
    { value: 'Pharmacie', label: 'Pharmacie', color: 'green', icon: <MedicineBoxOutlined /> },
    { value: 'Biologie', label: 'Biologie', color: 'cyan' },
    { value: 'Imagerie', label: 'Imagerie', color: 'purple' },
    { value: 'Hospitalisation', label: 'Hospitalisation', color: 'red', icon: <HomeOutlined /> },
    { value: 'Chirurgie', label: 'Chirurgie', color: 'volcano' },
    { value: 'Rééducation', label: 'Rééducation', color: 'orange' }
  ];
  
  const priorities = [
    { value: 'haute', label: 'Haute', color: 'red', icon: <ExclamationCircleOutlined /> },
    { value: 'moyenne', label: 'Moyenne', color: 'orange', icon: <ClockCircleOutlined /> },
    { value: 'basse', label: 'Basse', color: 'blue', icon: <CheckCircleOutlined /> }
  ];
  
  const motifsRejet = [
    { value: 'Documentation insuffisante', label: 'Documentation insuffisante' },
    { value: 'Affection non couverte', label: 'Affection non couverte' },
    { value: 'Montant excessif', label: 'Montant excessif' },
    { value: 'Procédure non respectée', label: 'Procédure non respectée' },
    { value: 'Acte non remboursable', label: 'Acte non remboursable' },
    { value: 'Hors périmètre', label: 'Hors périmètre' },
    { value: 'Autre', label: 'Autre' }
  ];
  
  const filtresPlafond = [
    { value: 'atteint', label: 'Plafond atteint' },
    { value: 'non_atteint', label: 'Plafond non atteint' },
    { value: 'tous', label: 'Tous les bénéficiaires' }
  ];
  
  // ==================== FONCTIONS UTILITAIRES ====================
  
  const getUserInfo = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        return {
          centreSanteId: 1,
          prestataireId: 1,
          userId: null,
          nomComplet: 'Utilisateur',
          matricule: 'ADM001'
        };
      }
      
      const userInfo = JSON.parse(userStr);
      return {
        centreSanteId: userInfo.COD_CEN || 1,
        prestataireId: userInfo.COD_PRE || 1,
        userId: userInfo.id || userInfo.userId,
        nomComplet: `${userInfo.NOM_UTIL || ''} ${userInfo.PRE_UTIL || ''}`.trim() || 'Utilisateur',
        matricule: userInfo.MATRICULE || 'ADM001'
      };
    } catch (error) {
      console.error('Erreur lecture userInfo:', error);
      return {
        centreSanteId: 1,
        prestataireId: 1,
        userId: null,
        nomComplet: 'Utilisateur',
        matricule: 'ADM001'
      };
    }
  }, []);
  
  const calculateAge = (dateString) => {
    if (!dateString) return null;
    const birthDate = moment(dateString);
    const today = moment();
    return today.diff(birthDate, 'years');
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'Validee': return '#52c41a';
      case 'En attente': return '#faad14';
      case 'Rejetee': return '#f5222d';
      case 'Executee': return '#1890ff';
      case 'Annulée': return '#d9d9d9';
      default: return '#d9d9d9';
    }
  };
  
  // ==================== FONCTIONS API ====================
  
  const loadAffections = useCallback(async (search = '') => {
    if (search && search.trim().length < 2) {
      setAffectionsList([]);
      return;
    }
    
    setLoading(prev => ({ ...prev, affections: true }));
    try {
      let response;
      
      if (search && search.trim().length >= 2) {
        response = await affectionsAPI.search(search, 50);
      } else {
        response = await affectionsAPI.getAll({ limit: 100 });
      }
      
      if (response.success && response.affections && response.affections.length > 0) {
        const transformedAffections = response.affections.map(affection => {
          return {
            id: affection.COD_AFF || affection.id,
            label: `${affection.LIB_AFF || affection.libelle} (${affection.COD_AFF || affection.id})`,
            libelle: affection.LIB_AFF || affection.libelle,
            code: affection.COD_AFF || affection.id,
            LIB_AFF: affection.LIB_AFF || affection.libelle,
            COD_AFF: affection.COD_AFF || affection.id,
            ...affection
          };
        });
        
        setAffectionsList(transformedAffections);
      } else {
        setAffectionsList([]);
      }
    } catch (error) {
      console.error('Erreur chargement affections:', error);
      setAffectionsList([]);
      message.error('Erreur lors du chargement des affections');
    } finally {
      setLoading(prev => ({ ...prev, affections: false }));
    }
  }, []);
  
  const loadBeneficiaires = useCallback(async () => {
    setLoading(prev => ({ ...prev, listeBeneficiaires: true }));
    try {
      const response = await beneficiairesAPI.getAll({
        page: 1,
        limit: 1000
      });
      
      if (response.success && response.beneficiaires) {
        const beneficiaires = response.beneficiaires;
        
        const demandesResponse = await prescriptionsAPI.getAll({
          page: 1,
          limit: 1000,
          stats: false
        });
        
        let totauxParBeneficiaire = {};
        
        if (demandesResponse.success && demandesResponse.prescriptions) {
          const demandes = demandesResponse.prescriptions || [];
          
          demandes.forEach(demande => {
            const beneficiaireId = demande.COD_BEN || demande.beneficiaire_id;
            const montant = parseFloat(demande.MONTANT_TOTAL || demande.montant_total || 0);
            
            if (beneficiaireId) {
              if (!totauxParBeneficiaire[beneficiaireId]) {
                totauxParBeneficiaire[beneficiaireId] = 0;
              }
              totauxParBeneficiaire[beneficiaireId] += montant;
            }
          });
        }
        
        setBeneficiairesTotaux(totauxParBeneficiaire);
        
        const beneficiairesAvecTotaux = beneficiaires.map(ben => {
          const total = totauxParBeneficiaire[ben.ID_BEN || ben.id] || 0;
          const plafondMax = ben.plafond || 500000;
          const plafondAtteint = total >= plafondMax;
          
          return {
            id: ben.ID_BEN || ben.id,
            COD_BEN: ben.ID_BEN || ben.id,
            nom: ben.NOM_BEN || ben.nom,
            prenom: ben.PRE_BEN || ben.prenom,
            age: calculateAge(ben.NAI_BEN),
            identifiant: ben.IDENTIFIANT_NATIONAL || ben.identifiant_national || '',
            date_naissance: ben.NAI_BEN || null,
            telephone: ben.TELEPHONE_MOBILE || ben.TELEPHONE || ben.telephone || '',
            sexe: ben.SEX_BEN || ben.sexe,
            COD_PAY: ben.COD_PAY || 'FR',
            totalTransactions: total,
            plafond: plafondMax,
            plafondAtteint: plafondAtteint,
            pourcentageUtilisation: plafondMax > 0 ? Math.min(100, (total / plafondMax) * 100) : 0
          };
        });
        
        beneficiairesAvecTotaux.sort((a, b) => b.totalTransactions - a.totalTransactions);
        
        setBeneficiairesListe(beneficiairesAvecTotaux);
        
        const nombreAtteintPlafond = beneficiairesAvecTotaux.filter(b => b.plafondAtteint).length;
        setDashboardData(prev => ({
          ...prev,
          nombreBeneficiairesAtteintPlafond: nombreAtteintPlafond
        }));
        
        return beneficiairesAvecTotaux;
      }
    } catch (error) {
      console.error('Erreur chargement bénéficiaires:', error);
      message.error('Erreur lors du chargement de la liste des bénéficiaires');
      return [];
    } finally {
      setLoading(prev => ({ ...prev, listeBeneficiaires: false }));
    }
  }, []);
  
  const loadDashboardData = useCallback(async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    
    try {
      const response = await prescriptionsAPI.getAll({
        page: 1,
        limit: 1000,
        stats: true
      });
      
      if (response.success) {
        const demandes = response.prescriptions || [];
        const hospitalisations = demandes.filter(d => d.TYPE_PRESTATION === 'Hospitalisation');
        
        const stats = {
          total: response.pagination?.total || demandes.length,
          enAttente: demandes.filter(d => (d.STATUT || d.statut) === 'En attente').length,
          validees: demandes.filter(d => (d.STATUT || d.statut) === 'Validee').length,
          executees: demandes.filter(d => (d.STATUT || d.statut) === 'Executee').length,
          rejetees: demandes.filter(d => (d.STATUT || d.statut) === 'Rejetee').length,
          annulees: demandes.filter(d => (d.STATUT || d.statut) === 'Annulée').length,
          montantTotal: demandes.reduce((sum, d) => sum + parseFloat(d.MONTANT_TOTAL || d.montant_total || 0), 0),
          tauxValidation: demandes.length > 0 ? 
            Math.round((demandes.filter(d => (d.STATUT || d.statut) === 'Validee' || (d.STATUT || d.statut) === 'Executee').length / demandes.length) * 100) : 0,
          montantMoyen: demandes.length > 0 ? 
            demandes.reduce((sum, d) => sum + parseFloat(d.MONTANT_TOTAL || d.montant_total || 0), 0) / demandes.length : 0,
          hospitalisations: hospitalisations.length
        };
        
        setDashboardData(prev => ({ ...prev, ...stats }));
        
        message.success('Tableau de bord actualisé');
      }
    } catch (error) {
      console.error('Erreur dashboard:', error);
      message.error('Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, []);
  
  const loadDemandes = useCallback(async () => {
    setLoading(prev => ({ ...prev, demandes: true }));
    try {
      const params = {
        page: 1,
        limit: 50,
        search: filtres.search,
        statut: filtres.statut !== 'tous' ? filtres.statut : undefined,
        type_prestation: filtres.type !== 'tous' ? filtres.type : undefined,
        priorite: filtres.priorite !== 'tous' ? filtres.priorite : undefined,
        date_debut: filtres.dateDebut ? filtres.dateDebut.format('YYYY-MM-DD') : undefined,
        date_fin: filtres.dateFin ? filtres.dateFin.format('YYYY-MM-DD') : undefined
      };
      
      const response = await prescriptionsAPI.getAll(params);
      
      if (response.success && response.prescriptions) {
        const formattedDemandes = response.prescriptions.map((d, index) => ({
          key: d.COD_PRES || d.id || `demande-${index}`,
          COD_PRES: d.COD_PRES || d.id,
          NUM_PRESCRIPTION: d.NUM_PRESCRIPTION || d.numero,
          NOM_BEN: d.NOM_BEN || d.nom_beneficiaire,
          PRE_BEN: d.PRE_BEN || d.prenom_beneficiaire,
          TYPE_PRESTATION: d.TYPE_PRESTATION || d.type_prestation,
          LIB_AFF: d.LIB_AFF || d.affection,
          COD_AFF: d.COD_AFF || d.code_affection,
          DATE_PRESCRIPTION: d.DATE_PRESCRIPTION || d.date_prescription,
          MONTANT_TOTAL: parseFloat(d.MONTANT_TOTAL || d.montant_total || 0),
          STATUT: d.STATUT || d.statut,
          IDENTIFIANT_NATIONAL: d.IDENTIFIANT_NATIONAL || d.identifiant_national,
          OBSERVATIONS: d.OBSERVATIONS || d.observations,
          details: d.details || [],
          COD_BEN: d.COD_BEN || d.beneficiaire_id,
          PRIORITE: d.PRIORITE || d.priorite || 'moyenne',
          plafond_chambre: d.plafond_chambre || d.plafondChambre,
          date_entree_patient: d.date_entree_patient || d.dateEntreePatient,
          DATE_VALIDATION: d.DATE_VALIDATION,
          DATE_REJET: d.DATE_REJET,
          MOTIF_REJET: d.MOTIF_REJET,
          date_debut_hospitalisation: d.date_debut_hospitalisation,
          date_fin_hospitalisation: d.date_fin_hospitalisation,
          duree_hospitalisation: d.duree_hospitalisation,
          URGENCE: d.URGENCE || false
        }));
        
        setDemandes(formattedDemandes);
        
        const stats = {
          total: formattedDemandes.length,
          enAttente: formattedDemandes.filter(d => d.STATUT === 'En attente').length,
          validees: formattedDemandes.filter(d => d.STATUT === 'Validee').length,
          executees: formattedDemandes.filter(d => d.STATUT === 'Executee').length,
          rejetees: formattedDemandes.filter(d => d.STATUT === 'Rejetee').length,
          annulees: formattedDemandes.filter(d => d.STATUT === 'Annulée').length,
          montantTotal: formattedDemandes.reduce((sum, d) => sum + (d.MONTANT_TOTAL || 0), 0),
          tauxValidation: formattedDemandes.length > 0 ? 
            Math.round((formattedDemandes.filter(d => d.STATUT === 'Validee' || d.STATUT === 'Executee').length / formattedDemandes.length) * 100) : 0,
          montantMoyen: formattedDemandes.length > 0 ? 
            formattedDemandes.reduce((sum, d) => sum + (d.MONTANT_TOTAL || 0), 0) / formattedDemandes.length : 0,
          hospitalisations: formattedDemandes.filter(d => d.TYPE_PRESTATION === 'Hospitalisation').length
        };
        
        setDashboardData(prev => ({ ...prev, ...stats }));
      } else {
        message.error(response.message || 'Erreur lors du chargement des demandes');
      }
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
      message.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(prev => ({ ...prev, demandes: false }));
    }
  }, [filtres]);
  
  const searchPatients = useCallback(async (searchTerm) => {
    if (searchTerm.length < 2) {
      setPatientResults([]);
      return;
    }
    
    setLoading(prev => ({ ...prev, patients: true }));
    try {
      const response = await beneficiairesAPI.searchAdvanced(searchTerm, {}, 10, 1);
      
      if (response.success && response.beneficiaires) {
        setPatientResults(response.beneficiaires);
      } else {
        setPatientResults([]);
      }
    } catch (error) {
      console.error('Erreur recherche patients:', error);
      setPatientResults([]);
    } finally {
      setLoading(prev => ({ ...prev, patients: false }));
    }
  }, []);
  
  const searchActes = useCallback(async (searchTerm) => {
    if (searchTerm.length < 2) {
      setActeResults([]);
      return;
    }
    
    setLoading(prev => ({ ...prev, actes: true }));
    try {
      const response = await consultationsAPI.searchMedicalItemsUnified(searchTerm, 'nomenclature');
      
      if (response.success && response.items) {
        setActeResults(response.items);
      } else if (response.medicaments) {
        setActeResults(response.medicaments);
      } else {
        setActeResults([]);
      }
    } catch (error) {
      console.error('Erreur recherche actes:', error);
      setActeResults([]);
    } finally {
      setLoading(prev => ({ ...prev, actes: false }));
    }
  }, []);
  
  // ==================== FONCTIONS POUR LES DEMANDES ====================
  
  const handleAddActe = useCallback((acte) => {
    const nouvelActe = {
      id: acte.id || acte.COD_MED || Date.now(),
      code: String(acte.code || acte.COD_MED || acte.COD_ELEMENT || `ACTE-${Date.now()}`),
      libelle: acte.libelle || acte.NOM_COMMERCIAL || 'Acte médical',
      libelle_complet: acte.libelle_complet || acte.libelle || '',
      quantite: 1,
      prixUnitaire: acte.prix || acte.PRIX_UNITAIRE || acte.PRIX || 0,
      remboursable: acte.REMBOURSABLE !== false && acte.REMBOURSABLE !== 0,
      tauxPriseEnCharge: acte.TAUX_PRISE_EN_CHARGE || 80,
      isManual: !acte.COD_MED && !acte.COD_ELEMENT
    };
    
    setNewDemande(prev => {
      const nouveauMontant = prev.MONTANT_TOTAL + (nouvelActe.quantite * nouvelActe.prixUnitaire);
      return {
        ...prev,
        actes: [...prev.actes, nouvelActe],
        MONTANT_TOTAL: nouveauMontant
      };
    });
    
    setActeResults([]);
    setSearchActeTerm('');
    message.success(`"${nouvelActe.libelle}" ajouté`);
  }, []);
  
  const handleAddManualActe = useCallback(() => {
    if (!manualActe.libelle || !manualActe.prixUnitaire) {
      message.error('Veuillez remplir le libellé et le prix unitaire');
      return;
    }
    
    const nouvelActe = {
      id: Date.now(),
      code: manualActe.code || `MANUEL-${Date.now()}`,
      libelle: manualActe.libelle,
      libelle_complet: manualActe.libelle_complet || manualActe.libelle,
      quantite: manualActe.quantite || 1,
      prixUnitaire: parseFloat(manualActe.prixUnitaire) || 0,
      remboursable: manualActe.remboursable,
      tauxPriseEnCharge: manualActe.tauxPriseEnCharge || 80,
      isManual: true
    };
    
    setNewDemande(prev => {
      const nouveauMontant = prev.MONTANT_TOTAL + (nouvelActe.quantite * nouvelActe.prixUnitaire);
      return {
        ...prev,
        actes: [...prev.actes, nouvelActe],
        MONTANT_TOTAL: nouveauMontant
      };
    });
    
    setManualActe({
      code: '',
      libelle: '',
      libelle_complet: '',
      quantite: 1,
      prixUnitaire: 0,
      remboursable: true,
      tauxPriseEnCharge: 80
    });
    setManualActeModalVisible(false);
    manualActeForm.resetFields();
    message.success('Acte manuel ajouté avec succès');
  }, [manualActe, manualActeForm]);
  
  const handleCreateHospitalisationAgreement = useCallback(() => {
    setNewDemande(prev => ({
      ...prev,
      COD_BEN: '',
      patientInfo: null,
      TYPE_PRESTATION: 'Hospitalisation',
      COD_AFF: '',
      codeAffectationInfo: null,
      OBSERVATIONS: '',
      hospitalisation: true,
      dateDebutHospitalisation: moment(),
      dateFinHospitalisation: moment().add(3, 'days'),
      dureeHospitalisation: 3,
      plafondChambre: 50000,
      dateEntreePatient: moment().format('YYYY-MM-DD'),
      actes: [],
      MONTANT_TOTAL: 0,
      tauxCouverture: 80,
      PRIORITE: 'haute',
      STATUT: 'En attente',
      URGENCE: false
    }));
    
    setCreationModalVisible(true);
    setCreationStep(0);
    setValidationErreurs({});
    
    message.info('Formulaire d\'accord d\'hospitalisation pré-rempli. Veuillez sélectionner un patient.');
  }, []);
  
  const handleCreateHospitalisationForBeneficiaire = useCallback((beneficiaire) => {
    setNewDemande(prev => ({
      ...prev,
      COD_BEN: beneficiaire.COD_BEN,
      patientInfo: {
        id: beneficiaire.id,
        COD_BEN: beneficiaire.COD_BEN,
        nom: beneficiaire.nom,
        prenom: beneficiaire.prenom,
        age: beneficiaire.age,
        identifiant: beneficiaire.identifiant,
        date_naissance: beneficiaire.date_naissance,
        telephone: beneficiaire.telephone,
        sexe: beneficiaire.sexe
      },
      TYPE_PRESTATION: 'Hospitalisation',
      COD_AFF: '',
      codeAffectationInfo: null,
      OBSERVATIONS: `Hospitalisation pour ${beneficiaire.nom} ${beneficiaire.prenom} - Plafond actuel: ${formatCurrency(beneficiaire.totalTransactions)} sur ${formatCurrency(beneficiaire.plafond)}`,
      hospitalisation: true,
      dateDebutHospitalisation: moment(),
      dateFinHospitalisation: moment().add(3, 'days'),
      dureeHospitalisation: 3,
      plafondChambre: beneficiaire.plafond,
      dateEntreePatient: moment().format('YYYY-MM-DD'),
      actes: [],
      MONTANT_TOTAL: 0,
      tauxCouverture: 80,
      PRIORITE: beneficiaire.plafondAtteint ? 'haute' : 'moyenne',
      STATUT: 'En attente',
      URGENCE: beneficiaire.plafondAtteint
    }));
    
    setCreationModalVisible(true);
    setCreationStep(0);
    setBeneficiairesModalVisible(false);
    setValidationErreurs({});
    
    message.info(`Formulaire d'accord d'hospitalisation pré-rempli pour ${beneficiaire.nom} ${beneficiaire.prenom}`);
  }, []);
  
  const checkAndAuthorizeHospitalization = useCallback((beneficiaire) => {
    if (beneficiaire.plafondAtteint) {
      Modal.confirm({
        title: (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8, fontSize: 20 }} />
            <span style={{ fontWeight: 'bold' }}>Autorisation Spéciale Requise</span>
          </div>
        ),
        content: (
          <div>
            <Alert
              message="ATTENTION - PLAFOND ATTEINT"
              description={`Le bénéficiaire ${beneficiaire.nom} ${beneficiaire.prenom} a atteint 100% de son plafond.`}
              type="warning"
              showIcon
              style={{ marginBottom: 16, borderRadius: 8 }}
              icon={<ExclamationCircleOutlined />}
            />
            <Card 
              size="small" 
              style={{ marginBottom: 16, backgroundColor: '#fff7e6', borderColor: '#ffd591' }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Total Dépensé"
                    value={beneficiaire.totalTransactions}
                    precision={0}
                    valueStyle={{ color: '#f5222d', fontWeight: 'bold' }}
                    suffix="FCFA"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Plafond Autorisé"
                    value={beneficiaire.plafond}
                    precision={0}
                    valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                    suffix="FCFA"
                  />
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
              <Progress
                percent={beneficiaire.pourcentageUtilisation}
                strokeColor={{
                  '0%': '#ff4d4f',
                  '100%': '#ff4d4f',
                }}
                size="small"
                format={(percent) => `Utilisation: ${percent.toFixed(1)}%`}
              />
            </Card>
            <Paragraph type="secondary">
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              Une autorisation spéciale est requise pour hospitaliser ce bénéficiaire. 
              Cette action sera enregistrée et soumise à validation hiérarchique.
            </Paragraph>
          </div>
        ),
        okText: 'Autoriser Hospitalisation',
        cancelText: 'Annuler',
        okType: 'primary',
        okButtonProps: {
          danger: true,
          size: 'large',
          style: { fontWeight: 'bold' }
        },
        cancelButtonProps: {
          size: 'large'
        },
        onOk: () => {
          handleCreateHospitalisationForBeneficiaire(beneficiaire);
          message.warning({
            content: `Hospitalisation autorisée pour ${beneficiaire.nom} ${beneficiaire.prenom}`,
            duration: 5,
            icon: <ExclamationCircleOutlined />
          });
        },
        width: 600,
        centered: true
      });
    } else {
      handleCreateHospitalisationForBeneficiaire(beneficiaire);
    }
  }, [handleCreateHospitalisationForBeneficiaire]);
  
  const handleSubmitDemande = useCallback(async () => {
    // Validation finale avant soumission
    let erreurs = {};
    let hasError = false;
    
    if (!newDemande.COD_BEN || !newDemande.patientInfo) {
      erreurs.patient = 'Le patient est obligatoire';
      hasError = true;
    }
    
    if (!newDemande.TYPE_PRESTATION || newDemande.TYPE_PRESTATION.trim() === '') {
      erreurs.typePrestation = 'Le type de prestation est obligatoire';
      hasError = true;
    }
    
    if (newDemande.TYPE_PRESTATION === 'Hospitalisation') {
      if (!newDemande.plafondChambre || newDemande.plafondChambre <= 0) {
        erreurs.plafondChambre = 'Le plafond chambre est obligatoire pour les hospitalisations';
        hasError = true;
      }
      if (!newDemande.dateEntreePatient) {
        erreurs.dateEntreePatient = 'La date d\'entrée est obligatoire';
        hasError = true;
      }
    }
    
    if (newDemande.actes.length === 0) {
      message.warning('Veuillez ajouter au moins un acte médical');
      setCreationStep(1);
      return;
    }
    
    if (hasError) {
      setValidationErreurs(erreurs);
      message.error('Veuillez corriger les erreurs avant de soumettre');
      setCreationStep(0);
      return;
    }
    
    setLoading(prev => ({ ...prev, creation: true }));
    try {
      const details = newDemande.actes.map(acte => {
        const codeElement = /^\d+$/.test(acte.code) ? `ACTE-${acte.code}` : acte.code;
        
        return {
          COD_ELEMENT: codeElement,
          LIBELLE: acte.libelle,
          QUANTITE: acte.quantite,
          PRIX_UNITAIRE: acte.prixUnitaire,
          MONTANT_TOTAL: acte.quantite * acte.prixUnitaire,
          REMBOURSABLE: acte.remboursable ? 1 : 0,
          TAUX_PRISE_EN_CHARGE: acte.tauxPriseEnCharge || 80,
          TYPE_ELEMENT: acte.type || 'ACTE'
        };
      });
      
      const userInfo = getUserInfo();
      
      const demandeData = {
        COD_BEN: newDemande.COD_BEN,
        TYPE_PRESTATION: newDemande.TYPE_PRESTATION,
        COD_AFF: newDemande.COD_AFF || 'NSP',
        OBSERVATIONS: newDemande.OBSERVATIONS || '',
        STATUT: 'En attente',
        PRIORITE: newDemande.PRIORITE,
        MONTANT_TOTAL: newDemande.MONTANT_TOTAL,
        details: details,
        ORIGINE: 'Electronique',
        PRESCRIPTEUR: userInfo.nomComplet,
        COD_CENTRE: userInfo.centreSanteId,
        COD_PRESTATAIRE: userInfo.prestataireId,
        URGENCE: newDemande.URGENCE || false
      };
      
      if (newDemande.TYPE_PRESTATION === 'Hospitalisation') {
        demandeData.plafond_chambre = newDemande.plafondChambre;
        demandeData.date_entree_patient = newDemande.dateEntreePatient;
        demandeData.date_debut_hospitalisation = newDemande.dateDebutHospitalisation ? 
          newDemande.dateDebutHospitalisation.format('YYYY-MM-DD') : null;
        demandeData.date_fin_hospitalisation = newDemande.dateFinHospitalisation ? 
          newDemande.dateFinHospitalisation.format('YYYY-MM-DD') : null;
        demandeData.duree_hospitalisation = newDemande.dureeHospitalisation;
      }
      
      const response = await prescriptionsAPI.create(demandeData);
      
      if (response.success) {
        message.success({
          content: `Demande créée avec succès - N°: ${response.numero || response.COD_PRES}`,
          duration: 5,
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        });
        setCreationModalVisible(false);
        setNewDemande({
          COD_BEN: '',
          patientInfo: null,
          TYPE_PRESTATION: '',
          COD_AFF: '',
          codeAffectationInfo: null,
          OBSERVATIONS: '',
          hospitalisation: false,
          dateDebutHospitalisation: null,
          dateFinHospitalisation: null,
          dureeHospitalisation: null,
          plafondChambre: 50000,
          dateEntreePatient: moment().format('YYYY-MM-DD'),
          actes: [],
          MONTANT_TOTAL: 0,
          tauxCouverture: 80,
          PRIORITE: 'moyenne',
          STATUT: 'En attente',
          URGENCE: false
        });
        setCreationStep(0);
        setValidationErreurs({});
        loadDemandes();
        loadDashboardData();
        loadBeneficiaires();
      } else {
        message.error(response.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création demande:', error);
      message.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, creation: false }));
    }
  }, [newDemande, getUserInfo, loadDemandes, loadDashboardData, loadBeneficiaires]);
  
  const handleValiderDemande = useCallback(async (demande) => {
    setLoading(prev => ({ ...prev, validation: true }));
    try {
      const userInfo = getUserInfo();
      const response = await prescriptionsAPI.updateStatus(demande.COD_PRES, {
        statut: 'Validee',
        motif: 'Validé par l\'administrateur',
        VALIDATEUR: userInfo.nomComplet,
        DATE_VALIDATION: moment().format('YYYY-MM-DD HH:mm:ss')
      });
      
      if (response.success) {
        message.success({
          content: 'Demande validée avec succès',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        });
        setActionModalVisible(false);
        loadDemandes();
        loadDashboardData();
      } else {
        message.error(response.message || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur validation demande:', error);
      message.error('Erreur lors de la validation');
    } finally {
      setLoading(prev => ({ ...prev, validation: false }));
    }
  }, [getUserInfo, loadDemandes, loadDashboardData]);
  
  const handleRejeterDemande = useCallback(async (demande, motif) => {
    setLoading(prev => ({ ...prev, validation: true }));
    try {
      const userInfo = getUserInfo();
      const response = await prescriptionsAPI.updateStatus(demande.COD_PRES, {
        statut: 'Rejetee',
        motif: motif,
        REJETEUR: userInfo.nomComplet,
        DATE_REJET: moment().format('YYYY-MM-DD HH:mm:ss')
      });
      
      if (response.success) {
        message.success('Demande rejetée avec succès');
        setActionModalVisible(false);
        actionForm.resetFields();
        loadDemandes();
        loadDashboardData();
      } else {
        message.error(response.message || 'Erreur lors du rejet');
      }
    } catch (error) {
      console.error('Erreur rejet demande:', error);
      message.error('Erreur lors du rejet');
    } finally {
      setLoading(prev => ({ ...prev, validation: false }));
    }
  }, [getUserInfo, loadDemandes, loadDashboardData, actionForm]);
  

  // ==================== FONCTIONS PDF ULTRA LISIBLES ET PROFESSIONNELLES ====================

// Fonction utilitaire pour charger et convertir le logo en base64
const chargerLogoBase64 = useCallback(async () => {
  try {
    // Chemin relatif du logo
    const logoPath = '../../assets/AMS-logo.png';
    
    // Essayer différentes méthodes pour charger le logo
    try {
      // Méthode 1: Via fetch si le chemin est accessible
      const response = await fetch(logoPath);
      if (response.ok) {
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.log('Logo non chargé via fetch, tentative alternative...');
    }
    
    // Méthode 2: Logo par défaut base64 (simple et propre)
    const logoDefault = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgMTUwIDUwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjUwIiByeD0iNCIgZmlsbD0iIzJDM0U1MCIvPgo8dGV4dCB4PSI3NSIgeT0iMjgiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSI2MDAiIGZpbGw9IiNGRkZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFNUyBNRURJQ0FMPC90ZXh0Pgo8dGV4dCB4PSI3NSIgeT0iNDAiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EiIGZvbnQtc2l6ZT0iOSIgZmlsbD0iI0NEQ0RDRCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3lzdMOobWVzIGRlIFNhbnTDqTwvdGV4dD4KPC9zdmc+";
    return logoDefault;
    
  } catch (error) {
    console.error('Erreur chargement logo:', error);
    return null;
  }
}, []);

// Fonction pour générer une fiche d'accord préalable ultra lisible
const genererFicheAccord = useCallback(async (demande) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Palette de couleurs professionnelle et lisible
    const colors = {
      primary: '#2C5282',      // Bleu foncé professionnel
      secondary: '#3182CE',    // Bleu moyen
      accent: '#E53E3E',       // Rouge pour les alertes
      success: '#38A169',      // Vert succès
      warning: '#D69E2E',      // Jaune/Orange
      light: '#F7FAFC',        // Gris très clair
      medium: '#A0AEC0',       // Gris moyen
      dark: '#2D3748',         // Gris foncé (texte)
      border: '#E2E8F0'        // Gris bordure
    };
    
    // Marges généreuses pour la lisibilité
    const margin = {
      left: 15,
      right: 15,
      top: 15,
      bottom: 20
    };
    
    let y = margin.top;
    
    // === EN-TÊTE CLAIR ET PROFESSIONNEL ===
    // Ligne supérieure de séparation
    doc.setFillColor(colors.primary);
    doc.rect(0, 0, pageWidth, 4, 'F');
    
    y += 5;
    
    try {
      // Charger et afficher le logo
      const logoBase64 = await chargerLogoBase64();
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', margin.left, y, 40, 15);
      }
    } catch (error) {
      // Texte alternatif si logo non disponible
      doc.setTextColor(colors.primary);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('AMS MEDICAL SYSTEMS', margin.left, y + 8);
    }
    
    // Informations de référence à droite
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.medium);
    doc.text('Document officiel', pageWidth - margin.right, y + 5, { align: 'right' });
    doc.text(`N° ${demande.NUM_PRESCRIPTION || 'N/A'}`, pageWidth - margin.right, y + 10, { align: 'right' });
    
    y += 25;
    
    // Titre principal avec barre d'accent
    doc.setFillColor(colors.secondary);
    doc.rect(margin.left, y, 5, 20, 'F');
    
    doc.setTextColor(colors.primary);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ACCORD PRÉALABLE', margin.left + 10, y + 12);
    
    doc.setTextColor(colors.medium);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Autorisation de prise en charge médicale', margin.left + 10, y + 18);
    
    y += 30;
    
    // Date et validité
    doc.setFontSize(9);
    doc.setTextColor(colors.medium);
    doc.text(`Date d'émission: ${moment(demande.DATE_PRESCRIPTION).format('DD/MM/YYYY')}`, margin.left, y);
    doc.text('Validité: 30 jours', pageWidth - margin.right, y, { align: 'right' });
    
    y += 15;
    
    // Ligne de séparation légère
    doc.setDrawColor(colors.border);
    doc.setLineWidth(0.5);
    doc.line(margin.left, y, pageWidth - margin.right, y);
    
    y += 10;
    
    // === SECTION 1: BÉNÉFICIAIRE (Mise en page en colonnes) ===
    doc.setTextColor(colors.primary);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. INFORMATIONS DU BÉNÉFICIAIRE', margin.left, y);
    
    y += 10;
    
    // Carte d'information avec fond léger
    doc.setFillColor(colors.light);
    doc.roundedRect(margin.left, y, pageWidth - 30, 35, 3, 3, 'F');
    doc.setDrawColor(colors.border);
    doc.roundedRect(margin.left, y, pageWidth - 30, 35, 3, 3);
    
    // Colonne gauche
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.dark);
    doc.text('Identité:', margin.left + 10, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${demande.NOM_BEN || ''} ${demande.PRE_BEN || ''}`.trim(), margin.left + 30, y + 10);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Identifiant:', margin.left + 10, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(demande.IDENTIFIANT_NATIONAL || 'Non renseigné', margin.left + 30, y + 18);
    
    // Colonne droite
    doc.setFont('helvetica', 'bold');
    doc.text('Date de naissance:', pageWidth / 2, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(demande.date_naissance ? moment(demande.date_naissance).format('DD/MM/YYYY') : 'N/A', pageWidth / 2 + 40, y + 10);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Âge:', pageWidth / 2, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(demande.date_naissance ? `${calculateAge(demande.date_naissance)} ans` : 'N/A', pageWidth / 2 + 40, y + 18);
    
    y += 45;
    
    // === SECTION 2: PRESCRIPTION MÉDICALE ===
    doc.setTextColor(colors.primary);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. PRESCRIPTION MÉDICALE', margin.left, y);
    
    y += 10;
    
    // Tableau simple et lisible
    const prescriptionData = [
      ['Type de prestation', demande.TYPE_PRESTATION || 'Non spécifié'],
      ['Affection diagnostiquée', demande.LIB_AFF || 'Non spécifiée'],
      ['Code CIM', demande.COD_AFF || 'NSP'],
      ['Priorité médicale', demande.PRIORITE ? demande.PRIORITE.charAt(0).toUpperCase() + demande.PRIORITE.slice(1) : 'Moyenne']
    ];
    
    prescriptionData.forEach((row, index) => {
      const rowY = y + (index * 9);
      
      // Ligne alternée pour meilleure lisibilité
      if (index % 2 === 0) {
        doc.setFillColor(colors.light);
        doc.rect(margin.left, rowY - 3, pageWidth - 30, 9, 'F');
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.dark);
      doc.text(row[0] + ':', margin.left + 10, rowY);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.primary);
      doc.text(row[1], margin.left + 60, rowY);
    });
    
    y += prescriptionData.length * 9 + 5;
    
    // === SECTION 3: ÉLÉMENTS FINANCIERS ===
    doc.setTextColor(colors.primary);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. ASPECTS FINANCIERS', margin.left, y);
    
    y += 10;
    
    const montantTotal = parseFloat(demande.MONTANT_TOTAL) || 0;
    const tauxCouverture = 80;
    const montantRemboursable = montantTotal * (tauxCouverture / 100);
    const resteCharge = montantTotal - montantRemboursable;
    
    // Tableau financier avec totaux mis en évidence
    const financialData = [
      ['Estimation totale', formatCurrency(montantTotal), true],
      ['Taux de couverture', `${tauxCouverture}%`, false],
      ['Montant remboursable', formatCurrency(montantRemboursable), true],
      ['Reste à charge', formatCurrency(resteCharge), false]
    ];
    
    // En-tête du tableau
    doc.setFillColor(colors.primary);
    doc.rect(margin.left, y, pageWidth - 30, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin.left + 10, y + 6);
    doc.text('Montant', pageWidth - margin.right - 10, y + 6, { align: 'right' });
    
    y += 10;
    
    // Corps du tableau
    financialData.forEach((row, index) => {
      const rowY = y + (index * 8);
      
      // Alternance de couleurs
      if (index % 2 === 0) {
        doc.setFillColor(colors.light);
        doc.rect(margin.left, rowY - 2, pageWidth - 30, 8, 'F');
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', row[2] ? 'bold' : 'normal');
      doc.setTextColor(colors.dark);
      doc.text(row[0], margin.left + 10, rowY + 5);
      
      doc.setTextColor(row[2] ? colors.primary : colors.dark);
      doc.text(row[1], pageWidth - margin.right - 10, rowY + 5, { align: 'right' });
    });
    
    y += financialData.length * 8 + 15;
    
    // === SECTION 4: DÉTAIL DES ACTES (si disponible) ===
    if (demande.details && demande.details.length > 0 && y < 180) {
      doc.setTextColor(colors.primary);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('4. DÉTAIL DES ACTES MÉDICAUX', margin.left, y);
      
      y += 10;
      
      // En-tête du tableau des actes
      const headers = ['#', 'Code', 'Libellé', 'Qté', 'Prix unit.', 'Total'];
      const colWidths = [10, 25, 80, 15, 30, 30];
      
      // En-tête
      doc.setFillColor(colors.secondary);
      doc.rect(margin.left, y, pageWidth - 30, 8, 'F');
      
      let xPos = margin.left + 5;
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      
      headers.forEach((header, index) => {
        const align = index === 5 ? 'right' : (index === 0 || index === 3) ? 'center' : 'left';
        doc.text(header, xPos + (colWidths[index] / 2), y + 6, { align: align });
        xPos += colWidths[index];
      });
      
      y += 10;
      
      // Données des actes
      demande.details.forEach((acte, index) => {
        if (y > 240) return; // Éviter le débordement
        
        // Alternance de couleur des lignes
        if (index % 2 === 0) {
          doc.setFillColor(colors.light);
          doc.rect(margin.left, y - 2, pageWidth - 30, 8, 'F');
        }
        
        const rowData = [
          (index + 1).toString(),
          acte.COD_ELEMENT || acte.code || 'N/A',
          (acte.LIBELLE || acte.libelle || '').substring(0, 35),
          (acte.QUANTITE || acte.quantite || 1).toString(),
          formatCurrency(acte.PRIX_UNITAIRE || acte.prixUnitaire || 0),
          formatCurrency(acte.MONTANT_TOTAL || (acte.quantite * acte.prixUnitaire) || 0)
        ];
        
        xPos = margin.left + 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.dark);
        
        rowData.forEach((data, dataIndex) => {
          const align = dataIndex === 5 ? 'right' : (dataIndex === 0 || dataIndex === 3) ? 'center' : 'left';
          doc.text(data, xPos + (colWidths[dataIndex] / 2), y + 6, { align: align });
          xPos += colWidths[dataIndex];
        });
        
        y += 8;
      });
      
      y += 10;
    }
    
    // === SECTION 5: STATUT ET VALIDATION ===
    const statusY = Math.max(y, 200);
    
    doc.setFillColor(colors.light);
    doc.roundedRect(margin.left, statusY, pageWidth - 30, 25, 3, 3, 'F');
    doc.setDrawColor(colors.border);
    doc.roundedRect(margin.left, statusY, pageWidth - 30, 25, 3, 3);
    
    // Badge de statut
    let statusColor, statusText;
    switch(demande.STATUT) {
      case 'Validee':
        statusColor = colors.success;
        statusText = 'VALIDÉ';
        break;
      case 'En attente':
        statusColor = colors.warning;
        statusText = 'EN ATTENTE';
        break;
      case 'Rejetee':
        statusColor = colors.accent;
        statusText = 'REJETÉ';
        break;
      default:
        statusColor = colors.medium;
        statusText = demande.STATUT || 'N/A';
    }
    
    // Icône de statut
    doc.setFillColor(statusColor);
    doc.circle(margin.left + 15, statusY + 13, 5, 'F');
    
    doc.setTextColor(statusColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, margin.left + 25, statusY + 15);
    
    // Informations de validation
    if (demande.DATE_VALIDATION) {
      doc.setTextColor(colors.medium);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Validé le ${moment(demande.DATE_VALIDATION).format('DD/MM/YYYY à HH:mm')}`, 
               pageWidth - margin.right - 10, statusY + 15, { align: 'right' });
    }
    
    // === PIED DE PAGE ULTRA LISIBLE ===
    const footerY = 280;
    
    // Ligne de séparation fine
    doc.setDrawColor(colors.border);
    doc.setLineWidth(0.3);
    doc.line(margin.left, footerY, pageWidth - margin.right, footerY);
    
    // Informations de pied de page
    doc.setTextColor(colors.medium);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    const footerLines = [
      'Document généré électroniquement par AMS Medical Systems',
      `Généré le ${moment().format('DD/MM/YYYY à HH:mm')} - Ref: ${demande.NUM_PRESCRIPTION}`,
      'Ce document fait foi pour toute prestation médicale'
    ];
    
    footerLines.forEach((line, index) => {
      doc.text(line, pageWidth / 2, footerY + 5 + (index * 4), { align: 'center' });
    });
    
    // Numéro de page discret
    doc.text('1/1', pageWidth - margin.right, 295, { align: 'right' });
    
    // === SAUVEGARDE ===
    doc.save(`Accord_Préalable_${demande.NUM_PRESCRIPTION}.pdf`);
    
    message.success({
      content: 'Fiche d\'accord générée avec succès',
      icon: <FileDoneOutlined style={{ color: colors.success }} />,
      duration: 3
    });
    
  } catch (error) {
    console.error('Erreur génération fiche accord:', error);
    message.error('Erreur lors de la génération du document');
  }
}, [chargerLogoBase64]);


// Fonction pour générer une fiche d'hospitalisation professionnelle et lisible
const genererFicheHospitalisation = useCallback(async (demande) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Palette de couleurs professionnelle médicale
    const colors = {
      primary: '#0056B3',
      secondary: '#2E8B57',
      accent: '#DC3545',
      light: '#F8F9FA',
      medium: '#6C757D',
      dark: '#212529',
      border: '#DEE2E6',
      highlight: '#E3F2FD',
      watermark: 'rgba(0, 86, 179, 0.05)'  // Bleu très transparent pour filigrane
    };
    
    // Grille de mise en page compacte
    const margin = {
      left: 15,
      right: 15,
      top: 12,
      bottom: 15
    };
    
    // Configuration par défaut
    doc.setFont('helvetica');
    doc.setLineWidth(0.5);
    
    let currentY = margin.top;
    
    // === FILIGRANE EN ARRIÈRE-PLAN ===
    doc.setTextColor(colors.watermark);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.text('AMS', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
    doc.setFontSize(40);
    doc.text('MEDICAL', pageWidth / 2, pageHeight / 2 + 30, { align: 'center', angle: 45 });
    
    // Réinitialiser la couleur
    doc.setTextColor(colors.dark);
    
    // === EN-TÊTE COMPACT ===
    
    // Logo compact
    const logoWidth = 30;
    const logoHeight = 10;
    
    try {
      const chargerLogoBase64 = async () => {
        try {
          const logoFallback = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANzSURBVHic7d0xbtNQHMbx/9NMllXCCpN3wWQ4Bwi3aEC5QMvWCyDQjlhYIY3gJhwBHoEtY2WJEDG16deBhqYU1z8n78//Jxm9iC+vktjOd+57fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKX6/u3r3evr69vdbndnd5v+vx9PM5fmQbd5e3py8rSqqu9ZR0Uj2+12f7fb/W3//f7Hj9cSs9l8fns+n9+2bXsiabW46++SVtvNZvN5u91+lnQl6ar9P/75Zy0xEclPrq6ujg6Hw+FwNnsi6UzSaaZZDbVv2/bZfD7/fnt6+t5SVb5tXcv5fD6x/dH2q+HRlmN1a/slSQtJa7ujb2eQNLH91va5pKmkm1GXDflG0s+6rleSjmQv5c/JpJvW9gfbr209l7QYcVcdI2lj+6y1fc/2wvhQ8EWWfqE2tt+0tp9KepV5VhOtbe9bv2ttl7lHx5CWtte2/1myTivjQ8GBpJ3tV9b40tJHUkvbE9s/LPGR51DSpSW/sPSVpKXtqe23XfxFy8u7Y5Xkp9Z3C5aK2sJ3SN1DZ/lrd4yS/NzSLyRNLf1R5gF9JG1sH1v4FddlPJZ0ZWlp6Q/KD+ijT48yS/KeJU/y51wXyVcyh+Q7lk6ZffkZ2EeWTiz5G2adfQYY2UeSDiX5leUT5hd5ZhJ5RhB55hz5RhB55hz5RhB55hz5RiZpYeE0PjeRZzJ5fkxO8pFMnvkkH8nkWVHyX5L5JL8qyz4yH8lfl6S1hX2Q/EW7/y+u2iL5i3Z/5FlV8lclyUfylyXJ5/rD6ZL8dUnyufZw2iR/2+7/nK62SP6u3f95XaWR/E27/3O82iL5hyUf0mCR/GNJh7ZF8q8kHdoWyb+VdGi7r/O4/L99S3/uX5XrqZJ0y7fZ/jTkf/7yH9GQ5CF1j6JJPqTJWeRb22tLv2Pp6M6z+b1yru0nkn7a/mvpxPIp9D1/M2F5ex9LurD9S9JTS6fQfvDmR/K5pX2SfCz5wvL3c5DvQZL/LB3fL8dTTc/Zfmbpr6Vjy0fQ/v6Y5DdL99/n3x7Z6t8eWXf0c7ZvLZ8y+zK+r+Se5HPLn+f/8d9J/rR0xOzL+b4Td0jeWDi26yE33R+0Sf6wdL7vxH2sLe8sHdH1lJvuF2FIPrV05t5J7klevLkmmr/Kd5+RJX9Imlt6dH03FpIXbq7Jr/LeJ8lH0r9vNp/9tUfykfT/32w+qD0UO/v/yt9c8xcum/5R9Nlcj6JHh+TjaPK1w2l8biLPFCLPHCLPJCJPgcgzq8gzj8gzscgzpsizvMjzwYBcD5qDPMuLPEuLPCUiz2QiT4nIM6HIs4jIcySRZ36R55giz9FEnoOKPMuIPMOKPCuMPCEizwojzzQiz5Qiz5Qiz5Qiz5Qiz3VHnt1EnqVEnr1AnvlEnl1Fng9G5JlP5Nlp5PnIRJ7ZRJ55RJ5dRZ4TiDzziDzzijwHEHnmHfnGJfnLI//Ic6EkeUnk/wO9W6rc25eASgAAAABJRU5ErkJggg==";
          return logoFallback;
        } catch (error) {
          return null;
        }
      };
      
      const logoBase64 = await chargerLogoBase64();
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', margin.left, currentY, logoWidth, logoHeight);
      }
    } catch (error) {
      console.log("Logo non disponible");
    }
    
    // Titre principal compact
    doc.setTextColor(colors.primary);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AUTORISATION D\'HOSPITALISATION', pageWidth / 2, currentY + 8, { align: 'center' });
    
    // Informations de référence compactes
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.medium);
    
    const refText = `Réf: ${demande.NUM_PRESCRIPTION || 'N/A'} | ${moment(demande.DATE_PRESCRIPTION).format('DD/MM/YY')}`;
    doc.text(refText, pageWidth - margin.right, currentY + 4, { align: 'right' });
    
    currentY += 15;
    
    // Ligne de séparation fine
    doc.setDrawColor(colors.border);
    doc.setLineWidth(0.3);
    doc.line(margin.left, currentY, pageWidth - margin.right, currentY);
    
    currentY += 8;
    
    // === SECTION COMBINÉE : PATIENT + DIAGNOSTIC ===
    
    // Deux colonnes côte à côte
    const columnWidth = (pageWidth - margin.left - margin.right - 10) / 2;
    
    // Colonne gauche - Patient
    doc.setTextColor(colors.primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT', margin.left, currentY);
    
    currentY += 5;
    
    // Fonctions utilitaires compactes
    const calculateAge = (birthdate) => {
      if (!birthdate) return 0;
      const birth = moment(birthdate);
      const today = moment();
      return today.diff(birth, 'years');
    };
    
    const patientInfo = [
      { label: 'Nom/Prénom:', value: `${demande.NOM_BEN || ''} ${demande.PRE_BEN || ''}`.trim() || 'Non renseigné' },
      { label: 'ID:', value: demande.IDENTIFIANT_NATIONAL || 'N/A' },
      { label: 'Naissance:', value: demande.date_naissance ? 
        `${moment(demande.date_naissance).format('DD/MM/YY')} (${calculateAge(demande.date_naissance)} ans)` : 'N/A' },
      { label: 'Sexe:', value: demande.sexe || 'Non renseigné' }
    ];
    
    patientInfo.forEach((item, index) => {
      const rowY = currentY + (index * 5);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.medium);
      doc.text(item.label, margin.left, rowY);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.dark);
      
      const valueX = margin.left + 25;
      const maxWidth = columnWidth - 30;
      
      if (item.value && doc.getStringUnitWidth(item.value) * 9 / doc.internal.scaleFactor > maxWidth) {
        const truncated = doc.splitTextToSize(item.value, maxWidth);
        doc.text(truncated[0], valueX, rowY);
      } else {
        doc.text(item.value, valueX, rowY);
      }
    });
    
    // Colonne droite - Diagnostic
    const rightColumnX = margin.left + columnWidth + 10;
    
    doc.setTextColor(colors.primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DIAGNOSTIC', rightColumnX, currentY - 5);
    
    currentY -= 5; // Réaligner avec colonne gauche
    
    const diagnosticInfo = [
      { label: 'Affection:', value: demande.LIB_AFF || 'Non spécifiée' },
      { label: 'Code CIM:', value: demande.COD_AFF || 'NSP' },
      { label: 'Type:', value: demande.TYPE_PRESTATION || 'Hospitalisation' },
      { label: 'Priorité:', value: demande.PRIORITE ? 
        demande.PRIORITE.charAt(0).toUpperCase() + demande.PRIORITE.slice(1) : 'Moyenne' }
    ];
    
    diagnosticInfo.forEach((item, index) => {
      const rowY = currentY + (index * 5);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.medium);
      doc.text(item.label, rightColumnX, rowY);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.dark);
      
      // Mettre en évidence l'affection principale
      if (item.label === 'Affection:') {
        doc.setTextColor(colors.primary);
        doc.setFont('helvetica', 'bold');
      }
      
      const valueX = rightColumnX + 20;
      const maxWidth = columnWidth - 25;
      
      if (item.value && doc.getStringUnitWidth(item.value) * 9 / doc.internal.scaleFactor > maxWidth) {
        const truncated = doc.splitTextToSize(item.value, maxWidth);
        doc.text(truncated[0], valueX, rowY);
      } else {
        doc.text(item.value, valueX, rowY);
      }
      
      // Réinitialiser
      doc.setTextColor(colors.dark);
      doc.setFont('helvetica', 'normal');
    });
    
    currentY += Math.max(patientInfo.length, diagnosticInfo.length) * 5 + 10;
    
    // === SECTION PÉRIODE D'HOSPITALISATION COMPACTE ===
    
    doc.setTextColor(colors.primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PÉRIODE', margin.left, currentY);
    
    currentY += 6;
    
    const startDate = demande.date_debut_hospitalisation ? moment(demande.date_debut_hospitalisation) : moment();
    const endDate = demande.date_fin_hospitalisation ? moment(demande.date_fin_hospitalisation) : moment().add(3, 'days');
    const duration = demande.duree_hospitalisation || endDate.diff(startDate, 'days');
    
    // Timeline compacte
    const timelineWidth = pageWidth - margin.left - margin.right - 30;
    const timelineStart = margin.left + 15;
    const timelineY = currentY + 3;
    
    // Ligne de timeline
    doc.setDrawColor(colors.primary);
    doc.setLineWidth(1.5);
    doc.line(timelineStart, timelineY, timelineStart + timelineWidth, timelineY);
    
    // Marqueurs
    doc.setFillColor(colors.primary);
    doc.circle(timelineStart, timelineY, 2.5, 'F');
    
    doc.setFillColor(colors.secondary);
    doc.circle(timelineStart + timelineWidth, timelineY, 2.5, 'F');
    
    // Dates
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary);
    doc.text('ADMISSION', timelineStart, timelineY - 4, { align: 'center' });
    
    doc.setTextColor(colors.secondary);
    doc.text('SORTIE', timelineStart + timelineWidth, timelineY - 4, { align: 'center' });
    
    // Dates précises
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.medium);
    doc.text(startDate.format('DD/MM'), timelineStart, timelineY + 7, { align: 'center' });
    doc.text(endDate.format('DD/MM'), timelineStart + timelineWidth, timelineY + 7, { align: 'center' });
    
    // Durée au centre
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.dark);
    doc.text(`${duration} jours`, timelineStart + (timelineWidth / 2), timelineY + 3, { align: 'center' });
    
    currentY += 20;
    
    // === SECTION ASPECTS FINANCIERS COMPACTE ===
    
    doc.setTextColor(colors.primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCES', margin.left, currentY);
    
    currentY += 6;
    
    const montantTotal = parseFloat(demande.MONTANT_TOTAL) || 0;
    const plafondChambre = demande.plafond_chambre || 50000;
    const montantRemboursable = montantTotal * 0.8;
    const resteCharge = montantTotal - montantRemboursable;
    
    const formatCurrency = (amount) => {
      if (!amount) return '0 €';
      return `${parseFloat(amount).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`;
    };
    
    // Tableau financier compact
    const financialData = [
      ['Plafond chambre', formatCurrency(plafondChambre)],
      ['Total estimation', formatCurrency(montantTotal)],
      ['Couverture (80%)', formatCurrency(montantRemboursable)],
      ['Reste à charge', formatCurrency(resteCharge)]
    ];
    
    financialData.forEach((row, index) => {
      const rowY = currentY + (index * 6);
      
      // Alternance de couleur
      if (index % 2 === 0) {
        doc.setFillColor(colors.light);
        doc.rect(margin.left, rowY - 3, pageWidth - margin.left - margin.right, 6, 'F');
      }
      
      // Description
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.dark);
      doc.text(row[0], margin.left + 5, rowY + 2);
      
      // Montant
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(row[0].includes('Reste') ? colors.accent : colors.primary);
      doc.text(row[1], pageWidth - margin.right - 5, rowY + 2, { align: 'right' });
    });
    
    currentY += financialData.length * 6 + 8;
    
    // === SECTION STATUT ET URGENCE COMBINÉE ===
    
    const statusSectionY = currentY;
    const statusSectionHeight = 15;
    
    // Fond selon statut
    let statusColor, statusText;
    switch(demande.STATUT) {
      case 'Validee':
        statusColor = colors.secondary;
        statusText = '✓ AUTORISATION VALIDÉE';
        break;
      case 'En attente':
        statusColor = '#FFC107';
        statusText = '⏳ EN ATTENTE';
        break;
      case 'Rejetee':
        statusColor = colors.accent;
        statusText = '✗ AUTORISATION REFUSÉE';
        break;
      default:
        statusColor = colors.medium;
        statusText = demande.STATUT || 'STATUT INDÉTERMINÉ';
    }
    
    // Ajouter indication urgence si nécessaire
    if (demande.URGENCE) {
      statusText += ' | URGENT';
      statusColor = colors.accent;
    }
    
    // Cadre de statut
    doc.setFillColor(statusColor + '20'); // Version transparente
    doc.rect(margin.left, statusSectionY, pageWidth - margin.left - margin.right, statusSectionHeight, 'F');
    
    doc.setDrawColor(statusColor);
    doc.setLineWidth(0.5);
    doc.rect(margin.left, statusSectionY, pageWidth - margin.left - margin.right, statusSectionHeight);
    
    // Texte de statut
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(statusColor);
    doc.text(statusText, pageWidth / 2, statusSectionY + 9, { align: 'center' });
    
    // Date de validation si disponible
    if (demande.DATE_VALIDATION) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.medium);
      doc.text(`Validé le: ${moment(demande.DATE_VALIDATION).format('DD/MM/YY HH:mm')}`, 
               pageWidth - margin.right - 5, statusSectionY + 13, { align: 'right' });
    }
    
    currentY += statusSectionHeight + 8;
    
    // === NOTES ET INFORMATIONS COMPLÉMENTAIRES ===
    
    if (currentY < pageHeight - margin.bottom - 15) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.medium);
      
      const notes = [
        'Document officiel d\'autorisation d\'hospitalisation',
        'Valable 30 jours | AMS Medical Systems',
        `Généré le ${moment().format('DD/MM/YYYY HH:mm')}`
      ];
      
      notes.forEach((note, index) => {
        doc.text(note, margin.left, currentY + (index * 3.5));
      });
    }
    
    // === LIGNES DE SIGNATURES COMPACTES ===
    
    if (currentY < pageHeight - margin.bottom - 25) {
      const signatureY = pageHeight - margin.bottom - 20;
      
      doc.setDrawColor(colors.border);
      doc.setLineWidth(0.3);
      
      // Ligne médecin
      doc.line(margin.left, signatureY, margin.left + 60, signatureY);
      doc.setFontSize(7);
      doc.setTextColor(colors.medium);
      doc.text('Médecin prescripteur', margin.left, signatureY - 2);
      
      // Ligne administration
      doc.line(pageWidth - margin.right - 60, signatureY, pageWidth - margin.right, signatureY);
      doc.text('Service hospitalisation', pageWidth - margin.right - 60, signatureY - 2);
    }
    
    // === BARRE CODE QR (OPTIONNEL) ===
    
    if (currentY < pageHeight - margin.bottom - 40) {
      const qrSize = 20;
      const qrX = pageWidth / 2 - qrSize / 2;
      const qrY = pageHeight - margin.bottom - 40;
      
      // Simuler un QR code avec un carré stylisé
      doc.setFillColor(colors.primary);
      doc.rect(qrX, qrY, qrSize, qrSize, 'F');
      
      doc.setFillColor(colors.light);
      doc.rect(qrX + 2, qrY + 2, qrSize - 4, qrSize - 4, 'F');
      
      doc.setFontSize(6);
      doc.setTextColor(colors.primary);
      doc.text('CODE', qrX + qrSize / 2, qrY + qrSize / 2 - 2, { align: 'center' });
      doc.text('AMS', qrX + qrSize / 2, qrY + qrSize / 2 + 2, { align: 'center' });
      
      doc.setFontSize(5);
      doc.setTextColor(colors.medium);
      doc.text('Scan pour vérification', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
    }
    
    // === SAUVEGARDE ===
    const fileName = `Auth-Hosp_${demande.NUM_PRESCRIPTION || 'REF'}_${moment().format('DDMMYY')}.pdf`;
    doc.save(fileName);
    
    message.success({
      content: 'Fiche d\'hospitalisation générée',
      duration: 2,
      style: { marginTop: '50vh' }
    });
    
  } catch (error) {
    console.error('Erreur génération fiche:', error);
    message.error('Erreur lors de la génération');
  }
}, []);

// Fonction simplifiée pour exporter la liste en PDF
const exporterListeAccords = useCallback((listeDemandes) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // En-tête
    doc.setFillColor(0, 82, 150);
    doc.rect(0, 0, pageWidth, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('LISTE DES ACCORDS PRÉALABLES', pageWidth / 2, 12, { align: 'center' });
    
    // Informations de génération
    doc.setFontSize(9);
    doc.text(`Généré le ${moment().format('DD/MM/YYYY à HH:mm')}`, pageWidth / 2, 18, { align: 'center' });
    
    // Statistiques
    const stats = {
      total: listeDemandes.length,
      enAttente: listeDemandes.filter(d => d.STATUT === 'En attente').length,
      validees: listeDemandes.filter(d => d.STATUT === 'Validee').length,
      rejetees: listeDemandes.filter(d => d.STATUT === 'Rejetee').length,
      montantTotal: listeDemandes.reduce((sum, d) => sum + (d.MONTANT_TOTAL || 0), 0)
    };
    
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Total: ${stats.total} demandes | En attente: ${stats.enAttente} | Validées: ${stats.validees} | Rejetées: ${stats.rejetees}`, 20, 28);
    doc.text(`Montant total: ${formatCurrency(stats.montantTotal)}`, 20, 33);
    
    // Tableau des demandes
    const tableData = listeDemandes.map((demande, index) => [
      index + 1,
      demande.NUM_PRESCRIPTION,
      `${demande.NOM_BEN} ${demande.PRE_BEN}`.substring(0, 25),
      demande.TYPE_PRESTATION.substring(0, 15),
      moment(demande.DATE_PRESCRIPTION).format('DD/MM/YY'),
      formatCurrency(demande.MONTANT_TOTAL || 0),
      demande.STATUT
    ]);
    
    doc.autoTable({
      startY: 40,
      head: [['#', 'N° Accord', 'Bénéficiaire', 'Type', 'Date', 'Montant', 'Statut']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 82, 150],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [80, 80, 80]
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 40, halign: 'left' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 25, halign: 'center' }
      },
      didDrawCell: (data) => {
        // Colorer les cellules de statut
        if (data.column.index === 6 && data.cell.raw) {
          const status = data.cell.raw;
          let color;
          
          switch(status) {
            case 'Validee': color = [40, 167, 69]; break; // Vert
            case 'En attente': color = [255, 193, 7]; break; // Jaune
            case 'Rejetee': color = [220, 53, 69]; break; // Rouge
            default: color = [108, 117, 125]; // Gris
          }
          
          doc.setFillColor(...color);
          doc.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.text(status, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2, { align: 'center' });
          
          // Réinitialiser pour les autres cellules
          doc.setTextColor(80, 80, 80);
          doc.setFont('helvetica', 'normal');
        }
      }
    });
    
    // Pied de page
    const finalY = doc.lastAutoTable.finalY + 10;
    if (finalY < 280) {
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('Document généré automatiquement - Système de Gestion Médicale', pageWidth / 2, 285, { align: 'center' });
    }
    
    doc.save(`liste_accords_prealables_${moment().format('YYYYMMDD')}.pdf`);
    
    message.success({
      content: 'Liste exportée avec succès',
      icon: <DownloadOutlined style={{ color: '#52c41a' }} />,
      duration: 3
    });
    
  } catch (error) {
    console.error('Erreur export liste:', error);
    message.error('Erreur lors de l\'export de la liste');
  }
}, []);
  
  // ==================== EFFETS ====================
  
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          loadDashboardData(),
          loadDemandes(),
          loadAffections(),
          loadBeneficiaires()
        ]);
      } catch (error) {
        console.error('Erreur lors du chargement initial:', error);
      }
    };
    
    loadInitialData();
  }, []);
  
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    if (searchAffectionTerm.trim() !== '') {
      searchTimerRef.current = setTimeout(() => {
        loadAffections(searchAffectionTerm);
      }, 500);
    } else {
      loadAffections();
    }
    
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchAffectionTerm, loadAffections]);
  
  // ==================== COLONNES TABLEAU ====================
  
  const demandeColumns = useMemo(() => [
    {
      title: 'N° Demande',
      dataIndex: 'NUM_PRESCRIPTION',
      key: 'NUM_PRESCRIPTION',
      width: 150,
      render: (text) => <strong>{text}</strong>,
      sorter: (a, b) => a.NUM_PRESCRIPTION?.localeCompare(b.NUM_PRESCRIPTION)
    },
    {
      title: 'Bénéficiaire',
      key: 'BENEFICIAIRE',
      width: 200,
      render: (_, record) => {
        const totalBeneficiaire = beneficiairesTotaux[record.COD_BEN] || 0;
        const plafondAtteint = totalBeneficiaire >= 500000;
        
        return (
          <div>
            <div>
              <strong>{record.NOM_BEN} {record.PRE_BEN}</strong>
              {plafondAtteint && (
                <Tooltip title={`Plafond atteint - Total: ${formatCurrency(totalBeneficiaire)}`}>
                  <Badge 
                    count="⚠️" 
                    style={{ 
                      backgroundColor: '#f5222d',
                      marginLeft: 8,
                      fontSize: '10px'
                    }} 
                  />
                </Tooltip>
              )}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              {record.IDENTIFIANT_NATIONAL || '-'}
              {plafondAtteint && (
                <span style={{ color: '#f5222d', marginLeft: 4 }}>
                  ({formatCurrency(totalBeneficiaire)} total)
                </span>
              )}
            </div>
          </div>
        );
      },
      sorter: (a, b) => a.NOM_BEN?.localeCompare(b.NOM_BEN)
    },
    {
      title: 'Type',
      dataIndex: 'TYPE_PRESTATION',
      key: 'TYPE_PRESTATION',
      width: 120,
      render: (type) => {
        const typeConfig = typesPrestation.find(t => t.value === type) || typesPrestation[0];
        return (
          <Tag color={typeConfig.color}>
            {type}
          </Tag>
        );
      },
      filters: typesPrestation.map(t => ({ text: t.label, value: t.value })),
      onFilter: (value, record) => record.TYPE_PRESTATION === value
    },
    {
      title: 'Affection',
      key: 'AFFECTION',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.LIB_AFF || '-'}</div>
          {record.COD_AFF && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              {record.COD_AFF}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Date',
      dataIndex: 'DATE_PRESCRIPTION',
      key: 'DATE_PRESCRIPTION',
      width: 120,
      render: (date) => date ? moment(date).format('DD/MM/YY') : '-',
      sorter: (a, b) => moment(a.DATE_PRESCRIPTION).unix() - moment(b.DATE_PRESCRIPTION).unix()
    },
    {
      title: 'Montant',
      dataIndex: 'MONTANT_TOTAL',
      key: 'MONTANT_TOTAL',
      width: 120,
      render: (montant) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {formatCurrency(montant || 0)}
        </span>
      ),
      align: 'right',
      sorter: (a, b) => a.MONTANT_TOTAL - b.MONTANT_TOTAL
    },
    {
      title: 'Statut',
      dataIndex: 'STATUT',
      key: 'STATUT',
      width: 120,
      render: (statut) => {
        const statusConfig = statuts.find(s => s.value === statut) || statuts[0];
        return (
          <Tag 
            color={statusConfig.color} 
            icon={statusConfig.icon}
            style={{ fontWeight: 600 }}
          >
            {statusConfig.label}
          </Tag>
        );
      },
      filters: statuts.map(s => ({ text: s.label, value: s.value })),
      onFilter: (value, record) => record.STATUT === value
    },
   // Dans les colonnes du tableau, remplacez les boutons d'impression :
{
  title: 'Actions',
  key: 'actions',
  width: 180,
  fixed: 'right',
  render: (_, record) => (
    <Space size="small">
      <Tooltip title="Voir détails">
        <Button
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedDemande(record);
            setDetailsModalVisible(true);
          }}
          size="small"
        />
      </Tooltip>
      <Tooltip title="Imprimer accord">
        <Button
          icon={<PrinterOutlined />}
          onClick={() => genererFicheAccord(record)}
          size="small"
          type="primary"
          ghost
        />
      </Tooltip>
      {record.TYPE_PRESTATION === 'Hospitalisation' && (
        <Tooltip title="Imprimer hospitalisation">
          <Button
            icon={<HomeOutlined />}
            onClick={() => genererFicheHospitalisation(record)}
            size="small"
            style={{ backgroundColor: '#dc3545', color: 'white', borderColor: '#dc3545' }}
          />
        </Tooltip>
      )}
      {record.STATUT === 'En attente' && (
        <>
          <Tooltip title="Valider">
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setSelectedDemande(record);
                setSelectedAction('valider');
                setActionModalVisible(true);
              }}
            >
              <CheckCircleOutlined />
            </Button>
          </Tooltip>
          <Tooltip title="Rejeter">
            <Button
              danger
              size="small"
              onClick={() => {
                setSelectedDemande(record);
                setSelectedAction('rejeter');
                setActionModalVisible(true);
              }}
            >
              <CloseCircleOutlined />
            </Button>
          </Tooltip>
        </>
      )}
    </Space>
  )
}
  ], [beneficiairesTotaux, genererFicheAccord, genererFicheHospitalisation]);
  
  const beneficiairesColumns = useMemo(() => [
    {
      title: 'Bénéficiaire',
      key: 'beneficiaire',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.nom} {record.prenom}
            {record.plafondAtteint && (
              <Tooltip title="Plafond atteint">
                <Badge 
                  count="⚠️" 
                  style={{ 
                    backgroundColor: '#f5222d',
                    marginLeft: 8,
                    fontSize: '10px'
                  }} 
                />
              </Tooltip>
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            ID: {record.identifiant || 'Non renseigné'}
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            Âge: {record.age || 'N/A'} • {record.sexe || 'N/A'}
          </div>
        </div>
      ),
      sorter: (a, b) => a.nom.localeCompare(b.nom)
    },
    {
      title: 'Total Transactions',
      key: 'totalTransactions',
      width: 150,
      render: (_, record) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', color: record.plafondAtteint ? '#f5222d' : '#1890ff' }}>
            {formatCurrency(record.totalTransactions)}
          </div>
          {record.plafond && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              Plafond: {formatCurrency(record.plafond)}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => a.totalTransactions - b.totalTransactions
    },
    {
      title: 'Utilisation Plafond',
      key: 'pourcentageUtilisation',
      width: 150,
      render: (_, record) => {
        const pourcentage = record.pourcentageUtilisation;
        let color = '#52c41a';
        if (pourcentage >= 100) color = '#f5222d';
        else if (pourcentage >= 80) color = '#faad14';
        
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                flex: 1, 
                marginRight: 8,
                backgroundColor: '#f5f5f5',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <div 
                  style={{ 
                    width: `${Math.min(pourcentage, 100)}%`,
                    height: 8,
                    backgroundColor: color,
                    transition: 'width 0.3s'
                  }}
                />
              </div>
              <span style={{ 
                fontWeight: 'bold',
                color: pourcentage >= 100 ? '#f5222d' : 'inherit'
              }}>
                {pourcentage.toFixed(1)}%
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: 4 }}>
              {record.plafondAtteint ? 'Plafond atteint' : 'Plafond non atteint'}
            </div>
          </div>
        );
      },
      sorter: (a, b) => a.pourcentageUtilisation - b.pourcentageUtilisation
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Créer un accord d'hospitalisation">
            <Button
              type="primary"
              icon={<HomeOutlined />}
              onClick={() => checkAndAuthorizeHospitalization(record)}
              size="small"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Hospitalisation
            </Button>
          </Tooltip>
          <Tooltip title="Voir les demandes">
            <Button
              icon={<HistoryOutlined />}
              onClick={() => {
                setFiltres(prev => ({ ...prev, search: record.identifiant || record.nom }));
                setBeneficiairesModalVisible(false);
                loadDemandes();
                message.info(`Affichage des demandes de ${record.nom} ${record.prenom}`);
              }}
              size="small"
            />
          </Tooltip>
        </Space>
      )
    }
  ], [checkAndAuthorizeHospitalization, loadDemandes]);
  
  // ==================== RENDU PRINCIPAL SIMPLIFIÉ ====================
  
  return (
    <div style={{ padding: '20px' }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SafetyCertificateOutlined style={{ marginRight: 8, fontSize: '20px' }} />
            <Title level={4} style={{ margin: 0 }}>
              Accords Préalables - Tableau de Bord
            </Title>
            <Badge 
              count="Accès complet" 
              style={{ 
                marginLeft: 16,
                backgroundColor: '#52c41a',
                fontWeight: 'bold',
                fontSize: '12px'
              }} 
            />
          </div>
        }
        extra={
          <Space>
            <Button 
              icon={<SyncOutlined />} 
              onClick={() => {
                loadDashboardData();
                loadDemandes();
                loadBeneficiaires();
              }}
              loading={loading.dashboard || loading.demandes}
            >
              Actualiser
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setCreationModalVisible(true);
                setValidationErreurs({});
              }}
            >
              Nouvelle Demande
            </Button>
            <Button
              type="primary"
              icon={<HomeOutlined />}
              onClick={handleCreateHospitalisationAgreement}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Accord Hospitalisation
            </Button>
            <Button
              icon={<TeamOutlined />}
              onClick={() => setBeneficiairesModalVisible(true)}
              style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: 'white' }}
            >
              Liste Bénéficiaires ({beneficiairesListe.length})
            </Button>
          </Space>
        }
      >
        <Alert
          message="Accès aux accords préalables"
          description="Vous avez accès à tous les accords préalables pour tous les bénéficiaires."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          icon={<InfoCircleOutlined />}
        />
        
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={4}>
            <Card size="small" hoverable>
              <Statistic
                title="Total Demandes"
                value={dashboardData.total}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card size="small" hoverable>
              <Statistic
                title="Taux de Validation"
                value={dashboardData.tauxValidation}
                suffix="%"
                prefix={<PercentageOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card size="small" hoverable>
              <Statistic
                title="Montant Total"
                value={dashboardData.montantTotal}
                suffix="FCFA"
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card size="small" hoverable>
              <Statistic
                title="En attente"
                value={dashboardData.enAttente}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card size="small" hoverable>
              <Statistic
                title="Plafonds Atteints"
                value={dashboardData.nombreBeneficiairesAtteintPlafond || 0}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card size="small" hoverable>
              <Statistic
                title="Hospitalisations"
                value={dashboardData.hospitalisations}
                prefix={<HomeOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <DatePicker.RangePicker
                value={[filtres.dateDebut, filtres.dateFin]}
                onChange={(dates) => {
                  if (dates) {
                    setFiltres(prev => ({ ...prev, dateDebut: dates[0], dateFin: dates[1] }));
                  }
                }}
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
              />
            </Col>
            <Col xs={12} md={4}>
              <Select
                value={filtres.statut}
                onChange={(value) => setFiltres(prev => ({ ...prev, statut: value }))}
                style={{ width: '100%' }}
                placeholder="Statut"
              >
                <Option value="tous">Tous les statuts</Option>
                {statuts.map(statut => (
                  <Option key={statut.value} value={statut.value}>
                    {statut.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} md={4}>
              <Select
                value={filtres.type}
                onChange={(value) => setFiltres(prev => ({ ...prev, type: value }))}
                style={{ width: '100%' }}
                placeholder="Type"
              >
                <Option value="tous">Tous les types</Option>
                {typesPrestation.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} md={4}>
              <Select
                value={filtres.priorite}
                onChange={(value) => setFiltres(prev => ({ ...prev, priorite: value }))}
                style={{ width: '100%' }}
                placeholder="Priorité"
              >
                <Option value="tous">Toutes priorités</Option>
                {priorities.map(priority => (
                  <Option key={priority.value} value={priority.value}>
                    {priority.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} md={4}>
              <Input
                placeholder="Rechercher..."
                value={filtres.search}
                onChange={(e) => setFiltres(prev => ({ ...prev, search: e.target.value }))}
                style={{ width: '100%' }}
                prefix={<SearchOutlined />}
              />
            </Col>
          </Row>
          <Divider />
          <Row justify="space-between">
            <Col>
              <Button 
                type="primary" 
                onClick={loadDemandes}
                loading={loading.demandes}
              >
                Appliquer les filtres
              </Button>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<TeamOutlined />}
                  onClick={() => setBeneficiairesModalVisible(true)}
                >
                  Voir Bénéficiaires
                </Button>
<Button
  icon={<DownloadOutlined />}
  onClick={() => exporterListeAccords(demandes)}
  style={{ marginRight: 8 }}
>
  Exporter la liste
</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Tabs 
          defaultActiveKey="demandes"
          items={[
            {
              key: 'demandes',
              label: (
                <span>
                  <FileTextOutlined />
                  Demandes
                </span>
              ),
              children: (
                <Table
                  columns={demandeColumns}
                  dataSource={demandes}
                  loading={loading.demandes}
                  rowKey="COD_PRES"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1300 }}
                />
              ),
            },
            {
              key: 'statistiques',
              label: (
                <span>
                  <PercentageOutlined />
                  Statistiques
                </span>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card title="Répartition par Statut">
                      <Row gutter={[16, 16]}>
                        {statuts.map(statut => (
                          <Col xs={24} sm={12} md={8} key={statut.value}>
                            <Card size="small">
                              <Statistic
                                title={statut.label}
                                value={demandes.filter(d => d.STATUT === statut.value).length}
                                valueStyle={{ color: getStatusColor(statut.value) }}
                                prefix={statut.icon}
                              />
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  </Col>
                </Row>
              )
            }
          ]}
        />
      </Card>

      {/* Modal Liste des Bénéficiaires */}
      <Modal
        title="Liste des Bénéficiaires"
        open={beneficiairesModalVisible}
        onCancel={() => setBeneficiairesModalVisible(false)}
        footer={null}
        width={900}
      >
        <Select
          value={filtres.filtrePlafond}
          onChange={(value) => setFiltres(prev => ({ ...prev, filtrePlafond: value }))}
          style={{ width: '100%', marginBottom: 16 }}
        >
          {filtresPlafond.map(filtre => (
            <Option key={filtre.value} value={filtre.value}>
              {filtre.label}
            </Option>
          ))}
        </Select>
        
        <Table
          columns={beneficiairesColumns}
          dataSource={
            filtres.filtrePlafond === 'tous' 
              ? beneficiairesListe 
              : filtres.filtrePlafond === 'atteint'
                ? beneficiairesListe.filter(b => b.plafondAtteint)
                : beneficiairesListe.filter(b => !b.plafondAtteint)
          }
          loading={loading.listeBeneficiaires}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Modal>

      {/* Modal Nouvelle Demande */}
      <Modal
        title="Nouvelle Demande d'Accord Préalable"
        open={creationModalVisible}
        onCancel={() => {
          setCreationModalVisible(false);
          setCreationStep(0);
          setValidationErreurs({});
          setNewDemande({
            COD_BEN: '',
            patientInfo: null,
            TYPE_PRESTATION: '',
            COD_AFF: '',
            codeAffectationInfo: null,
            OBSERVATIONS: '',
            hospitalisation: false,
            dateDebutHospitalisation: null,
            dateFinHospitalisation: null,
            dureeHospitalisation: null,
            plafondChambre: 50000,
            dateEntreePatient: moment().format('YYYY-MM-DD'),
            actes: [],
            MONTANT_TOTAL: 0,
            tauxCouverture: 80,
            PRIORITE: 'moyenne',
            STATUT: 'En attente',
            URGENCE: false
          });
        }}
        footer={null}
        width={900}
      >
        <Steps
          current={creationStep}
          style={{ marginBottom: 24 }}
        >
          <Step title="Patient & Affection" />
          <Step title="Actes médicaux" />
          <Step title="Validation" />
        </Steps>

        {creationStep === 0 && (
          <>
            <Card title="Sélection du patient" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong style={{ color: validationErreurs.patient ? '#f5222d' : 'inherit' }}>
                  Rechercher un patient <span style={{ color: '#f5222d' }}>*</span>
                </Text>
                {validationErreurs.patient && (
                  <div style={{ color: '#f5222d', fontSize: 12, marginTop: 4 }}>
                    {validationErreurs.patient}
                  </div>
                )}
              </div>
              
              <AutoComplete
                value={searchPatientTerm}
                onChange={(value) => {
                  setSearchPatientTerm(value);
                  if (validationErreurs.patient) {
                    setValidationErreurs(prev => ({ ...prev, patient: undefined }));
                  }
                  if (value.length >= 2) {
                    searchPatients(value);
                  }
                }}
                options={patientResults.map(p => ({
                  value: p.COD_BEN || p.id,
                  label: `${p.nom || p.NOM_BEN} ${p.prenom || p.PRE_BEN} (${p.identifiant || p.IDENTIFIANT_NATIONAL || 'Pas d\'identifiant'})`
                }))}
                onSelect={(value) => {
                  const patient = patientResults.find(p => (p.COD_BEN || p.id) === value);
                  if (patient) {
                    setNewDemande(prev => ({
                      ...prev,
                      COD_BEN: patient.COD_BEN || patient.id,
                      patientInfo: {
                        id: patient.COD_BEN || patient.id,
                        COD_BEN: patient.COD_BEN || patient.id,
                        nom: patient.nom || patient.NOM_BEN,
                        prenom: patient.prenom || patient.PRE_BEN,
                        age: patient.age,
                        identifiant: patient.identifiant || patient.IDENTIFIANT_NATIONAL,
                        date_naissance: patient.date_naissance || patient.NAI_BEN,
                        telephone: patient.telephone,
                        sexe: patient.sexe || patient.SEX_BEN
                      }
                    }));
                    setSearchPatientTerm(`${patient.nom || patient.NOM_BEN} ${patient.prenom || patient.PRE_BEN}`);
                    if (validationErreurs.patient) {
                      setValidationErreurs(prev => ({ ...prev, patient: undefined }));
                    }
                  }
                }}
                placeholder="Nom, prénom ou numéro d'identification"
                style={{ width: '100%' }}
              >
                <Input
                  prefix={<SearchOutlined />}
                  suffix={loading.patients && <Spin size="small" />}
                />
              </AutoComplete>
              
              {newDemande.patientInfo && (
                <Alert
                  message={
                    <div>
                      <strong>Patient sélectionné :</strong> {newDemande.patientInfo.nom} {newDemande.patientInfo.prenom}
                      {newDemande.patientInfo.identifiant && ` (${newDemande.patientInfo.identifiant})`}
                    </div>
                  }
                  type="success"
                  showIcon
                  style={{ marginTop: 16 }}
                  closable
                  onClose={() => {
                    setNewDemande(prev => ({ ...prev, COD_BEN: '', patientInfo: null }));
                    setSearchPatientTerm('');
                  }}
                />
              )}
            </Card>

            <Card title="Informations médicales">
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ color: validationErreurs.typePrestation ? '#f5222d' : 'inherit' }}>
                      Type de prestation <span style={{ color: '#f5222d' }}>*</span>
                    </Text>
                    {validationErreurs.typePrestation && (
                      <div style={{ color: '#f5222d', fontSize: 12, marginTop: 4 }}>
                        {validationErreurs.typePrestation}
                      </div>
                    )}
                  </div>
                  <Select
                    value={newDemande.TYPE_PRESTATION || undefined}
                    onChange={(value) => {
                      setNewDemande(prev => ({ 
                        ...prev, 
                        TYPE_PRESTATION: value || '',
                        hospitalisation: value === 'Hospitalisation'
                      }));
                      if (validationErreurs.typePrestation) {
                        setValidationErreurs(prev => ({ ...prev, typePrestation: undefined }));
                      }
                    }}
                    placeholder="Sélectionner"
                    style={{ width: '100%' }}
                    status={validationErreurs.typePrestation ? 'error' : ''}
                  >
                    <Option value="">-- Sélectionnez un type --</Option>
                    {typesPrestation.map(type => (
                      <Option key={type.value} value={type.value}>
                        {type.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>Priorité</Text>
                  </div>
                  <Select
                    value={newDemande.PRIORITE}
                    onChange={(value) => setNewDemande(prev => ({ ...prev, PRIORITE: value }))}
                    placeholder="Sélectionner"
                    style={{ width: '100%' }}
                  >
                    {priorities.map(priority => (
                      <Option key={priority.value} value={priority.value}>
                        {priority.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>

              <div style={{ marginTop: 16 }}>
                <Text strong>Affection principale</Text>
                <Select
                  showSearch
                  value={newDemande.COD_AFF || undefined}
                  onChange={(value) => {
                    const affection = affectionsList.find(a => a.code === value);
                    setNewDemande(prev => ({
                      ...prev,
                      COD_AFF: value || '',
                      codeAffectationInfo: affection
                    }));
                  }}
                  onSearch={(value) => setSearchAffectionTerm(value)}
                  filterOption={false}
                  placeholder="Sélectionnez l'affection"
                  style={{ width: '100%', marginTop: 4 }}
                  loading={loading.affections}
                  notFoundContent={loading.affections ? <Spin size="small" /> : "Aucune affection trouvée"}
                >
                  {affectionsList.map(affection => (
                    <Option key={affection.code} value={affection.code}>
                      {affection.label}
                    </Option>
                  ))}
                </Select>
              </div>
            </Card>

            {/* Paramètres d'hospitalisation */}
            {newDemande.TYPE_PRESTATION === 'Hospitalisation' && (
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HomeOutlined style={{ color: '#f5222d' }} />
                    <span>Paramètres d'Hospitalisation</span>
                  </div>
                }
                style={{ marginTop: 16 }}
              >
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>
                        <BankOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        Plafond Chambre (FCFA)
                      </Text>
                      {validationErreurs.plafondChambre && (
                        <div style={{ color: '#f5222d', fontSize: 12, marginTop: 4 }}>
                          {validationErreurs.plafondChambre}
                        </div>
                      )}
                    </div>
                    <InputNumber
                      value={newDemande.plafondChambre}
                      onChange={(value) => {
                        setNewDemande(prev => ({ ...prev, plafondChambre: value || 0 }));
                        if (validationErreurs.plafondChambre) {
                          setValidationErreurs(prev => ({ ...prev, plafondChambre: undefined }));
                        }
                      }}
                      style={{ width: '100%' }}
                      min={0}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                      parser={value => value.replace(/\s/g, '')}
                      addonAfter="FCFA"
                    />
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>
                        <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        Date d'Entrée Patient
                      </Text>
                      {validationErreurs.dateEntreePatient && (
                        <div style={{ color: '#f5222d', fontSize: 12, marginTop: 4 }}>
                          {validationErreurs.dateEntreePatient}
                        </div>
                      )}
                    </div>
                    <DatePicker
                      value={newDemande.dateEntreePatient ? moment(newDemande.dateEntreePatient) : null}
                      onChange={(date) => {
                        setNewDemande(prev => ({ 
                          ...prev, 
                          dateEntreePatient: date ? date.format('YYYY-MM-DD') : null 
                        }));
                        if (validationErreurs.dateEntreePatient) {
                          setValidationErreurs(prev => ({ ...prev, dateEntreePatient: undefined }));
                        }
                      }}
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                    />
                  </Col>
                </Row>
                
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col span={12}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>
                        <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        Date Début Hospitalisation
                      </Text>
                    </div>
                    <DatePicker
                      value={newDemande.dateDebutHospitalisation}
                      onChange={(date) => setNewDemande(prev => ({ 
                        ...prev, 
                        dateDebutHospitalisation: date,
                        dureeHospitalisation: date && newDemande.dateFinHospitalisation ? 
                          newDemande.dateFinHospitalisation.diff(date, 'days') : newDemande.dureeHospitalisation
                      }))}
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                    />
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>
                        <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        Date Fin Hospitalisation
                      </Text>
                    </div>
                    <DatePicker
                      value={newDemande.dateFinHospitalisation}
                      onChange={(date) => setNewDemande(prev => ({ 
                        ...prev, 
                        dateFinHospitalisation: date,
                        dureeHospitalisation: date && newDemande.dateDebutHospitalisation ? 
                          date.diff(newDemande.dateDebutHospitalisation, 'days') : newDemande.dureeHospitalisation
                      }))}
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                    />
                  </Col>
                </Row>
                
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col span={12}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>
                        Durée Estimée (jours)
                      </Text>
                    </div>
                    <InputNumber
                      value={newDemande.dureeHospitalisation}
                      onChange={(value) => setNewDemande(prev => ({ 
                        ...prev, 
                        dureeHospitalisation: value || 0,
                        dateFinHospitalisation: newDemande.dateDebutHospitalisation ? 
                          moment(newDemande.dateDebutHospitalisation).add(value || 0, 'days') : null
                      }))}
                      style={{ width: '100%' }}
                      min={1}
                    />
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>
                        <ExclamationCircleOutlined style={{ marginRight: 8, color: '#f5222d' }} />
                        Urgence
                      </Text>
                    </div>
                    <Switch
                      checked={newDemande.URGENCE}
                      onChange={(checked) => setNewDemande(prev => ({ 
                        ...prev, 
                        URGENCE: checked,
                        PRIORITE: checked ? 'haute' : prev.PRIORITE
                      }))}
                      checkedChildren="OUI"
                      unCheckedChildren="NON"
                      style={{ marginTop: 8 }}
                    />
                    <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                      Cochez si c'est une hospitalisation d'urgence
                    </div>
                  </Col>
                </Row>
              </Card>
            )}
          </>
        )}

        {creationStep === 1 && (
          <Card title="Actes médicaux">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={18}>
                <Input
                  placeholder="Rechercher un acte médical..."
                  value={searchActeTerm}
                  onChange={(e) => {
                    setSearchActeTerm(e.target.value);
                    if (e.target.value.length >= 2) {
                      searchActes(e.target.value);
                    }
                  }}
                  prefix={<SearchOutlined />}
                  suffix={loading.actes && <Spin size="small" />}
                />
              </Col>
              <Col span={6}>
                <Button
                  type="dashed"
                  block
                  onClick={() => setManualActeModalVisible(true)}
                >
                  + Ajouter manuellement
                </Button>
              </Col>
            </Row>

            {acteResults.length > 0 && (
              <div style={{ marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}>
                {acteResults.map(acte => (
                  <Card
                    key={acte.id}
                    size="small"
                    style={{ marginBottom: 8, cursor: 'pointer' }}
                    onClick={() => handleAddActe(acte)}
                  >
                    <div><strong>{acte.libelle || acte.NOM_COMMERCIAL}</strong></div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Code: {acte.code || acte.COD_MED} | Prix: {formatCurrency(acte.prix || acte.PRIX_UNITAIRE || 0)}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <Table
              columns={[
                {
                  title: 'Acte',
                  dataIndex: 'libelle',
                  key: 'libelle',
                  width: 200,
                  render: (text, record) => (
                    <div>
                      <div><strong>{text}</strong></div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        Code: {record.code}
                        {record.isManual && <Tag color="orange" style={{ marginLeft: 4 }}>Manuel</Tag>}
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Qté',
                  key: 'quantite',
                  width: 80,
                  render: (_, record, index) => (
                    <InputNumber
                      value={record.quantite}
                      onChange={(value) => {
                        const oldTotal = record.quantite * record.prixUnitaire;
                        const newTotal = (value || 1) * record.prixUnitaire;
                        const diff = newTotal - oldTotal;
                        
                        setNewDemande(prev => {
                          const updatedActes = [...prev.actes];
                          updatedActes[index] = { ...record, quantite: value || 1 };
                          
                          return {
                            ...prev,
                            actes: updatedActes,
                            MONTANT_TOTAL: prev.MONTANT_TOTAL + diff
                          };
                        });
                      }}
                      min={1}
                      size="small"
                      style={{ width: '60px' }}
                    />
                  )
                },
                {
                  title: 'Prix unit.',
                  key: 'prixUnitaire',
                  width: 120,
                  render: (_, record, index) => (
                    <InputNumber
                      value={record.prixUnitaire}
                      onChange={(value) => {
                        const oldTotal = record.quantite * record.prixUnitaire;
                        const newTotal = record.quantite * (value || 0);
                        const diff = newTotal - oldTotal;
                        
                        setNewDemande(prev => {
                          const updatedActes = [...prev.actes];
                          updatedActes[index] = { ...record, prixUnitaire: value || 0 };
                          
                          return {
                            ...prev,
                            actes: updatedActes,
                            MONTANT_TOTAL: prev.MONTANT_TOTAL + diff
                          };
                        });
                      }}
                      min={0}
                      size="small"
                      style={{ width: '100px' }}
                      formatter={value => `${parseFloat(value || 0).toFixed(2)}`}
                      parser={value => parseFloat(value.replace(/[^\d.]/g, '')) || 0}
                    />
                  )
                },
                {
                  title: 'Total',
                  key: 'total',
                  width: 120,
                  render: (_, record) => (
                    <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#1890ff' }}>
                      {formatCurrency(record.quantite * record.prixUnitaire)}
                    </div>
                  )
                },
                {
                  title: '',
                  key: 'actions',
                  width: 50,
                  render: (_, __, index) => (
                    <Button
                      type="link"
                      danger
                      size="small"
                      onClick={() => {
                        setNewDemande(prev => {
                          const removedActe = prev.actes[index];
                          const updatedActes = prev.actes.filter((_, i) => i !== index);
                          const nouveauMontant = prev.MONTANT_TOTAL - (removedActe.quantite * removedActe.prixUnitaire);
                          
                          return {
                            ...prev,
                            actes: updatedActes,
                            MONTANT_TOTAL: nouveauMontant
                          };
                        });
                      }}
                      icon={<DeleteOutlined />}
                    />
                  )
                }
              ]}
              dataSource={newDemande.actes}
              pagination={false}
              size="small"
              locale={{
                emptyText: 'Aucun acte ajouté'
              }}
            />

            <Divider />
            
            <Row justify="space-between" align="middle">
              <Col>
                <Text strong>Total: {formatCurrency(newDemande.MONTANT_TOTAL)}</Text>
              </Col>
              <Col>
                <Text type="secondary">
                  {newDemande.actes.length} acte(s) ajouté(s)
                </Text>
              </Col>
            </Row>
          </Card>
        )}

        {creationStep === 2 && (
          <Card title="Récapitulatif">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Patient">
                {newDemande.patientInfo ? 
                  `${newDemande.patientInfo.nom} ${newDemande.patientInfo.prenom} ${newDemande.patientInfo.identifiant ? `(${newDemande.patientInfo.identifiant})` : ''}` 
                  : 'Non sélectionné'}
              </Descriptions.Item>
              <Descriptions.Item label="Type de prestation">
                {newDemande.TYPE_PRESTATION || 'Non sélectionné'}
              </Descriptions.Item>
              <Descriptions.Item label="Affection">
                {newDemande.codeAffectationInfo?.libelle || newDemande.COD_AFF || 'Non spécifiée'}
              </Descriptions.Item>
              <Descriptions.Item label="Nombre d'actes">
                {newDemande.actes.length}
              </Descriptions.Item>
              <Descriptions.Item label="Montant total">
                <Text strong>{formatCurrency(newDemande.MONTANT_TOTAL)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Priorité">
                {priorities.find(p => p.value === newDemande.PRIORITE)?.label || newDemande.PRIORITE}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <Divider />
        
        <div style={{ textAlign: 'right' }}>
          <Button 
            onClick={() => {
              if (creationStep > 0) {
                setCreationStep(prev => prev - 1);
              } else {
                setCreationModalVisible(false);
                setNewDemande({
                  COD_BEN: '',
                  patientInfo: null,
                  TYPE_PRESTATION: '',
                  COD_AFF: '',
                  codeAffectationInfo: null,
                  OBSERVATIONS: '',
                  hospitalisation: false,
                  dateDebutHospitalisation: null,
                  dateFinHospitalisation: null,
                  dureeHospitalisation: null,
                  plafondChambre: 50000,
                  dateEntreePatient: moment().format('YYYY-MM-DD'),
                  actes: [],
                  MONTANT_TOTAL: 0,
                  tauxCouverture: 80,
                  PRIORITE: 'moyenne',
                  STATUT: 'En attente',
                  URGENCE: false
                });
                setValidationErreurs({});
              }
            }} 
            style={{ marginRight: 8 }}
          >
            {creationStep === 0 ? 'Annuler' : 'Précédent'}
          </Button>
          
          {creationStep < 2 ? (
            <Button 
              type="primary" 
              onClick={() => {
                if (creationStep === 0) {
                  // Validation de l'étape 1
                  let erreurs = {};
                  let hasError = false;
                  
                  if (!newDemande.COD_BEN || !newDemande.patientInfo) {
                    erreurs.patient = 'Veuillez sélectionner un patient';
                    hasError = true;
                  }
                  
                  if (!newDemande.TYPE_PRESTATION || newDemande.TYPE_PRESTATION.trim() === '') {
                    erreurs.typePrestation = 'Le type de prestation est obligatoire';
                    hasError = true;
                  }
                  
                  if (hasError) {
                    setValidationErreurs(erreurs);
                    message.error('Veuillez remplir tous les champs obligatoires');
                    return;
                  }
                  
                  setValidationErreurs({});
                }
                setCreationStep(prev => prev + 1);
              }}
            >
              Continuer
            </Button>
          ) : (
            <Button 
              type="primary" 
              onClick={handleSubmitDemande}
              loading={loading.creation}
            >
              Soumettre la Demande
            </Button>
          )}
        </div>
      </Modal>

      {/* Modal Acte Manuel */}
      <Modal
        title="Ajouter un acte manuellement"
        open={manualActeModalVisible}
        onCancel={() => setManualActeModalVisible(false)}
        onOk={handleAddManualActe}
      >
        <Form form={manualActeForm} layout="vertical">
          <Form.Item label="Code" required>
            <Input
              value={manualActe.code}
              onChange={(e) => setManualActe(prev => ({ ...prev, code: e.target.value }))}
              placeholder="Code de l'acte"
            />
          </Form.Item>
          <Form.Item label="Libellé" required>
            <Input
              value={manualActe.libelle}
              onChange={(e) => setManualActe(prev => ({ ...prev, libelle: e.target.value }))}
              placeholder="Libellé de l'acte"
            />
          </Form.Item>
          <Form.Item label="Description complète">
            <Input.TextArea
              value={manualActe.libelle_complet}
              onChange={(e) => setManualActe(prev => ({ ...prev, libelle_complet: e.target.value }))}
              placeholder="Description détaillée"
              rows={3}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Quantité">
                <InputNumber
                  value={manualActe.quantite}
                  onChange={(value) => setManualActe(prev => ({ ...prev, quantite: value || 1 }))}
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Prix unitaire (FCFA)" required>
                <InputNumber
                  value={manualActe.prixUnitaire}
                  onChange={(value) => setManualActe(prev => ({ ...prev, prixUnitaire: value || 0 }))}
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Taux de prise en charge (%)">
            <InputNumber
              value={manualActe.tauxPriseEnCharge}
              onChange={(value) => setManualActe(prev => ({ ...prev, tauxPriseEnCharge: value || 80 }))}
              min={0}
              max={100}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item>
            <Checkbox
              checked={manualActe.remboursable}
              onChange={(e) => setManualActe(prev => ({ ...prev, remboursable: e.target.checked }))}
            >
              Acte remboursable
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Action (Valider/Rejeter) */}
      <Modal
        title={selectedAction === 'valider' ? 'Valider la demande' : 'Rejeter la demande'}
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false);
          actionForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setActionModalVisible(false)}>
            Annuler
          </Button>,
          selectedAction === 'valider' ? (
            <Button
              key="validate"
              type="primary"
              loading={loading.validation}
              onClick={() => handleValiderDemande(selectedDemande)}
            >
              Valider
            </Button>
          ) : (
            <Button
              key="reject"
              type="primary"
              danger
              loading={loading.validation}
              onClick={() => {
                actionForm.validateFields().then(values => {
                  handleRejeterDemande(selectedDemande, values.motif);
                });
              }}
            >
              Rejeter
            </Button>
          )
        ]}
      >
        {selectedAction === 'valider' ? (
          <div>
            <p>Voulez-vous valider la demande <strong>{selectedDemande?.NUM_PRESCRIPTION}</strong> ?</p>
            <p>Cette action est irréversible.</p>
          </div>
        ) : (
          <Form form={actionForm} layout="vertical">
            <Form.Item
              name="motif"
              label="Motif du rejet"
              rules={[{ required: true, message: 'Veuillez sélectionner un motif' }]}
            >
              <Select placeholder="Sélectionnez un motif">
                {motifsRejet.map(motif => (
                  <Option key={motif.value} value={motif.value}>
                    {motif.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="commentaire" label="Commentaire supplémentaire">
              <Input.TextArea placeholder="Commentaire facultatif..." rows={3} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Modal Détails */}
      <Modal
        title="Détails de la Demande"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedDemande && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Numéro" span={2}>
              {selectedDemande.NUM_PRESCRIPTION}
            </Descriptions.Item>
            <Descriptions.Item label="Bénéficiaire">
              {selectedDemande.NOM_BEN} {selectedDemande.PRE_BEN}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              {selectedDemande.TYPE_PRESTATION}
            </Descriptions.Item>
            <Descriptions.Item label="Montant">
              {formatCurrency(selectedDemande.MONTANT_TOTAL)}
            </Descriptions.Item>
            <Descriptions.Item label="Statut">
              <Tag color={
                selectedDemande.STATUT === 'Validee' ? 'success' :
                selectedDemande.STATUT === 'Rejetee' ? 'error' :
                selectedDemande.STATUT === 'En attente' ? 'warning' : 'default'
              }>
                {selectedDemande.STATUT}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {moment(selectedDemande.DATE_PRESCRIPTION).format('DD/MM/YYYY')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AccordsPrealables;