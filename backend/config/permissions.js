// frontend/src/config/permissions.js
export const REGLEMENTS_PERMISSIONS = {
  VIEW_REGLEMENTS: 'view_reglements',
  CREATE_REGLEMENT: 'create_reglement',
  EDIT_REGLEMENT: 'edit_reglement',
  DELETE_REGLEMENT: 'delete_reglement',
  VIEW_FACTURES: 'view_factures',
  PAY_FACTURE: 'pay_facture',
  VIEW_TRANSACTIONS: 'view_transactions',
  VIEW_LITIGES: 'view_litiges',
  MANAGE_LITIGES: 'manage_litiges',
  EXPORT_REPORTS: 'export_reports',
  VIEW_DASHBOARD: 'view_finance_dashboard'
};

// Vérification des permissions dans le composant
const can = (permission) => {
  const userPermissions = user?.permissions || [];
  return userPermissions.includes(permission) || user?.superAdmin;
};