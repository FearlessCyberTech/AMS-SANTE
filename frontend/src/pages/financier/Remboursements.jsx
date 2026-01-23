import React, { useState, useEffect } from 'react';
import './Remboursements.css';
import { remboursementsAPI, patientsAPI } from '../../services/api';
import { 
  Snackbar, 
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  // Icônes pour les statistiques
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingIcon,
  // Icônes pour les actions
  Visibility as ViewIcon,
  History as HistoryIcon,
  Payment as PaymentIcon,
  Check as ValidateIcon,
  Clear as RejectIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  Close as CloseIcon,
  // Icônes pour les formulaires
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarIcon,
  AttachFile as AttachIcon,
  Delete as DeleteIcon,
  // Icônes pour les statuts
  HourglassEmpty as PendingIcon,
  TaskAlt as ValidIcon,
  Cancel as CancelIcon,
  Paid as PaidIcon
} from '@mui/icons-material';

// Composant pour les détails de déclaration
const DeclarationDetails = ({ declaration }) => (
  <div className="details-grid">
    <div className="detail-item">
      <strong><DescriptionIcon fontSize="small" /> N° Déclaration:</strong>
      <span>{declaration.NUM_DECLARATION || declaration.COD_DECL}</span>
    </div>
    <div className="detail-item">
      <strong><CalendarIcon fontSize="small" /> Date:</strong>
      <span>{declaration.DATE_DECLARATION ? 
        new Date(declaration.DATE_DECLARATION).toLocaleDateString('fr-FR') : '-'}</span>
    </div>
    <div className="detail-item">
      <strong><PersonIcon fontSize="small" /> Bénéficiaire:</strong>
      <span>{declaration.NOM_BEN || ''} {declaration.PRE_BEN || ''}</span>
    </div>
    <div className="detail-item">
      <strong>ID:</strong>
      <span>{declaration.IDENTIFIANT_NATIONAL || '-'}</span>
    </div>
    <div className="detail-item">
      <strong>Type Déclarant:</strong>
      <span>{declaration.TYPE_DECLARANT || '-'}</span>
    </div>
    <div className="detail-item">
      <strong>Montant Total:</strong>
      <span className="amount">
        {new Intl.NumberFormat('fr-FR', { 
          style: 'currency', 
          currency: 'XAF' 
        }).format(declaration.MONTANT_TOTAL || 0)}
      </span>
    </div>
    <div className="detail-item">
      <strong>Prise en charge:</strong>
      <span className="amount">
        {new Intl.NumberFormat('fr-FR', { 
          style: 'currency', 
          currency: 'XAF' 
        }).format(declaration.MONTANT_PRISE_CHARGE || 0)}
      </span>
    </div>
    <div className="detail-item">
      <strong>À Rembourser:</strong>
      <span className="amount">
        {new Intl.NumberFormat('fr-FR', { 
          style: 'currency', 
          currency: 'XAF' 
        }).format(declaration.MONTANT_REMBOURSABLE || 0)}
      </span>
    </div>
    <div className="detail-item">
      <strong>Statut:</strong>
      <span className="status-badge" style={{ 
        backgroundColor: declaration.STATUT === 'Validé' ? '#4caf50' : 
                       declaration.STATUT === 'Rejeté' ? '#f44336' : 
                       declaration.STATUT === 'Payé' ? '#9c27b0' : '#2196f3' 
      }}>
        {declaration.STATUT === 'Validé' && <ValidIcon fontSize="small" sx={{ mr: 0.5 }} />}
        {declaration.STATUT === 'Rejeté' && <CancelIcon fontSize="small" sx={{ mr: 0.5 }} />}
        {declaration.STATUT === 'Payé' && <PaidIcon fontSize="small" sx={{ mr: 0.5 }} />}
        {(!declaration.STATUT || declaration.STATUT === 'Soumis') && <PendingIcon fontSize="small" sx={{ mr: 0.5 }} />}
        {declaration.STATUT || 'Soumis'}
      </span>
    </div>
    {declaration.MOTIF_REJET && (
      <div className="detail-item full-width">
        <strong>Motif du rejet:</strong>
        <span className="motif-rejet">{declaration.MOTIF_REJET}</span>
      </div>
    )}
    {declaration.PIECES_JOINTES && (
      <div className="detail-item full-width">
        <strong><AttachIcon fontSize="small" /> Pièces jointes:</strong>
        <span>{declaration.PIECES_JOINTES}</span>
      </div>
    )}
  </div>
);

// Composant pour l'historique des remboursements
const HistoriqueRemboursements = ({ COD_BEN }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [COD_BEN]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await remboursementsAPI.getHistorique(COD_BEN);
      if (response.success) {
        setHistory(response.historique || []);
      }
    } catch (error) {
      console.error('Erreur historique:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="timeline">
      {loading ? (
        <div className="loading">Chargement de l'historique...</div>
      ) : history.length === 0 ? (
        <div className="empty-history">Aucun historique disponible</div>
      ) : (
        history.map((item, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-date">
              <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
              {item.DATE_REMBOURSEMENT ? 
                new Date(item.DATE_REMBOURSEMENT).toLocaleDateString('fr-FR') : '-'}
            </div>
            <div className="timeline-content">
              <div className="timeline-amount">
                <MoneyIcon fontSize="small" sx={{ mr: 1 }} />
                {new Intl.NumberFormat('fr-FR', { 
                  style: 'currency', 
                  currency: 'XAF' 
                }).format(item.MONTANT_REMBOURSE || 0)}
              </div>
              <div className="timeline-status">
                Statut: {item.STATUT_REMBOURSEMENT || 'Non spécifié'}
              </div>
              {item.OBSERVATIONS && (
                <div className="timeline-observations">
                  {item.OBSERVATIONS}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Composant pour nouvelle déclaration
const NouvelleDeclarationForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    COD_BEN: '',
    TYPE_DECLARANT: 'Beneficiaire',
    NOM_DECLARANT: '',
    details: [{
      TYPE_PRESTATION: '',
      LIBELLE_PRESTATION: '',
      QUANTITE: 1,
      PRIX_UNITAIRE: 0,
      DATE_PRESTATION: new Date().toISOString().split('T')[0]
    }],
    PIECES_JOINTES: ''
  });
  
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculations, setCalculations] = useState({
    montantTotal: 0,
    montantPriseEnCharge: 0,
    montantTicketModerateur: 0,
    montantRemboursable: 0
  });

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  useEffect(() => {
    calculateAmounts();
  }, [formData.details]);

  const loadBeneficiaries = async () => {
    try {
      const response = await patientsAPI.getAll(100);
      if (response.success) {
        setBeneficiaries(response.patients || []);
      }
    } catch (error) {
      console.error('Erreur bénéficiaires:', error);
    }
  };

  const calculateAmounts = () => {
    const total = formData.details.reduce((sum, detail) => 
      sum + ((detail.QUANTITE || 0) * (detail.PRIX_UNITAIRE || 0)), 0);
    const priseEnCharge = total * 0.8; // 80% par défaut
    const ticketModerateur = total - priseEnCharge;
    
    setCalculations({
      montantTotal: total,
      montantPriseEnCharge: priseEnCharge,
      montantTicketModerateur: ticketModerateur,
      montantRemboursable: priseEnCharge
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.COD_BEN) {
      alert('Veuillez sélectionner un bénéficiaire');
      return;
    }

    if (formData.details.some(d => !d.TYPE_PRESTATION || !d.LIBELLE_PRESTATION)) {
      alert('Veuillez remplir tous les détails de prestations');
      return;
    }

    setLoading(true);
    try {
      const declarationData = {
        COD_BEN: parseInt(formData.COD_BEN),
        TYPE_DECLARANT: formData.TYPE_DECLARANT,
        NOM_DECLARANT: formData.NOM_DECLARANT || '',
        MONTANT_TOTAL: calculations.montantTotal,
        MONTANT_PRISE_CHARGE: calculations.montantPriseEnCharge,
        MONTANT_TICKET_MODERATEUR: calculations.montantTicketModerateur,
        MONTANT_REMBOURSABLE: calculations.montantRemboursable,
        PIECES_JOINTES: formData.PIECES_JOINTES || '',
        details: formData.details.map(detail => ({
          TYPE_PRESTATION: detail.TYPE_PRESTATION,
          LIBELLE_PRESTATION: detail.LIBELLE_PRESTATION,
          QUANTITE: parseInt(detail.QUANTITE) || 1,
          PRIX_UNITAIRE: parseFloat(detail.PRIX_UNITAIRE) || 0,
          DATE_PRESTATION: detail.DATE_PRESTATION || new Date().toISOString().split('T')[0]
        }))
      };
      
      console.log('📤 Création déclaration:', declarationData);
      
      const response = await remboursementsAPI.createDeclaration(declarationData);
      
      if (response.success) {
        alert(`Déclaration créée avec succès ! Numéro: ${response.declarationId || 'N/A'}`);
        setFormData({
          COD_BEN: '',
          TYPE_DECLARANT: 'Beneficiaire',
          NOM_DECLARANT: '',
          details: [{
            TYPE_PRESTATION: '',
            LIBELLE_PRESTATION: '',
            QUANTITE: 1,
            PRIX_UNITAIRE: 0,
            DATE_PRESTATION: new Date().toISOString().split('T')[0]
          }],
          PIECES_JOINTES: ''
        });
        onSuccess();
      } else {
        alert(response.message || 'Erreur lors de la soumission');
      }
    } catch (error) {
      console.error('Erreur création déclaration:', error);
      alert(`Erreur: ${error.message || 'Erreur lors de la création'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...formData.details];
    newDetails[index][field] = value;
    setFormData({
      ...formData,
      details: newDetails
    });
  };

  const addDetail = () => {
    setFormData({
      ...formData,
      details: [
        ...formData.details,
        {
          TYPE_PRESTATION: '',
          LIBELLE_PRESTATION: '',
          QUANTITE: 1,
          PRIX_UNITAIRE: 0,
          DATE_PRESTATION: new Date().toISOString().split('T')[0]
        }
      ]
    });
  };

  const removeDetail = (index) => {
    if (formData.details.length > 1) {
      const newDetails = [...formData.details];
      newDetails.splice(index, 1);
      setFormData({
        ...formData,
        details: newDetails
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="declaration-form">
      <div className="form-section">
        <h3><PersonIcon sx={{ mr: 1 }} /> Informations générales</h3>
        
        <div className="form-group">
          <label htmlFor="COD_BEN">Bénéficiaire *</label>
          <select
            id="COD_BEN"
            name="COD_BEN"
            value={formData.COD_BEN}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionner un bénéficiaire</option>
            {beneficiaries.map(b => (
              <option key={b.ID_BEN || b.id} value={b.ID_BEN || b.id}>
                {b.NOM_BEN || b.nom} {b.PRE_BEN || b.prenom} 
                {b.IDENTIFIANT_NATIONAL ? ` (${b.IDENTIFIANT_NATIONAL})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="TYPE_DECLARANT">Type de Déclarant *</label>
          <select
            id="TYPE_DECLARANT"
            name="TYPE_DECLARANT"
            value={formData.TYPE_DECLARANT}
            onChange={handleChange}
            required
          >
            <option value="Beneficiaire">Bénéficiaire</option>
            <option value="Prestataire">Prestataire de santé</option>
            <option value="Assure">Assuré</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="NOM_DECLARANT">Nom du Déclarant</label>
          <input
            type="text"
            id="NOM_DECLARANT"
            name="NOM_DECLARANT"
            value={formData.NOM_DECLARANT}
            onChange={handleChange}
            placeholder="Nom de la personne qui déclare"
          />
        </div>
      </div>

      <div className="form-section">
        <h3><ReceiptIcon sx={{ mr: 1 }} /> Détails des prestations</h3>
        
        {formData.details.map((detail, index) => (
          <div key={index} className="detail-form">
            <div className="detail-header">
              <h4>Prestation {index + 1}</h4>
              {formData.details.length > 1 && (
                <button 
                  type="button" 
                  className="btn btn-danger btn-sm"
                  onClick={() => removeDetail(index)}
                >
                  <DeleteIcon fontSize="small" /> Supprimer
                </button>
              )}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Type de prestation *</label>
                <input
                  type="text"
                  value={detail.TYPE_PRESTATION}
                  onChange={(e) => handleDetailChange(index, 'TYPE_PRESTATION', e.target.value)}
                  placeholder="Ex: Consultation, Médicament..."
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Libellé *</label>
                <input
                  type="text"
                  value={detail.LIBELLE_PRESTATION}
                  onChange={(e) => handleDetailChange(index, 'LIBELLE_PRESTATION', e.target.value)}
                  placeholder="Détails de la prestation"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Quantité *</label>
                <input
                  type="number"
                  min="1"
                  value={detail.QUANTITE}
                  onChange={(e) => handleDetailChange(index, 'QUANTITE', parseInt(e.target.value) || 1)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Prix unitaire (XAF) *</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={detail.PRIX_UNITAIRE}
                  onChange={(e) => handleDetailChange(index, 'PRIX_UNITAIRE', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label><CalendarIcon fontSize="small" sx={{ mr: 0.5 }} /> Date prestation</label>
                <input
                  type="date"
                  value={detail.DATE_PRESTATION}
                  onChange={(e) => handleDetailChange(index, 'DATE_PRESTATION', e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Sous-total</label>
                <div className="subtotal">
                  {((detail.QUANTITE || 0) * (detail.PRIX_UNITAIRE || 0)).toLocaleString()} XAF
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={addDetail}
        >
          <AddIcon sx={{ mr: 1 }} /> Ajouter une prestation
        </button>
      </div>

      <div className="form-section">
        <h3><MoneyIcon sx={{ mr: 1 }} /> Récapitulatif</h3>
        
        <div className="summary-grid">
          <div className="summary-item">
            <span>Total prestations:</span>
            <strong>{calculations.montantTotal.toLocaleString()} XAF</strong>
          </div>
          <div className="summary-item">
            <span>Prise en charge (80%):</span>
            <strong>{calculations.montantPriseEnCharge.toLocaleString()} XAF</strong>
          </div>
          <div className="summary-item">
            <span>Ticket modérateur:</span>
            <strong>{calculations.montantTicketModerateur.toLocaleString()} XAF</strong>
          </div>
          <div className="summary-item total">
            <span>Montant à rembourser:</span>
            <strong>{calculations.montantRemboursable.toLocaleString()} XAF</strong>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="PIECES_JOINTES"><AttachIcon fontSize="small" sx={{ mr: 0.5 }} /> Pièces jointes (chemins séparés par des virgules)</label>
          <textarea
            id="PIECES_JOINTES"
            name="PIECES_JOINTES"
            value={formData.PIECES_JOINTES}
            onChange={handleChange}
            rows="2"
            placeholder="chemin1.pdf, chemin2.jpg..."
          />
        </div>
      </div>

      <div className="form-actions">
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Envoi en cours...' : 'Soumettre la déclaration'}
        </button>
      </div>
    </form>
  );
};

// Composant principal
const Remboursements = () => {
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  const [historyModal, setHistoryModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [recapData, setRecapData] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [supportModal, setSupportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('declarations');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    totalPages: 1
  });

  useEffect(() => {
    loadDeclarations();
    loadRecapData();
  }, [filterStatus, filters.page]);

  const loadDeclarations = async () => {
    setLoading(true);
    try {
      const apiFilters = {
        page: filters.page,
        limit: filters.limit
      };
      
      if (filterStatus !== 'all') {
        apiFilters.status = filterStatus;
      }
      
      const response = await remboursementsAPI.getDeclarations(apiFilters);
      
      if (response.success) {
        setDeclarations(response.declarations || []);
        if (response.pagination) {
          setFilters(prev => ({
            ...prev,
            totalPages: response.pagination.totalPages || 1
          }));
        }
      } else {
        showSnackbar(response.message || 'Erreur lors du chargement', 'error');
      }
    } catch (error) {
      console.error('Erreur chargement déclarations:', error);
      showSnackbar('Erreur de connexion au serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

// Dans le composant Remboursements, modifiez la fonction loadRecapData :

const loadRecapData = async () => {
  try {
    // Appeler l'API qui utilise la procédure stockée existante
    const response = await remboursementsAPI.getRecap({
      date_debut: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Début du mois
      date_fin: new Date(), // Aujourd'hui
      statut: 'all' // Tous les statuts
    });
    
    if (response.success) {
      console.log('📊 Données récapitulatives reçues:', response);
      
      // Si l'API retourne directement l'objet recap
      if (response.recap) {
        setRecapData(response.recap);
        return;
      }
      
      // Si l'API retourne un tableau de résultats (comme dans la procédure stockée)
      if (response.data && response.data.length > 0) {
        const data = response.data[0]; // Premier pays (ou regroupement)
        setRecapData({
          nbSoumis: data.NB_SOUMIS || 0,
          montantAPayer: data.MONTANT_REMBOURSABLE || 0,
          payesMois: data.MONTANT_REMBOURSABLE_PAYE || 0, // À calculer séparément
          ticketMoyen: data.MONTANT_REMBOURSABLE / Math.max(data.NB_DECLARATIONS, 1) || 0
        });
      }
      
    } else {
      // Si l'API n'a pas de données, faire le calcul directement
      await calculateRecapManually();
    }
    
  } catch (error) {
    console.error('❌ Erreur chargement recap:', error);
    // Fallback: calcul manuel
    await calculateRecapManually();
  }
};

// Fonction pour calculer manuellement les statistiques
const calculateRecapManually = async () => {
  try {
    // 1. Charger toutes les déclarations
    const declarationsResponse = await remboursementsAPI.getDeclarations({ 
      page: 1, 
      limit: 10000, 
      status: 'all' 
    });
    
    if (!declarationsResponse.success) return;
    
    const allDeclarations = declarationsResponse.declarations || [];
    
    // 2. Calculer les statistiques
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // a) Nombre de déclarations soumises (statut = 'Soumis')
    const nbSoumis = allDeclarations.filter(d => d.STATUT === 'Soumis').length;
    
    // b) Montant total à payer (déclarations validées mais non payées)
    const montantAPayer = allDeclarations
      .filter(d => d.STATUT === 'Validé' && !d.DATE_PAIEMENT)
      .reduce((sum, d) => sum + (d.MONTANT_REMBOURSABLE || 0), 0);
    
    // c) Montant payé ce mois-ci
    const payesMois = allDeclarations
      .filter(d => {
        if (d.STATUT !== 'Payé' || !d.DATE_PAIEMENT) return false;
        const datePaiement = new Date(d.DATE_PAIEMENT);
        return datePaiement.getMonth() === currentMonth && 
               datePaiement.getFullYear() === currentYear;
      })
      .reduce((sum, d) => sum + (d.MONTANT_REMBOURSABLE || 0), 0);
    
    // d) Ticket moyen (moyenne des montants remboursables des déclarations payées)
    const declarationsPayees = allDeclarations.filter(d => d.STATUT === 'Payé' && d.MONTANT_REMBOURSABLE > 0);
    const ticketMoyen = declarationsPayees.length > 0 
      ? declarationsPayees.reduce((sum, d) => sum + d.MONTANT_REMBOURSABLE, 0) / declarationsPayees.length
      : 0;
    
    // 3. Mettre à jour l'état
    setRecapData({
      nbSoumis,
      montantAPayer,
      payesMois,
      ticketMoyen,
      // Ajouter d'autres métriques si disponibles
      nbTotal: allDeclarations.length,
      montantTotal: allDeclarations.reduce((sum, d) => sum + (d.MONTANT_TOTAL || 0), 0),
      nbValide: allDeclarations.filter(d => d.STATUT === 'Validé').length,
      nbRejete: allDeclarations.filter(d => d.STATUT === 'Rejeté').length,
      nbPaye: declarationsPayees.length
    });
    
  } catch (error) {
    console.error('❌ Erreur calcul manuel recap:', error);
  }
};

// Vous pouvez aussi créer une API dédiée qui appelle la procédure stockée [metier].[usp_GetRecapRemboursements]
// Voici comment vous pourriez l'appeler :

const getRecapFromStoredProcedure = async () => {
  try {
    // Exemple d'appel à une nouvelle API qui exécute la procédure stockée
    const response = await fetch('/api/remboursements/recap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        date_debut: formatDateForAPI(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
        date_fin: formatDateForAPI(new Date()),
        cod_pay: 'CMR' // Code pays par défaut, à adapter
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // La procédure stockée retourne des données structurées
      const recap = data.recap;
      setRecapData({
        nbSoumis: recap.NB_SOUMIS || 0,
        montantAPayer: recap.MONTANT_REMBOURSABLE || 0,
        payesMois: recap.MONTANT_PAYE_MOIS || 0,
        ticketMoyen: recap.TICKET_MOYEN || 0,
        // Autres métriques
        nbTotal: recap.NB_DECLARATIONS || 0,
        montantTotal: recap.MONTANT_TOTAL || 0,
        delaiMoyen: recap.DELAI_MOYEN_JOURS || 0
      });
    }
  } catch (error) {
    console.error('Erreur appel procédure stockée:', error);
  }
};


  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const showDeclarationDetails = (declaration) => {
    setSelectedDeclaration(declaration);
    setModalVisible(true);
  };

  const showBeneficiaryHistory = (declaration) => {
    setSelectedBeneficiary(declaration);
    setHistoryModal(true);
  };

  const initierPaiement = async (declaration) => {
    if (window.confirm(`Initier le paiement de ${formatCurrency(declaration.MONTANT_REMBOURSABLE)} ?`)) {
      try {
        const data = {
          COD_DECL: declaration.COD_DECL,
          MONTANT: declaration.MONTANT_REMBOURSABLE,
          COD_BEN: declaration.COD_BEN,
          METHODE: 'BankTransfer',
          reference_paiement: `PAY-${declaration.COD_DECL}-${Date.now()}`
        };
        
        const response = await remboursementsAPI.initierPaiement(data);
        
        if (response.success) {
          showSnackbar('Paiement initié avec succès');
          loadDeclarations();
          loadRecapData();
        } else {
          showSnackbar(response.message || 'Erreur lors du paiement', 'error');
        }
      } catch (error) {
        console.error('Erreur paiement:', error);
        showSnackbar('Erreur lors de l\'initiation du paiement', 'error');
      }
    }
  };

  const traiterDeclaration = async (declaration, action) => {
    if (action === 'rejeter') {
      const motif = prompt('Veuillez saisir le motif du rejet :');
      if (!motif) {
        return;
      }
      
      try {
        const response = await remboursementsAPI.traiterDeclaration(
          declaration.COD_DECL,
          'rejeter',
          motif
        );
        
        if (response.success) {
          showSnackbar('Déclaration rejetée');
          loadDeclarations();
          loadRecapData();
        } else {
          showSnackbar(response.message || 'Erreur lors du rejet', 'error');
        }
      } catch (error) {
        console.error('Erreur rejet:', error);
        showSnackbar('Erreur lors du rejet de la déclaration', 'error');
      }
    } else {
      if (window.confirm('Valider cette déclaration ?')) {
        try {
          const response = await remboursementsAPI.traiterDeclaration(
            declaration.COD_DECL,
            'valider',
            ''
          );
          
          if (response.success) {
            showSnackbar('Déclaration validée');
            loadDeclarations();
            loadRecapData();
          } else {
            showSnackbar(response.message || 'Erreur lors de la validation', 'error');
          }
        } catch (error) {
          console.error('Erreur validation:', error);
          showSnackbar('Erreur lors de la validation', 'error');
        }
      }
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'validé': return '#4caf50';
      case 'rejeté': return '#f44336';
      case 'payé': return '#9c27b0';
      case 'soumis': return '#2196f3';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'validé': return <ValidIcon fontSize="small" />;
      case 'rejeté': return <CancelIcon fontSize="small" />;
      case 'payé': return <PaidIcon fontSize="small" />;
      case 'soumis':
      default: return <PendingIcon fontSize="small" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= filters.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="remboursements-container">
      <div className="header">
        <h1><MoneyIcon sx={{ mr: 2, verticalAlign: 'middle' }} /> Gestion des Remboursements</h1>
        <p>Suivi et traitement des déclarations de remboursement</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><DescriptionIcon fontSize="large" /></div>
          <h3>Déclarations Soumises</h3>
          <div className="stat-value">{recapData.nbSoumis || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><MoneyIcon fontSize="large" /></div>
          <h3>À Payer</h3>
          <div className="stat-value">{formatCurrency(recapData.montantAPayer || 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><CheckCircleIcon fontSize="large" /></div>
          <h3>Payés Ce Mois</h3>
          <div className="stat-value">{formatCurrency(recapData.payesMois || 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingIcon fontSize="large" /></div>
          <h3>Ticket Moyen</h3>
          <div className="stat-value">{formatCurrency(recapData.ticketMoyen || 0)}</div>
        </div>
      </div>

      {/* Onglets */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'declarations' ? 'active' : ''}`}
          onClick={() => setActiveTab('declarations')}
        >
          <DescriptionIcon sx={{ mr: 1 }} /> Déclarations
        </button>
        <button 
          className={`tab ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          <AddIcon sx={{ mr: 1 }} /> Nouvelle Déclaration
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'declarations' && (
        <div className="tab-content">
          <div className="filters">
            <div className="filter-group">
              <label>Filtrer par statut:</label>
              <select 
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setFilters(prev => ({ ...prev, page: 1 }));
                }}
                className="filter-select"
              >
                <option value="all">Tous les statuts</option>
                <option value="Soumis">Soumis</option>
                <option value="Validé">Validé</option>
                <option value="Rejeté">Rejeté</option>
                <option value="Payé">Payé</option>
              </select>
            </div>
            
            <button 
              className="btn btn-secondary"
              onClick={() => setSupportModal(true)}
            >
              <PhoneIcon sx={{ mr: 1 }} /> Support & Réclamations
            </button>
            
            <button 
              className="btn btn-outline"
              onClick={loadDeclarations}
              disabled={loading}
            >
              <RefreshIcon sx={{ mr: 1 }} /> Actualiser
            </button>
          </div>

          {/* Tableau des déclarations */}
          <div className="table-container">
            {loading ? (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <p>Chargement des déclarations...</p>
              </div>
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>N° Déclaration</th>
                      <th>Bénéficiaire</th>
                      <th>Date</th>
                      <th>Montant Total</th>
                      <th>À Rembourser</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {declarations.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-cell">
                          Aucune déclaration trouvée
                        </td>
                      </tr>
                    ) : (
                      declarations.map((declaration) => (
                        <tr key={declaration.COD_DECL}>
                          <td>
                            <strong>{declaration.NUM_DECLARATION || `DECL-${declaration.COD_DECL}`}</strong>
                          </td>
                          <td>
                            <div className="beneficiary-info">
                              <div className="beneficiary-name">
                                <PersonIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                {declaration.NOM_BEN} {declaration.PRE_BEN}
                              </div>
                              <div className="beneficiary-id">
                                {declaration.IDENTIFIANT_NATIONAL || '-'}
                              </div>
                            </div>
                          </td>
                          <td>
                            <CalendarIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {formatDate(declaration.DATE_DECLARATION)}
                          </td>
                          <td className="amount">{formatCurrency(declaration.MONTANT_TOTAL)}</td>
                          <td className="amount">{formatCurrency(declaration.MONTANT_REMBOURSABLE)}</td>
                          <td>
                            <span 
                              className="status-badge"
                              style={{ backgroundColor: getStatusColor(declaration.STATUT) }}
                            >
                              {getStatusIcon(declaration.STATUT)}
                              {declaration.STATUT || 'Soumis'}
                            </span>
                          </td>
                          <td className="actions">
                            <div className="action-buttons">
                              <Tooltip title="Voir détails">
                                <IconButton 
                                  size="small"
                                  className="btn btn-sm btn-view"
                                  onClick={() => showDeclarationDetails(declaration)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Historique bénéficiaire">
                                <IconButton 
                                  size="small"
                                  className="btn btn-sm btn-history"
                                  onClick={() => showBeneficiaryHistory(declaration)}
                                >
                                  <HistoryIcon />
                                </IconButton>
                              </Tooltip>
                              
                              {declaration.STATUT === 'Validé' && (
                                <Tooltip title="Initier paiement">
                                  <IconButton 
                                    size="small"
                                    className="btn btn-sm btn-pay"
                                    onClick={() => initierPaiement(declaration)}
                                  >
                                    <PaymentIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              {(declaration.STATUT === 'Soumis' || !declaration.STATUT) && (
                                <>
                                  <Tooltip title="Valider">
                                    <IconButton 
                                      size="small"
                                      className="btn btn-sm btn-validate"
                                      onClick={() => traiterDeclaration(declaration, 'valider')}
                                    >
                                      <ValidateIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Rejeter">
                                    <IconButton 
                                      size="small"
                                      className="btn btn-sm btn-reject"
                                      onClick={() => traiterDeclaration(declaration, 'rejeter')}
                                    >
                                      <RejectIcon />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                
                {/* Pagination */}
                {declarations.length > 0 && (
                  <div className="pagination">
                    <button 
                      className="btn btn-pagination"
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page <= 1}
                    >
                      ← Précédent
                    </button>
                    
                    <span className="page-info">
                      Page {filters.page} sur {filters.totalPages}
                    </span>
                    
                    <button 
                      className="btn btn-pagination"
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page >= filters.totalPages}
                    >
                      Suivant →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'new' && (
        <div className="tab-content">
          <NouvelleDeclarationForm onSuccess={() => {
            loadDeclarations();
            loadRecapData();
            showSnackbar('Déclaration créée avec succès');
          }} />
        </div>
      )}

      {/* Modal Détails Déclaration */}
      {modalVisible && selectedDeclaration && (
        <div className="modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Détails de la Déclaration</h2>
              <IconButton 
                className="close-btn" 
                onClick={() => setModalVisible(false)}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </div>
            <div className="modal-body">
              <DeclarationDetails declaration={selectedDeclaration} />
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setModalVisible(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historique */}
      {historyModal && selectedBeneficiary && (
        <div className="modal-overlay" onClick={() => setHistoryModal(false)}>
          <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Historique des Remboursements</h2>
              <IconButton 
                className="close-btn" 
                onClick={() => setHistoryModal(false)}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </div>
            <div className="modal-body">
              <div className="beneficiary-header">
                <h3><PersonIcon sx={{ mr: 1 }} /> {selectedBeneficiary.NOM_BEN} {selectedBeneficiary.PRE_BEN}</h3>
                <p>ID: {selectedBeneficiary.IDENTIFIANT_NATIONAL || 'N/A'}</p>
              </div>
              <HistoriqueRemboursements COD_BEN={selectedBeneficiary.COD_BEN} />
            </div>
          </div>
        </div>
      )}

      {/* Snackbar pour notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Remboursements;