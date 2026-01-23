// src/pages/UrgencesPage.jsx - VERSION ANT DESIGN
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Table,
  Tag,
  Space,
  DatePicker,
  TimePicker,
  Avatar,
  Divider,
  List,
  Descriptions,
  Alert,
  Progress,
  Tooltip,
  Popconfirm,
  Spin,
  Tabs,
  Badge,
  Typography,
  Upload,
  message,
  Drawer,
  Collapse
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  FilterOutlined,
  DownloadOutlined,
  UploadOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  HeartOutlined,
  AlertOutlined,
  ScheduleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,

} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/fr';

// Import API
import api from '../../services/api';
const { consultations, prestataires } = api;

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

// ==============================================
// CONSTANTES ET FONCTIONS UTILITAIRES
// ==============================================

const STATUS_OPTIONS = [
  { value: 'en_attente', label: 'En attente', color: 'warning', icon: <ClockCircleOutlined /> },
  { value: 'en_cours', label: 'En cours', color: 'processing', icon: <MedicineBoxOutlined /> },
  { value: 'traite', label: 'Traité', color: 'success', icon: <CheckCircleOutlined /> },
  { value: 'transfere', label: 'Transféré', color: 'blue', icon: <TeamOutlined /> },
  { value: 'decede', label: 'Décédé', color: 'error', icon: <CloseOutlined /> },
  { value: 'abandon', label: 'Abandon', color: 'default', icon: <CloseOutlined /> }
];

const PRIORITY_OPTIONS = [
  { value: 1, label: 'URGENT ABSOLU', color: 'error', icon: <ExclamationCircleOutlined /> },
  { value: 2, label: 'Urgent', color: 'warning', icon: <WarningOutlined /> },
  { value: 3, label: 'Semi-urgent', color: 'info', icon: <InfoCircleOutlined /> },
  { value: 4, label: 'Non urgent', color: 'success', icon: <CheckCircleOutlined /> }
];

const SERVICES = [
  'Général',
  'Chirurgie',
  'Pédiatrie',
  'Gynécologie',
  'Traumatologie',
  'Cardiologie',
  'Neurologie',
  'Psychiatrie'
];

// Fonctions utilitaires
const getSafeDate = (dateString, defaultValue = moment()) => {
  if (!dateString) return defaultValue;
  try {
    return moment(dateString).isValid() ? moment(dateString) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const formatSafeDate = (date, formatStr = 'DD/MM/YYYY') => {
  if (!date) return 'N/A';
  try {
    return moment(date).format(formatStr);
  } catch {
    return 'N/A';
  }
};

const getSafeValue = (value, defaultValue = '') => {
  if (value === undefined || value === null) return defaultValue;
  return value;
};

const calculateWaitingTime = (arrivalTime) => {
  if (!arrivalTime) return null;
  
  try {
    const arrival = moment(arrivalTime);
    const now = moment();
    const diffMinutes = now.diff(arrival, 'minutes');
    
    if (isNaN(diffMinutes) || diffMinutes < 0) return null;
    
    return diffMinutes;
  } catch {
    return null;
  }
};

// ==============================================
// COMPOSANTS RÉUTILISABLES
// ==============================================

const UrgenceStatusTag = ({ status }) => {
  const config = STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[0];
  return (
    <Tag color={config.color} icon={config.icon}>
      {config.label}
    </Tag>
  );
};

const PriorityTag = ({ priority }) => {
  const safePriority = getSafeValue(priority, 3);
  const config = PRIORITY_OPTIONS.find(opt => opt.value === safePriority) || PRIORITY_OPTIONS[2];
  return (
    <Tag color={config.color} icon={config.icon}>
      {config.label}
    </Tag>
  );
};

const WaitingTimeTag = ({ arrivalTime }) => {
  const diffMinutes = calculateWaitingTime(arrivalTime);
  
  if (diffMinutes === null) {
    return <Tag>N/A</Tag>;
  }
  
  let color = 'success';
  let label = `${diffMinutes} min`;
  
  if (diffMinutes > 120) {
    color = 'error';
  } else if (diffMinutes > 60) {
    color = 'warning';
  } else if (diffMinutes > 30) {
    color = 'blue';
  }
  
  return <Tag color={color}>{label}</Tag>;
};

// ==============================================
// DIALOG DE DÉTAILS D'URGENCE
// ==============================================

const UrgenceDetailDrawer = ({ 
  open, 
  onClose, 
  urgence, 
  onStatusChange,
  onPriorityChange 
}) => {
  const [loading, setLoading] = useState(false);

  if (!urgence) return null;

  const formatFullDate = (date, heure) => {
    try {
      return moment(date).format('DD/MM/YYYY HH:mm');
    } catch {
      return 'N/A';
    }
  };

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      await onStatusChange(urgence.id, newStatus);
      message.success('Statut mis à jour');
    } catch (error) {
      message.error('Erreur lors de la mise à jour du statut');
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    setLoading(true);
    try {
      await onPriorityChange(urgence.id, newPriority);
      message.success('Priorité mise à jour');
    } catch (error) {
      message.error('Erreur lors de la mise à jour de la priorité');
    } finally {
      setLoading(false);
    }
  };

  const patientInfo = (
    <Card 
      title="Informations Patient"
      size="small"
      extra={
        <Button 
          type="link" 
          icon={<EditOutlined />}
          onClick={() => message.info('Modification patient à implémenter')}
        >
          Modifier
        </Button>
      }
    >
      <Descriptions column={2} size="small">
        <Descriptions.Item label="Nom complet">
          <Space>
            <Avatar 
              size="small"
              style={{ backgroundColor: '#1890ff' }}
              icon={<UserOutlined />}
            />
            <span>
              {getSafeValue(urgence.patient_prenom)} {getSafeValue(urgence.patient_nom)}
            </span>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="ID Patient">
          {getSafeValue(urgence.patient_id, 'N/A')}
        </Descriptions.Item>
        <Descriptions.Item label="Âge">
          35 ans {/* À remplacer par le calcul d'âge réel */}
        </Descriptions.Item>
        <Descriptions.Item label="Sexe">
          Masculin {/* À remplacer par les données réelles */}
        </Descriptions.Item>
        <Descriptions.Item label="Téléphone">
          <PhoneOutlined /> 06 12 34 56 78
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          <MailOutlined /> patient@example.com
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );

  const admissionInfo = (
    <Card title="Admission" size="small">
      <List size="small">
        <List.Item>
          <List.Item.Meta
            avatar={<CalendarOutlined />}
            title="Date et heure d'arrivée"
            description={formatFullDate(urgence.date_arrivee, urgence.heure_arrivee)}
          />
        </List.Item>
        <List.Item>
          <List.Item.Meta
            avatar={<ClockCircleOutlined />}
            title="Temps d'attente"
            description={<WaitingTimeTag arrivalTime={urgence.date_arrivee} />}
          />
        </List.Item>
        <List.Item>
          <List.Item.Meta
            avatar={<EnvironmentOutlined />}
            title="Service"
            description={getSafeValue(urgence.service, 'Non spécifié')}
          />
        </List.Item>
      </List>
    </Card>
  );

  const medicalInfo = (
    <Card title="Évaluation Médicale" size="small">
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Motif">
          {getSafeValue(urgence.motif, 'Non spécifié')}
        </Descriptions.Item>
        <Descriptions.Item label="Symptômes">
          {getSafeValue(urgence.symptomes, 'Non spécifié')}
        </Descriptions.Item>
        <Descriptions.Item label="Gravité">
          {getSafeValue(urgence.gravite, 'Non évaluée')}
        </Descriptions.Item>
        <Descriptions.Item label="Allergies">
          Aucune connue
        </Descriptions.Item>
        <Descriptions.Item label="Antécédents">
          Hypertension artérielle
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );

  const medicalTeam = (
    <Card title="Équipe Médicale" size="small">
      <List size="small">
        <List.Item>
          <List.Item.Meta
            avatar={
              <Avatar 
                size="small"
                style={{ backgroundColor: '#52c41a' }}
              />
            }
            title="Médecin traitant"
            description={getSafeValue(urgence.medecin_nom, 'Non affecté')}
          />
          <Button type="link" size="small">Contacter</Button>
        </List.Item>
        <List.Item>
          <List.Item.Meta
            avatar={
              <Avatar 
                size="small"
                style={{ backgroundColor: '#722ed1' }}
                icon={<UserOutlined />}
              />
            }
            title="Infirmier(ère)"
            description="Marie Dupont"
          />
          <Button type="link" size="small">Contacter</Button>
        </List.Item>
      </List>
    </Card>
  );

  const quickActions = (
    <Card 
      title="Actions Rapides" 
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Row gutter={[8, 8]}>
        <Col span={12}>
          <Select
            value={urgence.statut || 'en_attente'}
            onChange={handleStatusChange}
            style={{ width: '100%' }}
            size="small"
            loading={loading}
          >
            {STATUS_OPTIONS.map(option => (
              <Option key={option.value} value={option.value}>
                <Tag color={option.color}>
                  {option.icon} {option.label}
                </Tag>
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={12}>
          <Select
            value={urgence.priorite || 3}
            onChange={handlePriorityChange}
            style={{ width: '100%' }}
            size="small"
            loading={loading}
          >
            {PRIORITY_OPTIONS.map(option => (
              <Option key={option.value} value={option.value}>
                <Tag color={option.color}>
                  {option.icon} {option.label}
                </Tag>
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={8}>
          <Button block size="small" icon={<FileTextOutlined />}>
            Prescrire
          </Button>
        </Col>
        <Col span={8}>
          <Button block size="small" icon={<MedicineBoxOutlined />}>
            Médicaments
          </Button>
        </Col>
        <Col span={8}>
          <Button block size="small" icon={<TeamOutlined />}>
            Transférer
          </Button>
        </Col>
      </Row>
    </Card>
  );

  return (
    <Drawer
      title="Détails de l'Urgence"
      placement="right"
      width={720}
      onClose={onClose}
      open={open}
      extra={
        <Space>
          <Button onClick={onClose}>Fermer</Button>
          <Button type="primary" icon={<EditOutlined />}>
            Modifier
          </Button>
        </Space>
      }
    >
      {quickActions}
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          {patientInfo}
        </Col>
        <Col span={12}>
          {admissionInfo}
        </Col>
        <Col span={12}>
          {medicalInfo}
        </Col>
        <Col span={24}>
          {medicalTeam}
        </Col>
      </Row>

      <Divider />

      <Collapse ghost>
        <Panel header="Notes et Observations" key="1">
          <TextArea
            defaultValue={getSafeValue(urgence.notes, 'Aucune note')}
            rows={4}
            placeholder="Ajouter des notes..."
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" size="small">
              Enregistrer
            </Button>
          </div>
        </Panel>
        <Panel header="Historique des modifications" key="2">
          <List
            size="small"
            dataSource={[
              { action: 'Statut changé', from: 'En attente', to: 'En cours', date: '10 min ago', user: 'Dr. Smith' },
              { action: 'Priorité mise à jour', from: 'Urgent', to: 'URGENT ABSOLU', date: '15 min ago', user: 'Inf. Dupont' },
              { action: 'Note ajoutée', description: 'Patient stable', date: '20 min ago', user: 'Dr. Johnson' },
            ]}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={`${item.action} - ${item.user}`}
                  description={
                    <Space direction="vertical" size={0}>
                      {item.from && (
                        <Text type="secondary">
                          De: <Tag color="default">{item.from}</Tag> → À: <Tag color="blue">{item.to}</Tag>
                        </Text>
                      )}
                      {item.description && (
                        <Text type="secondary">{item.description}</Text>
                      )}
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {item.date}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Panel>
      </Collapse>
    </Drawer>
  );
};

// ==============================================
// MODAL DE CRÉATION/MODIFICATION D'URGENCE
// ==============================================

const UrgenceModal = ({ open, onClose, onSave, initialData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [patientsList, setPatientsList] = useState([]);
  const [medecinsList, setMedecinsList] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingMedecins, setLoadingMedecins] = useState(false);
  
  const isEdit = Boolean(initialData?.id);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        date_arrivee: initialData.date_arrivee ? moment(initialData.date_arrivee) : moment(),
        heure_arrivee: initialData.heure_arrivee ? moment(initialData.heure_arrivee, 'HH:mm:ss') : moment()
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        date_arrivee: moment(),
        heure_arrivee: moment(),
        priorite: 3,
        gravite: 3,
        service: 'Général',
        statut: 'en_attente'
      });
    }
  }, [initialData, form]);

  const handleSearchPatient = async (value) => {
    if (value.length < 2) {
      setPatientsList([]);
      return;
    }
    
    setLoadingPatients(true);
    try {
      const response = await consultations.searchPatientsAdvanced(value, {}, 10, 1);
      if (response.success) {
        const patients = response.beneficiaires || response.patients || [];
        setPatientsList(patients);
      }
    } catch (error) {
      console.error('Erreur recherche patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleSearchMedecin = async (value) => {
    if (value.length < 2) {
      setMedecinsList([]);
      return;
    }
    
    setLoadingMedecins(true);
    try {
      const response = await prestataires.searchQuick(value, 10);
      if (response.success) {
        const medecins = response.prestataires || [];
        setMedecinsList(medecins);
      }
    } catch (error) {
      console.error('Erreur recherche médecins:', error);
    } finally {
      setLoadingMedecins(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const urgenceData = {
        ...values,
        date_arrivee: values.date_arrivee.format('YYYY-MM-DD'),
        heure_arrivee: values.heure_arrivee.format('HH:mm:ss'),
        type_consultation: 'urgence',
        is_urgence: true
      };
      
      await onSave(urgenceData, isEdit);
      onClose();
      message.success(isEdit ? 'Urgence modifiée avec succès' : 'Urgence créée avec succès');
    } catch (error) {
      console.error('Erreur sauvegarde urgence:', error);
      message.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Modifier une Urgence' : 'Nouvelle Admission aux Urgences'}
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Annuler
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
          icon={isEdit ? <EditOutlined /> : <PlusOutlined />}
        >
          {isEdit ? 'Modifier' : 'Enregistrer'}
        </Button>
      ]}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          priorite: 3,
          gravite: 3,
          service: 'Général',
          statut: 'en_attente'
        }}
      >
        <Tabs defaultActiveKey="patient">
          <TabPane tab="Patient" key="patient">
            <Form.Item
              name="patient_id"
              label="Patient"
              rules={[{ required: true, message: 'Veuillez sélectionner un patient' }]}
            >
              <Select
                showSearch
                placeholder="Rechercher un patient..."
                onSearch={handleSearchPatient}
                loading={loadingPatients}
                filterOption={false}
                optionLabelProp="label"
              >
                {patientsList.map(patient => (
                  <Option 
                    key={patient.id || patient.ID_BEN} 
                    value={patient.id || patient.ID_BEN}
                    label={`${patient.prenom || patient.PRE_BEN} ${patient.nom || patient.NOM_BEN}`}
                  >
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      <div>
                        <div>{patient.prenom || patient.PRE_BEN} {patient.nom || patient.NOM_BEN}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          ID: {patient.identifiant || patient.IDENTIFIANT_NATIONAL}
                        </Text>
                      </div>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="patient_nom"
                  label="Nom"
                  rules={[{ required: true, message: 'Veuillez saisir le nom' }]}
                >
                  <Input placeholder="Nom du patient" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="patient_prenom"
                  label="Prénom"
                  rules={[{ required: true, message: 'Veuillez saisir le prénom' }]}
                >
                  <Input placeholder="Prénom du patient" />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Admission" key="admission">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="date_arrivee"
                  label="Date d'arrivée"
                  rules={[{ required: true, message: 'Veuillez sélectionner la date' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="heure_arrivee"
                  label="Heure d'arrivée"
                  rules={[{ required: true, message: 'Veuillez sélectionner l\'heure' }]}
                >
                  <TimePicker style={{ width: '100%' }} format="HH:mm" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="service"
              label="Service"
              rules={[{ required: true, message: 'Veuillez sélectionner le service' }]}
            >
              <Select>
                {SERVICES.map(service => (
                  <Option key={service} value={service}>{service}</Option>
                ))}
              </Select>
            </Form.Item>
          </TabPane>

          <TabPane tab="Évaluation" key="evaluation">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="gravite"
                  label="Gravité"
                  rules={[{ required: true, message: 'Veuillez sélectionner la gravité' }]}
                >
                  <Select>
                    <Option value={1}>Critique</Option>
                    <Option value={2}>Sévère</Option>
                    <Option value={3}>Modérée</Option>
                    <Option value={4}>Légère</Option>
                    <Option value={5}>Minime</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="priorite"
                  label="Priorité"
                  rules={[{ required: true, message: 'Veuillez sélectionner la priorité' }]}
                >
                  <Select>
                    {PRIORITY_OPTIONS.map(option => (
                      <Option key={option.value} value={option.value}>
                        <Tag color={option.color}>{option.label}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="motif"
              label="Motif de consultation"
              rules={[{ required: true, message: 'Veuillez saisir le motif' }]}
            >
              <TextArea rows={2} placeholder="Description du motif principal" />
            </Form.Item>

            <Form.Item
              name="symptomes"
              label="Symptômes"
            >
              <TextArea rows={3} placeholder="Symptômes présentés par le patient" />
            </Form.Item>
          </TabPane>

          <TabPane tab="Affectation" key="affectation">
            <Form.Item
              name="medecin_id"
              label="Médecin"
            >
              <Select
                showSearch
                placeholder="Rechercher un médecin..."
                onSearch={handleSearchMedecin}
                loading={loadingMedecins}
                filterOption={false}
                optionLabelProp="label"
              >
                {medecinsList.map(medecin => (
                  <Option 
                    key={medecin.id || medecin.COD_PRE} 
                    value={medecin.id || medecin.COD_PRE}
                    label={`${medecin.prenom || medecin.PRENOM_PRESTATAIRE} ${medecin.nom || medecin.NOM_PRESTATAIRE}`}
                  >
                    <Space>
                      <Avatar size="small" />
                      <div>
                        <div>{medecin.prenom || medecin.PRENOM_PRESTATAIRE} {medecin.nom || medecin.NOM_PRESTATAIRE}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {medecin.specialite || medecin.SPECIALITE || 'Spécialité non définie'}
                        </Text>
                      </div>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="statut"
              label="Statut"
              rules={[{ required: true, message: 'Veuillez sélectionner le statut' }]}
            >
              <Select>
                {STATUS_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    <Tag color={option.color}>{option.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="notes"
              label="Notes supplémentaires"
            >
              <TextArea rows={3} placeholder="Informations complémentaires" />
            </Form.Item>
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
};

// ==============================================
// PAGE PRINCIPALE DES URGENCES
// ==============================================

const UrgencesPage = () => {
  // États principaux
  const [urgences, setUrgences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour les modales
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUrgence, setSelectedUrgence] = useState(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  
  // États pour la pagination et le tri
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    statut: 'tous',
    priorite: 'tous',
    service: 'tous',
    dateRange: [moment().subtract(7, 'days'), moment()],
    search: ''
  });

  const [updatingStatus, setUpdatingStatus] = useState({});
  const [updatingPriority, setUpdatingPriority] = useState({});

  // Chargement des urgences
  const loadUrgences = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = {};
      
      if (filters.dateRange?.[0]) {
        queryParams.date_debut = filters.dateRange[0].format('YYYY-MM-DD');
      }
      
      if (filters.dateRange?.[1]) {
        queryParams.date_fin = filters.dateRange[1].format('YYYY-MM-DD');
      }
      
      queryParams.is_urgence = true;
      queryParams.type_consultation = 'urgence';
      
      const response = await consultations.getAllConsultations(queryParams);
      
      if (response.success) {
        const urgencesList = (response.consultations || []).map(cons => {
          const dateArrivee = cons.DATE_CONSULTATION || cons.date_arrivee || cons.date_consultation;
          const heureArrivee = cons.HEURE_CONSULTATION || cons.heure_arrivee || cons.heure_consultation;
          
          return {
            id: getSafeValue(cons.COD_CONS || cons.id || cons.ID_CONSULTATION, Date.now()),
            patient_id: getSafeValue(cons.ID_BEN || cons.patient_id || cons.COD_BEN),
            patient_nom: getSafeValue(cons.NOM_BEN || cons.patient_nom || cons.nom_patient, 'Inconnu'),
            patient_prenom: getSafeValue(cons.PRE_BEN || cons.patient_prenom || cons.prenom_patient, ''),
            date_arrivee: dateArrivee,
            heure_arrivee: heureArrivee,
            motif: getSafeValue(cons.MOTIF_CONSULTATION || cons.motif, 'Non spécifié'),
            symptomes: getSafeValue(cons.SYMPTOMES || cons.symptomes, ''),
            gravite: getSafeValue(cons.GRAVITE || cons.gravite, 3),
            priorite: getSafeValue(cons.PRIORITE || cons.priorite, 3),
            medecin_id: getSafeValue(cons.COD_MED || cons.medecin_id),
            medecin_nom: getSafeValue(cons.NOM_MEDECIN || cons.medecin_nom || cons.nom_medecin, 'Non affecté'),
            service: getSafeValue(cons.SERVICE || cons.service, 'Général'),
            notes: getSafeValue(cons.OBSERVATIONS || cons.notes, ''),
            statut: getSafeValue(cons.STATUT_CONSULTATION || cons.statut || cons.statut_consultation, 'en_attente'),
            created_at: getSafeValue(cons.DAT_CREUTIL || cons.created_at, moment().toISOString()),
            updated_at: getSafeValue(cons.DAT_MODUTIL || cons.updated_at, moment().toISOString())
          };
        });
        
        setUrgences(urgencesList);
        setPagination(prev => ({ ...prev, total: urgencesList.length }));
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des urgences');
      }
    } catch (error) {
      console.error('Erreur chargement urgences:', error);
      setError(error.message);
      message.error('Erreur lors du chargement des urgences');
    } finally {
      setLoading(false);
    }
  }, [filters.dateRange]);

  // Calcul des statistiques
  const stats = useMemo(() => {
    const statsData = {
      total: urgences.length,
      en_attente: 0,
      en_cours: 0,
      traite: 0,
      transfere: 0,
      decede: 0,
      abandon: 0,
      urgent_absolu: 0,
      urgent: 0,
      semi_urgent: 0,
      non_urgent: 0
    };

    urgences.forEach(urgence => {
      const statut = getSafeValue(urgence.statut, 'en_attente');
      const priorite = getSafeValue(urgence.priorite, 3);
      
      if (statsData[statut] !== undefined) {
        statsData[statut] = (statsData[statut] || 0) + 1;
      }
      
      switch (priorite) {
        case 1: statsData.urgent_absolu++; break;
        case 2: statsData.urgent++; break;
        case 3: statsData.semi_urgent++; break;
        case 4: statsData.non_urgent++; break;
      }
    });

    return statsData;
  }, [urgences]);

  // Application des filtres et tri
  const filteredUrgences = useMemo(() => {
    let filtered = [...urgences];
    
    // Filtre par statut
    if (filters.statut !== 'tous') {
      filtered = filtered.filter(u => getSafeValue(u.statut) === filters.statut);
    }
    
    // Filtre par priorité
    if (filters.priorite !== 'tous') {
      filtered = filtered.filter(u => getSafeValue(u.priorite, 3) === parseInt(filters.priorite));
    }
    
    // Filtre par service
    if (filters.service !== 'tous') {
      filtered = filtered.filter(u => getSafeValue(u.service) === filters.service);
    }
    
    // Filtre par date
    if (filters.dateRange?.[0]) {
      const dateDebut = filters.dateRange[0];
      filtered = filtered.filter(u => {
        const dateUrgence = moment(u.date_arrivee);
        return dateUrgence >= dateDebut;
      });
    }
    
    if (filters.dateRange?.[1]) {
      const dateFin = filters.dateRange[1].endOf('day');
      filtered = filtered.filter(u => {
        const dateUrgence = moment(u.date_arrivee);
        return dateUrgence <= dateFin;
      });
    }
    
    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(u => {
        const nom = getSafeValue(u.patient_nom, '').toLowerCase();
        const prenom = getSafeValue(u.patient_prenom, '').toLowerCase();
        const motif = getSafeValue(u.motif, '').toLowerCase();
        const service = getSafeValue(u.service, '').toLowerCase();
        const medecin = getSafeValue(u.medecin_nom, '').toLowerCase();
        
        return nom.includes(searchLower) ||
               prenom.includes(searchLower) ||
               motif.includes(searchLower) ||
               service.includes(searchLower) ||
               medecin.includes(searchLower);
      });
    }
    
    return filtered;
  }, [urgences, filters]);

  // Gestion des urgences
  const handleCreateUrgence = () => {
    setSelectedUrgence(null);
    setModalOpen(true);
  };

  const handleEditUrgence = (urgence) => {
    setSelectedUrgence(urgence);
    setModalOpen(true);
  };

  const handleViewUrgence = (urgence) => {
    setSelectedUrgence(urgence);
    setDetailDrawerOpen(true);
  };

  const handleDeleteUrgence = async (id) => {
    Modal.confirm({
      title: 'Supprimer l\'urgence',
      content: 'Êtes-vous sûr de vouloir supprimer cette urgence ?',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          setUrgences(prev => prev.filter(u => u.id !== id));
          message.success('Urgence supprimée avec succès');
        } catch (error) {
          console.error('Erreur suppression urgence:', error);
          message.error('Erreur lors de la suppression');
        }
      }
    });
  };

  const handleSaveUrgence = async (urgenceData, isEdit) => {
    try {
      if (isEdit) {
        setUrgences(prev => prev.map(u => 
          u.id === urgenceData.id ? { 
            ...u, 
            ...urgenceData,
            updated_at: moment().toISOString()
          } : u
        ));
      } else {
        const newUrgence = {
          ...urgenceData,
          id: Date.now(),
          created_at: moment().toISOString(),
          updated_at: moment().toISOString()
        };
        setUrgences(prev => [newUrgence, ...prev]);
      }
    } catch (error) {
      console.error('Erreur sauvegarde urgence:', error);
      throw error;
    }
  };

  // Gestion des changements de statut
  const handleStatusChange = async (urgenceId, newStatus) => {
    let oldStatus;
    try {
      const urgenceToUpdate = urgences.find(u => u.id === urgenceId);
      if (!urgenceToUpdate) return;

      oldStatus = urgenceToUpdate.statut;
      
      setUpdatingStatus(prev => ({ ...prev, [urgenceId]: true }));

      // Mettre à jour l'état local
      const updatedUrgence = {
        ...urgenceToUpdate,
        statut: newStatus,
        updated_at: moment().toISOString()
      };
      
      setUrgences(prev => prev.map(u => 
        u.id === urgenceId ? updatedUrgence : u
      ));

      // Préparer les données pour le backend
      const updateData = {
        STATUT_CONSULTATION: newStatus,
        OBSERVATIONS: `${urgenceToUpdate.notes || ''} | Statut changé de ${oldStatus} à ${newStatus} - ${moment().format('DD/MM/YYYY HH:mm')}`,
        id: urgenceId,
        COD_CONS: urgenceId,
        PRIORITE: urgenceToUpdate.priorite || 3
      };

      const response = await consultations.update(urgenceId, updateData);

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la mise à jour');
      }

      message.success('Statut mis à jour avec succès');

    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      // Revenir à l'ancien statut en cas d'erreur
      if (oldStatus) {
        setUrgences(prev => prev.map(u => 
          u.id === urgenceId ? { ...u, statut: oldStatus } : u
        ));
      }
      message.error(`Erreur: ${error.message}`);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [urgenceId]: false }));
    }
  };

  // Gestion des changements de priorité
  const handlePriorityChange = async (urgenceId, newPriority) => {
    let oldPriority;
    try {
      const urgenceToUpdate = urgences.find(u => u.id === urgenceId);
      if (!urgenceToUpdate) return;

      oldPriority = urgenceToUpdate.priorite;
      
      setUpdatingPriority(prev => ({ ...prev, [urgenceId]: true }));

      // Mettre à jour l'état local
      const updatedUrgence = {
        ...urgenceToUpdate,
        priorite: parseInt(newPriority),
        updated_at: moment().toISOString()
      };
      
      setUrgences(prev => prev.map(u => 
        u.id === urgenceId ? updatedUrgence : u
      ));

      // Préparer les données pour le backend
      const updateData = {
        PRIORITE: parseInt(newPriority),
        OBSERVATIONS: `${urgenceToUpdate.notes || ''} | Priorité changée de ${oldPriority} à ${newPriority} - ${moment().format('DD/MM/YYYY HH:mm')}`,
        STATUT_CONSULTATION: urgenceToUpdate.statut || 'en_attente',
        MOTIF_CONSULTATION: urgenceToUpdate.motif || '',
        id: urgenceId,
        COD_CONS: urgenceId
      };

      const response = await consultations.update(urgenceId, updateData);

      if (response.success) {
        message.success('Priorité mise à jour avec succès');
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour');
      }

    } catch (error) {
      console.error('Erreur mise à jour priorité:', error);
      // Revenir à l'ancienne priorité en cas d'erreur
      if (oldPriority !== undefined) {
        setUrgences(prev => prev.map(u => 
          u.id === urgenceId ? { ...u, priorite: oldPriority } : u
        ));
      }
      message.error(`Erreur: ${error.message}`);
    } finally {
      setUpdatingPriority(prev => ({ ...prev, [urgenceId]: false }));
    }
  };

  // Gestion de la pagination
  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  // Gestion des filtres
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRefresh = () => {
    loadUrgences();
  };

  // Effets
  useEffect(() => {
    loadUrgences();
  }, [loadUrgences]);

  // Configuration des colonnes du tableau
  const columns = [
    {
      title: 'Patient',
      dataIndex: 'patient_nom',
      key: 'patient',
      width: 200,
      render: (text, record) => (
        <Space>
          <Avatar 
            size="small"
            style={{ backgroundColor: '#1890ff' }}
            icon={<UserOutlined />}
          >
            {record.patient_prenom?.charAt(0)}{record.patient_nom?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: '500' }}>
              {record.patient_prenom} {record.patient_nom}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {record.patient_id || 'N/A'}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Arrivée',
      dataIndex: 'date_arrivee',
      key: 'arrivee',
      width: 150,
      render: (date, record) => (
        <div>
          <div>{formatSafeDate(date, 'DD/MM/YYYY')}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.heure_arrivee ? record.heure_arrivee.substring(0, 5) : 'N/A'}
          </Text>
          <div style={{ marginTop: 4 }}>
            <WaitingTimeTag arrivalTime={date} />
          </div>
        </div>
      ),
    },
    {
      title: 'Motif',
      dataIndex: 'motif',
      key: 'motif',
      width: 200,
      render: (text, record) => (
        <Tooltip title={text}>
          <div style={{ maxWidth: 200 }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {text}
            </div>
            {record.symptomes && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.symptomes.length > 30 ? record.symptomes.substring(0, 30) + '...' : record.symptomes}
              </Text>
            )}
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Priorité',
      dataIndex: 'priorite',
      key: 'priorite',
      width: 150,
      render: (value, record) => (
        <Space>
          <Select
            value={value}
            onChange={(newValue) => handlePriorityChange(record.id, newValue)}
            size="small"
            style={{ width: 140 }}
            loading={updatingPriority[record.id]}
          >
            {PRIORITY_OPTIONS.map(option => (
              <Option key={option.value} value={option.value}>
                <Tag color={option.color}>{option.label}</Tag>
              </Option>
            ))}
          </Select>
          {updatingPriority[record.id] && <Spin size="small" />}
        </Space>
      ),
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      width: 120,
      render: (service) => (
        <Tag color="blue">{service}</Tag>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 150,
      render: (value, record) => (
        <Space>
          <Select
            value={value}
            onChange={(newValue) => handleStatusChange(record.id, newValue)}
            size="small"
            style={{ width: 130 }}
            loading={updatingStatus[record.id]}
          >
            {STATUS_OPTIONS.map(option => (
              <Option key={option.value} value={option.value}>
                <Tag color={option.color}>{option.label}</Tag>
              </Option>
            ))}
          </Select>
          {updatingStatus[record.id] && <Spin size="small" />}
        </Space>
      ),
    },
    {
      title: 'Médecin',
      dataIndex: 'medecin_nom',
      key: 'medecin',
      width: 150,
      render: (text) => (
        text !== 'Non affecté' ? (
          <Space>
            <Avatar 
              size="small"
              style={{ backgroundColor: '#52c41a' }}
            >
              {text?.split(' ').map(n => n.charAt(0)).join('')}
            </Avatar>
            <span>{text}</span>
          </Space>
        ) : (
          <Tag color="default">Non affecté</Tag>
        )
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir détails">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewUrgence(record)}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditUrgence(record)}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Popconfirm
              title="Supprimer cette urgence ?"
              onConfirm={() => handleDeleteUrgence(record.id)}
              okText="Oui"
              cancelText="Non"
            >
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Composant des statistiques
  const renderStatsCards = () => {
    const statCards = [
      {
        title: 'Total Urgences',
        value: stats.total,
        color: '#1890ff',
        icon: <AlertOutlined />,
        prefix: null,
        suffix: null
      },
      {
        title: 'En Attente',
        value: stats.en_attente,
        color: '#faad14',
        icon: <ClockCircleOutlined />,
        prefix: null,
        suffix: null
      },
      {
        title: 'En Cours',
        value: stats.en_cours,
        color: '#13c2c2',
        icon: <MedicineBoxOutlined />,
        prefix: null,
        suffix: null
      },
      {
        title: 'Traitées',
        value: stats.traite,
        color: '#52c41a',
        icon: <CheckCircleOutlined />,
        prefix: null,
        suffix: null
      },
      {
        title: 'Urgent Absolu',
        value: stats.urgent_absolu,
        color: '#f5222d',
        icon: <ExclamationCircleOutlined />,
        prefix: null,
        suffix: null
      }
    ];

    return (
      <Row gutter={[16, 16]}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} md={8} lg={4.8} key={index}>
            <Card size="small" hoverable>
              <Statistic
                title={
                  <Space>
                    <div style={{ color: card.color }}>{card.icon}</div>
                    <span>{card.title}</span>
                  </Space>
                }
                value={card.value}
                valueStyle={{ color: card.color, fontWeight: 'bold' }}
                prefix={card.prefix}
                suffix={card.suffix}
              />
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // Composant des filtres
  const renderFilters = () => {
    return (
      <Card 
        title={
          <Space>
            <FilterOutlined />
            <span>Filtres</span>
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Input
              placeholder="Rechercher patient, motif, service..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />
          </Col>
          
          <Col xs={12} md={4}>
            <Select
              value={filters.statut}
              onChange={(value) => handleFilterChange('statut', value)}
              placeholder="Statut"
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="tous">Tous les statuts</Option>
              {STATUS_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color}>{option.label}</Tag>
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={12} md={4}>
            <Select
              value={filters.priorite}
              onChange={(value) => handleFilterChange('priorite', value)}
              placeholder="Priorité"
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="tous">Toutes</Option>
              {PRIORITY_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color}>{option.label}</Tag>
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={12} md={4}>
            <Select
              value={filters.service}
              onChange={(value) => handleFilterChange('service', value)}
              placeholder="Service"
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="tous">Tous</Option>
              {SERVICES.map(service => (
                <Option key={service} value={service}>{service}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={12} md={6}>
            <DatePicker.RangePicker
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
            />
          </Col>
        </Row>
        
        <Divider style={{ margin: '16px 0' }} />
        
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={() => {
              setFilters({
                statut: 'tous',
                priorite: 'tous',
                service: 'tous',
                dateRange: [moment().subtract(7, 'days'), moment()],
                search: ''
              });
            }}>
              Réinitialiser
            </Button>
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={handleRefresh}
            >
              Appliquer
            </Button>
          </Space>
        </div>
      </Card>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <AlertOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <span style={{ fontSize: 20, fontWeight: 'bold' }}>Gestion des Urgences</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Actualiser
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateUrgence}
            >
              Nouvelle Admission
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ marginBottom: 24 }}>
          <Text type="secondary">
            Surveillance et gestion des admissions aux urgences en temps réel
          </Text>
        </div>
        
        {renderStatsCards()}
      </Card>

      {renderFilters()}

      <Card
        title={
          <Space>
            <span>Liste des Urgences</span>
            <Badge 
              count={filteredUrgences.length} 
              showZero 
              style={{ backgroundColor: '#1890ff' }} 
            />
          </Space>
        }
        extra={
          <Space>
            <Button icon={<DownloadOutlined />}>
              Exporter
            </Button>
            <Button icon={<UploadOutlined />}>
              Importer
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              Chargement des urgences...
            </div>
          </div>
        ) : error ? (
          <Alert
            message="Erreur"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        ) : filteredUrgences.length === 0 ? (
          <Alert
            message="Aucune urgence trouvée"
            description="Aucune urgence ne correspond aux critères de recherche."
            type="info"
            showIcon
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredUrgences}
            rowKey="id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} sur ${total} urgences`,
              pageSizeOptions: ['5', '10', '20', '50'],
              showQuickJumper: true
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            size="middle"
          />
        )}
      </Card>

      {/* Modal de création/modification */}
      <UrgenceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveUrgence}
        initialData={selectedUrgence}
      />

      {/* Drawer de détails */}
      <UrgenceDetailDrawer
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        urgence={selectedUrgence}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
      />
    </div>
  );
};

export default UrgencesPage;