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
  if (!acte) return false;
  
  // Vérifier si l'acte a le flag manuel
  if (acte.estManuel || acte.TYPE_ELEMENT === 'ACTE_MANUEL') {
    return true;
  }
  
  // Vérifier si le code commence par 'MANUEL_'
  const codeElement = acte.COD_ELEMENT;
  if (codeElement && typeof codeElement === 'string') {
    return codeElement.startsWith('MANUEL_');
  }
  
  return false;
};

// ==================== IMPRESSION D'ORDONNANCE PROFESSIONNELLE ====================
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
  
  // Données par défaut pour le design
  const defaultData = {
    patientNom: patient?.nom_complet || 'Abangana Jean',
    patientAge: patient?.age || '60 ans',
    patientId: patient?.numero_carte || patient?.identifiant_national || 'CM455321',
    centreNom: currentCentre.nom || currentCentre.NOM_CENTRE || 'Hôpital Central de Yaoundé',
    medecinNom: selectedPrestataire?.nom_complet || 'Dr. Escamba Marie',
    medecinRPPS: selectedPrestataire?.id || '24',
    datePrescription: moment().format('DD/MM/YYYY'),
    dateValidite: moment().add(30, 'days').format('DD/MM/YYYY')
  };
  
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
          font-family: 'Arial', 'Helvetica Neue', 'Helvetica', sans-serif;
          margin: 0;
          padding: 0;
          color: #2c3e50;
          line-height: 1.5;
          font-size: 11pt;
          background-color: #ffffff;
          width: 210mm;
          min-height: 297mm;
        }
        
        .ordonnance-container {
          position: relative;
          width: 100%;
          min-height: 297mm;
          padding: 5mm;
          box-sizing: border-box;
          border: 2px solid #3498db;
          border-radius: 8px;
          background: linear-gradient(to bottom, #ffffff, #f8fafc);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        /* En-tête élégant avec dégradé */
        .header {
          text-align: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 3px double #3498db;
          position: relative;
        }
        
        .header:after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 10%;
          width: 80%;
          height: 1px;
          background: #3498db;
        }
        
        .main-title {
          font-size: 24pt;
          font-weight: 800;
          margin: 0 0 5px 0;
          color: #2c3e50;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          background: linear-gradient(135deg, #3498db, #2c3e50);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .subtitle {
          font-size: 12pt;
          color: #7f8c8d;
          margin: 0 0 15px 0;
          font-weight: 500;
          letter-spacing: 1px;
        }
        
        /* Badge numéro de prescription */
        .prescription-badge {
          display: inline-block;
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          padding: 8px 20px;
          border-radius: 25px;
          font-size: 12pt;
          font-weight: 600;
          margin: 10px auto;
          box-shadow: 0 3px 6px rgba(52, 152, 219, 0.2);
          border: 2px solid white;
          position: relative;
          overflow: hidden;
        }
        
        .prescription-badge:before {
          content: '';
          position: absolute;
          top: -10px;
          right: -10px;
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
        
        /* Grille d'informations professionnelle */
        .info-grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }
        
        .info-card {
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border-left: 4px solid #3498db;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .card-title {
          font-size: 12pt;
          font-weight: 700;
          color: #2c3e50;
          margin: 0 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #ecf0f1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
        }
        
        .card-title:before {
          content: '•';
          color: #3498db;
          margin-right: 8px;
          font-size: 16pt;
        }
        
        .info-row {
          display: flex;
          margin-bottom: 10px;
          padding: 6px 0;
          border-bottom: 1px dashed #ecf0f1;
          align-items: center;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-label {
          font-weight: 600;
          color: #34495e;
          min-width: 140px;
          flex-shrink: 0;
          font-size: 10.5pt;
        }
        
        .info-value {
          flex: 1;
          color: #2c3e50;
          font-weight: 500;
          padding-left: 10px;
          border-left: 2px solid #ecf0f1;
        }
        
        /* Tableau de prescription amélioré */
        .prescription-section {
          margin: 30px 0;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
          border: 1px solid #e0e6ed;
        }
        
        .section-header {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          padding: 15px 20px;
          font-size: 13pt;
          font-weight: 700;
          letter-spacing: 1px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .badge-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 10pt;
          font-weight: 600;
        }
        
        .prescription-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 10.5pt;
        }
        
        .prescription-table thead th {
          background: #f8fafc;
          color: #34495e;
          font-weight: 700;
          padding: 14px 12px;
          text-align: left;
          border-bottom: 2px solid #3498db;
          text-transform: uppercase;
          font-size: 10pt;
          letter-spacing: 0.5px;
        }
        
        .prescription-table tbody tr {
          transition: background-color 0.2s ease;
        }
        
        .prescription-table tbody tr:nth-child(even) {
          background-color: #f8fafc;
        }
        
        .prescription-table tbody tr:hover {
          background-color: #e8f4fc;
        }
        
        .prescription-table td {
          padding: 12px;
          border-bottom: 1px solid #ecf0f1;
          vertical-align: top;
          color: #2c3e50;
        }
        
        .medicament-name {
          font-weight: 600;
          color: #2c3e50;
        }
        
        .medicament-details {
          font-size: 9.5pt;
          color: #7f8c8d;
          margin-top: 4px;
        }
        
        .prescription-table tfoot {
          background: linear-gradient(135deg, #2c3e50, #34495e);
          color: white;
        }
        
        .prescription-table tfoot td {
          padding: 16px 12px;
          font-size: 11pt;
          font-weight: 700;
          border: none;
        }
        
        .total-amount {
          font-size: 14pt;
          color: #fff;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        /* Section observations */
        .observations-card {
          background: #fff9e6;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
          border-left: 4px solid #f39c12;
          box-shadow: 0 2px 8px rgba(243, 156, 18, 0.1);
        }
        
        .observations-title {
          font-size: 12pt;
          font-weight: 700;
          color: #d35400;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
        }
        
        .observations-title:before {
          content: '📌';
          margin-right: 8px;
          font-size: 12pt;
        }
        
        .observations-content {
          color: #7d6608;
          line-height: 1.6;
          font-size: 10.5pt;
          padding: 10px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 4px;
        }
        
        /* Section signatures */
        .signatures-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 30px;
          margin: 40px 0 30px 0;
          padding-top: 30px;
          border-top: 2px dashed #bdc3c7;
        }
        
        .signature-block {
          text-align: center;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s ease;
        }
        
        .signature-block:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
        }
        
        .signature-line {
          width: 180px;
          border-bottom: 2px solid #3498db;
          margin: 0 auto 15px;
          height: 30px;
          position: relative;
        }
        
        .signature-line:after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 0;
          right: 0;
          height: 1px;
          background: repeating-linear-gradient(
            to right,
            transparent,
            transparent 5px,
            #bdc3c7 5px,
            #bdc3c7 10px
          );
        }
        
        .signature-label {
          font-size: 11pt;
          font-weight: 700;
          color: #2c3e50;
          margin: 15px 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .signature-details {
          font-size: 9.5pt;
          color: #7f8c8d;
          line-height: 1.4;
        }
        
        .signature-badge {
          display: inline-block;
          background: #ecf0f1;
          color: #7f8c8d;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 8.5pt;
          margin-top: 8px;
          font-weight: 600;
        }
        
        /* Pied de page professionnel */
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ecf0f1;
          text-align: center;
          font-size: 9pt;
          color: #95a5a6;
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
        }
        
        .footer-title {
          font-size: 10pt;
          font-weight: 700;
          color: #7f8c8d;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .security-info {
          display: inline-flex;
          align-items: center;
          gap: 15px;
          margin-top: 15px;
          padding: 10px 20px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }
        
        .qr-code-placeholder {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #ecf0f1, #bdc3c7);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7f8c8d;
          font-size: 8pt;
          font-weight: 600;
        }
        
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 60pt;
          font-weight: 900;
          color: rgba(52, 152, 219, 0.03);
          z-index: 0;
          white-space: nowrap;
          pointer-events: none;
          letter-spacing: 10px;
          text-transform: uppercase;
        }
        
        .urgent-stamp {
          position: absolute;
          top: 100px;
          right: 50px;
          background: #e74c3c;
          color: white;
          padding: 15px 25px;
          border-radius: 50%;
          font-size: 12pt;
          font-weight: 900;
          transform: rotate(15deg);
          box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
          border: 4px solid white;
          z-index: 1;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { transform: rotate(15deg) scale(1); }
          50% { transform: rotate(15deg) scale(1.05); }
          100% { transform: rotate(15deg) scale(1); }
        }
        
        .logo-container {
          text-align: center;
          margin-bottom: 20px;
          padding: 15px;
          background: linear-gradient(135deg, #f8fafc, #ecf0f1);
          border-radius: 12px;
          border: 2px dashed #3498db;
        }
        
        .logo-placeholder {
          display: inline-block;
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #3498db, #2c3e50);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16pt;
          font-weight: 900;
          margin: 0 auto 15px;
          box-shadow: 0 8px 20px rgba(52, 152, 219, 0.2);
        }
        
        .hospital-name {
          font-size: 18pt;
          font-weight: 800;
          color: #2c3e50;
          margin: 0;
          background: linear-gradient(135deg, #2c3e50, #3498db);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .hospital-slogan {
          font-size: 10pt;
          color: #7f8c8d;
          margin: 5px 0 0 0;
          font-weight: 500;
          letter-spacing: 1px;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          
          .ordonnance-container {
            border: none;
            box-shadow: none;
            padding: 0;
          }
          
          .watermark {
            opacity: 0.05;
          }
          
          .urgent-stamp {
            animation: none;
          }
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-bold {
          font-weight: 700;
        }
        
        .color-primary {
          color: #3498db;
        }
        
        .color-success {
          color: #27ae60;
        }
        
        .mb-20 {
          margin-bottom: 20px;
        }
        
        .mt-30 {
          margin-top: 30px;
        }
        
        .p-20 {
          padding: 20px;
        }
      </style>
    </head>
    <body>
      <div class="ordonnance-container">
        <!-- Filigrane de sécurité -->
        <div class="watermark">VALIDE</div>
        
        <!-- Timbre urgent si nécessaire -->
        ${urgent ? '<div class="urgent-stamp">URGENT</div>' : ''}
        
        <!-- Logo et informations de l'établissement -->
        <div class="logo-container">
          <div class="logo-placeholder">HCY</div>
          <h2 class="hospital-name">${defaultData.centreNom}</h2>
          <p class="hospital-slogan">Excellence Médicale • Soins de Qualité • Innovation</p>
        </div>
        
        <!-- En-tête principal -->
        <div class="header">
          <h1 class="main-title">Ordonnance Médicale</h1>
          <p class="subtitle">Prescription Officielle • Document Médical Légal</p>
          <div class="prescription-badge">
            N° Prescription: ${prescriptionNum}
          </div>
        </div>
        
        <!-- Grille d'informations -->
        <div class="info-grid-container">
          <!-- Carte Informations Patient -->
          <div class="info-card">
            <h3 class="card-title">Informations du Patient</h3>
            <div class="info-row">
              <span class="info-label">Nom complet:</span>
              <span class="info-value text-bold color-primary">${defaultData.patientNom}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Âge:</span>
              <span class="info-value">${defaultData.patientAge}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Identifiant:</span>
              <span class="info-value text-bold">${defaultData.patientId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date prescription:</span>
              <span class="info-value text-bold">${defaultData.datePrescription}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Validité:</span>
              <span class="info-value color-success text-bold">${defaultData.dateValidite}</span>
            </div>
          </div>
          
          <!-- Carte Informations Médicales -->
          <div class="info-card">
            <h3 class="card-title">Informations Médicales</h3>
            <div class="info-row">
              <span class="info-label">Centre de santé:</span>
              <span class="info-value">${defaultData.centreNom}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Médecin prescripteur:</span>
              <span class="info-value text-bold color-primary">${defaultData.medecinNom}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Type de prescription:</span>
              <span class="info-value">${getTypeLabel(typePrestation) || 'Pharmacie'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">N° RPPS:</span>
              <span class="info-value">${defaultData.medecinRPPS}</span>
            </div>
          </div>
          
          <!-- Carte Diagnostic -->
          <div class="info-card">
            <h3 class="card-title">Diagnostic / Affection</h3>
            <div class="info-row">
              <span class="info-label">Code CIM:</span>
              <span class="info-value text-bold">${affectionCode || 'J00 - J99'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Libellé:</span>
              <span class="info-value">${affectionDetails?.libelle || 'Affections des voies respiratoires supérieures'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Gravité:</span>
              <span class="info-value">
                <span style="color: #e74c3c; font-weight: 600;">● Moyenne</span>
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Remboursable:</span>
              <span class="info-value color-success text-bold">OUI</span>
            </div>
          </div>
        </div>
        
        <!-- Section Prescription -->
        <div class="prescription-section">
          <div class="section-header">
            <span>Détails de la Prescription</span>
            <span class="badge-count">${selectedMedicaments?.length || 0} actes prescrits</span>
          </div>
          
          <table class="prescription-table">
            <thead>
              <tr>
                <th style="width: 5%">N°</th>
                <th style="width: 30%">Désignation</th>
                <th style="width: 12%">Quantité</th>
                <th style="width: 23%">Posologie</th>
                <th style="width: 15%">Prix unitaire</th>
                <th style="width: 15%">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${selectedMedicaments?.length > 0 ? selectedMedicaments.map((med, index) => {
                const prixUnitaire = parseFloat(med.PRIX_UNITAIRE) || 0;
                const quantite = parseInt(med.QUANTITE) || 1;
                const montant = prixUnitaire * quantite;
                const isGeneric = med.NOM_GENERIQUE || med.nom_generique;
                
                return `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>
                      <div class="medicament-name">${med.LIBELLE || med.libelle || 'Médicament'}</div>
                      ${isGeneric ? `<div class="medicament-details">Générique: ${isGeneric}</div>` : ''}
                      ${med.FORME_PHARMACEUTIQUE ? `<div class="medicament-details">Forme: ${med.FORME_PHARMACEUTIQUE}</div>` : ''}
                    </td>
                    <td class="text-center">
                      <strong>${quantite}</strong><br>
                      <span style="font-size: 9pt; color: #7f8c8d;">${med.UNITE || 'boîte(s)'}</span>
                    </td>
                    <td>
                      ${med.POSOLOGIE || 'À déterminer'}<br>
                      ${med.DUREE ? `<span style="font-size: 9.5pt; color: #3498db;">Durée: ${med.DUREE} jours</span>` : ''}
                    </td>
                    <td class="text-right text-bold">
                      ${prixUnitaire.toLocaleString('fr-FR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} FCFA
                    </td>
                    <td class="text-right text-bold color-primary">
                      ${montant.toLocaleString('fr-FR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} FCFA
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="6" class="text-center p-20" style="color: #95a5a6;">
                    Aucun médicament prescrit
                  </td>
                </tr>
              `}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" class="text-right text-bold">
                  TOTAL DE LA PRESCRIPTION
                </td>
                <td class="text-right">
                  <span class="total-amount">
                    ${totalPrescription.toLocaleString('fr-FR', {minimumFractionDigits: 0, maximumFractionDigits: 0})} FCFA
                  </span>
                </td>
              </tr>
              <tr>
                <td colspan="5" class="text-right">
                  Mode de remboursement:
                </td>
                <td class="text-right text-bold color-success">
                  Sécurité Sociale + Assurance
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <!-- Section Observations -->
        <div class="observations-card">
          <h3 class="observations-title">Observations Médicales</h3>
          <div class="observations-content">
            ${observations || `
              • Suivre scrupuleusement la posologie indiquée<br>
              • Ne pas interrompre le traitement avant la fin<br>
              • Consulter en cas d'effets secondaires<br>
              • Tenir hors de portée des enfants
            `}
          </div>
        </div>
        
        <!-- Section Signatures -->
        <div class="signatures-section">
          <div class="signature-block">
            <div class="signature-line"></div>
            <h4 class="signature-label">Médecin Prescripteur</h4>
            <p class="signature-details">
              ${defaultData.medecinNom}<br>
              <span style="color: #3498db; font-weight: 600;">Médecin Généraliste</span><br>
              N° RPPS: ${defaultData.medecinRPPS}
            </p>
            <div class="signature-badge">Signature et cachet</div>
          </div>
          
          <div class="signature-block">
            <div class="signature-line"></div>
            <h4 class="signature-label">Pharmacien Exécutant</h4>
            <p class="signature-details">
              Pharmacie du Centre<br>
              <span style="color: #27ae60; font-weight: 600;">Pharmacien Titulaire</span><br>
              N° d'agrément: PH12345678
            </p>
            <div class="signature-badge">Signature et date d'exécution</div>
          </div>
          
          <div class="signature-block">
            <div class="signature-line"></div>
            <h4 class="signature-label">Service Comptabilité</h4>
            <p class="signature-details">
              Pour remboursement<br>
              <span style="color: #e74c3c; font-weight: 600;">Document à conserver</span><br>
              Valable 30 jours
            </p>
            <div class="signature-badge">Cachet administratif</div>
          </div>
        </div>
        
        <!-- Pied de page -->
        <div class="footer">
          <h4 class="footer-title">Informations Légales et Sécurité</h4>
          <p>
            Document électronique sécurisé généré par le Système de Gestion Médicale AMS Pro v3.0<br>
            Référence unique: ${prescriptionNum} • Date de génération: ${moment().format('DD/MM/YYYY HH:mm')}
          </p>
          <div class="security-info">
            <div class="qr-code-placeholder">QR CODE</div>
            <div style="text-align: left;">
              <div style="font-weight: 600; color: #2c3e50;">Document Authentique</div>
              <div style="font-size: 8pt;">Scannez pour vérifier la validité<br>© ${new Date().getFullYear()} AMS Healthcare Solutions</div>
            </div>
          </div>
          <p style="margin-top: 15px; font-size: 8.5pt; color: #bdc3c7;">
            Tout document falsifié est passible de poursuites judiciaires • Conservation: 5 ans
          </p>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 800);
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
      const prescriptionsWithDetails = await Promise.all(
        response.prescriptions.map(async (prescription) => {
          try {
            let details = [];
            
            // Si les détails ne sont pas inclus, les récupérer
            if (!prescription.details || prescription.details.length === 0) {
              const idToUse = prescription.COD_PRES || prescription.id || prescription.NUMERO_PRESCRIPTION;
              if (idToUse) {
                const detailResponse = await prescriptionsAPI.getByNumeroOrId(idToUse);
                if (detailResponse.success && detailResponse.prescription) {
                  details = detailResponse.prescription.details || [];
                }
              }
            } else {
              details = prescription.details;
            }
            
            // Calculer le total et nombre d'actes
            const total = details.reduce((sum, detail) => {
              const prix = parseFloat(detail.PRIX_UNITAIRE) || 0;
              const quantite = parseInt(detail.QUANTITE) || 1;
              return sum + (prix * quantite);
            }, 0);
            
            const nombreActes = details.length;
            
            // Normaliser la prescription
            return normalizePrescription({
              ...prescription,
              details: details,
              total: total,
              nombreActes: nombreActes
            });
            
          } catch (error) {
            console.error(`❌ Erreur chargement détails prescription ${prescription.COD_PRES}:`, error);
            return normalizePrescription({
              ...prescription,
              details: [],
              total: 0,
              nombreActes: 0
            });
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
// Normaliser les données de prescription
// Normaliser les données de prescription
const normalizePrescription = (prescription) => {
  if (!prescription) return null;
  
  // Extraire les champs avec plusieurs noms possibles
  const numeroPrescription = 
    prescription.NUMERO_PRESCRIPTION || 
    prescription.numero_prescription || 
    prescription.numero || 
    prescription.NUMERO || 
    prescription.prescription_number ||
    `PRES-${prescription.id || prescription.COD_PRES}`;
  
  const nomBeneficiaire = 
    prescription.NOM_BEN || 
    prescription.nom_beneficiaire || 
    prescription.patient_nom || 
    prescription.nom || 
    'Inconnu';
  
  const nomMedecin = 
    prescription.NOM_MEDECIN || 
    prescription.nom_medecin || 
    prescription.medecin_nom || 
    prescription.medecin || 
    'Non spécifié';
  
  const typePrestation = 
    prescription.TYPE_PRESTATION || 
    prescription.type_prestation || 
    prescription.type || 
    'Non spécifié';
  
  const statut = 
    prescription.STATUT || 
    prescription.statut || 
    'Inconnu';
  
  const datePrescription = 
    prescription.DATE_PRESCRIPTION || 
    prescription.date_prescription || 
    prescription.date || 
    null;
  
  return {
    id: prescription.id || prescription.COD_PRES,
    COD_PRES: prescription.COD_PRES || prescription.id,
    NUMERO_PRESCRIPTION: numeroPrescription,
    NOM_BEN: nomBeneficiaire,
    PRE_BEN: prescription.PRE_BEN || prescription.prenom,
    NOM_MEDECIN: nomMedecin,
    TYPE_PRESTATION: typePrestation,
    STATUT: statut,
    DATE_PRESCRIPTION: datePrescription,
    COD_AFF: prescription.COD_AFF || prescription.code_affection,
    ORIGINE: prescription.ORIGINE || prescription.origine,
    COD_CEN: prescription.COD_CEN || prescription.centre_id,
    details: prescription.details || prescription.actes || [],
    total: prescription.total || 0,
    nombreActes: prescription.nombreActes || (prescription.details ? prescription.details.length : 0) || 0,
    // Ajouter d'autres champs si nécessaire
    AGE: prescription.AGE || prescription.age,
    SEX_BEN: prescription.SEX_BEN || prescription.sexe,
    IDENTIFIANT_NATIONAL: prescription.IDENTIFIANT_NATIONAL || prescription.identifiant_national,
    URGENT: prescription.URGENT || prescription.urgent,
    OBSERVATIONS: prescription.OBSERVATIONS || prescription.observations
  };
};

// Normaliser les détails d'actes
const normalizeActe = (acte) => {
  if (!acte) return null;
  
  return {
    id: acte.id || acte.COD_ELEMENT,
    COD_ELEMENT: acte.COD_ELEMENT || acte.code || acte.id,
    LIBELLE: acte.LIBELLE || acte.libelle || acte.nom || 'Acte non spécifié',
    QUANTITE: parseInt(acte.QUANTITE || acte.quantite || 1),
    POSOLOGIE: acte.POSOLOGIE || acte.posologie || 'À déterminer',
    PRIX_UNITAIRE: parseFloat(acte.PRIX_UNITAIRE || acte.prix || 0),
    REMBOURSABLE: acte.REMBOURSABLE || acte.remboursable || 0,
    TYPE_ELEMENT: acte.TYPE_ELEMENT || acte.type_element || 'MEDICAMENT',
    DUREE: acte.DUREE || acte.duree || '7',
    UNITE: acte.UNITE || acte.unite || 'boîte(s)'
  };
};

const handleViewPrescriptionDetails = async (prescription) => {
  try {
    setLoading(prev => ({ ...prev, prestations: true }));
    
    console.log('🔍 Prescription originale:', prescription);
    
    // Charger les détails
    const details = await loadDetailsForPrescription(prescription);
    console.log('📋 Détails chargés:', details);
    
    // Normaliser la prescription
    const normalizedPrescription = normalizePrescription(prescription);
    console.log('📊 Prescription normalisée:', normalizedPrescription);
    
    normalizedPrescription.details = details.map(normalizeActe);
    normalizedPrescription.total = details.reduce((sum, detail) => {
      const prix = parseFloat(detail.PRIX_UNITAIRE || detail.prix || 0);
      const quantite = parseInt(detail.QUANTITE || detail.quantite || 1);
      return sum + (prix * quantite);
    }, 0);
    normalizedPrescription.nombreActes = details.length;
    
    console.log('✅ Prescription finale avec détails:', normalizedPrescription);
    
    setSelectedPrescription(normalizedPrescription);
    setPrescriptionDetails(normalizedPrescription);
    setActiveTab('execution');
    
    // Préparer les actes pour l'exécution
    const initialActes = details.map((detail, index) => {
      const normalizedActe = normalizeActe(detail);
      return {
        ...normalizedActe,
        execute: false,
        quantite_executee: normalizedActe.QUANTITE,
        prix_execute: normalizedActe.PRIX_UNITAIRE,
        key: normalizedActe.id || `${normalizedActe.COD_ELEMENT}_${index}`
      };
    });
    
    setActesExecutes(initialActes);
    calculerTotalExecution();
    
    message.success(`Détails de la prescription chargés: ${details.length} actes - Numéro: ${normalizedPrescription.NUMERO_PRESCRIPTION}`);
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
// Modifiez la fonction searchPrescription pour mieux gérer la recherche
const searchPrescription = async () => {
  if (!prescriptionNumero || prescriptionNumero.trim().length === 0) {
    message.warning('Veuillez entrer un numéro de prescription');
    return;
  }
  
  setLoading(prev => ({ ...prev, execution: true }));
  try {
    console.log('🔍 Recherche prescription:', prescriptionNumero);
    
    // Essayer plusieurs formats
    let response = null;
    
    // Essayer 1: Recherche par ID si c'est un nombre
    if (/^\d+$/.test(prescriptionNumero)) {
      console.log('🔍 Recherche par ID numérique:', prescriptionNumero);
      response = await prescriptionsAPI.getByNumeroOrId(prescriptionNumero);
    }
    
    // Essayer 2: Si non trouvé ou si c'est une chaîne avec préfixe
    if (!response || !response.success || !response.prescription) {
      console.log('🔍 Recherche par numéro textuel:', prescriptionNumero);
      
      // Nettoyer le numéro - enlever les préfixes
      const cleanedNumero = prescriptionNumero
        .replace(/^PRES-/, '')
        .replace(/^pres-/, '')
        .trim();
      
      // Essayer d'abord avec le numéro nettoyé
      response = await prescriptionsAPI.getByNumeroOrId(cleanedNumero);
      
      // Si toujours pas trouvé, essayer avec le numéro original
      if (!response || !response.success || !response.prescription) {
        response = await prescriptionsAPI.getByNumeroOrId(prescriptionNumero);
      }
    }
    
    if (response.success && response.prescription) {
      const prescription = response.prescription;
      console.log('✅ Prescription trouvée:', prescription);
      
      // Extraire les détails de différentes manières
      let details = [];
      
      // Méthode 1: Détails directement dans la réponse
      if (prescription.details && Array.isArray(prescription.details)) {
        details = prescription.details;
      }
      // Méthode 2: Détails dans un champ différent
      else if (prescription.actes && Array.isArray(prescription.actes)) {
        details = prescription.actes;
      }
      // Méthode 3: Charger via une autre API
      else {
        try {
          const detailsResponse = await prescriptionsAPI.getDetails(prescription.id || prescription.COD_PRES);
          if (detailsResponse.success && detailsResponse.details) {
            details = detailsResponse.details;
          }
        } catch (error) {
          console.warn('⚠️ Impossible de charger les détails:', error);
        }
      }
      
      setSelectedPrescription({
        ...prescription,
        details: details,
        nombreActes: details.length,
        total: details.reduce((sum, detail) => {
          const prix = parseFloat(detail.PRIX_UNITAIRE || detail.prix || 0);
          const quantite = parseInt(detail.QUANTITE || detail.quantite || 1);
          return sum + (prix * quantite);
        }, 0)
      });
      
      setPrescriptionDetails(prescription);
      
      const initialActes = details.map((detail, index) => ({
        ...detail,
        execute: false,
        quantite_executee: detail.QUANTITE || detail.quantite || 1,
        prix_execute: detail.PRIX_UNITAIRE || detail.prix || 0,
        LIBELLE: detail.LIBELLE || detail.libelle || detail.nom || 'Acte non spécifié',
        QUANTITE: detail.QUANTITE || detail.quantite || 1,
        key: detail.id || `${detail.COD_ELEMENT || detail.code}_${index}_${Math.random()}`,
        COD_ELEMENT: detail.COD_ELEMENT || detail.code || detail.id
      }));
      
      setActesExecutes(initialActes);
      calculerTotalExecution();
      
      message.success(`Prescription trouvée - ${prescription.NOM_BEN || prescription.patient_nom} - ${details.length} actes`);
    } else {
      message.error(response.message || 'Prescription non trouvée');
      setSelectedPrescription(null);
      setPrescriptionDetails(null);
      setActesExecutes([]);
    }
  } catch (error) {
    console.error('❌ Erreur recherche prescription:', error);
    
    // Essayer une recherche alternative
    try {
      const searchResponse = await prescriptionsAPI.getAll({
        search: prescriptionNumero,
        limit: 5,
        include_details: true
      });
      
      if (searchResponse.success && searchResponse.prescriptions.length > 0) {
        const prescription = searchResponse.prescriptions[0];
        message.success(`Prescription trouvée via recherche: ${prescription.NUMERO_PRESCRIPTION || prescription.id}`);
        // Traiter la prescription comme ci-dessus...
      } else {
        message.error('Aucune prescription trouvée avec ce numéro');
      }
    } catch (searchError) {
      message.error('Erreur lors de la recherche de la prescription');
    }
    
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
                        // Dans le rendu de l'historique, modifiez la section du titre
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
        <strong>{prescription.NUMERO_PRESCRIPTION}</strong>
        <Tag color="blue" style={{ marginLeft: 8 }}>
          {prescription.TYPE_PRESTATION || 'Non spécifié'}
        </Tag>
        {prescription.URGENT && (
          <Tag color="red" style={{ marginLeft: 8 }}>
            URGENT
          </Tag>
        )}
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
        <strong>Patient:</strong> {prescription.PRE_BEN ? `${prescription.PRE_BEN} ${prescription.NOM_BEN}` : prescription.NOM_BEN}
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
      {prescription.IDENTIFIANT_NATIONAL && (
        <div>
          <strong>Identifiant:</strong> {prescription.IDENTIFIANT_NATIONAL}
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

const loadDetailsForPrescription = async (prescription) => {
  try {
    const prescriptionId = prescription.COD_PRES || prescription.id;
    
    // Essayer plusieurs méthodes
    let details = [];
    
    // Méthode 1: Détails déjà inclus
    if (prescription.details && Array.isArray(prescription.details)) {
      details = prescription.details;
    }
    
    // Méthode 2: API getDetails si elle existe
    if (details.length === 0 && prescriptionsAPI.getDetails) {
      try {
        const response = await prescriptionsAPI.getDetails(prescriptionId);
        if (response.success && response.details) {
          details = response.details;
        }
      } catch (error) {
        console.warn('⚠️ getDetails API échouée:', error);
      }
    }
    
    // Méthode 3: Recherche via getAll avec include_details
    if (details.length === 0) {
      try {
        const response = await prescriptionsAPI.getAll({
          id: prescriptionId,
          limit: 1,
          include_details: true
        });
        
        if (response.success && response.prescriptions.length > 0) {
          details = response.prescriptions[0].details || [];
        }
      } catch (error) {
        console.warn('⚠️ Recherche via getAll échouée:', error);
      }
    }
    
    return details;
  } catch (error) {
    console.error('❌ Erreur chargement détails:', error);
    return [];
  }
};

export default Prescriptions;