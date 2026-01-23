// components/NotificationBadge.jsx
import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Divider,
  CircularProgress,
  Avatar,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { financesAPI } from '../services/api';

const NotificationBadge = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Simuler des notifications
      const mockNotifications = [
        {
          id: 1,
          type: 'warning',
          title: 'Facture en retard',
          message: 'La facture FACT-2024-00015 est en retard de 3 jours',
          date: new Date(Date.now() - 86400000 * 3).toISOString(),
          read: false,
          action: '/factures'
        },
        {
          id: 2,
          type: 'success',
          title: 'Paiement réussi',
          message: 'Paiement de 50,000 XAF pour Jean Dupont',
          date: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          action: '/transactions'
        },
        {
          id: 3,
          type: 'error',
          title: 'Transaction échouée',
          message: 'Le paiement par Mobile Money a échoué',
          date: new Date(Date.now() - 7200000).toISOString(),
          read: true,
          action: '/litiges'
        }
      ];
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poller les nouvelles notifications toutes les minutes
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    // Marquer comme lues
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'success':
        return <CheckIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const formatTime = (dateString) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { 
        addSuffix: true,
        locale: fr 
      });
    } catch {
      return 'Date inconnue';
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <IconButton
        aria-describedby={id}
        onClick={handleClick}
        color="inherit"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { 
            width: 360,
            maxHeight: 400,
            mt: 1
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {unreadCount > 0 ? `${unreadCount} non lues` : 'Toutes lues'}
          </Typography>
        </Box>
        
        <Box sx={{ overflow: 'auto', maxHeight: 300 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">
                Aucune notification
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {notifications.map((notification) => (
                <ListItem 
                  key={notification.id}
                  divider
                  sx={{
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon>
                    <Avatar sx={{ 
                      bgcolor: notification.type === 'warning' ? 'warning.light' :
                               notification.type === 'success' ? 'success.light' :
                               notification.type === 'error' ? 'error.light' : 'grey.200',
                      color: notification.type === 'warning' ? 'warning.main' :
                             notification.type === 'success' ? 'success.main' :
                             notification.type === 'error' ? 'error.main' : 'grey.700'
                    }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" component="div">
                        {notification.title}
                        {!notification.read && (
                          <Chip 
                            label="Nouveau" 
                            size="small" 
                            color="error"
                            sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                          />
                        )}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.primary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(notification.date)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
        
        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
              <Button size="small" onClick={() => {}}>
                Voir toutes les notifications
              </Button>
            </Box>
          </>
        )}
      </Popover>
    </>
  );
};

export default NotificationBadge;