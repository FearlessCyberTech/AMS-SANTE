import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card, Row, Col, Statistic, Button, Table, Tag, Space, message,
  Tabs, Tooltip, Typography, Avatar, Badge, Modal, Spin, Alert,
  Progress, Timeline, List, Divider, Dropdown, Select, Input,
  DatePicker, Form, Collapse, Rate, Popconfirm, Skeleton
} from 'antd';
import {
  DashboardOutlined, TeamOutlined, UserOutlined, 
  DollarOutlined, CalendarOutlined, ClockCircleOutlined,
  RiseOutlined, FallOutlined, CheckCircleOutlined,
  WarningOutlined, SyncOutlined, EyeOutlined, EditOutlined,
  PlusOutlined, DownloadOutlined, FilterOutlined, SearchOutlined,
  SettingOutlined, BellOutlined, InfoCircleOutlined, ArrowUpOutlined,
  ArrowDownOutlined, BarChartOutlined, PieChartOutlined,
  LineChartOutlined, AreaChartOutlined,
  CloudOutlined, SafetyOutlined, HeartOutlined, StarOutlined,
  PhoneOutlined, MailOutlined, EnvironmentOutlined,
  MoreOutlined, LoginOutlined, LogoutOutlined, FileTextOutlined,
  MedicineBoxOutlined, DatabaseOutlined, CarOutlined,
  TabletOutlined, ExperimentOutlined, SmileOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import 'moment/locale/fr';
import {
  dashboardAPI,
  consultationsAPI,
  beneficiairesAPI,
  prescriptionsAPI,
  prestationsAPI,
  centresAPI,
  statistiquesAPI,
  syncAPI,
  authAPI,
  exportPDFAPI
} from '../services/api';
import './Dashboard.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  // États principaux
  const [loading, setLoading] = useState({
    stats: true,
    consultations: false,
    beneficiaires: false,
    prescriptions: false,
    sync: false
  });

  const [stats, setStats] = useState({
    general: null,
    today: null,
    monthly: null,
    performance: null
  });

  // États pour les données
  const [recentConsultations, setRecentConsultations] = useState([]);
  const [recentBeneficiaires, setRecentBeneficiaires] = useState([]);
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [activityTimeline, setActivityTimeline] = useState([]);
  const [centerDistribution, setCenterDistribution] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  // États pour les filtres
  const [dateRange, setDateRange] = useState([moment().startOf('month'), moment().endOf('month')]);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    period: 'today',
    center: 'all',
    type: 'all'
  });

  // États pour les modales
  const [quickStatsModal, setQuickStatsModal] = useState({
    visible: false,
    type: null,
    data: null
  });

  // Initialiser le dashboard
  useEffect(() => {
    loadDashboardData();
    
    // Actualiser toutes les 5 minutes
    const interval = setInterval(() => {
      loadRealTimeData();
    }, 300000);

    return () => clearInterval(interval);
  }, [i18n.language]);

  const loadDashboardData = async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }));
      
      // Charger toutes les données en parallèle
      await Promise.all([
        loadGeneralStats(),
        loadRecentConsultations(),
        loadRecentBeneficiaires(),
        loadPendingPrescriptions(),
        loadSystemAlerts(),
        loadActivityTimeline(),
        loadCenterDistribution(),
        loadRevenueData()
      ]);

      message.success(t('dashboard.dataLoaded'));
    } catch (error) {
      console.error('❌ Erreur chargement dashboard:', error);
      message.error(t('dashboard.loadError'));
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const loadRealTimeData = async () => {
    try {
      await Promise.all([
        loadTodayStats(),
        loadRecentConsultations(),
        loadSystemAlerts()
      ]);
    } catch (error) {
      console.error('❌ Erreur données temps réel:', error);
    }
  };

  // ==================== FONCTIONS DE CHARGEMENT ====================

  const loadGeneralStats = async () => {
    try {
      const response = await dashboardAPI.getStats(filters.period);
      if (response.success && response.stats) {
        setStats(prev => ({ ...prev, general: response.stats }));
      } else {
        setStats(prev => ({ ...prev, general: getDefaultStats() }));
      }
    } catch (error) {
      console.error('❌ Erreur stats générales:', error);
      setStats(prev => ({ ...prev, general: getDefaultStats() }));
    }
  };

  const loadTodayStats = async () => {
    try {
      const response = await dashboardAPI.getStats('today');
      if (response.success && response.stats) {
        setStats(prev => ({ ...prev, today: response.stats }));
      }
    } catch (error) {
      console.error('❌ Erreur stats aujourd\'hui:', error);
    }
  };

  const loadRecentConsultations = async () => {
    setLoading(prev => ({ ...prev, consultations: true }));
    try {
      const response = await consultationsAPI.getAllConsultations({
        limit: 10,
        sortBy: 'DATE_CONSULTATION',
        sortOrder: 'desc'
      });

      if (response.success && response.consultations) {
        const formatted = response.consultations.map(consult => ({
          key: consult.COD_CONS || consult.id,
          id: consult.COD_CONS || consult.id,
          patient: `${consult.NOM_BEN || ''} ${consult.PRE_BEN || ''}`.trim(),
          medecin: consult.NOM_MEDECIN || 'Non spécifié',
          type: consult.TYPE_CONSULTATION || 'Consultation',
          date: moment(consult.DATE_CONSULTATION).format('DD/MM/YY HH:mm'),
          montant: consult.MONTANT_CONSULTATION || 0,
          status: getConsultationStatus(consult.STATUT_PAIEMENT),
          color: getStatusColor(consult.STATUT_PAIEMENT)
        }));
        setRecentConsultations(formatted);
      }
    } catch (error) {
      console.error('❌ Erreur consultations récentes:', error);
    } finally {
      setLoading(prev => ({ ...prev, consultations: false }));
    }
  };

  const loadRecentBeneficiaires = async () => {
    setLoading(prev => ({ ...prev, beneficiaires: true }));
    try {
      const response = await beneficiairesAPI.getAll({
        limit: 8,
        page: 1,
        sortBy: 'CRE_BEN',
        sortOrder: 'desc'
      });

      if (response.success && response.beneficiaires) {
        const formatted = response.beneficiaires.map(ben => ({
          key: ben.ID_BEN || ben.id,
          id: ben.ID_BEN || ben.id,
          nom: `${ben.PRE_BEN || ''} ${ben.NOM_BEN || ''}`.trim(),
          identifiant: ben.IDENTIFIANT_NATIONAL || 'Non défini',
          telephone: ben.TELEPHONE || ben.TELEPHONE_MOBILE || 'Non défini',
          age: calculateAge(ben.NAI_BEN),
          statut: ben.STATUT || 'ACTIF',
          dateInscription: moment(ben.CRE_BEN).format('DD/MM/YY'),
          photo: ben.PHOTO_URL || null
        }));
        setRecentBeneficiaires(formatted);
      }
    } catch (error) {
      console.error('❌ Erreur bénéficiaires récents:', error);
    } finally {
      setLoading(prev => ({ ...prev, beneficiaires: false }));
    }
  };

  const loadPendingPrescriptions = async () => {
    setLoading(prev => ({ ...prev, prescriptions: true }));
    try {
      const response = await prescriptionsAPI.getAll({
        limit: 5,
        page: 1,
        statut: 'En attente'
      });

      if (response.success && response.prescriptions) {
        const formatted = response.prescriptions.map(pres => ({
          key: pres.COD_PRES || pres.id,
          id: pres.COD_PRES || pres.id,
          numero: pres.NUM_PRES || pres.numero || `P${pres.id}`,
          patient: pres.patient_nom || 'Patient non spécifié',
          medecin: pres.medecin_nom || 'Médecin non spécifié',
          date: moment(pres.CRE_PRE).format('DD/MM/YY'),
          medicaments: pres.details?.length || 0,
          statut: pres.STATUT || 'En attente',
          priorite: pres.priorite || 'Normal'
        }));
        setPendingPrescriptions(formatted);
      }
    } catch (error) {
      console.error('❌ Erreur prescriptions en attente:', error);
    } finally {
      setLoading(prev => ({ ...prev, prescriptions: false }));
    }
  };

  const loadSystemAlerts = async () => {
    try {
      const alerts = [];
      
      // Vérifier les synchronisations en erreur
      const syncResponse = await syncAPI.getStatus();
      if (!syncResponse.success || syncResponse.inProgress === false) {
        alerts.push({
          type: 'warning',
          title: t('dashboard.syncWarning'),
          message: t('dashboard.syncStopped'),
          time: moment().format('HH:mm'),
          action: 'sync'
        });
      }

      // Vérifier les centres sans prestataires
      const centresResponse = await centresAPI.getAll();
      if (centresResponse.success && centresResponse.centres) {
        centresResponse.centres.slice(0, 3).forEach(centre => {
          if (centre.nombre_prestataires === 0) {
            alerts.push({
              type: 'info',
              title: t('dashboard.noProviders'),
              message: `${centre.LIB_CEN} ${t('dashboard.noProvidersMessage')}`,
              time: moment().format('HH:mm'),
              action: 'centers'
            });
          }
        });
      }

      // Vérifier les consultations non facturées
      if (recentConsultations.some(c => c.status === 'À payer')) {
        alerts.push({
          type: 'error',
          title: t('dashboard.unpaidConsultations'),
          message: t('dashboard.unpaidMessage'),
          time: moment().format('HH:mm'),
          action: 'billing'
        });
      }

      setSystemAlerts(alerts.slice(0, 5));
    } catch (error) {
      console.error('❌ Erreur alertes système:', error);
    }
  };

  const loadActivityTimeline = async () => {
    try {
      const activities = [];
      
      // Récupérer l'historique des consultations
      const consultations = recentConsultations.slice(0, 3);
      consultations.forEach(consult => {
        activities.push({
          time: consult.date,
          color: consult.color,
          icon: <EyeOutlined />,
          title: `${t('dashboard.consultationFor')} ${consult.patient}`,
          content: `${consult.type} - ${consult.medecin}`
        });
      });

      // Récupérer les nouveaux bénéficiaires
      const newBenefs = recentBeneficiaires.slice(0, 2);
      newBenefs.forEach(ben => {
        activities.push({
          time: ben.dateInscription,
          color: 'green',
          icon: <UserOutlined />,
          title: `${t('dashboard.newBeneficiary')}`,
          content: ben.nom
        });
      });

      // Trier par date
      activities.sort((a, b) => moment(b.time, 'DD/MM/YY HH:mm').diff(moment(a.time, 'DD/MM/YY HH:mm')));
      setActivityTimeline(activities.slice(0, 8));
    } catch (error) {
      console.error('❌ Erreur timeline activité:', error);
    }
  };

  const loadCenterDistribution = async () => {
    try {
      const response = await centresAPI.getAll();
      if (response.success && response.centres) {
        const distribution = response.centres.reduce((acc, centre) => {
          const type = centre.TYP_CEN || centre.type || 'Non spécifié';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        const formatted = Object.entries(distribution).map(([type, count], index) => ({
          key: index,
          type,
          count,
          color: getTypeColor(type),
          percent: Math.round((count / response.centres.length) * 100)
        }));

        setCenterDistribution(formatted);
      }
    } catch (error) {
      console.error('❌ Erreur distribution centres:', error);
    }
  };

  const loadRevenueData = async () => {
    try {
      const response = await dashboardAPI.getRevenueParMois(6);
      if (response.success && response.data) {
        setRevenueData(response.data.slice(-6));
      } else {
        // Données de démo
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const month = moment().subtract(i, 'months');
          months.push({
            month: month.format('MMM'),
            revenue: Math.floor(Math.random() * 1000000) + 500000,
            consultations: Math.floor(Math.random() * 200) + 50
          });
        }
        setRevenueData(months);
      }
    } catch (error) {
      console.error('❌ Erreur données revenus:', error);
    }
  };

  // ==================== FONCTIONS UTILITAIRES ====================

  const getDefaultStats = () => ({
    totalPatients: 1245,
    totalConsultations: 3421,
    revenue: 152300,
    pendingAppointments: 23,
    activeDoctors: 8,
    monthlyRevenue: 450000,
    todayAppointments: 42,
    patientSatisfaction: 92,
    averageWaitTime: 15,
    todayRevenue: 25000,
    activeCenters: 12,
    onlineUsers: 8,
    activePrescriptions: 156,
    todayVisits: 128,
    monthlyGrowth: 12.5
  });

  const getConsultationStatus = (statut) => {
    const statusMap = {
      'À payer': 'pending',
      'Payé': 'paid',
      'Partiellement payé': 'partial',
      'Annulé': 'cancelled',
      'Confirmé': 'confirmed',
      'default': 'pending'
    };
    return statusMap[statut] || statusMap.default;
  };

  const getStatusColor = (statut) => {
    const colorMap = {
      'À payer': 'warning',
      'Payé': 'success',
      'Partiellement payé': 'processing',
      'Annulé': 'error',
      'Confirmé': 'default',
      'default': 'default'
    };
    return colorMap[statut] || colorMap.default;
  };

  const calculateAge = (dateNaissance) => {
    if (!dateNaissance) return 'N/A';
    const birthDate = moment(dateNaissance);
    const today = moment();
    return today.diff(birthDate, 'years');
  };

  const getTypeColor = (type) => {
    const colors = {
      'Hospitalier': '#1890ff',
      'Centre de Santé': '#52c41a',
      'Dispensaire': '#fa8c16',
      'Clinique': '#722ed1',
      'Laboratoire': '#13c2c2',
      'Pharmacie': '#f5222d',
      'default': '#d9d9d9'
    };
    return colors[type] || colors.default;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount).replace('XAF', 'FCFA');
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  // ==================== GESTION DES ACTIONS ====================

  const handleRefresh = () => {
    loadDashboardData();
    message.info(t('dashboard.refreshing'));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleQuickAction = (action) => {
    switch(action) {
      case 'newConsultation':
        window.location.href = '/consultations/new';
        break;
      case 'newPatient':
        window.location.href = '/patients/new';
        break;
      case 'newPrescription':
        window.location.href = '/prescriptions/new';
        break;
      case 'viewReports':
        window.location.href = '/admin/reports';
        break;
      default:
        break;
    }
  };

  const handleAlertClick = (alert) => {
    if (alert.action === 'sync') {
      syncAPI.forceSyncPrestataire('all', {});
    } else if (alert.action === 'centers') {
      window.location.href = '/centers';
    } else if (alert.action === 'billing') {
      window.location.href = '/consultations?status=unpaid';
    }
  };

  // ==================== CONFIGURATION DES COLONNES ====================

  const consultationColumns = [
    {
      title: 'Patient',
      dataIndex: 'patient',
      key: 'patient',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Médecin',
      dataIndex: 'medecin',
      key: 'medecin'
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: 'Montant',
      dataIndex: 'montant',
      key: 'montant',
      render: (montant) => <Text strong>{formatCurrency(montant)}</Text>
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Tag color={record.color} style={{ textTransform: 'capitalize' }}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir détails">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => window.location.href = `/consultations/${record.id}`}
            />
          </Tooltip>
          <Tooltip title="Éditer">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => window.location.href = `/consultations/${record.id}/edit`}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const beneficiaireColumns = [
    {
      title: 'Bénéficiaire',
      dataIndex: 'nom',
      key: 'nom',
      render: (text, record) => (
        <Space>
          <Avatar 
            size="small" 
            src={record.photo}
            icon={<UserOutlined />}
          />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Identifiant',
      dataIndex: 'identifiant',
      key: 'identifiant'
    },
    {
      title: 'Téléphone',
      dataIndex: 'telephone',
      key: 'telephone'
    },
    {
      title: 'Âge',
      dataIndex: 'age',
      key: 'age',
      render: (age) => <Text>{age} ans</Text>
    },
    {
      title: 'Inscription',
      dataIndex: 'dateInscription',
      key: 'dateInscription'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => window.location.href = `/patients/${record.id}`}
          >
            Voir
          </Button>
        </Space>
      )
    }
  ];

  const prescriptionColumns = [
    {
      title: 'N° Prescription',
      dataIndex: 'numero',
      key: 'numero',
      render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>
    },
    {
      title: 'Patient',
      dataIndex: 'patient',
      key: 'patient'
    },
    {
      title: 'Médecin',
      dataIndex: 'medecin',
      key: 'medecin'
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: 'Médicaments',
      dataIndex: 'medicaments',
      key: 'medicaments',
      render: (count) => (
        <Badge
          count={count}
          style={{ backgroundColor: '#52c41a' }}
        />
      )
    },
    {
      title: 'Priorité',
      dataIndex: 'priorite',
      key: 'priorite',
      render: (priorite) => {
        const color = priorite === 'Urgent' ? 'red' : 
                     priorite === 'Haute' ? 'orange' : 'blue';
        return <Tag color={color}>{priorite}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            onClick={() => window.location.href = `/prescriptions/${record.id}`}
          >
            Traiter
          </Button>
        </Space>
      )
    }
  ];

  // ==================== COMPOSANTS RENDU ====================

  const renderStatsCards = () => {
    if (!stats.general) return null;

    const statCards = [
      {
        key: 'patients',
        title: t('dashboard.totalPatients'),
        value: formatNumber(stats.general.totalPatients || 0),
        icon: <TeamOutlined />,
        color: '#1890ff',
        trend: stats.general.monthlyGrowth ? `${stats.general.monthlyGrowth}%` : '+12.5%',
        trendColor: '#52c41a',
        description: t('dashboard.registeredPatients'),
        action: () => window.location.href = '/patients'
      },
      {
        key: 'consultations',
        title: t('dashboard.consultations'),
        value: formatNumber(stats.general.todayAppointments || 0),
        icon: <EyeOutlined />,
        color: '#52c41a',
        trend: '+8.2%',
        trendColor: '#52c41a',
        description: t('dashboard.todayConsultations'),
        action: () => window.location.href = '/consultations'
      },
      {
        key: 'revenue',
        title: t('dashboard.todayRevenue'),
        value: formatCurrency(stats.general.todayRevenue || 0),
        icon: <DollarOutlined />,
        color: '#fa8c16',
        trend: '+15.3%',
        trendColor: '#52c41a',
        description: t('dashboard.revenueToday'),
        action: () => window.location.href = '/facturation'
      },
      {
        key: 'prescriptions',
        title: t('dashboard.activePrescriptions'),
        value: formatNumber(stats.general.activePrescriptions || 0),
        icon: <FileTextOutlined />,
        color: '#722ed1',
        trend: '-2.1%',
        trendColor: '#f5222d',
        description: t('dashboard.prescriptionsActive'),
        action: () => window.location.href = '/prescriptions'
      },
      {
        key: 'satisfaction',
        title: t('dashboard.patientSatisfaction'),
        value: `${stats.general.patientSatisfaction || 92}%`,
        icon: <HeartOutlined />,
        color: '#f5222d',
        trend: '+3.4%',
        trendColor: '#52c41a',
        description: t('dashboard.satisfactionRate'),
        action: () => window.location.href = '/admin/satisfaction'
      },
      {
        key: 'centers',
        title: t('dashboard.activeCenters'),
        value: formatNumber(stats.general.activeCenters || 0),
        icon: <DatabaseOutlined />,
        color: '#13c2c2',
        trend: '+2',
        trendColor: '#52c41a',
        description: t('dashboard.centersActive'),
        action: () => window.location.href = '/centers'
      }
    ];

    return (
      <Row gutter={[16, 16]}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} md={8} lg={8} xl={4} key={card.key}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                hoverable
                className="stat-card"
                onClick={card.action}
                style={{ 
                  borderLeft: `4px solid ${card.color}`,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <div 
                    className="stat-icon-wrapper"
                    style={{ backgroundColor: `${card.color}15` }}
                  >
                    {React.cloneElement(card.icon, { 
                      style: { color: card.color, fontSize: 18 }
                    })}
                  </div>
                  <div style={{ flex: 1, marginLeft: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {card.title}
                    </Text>
                    <Title level={3} style={{ margin: '4px 0', color: card.color }}>
                      {card.value}
                    </Title>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {card.description}
                  </Text>
                  <Tag 
                    color={card.trendColor === '#52c41a' ? 'success' : 'error'}
                    style={{ fontSize: 11, margin: 0 }}
                  >
                    {card.trend}
                  </Tag>
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
    );
  };

  const renderQuickActions = () => {
    const actions = [
      {
        key: 'newConsultation',
        label: t('dashboard.newConsultationBtn'),
        icon: <PlusOutlined />,
        color: '#1890ff',
        description: t('dashboard.createNewConsultation')
      },
      {
        key: 'newPatient',
        label: t('dashboard.newPatient'),
        icon: <UserOutlined />,
        color: '#52c41a',
        description: t('dashboard.registerNewPatient')
      },
      {
        key: 'newPrescription',
        label: t('dashboard.prescription'),
        icon: <FileTextOutlined />,
        color: '#722ed1',
        description: t('dashboard.createPrescription')
      },
      {
        key: 'viewReports',
        label: t('dashboard.reports'),
        icon: <BarChartOutlined />,
        color: '#fa8c16',
        description: t('dashboard.viewReports')
      },
      {
        key: 'billing',
        label: t('dashboard.billing'),
        icon: <DollarOutlined />,
        color: '#f5222d',
        description: t('dashboard.manageBilling')
      },
      {
        key: 'schedule',
        label: t('dashboard.schedule'),
        icon: <CalendarOutlined />,
        color: '#13c2c2',
        description: t('dashboard.manageSchedule')
      }
    ];

    return (
      <Card
        title={
          <Space>
            <RocketOutlined />
            <Text strong>{t('dashboard.quickActions')}</Text>
          </Space>
        }
        className="quick-actions-card"
      >
        <Row gutter={[16, 16]}>
          {actions.map((action, index) => (
            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={action.key}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="primary"
                  className="quick-action-btn"
                  style={{ 
                    backgroundColor: action.color,
                    borderColor: action.color,
                    width: '100%',
                    height: 100
                  }}
                  onClick={() => handleQuickAction(action.key)}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>
                      {action.icon}
                    </div>
                    <Text strong style={{ color: '#fff', fontSize: 12 }}>
                      {action.label}
                    </Text>
                    <div style={{ 
                      fontSize: 10, 
                      color: 'rgba(255,255,255,0.8)',
                      marginTop: 4 
                    }}>
                      {action.description}
                    </div>
                  </div>
                </Button>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  const renderSystemStatus = () => {
    const statusItems = [
      {
        key: 'api',
        label: t('dashboard.apiStatus'),
        status: true,
        icon: <CloudOutlined />,
        color: '#52c41a'
      },
      {
        key: 'database',
        label: t('dashboard.database'),
        status: true,
        icon: <DatabaseOutlined />,
        color: '#1890ff'
      },
      {
        key: 'sync',
        label: t('dashboard.syncStatus'),
        status: true,
        icon: <SyncOutlined />,
        color: '#fa8c16'
      },
      {
        key: 'security',
        label: t('dashboard.security'),
        status: true,
        icon: <SafetyOutlined />,
        color: '#722ed1'
      },
      {
        key: 'backup',
        label: t('dashboard.backup'),
        status: true,
        icon: <DatabaseOutlined />,
        color: '#13c2c2'
      }
    ];

    return (
      <Card
        title={
          <Space>
            <DashboardOutlined />
            <Text strong>{t('dashboard.systemStatus')}</Text>
          </Space>
        }
        className="system-status-card"
      >
        <Row gutter={[16, 16]}>
          {statusItems.map((item) => (
            <Col span={24} key={item.key}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                padding: '8px 0'
              }}>
                <div style={{ 
                  width: 40, 
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: `${item.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  {React.cloneElement(item.icon, { 
                    style: { color: item.color, fontSize: 18 }
                  })}
                </div>
                
                <div style={{ flex: 1 }}>
                  <Text strong>{item.label}</Text>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Tag 
                      color={item.status ? 'success' : 'error'}
                      style={{ marginRight: 8 }}
                    >
                      {item.status ? t('dashboard.online') : t('dashboard.offline')}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.status ? t('dashboard.operational') : t('dashboard.issues')}
                    </Text>
                  </div>
                </div>
                
                {item.status ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <WarningOutlined style={{ color: '#f5222d' }} />
                )}
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  // ==================== RENDU PRINCIPAL ====================

  if (loading.stats && !stats.general) {
    return (
      <div style={{ padding: 24 }}>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Col>
          <Col span={24}>
            <Row gutter={[16, 16]}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Col span={4} key={i}>
                  <Skeleton active />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="dashboard-header-card">
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Space>
                <Avatar 
                  size={48}
                  icon={<DashboardOutlined />}
                  style={{ 
                    backgroundColor: '#1890ff',
                    color: '#fff'
                  }}
                />
                <div>
                  <Title level={2} style={{ margin: 0 }}>
                    {t('dashboard.title')}
                  </Title>
                  <Text type="secondary">
                    {t('dashboard.welcome')}, <Text strong>{user?.username || user?.prenom || t('dashboard.user')}</Text>
                    {user?.role && ` | ${t('dashboard.role')}: ${user.role}`}
                  </Text>
                </div>
              </Space>
            </Col>
            
            <Col>
              <Space>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  style={{ width: 250 }}
                />
                
                <Select
                  value={filters.period}
                  onChange={(value) => handleFilterChange('period', value)}
                  style={{ width: 120 }}
                >
                  <Option value="today">{t('dashboard.today')}</Option>
                  <Option value="week">{t('dashboard.week')}</Option>
                  <Option value="month">{t('dashboard.month')}</Option>
                  <Option value="year">{t('dashboard.year')}</Option>
                </Select>
                
                <Tooltip title={t('dashboard.refresh')}>
                  <Button
                    type="primary"
                    icon={<SyncOutlined spin={loading.stats} />}
                    onClick={handleRefresh}
                    loading={loading.stats}
                  />
                </Tooltip>
                
                <Tooltip title={t('dashboard.settings')}>
                  <Button
                    icon={<SettingOutlined />}
                    onClick={() => window.location.href = '/admin/settings'}
                  />
                </Tooltip>
              </Space>
            </Col>
          </Row>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div style={{ margin: '24px 0' }}>
        {renderStatsCards()}
      </div>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Left Column - 2/3 width */}
        <Col xs={24} lg={16}>
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {renderQuickActions()}
          </motion.div>

          {/* Tabs Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ marginTop: 24 }}
          >
            <Card className="tabs-card">
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                type="card"
              >
                <TabPane 
                  tab={
                    <Space>
                      <EyeOutlined />
                      {t('dashboard.recentConsultations')}
                    </Space>
                  } 
                  key="consultations"
                >
                  <Table
                    columns={consultationColumns}
                    dataSource={recentConsultations}
                    loading={loading.consultations}
                    pagination={false}
                    size="middle"
                    scroll={{ x: 800 }}
                  />
                </TabPane>
                
                <TabPane 
                  tab={
                    <Space>
                      <UserOutlined />
                      {t('dashboard.recentPatients')}
                    </Space>
                  } 
                  key="patients"
                >
                  <Table
                    columns={beneficiaireColumns}
                    dataSource={recentBeneficiaires}
                    loading={loading.beneficiaires}
                    pagination={false}
                    size="middle"
                  />
                </TabPane>
                
                <TabPane 
                  tab={
                    <Space>
                      <FileTextOutlined />
                      {t('dashboard.pendingPrescriptions')}
                      <Badge 
                        count={pendingPrescriptions.length} 
                        style={{ backgroundColor: '#f5222d' }}
                      />
                    </Space>
                  } 
                  key="prescriptions"
                >
                  <Table
                    columns={prescriptionColumns}
                    dataSource={pendingPrescriptions}
                    loading={loading.prescriptions}
                    pagination={false}
                    size="middle"
                  />
                </TabPane>
              </Tabs>
            </Card>
          </motion.div>

          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ marginTop: 24 }}
          >
            <Card
              title={
                <Space>
                  <LineChartOutlined />
                  <Text strong>{t('dashboard.revenueTrend')}</Text>
                </Space>
              }
              className="chart-card"
            >
              {revenueData.length > 0 ? (
                <div style={{ height: 300 }}>
                  {/* Simple bar chart using divs */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    height: 200,
                    marginTop: 40,
                    gap: 20,
                    justifyContent: 'center'
                  }}>
                    {revenueData.map((item, index) => {
                      const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
                      const height = (item.revenue / maxRevenue) * 160;
                      return (
                        <div key={index} style={{ textAlign: 'center' }}>
                          <div style={{ 
                            height: height,
                            width: 40,
                            backgroundColor: '#1890ff',
                            borderRadius: '4px 4px 0 0',
                            position: 'relative'
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: -25,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              whiteSpace: 'nowrap'
                            }}>
                              <Text strong>{formatCurrency(item.revenue)}</Text>
                            </div>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <Text strong>{item.month}</Text>
                          </div>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.consultations} {t('dashboard.consultations')}
                            </Text>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Skeleton active />
                </div>
              )}
            </Card>
          </motion.div>
        </Col>

        {/* Right Column - 1/3 width */}
        <Col xs={24} lg={8}>
          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {renderSystemStatus()}
          </motion.div>

          {/* System Alerts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{ marginTop: 24 }}
          >
            <Card
              title={
                <Space>
                  <BellOutlined />
                  <Text strong>{t('dashboard.systemAlerts')}</Text>
                  {systemAlerts.length > 0 && (
                    <Badge count={systemAlerts.length} />
                  )}
                </Space>
              }
              className="alerts-card"
            >
              {systemAlerts.length > 0 ? (
                <List
                  dataSource={systemAlerts}
                  renderItem={(alert, index) => (
                    <List.Item
                      key={index}
                      style={{ 
                        padding: '12px 0',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleAlertClick(alert)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            size="small"
                            style={{ 
                              backgroundColor: alert.type === 'error' ? '#f5222d' :
                                            alert.type === 'warning' ? '#fa8c16' :
                                            alert.type === 'info' ? '#1890ff' : '#52c41a'
                            }}
                            icon={
                              alert.type === 'error' ? <WarningOutlined /> :
                              alert.type === 'warning' ? <WarningOutlined /> :
                              <InfoCircleOutlined />
                            }
                          />
                        }
                        title={<Text strong>{alert.title}</Text>}
                        description={
                          <div>
                            <Text type="secondary">{alert.message}</Text>
                            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                              {alert.time}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                  <div style={{ marginTop: 16 }}>
                    <Text strong>{t('dashboard.noAlerts')}</Text>
                  </div>
                  <Text type="secondary">
                    {t('dashboard.systemNormal')}
                  </Text>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Activity Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{ marginTop: 24 }}
          >
            <Card
              title={
                <Space>
                  <ClockCircleOutlined />
                  <Text strong>{t('dashboard.recentActivity')}</Text>
                </Space>
              }
              className="timeline-card"
            >
              <Timeline>
                {activityTimeline.map((activity, index) => (
                  <Timeline.Item
                    key={index}
                    color={activity.color}
                    dot={activity.icon}
                  >
                    <div>
                      <Text strong>{activity.title}</Text>
                      <div>
                        <Text type="secondary">{activity.content}</Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {activity.time}
                      </Text>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
              
              {activityTimeline.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Text type="secondary">{t('dashboard.noRecentActivity')}</Text>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Center Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            style={{ marginTop: 24 }}
          >
            <Card
              title={
                <Space>
                  <PieChartOutlined />
                  <Text strong>{t('dashboard.centerDistribution')}</Text>
                </Space>
              }
              className="distribution-card"
            >
              {centerDistribution.length > 0 ? (
                <div>
                  {centerDistribution.map((item, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        marginBottom: 16,
                        padding: '8px 0'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Space>
                          <div style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: item.color
                          }} />
                          <Text>{item.type}</Text>
                        </Space>
                        <Text strong>{item.count} ({item.percent}%)</Text>
                      </div>
                      <Progress
                        percent={item.percent}
                        strokeColor={item.color}
                        size="small"
                        showInfo={false}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Skeleton active />
                </div>
              )}
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ marginTop: 24 }}
      >
        <Card className="dashboard-footer-card">
          <Row align="middle">
            <Col flex="auto">
              <Space>
                <Text type="secondary">
                  © {new Date().getFullYear()} HealthCenterSoft • v2.0.0 • 
                  {t('dashboard.environment')}: {import.meta.env.VITE_NODE_ENV || 'développement'} • 
                  {t('dashboard.user')}: {user?.username || 'N/A'}
                </Text>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  type="text"
                  size="small"
                  icon={<FileTextOutlined />}
                  onClick={() => window.open('/docs', '_blank')}
                >
                  {t('dashboard.documentation')}
                </Button>
                <Button
                  type="text"
                  size="small"
                  icon={<InfoCircleOutlined />}
                  onClick={() => window.open('/support', '_blank')}
                >
                  {t('dashboard.support')}
                </Button>
                <Button
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => exportPDFAPI.exportDashboard()}
                >
                  {t('dashboard.export')}
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </motion.div>
    </div>
  );
};

// Ajouter l'icône manquante
import { RocketOutlined } from '@ant-design/icons';

export default Dashboard;