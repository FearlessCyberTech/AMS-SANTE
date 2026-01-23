import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table, Card, Tag, Button, Space, Modal, Form,
  Input, Select, Descriptions, message,
  Statistic, Row, Col, Progress, Timeline, Tabs,
  DatePicker, Tooltip, Popconfirm, Badge, Alert,
  Empty, Spin, Divider, FloatButton, Checkbox, Typography
} from 'antd';
import {
  FileTextOutlined, DollarOutlined, CheckCircleOutlined,
  ClockCircleOutlined, EyeOutlined, DownloadOutlined,
  ExclamationCircleOutlined, CalculatorOutlined,
  FilterOutlined, ReloadOutlined, ExportOutlined,
  PercentageOutlined, LineChartOutlined, UserOutlined,
  WarningOutlined, InfoCircleOutlined, PrinterOutlined,
  FilePdfOutlined, IdcardOutlined, MedicineBoxOutlined,
  SettingOutlined, CopyOutlined, ShareAltOutlined,
  QrcodeOutlined, SyncOutlined, BankOutlined,
  FileExcelOutlined, AppstoreOutlined, TeamOutlined,
  SearchOutlined, FileAddOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { financesAPI, remboursementsAPI } from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// Composant Ticket Modérateur optimisé pour impression avec données réelles
const TicketModerateurPrint = React.forwardRef(({ ticket, config }, ref) => {
  // Calculer le ticket modérateur à partir des données
  const montantTotal = ticket.montant_total || ticket.MONTANT_TOTAL || 0;
  const tauxPriseCharge = ticket.taux_prise_charge || ticket.TAUX_PRISE_CHARGE || 0;
  const montantPriseCharge = ticket.montant_prise_charge || ticket.MONTANT_PRISE_CHARGE || (montantTotal * tauxPriseCharge / 100);
  const montantTicket = ticket.montant_ticket || ticket.MONTANT_TICKET || (montantTotal - montantPriseCharge);

  return (
    <div 
      ref={ref}
      style={{
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        padding: '20mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12pt',
        lineHeight: '1.4',
        color: '#000',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        pageBreakInside: 'avoid',
        pageBreakAfter: 'avoid',
        border: '1px solid #ddd'
      }}
    >
      {/* En-tête HCS Finances */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '15mm',
        borderBottom: '2px solid #1890ff',
        paddingBottom: '5mm'
      }}>
        <div style={{ 
          fontSize: '24pt', 
          fontWeight: 'bold', 
          color: '#1890ff',
          marginBottom: '5mm'
        }}>
          HCS FINANCES
        </div>
        <div style={{ fontSize: '14pt', color: '#666' }}>
          Système de Gestion des Tickets Modérateurs
        </div>
        <div style={{ fontSize: '10pt', color: '#999', marginTop: '2mm' }}>
          123 Avenue de la Boite, 75005 Paris | Tel. +33 1 23 45 67 89
        </div>
      </div>
      
      {/* Titre principal */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '10mm',
        backgroundColor: '#f0f8ff',
        padding: '8mm',
        borderRadius: '5mm'
      }}>
        <h1 style={{ 
          fontSize: '28pt', 
          margin: 0, 
          fontWeight: 'bold',
          color: '#000',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          TICKET MODÉRATEUR
        </h1>
        <div style={{ fontSize: '14pt', color: '#666', marginTop: '3mm' }}>
          Référence: <strong style={{ color: '#1890ff' }}>{ticket.COD_TICKET || ticket.cod_ticket || ticket.id}</strong>
        </div>
        <div style={{ fontSize: '12pt', color: '#999', marginTop: '2mm' }}>
          Date d'émission: {moment().format('DD/MM/YYYY HH:mm')}
        </div>
      </div>
      
      {/* Section Informations */}
      <div style={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10mm',
        marginBottom: '10mm'
      }}>
        {/* Informations Bénéficiaire */}
        <div style={{ 
          flex: '1 1 300px',
          backgroundColor: '#f9f9f9',
          padding: '8mm',
          borderRadius: '5mm',
          border: '1px solid #e8e8e8'
        }}>
          <h2 style={{ 
            fontSize: '16pt', 
            margin: '0 0 5mm 0',
            color: '#1890ff',
            fontWeight: 'bold',
            borderBottom: '1px solid #1890ff',
            paddingBottom: '2mm'
          }}>
            <UserOutlined style={{ marginRight: '5mm' }} />
            BÉNÉFICIAIRE
          </h2>
          
          <div style={{ marginBottom: '3mm' }}>
            <div style={{ fontSize: '11pt', color: '#666', marginBottom: '1mm' }}>
              Nom et Prénom
            </div>
            <div style={{ 
              fontSize: '14pt', 
              fontWeight: 'bold',
              padding: '2mm',
              backgroundColor: '#fff',
              borderRadius: '2mm',
              borderLeft: '3px solid #1890ff'
            }}>
              {ticket.nom_ben || ticket.NOM_BEN || ticket.beneficiaire_nom || 'Non spécifié'} {ticket.prenom_ben || ticket.PRE_BEN || ticket.beneficiaire_prenom || ''}
            </div>
          </div>
          
          <div style={{ marginBottom: '3mm' }}>
            <div style={{ fontSize: '11pt', color: '#666', marginBottom: '1mm' }}>
              Identifiant National
            </div>
            <div style={{ 
              fontSize: '12pt',
              padding: '2mm',
              backgroundColor: '#fff',
              borderRadius: '2mm'
            }}>
              {ticket.identifiant_national || ticket.IDENTIFIANT_NATIONAL || ticket.patient_identifiant || 'Non spécifié'}
            </div>
          </div>
          
          <div style={{ marginBottom: '3mm' }}>
            <div style={{ fontSize: '11pt', color: '#666', marginBottom: '1mm' }}>
              Date de Naissance
            </div>
            <div style={{ 
              fontSize: '12pt',
              padding: '2mm',
              backgroundColor: '#fff',
              borderRadius: '2mm'
            }}>
              {ticket.date_naissance ? moment(ticket.date_naissance).format('DD/MM/YYYY') : 'Non spécifiée'}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '11pt', color: '#666', marginBottom: '1mm' }}>
              Âge
            </div>
            <div style={{ 
              fontSize: '12pt',
              padding: '2mm',
              backgroundColor: '#fff',
              borderRadius: '2mm'
            }}>
              {ticket.age || 'Non spécifié'}
            </div>
          </div>
        </div>
        
        {/* Informations Consultation */}
        <div style={{ 
          flex: '1 1 300px',
          backgroundColor: '#f9f9f9',
          padding: '8mm',
          borderRadius: '5mm',
          border: '1px solid #e8e8e8'
        }}>
          <h2 style={{ 
            fontSize: '16pt', 
            margin: '0 0 5mm 0',
            color: '#1890ff',
            fontWeight: 'bold',
            borderBottom: '1px solid #1890ff',
            paddingBottom: '2mm'
          }}>
            <FileTextOutlined style={{ marginRight: '5mm' }} />
            CONSULTATION
          </h2>
          
          <div style={{ marginBottom: '3mm' }}>
            <div style={{ fontSize: '11pt', color: '#666', marginBottom: '1mm' }}>
              Date de Consultation
            </div>
            <div style={{ 
              fontSize: '14pt', 
              fontWeight: 'bold',
              padding: '2mm',
              backgroundColor: '#fff',
              borderRadius: '2mm',
              borderLeft: '3px solid #1890ff'
            }}>
              {ticket.date_consultation ? moment(ticket.date_consultation).format('DD/MM/YYYY') : 
               ticket.DATE_CREATION ? moment(ticket.DATE_CREATION).format('DD/MM/YYYY') : 
               moment().format('DD/MM/YYYY')}
            </div>
          </div>
          
          <div style={{ marginBottom: '3mm' }}>
            <div style={{ fontSize: '11pt', color: '#666', marginBottom: '1mm' }}>
              Médecin Consulté
            </div>
            <div style={{ 
              fontSize: '12pt',
              padding: '2mm',
              backgroundColor: '#fff',
              borderRadius: '2mm'
            }}>
              {ticket.medecin || ticket.MEDECIN || ticket.medecin_nom || 'Non spécifié'}
            </div>
          </div>
          
          <div style={{ marginBottom: '3mm' }}>
            <div style={{ fontSize: '11pt', color: '#666', marginBottom: '1mm' }}>
              Spécialité
            </div>
            <div style={{ 
              fontSize: '12pt',
              padding: '2mm',
              backgroundColor: '#fff',
              borderRadius: '2mm'
            }}>
              {ticket.specialite || 'Non spécifié'}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '11pt', color: '#666', marginBottom: '1mm' }}>
              Centre Médical
            </div>
            <div style={{ 
              fontSize: '12pt',
              padding: '2mm',
              backgroundColor: '#fff',
              borderRadius: '2mm'
            }}>
              {ticket.centre_sante || ticket.CENTRE_SANTE || ticket.centre_nom || 'Non spécifié'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Informations Médicales */}
      <div style={{ 
        backgroundColor: '#f8f9fa',
        padding: '8mm',
        borderRadius: '5mm',
        marginBottom: '10mm',
        border: '1px solid #e8e8e8'
      }}>
        <h2 style={{ 
          fontSize: '16pt', 
          margin: '0 0 5mm 0',
          color: '#1890ff',
          fontWeight: 'bold',
          borderBottom: '1px solid #1890ff',
          paddingBottom: '2mm'
        }}>
          <MedicineBoxOutlined style={{ marginRight: '5mm' }} />
          INFORMATIONS MÉDICALES
        </h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10mm' }}>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '2mm' }}>
              Type de Facture
            </div>
            <div style={{ 
              padding: '3mm',
              backgroundColor: '#fff',
              borderRadius: '2mm',
              border: '1px solid #ddd'
            }}>
              {ticket.type_facture || ticket.CATEGORIE || 'Consultation'}
            </div>
          </div>
          
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '2mm' }}>
              Statut
            </div>
            <div style={{ 
              padding: '3mm',
              backgroundColor: '#fff',
              borderRadius: '2mm',
              border: '1px solid #ddd'
            }}>
              {ticket.statut || ticket.STATUT || 'En attente'}
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '5mm' }}>
          <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '2mm' }}>
            Observations / Motif
          </div>
          <div style={{ 
            padding: '4mm',
            backgroundColor: '#fff',
            borderRadius: '3mm',
            border: '1px solid #ddd',
            minHeight: '20mm',
            whiteSpace: 'pre-wrap'
          }}>
            {ticket.observations || ticket.RAISON || ticket.motif || 'Aucune observation'}
          </div>
        </div>
      </div>
      
      {/* Détails Financiers */}
      <div style={{ 
        backgroundColor: '#fff',
        padding: '8mm',
        borderRadius: '5mm',
        marginBottom: '10mm',
        border: '2px solid #1890ff'
      }}>
        <h2 style={{ 
          fontSize: '18pt', 
          margin: '0 0 8mm 0',
          color: '#1890ff',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          <DollarOutlined style={{ marginRight: '5mm' }} />
          DÉCOMPTE FINANCIER
        </h2>
        
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8mm',
          marginBottom: '8mm'
        }}>
          {/* Montant Total */}
          <div style={{ 
            flex: '1 1 150px',
            backgroundColor: '#f0f0f0',
            padding: '5mm',
            borderRadius: '3mm',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12pt', color: '#666', marginBottom: '2mm' }}>
              Montant Total
            </div>
            <div style={{ fontSize: '20pt', fontWeight: 'bold', color: '#000' }}>
              {montantTotal.toLocaleString('fr-FR')} FCFA
            </div>
          </div>
          
          {/* Taux Couverture */}
          <div style={{ 
            flex: '1 1 150px',
            backgroundColor: '#e6f7ff',
            padding: '5mm',
            borderRadius: '3mm',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12pt', color: '#666', marginBottom: '2mm' }}>
              Taux Couverture
            </div>
            <div style={{ fontSize: '20pt', fontWeight: 'bold', color: '#1890ff' }}>
              {tauxPriseCharge}%
            </div>
          </div>
          
          {/* Montant Couvert */}
          <div style={{ 
            flex: '1 1 150px',
            backgroundColor: '#f6ffed',
            padding: '5mm',
            borderRadius: '3mm',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12pt', color: '#666', marginBottom: '2mm' }}>
              Montant Couvert
            </div>
            <div style={{ fontSize: '20pt', fontWeight: 'bold', color: '#52c41a' }}>
              {montantPriseCharge.toLocaleString('fr-FR')} FCFA
            </div>
          </div>
        </div>
        
        {/* Ticket Modérateur */}
        <div style={{ 
          backgroundColor: '#fff7e6',
          border: '3px solid #fa8c16',
          padding: '10mm',
          borderRadius: '5mm',
          textAlign: 'center',
          marginTop: '5mm'
        }}>
          <div style={{ fontSize: '14pt', color: '#d46b08', marginBottom: '3mm', fontWeight: 'bold' }}>
            TICKET MODÉRATEUR À PAYER
          </div>
          <div style={{ fontSize: '32pt', fontWeight: 'bold', color: '#fa8c16' }}>
            {montantTicket.toLocaleString('fr-FR')} FCFA
          </div>
          <div style={{ fontSize: '12pt', color: '#d46b08', marginTop: '3mm' }}>
            Part restant à la charge du patient
          </div>
        </div>
      </div>
      
      {/* Signatures */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: '15mm',
        pageBreakBefore: 'avoid'
      }}>
        {/* Statut */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'inline-block',
            padding: '3mm 6mm',
            backgroundColor: ticket.statut === 'payé' || ticket.STATUT === 'Payé' ? '#d9f7be' : 
                           ticket.statut === 'en_attente' || ticket.STATUT === 'En attente' ? '#fff7e6' : 
                           ticket.statut === 'exempte' || ticket.STATUT === 'Exempte' ? '#e6f7ff' : '#ffccc7',
            border: `2px solid ${
              ticket.statut === 'payé' || ticket.STATUT === 'Payé' ? '#52c41a' :
              ticket.statut === 'en_attente' || ticket.STATUT === 'En attente' ? '#fa8c16' :
              ticket.statut === 'exempte' || ticket.STATUT === 'Exempte' ? '#1890ff' : '#ff4d4f'
            }`,
            borderRadius: '3mm'
          }}>
            <div style={{ fontSize: '12pt', color: '#666', marginBottom: '1mm' }}>
              Statut du Paiement:
            </div>
            <div style={{ 
              fontSize: '16pt', 
              fontWeight: 'bold',
              color: ticket.statut === 'payé' || ticket.STATUT === 'Payé' ? '#52c41a' :
                     ticket.statut === 'en_attente' || ticket.STATUT === 'En attente' ? '#fa8c16' :
                     ticket.statut === 'exempte' || ticket.STATUT === 'Exempte' ? '#1890ff' : '#ff4d4f'
            }}>
              {ticket.statut || ticket.STATUT || 'À payer'}
            </div>
          </div>
        </div>
        
        {/* Signatures */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '10pt', color: '#666', marginBottom: '10mm' }}>
            Date d'impression: {moment().format('DD/MM/YYYY HH:mm')}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', gap: '10mm' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '60mm', 
                height: '15mm',
                borderBottom: '2px solid #000',
                marginBottom: '3mm'
              }}></div>
              <div style={{ fontSize: '10pt', color: '#666' }}>
                Signature du Bénéficiaire
              </div>
              <div style={{ fontSize: '9pt', color: '#999' }}>
                Nom et prénom en majuscules
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '60mm', 
                height: '15mm',
                borderBottom: '2px solid #000',
                marginBottom: '3mm'
              }}></div>
              <div style={{ fontSize: '10pt', color: '#666' }}>
                Cachet et Signature du Responsable
              </div>
              <div style={{ fontSize: '9pt', color: '#999' }}>
                HCS Finances
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pied de page */}
      <div style={{ 
        marginTop: '15mm',
        paddingTop: '5mm',
        borderTop: '1px solid #ddd',
        fontSize: '9pt',
        color: '#666',
        textAlign: 'center',
        pageBreakAfter: 'avoid'
      }}>
        <div style={{ marginBottom: '2mm' }}>
          <strong>HCS Finances - Système de Gestion des Tickets Modérateurs</strong>
        </div>
        <div style={{ marginBottom: '2mm' }}>
          Document officiel - Conservation recommandée: 5 ans
        </div>
        <div style={{ marginBottom: '2mm' }}>
          Service client: contact@hcsfinances.com | +33 1 23 45 67 89
        </div>
        <div style={{ fontSize: '8pt', color: '#999', marginTop: '3mm' }}>
          Ce ticket est généré automatiquement et ne nécessite pas de signature manuscrite pour validation
        </div>
      </div>
    </div>
  );
});

TicketModerateurPrint.displayName = 'TicketModerateurPrint';

// Composant de recherche amélioré
const EnhancedSearch = ({ onSearch, onFilterChange, onDateChange }) => {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    statut: 'all',
    type_facture: 'all'
  });
  
  const handleSearch = () => {
    onSearch(searchText);
  };
  
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={6}>
          <Input.Search
            placeholder="Rechercher par nom, ID, référence..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            prefix={<SearchOutlined />}
            style={{ width: '100%' }}
          />
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Select
            value={filters.statut}
            style={{ width: '100%' }}
            onChange={(value) => handleFilterChange('statut', value)}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">Tous les statuts</Option>
            <Option value="en_attente">En attente</Option>
            <Option value="payé">Payé</Option>
            <Option value="validé">Validé</Option>
            <Option value="rejeté">Rejeté</Option>
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Select
            value={filters.type_facture}
            style={{ width: '100%' }}
            onChange={(value) => handleFilterChange('type_facture', value)}
          >
            <Option value="all">Tous types</Option>
            <Option value="consultation">Consultation</Option>
            <Option value="médicament">Médicament</Option>
            <Option value="analyse">Analyse</Option>
            <Option value="hospitalisation">Hospitalisation</Option>
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <RangePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder={['Date début', 'Date fin']}
            onChange={onDateChange}
          />
        </Col>
      </Row>
    </Card>
  );
};

// Composant principal avec données réelles
const GestionTicketsModerateurs = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [printModal, setPrintModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    payes: 0,
    montantTotal: 0,
    montantEnAttente: 0
  });
  
  const [searchParams, setSearchParams] = useState({
    searchTerm: '',
    filters: {},
    dateRange: null
  });
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  
  const componentRef = useRef();

  // Charger les tickets depuis l'API
  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      // Construire les paramètres de requête
      const params = {
        page: pagination.current,
        limit: pagination.pageSize
      };
      
      // Ajouter les filtres
      if (searchParams.filters.statut && searchParams.filters.statut !== 'all') {
        params.statut = searchParams.filters.statut;
      }
      
      if (searchParams.filters.type_facture && searchParams.filters.type_facture !== 'all') {
        params.type_facture = searchParams.filters.type_facture;
      }
      
      if (searchParams.searchTerm) {
        params.search = searchParams.searchTerm;
      }
      
      if (searchParams.dateRange && searchParams.dateRange[0] && searchParams.dateRange[1]) {
        params.date_debut = searchParams.dateRange[0].format('YYYY-MM-DD');
        params.date_fin = searchParams.dateRange[1].format('YYYY-MM-DD');
      }
      
      // Appeler l'API financesAPI (getDeclarations)
      const response = await financesAPI.getDeclarations(params);
      
      if (response.success && Array.isArray(response.factures)) {
        // Transformer les données de l'API pour le composant
        const transformedTickets = response.factures.map(facture => {
          // Calculer le ticket modérateur
          const montantTotal = facture.montant_total || facture.MONTANT_TOTAL || 0;
          const tauxPriseCharge = facture.taux_couverture || facture.taux_prise_charge || 0;
          const montantPriseCharge = facture.montant_couvert || facture.montant_prise_charge || 
                                    (montantTotal * tauxPriseCharge / 100);
          const montantTicket = facture.montant_restant || facture.montant_ticket || 
                               (montantTotal - montantPriseCharge);
          
          return {
            // Identifiants
            id: facture.id,
            COD_TICKET: facture.numero_facture || facture.COD_DECL || facture.id,
            COD_DECL: facture.numero_declaration || facture.COD_DECL || facture.id,
            
            // Informations bénéficiaire
            NOM_BEN: facture.beneficiaire_nom || facture.NOM_BEN || facture.nom_ben || 'Non spécifié',
            PRE_BEN: facture.beneficiaire_prenom || facture.PRE_BEN || facture.prenom_ben || '',
            IDENTIFIANT_NATIONAL: facture.patient_identifiant || facture.IDENTIFIANT_NATIONAL || facture.identifiant || 'N/A',
            
            // Informations médicales
            CENTRE_SANTE: facture.centre_nom || facture.CENTRE_SANTE || facture.centre_sante || 'Non spécifié',
            MEDECIN: facture.medecin_nom || facture.MEDECIN || facture.medecin || 'Non spécifié',
            CATEGORIE: facture.type_facture || facture.CATEGORIE || 'consultation',
            
            // Détails financiers
            MONTANT_TOTAL: montantTotal,
            TAUX_PRISE_CHARGE: tauxPriseCharge,
            MONTANT_PRISE_CHARGE: montantPriseCharge,
            MONTANT_TICKET: montantTicket,
            
            // Statut
            STATUT: facture.statut || facture.STATUT || 'en_attente',
            
            // Dates
            DATE_CREATION: facture.date_creation || facture.DATE_CREATION || new Date().toISOString(),
            DATE_CONSULTATION: facture.date_consultation || facture.DATE_CREATION,
            DATE_PAIEMENT: facture.date_paiement || facture.DATE_PAIEMENT,
            
            // Autres
            RAISON: facture.motif || facture.RAISON || facture.description || 'Non spécifiée',
            NB_ITEMS_TICKET: facture.nb_elements || facture.NB_ITEMS || 1,
            
            // Données brutes pour référence
            rawData: facture
          };
        });
        
        setTickets(transformedTickets);
        setPagination(prev => ({ 
          ...prev, 
          total: response.pagination?.total || transformedTickets.length 
        }));
        
        // Calculer les statistiques
        const stats = {
          total: transformedTickets.length,
          enAttente: transformedTickets.filter(t => t.STATUT === 'en_attente' || t.STATUT === 'En attente').length,
          payes: transformedTickets.filter(t => t.STATUT === 'payé' || t.STATUT === 'Payé' || t.STATUT === 'validé').length,
          montantTotal: transformedTickets.reduce((sum, t) => sum + (t.MONTANT_TOTAL || 0), 0),
          montantEnAttente: transformedTickets
            .filter(t => t.STATUT === 'en_attente' || t.STATUT === 'En attente')
            .reduce((sum, t) => sum + (t.MONTANT_TICKET || 0), 0)
        };
        setStats(stats);
        
        message.success(`${transformedTickets.length} tickets chargés`);
      } else {
        message.warning('Aucun ticket trouvé ou erreur de chargement');
        setTickets([]);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des tickets:', error);
      message.error('Erreur lors du chargement des données');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchParams]);

  // Charger les statistiques détaillées
  const loadDetailedStats = useCallback(async () => {
    try {
      const response = await financesAPI.getStatistiques({ periode: 'mois' });
      
      if (response.success && response.statistiques) {
        // Mettre à jour les statistiques avec les données de l'API
        setStats(prev => ({
          ...prev,
          ...response.statistiques
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }, []);

  useEffect(() => {
    loadTickets();
    loadDetailedStats();
  }, [loadTickets, loadDetailedStats]);

  // Gérer le changement de pagination
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  // Fonction d'impression
  const handlePrint = () => {
    if (!componentRef.current) return;
    
    const printContent = componentRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket Modérateur - ${selectedTicket?.COD_TICKET}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 20mm;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            @media print {
              body * {
                visibility: hidden;
              }
              
              .ticket-print, .ticket-print * {
                visibility: visible;
              }
              
              .ticket-print {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
              }
              
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket-print">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Fonction pour traiter un ticket (payer/rejeter)
 const traiterTicket = async (ticketId, action, motif = '') => {
  try {
    let response;
    
    // Pour payer un ticket modérateur, utiliser l'API financesAPI au lieu de remboursementsAPI
    if (action === 'payer') {
      // Vérifier qu'on a bien un ID de déclaration
      const ticketToProcess = tickets.find(t => t.id === ticketId) || selectedTicket;
      const declarationId = ticketToProcess?.COD_DECL || ticketToProcess?.id;
      
      if (!declarationId) {
        message.error('ID de déclaration manquant');
        return;
      }
      
      // Utiliser financesAPI pour initier le paiement
     response = await financesAPI.initierPaiement({
  typeTransaction: 'facture',
  factureId: ticketToProcess?.id, // Ceci est important!
  montant: ticketToProcess?.MONTANT_TICKET,
  method: 'Espèces',
  observations: `Paiement ticket modérateur: ${motif}`,
  codBen: ticketToProcess?.rawData?.COD_BEN,
  notifierClient: true
});
    } else if (action === 'rejeter') {
      // Pour rejeter, utiliser remboursementsAPI ou financesAPI selon votre backend
      response = await remboursementsAPI.rejeterDeclaration({
        declaration_id: ticketId,
        motif: `Rejet ticket modérateur: ${motif}`
      });
    } else if (action === 'valider') {
      response = await remboursementsAPI.validerDeclaration({
        declaration_id: ticketId,
        motif: `Validation ticket modérateur: ${motif}`
      });
    }
    
    if (response && response.success) {
      message.success(`Ticket ${action === 'payer' ? 'payé' : action === 'valider' ? 'validé' : 'rejeté'} avec succès`);
      loadTickets(); // Recharger les tickets
      loadDetailedStats(); // Recharger les statistiques
    } else {
      message.error(response?.message || `Erreur lors du traitement du ticket`);
    }
  } catch (error) {
    console.error(`Erreur lors du traitement du ticket:`, error);
    message.error(`Erreur lors du traitement: ${error.message}`);
  }
};

  // Fonction pour créer un ticket
  const handleCreateTicket = async (values) => {
    try {
      const response = await financesAPI.createDeclaration({
        ...values,
        type_facture: 'ticket_moderateur',
        date_creation: new Date().toISOString(),
        statut: 'en_attente'
      });
      
      if (response.success) {
        message.success('Ticket créé avec succès');
        setCreateModalVisible(false);
        createForm.resetFields();
        loadTickets(); // Recharger la liste
      } else {
        message.error(response.message || 'Erreur lors de la création du ticket');
      }
    } catch (error) {
      console.error('Erreur lors de la création du ticket:', error);
      message.error('Erreur lors de la création du ticket');
    }
  };

  // Fonction pour exporter les données
  const handleExport = async () => {
    try {
      const response = await financesAPI.exportData('factures', {
        ...searchParams.filters,
        format: 'csv'
      });
      
      if (response.success && response.data) {
        // Créer un fichier CSV
        const headers = ['N° Ticket', 'Bénéficiaire', 'Montant Ticket', 'Type', 'Statut', 'Date Création'];
        const csvContent = [
          headers.join(','),
          ...response.data.map(item => [
            item.numero_facture || item.id,
            `${item.beneficiaire_nom || ''} ${item.beneficiaire_prenom || ''}`,
            item.montant_restant || item.montant_ticket || 0,
            item.type_facture || '',
            item.statut || '',
            item.date_creation ? moment(item.date_creation).format('DD/MM/YYYY') : ''
          ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `tickets_moderateurs_${moment().format('YYYYMMDD_HHmmss')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success(`${response.data.length} tickets exportés`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      message.error('Erreur lors de l\'export');
    }
  };

  // Colonnes du tableau
  const columns = [
    {
      title: 'N° Ticket',
      dataIndex: 'COD_TICKET',
      key: 'COD_TICKET',
      render: (text) => <Tag color="blue">{text}</Tag>,
      sorter: (a, b) => a.COD_TICKET.localeCompare(b.COD_TICKET),
    },
    {
      title: 'Bénéficiaire',
      key: 'BENEFICIAIRE',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.NOM_BEN} {record.PRE_BEN}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.IDENTIFIANT_NATIONAL}</div>
        </div>
      ),
    },
    {
      title: 'Montant Ticket',
      dataIndex: 'MONTANT_TICKET',
      key: 'MONTANT_TICKET',
      render: (amount) => (
        <div style={{ fontWeight: 'bold', color: '#fa8c16' }}>
          {parseFloat(amount || 0).toLocaleString('fr-FR')} FCFA
        </div>
      ),
      align: 'right',
      sorter: (a, b) => (a.MONTANT_TICKET || 0) - (b.MONTANT_TICKET || 0),
    },
    {
      title: 'Type',
      dataIndex: 'CATEGORIE',
      key: 'CATEGORIE',
      render: (categorie) => (
        <Tag color={
          categorie === 'consultation' ? 'blue' :
          categorie === 'médicament' ? 'green' :
          categorie === 'analyse' ? 'cyan' :
          categorie === 'hospitalisation' ? 'purple' : 'default'
        }>
          {categorie}
        </Tag>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'STATUT',
      key: 'STATUT',
      render: (statut) => {
        const statutText = statut === 'en_attente' ? 'En attente' : 
                          statut === 'payé' ? 'Payé' : 
                          statut === 'validé' ? 'Validé' : 
                          statut === 'rejeté' ? 'Rejeté' : statut;
        
        return (
          <Badge
            status={
              statut === 'payé' || statut === 'validé' ? 'success' :
              statut === 'en_attente' ? 'warning' :
              statut === 'rejeté' ? 'error' : 'default'
            }
            text={
              <Tag color={
                statut === 'payé' || statut === 'validé' ? 'green' :
                statut === 'en_attente' ? 'orange' :
                statut === 'rejeté' ? 'red' : 'default'
              }>
                {statutText}
              </Tag>
            }
          />
        );
      },
    },
    {
      title: 'Date Création',
      dataIndex: 'DATE_CREATION',
      key: 'DATE_CREATION',
      render: (date) => moment(date).format('DD/MM/YYYY'),
      sorter: (a, b) => moment(a.DATE_CREATION).unix() - moment(b.DATE_CREATION).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Voir détails">
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedTicket(record);
                setModalVisible(true);
              }}
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="Imprimer ticket">
            <Button
              icon={<PrinterOutlined />}
              onClick={() => {
                setSelectedTicket(record);
                setPrintModal(true);
              }}
              size="small"
            />
          </Tooltip>
          
          {(record.STATUT === 'en_attente' || record.STATUT === 'En attente') && (
            <Tooltip title="Payer le ticket">
              <Popconfirm
                title="Confirmer le paiement"
                description={`Êtes-vous sûr de vouloir payer ${(record.MONTANT_TICKET || 0).toLocaleString('fr-FR')} FCFA ?`}
                onConfirm={() => traiterTicket(record.id, 'payer', 'Paiement effectué')}
                okText="Oui"
                cancelText="Non"
              >
                <Button
                  type="primary"
                  size="small"
                >
                  Payer
                </Button>
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarOutlined style={{ fontSize: '24px' }} />
            <Title level={4} style={{ margin: 0 }}>Gestion des Tickets Modérateurs</Title>
          </div>
        }
        extra={
          <Space>
            <Button
              icon={<FileAddOutlined />}
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
          </Space>
        }
      >
        {/* Statistiques */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Total Tickets"
                value={stats.total}
                valueStyle={{ color: '#1890ff' }}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="En Attente"
                value={stats.enAttente}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Payés"
                value={stats.payes}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
              <Progress 
                percent={stats.total > 0 ? Math.round((stats.payes / stats.total) * 100) : 0}
                size="small" 
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Montant à Payer"
                value={stats.montantEnAttente}
                suffix="FCFA"
                valueStyle={{ color: '#cf1322' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Recherche et filtres */}
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
        />

        {/* Tableau des tickets */}
        {tickets.length === 0 && !loading ? (
          <Empty
            description="Aucun ticket trouvé"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
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
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} tickets`,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
            onChange={handleTableChange}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: 16, background: '#fafafa' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Centre de santé">
                          {record.CENTRE_SANTE}
                        </Descriptions.Item>
                        <Descriptions.Item label="Médecin">
                          {record.MEDECIN}
                        </Descriptions.Item>
                        <Descriptions.Item label="N° Déclaration">
                          {record.COD_DECL}
                        </Descriptions.Item>
                      </Descriptions>
                    </Col>
                    <Col span={12}>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Montant total">
                          {(record.MONTANT_TOTAL || 0).toLocaleString('fr-FR')} FCFA
                        </Descriptions.Item>
                        <Descriptions.Item label="Taux couverture">
                          {record.TAUX_PRISE_CHARGE || 0}%
                        </Descriptions.Item>
                        <Descriptions.Item label="Montant couvert">
                          {(record.MONTANT_PRISE_CHARGE || 0).toLocaleString('fr-FR')} FCFA
                        </Descriptions.Item>
                      </Descriptions>
                    </Col>
                  </Row>
                  <div style={{ marginTop: 8 }}>
                    <strong>Observations:</strong>
                    <div style={{ 
                      marginTop: 4, 
                      padding: 8, 
                      background: '#fff', 
                      borderRadius: 4,
                      border: '1px solid #e8e8e8',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {record.RAISON}
                    </div>
                  </div>
                </div>
              ),
            }}
          />
        )}
      </Card>

      {/* Modal Création Ticket */}
      <Modal
        title="Créer un nouveau ticket modérateur"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        onOk={() => createForm.submit()}
        confirmLoading={loading}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateTicket}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="beneficiaire_id"
                label="Bénéficiaire"
                rules={[{ required: true, message: 'Veuillez sélectionner un bénéficiaire' }]}
              >
                <Select
                  placeholder="Sélectionner un bénéficiaire"
                  showSearch
                  optionFilterProp="children"
                >
                  {/* Les options seront chargées dynamiquement */}
                  <Option value="1">Aérogrés Avec</Option>
                  <Option value="2">Dupont Jean</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="montant_total"
                label="Montant total"
                rules={[{ required: true, message: 'Veuillez saisir le montant total' }]}
              >
                <Input type="number" addonAfter="FCFA" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="taux_couverture"
                label="Taux de couverture"
                rules={[{ required: true, message: 'Veuillez saisir le taux de couverture' }]}
              >
                <Select placeholder="Sélectionner le taux">
                  <Option value="100">100%</Option>
                  <Option value="90">90%</Option>
                  <Option value="80">80%</Option>
                  <Option value="70">70%</Option>
                  <Option value="60">60%</Option>
                  <Option value="50">50%</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type_facture"
                label="Type de facture"
                rules={[{ required: true, message: 'Veuillez sélectionner le type' }]}
              >
                <Select placeholder="Sélectionner le type">
                  <Option value="consultation">Consultation</Option>
                  <Option value="médicament">Médicament</Option>
                  <Option value="analyse">Analyse</Option>
                  <Option value="hospitalisation">Hospitalisation</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="motif"
            label="Motif/Observations"
          >
            <TextArea rows={3} placeholder="Saisir les observations..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Détails */}
      <Modal
        title={`Détails du Ticket - ${selectedTicket?.COD_TICKET}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Fermer
          </Button>,
          <Button 
            key="print" 
            type="primary" 
            icon={<PrinterOutlined />}
            onClick={() => {
              setModalVisible(false);
              setPrintModal(true);
            }}
          >
            Imprimer
          </Button>
        ]}
        width={700}
      >
        {selectedTicket && (
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
              {moment(selectedTicket.DATE_CREATION).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            
            <Descriptions.Item label="Médecin">
              {selectedTicket.MEDECIN}
            </Descriptions.Item>
            
            <Descriptions.Item label="Centre de santé">
              {selectedTicket.CENTRE_SANTE}
            </Descriptions.Item>
            
            <Descriptions.Item label="Montant Total">
              <Text strong>{(selectedTicket.MONTANT_TOTAL || 0).toLocaleString('fr-FR')} FCFA</Text>
            </Descriptions.Item>
            
            <Descriptions.Item label="Taux Couverture">
              <Tag color="blue">{selectedTicket.TAUX_PRISE_CHARGE || 0}%</Tag>
            </Descriptions.Item>
            
            <Descriptions.Item label="Montant Couvert">
              <Text type="success">{(selectedTicket.MONTANT_PRISE_CHARGE || 0).toLocaleString('fr-FR')} FCFA</Text>
            </Descriptions.Item>
            
            <Descriptions.Item label="Ticket Modérateur">
              <Text type="warning" strong>{(selectedTicket.MONTANT_TICKET || 0).toLocaleString('fr-FR')} FCFA</Text>
            </Descriptions.Item>
            
            <Descriptions.Item label="Statut">
              <Tag color={
                selectedTicket.STATUT === 'payé' || selectedTicket.STATUT === 'Payé' ? 'green' :
                selectedTicket.STATUT === 'en_attente' || selectedTicket.STATUT === 'En attente' ? 'orange' :
                selectedTicket.STATUT === 'validé' ? 'blue' : 'red'
              }>
                {selectedTicket.STATUT}
              </Tag>
            </Descriptions.Item>
            
            <Descriptions.Item label="Observations" span={2}>
              <div style={{ 
                padding: 8, 
                background: '#f5f5f5', 
                borderRadius: 4,
                whiteSpace: 'pre-wrap'
              }}>
                {selectedTicket.RAISON}
              </div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

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
              message="Aperçu du ticket modérateur"
              description="Le ticket sera imprimé sur une page A4. Vérifiez l'aperçu avant d'imprimer."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <div style={{ 
              border: '1px solid #d9d9d9', 
              padding: 20, 
              background: 'white',
              overflow: 'auto',
              maxHeight: '500px'
            }}>
              <div ref={componentRef}>
                <TicketModerateurPrint 
                  ticket={selectedTicket}
                  config={{}}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Bouton flottant pour l'export */}
      <FloatButton.Group
        shape="circle"
        style={{ right: 24 }}
        icon={<SettingOutlined />}
      >
        <FloatButton
          icon={<ExportOutlined />}
          tooltip="Exporter en CSV"
          onClick={handleExport}
        />
        
        <FloatButton
          icon={<PrinterOutlined />}
          tooltip="Imprimer la liste"
          onClick={() => {
            if (tickets.length === 0) {
              message.warning('Aucun ticket à imprimer');
              return;
            }
            message.info('Fonction d\'impression de liste bientôt disponible');
          }}
        />
      </FloatButton.Group>
    </div>
  );
};

export default GestionTicketsModerateurs;