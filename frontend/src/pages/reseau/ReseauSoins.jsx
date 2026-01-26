// NetworkPage.jsx - Version corrigée avec problèmes de membres résolus
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Card, Row, Col, Statistic, Button, Modal, Form,
  Select, Input, DatePicker, Tag, Space, message, Tabs,
  Descriptions, Tooltip, Popconfirm, Spin, Alert,
  Divider, Badge, Typography, Empty,
  Drawer, List, Avatar, Collapse
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
  SaveOutlined, CheckOutlined, MinusCircleOutlined,
  DatabaseOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { reseauSoinsAPI } from '../../services/api';
import { beneficiairesAPI, prestatairesAPI, centresAPI } from '../../services/api';
import moment from 'moment';
import 'moment/locale/fr';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;
const { Panel } = Collapse;

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
  const [allCentres, setAllCentres] = useState([]);
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

  // Fonction pour filtrer les centres localement avec des champs convertis en chaînes
  const filterCentresLocalement = useCallback((centresListe, searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') return centresListe;
    
    const searchLower = searchTerm.toLowerCase();
    
    return centresListe.filter(centre => {
      // S'assurer que tous les champs sont des chaînes
      const name = centre.name ? String(centre.name).toLowerCase() : '';
      const code = centre.code ? String(centre.code).toLowerCase() : '';
      const region = centre.region ? String(centre.region).toLowerCase() : '';
      const type = centre.type ? String(centre.type).toLowerCase() : '';
      const telephone = centre.telephone ? String(centre.telephone).toLowerCase() : '';
      const adresse = centre.adresse ? String(centre.adresse).toLowerCase() : '';
      const cod_cen = centre.cod_cen ? String(centre.cod_cen).toLowerCase() : '';
      
      // Rechercher dans tous les champs
      return (
        name.includes(searchLower) ||
        code.includes(searchLower) ||
        region.includes(searchLower) ||
        type.includes(searchLower) ||
        telephone.includes(searchLower) ||
        adresse.includes(searchLower) ||
        cod_cen.includes(searchLower)
      );
    });
  }, []);

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
      
      const result = await reseauSoinsAPI.getAllNetworks(params);
      
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
        
        // Calcul des statistiques
        const totalMembres = formattedReseaux.reduce((sum, reseau) => 
          sum + (reseau.nombre_membres || 0), 0
        );
        
        const regionsUniques = [...new Set(
          formattedReseaux
            .filter(r => r.region_code)
            .map(r => r.region_code)
        )];
        
        const actifs = formattedReseaux.filter(r => r.status === 'Actif').length;
        const inactifs = formattedReseaux.filter(r => r.status === 'Inactif').length;
        const en_attente = formattedReseaux.filter(r => r.status === 'En attente').length;
        
        const trenteJours = moment().subtract(30, 'days');
        const derniers_30_jours = formattedReseaux.filter(r => 
          moment(r.date_creation).isAfter(trenteJours)
        ).length;
        
        setStatistiques(prev => ({
          ...prev,
          total: result.pagination?.total || formattedReseaux.length,
          actifs,
          inactifs,
          en_attente,
          regions: regionsUniques.length,
          totalMembres,
          derniers_30_jours
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

  const loadRegions = useCallback(async () => {
    try {
      const response = await reseauSoinsAPI.getRegions();
      
      if (response.success) {
        setRegions(response.regions || []);
      } else {
        setRegions([
          { code: '01', nom: 'Adamaoua' },
          { code: '02', nom: 'Centre' },
          { code: '03', nom: 'Est' },
          { code: '04', nom: 'Extrême-Nord' },
          { code: '05', nom: 'Littoral' },
          { code: '06', nom: 'Nord' },
          { code: '07', nom: 'Nord-Ouest' },
          { code: '08', nom: 'Ouest' },
          { code: '09', nom: 'Sud' },
          { code: '10', nom: 'Sud-Ouest' }
        ]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement régions:', error);
    }
  }, []);

  const loadAllCentres = useCallback(async (searchTerm = '') => {
    setLoading(prev => ({ ...prev, centres: true }));
    try {
      console.log('🔍 Début du chargement de TOUS les centres...');
      
      let allCentresData = [];
      let methodsTried = [];
      
      // STRATÉGIE 1: Utiliser la méthode getAll avec un très grand limit
      try {
        console.log('📡 Tentative 1: centresAPI.getAll avec limit: 5000');
        const response1 = await centresAPI.getAll({ 
          limit: 5000,
          page: 1 
        });
        
        methodsTried.push({
          method: 'centresAPI.getAll',
          success: response1.success,
          count: response1.centres?.length || 0
        });
        
        if (response1.success && response1.centres && response1.centres.length > 0) {
          console.log(`✅ Méthode 1: ${response1.centres.length} centres récupérés`);
          allCentresData = [...allCentresData, ...response1.centres];
        }
      } catch (error1) {
        console.warn('⚠️ Méthode 1 échouée:', error1.message);
      }
      
      // STRATÉGIE 2: Si getAll retourne une pagination, récupérer toutes les pages
      if (allCentresData.length === 0) {
        try {
          console.log('📡 Tentative 2: Récupération paginée');
          let page = 1;
          let hasMore = true;
          let pageCentres = [];
          
          while (hasMore && page <= 20) {
            const pageResponse = await centresAPI.getAll({ 
              limit: 100,
              page: page 
            });
            
            if (pageResponse.success && pageResponse.centres && pageResponse.centres.length > 0) {
              pageCentres = pageResponse.centres;
              allCentresData = [...allCentresData, ...pageCentres];
              console.log(`📄 Page ${page}: ${pageCentres.length} centres`);
              
              if (pageCentres.length < 100) {
                hasMore = false;
              } else {
                page++;
              }
            } else {
              hasMore = false;
            }
          }
          
          methodsTried.push({
            method: 'centresAPI.getAll paginé',
            success: true,
            count: allCentresData.length
          });
        } catch (error2) {
          console.warn('⚠️ Méthode 2 échouée:', error2.message);
        }
      }
      
      // STRATÉGIE 3: Tenter une autre méthode d'API si disponible
      if (allCentresData.length === 0 && centresAPI.getAllCentres) {
        try {
          console.log('📡 Tentative 3: centresAPI.getAllCentres');
          const response3 = await centresAPI.getAllCentres();
          methodsTried.push({
            method: 'centresAPI.getAllCentres',
            success: response3.success,
            count: response3.centres?.length || 0
          });
          
          if (response3.success && response3.centres) {
            allCentresData = response3.centres;
          }
        } catch (error3) {
          console.warn('⚠️ Méthode 3 échouée:', error3.message);
        }
      }
      
      // STRATÉGIE 4: Recherche avec un terme vide pour tout récupérer
      if (allCentresData.length === 0 && centresAPI.searchCentres) {
        try {
          console.log('📡 Tentative 4: centresAPI.searchCentres avec terme vide');
          const response4 = await centresAPI.searchCentres('', 1000);
          methodsTried.push({
            method: 'centresAPI.searchCentres',
            success: response4.success,
            count: response4.centres?.length || 0
          });
          
          if (response4.success && response4.centres) {
            allCentresData = response4.centres;
          }
        } catch (error4) {
          console.warn('⚠️ Méthode 4 échouée:', error4.message);
        }
      }
      
      console.log('📊 Résumé des tentatives:', methodsTried);
      console.log(`📈 Total centres récupérés: ${allCentresData.length}`);
      
      // Éliminer les doublons basés sur l'ID
      const uniqueCentres = [];
      const seenIds = new Set();
      
      allCentresData.forEach(centre => {
        let centreId = centre.id || centre.COD_CEN || centre.code || centre.ID_CENTRE;
        
        if (centreId) {
          // Convertir l'ID en chaîne
          centreId = String(centreId);
          
          if (!seenIds.has(centreId)) {
            seenIds.add(centreId);
            
            // Convertir tous les champs en chaînes pour éviter les erreurs
            const centreName = String(centre.nom || centre.LIB_CEN || centre.NOM_CENTRE || centre.name || `Centre ${centreId}`);
            const centreCode = String(centre.code || centre.COD_CEN || centreId);
            const region = String(centre.region || centre.region_nom || centre.COD_PAI || centre.REGION || 'Non spécifiée');
            const type = String(centre.type || centre.TYP_CEN || centre.TYPE_CENTRE || 'Centre de Santé');
            const telephone = String(centre.telephone || centre.TELEPHONE || centre.TR1_CEN || '');
            const adresse = String(centre.adresse || centre.NUM_ADR || centre.ADRESSE || '');
            const status = String(centre.status || centre.STATUT || centre.actif || 'Actif');
            
            uniqueCentres.push({
              id: centreId,
              key: centreId,
              cod_cen: parseInt(centreId, 10) || centreId,
              name: centreName,
              nom: centreName,
              code: centreCode,
              COD_CEN: centreCode,
              region: region,
              type: type,
              TYP_CEN: type,
              telephone: telephone,
              TELEPHONE: telephone,
              adresse: adresse,
              NUM_ADR: adresse,
              status: status,
              _raw: centre
            });
          }
        }
      });
      
      console.log(`✅ ${uniqueCentres.length} centres uniques formatés`);
      
      if (uniqueCentres.length > 0) {
        // Stocker tous les centres
        setAllCentres(uniqueCentres);
        
        // Si un terme de recherche est fourni, filtrer
        if (searchTerm && searchTerm.trim() !== '') {
          const filtered = filterCentresLocalement(uniqueCentres, searchTerm);
          console.log(`🔍 ${filtered.length} centres filtrés pour le terme: "${searchTerm}"`);
          setCentres(filtered);
          return filtered;
        } else {
          // Sinon, montrer tous les centres
          setCentres(uniqueCentres);
          return uniqueCentres;
        }
      } else {
        console.warn('⚠️ Aucun centre trouvé, utilisation du fallback');
        const fallbackCentres = [
          {
            id: '1006',
            key: '1006',
            cod_cen: 1006,
            name: "Hôpital Central de Bangui",
            code: "1006",
            region: "2",
            type: "Centre de Santé",
            telephone: "+236 21 61 00 00",
            adresse: "Bangui, République Centrafricaine",
            status: "Actif"
          }
        ];
        
        setCentres(fallbackCentres);
        setAllCentres(fallbackCentres);
        return fallbackCentres;
      }
    } catch (error) {
      console.error('❌ Erreur chargement centres:', error);
      message.error('Erreur lors du chargement des centres de santé');
      return [];
    } finally {
      setLoading(prev => ({ ...prev, centres: false }));
    }
  }, [filterCentresLocalement]);

  // CORRIGÉ : Fonction handleSearchCenters avec filtrage local
  const handleSearchCenters = useCallback((value) => {
    console.log('🔍 Recherche de centres avec terme:', value);
    
    if (value && value.trim() !== '') {
      setLoading(prev => ({ ...prev, centres: true }));
      try {
        // Filtrer localement les centres
        const filtered = filterCentresLocalement(allCentres, value);
        console.log(`🔍 ${filtered.length} centres filtrés localement`);
        setCentres(filtered);
      } catch (error) {
        console.error('❌ Erreur lors de la recherche de centres:', error);
        // Fallback au filtrage simple en cas d'erreur
        const searchLower = value.toLowerCase();
        const filtered = allCentres.filter(centre => {
          const name = centre.name ? String(centre.name).toLowerCase() : '';
          const code = centre.code ? String(centre.code).toLowerCase() : '';
          return name.includes(searchLower) || code.includes(searchLower);
        });
        setCentres(filtered);
      } finally {
        setLoading(prev => ({ ...prev, centres: false }));
      }
    } else {
      // Si recherche vide, montrer tous les centres
      setCentres(allCentres);
    }
  }, [allCentres, filterCentresLocalement]);

  const loadBeneficiaires = useCallback(async (searchTerm = '') => {
    setLoading(prev => ({ ...prev, beneficiaires: true }));
    try {
      const params = {
        limit: 50,
        ...(searchTerm && { search: searchTerm })
      };
      
      const response = await beneficiairesAPI.getAll(params);
      
      if (response.success && response.beneficiaires) {
        const formattedBeneficiaires = response.beneficiaires.map(beneficiaire => {
          const benefData = beneficiaire;
          
          return {
            id: String(benefData.ID_BEN || benefData.id || Math.random().toString(36).substr(2, 9)),
            nom: String(benefData.NOM_BEN || benefData.nom || ''),
            prenom: String(benefData.PRE_BEN || benefData.prenom || ''),
            name: `${benefData.PRE_BEN || benefData.prenom || ''} ${benefData.NOM_BEN || benefData.nom || ''}`.trim(),
            code: String(benefData.ID_BEN || benefData.id || 'N/A'),
            age: String(benefData.AGE || benefData.age || 'N/A'),
            condition: String(benefData.STATUT_ACE || benefData.statut_ace || 'Non spécifiée'),
            identifiant_national: String(benefData.IDENTIFIANT_NATIONAL || benefData.identifiant_national || '')
          };
        });
        
        console.log(`✅ ${formattedBeneficiaires.length} bénéficiaires chargés`);
        setBeneficiaires(formattedBeneficiaires);
        return formattedBeneficiaires;
      } else {
        console.warn('⚠️ Bénéficiaires non disponibles');
        return [];
      }
    } catch (error) {
      console.error('❌ Erreur chargement bénéficiaires:', error);
      message.error('Erreur lors du chargement des bénéficiaires');
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
      
      const response = await prestatairesAPI.getAll(params);
      
      if (response.success && response.prestataires) {
        const formattedPrestataires = response.prestataires.map(prestataire => {
          const prestaData = prestataire;
          
          return {
            id: String(prestaData.id || prestaData.COD_PRE || Math.random().toString(36).substr(2, 9)),
            nom: String(prestaData.nom || prestaData.NOM_PRESTATAIRE || ''),
            prenom: String(prestaData.prenom || prestaData.PRENOM_PRESTATAIRE || ''),
            name: `${prestaData.prenom || prestaData.PRENOM_PRESTATAIRE || ''} ${prestaData.nom || prestaData.NOM_PRESTATAIRE || ''}`.trim(),
            specialite: String(prestaData.specialite || prestaData.SPECIALITE || 'Médecin'),
            code: String(prestaData.id || prestaData.COD_PRE || 'N/A'),
            type: String(prestaData.type_prestataire || prestaData.TYPE_PRESTATAIRE || 'Médecin'),
            telephone: String(prestaData.telephone || prestaData.TELEPHONE || ''),
            titre: String(prestaData.titre || prestaData.TITRE || '')
          };
        });
        
        console.log(`✅ ${formattedPrestataires.length} prestataires chargés`);
        setPrestataires(formattedPrestataires);
        return formattedPrestataires;
      } else {
        console.warn('⚠️ Prestataires non disponibles');
        return [];
      }
    } catch (error) {
      console.error('❌ Erreur chargement prestataires:', error);
      message.error('Erreur lors du chargement des prestataires');
      return [];
    } finally {
      setLoading(prev => ({ ...prev, prestataires: false }));
    }
  }, []);

  const loadReseauDetails = useCallback(async (reseauId) => {
    setLoading(prev => ({ ...prev, details: true }));
    try {
      const reseauResponse = await reseauSoinsAPI.getNetworkById(reseauId);
      
      if (reseauResponse.success && reseauResponse.network) {
        // AMÉLIORÉ : Construction des libellés des membres
        const membresFormatted = (reseauResponse.members || []).map(membre => {
          let nom_complet = '';
          let libelle = '';
          let type_membre_display = membre.type_membre;
          
          // Construction du nom complet selon le type
          if (membre.type_membre === 'Etablissement' || membre.type_membre === 'Centre de santé') {
            nom_complet = membre.nom_etablissement || 
                         membre.NOM_ETABLISSEMENT || 
                         membre.nom || 
                         `Centre ${membre.cod_cen || membre.code || ''}`;
            libelle = `Centre de santé: ${nom_complet}`;
            type_membre_display = 'Centre de Santé';
          } else if (membre.type_membre === 'Prestataire') {
            const titre = membre.titre || '';
            const prenom = membre.prenom_prestataire || membre.prenom || '';
            const nom = membre.nom_prestataire || membre.nom || '';
            nom_complet = `${titre} ${prenom} ${nom}`.trim();
            libelle = `${membre.specialite || 'Prestataire'}: ${nom_complet}`;
            type_membre_display = 'Prestataire';
          } else if (membre.type_membre === 'Beneficiaire') {
            const prenom = membre.prenom_beneficiaire || membre.prenom || '';
            const nom = membre.nom_beneficiaire || membre.nom || '';
            nom_complet = `${prenom} ${nom}`.trim();
            libelle = `Bénéficiaire: ${nom_complet}`;
            type_membre_display = 'Bénéficiaire';
          } else {
            nom_complet = membre.nom || 'Membre sans nom';
            libelle = `${membre.type_membre || 'Membre'}: ${nom_complet}`;
          }
          
          // Ajouter des informations supplémentaires
          const infosSupplementaires = [];
          if (membre.specialite) infosSupplementaires.push(`Spécialité: ${membre.specialite}`);
          if (membre.code_membre) infosSupplementaires.push(`Code: ${membre.code_membre}`);
          if (membre.telephone) infosSupplementaires.push(`Tél: ${membre.telephone}`);
          if (membre.identifiant_national) infosSupplementaires.push(`ID: ${membre.identifiant_national}`);
          
          return {
            ...membre,
            id: String(membre.id || Math.random().toString(36).substr(2, 9)),
            nom_complet,
            libelle,
            infos_supplementaires: infosSupplementaires.join(' • '),
            type_membre: type_membre_display,
            date_adhesion: membre.date_adhesion || membre.DATE_ADHESION,
            statut: String(membre.status_adhesion || membre.STATUS_ADHESION || 'Actif'),
            specialite: membre.specialite,
            telephone: membre.telephone,
            code_membre: membre.code_membre
          };
        });
        
        console.log('✅ Membres formatés:', membresFormatted);
        
        setDetailsDrawer({
          visible: true,
          reseau: reseauResponse.network,
          membres: membresFormatted,
          statistiques: {
            total_membres: membresFormatted.length,
            etablissements: membresFormatted.filter(m => 
              m.type_membre === 'Etablissement' || m.type_membre === 'Centre de santé'
            ).length,
            prestataires: membresFormatted.filter(m => 
              m.type_membre === 'Prestataire'
            ).length,
            beneficiaires: membresFormatted.filter(m => 
              m.type_membre === 'Bénéficiaire'
            ).length,
            membres_actifs: membresFormatted.filter(m => 
              m.statut === 'Actif' || m.status_adhesion === 'Actif'
            ).length
          }
        });
        
        message.success('Détails du réseau chargés');
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
        site_web: values.site_web || '',
        status: values.status || 'Actif'
      };
      
      console.log('📤 Création réseau avec données:', reseauData);
      
      const result = await reseauSoinsAPI.createNetwork(reseauData);
      
      if (result.success) {
        message.success('Réseau créé avec succès');
        setNetworkModal({ visible: false, mode: 'create', loading: false });
        networkForm.resetFields();
        loadReseaux();
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
        site_web: values.site_web || '',
        status: values.status || 'Actif'
      };
      
      console.log('📤 Mise à jour réseau avec données:', reseauData);
      
      const result = await reseauSoinsAPI.updateNetwork(reseauId, reseauData);
      
      if (result.success) {
        message.success('Réseau mis à jour avec succès');
        setNetworkModal({ visible: false, mode: 'edit', loading: false });
        networkForm.resetFields();
        loadReseaux();
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
      const result = await reseauSoinsAPI.updateNetwork(reseauId, { status: 'Inactif' });
      
      if (result.success) {
        message.success('Réseau désactivé avec succès');
        loadReseaux();
        setDetailsDrawer({ visible: false, reseau: null, membres: [], statistiques: {} });
      } else {
        message.error(result.message || 'Erreur lors de la désactivation');
      }
    } catch (error) {
      console.error('❌ Erreur suppression réseau:', error);
      message.error('Erreur lors de la désactivation du réseau');
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
      
      switch (memberType) {
        case 'center':
          // CORRIGÉ : Rechercher dans allCentres au lieu de centres
          const selectedCenter = allCentres.find(c => c.id === values.centerId);
          console.log('🔍 Centre sélectionné:', selectedCenter);
          console.log('🔍 Tous les centres disponibles:', allCentres.length);
          
          if (!selectedCenter) {
            throw new Error('Centre de santé non trouvé. Veuillez sélectionner un centre dans la liste.');
          }
          
          memberData = {
            type_membre: 'Etablissement',
            cod_cen: selectedCenter.cod_cen || parseInt(selectedCenter.id, 10) || selectedCenter.id,
            date_adhesion: dateAdhesion,
            statut: statusAdhesion
          };
          
          console.log('📤 Données centre envoyées à l\'API:', memberData);
          break;
          
        case 'provider':
          const selectedProvider = prestataires.find(p => p.id === values.providerId);
          if (!selectedProvider) {
            throw new Error('Prestataire non trouvé');
          }
          
          memberData = {
            type_membre: 'Prestataire',
            cod_pre: selectedProvider.cod_pre || selectedProvider.id,
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
            cod_ben: selectedBeneficiary.cod_ben || selectedBeneficiary.id,
            date_adhesion: dateAdhesion,
            statut: statusAdhesion
          };
          break;
          
        default:
          throw new Error('Type de membre non reconnu');
      }
      
      console.log('📤 Appel API addMemberToNetwork avec:', {
        reseauId: detailsDrawer.reseau.id,
        memberData
      });
      
      const result = await reseauSoinsAPI.addMemberToNetwork(detailsDrawer.reseau.id, memberData);
      
      console.log('📋 Réponse API addMemberToNetwork:', result);
      
      if (result.success) {
        message.success('Membre ajouté avec succès');
        setMemberModal({ visible: false, loading: false });
        memberForm.resetFields();
        
        await loadReseauDetails(detailsDrawer.reseau.id);
        await loadReseaux();
        
        setTimeout(() => {
          loadReseauDetails(detailsDrawer.reseau.id);
        }, 500);
        
      } else {
        const errorMsg = result.message || result.error || 'Erreur lors de l\'ajout du membre';
        console.error('❌ Erreur API:', result);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Erreur détaillée ajout membre:', error);
      message.error(`Erreur: ${error.message}`);
    } finally {
      setMemberModal(prev => ({ ...prev, loading: false }));
    }
  };

  // CORRIGÉ : Fonction handleRemoveMember avec recherche correcte du membre
  const handleRemoveMember = async (membreId) => {
    console.log('🗑️ Tentative de retrait du membre ID:', membreId);
    
    if (!detailsDrawer.reseau?.id) {
      message.error('Aucun réseau sélectionné');
      return;
    }
    
    // Trouver le membre dans la liste pour confirmation
    const membreToRemove = detailsDrawer.membres.find(m => m.id === membreId);
    if (!membreToRemove) {
      message.error('Membre non trouvé dans la liste');
      return;
    }
    
    try {
      console.log('📤 Appel API pour retirer le membre:', {
        membreId,
        reseauId: detailsDrawer.reseau.id,
        membreName: membreToRemove.nom_complet
      });
      
      // Essayer plusieurs méthodes d'API
      let result = null;
      
      // Méthode 1: Mettre à jour le statut du membre
      try {
        result = await reseauSoinsAPI.updateMemberStatus(membreId, 'Inactif');
      } catch (apiError1) {
        console.warn('⚠️ Méthode 1 échouée:', apiError1);
        
        // Méthode 2: Supprimer directement le membre
        try {
          result = await reseauSoinsAPI.removeMemberFromNetwork(detailsDrawer.reseau.id, membreId);
        } catch (apiError2) {
          console.warn('⚠️ Méthode 2 échouée:', apiError2);
          
          // Méthode 3: Mettre à jour l'adhésion
          try {
            result = await reseauSoinsAPI.updateMemberStatus(membreId, { status_adhesion: 'Inactif' });
          } catch (apiError3) {
            console.warn('⚠️ Méthode 3 échouée:', apiError3);
            throw new Error('Toutes les méthodes d\'API ont échoué');
          }
        }
      }
      
      console.log('📋 Réponse API retrait membre:', result);
      
      if (result && result.success) {
        message.success(`Membre "${membreToRemove.nom_complet}" retiré du réseau`);
        
        // Mettre à jour la liste des membres localement
        const updatedMembres = detailsDrawer.membres.filter(m => m.id !== membreId);
        setDetailsDrawer(prev => ({
          ...prev,
          membres: updatedMembres,
          statistiques: {
            ...prev.statistiques,
            total_membres: updatedMembres.length,
            membres_actifs: updatedMembres.filter(m => 
              m.statut === 'Actif' || m.status_adhesion === 'Actif'
            ).length
          }
        }));
        
        // Recharger la liste des réseaux pour mettre à jour le compteur
        await loadReseaux();
        
      } else {
        const errorMsg = result?.message || result?.error || 'Erreur lors du retrait du membre';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Erreur détaillée retrait membre:', error);
      message.error(`Erreur: ${error.message}`);
    }
  };

  const handleEditReseau = (reseau) => {
    console.log('✏️ Modification du réseau:', reseau);
    
    // Vérifier que le réseau existe
    if (!reseau || !reseau.id) {
      message.error('Réseau non valide pour modification');
      return;
    }
    
    // Mettre à jour le drawer avec le réseau actuel
    setDetailsDrawer(prev => ({
      ...prev,
      reseau: reseau
    }));
    
    // Remplir le formulaire avec les valeurs du réseau
    networkForm.setFieldsValue({
      nom: reseau.nom || '',
      description: reseau.description || '',
      type: reseau.type || 'Hospitalier',
      objectifs: reseau.objectifs || '',
      zone_couverture: reseau.zone_couverture || '',
      population_cible: reseau.population_cible || '',
      region_code: reseau.region_code || undefined,
      contact_principal: reseau.contact_principal || '',
      telephone_contact: reseau.telephone_contact || '',
      email_contact: reseau.email_contact || '',
      site_web: reseau.site_web || '',
      status: reseau.status || 'Actif'
    });
    
    console.log('📝 Formulaire rempli avec:', networkForm.getFieldsValue());
    
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

  const handleSearchProviders = (value) => {
    loadPrestataires(value);
  };

  const handleSearchBeneficiaries = (value) => {
    loadBeneficiaires(value);
  };

  const handleMemberTypeChange = (value) => {
    memberForm.setFieldsValue({
      centerId: undefined,
      providerId: undefined,
      beneficiaryId: undefined
    });
  };

  const openAddMemberModal = () => {
    console.log('📝 Ouverture modal ajout membre');
    
    // Charger les données nécessaires
    loadAllCentres('').then(loadedCentres => {
      console.log('✅ Centres chargés pour modal:', loadedCentres?.length);
      if (loadedCentres && loadedCentres.length > 0) {
        console.log('📋 Exemple de centre:', loadedCentres[0]);
      }
    });
    
    loadPrestataires('');
    loadBeneficiaires('');
    
    // Réinitialiser le formulaire
    memberForm.resetFields();
    memberForm.setFieldsValue({
      type: 'center',
      date: moment(),
      status: 'Actif'
    });
    
    setMemberModal({ visible: true, loading: false });
  };

  const forceReloadCentres = () => {
    message.info('Rechargement des centres en cours...');
    loadAllCentres('').then(() => {
      message.success('Centres rechargés avec succès');
    });
  };

  // ==================== CONFIGURATION DES COLONNES DU TABLEAU ====================

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
              {record.description && typeof record.description === 'string' 
                ? `${record.description.substring(0, 50)}...` 
                : 'Aucune description'}
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
              title="Êtes-vous sûr de vouloir désactiver ce réseau ?"
              description="Le réseau sera marqué comme inactif."
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

  // ==================== CONFIGURATION DES ONGLETS POUR LE DRAWER ====================

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
                          description={`Êtes-vous sûr de vouloir retirer "${member.nom_complet || 'ce membre'}" du réseau ?`}
                          onConfirm={() => handleRemoveMember(member.id)}
                          okText="Oui"
                          cancelText="Non"
                          okButtonProps={{ danger: true }}
                        >
                          <Button 
                            size="small" 
                            danger 
                            icon={<MinusCircleOutlined />} 
                            loading={loading.membres}
                          />
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
                          <Text strong>{member.nom_complet || 'Membre sans nom'}</Text>
                          <Tag color={memberType.color} style={{ marginLeft: '8px', fontSize: '10px' }}>
                            {memberType.label}
                          </Tag>
                        </div>
                      }
                      description={
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {/* LIBELLÉ AMÉLIORÉ */}
                          <Text type="secondary" style={{ fontSize: '12px', fontWeight: '500' }}>
                            {member.libelle || `${memberType.label}: ${member.nom_complet}`}
                          </Text>
                          
                          {/* INFORMATIONS SUPPLÉMENTAIRES */}
                          {member.infos_supplementaires && (
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              {member.infos_supplementaires}
                            </Text>
                          )}
                          
                          {/* STATUT ET DATE */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <Tag 
                              color={getStatusConfig(member.statut).color} 
                              size="small"
                              icon={getStatusConfig(member.statut).icon}
                              style={{ fontSize: '10px', padding: '0 6px' }}
                            >
                              {member.statut || 'Actif'}
                            </Tag>
                            
                            {member.date_adhesion && (
                              <Text type="secondary" style={{ fontSize: '11px' }}>
                                <ClockCircleOutlined style={{ marginRight: '4px' }} />
                                Adhésion: {moment(member.date_adhesion).format('DD/MM/YYYY')}
                              </Text>
                            )}
                          </div>
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

  // ==================== EFFETS ====================

  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

  useEffect(() => {
    loadReseaux();
  }, [loadReseaux]);

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

      {/* Modal Ajouter Membre */}
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
        width={800}
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
        afterOpenChange={(visible) => {
          if (visible) {
            loadAllCentres('');
          }
        }}
      >
        <Alert
          message="Information"
          description={
            <div>
              <p>Sélectionnez un type de membre et choisissez parmi la liste disponible.</p>
              <p>
                <DatabaseOutlined /> <Text strong>{centres.length}</Text> centres de santé disponibles
                <Button 
                  type="link" 
                  size="small" 
                  icon={<SyncOutlined />} 
                  onClick={forceReloadCentres}
                  style={{ marginLeft: '10px' }}
                >
                  Recharger
                </Button>
              </p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        {centres.length < 5 && (
          <Collapse ghost style={{ marginBottom: '16px' }}>
            <Panel 
              header={
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                  <Text type="warning">Peu de centres disponibles ({centres.length})</Text>
                </Space>
              } 
              key="diagnostic"
            >
              <Alert
                message="Diagnostic"
                description={
                  <div>
                    <p>Seulement {centres.length} centre(s) disponible(s). Causes possibles :</p>
                    <ul>
                      <li>L'API ne retourne que les centres actifs</li>
                      <li>Problème de pagination dans l'API</li>
                      <li>Filtres appliqués par défaut</li>
                      <li>La base de données contient peu de centres</li>
                    </ul>
                    <p>Essayez de :</p>
                    <ol>
                      <li>Cliquer sur "Recharger" ci-dessus</li>
                      <li>Rechercher un centre spécifique</li>
                      <li>Vérifier les paramètres de l'API centresAPI</li>
                    </ol>
                  </div>
                }
                type="warning"
                showIcon
              />
            </Panel>
          </Collapse>
        )}
        
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
              style={{ width: '100%' }}
            >
              {memberTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {memberForm.getFieldValue('type') === 'center' && (
            <Form.Item
              name="centerId"
              label={
                <Space>
                  <span>Centre de Santé</span>
                  <Tag color="blue">{centres.length} disponible(s)</Tag>
                </Space>
              }
              rules={[{ required: true, message: 'Veuillez sélectionner un centre de santé' }]}
              help={
                <div style={{ marginTop: '8px' }}>
                  <Space>
                    <Text type="secondary">
                      Tapez pour rechercher ou faites défiler pour voir tous les centres
                    </Text>
                    <Button 
                      type="link" 
                      size="small" 
                      icon={<SyncOutlined />} 
                      onClick={forceReloadCentres}
                      loading={loading.centres}
                    >
                      Actualiser
                    </Button>
                  </Space>
                </div>
              }
            >
              <Select
                showSearch
                placeholder={
                  loading.centres 
                    ? "Chargement des centres..." 
                    : centres.length > 0 
                      ? "Rechercher ou sélectionner un centre..." 
                      : "Aucun centre disponible. Cliquez sur Actualiser."
                }
                optionFilterProp="children"
                onSearch={handleSearchCenters}
                onFocus={() => {
                  if (centres.length === 0) {
                    loadAllCentres('');
                  }
                }}
                filterOption={(input, option) => {
                  if (!option || !option.children) return false;
                  const text = String(option.children).toLowerCase();
                  return text.includes(input.toLowerCase());
                }}
                loading={loading.centres}
                notFoundContent={
                  loading.centres ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: '10px' }}>Chargement des centres...</div>
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE} 
                        description={
                          <div>
                            <p>Aucun centre trouvé</p>
                            <p>Essayez une recherche différente ou rechargez la liste</p>
                          </div>
                        } 
                      />
                      <Button 
                        type="primary" 
                        onClick={forceReloadCentres}
                        style={{ marginTop: '10px' }}
                        icon={<SyncOutlined />}
                      >
                        Recharger tous les centres
                      </Button>
                    </div>
                  )
                }
                allowClear
                style={{ width: '100%' }}
                dropdownRender={menu => (
                  <div>
                    <div style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                      <Text strong>
                        {centres.length} centre(s) disponible(s)
                      </Text>
                      <Button 
                        type="link" 
                        size="small" 
                        onClick={forceReloadCentres}
                        style={{ float: 'right' }}
                        icon={<SyncOutlined />}
                      >
                        Actualiser
                      </Button>
                    </div>
                    {menu}
                  </div>
                )}
                listHeight={300}
                virtual={false}
              >
                {centres.map(centre => (
                  <Option 
                    key={centre.id} 
                    value={centre.id}
                    label={`${String(centre.name || 'Sans nom')} | ${String(centre.code || 'N/A')} | ${String(centre.region || 'Non spécifiée')}`}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text strong style={{ fontSize: '14px', flex: 1 }}>
                          {String(centre.name || 'Centre sans nom')}
                        </Text>
                        <Tag 
                          color={centre.status === 'Actif' ? 'green' : 'orange'} 
                          size="small"
                          style={{ fontSize: '10px', marginLeft: '8px' }}
                        >
                          {String(centre.status || 'Inconnu')}
                        </Tag>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                        <Tag color="blue" size="small" style={{ fontSize: '10px' }}>
                          {String(centre.type || 'Centre de Santé')}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          <strong>Code:</strong> {String(centre.code || 'N/A')}
                        </Text>
                        {centre.region && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            <strong>Région:</strong> {String(centre.region)}
                          </Text>
                        )}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        {centre.telephone && (
                          <Text type="secondary" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <PhoneOutlined /> {String(centre.telephone)}
                          </Text>
                        )}
                        {centre.adresse && (
                          <Text type="secondary" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <EnvironmentOutlined /> {String(centre.adresse).length > 40 ? `${String(centre.adresse).substring(0, 40)}...` : String(centre.adresse)}
                          </Text>
                        )}
                      </div>
                      <div style={{ marginTop: '6px', fontSize: '10px', color: '#999' }}>
                        <Text type="secondary">ID: {String(centre.id)}</Text>
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

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
                notFoundContent={
                  loading.prestataires ? (
                    <div style={{ padding: '10px', textAlign: 'center' }}>
                      <Spin size="small" />
                      <div>Chargement...</div>
                    </div>
                  ) : (
                    <Empty description="Aucun prestataire trouvé" />
                  )
                }
                allowClear
                style={{ width: '100%' }}
              >
                {prestataires.map(prestataire => (
                  <Option 
                    key={prestataire.id} 
                    value={prestataire.id}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
                      <Text strong style={{ fontSize: '14px' }}>
                        {String(prestataire.prenom || '')} {String(prestataire.nom || '')}
                      </Text>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <Tag color="blue" size="small" style={{ fontSize: '10px' }}>
                          {String(prestataire.specialite || 'Médecin')}
                        </Tag>
                        {prestataire.titre && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {String(prestataire.titre)}
                          </Text>
                        )}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

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
                notFoundContent={
                  loading.beneficiaires ? (
                    <div style={{ padding: '10px', textAlign: 'center' }}>
                      <Spin size="small" />
                      <div>Chargement...</div>
                    </div>
                  ) : (
                    <Empty description="Aucun bénéficiaire trouvé" />
                  )
                }
                allowClear
                style={{ width: '100%' }}
              >
                {beneficiaires.map(beneficiaire => (
                  <Option 
                    key={beneficiaire.id} 
                    value={beneficiaire.id}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
                      <Text strong style={{ fontSize: '14px' }}>
                        {String(beneficiaire.prenom || '')} {String(beneficiaire.nom || '')}
                      </Text>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Âge: {String(beneficiaire.age || 'N/A')} ans
                        </Text>
                        {beneficiaire.identifiant_national && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            ID: {String(beneficiaire.identifiant_national)}
                          </Text>
                        )}
                      </div>
                    </div>
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
                <Select style={{ width: '100%' }}>
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