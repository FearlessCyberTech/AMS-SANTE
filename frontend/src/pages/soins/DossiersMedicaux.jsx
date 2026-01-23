// src/pages/DossiersMedicauxPage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Modal,
  Space,
  Form,
  message,
  Statistic,
  Descriptions,
  Timeline,
  Tabs,
  Badge,
  Avatar,
  Progress,
  Empty,
  Spin,
  Alert,
  Tooltip,
  List,
  Divider,
  Collapse,
  Typography,
  Steps,
  Result,
  Breadcrumb,
  Switch,
  Dropdown,
  Menu
} from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  DownloadOutlined,
  PlusOutlined,
  EyeOutlined,
  HistoryOutlined,
  TeamOutlined,
  HeartOutlined,
  FilePdfOutlined,
  SyncOutlined,
  FilterOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
  ExperimentOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  DashboardOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  HeartTwoTone,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  ContainerOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  WhatsAppOutlined,
  ShareAltOutlined,
  CloudDownloadOutlined,
  SecurityScanOutlined,
  AuditOutlined,
  FolderViewOutlined,
  BarcodeOutlined,
  QrcodeOutlined,
  SettingOutlined,
  MoreOutlined,
  InsuranceOutlined,
  KeyOutlined,
  LockOutlined
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/fr';
import { useAuth } from '../../contexts/AuthContext'; // Import du contexte d'authentification
import api, { dossiersMedicauxAPI, beneficiairesAPI, consultationsAPI, prescriptionsAPI, facturationAPI,
  antecedentsAPI,
  allergiesAPI } from '../../services/api';
import './DossiersMedicaux.css';

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

// Informations de l'entreprise
const COMPANY_INFO = {
  name: "COURTIER D'ASSURANCES",
  address: "Bonapriso Rue VASNITEX, Immeuble ATLANTIS",
  city: "BP 4962 Douala – Cameroun",
  phone: "2 33 42 08 74 / 6 99 90 60 88",
  email: "contact@courtier-assurances.cm",
  website: "www.courtier-assurances.cm",
  slogan: "Votre santé, notre priorité",
  logo: null
};

const DossiersMedicauxPage = () => {
  // Utiliser le contexte d'authentification
  const { user, hasRole, isAuthenticated } = useAuth();
  
  // États principaux
  const [loading, setLoading] = useState(false);
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [selectedBeneficiaire, setSelectedBeneficiaire] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    sexe: null,
    statut_ace: null,
    groupe_sanguin: null,
    type_beneficiaire: null
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // États pour les modals
  const [dossierModalVisible, setDossierModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportType, setExportType] = useState('pdf');
  const [stats, setStats] = useState({
    totalPatients: 0,
    consultationsAujourdhui: 0,
    nouveauxPatientsMois: 0,
    tauxCompletude: 0
  });
  
  // États pour les fonctionnalités avancées
  const [quickStats, setQuickStats] = useState({
    todayConsultations: 0,
    pendingDocuments: 0,
    urgentCases: 0,
    complianceScore: 0
  });
  
  const [activeFilterPanel, setActiveFilterPanel] = useState(false);

  // États pour la fonctionnalité de code d'accès
  const [generatedCode, setGeneratedCode] = useState('');
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  
  // États pour les options d'exportation
  const [exportOptions, setExportOptions] = useState({
    includeConsultations: true,
    includePrescriptions: true,
    includeFactures: true,
    includeAntecedents: true,
    includeExamens: true,
    includeNotes: true,
    includeAllergies: true,
    includeTraitements: true,
    includeHospitalisations: true,
    includeCompanyInfo: true,
    includeWatermark: true,
    includeQRCode: true
  });

  // Vérifier le rôle de l'utilisateur
  const isSuperAdmin = hasRole(['SuperAdmin', 'superadmin', 'admin', 'ADMIN']);
  const showCodeButton = isSuperAdmin && isAuthenticated();

  // Vérifier les autorisations
  const checkPermissions = () => {
    if (!isAuthenticated()) {
      message.error('Veuillez vous connecter pour accéder à cette fonctionnalité');
      return false;
    }
    return true;
  };

  // Calculer les statistiques rapides
  const calculateQuickStats = (beneficiairesList) => {
    const today = moment().startOf('day');
    
    const todayConsultations = beneficiairesList.filter(b => 
      b.derniere_consultation && moment(b.derniere_consultation).isSame(today, 'day')
    ).length;
    
    const urgentCases = beneficiairesList.filter(b => 
      b.taux_couverture < 50 && b.derniere_consultation && 
      moment(b.derniere_consultation).isBefore(moment().subtract(3, 'months'))
    ).length;
    
    const complianceScore = beneficiairesList.length > 0 ? 
      Math.round((beneficiairesList.filter(b => b.taux_couverture >= 80).length / beneficiairesList.length) * 100) : 0;
    
    const pendingDocuments = beneficiairesList.filter(b => !b.derniere_consultation).length;
    
    return {
      todayConsultations,
      pendingDocuments,
      urgentCases,
      complianceScore
    };
  };

  // Charger la liste des bénéficiaires
  const loadBeneficiaires = useCallback(async (page = 1, search = '', currentFilters = {}) => {
    // Vérifier l'authentification
    if (!checkPermissions()) return;
    
    setLoading(true);
    try {
      const response = await beneficiairesAPI.searchAdvanced(search, currentFilters, pagination.pageSize, page);
      
      if (response.success) {
        const beneficiairesList = response.beneficiaires || [];
        
        const transformedBeneficiaires = beneficiairesList.map(ben => ({
          id: ben.id || ben.ID_BEN,
          identifiant: ben.identifiant_national || ben.IDENTIFIANT_NATIONAL || `BEN${ben.id || ben.ID_BEN}`.padStart(6, '0'),
          nom: ben.nom || ben.NOM_BEN,
          prenom: ben.prenom || ben.PRE_BEN,
          sexe: ben.sexe || ben.SEX_BEN,
          age: ben.age || (ben.date_naissance ? moment().diff(moment(ben.date_naissance), 'years') : (ben.AGE || 0)),
          date_naissance: ben.date_naissance || ben.NAI_BEN,
          telephone: ben.telephone || ben.TELEPHONE_MOBILE || ben.TELEPHONE,
          email: ben.email || ben.EMAIL,
          type_paiement: ben.type_paiement || ben.TYPE_PAIEMENT || 'CASH',
          profession: ben.profession || ben.PROFESSION,
          groupe_sanguin: ben.groupe_sanguin || ben.GROUPE_SANGUIN,
          taux_couverture: ben.taux_couverture || ben.TAUX_COUVERTURE || 0,
          adresse: ben.adresse || ben.ADRESSE,
          ville: ben.ville || ben.VILLE,
          code_postal: ben.code_postal || ben.CODE_POSTAL,
          pays: ben.pays || ben.PAYS || 'Cameroun',
          assureur: ben.assureur || ben.ASSUREUR,
          num_police: ben.num_police || ben.NUM_POLICE,
          statut_assurance: ben.statut_assurance || ben.STATUT_ASSURANCE || 'ACTIVE',
          statut_ace: ben.statut_ace || ben.STATUT_ACE,
          type_beneficiaire: ben.type_beneficiaire || 
            (ben.statut_ace ? 
              (ben.statut_ace === 'CONJOINT' ? 'Conjoint' : 
               ben.statut_ace === 'ENFANT' ? 'Enfant' : 
               ben.statut_ace === 'ASCENDANT' ? 'Ascendant' : 'Assuré Principal') : 
              'Assuré Principal'),
          derniere_consultation: ben.derniere_consultation || null,
          antecedents_medicaux: ben.antecedents_medicaux || ben.ANTECEDENTS_MEDICAUX || [],
          allergies: ben.allergies || ben.ALLERGIES || [],
          traitements_en_cours: ben.traitements_en_cours || ben.TRAITEMENTS_EN_COURS || []
        })) || [];
        
        setBeneficiaires(transformedBeneficiaires);
        
        const newQuickStats = calculateQuickStats(transformedBeneficiaires);
        setQuickStats(newQuickStats);
        
        setStats({
          totalPatients: transformedBeneficiaires.length,
          consultationsAujourdhui: newQuickStats.todayConsultations,
          nouveauxPatientsMois: Math.floor(transformedBeneficiaires.length * 0.1),
          tauxCompletude: newQuickStats.complianceScore
        });
        
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.total || response.count || transformedBeneficiaires.length || 0,
          pageSize: pagination.pageSize
        }));
        
        if (transformedBeneficiaires.length === 0 && search) {
          message.info('Aucun bénéficiaire trouvé pour cette recherche');
        }
      } else {
        message.error(response.message || 'Erreur lors du chargement des bénéficiaires');
        setBeneficiaires([]);
        setPagination(prev => ({ ...prev, total: 0 }));
        
        setStats({
          totalPatients: 0,
          consultationsAujourdhui: 0,
          nouveauxPatientsMois: 0,
          tauxCompletude: 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement bénéficiaires:', error);
      
      let errorMessage = 'Erreur de connexion au serveur';
      if (error.message && error.message.includes('Network Error')) {
        errorMessage = 'Serveur inaccessible. Vérifiez votre connexion réseau.';
      } else if (error.message && error.message.includes('401')) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (error.message && error.message.includes('404')) {
        errorMessage = 'Service de recherche non disponible.';
      }
      
      message.error(errorMessage);
      setBeneficiaires([]);
      setPagination(prev => ({ ...prev, total: 0 }));
      
      setStats({
        totalPatients: 0,
        consultationsAujourdhui: 0,
        nouveauxPatientsMois: 0,
        tauxCompletude: 0
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  // Initialisation
  useEffect(() => {
    if (isAuthenticated()) {
      loadBeneficiaires(1, '', filters);
      if (isSuperAdmin) {
        message.success('Mode SuperAdmin activé - Accès complet aux dossiers');
      }
    } else {
      message.warning('Veuillez vous connecter pour accéder aux dossiers médicaux');
    }
  }, [isAuthenticated()]);

  // Fonction pour générer un code d'accès
  const generateAccessCode = useCallback((beneficiaire) => {
    if (!beneficiaire) return;
    
    // Vérifier si l'utilisateur est SuperAdmin
    if (!isSuperAdmin) {
      message.error('Seuls les SuperAdmin peuvent générer des codes d\'accès');
      return;
    }
    
    // Générer un code alphanumérique de 8 caractères
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setGeneratedCode(code);
    setSelectedBeneficiaire(beneficiaire);
    
    // Afficher le modal avec le code généré
    Modal.success({
      title: (
        <Space>
          <KeyOutlined style={{ color: '#52c41a' }} />
          <span>Code d'accès généré</span>
        </Space>
      ),
      content: (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ marginBottom: 20 }}>
            <Text strong>{beneficiaire.nom} {beneficiaire.prenom}</Text>
            <br />
            <Text type="secondary">ID: {beneficiaire.identifiant}</Text>
          </div>
          
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#1890ff',
            letterSpacing: '4px',
            margin: '20px 0',
            background: '#f0f5ff',
            padding: '15px',
            borderRadius: '8px',
            border: '2px dashed #1890ff'
          }}>
            {code}
          </div>
          
          <Alert
            message="Informations importantes"
            description={
              <div style={{ textAlign: 'left' }}>
                <p>• Ce code est unique pour <strong>{beneficiaire.nom} {beneficiaire.prenom}</strong></p>
                <p>• Il expirera automatiquement dans 24 heures</p>
                <p>• Partagez-le uniquement avec les personnes autorisées</p>
                <p>• Ne stockez pas ce code dans un endroit non sécurisé</p>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 20 }}
          />
          
          <Space>
            <Button 
              type="primary" 
              icon={<QrcodeOutlined />}
              onClick={() => {
                message.info('Fonctionnalité QR Code à implémenter');
                Modal.destroyAll();
              }}
            >
              Générer QR Code
            </Button>
            <Button 
              type="default"
              icon={<ShareAltOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(`Code d'accès dossier médical: ${code}`);
                message.success('Code copié dans le presse-papier');
              }}
            >
              Copier le code
            </Button>
          </Space>
        </div>
      ),
      width: 500,
      okText: 'Fermer',
      onOk: () => {
        // Enregistrer le code dans le backend (à implémenter)
        // api.saveAccessCode(beneficiaire.id, code);
        message.success('Code généré avec succès');
      }
    });
  }, [isSuperAdmin]);

  // Fonction pour vérifier un code d'accès
  const verifyAccessCode = useCallback(async (beneficiaireId, code) => {
    setVerifyingCode(true);
    try {
      // Simuler la vérification du code
      // Dans une implémentation réelle, appeler une API
      // const response = await api.verifyAccessCode(beneficiaireId, code);
      
      // Pour l'exemple, accepter tout code de 8 caractères
      const isValid = code && code.length === 8;
      
      if (isValid) {
        message.success('Code vérifié avec succès');
        setAccessCodeInput('');
        return true;
      } else {
        message.error('Code invalide ou expiré');
        return false;
      }
    } catch (error) {
      console.error('Erreur vérification code:', error);
      message.error('Erreur lors de la vérification du code');
      return false;
    } finally {
      setVerifyingCode(false);
    }
  }, []);

  // Ouvrir le modal du dossier avec vérification de code si nécessaire
  const openDossierModal = async (beneficiaire) => {
    // Vérifier l'authentification
    if (!checkPermissions()) return;
    
    setSelectedBeneficiaire(beneficiaire);
    
    // Si l'utilisateur est SuperAdmin, accès direct
    if (isSuperAdmin) {
      await loadDossierData(beneficiaire);
      setDossierModalVisible(true);
    } else {
      // Pour les autres utilisateurs, demander le code
      Modal.confirm({
        title: (
          <Space>
            <LockOutlined style={{ color: '#1890ff' }} />
            <span>Accès sécurisé au dossier médical</span>
          </Space>
        ),
        content: (
          <div>
            <Alert
              message="Accès restreint"
              description={
                <div>
                  <p>Pour accéder au dossier médical de :</p>
                  <p style={{ textAlign: 'center', margin: '10px 0' }}>
                    <strong style={{ fontSize: '16px' }}>{beneficiaire.nom} {beneficiaire.prenom}</strong>
                    <br />
                    <Text type="secondary">ID: {beneficiaire.identifiant}</Text>
                  </p>
                  <p>veuillez saisir le code d'accès fourni par un SuperAdmin.</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />
            
            <Form.Item
              label="Code d'accès"
              rules={[{ required: true, message: 'Veuillez saisir le code' }]}
            >
              <Input.Password
                placeholder="Entrez le code à 8 caractères"
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value)}
                maxLength={8}
                size="large"
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Le code expire après 24 heures
              </Text>
            </div>
          </div>
        ),
        okText: 'Valider',
        cancelText: 'Annuler',
        onOk: async () => {
          if (!accessCodeInput || accessCodeInput.length !== 8) {
            message.error('Le code doit contenir 8 caractères');
            return Promise.reject();
          }
          
          const isValid = await verifyAccessCode(beneficiaire.id, accessCodeInput);
          if (isValid) {
            await loadDossierData(beneficiaire);
            setDossierModalVisible(true);
          } else {
            return Promise.reject();
          }
        },
        onCancel: () => {
          setAccessCodeInput('');
        }
      });
    }
  };

  // Fonction pour charger les données du dossier
  const loadDossierData = async (beneficiaire) => {
    setLoading(true);
    setSelectedTab('overview');
    
    try {
      const [
        dossierResponse,
        consultationsResponse,
        prescriptionsResponse,
        facturationResponse,
        antecedentsResponse,
        allergiesResponse
      ] = await Promise.all([
        dossiersMedicauxAPI.getDossierPatient(beneficiaire.id),
        consultationsAPI.getByPatientId(beneficiaire.id),
        prescriptionsAPI.getByPatientId(beneficiaire.id),
        facturationAPI.getFacturesByPatientId(beneficiaire.id),
        antecedentsAPI.getByPatientId(beneficiaire.id),
        allergiesAPI.getByPatientId(beneficiaire.id)
      ]);

      const dossierComplet = {
        patient: {
          informations: {
            id: beneficiaire.id,
            nom: beneficiaire.nom,
            prenom: beneficiaire.prenom,
            sexe: beneficiaire.sexe,
            age: beneficiaire.age,
            date_naissance: beneficiaire.date_naissance,
            telephone: beneficiaire.telephone,
            email: beneficiaire.email,
            type_paiement: beneficiaire.type_paiement || 'CASH',
            profession: beneficiaire.profession,
            groupe_sanguin: beneficiaire.groupe_sanguin,
            taux_couverture: beneficiaire.taux_couverture || 0,
            identifiant: beneficiaire.identifiant,
            adresse: beneficiaire.adresse,
            ville: beneficiaire.ville,
            code_postal: beneficiaire.code_postal,
            pays: beneficiaire.pays,
            assureur: beneficiaire.assureur,
            num_police: beneficiaire.num_police,
            statut_assurance: beneficiaire.statut_assurance,
            statut_ace: beneficiaire.statut_ace,
            type_beneficiaire: beneficiaire.type_beneficiaire
          }
        },
        consultations: {
          liste: consultationsResponse.success ? 
            consultationsResponse.consultations || consultationsResponse.data || [] : [],
          statistiques: {
            total: consultationsResponse.success ? 
              (consultationsResponse.consultations || []).length : 0,
            urgentes: consultationsResponse.success ? 
              (consultationsResponse.consultations || []).filter(c => c.URGENT === 1).length : 0
          }
        },
        prescriptions: {
          liste: prescriptionsResponse.success ? 
            prescriptionsResponse.prescriptions || prescriptionsResponse.data || [] : [],
          statistiques: {
            total: prescriptionsResponse.success ? 
              (prescriptionsResponse.prescriptions || []).length : 0
          }
        },
        facturation: {
          factures: facturationResponse.success ? 
            facturationResponse.factures || facturationResponse.data || [] : [],
          statistiques: {
            total: facturationResponse.success ? 
              (facturationResponse.factures || []).length : 0
          }
        },
        antecedents: {
          medicaux: antecedentsResponse.success ? 
            antecedentsResponse.antecedents || antecedentsResponse.data || [] : [],
          detailles: []
        },
        allergies: {
          liste: allergiesResponse.success ? 
            allergiesResponse.allergies || allergiesResponse.data || [] : [],
          detailles: []
        },
        examens: [],
        hospitalisations: [],
        traitements: {
          en_cours: []
        },
        notes: []
      };

      // Calculer le rapport
      dossierComplet.rapport = {
        patient: {
          nom_complet: `${dossierComplet.patient.informations.nom} ${dossierComplet.patient.informations.prenom}`,
          age: dossierComplet.patient.informations.age,
          sexe: dossierComplet.patient.informations.sexe === 'M' ? 'Masculin' : 
                dossierComplet.patient.informations.sexe === 'F' ? 'Féminin' : 'Non spécifié',
          type_prise_en_charge: dossierComplet.patient.informations.type_paiement || 'Non spécifié',
          taux_couverture: dossierComplet.patient.informations.taux_couverture || 0,
          type_beneficiaire: dossierComplet.patient.informations.type_beneficiaire || 'Non spécifié'
        },
        indicateurs: {
          consultations_total: dossierComplet.consultations.statistiques.total,
          consultations_urgentes: dossierComplet.consultations.statistiques.urgentes,
          prescriptions_total: dossierComplet.prescriptions.statistiques.total,
          factures_total: dossierComplet.facturation.statistiques.total,
          montant_restant: dossierComplet.facturation.factures
            .filter(f => f && f.statut !== 'Payée')
            .reduce((sum, f) => sum + (parseFloat(f.MONTANT_TOTAL || 0) - parseFloat(f.MONTANT_PAYE || 0)), 0)
        },
        score_completude: calculateCompletudeScore(dossierComplet),
        alertes: generateAlerts(dossierComplet),
        recommandations: generateRecommendations(dossierComplet)
      };
      
      setDossier(dossierComplet);
      
      if (dossierResponse.success) {
        message.success('Dossier médical chargé avec succès');
      }
      
    } catch (error) {
      console.error('Erreur chargement dossier:', error);
      message.error('Erreur lors du chargement du dossier médical');
      
      // Créer un dossier vide en fallback
      const emptyDossier = createEmptyDossier(beneficiaire);
      setDossier(emptyDossier);
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le modal d'historique
  const openHistoryModal = async (beneficiaire) => {
    if (!checkPermissions()) return;
    
    setSelectedBeneficiaire(beneficiaire);
    setHistoryLoading(true);
    setHistoryModalVisible(true);
    
    try {
      const dossierResponse = await dossiersMedicauxAPI.getDossierPatient(beneficiaire.id);
      let dossierData;
      
      if (dossierResponse.success && dossierResponse.dossier) {
        dossierData = dossierResponse.dossier;
      } else {
        dossierData = dossier || createEmptyDossier(beneficiaire);
      }
      
      const historyItems = processDossierForHistory(dossierData);
      setHistoryData(historyItems);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      const mockItems = processDossierForHistory(createEmptyDossier(beneficiaire));
      setHistoryData(mockItems);
      message.warning('Historique en mode démonstration');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Ouvrir le modal d'export
  const openExportModal = (beneficiaire) => {
    if (!checkPermissions()) return;
    
    setSelectedBeneficiaire(beneficiaire);
    setExportModalVisible(true);
  };

  // Gestionnaires de recherche et filtres
  const handleSearch = (value) => {
    setSearchTerm(value);
    loadBeneficiaires(1, value, filters);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters };
    
    if (value === undefined || value === null || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    setFilters(newFilters);
    loadBeneficiaires(1, searchTerm, newFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      sexe: null,
      statut_ace: null,
      groupe_sanguin: null,
      type_beneficiaire: null
    };
    setFilters(resetFilters);
    setSearchTerm('');
    loadBeneficiaires(1, '', resetFilters);
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    const { current, pageSize } = newPagination;
    
    setPagination(prev => ({
      ...prev,
      current: current,
      pageSize: pageSize
    }));
    
    loadBeneficiaires(current, searchTerm, filters);
    message.info(`Page ${current} - ${pageSize} bénéficiaires par page`);
  };

  const handleReload = () => {
    if (!checkPermissions()) return;
    
    loadBeneficiaires(1, searchTerm, filters);
    message.success('Données actualisées');
  };

  // Calculer le score de complétude
  const calculateCompletudeScore = (dossier) => {
    if (!dossier) return 0;
    
    let score = 0;
    const maxScore = 100;

    // Informations patient (25 points)
    if (dossier.patient?.informations?.nom && dossier.patient?.informations?.prenom) score += 10;
    if (dossier.patient?.informations?.date_naissance) score += 5;
    if (dossier.patient?.informations?.sexe) score += 3;
    if (dossier.patient?.informations?.groupe_sanguin) score += 3;
    if (dossier.patient?.informations?.telephone || dossier.patient?.informations?.email) score += 4;

    // Antécédents et allergies (20 points)
    if (dossier.antecedents?.medicaux?.length > 0) score += 10;
    if (dossier.allergies?.liste?.length > 0) score += 10;

    // Consultations (30 points)
    if (dossier.consultations?.liste?.length > 0) {
      score += Math.min(30, dossier.consultations.liste.length * 3);
    }

    // Prescriptions et examens (25 points)
    if (dossier.prescriptions?.liste?.length > 0) score += 10;
    if (dossier.examens?.length > 0) score += 10;
    if (dossier.traitements?.en_cours?.length > 0) score += 5;

    return Math.min(100, score);
  };

  // Générer les alertes
  const generateAlerts = (dossier) => {
    if (!dossier) return [];
    
    const alerts = [];
    
    if (!dossier.patient?.informations?.date_naissance) {
      alerts.push({ niveau: 'warning', message: 'Date de naissance manquante' });
    }
    
    if (!dossier.patient?.informations?.groupe_sanguin) {
      alerts.push({ niveau: 'info', message: 'Groupe sanguin non renseigné' });
    }
    
    if (!dossier.allergies?.liste || dossier.allergies.liste.length === 0) {
      alerts.push({ niveau: 'info', message: 'Aucune allergie déclarée' });
    }
    
    if (dossier.consultations?.liste?.length > 0) {
      const lastConsultation = new Date(dossier.consultations.liste[0]?.DATE_CONSULTATION);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      if (lastConsultation < sixMonthsAgo) {
        alerts.push({ 
          niveau: 'warning', 
          message: 'Dernière consultation il y a plus de 6 mois' 
        });
      }
    } else {
      alerts.push({ niveau: 'warning', message: 'Aucune consultation enregistrée' });
    }
    
    if (dossier.traitements?.en_cours?.length > 0) {
      const traitementsActifs = dossier.traitements.en_cours.filter(t => 
        t.STATUT === 'EN_COURS' || t.STATUT === 'ACTIF'
      );
      if (traitementsActifs.length > 0) {
        alerts.push({
          niveau: 'info',
          message: `${traitementsActifs.length} traitement(s) actif(s) en cours`
        });
      }
    }
    
    return alerts;
  };

  // Générer les recommandations
  const generateRecommendations = (dossier) => {
    if (!dossier) return ['Compléter les informations du dossier médical'];
    
    const recommendations = [];
    
    if (!dossier.patient?.informations?.groupe_sanguin) {
      recommendations.push('Compléter le groupe sanguin');
    }
    
    if (!dossier.antecedents?.medicaux || dossier.antecedents.medicaux.length === 0) {
      recommendations.push('Ajouter les antécédents médicaux');
    }
    
    if (!dossier.patient?.informations?.profession) {
      recommendations.push('Compléter la profession');
    }
    
    if (!dossier.patient?.informations?.adresse) {
      recommendations.push('Ajouter l\'adresse complète');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Dossier médical à jour');
    }
    
    return recommendations;
  };

  // Créer un dossier vide
  const createEmptyDossier = (beneficiaire) => {
    return {
      patient: {
        informations: {
          id: beneficiaire.id,
          nom: beneficiaire.nom,
          prenom: beneficiaire.prenom,
          sexe: beneficiaire.sexe,
          age: beneficiaire.age,
          date_naissance: beneficiaire.date_naissance,
          telephone: beneficiaire.telephone,
          email: beneficiaire.email,
          type_paiement: beneficiaire.type_paiement || 'CASH',
          profession: beneficiaire.profession,
          groupe_sanguin: beneficiaire.groupe_sanguin,
          taux_couverture: beneficiaire.taux_couverture || 0,
          identifiant: beneficiaire.identifiant || `BEN${beneficiaire.id}`,
          adresse: beneficiaire.adresse,
          ville: beneficiaire.ville,
          code_postal: beneficiaire.code_postal,
          pays: beneficiaire.pays,
          assureur: beneficiaire.assureur,
          num_police: beneficiaire.num_police,
          statut_assurance: beneficiaire.statut_assurance,
          statut_ace: beneficiaire.statut_ace,
          type_beneficiaire: beneficiaire.type_beneficiaire
        }
      },
      consultations: { liste: [], statistiques: { total: 0, urgentes: 0 } },
      prescriptions: { liste: [], statistiques: { total: 0 } },
      facturation: { factures: [], statistiques: { total: 0 } },
      antecedents: { medicaux: beneficiaire.antecedents_medicaux || [], detailles: [] },
      allergies: { liste: beneficiaire.allergies || [], detailles: [] },
      examens: [],
      hospitalisations: [],
      traitements: { en_cours: beneficiaire.traitements_en_cours || [] },
      notes: [],
      rapport: {
        patient: {
          nom_complet: `${beneficiaire.nom} ${beneficiaire.prenom}`,
          age: beneficiaire.age,
          sexe: beneficiaire.sexe === 'M' ? 'Masculin' : 'Féminin',
          type_prise_en_charge: beneficiaire.type_paiement || 'Non spécifié',
          taux_couverture: beneficiaire.taux_couverture || 0,
          type_beneficiaire: beneficiaire.type_beneficiaire || 'Non spécifié'
        },
        indicateurs: {
          consultations_total: 0,
          consultations_urgentes: 0,
          prescriptions_total: 0,
          factures_total: 0,
          montant_restant: 0
        },
        score_completude: 0,
        alertes: [{ niveau: 'warning', message: 'Dossier incomplet' }],
        recommandations: ['Compléter les informations du dossier médical']
      }
    };
  };

  // Traiter le dossier pour l'historique
  const processDossierForHistory = (dossierData) => {
    if (!dossierData) return [];
    
    const historyItems = [];

    // Consultations
    if (dossierData.consultations?.liste) {
      dossierData.consultations.liste.forEach(consultation => {
        if (consultation) {
          historyItems.push({
            id: `consultation-${consultation.COD_CONS || consultation.id || Date.now()}`,
            type: 'consultation',
            date: consultation.DATE_CONSULTATION || consultation.date_consultation || new Date().toISOString(),
            title: 'Consultation médicale',
            description: consultation.TYPE_CONSULTATION || 'Consultation standard',
            details: `Motif: ${consultation.MOTIF_CONSULTATION || 'Non spécifié'}`,
            icon: <CalendarOutlined />,
            color: consultation.URGENT === 1 ? '#ff4d4f' : '#1890ff',
            data: consultation
          });
        }
      });
    }

    // Prescriptions
    if (dossierData.prescriptions?.liste) {
      dossierData.prescriptions.liste.forEach(prescription => {
        if (prescription) {
          historyItems.push({
            id: `prescription-${prescription.COD_PRES || prescription.id || Date.now()}`,
            type: 'prescription',
            date: prescription.DATE_PRESCRIPTION || prescription.date_prescription || new Date().toISOString(),
            title: 'Prescription médicale',
            description: prescription.LIB_AFF || 'Prescription',
            details: `Statut: ${prescription.STATUT || 'N/A'}`,
            icon: <MedicineBoxOutlined />,
            color: prescription.STATUT === 'Executee' ? '#52c41a' : '#faad14',
            data: prescription
          });
        }
      });
    }

    // Factures
    if (dossierData.facturation?.factures) {
      dossierData.facturation.factures.forEach(facture => {
        if (facture) {
          historyItems.push({
            id: `facture-${facture.COD_FACTURE || facture.id || Date.now()}`,
            type: 'facture',
            date: facture.DATE_FACTURE || facture.date_facture || new Date().toISOString(),
            title: 'Facture',
            description: facture.NUMERO_FACTURE || 'Facture',
            details: `${parseFloat(facture.MONTANT_TOTAL || 0).toFixed(2)} CFA`,
            icon: <DollarOutlined />,
            color: facture.statut === 'Payée' ? '#52c41a' : '#ff4d4f',
            data: facture
          });
        }
      });
    }

    // Trier par date (plus récent d'abord)
    return historyItems.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Télécharger le fichier
  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Menu déroulant pour actions supplémentaires
  const getBeneficiaireActionsMenu = (record) => ({
    items: [
      showCodeButton && {
        key: '0',
        label: 'Générer code d\'accès',
        icon: <BarcodeOutlined />,
        onClick: () => generateAccessCode(record)
      },
      {
        key: '1',
        label: 'Voir dossier complet',
        icon: <FolderViewOutlined />,
        onClick: () => openDossierModal(record)
      },
      {
        key: '2',
        label: 'Exporter rapidement',
        icon: <CloudDownloadOutlined />,
        onClick: () => openExportModal(record)
      },
      {
        key: '3',
        label: 'Historique détaillé',
        icon: <HistoryOutlined />,
        onClick: () => openHistoryModal(record)
      },
      {
        key: '4',
        label: 'Générer QR Code',
        icon: <QrcodeOutlined />,
        onClick: () => message.info('Fonctionnalité à venir')
      }
    ].filter(Boolean)
  });

  // Colonnes de la table modernisées pour bénéficiaires
  const beneficiaireColumns = [
    {
      title: 'Bénéficiaire',
      key: 'beneficiaire',
      width: 250,
      fixed: 'left',
      render: (record) => (
        <Space align="center">
          <Badge 
            count={record.statut_assurance === 'ACTIVE' ? '✓' : '!'} 
            style={{ 
              backgroundColor: record.statut_assurance === 'ACTIVE' ? '#52c41a' : '#ff4d4f',
              marginRight: 8
            }}
          >
            <Avatar
              size="large"
              style={{ 
                backgroundColor: record.sexe === 'M' ? '#1890ff' : '#eb2f96',
                fontSize: '18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
              icon={<UserOutlined />}
            />
          </Badge>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1890ff' }}>
              {record.nom} {record.prenom}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <IdcardOutlined /> ID: {record.identifiant}
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>
              <Tag color={record.type_beneficiaire === 'Assuré Principal' ? 'blue' : 'green'} size="small">
                {record.type_beneficiaire}
              </Tag>
            </div>
          </div>
        </Space>
      ),
      sorter: (a, b) => a.nom.localeCompare(b.nom)
    },
    {
      title: 'Informations',
      key: 'informations',
      width: 150,
      render: (record) => (
        <Space direction="vertical" size={2}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Tag 
              color={record.sexe === 'M' ? 'blue' : 'pink'} 
              style={{ margin: 0, fontWeight: 'bold', fontSize: '10px' }}
            >
              {record.sexe === 'M' ? '♂' : '♀'} {record.age || 'N/A'} ans
            </Tag>
          </div>
          {record.groupe_sanguin && (
            <Tag color="red" style={{ fontSize: '10px', fontWeight: 'bold' }}>
              {record.groupe_sanguin}
            </Tag>
          )}
          {record.taux_couverture > 0 && (
            <Progress 
              percent={record.taux_couverture} 
              size="small" 
              showInfo={false}
              strokeColor={{
                '0%': '#ff4d4f',
                '100%': '#52c41a',
              }}
            />
          )}
        </Space>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 180,
      render: (record) => (
        <Space direction="vertical" size={2}>
          {record.telephone && (
            <Button 
              type="link" 
              size="small" 
              icon={<PhoneOutlined />}
              style={{ padding: 0, height: 'auto', fontSize: '12px' }}
            >
              {record.telephone}
            </Button>
          )}
          {record.email && (
            <div style={{ fontSize: '11px', color: '#666', display: 'flex', alignItems: 'center' }}>
              <MailOutlined style={{ marginRight: 4, fontSize: '11px' }} />
              <Text ellipsis style={{ maxWidth: '150px' }}>{record.email}</Text>
            </div>
          )}
          {record.ville && (
            <div style={{ fontSize: '11px', color: '#999', display: 'flex', alignItems: 'center' }}>
              <EnvironmentOutlined style={{ marginRight: 4, fontSize: '11px' }} />
              {record.ville}
            </div>
          )}
        </Space>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type_beneficiaire',
      key: 'type_beneficiaire',
      width: 150,
      render: (type, record) => {
        const config = {
          'Assuré Principal': { color: 'blue', text: 'Assuré Principal', icon: <UserOutlined /> },
          'Conjoint': { color: 'purple', text: 'Conjoint', icon: <HeartOutlined /> },
          'Enfant': { color: 'green', text: 'Enfant', icon: <TeamOutlined /> },
          'Ascendant': { color: 'orange', text: 'Ascendant', icon: <UserOutlined /> }
        };
        
        const cfg = config[type] || { color: 'default', text: type || 'Non spécifié', icon: <UserOutlined /> };
        
        return (
          <Tag 
            color={cfg.color} 
            icon={cfg.icon}
            style={{ 
              fontWeight: '500', 
              fontSize: '11px',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {cfg.text}
          </Tag>
        );
      }
    },
    {
      title: 'Activité',
      key: 'activite',
      width: 140,
      render: (record) => (
        <Space direction="vertical" size={2}>
          {record.derniere_consultation ? (
            <>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#52c41a' }}>
                <CalendarOutlined style={{ marginRight: 4 }} />
                {moment(record.derniere_consultation).format('DD/MM/YY')}
              </div>
              <Text type="secondary" style={{ fontSize: '10px' }}>
                Il y a {moment().diff(moment(record.derniere_consultation), 'days')} jours
              </Text>
            </>
          ) : (
            <Tag color="default" style={{ fontSize: '11px' }}>Aucune consultation</Tag>
          )}
        </Space>
      ),
      sorter: (a, b) => moment(a.derniere_consultation || 0) - moment(b.derniere_consultation || 0)
    },
    {
      title: 'Actions',
      key: 'actions',
      width: showCodeButton ? 160 : 120,
      fixed: 'right',
      render: (record) => (
        <Space>
          {showCodeButton && (
            <Tooltip title="Générer code d'accès">
              <Button
                type="primary"
                size="small"
                icon={<KeyOutlined />}
                onClick={() => generateAccessCode(record)}
                style={{ 
                  background: 'linear-gradient(135deg, #722ed1 0%, #1677ff 100%)',
                  border: 'none'
                }}
              />
            </Tooltip>
          )}
          <Tooltip title="Actions rapides">
            <Dropdown menu={getBeneficiaireActionsMenu(record)} placement="bottomRight">
              <Button 
                type="text" 
                icon={<MoreOutlined />}
                style={{ color: '#1890ff' }}
              />
            </Dropdown>
          </Tooltip>
          <Tooltip title="Voir dossier">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openDossierModal(record)}
              style={{ 
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none'
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!isAuthenticated()) {
    return (
      <div className="dossiers-medicaux-page" style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
        <Card style={{ maxWidth: 600, margin: '100px auto' }}>
          <Result
            status="403"
            title="Accès non autorisé"
            subTitle="Vous devez être connecté pour accéder aux dossiers médicaux."
            extra={
              <Button type="primary" onClick={() => window.location.href = '/login'}>
                Se connecter
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="dossiers-medicaux-page" style={{ padding: '24px', background: '#f0f2f5' }}>
      {/* En-tête modernisé */}
      <Card 
        style={{ 
          marginBottom: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          border: 'none',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={2}>
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                <FileTextOutlined /> Dossiers Médicaux Sécurisés
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                Gestion sécurisée des dossiers médicaux - {COMPANY_INFO.name}
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              {isSuperAdmin && (
                <Badge.Ribbon 
                  text="SuperAdmin" 
                  color="volcano"
                  placement="start"
                >
                  <Avatar 
                    style={{ 
                      backgroundColor: '#ff4d4f',
                      cursor: 'pointer'
                    }}
                    icon={<SecurityScanOutlined />}
                  />
                </Badge.Ribbon>
              )}
              <Button
                icon={<SyncOutlined />}
                onClick={handleReload}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
              >
                Actualiser
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ 
                  background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(82,196,26,0.3)'
                }}
                onClick={() => message.info('Création de bénéficiaire à implémenter')}
              >
                Nouveau Bénéficiaire
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistiques avancées */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            <Statistic
              title={<Text style={{ color: 'white' }}>Total Bénéficiaires</Text>}
              value={stats.totalPatients}
              prefix={<TeamOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '32px' }}
              suffix={<Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>bénéficiaires</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            }}
          >
            <Statistic
              title={<Text style={{ color: 'white' }}>Consultations Aujourd'hui</Text>}
              value={stats.consultationsAujourdhui}
              prefix={<CalendarOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '32px' }}
              suffix={<Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>consultations</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
            }}
          >
            <Statistic
              title={<Text style={{ color: 'white' }}>Dossiers Complets</Text>}
              value={stats.tauxCompletude}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '32px' }}
            />
            <Progress 
              percent={stats.tauxCompletude} 
              size="small" 
              strokeColor={{ 
                '0%': '#ff4d4f', 
                '100%': '#52c41a' 
              }}
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
            }}
          >
            <Statistic
              title={<Text style={{ color: 'white' }}>Nouveaux Ce Mois</Text>}
              value={stats.nouveauxPatientsMois}
              prefix={<UserOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '32px' }}
              suffix={<Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>bénéficiaires</Text>}
            />
          </Card>
        </Col>
      </Row>

      {/* Section de recherche avancée */}
      <Card 
        style={{ 
          marginBottom: 24,
          borderRadius: '12px',
          border: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Search
              placeholder="Rechercher bénéficiaire (nom, prénom, ID, téléphone, email...)"
              enterButton={
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />}
                  style={{ 
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    border: 'none'
                  }}
                >
                  Rechercher
                </Button>
              }
              size="large"
              onSearch={handleSearch}
              allowClear
              onChange={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={8}>
            <Space wrap>
              <Button
                type="default"
                icon={<FilterOutlined />}
                onClick={() => setActiveFilterPanel(!activeFilterPanel)}
              >
                Filtres avancés
              </Button>
              <Button
                type="dashed"
                icon={<PrinterOutlined />}
                onClick={() => message.info('Impression de la liste en cours...')}
              >
                Imprimer
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Panneau de filtres avancés */}
        {activeFilterPanel && (
          <div style={{ marginTop: 16, padding: 16, background: '#fafafa', borderRadius: '8px' }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} style={{ marginBottom: 8 }}>
                <Space>
                  <Text strong>Filtres actifs :</Text>
                  {Object.entries(filters).map(([key, value]) => (
                    value && (
                      <Tag 
                        key={key} 
                        closable 
                        onClose={() => handleFilterChange(key, null)}
                        color="blue"
                      >
                        {key}: {value}
                      </Tag>
                    )
                  ))}
                  {Object.values(filters).some(val => val) && (
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={handleResetFilters}
                    >
                      Tout effacer
                    </Button>
                  )}
                </Space>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="Sexe"
                  style={{ width: '100%' }}
                  allowClear
                  onChange={(value) => handleFilterChange('sexe', value)}
                  value={filters.sexe}
                >
                  <Option value="M">Masculin</Option>
                  <Option value="F">Féminin</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="Type bénéficiaire"
                  style={{ width: '100%' }}
                  allowClear
                  onChange={(value) => handleFilterChange('type_beneficiaire', value)}
                  value={filters.type_beneficiaire}
                >
                  <Option value="Assuré Principal">Assuré Principal</Option>
                  <Option value="Conjoint">Conjoint</Option>
                  <Option value="Enfant">Enfant</Option>
                  <Option value="Ascendant">Ascendant</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="Groupe sanguin"
                  style={{ width: '100%' }}
                  allowClear
                  onChange={(value) => handleFilterChange('groupe_sanguin', value)}
                  value={filters.groupe_sanguin}
                >
                  <Option value="A+">A+</Option>
                  <Option value="A-">A-</Option>
                  <Option value="B+">B+</Option>
                  <Option value="B-">B-</Option>
                  <Option value="AB+">AB+</Option>
                  <Option value="AB-">AB-</Option>
                  <Option value="O+">O+</Option>
                  <Option value="O">O-</Option>
                </Select>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* Table des bénéficiaires modernisée */}
      <Card
        style={{ 
          borderRadius: '12px',
          border: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
        title={
          <Space>
            <TeamOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontSize: '18px', fontWeight: '600' }}>Liste des Bénéficiaires</span>
            <Badge 
              count={pagination.total} 
              style={{ 
                backgroundColor: '#1890ff',
                fontSize: '12px'
              }}
            />
            {isSuperAdmin && (
              <Tag color="volcano" icon={<SecurityScanOutlined />}>
                Mode SuperAdmin
              </Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <Dropdown
              menu={{
                items: [
                  {
                    key: '1',
                    label: 'Exporter en JSON',
                    icon: <DatabaseOutlined />,
                    onClick: () => {
                      const dataStr = JSON.stringify(beneficiaires, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      downloadFile(dataBlob, `beneficiaires-${moment().format('YYYY-MM-DD')}.json`);
                      message.success('Liste exportée avec succès');
                    }
                  }
                ]
              }}
            >
              <Button 
                icon={<DownloadOutlined />}
                style={{ 
                  background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
                  border: 'none',
                  color: 'white'
                }}
              >
                Exporter
              </Button>
            </Dropdown>
          </Space>
        }
      >
        <Table
          columns={beneficiaireColumns}
          dataSource={beneficiaires}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => (
              <span style={{ fontSize: '12px' }}>
                {range[0]}-{range[1]} sur {total} bénéficiaires
              </span>
            ),
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Title level={4} style={{ marginBottom: 8, color: '#666' }}>
                      Aucun bénéficiaire trouvé
                    </Title>
                    <Text type="secondary">
                      Essayez de modifier vos critères de recherche ou ajoutez un nouveau bénéficiaire.
                    </Text>
                  </div>
                }
              />
            )
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>

      {/* Informations de l'entreprise en bas de page */}
      <Card 
        style={{ 
          marginTop: 24,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: '12px',
          border: 'none'
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={2}>
              <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                 {COMPANY_INFO.name}
              </Title>
              <Text type="secondary">
                <EnvironmentOutlined /> {COMPANY_INFO.address} - {COMPANY_INFO.city}
              </Text>
              <Text type="secondary">
                <PhoneOutlined /> {COMPANY_INFO.phone}
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                type="link" 
                icon={<GlobalOutlined />}
                onClick={() => window.open(COMPANY_INFO.website, '_blank')}
              >
                Site web
              </Button>
              <Button 
                type="link" 
                icon={<WhatsAppOutlined />}
                onClick={() => window.open(`https://wa.me/${COMPANY_INFO.phone.replace(/\D/g, '')}`, '_blank')}
              >
                WhatsApp
              </Button>
              <Button 
                type="link" 
                icon={<MailOutlined />}
                onClick={() => window.location.href = `mailto:${COMPANY_INFO.email}`}
              >
                Email
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* MODAL DU DOSSIER MÉDICAL PROFESSIONNEL */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileTextOutlined style={{ color: 'white', fontSize: '20px' }} />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                  Dossier Médical Professionnel
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {selectedBeneficiaire?.nom} {selectedBeneficiaire?.prenom} • ID: {selectedBeneficiaire?.identifiant}
                </div>
              </div>
            </Space>
            <Space>
              <Tag color={isSuperAdmin ? "volcano" : "green"} icon={<SecurityScanOutlined />}>
                {isSuperAdmin ? 'Accès SuperAdmin' : 'Accès par code'}
              </Tag>
              <Badge status="processing" text="En ligne" />
            </Space>
          </div>
        }
        open={dossierModalVisible}
        onCancel={() => {
          setDossierModalVisible(false);
          setSelectedBeneficiaire(null);
          setDossier(null);
          setSelectedTab('overview');
        }}
        width={1500}
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={() => setDossierModalVisible(false)}>
            Fermer
          </Button>,
          <Button
            key="export"
            type="primary"
            icon={<DownloadOutlined />}
            style={{ 
              background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
              border: 'none'
            }}
            onClick={() => {
              setDossierModalVisible(false);
              setTimeout(() => openExportModal(selectedBeneficiaire), 300);
            }}
          >
            Exporter Dossier
          </Button>
        ]}
      >
        {dossier && <DossierModalContent 
          dossier={dossier} 
          beneficiaire={selectedBeneficiaire} 
          loading={loading} 
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          companyInfo={COMPANY_INFO}
          isSuperAdmin={isSuperAdmin}
        />}
      </Modal>

      {/* MODAL D'EXPORT PROFESSIONNEL */}
      <Modal
        title={
          <Space>
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DownloadOutlined style={{ color: 'white', fontSize: '18px' }} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>
                Exportation Professionnelle
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Options d'exportation avancées
              </div>
            </div>
          </Space>
        }
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setExportModalVisible(false)}>
            Annuler
          </Button>,
          <Button
            key="export"
            type="primary"
            icon={<DownloadOutlined />}
            loading={exportLoading}
            onClick={() => {
              message.info('Export PDF à implémenter');
              setExportModalVisible(false);
            }}
            style={{ 
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(24,144,255,0.3)'
            }}
          >
            Exporter Maintenant
          </Button>
        ]}
      >
        <ExportModalContent 
          exportType={exportType}
          setExportType={setExportType}
          exportOptions={exportOptions}
          setExportOptions={setExportOptions}
          beneficiaire={selectedBeneficiaire}
          companyInfo={COMPANY_INFO}
        />
      </Modal>

      {/* MODAL D'HISTORIQUE COMPLET */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            <span>Historique Médical Complet</span>
            <Divider type="vertical" />
            <Text strong>{selectedBeneficiaire?.nom} {selectedBeneficiaire?.prenom}</Text>
          </Space>
        }
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        width={1200}
        style={{ top: 20 }}
        footer={[
          <Button key="back" onClick={() => setHistoryModalVisible(false)}>
            Fermer
          </Button>
        ]}
      >
        <HistoryModalContent 
          historyData={historyData} 
          loading={historyLoading}
          beneficiaire={selectedBeneficiaire}
        />
      </Modal>
    </div>
  );
};

// COMPOSANT DU CONTENU DU MODAL DU DOSSIER (version professionnelle)
const DossierModalContent = ({ dossier, beneficiaire, loading, selectedTab, setSelectedTab, companyInfo, isSuperAdmin }) => {
  if (loading && !dossier) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" tip="Chargement du dossier médical complet..." />
      </div>
    );
  }

  if (!beneficiaire || !dossier) {
    return (
      <Result
        status="warning"
        title="Dossier non disponible"
        subTitle="Impossible de charger le dossier médical complet du bénéficiaire."
        extra={
          <Button type="primary" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        }
      />
    );
  }

  const beneficiaireInfo = dossier.patient?.informations || beneficiaire;
  const rapport = dossier.rapport || {};
  const stats = dossier.consultations?.statistiques || {};

  return (
    <div className="dossier-modal-content" style={{ position: 'relative' }}>
      {/* Bannière d'informations de l'entreprise */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '12px 20px',
        borderRadius: '8px',
        marginBottom: '20px',
        color: 'white'
      }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <Text style={{ color: 'white' }}>{companyInfo.name}</Text>
              <Divider type="vertical" style={{ background: 'rgba(255,255,255,0.3)' }} />
              <Tag color={isSuperAdmin ? "volcano" : "green"} style={{ margin: 0 }}>
                {isSuperAdmin ? 'Mode SuperAdmin' : 'Accès par code'}
              </Tag>
            </Space>
          </Col>
          <Col>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
              Dossier généré le {moment().format('DD/MM/YYYY à HH:mm')}
            </Text>
          </Col>
        </Row>
      </div>
      
      <Spin spinning={loading} tip="Mise à jour du dossier...">
        {/* En-tête du dossier avec informations bénéficiaire */}
        <Card 
          className="beneficiaire-header-card"
          style={{ 
            marginBottom: 20,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            borderRadius: 12,
            border: '1px solid #d9d9d9'
          }}
        >
          <Row gutter={24} align="middle">
            <Col xs={24} md={6} style={{ textAlign: 'center' }}>
              <Avatar
                size={100}
                style={{ 
                  backgroundColor: beneficiaireInfo.sexe === 'M' ? '#1890ff' : '#eb2f96',
                  marginBottom: 16,
                  fontSize: '36px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                icon={<UserOutlined />}
              />
              <Title level={4} style={{ margin: 0 }}>
                {beneficiaireInfo.nom} {beneficiaireInfo.prenom}
              </Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <IdcardOutlined /> {beneficiaireInfo.identifiant || `BEN${beneficiaire.id}`}
              </Text>
              <Tag color="blue" style={{ marginTop: 4 }}>
                {beneficiaireInfo.type_beneficiaire || 'Bénéficiaire'}
              </Tag>
            </Col>
            <Col xs={24} md={18}>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={8}>
                  <Card size="small" style={{ height: '100%' }}>
                    <Statistic
                      title="Âge"
                      value={beneficiaireInfo.age || 'N/A'}
                      suffix="ans"
                      prefix={<CalendarOutlined />}
                      valueStyle={{ fontSize: '20px', fontWeight: 'bold' }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={8}>
                  <Card size="small" style={{ height: '100%' }}>
                    <Statistic
                      title="Sexe"
                      value={beneficiaireInfo.sexe === 'M' ? 'Masculin' : 'Féminin'}
                      prefix={<UserOutlined />}
                      valueStyle={{ fontSize: '20px', fontWeight: 'bold' }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={8}>
                  <Card size="small" style={{ height: '100%' }}>
                    <Statistic
                      title="Type Bénéficiaire"
                      value={beneficiaireInfo.type_beneficiaire || 'Non spécifié'}
                      prefix={<UserOutlined />}
                      valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={8}>
                  <Card size="small" style={{ height: '100%' }}>
                    <Statistic
                      title="Taux Couverture"
                      value={beneficiaireInfo.taux_couverture || 0}
                      suffix="%"
                      prefix={<SafetyCertificateOutlined />}
                      valueStyle={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold',
                        color: beneficiaireInfo.taux_couverture >= 80 ? '#52c41a' : 
                               beneficiaireInfo.taux_couverture >= 50 ? '#faad14' : '#ff4d4f'
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={8}>
                  <Card size="small" style={{ height: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>Groupe Sanguin</Text>
                      <Title level={3} style={{ margin: '8px 0', color: '#ff4d4f' }}>
                        {beneficiaireInfo.groupe_sanguin || 'Non connu'}
                      </Title>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ height: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>Dernière Consultation</Text>
                      <div style={{ marginTop: 8, fontSize: '16px', fontWeight: 'bold' }}>
                        {dossier.consultations?.liste?.[0]?.DATE_CONSULTATION 
                          ? moment(dossier.consultations.liste[0].DATE_CONSULTATION).format('DD/MM/YYYY')
                          : 'Jamais'}
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* Statistiques rapides */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} md={6}>
            <Card 
              size="small" 
              hoverable
              onClick={() => setSelectedTab('consultations')}
              style={{ cursor: 'pointer', borderLeft: '4px solid #1890ff' }}
            >
              <Statistic
                title="Consultations"
                value={stats.total || dossier.consultations?.liste?.length || 0}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: '24px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {stats.urgentes || 0} urgentes
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              size="small" 
              hoverable
              onClick={() => setSelectedTab('prescriptions')}
              style={{ cursor: 'pointer', borderLeft: '4px solid #52c41a' }}
            >
              <Statistic
                title="Prescriptions"
                value={dossier.prescriptions?.statistiques?.total || dossier.prescriptions?.liste?.length || 0}
                prefix={<MedicineBoxOutlined />}
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              size="small" 
              hoverable
              onClick={() => setSelectedTab('facturation')}
              style={{ cursor: 'pointer', borderLeft: '4px solid #faad14' }}
            >
              <Statistic
                title="Factures"
                value={dossier.facturation?.statistiques?.total || dossier.facturation?.factures?.length || 0}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#faad14', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              size="small" 
              hoverable
              style={{ borderLeft: '4px solid #722ed1' }}
            >
              {rapport.score_completude ? (
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="dashboard"
                    percent={rapport.score_completude}
                    width={60}
                    strokeColor={{
                      '0%': '#ff4d4f',
                      '100%': '#52c41a',
                    }}
                  />
                  <div style={{ marginTop: 8, fontSize: '12px', fontWeight: 'bold' }}>
                    Complétude du dossier
                  </div>
                </div>
              ) : (
                <Statistic
                  title="Dossier"
                  value="Actif"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* Alertes */}
        {rapport.alertes && rapport.alertes.length > 0 && (
          <Alert
            style={{ marginBottom: 20 }}
            title="Alertes Médicales"
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            description={
              <List
                size="small"
                dataSource={rapport.alertes}
                renderItem={(alerte, index) => (
                  <List.Item>
                    <Badge status={alerte.niveau === 'danger' ? 'error' : 'warning'} />
                    <Text style={{ fontSize: '14px' }}>{alerte.message}</Text>
                  </List.Item>
                )}
              />
            }
          />
        )}

        {/* Onglets du dossier */}
        <Tabs
          activeKey={selectedTab}
          onChange={setSelectedTab}
          type="card"
          size="large"
          animated
          tabBarStyle={{ marginBottom: 16 }}
        >
          <TabPane tab={<span><DashboardOutlined /> Vue d'ensemble</span>} key="overview">
            <OverviewTab dossier={dossier} beneficiaireInfo={beneficiaireInfo} rapport={rapport} companyInfo={companyInfo} />
          </TabPane>
          <TabPane tab={<span><CalendarOutlined /> Consultations</span>} key="consultations">
            <ConsultationsTab 
              consultations={dossier.consultations?.liste || []} 
            />
          </TabPane>
          <TabPane tab={<span><MedicineBoxOutlined /> Prescriptions</span>} key="prescriptions">
            <PrescriptionsTab prescriptions={dossier.prescriptions?.liste || []} />
          </TabPane>
          <TabPane tab={<span><DollarOutlined /> Facturation</span>} key="facturation">
            <FacturationTab factures={dossier.facturation?.factures || []} />
          </TabPane>
          <TabPane tab={<span><HeartOutlined /> Antécédents & Allergies</span>} key="antecedents">
            <AntecedentsTab antecedents={dossier.antecedents || {}} allergies={dossier.allergies || {}} />
          </TabPane>
        </Tabs>
      </Spin>
    </div>
  );
};

// COMPOSANT DU CONTENU DU MODAL D'HISTORIQUE
const HistoryModalContent = ({ historyData, loading, beneficiaire }) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" tip="Chargement de l'historique complet..." />
      </div>
    );
  }

  if (historyData.length === 0) {
    return (
      <Result
        icon={<HistoryOutlined />}
        title="Aucun historique disponible"
        subTitle={`Aucun événement médical enregistré pour ${beneficiaire?.nom} ${beneficiaire?.prenom}`}
        extra={
          <Button type="primary" onClick={() => window.location.reload()}>
            Actualiser
          </Button>
        }
      />
    );
  }

  // Grouper par mois
  const groupedByMonth = historyData.reduce((acc, item) => {
    const monthYear = moment(item.date).format('MMMM YYYY');
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(item);
    return acc;
  }, {});

  return (
    <div className="history-modal-content">
      <div style={{ marginBottom: 20 }}>
        <Alert
          message="Historique Chronologique"
          description="Tous les événements médicaux triés par date (du plus récent au plus ancien)"
          type="info"
          showIcon
        />
      </div>

      <Timeline mode="left">
        {Object.entries(groupedByMonth).sort(([dateA], [dateB]) => moment(dateB, 'MMMM YYYY') - moment(dateA, 'MMMM YYYY')).map(([monthYear, items]) => (
          <Timeline.Item
            key={monthYear}
            color="blue"
            label={
              <div style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '16px' }}>
                {monthYear}
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {items.length} événement(s)
                </div>
              </div>
            }
          >
            <List
              dataSource={items}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <Card
                    size="small"
                    style={{ 
                      borderLeft: `4px solid ${item.color}`,
                      width: '100%',
                      cursor: item.type === 'consultation' ? 'pointer' : 'default'
                    }}
                    hoverable={item.type === 'consultation'}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ backgroundColor: item.color }}
                          icon={item.icon}
                          size="large"
                        />
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.title}</span>
                          <Tag color={item.color}>
                            {moment(item.date).format('DD/MM/YYYY HH:mm')}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ fontWeight: '500', marginBottom: 4 }}>{item.description}</div>
                          {item.details && (
                            <div style={{ 
                              marginTop: 8, 
                              padding: 8, 
                              background: '#f6f6f6', 
                              borderRadius: 4,
                              fontSize: '12px'
                            }}>
                              {item.details}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          </Timeline.Item>
        ))}
      </Timeline>

      {/* Résumé statistique */}
      <Card 
        title="Résumé Statistique de l'Historique" 
        style={{ marginTop: 20 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="Total Événements"
              value={historyData.length}
              prefix={<DatabaseOutlined />}
              valueStyle={{ fontSize: '20px' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Consultations"
              value={historyData.filter(item => item.type === 'consultation').length}
              prefix={<CalendarOutlined />}
              valueStyle={{ fontSize: '20px' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Prescriptions"
              value={historyData.filter(item => item.type === 'prescription').length}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ fontSize: '20px' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Autres"
              value={historyData.filter(item => !['consultation', 'prescription'].includes(item.type)).length}
              prefix={<AppstoreOutlined />}
              valueStyle={{ fontSize: '20px' }}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

// COMPOSANT DU CONTENU DU MODAL D'EXPORT (version professionnelle)
const ExportModalContent = ({ exportType, setExportType, exportOptions, setExportOptions, beneficiaire, companyInfo }) => {
  const handleOptionChange = (key, value) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const exportPresets = {
    complet: () => setExportOptions({
      includeConsultations: true,
      includePrescriptions: true,
      includeFactures: true,
      includeAntecedents: true,
      includeExamens: true,
      includeNotes: true,
      includeAllergies: true,
      includeTraitements: true,
      includeHospitalisations: true,
      includeCompanyInfo: true,
      includeWatermark: true,
      includeQRCode: true
    }),
    medical: () => setExportOptions({
      includeConsultations: true,
      includePrescriptions: true,
      includeAntecedents: true,
      includeExamens: true,
      includeAllergies: true,
      includeTraitements: true,
      includeHospitalisations: true,
      includeCompanyInfo: false,
      includeWatermark: true,
      includeQRCode: false
    }),
    administratif: () => setExportOptions({
      includeConsultations: false,
      includePrescriptions: false,
      includeFactures: true,
      includeAntecedents: false,
      includeExamens: false,
      includeNotes: false,
      includeAllergies: true,
      includeTraitements: false,
      includeHospitalisations: false,
      includeCompanyInfo: true,
      includeWatermark: true,
      includeQRCode: true
    })
  };

  return (
    <div className="export-modal-content">
      <Alert
        message="Exportation Professionnelle"
        description="Exportez le dossier médical avec les options avancées de personnalisation"
        type="info"
        showIcon
        icon={<AuditOutlined />}
        style={{ 
          marginBottom: 20,
          borderRadius: '8px',
          border: 'none',
          background: '#f0f7ff'
        }}
      />

      {/* Presets rapides */}
      <Card 
        title="Préréglages" 
        size="small"
        style={{ marginBottom: 20 }}
      >
        <Space wrap>
          <Button onClick={exportPresets.complet}>
            <CheckCircleOutlined /> Complet
          </Button>
          <Button onClick={exportPresets.medical}>
            <MedicineBoxOutlined /> Médical
          </Button>
          <Button onClick={exportPresets.administratif}>
            <BankOutlined /> Administratif
          </Button>
        </Space>
      </Card>

      {/* Format d'exportation */}
      <Card title="Format" size="small" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: '14px' }}>Sélectionnez le format d'exportation :</Text>
        </div>
        <Select
          style={{ width: '100%' }}
          value={exportType}
          onChange={setExportType}
          size="large"
        >
          <Option value="pdf">
            <Space>
              <FilePdfOutlined style={{ color: '#ff4d4f' }} />
              <Text strong>PDF Professionnel</Text>
              <Tag color="red">Recommandé</Tag>
            </Space>
          </Option>
          <Option value="json">
            <Space>
              <DatabaseOutlined style={{ color: '#faad14' }} />
              <Text>Données JSON</Text>
            </Space>
          </Option>
        </Select>
      </Card>

      {/* Options d'exportation */}
      <Card title="Options d'exportation" size="small">
        <List
          size="small"
          dataSource={[
            { key: 'includeWatermark', label: 'Inclure le filigrane "CONFIDENTIEL"' },
            { key: 'includeCompanyInfo', label: 'Inclure les informations de l\'entreprise' },
            { key: 'includeQRCode', label: 'Générer un QR Code d\'identification' },
            { key: 'includeConsultations', label: 'Inclure les consultations' },
            { key: 'includePrescriptions', label: 'Inclure les prescriptions' },
            { key: 'includeFactures', label: 'Inclure la facturation' },
            { key: 'includeAntecedents', label: 'Inclure les antécédents' },
            { key: 'includeAllergies', label: 'Inclure les allergies' },
            { key: 'includeExamens', label: 'Inclure les examens' },
            { key: 'includeTraitements', label: 'Inclure les traitements' },
            { key: 'includeHospitalisations', label: 'Inclure les hospitalisations' },
            { key: 'includeNotes', label: 'Inclure les notes médicales' }
          ]}
          renderItem={(item) => (
            <List.Item>
              <Switch 
                checked={exportOptions[item.key]} 
                onChange={(checked) => handleOptionChange(item.key, checked)}
                size="small"
              />
              <span style={{ marginLeft: 8, fontSize: '13px' }}>{item.label}</span>
            </List.Item>
          )}
        />
      </Card>

      {/* Informations de l'entreprise */}
      <Card 
        title="Informations de l'entreprise" 
        size="small"
        style={{ marginTop: 20 }}
      >
        <Space direction="vertical" size={2}>
          <Text strong>{companyInfo.name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <EnvironmentOutlined /> {companyInfo.address}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <PhoneOutlined /> {companyInfo.phone}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <MailOutlined /> {companyInfo.email}
          </Text>
        </Space>
      </Card>
    </div>
  );
};

// COMPOSANTS POUR LES ONGLETS DU DOSSIER

const OverviewTab = ({ dossier, beneficiaireInfo, rapport, companyInfo }) => {
  return (
    <div className="overview-tab">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          {/* Informations détaillées du bénéficiaire */}
          <Card 
            title="Informations Bénéficiaire Détaillées"
            extra={
              <Tag color="blue">
                <SafetyCertificateOutlined /> {beneficiaireInfo.statut_assurance || 'ACTIVE'}
              </Tag>
            }
          >
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Nom Complet">
                <Text strong>{beneficiaireInfo.nom} {beneficiaireInfo.prenom}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Type Bénéficiaire">
                <Tag color="blue">{beneficiaireInfo.type_beneficiaire || 'Non spécifié'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Date de Naissance">
                {beneficiaireInfo.date_naissance ? moment(beneficiaireInfo.date_naissance).format('DD/MM/YYYY') : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Lieu de Naissance">
                {beneficiaireInfo.lieu_naissance || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Profession">
                {beneficiaireInfo.profession || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Téléphone">
                <Space>
                  <PhoneOutlined />
                  {beneficiaireInfo.telephone || 'N/A'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <Space>
                  <MailOutlined />
                  {beneficiaireInfo.email || 'N/A'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Adresse">
                <Space>
                  <EnvironmentOutlined />
                  {beneficiaireInfo.adresse || 'N/A'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Ville">
                {beneficiaireInfo.ville || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Code Postal">
                {beneficiaireInfo.code_postal || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Pays">
                {beneficiaireInfo.pays || 'Cameroun'}
              </Descriptions.Item>
              <Descriptions.Item label="Groupe Sanguin">
                <Tag color="red" style={{ fontWeight: 'bold' }}>
                  {beneficiaireInfo.groupe_sanguin || 'N/A'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Situation Familiale">
                {beneficiaireInfo.situation_familiale || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Nombre d'Enfants">
                {beneficiaireInfo.nombre_enfants || '0'}
              </Descriptions.Item>
              <Descriptions.Item label="Assureur">
                {beneficiaireInfo.assureur || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Numéro Police">
                {beneficiaireInfo.num_police || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Statut ACE">
                <Tag color="purple">{beneficiaireInfo.statut_ace || 'N/A'}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Recommandations du rapport */}
          {rapport?.recommandations && rapport.recommandations.length > 0 && (
            <Card title="Recommandations Médicales" style={{ marginTop: 16 }}>
              <List
                dataSource={rapport.recommandations}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ backgroundColor: '#1890ff' }}
                          icon={<CheckCircleOutlined />}
                        />
                      }
                      title={`Recommandation ${index + 1}`}
                      description={item}
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          {/* Informations de l'entreprise */}
          <Card 
            title="Informations de l'Entreprise"
            style={{ marginBottom: 16 }}
          >
            <Space direction="vertical" size={2}>
              <Text strong>{companyInfo.name}</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <EnvironmentOutlined /> {companyInfo.address}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <PhoneOutlined /> {companyInfo.phone}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <MailOutlined /> {companyInfo.email}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <GlobalOutlined /> {companyInfo.website}
              </Text>
            </Space>
          </Card>

          {/* Dernières activités */}
          <Card 
            title="Dernières Activités"
          >
            <Timeline>
              {dossier.consultations?.liste?.slice(0, 4).map((consult, index) => (
                <Timeline.Item 
                  key={index} 
                  color={
                    consult.TYPE_CONSULTATION === 'URGENCE' ? 'red' : 
                    consult.TYPE_CONSULTATION === 'CONTROLE' ? 'green' : 'blue'
                  }
                  dot={<CalendarOutlined />}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {consult.TYPE_CONSULTATION || 'Consultation'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {moment(consult.DATE_CONSULTATION).format('DD/MM/YYYY HH:mm')}
                    </div>
                    <Text type="secondary" ellipsis style={{ fontSize: '12px' }}>
                      {consult.MOTIF_CONSULTATION || 'Aucun motif'}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>

          {/* Indicateurs de santé */}
          <Card title="Indicateurs Clés" style={{ marginTop: 16 }}>
            <Row gutter={[8, 16]}>
              <Col span={12}>
                <Statistic
                  title="Consultations"
                  value={rapport?.indicateurs?.consultations_total || dossier.consultations?.liste?.length || 0}
                  suffix="/an"
                  valueStyle={{ fontSize: '20px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Urgentes"
                  value={rapport?.indicateurs?.consultations_urgentes || 0}
                  valueStyle={{ fontSize: '20px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Prescriptions"
                  value={dossier.prescriptions?.liste?.length || 0}
                  valueStyle={{ fontSize: '20px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Traitements"
                  value={dossier.traitements?.en_cours?.length || 0}
                  valueStyle={{ fontSize: '20px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Hospitalisations"
                  value={dossier.hospitalisations?.length || 0}
                  valueStyle={{ fontSize: '20px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Allergies"
                  value={dossier.allergies?.liste?.length || 0}
                  valueStyle={{ fontSize: '20px' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const ConsultationsTab = ({ consultations }) => {
  const columns = [
    {
      title: 'Date',
      dataIndex: 'DATE_CONSULTATION',
      key: 'date',
      width: 150,
      render: (date) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{moment(date).format('DD/MM/YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{moment(date).format('HH:mm')}</div>
        </div>
      ),
      sorter: (a, b) => moment(a.DATE_CONSULTATION) - moment(b.DATE_CONSULTATION),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Type',
      dataIndex: 'TYPE_CONSULTATION',
      key: 'type',
      width: 120,
      render: (type) => (
        <Tag 
          color={type === 'URGENCE' ? 'red' : type === 'CONTROLE' ? 'green' : 'blue'}
          style={{ fontWeight: '500' }}
        >
          {type || 'Standard'}
        </Tag>
      )
    },
    {
      title: 'Médecin',
      key: 'medecin',
      width: 150,
      render: (record) => record.NOM_PRESTATAIRE ? 
        `${record.NOM_PRESTATAIRE} ${record.PRENOM_PRESTATAIRE}` : 'N/A'
    },
    {
      title: 'Motif',
      dataIndex: 'MOTIF_CONSULTATION',
      key: 'motif',
      width: 200,
      ellipsis: true,
      render: (motif) => motif || 'Non spécifié'
    },
    {
      title: 'Diagnostic',
      dataIndex: 'DIAGNOSTIC',
      key: 'diagnostic',
      width: 200,
      ellipsis: true,
      render: (diagnostic) => diagnostic || 'Non spécifié'
    },
    {
      title: 'Montant',
      dataIndex: 'MONTANT_CONSULTATION',
      key: 'montant',
      width: 100,
      render: (montant) => montant ? `${parseFloat(montant).toFixed(2)} CFA` : 'Gratuit'
    }
  ];

  if (consultations.length === 0) {
    return (
      <Empty
        description={
          <div>
            <Title level={5}>Aucune consultation enregistrée</Title>
            <Text type="secondary">Aucune consultation médicale n'a été enregistrée pour ce bénéficiaire.</Text>
          </div>
        }
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div>
      <Alert
        message={`Total: ${consultations.length} consultation(s)`}
        description={`Dont ${consultations.filter(c => c.URGENT === 1).length} consultation(s) urgente(s)`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Table
        columns={columns}
        dataSource={consultations}
        rowKey="COD_CONS"
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `${total} consultation(s)`
        }}
        size="middle"
        scroll={{ x: 1000 }}
      />
    </div>
  );
};

const PrescriptionsTab = ({ prescriptions }) => {
  const columns = [
    {
      title: 'N°',
      dataIndex: 'NUM_PRESCRIPTION',
      key: 'numero',
      width: 100
    },
    {
      title: 'Date',
      dataIndex: 'DATE_PRESCRIPTION',
      key: 'date',
      width: 120,
      render: (date) => moment(date).format('DD/MM/YYYY'),
      sorter: (a, b) => moment(a.DATE_PRESCRIPTION) - moment(b.DATE_PRESCRIPTION)
    },
    {
      title: 'Affection',
      dataIndex: 'LIB_AFF',
      key: 'affection',
      width: 150,
      ellipsis: true
    },
    {
      title: 'Type',
      dataIndex: 'TYPE_PRESTATION',
      key: 'type',
      width: 120
    },
    {
      title: 'Statut',
      dataIndex: 'STATUT',
      key: 'statut',
      width: 120,
      render: (statut) => {
        const statusConfig = {
          'Executee': { color: 'green', text: 'Exécutée' },
          'En attente': { color: 'orange', text: 'En attente' },
          'Annulee': { color: 'red', text: 'Annulée' },
          'Validee': { color: 'blue', text: 'Validée' }
        };
        const config = statusConfig[statut] || { color: 'default', text: statut };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'Nb Éléments',
      dataIndex: 'NB_ELEMENTS',
      key: 'elements',
      width: 100,
      align: 'center'
    },
    {
      title: 'Montant Total',
      dataIndex: 'MONTANT_TOTAL',
      key: 'montant',
      width: 120,
      render: (montant) => `${parseFloat(montant || 0).toFixed(2)} CFA`,
      align: 'right'
    }
  ];

  if (prescriptions.length === 0) {
    return (
      <Empty
        description="Aucune prescription enregistrée"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div>
      <Alert
        message={`Total: ${prescriptions.length} prescription(s)`}
        description={`${prescriptions.filter(p => p.STATUT === 'Executee').length} exécutée(s), ${prescriptions.filter(p => p.STATUT === 'En attente').length} en attente`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Table
        columns={columns}
        dataSource={prescriptions}
        rowKey="COD_PRES"
        pagination={{ pageSize: 10 }}
        size="middle"
        scroll={{ x: 800 }}
      />
    </div>
  );
};

const FacturationTab = ({ factures }) => {
  const columns = [
    {
      title: 'N° Facture',
      dataIndex: 'NUMERO_FACTURE',
      key: 'numero',
      width: 120
    },
    {
      title: 'Date',
      dataIndex: 'DATE_FACTURE',
      key: 'date',
      width: 120,
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Échéance',
      dataIndex: 'DATE_ECHEANCE',
      key: 'echeance',
      width: 120,
      render: (date) => date ? moment(date).format('DD/MM/YYYY') : 'N/A'
    },
    {
      title: 'Montant Total',
      dataIndex: 'MONTANT_TOTAL',
      key: 'montant',
      width: 120,
      render: (montant) => (
        <Text strong>{parseFloat(montant || 0).toFixed(2)} CFA</Text>
      ),
      align: 'right'
    },
    {
      title: 'Payé',
      dataIndex: 'MONTANT_PAYE',
      key: 'paye',
      width: 100,
      render: (paye) => `${parseFloat(paye || 0).toFixed(2)} CFA`,
      align: 'right'
    },
    {
      title: 'Reste',
      key: 'reste',
      width: 120,
      render: (record) => {
        const reste = (parseFloat(record.MONTANT_TOTAL || 0) - parseFloat(record.MONTANT_PAYE || 0)).toFixed(2);
        const isImpaye = parseFloat(reste) > 0;
        return (
          <Tag color={isImpaye ? 'red' : 'green'} style={{ fontWeight: 'bold' }}>
            {reste} CFA
          </Tag>
        );
      },
      align: 'right'
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 120,
      render: (statut) => {
        const statusConfig = {
          'Payée': { color: 'green', icon: <CheckCircleOutlined /> },
          'Partiellement': { color: 'orange', icon: <ExclamationCircleOutlined /> },
          'En attente': { color: 'red', icon: <ClockCircleOutlined /> },
          'Annulée': { color: 'default', icon: <CloseCircleOutlined /> }
        };
        const config = statusConfig[statut] || { color: 'default', icon: null };
        return (
          <Tag color={config.color} icon={config.icon}>
            {statut}
          </Tag>
        );
      }
    }
  ];

  if (factures.length === 0) {
    return (
      <Empty
        description="Aucune facture enregistrée"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  // Calculer les totaux
  const totalFactures = factures.reduce((sum, f) => sum + (parseFloat(f.MONTANT_TOTAL) || 0), 0);
  const totalPaye = factures.reduce((sum, f) => sum + (parseFloat(f.MONTANT_PAYE) || 0), 0);
  const totalReste = totalFactures - totalPaye;
  const facturesImpayees = factures.filter(f => 
    (parseFloat(f.MONTANT_TOTAL || 0) - parseFloat(f.MONTANT_PAYE || 0)) > 0
  ).length;

  return (
    <div>
      <Alert
        message="Résumé Financier"
        description={
          <Space size="large">
            <Statistic 
              title="Total Factures" 
              value={totalFactures.toFixed(2)} 
              suffix="CFA" 
              valueStyle={{ color: '#1890ff' }}
            />
            <Statistic 
              title="Total Payé" 
              value={totalPaye.toFixed(2)} 
              suffix="CFA" 
              valueStyle={{ color: '#52c41a' }}
            />
            <Statistic 
              title="Total Restant" 
              value={totalReste.toFixed(2)} 
              suffix="CFA" 
              valueStyle={{ color: totalReste > 0 ? '#ff4d4f' : '#52c41a' }}
            />
            <Statistic 
              title="Factures Impayées" 
              value={facturesImpayees} 
              valueStyle={{ color: facturesImpayees > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Table
        columns={columns}
        dataSource={factures}
        rowKey="COD_FACTURE"
        pagination={{ pageSize: 10 }}
        size="middle"
        scroll={{ x: 900 }}
      />
    </div>
  );
};

const AntecedentsTab = ({ antecedents, allergies }) => {
  const { medicaux = [], detailles = [] } = antecedents;
  const { liste: allergiesListe = [], detailles: allergiesDetaillees = [] } = allergies;

  const antecedentsItems = detailles.map((item, index) => ({
    key: `antecedent-${index}`,
    label: `${item.TYPE_ANTECEDENT || 'Antécédent'} - ${moment(item.DATE_DECLARATION).format('DD/MM/YYYY')}`,
    children: (
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Description">
          {item.DESCRIPTION}
        </Descriptions.Item>
        <Descriptions.Item label="Gravité">
          <Tag color={
            item.GRAVITE === 'Élevée' ? 'red' : 
            item.GRAVITE === 'Moyenne' ? 'orange' : 'green'
          }>
            {item.GRAVITE || 'Non spécifié'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Traitement">
          {item.TRAITEMENT || 'Aucun traitement spécifié'}
        </Descriptions.Item>
        <Descriptions.Item label="Observations">
          {item.OBSERVATIONS || 'Aucune observation'}
        </Descriptions.Item>
      </Descriptions>
    )
  }));

  if (medicaux.length === 0 && detailles.length === 0 && allergiesListe.length === 0) {
    return (
      <Empty
        description="Aucun antécédent médical ou allergie enregistré"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div>
      {medicaux.length > 0 && (
        <Card 
          title="Antécédents Médicaux" 
          style={{ marginBottom: 16 }}
          extra={<Tag color="blue">{medicaux.length}</Tag>}
        >
          <List
            dataSource={medicaux}
            renderItem={(item, index) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<HeartTwoTone />} />}
                  title={`Antécédent ${index + 1}`}
                  description={
                    typeof item === 'string' ? item : JSON.stringify(item)
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {allergiesListe.length > 0 && (
        <Card 
          title="Allergies" 
          style={{ marginBottom: 16 }}
          extra={<Tag color="red">{allergiesListe.length}</Tag>}
        >
          <List
            dataSource={allergiesListe}
            renderItem={(item, index) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<ExclamationCircleOutlined />} />}
                  title={`Allergie ${index + 1}`}
                  description={item}
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {detailles.length > 0 && (
        <Card 
          title="Antécédents Détaillés" 
          extra={<Tag color="green">{detailles.length}</Tag>}
        >
          <Collapse items={antecedentsItems} />
        </Card>
      )}
    </div>
  );
};

export default DossiersMedicauxPage;