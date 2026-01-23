// FactureFicheSoins.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Stack,
  useTheme
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { beneficiairesAPI, facturationAPI } from '../../services/api';
import './FactureFicheSoins.css';

const FactureFicheSoins = ({ open, onClose, factureId, patientId }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [factureData, setFactureData] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [consultationData, setConsultationData] = useState(null);

  // Fonction pour formater les montants en FCFA
  const formatFCFA = (montant) => {
    if (!montant) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  };

  // Fonction pour calculer l'âge à partir de la date de naissance
  const calculateAge = (dateNaissance) => {
    if (!dateNaissance) return 'N/A';
    try {
      const birthDate = dateNaissance instanceof Date ? dateNaissance : new Date(dateNaissance);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      return 'N/A';
    }
  };

  // Charger les données
  useEffect(() => {
    if (open && (factureId || patientId)) {
      loadData();
    }
  }, [open, factureId, patientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les données du patient
      if (patientId) {
        const patientResponse = await beneficiairesAPI.getById(patientId);
        if (patientResponse.success) {
          setPatientData(patientResponse.beneficiaire || patientResponse.data);
        }
      }

      // Charger les données de la facture
      if (factureId) {
        const factureResponse = await facturationAPI.getFactureById(factureId);
        if (factureResponse.success) {
          const facture = factureResponse.facture || factureResponse.data;
          setFactureData(facture);

          // Si on a une facture mais pas de patientId, récupérer le patient à partir de la facture
          if (!patientId && facture.COD_BEN) {
            const patientResponse = await beneficiairesAPI.getById(facture.COD_BEN);
            if (patientResponse.success) {
              setPatientData(patientResponse.beneficiaire || patientResponse.data);
            }
          }
        }
      }

      // Charger les données de consultation si disponible
      if (factureId) {
        // Dans une implémentation réelle, vous auriez une API spécifique pour les consultations
        // Pour l'exemple, nous simulons des données de consultation
        const mockConsultationData = {
          date_consultation: factureData?.DATE_FACTURE || new Date().toISOString(),
          type_consultation: 'Consultation Opérationnelle',
          medecin: 'Dr. INCOMBO Lue',
          specialite: 'Dermatologie',
          centre: 'AMS-CONSULT',
          centre_protection: '35M SERVICE MÉDICAL',
          observations: 'Examen dermatologique standard. Peau en bon état général.',
          examen_supplementaire: 'Aucun',
          traitement_prescrit: 'Crème hydratante à appliquer 2 fois par jour',
          recommandations: 'Contrôle dans 3 mois',
          produits_medicaux: 'Crème hydratante 50ml',
          tension_arterielle: '120/80 mmHg',
          poids: '70 kg',
          taille: '175 cm',
          temperature: '36.5 °C',
          pouls: '72 bpm',
          frequence_respiratoire: '16 rpm',
          glycemie: '1.0 g/L'
        };
        setConsultationData(mockConsultationData);
      }

    } catch (error) {
      console.error('❌ Erreur chargement données facture:', error);
      setError('Erreur lors du chargement des données de la facture');
    } finally {
      setLoading(false);
    }
  };

  // Imprimer la facture
  const handlePrint = () => {
    window.print();
  };

  // Télécharger la facture en PDF
  const handleDownload = async () => {
    try {
      if (!factureId) {
        setError('Aucune facture sélectionnée pour le téléchargement');
        return;
      }

      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      
      const response = await fetch(`${API_URL}/facturation/factures/${factureId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture_fiche_soins_${factureId}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);

    } catch (error) {
      console.error('❌ Erreur téléchargement PDF:', error);
      setError('Erreur lors du téléchargement de la facture PDF');
    }
  };

  // Générer une facture avec des données par défaut si nécessaire
  const generateDefaultData = () => {
    return {
      numero: factureId || `FACT-${Date.now()}`,
      date_facture: new Date().toISOString(),
      montant_total: 8000,
      statut: 'À payer',
      montant_paye: 0,
      montant_restant: 8000
    };
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <LinearProgress />
          <Typography align="center" sx={{ mt: 2 }}>
            Chargement des données de la facture...
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  const facture = factureData || generateDefaultData();
  const patient = patientData || {};
  const consultation = consultationData || {};

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { 
          height: '90vh',
          maxHeight: '90vh',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        pb: 2
      }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ReceiptIcon color="primary" />
          <Typography variant="h6">
            FICHE DE SOINS - Facture
          </Typography>
        </Stack>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Contenu de la facture - optimisé pour l'impression */}
        <Container maxWidth="md" className="facture-container" sx={{ py: 4 }}>
          <Paper className="facture-paper" sx={{ p: 4, position: 'relative' }}>
            
            {/* En-tête de la facture */}
            <Box className="facture-header" sx={{ mb: 4, textAlign: 'center', borderBottom: '2px solid #000', pb: 2 }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                FICHE DE SOINS
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
                AMS-CONSULTATIONS MÉDICALES
              </Typography>
              <Typography variant="body1">
                123 Avenue de la Boite, 75005 Paris
              </Typography>
              <Typography variant="body1">
                Tel. +03 12 61 67 69 | fiche@ams-consignements.fr
              </Typography>
            </Box>

            {/* 1. INFORMATIONS DU PATIENT */}
            <Box className="patient-info" sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ 
                borderBottom: '1px solid #ccc',
                pb: 1,
                mb: 2
              }}>
                1. INFORMATIONS DU PATIENT
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Nom et Prénom :</strong> {patient.NOM_BEN || patient.nom} {patient.PRE_BEN || patient.prenom}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2">
                    <strong>Date de naissance :</strong> {patient.NAI_BEN ? format(new Date(patient.NAI_BEN), 'dd/MM/yyyy') : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2">
                    <strong>Âge :</strong> {calculateAge(patient.NAI_BEN)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Sexe :</strong> {patient.SEX_BEN || patient.sexe || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Identifiant :</strong> {patient.IDENTIFIANT_NATIONAL || patient.identifiant || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Téléphone :</strong> {patient.TELEPHONE_MOBILE || patient.telephone || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Email :</strong> {patient.EMAIL || patient.email || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Assuré principal :</strong> {patient.nom_assure_principal || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Employeur :</strong> {patient.EMPLOYEUR || patient.employeur || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Statut ACE :</strong> {patient.STATUT_ACE || patient.statut_ace || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* 2. INFORMATIONS DE LA CONSULTATION */}
            <Box className="consultation-info" sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ 
                borderBottom: '1px solid #ccc',
                pb: 1,
                mb: 2
              }}>
                2. INFORMATIONS DE LA CONSULTATION
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2">
                    <strong>Date de consultation :</strong> {consultation.date_consultation ? format(new Date(consultation.date_consultation), 'dd/MM/yyyy') : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2">
                    <strong>Heure :</strong> {consultation.date_consultation ? format(new Date(consultation.date_consultation), 'HH:mm') : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2">
                    <strong>Type de consultation :</strong> {consultation.type_consultation || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Médecin consulté :</strong> {consultation.medecin || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Spécialité :</strong> {consultation.specialite || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Centre sollicité :</strong> {consultation.centre || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Centre de protection :</strong> {consultation.centre_protection || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* 3. INFORMATIONS MÉDICALES */}
            <Box className="medical-info" sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ 
                borderBottom: '1px solid #ccc',
                pb: 1,
                mb: 2
              }}>
                3. INFORMATIONS MÉDICALES
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Observations médicales :</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2, fontStyle: 'italic' }}>
                    {consultation.observations || 'Aucune observation particulière'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Examen supplémentaire prescrit :</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    {consultation.examen_supplementaire || 'Aucun'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Traitement prescrit :</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    {consultation.traitement_prescrit || 'Aucun'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Recommandations et contrôle :</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    {consultation.recommandations || 'Aucune recommandation particulière'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Produits médicaux :</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    {consultation.produits_medicaux || 'Aucun'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* 4. SIGNES VITAUX */}
            <Box className="vitals-info" sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ 
                borderBottom: '1px solid #ccc',
                pb: 1,
                mb: 2
              }}>
                4. SIGNES VITAUX
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>TENSION ARTÉRIELLE</strong></TableCell>
                      <TableCell><strong>POIDS</strong></TableCell>
                      <TableCell><strong>TAILLE</strong></TableCell>
                      <TableCell><strong>TEMPÉRATURE</strong></TableCell>
                      <TableCell><strong>POULS</strong></TableCell>
                      <TableCell><strong>FRÉQUENCE RESPIRATOIRE</strong></TableCell>
                      <TableCell><strong>GLYCÉMIE</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{consultation.tension_arterielle || 'N/A'}</TableCell>
                      <TableCell>{consultation.poids || 'N/A'}</TableCell>
                      <TableCell>{consultation.taille || 'N/A'}</TableCell>
                      <TableCell>{consultation.temperature || 'N/A'}</TableCell>
                      <TableCell>{consultation.pouls || 'N/A'}</TableCell>
                      <TableCell>{consultation.frequence_respiratoire || 'N/A'}</TableCell>
                      <TableCell>{consultation.glycemie || 'N/A'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* 5. DÉCOMPTE FINANCIER */}
            <Box className="financial-info" sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ 
                borderBottom: '1px solid #ccc',
                pb: 1,
                mb: 2
              }}>
                5. DÉCOMPTE FINANCIER
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body1">
                    <strong>Montant total de la consultation :</strong> {formatFCFA(facture.montant_total)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Type de paiement :</strong> {facture.method_paiement || 'Non spécifié'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Statut du paiement :</strong> {facture.statut || 'À payer'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="success.main">
                    <strong>Montant payé :</strong> {formatFCFA(facture.montant_paye)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="error.main" fontWeight="bold">
                    <strong>Reste à charge patient :</strong> {formatFCFA(facture.montant_restant)}
                  </Typography>
                </Grid>
                
                {facture.reference && (
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Référence de paiement :</strong> {facture.reference}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Signatures */}
            <Box className="signatures" sx={{ mt: 6, pt: 4, borderTop: '1px dashed #000' }}>
              <Grid container spacing={4}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body1" fontWeight="bold" gutterBottom>
                      LE MÉDECIN
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      {consultation.medecin || 'Dr. INCOMBO Lue'}
                    </Typography>
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #000', minHeight: 60 }}>
                      <Typography variant="caption" color="text.secondary">
                        Signature et cachet du médecin
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body1" fontWeight="bold" gutterBottom>
                      LE PATIENT
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      {patient.NOM_BEN || patient.nom} {patient.PRE_BEN || patient.prenom}
                    </Typography>
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #000', minHeight: 60 }}>
                      <Typography variant="caption" color="text.secondary">
                        Signature du patient ou de son représentant légal
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Footer */}
            <Box className="facture-footer" sx={{ mt: 4, pt: 2, borderTop: '1px solid #ccc', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Document généré le {format(new Date(), 'dd/MM/yyyy à HH:mm')} • 
                Numéro de facture : {facture.numero || facture.id || 'N/A'} • 
                Toute reproduction est interdite
              </Typography>
            </Box>
          </Paper>
        </Container>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          startIcon={<CloseIcon />}
          onClick={onClose}
          variant="outlined"
        >
          Fermer
        </Button>
        <Button
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          variant="contained"
          color="primary"
        >
          Imprimer
        </Button>
        <Button
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          variant="contained"
          color="success"
          disabled={!factureId}
        >
          Télécharger PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FactureFicheSoins;