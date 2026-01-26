// src/pages/AccordsPrealables.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Card, Row, Col, Statistic, Button, Modal, Form,
  Select, Input, DatePicker, Tag, Space, message, Tabs,
  Descriptions, Tooltip, Spin, Upload,
  Alert, Divider, Badge, Typography, Empty, Steps,
  InputNumber, Checkbox, AutoComplete
} from 'antd';
import {
  FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, DownloadOutlined, EyeOutlined,
  LoadingOutlined, UserOutlined, SearchOutlined,
  PieChartOutlined, BarChartOutlined,
  InfoCircleOutlined, ClockCircleOutlined,
  FileSearchOutlined, PlusOutlined, 
  SafetyCertificateOutlined,
  DollarOutlined, PercentageOutlined
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import moment from 'moment';
import 'moment/locale/fr';
import { Doughnut, Pie } from 'react-chartjs-2';
import { prescriptionsAPI, beneficiairesAPI, affectionsAPI } from '../../services/api';

// Enregistrement de ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;
const { Step } = Steps;

const AccordsPrealables = () => {
  // États principaux
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState({
    demandes: false,
    dashboard: false,
    creation: false,
    validation: false,
    details: false,
    patients: false,
    affections: false,
    actes: false,
    statistiques: false
  });

  // Données du dashboard
  const [dashboardData, setDashboardData] = useState({
    total: 0,
    enAttente: 0,
    validees: 0,
    executees: 0,
    rejetees: 0,
    annulees: 0,
    montantTotal: 0,
    tauxValidation: 0,
    moyenneMontant: 0,
    demandesMensuelles: 0
  });

  // Modales
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [creationModalVisible, setCreationModalVisible] = useState(false);

  // Filtres
  const [filtres, setFiltres] = useState({
    dateDebut: moment().subtract(30, 'days'),
    dateFin: moment(),
    statut: 'tous',
    type: 'tous',
    search: '',
    beneficiaire: ''
  });

  // Création de demande
  const [creationStep, setCreationStep] = useState(0);
  const [newDemande, setNewDemande] = useState({
    COD_BEN: null,
    patientInfo: null,
    TYPE_PRESTATION: '',
    COD_AFF: '',
    codeAffectationInfo: null,
    OBSERVATIONS: '',
    hospitalisation: false,
    dateDebutHospitalisation: null,
    dateFinHospitalisation: null,
    dureeHospitalisation: null,
    actes: [],
    MONTANT_TOTAL: 0,
    tauxCouverture: 80,
    PRIORITE: 'moyenne',
    STATUT: 'En attente'
  });

  // Recherche
  const [searchPatientTerm, setSearchPatientTerm] = useState('');
  const [searchActeTerm, setSearchActeTerm] = useState('');
  const [searchAffectionTerm, setSearchAffectionTerm] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [acteResults, setActeResults] = useState([]);
  const [affectionsList, setAffectionsList] = useState([]);

  // Formulaires
  const [creationForm] = Form.useForm();
  const [actionForm] = Form.useForm();

  // ==================== CONSTANTES ====================

  const statuts = [
    { value: 'En attente', label: 'En attente', color: 'warning', icon: <ClockCircleOutlined /> },
    { value: 'Validee', label: 'Validée', color: 'success', icon: <CheckCircleOutlined /> },
    { value: 'Rejetee', label: 'Rejetée', color: 'error', icon: <CloseCircleOutlined /> },
    { value: 'Executee', label: 'Exécutée', color: 'processing', icon: <SafetyCertificateOutlined /> },
    { value: 'Annulée', label: 'Annulée', color: 'default', icon: <CloseCircleOutlined /> }
  ];

  const typesPrestation = [
    { value: 'Consultation', label: 'Consultation', color: 'blue' },
    { value: 'Pharmacie', label: 'Pharmacie', color: 'green' },
    { value: 'Biologie', label: 'Biologie', color: 'cyan' },
    { value: 'Imagerie', label: 'Imagerie', color: 'purple' },
    { value: 'Hospitalisation', label: 'Hospitalisation', color: 'red' },
    { value: 'Chirurgie', label: 'Chirurgie', color: 'volcano' },
    { value: 'Rééducation', label: 'Rééducation', color: 'orange' }
  ];

  const priorities = [
    { value: 'haute', label: 'Haute', color: 'red' },
    { value: 'moyenne', label: 'Moyenne', color: 'orange' },
    { value: 'basse', label: 'Basse', color: 'blue' }
  ];

  // ==================== EFFETS ====================

  useEffect(() => {
    loadDashboardData();
    loadDemandes();
    loadAffections();
  }, []);

  // ==================== FONCTIONS DE RECHERCHE ====================

  const searchPatients = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setPatientResults([]);
      return;
    }
    
    setLoading(prev => ({ ...prev, patients: true }));
    try {
      const response = await beneficiairesAPI.searchAdvanced(searchTerm, {}, 10, 1);
      
      if (response.success && response.beneficiaires) {
        const patients = response.beneficiaires.map(ben => ({
          id: ben.ID_BEN || ben.id,
          COD_BEN: ben.ID_BEN || ben.id,
          nom: ben.NOM_BEN || ben.nom,
          prenom: ben.PRE_BEN || ben.prenom,
          age: calculateAge(ben.NAI_BEN),
          identifiant: ben.IDENTIFIANT_NATIONAL || ben.identifiant_national || '',
          date_naissance: ben.NAI_BEN || null,
          telephone: ben.TELEPHONE_MOBILE || ben.TELEPHONE || ben.telephone || '',
          sexe: ben.SEX_BEN || ben.sexe,
        }));
        setPatientResults(patients);
      } else {
        setPatientResults([]);
      }
    } catch (error) {
      console.error('Erreur recherche patients:', error);
      setPatientResults([]);
    } finally {
      setLoading(prev => ({ ...prev, patients: false }));
    }
  };

  const calculateAge = (dateString) => {
    if (!dateString) return null;
    const birthDate = moment(dateString);
    const today = moment();
    return today.diff(birthDate, 'years');
  };

  const searchActes = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setActeResults([]);
      return;
    }
    
    setLoading(prev => ({ ...prev, actes: true }));
    try {
      // Utiliser l'API pour rechercher des actes médicaux
      const response = await prescriptionsAPI.searchMedicalItems(searchTerm);
      
      if (response.success && response.items) {
        // Transformer les résultats de l'API
        const transformedItems = response.items.map(item => {
          // Extraire le prix de différentes manières possibles
          let prix = 0;
          const prixPossible = [
            item.prix,
            item.PRIX,
            item.PRIX_UNITAIRE,
            item.prix_unitaire,
            item.TARIF,
            item.tarif,
            item.MONTANT,
            item.montant,
            item.COUT,
            item.cout
          ];
          
          for (const p of prixPossible) {
            if (p !== undefined && p !== null && p !== '') {
              const prixNum = parseFloat(p);
              if (!isNaN(prixNum) && prixNum > 0) {
                prix = prixNum;
                break;
              }
            }
          }
          
          // Obtenir le code
          const code = item.COD_ELEMENT || item.code || item.COD_ACTE || item.id;
          
          return {
            id: item.id || code,
            code: String(code), // S'assurer que c'est une chaîne
            libelle: item.libelle || item.LIBELLE || item.nom || item.NOM || 'Acte médical',
            libelle_complet: item.libelle_complet || item.LIBELLE_COMPLET || item.description || item.DESCRIPTION || item.libelle || item.LIBELLE,
            type: item.type || 'acte',
            prix: prix,
            PRIX_UNITAIRE: prix,
            REMBOURSABLE: item.REMBOURSABLE !== false,
            CATEGORIE: item.CATEGORIE || item.categorie,
            UNITE: item.UNITE || 'U',
            TAUX_PRISE_EN_CHARGE: item.TAUX_PRISE_EN_CHARGE || 80
          };
        });
        
        setActeResults(transformedItems.filter(item => item.code && item.code !== ''));
      } else {
        setActeResults([]);
      }
    } catch (error) {
      console.error('Erreur recherche actes:', error);
      setActeResults([]);
    } finally {
      setLoading(prev => ({ ...prev, actes: false }));
    }
  };

  const loadAffections = async (search = '') => {
    setLoading(prev => ({ ...prev, affections: true }));
    try {
      const response = await affectionsAPI.getAll({
        search: search,
        limit: 50,
        page: 1
      });
      
      if (response.success && response.affections) {
        const transformedAffections = response.affections.map(affection => ({
          id: affection.COD_AFF || affection.id,
          label: `${affection.LIB_AFF || affection.libelle} (${affection.COD_AFF || affection.id})`,
          libelle: affection.LIB_AFF || affection.libelle,
          code: affection.COD_AFF || affection.id,
        }));
        setAffectionsList(transformedAffections);
      } else {
        setAffectionsList([]);
      }
    } catch (error) {
      console.error('Erreur chargement affections:', error);
      setAffectionsList([]);
    } finally {
      setLoading(prev => ({ ...prev, affections: false }));
    }
  };

  // ==================== GESTION DES ACTES ====================

  const handleAddActe = (acte) => {
    const nouvelActe = {
      id: acte.id,
      code: String(acte.code), // S'assurer que c'est une chaîne
      libelle: acte.libelle,
      libelle_complet: acte.libelle_complet,
      quantite: 1,
      prixUnitaire: acte.prix || acte.PRIX_UNITAIRE || 0,
      remboursable: acte.REMBOURSABLE !== false,
      tauxPriseEnCharge: acte.TAUX_PRISE_EN_CHARGE || 80,
      COD_ELEMENT: String(acte.code) // Pour l'API
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
    message.success(`Acte "${nouvelActe.libelle}" ajouté`);
  };

  const handleUpdateActe = (index, field, value) => {
    setNewDemande(prev => {
      const updatedActes = [...prev.actes];
      const oldActe = updatedActes[index];
      
      if (field === 'quantite' || field === 'prixUnitaire') {
        const oldTotal = oldActe.quantite * oldActe.prixUnitaire;
        const newValue = field === 'quantite' ? parseInt(value) || 1 : parseFloat(value) || 0;
        
        updatedActes[index] = { 
          ...oldActe, 
          [field]: newValue 
        };
        
        const newTotal = updatedActes[index].quantite * updatedActes[index].prixUnitaire;
        const nouveauMontantTotal = prev.MONTANT_TOTAL - oldTotal + newTotal;
        
        return {
          ...prev,
          actes: updatedActes,
          MONTANT_TOTAL: nouveauMontantTotal
        };
      }
      
      updatedActes[index] = { ...oldActe, [field]: value };
      return { ...prev, actes: updatedActes };
    });
  };

  const handleRemoveActe = (index) => {
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
  };

  // ==================== FONCTIONS PRINCIPALES ====================

  const loadDashboardData = useCallback(async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      // Charger les demandes sans filtre pour le dashboard
      const response = await prescriptionsAPI.getAll({
        page: 1,
        limit: 1000,
        stats: true
      });
      
      if (response.success) {
        // Calculer les statistiques à partir des données
        const demandes = response.prescriptions || [];
        
        const stats = {
          total: response.pagination?.total || demandes.length,
          enAttente: demandes.filter(d => (d.STATUT || d.statut) === 'En attente').length,
          validees: demandes.filter(d => (d.STATUT || d.statut) === 'Validee').length,
          executees: demandes.filter(d => (d.STATUT || d.statut) === 'Executee').length,
          rejetees: demandes.filter(d => (d.STATUT || d.statut) === 'Rejetee').length,
          annulees: demandes.filter(d => (d.STATUT || d.statut) === 'Annulée').length,
          montantTotal: demandes.reduce((sum, d) => sum + parseFloat(d.MONTANT_TOTAL || d.montant_total || 0), 0),
          tauxValidation: demandes.length > 0 ? 
            Math.round((demandes.filter(d => (d.STATUT || d.statut) === 'Validee' || (d.STATUT || d.statut) === 'Executee').length / demandes.length) * 100) : 0
        };
        
        setDashboardData(prev => ({ ...prev, ...stats }));
      }
    } catch (error) {
      console.error('Erreur dashboard:', error);
      // En cas d'erreur, utiliser les données existantes
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
          PRIORITE: d.PRIORITE || d.priorite || 'moyenne'
        }));
        
        setDemandes(formattedDemandes);
        
        // Calcul des statistiques pour le tableau de bord
        const stats = {
          total: formattedDemandes.length,
          enAttente: formattedDemandes.filter(d => d.STATUT === 'En attente').length,
          validees: formattedDemandes.filter(d => d.STATUT === 'Validee').length,
          executees: formattedDemandes.filter(d => d.STATUT === 'Executee').length,
          rejetees: formattedDemandes.filter(d => d.STATUT === 'Rejetee').length,
          annulees: formattedDemandes.filter(d => d.STATUT === 'Annulée').length,
          montantTotal: formattedDemandes.reduce((sum, d) => sum + (d.MONTANT_TOTAL || 0), 0),
          tauxValidation: formattedDemandes.length > 0 ? 
            Math.round((formattedDemandes.filter(d => d.STATUT === 'Validee' || d.STATUT === 'Executee').length / formattedDemandes.length) * 100) : 0
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

  const handleValidateDemande = async () => {
    if (!selectedDemande) return;
    
    setLoading(prev => ({ ...prev, validation: true }));
    try {
      // Utiliser la méthode correcte pour mettre à jour - envoyer le statut avec la bonne clé
      const response = await prescriptionsAPI.updateStatus(selectedDemande.COD_PRES, {
        statut: 'Validee', // Note: utiliser "statut" en minuscule comme l'API semble l'attendre
        DATE_VALIDATION: moment().format('YYYY-MM-DD HH:mm:ss')
      });
      
      if (response.success) {
        message.success('Demande validée avec succès');
        setActionModalVisible(false);
        loadDemandes();
        loadDashboardData();
      } else {
        message.error(response.message || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('❌ Erreur validation:', error);
      // Essayer avec une autre structure si la première échoue
      try {
        const response2 = await prescriptionsAPI.updateStatus(selectedDemande.COD_PRES, {
          STATUT: 'Validee', // Essayer avec majuscule aussi
          DATE_VALIDATION: moment().format('YYYY-MM-DD HH:mm:ss')
        });
        
        if (response2.success) {
          message.success('Demande validée avec succès');
          setActionModalVisible(false);
          loadDemandes();
          loadDashboardData();
        } else {
          message.error(response2.message || 'Erreur lors de la validation');
        }
      } catch (error2) {
        console.error('❌ Deuxième erreur validation:', error2);
        message.error('Erreur lors de la validation');
      }
    } finally {
      setLoading(prev => ({ ...prev, validation: false }));
    }
  };

  const handleRejectDemande = async (values) => {
    if (!selectedDemande) return;
    
    setLoading(prev => ({ ...prev, validation: true }));
    try {
      const response = await prescriptionsAPI.updateStatus(selectedDemande.COD_PRES, {
        statut: 'Rejetee', // Note: utiliser "statut" en minuscule
        MOTIF_REJET: values.motif,
        DETAILS_REJET: values.details,
        DATE_REJET: moment().format('YYYY-MM-DD HH:mm:ss')
      });
      
      if (response.success) {
        message.success('Demande rejetée avec succès');
        setActionModalVisible(false);
        loadDemandes();
        loadDashboardData();
      } else {
        message.error(response.message || 'Erreur lors du rejet');
      }
    } catch (error) {
      console.error('❌ Erreur rejet:', error);
      // Essayer avec une autre structure
      try {
        const response2 = await prescriptionsAPI.updateStatus(selectedDemande.COD_PRES, {
          STATUT: 'Rejetee', // Essayer avec majuscule
          MOTIF_REJET: values.motif,
          DETAILS_REJET: values.details,
          DATE_REJET: moment().format('YYYY-MM-DD HH:mm:ss')
        });
        
        if (response2.success) {
          message.success('Demande rejetée avec succès');
          setActionModalVisible(false);
          loadDemandes();
          loadDashboardData();
        } else {
          message.error(response2.message || 'Erreur lors du rejet');
        }
      } catch (error2) {
        console.error('❌ Deuxième erreur rejet:', error2);
        message.error('Erreur lors du rejet');
      }
    } finally {
      setLoading(prev => ({ ...prev, validation: false }));
    }
  };

  const handleSubmitDemande = async () => {
    setLoading(prev => ({ ...prev, creation: true }));
    try {
      // Vérifier que tous les actes ont un COD_ELEMENT valide (non numérique simple)
      const details = newDemande.actes.map(acte => {
        // Si le code est un simple chiffre, ajouter un préfixe
        const codeElement = /^\d+$/.test(acte.code) ? `ACTE-${acte.code}` : acte.code;
        
        return {
          COD_ELEMENT: codeElement,
          LIBELLE: acte.libelle,
          QUANTITE: acte.quantite,
          PRIX_UNITAIRE: acte.prixUnitaire,
          MONTANT_TOTAL: acte.quantite * acte.prixUnitaire,
          REMBOURSABLE: acte.remboursable ? 1 : 0,
          TAUX_PRISE_EN_CHARGE: acte.tauxPriseEnCharge || 80
        };
      });

      const demandeData = {
        COD_BEN: newDemande.COD_BEN,
        TYPE_PRESTATION: newDemande.TYPE_PRESTATION,
        COD_AFF: newDemande.COD_AFF || 'NSP',
        OBSERVATIONS: newDemande.OBSERVATIONS || '',
        STATUT: 'En attente',
        PRIORITE: newDemande.PRIORITE,
        MONTANT_TOTAL: newDemande.MONTANT_TOTAL,
        details: details,
        ORIGINE: 'Electronique'
      };
      
      console.log('📤 Données envoyées pour création:', demandeData);
      
      const response = await prescriptionsAPI.create(demandeData);
      
      if (response.success) {
        message.success(`Demande créée avec succès. Numéro: ${response.numero || response.COD_PRES}`);
        setCreationModalVisible(false);
        setNewDemande({
          COD_BEN: null,
          patientInfo: null,
          TYPE_PRESTATION: '',
          COD_AFF: '',
          codeAffectationInfo: null,
          OBSERVATIONS: '',
          hospitalisation: false,
          dateDebutHospitalisation: null,
          dateFinHospitalisation: null,
          dureeHospitalisation: null,
          actes: [],
          MONTANT_TOTAL: 0,
          tauxCouverture: 80,
          PRIORITE: 'moyenne',
          STATUT: 'En attente'
        });
        setCreationStep(0);
        loadDemandes();
        loadDashboardData();
      } else {
        message.error(response.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('❌ Erreur création demande:', error);
      message.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, creation: false }));
    }
  };

  // ==================== COLONNES ====================

  const columnsActes = [
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
          onChange={(value) => handleUpdateActe(index, 'quantite', value)}
          min={1}
          size="small"
          style={{ width: '60px' }}
        />
      )
    },
    {
      title: 'Prix unit. (FCFA)',
      key: 'prixUnitaire',
      width: 120,
      render: (_, record, index) => (
        <InputNumber
          value={record.prixUnitaire}
          onChange={(value) => handleUpdateActe(index, 'prixUnitaire', value)}
          min={0}
          size="small"
          style={{ width: '100px' }}
          formatter={value => `${parseFloat(value || 0).toFixed(2)}`}
          parser={value => parseFloat(value.replace(/[^\d.]/g, '')) || 0}
        />
      )
    },
    {
      title: 'Total (FCFA)',
      key: 'total',
      width: 120,
      render: (_, record) => (
        <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#1890ff' }}>
          {(record.quantite * record.prixUnitaire).toFixed(2)}
        </div>
      )
    },
    {
      title: 'Remb.',
      key: 'remboursable',
      width: 60,
      render: (_, record, index) => (
        <Checkbox
          checked={record.remboursable}
          onChange={(e) => handleUpdateActe(index, 'remboursable', e.target.checked)}
        />
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
          onClick={() => handleRemoveActe(index)}
          icon={<CloseCircleOutlined />}
        />
      )
    }
  ];

  const demandeColumns = [
    {
      title: 'N° Demande',
      dataIndex: 'NUM_PRESCRIPTION',
      key: 'NUM_PRESCRIPTION',
      width: 150,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Bénéficiaire',
      key: 'BENEFICIAIRE',
      width: 150,
      render: (_, record) => (
        <div>
          <div><strong>{record.NOM_BEN} {record.PRE_BEN}</strong></div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            {record.IDENTIFIANT_NATIONAL || '-'}
          </div>
        </div>
      )
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
      }
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
      render: (date) => date ? moment(date).format('DD/MM/YY') : '-'
    },
    {
      title: 'Montant (FCFA)',
      dataIndex: 'MONTANT_TOTAL',
      key: 'MONTANT_TOTAL',
      width: 120,
      render: (montant) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {parseFloat(montant || 0).toLocaleString('fr-FR')}
        </span>
      ),
      align: 'right'
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
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
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
  ];

  // ==================== RENDU ====================

  return (
    <div style={{ padding: '20px' }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SafetyCertificateOutlined style={{ marginRight: 8 }} />
            <span>Accords Préalables - Tableau de Bord</span>
          </div>
        }
        extra={
          <Button 
            icon={<SyncOutlined />} 
            onClick={() => {
              loadDashboardData();
              loadDemandes();
            }}
            loading={loading.dashboard || loading.demandes}
          >
            Actualiser
          </Button>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Total Demandes"
                value={dashboardData.total}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
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
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Montant Total"
                value={dashboardData.montantTotal}
                suffix="FCFA"
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#cf1322' }}
                formatter={(value) => `${parseFloat(value).toLocaleString('fr-FR')}`}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="En attente"
                value={dashboardData.enAttente}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreationModalVisible(true)}
          >
            Nouvelle Demande
          </Button>
          
          <Select
            defaultValue="demandes"
            style={{ width: 150 }}
            onChange={(value) => {
              if (value === 'en_attente') {
                setFiltres(prev => ({ ...prev, statut: 'En attente' }));
              } else if (value === 'validees') {
                setFiltres(prev => ({ ...prev, statut: 'Validee' }));
              } else if (value === 'rejetees') {
                setFiltres(prev => ({ ...prev, statut: 'Rejetee' }));
              } else {
                setFiltres(prev => ({ ...prev, statut: 'tous' }));
              }
            }}
          >
            <Option value="demandes">Toutes les Demandes</Option>
            <Option value="en_attente">En attente</Option>
            <Option value="validees">Validées</Option>
            <Option value="rejetees">Rejetées</Option>
          </Select>
        </div>

        <Tabs 
          defaultActiveKey="demandes"
          items={[
            {
              key: 'demandes',
              label: (
                <span>
                  <FileTextOutlined />
                  Demandes
                  {dashboardData.enAttente > 0 && (
                    <Badge 
                      count={dashboardData.enAttente} 
                      style={{ marginLeft: 8, backgroundColor: '#faad14' }} 
                    />
                  )}
                </span>
              ),
              children: (
                <Card>
                  <div style={{ marginBottom: 16 }}>
                    <Row gutter={16} align="middle">
                      <Col>
                        <DatePicker.RangePicker
                          value={[filtres.dateDebut, filtres.dateFin]}
                          onChange={(dates) => {
                            if (dates) {
                              setFiltres(prev => ({ ...prev, dateDebut: dates[0], dateFin: dates[1] }));
                            }
                          }}
                          style={{ marginRight: 16 }}
                        />
                      </Col>
                      <Col>
                        <Select
                          value={filtres.statut}
                          onChange={(value) => setFiltres(prev => ({ ...prev, statut: value }))}
                          style={{ width: 150, marginRight: 16 }}
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
                      <Col>
                        <Select
                          value={filtres.type}
                          onChange={(value) => setFiltres(prev => ({ ...prev, type: value }))}
                          style={{ width: 150, marginRight: 16 }}
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
                      <Col>
                        <Input
                          placeholder="Rechercher..."
                          value={filtres.search}
                          onChange={(e) => setFiltres(prev => ({ ...prev, search: e.target.value }))}
                          style={{ width: 200, marginRight: 16 }}
                          prefix={<SearchOutlined />}
                        />
                      </Col>
                      <Col>
                        <Button type="primary" onClick={loadDemandes} style={{ marginRight: 8 }}>
                          Appliquer
                        </Button>
                        <Button onClick={() => setFiltres({
                          dateDebut: moment().subtract(30, 'days'),
                          dateFin: moment(),
                          statut: 'tous',
                          type: 'tous',
                          search: '',
                          beneficiaire: ''
                        })}>
                          Réinitialiser
                        </Button>
                      </Col>
                    </Row>
                  </div>
                  
                  <Space style={{ marginBottom: 16 }}>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={async () => {
                        try {
                          message.info('Export fonctionnalité à implémenter');
                        } catch (error) {
                          console.error('Erreur export:', error);
                        }
                      }}
                    >
                      Exporter
                    </Button>
                    <Button
                      icon={<SyncOutlined />}
                      onClick={loadDemandes}
                      loading={loading.demandes}
                    >
                      Actualiser
                    </Button>
                  </Space>

                  <Table
                    columns={demandeColumns}
                    dataSource={demandes}
                    loading={loading.demandes}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `${total} demandes`
                    }}
                    scroll={{ x: 1300 }}
                  />
                </Card>
              ),
            },
            {
              key: 'statistiques',
              label: (
                <span>
                  <BarChartOutlined />
                  Statistiques
                </span>
              ),
              children: (
                <Card>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card 
                        title="Statut des Demandes"
                        size="small"
                      >
                        <div style={{ height: 300, position: 'relative' }}>
                          {demandes.length > 0 ? (
                            <Doughnut 
                              data={{
                                labels: ['En attente', 'Validées', 'Exécutées', 'Rejetées', 'Annulées'],
                                datasets: [{
                                  data: [
                                    demandes.filter(d => d.STATUT === 'En attente').length,
                                    demandes.filter(d => d.STATUT === 'Validee').length,
                                    demandes.filter(d => d.STATUT === 'Executee').length,
                                    demandes.filter(d => d.STATUT === 'Rejetee').length,
                                    demandes.filter(d => d.STATUT === 'Annulée').length
                                  ],
                                  backgroundColor: ['#faad14', '#52c41a', '#722ed1', '#f5222d', '#8c8c8c'],
                                  borderWidth: 1
                                }]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { position: 'right' }
                                }
                              }}
                            />
                          ) : (
                            <Empty description="Aucune donnée disponible" />
                          )}
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card 
                        title="Types de Prestations"
                        size="small"
                      >
                        <div style={{ height: 300, position: 'relative' }}>
                          {demandes.length > 0 ? (
                            <Pie 
                              data={{
                                labels: typesPrestation.map(t => t.label),
                                datasets: [{
                                  data: typesPrestation.map(t => 
                                    demandes.filter(d => d.TYPE_PRESTATION === t.value).length
                                  ),
                                  backgroundColor: ['#1890ff', '#52c41a', '#13c2c2', '#722ed1', '#f5222d', '#fa8c16', '#faad14'],
                                }]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { position: 'right' }
                                }
                              }}
                            />
                          ) : (
                            <Empty description="Aucune donnée disponible" />
                          )}
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </Card>
              )
            }
          ]}
        />
      </Card>

      {/* Modal Nouvelle Demande */}
      <Modal
        title="Nouvelle Demande d'Accord Préalable"
        open={creationModalVisible}
        onCancel={() => {
          setCreationModalVisible(false);
          setNewDemande({
            COD_BEN: null,
            patientInfo: null,
            TYPE_PRESTATION: '',
            COD_AFF: '',
            codeAffectationInfo: null,
            OBSERVATIONS: '',
            hospitalisation: false,
            dateDebutHospitalisation: null,
            dateFinHospitalisation: null,
            dureeHospitalisation: null,
            actes: [],
            MONTANT_TOTAL: 0,
            tauxCouverture: 80,
            PRIORITE: 'moyenne',
            STATUT: 'En attente'
          });
          setCreationStep(0);
        }}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Steps
          current={creationStep}
          style={{ marginBottom: 24 }}
        >
          <Step title="Patient & Affection" />
          <Step title="Actes médicaux" />
          <Step title="Validation" />
        </Steps>

        <Form form={creationForm} layout="vertical">
          {/* Étape 1: Patient & Affection */}
          {creationStep === 0 && (
            <>
              <Card title="Sélection du patient" style={{ marginBottom: 16 }}>
                <Form.Item label="Rechercher un patient" required>
                  <AutoComplete
                    value={searchPatientTerm}
                    onChange={(value) => {
                      setSearchPatientTerm(value);
                      searchPatients(value);
                    }}
                    options={patientResults.map(p => ({
                      value: p.id,
                      label: (
                        <div>
                          <div><strong>{p.nom} {p.prenom}</strong></div>
                          <div style={{ fontSize: '12px' }}>
                            ID: {p.identifiant} • Âge: {p.age || 'N/A'}
                          </div>
                        </div>
                      )
                    }))}
                    onSelect={(value) => {
                      const patient = patientResults.find(p => p.id === value);
                      if (patient) {
                        setNewDemande(prev => ({
                          ...prev,
                          COD_BEN: patient.COD_BEN,
                          patientInfo: patient
                        }));
                        setSearchPatientTerm(`${patient.nom} ${patient.prenom}`);
                        console.log('Patient sélectionné:', patient);
                        console.log('COD_BEN:', patient.COD_BEN);
                        console.log('newDemande après sélection:', newDemande);
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
                </Form.Item>

                {newDemande.patientInfo && (
                  <Alert
                    title="Patient sélectionné"
                    description={`${newDemande.patientInfo.nom} ${newDemande.patientInfo.prenom}`}
                    type="success"
                    showIcon
                    icon={<UserOutlined />}
                  />
                )}
              </Card>

              <Card title="Informations médicales">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Type de prestation" required>
                      <Select
                        value={newDemande.TYPE_PRESTATION}
                        onChange={(value) => {
                          console.log('Type de prestation sélectionné:', value);
                          setNewDemande(prev => ({ ...prev, TYPE_PRESTATION: value }));
                        }}
                        placeholder="Sélectionner"
                        style={{ width: '100%' }}
                      >
                        {typesPrestation.map(type => (
                          <Option key={type.value} value={type.value}>
                            {type.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Priorité">
                      <Select
                        value={newDemande.PRIORITE}
                        onChange={(value) => setNewDemande(prev => ({ ...prev, PRIORITE: value }))}
                        placeholder="Sélectionner"
                        style={{ width: '100%' }}
                      >
                        {priorities.map(priority => (
                          <Option key={priority.value} value={priority.value}>
                            <Tag color={priority.color}>{priority.label}</Tag>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Affection principale">
                  <Select
                    value={newDemande.COD_AFF}
                    onChange={(value) => {
                      const affection = affectionsList.find(a => a.code === value);
                      setNewDemande(prev => ({
                        ...prev,
                        COD_AFF: value,
                        codeAffectationInfo: affection || null
                      }));
                    }}
                    loading={loading.affections}
                    placeholder="Sélectionnez l'affection"
                    showSearch
                    filterOption={false}
                    onSearch={(value) => {
                      setSearchAffectionTerm(value);
                      loadAffections(value);
                    }}
                    style={{ width: '100%' }}
                  >
                    {affectionsList.map(affection => (
                      <Option key={affection.code} value={affection.code}>
                        {affection.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Remarques supplémentaires">
                  <TextArea
                    value={newDemande.OBSERVATIONS}
                    onChange={(e) => setNewDemande(prev => ({ ...prev, OBSERVATIONS: e.target.value }))}
                    rows={3}
                    placeholder="Informations complémentaires..."
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              </Card>
            </>
          )}

          {/* Étape 2: Actes médicaux */}
          {creationStep === 1 && (
            <Card title="Actes et prestations">
              <Alert
                title="Recherche d'actes médicaux"
                description="Recherchez des actes, médicaments ou prestations dans la base de données réelle."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Form.Item label="Rechercher un acte, médicament ou prestation">
                <AutoComplete
                  value={searchActeTerm}
                  onChange={(value) => {
                    setSearchActeTerm(value);
                    searchActes(value);
                  }}
                  options={acteResults.map(a => ({
                    value: a.id,
                    label: (
                      <div style={{ padding: '8px 0' }}>
                        <div><strong>{a.libelle}</strong></div>
                        {a.libelle_complet && a.libelle_complet !== a.libelle && (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {a.libelle_complet}
                          </div>
                        )}
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#1890ff',
                          fontWeight: 'bold',
                          marginTop: '4px'
                        }}>
                          {parseFloat(a.prix || 0).toFixed(2)} FCFA
                        </div>
                        <div style={{ fontSize: '11px', color: '#52c41a' }}>
                          Code: {a.code} • Catégorie: {a.CATEGORIE || 'Général'}
                        </div>
                      </div>
                    )
                  }))}
                  onSelect={(value) => {
                    const acte = acteResults.find(a => a.id === value);
                    if (acte) {
                      handleAddActe(acte);
                    }
                  }}
                  placeholder="Ex: Consultation, Radiographie, Paracétamol..."
                  style={{ width: '100%' }}
                >
                  <Input
                    prefix={<SearchOutlined />}
                    suffix={loading.actes && <Spin size="small" />}
                  />
                </AutoComplete>
              </Form.Item>

              {newDemande.actes.length === 0 ? (
                <Empty
                  description="Aucun acte ajouté. Recherchez et ajoutez des actes médicaux."
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <div style={{ marginTop: 16 }}>
                  <Alert
                    title={`${newDemande.actes.length} acte(s) ajouté(s)`}
                    description="Vous pouvez modifier les quantités et les prix directement dans le tableau."
                    type="success"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  <div style={{ overflowX: 'auto' }}>
                    <Table
                      dataSource={newDemande.actes}
                      columns={columnsActes}
                      pagination={false}
                      size="small"
                      rowKey="id"
                      scroll={{ x: 600 }}
                      footer={() => (
                        <div style={{ 
                          textAlign: 'right', 
                          fontWeight: 'bold', 
                          fontSize: '16px',
                          padding: '10px',
                          backgroundColor: '#fafafa',
                          borderTop: '1px solid #f0f0f0'
                        }}>
                          Total: <span style={{ color: '#1890ff' }}>{newDemande.MONTANT_TOTAL.toFixed(2)} FCFA</span>
                        </div>
                      )}
                    />
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Étape 3: Validation */}
          {creationStep === 2 && (
            <Card title="Validation de la demande">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Patient" span={2}>
                  <strong>
                    {newDemande.patientInfo ? 
                      `${newDemande.patientInfo.nom} ${newDemande.patientInfo.prenom}` : 
                      'Non spécifié'
                    }
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Type de prestation">
                  {newDemande.TYPE_PRESTATION || 'Non spécifié'}
                </Descriptions.Item>
                <Descriptions.Item label="Priorité">
                  <Tag color={
                    newDemande.PRIORITE === 'haute' ? 'red' :
                    newDemande.PRIORITE === 'moyenne' ? 'orange' : 'blue'
                  }>
                    {newDemande.PRIORITE}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Affection">
                  {newDemande.codeAffectationInfo ? 
                    `${newDemande.codeAffectationInfo.libelle}` : 
                    'Non spécifiée'
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Nombre d'actes">
                  {newDemande.actes.length}
                </Descriptions.Item>
                <Descriptions.Item label="Montant total" span={2}>
                  <div style={{ textAlign: 'right' }}>
                    <Typography.Title level={3} style={{ color: '#1890ff', margin: 0 }}>
                      {newDemande.MONTANT_TOTAL.toFixed(2)} FCFA
                    </Typography.Title>
                  </div>
                </Descriptions.Item>
              </Descriptions>

              {newDemande.actes.length > 0 && (
                <Card size="small" title="Détail des actes" style={{ marginTop: 16 }}>
                  <Table
                    dataSource={newDemande.actes}
                    columns={[
                      { title: 'Acte', dataIndex: 'libelle', key: 'libelle' },
                      { title: 'Quantité', dataIndex: 'quantite', key: 'quantite', align: 'center' },
                      { 
                        title: 'Prix unitaire', 
                        key: 'prixUnitaire', 
                        align: 'right',
                        render: (_, record) => `${record.prixUnitaire.toFixed(2)} FCFA`
                      },
                      { 
                        title: 'Total', 
                        key: 'total',
                        align: 'right',
                        render: (_, record) => (
                          <strong>
                            {(record.quantite * record.prixUnitaire).toFixed(2)} FCFA
                          </strong>
                        )
                      }
                    ]}
                    pagination={false}
                    size="small"
                  />
                </Card>
              )}

              <Alert
                title="Dernière vérification"
                description="Vérifiez les informations avant de soumettre. La demande passera en statut 'En attente' de validation."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Card>
          )}
        </Form>

        <Divider />

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button 
            onClick={() => {
              if (creationStep > 0) {
                setCreationStep(prev => prev - 1);
              } else {
                setCreationModalVisible(false);
              }
            }} 
            style={{ marginRight: 8 }}
            disabled={loading.creation}
          >
            {creationStep === 0 ? 'Annuler' : 'Précédent'}
          </Button>
          
          {creationStep < 2 ? (
            <Button 
              type="primary" 
              onClick={() => {
                // Log de débogage
                console.log('État actuel de newDemande:', newDemande);
                console.log('COD_BEN:', newDemande.COD_BEN);
                console.log('TYPE_PRESTATION:', newDemande.TYPE_PRESTATION);
                console.log('actes:', newDemande.actes);
                
                if (creationStep === 0) {
                  if (!newDemande.COD_BEN) {
                    message.warning('Veuillez sélectionner un patient');
                    return;
                  }
                  if (!newDemande.TYPE_PRESTATION) {
                    message.warning('Veuillez sélectionner un type de prestation');
                    return;
                  }
                }
                
                if (creationStep === 1 && newDemande.actes.length === 0) {
                  message.warning('Veuillez ajouter au moins un acte médical');
                  return;
                }
                
                setCreationStep(prev => prev + 1);
              }}
              disabled={
                (creationStep === 0 && (!newDemande.COD_BEN || !newDemande.TYPE_PRESTATION)) ||
                (creationStep === 1 && newDemande.actes.length === 0)
              }
            >
              Continuer
            </Button>
          ) : (
            <Button 
              type="primary" 
              onClick={handleSubmitDemande}
              loading={loading.creation}
              disabled={!newDemande.COD_BEN || newDemande.actes.length === 0}
              icon={<CheckCircleOutlined />}
            >
              Soumettre la Demande
            </Button>
          )}
        </div>
      </Modal>

      {/* Modal Détails Demande */}
      <Modal
        title="Détails de la Demande"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedDemande && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Numéro" span={2}>
                <strong>{selectedDemande.NUM_PRESCRIPTION}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Bénéficiaire">
                {selectedDemande.NOM_BEN} {selectedDemande.PRE_BEN}
              </Descriptions.Item>
              <Descriptions.Item label="Identifiant">
                {selectedDemande.IDENTIFIANT_NATIONAL || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Type de prestation">
                {selectedDemande.TYPE_PRESTATION}
              </Descriptions.Item>
              <Descriptions.Item label="Affection">
                {selectedDemande.LIB_AFF || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Date">
                {moment(selectedDemande.DATE_PRESCRIPTION).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Montant">
                <strong>{selectedDemande.MONTANT_TOTAL?.toLocaleString('fr-FR')} FCFA</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag 
                  color={statuts.find(s => s.value === selectedDemande.STATUT)?.color || 'default'}
                  icon={statuts.find(s => s.value === selectedDemande.STATUT)?.icon}
                >
                  {statuts.find(s => s.value === selectedDemande.STATUT)?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priorité">
                <Tag color={
                  selectedDemande.PRIORITE === 'haute' ? 'red' :
                  selectedDemande.PRIORITE === 'moyenne' ? 'orange' : 'blue'
                }>
                  {selectedDemande.PRIORITE}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Observations" span={2}>
                {selectedDemande.OBSERVATIONS || 'Aucune'}
              </Descriptions.Item>
            </Descriptions>

            {selectedDemande.details && selectedDemande.details.length > 0 && (
              <Card size="small" title="Détail des actes" style={{ marginTop: 16 }}>
                <Table
                  dataSource={selectedDemande.details}
                  columns={[
                    { title: 'Acte', dataIndex: 'LIB_ELEMENT', key: 'LIB_ELEMENT' },
                    { title: 'Quantité', dataIndex: 'QUANTITE', key: 'QUANTITE', align: 'center' },
                    { 
                      title: 'Prix unitaire', 
                      key: 'PRIX_UNITAIRE', 
                      align: 'right',
                      render: (_, record) => `${parseFloat(record.PRIX_UNITAIRE || 0).toFixed(2)} FCFA`
                    },
                    { 
                      title: 'Total', 
                      key: 'MONTANT_TOTAL',
                      align: 'right',
                      render: (_, record) => (
                        <strong>
                          {parseFloat(record.MONTANT_TOTAL || 0).toFixed(2)} FCFA
                        </strong>
                      )
                    }
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>
            )}
          </>
        )}
      </Modal>

      {/* Modal Action Demande */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {selectedAction === 'valider' && <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />}
            {selectedAction === 'rejeter' && <CloseCircleOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />}
            <span>
              {selectedAction === 'valider' && 'Valider la Demande'}
              {selectedAction === 'rejeter' && 'Rejeter la Demande'}
            </span>
          </div>
        }
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false);
          actionForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setActionModalVisible(false)}>
            Annuler
          </Button>,
          <Button
            key="submit"
            type={selectedAction === 'valider' ? 'primary' : 'danger'}
            loading={loading.validation}
            onClick={() => {
              if (selectedAction === 'valider') {
                handleValidateDemande();
              } else if (selectedAction === 'rejeter') {
                actionForm.validateFields().then(handleRejectDemande);
              }
            }}
          >
            {selectedAction === 'valider' ? 'Valider' : 'Rejeter'}
          </Button>
        ]}
        width={selectedAction === 'valider' ? 500 : 600}
        destroyOnClose
      >
        {selectedAction === 'valider' ? (
          <div>
            <Alert
              title="Confirmation"
              description="Cette action marquera la demande comme validée et permettra son exécution."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            {selectedDemande && (
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Numéro">
                  <strong>{selectedDemande.NUM_PRESCRIPTION}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Bénéficiaire">
                  {selectedDemande.NOM_BEN} {selectedDemande.PRE_BEN}
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                  {selectedDemande.TYPE_PRESTATION}
                </Descriptions.Item>
                <Descriptions.Item label="Montant">
                  {selectedDemande.MONTANT_TOTAL?.toLocaleString('fr-FR')} FCFA
                </Descriptions.Item>
              </Descriptions>
            )}
          </div>
        ) : (
          <Form
            form={actionForm}
            layout="vertical"
          >
            <Form.Item
              name="motif"
              label="Motif du rejet"
              rules={[{ required: true, message: 'Ce champ est obligatoire' }]}
            >
              <Select placeholder="Sélectionnez une raison">
                <Option value="Documentation insuffisante">Documentation insuffisante</Option>
                <Option value="Affection non couverte">Affection non couverte</Option>
                <Option value="Montant excessif">Montant excessif</Option>
                <Option value="Procédure non respectée">Procédure non respectée</Option>
                <Option value="Autre">Autre</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="details"
              label="Détails supplémentaires"
            >
              <TextArea rows={3} placeholder="Précisez les raisons..." />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default AccordsPrealables;