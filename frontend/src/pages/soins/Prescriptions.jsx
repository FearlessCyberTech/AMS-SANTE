// src/components/Prescriptions.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Card,
  CardContent,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Stack,
  Divider,
  Avatar,
  InputAdornment,
  Fade,
  Zoom,
  Slide,
  alpha,
  useTheme,
  Checkbox,
  Badge,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel,
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Print as PrintIcon,
  PlayCircle as ExecuteIcon,
  Assignment as PrescriptionIcon,
  LocalPharmacy as PharmacyIcon,
  Science as LabIcon,
  CameraAlt as RadiologyIcon,
  Description as ReportIcon,
  LocalHospital as HospitalIcon,
  MedicalServices as MedicalIcon,
  Person as PersonIcon,
  HealthAndSafety as HealthIcon,
  Medication as MedicationIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  Done as DoneIcon,
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon,
  Notifications as NotificationIcon,
  EditNote as EditNoteIcon
} from '@mui/icons-material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import fr from 'date-fns/locale/fr';
import api from '../../services/api';

// Import de jsQR pour le scan réel
import jsQR from 'jsqr';

// Import pour générer le QR code
import QRCode from 'qrcode';

// Import du CSS
import './Prescriptions.css';

const Prescriptions = () => {
  const theme = useTheme();
  const printRef = useRef();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [remplirDetails, setRemplirDetails] = useState(true);
  const [hasNewPrescriptions, setHasNewPrescriptions] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPrescriptionId, setEditingPrescriptionId] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanFps, setScanFps] = useState(0);
  const [lastScanTime, setLastScanTime] = useState(0);

  // États pour la liste des prescriptions
  const [prescriptions, setPrescriptions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    statut: '',
    type_prestation: '',
    date_debut: null,
    date_fin: null
  });

  // États pour la création de prescription
  const [patientSearch, setPatientSearch] = useState('');
  const [patient, setPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [typePrestation, setTypePrestation] = useState('');
  const [observations, setObservations] = useState('');
  const [dateValidite, setDateValidite] = useState(null);
  const [details, setDetails] = useState([]);
  
  // États pour les médecins et centres
  const [medecins, setMedecins] = useState([]);
  const [selectedMedecin, setSelectedMedecin] = useState('');
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState('');

  // États pour l'exécution
  const [prescriptionSearch, setPrescriptionSearch] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [executionDetails, setExecutionDetails] = useState([]);

  // États pour les modals
  const [searchPatientDialog, setSearchPatientDialog] = useState(false);
  const [searchElementDialog, setSearchElementDialog] = useState(false);
  const [elementSearch, setElementSearch] = useState('');
  const [elements, setElements] = useState([]);

  // États pour la feuille de soins
  const [showFeuilleSoins, setShowFeuilleSoins] = useState(false);
  const [prescriptionToPrint, setPrescriptionToPrint] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [generatingQrCode, setGeneratingQrCode] = useState(false);

  // Références pour le scanner
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(0);

  // Types de prestations disponibles avec couleurs
  const typesPrestation = [
    { 
      value: 'Pharmacie', 
      label: 'Pharmacie', 
      icon: <PharmacyIcon />, 
      color: '#4CAF50',
      bgColor: alpha('#4CAF50', 0.1)
    },
    { 
      value: 'Biologie', 
      label: 'Biologie', 
      icon: <LabIcon />, 
      color: '#2196F3',
      bgColor: alpha('#2196F3', 0.1)
    },
    { 
      value: 'Imagerie', 
      label: 'Imagerie', 
      icon: <RadiologyIcon />, 
      color: '#9C27B0',
      bgColor: alpha('#9C27B0', 0.1)
    },
    { 
      value: 'Consultation', 
      label: 'Consultation', 
      icon: <MedicalIcon />, 
      color: '#FF9800',
      bgColor: alpha('#FF9800', 0.1)
    },
    { 
      value: 'Hospitalisation', 
      label: 'Hospitalisation', 
      icon: <HospitalIcon />, 
      color: '#F44336',
      bgColor: alpha('#F44336', 0.1)
    }
  ];

  // ==============================
  // FONCTIONS UTILITAIRES
  // ==============================

  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return null;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (statut) => {
    const statusMap = {
      'En attente': { 
        color: 'warning', 
        icon: <WarningIcon />,
        gradient: 'var(--warning-gradient)'
      },
      'En cours': { 
        color: 'info', 
        icon: <RefreshIcon />,
        gradient: 'var(--info-gradient)'
      },
      'Executee': { 
        color: 'success', 
        icon: <DoneIcon />,
        gradient: 'var(--success-gradient)'
      },
      'Annulee': { 
        color: 'error', 
        icon: <CloseIcon />,
        gradient: 'var(--error-gradient)'
      },
      'Partiellement exécutée': { 
        color: 'secondary', 
        icon: <CheckIcon />,
        gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'
      }
    };
    return statusMap[statut] || { 
      color: 'default', 
      icon: <MoreIcon />,
      gradient: 'var(--primary-gradient)'
    };
  };

  const calculateTotal = () => {
    return details.reduce((sum, detail) => {
      return sum + (detail.quantite * detail.prix_unitaire);
    }, 0);
  };

  // ==============================
  // GÉNÉRATION DU QR CODE POUR LA FEUILLE DE SOINS
  // ==============================

  const generateQrCode = async (prescriptionData) => {
    if (!prescriptionData || !prescriptionData.NUM_PRESCRIPTION) {
      console.error('Données de prescription manquantes pour générer le QR code');
      return null;
    }

    try {
      setGeneratingQrCode(true);
      
      // Créer un objet contenant les informations essentielles pour le QR code
      const qrData = {
        type: 'PRESCRIPTION_MEDICALE',
        numero: prescriptionData.NUM_PRESCRIPTION,
        patient: `${prescriptionData.NOM_BEN} ${prescriptionData.PRE_BEN}`.trim(),
        date: prescriptionData.DATE_PRESCRIPTION || new Date().toISOString().split('T')[0],
        centre: prescriptionData.NOM_CENTRE || 'Centre médical',
        montant: prescriptionData.MONTANT_TOTAL || 0,
        statut: prescriptionData.STATUT || 'En attente'
      };
      
      // Convertir en JSON string
      const qrDataString = JSON.stringify(qrData);
      
      // Options du QR code
      const qrOptions = {
        errorCorrectionLevel: 'H', // Haute correction d'erreur
        margin: 2,
        scale: 8,
        color: {
          dark: '#000000', // Couleur des modules
          light: '#FFFFFF' // Couleur de fond
        }
      };
      
      // Générer le QR code
      const qrUrl = await QRCode.toDataURL(qrDataString, qrOptions);
      
      setQrCodeUrl(qrUrl);
      return qrUrl;
    } catch (err) {
      console.error('❌ Erreur génération QR code:', err);
      
      // Générer un QR code de secours avec juste le numéro
      try {
        const fallbackUrl = await QRCode.toDataURL(prescriptionData.NUM_PRESCRIPTION, {
          errorCorrectionLevel: 'M',
          margin: 1,
          scale: 6
        });
        
        setQrCodeUrl(fallbackUrl);
        return fallbackUrl;
      } catch (fallbackErr) {
        console.error('❌ Erreur génération QR code de secours:', fallbackErr);
        return null;
      }
    } finally {
      setGeneratingQrCode(false);
    }
  };

  // ==============================
  // FONCTIONS SCANNER AVEC JSQR
  // ==============================

  const startCamera = async () => {
    try {
      setIsScanning(true);
      setScannerError(null);
      setScanProgress(0);
      setScanFps(0);
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = Date.now();
      
      // Démarrer la barre de progression
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 5;
        });
      }, 100);

      // Demander l'accès à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Attendre que la vidéo soit prête
        await new Promise((resolve) => {
          if (videoRef.current.readyState >= 3) {
            resolve();
          } else {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
        
        await videoRef.current.play();
      }
      
      clearInterval(progressInterval);
      setScanProgress(100);
      
      // Démarrer la détection après un court délai
      setTimeout(() => {
        detectQRCode();
      }, 500);
      
    } catch (err) {
      console.error('Erreur caméra:', err);
      setScannerError(`Impossible d'accéder à la caméra: ${err.message}`);
      setIsScanning(false);
      setScanProgress(0);
      
      // Suggestions basées sur l'erreur
      if (err.name === 'NotAllowedError') {
        setScannerError('Permission caméra refusée. Veuillez autoriser l\'accès à la caméra.');
      } else if (err.name === 'NotFoundError') {
        setScannerError('Aucune caméra trouvée. Vérifiez votre périphérique.');
      } else if (err.name === 'NotReadableError') {
        setScannerError('Caméra déjà utilisée par une autre application.');
      }
    }
  };

  const stopCamera = () => {
    // Arrêter l'animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Arrêter l'intervalle FPS
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    // Arrêter le flux vidéo
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Réinitialiser la vidéo
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    setScanProgress(0);
    setScanFps(0);
  };

  const detectQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Ajuster la taille du canvas à la vidéo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dessiner l'image de la vidéo sur le canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Obtenir les données d'image
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Utiliser jsQR pour détecter les QR codes
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    
    // Compter les FPS
    frameCountRef.current++;
    const now = Date.now();
    if (now - lastFpsUpdateRef.current >= 1000) {
      setScanFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }
    
    if (code) {
      // QR code détecté !
      console.log('✅ QR Code détecté:', {
        data: code.data,
        version: code.version,
        location: code.location
      });
      
      // Dessiner un rectangle autour du QR code pour le feedback visuel
      context.strokeStyle = '#4CAF50';
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
      context.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
      context.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
      context.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
      context.closePath();
      context.stroke();
      
      // Ajouter un texte
      context.fillStyle = '#4CAF50';
      context.font = '16px Arial';
      context.fillText('✓ QR Code détecté', 10, 30);
      
      // Traiter les données scannées
      handleScanSuccess(code.data);
      
      // Arrêter la détection
      stopCamera();
      
      // Fermer le modal après un délai
      setTimeout(() => {
        setShowScanner(false);
      }, 1500);
      
      return; // Ne pas continuer la détection
    }
    
    // Si aucun code n'est détecté, continuer la détection
    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(detectQRCode);
    }
  };

  const handleScanSuccess = (data) => {
    if (!data || !isScanning) return;
    
    console.log('✅ Données scannées:', data);
    setScannedData(data);
    setSuccess(`QR Code scanné avec succès: ${data}`);
    
    // Essayer de parser le JSON si c'est un QR code généré par notre système
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.type === 'PRESCRIPTION_MEDICALE' && parsedData.numero) {
        data = parsedData.numero;
      }
    } catch (e) {
      // Ce n'est pas du JSON, on garde la donnée brute
    }
    
    // Mettre à jour le champ de recherche selon l'onglet actif
    if (activeTab === 2) { // Onglet "Exécuter Prescription"
      setPrescriptionSearch(data);
      setTimeout(() => {
        searchPrescription();
      }, 500);
    } 
    else if (activeTab === 0) { // Onglet "Liste des Prescriptions"
      setFilters({ ...filters, search: data });
      setTimeout(() => {
        loadPrescriptions();
      }, 500);
    }
  };

  const toggleScanner = async () => {
    if (showScanner) {
      // Fermer le scanner
      stopCamera();
      setShowScanner(false);
      setScannerError(null);
      setScannedData(null);
    } else {
      // Ouvrir le scanner
      setShowScanner(true);
      setScannerError(null);
      setScannedData(null);
      
      // Démarrer la caméra après un court délai pour permettre l'animation
      setTimeout(() => {
        startCamera();
      }, 300);
    }
  };

  // Mettre à jour les FPS régulièrement
  useEffect(() => {
    if (isScanning) {
      scanIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastFpsUpdateRef.current;
        if (elapsed > 0) {
          setScanFps(Math.round((frameCountRef.current * 1000) / elapsed));
          frameCountRef.current = 0;
          lastFpsUpdateRef.current = now;
        }
      }, 1000);
    }
    
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isScanning]);

  // Nettoyer à la destruction du composant
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Arrêter la caméra quand le modal est fermé
  useEffect(() => {
    if (!showScanner) {
      stopCamera();
    }
  }, [showScanner]);

  // Générer le QR code quand une prescription est sélectionnée pour impression
  useEffect(() => {
    if (prescriptionToPrint && prescriptionToPrint.NUM_PRESCRIPTION) {
      generateQrCode(prescriptionToPrint);
    } else {
      setQrCodeUrl(null);
    }
  }, [prescriptionToPrint]);

  // ==============================
  // IMPRESSION FEUILLE DE SOINS AVEC QR CODE
  // ==============================

  const handlePrintFeuilleSoins = () => {
    const prescriptionData = prescriptionToPrint || {};
    const details = prescriptionData.details || [];
    const patientName = `${prescriptionData.NOM_BEN || 'N/A'} ${prescriptionData.PRE_BEN || ''}`.trim();
    const numero = prescriptionData.NUM_PRESCRIPTION || 'Non spécifié';

    if (!printRef.current) {
      console.error('Ref d\'impression non trouvée');
      setError('Erreur: Contenu d\'impression non disponible');
      return;
    }
    
    setPrinting(true);
    
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      setError('Veuillez autoriser les popups pour imprimer');
      setPrinting(false);
      return;
    }
    
    // Extraire le contenu HTML
    const contentHtml = printContent.innerHTML;
    
    // Créer la page d'impression
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <title>Prescription Médicale - ${prescriptionToPrint?.NUM_PRESCRIPTION || 'Prescription'}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
              line-height: 1.4;
              font-size: 12px;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #2c5aa0;
              padding-bottom: 15px;
              margin-bottom: 20px;
              page-break-after: avoid;
            }
            
            .logo-section {
              flex: 0 0 25%;
            }
            
            .logo {
              max-width: 150px;
              height: auto;
            }
            
            .title-section {
              flex: 1;
              text-align: center;
            }
            
            .title-section h1 {
              color: #2c5aa0;
              margin: 0 0 5px 0;
              font-size: 22px;
              font-weight: bold;
            }
            
            .title-section h2 {
              color: #333;
              margin: 0;
              font-size: 16px;
              font-weight: normal;
            }
            
            .qrcode-section {
              flex: 0 0 25%;
              text-align: right;
            }
            
            .qrcode {
              max-width: 100px;
              height: auto;
              border: 1px solid #ddd;
              padding: 3px;
              background: white;
            }
            
            .section {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            
            .section-title {
              color: #2c5aa0;
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 8px;
              padding-bottom: 3px;
              border-bottom: 1px solid #ddd;
            }
            
            .patient-info, .medical-info {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
              margin-bottom: 12px;
            }
            
            .info-item {
              margin-bottom: 3px;
              font-size: 11px;
            }
            
            .info-label {
              font-weight: bold;
              color: #555;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
              font-size: 10px;
              page-break-inside: avoid;
            }
            
            th {
              background-color: #f0f5ff;
              font-weight: bold;
              padding: 6px;
              border: 1px solid #ccc;
              text-align: left;
            }
            
            td {
              padding: 6px;
              border: 1px solid #ccc;
            }
            
            .total-row {
              font-weight: bold;
              background-color: #f0f7f0;
            }
            
            .total-amount {
              font-size: 14px;
              color: #4CAF50;
              font-weight: bold;
              text-align: right;
            }
            
            .signature-area {
              margin-top: 40px;
              text-align: center;
            }
            
            .signature-line {
              width: 60%;
              margin: 0 auto;
              border-top: 1px solid #000;
              padding-top: 8px;
              font-size: 10px;
            }
            
            .footer {
              margin-top: 25px;
              text-align: center;
              font-size: 9px;
              color: #666;
              border-top: 1px solid #eee;
              padding-top: 8px;
              page-break-before: avoid;
            }
            
            .qr-note {
              font-size: 9px;
              color: #666;
              margin-top: 3px;
              text-align: center;
            }
            
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                margin: 0;
                padding: 0;
              }
              
              .no-print {
                display: none !important;
              }
              
              table {
                page-break-inside: auto;
              }
              
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              
              .header {
                page-break-before: always;
                page-break-after: avoid;
              }
            }
            
            .prescription-number {
              background-color: #f0f5ff;
              padding: 8px;
              border-radius: 4px;
              margin: 10px 0;
              text-align: center;
              border: 1px solid #2c5aa0;
            }
            
            .prescription-number strong {
              font-size: 14px;
              color: #2c5aa0;
            }
            
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 80px;
              color: rgba(44, 90, 160, 0.1);
              z-index: -1;
              font-weight: bold;
              pointer-events: none;
            }
          </style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        
        printWindow.onafterprint = () => {
          printWindow.close();
          setPrinting(false);
        };
        
        // Fallback pour les navigateurs qui ne déclenchent pas onafterprint
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.close();
          }
          setPrinting(false);
        }, 1000);
      }, 500);
    };
  };

  const viewFeuilleSoins = async (prescription) => {
    try {
      setLoading(true);
      
      const identifier = prescription.NUM_PRESCRIPTION || prescription.COD_PRES;
      if (!identifier) {
        setError('Identifiant de prescription manquant');
        setLoading(false);
        return;
      }
      
      console.log('🔍 Recherche prescription pour feuille de soins:', identifier);
      
      const response = await api.prescriptions.getByNumeroOrId(identifier);
      
      console.log('📄 Réponse API feuille de soins:', response);
      
      if (response.success) {
        const prescriptionData = response.prescription || response.data || response;
        const details = response.details || prescriptionData.details || [];
        
        // Détecter si c'est une prescription sans détails
        const hasDefaultDetailOnly = details.length === 1 && 
          (details[0].COD_ELEMENT === 'DEFAULT-001' ||
           details[0].LIBELLE?.includes('Prescription générale sans détails'));
        
        const completePrescription = {
          ...prescription,
          ...prescriptionData,
          details: details,
          hasDefaultDetailOnly: hasDefaultDetailOnly
        };
        
        setPrescriptionToPrint(completePrescription);
        
        // Générer le QR code
        await generateQrCode(completePrescription);
        
        setShowFeuilleSoins(true);
      } else {
        setError(response.message || 'Impossible de charger les détails de la prescription');
      }
    } catch (err) {
      console.error('❌ Erreur détaillée chargement feuille de soins:', err);
      
      if (err.status === 404) {
        setError(`Prescription non trouvée dans le système`);
      } else if (err.message?.includes('Network Error')) {
        setError('Erreur de connexion au serveur');
      } else {
        setError(`Erreur lors du chargement: ${err.message || 'Erreur inconnue'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // CHARGEMENT DES DONNÉES
  // ==============================

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search || '',
        statut: filters.statut || '',
        type_prestation: filters.type_prestation || ''
      };

      if (filters.date_debut && filters.date_debut instanceof Date && !isNaN(filters.date_debut)) {
        params.date_debut = formatDate(filters.date_debut);
      }

      if (filters.date_fin && filters.date_fin instanceof Date && !isNaN(filters.date_fin)) {
        params.date_fin = formatDate(filters.date_fin);
      }

      const response = await api.prescriptions.getAll(params);
      
      if (response.success) {
        setPrescriptions(response.prescriptions);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError('Erreur lors du chargement des prescriptions');
      console.error('Erreur détaillée:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMedecins = async () => {
    try {
      setLoadingData(true);
      const response = await api.consultations.getMedecins();
      
      console.log('🔍 Réponse médecins:', response);
      
      if (response.success && response.medecins) {
        const medecinsList = response.medecins.map(med => ({
          COD_PRE: med.COD_PRE || med.id,
          NOM_PRESTATAIRE: med.NOM_PRESTATAIRE || med.nom || med.NOM_COMPLET,
          PRENOM_PRESTATAIRE: med.PRENOM_PRESTATAIRE || med.prenom,
          NOM_COMPLET: (med.NOM_PRESTATAIRE || '') + ' ' + (med.PRENOM_PRESTATAIRE || ''),
          SPECIALITE: med.SPECIALITE || med.specialite || ''
        }));
        
        setMedecins(medecinsList);
        
        if (medecinsList.length > 0) {
          setSelectedMedecin(medecinsList[0].COD_PRE);
        }
        
        console.log('✅ Médecins chargés:', medecinsList);
      } else {
        console.warn('⚠️ Aucun médecin trouvé ou réponse API invalide');
        setMedecins([]);
      }
    } catch (err) {
      console.error('❌ Erreur chargement médecins:', err);
      
      const medecinsTest = [
        { COD_PRE: 1, NOM_PRESTATAIRE: 'Dupont', PRENOM_PRESTATAIRE: 'Jean', SPECIALITE: 'Généraliste' },
        { COD_PRE: 2, NOM_PRESTATAIRE: 'Martin', PRENOM_PRESTATAIRE: 'Marie', SPECIALITE: 'Pédiatre' },
        { COD_PRE: 3, NOM_PRESTATAIRE: 'Dubois', PRENOM_PRESTATAIRE: 'Pierre', SPECIALITE: 'Chirurgien' }
      ];
      
      setMedecins(medecinsTest);
      if (medecinsTest.length > 0) {
        setSelectedMedecin(medecinsTest[0].COD_PRE);
      }
    } finally {
      setLoadingData(false);
    }
  };

  const loadCentres = async () => {
    try {
      setLoadingData(true);
      const response = await api.centres.getAll();
      if (response.success && response.centres) {
        setCentres(response.centres);
        if (response.centres.length > 0) {
          setSelectedCentre(response.centres[0].COD_CEN);
        }
      }
    } catch (err) {
      console.error('Erreur chargement centres:', err);
      setCentres([]);
    } finally {
      setLoadingData(false);
    }
  };

  const preloadData = async () => {
    try {
      console.log('🔍 Préchargement des données pour la création de prescription...');
      
      if (medecins.length === 0) {
        console.log('📋 Chargement des médecins...');
        await loadMedecins();
      } else {
        console.log('✅ Médecins déjà chargés:', medecins.length);
      }
      
      if (centres.length === 0) {
        console.log('🏥 Chargement des centres...');
        const centresResponse = await api.centres.getAll();
        if (centresResponse.success && centresResponse.centres) {
          setCentres(centresResponse.centres);
          if (centresResponse.centres.length > 0) {
            setSelectedCentre(centresResponse.centres[0].COD_CEN);
          }
        }
        console.log('✅ Centres chargés:', centresResponse.centres?.length || 0);
      }
      
      console.log('✅ Préchargement terminé');
    } catch (error) {
      console.error('❌ Erreur préchargement données:', error);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, [pagination.page, filters]);

  useEffect(() => {
    if (activeTab === 1) {
      preloadData();
    }
  }, [activeTab]);

  // ==============================
  // RECHERCHES
  // ==============================

  const searchPatients = async () => {
    if (!patientSearch || patientSearch.trim().length < 2) {
      setPatients([]);
      return;
    }
    
    try {
      const response = await api.prescriptions.searchPatients(patientSearch);
      if (response.success) {
        setPatients(response.patients || []);
      }
    } catch (err) {
      console.error('Erreur recherche patients:', err);
      setPatients([]);
    }
  };

  const searchElements = async () => {
    if (!elementSearch || elementSearch.trim().length < 2) {
      setElements([]);
      return;
    }
    
    try {
      const response = await api.prescriptions.searchMedicalItems(elementSearch);
      if (response.success) {
        setElements(response.items || []);
      }
    } catch (err) {
      console.error('Erreur recherche éléments:', err);
      setElements([]);
    }
  };

  // ==============================
  // GESTION DES ÉLÉMENTS DE PRESCRIPTION
  // ==============================

  const addElement = (element) => {
    if (!element.id || String(element.id).trim() === '') {
      setError('Cet élément n\'a pas de code valide. Veuillez en sélectionner un autre dans la base de données.');
      setSearchElementDialog(false);
      return;
    }
    
    const newDetail = {
      type_element: element.type || 'medicament',
      cod_element: String(element.id).trim(),
      libelle: element.libelle || 'Élément non spécifié',
      quantite: 1,
      posologie: '',
      duree_traitement: element.type === 'medicament' ? 7 : null,
      unite: element.type === 'medicament' ? 'boîte' : 'unité',
      prix_unitaire: element.prix || 0,
      remboursable: element.remboursable || 1,
      taux_prise_en_charge: 80
    };
    
    setDetails([...details, newDetail]);
    setSearchElementDialog(false);
    setElementSearch('');
    setElements([]);
  };

  const updateElement = (index, field, value) => {
    const newDetails = [...details];
    
    if (field === 'quantite') {
      newDetails[index].quantite = Math.max(0.1, parseFloat(value) || 1);
    } else if (field === 'prix_unitaire') {
      newDetails[index].prix_unitaire = Math.max(0, parseFloat(value) || 0);
    } else if (field === 'duree_traitement') {
      newDetails[index].duree_traitement = value ? parseInt(value) : null;
    } else {
      newDetails[index][field] = value;
    }
    
    setDetails(newDetails);
  };

  const removeElement = (index) => {
    const newDetails = [...details];
    newDetails.splice(index, 1);
    setDetails(newDetails);
  };

  // ==============================
  // CRÉATION DE PRESCRIPTION
  // ==============================

  const createPrescription = async () => {
    if (!patient || !patient.id) {
      setError('Veuillez sélectionner un patient valide');
      return;
    }

    if (!typePrestation) {
      setError('Veuillez sélectionner le type de prestation');
      return;
    }

    // Valider les détails uniquement si on a choisi de les remplir
    if (remplirDetails) {
      if (details.length === 0) {
        setError('Veuillez ajouter au moins un élément à la prescription');
        return;
      }

      const invalidDetails = [];
      details.forEach((detail, index) => {
        if (!detail.cod_element || detail.cod_element.trim() === '') {
          invalidDetails.push({
            index: index + 1,
            element: detail.libelle,
            reason: 'Code d\'élément manquant ou invalide'
          });
        } else if (typeof detail.cod_element !== 'string') {
          invalidDetails.push({
            index: index + 1,
            element: detail.libelle,
            reason: 'Code d\'élément doit être une chaîne de caractères'
          });
        }
        
        if (detail.quantite && (isNaN(parseFloat(detail.quantite)) || parseFloat(detail.quantite) <= 0)) {
          invalidDetails.push({
            index: index + 1,
            element: detail.libelle,
            reason: 'Quantité invalide'
          });
        }
        
        if (detail.prix_unitaire && (isNaN(parseFloat(detail.prix_unitaire)) || parseFloat(detail.prix_unitaire) < 0)) {
          invalidDetails.push({
            index: index + 1,
            element: detail.libelle,
            reason: 'Prix unitaire invalide'
          });
        }
      });

      if (invalidDetails.length > 0) {
        const errorMessage = `Certains éléments sont invalides:\n${invalidDetails.map(d => 
          `• Élément ${d.index} (${d.element}): ${d.reason}`
        ).join('\n')}`;
        setError(errorMessage);
        return;
      }
    }

    if (!selectedMedecin && typePrestation !== 'Pharmacie') {
      setError('Veuillez sélectionner un médecin prescripteur');
      return;
    }

    if (!selectedCentre) {
      setError('Veuillez sélectionner un centre de santé');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // DÉFINIR prescriptionData D'ABORD
      const prescriptionData = {
        COD_BEN: patient.id,
        COD_PRE: selectedMedecin || null,
        COD_CEN: selectedCentre || null,
        TYPE_PRESTATION: typePrestation,
        OBSERVATIONS: observations.substring(0, 500) || '',
        ORIGINE: 'Electronique',
        DATE_VALIDITE: dateValidite && !isNaN(new Date(dateValidite)) 
          ? new Date(dateValidite).toISOString().split('T')[0]
          : null,
        AVEC_DETAILS: remplirDetails ? 1 : 0
      };

      // MAINTENANT on peut utiliser prescriptionData
      if (!remplirDetails) {
        // Créer un détail par défaut avec les informations minimales
        prescriptionData.details = [{
          TYPE_ELEMENT: 'MEDICAMENT',
          COD_ELEMENT: 'DEFAULT-001',
          LIBELLE: 'Prescription générale sans détails spécifiés',
          QUANTITE: 1,
          POSOLOGIE: 'À déterminer par le prestataire',
          DUREE_TRAITEMENT: null,
          UNITE: 'unité',
          PRIX_UNITAIRE: 0,
          MONTANT_TOTAL: 0,
          REMBOURSABLE: 0,
          TAUX_PRISE_EN_CHARGE: 0,
          ORDRE: 1
        }];
        prescriptionData.MONTANT_TOTAL = 0;
      } else if (details.length > 0) {
        // Utiliser les détails fournis par l'utilisateur
        prescriptionData.details = details.map((d, index) => {
          const codElement = String(d.cod_element).trim();
          const libelle = String(d.libelle || 'Élément non spécifié').trim().substring(0, 200);
          const quantite = Math.max(0.1, parseFloat(d.quantite) || 1);
          const prixUnitaire = Math.max(0, parseFloat(d.prix_unitaire) || 0);
          const tauxPriseEnCharge = Math.min(100, Math.max(0, parseFloat(d.taux_prise_en_charge) || 80));
          const montantTotal = quantite * prixUnitaire;
          
          return {
            TYPE_ELEMENT: String(d.type_element || 'medicament').toUpperCase(),
            COD_ELEMENT: codElement,
            LIBELLE: libelle,
            QUANTITE: quantite,
            POSOLOGIE: String(d.posologie || '').trim().substring(0, 500),
            DUREE_TRAITEMENT: d.duree_traitement ? parseInt(d.duree_traitement) : null,
            UNITE: String(d.unite || 'unité').trim().substring(0, 50),
            PRIX_UNITAIRE: prixUnitaire,
            MONTANT_TOTAL: montantTotal,
            REMBOURSABLE: d.remboursable ? 1 : 0,
            TAUX_PRISE_EN_CHARGE: tauxPriseEnCharge,
            ORDRE: index + 1
          };
        });

        const montantTotalPrescription = prescriptionData.details.reduce(
          (sum, detail) => sum + (detail.QUANTITE * detail.PRIX_UNITAIRE), 
          0
        );
        prescriptionData.MONTANT_TOTAL = montantTotalPrescription;
      } else {
        // Ce cas ne devrait pas se produire car on a déjà validé remplirDetails && details.length === 0
        setError('Veuillez ajouter au moins un élément à la prescription');
        setLoading(false);
        return;
      }

      const response = await api.prescriptions.create(prescriptionData);
      
      if (response.success) {
        const successMessage = response.numero 
          ? `Prescription créée avec succès : ${response.numero}`
          : response.prescriptionId
          ? `Prescription créée avec succès (ID: ${response.prescriptionId})`
          : 'Prescription créée avec succès';
        
        setSuccess(successMessage);
        
        // Préparer les données pour la feuille de soins
        const prescriptionWithDetails = {
          ...prescriptionData,
          NUM_PRESCRIPTION: response.numero || `PRES-${new Date().getFullYear()}-${response.prescriptionId}`,
          NOM_BEN: patient.nom,
          PRE_BEN: patient.prenom,
          SEX_BEN: patient.sexe,
          AGE: patient.age,
          IDENTIFIANT_NATIONAL: patient.identifiant,
          NOM_CENTRE: centres.find(c => c.COD_CEN === selectedCentre)?.NOM_CENTRE || 'Centre médical',
          NOM_PRESTATAIRE: medecins.find(m => m.COD_PRE === selectedMedecin)?.NOM_PRESTATAIRE || 'Médecin',
          PRENOM_PRESTATAIRE: medecins.find(m => m.COD_PRE === selectedMedecin)?.PRENOM_PRESTATAIRE || '',
          DATE_PRESCRIPTION: new Date().toISOString().split('T')[0],
          STATUT: 'En attente'
        };
        
        setPrescriptionToPrint(prescriptionWithDetails);
        
        // Générer le QR code
        await generateQrCode(prescriptionWithDetails);
        
        // Afficher la feuille de soins
        setTimeout(() => {
          setShowFeuilleSoins(true);
        }, 500);
        
        resetCreationForm();
        loadPrescriptions();
        
        setTimeout(() => {
          setActiveTab(0);
        }, 2000);
      } else {
        let errorMessage = response.message || 'Erreur lors de la création';
        let errorDetails = '';
        
        if (response.message) {
          if (response.message.includes('Médecin non trouvé')) {
            errorMessage = 'Aucun médecin actif trouvé';
            errorDetails = 'Le médecin sélectionné n\'existe pas ou est inactif.';
          } else if (response.message.includes('Patient non trouvé')) {
            errorMessage = 'Patient non trouvé';
            errorDetails = 'Veuillez recharger la liste des patients.';
          } else if (response.message.includes('COD_ELEMENT')) {
            errorMessage = 'Erreur de validation des éléments';
            errorDetails = 'Un ou plusieurs codes d\'éléments sont invalides.';
          }
        }
        
        const fullErrorMessage = errorDetails ? `${errorMessage}\n\n${errorDetails}` : errorMessage;
        setError(fullErrorMessage);
      }
    } catch (err) {
      console.error('❌ Erreur création prescription:', err);
      
      if (err.message?.includes('Network Error') || err.isNetworkError) {
        setError('Erreur réseau: Impossible de se connecter au serveur.');
      } else if (err.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else if (err.status === 404) {
        setError('Service non trouvé. Contactez l\'équipe technique.');
      } else if (err.status === 500) {
        setError('Erreur serveur. Veuillez réessayer plus tard.');
      } else if (err.message?.includes('COD_ELEMENT')) {
        setError('Erreur de validation des codes d\'éléments.');
      } else {
        setError(`Erreur lors de la création: ${err.message || 'Erreur inconnue'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetCreationForm = () => {
    setPatient(null);
    setPatientSearch('');
    setTypePrestation('');
    setObservations('');
    setDateValidite(null);
    setDetails([]);
    setRemplirDetails(true);
    setIsEditing(false);
    setEditingPrescriptionId(null);
    if (medecins.length > 0) {
      setSelectedMedecin(medecins[0].COD_PRE);
    }
    if (centres.length > 0) {
      setSelectedCentre(centres[0].COD_CEN);
    }
  };

  // ==============================
  // MODIFICATION DES DÉTAILS D'UNE PRESCRIPTION EXISTANTE
  // ==============================

  const startEditingPrescription = async (prescription) => {
    try {
      setLoading(true);
      
      const response = await api.prescriptions.getById(prescription.COD_PRES);
      
      if (response.success) {
        const prescriptionData = response.prescription;
        
        setEditingPrescriptionId(prescription.COD_PRES);
        setIsEditing(true);
        
        setPatient({
          id: prescription.COD_BEN,
          nom: prescription.NOM_BEN,
          prenom: prescription.PRE_BEN
        });
        
        setTypePrestation(prescription.TYPE_PRESTATION);
        setObservations(prescription.OBSERVATIONS || '');
        setDateValidite(prescription.DATE_VALIDITE ? new Date(prescription.DATE_VALIDITE) : null);
        setSelectedMedecin(prescription.COD_PRE || '');
        setSelectedCentre(prescription.COD_CEN || '');
        
        if (prescriptionData.details && prescriptionData.details.length > 0) {
          const formattedDetails = prescriptionData.details.map(detail => ({
            type_element: detail.TYPE_ELEMENT?.toLowerCase() || 'medicament',
            cod_element: detail.COD_ELEMENT || '',
            libelle: detail.LIBELLE || '',
            quantite: detail.QUANTITE || 1,
            posologie: detail.POSOLOGIE || '',
            duree_traitement: detail.DUREE_TRAITEMENT || null,
            unite: detail.UNITE || 'unité',
            prix_unitaire: detail.PRIX_UNITAIRE || 0,
            remboursable: detail.REMBOURSABLE || 1,
            taux_prise_en_charge: detail.TAUX_PRISE_EN_CHARGE || 80
          }));
          setDetails(formattedDetails);
          setRemplirDetails(true);
        } else {
          setDetails([]);
          setRemplirDetails(false);
        }
        
        setActiveTab(1);
        setSuccess('Vous pouvez maintenant modifier les détails de cette prescription');
      } else {
        setError('Impossible de charger les détails de la prescription');
      }
    } catch (err) {
      console.error('❌ Erreur chargement prescription pour édition:', err);
      setError('Erreur lors du chargement de la prescription pour édition');
    } finally {
      setLoading(false);
    }
  };

  const updatePrescription = async () => {
    if (!editingPrescriptionId) {
      setError('Aucune prescription en cours de modification');
      return;
    }

    try {
      setLoading(true);
      
      // DÉFINIR updateData D'ABORD
      const updateData = {
        AVEC_DETAILS: remplirDetails ? 1 : 0
      };

      // MAINTENANT ajouter les détails
      if (!remplirDetails) {
        updateData.details = [{
          TYPE_ELEMENT: 'MEDICAMENT',
          COD_ELEMENT: 'DEFAULT-001',
          LIBELLE: 'Prescription générale sans détails spécifiés',
          QUANTITE: 1,
          POSOLOGIE: 'À déterminer par le prestataire',
          DUREE_TRAITEMENT: null,
          UNITE: 'unité',
          PRIX_UNITAIRE: 0,
          MONTANT_TOTAL: 0,
          REMBOURSABLE: 0,
          TAUX_PRISE_EN_CHARGE: 0,
          ORDRE: 1
        }];
      } else if (details.length > 0) {
        updateData.details = details.map((d, index) => {
          const codElement = String(d.cod_element).trim();
          const libelle = String(d.libelle || 'Élément non spécifié').trim().substring(0, 200);
          const quantite = Math.max(0.1, parseFloat(d.quantite) || 1);
          const prixUnitaire = Math.max(0, parseFloat(d.prix_unitaire) || 0);
          const tauxPriseEnCharge = Math.min(100, Math.max(0, parseFloat(d.taux_prise_en_charge) || 80));
          const montantTotal = quantite * prixUnitaire;
          
          return {
            TYPE_ELEMENT: String(d.type_element || 'medicament').toUpperCase(),
            COD_ELEMENT: codElement,
            LIBELLE: libelle,
            QUANTITE: quantite,
            POSOLOGIE: String(d.posologie || '').trim().substring(0, 500),
            DUREE_TRAITEMENT: d.duree_traitement ? parseInt(d.duree_traitement) : null,
            UNITE: String(d.unite || 'unité').trim().substring(0, 50),
            PRIX_UNITAIRE: prixUnitaire,
            MONTANT_TOTAL: montantTotal,
            REMBOURSABLE: d.remboursable ? 1 : 0,
            TAUX_PRISE_EN_CHARGE: tauxPriseEnCharge,
            ORDRE: index + 1
          };
        });
      } else {
        setError('Veuillez ajouter au moins un élément à la prescription');
        setLoading(false);
        return;
      }

      const response = await api.prescriptions.updateDetails(editingPrescriptionId, updateData);
      
      if (response.success) {
        setSuccess('Détails de la prescription mis à jour avec succès');
        loadPrescriptions();
        resetCreationForm();
        setTimeout(() => {
          setActiveTab(0);
        }, 2000);
      } else {
        setError(response.message || 'Erreur lors de la mise à jour des détails');
      }
    } catch (err) {
      console.error('❌ Erreur mise à jour détails:', err);
      setError('Erreur lors de la mise à jour des détails de la prescription');
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // EXÉCUTION DE PRESCRIPTION
  // ==============================
  
  const searchPrescription = async () => {
    if (!prescriptionSearch || prescriptionSearch.trim() === '') {
      setError('Veuillez entrer un numéro de prescription');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSelectedPrescription(null);
      setExecutionDetails([]);
      
      console.log('🔍 Recherche prescription:', prescriptionSearch);
      
      const cleanedSearch = prescriptionSearch.trim().toUpperCase();
      
      const response = await api.prescriptions.getByNumeroOrId(cleanedSearch);
      
      console.log('📄 Réponse API:', response);
      
      if (response.success) {
        if (response.prescription || response.data) {
          const prescriptionData = response.prescription || response.data;
          
          setSelectedPrescription(prescriptionData);
          
          const details = response.details || prescriptionData.details || [];
          
          console.log('📋 Détails récupérés:', details);
          
          if (details.length > 0) {
            const formattedDetails = details.map(detail => {
              const quantite = detail.QUANTITE || detail.quantite || 0;
              const statutExecution = detail.STATUT_EXECUTION || detail.statut_execution || 'A executer';
              const prixUnitaire = detail.PRIX_UNITAIRE || detail.prix_unitaire || 0;
              const unite = detail.UNITE || detail.unite || 'unité';
              const posologie = detail.POSOLOGIE || detail.posologie || '';
              
              return {
                ...detail,
                COD_PRES_DET: detail.COD_PRES_DET || detail.cod_pres_det || detail.id,
                LIBELLE: detail.LIBELLE || detail.libelle || 'Élément non spécifié',
                QUANTITE: quantite,
                PRIX_UNITAIRE: prixUnitaire,
                UNITE: unite,
                POSOLOGIE: posologie,
                STATUT_EXECUTION: statutExecution,
                quantite_executee: statutExecution === 'Execute' ? quantite : 0,
                canExecute: statutExecution !== 'Execute' && statutExecution !== 'Annule'
              };
            });
            
            setExecutionDetails(formattedDetails);
            setSuccess(`Prescription trouvée: ${prescriptionData.NUM_PRESCRIPTION || cleanedSearch}`);
          } else {
            setError('Prescription trouvée mais aucun détail disponible');
          }
        } else {
          setError('Prescription trouvée mais sans données');
        }
      } else {
        const errorMessage = response.message || 'Prescription non trouvée';
        setError(`Erreur: ${errorMessage}`);
      }
    } catch (err) {
      console.error('❌ Erreur recherche prescription:', err);
      
      if (err.status === 404) {
        setError(`Prescription "${prescriptionSearch}" non trouvée. Vérifiez le numéro.`);
      } else if (err.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else if (err.status === 500) {
        setError('Erreur serveur. Veuillez réessayer plus tard.');
      } else if (err.message?.includes('Network')) {
        setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
      } else {
        setError(`Erreur lors de la recherche: ${err.message || 'Erreur inconnue'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const executePrescription = async () => {
    if (!selectedPrescription) {
      setError('Aucune prescription sélectionnée');
      return;
    }

    const detailsToExecute = executionDetails
      .filter(detail => detail.quantite_executee > 0 && detail.canExecute)
      .map(detail => ({
        cod_pres_det: detail.COD_PRES_DET,
        quantite_executee: detail.quantite_executee,
        libelle: detail.LIBELLE
      }));

    if (detailsToExecute.length === 0) {
      setError('Veuillez sélectionner au moins un élément à exécuter');
      return;
    }

    const invalidDetails = detailsToExecute.filter(detail => {
      const originalDetail = executionDetails.find(d => d.COD_PRES_DET === detail.cod_pres_det);
      return detail.quantite_executee > (originalDetail?.QUANTITE || 0);
    });

    if (invalidDetails.length > 0) {
      setError(`Quantités invalides pour: ${invalidDetails.map(d => d.libelle).join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Exécution prescription:', selectedPrescription.COD_PRES);
      console.log('📋 Détails à exécuter:', detailsToExecute);
      
      const response = await api.prescriptions.execute(
        selectedPrescription.COD_PRES,
        {
          details: detailsToExecute,
          cod_executant: 1,
          cod_cen: selectedPrescription.COD_CEN || 1,
          date_execution: new Date().toISOString().split('T')[0]
        }
      );

      console.log('✅ Réponse exécution:', response);

      if (response.success) {
        setSuccess('Prescription exécutée avec succès');
        
        await searchPrescription();
        loadPrescriptions();
        
        setTimeout(() => {
          setSelectedPrescription(null);
          setPrescriptionSearch('');
          setExecutionDetails([]);
        }, 2000);
      } else {
        setError(response.message || "Erreur lors de l'exécution");
      }
    } catch (err) {
      console.error('❌ Erreur exécution prescription:', err);
      
      if (err.response?.data?.message) {
        setError(`Erreur d'exécution: ${err.response.data.message}`);
      } else if (err.message?.includes('Network')) {
        setError('Erreur réseau. Vérifiez votre connexion.');
      } else {
        setError("Erreur lors de l'exécution de la prescription");
      }
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // COMPOSANTS RÉUTILISABLES
  // ==============================

  const StatusChip = ({ statut }) => {
    const status = getStatusColor(statut);
    return (
      <Chip
        className="status-chip"
        size="small"
        label={statut}
        icon={status.icon}
        sx={{ 
          fontWeight: 500,
          background: status.gradient,
          color: 'white',
          '& .MuiChip-icon': { color: 'white' }
        }}
      />
    );
  };

  const LoadingSpinner = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
      <div className="pulse-loader">
        <div></div>
        <div></div>
      </div>
    </Box>
  );

  // ==============================
  // RENDU PRINCIPAL
  // ==============================

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box 
        className="prescriptions-container"
        sx={{ 
          p: { xs: 2, md: 3 },
          minHeight: '100vh'
        }}
      >
        {/* Header avec effet glassmorphism */}
        <Box 
          className="glass-header hover-lift"
          sx={{ 
            mb: 4,
            p: 3,
            borderRadius: 3,
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Avatar className="halo-avatar" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <PrescriptionIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 600 }} className="typewriter-title">
                  Gestion des Prescriptions
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Créez, gérez et exécutez les prescriptions médicales
                </Typography>
              </Box>
            </Box>
            <Badge 
              className="notification-badge"
              color="error" 
              variant="dot"
              invisible={!hasNewPrescriptions}
            >
              <IconButton className="glow-on-hover" sx={{ color: 'white' }}>
                <NotificationIcon />
              </IconButton>
            </Badge>
          </Box>
        </Box>

        {/* Messages d'alerte */}
        <Fade in={!!error}>
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              borderRadius: 2,
              animation: 'slide-in-right 0.3s ease-out'
            }}
            onClose={() => setError(null)}
            icon={<WarningIcon />}
          >
            {error}
          </Alert>
        </Fade>

        <Fade in={!!success}>
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2, 
              borderRadius: 2,
              animation: 'slide-in-right 0.3s ease-out'
            }}
            onClose={() => setSuccess(null)}
            icon={<CheckIcon />}
          >
            {success}
          </Alert>
        </Fade>

        {/* Tabs */}
        <Paper 
          className="prescription-card"
          sx={{ 
            mb: 4, 
            borderRadius: 3,
            overflow: 'hidden'
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={(e, v) => setActiveTab(v)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                py: 2,
                fontWeight: 600,
                fontSize: '0.95rem',
                transition: 'var(--transition-smooth)',
                '&.Mui-selected': {
                  color: '#667eea',
                  transform: 'translateY(-2px)'
                }
              },
              '& .MuiTabs-indicator': {
                height: 3,
                background: 'var(--primary-gradient)'
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} className="hover-lift">
                  <PrescriptionIcon />
                  Liste des Prescriptions
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} className="hover-lift">
                  {isEditing ? <EditNoteIcon /> : <AddIcon />}
                  {isEditing ? 'Modifier Détails' : 'Nouvelle Prescription'}
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} className="hover-lift">
                  <ExecuteIcon />
                  Exécuter Prescription
                </Box>
              } 
            />
          </Tabs>
        </Paper>

        {/* TAB 1: Liste des prescriptions */}
        {activeTab === 0 && (
          <Slide direction="right" in={activeTab === 0}>
            <Box>
              {/* Filtres */}
              <Card 
                className="prescription-card info-card"
                sx={{ 
                  mb: 4, 
                  borderRadius: 3
                }}
              >
                <CardContent>
                  <Box className="info-card-icon">
                    <FilterIcon sx={{ fontSize: 40, color: '#667eea' }} />
                  </Box>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <TextField
                        className="animated-input"
                        fullWidth
                        label="Rechercher..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon className="glow-on-hover" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={toggleScanner}
                                className="glow-on-hover"
                                sx={{ color: '#667eea' }}
                                title="Scanner un QR Code"
                                size="small"
                              >
                                <QrCodeScannerIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 2 }
                        }}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth variant="outlined" sx={{ borderRadius: 2 }}>
                        <InputLabel>Statut</InputLabel>
                        <Select
                          value={filters.statut}
                          label="Statut"
                          onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="">Tous</MenuItem>
                          <MenuItem value="En attente">En attente</MenuItem>
                          <MenuItem value="En cours">En cours</MenuItem>
                          <MenuItem value="Executee">Exécutée</MenuItem>
                          <MenuItem value="Annulee">Annulée</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth variant="outlined" sx={{ borderRadius: 2 }}>
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={filters.type_prestation}
                          label="Type"
                          onChange={(e) => setFilters({ ...filters, type_prestation: e.target.value })}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="">Tous</MenuItem>
                          {typesPrestation.map(type => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <DatePicker
                        label="Date début"
                        value={filters.date_debut}
                        onChange={(date) => setFilters({ ...filters, date_debut: date })}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            className="animated-input"
                            fullWidth 
                            variant="outlined" 
                            sx={{ borderRadius: 2 }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <DatePicker
                        label="Date fin"
                        value={filters.date_fin}
                        onChange={(date) => setFilters({ ...filters, date_fin: date })}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            className="animated-input"
                            fullWidth 
                            variant="outlined" 
                            sx={{ borderRadius: 2 }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <Button
                        className="gradient-button"
                        fullWidth
                        variant="contained"
                        onClick={loadPrescriptions}
                        disabled={loading}
                        sx={{
                          height: '56px',
                          borderRadius: 2,
                          '&:hover': {
                            transform: 'translateY(-3px)'
                          }
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : <FilterIcon />}
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Tableau des prescriptions */}
              {loading ? (
                <LoadingSpinner />
              ) : (
                <Card 
                  className="prescription-card"
                  sx={{ 
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}
                >
                  <TableContainer>
                    <Table>
                      <TableHead sx={{ 
                        bgcolor: alpha('#667eea', 0.05),
                        '& th': { fontWeight: 600 }
                      }}>
                        <TableRow>
                          <TableCell>Numéro</TableCell>
                          <TableCell>Patient</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Statut</TableCell>
                          <TableCell>Montant</TableCell>
                          <TableCell>Détails</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {prescriptions.map((prescription) => {
                          const hasDetails = prescription.NB_DETAILS > 0 || 
                                            (prescription.details && prescription.details.length > 0);
                          
                          return (
                            <TableRow 
                              key={prescription.COD_PRES}
                              className="animated-table-row"
                              hover
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold" className="text-gradient">
                                  {prescription.NUM_PRESCRIPTION}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Avatar className="halo-avatar" sx={{ width: 32, height: 32, bgcolor: alpha('#667eea', 0.1) }}>
                                      <PersonIcon fontSize="small" />
                                    </Avatar>
                                    <Typography variant="body2">
                                      {prescription.NOM_BEN} {prescription.PRE_BEN}
                                    </Typography>
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {prescription.IDENTIFIANT_NATIONAL} • {prescription.AGE} ans
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const type = typesPrestation.find(t => t.value === prescription.TYPE_PRESTATION);
                                  return (
                                    <Chip
                                      size="small"
                                      label={prescription.TYPE_PRESTATION}
                                      icon={type?.icon}
                                      sx={{
                                        bgcolor: type?.bgColor,
                                        color: type?.color,
                                        fontWeight: 500
                                      }}
                                      className="status-chip"
                                    />
                                  );
                                })()}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatDateDisplay(prescription.DATE_PRESCRIPTION)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <StatusChip statut={prescription.STATUT} />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                  {prescription.MONTANT_TOTAL?.toLocaleString('fr-FR')} FCFA
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={hasDetails ? "Complets" : "À compléter"}
                                  color={hasDetails ? "success" : "warning"}
                                  variant="outlined"
                                  sx={{ fontWeight: 500 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1}>
                                  {!hasDetails && (
                                    <Tooltip title="Ajouter/modifier les détails">
                                      <IconButton 
                                        size="small"
                                        className="glow-on-hover"
                                        onClick={() => startEditingPrescription(prescription)}
                                        color="primary"
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  
                                  {prescription.STATUT === 'En attente' && (
                                    <Tooltip title="Exécuter">
                                      <IconButton 
                                        size="small" 
                                        className="glow-on-hover"
                                        onClick={() => {
                                          setPrescriptionSearch(prescription.NUM_PRESCRIPTION);
                                          setActiveTab(2);
                                        }}
                                      >
                                        <ExecuteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              )}

              {/* Pagination */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {pagination.total} prescriptions au total
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    startIcon={<ChevronRightIcon sx={{ transform: 'rotate(180deg)' }} />}
                    sx={{ borderRadius: 2 }}
                    className="hover-lift"
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    endIcon={<ChevronRightIcon />}
                    sx={{ borderRadius: 2 }}
                    className="hover-lift"
                  >
                    Suivant
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Slide>
        )}

        {/* TAB 2: Création/Modification de prescription */}
        {activeTab === 1 && (
          <Slide direction="right" in={activeTab === 1}>
            <Box className="mobile-slide-in">
              <Grid container spacing={3}>
                {/* Informations Patient */}
                <Grid item xs={12} md={8}>
                  <Card 
                    className="prescription-card hover-lift"
                    sx={{ 
                      borderRadius: 3
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }} className="text-gradient">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon />
                          Informations Patient
                        </Box>
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              className="animated-input"
                              fullWidth
                              label="Rechercher patient"
                              value={patientSearch}
                              onChange={(e) => setPatientSearch(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <SearchIcon />
                                  </InputAdornment>
                                ),
                                sx: { borderRadius: 2 }
                              }}
                              variant="outlined"
                              disabled={isEditing}
                            />
                            <Button
                              className="gradient-button"
                              variant="contained"
                              onClick={() => setSearchPatientDialog(true)}
                              sx={{ borderRadius: 2 }}
                              disabled={isEditing}
                            >
                              Rechercher
                            </Button>
                          </Box>
                          {patient && (
                            <Box 
                              className="prescription-card"
                              sx={{ 
                                mt: 2, 
                                p: 2, 
                                borderRadius: 2,
                                bgcolor: alpha('#4CAF50', 0.05),
                                border: `1px solid ${alpha('#4CAF50', 0.2)}`
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Avatar className="halo-avatar" sx={{ bgcolor: alpha('#4CAF50', 0.1) }}>
                                  <PersonIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight={600}>
                                    {patient.nom} {patient.prenom}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {patient.sexe === 'M' ? 'Homme' : 'Femme'} • {patient.age} ans
                                  </Typography>
                                </Box>
                              </Box>
                              <Typography variant="caption" display="block" color="text.secondary">
                                ID: {patient.identifiant}
                              </Typography>
                              {!isEditing && (
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => setPatient(null)}
                                  sx={{ mt: 1 }}
                                  className="hover-lift"
                                >
                                  Changer de patient
                                </Button>
                              )}
                            </Box>
                          )}
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth variant="outlined" sx={{ borderRadius: 2 }}>
                            <InputLabel>Type de prestation</InputLabel>
                            <Select
                              value={typePrestation}
                              label="Type de prestation"
                              onChange={(e) => setTypePrestation(e.target.value)}
                              sx={{ borderRadius: 2 }}
                              className="animated-input"
                              disabled={isEditing}
                            >
                              {typesPrestation.map(type => (
                                <MenuItem key={type.value} value={type.value}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {type.icon}
                                    {type.label}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <DatePicker
                            label="Date de validité"
                            value={dateValidite}
                            onChange={setDateValidite}
                            renderInput={(params) => (
                              <TextField 
                                {...params} 
                                className="animated-input"
                                fullWidth 
                                variant="outlined" 
                                sx={{ borderRadius: 2 }}
                            />
                            )}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            className="animated-input"
                            fullWidth
                            multiline
                            rows={3}
                            label="Observations"
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            variant="outlined"
                            sx={{ borderRadius: 2 }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Informations Médicales */}
                <Grid item xs={12} md={4}>
                  <Card 
                    className="prescription-card hover-lift"
                    sx={{ 
                      borderRadius: 3
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }} className="text-gradient">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MedicalIcon />
                          Informations Médicales
                        </Box>
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Box sx={{ mb: 2 }}>
                            <FormControl component="fieldset" fullWidth>
                              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 500 }}>
                                Renseigner les détails de la prescription ?
                              </FormLabel>
                              <RadioGroup
                                row
                                value={remplirDetails}
                                onChange={(e) => setRemplirDetails(e.target.value === 'true')}
                              >
                                <FormControlLabel 
                                  value={true} 
                                  control={<Radio />} 
                                  label="Oui" 
                                />
                                <FormControlLabel 
                                  value={false} 
                                  control={<Radio />} 
                                  label="Non" 
                                />
                              </RadioGroup>
                            </FormControl>
                            
                            {!remplirDetails && (
                              <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                                La prescription sera créée sans détails. Vous pourrez les ajouter ultérieurement.
                              </Alert>
                            )}
                          </Box>
                        </Grid>

                        <Grid item xs={12}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom color="text.secondary">
                              Médecin prescripteur
                            </Typography>
                            
                            {loadingData ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                                <div className="wave-loader">
                                  <div></div>
                                  <div></div>
                                  <div></div>
                                </div>
                                <Typography variant="body2">Chargement des médecins...</Typography>
                              </Box>
                            ) : medecins.length === 0 ? (
                              <Alert severity="warning" sx={{ borderRadius: 2, mb: 1 }}>
                                Aucun médecin disponible. Vérifiez la base de données.
                              </Alert>
                            ) : (
                              <FormControl fullWidth variant="outlined" sx={{ borderRadius: 2 }}>
                                <InputLabel id="medecin-label">Médecin prescripteur</InputLabel>
                                <Select
                                  className="animated-input"
                                  labelId="medecin-label"
                                  value={selectedMedecin || ''}
                                  label="Médecin prescripteur"
                                  onChange={(e) => {
                                    console.log('Médecin sélectionné:', e.target.value);
                                    setSelectedMedecin(e.target.value);
                                  }}
                                  sx={{ borderRadius: 2 }}
                                >
                                  <MenuItem value="">
                                    <em>Sélectionner un médecin...</em>
                                  </MenuItem>
                                  {medecins.map((med, index) => {
                                    const label = `${med.NOM_PRESTATAIRE || 'Médecin'} ${med.PRENOM_PRESTATAIRE || ''}${med.SPECIALITE ? ` - ${med.SPECIALITE}` : ''}`;
                                    
                                    return (
                                      <MenuItem key={med.COD_PRE || `med-${index}`} value={med.COD_PRE || ''}>
                                        {label}
                                      </MenuItem>
                                    );
                                  })}
                                </Select>
                              </FormControl>
                            )}
                            
                            {selectedMedecin && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Médecin sélectionné: {selectedMedecin}
                              </Typography>
                            )}
                          </Box>
                        </Grid>

                        <Grid item xs={12}>
                          <FormControl fullWidth variant="outlined" sx={{ borderRadius: 2 }}>
                            <InputLabel>Centre de santé</InputLabel>
                            <Select
                              className="animated-input"
                              value={selectedCentre || ''}
                              label="Centre de santé"
                              onChange={(e) => setSelectedCentre(e.target.value)}
                              disabled={loadingData || centres.length === 0}
                              sx={{ borderRadius: 2 }}
                            >
                              <MenuItem value="">
                                <em>Aucun centre sélectionné</em>
                              </MenuItem>
                              {centres.map(centre => (
                                <MenuItem key={centre.COD_CEN} value={centre.COD_CEN}>
                                  {centre.NOM_CENTRE} 
                                  {centre.TYPE_CENTRE && ` - ${centre.TYPE_CENTRE}`}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Éléments de la prescription (affichés uniquement si remplirDetails est true) */}
                {remplirDetails && (
                  <Grid item xs={12}>
                    <Card 
                      className="prescription-card hover-lift"
                      sx={{ 
                        borderRadius: 3
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }} className="text-gradient">
                            Éléments de la prescription
                          </Typography>
                          <Button
                            className="gradient-button"
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setSearchElementDialog(true)}
                            disabled={!patient}
                            sx={{
                              borderRadius: 2
                            }}
                          >
                            Rechercher un élément
                          </Button>
                        </Box>

                        {details.length === 0 ? (
                          <Alert 
                            severity="info" 
                            sx={{ 
                              borderRadius: 2,
                              bgcolor: alpha('#2196F3', 0.05)
                            }}
                            icon={<PrescriptionIcon />}
                          >
                            Aucun élément ajouté. Cliquez sur "Rechercher un élément" pour commencer.
                          </Alert>
                        ) : (
                          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table>
                              <TableHead sx={{ bgcolor: alpha('#667eea', 0.05), '& th': { fontWeight: 600 } }}>
                                <TableRow>
                                  <TableCell>Type</TableCell>
                                  <TableCell>Libellé</TableCell>
                                  <TableCell>Quantité</TableCell>
                                  <TableCell>Posologie</TableCell>
                                  <TableCell>Durée (jours)</TableCell>
                                  <TableCell>Prix unitaire (FCFA)</TableCell>
                                  <TableCell>Montant (FCFA)</TableCell>
                                  <TableCell>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {details.map((detail, index) => (
                                  <TableRow key={index} className="animated-table-row">
                                    <TableCell>
                                      <Chip
                                        className="status-chip"
                                        size="small"
                                        label={detail.type_element === 'medicament' ? 'Médicament' : 'Acte'}
                                        color={detail.type_element === 'medicament' ? 'primary' : 'secondary'}
                                        sx={{ fontWeight: 500 }}
                                      />
                                    </TableCell>
                                    <TableCell>{detail.libelle}</TableCell>
                                    <TableCell>
                                      <TextField
                                        className="animated-input"
                                        type="number"
                                        size="small"
                                        value={detail.quantite}
                                        onChange={(e) => updateElement(index, 'quantite', e.target.value)}
                                        inputProps={{ min: 0.1, step: 0.5 }}
                                        sx={{ width: 80, borderRadius: 1 }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        className="animated-input"
                                        size="small"
                                        value={detail.posologie}
                                        onChange={(e) => updateElement(index, 'posologie', e.target.value)}
                                        sx={{ width: 150, borderRadius: 1 }}
                                        placeholder="Ex: 1 comprimé matin et soir"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        className="animated-input"
                                        type="number"
                                        size="small"
                                        value={detail.duree_traitement || ''}
                                        onChange={(e) => updateElement(index, 'duree_traitement', e.target.value)}
                                        sx={{ width: 80, borderRadius: 1 }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        className="animated-input"
                                        type="number"
                                        size="small"
                                        value={detail.prix_unitaire}
                                        onChange={(e) => updateElement(index, 'prix_unitaire', e.target.value)}
                                        sx={{ width: 100, borderRadius: 1 }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography fontWeight="bold" color="success.main">
                                        {(detail.quantite * detail.prix_unitaire).toLocaleString('fr-FR')} FCFA
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => removeElement(index)}
                                        className="glow-on-hover"
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Boutons de soumission */}
                <Grid item xs={12}>
                  <Card 
                    className="prescription-card"
                    sx={{ 
                      borderRadius: 3
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Total de la prescription
                          </Typography>
                          <Typography variant="h5" fontWeight="bold" color="success.main" className="text-gradient">
                            {calculateTotal().toLocaleString('fr-FR')} FCFA
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={resetCreationForm}
                            disabled={loading}
                            sx={{ borderRadius: 2 }}
                            className="hover-lift"
                          >
                            Annuler
                          </Button>
                          {isEditing ? (
                            <Button
                              className="gradient-button success-button"
                              variant="contained"
                              startIcon={<CheckIcon />}
                              onClick={() => {
                                setConfirmAction('update');
                                setConfirmDialogOpen(true);
                              }}
                              disabled={loading}
                              sx={{
                                borderRadius: 2
                              }}
                            >
                              {loading ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : (
                                'Mettre à jour les détails'
                              )}
                            </Button>
                          ) : (
                            <Button
                              className="gradient-button success-button"
                              variant="contained"
                              startIcon={<CheckIcon />}
                              onClick={() => {
                                setConfirmAction('create');
                                setConfirmDialogOpen(true);
                              }}
                              disabled={loading || (remplirDetails && details.length === 0)}
                              sx={{
                                borderRadius: 2
                              }}
                            >
                              {loading ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : (
                                'Terminer et Imprimer'
                              )}
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Slide>
        )}

        {/* TAB 3: Exécution de prescription */}
        {activeTab === 2 && (
          <Slide direction="right" in={activeTab === 2}>
            <Box className="mobile-slide-in">
              {/* Recherche de prescription */}
              <Card 
                className="prescription-card"
                sx={{ 
                  mb: 4, 
                  borderRadius: 3
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }} className="text-gradient">
                    Recherche de prescription à exécuter
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      className="animated-input"
                      fullWidth
                      label="Numéro de prescription"
                      value={prescriptionSearch}
                      onChange={(e) => {
                        setPrescriptionSearch(e.target.value);
                        setError(null);
                        setSuccess(null);
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && searchPrescription()}
                      placeholder="PRES-2024-00001 ou PRES202400001"
                      helperText="Format: PRES-YYYY-NNNNN ou PRESYYYYNNNNN"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon className="glow-on-hover" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={toggleScanner}
                              className="glow-on-hover"
                              sx={{ color: '#667eea' }}
                              title="Scanner un QR Code"
                            >
                              <QrCodeScannerIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 2 }
                      }}
                      variant="outlined"
                      error={!!error && error.includes('Prescription')}
                    />
                    <Button
                      className="gradient-button"
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                      onClick={searchPrescription}
                      disabled={loading || !prescriptionSearch.trim()}
                      sx={{
                        borderRadius: 2,
                        minWidth: '120px'
                      }}
                    >
                      {loading ? 'Recherche...' : 'Rechercher'}
                    </Button>
                  </Box>
                  
                  {selectedPrescription && (
                    <Alert 
                      severity="info" 
                      sx={{ mt: 2, borderRadius: 2 }}
                      icon={<CheckIcon />}
                    >
                      Prescription trouvée: {selectedPrescription.NUM_PRESCRIPTION} - 
                      Statut: {selectedPrescription.STATUT}
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Détails de la prescription à exécuter */}
              {selectedPrescription && (
                <Zoom in={!!selectedPrescription}>
                  <Card 
                    className="prescription-card hover-lift"
                    sx={{ 
                      borderRadius: 3
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Box>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }} className="text-gradient">
                            Prescription #{selectedPrescription.NUM_PRESCRIPTION}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography component="span" variant="body2" color="text.secondary">
                              Patient: {selectedPrescription.NOM_BEN} {selectedPrescription.PRE_BEN}
                            </Typography>
                            <Typography component="span" variant="body2" color="text.secondary">
                              •
                            </Typography>
                            <Typography component="span" variant="body2" color="text.secondary">
                              Type: {selectedPrescription.TYPE_PRESTATION}
                            </Typography>
                            <Typography component="span" variant="body2" color="text.secondary">
                              •
                            </Typography>
                            <Typography component="span" variant="body2" color="text.secondary">
                              Statut:
                            </Typography>
                            <StatusChip statut={selectedPrescription.STATUT} />
                          </Box>
                        </Box>
                        <Button
                          variant="outlined"
                          startIcon={<PrintIcon />}
                          onClick={() => viewFeuilleSoins(selectedPrescription)}
                          sx={{ borderRadius: 2 }}
                          className="hover-lift"
                        >
                          Voir feuille de soins
                        </Button>
                      </Box>

                      <Divider className="animated-divider" sx={{ my: 3 }} />

                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }} className="text-gradient">
                        Éléments à exécuter
                      </Typography>
                      
                      {executionDetails.length === 0 ? (
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                          Aucun détail disponible pour cette prescription ou tous les éléments sont déjà exécutés.
                        </Alert>
                      ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                          <Table>
                            <TableHead sx={{ bgcolor: alpha('#667eea', 0.05), '& th': { fontWeight: 600 } }}>
                              <TableRow>
                                <TableCell width="50px">Exécuter</TableCell>
                                <TableCell>Libellé</TableCell>
                                <TableCell>Quantité prescrite</TableCell>
                                <TableCell>Quantité exécutée</TableCell>
                                <TableCell>Quantité restante</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell>Prix unitaire</TableCell>
                                <TableCell>Montant</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {executionDetails.map((detail, index) => {
                                const quantiteRestante = detail.QUANTITE - (detail.quantite_executee || 0);
                                const montant = (detail.quantite_executee || 0) * detail.PRIX_UNITAIRE;
                                
                                return (
                                  <TableRow key={detail.COD_PRES_DET} className="animated-table-row">
                                    <TableCell>
                                      <Checkbox
                                        checked={detail.quantite_executee > 0}
                                        onChange={(e) => {
                                          const newDetails = [...executionDetails];
                                          if (e.target.checked) {
                                            newDetails[index].quantite_executee = detail.QUANTITE;
                                          } else {
                                            newDetails[index].quantite_executee = 0;
                                          }
                                          setExecutionDetails(newDetails);
                                        }}
                                        disabled={!detail.canExecute}
                                        color="primary"
                                        className="glow-on-hover"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Box>
                                        <Typography variant="body2">{detail.LIBELLE}</Typography>
                                        {detail.POSOLOGIE && (
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            Posologie: {detail.POSOLOGIE}
                                          </Typography>
                                        )}
                                      </Box>
                                    </TableCell>
                                    <TableCell>{detail.QUANTITE} {detail.UNITE}</TableCell>
                                    <TableCell>
                                      <TextField
                                        className="animated-input"
                                        type="number"
                                        size="small"
                                        value={detail.quantite_executee || 0}
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value) || 0;
                                          const max = detail.QUANTITE;
                                          const quantite = Math.min(max, Math.max(0, value));
                                          
                                          const newDetails = [...executionDetails];
                                          newDetails[index].quantite_executee = quantite;
                                          setExecutionDetails(newDetails);
                                        }}
                                        inputProps={{ 
                                          min: 0, 
                                          max: detail.QUANTITE,
                                          step: detail.UNITE === 'comprimé' ? 1 : 0.5
                                        }}
                                        sx={{ width: 100, borderRadius: 1 }}
                                        disabled={!detail.canExecute}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography 
                                        variant="body2" 
                                        color={quantiteRestante === 0 ? "success.main" : "text.secondary"}
                                        fontWeight={quantiteRestante === 0 ? "bold" : "normal"}
                                      >
                                        {quantiteRestante} {detail.UNITE}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        className="status-chip"
                                        size="small"
                                        label={detail.STATUT_EXECUTION}
                                        color={detail.STATUT_EXECUTION === 'Execute' ? 'success' : 'warning'}
                                        sx={{ fontWeight: 500 }}
                                      />
                                    </TableCell>
                                    <TableCell>{detail.PRIX_UNITAIRE?.toLocaleString('fr-FR')} FCFA</TableCell>
                                    <TableCell>
                                      <Typography fontWeight="bold" color="success.main">
                                        {montant.toLocaleString('fr-FR')} FCFA
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}

                      {executionDetails.length > 0 && (
                        <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: alpha('#4CAF50', 0.05) }} className="prescription-card">
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Total à exécuter
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" color="success.main" className="text-gradient">
                                {executionDetails
                                  .reduce((sum, detail) => sum + (detail.quantite_executee * detail.PRIX_UNITAIRE), 0)
                                  .toLocaleString('fr-FR')} FCFA
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Button
                                variant="outlined"
                                color="error"
                                onClick={() => {
                                  setSelectedPrescription(null);
                                  setPrescriptionSearch('');
                                  setExecutionDetails([]);
                                  setError(null);
                                  setSuccess(null);
                                }}
                                disabled={loading}
                                sx={{ borderRadius: 2 }}
                                className="hover-lift"
                              >
                                Annuler
                              </Button>
                              <Button
                                className="gradient-button success-button"
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ExecuteIcon />}
                                onClick={executePrescription}
                                disabled={loading || executionDetails.every(d => d.quantite_executee === 0)}
                                sx={{
                                  borderRadius: 2
                                }}
                              >
                                {loading ? 'Exécution en cours...' : "Valider l'exécution"}
                              </Button>
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Zoom>
              )}
            </Box>
          </Slide>
        )}

        {/* MODAL DU SCANNER JSQR */}
        <Dialog
          open={showScanner}
          onClose={toggleScanner}
          maxWidth="md"
          fullWidth
          PaperProps={{
            className: 'prescription-card',
            sx: { 
              borderRadius: 3,
              maxWidth: '700px'
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 600 }} className="text-gradient">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <QrCodeScannerIcon />
              Scanner un QR Code
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, position: 'relative' }}>
              {scannerError ? (
                <Alert 
                  severity="error" 
                  sx={{ mb: 2, borderRadius: 2 }}
                  onClose={() => setScannerError(null)}
                  action={
                    <Button 
                      color="inherit" 
                      size="small" 
                      onClick={startCamera}
                    >
                      Réessayer
                    </Button>
                  }
                >
                  {scannerError}
                </Alert>
              ) : null}
              
              {/* Barre de progression du scan */}
              {scanProgress < 100 && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={scanProgress}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      mb: 1
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" align="center" display="block">
                    Initialisation de la caméra... {scanProgress}%
                  </Typography>
                </Box>
              )}
              
              <Box 
                sx={{ 
                  width: '100%',
                  minHeight: '400px',
                  backgroundColor: '#000',
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {/* Lecteur vidéo */}
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  playsInline
                  muted
                />
                
                {/* Canvas pour la détection */}
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'none'
                  }}
                />
                
                {/* Cadre de scan */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '250px',
                    height: '250px',
                    border: '3px solid #667eea',
                    borderRadius: 2,
                    boxShadow: '0 0 0 1000px rgba(0, 0, 0, 0.5)',
                    zIndex: 10
                  }}
                >
                  {/* Coin supérieur gauche */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -3,
                      left: -3,
                      width: '30px',
                      height: '30px',
                      borderTop: '6px solid #4CAF50',
                      borderLeft: '6px solid #4CAF50',
                      borderTopLeftRadius: '8px'
                    }}
                  />
                  {/* Coin supérieur droit */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -3,
                      right: -3,
                      width: '30px',
                      height: '30px',
                      borderTop: '6px solid #4CAF50',
                      borderRight: '6px solid #4CAF50',
                      borderTopRightRadius: '8px'
                    }}
                  />
                  {/* Coin inférieur gauche */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -3,
                      left: -3,
                      width: '30px',
                      height: '30px',
                      borderBottom: '6px solid #4CAF50',
                      borderLeft: '6px solid #4CAF50',
                      borderBottomLeftRadius: '8px'
                    }}
                  />
                  {/* Coin inférieur droit */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -3,
                      right: -3,
                      width: '30px',
                      height: '30px',
                      borderBottom: '6px solid #4CAF50',
                      borderRight: '6px solid #4CAF50',
                      borderBottomRightRadius: '8px'
                    }}
                  />
                </Box>
                
                {/* Indicateur de scan */}
                {isScanning && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      zIndex: 20,
                      width: '100%'
                    }}
                  >
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'white', 
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        padding: '8px 16px',
                        borderRadius: 2,
                        mb: 1
                      }}
                    >
                      ⬆️ Pointez la caméra vers le QR Code ⬆️
                    </Typography>
                    
                    {scanFps > 0 && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#4CAF50', 
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          padding: '4px 8px',
                          borderRadius: 1,
                          display: 'inline-block'
                        }}
                      >
                        📊 {scanFps} FPS
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
              
              {scannedData && (
                <Alert 
                  severity="success" 
                  sx={{ mt: 2, borderRadius: 2 }}
                  icon={<CheckIcon />}
                >
                  <Typography variant="body2">
                    QR Code scanné: <strong>{scannedData}</strong>
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    Les données ont été automatiquement copiées dans le champ de recherche.
                  </Typography>
                </Alert>
              )}
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Placez le QR Code dans le cadre ci-dessus
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  La détection est automatique. Assurez-vous que le code est bien éclairé.
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      if (isScanning) {
                        stopCamera();
                      } else {
                        startCamera();
                      }
                    }}
                    sx={{ borderRadius: 2 }}
                    startIcon={isScanning ? <CloseIcon /> : <RefreshIcon />}
                  >
                    {isScanning ? 'Arrêter le scan' : 'Redémarrer le scan'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => {
                      // Simuler un scan pour la démonstration (optionnel)
                      handleScanSuccess(`PRES-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`);
                    }}
                    sx={{ borderRadius: 2 }}
                    startIcon={<QrCodeScannerIcon />}
                  >
                    Scanner de test
                  </Button>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={toggleScanner}
              sx={{ borderRadius: 2 }}
              className="hover-lift"
            >
              Fermer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de recherche de patients */}
        <Dialog 
          open={searchPatientDialog} 
          onClose={() => setSearchPatientDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            className: 'prescription-card',
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ fontWeight: 600 }} className="text-gradient">
            Rechercher un patient
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  className="animated-input"
                  fullWidth
                  label="Nom, prénom, identifiant ou téléphone"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                  variant="outlined"
                />
                <Button 
                  className="gradient-button"
                  variant="contained" 
                  onClick={searchPatients}
                  sx={{ borderRadius: 2 }}
                >
                  Rechercher
                </Button>
              </Box>
              
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, borderRadius: 2 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Nom</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Prénom</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Sexe</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Âge</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Identifiant</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patients.map((p) => (
                      <TableRow key={p.id} hover className="animated-table-row">
                        <TableCell>{p.nom}</TableCell>
                        <TableCell>{p.prenom}</TableCell>
                        <TableCell>{p.sexe === 'M' ? 'Homme' : 'Femme'}</TableCell>
                        <TableCell>{p.age} ans</TableCell>
                        <TableCell>{p.identifiant}</TableCell>
                        <TableCell>
                          <Button
                            className="gradient-button"
                            size="small"
                            variant="contained"
                            onClick={() => {
                              setPatient(p);
                              setSearchPatientDialog(false);
                            }}
                            sx={{ borderRadius: 2 }}
                          >
                            Sélectionner
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setSearchPatientDialog(false)}
              sx={{ borderRadius: 2 }}
              className="hover-lift"
            >
              Fermer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de recherche d'éléments médicaux */}
        <Dialog 
          open={searchElementDialog} 
          onClose={() => setSearchElementDialog(false)} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{
            className: 'prescription-card',
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ fontWeight: 600 }} className="text-gradient">
            Rechercher un médicament ou un acte
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  className="animated-input"
                  fullWidth
                  label="Nom du médicament ou libellé de l'acte"
                  value={elementSearch}
                  onChange={(e) => setElementSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchElements()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MedicationIcon />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2 }
                  }}
                  variant="outlined"
                />
                <Button 
                  className="gradient-button"
                  variant="contained" 
                  onClick={searchElements}
                  sx={{ borderRadius: 2 }}
                >
                  Rechercher
                </Button>
              </Box>
              
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, borderRadius: 2 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Libellé</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Forme/Détails</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Prix (FCFA)</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Remboursable</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {elements.map((element) => (
                      <TableRow key={`${element.type}-${element.id}`} hover className="animated-table-row">
                        <TableCell>
                          <Chip
                            className="status-chip"
                            size="small"
                            label={element.type === 'medicament' ? 'Médicament' : 'Acte'}
                            color={element.type === 'medicament' ? 'primary' : 'secondary'}
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{element.libelle}</Typography>
                          {element.libelle_complet && (
                            <Typography variant="caption" color="text.secondary">
                              {element.libelle_complet}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {element.type === 'medicament' ? (
                            <Box>
                              <Typography variant="caption">{element.forme}</Typography>
                              {element.dosage && (
                                <Typography variant="caption" display="block">
                                  Dosage: {element.dosage}
                                </Typography>
                              )}
                            </Box>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {element.prix ? (
                            <Typography variant="body2" fontWeight={500}>
                              {element.prix.toLocaleString('fr-FR')} FCFA
                            </Typography>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {element.remboursable ? (
                            <Chip className="status-chip" size="small" label="Oui" color="success" />
                          ) : (
                            <Chip className="status-chip" size="small" label="Non" color="error" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            className="gradient-button"
                            size="small"
                            variant="contained"
                            onClick={() => addElement(element)}
                            sx={{ borderRadius: 2 }}
                          >
                            Ajouter
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setSearchElementDialog(false)}
              sx={{ borderRadius: 2 }}
              className="hover-lift"
            >
              Fermer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de confirmation */}
        <Dialog 
          open={confirmDialogOpen} 
          onClose={() => setConfirmDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            className: 'prescription-card',
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ fontWeight: 600 }} className="text-gradient">
            ⚠️ Confirmation requise
          </DialogTitle>
          <DialogContent>
            <Alert 
              severity="warning" 
              sx={{ mb: 2, borderRadius: 2 }}
              icon={<WarningIcon />}
            >
              <Typography variant="body1" fontWeight="bold">
                Cette action est irréversible !
              </Typography>
            </Alert>
            
            <Typography variant="body1" sx={{ mt: 2 }}>
              Êtes-vous sûr de vouloir {isEditing ? 'mettre à jour' : 'créer'} cette prescription ?
            </Typography>
            
            {!isEditing && (
              <Box sx={{ mt: 2, p: 2, bgcolor: alpha('#FF9800', 0.1), borderRadius: 2 }}>
                <Typography variant="body2" fontWeight="bold" color="warning.main">
                  Une fois créée, la prescription ne pourra être modifiée que via l'option "Modifier Détails".
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  • Vérifiez bien les informations du patient<br/>
                  • Vérifiez le type de prestation<br/>
                  • Vérifiez les éléments de la prescription
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Button 
              onClick={() => setConfirmDialogOpen(false)}
              sx={{ borderRadius: 2 }}
              className="hover-lift"
              color="inherit"
            >
              Annuler
            </Button>
            <Button
              className="gradient-button"
              variant="contained"
              color="primary"
              onClick={() => {
                setConfirmDialogOpen(false);
                if (confirmAction === 'create') {
                  createPrescription();
                } else if (confirmAction === 'update') {
                  updatePrescription();
                }
              }}
              sx={{ 
                borderRadius: 2,
                minWidth: '120px'
              }}
            >
              {isEditing ? 'Mettre à jour' : 'Créer la prescription'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Feuille de soins (pour impression) avec QR Code */}
        {showFeuilleSoins && prescriptionToPrint && (
          <Dialog
            open={showFeuilleSoins}
            onClose={() => setShowFeuilleSoins(false)}
            maxWidth="lg"
            fullWidth
            PaperProps={{
              className: 'prescription-card',
              sx: { 
                borderRadius: 3, 
                maxWidth: '900px'
              }
            }}
          >
            <DialogTitle sx={{ 
              fontWeight: 600, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <Box>
                <Typography className="text-gradient">
                  Prescription Médicale - {prescriptionToPrint.NUM_PRESCRIPTION}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  {formatDateDisplay(prescriptionToPrint.DATE_PRESCRIPTION)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {generatingQrCode && (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                )}
                <IconButton 
                  onClick={() => setShowFeuilleSoins(false)}
                  size="small"
                  className="glow-on-hover"
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            
            <DialogContent dividers>
              <Box 
                ref={printRef} 
                sx={{ 
                  p: 2,
                  backgroundColor: 'white',
                  minWidth: '210mm',
                  position: 'relative'
                }}
              >
                {/* Filigrane (background watermark) */}
                <div className="watermark" style={{ display: 'none' }}>
                  PRESCRIPTION
                </div>

                {/* Nouvel en-tête avec logo, titre et QR code */}
                <div className="header">
                  <div className="logo-section">
                    {/* Logo de l'entreprise - Remplacez par votre logo */}
                    <img 
                      src="/logo.png" 
                      alt="Logo de l'entreprise" 
                      className="logo"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        // Créer un logo de secours avec du texte
                        const fallback = document.createElement('div');
                        fallback.innerHTML = `
                          <div style="border: 2px solid #2c5aa0; padding: 10px; text-align: center; border-radius: 5px;">
                            <div style="font-weight: bold; color: #2c5aa0; font-size: 16px;">CLINIQUE</div>
                            <div style="font-size: 12px; color: #333;">Santé Plus</div>
                          </div>
                        `;
                        e.target.parentNode.appendChild(fallback);
                      }}
                    />
                    {/* Fallback si le logo ne charge pas */}
                    <div style={{ display: 'none', border: '2px solid #2c5aa0', padding: '10px', textAlign: 'center', borderRadius: '5px' }}>
                      <div style={{ fontWeight: 'bold', color: '#2c5aa0', fontSize: '16px' }}>CLINIQUE</div>
                      <div style={{ fontSize: '12px', color: '#333' }}>Santé Plus</div>
                    </div>
                  </div>
                  
                  <div className="title-section">
                    <h1>PRESCRIPTION MÉDICALE</h1>
                    <h2>Document officiel de soins médicaux</h2>
                    
                    {/* Numéro de prescription en évidence */}
                    <div className="prescription-number">
                      <strong>N° {prescriptionToPrint.NUM_PRESCRIPTION}</strong>
                    </div>
                  </div>
                  
                  <div className="qrcode-section">
                    {generatingQrCode ? (
                      <div style={{ textAlign: 'center', padding: '10px' }}>
                        <CircularProgress size={30} />
                        <div style={{ fontSize: '9px', marginTop: '5px' }}>Génération QR Code...</div>
                      </div>
                    ) : qrCodeUrl ? (
                      <>
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code de la prescription" 
                          className="qrcode"
                        />
                        <div className="qr-note">
                          Scannez pour vérifier
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '10px', border: '1px dashed #ccc' }}>
                        <QrCodeIcon sx={{ fontSize: 40, color: '#ccc' }} />
                        <div style={{ fontSize: '9px', marginTop: '5px' }}>QR Code non disponible</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations du patient */}
                <div className="section">
                  <div className="section-title">INFORMATIONS DU PATIENT</div>
                  <div className="patient-info">
                    <div className="info-item">
                      <span className="info-label">Nom et Prénom:</span> {prescriptionToPrint.NOM_BEN} {prescriptionToPrint.PRE_BEN}
                    </div>
                    <div className="info-item">
                      <span className="info-label">Sexe:</span> {prescriptionToPrint.SEX_BEN}
                    </div>
                    <div className="info-item">
                      <span className="info-label">Âge:</span> {prescriptionToPrint.AGE} ans
                    </div>
                    <div className="info-item">
                      <span className="info-label">Date de prescription:</span> {formatDateDisplay(prescriptionToPrint.DATE_PRESCRIPTION)}
                    </div>
                    <div className="info-item">
                      <span className="info-label">Identifiant:</span> {prescriptionToPrint.IDENTIFIANT_NATIONAL}
                    </div>
                    <div className="info-item">
                      <span className="info-label">Date de validité:</span> {prescriptionToPrint.DATE_VALIDITE ? formatDateDisplay(prescriptionToPrint.DATE_VALIDITE) : 'Non spécifiée'}
                    </div>
                  </div>
                </div>

                {/* Informations médicales */}
                <div className="section">
                  <div className="section-title">INFORMATIONS MÉDICALES</div>
                  <div className="medical-info">
                    <div className="info-item">
                      <span className="info-label">Centre de santé:</span> {prescriptionToPrint.NOM_CENTRE || 'Non spécifié'}
                    </div>
                    <div className="info-item">
                      <span className="info-label">Type de prestation:</span> {prescriptionToPrint.TYPE_PRESTATION}
                    </div>
                    <div className="info-item">
                      <span className="info-label">Médecin prescripteur:</span> {prescriptionToPrint.NOM_PRESTATAIRE || 'Non spécifié'} {prescriptionToPrint.PRENOM_PRESTATAIRE || ''}
                    </div>
                    <div className="info-item">
                      <span className="info-label">Statut:</span> {prescriptionToPrint.STATUT || 'En attente'}
                    </div>
                  </div>
                </div>

                {/* Section AFFECTION pour remplir manuellement */}
                <div className="section">
                  <div className="section-title">AFFECTION DIAGNOSTIQUÉE</div>
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#f9f9f9', 
                    borderRadius: '4px',
                    border: '1px dashed #ccc',
                    minHeight: '60px'
                  }}>
                    {/* Espace pour écrire le diagnostic */}
                    {prescriptionToPrint.OBSERVATIONS ? (
                      <div>{prescriptionToPrint.OBSERVATIONS}</div>
                    ) : (
                      <div style={{ color: '#666', fontStyle: 'italic' }}>
                        [À compléter par le médecin]
                      </div>
                    )}
                  </div>
                </div>

                {/* Détails de la prescription */}
                <div className="section">
                  <div className="section-title">DÉTAILS DE LA PRESCRIPTION</div>
                  
                  {prescriptionToPrint.hasDefaultDetailOnly || 
                   !prescriptionToPrint.details || 
                   prescriptionToPrint.details.length === 0 ? (
                    
                    // AFFICHER DES LIGNES VIDES POUR LES PRESCRIPTIONS SANS DÉTAILS
                    <div>
                      <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '15px' }}>
                        Cette prescription a été créée sans détails spécifiques. Veuillez remplir manuellement ci-dessous :
                      </p>
                      
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: '40%' }}>Libellé</th>
                            <th style={{ width: '10%' }}>Quantité</th>
                            <th style={{ width: '20%' }}>Posologie</th>
                            <th style={{ width: '10%' }}>Durée</th>
                            <th style={{ width: '10%' }}>Prix unitaire</th>
                            <th style={{ width: '10%' }}>Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Lignes vides pour la saisie manuelle */}
                          {[1, 2, 3, 4, 5].map((row, index) => (
                            <tr key={index} style={{ height: '25px' }}>
                              <td style={{ border: '1px dashed #ccc', minHeight: '25px' }}></td>
                              <td style={{ border: '1px dashed #ccc' }}></td>
                              <td style={{ border: '1px dashed #ccc' }}></td>
                              <td style={{ border: '1px dashed #ccc' }}></td>
                              <td style={{ border: '1px dashed #ccc' }}></td>
                              <td style={{ border: '1px dashed #ccc' }}></td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="total-row">
                            <td colSpan="5" align="right">
                              <strong>TOTAL :</strong>
                            </td>
                            <td>
                              <div className="total-amount" style={{ border: '1px dashed #ccc', minHeight: '25px' }}>
                                {/* Espace pour le total */}
                              </div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    
                    // AFFICHER LES DÉTAILS NORMAUX POUR LES PRESCRIPTIONS AVEC DÉTAILS
                    <>
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: '40%' }}>Libellé</th>
                            <th style={{ width: '10%' }}>Quantité</th>
                            <th style={{ width: '20%' }}>Posologie</th>
                            <th style={{ width: '10%' }}>Durée</th>
                            <th style={{ width: '10%' }}>Prix unitaire</th>
                            <th style={{ width: '10%' }}>Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prescriptionToPrint.details.map((detail, index) => (
                            <tr key={index}>
                              <td>{detail.LIBELLE}</td>
                              <td>{detail.QUANTITE} {detail.UNITE}</td>
                              <td>{detail.POSOLOGIE || '-'}</td>
                              <td>{detail.DUREE_TRAITEMENT || '-'} {detail.DUREE_TRAITEMENT ? 'jours' : ''}</td>
                              <td>{detail.PRIX_UNITAIRE?.toLocaleString('fr-FR')} FCFA</td>
                              <td>
                                <strong>{(detail.QUANTITE * detail.PRIX_UNITAIRE).toLocaleString('fr-FR')} FCFA</strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="total-row">
                            <td colSpan="5" align="right">
                              <strong>TOTAL PRESCRIPTION :</strong>
                            </td>
                            <td>
                              <div className="total-amount">
                                {prescriptionToPrint.MONTANT_TOTAL?.toLocaleString('fr-FR') || 
                                 (prescriptionToPrint.details?.reduce((sum, d) => 
                                   sum + (d.QUANTITE * d.PRIX_UNITAIRE), 0) || 0).toLocaleString('fr-FR')} FCFA
                              </div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </>
                  )}
                </div>

                {/* Observations supplémentaires */}
                <div className="section">
                  <div className="section-title">OBSERVATIONS SUPPLÉMENTAIRES</div>
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    minHeight: '40px'
                  }}>
                    {prescriptionToPrint.OBSERVATIONS && prescriptionToPrint.OBSERVATIONS !== prescriptionToPrint.OBSERVATIONS ? (
                      prescriptionToPrint.OBSERVATIONS
                    ) : (
                      <div style={{ color: '#666', fontStyle: 'italic' }}>
                        Aucune observation supplémentaire.
                      </div>
                    )}
                  </div>
                </div>

                {/* Total et signatures */}
                <div style={{ marginTop: '30px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginTop: '20px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        padding: '10px', 
                        backgroundColor: '#f0f7f0', 
                        borderRadius: '4px',
                        border: '1px solid #4CAF50'
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4CAF50' }}>
                          TOTAL PRESCRIPTION: {prescriptionToPrint.MONTANT_TOTAL?.toLocaleString('fr-FR') || 
                                 (prescriptionToPrint.details?.reduce((sum, d) => 
                                   sum + (d.QUANTITE * d.PRIX_UNITAIRE), 0) || 0).toLocaleString('fr-FR')} FCFA
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div className="signature-area">
                        <p style={{ marginBottom: '30px', color: '#666', fontSize: '11px' }}>
                          Signature, cachet et nom du médecin prescripteur
                        </p>
                        <div className="signature-line"></div>
                        <p style={{ marginTop: '5px', fontSize: '10px', color: '#666' }}>
                          {prescriptionToPrint.NOM_PRESTATAIRE || 'Dr.'} {prescriptionToPrint.PRENOM_PRESTATAIRE || ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Signature du pharmacien/executant */}
                  <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <div style={{ 
                      display: 'inline-block',
                      width: '60%',
                      margin: '0 auto'
                    }}>
                      <div className="signature-line"></div>
                      <p style={{ marginTop: '5px', fontSize: '10px', color: '#666' }}>
                        Signature et cachet du pharmacien/exécutant
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="footer">
                  <p>
                    Document généré électroniquement le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                  </p>
                  <p style={{ fontSize: '9px', marginTop: '3px' }}>
                    © Système de Gestion Médicale - Ce document a une valeur légale. Conserver pour vos archives.
                  </p>
                  <p style={{ fontSize: '8px', marginTop: '3px', color: '#999' }}>
                    QR Code contenant: N° prescription, patient, date, centre et statut
                  </p>
                </div>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 2 }}>
              <Button 
                onClick={() => setShowFeuilleSoins(false)}
                sx={{ borderRadius: 2 }}
                className="hover-lift"
              >
                Fermer
              </Button>
              <Button 
                className="gradient-button"
                variant="contained"
                startIcon={printing ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />}
                onClick={handlePrintFeuilleSoins}
                disabled={printing || generatingQrCode}
                sx={{ 
                  borderRadius: 2
                }}
              >
                {printing ? 'Impression en cours...' : 'Imprimer la prescription'}
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Prescriptions;