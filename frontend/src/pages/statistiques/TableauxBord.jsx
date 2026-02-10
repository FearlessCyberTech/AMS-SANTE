import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Card, Row, Col, Statistic, Button, Modal, Form,
  Select, Input, Tag, Space, message, Tabs,
  Descriptions, Tooltip, Alert, Divider, Badge,
  Typography, Empty, List, Avatar,
  Drawer, Popconfirm, Switch, InputNumber
} from 'antd';
import {
  DatabaseOutlined, FileTextOutlined,
  CheckCircleOutlined, SyncOutlined, EyeOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined,
  FilterOutlined, SearchOutlined, FlagOutlined,
  SettingOutlined, GlobalOutlined, 
  DollarOutlined, LoadingOutlined, CalendarOutlined,
  UserOutlined, BugOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/fr';
import { baremesAPI, paysAPI } from '../../services/api';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

// ==================== COMPOSANTS RÉUTILISABLES ====================

const TypeTag = ({ typeCode }) => {
  const getTagColor = (code) => {
    const colors = {
      'M': 'blue',
      'H': 'red',
      'P': 'green',
      'L': 'purple',
      'C': 'orange',
      'D': 'cyan',
      'O': 'geekblue',
      'A': 'magenta',
      'S': 'volcano'
    };
    return colors[code] || 'blue';
  };

  const getTypeLabel = (code) => {
    return baremesAPI.getTypeBarremeLabel(code);
  };

  return (
    <Tag color={getTagColor(typeCode)} icon={<DatabaseOutlined />}>
      {getTypeLabel(typeCode)}
    </Tag>
  );
};

const StatusBadge = ({ date }) => {
  if (!date) return <Badge status="default" text="Inconnu" />;
  
  const daysDiff = moment().diff(moment(date), 'days');
  
  if (daysDiff < 7) {
    return <Badge status="success" text="Très récent" />;
  } else if (daysDiff < 30) {
    return <Badge status="processing" text="Récent" />;
  } else {
    return <Badge status="default" text="Standard" />;
  }
};

// ==================== COMPOSANT PRINCIPAL ====================

const BarremesManagement = () => {
  // États principaux
  const [activeTab, setActiveTab] = useState('barremes');
  const [modalBarremeVisible, setModalBarremeVisible] = useState(false);
  const [modalDetailsVisible, setModalDetailsVisible] = useState(false);
  const [drawerPaysVisible, setDrawerPaysVisible] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  // États pour la sélection
  const [selectedBarreme, setSelectedBarreme] = useState(null);
  const [selectedPays, setSelectedPays] = useState(null);
  
  // États pour les données
  const [baremes, setBaremes] = useState([]);
  const [loadingBaremes, setLoadingBaremes] = useState(false);
  const [paysOptions, setPaysOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [loadingReferences, setLoadingReferences] = useState(false);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    type: 'tous',
    pays: 'tous',
    recherche: '',
    tri: 'date_desc'
  });
  
  // États de chargement
  const [loadingStates, setLoadingStates] = useState({
    creation: false,
    modification: false,
    suppression: false
  });

  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalBarremes: 0,
    totalAffections: 0,
    totalGaranties: 0,
    parType: {},
    parPays: {}
  });

  // Formulaires
  const [formBarreme] = Form.useForm();

  // ==================== CHARGEMENT DES DONNÉES ====================

 const loadBarremes = useCallback(async () => {
  setLoadingBaremes(true);
  try {
    const params = {
      page: 1,
      limit: 100,
      ...(filters.recherche && { search: filters.recherche }),
      ...(filters.type !== 'tous' && { type_bareme: filters.type }),
      ...(filters.pays !== 'tous' && { cod_pay: filters.pays }),
      sortBy: filters.tri.includes('date') ? 'DAT_CREUTIL' : 'COD_BAR',
      sortOrder: filters.tri.includes('asc') ? 'ASC' : 'DESC'
    };
    
    const response = await baremesAPI.getAll(params);
    
    if (response.success) {
      const formattedBarremes = (response.baremes || []).map((barreme, index) => ({
        key: `${barreme.COD_BAR}-${barreme.COD_PAY}-${index}`,
        ...barreme,
        isRecent: barreme.DAT_CREUTIL && 
          moment().diff(moment(barreme.DAT_CREUTIL), 'days') < 30
      }));
      
      setBaremes(formattedBarremes);
      const stats = calculateDashboardStats(formattedBarremes);
      setDashboardData(stats);
      
      if (formattedBarremes.length === 0) {
        message.info('Aucun barème trouvé avec les critères sélectionnés');
      } else {
        message.success(`${formattedBarremes.length} barème(s) chargé(s)`);
      }
    } else {
      setBaremes([]);
      message.error(response.message || 'Erreur lors du chargement des barèmes');
    }
  } catch (error) {
    console.error('❌ Erreur chargement barèmes:', error);
    setBaremes([]);
    message.error('Erreur de connexion au serveur');
  } finally {
    setLoadingBaremes(false);
  }
}, [filters]);

 const loadReferences = useCallback(async () => {
  setLoadingReferences(true);
  try {
    // Charger les pays
    const paysResponse = await paysAPI.getAll();
    if (paysResponse.success) {
      setPaysOptions(paysResponse.pays || []);
    } else {
      console.warn('⚠️ Erreur chargement pays:', paysResponse.message);
      setPaysOptions([]);
      message.warning('Impossible de charger la liste des pays');
    }
    
    // Charger les types
    const typesResponse = await baremesAPI.getTypesBarreme();
    if (typesResponse.success) {
      setTypeOptions(typesResponse.types || []);
    } else {
      console.warn('⚠️ Erreur chargement types:', typesResponse.message);
      setTypeOptions([]);
      message.warning('Impossible de charger les types de barème');
    }
    
  } catch (error) {
    console.error('❌ Erreur chargement références:', error);
    setPaysOptions([]);
    setTypeOptions([]);
    message.error('Erreur lors du chargement des données de référence');
  } finally {
    setLoadingReferences(false);
  }
}, []);

  const calculateDashboardStats = (baremesList) => {
    const stats = {
      totalBarremes: baremesList.length,
      totalAffections: 0,
      totalGaranties: 0,
      parType: {},
      parPays: {}
    };
    
    baremesList.forEach(barreme => {
      // Totaux
      stats.totalAffections += barreme.totalAffections || 0;
      stats.totalGaranties += barreme.totalGaranties || 0;
      
      // Par type
      const typeKey = barreme.TYP_BAR_STRING || 'M';
      stats.parType[typeKey] = (stats.parType[typeKey] || 0) + 1;
      
      // Par pays
      const paysKey = barreme.COD_PAY || 'INCONNU';
      stats.parPays[paysKey] = (stats.parPays[paysKey] || 0) + 1;
    });
    
    return stats;
  };

  // ==================== EFFETS ====================

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    loadBarremes();
  }, [loadBarremes]);

  // ==================== GESTION DES FILTRES ====================

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadBarremes();
  };

  const resetFilters = () => {
    setFilters({
      type: 'tous',
      pays: 'tous',
      recherche: '',
      tri: 'date_desc'
    });
  };

  // ==================== GESTION DES BARÈMES ====================

  const handleCreateBarreme = async (values) => {
    setLoadingStates(prev => ({ ...prev, creation: true }));
    
    try {
      const response = await baremesAPI.create(values);
      
      if (response.success) {
        message.success('Barème créé avec succès');
        formBarreme.resetFields();
        setModalBarremeVisible(false);
        loadBarremes();
      } else {
        message.error(response.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('❌ Erreur création barème:', error);
      message.error(error.message || 'Erreur lors de la création');
    } finally {
      setLoadingStates(prev => ({ ...prev, creation: false }));
    }
  };

  const handleUpdateBarreme = async (values) => {
    if (!selectedBarreme) return;
    
    setLoadingStates(prev => ({ ...prev, modification: true }));
    
    try {
      const response = await baremesAPI.update(
        selectedBarreme.COD_BAR,
        selectedBarreme.COD_PAY,
        values
      );
      
      if (response.success) {
        message.success('Barème mis à jour avec succès');
        formBarreme.resetFields();
        setModalBarremeVisible(false);
        setSelectedBarreme(null);
        loadBarremes();
      } else {
        message.error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour barème:', error);
      message.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoadingStates(prev => ({ ...prev, modification: false }));
    }
  };

 // CORRECT avec fetch
const handleDeleteBarreme = async (id) => {
  try {
    const response = await fetch(`/api/barremes/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur suppression:', error);
  }
};

  const ouvrirModalBarreme = (barreme = null) => {
    setSelectedBarreme(barreme);
    
    if (barreme) {
      // Mode édition
      formBarreme.setFieldsValue({
        COD_BAR: barreme.COD_BAR,
        COD_PAY: barreme.COD_PAY,
        LIB_BAR: barreme.LIB_BAR,
        TYP_BAR: barreme.TYP_BAR_STRING || 'M'
      });
    } else {
      // Mode création
      formBarreme.resetFields();
      formBarreme.setFieldsValue({
        COD_BAR: '',
        COD_PAY: '',
        LIB_BAR: '',
        TYP_BAR: 'M'
      });
    }
    
    setModalBarremeVisible(true);
  };

  const ouvrirModalDetails = (barreme) => {
    setSelectedBarreme(barreme);
    setModalDetailsVisible(true);
  };

  const ouvrirDrawerPays = (pays) => {
    setSelectedPays(pays);
    setDrawerPaysVisible(true);
  };

  // ==================== COLONNES DE LA TABLE ====================

  const barremesColumns = [
    {
      title: 'Code',
      dataIndex: 'COD_BAR',
      key: 'COD_BAR',
      width: 120,
      sorter: (a, b) => (a.COD_BAR || '').localeCompare(b.COD_BAR || ''),
      render: (code, record) => (
        <div>
          <Text strong style={{ color: '#1890ff', fontSize: 14 }}>
            {code || 'N/A'}
          </Text>
          {record.isRecent && (
            <Badge count="Nouveau" style={{ 
              backgroundColor: '#52c41a',
              fontSize: '10px',
              marginLeft: 8
            }} />
          )}
        </div>
      )
    },
    {
      title: 'Libellé',
      dataIndex: 'LIB_BAR',
      key: 'LIB_BAR',
      width: 250,
      render: (libelle) => (
        <Tooltip title={libelle}>
          <Text ellipsis style={{ maxWidth: 250 }}>
            {libelle || 'Libellé non spécifié'}
          </Text>
        </Tooltip>
      )
    },
    {
      title: 'Type',
      dataIndex: 'TYP_BAR_STRING',
      key: 'TYP_BAR_STRING',
      width: 120,
      filters: typeOptions.map(type => ({ 
        text: type.label, 
        value: type.value 
      })),
      onFilter: (value, record) => record.TYP_BAR_STRING === value,
      render: (typeCode) => <TypeTag typeCode={typeCode} />
    },
    {
      title: 'Pays',
      dataIndex: 'COD_PAY',
      key: 'COD_PAY',
      width: 100,
      filters: paysOptions.map(pays => ({ 
        text: `${pays.LIB_PAY} (${pays.COD_PAY})`, 
        value: pays.COD_PAY 
      })),
      onFilter: (value, record) => record.COD_PAY === value,
      render: (paysCode) => {
        const pays = paysOptions.find(p => p.COD_PAY === paysCode);
        return (
          <Tag color="blue" icon={<FlagOutlined />}>
            {pays ? `${pays.LIB_PAY} (${paysCode})` : paysCode}
          </Tag>
        );
      }
    },
    {
      title: 'Date Création',
      dataIndex: 'DATE_CREATION',
      key: 'DATE_CREATION',
      width: 140,
      sorter: (a, b) => moment(a.DATE_CREATION || 0).valueOf() - moment(b.DATE_CREATION || 0).valueOf(),
      render: (date) => {
        if (!date) return <Text type="secondary">-</Text>;
        try {
          return moment(date).format('DD/MM/YYYY');
        } catch {
          return <Text type="secondary">Date invalide</Text>;
        }
      }
    },
    {
      title: 'Statut',
      key: 'statut',
      width: 120,
      render: (_, record) => <StatusBadge date={record.DATE_CREATION} />
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
              onClick={() => ouvrirModalDetails(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              icon={<EditOutlined />}
              onClick={() => ouvrirModalBarreme(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Popconfirm
              title="Supprimer le barème"
              description="Êtes-vous sûr de vouloir supprimer ce barème ? Cette action est irréversible."
              onConfirm={handleDeleteBarreme}
              okText="Oui"
              cancelText="Non"
              okButtonProps={{ danger: true }}
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

  // ==================== RENDU DES ONGLETS ====================

  const renderBarremesTab = () => (
    <Card>
      {/* Barre de filtres */}
      <div style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12} lg={6}>
            <Input
              placeholder="Rechercher..."
              value={filters.recherche}
              onChange={(e) => handleFilterChange('recherche', e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
              onPressEnter={applyFilters}
            />
          </Col>
          <Col xs={12} md={6} lg={4}>
            <Select
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
              style={{ width: '100%' }}
              placeholder="Type"
            >
              <Option value="tous">Tous les types</Option>
              {typeOptions.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={6} lg={4}>
            <Select
              value={filters.pays}
              onChange={(value) => handleFilterChange('pays', value)}
              style={{ width: '100%' }}
              placeholder="Pays"
            >
              <Option value="tous">Tous les pays</Option>
              {paysOptions.map(pays => (
                <Option key={pays.COD_PAY} value={pays.COD_PAY}>
                  {pays.LIB_PAY}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Space>
              <Button
                type="primary"
                onClick={applyFilters}
                icon={<FilterOutlined />}
              >
                Filtrer
              </Button>
              <Button onClick={resetFilters}>
                Réinitialiser
              </Button>
              <Tooltip title="Mode débogage">
                <Switch
                  checked={debugMode}
                  onChange={setDebugMode}
                  checkedChildren="Debug"
                  unCheckedChildren="Normal"
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Actions principales */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => ouvrirModalBarreme()}
          >
            Nouveau Barème
          </Button>
          <Button
            icon={<SyncOutlined />}
            onClick={loadBarremes}
            loading={loadingBaremes}
          >
            Actualiser
          </Button>
          {debugMode && (
            <Button
              icon={<BugOutlined />}
              onClick={() => {
                console.log('🔍 Données:', baremes);
                console.log('📊 Dashboard:', dashboardData);
                console.log('🌍 Pays:', paysOptions);
                console.log('📋 Types:', typeOptions);
              }}
            >
              Debug
            </Button>
          )}
        </Space>
      </div>

      {/* Table */}
      <Table
        columns={barremesColumns}
        dataSource={baremes}
        loading={loadingBaremes}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `${total} barème(s)`,
          showQuickJumper: true
        }}
        scroll={{ x: 1000 }}
        locale={{
          emptyText: (
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Aucun barème trouvé"
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => ouvrirModalBarreme()}
              >
                Créer un barème
              </Button>
            </Empty>
          )
        }}
        rowKey="key"
      />
    </Card>
  );

  const renderTypesTab = () => (
    <Card>
      <Alert
        type="info"
        showIcon
        message="Types de barèmes"
        description="Liste des types de barèmes disponibles dans le système"
        style={{ marginBottom: 16 }}
      />
      
      <Row gutter={[16, 16]}>
        {typeOptions.map((type) => (
          <Col xs={24} sm={12} md={8} lg={6} key={type.value}>
            <Card 
              size="small" 
              hoverable
              style={{ 
                borderLeft: `4px solid ${type.color || '#1890ff'}`,
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <DatabaseOutlined style={{ 
                      marginRight: 8, 
                      color: type.color || '#1890ff' 
                    }} />
                    <Text strong>{type.label}</Text>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Code: {type.value} | Valeur: {type.numericValue}
                  </div>
                </div>
                <Tag color={type.color}>
                  {dashboardData.parType[type.value] || 0}
                </Tag>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );

  const renderPaysTab = () => (
    <Card>
      <Alert
        type="info"
        showIcon
        message="Pays"
        description="Liste des pays disponibles pour les barèmes"
        style={{ marginBottom: 16 }}
      />
      
      <Row gutter={[16, 16]}>
        {paysOptions.map((pays) => (
          <Col xs={24} sm={12} md={8} lg={6} key={pays.COD_PAY}>
            <Card 
              size="small" 
              hoverable
              onClick={() => ouvrirDrawerPays(pays)}
              style={{ cursor: 'pointer', height: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <FlagOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    <Text strong>{pays.LIB_PAY}</Text>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Code: {pays.COD_PAY}
                  </div>
                </div>
                <Tag color="blue">
                  {dashboardData.parPays[pays.COD_PAY] || 0} barème(s)
                </Tag>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );

  const tabsItems = [
    {
      key: 'barremes',
      label: (
        <span>
          <DatabaseOutlined />
          Barèmes
          <Badge 
            count={baremes.length} 
            style={{ marginLeft: 8 }} 
            color="green"
          />
        </span>
      ),
      children: renderBarremesTab()
    },
    {
      key: 'types',
      label: (
        <span>
          <SettingOutlined />
          Types
          <Badge 
            count={typeOptions.length} 
            style={{ marginLeft: 8 }} 
            color="blue"
          />
        </span>
      ),
      children: renderTypesTab()
    },
    {
      key: 'pays',
      label: (
        <span>
          <GlobalOutlined />
          Pays
          <Badge 
            count={paysOptions.length} 
            style={{ marginLeft: 8 }} 
            color="purple"
          />
        </span>
      ),
      children: renderPaysTab()
    }
  ];

  // ==================== RENDU PRINCIPAL ====================

  return (
    <div style={{ padding: 20 }}>
      {/* Tableau de bord */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Barèmes"
              value={dashboardData.totalBarremes}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Affections Total"
              value={dashboardData.totalAffections}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Garanties Total"
              value={dashboardData.totalGaranties}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Types Actifs"
              value={Object.keys(dashboardData.parType).length}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Onglets principaux */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <DatabaseOutlined style={{ marginRight: 8 }} />
            <Text strong>Gestion des Barèmes Tarifaires</Text>
          </div>
        }
        extra={
          <Button 
            icon={<SyncOutlined />} 
            onClick={() => {
              loadBarremes();
              loadReferences();
            }}
            loading={loadingBaremes || loadingReferences}
          >
            Actualiser
          </Button>
        }
      >
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabsItems}
        />
      </Card>

      {/* Modal Création/Modification Barème */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {selectedBarreme ? <EditOutlined /> : <PlusOutlined />}
            <Text style={{ marginLeft: 8 }}>
              {selectedBarreme ? 'Modifier le Barème' : 'Nouveau Barème'}
            </Text>
          </div>
        }
        open={modalBarremeVisible}
        onCancel={() => {
          setModalBarremeVisible(false);
          formBarreme.resetFields();
          setSelectedBarreme(null);
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={formBarreme}
          layout="vertical"
          onFinish={selectedBarreme ? handleUpdateBarreme : handleCreateBarreme}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="COD_BAR"
                label="Code Barème"
                rules={[
                  { required: true, message: 'Le code est obligatoire' },
                  { pattern: /^\d+$/, message: 'Uniquement des chiffres' },
                  { max: 10, message: 'Maximum 10 caractères' }
                ]}
              >
                <Input
                  placeholder="Ex: 1001"
                  disabled={!!selectedBarreme}
                  readOnly={!!selectedBarreme}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="COD_PAY"
                label="Pays"
                rules={[
                  { required: true, message: 'Le pays est obligatoire' },
                  { min: 2, max: 3, message: '2 à 3 caractères' }
                ]}
              >
                <Select
                  placeholder="Sélectionnez un pays"
                  disabled={!!selectedBarreme}
                  showSearch
                  optionFilterProp="children"
                >
                  {paysOptions.map((pays) => (
                    <Option key={pays.COD_PAY} value={pays.COD_PAY}>
                      {pays.LIB_PAY} ({pays.COD_PAY})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="LIB_BAR"
            label="Libellé du Barème"
            rules={[
              { required: true, message: 'Le libellé est obligatoire' },
              { max: 100, message: 'Maximum 100 caractères' }
            ]}
          >
            <TextArea
              placeholder="Description du barème"
              rows={3}
              maxLength={100}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="TYP_BAR"
            label="Type de Barème"
            rules={[{ required: true, message: 'Le type est obligatoire' }]}
          >
            <Select placeholder="Sélectionnez un type">
              {typeOptions.map((type) => (
                <Option key={type.value} value={type.value}>
                  <Tag color={type.color}>{type.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setModalBarremeVisible(false);
                  formBarreme.resetFields();
                  setSelectedBarreme(null);
                }}
              >
                Annuler
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={selectedBarreme ? loadingStates.modification : loadingStates.creation}
                icon={selectedBarreme ? <EditOutlined /> : <PlusOutlined />}
              >
                {selectedBarreme ? 'Mettre à jour' : 'Créer'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal Détails Barème */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <InfoCircleOutlined />
            <Text style={{ marginLeft: 8 }}>Détails du Barème</Text>
          </div>
        }
        open={modalDetailsVisible}
        onCancel={() => setModalDetailsVisible(false)}
        footer={null}
        width={700}
      >
        {selectedBarreme && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Code" span={2}>
                <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                  {selectedBarreme.COD_BAR || 'N/A'}
                </Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="Libellé" span={2}>
                <Text>{selectedBarreme.LIB_BAR || 'Libellé non spécifié'}</Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="Type">
                <TypeTag typeCode={selectedBarreme.TYP_BAR_STRING} />
              </Descriptions.Item>
              
              <Descriptions.Item label="Pays">
                <Tag color="blue" icon={<FlagOutlined />}>
                  {selectedBarreme.COD_PAY || 'N/A'}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Date Création">
                {selectedBarreme.DATE_CREATION ? 
                  moment(selectedBarreme.DATE_CREATION).format('DD/MM/YYYY HH:mm')
                  : 
                  <Text type="secondary">Non spécifiée</Text>
                }
              </Descriptions.Item>
              
              <Descriptions.Item label="Date Modification">
                {selectedBarreme.DATE_MODIFICATION ? 
                  moment(selectedBarreme.DATE_MODIFICATION).format('DD/MM/YYYY HH:mm')
                  : 
                  <Text type="secondary">Non spécifiée</Text>
                }
              </Descriptions.Item>
              
              <Descriptions.Item label="Statut">
                <StatusBadge date={selectedBarreme.DATE_CREATION} />
              </Descriptions.Item>
            </Descriptions>

            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Affections"
                    value={selectedBarreme.totalAffections || 0}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Garanties"
                    value={selectedBarreme.totalGaranties || 0}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Lettres"
                    value={selectedBarreme.totalLettres || 0}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Plafonds"
                    value={selectedBarreme.totalPlafonds || 0}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
            </Row>

            <Divider />

            <div style={{ textAlign: 'center' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setModalDetailsVisible(false);
                    ouvrirModalBarreme(selectedBarreme);
                  }}
                >
                  Modifier
                </Button>
                
                <Popconfirm
                  title="Supprimer le barème"
                  description="Cette action est irréversible. Confirmez-vous la suppression ?"
                  onConfirm={handleDeleteBarreme}
                  okText="Supprimer"
                  cancelText="Annuler"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={loadingStates.suppression}
                  >
                    Supprimer
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          </>
        )}
      </Modal>

      {/* Drawer Détails Pays */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FlagOutlined />
            <Text style={{ marginLeft: 8 }}>Détails du Pays</Text>
          </div>
        }
        width={400}
        open={drawerPaysVisible}
        onClose={() => setDrawerPaysVisible(false)}
      >
        {selectedPays && (
          <>
            <Descriptions column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Code">
                <Tag color="blue" style={{ fontSize: 14 }}>
                  {selectedPays.COD_PAY}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Libellé">
                <Text strong style={{ fontSize: 16 }}>
                  {selectedPays.LIB_PAY}
                </Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="Barèmes associés">
                <Tag color="green" style={{ fontSize: 14 }}>
                  {dashboardData.parPays[selectedPays.COD_PAY] || 0} barème(s)
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Text strong style={{ marginBottom: 16, display: 'block' }}>
              Barèmes dans ce pays
            </Text>
            
            <List
              dataSource={baremes.filter(b => b.COD_PAY === selectedPays.COD_PAY)}
              renderItem={(barreme) => (
                <List.Item
                  key={barreme.key}
                  actions={[
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => {
                        setDrawerPaysVisible(false);
                        ouvrirModalDetails(barreme);
                      }}
                    >
                      Détails
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<DatabaseOutlined />} />}
                    title={
                      <div>
                        <Text strong>{barreme.COD_BAR || 'N/A'}</Text>
                        <TypeTag typeCode={barreme.TYP_BAR_STRING} />
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {barreme.LIB_BAR || 'Libellé non spécifié'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
                          {barreme.totalAffections || 0} affections • {barreme.totalGaranties || 0} garanties
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{
                emptyText: (
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Aucun barème dans ce pays"
                  />
                )
              }}
            />
          </>
        )}
      </Drawer>
    </div>
  );
};

export default BarremesManagement;