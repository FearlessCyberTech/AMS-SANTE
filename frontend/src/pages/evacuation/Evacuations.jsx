// EvacuationsPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table, Card, Row, Col, Statistic, Button, Modal, Form,
  Select, Input, DatePicker, Tag, Space, message, Tabs,
  Descriptions, Tooltip, Popconfirm, Spin, Alert,
  Divider, Badge, Typography,
  Drawer, Avatar, TimePicker, InputNumber, Cascader,
  Upload, List, Progress, Image, Collapse
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, SearchOutlined, FilterOutlined,
  DownloadOutlined, SyncOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ClockCircleOutlined,
  InfoCircleOutlined, GlobalOutlined, EnvironmentOutlined,
  ArrowUpOutlined, UserOutlined, TeamOutlined, BankOutlined,
  PhoneOutlined, MailOutlined, CarOutlined, 
  MedicineBoxOutlined, FileTextOutlined, WarningOutlined,
  StarOutlined, DollarOutlined, CheckOutlined,
  SaveOutlined, MinusCircleOutlined, CalendarOutlined,
  ContainerOutlined, SafetyCertificateOutlined,
  UploadOutlined, PaperClipOutlined, PrinterOutlined,
  FileAddOutlined, FilePdfOutlined, FileImageOutlined,
  FileWordOutlined, FileExcelOutlined, FileZipOutlined,
  PictureOutlined, BankOutlined as BankIcon,
  PercentageOutlined, EuroOutlined, CreditCardOutlined,
  BarcodeOutlined, IdcardOutlined, ShopOutlined,
  EnvironmentFilled, PhoneFilled, MailFilled,
  TeamOutlined as TeamIcon, UserAddOutlined,
  DownloadOutlined as DownloadIcon,
  UploadOutlined as UploadIcon, DeleteOutlined as DeleteIcon,
  EyeOutlined as EyeIcon, FileSyncOutlined,
  FileDoneOutlined, FileProtectOutlined,
  FileUnknownOutlined, FileExcelFilled,
  FilePdfFilled, FileWordFilled, FileImageFilled,
  FileZipFilled, FileTextFilled
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { evacuationsAPI } from '../../services/api';
import { beneficiairesAPI, prestatairesAPI, centresAPI } from '../../services/api';
import moment from 'moment';
import 'moment/locale/fr';
import ReactToPrint from 'react-to-print';
import './EvacuationsPage.css'; // Nous créerons ce fichier CSS

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const EvacuationsPage = () => {
  const { user } = useAuth();
  const printRef = useRef();
  
  // États principaux
  const [evacuations, setEvacuations] = useState([]);
  const [loading, setLoading] = useState({
    evacuations: false,
    details: false,
    patient: false,
    centres: false,
    prestataires: false,
    documents: false,
    frais: false
  });
  
  // États de recherche et filtres
  const [filters, setFilters] = useState({
    search: '',
    statut: 'all',
    decision: 'all',
    gravite: 'all',
    urgence: 'all',
    date_debut: null,
    date_fin: null,
    destination: '',
    moyen_transport: 'all'
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
    en_attente: 0,
    en_cours: 0,
    terminees: 0,
    annulees: 0,
    urgent_count: 0,
    total_cout_estime: 0,
    moyenne_cout_estime: 0
  });
  
  // États pour les données
  const [patients, setPatients] = useState([]);
  const [centres, setCentres] = useState([]);
  const [prestataires, setPrestataires] = useState([]);
  const [destinations, setDestinations] = useState([]);
  
  // États pour les modales et drawer
  const [evacuationModal, setEvacuationModal] = useState({
    visible: false,
    mode: 'create',
    loading: false
  });
  
  const [detailsDrawer, setDetailsDrawer] = useState({
    visible: false,
    evacuation: null,
    documents: [],
    frais: [],
    statistiques: {}
  });
  
  const [statusModal, setStatusModal] = useState({
    visible: false,
    evacuationId: null,
    loading: false
  });
  
  // Nouveaux états pour documents et frais
  const [uploadModal, setUploadModal] = useState({
    visible: false,
    loading: false,
    fileList: []
  });
  
  const [fraisModal, setFraisModal] = useState({
    visible: false,
    mode: 'create', // 'create' ou 'edit'
    loading: false,
    currentFrais: null
  });
  
  const [printModal, setPrintModal] = useState({
    visible: false,
    loading: false
  });
  
  // États pour les formulaires
  const [evacuationForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [fraisForm] = Form.useForm();
  
  // Options pour les selects
  const statutOptions = [
    { value: 'en_attente', label: 'En attente', color: 'warning', icon: <ClockCircleOutlined /> },
    { value: 'en_cours', label: 'En cours', color: 'processing', icon: <SyncOutlined /> },
    { value: 'terminee', label: 'Terminée', color: 'success', icon: <CheckCircleOutlined /> },
    { value: 'annulee', label: 'Annulée', color: 'error', icon: <CloseCircleOutlined /> },
    { value: 'rejetee', label: 'Rejetée', color: 'error', icon: <CloseCircleOutlined /> }
  ];
  
  const decisionOptions = [
    { value: 'approuvee', label: 'Approuvée', color: 'success', icon: <CheckCircleOutlined /> },
    { value: 'rejetee', label: 'Rejetée', color: 'error', icon: <CloseCircleOutlined /> },
    { value: 'en_attente', label: 'En attente', color: 'warning', icon: <ClockCircleOutlined /> }
  ];
  
  const graviteOptions = [
    { value: '1', label: 'Critique', color: 'error', icon: <WarningOutlined /> },
    { value: '2', label: 'Urgent', color: 'warning', icon: <WarningOutlined /> },
    { value: '3', label: 'Semi-urgent', color: 'blue', icon: <InfoCircleOutlined /> },
    { value: '4', label: 'Non urgent', color: 'success', icon: <CheckCircleOutlined /> }
  ];
  
  const transportOptions = [
    { value: 'ambulance', label: 'Ambulance', icon: <CarOutlined /> },
    { value: 'avion', label: 'Avion médicalisé', icon: <CarOutlined /> },
    { value: 'helicoptere', label: 'Hélicoptère', icon: <CarOutlined /> },
    { value: 'voiture', label: 'Voiture médicalisée', icon: <CarOutlined /> },
    { value: 'train', label: 'Train médicalisé', icon: <CarOutlined /> },
    { value: 'bateau', label: 'Bateau médicalisé', icon: <CarOutlined /> }
  ];
  
  const priseEnChargeOptions = [
    { value: '100', label: '100%' },
    { value: '80', label: '80%' },
    { value: '50', label: '50%' },
    { value: '30', label: '30%' },
    { value: '0', label: '0%' }
  ];

  const typeFraisOptions = [
    { value: 'transport', label: 'Transport', icon: <CarOutlined /> },
    { value: 'hospitalisation', label: 'Hospitalisation', icon: <MedicineBoxOutlined /> },
    { value: 'medicaments', label: 'Médicaments', icon: <MedicineBoxOutlined /> },
    { value: 'consultation', label: 'Consultation', icon: <UserOutlined /> },
    { value: 'examen', label: 'Examen médical', icon: <FileTextOutlined /> },
    { value: 'hebergement', label: 'Hébergement', icon: <ShopOutlined /> },
    { value: 'restauration', label: 'Restauration', icon: <ShopOutlined /> },
    { value: 'frais_dossier', label: 'Frais de dossier', icon: <FileTextOutlined /> },
    { value: 'autre', label: 'Autre', icon: <FileUnknownOutlined /> }
  ];

  const typeDocumentOptions = [
    { value: 'ordonnance', label: 'Ordonnance', icon: <FileTextOutlined /> },
    { value: 'certificat_medical', label: 'Certificat médical', icon: <FileDoneOutlined /> },
    { value: 'radio', label: 'Radiographie', icon: <FileImageOutlined /> },
    { value: 'analyse', label: 'Analyse médicale', icon: <FileTextOutlined /> },
    { value: 'cni', label: 'CNI/Passport', icon: <IdcardOutlined /> },
    { value: 'assurance', label: 'Assurance', icon: <SafetyCertificateOutlined /> },
    { value: 'facture', label: 'Facture', icon: <EuroOutlined /> },
    { value: 'autre', label: 'Autre', icon: <FileUnknownOutlined /> }
  ];

  // ==================== NOUVELLES FONCTIONS POUR DOCUMENTS ET FRAIS ====================

  const handleUploadDocuments = async () => {
    const evacuationId = detailsDrawer.evacuation?.id;
    if (!evacuationId) {
      message.error('Aucune évacuation sélectionnée');
      return;
    }

    setUploadModal(prev => ({ ...prev, loading: true }));
    
    try {
      const formData = new FormData();
      uploadModal.fileList.forEach(file => {
        formData.append('documents', file.originFileObj);
      });
      formData.append('evacuation_id', evacuationId);
      formData.append('type_document', 'medical');

      const result = await evacuationsAPI.uploadDocuments(evacuationId, formData);
      
      if (result.success) {
        message.success(`${uploadModal.fileList.length} document(s) uploadé(s) avec succès`);
        setUploadModal({ visible: false, loading: false, fileList: [] });
        // Recharger les documents
        const docsResponse = await evacuationsAPI.getDocuments(evacuationId);
        if (docsResponse.success) {
          setDetailsDrawer(prev => ({
            ...prev,
            documents: docsResponse.documents,
            statistiques: {
              ...prev.statistiques,
              total_documents: docsResponse.documents.length
            }
          }));
        }
      } else {
        throw new Error(result.message || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('❌ Erreur upload documents:', error);
      message.error(error.message || 'Erreur lors de l\'upload des documents');
      setUploadModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteDocument = async (documentId) => {
    Modal.confirm({
      title: 'Supprimer le document',
      content: 'Êtes-vous sûr de vouloir supprimer ce document ?',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          const result = await evacuationsAPI.deleteDocument(documentId);
          if (result.success) {
            message.success('Document supprimé avec succès');
            // Mettre à jour la liste des documents
            const evacuationId = detailsDrawer.evacuation?.id;
            if (evacuationId) {
              const docsResponse = await evacuationsAPI.getDocuments(evacuationId);
              if (docsResponse.success) {
                setDetailsDrawer(prev => ({
                  ...prev,
                  documents: docsResponse.documents,
                  statistiques: {
                    ...prev.statistiques,
                    total_documents: docsResponse.documents.length
                  }
                }));
              }
            }
          } else {
            throw new Error(result.message || 'Erreur lors de la suppression');
          }
        } catch (error) {
          console.error('❌ Erreur suppression document:', error);
          message.error(error.message || 'Erreur lors de la suppression du document');
        }
      }
    });
  };

  const handleAddFrais = async (values) => {
    const evacuationId = detailsDrawer.evacuation?.id;
    if (!evacuationId) {
      message.error('Aucune évacuation sélectionnée');
      return;
    }

    setFraisModal(prev => ({ ...prev, loading: true }));
    
    try {
      const fraisData = {
        type_frais: values.type_frais,
        description: values.description,
        montant: values.montant,
        date_frais: values.date_frais ? values.date_frais.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
        statut: values.statut || 'en_attente',
        notes: values.notes || ''
      };

      let result;
      if (fraisModal.mode === 'edit' && fraisModal.currentFrais) {
        result = await evacuationsAPI.updateFrais(fraisModal.currentFrais.id, fraisData);
      } else {
        result = await evacuationsAPI.addFrais(evacuationId, fraisData);
      }
      
      if (result.success) {
        message.success(fraisModal.mode === 'edit' ? 'Frais mis à jour' : 'Frais ajouté avec succès');
        setFraisModal({ visible: false, loading: false, mode: 'create', currentFrais: null });
        fraisForm.resetFields();
        // Recharger les frais
        const fraisResponse = await evacuationsAPI.getFrais(evacuationId);
        if (fraisResponse.success) {
          const total_frais = fraisResponse.frais.reduce((sum, f) => sum + (parseFloat(f.montant) || 0), 0);
          setDetailsDrawer(prev => ({
            ...prev,
            frais: fraisResponse.frais,
            statistiques: {
              ...prev.statistiques,
              total_frais,
              frais_count: fraisResponse.frais.length
            }
          }));
        }
      } else {
        throw new Error(result.message || 'Erreur lors de l\'ajout du frais');
      }
    } catch (error) {
      console.error('❌ Erreur ajout frais:', error);
      message.error(error.message || 'Erreur lors de l\'ajout du frais');
      setFraisModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteFrais = async (fraisId) => {
    Modal.confirm({
      title: 'Supprimer le frais',
      content: 'Êtes-vous sûr de vouloir supprimer ce frais ?',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          const result = await evacuationsAPI.deleteFrais(fraisId);
          if (result.success) {
            message.success('Frais supprimé avec succès');
            // Mettre à jour la liste des frais
            const evacuationId = detailsDrawer.evacuation?.id;
            if (evacuationId) {
              const fraisResponse = await evacuationsAPI.getFrais(evacuationId);
              if (fraisResponse.success) {
                const total_frais = fraisResponse.frais.reduce((sum, f) => sum + (parseFloat(f.montant) || 0), 0);
                setDetailsDrawer(prev => ({
                  ...prev,
                  frais: fraisResponse.frais,
                  statistiques: {
                    ...prev.statistiques,
                    total_frais,
                    frais_count: fraisResponse.frais.length
                  }
                }));
              }
            }
          } else {
            throw new Error(result.message || 'Erreur lors de la suppression');
          }
        } catch (error) {
          console.error('❌ Erreur suppression frais:', error);
          message.error(error.message || 'Erreur lors de la suppression du frais');
        }
      }
    });
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch(extension) {
      case 'pdf': return <FilePdfFilled style={{ color: '#ff4d4f' }} />;
      case 'doc':
      case 'docx': return <FileWordFilled style={{ color: '#1890ff' }} />;
      case 'xls':
      case 'xlsx': return <FileExcelFilled style={{ color: '#52c41a' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return <FileImageFilled style={{ color: '#722ed1' }} />;
      case 'zip':
      case 'rar': return <FileZipFilled style={{ color: '#fa8c16' }} />;
      default: return <FileTextFilled style={{ color: '#595959' }} />;
    }
  };

  // ==================== COMPOSANT D'IMPRESSION ====================

  const FicheEvacuationPrint = React.forwardRef(({ evacuation, centreInfo }, ref) => {
    if (!evacuation) return null;

    const centreActuel = centreInfo || {
      nom: "Centre de Santé Principal",
      logo: "/logo-centre.png",
      adresse: "123 Rue de la Santé, Ville",
      telephone: "+221 33 123 45 67",
      email: "contact@centresante.sn"
    };

    return (
      <div ref={ref} className="print-container">
        <div className="print-header">
          <div className="logo-section">
            {centreActuel.logo && (
              <img 
                src={centreActuel.logo} 
                alt="Logo du centre" 
                className="logo-print"
              />
            )}
            <div className="centre-info">
              <h1>{centreActuel.nom}</h1>
              <p>{centreActuel.adresse}</p>
              <p>Tél: {centreActuel.telephone} • Email: {centreActuel.email}</p>
            </div>
          </div>
          <div className="header-title">
            <h2>FICHE D'ÉVACUATION MÉDICALE</h2>
            <div className="reference-badge">
              Référence: <strong>{evacuation.REFERENCE}</strong>
            </div>
          </div>
        </div>

        <Divider className="print-divider" />

        <div className="print-body">
          <div className="section">
            <h3 className="section-title">
              <MedicineBoxOutlined /> INFORMATIONS DU PATIENT
            </h3>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <p><strong>Nom complet:</strong> {evacuation.NOM_BEN} {evacuation.PRE_BEN}</p>
              </Col>
              <Col span={8}>
                <p><strong>Âge:</strong> {evacuation.patient_age} ans</p>
              </Col>
              <Col span={8}>
                <p><strong>Sexe:</strong> {evacuation.patient_sexe}</p>
              </Col>
              <Col span={8}>
                <p><strong>Téléphone:</strong> {evacuation.patient_telephone}</p>
              </Col>
              <Col span={16}>
                <p><strong>Identifiant:</strong> {evacuation.patient_identifiant}</p>
              </Col>
            </Row>
          </div>

          <div className="section">
            <h3 className="section-title">
              <CarOutlined /> INFORMATIONS DE L'ÉVACUATION
            </h3>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <p><strong>Motif d'évacuation:</strong> {evacuation.MOTIF_EVACUATION}</p>
              </Col>
              <Col span={12}>
                <p><strong>Diagnostic:</strong> {evacuation.DIAGNOSTIC}</p>
              </Col>
              <Col span={12}>
                <p><strong>Gravité:</strong> {getEvacuationGraviteDisplay(evacuation.GRAVITE).text}</p>
              </Col>
              <Col span={12}>
                <p><strong>Urgence:</strong> {evacuation.URGENCE ? 'OUI' : 'NON'}</p>
              </Col>
              <Col span={12}>
                <p><strong>Date demande:</strong> {moment(evacuation.DATE_DEMANDE).format('DD/MM/YYYY HH:mm')}</p>
              </Col>
              <Col span={12}>
                <p><strong>Statut:</strong> {getEvacuationStatusDisplay(evacuation.STATUT).text}</p>
              </Col>
            </Row>
          </div>

          <div className="section">
            <h3 className="section-title">
              <EnvironmentFilled /> DESTINATION
            </h3>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <p><strong>Destination:</strong> {evacuation.DESTINATION}</p>
                <p><strong>Hôpital:</strong> {evacuation.HOPITAL_DESTINATION}</p>
                <p><strong>Adresse:</strong> {evacuation.ADRESSE_DESTINATION}</p>
              </Col>
              <Col span={12}>
                <p><strong>Téléphone:</strong> {evacuation.TELEPHONE_DESTINATION}</p>
                <p><strong>Médecin référent:</strong> {evacuation.MEDECIN_REFERENT}</p>
              </Col>
            </Row>
          </div>

          <div className="section">
            <h3 className="section-title">
              <CarOutlined /> TRANSPORT
            </h3>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <p><strong>Moyen de transport:</strong> {evacuation.MOYEN_TRANSPORT}</p>
                <p><strong>Transport spécial:</strong> {evacuation.TRANSPORT_SPECIAL ? 'OUI' : 'NON'}</p>
              </Col>
              <Col span={12}>
                <p><strong>Compagnie aérienne:</strong> {evacuation.COMPAGNIE_AERIENNE}</p>
                <p><strong>Numéro de vol:</strong> {evacuation.NUMERO_VOL}</p>
              </Col>
              <Col span={12}>
                <p><strong>Date départ:</strong> {evacuation.DATE_DEPART ? moment(evacuation.DATE_DEPART).format('DD/MM/YYYY HH:mm') : 'Non défini'}</p>
              </Col>
              <Col span={12}>
                <p><strong>Date arrivée:</strong> {evacuation.DATE_ARRIVEE ? moment(evacuation.DATE_ARRIVEE).format('DD/MM/YYYY HH:mm') : 'Non défini'}</p>
              </Col>
            </Row>
          </div>

          <div className="section">
            <h3 className="section-title">
              <TeamIcon /> ACCOMPAGNANTS
            </h3>
            <p>{evacuation.ACCOMPAGNANTS || 'Aucun accompagnant'}</p>
          </div>

          <div className="section">
            <h3 className="section-title">
              <BankIcon /> INFORMATIONS FINANCIÈRES
            </h3>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="financial-card">
                  <h4>Coût estimé</h4>
                  <p className="amount">{formatCurrency(evacuation.COUT_ESTIME)}</p>
                </div>
              </Col>
              <Col span={12}>
                <div className="financial-card">
                  <h4>Coût réel</h4>
                  <p className="amount">{formatCurrency(evacuation.COUT_REEL)}</p>
                </div>
              </Col>
              <Col span={12}>
                <div className="financial-card">
                  <h4>Prise en charge</h4>
                  <p className="amount">{evacuation.PRISE_EN_CHARGE || 0}%</p>
                </div>
              </Col>
              <Col span={12}>
                <div className="financial-card">
                  <h4>Reste à charge patient</h4>
                  <p className="amount">{formatCurrency(evacuation.MONTANT_PATIENT)}</p>
                </div>
              </Col>
            </Row>
          </div>

          <div className="section">
            <h3 className="section-title">
              <FileTextOutlined /> OBSERVATIONS ET RECOMMANDATIONS
            </h3>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="notes-card">
                  <h4>Observations</h4>
                  <p>{evacuation.OBSERVATIONS || 'Aucune observation'}</p>
                </div>
              </Col>
              <Col span={12}>
                <div className="notes-card">
                  <h4>Recommandations</h4>
                  <p>{evacuation.RECOMMANDATIONS || 'Aucune recommandation'}</p>
                </div>
              </Col>
            </Row>
          </div>

          <div className="section">
            <h3 className="section-title">
              <SafetyCertificateOutlined /> SIGNATURES ET VALIDATIONS
            </h3>
            <Row gutter={[16, 16]} className="signatures">
              <Col span={8}>
                <div className="signature-box">
                  <p>Médecin prescripteur</p>
                  <div className="signature-line"></div>
                  <p>Nom et signature</p>
                </div>
              </Col>
              <Col span={8}>
                <div className="signature-box">
                  <p>Responsable administratif</p>
                  <div className="signature-line"></div>
                  <p>Nom et signature</p>
                </div>
              </Col>
              <Col span={8}>
                <div className="signature-box">
                  <p>Patient ou représentant</p>
                  <div className="signature-line"></div>
                  <p>Nom et signature</p>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        <div className="print-footer">
          <p className="footer-note">
            Document généré le {moment().format('DD/MM/YYYY à HH:mm')} • 
            Fiche d'évacuation médicale • {centreActuel.nom}
          </p>
          <div className="watermark">
            {centreActuel.nom}
          </div>
        </div>
      </div>
    );
  });

  // ==================== FONCTIONS UTILITAIRES ====================

  const getEvacuationStatusDisplay = (status) => {
    const statusMap = {
      'en_attente': { text: 'En attente', color: 'warning', icon: 'schedule' },
      'en_cours': { text: 'En cours', color: 'info', icon: 'sync' },
      'terminee': { text: 'Terminée', color: 'success', icon: 'check_circle' },
      'annulee': { text: 'Annulée', color: 'error', icon: 'cancel' },
      'rejetee': { text: 'Rejetée', color: 'error', icon: 'block' }
    };
    
    return statusMap[status] || { text: status, color: 'default', icon: 'help' };
  };

  const getEvacuationDecisionDisplay = (decision) => {
    const decisionMap = {
      'approuvee': { text: 'Approuvée', color: 'success', icon: 'thumb_up' },
      'rejetee': { text: 'Rejetée', color: 'error', icon: 'thumb_down' },
      'en_attente': { text: 'En attente', color: 'warning', icon: 'schedule' }
    };
    
    return decisionMap[decision] || { text: decision, color: 'default', icon: 'help' };
  };

  const getEvacuationGraviteDisplay = (gravite) => {
    const graviteMap = {
      '1': { text: 'Critique', color: 'error', icon: 'error' },
      '2': { text: 'Urgent', color: 'warning', icon: 'warning' },
      '3': { text: 'Semi-urgent', color: 'info', icon: 'info' },
      '4': { text: 'Non urgent', color: 'success', icon: 'check_circle' }
    };
    
    return graviteMap[gravite] || { text: 'Non spécifié', color: 'default', icon: 'help' };
  };

  const getStatutColor = (statut) => {
    const statutMap = {
      'en_attente': 'warning',
      'en_cours': 'processing',
      'terminee': 'success',
      'annulee': 'error',
      'rejetee': 'error'
    };
    return statutMap[statut] || 'default';
  };

  const getStatutIcon = (statut) => {
    const iconMap = {
      'en_attente': <ClockCircleOutlined />,
      'en_cours': <SyncOutlined spin />,
      'terminee': <CheckCircleOutlined />,
      'annulee': <CloseCircleOutlined />,
      'rejetee': <CloseCircleOutlined />
    };
    return iconMap[statut] || <InfoCircleOutlined />;
  };

  const getGraviteConfig = (gravite) => {
    const configs = {
      '1': { color: 'error', icon: <WarningOutlined />, label: 'Critique' },
      '2': { color: 'warning', icon: <WarningOutlined />, label: 'Urgent' },
      '3': { color: 'blue', icon: <InfoCircleOutlined />, label: 'Semi-urgent' },
      '4': { color: 'success', icon: <CheckCircleOutlined />, label: 'Non urgent' }
    };
    return configs[gravite] || { color: 'default', icon: <InfoCircleOutlined />, label: 'Non spécifié' };
  };

  const getTransportIcon = (transport) => {
    const iconMap = {
      'ambulance': <CarOutlined />,
      'avion': <CarOutlined />,
      'helicoptere': <CarOutlined />,
      'voiture': <CarOutlined />,
      'train': <CarOutlined />,
      'bateau': <CarOutlined />
    };
    return iconMap[transport] || <CarOutlined />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // ==================== FONCTIONS DE CHARGEMENT ====================

  const loadEvacuations = useCallback(async () => {
    setLoading(prev => ({ ...prev, evacuations: true }));
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...(filters.statut !== 'all' && filters.statut ? { statut: filters.statut } : {}),
        ...(filters.decision !== 'all' && filters.decision ? { decision: filters.decision } : {}),
        ...(filters.gravite !== 'all' && filters.gravite ? { gravite: filters.gravite } : {}),
        ...(filters.urgence !== 'all' && filters.urgence ? { urgence: filters.urgence === 'true' ? '1' : '0' } : {}),
        ...(filters.destination && { destination: filters.destination }),
        ...(filters.moyen_transport !== 'all' && filters.moyen_transport ? { moyen_transport: filters.moyen_transport } : {}),
        ...(filters.search && { search: filters.search }),
        ...(filters.date_debut && { date_debut: moment(filters.date_debut).format('YYYY-MM-DD') }),
        ...(filters.date_fin && { date_fin: moment(filters.date_fin).format('YYYY-MM-DD') })
      };
      
      const result = await evacuationsAPI.getAll(params);
      
      if (result.success) {
        const formattedEvacuations = (result.evacuations || []).map(evac => ({
          ...evac,
          key: evac.id,
          DATE_DEMANDE: evac.DATE_DEMANDE ? moment(evac.DATE_DEMANDE) : null,
          DATE_DEPART: evac.DATE_DEPART ? moment(evac.DATE_DEPART) : null,
          DATE_ARRIVEE: evac.DATE_ARRIVEE ? moment(evac.DATE_ARRIVEE) : null
        }));
        
        setEvacuations(formattedEvacuations);
        setPagination(prev => ({
          ...prev,
          total: result.pagination?.total || formattedEvacuations.length
        }));
        
        // Calcul des statistiques
        if (result.statistics) {
          setStatistiques(result.statistics);
        } else {
          const total = formattedEvacuations.length;
          const en_attente = formattedEvacuations.filter(e => e.STATUT === 'en_attente').length;
          const en_cours = formattedEvacuations.filter(e => e.STATUT === 'en_cours').length;
          const terminees = formattedEvacuations.filter(e => e.STATUT === 'terminee').length;
          const annulees = formattedEvacuations.filter(e => e.STATUT === 'annulee' || e.STATUT === 'rejetee').length;
          const urgent_count = formattedEvacuations.filter(e => e.URGENCE === true || e.URGENCE === 1).length;
          const total_cout_estime = formattedEvacuations.reduce((sum, e) => sum + (parseFloat(e.COUT_ESTIME) || 0), 0);
          const moyenne_cout_estime = total > 0 ? total_cout_estime / total : 0;
          
          setStatistiques({
            total,
            en_attente,
            en_cours,
            terminees,
            annulees,
            urgent_count,
            total_cout_estime,
            moyenne_cout_estime
          });
        }
        
        // Extraire les destinations uniques
        const uniqueDestinations = [...new Set(
          formattedEvacuations
            .filter(e => e.DESTINATION)
            .map(e => e.DESTINATION)
        )].map(dest => ({ value: dest, label: dest }));
        
        setDestinations(uniqueDestinations);
        
        message.success(`${formattedEvacuations.length} évacuation(s) chargée(s)`);
      } else {
        message.error(result.message || 'Erreur lors du chargement des évacuations');
        setEvacuations([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement évacuations:', error);
      message.error('Erreur de connexion au serveur');
      setEvacuations([]);
    } finally {
      setLoading(prev => ({ ...prev, evacuations: false }));
    }
  }, [filters, pagination.current, pagination.pageSize]);

  const loadStatistics = useCallback(async () => {
    try {
      const response = await evacuationsAPI.getStatistics('month');
      if (response.success) {
        setStatistiques(response.statistics);
      }
    } catch (error) {
      console.error('❌ Erreur chargement statistiques:', error);
    }
  }, []);

  const loadPatients = useCallback(async (searchTerm = '') => {
    try {
      const response = await beneficiairesAPI.getAll({
        limit: 100,
        page: 1,
        search: searchTerm,
        actif: 1
      });
      
      if (response.success && response.beneficiaires) {
        const formattedPatients = response.beneficiaires.map(patient => ({
          value: patient.ID_BEN || patient.id,
          label: `${patient.NOM_BEN || patient.nom} ${patient.PRE_BEN || patient.prenom} - ${patient.ID_BEN || patient.id}`,
          ...patient
        }));
        
        setPatients(formattedPatients);
        return formattedPatients;
      }
      return [];
    } catch (error) {
      console.error('❌ Erreur chargement patients:', error);
      return [];
    }
  }, []);

  const loadCentres = useCallback(async () => {
    try {
      const response = await centresAPI.getAll({
        limit: 100,
        page: 1,
        actif: 1
      });
      
      if (response.success && response.centres) {
        const formattedCentres = response.centres.map(centre => ({
          value: centre.COD_CEN || centre.id,
          label: `${centre.NOM_CENTRE || centre.nom} - ${centre.COD_CEN || centre.code}`,
          ...centre
        }));
        
        setCentres(formattedCentres);
      }
    } catch (error) {
      console.error('❌ Erreur chargement centres:', error);
    }
  }, []);

  const loadPrestataires = useCallback(async () => {
    try {
      const response = await prestatairesAPI.getAll({
        limit: 100,
        page: 1,
        actif: 1
      });
      
      if (response.success && response.prestataires) {
        const formattedPrestataires = response.prestataires.map(prest => ({
          value: prest.COD_PRE || prest.id,
          label: `${prest.NOM_PRESTATAIRE || prest.nom} ${prest.PRENOM_PRESTATAIRE || prest.prenom}`,
          ...prest
        }));
        
        setPrestataires(formattedPrestataires);
      }
    } catch (error) {
      console.error('❌ Erreur chargement prestataires:', error);
    }
  }, []);

  const loadEvacuationDetails = useCallback(async (evacuationId) => {
    setLoading(prev => ({ ...prev, details: true }));
    try {
      const response = await evacuationsAPI.getById(evacuationId);
      
      if (response.success && response.evacuation) {
        const evacuation = response.evacuation;
        
        // Charger les documents
        const docsResponse = await evacuationsAPI.getDocuments(evacuationId);
        const documents = docsResponse.success ? docsResponse.documents : [];
        
        // Charger les frais
        const fraisResponse = await evacuationsAPI.getFrais(evacuationId);
        const frais = fraisResponse.success ? fraisResponse.frais : [];
        
        setDetailsDrawer({
          visible: true,
          evacuation: {
            ...evacuation,
            DATE_DEMANDE: evacuation.DATE_DEMANDE ? moment(evacuation.DATE_DEMANDE) : null,
            DATE_DEPART: evacuation.DATE_DEPART ? moment(evacuation.DATE_DEPART) : null,
            DATE_ARRIVEE: evacuation.DATE_ARRIVEE ? moment(evacuation.DATE_ARRIVEE) : null,
            DATE_PREVUE_RETOUR: evacuation.DATE_PREVUE_RETOUR ? moment(evacuation.DATE_PREVUE_RETOUR) : null
          },
          documents,
          frais,
          statistiques: {
            total_documents: documents.length,
            total_frais: frais.reduce((sum, f) => sum + (parseFloat(f.montant) || 0), 0),
            frais_count: frais.length
          }
        });
        
        message.success('Détails de l\'évacuation chargés');
      } else {
        message.error(response.message || 'Erreur lors du chargement des détails');
      }
    } catch (error) {
      console.error('❌ Erreur chargement détails:', error);
      message.error('Erreur lors du chargement des détails');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  }, []);

  // ==================== FONCTIONS DE GESTION ====================

  const handleCreateEvacuation = async (values) => {
    setEvacuationModal(prev => ({ ...prev, loading: true }));
    
    try {
      const evacuationData = {
        ID_BEN: values.ID_BEN,
        ID_MEDECIN: values.ID_MEDECIN || null,
        DIAGNOSTIC: values.DIAGNOSTIC || '',
        MOTIF_EVACUATION: values.MOTIF_EVACUATION,
        URGENCE: values.URGENCE || false,
        GRAVITE: values.GRAVITE || '3',
        OBSERVATIONS: values.OBSERVATIONS || '',
        RECOMMANDATIONS: values.RECOMMANDATIONS || '',
        DATE_DEMANDE: values.DATE_DEMANDE ? values.DATE_DEMANDE.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
        DESTINATION: values.DESTINATION,
        HOPITAL_DESTINATION: values.HOPITAL_DESTINATION || '',
        ADRESSE_DESTINATION: values.ADRESSE_DESTINATION || '',
        TELEPHONE_DESTINATION: values.TELEPHONE_DESTINATION || '',
        MEDECIN_REFERENT: values.MEDECIN_REFERENT || '',
        ACCOMPAGNANTS: values.ACCOMPAGNANTS || '',
        MOYEN_TRANSPORT: values.MOYEN_TRANSPORT || null,
        TRANSPORT_SPECIAL: values.TRANSPORT_SPECIAL || false,
        NUMERO_VOL: values.NUMERO_VOL || '',
        COMPAGNIE_AERIENNE: values.COMPAGNIE_AERIENNE || '',
        COUT_ESTIME: values.COUT_ESTIME || 0,
        COD_CEN: values.COD_CEN || null
      };
      
      const result = await evacuationsAPI.create(evacuationData);
      
      if (result.success) {
        message.success('Évacuation créée avec succès');
        setEvacuationModal({ visible: false, mode: 'create', loading: false });
        evacuationForm.resetFields();
        loadEvacuations();
        loadStatistics();
      } else {
        throw new Error(result.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('❌ Erreur création évacuation:', error);
      message.error(error.message || 'Erreur lors de la création de l\'évacuation');
      setEvacuationModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleEditEvacuation = (record) => {
    // Formater l'enregistrement pour l'affichage
    const formattedRecord = formatEvacuationForDisplay(record);
    
    // Mettre à jour le formulaire avec les valeurs de l'évacuation
    evacuationForm.setFieldsValue({
      ID_BEN: formattedRecord.ID_BEN,
      COD_CEN: formattedRecord.COD_CEN,
      MOTIF_EVACUATION: formattedRecord.MOTIF_EVACUATION,
      DIAGNOSTIC: formattedRecord.DIAGNOSTIC,
      GRAVITE: formattedRecord.GRAVITE,
      URGENCE: formattedRecord.URGENCE,
      DATE_DEMANDE: formattedRecord.DATE_DEMANDE ? moment(formattedRecord.DATE_DEMANDE) : null,
      ID_MEDECIN: formattedRecord.ID_MEDECIN,
      OBSERVATIONS: formattedRecord.OBSERVATIONS,
      RECOMMANDATIONS: formattedRecord.RECOMMANDATIONS,
      DESTINATION: formattedRecord.DESTINATION,
      HOPITAL_DESTINATION: formattedRecord.HOPITAL_DESTINATION,
      ADRESSE_DESTINATION: formattedRecord.ADRESSE_DESTINATION,
      TELEPHONE_DESTINATION: formattedRecord.TELEPHONE_DESTINATION,
      MEDECIN_REFERENT: formattedRecord.MEDECIN_REFERENT,
      MOYEN_TRANSPORT: formattedRecord.MOYEN_TRANSPORT,
      TRANSPORT_SPECIAL: formattedRecord.TRANSPORT_SPECIAL,
      NUMERO_VOL: formattedRecord.NUMERO_VOL,
      COMPAGNIE_AERIENNE: formattedRecord.COMPAGNIE_AERIENNE,
      DATE_DEPART: formattedRecord.DATE_DEPART ? moment(formattedRecord.DATE_DEPART) : null,
      DATE_ARRIVEE: formattedRecord.DATE_ARRIVEE ? moment(formattedRecord.DATE_ARRIVEE) : null,
      ACCOMPAGNANTS: formattedRecord.ACCOMPAGNANTS,
      COUT_ESTIME: formattedRecord.COUT_ESTIME,
      COUT_REEL: formattedRecord.COUT_REEL,
      PRISE_EN_CHARGE: formattedRecord.PRISE_EN_CHARGE,
      MONTANT_PATIENT: formattedRecord.MONTANT_PATIENT
    });
    
    // Mettre à jour le drawer avec l'évacuation sélectionnée
    setDetailsDrawer(prev => ({
      ...prev,
      evacuation: formattedRecord
    }));
    
    // Ouvrir la modal en mode édition
    setEvacuationModal({
      visible: true,
      mode: 'edit',
      loading: false
    });
  };

  const handleUpdateEvacuation = async (values) => {
    const evacuationId = detailsDrawer.evacuation?.id;
    if (!evacuationId) {
      message.error('Aucune évacuation sélectionnée');
      return;
    }
    
    setEvacuationModal(prev => ({ ...prev, loading: true }));
    
    try {
      const evacuationData = {
        ID_BEN: values.ID_BEN,
        ID_MEDECIN: values.ID_MEDECIN || null,
        DIAGNOSTIC: values.DIAGNOSTIC || '',
        MOTIF_EVACUATION: values.MOTIF_EVACUATION,
        URGENCE: values.URGENCE || false,
        GRAVITE: values.GRAVITE || '3',
        OBSERVATIONS: values.OBSERVATIONS || '',
        RECOMMANDATIONS: values.RECOMMANDATIONS || '',
        DATE_DEMANDE: values.DATE_DEMANDE ? values.DATE_DEMANDE.format('YYYY-MM-DD') : null,
        DATE_DEPART: values.DATE_DEPART ? values.DATE_DEPART.format('YYYY-MM-DD') : null,
        DATE_ARRIVEE: values.DATE_ARRIVEE ? values.DATE_ARRIVEE.format('YYYY-MM-DD') : null,
        DATE_PREVUE_RETOUR: values.DATE_PREVUE_RETOUR ? values.DATE_PREVUE_RETOUR.format('YYYY-MM-DD') : null,
        DESTINATION: values.DESTINATION,
        HOPITAL_DESTINATION: values.HOPITAL_DESTINATION || '',
        ADRESSE_DESTINATION: values.ADRESSE_DESTINATION || '',
        TELEPHONE_DESTINATION: values.TELEPHONE_DESTINATION || '',
        MEDECIN_REFERENT: values.MEDECIN_REFERENT || '',
        ACCOMPAGNANTS: values.ACCOMPAGNANTS || '',
        MOYEN_TRANSPORT: values.MOYEN_TRANSPORT || null,
        TRANSPORT_SPECIAL: values.TRANSPORT_SPECIAL || false,
        NUMERO_VOL: values.NUMERO_VOL || '',
        COMPAGNIE_AERIENNE: values.COMPAGNIE_AERIENNE || '',
        COUT_ESTIME: values.COUT_ESTIME || 0,
        COUT_REEL: values.COUT_REEL || 0,
        PRISE_EN_CHARGE: values.PRISE_EN_CHARGE || 0,
        MONTANT_PATIENT: values.MONTANT_PATIENT || 0,
        COD_CEN: values.COD_CEN || null,
        COD_MODUTIL: user?.id || user?.username || 'SYSTEM'
      };
      
      const result = await evacuationsAPI.update(evacuationId, evacuationData);
      
      if (result.success) {
        message.success('Évacuation mise à jour avec succès');
        setEvacuationModal({ visible: false, mode: 'edit', loading: false });
        evacuationForm.resetFields();
        loadEvacuations();
        loadEvacuationDetails(evacuationId);
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour évacuation:', error);
      message.error(error.message || 'Erreur lors de la mise à jour de l\'évacuation');
      setEvacuationModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleUpdateStatus = async (values) => {
    const { statut, notes_decision } = values;
    const evacuationId = statusModal.evacuationId;
    
    if (!evacuationId) {
      message.error('Aucune évacuation sélectionnée');
      return;
    }
    
    setStatusModal(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await evacuationsAPI.updateStatus(evacuationId, statut, notes_decision);
      
      if (result.success) {
        message.success(`Statut mis à jour à "${statutOptions.find(s => s.value === statut)?.label}"`);
        setStatusModal({ visible: false, evacuationId: null, loading: false });
        statusForm.resetFields();
        loadEvacuations();
        
        if (detailsDrawer.visible) {
          loadEvacuationDetails(evacuationId);
        }
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      message.error(error.message || 'Erreur lors de la mise à jour du statut');
      setStatusModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCancelEvacuation = async (evacuationId) => {
    try {
      Modal.confirm({
        title: 'Annuler l\'évacuation',
        content: (
          <div>
            <p>Êtes-vous sûr de vouloir annuler cette évacuation ?</p>
            <Input 
              placeholder="Raison de l'annulation"
              id="raison_annulation"
              style={{ marginTop: 10 }}
            />
          </div>
        ),
        onOk: async () => {
          const raison = document.getElementById('raison_annulation').value;
          if (!raison) {
            message.error('Veuillez spécifier une raison d\'annulation');
            return;
          }
          
          const result = await evacuationsAPI.cancel(evacuationId, raison);
          
          if (result.success) {
            message.success('Évacuation annulée avec succès');
            loadEvacuations();
            if (detailsDrawer.visible) {
              setDetailsDrawer({ visible: false, evacuation: null, documents: [], frais: [] });
            }
          } else {
            throw new Error(result.message || 'Erreur lors de l\'annulation');
          }
        }
      });
    } catch (error) {
      console.error('❌ Erreur annulation évacuation:', error);
      message.error(error.message || 'Erreur lors de l\'annulation de l\'évacuation');
    }
  };

  const handleDeleteEvacuation = async (evacuationId) => {
    Modal.confirm({
      title: 'Supprimer l\'évacuation',
      content: 'Êtes-vous sûr de vouloir supprimer définitivement cette évacuation ? Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          // Note: Nous n'avons pas de méthode delete dans l'API, donc nous annulons
          const result = await evacuationsAPI.cancel(evacuationId, 'Suppression manuelle');
          
          if (result.success) {
            message.success('Évacuation supprimée avec succès');
            loadEvacuations();
            if (detailsDrawer.visible) {
              setDetailsDrawer({ visible: false, evacuation: null, documents: [], frais: [] });
            }
          } else {
            throw new Error(result.message || 'Erreur lors de la suppression');
          }
        } catch (error) {
          console.error('❌ Erreur suppression évacuation:', error);
          message.error(error.message || 'Erreur lors de la suppression de l\'évacuation');
        }
      }
    });
  };

  const formatEvacuationForDisplay = (evacuation) => {
    return {
      // Identifiants
      id: evacuation.id || evacuation.ID_EVACUATION,
      ID_EVACUATION: evacuation.ID_EVACUATION || evacuation.id,
      REFERENCE: evacuation.REFERENCE || evacuation.reference || `EVAC-${(evacuation.id || evacuation.ID_EVACUATION || '').toString().padStart(6, '0')}`,
      
      // Informations patient
      ID_BEN: evacuation.ID_BEN || evacuation.patient_id,
      patient_id: evacuation.patient_id || evacuation.ID_BEN,
      NOM_BEN: evacuation.NOM_BEN || evacuation.patient_nom,
      PRE_BEN: evacuation.PRE_BEN || evacuation.patient_prenom,
      patient_nom: evacuation.patient_nom || evacuation.NOM_BEN,
      patient_prenom: evacuation.patient_prenom || evacuation.PRE_BEN,
      patient_age: evacuation.patient_age || evacuation.age,
      patient_sexe: evacuation.patient_sexe || evacuation.sexe,
      patient_telephone: evacuation.patient_telephone || evacuation.TELEPHONE_MOBILE,
      patient_identifiant: evacuation.patient_identifiant || evacuation.IDENTIFIANT_NATIONAL,
      patient_groupe_sanguin: evacuation.patient_groupe_sanguin || evacuation.GROUPE_SANGUIN,
      patient_rhesus: evacuation.patient_rhesus || evacuation.RHESUS,
      
      // Informations médicales
      DIAGNOSTIC: evacuation.DIAGNOSTIC || evacuation.diagnostic,
      MOTIF_EVACUATION: evacuation.MOTIF_EVACUATION || evacuation.motif,
      URGENCE: evacuation.URGENCE || evacuation.urgence,
      GRAVITE: evacuation.GRAVITE || evacuation.gravite,
      OBSERVATIONS: evacuation.OBSERVATIONS || evacuation.observations,
      RECOMMANDATIONS: evacuation.RECOMMANDATIONS || evacuation.recommandations,
      
      // Dates
      DATE_DEMANDE: evacuation.DATE_DEMANDE || evacuation.date_demande,
      DATE_DECISION: evacuation.DATE_DECISION || evacuation.date_decision,
      DATE_DEPART: evacuation.DATE_DEPART || evacuation.date_depart,
      DATE_ARRIVEE: evacuation.DATE_ARRIVEE || evacuation.date_arrivee,
      DATE_PREVUE_RETOUR: evacuation.DATE_PREVUE_RETOUR || evacuation.date_retour_prevu,
      
      // Destination
      DESTINATION: evacuation.DESTINATION || evacuation.destination,
      HOPITAL_DESTINATION: evacuation.HOPITAL_DESTINATION || evacuation.hopital_destination,
      ADRESSE_DESTINATION: evacuation.ADRESSE_DESTINATION || evacuation.adresse_destination,
      TELEPHONE_DESTINATION: evacuation.TELEPHONE_DESTINATION || evacuation.telephone_destination,
      
      // Médecin et accompagnants
      MEDECIN_REFERENT: evacuation.MEDECIN_REFERENT || evacuation.medecin_referent,
      ID_MEDECIN: evacuation.ID_MEDECIN || evacuation.medecin_id,
      medecin_nom: evacuation.medecin_nom || evacuation.NOM_MEDECIN,
      medecin_prenom: evacuation.medecin_prenom || evacuation.PRENOM_MEDECIN,
      medecin_nom_complet: evacuation.medecin_nom_complet || `${evacuation.medecin_nom || ''} ${evacuation.medecin_prenom || ''}`.trim(),
      medecin_specialite: evacuation.medecin_specialite || evacuation.SPECIALITE,
      medecin_telephone: evacuation.medecin_telephone || evacuation.TELEPHONE,
      medecin_email: evacuation.medecin_email || evacuation.EMAIL,
      ACCOMPAGNANTS: evacuation.ACCOMPAGNANTS || evacuation.accompagnants,
      
      // Transport
      MOYEN_TRANSPORT: evacuation.MOYEN_TRANSPORT || evacuation.moyen_transport,
      TRANSPORT_SPECIAL: evacuation.TRANSPORT_SPECIAL || evacuation.transport_special,
      NUMERO_VOL: evacuation.NUMERO_VOL || evacuation.numero_vol,
      COMPAGNIE_AERIENNE: evacuation.COMPAGNIE_AERIENNE || evacuation.compagnie_aerienne,
      
      // Statut et décision
      STATUT: evacuation.STATUT || evacuation.statut,
      DECISION: evacuation.DECISION || evacuation.decision,
      MOTIF_REJET: evacuation.MOTIF_REJET || evacuation.motif_rejet,
      NOTES_DECISION: evacuation.NOTES_DECISION || evacuation.notes_decision,
      
      // Coûts
      COUT_ESTIME: evacuation.COUT_ESTIME || evacuation.cout_estime,
      COUT_REEL: evacuation.COUT_REEL || evacuation.cout_reel,
      PRISE_EN_CHARGE: evacuation.PRISE_EN_CHARGE || evacuation.prise_en_charge,
      MONTANT_PATIENT: evacuation.MONTANT_PATIENT || evacuation.montant_patient,
      
      // Centre
      COD_CEN: evacuation.COD_CEN || evacuation.centre_id,
      centre_libelle: evacuation.centre_libelle || evacuation.LIB_CEN,
      centre_telephone: evacuation.centre_telephone || evacuation.TR1_CEN,
      centre_adresse: evacuation.centre_adresse || evacuation.NUM_ADR || '',
      
      // Métadonnées
      COD_CREUTIL: evacuation.COD_CREUTIL || evacuation.created_by,
      COD_MODUTIL: evacuation.COD_MODUTIL || evacuation.modified_by,
      DAT_CREUTIL: evacuation.DAT_CREUTIL || evacuation.created_at,
      DAT_MODUTIL: evacuation.DAT_MODUTIL || evacuation.updated_at,
      
      // Pour l'affichage
      status_display: getEvacuationStatusDisplay(evacuation.STATUT || evacuation.statut),
      decision_display: getEvacuationDecisionDisplay(evacuation.DECISION || evacuation.decision),
      gravite_display: getEvacuationGraviteDisplay(evacuation.GRAVITE || evacuation.gravite),
      
      // Conserver toutes les autres propriétés
      ...evacuation
    };
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      statut: 'all',
      decision: 'all',
      gravite: 'all',
      urgence: 'all',
      date_debut: null,
      date_fin: null,
      destination: '',
      moyen_transport: 'all'
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const openStatusModal = (evacuationId, currentStatus) => {
    setStatusModal({
      visible: true,
      evacuationId,
      loading: false
    });
    
    statusForm.setFieldsValue({
      statut: currentStatus
    });
  };

  // ==================== CONFIGURATION DES COLONNES DU TABLEAU ====================

  const evacuationsColumns = [
    {
      title: 'Référence',
      dataIndex: 'REFERENCE',
      key: 'REFERENCE',
      width: 150,
      render: (text, record) => (
        <Space>
          <Badge 
            count={record.URGENCE ? 'URGENT' : null} 
            style={{ 
              backgroundColor: record.URGENCE ? '#f5222d' : '#d9d9d9',
              fontSize: '10px',
              marginRight: 8
            }} 
          />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Patient',
      dataIndex: 'patient_nom',
      key: 'patient',
      width: 200,
      render: (text, record) => (
        <div>
          <Text strong>{record.NOM_BEN} {record.PRE_BEN}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.patient_age} ans • {record.patient_sexe}
          </Text>
        </div>
      )
    },
    {
      title: 'Destination',
      dataIndex: 'DESTINATION',
      key: 'DESTINATION',
      width: 150,
      render: (text, record) => (
        <div>
          <Text>{text}</Text>
          {record.HOPITAL_DESTINATION && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.HOPITAL_DESTINATION}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Date demande',
      dataIndex: 'DATE_DEMANDE',
      key: 'DATE_DEMANDE',
      width: 120,
      render: (date) => date ? moment(date).format('DD/MM/YY') : '-'
    },
    {
      title: 'Statut',
      dataIndex: 'STATUT',
      key: 'STATUT',
      width: 120,
      render: (statut) => {
        const option = statutOptions.find(s => s.value === statut);
        return option ? (
          <Tag color={option.color} icon={option.icon}>
            {option.label}
          </Tag>
        ) : (
          <Tag>{statut}</Tag>
        );
      }
    },
    {
      title: 'Gravité',
      dataIndex: 'GRAVITE',
      key: 'GRAVITE',
      width: 100,
      render: (gravite) => {
        const config = getGraviteConfig(gravite);
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      }
    },
    {
      title: 'Transport',
      dataIndex: 'MOYEN_TRANSPORT',
      key: 'MOYEN_TRANSPORT',
      width: 120,
      render: (transport) => transport ? (
        <Space>
          {getTransportIcon(transport)}
          <span>{transport}</span>
        </Space>
      ) : '-'
    },
    {
      title: 'Coût estimé',
      dataIndex: 'COUT_ESTIME',
      key: 'COUT_ESTIME',
      width: 120,
      render: (cout) => cout ? formatCurrency(cout) : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir détails">
            <Button
              icon={<EyeOutlined />}
              onClick={() => loadEvacuationDetails(record.id)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEditEvacuation(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Changer statut">
            <Button
              icon={<SyncOutlined />}
              onClick={() => openStatusModal(record.id, record.STATUT)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Popconfirm
              title="Êtes-vous sûr de vouloir supprimer cette évacuation ?"
              onConfirm={() => handleDeleteEvacuation(record.id)}
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
    loadEvacuations();
    loadStatistics();
    loadCentres();
    loadPrestataires();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadEvacuations();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [filters, pagination.current, loadEvacuations]);

  // ==================== RENDU PRINCIPAL ====================

  return (
    <div style={{ padding: '24px' }}>
      {/* En-tête */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CarOutlined style={{ marginRight: '12px', fontSize: '24px', color: '#1890ff' }} />
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
              Gestion des Évacuations
            </span>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              evacuationForm.resetFields();
              evacuationForm.setFieldsValue({ 
                DATE_DEMANDE: moment(),
                GRAVITE: '3',
                URGENCE: false,
                TRANSPORT_SPECIAL: false,
                COUT_ESTIME: 0
              });
              setEvacuationModal({
                visible: true,
                mode: 'create',
                loading: false
              });
            }}
          >
            Nouvelle Évacuation
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
                    placeholder="Rechercher par référence, patient..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    style={{ width: '250px' }}
                    prefix={<SearchOutlined />}
                  />
                </Col>
                <Col>
                  <Select
                    value={filters.statut}
                    onChange={(value) => handleFilterChange('statut', value)}
                    style={{ width: '150px' }}
                    placeholder="Statut"
                  >
                    <Option value="all">Tous les statuts</Option>
                    {statutOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col>
                  <Select
                    value={filters.gravite}
                    onChange={(value) => handleFilterChange('gravite', value)}
                    style={{ width: '150px' }}
                    placeholder="Gravité"
                  >
                    <Option value="all">Toutes</Option>
                    {graviteOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col>
                  <DatePicker
                    placeholder="Date début"
                    value={filters.date_debut}
                    onChange={(date) => handleFilterChange('date_debut', date)}
                    style={{ width: '150px' }}
                  />
                </Col>
                <Col>
                  <DatePicker
                    placeholder="Date fin"
                    value={filters.date_fin}
                    onChange={(date) => handleFilterChange('date_fin', date)}
                    style={{ width: '150px' }}
                  />
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
                    onClick={loadEvacuations}
                    icon={<SyncOutlined />}
                    loading={loading.evacuations}
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
          <Col xs={24} sm={12} md={4}>
            <Card size="small" hoverable>
              <Statistic
                title="Total Évacuations"
                value={statistiques.total}
                prefix={<CarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card size="small" hoverable>
              <Statistic
                title="En attente"
                value={statistiques.en_attente}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card size="small" hoverable>
              <Statistic
                title="En cours"
                value={statistiques.en_cours}
                prefix={<SyncOutlined spin />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card size="small" hoverable>
              <Statistic
                title="Terminées"
                value={statistiques.terminees}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card size="small" hoverable>
              <Statistic
                title="Urgentes"
                value={statistiques.urgent_count}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card size="small" hoverable>
              <Statistic
                title="Coût total estimé"
                value={statistiques.total_cout_estime}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#722ed1' }}
                formatter={(value) => formatCurrency(value)}
              />
            </Card>
          </Col>
        </Row>

        {/* Tableau des évacuations */}
        <Card
          title={`Liste des Évacuations (${pagination.total})`}
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
            columns={evacuationsColumns}
            dataSource={evacuations}
            loading={loading.evacuations}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} sur ${total} évacuations`,
              onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize, total: pagination.total });
              }
            }}
            scroll={{ x: 1300 }}
          />
        </Card>
      </Card>

      {/* ==================== MODALES ==================== */}

      {/* Modal Création/Édition Évacuation */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {evacuationModal.mode === 'create' ? (
              <>
                <PlusOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                Créer une Nouvelle Évacuation
              </>
            ) : (
              <>
                <EditOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                Modifier l'Évacuation
              </>
            )}
          </div>
        }
        open={evacuationModal.visible}
        onCancel={() => {
          setEvacuationModal({ visible: false, mode: 'create', loading: false });
          evacuationForm.resetFields();
        }}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => {
            setEvacuationModal({ visible: false, mode: 'create', loading: false });
            evacuationForm.resetFields();
          }}>
            Annuler
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={evacuationModal.loading}
            onClick={() => evacuationForm.submit()}
          >
            {evacuationModal.mode === 'create' ? 'Créer' : 'Modifier'}
          </Button>
        ]}
        destroyOnClose
      >
        <Form
          form={evacuationForm}
          layout="vertical"
          onFinish={evacuationModal.mode === 'create' ? handleCreateEvacuation : handleUpdateEvacuation}
        >
          <Tabs defaultActiveKey="info">
            <TabPane tab="Informations Générales" key="info">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="ID_BEN"
                    label="Patient"
                    rules={[{ required: true, message: 'Veuillez sélectionner un patient' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Rechercher un patient..."
                      optionFilterProp="children"
                      onSearch={(value) => loadPatients(value)}
                      loading={loading.patient}
                      filterOption={(input, option) =>
                        option?.label?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {patients.map(patient => (
                        <Option key={patient.value} value={patient.value}>
                          {patient.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="COD_CEN"
                    label="Centre d'origine"
                  >
                    <Select placeholder="Sélectionnez un centre">
                      <Option value="">Non spécifié</Option>
                      {centres.map(centre => (
                        <Option key={centre.value} value={centre.value}>
                          {centre.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="MOTIF_EVACUATION"
                    label="Motif d'évacuation"
                    rules={[{ required: true, message: 'Veuillez saisir le motif' }]}
                  >
                    <Input placeholder="Ex: Chirurgie spécialisée, traitement spécifique..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="DIAGNOSTIC"
                    label="Diagnostic"
                  >
                    <Input placeholder="Diagnostic principal" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="GRAVITE"
                    label="Gravité"
                    initialValue="3"
                  >
                    <Select>
                      {graviteOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          <Tag color={option.color} icon={option.icon}>
                            {option.label}
                          </Tag>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="URGENCE"
                    label="Urgence"
                    valuePropName="checked"
                  >
                    <Select>
                      <Option value={false}>Non urgent</Option>
                      <Option value={true}>Urgent</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="DATE_DEMANDE"
                    label="Date de demande"
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="ID_MEDECIN"
                    label="Médecin prescripteur"
                  >
                    <Select placeholder="Sélectionnez un médecin">
                      <Option value="">Non spécifié</Option>
                      {prestataires.map(prest => (
                        <Option key={prest.value} value={prest.value}>
                          {prest.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="OBSERVATIONS"
                label="Observations"
              >
                <TextArea rows={2} placeholder="Observations médicales..." />
              </Form.Item>

              <Form.Item
                name="RECOMMANDATIONS"
                label="Recommandations"
              >
                <TextArea rows={2} placeholder="Recommandations pour le transfert..." />
              </Form.Item>
            </TabPane>

            <TabPane tab="Destination" key="destination">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="DESTINATION"
                    label="Destination"
                    rules={[{ required: true, message: 'Veuillez saisir la destination' }]}
                  >
                    <Input placeholder="Ex: Paris, Dakar, Abidjan..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="HOPITAL_DESTINATION"
                    label="Hôpital de destination"
                  >
                    <Input placeholder="Nom de l'hôpital" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="ADRESSE_DESTINATION"
                label="Adresse"
              >
                <Input placeholder="Adresse complète de l'hôpital" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="TELEPHONE_DESTINATION"
                    label="Téléphone"
                  >
                    <Input placeholder="Numéro de contact" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="MEDECIN_REFERENT"
                    label="Médecin référent"
                  >
                    <Input placeholder="Nom du médecin référent" />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="Transport" key="transport">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="MOYEN_TRANSPORT"
                    label="Moyen de transport"
                  >
                    <Select placeholder="Sélectionnez un transport">
                      <Option value="">Non spécifié</Option>
                      {transportOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          <Space>
                            {option.icon}
                            {option.label}
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="TRANSPORT_SPECIAL"
                    label="Transport spécial"
                    valuePropName="checked"
                  >
                    <Select>
                      <Option value={false}>Standard</Option>
                      <Option value={true}>Spécial (SMUR, réa...)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="NUMERO_VOL"
                    label="Numéro de vol"
                  >
                    <Input placeholder="Ex: AF1234" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="COMPAGNIE_AERIENNE"
                    label="Compagnie aérienne"
                  >
                    <Input placeholder="Ex: Air France, Ethiopian..." />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="DATE_DEPART"
                    label="Date de départ"
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="DATE_ARRIVEE"
                    label="Date d'arrivée"
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="ACCOMPAGNANTS"
                label="Accompagnants"
              >
                <TextArea rows={2} placeholder="Noms des accompagnants..." />
              </Form.Item>
            </TabPane>

            <TabPane tab="Financier" key="financier">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="COUT_ESTIME"
                    label="Coût estimé (FCFA)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                      parser={value => value.replace(/\s/g, '')}
                      min={0}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="COUT_REEL"
                    label="Coût réel (FCFA)"
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
                <Col span={12}>
                  <Form.Item
                    name="PRISE_EN_CHARGE"
                    label="Prise en charge (%)"
                  >
                    <Select placeholder="Pourcentage de prise en charge">
                      {priseEnChargeOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="MONTANT_PATIENT"
                    label="Montant patient (FCFA)"
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
            </TabPane>
          </Tabs>
        </Form>
      </Modal>

      {/* Drawer Détails Évacuation */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CarOutlined style={{ marginRight: '12px', fontSize: '20px' }} />
            <span>Détails de l'Évacuation: {detailsDrawer.evacuation?.REFERENCE}</span>
          </div>
        }
        width={900}
        open={detailsDrawer.visible}
        onClose={() => setDetailsDrawer({ 
          visible: false, 
          evacuation: null,
          documents: [],
          frais: [],
          statistiques: {}
        })}
        extra={
          <Space>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => setPrintModal({ visible: true, loading: false })}
              disabled={!detailsDrawer.evacuation}
            >
              Imprimer
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={() => detailsDrawer.evacuation && handleEditEvacuation(detailsDrawer.evacuation)}
              disabled={!detailsDrawer.evacuation}
            >
              Modifier
            </Button>
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={() => detailsDrawer.evacuation && openStatusModal(detailsDrawer.evacuation.id, detailsDrawer.evacuation.STATUT)}
              disabled={!detailsDrawer.evacuation}
            >
              Changer statut
            </Button>
          </Space>
        }
      >
        {loading.details ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '20px' }}>Chargement des détails...</div>
          </div>
        ) : detailsDrawer.evacuation ? (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <Avatar
                  size={64}
                  icon={<CarOutlined />}
                  style={{
                    backgroundColor: getStatutColor(detailsDrawer.evacuation.STATUT),
                    color: '#fff',
                    marginRight: '16px'
                  }}
                />
                <div>
                  <Typography.Title level={3} style={{ margin: 0 }}>
                    {detailsDrawer.evacuation.REFERENCE}
                  </Typography.Title>
                  <Space style={{ marginTop: '8px' }}>
                    <Tag color={getStatutColor(detailsDrawer.evacuation.STATUT)} icon={getStatutIcon(detailsDrawer.evacuation.STATUT)}>
                      {statutOptions.find(s => s.value === detailsDrawer.evacuation.STATUT)?.label || detailsDrawer.evacuation.STATUT}
                    </Tag>
                    <Tag color={getGraviteConfig(detailsDrawer.evacuation.GRAVITE).color}>
                      {getGraviteConfig(detailsDrawer.evacuation.GRAVITE).label}
                    </Tag>
                    {detailsDrawer.evacuation.URGENCE && (
                      <Tag color="error">URGENT</Tag>
                    )}
                  </Space>
                </div>
              </div>

              <Tabs defaultActiveKey="info">
                <TabPane tab="Informations" key="info">
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Patient">
                      <Text strong>{detailsDrawer.evacuation.NOM_BEN} {detailsDrawer.evacuation.PRE_BEN}</Text>
                      <br />
                      <Text type="secondary">
                        {detailsDrawer.evacuation.patient_age} ans • {detailsDrawer.evacuation.patient_sexe}
                      </Text>
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Diagnostic">
                      {detailsDrawer.evacuation.DIAGNOSTIC || 'Non spécifié'}
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Motif">
                      {detailsDrawer.evacuation.MOTIF_EVACUATION}
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Destination">
                      <div>
                        <Text>{detailsDrawer.evacuation.DESTINATION}</Text>
                        {detailsDrawer.evacuation.HOPITAL_DESTINATION && (
                          <div>
                            <Text type="secondary">{detailsDrawer.evacuation.HOPITAL_DESTINATION}</Text>
                          </div>
                        )}
                        {detailsDrawer.evacuation.ADRESSE_DESTINATION && (
                          <div>
                            <Text type="secondary">{detailsDrawer.evacuation.ADRESSE_DESTINATION}</Text>
                          </div>
                        )}
                      </div>
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Transport">
                      {detailsDrawer.evacuation.MOYEN_TRANSPORT ? (
                        <Space>
                          {getTransportIcon(detailsDrawer.evacuation.MOYEN_TRANSPORT)}
                          <span>{detailsDrawer.evacuation.MOYEN_TRANSPORT}</span>
                          {detailsDrawer.evacuation.NUMERO_VOL && (
                            <Tag>Vol: {detailsDrawer.evacuation.NUMERO_VOL}</Tag>
                          )}
                        </Space>
                      ) : 'Non spécifié'}
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Dates">
                      <Space direction="vertical" size={0}>
                        <div>
                          <Text strong>Demande: </Text>
                          {detailsDrawer.evacuation.DATE_DEMANDE ? 
                            moment(detailsDrawer.evacuation.DATE_DEMANDE).format('DD/MM/YYYY HH:mm') : 
                            'Non spécifiée'}
                        </div>
                        {detailsDrawer.evacuation.DATE_DEPART && (
                          <div>
                            <Text strong>Départ: </Text>
                            {moment(detailsDrawer.evacuation.DATE_DEPART).format('DD/MM/YYYY HH:mm')}
                          </div>
                        )}
                        {detailsDrawer.evacuation.DATE_ARRIVEE && (
                          <div>
                            <Text strong>Arrivée: </Text>
                            {moment(detailsDrawer.evacuation.DATE_ARRIVEE).format('DD/MM/YYYY HH:mm')}
                          </div>
                        )}
                      </Space>
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Accompagnants">
                      {detailsDrawer.evacuation.ACCOMPAGNANTS || 'Aucun'}
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Observations">
                      {detailsDrawer.evacuation.OBSERVATIONS || 'Aucune'}
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Recommandations">
                      {detailsDrawer.evacuation.RECOMMANDATIONS || 'Aucune'}
                    </Descriptions.Item>
                  </Descriptions>
                </TabPane>
                
                <TabPane tab="Financier" key="financier">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic
                          title="Coût estimé"
                          value={detailsDrawer.evacuation.COUT_ESTIME || 0}
                          prefix={<DollarOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                          formatter={(value) => formatCurrency(value)}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic
                          title="Coût réel"
                          value={detailsDrawer.evacuation.COUT_REEL || 0}
                          prefix={<DollarOutlined />}
                          valueStyle={{ color: '#52c41a' }}
                          formatter={(value) => formatCurrency(value)}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic
                          title="Prise en charge"
                          value={detailsDrawer.evacuation.PRISE_EN_CHARGE || 0}
                          suffix="%"
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic
                          title="Reste à charge patient"
                          value={detailsDrawer.evacuation.MONTANT_PATIENT || 0}
                          prefix={<DollarOutlined />}
                          valueStyle={{ color: '#fa8c16' }}
                          formatter={(value) => formatCurrency(value)}
                        />
                      </Card>
                    </Col>
                  </Row>
                </TabPane>
                
                {/* <TabPane 
                  tab={
                    <span>
                      <FileTextOutlined />
                      Documents ({detailsDrawer.statistiques.total_documents || 0})
                    </span>
                  } 
                  key="documents"
                >
                  <div style={{ marginBottom: '16px' }}>
                    <Button
                      type="primary"
                      icon={<UploadOutlined />}
                      onClick={() => setUploadModal({ visible: true, loading: false, fileList: [] })}
                    >
                      Ajouter des documents
                    </Button>
                  </div>
                  
                  {detailsDrawer.documents.length > 0 ? (
                    <List
                      dataSource={detailsDrawer.documents}
                      renderItem={(doc) => (
                        <List.Item
                          actions={[
                            <Tooltip title="Télécharger">
                              <Button 
                                icon={<DownloadIcon />} 
                                size="small"
                                onClick={() => window.open(doc.url, '_blank')}
                              />
                            </Tooltip>,
                            <Tooltip title="Supprimer">
                              <Button 
                                icon={<DeleteIcon />} 
                                size="small"
                                danger
                                onClick={() => handleDeleteDocument(doc.id)}
                              />
                            </Tooltip>
                          ]}
                        >
                          <List.Item.Meta
                            avatar={getFileIcon(doc.nom_fichier)}
                            title={doc.nom_fichier}
                            description={
                              <Space direction="vertical" size={0}>
                                <Text type="secondary">
                                  Type: {doc.type_document}
                                </Text>
                                <Text type="secondary">
                                  Taille: {(doc.taille / 1024).toFixed(2)} KB
                                </Text>
                                <Text type="secondary">
                                  Date: {moment(doc.date_upload).format('DD/MM/YYYY HH:mm')}
                                </Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Typography.Text type="secondary">
                        Aucun document uploadé
                      </Typography.Text>
                    </div>
                  )}
                </TabPane> */}
                
                <TabPane 
                  tab={
                    <span>
                      <DollarOutlined />
                      Frais supplémentaires ({detailsDrawer.statistiques.frais_count || 0})
                    </span>
                  } 
                  key="frais"
                >
                  <div style={{ marginBottom: '16px' }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        fraisForm.resetFields();
                        fraisForm.setFieldsValue({
                          date_frais: moment(),
                          statut: 'en_attente'
                        });
                        setFraisModal({ 
                          visible: true, 
                          mode: 'create', 
                          loading: false,
                          currentFrais: null 
                        });
                      }}
                    >
                      Ajouter un frais
                    </Button>
                  </div>
                  
                  {detailsDrawer.frais.length > 0 ? (
                    <>
                      <List
                        dataSource={detailsDrawer.frais}
                        renderItem={(frais) => (
                          <List.Item
                            actions={[
                              <Tooltip title="Modifier">
                                <Button 
                                  icon={<EditOutlined />} 
                                  size="small"
                                  onClick={() => {
                                    fraisForm.setFieldsValue({
                                      type_frais: frais.type_frais,
                                      description: frais.description,
                                      montant: frais.montant,
                                      date_frais: frais.date_frais ? moment(frais.date_frais) : null,
                                      statut: frais.statut,
                                      notes: frais.notes
                                    });
                                    setFraisModal({ 
                                      visible: true, 
                                      mode: 'edit', 
                                      loading: false,
                                      currentFrais: frais 
                                    });
                                  }}
                                />
                              </Tooltip>,
                              <Tooltip title="Supprimer">
                                <Button 
                                  icon={<DeleteIcon />} 
                                  size="small"
                                  danger
                                  onClick={() => handleDeleteFrais(frais.id)}
                                />
                              </Tooltip>
                            ]}
                          >
                            <List.Item.Meta
                              avatar={
                                <Avatar
                                  style={{
                                    backgroundColor: 
                                      frais.type_frais === 'transport' ? '#1890ff' :
                                      frais.type_frais === 'hospitalisation' ? '#52c41a' :
                                      frais.type_frais === 'medicaments' ? '#722ed1' :
                                      '#fa8c16'
                                  }}
                                  icon={
                                    typeFraisOptions.find(t => t.value === frais.type_frais)?.icon || <DollarOutlined />
                                  }
                                />
                              }
                              title={
                                <Space>
                                  <Text strong>
                                    {typeFraisOptions.find(t => t.value === frais.type_frais)?.label || frais.type_frais}
                                  </Text>
                                  <Tag color={frais.statut === 'paye' ? 'success' : 'warning'}>
                                    {frais.statut === 'paye' ? 'Payé' : 'En attente'}
                                  </Tag>
                                </Space>
                              }
                              description={
                                <Space direction="vertical" size={0}>
                                  <Text>{frais.description}</Text>
                                  <Space>
                                    <Text strong>{formatCurrency(frais.montant)}</Text>
                                    <Text type="secondary">
                                      Date: {moment(frais.date_frais).format('DD/MM/YYYY')}
                                    </Text>
                                  </Space>
                                  {frais.notes && (
                                    <Text type="secondary" italic>
                                      Notes: {frais.notes}
                                    </Text>
                                  )}
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                      <Divider />
                      <div style={{ textAlign: 'right', padding: '16px', backgroundColor: '#fafafa' }}>
                        <Text strong style={{ fontSize: '16px' }}>
                          Total des frais supplémentaires: {formatCurrency(detailsDrawer.statistiques.total_frais)}
                        </Text>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Typography.Text type="secondary">
                        Aucun frais supplémentaire enregistré
                      </Typography.Text>
                    </div>
                  )}
                </TabPane>
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

      {/* Modal Changer Statut */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SyncOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            <span>Changer le statut de l'évacuation</span>
          </div>
        }
        open={statusModal.visible}
        onCancel={() => {
          setStatusModal({ visible: false, evacuationId: null, loading: false });
          statusForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setStatusModal({ visible: false, evacuationId: null, loading: false });
            statusForm.resetFields();
          }}>
            Annuler
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={statusModal.loading}
            onClick={() => statusForm.submit()}
          >
            Mettre à jour
          </Button>
        ]}
        destroyOnClose
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={handleUpdateStatus}
        >
          <Form.Item
            name="statut"
            label="Nouveau statut"
            rules={[{ required: true, message: 'Veuillez sélectionner un statut' }]}
          >
            <Select placeholder="Sélectionnez un statut">
              {statutOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color} icon={option.icon}>
                    {option.label}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="notes_decision"
            label="Notes/Justification"
          >
            <TextArea rows={3} placeholder="Justification du changement de statut..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Upload Documents */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UploadOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            <span>Uploader des documents</span>
          </div>
        }
        open={uploadModal.visible}
        onCancel={() => setUploadModal({ visible: false, loading: false, fileList: [] })}
        footer={[
          <Button key="cancel" onClick={() => setUploadModal({ visible: false, loading: false, fileList: [] })}>
            Annuler
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={uploadModal.loading}
            onClick={handleUploadDocuments}
            disabled={uploadModal.fileList.length === 0}
          >
            Uploader ({uploadModal.fileList.length})
          </Button>
        ]}
      >
        <Upload.Dragger
          multiple
          fileList={uploadModal.fileList}
          onChange={({ fileList }) => setUploadModal(prev => ({ ...prev, fileList }))}
          beforeUpload={() => false}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">
            Cliquez ou glissez-déposez des fichiers ici
          </p>
          <p className="ant-upload-hint">
            Supports: PDF, Word, Excel, Images, TXT
          </p>
        </Upload.Dragger>
        
        {uploadModal.fileList.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <Text strong>Fichiers sélectionnés:</Text>
            <ul style={{ marginTop: '8px' }}>
              {uploadModal.fileList.map((file, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {/* Modal Ajouter/Modifier Frais */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <DollarOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
            <span>{fraisModal.mode === 'create' ? 'Ajouter un frais' : 'Modifier le frais'}</span>
          </div>
        }
        open={fraisModal.visible}
        onCancel={() => {
          setFraisModal({ visible: false, loading: false, mode: 'create', currentFrais: null });
          fraisForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setFraisModal({ visible: false, loading: false, mode: 'create', currentFrais: null });
            fraisForm.resetFields();
          }}>
            Annuler
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={fraisModal.loading}
            onClick={() => fraisForm.submit()}
          >
            {fraisModal.mode === 'create' ? 'Ajouter' : 'Modifier'}
          </Button>
        ]}
      >
        <Form
          form={fraisForm}
          layout="vertical"
          onFinish={handleAddFrais}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type_frais"
                label="Type de frais"
                rules={[{ required: true, message: 'Veuillez sélectionner un type' }]}
              >
                <Select placeholder="Sélectionnez un type">
                  {typeFraisOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Space>
                        {option.icon}
                        {option.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="montant"
                label="Montant (FCFA)"
                rules={[{ required: true, message: 'Veuillez saisir le montant' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                  parser={value => value.replace(/\s/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Veuillez saisir une description' }]}
          >
            <Input placeholder="Description du frais..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date_frais"
                label="Date du frais"
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="statut"
                label="Statut"
              >
                <Select>
                  <Option value="en_attente">En attente</Option>
                  <Option value="paye">Payé</Option>
                  <Option value="annule">Annulé</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={2} placeholder="Notes supplémentaires..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Impression */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PrinterOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
            <span>Impression de la fiche d'évacuation</span>
          </div>
        }
        open={printModal.visible}
        onCancel={() => setPrintModal({ visible: false, loading: false })}
        width={1000}
        footer={[
          <Button key="cancel" onClick={() => setPrintModal({ visible: false, loading: false })}>
            Fermer
          </Button>,
          <ReactToPrint
            key="print"
            trigger={() => (
              <Button type="primary" icon={<PrinterOutlined />}>
                Imprimer
              </Button>
            )}
            content={() => printRef.current}
            onBeforeGetContent={() => {
              setPrintModal(prev => ({ ...prev, loading: true }));
              return Promise.resolve();
            }}
            onAfterPrint={() => setPrintModal(prev => ({ ...prev, loading: false }))}
          />
        ]}
      >
        {printModal.loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '20px' }}>Préparation de l'impression...</div>
          </div>
        ) : (
          <FicheEvacuationPrint 
            ref={printRef}
            evacuation={detailsDrawer.evacuation}
            centreInfo={{
              nom: "Centre Médical Principal",
              logo: "/logo-centre.png",
              adresse: "123 Rue de la Santé, Dakar, Sénégal",
              telephone: "+221 33 123 45 67",
              email: "contact@centresante.sn"
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default EvacuationsPage;