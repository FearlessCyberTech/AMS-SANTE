// components/QuickActions.jsx
import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingIcon,
  People as PeopleIcon
} from '@mui/icons-material';

const QuickActions = ({ 
  onGenerateInvoice,
  onProcessPayment,
  onViewReports,
  onManageDisputes,
  onAddBeneficiary,
  onExportData
}) => {
  const theme = useTheme();

  const actions = [
    {
      title: 'Nouvelle facture',
      description: 'Créer une nouvelle facture',
      icon: <AddIcon />,
      color: theme.palette.primary.main,
      onClick: onGenerateInvoice
    },
    {
      title: 'Paiement remboursement',
      description: 'Traiter un remboursement',
      icon: <PaymentIcon />,
      color: theme.palette.success.main,
      onClick: onProcessPayment
    },
    {
      title: 'Consulter rapports',
      description: 'Voir les rapports financiers',
      icon: <DescriptionIcon />,
      color: theme.palette.info.main,
      onClick: onViewReports
    },
    {
      title: 'Gérer les litiges',
      description: 'Traiter les litiges en cours',
      icon: <WarningIcon />,
      color: theme.palette.warning.main,
      onClick: onManageDisputes
    },
    {
      title: 'Ajouter bénéficiaire',
      description: 'Créer un nouveau bénéficiaire',
      icon: <PeopleIcon />,
      color: theme.palette.secondary.main,
      onClick: onAddBeneficiary
    },
    {
      title: 'Exporter données',
      description: 'Exporter les données financières',
      icon: <DownloadIcon />,
      color: theme.palette.grey[600],
      onClick: onExportData
    }
  ];

  return (
    <Grid container spacing={2}>
      {actions.map((action, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
                '& .action-icon': {
                  transform: 'scale(1.1)'
                }
              }
            }}
            onClick={action.onClick}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                className="action-icon"
                sx={{
                  width: 60,
                  height: 60,
                  margin: '0 auto 16px',
                  bgcolor: alpha(action.color, 0.1),
                  color: action.color,
                  transition: 'transform 0.2s'
                }}
              >
                {action.icon}
              </Avatar>
              
              <Typography variant="h6" component="div" gutterBottom>
                {action.title}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                {action.description}
              </Typography>
              
              <Button
                variant="outlined"
                size="small"
                startIcon={action.icon}
                sx={{
                  borderColor: alpha(action.color, 0.5),
                  color: action.color,
                  '&:hover': {
                    borderColor: action.color,
                    bgcolor: alpha(action.color, 0.04)
                  }
                }}
              >
                Accéder
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default QuickActions;