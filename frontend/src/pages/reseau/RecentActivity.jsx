// src/components/centres-sante/RecentActivity.js
import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Paper,
  Button,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  Receipt as ReceiptIcon,
  ArrowForward as ArrowForwardIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

const RecentActivity = ({ consultations, patientsActifs, showAll = false }) => {
  const activities = [
    ...consultations.map(consult => ({
      type: 'consultation',
      id: consult.COD_CONS || consult.id,
      title: consult.TYPE_CONSULTATION || 'Consultation',
      description: `Patient: ${consult.NOM_BEN} ${consult.PRE_BEN}`,
      secondary: `${formatDate(consult.DATE_CONSULTATION)} • Médecin: ${consult.NOM_MEDECIN}`,
      amount: consult.MONTANT_CONSULTATION,
      icon: <MedicalIcon />,
      color: 'primary',
      time: new Date(consult.DATE_CONSULTATION)
    })),
    ...patientsActifs.map(patient => ({
      type: 'patient',
      id: patient.ID_BEN || patient.id,
      title: `${patient.NOM_BEN} ${patient.PRE_BEN}`,
      description: `Patient actif • ${patient.AGE || '?'} ans`,
      secondary: `Dernière consultation: ${formatDate(patient.DERNIERE_CONSULTATION)}`,
      icon: <PersonIcon />,
      color: 'success',
      time: new Date(patient.DERNIERE_CONSULTATION)
    }))
  ].sort((a, b) => b.time - a.time);

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Activités récentes
        </Typography>
        {!showAll && (
          <Button
            component={RouterLink}
            to={`/centres-sante/activites`}
            size="small"
            endIcon={<ArrowForwardIcon />}
          >
            Voir tout
          </Button>
        )}
      </Box>

      {displayedActivities.length > 0 ? (
        <List>
          {displayedActivities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  activity.amount && (
                    <Chip
                      label={`${activity.amount} €`}
                      size="small"
                      color="primary"
                    />
                  )
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: `${activity.color}.light` }}>
                    {activity.icon}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2">
                      {activity.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.primary">
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.secondary}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <TimeIcon fontSize="inherit" />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(activity.time, 'HH:mm')}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              {index < displayedActivities.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">
            Aucune activité récente
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default RecentActivity;