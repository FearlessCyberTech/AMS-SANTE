// src/components/Administration/AuditLogDetails.jsx
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
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableRow
} from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Person as PersonIcon,
  Computer as ComputerIcon,
  Description as DescriptionIcon,
  Security as SecurityIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const AuditLogDetails = ({ open, onClose, log }) => {
  if (!log) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  const getActionColor = (action) => {
    if (!action) return 'default';
    if (action.includes('CONNEXION') || action.includes('LOGIN')) return 'info';
    if (action.includes('CREATE') || action.includes('AJOUT')) return 'success';
    if (action.includes('UPDATE') || action.includes('MODIF')) return 'warning';
    if (action.includes('DELETE') || action.includes('SUPPR')) return 'error';
    if (action.includes('ERROR') || action.includes('ERREUR')) return 'error';
    return 'default';
  };

  const sections = [
    {
      title: 'Informations générales',
      icon: <InfoIcon />,
      items: [
        { label: 'Date/Heure', value: formatDateTime(log.timestamp || log.date) },
        { label: 'Action', value: log.action, chip: true, color: getActionColor(log.action) },
        { label: 'Résultat', value: log.resultat || 'SUCCESS', chip: true, 
          color: (log.resultat === 'SUCCESS' || !log.resultat) ? 'success' : 'error' },
        { label: 'Module', value: log.module || 'N/A' },
        { label: 'Sous-module', value: log.sous_module || 'N/A' }
      ]
    },
    {
      title: 'Informations utilisateur',
      icon: <PersonIcon />,
      items: [
        { label: 'Utilisateur', value: log.username || log.user || 'N/A' },
        { label: 'ID Utilisateur', value: log.user_id || log.ID_UTI || 'N/A' },
        { label: 'Profil', value: log.profil || log.PROFIL_UTI || 'N/A' },
        { label: 'Session ID', value: log.session_id || log.ID_SESSION || 'N/A', monospace: true }
      ]
    },
    {
      title: 'Informations réseau',
      icon: <ComputerIcon />,
      items: [
        { label: 'Adresse IP', value: log.ip || log.adresse_ip || 'N/A', monospace: true },
        { label: 'User Agent', value: log.user_agent || 'N/A' },
        { label: 'Navigateur', value: log.browser || 'N/A' },
        { label: 'Système d\'exploitation', value: log.os || 'N/A' },
        { label: 'Appareil', value: log.device || 'N/A' }
      ]
    },
    {
      title: 'Données de l\'action',
      icon: <DescriptionIcon />,
      items: [
        { label: 'Détails', value: log.details || 'Aucun détail', longText: true },
        { label: 'Anciennes valeurs', value: log.old_values ? JSON.stringify(log.old_values, null, 2) : 'N/A', 
          longText: true, monospace: true },
        { label: 'Nouvelles valeurs', value: log.new_values ? JSON.stringify(log.new_values, null, 2) : 'N/A', 
          longText: true, monospace: true },
        { label: 'ID Enregistrement', value: log.record_id || 'N/A' },
        { label: 'Table concernée', value: log.table_name || 'N/A' }
      ]
    }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <SecurityIcon />
        Détails du log d'audit
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mt: 2 }}>
          {/* Alert pour les erreurs */}
          {log.resultat && log.resultat !== 'SUCCESS' && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Action échouée: {log.details}
            </Alert>
          )}

          {/* Sections d'informations */}
          {sections.map((section, index) => (
            <Box key={index} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: 'primary.main'
              }}>
                {section.icon}
                {section.title}
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  {section.items.map((item, itemIndex) => (
                    <Grid item xs={12} key={itemIndex}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: item.longText ? 'column' : 'row',
                        alignItems: item.longText ? 'flex-start' : 'center',
                        gap: 1
                      }}>
                        <Typography variant="subtitle2" sx={{ 
                          minWidth: 150,
                          color: 'text.secondary',
                          fontWeight: 'bold'
                        }}>
                          {item.label}:
                        </Typography>
                        
                        {item.chip ? (
                          <Chip 
                            label={item.value} 
                            size="small" 
                            color={item.color}
                            variant="outlined"
                          />
                        ) : item.longText ? (
                          <Paper 
                            variant="outlined" 
                            sx={{ 
                              p: 2, 
                              width: '100%',
                              maxHeight: 200,
                              overflow: 'auto',
                              bgcolor: 'background.default'
                            }}
                          >
                            <Typography 
                              variant="body2" 
                              component="pre"
                              sx={{ 
                                fontFamily: item.monospace ? 'monospace' : 'inherit',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                margin: 0
                              }}
                            >
                              {item.value}
                            </Typography>
                          </Paper>
                        ) : (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: item.monospace ? 'monospace' : 'inherit',
                              wordBreak: 'break-word'
                            }}
                          >
                            {item.value}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Box>
          ))}

          {/* Données brutes (développeur) */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
              Données brutes (JSON)
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="caption" component="pre" sx={{ 
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 300,
                overflow: 'auto'
              }}>
                {JSON.stringify(log, null, 2)}
              </Typography>
            </Paper>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuditLogDetails;