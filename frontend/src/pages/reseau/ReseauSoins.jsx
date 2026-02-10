// NetworkPage.jsx - Version corrigée avec gestion des prestataires déjà membres
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table, Card, Row, Col, Statistic, Button, Modal, Form,
  Select, Input, DatePicker, Tag, Space, message, Tabs,
  Descriptions, Tooltip, Popconfirm, Spin, Alert,
  Divider, Badge, Typography,
  Drawer, Avatar
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
  ArrowUpOutlined,
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

const NetworkPage = () => {
  const { user } = useAuth();
  
  // États principaux
  const [reseaux, setReseaux] = useState([]);
  const [loading, setLoading] = useState({
    reseaux: false,
    details: false,
    membres: false,
    centres: false,
    prestataires: false
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
  
  // Modal pour les prestataires d'un centre
  const [centerProvidersModal, setCenterProvidersModal] = useState({
    visible: false,
    centre: null,
    prestataires: [],
    loading: false
  });
  
  // Référence pour suivre le centre en cours de chargement
  const loadingCenterRef = useRef(null);
  
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
    { value: 'center', label: 'Centre de Santé', icon: <BankOutlined /> }
  ];

  // ==================== FONCTIONS UTILITAIRES ====================
// Fonction pour recharger les prestataires d'un centre
const reloadCenterProviders = async () => {
  if (centerProvidersModal.centre) {
    console.log('🔄 Rechargement des prestataires pour:', centerProvidersModal.centre);
    await loadPrestatairesByCentre(centerProvidersModal.centre.id, centerProvidersModal.centre.nom);
  }
};

// Ajoutez ce bouton dans la modal des prestataires (dans la section footer) :
<Button 
  key="refresh" 
  icon={<SyncOutlined />}
  onClick={reloadCenterProviders}
  loading={centerProvidersModal.loading}
>
  Actualiser
</Button>

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
      console.log('🔍 Début du chargement des centres...');
      
      const response = await centresAPI.getAll({ 
        limit: 1000,
        page: 1,
        actif: 1
      });
      
      if (response.success && response.centres) {
        const uniqueCentres = [];
        const seenIds = new Set();
        
        response.centres.forEach(centre => {
          let centreId = centre.id || centre.COD_CEN || centre.code || `cen_${Math.random().toString(36).substr(2, 9)}`;
          centreId = String(centreId);
          
          if (!seenIds.has(centreId)) {
            seenIds.add(centreId);
            
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
              region: region,
              type: type,
              telephone: telephone,
              adresse: adresse,
              status: status
            });
          }
        });
        
        console.log(`✅ ${uniqueCentres.length} centres uniques formatés`);
        
        if (uniqueCentres.length > 0) {
          setAllCentres(uniqueCentres);
          
          if (searchTerm && searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase();
            const filtered = uniqueCentres.filter(centre => {
              const name = centre.name ? String(centre.name).toLowerCase() : '';
              const code = centre.code ? String(centre.code).toLowerCase() : '';
              const region = centre.region ? String(centre.region).toLowerCase() : '';
              const type = centre.type ? String(centre.type).toLowerCase() : '';
              return name.includes(searchLower) || code.includes(searchLower) || 
                     region.includes(searchLower) || type.includes(searchLower);
            });
            setCentres(filtered);
            return filtered;
          } else {
            setCentres(uniqueCentres);
            return uniqueCentres;
          }
        }
      }
      
      // Fallback
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
      
    } catch (error) {
      console.error('❌ Erreur chargement centres:', error);
      message.error('Erreur lors du chargement des centres de santé');
      return [];
    } finally {
      setLoading(prev => ({ ...prev, centres: false }));
    }
  }, []);

  const handleSearchCenters = useCallback((value) => {
    console.log('🔍 Recherche de centres avec terme:', value);
    
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

 const loadReseauDetails = useCallback(async (reseauId) => {
  setLoading(prev => ({ ...prev, details: true }));
  try {
    const reseauResponse = await reseauSoinsAPI.getNetworkById(reseauId);
    
    if (reseauResponse.success && reseauResponse.network) {
      const membresFormatted = (reseauResponse.members || []).map(membre => {
        let nom_complet = '';
        let libelle = '';
        let type_membre_display = membre.type_membre;
        let cod_cen = null;
        let cod_pre = null;
        
        if (membre.type_membre === 'Etablissement' || membre.type_membre === 'Centre de santé') {
          nom_complet = membre.nom_etablissement || 
                       membre.NOM_ETABLISSEMENT || 
                       membre.nom || 
                       `Centre ${membre.cod_cen || membre.code || ''}`;
          libelle = `Centre de santé: ${nom_complet}`;
          type_membre_display = 'Centre de Santé';
          
          // EXTRACTION CRITIQUE de l'ID du centre
          cod_cen = membre.cod_cen || 
                   membre.centre_id || 
                   membre.etablissement_id || 
                   membre.COD_CEN ||
                   null;
          
          if (!cod_cen && membre.id && membre.type_membre === 'Etablissement') {
            const numericId = parseInt(membre.id, 10);
            if (!isNaN(numericId) && membre.id.toString().length <= 6) {
              cod_cen = numericId;
            }
          }
        } else if (membre.type_membre === 'Prestataire') {
          const nom = membre.nom_prestataire || membre.nom || membre.NOM_PRESTATAIRE || '';
          const prenom = membre.prenom_prestataire || membre.prenom || membre.PRENOM_PRESTATAIRE || '';
          nom_complet = `${prenom} ${nom}`.trim() || `Prestataire ${membre.id}`;
          libelle = `Prestataire: ${nom_complet}`;
          type_membre_display = 'Prestataire';
          
          // EXTRACTION CRITIQUE de l'ID du prestataire (PRIORITÉ à cod_pre)
          cod_pre = membre.cod_pre || 
                   membre.prestataire_id || 
                   membre.COD_PRE ||
                   (membre.id && membre.type_membre === 'Prestataire' ? membre.id : null);
          
          // Log pour déboguer
          console.log('🔍 Extraction ID prestataire:', {
            membreId: membre.id,
            cod_pre: membre.cod_pre,
            prestataire_id: membre.prestataire_id,
            COD_PRE: membre.COD_PRE,
            result: cod_pre
          });
        } else if (membre.type_membre === 'Beneficiaire') {
          const nom = membre.nom || membre.NOM_BENEFICIAIRE || '';
          const prenom = membre.prenom || membre.PRENOM_BENEFICIAIRE || '';
          nom_complet = `${prenom} ${nom}`.trim() || `Bénéficiaire ${membre.id}`;
          libelle = `Bénéficiaire: ${nom_complet}`;
          type_membre_display = 'Bénéficiaire';
        } else {
          nom_complet = membre.nom || 'Membre sans nom';
          libelle = `${membre.type_membre || 'Membre'}: ${nom_complet}`;
        }
        
        const infosSupplementaires = [];
        if (membre.specialite) infosSupplementaires.push(`Spécialité: ${membre.specialite}`);
        if (membre.code_membre) infosSupplementaires.push(`Code: ${membre.code_membre}`);
        if (membre.telephone) infosSupplementaires.push(`Tél: ${membre.telephone}`);
        
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
          code_membre: membre.code_membre,
          // IDS EXTRACTS POUR LES VÉRIFICATIONS
          cod_cen: cod_cen,
          centre_id: cod_cen,
          cod_pre: cod_pre,  // AJOUT IMPORTANT
          prestataire_id: cod_pre  // ALIAS POUR FACILITER LES VÉRIFICATIONS
        };
      });
      
      console.log('📋 Membres formatés avec IDs prestataires:', membresFormatted.filter(m => m.type_membre === 'Prestataire'));
      
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

  // ==================== FONCTION POUR CHARGER LES PRESTATAIRES PAR CENTRE ====================

const loadPrestatairesByCentre = useCallback(async (centreId, centreNom) => {
  // Vérifier si l'ID est valide
  if (!centreId || centreId === 'undefined') {
    console.error('❌ centreId invalide:', centreId);
    message.error('ID du centre invalide');
    return;
  }
  
  // Convertir en nombre
  const numericCentreId = parseInt(centreId);
  if (isNaN(numericCentreId)) {
    console.error('❌ centreId n\'est pas un nombre:', centreId);
    message.error('ID du centre doit être un nombre');
    return;
  }
  
  // Arrêter si déjà en cours de chargement
  if (loadingCenterRef.current === numericCentreId) {
    console.log('⚠️ Centre déjà en cours de chargement:', numericCentreId);
    return;
  }
  
  loadingCenterRef.current = numericCentreId;
  
  setCenterProvidersModal(prev => ({
    ...prev,
    loading: true
  }));
  
  try {
    console.log('📡 Chargement des prestataires pour le centre:', numericCentreId, centreNom);
    
    // ESSAYER LA MÉTHODE getByCentre D'ABORD
    let response = null;
    
    try {
      console.log('🔄 Tentative avec prestatairesAPI.getByCentre');
      response = await prestatairesAPI.getByCentre(numericCentreId, {
        limit: 100,
        status: 'Actif',
        affectation_active: '1'
      });
      console.log('📋 Réponse getByCentre:', response);
    } catch (error) {
      console.warn('⚠️ getByCentre a échoué:', error.message);
      // Si getByCentre échoue, essayer searchByCentre
      try {
        response = await prestatairesAPI.searchByCentre('', numericCentreId, {
          limit: 100,
          status: 'Actif'
        });
        console.log('📋 Réponse searchByCentre:', response);
      } catch (error2) {
        console.warn('⚠️ searchByCentre a échoué:', error2.message);
        // Dernière tentative avec getAll
        response = await prestatairesAPI.getAll({
          limit: 500,
          status: 'Actif',
          centre_id: numericCentreId
        });
        console.log('📋 Réponse getAll:', response);
      }
    }
    
    if (response && response.success && response.prestataires) {
      const formattedProviders = response.prestataires.map(prestataire => {
        const id = prestataire.id || prestataire.COD_PRE || `prest_${Math.random().toString(36).substr(2, 9)}`;
        const nom = prestataire.nom || prestataire.NOM_PRESTATAIRE || '';
        const prenom = prestataire.prenom || prestataire.PRENOM_PRESTATAIRE || '';
        
        // VÉRIFICATION RENFORCÉE : Comparaison avec TOUS les membres du réseau
        const deja_membre = detailsDrawer.membres?.some(m => {
          if (m.type_membre !== 'Prestataire') return false;
          
          // Essayer plusieurs façons de comparer les IDs
          const membrePrestataireId = m.cod_pre || m.prestataire_id || m.id;
          const prestataireId = id;
          
          // Comparaison en string pour être sûr
          const match = String(membrePrestataireId) === String(prestataireId);
          
          if (match) {
            console.log(`✅ Prestataire ${prestataireId} déjà membre avec ID membre: ${membrePrestataireId}`);
          }
          
          return match;
        });
        
        if (deja_membre) {
          console.log(`⚠️ Prestataire ${id} (${prenom} ${nom}) est déjà membre du réseau`);
        }
        
        return {
          id: String(id),
          nom: String(nom),
          prenom: String(prenom),
          nom_complet: `${prenom} ${nom}`.trim(),
          specialite: String(prestataire.specialite || prestataire.SPECIALITE || 'Non spécifiée'),
          titre: String(prestataire.titre || prestataire.TITRE || ''),
          telephone: String(prestataire.telephone || prestataire.TELEPHONE || ''),
          email: String(prestataire.email || prestataire.EMAIL || ''),
          date_debut_affectation: prestataire.date_debut_affectation || prestataire.date_affectation,
          date_fin_affectation: prestataire.date_fin_affectation,
          statut_affectation: prestataire.statut_affectation || prestataire.STATUT_AFFECTATION || 'Actif',
          deja_membre,
          // Stocker l'ID original pour les logs
          cod_pre: prestataire.COD_PRE || prestataire.id
        };
      });
      
      const countDejaMembres = formattedProviders.filter(p => p.deja_membre).length;
      console.log(`✅ ${formattedProviders.length} prestataires formatés, ${countDejaMembres} déjà membres`);
      
      setCenterProvidersModal(prev => ({
        ...prev,
        prestataires: formattedProviders,
        loading: false
      }));
      
      if (formattedProviders.length === 0) {
        message.info('Aucun prestataire trouvé pour ce centre');
      }
    } else {
      console.warn('⚠️ Aucun prestataire trouvé ou erreur API');
      setCenterProvidersModal(prev => ({
        ...prev,
        prestataires: [],
        loading: false
      }));
      message.warning(response?.message || 'Aucun prestataire trouvé pour ce centre');
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement des prestataires:', error);
    setCenterProvidersModal(prev => ({
      ...prev,
      prestataires: [],
      loading: false
    }));
    message.error(`Erreur: ${error.message}`);
  } finally {
    // Réinitialiser la référence de chargement
    loadingCenterRef.current = null;
  }
}, [detailsDrawer.membres]); // IMPORTANT: dépendance à detailsDrawer.membres

  // Fonction pour ouvrir la modal des prestataires d'un centre
  const openCenterProvidersModal = (centreId, centreNom) => {
    // VALIDATION COMPLÈTE
    if (!centreId || centreId === 'undefined' || centreId === 'null' || centreId === '') {
      console.error('❌ centreId invalide dans openCenterProvidersModal:', {
        centreId,
        centreNom,
        type: typeof centreId
      });
      
      message.error({
        content: (
          <div>
            <div>Impossible d'ouvrir la liste des prestataires</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
              L'identifiant du centre est manquant ou invalide
            </div>
          </div>
        ),
        duration: 5
      });
      return;
    }
    
    // Convertir en nombre si possible
    let numericCentreId = centreId;
    if (typeof centreId === 'string' && /^\d+$/.test(centreId)) {
      numericCentreId = parseInt(centreId, 10);
    }
    
    if (isNaN(numericCentreId)) {
      console.error('❌ centreId n\'est pas un nombre:', centreId);
      message.error('ID du centre doit être un nombre valide');
      return;
    }
    
    console.log('✅ Ouverture modal pour le centre:', {
      id: numericCentreId,
      nom: centreNom,
      originalId: centreId
    });
    
    setCenterProvidersModal({
      visible: true,
      centre: { id: numericCentreId, nom: centreNom },
      prestataires: [],
      loading: true
    });
    
    // Charger les prestataires avec un léger délai
    setTimeout(() => {
      loadPrestatairesByCentre(numericCentreId, centreNom);
    }, 100);
  };

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
    if (!detailsDrawer.reseau?.id) {
      message.error('Aucun réseau sélectionné');
      return;
    }
    
    setMemberModal(prev => ({ ...prev, loading: true }));
    
    try {
      const dateAdhesion = values.date.format('YYYY-MM-DD');
      const statusAdhesion = values.status || 'Actif';
      
      const selectedCenter = allCentres.find(c => c.id === values.centerId);
      
      if (!selectedCenter) {
        throw new Error('Centre de santé non trouvé');
      }
      
      const centerMemberData = {
        type_membre: 'Etablissement',
        cod_cen: selectedCenter.cod_cen || parseInt(selectedCenter.id, 10) || selectedCenter.id,
        date_adhesion: dateAdhesion,
        statut: statusAdhesion
      };
      
      const result = await reseauSoinsAPI.addMemberToNetwork(detailsDrawer.reseau.id, centerMemberData);
      
      if (result.success) {
        message.success(`Centre "${selectedCenter.name}" ajouté au réseau`);
        
        setMemberModal({ visible: false, loading: false });
        memberForm.resetFields();
        
        await loadReseauDetails(detailsDrawer.reseau.id);
        await loadReseaux();
      } else {
        throw new Error(result.message || 'Erreur lors de l\'ajout du centre');
      }
    } catch (error) {
      console.error('❌ Erreur détaillée ajout membre:', error);
      message.error(`Erreur: ${error.message}`);
    } finally {
      setMemberModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRemoveMember = async (membreId) => {
    if (!detailsDrawer.reseau?.id) {
      message.error('Aucun réseau sélectionné');
      return;
    }
    
    const membreToRemove = detailsDrawer.membres.find(m => m.id === membreId);
    if (!membreToRemove) {
      message.error('Membre non trouvé dans la liste');
      return;
    }
    
    try {
      let result = null;
      
      try {
        result = await reseauSoinsAPI.updateMemberStatus(membreId, 'Inactif');
      } catch (apiError1) {
        console.warn('⚠️ Méthode 1 échouée:', apiError1);
        try {
          result = await reseauSoinsAPI.removeMemberFromNetwork(detailsDrawer.reseau.id, membreId);
        } catch (apiError2) {
          console.warn('⚠️ Méthode 2 échouée:', apiError2);
          throw new Error('Impossible de retirer le membre');
        }
      }
      
      if (result && result.success) {
        message.success(`Membre "${membreToRemove.nom_complet}" retiré du réseau`);
        
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
    if (!reseau || !reseau.id) {
      message.error('Réseau non valide pour modification');
      return;
    }
    
    setDetailsDrawer(prev => ({
      ...prev,
      reseau: reseau
    }));
    
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

  const openAddMemberModal = () => {
    loadAllCentres('');
    memberForm.resetFields();
    memberForm.setFieldsValue({
      type: 'center',
      date: moment(),
      status: 'Actif'
    });
    
    setMemberModal({ visible: true, loading: false });
  };

// Fonction pour ajouter un prestataire depuis la modal - VERSION CORRIGÉE AVEC VÉRIFICATION RENFORCÉE
const handleAddProviderFromModal = async (prestataire) => {
  if (!detailsDrawer.reseau?.id) {
    message.error('Aucun réseau sélectionné');
    return;
  }
  
  // VÉRIFICATION RENFORCÉE - Si déjà membre, on arrête immédiatement
  if (prestataire.deja_membre === true) {
    message.warning({
      content: (
        <div>
          <div>Ce prestataire est déjà membre du réseau</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
            {prestataire.nom_complet} - {prestataire.specialite}
          </div>
        </div>
      ),
      duration: 3
    });
    return; // IMPORTANT: Arrêter l'exécution ici
  }
  
  // VÉRIFICATION SUPPLÉMENTAIRE : Re-vérifier avec les données actuelles
  const estDejaMembre = detailsDrawer.membres?.some(m => {
    if (m.type_membre !== 'Prestataire') return false;
    const membrePrestataireId = m.cod_pre || m.prestataire_id;
    return String(membrePrestataireId) === String(prestataire.id);
  });
  
  if (estDejaMembre) {
    message.warning({
      content: (
        <div>
          <div>Ce prestataire est déjà membre du réseau (vérification double)</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
            {prestataire.nom_complet} - {prestataire.specialite}
          </div>
        </div>
      ),
      duration: 3
    });
    
    // Mettre à jour l'état local
    const updatedProviders = centerProvidersModal.prestataires.map(p => 
      p.id === prestataire.id ? { ...p, deja_membre: true } : p
    );
    
    setCenterProvidersModal(prev => ({
      ...prev,
      prestataires: updatedProviders
    }));
    
    return;
  }
  
  try {
    const providerMemberData = {
      type_membre: 'Prestataire',
      cod_pre: prestataire.id,
      date_adhesion: moment().format('YYYY-MM-DD'),
      statut: 'Actif',
      centre_affectation: centerProvidersModal.centre?.id,
      specialite: prestataire.specialite
    };
    
    console.log('📤 Données envoyées pour ajout prestataire:', providerMemberData);
    
    const result = await reseauSoinsAPI.addMemberToNetwork(detailsDrawer.reseau.id, providerMemberData);
    
    if (result.success) {
      message.success(`Prestataire "${prestataire.nom_complet}" ajouté au réseau`);
      
      // Mettre à jour l'état local pour refléter le changement
      const updatedProviders = centerProvidersModal.prestataires.map(p => 
        p.id === prestataire.id ? { ...p, deja_membre: true } : p
      );
      
      setCenterProvidersModal(prev => ({
        ...prev,
        prestataires: updatedProviders
      }));
      
      // Recharger les détails du réseau pour avoir les données à jour
      await loadReseauDetails(detailsDrawer.reseau.id);
    } else {
      message.error(result.message || 'Erreur lors de l\'ajout du prestataire');
    }
  } catch (error) {
    console.error('❌ Erreur détaillée ajout prestataire:', error);
    
    // Si l'erreur est "déjà membre", mettre à jour l'état local
    if (error.message && error.message.includes('déjà dans le réseau')) {
      message.warning(`Ce prestataire est déjà membre du réseau : ${prestataire.nom_complet}`);
      
      // Mettre à jour l'état local
      const updatedProviders = centerProvidersModal.prestataires.map(p => 
        p.id === prestataire.id ? { ...p, deja_membre: true } : p
      );
      
      setCenterProvidersModal(prev => ({
        ...prev,
        prestataires: updatedProviders
      }));
      
      // Recharger les détails pour s'assurer que tout est à jour
      await loadReseauDetails(detailsDrawer.reseau.id);
    } else {
      message.error(`Erreur: ${error.message || 'Erreur lors de l\'ajout du prestataire au réseau'}`);
    }
  }
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

  // ==================== EFFETS ====================

  useEffect(() => {
    loadRegions();
    loadReseaux();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (filters.search) {
        loadReseaux();
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
            <span>Détails du Réseau: {detailsDrawer.reseau?.nom}</span>
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
              Ajouter Centre
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

              <Tabs defaultActiveKey="info" items={[
                {
                  key: 'info',
                  label: 'Informations',
                  children: (
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
                  )
                },
                {
                  key: 'members',
                  label: `Centres (${detailsDrawer.membres?.filter(m => 
                    m.type_membre === 'Centre de Santé' || m.type_membre === 'Etablissement'
                  ).length || 0})`,
                  children: (
                    <div>
                      <div style={{ marginBottom: '16px' }}>
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={openAddMemberModal}
                        >
                          Ajouter un centre
                        </Button>
                      </div>
                      
                      {detailsDrawer.membres?.filter(m => 
                        m.type_membre === 'Centre de Santé' || m.type_membre === 'Etablissement'
                      ).length > 0 ? (
                        <Table
                          dataSource={detailsDrawer.membres.filter(m => 
                            m.type_membre === 'Centre de Santé' || m.type_membre === 'Etablissement'
                          )}
                          columns={[
                            {
                              title: 'Centre',
                              dataIndex: 'nom_complet',
                              key: 'nom_complet',
                              render: (text, record) => (
                                <div>
                                  <Text strong>{text}</Text>
                                  {record.infos_supplementaires && (
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                      {record.infos_supplementaires}
                                    </div>
                                  )}
                                </div>
                              )
                            },
                            {
                              title: 'Adhésion',
                              dataIndex: 'date_adhesion',
                              key: 'date_adhesion',
                              width: 120,
                              render: (date) => date ? moment(date).format('DD/MM/YY') : '-'
                            },
                            {
                              title: 'Statut',
                              dataIndex: 'statut',
                              key: 'statut',
                              width: 100,
                              render: (statut) => {
                                const statusConfig = getStatusConfig(statut);
                                return (
                                  <Tag color={statusConfig.color}>
                                    {statusConfig.label}
                                  </Tag>
                                );
                              }
                            },
                            {
                              title: 'Actions',
                              key: 'actions',
                              width: 150,
                              render: (_, record) => {
                                // VÉRIFICATION ROBUSTE DE L'ID DU CENTRE
                                const centreId = record.cod_cen || record.centre_id || record.id;
                                const centreName = record.nom_complet || record.nom_etablissement || 'Centre sans nom';
                                
                                // Vérifier si c'est bien un centre de santé
                                const isCentre = record.type_membre === 'Centre de Santé' || 
                                                record.type_membre === 'Etablissement';
                                
                                // Vérifier si l'ID est valide
                                const hasValidId = centreId && centreId !== 'undefined' && 
                                                  centreId !== 'null' && centreId !== '';
                                
                                return (
                                  <Space size="small">
                                    {isCentre && (
                                      <Tooltip 
                                        title={hasValidId ? "Voir prestataires" : "ID centre non disponible"}
                                      >
                                        <Button
                                          size="small"
                                          icon={<TeamOutlined />}
                                          onClick={() => {
                                            if (hasValidId) {
                                              openCenterProvidersModal(
                                                centreId, 
                                                centreName
                                              );
                                            } else {
                                              message.warning('ID du centre non disponible');
                                              console.error('ID centre manquant dans:', record);
                                            }
                                          }}
                                          disabled={!hasValidId}
                                        >
                                          Prestataires
                                        </Button>
                                      </Tooltip>
                                    )}
                                    <Tooltip title="Retirer">
                                      <Popconfirm
                                        title="Retirer ce centre du réseau ?"
                                        onConfirm={() => handleRemoveMember(record.id)}
                                        okText="Oui"
                                        cancelText="Non"
                                      >
                                        <Button
                                          size="small"
                                          danger
                                          icon={<MinusCircleOutlined />}
                                        />
                                      </Popconfirm>
                                    </Tooltip>
                                  </Space>
                                );
                              }
                            }
                          ]}
                          pagination={false}
                          size="small"
                        />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                          <Typography.Text type="secondary">
                            Aucun centre de santé dans ce réseau
                          </Typography.Text>
                          <br />
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={openAddMemberModal}
                            style={{ marginTop: '16px' }}
                          >
                            Ajouter le premier centre
                          </Button>
                        </div>
                      )}
                    </div>
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
              ]} />
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

      {/* Modal Ajouter Membre */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UsergroupAddOutlined style={{ marginRight: '8px' }} />
            <span>Ajouter un Centre au Réseau</span>
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
      >
        <Alert
          message="Information"
          description="Sélectionnez un centre de santé à ajouter au réseau"
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
            name="centerId"
            label="Centre de Santé"
            rules={[{ required: true, message: 'Veuillez sélectionner un centre de santé' }]}
          >
            <Select
              showSearch
              placeholder="Rechercher ou sélectionner un centre..."
              optionFilterProp="children"
              onSearch={handleSearchCenters}
              loading={loading.centres}
              filterOption={(input, option) => {
                if (!option || !option.children) return false;
                const label = String(option.children).toLowerCase();
                return label.includes(input.toLowerCase());
              }}
              style={{ width: '100%' }}
            >
              {centres.map(centre => (
                <Option key={centre.id} value={centre.id}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong>{centre.name}</Text>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {centre.code} • {centre.type} • {centre.region}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

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

      {/* Modal Prestataires d'un centre */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TeamOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            <span>
              Prestataires du centre: <Text strong>{centerProvidersModal.centre?.nom || 'Centre inconnu'}</Text>
            </span>
          </div>
        }
        open={centerProvidersModal.visible}
        onCancel={() => setCenterProvidersModal({ visible: false, centre: null, prestataires: [], loading: false })}
        width={900}
        footer={[
          <Button 
            key="close" 
            onClick={() => setCenterProvidersModal({ visible: false, centre: null, prestataires: [], loading: false })}
          >
            Fermer
          </Button>
        ]}
        destroyOnClose
      >
        {centerProvidersModal.loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '20px' }}>Chargement des prestataires...</div>
          </div>
        ) : centerProvidersModal.prestataires.length > 0 ? (
          <>
            <Alert
              message="Information"
              description="Cette liste montre tous les prestataires affectés à ce centre de santé."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <Table
              dataSource={centerProvidersModal.prestataires}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
              columns={[
                {
                  title: 'Prestataire',
                  dataIndex: 'nom_complet',
                  key: 'nom_complet',
                  width: 200,
                  render: (text, record) => (
                    <div>
                      <Text strong>{text}</Text>
                      {record.titre && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {record.titre}
                        </div>
                      )}
                    </div>
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
                  width: 150,
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
                  title: 'Statut',
                  key: 'reseau_status',
                  width: 120,
                  render: (_, record) => (
                    record.deja_membre ? (
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        Membre
                      </Tag>
                    ) : (
                      <Tag color="default" icon={<UserOutlined />}>
                        Non membre
                      </Tag>
                    )
                  )
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  width: 100,
                  render: (_, record) => (
                    record.deja_membre ? (
                      <Tooltip title="Déjà membre du réseau">
                        <Button
                          size="small"
                          disabled
                          icon={<CheckOutlined />}
                          style={{ cursor: 'not-allowed' }}
                        >
                          Déjà membre
                        </Button>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Ajouter au réseau">
                        <Button
                          type="primary"
                          size="small"
                          icon={<UsergroupAddOutlined />}
                          onClick={() => handleAddProviderFromModal(record)}
                          loading={loading.membres}
                        >
                          Ajouter
                        </Button>
                      </Tooltip>
                    )
                  )
                }
              ]}
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Typography.Text type="secondary">
              Aucun prestataire trouvé pour ce centre de santé
            </Typography.Text>
            <br />
            <Button
              type="primary"
              onClick={() => loadPrestatairesByCentre(centerProvidersModal.centre?.id, centerProvidersModal.centre?.nom)}
              loading={centerProvidersModal.loading}
              style={{ marginTop: '16px' }}
            >
              Réessayer
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NetworkPage;