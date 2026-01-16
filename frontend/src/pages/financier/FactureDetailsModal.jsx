// src/components/facturation/FactureDetailsModal.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  MonetizationOn as MonetizationIcon
} from '@mui/icons-material';

const FactureDetailsModal = ({ open, onClose, facture, onPrint }) => {
  if (!facture) return null;

  const handlePrint = () => {
    if (onPrint) {
      onPrint(facture.id);
    }
  };

  const handleDownload = () => {
    window.open(`/api/facturation/facture/${facture.id}/download`, '_blank');
  };

  const handleSendEmail = () => {
    window.open(`mailto:${facture.payeur_email}?subject=Facture ${facture.numero}`, '_blank');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" />
            <Typography variant="h6">
              Facture #{facture.numero}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* En-tête de la facture */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Payeur
              </Typography>
              <Typography variant="h6" gutterBottom>
                {facture.payeur_nom}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {facture.payeur_type}
              </Typography>
              {facture.payeur_contact && (
                <Typography variant="body2">
                  Contact: {facture.payeur_contact}
                </Typography>
              )}
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                État de la facture
              </Typography>
              <Chip
                label={facture.statut}
                color={
                  facture.statut === 'payee' ? 'success' :
                  facture.statut === 'en_attente' ? 'warning' :
                  'default'
                }
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Date de création: {new Date(facture.date_creation).toLocaleDateString('fr-FR')}
              </Typography>
              {facture.date_paiement && (
                <Typography variant="body2" color="text.secondary">
                  Date de paiement: {new Date(facture.date_paiement).toLocaleDateString('fr-FR')}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Détails des prestations */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Détail des prestations
        </Typography>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Patient</strong></TableCell>
                <TableCell><strong>Prestation</strong></TableCell>
                <TableCell align="right"><strong>Montant (FCFA)</strong></TableCell>
                <TableCell align="right"><strong>Déjà payé (FCFA)</strong></TableCell>
                <TableCell align="right"><strong>À payer (FCFA)</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {facture.prestations?.map((prestation, index) => (
                <TableRow key={prestation.id || index}>
                  <TableCell>
                    {new Date(prestation.date).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {prestation.patient_nom} {prestation.patient_prenom}
                  </TableCell>
                  <TableCell>
                    {prestation.type_prestation}
                    {prestation.code_affection && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Code: {prestation.code_affection}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {(prestation.montant || 0).toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'success.main' }}>
                    {(prestation.montant_paye || 0).toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                    {((prestation.montant || 0) - (prestation.montant_paye || 0)).toLocaleString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Récapitulatif financier */}
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'primary.light' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Montant total
              </Typography>
              <Typography variant="h5">
                {facture.montant_total?.toLocaleString('fr-FR')} FCFA
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Montant déjà payé
              </Typography>
              <Typography variant="h5" color="success.main">
                {facture.montant_deja_paye?.toLocaleString('fr-FR')} FCFA
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Solde à payer
              </Typography>
              <Typography variant="h5" color="warning.main">
                {facture.solde_a_payer?.toLocaleString('fr-FR')} FCFA
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Notes et observations */}
        {facture.notes && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Notes
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2">
                {facture.notes}
              </Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>
          Fermer
        </Button>
        <Button
          startIcon={<EmailIcon />}
          onClick={handleSendEmail}
          disabled={!facture.payeur_email}
        >
          Envoyer par email
        </Button>
        <Button
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Télécharger
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Imprimer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FactureDetailsModal;