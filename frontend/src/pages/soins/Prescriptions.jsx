import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Row, Col, Button, Modal, Form,
  Select, Input, Table, Tag, Space, message, Tabs,
  Descriptions, Tooltip, Spin, Divider, Typography,
  Checkbox, Alert, Radio, Statistic, Badge, InputNumber,
  DatePicker, Upload, Popconfirm, Empty, notification,
  Steps, Result, Collapse, List, Avatar, AutoComplete
} from 'antd';
import {
  FileTextOutlined, MedicineBoxOutlined, SearchOutlined,
  PlusOutlined, DeleteOutlined, EyeOutlined,
  PrinterOutlined, CheckCircleOutlined, SyncOutlined,
  WarningOutlined, UserOutlined, CloseCircleOutlined,
  DownloadOutlined, HistoryOutlined, CalculatorOutlined,
  DollarOutlined, ScheduleOutlined, InfoCircleOutlined,
  LineChartOutlined, FileExcelOutlined, LoadingOutlined,
  FilePdfOutlined, ClockCircleOutlined, QuestionCircleOutlined,
  UserAddOutlined, TeamOutlined, MedicineBoxTwoTone,
  SwapOutlined, UserSwitchOutlined
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/fr';
import { prescriptionsAPI, beneficiairesAPI, consultationsAPI, prestatairesAPI, centresAPI } from '../../services/api';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;
const { TabPane } = Tabs;
const { Step } = Steps;
const { Panel } = Collapse;

const Prescriptions = () => {
  // États principaux
  const [activeTab, setActiveTab] = useState('saisie');
  const [loading, setLoading] = useState({
    patient: false,
    medicaments: false,
    prescrire: false,
    execution: false,
    impression: false,
    prestations: false,
    prestataires: false,
    consultations: false,
    centres: false
  });

  // États pour la saisie de prescription
  const [patient, setPatient] = useState(null);
  const [prescriptionForm] = Form.useForm();
  const [selectedMedicaments, setSelectedMedicaments] = useState([]);
  const [typePrestation, setTypePrestation] = useState('PHARMACIE');
  const [searchMedicament, setSearchMedicament] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [affectionCode, setAffectionCode] = useState('');
  const [affectionDetails, setAffectionDetails] = useState(null);
  const [consultationInfo, setConsultationInfo] = useState(null);
  const [centreId, setCentreId] = useState(localStorage.getItem('selectedCentre') || '1');
  const [centres, setCentres] = useState([]);
  const [centreNom, setCentreNom] = useState('');
  
  // États pour les prestataires (médecins)
  const [prestataires, setPrestataires] = useState([]);
  const [searchPrestataire, setSearchPrestataire] = useState('');
  const [searchPrestataireResults, setSearchPrestataireResults] = useState([]);
  const [selectedPrestataire, setSelectedPrestataire] = useState(null);
  const [modalPrestataires, setModalPrestataires] = useState(false);
  const [medecinConsultation, setMedecinConsultation] = useState(null);
  const [showMedecinChangeAlert, setShowMedecinChangeAlert] = useState(false);

  // États pour l'exécution de prescription
  const [prescriptionNumero, setPrescriptionNumero] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [actesExecutes, setActesExecutes] = useState([]);
  const [prescriptionDetails, setPrescriptionDetails] = useState(null);
  const [totalFacture, setTotalFacture] = useState(0);

  // États pour la gestion des données
  const [mesPrescriptions, setMesPrescriptions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);

  // ==================== ORDONNANCE MÉDICALE ====================
  const [ordonnanceToPrint, setOrdonnanceToPrint] = useState(null);
  const [printingOrdonnance, setPrintingOrdonnance] = useState(false);
  const [printModalVisible, setPrintModalVisible] = useState(false);

  // ==================== FONCTIONS UTILITAIRES ====================
  const getTypeLabel = (type) => {
    const typeMap = {
      'PHARMACIE': 'Pharmacie',
      'BIOLOGIE': 'Biologie',
      'IMAGERIE': 'Imagerie Médicale',
      'HOSPITALISATION': 'Hospitalisation',
      'CONSULTATION': 'Consultation Spécialisée',
      'KINESITHERAPIE': 'Kinésithérapie',
      'INFIRMIER': 'Soins infirmiers'
    };
    return typeMap[type] || type;
  };

  const getExecutantLabel = (type) => {
    const executantMap = {
      'PHARMACIE': 'Pharmacien',
      'BIOLOGIE': 'Biologiste',
      'IMAGERIE': 'Radiologue',
      'CONSULTATION': 'Médecin',
      'HOSPITALISATION': 'Chef de Service',
      'KINESITHERAPIE': 'Kinésithérapeute',
      'INFIRMIER': 'Infirmier'
    };
    return executantMap[type] || 'Exécutant';
  };

  // Fonction pour générer un numéro de prescription unique
  const generatePrescriptionNumber = () => {
    const date = moment().format('YYMMDD');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PRES-${date}-${random}`;
  };

  // Fonction pour récupérer le nom du centre depuis les informations de consultation
  const getCentreNameFromConsultation = useCallback(async (consultationData) => {
    try {
      if (!consultationData || !consultationData.COD_CEN) return null;
      
      const centre = centres.find(c => 
        c.id === consultationData.COD_CEN || 
        c.cod_cen === consultationData.COD_CEN
      );
      
      if (centre) {
        return centre.nom || centre.NOM_CENTRE || `Centre ${consultationData.COD_CEN}`;
      }
      
      // Si non trouvé dans le cache, faire un appel API
      const response = await centresAPI.getById(consultationData.COD_CEN);
      if (response.success && response.centre) {
        return response.centre.nom || response.centre.NOM_CENTRE;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur récupération centre:', error);
      return null;
    }
  }, [centres]);

  // ==================== ÉTATS POUR LA SAISIE MANUELLE ====================
  const [saisieManuelleMode, setSaisieManuelleMode] = useState(false);
  const [acteManuel, setActeManuel] = useState({
    LIBELLE: '',
    QUANTITE: 1,
    POSOLOGIE: 'À déterminer',
    DUREE: '7',
    PRIX_UNITAIRE: 0,
    TYPE_ELEMENT: 'MEDICAMENT',
    UNITE: 'boîte(s)'
  });
  const [formSaisieManuelle] = Form.useForm();

  // Fonction pour basculer entre le mode recherche et le mode manuel
  const toggleSaisieManuelleMode = () => {
    setSaisieManuelleMode(!saisieManuelleMode);
    setSearchMedicament('');
    setSearchResults([]);
    
    if (!saisieManuelleMode) {
      message.info('Mode saisie manuelle activé');
    } else {
      message.info('Mode recherche activé');
    }
  };

  // Fonction pour ajouter un acte saisi manuellement
  const ajouterActeManuel = () => {
    if (!acteManuel.LIBELLE || acteManuel.LIBELLE.trim() === '') {
      message.error('Veuillez saisir un libellé pour l\'acte');
      return;
    }
    
    const prix = parseFloat(acteManuel.PRIX_UNITAIRE) || 0;
    const quantite = parseInt(acteManuel.QUANTITE) || 1;
    
    if (prix < 0) {
      message.error('Le prix unitaire ne peut pas être négatif');
      return;
    }
    
    if (quantite <= 0) {
      message.error('La quantité doit être supérieure à 0');
      return;
    }
    
    const nouvelActe = {
      ...acteManuel,
      COD_ELEMENT: `MANUEL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      COD_MED: `MANUEL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      LIBELLE: acteManuel.LIBELLE.trim(),
      QUANTITE: quantite,
      POSOLOGIE: acteManuel.POSOLOGIE || 'À déterminer',
      DUREE: acteManuel.DUREE || '7',
      PRIX_UNITAIRE: prix,
      TYPE_ELEMENT: 'ACTE_MANUEL',
      REMBOURSABLE: 0,
      key: `manuel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      estManuel: true
    };
    
    setSelectedMedicaments([...selectedMedicaments, nouvelActe]);
    message.success(`${nouvelActe.LIBELLE} ajouté à la prescription (saisie manuelle)`);
    
    // Réinitialiser le formulaire de saisie manuelle
    setActeManuel({
      LIBELLE: '',
      QUANTITE: 1,
      POSOLOGIE: 'À déterminer',
      DUREE: '7',
      PRIX_UNITAIRE: 0,
      TYPE_ELEMENT: 'MEDICAMENT',
      UNITE: 'boîte(s)'
    });
    formSaisieManuelle.resetFields();
  };

  // Fonction pour vérifier si un acte est manuel
  const estActeManuel = (acte) => {
    return acte.estManuel || acte.TYPE_ELEMENT === 'ACTE_MANUEL' || 
           (acte.COD_ELEMENT && acte.COD_ELEMENT.startsWith('MANUEL_'));
  };

  // ==================== IMPRESSION D'ORDONNANCE AMÉLIORÉE ====================
  const handlePrintOrdonnance = () => {
    if (!ordonnanceToPrint) return;
    
    setPrintingOrdonnance(true);
    
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      message.error('Veuillez autoriser les fenêtres pop-up pour l\'impression');
      setPrintingOrdonnance(false);
      return;
    }
    
    const { patient, selectedPrestataire, selectedMedicaments, centreId, centres, typePrestation, affectionCode, numero, observations, urgent } = ordonnanceToPrint;
    
    // Trouver le centre actuel
    const currentCentre = centres.find(c => c.id === centreId || c.cod_cen === centreId) || {};
    
    // Calculer le total de la prescription
    const totalPrescription = selectedMedicaments?.reduce((sum, med) => {
      const prix = parseFloat(med.PRIX_UNITAIRE) || 0;
      const quantite = parseInt(med.QUANTITE) || 1;
      return sum + (prix * quantite);
    }, 0) || 0;
    
    // Générer le numéro de prescription si non fourni
    const prescriptionNum = numero || generatePrescriptionNumber();
    
    // Définir les données pour le QR Code
    const qrData = {
      prescriptionNumero: prescriptionNum,
      patientNom: patient?.nom_complet || '',
      patientIdentifiant: patient?.numero_carte || patient?.identifiant_national || '',
      datePrescription: moment().format('DD/MM/YYYY'),
      medecin: selectedPrestataire?.nom_complet || '',
      centre: currentCentre.nom || currentCentre.NOM_CENTRE || '',
      total: totalPrescription,
      typePrestation: typePrestation
    };
    
    // Générer l'URL du QR Code
    const generateQRCodeURL = () => {
      const encodedData = encodeURIComponent(JSON.stringify(qrData));
      return `https://chart.googleapis.com/chart?chs=80x80&cht=qr&chl=${encodedData}&choe=UTF-8`;
    };
    
    const qrCodeURL = generateQRCodeURL();
    
    // Date de validité (par défaut 30 jours)
    const dateValidite = ordonnanceToPrint.dateValidite || moment().add(30, 'days').format('DD/MM/YYYY');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <title>Ordonnance Médicale - ${prescriptionNum}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page {
            size: A4;
            margin: 15mm 20mm;
          }
          
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
            line-height: 1.4;
            font-size: 13px;
            position: relative;
            background-color: white;
            width: 210mm;
            min-height: 297mm;
          }
          
          .print-container {
            position: relative;
            width: 100%;
            min-height: 297mm;
            padding: 20px 25px;
            box-sizing: border-box;
            background: linear-gradient(white 98%, #f0f5ff 100%);
            border: 1px solid #e0e0e0;
          }
          
          .security-watermark {
            position: absolute;
            top: 40%;
            left: 0;
            width: 100%;
            text-align: center;
            opacity: 0.05;
            transform: rotate(-45deg);
            font-size: 60px;
            font-weight: bold;
            color: #2c5aa0;
            z-index: 0;
            pointer-events: none;
            word-wrap: break-word;
            max-width: 100%;
          }
          
          .header-section {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #2c5aa0;
            position: relative;
            z-index: 1;
          }
          
          .header-title {
            color: #2c5aa0;
            margin: 0 0 10px 0;
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          
          .header-subtitle {
            color: #666;
            margin: 0 0 15px 0;
            font-size: 16px;
            font-weight: 500;
          }
          
          .prescription-number-container {
            background: linear-gradient(135deg, #2c5aa0, #1a3a6c);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin: 15px auto;
            text-align: center;
            border: 2px solid #2c5aa0;
            width: 90%;
            font-weight: bold;
            font-size: 18px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 1;
          }
          
          .prescription-number-label {
            font-size: 12px;
            opacity: 0.9;
            display: block;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .section {
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
          }
          
          .section-title {
            background-color: #f0f5ff;
            color: #2c5aa0;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 12px;
            padding: 8px 15px;
            border-left: 4px solid #2c5aa0;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 15px;
          }
          
          .info-item {
            display: flex;
            margin-bottom: 8px;
          }
          
          .info-label {
            font-weight: bold;
            color: #000;
            min-width: 160px;
            flex-shrink: 0;
          }
          
          .info-value {
            flex: 1;
            text-align: left;
            padding-left: 10px;
            color: #333;
            border-bottom: 1px dashed #ddd;
          }
          
          .prescription-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 15px 0;
            font-size: 12px;
            border: 1px solid #2c5aa0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          
          .prescription-table th {
            background: linear-gradient(135deg, #2c5aa0, #1a3a6c);
            color: white;
            font-weight: bold;
            padding: 10px 8px;
            text-align: left;
            border-right: 1px solid #3a6ab8;
          }
          
          .prescription-table th:last-child {
            border-right: none;
          }
          
          .prescription-table td {
            padding: 8px;
            border-right: 1px solid #eee;
            border-bottom: 1px solid #eee;
          }
          
          .prescription-table tr:nth-child(even) {
            background-color: #f9fafc;
          }
          
          .prescription-table tr:hover {
            background-color: #f0f7ff;
          }
          
          .total-row {
            font-weight: bold;
            background-color: #e8f4ff;
          }
          
          .total-row td {
            text-align: right;
            font-size: 13px;
            padding: 10px 8px;
            border-top: 2px solid #2c5aa0;
          }
          
          .signature-section {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 2px solid #2c5aa0;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            position: relative;
            z-index: 1;
          }
          
          .signature-block {
            flex: 1;
            text-align: center;
            padding: 0 20px;
          }
          
          .signature-line {
            width: 180px;
            border-bottom: 1px solid #000;
            height: 20px;
            margin: 0 auto 8px;
          }
          
          .signature-label {
            margin: 5px 0 0 0;
            font-size: 12px;
            color: #000;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .signature-details {
            margin: 2px 0 0 0;
            font-size: 11px;
            color: #666;
            line-height: 1.3;
          }
          
          .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 11px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 15px;
            position: relative;
            z-index: 1;
          }
          
          .legal-section {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            font-size: 11px;
            color: #666;
            background-color: #f9f9f9;
            text-align: center;
            position: relative;
            z-index: 1;
          }
          
          .qrcode-container {
            position: absolute;
            top: 20px;
            right: 25px;
            text-align: center;
            padding: 8px;
            border: 1px solid #2c5aa0;
            border-radius: 8px;
            background: white;
            width: 100px;
            height: 100px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1;
          }
          
          .qrcode-img {
            width: 80px;
            height: 80px;
          }
          
          .qrcode-label {
            font-size: 9px;
            color: #2c5aa0;
            margin-top: 4px;
            font-weight: bold;
          }
          
          .center-info {
            position: absolute;
            top: 20px;
            left: 25px;
            font-size: 11px;
            color: #333;
            line-height: 1.4;
            max-width: 220px;
            background: white;
            padding: 10px;
            border: 1px solid #2c5aa0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            z-index: 1;
          }
          
          .diagnosis-box {
            padding: 12px;
            background-color: #f9f9f9;
            border-radius: 6px;
            border: 1px solid #ddd;
            min-height: 50px;
            margin-bottom: 15px;
            line-height: 1.6;
          }
          
          .observations-box {
            padding: 12px;
            background-color: #fff9e6;
            border-radius: 6px;
            border: 1px solid #ffd166;
            min-height: 50px;
            margin-bottom: 15px;
            line-height: 1.6;
          }
          
          .urgent-badge {
            position: absolute;
            top: 20px;
            right: 140px;
            background-color: #ff4d4f;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            transform: rotate(15deg);
            z-index: 1;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              margin: 0;
              padding: 0;
              width: 210mm;
              min-height: 297mm;
            }
            
            .print-container {
              padding: 0;
              border: none;
              box-shadow: none;
            }
            
            .security-watermark {
              opacity: 0.08;
            }
          }
          
          .text-right {
            text-align: right;
          }
          
          .text-center {
            text-align: center;
          }
          
          .text-bold {
            font-weight: bold;
          }
          
          .empty-field {
            color: #999;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- Filigrane de sécurité -->
          <div class="security-watermark">
            ORDONNANCE MÉDICALE OFFICIELLE<br>
            ${currentCentre.nom || currentCentre.NOM_CENTRE || 'CENTRE DE SANTÉ'}
          </div>
          
          <!-- Badge urgent si nécessaire -->
          ${urgent ? `
            <div class="urgent-badge">
              URGENT
            </div>
          ` : ''}
          
          <!-- QR Code en haut à droite -->
          <div class="qrcode-container">
            <div style="font-size: 10px; color: #2c5aa0; margin-bottom: 5px; font-weight: bold;">
              QR CODE DE VÉRIFICATION
            </div>
            <img src="${qrCodeURL}" alt="QR Code Prescription" class="qrcode-img" />
            <div class="qrcode-label">
              SCAN POUR VÉRIFIER
            </div>
          </div>
          
          <!-- Info centre en haut à gauche -->
          <div class="center-info">
            <div style="font-weight: bold; margin-bottom: 8px; color: #2c5aa0; font-size: 12px;">
              ${currentCentre.nom || currentCentre.NOM_CENTRE || 'Centre de santé'}
            </div>
            ${currentCentre.adresse || currentCentre.ADRESSE ? `
              <div style="margin-bottom: 4px;">
                <strong>Adresse:</strong> ${currentCentre.adresse || currentCentre.ADRESSE}
              </div>
            ` : ''}
            ${currentCentre.telephone || currentCentre.TELEPHONE ? `
              <div style="margin-bottom: 4px;">
                <strong>Téléphone:</strong> ${currentCentre.telephone || currentCentre.TELEPHONE}
              </div>
            ` : ''}
            ${currentCentre.email || currentCentre.EMAIL ? `
              <div style="margin-bottom: 4px;">
                <strong>Email:</strong> ${currentCentre.email || currentCentre.EMAIL}
              </div>
            ` : ''}
          </div>
          
          <!-- En-tête principal -->
          <div class="header-section">
            <h1 class="header-title">Ordonnance Médicale</h1>
            <h2 class="header-subtitle">Prescription Médicale Officielle</h2>
            
            <div class="prescription-number-container">
              <span class="prescription-number-label">N° Prescription</span>
              ${prescriptionNum}
            </div>
          </div>
          
          <!-- Section Informations du Patient -->
          <div class="section">
            <div class="section-title">INFORMATIONS DU PATIENT</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Nom et Prénom:</span>
                <span class="info-value">${patient?.nom_complet || 'Non spécifié'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Âge:</span>
                <span class="info-value">${patient?.age || 'N/A'} ans</span>
              </div>
              <div class="info-item">
                <span class="info-label">Identifiant:</span>
                <span class="info-value">${patient?.numero_carte || patient?.identifiant_national || 'Non spécifié'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Sexe:</span>
                <span class="info-value">${patient?.sexe || 'Non spécifié'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Date de prescription:</span>
                <span class="info-value">${moment().format('DD/MM/YYYY HH:mm')}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Date de validité:</span>
                <span class="info-value">${dateValidite}</span>
              </div>
            </div>
          </div>
          
          <!-- Section Informations Médicales -->
          <div class="section">
            <div class="section-title">INFORMATIONS MÉDICALES</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Centre de santé:</span>
                <span class="info-value">${currentCentre.nom || currentCentre.NOM_CENTRE || 'Non spécifié'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Médecin prescripteur:</span>
                <span class="info-value">${selectedPrestataire?.nom_complet || 'Non spécifié'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Type de prescription:</span>
                <span class="info-value">${getTypeLabel(typePrestation)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Statut:</span>
                <span class="info-value">${ordonnanceToPrint.statut || 'Valide'}</span>
              </div>
            </div>
          </div>
          
          <!-- Section Diagnostic/Affection -->
          <div class="section">
            <div class="section-title">DIAGNOSTIC / AFFECTION</div>
            <div class="diagnosis-box">
              ${affectionCode ? `
                <div style="margin-bottom: 5px;">
                  <span style="font-weight: bold;">Code CIM:</span> ${affectionCode}
                </div>
              ` : ''}
              ${affectionDetails?.libelle ? `
                <div style="margin-bottom: 5px;">
                  <span style="font-weight: bold;">Libellé:</span> ${affectionDetails.libelle}
                </div>
              ` : '<br>'}
            </div>
          </div>
          
          <!-- Section Détails de la Prescription -->
          <div class="section">
            <div class="section-title">DÉTAILS DE LA PRESCRIPTION (${selectedMedicaments?.length || 0} actes)</div>
            
            <table class="prescription-table">
              <thead>
                <tr>
                  <th width="5%">N°</th>
                  <th width="30%">Désignation</th>
                  <th width="10%">Quantité</th>
                  <th width="25%">Posologie</th>
                  <th width="15%">Prix unitaire</th>
                  <th width="15%">Montant</th>
                </tr>
              </thead>
              <tbody>
                ${selectedMedicaments?.length > 0 ? selectedMedicaments.map((med, index) => {
                  const prixUnitaire = parseFloat(med.PRIX_UNITAIRE) || 0;
                  const quantite = parseInt(med.QUANTITE) || 1;
                  const montant = prixUnitaire * quantite;
                  
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td><strong>${med.LIBELLE || med.libelle || 'Médicament'}</strong><br>
                        ${med.NOM_GENERIQUE ? `<span style="font-size: 10px; color: #666;">Générique: ${med.NOM_GENERIQUE}</span>` : ''}
                      </td>
                      <td>${quantite} ${med.UNITE || 'boîte(s)'}</td>
                      <td>${med.POSOLOGIE || 'À déterminer'}<br>
                        ${med.DUREE ? `<span style="font-size: 10px; color: #666;">Durée: ${med.DUREE} jours</span>` : ''}
                      </td>
                      <td class="text-right">${prixUnitaire.toLocaleString('fr-FR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} FCFA</td>
                      <td class="text-right text-bold">${montant.toLocaleString('fr-FR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} FCFA</td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="6" class="text-center" style="padding: 20px; color: #999;">
                      Aucun médicament prescrit
                    </td>
                  </tr>
                `}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="5" class="text-right text-bold">TOTAL DE LA PRESCRIPTION</td>
                  <td class="text-right text-bold">
                    ${totalPrescription.toLocaleString('fr-FR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} FCFA
                  </td>
                </tr>
              </tfoot>
            </table>
            
            ${ordonnanceToPrint.modeRemboursement || ordonnanceToPrint.delaiValidite ? `
              <div style="margin-top: 12px; font-size: 12px; display: flex; justify-content: space-between;">
                ${ordonnanceToPrint.modeRemboursement ? `
                  <div>
                    <strong>Mode de remboursement:</strong> ${ordonnanceToPrint.modeRemboursement}
                  </div>
                ` : ''}
                ${ordonnanceToPrint.delaiValidite ? `
                  <div>
                    <strong>Délai de validité:</strong> ${ordonnanceToPrint.delaiValidite}
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
          
          <!-- Section Observations -->
          ${observations ? `
            <div class="section">
              <div class="section-title">OBSERVATIONS MÉDICALES</div>
              <div class="observations-box">
                ${observations}
              </div>
            </div>
          ` : ''}
          
          <!-- Section Signatures -->
          <div class="signature-section">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-label">Médecin Prescripteur</div>
              <div class="signature-details">
                ${selectedPrestataire?.nom_complet || 'Nom du médecin'}<br>
                ${selectedPrestataire?.specialite || 'Spécialité'} - ${selectedPrestataire?.titre || 'Dr.'}
              </div>
            </div>
            
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-label">${getExecutantLabel(typePrestation)}</div>
              <div class="signature-details">
                (Signature et cachet)<br>
                Date d'exécution
              </div>
            </div>
            
            ${typePrestation === 'PHARMACIE' ? `
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Pharmacien</div>
                <div class="signature-details">
                  (Signature)<br>
                  N° d'agrément
                </div>
              </div>
            ` : ''}
          </div>
          
          <!-- Section Mentions Légales -->
          <div class="legal-section">
            <div style="font-weight: bold; margin-bottom: 8px; color: #2c5aa0;">
              MENTIONS LÉGALES ET INFORMATIONS
            </div>
            <div style="margin-bottom: 6px;">
              • Document généré électroniquement par le système de gestion AMS - Validité légale assurée
            </div>
            <div style="margin-bottom: 6px;">
              • Date de génération: ${moment().format('DD/MM/YYYY à HH:mm')}
            </div>
            <div style="margin-bottom: 6px;">
              • Prescription urgente: ${urgent ? 'OUI - Priorité absolue' : 'NON'}
            </div>
            <div style="margin-bottom: 6px;">
              • Cette ordonnance est valable jusqu'au: ${dateValidite}
            </div>
            <div>
              • Tout document falsifié est passible de poursuites judiciaires
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div style="margin-bottom: 5px; font-weight: bold; color: #2c5aa0;">
              ${currentCentre.nom || currentCentre.NOM_CENTRE || 'Centre de santé'} - © PRTS 2025
            </div>
            <div style="font-size: 10px; color: #999; margin-bottom: 3px;">
              Document sécurisé - Référence: ${prescriptionNum}
            </div>
            <div style="font-size: 9px; color: #999;">
              Ce document est officiel et ne peut être reproduit ou utilisé sans autorisation
            </div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
          
          window.onafterprint = function() {
            window.close();
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Fermer la fenêtre après impression
    printWindow.onafterprint = () => {
      printWindow.close();
      setPrintingOrdonnance(false);
      setOrdonnanceToPrint(null);
    };
    
    // Fermeture de sécurité après 3 secondes
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.close();
        setPrintingOrdonnance(false);
        setOrdonnanceToPrint(null);
      }
    }, 3000);
  };

  // ==================== CHARGEMENT DES DONNÉES ====================
  const cleanPrescriptionData = (data) => {
    const cleanedData = { ...data };
    
    // Nettoyer les détails
    if (cleanedData.details && Array.isArray(cleanedData.details)) {
      cleanedData.details = cleanedData.details.map(detail => ({
        TYPE_ELEMENT: detail.TYPE_ELEMENT || 'MEDICAMENT',
        COD_ELEMENT: detail.COD_ELEMENT 
          ? String(detail.COD_ELEMENT).trim() 
          : detail.COD_MED 
            ? String(detail.COD_MED).trim() 
            : `MED${Math.floor(Math.random() * 10000)}`,
        LIBELLE: detail.LIBELLE || 'Médicament non spécifié',
        QUANTITE: parseInt(detail.QUANTITE) || 1,
        POSOLOGIE: detail.POSOLOGIE || 'À déterminer',
        DUREE_TRAITEMENT: parseInt(detail.DUREE) || 7,
        PRIX_UNITAIRE: parseFloat(detail.PRIX_UNITAIRE) || 0,
        REMBOURSABLE: detail.REMBOURSABLE || 0
      }));
    }
    
    // S'assurer que tous les champs requis sont présents
    if (!cleanedData.COD_PRESCRIPTEUR) {
      cleanedData.COD_PRESCRIPTEUR = selectedPrestataire?.id || null;
    }
    
    if (!cleanedData.COD_CEN) {
      cleanedData.COD_CEN = centreId;
    }
    
    return cleanedData;
  };

  // Charger les centres de santé
  const loadCentres = useCallback(async () => {
    try {
      console.log('🔍 Chargement des centres de santé...');
      const response = await centresAPI.getAll();
      console.log('📊 Réponse centres:', response);
      
      if (response.success && Array.isArray(response.centres)) {
        setCentres(response.centres);
        console.log(`✅ ${response.centres.length} centres chargés`);
      } else if (Array.isArray(response)) {
        setCentres(response);
        console.log(`✅ ${response.length} centres chargés (format tableau)`);
      } else {
        console.warn('⚠️ Aucun centre trouvé ou format de réponse inattendu');
        setCentres([{ id: '1', nom: 'Centre Principal', cod_cen: '1' }]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement centres:', error);
      message.error('Erreur lors du chargement des centres de santé');
      setCentres([{ id: '1', nom: 'Centre Principal', cod_cen: '1' }]);
    }
  }, []);

  // Charger les prestataires du centre
  const loadPrestataires = useCallback(async (searchTerm = '') => {
    try {
      setLoading(prev => ({ ...prev, prestataires: true }));
      console.log(`🔍 Chargement des médecins pour le centre: ${centreId}`);
      
      const filters = {
        page: 1,
        limit: 100,
        type_prestataire: 'MEDECIN',
        actif: '1',
        affectation_active: '1',
        search: searchTerm
      };
      
      const response = await centresAPI.getPrestatairesByCentre(centreId, filters);
      
      console.log('📊 Réponse API getPrestatairesByCentre:', response);
      
      if (response && response.success && response.prestataires) {
        const formattedPrestataires = response.prestataires.map(p => {
          const specialite = p.SPECIALITE || p.specialite || '';
          const prestataireData = {
            id: p.id || p.COD_PRE || p.COD_PRESCRIPTEUR || `prest-${Date.now()}`,
            COD_PRE: p.COD_PRE || p.id || p.COD_PRESCRIPTEUR,
            NOM_PRESTATAIRE: p.NOM_PRESTATAIRE || p.nom || p.nom_prestataire || 'Nom non spécifié',
            PRENOM_PRESTATAIRE: p.PRENOM_PRESTATAIRE || p.prenom || p.prenom_prestataire || '',
            SPECIALITE: specialite,
            specialite: specialite,
            TELEPHONE: p.TELEPHONE || p.telephone || p.telephone_prestataire || '',
            EMAIL: p.EMAIL || p.email || p.email_prestataire || '',
            COD_CEN: centreId,
            ACTIF: p.ACTIF !== undefined ? p.ACTIF : (p.actif || (p.statut_actif === 'Actif' ? 1 : 0)),
            statut_actif: p.statut_actif || (p.ACTIF === 1 ? 'Actif' : 'Inactif'),
            titre: p.titre || p.TITRE || p.titre_prestataire || 'Dr.',
            cod_cen: p.cod_cen || p.COD_CEN || p.cod_cen_prestataire || centreId,
            statut_affectation: p.statut_affectation || p.STATUT_AFFECTATION || 'Actif',
            date_debut_affectation: p.date_debut_affectation || p.DATE_DEBUT_AFFECTATION,
            date_fin_affectation: p.date_fin_affectation || p.DATE_FIN_AFFECTATION
          };
          
          prestataireData.nom_complet = `${prestataireData.PRENOM_PRESTATAIRE} ${prestataireData.NOM_PRESTATAIRE}`.trim();
          
          if (!prestataireData.nom_complet || prestataireData.nom_complet.trim() === '') {
            prestataireData.nom_complet = `${prestataireData.titre} ${prestataireData.PRENOM_PRESTATAIRE} ${prestataireData.NOM_PRESTATAIRE}`.trim();
          }
          
          return prestataireData;
        }).filter(p => {
          const isActive = p.ACTIF === 1 || p.statut_actif === 'Actif';
          const hasId = p.id && p.id.toString().trim() !== '';
          return hasId && isActive;
        });
        
        console.log(`✅ ${formattedPrestataires.length} médecins formatés pour le centre ${centreId}`);
        
        setPrestataires(formattedPrestataires);
        setSearchPrestataireResults(formattedPrestataires);
        
        // Si nous avons un médecin de consultation, essayons de le trouver d'abord
        if (medecinConsultation && formattedPrestataires.length > 0) {
          const medecinConsultationTrouve = formattedPrestataires.find(p => {
            if (p.nom_complet && medecinConsultation.nom) {
              return p.nom_complet.toLowerCase().includes(medecinConsultation.nom.toLowerCase()) ||
                     medecinConsultation.nom.toLowerCase().includes(p.nom_complet.toLowerCase());
            }
            return false;
          });
          
          if (medecinConsultationTrouve && !selectedPrestataire) {
            setSelectedPrestataire(medecinConsultationTrouve);
            prescriptionForm.setFieldValue('COD_PRESCRIPTEUR', medecinConsultationTrouve.id);
            console.log(`👨‍⚕️ Médecin de consultation sélectionné: ${medecinConsultationTrouve.nom_complet}`);
          }
        }
        
        // Vérifier si le médecin sélectionné appartient à ce centre
        if (selectedPrestataire && formattedPrestataires.length > 0) {
          const currentPrestataire = formattedPrestataires.find(p => 
            p.id.toString() === selectedPrestataire.id.toString() || 
            (p.COD_PRE && p.COD_PRE.toString() === selectedPrestataire.COD_PRE?.toString())
          );
          
          if (!currentPrestataire) {
            setSelectedPrestataire(null);
            prescriptionForm.setFieldValue('COD_PRESCRIPTEUR', null);
            message.info('Le médecin sélectionné a été réinitialisé car il n\'est pas affecté à ce centre');
          }
        }
        
        // Sélectionner le premier prestataire par défaut si aucun n'est sélectionné
        if (formattedPrestataires.length > 0 && !selectedPrestataire) {
          const prestataireActif = formattedPrestataires[0];
          setSelectedPrestataire(prestataireActif);
          prescriptionForm.setFieldValue('COD_PRESCRIPTEUR', prestataireActif.id);
          console.log(`👨‍⚕️ Prestataire par défaut sélectionné: ${prestataireActif.nom_complet}`);
        } else if (formattedPrestataires.length === 0) {
          console.warn('⚠️ Aucun médecin trouvé pour ce centre');
          message.warning('Aucun médecin actif disponible pour ce centre.');
          
          setSelectedPrestataire(null);
          prescriptionForm.setFieldValue('COD_PRESCRIPTEUR', null);
        }
        
      } else {
        console.error('❌ Erreur API centresAPI.getPrestatairesByCentre:', response?.message);
        setPrestataires([]);
        setSearchPrestataireResults([]);
        message.error(response?.message || 'Erreur lors du chargement des médecins');
      }
    } catch (error) {
      console.error('❌ Erreur chargement médecins par centre:', error);
      message.error('Erreur réseau lors du chargement des médecins');
      setPrestataires([]);
      setSearchPrestataireResults([]);
      setSelectedPrestataire(null);
    } finally {
      setLoading(prev => ({ ...prev, prestataires: false }));
    }
  }, [centreId, selectedPrestataire, prescriptionForm, medecinConsultation]);

  // Rechercher des prestataires avec filtrage local
  const searchPrestataires = useCallback((searchTerm) => {
    setSearchPrestataire(searchTerm);
    
    if (!searchTerm || searchTerm.trim().length < 1) {
      setSearchPrestataireResults(prestataires);
      return;
    }
    
    try {
      const searchLower = searchTerm.toLowerCase();
      const filtered = prestataires.filter(p => {
        const nomComplet = (p.nom_complet || '').toLowerCase();
        const nom = (p.nom || '').toLowerCase();
        const prenom = (p.prenom || '').toLowerCase();
        const specialite = (p.specialite || '').toLowerCase();
        const telephone = (p.telephone || '');
        const titre = (p.titre || '').toLowerCase();
        
        return (
          nomComplet.includes(searchLower) ||
          nom.includes(searchLower) ||
          prenom.includes(searchLower) ||
          specialite.includes(searchLower) ||
          telephone.includes(searchTerm) ||
          titre.includes(searchLower) ||
          `${prenom} ${nom}`.includes(searchLower) ||
          `${titre} ${prenom} ${nom}`.includes(searchLower)
        );
      });
      
      setSearchPrestataireResults(filtered);
    } catch (error) {
      console.error('❌ Erreur recherche prestataires:', error);
      setSearchPrestataireResults(prestataires);
    }
  }, [prestataires]);

  // Sélectionner un prestataire
  const selectPrestataire = (prestataire, fromConsultation = false) => {
    if (!prestataire || !prestataire.id) {
      message.error('Prestataire invalide');
      return;
    }
    
    if (!fromConsultation && medecinConsultation && prestataire.id !== medecinConsultation.id) {
      setShowMedecinChangeAlert(true);
    }
    
    setSelectedPrestataire(prestataire);
    prescriptionForm.setFieldValue('COD_PRESCRIPTEUR', prestataire.id);
    
    if (!fromConsultation) {
      setModalPrestataires(false);
      message.success(`Médecin sélectionné: ${prestataire.nom_complet}`);
    }
    
    if (activeTab === 'historique') {
      loadMesPrescriptions();
    }
  };

  // Charger les prescriptions du prestataire
  const loadMesPrescriptions = useCallback(async () => {
    if (!selectedPrestataire) {
      console.warn('⚠️ Aucun prestataire sélectionné pour charger les prescriptions');
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, prestations: true }));
      console.log(`📋 Chargement prescriptions pour le prestataire: ${selectedPrestataire.id}`);
      
      const response = await prescriptionsAPI.getAll({
        medecin_id: selectedPrestataire.id,
        centre_id: centreId,
        limit: 50,
        sortBy: 'DATE_PRESCRIPTION',
        sortOrder: 'DESC',
        include_details: true
      });
      
      console.log('📊 Réponse prescriptions:', response);
      
      if (response.success && Array.isArray(response.prescriptions)) {
        // Pour chaque prescription, récupérer les détails (actes) si non inclus
        const prescriptionsWithDetails = await Promise.all(
          response.prescriptions.map(async (prescription) => {
            try {
              // Si les détails ne sont pas inclus, les récupérer séparément
              if (!prescription.details || prescription.details.length === 0) {
                const detailsResponse = await prescriptionsAPI.getPrescriptionDetails(
                  prescription.COD_PRES || prescription.id
                );
                
                if (detailsResponse.success && detailsResponse.details) {
                  prescription.details = detailsResponse.details;
                } else if (Array.isArray(detailsResponse)) {
                  prescription.details = detailsResponse;
                }
              }
              
              // Assurer que details est un tableau
              prescription.details = prescription.details || [];
              
              // Calculer le total de la prescription à partir des détails
              const total = prescription.details.reduce((sum, detail) => {
                const prix = parseFloat(detail.PRIX_UNITAIRE) || 0;
                const quantite = parseInt(detail.QUANTITE) || 1;
                return sum + (prix * quantite);
              }, 0);
              
              // Ajouter le nombre d'actes pour l'affichage
              const nombreActes = prescription.details.length;
              
              // Retourner une nouvelle prescription avec les données calculées
              return {
                ...prescription,
                details: prescription.details,
                total: total,
                nombreActes: nombreActes
              };
              
            } catch (error) {
              console.error(`❌ Erreur chargement détails prescription ${prescription.COD_PRES}:`, error);
              return {
                ...prescription,
                details: [],
                total: 0,
                nombreActes: 0
              };
            }
          })
        );
        
        setMesPrescriptions(prescriptionsWithDetails);
        console.log(`✅ ${prescriptionsWithDetails.length} prescriptions chargées avec détails`);
      } else {
        console.warn('⚠️ Aucune prescription trouvée ou format de réponse inattendu');
        setMesPrescriptions([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement prescriptions:', error);
      message.error('Erreur lors du chargement des prescriptions');
      setMesPrescriptions([]);
    } finally {
      setLoading(prev => ({ ...prev, prestations: false }));
    }
  }, [selectedPrestataire, centreId]);

  const loadPrescriptionDetails = async (prescriptionId) => {
    try {
      console.log(`🔍 Chargement des détails pour la prescription: ${prescriptionId}`);
      
      let details = [];
      
      // Méthode 1: Utiliser l'API getPrescriptionDetails
      try {
        const response = await prescriptionsAPI.getPrescriptionDetails(prescriptionId);
        if (response.success && response.details) {
          details = response.details;
        } else if (Array.isArray(response)) {
          details = response;
        }
      } catch (error1) {
        console.warn('⚠️ Méthode getPrescriptionDetails échouée:', error1.message);
        
        // Méthode 2: Utiliser getByNumeroOrId
        try {
          const response = await prescriptionsAPI.getByNumeroOrId(prescriptionId);
          if (response.success && response.prescription) {
            details = response.prescription.details || [];
          }
        } catch (error2) {
          console.warn('⚠️ Méthode getByNumeroOrId échouée:', error2.message);
        }
      }
      
      console.log(`✅ ${details.length} actes trouvés pour la prescription ${prescriptionId}`);
      return details;
    } catch (error) {
      console.error('❌ Erreur chargement détails:', error);
      return [];
    }
  };

  const handleViewPrescriptionDetails = async (prescription) => {
    try {
      setLoading(prev => ({ ...prev, prestations: true }));
      
      // Charger les détails de la prescription
      const details = await loadPrescriptionDetails(
        prescription.COD_PRES || prescription.id || prescription.NUMERO_PRESCRIPTION
      );
      
      // Mettre à jour la prescription avec les détails
      const updatedPrescription = {
        ...prescription,
        details: details,
        total: details.reduce((sum, detail) => {
          const prix = parseFloat(detail.PRIX_UNITAIRE) || 0;
          const quantite = parseInt(detail.QUANTITE) || 1;
          return sum + (prix * quantite);
        }, 0),
        nombreActes: details.length
      };
      
      setSelectedPrescription(updatedPrescription);
      setPrescriptionDetails(updatedPrescription);
      setActiveTab('execution');
      
      // Préparer les actes pour l'exécution
      const initialActes = details.map((detail, index) => ({
        ...detail,
        execute: false,
        quantite_executee: detail.QUANTITE || 1,
        prix_execute: detail.PRIX_UNITAIRE || 0,
        key: detail.id || `${detail.COD_ELEMENT}_${index}`
      }));
      
      setActesExecutes(initialActes);
      calculerTotalExecution();
      
      message.success(`Détails de la prescription chargés: ${details.length} actes`);
    } catch (error) {
      console.error('❌ Erreur chargement détails prescription:', error);
      message.error('Erreur lors du chargement des détails de la prescription');
    } finally {
      setLoading(prev => ({ ...prev, prestations: false }));
    }
  };

  const handlePrintPrescriptionFromHistory = async (prescription) => {
    try {
      setLoading(prev => ({ ...prev, prestations: true }));
      
      // Charger les détails si non présents
      let details = prescription.details || [];
      if (details.length === 0) {
        details = await loadPrescriptionDetails(
          prescription.COD_PRES || prescription.id || prescription.NUMERO_PRESCRIPTION
        );
      }
      
      // Trouver le centre
      const prescriptionCentreId = prescription.COD_CEN || centreId;
      const currentCentre = centres.find(c => 
        c.id === prescriptionCentreId || 
        c.cod_cen === prescriptionCentreId
      ) || {};
      
      // Préparer les données pour l'ordonnance
      const ordonnanceData = {
        numero: prescription.NUMERO_PRESCRIPTION || prescription.id,
        patient: {
          nom_complet: `${prescription.PRE_BEN || ''} ${prescription.NOM_BEN || ''}`.trim() || 
                     `${prescription.prenom || ''} ${prescription.nom || ''}`.trim(),
          age: prescription.AGE || calculateAge(prescription.DATE_NAISSANCE || prescription.date_naissance),
          sexe: prescription.SEX_BEN || prescription.sexe,
          numero_carte: prescription.IDENTIFIANT_NATIONAL || prescription.numero_carte,
          identifiant_national: prescription.IDENTIFIANT_NATIONAL
        },
        selectedPrestataire: {
          nom_complet: prescription.NOM_MEDECIN || prescription.medecin_nom,
          specialite: prescription.SPECIALITE || prescription.medecin_specialite,
          titre: prescription.TITRE || 'Dr.'
        },
        selectedMedicaments: details.map(detail => ({
          ...detail,
          estManuel: estActeManuel(detail),
          // S'assurer que tous les champs nécessaires sont présents
          LIBELLE: detail.LIBELLE || detail.libelle || 'Acte non spécifié',
          QUANTITE: detail.QUANTITE || 1,
          POSOLOGIE: detail.POSOLOGIE || 'À déterminer',
          PRIX_UNITAIRE: detail.PRIX_UNITAIRE || 0,
          UNITE: detail.UNITE || 'boîte(s)'
        })),
        centreId: prescriptionCentreId,
        centres: centres,
        typePrestation: prescription.TYPE_PRESTATION,
        affectionCode: prescription.COD_AFF,
        urgent: prescription.URGENT || false,
        dateValidite: prescription.DATE_VALIDITE,
        statut: prescription.STATUT,
        observations: prescription.OBSERVATIONS,
        modeRemboursement: prescription.MODE_REMBOURSEMENT,
        delaiValidite: prescription.DELAI_VALIDITE,
        nombreActes: details.length,
        total: details.reduce((sum, med) => {
          const prix = parseFloat(med.PRIX_UNITAIRE) || 0;
          const quantite = parseInt(med.QUANTITE) || 1;
          return sum + (prix * quantite);
        }, 0)
      };
      
      setOrdonnanceToPrint(ordonnanceData);
      setPrintModalVisible(true);
      
    } catch (error) {
      console.error('❌ Erreur préparation ordonnance:', error);
      message.error('Erreur lors de la préparation de l\'ordonnance');
    } finally {
      setLoading(prev => ({ ...prev, prestations: false }));
    }
  };

  // Rechercher le patient par numéro de carte
  const searchPatient = async (cardNumber) => {
    if (!cardNumber || cardNumber.trim().length < 3) {
      message.warning('Veuillez entrer un numéro de carte valide (min 3 caractères)');
      return;
    }
    
    setLoading(prev => ({ ...prev, patient: true }));
    try {
      console.log('🔍 Recherche patient par carte:', cardNumber);
      
      let patientData = null;
      
      try {
        const response = await consultationsAPI.searchByCard(cardNumber);
        console.log('📊 Réponse searchByCard:', response);
        
        if (response.success && Array.isArray(response.patients) && response.patients.length > 0) {
          patientData = response.patients[0];
        } else if (Array.isArray(response) && response.length > 0) {
          patientData = response[0];
        }
      } catch (error1) {
        console.warn('⚠️ searchByCard a échoué:', error1.message);
        
        try {
          const response = await beneficiairesAPI.searchAdvanced(cardNumber, {}, 1);
          console.log('📊 Réponse searchAdvanced:', response);
          
          if (response.success && Array.isArray(response.beneficiaires) && response.beneficiaires.length > 0) {
            patientData = response.beneficiaires[0];
          }
        } catch (error2) {
          console.warn('⚠️ searchAdvanced a échoué:', error2.message);
        }
      }
      
      if (patientData) {
        console.log('✅ Patient trouvé:', patientData);
        
        const formattedPatient = {
          id: patientData.ID_BEN || patientData.COD_BEN || patientData.id,
          COD_BEN: patientData.ID_BEN || patientData.COD_BEN || patientData.id,
          nom: patientData.NOM_BEN || patientData.nom || patientData.NOM,
          prenom: patientData.PRE_BEN || patientData.prenom || patientData.PRENOM,
          nom_complet: `${patientData.PRE_BEN || patientData.prenom || ''} ${patientData.NOM_BEN || patientData.nom || ''}`.trim(),
          identifiant_national: patientData.IDENTIFIANT_NATIONAL || patientData.identifiant_national,
          numero_carte: patientData.NUMERO_CARTE || patientData.numero_carte || cardNumber,
          date_naissance: patientData.NAI_BEN || patientData.date_naissance,
          age: patientData.AGE || calculateAge(patientData.NAI_BEN || patientData.date_naissance),
          sexe: patientData.SEX_BEN || patientData.sexe,
          telephone: patientData.TELEPHONE || patientData.telephone || patientData.TELEPHONE_MOBILE,
          groupe_sanguin: patientData.GROUPE_SANGUIN || patientData.groupe_sanguin,
          rhesus: patientData.RHESUS || patientData.rhesus
        };
        
        setPatient(formattedPatient);
        
        prescriptionForm.setFieldsValue({
          COD_BEN: formattedPatient.COD_BEN,
          NOM_BEN: formattedPatient.nom_complet,
          IDENTIFIANT_NATIONAL: formattedPatient.identifiant_national
        });
        
        if (formattedPatient.id) {
          await checkConsultationRecente(formattedPatient.id);
        }
        
        message.success(`Patient trouvé: ${formattedPatient.nom_complet}`);
      } else {
        message.warning('Aucun patient trouvé avec ce numéro de carte');
        setPatient(null);
        setMedecinConsultation(null);
        setShowMedecinChangeAlert(false);
      }
    } catch (error) {
      console.error('❌ Erreur recherche patient:', error);
      message.error('Erreur lors de la recherche du patient');
      setPatient(null);
      setMedecinConsultation(null);
      setShowMedecinChangeAlert(false);
    } finally {
      setLoading(prev => ({ ...prev, patient: false }));
    }
  };

  // Vérifier si le patient a une consultation récente et récupérer le médecin
  const checkConsultationRecente = async (patientId) => {
    try {
      setLoading(prev => ({ ...prev, consultations: true }));
      const response = await consultationsAPI.getByPatientId(patientId);
      
      if (response.success && Array.isArray(response.consultations) && response.consultations.length > 0) {
        const sortedConsultations = response.consultations.sort((a, b) => 
          new Date(b.DATE_CONSULTATION || b.date_consultation) - new Date(a.DATE_CONSULTATION || a.date_consultation)
        );
        
        const derniereConsultation = sortedConsultations[0];
        const nomMedecin = derniereConsultation.NOM_MEDECIN || derniereConsultation.nom_medecin || derniereConsultation.medecin;
        
        // Récupérer le nom du centre depuis la consultation
        if (derniereConsultation.COD_CEN) {
          const centreNom = await getCentreNameFromConsultation(derniereConsultation);
          if (centreNom) {
            setCentreNom(centreNom);
          }
        }
        
        if (nomMedecin) {
          const medecinConsultationObj = {
            nom: nomMedecin,
            date_consultation: derniereConsultation.DATE_CONSULTATION || derniereConsultation.date_consultation,
            type_consultation: derniereConsultation.TYPE_CONSULTATION || derniereConsultation.type_consultation
          };
          
          setMedecinConsultation(medecinConsultationObj);
          
          if (prestataires.length > 0) {
            const medecinTrouve = prestataires.find(p => 
              p.nom_complet && p.nom_complet.toLowerCase().includes(nomMedecin.toLowerCase()) ||
              (p.nom && p.nom.toLowerCase().includes(nomMedecin.toLowerCase()))
            );
            
            if (medecinTrouve) {
              selectPrestataire(medecinTrouve, true);
              message.info(`Médecin de la consultation automatiquement sélectionné: ${medecinTrouve.nom_complet}`);
            } else {
              message.warning(`Le médecin de la consultation (${nomMedecin}) n'est pas dans la liste des médecins du centre. Veuillez en sélectionner un manuellement.`);
            }
          }
        }
        
        setConsultationInfo({
          date: derniereConsultation.DATE_CONSULTATION || derniereConsultation.date_consultation,
          type: derniereConsultation.TYPE_CONSULTATION || derniereConsultation.type_consultation,
          medecin: nomMedecin,
          montant: derniereConsultation.MONTANT_CONSULTATION || derniereConsultation.montant
        });
      } else {
        setConsultationInfo(null);
        setMedecinConsultation(null);
      }
    } catch (error) {
      console.error('❌ Erreur vérification consultation:', error);
      setConsultationInfo(null);
      setMedecinConsultation(null);
    } finally {
      setLoading(prev => ({ ...prev, consultations: false }));
    }
  };

  // Rechercher des médicaments
  const searchMedicaments = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    setLoading(prev => ({ ...prev, medicaments: true }));
    try {
      const response = await prescriptionsAPI.searchMedicalItems(searchTerm);
      
      if (response.success && Array.isArray(response.items)) {
        setSearchResults(response.items);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('❌ Erreur recherche médicaments:', error);
      message.error('Erreur lors de la recherche des médicaments');
      setSearchResults([]);
    } finally {
      setLoading(prev => ({ ...prev, medicaments: false }));
    }
  };

  // Rechercher une affection par code
  const searchAffection = async (code) => {
    if (!code || code.trim().length === 0) return;
    
    try {
      if (code.length >= 3) {
        setAffectionDetails({
          code: code,
          libelle: 'Affection diagnostiquée',
          categorie: 'Maladie',
          gravite: 'Moyenne',
          remboursable: true
        });
      } else {
        setAffectionDetails(null);
      }
    } catch (error) {
      console.error('❌ Erreur recherche affection:', error);
    }
  };

  // ==================== GESTION DES PRESCRIPTIONS ====================

  // Ajouter un médicament à la prescription
  const ajouterMedicament = (medicament) => {
    if (!medicament) return;
    
    const medicamentExistant = selectedMedicaments.find(m => m.COD_MED === medicament.COD_MED);
    
    if (medicamentExistant) {
      const updatedMedicaments = selectedMedicaments.map(m => 
        m.COD_MED === medicament.COD_MED 
          ? { ...m, QUANTITE: (parseInt(m.QUANTITE) || 1) + 1 }
          : m
      );
      setSelectedMedicaments(updatedMedicaments);
      message.info(`${medicament.libelle || medicament.NOM_COMMERCIAL} - Quantité augmentée`);
    } else {
      const nouveauMedicament = {
        ...medicament,
        QUANTITE: 1,
        POSOLOGIE: '1 comprimé matin et soir',
        DUREE: '7',
        TYPE_ELEMENT: 'MEDICAMENT',
        COD_ELEMENT: medicament.COD_MED || medicament.id || `MED${Date.now()}`,
        COD_MED: medicament.COD_MED || medicament.id || `MED${Date.now()}`,
        LIBELLE: medicament.libelle || medicament.NOM_COMMERCIAL || 'Médicament non spécifié',
        PRIX_UNITAIRE: medicament.PRIX_UNITAIRE || medicament.prix || 0,
        REMBOURSABLE: medicament.REMBOURSABLE || 0,
        key: `${medicament.COD_MED || medicament.id || `MED${Date.now()}`}_${Date.now()}_${Math.random()}`
      };
      
      setSelectedMedicaments([...selectedMedicaments, nouveauMedicament]);
      message.success(`${nouveauMedicament.LIBELLE} ajouté à la prescription`);
    }
    
    setSearchMedicament('');
    setSearchResults([]);
  };

  // Supprimer un médicament de la prescription
  const supprimerMedicament = (key) => {
    const medicament = selectedMedicaments.find(m => m.key === key);
    if (medicament) {
      setSelectedMedicaments(selectedMedicaments.filter(m => m.key !== key));
      message.warning(`${medicament.LIBELLE} retiré de la prescription`);
    }
  };

  // Mettre à jour les détails d'un médicament
  const updateMedicament = (key, field, value) => {
    setSelectedMedicaments(prev => 
      prev.map(med => 
        med.key === key ? { ...med, [field]: value } : med
      )
    );
  };

  // Calculer le total de la prescription
  const calculerTotal = () => {
    return selectedMedicaments.reduce((total, med) => {
      const prix = parseFloat(med.PRIX_UNITAIRE) || 0;
      const quantite = parseInt(med.QUANTITE) || 1;
      return total + (prix * quantite);
    }, 0);
  };

  // Valider et créer la prescription
  const validerPrescription = async () => {
    try {
      if (!patient) {
        message.error('Veuillez d\'abord rechercher un patient');
        return;
      }
      
      if (!selectedPrestataire) {
        message.error('Veuillez sélectionner un médecin prescripteur');
        return;
      }
      
      if (selectedMedicaments.length === 0) {
        message.error('Veuillez ajouter au moins un médicament ou acte');
        return;
      }
      
      if (!affectionCode) {
        message.error('Le code affectation est obligatoire');
        return;
      }
      
      setValidationModalVisible(true);
    } catch (error) {
      console.error('❌ Erreur validation:', error);
      message.error('Erreur lors de la validation');
    }
  };

  // Confirmer la création de la prescription
  const confirmerPrescription = async () => {
    setLoading(prev => ({ ...prev, prescrire: true }));
    
    try {
      // Générer un numéro de prescription
      const prescriptionNum = generatePrescriptionNumber();
      
      const rawData = {
        COD_BEN: patient.COD_BEN,
        COD_PRESCRIPTEUR: selectedPrestataire.id,
        NOM_MEDECIN: selectedPrestataire.nom_complet,
        TYPE_PRESTATION: typePrestation,
        COD_AFF: affectionCode,
        ORIGINE: 'Electronique',
        STATUT: 'En attente',
        DATE_VALIDITE: moment().add(30, 'days').format('YYYY-MM-DD'),
        COD_CEN: centreId,
        NUMERO_PRESCRIPTION: prescriptionNum,
        details: selectedMedicaments
      };
      
      const prescriptionData = cleanPrescriptionData(rawData);
      
      console.log('📤 Données de prescription envoyées:', JSON.stringify(prescriptionData, null, 2));
      
      const response = await prescriptionsAPI.create(prescriptionData);
      
      console.log('📥 Réponse création prescription:', response);
      
      if (response.success) {
        const numeroPrescription = response.data?.numero || response.prescriptionId || response.id || prescriptionNum;
        message.success(`Prescription créée avec succès! Numéro: ${numeroPrescription}`);
        
        // Préparer les données pour l'ordonnance
        const ordonnanceData = {
          numero: numeroPrescription,
          patient,
          selectedPrestataire,
          selectedMedicaments,
          centreId,
          centres,
          typePrestation,
          affectionCode,
          urgent: false,
          dateValidite: moment().add(30, 'days').format('DD/MM/YYYY'),
          statut: 'Validée',
          nombreActes: selectedMedicaments.length,
          total: calculerTotal()
        };
        
        setOrdonnanceToPrint(ordonnanceData);
        resetPrescriptionForm();
        setPrintModalVisible(true);
      } else {
        message.error(response.message || 'Erreur lors de la création de la prescription');
      }
    } catch (error) {
      console.error('❌ Erreur création prescription:', error);
      
      if (error.response?.data?.message) {
        message.error(`Erreur: ${error.response.data.message}`);
      } else if (error.message.includes('COD_ELEMENT')) {
        message.error('Erreur: Le code élément des médicaments est invalide. Veuillez vérifier les données.');
      } else {
        message.error('Erreur lors de la création de la prescription');
      }
    } finally {
      setLoading(prev => ({ ...prev, prescrire: false }));
      setValidationModalVisible(false);
    }
  };

  // Réinitialiser le formulaire de prescription
  const resetPrescriptionForm = () => {
    setPatient(null);
    setSelectedMedicaments([]);
    setAffectionCode('');
    setAffectionDetails(null);
    setConsultationInfo(null);
    setMedecinConsultation(null);
    setShowMedecinChangeAlert(false);
    setCentreNom('');
    prescriptionForm.resetFields();
  };

  // ==================== EXÉCUTION DE PRESCRIPTION ====================

  // Rechercher une prescription par numéro
  const searchPrescription = async () => {
    if (!prescriptionNumero || prescriptionNumero.trim().length === 0) {
      message.warning('Veuillez entrer un numéro de prescription');
      return;
    }
    
    setLoading(prev => ({ ...prev, execution: true }));
    try {
      console.log('🔍 Recherche prescription:', prescriptionNumero);
      
      const response = await prescriptionsAPI.getByNumeroOrId(prescriptionNumero);
      
      if (response.success && response.prescription) {
        const prescription = response.prescription;
        console.log('✅ Prescription trouvée:', prescription);
        
        setSelectedPrescription(prescription);
        setPrescriptionDetails(prescription);
        
        const details = prescription.details || [];
        const initialActes = details.map((detail, index) => ({
          ...detail,
          execute: false,
          quantite_executee: detail.QUANTITE || 1,
          prix_execute: detail.PRIX_UNITAIRE || 0,
          key: detail.id || `${detail.COD_ELEMENT}_${index}_${Math.random()}`
        }));
        
        setActesExecutes(initialActes);
        calculerTotalExecution();
        
        message.success(`Prescription trouvée - Patient: ${prescription.NOM_BEN || 'Inconnu'} - ${details.length} actes`);
      } else {
        message.error(response.message || 'Prescription non trouvée');
        setSelectedPrescription(null);
        setPrescriptionDetails(null);
        setActesExecutes([]);
      }
    } catch (error) {
      console.error('❌ Erreur recherche prescription:', error);
      message.error('Erreur lors de la recherche de la prescription');
      setSelectedPrescription(null);
      setPrescriptionDetails(null);
      setActesExecutes([]);
    } finally {
      setLoading(prev => ({ ...prev, execution: false }));
    }
  };

  // Gérer l'exécution d'un acte
  const toggleActeExecution = (key, execute) => {
    setActesExecutes(prev => 
      prev.map(acte => 
        acte.key === key ? { ...acte, execute } : acte
      )
    );
  };

  // Mettre à jour les détails d'exécution d'un acte
  const updateActeExecution = (key, field, value) => {
    setActesExecutes(prev => 
      prev.map(acte => 
        acte.key === key ? { ...acte, [field]: value } : acte
      )
    );
    
    setTimeout(() => calculerTotalExecution(), 0);
  };

  // Calculer le total de la facture d'exécution
  const calculerTotalExecution = () => {
    const total = actesExecutes.reduce((sum, acte) => {
      if (acte.execute) {
        const quantite = parseInt(acte.quantite_executee) || 0;
        const prix = parseFloat(acte.prix_execute) || 0;
        return sum + (quantite * prix);
      }
      return sum;
    }, 0);
    
    setTotalFacture(total);
    return total;
  };

  // Valider l'exécution de la prescription
  const validerExecution = async () => {
    try {
      if (!selectedPrescription) {
        message.error('Aucune prescription sélectionnée');
        return;
      }
      
      if (!selectedPrestataire) {
        message.error('Veuillez sélectionner un médecin exécutant');
        return;
      }
      
      const actesAExecuter = actesExecutes.filter(acte => acte.execute);
      if (actesAExecuter.length === 0) {
        message.error('Veuillez sélectionner au moins un acte à exécuter');
        return;
      }
      
      setLoading(prev => ({ ...prev, execution: true }));
      
      const executionData = {
        prescriptionId: selectedPrescription.COD_PRES || selectedPrescription.id,
        prestataire_id: selectedPrestataire.id,
        prestataire_nom: selectedPrestataire.nom_complet,
        actes: actesAExecuter.map(acte => ({
          COD_ELEMENT: acte.COD_ELEMENT,
          LIBELLE: acte.LIBELLE,
          QUANTITE: acte.quantite_executee,
          PRIX_UNITAIRE: acte.prix_execute,
          REMBOURSABLE: acte.REMBOURSABLE
        })),
        total: totalFacture,
        date_execution: moment().format('YYYY-MM-DD HH:mm:ss'),
        centre_id: centreId
      };
      
      console.log('📤 Données d\'exécution:', executionData);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Exécution enregistrée avec succès!');
      setModalVisible(true);
      
    } catch (error) {
      console.error('❌ Erreur exécution:', error);
      message.error('Erreur lors de l\'exécution de la prescription');
    } finally {
      setLoading(prev => ({ ...prev, execution: false }));
    }
  };

  // ==================== COLONNES DES TABLES ====================

  const medicamentsColumns = [
    {
      title: 'Médicament/Acte',
      dataIndex: 'libelle',
      key: 'libelle',
      render: (text, record) => (
        <div>
          <div><strong>{text || record.NOM_COMMERCIAL || 'Non spécifié'}</strong></div>
          {record.NOM_GENERIQUE && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Générique: {record.NOM_GENERIQUE}
            </div>
          )}
          {record.FORME_PHARMACEUTIQUE && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Forme: {record.FORME_PHARMACEUTIQUE} {record.DOSAGE ? `- ${record.DOSAGE}` : ''}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Prix unitaire',
      dataIndex: 'PRIX_UNITAIRE',
      key: 'PRIX_UNITAIRE',
      align: 'right',
      render: (prix) => (
        <span style={{ fontWeight: 'bold' }}>
          {parseFloat(prix || 0).toLocaleString('fr-FR')} XAF
        </span>
      )
    },
    {
      title: 'Remboursable',
      dataIndex: 'REMBOURSABLE',
      key: 'REMBOURSABLE',
      align: 'center',
      render: (remboursable) => (
        <Tag color={remboursable ? 'green' : 'red'}>
          {remboursable ? 'OUI' : 'NON'}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => ajouterMedicament(record)}
        >
          Ajouter
        </Button>
      )
    }
  ];

  const prescriptionMedicamentsColumns = [
    {
      title: 'Désignation',
      dataIndex: 'LIBELLE',
      key: 'LIBELLE',
      width: 200
    },
    {
      title: 'Posologie',
      dataIndex: 'POSOLOGIE',
      key: 'POSOLOGIE',
      width: 150,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updateMedicament(record.key, 'POSOLOGIE', e.target.value)}
          placeholder="Ex: 1 comprimé matin et soir"
        />
      )
    },
    {
      title: 'Durée',
      dataIndex: 'DUREE',
      key: 'DUREE',
      width: 100,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updateMedicament(record.key, 'DUREE', e.target.value)}
          placeholder="Ex: 7 jours"
        />
      )
    },
    {
      title: 'Quantité',
      dataIndex: 'QUANTITE',
      key: 'QUANTITE',
      width: 100,
      render: (text, record) => (
        <InputNumber
          min={1}
          max={99}
          value={text}
          onChange={(value) => updateMedicament(record.key, 'QUANTITE', value)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Prix unitaire',
      dataIndex: 'PRIX_UNITAIRE',
      key: 'PRIX_UNITAIRE',
      width: 120,
      render: (prix) => `${parseFloat(prix || 0).toLocaleString('fr-FR')} XAF`
    },
    {
      title: 'Total',
      key: 'total',
      width: 120,
      render: (_, record) => {
        const prix = parseFloat(record.PRIX_UNITAIRE) || 0;
        const quantite = parseInt(record.QUANTITE) || 1;
        return (
          <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
            {(prix * quantite).toLocaleString('fr-FR')} XAF
          </span>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => supprimerMedicament(record.key)}
          size="small"
        />
      )
    }
  ];

  const prestatairesColumns = [
    {
      title: 'Médecin',
      dataIndex: 'nom_complet',
      key: 'nom_complet',
      render: (text, record) => (
        <div>
          <div><strong>{text}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.titre || 'Dr.'} {record.prenom} {record.nom}
          </div>
        </div>
      )
    },
    {
      title: 'Spécialité',
      dataIndex: 'specialite',
      key: 'specialite',
      width: 150,
      render: (specialite) => specialite || 'Non spécifié'
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.telephone || 'Non renseigné'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.email || ''}
          </div>
        </div>
      )
    },
    {
      title: 'Statut',
      key: 'statut',
      width: 100,
      render: (_, record) => (
        <Tag color={record.statut_affectation === 'Actif' ? 'green' : 'orange'}>
          {record.statut_affectation || 'Actif'}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type={selectedPrestataire?.id === record.id ? 'default' : 'primary'}
          size="small"
          onClick={() => selectPrestataire(record)}
          disabled={selectedPrestataire?.id === record.id}
        >
          {selectedPrestataire?.id === record.id ? 'Sélectionné' : 'Sélectionner'}
        </Button>
      )
    }
  ];

  const executionColumns = [
    {
      title: 'Exécuter',
      dataIndex: 'execute',
      key: 'execute',
      width: 80,
      render: (checked, record) => (
        <Checkbox
          checked={checked}
          onChange={(e) => toggleActeExecution(record.key, e.target.checked)}
        />
      )
    },
    {
      title: 'Acte/Médicament',
      dataIndex: 'LIBELLE',
      key: 'LIBELLE',
      width: 200
    },
    {
      title: 'Quantité prescrite',
      dataIndex: 'QUANTITE',
      key: 'QUANTITE',
      width: 120,
      align: 'center'
    },
    {
      title: 'Quantité à exécuter',
      key: 'quantite_executee',
      width: 150,
      render: (_, record) => (
        <InputNumber
          min={1}
          max={record.QUANTITE || 99}
          value={record.quantite_executee}
          onChange={(value) => updateActeExecution(record.key, 'quantite_executee', value)}
          style={{ width: '100%' }}
          disabled={!record.execute}
        />
      )
    },
    {
      title: 'Prix unitaire',
      key: 'prix_execute',
      width: 150,
      render: (_, record) => (
        <InputNumber
          min={0}
          step={100}
          value={record.prix_execute}
          onChange={(value) => updateActeExecution(record.key, 'prix_execute', value)}
          style={{ width: '100%' }}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
          parser={value => value.replace(/\s/g, '')}
          disabled={!record.execute}
        />
      )
    },
    {
      title: 'Sous-total',
      key: 'sous_total',
      width: 120,
      render: (_, record) => {
        if (!record.execute) return '-';
        const quantite = parseInt(record.quantite_executee) || 0;
        const prix = parseFloat(record.prix_execute) || 0;
        return (
          <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
            {(quantite * prix).toLocaleString('fr-FR')} XAF
          </span>
        );
      }
    }
  ];

  // ==================== EFFETS ====================

  useEffect(() => {
    console.log('🏥 Composant Prescriptions monté');
    console.log('📍 Centre ID stocké:', localStorage.getItem('selectedCentre'));
    console.log('📍 Centre ID état:', centreId);
    loadCentres();
  }, [loadCentres]);

  useEffect(() => {
    console.log('🔄 Centre changé ou prestataires à charger:', centreId);
    if (centreId) {
      loadPrestataires();
    }
  }, [centreId, loadPrestataires]);

  useEffect(() => {
    if (activeTab === 'historique' && selectedPrestataire) {
      loadMesPrescriptions();
    }
  }, [activeTab, selectedPrestataire, loadMesPrescriptions]);

  useEffect(() => {
    if (affectionCode) {
      searchAffection(affectionCode);
    } else {
      setAffectionDetails(null);
    }
  }, [affectionCode]);

  // Effet pour mettre à jour le nom du centre
  useEffect(() => {
    if (centreId && centres.length > 0) {
      const centre = centres.find(c => c.id === centreId || c.cod_cen === centreId);
      if (centre) {
        setCentreNom(centre.nom || centre.NOM_CENTRE || `Centre ${centreId}`);
      }
    }
  }, [centreId, centres]);

  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MedicineBoxOutlined style={{ marginRight: 8, fontSize: '20px', color: '#1890ff' }} />
            <span>Gestion des Prescriptions Médicales</span>
          </div>
        }
        extra={
          <Space>
            <Select
              value={centreId}
              onChange={(value) => {
                console.log('🏥 Centre changé:', value);
                setCentreId(value);
                localStorage.setItem('selectedCentre', value);
                loadPrestataires();
              }}
              style={{ width: 200 }}
              placeholder="Sélectionner un centre"
              loading={centres.length === 0}
            >
              {centres.map(centre => (
                <Option key={centre.id || centre.cod_cen} value={centre.id || centre.cod_cen}>
                  {centre.nom || centre.NOM_CENTRE || `Centre ${centre.id || centre.cod_cen}`}
                </Option>
              ))}
            </Select>
            
            <Button
              icon={<SyncOutlined />}
              onClick={() => loadPrestataires()}
              loading={loading.prestataires}
              style={{ marginLeft: 8 }}
              title="Rafraîchir la liste des médecins"
            />
            
            <Button
              type={selectedPrestataire ? 'default' : 'primary'}
              icon={<TeamOutlined />}
              onClick={() => setModalPrestataires(true)}
              loading={loading.prestataires}
            >
              {selectedPrestataire ? 
                `Dr. ${selectedPrestataire.nom_complet.split(' ')[0]}` : 
                'Choisir médecin'}
            </Button>
          </Space>
        }
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          animated
        >
          {/* TAB 1: SAISIE DE PRESCRIPTION */}
          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                Saisie de Prescription
              </span>
            } 
            key="saisie"
          >
            <Form
              form={prescriptionForm}
              layout="vertical"
              onFinish={validerPrescription}
            >
              {/* ALERTE CHANGEMENT DE MÉDECIN */}
              {showMedecinChangeAlert && medecinConsultation && selectedPrestataire && (
                <Alert
                  message="Attention: Changement de médecin"
                  description={
                    <div>
                      <div>Vous avez changé de médecin prescripteur.</div>
                      <div style={{ marginTop: 8 }}>
                        <strong>Médecin de la consultation:</strong> {medecinConsultation.nom}
                      </div>
                      <div>
                        <strong>Médecin sélectionné:</strong> {selectedPrestataire.nom_complet}
                      </div>
                    </div>
                  }
                  type="warning"
                  showIcon
                  action={
                    <Space>
                      <Button 
                        size="small" 
                        type="primary"
                        icon={<SwapOutlined />}
                        onClick={() => {
                          if (prestataires.length > 0) {
                            const medecinConsultationTrouve = prestataires.find(p => 
                              p.nom_complet && p.nom_complet.toLowerCase().includes(medecinConsultation.nom.toLowerCase())
                            );
                            if (medecinConsultationTrouve) {
                              selectPrestataire(medecinConsultationTrouve, true);
                              setShowMedecinChangeAlert(false);
                            }
                          }
                        }}
                      >
                        Revenir au médecin de la consultation
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => setShowMedecinChangeAlert(false)}
                      >
                        Garder ce médecin
                      </Button>
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                />
              )}

              {/* SECTION PRESTATAIRE */}
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <TeamOutlined style={{ marginRight: 8 }} />
                    <span>Médecin Prescripteur</span>
                    {medecinConsultation && selectedPrestataire && selectedPrestataire.nom_complet.includes(medecinConsultation.nom) && (
                      <Tag color="green" style={{ marginLeft: 8 }}>
                        <UserSwitchOutlined /> Médecin de la consultation
                      </Tag>
                    )}
                  </div>
                }
                style={{ marginBottom: 16 }}
                size="small"
              >
                {selectedPrestataire ? (
                  <Alert
                    message={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>Médecin sélectionné:</strong> {selectedPrestataire.nom_complet}
                          {medecinConsultation && selectedPrestataire.nom_complet.includes(medecinConsultation.nom) && (
                            <Tag color="green" style={{ marginLeft: 8 }}>
                              Médecin de la consultation
                            </Tag>
                          )}
                        </div>
                        <div>
                          <Button 
                            size="small" 
                            icon={<TeamOutlined />}
                            onClick={() => setModalPrestataires(true)}
                          >
                            Changer
                          </Button>
                        </div>
                      </div>
                    }
                    description={
                      <Descriptions size="small" column={2}>
                        <Descriptions.Item label="Spécialité">
                          {selectedPrestataire.specialite}
                        </Descriptions.Item>
                        <Descriptions.Item label="Contact">
                          {selectedPrestataire.telephone || 'Non renseigné'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Centre">
                          {centreNom || `Centre ${centreId}`}
                        </Descriptions.Item>
                        <Descriptions.Item label="Statut">
                          <Tag color={selectedPrestataire.statut_affectation === 'Actif' ? 'green' : 'orange'}>
                            {selectedPrestataire.statut_affectation || 'Actif'}
                          </Tag>
                        </Descriptions.Item>
                      </Descriptions>
                    }
                    type="info"
                    showIcon
                  />
                ) : (
                  <Alert
                    message="Aucun médecin sélectionné"
                    description="Veuillez sélectionner un médecin prescripteur pour continuer"
                    type="warning"
                    showIcon
                    action={
                      <Button 
                        type="primary" 
                        size="small" 
                        icon={<TeamOutlined />}
                        onClick={() => setModalPrestataires(true)}
                      >
                        Sélectionner un médecin
                      </Button>
                    }
                  />
                )}
              </Card>

              {/* ÉTAPE 1: INFORMATION PATIENT */}
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <UserOutlined style={{ marginRight: 8 }} />
                    <span>Étape 1: Identification du Patient</span>
                  </div>
                }
                style={{ marginBottom: 16 }}
                size="small"
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Numéro de carte du patient"
                      required
                    >
                      <Input.Search
                        placeholder="Entrez le numéro de la carte d'assurance"
                        enterButton={<SearchOutlined />}
                        size="large"
                        onSearch={searchPatient}
                        loading={loading.patient}
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Type de prestation"
                      required
                      initialValue="PHARMACIE"
                    >
                      <Select
                        value={typePrestation}
                        onChange={setTypePrestation}
                        size="large"
                      >
                        <Option value="PHARMACIE">Pharmacie</Option>
                        <Option value="BIOLOGIE">Biologie</Option>
                        <Option value="IMAGERIE">Imagerie Médicale</Option>
                        <Option value="HOSPITALISATION">Hospitalisation</Option>
                        <Option value="CONSULTATION">Consultation Spécialisée</Option>
                        <Option value="KINESITHERAPIE">Kinésithérapie</Option>
                        <Option value="INFIRMIER">Soins infirmiers</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {patient && (
                  <Alert
                    message="Informations du Patient"
                    description={
                      <Descriptions size="small" column={3}>
                        <Descriptions.Item label="Nom">
                          <strong>{patient.nom_complet}</strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="Identifiant National">
                          {patient.identifiant_national || 'Non renseigné'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Âge/Sexe">
                          {patient.age || 'N/A'} ans / {patient.sexe || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Groupe Sanguin">
                          {patient.groupe_sanguin || 'Non renseigné'} {patient.rhesus || ''}
                        </Descriptions.Item>
                        <Descriptions.Item label="Téléphone">
                          {patient.telephone || 'Non renseigné'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Numéro Carte">
                          {patient.numero_carte || 'Non renseigné'}
                        </Descriptions.Item>
                      </Descriptions>
                    }
                    type="success"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                {consultationInfo && (
                  <Alert
                    message="Dernière consultation"
                    description={
                      <div>
                        <div><strong>Date:</strong> {moment(consultationInfo.date).format('DD/MM/YYYY HH:mm')}</div>
                        <div><strong>Type:</strong> {consultationInfo.type}</div>
                        <div><strong>Médecin:</strong> {consultationInfo.medecin}</div>
                        <div><strong>Montant:</strong> {consultationInfo.montant?.toLocaleString('fr-FR')} XAF</div>
                        {medecinConsultation && (
                          <div style={{ marginTop: 8 }}>
                            <Tag color="blue">
                              <UserSwitchOutlined /> Ce médecin a été automatiquement sélectionné
                            </Tag>
                          </div>
                        )}
                      </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
              </Card>

              {/* ÉTAPE 2: CODE AFFECTATION */}
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <InfoCircleOutlined style={{ marginRight: 8 }} />
                    <span>Étape 2: Code Affectation</span>
                  </div>
                }
                style={{ marginBottom: 16 }}
                size="small"
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Code Affectation (Obligatoire)"
                      required
                      rules={[{ required: true, message: 'Le code affectation est obligatoire' }]}
                    >
                      <Input
                        placeholder="Entrez le code d'affection (ex: J00, A01, etc.)"
                        value={affectionCode}
                        onChange={(e) => setAffectionCode(e.target.value.toUpperCase())}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    {affectionDetails && (
                      <Alert
                        message={`Affection: ${affectionDetails.libelle}`}
                        description={
                          <div>
                            <div><strong>Catégorie:</strong> {affectionDetails.categorie}</div>
                            <div><strong>Gravité:</strong> {affectionDetails.gravite}</div>
                            <div><strong>Remboursable:</strong> {affectionDetails.remboursable ? 'Oui' : 'Non'}</div>
                          </div>
                        }
                        type="info"
                        showIcon
                      />
                    )}
                  </Col>
                </Row>
              </Card>

              {/* ÉTAPE 3: AJOUT DES MÉDICAMENTS */}
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <MedicineBoxOutlined style={{ marginRight: 8 }} />
                    <span>Étape 3: Prescription Médicale</span>
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {selectedMedicaments.length} acte(s)
                    </Tag>
                    <Tag color={saisieManuelleMode ? "orange" : "blue"} style={{ marginLeft: 8 }}>
                      {saisieManuelleMode ? "Mode Saisie Manuelle" : "Mode Recherche"}
                    </Tag>
                  </div>
                }
                style={{ marginBottom: 16 }}
                size="small"
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          {saisieManuelleMode ? "Saisie manuelle d'acte" : "Recherche de médicaments ou actes"}
                        </span>
                        <Button
                          type="dashed"
                          size="small"
                          icon={saisieManuelleMode ? <SearchOutlined /> : <FileTextOutlined />}
                          onClick={toggleSaisieManuelleMode}
                        >
                          {saisieManuelleMode ? "Passer en mode recherche" : "Saisir manuellement"}
                        </Button>
                      </div>
                    }>
                      {saisieManuelleMode ? (
                        <Form
                          form={formSaisieManuelle}
                          layout="vertical"
                          onFinish={ajouterActeManuel}
                        >
                          <Row gutter={8}>
                            <Col span={12}>
                              <Form.Item
                                label="Libellé de l'acte"
                                rules={[{ required: true, message: 'Le libellé est obligatoire' }]}
                              >
                                <Input
                                  placeholder="Ex: Consultation spécialisée, Radio pulmonaire..."
                                  value={acteManuel.LIBELLE}
                                  onChange={(e) => setActeManuel({...acteManuel, LIBELLE: e.target.value})}
                                  size="large"
                                />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item label="Quantité">
                                <InputNumber
                                  min={1}
                                  max={999}
                                  value={acteManuel.QUANTITE}
                                  onChange={(value) => setActeManuel({...acteManuel, QUANTITE: value})}
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item label="Unité">
                                <Select
                                  value={acteManuel.UNITE}
                                  onChange={(value) => setActeManuel({...acteManuel, UNITE: value})}
                                  style={{ width: '100%' }}
                                >
                                  <Option value="boîte(s)">boîte(s)</Option>
                                  <Option value="flacon(s)">flacon(s)</Option>
                                  <Option value="ampoule(s)">ampoule(s)</Option>
                                  <Option value="comprimé(s)">comprimé(s)</Option>
                                  <Option value="sachet(s)">sachet(s)</Option>
                                  <Option value="unité(s)">unité(s)</Option>
                                  <Option value="séance(s)">séance(s)</Option>
                                  <Option value="examen(s)">examen(s)</Option>
                                  <Option value="acte(s)">acte(s)</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={8}>
                            <Col span={12}>
                              <Form.Item label="Posologie">
                                <Input
                                  placeholder="Ex: 1 comprimé matin et soir"
                                  value={acteManuel.POSOLOGIE}
                                  onChange={(e) => setActeManuel({...acteManuel, POSOLOGIE: e.target.value})}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item label="Durée (jours)">
                                <InputNumber
                                  min={1}
                                  max={365}
                                  value={acteManuel.DUREE}
                                  onChange={(value) => setActeManuel({...acteManuel, DUREE: value})}
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item label="Prix unitaire (FCFA)">
                                <InputNumber
                                  min={0}
                                  step={100}
                                  value={acteManuel.PRIX_UNITAIRE}
                                  onChange={(value) => setActeManuel({...acteManuel, PRIX_UNITAIRE: value})}
                                  style={{ width: '100%' }}
                                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                                  parser={value => value.replace(/\s/g, '')}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row>
                            <Col span={24} style={{ textAlign: 'right' }}>
                              <Space>
                                <Button onClick={() => {
                                  setActeManuel({
                                    LIBELLE: '',
                                    QUANTITE: 1,
                                    POSOLOGIE: 'À déterminer',
                                    DUREE: '7',
                                    PRIX_UNITAIRE: 0,
                                    TYPE_ELEMENT: 'MEDICAMENT',
                                    UNITE: 'boîte(s)'
                                  });
                                  formSaisieManuelle.resetFields();
                                }}>
                                  Réinitialiser
                                </Button>
                                <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                                  Ajouter cet acte
                                </Button>
                              </Space>
                            </Col>
                          </Row>
                        </Form>
                      ) : (
                        <Input.Search
                          placeholder="Recherchez un médicament par nom commercial, générique ou code"
                          enterButton={<SearchOutlined />}
                          size="large"
                          value={searchMedicament}
                          onChange={(e) => {
                            setSearchMedicament(e.target.value);
                            searchMedicaments(e.target.value);
                          }}
                          loading={loading.medicaments}
                          style={{ marginBottom: 16 }}
                        />
                      )}
                    </Form.Item>
                  </Col>
                </Row>

                {!saisieManuelleMode && searchResults.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <Alert
                      message={`${searchResults.length} résultat(s) trouvé(s)`}
                      type="info"
                      showIcon
                      style={{ marginBottom: 8 }}
                    />
                    <Table
                      columns={medicamentsColumns}
                      dataSource={searchResults}
                      pagination={{ pageSize: 5 }}
                      size="small"
                      rowKey="COD_MED"
                    />
                  </div>
                )}

                <Divider orientation="left">
                  <strong>Prescription en cours</strong>
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    {selectedMedicaments.length} acte(s)
                  </Tag>
                  {selectedMedicaments.filter(estActeManuel).length > 0 && (
                    <Tag color="orange" style={{ marginLeft: 8 }}>
                      {selectedMedicaments.filter(estActeManuel).length} manuel(s)
                    </Tag>
                  )}
                </Divider>

                {selectedMedicaments.length > 0 ? (
                  <Table
                    columns={prescriptionMedicamentsColumns}
                    dataSource={selectedMedicaments}
                    pagination={false}
                    size="small"
                    rowClassName={(record) => estActeManuel(record) ? 'acte-manuel-row' : ''}
                    summary={() => (
                      <Table.Summary.Row style={{ background: '#fafafa' }}>
                        <Table.Summary.Cell index={0} colSpan={5} align="right">
                          <div>
                            <strong>Total de la prescription ({selectedMedicaments.length} actes):</strong>
                            {selectedMedicaments.filter(estActeManuel).length > 0 && (
                              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                                dont {selectedMedicaments.filter(estActeManuel).length} acte(s) saisi(s) manuellement
                              </div>
                            )}
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                            {calculerTotal().toLocaleString('fr-FR')} XAF
                          </span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} />
                      </Table.Summary.Row>
                    )}
                  />
                ) : (
                  <Empty
                    description={
                      <div>
                        <div style={{ marginBottom: 8 }}>Aucun médicament ajouté à la prescription</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {saisieManuelleMode ? 
                            "Utilisez le formulaire ci-dessus pour ajouter un acte manuellement" : 
                            "Recherchez des médicaments ou passez en mode saisie manuelle"}
                        </div>
                      </div>
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>

              {/* BOUTONS D'ACTION */}
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Space size="large">
                  <Button
                    size="large"
                    onClick={resetPrescriptionForm}
                    disabled={!patient && selectedMedicaments.length === 0}
                  >
                    <CloseCircleOutlined /> Annuler
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={loading.prescrire}
                    disabled={!patient || !selectedPrestataire || selectedMedicaments.length === 0}
                    icon={<CheckCircleOutlined />}
                  >
                    Terminer la prescription ({selectedMedicaments.length} actes)
                  </Button>
                </Space>
              </div>
            </Form>
          </TabPane>

          {/* TAB 2: EXÉCUTION DE PRESCRIPTION */}
          <TabPane 
            tab={
              <span>
                <CheckCircleOutlined />
                Exécution de Prescription
              </span>
            } 
            key="execution"
          >
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CalculatorOutlined style={{ marginRight: 8 }} />
                  <span>Exécution de Prescription</span>
                </div>
              }
            >
              {/* INFORMATION PRESTATAIRE */}
              {selectedPrestataire ? (
                <Alert
                  message={`Médecin exécutant: ${selectedPrestataire.nom_complet}`}
                  description={`Spécialité: ${selectedPrestataire.specialite} | Centre: ${centreNom || `Centre ${centreId}`}`}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  action={
                    <Button 
                      size="small" 
                      onClick={() => setModalPrestataires(true)}
                    >
                      Changer
                    </Button>
                  }
                />
              ) : (
                <Alert
                  message="Aucun médecin sélectionné"
                  description="Veuillez sélectionner un médecin exécutant pour pouvoir exécuter des prescriptions"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  action={
                    <Button 
                      type="primary" 
                      size="small"
                      onClick={() => setModalPrestataires(true)}
                    >
                      Sélectionner un médecin
                    </Button>
                  }
                />
              )}

              {/* RECHERCHE DE PRESCRIPTION */}
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={18}>
                  <Input.Search
                    placeholder="Entrez le numéro de prescription (ex: PRES-YYMMDD-1234) ou l'ID"
                    enterButton={<SearchOutlined />}
                    size="large"
                    value={prescriptionNumero}
                    onChange={(e) => setPrescriptionNumero(e.target.value)}
                    onSearch={searchPrescription}
                    loading={loading.execution}
                  />
                </Col>
                <Col span={6}>
                  <Button
                    type="dashed"
                    block
                    size="large"
                    icon={<HistoryOutlined />}
                    onClick={() => setActiveTab('historique')}
                  >
                    Voir l'historique
                  </Button>
                </Col>
              </Row>

              {selectedPrescription && (
                <>
                  {/* INFORMATIONS DE LA PRESCRIPTION */}
                  <Card
                    title="Détails de la prescription"
                    size="small"
                    style={{ marginBottom: 24 }}
                    extra={
                      <Space>
                        <Tag color={
                          selectedPrescription.STATUT === 'Validée' ? 'green' :
                          selectedPrescription.STATUT === 'En attente' ? 'orange' :
                          selectedPrescription.STATUT === 'Exécutée' ? 'blue' : 'default'
                        }>
                          {selectedPrescription.STATUT}
                        </Tag>
                        <Tag color="blue">
                          {selectedPrescription.nombreActes || selectedPrescription.details?.length || 0} actes
                        </Tag>
                      </Space>
                    }
                  >
                    <Descriptions bordered column={2} size="small">
                      <Descriptions.Item label="Numéro">
                        <strong>{selectedPrescription.NUMERO_PRESCRIPTION || 'N/A'}</strong>
                      </Descriptions.Item>
                      <Descriptions.Item label="Date prescription">
                        {selectedPrescription.DATE_PRESCRIPTION ? 
                          moment(selectedPrescription.DATE_PRESCRIPTION).format('DD/MM/YYYY HH:mm') : 
                          'Non spécifiée'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Patient">
                        {selectedPrescription.NOM_BEN || 'Inconnu'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Médecin prescripteur">
                        {selectedPrescription.NOM_MEDECIN || 'Non spécifié'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Type">
                        {selectedPrescription.TYPE_PRESTATION || 'Non spécifié'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Nombre d'actes">
                        <strong>{selectedPrescription.nombreActes || selectedPrescription.details?.length || 0}</strong>
                      </Descriptions.Item>
                      <Descriptions.Item label="Montant total">
                        <strong>{selectedPrescription.total ? selectedPrescription.total.toLocaleString('fr-FR') : '0'} XAF</strong>
                      </Descriptions.Item>
                      <Descriptions.Item label="Origine">
                        {selectedPrescription.ORIGINE === 'Electronique' ? (
                          <Tag color="blue">Électronique</Tag>
                        ) : (
                          <Tag color="orange">Manuelle</Tag>
                        )}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {/* TABLEAU D'EXÉCUTION */}
                  <Card
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Actes à exécuter ({actesExecutes.filter(a => a.execute).length}/{actesExecutes.length})</span>
                        <div>
                          <Tag color="green" style={{ fontSize: '16px' }}>
                            Total: {totalFacture.toLocaleString('fr-FR')} XAF
                          </Tag>
                        </div>
                      </div>
                    }
                    size="small"
                    style={{ marginBottom: 24 }}
                  >
                    {selectedPrescription.ORIGINE === 'Electronique' ? (
                      <Table
                        columns={executionColumns}
                        dataSource={actesExecutes}
                        pagination={false}
                        size="small"
                        rowKey="key"
                        summary={() => (
                          <Table.Summary.Row style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                            <Table.Summary.Cell index={0} colSpan={5} align="right">
                              TOTAL ({actesExecutes.filter(a => a.execute).length} actes exécutés):
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right">
                              <span style={{ color: '#52c41a', fontSize: '16px' }}>
                                {totalFacture.toLocaleString('fr-FR')} XAF
                              </span>
                            </Table.Summary.Cell>
                          </Table.Summary.Row>
                        )}
                      />
                    ) : (
                      <Alert
                        message="Prescription Manuelle"
                        description="Pour les prescriptions manuelles, veuillez saisir manuellement les actes à facturer."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    )}
                    
                    <div style={{ marginTop: 24, textAlign: 'right' }}>
                      <Button
                        type="primary"
                        size="large"
                        onClick={validerExecution}
                        loading={loading.execution}
                        icon={<CheckCircleOutlined />}
                        disabled={!selectedPrestataire || actesExecutes.filter(a => a.execute).length === 0}
                      >
                        {selectedPrestataire ? 
                          `Valider l'exécution (${actesExecutes.filter(a => a.execute).length} actes)` : 
                          'Sélectionnez un médecin'}
                      </Button>
                    </div>
                  </Card>
                </>
              )}

              {!selectedPrescription && !loading.execution && (
                <Empty
                  description={
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        Entrez un numéro de prescription pour commencer l'exécution
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Exemples: PRES-${moment().format('YYMMDD')}-1234 ou 456
                      </div>
                    </div>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>
          </TabPane>

          {/* TAB 3: HISTORIQUE DES PRESCRIPTIONS */}
          <TabPane 
            tab={
              <span>
                <HistoryOutlined />
                Historique des Prescriptions
                {mesPrescriptions.length > 0 && (
                  <Badge count={mesPrescriptions.length} style={{ marginLeft: 8 }} />
                )}
              </span>
            } 
            key="historique"
          >
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <HistoryOutlined style={{ marginRight: 8 }} />
                  <span>Historique des prescriptions</span>
                  {selectedPrestataire && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      Médecin: {selectedPrestataire.nom_complet}
                    </Tag>
                  )}
                  <Tag color="green" style={{ marginLeft: 8 }}>
                    Total: {mesPrescriptions.reduce((sum, p) => sum + (p.nombreActes || p.details?.length || 0), 0)} actes
                  </Tag>
                </div>
              }
              extra={
                <Space>
                  <Button
                    icon={<SyncOutlined />}
                    onClick={loadMesPrescriptions}
                    loading={loading.prestations}
                  >
                    Actualiser
                  </Button>
                  <Button
                    icon={<TeamOutlined />}
                    onClick={() => setModalPrestataires(true)}
                  >
                    Changer médecin
                  </Button>
                </Space>
              }
            >
              {selectedPrestataire ? (
                mesPrescriptions.length > 0 ? (
                  <List
                    itemLayout="vertical"
                    dataSource={mesPrescriptions}
                    renderItem={(prescription) => (
                      <List.Item
                        key={prescription.COD_PRES || prescription.id}
                        actions={[
                          <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewPrescriptionDetails(prescription)}
                            loading={loading.prestations}
                          >
                            Voir détails
                          </Button>,
                          <Button
                            type="link"
                            icon={<PrinterOutlined />}
                            onClick={() => handlePrintPrescriptionFromHistory(prescription)}
                            loading={loading.prestations}
                          >
                            Imprimer Ordonnance
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              style={{
                                backgroundColor: prescription.STATUT === 'Exécutée' ? '#52c41a' :
                                  prescription.STATUT === 'Validée' ? '#1890ff' :
                                  prescription.STATUT === 'En attente' ? '#faad14' : '#f5222d'
                              }}
                            >
                              {(prescription.TYPE_PRESTATION || 'P').charAt(0)}
                            </Avatar>
                          }
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div>
                                <strong>{prescription.NUMERO_PRESCRIPTION || `PRES-${prescription.COD_PRES || prescription.id}`}</strong>
                                <Tag color="blue" style={{ marginLeft: 8 }}>
                                  {prescription.TYPE_PRESTATION || 'Non spécifié'}
                                </Tag>
                              </div>
                              <div>
                                <Tag color={
                                  prescription.STATUT === 'Exécutée' ? 'success' :
                                    prescription.STATUT === 'Validée' ? 'processing' :
                                    prescription.STATUT === 'En attente' ? 'warning' : 'error'
                                }>
                                  {prescription.STATUT || 'Inconnu'}
                                </Tag>
                              </div>
                            </div>
                          }
                          description={
                            <div>
                              <div>
                                <strong>Patient:</strong> {prescription.NOM_BEN || 'Inconnu'}
                              </div>
                              <div>
                                <strong>Date:</strong> {prescription.DATE_PRESCRIPTION ? 
                                  moment(prescription.DATE_PRESCRIPTION).format('DD/MM/YYYY HH:mm') : 
                                  'Non spécifiée'}
                              </div>
                              <div>
                                <strong>Actes:</strong> 
                                <Tag color="blue" style={{ marginLeft: 8 }}>
                                  {prescription.nombreActes || prescription.details?.length || 0} actes
                                </Tag>
                                {prescription.total && prescription.total > 0 ? (
                                  <span style={{ marginLeft: 8, color: '#52c41a', fontWeight: 'bold' }}>
                                    • Total: {prescription.total.toLocaleString('fr-FR')} XAF
                                  </span>
                                ) : (
                                  <span style={{ marginLeft: 8, color: '#999', fontWeight: 'bold' }}>
                                    • Total: 0 XAF
                                  </span>
                                )}
                              </div>
                              <div>
                                <strong>Prescripteur:</strong> {prescription.NOM_MEDECIN || selectedPrestataire.nom_complet}
                              </div>
                              {prescription.COD_AFF && (
                                <div>
                                  <strong>Affection:</strong> {prescription.COD_AFF}
                                </div>
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty
                    description={
                      <div>
                        <div style={{ marginBottom: 16 }}>
                          Aucune prescription trouvée pour {selectedPrestataire.nom_complet}
                        </div>
                        <Button
                          type="primary"
                          onClick={() => setActiveTab('saisie')}
                        >
                          Créer une nouvelle prescription
                        </Button>
                      </div>
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )
              ) : (
                <Empty
                  description={
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        Veuillez sélectionner un médecin pour voir son historique de prescriptions
                      </div>
                      <Button
                        type="primary"
                        onClick={() => setModalPrestataires(true)}
                      >
                        Sélectionner un médecin
                      </Button>
                    </div>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* MODAL DE SELECTION DES PRESTATAIRES */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TeamOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <span>Sélection du Médecin</span>
            {medecinConsultation && (
              <Tag color="green" style={{ marginLeft: 8 }}>
                Médecin de consultation: {medecinConsultation.nom}
              </Tag>
            )}
          </div>
        }
        open={modalPrestataires}
        onCancel={() => setModalPrestataires(false)}
        width={800}
        footer={null}
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Input.Search
              placeholder="Rechercher un médecin par nom, spécialité ou téléphone"
              enterButton={<SearchOutlined />}
              size="large"
              value={searchPrestataire}
              onChange={(e) => searchPrestataires(e.target.value)}
              loading={loading.prestataires}
            />
          </Col>
        </Row>

        {medecinConsultation && (
          <Alert
            message="Médecin de la dernière consultation"
            description={
              <div>
                <div><strong>Nom:</strong> {medecinConsultation.nom}</div>
                <div><strong>Date consultation:</strong> {moment(medecinConsultation.date_consultation).format('DD/MM/YYYY')}</div>
                <div><strong>Type:</strong> {medecinConsultation.type_consultation}</div>
                <div style={{ marginTop: 8 }}>
                  <Tag color="blue">
                    <UserSwitchOutlined /> Ce médecin a été automatiquement sélectionné
                  </Tag>
                </div>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Alert
          message="Information"
          description={`Sélectionnez le médecin qui va prescrire ou exécuter la prescription. Seuls les médecins affiliés au centre ${centreNom || `Centre ${centreId}`} sont affichés.`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={prestatairesColumns}
          dataSource={searchPrestataireResults}
          pagination={{ pageSize: 5 }}
          size="small"
          rowKey="id"
          loading={loading.prestataires}
          rowClassName={(record) => {
            if (medecinConsultation && record.nom_complet.includes(medecinConsultation.nom)) {
              return 'medecin-consultation-row';
            }
            return '';
          }}
          locale={{
            emptyText: (
              searchPrestataireResults.length === 0 && !loading.prestataires ? (
                <Empty
                  description={
                    <div>
                      <div style={{ marginBottom: 8 }}>Aucun médecin trouvé</div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: 16 }}>
                        {searchPrestataire ? 
                          `Aucun médecin correspondant à "${searchPrestataire}"` : 
                          'Aucun médecin disponible pour ce centre'}
                      </div>
                      <Space>
                        <Button 
                          type="primary" 
                          size="small"
                          onClick={() => {
                            setSearchPrestataire('');
                            loadPrestataires();
                          }}
                        >
                          Voir tous les médecins
                        </Button>
                        <Button 
                          size="small"
                          onClick={() => loadPrestataires()}
                          icon={<SyncOutlined />}
                        >
                          Réessayer
                        </Button>
                      </Space>
                    </div>
                  }
                />
              ) : null
            )
          }}
        />

        <Divider />

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Space>
            <Button
              icon={<SyncOutlined />}
              onClick={() => {
                loadPrestataires(searchPrestataire);
                message.info('Liste des médecins rafraîchie');
              }}
              loading={loading.prestataires}
            >
              Rafraîchir
            </Button>
            <Button
              onClick={() => setModalPrestataires(false)}
            >
              Annuler
            </Button>
            <Button
              type="primary"
              onClick={() => {
                if (selectedPrestataire) {
                  setModalPrestataires(false);
                } else {
                  message.warning('Veuillez sélectionner un médecin');
                }
              }}
            >
              Confirmer la sélection
            </Button>
          </Space>
        </div>
      </Modal>

      {/* MODAL DE VALIDATION */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <WarningOutlined style={{ marginRight: 8, color: '#faad14' }} />
            <span>Confirmation de la prescription</span>
          </div>
        }
        open={validationModalVisible}
        onCancel={() => setValidationModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setValidationModalVisible(false)}>
            Annuler
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={confirmerPrescription}
            loading={loading.prescrire}
            icon={<CheckCircleOutlined />}
          >
            Confirmer la prescription
          </Button>
        ]}
      >
        <Alert
          message="Attention"
          description="Cette action est irréversible. Une fois validée, la prescription ne pourra plus être modifiée."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Patient">
            <strong>{patient?.nom_complet}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Médecin prescripteur">
            {selectedPrestataire?.nom_complet} - {selectedPrestataire?.specialite}
            {medecinConsultation && selectedPrestataire?.nom_complet.includes(medecinConsultation.nom) && (
              <Tag color="green" style={{ marginLeft: 8 }}>
                Médecin de la consultation
              </Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Centre">
            {centreNom || `Centre ${centreId}`}
          </Descriptions.Item>
          <Descriptions.Item label="Type de prestation">
            {typePrestation}
          </Descriptions.Item>
          <Descriptions.Item label="Code affectation">
            {affectionCode}
          </Descriptions.Item>
          <Descriptions.Item label="Nombre d'actes">
            <strong>{selectedMedicaments.length}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Montant total">
            <strong>{calculerTotal().toLocaleString('fr-FR')} XAF</strong>
          </Descriptions.Item>
        </Descriptions>
      </Modal>

      {/* MODAL D'IMPRESSION D'ORDONNANCE */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PrinterOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <span>Impression de l'Ordonnance Médicale</span>
          </div>
        }
        open={printModalVisible}
        onCancel={() => {
          setPrintModalVisible(false);
          setOrdonnanceToPrint(null);
        }}
        width={800}
        footer={[
          <Button key="close" onClick={() => {
            setPrintModalVisible(false);
            setOrdonnanceToPrint(null);
          }}>
            Fermer
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={printingOrdonnance ? <LoadingOutlined /> : <PrinterOutlined />}
            onClick={handlePrintOrdonnance}
            disabled={printingOrdonnance || !ordonnanceToPrint}
          >
            {printingOrdonnance ? 'Impression...' : 'Imprimer l\'ordonnance'}
          </Button>
        ]}
      >
        {ordonnanceToPrint ? (
          <div style={{ padding: '20px', backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
            {/* Filigranes de prévisualisation */}
            <div style={{
              position: 'absolute',
              top: '40%',
              left: '20%',
              transform: 'rotate(-45deg)',
              opacity: 0.1,
              zIndex: 1,
              pointerEvents: 'none',
              fontSize: '60px',
              fontWeight: 'bold',
              color: '#2c5aa0',
              whiteSpace: 'nowrap'
            }}>
              VALIDÉ
            </div>
            <div style={{
              position: 'absolute',
              top: '60%',
              left: '15%',
              transform: 'rotate(-45deg)',
              opacity: 0.1,
              zIndex: 1,
              pointerEvents: 'none',
              fontSize: '40px',
              fontWeight: 'bold',
              color: '#666',
              whiteSpace: 'nowrap'
            }}>
              SYSTÈME AMS
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>
                Ordonnance Médicale
              </h3>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Centre de Santé: {centres.find(c => c.id === centreId || c.cod_cen === centreId)?.nom || 'Centre Médical Principal'}
              </div>
            </div>
            
            <div style={{ textAlign: 'center', margin: '10px 0' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c5aa0' }}>
                {ordonnanceToPrint.numero || generatePrescriptionNumber()}
              </div>
            </div>
            
            <div style={{ marginBottom: '10px', padding: '5px', border: '1px solid #000', borderRadius: '2px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', borderBottom: '1px solid #ccc', paddingBottom: '2px' }}>
                INFORMATIONS DU PATIENT
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>Nom et Prénom:</span>
                  <span>{ordonnanceToPrint.patient?.nom_complet || 'Non spécifié'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>Âge:</span>
                  <span>{ordonnanceToPrint.patient?.age || 'N/A'} ans</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>Identifiant:</span>
                  <span>{ordonnanceToPrint.patient?.numero_carte || 'Non spécifié'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>Sexe:</span>
                  <span>{ordonnanceToPrint.patient?.sexe || 'Non spécifié'}</span>
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: '10px', fontSize: '11px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>DÉTAILS DE LA PRESCRIPTION ({ordonnanceToPrint.selectedMedicaments?.length || 0} actes)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #000', padding: '4px' }}>N°</th>
                    <th style={{ border: '1px solid #000', padding: '4px' }}>Désignation</th>
                    <th style={{ border: '1px solid #000', padding: '4px' }}>Quantité</th>
                    <th style={{ border: '1px solid #000', padding: '4px' }}>Posologie</th>
                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Prix unitaire</th>
                    <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {ordonnanceToPrint.selectedMedicaments?.map((med, index) => {
                    const prixUnitaire = parseFloat(med.PRIX_UNITAIRE) || 0;
                    const quantite = parseInt(med.QUANTITE) || 1;
                    const montant = prixUnitaire * quantite;
                    
                    return (
                      <tr key={index}>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>{index + 1}</td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>{med.LIBELLE || med.libelle || 'Médicament'}</td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>{quantite} {med.UNITE || 'boîte(s)'}</td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>{med.POSOLOGIE || 'À déterminer'}</td>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>
                          {prixUnitaire.toLocaleString('fr-FR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} FCFA
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>
                          {montant.toLocaleString('fr-FR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} FCFA
                        </td>
                      </tr>
                    );
                  }) || (
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '4px' }}>1</td>
                      <td style={{ border: '1px solid #000', padding: '4px' }}>Desiprane</td>
                      <td style={{ border: '1px solid #000', padding: '4px' }}>5 boîte(s)</td>
                      <td style={{ border: '1px solid #000', padding: '4px' }}>À déterminer</td>
                      <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>500 FCFA</td>
                      <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>2 500 FCFA</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                    <td colSpan="5" style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>
                      TOTAL DE LA PRESCRIPTION ({ordonnanceToPrint.selectedMedicaments?.length || 0} actes)
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>
                      {ordonnanceToPrint.selectedMedicaments?.reduce((sum, med) => {
                        const prix = parseFloat(med.PRIX_UNITAIRE) || 0;
                        const quantite = parseInt(med.QUANTITE) || 1;
                        return sum + (prix * quantite);
                      }, 0).toLocaleString('fr-FR', {minimumFractionDigits: 0, maximumFractionDigits: 0}) || '0'} FCFA
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'center', color: '#666', fontSize: '10px' }}>
              <div>Document généré électroniquement par le système de gestion AMS</div>
              <div>© PRTS 2025-0009 - Scan to validate</div>
              <div>Document validé le {moment().format('DD/MM/YYYY')}</div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Result
              status="info"
              title="Aucune ordonnance à imprimer"
              subTitle="Veuillez créer une prescription d'abord"
            />
          </div>
        )}
      </Modal>

      {/* MODAL DE FACTURE */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <DollarOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            <span>Feuille de soins - Décompte</span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Fermer
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => {
              const content = document.getElementById('facture-content');
              if (content) {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Feuille de Soins</title>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .section { margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                        .total { font-weight: bold; font-size: 1.2em; }
                        .signature { margin-top: 50px; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h2>FEUILLE DE SOINS</h2>
                        <p>Centre de Santé</p>
                      </div>
                      ${content.innerHTML}
                    </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.print();
              }
            }}
          >
            Imprimer la feuille de soins
          </Button>
        ]}
      >
        <div id="facture-content">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2>FEUILLE DE SOINS</h2>
            <p>Centre de Santé - Département Prescriptions</p>
          </div>
          
          <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Numéro prescription">
              <strong>{selectedPrescription?.NUMERO_PRESCRIPTION || 'N/A'}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Date d'exécution">
              {moment().format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Patient">
              {selectedPrescription?.NOM_BEN || 'Inconnu'}
            </Descriptions.Item>
            <Descriptions.Item label="Prescripteur">
              {selectedPrescription?.NOM_MEDECIN || 'Non spécifié'}
            </Descriptions.Item>
            <Descriptions.Item label="Exécutant">
              {selectedPrestataire?.nom_complet || 'Médecin exécutant'}
            </Descriptions.Item>
            <Descriptions.Item label="Centre">
              {centreNom || `Centre ${centreId}`}
            </Descriptions.Item>
            <Descriptions.Item label="Statut">
              <Tag color="green">Exécutée</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Nombre d'actes exécutés">
              <strong>{actesExecutes.filter(a => a.execute).length}/{actesExecutes.length}</strong>
            </Descriptions.Item>
          </Descriptions>
          
          <Table
            columns={[
              { title: 'Acte/Médicament', dataIndex: 'LIBELLE', key: 'LIBELLE' },
              { title: 'Quantité', dataIndex: 'quantite_executee', key: 'quantite', align: 'center' },
              { title: 'Prix unitaire', dataIndex: 'prix_execute', key: 'prix', align: 'right' },
              { 
                title: 'Total', 
                key: 'total',
                align: 'right',
                render: (_, record) => (
                  <span>{(record.quantite_executee * record.prix_execute).toLocaleString('fr-FR')} XAF</span>
                )
              }
            ]}
            dataSource={actesExecutes.filter(a => a.execute)}
            pagination={false}
            size="small"
            summary={() => (
              <Table.Summary.Row style={{ background: '#f0f0f0' }}>
                <Table.Summary.Cell index={0} colSpan={3} align="right">
                  <strong>TOTAL À FACTURER ({actesExecutes.filter(a => a.execute).length} actes):</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                    {totalFacture.toLocaleString('fr-FR')} XAF
                  </span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
          
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 48 }}>
              <div>
                <div style={{ borderTop: '1px solid #000', width: 200, paddingTop: 8 }}>
                  Signature du bénéficiaire
                </div>
              </div>
              <div>
                <div style={{ borderTop: '1px solid #000', width: 200, paddingTop: 8 }}>
                  Signature et cachet de l'exécutant
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Styles CSS pour surligner le médecin de la consultation */}
      <style>
        {`
          .medecin-consultation-row {
            background-color: #f0f9ff !important;
            border-left: 4px solid #1890ff !important;
          }
          .medecin-consultation-row:hover {
            background-color: #e6f7ff !important;
          }
          .acte-manuel-row {
            background-color: #fff9e6 !important;
          }
          .acte-manuel-row:hover {
            background-color: #fff0b3 !important;
          }
        `}
      </style>
    </div>
  );
};

// Fonction utilitaire pour calculer l'âge
function calculateAge(dateNaissance) {
  if (!dateNaissance) return null;
  const today = moment();
  const birthDate = moment(dateNaissance);
  return today.diff(birthDate, 'years');
}

export default Prescriptions;