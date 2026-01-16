// src/components/Navigation.js
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Avatar,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalHospital as HospitalIcon,
  Receipt as ReceiptIcon,
  MonetizationOn as MonetizationIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';

const Navigation = ({ open, onClose }) => {
  const theme = useTheme();
  
  const menuItems = [
    { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/' },
    { text: 'Patients', icon: <PeopleIcon />, path: '/patients' },
    { text: 'Consultations', icon: <HospitalIcon />, path: '/consultations' },
    { text: 'Prescriptions', icon: <ReceiptIcon />, path: '/prescriptions' },
    { text: 'Facturation', icon: <MonetizationIcon />, path: '/facturation' },
    { text: 'Litiges', icon: <WarningIcon />, path: '/litiges' },
  ];

  const bottomItems = [
    { text: 'Paramètres', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Déconnexion', icon: <LogoutIcon />, path: '/logout' },
  ];

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
        },
      }}
    >
      {/* En-tête */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.main,
            width: 40,
            height: 40
          }}
        >
          H
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            HealthManager
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Gestion des litiges
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Menu principal */}
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={RouterLink}
            to={item.path}
            onClick={onClose}
            sx={{
              '&.active': {
                backgroundColor: theme.palette.action.selected,
                borderRight: `3px solid ${theme.palette.primary.main}`,
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Menu bas */}
      <List>
        {bottomItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={RouterLink}
            to={item.path}
            onClick={onClose}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Navigation;