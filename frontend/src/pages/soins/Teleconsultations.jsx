import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Paper,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Snackbar,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Menu // Ajout de Menu
} from '@mui/material';
import {
  Videocam as VideocamIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VideocamOff as VideocamOffIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  Chat as ChatIcon,
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  MedicalServices as MedicalServicesIcon,
  EditNote as EditNoteIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  NoteAdd as NoteAddIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Phone as PhoneIcon,
  PhoneDisabled as PhoneDisabledIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  TextSnippet as TextSnippetIcon,
  Link as LinkIcon, // Nouvelle icône
  ContentCopy as ContentCopyIcon, // Nouvelle icône
  MoreVert as MoreVertIcon // Nouvelle icône
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api, { consultationsAPI, prescriptionsAPI, patientsAPI } from '../../services/api';
import { format } from 'date-fns';
import './Teleconsultations.css';

const TeleconsultationPage = () => {
  const navigate = useNavigate();
  
  // États principaux
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [consultationTypes, setConsultationTypes] = useState([]);
  
  // États de la consultation
  const [consultationData, setConsultationData] = useState({
    COD_PRE: '',
    COD_CEN: null,
    TYPE_CONSULTATION: 'Téléconsultation',
    MOTIF_CONSULTATION: '',
    OBSERVATIONS: '',
    DIAGNOSTIC: '',
    TRAITEMENT_PRESCRIT: '',
    EXAMENS_COMPLEMENTAIRES: '',
    PROCHAIN_RDV: '',
    URGENT: false,
    HOSPITALISATION: false,
    MONTANT_CONSULTATION: 0,
    STATUT_PAIEMENT: 'À payer'
  });
  
  // États de l'appel vidéo
  const [isConsultationActive, setIsConsultationActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // États du chat
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // États des documents
  const [attachments, setAttachments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // États de la prescription
  const [prescriptionDialog, setPrescriptionDialog] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState({
    TYPE_PRESTATION: 'médicaments',
    COD_AFF: 'NSP',
    OBSERVATIONS: '',
    details: [],
    ORIGINE: 'Téléconsultation'
  });
  
  // États de recherche de médicaments
  const [medicamentSearch, setMedicamentSearch] = useState('');
  const [medicamentResults, setMedicamentResults] = useState([]);
  
  // États pour le lien de réunion
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingLinkDialog, setMeetingLinkDialog] = useState(false);
  const [meetingOptions, setMeetingOptions] = useState({
    expiryHours: 24,
    requirePassword: false,
    password: '',
    allowGuests: true
  });
  
  // Menu pour options supplémentaires
  const [anchorEl, setAnchorEl] = useState(null);
  
  // États généraux
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [step, setStep] = useState(0);

  // Références
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const meetingLinkInputRef = useRef(null);

  // Effet pour la recherche de patients
  useEffect(() => {
    const searchPatients = async () => {
      if (searchTerm.trim().length >= 2) {
        try {
          setIsLoading(true);
          const response = await consultationsAPI.searchPatientsAdvanced(searchTerm);
          
          if (response.success) {
            setSearchResults(response.patients || []);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error('Erreur recherche patients:', error);
          setSnackbar({
            open: true,
            message: 'Erreur lors de la recherche des patients',
            severity: 'error'
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(searchPatients, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Chargement des données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Charger les médecins
        const doctorsResponse = await consultationsAPI.getMedecins();
        if (doctorsResponse.success) {
          setAvailableDoctors(doctorsResponse.medecins || []);
          
          // Auto-sélection du médecin connecté
          const user = api.auth.getUser();
          if (user) {
            const currentDoctor = doctorsResponse.medecins.find(
              doc => doc.EMAIL_UTI === user.email || doc.COD_PRE === user.id
            );
            if (currentDoctor) {
              setConsultationData(prev => ({
                ...prev,
                COD_PRE: currentDoctor.COD_PRE
              }));
            }
          }
        }
        
        // Charger les types de consultation
        const typesResponse = await consultationsAPI.getTypesConsultation();
        if (typesResponse.success) {
          setConsultationTypes(typesResponse.types || []);
        }
        
      } catch (error) {
        console.error('Erreur chargement données initiales:', error);
        setSnackbar({
          open: true,
          message: 'Erreur lors du chargement des données',
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Chargement des détails du patient sélectionné
  useEffect(() => {
    const loadPatientDetails = async () => {
      if (!selectedPatient) {
        setPatientDetails(null);
        setPatientHistory([]);
        return;
      }

      try {
        setIsLoading(true);
        
        // Charger les détails du patient
        const patientId = selectedPatient.id || selectedPatient.ID_BEN;
        const response = await patientsAPI.getById(patientId);
        
        if (response.success) {
          setPatientDetails(response.patient);
          
          // Simuler l'historique (à remplacer par API réelle si disponible)
          const mockHistory = [
            {
              id: 1,
              date: '2024-01-15',
              type: 'Consultation physique',
              doctor: 'Dr. Martin',
              diagnosis: 'Hypertension artérielle',
              prescriptions: 2
            },
            {
              id: 2,
              date: '2023-11-20',
              type: 'Téléconsultation',
              doctor: 'Dr. Martin',
              diagnosis: 'Suivi tension',
              prescriptions: 1
            }
          ];
          setPatientHistory(mockHistory);
        }
      } catch (error) {
        console.error('Erreur chargement détails patient:', error);
        setSnackbar({
          open: true,
          message: 'Erreur lors du chargement des détails du patient',
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPatientDetails();
  }, [selectedPatient]);

  // Timer pour la durée d'appel
  useEffect(() => {
    let interval;
    if (isConsultationActive && connectionStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConsultationActive, connectionStatus]);

  // Auto-scroll du chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Recherche de médicaments pour la prescription
  useEffect(() => {
    const searchMedicaments = async () => {
      if (medicamentSearch.trim().length >= 2) {
        try {
          const response = await prescriptionsAPI.searchMedicalItems(medicamentSearch);
          if (response.success) {
            setMedicamentResults(response.items || []);
          }
        } catch (error) {
          console.error('Erreur recherche médicaments:', error);
        }
      } else {
        setMedicamentResults([]);
      }
    };

    const debounceTimer = setTimeout(searchMedicaments, 300);
    return () => clearTimeout(debounceTimer);
  }, [medicamentSearch]);

  // Gestion de la sélection d'un patient
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSearchTerm('');
    setSearchResults([]);
    setStep(1); // Passer à l'étape suivante
  };

  // Créer un lien de réunion
  const generateMeetingLink = async () => {
    if (!selectedPatient) {
      setSnackbar({
        open: true,
        message: 'Veuillez d\'abord sélectionner un patient',
        severity: 'warning'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Générer un ID unique pour la réunion
      const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Dans une application réelle, vous enregistreriez cela dans votre backend
      // Pour l'exemple, nous créons un lien local
      const baseUrl = window.location.origin;
      const meetingPath = `/teleconsultation/join/${meetingId}`;
      const generatedLink = `${baseUrl}${meetingPath}`;
      
      setMeetingLink(generatedLink);
      
      // Envoyer le lien au patient via SMS/Email (simulé)
      const patientPhone = patientDetails?.TELEPHONE_MOBILE;
      if (patientPhone) {
        // Simuler l'envoi d'un SMS
        console.log(`SMS envoyé au ${patientPhone} avec le lien: ${generatedLink}`);
        
        // Ajouter un message système
        const systemMessage = {
          id: Date.now(),
          sender: 'system',
          text: `Lien de réunion généré et envoyé au patient: ${generatedLink}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'system'
        };
        setChatMessages(prev => [...prev, systemMessage]);
      }
      
      setMeetingLinkDialog(true);
      setAnchorEl(null); // Fermer le menu
      
      setSnackbar({
        open: true,
        message: 'Lien de réunion généré avec succès',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Erreur génération lien:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la génération du lien',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copier le lien de réunion dans le presse-papier
  const copyMeetingLink = () => {
    if (meetingLink) {
      navigator.clipboard.writeText(meetingLink)
        .then(() => {
          setSnackbar({
            open: true,
            message: 'Lien copié dans le presse-papier',
            severity: 'success'
          });
        })
        .catch(err => {
          console.error('Erreur copie:', err);
          setSnackbar({
            open: true,
            message: 'Erreur lors de la copie du lien',
            severity: 'error'
          });
        });
    }
  };

  // Démarrage de la consultation
  const startConsultation = async () => {
    if (!selectedPatient) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner un patient',
        severity: 'warning'
      });
      return;
    }

    if (!consultationData.COD_PRE) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner un médecin',
        severity: 'warning'
      });
      return;
    }

    try {
      setIsLoading(true);
      setConnectionStatus('connecting');
      
      // Initialiser le stream vidéo
      await initializeVideoStream();
      
      // Simuler la connexion (dans une vraie application, ce serait avec WebRTC)
      setTimeout(() => {
        setConnectionStatus('connected');
        setIsConsultationActive(true);
        setStep(2);
        
        // Message de bienvenue
        const welcomeMessage = {
          id: Date.now(),
          sender: 'system',
          text: 'La téléconsultation a commencé. Bonjour !',
          timestamp: new Date().toLocaleTimeString(),
          type: 'system'
        };
        setChatMessages([welcomeMessage]);
        
        setSnackbar({
          open: true,
          message: 'Consultation démarrée avec succès',
          severity: 'success'
        });
      }, 1500);
      
    } catch (error) {
      console.error('Erreur démarrage consultation:', error);
      setConnectionStatus('error');
      setSnackbar({
        open: true,
        message: 'Erreur lors du démarrage de la consultation',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialisation du flux vidéo
  const initializeVideoStream = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      localStreamRef.current = stream;
      
    } catch (error) {
      console.error('Erreur accès caméra/micro:', error);
      
      // Fallback: essayer sans vidéo
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioOnlyStream;
        setIsVideoOn(false);
        
        setSnackbar({
          open: true,
          message: 'Caméra non disponible, audio seulement',
          severity: 'warning'
        });
      } catch (audioError) {
        throw new Error('Impossible d\'accéder au microphone');
      }
    }
  };

  // Fin de la consultation
  const endConsultation = async () => {
    try {
      // Arrêter les streams média
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Fermer la connexion peer
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      // Sauvegarder la consultation
      await saveConsultation();
      
      // Réinitialiser les états
      setIsConsultationActive(false);
      setConnectionStatus('disconnected');
      setCallDuration(0);
      setIsMuted(false);
      setIsVideoOn(true);
      setIsScreenSharing(false);
      setStep(3);
      
      setSnackbar({
        open: true,
        message: 'Consultation terminée et enregistrée',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Erreur fin consultation:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la fin de la consultation',
        severity: 'error'
      });
    }
  };

  // Sauvegarde de la consultation
  const saveConsultation = async () => {
    if (!selectedPatient || !consultationData.COD_PRE) return;

    try {
      const consultationToSave = {
        ...consultationData,
        COD_BEN: selectedPatient.id || selectedPatient.ID_BEN,
        DATE_CONSULTATION: new Date().toISOString(),
        MONTANT_CONSULTATION: consultationData.MONTANT_CONSULTATION || 5000, // Valeur par défaut
        STATUT_PAIEMENT: consultationData.STATUT_PAIEMENT || 'À payer',
        MEETING_LINK: meetingLink // Sauvegarder le lien de réunion
      };

      const response = await consultationsAPI.create(consultationToSave);
      
      if (response.success) {
        console.log('Consultation enregistrée:', response);
        
        // Ajouter un message système
        const systemMessage = {
          id: Date.now(),
          sender: 'system',
          text: `Consultation enregistrée sous le numéro ${response.consultationId}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'system'
        };
        setChatMessages(prev => [...prev, systemMessage]);
        
        return response.consultationId;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Erreur sauvegarde consultation:', error);
      throw error;
    }
  };

  // Contrôles média
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
        
        if (!videoTrack.enabled) {
          setSnackbar({
            open: true,
            message: 'Caméra désactivée',
            severity: 'info'
          });
        }
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'browser'
          },
          audio: false
        });
        
        // Remplacer la track vidéo
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders?.()?.find(s => s.track?.kind === 'video');
        
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
        
        setIsScreenSharing(true);
        
        setSnackbar({
          open: true,
          message: 'Partage d\'écran activé',
          severity: 'success'
        });
      } else {
        // Revenir à la webcam
        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          const sender = peerConnectionRef.current?.getSenders?.()?.find(s => s.track?.kind === 'video');
          
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        }
        
        setIsScreenSharing(false);
        
        setSnackbar({
          open: true,
          message: 'Partage d\'écran désactivé',
          severity: 'info'
        });
      }
    } catch (error) {
      console.error('Erreur partage écran:', error);
      if (error.name !== 'NotAllowedError') {
        setSnackbar({
          open: true,
          message: 'Erreur lors du partage d\'écran',
          severity: 'error'
        });
      }
    }
  };

  // Gestion du chat
  const sendMessage = () => {
    if (newMessage.trim() === '') return;

    const message = {
      id: Date.now(),
      sender: 'doctor',
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'text'
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Gestion des fichiers
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      
      reader.onloadstart = () => {
        setUploadProgress(0);
      };
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      };
      
      reader.onloadend = () => {
        const newAttachment = {
          id: Date.now(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result,
          uploadedAt: new Date().toISOString()
        };
        
        setAttachments(prev => [...prev, newAttachment]);
        setUploadProgress(0);
        
        // Ajouter un message système
        const systemMessage = {
          id: Date.now(),
          sender: 'system',
          text: `Fichier "${file.name}" téléchargé`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'system'
        };
        setChatMessages(prev => [...prev, systemMessage]);
        
        setSnackbar({
          open: true,
          message: `Fichier "${file.name}" téléchargé`,
          severity: 'success'
        });
      };
      
      reader.onerror = () => {
        setSnackbar({
          open: true,
          message: 'Erreur lors du téléchargement du fichier',
          severity: 'error'
        });
      };
      
      reader.readAsDataURL(file);
    });
    
    // Réinitialiser l'input
    event.target.value = '';
  };

  // Gestion des prescriptions
  const openPrescriptionDialog = () => {
    setPrescriptionDialog(true);
  };

  const addMedicamentToPrescription = (medicament) => {
    const newDetail = {
      TYPE_ELEMENT: 'medicament',
      COD_ELEMENT: medicament.id || `MED-${Date.now()}`,
      LIBELLE: medicament.libelle || medicament.libelle_complet,
      QUANTITE: 1,
      POSOLOGIE: '1 comprimé matin et soir',
      DUREE_TRAITEMENT: 7,
      UNITE: 'comprimé',
      PRIX_UNITAIRE: medicament.prix || 0,
      REMBOURSABLE: true,
      TAUX_PRISE_EN_CHARGE: 80
    };
    
    setPrescriptionData(prev => ({
      ...prev,
      details: [...prev.details, newDetail]
    }));
    
    setMedicamentSearch('');
    setMedicamentResults([]);
    
    setSnackbar({
      open: true,
      message: `Médicament "${medicament.libelle}" ajouté`,
      severity: 'success'
    });
  };

  const createPrescription = async () => {
    if (!selectedPatient) return;

    try {
      const prescriptionToSave = {
        ...prescriptionData,
        COD_BEN: selectedPatient.id || selectedPatient.ID_BEN,
        COD_PRE: consultationData.COD_PRE,
        details: prescriptionData.details
      };

      const response = await prescriptionsAPI.create(prescriptionToSave);
      
      if (response.success) {
        setPrescriptionDialog(false);
        setPrescriptionData({
          TYPE_PRESTATION: 'médicaments',
          COD_AFF: 'NSP',
          OBSERVATIONS: '',
          details: [],
          ORIGINE: 'Téléconsultation'
        });
        
        setSnackbar({
          open: true,
          message: `Prescription créée: ${response.numero}`,
          severity: 'success'
        });
        
        // Ajouter un message système
        const systemMessage = {
          id: Date.now(),
          sender: 'system',
          text: `Prescription ${response.numero} créée`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'system'
        };
        setChatMessages(prev => [...prev, systemMessage]);
        
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Erreur création prescription:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la création de la prescription',
        severity: 'error'
      });
    }
  };

  // Menu pour options supplémentaires
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Utilitaires
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const resetConsultation = () => {
    setSelectedPatient(null);
    setPatientDetails(null);
    setPatientHistory([]);
    setConsultationData({
      COD_PRE: consultationData.COD_PRE, // Garder le médecin
      COD_CEN: null,
      TYPE_CONSULTATION: 'Téléconsultation',
      MOTIF_CONSULTATION: '',
      OBSERVATIONS: '',
      DIAGNOSTIC: '',
      TRAITEMENT_PRESCRIT: '',
      EXAMENS_COMPLEMENTAIRES: '',
      PROCHAIN_RDV: '',
      URGENT: false,
      HOSPITALISATION: false,
      MONTANT_CONSULTATION: 0,
      STATUT_PAIEMENT: 'À payer'
    });
    setChatMessages([]);
    setAttachments([]);
    setMeetingLink('');
    setStep(0);
  };

  // Composant de stepper pour guider l'utilisateur
  const steps = [
    'Sélection du patient',
    'Configuration',
    'Consultation en cours',
    'Terminé'
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      {/* En-tête avec stepper */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <VideocamIcon sx={{ mr: 2, color: 'primary.main' }} />
            Téléconsultation
            <Chip 
              label={connectionStatus === 'connected' ? 'En ligne' : 'Hors ligne'} 
              color={connectionStatus === 'connected' ? 'success' : 'default'}
              size="small"
              sx={{ ml: 2 }}
            />
          </Typography>
          
          <Stepper activeStep={step} sx={{ mt: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Bouton pour options supplémentaires */}
        <Box>
          <IconButton
            onClick={handleMenuOpen}
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={generateMeetingLink} disabled={!selectedPatient}>
              <LinkIcon sx={{ mr: 2 }} />
              Créer un lien de réunion
            </MenuItem>
            <MenuItem onClick={() => meetingLink && copyMeetingLink()} disabled={!meetingLink}>
              <ContentCopyIcon sx={{ mr: 2 }} />
              Copier le lien existant
            </MenuItem>
            <Divider />
            <MenuItem onClick={resetConsultation}>
              <HistoryIcon sx={{ mr: 2 }} />
              Nouvelle consultation
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Colonne gauche - Recherche patient et informations */}
        <Grid item xs={12} md={4}>
          {/* Recherche patient */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                Rechercher un patient
              </Typography>
              
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Nom, prénom, carte d'identité..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
                disabled={isConsultationActive}
                InputProps={{
                  endAdornment: isLoading && (
                    <CircularProgress size={20} />
                  )
                }}
              />

              {searchResults.length > 0 && (
                <Paper sx={{ maxHeight: 300, overflow: 'auto', mb: 2, border: '1px solid #e0e0e0' }}>
                  <List dense>
                    {searchResults.map((patient) => (
                      <ListItem
                        key={patient.id || patient.ID_BEN}
                        button
                        onClick={() => handlePatientSelect(patient)}
                        sx={{
                          '&:hover': { backgroundColor: 'action.hover' },
                          borderBottom: '1px solid #f5f5f5'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2">
                              {patient.nom || patient.NOM_BEN} {patient.prenom || patient.PRE_BEN}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="caption" display="block">
                                ID: {patient.identifiant || patient.IDENTIFIANT_NATIONAL}
                              </Typography>
                              <Typography variant="caption" display="block">
                                {patient.age ? `${patient.age} ans` : ''} • {patient.sexe || patient.SEX_BEN}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              {selectedPatient && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon sx={{ mr: 1, fontSize: 20 }} />
                    Patient sélectionné
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedPatient.nom || selectedPatient.NOM_BEN} {selectedPatient.prenom || selectedPatient.PRE_BEN}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedPatient.age ? `${selectedPatient.age} ans` : ''} • {selectedPatient.sexe || selectedPatient.SEX_BEN}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={resetConsultation}
                    disabled={isConsultationActive}
                    startIcon={<CloseIcon />}
                  >
                    Changer
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Informations patient */}
          {patientDetails && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <MedicalServicesIcon sx={{ mr: 1 }} />
                  Informations patient
                </Typography>
                
                <List dense>
                  {patientDetails.TELEPHONE_MOBILE && (
                    <ListItem>
                      <ListItemText
                        primary="Téléphone"
                        secondary={patientDetails.TELEPHONE_MOBILE}
                      />
                    </ListItem>
                  )}
                  {patientDetails.EMAIL && (
                    <ListItem>
                      <ListItemText
                        primary="Email"
                        secondary={patientDetails.EMAIL}
                      />
                    </ListItem>
                  )}
                  {patientDetails.PROFESSION && (
                    <ListItem>
                      <ListItemText
                        primary="Profession"
                        secondary={patientDetails.PROFESSION}
                      />
                    </ListItem>
                  )}
                  {patientDetails.GROUPE_SANGUIN && (
                    <ListItem>
                      <ListItemText
                        primary="Groupe sanguin"
                        secondary={`${patientDetails.GROUPE_SANGUIN}${patientDetails.RHESUS || ''}`}
                      />
                    </ListItem>
                  )}
                </List>
                
                {patientDetails.ANTECEDENTS_MEDICAUX && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Antécédents médicaux
                    </Typography>
                    <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">
                        {patientDetails.ANTECEDENTS_MEDICAUS}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Historique patient */}
          {patientHistory.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <HistoryIcon sx={{ mr: 1 }} />
                  Historique récent
                </Typography>
                <List>
                  {patientHistory.map((item) => (
                    <ListItem key={item.id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <MedicalServicesIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{item.type}</Typography>
                            <Chip label={item.date} size="small" />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {item.diagnosis}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="textSecondary">
                              Par {item.doctor}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Colonne centrale - Vidéo et consultation */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              {/* Zone vidéo */}
              <Box sx={{ position: 'relative', mb: 3, borderRadius: 2, overflow: 'hidden', bgcolor: 'black' }}>
                {/* Vidéo patient (simulée) */}
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isConsultationActive ? (
                    <>
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transform: 'scaleX(-1)' // Effet miroir
                        }}
                      />
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 10, 
                        left: 10,
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        p: 1,
                        borderRadius: 2
                      }}>
                        <AccessTimeIcon sx={{ mr: 0.5, fontSize: 16 }} />
                        <Typography variant="caption">
                          {formatDuration(callDuration)}
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                      <VideocamOffIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                      <Typography variant="body1">
                        Consultation non démarrée
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Vidéo locale (médecin) */}
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 10, 
                  right: 10,
                  width: 150,
                  height: 100,
                  bgcolor: 'black',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '2px solid white',
                  boxShadow: 3
                }}>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transform: 'scaleX(-1)' // Effet miroir
                    }}
                  />
                  {!isVideoOn && (
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(0,0,0,0.7)'
                    }}>
                      <VideocamOffIcon sx={{ color: 'white', fontSize: 30 }} />
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Contrôles média */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                <Tooltip title={isMuted ? "Activer le micro" : "Désactiver le micro"}>
                  <IconButton
                    color={isMuted ? "error" : "primary"}
                    onClick={toggleAudio}
                    disabled={!isConsultationActive}
                    sx={{ 
                      bgcolor: isMuted ? 'error.light' : 'primary.light',
                      '&:hover': { bgcolor: isMuted ? 'error.main' : 'primary.main' }
                    }}
                  >
                    {isMuted ? <MicOffIcon /> : <MicIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title={isVideoOn ? "Désactiver la caméra" : "Activer la caméra"}>
                  <IconButton
                    color={isVideoOn ? "primary" : "error"}
                    onClick={toggleVideo}
                    disabled={!isConsultationActive}
                    sx={{ 
                      bgcolor: isVideoOn ? 'primary.light' : 'error.light',
                      '&:hover': { bgcolor: isVideoOn ? 'primary.main' : 'error.main' }
                    }}
                  >
                    {isVideoOn ? <VideocamIcon /> : <VideocamOffIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title={isScreenSharing ? "Arrêter le partage" : "Partager l'écran"}>
                  <IconButton
                    color={isScreenSharing ? "primary" : "default"}
                    onClick={toggleScreenShare}
                    disabled={!isConsultationActive}
                    sx={{ 
                      bgcolor: isScreenSharing ? 'primary.light' : 'grey.200',
                      '&:hover': { bgcolor: isScreenSharing ? 'primary.main' : 'grey.300' }
                    }}
                  >
                    {isScreenSharing ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                  </IconButton>
                </Tooltip>

                {isConsultationActive ? (
                  <Button
                    variant="contained"
                    color="error"
                    onClick={endConsultation}
                    startIcon={<PhoneDisabledIcon />}
                  >
                    Terminer
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={startConsultation}
                    disabled={!selectedPatient || isLoading}
                    startIcon={<PhoneIcon />}
                  >
                    {isLoading ? 'Démarrage...' : 'Commencer la consultation'}
                  </Button>
                )}
              </Box>

              {/* Indicateur de lien de réunion */}
              {meetingLink && !isConsultationActive && (
                <Alert 
                  severity="info" 
                  sx={{ mb: 2 }}
                  action={
                    <Button 
                      color="inherit" 
                      size="small" 
                      onClick={copyMeetingLink}
                      startIcon={<ContentCopyIcon />}
                    >
                      Copier
                    </Button>
                  }
                >
                  <Typography variant="body2">
                    Lien de réunion généré. Partagez-le avec le patient.
                  </Typography>
                </Alert>
              )}

              {/* Tabs pour consultation, chat, documents */}
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Consultation" icon={<MedicalServicesIcon />} />
                <Tab label="Chat" icon={<ChatIcon />} />
                <Tab label="Documents" icon={<TextSnippetIcon />} />
              </Tabs>

              {/* Contenu des tabs */}
              {activeTab === 0 && (
                <Box>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Médecin</InputLabel>
                    <Select
                      value={consultationData.COD_PRE}
                      onChange={(e) => setConsultationData({
                        ...consultationData,
                        COD_PRE: e.target.value
                      })}
                      label="Médecin"
                      disabled={isConsultationActive}
                    >
                      <MenuItem value="">Sélectionner un médecin</MenuItem>
                      {availableDoctors.map((doctor) => (
                        <MenuItem key={doctor.COD_PRE} value={doctor.COD_PRE}>
                          {doctor.NOM_PRESTATAIRE} {doctor.PRENOM_PRESTATAIRE} - {doctor.SPECIALITE}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Motif de consultation"
                    multiline
                    rows={2}
                    value={consultationData.MOTIF_CONSULTATION}
                    onChange={(e) => setConsultationData({
                      ...consultationData,
                      MOTIF_CONSULTATION: e.target.value
                    })}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Observations"
                    multiline
                    rows={3}
                    value={consultationData.OBSERVATIONS}
                    onChange={(e) => setConsultationData({
                      ...consultationData,
                      OBSERVATIONS: e.target.value
                    })}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Diagnostic"
                    multiline
                    rows={2}
                    value={consultationData.DIAGNOSTIC}
                    onChange={(e) => setConsultationData({
                      ...consultationData,
                      DIAGNOSTIC: e.target.value
                    })}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Traitement prescrit"
                    multiline
                    rows={2}
                    value={consultationData.TRAITEMENT_PRESCRIT}
                    onChange={(e) => setConsultationData({
                      ...consultationData,
                      TRAITEMENT_PRESCRIT: e.target.value
                    })}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      startIcon={<EditNoteIcon />}
                      onClick={openPrescriptionDialog}
                      disabled={!selectedPatient}
                    >
                      Créer prescription
                    </Button>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={consultationData.URGENT}
                          onChange={(e) => setConsultationData({
                            ...consultationData,
                            URGENT: e.target.checked
                          })}
                        />
                      }
                      label="Urgent"
                    />

                    <TextField
                      label="Prochain RDV"
                      type="date"
                      value={consultationData.PROCHAIN_RDV}
                      onChange={(e) => setConsultationData({
                        ...consultationData,
                        PROCHAIN_RDV: e.target.value
                      })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Box>
              )}

              {activeTab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: 300 }}>
                  {/* Messages du chat */}
                  <Box
                    ref={chatContainerRef}
                    sx={{
                      flexGrow: 1,
                      overflow: 'auto',
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      p: 2,
                      mb: 2,
                      bgcolor: '#f9f9f9'
                    }}
                  >
                    {chatMessages.map((message) => (
                      <Box
                        key={message.id}
                        sx={{
                          display: 'flex',
                          justifyContent: message.sender === 'doctor' ? 'flex-end' : 'flex-start',
                          mb: 2
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: '70%',
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: message.sender === 'doctor' ? '#e3f2fd' : '#f5f5f5',
                            border: '1px solid #e0e0e0',
                            position: 'relative'
                          }}
                        >
                          {message.sender === 'system' ? (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              {message.text}
                            </Typography>
                          ) : (
                            <>
                              <Typography variant="body2">
                                {message.text}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {message.timestamp} {message.sender === 'doctor' ? '• Vous' : ''}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {/* Saisie de message */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Tapez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      size="small"
                      disabled={!isConsultationActive}
                      multiline
                      maxRows={3}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                      multiple
                    />
                    <Tooltip title="Joindre un fichier">
                      <IconButton 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!isConsultationActive}
                      >
                        <AttachFileIcon />
                      </IconButton>
                    </Tooltip>
                    <IconButton 
                      color="primary" 
                      onClick={sendMessage}
                      disabled={!isConsultationActive || newMessage.trim() === ''}
                    >
                      <SendIcon />
                    </IconButton>
                  </Box>
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Documents partagés ({attachments.length})
                  </Typography>
                  
                  {uploadProgress > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress variant="determinate" value={uploadProgress} />
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                        Téléchargement en cours... {uploadProgress}%
                      </Typography>
                    </Box>
                  )}
                  
                  <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {attachments.map((file) => (
                      <ListItem
                        key={file.id}
                        secondaryAction={
                          <IconButton edge="end" size="small">
                            <DownloadIcon />
                          </IconButton>
                        }
                        sx={{ borderBottom: '1px solid #f0f0f0' }}
                      >
                        <ListItemAvatar>
                          <Avatar>
                            <AttachFileIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={file.name}
                          secondary={`${(file.size / 1024).toFixed(1)} KB • ${format(new Date(file.uploadedAt), 'dd/MM HH:mm')}`}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    disabled={!isConsultationActive}
                    sx={{ mt: 2 }}
                  >
                    Ajouter des documents
                    <input
                      type="file"
                      hidden
                      onChange={handleFileUpload}
                      multiple
                    />
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Colonne droite - Actions et statistiques */}
        <Grid item xs={12} md={3}>
          {/* Statut de la consultation */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statut de la consultation
              </Typography>
              
              {!isConsultationActive ? (
                <Alert severity="info" icon={<VideocamOffIcon />}>
                  Consultation non démarrée
                </Alert>
              ) : (
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  Consultation en cours
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Durée : {formatDuration(callDuration)}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    Qualité: Excellente
                  </Typography>
                </Alert>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Actions rapides
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<LinkIcon />}
                  onClick={generateMeetingLink}
                  disabled={!selectedPatient}
                  size="small"
                >
                  Créer lien de réunion
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<EditNoteIcon />}
                  onClick={openPrescriptionDialog}
                  disabled={!selectedPatient}
                  size="small"
                >
                  Nouvelle prescription
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<MedicalServicesIcon />}
                  onClick={() => navigate(`/patients/${selectedPatient?.id || selectedPatient?.ID_BEN}`)}
                  disabled={!selectedPatient}
                  size="small"
                >
                  Fiche patient
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<ChatIcon />}
                  onClick={() => setActiveTab(1)}
                  size="small"
                >
                  Ouvrir le chat
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistiques
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <Typography variant="h5">3</Typography>
                    <Typography variant="caption">Téléc. aujourd'hui</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                    <Typography variant="h5">15:24</Typography>
                    <Typography variant="caption">Durée moyenne</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="h5">94%</Typography>
                    <Typography variant="caption">Satisfaction</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                    <Typography variant="h5">2</Typography>
                    <Typography variant="caption">En attente</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Informations techniques */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations techniques
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Connexion"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: connectionStatus === 'connected' ? 'success.main' : 'error.main',
                          mr: 1 
                        }} />
                        {connectionStatus === 'connected' ? 'Stable' : 'Déconnecté'}
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Débit"
                    secondary="2.4 Mbps"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Latence"
                    secondary="45 ms"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Navigateur"
                    secondary={navigator.userAgent.split(' ')[0]}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog pour création de prescription */}
      <Dialog
        open={prescriptionDialog}
        onClose={() => setPrescriptionDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: '80vh' } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditNoteIcon sx={{ mr: 1 }} />
            Nouvelle prescription
            {selectedPatient && (
              <Chip 
                label={`${selectedPatient.nom} ${selectedPatient.prenom}`} 
                size="small" 
                sx={{ ml: 2 }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Patient: {selectedPatient?.nom} {selectedPatient?.prenom}
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 3, mt: 2 }}>
            <InputLabel>Type de prestation</InputLabel>
            <Select
              value={prescriptionData.TYPE_PRESTATION}
              onChange={(e) => setPrescriptionData({
                ...prescriptionData,
                TYPE_PRESTATION: e.target.value
              })}
              label="Type de prestation"
            >
              <MenuItem value="médicaments">Médicaments</MenuItem>
              <MenuItem value="examens">Examens complémentaires</MenuItem>
              <MenuItem value="soins">Soins</MenuItem>
              <MenuItem value="imagerie">Imagerie médicale</MenuItem>
              <MenuItem value="laboratoire">Analyses de laboratoire</MenuItem>
            </Select>
          </FormControl>

          {/* Recherche de médicaments */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Rechercher un médicament
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Nom du médicament..."
              value={medicamentSearch}
              onChange={(e) => setMedicamentSearch(e.target.value)}
              sx={{ mb: 1 }}
            />
            
            {medicamentResults.length > 0 && (
              <Paper sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
                <List dense>
                  {medicamentResults.map((med) => (
                    <ListItem
                      key={med.id}
                      button
                      onClick={() => addMedicamentToPrescription(med)}
                    >
                      <ListItemText
                        primary={med.libelle}
                        secondary={`${med.forme} • ${med.dosage || ''}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          {/* Liste des médicaments ajoutés */}
          {prescriptionData.details.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Médicaments prescrits ({prescriptionData.details.length})
              </Typography>
              <List dense>
                {prescriptionData.details.map((detail, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => {
                          const newDetails = [...prescriptionData.details];
                          newDetails.splice(index, 1);
                          setPrescriptionData({
                            ...prescriptionData,
                            details: newDetails
                          });
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={detail.LIBELLE}
                      secondary={`${detail.QUANTITE} ${detail.UNITE} • ${detail.POSOLOGIE}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <TextField
            fullWidth
            label="Observations"
            multiline
            rows={3}
            value={prescriptionData.OBSERVATIONS}
            onChange={(e) => setPrescriptionData({
              ...prescriptionData,
              OBSERVATIONS: e.target.value
            })}
            sx={{ mb: 2 }}
          />

          <Alert severity="info">
            La prescription sera automatiquement envoyée à la pharmacie après validation.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrescriptionDialog(false)}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={createPrescription}
            disabled={!selectedPatient || prescriptionData.details.length === 0}
            startIcon={<CheckCircleIcon />}
          >
            Créer la prescription
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour afficher le lien de réunion */}
      <Dialog
        open={meetingLinkDialog}
        onClose={() => setMeetingLinkDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LinkIcon sx={{ mr: 1 }} />
            Lien de réunion généré
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Partagez ce lien avec le patient pour qu'il puisse rejoindre la consultation:
          </Typography>
          
          <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
            <Typography 
              variant="body1" 
              sx={{ 
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                color: 'primary.main'
              }}
            >
              {meetingLink}
            </Typography>
          </Paper>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ContentCopyIcon />}
              onClick={copyMeetingLink}
            >
              Copier le lien
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                if (selectedPatient?.EMAIL) {
                  // Simuler l'envoi par email
                  const subject = encodeURIComponent('Lien pour votre téléconsultation');
                  const body = encodeURIComponent(`Bonjour,\n\nVoici le lien pour rejoindre votre téléconsultation : ${meetingLink}\n\nCordialement,`);
                  window.open(`mailto:${selectedPatient.EMAIL}?subject=${subject}&body=${body}`);
                } else {
                  setSnackbar({
                    open: true,
                    message: 'Email du patient non disponible',
                    severity: 'warning'
                  });
                }
              }}
              disabled={!selectedPatient?.EMAIL}
            >
              Envoyer par email
            </Button>
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            Ce lien est valable 24 heures. Le patient peut l'utiliser pour rejoindre la consultation à tout moment.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMeetingLinkDialog(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeleconsultationPage;