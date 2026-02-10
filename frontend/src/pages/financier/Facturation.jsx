import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Card, Row, Col, Statistic, Button, Modal, Form,
  Select, Input, DatePicker, Tag, Space, message, Tabs,
  Descriptions, Tooltip, Popconfirm, Spin, Upload,
  Alert, Divider, Badge, Typography, Empty
} from 'antd';
import {
  DollarOutlined, TransactionOutlined, HistoryOutlined,
  FileTextOutlined, CheckCircleOutlined, SyncOutlined,
  DownloadOutlined, EyeOutlined, ExclamationCircleOutlined,
  LoadingOutlined, UserOutlined, BankOutlined,
  PieChartOutlined, BarChartOutlined, UploadOutlined,
  WarningOutlined, InfoCircleOutlined, ClockCircleOutlined,
  FileSearchOutlined, CloseCircleOutlined, SearchOutlined,
  PlusOutlined
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
import { financesAPI, facturationAPI } from '../../services/api';

// Enregistrer ChartJS
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
const { TabPane } = Tabs;

const Paiement = () => {
  // États
  const [transactions, setTransactions] = useState([]);
  const [litiges, setLitiges] = useState([]);
  const [loading, setLoading] = useState({
    transactions: false,
    litiges: false,
    dashboard: false,
    litige: false,
    factureDetails: false
  });
  const [dashboardData, setDashboardData] = useState({
    totalTransactions: 0,
    successRate: 0,
    totalAmount: 0,
    retards: 0
  });
  const [litigeStats, setLitigeStats] = useState({
    total: 0,
    ouverts: 0,
    en_cours: 0,
    resolus: 0
  });

  // Modales
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [litigeModal, setLitigeModal] = useState(false);
  const [selectedLitige, setSelectedLitige] = useState(null);
  const [litigeDetailsModal, setLitigeDetailsModal] = useState(false);
  const [selectedLitigeForDetails, setSelectedLitigeForDetails] = useState(null);
  const [resoudreLitigeModal, setResoudreLitigeModal] = useState(false);

  // Filtres
  const [filtres, setFiltres] = useState({
    dateDebut: moment().subtract(30, 'days'),
    dateFin: moment(),
    statut: 'tous',
    type: 'tous'
  });

  // Formulaires
  const [litigeForm] = Form.useForm();
  const [resoudreLitigeForm] = Form.useForm();

  // ==================== CHARGEMENT DES DONNÉES ====================

  const loadDashboardData = useCallback(async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      const data = await financesAPI.getDashboard();
      
      if (data.success && data.dashboard) {
        setDashboardData({
          totalTransactions: data.dashboard.totalTransactions || 0,
          successRate: data.dashboard.successRate || 0,
          totalAmount: data.dashboard.totalAmount || 0,
          retards: data.dashboard.retards || 0
        });
      }
    } catch (error) {
      console.error('Erreur dashboard:', error);
      message.error('Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(prev => ({ ...prev, transactions: true }));
    try {
      const params = {
        page: 1,
        limit: 50,
        date_debut: filtres.dateDebut?.format('YYYY-MM-DD'),
        date_fin: filtres.dateFin?.format('YYYY-MM-DD'),
        ...(filtres.statut !== 'tous' && { status: filtres.statut }),
        ...(filtres.type !== 'tous' && { type: filtres.type })
      };
      
      const data = await financesAPI.getTransactions(params);
      
      if (data.success) {
        setTransactions(data.transactions || []);
      } else {
        message.error(data.message || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Erreur transactions:', error);
      message.error('Erreur lors du chargement des transactions');
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  }, [filtres]);

  const loadLitiges = useCallback(async (statut = 'all') => {
    setLoading(prev => ({ ...prev, litiges: true }));
    try {
      const params = statut !== 'all' ? { statut } : {};
      const data = await facturationAPI.getLitiges(params);
      
      if (data.success) {
        setLitiges(data.litiges || []);
        
        // Calculer les stats
        const litigesData = data.litiges || [];
        setLitigeStats({
          total: litigesData.length,
          ouverts: litigesData.filter(l => l.STATUT === 'Ouvert' || l.STATUT === 'ouvert').length,
          en_cours: litigesData.filter(l => l.STATUT === 'En cours' || l.STATUT === 'en_cours').length,
          resolus: litigesData.filter(l => l.STATUT === 'Resolu' || l.STATUT === 'resolu').length
        });
      }
    } catch (error) {
      console.error('Erreur litiges:', error);
      message.error('Erreur lors du chargement des litiges');
    } finally {
      setLoading(prev => ({ ...prev, litiges: false }));
    }
  }, []);

  // ==================== GESTION DES FILTRES ====================

  const handleFiltreChange = (key, value) => {
    setFiltres(prev => ({ ...prev, [key]: value }));
  };

  const applyFiltres = () => {
    loadTransactions();
  };

  const resetFiltres = () => {
    setFiltres({
      dateDebut: moment().subtract(30, 'days'),
      dateFin: moment(),
      statut: 'tous',
      type: 'tous'
    });
  };

  // ==================== GESTION DES LITIGES ====================

  const ouvrirLitige = (transaction = null) => {
    setSelectedLitige(transaction);
    setLitigeModal(true);
    
    litigeForm.resetFields();
    
    if (transaction) {
      litigeForm.setFieldsValue({
        COD_TRANS: transaction.COD_TRANS || transaction.REFERENCE_TRANSACTION || '',
        COD_FACTURE: transaction.COD_DECL || transaction.COD_FACTURE || ''
      });
    }
  };

  const handleLitigeSubmit = async (values) => {
    setLoading(prev => ({ ...prev, litige: true }));
    
    try {
      const response = await facturationAPI.createLitige(values);
      
      if (response.success) {
        message.success('Réclamation créée avec succès');
        setLitigeModal(false);
        litigeForm.resetFields();
        loadLitiges();
      } else {
        message.error(response.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création litige:', error);
      message.error('Erreur lors de la création de la réclamation');
    } finally {
      setLoading(prev => ({ ...prev, litige: false }));
    }
  };

  const resoudreLitige = async (values) => {
    setLoading(prev => ({ ...prev, litige: true }));
    
    try {
      const litigeId = selectedLitigeForDetails?.COD_LITIGE;
      
      if (!litigeId) {
        message.error('ID réclamation manquant');
        return;
      }

      const response = await facturationAPI.updateLitige(litigeId, values);
      
      if (response.success) {
        message.success('Réclamation mise à jour avec succès');
        setResoudreLitigeModal(false);
        setLitigeDetailsModal(false);
        resoudreLitigeForm.resetFields();
        loadLitiges();
      } else {
        message.error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur résolution litige:', error);
      message.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(prev => ({ ...prev, litige: false }));
    }
  };

  const fermerLitige = async (litigeId) => {
    try {
      const response = await facturationAPI.updateLitige(litigeId, {
        STATUT: 'Ferme',
        RESOLUTION: 'Fermé par l\'utilisateur'
      });
      
      if (response.success) {
        message.success('Réclamation fermée avec succès');
        loadLitiges();
      } else {
        message.error('Erreur lors de la fermeture');
      }
    } catch (error) {
      console.error('Erreur fermeture litige:', error);
      message.error('Erreur lors de la fermeture');
    }
  };

  // ==================== FONCTIONS UTILITAIRES ====================

  const showTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const exporterTransactions = async () => {
    try {
      const data = await financesAPI.exportData('transactions', {
        date_debut: filtres.dateDebut.format('YYYY-MM-DD'),
        date_fin: filtres.dateFin.format('YYYY-MM-DD')
      });
      
      if (data.success && data.data.length > 0) {
        // Convertir en CSV
        const csv = convertToCSV(data.data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.fileName || 'transactions.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        message.success(`Export réussi (${data.data.length} transactions)`);
      } else {
        message.warning('Aucune donnée à exporter');
      }
    } catch (error) {
      console.error('Erreur export:', error);
      message.error('Erreur lors de l\'export');
    }
  };

  const convertToCSV = (objArray) => {
    if (objArray.length === 0) return '';
    
    const keys = Object.keys(objArray[0]);
    const header = keys.join(';');
    
    const rows = objArray.map(obj => {
      return keys.map(key => {
        let cell = obj[key] === null || obj[key] === undefined ? '' : obj[key];
        if (typeof cell === 'object') cell = JSON.stringify(cell);
        cell = cell.toString().replace(/"/g, '""').replace(/;/g, ',');
        return `"${cell}"`;
      }).join(';');
    });
    
    return [header, ...rows].join('\n');
  };

  // ==================== CONFIGURATION DES TABLES ====================

  const transactionColumns = [
    {
      title: 'Référence',
      dataIndex: 'REFERENCE_TRANSACTION',
      key: 'REFERENCE_TRANSACTION',
      width: 150
    },
    {
      title: 'Type',
      dataIndex: 'TYPE_TRANSACTION',
      key: 'TYPE_TRANSACTION',
      width: 120,
      render: (type) => {
        const types = {
          'Remboursement': { color: 'green', text: 'Remboursement' },
          'Paiement': { color: 'blue', text: 'Paiement' },
          'paiement': { color: 'blue', text: 'Paiement' },
          'remboursement': { color: 'green', text: 'Remboursement' }
        };
        const config = types[type] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'Montant (XAF)',
      dataIndex: 'MONTANT',
      key: 'MONTANT',
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
      dataIndex: 'STATUT_TRANSACTION',
      key: 'STATUT_TRANSACTION',
      width: 120,
      render: (status) => {
        const statuses = {
          'Reussi': { color: 'success', icon: <CheckCircleOutlined />, text: 'Réussi' },
          'Echoue': { color: 'error', icon: <ExclamationCircleOutlined />, text: 'Échec' },
          'En cours': { color: 'processing', icon: <SyncOutlined spin />, text: 'En cours' },
          'reussi': { color: 'success', icon: <CheckCircleOutlined />, text: 'Réussi' },
          'echoue': { color: 'error', icon: <ExclamationCircleOutlined />, text: 'Échec' },
          'en_cours': { color: 'processing', icon: <SyncOutlined spin />, text: 'En cours' }
        };
        const config = statuses[status] || { color: 'default', text: status };
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: 'Date',
      dataIndex: 'DATE_INITIATION',
      key: 'DATE_INITIATION',
      width: 150,
      render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm') : '-'
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
              onClick={() => showTransactionDetails(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Signaler un litige">
            <Button
              type="link"
              danger
              size="small"
              onClick={() => ouvrirLitige(record)}
            >
              <WarningOutlined /> Réclamation
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  const litigeColumns = [
    {
      title: 'ID Litige',
      dataIndex: 'COD_LITIGE',
      key: 'COD_LITIGE',
      width: 100,
      render: (id) => <Tag color="orange">LIT-{id}</Tag>
    },
    {
      title: 'Type',
      dataIndex: 'TYPE_LITIGE',
      key: 'TYPE_LITIGE',
      width: 150
    },
    {
      title: 'Statut',
      dataIndex: 'STATUT',
      key: 'STATUT',
      width: 120,
      render: (statut) => {
        const statusConfig = {
          'Ouvert': { color: 'red', icon: <ExclamationCircleOutlined />, text: 'Ouvert' },
          'En cours': { color: 'orange', icon: <ClockCircleOutlined />, text: 'En cours' },
          'Resolu': { color: 'green', icon: <CheckCircleOutlined />, text: 'Résolu' },
          'ouvert': { color: 'red', icon: <ExclamationCircleOutlined />, text: 'Ouvert' },
          'en_cours': { color: 'orange', icon: <ClockCircleOutlined />, text: 'En cours' },
          'resolu': { color: 'green', icon: <CheckCircleOutlined />, text: 'Résolu' }
        };
        const config = statusConfig[statut] || { color: 'default', text: statut };
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: 'Date Ouverture',
      dataIndex: 'DATE_OUVERTURE',
      key: 'DATE_OUVERTURE',
      width: 150,
      render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm') : '-'
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
              onClick={() => {
                setSelectedLitigeForDetails(record);
                setLitigeDetailsModal(true);
              }}
              size="small"
            />
          </Tooltip>
          {record.STATUT !== 'Resolu' && record.STATUT !== 'Ferme' && 
           record.STATUT !== 'resolu' && record.STATUT !== 'ferme' && (
            <Tooltip title="Résoudre">
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  setSelectedLitigeForDetails(record);
                  setResoudreLitigeModal(true);
                }}
              >
                Résoudre
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  // ==================== RENDU DES GRAPHIQUES ====================

  const renderStatistiques = () => {
    const statsTransactions = {
      reussies: transactions.filter(t => 
        t.STATUT_TRANSACTION === 'Reussi' || t.STATUT_TRANSACTION === 'reussi'
      ).length,
      echecs: transactions.filter(t => 
        t.STATUT_TRANSACTION === 'Echoue' || t.STATUT_TRANSACTION === 'echoue'
      ).length,
      enCours: transactions.filter(t => 
        t.STATUT_TRANSACTION === 'En cours' || t.STATUT_TRANSACTION === 'en_cours'
      ).length
    };

    const dataStatuts = {
      labels: ['Réussies', 'Échecs', 'En cours'],
      datasets: [{
        data: [statsTransactions.reussies, statsTransactions.echecs, statsTransactions.enCours],
        backgroundColor: ['#52c41a', '#f5222d', '#faad14'],
        borderColor: ['#52c41a', '#f5222d', '#faad14'],
        borderWidth: 1
      }]
    };

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <PieChartOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                <span>Statut des Transactions</span>
              </div>
            }
            size="small"
          >
            <div style={{ height: 300, position: 'relative' }}>
              {transactions.length > 0 ? (
                <Doughnut 
                  data={dataStatuts}
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
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <BarChartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                <span>Réclamations</span>
              </div>
            }
            size="small"
          >
            <div style={{ height: 300, position: 'relative' }}>
              {litiges.length > 0 ? (
                <Pie 
                  data={{
                    labels: ['Ouverts', 'En cours', 'Résolus'],
                    datasets: [{
                      data: [litigeStats.ouverts, litigeStats.en_cours, litigeStats.resolus],
                      backgroundColor: ['#ff4d4f', '#faad14', '#52c41a']
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
    );
  };

  // ==================== EFFETS ====================

  useEffect(() => {
    loadDashboardData();
    loadTransactions();
    loadLitiges();
  }, []);

  // ==================== RENDU PRINCIPAL ====================

  if (loading.dashboard && loading.transactions && loading.litiges) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
        <p style={{ marginTop: '20px' }}>Chargement du module de règlement...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TransactionOutlined style={{ marginRight: 8 }} />
            <span>Module de Règlement</span>
          </div>
        }
        extra={
          <Button 
            icon={<SyncOutlined />} 
            onClick={() => {
              loadDashboardData();
              loadTransactions();
              loadLitiges();
            }}
            loading={loading.dashboard || loading.transactions || loading.litiges}
          >
            Actualiser
          </Button>
        }
      >
        {/* Dashboard Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Total Transactions"
                value={dashboardData.totalTransactions}
                prefix={<TransactionOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Taux de Réussite"
                value={dashboardData.successRate}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Montant Total"
                value={dashboardData.totalAmount}
                suffix="XAF"
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Réclamations ouvertes"
                value={litigeStats.ouverts}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tabs */}
        <Tabs defaultActiveKey="transactions">
          <TabPane
            tab={
              <span>
                <TransactionOutlined />
                Transactions
              </span>
            }
            key="transactions"
          >
            <Card>
              <div style={{ marginBottom: 16 }}>
                <Row gutter={16} align="middle">
                  <Col>
                    <span style={{ marginRight: 8 }}>Période:</span>
                    <DatePicker.RangePicker
                      value={[filtres.dateDebut, filtres.dateFin]}
                      onChange={(dates) => {
                        if (dates) {
                          handleFiltreChange('dateDebut', dates[0]);
                          handleFiltreChange('dateFin', dates[1]);
                        }
                      }}
                      style={{ marginRight: 16 }}
                    />
                  </Col>
                  <Col>
                    <Select
                      value={filtres.statut}
                      onChange={(value) => handleFiltreChange('statut', value)}
                      style={{ width: 150, marginRight: 16 }}
                    >
                      <Option value="tous">Tous les statuts</Option>
                      <Option value="Reussi">Réussi</Option>
                      <Option value="Echoue">Échec</Option>
                      <Option value="En cours">En cours</Option>
                    </Select>
                  </Col>
                  <Col>
                    <Select
                      value={filtres.type}
                      onChange={(value) => handleFiltreChange('type', value)}
                      style={{ width: 150, marginRight: 16 }}
                    >
                      <Option value="tous">Tous les types</Option>
                      <Option value="Remboursement">Remboursement</Option>
                      <Option value="Paiement">Paiement</Option>
                    </Select>
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      onClick={applyFiltres}
                      style={{ marginRight: 8 }}
                    >
                      Appliquer
                    </Button>
                    <Button onClick={resetFiltres}>
                      Réinitialiser
                    </Button>
                  </Col>
                </Row>
              </div>
              
              <Space style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={exporterTransactions}
                >
                  Exporter
                </Button>
                <Button
                  icon={<SyncOutlined />}
                  onClick={loadTransactions}
                  loading={loading.transactions}
                >
                  Actualiser
                </Button>
              </Space>

              <Table
                columns={transactionColumns}
                dataSource={transactions}
                loading={loading.transactions}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            </Card>
          </TabPane>

          <TabPane
            tab={
              <span>
                <WarningOutlined />
                Réclamations
                {litigeStats.ouverts > 0 && (
                  <Badge 
                    count={litigeStats.ouverts} 
                    style={{ marginLeft: 8, backgroundColor: '#ff4d4f' }} 
                  />
                )}
              </span>
            }
            key="litiges"
          >
            <Card>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="Total Réclamations"
                      value={litigeStats.total}
                      prefix={<FileSearchOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="Ouverts"
                      value={litigeStats.ouverts}
                      valueStyle={{ color: '#ff4d4f' }}
                      prefix={<ExclamationCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="En Cours"
                      value={litigeStats.en_cours}
                      valueStyle={{ color: '#1890ff' }}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="Résolus"
                      value={litigeStats.resolus}
                      valueStyle={{ color: '#52c41a' }}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Select
                  defaultValue="all"
                  style={{ width: 150 }}
                  onChange={loadLitiges}
                >
                  <Option value="all">Toutes</Option>
                  <Option value="Ouvert">Ouverts</Option>
                  <Option value="En cours">En cours</Option>
                  <Option value="Resolu">Résolus</Option>
                </Select>
                
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => ouvrirLitige()}
                >
                  Nouvelle Réclamation
                </Button>
              </div>

              <Table
                columns={litigeColumns}
                dataSource={litiges}
                loading={loading.litiges}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            </Card>
          </TabPane>

          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                Statistiques
              </span>
            }
            key="statistiques"
          >
            <Card>
              {renderStatistiques()}
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* Modal Détails Transaction */}
      <Modal
        title="Détails de la Transaction"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedTransaction && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Référence">
              {selectedTransaction.REFERENCE_TRANSACTION}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              {selectedTransaction.TYPE_TRANSACTION}
            </Descriptions.Item>
            <Descriptions.Item label="Montant">
              {selectedTransaction.MONTANT} XAF
            </Descriptions.Item>
            <Descriptions.Item label="Statut">
              <Tag color={
                selectedTransaction.STATUT_TRANSACTION === 'Reussi' ? 'success' :
                selectedTransaction.STATUT_TRANSACTION === 'Echoue' ? 'error' :
                'processing'
              }>
                {selectedTransaction.STATUT_TRANSACTION}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {moment(selectedTransaction.DATE_INITIATION).format('DD/MM/YYYY HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Modal Nouveau Litige */}
      <Modal
        title="Nouvelle Réclamation"
        open={litigeModal}
        onCancel={() => setLitigeModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={litigeForm}
          layout="vertical"
          onFinish={handleLitigeSubmit}
        >
          <Form.Item
            name="TYPE_LITIGE"
            label="Type de Réclamation"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="Montant incorrect">Montant incorrect</Option>
              <Option value="Problème technique">Problème technique</Option>
              <Option value="Retard de paiement">Retard de paiement</Option>
              <Option value="Autre">Autre</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="DESCRIPTION"
            label="Description"
            rules={[{ required: true }]}
          >
            <TextArea rows={4} placeholder="Décrivez le problème..." />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Button 
              onClick={() => setLitigeModal(false)}
              style={{ marginRight: 8 }}
            >
              Annuler
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading.litige}
            >
              Créer
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Résoudre Litige */}
      <Modal
        title="Résoudre la Réclamation"
        open={resoudreLitigeModal}
        onCancel={() => setResoudreLitigeModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={resoudreLitigeForm}
          layout="vertical"
          onFinish={resoudreLitige}
        >
          <Form.Item
            name="STATUT"
            label="Statut"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="Resolu">Résolu</Option>
              <Option value="Ferme">Fermé</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="RESOLUTION"
            label="Résolution"
            rules={[{ required: true }]}
          >
            <TextArea rows={4} placeholder="Décrivez la résolution..." />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Button 
              onClick={() => setResoudreLitigeModal(false)}
              style={{ marginRight: 8 }}
            >
              Annuler
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading.litige}
            >
              Enregistrer
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Paiement;