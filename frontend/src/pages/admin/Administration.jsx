import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Tag,
  Space,
  Avatar,
  Tabs,
  Alert,
  Descriptions,
  Badge,
  Tooltip,
  message,
  Divider,
  Spin,
  Typography,
  InputNumber,
  Collapse,
  Radio,
  Upload,
  Drawer,
  List,
  Tree,
  Checkbox,
  TimePicker,
  Slider,
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  SecurityScanOutlined,
  HistoryOutlined,
  SettingOutlined,
  LogoutOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  LockOutlined,
  ProfileOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  BankOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  GlobalOutlined,
  TranslationOutlined,
  DatabaseOutlined,
  ApiOutlined,
  CloudServerOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  ControlOutlined,
  ToolOutlined,
  FileSyncOutlined,
  ExportOutlined,
  ImportOutlined,
  SaveOutlined,
  FileProtectOutlined,
  AuditOutlined,
  NotificationOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/fr';
import { adminAPI } from '../../services/api';

const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Text } = Typography;
const { Panel } = Collapse;

const AdminPage = () => {
  // États principaux
  const [loading, setLoading] = useState({
    dashboard: false,
    utilisateurs: false,
    roles: false,
    sessions: false,
    biometrie: false,
    systeme: false,
    profil: false,
    configurations: false,
    parametres: false,
    logs: false,
    backup: false,
    audit: false,
    tableData: false,
  });
  
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initialLoad, setInitialLoad] = useState(false);

  // Données du dashboard
  const [statistiques, setStatistiques] = useState({
    utilisateurs: { total: 0, actifs: 0, super_admin: 0 },
    roles: { total: 0 },
    sessions: { actives: 0 },
  });
  
  const [dashboardData, setDashboardData] = useState({
    derniers_utilisateurs: [],
    sessions_actives: [],
  });

  // Données utilisateurs
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [usersSearchParams, setUsersSearchParams] = useState({});

  // Données rôles
  const [roles, setRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [roleTemplates, setRoleTemplates] = useState([]);

  // Données sessions
  const [sessions, setSessions] = useState([]);
  const [sessionsPagination, setSessionsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Données système
  const [etatSysteme, setEtatSysteme] = useState({
    base_donnees: { connectee: false, version: '', nom: '', heure_serveur: '' },
    performances: { connexions_actives: 0 },
    securite: { parametres: { total_parametres: 0, pays_configures: 0 } },
    dernieres_erreurs: [],
  });
  
  const [testConnexionResult, setTestConnexionResult] = useState(null);

  // Données profil
  const [profile, setProfile] = useState(null);

  // Données configurations
  const [configurations, setConfigurations] = useState({
    general: [],
    securite: [],
    email: [],
    reseau: [],
    backup: [],
    interface: [],
    comptabilite: [],
    medical: [],
  });
  
  const [parametres, setParametres] = useState([]);
  const [parametresSearch, setParametresSearch] = useState('');
  const [selectedParametre, setSelectedParametre] = useState(null);
  const [parametreDrawerVisible, setParametreDrawerVisible] = useState(false);

  // Données logs
  const [logs, setLogs] = useState([]);
  const [logsPagination, setLogsPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Données backup
  const [backups, setBackups] = useState([]);
  const [backupStatus, setBackupStatus] = useState(null);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);

  // Données audit
  const [auditTrails, setAuditTrails] = useState([]);
  const [auditPagination, setAuditPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Modales
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [passwordResetModal, setPasswordResetModal] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState(null);
  const [importModalVisible, setImportModalVisible] = useState(false);

  // Formulaires
  const [userForm] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [passwordResetForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [parametreForm] = Form.useForm();
  const [importForm] = Form.useForm();

  // ==================== CHARGEMENT DES DONNÉES ====================

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const userFromStorage = localStorage.getItem('user');
      let user = userFromStorage ? JSON.parse(userFromStorage) : {};
      
      const currentUserData = {
        id: user.id || user.ID_UTI,
        username: user.username || user.LOG_UTI,
        nom: user.nom || user.NOM_UTI,
        prenom: user.prenom || user.PRE_UTI,
        email: user.email || user.EMAIL_UTI,
        role: user.role || user.PROFIL_UTI,
        pays: user.pays || user.NOM_PAYS,
        cod_pay: user.cod_pay || user.COD_PAY || 'CMF',
        super_admin: user.super_admin || user.SUPER_ADMIN || false,
        langue: user.langue || user.LANGUE_UTI || 'fr',
        theme: user.theme || user.THEME_UTI || 'light',
        photo: user.photo || user.PHOTO_UTI,
        nom_complet: `${user.prenom || user.PRE_UTI || ''} ${user.nom || user.NOM_UTI || ''}`.trim(),
      };
      
      setCurrentUser(currentUserData);
      
      // Charger les données initiales
      await Promise.all([
        loadDashboardData(),
        loadAvailableRoles(),
        loadConfigurations(),
      ]);
      
      setInitialLoad(true);
    } catch (error) {
      console.error('Erreur lors du chargement initial:', error);
      message.error('Erreur lors du chargement des données initiales');
    }
  };

  const loadDashboardData = async () => {
    if (activeTab !== 'dashboard') return;
    
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      const [statsResponse, dashboardResponse] = await Promise.all([
        adminAPI.getStatistiques(),
        adminAPI.getDashboard(),
      ]);
      
      if (statsResponse.success) {
        setStatistiques(statsResponse.statistiques || {
          utilisateurs: { total: 0, actifs: 0, super_admin: 0 },
          roles: { total: 0 },
          sessions: { actives: 0 },
        });
      }
      
      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.dashboard || {
          derniers_utilisateurs: [],
          sessions_actives: [],
        });
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      message.error('Erreur lors du chargement des données du dashboard');
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  };

  const loadUtilisateurs = useCallback(async (params = {}) => {
    if (activeTab !== 'utilisateurs') return;
    
    setLoading(prev => ({ ...prev, utilisateurs: true }));
    try {
      const searchParams = { ...usersSearchParams, ...params };
      
      // Si l'utilisateur n'est pas super admin, filtrer par son pays
      if (currentUser && !currentUser.super_admin) {
        searchParams.cod_pay = currentUser.cod_pay;
      }
      
      const response = await adminAPI.getUtilisateurs({
        page: usersPagination.current,
        limit: usersPagination.pageSize,
        ...searchParams,
      });
      
      if (response.success) {
        setUsers(response.utilisateurs || []);
        setUsersPagination({
          current: response.pagination?.page || 1,
          pageSize: response.pagination?.limit || 10,
          total: response.pagination?.total || 0,
        });
      } else {
        message.error(response.message || 'Erreur lors du chargement des utilisateurs');
        setUsers([]);
      }
    } catch (error) {
      message.error('Erreur lors du chargement des utilisateurs');
      console.error(error);
      setUsers([]);
    } finally {
      setLoading(prev => ({ ...prev, utilisateurs: false }));
    }
  }, [activeTab, usersPagination, usersSearchParams, currentUser]);

  const loadAvailableRoles = async () => {
    try {
      const response = await adminAPI.getRolesDisponibles();
      if (response.success) {
        setAvailableRoles(response.roles || []);
      }
    } catch (error) {
      console.error('Erreur chargement rôles disponibles:', error);
    }
  };

  const loadRoles = async () => {
    if (activeTab !== 'roles') return;
    
    setLoading(prev => ({ ...prev, roles: true }));
    try {
      const response = await adminAPI.getRoles();
      if (response.success) {
        setRoles(response.roles || []);
      } else {
        message.error(response.message || 'Erreur lors du chargement des rôles');
        setRoles([]);
      }
    } catch (error) {
      message.error('Erreur lors du chargement des rôles');
      console.error(error);
      setRoles([]);
    } finally {
      setLoading(prev => ({ ...prev, roles: false }));
    }
  };

  const loadRoleTemplates = async () => {
    try {
      const response = await adminAPI.getRoleTemplates();
      if (response.success) {
        setRoleTemplates(response.templates || []);
      }
    } catch (error) {
      console.error('Erreur chargement templates rôles:', error);
    }
  };

  const loadSessions = async () => {
    if (activeTab !== 'sessions') return;
    
    setLoading(prev => ({ ...prev, sessions: true }));
    try {
      const response = await adminAPI.getSessions({
        page: sessionsPagination.current,
        limit: sessionsPagination.pageSize,
      });
      
      if (response.success) {
        setSessions(response.sessions || []);
        setSessionsPagination({
          current: response.pagination?.page || 1,
          pageSize: response.pagination?.limit || 10,
          total: response.pagination?.total || 0,
        });
      } else {
        message.error(response.message || 'Erreur lors du chargement des sessions');
        setSessions([]);
      }
    } catch (error) {
      message.error('Erreur lors du chargement des sessions');
      console.error(error);
      setSessions([]);
    } finally {
      setLoading(prev => ({ ...prev, sessions: false }));
    }
  };

  const loadEtatSysteme = async () => {
    if (activeTab !== 'systeme') return;
    
    setLoading(prev => ({ ...prev, systeme: true }));
    try {
      const response = await adminAPI.getEtatSysteme();
      if (response.success) {
        setEtatSysteme(response.etat || {
          base_donnees: { connectee: false, version: '', nom: '', heure_serveur: '' },
          performances: { connexions_actives: 0 },
          securite: { parametres: { total_parametres: 0, pays_configures: 0 } },
          dernieres_erreurs: [],
        });
      } else {
        message.error(response.message || 'Erreur lors du chargement de l\'état du système');
      }
    } catch (error) {
      message.error('Erreur lors du chargement de l\'état du système');
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, systeme: false }));
    }
  };

  const loadProfile = async () => {
    if (activeTab !== 'mon-profil') return;
    
    setLoading(prev => ({ ...prev, profil: true }));
    try {
      const response = await adminAPI.getMyProfile();
      if (response.success) {
        const profileData = response.profile;
        setProfile(profileData);
        profileForm.setFieldsValue({
          NOM_UTI: profileData.nom,
          PRE_UTI: profileData.prenom,
          EMAIL_UTI: profileData.email,
          TEL_UTI: profileData.telephone,
          TEL_MOBILE_UTI: profileData.mobile,
          LANGUE_UTI: profileData.langue,
          THEME_UTI: profileData.theme,
        });
      } else {
        message.error(response.message || 'Erreur lors du chargement du profil');
      }
    } catch (error) {
      message.error('Erreur lors du chargement du profil');
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, profil: false }));
    }
  };

  const loadConfigurations = async () => {
    try {
      const response = await adminAPI.getConfigurations();
      if (response.success) {
        setConfigurations(response.configurations || {
          general: [],
          securite: [],
          email: [],
          reseau: [],
          backup: [],
          interface: [],
          comptabilite: [],
          medical: [],
        });
      }
    } catch (error) {
      console.error('Erreur chargement configurations:', error);
    }
  };

  const loadParametres = async () => {
    if (activeTab !== 'configurations') return;
    
    setLoading(prev => ({ ...prev, parametres: true }));
    try {
      const response = await adminAPI.getParametres({
        search: parametresSearch,
      });
      
      if (response.success) {
        setParametres(response.parametres || []);
      } else {
        message.error(response.message || 'Erreur lors du chargement des paramètres');
        setParametres([]);
      }
    } catch (error) {
      message.error('Erreur lors du chargement des paramètres');
      console.error(error);
      setParametres([]);
    } finally {
      setLoading(prev => ({ ...prev, parametres: false }));
    }
  };

  const loadLogs = async () => {
    if (activeTab !== 'configurations') return;
    
    setLoading(prev => ({ ...prev, logs: true }));
    try {
      const response = await adminAPI.getLogs({
        page: logsPagination.current,
        limit: logsPagination.pageSize,
      });
      
      if (response.success) {
        setLogs(response.logs || []);
        setLogsPagination({
          current: response.pagination?.page || 1,
          pageSize: response.pagination?.limit || 20,
          total: response.pagination?.total || 0,
        });
      } else {
        message.error(response.message || 'Erreur lors du chargement des logs');
        setLogs([]);
      }
    } catch (error) {
      message.error('Erreur lors du chargement des logs');
      console.error(error);
      setLogs([]);
    } finally {
      setLoading(prev => ({ ...prev, logs: false }));
    }
  };

  const loadBackups = async () => {
    if (activeTab !== 'configurations') return;
    
    try {
      const response = await adminAPI.getBackups();
      if (response.success) {
        setBackups(response.backups || []);
        setBackupStatus(response.status);
      }
    } catch (error) {
      console.error('Erreur chargement backups:', error);
      setBackups([]);
    }
  };

  const loadAuditTrails = async () => {
    if (activeTab !== 'configurations') return;
    
    setLoading(prev => ({ ...prev, audit: true }));
    try {
      const response = await adminAPI.getAuditTrails({
        page: auditPagination.current,
        limit: auditPagination.pageSize,
      });
      
      if (response.success) {
        setAuditTrails(response.audit || []);
        setAuditPagination({
          current: response.pagination?.page || 1,
          pageSize: response.pagination?.limit || 20,
          total: response.pagination?.total || 0,
        });
      } else {
        message.error(response.message || 'Erreur lors du chargement des audits');
        setAuditTrails([]);
      }
    } catch (error) {
      message.error('Erreur lors du chargement des audits');
      console.error(error);
      setAuditTrails([]);
    } finally {
      setLoading(prev => ({ ...prev, audit: false }));
    }
  };

  // Charger les données selon l'onglet actif
  useEffect(() => {
    if (!initialLoad) return;
    
    const loaders = {
      dashboard: loadDashboardData,
      utilisateurs: loadUtilisateurs,
      roles: () => {
        loadRoles();
        loadRoleTemplates();
      },
      sessions: loadSessions,
      systeme: loadEtatSysteme,
      'mon-profil': loadProfile,
      configurations: () => {
        loadParametres();
        loadLogs();
        loadBackups();
        loadAuditTrails();
      },
    };
    
    if (loaders[activeTab]) {
      loaders[activeTab]();
    }
  }, [activeTab, initialLoad]);

  // ==================== GESTION DES UTILISATEURS ====================

  const showCreateUserModal = () => {
    setSelectedUser(null);
    userForm.resetFields();
    
    let defaultCOD_PAY = 'CMF';
    if (currentUser && !currentUser.super_admin) {
      defaultCOD_PAY = currentUser.cod_pay || 'CMF';
    }
    
    userForm.setFieldsValue({
      COD_PAY: defaultCOD_PAY,
      SEX_UTI: 'M',
      PROFIL_UTI: 'Utilisateur',
      ACTIF: true,
      SUPER_ADMIN: false,
      LANGUE_UTI: 'fr',
      TIMEZONE_UTI: 'Africa/Douala',
      DATE_FORMAT: 'DD/MM/YYYY',
      THEME_UTI: 'light',
      roleIds: [],
    });
    setUserModalVisible(true);
  };

  const showEditUserModal = async (user) => {
    setSelectedUser(user);
    try {
      const response = await adminAPI.getUtilisateur(user.id);
      if (response.success) {
        const userData = response.utilisateur;
        userForm.setFieldsValue({
          LOG_UTI: userData.login || userData.LOG_UTI,
          NOM_UTI: userData.nom || userData.NOM_UTI,
          PRE_UTI: userData.prenom || userData.PRE_UTI,
          EMAIL_UTI: userData.email || userData.EMAIL_UTI,
          SEX_UTI: userData.sexe || userData.SEX_UTI,
          PROFIL_UTI: userData.profil || userData.PROFIL_UTI,
          COD_PAY: userData.cod_pay || userData.COD_PAY,
          TEL_UTI: userData.telephone || userData.TEL_UTI,
          TEL_MOBILE_UTI: userData.mobile || userData.TEL_MOBILE_UTI,
          LANGUE_UTI: userData.langue || userData.LANGUE_UTI,
          THEME_UTI: userData.theme || userData.THEME_UTI,
          ACTIF: userData.actif || userData.ACTIF,
          SUPER_ADMIN: userData.super_admin || userData.SUPER_ADMIN,
          roleIds: userData.role_ids || [],
        });
        setUserModalVisible(true);
      } else {
        message.error('Erreur lors du chargement des données de l\'utilisateur');
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
      message.error('Erreur lors du chargement des données de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (id) => {
    Modal.confirm({
      title: 'Confirmer la désactivation',
      content: 'Êtes-vous sûr de vouloir désactiver cet utilisateur ?',
      onOk: async () => {
        try {
          const response = await adminAPI.deleteUtilisateur(id);
          if (response.success) {
            message.success('Utilisateur désactivé avec succès');
            loadUtilisateurs();
          } else {
            message.error(response.message || 'Erreur lors de la désactivation');
          }
        } catch (error) {
          console.error('Erreur désactivation:', error);
          message.error('Erreur lors de la désactivation');
        }
      },
    });
  };

  const showResetPasswordModal = (user) => {
    setUserToResetPassword(user);
    setPasswordResetModal(true);
  };

  const handleResetPassword = async () => {
    try {
      const newPassword = adminAPI.generateRandomPassword();
      
      const response = await adminAPI.resetUtilisateurPassword(userToResetPassword.id, {
        newPassword: newPassword,
        confirmPassword: newPassword,
      });
      
      if (response.success) {
        Modal.info({
          title: 'Mot de passe réinitialisé',
          content: (
            <div>
              <p>Le mot de passe a été réinitialisé avec succès pour:</p>
              <p><strong>{userToResetPassword.nom_complet}</strong></p>
              <Alert
                message="Nouveau mot de passe"
                description={
                  <div>
                    <p><strong>{newPassword}</strong></p>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>
                      Notez ce mot de passe car il ne sera plus affiché.
                    </p>
                  </div>
                }
                type="warning"
                showIcon
              />
            </div>
          ),
          onOk: () => {
            setPasswordResetModal(false);
          },
        });
      } else {
        message.error(response.message || 'Erreur lors de la réinitialisation');
      }
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      message.error('Erreur lors de la réinitialisation');
    }
  };

  const handleUserSubmit = async (values) => {
    try {
      let userData = {
        ...values,
        roles: values.roleIds || [],
      };

      // Hacher le mot de passe si fourni
      if (values.mot_de_passe) {
        try {
          const hashedPassword = await adminAPI.hashPasswordSHA256(values.mot_de_passe);
          userData.PWD_UTI = hashedPassword;
        } catch (hashError) {
          console.error('Erreur hachage mot de passe:', hashError);
          // Fallback: utiliser un mot de passe aléatoire
          const randomPassword = adminAPI.generateRandomPassword();
          userData.mot_de_passe = randomPassword;
        }
      }

      if (currentUser && !currentUser.super_admin) {
        userData.COD_PAY = currentUser.cod_pay || 'CMF';
      }

      if (selectedUser) {
        // Mise à jour
        const response = await adminAPI.updateUtilisateur(selectedUser.id, userData);
        if (response.success) {
          message.success('Utilisateur mis à jour avec succès');
          setUserModalVisible(false);
          loadUtilisateurs();
        } else {
          throw new Error(response.message);
        }
      } else {
        // Création
        const response = await adminAPI.createUtilisateur(userData);
        if (response.success) {
          if (response.generatedPassword) {
            Modal.info({
              title: 'Utilisateur créé avec succès',
              content: (
                <div>
                  <p>L'utilisateur a été créé avec succès.</p>
                  <Alert
                    message="Informations de connexion"
                    description={
                      <div>
                        <p>Login: <strong>{values.LOG_UTI}</strong></p>
                        <p>Mot de passe: <strong>{response.generatedPassword}</strong></p>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>
                          Notez ces informations car elles ne seront plus affichées.
                        </p>
                      </div>
                    }
                    type="warning"
                    showIcon
                  />
                </div>
              ),
              onOk: () => {
                setUserModalVisible(false);
                loadUtilisateurs();
              },
            });
          } else {
            message.success('Utilisateur créé avec succès');
            setUserModalVisible(false);
            loadUtilisateurs();
          }
        } else {
          throw new Error(response.message);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('login existe déjà')) {
        errorMessage = 'Ce nom d\'utilisateur est déjà utilisé';
      } else if (error.message.includes('email existe déjà')) {
        errorMessage = 'Cette adresse email est déjà utilisée';
      } else if (error.message.includes('403')) {
        errorMessage = 'Vous n\'avez pas les autorisations nécessaires';
      } else if (error.message.includes('pays')) {
        errorMessage = 'Vous ne pouvez créer des utilisateurs que pour votre pays';
      }
      
      message.error(errorMessage);
    }
  };

  // ==================== GESTION DES RÔLES ====================

  const showCreateRoleModal = () => {
    setSelectedRole(null);
    roleForm.resetFields();
    roleForm.setFieldsValue({
      ACTIF: true,
      templateRoleId: null,
    });
    setRoleModalVisible(true);
  };

  const showEditRoleModal = (role) => {
    setSelectedRole(role);
    roleForm.setFieldsValue({
      LIB_ROL: role.nom,
      DESCRIPTION: role.description,
      ACTIF: role.actif,
    });
    setRoleModalVisible(true);
  };

  const handleDeleteRole = async (id) => {
    Modal.confirm({
      title: 'Confirmer la suppression',
      content: 'Êtes-vous sûr de vouloir supprimer ce rôle ?',
      onOk: async () => {
        try {
          const response = await adminAPI.deleteRole(id);
          if (response.success) {
            message.success('Rôle supprimé avec succès');
            loadRoles();
          } else {
            message.error(response.message || 'Erreur lors de la suppression');
          }
        } catch (error) {
          console.error('Erreur suppression:', error);
          message.error('Erreur lors de la suppression');
        }
      },
    });
  };

  const handleRoleSubmit = async (values) => {
    try {
      if (selectedRole) {
        const response = await adminAPI.updateRole(selectedRole.id, values);
        if (response.success) {
          message.success('Rôle mis à jour avec succès');
          setRoleModalVisible(false);
          loadRoles();
        } else {
          throw new Error(response.message);
        }
      } else {
        const response = await adminAPI.createRole(values);
        if (response.success) {
          message.success(
            `Rôle créé avec succès. ${response.role.options_assignees} options assignées.`
          );
          setRoleModalVisible(false);
          loadRoles();
        } else {
          throw new Error(response.message);
        }
      }
    } catch (error) {
      console.error('Erreur soumission rôle:', error);
      message.error(error.message || 'Erreur lors de l\'enregistrement');
    }
  };

  // ==================== GESTION DES PARAMÈTRES ====================

  const showParametreDrawer = (parametre) => {
    setSelectedParametre(parametre);
    parametreForm.setFieldsValue({
      LIB_PAR: parametre.LIB_PAR,
      VAL_PAR: parametre.VAL_PAR,
      TYP_PAR: parametre.TYP_PAR,
      COD_PAY: parametre.COD_PAY,
      DESCRIPTION: parametre.DESCRIPTION || '',
    });
    setParametreDrawerVisible(true);
  };

  const handleParametreSubmit = async (values) => {
    try {
      if (selectedParametre) {
        const response = await adminAPI.updateParametre(selectedParametre.COD_PAR, values);
        if (response.success) {
          message.success('Paramètre mis à jour avec succès');
          setParametreDrawerVisible(false);
          loadParametres();
        } else {
          throw new Error(response.message);
        }
      } else {
        const response = await adminAPI.createParametre(values);
        if (response.success) {
          message.success('Paramètre créé avec succès');
          setParametreDrawerVisible(false);
          loadParametres();
        } else {
          throw new Error(response.message);
        }
      }
    } catch (error) {
      console.error('Erreur soumission paramètre:', error);
      message.error(error.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteParametre = async (id) => {
    Modal.confirm({
      title: 'Confirmer la suppression',
      content: 'Êtes-vous sûr de vouloir supprimer ce paramètre ?',
      onOk: async () => {
        try {
          const response = await adminAPI.deleteParametre(id);
          if (response.success) {
            message.success('Paramètre supprimé avec succès');
            loadParametres();
          } else {
            message.error(response.message || 'Erreur lors de la suppression');
          }
        } catch (error) {
          console.error('Erreur suppression paramètre:', error);
          message.error('Erreur lors de la suppression');
        }
      },
    });
  };

  // ==================== GESTION DES SESSIONS ====================

  const handleTerminateSession = async (id) => {
    Modal.confirm({
      title: 'Terminer la session',
      content: 'Êtes-vous sûr de vouloir terminer cette session ?',
      onOk: async () => {
        try {
          const response = await adminAPI.terminerSession(id);
          if (response.success) {
            message.success('Session terminée avec succès');
            loadSessions();
          } else {
            message.error(response.message || 'Erreur lors de la terminaison');
          }
        } catch (error) {
          console.error('Erreur terminaison session:', error);
          message.error('Erreur lors de la terminaison');
        }
      },
    });
  };

  // ==================== GESTION PROFIL ====================

  const handleProfileSubmit = async (values) => {
    try {
      const response = await adminAPI.updateMyProfile(values);
      if (response.success) {
        message.success('Profil mis à jour avec succès');
        loadProfile();
      } else {
        message.error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      message.error('Erreur lors de la mise à jour');
    }
  };

  // ==================== GESTION BACKUP ====================

  const handleCreateBackup = async () => {
    try {
      const response = await adminAPI.createBackup();
      if (response.success) {
        message.success('Backup créé avec succès');
        loadBackups();
      } else {
        message.error(response.message || 'Erreur lors de la création du backup');
      }
    } catch (error) {
      console.error('Erreur création backup:', error);
      message.error('Erreur lors de la création du backup');
    }
  };

  const handleRestoreBackup = async (backupId) => {
    Modal.confirm({
      title: 'Restaurer le backup',
      content: 'Êtes-vous sûr de vouloir restaurer ce backup ? Cette action est irréversible.',
      onOk: async () => {
        try {
          const response = await adminAPI.restoreBackup(backupId);
          if (response.success) {
            message.success('Backup restauré avec succès');
            loadBackups();
          } else {
            message.error(response.message || 'Erreur lors de la restauration');
          }
        } catch (error) {
          console.error('Erreur restauration:', error);
          message.error('Erreur lors de la restauration');
        }
      },
    });
  };

  // ==================== TEST CONNEXION ====================

  const testConnexion = async () => {
    try {
      const result = await adminAPI.testConnexion();
      setTestConnexionResult(result);
      if (result.success) {
        message.success('Test de connexion réussi');
      } else {
        message.error('Test de connexion échoué');
      }
    } catch (error) {
      console.error('Erreur test connexion:', error);
      message.error('Erreur lors du test de connexion');
    }
  };

  // ==================== COLONNES DES TABLES ====================

  const userColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Utilisateur',
      dataIndex: 'nom_complet',
      key: 'nom_complet',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="small" 
            icon={<UserOutlined />} 
            src={record.photo}
            style={{ backgroundColor: record.actif ? '#52c41a' : '#f5222d' }}
          />
          <div style={{ marginLeft: 8 }}>
            <div><strong>{text}</strong></div>
            <div style={{ fontSize: 12, color: '#666' }}>{record.login}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <MailOutlined style={{ marginRight: 4, color: '#666' }} />
          {email || '-'}
        </div>
      ),
    },
    {
      title: 'Profil',
      dataIndex: 'profil',
      key: 'profil',
      render: (profil) => <Tag color="blue">{profil}</Tag>,
    },
    {
      title: 'Statut',
      dataIndex: 'actif',
      key: 'actif',
      render: (actif, record) => (
        <Space direction="vertical" size="small">
          <Tag color={actif ? 'green' : 'red'}>
            {actif ? 'Actif' : 'Inactif'}
          </Tag>
          {record.super_admin && (
            <Tag color="gold">Super Admin</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Date création',
      dataIndex: 'date_creation',
      key: 'date_creation',
      render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm') : '-',
      sorter: (a, b) => moment(a.date_creation).unix() - moment(b.date_creation).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Tooltip title="Modifier">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => showEditUserModal(record)}
            />
          </Tooltip>
          <Tooltip title="Réinitialiser MDP">
            <Button
              type="link"
              icon={<LockOutlined />}
              onClick={() => showResetPasswordModal(record)}
            />
          </Tooltip>
          <Tooltip title="Désactiver">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteUser(record.id)}
              disabled={record.id === currentUser?.id}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const roleColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Nom du rôle',
      dataIndex: 'nom',
      key: 'nom',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-',
    },
    {
      title: 'Statut',
      dataIndex: 'actif',
      key: 'actif',
      render: (actif) => (
        <Tag color={actif ? 'green' : 'red'}>
          {actif ? 'Actif' : 'Inactif'}
        </Tag>
      ),
    },
    {
      title: 'Utilisateurs',
      dataIndex: 'nombre_utilisateurs',
      key: 'nombre_utilisateurs',
      render: (count) => <Badge count={count || 0} showZero />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showEditRoleModal(record)}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRole(record.id)}
          />
        </Space>
      ),
    },
  ];

  const sessionColumns = [
    {
      title: 'ID Session',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Utilisateur',
      dataIndex: 'utilisateur',
      key: 'utilisateur',
      render: (user) => {
        if (!user) return 'Inconnu';
        return typeof user === 'object' ? user.nom_complet || user.LOG_UTI : user;
      },
    },
    {
      title: 'Adresse IP',
      dataIndex: 'adresse_ip',
      key: 'adresse_ip',
      render: (ip) => ip || '-',
    },
    {
      title: 'Début',
      dataIndex: 'date_debut',
      key: 'date_debut',
      render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm:ss') : '-',
    },
    {
      title: 'Fin',
      dataIndex: 'date_fin',
      key: 'date_fin',
      render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm:ss') : '-',
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (statut) => {
        const color = statut === 'ACTIVE' ? 'green' : 'red';
        return <Tag color={color}>{statut || 'INACTIVE'}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          danger
          onClick={() => handleTerminateSession(record.id)}
          disabled={record.statut !== 'ACTIVE'}
        >
          Terminer
        </Button>
      ),
    },
  ];

  const parametreColumns = [
    {
      title: 'ID',
      dataIndex: 'COD_PAR',
      key: 'COD_PAR',
      width: 80,
    },
    {
      title: 'Libellé',
      dataIndex: 'LIB_PAR',
      key: 'LIB_PAR',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Valeur',
      dataIndex: 'VAL_PAR',
      key: 'VAL_PAR',
      render: (value, record) => {
        if (record.TYP_PAR === 'BOOLEAN') {
          return <Switch checked={value === 'true' || value === '1'} disabled />;
        } else if (record.TYP_PAR === 'NUMBER') {
          return <Tag color="blue">{value}</Tag>;
        } else if (record.TYP_PAR === 'JSON') {
          return <Tag color="purple">JSON Object</Tag>;
        }
        return <Text ellipsis style={{ maxWidth: 200 }}>{value}</Text>;
      },
    },
    {
      title: 'Type',
      dataIndex: 'TYP_PAR',
      key: 'TYP_PAR',
      render: (type) => <Tag color="cyan">{type}</Tag>,
    },
    {
      title: 'Pays',
      dataIndex: 'COD_PAY',
      key: 'COD_PAY',
      render: (pays) => pays || <Tag color="default">Global</Tag>,
    },
    {
      title: 'Date modification',
      dataIndex: 'DAT_MODUTIL',
      key: 'DAT_MODUTIL',
      render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showParametreDrawer(record)}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteParametre(record.COD_PAR)}
          />
        </Space>
      ),
    },
  ];

  const logColumns = [
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm:ss') : '-',
      sorter: (a, b) => moment(a.timestamp).unix() - moment(b.timestamp).unix(),
    },
    {
      title: 'Niveau',
      dataIndex: 'level',
      key: 'level',
      render: (level) => {
        const colors = {
          ERROR: 'red',
          WARN: 'orange',
          INFO: 'blue',
          DEBUG: 'gray',
        };
        return <Tag color={colors[level] || 'default'}>{level}</Tag>;
      },
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (text) => text || '-',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (text) => <Text ellipsis style={{ maxWidth: 300 }}>{text || '-'}</Text>,
    },
    {
      title: 'Utilisateur',
      dataIndex: 'username',
      key: 'username',
      render: (text) => text || '-',
    },
  ];

  const auditColumns = [
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm:ss') : '-',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action) => {
        const colors = {
          CREATE: 'green',
          UPDATE: 'blue',
          DELETE: 'red',
          LOGIN: 'cyan',
          LOGOUT: 'gray',
        };
        return <Tag color={colors[action] || 'default'}>{action}</Tag>;
      },
    },
    {
      title: 'Table',
      dataIndex: 'table_name',
      key: 'table_name',
      render: (text) => text || '-',
    },
    {
      title: 'Utilisateur',
      dataIndex: 'username',
      key: 'username',
      render: (text) => text || '-',
    },
    {
      title: 'IP',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (text) => text || '-',
    },
    {
      title: 'Détails',
      dataIndex: 'details',
      key: 'details',
      render: (details) => (
        <Tooltip title={JSON.stringify(details, null, 2)}>
          <Button type="link" icon={<EyeOutlined />} size="small">
            Voir
          </Button>
        </Tooltip>
      ),
    },
  ];

  const backupColumns = [
  {
    title: 'Nom',
    dataIndex: 'name',
    key: 'name',
    render: (name) => <strong>{name}</strong>,
  },
  {
    title: 'Date création',
    dataIndex: 'created_at',
    key: 'created_at',
    render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm:ss') : '-',
  },
  {
    title: 'Taille',
    dataIndex: 'size',
    key: 'size',
    render: (size) => {
      if (!size) return '-';
      // Si size est en bytes, convertir en MB
      const sizeMB = size / (1024 * 1024);
      return `${sizeMB.toFixed(2)} MB`;
    },
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    render: (type) => {
      const colors = {
        'FULL': 'blue',
        'DIFF': 'green',
        'LOG': 'orange',
        'INCREMENTAL': 'cyan'
      };
      return <Tag color={colors[type] || 'default'}>{type || 'INCONNU'}</Tag>;
    },
  },
  {
    title: 'Statut',
    dataIndex: 'status',
    key: 'status',
    render: (status) => {
      const colors = {
        'SUCCES': 'green',
        'EN_COURS': 'orange',
        'ECHEC': 'red',
        'RESTAURATION_EN_COURS': 'cyan',
        'RESTAURE': 'blue',
        'UNKNOWN': 'gray'
      };
      const labels = {
        'SUCCES': 'Terminé',
        'EN_COURS': 'En cours',
        'ECHEC': 'Échec',
        'RESTAURATION_EN_COURS': 'Restauration en cours',
        'RESTAURE': 'Restauré',
        'UNKNOWN': 'Inconnu'
      };
      return <Tag color={colors[status] || 'default'}>{labels[status] || status || 'Inconnu'}</Tag>;
    },
  },
  {
    title: 'Créé par',
    dataIndex: 'created_by',
    key: 'created_by',
    render: (createdBy) => createdBy || '-',
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_, record) => (
      <Space>
        <Button
          type="link"
          icon={<CloudDownloadOutlined />}
          onClick={() => adminAPI.downloadBackup(record.id)}
          disabled={record.status !== 'SUCCES'}
        >
          Télécharger
        </Button>
        <Button
          type="link"
          danger
          icon={<RollbackOutlined />}
          onClick={() => handleRestoreBackup(record.id)}
          disabled={record.status !== 'SUCCES'}
        >
          Restaurer
        </Button>
      </Space>
    ),
  },
];

  // ==================== RENDU DES ONGLETS ====================

  const renderDashboardTab = () => (
    <Card>
      {loading.dashboard ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Utilisateurs"
                  value={statistiques?.utilisateurs?.total || 0}
                  prefix={<UserOutlined />}
                  suffix={
                    <Tooltip title="Utilisateurs actifs">
                      <span style={{ color: '#52c41a', fontSize: 14 }}>
                        ({statistiques?.utilisateurs?.actifs || 0})
                      </span>
                    </Tooltip>
                  }
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Rôles"
                  value={statistiques?.roles?.total || 0}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Sessions actives"
                  value={statistiques?.sessions?.actives || 0}
                  prefix={<SecurityScanOutlined />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Super Admins"
                  value={statistiques?.utilisateurs?.super_admin || 0}
                  prefix={<SettingOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <Card 
                title="Derniers utilisateurs"
                extra={
                  <Button 
                    type="link" 
                    onClick={loadDashboardData}
                    icon={<ReloadOutlined />}
                  />
                }
                size="small"
              >
                {dashboardData?.derniers_utilisateurs?.length > 0 ? (
                  dashboardData.derniers_utilisateurs.map(user => (
                    <div key={user.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar size="small" icon={<UserOutlined />} src={user.photo} />
                        <div style={{ marginLeft: 8 }}>
                          <div><strong>{user.nom_complet}</strong></div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            {user.email}
                          </div>
                        </div>
                        <Tag 
                          color={user.actif ? 'green' : 'red'} 
                          style={{ marginLeft: 'auto' }}
                        >
                          {user.actif ? 'Actif' : 'Inactif'}
                        </Tag>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <UserOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />
                    <p style={{ color: '#bfbfbf', marginTop: 8 }}>Aucun utilisateur</p>
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Système" size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Base de données">
                    {etatSysteme?.base_donnees?.connectee ? (
                      <Tag color="green">Connectée</Tag>
                    ) : (
                      <Tag color="red">Non connectée</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Dernière vérification">
                    {etatSysteme?.dernier_verification ? 
                      moment(etatSysteme.dernier_verification).format('DD/MM/YYYY HH:mm') : 
                      moment().format('DD/MM/YYYY HH:mm')}
                  </Descriptions.Item>
                </Descriptions>
                <Button 
                  type="primary" 
                  icon={<SyncOutlined />} 
                  onClick={testConnexion}
                  block
                  style={{ marginTop: 16 }}
                >
                  Tester la connexion
                </Button>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Card>
  );

  const renderUtilisateursTab = () => (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Input
              placeholder="Rechercher par nom, email ou login"
              prefix={<SearchOutlined />}
              onChange={(e) => {
                setUsersSearchParams({ ...usersSearchParams, search: e.target.value });
              }}
              allowClear
              onPressEnter={() => loadUtilisateurs()}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Filtrer par profil"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => {
                setUsersSearchParams({ ...usersSearchParams, profil: value });
                loadUtilisateurs({ profil: value });
              }}
            >
              {(adminAPI.getProfilsDisponibles() || []).map(profil => (
                <Option key={profil.value} value={profil.value}>
                  {profil.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateUserModal}
            >
              Nouvel utilisateur
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        columns={userColumns}
        dataSource={users}
        rowKey="id"
        loading={loading.utilisateurs}
        pagination={{
          ...usersPagination,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} utilisateurs`,
        }}
        onChange={(pagination) => {
          setUsersPagination(pagination);
          loadUtilisateurs({ page: pagination.current, limit: pagination.pageSize });
        }}
      />
    </Card>
  );

  const renderRolesTab = () => (
    <Card
      title="Gestion des rôles"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showCreateRoleModal}
        >
          Nouveau rôle
        </Button>
      }
    >
      <Table
        columns={roleColumns}
        dataSource={roles}
        rowKey="id"
        loading={loading.roles}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );

  const renderSessionsTab = () => (
    <Card
      title="Gestion des sessions"
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={loadSessions}
        >
          Actualiser
        </Button>
      }
    >
      <Table
        columns={sessionColumns}
        dataSource={sessions}
        rowKey="id"
        loading={loading.sessions}
        pagination={{
          ...sessionsPagination,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} sessions`,
        }}
        onChange={(pagination) => {
          setSessionsPagination(pagination);
          loadSessions({ page: pagination.current, limit: pagination.pageSize });
        }}
      />
    </Card>
  );

  const renderSystemeTab = () => (
    <Card
      title="État du système"
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={loadEtatSysteme}
        >
          Actualiser
        </Button>
      }
    >
      {loading.systeme ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Tabs>
          <TabPane tab="Base de données" key="db">
            {etatSysteme?.base_donnees && (
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Connectée" span={2}>
                  <Tag color={etatSysteme.base_donnees.connectee ? 'green' : 'red'}>
                    {etatSysteme.base_donnees.connectee ? 'OUI' : 'NON'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Version">
                  {etatSysteme.base_donnees.version || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Nom">
                  {etatSysteme.base_donnees.nom || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Heure serveur">
                  {etatSysteme.base_donnees.heure_serveur || '-'}
                </Descriptions.Item>
              </Descriptions>
            )}
          </TabPane>

          <TabPane tab="Performances" key="performance">
            {etatSysteme?.performances && (
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Connexions actives">
                  {etatSysteme.performances.connexions_actives || 0}
                </Descriptions.Item>
              </Descriptions>
            )}
          </TabPane>

          <TabPane tab="Sécurité" key="security">
            {etatSysteme?.securite?.parametres && (
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Paramètres configurés">
                  {etatSysteme.securite.parametres.total_parametres || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Pays configurés">
                  {etatSysteme.securite.parametres.pays_configures || 0}
                </Descriptions.Item>
              </Descriptions>
            )}
          </TabPane>

          <TabPane tab="Dernières erreurs" key="errors">
            {etatSysteme?.dernieres_erreurs?.length > 0 ? (
              etatSysteme.dernieres_erreurs.map((erreur, index) => (
                <Alert
                  key={index}
                  message={erreur.message}
                  description={erreur.details}
                  type="error"
                  showIcon
                  style={{ marginBottom: 8 }}
                />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <p style={{ color: '#52c41a', marginTop: 8 }}>Aucune erreur récente</p>
              </div>
            )}
          </TabPane>
        </Tabs>
      )}

      {testConnexionResult && (
        <Alert
          style={{ marginTop: 16 }}
          message={testConnexionResult.message}
          type={testConnexionResult.success ? 'success' : 'error'}
          showIcon
        />
      )}
    </Card>
  );

  const renderConfigurationsTab = () => (
    <Card>
      <Tabs defaultActiveKey="parametres">
        <TabPane tab="Paramètres système" key="parametres">
          <div style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={16}>
                <Input
                  placeholder="Rechercher un paramètre..."
                  prefix={<SearchOutlined />}
                  value={parametresSearch}
                  onChange={(e) => setParametresSearch(e.target.value)}
                  allowClear
                  onPressEnter={() => loadParametres()}
                />
              </Col>
              <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                <Space>
                  <Button
                    icon={<ImportOutlined />}
                    onClick={() => setImportModalVisible(true)}
                  >
                    Importer
                  </Button>
                  <Button
                    icon={<ExportOutlined />}
                    onClick={async () => {
                      try {
                        const response = await adminAPI.exportParametres();
                        if (response.success && response.data) {
                          const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `parametres_${moment().format('YYYYMMDD_HHmmss')}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                          message.success('Paramètres exportés avec succès');
                        } else {
                          message.error(response.message || 'Erreur lors de l\'exportation');
                        }
                      } catch (error) {
                        message.error('Erreur lors de l\'exportation');
                      }
                    }}
                  >
                    Exporter
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => showParametreDrawer({})}
                  >
                    Nouveau paramètre
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          <Table
            columns={parametreColumns}
            dataSource={parametres}
            rowKey="COD_PAR"
            loading={loading.parametres}
            pagination={{ pageSize: 20 }}
          />
        </TabPane>

        <TabPane tab="Journaux d'activité" key="logs">
          <Card
            title="Journaux système"
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={loadLogs}
              >
                Actualiser
              </Button>
            }
          >
            <Table
              columns={logColumns}
              dataSource={logs}
              rowKey="id"
              loading={loading.logs}
              pagination={{
                ...logsPagination,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} logs`,
              }}
              onChange={(pagination) => {
                setLogsPagination(pagination);
                loadLogs({ page: pagination.current, limit: pagination.pageSize });
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Backup & Restauration" key="backup">
          <Card
            title="Gestion des sauvegardes"
            extra={
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleCreateBackup}
              >
                Nouveau backup
              </Button>
            }
          >
            {backupStatus && (
              <Alert
                message={`Dernier backup: ${moment(backupStatus.last_backup).format('DD/MM/YYYY HH:mm')}`}
                description={`Espace utilisé: ${backupStatus.used_space} / ${backupStatus.total_space}`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Table
              columns={backupColumns}
              dataSource={backups}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Audit" key="audit">
          <Card
            title="Traces d'audit"
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={loadAuditTrails}
              >
                Actualiser
              </Button>
            }
          >
            <Table
              columns={auditColumns}
              dataSource={auditTrails}
              rowKey="id"
              loading={loading.audit}
              pagination={{
                ...auditPagination,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} traces`,
              }}
              onChange={(pagination) => {
                setAuditPagination(pagination);
                loadAuditTrails({ page: pagination.current, limit: pagination.pageSize });
              }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </Card>
  );

  const renderProfilTab = () => (
    <Card>
      {loading.profil ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card title="Informations personnelles" size="small">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Avatar
                  size={80}
                  icon={<UserOutlined />}
                  src={profile?.photo}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <h3 style={{ marginTop: 16, marginBottom: 4 }}>{profile?.nom_complet}</h3>
                <Tag color="blue">{profile?.profil}</Tag>
                {currentUser?.super_admin && (
                  <Tag color="gold" style={{ marginLeft: 8 }}>Super Admin</Tag>
                )}
              </div>

              <Descriptions column={1} size="small">
                <Descriptions.Item label="Login" style={{ paddingBottom: 8 }}>
                  <Text strong>{profile?.login}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Email" style={{ paddingBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <MailOutlined style={{ marginRight: 8, color: '#666' }} />
                    {profile?.email || '-'}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Téléphone" style={{ paddingBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <PhoneOutlined style={{ marginRight: 8, color: '#666' }} />
                    {profile?.telephone || '-'}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Mobile" style={{ paddingBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <PhoneOutlined style={{ marginRight: 8, color: '#666' }} />
                    {profile?.mobile || '-'}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} md={16}>
            <Card
              title="Modifier le profil"
              size="small"
            >
              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleProfileSubmit}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="NOM_UTI"
                      label="Nom"
                      rules={[{ required: true, message: 'Le nom est obligatoire' }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="PRE_UTI"
                      label="Prénom"
                      rules={[{ required: true, message: 'Le prénom est obligatoire' }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="EMAIL_UTI"
                      label="Email"
                      rules={[
                        { required: true, message: 'L\'email est obligatoire' },
                        { type: 'email', message: 'Format d\'email invalide' }
                      ]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="TEL_UTI"
                      label="Téléphone"
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="LANGUE_UTI"
                      label="Langue"
                    >
                      <Select>
                        {(adminAPI.getLanguesDisponibles() || []).map(langue => (
                          <Option key={langue.value} value={langue.value}>
                            <TranslationOutlined style={{ marginRight: 8 }} />
                            {langue.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="THEME_UTI"
                      label="Thème"
                    >
                      <Select>
                        {(adminAPI.getThemesDisponibles() || []).map(theme => (
                          <Option key={theme.value} value={theme.value}>
                            {theme.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Enregistrer les modifications
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      )}
    </Card>
  );

  // ==================== RENDU PRINCIPAL ====================

  return (
    <div style={{ padding: '20px' }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SettingOutlined style={{ marginRight: 8 }} />
            <span>Administration</span>
          </div>
        }
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge dot={true} color="#52c41a">
              <Avatar 
                size="small"
                icon={<UserOutlined />} 
                src={currentUser?.photo}
                style={{ cursor: 'pointer' }}
              />
            </Badge>
            <span style={{ fontSize: 14 }}>{currentUser?.nom_complet || 'Administrateur'}</span>
            <Button
              type="link"
              danger
              icon={<LogoutOutlined />}
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
            />
          </div>
        }
      >
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'dashboard',
              label: (
                <span>
                  <DashboardOutlined />
                  Tableau de bord
                </span>
              ),
              children: renderDashboardTab(),
            },
            {
              key: 'utilisateurs',
              label: (
                <span>
                  <UserOutlined />
                  Utilisateurs
                </span>
              ),
              children: renderUtilisateursTab(),
            },
            {
              key: 'roles',
              label: (
                <span>
                  <TeamOutlined />
                  Rôles
                </span>
              ),
              children: renderRolesTab(),
            },
            {
              key: 'sessions',
              label: (
                <span>
                  <SecurityScanOutlined />
                  Sessions
                </span>
              ),
              children: renderSessionsTab(),
            },
            {
              key: 'configurations',
              label: (
                <span>
                  <ControlOutlined />
                  Configurations
                </span>
              ),
              children: renderConfigurationsTab(),
            },
            {
              key: 'systeme',
              label: (
                <span>
                  <CloudServerOutlined />
                  État du système
                </span>
              ),
              children: renderSystemeTab(),
            },
            {
              key: 'mon-profil',
              label: (
                <span>
                  <ProfileOutlined />
                  Mon profil
                </span>
              ),
              children: renderProfilTab(),
            },
          ]}
        />
      </Card>

      {/* Modal Utilisateur */}
      <Modal
        title={selectedUser ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
        open={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        width={800}
        footer={null}
        destroyOnClose
      >
        <Form
          form={userForm}
          layout="vertical"
          onFinish={handleUserSubmit}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                name="LOG_UTI"
                label="Login"
                rules={[{ required: true, message: 'Le login est requis' }]}
              >
                <Input placeholder="Entrez le login" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="EMAIL_UTI"
                label="Email"
                rules={[
                  { required: true, message: 'L\'email est requis' },
                  { type: 'email', message: 'Format d\'email invalide' }
                ]}
              >
                <Input placeholder="exemple@email.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                name="NOM_UTI"
                label="Nom"
                rules={[{ required: true, message: 'Le nom est requis' }]}
              >
                <Input placeholder="Entrez le nom" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="PRE_UTI"
                label="Prénom"
                rules={[{ required: true, message: 'Le prénom est requis' }]}
              >
                <Input placeholder="Entrez le prénom" />
              </Form.Item>
            </Col>
          </Row>

          {!selectedUser && (
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="mot_de_passe"
                  label="Mot de passe"
                  rules={[
                    { required: true, message: 'Le mot de passe est requis' },
                    { min: 8, message: 'Le mot de passe doit contenir au moins 8 caractères' },
                    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
                      message: 'Doit contenir majuscule, minuscule, chiffre et caractère spécial' }
                  ]}
                >
                  <Input.Password placeholder="Entrez le mot de passe" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirm_password"
                  label="Confirmer le mot de passe"
                  dependencies={['mot_de_passe']}
                  rules={[
                    { required: true, message: 'Veuillez confirmer le mot de passe' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('mot_de_passe') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Les mots de passe ne correspondent pas'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirmez le mot de passe" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Form.Item name="SEX_UTI" label="Sexe">
                <Select placeholder="Sélectionnez le sexe">
                  {(adminAPI.getSexesDisponibles() || []).map(sexe => (
                    <Option key={sexe.value} value={sexe.value}>
                      {sexe.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="PROFIL_UTI" label="Profil">
                <Select placeholder="Sélectionnez le profil">
                  {(adminAPI.getProfilsDisponibles() || []).map(profil => (
                    <Option key={profil.value} value={profil.value}>
                      {profil.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="COD_PAY" label="Pays">
                <Select 
                  placeholder="Sélectionnez le pays"
                  disabled={currentUser && !currentUser.super_admin}
                >
                  {(adminAPI.getPaysDisponibles() || []).map(pays => (
                    <Option key={pays.value} value={pays.value}>
                      <BankOutlined style={{ marginRight: 8 }} />
                      {pays.label}
                    </Option>
                  ))}
                </Select>
                {currentUser && !currentUser.super_admin && (
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    Vous ne pouvez créer que des utilisateurs pour votre pays ({currentUser.cod_pay})
                  </div>
                )}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item name="roleIds" label="Rôles">
                <Select
                  mode="multiple"
                  placeholder="Sélectionnez les rôles"
                  options={availableRoles.map(role => ({
                    label: role.label,
                    value: role.id,
                    description: role.description,
                  }))}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item name="ACTIF" label="Actif" valuePropName="checked">
                    <Switch checkedChildren="Actif" unCheckedChildren="Inactif" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="SUPER_ADMIN" label="Super Admin" valuePropName="checked">
                    <Switch checkedChildren="Oui" unCheckedChildren="Non" />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Form.Item name="TEL_UTI" label="Téléphone">
                <Input placeholder="Téléphone" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="LANGUE_UTI" label="Langue">
                <Select placeholder="Sélectionnez la langue">
                  {(adminAPI.getLanguesDisponibles() || []).map(langue => (
                    <Option key={langue.value} value={langue.value}>
                      {langue.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="THEME_UTI" label="Thème">
                <Select placeholder="Sélectionnez le thème">
                  {(adminAPI.getThemesDisponibles() || []).map(theme => (
                    <Option key={theme.value} value={theme.value}>
                      {theme.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right' }}>
            <Button style={{ marginRight: 8 }} onClick={() => setUserModalVisible(false)}>
              Annuler
            </Button>
            <Button type="primary" htmlType="submit">
              {selectedUser ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Rôle */}
      <Modal
        title={selectedRole ? 'Modifier le rôle' : 'Créer un nouveau rôle'}
        open={roleModalVisible}
        onCancel={() => setRoleModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={roleForm}
          layout="vertical"
          onFinish={handleRoleSubmit}
        >
          <Form.Item
            name="LIB_ROL"
            label="Nom du rôle"
            rules={[{ required: true, message: 'Le nom du rôle est requis' }]}
          >
            <Input placeholder="Entrez le nom du rôle" />
          </Form.Item>

          <Form.Item
            name="DESCRIPTION"
            label="Description"
            rules={[{ required: true, message: 'La description est requise' }]}
          >
            <TextArea rows={3} placeholder="Description du rôle..." />
          </Form.Item>

          {!selectedRole && (
            <Form.Item
              name="templateRoleId"
              label="Copier les permissions depuis"
              help="Optionnel: Sélectionnez un rôle existant pour copier ses permissions"
            >
              <Select
                placeholder="Sélectionnez un rôle template"
                allowClear
              >
                <Option value={null}>Aucun (permissions par défaut)</Option>
                {roleTemplates.map(template => (
                  <Option key={template.id} value={template.id}>
                    {template.nom} ({template.options_count} permissions)
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="ACTIF"
            label="Actif"
            valuePropName="checked"
          >
            <Switch checkedChildren="Actif" unCheckedChildren="Inactif" />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Button style={{ marginRight: 8 }} onClick={() => setRoleModalVisible(false)}>
              Annuler
            </Button>
            <Button type="primary" htmlType="submit">
              {selectedRole ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Réinitialisation mot de passe */}
      <Modal
        title="Réinitialiser le mot de passe"
        open={passwordResetModal}
        onCancel={() => setPasswordResetModal(false)}
        footer={null}
      >
        <Form
          form={passwordResetForm}
          layout="vertical"
          onFinish={handleResetPassword}
        >
          {userToResetPassword && (
            <Alert
              message={`Voulez-vous réinitialiser le mot de passe de ${userToResetPassword.nom_complet} ?`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <div style={{ textAlign: 'right' }}>
            <Button style={{ marginRight: 8 }} onClick={() => setPasswordResetModal(false)}>
              Annuler
            </Button>
            <Button type="primary" htmlType="submit">
              Réinitialiser
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Drawer Paramètre */}
      <Drawer
        title={selectedParametre?.COD_PAR ? 'Modifier le paramètre' : 'Créer un nouveau paramètre'}
        width={500}
        open={parametreDrawerVisible}
        onClose={() => setParametreDrawerVisible(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button style={{ marginRight: 8 }} onClick={() => setParametreDrawerVisible(false)}>
              Annuler
            </Button>
            <Button type="primary" onClick={() => parametreForm.submit()}>
              {selectedParametre?.COD_PAR ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        }
      >
        <Form
          form={parametreForm}
          layout="vertical"
          onFinish={handleParametreSubmit}
        >
          <Form.Item
            name="LIB_PAR"
            label="Libellé"
            rules={[{ required: true, message: 'Le libellé est requis' }]}
          >
            <Input placeholder="Nom du paramètre" />
          </Form.Item>

          <Form.Item
            name="VAL_PAR"
            label="Valeur"
            rules={[{ required: true, message: 'La valeur est requise' }]}
          >
            <Input placeholder="Valeur du paramètre" />
          </Form.Item>

          <Form.Item
            name="TYP_PAR"
            label="Type"
            rules={[{ required: true, message: 'Le type est requis' }]}
          >
            <Select placeholder="Sélectionnez le type">
              <Option value="STRING">Texte</Option>
              <Option value="NUMBER">Nombre</Option>
              <Option value="BOOLEAN">Booléen</Option>
              <Option value="JSON">JSON</Option>
              <Option value="DATE">Date</Option>
              <Option value="SELECT">Liste de choix</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="COD_PAY"
            label="Pays"
          >
            <Select 
              placeholder="Pays (laisser vide pour global)"
              allowClear
            >
              {(adminAPI.getPaysDisponibles() || []).map(pays => (
                <Option key={pays.value} value={pays.value}>
                  {pays.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="DESCRIPTION"
            label="Description"
          >
            <TextArea rows={3} placeholder="Description du paramètre..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default AdminPage;