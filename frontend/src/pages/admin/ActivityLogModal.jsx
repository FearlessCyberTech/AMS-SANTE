// src/components/admin/ActivityLogModal.jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow
} from '@mui/material';
import {
  History as HistoryIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ActivityLogModal = ({ open, onClose, log }) => {
  if (!log) return null;
  
  const getSeverityIcon = (actionType) => {
    switch (actionType) {
      case 'ERROR': return <ErrorIcon color="error" />;
      case 'WARNING': return <WarningIcon color="warning" />;
      case 'SUCCESS': return <CheckCircleIcon color="success" />;
      default: return <InfoIcon />;
    }
  };
  
  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'warning';
      case 'DELETE': return 'error';
      case 'READ': return 'info';
      default: return 'default';
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Détails de l'activité
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {log.action_type} - {log.entity_type}
          </Typography>
          
          <Chip
            label={log.action_type}
            color={getActionColor(log.action_type)}
            sx={{ mr: 1, mb: 1 }}
          />
          
          {log.severity && (
            <Chip
              label={log.severity}
              icon={getSeverityIcon(log.severity)}
              variant="outlined"
              sx={{ mb: 1 }}
            />
          )}
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Utilisateur
              </Typography>
              <Typography variant="body2">
                {log.user || 'Système'}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                <ComputerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Adresse IP
              </Typography>
              <Typography variant="body2">
                {log.ip_address || 'Inconnue'}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                User Agent
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                {log.user_agent || 'Non spécifié'}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Métadonnées
              </Typography>
              
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Date/Heure</TableCell>
                    <TableCell>
                      {format(new Date(log.timestamp), 'PPPpp', { locale: fr })}
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell>Entité</TableCell>
                    <TableCell>
                      {log.entity_type} #{log.entity_id}
                    </TableCell>
                  </TableRow>
                  
                  {log.session_id && (
                    <TableRow>
                      <TableCell>Session</TableCell>
                      <TableCell>{log.session_id}</TableCell>
                    </TableRow>
                  )}
                  
                  {log.duration && (
                    <TableRow>
                      <TableCell>Durée</TableCell>
                      <TableCell>{log.duration}ms</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Détails
          </Typography>
          
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" component="pre" sx={{ 
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }}>
              {JSON.stringify(log.details, null, 2)}
            </Typography>
          </Paper>
        </Box>
        
        {log.changes && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Modifications
            </Typography>
            
            <Paper variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Champ</TableCell>
                    <TableCell>Ancienne valeur</TableCell>
                    <TableCell>Nouvelle valeur</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(log.changes).map(([field, values]) => (
                    <TableRow key={field}>
                      <TableCell>{field}</TableCell>
                      <TableCell>
                        <Typography noWrap sx={{ maxWidth: 150 }}>
                          {JSON.stringify(values.old)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography noWrap sx={{ maxWidth: 150 }}>
                          {JSON.stringify(values.new)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityLogModal;