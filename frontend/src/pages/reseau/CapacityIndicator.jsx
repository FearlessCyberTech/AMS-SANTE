// src/components/centres-sante/CapacityIndicator.js
import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Grid,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Bed as BedIcon,
  Emergency as EmergencyIcon,
  People as PeopleIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';

const CapacityIndicator = ({ centre, statistiques }) => {
  const tauxOccupationLits = centre.capacite_lits 
    ? Math.min(((statistiques.patientsHospitalises || 0) / centre.capacite_lits) * 100, 100)
    : 0;

  const tauxOccupationUrgences = centre.capacite_urgences 
    ? Math.min(((statistiques.patientsUrgences || 0) / centre.capacite_urgences) * 100, 100)
    : 0;

  const getColorForTaux = (taux) => {
    if (taux < 70) return 'success';
    if (taux < 90) return 'warning';
    return 'error';
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Capacités et occupation
      </Typography>
      
      <Grid container spacing={3}>
        {/* Capacité lits */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <BedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Capacité d'hospitalisation
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {statistiques.patientsHospitalises || 0}/{centre.capacite_lits || 0}
              </Typography>
            </Box>
            <Tooltip title={`${tauxOccupationLits.toFixed(1)}% d'occupation`}>
              <LinearProgress
                variant="determinate"
                value={tauxOccupationLits}
                color={getColorForTaux(tauxOccupationLits)}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Tooltip>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Lits occupés
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tauxOccupationLits.toFixed(1)}%
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Capacité urgences */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <EmergencyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Capacité urgences
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {statistiques.patientsUrgences || 0}/{centre.capacite_urgences || 0}
              </Typography>
            </Box>
            <Tooltip title={`${tauxOccupationUrgences.toFixed(1)}% d'occupation`}>
              <LinearProgress
                variant="determinate"
                value={tauxOccupationUrgences}
                color={getColorForTaux(tauxOccupationUrgences)}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Tooltip>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Places occupées
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tauxOccupationUrgences.toFixed(1)}%
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Statistiques de consultation */}
        <Grid item xs={12}>
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              <TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Statistiques des consultations
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Chip
                  icon={<PeopleIcon />}
                  label={`Aujourd'hui: ${statistiques.consultationsAujourdhui || 0}`}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip
                  label={`Semaine: ${statistiques.consultationsSemaine || 0}`}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip
                  label={`Moyenne/jour: ${statistiques.consultationsMoyenneJour || 0}`}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip
                  label={`Taux remplissage: ${statistiques.tauxRemplissage || 0}%`}
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default CapacityIndicator;