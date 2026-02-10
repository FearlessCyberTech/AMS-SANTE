import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table, Card, Tag, Button, Space, Modal, Form,
  Input, Select, Descriptions, message,
  Statistic, Row, Col, Progress, Alert,
  Empty, Divider, FloatButton, Typography,
  Avatar, Badge, Drawer, notification,
  DatePicker, Tooltip, Popconfirm, Spin
} from 'antd';
import {
  FileTextOutlined, DollarOutlined, CheckCircleOutlined,
  ClockCircleOutlined, EyeOutlined, DownloadOutlined,
  ExclamationCircleOutlined, FilterOutlined, ReloadOutlined,
  ExportOutlined, UserOutlined, WarningOutlined,
  InfoCircleOutlined, PrinterOutlined, MedicineBoxOutlined,
  SettingOutlined, FileExcelOutlined, TeamOutlined,
  SearchOutlined, FileAddOutlined, SafetyOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { financesAPI, beneficiairesAPI } from '../../services/api';
import './TicketsModerateurs.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// Fonction utilitaire pour nettoyer les chaînes de caractères
const cleanStringValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return String(value || '');
};

// Fonction utilitaire pour formater les montants
const formatMontant = (montant) => {
  const num = parseFloat(montant) || 0;
  return num.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) + ' FCFA';
};

// Fonction pour debugger les calculs
const debugCalculs = (data, ticketId) => {
  console.log('=== DEBUG CALCULS POUR TICKET ===');
  console.log('Ticket ID:', ticketId);
  console.log('Données brutes:', {
    montant_total: data.montant_total,
    taux_couverture: data.taux_couverture,
    montant_couvert: data.montant_couvert,
    montant_restant: data.montant_restant,
    MONTANT_TOTAL: data.MONTANT_TOTAL,
    TAUX_PRISE_CHARGE: data.TAUX_PRISE_CHARGE,
    MONTANT_PRISE_CHARGE: data.MONTANT_PRISE_CHARGE,
    MONTANT_TICKET: data.MONTANT_TICKET
  });
  
  const montantTotal = parseFloat(data.montant_total || data.MONTANT_TOTAL || 0);
  const taux = parseFloat(data.taux_couverture || data.TAUX_PRISE_CHARGE || 0);
  
  console.log('Calculs intermédiaires:', {
    montantTotal,
    tauxOriginal: taux,
    tauxPourCalcul: taux > 1 ? taux / 100 : taux,
    montantPriseChargeCalc: montantTotal * (taux > 1 ? taux / 100 : taux),
    montantTicketCalc: montantTotal - (montantTotal * (taux > 1 ? taux / 100 : taux))
  });
};

// Fonction utilitaire pour valider les données API
const validateApiData = (data) => {
  if (!data || typeof data !== 'object') return null;
  
  // Pour debugger
  if (data.id === 'ID_DU_TICKET_A_DEBUGGER') {
    debugCalculs(data, data.id);
  }
  
  // Récupérer l'ID principal
  const id = cleanStringValue(data.id || data._id || data.factureId || `tm-${Date.now()}-${Math.random()}`);
  
  // Récupérer le numéro de facture (priorité: numeroFacture, puis COD_TICKET, puis id)
  const numeroFacture = cleanStringValue(data.numeroFacture || data.numero_facture || data.COD_TICKET || data.ticketCode || id);
  
  // Récupérer le montant total
  const montantTotal = parseFloat(data.montant_total || data.MONTANT_TOTAL || data.montant || data.montantTicket || 0) || 0;
  
  // Récupérer le taux de couverture
  let tauxPriseCharge = parseFloat(data.taux_couverture || data.TAUX_PRISE_CHARGE || data.tauxCouverture || 0) || 0;
  
  // DÉTERMINER SI LE TAUX EST EN POURCENTAGE OU DÉCIMAL
  // Si le taux est > 1, on suppose que c'est un pourcentage (ex: 80 pour 80%)
  // Sinon, on suppose que c'est un décimal (ex: 0.8 pour 80%)
  const isPourcentage = tauxPriseCharge > 1;
  const tauxDecimal = isPourcentage ? tauxPriseCharge / 100 : tauxPriseCharge;
  
  // Calculer le montant pris en charge
  const montantPriseChargeCalc = montantTotal * tauxDecimal;
  const montantPriseCharge = parseFloat(
    data.montant_couvert || 
    data.MONTANT_PRISE_CHARGE || 
    data.montantCouvert || 
    montantPriseChargeCalc
  ) || 0;
  
  // Calculer le montant du ticket modérateur
  const montantTicketCalc = montantTotal - montantPriseCharge;
  const montantTicket = parseFloat(
    data.montant_restant || 
    data.montant_ticket || 
    data.MONTANT_TICKET || 
    data.ticketModerateur || 
    montantTicketCalc
  ) || 0;
  
  // Pour l'affichage, on veut le taux en pourcentage
  const tauxPourAffichage = isPourcentage ? tauxPriseCharge : (tauxPriseCharge * 100);
  
  // Log de vérification
  console.log('Ticket calculé:', {
    id,
    montantTotal,
    tauxBrut: tauxPriseCharge,
    tauxPourAffichage,
    tauxDecimal,
    montantPriseCharge,
    montantTicket
  });
  
  return {
    // Identifiants (correctement formatés)
    id,
    COD_TICKET: numeroFacture,
    COD_DECL: cleanStringValue(data.numero_declaration || data.COD_DECL || data.declaration_id || data.declarationId || id),
    
    // Bénéficiaire - chercher dans plusieurs champs possibles
    NOM_BEN: cleanStringValue(data.nom || data.beneficiaire_nom || data.NOM_BEN || data.nomBen || data.nom_ben || 'Non spécifié'),
    PRE_BEN: cleanStringValue(data.prenom || data.beneficiaire_prenom || data.PRE_BEN || data.prenomBen || data.prenom_ben || ''),
    IDENTIFIANT_NATIONAL: cleanStringValue(data.patient_identifiant || data.IDENTIFIANT_NATIONAL || data.identifiant || data.matricule || data.COD_BEN || 'N/A'),
    
    // Médical
    CENTRE_SANTE: cleanStringValue(data.centre_nom || data.CENTRE_SANTE || data.centre || data.centreSante || 'Centre non spécifié'),
    MEDECIN: cleanStringValue(data.medecin_nom || data.MEDECIN || data.medecin || 'Médecin non spécifié'),
    SPECIALITE: cleanStringValue(data.specialite || data.SPECIALITE || 'Généraliste'),
    CATEGORIE: cleanStringValue(data.type_facture || data.CATEGORIE || data.type || 'consultation'),
    
    // Financier - CORRECTIONS APPLIQUÉES
    MONTANT_TOTAL: montantTotal,
    TAUX_PRISE_CHARGE: tauxPourAffichage, // Toujours en pourcentage pour l'affichage
    MONTANT_PRISE_CHARGE: montantPriseCharge,
    MONTANT_TICKET: montantTicket,
    
    // Statut
    STATUT: cleanStringValue(data.statut || data.STATUT || data.etat || 'en_attente'),
    
    // Dates
    DATE_CREATION: data.date_creation || data.DATE_CREATION || data.createdAt || new Date().toISOString(),
    DATE_CONSULTATION: data.date_consultation || data.DATE_CONSULTATION || data.dateFacture,
    DATE_PAIEMENT: data.date_paiement || data.DATE_PAIEMENT,
    
    // Autres
    RAISON: cleanStringValue(data.motif || data.RAISON || data.observations || data.description || ''),
    NB_ITEMS_TICKET: parseInt(data.nb_elements || data.NB_ITEMS || 1) || 1,
    
    // Données brutes complètes
    rawData: data
  };
};

// Composant Ticket Modérateur optimisé pour impression
const TicketModerateurPrint = React.forwardRef(({ ticket }, ref) => {
  if (!ticket) return null;
  
  // Calculs basés sur les données validées
  const montantTotal = ticket.MONTANT_TOTAL || 0;
  const tauxPriseCharge = ticket.TAUX_PRISE_CHARGE || 0;
  const montantPriseCharge = ticket.MONTANT_PRISE_CHARGE || (montantTotal * (tauxPriseCharge / 100));
  const montantTicket = ticket.MONTANT_TICKET || (montantTotal - montantPriseCharge);
  
  // Déterminer la couleur du statut
  const getStatutColor = () => {
    const statut = (ticket.STATUT || '').toLowerCase();
    if (statut.includes('payé') || statut.includes('validé')) return '#52c41a';
    if (statut.includes('attente')) return '#fa8c16';
    if (statut.includes('exempte')) return '#1890ff';
    if (statut.includes('rejeté') || statut.includes('annulé')) return '#ff4d4f';
    return '#666';
  };

  return (
    <div ref={ref} className="ticket-print">
      <div className="ticket-header">
        <div className="ticket-title">HCS FINANCES</div>
        <div className="ticket-subtitle">Système de Gestion des Tickets Modérateurs</div>
      </div>
      
      <div className="ticket-main-title">
        <h1>TICKET MODÉRATEUR</h1>
        <div className="ticket-reference">
          Référence: <strong>{ticket.COD_TICKET}</strong>
        </div>
        <div className="ticket-date">
          Date d'émission: {moment().format('DD/MM/YYYY HH:mm')}
        </div>
      </div>
      
      <div className="ticket-sections">
        <div className="ticket-section">
          <h2><UserOutlined /> BÉNÉFICIAIRE</h2>
          <div className="ticket-field">
            <label>Nom et Prénom</label>
            <div className="ticket-value highlighted">
              {ticket.NOM_BEN} {ticket.PRE_BEN}
            </div>
          </div>
          <div className="ticket-field">
            <label>Identifiant</label>
            <div className="ticket-value">{ticket.IDENTIFIANT_NATIONAL}</div>
          </div>
        </div>
        
        <div className="ticket-section">
          <h2><FileTextOutlined /> CONSULTATION</h2>
          <div className="ticket-field">
            <label>Date</label>
            <div className="ticket-value highlighted">
              {ticket.DATE_CONSULTATION ? moment(ticket.DATE_CONSULTATION).format('DD/MM/YYYY') : moment().format('DD/MM/YYYY')}
            </div>
          </div>
          <div className="ticket-field">
            <label>Médecin</label>
            <div className="ticket-value">{ticket.MEDECIN}</div>
          </div>
        </div>
      </div>
      
      <div className="ticket-financial">
        <h2><DollarOutlined /> DÉCOMPTE FINANCIER</h2>
        
        <div className="financial-grid">
          <div className="financial-item total">
            <div className="financial-label">Montant Total</div>
            <div className="financial-amount">{formatMontant(montantTotal)}</div>
          </div>
          
          <div className="financial-item taux">
            <div className="financial-label">Taux Couverture</div>
            <div className="financial-amount">{tauxPriseCharge.toFixed(1)}%</div>
          </div>
          
          <div className="financial-item couvert">
            <div className="financial-label">Montant Couvert</div>
            <div className="financial-amount">{formatMontant(montantPriseCharge)}</div>
          </div>
        </div>
        
        <div className="ticket-moderateur">
          <div className="ticket-moderateur-label">TICKET MODÉRATEUR À PAYER</div>
          <div className="ticket-moderateur-amount">{formatMontant(montantTicket)}</div>
          <div className="ticket-moderateur-note">Part restant à la charge du patient</div>
        </div>
      </div>
      
      <div className="ticket-footer">
        <div>Document officiel - HCS Finances</div>
        <div>Conservation recommandée: 5 ans</div>
      </div>
    </div>
  );
});

TicketModerateurPrint.displayName = 'TicketModerateurPrint';

// Composant de recherche
const EnhancedSearch = ({ onSearch, onFilterChange, onDateChange, loading }) => {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    statut: 'all',
    categorie: 'all',
    tri: 'date_desc'
  });
  
  const handleSearch = () => {
    onSearch(searchText);
  };
  
  const handleReset = () => {
    setSearchText('');
    setFilters({ statut: 'all', categorie: 'all', tri: 'date_desc' });
    onSearch('');
    onFilterChange({ statut: 'all', categorie: 'all', tri: 'date_desc' });
  };
  
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  return (
    <Card className="search-card" size="small">
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Rechercher par nom, ID, référence..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            prefix={<SearchOutlined />}
            disabled={loading}
            enterButton
          />
        </Col>
        
        <Col xs={24} sm={12} md={4}>
          <Select
            value={filters.statut}
            style={{ width: '100%' }}
            onChange={(value) => handleFilterChange('statut', value)}
            suffixIcon={<FilterOutlined />}
            disabled={loading}
          >
            <Option value="all">Tous statuts</Option>
            <Option value="en_attente">En attente</Option>
            <Option value="payé">Payé</Option>
            <Option value="validé">Validé</Option>
            <Option value="rejeté">Rejeté</Option>
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={4}>
          <Select
            value={filters.categorie}
            style={{ width: '100%' }}
            onChange={(value) => handleFilterChange('categorie', value)}
            disabled={loading}
          >
            <Option value="all">Tous types</Option>
            <Option value="consultation">Consultation</Option>
            <Option value="médicament">Médicament</Option>
            <Option value="analyse">Analyse</Option>
            <Option value="hospitalisation">Hospitalisation</Option>
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={4}>
          <Select
            value={filters.tri}
            style={{ width: '100%' }}
            onChange={(value) => handleFilterChange('tri', value)}
            disabled={loading}
          >
            <Option value="date_desc">Date ↓</Option>
            <Option value="date_asc">Date ↑</Option>
            <Option value="montant_desc">Montant ↓</Option>
            <Option value="montant_asc">Montant ↑</Option>
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={4}>
          <RangePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder={['Début', 'Fin']}
            onChange={onDateChange}
            disabled={loading}
          />
        </Col>
      </Row>
    </Card>
  );
};

// Composant principal
const GestionTicketsModerateurs = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [printModal, setPrintModal] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [paiementModalVisible, setPaiementModalVisible] = useState(false);
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [loadingBeneficiaires, setLoadingBeneficiaires] = useState(false);
  
  // États pour tester les calculs
  const [testMontant, setTestMontant] = useState('');
  const [testTaux, setTestTaux] = useState('');
  
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    payes: 0,
    montantTotal: 0,
    montantEnAttente: 0
  });
  
  const [searchParams, setSearchParams] = useState({
    searchTerm: '',
    filters: {
      statut: 'all',
      categorie: 'all',
      tri: 'date_desc'
    },
    dateRange: null
  });
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: ['10', '20', '50', '100']
  });
  
  const [createForm] = Form.useForm();
  const [paiementForm] = Form.useForm();
  const componentRef = useRef();

  // Charger les bénéficiaires pour le formulaire de création
  const loadBeneficiaires = useCallback(async () => {
    try {
      setLoadingBeneficiaires(true);
      console.log('Chargement des bénéficiaires...');
      
      // Utiliser l'API bénéficiaires pour récupérer la liste
      const response = await beneficiairesAPI.getAll({ 
        limit: 100, // Limiter à 100 bénéficiaires pour la performance
        active: true // Seulement les bénéficiaires actifs
      });
      
      console.log('Réponse bénéficiaires:', response);
      
      if (response?.success && Array.isArray(response.beneficiaires)) {
        setBeneficiaires(response.beneficiaires);
        console.log(`${response.beneficiaires.length} bénéficiaires chargés`);
      } else {
        message.warning('Aucun bénéficiaire trouvé ou format de données invalide');
        setBeneficiaires([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des bénéficiaires:', error);
      message.error('Erreur lors du chargement des bénéficiaires');
      setBeneficiaires([]);
    } finally {
      setLoadingBeneficiaires(false);
    }
  }, []);

  // Charger les tickets depuis l'API
  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        statut: searchParams.filters.statut !== 'all' ? searchParams.filters.statut : undefined,
        type: searchParams.filters.categorie !== 'all' ? searchParams.filters.categorie : undefined
      };
      
      // Ajouter les paramètres de recherche
      if (searchParams.searchTerm) {
        params.search = cleanStringValue(searchParams.searchTerm);
      }
      
      if (searchParams.dateRange && searchParams.dateRange[0] && searchParams.dateRange[1]) {
        params.date_debut = searchParams.dateRange[0].format('YYYY-MM-DD');
        params.date_fin = searchParams.dateRange[1].format('YYYY-MM-DD');
      }
      
      // Appeler l'API avec gestion d'erreur améliorée
      console.log('Chargement des tickets avec params:', params);
      const response = await financesAPI.getDeclarations(params);
      console.log('Réponse API brute:', response);
      
      // Afficher un exemple de donnée pour vérifier la structure
      if (response?.data?.[0]) {
        console.log('Exemple de donnée brute:', response.data[0]);
        console.log('Montants bruts du premier ticket:', {
          montant_total: response.data[0].montant_total,
          taux_couverture: response.data[0].taux_couverture,
          montant_couvert: response.data[0].montant_couvert,
          montant_restant: response.data[0].montant_restant
        });
      }
      
      if (response?.success) {
        // Vérifier si les données sont dans response.data ou response.factures
        const factures = response.data || response.factures || response.tickets || [];
        
        if (Array.isArray(factures)) {
          // Transformer et valider les données
          const transformedTickets = factures
            .map(validateApiData)
            .filter(ticket => ticket !== null);
          
          console.log(`${transformedTickets.length} tickets transformés`);
          
          // Afficher le calcul pour le premier ticket à des fins de debug
          if (transformedTickets.length > 0) {
            const firstTicket = transformedTickets[0];
            console.log('Calcul premier ticket:', {
              MONTANT_TOTAL: firstTicket.MONTANT_TOTAL,
              TAUX_PRISE_CHARGE: firstTicket.TAUX_PRISE_CHARGE,
              MONTANT_PRISE_CHARGE: firstTicket.MONTANT_PRISE_CHARGE,
              MONTANT_TICKET: firstTicket.MONTANT_TICKET
            });
          }
          
          // Trier les tickets
          const sortTickets = (ticketsArray) => {
            const tri = searchParams.filters.tri || 'date_desc';
            
            return [...ticketsArray].sort((a, b) => {
              switch (tri) {
                case 'date_asc':
                  return new Date(a.DATE_CREATION) - new Date(b.DATE_CREATION);
                case 'date_desc':
                  return new Date(b.DATE_CREATION) - new Date(a.DATE_CREATION);
                case 'montant_asc':
                  return (a.MONTANT_TICKET || 0) - (b.MONTANT_TICKET || 0);
                case 'montant_desc':
                  return (b.MONTANT_TICKET || 0) - (a.MONTANT_TICKET || 0);
                default:
                  return 0;
              }
            });
          };
          
          const sortedTickets = sortTickets(transformedTickets);
          setTickets(sortedTickets);
          
          // Mettre à jour la pagination
          setPagination(prev => ({
            ...prev,
            total: response.pagination?.total || response.total || transformedTickets.length
          }));
          
          // Calculer les statistiques
          calculateStats(sortedTickets);
          
          message.success(`${transformedTickets.length} tickets chargés avec succès`);
        } else {
          console.error('Format de données invalide:', factures);
          setTickets([]);
          message.warning('Format de données invalide reçu de l\'API');
        }
      } else {
        setTickets([]);
        message.warning(response?.message || 'Aucun ticket trouvé');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tickets:', error);
      message.error('Erreur lors du chargement des données: ' + (error.message || 'Erreur réseau'));
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchParams]);

  // Calculer les statistiques
  const calculateStats = useCallback((ticketsData) => {
    const statsData = {
      total: ticketsData.length,
      enAttente: ticketsData.filter(t => (t.STATUT || '').toLowerCase().includes('attente')).length,
      payes: ticketsData.filter(t => (t.STATUT || '').toLowerCase().includes('payé') || (t.STATUT || '').toLowerCase().includes('validé')).length,
      montantTotal: ticketsData.reduce((sum, t) => sum + (t.MONTANT_TOTAL || 0), 0),
      montantEnAttente: ticketsData
        .filter(t => (t.STATUT || '').toLowerCase().includes('attente'))
        .reduce((sum, t) => sum + (t.MONTANT_TICKET || 0), 0)
    };
    
    setStats(statsData);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Charger les bénéficiaires quand le modal de création s'ouvre
  useEffect(() => {
    if (createModalVisible) {
      loadBeneficiaires();
    }
  }, [createModalVisible, loadBeneficiaires]);

  // Gérer le changement de pagination
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  // Fonction d'impression
  const handlePrint = () => {
    if (!componentRef.current) {
      message.warning('Aucun ticket sélectionné pour l\'impression');
      return;
    }
    
    const printContent = componentRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket Modérateur - ${selectedTicket?.COD_TICKET}</title>
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            @media print { .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 1000);
            }, 500);
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Fonction pour traiter un ticket (payer)
  const traiterTicket = async (ticketId, action, motif = '', method = '') => {
    try {
      const ticketToProcess = tickets.find(t => t.id === ticketId) || selectedTicket;
      
      if (!ticketToProcess) {
        message.error('Ticket non trouvé');
        return;
      }
      
      console.log('Ticket à traiter:', ticketToProcess);
      
      if (action === 'payer') {
        // Préparer les données de paiement avec TOUS les champs requis
        const paiementData = {
          typeTransaction: 'ticket_moderateur',
          factureId: ticketToProcess.id, // ID principal
          numeroFacture: ticketToProcess.COD_TICKET, // Numéro de facture
          montant: ticketToProcess.MONTANT_TICKET,
          method: method || 'Espèces',
          observations: `Paiement ticket modérateur: ${motif}`,
          notifierClient: true,
          // Ajouter toutes les informations du bénéficiaire
          beneficiaireNom: ticketToProcess.NOM_BEN,
          beneficiairePrenom: ticketToProcess.PRE_BEN,
          identifiantNational: ticketToProcess.IDENTIFIANT_NATIONAL,
          // Informations de la facture
          montantTotal: ticketToProcess.MONTANT_TOTAL,
          tauxCouverture: ticketToProcess.TAUX_PRISE_CHARGE,
          montantCouvert: ticketToProcess.MONTANT_PRISE_CHARGE
        };
        
        console.log('Données de paiement envoyées:', paiementData);
        
        // Utiliser la méthode initierPaiementTicket spécifique
        const response = await financesAPI.initierPaiementTicket(paiementData);
        console.log('Réponse paiement:', response);
        
        if (response?.success) {
          message.success(`Ticket payé avec succès (${formatMontant(ticketToProcess.MONTANT_TICKET)})`);
          loadTickets(); // Recharger les tickets
          
          // Fermer les modales
          setPaiementModalVisible(false);
          paiementForm.resetFields();
        } else {
          throw new Error(response?.message || 'Erreur lors du paiement');
        }
      }
    } catch (error) {
      console.error(`Erreur lors du traitement du ticket:`, error);
      message.error(`Erreur: ${error.message || 'Une erreur est survenue'}`);
    }
  };

  // Fonction pour créer un ticket
  const handleCreateTicket = async (values) => {
    try {
      // Trouver le bénéficiaire sélectionné
      const selectedBeneficiaire = beneficiaires.find(b => b.ID_BEN?.toString() === values.beneficiaire_id?.toString());
      
      if (!selectedBeneficiaire) {
        message.error('Veuillez sélectionner un bénéficiaire valide');
        return;
      }
      
      // Calculs AVANT envoi pour vérification
      const montantTotal = parseFloat(values.montant_total) || 0;
      const taux = parseFloat(values.taux_couverture) || 0;
      
      // Déterminer si le taux est en pourcentage ou décimal
      const isPourcentage = taux > 1;
      const tauxDecimal = isPourcentage ? taux / 100 : taux;
      const montantCouvert = montantTotal * tauxDecimal;
      const montantTicket = montantTotal - montantCouvert;
      
      console.log('Vérification calculs création:', {
        montantTotal,
        taux,
        isPourcentage,
        tauxDecimal,
        montantCouvert,
        montantTicket
      });
      
      // Nettoyer les valeurs avec les données du bénéficiaire
      const cleanedValues = {
        // Informations du bénéficiaire
        beneficiaire_id: selectedBeneficiaire.ID_BEN,
        nom: selectedBeneficiaire.NOM_BEN || selectedBeneficiaire.nom,
        prenom: selectedBeneficiaire.PRE_BEN || selectedBeneficiaire.prenom,
        identifiant: selectedBeneficiaire.IDENTIFIANT_NATIONAL || selectedBeneficiaire.identifiant_national,
        
        // Informations financières - CORRECTION APPLIQUÉE
        montant_total: montantTotal,
        taux_couverture: taux, // Envoyer le taux tel quel (l'API décidera du format)
        montant_couvert: montantCouvert, // Calculer le montant couvert
        montant_restant: montantTicket, // Calculer le ticket modérateur
        
        // Informations médicales
        type_facture: cleanStringValue(values.type_facture),
        centre_sante: cleanStringValue(values.centre_sante),
        motif: cleanStringValue(values.motif),
        date_consultation: values.date_consultation ? moment(values.date_consultation).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
        
        // Informations additionnelles
        medecin: cleanStringValue(values.medecin || ''),
        specialite: cleanStringValue(values.specialite || '')
      };
      
      console.log('Création ticket avec données:', cleanedValues);
      
      const response = await financesAPI.createDeclaration(cleanedValues);
      
      if (response?.success) {
        message.success('Ticket créé avec succès');
        setCreateModalVisible(false);
        createForm.resetFields();
        loadTickets(); // Recharger la liste des tickets
      } else {
        throw new Error(response?.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur lors de la création du ticket:', error);
      message.error('Erreur lors de la création du ticket: ' + error.message);
    }
  };

  // Colonnes du tableau
  const columns = [
    {
      title: 'N° Ticket',
      dataIndex: 'COD_TICKET',
      key: 'COD_TICKET',
      width: 150,
      render: (text) => (
        <Tag color="blue" style={{ fontWeight: 'bold' }}>
          {text || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Bénéficiaire',
      key: 'beneficiaire',
      width: 200,
      render: (_, record) => (
        <div className="beneficiaire-cell">
          <Avatar size="small" style={{ backgroundColor: '#1890ff', marginRight: 8 }}>
            {(record.NOM_BEN || '?').charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.NOM_BEN || 'Non spécifié'} {record.PRE_BEN || ''}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.IDENTIFIANT_NATIONAL || 'N/A'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Montant Total',
      dataIndex: 'MONTANT_TOTAL',
      key: 'MONTANT_TOTAL',
      width: 150,
      render: (montant) => (
        <div style={{ fontWeight: 500, color: '#1890ff', textAlign: 'right' }}>
          {formatMontant(montant)}
        </div>
      ),
      align: 'right',
    },
    {
      title: 'Taux Couverture',
      dataIndex: 'TAUX_PRISE_CHARGE',
      key: 'TAUX_PRISE_CHARGE',
      width: 120,
      render: (taux) => (
        <div style={{ textAlign: 'center' }}>
          <Tag color="cyan">{taux?.toFixed(1)}%</Tag>
        </div>
      ),
      align: 'center',
    },
    {
      title: 'Montant Ticket',
      dataIndex: 'MONTANT_TICKET',
      key: 'MONTANT_TICKET',
      width: 150,
      render: (montant) => (
        <div style={{ fontWeight: 'bold', color: '#fa8c16', textAlign: 'right' }}>
          {formatMontant(montant)}
        </div>
      ),
      align: 'right',
    },
    {
      title: 'Type',
      dataIndex: 'CATEGORIE',
      key: 'CATEGORIE',
      width: 120,
      render: (categorie) => (
        <Tag color={
          categorie === 'consultation' ? 'blue' :
          categorie === 'médicament' ? 'green' :
          categorie === 'analyse' ? 'cyan' :
          categorie === 'hospitalisation' ? 'purple' : 'default'
        }>
          {categorie || 'Non spécifié'}
        </Tag>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'STATUT',
      key: 'STATUT',
      width: 130,
      render: (statut) => {
        const statutLower = (statut || '').toLowerCase();
        let color, icon, text;
        
        if (statutLower.includes('payé') || statutLower.includes('validé')) {
          color = 'green';
          icon = <CheckCircleOutlined />;
          text = 'Payé';
        } else if (statutLower.includes('attente')) {
          color = 'orange';
          icon = <ClockCircleOutlined />;
          text = 'En attente';
        } else if (statutLower.includes('rejeté')) {
          color = 'red';
          icon = <ExclamationCircleOutlined />;
          text = 'Rejeté';
        } else {
          color = 'default';
          icon = <InfoCircleOutlined />;
          text = statut || 'Inconnu';
        }
        
        return (
          <Badge
            status={color}
            text={
              <span style={{ color: 
                color === 'green' ? '#52c41a' : 
                color === 'orange' ? '#fa8c16' : 
                color === 'red' ? '#ff4d4f' : '#666' 
              }}>
                {icon} {text}
              </span>
            }
          />
        );
      },
    },
    {
      title: 'Date',
      dataIndex: 'DATE_CREATION',
      key: 'DATE_CREATION',
      width: 120,
      render: (date) => date ? moment(date).format('DD/MM/YY') : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => {
        const isPending = (record.STATUT || '').toLowerCase().includes('attente');
        
        return (
          <Space size="small">
            <Tooltip title="Voir détails">
              <Button
                icon={<EyeOutlined />}
                size="small"
                onClick={() => {
                  setSelectedTicket(record);
                  setModalVisible(true);
                }}
              />
            </Tooltip>
            
            <Tooltip title="Imprimer">
              <Button
                icon={<PrinterOutlined />}
                size="small"
                onClick={() => {
                  setSelectedTicket(record);
                  setPrintModal(true);
                }}
              />
            </Tooltip>
            
            {isPending && (
              <Tooltip title="Payer le ticket">
                <Button
                  type="primary"
                  size="small"
                  onClick={() => {
                    setSelectedTicket(record);
                    setPaiementModalVisible(true);
                  }}
                >
                  Payer
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="gestion-tickets-container">
      {/* En-tête */}
      <Card className="main-card">
        <div className="header-section">
          <div className="header-title">
            <DollarOutlined style={{ fontSize: '28px', color: '#1890ff', marginRight: '12px' }} />
            <div>
              <Title level={3} style={{ margin: 0 }}>Gestion des Tickets Modérateurs</Title>
              <Text type="secondary">Gérez les tickets modérateurs des patients</Text>
            </div>
          </div>
          
          <Space>
            <Button
              icon={<FileAddOutlined />}
              type="primary"
              onClick={() => setCreateModalVisible(true)}
            >
              Nouveau Ticket
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadTickets}
              loading={loading}
            >
              Actualiser
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={() => message.info('Export bientôt disponible')}
            >
              Exporter
            </Button>
          </Space>
        </div>

        {/* Composant de test des calculs */}
        <Card style={{ marginBottom: 16 }}>
          <Title level={5}>Test de calcul du ticket modérateur</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Input
                  placeholder="Montant total (ex: 10000)"
                  value={testMontant}
                  onChange={(e) => setTestMontant(e.target.value)}
                  prefix="Total:"
                />
              </Col>
              <Col span={12}>
                <Input
                  placeholder="Taux (ex: 80 pour 80% ou 0.8 pour 0.8)"
                  value={testTaux}
                  onChange={(e) => setTestTaux(e.target.value)}
                  prefix="Taux:"
                />
              </Col>
            </Row>
            <Button onClick={() => {
              const mt = parseFloat(testMontant) || 0;
              const taux = parseFloat(testTaux) || 0;
              
              // Déterminer si le taux est en pourcentage ou décimal
              const isPourcentage = taux > 1;
              const tauxDecimal = isPourcentage ? taux / 100 : taux;
              const couvert = mt * tauxDecimal;
              const ticket = mt - couvert;
              
              message.info(
                <div>
                  <p><strong>Résultats du calcul :</strong></p>
                  <p>Montant total: {formatMontant(mt)}</p>
                  <p>Taux: {taux} ({isPourcentage ? 'pourcentage' : 'décimal'})</p>
                  <p>Taux décimal: {tauxDecimal.toFixed(2)}</p>
                  <p>Montant couvert: {formatMontant(couvert)}</p>
                  <p><strong>Ticket modérateur: {formatMontant(ticket)}</strong></p>
                </div>,
                10
              );
            }}>
              Tester le calcul
            </Button>
          </Space>
        </Card>

        {/* Statistiques */}
        <Row gutter={16} style={{ margin: '24px 0' }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Total Tickets"
                value={stats.total}
                valueStyle={{ color: '#1890ff' }}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="En Attente"
                value={stats.enAttente}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<ClockCircleOutlined />}
              />
              <Progress 
                percent={stats.total > 0 ? Math.round((stats.enAttente / stats.total) * 100) : 0}
                size="small"
                strokeColor="#fa8c16"
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Payés"
                value={stats.payes}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
              <Progress 
                percent={stats.total > 0 ? Math.round((stats.payes / stats.total) * 100) : 0}
                size="small"
                strokeColor="#52c41a"
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="À Payer"
                value={formatMontant(stats.montantEnAttente)}
                valueStyle={{ color: '#cf1322', fontSize: '16px' }}
                prefix={<DollarOutlined />}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {stats.enAttente} ticket(s) en attente
              </div>
            </Card>
          </Col>
        </Row>

        {/* Recherche */}
        <EnhancedSearch
          onSearch={(searchTerm) => {
            setSearchParams(prev => ({ ...prev, searchTerm }));
            setPagination(prev => ({ ...prev, current: 1 }));
          }}
          onFilterChange={(filters) => {
            setSearchParams(prev => ({ ...prev, filters }));
            setPagination(prev => ({ ...prev, current: 1 }));
          }}
          onDateChange={(dateRange) => {
            setSearchParams(prev => ({ ...prev, dateRange }));
            setPagination(prev => ({ ...prev, current: 1 }));
          }}
          loading={loading}
        />

        {/* Tableau */}
        <div className="table-container">
          {tickets.length === 0 && !loading ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Title level={4}>Aucun ticket trouvé</Title>
                  <Text type="secondary">Aucun ticket modérateur ne correspond à vos critères</Text>
                </div>
              }
            >
              <Button type="primary" onClick={() => setCreateModalVisible(true)}>
                Créer un nouveau ticket
              </Button>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={tickets}
              loading={loading}
              rowKey="id"
              pagination={pagination}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
              locale={{ emptyText: 'Aucun ticket à afficher' }}
            />
          )}
        </div>
      </Card>

      {/* Modal Création */}
      <Modal
        title="Créer un nouveau ticket modérateur"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        onOk={() => createForm.submit()}
        confirmLoading={loading}
        width={600}
        afterOpenChange={(visible) => {
          if (!visible) {
            createForm.resetFields();
          }
        }}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateTicket}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="beneficiaire_id"
                label="Bénéficiaire"
                rules={[{ required: true, message: 'Veuillez sélectionner un bénéficiaire' }]}
              >
                <Select
                  placeholder="Sélectionner un bénéficiaire"
                  showSearch
                  optionFilterProp="children"
                  loading={loadingBeneficiaires}
                  notFoundContent={loadingBeneficiaires ? <Spin size="small" /> : "Aucun bénéficiaire trouvé"}
                  filterOption={(input, option) =>
                    (option?.label?.toLowerCase() || '').includes(input.toLowerCase())
                  }
                >
                  {beneficiaires.map(ben => (
                    <Option 
                      key={ben.ID_BEN} 
                      value={ben.ID_BEN?.toString()}
                      label={`${ben.NOM_BEN || ben.nom} ${ben.PRE_BEN || ben.prenom} (${ben.IDENTIFIANT_NATIONAL || ben.identifiant_national || 'N/A'})`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          size="small" 
                          style={{ 
                            backgroundColor: '#1890ff', 
                            marginRight: 8,
                            fontSize: '12px'
                          }}
                        >
                          {(ben.NOM_BEN || ben.nom || '?').charAt(0)}
                        </Avatar>
                        <div>
                          <div style={{ fontWeight: 500 }}>
                            {ben.NOM_BEN || ben.nom} {ben.PRE_BEN || ben.prenom}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {ben.IDENTIFIANT_NATIONAL || ben.identifiant_national || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="montant_total"
                label="Montant total (FCFA)"
                rules={[
                  { required: true, message: 'Veuillez saisir le montant' },
                  { pattern: /^[0-9]+(\.[0-9]{1,2})?$/, message: 'Montant invalide' }
                ]}
              >
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  placeholder="Ex: 10000"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="taux_couverture"
                label="Taux de couverture (%)"
                rules={[
                  { required: true, message: 'Veuillez saisir le taux' },
                  { min: 0, max: 100, message: 'Le taux doit être entre 0 et 100%' }
                ]}
                extra="Saisissez un nombre entre 0 et 100 (ex: 80 pour 80%)"
              >
                <Input type="number" min="0" max="100" placeholder="Ex: 80" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type_facture"
                label="Type de facture"
                rules={[{ required: true, message: 'Veuillez sélectionner le type' }]}
              >
                <Select placeholder="Sélectionner">
                  <Option value="consultation">Consultation</Option>
                  <Option value="médicament">Médicament</Option>
                  <Option value="analyse">Analyse</Option>
                  <Option value="hospitalisation">Hospitalisation</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="centre_sante"
                label="Centre de santé"
              >
                <Input placeholder="Nom du centre" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="medecin"
                label="Médecin"
              >
                <Input placeholder="Nom du médecin" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="specialite"
                label="Spécialité"
              >
                <Select placeholder="Sélectionner">
                  <Option value="Généraliste">Généraliste</Option>
                  <Option value="Spécialiste">Spécialiste</Option>
                  <Option value="Chirurgien">Chirurgien</Option>
                  <Option value="Dentiste">Dentiste</Option>
                  <Option value="Pédiatre">Pédiatre</Option>
                  <Option value="Gynécologue">Gynécologue</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="date_consultation"
            label="Date de consultation"
          >
            <DatePicker 
              style={{ width: '100%' }} 
              format="DD/MM/YYYY" 
              placeholder="Sélectionner la date"
            />
          </Form.Item>
          
          <Form.Item
            name="motif"
            label="Motif de la consultation"
          >
            <TextArea rows={3} placeholder="Décrire le motif de la consultation..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Paiement */}
      <Modal
        title={`Paiement du ticket - ${selectedTicket?.COD_TICKET || 'N/A'}`}
        open={paiementModalVisible}
        onCancel={() => {
          setPaiementModalVisible(false);
          paiementForm.resetFields();
        }}
        onOk={() => paiementForm.submit()}
        confirmLoading={loading}
        width={500}
      >
        {selectedTicket && (
          <div>
            <Alert
              message="Informations du ticket"
              description={
                <div>
                  <div>Bénéficiaire: <strong>{selectedTicket.NOM_BEN} {selectedTicket.PRE_BEN}</strong></div>
                  <div>Identifiant: <strong>{selectedTicket.IDENTIFIANT_NATIONAL}</strong></div>
                  <div>Montant total: <strong>{formatMontant(selectedTicket.MONTANT_TOTAL)}</strong></div>
                  <div>Taux couverture: <strong>{selectedTicket.TAUX_PRISE_CHARGE.toFixed(1)}%</strong></div>
                  <div>Montant couvert: <strong>{formatMontant(selectedTicket.MONTANT_PRISE_CHARGE)}</strong></div>
                  <div>Montant à payer: <strong style={{ color: '#fa8c16', fontSize: '16px' }}>{formatMontant(selectedTicket.MONTANT_TICKET)}</strong></div>
                  <div>N° Facture: <strong>{selectedTicket.COD_TICKET}</strong></div>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Form
              form={paiementForm}
              layout="vertical"
              onFinish={(values) => traiterTicket(selectedTicket.id, 'payer', values.motif, values.method)}
            >
              <Form.Item
                name="method"
                label="Méthode de paiement"
                rules={[{ required: true, message: 'Veuillez sélectionner une méthode' }]}
              >
                <Select placeholder="Sélectionner">
                  <Option value="Espèces">Espèces</Option>
                  <Option value="Carte bancaire">Carte bancaire</Option>
                  <Option value="Virement">Virement</Option>
                  <Option value="Chèque">Chèque</Option>
                  <Option value="Mobile Money">Mobile Money</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="motif"
                label="Observations du paiement"
              >
                <TextArea rows={3} placeholder="Saisir les observations du paiement..." />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Modal Détails */}
      <Drawer
        title={`Détails du ticket - ${selectedTicket?.COD_TICKET || 'N/A'}`}
        placement="right"
        onClose={() => setModalVisible(false)}
        open={modalVisible}
        width={600}
      >
        {selectedTicket && (
          <div className="ticket-details">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="N° Ticket" span={2}>
                <Tag color="blue">{selectedTicket.COD_TICKET}</Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Bénéficiaire">
                {selectedTicket.NOM_BEN} {selectedTicket.PRE_BEN}
              </Descriptions.Item>
              
              <Descriptions.Item label="Identifiant">
                {selectedTicket.IDENTIFIANT_NATIONAL}
              </Descriptions.Item>
              
              <Descriptions.Item label="Date Création">
                {selectedTicket.DATE_CREATION ? moment(selectedTicket.DATE_CREATION).format('DD/MM/YYYY HH:mm') : 'N/A'}
              </Descriptions.Item>
              
              <Descriptions.Item label="Date Consultation">
                {selectedTicket.DATE_CONSULTATION ? 
                  moment(selectedTicket.DATE_CONSULTATION).format('DD/MM/YYYY') : 'Non spécifiée'}
              </Descriptions.Item>
              
              <Descriptions.Item label="Centre de santé">
                {selectedTicket.CENTRE_SANTE}
              </Descriptions.Item>
              
              <Descriptions.Item label="Médecin">
                {selectedTicket.MEDECIN}
              </Descriptions.Item>
              
              <Descriptions.Item label="Type">
                {selectedTicket.CATEGORIE}
              </Descriptions.Item>
              
              <Descriptions.Item label="Spécialité">
                {selectedTicket.SPECIALITE || 'Non spécifiée'}
              </Descriptions.Item>
              
              <Descriptions.Item label="Montant Total">
                <Text strong>{formatMontant(selectedTicket.MONTANT_TOTAL)}</Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="Taux Couverture">
                <Tag color="blue">{selectedTicket.TAUX_PRISE_CHARGE.toFixed(1)}%</Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Montant Couvert">
                <Text type="success">{formatMontant(selectedTicket.MONTANT_PRISE_CHARGE)}</Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="Ticket Modérateur">
                <Text type="warning" strong style={{ fontSize: '16px' }}>
                  {formatMontant(selectedTicket.MONTANT_TICKET)}
                </Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="Statut">
                <Tag color={
                  (selectedTicket.STATUT || '').toLowerCase().includes('payé') || 
                  (selectedTicket.STATUT || '').toLowerCase().includes('validé') ? 'green' :
                  (selectedTicket.STATUT || '').toLowerCase().includes('attente') ? 'orange' : 'red'
                }>
                  {selectedTicket.STATUT}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Observations" span={2}>
                <div className="observations-box">
                  {selectedTicket.RAISON || 'Aucune observation'}
                </div>
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            <div className="ticket-actions">
              <Space>
                <Button
                  icon={<PrinterOutlined />}
                  onClick={() => {
                    setModalVisible(false);
                    setPrintModal(true);
                  }}
                >
                  Imprimer
                </Button>
                
                {/* {(selectedTicket.STATUT || '').toLowerCase().includes('attente') && (
                  // <Button
                  //   type="primary"
                  //   onClick={() => {
                  //     setModalVisible(false);
                  //     setPaiementModalVisible(true);
                  //   }}
                  // >
                  //   Payer le ticket
                  // </Button>
                )} */}
              </Space>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal Impression */}
      <Modal
        title="Impression du Ticket Modérateur"
        open={printModal}
        onCancel={() => setPrintModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setPrintModal(false)}>
            Annuler
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            Imprimer
          </Button>
        ]}
        width={800}
      >
        {selectedTicket && (
          <div>
            <Alert
              message="Aperçu avant impression"
              description="Le ticket sera imprimé sur une page A4. Vérifiez l'aperçu avant d'imprimer."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <div className="print-preview">
              <div ref={componentRef}>
                <TicketModerateurPrint 
                  ticket={selectedTicket}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GestionTicketsModerateurs;