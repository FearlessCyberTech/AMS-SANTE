import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Input,
  DatePicker,
  Select,
  Modal,
  Form,
  Tag,
  Space,
  Statistic,
  message,
  Popconfirm,
  Tooltip,
  InputNumber,
  Drawer,
  Descriptions
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  TeamOutlined,
  FileTextOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { prestationsAPI, beneficiairesAPI, prestatairesAPI } from '../../services/api';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const PrestationsManagementPage = () => {
  // États principaux
  const [loading, setLoading] = useState(false);
  const [prestations, setPrestations] = useState([]);
  const [typesPrestations, setTypesPrestations] = useState([]);
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [prestataires, setPrestataires] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [prestationDetailsVisible, setPrestationDetailsVisible] = useState(false);
  const [selectedPrestation, setSelectedPrestation] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [form] = Form.useForm();

  // Pagination et filtres
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} prestations`,
  });

  const [filters, setFilters] = useState({
    search: '',
    type_prestation: null,
    date_debut: null,
    date_fin: null,
    statut_paiement: null,
    statut_declaration: null,
    cod_ben: null,
    cod_prestataire: null,
  });

  // Statistiques
  const [statistics, setStatistics] = useState({
    total: 0,
    total_montant: 0,
    total_prise_charge: 0,
    par_type: [],
    par_mois: []
  });

  // Chargement des données initiales
  useEffect(() => {
    loadInitialData();
    loadStatistics();
  }, []);

  // Fonction pour convertir le statut de paiement en code API
const getStatusCode = (statut) => {
  const statutMap = {
    'paye': 'P',
    'impaye': 'I',
    'partiel': 'T',
    'en_attente': 'E'
  };
  return statutMap[statut?.toLowerCase()] || 'E';
};

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPrestations(),
        loadTypesPrestations(),
        loadBeneficiaires(),
        loadPrestataires()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrestations = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await prestationsAPI.getAllPrestations(filters, {
        page,
        limit: pageSize,
        sortBy: 'DATE_PRESTATION',
        sortOrder: 'desc'
      });

      if (response.success) {
        setPrestations(response.prestations || []);
        setPagination({
          ...pagination,
          current: page,
          pageSize,
          total: response.pagination?.total || 0,
        });
      } else {
        message.error(response.message || 'Erreur lors du chargement des prestations');
      }
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Erreur lors du chargement des prestations');
    } finally {
      setLoading(false);
    }
  };

  const loadTypesPrestations = async () => {
    try {
      const response = await prestationsAPI.getTypesPrestations();
      if (response.success) {
        setTypesPrestations(response.types_prestations || []);
      }
    } catch (error) {
      console.error('Erreur chargement types prestations:', error);
    }
  };

  const loadBeneficiaires = async () => {
    try {
      const response = await beneficiairesAPI.getAll({ limit: 1000 });
      if (response.success) {
        setBeneficiaires(response.beneficiaires || []);
        console.log('Bénéficiaires chargés:', response.beneficiaires?.length);
      } else {
        console.error('Erreur API bénéficiaires:', response.message);
      }
    } catch (error) {
      console.error('Erreur chargement bénéficiaires:', error);
      message.error('Erreur lors du chargement des bénéficiaires');
    }
  };

  const loadPrestataires = async () => {
    try {
      const response = await prestatairesAPI.getAll({ limit: 1000 });
      if (response.success) {
        setPrestataires(response.prestataires || []);
        console.log('Prestataires chargés:', response.prestataires?.length);
      } else {
        console.error('Erreur API prestataires:', response.message);
      }
    } catch (error) {
      console.error('Erreur chargement prestataires:', error);
      message.error('Erreur lors du chargement des prestataires');
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await prestationsAPI.getStatistics(filters);
      if (response.success) {
        setStatistics(response.statistics || {});
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  // Gestion des filtres
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (key === 'search') {
      loadPrestations(1, pagination.pageSize);
    }
  };

  const handleDateFilterChange = (dates) => {
    const newFilters = {
      ...filters,
      date_debut: dates ? dates[0].format('YYYY-MM-DD') : null,
      date_fin: dates ? dates[1].format('YYYY-MM-DD') : null,
    };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    loadPrestations(1, pagination.pageSize);
    loadStatistics();
    setFiltersVisible(false);
  };

  const resetFilters = () => {
    const resetFilters = {
      search: '',
      type_prestation: null,
      date_debut: null,
      date_fin: null,
      statut_paiement: null,
      statut_declaration: null,
      cod_ben: null,
      cod_prestataire: null,
    };
    setFilters(resetFilters);
    loadPrestations(1, pagination.pageSize);
    setFiltersVisible(false);
  };

  // Gestion des prestations
  const handleCreatePrestation = () => {
    setModalType('create');
    form.resetFields();
    setIsModalVisible(true);
  };

const handleEditPrestation = (prestation) => {
  setModalType('edit');
  setSelectedPrestation(prestation);
  
  // Convertir le code statut API vers statut lisible
  const getStatutFromCode = (code) => {
    const codeMap = {
      'P': 'paye',
      'I': 'impaye',
      'T': 'partiel',
      'E': 'en_attente'
    };
    return codeMap[code] || 'impaye';
  };

  form.setFieldsValue({
    ...prestation,
    DATE_PRESTATION: prestation.DATE_PRESTATION ? dayjs(prestation.DATE_PRESTATION) : null,
    COD_BEN: prestation.COD_BPR ? String(prestation.COD_BPR) : null,
    COD_PRESTATAIRE: prestation.COD_BPR ? String(prestation.COD_BPR) : null,
    // Champs API
    LIC_TAR: prestation.LIC_TAR || prestation.TYPE_PRESTATION?.replace(/\s+/g, '_').toUpperCase() || 'PRESTATION',
    LIC_NOM: prestation.LIC_NOM || prestation.LIB_PREST || prestation.TYPE_PRESTATION || 'Prestation',
    MLT_PRE: prestation.MLT_PRE || prestation.MONTANT || 0,
    COD_POL: prestation.COD_POL,
    STATUT_PAIEMENT: getStatutFromCode(prestation.STA_PRE) || 'impaye',
  });
  setIsModalVisible(true);
};

  const handleViewDetails = (prestation) => {
    setSelectedPrestation(prestation);
    setPrestationDetailsVisible(true);
  };

  const handleDeletePrestation = async (id) => {
    try {
      const response = await prestationsAPI.deletePrestation(id);
      if (response.success) {
        message.success('Prestation supprimée avec succès');
        loadPrestations(pagination.current, pagination.pageSize);
        loadStatistics();
      } else {
        message.error(response.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      message.error('Erreur lors de la suppression');
    }
  };

  const handleForceDelete = async (id) => {
    Modal.confirm({
      title: 'Suppression définitive',
      content: 'Êtes-vous sûr de vouloir supprimer définitivement cette prestation ? Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          const response = await prestationsAPI.forceDeletePrestation(id);
          if (response.success) {
            message.success('Prestation supprimée définitivement');
            loadPrestations(pagination.current, pagination.pageSize);
            loadStatistics();
          }
        } catch (error) {
          console.error('Erreur:', error);
          message.error('Erreur lors de la suppression');
        }
      },
    });
  };

  const handleRestore = async (id) => {
    try {
      const response = await prestationsAPI.restorePrestation(id);
      if (response.success) {
        message.success('Prestation restaurée avec succès');
        loadPrestations(pagination.current, pagination.pageSize);
        loadStatistics();
      }
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Erreur lors de la restauration');
    }
  };

  const handleMarkAsDeclared = async (prestationId) => {
    Modal.confirm({
      title: 'Marquer comme déclaré',
      content: 'Veuillez saisir l\'ID de la déclaration :',
      onOk: async (value) => {
        try {
          const response = await prestationsAPI.markAsDeclared(prestationId, value);
          if (response.success) {
            message.success('Prestation marquée comme déclarée');
            loadPrestations(pagination.current, pagination.pageSize);
          }
        } catch (error) {
          console.error('Erreur:', error);
          message.error('Erreur lors du marquage');
        }
      },
    });
  };

 // Dans handleSubmitPrestation du composant frontend
const handleSubmitPrestation = async (values) => {
  try {
    setLoading(true);
    
    // Fonction pour convertir le statut de paiement en code API
    const getStatusCode = (statut) => {
      const statutMap = {
        'paye': 'P',
        'impaye': 'I', 
        'partiel': 'T',
        'en_attente': 'E'
      };
      return statutMap[statut?.toLowerCase()] || 'E';
    };

    // Calculer le montant de prise en charge
    const montant = parseFloat(values.MONTANT) || 0;
    const taux = parseFloat(values.TAUX_PRISE_CHARGE) || 100;
    const montantPriseEnCharge = (montant * taux) / 100;

    // Formater la date correctement
    const datePrestation = values.DATE_PRESTATION 
      ? values.DATE_PRESTATION.format('YYYY-MM-DD HH:mm:ss')
      : dayjs().format('YYYY-MM-DD HH:mm:ss');

   // Dans handleSubmitPrestation
const prestationData = {
  // Champs obligatoires pour l'API
  COD_BPR: values.COD_BEN ? parseInt(values.COD_BEN, 10) : null,
  LIC_TAR: values.LIC_TAR || values.TYPE_PRESTATION?.replace(/\s+/g, '_').toUpperCase() || 'PRESTATION',
  LIC_NOM: values.LIC_NOM || values.LIB_PREST || values.TYPE_PRESTATION || 'Prestation',
  MLT_PRE: values.MLT_PRE || values.MONTANT || 0,
  
  // Champs supplémentaires
  CRE_PRE: datePrestation,
  QT_PRE: values.QUANTITE || 1,
  MTR_PRE: montantPriseEnCharge,
  OBS_PRE: values.OBSERVATIONS || '',
  STA_PRE: getStatusCode(values.STATUT_PAIEMENT) || 'E',
  COD_POL: values.COD_POL || null,
  NUM_BAR: values.NUM_BAR || null,
  
  // Pour la compatibilité (champs qui seront ignorés par le backend)
  COD_BEN: values.COD_BEN ? parseInt(values.COD_BEN, 10) : null,
  TYPE_PRESTATION: values.TYPE_PRESTATION,
  LIB_PREST: values.LIB_PREST,
  DATE_PRESTATION: values.DATE_PRESTATION ? values.DATE_PRESTATION.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
  MONTANT: values.MONTANT || 0,
  QUANTITE: values.QUANTITE || 1,
  TAUX_PRISE_CHARGE: values.TAUX_PRISE_CHARGE || 100,
  STATUT_PAIEMENT: values.STATUT_PAIEMENT || 'impaye',
  STATUT_DECLARATION: values.STATUT_DECLARATION || 'non_declare',
  COD_PRESTATAIRE: values.COD_PRESTATAIRE || null,
};

    console.log('📤 Données envoyées à l\'API:', prestationData);

    let response;
    if (modalType === 'create') {
      response = await prestationsAPI.createPrestation(prestationData);
    } else {
      response = await prestationsAPI.updatePrestation(selectedPrestation.id, prestationData);
    }

    if (response.success) {
      message.success(modalType === 'create' ? 'Prestation créée avec succès' : 'Prestation mise à jour avec succès');
      setIsModalVisible(false);
      form.resetFields();
      loadPrestations(pagination.current, pagination.pageSize);
      loadStatistics();
    } else {
      message.error(response.message || 'Erreur lors de l\'enregistrement');
    }
  } catch (error) {
    console.error('Erreur:', error);
    message.error(error.message || 'Erreur lors de l\'enregistrement');
  } finally {
    setLoading(false);
  }
};

  // Gestion de la pagination
  const handleTableChange = (pagination) => {
    loadPrestations(pagination.current, pagination.pageSize);
  };

  // Gestion de la sélection
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  // Export
  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await prestationsAPI.exportPrestations(filters);
      
      if (response instanceof Blob) {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prestations_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        message.success('Export réussi');
      }
    } catch (error) {
      console.error('Erreur export:', error);
      message.error('Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  // Colonnes de la table
  const columns = [
    {
      title: 'ID',
      dataIndex: 'COD_PREST',
      key: 'COD_PREST',
      width: 80,
      sorter: true,
    },
    {
      title: 'Bénéficiaire',
      dataIndex: 'beneficiaire_nom_complet',
      key: 'beneficiaire',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: '500' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            ID: {record.COD_BEN}
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'TYPE_PRESTATION',
      key: 'TYPE_PRESTATION',
      filters: typesPrestations.map(type => ({
        text: type.libelle,
        value: type.libelle,
      })),
      onFilter: (value, record) => record.TYPE_PRESTATION === value,
      render: (text) => (
        <Tag color="blue" style={{ marginRight: 0 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Libellé',
      dataIndex: 'LIB_PREST',
      key: 'LIB_PREST',
      ellipsis: true,
    },
    {
      title: 'Date',
      dataIndex: 'DATE_PRESTATION',
      key: 'DATE_PRESTATION',
      width: 120,
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
      sorter: (a, b) => new Date(a.DATE_PRESTATION) - new Date(b.DATE_PRESTATION),
    },
    {
      title: 'Montant (FCFA)',
      dataIndex: 'MONTANT',
      key: 'MONTANT',
      width: 150,
      render: (amount) => (
        <div style={{ textAlign: 'right', fontWeight: '500' }}>
          {parseInt(amount).toLocaleString('fr-FR')}
        </div>
      ),
      sorter: (a, b) => a.MONTANT - b.MONTANT,
    },
    {
      title: 'Prise en charge',
      dataIndex: 'MONTANT_PRISE_CHARGE',
      key: 'MONTANT_PRISE_CHARGE',
      width: 150,
      render: (amount, record) => (
        <div>
          <div style={{ textAlign: 'right', fontWeight: '500' }}>
            {parseInt(amount || 0).toLocaleString('fr-FR')}
          </div>
          <div style={{ fontSize: '12px', color: '#666', textAlign: 'right' }}>
            {record.TAUX_PRISE_CHARGE}%
          </div>
        </div>
      ),
    },
    {
      title: 'Statut paiement',
      dataIndex: 'STATUT_PAIEMENT',
      key: 'STATUT_PAIEMENT',
      width: 130,
      render: (statut) => {
        const statusConfig = {
          'paye': { color: 'green', text: 'Payé' },
          'impaye': { color: 'red', text: 'Impayé' },
          'partiel': { color: 'orange', text: 'Partiel' },
          'en_attente': { color: 'gold', text: 'En attente' },
        };
        const config = statusConfig[statut?.toLowerCase()] || { color: 'default', text: statut };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: [
        { text: 'Payé', value: 'paye' },
        { text: 'Impayé', value: 'impaye' },
        { text: 'Partiel', value: 'partiel' },
        { text: 'En attente', value: 'en_attente' },
      ],
      onFilter: (value, record) => record.STATUT_PAIEMENT === value,
    },
    {
      title: 'Statut déclaration',
      dataIndex: 'STATUT_DECLARATION',
      key: 'STATUT_DECLARATION',
      width: 150,
      render: (statut) => {
        const statusConfig = {
          'declare': { color: 'green', text: 'Déclaré' },
          'non_declare': { color: 'red', text: 'Non déclaré' },
          'en_cours': { color: 'orange', text: 'En cours' },
        };
        const config = statusConfig[statut?.toLowerCase()] || { color: 'default', text: statut };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir détails">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditPrestation(record)}
              size="small"
            />
          </Tooltip>
          {record.deleted_at ? (
            <Tooltip title="Restaurer">
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={() => handleRestore(record.id)}
                size="small"
              />
            </Tooltip>
          ) : (
            <Tooltip title="Supprimer">
              <Popconfirm
                title="Êtes-vous sûr de vouloir supprimer cette prestation ?"
                onConfirm={() => handleDeletePrestation(record.id)}
                okText="Oui"
                cancelText="Non"
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                />
              </Popconfirm>
            </Tooltip>
          )}
          {record.STATUT_DECLARATION === 'non_declare' && (
            <Tooltip title="Marquer comme déclaré">
              <Button
                type="text"
                icon={<FileTextOutlined />}
                onClick={() => handleMarkAsDeclared(record.id)}
                size="small"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Statistiques
  const statCards = [
    {
      title: 'Total Prestations',
      value: statistics.total,
      icon: <MedicineBoxOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Montant Total',
      value: `${parseInt(statistics.total_montant || 0).toLocaleString('fr-FR')} FCFA`,
      icon: <DollarOutlined />,
      color: '#52c41a',
    },
    {
      title: 'Prise en Charge',
      value: `${parseInt(statistics.total_prise_charge || 0).toLocaleString('fr-FR')} FCFA`,
      icon: <TeamOutlined />,
      color: '#fa8c16',
    },
    {
      title: 'Reste à Charge',
      value: `${parseInt((statistics.total_montant || 0) - (statistics.total_prise_charge || 0)).toLocaleString('fr-FR')} FCFA`,
      icon: <BarChartOutlined />,
      color: '#f5222d',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        {/* En-tête avec statistiques */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>Gestion des Prestations</h2>
                <p style={{ margin: 0, color: '#666' }}>
                  Gestion complète des prestations médicales et paramédicales
                </p>
              </div>
              <Space>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setFiltersVisible(true)}
                >
                  Filtres
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                  loading={loading}
                >
                  Exporter
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreatePrestation}
                >
                  Nouvelle Prestation
                </Button>
              </Space>
            </div>
          </Col>
          
          {/* Cartes de statistiques */}
          <Col span={24}>
            <Row gutter={16}>
              {statCards.map((stat, index) => (
                <Col span={6} key={index}>
                  <Card size="small">
                    <Statistic
                      title={stat.title}
                      value={stat.value}
                      prefix={React.cloneElement(stat.icon, { style: { color: stat.color } })}
                      valueStyle={{ color: stat.color }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>

        {/* Tableau des prestations */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={prestations}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowSelection={rowSelection}
          scroll={{ x: 1500 }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5}>
                  <strong>Total sélectionné ({selectedRowKeys.length})</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {prestations
                      .filter(p => selectedRowKeys.includes(p.id))
                      .reduce((sum, p) => sum + (p.MONTANT || 0), 0)
                      .toLocaleString('fr-FR')} FCFA
                  </div>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}>
                  <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {prestations
                      .filter(p => selectedRowKeys.includes(p.id))
                      .reduce((sum, p) => sum + (p.MONTANT_PRISE_CHARGE || 0), 0)
                      .toLocaleString('fr-FR')} FCFA
                  </div>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} colSpan={3} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {/* Modale de filtres */}
      <Drawer
        title="Filtres avancés"
        placement="right"
        onClose={() => setFiltersVisible(false)}
        open={filtersVisible}
        width={400}
      >
        <Form layout="vertical">
          <Form.Item label="Recherche">
            <Input
              placeholder="Rechercher par libellé, bénéficiaire..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Form.Item>

          <Form.Item label="Période">
            <RangePicker
              style={{ width: '100%' }}
              value={[
                filters.date_debut ? dayjs(filters.date_debut) : null,
                filters.date_fin ? dayjs(filters.date_fin) : null,
              ]}
              onChange={handleDateFilterChange}
            />
          </Form.Item>

          <Form.Item label="Type de prestation">
            <Select
              placeholder="Sélectionner un type"
              allowClear
              value={filters.type_prestation}
              onChange={(value) => handleFilterChange('type_prestation', value)}
            >
              {typesPrestations.map(type => (
                <Select.Option key={type.id} value={type.libelle}>
                  {type.libelle}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Bénéficiaire">
            <Select
              placeholder="Sélectionner un bénéficiaire"
              showSearch
              optionFilterProp="children"
              allowClear
              value={filters.cod_ben}
              onChange={(value) => handleFilterChange('cod_ben', value)}
            >
              {beneficiaires.map(ben => (
                <Select.Option key={ben.ID_BEN || ben.id} value={String(ben.ID_BEN || ben.id)}>
                  {ben.NOM_BEN || ben.nom} {ben.PRE_BEN || ben.prenom}
                  {ben.IDENTIFIANT_NATIONAL && ` (${ben.IDENTIFIANT_NATIONAL})`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Prestataire">
            <Select
              placeholder="Sélectionner un prestataire"
              allowClear
              value={filters.cod_prestataire}
              onChange={(value) => handleFilterChange('cod_prestataire', value)}
            >
              {prestataires.map(prest => (
                <Select.Option key={prest.COD_PRE || prest.id} value={String(prest.COD_PRE || prest.id)}>
                  {prest.NOM_PRESTATAIRE || prest.nom} {prest.PRENOM_PRESTATAIRE || prest.prenom}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Statut de paiement">
            <Select
              placeholder="Sélectionner un statut"
              allowClear
              value={filters.statut_paiement}
              onChange={(value) => handleFilterChange('statut_paiement', value)}
            >
              <Select.Option value="paye">Payé</Select.Option>
              <Select.Option value="impaye">Impayé</Select.Option>
              <Select.Option value="partiel">Partiel</Select.Option>
              <Select.Option value="en_attente">En attente</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Statut de déclaration">
            <Select
              placeholder="Sélectionner un statut"
              allowClear
              value={filters.statut_declaration}
              onChange={(value) => handleFilterChange('statut_declaration', value)}
            >
              <Select.Option value="declare">Déclaré</Select.Option>
              <Select.Option value="non_declare">Non déclaré</Select.Option>
              <Select.Option value="en_cours">En cours</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={resetFilters}>
                Réinitialiser
              </Button>
              <Button type="primary" onClick={applyFilters}>
                Appliquer les filtres
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Modale de création/modification */}
      <Modal
        title={modalType === 'create' ? 'Nouvelle Prestation' : 'Modifier Prestation'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitPrestation}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Bénéficiaire"
                name="COD_BEN"
                rules={[{ required: true, message: 'Le bénéficiaire est obligatoire' }]}
              >
                <Select
                  placeholder="Sélectionner un bénéficiaire"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                  loading={loading}
                >
                  {beneficiaires.map(ben => (
                    <Select.Option 
                      key={ben.ID_BEN || ben.id} 
                      value={String(ben.ID_BEN || ben.id)}
                    >
                      {ben.NOM_BEN || ben.nom} {ben.PRE_BEN || ben.prenom}
                      {ben.IDENTIFIANT_NATIONAL && ` (${ben.IDENTIFIANT_NATIONAL})`}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Type de prestation"
                name="TYPE_PRESTATION"
                rules={[{ required: true, message: 'Le type est obligatoire' }]}
              >
                <Select
                  placeholder="Sélectionner un type"
                  allowClear
                >
                  {typesPrestations.map(type => (
                    <Select.Option key={type.id} value={type.libelle}>
                      {type.libelle}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Code Tarif (LIC_TAR)"
                name="LIC_TAR"
                rules={[{ required: true, message: 'Le code tarif est obligatoire' }]}
              >
                <Input 
                  placeholder="Ex: CONSULT_GEN, MEDICAMENT, EXAMEN" 
                  onBlur={(e) => {
                    if (!form.getFieldValue('LIC_TAR') && form.getFieldValue('TYPE_PRESTATION')) {
                      const tarValue = form.getFieldValue('TYPE_PRESTATION').replace(/\s+/g, '_').toUpperCase();
                      form.setFieldValue('LIC_TAR', tarValue);
                    }
                  }}
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                label="Libellé Nomenclature (LIC_NOM)"
                name="LIC_NOM"
                rules={[{ required: true, message: 'Le libellé nomenclature est obligatoire' }]}
              >
                <Input 
                  placeholder="Ex: Consultation Générale, Médicaments..." 
                  onBlur={(e) => {
                    if (!form.getFieldValue('LIC_NOM')) {
                      const libValue = form.getFieldValue('LIB_PREST') || form.getFieldValue('TYPE_PRESTATION') || 'Prestation';
                      form.setFieldValue('LIC_NOM', libValue);
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Libellé de la prestation"
            name="LIB_PREST"
            rules={[{ required: true, message: 'Le libellé est obligatoire' }]}
          >
            <Input placeholder="Ex: Consultation générale, Médicaments..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Date"
                name="DATE_PRESTATION"
                rules={[{ required: true, message: 'La date est obligatoire' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Montant (FCFA)"
                name="MONTANT"
                rules={[
                  { required: true, message: 'Le montant est obligatoire' },
                  { type: 'number', min: 0, message: 'Le montant doit être positif' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                  parser={value => value.replace(/\s/g, '')}
                  min={0}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Montant Prévisionnel (MLT_PRE)"
                name="MLT_PRE"
                rules={[
                  { required: true, message: 'Le montant prévisionnel est obligatoire' },
                  { type: 'number', min: 0, message: 'Le montant doit être positif' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                  parser={value => value.replace(/\s/g, '')}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Quantité"
                name="QUANTITE"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  defaultValue={1}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Taux de prise en charge (%)"
                name="TAUX_PRISE_CHARGE"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  defaultValue={100}
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Prestataire"
                name="COD_PRESTATAIRE"
              >
                <Select
                  placeholder="Sélectionner un prestataire"
                  allowClear
                  loading={loading}
                >
                  {prestataires.map(prest => (
                    <Select.Option key={prest.COD_PRE || prest.id} value={String(prest.COD_PRE || prest.id)}>
                      {prest.NOM_PRESTATAIRE || prest.nom} {prest.PRENOM_PRESTATAIRE || prest.prenom}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
<Row gutter={16}>
  <Col span={12}>
    <Form.Item
      label="Contrat (COD_POL)"
      name="COD_CONTRAT"
    >
      <InputNumber
        style={{ width: '100%' }}
        placeholder="Code contrat"
        min={0}
      />
    </Form.Item>
  </Col>
  <Col span={12}>
    <Form.Item
      label="Type prestation (COD_TYP_PRES)"
      name="COD_TYP_PRES"
    >
      <Input placeholder="Code type prestation" />
    </Form.Item>
  </Col>
</Row>

<Form.Item
  label="Numéro de barre (NUM_BAR)"
  name="NUM_BAR"
>
  <Input placeholder="Numéro de barre ou code barre" />
</Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Statut de paiement"
                name="STATUT_PAIEMENT"
              >
                <Select defaultValue="impaye">
                  <Select.Option value="impaye">Impayé</Select.Option>
                  <Select.Option value="paye">Payé</Select.Option>
                  <Select.Option value="partiel">Partiel</Select.Option>
                  <Select.Option value="en_attente">En attente</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Statut de déclaration"
                name="STATUT_DECLARATION"
              >
                <Select defaultValue="non_declare">
                  <Select.Option value="non_declare">Non déclaré</Select.Option>
                  <Select.Option value="declare">Déclaré</Select.Option>
                  <Select.Option value="en_cours">En cours</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Observations"
            name="OBSERVATIONS"
          >
            <TextArea
              rows={3}
              placeholder="Notes, détails complémentaires..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Drawer de détails */}
      <Drawer
        title="Détails de la prestation"
        placement="right"
        onClose={() => setPrestationDetailsVisible(false)}
        open={prestationDetailsVisible}
        width={600}
      >
        {selectedPrestation && (
          <>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="ID">
                <Tag color="blue">{selectedPrestation.COD_PREST}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Bénéficiaire">
                <strong>{selectedPrestation.beneficiaire_nom_complet}</strong>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  ID: {selectedPrestation.COD_BEN}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Type de prestation">
                <Tag color="blue">{selectedPrestation.TYPE_PRESTATION}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Libellé">
                {selectedPrestation.LIB_PREST}
              </Descriptions.Item>
              <Descriptions.Item label="Code Tarif">
                {selectedPrestation.LIC_TAR}
              </Descriptions.Item>
              <Descriptions.Item label="Libellé Nomenclature">
                {selectedPrestation.LIC_NOM}
              </Descriptions.Item>
              <Descriptions.Item label="Date">
                {selectedPrestation.DATE_PRESTATION ? dayjs(selectedPrestation.DATE_PRESTATION).format('DD/MM/YYYY') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Montant total">
                <strong style={{ color: '#1890ff' }}>
                  {parseInt(selectedPrestation.MONTANT || 0).toLocaleString('fr-FR')} FCFA
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Montant prévisionnel">
                <strong style={{ color: '#722ed1' }}>
                  {parseInt(selectedPrestation.MLT_PRE || 0).toLocaleString('fr-FR')} FCFA
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Quantité">
                {selectedPrestation.QUANTITE || 1}
              </Descriptions.Item>
              <Descriptions.Item label="Taux de prise en charge">
                {selectedPrestation.TAUX_PRISE_CHARGE}%
              </Descriptions.Item>
              <Descriptions.Item label="Montant prise en charge">
                <strong style={{ color: '#52c41a' }}>
                  {parseInt(selectedPrestation.MONTANT_PRISE_CHARGE || 0).toLocaleString('fr-FR')} FCFA
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Reste à charge">
                <strong style={{ color: '#f5222d' }}>
                  {parseInt((selectedPrestation.MONTANT || 0) - (selectedPrestation.MONTANT_PRISE_CHARGE || 0)).toLocaleString('fr-FR')} FCFA
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Statut de paiement">
                {selectedPrestation.STATUT_PAIEMENT === 'paye' ? (
                  <Tag color="green">Payé</Tag>
                ) : selectedPrestation.STATUT_PAIEMENT === 'impaye' ? (
                  <Tag color="red">Impayé</Tag>
                ) : (
                  <Tag color="orange">{selectedPrestation.STATUT_PAIEMENT}</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Statut de déclaration">
                {selectedPrestation.STATUT_DECLARATION === 'declare' ? (
                  <Tag color="green">Déclaré</Tag>
                ) : (
                  <Tag color="red">Non déclaré</Tag>
                )}
              </Descriptions.Item>
              {selectedPrestation.COD_DECL && (
                <Descriptions.Item label="Déclaration associée">
                  <Tag color="green">ID: {selectedPrestation.COD_DECL}</Tag>
                </Descriptions.Item>
              )}
              {selectedPrestation.COD_PRESTATAIRE && (
                <Descriptions.Item label="Prestataire">
                  {selectedPrestation.prestataire_nom_complet}
                </Descriptions.Item>
              )}
              {selectedPrestation.OBSERVATIONS && (
                <Descriptions.Item label="Observations">
                  {selectedPrestation.OBSERVATIONS}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Date de création">
                {selectedPrestation.created_at ? dayjs(selectedPrestation.created_at).format('DD/MM/YYYY HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Dernière modification">
                {selectedPrestation.updated_at ? dayjs(selectedPrestation.updated_at).format('DD/MM/YYYY HH:mm') : '-'}
              </Descriptions.Item>
              {selectedPrestation.deleted_at && (
                <Descriptions.Item label="Supprimé le">
                  <Tag color="red">
                    {dayjs(selectedPrestation.deleted_at).format('DD/MM/YYYY HH:mm')}
                  </Tag>
                </Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setPrestationDetailsVisible(false);
                    handleEditPrestation(selectedPrestation);
                  }}
                >
                  Modifier
                </Button>
                {selectedPrestation.STATUT_DECLARATION === 'non_declare' && (
                  <Button
                    icon={<FileTextOutlined />}
                    onClick={() => handleMarkAsDeclared(selectedPrestation.id)}
                  >
                    Marquer comme déclaré
                  </Button>
                )}
                {selectedPrestation.deleted_at ? (
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => handleRestore(selectedPrestation.id)}
                  >
                    Restaurer
                  </Button>
                ) : (
                  <Popconfirm
                    title="Êtes-vous sûr de vouloir supprimer cette prestation ?"
                    onConfirm={() => handleDeletePrestation(selectedPrestation.id)}
                    okText="Oui"
                    cancelText="Non"
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      Supprimer
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default PrestationsManagementPage;