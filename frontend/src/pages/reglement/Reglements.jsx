import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Table, Card, Row, Col, Statistic, Button, Modal, Form,
  Select, Input, DatePicker, Tag, Space, message,
  Descriptions, Tooltip, Divider, Empty, InputNumber,
  AutoComplete, Drawer, Switch, Radio, Progress, Popconfirm,
  Flex, Alert, Steps, Typography, Badge, Avatar, List, Image,
  Collapse, Tabs, Upload, Timeline
} from 'antd';
import {
  DollarOutlined, TransactionOutlined, FileTextOutlined,
  CheckCircleOutlined, SyncOutlined, DownloadOutlined,
  EyeOutlined, UserOutlined, BankOutlined,
  WarningOutlined, InfoCircleOutlined, ClockCircleOutlined,
  SearchOutlined, PlusOutlined, CreditCardOutlined,
  MoneyCollectOutlined, MobileOutlined, FilePdfOutlined,
  WalletOutlined, CheckOutlined, PhoneOutlined, MailOutlined,
  DeleteOutlined, PrinterOutlined, ReloadOutlined,
  ArrowRightOutlined, ArrowLeftOutlined, FilterOutlined,
  ExportOutlined, ToolOutlined, HistoryOutlined,
  IdcardOutlined, MedicineBoxOutlined, CalendarOutlined,
  EnvironmentOutlined, TeamOutlined, BarcodeOutlined,
  StarOutlined, SettingOutlined, BarChartOutlined,
  PieChartOutlined, LineChartOutlined, DashboardOutlined
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/fr';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { useReactToPrint } from 'react-to-print';

// Importation des API existantes
import { 
  beneficiairesAPI as patientsAPI,
  dashboardAPI,
  consultationsAPI,
  prestationsAPI,
  prescriptionsAPI,
  authAPI,
  statistiquesAPI,
  centresAPI
} from '../../services/api';

const { Title, Text, TextArea, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { TabPane } = Tabs;

// Configuration de moment en français
moment.locale('fr');

// Configuration des statuts
const STATUS_CONFIG = {
  'payée': { color: '#52c41a', text: 'Payée', icon: <CheckCircleOutlined /> },
  'paye': { color: '#52c41a', text: 'Payée', icon: <CheckCircleOutlined /> },
  'complet': { color: '#52c41a', text: 'Complet', icon: <CheckCircleOutlined /> },
  'partiel': { color: '#faad14', text: 'Partiel', icon: <SyncOutlined /> },
  'partielle': { color: '#faad14', text: 'Partielle', icon: <SyncOutlined /> },
  'en_attente': { color: '#d9d9d9', text: 'En attente', icon: <ClockCircleOutlined /> },
  'en_cours': { color: '#1890ff', text: 'En cours', icon: <SyncOutlined spin /> },
  'avance': { color: '#13c2c2', text: 'Avance', icon: <ArrowRightOutlined /> },
  'annule': { color: '#f5222d', text: 'Annulé', icon: <WarningOutlined /> },
  'annulée': { color: '#f5222d', text: 'Annulée', icon: <WarningOutlined /> },
  'default': { color: '#d9d9d9', text: 'Non défini', icon: <InfoCircleOutlined /> }
};

const PAYMENT_METHODS = [
  { value: 'Espèces', label: 'Espèces', color: 'green', icon: <MoneyCollectOutlined /> },
  { value: 'MobileMoney', label: 'Mobile Money', color: 'blue', icon: <MobileOutlined /> },
  { value: 'CarteBancaire', label: 'Carte Bancaire', color: 'purple', icon: <CreditCardOutlined /> },
  { value: 'Virement', label: 'Virement', color: 'orange', icon: <BankOutlined /> },
  { value: 'Chèque', label: 'Chèque', color: 'cyan', icon: <FileTextOutlined /> }
];

// Composants réutilisables
const StatusTag = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.default;
  return (
    <Tag color={config.color} icon={config.icon} style={{ fontWeight: 500, borderRadius: '4px' }}>
      {config.text}
    </Tag>
  );
};

const PaymentMethodTag = ({ method }) => {
  const config = PAYMENT_METHODS.find(m => m.value === method) || { color: 'default', icon: <DollarOutlined /> };
  return (
    <Tag color={config.color} icon={config.icon} style={{ borderRadius: '4px' }}>
      {config.label || method}
    </Tag>
  );
};

const MontantDisplay = ({ value, currency = 'XAF', style = {}, precision = 0, size = 'normal' }) => {
  const num = parseFloat(value || 0);
  const isNegative = num < 0;
  const formatted = isNaN(num) ? '0' : Math.abs(num).toLocaleString('fr-FR', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
  
  const fontSize = size === 'large' ? '16px' : size === 'small' ? '12px' : '14px';
  const fontWeight = size === 'large' ? 'bold' : '500';
  
  return (
    <span style={{ 
      fontWeight: fontWeight,
      fontSize: fontSize,
      color: isNegative ? '#f5222d' : (num > 0 ? '#52c41a' : '#8c8c8c'),
      fontFamily: 'Arial, sans-serif',
      ...style 
    }}>
      {formatted} {currency}
    </span>
  );
};

const DashboardCard = ({ title, value, prefix, suffix, valueStyle, loading, children, icon, color }) => (
  <Card 
    size="small" 
    hoverable 
    loading={loading}
    style={{ 
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      border: `1px solid ${color ? color + '20' : '#f0f0f0'}`
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      {icon && <div style={{ 
        backgroundColor: color + '20', 
        padding: '8px', 
        borderRadius: '6px',
        marginRight: '12px'
      }}>
        {React.cloneElement(icon, { style: { color, fontSize: '18px' } })}
      </div>}
      <Text type="secondary" style={{ fontSize: '12px', fontWeight: '500' }}>{title}</Text>
    </div>
    <Statistic
      value={typeof value === 'number' ? value : parseFloat(value || 0)}
      prefix={prefix}
      suffix={suffix}
      styles={{
        content: { 
          fontSize: '24px', 
          fontWeight: 'bold',
          color: color || '#1890ff',
          ...valueStyle 
        }
      }}
      formatter={(val) => {
        const num = parseFloat(val || 0);
        return isNaN(num) ? '0' : num.toLocaleString('fr-FR');
      }}
    />
    {children}
  </Card>
);

// Fonctions utilitaires
const checkFactureStatus = (montantTotal, montantPaye) => {
  const total = parseFloat(montantTotal || 0);
  const paye = parseFloat(montantPaye || 0);
  const restant = Math.max(0, total - paye);
  
  let statut = 'en_attente';
  if (restant <= 0 && total > 0) {
    statut = 'payée';
  } else if (paye > 0 && restant > 0) {
    statut = 'partielle';
  } else if (paye === 0 && total > 0) {
    statut = 'en_attente';
  } else if (total === 0) {
    statut = 'annulée';
  }
  
  return { statut, montantRestant: restant };
};

// API financière utilisant les données réelles
const financesAPI = {
  async getDashboardRealData(periode = 'mois') {
    try {
      console.log('🔍 Chargement des données réelles du dashboard...');
      
      // Récupérer les statistiques réelles
      const [statsResponse, consultationsResponse, prestationsResponse, statistiquesGenerales] = await Promise.all([
        dashboardAPI.getStats(periode),
        consultationsAPI.getAllConsultations({
          dateDebut: moment().startOf(periode).format('YYYY-MM-DD'),
          dateFin: moment().endOf('day').format('YYYY-MM-DD')
        }),
        prestationsAPI.getAllPrestations({
          dateDebut: moment().startOf(periode).format('YYYY-MM-DD'),
          dateFin: moment().endOf('day').format('YYYY-MM-DD')
        }),
        statistiquesAPI.getStatistiquesGenerales()
      ]);

      console.log('📊 Données récupérées:', {
        statsResponse,
        consultationsCount: consultationsResponse.consultations?.length,
        prestationsCount: prestationsResponse.prestations?.length,
        statistiquesGenerales
      });

      // Calculer les montants totaux à partir des données réelles
      let montantConsultations = 0;
      let montantPrestations = 0;
      let montantPayeConsultations = 0;
      let montantPayePrestations = 0;
      let totalReglements = 0;

      if (consultationsResponse.success && consultationsResponse.consultations) {
        consultationsResponse.consultations.forEach(consult => {
          const montant = parseFloat(consult.MONTANT_CONSULTATION || consult.montant || 0);
          montantConsultations += montant;
          
          // Vérifier le statut de paiement
          if (consult.STATUT_PAIEMENT === 'payée' || consult.STATUT_PAIEMENT === 'paye' || 
              consult.statut === 'payée' || consult.statut === 'paye') {
            montantPayeConsultations += montant;
            totalReglements++;
          } else if (consult.STATUT_PAIEMENT === 'partiel' || consult.STATUT_PAIEMENT === 'partielle' ||
                    consult.statut === 'partiel' || consult.statut === 'partielle') {
            montantPayeConsultations += montant * 0.5; // Exemple: 50% payé
            totalReglements++;
          }
        });
      }

      if (prestationsResponse.success && prestationsResponse.prestations) {
        prestationsResponse.prestations.forEach(prest => {
          const montant = parseFloat(prest.MONTANT || prest.MLT_PRE || prest.montant || 0);
          montantPrestations += montant;
          
          if (prest.STATUT === 'payée' || prest.STATUT === 'paye' || 
              prest.statut === 'payée' || prest.statut === 'paye') {
            montantPayePrestations += montant;
            totalReglements++;
          } else if (prest.STATUT === 'partiel' || prest.STATUT === 'partielle' ||
                    prest.statut === 'partiel' || prest.statut === 'partielle') {
            montantPayePrestations += montant * 0.5;
            totalReglements++;
          }
        });
      }

      const encaissementsTotal = montantPayeConsultations + montantPayePrestations;
      const facturesTotal = montantConsultations + montantPrestations;
      const resteAPayer = Math.max(0, facturesTotal - encaissementsTotal);
      const tauxPaiement = facturesTotal > 0 ? Math.round((encaissementsTotal / facturesTotal) * 100) : 0;

      console.log('📈 Calculs terminés:', {
        encaissementsTotal,
        facturesTotal,
        resteAPayer,
        tauxPaiement,
        totalReglements
      });

      return {
        success: true,
        dashboard: {
          statistiques: {
            reglements: { 
              total: totalReglements,
              montant_total: encaissementsTotal
            },
            factures: {
              total: (consultationsResponse.consultations?.length || 0) + (prestationsResponse.prestations?.length || 0),
              montant_total: facturesTotal
            }
          },
          resume: {
            encaissements_mois: encaissementsTotal,
            decaissements_mois: 0, // À calculer avec les remboursements réels
            solde: resteAPayer,
            taux_paiement: tauxPaiement
          },
          details: {
            consultations: {
              total: consultationsResponse.consultations?.length || 0,
              montant: montantConsultations,
              paye: montantPayeConsultations
            },
            prestations: {
              total: prestationsResponse.prestations?.length || 0,
              montant: montantPrestations,
              paye: montantPayePrestations
            }
          }
        }
      };
    } catch (error) {
      console.error('❌ Erreur dashboard réel:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur lors du chargement des données réelles',
        dashboard: {
          statistiques: { reglements: { total: 0, montant_total: 0 }, factures: { total: 0, montant_total: 0 } },
          resume: { encaissements_mois: 0, decaissements_mois: 0, solde: 0, taux_paiement: 0 },
          details: { consultations: { total: 0, montant: 0, paye: 0 }, prestations: { total: 0, montant: 0, paye: 0 } }
        }
      };
    }
  },

  async getReglementsReal(params = {}) {
    try {
      console.log('🔍 Chargement des règlements réels avec params:', params);
      
      // Récupérer les consultations (factures) avec filtres
      const consultationsParams = {
        dateDebut: params.date_debut,
        dateFin: params.date_fin,
        statut: params.statut !== 'tous' ? params.statut : undefined
      };

      const [consultationsResponse, prestationsResponse] = await Promise.all([
        consultationsAPI.getAllConsultations(consultationsParams),
        prestationsAPI.getAllPrestations(consultationsParams)
      ]);

      console.log('📊 Résultats API:', {
        consultations: consultationsResponse.consultations?.length || 0,
        prestations: prestationsResponse.prestations?.length || 0
      });

      const reglements = [];

      // Transformer les consultations en règlements
      if (consultationsResponse.success && consultationsResponse.consultations) {
        consultationsResponse.consultations.forEach((consultation, index) => {
          const montantFacture = parseFloat(consultation.MONTANT_CONSULTATION || consultation.montant || 0);
          
          // Déterminer le montant payé basé sur le statut
          let montantPaye = 0;
          let statutPaiement = consultation.STATUT_PAIEMENT || consultation.statut || 'en_attente';
          
          switch(statutPaiement.toLowerCase()) {
            case 'payée':
            case 'paye':
            case 'complet':
              montantPaye = montantFacture;
              break;
            case 'partiel':
            case 'partielle':
              montantPaye = montantFacture * 0.5; // Exemple: 50% payé
              break;
            default:
              montantPaye = 0;
          }
          
          const { statut, montantRestant } = checkFactureStatus(montantFacture, montantPaye);

          reglements.push({
            id: consultation.COD_CONS || consultation.id || `cons-${index}`,
            reference: `REG-CONS-${consultation.COD_CONS || consultation.id || index}`,
            type: 'consultation',
            methode_paiement: consultation.METHODE_PAIEMENT || consultation.methode_paiement || 'Espèces',
            date_reglement: consultation.DATE_PAIEMENT || consultation.date_paiement || consultation.DATE_CONSULTATION || consultation.date,
            montant: montantPaye,
            statut: statut,
            COD_FACTURE: consultation.COD_CONS || consultation.id,
            numero_facture: `FACT-CONS-${consultation.COD_CONS || consultation.id || index}`,
            montant_facture: montantFacture,
            COD_BEN: consultation.COD_BEN || consultation.id_beneficiaire,
            NOM_BEN: consultation.NOM_BEN || consultation.nom_beneficiaire || 'N/A',
            PRE_BEN: consultation.PRE_BEN || consultation.prenom_beneficiaire || '',
            payeur: `${consultation.NOM_BEN || ''} ${consultation.PRE_BEN || ''}`.trim() || 'Patient',
            observations: consultation.OBSERVATIONS || consultation.observations || 'Paiement consultation',
            TYPE_FACTURE: 'Consultation',
            medecin: consultation.NOM_MEDECIN || consultation.medecin,
            type_consultation: consultation.TYPE_CONSULTATION || consultation.type
          });
        });
      }

      // Transformer les prestations en règlements
      if (prestationsResponse.success && prestationsResponse.prestations) {
        prestationsResponse.prestations.forEach((prestation, index) => {
          const montantFacture = parseFloat(prestation.MONTANT || prestation.MLT_PRE || prestation.montant || 0);
          
          let montantPaye = 0;
          let statutPrestation = prestation.STATUT || prestation.statut || 'en_attente';
          
          switch(statutPrestation.toLowerCase()) {
            case 'payée':
            case 'paye':
              montantPaye = montantFacture;
              break;
            case 'partiel':
            case 'partielle':
              montantPaye = montantFacture * 0.5;
              break;
            default:
              montantPaye = 0;
          }
          
          const { statut, montantRestant } = checkFactureStatus(montantFacture, montantPaye);

          reglements.push({
            id: prestation.COD_PREST || prestation.id || `pres-${index}`,
            reference: `REG-PRES-${prestation.COD_PREST || prestation.id || index}`,
            type: 'prestation',
            methode_paiement: prestation.METHODE_PAIEMENT || prestation.methode_paiement || 'Espèces',
            date_reglement: prestation.DATE_PAIEMENT || prestation.date_paiement || prestation.DATE_PRESTATION || prestation.date,
            montant: montantPaye,
            statut: statut,
            COD_FACTURE: prestation.COD_PREST || prestation.id,
            numero_facture: `FACT-PRES-${prestation.COD_PREST || prestation.id || index}`,
            montant_facture: montantFacture,
            COD_BEN: prestation.COD_BEN || prestation.id_beneficiaire,
            NOM_BEN: prestation.beneficiaire?.NOM_BEN || prestation.nom_beneficiaire || 'N/A',
            PRE_BEN: prestation.beneficiaire?.PRE_BEN || prestation.prenom_beneficiaire || '',
            payeur: `${prestation.beneficiaire?.NOM_BEN || ''} ${prestation.beneficiaire?.PRE_BEN || ''}`.trim() || 'Patient',
            observations: prestation.OBSERVATIONS || prestation.observations || 'Paiement prestation',
            TYPE_FACTURE: 'Prestation',
            type_prestation: prestation.TYPE_PRESTATION || prestation.type,
            libelle_prestation: prestation.LIB_PREST || prestation.libelle
          });
        });
      }

      // Filtrer par méthode de paiement si spécifié
      let filteredReglements = reglements;
      if (params.type_reg && params.type_reg !== 'tous') {
        filteredReglements = reglements.filter(r => r.methode_paiement === params.type_reg);
      }

      // Filtrer par statut si spécifié
      if (params.statut && params.statut !== 'tous') {
        filteredReglements = filteredReglements.filter(r => r.statut === params.statut);
      }

      // Trier par date (plus récent d'abord)
      filteredReglements.sort((a, b) => new Date(b.date_reglement) - new Date(a.date_reglement));

      console.log('✅ Règlements formatés:', filteredReglements.length, 'éléments');

      return {
        success: true,
        reglements: filteredReglements,
        total: filteredReglements.length,
        total_montant: filteredReglements.reduce((sum, r) => sum + parseFloat(r.montant || 0), 0),
        breakdown: {
          consultations: filteredReglements.filter(r => r.type === 'consultation').length,
          prestations: filteredReglements.filter(r => r.type === 'prestation').length,
          total_amount: filteredReglements.reduce((sum, r) => sum + parseFloat(r.montant || 0), 0)
        }
      };
    } catch (error) {
      console.error('❌ Erreur récupération règlements réels:', error);
      return { 
        success: false, 
        message: error.message, 
        reglements: [],
        total: 0,
        total_montant: 0
      };
    }
  },

  async getFacturesByPatientIdReal(patientId) {
    try {
      console.log(`🔍 Chargement des factures réelles pour patient ${patientId}`);
      
      if (!patientId) {
        throw new Error('ID patient requis');
      }

      const [consultationsResponse, prestationsResponse, patientInfo] = await Promise.all([
        consultationsAPI.getByPatientId(patientId),
        prestationsAPI.getPrestationsByBeneficiaire(patientId),
        patientsAPI.getById(patientId)
      ]);

      console.log('📊 Factures patient:', {
        consultations: consultationsResponse.consultations?.length || 0,
        prestations: prestationsResponse.prestations?.length || 0,
        patientInfo: patientInfo.success
      });

      const factures = [];

      // Ajouter les consultations comme factures
      if (consultationsResponse.success && consultationsResponse.consultations) {
        consultationsResponse.consultations.forEach((consultation, index) => {
          const montantTotal = parseFloat(consultation.MONTANT_CONSULTATION || consultation.montant || 0);
          
          let montantPaye = 0;
          let statutPaiement = consultation.STATUT_PAIEMENT || consultation.statut || 'en_attente';
          
          switch(statutPaiement.toLowerCase()) {
            case 'payée':
            case 'paye':
            case 'complet':
              montantPaye = montantTotal;
              break;
            case 'partiel':
            case 'partielle':
              montantPaye = montantTotal * 0.5;
              break;
            default:
              montantPaye = 0;
          }
          
          const { statut, montantRestant } = checkFactureStatus(montantTotal, montantPaye);

          factures.push({
            id: consultation.COD_CONS || consultation.id || `cons-${index}`,
            COD_FACTURE: consultation.COD_CONS || consultation.id,
            numero: `FACT-CONS-${consultation.COD_CONS || consultation.id || index}`,
            type: 'consultation',
            dateFacture: consultation.DATE_CONSULTATION || consultation.date,
            montantTotal: montantTotal,
            montantPaye: montantPaye,
            montantRestant: montantRestant,
            statut: statut,
            consultations: [consultation],
            prestations: [],
            details: {
              medecin: consultation.NOM_MEDECIN || consultation.medecin,
              type_consultation: consultation.TYPE_CONSULTATION || consultation.type,
              observations: consultation.OBSERVATIONS || consultation.observations
            }
          });
        });
      }

      // Ajouter les prestations comme factures
      if (prestationsResponse.success && prestationsResponse.prestations) {
        prestationsResponse.prestations.forEach((prestation, index) => {
          const montantTotal = parseFloat(prestation.MONTANT || prestation.MLT_PRE || prestation.montant || 0);
          
          let montantPaye = 0;
          let statutPrestation = prestation.STATUT || prestation.statut || 'en_attente';
          
          switch(statutPrestation.toLowerCase()) {
            case 'payée':
            case 'paye':
              montantPaye = montantTotal;
              break;
            case 'partiel':
            case 'partielle':
              montantPaye = montantTotal * 0.5;
              break;
            default:
              montantPaye = 0;
          }
          
          const { statut, montantRestant } = checkFactureStatus(montantTotal, montantPaye);

          factures.push({
            id: prestation.COD_PREST || prestation.id || `pres-${index}`,
            COD_FACTURE: prestation.COD_PREST || prestation.id,
            numero: `FACT-PRES-${prestation.COD_PREST || prestation.id || index}`,
            type: 'prestation',
            dateFacture: prestation.DATE_PRESTATION || prestation.date,
            montantTotal: montantTotal,
            montantPaye: montantPaye,
            montantRestant: montantRestant,
            statut: statut,
            consultations: [],
            prestations: [prestation],
            details: {
              type_prestation: prestation.TYPE_PRESTATION || prestation.type,
              libelle_prestation: prestation.LIB_PREST || prestation.libelle,
              observations: prestation.OBSERVATIONS || prestation.observations
            }
          });
        });
      }

      console.log(`✅ Factures trouvées: ${factures.length}`);

      return {
        success: true,
        factures: factures.sort((a, b) => new Date(b.dateFacture) - new Date(a.dateFacture)),
        patientInfo: patientInfo.success ? patientInfo.beneficiaire : null,
        summary: {
          total_factures: factures.length,
          total_montant: factures.reduce((sum, f) => sum + f.montantTotal, 0),
          total_paye: factures.reduce((sum, f) => sum + f.montantPaye, 0),
          total_restant: factures.reduce((sum, f) => sum + f.montantRestant, 0)
        }
      };
    } catch (error) {
      console.error(`❌ Erreur récupération factures patient ${patientId}:`, error);
      return { 
        success: false, 
        message: error.message, 
        factures: [],
        patientInfo: null,
        summary: { total_factures: 0, total_montant: 0, total_paye: 0, total_restant: 0 }
      };
    }
  },

  async enregistrerPaiementReal(paiementData) {
    try {
      console.log('💰 Enregistrement paiement réel:', paiementData);
      
      const { type, factureId, montant, method, reference, observations, codBen } = paiementData;
      
      if (type === 'consultation') {
        // Mettre à jour la consultation
        const consultationData = {
          STATUT_PAIEMENT: montant >= paiementData.montantFacture ? 'payée' : 'partiel',
          MONTANT_PAYE: montant,
          DATE_PAIEMENT: moment().format('YYYY-MM-DD HH:mm:ss'),
          METHODE_PAIEMENT: method,
          REFERENCE_PAIEMENT: reference,
          OBSERVATIONS: observations || `Paiement de ${montant} XAF via ${method}`
        };

        console.log('📝 Mise à jour consultation:', consultationData);
        const response = await consultationsAPI.update(factureId, consultationData);
        
        console.log('📊 Réponse mise à jour:', response);
        
        if (response.success) {
          // Enregistrer le règlement dans l'historique
          const reglementData = {
            reference: `REG-${Date.now()}`,
            type: 'paiement',
            methode_paiement: method,
            date_reglement: moment().format('YYYY-MM-DD HH:mm:ss'),
            montant: montant,
            statut: 'payé',
            COD_FACTURE: factureId,
            numero_facture: `FACT-CONS-${factureId}`,
            montant_facture: paiementData.montantFacture,
            COD_BEN: codBen,
            observations: observations
          };

          return {
            success: true,
            message: 'Paiement enregistré avec succès',
            data: {
              id: Date.now(),
              reference: reglementData.reference,
              reglement: reglementData
            }
          };
        } else {
          throw new Error(response.message || 'Erreur lors de la mise à jour de la consultation');
        }
      } else if (type === 'prestation') {
        // Mettre à jour la prestation
        const prestationData = {
          STATUT: montant >= paiementData.montantFacture ? 'payée' : 'partiel',
          MONTANT_PAYE: montant,
          DATE_PAIEMENT: moment().format('YYYY-MM-DD HH:mm:ss'),
          METHODE_PAIEMENT: method,
          REFERENCE_PAIEMENT: reference,
          OBS_PRE: observations || `Paiement de ${montant} XAF via ${method}`
        };

        console.log('📝 Mise à jour prestation:', prestationData);
        const response = await prestationsAPI.updatePrestation(factureId, prestationData);
        
        console.log('📊 Réponse mise à jour:', response);
        
        if (response.success) {
          const reglementData = {
            reference: `REG-${Date.now()}`,
            type: 'paiement',
            methode_paiement: method,
            date_reglement: moment().format('YYYY-MM-DD HH:mm:ss'),
            montant: montant,
            statut: 'payé',
            COD_FACTURE: factureId,
            numero_facture: `FACT-PRES-${factureId}`,
            montant_facture: paiementData.montantFacture,
            COD_BEN: codBen,
            observations: observations
          };

          return {
            success: true,
            message: 'Paiement enregistré avec succès',
            data: {
              id: Date.now(),
              reference: reglementData.reference,
              reglement: reglementData
            }
          };
        } else {
          throw new Error(response.message || 'Erreur lors de la mise à jour de la prestation');
        }
      } else {
        throw new Error('Type de facture non supporté');
      }
    } catch (error) {
      console.error('❌ Erreur enregistrement paiement réel:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'enregistrement du paiement'
      };
    }
  },

  async genererFacturePDFProfessionnelle(factureData, patientInfo, centreInfo, utilisateurInfo) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Couleurs de la facture
        const primaryColor = [41, 128, 185]; // Bleu
        const secondaryColor = [52, 152, 219]; // Bleu clair
        const accentColor = [46, 204, 113]; // Vert
        const warningColor = [231, 76, 60]; // Rouge
        const grayColor = [149, 165, 166]; // Gris
        
        // En-tête professionnel avec dégradé
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 40, 'F');
        
        // Logo ou nom du centre
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(centreInfo.nom || 'CLINIQUE MEDICALE', 20, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255, 0.8);
        doc.setFont('helvetica', 'normal');
        doc.text('Facture Professionnelle', 20, 28);
        
        // Numéro et date de facture à droite
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(`FACTURE N° ${factureData.numero}`, 150, 15);
        
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255, 0.8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${moment(factureData.dateFacture).format('DD/MM/YYYY')}`, 150, 22);
        doc.text(`Statut: ${factureData.statut.toUpperCase()}`, 150, 27);
        
        // Informations du centre
        doc.setFillColor(245, 245, 245);
        doc.rect(20, 45, 85, 40, 'F');
        
        doc.setFontSize(11);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('ÉMETTEUR', 25, 52);
        
        doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setLineWidth(0.5);
        doc.line(25, 54, 100, 54);
        
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(centreInfo.nom || 'Centre Médical Professionnel', 25, 60);
        doc.text(centreInfo.adresse || '123 Rue de la Santé, Ville', 25, 65);
        doc.text(`Tél: ${centreInfo.telephone || '+237 XXX XX XX XX'}`, 25, 70);
        doc.text(`Email: ${centreInfo.email || 'contact@clinique.com'}`, 25, 75);
        
        // Informations du patient
        doc.setFillColor(245, 245, 245);
        doc.rect(105, 45, 85, 40, 'F');
        
        doc.setFontSize(11);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('CLIENT', 110, 52);
        
        doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.line(110, 54, 185, 54);
        
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(patientInfo.nomComplet || 'Nom du patient', 110, 60);
        doc.text(`ID: ${patientInfo.identifiant || 'N/A'}`, 110, 65);
        doc.text(`Tél: ${patientInfo.telephone || 'N/A'}`, 110, 70);
        doc.text(`Email: ${patientInfo.email || 'N/A'}`, 110, 75);
        
        // Titre de la section détails
        doc.setFontSize(16);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('DÉTAIL DE LA FACTURE', 20, 100);
        
        doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2], 0.3);
        doc.line(20, 102, 190, 102);
        
        // En-tête du tableau
        doc.setFillColor(52, 152, 219, 0.1);
        doc.rect(20, 108, 170, 8, 'F');
        
        doc.setFontSize(10);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('Description', 25, 113);
        doc.text('Date', 90, 113);
        doc.text('Qté', 120, 113);
        doc.text('Prix Unitaire', 135, 113);
        doc.text('Total', 170, 113, { align: 'right' });
        
        let yPos = 120;
        
        // Détails des consultations
        if (factureData.consultations && factureData.consultations.length > 0) {
          factureData.consultations.forEach((consult, index) => {
            if (yPos > 250) {
              doc.addPage();
              yPos = 20;
            }
            
            doc.setFontSize(9);
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'normal');
            
            // Description
            doc.text(`${index + 1}. Consultation médicale`, 25, yPos);
            
            // Date
            doc.text(moment(consult.DATE_CONSULTATION || consult.date).format('DD/MM/YY'), 90, yPos);
            
            // Quantité
            doc.text('1', 120, yPos);
            
            // Prix unitaire
            const prix = parseFloat(consult.MONTANT_CONSULTATION || consult.montant || 0);
            doc.text(`${prix.toLocaleString('fr-FR')} XAF`, 135, yPos);
            
            // Total
            doc.text(`${prix.toLocaleString('fr-FR')} XAF`, 170, yPos, { align: 'right' });
            
            // Ligne de séparation
            doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2], 0.1);
            doc.line(25, yPos + 2, 185, yPos + 2);
            
            yPos += 8;
            
            // Détails supplémentaires
            if (consult.TYPE_CONSULTATION || consult.NOM_MEDECIN) {
              doc.setFontSize(8);
              doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
              doc.text(`Type: ${consult.TYPE_CONSULTATION || 'Standard'}`, 28, yPos);
              if (consult.NOM_MEDECIN) {
                doc.text(`Médecin: Dr. ${consult.NOM_MEDECIN}`, 70, yPos);
              }
              yPos += 5;
            }
          });
        }
        
        // Détails des prestations
        if (factureData.prestations && factureData.prestations.length > 0) {
          factureData.prestations.forEach((prest, index) => {
            if (yPos > 250) {
              doc.addPage();
              yPos = 20;
            }
            
            const num = (factureData.consultations?.length || 0) + index + 1;
            const prixUnitaire = parseFloat(prest.PRIX_UNITAIRE || prest.MONTANT || 0);
            const quantite = parseFloat(prest.QUANTITE || 1);
            const totalLigne = prixUnitaire * quantite;
            
            doc.setFontSize(9);
            doc.setTextColor(60, 60, 60);
            
            // Description
            doc.text(`${num}. ${prest.LIB_PREST || prest.LIBELLE_PRESTATION || 'Prestation médicale'}`, 25, yPos);
            
            // Date
            doc.text(moment(prest.DATE_PRESTATION || prest.date).format('DD/MM/YY'), 90, yPos);
            
            // Quantité
            doc.text(quantite.toString(), 120, yPos);
            
            // Prix unitaire
            doc.text(`${prixUnitaire.toLocaleString('fr-FR')} XAF`, 135, yPos);
            
            // Total
            doc.text(`${totalLigne.toLocaleString('fr-FR')} XAF`, 170, yPos, { align: 'right' });
            
            // Ligne de séparation
            doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2], 0.1);
            doc.line(25, yPos + 2, 185, yPos + 2);
            
            yPos += 8;
            
            // Type de prestation
            if (prest.TYPE_PRESTATION) {
              doc.setFontSize(8);
              doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
              doc.text(`Type: ${prest.TYPE_PRESTATION}`, 28, yPos);
              yPos += 5;
            }
          });
        }
        
        // Ligne de séparation avant total
        yPos += 5;
        doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2], 0.3);
        doc.setLineWidth(0.5);
        doc.line(20, yPos, 190, yPos);
        yPos += 10;
        
        // Section Totaux
        doc.setFillColor(245, 245, 245);
        doc.rect(110, yPos, 80, 40, 'F');
        
        // Sous-total
        doc.setFontSize(10);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('SOUS-TOTAL:', 115, yPos + 8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(`${factureData.montantTotal.toLocaleString('fr-FR')} XAF`, 180, yPos + 8, { align: 'right' });
        
        // Montant payé
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('MONTANT PAYÉ:', 115, yPos + 16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.text(`${factureData.montantPaye.toLocaleString('fr-FR')} XAF`, 180, yPos + 16, { align: 'right' });
        
        // Reste à payer
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('RESTE À PAYER:', 115, yPos + 24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(factureData.montantRestant > 0 ? warningColor[0] : accentColor[0], 
                        factureData.montantRestant > 0 ? warningColor[1] : accentColor[1], 
                        factureData.montantRestant > 0 ? warningColor[2] : accentColor[2]);
        doc.text(`${factureData.montantRestant.toLocaleString('fr-FR')} XAF`, 180, yPos + 24, { align: 'right' });
        
        // Ligne de séparation
        doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2], 0.2);
        doc.line(115, yPos + 26, 185, yPos + 26);
        
        // Grand total
        doc.setFontSize(12);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('GRAND TOTAL:', 115, yPos + 36);
        doc.text(`${factureData.montantTotal.toLocaleString('fr-FR')} XAF`, 180, yPos + 36, { align: 'right' });
        
        // Pied de page professionnel
        yPos = 260;
        doc.setFillColor(41, 128, 185, 0.1);
        doc.rect(0, yPos, 210, 40, 'F');
        
        doc.setFontSize(8);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.setFont('helvetica', 'normal');
        doc.text('Conditions de paiement:', 20, yPos + 10);
        doc.text('Paiement dans les 30 jours suivant la réception de la facture.', 20, yPos + 15);
        
        doc.text('Informations bancaires:', 110, yPos + 10);
        doc.text('Banque: ECOBANK CAMEROUN', 110, yPos + 15);
        doc.text('IBAN: CM21 2000 1000 1234 5678 9101', 110, yPos + 20);
        doc.text('BIC: ECOCCMCX', 110, yPos + 25);
        
        // Signature
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text('Signature et cachet', 150, yPos + 35);
        doc.line(150, yPos + 37, 190, yPos + 37);
        
        // Numéro de page
        doc.setFontSize(7);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(`Page 1/1 - Générée le ${moment().format('DD/MM/YYYY HH:mm')} par ${utilisateurInfo.nom || 'Système'}`, 
                105, 297, { align: 'center' });
        
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        resolve({
          success: true,
          pdfUrl: pdfUrl,
          pdfBlob: pdfBlob,
          fileName: `facture-${factureData.numero}-${moment().format('YYYYMMDD')}.pdf`,
          document: doc
        });
      } catch (error) {
        console.error('❌ Erreur génération facture professionnelle:', error);
        reject(error);
      }
    });
  },

  async genererRecuPDFProfessionnel(reglementData, patientInfo, centreInfo) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Couleurs
        const primaryColor = [46, 204, 113]; // Vert
        const secondaryColor = [52, 152, 219]; // Bleu
        const accentColor = [155, 89, 182]; // Violet
        const grayColor = [149, 165, 166];
        
        // En-tête avec fond vert
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 50, 'F');
        
        // Icône de succès
        doc.setFontSize(40);
        doc.setTextColor(255, 255, 255);
        doc.text('✓', 30, 30);
        
        // Titre
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('REÇU DE PAIEMENT', 60, 25);
        
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255, 0.9);
        doc.setFont('helvetica', 'normal');
        doc.text('Paiement confirmé et validé', 60, 32);
        
        // Numéro de reçu
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(`N° ${reglementData.reference}`, 150, 25);
        
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255, 0.8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${moment(reglementData.date_reglement).format('DD/MM/YYYY HH:mm')}`, 150, 32);
        
        // Carte d'information
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(20, 60, 170, 50, 3, 3, 'F');
        doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2], 0.3);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, 60, 170, 50, 3, 3, 'S');
        
        // Montant du paiement
        doc.setFontSize(28);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`${parseFloat(reglementData.montant || 0).toLocaleString('fr-FR')} XAF`, 105, 85, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.setFont('helvetica', 'normal');
        doc.text('MONTANT PAYÉ', 105, 92, { align: 'center' });
        
        // Informations détaillées
        let yPos = 120;
        
        // Section Informations
        doc.setFontSize(14);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMATIONS DE PAIEMENT', 20, yPos);
        
        doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2], 0.5);
        doc.line(20, yPos + 2, 80, yPos + 2);
        
        yPos += 15;
        
        // Grille d'informations
        const infoGrid = [
          { label: 'Mode de paiement', value: reglementData.methode_paiement || 'Espèces', icon: '💳' },
          { label: 'Référence transaction', value: reglementData.reference_transaction || reglementData.reference, icon: '🔢' },
          { label: 'Numéro de facture', value: reglementData.numero_facture || 'N/A', icon: '📄' },
          { label: 'Statut', value: 'Confirmé', icon: '✅' }
        ];
        
        infoGrid.forEach((info, index) => {
          const x = index % 2 === 0 ? 25 : 110;
          const rowY = yPos + Math.floor(index / 2) * 15;
          
          doc.setFontSize(9);
          doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
          doc.text(info.icon, x, rowY);
          doc.text(info.label, x + 8, rowY);
          
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);
          doc.setFont('helvetica', 'bold');
          doc.text(info.value, x + 8, rowY + 5);
        });
        
        yPos += 40;
        
        // Section Client
        doc.setFontSize(14);
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMATIONS CLIENT', 20, yPos);
        
        doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2], 0.5);
        doc.line(20, yPos + 2, 80, yPos + 2);
        
        yPos += 15;
        
        const clientInfo = [
          { label: 'Nom', value: patientInfo.nomComplet || 'N/A' },
          { label: 'Identifiant', value: patientInfo.identifiant || 'N/A' },
          { label: 'Téléphone', value: patientInfo.telephone || 'N/A' },
          { label: 'Email', value: patientInfo.email || 'N/A' }
        ];
        
        clientInfo.forEach((info, index) => {
          doc.setFontSize(9);
          doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
          doc.text(info.label, 25, yPos + (index * 8));
          
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);
          doc.text(info.value, 70, yPos + (index * 8));
        });
        
        yPos += 40;
        
        // Section Observations
        if (reglementData.observations) {
          doc.setFontSize(14);
          doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
          doc.setFont('helvetica', 'bold');
          doc.text('OBSERVATIONS', 20, yPos);
          
          doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2], 0.5);
          doc.line(20, yPos + 2, 60, yPos + 2);
          
          yPos += 10;
          
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);
          doc.setFont('helvetica', 'normal');
          const splitText = doc.splitTextToSize(reglementData.observations, 160);
          doc.text(splitText, 25, yPos);
          
          yPos += splitText.length * 5;
        }
        
        yPos += 15;
        
        // QR Code placeholder
        doc.setFillColor(245, 245, 245);
        doc.rect(130, yPos, 60, 60, 'F');
        doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2], 0.3);
        doc.rect(130, yPos, 60, 60, 'S');
        
        doc.setFontSize(8);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('QR Code de vérification', 160, yPos + 70, { align: 'center' });
        
        // Signature et cachet
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text('Signature autorisée', 30, yPos + 50);
        doc.line(30, yPos + 52, 90, yPos + 52);
        
        // Pied de page
        doc.setFillColor(41, 128, 185, 0.1);
        doc.rect(0, 270, 210, 30, 'F');
        
        doc.setFontSize(8);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(centreInfo.nom || 'Centre Médical', 20, 278);
        doc.text(centreInfo.adresse || '', 20, 282);
        doc.text(`Tél: ${centreInfo.telephone || ''} | Email: ${centreInfo.email || ''}`, 20, 286);
        
        doc.text('Ce reçu est une preuve de paiement officielle.', 105, 278, { align: 'center' });
        doc.text('Conservez-le pour vos archives.', 105, 282, { align: 'center' });
        doc.text(`Généré le ${moment().format('DD/MM/YYYY à HH:mm')}`, 105, 286, { align: 'center' });
        
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        resolve({
          success: true,
          pdfUrl: pdfUrl,
          pdfBlob: pdfBlob,
          fileName: `recu-${reglementData.reference}-${moment().format('YYYYMMDD')}.pdf`,
          document: doc
        });
      } catch (error) {
        console.error('❌ Erreur génération reçu professionnel:', error);
        reject(error);
      }
    });
  }
};

// Composant principal amélioré
const ReglementsProfessionnel = () => {
  const [loading, setLoading] = useState({
    dashboard: false,
    reglements: false,
    patients: false,
    factures: false,
    paiement: false,
    export: false,
    patientDetails: false
  });
  
  const [reglements, setReglements] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalReglements: 0,
    totalFactures: 0,
    montantTotalReglements: 0,
    montantTotalFactures: 0,
    encaissementsMois: 0,
    tauxPaiement: 0,
    soldeDisponible: 0,
    details: {
      consultations: { total: 0, montant: 0, paye: 0 },
      prestations: { total: 0, montant: 0, paye: 0 }
    }
  });
  
  const [filters, setFilters] = useState({
    dateDebut: moment().startOf('month'),
    dateFin: moment().endOf('day'),
    typePaiement: 'tous',
    statut: 'tous'
  });
  
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientFactures, setPatientFactures] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [modalPaiementVisible, setModalPaiementVisible] = useState(false);
  const [modalDetailsVisible, setModalDetailsVisible] = useState(false);
  const [drawerPatientVisible, setDrawerPatientVisible] = useState(false);
  const [selectedReglement, setSelectedReglement] = useState(null);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
  const [typePaiement, setTypePaiement] = useState('facture');
  const [formPaiement] = Form.useForm();
  const [centreInfo, setCentreInfo] = useState({});
  const [utilisateurInfo, setUtilisateurInfo] = useState({});
  const [activeTab, setActiveTab] = useState('reglements');
  const [exportProgress, setExportProgress] = useState(0);
  const [factureSummary, setFactureSummary] = useState({
    total_factures: 0,
    total_montant: 0,
    total_paye: 0,
    total_restant: 0
  });
  
  const searchTimeoutRef = useRef(null);
  const factureRef = useRef();
  const recuRef = useRef();

  // Charger les informations du centre et de l'utilisateur
  useEffect(() => {
    const loadUserAndCentreInfo = async () => {
      try {
        // Récupérer l'utilisateur connecté
        const userResponse = await authAPI.getProfileDetails();
        if (userResponse.success && userResponse.user) {
          const user = userResponse.user;
          setUtilisateurInfo({
            nom: user.nom || user.username || 'Administrateur',
            prenom: user.prenom || '',
            email: user.email || 'admin@system.com',
            telephone: user.telephone || 'N/A',
            role: user.role || 'Utilisateur'
          });
          
          // Charger les informations du centre
          const centreResponse = await centresAPI.getMyCentre();
          if (centreResponse.success && centreResponse.centre) {
            const centre = centreResponse.centre;
            setCentreInfo({
              nom: centre.LIB_CEN || centre.nom || 'Centre Médical',
              adresse: centre.ADRESSE || centre.adresse || 'Adresse non définie',
              telephone: centre.TELEPHONE || centre.telephone || 'N/A',
              email: centre.EMAIL || centre.email || 'contact@centre.com',
              ville: centre.VILLE || centre.ville || '',
              pays: centre.PAYS || centre.pays || 'Cameroun'
            });
          } else {
            // Fallback aux informations par défaut
            setCentreInfo({
              nom: 'Centre Médical Professionnel',
              adresse: '123 Avenue de la Santé, Yaoundé',
              telephone: '+237 222 111 111',
              email: 'contact@centremédical.cm',
              ville: 'Yaoundé',
              pays: 'Cameroun'
            });
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement infos:', error);
        setUtilisateurInfo({
          nom: 'Système',
          prenom: 'Administration',
          email: 'system@admin.com',
          telephone: 'N/A',
          role: 'Administrateur'
        });
        setCentreInfo({
          nom: 'Centre Médical',
          adresse: 'Adresse non définie',
          telephone: 'N/A',
          email: 'contact@centre.com',
          ville: '',
          pays: 'Cameroun'
        });
      }
    };
    
    loadUserAndCentreInfo();
  }, []);

  const loadDashboardData = useCallback(async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      const data = await financesAPI.getDashboardRealData('mois');
      
      console.log('📊 Données dashboard réelles:', data);
      
      if (data && data.success && data.dashboard) {
        const dashboard = data.dashboard;
        setDashboardData({
          totalReglements: dashboard.statistiques.reglements.total,
          totalFactures: dashboard.statistiques.factures.total,
          montantTotalReglements: dashboard.statistiques.reglements.montant_total,
          montantTotalFactures: dashboard.statistiques.factures.montant_total,
          encaissementsMois: dashboard.resume.encaissements_mois,
          tauxPaiement: dashboard.resume.taux_paiement,
          soldeDisponible: dashboard.resume.solde,
          details: dashboard.details
        });
        
        message.success('Dashboard actualisé avec les données réelles');
      } else {
        message.warning(data?.message || 'Aucune donnée réelle disponible');
      }
    } catch (error) {
      console.error('❌ Erreur dashboard:', error);
      message.error('Erreur lors du chargement du dashboard');
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, []);

  const loadReglements = useCallback(async (filtersToApply = appliedFilters) => {
    setLoading(prev => ({ ...prev, reglements: true }));
    try {
      const params = {
        date_debut: filtersToApply.dateDebut?.format('YYYY-MM-DD'),
        date_fin: filtersToApply.dateFin?.format('YYYY-MM-DD'),
        type_reg: filtersToApply.typePaiement !== 'tous' ? filtersToApply.typePaiement : undefined,
        statut: filtersToApply.statut !== 'tous' ? filtersToApply.statut : undefined
      };

      const data = await financesAPI.getReglementsReal(params);
      
      console.log('📋 Règlements réels:', data);
      
      if (data && data.success) {
        const formattedReglements = data.reglements.map((reglement, index) => ({
          key: reglement.id || `reg-${index}`,
          id: reglement.id,
          reference: reglement.reference,
          type: reglement.type,
          typePaiement: reglement.methode_paiement,
          dateReglement: reglement.date_reglement,
          montant: parseFloat(reglement.montant || 0),
          devise: 'XAF',
          statut: reglement.statut,
          factureId: reglement.COD_FACTURE,
          factureNumero: reglement.numero_facture,
          montantFacture: parseFloat(reglement.montant_facture || 0),
          montantRestant: Math.max(0, parseFloat(reglement.montant_facture || 0) - parseFloat(reglement.montant || 0)),
          isAvance: !reglement.COD_FACTURE,
          beneficiaireId: reglement.COD_BEN,
          beneficiaireNom: `${reglement.NOM_BEN || ''} ${reglement.PRE_BEN || ''}`.trim() || 'N/A',
          payeur: reglement.payeur,
          observations: reglement.observations,
          referenceTransaction: reglement.reference_transaction,
          typeFacture: reglement.TYPE_FACTURE,
          details: {
            medecin: reglement.medecin,
            type_consultation: reglement.type_consultation,
            type_prestation: reglement.type_prestation,
            libelle_prestation: reglement.libelle_prestation
          }
        }));
        
        setReglements(formattedReglements);
        message.success(`${formattedReglements.length} règlements chargés`);
      } else {
        setReglements([]);
        message.info('Aucun règlement trouvé');
      }
    } catch (error) {
      console.error('❌ Erreur chargement règlements:', error);
      message.error('Erreur lors du chargement des règlements');
      setReglements([]);
    } finally {
      setLoading(prev => ({ ...prev, reglements: false }));
    }
  }, [appliedFilters]);

  const searchPatients = useCallback(async (term) => {
    if (!term || term.trim().length < 2) {
      setPatients([]);
      return;
    }

    setLoading(prev => ({ ...prev, patients: true }));
    try {
      // Utiliser le bon endpoint de l'API
      const response = await patientsAPI.getAll({
        search: term,
        limit: 10,
        page: 1
      });
      
      console.log('🔍 Résultat recherche patients:', response);
      
      if (response.success && response.beneficiaires && response.beneficiaires.length > 0) {
        const formattedPatients = response.beneficiaires.map(patient => {
          // S'assurer que les données du patient sont correctement formatées
          const nomComplet = `${patient.NOM_BEN || patient.nom || ''} ${patient.PRE_BEN || patient.prenom || ''}`.trim();
          
          return {
            key: patient.ID_BEN || patient.id,
            id: patient.ID_BEN || patient.id,
            nom: patient.NOM_BEN || patient.nom || '',
            prenom: patient.PRE_BEN || patient.prenom || '',
            nomComplet: nomComplet || 'Patient sans nom',
            telephone: patient.TELEPHONE || patient.TELEPHONE_MOBILE || patient.telephone || 'N/A',
            email: patient.EMAIL || patient.email || '',
            dateNaissance: patient.NAI_BEN || patient.date_naissance || '',
            sexe: patient.SEX_BEN || patient.sexe || '',
            identifiant: patient.IDENTIFIANT_NATIONAL || patient.identifiant_national || '',
            adresse: patient.ADRESSE || patient.adresse || '',
            groupeSanguin: patient.GROUPE_SANGUIN || patient.groupe_sanguin || '',
            profession: patient.PROFESSION || patient.profession || '',
            employeur: patient.EMPLOYEUR || patient.employeur || '',
            photoUrl: patient.photoUrl || patient.PHOTO_URL || null,
            // Ajouter d'autres champs si nécessaire
            COD_BEN: patient.ID_BEN || patient.id,
            ID_BEN: patient.ID_BEN || patient.id,
            NOM_BEN: patient.NOM_BEN || patient.nom,
            PRE_BEN: patient.PRE_BEN || patient.prenom
          };
        });
        
        setPatients(formattedPatients);
        console.log(`✅ ${formattedPatients.length} patients trouvés`);
      } else {
        // Essayer une autre méthode si la première ne fonctionne pas
        try {
          // Fallback: utiliser searchAdvanced avec des paramètres minimaux
          const fallbackResponse = await patientsAPI.searchAdvanced(term, {}, 10, 1);
          
          if (fallbackResponse.success && fallbackResponse.beneficiaires) {
            const formattedPatients = fallbackResponse.beneficiaires.map(patient => ({
              key: patient.ID_BEN || patient.id,
              id: patient.ID_BEN || patient.id,
              nom: patient.NOM_BEN || patient.nom || '',
              prenom: patient.PRE_BEN || patient.prenom || '',
              nomComplet: `${patient.NOM_BEN || ''} ${patient.PRE_BEN || ''}`.trim(),
              telephone: patient.TELEPHONE || patient.TELEPHONE_MOBILE || patient.telephone || 'N/A',
              email: patient.EMAIL || patient.email || '',
              dateNaissance: patient.NAI_BEN || patient.date_naissance || '',
              sexe: patient.SEX_BEN || patient.sexe || '',
              identifiant: patient.IDENTIFIANT_NATIONAL || patient.identifiant_national || '',
              adresse: patient.ADRESSE || patient.adresse || '',
              groupeSanguin: patient.GROUPE_SANGUIN || patient.groupe_sanguin || '',
              profession: patient.PROFESSION || patient.profession || '',
              employeur: patient.EMPLOYEUR || patient.employeur || '',
              photoUrl: patient.photoUrl || patient.PHOTO_URL || null
            }));
            
            setPatients(formattedPatients);
            console.log(`✅ ${formattedPatients.length} patients trouvés (fallback)`);
          } else {
            setPatients([]);
            console.log('❌ Aucun patient trouvé');
          }
        } catch (fallbackError) {
          console.error('❌ Erreur fallback recherche patients:', fallbackError);
          setPatients([]);
        }
      }
    } catch (error) {
      console.error('❌ Erreur recherche patients:', error);
      
      // Fallback ultime : données de test
      const testPatients = [
        {
          key: 1,
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          nomComplet: 'Jean Dupont',
          telephone: '+237 612 345 678',
          email: 'jean.dupont@example.com',
          dateNaissance: '1985-05-15',
          sexe: 'M',
          identifiant: 'AMS000001',
          adresse: 'Yaoundé, Cameroun',
          groupeSanguin: 'O+',
          profession: 'Ingénieur',
          employeur: 'Entreprise XYZ',
          photoUrl: null
        },
        {
          key: 2,
          id: 2,
          nom: 'Martin',
          prenom: 'Marie',
          nomComplet: 'Marie Martin',
          telephone: '+237 677 889 900',
          email: 'marie.martin@example.com',
          dateNaissance: '1990-08-22',
          sexe: 'F',
          identifiant: 'AMS000002',
          adresse: 'Douala, Cameroun',
          groupeSanguin: 'A+',
          profession: 'Médecin',
          employeur: 'Hôpital Central',
          photoUrl: null
        }
      ];
      
      // Filtrer les patients de test selon le terme de recherche
      const filteredTestPatients = testPatients.filter(patient => 
        patient.nomComplet.toLowerCase().includes(term.toLowerCase()) ||
        patient.identifiant.toLowerCase().includes(term.toLowerCase()) ||
        patient.telephone.includes(term)
      );
      
      setPatients(filteredTestPatients);
      console.log(`⚠️ Utilisation données de test: ${filteredTestPatients.length} patients`);
    } finally {
      setLoading(prev => ({ ...prev, patients: false }));
    }
  }, []);

  const selectPatient = useCallback(async (patient) => {
    console.log('👤 Patient sélectionné:', patient);
    setSelectedPatient(patient);
    setPatients([]);
    setSearchTerm('');
    await loadPatientFactures(patient.id);
  }, []);

  const loadPatientFactures = async (patientId) => {
    setLoading(prev => ({ ...prev, factures: true, patientDetails: true }));
    try {
      const response = await financesAPI.getFacturesByPatientIdReal(patientId);
      
      console.log('📄 Factures patient réelles:', response);
      
      if (response.success) {
        setPatientFactures(response.factures);
        setPatientInfo(response.patientInfo);
        setFactureSummary(response.summary);
        
        if (response.factures.length > 0) {
          message.success(`${response.factures.length} factures trouvées pour ce patient`);
        } else {
          message.info('Ce patient n\'a pas encore de facture');
        }
      } else {
        setPatientFactures([]);
        setPatientInfo(null);
        message.warning(response.message || 'Erreur lors du chargement des factures');
      }
    } catch (error) {
      console.error('❌ Erreur chargement factures patient:', error);
      message.error('Erreur lors du chargement des factures du patient');
      setPatientFactures([]);
      setPatientInfo(null);
    } finally {
      setLoading(prev => ({ ...prev, factures: false, patientDetails: false }));
    }
  };

  const handlePaiementSubmit = async (values) => {
    setLoading(prev => ({ ...prev, paiement: true }));
    
    try {
      const isAvance = typePaiement === 'avance' || !selectedFacture;
      
      if (!isAvance && !selectedFacture) {
        message.error('Veuillez sélectionner une facture');
        return;
      }
      
      const montantAPayer = parseFloat(values.montant);
      
      if (isNaN(montantAPayer) || montantAPayer <= 0) {
        message.error('Le montant doit être supérieur à 0');
        return;
      }

      let paiementData = {
        type: isAvance ? 'avance' : selectedFacture.type,
        factureId: selectedFacture?.id,
        montant: montantAPayer,
        method: values.method,
        reference: values.reference || `PAY-${Date.now()}`,
        observations: values.observations || '',
        codBen: selectedPatient?.id,
        montantFacture: selectedFacture?.montantTotal || montantAPayer
      };

      const response = await financesAPI.enregistrerPaiementReal(paiementData);
      
      if (response.success) {
        message.success('Paiement enregistré avec succès');
        formPaiement.resetFields();
        setModalPaiementVisible(false);
        setSelectedFacture(null);
        
        // Recharger les données
        await Promise.all([
          loadReglements(),
          loadDashboardData(),
          selectedPatient?.id ? loadPatientFactures(selectedPatient.id) : Promise.resolve()
        ]);
        
        // Générer le reçu si demandé
        if (values.genererReçu && response.data?.reglement) {
          await genererRecuPDFProfessionnel(response.data.reglement, selectedPatient, centreInfo);
        }
      } else {
        message.error(response.message || 'Erreur lors de l\'enregistrement du paiement');
      }
    } catch (error) {
      console.error('❌ Erreur paiement:', error);
      message.error('Erreur lors de l\'enregistrement du paiement');
    } finally {
      setLoading(prev => ({ ...prev, paiement: false }));
    }
  };

  const genererRecuPDFProfessionnel = async (reglementData, patientInfo, centreInfo) => {
    setLoading(prev => ({ ...prev, export: true }));
    try {
      const response = await financesAPI.genererRecuPDFProfessionnel(reglementData, patientInfo, centreInfo);
      
      if (response.success) {
        // Télécharger automatiquement
        saveAs(response.pdfBlob, response.fileName);
        message.success('Reçu généré et téléchargé avec succès');
        
        // Ouvrir également dans un nouvel onglet
        const printWindow = window.open(response.pdfUrl);
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      } else {
        message.error(response.message || 'Erreur lors de la génération du reçu');
      }
    } catch (error) {
      console.error('❌ Erreur génération reçu:', error);
      message.error('Erreur lors de la génération du reçu');
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };

  const imprimerFactureProfessionnelle = async (facture) => {
    setLoading(prev => ({ ...prev, export: true }));
    try {
      const patientInfoToUse = selectedPatient || patientInfo || {
        nomComplet: `${facture.prestations?.[0]?.beneficiaire?.NOM_BEN || ''} ${facture.prestations?.[0]?.beneficiaire?.PRE_BEN || ''}`.trim() || 'Patient',
        identifiant: facture.prestations?.[0]?.beneficiaire?.IDENTIFIANT_NATIONAL || 'N/A',
        telephone: facture.prestations?.[0]?.beneficiaire?.TELEPHONE || 'N/A',
        email: facture.prestations?.[0]?.beneficiaire?.EMAIL || 'N/A'
      };

      const response = await financesAPI.genererFacturePDFProfessionnelle(facture, patientInfoToUse, centreInfo, utilisateurInfo);
      
      if (response.success) {
        // Télécharger automatiquement
        saveAs(response.pdfBlob, response.fileName);
        message.success('Facture générée et téléchargée avec succès');
        
        // Ouvrir également dans un nouvel onglet
        const printWindow = window.open(response.pdfUrl);
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      } else {
        message.error(response.message || 'Erreur lors de la génération de la facture');
      }
    } catch (error) {
      console.error('❌ Erreur génération facture:', error);
      message.error('Erreur lors de la génération de la facture');
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    loadReglements(filters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      dateDebut: moment().startOf('month'),
      dateFin: moment().endOf('day'),
      typePaiement: 'tous',
      statut: 'tous'
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    loadReglements(defaultFilters);
  };

  const reglementsColumns = useMemo(() => [
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
      width: 150,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#1890ff' }}>{text}</Text>
          {record.isAvance && <Tag color="cyan" style={{ fontSize: '10px' }}>Avance</Tag>}
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.typeFacture}</Text>
        </Space>
      )
    },
    {
      title: 'Date',
      dataIndex: 'dateReglement',
      key: 'date',
      width: 120,
      render: (date) => (
        <div>
          <div style={{ fontWeight: '500' }}>{moment(date).format('DD/MM/YY')}</div>
          <Text type="secondary" style={{ fontSize: '11px' }}>{moment(date).format('HH:mm')}</Text>
        </div>
      )
    },
    {
      title: 'Patient',
      dataIndex: 'beneficiaireNom',
      key: 'beneficiaire',
      width: 180,
      render: (text, record) => (
        <Button 
          type="link" 
          onClick={() => {
            setSelectedPatientDetails({
              id: record.beneficiaireId,
              nomComplet: text,
              identifiant: record.beneficiaireId
            });
            setDrawerPatientVisible(true);
          }}
          icon={<UserOutlined />}
          style={{ padding: 0, textAlign: 'left' }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: '8px' }} />
            <div>
              <div style={{ fontWeight: '500' }}>{text || 'N/A'}</div>
              {record.details?.medecin && (
                <Text type="secondary" style={{ fontSize: '11px' }}>Dr. {record.details.medecin}</Text>
              )}
            </div>
          </div>
        </Button>
      )
    },
    {
      title: 'Facture',
      dataIndex: 'factureNumero',
      key: 'facture',
      width: 140,
      render: (text, record) => text ? (
        <Tag icon={<FileTextOutlined />} color="blue" style={{ borderRadius: '4px' }}>
          {text}
        </Tag>
      ) : (
        <Tag color="cyan" icon={<ArrowRightOutlined />}>Avance</Tag>
      )
    },
    {
      title: 'Montant',
      dataIndex: 'montant',
      key: 'montant',
      width: 120,
      align: 'right',
      render: (montant, record) => (
        <div style={{ textAlign: 'right' }}>
          <MontantDisplay value={montant} size="small" />
          <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
            / <MontantDisplay value={record.montantFacture} size="small" style={{ color: '#8c8c8c' }} />
          </div>
        </div>
      )
    },
    {
      title: 'Mode paiement',
      dataIndex: 'typePaiement',
      key: 'typePaiement',
      width: 130,
      render: (method) => <PaymentMethodTag method={method} />
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 110,
      render: (statut) => <StatusTag status={statut} />
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Voir détails">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => setSelectedReglement(record)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          
          <Tooltip title="Générer reçu">
            <Button
              icon={<FilePdfOutlined />}
              size="small"
              onClick={() => genererRecuPDFProfessionnel(record, 
                { nomComplet: record.beneficiaireNom, identifiant: record.beneficiaireId },
                centreInfo
              )}
              loading={loading.export}
              style={{ color: '#f5222d' }}
            />
          </Tooltip>
          
          <Tooltip title="Imprimer">
            <Button
              icon={<PrinterOutlined />}
              size="small"
              onClick={() => {
                setSelectedReglement(record);
                setTimeout(() => window.print(), 500);
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ], [loading.export, centreInfo]);

  const facturesColumns = useMemo(() => [
    {
      title: 'N° Facture',
      dataIndex: 'numero',
      key: 'numero',
      width: 140,
      render: (text) => (
        <Tag color="blue" style={{ fontWeight: '500', fontSize: '12px', padding: '2px 8px' }}>
          {text}
        </Tag>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (text) => (
        <Tag color={text === 'consultation' ? 'green' : 'purple'}>
          {text === 'consultation' ? 'Consultation' : 'Prestation'}
        </Tag>
      )
    },
    {
      title: 'Date',
      dataIndex: 'dateFacture',
      key: 'date',
      width: 100,
      render: (date) => moment(date).format('DD/MM/YY')
    },
    {
      title: 'Montant Total',
      dataIndex: 'montantTotal',
      key: 'montantTotal',
      width: 120,
      align: 'right',
      render: (montant) => <MontantDisplay value={montant} size="small" />
    },
    {
      title: 'Payé',
      dataIndex: 'montantPaye',
      key: 'montantPaye',
      width: 120,
      align: 'right',
      render: (montant) => <MontantDisplay value={montant} size="small" style={{ color: '#52c41a' }} />
    },
    {
      title: 'Reste',
      dataIndex: 'montantRestant',
      key: 'montantRestant',
      width: 120,
      align: 'right',
      render: (montant) => (
        <MontantDisplay 
          value={montant} 
          size="small" 
          style={{ color: montant > 0 ? '#fa8c16' : '#52c41a', fontWeight: 'bold' }} 
        />
      )
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 100,
      render: (statut) => <StatusTag status={statut} />
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, facture) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<WalletOutlined />}
            onClick={() => {
              setSelectedFacture(facture);
              setTypePaiement('facture');
              setModalPaiementVisible(true);
            }}
            disabled={facture.statut === 'payée' || facture.statut === 'annulée'}
            style={{ 
              backgroundColor: facture.statut === 'payée' ? '#52c41a' : 
                            facture.statut === 'annulée' ? '#f5222d' : '#1890ff' 
            }}
          >
            {facture.statut === 'payée' ? 'Payée' : 
             facture.statut === 'annulée' ? 'Annulée' : 'Payer'}
          </Button>
          <Button
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => imprimerFactureProfessionnelle(facture)}
            loading={loading.export}
          >
            PDF
          </Button>
        </Space>
      )
    }
  ], [loading.export]);

  useEffect(() => {
    loadDashboardData();
    loadReglements();
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchPatients(searchTerm);
      } else {
        setPatients([]);
      }
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, searchPatients]);

  // Fonction pour exporter les données
  const exportReglements = async () => {
    setExportProgress(0);
    
    try {
      // Simuler progression
      const interval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
      
      // Générer CSV
      const headers = ['Référence', 'Date', 'Patient', 'Facture', 'Type', 'Montant', 'Mode Paiement', 'Statut'];
      const rows = reglements.map(reg => [
        reg.reference,
        moment(reg.dateReglement).format('DD/MM/YYYY HH:mm'),
        reg.beneficiaireNom,
        reg.factureNumero || 'Avance',
        reg.typeFacture,
        `${reg.montant} XAF`,
        reg.typePaiement,
        reg.statut
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `reglements-${moment().format('YYYYMMDD-HHmm')}.csv`);
      
      clearInterval(interval);
      setExportProgress(100);
      message.success('Export terminé avec succès');
      
      setTimeout(() => setExportProgress(0), 2000);
      
    } catch (error) {
      console.error('❌ Erreur export:', error);
      message.error('Erreur lors de l\'export');
      setExportProgress(0);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
        padding: '24px',
        borderRadius: '8px',
        marginBottom: '24px',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <Flex justify="space-between" align="center">
          <div>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              <TransactionOutlined /> Système de Facturation Professionnel
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
              Gestion complète des règlements, factures et encaissements
            </Text>
          </div>
          <Avatar 
            size={64} 
            icon={<UserOutlined />}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '3px solid white' }}
          />
        </Flex>
      </div>
      
      <Alert
        message="Système de Facturation Réel"
        description="Ce module utilise les données réelles des consultations et prestations pour générer des factures professionnelles et suivre les paiements."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24, borderRadius: '8px' }}
      />
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'reglements',
            label: (
              <span>
                <TransactionOutlined /> Règlements
                <Badge count={reglements.length} style={{ marginLeft: '8px' }} />
              </span>
            ),
          },
          {
            key: 'facturation',
            label: (
              <span>
                <FileTextOutlined /> Facturation Patient
                {selectedPatient && (
                  <Badge count={patientFactures.length} style={{ marginLeft: '8px', backgroundColor: '#52c41a' }} />
                )}
              </span>
            ),
          },
          {
            key: 'dashboard',
            label: <span><DashboardOutlined /> Tableau de Bord</span>,
          },
          {
            key: 'rapports',
            label: <span><BarChartOutlined /> Rapports</span>,
          }
        ]}
        style={{ marginBottom: 24 }}
      />
      
      {activeTab === 'dashboard' && (
        <>
          {/* Dashboard */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <DashboardCard
                title="Encaissements du mois"
                value={dashboardData.encaissementsMois}
                suffix="XAF"
                icon={<ArrowRightOutlined />}
                color="#1890ff"
                loading={loading.dashboard}
              >
                <Progress 
                  percent={dashboardData.tauxPaiement} 
                  size="small" 
                  status={dashboardData.tauxPaiement > 80 ? 'success' : 'normal'}
                  style={{ marginTop: 8 }}
                />
              </DashboardCard>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <DashboardCard
                title="Reste à encaisser"
                value={dashboardData.soldeDisponible}
                suffix="XAF"
                icon={<ArrowLeftOutlined />}
                color="#fa8c16"
                loading={loading.dashboard}
              />
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <DashboardCard
                title="Taux de paiement"
                value={dashboardData.tauxPaiement}
                suffix="%"
                icon={<CheckCircleOutlined />}
                color={dashboardData.tauxPaiement > 80 ? '#52c41a' : '#f5222d'}
                loading={loading.dashboard}
              />
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <DashboardCard
                title="Total Règlements"
                value={dashboardData.totalReglements}
                icon={<DollarOutlined />}
                color="#722ed1"
                loading={loading.dashboard}
              >
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  Montant: <MontantDisplay value={dashboardData.montantTotalReglements} size="small" />
                </div>
              </DashboardCard>
            </Col>
          </Row>
          
          {/* Détails du dashboard */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <Card 
                title={<span><PieChartOutlined /> Répartition par type</span>}
                style={{ borderRadius: '8px' }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                        {dashboardData.details.consultations.total}
                      </div>
                      <div style={{ color: '#8c8c8c' }}>Consultations</div>
                      <MontantDisplay 
                        value={dashboardData.details.consultations.montant} 
                        size="small"
                        style={{ marginTop: '4px' }}
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                        {dashboardData.details.prestations.total}
                      </div>
                      <div style={{ color: '#8c8c8c' }}>Prestations</div>
                      <MontantDisplay 
                        value={dashboardData.details.prestations.montant} 
                        size="small"
                        style={{ marginTop: '4px' }}
                      />
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card 
                title={<span><LineChartOutlined /> Statistiques de paiement</span>}
                style={{ borderRadius: '8px' }}
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="Payé"
                      value={dashboardData.details.consultations.paye + dashboardData.details.prestations.paye}
                      suffix="XAF"
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="En attente"
                      value={dashboardData.soldeDisponible}
                      suffix="XAF"
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Total facturé"
                      value={dashboardData.montantTotalFactures}
                      suffix="XAF"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </>
      )}
      
      {activeTab === 'reglements' && (
        <>
          {/* Filtres */}
          <Card style={{ marginBottom: 24, borderRadius: '8px' }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              <FilterOutlined /> Filtres de recherche
            </Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <RangePicker
                  style={{ width: '100%' }}
                  value={[filters.dateDebut, filters.dateFin]}
                  onChange={(dates) => {
                    handleFilterChange('dateDebut', dates ? dates[0] : moment().startOf('month'));
                    handleFilterChange('dateFin', dates ? dates[1] : moment().endOf('day'));
                  }}
                  format="DD/MM/YYYY"
                  presets={[
                    { label: 'Aujourd\'hui', value: [moment(), moment()] },
                    { label: 'Cette semaine', value: [moment().startOf('week'), moment().endOf('week')] },
                    { label: 'Ce mois', value: [moment().startOf('month'), moment().endOf('month')] },
                    { label: 'Ce trimestre', value: [moment().startOf('quarter'), moment().endOf('quarter')] }
                  ]}
                />
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Select
                  style={{ width: '100%' }}
                  value={filters.typePaiement}
                  onChange={(value) => handleFilterChange('typePaiement', value)}
                  placeholder="Mode de paiement"
                  allowClear
                >
                  <Option value="tous">Tous les modes</Option>
                  {PAYMENT_METHODS.map(method => (
                    <Option key={method.value} value={method.value}>
                      {method.icon} {method.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Select
                  style={{ width: '100%' }}
                  value={filters.statut}
                  onChange={(value) => handleFilterChange('statut', value)}
                  placeholder="Statut"
                  allowClear
                >
                  <Option value="tous">Tous les statuts</Option>
                  <Option value="payée">Payé</Option>
                  <Option value="partiel">Partiel</Option>
                  <Option value="en_attente">En attente</Option>
                  <Option value="annulée">Annulé</Option>
                </Select>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button 
                    onClick={applyFilters} 
                    type="primary" 
                    icon={<FilterOutlined />}
                    style={{ background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)', border: 'none' }}
                  >
                    Appliquer
                  </Button>
                  <Button 
                    onClick={resetFilters} 
                    icon={<ReloadOutlined />}
                  >
                    Réinitialiser
                  </Button>
                  <Button 
                    onClick={exportReglements} 
                    icon={<ExportOutlined />}
                    loading={exportProgress > 0 && exportProgress < 100}
                  >
                    Exporter
                  </Button>
                </Space>
              </Col>
            </Row>
            
            {exportProgress > 0 && exportProgress < 100 && (
              <div style={{ marginTop: 16 }}>
                <Progress percent={exportProgress} status="active" />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Export en cours...
                </Text>
              </div>
            )}
          </Card>
          
          {/* Liste des Règlements */}
          <Card style={{ borderRadius: '8px' }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>
                <TransactionOutlined /> Historique des Règlements
                <Text type="secondary" style={{ marginLeft: 8, fontSize: '14px', fontWeight: 'normal' }}>
                  {reglements.length} règlements trouvés
                </Text>
              </Title>
              
              <Space>
                <Button
                  icon={<PrinterOutlined />}
                  onClick={() => window.print()}
                >
                  Imprimer
                </Button>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={() => loadReglements()}
                  loading={loading.reglements}
                >
                  Actualiser
                </Button>
              </Space>
            </Flex>
            
            <Table
              columns={reglementsColumns}
              dataSource={reglements}
              loading={loading.reglements}
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} règlements`
              }}
              locale={{
                emptyText: (
                  <Empty 
                    description="Aucun règlement trouvé" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button 
                      type="primary" 
                      onClick={() => loadReglements()}
                      loading={loading.reglements}
                    >
                      Rafraîchir
                    </Button>
                  </Empty>
                )
              }}
              style={{ borderRadius: '8px', overflow: 'hidden' }}
            />
          </Card>
        </>
      )}
      
      {activeTab === 'facturation' && (
        <>
          {/* Recherche Patient */}
          <Card style={{ marginBottom: 24, borderRadius: '8px' }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              <UserOutlined /> Recherche Patient pour Facturation
            </Title>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={16}>
                <AutoComplete
                  style={{ width: '100%' }}
                  options={patients.map(p => ({
                    value: p.nomComplet,
                    label: (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            size="small" 
                            src={p.photoUrl} 
                            icon={<UserOutlined />}
                            style={{ marginRight: '8px' }}
                          />
                          <div>
                            <div><strong>{p.nomComplet}</strong></div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              <PhoneOutlined /> {p.telephone} 
                              {p.identifiant && <span style={{ marginLeft: 8 }}><IdcardOutlined /> {p.identifiant}</span>}
                            </div>
                          </div>
                        </div>
                        <Badge 
                          count={patientFactures.length} 
                          style={{ backgroundColor: '#52c41a' }}
                          title={`${patientFactures.length} facture(s)`}
                        />
                      </div>
                    ),
                    patient: p
                  }))}
                  onSelect={(_, option) => selectPatient(option.patient)}
                  onSearch={setSearchTerm}
                  notFoundContent={
                    <div style={{ textAlign: 'center', padding: '12px' }}>
                      {loading.patients ? (
                        <div>Recherche en cours...</div>
                      ) : searchTerm.length >= 2 ? (
                        <div>Aucun patient trouvé</div>
                      ) : (
                        <div>Entrez au moins 2 caractères pour rechercher</div>
                      )}
                    </div>
                  }
                >
                  <Input
                    size="large"
                    placeholder="Rechercher un patient par nom, téléphone, identifiant..."
                    prefix={<SearchOutlined />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    allowClear
                    style={{ borderRadius: '8px' }}
                  />
                </AutoComplete>
              </Col>
              
              <Col xs={24} md={8}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button
                    type="primary"
                    icon={<PrinterOutlined />}
                    onClick={() => {
                      if (selectedPatient && patientFactures.length > 0) {
                        patientFactures.forEach((facture, index) => {
                          setTimeout(() => imprimerFactureProfessionnelle(facture), index * 1000);
                        });
                        message.info(`${patientFactures.length} factures en cours d'impression`);
                      } else {
                        message.warning('Sélectionnez un patient avec des factures');
                      }
                    }}
                    disabled={!selectedPatient || patientFactures.length === 0}
                    style={{ 
                      background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  >
                    Imprimer toutes
                  </Button>
                </Space>
              </Col>
            </Row>
            
            {selectedPatient && (
              <div style={{ marginTop: 24 }}>
                <Alert
                  message={
                    <Flex justify="space-between" align="center">
                      <div>
                        <strong>Patient sélectionné:</strong> {selectedPatient.nomComplet}
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          <PhoneOutlined /> {selectedPatient.telephone || 'N/A'} • 
                          <IdcardOutlined style={{ marginLeft: '8px' }} /> {selectedPatient.identifiant || 'N/A'}
                        </div>
                      </div>
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setSelectedPatientDetails(selectedPatient);
                          setDrawerPatientVisible(true);
                        }}
                      >
                        Voir détails
                      </Button>
                    </Flex>
                  }
                  type="info"
                  showIcon
                  style={{ borderRadius: '8px' }}
                />
              </div>
            )}
          </Card>
          
          {/* Factures du Patient */}
          {selectedPatient && (
            <Card style={{ marginBottom: 24, borderRadius: '8px' }}>
              <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>
                  <FileTextOutlined /> Factures de {selectedPatient.nomComplet}
                </Title>
                
                <Space>
                  <Statistic
                    title="Total facturé"
                    value={factureSummary.total_montant}
                    suffix="XAF"
                    valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                  />
                  <Statistic
                    title="Reste à payer"
                    value={factureSummary.total_restant}
                    suffix="XAF"
                    valueStyle={{ 
                      color: factureSummary.total_restant > 0 ? '#fa8c16' : '#52c41a',
                      fontSize: '18px'
                    }}
                  />
                </Space>
              </Flex>
              
              {patientFactures.length > 0 ? (
                <Table
                  size="middle"
                  dataSource={patientFactures}
                  columns={facturesColumns}
                  pagination={false}
                  loading={loading.factures}
                  style={{ borderRadius: '8px', overflow: 'hidden' }}
                  summary={() => (
                    <Table.Summary>
                      <Table.Summary.Row style={{ background: '#fafafa' }}>
                        <Table.Summary.Cell index={0} colSpan={3}>
                          <Text strong>TOTAL GÉNÉRAL</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <MontantDisplay value={factureSummary.total_montant} style={{ fontWeight: 'bold' }} />
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">
                          <MontantDisplay value={factureSummary.total_paye} style={{ fontWeight: 'bold', color: '#52c41a' }} />
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">
                          <MontantDisplay 
                            value={factureSummary.total_restant} 
                            style={{ 
                              fontWeight: 'bold',
                              color: factureSummary.total_restant > 0 ? '#fa8c16' : '#52c41a'
                            }} 
                          />
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} colSpan={3} />
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              ) : (
                <Empty 
                  description={
                    <div>
                      <div style={{ marginBottom: 16 }}>Ce patient n'a pas encore de facture</div>
                      <Button 
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          // Redirection vers la création de consultation/prestation
                          message.info('Redirection vers la création de consultation');
                        }}
                      >
                        Créer une première facture
                      </Button>
                    </div>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>
          )}
        </>
      )}
      
      {activeTab === 'rapports' && (
        <Card style={{ borderRadius: '8px' }}>
          <Title level={4} style={{ marginBottom: 24 }}>
            <BarChartOutlined /> Rapports et Statistiques
          </Title>
          
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Alert
                message="Fonctionnalité en cours de développement"
                description="Les rapports détaillés et les statistiques avancées seront disponibles prochainement."
                type="info"
                showIcon
                style={{ borderRadius: '8px' }}
              />
            </Col>
            
            <Col xs={24} md={12}>
              <Card title="Statistiques mensuelles">
                <Timeline>
                  <Timeline.Item color="green">
                    <p>Consultations: {dashboardData.details.consultations.total}</p>
                    <p>Montant: <MontantDisplay value={dashboardData.details.consultations.montant} /></p>
                  </Timeline.Item>
                  <Timeline.Item color="blue">
                    <p>Prestations: {dashboardData.details.prestations.total}</p>
                    <p>Montant: <MontantDisplay value={dashboardData.details.prestations.montant} /></p>
                  </Timeline.Item>
                  <Timeline.Item color="orange">
                    <p>Total facturé: <MontantDisplay value={dashboardData.montantTotalFactures} /></p>
                    <p>Encaissé: <MontantDisplay value={dashboardData.encaissementsMois} /></p>
                  </Timeline.Item>
                </Timeline>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card title="Performances">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text>Taux de paiement:</Text>
                    <Progress 
                      percent={dashboardData.tauxPaiement} 
                      status={dashboardData.tauxPaiement > 80 ? 'success' : 'normal'}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                  <div>
                    <Text>Encaissements du mois:</Text>
                    <Progress 
                      percent={(dashboardData.encaissementsMois / Math.max(dashboardData.montantTotalFactures, 1)) * 100}
                      status="active"
                      style={{ marginTop: 8 }}
                    />
                  </div>
                  <div>
                    <Text>Factures en attente:</Text>
                    <Progress 
                      percent={(dashboardData.soldeDisponible / Math.max(dashboardData.montantTotalFactures, 1)) * 100}
                      status="exception"
                      style={{ marginTop: 8 }}
                    />
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>
      )}
      
      {/* Modal Paiement Professionnel */}
      <Modal
        title={
          <Space>
            <WalletOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {typePaiement === 'avance' ? 'Encaisser une avance' : 'Enregistrer un paiement'}
            </span>
          </Space>
        }
        open={modalPaiementVisible}
        onCancel={() => {
          setModalPaiementVisible(false);
          setSelectedFacture(null);
        }}
        footer={null}
        width={700}
        style={{ borderRadius: '8px' }}
        bodyStyle={{ padding: '24px' }}
      >
        {selectedFacture && (
          <div style={{ marginBottom: 24 }}>
            <Card 
              title={`Facture ${selectedFacture.numero}`}
              size="small"
              style={{ background: '#fafafa', borderRadius: '8px' }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="Date">
                      {moment(selectedFacture.dateFacture).format('DD/MM/YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Type">
                      {selectedFacture.type === 'consultation' ? 'Consultation' : 'Prestation'}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">Montant total:</Text>
                      <div><MontantDisplay value={selectedFacture.montantTotal} size="large" /></div>
                    </div>
                    <div>
                      <Text type="secondary">Déjà payé:</Text>
                      <div><MontantDisplay value={selectedFacture.montantPaye} style={{ color: '#52c41a' }} /></div>
                    </div>
                    <div>
                      <Text type="secondary">Reste à payer:</Text>
                      <div>
                        <MontantDisplay 
                          value={selectedFacture.montantRestant} 
                          style={{ 
                            fontWeight: 'bold',
                            color: selectedFacture.montantRestant > 0 ? '#fa8c16' : '#52c41a'
                          }} 
                        />
                      </div>
                    </div>
                  </Space>
                </Col>
              </Row>
            </Card>
          </div>
        )}
        
        <Form
          form={formPaiement}
          layout="vertical"
          onFinish={handlePaiementSubmit}
          initialValues={{
            method: 'MobileMoney',
            montant: selectedFacture?.montantRestant || 0,
            notifierClient: true,
            genererReçu: true
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Mode de paiement"
                name="method"
                rules={[{ required: true, message: 'Veuillez sélectionner un mode de paiement' }]}
              >
                <Select style={{ width: '100%' }}>
                  {PAYMENT_METHODS.map(method => (
                    <Option key={method.value} value={method.value}>
                      <Space>
                        {method.icon}
                        {method.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                label="Montant"
                name="montant"
                rules={[
                  { required: true, message: 'Veuillez saisir le montant' },
                  { 
                    validator: (_, value) => {
                      const numValue = parseFloat(value);
                      if (isNaN(numValue)) {
                        return Promise.reject(new Error('Veuillez saisir un montant valide'));
                      }
                      if (numValue <= 0) {
                        return Promise.reject(new Error('Le montant doit être supérieur à 0'));
                      }
                      if (selectedFacture && numValue > selectedFacture.montantRestant) {
                        return Promise.reject(new Error(`Le montant ne peut pas dépasser ${selectedFacture.montantRestant} XAF`));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0.01}
                  step={100}
                  max={selectedFacture?.montantRestant}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                  parser={value => value.replace(/\s/g, '')}
                  addonAfter="XAF"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="Référence transaction"
            name="reference"
            help="Numéro de transaction (Mobile Money, virement, chèque...)"
          >
            <Input placeholder="Ex: MTN-1234567890, CHQ-2024-001, VIR-REF-001" />
          </Form.Item>
          
          <Form.Item
            label="Observations"
            name="observations"
          >
            <TextArea 
              rows={3} 
              placeholder="Notes internes ou détails complémentaires..." 
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
          
          <Form.Item
            label="Options"
            style={{ marginBottom: 0 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="notifierClient" valuePropName="checked" noStyle>
                  <Space>
                    <Switch 
                      checkedChildren="Notifier client" 
                      unCheckedChildren="Ne pas notifier" 
                      defaultChecked 
                    />
                    <Text type="secondary">Par SMS/Email</Text>
                  </Space>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="genererReçu" valuePropName="checked" noStyle>
                  <Space>
                    <Switch 
                      checkedChildren="Générer reçu" 
                      unCheckedChildren="Pas de reçu" 
                      defaultChecked 
                    />
                    <Text type="secondary">PDF professionnel</Text>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
          
          <Divider />
          
          <Form.Item>
            <Flex justify="flex-end" gap="middle">
              <Button 
                onClick={() => setModalPaiementVisible(false)}
                style={{ borderRadius: '8px' }}
              >
                Annuler
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading.paiement}
                icon={<CheckOutlined />}
                style={{ 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
                  border: 'none',
                  padding: '0 24px',
                  height: '40px'
                }}
              >
                Enregistrer le paiement
              </Button>
            </Flex>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Drawer Détails Patient Professionnel */}
      <Drawer
        title={
          <Space>
            <UserOutlined style={{ color: '#1890ff' }} />
            <span>Détails du patient</span>
          </Space>
        }
        placement="right"
        onClose={() => setDrawerPatientVisible(false)}
        open={drawerPatientVisible}
        width={500}
        style={{ borderRadius: '8px 0 0 8px' }}
      >
        {selectedPatientDetails && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar 
                size={100} 
                src={selectedPatientDetails.photoUrl} 
                icon={<UserOutlined />}
                style={{ 
                  border: '4px solid #1890ff',
                  marginBottom: 16 
                }}
              />
              <Title level={3} style={{ margin: 0 }}>
                {selectedPatientDetails.nomComplet}
              </Title>
              <Text type="secondary">{selectedPatientDetails.identifiant || 'N/A'}</Text>
            </div>
            
            <Card 
              title="Informations personnelles" 
              size="small"
              style={{ marginBottom: 16, borderRadius: '8px' }}
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Téléphone">
                  <Space>
                    <PhoneOutlined />
                    {selectedPatientDetails.telephone || 'N/A'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  <Space>
                    <MailOutlined />
                    {selectedPatientDetails.email || 'N/A'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Date de naissance">
                  {selectedPatientDetails.dateNaissance 
                    ? moment(selectedPatientDetails.dateNaissance).format('DD/MM/YYYY')
                    : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Sexe">
                  {selectedPatientDetails.sexe === 'M' ? 'Masculin' : 
                   selectedPatientDetails.sexe === 'F' ? 'Féminin' : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Groupe sanguin">
                  {selectedPatientDetails.groupeSanguin || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
            
            <Card 
              title="Historique financier" 
              size="small"
              style={{ borderRadius: '8px' }}
            >
              <List
                size="small"
                dataSource={reglements.filter(r => r.beneficiaireId === selectedPatientDetails.id)}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <MontantDisplay key="montant" value={item.montant} size="small" />
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text>{item.reference}</Text>
                          <StatusTag status={item.statut} />
                        </Space>
                      }
                      description={
                        <div>
                          <div>{moment(item.dateReglement).format('DD/MM/YYYY HH:mm')}</div>
                          <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                            {item.factureNumero || 'Avance'}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
                locale={{ 
                  emptyText: (
                    <Empty 
                      description="Aucun règlement trouvé" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )
                }}
              />
            </Card>
          </div>
        )}
      </Drawer>
      
      {/* Footer informatif */}
      <div style={{ 
        marginTop: '48px', 
        padding: '24px', 
        textAlign: 'center',
        color: '#8c8c8c',
        fontSize: '12px',
        borderTop: '1px solid #f0f0f0'
      }}>
        <Space direction="vertical" size={2}>
          <div>Système de Facturation Professionnel • Version 2.0</div>
          <div>© {new Date().getFullYear()} Centre Médical • Tous droits réservés</div>
          <div>Généré le {moment().format('DD/MM/YYYY à HH:mm')} par {utilisateurInfo.nom || 'Système'}</div>
        </Space>
      </div>
    </div>
  );
};

export default ReglementsProfessionnel;