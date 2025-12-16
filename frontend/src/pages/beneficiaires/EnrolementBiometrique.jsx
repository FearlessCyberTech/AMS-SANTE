import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  CameraAlt as CameraIcon,
  Fingerprint as FingerprintIcon,
  Edit as SignatureIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  PhotoCamera as PhotoCameraIcon,
  TouchApp as TouchAppIcon,
  Create as CreateIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Webcam from 'react-webcam';
import SignatureCanvas from 'react-signature-canvas';

// Services
import { patientsAPI } from '../../services/api';
import biometrieAPI from '../../services/biometrieAPI';

// Configuration doigts
const DOIGTS = [
  { code: 'pouce_gauche', label: 'Pouce gauche', main: true },
  { code: 'index_gauche', label: 'Index gauche', main: false },
  { code: 'majeur_gauche', label: 'Majeur gauche', main: false },
  { code: 'annulaire_gauche', label: 'Annulaire gauche', main: false },
  { code: 'auriculaire_gauche', label: 'Auriculaire gauche', main: false },
  { code: 'pouce_droit', label: 'Pouce droit', main: true },
  { code: 'index_droit', label: 'Index droit', main: false },
  { code: 'majeur_droit', label: 'Majeur droit', main: false },
  { code: 'annulaire_droit', label: 'Annulaire droit', main: false },
  { code: 'auriculaire_droit', label: 'Auriculaire droit', main: false }
];

const Etapes = [
  'Recherche Patient',
  'Capture Photo',
  'Capture Empreintes',
  'Capture Signature',
  'Validation'
];

const StyledWebcamContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: 640,
  margin: '0 auto',
  border: `2px solid ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  backgroundColor: '#000'
}));

const CaptureButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  bottom: 20,
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark
  }
}));

const SignatureContainer = styled(Paper)(({ theme }) => ({
  width: '100%',
  height: 300,
  border: `2px solid ${theme.palette.grey[300]}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  position: 'relative'
}));

const DoigtButton = styled(Button)(({ theme, captured }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: captured ? theme.palette.success.light : theme.palette.grey[200],
  color: captured ? 'white' : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: captured ? theme.palette.success.main : theme.palette.grey[300]
  }
}));

function BiometrieEnrolement() {
  // États
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Patient
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientStats, setPatientStats] = useState(null);
  
  // Capture
  const [photo, setPhoto] = useState(null);
  const [empreintes, setEmpreintes] = useState({});
  const [signature, setSignature] = useState(null);
  
  // Références
  const webcamRef = useRef(null);
  const signatureRef = useRef(null);
  
  // Dialog
  const [viewDialog, setViewDialog] = useState(false);
  const [viewData, setViewData] = useState(null);

  // Recherche de patients
  const handleSearch = async () => {
    if (searchTerm.length < 2) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await patientsAPI.search(searchTerm);
      if (response.success) {
        setPatients(response.patients || []);
      } else {
        setError('Erreur lors de la recherche');
      }
    } catch (err) {
      setError('Erreur réseau lors de la recherche');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sélectionner un patient
  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setPatients([]);
    setSearchTerm('');
    
    // Charger les données biométriques existantes
    try {
      const response = await biometrieAPI.verifierEtat(patient.id);
      if (response.success) {
        setPatientStats(response.stats);
        
        // Charger les données existantes si disponibles
        if (response.enregistrements) {
          const empreintesCaptured = {};
          response.enregistrements.forEach(record => {
            if (record.type === 'empreinte' && record.doigt) {
              empreintesCaptured[record.doigt] = true;
            } else if (record.type === 'photo') {
              setPhoto(true); // Marquer comme capturé
            } else if (record.type === 'signature') {
              setSignature(true); // Marquer comme capturé
            }
          });
          setEmpreintes(empreintesCaptured);
        }
      }
    } catch (err) {
      console.error('Erreur chargement données existantes:', err);
    }
    
    // Passer à l'étape suivante
    setActiveStep(1);
  };

  // Capturer une photo
  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setPhoto(imageSrc);
      
      // Enregistrer immédiatement
      enregistrerPhoto(imageSrc);
    }
  };

  // Capturer une empreinte
  const captureEmpreinte = (doigt) => {
    // Dans une implémentation réelle, on utiliserait un scanner d'empreintes
    // Pour la démo, on simule la capture
    setEmpreintes(prev => ({
      ...prev,
      [doigt]: true
    }));
    
    // Simuler l'enregistrement
    setTimeout(() => {
      enregistrerEmpreinte(doigt);
    }, 500);
  };

  // Enregistrer la signature
  const saveSignature = () => {
    if (signatureRef.current) {
      const signatureData = signatureRef.current.toDataURL();
      setSignature(signatureData);
      
      // Enregistrer immédiatement
      enregistrerSignature(signatureData);
    }
  };

  // Effacer la signature
  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setSignature(null);
    }
  };

  // API Calls
  const enregistrerPhoto = async (imageData) => {
    try {
      const response = await biometrieAPI.enregistrer({
        ID_BEN: selectedPatient.id,
        TYPE_BIOMETRIE: 'photo',
        DATA_BASE64: imageData,
        FORMAT_DATA: 'image/jpeg',
        QUALITE: 85,
        STATUT: 'complet'
      });
      
      if (response.success) {
        console.log('✅ Photo enregistrée:', response);
        setPatientStats(response.stats);
      }
    } catch (err) {
      console.error('❌ Erreur enregistrement photo:', err);
    }
  };

  const enregistrerEmpreinte = async (doigt) => {
    try {
      // Simuler des données d'empreinte
      const empreinteData = `simulated_fingerprint_data_${doigt}_${Date.now()}`;
      
      const response = await biometrieAPI.enregistrer({
        ID_BEN: selectedPatient.id,
        TYPE_BIOMETRIE: 'empreinte',
        DATA_BASE64: btoa(empreinteData), // En base64 pour la simulation
        FORMAT_DATA: 'template/fingerprint',
        QUALITE: 90,
        DOIGT: doigt,
        STATUT: 'complet'
      });
      
      if (response.success) {
        console.log(`✅ Empreinte ${doigt} enregistrée:`, response);
        setPatientStats(response.stats);
      }
    } catch (err) {
      console.error('❌ Erreur enregistrement empreinte:', err);
    }
  };

  const enregistrerSignature = async (signatureData) => {
    try {
      const response = await biometrieAPI.enregistrer({
        ID_BEN: selectedPatient.id,
        TYPE_BIOMETRIE: 'signature',
        DATA_BASE64: signatureData,
        FORMAT_DATA: 'image/png',
        QUALITE: 80,
        STATUT: 'complet'
      });
      
      if (response.success) {
        console.log('✅ Signature enregistrée:', response);
        setPatientStats(response.stats);
      }
    } catch (err) {
      console.error('❌ Erreur enregistrement signature:', err);
    }
  };

  // Valider l'enrolement
  const handleValidate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Vérifier si tout est complet
      const empreintesCaptured = Object.keys(empreintes).length >= 2;
      
      if (!photo) {
        setError('La photo est requise');
        return;
      }
      
      if (!empreintesCaptured) {
        setError('Au moins 2 empreintes sont requises');
        return;
      }
      
      if (!signature) {
        setError('La signature est requise');
        return;
      }
      
      // Tout est valide
      setSuccess('Enrolement biométrique complété avec succès !');
      setActiveStep(Etapes.length - 1);
      
    } catch (err) {
      setError('Erreur lors de la validation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser
  const handleReset = () => {
    setActiveStep(0);
    setSelectedPatient(null);
    setPhoto(null);
    setEmpreintes({});
    setSignature(null);
    setPatientStats(null);
    setError(null);
    setSuccess(null);
  };

  // Afficher les données
  const handleViewData = async (type, doigt = null) => {
    try {
      // Dans une implémentation réelle, on récupérerait les données depuis l'API
      setViewData({
        type,
        doigt,
        data: type === 'photo' ? photo : 
              type === 'signature' ? signature : 
              `Données empreinte ${doigt}`
      });
      setViewDialog(true);
    } catch (err) {
      console.error('Erreur affichage données:', err);
    }
  };

  // Étape 1: Recherche Patient
  const renderStep1 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Rechercher un patient
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Nom, prénom ou identifiant"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleSearch}>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
      
      {loading && (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress />
        </Box>
      )}
      
      {patients.length > 0 && (
        <List>
          {patients.map((patient) => (
            <React.Fragment key={patient.id}>
              <ListItem 
                button 
                onClick={() => handleSelectPatient(patient)}
                sx={{ 
                  '&:hover': { backgroundColor: 'action.hover' },
                  borderRadius: 1
                }}
              >
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary={`${patient.nom} ${patient.prenom}`}
                  secondary={`ID: ${patient.id} • ${patient.sexe || 'N/A'} • ${patient.age || 'N/A'} ans`}
                />
                {patient.identifiant && (
                  <Chip label={patient.identifiant} size="small" />
                )}
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );

  // Étape 2: Capture Photo
  const renderStep2 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Capture de la photo d'identité
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        {selectedPatient && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1">
                Patient: {selectedPatient.nom} {selectedPatient.prenom}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ID: {selectedPatient.id} • {selectedPatient.sexe || 'N/A'} • {selectedPatient.age || 'N/A'} ans
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StyledWebcamContainer>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              width="100%"
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: "user"
              }}
            />
            <CaptureButton
              variant="contained"
              startIcon={<CameraIcon />}
              onClick={capturePhoto}
            >
              Prendre la photo
            </CaptureButton>
          </StyledWebcamContainer>
          
          <Box mt={2}>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(0)}
              startIcon={<ArrowBackIcon />}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              onClick={() => setActiveStep(2)}
              disabled={!photo}
              sx={{ ml: 2 }}
              endIcon={<FingerprintIcon />}
            >
              Continuer
            </Button>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          {photo && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Photo capturée
                </Typography>
                <Box
                  component="img"
                  src={photo}
                  alt="Photo capturée"
                  sx={{
                    width: '100%',
                    maxWidth: 300,
                    borderRadius: 1,
                    border: '1px solid #ddd'
                  }}
                />
                <Box mt={2}>
                  <Button
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={() => setPhoto(null)}
                    size="small"
                  >
                    Reprendre
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
          
          {patientStats && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Progression biométrique
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center">
                    <PhotoCameraIcon color={photo ? "success" : "disabled"} sx={{ mr: 1 }} />
                    <Typography>Photo</Typography>
                  </Box>
                  <Chip 
                    label={photo ? "✓ Capturée" : "En attente"} 
                    color={photo ? "success" : "default"} 
                    size="small" 
                  />
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  // Étape 3: Capture Empreintes
  const renderStep3 = () => {
    const empreintesCaptured = Object.keys(empreintes).length;
    const mainEmpreintesCaptured = DOIGTS.filter(d => d.main).filter(d => empreintes[d.code]).length;
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Capture des empreintes digitales
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Veuillez capturer au minimum 2 empreintes digitales (recommandé: pouce gauche et pouce droit)
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Main gauche
                </Typography>
                <Box display="flex" flexWrap="wrap">
                  {DOIGTS.filter(d => d.code.includes('gauche')).map((doigt) => (
                    <DoigtButton
                      key={doigt.code}
                      variant="contained"
                      size="small"
                      startIcon={<TouchAppIcon />}
                      captured={empreintes[doigt.code]}
                      onClick={() => captureEmpreinte(doigt.code)}
                    >
                      {doigt.label}
                    </DoigtButton>
                  ))}
                </Box>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Main droite
                </Typography>
                <Box display="flex" flexWrap="wrap">
                  {DOIGTS.filter(d => d.code.includes('droit')).map((doigt) => (
                    <DoigtButton
                      key={doigt.code}
                      variant="contained"
                      size="small"
                      startIcon={<TouchAppIcon />}
                      captured={empreintes[doigt.code]}
                      onClick={() => captureEmpreinte(doigt.code)}
                    >
                      {doigt.label}
                    </DoigtButton>
                  ))}
                </Box>
              </CardContent>
            </Card>
            
            <Box mt={3}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(1)}
                startIcon={<ArrowBackIcon />}
              >
                Retour
              </Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(3)}
                disabled={empreintesCaptured < 2}
                sx={{ ml: 2 }}
                endIcon={<SignatureIcon />}
              >
                Continuer
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Résumé des captures
                </Typography>
                
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Empreintes capturées: {empreintesCaptured}/10
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Empreintes principales: {mainEmpreintesCaptured}/2
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Détail par doigt:
                </Typography>
                <List dense>
                  {DOIGTS.map((doigt) => (
                    <ListItem key={doigt.code}>
                      <ListItemIcon>
                        {empreintes[doigt.code] ? (
                          <CheckIcon color="success" />
                        ) : (
                          <CancelIcon color="disabled" />
                        )}
                      </ListItemIcon>
                      <ListItemText 
                        primary={doigt.label}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: empreintes[doigt.code] ? 'text.primary' : 'text.disabled'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
            
            {patientStats && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Progression biométrique
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box display="flex" alignItems="center">
                      <PhotoCameraIcon color={photo ? "success" : "disabled"} sx={{ mr: 1 }} />
                      <Typography variant="body2">Photo</Typography>
                    </Box>
                    <Chip 
                      label={photo ? "✓" : "✗"} 
                      color={photo ? "success" : "default"} 
                      size="small" 
                    />
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                      <FingerprintIcon color={empreintesCaptured >= 2 ? "success" : "disabled"} sx={{ mr: 1 }} />
                      <Typography variant="body2">Empreintes</Typography>
                    </Box>
                    <Chip 
                      label={`${empreintesCaptured}/10`} 
                      color={empreintesCaptured >= 2 ? "success" : "default"} 
                      size="small" 
                    />
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Étape 4: Capture Signature
  const renderStep4 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Capture de la signature
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Veuillez signer dans la zone ci-dessous en utilisant la souris ou le doigt (sur écran tactile)
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <SignatureContainer>
            <SignatureCanvas
              ref={signatureRef}
              penColor="black"
              backgroundColor="white"
              canvasProps={{
                width: 800,
                height: 300,
                className: 'signature-canvas'
              }}
            />
          </SignatureContainer>
          
          <Box mt={2} display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={clearSignature}
            >
              Effacer
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveSignature}
            >
              Enregistrer la signature
            </Button>
          </Box>
          
          <Box mt={3}>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(2)}
              startIcon={<ArrowBackIcon />}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              onClick={handleValidate}
              disabled={!signature}
              sx={{ ml: 2 }}
              endIcon={<CheckIcon />}
            >
              Valider l'enrolement
            </Button>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {signature && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Signature capturée
                </Typography>
                <Box
                  component="img"
                  src={signature}
                  alt="Signature"
                  sx={{
                    width: '100%',
                    border: '1px solid #ddd',
                    borderRadius: 1
                  }}
                />
              </CardContent>
            </Card>
          )}
          
          {patientStats && (
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Progression biométrique
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center">
                    <PhotoCameraIcon color={photo ? "success" : "disabled"} sx={{ mr: 1 }} />
                    <Typography variant="body2">Photo</Typography>
                  </Box>
                  <Chip 
                    label={photo ? "✓" : "✗"} 
                    color={photo ? "success" : "default"} 
                    size="small" 
                  />
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center">
                    <FingerprintIcon 
                      color={Object.keys(empreintes).length >= 2 ? "success" : "disabled"} 
                      sx={{ mr: 1 }} 
                    />
                    <Typography variant="body2">Empreintes</Typography>
                  </Box>
                  <Chip 
                    label={`${Object.keys(empreintes).length}/10`} 
                    color={Object.keys(empreintes).length >= 2 ? "success" : "default"} 
                    size="small" 
                  />
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center">
                    <CreateIcon color={signature ? "success" : "disabled"} sx={{ mr: 1 }} />
                    <Typography variant="body2">Signature</Typography>
                  </Box>
                  <Chip 
                    label={signature ? "✓" : "✗"} 
                    color={signature ? "success" : "default"} 
                    size="small" 
                  />
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2">Statut complet:</Typography>
                  <Chip 
                    label={patientStats?.complet ? "✓ COMPLET" : "INCOMPLET"} 
                    color={patientStats?.complet ? "success" : "warning"} 
                    size="small" 
                  />
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  // Étape 5: Validation
  const renderStep5 = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
      
      <Typography variant="h5" gutterBottom>
        Enrolement biométrique complété avec succès !
      </Typography>
      
      {selectedPatient && (
        <Card sx={{ maxWidth: 400, mx: 'auto', mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Récapitulatif
            </Typography>
            
            <Box textAlign="left">
              <Typography variant="body1">
                <strong>Patient:</strong> {selectedPatient.nom} {selectedPatient.prenom}
              </Typography>
              <Typography variant="body1">
                <strong>ID Patient:</strong> {selectedPatient.id}
              </Typography>
              <Typography variant="body1">
                <strong>Photo:</strong> {photo ? '✓ Capturée' : '✗ Manquante'}
              </Typography>
              <Typography variant="body1">
                <strong>Empreintes:</strong> {Object.keys(empreintes).length}/10 capturées
              </Typography>
              <Typography variant="body1">
                <strong>Signature:</strong> {signature ? '✓ Capturée' : '✗ Manquante'}
              </Typography>
            </Box>
          </CardContent>
          
          <CardActions sx={{ justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleReset}
              startIcon={<RefreshIcon />}
            >
              Nouvel enrolement
            </Button>
          </CardActions>
        </Card>
      )}
      
      <Box mt={4}>
        <Button
          variant="outlined"
          onClick={() => window.print()}
          sx={{ mr: 2 }}
        >
          Imprimer le certificat
        </Button>
        <Button
          variant="contained"
          onClick={() => window.location.href = '/patients'}
        >
          Retour à la liste des patients
        </Button>
      </Box>
    </Box>
  );

  // Rendu principal
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          🎯 Enrolement Biométrique
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Capturez les données biométriques du patient (photo, empreintes digitales, signature)
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {Etapes.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 3 }}>
          {activeStep === 0 && renderStep1()}
          {activeStep === 1 && renderStep2()}
          {activeStep === 2 && renderStep3()}
          {activeStep === 3 && renderStep4()}
          {activeStep === 4 && renderStep5()}
        </Box>
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress />
          </Box>
        )}
      </Paper>
      
      {/* Dialog pour visualiser les données */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md">
        <DialogTitle>
          Visualisation des données biométriques
        </DialogTitle>
        <DialogContent>
          {viewData && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Type: {viewData.type} {viewData.doigt && `- ${viewData.doigt}`}
              </Typography>
              
              {viewData.type === 'photo' || viewData.type === 'signature' ? (
                <Box
                  component="img"
                  src={viewData.data}
                  alt={viewData.type}
                  sx={{ width: '100%', maxHeight: 400, objectFit: 'contain' }}
                />
              ) : (
                <Paper sx={{ p: 2, backgroundColor: 'grey.100' }}>
                  <Typography variant="body2" fontFamily="monospace">
                    {viewData.data}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default BiometrieEnrolement;