// components/FactureDialog.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Alert,
  Typography,
  Grid,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { facturationAPI, patientsAPI } from '../../services/api';

const FactureDialog = ({ open, mode, data, onClose, onSubmit, loading }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    beneficiaire_id: '',
    payeur_id: '',
    date_facture: new Date(),
    date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    observations: '',
    factures: [
      {
        id: Date.now(),
        type: 'consultation',
        libelle: 'Facture Consultation',
        prestations: [
          {
            id: Date.now() + 1,
            type_prestation: 'consultation',
            libelle: 'Consultation médicale',
            quantite: 1,
            prix_unitaire: 5000,
            montant: 5000,
            date_execution: new Date()
          }
        ]
      }
    ]
  });
  
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [payeurs, setPayeurs] = useState([]);
  const [selectedBeneficiaireInfo, setSelectedBeneficiaireInfo] = useState(null);
  const [selectedPayeurInfo, setSelectedPayeurInfo] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiLoading, setApiLoading] = useState(false);

  const steps = ['Information client', 'Détails des factures', 'Validation'];

  const generateUniqueId = () => Date.now() + Math.floor(Math.random() * 1000);

  // Fonction pour charger les informations détaillées du bénéficiaire
  const loadBeneficiaireDetails = useCallback(async (beneficiaireId) => {
    if (!beneficiaireId) {
      setSelectedBeneficiaireInfo(null);
      return;
    }
    
    try {
      // Chercher dans la liste déjà chargée
      const existingBen = beneficiaires.find(b => b.id === Number(beneficiaireId));
      if (existingBen) {
        setSelectedBeneficiaireInfo(existingBen);
        return;
      }
      
      // Charger depuis l'API si pas dans la liste
      setApiLoading(true);
      const response = await patientsAPI.getById(beneficiaireId);
      if (response.success && response.beneficiaire) {
        const beneficiaire = response.beneficiaire;
        const formattedBeneficiaire = {
          id: beneficiaire.id || beneficiaire.ID_BEN || beneficiaire.beneficiaire_id,
          nom: beneficiaire.nom || beneficiaire.NOM_BEN || '',
          prenom: beneficiaire.prenom || beneficiaire.PRE_BEN || '',
          identifiant: beneficiaire.identifiant || beneficiaire.IDENTIFIANT_NATIONAL || '',
          sexe: beneficiaire.sexe || beneficiaire.SEX_BEN || '',
          date_naissance: beneficiaire.date_naissance || beneficiaire.NAI_BEN || null,
          telephone: beneficiaire.telephone || beneficiaire.TELEPHONE_MOBILE || '',
          email: beneficiaire.email || beneficiaire.EMAIL || '',
          adresse: beneficiaire.adresse || beneficiaire.ADRESSE || '',
          ville: beneficiaire.ville || beneficiaire.VILLE || '',
          code_postal: beneficiaire.code_postal || beneficiaire.CODE_POSTAL || '',
          assurance: beneficiaire.assurance || beneficiaire.ASSURANCE || '',
          numero_assurance: beneficiaire.numero_assurance || beneficiaire.NUMERO_ASSURANCE || '',
        };
        setSelectedBeneficiaireInfo(formattedBeneficiaire);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails du bénéficiaire:', error);
      // Essayer de trouver dans la liste des bénéficiaires déjà chargés
      const existingBen = beneficiaires.find(b => b.id === Number(beneficiaireId));
      if (existingBen) {
        setSelectedBeneficiaireInfo(existingBen);
      } else {
        setSelectedBeneficiaireInfo(null);
      }
    } finally {
      setApiLoading(false);
    }
  }, [beneficiaires]);

  // Fonction pour charger les informations détaillées du payeur
  const loadPayeurDetails = useCallback(async (payeurId) => {
    if (!payeurId) {
      setSelectedPayeurInfo(null);
      return;
    }
    
    try {
      // Chercher dans la liste déjà chargée
      const existingPayeur = payeurs.find(p => p.id === Number(payeurId));
      if (existingPayeur) {
        setSelectedPayeurInfo(existingPayeur);
        return;
      }
      
      // Charger depuis l'API si pas dans la liste
      setApiLoading(true);
      const response = await facturationAPI.getPayeurById(payeurId);
      if (response.success && response.payeur) {
        const payeur = response.payeur;
        const formattedPayeur = {
          id: payeur.id || payeur.payeur_id || payeur.cod_payeur,
          libelle: payeur.libelle || payeur.LIBELLE || 'Payeur inconnu',
          taux_couverture: Number(payeur.taux_couverture) || Number(payeur.TAUX_COUVERTURE) || 0,
          type_payeur: payeur.type_payeur || payeur.TYPE_PAYEUR || 'assurance',
          adresse: payeur.adresse || payeur.ADRESSE || '',
          telephone: payeur.telephone || payeur.TELEPHONE || '',
          email: payeur.email || payeur.EMAIL || '',
          contact: payeur.contact || payeur.CONTACT || '',
          conditions_paiement: payeur.conditions_paiement || payeur.CONDITIONS_PAIEMENT || '',
          delai_paiement: payeur.delai_paiement || payeur.DELAI_PAIEMENT || 30,
        };
        setSelectedPayeurInfo(formattedPayeur);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails du payeur:', error);
      // Essayer de trouver dans la liste des payeurs déjà chargés
      const existingPayeur = payeurs.find(p => p.id === Number(payeurId));
      if (existingPayeur) {
        setSelectedPayeurInfo(existingPayeur);
      } else {
        setSelectedPayeurInfo(null);
      }
    } finally {
      setApiLoading(false);
    }
  }, [payeurs]);

  useEffect(() => {
    if (mode === 'edit' && data && open) {
      // Utiliser les nouveaux noms de champs
      const formattedData = {
        beneficiaire_id: data.beneficiaire_id || data.cod_ben || '',
        payeur_id: data.payeur_id || data.cod_payeur || '',
        date_facture: data.date_facture ? new Date(data.date_facture) : new Date(),
        date_echeance: data.date_echeance ? new Date(data.date_echeance) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        observations: data.observations || '',
        factures: (Array.isArray(data.factures) ? data.factures : [data]).map((f, idx) => ({
          id: f.id || generateUniqueId(),
          type: f.type || f.type_facture || 'consultation',
          libelle: f.libelle || f.libelle_facture || `Facture ${idx + 1}`,
          prestations: (Array.isArray(f.prestations) ? f.prestations : []).map((p, pIdx) => ({
            id: p.id || generateUniqueId(),
            type_prestation: p.type_prestation || 'consultation',
            libelle: p.libelle || '',
            quantite: Number(p.quantite) || 1,
            prix_unitaire: Number(p.prix_unitaire) || 0,
            montant: Number(p.montant) || 0,
            date_execution: p.date_execution ? new Date(p.date_execution) : new Date()
          }))
        }))
      };
      
      setFormData(formattedData);
      
      // Charger les détails du bénéficiaire et du payeur en mode édition
      if (formattedData.beneficiaire_id) {
        setTimeout(() => {
          loadBeneficiaireDetails(formattedData.beneficiaire_id);
        }, 100);
      }
      
      if (formattedData.payeur_id) {
        setTimeout(() => {
          loadPayeurDetails(formattedData.payeur_id);
        }, 100);
      }
    } else if (!open) {
      // Reset form when dialog closes
      setFormData({
        beneficiaire_id: '',
        payeur_id: '',
        date_facture: new Date(),
        date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        observations: '',
        factures: [
          {
            id: generateUniqueId(),
            type: 'consultation',
            libelle: 'Facture Consultation',
            prestations: [
              {
                id: generateUniqueId(),
                type_prestation: 'consultation',
                libelle: 'Consultation médicale',
                quantite: 1,
                prix_unitaire: 5000,
                montant: 5000,
                date_execution: new Date()
              }
            ]
          }
        ]
      });
      setActiveStep(0);
      setActiveTab(0);
      setSelectedBeneficiaireInfo(null);
      setSelectedPayeurInfo(null);
      setErrors({});
    }
  }, [mode, data, open, loadBeneficiaireDetails, loadPayeurDetails]);

  const loadBeneficiaires = useCallback(async () => {
    if (!open) return;
    
    setApiLoading(true);
    try {
      const response = await patientsAPI.getAll(100, 1);
      
      let formattedBeneficiaires = [];
      
      if (response.success && Array.isArray(response.beneficiaires)) {
        formattedBeneficiaires = response.beneficiaires.map(ben => ({
          id: ben.id || ben.ID_BEN || ben.beneficiaire_id,
          nom: ben.nom || ben.NOM_BEN || '',
          prenom: ben.prenom || ben.PRE_BEN || '',
          identifiant: ben.identifiant || ben.IDENTIFIANT_NATIONAL || '',
          sexe: ben.sexe || ben.SEX_BEN || '',
          date_naissance: ben.date_naissance || ben.NAI_BEN || null,
          telephone: ben.telephone || ben.TELEPHONE_MOBILE || '',
          email: ben.email || ben.EMAIL || '',
          adresse: ben.adresse || ben.ADRESSE || '',
          ville: ben.ville || ben.VILLE || '',
          code_postal: ben.code_postal || ben.CODE_POSTAL || '',
          assurance: ben.assurance || ben.ASSURANCE || '',
          numero_assurance: ben.numero_assurance || ben.NUMERO_ASSURANCE || ''
        }));
      } else if (Array.isArray(response)) {
        formattedBeneficiaires = response.map(ben => ({
          id: ben.ID_BEN || ben.id || ben.beneficiaire_id,
          nom: ben.NOM_BEN || ben.nom || '',
          prenom: ben.PRE_BEN || ben.prenom || '',
          identifiant: ben.IDENTIFIANT_NATIONAL || ben.identifiant || '',
          sexe: ben.SEX_BEN || ben.sexe || '',
          date_naissance: ben.NAI_BEN || ben.date_naissance || null,
          telephone: ben.TELEPHONE_MOBILE || ben.telephone || '',
          email: ben.EMAIL || ben.email || '',
          adresse: ben.ADRESSE || ben.adresse || '',
          ville: ben.VILLE || ben.ville || '',
          code_postal: ben.CODE_POSTAL || ben.code_postal || '',
          assurance: ben.ASSURANCE || ben.assurance || '',
          numero_assurance: ben.NUMERO_ASSURANCE || ben.numero_assurance || ''
        }));
      }
      
      setBeneficiaires(formattedBeneficiaires);
      
      // Si un bénéficiaire est déjà sélectionné, mettre à jour les informations
      if (formData.beneficiaire_id) {
        const selectedBen = formattedBeneficiaires.find(b => b.id === Number(formData.beneficiaire_id));
        if (selectedBen) {
          setSelectedBeneficiaireInfo(selectedBen);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des bénéficiaires:', error);
      setBeneficiaires([]);
    } finally {
      setApiLoading(false);
    }
  }, [open, formData.beneficiaire_id]);

  const loadPayeurs = useCallback(async () => {
    if (!open) return;
    
    try {
      const response = await facturationAPI.getPayeurs();
      
      let formattedPayeurs = [];
      
      if (response.success && Array.isArray(response.payeurs)) {
        formattedPayeurs = response.payeurs.map(payeur => ({
          id: payeur.id || payeur.payeur_id || payeur.cod_payeur,
          libelle: payeur.libelle || payeur.LIBELLE || 'Payeur inconnu',
          taux_couverture: Number(payeur.taux_couverture) || Number(payeur.TAUX_COUVERTURE) || 0,
          type_payeur: payeur.type_payeur || payeur.TYPE_PAYEUR || 'assurance',
          adresse: payeur.adresse || payeur.ADRESSE || '',
          telephone: payeur.telephone || payeur.TELEPHONE || '',
          email: payeur.email || payeur.EMAIL || '',
          contact: payeur.contact || payeur.CONTACT || '',
          conditions_paiement: payeur.conditions_paiement || payeur.CONDITIONS_PAIEMENT || '',
          delai_paiement: payeur.delai_paiement || payeur.DELAI_PAIEMENT || 30
        }));
      } else if (Array.isArray(response)) {
        formattedPayeurs = response.map(payeur => ({
          id: payeur.id || payeur.payeur_id || payeur.cod_payeur,
          libelle: payeur.libelle || payeur.LIBELLE || 'Payeur inconnu',
          taux_couverture: Number(payeur.taux_couverture) || Number(payeur.TAUX_COUVERTURE) || 0,
          type_payeur: payeur.type_payeur || payeur.TYPE_PAYEUR || 'assurance',
          adresse: payeur.adresse || payeur.ADRESSE || '',
          telephone: payeur.telephone || payeur.TELEPHONE || '',
          email: payeur.email || payeur.EMAIL || '',
          contact: payeur.contact || payeur.CONTACT || '',
          conditions_paiement: payeur.conditions_paiement || payeur.CONDITIONS_PAIEMENT || '',
          delai_paiement: payeur.delai_paiement || payeur.DELAI_PAIEMENT || 30
        }));
      } else {
        formattedPayeurs = [
          { 
            id: 1, 
            libelle: 'Assurance Santé A', 
            taux_couverture: 80, 
            type_payeur: 'assurance',
            adresse: '123 Rue de la Santé, Paris',
            telephone: '01 23 45 67 89',
            email: 'contact@assurance-a.fr',
            contact: 'M. Dupont',
            conditions_paiement: 'Paiement sous 30 jours',
            delai_paiement: 30
          },
          { 
            id: 2, 
            libelle: 'Mutuelle B', 
            taux_couverture: 70, 
            type_payeur: 'mutuelle',
            adresse: '456 Avenue des Soins, Lyon',
            telephone: '04 56 78 90 12',
            email: 'info@mutuelle-b.fr',
            contact: 'Mme Martin',
            conditions_paiement: 'Paiement sous 45 jours',
            delai_paiement: 45
          },
          { 
            id: 3, 
            libelle: 'Patient (paiement direct)', 
            taux_couverture: 0, 
            type_payeur: 'patient',
            adresse: '',
            telephone: '',
            email: '',
            contact: '',
            conditions_paiement: 'Paiement comptant',
            delai_paiement: 0
          },
          { 
            id: 4, 
            libelle: 'État/CNSS', 
            taux_couverture: 100, 
            type_payeur: 'etat',
            adresse: 'Ministère de la Santé, Dakar',
            telephone: '33 849 00 00',
            email: 'cnss@etat.sn',
            contact: 'Service Facturation',
            conditions_paiement: 'Paiement sous 60 jours',
            delai_paiement: 60
          }
        ];
      }
      
      setPayeurs(formattedPayeurs);
      
      // Si un payeur est déjà sélectionné, mettre à jour les informations
      if (formData.payeur_id) {
        const selectedPayeur = formattedPayeurs.find(p => p.id === Number(formData.payeur_id));
        if (selectedPayeur) {
          setSelectedPayeurInfo(selectedPayeur);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des payeurs:', error);
      setPayeurs([
        { 
          id: 1, 
          libelle: 'Assurance Santé A', 
          taux_couverture: 80, 
          type_payeur: 'assurance',
          adresse: '123 Rue de la Santé, Paris',
          telephone: '01 23 45 67 89',
          email: 'contact@assurance-a.fr',
          contact: 'M. Dupont'
        },
        { 
          id: 2, 
          libelle: 'Mutuelle B', 
          taux_couverture: 70, 
          type_payeur: 'mutuelle',
          adresse: '456 Avenue des Soins, Lyon',
          telephone: '04 56 78 90 12',
          email: 'info@mutuelle-b.fr',
          contact: 'Mme Martin'
        },
        { 
          id: 3, 
          libelle: 'Patient (paiement direct)', 
          taux_couverture: 0, 
          type_payeur: 'patient',
          adresse: '',
          telephone: '',
          email: '',
          contact: ''
        }
      ]);
    }
  }, [open, formData.payeur_id]);

  useEffect(() => {
    if (open) {
      loadBeneficiaires();
      loadPayeurs();
    }
  }, [open, loadBeneficiaires, loadPayeurs]);

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0:
        if (!formData.beneficiaire_id) {
          newErrors.beneficiaire_id = 'Bénéficiaire requis';
        }
        if (!formData.payeur_id) {
          newErrors.payeur_id = 'Payeur requis';
        }
        if (formData.date_echeance && formData.date_facture && formData.date_echeance < formData.date_facture) {
          newErrors.date_echeance = 'La date d\'échéance doit être postérieure à la date de facturation';
        }
        break;
        
      case 1:
        formData.factures.forEach((facture, factureIndex) => {
          if (!facture.libelle || facture.libelle.trim() === '') {
            newErrors[`facture_${factureIndex}_libelle`] = 'Libellé de la facture requis';
          }
          
          if (!facture.prestations || facture.prestations.length === 0) {
            newErrors[`facture_${factureIndex}_prestations`] = 'Au moins une prestation est requise';
          } else {
            facture.prestations.forEach((prestation, prestationIndex) => {
              if (!prestation.libelle || prestation.libelle.trim() === '') {
                newErrors[`facture_${factureIndex}_prestation_${prestationIndex}_libelle`] = 'Libellé requis';
              }
              if (!prestation.prix_unitaire || prestation.prix_unitaire <= 0) {
                newErrors[`facture_${factureIndex}_prestation_${prestationIndex}_prix`] = 'Prix unitaire invalide';
              }
              if (!prestation.quantite || prestation.quantite <= 0) {
                newErrors[`facture_${factureIndex}_prestation_${prestationIndex}_quantite`] = 'Quantité invalide';
              }
            });
          }
        });
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleChange = (field) => async (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
    
    // Charger les détails lorsque le bénéficiaire ou le payeur change
    if (field === 'beneficiaire_id' && value) {
      await loadBeneficiaireDetails(value);
    } else if (field === 'beneficiaire_id' && !value) {
      setSelectedBeneficiaireInfo(null);
    }
    
    if (field === 'payeur_id' && value) {
      await loadPayeurDetails(value);
    } else if (field === 'payeur_id' && !value) {
      setSelectedPayeurInfo(null);
    }
  };

  const handleDateChange = (field) => (date) => {
    setFormData(prev => ({ ...prev, [field]: date }));
    if (field === 'date_facture' && date && formData.date_echeance && formData.date_echeance < date) {
      setErrors(prev => ({ ...prev, date_echeance: 'La date d\'échéance doit être postérieure à la date de facturation' }));
    } else {
      setErrors(prev => ({ ...prev, date_echeance: null }));
    }
  };

  const handleFactureChange = (factureIndex, field, value) => {
    const updatedFactures = [...formData.factures];
    updatedFactures[factureIndex] = {
      ...updatedFactures[factureIndex],
      [field]: value
    };
    
    setFormData(prev => ({ ...prev, factures: updatedFactures }));
  };

  const handlePrestationChange = (factureIndex, prestationIndex, field, value) => {
    const updatedFactures = [...formData.factures];
    const updatedPrestations = [...updatedFactures[factureIndex].prestations];
    
    updatedPrestations[prestationIndex] = {
      ...updatedPrestations[prestationIndex],
      [field]: field === 'quantite' || field === 'prix_unitaire' ? Number(value) : value
    };
    
    if (field === 'prix_unitaire' || field === 'quantite') {
      const prix = Number(updatedPrestations[prestationIndex].prix_unitaire) || 0;
      const quantite = Number(updatedPrestations[prestationIndex].quantite) || 1;
      updatedPrestations[prestationIndex].montant = prix * quantite;
    }
    
    updatedFactures[factureIndex].prestations = updatedPrestations;
    setFormData(prev => ({ ...prev, factures: updatedFactures }));
    
    const errorKey = `facture_${factureIndex}_prestation_${prestationIndex}_${field}`;
    setErrors(prev => ({ ...prev, [errorKey]: null }));
  };

  const addPrestation = (factureIndex) => {
    const updatedFactures = [...formData.factures];
    const newPrestation = {
      id: generateUniqueId(),
      type_prestation: 'consultation',
      libelle: '',
      quantite: 1,
      prix_unitaire: 0,
      montant: 0,
      date_execution: new Date()
    };
    
    updatedFactures[factureIndex].prestations.push(newPrestation);
    setFormData(prev => ({ ...prev, factures: updatedFactures }));
  };

  const removePrestation = (factureIndex, prestationIndex) => {
    const updatedFactures = [...formData.factures];
    if (updatedFactures[factureIndex].prestations.length > 1) {
      updatedFactures[factureIndex].prestations = updatedFactures[factureIndex].prestations.filter((_, i) => i !== prestationIndex);
      setFormData(prev => ({ ...prev, factures: updatedFactures }));
    }
  };

  const duplicateFacture = (factureIndex) => {
    const updatedFactures = [...formData.factures];
    const factureToDuplicate = { ...updatedFactures[factureIndex] };
    const duplicatedFacture = {
      ...factureToDuplicate,
      id: generateUniqueId(),
      libelle: `${factureToDuplicate.libelle} (Copie)`,
      prestations: factureToDuplicate.prestations.map(prestation => ({
        ...prestation,
        id: generateUniqueId()
      }))
    };
    
    updatedFactures.push(duplicatedFacture);
    setFormData(prev => ({ ...prev, factures: updatedFactures }));
    setActiveTab(updatedFactures.length - 1);
  };

  const addFacture = () => {
    const newFacture = {
      id: generateUniqueId(),
      type: 'consultation',
      libelle: `Facture ${formData.factures.length + 1}`,
      prestations: [{
        id: generateUniqueId(),
        type_prestation: 'consultation',
        libelle: '',
        quantite: 1,
        prix_unitaire: 0,
        montant: 0,
        date_execution: new Date()
      }]
    };
    setFormData(prev => ({ 
      ...prev, 
      factures: [...prev.factures, newFacture] 
    }));
    setActiveTab(formData.factures.length);
  };

  const removeFacture = (factureIndex) => {
    if (formData.factures.length <= 1) {
      alert('Vous devez avoir au moins une facture');
      return;
    }
    
    const updatedFactures = formData.factures.filter((_, i) => i !== factureIndex);
    setFormData(prev => ({ ...prev, factures: updatedFactures }));
    
    if (activeTab >= updatedFactures.length) {
      setActiveTab(updatedFactures.length - 1);
    }
  };

  const calculateTotals = () => {
    const totals = [];
    let grandTotal = 0;
    let grandPriseEnCharge = 0;
    let grandReste = 0;
    
    const tauxCouverture = selectedPayeurInfo?.taux_couverture || 0;
    
    formData.factures.forEach(facture => {
      const total = facture.prestations.reduce((sum, prestation) => sum + (Number(prestation.montant) || 0), 0);
      const priseEnCharge = (total * tauxCouverture) / 100;
      const reste = total - priseEnCharge;
      
      totals.push({
        total,
        priseEnCharge,
        reste,
        tauxCouverture
      });
      
      grandTotal += total;
      grandPriseEnCharge += priseEnCharge;
      grandReste += reste;
    });
    
    return { totals, grandTotal, grandPriseEnCharge, grandReste, tauxCouverture };
  };

  const handleSubmit = async () => {
    if (validateStep(activeStep)) {
      const { totals } = calculateTotals();
      
      try {
        // Prendre seulement la première facture
        const facture = formData.factures[0];
        const factureTotals = totals[0];
        
        // Préparer l'objet à envoyer (OBJET SIMPLE, pas de tableau)
        const dataToSend = {
          cod_ben: Number(formData.beneficiaire_id),
          cod_payeur: Number(formData.payeur_id),
          date_facture: formData.date_facture,
          date_echeance: formData.date_echeance,
          observations: formData.observations || '',
          prestations: (facture.prestations || []).map(prestation => ({
            type_prestation: prestation.type_prestation || 'consultation',
            libelle: prestation.libelle || '',
            quantite: Number(prestation.quantite) || 1,
            prix_unitaire: Number(prestation.prix_unitaire) || 0,
            montant: Number(prestation.montant) || 0,
            date_execution: prestation.date_execution || new Date()
          }))
        };
        
        // Debug
        console.log('✅ Données à envoyer (objet simple):', dataToSend);
        
        // Envoyer l'objet directement
        onSubmit(dataToSend);
        
      } catch (error) {
        console.error('Erreur lors de la préparation des factures:', error);
        alert(`Erreur: ${error.message}`);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'Non définie';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Date invalide';
      
      return dateObj.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const getStepContent = (step) => {
    const { totals, grandTotal, grandPriseEnCharge, grandReste } = calculateTotals();

    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.beneficiaire_id} disabled={apiLoading}>
                <InputLabel>Bénéficiaire</InputLabel>
                <Select
                  value={formData.beneficiaire_id}
                  label="Bénéficiaire"
                  onChange={handleChange('beneficiaire_id')}
                >
                  <MenuItem value="">Sélectionner un bénéficiaire</MenuItem>
                  {beneficiaires.map((ben) => (
                    <MenuItem key={ben.id} value={ben.id}>
                      {ben.nom} {ben.prenom} {ben.identifiant ? `(${ben.identifiant})` : ''}
                    </MenuItem>
                  ))}
                </Select>
                {errors.beneficiaire_id && (
                  <Typography variant="caption" color="error">
                    {errors.beneficiaire_id}
                  </Typography>
                )}
              </FormControl>
              
              {selectedBeneficiaireInfo && (
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom color="primary">
                      Informations du bénéficiaire
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Nom complet:</strong> {selectedBeneficiaireInfo.nom} {selectedBeneficiaireInfo.prenom}
                        </Typography>
                      </Grid>
                      {selectedBeneficiaireInfo.identifiant && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Identifiant:</strong> {selectedBeneficiaireInfo.identifiant}
                          </Typography>
                        </Grid>
                      )}
                      {selectedBeneficiaireInfo.date_naissance && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Date naissance:</strong> {formatDate(selectedBeneficiaireInfo.date_naissance)}
                          </Typography>
                        </Grid>
                      )}
                      {selectedBeneficiaireInfo.sexe && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Sexe:</strong> {selectedBeneficiaireInfo.sexe}
                          </Typography>
                        </Grid>
                      )}
                      {selectedBeneficiaireInfo.telephone && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Téléphone:</strong> {selectedBeneficiaireInfo.telephone}
                          </Typography>
                        </Grid>
                      )}
                      {selectedBeneficiaireInfo.email && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Email:</strong> {selectedBeneficiaireInfo.email}
                          </Typography>
                        </Grid>
                      )}
                      {selectedBeneficiaireInfo.adresse && (
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Adresse:</strong> {selectedBeneficiaireInfo.adresse} {selectedBeneficiaireInfo.code_postal} {selectedBeneficiaireInfo.ville}
                          </Typography>
                        </Grid>
                      )}
                      {selectedBeneficiaireInfo.assurance && (
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Assurance:</strong> {selectedBeneficiaireInfo.assurance} {selectedBeneficiaireInfo.numero_assurance ? `(N° ${selectedBeneficiaireInfo.numero_assurance})` : ''}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.payeur_id}>
                <InputLabel>Payeur</InputLabel>
                <Select
                  value={formData.payeur_id}
                  label="Payeur"
                  onChange={handleChange('payeur_id')}
                >
                  <MenuItem value="">Sélectionner un payeur</MenuItem>
                  {payeurs.map((payeur) => (
                    <MenuItem key={payeur.id} value={payeur.id}>
                      {payeur.libelle} ({payeur.taux_couverture}% couverture)
                    </MenuItem>
                  ))}
                </Select>
                {errors.payeur_id && (
                  <Typography variant="caption" color="error">
                    {errors.payeur_id}
                  </Typography>
                )}
              </FormControl>
              
              {selectedPayeurInfo && (
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom color="primary">
                      Informations du payeur
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Type de payeur:</strong> {selectedPayeurInfo.type_payeur || 'Non spécifié'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Taux de couverture:</strong> {selectedPayeurInfo.taux_couverture}%
                        </Typography>
                      </Grid>
                      {selectedPayeurInfo.contact && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Contact:</strong> {selectedPayeurInfo.contact}
                          </Typography>
                        </Grid>
                      )}
                      {selectedPayeurInfo.telephone && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Téléphone:</strong> {selectedPayeurInfo.telephone}
                          </Typography>
                        </Grid>
                      )}
                      {selectedPayeurInfo.email && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Email:</strong> {selectedPayeurInfo.email}
                          </Typography>
                        </Grid>
                      )}
                      {selectedPayeurInfo.adresse && (
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Adresse:</strong> {selectedPayeurInfo.adresse}
                          </Typography>
                        </Grid>
                      )}
                      {selectedPayeurInfo.conditions_paiement && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Conditions de paiement:</strong> {selectedPayeurInfo.conditions_paiement}
                          </Typography>
                        </Grid>
                      )}
                      {selectedPayeurInfo.delai_paiement !== undefined && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Délai de paiement:</strong> {selectedPayeurInfo.delai_paiement} jours
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                    
                    {grandTotal > 0 && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="subtitle2" gutterBottom color="primary">
                          Estimation financière
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                              <strong>Prise en charge totale estimée:</strong>
                            </Typography>
                            <Typography variant="h6" color="success.main">
                              {formatCurrency(grandPriseEnCharge)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                              <strong>Reste à charge total:</strong>
                            </Typography>
                            <Typography variant="h6" color="error.main">
                              {formatCurrency(grandReste)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DatePicker
                  label="Date de facturation"
                  value={formData.date_facture}
                  onChange={handleDateChange('date_facture')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.date_facture
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DatePicker
                  label="Date d'échéance"
                  value={formData.date_echeance}
                  onChange={handleDateChange('date_echeance')}
                  minDate={formData.date_facture}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.date_echeance,
                      helperText: errors.date_echeance
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Factures à créer ({formData.factures.length})
              </Typography>
              <Box>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addFacture}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Ajouter une facture
                </Button>
              </Box>
            </Box>
            
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              {formData.factures.map((facture, index) => (
                <Tab 
                  key={facture.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <span>Facture {index + 1}</span>
                      {formData.factures.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFacture(index);
                          }}
                          sx={{ ml: 1, p: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  }
                />
              ))}
            </Tabs>
            
            {formData.factures.map((facture, factureIndex) => (
              activeTab === factureIndex && (
                <Box key={facture.id}>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Libellé de la facture"
                        value={facture.libelle}
                        onChange={(e) => handleFactureChange(factureIndex, 'libelle', e.target.value)}
                        error={!!errors[`facture_${factureIndex}_libelle`]}
                        helperText={errors[`facture_${factureIndex}_libelle`]}
                        placeholder="Ex: Facture Consultation"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Type de facture</InputLabel>
                        <Select
                          value={facture.type}
                          label="Type de facture"
                          onChange={(e) => handleFactureChange(factureIndex, 'type', e.target.value)}
                        >
                          <MenuItem value="consultation">Consultation</MenuItem>
                          <MenuItem value="pharmacie">Pharmacie</MenuItem>
                          <MenuItem value="analyse">Analyse</MenuItem>
                          <MenuItem value="radio">Radiologie</MenuItem>
                          <MenuItem value="hospitalisation">Hospitalisation</MenuItem>
                          <MenuItem value="urgence">Urgence</MenuItem>
                          <MenuItem value="chirurgie">Chirurgie</MenuItem>
                          <MenuItem value="divers">Divers</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Prestations de la facture {factureIndex + 1}
                    </Typography>
                    <Box>
                      <Button
                        startIcon={<CopyIcon />}
                        onClick={() => duplicateFacture(factureIndex)}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Dupliquer
                      </Button>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => addPrestation(factureIndex)}
                        variant="outlined"
                        size="small"
                      >
                        Ajouter une prestation
                      </Button>
                    </Box>
                  </Box>
                  
                  {errors[`facture_${factureIndex}_prestations`] && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {errors[`facture_${factureIndex}_prestations`]}
                    </Alert>
                  )}
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Libellé</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="center">Quantité</TableCell>
                          <TableCell align="right">Prix unitaire</TableCell>
                          <TableCell align="right">Montant</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {facture.prestations.map((prestation, prestationIndex) => (
                          <TableRow key={prestation.id}>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                value={prestation.libelle}
                                onChange={(e) => handlePrestationChange(factureIndex, prestationIndex, 'libelle', e.target.value)}
                                error={!!errors[`facture_${factureIndex}_prestation_${prestationIndex}_libelle`]}
                                helperText={errors[`facture_${factureIndex}_prestation_${prestationIndex}_libelle`]}
                                placeholder="Description de la prestation"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                value={prestation.type_prestation}
                                onChange={(e) => handlePrestationChange(factureIndex, prestationIndex, 'type_prestation', e.target.value)}
                                sx={{ minWidth: 120 }}
                              >
                                <MenuItem value="consultation">Consultation</MenuItem>
                                <MenuItem value="analyse">Analyse</MenuItem>
                                <MenuItem value="radio">Radiologie</MenuItem>
                                <MenuItem value="pharmacie">Pharmacie</MenuItem>
                                <MenuItem value="hospitalisation">Hospitalisation</MenuItem>
                                <MenuItem value="urgence">Urgence</MenuItem>
                                <MenuItem value="chirurgie">Chirurgie</MenuItem>
                                <MenuItem value="divers">Divers</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={prestation.quantite}
                                onChange={(e) => handlePrestationChange(factureIndex, prestationIndex, 'quantite', e.target.value)}
                                error={!!errors[`facture_${factureIndex}_prestation_${prestationIndex}_quantite`]}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={prestation.prix_unitaire}
                                onChange={(e) => handlePrestationChange(factureIndex, prestationIndex, 'prix_unitaire', e.target.value)}
                                error={!!errors[`facture_${factureIndex}_prestation_${prestationIndex}_prix`]}
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">XAF</InputAdornment>
                                }}
                                sx={{ width: 120 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight="medium">
                                {formatCurrency(prestation.montant)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => removePrestation(factureIndex, prestationIndex)}
                                color="error"
                                disabled={facture.prestations.length === 1}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <Card sx={{ mt: 3 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total de la facture {factureIndex + 1}:
                          </Typography>
                          <Typography variant="h6">
                            {formatCurrency(totals[factureIndex]?.total || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Payeur: {selectedPayeurInfo?.libelle || 'Non sélectionné'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Taux de couverture: {selectedPayeurInfo?.taux_couverture || 0}%
                          </Typography>
                          <Typography variant="body2" color="success.main">
                            Prise en charge: {formatCurrency(totals[factureIndex]?.priseEnCharge || 0)}
                          </Typography>
                          <Typography variant="body2" color="error.main">
                            Reste à charge: {formatCurrency(totals[factureIndex]?.reste || 0)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Box>
              )
            ))}
            
            <Card sx={{ mt: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Total général des {formData.factures.length} factures:</strong>
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(grandTotal)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Prise en charge totale:</strong> {formatCurrency(grandPriseEnCharge)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Reste à charge total:</strong> {formatCurrency(grandReste)}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontSize: '0.875rem' }}>
                      <strong>Payeur:</strong> {selectedPayeurInfo?.libelle || 'Non sélectionné'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );
        
      case 2:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Récapitulatif des {formData.factures.length} factures
              </Typography>
              Vérifiez les informations ci-dessous avant de générer les factures.
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      Informations du bénéficiaire
                    </Typography>
                    {selectedBeneficiaireInfo ? (
                      <>
                        <Typography variant="body2">
                          <strong>Nom complet:</strong> {selectedBeneficiaireInfo.nom} {selectedBeneficiaireInfo.prenom}
                        </Typography>
                        {selectedBeneficiaireInfo.identifiant && (
                          <Typography variant="body2">
                            <strong>Identifiant:</strong> {selectedBeneficiaireInfo.identifiant}
                          </Typography>
                        )}
                        {selectedBeneficiaireInfo.date_naissance && (
                          <Typography variant="body2">
                            <strong>Date naissance:</strong> {formatDate(selectedBeneficiaireInfo.date_naissance)}
                          </Typography>
                        )}
                        {selectedBeneficiaireInfo.telephone && (
                          <Typography variant="body2">
                            <strong>Téléphone:</strong> {selectedBeneficiaireInfo.telephone}
                          </Typography>
                        )}
                        {selectedBeneficiaireInfo.email && (
                          <Typography variant="body2">
                            <strong>Email:</strong> {selectedBeneficiaireInfo.email}
                          </Typography>
                        )}
                        {selectedBeneficiaireInfo.adresse && (
                          <Typography variant="body2">
                            <strong>Adresse:</strong> {selectedBeneficiaireInfo.adresse}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Aucun bénéficiaire sélectionné
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      Informations du payeur
                    </Typography>
                    {selectedPayeurInfo ? (
                      <>
                        <Typography variant="body2">
                          <strong>Payeur:</strong> {selectedPayeurInfo.libelle || 'Non sélectionné'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Type payeur:</strong> {selectedPayeurInfo.type_payeur || 'Non spécifié'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Taux couverture:</strong> {selectedPayeurInfo.taux_couverture || 0}%
                        </Typography>
                        {selectedPayeurInfo.contact && (
                          <Typography variant="body2">
                            <strong>Contact:</strong> {selectedPayeurInfo.contact}
                          </Typography>
                        )}
                        {selectedPayeurInfo.telephone && (
                          <Typography variant="body2">
                            <strong>Téléphone:</strong> {selectedPayeurInfo.telephone}
                          </Typography>
                        )}
                        {selectedPayeurInfo.conditions_paiement && (
                          <Typography variant="body2">
                            <strong>Conditions de paiement:</strong> {selectedPayeurInfo.conditions_paiement}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Aucun payeur sélectionné
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      Dates
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date facture:</strong> {formatDate(formData.date_facture)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date échéance:</strong> {formatDate(formData.date_echeance)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Observations générales:</strong> {formData.observations || 'Aucune'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      Récapitulatif financier
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total général:</strong> {formatCurrency(grandTotal)}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      <strong>Prise en charge totale:</strong> {formatCurrency(grandPriseEnCharge)}
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      <strong>Reste à charge total:</strong> {formatCurrency(grandReste)}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Nombre de factures:</strong> {formData.factures.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {formData.factures.map((facture, index) => (
                <Grid item xs={12} key={facture.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom color="primary">
                        Facture {index + 1}: {facture.libelle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Type: {facture.type}
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2">
                            <strong>Total prestations:</strong> {formatCurrency(totals[index]?.total || 0)}
                          </Typography>
                          <Typography variant="body2" color="success.main">
                            <strong>Prise en charge:</strong> {formatCurrency(totals[index]?.priseEnCharge || 0)}
                          </Typography>
                          <Typography variant="body2" color="error.main">
                            <strong>Reste à charge:</strong> {formatCurrency(totals[index]?.reste || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2">
                            <strong>Nombre de prestations:</strong> {facture.prestations.length}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Prestations:</strong>
                          </Typography>
                          <Box sx={{ maxHeight: 100, overflow: 'auto', mt: 1 }}>
                            {facture.prestations.map((p, i) => (
                              <Typography key={p.id} variant="body2" fontSize="small">
                                • {p.libelle} ({p.quantite} × {formatCurrency(p.prix_unitaire)})
                              </Typography>
                            ))}
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observations additionnelles"
                  value={formData.observations}
                  onChange={handleChange('observations')}
                  placeholder="Ajoutez des notes ou instructions supplémentaires pour toutes les factures..."
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      default:
        return 'Étape inconnue';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, minHeight: 700 }
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <ReceiptIcon color="primary" />
          <Typography variant="h6">
            {mode === 'create' ? 'Créer plusieurs factures' : 'Modifier les factures'}
          </Typography>
          <Chip 
            label={`${formData.factures.length} facture(s)`} 
            color="primary" 
            size="small"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {apiLoading && activeStep === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Chargement des données...</Typography>
          </Box>
        ) : (
          getStepContent(activeStep)
        )}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box>
          {activeStep > 0 && (
            <Button onClick={handleBack} disabled={loading || apiLoading}>
              Retour
            </Button>
          )}
        </Box>
        
        <Box>
          <Button 
            onClick={onClose}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            Annuler
          </Button>
          
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading || apiLoading}
            >
              Suivant
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmit}
              disabled={loading || apiLoading}
              startIcon={loading ? <CircularProgress size={20} /> : <ReceiptIcon />}
            >
              {loading ? 'Génération...' : `Générer ${formData.factures.length} facture(s)`}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default FactureDialog;