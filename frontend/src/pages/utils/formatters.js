// utils/formatters.js
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatCurrency = (amount, currency = 'EUR') => {
  if (amount == null) return 'N/A';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (date, pattern = 'dd/MM/yyyy') => {
  if (!date) return 'N/A';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, pattern, { locale: fr });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date invalide';
  }
};

export const getStatusColor = (status) => {
  const statusMap = {
    'Payée': 'success',
    'Terminé': 'success',
    'En attente': 'warning',
    'En cours': 'info',
    'Annulee': 'error',
    'Ouvert': 'error',
    'Resolu': 'success'
  };
  return statusMap[status] || 'default';
};

export const getStatusIcon = (status) => {
  const iconMap = {
    'Payée': 'CheckCircle',
    'Terminé': 'CheckCircle',
    'En attente': 'Schedule',
    'En cours': 'HourglassEmpty',
    'Annulee': 'Cancel',
    'Ouvert': 'Error',
    'Resolu': 'CheckCircle'
  };
  return iconMap[status] || 'Help';
};