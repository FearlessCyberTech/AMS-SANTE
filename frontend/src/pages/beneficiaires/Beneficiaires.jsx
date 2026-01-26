import React, { useState, useEffect, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  Table, Card, Row, Col, Statistic, Button, Modal, Form,
  Select, Input, DatePicker, Tag, Space, message, Tabs,
  Descriptions, Tooltip, Popconfirm, Spin, Upload,
  Alert, Divider, Badge, Typography, Empty, Avatar,
  InputNumber, Switch, Radio, Steps, Result, Progress,
  Popover, Drawer, List, Collapse, Timeline, Statistic as AntdStatistic
} from 'antd';
import {
  UserOutlined, TeamOutlined, IdcardOutlined, FileTextOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  SearchOutlined, SyncOutlined, DownloadOutlined, UploadOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined,
  PhoneOutlined, MailOutlined, EnvironmentOutlined, BankOutlined,
  MedicineBoxOutlined, SafetyCertificateOutlined, CreditCardOutlined,
  CameraOutlined, PrinterOutlined, QrcodeOutlined, FilterOutlined,
  ReloadOutlined, SaveOutlined, CloseOutlined, InfoCircleOutlined,
  ManOutlined, WomanOutlined, HomeOutlined, CarOutlined,
  HeartOutlined, FileAddOutlined, TabletOutlined, StarOutlined,
  SettingOutlined, AppstoreOutlined, DatabaseOutlined,
  BarChartOutlined, PieChartOutlined, LineChartOutlined,
  ArrowUpOutlined, ArrowDownOutlined, DashboardOutlined,
  UserAddOutlined, UserSwitchOutlined, UserDeleteOutlined,
  CalendarOutlined, FlagOutlined, GlobalOutlined, ShopOutlined,
  ClusterOutlined, ApartmentOutlined, ContactsOutlined,
  CrownOutlined, DollarOutlined, InsuranceOutlined,
  LockOutlined, MessageOutlined, NotificationOutlined,
  TrophyOutlined, WalletOutlined, ExperimentOutlined,
  SmileOutlined, SolutionOutlined, ToolOutlined,
  UsergroupAddOutlined, WifiOutlined, CloudUploadOutlined,
  FileExcelOutlined, FilePdfOutlined, BarcodeOutlined,
  HeartFilled, PhoneFilled, MailFilled, HomeFilled
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/fr';
import { 
  beneficiairesAPI, famillesACEAPI,
  paysAPI, policesAPI, syncAPI,
  centresAPI
} from '../../services/api';
import AMSlogo from "../../assets/AMS-logo.png";
import FrontbackgroundCard from "../../assets/FrontbackgroundCard.png";
import backgroundCard from "../../assets/backBackground.jpeg";
import jsPDF from 'jspdf';
const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;
const { TabPane } = Tabs;
const { Step } = Steps;
const { Panel } = Collapse;

const Beneficiaires = () => {
  // ÉTATS PRINCIPAUX
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [loading, setLoading] = useState({
    main: false,
    table: false,
    form: false,
    polices: false,
    cartes: false,
    centres: false,
    export: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [cardSide, setCardSide] = useState('front');
  
  // États pour les différentes modales
  const [policesModal, setPolicesModal] = useState(false);
  const [selectedBeneficiaireForPolices, setSelectedBeneficiaireForPolices] = useState(null);
  const [polices, setPolices] = useState([]);
  const [showPoliceForm, setShowPoliceForm] = useState(false);
  const [editingPolice, setEditingPolice] = useState(null);
  
  const [cartesModal, setCartesModal] = useState(false);
  const [selectedBeneficiaireForCartes, setSelectedBeneficiaireForCartes] = useState(null);
  const [cartes, setCartes] = useState([]);
  const [showCarteForm, setShowCarteForm] = useState(false);
  const [editingCarte, setEditingCarte] = useState(null);
  
  const [centresModal, setCentresModal] = useState(false);
  const [selectedBeneficiaireForCentres, setSelectedBeneficiaireForCentres] = useState(null);
  const [centres, setCentres] = useState([]);
  const [allCentres, setAllCentres] = useState([]);
  const [showCentreForm, setShowCentreForm] = useState(false);
  const [editingCentre, setEditingCentre] = useState(null);
  
  const [carteModal, setCarteModal] = useState(false);
  const [selectedBeneficiaireForCard, setSelectedBeneficiaireForCard] = useState(null);
  
  const [exportModal, setExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Formulaires
  const [form] = Form.useForm();
  const [policeForm] = Form.useForm();
  const [carteForm] = Form.useForm();
  const [centreForm] = Form.useForm();
  
  // Filtres
  const [filtres, setFiltres] = useState({
    statut_ace: 'tous',
    sexe: 'tous',
    cod_pay: 'tous',
    date_debut: null,
    date_fin: null,
    employeur: '',
    age_min: '',
    age_max: ''
  });
  
  // Données de référence
  const [paysList, setPaysList] = useState([]);
  const [assuresPrincipaux, setAssuresPrincipaux] = useState([]);
  
  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    assuresPrincipaux: 0,
    ayantsDroit: 0,
    avecAssurancePrivee: 0,
    actifs: 0,
    inactifs: 0
  });

   const cardRef = useRef(null);
  // ==================== FONCTIONS UTILITAIRES ====================
const generateQRCode = async (text, size = 200) => {
  try {
    // Utilisation d'une API externe pour générer le QR Code
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
    return qrCodeUrl;
  } catch (error) {
    console.error('Erreur génération QR Code:', error);
    return null;
  }
};

const getBeneficiaryQRCodeData = (beneficiaire) => {
  // Données à encoder dans le QR code
  const data = {
    id: beneficiaire.ID_BEN || beneficiaire.id,
    matricule: beneficiaire.IDENTIFIANT_NATIONAL || '',
    identifiant_national: beneficiaire.IDENTIFIANT_NATIONAL || '',
    nom: beneficiaire.NOM_BEN || '',
    prenom: beneficiaire.PRE_BEN || '',
    date_naissance: beneficiaire.NAI_BEN || '',
    sexe: beneficiaire.SEX_BEN || '',
    employeur: beneficiaire.EMPLOYEUR || '',
    telephone: beneficiaire.TELEPHONE_MOBILE || '',
    type: beneficiaire.STATUT_ACE ? 'Ayant droit' : 'Assuré principal',
    statut_ace: beneficiaire.STATUT_ACE || '',
    timestamp: new Date().toISOString()
  };
  
  return JSON.stringify(data);
};

const loadQRCode = async (beneficiaire) => {
  if (!beneficiaire) return null;
  
  try {
    const qrData = getBeneficiaryQRCodeData(beneficiaire);
    const qrCodeUrl = await generateQRCode(qrData, 200);
    return qrCodeUrl;
  } catch (error) {
    console.error('Erreur chargement QR code:', error);
    return null;
  }
};

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifié';
    return moment(dateString).format('DD/MM/YYYY');
  };

  const calculateAge = (dateString) => {
    if (!dateString) return 0;
    return moment().diff(moment(dateString), 'years');
  };

  const genererIdentifiantNational = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `AMS${timestamp}${random}`;
  };

  const generateCarteNumber = (beneficiaire, carteType = 'PRM') => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const beneficiaireId = beneficiaire.ID_BEN || beneficiaire.id || 0;
    const sequential = beneficiaireId.toString().padStart(5, '0');
    
    return `CMR-${carteType}-${year}${month}-${sequential}`;
  };

const getPhotoUrl = (photoFileName) => {
  // Vérifier si c'est null, undefined ou vide
  if (!photoFileName || photoFileName === 'null' || photoFileName === 'undefined' || photoFileName === '') {
    return null;
  }
  
  // Vérifier le type - si ce n'est pas une chaîne, retourner null
  if (typeof photoFileName !== 'string') {
    console.warn('photoFileName n\'est pas une chaîne:', photoFileName);
    return null;
  }
  
  // Si c'est déjà une URL complète
  if (photoFileName.startsWith('http')) {
    return photoFileName;
  }
  
  const baseUrl = (window._env_ && window._env_.REACT_APP_API_URL) || 
                  window.REACT_APP_API_URL || 
                  'http://localhost:5000';
  
  // Extraire seulement le nom de fichier
  let fileName = photoFileName;
  
  // Supprimer les chemins
  if (fileName.includes('\\')) {
    fileName = fileName.split('\\').pop();
  }
  if (fileName.includes('/')) {
    fileName = fileName.split('/').pop();
  }
  
  // Nettoyer et encoder
  fileName = fileName.trim();
  
  // Vérifier si le nom de fichier est valide
  if (!fileName || fileName.length === 0) {
    return null;
  }
  
  try {
    const encodedFileName = encodeURIComponent(fileName);
    return `${baseUrl}/uploads/beneficiaires/${encodedFileName}`;
  } catch (error) {
    console.error('Erreur d\'encodage du nom de fichier:', error);
    return null;
  }
};

  // ==================== CHARGEMENT DES DONNÉES ====================

const loadReferenceData = useCallback(async () => {
  try {
    const [paysResponse, centresResponse] = await Promise.all([
      paysAPI.getAll(),
      centresAPI.getAll()
    ]);
    
    if (paysResponse.success) {
      setPaysList(paysResponse.pays || []);
    }
    
    console.log('Réponse centres API:', centresResponse); // Pour déboguer
    
    if (centresResponse.success) {
      // Essayez différentes structures de données
      const centresData = centresResponse.centres || centresResponse.data || centresResponse;
      
      // Formater les centres pour s'assurer qu'ils ont les bonnes propriétés
      const formattedCentres = Array.isArray(centresData) ? centresData.map(centre => ({
        ID_CENTRE: centre.ID_CENTRE || centre.id || centre.CODE_CENTRE,
        CODE_CENTRE: centre.CODE_CENTRE || centre.code_centre || centre.ID_CENTRE,
        NOM_CENTRE: centre.NOM_CENTRE || centre.nom_centre || centre.nom || '',
        TYPE_CENTRE: centre.TYPE_CENTRE || centre.type_centre || 'HOPITAL',
        ADRESSE: centre.ADRESSE || centre.adresse || '',
        TELEPHONE: centre.TELEPHONE || centre.telephone || '',
        EMAIL: centre.EMAIL || centre.email || '',
        SPECIALITES: centre.SPECIALITES || centre.specialites || [],
        CONVENTIONNE: centre.CONVENTIONNE !== undefined ? centre.CONVENTIONNE : true,
        STATUT_CENTRE: centre.STATUT_CENTRE || centre.statut_centre || 'ACTIF'
      })) : [];
      
      console.log('Centres formatés:', formattedCentres);
      setAllCentres(formattedCentres);
    } else {
      console.error('Erreur API centres:', centresResponse.message);
    }
  } catch (error) {
    console.error('Erreur chargement données de référence:', error);
    message.error('Erreur lors du chargement des données de référence');
  }
}, []);

  const loadBeneficiaires = useCallback(async () => {
    setLoading(prev => ({ ...prev, table: true }));
    try {
      const params = {
        search: searchTerm,
        ...(filtres.statut_ace !== 'tous' && { statut_ace: filtres.statut_ace }),
        ...(filtres.sexe !== 'tous' && { sexe: filtres.sexe }),
        ...(filtres.cod_pay !== 'tous' && { cod_pay: filtres.cod_pay }),
        ...(filtres.date_debut && { date_debut: filtres.date_debut.format('YYYY-MM-DD') }),
        ...(filtres.date_fin && { date_fin: filtres.date_fin.format('YYYY-MM-DD') }),
        ...(filtres.employeur && { employeur: filtres.employeur }),
        ...(filtres.age_min && { age_min: filtres.age_min }),
        ...(filtres.age_max && { age_max: filtres.age_max })
      };
      
      const response = await beneficiairesAPI.searchAdvanced(searchTerm, params, 100);
      
      if (response.success) {
        const beneficiairesList = Array.isArray(response.beneficiaires) 
          ? response.beneficiaires 
          : (response.data || []);
        
        const formattedBeneficiaires = beneficiairesList.map(ben => ({
          key: ben.ID_BEN || ben.id || `ben-${Date.now()}-${Math.random()}`,
          ID_BEN: ben.ID_BEN || ben.id,
          NOM_BEN: ben.NOM_BEN || ben.nom || '',
          PRE_BEN: ben.PRE_BEN || ben.prenom || '',
          FIL_BEN: ben.FIL_BEN || ben.nom_marital || '',
          SEX_BEN: ben.SEX_BEN || ben.sexe || 'M',
          NAI_BEN: ben.NAI_BEN || ben.date_naissance || '',
          IDENTIFIANT_NATIONAL: ben.IDENTIFIANT_NATIONAL || ben.identifiant_national || '',
          TELEPHONE_MOBILE: ben.TELEPHONE_MOBILE || ben.telephone_mobile || ben.telephone || '',
          EMAIL: ben.EMAIL || ben.email || '',
          PROFESSION: ben.PROFESSION || ben.profession || '',
          EMPLOYEUR: ben.EMPLOYEUR || ben.employeur || 'Non spécifié',
          STATUT_ACE: ben.STATUT_ACE || ben.statut_ace || '',
          ID_ASSURE_PRINCIPAL: ben.ID_ASSURE_PRINCIPAL || ben.id_assure_principal || null,
          ID_CENTRE_SANTE: ben.ID_CENTRE_SANTE || ben.id_centre_sante || null,
          PHOTO: ben.PHOTO || ben.PHOTO_URL,
          AGE: calculateAge(ben.NAI_BEN || ben.date_naissance),
          COD_PAY: ben.COD_PAY || 'CMR',
          ASSURANCE_PRIVE: ben.ASSURANCE_PRIVE || false,
          STATUT: ben.STATUT || 'ACTIF'
        }));
        
        setBeneficiaires(formattedBeneficiaires);
        
        // Mettre à jour les statistiques
        const total = formattedBeneficiaires.length;
        const assuresPrincipaux = formattedBeneficiaires.filter(b => !b.STATUT_ACE || b.STATUT_ACE === '').length;
        const ayantsDroit = formattedBeneficiaires.filter(b => b.STATUT_ACE && b.STATUT_ACE !== '').length;
        const avecAssurancePrivee = formattedBeneficiaires.filter(b => b.ASSURANCE_PRIVE).length;
        const actifs = formattedBeneficiaires.filter(b => b.STATUT === 'ACTIF').length;
        const inactifs = total - actifs;
        
        setStats({ total, assuresPrincipaux, ayantsDroit, avecAssurancePrivee, actifs, inactifs });
        
        // Mettre à jour la liste des assurés principaux
        const assures = formattedBeneficiaires
          .filter(ben => !ben.STATUT_ACE || ben.STATUT_ACE === '' || ben.STATUT_ACE === null)
          .map(assure => ({
            id: assure.ID_BEN,
            nom: assure.NOM_BEN,
            prenom: assure.PRE_BEN,
            nom_marital: assure.FIL_BEN,
            sexe: assure.SEX_BEN,
            telephone: assure.TELEPHONE_MOBILE,
            identifiant_national: assure.IDENTIFIANT_NATIONAL,
            age: assure.AGE,
            employeur: assure.EMPLOYEUR,
            photo: assure.PHOTO
          }));
        
        setAssuresPrincipaux(assures);
        
        message.success(`${formattedBeneficiaires.length} bénéficiaire(s) chargé(s)`);
      } else {
        message.error(response.message || 'Erreur lors du chargement');
        setBeneficiaires([]);
      }
    } catch (error) {
      console.error('Erreur chargement bénéficiaires:', error);
      message.error('Erreur de connexion avec le serveur');
      setBeneficiaires([]);
    } finally {
      setLoading(prev => ({ ...prev, table: false }));
    }
  }, [searchTerm, filtres]);

  const loadPolices = async (beneficiaireId) => {
    setLoading(prev => ({ ...prev, polices: true }));
    try {
      const response = await policesAPI.getByBeneficiaire(beneficiaireId);
      
      if (response.success) {
        setPolices(response.polices || []);
      } else {
        message.error(response.message || 'Erreur chargement polices');
        setPolices([]);
      }
    } catch (error) {
      console.error('Erreur chargement polices:', error);
      message.error('Erreur chargement polices');
      setPolices([]);
    } finally {
      setLoading(prev => ({ ...prev, polices: false }));
    }
  };

  const loadCartes = async (beneficiaireId) => {
    setLoading(prev => ({ ...prev, cartes: true }));
    try {
      const response = await beneficiairesAPI.getCartes(beneficiaireId);
      
      if (response.success) {
        setCartes(response.cartes || []);
      } else {
        message.error(response.message || 'Erreur lors du chargement des cartes');
        setCartes([]);
      }
    } catch (error) {
      console.error('Erreur chargement cartes:', error);
      message.error('Erreur lors du chargement des cartes');
      setCartes([]);
    } finally {
      setLoading(prev => ({ ...prev, cartes: false }));
    }
  };

  const handlePrintCard = () => {
    if (!selectedBeneficiaireForCard) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('Impossible d\'ouvrir la fenêtre d\'impression');
      return;
    }

    const cardHtml = `
      <html>
        <head>
          <title>Carte Bénéficiaire - ${selectedBeneficiaireForCard.NOM_BEN} ${selectedBeneficiaireForCard.PRE_BEN}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .card-container { 
                width: 100%; 
                height: 100%; 
                position: relative;
              }
            }
          </style>
        </head>
        <body>
          <div id="card-to-print"></div>
          <script>
            // Cloner le contenu de la carte
            const cardElement = document.getElementById('card-content');
            if (cardElement) {
              const clonedCard = cardElement.cloneNode(true);
              // Nettoyer les styles d'impression
              clonedCard.style.position = 'relative';
              clonedCard.style.margin = 'auto';
              clonedCard.style.boxShadow = 'none';
              document.getElementById('card-to-print').appendChild(clonedCard);
              
              // Déclencher l'impression après chargement
              setTimeout(() => {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(cardHtml);
    printWindow.document.close();
  };

 const handleDownloadCard = async () => {
  if (!selectedBeneficiaireForCard) return;
  
  try {
    const ben = selectedBeneficiaireForCard;
    
    // Obtenir l'URL de la photo
    const photoUrl = getPhotoUrl(ben.PHOTO);
    
    // Générer le QR code avec le matricule
    const qrData = getBeneficiaryQRCodeData(ben);
    const qrCodeUrl = await generateQRCode(qrData, 300);
    
    // Création du conteneur temporaire pour le recto
    const tempContainerRecto = document.createElement('div');
    tempContainerRecto.style.position = 'absolute';
    tempContainerRecto.style.left = '-9999px';
    tempContainerRecto.style.top = '-9999px';
    tempContainerRecto.style.width = '1480px';
    tempContainerRecto.style.height = '1050px';
    tempContainerRecto.style.fontFamily = 'Arial, sans-serif';
    document.body.appendChild(tempContainerRecto);
    
    // HTML du recto avec PHOTO et QR code
    const rectoHTML = `
      <div style="width: 1480px; height: 1050px; background: url(${FrontbackgroundCard}) no-repeat center center; background-size: cover; border-radius: 80px; position: relative; overflow: hidden; box-shadow: 0 40px 120px rgba(0, 0, 0, 0.2);">
        <div style="position: relative; height: 100%; padding: 80px; color: white; display: flex; flex-direction: column;">
        
          
          <!-- Section principale avec photo et informations -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; margin-top: 100px;">
            <!-- Photo et informations personnelles -->
            <div style="display: flex; align-items: center; gap: 60px; margin-bottom: 80px;">
              <!-- Photo du bénéficiaire -->
              <div style="width: 480px; height: 480px; border-radius: 20px; overflow: hidden; border: 5px solid white; box-shadow: 0 10px 30px rgba(0,0,0,0.2); background: #f5f5f5; display: flex; align-items: center; justify-content: center;margin-top:20%;">
                ${photoUrl ? `
                  <img 
                    src="${photoUrl}" 
                    style="width: 100%; height: 100%; object-fit: cover;" 
                    alt="Photo ${ben.NOM_BEN} ${ben.PRE_BEN}" 
                    onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\"font-size: 80px; color: #ccc;\">${ben.SEX_BEN === 'F' ? '♀' : '♂'}</div>';"
                  />
                ` : `
                  <div style="font-size: 100px; color: #ccc;">
                    ${ben.SEX_BEN === 'F' ? '♀' : '♂'}
                  </div>
                `}
              </div>
              
              <!-- Informations personnelles -->
              <div style="flex: 1;">
                <div style="font-size: 40px; font-weight: 900;color:#03104f; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; text-shadow: 3px 3px 6px rgba(0,0,0,0.4);position:absolute;left:70%;top:75%">
                  <strong>${ben.NOM_BEN || ''}</strong>
                </div>
                <div style="font-size: 34px; font-weight: 900;color:#03104f; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; text-shadow: 3px 3px 6px rgba(0,0,0,0.4);position:absolute;left:70%;top:81%">
                  <strong>${ben.PRE_BEN || ''}</strong>
                </div> 
              </div>
            </div>
            
            <!-- QR Code avec matricule -->
            <div style="text-align: center; position: absolute;left:35%;top:75%;">
              <div style="display: inline-block;width:70px; background: transparent;padding: 10px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                ${qrCodeUrl ? `
                  <img 
                    src="${qrCodeUrl}" 
                    style="width: 220px; height: 220px;" 
                    alt="QR Code Matricule: ${ben.IDENTIFIANT_NATIONAL}"
                    onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\"width: 320px; height: 320px; display: flex; align-items: center; justify-content: center; background: #f0f0f0; border-radius: 10px; font-size: 24px; color: #333;\">QR Code<br>Matricule: ${ben.IDENTIFIANT_NATIONAL}</div>';"
                  />
                ` : `
                  <div style="width: 320px; height: 320px; display: flex; align-items: center; justify-content: center; background: #f0f0f0; border-radius: 10px; font-size: 24px; color: #333; font-weight: bold;">
                    QR Code<br>
                    Matricule: ${ben.IDENTIFIANT_NATIONAL || `AMS${String(ben.ID_BEN || '000000').padStart(6, '0')}`}
                  </div>
                `}
                <div style="margin-top: 15px; color: #333; font-size: 24px; font-weight: bold; letter-spacing: 1px;">
                  ${ben.IDENTIFIANT_NATIONAL || `AMS${String(ben.ID_BEN || '000000').padStart(6, '0')}`}
                </div>
                <div style="margin-top: 10px; color: #666; font-size: 18px; font-weight: 500;">
                  Scan pour vérifier l'authenticité
                </div>
              </div>
            </div>
          </div>
          
          <!-- Date d'expiration -->
          <div style="position: absolute; bottom: 50px; right: 80px; font-size: 24px; color: rgba(255,255,255,0.8); font-weight: 600; text-align: right;">
            <div>Date d'expiration:</div>
            <div style="font-size: 28px; color: white; font-weight: 800;">
              ${new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    `;
    
    tempContainerRecto.innerHTML = rectoHTML;
    
    // Attendre que l'image soit chargée
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Capturer le recto
    const rectoCanvas = await html2canvas(tempContainerRecto, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
      allowTaint: true,
      imageTimeout: 15000
    });
    
    document.body.removeChild(tempContainerRecto);
    
    // Création du conteneur temporaire pour le verso
    const tempContainerVerso = document.createElement('div');
    tempContainerVerso.style.position = 'absolute';
    tempContainerVerso.style.left = '-9999px';
    tempContainerVerso.style.top = '-9999px';
    tempContainerVerso.style.width = '1480px';
    tempContainerVerso.style.height = '1050px';
    tempContainerVerso.style.fontFamily = 'Arial, sans-serif';
    document.body.appendChild(tempContainerVerso);
    
    // HTML du verso
    const versoHTML = `
      <div style="width: 1480px; height: 1050px; background: url(${backgroundCard}) no-repeat center center; background-size: cover; border-radius: 80px; padding: 80px; color: #333; display: flex; flex-direction: column; border: 10px solid #ccc; box-shadow: 0 40px 120px rgba(0, 0, 0, 0.1);">
        <div style="height: 100%; display: flex; flex-direction: column; justify-content: center;">
          <!-- Logo au centre -->
      
          
          <!-- Adresse et contacts -->
          <div style="font-size: 30px; line-height: 1.5; text-align: center; margin-bottom: 50px;margin-top:25%; color: #333; font-weight: 500;">
            <div style="margin-bottom: 15px;">Bonapriso, Rue VASNITEX, Immeuble ATLANTIS</div>
            <div style="margin-bottom: 15px;">Avenue Winton Churchill, Immeuble mitoyen à l'OAPI (Yaoundé)</div>
            <div style="margin-bottom: 15px;">BP 4962 Douala – Cameroun</div>
            <div style="margin-bottom: 25px;">
              <strong>Tel :</strong> 2 33 42 08 74 / 6 99 90 60 88 / 690096197
            </div>
          </div>
          
          <!-- Support technique -->
          <div style="font-size: 32px; font-weight: 700; color: #1a2980; text-align: center; margin-top: 20px; margin-bottom: 60px; text-transform: uppercase; background: rgba(26, 41, 128, 0.1); padding: 25px; border-radius: 15px;">
            Support Technique: +237 690 09 61 97 / +237 674 29 01 49
          </div>
          
          <!-- Notice -->
          <div style="font-size: 26px; line-height: 1.4; text-align: center; margin-top: auto; color: #333; padding: 40px; border-top: 5px solid red; background: rgba(255, 0, 0, 0.05); border-radius: 10px;">
            <strong>⚠️ IMPORTANT :</strong> Cette carte est strictement personnelle et est la propriété exclusive d'AMS INSURANCE.<br/>
            En cas de perte ou vol, contactez immédiatement le support technique.
          </div>
        </div>
      </div>
    `;
    
    tempContainerVerso.innerHTML = versoHTML;
    
    // Capturer le verso
    const versoCanvas = await html2canvas(tempContainerVerso, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
      allowTaint: true,
      imageTimeout: 15000
    });
    
    document.body.removeChild(tempContainerVerso);
    
    // Création du PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a6',
      compress: true
    });
    
    const pageWidth = 148;
    const pageHeight = 105;
    
    // Ajouter le recto
    const rectoDataUrl = rectoCanvas.toDataURL('image/jpeg', 0.9);
    pdf.addImage(rectoDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, '', 'FAST');
    
    // Ajouter le verso
    pdf.addPage();
    const versoDataUrl = versoCanvas.toDataURL('image/jpeg', 0.9);
    pdf.addImage(versoDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, '', 'FAST');
    
    // Propriétés du PDF
    pdf.setProperties({
      title: `Carte Bénéficiaire - ${ben.NOM_BEN} ${ben.PRE_BEN}`,
      subject: 'Carte d\'identification bénéficiaire AMS Insurance',
      author: 'AMS Insurance',
      keywords: `carte, bénéficiaire, assurance, santé, AMS, QR code, matricule: ${ben.IDENTIFIANT_NATIONAL}`,
      creator: 'AMS System'
    });
    
    // Télécharger le PDF
    const nomFichier = `Carte_${ben.NOM_BEN}_${ben.PRE_BEN}_${ben.IDENTIFIANT_NATIONAL || ben.ID_BEN}.pdf`;
    pdf.save(nomFichier);
    
    message.success('PDF téléchargé avec succès');
    
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    message.error('Erreur lors du téléchargement du PDF: ' + error.message);
  }
};


  const loadCentres = async (beneficiaireId) => {
    setLoading(prev => ({ ...prev, centres: true }));
    try {
      const response = await centresAPI.getByBeneficiaire(beneficiaireId);
      
      if (response.success) {
        setCentres(response.centres || []);
      } else {
        // Si aucun centre spécifique, charger tous les centres
        setCentres([]);
      }
    } catch (error) {
      console.error('Erreur chargement centres:', error);
      setCentres([]);
    } finally {
      setLoading(prev => ({ ...prev, centres: false }));
    }
  };

  // ==================== GESTION DES FORMULAIRES ====================

  const handleOpenForm = (beneficiaire = null) => {
    if (beneficiaire) {
      form.setFieldsValue({
        NOM_BEN: beneficiaire.NOM_BEN,
        PRE_BEN: beneficiaire.PRE_BEN,
        FIL_BEN: beneficiaire.FIL_BEN,
        SEX_BEN: beneficiaire.SEX_BEN,
        NAI_BEN: beneficiaire.NAI_BEN ? moment(beneficiaire.NAI_BEN) : null,
        IDENTIFIANT_NATIONAL: beneficiaire.IDENTIFIANT_NATIONAL,
        TELEPHONE_MOBILE: beneficiaire.TELEPHONE_MOBILE,
        EMAIL: beneficiaire.EMAIL,
        PROFESSION: beneficiaire.PROFESSION,
        EMPLOYEUR: beneficiaire.EMPLOYEUR,
        STATUT_ACE: beneficiaire.STATUT_ACE || '',
        ID_ASSURE_PRINCIPAL: beneficiaire.ID_ASSURE_PRINCIPAL,
        ID_CENTRE_SANTE: beneficiaire.ID_CENTRE_SANTE,
        COD_PAY: beneficiaire.COD_PAY || 'CMR',
        ASSURANCE_PRIVE: beneficiaire.ASSURANCE_PRIVE || false,
        STATUT: beneficiaire.STATUT || 'ACTIF'
      });
      setEditingId(beneficiaire.ID_BEN);
      if (beneficiaire.PHOTO) {
        setPhotoPreview(getPhotoUrl(beneficiaire.PHOTO));
      }
    } else {
      form.resetFields();
      form.setFieldsValue({
        SEX_BEN: 'M',
        COD_PAY: 'CMR',
        IDENTIFIANT_NATIONAL: genererIdentifiantNational(),
        STATUT: 'ACTIF',
        ASSURANCE_PRIVE: false
      });
      setEditingId(null);
      setPhotoPreview(null);
      setPhotoFile(null);
    }
    setShowForm(true);
  };

  const handlePhotoChange = (info) => {
    if (info.file.status === 'done') {
      setPhotoFile(info.file.originFileObj);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(info.file.originFileObj);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(prev => ({ ...prev, form: true }));
    
    try {
      const formData = new FormData();
      
      // Ajouter les données
      const beneficiaireData = {
        ...values,
        NAI_BEN: values.NAI_BEN ? values.NAI_BEN.format('YYYY-MM-DD') : null,
        IDENTIFIANT_NATIONAL: values.IDENTIFIANT_NATIONAL || genererIdentifiantNational(),
        ID_ASSURE_PRINCIPAL: values.STATUT_ACE ? values.ID_ASSURE_PRINCIPAL : null,
        ID_CENTRE_SANTE: values.ID_CENTRE_SANTE || null
      };
      
      formData.append('data', JSON.stringify(beneficiaireData));
      
      // Ajouter la photo si elle existe
      if (photoFile) {
        formData.append('photo', photoFile);
      }
      
      let response;
      if (editingId) {
        response = await beneficiairesAPI.update(editingId, formData);
      } else {
        response = await beneficiairesAPI.create(formData);
      }
      
      if (response.success) {
        message.success(editingId ? 'Bénéficiaire mis à jour' : 'Bénéficiaire créé');
        setShowForm(false);
        form.resetFields();
        setPhotoFile(null);
        setPhotoPreview(null);
        await loadBeneficiaires();
      } else {
        message.error(response.message || 'Erreur sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      message.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  const handleDelete = async (beneficiaire) => {
    Modal.confirm({
      title: `Mettre en retrait ${beneficiaire.NOM_BEN} ${beneficiaire.PRE_BEN} ?`,
      content: 'Cette action est réversible.',
      okText: 'Confirmer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          const response = await beneficiairesAPI.delete(beneficiaire.ID_BEN);
          
          if (response.success) {
            message.success('Bénéficiaire mis en retrait');
            loadBeneficiaires();
          } else {
            message.error(response.message || 'Erreur suppression');
          }
        } catch (error) {
          console.error('Erreur suppression:', error);
          message.error('Erreur lors de la suppression');
        }
      }
    });
  };

  const handleOpenPoliceForm = (police = null) => {
    if (police) {
      policeForm.setFieldsValue({
        NUM_POLICE: police.NUM_POLICE,
        TYPE_POLICE: police.TYPE_POLICE,
        DATE_EFFET: police.DATE_EFFET ? moment(police.DATE_EFFET) : null,
        DATE_ECHEANCE: police.DATE_ECHEANCE ? moment(police.DATE_ECHEANCE) : null,
        MONTANT_PRIME: police.MONTANT_PRIME,
        STATUT_POLICE: police.STATUT_POLICE || 'ACTIVE',
        GARANTIES: police.GARANTIES || []
      });
      setEditingPolice(police);
    } else {
      policeForm.resetFields();
      policeForm.setFieldsValue({
        STATUT_POLICE: 'ACTIVE',
        DATE_EFFET: moment(),
        DATE_ECHEANCE: moment().add(1, 'year'),
        TYPE_POLICE: 'INDIVIDUELLE'
      });
      setEditingPolice(null);
    }
    setShowPoliceForm(true);
  };

  const handleSavePolice = async (values) => {
    if (!selectedBeneficiaireForPolices) return;
    
    setLoading(prev => ({ ...prev, polices: true }));
    
    try {
      const policeData = {
        ...values,
        DATE_EFFET: values.DATE_EFFET.format('YYYY-MM-DD'),
        DATE_ECHEANCE: values.DATE_ECHEANCE.format('YYYY-MM-DD'),
        ID_BEN: selectedBeneficiaireForPolices.ID_BEN,
        COD_CREUTIL: 'ADMIN',
        COD_MODUTIL: 'ADMIN'
      };
      
      let response;
      if (editingPolice) {
        response = await policesAPI.update(editingPolice.NUM_POLICE, policeData);
      } else {
        response = await policesAPI.create(policeData);
      }
      
      if (response.success) {
        message.success(editingPolice ? 'Police mise à jour' : 'Police créée');
        policeForm.resetFields();
        setShowPoliceForm(false);
        await loadPolices(selectedBeneficiaireForPolices.ID_BEN);
      } else {
        message.error(response.message || 'Erreur sauvegarde police');
      }
    } catch (error) {
      console.error('Erreur sauvegarde police:', error);
      message.error('Erreur sauvegarde police');
    } finally {
      setLoading(prev => ({ ...prev, polices: false }));
    }
  };

  const handleDeletePolice = async (police) => {
    Modal.confirm({
      title: `Supprimer la police ${police.NUM_POLICE} ?`,
      content: 'Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          const response = await policesAPI.delete(police.NUM_POLICE);
          
          if (response.success) {
            message.success('Police supprimée');
            await loadPolices(selectedBeneficiaireForPolices.ID_BEN);
          } else {
            message.error(response.message || 'Erreur suppression');
          }
        } catch (error) {
          console.error('Erreur suppression police:', error);
          message.error('Erreur lors de la suppression');
        }
      }
    });
  };

  const handleOpenCarteForm = (carte = null) => {
    if (carte) {
      carteForm.setFieldsValue({
        COD_CAR: carte.COD_CAR,
        NUM_CAR: carte.NUM_CAR,
        DDV_CAR: carte.DDV_CAR ? moment(carte.DDV_CAR) : null,
        DFV_CAR: carte.DFV_CAR ? moment(carte.DFV_CAR) : null,
        STS_CAR: carte.STS_CAR,
        NOM_BEN: carte.NOM_BEN,
        PRE_BEN: carte.PRE_BEN,
        NAI_BEN: carte.NAI_BEN ? moment(carte.NAI_BEN) : null,
        SEX_BEN: carte.SEX_BEN
      });
      setEditingCarte(carte);
    } else {
      carteForm.resetFields();
      const beneficiaire = selectedBeneficiaireForCartes;
      carteForm.setFieldsValue({
        COD_CAR: 'PRM',
        NUM_CAR: generateCarteNumber(beneficiaire, 'PRM'),
        DDV_CAR: moment(),
        DFV_CAR: moment().add(1, 'year'),
        STS_CAR: 1,
        NOM_BEN: beneficiaire.NOM_BEN,
        PRE_BEN: beneficiaire.PRE_BEN,
        NAI_BEN: beneficiaire.NAI_BEN ? moment(beneficiaire.NAI_BEN) : null,
        SEX_BEN: beneficiaire.SEX_BEN,
        COD_PAY: 'CMR'
      });
      setEditingCarte(null);
    }
    setShowCarteForm(true);
  };

  const handleSaveCarte = async (values) => {
    if (!selectedBeneficiaireForCartes) return;
    
    setLoading(prev => ({ ...prev, cartes: true }));
    
    try {
      const carteData = {
        ...values,
        DDV_CAR: values.DDV_CAR.format('YYYY-MM-DD'),
        DFV_CAR: values.DFV_CAR.format('YYYY-MM-DD'),
        NAI_BEN: values.NAI_BEN ? values.NAI_BEN.format('YYYY-MM-DD') : null,
        ID_BEN: selectedBeneficiaireForCartes.ID_BEN,
        COD_CREUTIL: 'ADMIN',
        COD_MODUTIL: 'ADMIN'
      };
      
      let response;
      if (editingCarte) {
        response = await beneficiairesAPI.updateCarte(editingCarte.NUM_CAR, carteData);
      } else {
        response = await beneficiairesAPI.createCarte(carteData);
      }
      
      if (response.success) {
        message.success(editingCarte ? 'Carte mise à jour' : 'Carte créée');
        carteForm.resetFields();
        setShowCarteForm(false);
        await loadCartes(selectedBeneficiaireForCartes.ID_BEN);
      } else {
        message.error(response.message || 'Erreur sauvegarde carte');
      }
    } catch (error) {
      console.error('Erreur sauvegarde carte:', error);
      message.error('Erreur sauvegarde carte');
    } finally {
      setLoading(prev => ({ ...prev, cartes: false }));
    }
  };

  const handleDeleteCarte = async (carte) => {
    Modal.confirm({
      title: `Supprimer la carte ${carte.NUM_CAR} ?`,
      content: 'Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          const response = await beneficiairesAPI.deleteCarte(carte.NUM_CAR);
          
          if (response.success) {
            message.success('Carte supprimée');
            await loadCartes(selectedBeneficiaireForCartes.ID_BEN);
          } else {
            message.error(response.message || 'Erreur suppression');
          }
        } catch (error) {
          console.error('Erreur suppression carte:', error);
          message.error('Erreur lors de la suppression');
        }
      }
    });
  };

  const handleOpenCentresModal = (beneficiaire) => {
    setSelectedBeneficiaireForCentres(beneficiaire);
    loadCentres(beneficiaire.ID_BEN);
    setCentresModal(true);
  };

  const handleOpenCentreForm = (centre = null) => {
    if (centre) {
      centreForm.setFieldsValue({
        CODE_CENTRE: centre.CODE_CENTRE,
        NOM_CENTRE: centre.NOM_CENTRE,
        TYPE_CENTRE: centre.TYPE_CENTRE,
        ADRESSE: centre.ADRESSE,
        TELEPHONE: centre.TELEPHONE,
        EMAIL: centre.EMAIL,
        SPECIALITES: centre.SPECIALITES || [],
        CONVENTIONNE: centre.CONVENTIONNE || true,
        STATUT_CENTRE: centre.STATUT_CENTRE || 'ACTIF'
      });
      setEditingCentre(centre);
    } else {
      centreForm.resetFields();
      centreForm.setFieldsValue({
        STATUT_CENTRE: 'ACTIF',
        CONVENTIONNE: true,
        SPECIALITES: []
      });
      setEditingCentre(null);
    }
    setShowCentreForm(true);
  };

  const handleSaveCentre = async (values) => {
    setLoading(prev => ({ ...prev, centres: true }));
    
    try {
      const centreData = {
        ...values,
        COD_CREUTIL: 'ADMIN',
        COD_MODUTIL: 'ADMIN'
      };
      
      let response;
      if (editingCentre) {
        response = await centresAPI.update(editingCentre.CODE_CENTRE, centreData);
      } else {
        response = await centresAPI.create(centreData);
      }
      
      if (response.success) {
        message.success(editingCentre ? 'Centre mis à jour' : 'Centre créé');
        centreForm.resetFields();
        setShowCentreForm(false);
        await loadReferenceData();
        if (selectedBeneficiaireForCentres) {
          await loadCentres(selectedBeneficiaireForCentres.ID_BEN);
        }
      } else {
        message.error(response.message || 'Erreur sauvegarde centre');
      }
    } catch (error) {
      console.error('Erreur sauvegarde centre:', error);
      message.error('Erreur sauvegarde centre');
    } finally {
      setLoading(prev => ({ ...prev, centres: false }));
    }
  };

  const handleDeleteCentre = async (centre) => {
    Modal.confirm({
      title: `Supprimer le centre ${centre.NOM_CENTRE} ?`,
      content: 'Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          const response = await centresAPI.delete(centre.CODE_CENTRE);
          
          if (response.success) {
            message.success('Centre supprimé');
            await loadReferenceData();
            if (selectedBeneficiaireForCentres) {
              await loadCentres(selectedBeneficiaireForCentres.ID_BEN);
            }
          } else {
            message.error(response.message || 'Erreur suppression');
          }
        } catch (error) {
          console.error('Erreur suppression centre:', error);
          message.error('Erreur lors de la suppression');
        }
      }
    });
  };

  const handleAssignCentre = async (centre) => {
    if (!selectedBeneficiaireForCentres) return;
    
    Modal.confirm({
      title: `Attribuer le centre ${centre.NOM_CENTRE} ?`,
      content: 'Ce centre sera associé au bénéficiaire.',
      onOk: async () => {
        try {
          const response = await beneficiairesAPI.update(selectedBeneficiaireForCentres.ID_BEN, {
            ID_CENTRE_SANTE: centre.ID_CENTRE || centre.id
          });
          
          if (response.success) {
            message.success('Centre attribué avec succès');
            await loadCentres(selectedBeneficiaireForCentres.ID_BEN);
            await loadBeneficiaires();
          } else {
            message.error('Erreur lors de l\'attribution');
          }
        } catch (error) {
          console.error('Erreur attribution centre:', error);
          message.error('Erreur lors de l\'attribution');
        }
      }
    });
  };

  const handleExportData = async () => {
    setLoading(prev => ({ ...prev, export: true }));
    try {
      const response = await beneficiairesAPI.export({
        format: exportFormat,
        filters: filtres,
        search: searchTerm
      });
      
      if (response.success && response.data) {
        // Créer un blob et télécharger le fichier
        const blob = new Blob([response.data], { type: response.contentType || 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.filename || `beneficiaires_${moment().format('YYYYMMDD_HHmmss')}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        message.success('Export réalisé avec succès');
        setExportModal(false);
      } else {
        message.error(response.message || 'Erreur lors de l\'export');
      }
    } catch (error) {
      console.error('Erreur export:', error);
      message.error('Erreur lors de l\'export');
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };

  const handleSyncData = async () => {
    setLoading(prev => ({ ...prev, main: true }));
    try {
      const response = await syncAPI.syncAceData();
      
      if (response.success) {
        message.success('Synchronisation réussie');
        await loadBeneficiaires();
      } else {
        message.error(response.message || 'Erreur synchronisation');
      }
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      message.error('Erreur de synchronisation');
    } finally {
      setLoading(prev => ({ ...prev, main: false }));
    }
  };

  // ==================== COLONNES DES TABLES ====================

  const beneficiaireColumns = [
      {
  title: 'Photo',
  dataIndex: 'PHOTO',
  key: 'PHOTO',
  width: 80,
  render: (photo, record) => {
    const photoUrl = getPhotoUrl(photo);
    
    const handleImageError = (event) => {
      console.error(`Erreur chargement photo pour ${record.NOM_BEN} ${record.PRE_BEN}:`, photoUrl);
      // Fallback à l'icône
      if (event && event.target) {
        event.target.style.display = 'none';
      }
    };
    
    return (
      <Tooltip title={`${record.NOM_BEN} ${record.PRE_BEN}`}>
        <Avatar
          src={photoUrl}
          icon={!photoUrl && (record.SEX_BEN === 'F' ? <WomanOutlined /> : <ManOutlined />)}
          size="large"
          style={{
            backgroundColor: record.SEX_BEN === 'F' ? '#f56a00' : '#1890ff',
            cursor: 'pointer'
          }}
          onError={(e) => {
            console.error(`Erreur chargement photo pour ${record.NOM_BEN} ${record.PRE_BEN}:`, photoUrl);
            // Ne pas manipuler le DOM directement, laisser Avatar gérer le fallback
          }}
        />
      </Tooltip>
    );
  },
},
    {
      title: 'Nom & Prénom',
      key: 'NOM_PRENOM',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.NOM_BEN} {record.PRE_BEN}</div>
          {record.FIL_BEN && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              <em>(née {record.FIL_BEN})</em>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Identifiant',
      dataIndex: 'IDENTIFIANT_NATIONAL',
      key: 'IDENTIFIANT_NATIONAL',
      width: 150,
      render: (text) => <Tag color="blue">{text || 'N/A'}</Tag>,
    },
    {
      title: 'Téléphone',
      dataIndex: 'TELEPHONE_MOBILE',
      key: 'TELEPHONE_MOBILE',
      width: 150,
      render: (text) => text || 'N/A',
    },
    {
      title: 'Employeur',
      dataIndex: 'EMPLOYEUR',
      key: 'EMPLOYEUR',
      width: 150,
    },
    {
      title: 'Âge',
      key: 'AGE',
      width: 80,
      render: (_, record) => (
        <Tag color={record.AGE < 18 ? 'green' : record.AGE > 60 ? 'red' : 'blue'}>
          {record.AGE} ans
        </Tag>
      ),
    },
    {
      title: 'Statut ACE',
      key: 'STATUT_ACE',
      width: 120,
      render: (_, record) => {
        if (record.STATUT_ACE) {
          return <Tag color="orange">{record.STATUT_ACE}</Tag>;
        }
        return <Tag color="green">Assuré Principal</Tag>;
      },
    },
    {
      title: 'Statut',
      dataIndex: 'STATUT',
      key: 'STATUT',
      width: 100,
      render: (statut) => (
        <Tag color={statut === 'ACTIF' ? 'success' : 'error'}>
          {statut || 'ACTIF'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Modifier">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenForm(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Voir les polices">
            <Button
              type="link"
              icon={<FileTextOutlined />}
              onClick={() => {
                setSelectedBeneficiaireForPolices(record);
                loadPolices(record.ID_BEN);
                setPolicesModal(true);
              }}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Voir les cartes">
            <Button
              type="link"
              icon={<IdcardOutlined />}
              onClick={() => {
                setSelectedBeneficiaireForCartes(record);
                loadCartes(record.ID_BEN);
                setCartesModal(true);
              }}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Centre de santé">
            <Button
              type="link"
              icon={<MedicineBoxOutlined />}
              onClick={() => handleOpenCentresModal(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Voir carte">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedBeneficiaireForCard(record);
                setCarteModal(true);
              }}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Mettre en retrait">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const policeColumns = [
    {
      title: 'Numéro',
      dataIndex: 'NUM_POLICE',
      key: 'NUM_POLICE',
      width: 150,
    },
    {
      title: 'Type',
      dataIndex: 'TYPE_POLICE',
      key: 'TYPE_POLICE',
      width: 120,
    },
    {
      title: 'Date effet',
      dataIndex: 'DATE_EFFET',
      key: 'DATE_EFFET',
      width: 120,
      render: (date) => formatDate(date),
    },
    {
      title: 'Date échéance',
      dataIndex: 'DATE_ECHEANCE',
      key: 'DATE_ECHEANCE',
      width: 120,
      render: (date) => formatDate(date),
    },
    {
      title: 'Prime',
      dataIndex: 'MONTANT_PRIME',
      key: 'MONTANT_PRIME',
      width: 100,
      render: (montant) => montant ? `${parseFloat(montant).toLocaleString()} FCFA` : '-',
    },
    {
      title: 'Statut',
      dataIndex: 'STATUT_POLICE',
      key: 'STATUT_POLICE',
      width: 100,
      render: (statut) => (
        <Tag color={
          statut === 'ACTIVE' ? 'success' :
          statut === 'SUSPENDUE' ? 'warning' :
          statut === 'RESILIEE' ? 'error' : 'default'
        }>
          {statut}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Modifier">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenPoliceForm(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeletePolice(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const carteColumns = [
    {
      title: 'Type',
      dataIndex: 'COD_CAR',
      key: 'COD_CAR',
      width: 100,
      render: (type) => (
        <Tag color={
          type === 'PRM' ? 'blue' :
          type === 'SEC' ? 'green' :
          type === 'TMP' ? 'orange' : 'default'
        }>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Numéro',
      dataIndex: 'NUM_CAR',
      key: 'NUM_CAR',
      width: 200,
    },
    {
      title: 'Date début',
      dataIndex: 'DDV_CAR',
      key: 'DDV_CAR',
      width: 120,
      render: (date) => formatDate(date),
    },
    {
      title: 'Date fin',
      dataIndex: 'DFV_CAR',
      key: 'DFV_CAR',
      width: 120,
      render: (date) => formatDate(date),
    },
    {
      title: 'Statut',
      dataIndex: 'STS_CAR',
      key: 'STS_CAR',
      width: 100,
      render: (statut) => (
        <Tag color={
          statut === 1 ? 'success' :
          statut === 0 ? 'error' :
          statut === 2 ? 'warning' : 'default'
        }>
          {statut === 1 ? 'Active' : statut === 0 ? 'Inactive' : 'Suspendue'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Modifier">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenCarteForm(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteCarte(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const centreColumns = [
    {
      title: 'Code',
      dataIndex: 'CODE_CENTRE',
      key: 'CODE_CENTRE',
      width: 100,
    },
    {
      title: 'Nom',
      dataIndex: 'NOM_CENTRE',
      key: 'NOM_CENTRE',
      width: 200,
    },
    {
      title: 'Type',
      dataIndex: 'TYPE_CENTRE',
      key: 'TYPE_CENTRE',
      width: 120,
    },
    {
      title: 'Adresse',
      dataIndex: 'ADRESSE',
      key: 'ADRESSE',
      width: 200,
    },
    {
      title: 'Téléphone',
      dataIndex: 'TELEPHONE',
      key: 'TELEPHONE',
      width: 120,
    },
    {
      title: 'Statut',
      dataIndex: 'STATUT_CENTRE',
      key: 'STATUT_CENTRE',
      width: 100,
      render: (statut) => (
        <Tag color={statut === 'ACTIF' ? 'success' : 'error'}>
          {statut}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Modifier">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenCentreForm(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteCentre(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ==================== EFFETS ====================

  useEffect(() => {
    loadBeneficiaires();
    loadReferenceData();
  }, [loadBeneficiaires, loadReferenceData]);

  // ==================== RENDU ====================

  return (
    <div style={{ padding: '20px' }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TeamOutlined style={{ marginRight: 8 }} />
            <span>Gestion des Bénéficiaires</span>
          </div>
        }
        extra={
          <Space>
            <Button
              icon={<SyncOutlined />}
              onClick={handleSyncData}
              loading={loading.main}
            >
              Synchroniser
            </Button>
            <Button
              icon={<CloudUploadOutlined />}
              onClick={() => setExportModal(true)}
            >
              Exporter
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenForm()}
            >
              Nouveau Bénéficiaire
            </Button>
          </Space>
        }
      >
        {/* Statistiques */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <AntdStatistic
                title="Total Bénéficiaires"
                value={stats.total}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <AntdStatistic
                title="Assurés Principaux"
                value={stats.assuresPrincipaux}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <AntdStatistic
                title="Ayants Droit"
                value={stats.ayantsDroit}
                prefix={<UsergroupAddOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <AntdStatistic
                title="Actifs"
                value={stats.actifs}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Barre de recherche et filtres */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Input
                placeholder="Rechercher un bénéficiaire (nom, prénom, téléphone, identifiant...)"
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onPressEnter={loadBeneficiaires}
                allowClear
              />
            </Col>
            <Col>
              <Popover
                title="Filtres avancés"
                content={
                  <div style={{ width: 300 }}>
                    <Row gutter={[8, 8]}>
                      <Col span={24}>
                        <Select
                          value={filtres.statut_ace}
                          onChange={(value) => setFiltres(prev => ({ ...prev, statut_ace: value }))}
                          style={{ width: '100%' }}
                          placeholder="Statut ACE"
                        >
                          <Option value="tous">Tous les statuts</Option>
                          <Option value="">Assuré Principal</Option>
                          <Option value="Conjoint">Conjoint</Option>
                          <Option value="Enfant">Enfant</Option>
                          <Option value="Ascendant">Ascendant</Option>
                        </Select>
                      </Col>
                      <Col span={12}>
                        <Select
                          value={filtres.sexe}
                          onChange={(value) => setFiltres(prev => ({ ...prev, sexe: value }))}
                          style={{ width: '100%' }}
                          placeholder="Sexe"
                        >
                          <Option value="tous">Tous</Option>
                          <Option value="M">Masculin</Option>
                          <Option value="F">Féminin</Option>
                        </Select>
                      </Col>
                      <Col span={12}>
                        <Input
                          placeholder="Âge min"
                          value={filtres.age_min}
                          onChange={(e) => setFiltres(prev => ({ ...prev, age_min: e.target.value }))}
                        />
                      </Col>
                      <Col span={12}>
                        <Input
                          placeholder="Âge max"
                          value={filtres.age_max}
                          onChange={(e) => setFiltres(prev => ({ ...prev, age_max: e.target.value }))}
                        />
                      </Col>
                      <Col span={12}>
                        <Input
                          placeholder="Employeur"
                          value={filtres.employeur}
                          onChange={(e) => setFiltres(prev => ({ ...prev, employeur: e.target.value }))}
                        />
                      </Col>
                      <Col span={24}>
                        <DatePicker.RangePicker
                          value={[filtres.date_debut, filtres.date_fin]}
                          onChange={(dates) => {
                            setFiltres(prev => ({ 
                              ...prev, 
                              date_debut: dates ? dates[0] : null,
                              date_fin: dates ? dates[1] : null
                            }));
                          }}
                          style={{ width: '100%' }}
                          placeholder={['Date début', 'Date fin']}
                        />
                      </Col>
                    </Row>
                  </div>
                }
                trigger="click"
              >
                <Button icon={<FilterOutlined />} style={{ marginRight: 8 }}>
                  Filtres
                </Button>
              </Popover>
              <Button
                type="primary"
                onClick={loadBeneficiaires}
                loading={loading.table}
                style={{ marginRight: 8 }}
              >
                Appliquer
              </Button>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setFiltres({
                    statut_ace: 'tous',
                    sexe: 'tous',
                    cod_pay: 'tous',
                    date_debut: null,
                    date_fin: null,
                    employeur: '',
                    age_min: '',
                    age_max: ''
                  });
                }}
              >
                Réinitialiser
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Table des bénéficiaires */}
        <Table
          columns={beneficiaireColumns}
          dataSource={beneficiaires}
          loading={loading.table}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `${total} bénéficiaires`,
            showQuickJumper: true
          }}
          scroll={{ x: 1300 }}
          locale={{
            emptyText: (
              <Empty
                description="Aucun bénéficiaire trouvé"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenForm()}
                >
                  Ajouter un bénéficiaire
                </Button>
              </Empty>
            )
          }}
        />
      </Card>

      {/* Modal Formulaire Bénéficiaire */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {editingId ? <EditOutlined /> : <PlusOutlined />}
            <span style={{ marginLeft: 8 }}>
              {editingId ? 'Modifier Bénéficiaire' : 'Nouveau Bénéficiaire'}
            </span>
          </div>
        }
        open={showForm}
        onCancel={() => {
          setShowForm(false);
          form.resetFields();
          setPhotoFile(null);
          setPhotoPreview(null);
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Tabs defaultActiveKey="1">
            <TabPane tab="Informations Personnelles" key="1">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="NOM_BEN"
                    label="Nom *"
                    rules={[{ required: true, message: 'Veuillez saisir le nom' }]}
                  >
                    <Input placeholder="Nom" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="PRE_BEN"
                    label="Prénom *"
                    rules={[{ required: true, message: 'Veuillez saisir le prénom' }]}
                  >
                    <Input placeholder="Prénom" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="FIL_BEN"
                    label="Nom marital"
                  >
                    <Input placeholder="Nom marital (si applicable)" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="SEX_BEN"
                    label="Sexe *"
                    rules={[{ required: true, message: 'Veuillez sélectionner le sexe' }]}
                  >
                    <Select placeholder="Sélectionner le sexe">
                      <Option value="M">Masculin</Option>
                      <Option value="F">Féminin</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="NAI_BEN"
                    label="Date de naissance *"
                    rules={[{ required: true, message: 'Veuillez sélectionner la date de naissance' }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="IDENTIFIANT_NATIONAL"
                    label="Identifiant national"
                  >
                    <Input placeholder="Généré automatiquement" readOnly />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Photo">
                <Upload
                  listType="picture-card"
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={handlePhotoChange}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="avatar" style={{ width: '100%' }} />
                  ) : (
                    <div>
                      <CameraOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </TabPane>

            <TabPane tab="Coordonnées" key="2">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="TELEPHONE_MOBILE"
                    label="Téléphone mobile *"
                    rules={[{ required: true, message: 'Veuillez saisir le téléphone' }]}
                  >
                    <Input placeholder="Téléphone mobile" prefix={<PhoneOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="EMAIL"
                    label="Email"
                    rules={[{ type: 'email', message: 'Email invalide' }]}
                  >
                    <Input placeholder="Email" prefix={<MailOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="PROFESSION"
                    label="Profession"
                  >
                    <Input placeholder="Profession" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="EMPLOYEUR"
                    label="Employeur"
                  >
                    <Input placeholder="Employeur" prefix={<BankOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="COD_PAY"
                    label="Pays"
                    initialValue="CMR"
                  >
                    <Select placeholder="Sélectionner le pays">
                      {paysList.map(pays => (
                        <Option key={pays.COD_PAY} value={pays.COD_PAY}>
                          {pays.NOM_PAY}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="STATUT"
                    label="Statut"
                    initialValue="ACTIF"
                  >
                    <Select>
                      <Option value="ACTIF">Actif</Option>
                      <Option value="INACTIF">Inactif</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="Affiliation" key="3">
              <Form.Item
                name="STATUT_ACE"
                label="Statut ACE"
              >
                <Select placeholder="Sélectionner le statut">
                  <Option value="">Assuré Principal</Option>
                  <Option value="Conjoint">Conjoint</Option>
                  <Option value="Enfant">Enfant</Option>
                  <Option value="Ascendant">Ascendant</Option>
                </Select>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.STATUT_ACE !== currentValues.STATUT_ACE}
              >
                {({ getFieldValue }) => {
                  const statutAce = getFieldValue('STATUT_ACE');
                  if (statutAce) {
                    return (
                      <Form.Item
                        name="ID_ASSURE_PRINCIPAL"
                        label="Assuré principal *"
                        rules={[{ required: true, message: 'Veuillez sélectionner un assuré principal' }]}
                      >
                        <Select
                          placeholder="Sélectionner un assuré principal"
                          showSearch
                          filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                          }
                        >
                          {assuresPrincipaux.map(assure => (
                            <Option key={assure.id} value={assure.id}>
                              {assure.nom} {assure.prenom} ({assure.identifiant_national})
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    );
                  }
                  return null;
                }}
              </Form.Item>

              <Form.Item
                name="ID_CENTRE_SANTE"
                label="Centre de santé"
              >
                <Select
                  placeholder="Sélectionner un centre de santé"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {allCentres.map(centre => (
                    <Option key={centre.ID_CENTRE || centre.id} value={centre.ID_CENTRE || centre.id}>
                      {centre.NOM_CENTRE} ({centre.TYPE_CENTRE})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="ASSURANCE_PRIVE"
                label="Assurance privée"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </TabPane>
          </Tabs>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Button
              onClick={() => {
                setShowForm(false);
                form.resetFields();
                setPhotoFile(null);
                setPhotoPreview(null);
              }}
              style={{ marginRight: 8 }}
            >
              Annuler
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading.form}
              icon={<SaveOutlined />}
            >
              {editingId ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Polices */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FileTextOutlined />
            <span style={{ marginLeft: 8 }}>
              Polices - {selectedBeneficiaireForPolices?.NOM_BEN} {selectedBeneficiaireForPolices?.PRE_BEN}
            </span>
          </div>
        }
        open={policesModal}
        onCancel={() => {
          setPolicesModal(false);
          setSelectedBeneficiaireForPolices(null);
          setPolices([]);
        }}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenPoliceForm()}
          >
            Ajouter une police
          </Button>
        </div>

        <Table
          columns={policeColumns}
          dataSource={polices}
          loading={loading.polices}
          pagination={{ pageSize: 5 }}
          locale={{
            emptyText: (
              <Empty
                description="Aucune police enregistrée"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenPoliceForm()}
                >
                  Ajouter une première police
                </Button>
              </Empty>
            )
          }}
        />
      </Modal>

      {/* Modal Cartes */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IdcardOutlined />
            <span style={{ marginLeft: 8 }}>
              Cartes - {selectedBeneficiaireForCartes?.NOM_BEN} {selectedBeneficiaireForCartes?.PRE_BEN}
            </span>
          </div>
        }
        open={cartesModal}
        onCancel={() => {
          setCartesModal(false);
          setSelectedBeneficiaireForCartes(null);
          setCartes([]);
        }}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenCarteForm()}
          >
            Créer une carte
          </Button>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setCarteModal(true);
            }}
            style={{ marginLeft: 8 }}
          >
            Voir la carte
          </Button>
        </div>

        <Table
          columns={carteColumns}
          dataSource={cartes}
          loading={loading.cartes}
          pagination={{ pageSize: 5 }}
          locale={{
            emptyText: (
              <Empty
                description="Aucune carte enregistrée"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenCarteForm()}
                >
                  Créer une première carte
                </Button>
              </Empty>
            )
          }}
        />
      </Modal>

      {/* Modal Centres de Santé */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MedicineBoxOutlined />
            <span style={{ marginLeft: 8 }}>
              Centre de santé - {selectedBeneficiaireForCentres?.NOM_BEN} {selectedBeneficiaireForCentres?.PRE_BEN}
            </span>
          </div>
        }
        open={centresModal}
        onCancel={() => {
          setCentresModal(false);
          setSelectedBeneficiaireForCentres(null);
          setCentres([]);
        }}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <Alert
          message="Information"
          description="Ce bénéficiaire peut choisir parmi les centres de santé disponibles ou un centre spécifique peut lui être attribué."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Tabs defaultActiveKey="1">
          <TabPane tab="Centres attribués" key="1">
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenCentreForm()}
              >
                Ajouter un centre
              </Button>
            </div>
            <Table
              columns={centreColumns}
              dataSource={centres}
              loading={loading.centres}
              pagination={{ pageSize: 5 }}
              locale={{
                emptyText: (
                  <Empty
                    description="Aucun centre attribué"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )
              }}
            />
          </TabPane>
          <TabPane tab="Tous les centres disponibles" key="2">
            <Table
              columns={centreColumns}
              dataSource={allCentres}
              pagination={{ pageSize: 5 }}
              rowKey={record => record.ID_CENTRE || record.id}
              onRow={(record) => ({
                onClick: () => handleAssignCentre(record)
              })}
            />
          </TabPane>
        </Tabs>
      </Modal>

     {/* Modal Carte Bénéficiaire */}
     <Modal
  title={
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <IdcardOutlined />
      <span style={{ marginLeft: 8 }}>
        Carte Bénéficiaire - {selectedBeneficiaireForCard?.NOM_BEN} {selectedBeneficiaireForCard?.PRE_BEN}
      </span>
    </div>
  }
  open={carteModal}
  onCancel={() => {
    setCarteModal(false);
    setSelectedBeneficiaireForCard(null);
    setCardSide('front');
  }}
  footer={[
    <Button key="print" icon={<PrinterOutlined />} onClick={handlePrintCard}>
      Imprimer
    </Button>,
    <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadCard}>
      Télécharger PDF
    </Button>
  ]}
  width={800}
  style={{ maxWidth: '95vw' }}
>
  {selectedBeneficiaireForCard && (
    <div className="card-preview-container" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        gap: '20px'
      }}>
        <div style={{ 
          flex: 1,
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <InfoCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            <h3 style={{ margin: 0 }}>Instructions</h3>
          </div>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '20px',
            color: '#666',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <li><strong>Format :</strong> A6 paysage (148mm x 105mm)</li>
            <li><strong>Recto :</strong> Photo + Nom + QR Code</li>
            <li><strong>Verso :</strong> Informations du courtier d'assurances</li>
            <li><strong>QR Code :</strong> Contient les informations du bénéficiaire</li>
            <li><strong>Validité :</strong> 1 an à partir de la date d'émission</li>
            <li><strong>Papier recommandé :</strong> Cartonné 250-300g/m²</li>
          </ul>
        </div>
        
        <div style={{ flex: 2 }}>
          <div style={{ 
            display: 'flex', 
            gap: '10px',
            marginBottom: '20px',
            borderBottom: '1px solid #e9ecef',
            paddingBottom: '10px'
          }}>
            <Button 
              type={cardSide === 'front' ? 'primary' : 'default'}
              onClick={() => setCardSide('front')}
              size="small"
            >
              Recto
            </Button>
            <Button 
              type={cardSide === 'back' ? 'primary' : 'default'}
              onClick={() => setCardSide('back')}
              size="small"
            >
              Verso
            </Button>
          </div>
          
          <div style={{ 
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {cardSide === 'front' ? (
              <div style={{ 
                backgroundImage: `url(${FrontbackgroundCard})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: 'white',
                padding: '30px 25px',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                {/* En-tête */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: 'white',
                    textShadow: '1px 1px 3px rgba(0,0,0,0.5)'
                  }}>
                    AMS<br />
                    <span style={{ fontSize: '18px' }}>INSURANCE</span>
                  </div>
                  <div style={{ 
                    textAlign: 'right',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: 'white',
                    letterSpacing: '1px'
                  }}>
                    CARTE<br />
                    <span style={{ fontSize: '22px' }}>TIERS P</span>
                  </div>
                </div>

                {/* Contenu principal */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexGrow: 1
                }}>
                  {/* Photo et info */}
                  <div style={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingRight: '20px'
                  }}>
                    <div style={{ marginBottom: '15px' }}>
                      <Avatar
                        size={100}
                        src={getPhotoUrl(selectedBeneficiaireForCard.PHOTO)}
                        icon={selectedBeneficiaireForCard.SEX_BEN === 'F' ? <WomanOutlined /> : <ManOutlined />}
                        style={{
                          backgroundColor: selectedBeneficiaireForCard.SEX_BEN === 'F' ? '#ff6b6b' : '#1890ff',
                          border: '3px solid white',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                        }}
                      />
                    </div>
                    
                    <div style={{ 
                      width: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      padding: '8px',
                      borderRadius: '6px',
                      marginBottom: '10px'
                    }}>
                      <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '3px' }}>MATRICULE</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '1px' }}>
                        {selectedBeneficiaireForCard.IDENTIFIANT_NATIONAL || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Détails */}
                  <div style={{ 
                    flex: 2, 
                    paddingLeft: '20px'
                  }}>
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '5px',
                        textShadow: '1px 1px 3px rgba(0,0,0,0.5)'
                      }}>
                        {selectedBeneficiaireForCard.NOM_BEN}
                      </div>
                      <div style={{ 
                        fontSize: '20px',
                        letterSpacing: '1px',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                      }}>
                        {selectedBeneficiaireForCard.PRE_BEN}
                      </div>
                    </div>
                    
                    <div style={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      padding: '10px',
                      borderRadius: '6px',
                      marginBottom: '10px'
                    }}>
                      <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '3px' }}>EMPLOYEUR</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {selectedBeneficiaireForCard.EMPLOYEUR || 'Non spécifié'}
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '15px'
                    }}>
                      <div>
                        <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '3px' }}>ÂGE</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          {calculateAge(selectedBeneficiaireForCard.NAI_BEN)} ans
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '3px' }}>SEXE</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                          {selectedBeneficiaireForCard.SEX_BEN === 'M' ? 'MASCULIN' : 'FÉMININ'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bas de la carte */}
                <div style={{ 
                  textAlign: 'center',
                  marginTop: '15px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255,255,255,0.3)',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}>
                  REGNA H
                </div>
              </div>
            ) : (
              <div style={{ 
                backgroundImage: `url(${backgroundCard})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '30px 25px',
                minHeight: '400px',
                color: '#333',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                
                
                <div style={{ fontSize: '16px', lineHeight: '1.5', textAlign: 'center', marginBottom: '30px', color: '#333', fontWeight: '500' }}>
                  <div style={{ marginBottom: '10px' }}>Bonapriso, Rue VASNITEX, Immeuble ATLANTIS</div>
                  <div style={{ marginBottom: '10px' }}>Avenue Winton Churchill, Immeuble mitoyen à l'OAPI (Yaoundé)</div>
                  <div style={{ marginBottom: '10px' }}>BP 4962 Douala – Cameroun</div>
                  <div style={{ marginBottom: '20px' }}>
                    <strong>Tel :</strong> 2 33 42 08 74 / 6 99 90 60 88 / 690096197
                  </div>
                </div>
                
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a2980', textAlign: 'center', marginBottom: '30px', textTransform: 'uppercase', background: 'rgba(26, 41, 128, 0.1)', padding: '15px', borderRadius: '8px' }}>
                  Support Technique: +237 690 09 61 97 / +237 674 29 01 49
                </div>
                
                <div style={{ fontSize: '14px', lineHeight: '1.4', textAlign: 'center', marginTop: 'auto', color: '#333', padding: '15px', borderTop: '3px solid red', background: 'rgba(255, 0, 0, 0.05)', borderRadius: '6px' }}>
                  <strong>⚠️ IMPORTANT :</strong> Cette carte est strictement personnelle et est la propriété exclusive d'AMS INSURANCE.<br/>
                  En cas de perte ou vol, contactez immédiatement le support technique.
                </div>
              </div>
            )}
          </div>
          
          <div style={{ 
            textAlign: 'center',
            marginTop: '15px',
            fontSize: '12px',
            color: '#666'
          }}>
            <small>Format : A6 paysage (148x105mm) - QR Code contient les informations du bénéficiaire</small>
          </div>
        </div>
      </div>
    </div>
  )}
</Modal>

      {/* Modal Formulaire Police */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FileAddOutlined />
            <span style={{ marginLeft: 8 }}>
              {editingPolice ? 'Modifier Police' : 'Nouvelle Police'}
            </span>
          </div>
        }
        open={showPoliceForm}
        onCancel={() => {
          setShowPoliceForm(false);
          policeForm.resetFields();
          setEditingPolice(null);
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={policeForm}
          layout="vertical"
          onFinish={handleSavePolice}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="NUM_POLICE"
                label="Numéro de police *"
                rules={[{ required: true, message: 'Veuillez saisir le numéro' }]}
              >
                <Input placeholder="Ex: POL-2024-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="TYPE_POLICE"
                label="Type de police *"
                rules={[{ required: true, message: 'Veuillez sélectionner le type' }]}
              >
                <Select placeholder="Sélectionner le type">
                  <Option value="INDIVIDUELLE">Individuelle</Option>
                  <Option value="FAMILIALE">Familiale</Option>
                  <Option value="COLLECTIVE">Collective</Option>
                  <Option value="ENTREPRISE">Entreprise</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="DATE_EFFET"
                label="Date d'effet *"
                rules={[{ required: true, message: 'Veuillez sélectionner la date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="DATE_ECHEANCE"
                label="Date d'échéance *"
                rules={[{ required: true, message: 'Veuillez sélectionner la date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="MONTANT_PRIME"
            label="Montant de la prime (FCFA)"
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
              parser={value => value.replace(/\s/g, '')}
              placeholder="0"
            />
          </Form.Item>

          <Form.Item
            name="STATUT_POLICE"
            label="Statut"
          >
            <Select>
              <Option value="ACTIVE">Active</Option>
              <Option value="SUSPENDUE">Suspendue</Option>
              <Option value="RESILIEE">Résiliée</Option>
            </Select>
          </Form.Item>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Button
              onClick={() => {
                setShowPoliceForm(false);
                policeForm.resetFields();
                setEditingPolice(null);
              }}
              style={{ marginRight: 8 }}
            >
              Annuler
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading.polices}
              icon={<SaveOutlined />}
            >
              {editingPolice ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Formulaire Carte */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IdcardOutlined />
            <span style={{ marginLeft: 8 }}>
              {editingCarte ? 'Modifier Carte' : 'Nouvelle Carte'}
            </span>
          </div>
        }
        open={showCarteForm}
        onCancel={() => {
          setShowCarteForm(false);
          carteForm.resetFields();
          setEditingCarte(null);
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={carteForm}
          layout="vertical"
          onFinish={handleSaveCarte}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="COD_CAR"
                label="Type de carte *"
                rules={[{ required: true, message: 'Veuillez sélectionner le type' }]}
              >
                <Select placeholder="Sélectionner le type">
                  <Option value="PRM">Principale</Option>
                  <Option value="SEC">Secondaire</Option>
                  <Option value="TMP">Temporaire</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="NUM_CAR"
                label="Numéro de carte *"
                rules={[{ required: true, message: 'Veuillez saisir le numéro' }]}
              >
                <Input placeholder="Ex: CMR-PRM-2412-00001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="DDV_CAR"
                label="Date début validité *"
                rules={[{ required: true, message: 'Veuillez sélectionner la date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="DFV_CAR"
                label="Date fin validité *"
                rules={[{ required: true, message: 'Veuillez sélectionner la date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="STS_CAR"
            label="Statut"
          >
            <Select>
              <Option value={1}>Active</Option>
              <Option value={0}>Inactive</Option>
              <Option value={2}>Suspendue</Option>
            </Select>
          </Form.Item>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Button
              onClick={() => {
                setShowCarteForm(false);
                carteForm.resetFields();
                setEditingCarte(null);
              }}
              style={{ marginRight: 8 }}
            >
              Annuler
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading.cartes}
              icon={<SaveOutlined />}
            >
              {editingCarte ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Formulaire Centre */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MedicineBoxOutlined />
            <span style={{ marginLeft: 8 }}>
              {editingCentre ? 'Modifier Centre' : 'Nouveau Centre'}
            </span>
          </div>
        }
        open={showCentreForm}
        onCancel={() => {
          setShowCentreForm(false);
          centreForm.resetFields();
          setEditingCentre(null);
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={centreForm}
          layout="vertical"
          onFinish={handleSaveCentre}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="CODE_CENTRE"
                label="Code centre *"
                rules={[{ required: true, message: 'Veuillez saisir le code' }]}
              >
                <Input placeholder="Ex: CENTRE-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="NOM_CENTRE"
                label="Nom centre *"
                rules={[{ required: true, message: 'Veuillez saisir le nom' }]}
              >
                <Input placeholder="Nom du centre" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="TYPE_CENTRE"
                label="Type centre *"
                rules={[{ required: true, message: 'Veuillez sélectionner le type' }]}
              >
                <Select placeholder="Sélectionner le type">
                  <Option value="HOPITAL">Hôpital</Option>
                  <Option value="CLINIQUE">Clinique</Option>
                  <Option value="DISPENSAIRE">Dispensaire</Option>
                  <Option value="CABINET">Cabinet médical</Option>
                  <Option value="PHARMACIE">Pharmacie</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="TELEPHONE"
                label="Téléphone *"
                rules={[{ required: true, message: 'Veuillez saisir le téléphone' }]}
              >
                <Input placeholder="Téléphone" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="ADRESSE"
            label="Adresse *"
            rules={[{ required: true, message: 'Veuillez saisir l\'adresse' }]}
          >
            <Input placeholder="Adresse complète" />
          </Form.Item>

          <Form.Item
            name="EMAIL"
            label="Email"
            rules={[{ type: 'email', message: 'Email invalide' }]}
          >
            <Input placeholder="Email" prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item
            name="SPECIALITES"
            label="Spécialités"
          >
            <Select mode="tags" placeholder="Ajouter des spécialités" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="CONVENTIONNE"
                label="Conventionné"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="STATUT_CENTRE"
                label="Statut"
                initialValue="ACTIF"
              >
                <Select>
                  <Option value="ACTIF">Actif</Option>
                  <Option value="INACTIF">Inactif</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Button
              onClick={() => {
                setShowCentreForm(false);
                centreForm.resetFields();
                setEditingCentre(null);
              }}
              style={{ marginRight: 8 }}
            >
              Annuler
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading.centres}
              icon={<SaveOutlined />}
            >
              {editingCentre ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Export */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CloudUploadOutlined />
            <span style={{ marginLeft: 8 }}>Exporter les données</span>
          </div>
        }
        open={exportModal}
        onCancel={() => setExportModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setExportModal(false)}>
            Annuler
          </Button>,
          <Button 
            key="export" 
            type="primary" 
            loading={loading.export}
            onClick={handleExportData}
            icon={<DownloadOutlined />}
          >
            Exporter
          </Button>
        ]}
        width={400}
      >
        <Form layout="vertical">
          <Form.Item label="Format d'export">
            <Radio.Group value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
              <Radio value="excel">
                <FileExcelOutlined style={{ color: '#217346', marginRight: 8 }} />
                Excel (.xlsx)
              </Radio>
              <Radio value="csv">
                <FileExcelOutlined style={{ color: '#217346', marginRight: 8 }} />
                CSV (.csv)
              </Radio>
              <Radio value="pdf">
                <FilePdfOutlined style={{ color: '#ff0000', marginRight: 8 }} />
                PDF (.pdf)
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Alert
            message="Informations d'export"
            description={`L'export contiendra ${beneficiaires.length} bénéficiaires avec les filtres actuels appliqués.`}
            type="info"
            showIcon
          />
        </Form>
      </Modal>
    </div>
  );
};

export default Beneficiaires;