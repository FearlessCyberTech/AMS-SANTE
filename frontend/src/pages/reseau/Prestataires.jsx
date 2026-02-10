// GestionPrestataires.jsx - Version Ant Design avec correction des centres
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Table, Card, Row, Col, Statistic, Button, Modal, Form,
  Select, Input, DatePicker, Tag, Space, message, Tabs,
  Descriptions, Tooltip, Popconfirm, Spin, Alert,
  Divider, Badge, Typography,
  Drawer, Avatar, Switch, InputNumber, Steps, Radio, Upload, Progress
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, SearchOutlined, FilterOutlined,
  DownloadOutlined, SyncOutlined, UploadOutlined,
  UserOutlined, TeamOutlined, 
  PhoneOutlined, MailOutlined, LinkOutlined,
  StarOutlined, CloudServerOutlined, ApartmentOutlined,
  UsergroupAddOutlined, GlobalOutlined, EnvironmentOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  InfoCircleOutlined, ArrowUpOutlined, SaveOutlined,
  MinusCircleOutlined, DatabaseOutlined, ExclamationCircleOutlined,
  IdcardOutlined, BankOutlined, CalendarOutlined,
  BookOutlined, TrophyOutlined, DollarOutlined,
  FileTextOutlined, FlagOutlined, TranslationOutlined
} from '@ant-design/icons';
import { prestatairesAPI, centresAPI, paysAPI, syncAPI } from '../../services/api';
import moment from 'moment';
import 'moment/locale/fr';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;
const { Step } = Steps;
const { Dragger } = Upload;

const GestionPrestataires = () => {
  // États principaux
  const [prestataires, setPrestataires] = useState([]);
  const [loading, setLoading] = useState({
    prestataires: false,
    details: false,
    action: false,
    sync: false,
    export: false
  });
  
  // États de recherche et filtres
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: '',
    specialite: 'all',
    centre: 'all',
    pays: 'all',
    experience_min: '',
    experience_max: ''
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
    totalCentres: 0,
    totalPays: 0,
    derniers_30_jours: 0,
    par_specialite: [],
    par_type: [],
    par_pays: []
  });
  
  // États pour les données
  const [centres, setCentres] = useState([]);
  const [allCentres, setAllCentres] = useState([]);
  const [pays, setPays] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  
  // États pour les modales et drawer
  const [addModal, setAddModal] = useState({
    visible: false,
    loading: false,
    currentStep: 0
  });
  
  const [editModal, setEditModal] = useState({
    visible: false,
    loading: false,
    prestataire: null
  });
  
  const [detailsDrawer, setDetailsDrawer] = useState({
    visible: false,
    prestataire: null,
    informations: {}
  });
  
  const [syncModal, setSyncModal] = useState({
    visible: false,
    loading: false,
    prestataire: null
  });
  
  // États pour les formulaires
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [syncForm] = Form.useForm();
  
  // Données pour les formulaires
  const typesPrestataire = [
    { value: 'Médecin', label: 'Médecin' },
    { value: 'Infirmier', label: 'Infirmier' },
    { value: 'Kinésithérapeute', label: 'Kinésithérapeute' },
    { value: 'Sage-femme', label: 'Sage-femme' },
    { value: 'Pharmacien', label: 'Pharmacien' },
    { value: 'Technicien de laboratoire', label: 'Technicien de laboratoire' },
    { value: 'Aide-soignant', label: 'Aide-soignant' },
    { value: 'Radiologue', label: 'Radiologue' },
    { value: 'Chirurgien', label: 'Chirurgien' }
  ];
  
  const statusOptions = [
    { value: 'Actif', label: 'Actif', color: 'success' },
    { value: 'Inactif', label: 'Inactif', color: 'error' }
  ];
  
  const disponibiliteOptions = [
    { value: 'Disponible', label: 'Disponible', color: 'success' },
    { value: 'En congé', label: 'En congé', color: 'warning' },
    { value: 'Indisponible', label: 'Indisponible', color: 'error' },
    { value: 'En formation', label: 'En formation', color: 'blue' },
    { value: 'En mission', label: 'En mission', color: 'purple' }
  ];
  
  const languesOptions = [
    { value: 'Français', label: 'Français' },
    { value: 'Anglais', label: 'Anglais' },
    { value: 'Espagnol', label: 'Espagnol' },
    { value: 'Arabe', label: 'Arabe' },
    { value: 'Portugais', label: 'Portugais' }
  ];
  
  const titresOptions = [
    { value: 'Docteur', label: 'Docteur' },
    { value: 'Professeur', label: 'Professeur' },
    { value: 'Chargé de cours', label: 'Chargé de cours' },
    { value: 'Maître de conférences', label: 'Maître de conférences' },
    { value: 'Interne', label: 'Interne' },
    { value: 'Externe', label: 'Externe' }
  ];

  // ==================== FONCTIONS UTILITAIRES ====================

  const getStatusConfig = (status) => {
    const configs = {
      'Actif': { color: 'success', icon: <CheckCircleOutlined />, label: 'Actif' },
      'Inactif': { color: 'error', icon: <CloseCircleOutlined />, label: 'Inactif' },
      'En attente': { color: 'warning', icon: <ClockCircleOutlined />, label: 'En attente' }
    };
    return configs[status] || { color: 'default', icon: <InfoCircleOutlined />, label: status };
  };

  const getDisponibiliteConfig = (disponibilite) => {
    const configs = {
      'Disponible': { color: 'success', icon: <CheckCircleOutlined />, label: 'Disponible' },
      'En congé': { color: 'warning', icon: <ClockCircleOutlined />, label: 'En congé' },
      'Indisponible': { color: 'error', icon: <CloseCircleOutlined />, label: 'Indisponible' },
      'En formation': { color: 'blue', icon: <BookOutlined />, label: 'En formation' },
      'En mission': { color: 'purple', icon: <EnvironmentOutlined />, label: 'En mission' }
    };
    return configs[disponibilite] || { color: 'default', icon: <InfoCircleOutlined />, label: disponibilite };
  };

  const getTypeConfig = (type) => {
    const configs = {
      'Médecin': { color: 'blue', icon: <MedicineBoxOutlined/>, label: 'Médecin' },
      'Infirmier': { color: 'green', icon: <TeamOutlined />, label: 'Infirmier' },
      'Kinésithérapeute': { color: 'purple', icon: <UserOutlined />, label: 'Kinésithérapeute' },
      'Sage-femme': { color: 'pink', icon: <UserOutlined />, label: 'Sage-femme' },
      'Pharmacien': { color: 'orange', icon: <MedicineBoxOutlined />, label: 'Pharmacien' }
    };
    return configs[type] || { color: 'default', icon: <UserOutlined />, label: type };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return moment(dateString).format('DD/MM/YYYY');
    } catch (error) {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return moment(dateString).format('DD/MM/YYYY HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  // ==================== FONCTIONS DE CHARGEMENT ====================

  const loadPrestataires = useCallback(async () => {
    setLoading(prev => ({ ...prev, prestataires: true }));
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...(filters.status !== 'all' && filters.status ? { actif: filters.status === 'Actif' ? 1 : 0 } : {}),
        ...(filters.type !== 'all' && filters.type ? { type_prestataire: filters.type } : {}),
        ...(filters.search && { search: filters.search }),
        ...(filters.specialite !== 'all' && filters.specialite ? { specialite: filters.specialite } : {}),
        ...(filters.centre !== 'all' && filters.centre ? { cod_cen: filters.centre } : {}),
        ...(filters.pays !== 'all' && filters.pays ? { cod_pay: filters.pays } : {}),
        ...(filters.experience_min && { experience_min: filters.experience_min }),
        ...(filters.experience_max && { experience_max: filters.experience_max })
      };
      
      const response = await prestatairesAPI.getAll(params);
      
      if (response.success) {
        const prestatairesData = response.data || response.prestataires || [];
        
        const formattedPrestataires = prestatairesData.map(prestataire => ({
          ...prestataire,
          key: prestataire.id || prestataire.COD_PRE || `prest_${Math.random().toString(36).substr(2, 9)}`,
          nom_complet: `${prestataire.prenom || ''} ${prestataire.nom || ''}`.trim(),
          isActif: prestataire.actif === 1 || prestataire.status === 'Actif'
        }));
        
        setPrestataires(formattedPrestataires);
        setPagination(prev => ({
          ...prev,
          total: response.total || response.pagination?.total || formattedPrestataires.length
        }));
        
        // Calcul des statistiques
        const actifs = formattedPrestataires.filter(p => p.isActif).length;
        const inactifs = formattedPrestataires.filter(p => !p.isActif).length;
        
        const trenteJours = moment().subtract(30, 'days');
        const derniers_30_jours = formattedPrestataires.filter(p => 
          moment(p.date_creation || p.DAT_CREUTIL).isAfter(trenteJours)
        ).length;
        
        const specialitesUniques = [...new Set(
          formattedPrestataires
            .filter(p => p.specialite)
            .map(p => p.specialite)
        )];
        
        const typesUniques = [...new Set(
          formattedPrestataires
            .filter(p => p.type_prestataire)
            .map(p => p.type_prestataire)
        )];
        
        const paysUniques = [...new Set(
          formattedPrestataires
            .filter(p => p.cod_pay)
            .map(p => p.cod_pay)
        )];
        
        setStatistiques(prev => ({
          ...prev,
          total: response.total || response.pagination?.total || formattedPrestataires.length,
          actifs,
          inactifs,
          derniers_30_jours,
          par_specialite: specialitesUniques.map(s => ({ 
            specialite: s, 
            nombre: formattedPrestataires.filter(p => p.specialite === s).length 
          })),
          par_type: typesUniques.map(t => ({ 
            type: t, 
            nombre: formattedPrestataires.filter(p => p.type_prestataire === t).length 
          })),
          par_pays: paysUniques.map(p => ({ 
            pays: p, 
            nombre: formattedPrestataires.filter(prest => prest.cod_pay === p).length 
          }))
        }));
        
        message.success(`${formattedPrestataires.length} prestataire(s) chargé(s)`);
      } else {
        message.error(response.message || 'Erreur lors du chargement des prestataires');
        setPrestataires([]);
      }
    } catch (error) {
      console.error('Erreur chargement prestataires:', error);
      message.error('Erreur de connexion au serveur');
      setPrestataires([]);
    } finally {
      setLoading(prev => ({ ...prev, prestataires: false }));
    }
  }, [filters, pagination.current, pagination.pageSize]);
const loadCentres = useCallback(async () => {
  setLoading(prev => ({ ...prev, centres: true }));
  try {
    // Charger les centres — si l'utilisateur est lié à un centre, ne charger que celui-ci
    const user = (window && window.localStorage && localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')) : null;
    const userCentreId = user?.centre_id || user?.COD_CEN || user?.prestataire?.centre_id || null;
    
    let response;
    if (user && !user.super_admin && userCentreId) {
      const centreResult = await centresAPI.getById(userCentreId);
      response = { success: centreResult.success, centres: centreResult.centre ? [centreResult.centre] : (centreResult.centres || []) };
    } else {
      response = await centresAPI.getAll({ limit: 1000 });
    }
    
    console.log('✅ Centers loaded for Prestataires:', response);
    
    if (response.success) {
      const centresData = response.data || response.centres || [];
      
      const formattedCentres = centresData.map(centre => {
        // Conversion FORCÉE en nombre
        const centreId = centre.id || centre.COD_CEN || centre.code;
        const codCen = parseInt(centreId, 10);
        
        if (isNaN(codCen)) {
          console.warn(`⚠️ Centre ID invalide: ${centreId}`);
        }
        
        return {
          id: centreId,
          key: centreId,
          cod_cen: codCen, // FORCER en nombre
          name: centre.nom || centre.LIB_CEN || centre.NOM_CENTRE || centre.name || `Centre ${centreId}`,
          code: centre.code || centre.COD_CEN || centreId,
          region: centre.region || centre.REGION || centre.COD_REG || 'Non spécifiée',
          type: centre.type || centre.TYP_CEN || centre.TYPE_CENTRE || 'Centre de Santé',
          telephone: centre.telephone || centre.TELEPHONE || centre.TR1_CEN || '',
          adresse: centre.adresse || centre.ADRESSE || centre.NUM_ADR || '',
          status: centre.status || centre.STATUT || centre.actif || 'Actif'
        };
      });
      
      setCentres(formattedCentres);
      setAllCentres(formattedCentres);
      
      console.log(`✅ ${formattedCentres.length} centres chargés`, formattedCentres);
    } else {
      // Fallback avec des nombres
      const fallbackCentres = [
        {
          id: '42',
          key: '42',
          cod_cen: 42, // NOMBRE
          name: "Hôpital Central de Bangui",
          code: "1006",
          region: "Centre",
          type: "Centre Hospitalier",
          telephone: "+236 21 61 00 00",
          adresse: "Bangui, République Centrafricaine",
          status: "Actif"
        }
      ];
      
      setCentres(fallbackCentres);
      setAllCentres(fallbackCentres);
    }
  } catch (error) {
    console.error('❌ Erreur chargement centres:', error);
    message.error('Erreur lors du chargement des centres');
    
    // Fallback minimal avec nombre
    const fallbackCentres = [
      {
        id: '42',
        key: '42',
        cod_cen: 42, // NOMBRE
        name: "Hôpital Central de Bangui",
        code: "1006",
        region: "Centre",
        type: "Centre Hospitalier",
        telephone: "+236 21 61 00 00",
        adresse: "Bangui, République Centrafricaine",
        status: "Actif"
      }
    ];
    
    setCentres(fallbackCentres);
    setAllCentres(fallbackCentres);
  } finally {
    setLoading(prev => ({ ...prev, centres: false }));
  }
}, []);

  const loadPays = useCallback(async () => {
    try {
      const response = await paysAPI.getAll();
      
      if (response.success) {
        const paysData = response.data || response.pays || [];
        
        const formattedPays = paysData.map(p => ({
          value: p.COD_PAY || p.code || p.id || p.value,
          label: p.LIB_PAY || p.nom || p.label || p.name || p.COD_PAY,
          code_telephone: p.CODE_TELEPHONE || p.code_telephone || ''
        }));
        
        setPays(formattedPays);
        
        // Mettre à jour les statistiques
        setStatistiques(prev => ({
          ...prev,
          totalPays: formattedPays.length
        }));
        
        console.log(`✅ ${formattedPays.length} pays chargés`);
      } else {
        // Fallback
        const fallbackPays = [
          { value: 'CF', label: 'République Centrafricaine', code_telephone: '+236' },
          { value: 'FR', label: 'France', code_telephone: '+33' },
          { value: 'BE', label: 'Belgique', code_telephone: '+32' },
          { value: 'CH', label: 'Suisse', code_telephone: '+41' }
        ];
        
        setPays(fallbackPays);
        setStatistiques(prev => ({
          ...prev,
          totalPays: fallbackPays.length
        }));
        
        console.warn('⚠️ Utilisation des pays de fallback');
      }
    } catch (error) {
      console.error('❌ Erreur chargement pays:', error);
      message.error('Erreur lors du chargement des pays');
      
      // Fallback minimal
      const fallbackPays = [
        { value: 'CF', label: 'République Centrafricaine', code_telephone: '+236' }
      ];
      
      setPays(fallbackPays);
      setStatistiques(prev => ({
        ...prev,
        totalPays: fallbackPays.length
      }));
    }
  }, []);

  const loadSpecialites = useCallback(async () => {
    try {
      const response = await prestatairesAPI.getSpecialites();
      
      if (response.success) {
        const specData = response.data || response.specialites || [];
        
        // Formater les spécialités
        const formattedSpecs = specData.map(spec => ({
          value: spec.value || spec.code || spec.id || spec,
          label: spec.label || spec.nom || spec.name || spec
        }));
        
        setSpecialites(formattedSpecs);
        
        console.log(`✅ ${formattedSpecs.length} spécialités chargées`);
      } else {
        // Fallback
        const fallbackSpecs = [
          'Médecine générale',
          'Cardiologie',
          'Dermatologie',
          'Pédiatrie',
          'Gynécologie',
          'Chirurgie',
          'Radiologie',
          'Anesthésiologie',
          'Urgences'
        ].map(spec => ({ value: spec, label: spec }));
        
        setSpecialites(fallbackSpecs);
        console.warn('⚠️ Utilisation des spécialités de fallback');
      }
    } catch (error) {
      console.error('❌ Erreur chargement spécialités:', error);
      
      // Fallback minimal
      const fallbackSpecs = [
        'Médecine générale',
        'Cardiologie',
        'Pédiatrie'
      ].map(spec => ({ value: spec, label: spec }));
      
      setSpecialites(fallbackSpecs);
    }
  }, []);

  const loadPrestataireDetails = useCallback(async (prestataireId) => {
    setLoading(prev => ({ ...prev, details: true }));
    try {
      const response = await prestatairesAPI.getById(prestataireId);
      
      if (response.success && response.prestataire) {
        const prestataire = response.prestataire;
        
        setDetailsDrawer({
          visible: true,
          prestataire: prestataire,
          informations: {
            personnelles: [
              { label: 'ID', value: prestataire.id || prestataire.COD_PRE },
              { label: 'Nom complet', value: `${prestataire.prenom || ''} ${prestataire.nom || ''}` },
              { label: 'Spécialité', value: prestataire.specialite || '-' },
              { label: 'Titre', value: prestataire.titre || '-' },
              { label: 'Type', value: prestataire.type_prestataire || '-' },
              { label: 'Numéro Licence', value: prestataire.num_licence || '-' },
              { label: 'Numéro Ordre', value: prestataire.num_ordre || '-' }
            ],
            professionnelles: [
              { label: 'Date obtention licence', value: formatDate(prestataire.date_obtention_licence) },
              { label: 'Date expiration licence', value: formatDate(prestataire.date_expiration_licence) },
              { label: 'Université formation', value: prestataire.universite_formation || '-' },
              { label: 'Année diplôme', value: prestataire.annee_diplome || '-' },
              { label: 'Expérience (années)', value: prestataire.experience_annee ? `${prestataire.experience_annee} ans` : '-' }
            ],
            contact: [
              { label: 'Téléphone', value: prestataire.telephone || '-', icon: <PhoneOutlined /> },
              { label: 'Email', value: prestataire.email || '-', icon: <MailOutlined /> },
              { label: 'Numéro adresse', value: prestataire.num_adr || '-' },
              { label: 'Centre de pratique', value: getCentreLabel(prestataire.cod_cen) || '-' },
              { label: 'Lieu de pratique', value: prestataire.centre_pratique || '-' },
              { label: 'Pays', value: getPaysLabel(prestataire.cod_pay) || '-' }
            ],
            tarification: [
              { label: 'Honoraires', value: prestataire.honoraires ? `${parseFloat(prestataire.honoraires).toLocaleString('fr-FR')} FCFA` : '-' },
              { label: 'Langue parlée', value: prestataire.langue_parlee || '-' },
              { label: 'Disponibilité', value: prestataire.disponibilite || '-' },
              { label: 'Statut BD', value: (prestataire.actif === 1 || prestataire.status === 'Actif') ? 'Actif (1)' : 'Inactif (0)' }
            ],
            systeme: [
              { label: 'Date création', value: formatDateTime(prestataire.date_creation || prestataire.DAT_CREUTIL) },
              { label: 'Date modification', value: formatDateTime(prestataire.date_modification || prestataire.DAT_MODUTIL) },
              { label: 'Créé par', value: prestataire.COD_CREUTIL || '-' },
              { label: 'Modifié par', value: prestataire.COD_MODUTIL || '-' }
            ]
          }
        });
        
        message.success('Détails du prestataire chargés');
      } else {
        message.error(response.message || 'Erreur lors du chargement des détails');
      }
    } catch (error) {
      console.error('❌ Erreur chargement détails:', error);
      message.error('Erreur lors du chargement des détails');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  }, [centres, pays]);

  const getCentreLabel = (codCen) => {
    if (!codCen) return '';
    const centre = centres.find(c => c.cod_cen == codCen || c.id == codCen);
    return centre ? centre.name : codCen;
  };

  const getPaysLabel = (codPay) => {
    if (!codPay) return '';
    const pay = pays.find(p => p.value == codPay);
    return pay ? pay.label : codPay;
  };

  // ==================== FONCTIONS DE GESTION ====================

  const handleAddPrestataire = async (values) => {
    setAddModal(prev => ({ ...prev, loading: true }));
    
    try {
      const prestataireData = {
        type_prestataire: values.type_prestataire,
        nom: values.nom,
        prenom: values.prenom,
        specialite: values.specialite,
        titre: values.titre || null,
        num_licence: values.num_licence || null,
        num_ordre: values.num_ordre || null,
        date_obtention_licence: values.date_obtention_licence ? values.date_obtention_licence.format('YYYY-MM-DD') : null,
        date_expiration_licence: values.date_expiration_licence ? values.date_expiration_licence.format('YYYY-MM-DD') : null,
        universite_formation: values.universite_formation || null,
        annee_diplome: values.annee_diplome || null,
        experience_annee: values.experience_annee || 0,
        telephone: values.telephone || null,
        email: values.email || null,
        cod_cen: values.cod_cen || null,
        centre_pratique: values.centre_pratique || null,
        cod_pay: values.cod_pay,
        num_adr: values.num_adr || null,
        honoraires: values.honoraires || null,
        langue_parlee: values.langue_parlee || 'Français',
        disponibilite: values.disponibilite || 'Disponible',
        actif: values.actif ? 1 : 0
      };
      
      const result = await prestatairesAPI.create(prestataireData);
      
      if (result.success) {
        message.success('Prestataire créé avec succès');
        setAddModal({ visible: false, loading: false, currentStep: 0 });
        addForm.resetFields();
        loadPrestataires();
        
        // Synchronisation automatique
        try {
          await syncAPI.syncPrestataire({
            prestataireId: result.data.id || result.data.COD_PRE,
            operation: 'create',
            data: result.data
          });
          message.info('Synchronisation automatique effectuée');
        } catch (syncError) {
          console.warn('Synchronisation automatique échouée:', syncError);
        }
      } else {
        throw new Error(result.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('❌ Erreur création prestataire:', error);
      message.error(error.message || 'Erreur lors de la création du prestataire');
      setAddModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleUpdatePrestataire = async (values) => {
    if (!editModal.prestataire?.id) {
      message.error('Aucun prestataire sélectionné');
      return;
    }
    
    setEditModal(prev => ({ ...prev, loading: true }));
    
    try {
      const prestataireData = {
        type_prestataire: values.type_prestataire,
        nom: values.nom,
        prenom: values.prenom,
        specialite: values.specialite,
        titre: values.titre || null,
        num_licence: values.num_licence || null,
        num_ordre: values.num_ordre || null,
        date_obtention_licence: values.date_obtention_licence ? values.date_obtention_licence.format('YYYY-MM-DD') : null,
        date_expiration_licence: values.date_expiration_licence ? values.date_expiration_licence.format('YYYY-MM-DD') : null,
        universite_formation: values.universite_formation || null,
        annee_diplome: values.annee_diplome || null,
        experience_annee: values.experience_annee || 0,
        telephone: values.telephone || null,
        email: values.email || null,
        cod_cen: values.cod_cen || null,
        centre_pratique: values.centre_pratique || null,
        cod_pay: values.cod_pay,
        num_adr: values.num_adr || null,
        honoraires: values.honoraires || null,
        langue_parlee: values.langue_parlee || 'Français',
        disponibilite: values.disponibilite || 'Disponible',
        actif: values.actif ? 1 : 0
      };
      
      const result = await prestatairesAPI.update(editModal.prestataire.id, prestataireData);
      
      if (result.success) {
        message.success('Prestataire mis à jour avec succès');
        setEditModal({ visible: false, loading: false, prestataire: null });
        editForm.resetFields();
        loadPrestataires();
        
        // Synchronisation automatique
        try {
          await syncAPI.syncPrestataire({
            prestataireId: editModal.prestataire.id,
            operation: 'update',
            data: { ...editModal.prestataire, ...prestataireData }
          });
          message.info('Synchronisation automatique effectuée');
        } catch (syncError) {
          console.warn('Synchronisation automatique échouée:', syncError);
        }
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour prestataire:', error);
      message.error(error.message || 'Erreur lors de la mise à jour du prestataire');
      setEditModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDeletePrestataire = async (prestataireId) => {
    try {
      const result = await prestatairesAPI.update(prestataireId, { actif: 0 });
      
      if (result.success) {
        message.success('Prestataire désactivé avec succès');
        loadPrestataires();
        
        // Synchronisation automatique
        try {
          await syncAPI.syncPrestataire({
            prestataireId: prestataireId,
            operation: 'delete',
            data: { actif: 0 }
          });
          message.info('Synchronisation automatique effectuée');
        } catch (syncError) {
          console.warn('Synchronisation automatique échouée:', syncError);
        }
      } else {
        message.error(result.message || 'Erreur lors de la désactivation');
      }
    } catch (error) {
      console.error('❌ Erreur suppression prestataire:', error);
      message.error('Erreur lors de la désactivation du prestataire');
    }
  };

  const handleChangeStatus = async (prestataireId, newStatus) => {
    try {
      const updateData = {
        actif: newStatus === 'Actif' ? 1 : 0
      };
      
      const result = await prestatairesAPI.update(prestataireId, updateData);
      
      if (result.success) {
        message.success(`Statut modifié en "${newStatus}" avec succès`);
        loadPrestataires();
        
        // Synchronisation automatique
        try {
          await syncAPI.syncPrestataire({
            prestataireId: prestataireId,
            operation: 'status',
            data: updateData
          });
        } catch (syncError) {
          console.warn('Synchronisation automatique échouée:', syncError);
        }
      } else {
        throw new Error(result.message || 'Erreur lors du changement de statut');
      }
    } catch (error) {
      console.error('❌ Erreur changement statut:', error);
      message.error(error.message || 'Erreur lors du changement de statut');
    }
  };

 const handleSyncPrestataire = async (values) => {
  if (!syncModal.prestataire?.id) {
    message.error('Aucun prestataire sélectionné');
    return;
  }
  
  setSyncModal(prev => ({ ...prev, loading: true }));
  
  try {
    // Conversion EXPLICITE en nombres entiers
    const codPre = parseInt(syncModal.prestataire.id || syncModal.prestataire.COD_PRE);
    const codCen = parseInt(values.cod_cen);
    
    // Validation avant envoi
    if (isNaN(codPre) || isNaN(codCen)) {
      throw new Error('COD_PRE et COD_CEN doivent être des nombres valides');
    }
    
    const syncData = {
      COD_PRE: codPre,
      COD_CEN: codCen,
      DEB_AGRP: values.date_debut ? values.date_debut.format('YYYY-MM-DD') : null,
      FIN_AGRP: values.date_fin ? values.date_fin.format('YYYY-MM-DD') : null,
      OBS_AGRP: values.observations || null,
      TR1_AGRP: values.tarif1 ? parseFloat(values.tarif1) : null,
      TR2_AGRP: values.tarif2 ? parseFloat(values.tarif2) : null,
      TR3_AGRP: values.tarif3 ? parseFloat(values.tarif3) : null,
      TPS_AGRP: values.tps ? parseFloat(values.tps) : null,
      TVA_AGRP: values.tva ? parseFloat(values.tva) : null
    };
    
    console.log('📤 Données de synchronisation AVANT envoi:', syncData);
    console.log('Type COD_PRE:', typeof syncData.COD_PRE, 'Type COD_CEN:', typeof syncData.COD_CEN);
    
    const response = await syncAPI.syncCentrePrestataire(syncData);
    
    if (response.success) {
      message.success('Synchronisation réussie !');
      setSyncModal({ visible: false, loading: false, prestataire: null });
      syncForm.resetFields();
    } else {
      throw new Error(response.message || 'Erreur lors de la synchronisation');
    }
  } catch (error) {
    console.error('❌ Erreur synchronisation:', error);
    
    let errorMessage = error.message || 'Erreur lors de la synchronisation';
    
    if (error.message.includes('COD_PRE') && error.message.includes('n\'existe pas')) {
      errorMessage = `Le prestataire avec l'ID ${syncModal.prestataire.id} n'existe pas dans la base de données.`;
    } else if (error.message.includes('COD_CEN') && error.message.includes('n\'existe pas')) {
      errorMessage = `Le centre avec l'ID ${syncForm.getFieldValue('cod_cen')} n'existe pas dans la base de données.`;
    } else if (error.message.includes('400')) {
      errorMessage = 'Données invalides. Vérifiez que les champs COD_PRE et COD_CEN sont des nombres valides.';
    } else if (error.message.includes('500')) {
      errorMessage = 'Erreur serveur. Contactez l\'administrateur.';
    }
    
    message.error(errorMessage);
  } finally {
    setSyncModal(prev => ({ ...prev, loading: false }));
  }
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
      specialite: 'all',
      centre: 'all',
      pays: 'all',
      experience_min: '',
      experience_max: ''
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleExportCSV = async () => {
    setLoading(prev => ({ ...prev, export: true }));
    try {
      const response = await prestatairesAPI.getAll({ limit: 10000 });
      
      if (response.success) {
        const prestatairesData = response.data || response.prestataires || [];
        
        const headers = [
          'ID', 'Nom', 'Prénom', 'Spécialité', 'Type', 'Titre',
          'Numéro Licence', 'Numéro Ordre', 'Date Obtention Licence', 'Date Expiration Licence',
          'Université Formation', 'Année Diplôme', 'Expérience (années)',
          'Téléphone', 'Email', 'Numéro Adresse',
          'Code Centre', 'Centre Pratique', 'Code Pays',
          'Honoraires (FCFA)', 'Langue Parlée', 'Disponibilité',
          'Statut BD', 'Date Création', 'Date Modification'
        ];
        
        const rows = prestatairesData.map(p => [
          p.id || p.COD_PRE,
          p.nom,
          p.prenom,
          p.specialite,
          p.type_prestataire,
          p.titre,
          p.num_licence || '',
          p.num_ordre || '',
          formatDate(p.date_obtention_licence),
          formatDate(p.date_expiration_licence),
          p.universite_formation || '',
          p.annee_diplome || '',
          p.experience_annee || 0,
          p.telephone || '',
          p.email || '',
          p.num_adr || '',
          p.cod_cen || '',
          p.centre_pratique || '',
          p.cod_pay || '',
          p.honoraires || '',
          p.langue_parlee || '',
          p.disponibilite || '',
          (p.actif === 1 || p.status === 'Actif') ? 'Actif (1)' : 'Inactif (0)',
          formatDateTime(p.date_creation),
          formatDateTime(p.date_modification)
        ]);
        
        const csvContent = [
          headers.join(';'),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
        ].join('\n');
        
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `prestataires_${moment().format('YYYY-MM-DD')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        message.success('Export CSV généré avec succès');
      } else {
        message.error(response.message || 'Erreur lors de l\'export');
      }
    } catch (error) {
      console.error('❌ Erreur export:', error);
      message.error('Erreur lors de l\'export des données');
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };

  const handleSearchCenters = useCallback((value) => {
    if (value && value.trim() !== '') {
      const searchLower = value.toLowerCase();
      const filtered = allCentres.filter(centre => {
        const name = centre.name ? String(centre.name).toLowerCase() : '';
        const code = centre.code ? String(centre.code).toLowerCase() : '';
        const region = centre.region ? String(centre.region).toLowerCase() : '';
        const type = centre.type ? String(centre.type).toLowerCase() : '';
        return name.includes(searchLower) || code.includes(searchLower) || 
               region.includes(searchLower) || type.includes(searchLower);
      });
      setCentres(filtered);
    } else {
      setCentres(allCentres);
    }
  }, [allCentres]);

  // ==================== CONFIGURATION DES COLONNES DU TABLEAU ====================

  const prestatairesColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (text) => <Text type="secondary">#{text}</Text>
    },
    {
      title: 'Nom & Prénom',
      dataIndex: 'nom_complet',
      key: 'nom_complet',
      width: 200,
      render: (text, record) => (
        <Space>
          <Avatar 
            size="large" 
            icon={<UserOutlined />}
            style={{ 
              backgroundColor: record.isActif ? '#1890ff' : '#d9d9d9',
              color: '#fff'
            }}
          />
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.type_prestataire}
              {record.titre && ` • ${record.titre}`}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Spécialité',
      dataIndex: 'specialite',
      key: 'specialite',
      width: 150,
      render: (specialite) => (
        <Tag color="blue">{specialite || 'Non spécifiée'}</Tag>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 180,
      render: (_, record) => (
        <div>
          {record.telephone && (
            <div style={{ fontSize: '12px' }}>
              <PhoneOutlined style={{ marginRight: '4px' }} />
              {record.telephone}
            </div>
          )}
          {record.email && (
            <div style={{ fontSize: '12px' }}>
              <MailOutlined style={{ marginRight: '4px' }} />
              {record.email}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Localisation',
      key: 'localisation',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            <GlobalOutlined style={{ marginRight: '4px' }} />
            {getPaysLabel(record.cod_pay)}
          </div>
          {record.cod_cen && (
            <div style={{ fontSize: '12px' }}>
              <BankOutlined style={{ marginRight: '4px' }} />
              {getCentreLabel(record.cod_cen)}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Statut',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const statusConfig = getStatusConfig(record.isActif ? 'Actif' : 'Inactif');
        const disponibiliteConfig = getDisponibiliteConfig(record.disponibilite);
        return (
          <Space direction="vertical" size={2}>
            <Tag 
              color={statusConfig.color} 
              icon={statusConfig.icon}
              style={{ marginRight: 0 }}
            >
              {statusConfig.label}
            </Tag>
            {record.disponibilite && (
              <Tag 
                color={disponibiliteConfig.color} 
                icon={disponibiliteConfig.icon}
                style={{ fontSize: '10px', marginRight: 0 }}
              >
                {disponibiliteConfig.label}
              </Tag>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Dates',
      key: 'dates',
      width: 120,
      render: (_, record) => (
        <div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Créé: {formatDate(record.date_creation)}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Modifié: {formatDate(record.date_modification)}
          </Text>
        </div>
      )
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
              onClick={() => loadPrestataireDetails(record.id)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setEditModal({
                  visible: true,
                  loading: false,
                  prestataire: record
                });
                editForm.setFieldsValue({
                  type_prestataire: record.type_prestataire || 'Médecin',
                  nom: record.nom || '',
                  prenom: record.prenom || '',
                  specialite: record.specialite || '',
                  titre: record.titre || '',
                  num_licence: record.num_licence || '',
                  num_ordre: record.num_ordre || '',
                  date_obtention_licence: record.date_obtention_licence ? moment(record.date_obtention_licence) : null,
                  date_expiration_licence: record.date_expiration_licence ? moment(record.date_expiration_licence) : null,
                  universite_formation: record.universite_formation || '',
                  annee_diplome: record.annee_diplome || '',
                  experience_annee: record.experience_annee || 0,
                  telephone: record.telephone || '',
                  email: record.email || '',
                  cod_cen: record.cod_cen || undefined,
                  centre_pratique: record.centre_pratique || '',
                  cod_pay: record.cod_pay || undefined,
                  num_adr: record.num_adr || '',
                  honoraires: record.honoraires || '',
                  langue_parlee: record.langue_parlee || 'Français',
                  disponibilite: record.disponibilite || 'Disponible',
                  actif: record.isActif
                });
              }}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Synchroniser">
            <Button
              icon={<SyncOutlined />}
              onClick={() => {
                setSyncModal({
                  visible: true,
                  loading: false,
                  prestataire: record
                });
                syncForm.setFieldsValue({
                  cod_cen: record.cod_cen || undefined,
                  date_debut: moment(),
                  tarif1: record.honoraires || ''
                });
              }}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Popconfirm
              title="Êtes-vous sûr de vouloir désactiver ce prestataire ?"
              description="Le prestataire sera marqué comme inactif."
              onConfirm={() => handleDeletePrestataire(record.id)}
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
    loadCentres();
    loadPays();
    loadSpecialites();
    loadPrestataires();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (filters.search) {
        loadPrestataires();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [filters.search]);

  // ==================== RENDU PRINCIPAL ====================

  return (
    <div style={{ padding: '24px' }}>
      {/* En-tête */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TeamOutlined style={{ marginRight: '12px', fontSize: '24px', color: '#1890ff' }} />
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
              Gestion des Prestataires de Santé
            </span>
          </div>
        }
        extra={
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportCSV}
              loading={loading.export}
            >
              Exporter
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (pays.length === 0) {
                  message.error('Impossible d\'ajouter un prestataire : aucun pays disponible. Veuillez configurer les pays d\'abord.');
                  loadPays();
                } else {
                  setAddModal({ visible: true, loading: false, currentStep: 0 });
                  addForm.resetFields();
                  addForm.setFieldsValue({ 
                    actif: true,
                    type_prestataire: 'Médecin',
                    langue_parlee: 'Français',
                    disponibilite: 'Disponible'
                  });
                }
              }}
              disabled={pays.length === 0}
            >
              Nouveau Prestataire
            </Button>
          </Space>
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
                    placeholder="Rechercher par nom, prénom, email..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    style={{ width: '250px' }}
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
                    style={{ width: '180px' }}
                    placeholder="Type"
                  >
                    <Option value="all">Tous les types</Option>
                    {typesPrestataire.map(type => (
                      <Option key={type.value} value={type.value}>
                        {type.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col>
                  <Select
                    value={filters.specialite}
                    onChange={(value) => handleFilterChange('specialite', value)}
                    style={{ width: '180px' }}
                    placeholder="Spécialité"
                  >
                    <Option value="all">Toutes les spécialités</Option>
                    {specialites.map(spec => (
                      <Option key={spec.value} value={spec.value}>
                        {spec.label}
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
                    onClick={loadPrestataires}
                    icon={<SyncOutlined />}
                    loading={loading.prestataires}
                  >
                    Actualiser
                  </Button>
                </Col>
              </>
            )}
          </Row>
          
          {showFilters && (
            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
              <Col>
                <Select
                  value={filters.centre}
                  onChange={(value) => handleFilterChange('centre', value)}
                  style={{ width: '200px' }}
                  placeholder="Centre"
                >
                  <Option value="all">Tous les centres</Option>
                  {centres.map(centre => (
                    <Option key={centre.id} value={centre.id}>
                      {centre.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select
                  value={filters.pays}
                  onChange={(value) => handleFilterChange('pays', value)}
                  style={{ width: '200px' }}
                  placeholder="Pays"
                >
                  <Option value="all">Tous les pays</Option>
                  {pays.map(p => (
                    <Option key={p.value} value={p.value}>
                      {p.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <InputNumber
                  placeholder="Exp. min (ans)"
                  value={filters.experience_min}
                  onChange={(value) => handleFilterChange('experience_min', value)}
                  style={{ width: '120px' }}
                  min={0}
                  max={60}
                />
              </Col>
              <Col>
                <InputNumber
                  placeholder="Exp. max (ans)"
                  value={filters.experience_max}
                  onChange={(value) => handleFilterChange('experience_max', value)}
                  style={{ width: '120px' }}
                  min={0}
                  max={60}
                />
              </Col>
            </Row>
          )}
        </div>

        {/* Statistiques */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Prestataires Totaux"
                value={statistiques.total}
                prefix={<TeamOutlined />}
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
                title="Centres de Santé"
                value={statistiques.totalCentres}
                prefix={<BankOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                Disponibles pour affectation
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Pays Couverts"
                value={statistiques.totalPays}
                prefix={<GlobalOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                {pays.length} pays disponibles
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

        {/* Tableau des prestataires */}
        <Card
          title={`Liste des Prestataires (${pagination.total})`}
          extra={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Text type="secondary" style={{ marginRight: '16px' }}>
                Page {pagination.current} sur {Math.ceil(pagination.total / pagination.pageSize)}
              </Text>
            </div>
          }
        >
          <Table
            columns={prestatairesColumns}
            dataSource={prestataires}
            loading={loading.prestataires}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} sur ${total} prestataires`,
              onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize, total: pagination.total });
              }
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Card>

      {/* ==================== MODALES ==================== */}

      {/* Modal Ajout Prestataire */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PlusOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
            <span>Ajouter un Nouveau Prestataire</span>
          </div>
        }
        open={addModal.visible}
        onCancel={() => {
          setAddModal({ visible: false, loading: false, currentStep: 0 });
          addForm.resetFields();
        }}
        width={900}
        footer={null}
        destroyOnClose
      >
        <Steps current={addModal.currentStep} style={{ marginBottom: '24px' }}>
          <Step title="Informations personnelles" />
          <Step title="Informations professionnelles" />
          <Step title="Contact et localisation" />
          <Step title="Validation" />
        </Steps>
        
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddPrestataire}
        >
          {addModal.currentStep === 0 && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="nom"
                    label="Nom"
                    rules={[{ required: true, message: 'Veuillez saisir le nom' }]}
                  >
                    <Input placeholder="Nom de famille" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="prenom"
                    label="Prénom"
                    rules={[{ required: true, message: 'Veuillez saisir le prénom' }]}
                  >
                    <Input placeholder="Prénom" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="type_prestataire"
                    label="Type de prestataire"
                    rules={[{ required: true, message: 'Veuillez sélectionner le type' }]}
                  >
                    <Select placeholder="Sélectionnez un type">
                      {typesPrestataire.map(type => (
                        <Option key={type.value} value={type.value}>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="specialite"
                    label="Spécialité"
                    rules={[{ required: true, message: 'Veuillez sélectionner la spécialité' }]}
                  >
                    <Select placeholder="Sélectionnez une spécialité">
                      <Option value="">Sélectionnez une spécialité</Option>
                      {specialites.map(spec => (
                        <Option key={spec.value} value={spec.value}>
                          {spec.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="titre"
                label="Titre professionnel"
              >
                <Select placeholder="Sélectionnez un titre">
                  <Option value="">Sélectionnez un titre</Option>
                  {titresOptions.map(titre => (
                    <Option key={titre.value} value={titre.value}>
                      {titre.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}
          
          {addModal.currentStep === 1 && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="num_licence"
                    label="Numéro de licence"
                  >
                    <Input placeholder="Ex: MED12345" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="num_ordre"
                    label="Numéro d'ordre"
                  >
                    <Input placeholder="Ex: 123456" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="date_obtention_licence"
                    label="Date d'obtention de licence"
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="date_expiration_licence"
                    label="Date d'expiration de licence"
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="universite_formation"
                    label="Université de formation"
                  >
                    <Input placeholder="Nom de l'université" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="annee_diplome"
                    label="Année de diplôme"
                  >
                    <Input placeholder="Ex: 2015" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="experience_annee"
                label="Expérience (années)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={60}
                  placeholder="Nombre d'années d'expérience"
                />
              </Form.Item>
            </>
          )}
          
          {addModal.currentStep === 2 && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="telephone"
                    label="Téléphone"
                  >
                    <Input placeholder="Numéro de téléphone" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { type: 'email', message: 'Veuillez saisir un email valide' }
                    ]}
                  >
                    <Input placeholder="adresse@email.com" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="cod_cen"
                    label="Centre de pratique"
                  >
                    <Select
                      showSearch
                      placeholder="Rechercher ou sélectionner un centre..."
                      optionFilterProp="children"
                      onSearch={handleSearchCenters}
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      <Option value="">Sélectionnez un centre</Option>
                      {centres.map(centre => (
                        <Option key={centre.id} value={centre.id}>
                          {centre.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="centre_pratique"
                    label="Lieu de pratique"
                  >
                    <Input placeholder="Lieu de pratique spécifique" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="cod_pay"
                    label="Pays"
                    rules={[{ required: true, message: 'Veuillez sélectionner un pays' }]}
                  >
                    <Select placeholder="Sélectionnez un pays">
                      <Option value="">Sélectionnez un pays</Option>
                      {pays.map(p => (
                        <Option key={p.value} value={p.value}>
                          {p.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="num_adr"
                    label="Numéro d'adresse"
                  >
                    <Input placeholder="Numéro et rue" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="honoraires"
                    label="Honoraires (FCFA)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="Montant des honoraires"
                      min={0}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="langue_parlee"
                    label="Langue parlée"
                  >
                    <Select placeholder="Sélectionnez une langue">
                      {languesOptions.map(langue => (
                        <Option key={langue.value} value={langue.value}>
                          {langue.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="disponibilite"
                label="Disponibilité"
              >
                <Select placeholder="Sélectionnez une disponibilité">
                  {disponibiliteOptions.map(dispo => (
                    <Option key={dispo.value} value={dispo.value}>
                      {dispo.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}
          
          {addModal.currentStep === 3 && (
            <>
              <Alert
                message="Récapitulatif"
                description="Veuillez vérifier les informations saisies avant de créer le prestataire."
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Nom complet">
                  {addForm.getFieldValue('prenom')} {addForm.getFieldValue('nom')}
                </Descriptions.Item>
                <Descriptions.Item label="Spécialité">
                  {addForm.getFieldValue('specialite')}
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                  {addForm.getFieldValue('type_prestataire')}
                </Descriptions.Item>
                <Descriptions.Item label="Téléphone">
                  {addForm.getFieldValue('telephone') || 'Non renseigné'}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {addForm.getFieldValue('email') || 'Non renseigné'}
                </Descriptions.Item>
                <Descriptions.Item label="Pays">
                  {getPaysLabel(addForm.getFieldValue('cod_pay'))}
                </Descriptions.Item>
                <Descriptions.Item label="Centre">
                  {getCentreLabel(addForm.getFieldValue('cod_cen')) || 'Non renseigné'}
                </Descriptions.Item>
                <Descriptions.Item label="Disponibilité">
                  {addForm.getFieldValue('disponibilite')}
                </Descriptions.Item>
              </Descriptions>
              
              <Form.Item
                name="actif"
                label="Statut"
                valuePropName="checked"
                style={{ marginTop: '16px' }}
              >
                <Switch checkedChildren="Actif" unCheckedChildren="Inactif" defaultChecked />
              </Form.Item>
            </>
          )}
          
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              {addModal.currentStep > 0 && (
                <Button
                  onClick={() => setAddModal(prev => ({ ...prev, currentStep: prev.currentStep - 1 }))}
                >
                  Retour
                </Button>
              )}
            </div>
            <div>
              {addModal.currentStep < 3 ? (
                <Button
                  type="primary"
                  onClick={() => setAddModal(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  type="primary"
                  loading={addModal.loading}
                  onClick={() => addForm.submit()}
                >
                  Créer le prestataire
                </Button>
              )}
            </div>
          </div>
        </Form>
      </Modal>

      {/* Modal Modification Prestataire */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <EditOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            <span>Modifier le Prestataire</span>
          </div>
        }
        open={editModal.visible}
        onCancel={() => {
          setEditModal({ visible: false, loading: false, prestataire: null });
          editForm.resetFields();
        }}
        width={900}
        footer={[
          <Button key="cancel" onClick={() => {
            setEditModal({ visible: false, loading: false, prestataire: null });
            editForm.resetFields();
          }}>
            Annuler
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={editModal.loading}
            onClick={() => editForm.submit()}
          >
            Modifier
          </Button>
        ]}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdatePrestataire}
        >
          <Tabs defaultActiveKey="personnelles">
            <Tabs.TabPane tab="Informations personnelles" key="personnelles">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="nom"
                    label="Nom"
                    rules={[{ required: true, message: 'Veuillez saisir le nom' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="prenom"
                    label="Prénom"
                    rules={[{ required: true, message: 'Veuillez saisir le prénom' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="type_prestataire"
                    label="Type de prestataire"
                    rules={[{ required: true, message: 'Veuillez sélectionner le type' }]}
                  >
                    <Select>
                      {typesPrestataire.map(type => (
                        <Option key={type.value} value={type.value}>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="specialite"
                    label="Spécialité"
                    rules={[{ required: true, message: 'Veuillez sélectionner la spécialité' }]}
                  >
                    <Select>
                      <Option value="">Sélectionnez une spécialité</Option>
                      {specialites.map(spec => (
                        <Option key={spec.value} value={spec.value}>
                          {spec.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="titre"
                label="Titre professionnel"
              >
                <Select>
                  <Option value="">Sélectionnez un titre</Option>
                  {titresOptions.map(titre => (
                    <Option key={titre.value} value={titre.value}>
                      {titre.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Tabs.TabPane>
            
            <Tabs.TabPane tab="Informations professionnelles" key="professionnelles">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="num_licence"
                    label="Numéro de licence"
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="num_ordre"
                    label="Numéro d'ordre"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="date_obtention_licence"
                    label="Date d'obtention de licence"
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="date_expiration_licence"
                    label="Date d'expiration de licence"
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="universite_formation"
                    label="Université de formation"
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="annee_diplome"
                    label="Année de diplôme"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="experience_annee"
                label="Expérience (années)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={60}
                />
              </Form.Item>
            </Tabs.TabPane>
            
            <Tabs.TabPane tab="Contact et localisation" key="contact">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="telephone"
                    label="Téléphone"
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { type: 'email', message: 'Veuillez saisir un email valide' }
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="cod_cen"
                    label="Centre de pratique"
                  >
                    <Select
                      showSearch
                      optionFilterProp="children"
                      onSearch={handleSearchCenters}
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      <Option value="">Sélectionnez un centre</Option>
                      {centres.map(centre => (
                        <Option key={centre.id} value={centre.id}>
                          {centre.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="centre_pratique"
                    label="Lieu de pratique"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="cod_pay"
                    label="Pays"
                    rules={[{ required: true, message: 'Veuillez sélectionner un pays' }]}
                  >
                    <Select>
                      <Option value="">Sélectionnez un pays</Option>
                      {pays.map(p => (
                        <Option key={p.value} value={p.value}>
                          {p.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="num_adr"
                    label="Numéro d'adresse"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="honoraires"
                    label="Honoraires (FCFA)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="langue_parlee"
                    label="Langue parlée"
                  >
                    <Select>
                      {languesOptions.map(langue => (
                        <Option key={langue.value} value={langue.value}>
                          {langue.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="disponibilite"
                label="Disponibilité"
              >
                <Select>
                  {disponibiliteOptions.map(dispo => (
                    <Option key={dispo.value} value={dispo.value}>
                      {dispo.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Tabs.TabPane>
          </Tabs>
          
          <Form.Item
            name="actif"
            label="Statut"
            valuePropName="checked"
          >
            <Switch checkedChildren="Actif" unCheckedChildren="Inactif" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Drawer Détails Prestataire */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <EyeOutlined style={{ marginRight: '12px', fontSize: '20px' }} />
            <span>Détails du Prestataire</span>
          </div>
        }
        width={800}
        open={detailsDrawer.visible}
        onClose={() => setDetailsDrawer({ 
          visible: false, 
          prestataire: null,
          informations: {}
        })}
        extra={
          <Space>
            {detailsDrawer.prestataire && (
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    setDetailsDrawer({ visible: false, prestataire: null, informations: {} });
                    setEditModal({
                      visible: true,
                      loading: false,
                      prestataire: detailsDrawer.prestataire
                    });
                    editForm.setFieldsValue({
                      type_prestataire: detailsDrawer.prestataire.type_prestataire || 'Médecin',
                      nom: detailsDrawer.prestataire.nom || '',
                      prenom: detailsDrawer.prestataire.prenom || '',
                      specialite: detailsDrawer.prestataire.specialite || '',
                      titre: detailsDrawer.prestataire.titre || '',
                      num_licence: detailsDrawer.prestataire.num_licence || '',
                      num_ordre: detailsDrawer.prestataire.num_ordre || '',
                      date_obtention_licence: detailsDrawer.prestataire.date_obtention_licence ? 
                        moment(detailsDrawer.prestataire.date_obtention_licence) : null,
                      date_expiration_licence: detailsDrawer.prestataire.date_expiration_licence ? 
                        moment(detailsDrawer.prestataire.date_expiration_licence) : null,
                      universite_formation: detailsDrawer.prestataire.universite_formation || '',
                      annee_diplome: detailsDrawer.prestataire.annee_diplome || '',
                      experience_annee: detailsDrawer.prestataire.experience_annee || 0,
                      telephone: detailsDrawer.prestataire.telephone || '',
                      email: detailsDrawer.prestataire.email || '',
                      cod_cen: detailsDrawer.prestataire.cod_cen || undefined,
                      centre_pratique: detailsDrawer.prestataire.centre_pratique || '',
                      cod_pay: detailsDrawer.prestataire.cod_pay || undefined,
                      num_adr: detailsDrawer.prestataire.num_adr || '',
                      honoraires: detailsDrawer.prestataire.honoraires || '',
                      langue_parlee: detailsDrawer.prestataire.langue_parlee || 'Français',
                      disponibilite: detailsDrawer.prestataire.disponibilite || 'Disponible',
                      actif: detailsDrawer.prestataire.isActif
                    });
                  }}
                >
                  Modifier
                </Button>
                <Button
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={() => {
                    setDetailsDrawer({ visible: false, prestataire: null, informations: {} });
                    setSyncModal({
                      visible: true,
                      loading: false,
                      prestataire: detailsDrawer.prestataire
                    });
                    syncForm.setFieldsValue({
                      cod_cen: detailsDrawer.prestataire.cod_cen || undefined,
                      date_debut: moment(),
                      tarif1: detailsDrawer.prestataire.honoraires || ''
                    });
                  }}
                >
                  Synchroniser
                </Button>
              </>
            )}
          </Space>
        }
      >
        {loading.details ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '20px' }}>Chargement des détails...</div>
          </div>
        ) : detailsDrawer.prestataire ? (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <Avatar
                  size={64}
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: detailsDrawer.prestataire.isActif ? '#1890ff' : '#d9d9d9',
                    color: '#fff',
                    marginRight: '16px'
                  }}
                />
                <div>
                  <Typography.Title level={3} style={{ margin: 0 }}>
                    {detailsDrawer.prestataire.nom_complet}
                  </Typography.Title>
                  <Space style={{ marginTop: '8px' }}>
                    <Tag color={getTypeConfig(detailsDrawer.prestataire.type_prestataire).color}>
                      {detailsDrawer.prestataire.type_prestataire}
                    </Tag>
                    <Tag 
                      color={getStatusConfig(detailsDrawer.prestataire.isActif ? 'Actif' : 'Inactif').color}
                      icon={getStatusConfig(detailsDrawer.prestataire.isActif ? 'Actif' : 'Inactif').icon}
                    >
                      {detailsDrawer.prestataire.isActif ? 'Actif' : 'Inactif'}
                    </Tag>
                  </Space>
                </div>
              </div>

              <Tabs defaultActiveKey="info">
                <Tabs.TabPane tab="Informations" key="info">
                  <Descriptions column={2} bordered>
                    {detailsDrawer.informations.personnelles?.map((info, index) => (
                      <Descriptions.Item key={index} label={info.label}>
                        {info.value}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </Tabs.TabPane>
                
                <Tabs.TabPane tab="Professionnelles" key="prof">
                  <Descriptions column={2} bordered>
                    {detailsDrawer.informations.professionnelles?.map((info, index) => (
                      <Descriptions.Item key={index} label={info.label}>
                        {info.value}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </Tabs.TabPane>
                
                <Tabs.TabPane tab="Contact" key="contact">
                  <Descriptions column={2} bordered>
                    {detailsDrawer.informations.contact?.map((info, index) => (
                      <Descriptions.Item key={index} label={info.label}>
                        {info.icon && <span style={{ marginRight: '8px' }}>{info.icon}</span>}
                        {info.value}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </Tabs.TabPane>
                
                <Tabs.TabPane tab="Système" key="system">
                  <Descriptions column={2} bordered>
                    {detailsDrawer.informations.systeme?.map((info, index) => (
                      <Descriptions.Item key={index} label={info.label}>
                        {info.value}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </Tabs.TabPane>
              </Tabs>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Typography.Text type="secondary">
              Aucune donnée disponible
            </Typography.Text>
          </div>
        )}
      </Drawer>

      {/* Modal Synchronisation */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SyncOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            <span>Synchronisation avec Centre</span>
          </div>
        }
        open={syncModal.visible}
        onCancel={() => {
          setSyncModal({ visible: false, loading: false, prestataire: null });
          syncForm.resetFields();
        }}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => {
            setSyncModal({ visible: false, loading: false, prestataire: null });
            syncForm.resetFields();
          }}>
            Annuler
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={syncModal.loading}
            onClick={() => syncForm.submit()}
          >
            Synchroniser
          </Button>
        ]}
        destroyOnClose
      >
        <Alert
          message="Information"
          description="Cette opération va créer ou mettre à jour une entrée dans la table CENTRE_PRESTATAIRE pour lier ce prestataire au centre sélectionné."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Form
          form={syncForm}
          layout="vertical"
          onFinish={handleSyncPrestataire}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
  name="cod_cen"
  label="Centre"
  rules={[
    { required: true, message: 'Veuillez sélectionner un centre' },
    {
      validator: (_, value) => {
        if (!value || isNaN(parseInt(value))) {
          return Promise.reject(new Error('Le centre doit être un nombre valide'));
        }
        return Promise.resolve();
      }
    }
  ]}
>
  <Select
    showSearch
    placeholder="Rechercher ou sélectionner un centre..."
    optionFilterProp="children"
    onSearch={handleSearchCenters}
    filterOption={(input, option) =>
      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
    }
  >
    <Option value="">Sélectionnez un centre</Option>
    {centres.map(centre => (
      <Option key={centre.id} value={centre.cod_cen}> {/* Utiliser cod_cen (nombre) */}
        {centre.name} (ID: {centre.cod_cen})
      </Option>
    ))}
  </Select>
</Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date_debut"
                label="Date début d'agrément"
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date_fin"
                label="Date fin d'agrément"
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="observations"
            label="Observations"
          >
            <TextArea rows={3} placeholder="Observations sur l'agrément..." />
          </Form.Item>
          
          <Divider orientation="left">Tarification</Divider>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="tarif1"
                label="Tarif 1 (FCFA)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Tarif principal"
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="tarif2"
                label="Tarif 2 (FCFA)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Tarif secondaire"
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="tarif3"
                label="Tarif 3 (FCFA)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Tarif spécial"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tps"
                label="TPS (%)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Taxe sur les produits et services"
                  min={0}
                  max={100}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tva"
                label="TVA (%)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Taxe sur la valeur ajoutée"
                  min={0}
                  max={100}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

// Composant MedicineBoxOutlined manquant dans @ant-design/icons
const MedicineBoxOutlined = (props) => (
  <span {...props} role="img" aria-label="medicine-box" style={{ marginRight: 8 }}>
    💊
  </span>
);

export default GestionPrestataires;