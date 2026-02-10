// src/pages/UrgencesPage.jsx - VERSION CORRIGÉE
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
  Tooltip,
  Popconfirm,
  Spin,
  Tabs,
  Badge,
  Typography,
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
  AlertOutlined,
  ScheduleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/fr';

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
    const date = moment(dateString);
    return date.isValid() ? date : defaultValue;
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
  if (value === undefined || value === null || value === '') return defaultValue;
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
// FONCTION fetchAPI GLOBALE
// ==============================================

// Fonction fetchAPI réutilisable
const fetchAPI = async (endpoint, options = {}) => {
  const baseUrl = 'http://localhost:3000/api';
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
    },
    credentials: 'include'
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    console.log(`📞 API Call: ${config.method || 'GET'} ${url}`);
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ API Error ${url}:`, error);
    throw error;
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
      if (heure) {
        return `${formatSafeDate(date, 'DD/MM/YYYY')} ${heure}`;
      }
      return formatSafeDate(date, 'DD/MM/YYYY HH:mm');
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
          {urgence.patient_age || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Sexe">
          {urgence.patient_sexe || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Téléphone">
          <PhoneOutlined /> {urgence.patient_telephone || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          <MailOutlined /> {urgence.patient_email || 'N/A'}
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
            description={formatFullDate(urgence.date_consultation, urgence.heure_consultation)}
          />
        </List.Item>
        <List.Item>
          <List.Item.Meta
            avatar={<ClockCircleOutlined />}
            title="Temps d'attente"
            description={<WaitingTimeTag arrivalTime={urgence.date_consultation} />}
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
          {urgence.allergies || 'Aucune connue'}
        </Descriptions.Item>
        <Descriptions.Item label="Antécédents">
          {urgence.antecedents || 'Non renseignés'}
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
              >
                {urgence.praticien_nom?.charAt(0)}
              </Avatar>
            }
            title="Médecin traitant"
            description={getSafeValue(urgence.praticien_nom_complet, 'Non affecté')}
          />
          {urgence.praticien_telephone && (
            <Button type="link" size="small">
              <PhoneOutlined /> Contacter
            </Button>
          )}
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
            defaultValue={getSafeValue(urgence.observations, 'Aucune note')}
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
        date_consultation: initialData.date_consultation ? moment(initialData.date_consultation) : moment(),
        heure_consultation: initialData.heure_consultation ? moment(initialData.heure_consultation, 'HH:mm:ss') : moment()
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        date_consultation: moment(),
        heure_consultation: moment(),
        priorite: 3,
        gravite: 3,
        service: 'Général',
        statut: 'en_attente',
        urgent: true,
        type_consultation: 'urgence'
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
    // CORRECTION: Utiliser POST au lieu de GET
    const response = await fetchAPI('/beneficiaires/search', {
      method: 'POST',
      body: {
        searchTerm: value,
        limit: 10
      }
    });
    
    if (response?.success) {
      // CORRECTION: Utiliser les bonnes clés de données
      const patients = response.beneficiaires || response.data || [];
      setPatientsList(patients);
    } else {
      setPatientsList([]);
    }
  } catch (error) {
    console.error('Erreur recherche patients:', error);
    message.error('Erreur lors de la recherche des patients');
    setPatientsList([]);
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
    // Récupérer le centre de l'utilisateur depuis le localStorage
    const userData = localStorage.getItem('user');
    let userCentre = null;
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        userCentre = parsedUser.COD_CEN || parsedUser.centre_id;
      } catch (e) {
        console.error('Erreur parsing user data:', e);
      }
    }
    
    // Construire l'URL avec les paramètres
    let url = `/prestataires/search?search=${encodeURIComponent(value)}&limit=10`;
    
    // Ajouter le filtre par centre si l'utilisateur n'est pas superadmin
    // (Le backend va automatiquement filtrer par centre si l'utilisateur n'est pas superadmin)
    if (userCentre && userCentre !== 'undefined') {
      url += `&centre_id=${userCentre}`;
    }
    
    console.log('🔍 Recherche médecins avec URL:', url);
    
    const response = await fetchAPI(url);
    
    if (response?.success) {
      console.log('✅ Médecins trouvés:', response.prestataires);
      setMedecinsList(response.prestataires || []);
    } else {
      console.error('❌ Erreur recherche médecins:', response?.message);
      setMedecinsList([]);
    }
  } catch (error) {
    console.error('❌ Erreur recherche médecins:', error);
    message.error('Erreur lors de la recherche des médecins');
    setMedecinsList([]);
  } finally {
    setLoadingMedecins(false);
  }
};

// CORRECTION dans le rendu du Select des médecins
<Select
  showSearch
  placeholder="Rechercher un médecin..."
  onSearch={handleSearchMedecin}
  loading={loadingMedecins}
  filterOption={false}
  optionLabelProp="label"
  style={{ width: '100%' }}
>
  {medecinsList.map(medecin => {
    // CORRECTION: Utiliser les bonnes propriétés
    const id = medecin.id || medecin.COD_PRE;
    const nom = medecin.nom || medecin.NOM_PRESTATAIRE || '';
    const prenom = medecin.prenom || medecin.PRENOM_PRESTATAIRE || '';
    const specialite = medecin.specialite || medecin.SPECIALITE || '';
    const titre = medecin.titre || '';
    const telephone = medecin.telephone || medecin.TELEPHONE || '';
    const nomComplet = medecin.nom_complet || `${prenom} ${nom}`.trim();
    
    return (
      <Option 
        key={id} 
        value={id}
        label={nomComplet}
      >
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
            {prenom.charAt(0)}{nom.charAt(0)}
          </Avatar>
          <div style={{ minWidth: 200 }}>
            <div style={{ fontWeight: '500' }}>
              {prenom} {nom} {titre ? `(${titre})` : ''}
            </div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
              {specialite || 'Médecin'}
            </Text>
            {telephone && (
              <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                📞 {telephone}
              </Text>
            )}
            {medecin.nom_centre && (
              <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                🏥 {medecin.nom_centre}
              </Text>
            )}
          </div>
        </Space>
      </Option>
    );
  })}
</Select>

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const urgenceData = {
        ...values,
        date_consultation: values.date_consultation.format('YYYY-MM-DD'),
        heure_consultation: values.heure_consultation.format('HH:mm:ss'),
        type_consultation: 'urgence',
        urgent: true,
        STATUT_CONSULTATION: values.statut,
        PRIORITE: values.priorite
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
              name="COD_BEN"
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
  {patientsList.map(patient => {
    // CORRECTION: Vérifier l'existence des propriétés
    const nom = patient.nom || patient.NOM_BEN || '';
    const prenom = patient.prenom || patient.PRE_BEN || '';
    const identifiant = patient.identifiant_national || patient.IDENTIFIANT_NATIONAL || '';
    const telephone = patient.telephone_mobile || patient.TELEPHONE_MOBILE || '';
    
    return (
      <Option 
        key={patient.id || patient.COD_BEN} 
        value={patient.id || patient.COD_BEN}
        label={`${prenom} ${nom}`}
      >
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div>{prenom} {nom}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {identifiant} - Tél: {telephone}
            </Text>
          </div>
        </Space>
      </Option>
    );
  })}
</Select>
            </Form.Item>
          </TabPane>

          <TabPane tab="Admission" key="admission">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="date_consultation"
                  label="Date d'arrivée"
                  rules={[{ required: true, message: 'Veuillez sélectionner la date' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="heure_consultation"
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
                    <Option value="critique">Critique</Option>
                    <Option value="severe">Sévère</Option>
                    <Option value="moderee">Modérée</Option>
                    <Option value="legere">Légère</Option>
                    <Option value="minime">Minime</Option>
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
              name="COD_PRE"
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
                    key={medecin.COD_PRE} 
                    value={medecin.COD_PRE}
                    label={`${medecin.PRENOM_PRESTATAIRE} ${medecin.NOM_PRESTATAIRE}`}
                  >
                    <Space>
                      <Avatar size="small" />
                      <div>
                        <div>{medecin.PRENOM_PRESTATAIRE} {medecin.NOM_PRESTATAIRE}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {medecin.SPECIALITE || 'Spécialité non définie'}
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
              name="observations"
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
  const [loading, setLoading] = useState({
    liste: false,
    actions: false
  });
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
    setLoading(prev => ({ ...prev, liste: true }));
    setError(null);
    
    try {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        urgent: true,
        type_consultation: 'urgence'
      };
      
      if (filters.dateRange?.[0]) {
        queryParams.date_debut = filters.dateRange[0].format('YYYY-MM-DD');
      }
      
      if (filters.dateRange?.[1]) {
        queryParams.date_fin = filters.dateRange[1].format('YYYY-MM-DD');
      }
      
      if (filters.statut !== 'tous') {
        queryParams.statut_consultation = filters.statut;
      }
      
      if (filters.priorite !== 'tous') {
        queryParams.priorite = filters.priorite;
      }
      
      if (filters.service !== 'tous') {
        queryParams.service = filters.service;
      }
      
      if (filters.search) {
        queryParams.search = filters.search;
      }

      console.log('🔍 Chargement urgences avec params:', queryParams);
      
      // Construire l'URL avec les paramètres
      const params = new URLSearchParams();
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] !== undefined && queryParams[key] !== null) {
          params.append(key, queryParams[key]);
        }
      });
      
      const response = await fetchAPI(`/consultations/list?${params.toString()}`);
      
      console.log('📋 Réponse API Urgences:', response);
      
      if (response?.success) {
        const urgencesList = (response.consultations || []).map(cons => {
          return {
            id: getSafeValue(cons.id || cons.COD_CONS, Date.now()),
            COD_CONS: cons.COD_CONS,
            patient_id: getSafeValue(cons.patient_id || cons.COD_BEN),
            patient_nom: getSafeValue(cons.patient_nom || cons.NOM_BEN, 'Inconnu'),
            patient_prenom: getSafeValue(cons.patient_prenom || cons.PRE_BEN, ''),
            patient_age: getSafeValue(cons.patient_age),
            patient_sexe: getSafeValue(cons.patient_sexe || cons.SEX_BEN),
            patient_telephone: getSafeValue(cons.patient_telephone || cons.TELEPHONE_MOBILE),
            date_consultation: cons.date_consultation || cons.DATE_CONSULTATION,
            heure_consultation: cons.heure_consultation || cons.HEURE_CONSULTATION,
            motif: getSafeValue(cons.motif || cons.MOTIF_CONSULTATION, 'Non spécifié'),
            symptomes: getSafeValue(cons.symptomes || cons.SYMPTOMES, ''),
            gravite: getSafeValue(cons.gravite || cons.GRAVITE, 'moderee'),
            priorite: getSafeValue(cons.priorite || cons.PRIORITE, 3),
            COD_PRE: getSafeValue(cons.praticien_code || cons.COD_PRE),
            praticien_nom: getSafeValue(cons.praticien_nom || cons.NOM_PRESTATAIRE, 'Non affecté'),
            praticien_prenom: getSafeValue(cons.praticien_prenom || cons.PRENOM_PRESTATAIRE, ''),
            praticien_nom_complet: getSafeValue(
              cons.praticien_nom_complet || 
              `${cons.PRENOM_PRESTATAIRE || ''} ${cons.NOM_PRESTATAIRE || ''}`.trim() || 
              'Non affecté'
            ),
            service: getSafeValue(cons.service || cons.SERVICE, 'Général'),
            observations: getSafeValue(cons.observations || cons.OBSERVATIONS, ''),
            statut: getSafeValue(cons.statut || cons.STATUT_CONSULTATION, 'en_attente'),
            type_consultation: getSafeValue(cons.type_consultation || cons.TYPE_CONSULTATION, 'urgence'),
            urgent: cons.urgent || cons.URGENT || true,
            created_at: getSafeValue(cons.created_at || cons.DAT_CREUTIL, moment().toISOString()),
            updated_at: getSafeValue(cons.updated_at || cons.DAT_MODUTIL, moment().toISOString())
          };
        });
        
        setUrgences(urgencesList);
        setPagination(prev => ({ 
          ...prev, 
          total: response.pagination?.total || urgencesList.length 
        }));
        
        message.success(`${urgencesList.length} urgences chargées`);
      } else {
        throw new Error(response?.message || 'Erreur lors du chargement des urgences');
      }
    } catch (error) {
      console.error('❌ Erreur chargement urgences:', error);
      setError(error.message);
      message.error('Erreur lors du chargement des urgences');
      
      // Données de test en cas d'erreur
      if (urgences.length === 0) {
        const testUrgences = [
          {
            id: 1,
            patient_id: 'PAT001',
            patient_nom: 'Dupont',
            patient_prenom: 'Jean',
            patient_age: '45',
            patient_sexe: 'M',
            patient_telephone: '0612345678',
            date_consultation: '2026-01-28',
            heure_consultation: '14:30',
            motif: 'Douleur thoracique',
            symptomes: 'Essouflement, palpitations',
            gravite: 'severe',
            priorite: 2,
            praticien_nom: 'Martin',
            praticien_prenom: 'Dr',
            praticien_nom_complet: 'Dr Martin',
            service: 'Cardiologie',
            observations: 'Patient stable sous surveillance',
            statut: 'en_cours',
            type_consultation: 'urgence'
          }
        ];
        setUrgences(testUrgences);
        setPagination(prev => ({ ...prev, total: 1 }));
        message.warning('Mode démo: données de test affichées');
      }
    } finally {
      setLoading(prev => ({ ...prev, liste: false }));
    }
  }, [filters, pagination.current, pagination.pageSize]);

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
        const dateUrgence = moment(u.date_consultation);
        return dateUrgence >= dateDebut;
      });
    }
    
    if (filters.dateRange?.[1]) {
      const dateFin = filters.dateRange[1].endOf('day');
      filtered = filtered.filter(u => {
        const dateUrgence = moment(u.date_consultation);
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
        const medecin = getSafeValue(u.praticien_nom, '').toLowerCase();
        
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
          await fetchAPI(`/consultations/${id}`, { method: 'DELETE' });
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
    setLoading(prev => ({ ...prev, actions: true }));
    try {
      if (isEdit) {
        const response = await fetchAPI(`/consultations/${urgenceData.id}`, {
          method: 'PUT',
          body: JSON.stringify(urgenceData)
        });
        
        if (response?.success) {
          setUrgences(prev => prev.map(u => 
            u.id === urgenceData.id ? { 
              ...u, 
              ...urgenceData,
              updated_at: moment().toISOString()
            } : u
          ));
        } else {
          throw new Error(response?.message);
        }
      } else {
        const response = await fetchAPI('/consultations', {
          method: 'POST',
          body: JSON.stringify(urgenceData)
        });
        
        if (response?.success) {
          const newUrgence = {
            ...urgenceData,
            id: response.id || response.COD_CONS || Date.now(),
            COD_CONS: response.COD_CONS,
            created_at: moment().toISOString(),
            updated_at: moment().toISOString()
          };
          setUrgences(prev => [newUrgence, ...prev]);
        } else {
          throw new Error(response?.message);
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde urgence:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  };

  // Gestion des changements de statut
  const handleStatusChange = async (urgenceId, newStatus) => {
    try {
      const urgenceToUpdate = urgences.find(u => u.id === urgenceId);
      if (!urgenceToUpdate) return;
      
      setUpdatingStatus(prev => ({ ...prev, [urgenceId]: true }));

      const updateData = {
        STATUT_CONSULTATION: newStatus,
        OBSERVATIONS: `${urgenceToUpdate.observations || ''} | Statut changé à ${newStatus} - ${moment().format('DD/MM/YYYY HH:mm')}`,
        id: urgenceId,
        COD_CONS: urgenceToUpdate.COD_CONS,
        PRIORITE: urgenceToUpdate.priorite || 3
      };

      const response = await fetchAPI(`/consultations/${urgenceId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (response?.success) {
        const updatedUrgence = {
          ...urgenceToUpdate,
          statut: newStatus,
          updated_at: moment().toISOString()
        };
        
        setUrgences(prev => prev.map(u => 
          u.id === urgenceId ? updatedUrgence : u
        ));
        
        message.success('Statut mis à jour avec succès');
      } else {
        throw new Error(response?.message || 'Erreur lors de la mise à jour');
      }

    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      message.error(`Erreur: ${error.message}`);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [urgenceId]: false }));
    }
  };

  // Gestion des changements de priorité
  const handlePriorityChange = async (urgenceId, newPriority) => {
    try {
      const urgenceToUpdate = urgences.find(u => u.id === urgenceId);
      if (!urgenceToUpdate) return;
      
      setUpdatingPriority(prev => ({ ...prev, [urgenceId]: true }));

      const updateData = {
        PRIORITE: parseInt(newPriority),
        OBSERVATIONS: `${urgenceToUpdate.observations || ''} | Priorité changée à ${newPriority} - ${moment().format('DD/MM/YYYY HH:mm')}`,
        STATUT_CONSULTATION: urgenceToUpdate.statut || 'en_attente',
        id: urgenceId,
        COD_CONS: urgenceToUpdate.COD_CONS
      };

      const response = await fetchAPI(`/consultations/${urgenceId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (response?.success) {
        const updatedUrgence = {
          ...urgenceToUpdate,
          priorite: parseInt(newPriority),
          updated_at: moment().toISOString()
        };
        
        setUrgences(prev => prev.map(u => 
          u.id === urgenceId ? updatedUrgence : u
        ));
        
        message.success('Priorité mise à jour avec succès');
      } else {
        throw new Error(response?.message || 'Erreur lors de la mise à jour');
      }

    } catch (error) {
      console.error('Erreur mise à jour priorité:', error);
      message.error(`Erreur: ${error.message}`);
    } finally {
      setUpdatingPriority(prev => ({ ...prev, [urgenceId]: false }));
    }
  };

  // Gestion de la pagination
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
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
              ID: {record.patient_id || 'N/A'} | Âge: {record.patient_age || 'N/A'}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Arrivée',
      dataIndex: 'date_consultation',
      key: 'arrivee',
      width: 150,
      render: (date, record) => (
        <div>
          <div>{formatSafeDate(date, 'DD/MM/YYYY')}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.heure_consultation ? record.heure_consultation.substring(0, 5) : 'N/A'}
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
      dataIndex: 'praticien_nom_complet',
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
      },
      {
        title: 'En Attente',
        value: stats.en_attente,
        color: '#faad14',
        icon: <ClockCircleOutlined />,
      },
      {
        title: 'En Cours',
        value: stats.en_cours,
        color: '#13c2c2',
        icon: <MedicineBoxOutlined />,
      },
      {
        title: 'Traitées',
        value: stats.traite,
        color: '#52c41a',
        icon: <CheckCircleOutlined />,
      },
      {
        title: 'Urgent Absolu',
        value: stats.urgent_absolu,
        color: '#f5222d',
        icon: <ExclamationCircleOutlined />,
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
              loading={loading.liste}
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
              loading={loading.liste}
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
            <Button icon={<DownloadOutlined />} onClick={() => message.info('Export à implémenter')}>
              Exporter
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => message.info('Import à implémenter')}>
              Importer
            </Button>
          </Space>
        }
      >
        {loading.liste ? (
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
            action={
              <Button size="small" onClick={handleRefresh}>
                Réessayer
              </Button>
            }
            style={{ marginBottom: 16 }}
          />
        ) : filteredUrgences.length === 0 ? (
          <Alert
            message="Aucune urgence trouvée"
            description="Aucune urgence ne correspond aux critères de recherche."
            type="info"
            showIcon
            action={
              <Button size="small" onClick={handleCreateUrgence}>
                Créer une urgence
              </Button>
            }
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