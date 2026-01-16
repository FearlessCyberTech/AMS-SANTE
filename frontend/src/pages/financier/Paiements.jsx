import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Card, Row, Col, Statistic, Button, Modal, Form,
  Select, Input, DatePicker, Tag, Space, message, Tabs,
  Descriptions, Tooltip, Popconfirm, Spin, Upload,
  Alert, Divider, Badge, Typography, Empty
} from 'antd';
import {
  DollarOutlined, TransactionOutlined, HistoryOutlined,
  FileTextOutlined, CheckCircleOutlined, SyncOutlined,
  DownloadOutlined, EyeOutlined, ExclamationCircleOutlined,
  LoadingOutlined, UserOutlined, BankOutlined,
  PieChartOutlined, BarChartOutlined, UploadOutlined,
  WarningOutlined, InfoCircleOutlined, ClockCircleOutlined,
  FileSearchOutlined, CloseCircleOutlined, SearchOutlined,
  PlusOutlined, LineChartOutlined, AreaChartOutlined,
  RiseOutlined, FallOutlined
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import moment from 'moment';
import 'moment/locale/fr';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { financesAPI, facturationAPI } from '../../services/api';

// Enregistrement de ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const Paiement = () => {
  // États principaux
  const [transactions, setTransactions] = useState([]);
  const [litiges, setLitiges] = useState([]);
  const [loading, setLoading] = useState({
    transactions: false,
    dashboard: false,
    litige: false,
    factureDetails: false,
    litiges: false,
    statistiques: false
  });

  // Données du dashboard
  const [dashboardData, setDashboardData] = useState({
    totalTransactions: 0,
    successRate: 0,
    totalAmount: 0,
    retards: 0,
    montantMensuel: 0,
    transactionsMensuelles: 0
  });

  // Statistiques des litiges
  const [litigeStats, setLitigeStats] = useState({
    total: 0,
    ouverts: 0,
    en_cours: 0,
    resolus: 0
  });

  // Modales
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [litigeModal, setLitigeModal] = useState(false);
  const [selectedLitige, setSelectedLitige] = useState(null);
  const [litigeDetailsModal, setLitigeDetailsModal] = useState(false);
  const [selectedLitigeForDetails, setSelectedLitigeForDetails] = useState(null);
  const [resoudreLitigeModal, setResoudreLitigeModal] = useState(false);

  // Filtres
  const [filtres, setFiltres] = useState({
    dateDebut: moment().subtract(30, 'days'),
    dateFin: moment(),
    statut: 'tous',
    type: 'tous'
  });

  // Formulaires
  const [litigeForm] = Form.useForm();
  const [resoudreLitigeForm] = Form.useForm();

  // ==================== CHARGEMENT DES DONNÉES ====================

  const loadDashboardData = useCallback(async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      const data = await financesAPI.getDashboard('mois');
      
      if (data.success && data.dashboard) {
        const dashboard = data.dashboard;
        
        // Adapter la structure aux nouvelles données d'API
        const resumeTransactions = dashboard.resume?.transactions || dashboard.resume?.transactions_mensuelles;
        
        setDashboardData({
          totalTransactions: resumeTransactions?.total_mois || dashboard.totalTransactions || 0,
          successRate: dashboard.indicateurs?.taux_reussite || dashboard.successRate || 0,
          totalAmount: resumeTransactions?.montant_total_mois || dashboard.totalAmount || 0,
          retards: dashboard.resume?.declarations_en_attente || dashboard.retards || 0,
          montantMensuel: resumeTransactions?.montant_total_mois || dashboard.montantMensuel || 0,
          transactionsMensuelles: resumeTransactions?.total_mois || dashboard.transactionsMensuelles || 0
        });

        // Mettre à jour les stats de litiges si disponibles
        if (dashboard.litiges || dashboard.litigeStats) {
          const litigesData = dashboard.litiges || dashboard.litigeStats;
          setLitigeStats({
            total: litigesData.total || 0,
            ouverts: litigesData.ouverts || 0,
            en_cours: litigesData.en_cours || 0,
            resolus: litigesData.resolus || 0
          });
        }
      }
    } catch (error) {
      console.error('❌ Erreur dashboard:', error);
      message.error('Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(prev => ({ ...prev, transactions: true }));
    try {
      const params = {
        page: 1,
        limit: 50,
        date_debut: filtres.dateDebut.format('YYYY-MM-DD'),
        date_fin: filtres.dateFin.format('YYYY-MM-DD'),
        ...(filtres.statut !== 'tous' && { status: filtres.statut }),
        ...(filtres.type !== 'tous' && { type: filtres.type })
      };
      
      const data = await financesAPI.getTransactions(params);
      
      if (data.success) {
        // Formatage des transactions pour l'affichage
        const formattedTransactions = (data.transactions || []).map((t, index) => {
          // S'assurer que nous avons un identifiant unique
          const id = t.id || t.COD_TRANS || t.COD_TRANSACTION || `trans-${index}`;
          
          return {
            key: id,
            COD_TRANS: id,
            COD_TRANSACTION: id,
            REFERENCE_TRANSACTION: t.REFERENCE_TRANSACTION || t.reference || t.reference_transaction || `TRANS-${id}`,
            TYPE_TRANSACTION: t.TYPE_TRANSACTION || t.type_transaction || t.type || 'Transaction',
            DATE_INITIATION: t.DATE_INITIATION || t.date_initiation || t.date_transaction || t.created_at,
            DATE_EXECUTION: t.DATE_EXECUTION || t.date_execution || t.date_execution || t.updated_at,
            MONTANT: parseFloat(t.MONTANT || t.montant || t.amount || 0),
            DEVISE: t.DEVISE || t.devise || 'XAF',
            METHODE_PAIEMENT: t.METHODE_PAIEMENT || t.methode_paiement || t.payment_method || 'Non spécifiée',
            STATUT_TRANSACTION: t.STATUT_TRANSACTION || t.statut_transaction || t.status || 'Inconnu',
            REFERENCE_BANQUE: t.REFERENCE_BANQUE || t.reference_banque || t.bank_reference,
            COD_DECL: t.COD_DECL || t.cod_decl || t.declaration_id,
            COD_BEN: t.COD_BEN || t.cod_ben || t.beneficiary_id,
            COD_PRE: t.COD_PRE || t.cod_pre || t.prestation_id,
            BENEFICIAIRE: t.beneficiaire?.nom || t.BENEFICIAIRE_NOM || t.BENEFICIAIRE || 
                         t.beneficiary_name || t.nom_beneficiaire || 'N/A',
            NUMERO_FACTURE: t.details?.numero_declaration || t.NUMERO_DECLARATION || 
                          t.declaration_number || t.facture_number,
            COD_FACTURE: t.COD_DECL || t.cod_decl || t.declaration_id,
            PAYEUR: t.PAYEUR || t.payeur || t.payer,
            NOTES: t.NOTES || t.notes || t.commentaires
          };
        });
        
        setTransactions(formattedTransactions);
      } else {
        message.error(data.message || 'Erreur lors du chargement des transactions');
      }
    } catch (error) {
      console.error('Erreur transactions:', error);
      message.error('Erreur lors du chargement des transactions');
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  }, [filtres]);

  const loadLitiges = useCallback(async (statut = 'all') => {
    setLoading(prev => ({ ...prev, litiges: true }));
    try {
      const params = { 
        statut: statut !== 'all' ? statut : undefined,
        limit: 20 
      };
      
      const data = await facturationAPI.getLitiges(params);
      
      if (data.success) {
        const formattedLitiges = (data.litiges || []).map((l, index) => ({
          key: l.COD_LITIGE || l.id || `litige-${index}`,
          COD_LITIGE: l.COD_LITIGE || l.id,
          COD_TRANS: l.COD_TRANS || l.transaction_id,
          COD_FACTURE: l.COD_DECL || l.declaration_id || l.facture_id,
          TYPE_LITIGE: l.TYPE_LITIGE || l.type_litige || l.type,
          DESCRIPTION: l.DESCRIPTION || l.description,
          ACTION: l.ACTION || l.action || l.action_requise,
          STATUT: l.STATUT || l.statut,
          DATE_OUVERTURE: l.DATE_OUVERTURE || l.date_ouverture || l.created_at,
          DATE_RESOLUTION: l.DATE_RESOLUTION || l.date_resolution || l.resolved_at,
          RESOLUTION: l.RESOLUTION || l.resolution,
          COD_CREUTIL: l.COD_CREUTIL || l.created_by || l.utilisateur_id,
          DAT_CREUTIL: l.DAT_CREUTIL || l.date_creation || l.created_at,
          NUMERO_FACTURE: l.REFERENCE_PAIEMENT || l.numero_facture || l.declaration_number,
          NOM_BEN: l.NOM_BEN || l.nom_beneficiaire || l.beneficiary_last_name,
          PRE_BEN: l.PRE_BEN || l.prenom_beneficiaire || l.beneficiary_first_name,
          REFERENCE_TRANSACTION: l.REFERENCE_TRANSACTION || l.reference_transaction,
          MONTANT: l.MONTANT || l.montant,
          PRIORITE: l.PRIORITE || l.priorite,
          UTILISATEUR_RESOLUTION: l.UTILISATEUR_RESOLUTION || l.resolved_by
        }));
        
        setLitiges(formattedLitiges);
        
        // Mettre à jour les statistiques
        if (data.statistiques) {
          setLitigeStats({
            total: data.statistiques.total || 0,
            ouverts: data.statistiques.ouverts || 0,
            en_cours: data.statistiques.en_cours || 0,
            resolus: data.statistiques.resolus || 0
          });
        } else {
          // Calculer localement
          const total = formattedLitiges.length;
          const ouverts = formattedLitiges.filter(l => l.STATUT === 'Ouvert' || l.STATUT === 'ouvert').length;
          const en_cours = formattedLitiges.filter(l => 
            l.STATUT === 'En cours' || l.STATUT === 'en_cours' || l.STATUT === 'en traitement'
          ).length;
          const resolus = formattedLitiges.filter(l => 
            l.STATUT === 'Resolu' || l.STATUT === 'resolu' || l.STATUT === 'Ferme' || l.STATUT === 'ferme'
          ).length;
          
          setLitigeStats({ total, ouverts, en_cours, resolus });
        }
      } else {
        message.error(data.message || 'Erreur lors du chargement des litiges');
      }
    } catch (error) {
      console.error('❌ Erreur chargement litiges:', error);
      message.error('Erreur lors du chargement des litiges');
    } finally {
      setLoading(prev => ({ ...prev, litiges: false }));
    }
  }, []);

  const loadFactureDetails = useCallback(async (factureId) => {
    if (!factureId || factureId.toString().trim() === '') {
      message.warning('ID de déclaration requis');
      return;
    }
    
    setLoading(prev => ({ ...prev, factureDetails: true }));
    try {
      console.log(`🔍 Recherche déclaration: ${factureId}`);
      const response = await financesAPI.getDeclaration(factureId);
      
      if (response.success && response.facture) {
        const facture = response.facture;
        
        // Formater les données selon la nouvelle structure d'API
        const factureDetails = {
          id: facture.id || facture.COD_FACTURE || facture.COD_DECL,
          numero: facture.numero || facture.NUMERO_FACTURE || facture.numero_declaration,
          montant_total: parseFloat(facture.montant_total || facture.MONTANT_TOTAL || 0),
          montant_restant: parseFloat(facture.montant_restant || facture.MONTANT_REMBOURSABLE || facture.montant_du || 0),
          date_facture: facture.date_facture || facture.DATE_FACTURE || facture.date_creation,
          beneficiaire_nom: facture.beneficiaire_nom || 
            `${facture.NOM_BEN || facture.nom || ''} ${facture.PRE_BEN || facture.prenom || ''}`.trim(),
          etat: facture.etat || facture.ETAT_FACTURE || facture.statut,
          cod_ben: facture.cod_ben || facture.COD_BEN,
          cod_patient: facture.cod_patient || facture.patient_id,
          nom_patient: facture.nom_patient,
          prenom_patient: facture.prenom_patient,
          telephone: facture.telephone,
          email: facture.email
        };
        
        // Mettre à jour le formulaire
        litigeForm.setFieldsValue({
          COD_FACTURE: factureDetails.id.toString(),
          COD_BEN: factureDetails.cod_ben,
          BENEFICIAIRE: factureDetails.beneficiaire_nom
        });
        
        message.success('Déclaration trouvée et chargée avec succès');
      } else {
        message.warning(response.message || 'Déclaration non trouvée');
      }
    } catch (error) {
      console.error(`❌ Erreur chargement déclaration:`, error);
      message.error('Erreur lors de la recherche de la déclaration');
    } finally {
      setLoading(prev => ({ ...prev, factureDetails: false }));
    }
  }, [litigeForm]);

  // ==================== GESTION DES FILTRES ====================

  const handleFiltreChange = (key, value) => {
    setFiltres(prev => ({ ...prev, [key]: value }));
  };

  const applyFiltres = () => {
    loadTransactions();
  };

  const resetFiltres = () => {
    setFiltres({
      dateDebut: moment().subtract(30, 'days'),
      dateFin: moment(),
      statut: 'tous',
      type: 'tous'
    });
  };

  // ==================== GESTION DES LITIGES ====================

  const ouvrirLitige = (transaction = null) => {
    setSelectedLitige(transaction);
    setLitigeModal(true);
    
    litigeForm.resetFields();
    
    if (transaction) {
      const formValues = {
        TYPE_LITIGE: 'Problème technique',
        ACTION: 'À traiter',
        COD_TRANS: transaction.COD_TRANS || transaction.REFERENCE_TRANSACTION || ''
      };
      
      // Si la transaction a une déclaration associée
      if (transaction.COD_DECL || transaction.COD_FACTURE) {
        formValues.COD_FACTURE = (transaction.COD_DECL || transaction.COD_FACTURE).toString();
      }
      
      litigeForm.setFieldsValue(formValues);
    }
  };

  const handleLitigeSubmit = async (values) => {
    setLoading(prev => ({ ...prev, litige: true }));
    
    try {
      // Préparer les données pour l'API
      const litigeData = {
        TYPE_LITIGE: values.TYPE_LITIGE,
        DESCRIPTION: values.DESCRIPTION,
        ACTION: values.ACTION,
        STATUT: 'Ouvert'
      };
      
      // Ajouter COD_TRANS si fourni
      if (values.COD_TRANS && values.COD_TRANS.trim() !== '') {
        const codTrans = parseInt(values.COD_TRANS, 10);
        if (!isNaN(codTrans) && codTrans > 0) {
          litigeData.COD_TRANS = codTrans;
        }
      }
      
      // Ajouter COD_DECL si fourni
      if (values.COD_FACTURE && values.COD_FACTURE.toString().trim() !== '') {
        const codDecl = parseInt(values.COD_FACTURE, 10);
        if (!isNaN(codDecl) && codDecl > 0) {
          litigeData.COD_DECL = codDecl;
        }
      }
      
      // Ajouter COD_BEN si fourni
      if (values.COD_BEN && values.COD_BEN.trim() !== '') {
        const codBen = parseInt(values.COD_BEN, 10);
        if (!isNaN(codBen) && codBen > 0) {
          litigeData.COD_BEN = codBen;
        }
      }
      
      console.log('📤 Envoi litige:', litigeData);
      
      const response = await facturationAPI.createLitige(litigeData);
      
      if (response.success) {
        message.success(`Réclamation créée avec succès (ID: ${response.litigeId || response.id})`);
        setLitigeModal(false);
        litigeForm.resetFields();
        
        // Recharger les litiges
        loadLitiges();
      } else {
        message.error(response.message || 'Erreur lors de la création de la réclamation');
      }
    } catch (error) {
      console.error('❌ Erreur création litige:', error);
      message.error(error.message || 'Erreur lors de la création de la réclamation');
    } finally {
      setLoading(prev => ({ ...prev, litige: false }));
    }
  };

  const resoudreLitige = async (values) => {
    setLoading(prev => ({ ...prev, litige: true }));
    
    try {
      const litigeId = selectedLitigeForDetails?.COD_LITIGE;
      
      if (!litigeId) {
        message.error('ID réclamation manquant');
        return;
      }

      const resolutionData = {
        STATUT: values.STATUT,
        RESOLUTION: values.RESOLUTION,
        ACTION: values.ACTION,
        DESCRIPTION: values.DESCRIPTION,
        UTILISATEUR_RESOLUTION: 'Admin'
      };
      
      // Ajouter la date de résolution si spécifiée
      if (values.DATE_RESOLUTION) {
        resolutionData.DATE_RESOLUTION = values.DATE_RESOLUTION.format('YYYY-MM-DD HH:mm:ss');
      }

      const response = await facturationAPI.updateLitige(litigeId, resolutionData);
      
      if (response.success) {
        message.success('Réclamation mise à jour avec succès');
        setResoudreLitigeModal(false);
        setLitigeDetailsModal(false);
        resoudreLitigeForm.resetFields();
        
        // Recharger les données
        loadLitiges();
      } else {
        message.error(response.message || 'Erreur lors de la mise à jour de la réclamation');
      }
    } catch (error) {
      console.error('❌ Erreur résolution litige:', error);
      message.error(`Erreur lors de la mise à jour de la réclamation: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, litige: false }));
    }
  };

  const fermerLitige = async (litigeId) => {
    try {
      const response = await facturationAPI.updateLitige(litigeId, {
        STATUT: 'Ferme',
        RESOLUTION: 'Fermé par l\'utilisateur'
      });
      
      if (response.success) {
        message.success('Réclamation fermée avec succès');
        loadLitiges();
      } else {
        message.error('Erreur lors de la fermeture de la réclamation');
      }
    } catch (error) {
      console.error('❌ Erreur fermeture litige:', error);
      message.error('Erreur lors de la fermeture de la réclamation');
    }
  };

  // ==================== AUTRES FONCTIONS ====================

  const showTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const exporterTransactions = async () => {
    try {
      const data = await financesAPI.exportData('transactions', {
        date_debut: filtres.dateDebut.format('YYYY-MM-DD'),
        date_fin: filtres.dateFin.format('YYYY-MM-DD'),
        statut: filtres.statut !== 'tous' ? filtres.statut : undefined,
        type: filtres.type !== 'tous' ? filtres.type : undefined
      });
      
      if (data.success && data.data && data.data.length > 0) {
        // Convertir en CSV
        const csv = convertToCSV(data.data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.fileName || 'transactions.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        message.success(`Export réussi (${data.count || data.data.length} transactions)`);
      } else {
        message.warning('Aucune donnée à exporter');
      }
    } catch (error) {
      console.error('Erreur export:', error);
      message.error('Erreur lors de l\'export');
    }
  };

  // Fonction utilitaire pour convertir en CSV
  const convertToCSV = (objArray) => {
    if (objArray.length === 0) return '';
    
    const keys = Object.keys(objArray[0]);
    const header = keys.join(';');
    
    const rows = objArray.map(obj => {
      return keys.map(key => {
        let cell = obj[key] === null || obj[key] === undefined ? '' : obj[key];
        if (typeof cell === 'object') {
          cell = JSON.stringify(cell);
        }
        // Échapper les guillemets et points-virgules
        cell = cell.toString().replace(/"/g, '""').replace(/;/g, ',');
        return `"${cell}"`;
      }).join(';');
    });
    
    return [header, ...rows].join('\n');
  };

  // ==================== CONFIGURATION UPLOAD ====================

  const uploadProps = {
    name: 'file',
    multiple: true,
    maxCount: 3,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      const isLt5M = file.size / 1024 / 1024 < 5;
      
      if (!isImage && !isPDF) {
        message.error('Vous ne pouvez télécharger que des images ou des PDF!');
        return false;
      }
      
      if (!isLt5M) {
        message.error('Le fichier doit être inférieur à 5MB!');
        return false;
      }
      
      return false;
    },
  };

  // ==================== CONFIGURATION DES TABLES ====================

  const transactionColumns = [
    {
      title: 'Référence',
      dataIndex: 'REFERENCE_TRANSACTION',
      key: 'REFERENCE_TRANSACTION',
      width: 150,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Type',
      dataIndex: 'TYPE_TRANSACTION',
      key: 'TYPE_TRANSACTION',
      width: 120,
      render: (type) => {
        const types = {
          'Remboursement': { color: 'green', text: 'Remboursement' },
          'PaiementPrestataire': { color: 'blue', text: 'Paiement Prest.' },
          'PaiementFacture': { color: 'purple', text: 'Paiement Facture' },
          'paiement': { color: 'blue', text: 'Paiement' },
          'remboursement': { color: 'green', text: 'Remboursement' }
        };
        const config = types[type] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Bénéficiaire',
      dataIndex: 'BENEFICIAIRE',
      key: 'BENEFICIAIRE',
      width: 150,
    },
    {
      title: 'Montant (XAF)',
      dataIndex: 'MONTANT',
      key: 'MONTANT',
      width: 120,
      render: (montant) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {parseFloat(montant || 0).toLocaleString('fr-FR')}
        </span>
      ),
      align: 'right',
    },
    {
      title: 'Méthode',
      dataIndex: 'METHODE_PAIEMENT',
      key: 'METHODE_PAIEMENT',
      width: 120,
      render: (method) => {
        const methods = {
          'MobileMoney': { color: 'green', text: 'Mobile Money' },
          'CarteBancaire': { color: 'blue', text: 'Carte Bancaire' },
          'Virement': { color: 'orange', text: 'Virement' },
          'Espèces': { color: 'cyan', text: 'Espèces' },
          'mobile_money': { color: 'green', text: 'Mobile Money' },
          'carte': { color: 'blue', text: 'Carte Bancaire' },
          'virement': { color: 'orange', text: 'Virement' }
        };
        const config = methods[method] || { color: 'default', text: method };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Statut',
      dataIndex: 'STATUT_TRANSACTION',
      key: 'STATUT_TRANSACTION',
      width: 120,
      render: (status) => {
        const statuses = {
          'Reussi': { color: 'success', icon: <CheckCircleOutlined />, text: 'Réussi' },
          'Echoue': { color: 'error', icon: <ExclamationCircleOutlined />, text: 'Échec' },
          'En cours': { color: 'processing', icon: <SyncOutlined spin />, text: 'En cours' },
          'Initie': { color: 'warning', icon: <LoadingOutlined />, text: 'Initié' },
          'reussi': { color: 'success', icon: <CheckCircleOutlined />, text: 'Réussi' },
          'echoue': { color: 'error', icon: <ExclamationCircleOutlined />, text: 'Échec' },
          'en_cours': { color: 'processing', icon: <SyncOutlined spin />, text: 'En cours' },
          'initie': { color: 'warning', icon: <LoadingOutlined />, text: 'Initié' }
        };
        const config = statuses[status] || { color: 'default', text: status };
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Date',
      dataIndex: 'DATE_INITIATION',
      key: 'DATE_INITIATION',
      width: 150,
      render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      title: 'Déclaration',
      dataIndex: 'NUMERO_FACTURE',
      key: 'NUMERO_FACTURE',
      width: 120,
      render: (numero) => numero ? <Tag color="blue">{numero}</Tag> : <Tag color="red">N/A</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir détails">
            <Button
              icon={<EyeOutlined />}
              onClick={() => showTransactionDetails(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Signaler un litige">
            <Button
              type="link"
              danger
              size="small"
              onClick={() => ouvrirLitige(record)}
            >
              <WarningOutlined /> Réclamation
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const litigeColumns = [
    {
      title: 'ID Litige',
      dataIndex: 'COD_LITIGE',
      key: 'COD_LITIGE',
      width: 100,
      render: (id) => <Tag color="orange">LIT-{id}</Tag>
    },
    {
      title: 'Réf. Transaction',
      dataIndex: 'COD_TRANS',
      key: 'COD_TRANS',
      width: 150,
      render: (cod) => cod ? <Tag color="blue">{cod}</Tag> : <Tag color="default">N/A</Tag>
    },
    {
      title: 'Type',
      dataIndex: 'TYPE_LITIGE',
      key: 'TYPE_LITIGE',
      width: 150,
      render: (type) => {
        const types = {
          'Montant incorrect': { color: 'red', icon: <DollarOutlined /> },
          'Bénéficiaire erroné': { color: 'orange', icon: <UserOutlined /> },
          'Double paiement': { color: 'purple', icon: <TransactionOutlined /> },
          'Problème technique': { color: 'cyan', icon: <ExclamationCircleOutlined /> },
          'Retard de paiement': { color: 'gold', icon: <ClockCircleOutlined /> },
          'Service non fourni': { color: 'volcano', icon: <WarningOutlined /> }
        };
        const config = types[type] || { color: 'default', icon: <FileTextOutlined /> };
        return (
          <Tag color={config.color} icon={config.icon}>
            {type}
          </Tag>
        );
      }
    },
    {
      title: 'Action Requise',
      dataIndex: 'ACTION',
      key: 'ACTION',
      width: 150,
      render: (action) => <Tag color="blue">{action}</Tag>
    },
    {
      title: 'Statut',
      dataIndex: 'STATUT',
      key: 'STATUT',
      width: 120,
      render: (statut) => {
        const statusConfig = {
          'Ouvert': { color: 'red', icon: <ExclamationCircleOutlined />, text: 'Ouvert' },
          'En cours': { color: 'orange', icon: <ClockCircleOutlined />, text: 'En cours' },
          'Resolu': { color: 'green', icon: <CheckCircleOutlined />, text: 'Résolu' },
          'Ferme': { color: 'default', icon: <CloseCircleOutlined />, text: 'Fermé' },
          'ouvert': { color: 'red', icon: <ExclamationCircleOutlined />, text: 'Ouvert' },
          'en_cours': { color: 'orange', icon: <ClockCircleOutlined />, text: 'En cours' },
          'resolu': { color: 'green', icon: <CheckCircleOutlined />, text: 'Résolu' },
          'ferme': { color: 'default', icon: <CloseCircleOutlined />, text: 'Fermé' }
        };
        const config = statusConfig[statut] || { color: 'default', icon: <InfoCircleOutlined />, text: statut };
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: 'Date Ouverture',
      dataIndex: 'DATE_OUVERTURE',
      key: 'DATE_OUVERTURE',
      width: 150,
      render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm') : '-'
    },
    {
      title: 'Déclaration',
      dataIndex: 'NUMERO_FACTURE',
      key: 'NUMERO_FACTURE',
      width: 120,
      render: (numero) => numero ? <Tag color="green">{numero}</Tag> : <Tag color="default">N/A</Tag>
    },
    {
      title: 'Bénéficiaire',
      key: 'BENEFICIAIRE',
      width: 150,
      render: (_, record) => `${record.NOM_BEN || ''} ${record.PRE_BEN || ''}`.trim() || 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir détails">
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedLitigeForDetails(record);
                setLitigeDetailsModal(true);
              }}
              size="small"
            />
          </Tooltip>
          {record.STATUT !== 'Resolu' && record.STATUT !== 'Ferme' && 
           record.STATUT !== 'resolu' && record.STATUT !== 'ferme' && (
            <Tooltip title="Résoudre">
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  setSelectedLitigeForDetails(record);
                  resoudreLitigeForm.setFieldsValue({
                    STATUT: 'Resolu',
                    ACTION: record.ACTION,
                    DESCRIPTION: record.DESCRIPTION
                  });
                  setResoudreLitigeModal(true);
                }}
              >
                Résoudre
              </Button>
            </Tooltip>
          )}
          {(record.STATUT === 'Ouvert' || record.STATUT === 'ouvert') && (
            <Tooltip title="Fermer">
              <Popconfirm
                title="Fermer cette réclamation sans résolution ?"
                onConfirm={() => fermerLitige(record.COD_LITIGE)}
                okText="Oui"
                cancelText="Non"
              >
                <Button danger size="small">
                  Fermer
                </Button>
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  // ==================== RENDU DES GRAPHIQUES ====================

  const renderStatistiques = () => {
    // Calculer les statistiques des transactions
    const statsTransactions = {
      reussies: transactions.filter(t => 
        t.STATUT_TRANSACTION === 'Reussi' || t.STATUT_TRANSACTION === 'reussi'
      ).length,
      echecs: transactions.filter(t => 
        t.STATUT_TRANSACTION === 'Echoue' || t.STATUT_TRANSACTION === 'echoue'
      ).length,
      enCours: transactions.filter(t => 
        t.STATUT_TRANSACTION === 'En cours' || t.STATUT_TRANSACTION === 'en_cours'
      ).length,
      totalMontant: transactions.reduce((sum, t) => sum + (t.MONTANT || 0), 0)
    };

    // Données pour le graphique des statuts
    const dataStatuts = {
      labels: ['Réussies', 'Échecs', 'En cours'],
      datasets: [{
        data: [statsTransactions.reussies, statsTransactions.echecs, statsTransactions.enCours],
        backgroundColor: ['#52c41a', '#f5222d', '#faad14'],
        borderColor: ['#52c41a', '#f5222d', '#faad14'],
        borderWidth: 1
      }]
    };

    // Données pour le graphique des types de litiges
    const typesLitiges = {};
    litiges.forEach(litige => {
      const type = litige.TYPE_LITIGE || 'Autre';
      typesLitiges[type] = (typesLitiges[type] || 0) + 1;
    });

    const dataTypesLitiges = {
      labels: Object.keys(typesLitiges),
      datasets: [{
        data: Object.values(typesLitiges),
        backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'],
        borderWidth: 1
      }]
    };

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <PieChartOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                <span>Statut des Transactions</span>
              </div>
            }
            size="small"
          >
            <div style={{ height: 300, position: 'relative' }}>
              {transactions.length > 0 ? (
                <Doughnut 
                  data={dataStatuts}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          font: { size: 11 }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <Empty description="Aucune donnée disponible" />
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <BarChartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                <span>Types de Réclamations</span>
              </div>
            }
            size="small"
          >
            <div style={{ height: 300, position: 'relative' }}>
              {litiges.length > 0 ? (
                <Pie 
                  data={dataTypesLitiges}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          font: { size: 11 }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <Empty description="Aucune donnée disponible" />
              )}
            </div>
          </Card>
        </Col>

        {/* Indicateurs clés */}
        <Col xs={24}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Total Transactions"
                  value={statsTransactions.reussies + statsTransactions.echecs + statsTransactions.enCours}
                  prefix={<TransactionOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Montant Total"
                  value={statsTransactions.totalMontant}
                  suffix="XAF"
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                  formatter={(value) => `${parseFloat(value).toLocaleString('fr-FR')}`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Taux de Réussite"
                  value={transactions.length > 0 ? Math.round((statsTransactions.reussies / transactions.length) * 100) : 0}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Réclamations Ouvertes"
                  value={litigeStats.ouverts}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    );
  };

  // ==================== RENDU PRINCIPAL ====================

  const tabItems = [
    {
      key: 'transactions',
      label: (
        <span>
          <TransactionOutlined />
          Transactions
        </span>
      ),
      children: (
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col>
                <span style={{ marginRight: 8 }}>Période:</span>
                <DatePicker.RangePicker
                  value={[filtres.dateDebut, filtres.dateFin]}
                  onChange={(dates) => {
                    if (dates) {
                      handleFiltreChange('dateDebut', dates[0]);
                      handleFiltreChange('dateFin', dates[1]);
                    }
                  }}
                  style={{ marginRight: 16 }}
                />
              </Col>
              <Col>
                <Select
                  value={filtres.statut}
                  onChange={(value) => handleFiltreChange('statut', value)}
                  style={{ width: 150, marginRight: 16 }}
                  placeholder="Statut"
                >
                  <Option value="tous">Tous les statuts</Option>
                  <Option value="Reussi">Réussi</Option>
                  <Option value="Echoue">Échec</Option>
                  <Option value="En cours">En cours</Option>
                  <Option value="reussi">Réussi (API)</Option>
                  <Option value="echoue">Échec (API)</Option>
                  <Option value="en_cours">En cours (API)</Option>
                </Select>
              </Col>
              <Col>
                <Select
                  value={filtres.type}
                  onChange={(value) => handleFiltreChange('type', value)}
                  style={{ width: 150, marginRight: 16 }}
                  placeholder="Type"
                >
                  <Option value="tous">Tous les types</Option>
                  <Option value="Remboursement">Remboursement</Option>
                  <Option value="PaiementPrestataire">Paiement Prestataire</Option>
                  <Option value="remboursement">Remboursement (API)</Option>
                  <Option value="paiement">Paiement (API)</Option>
                </Select>
              </Col>
              <Col>
                <Button
                  type="primary"
                  onClick={applyFiltres}
                  style={{ marginRight: 8 }}
                >
                  Appliquer
                </Button>
                <Button onClick={resetFiltres}>
                  Réinitialiser
                </Button>
              </Col>
            </Row>
          </div>
          
          <Space style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={exporterTransactions}
            >
              Exporter
            </Button>
            <Button
              icon={<SyncOutlined />}
              onClick={loadTransactions}
              loading={loading.transactions}
            >
              Actualiser
            </Button>
            <Button
              type="link"
              onClick={() => message.info('Cliquez sur "Exporter" pour télécharger les transactions')}
            >
              <InfoCircleOutlined /> Aide
            </Button>
          </Space>

          <Table
            columns={transactionColumns}
            dataSource={transactions}
            loading={loading.transactions}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `${total} transactions`,
              showQuickJumper: true
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      ),
    },
    {
      key: 'litiges',
      label: (
        <span>
          <WarningOutlined />
          Réclamations
          {litigeStats.ouverts > 0 && (
            <Badge 
              count={litigeStats.ouverts} 
              style={{ 
                marginLeft: 8, 
                backgroundColor: '#ff4d4f',
                fontSize: '10px'
              }} 
            />
          )}
        </span>
      ),
      children: (
        <Card>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Total Réclamations"
                  value={litigeStats.total}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<FileSearchOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Ouverts"
                  value={litigeStats.ouverts}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="En Cours"
                  value={litigeStats.en_cours}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Résolus"
                  value={litigeStats.resolus}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <Select
                defaultValue="all"
                style={{ width: 150 }}
                onChange={(value) => loadLitiges(value)}
              >
                <Option value="all">Toutes les Réclamations</Option>
                <Option value="Ouvert">Ouverts</Option>
                <Option value="En cours">En cours</Option>
                <Option value="Resolu">Résolus</Option>
                <Option value="Ferme">Fermés</Option>
                <Option value="ouvert">Ouverts (API)</Option>
                <Option value="en_cours">En cours (API)</Option>
                <Option value="resolu">Résolus (API)</Option>
              </Select>
            </div>
            <div>
              <Button
                icon={<SyncOutlined />}
                onClick={() => loadLitiges()}
                loading={loading.litiges}
                style={{ marginRight: 8 }}
              >
                Actualiser
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => ouvrirLitige()}
              >
                Nouvelle Réclamation
              </Button>
            </div>
          </div>

          <Table
            columns={litigeColumns}
            dataSource={litiges}
            loading={loading.litiges}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `${total} réclamations`,
              showQuickJumper: true
            }}
            scroll={{ x: 1300 }}
          />
        </Card>
      )
    },
    {
      key: 'statistiques',
      label: (
        <span>
          <BarChartOutlined />
          Statistiques
        </span>
      ),
      children: (
        <Card>
          {renderStatistiques()}
        </Card>
      )
    }
  ];

  // ==================== EFFETS ====================

  useEffect(() => {
    loadDashboardData();
    loadTransactions();
    loadLitiges();
  }, [loadDashboardData, loadTransactions, loadLitiges]);

  // ==================== RENDU ====================

  return (
    <div style={{ padding: '20px' }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TransactionOutlined style={{ marginRight: 8 }} />
            <span>Module de Règlement - Tableau de Bord</span>
          </div>
        }
        extra={
          <Button 
            icon={<SyncOutlined />} 
            onClick={() => {
              loadDashboardData();
              loadTransactions();
              loadLitiges();
            }}
            loading={loading.dashboard || loading.transactions || loading.litiges}
          >
            Actualiser tout
          </Button>
        }
      >
        {loading.dashboard ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} md={6}>
                <Card size="small" hoverable>
                  <Statistic
                    title="Total Transactions"
                    value={dashboardData.totalTransactions}
                    prefix={<TransactionOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small" hoverable>
                  <Statistic
                    title="Taux de Réussite"
                    value={dashboardData.successRate}
                    suffix="%"
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small" hoverable>
                  <Statistic
                    title="Montant Total"
                    value={dashboardData.totalAmount}
                    suffix="XAF"
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: '#cf1322' }}
                    formatter={(value) => `${parseFloat(value).toLocaleString('fr-FR')}`}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small" hoverable>
                  <Statistic
                    title="Déclarations en attente"
                    value={dashboardData.retards}
                    prefix={<ExclamationCircleOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>

            <Tabs 
              defaultActiveKey="transactions"
              items={tabItems}
              onChange={(key) => {
                if (key === 'transactions') loadTransactions();
                if (key === 'litiges') loadLitiges();
              }}
            />
          </>
        )}
      </Card>

      {/* Modal Détails Transaction */}
      <Modal
        title="Détails de la Transaction"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedTransaction && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Référence" span={2}>
              <strong>{selectedTransaction.REFERENCE_TRANSACTION}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              {selectedTransaction.TYPE_TRANSACTION}
            </Descriptions.Item>
            <Descriptions.Item label="Bénéficiaire">
              {selectedTransaction.BENEFICIAIRE}
            </Descriptions.Item>
            <Descriptions.Item label="Montant">
              <Tag color="blue">
                {parseFloat(selectedTransaction.MONTANT || 0).toLocaleString('fr-FR')} XAF
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Méthode">
              {selectedTransaction.METHODE_PAIEMENT}
            </Descriptions.Item>
            <Descriptions.Item label="Statut">
              <Tag color={
                selectedTransaction.STATUT_TRANSACTION === 'Reussi' || selectedTransaction.STATUT_TRANSACTION === 'reussi' ? 'success' :
                selectedTransaction.STATUT_TRANSACTION === 'Echoue' || selectedTransaction.STATUT_TRANSACTION === 'echoue' ? 'error' :
                selectedTransaction.STATUT_TRANSACTION === 'En cours' || selectedTransaction.STATUT_TRANSACTION === 'en_cours' ? 'processing' : 'default'
              }>
                {selectedTransaction.STATUT_TRANSACTION}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Date Initiation">
              {selectedTransaction.DATE_INITIATION ? 
                moment(selectedTransaction.DATE_INITIATION).format('DD/MM/YYYY HH:mm:ss') : 
                'Non spécifiée'}
            </Descriptions.Item>
            <Descriptions.Item label="Date Exécution">
              {selectedTransaction.DATE_EXECUTION ? 
                moment(selectedTransaction.DATE_EXECUTION).format('DD/MM/YYYY HH:mm:ss') : 
                'Non exécutée'}
            </Descriptions.Item>
            <Descriptions.Item label="Déclaration">
              {selectedTransaction.NUMERO_FACTURE ? 
                <Tag color="green">{selectedTransaction.NUMERO_FACTURE}</Tag> : 
                <Tag color="red">Non liée</Tag>
              }
            </Descriptions.Item>
            <Descriptions.Item label="Référence Bancaire" span={2}>
              {selectedTransaction.REFERENCE_BANQUE || 'Non spécifiée'}
            </Descriptions.Item>
            {selectedTransaction.PAYEUR && (
              <Descriptions.Item label="Payeur">
                {selectedTransaction.PAYEUR}
              </Descriptions.Item>
            )}
            {selectedTransaction.NOTES && (
              <Descriptions.Item label="Notes" span={2}>
                {selectedTransaction.NOTES}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Modal Nouveau Litige */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <WarningOutlined style={{ marginRight: 8, color: '#faad14' }} />
            <span>{selectedLitige ? 'Déclarer une Réclamation' : 'Nouvelle Réclamation'}</span>
          </div>
        }
        open={litigeModal}
        onCancel={() => {
          setLitigeModal(false);
          litigeForm.resetFields();
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={litigeForm}
          layout="vertical"
          onFinish={handleLitigeSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="COD_TRANS"
                label="Référence Transaction (Optionnel)"
                help={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ID de la transaction concernée (ex: 123)
                  </Text>
                }
              >
                <Input 
                  placeholder="Ex: 123"
                  prefix={<TransactionOutlined />}
                  maxLength={10}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="COD_FACTURE"
                label="ID Déclaration (Optionnel)"
                help={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ID de la déclaration concernée (ex: 456)
                  </Text>
                }
              >
                <Input 
                  placeholder="Ex: 456"
                  prefix={<FileTextOutlined />}
                  suffix={
                    <Tooltip title="Rechercher la déclaration">
                      <Button
                        type="link"
                        icon={<SearchOutlined />}
                        size="small"
                        onClick={() => {
                          const factureId = litigeForm.getFieldValue('COD_FACTURE');
                          if (factureId && /^[0-9]+$/.test(factureId)) {
                            loadFactureDetails(parseInt(factureId, 10));
                          }
                        }}
                        loading={loading.factureDetails}
                      />
                    </Tooltip>
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="TYPE_LITIGE"
                label="Type de Réclamation *"
                rules={[{ required: true, message: 'Veuillez sélectionner un type' }]}
              >
                <Select placeholder="Sélectionnez un type de réclamation">
                  <Option value="Montant incorrect">Montant incorrect</Option>
                  <Option value="Bénéficiaire erroné">Bénéficiaire erroné</Option>
                  <Option value="Double paiement">Double paiement</Option>
                  <Option value="Problème technique">Problème technique</Option>
                  <Option value="Retard de paiement">Retard de paiement</Option>
                  <Option value="Service non fourni">Service non fourni</Option>
                  <Option value="Fraude suspectée">Fraude suspectée</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ACTION"
                label="Action Requise *"
                rules={[{ required: true, message: 'Veuillez sélectionner une action' }]}
              >
                <Select placeholder="Sélectionnez une action">
                  <Option value="Remboursement total">Remboursement total</Option>
                  <Option value="Remboursement partiel">Remboursement partiel</Option>
                  <Option value="Correction transaction">Correction de la transaction</Option>
                  <Option value="Enquête">Enquête complémentaire</Option>
                  <Option value="À traiter">À traiter</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="DESCRIPTION"
            label="Description détaillée *"
            rules={[
              { required: true, message: 'Veuillez décrire la réclamation' },
              { min: 10, message: 'La description doit faire au moins 10 caractères' }
            ]}
          >
            <TextArea 
              rows={4} 
              placeholder="Décrivez le problème en détail..."
              maxLength={2000}
              showCount
            />
          </Form.Item>

          {selectedLitige && (
            <Alert
              message="Informations de la transaction concernée"
              description={
                <Row gutter={16}>
                  <Col span={8}>
                    <div><strong>Référence :</strong></div>
                    <div>{selectedLitige.REFERENCE_TRANSACTION}</div>
                  </Col>
                  <Col span={8}>
                    <div><strong>Montant :</strong></div>
                    <div>{selectedLitige.MONTANT?.toLocaleString('fr-FR')} XAF</div>
                  </Col>
                  <Col span={8}>
                    <div><strong>Date :</strong></div>
                    <div>{moment(selectedLitige.DATE_INITIATION).format('DD/MM/YYYY HH:mm')}</div>
                  </Col>
                </Row>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item
            name="documents"
            label="Pièces jointes (optionnel)"
            extra="Formats acceptés: images (JPG, PNG) ou PDF (max 5MB par fichier)"
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Télécharger des preuves</Button>
            </Upload>
          </Form.Item>

          <Divider />

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button 
              onClick={() => {
                setLitigeModal(false);
                litigeForm.resetFields();
              }} 
              style={{ marginRight: 8 }}
              disabled={loading.litige}
            >
              Annuler
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading.litige}
              icon={<CheckCircleOutlined />}
            >
              Créer la Réclamation
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Détails Litige */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FileSearchOutlined style={{ marginRight: 8 }} />
            <span>Détails de la Réclamation {selectedLitigeForDetails?.COD_LITIGE ? `LIT-${selectedLitigeForDetails.COD_LITIGE}` : ''}</span>
          </div>
        }
        open={litigeDetailsModal}
        onCancel={() => {
          setLitigeDetailsModal(false);
          setSelectedLitigeForDetails(null);
        }}
        footer={[
          <Button key="close" onClick={() => setLitigeDetailsModal(false)}>
            Fermer
          </Button>,
          selectedLitigeForDetails?.STATUT !== 'Resolu' && selectedLitigeForDetails?.STATUT !== 'Ferme' &&
          selectedLitigeForDetails?.STATUT !== 'resolu' && selectedLitigeForDetails?.STATUT !== 'ferme' && (
            <Button
              key="resolve"
              type="primary"
              onClick={() => {
                setLitigeDetailsModal(false);
                setResoudreLitigeModal(true);
              }}
            >
              Résoudre cette réclamation
            </Button>
          )
        ]}
        width={700}
      >
        {selectedLitigeForDetails && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="ID Réclamation" span={2}>
              <Tag color="orange">LIT-{selectedLitigeForDetails.COD_LITIGE}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Référence Transaction">
              {selectedLitigeForDetails.COD_TRANS ? (
                <Tag color="blue">{selectedLitigeForDetails.COD_TRANS}</Tag>
              ) : (
                <Tag color="default">N/A</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Déclaration">
              {selectedLitigeForDetails.NUMERO_FACTURE ? (
                <Tag color="green">{selectedLitigeForDetails.NUMERO_FACTURE}</Tag>
              ) : (
                <Tag color="default">N/A</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Type de Réclamation">
              <Tag color="red">{selectedLitigeForDetails.TYPE_LITIGE}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Action Requise">
              {selectedLitigeForDetails.ACTION}
            </Descriptions.Item>
            <Descriptions.Item label="Statut">
              <Tag color={
                selectedLitigeForDetails.STATUT === 'Ouvert' || selectedLitigeForDetails.STATUT === 'ouvert' ? 'red' :
                selectedLitigeForDetails.STATUT === 'En cours' || selectedLitigeForDetails.STATUT === 'en_cours' ? 'orange' :
                selectedLitigeForDetails.STATUT === 'Resolu' || selectedLitigeForDetails.STATUT === 'resolu' ? 'green' : 'default'
              }>
                {selectedLitigeForDetails.STATUT}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Date Ouverture">
              {selectedLitigeForDetails.DATE_OUVERTURE ? 
                moment(selectedLitigeForDetails.DATE_OUVERTURE).format('DD/MM/YYYY HH:mm:ss') : 
                'Non spécifiée'}
            </Descriptions.Item>
            <Descriptions.Item label="Date Résolution">
              {selectedLitigeForDetails.DATE_RESOLUTION 
                ? moment(selectedLitigeForDetails.DATE_RESOLUTION).format('DD/MM/YYYY HH:mm:ss')
                : 'Non résolu'}
            </Descriptions.Item>
            <Descriptions.Item label="Bénéficiaire" span={2}>
              {selectedLitigeForDetails.NOM_BEN || selectedLitigeForDetails.PRE_BEN 
                ? `${selectedLitigeForDetails.NOM_BEN || ''} ${selectedLitigeForDetails.PRE_BEN || ''}`.trim()
                : 'Non spécifié'}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {selectedLitigeForDetails.DESCRIPTION || 'Non spécifiée'}
            </Descriptions.Item>
            {selectedLitigeForDetails.RESOLUTION && (
              <Descriptions.Item label="Résolution" span={2}>
                {selectedLitigeForDetails.RESOLUTION}
              </Descriptions.Item>
            )}
            {selectedLitigeForDetails.UTILISATEUR_RESOLUTION && (
              <Descriptions.Item label="Résolu par" span={2}>
                {selectedLitigeForDetails.UTILISATEUR_RESOLUTION}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Créé par" span={2}>
              {selectedLitigeForDetails.COD_CREUTIL || 'Système'}
              {selectedLitigeForDetails.DAT_CREUTIL && 
                ` le ${moment(selectedLitigeForDetails.DAT_CREUTIL).format('DD/MM/YYYY HH:mm')}`}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Modal Résoudre Litige */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            <span>Résoudre la Réclamation LIT-{selectedLitigeForDetails?.COD_LITIGE}</span>
          </div>
        }
        open={resoudreLitigeModal}
        onCancel={() => {
          setResoudreLitigeModal(false);
          resoudreLitigeForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={resoudreLitigeForm}
          layout="vertical"
          onFinish={resoudreLitige}
        >
          <Form.Item
            name="STATUT"
            label="Statut final"
            rules={[{ required: true, message: 'Veuillez sélectionner un statut' }]}
          >
            <Select placeholder="Sélectionnez le statut final">
              <Option value="Resolu">Résolu</Option>
              <Option value="Ferme">Fermé</Option>
              <Option value="En cours">Maintenir en cours</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="ACTION"
            label="Action prise"
            rules={[{ required: true, message: 'Veuillez décrire l\'action prise' }]}
          >
            <Select placeholder="Sélectionnez l'action prise">
              <Option value="Remboursement effectué">Remboursement effectué</Option>
              <Option value="Correction effectuée">Correction effectuée</Option>
              <Option value="Transaction annulée">Transaction annulée</Option>
              <Option value="Déclaration corrigée">Déclaration corrigée</Option>
              <Option value="Explication fournie">Explication fournie au client</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="RESOLUTION"
            label="Résolution détaillée *"
            rules={[
              { required: true, message: 'Veuillez décrire la résolution' },
              { min: 10, message: 'La description doit faire au moins 10 caractères' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Décrivez en détail comment la réclamation a été résolue..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="DATE_RESOLUTION"
            label="Date de résolution"
          >
            <DatePicker
              style={{ width: '100%' }}
              showTime
              format="DD/MM/YYYY HH:mm"
            />
          </Form.Item>

          <Alert
            message="Informations de la réclamation"
            description={
              <div>
                <div><strong>Type :</strong> {selectedLitigeForDetails?.TYPE_LITIGE}</div>
                <div><strong>Action requise :</strong> {selectedLitigeForDetails?.ACTION}</div>
                <div><strong>Description initiale :</strong> {selectedLitigeForDetails?.DESCRIPTION}</div>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button
              onClick={() => setResoudreLitigeModal(false)}
              style={{ marginRight: 8 }}
              disabled={loading.litige}
            >
              Annuler
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading.litige}
              icon={<CheckCircleOutlined />}
            >
              Enregistrer la Résolution
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Paiement;