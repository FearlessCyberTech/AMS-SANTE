// Formater les montants en FCFA
export const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return '0 FCFA';
  
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amount)) + ' FCFA';
};

// Formater les dates
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Formater le temps écoulé
export const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return `il y a ${interval} ans`;
  
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return `il y a ${interval} mois`;
  
  interval = Math.floor(seconds / 86400);
  if (interval > 1) return `il y a ${interval} jours`;
  
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return `il y a ${interval} heures`;
  
  interval = Math.floor(seconds / 60);
  if (interval > 1) return `il y a ${interval} minutes`;
  
  return 'à l\'instant';
};

// Formater le statut
export const formatStatus = (status) => {
  const statusMap = {
    'brouillon': { label: 'Brouillon', color: 'yellow' },
    'validee': { label: 'Validée', color: 'green' },
    'facturee': { label: 'Facturée', color: 'blue' },
    'payee': { label: 'Payée', color: 'teal' },
    'annulee': { label: 'Annulée', color: 'red' }
  };
  
  return statusMap[status] || { label: status, color: 'gray' };
};

// Formater le nom complet
export const formatFullName = (nom, prenom) => {
  return `${prenom} ${nom}`.trim();
};