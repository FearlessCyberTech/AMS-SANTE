// NetworkPage.jsx - Version avec amélioration de l'affichage dans les sélecteurs
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Card, Row, Col, Statistic, Button, Modal, Form,
  Select, Input, DatePicker, Tag, Space, message, Tabs,
  Descriptions, Tooltip, Popconfirm, Spin, Alert,
  Divider, Badge, Typography, Empty,
  Drawer, List, Avatar
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, SearchOutlined, FilterOutlined,
  DownloadOutlined, SyncOutlined,
  UserOutlined, TeamOutlined, BankOutlined,
  PhoneOutlined, MailOutlined, LinkOutlined,
  StarOutlined, CloudServerOutlined, ApartmentOutlined,
  UsergroupAddOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  InfoCircleOutlined, GlobalOutlined, EnvironmentOutlined,
  ArrowUpOutlined, LoadingOutlined,
  SaveOutlined, CheckOutlined, MinusCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { reseauSoinsAPI } from '../../services/api'; // API réseaux
import { beneficiairesAPI, prestatairesAPI } from '../../services/api'; // APIs séparées
import moment from 'moment';
import 'moment/locale/fr';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const NetworkPage = () => {
  const { user } = useAuth();
  
  // États principaux
  const [reseaux, setReseaux] = useState([]);
  const [loading, setLoading] = useState({
    reseaux: false,
    details: false,
    statistiques: false,
    membres: false,
    centres: false,
    prestataires: false,
    beneficiaires: false
  });
  
  // États de recherche et filtres
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: '',
    region: 'all'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour les statistiques
  const [statistiques, setStatistiques] = useState({
    total: 0,
    actifs: 0,
    inactifs: 0,
    totalMembres: 0,
    regions: 0,
    en_attente: 0,
    derniers_30_jours: 0
  });
  
  // États pour les données
  const [regions, setRegions] = useState([]);
  const [centres, setCentres] = useState([]);
  const [prestataires, setPrestataires] = useState([]);
  const [beneficiaires, setBeneficiaires] = useState([]);
  
  // États pour les modales et drawer
  const [networkModal, setNetworkModal] = useState({
    visible: false,
    mode: 'create',
    loading: false
  });
  
  const [memberModal, setMemberModal] = useState({
    visible: false,
    loading: false
  });
  
  const [detailsDrawer, setDetailsDrawer] = useState({
    visible: false,
    reseau: null,
    membres: [],
    statistiques: {}
  });
  
  // États pour les formulaires
  const [networkForm] = Form.useForm();
  const [memberForm] = Form.useForm();
  
  // Données pour les formulaires
  const networkTypes = [
    { value: 'Hospitalier', label: 'Réseau Hospitalier' },
    { value: 'Primaire', label: 'Réseau de Soins Primaires' },
    { value: 'Specialise', label: 'Réseau Spécialisé' },
    { value: 'Territorial', label: 'Réseau Territorial' },
    { value: 'Thematique', label: 'Réseau Thématique' },
    { value: 'Numerique', label: 'Réseau Numérique' }
  ];
  
  const statusOptions = [
    { value: 'Actif', label: 'Actif', color: 'success' },
    { value: 'Inactif', label: 'Inactif', color: 'error' },
    { value: 'En attente', label: 'En attente', color: 'warning' }
  ];
  
  const memberTypes = [
    { value: 'center', label: 'Centre de Santé', icon: <BankOutlined /> },
    { value: 'provider', label: 'Prestataire', icon: <TeamOutlined /> },
    { value: 'beneficiary', label: 'Bénéficiaire', icon: <UserOutlined /> }
  ];

  // ==================== FONCTIONS DE CHARGEMENT ====================

  const loadReseaux = useCallback(async () => {
    setLoading(prev => ({ ...prev, reseaux: true }));
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...(filters.status !== 'all' && filters.status ? { status: filters.status } : {}),
        ...(filters.type !== 'all' && filters.type ? { type: filters.type } : {}),
        ...(filters.search && { search: filters.search }),
        ...(filters.region !== 'all' && filters.region ? { region_code: filters.region } : {})
      };
      
      console.log('📡 Chargement réseaux avec params:', params);
      
      const result = await reseauSoinsAPI.getAllNetworks(params);
      
      console.log('📋 Réponse réseaux:', result);
      
      if (result.success) {
        const formattedReseaux = (result.networks || []).map(reseau => ({
          ...reseau,
          key: reseau.id,
          nombre_membres: reseau.nombre_membres || 0
        }));
        
        setReseaux(formattedReseaux);
        setPagination(prev => ({
          ...prev,
          total: result.pagination?.total || formattedReseaux.length
        }));
        
        // Mettre à jour les statistiques
        const totalMembres = formattedReseaux.reduce((sum, reseau) => 
          sum + (reseau.nombre_membres || 0), 0
        );
        
        const regionsUniques = [...new Set(
          formattedReseaux
            .filter(r => r.region_code)
            .map(r => r.region_code)
        )];
        
        setStatistiques(prev => ({
          ...prev,
          total: result.pagination?.total || formattedReseaux.length,
          regions: regionsUniques.length,
          totalMembres
        }));
        
        message.success(`${formattedReseaux.length} réseau(s) chargé(s)`);
      } else {
        message.error(result.message || 'Erreur lors du chargement des réseaux');
        setReseaux([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement réseaux:', error);
      message.error('Erreur de connexion au serveur');
      setReseaux([]);
    } finally {
      setLoading(prev => ({ ...prev, reseaux: false }));
    }
  }, [filters, pagination.current, pagination.pageSize]);

  const loadStatistiques = useCallback(async () => {
    setLoading(prev => ({ ...prev, statistiques: true }));
    try {
      const response = await reseauSoinsAPI.getStatistics();
      
      if (response.success) {
        setStatistiques(prev => ({
          ...prev,
          actifs: response.statistiques?.reseaux_actifs || 0,
          inactifs: response.statistiques?.reseaux_inactifs || 0,
          en_attente: response.statistiques?.reseaux_en_attente || 0,
          derniers_30_jours: response.statistiques?.reseaux_30jours || 0
        }));
      } else {
        console.warn('⚠️ Statistiques non disponibles:', response.message);
      }
    } catch (error) {
      console.error('❌ Erreur chargement statistiques:', error);
    } finally {
      setLoading(prev => ({ ...prev, statistiques: false }));
    }
  }, []);

  const loadRegions = useCallback(async () => {
    try {
      const response = await reseauSoinsAPI.getRegions();
      
      if (response.success) {
        setRegions(response.regions || []);
      } else {
        console.warn('⚠️ Régions non disponibles, utilisation du fallback');
        setRegions([
          { code: '01', nom: 'Adamaoua' },
          { code: '02', nom: 'Centre' },
          { code: '03', nom: 'Est' },
          { code: '04', nom: 'Extrême-Nord' },
          { code: '05', nom: 'Littoral' }
        ]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement régions:', error);
    }
  }, []);

  const loadCentres = useCallback(async (searchTerm = '') => {
    setLoading(prev => ({ ...prev, centres: true }));
    try {
      const response = await reseauSoinsAPI.searchCentresSante(searchTerm, 20);
      
      if (response.success && response.centres) {
        const formattedCentres = response.centres.map(centre => ({
          id: centre.id || centre.COD_CEN,
          name: centre.nom || centre.NOM_CENTRE || 'Centre sans nom',
          code: centre.id || centre.COD_CEN || 'N/A',
          region: centre.region_nom || centre.region_code || 'Non spécifiée',
          type: centre.type || centre.TYPE_CENTRE || 'Centre de Santé'
        }));
        
        setCentres(formattedCentres);
        return formattedCentres;
      } else {
        console.warn('⚠️ Centres non disponibles:', response.message);
        setCentres([]);
        return [];
      }
    } catch (error) {
      console.error('❌ Erreur chargement centres:', error);
      setCentres([]);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, centres: false }));
    }
  }, []);

  const loadBeneficiaires = useCallback(async (searchTerm = '') => {
    setLoading(prev => ({ ...prev, beneficiaires: true }));
    try {
      const params = {
        limit: 50,
        ...(searchTerm && { search: searchTerm })
      };
      
      console.log('🔍 Chargement bénéficiaires avec params:', params);
      
      // Utilisation directe de l'API bénéficiaires
      const response = await beneficiairesAPI.getAll(params);
      
      console.log('📋 Réponse bénéficiaires:', response);
      
      if (response.success && response.beneficiaires) {
        const formattedBeneficiaires = response.beneficiaires.map(beneficiaire => {
          // Vérifier si la réponse vient de getAll ou de searchAdvanced
          const benefData = beneficiaire;
          
          // Extraire les informations pour l'affichage
          const nom = benefData.nom || benefData.NOM_BEN || '';
          const prenom = benefData.prenom || benefData.PRE_BEN || '';
          const code = benefData.id || benefData.ID_BEN || 'N/A';
          const age = benefData.age || benefData.AGE || 'N/A';
          const identifiant = benefData.identifiant_national || benefData.IDENTIFIANT_NATIONAL || '';
          
          return {
            id: code,
            nom,
            prenom,
            name: `${prenom} ${nom}`.trim(),
            code,
            age,
            condition: benefData.condition || benefData.STATUT_ACE || 'Non spécifiée',
            identifiant_national: identifiant
          };
        });
        
        console.log(`✅ ${formattedBeneficiaires.length} bénéficiaires chargés`);
        setBeneficiaires(formattedBeneficiaires);
        return formattedBeneficiaires;
      } else {
        console.warn('⚠️ Bénéficiaires non disponibles:', response.message);
        setBeneficiaires([]);
        return [];
      }
    } catch (error) {
      console.error('❌ Erreur chargement bénéficiaires:', error);
      message.error('Erreur lors du chargement des bénéficiaires');
      setBeneficiaires([]);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, beneficiaires: false }));
    }
  }, []);

  const loadPrestataires = useCallback(async (searchTerm = '') => {
    setLoading(prev => ({ ...prev, prestataires: true }));
    try {
      const params = {
        limit: 50,
        ...(searchTerm && { search: searchTerm })
      };
      
      console.log('🔍 Chargement prestataires avec params:', params);
      
      // Utilisation directe de l'API prestataires
      const response = await prestatairesAPI.getAll(params);
      
      console.log('📋 Réponse prestataires:', response);
      
      if (response.success && response.prestataires) {
        const formattedPrestataires = response.prestataires.map(prestataire => {
          // Formater pour l'affichage
          const prestaData = prestataire;
          
          // Extraire les informations pour l'affichage
          const nom = prestaData.nom || prestaData.NOM_PRESTATAIRE || '';
          const prenom = prestaData.prenom || prestaData.PRENOM_PRESTATAIRE || '';
          const specialite = prestaData.specialite || prestaData.SPECIALITE || 'Médecin';
          const telephone = prestaData.telephone || prestaData.TELEPHONE || '';
          const code = prestaData.id || prestaData.COD_PRE || 'N/A';
          
          return {
            id: code,
            nom,
            prenom,
            name: `${prenom} ${nom}`.trim(),
            specialite,
            code,
            type: prestaData.type_prestataire || 'Médecin',
            telephone
          };
        });
        
        console.log(`✅ ${formattedPrestataires.length} prestataires chargés`);
        setPrestataires(formattedPrestataires);
        return formattedPrestataires;
      } else {
        console.warn('⚠️ Prestataires non disponibles:', response.message);
        setPrestataires([]);
        return [];
      }
    } catch (error) {
      console.error('❌ Erreur chargement prestataires:', error);
      message.error('Erreur lors du chargement des prestataires');
      setPrestataires([]);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, prestataires: false }));
    }
  }, []);

  const loadReseauDetails = useCallback(async (reseauId) => {
    setLoading(prev => ({ ...prev, details: true }));
    try {
      console.log(`🔍 Chargement détails réseau ID: ${reseauId}`);
      
      const reseauResponse = await reseauSoinsAPI.getNetworkById(reseauId);
      
      if (reseauResponse.success && reseauResponse.network) {
        console.log(`✅ Détails réseau ${reseauId} chargés:`, reseauResponse.network.nom);
        
        setDetailsDrawer({
          visible: true,
          reseau: reseauResponse.network,
          membres: reseauResponse.members || [],
          statistiques: reseauResponse.statistics || {
            total_membres: reseauResponse.members?.length || 0,
            etablissements: reseauResponse.members?.filter(m => 
              m.type_membre === 'Centre de santé' || m.type_membre === 'Etablissement'
            ).length || 0,
            prestataires: reseauResponse.members?.filter(m => 
              m.type_membre === 'Prestataire'
            ).length || 0,
            membres_actifs: reseauResponse.members?.filter(m => 
              m.status_adhesion === 'Actif' || m.statut === 'Actif'
            ).length || 0
          }
        });
        
        if (reseauResponse.members) {
          setStatistiques(prev => ({
            ...prev,
            totalMembres: reseauResponse.members.length || 0
          }));
        }
      } else {
        message.error(reseauResponse.message || 'Erreur lors du chargement des détails');
      }
    } catch (error) {
      console.error('❌ Erreur chargement détails:', error);
      message.error('Erreur lors du chargement des détails');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  }, []);

  // ==================== FONCTIONS DE GESTION ====================

  const handleCreateReseau = async (values) => {
    setNetworkModal(prev => ({ ...prev, loading: true }));
    
    try {
      const reseauData = {
        nom: values.nom,
        description: values.description || '',
        type: values.type,
        objectifs: values.objectifs || '',
        zone_couverture: values.zone_couverture || '',
        population_cible: values.population_cible || '',
        region_code: values.region_code || null,
        contact_principal: values.contact_principal || '',
        telephone_contact: values.telephone_contact || '',
        email_contact: values.email_contact || '',
        site_web: values.site_web || ''
      };
      
      console.log('📤 Création réseau avec données:', reseauData);
      
      const result = await reseauSoinsAPI.createNetwork(reseauData);
      
      if (result.success) {
        message.success('Réseau créé avec succès');
        setNetworkModal({ visible: false, mode: 'create', loading: false });
        networkForm.resetFields();
        loadReseaux();
        loadStatistiques();
      } else {
        throw new Error(result.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('❌ Erreur création réseau:', error);
      message.error(error.message || 'Erreur lors de la création du réseau');
      setNetworkModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleUpdateReseau = async (values) => {
    const reseauId = detailsDrawer.reseau?.id;
    if (!reseauId) {
      message.error('Aucun réseau sélectionné');
      return;
    }
    
    setNetworkModal(prev => ({ ...prev, loading: true }));
    
    try {
      const reseauData = {
        nom: values.nom,
        description: values.description || '',
        type: values.type,
        objectifs: values.objectifs || '',
        zone_couverture: values.zone_couverture || '',
        population_cible: values.population_cible || '',
        region_code: values.region_code || null,
        contact_principal: values.contact_principal || '',
        telephone_contact: values.telephone_contact || '',
        email_contact: values.email_contact || '',
        site_web: values.site_web || ''
      };
      
      console.log('📤 Mise à jour réseau avec données:', reseauData);
      
      const result = await reseauSoinsAPI.updateNetwork(reseauId, reseauData);
      
      if (result.success) {
        message.success('Réseau mis à jour avec succès');
        setNetworkModal({ visible: false, mode: 'edit', loading: false });
        networkForm.resetFields();
        loadReseaux();
        loadStatistiques();
        loadReseauDetails(reseauId);
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour réseau:', error);
      message.error(error.message || 'Erreur lors de la mise à jour du réseau');
      setNetworkModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteReseau = async (reseauId) => {
    try {
      // Note: Ajoutez cette fonction dans reseauSoinsAPI si nécessaire
      const result = await reseauSoinsAPI.deleteNetwork(reseauId);
      
      if (result.success) {
        message.success('Réseau supprimé avec succès');
        loadReseaux();
        loadStatistiques();
        setDetailsDrawer({ visible: false, reseau: null, membres: [], statistiques: {} });
      } else {
        message.error(result.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur suppression réseau:', error);
      message.error('Erreur lors de la suppression du réseau');
    }
  };

  const handleAddMember = async (values) => {
    console.log('🔄 Début handleAddMember:', values);
    
    if (!detailsDrawer.reseau?.id) {
      message.error('Aucun réseau sélectionné');
      return;
    }
    
    setMemberModal(prev => ({ ...prev, loading: true }));
    
    try {
      const memberType = values.type;
      const dateAdhesion = values.date.format('YYYY-MM-DD');
      const statusAdhesion = values.status || 'Actif';
      
      let memberData = {};
      
      // Construire les données selon le type de membre
      switch (memberType) {
        case 'center':
          const selectedCenter = centres.find(c => c.id === values.centerId);
          if (!selectedCenter) {
            throw new Error('Centre de santé non trouvé');
          }
          
          memberData = {
            type_membre: 'Etablissement',
            cod_cen: selectedCenter.id,
            cod_pre: null,
            cod_ben: null,
            date_adhesion: dateAdhesion,
            statut: statusAdhesion
          };
          break;
          
        case 'provider':
          const selectedProvider = prestataires.find(p => p.id === values.providerId);
          if (!selectedProvider) {
            throw new Error('Prestataire non trouvé');
          }
          
          memberData = {
            type_membre: 'Prestataire',
            cod_cen: null,
            cod_pre: selectedProvider.id,
            cod_ben: null,
            date_adhesion: dateAdhesion,
            statut: statusAdhesion
          };
          break;
          
        case 'beneficiary':
          const selectedBeneficiary = beneficiaires.find(b => b.id === values.beneficiaryId);
          if (!selectedBeneficiary) {
            throw new Error('Bénéficiaire non trouvé');
          }
          
          memberData = {
            type_membre: 'Beneficiaire',
            cod_cen: null,
            cod_pre: null,
            cod_ben: selectedBeneficiary.id,
            date_adhesion: dateAdhesion,
            statut: statusAdhesion
          };
          break;
          
        default:
          throw new Error('Type de membre non reconnu');
      }
      
      console.log('📤 Ajout membre avec données:', memberData);
      console.log('📤 ID réseau:', detailsDrawer.reseau.id);
      
      // Utiliser l'API reseauSoinsAPI pour ajouter le membre
      const result = await reseauSoinsAPI.addMemberToNetwork(detailsDrawer.reseau.id, memberData);
      
      console.log('📋 Réponse ajout membre:', result);
      
      if (result.success) {
        message.success('Membre ajouté avec succès');
        setMemberModal({ visible: false, loading: false });
        memberForm.resetFields();
        
        // Recharger les détails du réseau
        loadReseauDetails(detailsDrawer.reseau.id);
        
        // Recharger la liste des réseaux pour mettre à jour le compteur de membres
        loadReseaux();
        
      } else {
        throw new Error(result.message || 'Erreur lors de l\'ajout du membre');
      }
    } catch (error) {
      console.error('❌ Erreur ajout membre:', error);
      message.error(error.message || 'Erreur lors de l\'ajout du membre');
    } finally {
      setMemberModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRemoveMember = async (membreId) => {
    if (!detailsDrawer.reseau?.id) {
      message.error('Aucun réseau sélectionné');
      return;
    }
    
    try {
      // Note: Assurez-vous que cette fonction est bien définie dans reseauSoinsAPI
      const result = await reseauSoinsAPI.removeMember(membreId);
      
      if (result.success) {
        message.success('Membre retiré du réseau');
        loadReseauDetails(detailsDrawer.reseau.id);
        loadReseaux();
      } else {
        message.error(result.message || 'Erreur lors du retrait du membre');
      }
    } catch (error) {
      console.error('❌ Erreur retrait membre:', error);
      message.error('Erreur lors du retrait du membre');
    }
  };

  // ==================== FONCTIONS UTILITAIRES ====================

  const getNetworkColor = (type) => {
    const colors = {
      'Hospitalier': '#1890ff',
      'Primaire': '#52c41a',
      'Specialise': '#722ed1',
      'Territorial': '#fa8c16',
      'Thematique': '#13c2c2',
      'Numerique': '#f5222d'
    };
    return colors[type] || '#d9d9d9';
  };

  const getNetworkTypeConfig = (type) => {
    const configs = {
      'Hospitalier': { color: 'blue', icon: <BankOutlined />, label: 'Hospitalier' },
      'Primaire': { color: 'green', icon: <TeamOutlined />, label: 'Primaire' },
      'Specialise': { color: 'purple', icon: <StarOutlined />, label: 'Spécialisé' },
      'Territorial': { color: 'orange', icon: <EnvironmentOutlined />, label: 'Territorial' },
      'Thematique': { color: 'cyan', icon: <StarOutlined />, label: 'Thématique' },
      'Numerique': { color: 'red', icon: <CloudServerOutlined />, label: 'Numérique' }
    };
    return configs[type] || { color: 'default', icon: <ApartmentOutlined />, label: type };
  };

  const getStatusConfig = (status) => {
    const configs = {
      'Actif': { color: 'success', icon: <CheckCircleOutlined />, label: 'Actif' },
      'Inactif': { color: 'error', icon: <CloseCircleOutlined />, label: 'Inactif' },
      'En attente': { color: 'warning', icon: <ClockCircleOutlined />, label: 'En attente' }
    };
    return configs[status] || { color: 'default', icon: <InfoCircleOutlined />, label: status };
  };

  const getMemberTypeLabel = (type) => {
    switch (type) {
      case 'Bénéficiaire':
      case 'Beneficiaire': 
        return { icon: <UserOutlined />, color: 'blue', label: 'Bénéficiaire' };
      case 'Centre de santé':
      case 'Etablissement': 
        return { icon: <BankOutlined />, color: 'green', label: 'Centre de Santé' };
      case 'Prestataire': 
        return { icon: <TeamOutlined />, color: 'purple', label: 'Prestataire' };
      default: 
        return { icon: <UserOutlined />, color: 'default', label: type };
    }
  };

  const handleEditReseau = (reseau) => {
    networkForm.setFieldsValue({
      nom: reseau.nom,
      description: reseau.description,
      type: reseau.type,
      objectifs: reseau.objectifs,
      zone_couverture: reseau.zone_couverture,
      population_cible: reseau.population_cible,
      region_code: reseau.region_code,
      contact_principal: reseau.contact_principal,
      telephone_contact: reseau.telephone_contact,
      email_contact: reseau.email_contact,
      site_web: reseau.site_web,
      status: reseau.status || 'Actif'
    });
    setNetworkModal({
      visible: true,
      mode: 'edit',
      loading: false
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      search: '',
      region: 'all'
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSearchCenters = (value) => {
    loadCentres(value);
  };

  const handleSearchProviders = (value) => {
    loadPrestataires(value);
  };

  const handleSearchBeneficiaries = (value) => {
    loadBeneficiaires(value);
  };

  const handleMemberTypeChange = (value) => {
    // Réinitialiser les autres champs lorsque le type change
    memberForm.setFieldsValue({
      centerId: undefined,
      providerId: undefined,
      beneficiaryId: undefined
    });
  };

  const openAddMemberModal = () => {
    console.log('📝 Ouverture modal ajout membre');
    
    // Charger les données initiales
    loadCentres();
    loadPrestataires();
    loadBeneficiaires();
    
    // Réinitialiser le formulaire
    memberForm.resetFields();
    memberForm.setFieldsValue({
      type: 'center',
      date: moment(),
      status: 'Actif'
    });
    
    // Ouvrir la modal
    setMemberModal({ visible: true, loading: false });
  };

  // Fonction pour formater l'affichage des options dans les sélecteurs
  const formatOptionDisplay = (type, item) => {
    switch (type) {
      case 'center':
        return (
          <Space direction="vertical" size={0} style={{ display: 'flex' }}>
            <Text strong>{item.name}</Text>
            <Space size="small">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Code: {item.code}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Région: {item.region}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Type: {item.type}
              </Text>
            </Space>
          </Space>
        );
        
      case 'provider':
        return (
          <Space direction="vertical" size={0} style={{ display: 'flex' }}>
            <Text strong>{item.prenom} {item.nom}</Text>
            <Space size="small">
              <Tag color="blue" style={{ fontSize: '11px', margin: 0, padding: '0 4px' }}>
                {item.specialite}
              </Tag>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Code: {item.code}
              </Text>
              {item.telephone && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Tél: {item.telephone}
                </Text>
              )}
            </Space>
          </Space>
        );
        
      case 'beneficiary':
        return (
          <Space direction="vertical" size={0} style={{ display: 'flex' }}>
            <Text strong>{item.prenom} {item.nom}</Text>
            <Space size="small">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Âge: {item.age} ans
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Code: {item.code}
              </Text>
              {item.identifiant_national && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ID: {item.identifiant_national}
                </Text>
              )}
              <Tag color="green" style={{ fontSize: '11px', margin: 0, padding: '0 4px' }}>
                {item.condition}
              </Tag>
            </Space>
          </Space>
        );
        
      default:
        return item.name || item.id;
    }
  };

  // Configuration des onglets pour le drawer
  const tabItems = [
    {
      key: 'info',
      label: 'Informations',
      children: detailsDrawer.reseau ? (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Description">
            {detailsDrawer.reseau.description || 'Non spécifiée'}
          </Descriptions.Item>
          <Descriptions.Item label="Objectifs">
            {detailsDrawer.reseau.objectifs || 'Non spécifiés'}
          </Descriptions.Item>
          <Descriptions.Item label="Zone de Couverture">
            {detailsDrawer.reseau.zone_couverture || 'Non spécifiée'}
          </Descriptions.Item>
          <Descriptions.Item label="Population Cible">
            {detailsDrawer.reseau.population_cible || 'Non spécifiée'}
          </Descriptions.Item>
          <Descriptions.Item label="Région">
            {regions.find(r => r.code === detailsDrawer.reseau.region_code)?.nom || 
             detailsDrawer.reseau.region_code || 'Non spécifiée'}
          </Descriptions.Item>
          <Descriptions.Item label="Date de Création">
            {detailsDrawer.reseau.date_creation ? 
              moment(detailsDrawer.reseau.date_creation).format('DD/MM/YYYY HH:mm') : 
              'Non spécifiée'}
          </Descriptions.Item>
        </Descriptions>
      ) : null
    },
    {
      key: 'contact',
      label: 'Contact',
      children: detailsDrawer.reseau ? (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Contact Principal">
            {detailsDrawer.reseau.contact_principal || 'Non spécifié'}
          </Descriptions.Item>
          <Descriptions.Item label="Téléphone">
            {detailsDrawer.reseau.telephone_contact ? (
              <Space>
                <PhoneOutlined />
                {detailsDrawer.reseau.telephone_contact}
              </Space>
            ) : 'Non spécifié'}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {detailsDrawer.reseau.email_contact ? (
              <Space>
                <MailOutlined />
                {detailsDrawer.reseau.email_contact}
              </Space>
            ) : 'Non spécifié'}
          </Descriptions.Item>
          <Descriptions.Item label="Site Web">
            {detailsDrawer.reseau.site_web ? (
              <a href={detailsDrawer.reseau.site_web} target="_blank" rel="noopener noreferrer">
                <Space>
                  <LinkOutlined />
                  {detailsDrawer.reseau.site_web}
                </Space>
              </a>
            ) : 'Non spécifié'}
          </Descriptions.Item>
        </Descriptions>
      ) : null
    },
    {
      key: 'members',
      label: `Membres (${detailsDrawer.membres?.length || 0})`,
      children: (
        <>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography.Text strong>Liste des membres</Typography.Text>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={openAddMemberModal}
            >
              Ajouter
            </Button>
          </div>
          
          {detailsDrawer.membres?.length > 0 ? (
            <List
              dataSource={detailsDrawer.membres}
              renderItem={member => {
                const memberType = getMemberTypeLabel(member.type_membre);
                return (
                  <List.Item
                    actions={[
                      <Tooltip title="Retirer" key="delete">
                        <Popconfirm
                          title="Retirer ce membre du réseau ?"
                          onConfirm={() => handleRemoveMember(member.id)}
                          okText="Oui"
                          cancelText="Non"
                        >
                          <Button size="small" danger icon={<MinusCircleOutlined />} />
                        </Popconfirm>
                      </Tooltip>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={memberType.icon}
                          style={{ backgroundColor: memberType.color }}
                        />
                      }
                      title={
                        <div>
                          {member.nom_complet || member.nom_membre || 'Membre'}
                          <Tag color={memberType.color} style={{ marginLeft: '8px', fontSize: '10px' }}>
                            {memberType.label}
                          </Tag>
                        </div>
                      }
                      description={
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <Text type="secondary">
                            Adhésion: {moment(member.date_adhesion).format('DD/MM/YYYY')}
                          </Text>
                          <Tag color={getStatusConfig(member.statut || member.status_adhesion).color} size="small">
                            {member.statut || member.status_adhesion || 'Actif'}
                          </Tag>
                          {member.specialite && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Spécialité: {member.specialite}
                            </Text>
                          )}
                          {member.code_membre && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Code: {member.code_membre}
                            </Text>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          ) : (
            <Empty
              description="Aucun membre dans ce réseau"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<UsergroupAddOutlined />}
                onClick={openAddMemberModal}
              >
                Ajouter le premier membre
              </Button>
            </Empty>
          )}
        </>
      )
    },
    {
      key: 'stats',
      label: 'Statistiques',
      children: (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="Membres Totaux"
                value={detailsDrawer.statistiques.total_membres || 0}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="Établissements"
                value={detailsDrawer.statistiques.etablissements || 0}
                prefix={<BankOutlined />}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="Prestataires"
                value={detailsDrawer.statistiques.prestataires || 0}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="Membres Actifs"
                value={detailsDrawer.statistiques.membres_actifs || 0}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )
    }
  ];

  // Configuration des colonnes du tableau
  const reseauxColumns = [
    {
      title: 'Nom du Réseau',
      dataIndex: 'nom',
      key: 'nom',
      width: 200,
      render: (text, record) => (
        <Space>
          <Avatar 
            size="large" 
            icon={<ApartmentOutlined />}
            style={{ 
              backgroundColor: getNetworkColor(record.type),
              color: '#fff'
            }}
          />
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description?.substring(0, 50)}...
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => {
        const typeConfig = getNetworkTypeConfig(type);
        return (
          <Tag color={typeConfig.color} icon={typeConfig.icon}>
            {typeConfig.label}
          </Tag>
        );
      }
    },
    {
      title: 'Région',
      dataIndex: 'region_code',
      key: 'region_code',
      width: 120,
      render: (code) => {
        const region = regions.find(r => r.code === code);
        return region ? region.nom : code || '-';
      }
    },
    {
      title: 'Membres',
      dataIndex: 'nombre_membres',
      key: 'nombre_membres',
      width: 100,
      render: (count) => (
        <Badge 
          count={count || 0} 
          style={{ 
            backgroundColor: '#1890ff',
            fontSize: '12px'
          }} 
        />
      )
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusConfig = getStatusConfig(status);
        return (
          <Tag 
            color={statusConfig.color} 
            icon={statusConfig.icon}
            style={{ marginRight: 0 }}
          >
            {statusConfig.label}
          </Tag>
        );
      }
    },
    {
      title: 'Date de Création',
      dataIndex: 'date_creation',
      key: 'date_creation',
      width: 150,
      render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir détails">
            <Button
              icon={<EyeOutlined />}
              onClick={() => loadReseauDetails(record.id)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEditReseau(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Popconfirm
              title="Êtes-vous sûr de vouloir supprimer ce réseau ?"
              onConfirm={() => handleDeleteReseau(record.id)}
              okText="Oui"
              cancelText="Non"
            >
              <Button
                icon={<DeleteOutlined />}
                danger
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  // ==================== EFFETS ====================

  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

  useEffect(() => {
    loadReseaux();
    loadStatistiques();
  }, [loadReseaux, loadStatistiques]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (filters.search) {
        loadReseaux();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [filters.search, loadReseaux]);

  // ==================== RENDU PRINCIPAL ====================

  return (
    <div style={{ padding: '24px' }}>
      {/* En-tête */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ApartmentOutlined style={{ marginRight: '12px', fontSize: '24px', color: '#1890ff' }} />
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
              Gestion des Réseaux de Soins
            </span>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              networkForm.resetFields();
              networkForm.setFieldsValue({ 
                status: 'Actif',
                type: 'Hospitalier'
              });
              setNetworkModal({
                visible: true,
                mode: 'create',
                loading: false
              });
            }}
          >
            Nouveau Réseau
          </Button>
        }
        style={{ marginBottom: '24px' }}
      >
        {/* Filtres */}
        <div style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                type={showFilters ? 'primary' : 'default'}
              >
                Filtres
              </Button>
            </Col>
            
            {showFilters && (
              <>
                <Col>
                  <Input
                    placeholder="Rechercher par nom..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    style={{ width: '200px' }}
                    prefix={<SearchOutlined />}
                  />
                </Col>
                <Col>
                  <Select
                    value={filters.status}
                    onChange={(value) => handleFilterChange('status', value)}
                    style={{ width: '150px' }}
                    placeholder="Statut"
                  >
                    <Option value="all">Tous les statuts</Option>
                    {statusOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col>
                  <Select
                    value={filters.type}
                    onChange={(value) => handleFilterChange('type', value)}
                    style={{ width: '200px' }}
                    placeholder="Type"
                  >
                    <Option value="all">Tous les types</Option>
                    {networkTypes.map(type => (
                      <Option key={type.value} value={type.value}>
                        {type.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col>
                  <Select
                    value={filters.region}
                    onChange={(value) => handleFilterChange('region', value)}
                    style={{ width: '150px' }}
                    placeholder="Région"
                  >
                    <Option value="all">Toutes les régions</Option>
                    {regions.map(region => (
                      <Option key={region.code} value={region.code}>
                        {region.nom}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col>
                  <Button
                    onClick={handleResetFilters}
                    style={{ marginRight: '8px' }}
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    type="primary"
                    onClick={loadReseaux}
                    icon={<SyncOutlined />}
                    loading={loading.reseaux}
                  >
                    Actualiser
                  </Button>
                </Col>
              </>
            )}
          </Row>
        </div>

        {/* Statistiques */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Réseaux Totaux"
                value={statistiques.total}
                prefix={<ApartmentOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                {statistiques.actifs} actifs • {statistiques.inactifs} inactifs
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Membres Totaux"
                value={statistiques.totalMembres}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                Sur {statistiques.total} réseaux
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Régions Couvertes"
                value={statistiques.regions}
                prefix={<GlobalOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                Sur {regions.length} régions
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="30 Derniers Jours"
                value={statistiques.derniers_30_jours}
                prefix={<ArrowUpOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                Nouvelles créations
              </div>
            </Card>
          </Col>
        </Row>

        {/* Tableau des réseaux */}
        <Card
          title={`Liste des Réseaux (${pagination.total})`}
          extra={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Text type="secondary" style={{ marginRight: '16px' }}>
                Page {pagination.current} sur {Math.ceil(pagination.total / pagination.pageSize)}
              </Text>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => message.info('Export non implémenté')}
              >
                Exporter
              </Button>
            </div>
          }
        >
          <Table
            columns={reseauxColumns}
            dataSource={reseaux}
            loading={loading.reseaux}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} sur ${total} réseaux`,
              onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize, total: pagination.total });
              }
            }}
            scroll={{ x: 1200 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    filters.search || filters.status !== 'all' || filters.type !== 'all'
                      ? 'Aucun réseau trouvé avec ces critères'
                      : 'Aucun réseau disponible. Créez votre premier réseau !'
                  }
                >
                  {(!filters.search && filters.status === 'all' && filters.type === 'all') && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        networkForm.resetFields();
                        networkForm.setFieldsValue({ 
                          status: 'Actif',
                          type: 'Hospitalier'
                        });
                        setNetworkModal({
                          visible: true,
                          mode: 'create',
                          loading: false
                        });
                      }}
                    >
                      Créer un Réseau
                    </Button>
                  )}
                </Empty>
              )
            }}
          />
        </Card>
      </Card>

      {/* ==================== MODALES ==================== */}

      {/* Modal Création/Édition Réseau */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {networkModal.mode === 'create' ? (
              <>
                <PlusOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                Créer un Nouveau Réseau
              </>
            ) : (
              <>
                <EditOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                Modifier le Réseau
              </>
            )}
          </div>
        }
        open={networkModal.visible}
        onCancel={() => {
          setNetworkModal({ visible: false, mode: 'create', loading: false });
          networkForm.resetFields();
        }}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => {
            setNetworkModal({ visible: false, mode: 'create', loading: false });
            networkForm.resetFields();
          }}>
            Annuler
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={networkModal.loading}
            onClick={() => networkForm.submit()}
          >
            {networkModal.mode === 'create' ? 'Créer' : 'Modifier'}
          </Button>
        ]}
        destroyOnClose
      >
        <Form
          form={networkForm}
          layout="vertical"
          onFinish={networkModal.mode === 'create' ? handleCreateReseau : handleUpdateReseau}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nom"
                label="Nom du Réseau"
                rules={[{ required: true, message: 'Veuillez saisir le nom du réseau' }]}
              >
                <Input placeholder="Ex: Réseau Hospitalier Régional" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Type de Réseau"
                rules={[{ required: true, message: 'Veuillez sélectionner le type' }]}
              >
                <Select placeholder="Sélectionnez un type">
                  {networkTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea
              rows={3}
              placeholder="Décrivez les objectifs et caractéristiques du réseau..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="objectifs"
            label="Objectifs"
          >
            <TextArea
              rows={2}
              placeholder="Objectifs principaux du réseau..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="zone_couverture"
                label="Zone de Couverture"
              >
                <Input placeholder="Ex: Département, ville, bassin de vie..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="population_cible"
                label="Population Cible"
              >
                <Input placeholder="Ex: Adultes, enfants, patients chroniques..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="region_code"
                label="Région"
              >
                <Select placeholder="Sélectionnez une région">
                  <Option value="">Non spécifiée</Option>
                  {regions.map(region => (
                    <Option key={region.code} value={region.code}>
                      {region.nom}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Statut"
                initialValue="Actif"
              >
                <Select>
                  {statusOptions.map(status => (
                    <Option key={status.value} value={status.value}>
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Contact</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contact_principal"
                label="Contact Principal"
              >
                <Input placeholder="Nom et prénom du contact" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="telephone_contact"
                label="Téléphone"
              >
                <Input placeholder="Numéro de téléphone" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email_contact"
                label="Email"
                rules={[
                  { type: 'email', message: 'Veuillez saisir un email valide' }
                ]}
              >
                <Input placeholder="adresse@email.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="site_web"
                label="Site Web"
              >
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Drawer Détails Réseau */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ApartmentOutlined style={{ marginRight: '12px', fontSize: '20px' }} />
            <span>Détails du Réseau</span>
          </div>
        }
        width={800}
        open={detailsDrawer.visible}
        onClose={() => setDetailsDrawer({ 
          visible: false, 
          reseau: null,
          membres: [],
          statistiques: {}
        })}
        extra={
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => detailsDrawer.reseau && handleEditReseau(detailsDrawer.reseau)}
              disabled={!detailsDrawer.reseau}
            >
              Modifier
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddMemberModal}
              disabled={!detailsDrawer.reseau}
            >
              Ajouter Membre
            </Button>
          </Space>
        }
      >
        {loading.details ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '20px' }}>Chargement des détails...</div>
          </div>
        ) : detailsDrawer.reseau ? (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <Avatar
                  size={64}
                  icon={<ApartmentOutlined />}
                  style={{
                    backgroundColor: getNetworkColor(detailsDrawer.reseau.type),
                    color: '#fff',
                    marginRight: '16px'
                  }}
                />
                <div>
                  <Typography.Title level={3} style={{ margin: 0 }}>
                    {detailsDrawer.reseau.nom}
                  </Typography.Title>
                  <Space style={{ marginTop: '8px' }}>
                    <Tag color={getNetworkTypeConfig(detailsDrawer.reseau.type).color}>
                      {detailsDrawer.reseau.type}
                    </Tag>
                    <Tag 
                      color={getStatusConfig(detailsDrawer.reseau.status).color}
                      icon={getStatusConfig(detailsDrawer.reseau.status).icon}
                    >
                      {detailsDrawer.reseau.status}
                    </Tag>
                  </Space>
                </div>
              </div>

              <Tabs defaultActiveKey="info" items={tabItems} />
            </div>
          </>
        ) : (
          <Empty
            description="Aucune donnée disponible"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Drawer>

      {/* Modal Ajouter Membre - AMÉLIORATION DE L'AFFICHAGE */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UsergroupAddOutlined style={{ marginRight: '8px' }} />
            <span>Ajouter un Membre au Réseau</span>
          </div>
        }
        open={memberModal.visible}
        onCancel={() => {
          setMemberModal({ visible: false, loading: false });
          memberForm.resetFields();
        }}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setMemberModal({ visible: false, loading: false })}>
            Annuler
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={memberModal.loading}
            onClick={() => memberForm.submit()}
          >
            Ajouter
          </Button>
        ]}
        destroyOnClose
      >
        <Alert
          message="Information"
          description="Sélectionnez un type de membre et choisissez parmi la liste disponible."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Form
          form={memberForm}
          layout="vertical"
          onFinish={handleAddMember}
        >
          <Form.Item
            name="type"
            label="Type de Membre"
            rules={[{ required: true, message: 'Veuillez sélectionner le type' }]}
            initialValue="center"
          >
            <Select
              placeholder="Sélectionnez le type de membre"
              onChange={handleMemberTypeChange}
            >
              {memberTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Sélection du centre de santé - AMÉLIORÉ */}
          {memberForm.getFieldValue('type') === 'center' && (
            <Form.Item
              name="centerId"
              label="Centre de Santé"
              rules={[{ required: true, message: 'Veuillez sélectionner un centre de santé' }]}
            >
              <Select
                showSearch
                placeholder="Rechercher un centre de santé..."
                optionFilterProp="children"
                onSearch={handleSearchCenters}
                filterOption={false}
                loading={loading.centres}
                notFoundContent={loading.centres ? <Spin size="small" /> : 'Aucun centre trouvé'}
                optionLabelProp="label"
              >
                {centres.map(centre => (
                  <Option 
                    key={centre.id} 
                    value={centre.id}
                    label={`${centre.name} (${centre.code})`}
                  >
                    {formatOptionDisplay('center', centre)}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {/* Sélection du prestataire - AMÉLIORÉ */}
          {memberForm.getFieldValue('type') === 'provider' && (
            <Form.Item
              name="providerId"
              label="Prestataire"
              rules={[{ required: true, message: 'Veuillez sélectionner un prestataire' }]}
            >
              <Select
                showSearch
                placeholder="Rechercher un prestataire..."
                optionFilterProp="children"
                onSearch={handleSearchProviders}
                filterOption={false}
                loading={loading.prestataires}
                notFoundContent={loading.prestataires ? <Spin size="small" /> : 'Aucun prestataire trouvé'}
                optionLabelProp="label"
              >
                {prestataires.map(prestataire => (
                  <Option 
                    key={prestataire.id} 
                    value={prestataire.id}
                    label={`${prestataire.prenom} ${prestataire.nom} - ${prestataire.specialite}`}
                  >
                    {formatOptionDisplay('provider', prestataire)}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {/* Sélection du bénéficiaire - AMÉLIORÉ */}
          {memberForm.getFieldValue('type') === 'beneficiary' && (
            <Form.Item
              name="beneficiaryId"
              label="Bénéficiaire"
              rules={[{ required: true, message: 'Veuillez sélectionner un bénéficiaire' }]}
            >
              <Select
                showSearch
                placeholder="Rechercher un bénéficiaire..."
                optionFilterProp="children"
                onSearch={handleSearchBeneficiaries}
                filterOption={false}
                loading={loading.beneficiaires}
                notFoundContent={loading.beneficiaires ? <Spin size="small" /> : 'Aucun bénéficiaire trouvé'}
                optionLabelProp="label"
              >
                {beneficiaires.map(beneficiaire => (
                  <Option 
                    key={beneficiaire.id} 
                    value={beneficiaire.id}
                    label={`${beneficiaire.prenom} ${beneficiaire.nom} (${beneficiaire.code})`}
                  >
                    {formatOptionDisplay('beneficiary', beneficiaire)}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Date d'Adhésion"
                rules={[{ required: true, message: 'Veuillez sélectionner la date' }]}
                initialValue={moment()}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Statut"
                initialValue="Actif"
              >
                <Select>
                  <Option value="Actif">Actif</Option>
                  <Option value="Inactif">Inactif</Option>
                  <Option value="En attente">En attente</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default NetworkPage;