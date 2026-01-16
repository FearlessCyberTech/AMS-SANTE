// DashboardMetrics.jsx - COMPOSANT CORRIGÉ
import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  Payment as PaymentIcon,
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';

const DashboardMetrics = ({ data, loading, formatCurrency, stats }) => {
  const theme = useTheme();
  
  // Utiliser les stats passées en props ou calculer à partir des données
  const metrics = stats || {
    transactionsToday: data?.resume?.transactions?.total_jour || 0,
    transactionsMonth: data?.resume?.transactions?.total_mois || 0,
    amountMonth: data?.resume?.transactions?.montant_total_mois || 0,
    overdueInvoices: data?.resume?.factures_en_retard || 0,
    totalOverdueAmount: data?.factures_en_retard?.reduce((sum, facture) => 
      sum + (facture.montant_restant || 0), 0) || 0
  };
  
  const metricCards = [
    {
      title: 'Transactions aujourd\'hui',
      value: metrics.transactionsToday,
      icon: <PaymentIcon />,
      color: theme.palette.primary.main,
      subtitle: formatCurrency(data?.resume?.transactions?.montant_jour || 0),
      trend: 'Aujourd\'hui'
    },
    {
      title: 'Transactions ce mois',
      value: metrics.transactionsMonth,
      icon: <TrendingIcon />,
      color: theme.palette.info.main,
      subtitle: formatCurrency(metrics.amountMonth),
      trend: 'Ce mois'
    },
    {
      title: 'Factures en retard',
      value: metrics.overdueInvoices,
      icon: <WarningIcon />,
      color: theme.palette.error.main,
      subtitle: formatCurrency(metrics.totalOverdueAmount),
      trend: 'À régulariser'
    },
    {
      title: 'Taux de réussite',
      value: '98%',
      icon: <MoneyIcon />,
      color: theme.palette.success.main,
      subtitle: 'Transactions validées',
      trend: 'Performance'
    }
  ];
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Chargement des métriques...</Typography>
      </Box>
    );
  }
  
  return (
    <Grid container spacing={3}>
      {metricCards.map((metric, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8]
              }
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {metric.title}
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" gutterBottom>
                    {metric.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: '50%',
                    bgcolor: alpha(metric.color, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Box sx={{ color: metric.color }}>
                    {metric.icon}
                  </Box>
                </Box>
              </Box>
              
              {metric.subtitle && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {metric.subtitle}
                </Typography>
              )}
              
              <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
                <Typography variant="caption" color="text.secondary">
                  {metric.trend}
                </Typography>
                {index === 3 && ( // Pour le taux de réussite
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: theme.palette.success.main,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 'medium'
                    }}
                  >
                    +2.5%
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
      
      {/* Statistiques additionnelles */}
      <Grid item xs={12} mt={2}>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vue d'ensemble
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Transactions moyennes/jour
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {Math.round(metrics.transactionsMonth / 30)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Montant moyen/transaction
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(metrics.transactionsMonth > 0 ? 
                    metrics.amountMonth / metrics.transactionsMonth : 0)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Factures payées
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {data?.resume?.factures_payees || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Taux de recouvrement
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {data?.resume?.taux_recouvrement || 'N/A'}%
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DashboardMetrics;