// src/App.jsx
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import './services/i18n';
import './index.css';


// Composants avec chargement paresseux
const Layout = React.lazy(() => import('./components/Layout'));
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

// A. Gestion des bénéficiaires
const Beneficiaires = React.lazy(() => import('./pages/beneficiaires/Beneficiaires'));
const EnrolementBiometrique = React.lazy(() => import('./pages/beneficiaires/EnrolementBiometrique'));
const FamillesACE = React.lazy(() => import('./pages/beneficiaires/FamillesACE'));
const BeneficiaireDetail = React.lazy(() => import('./pages/beneficiaires/BeneficiaireDetail'));

// B. Parcours de soins
const Consultations = React.lazy(() => import('./pages/soins/Consultations'));
const AccordsPrealables = React.lazy(() => import('./pages/soins/AccordsPrealables'));
const Prescriptions = React.lazy(() => import('./pages/soins/Prescriptions'));
const PrescriptionExecution = React.lazy(() => import('./pages/soins/PrescriptionExecution'));
const DossiersMedicaux = React.lazy(() => import('./pages/soins/DossiersMedicaux'));
const Teleconsultations = React.lazy(() => import('./pages/soins/Teleconsultations'));
const Urgences = React.lazy(() => import('./pages/soins/Urgences'));

// C. Remboursements et facturation
const Facturation = React.lazy(() => import('./pages/financier/Facturation'));
const Remboursements = React.lazy(() => import('./pages/financier/Remboursements'));
const Paiements = React.lazy(() => import('./pages/financier/Paiements'));
const TicketModerateur = React.lazy(() => import('./pages/financier/TicketModerateur'));

// D. Statistiques et reporting
const Statistiques = React.lazy(() => import('./pages/statistiques/Statistiques'));
const Rapports = React.lazy(() => import('./pages/statistiques/Rapports'));
const TableauxBord = React.lazy(() => import('./pages/statistiques/TableauxBord'));

// E. Évacuation sanitaire
const Evacuations = React.lazy(() => import('./pages/evacuation/Evacuations'));
const SuiviEvacuations = React.lazy(() => import('./pages/evacuation/SuiviEvacuations'));

// F. Contrôle et audit
const ControleFraudes = React.lazy(() => import('./pages/controle/ControleFraudes'));
const Audit = React.lazy(() => import('./pages/controle/Audit'));
const AlertesAnomalies = React.lazy(() => import('./pages/controle/AlertesAnomalies'));

// G. Interaction multi-acteurs
const Messagerie = React.lazy(() => import('./pages/interaction/Messagerie'));
const Notifications = React.lazy(() => import('./pages/interaction/Notifications'));

// H. Documentation et archivage
const Archivage = React.lazy(() => import('./pages/documentation/Archivage'));
const Documents = React.lazy(() => import('./pages/documentation/Documents'));

// I. Module de règlement
const Reglements = React.lazy(() => import('./pages/reglement/Reglements'));
const GestionFinanciere = React.lazy(() => import('./pages/reglement/GestionFinanciere'));
const Litiges = React.lazy(() => import('./pages/reglement/Litiges'));

// J. Gestion du réseau de soins
const ReseauSoins = React.lazy(() => import('./pages/reseau/ReseauSoins'));
const Prestataires = React.lazy(() => import('./pages/reseau/Prestataires'));
const CentresSante = React.lazy(() => import('./pages/reseau/CentresSante'));
const Conventions = React.lazy(() => import('./pages/reseau/Conventions'));
const EvaluationPrestataires = React.lazy(() => import('./pages/reseau/EvaluationPrestataires'));

// Administration
const Administration = React.lazy(() => import('./pages/admin/Administration'));
const Parametres = React.lazy(() => import('./pages/admin/Parametres'));
const Geographie = React.lazy(() => import('./pages/admin/Geographie'));
const Nomenclatures = React.lazy(() => import('./pages/admin/Nomenclatures'));

// Support
const Support = React.lazy(() => import('./pages/support/Support'));
const Feedback = React.lazy(() => import('./pages/support/Feedback'));
const DocumentationUtilisateur = React.lazy(() => import('./pages/support/DocumentationUtilisateur'));

// Profil
const Profil = React.lazy(() => import('./pages/Profil'));

// Composant pour l'accès refusé
const AccessDenied = React.lazy(() => import('./pages/AccessDenied'));

// Composant de chargement
const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="spinner"></div>
    <p>Chargement du système AMS Santé...</p>
  </div>
);

// Composant Route avec vérification de permissions
const PermissionRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const userRole = user.profil_uti || user.role;
  
  // Vérifier si l'utilisateur a l'un des rôles autorisés
  const hasPermission = allowedRoles.includes(userRole);
  
  if (!hasPermission) {
    return <AccessDenied />;
  }

  return children;
};

// Configuration des permissions par route
const routePermissions = {
  // 🏠 Tableau de bord
  '/dashboard': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
  
  // 👥 A. Gestion des bénéficiaires
  '/beneficiaires': ['SuperAdmin', 'Admin', 'Secretaire'],
  '/beneficiaires/:id': ['SuperAdmin', 'Admin', 'Secretaire'],
  '/enrolement-biometrique': ['SuperAdmin', 'Admin', 'Secretaire'],
  '/familles-ace': ['SuperAdmin', 'Admin', 'Secretaire'],
  
  // 🏥 B. Parcours de soins
  '/consultations': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
  '/Accords-Prealables': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
  '/Prescriptions': ['SuperAdmin', 'Admin', 'Medecin'],
  '/PrescriptionExecution': ['SuperAdmin', 'Admin', 'Medecin'],
  '/dossiers-medicaux': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
  '/teleconsultations': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
  '/urgences': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier'],
  
  // 💰 C. Remboursements et facturation
  '/facturation': ['SuperAdmin', 'Admin', 'Caissier'],
  '/remboursements': ['SuperAdmin', 'Admin', 'Caissier'],
  '/paiements': ['SuperAdmin', 'Admin', 'Caissier'],
  '/ticket-moderateur': ['SuperAdmin', 'Admin', 'Caissier'],
  
  // 📊 D. Statistiques et reporting
  '/statistiques': ['SuperAdmin', 'Admin', 'Medecin'],
  '/rapports': ['SuperAdmin', 'Admin', 'Medecin'],
  '/tableaux-bord': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier'],
  
  // 🚑 E. Évacuation sanitaire
  '/evacuations': ['SuperAdmin', 'Admin', 'Medecin'],
  '/suivi-evacuations': ['SuperAdmin', 'Admin', 'Medecin'],
  
  // 🛡️ F. Contrôle et audit
  '/controle-fraudes': ['SuperAdmin', 'Admin'],
  '/audit': ['SuperAdmin', 'Admin'],
  '/alertes-anomalies': ['SuperAdmin', 'Admin', 'Medecin', 'Caissier'],
  
  // 🤝 G. Interaction multi-acteurs
  '/messagerie': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
  '/notifications': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
  
  // 📚 H. Documentation et archivage
  '/archivage': ['SuperAdmin', 'Admin', 'Secretaire'],
  '/documents': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire'],
  
  // 💳 I. Module de règlement
  '/reglements': ['SuperAdmin', 'Admin', 'Caissier'],
  '/gestion-financiere': ['SuperAdmin', 'Admin'],
  '/litiges': ['SuperAdmin', 'Admin', 'Caissier'],
  
  // 🏥 J. Gestion du réseau de soins
  '/reseau-soins': ['SuperAdmin', 'Admin'],
  '/prestataires': ['SuperAdmin', 'Admin', 'Medecin'],
  '/centres-sante': ['SuperAdmin', 'Admin'],
  '/conventions': ['SuperAdmin', 'Admin'],
  '/evaluation-prestataires': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Utilisateur'],
  
  // ⚙️ Administration et configuration
  '/administration': ['SuperAdmin', 'Admin'],
  '/parametres': ['SuperAdmin', 'Admin'],
  '/geographie': ['SuperAdmin', 'Admin'],
  '/nomenclatures': ['SuperAdmin', 'Admin', 'Medecin'],
  
  // 🆘 Support et documentation utilisateur
  '/support': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
  '/feedback': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
  '/documentation-utilisateur': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur'],
  
  // 👤 Profil utilisateur
  '/profil': ['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur']
};

// Composant App avec gestion de langue
const AppContent = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (user?.cod_pay) {
      const languageMap = {
        'CMF': 'fr-FR',
        'CMA': 'en-GB',
        'RCA': 'fr-FR',
        'TCD': 'fr-FR',
        'GNQ': 'es-ES',
        'BDI': 'fr-FR',
        'COG': 'fr-FR'
      };
      const language = languageMap[user.cod_pay] || 'fr-FR';
      
      if (i18n.language !== language) {
        i18n.changeLanguage(language);
        document.documentElement.lang = language;
      }
    }
  }, [user?.cod_pay, i18n]);

  useEffect(() => {
    const updatePageTitle = () => {
      const titles = {
        'fr-FR': 'AMS Santé - Gestion des Prestations de Santé',
        'en-GB': 'AMS Health - Health Benefits Management',
        'es-ES': 'AMS Salud - Gestión de Prestaciones de Salud'
      };
      document.title = titles[i18n.language] || 'AMS Health System';
    };

    updatePageTitle();
    i18n.on('languageChanged', updatePageTitle);
    
    return () => {
      i18n.off('languageChanged', updatePageTitle);
    };
  }, [i18n]);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Route publique - Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Route pour l'accès refusé */}
        <Route path="/access-denied" element={<AccessDenied />} />
        
        {/* Routes protégées avec Layout */}
        <Route path="/" element={
          <PermissionRoute allowedRoles={['SuperAdmin', 'Admin', 'Medecin', 'Infirmier', 'Secretaire', 'Caissier', 'Utilisateur']}>
            <Layout />
          </PermissionRoute>
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          
          {/* Dashboard */}
          <Route path="dashboard" element={
            <PermissionRoute allowedRoles={routePermissions['/dashboard']}>
              <Dashboard />
            </PermissionRoute>
          } />
          
          {/* A. Gestion des bénéficiaires */}
          <Route path="beneficiaires" element={
            <PermissionRoute allowedRoles={routePermissions['/beneficiaires']}>
              <Beneficiaires />
            </PermissionRoute>
          } />
          <Route path="beneficiaires/:id" element={
            <PermissionRoute allowedRoles={routePermissions['/beneficiaires/:id']}>
              <BeneficiaireDetail />
            </PermissionRoute>
          } />
          
          <Route path="enrolement-biometrique" element={
            <PermissionRoute allowedRoles={routePermissions['/enrolement-biometrique']}>
              <EnrolementBiometrique />
            </PermissionRoute>
          } />
          <Route path="familles-ace" element={
            <PermissionRoute allowedRoles={routePermissions['/familles-ace']}>
              <FamillesACE />
            </PermissionRoute>
          } />
          
          {/* B. Parcours de soins */}
          <Route path="consultations" element={
            <PermissionRoute allowedRoles={routePermissions['/consultations']}>
              <Consultations />
            </PermissionRoute>
          } />
          <Route path="Accords-Prealables" element={
            <PermissionRoute allowedRoles={routePermissions['/Accords-Prealables']}>
              <AccordsPrealables />
            </PermissionRoute>
          } />
          <Route path="Prescriptions" element={
            <PermissionRoute allowedRoles={routePermissions['/Prescriptions']}>
              <Prescriptions />
            </PermissionRoute>
          } />
          <Route path="PrescriptionExecution" element={
            <PermissionRoute allowedRoles={routePermissions['/PrescriptionExecution']}>
              <PrescriptionExecution />
            </PermissionRoute>
          } />
          <Route path="dossiers-medicaux" element={
            <PermissionRoute allowedRoles={routePermissions['/dossiers-medicaux']}>
              <DossiersMedicaux />
            </PermissionRoute>
          } />
          <Route path="teleconsultations" element={
            <PermissionRoute allowedRoles={routePermissions['/teleconsultations']}>
              <Teleconsultations />
            </PermissionRoute>
          } />
          <Route path="urgences" element={
            <PermissionRoute allowedRoles={routePermissions['/urgences']}>
              <Urgences />
            </PermissionRoute>
          } />
          
          {/* C. Remboursements et facturation */}
          <Route path="facturation" element={
            <PermissionRoute allowedRoles={routePermissions['/facturation']}>
              <Facturation />
            </PermissionRoute>
          } />
          <Route path="remboursements" element={
            <PermissionRoute allowedRoles={routePermissions['/remboursements']}>
              <Remboursements />
            </PermissionRoute>
          } />
          <Route path="paiements" element={
            <PermissionRoute allowedRoles={routePermissions['/paiements']}>
              <Paiements />
            </PermissionRoute>
          } />
          <Route path="ticket-moderateur" element={
            <PermissionRoute allowedRoles={routePermissions['/ticket-moderateur']}>
              <TicketModerateur />
            </PermissionRoute>
          } />
          
          {/* D. Statistiques et reporting */}
          <Route path="statistiques" element={
            <PermissionRoute allowedRoles={routePermissions['/statistiques']}>
              <Statistiques />
            </PermissionRoute>
          } />
          <Route path="rapports" element={
            <PermissionRoute allowedRoles={routePermissions['/rapports']}>
              <Rapports />
            </PermissionRoute>
          } />
          <Route path="tableaux-bord" element={
            <PermissionRoute allowedRoles={routePermissions['/tableaux-bord']}>
              <TableauxBord />
            </PermissionRoute>
          } />
          
          {/* E. Évacuation sanitaire */}
          <Route path="evacuations" element={
            <PermissionRoute allowedRoles={routePermissions['/evacuations']}>
              <Evacuations />
            </PermissionRoute>
          } />
          <Route path="suivi-evacuations" element={
            <PermissionRoute allowedRoles={routePermissions['/suivi-evacuations']}>
              <SuiviEvacuations />
            </PermissionRoute>
          } />
          
          {/* F. Contrôle et audit */}
          <Route path="controle-fraudes" element={
            <PermissionRoute allowedRoles={routePermissions['/controle-fraudes']}>
              <ControleFraudes />
            </PermissionRoute>
          } />
          <Route path="audit" element={
            <PermissionRoute allowedRoles={routePermissions['/audit']}>
              <Audit />
            </PermissionRoute>
          } />
          <Route path="alertes-anomalies" element={
            <PermissionRoute allowedRoles={routePermissions['/alertes-anomalies']}>
              <AlertesAnomalies />
            </PermissionRoute>
          } />
          
          {/* G. Interaction multi-acteurs */}
          <Route path="messagerie" element={
            <PermissionRoute allowedRoles={routePermissions['/messagerie']}>
              <Messagerie />
            </PermissionRoute>
          } />
          <Route path="notifications" element={
            <PermissionRoute allowedRoles={routePermissions['/notifications']}>
              <Notifications />
            </PermissionRoute>
          } />
          
          {/* H. Documentation et archivage */}
          <Route path="archivage" element={
            <PermissionRoute allowedRoles={routePermissions['/archivage']}>
              <Archivage />
            </PermissionRoute>
          } />
          <Route path="documents" element={
            <PermissionRoute allowedRoles={routePermissions['/documents']}>
              <Documents />
            </PermissionRoute>
          } />
          
          {/* I. Module de règlement */}
          <Route path="reglements" element={
            <PermissionRoute allowedRoles={routePermissions['/reglements']}>
              <Reglements />
            </PermissionRoute>
          } />
          <Route path="gestion-financiere" element={
            <PermissionRoute allowedRoles={routePermissions['/gestion-financiere']}>
              <GestionFinanciere />
            </PermissionRoute>
          } />
          <Route path="litiges" element={
            <PermissionRoute allowedRoles={routePermissions['/litiges']}>
              <Litiges />
            </PermissionRoute>
          } />
          
          {/* J. Gestion du réseau de soins */}
          <Route path="reseau-soins" element={
            <PermissionRoute allowedRoles={routePermissions['/reseau-soins']}>
              <ReseauSoins />
            </PermissionRoute>
          } />
          <Route path="prestataires" element={
            <PermissionRoute allowedRoles={routePermissions['/prestataires']}>
              <Prestataires />
            </PermissionRoute>
          } />
          <Route path="centres-sante" element={
            <PermissionRoute allowedRoles={routePermissions['/centres-sante']}>
              <CentresSante />
            </PermissionRoute>
          } />
          <Route path="conventions" element={
            <PermissionRoute allowedRoles={routePermissions['/conventions']}>
              <Conventions />
            </PermissionRoute>
          } />
          <Route path="evaluation-prestataires" element={
            <PermissionRoute allowedRoles={routePermissions['/evaluation-prestataires']}>
              <EvaluationPrestataires />
            </PermissionRoute>
          } />
          
          {/* Administration */}
          <Route path="administration" element={
            <PermissionRoute allowedRoles={routePermissions['/administration']}>
              <Administration />
            </PermissionRoute>
          } />
          <Route path="parametres" element={
            <PermissionRoute allowedRoles={routePermissions['/parametres']}>
              <Parametres />
            </PermissionRoute>
          } />
          <Route path="geographie" element={
            <PermissionRoute allowedRoles={routePermissions['/geographie']}>
              <Geographie />
            </PermissionRoute>
          } />
          <Route path="nomenclatures" element={
            <PermissionRoute allowedRoles={routePermissions['/nomenclatures']}>
              <Nomenclatures />
            </PermissionRoute>
          } />
          
          {/* Support */}
          <Route path="support" element={
            <PermissionRoute allowedRoles={routePermissions['/support']}>
              <Support />
            </PermissionRoute>
          } />
          <Route path="feedback" element={
            <PermissionRoute allowedRoles={routePermissions['/feedback']}>
              <Feedback />
            </PermissionRoute>
          } />
          <Route path="documentation-utilisateur" element={
            <PermissionRoute allowedRoles={routePermissions['/documentation-utilisateur']}>
              <DocumentationUtilisateur />
            </PermissionRoute>
          } />
          
          {/* Profil utilisateur */}
          <Route path="profil" element={
            <PermissionRoute allowedRoles={routePermissions['/profil']}>
              <Profil />
            </PermissionRoute>
          } />
          
          {/* Route 404 - Redirige vers le dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

// Composant principal
function App() {
  return (
    <React.StrictMode>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </React.StrictMode>
  );
}

export default App;