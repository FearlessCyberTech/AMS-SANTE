// components/RecentTransactions.jsx
import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Typography,
  Box,
  IconButton,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  LocalAtm as CashIcon,
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  Smartphone as MobileIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const RecentTransactions = ({ transactions, onViewDetails }) => {
  const theme = useTheme();

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'MobileMoney':
        return <MobileIcon />;
      case 'CarteBancaire':
        return <CardIcon />;
      case 'Virement':
        return <BankIcon />;
      case 'Espèces':
        return <CashIcon />;
      default:
        return <PaymentIcon />;
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'Reussi': { color: theme.palette.success.main, label: 'Réussi', icon: <CheckIcon /> },
      'Validé': { color: theme.palette.success.main, label: 'Validé', icon: <CheckIcon /> },
      'Payé': { color: theme.palette.success.main, label: 'Payé', icon: <CheckIcon /> },
      'En cours': { color: theme.palette.warning.main, label: 'En cours', icon: null },
      'Echoue': { color: theme.palette.error.main, label: 'Échoué', icon: <ErrorIcon /> },
      'Rejeté': { color: theme.palette.error.main, label: 'Rejeté', icon: <ErrorIcon /> }
    };
    return configs[status] || { color: theme.palette.grey[500], label: status, icon: null };
  };

  const formatDate = (date) => {
    try {
      return format(parseISO(date), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return 'Date invalide';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (!transactions || transactions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <PaymentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography color="text.secondary">
          Aucune transaction récente
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {transactions.map((transaction, index) => {
        const statusConfig = getStatusConfig(transaction.STATUT_TRANSACTION || transaction.statut);
        
        return (
          <ListItem
            key={transaction.COD_TRANS || transaction.id || index}
            alignItems="flex-start"
            divider={index < transactions.length - 1}
            sx={{
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.04)
              }
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: alpha(statusConfig.color, 0.1), color: statusConfig.color }}>
                {getPaymentMethodIcon(transaction.METHODE_PAIEMENT || transaction.methode)}
              </Avatar>
            </ListItemAvatar>
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body1" component="span" fontWeight="medium">
                    {transaction.REFERENCE_TRANSACTION || transaction.reference}
                  </Typography>
                  <Chip
                    label={statusConfig.label}
                    size="small"
                    icon={statusConfig.icon}
                    sx={{
                      ml: 1,
                      bgcolor: alpha(statusConfig.color, 0.1),
                      color: statusConfig.color,
                      fontWeight: 500
                    }}
                  />
                </Box>
              }
              secondary={
                <>
                  <Typography variant="body2" color="text.primary" component="span">
                    {transaction.BENEFICIAIRE || transaction.beneficiaire || transaction.NOM_BEN || 'N/A'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(transaction.DATE_INITIATION || transaction.date)}
                    </Typography>
                    <Typography variant="caption" fontWeight="bold">
                      {formatCurrency(transaction.MONTANT || transaction.montant)}
                    </Typography>
                  </Box>
                </>
              }
            />
            
            <ListItemSecondaryAction>
              <Tooltip title="Voir détails">
                <IconButton 
                  edge="end" 
                  size="small"
                  onClick={() => onViewDetails(transaction)}
                >
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ListItemSecondaryAction>
          </ListItem>
        );
      })}
    </List>
  );
};

export default RecentTransactions;