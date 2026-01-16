import React, { useState, useEffect } from 'react';
import './Facturation.css';
import { facturationAPI, patientsAPI, consultationsAPI } from '../../services/api';
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
  Download as DownloadIcon,
  Print as PrintIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  Percent as PercentIcon,
  AccessTime as TimeIcon,
  LocalOffer as TagIcon,
  Inventory as PackageIcon,
  Group as UsersIcon,
  Archive as BoxIcon,
  // Icônes pour les statuts
  HourglassEmpty as PendingIcon,
  TaskAlt as ValidIcon,
  Cancel as CancelIcon,
  Paid as PaidIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

// Composant pour les détails de facture
const FactureDetails = ({ facture }) => {
  const formatMontant = (montant) => {
    if (!montant) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const calculatePaymentPercentage = (facture) => {
    const total = parseFloat(facture.montant_total) || 0;
    const paye = parseFloat(facture.montant_paye) || 0;
    return total > 0 ? Math.round((paye / total) * 100) : 0;
  };

  const isFactureEnRetard = (facture) => {
    if (!facture.date_echeance || facture.statut === 'Payée') return false;
    const aujourdhui = new Date();
    const echeance = new Date(facture.date_echeance);
    return echeance < aujourdhui;
  };

  const getStatutColor = (statut) => {
    switch(statut) {
      case 'Payée': return '#4caf50';
      case 'Partiellement payée': return '#ff9800';
      case 'En attente': return '#2196f3';
      case 'En retard': return '#f44336';
      default: return '#757575';
    }
  };

  return (
    <div className="details-grid">
      <div className="detail-item">
        <strong><ReceiptIcon fontSize="small" /> N° Facture:</strong>
        <span>{facture.numero || facture.id}</span>
      </div>
      <div className="detail-item">
        <strong><CalendarIcon fontSize="small" /> Date création:</strong>
        <span>{formatDate(facture.date_facture)}</span>
      </div>
      <div className="detail-item">
        <strong><CalendarIcon fontSize="small" /> Date échéance:</strong>
        <span className={isFactureEnRetard(facture) ? 'text-danger' : ''}>
          {formatDate(facture.date_echeance)}
          {isFactureEnRetard(facture) && (
            <span className="ml-2 badge badge-danger">En retard</span>
          )}
        </span>
      </div>
      <div className="detail-item">
        <strong><PersonIcon fontSize="small" /> Bénéficiaire:</strong>
        <span>{facture.nom_ben} {facture.prenom_ben}</span>
      </div>
      <div className="detail-item">
        <strong>Téléphone:</strong>
        <span>{facture.telephone_ben || '-'}</span>
      </div>
      <div className="detail-item">
        <strong>Payeur:</strong>
        <span>{facture.libelle_payeur || '-'}</span>
      </div>
      <div className="detail-item">
        <strong>Montant Total:</strong>
        <span className="amount">{formatMontant(facture.montant_total)}</span>
      </div>
      <div className="detail-item">
        <strong>Montant Payé:</strong>
        <span className="amount">{formatMontant(facture.montant_paye)}</span>
      </div>
      <div className="detail-item">
        <strong>Reste à Payer:</strong>
        <span className="amount">{formatMontant(facture.montant_restant)}</span>
      </div>
      <div className="detail-item full-width">
        <strong>Progression du paiement:</strong>
        <div className="progress" style={{ marginTop: '5px' }}>
          <div 
            className="progress-bar" 
            style={{ 
              width: `${calculatePaymentPercentage(facture)}%`,
              backgroundColor: getStatutColor(facture.statut)
            }}
          >
            {calculatePaymentPercentage(facture)}%
          </div>
        </div>
      </div>
      <div className="detail-item">
        <strong>Statut:</strong>
        <span 
          className="status-badge" 
          style={{ backgroundColor: getStatutColor(facture.statut) }}
        >
          {facture.statut === 'Payée' && <ValidIcon fontSize="small" sx={{ mr: 0.5 }} />}
          {facture.statut === 'Rejeté' && <CancelIcon fontSize="small" sx={{ mr: 0.5 }} />}
          {facture.statut === 'En retard' && <ErrorIcon fontSize="small" sx={{ mr: 0.5 }} />}
          {facture.statut || 'En attente'}
        </span>
      </div>
      {facture.observations && (
        <div className="detail-item full-width">
          <strong>Observations:</strong>
          <span className="observations">{facture.observations}</span>
        </div>
      )}
    </div>
  );
};

// Composant pour l'historique des paiements
const HistoriquePaiements = ({ factureId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [factureId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await facturationAPI.getPaiements(factureId);
      if (response.success) {
        setHistory(response.paiements || []);
      }
    } catch (error) {
      console.error('Erreur historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const formatMontant = (montant) => {
    if (!montant) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  };

  return (
    <div className="timeline">
      {loading ? (
        <div className="loading">Chargement de l'historique...</div>
      ) : history.length === 0 ? (
        <div className="empty-history">Aucun historique de paiement disponible</div>
      ) : (
        history.map((item, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-date">
              <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
              {item.date_paiement ? formatDate(item.date_paiement) : '-'}
            </div>
            <div className="timeline-content">
              <div className="timeline-amount">
                <MoneyIcon fontSize="small" sx={{ mr: 1 }} />
                {formatMontant(item.montant)}
              </div>
              <div className="timeline-status">
                Mode: {item.mode_paiement || 'Non spécifié'}
              </div>
              {item.reference && (
                <div className="timeline-reference">
                  Référence: {item.reference}
                </div>
              )}
              {item.notes && (
                <div className="timeline-observations">
                  {item.notes}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Composant pour nouveau paiement
const NouveauPaiementForm = ({ facture, onSuccess }) => {
  const [formData, setFormData] = useState({
    montant: facture?.montant_restant || '',
    date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: 'ESPECES',
    reference: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const montant = parseFloat(formData.montant);
    const montantRestant = parseFloat(facture.montant_restant);
    
    if (isNaN(montant) || montant <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }
    
    if (montant > montantRestant) {
      alert(`Le montant ne peut pas dépasser le reste à payer: ${formatMontant(montantRestant)}`);
      return;
    }
    
    setLoading(true);
    
    try {
      const paiementPayload = {
        facture_id: facture.id,
        montant: montant,
        date_paiement: formData.date_paiement,
        mode_paiement: formData.mode_paiement,
        reference: formData.reference || `PAY-${Date.now()}`,
        notes: formData.notes,
        utilisateur_id: localStorage.getItem('userId') || 1
      };
      
      const response = await facturationAPI.enregistrerPaiement(paiementPayload);
      
      if (response.success) {
        alert('Paiement enregistré avec succès!');
        setFormData({
          montant: '',
          date_paiement: new Date().toISOString().split('T')[0],
          mode_paiement: 'ESPECES',
          reference: '',
          notes: ''
        });
        onSuccess();
      } else {
        throw new Error(response.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur enregistrement paiement:', error);
      alert(`Erreur: ${error.message}`);
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

  const formatMontant = (montant) => {
    if (!montant) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  };

  return (
    <form onSubmit={handleSubmit} className="declaration-form">
      <div className="form-section">
        <h3><PaymentIcon sx={{ mr: 1 }} /> Enregistrer un paiement</h3>
        
        <div className="form-group">
          <label htmlFor="montant">Montant *</label>
          <div className="input-with-icon">
            <MoneyIcon sx={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="number"
              id="montant"
              name="montant"
              value={formData.montant}
              onChange={handleChange}
              placeholder="Saisir le montant"
              required
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <div className="form-hint">
            Maximum: {formatMontant(facture.montant_restant)}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date_paiement">Date du paiement *</label>
            <div className="input-with-icon">
              <CalendarIcon sx={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type="date"
                id="date_paiement"
                name="date_paiement"
                value={formData.date_paiement}
                onChange={handleChange}
                required
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="mode_paiement">Mode de paiement *</label>
            <select
              id="mode_paiement"
              name="mode_paiement"
              value={formData.mode_paiement}
              onChange={handleChange}
              required
            >
              <option value="ESPECES">Espèces</option>
              <option value="CHEQUE">Chèque</option>
              <option value="VIREMENT">Virement bancaire</option>
              <option value="CARTE">Carte bancaire</option>
              <option value="MOBILE">Paiement mobile</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reference">Référence du paiement</label>
          <input
            type="text"
            id="reference"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            placeholder="N° de chèque, référence virement..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes (optionnel)</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Informations complémentaires..."
          />
        </div>
      </div>

      <div className="form-actions">
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Enregistrement en cours...' : 'Enregistrer le paiement'}
        </button>
      </div>
    </form>
  );
};

// Composant pour nouvelle facture
const NouvelleFactureForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    cod_ben: '',
    cod_payeur: '',
    date_facture: new Date().toISOString().split('T')[0],
    date_echeance: addDays(new Date(), 30).toISOString().split('T')[0],
    observations: '',
    prestations: []
  });
  const [payeurs, setPayeurs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [prestations, setPrestations] = useState([]);
  const [searchPatient, setSearchPatient] = useState('');
  const [searchPrestation, setSearchPrestation] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [filteredPrestations, setFilteredPrestations] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingPrestations, setLoadingPrestations] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPayeurs();
  }, []);

  useEffect(() => {
    if (searchPatient.length >= 2) {
      searchPatients();
    } else {
      setFilteredPatients([]);
    }
  }, [searchPatient]);

  useEffect(() => {
    if (searchPrestation.length >= 2) {
      searchPrestations();
    } else {
      setFilteredPrestations([]);
    }
  }, [searchPrestation]);

  const loadPayeurs = async () => {
    try {
      const response = await facturationAPI.getPayeurs();
      if (response.success && Array.isArray(response.payeurs)) {
        setPayeurs(response.payeurs);
      }
    } catch (error) {
      console.error('Erreur API payeurs:', error);
    }
  };

const searchPatients = async () => {
  if (searchPatient.length < 2) return;
  
  setLoadingPatients(true);
  try {
    // CORRECTION : Utiliser facturationAPI.searchPatients au lieu de patientsAPI.search
    const response = await facturationAPI.searchPatients(searchPatient, 20);
    if (response.success && Array.isArray(response.patients)) {
      setFilteredPatients(response.patients);
    } else {
      setFilteredPatients([]);
    }
  } catch (error) {
    console.error('Erreur recherche patients:', error);
    setFilteredPatients([]);
  } finally {
    setLoadingPatients(false);
  }
};

 const searchPrestations = async () => {
  if (searchPrestation.length < 2) return;
  
  setLoadingPrestations(true);
  try {
    // Utiliser facturationAPI.searchPrestations (maintenant définie)
    const response = await facturationAPI.searchPrestations(searchPrestation, 20);
    if (response.success && Array.isArray(response.prestations)) {
      setFilteredPrestations(response.prestations);
    }
  } catch (error) {
    console.error('Erreur recherche prestations:', error);
    setFilteredPrestations([]);
  } finally {
    setLoadingPrestations(false);
  }
};

  const selectPatient = (patient) => {
    setFormData(prev => ({
      ...prev,
      cod_ben: patient.id,
      patientInfo: `${patient.nom} ${patient.prenom}`
    }));
    setFilteredPatients([]);
    setSearchPatient(`${patient.nom} ${patient.prenom}`);
  };

  const addPrestation = (prestation) => {
    const nouvellePrestation = {
      id_prestation: prestation.id,
      type_prestation: prestation.type || 'consultation',
      libelle: prestation.libelle || prestation.nom,
      quantite: 1,
      prix_unitaire: prestation.prix || 0,
      montant: prestation.prix || 0
    };

    setFormData(prev => ({
      ...prev,
      prestations: [...prev.prestations, nouvellePrestation]
    }));
    setFilteredPrestations([]);
    setSearchPrestation('');
  };

  const updatePrestation = (index, field, value) => {
    const updatedPrestations = [...formData.prestations];
    
    if (field === 'quantite' || field === 'prix_unitaire') {
      const quantite = field === 'quantite' ? parseFloat(value) : updatedPrestations[index].quantite;
      const prix = field === 'prix_unitaire' ? parseFloat(value) : updatedPrestations[index].prix_unitaire;
      const montant = quantite * prix;
      
      updatedPrestations[index] = {
        ...updatedPrestations[index],
        [field]: parseFloat(value),
        montant: montant
      };
    } else {
      updatedPrestations[index] = {
        ...updatedPrestations[index],
        [field]: value
      };
    }

    setFormData(prev => ({
      ...prev,
      prestations: updatedPrestations
    }));
  };

  const removePrestation = (index) => {
    setFormData(prev => ({
      ...prev,
      prestations: prev.prestations.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.prestations.reduce((total, prestation) => {
      return total + (parseFloat(prestation.montant) || 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.cod_ben) {
      alert('Veuillez sélectionner un patient');
      return;
    }

    if (!formData.cod_payeur) {
      alert('Veuillez sélectionner un payeur');
      return;
    }

    if (formData.prestations.length === 0) {
      alert('Veuillez ajouter au moins une prestation');
      return;
    }

    setLoading(true);

    try {
      const factureData = {
        cod_ben: formData.cod_ben,
        cod_payeur: formData.cod_payeur,
        prestations: formData.prestations,
        date_facture: formData.date_facture,
        date_echeance: formData.date_echeance,
        observations: formData.observations
      };

      const response = await facturationAPI.createFacture(factureData);
      
      if (response.success) {
        alert('Facture créée avec succès!');
        setFormData({
          cod_ben: '',
          cod_payeur: '',
          date_facture: new Date().toISOString().split('T')[0],
          date_echeance: addDays(new Date(), 30).toISOString().split('T')[0],
          observations: '',
          prestations: []
        });
        setSearchPatient('');
        setSearchPrestation('');
        onSuccess();
      } else {
        throw new Error(response.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création facture:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant) => {
    if (!montant) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  };

  return (
    <form onSubmit={handleSubmit} className="declaration-form">
      <div className="form-section">
        <h3><ReceiptIcon sx={{ mr: 1 }} /> Informations générales</h3>
        
        <div className="form-group">
          <label htmlFor="patient">Patient *</label>
          <div className="input-with-icon">
            <PersonIcon sx={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              id="patient"
              value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
              placeholder="Rechercher un patient..."
              style={{ paddingLeft: '40px' }}
            />
            {loadingPatients && (
              <div className="spinner-small" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}></div>
            )}
          </div>
          
          {filteredPatients.length > 0 && (
            <div className="dropdown-list">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="dropdown-item"
                  onClick={() => selectPatient(patient)}
                >
                  <div className="dropdown-item-title">
                    {patient.nom} {patient.prenom}
                  </div>
                  <div className="dropdown-item-subtitle">
                    {patient.telephone} • {patient.identifiant}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {formData.patientInfo && (
            <div className="selected-item">
              <div className="selected-item-content">
                <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                <span>{formData.patientInfo}</span>
              </div>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => {
                  setFormData(prev => ({ ...prev, cod_ben: '', patientInfo: '' }));
                  setSearchPatient('');
                }}
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cod_payeur">Payeur *</label>
            <select
              id="cod_payeur"
              value={formData.cod_payeur}
              onChange={(e) => setFormData(prev => ({ ...prev, cod_payeur: e.target.value }))}
              required
            >
              <option value="">Sélectionner un payeur</option>
              {payeurs.map(payeur => (
                <option key={payeur.id} value={payeur.cod_payeur}>
                  {payeur.libelle} ({payeur.taux_couverture}% couverture)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date_facture">Date de facture</label>
            <div className="input-with-icon">
              <CalendarIcon sx={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type="date"
                id="date_facture"
                value={formData.date_facture}
                onChange={(e) => setFormData(prev => ({ ...prev, date_facture: e.target.value }))}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="date_echeance">Date d'échéance</label>
            <div className="input-with-icon">
              <CalendarIcon sx={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type="date"
                id="date_echeance"
                value={formData.date_echeance}
                onChange={(e) => setFormData(prev => ({ ...prev, date_echeance: e.target.value }))}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3><PackageIcon sx={{ mr: 1 }} /> Prestations</h3>
        
        <div className="form-group">
          <label>Ajouter des prestations *</label>
          <div className="input-with-icon">
            <SearchIcon sx={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              value={searchPrestation}
              onChange={(e) => setSearchPrestation(e.target.value)}
              placeholder="Rechercher une prestation..."
              style={{ paddingLeft: '40px' }}
            />
            {loadingPrestations && (
              <div className="spinner-small" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}></div>
            )}
          </div>
          
          {filteredPrestations.length > 0 && (
            <div className="dropdown-list">
              {filteredPrestations.map((prestation) => (
                <div
                  key={prestation.id}
                  className="dropdown-item"
                  onClick={() => addPrestation(prestation)}
                >
                  <div className="dropdown-item-title">
                    {prestation.libelle || prestation.nom}
                  </div>
                  <div className="dropdown-item-subtitle">
                    {prestation.type} • {formatMontant(prestation.prix)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {formData.prestations.length > 0 ? (
          <div className="prestations-list">
            <div className="prestations-header">
              <div className="header-col">Libellé</div>
              <div className="header-col">Quantité</div>
              <div className="header-col">Prix unitaire</div>
              <div className="header-col">Montant</div>
              <div className="header-col">Actions</div>
            </div>
            
            {formData.prestations.map((prestation, index) => (
              <div key={index} className="prestation-item">
                <div className="prestation-col">
                  <input
                    type="text"
                    value={prestation.libelle}
                    onChange={(e) => updatePrestation(index, 'libelle', e.target.value)}
                    className="form-control-sm"
                  />
                </div>
                <div className="prestation-col">
                  <input
                    type="number"
                    min="1"
                    value={prestation.quantite}
                    onChange={(e) => updatePrestation(index, 'quantite', e.target.value)}
                    className="form-control-sm"
                  />
                </div>
                <div className="prestation-col">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prestation.prix_unitaire}
                    onChange={(e) => updatePrestation(index, 'prix_unitaire', e.target.value)}
                    className="form-control-sm"
                  />
                </div>
                <div className="prestation-col">
                  <span className="prestation-amount">
                    {formatMontant(prestation.montant)}
                  </span>
                </div>
                <div className="prestation-col">
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removePrestation(index)}
                  >
                    <CloseIcon fontSize="small" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-prestations">
            <PackageIcon sx={{ fontSize: 48, color: '#ccc' }} />
            <p>Aucune prestation ajoutée</p>
          </div>
        )}
      </div>

      <div className="form-section">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="observations">Observations (optionnel)</label>
            <textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              rows="3"
              placeholder="Notes supplémentaires..."
            />
          </div>
          
          <div className="summary-card">
            <h4>Récapitulatif</h4>
            <div className="summary-content">
              <div className="summary-item">
                <span>Nombre de prestations:</span>
                <strong>{formData.prestations.length}</strong>
              </div>
              <div className="summary-item">
                <span>Total:</span>
                <strong className="total-amount">{formatMontant(calculateTotal())}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading || !formData.cod_ben || !formData.cod_payeur || formData.prestations.length === 0}
        >
          {loading ? 'Création en cours...' : 'Créer la facture'}
        </button>
      </div>
    </form>
  );
};

// Composant principal
const Facturation = () => {
  const [factures, setFactures] = useState([]);
  const [payeurs, setPayeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayeurs, setLoadingPayeurs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayeur, setSelectedPayeur] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    payees: 0,
    enAttente: 0,
    partiellement: 0,
    montantTotal: 0,
    montantRecu: 0
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [paiementModal, setPaiementModal] = useState(false);
  const [selectedPaiementFacture, setSelectedPaiementFacture] = useState(null);
  const [newFactureModal, setNewFactureModal] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
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
    loadFactures();
    loadStats();
    loadPayeurs();
  }, [filters.page]);

  const loadFactures = async () => {
    setLoading(true);
    try {
      const response = await facturationAPI.getFactures({
        page: filters.page,
        limit: filters.limit,
        search: searchTerm || undefined,
        statut: '',
        cod_payeur: selectedPayeur || undefined,
        date_debut: dateDebut || undefined,
        date_fin: dateFin || undefined
      });

      if (response.success) {
        setFactures(response.factures || []);
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
      console.error('Erreur chargement factures:', error);
      showSnackbar('Erreur de connexion au serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPayeurs = async () => {
    setLoadingPayeurs(true);
    try {
      const response = await facturationAPI.getPayeurs();
      if (response.success && Array.isArray(response.payeurs)) {
        setPayeurs(response.payeurs);
      }
    } catch (error) {
      console.error('Erreur API payeurs:', error);
    } finally {
      setLoadingPayeurs(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await facturationAPI.getStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    loadFactures();
    loadStats();
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedPayeur('');
    setDateDebut('');
    setDateFin('');
    setFilters(prev => ({ ...prev, page: 1 }));
    loadFactures();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= filters.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const showFactureDetails = (facture) => {
    setSelectedFacture(facture);
    setModalVisible(true);
  };

  const showPaiementForm = (facture) => {
    setSelectedPaiementFacture(facture);
    setPaiementModal(true);
  };

  const showNewFactureForm = () => {
    setNewFactureModal(true);
  };

  const handleTelechargerFacture = (id, numero) => {
    // Implémentation du téléchargement PDF
    showSnackbar(`Téléchargement de la facture ${numero}`, 'info');
  };

  const formatMontant = (montant) => {
    if (!montant) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const getStatutColor = (statut) => {
    switch(statut) {
      case 'Payée': return '#4caf50';
      case 'Partiellement payée': return '#ff9800';
      case 'En attente': return '#2196f3';
      case 'En retard': return '#f44336';
      default: return '#757575';
    }
  };

  const getStatutIcon = (statut) => {
    switch(statut) {
      case 'Payée': return <ValidIcon fontSize="small" />;
      case 'Partiellement payée': return <TimeIcon fontSize="small" />;
      case 'En retard': return <ErrorIcon fontSize="small" />;
      case 'En attente':
      default: return <PendingIcon fontSize="small" />;
    }
  };

  const isFactureEnRetard = (facture) => {
    if (!facture.date_echeance || facture.statut === 'Payée') return false;
    const aujourdhui = new Date();
    const echeance = new Date(facture.date_echeance);
    return echeance < aujourdhui;
  };

  const calculerStatsTable = () => {
    return {
      total: factures.length,
      montantTotal: factures.reduce((sum, f) => sum + (parseFloat(f.montant_total) || 0), 0),
      montantRecu: factures.reduce((sum, f) => sum + (parseFloat(f.montant_paye) || 0), 0),
      montantRestant: factures.reduce((sum, f) => sum + (parseFloat(f.montant_restant) || 0), 0)
    };
  };

  const statsTable = calculerStatsTable();

  return (
    <div className="remboursements-container">
      <div className="header">
        <h1><ReceiptIcon sx={{ mr: 2, verticalAlign: 'middle' }} /> Gestion des Factures</h1>
        <p>Création, suivi et paiement des factures des patients</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><DescriptionIcon fontSize="large" /></div>
          <h3>Total Factures</h3>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><CheckCircleIcon fontSize="large" /></div>
          <h3>Factures Payées</h3>
          <div className="stat-value">{stats.payees}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TimeIcon fontSize="large" /></div>
          <h3>En Attente</h3>
          <div className="stat-value">{stats.enAttente}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><MoneyIcon fontSize="large" /></div>
          <h3>Montant Total</h3>
          <div className="stat-value">{formatMontant(stats.montantTotal)}</div>
        </div>
      </div>

      {/* Onglets */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <DescriptionIcon sx={{ mr: 1 }} /> Liste des Factures
        </button>
        <button 
          className={`tab ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          <AddIcon sx={{ mr: 1 }} /> Nouvelle Facture
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'list' && (
        <div className="tab-content">
          <div className="filters">
            <div className="filter-group">
              <label>Recherche:</label>
              <div className="input-with-icon">
                <SearchIcon sx={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Numéro, patient, téléphone..."
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Payeur:</label>
              <select
                value={selectedPayeur}
                onChange={(e) => setSelectedPayeur(e.target.value)}
                disabled={loadingPayeurs}
              >
                <option value="">Tous les payeurs</option>
                {payeurs.map(payeur => (
                  <option key={payeur.id} value={payeur.cod_payeur}>
                    {payeur.libelle}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Date début:</label>
              <div className="input-with-icon">
                <CalendarIcon sx={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Date fin:</label>
              <div className="input-with-icon">
                <CalendarIcon sx={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="filter-actions">
              <button 
                className="btn btn-primary"
                onClick={handleSearch}
              >
                <SearchIcon sx={{ mr: 1 }} /> Rechercher
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={handleReset}
              >
                <RefreshIcon sx={{ mr: 1 }} /> Réinitialiser
              </button>
            </div>
          </div>

          {/* Tableau des factures */}
          <div className="table-container">
            {loading ? (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <p>Chargement des factures...</p>
              </div>
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>N° Facture</th>
                      <th>Patient</th>
                      <th>Date</th>
                      <th>Montant Total</th>
                      <th>Payé</th>
                      <th>Restant</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factures.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="empty-cell">
                          Aucune facture trouvée
                        </td>
                      </tr>
                    ) : (
                      factures.map((facture) => (
                        <tr key={facture.id}>
                          <td>
                            <strong>#{facture.numero}</strong>
                          </td>
                          <td>
                            <div className="beneficiary-info">
                              <div className="beneficiary-name">
                                <PersonIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                                {facture.nom_ben} {facture.prenom_ben}
                              </div>
                              <div className="beneficiary-id">
                                {facture.telephone_ben || '-'}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <CalendarIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                              {formatDate(facture.date_facture)}
                            </div>
                            <div className="small-text">
                              Échéance: {formatDate(facture.date_echeance)}
                              {isFactureEnRetard(facture) && (
                                <span className="badge badge-danger ml-2">En retard</span>
                              )}
                            </div>
                          </td>
                          <td className="amount">{formatMontant(facture.montant_total)}</td>
                          <td className="amount">{formatMontant(facture.montant_paye)}</td>
                          <td className="amount">{formatMontant(facture.montant_restant)}</td>
                          <td>
                            <span 
                              className="status-badge"
                              style={{ backgroundColor: getStatutColor(facture.statut) }}
                            >
                              {getStatutIcon(facture.statut)}
                              {facture.statut}
                            </span>
                          </td>
                          <td className="actions">
                            <div className="action-buttons">
                              <Tooltip title="Voir détails">
                                <IconButton 
                                  size="small"
                                  className="btn btn-sm btn-view"
                                  onClick={() => showFactureDetails(facture)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Télécharger PDF">
                                <IconButton 
                                  size="small"
                                  className="btn btn-sm btn-history"
                                  onClick={() => handleTelechargerFacture(facture.id, facture.numero)}
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                              
                              {facture.montant_restant > 0 && (
                                <Tooltip title="Enregistrer paiement">
                                  <IconButton 
                                    size="small"
                                    className="btn btn-sm btn-pay"
                                    onClick={() => showPaiementForm(facture)}
                                  >
                                    <PaymentIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                
                {/* Pagination */}
                {factures.length > 0 && (
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

                {/* Résumé du tableau */}
                {factures.length > 0 && (
                  <div className="table-summary">
                    <div className="summary-stats">
                      <span className="stat-item">
                        {factures.length} factures • 
                        Total: {formatMontant(statsTable.montantTotal)} • 
                        Payé: {formatMontant(statsTable.montantRecu)} • 
                        Restant: {formatMontant(statsTable.montantRestant)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'new' && (
        <div className="tab-content">
          <NouvelleFactureForm onSuccess={() => {
            loadFactures();
            loadStats();
            showSnackbar('Facture créée avec succès');
            setActiveTab('list');
          }} />
        </div>
      )}

      {/* Modal Détails Facture */}
      {modalVisible && selectedFacture && (
        <div className="modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Détails de la Facture #{selectedFacture.numero}</h2>
              <IconButton 
                className="close-btn" 
                onClick={() => setModalVisible(false)}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </div>
            <div className="modal-body">
              <FactureDetails facture={selectedFacture} />
              
              <div className="modal-tabs">
                <button className="modal-tab active">
                  <HistoryIcon sx={{ mr: 1 }} /> Historique des Paiements
                </button>
              </div>
              
              <HistoriquePaiements factureId={selectedFacture.id} />
              
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setModalVisible(false)}
                >
                  Fermer
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setModalVisible(false);
                    showPaiementForm(selectedFacture);
                  }}
                  disabled={selectedFacture.montant_restant <= 0}
                >
                  <PaymentIcon sx={{ mr: 1 }} /> Enregistrer un paiement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouveau Paiement */}
      {paiementModal && selectedPaiementFacture && (
        <div className="modal-overlay" onClick={() => setPaiementModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enregistrer un paiement</h2>
              <IconButton 
                className="close-btn" 
                onClick={() => setPaiementModal(false)}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </div>
            <div className="modal-body">
              <div className="paiement-info">
                <h3>Facture #{selectedPaiementFacture.numero}</h3>
                <p>Montant restant: {formatMontant(selectedPaiementFacture.montant_restant)}</p>
              </div>
              <NouveauPaiementForm 
                facture={selectedPaiementFacture}
                onSuccess={() => {
                  setPaiementModal(false);
                  loadFactures();
                  loadStats();
                  showSnackbar('Paiement enregistré avec succès');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouvelle Facture */}
      {newFactureModal && (
        <div className="modal-overlay" onClick={() => setNewFactureModal(false)}>
          <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Créer une nouvelle facture</h2>
              <IconButton 
                className="close-btn" 
                onClick={() => setNewFactureModal(false)}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </div>
            <div className="modal-body">
              <NouvelleFactureForm 
                onSuccess={() => {
                  setNewFactureModal(false);
                  loadFactures();
                  loadStats();
                  showSnackbar('Facture créée avec succès');
                }}
              />
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

export default Facturation;