import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, Download, FileText, Database, 
  CheckCircle, AlertCircle, Loader2, X, 
  FileSpreadsheet, FileType, FileUp, 
  BarChart, Users, RefreshCw, Info,
  ChevronDown, Eye, FileCheck, FileX,
  History, Search, Calendar, Filter,
  ChevronLeft, ChevronRight, ChevronFirst, ChevronLast,
  Layers, Settings, Shield, FileCog,
  Grid, Table, Zap, BookOpen,
  TrendingUp, AlertTriangle, ExternalLink,
  Wand2, Map, Sparkles, Cpu
} from 'lucide-react';
import { importAPI } from '../../services/api';
import './Importation.css';

// ==============================================
// CONSTANTES ET CONFIGURATION
// ==============================================
const IMPORT_MODES = {
  INSERT_ONLY: 'insert_only',
  UPDATE_ONLY: 'update_only',
  UPSERT: 'upsert'
};

const DUPLICATE_STRATEGIES = {
  UPDATE: 'update',
  SKIP: 'skip',
  ERROR: 'error'
};

const ERROR_HANDLING = {
  CONTINUE: 'continue',
  STOP: 'stop',
  SKIP_ROW: 'skip_row'
};

// Dictionnaire étendu de synonymes pour un meilleur matching
const EXTENDED_SYNONYMS = {
  // Identifiants
  'id': ['identifiant', 'code', 'num', 'no', 'numero', 'ref', 'reference', 'id_', 'cle', 'key', 'pk'],
  // Noms
  'nom': ['name', 'lastname', 'last_name', 'surname', 'familyname', 'nom_', 'name_'],
  'prenom': ['firstname', 'first_name', 'givenname', 'given_name', 'prenom_', 'prenom'],
  // Dates
  'date': ['dt', 'date_', 'dat', 'dte', 'jour', 'day', 'timestamp', 'datetime', 'time'],
  'naissance': ['birth', 'birthday', 'birthdate', 'dob'],
  // Contacts
  'email': ['mail', 'courriel', 'e_mail', 'email_', 'mail_'],
  'telephone': ['phone', 'tel', 'mobile', 'cell', 'cellphone', 'phone_', 'tel_'],
  // Adresses
  'adresse': ['address', 'addr', 'street', 'rue', 'adresse_', 'location'],
  'ville': ['city', 'town', 'ville_', 'city_'],
  'code': ['zip', 'postal', 'postcode', 'cp', 'code_'],
  'pays': ['country', 'nation', 'pays_', 'country_'],
  // Statuts
  'statut': ['status', 'state', 'etat', 'statut_', 'status_'],
  'actif': ['active', 'enabled', 'is_active', 'actif_'],
  // Types
  'type': ['category', 'categorie', 'class', 'type_', 'kind', 'sort'],
  // Montants
  'montant': ['amount', 'total', 'sum', 'prix', 'price', 'value', 'montant_'],
  'quantite': ['quantity', 'qty', 'qte', 'quantite_', 'count', 'number'],
  // Descriptions
  'description': ['desc', 'details', 'comment', 'note', 'remark', 'description_'],
  // Profession
  'profession': ['job', 'occupation', 'work', 'profession_'],
  // Sexe
  'sexe': ['gender', 'sex', 'sexe_', 'gender_'],
  // Groupe sanguin
  'groupe': ['group', 'bloodgroup', 'blood_type', 'groupe_'],
  // Nationalité
  'national': ['nationality', 'national_', 'nation'],
  // Numéros
  'numero': ['number', 'num', 'no', 'numero_', 'num_'],
  // Libellés
  'libelle': ['label', 'title', 'libelle_', 'lib'],
  // Capacité
  'capacite': ['capacity', 'capability', 'capacite_'],
  // Responsable
  'responsable': ['manager', 'head', 'chief', 'responsable_'],
  // Spécialité
  'specialite': ['specialty', 'specialization', 'specialite_'],
  // Employeur
  'employeur': ['employer', 'company', 'employeur_'],
  // Situation
  'situation': ['situation_', 'condition', 'state'],
  // Distance
  'distance': ['distance_', 'dist', 'length'],
  // Transport
  'transport': ['transport_', 'transportation', 'vehicle'],
  // Zone
  'zone': ['zone_', 'area', 'region'],
  // Habitation
  'habitation': ['housing', 'habitation_', 'dwelling'],
  // Accès
  'acces': ['access', 'acces_', 'entry'],
  // Eau
  'eau': ['water', 'eau_'],
  // Électricité
  'electricite': ['electricity', 'power', 'electricite_'],
  // Santé
  'sante': ['health', 'medical', 'sante_'],
  // Carte
  'carte': ['card', 'carte_', 'badge'],
  // Validité
  'validite': ['validity', 'validite_', 'expiration'],
  // Début
  'debut': ['start', 'begin', 'debut_'],
  // Fin
  'fin': ['end', 'finish', 'fin_'],
  // Sécurité sociale
  'sociale': ['social', 'security', 'sociale_'],
  // Prime
  'prime': ['premium', 'bonus', 'prime_'],
  // Agrément
  'agrement': ['agreement', 'approval', 'agrement_'],
  // Utilisateur
  'utilisateur': ['user', 'account', 'utilisateur_'],
  // Mot de passe
  'password': ['pwd', 'pass', 'motdepasse'],
  // Login
  'login': ['username', 'userid', 'login_'],
  // Expiration
  'expiration': ['expiry', 'expiration_', 'expire'],
  // Centre
  'centre': ['center', 'centre_', 'hub'],
  // Prestataire
  'prestataire': ['provider', 'supplier', 'prestataire_'],
  // Bénéficiaire
  'beneficiaire': ['beneficiary', 'recipient', 'beneficiaire_'],
  // Assurance
  'assurance': ['insurance', 'assurance_', 'coverage']
};

// Table de correspondance spécifique pour les tables communes
const TABLE_SPECIFIC_MAPPINGS = {
  'BENEFICIAIRE': {
    'IDENTIFIANT_NATIONAL': ['identifiant', 'national', 'id_national', 'national_id'],
    'NOM_BEN': ['nom', 'name', 'lastname', 'familyname'],
    'PRE_BEN': ['prenom', 'firstname', 'givenname'],
    'SEX_BEN': ['sexe', 'gender', 'sex'],
    'NAI_BEN': ['naissance', 'birth', 'date_naissance', 'birthdate'],
    'COD_PAY': ['pays', 'country', 'code_pays', 'country_code'],
    'EMAIL': ['email', 'mail', 'courriel'],
    'TELEPHONE': ['telephone', 'phone', 'tel'],
    'TELEPHONE_MOBILE': ['mobile', 'cellphone', 'portable'],
    'ADRESSE': ['adresse', 'address'],
    'VILLE': ['ville', 'city'],
    'PROFESSION': ['profession', 'job', 'occupation'],
    'EMPLOYEUR': ['employeur', 'employer', 'company'],
    'SITUATION_FAMILIALE': ['situation', 'familiale', 'marital'],
    'GROUPE_SANGUIN': ['groupe', 'sanguin', 'blood'],
    'RHESUS': ['rhesus', 'rh'],
    'STATUT_ACE': ['statut', 'ace', 'status'],
    'ZONE_HABITATION': ['zone', 'habitation', 'area'],
    'TYPE_HABITAT': ['type', 'habitat', 'housing'],
    'ACCES_EAU': ['acces', 'eau', 'water'],
    'ACCES_ELECTRICITE': ['acces', 'electricite', 'electricity'],
    'DISTANCE_CENTRE_SANTE': ['distance', 'centre', 'sante', 'health'],
    'MOYEN_TRANSPORT': ['moyen', 'transport', 'vehicle']
  },
  'PRESTATAIRE': {
    'COD_PRE': ['code', 'prestataire', 'provider_code'],
    'NOM_PRESTATAIRE': ['nom', 'prestataire', 'name'],
    'TYPE_PRESTATAIRE': ['type', 'prestataire', 'category'],
    'ADRESSE': ['adresse', 'address'],
    'TELEPHONE': ['telephone', 'phone'],
    'EMAIL': ['email', 'mail'],
    'SPECIALITE': ['specialite', 'specialty'],
    'ACTIF': ['actif', 'active', 'status']
  },
  'CENTRE': {
    'COD_CEN': ['code', 'centre', 'center_code'],
    'LIB_CEN': ['libelle', 'centre', 'name', 'title'],
    'TYPE_CENTRE': ['type', 'centre', 'category'],
    'ADRESSE': ['adresse', 'address'],
    'TELEPHONE': ['telephone', 'phone'],
    'EMAIL': ['email', 'mail'],
    'RESPONSABLE': ['responsable', 'manager'],
    'CAPACITE': ['capacite', 'capacity'],
    'ACTIF': ['actif', 'active']
  },
  'UTILISATEUR': {
    'LOG_UTI': ['login', 'username', 'user'],
    'PWD_UTI': ['password', 'motdepasse', 'pwd'],
    'NOM_UTI': ['nom', 'name', 'lastname'],
    'PRE_UTI': ['prenom', 'firstname'],
    'EMAIL_UTI': ['email', 'mail'],
    'PROFIL_UTI': ['profil', 'profile', 'role'],
    'ACTIF': ['actif', 'active'],
    'DATE_EXPIRATION': ['expiration', 'expiry', 'date_exp']
  },
  'CARTE': {
    'NUM_CAR': ['numero', 'carte', 'card_number'],
    'COD_CAR': ['code', 'carte', 'card_code'],
    'COD_PAY': ['code', 'pays', 'country_code'],
    'NOM_BEN': ['nom', 'beneficiaire', 'name'],
    'PRE_BEN': ['prenom', 'beneficiaire', 'firstname'],
    'SOC_BEN': ['sociale', 'securite', 'social_security'],
    'NAG_ASS': ['agrement', 'assurance', 'agreement'],
    'PRM_BEN': ['prime', 'beneficiaire', 'premium'],
    'DDV_CAR': ['debut', 'validite', 'start_date'],
    'DFV_CAR': ['fin', 'validite', 'end_date'],
    'STS_CAR': ['statut', 'carte', 'status']
  }
};

// ==============================================
// FONCTIONS UTILITAIRES DE MAPPING
// ==============================================
const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .replace(/_/g, '')
    .replace(/ /g, '')
    .trim();
};

const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  if (s1 === s2) return 100;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 80 + (Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length)) * 20;
  }
  
  // Levenshtein distance for partial matches
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix = [];
  
  for (let i = 0; i <= len1; i++) matrix[i] = [i];
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  const similarity = 100 - (distance / maxLength) * 100;
  
  return Math.max(0, similarity);
};

const findBestMatch = (csvHeader, tableColumns, tableName = '') => {
  let bestMatch = null;
  let bestScore = 0;
  const normalizedHeader = normalizeString(csvHeader);
  
  // Étape 1: Vérifier les mappings spécifiques à la table
  if (tableName && TABLE_SPECIFIC_MAPPINGS[tableName]) {
    const tableMappings = TABLE_SPECIFIC_MAPPINGS[tableName];
    
    for (const [tableCol, synonyms] of Object.entries(tableMappings)) {
      // Vérifier si la colonne de table existe dans les colonnes disponibles
      const columnExists = tableColumns.find(col => normalizeString(col.name) === normalizeString(tableCol));
      if (!columnExists) continue;
      
      // Vérifier la correspondance directe
      if (normalizedHeader === normalizeString(tableCol)) {
        return { column: tableCol, score: 100 };
      }
      
      // Vérifier les synonymes
      for (const synonym of synonyms) {
        const synonymScore = calculateSimilarity(csvHeader, synonym);
        if (synonymScore > bestScore) {
          bestScore = synonymScore;
          bestMatch = tableCol;
        }
      }
    }
  }
  
  // Étape 2: Vérifier chaque colonne de table
  tableColumns.forEach(tableCol => {
    const tableColName = tableCol.name;
    const normalizedTableCol = normalizeString(tableColName);
    
    // Score pour correspondance exacte
    if (normalizedHeader === normalizedTableCol) {
      if (100 > bestScore) {
        bestScore = 100;
        bestMatch = tableColName;
      }
      return;
    }
    
    // Score pour correspondance directe (sans normalisation complète)
    const directScore = calculateSimilarity(csvHeader, tableColName);
    if (directScore > bestScore && directScore > 60) {
      bestScore = directScore;
      bestMatch = tableColName;
    }
    
    // Vérifier les synonymes étendus
    for (const [key, synonyms] of Object.entries(EXTENDED_SYNONYMS)) {
      // Si le header contient un synonyme ET la colonne de table contient le mot clé
      const headerContainsSynonym = synonyms.some(syn => 
        normalizedHeader.includes(normalizeString(syn))
      );
      const tableColContainsKey = normalizedTableCol.includes(normalizeString(key));
      
      if (headerContainsSynonym && tableColContainsKey) {
        const synonymScore = 70; // Score de base pour correspondance par synonyme
        if (synonymScore > bestScore) {
          bestScore = synonymScore;
          bestMatch = tableColName;
        }
      }
    }
    
    // Vérifier les parties communes
    const headerWords = normalizedHeader.match(/[a-z0-9]+/g) || [];
    const tableColWords = normalizedTableCol.match(/[a-z0-9]+/g) || [];
    
    let commonWords = 0;
    headerWords.forEach(hWord => {
      if (tableColWords.some(tWord => tWord.includes(hWord) || hWord.includes(tWord))) {
        commonWords++;
      }
    });
    
    if (commonWords > 0) {
      const wordScore = (commonWords / Math.max(headerWords.length, tableColWords.length)) * 80;
      if (wordScore > bestScore) {
        bestScore = wordScore;
        bestMatch = tableColName;
      }
    }
  });
  
  return bestScore > 50 ? { column: bestMatch, score: bestScore } : null;
};

// Fonction principale de mapping automatique COMPLET
const performCompleteAutoMapping = (csvHeaders, tableColumns, tableName = '') => {
  const mapping = {};
  const usedTableColumns = new Set();
  const availableTableColumns = [...tableColumns];
  
  // Phase 1: Mapping intelligent basé sur la similarité
  csvHeaders.forEach(csvHeader => {
    const bestMatch = findBestMatch(csvHeader, availableTableColumns, tableName);
    
    if (bestMatch && !usedTableColumns.has(bestMatch.column)) {
      mapping[csvHeader] = bestMatch.column;
      usedTableColumns.add(bestMatch.column);
      
      // Retirer la colonne utilisée de la liste disponible
      const index = availableTableColumns.findIndex(col => 
        normalizeString(col.name) === normalizeString(bestMatch.column)
      );
      if (index > -1) {
        availableTableColumns.splice(index, 1);
      }
    }
  });
  
  // Phase 2: Mapping par position pour les colonnes restantes
  const unmappedCsvHeaders = csvHeaders.filter(header => !mapping[header]);
  const remainingTableColumns = availableTableColumns.filter(col => !usedTableColumns.has(col.name));
  
  // Tenter de mapper par ordre (les premières colonnes non mappées avec les premières colonnes de table disponibles)
  const maxPairs = Math.min(unmappedCsvHeaders.length, remainingTableColumns.length);
  for (let i = 0; i < maxPairs; i++) {
    mapping[unmappedCsvHeaders[i]] = remainingTableColumns[i].name;
    usedTableColumns.add(remainingTableColumns[i].name);
  }
  
  // Phase 3: S'assurer que toutes les colonnes requises sont mappées
  const requiredColumns = tableColumns.filter(col => !col.isNullable || col.isPrimaryKey);
  requiredColumns.forEach(reqCol => {
    if (!Object.values(mapping).includes(reqCol.name)) {
      // Trouver une colonne CSV non mappée
      const unmappedCsvHeader = csvHeaders.find(header => !mapping[header]);
      if (unmappedCsvHeader) {
        mapping[unmappedCsvHeader] = reqCol.name;
        usedTableColumns.add(reqCol.name);
      } else {
        // Remplacer une colonne optionnelle mappée
        const optionalMapped = Object.entries(mapping).find(([csv, table]) => {
          const colInfo = tableColumns.find(c => c.name === table);
          return colInfo && colInfo.isNullable && !colInfo.isPrimaryKey;
        });
        
        if (optionalMapped) {
          mapping[optionalMapped[0]] = reqCol.name;
        }
      }
    }
  });
  
  return mapping;
};

// ==============================================
// COMPOSANT PRINCIPAL
// ==============================================
const UploadMasse = () => {
  // ==============================================
  // RÉFÉRENCES
  // ==============================================
  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // ==============================================
  // ÉTATS PRINCIPAUX
  // ==============================================
  const [selectedSchema, setSelectedSchema] = useState('core');
  const [selectedTable, setSelectedTable] = useState('');
  const [availableSchemas, setAvailableSchemas] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [tableInfo, setTableInfo] = useState(null);
  const [uploadStep, setUploadStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [fileType, setFileType] = useState('excel');
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [batchSize, setBatchSize] = useState(100);
  const [importMode, setImportMode] = useState(IMPORT_MODES.UPSERT);
  const [duplicateStrategy, setDuplicateStrategy] = useState(DUPLICATE_STRATEGIES.UPDATE);
  const [errorHandling, setErrorHandling] = useState(ERROR_HANDLING.CONTINUE);
  
  // États pour le chargement
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [loadingTableInfo, setLoadingTableInfo] = useState(false);
  
  // ==============================================
  // FONCTIONS UTILITAIRES
  // ==============================================
  const showNotification = useCallback((message, type = 'info', duration = 5000) => {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    notification.innerHTML = `
      <div class="notification-content">
        ${icon} <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, duration);
  }, []);

  const formatDate = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }, []);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // ==============================================
  // FONCTIONS DE MAPPING AMÉLIORÉES
  // ==============================================
  const mapAllColumnsAutomatically = useCallback(() => {
    if (!tableInfo?.columns || !csvHeaders || csvHeaders.length === 0) {
      showNotification('Impossible de mapper: données manquantes', 'error');
      return;
    }

    console.log('Début du mapping automatique complet');
    console.log('Headers CSV:', csvHeaders);
    console.log('Colonnes table:', tableInfo.columns.map(c => c.name));
    
    // Utiliser la nouvelle fonction de mapping complet
    const mapping = performCompleteAutoMapping(
      csvHeaders, 
      tableInfo.columns, 
      selectedTable.toUpperCase()
    );
    
    console.log('Mapping généré:', mapping);
    
    setColumnMapping(mapping);
    
    // Calculer les statistiques
    const mappedCount = Object.keys(mapping).length;
    const totalColumns = csvHeaders.length;
    const requiredColumns = tableInfo.columns.filter(col => !col.isNullable || col.isPrimaryKey);
    const requiredMapped = requiredColumns.filter(col => 
      Object.values(mapping).includes(col.name)
    ).length;
    
    const message = `Mapping automatique réussi : ${mappedCount}/${totalColumns} colonnes mappées`;
    showNotification(message, 'success');
    
    // Afficher le détail dans la console pour débogage
    console.log(`Statistiques mapping: ${mappedCount}/${totalColumns} colonnes mappées, ${requiredMapped}/${requiredColumns.length} obligatoires`);
    
    // Si certaines colonnes ne sont pas mappées, suggérer une action
    if (mappedCount < totalColumns) {
      console.warn(`${totalColumns - mappedCount} colonnes non mappées`);
    }
  }, [tableInfo, csvHeaders, selectedTable, showNotification]);

  // Fonction de mapping intelligent (basé sur les noms)
  const autoMapColumns = useCallback(() => {
    if (!tableInfo?.columns || !csvHeaders || csvHeaders.length === 0) {
      showNotification('Impossible de mapper: données manquantes', 'warning');
      return;
    }

    const mapping = {};
    const usedTableColumns = new Set();
    
    // Première passe: correspondance exacte et similaire
    csvHeaders.forEach(csvHeader => {
      const normalizedHeader = normalizeString(csvHeader);
      let bestMatch = null;
      let bestScore = 0;
      
      tableInfo.columns.forEach(tableCol => {
        if (usedTableColumns.has(tableCol.name)) return;
        
        const normalizedTableCol = normalizeString(tableCol.name);
        
        // Correspondance exacte
        if (normalizedHeader === normalizedTableCol) {
          bestMatch = tableCol.name;
          bestScore = 100;
          return;
        }
        
        // Correspondance partielle
        const similarity = calculateSimilarity(csvHeader, tableCol.name);
        if (similarity > bestScore && similarity > 70) {
          bestScore = similarity;
          bestMatch = tableCol.name;
        }
      });
      
      if (bestMatch) {
        mapping[csvHeader] = bestMatch;
        usedTableColumns.add(bestMatch);
      }
    });
    
    setColumnMapping(mapping);
    
    const mappedCount = Object.keys(mapping).length;
    showNotification(`Mapping intelligent: ${mappedCount}/${csvHeaders.length} colonnes mappées`, 'success');
  }, [tableInfo, csvHeaders, showNotification]);

  // ==============================================
  // INITIALISATION
  // ==============================================
  useEffect(() => {
    initImportModule();
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const initImportModule = async () => {
    try {
      await loadSchemas();
    } catch (error) {
      console.error('Erreur initialisation module import:', error);
      showNotification('Erreur lors de l\'initialisation du module', 'error');
    }
  };

  const loadSchemas = async () => {
    try {
      setLoadingSchemas(true);
      const response = await importAPI.getSchemas();
      
      if (response.success && response.schemas) {
        setAvailableSchemas(response.schemas);
        
        if (response.schemas.length > 0) {
          const firstSchema = response.schemas.find(s => s.canImport) || response.schemas[0];
          setSelectedSchema(firstSchema.name);
          await loadAvailableTables(firstSchema.name);
        }
      } else {
        showNotification(response.message || 'Erreur lors du chargement des schémas', 'error');
      }
    } catch (error) {
      console.error('Erreur chargement schémas:', error);
      showNotification('Erreur lors du chargement des schémas', 'error');
    } finally {
      setLoadingSchemas(false);
    }
  };

  const loadAvailableTables = async (schema) => {
    try {
      setLoadingTables(true);
      const response = await importAPI.getAllTables(schema);
      
      if (response.success && response.tables) {
        const importableTables = response.tables.filter(table => table.canImport !== false);
        setAvailableTables(importableTables);
        
        if (importableTables.length > 0 && !selectedTable) {
          const firstTable = importableTables[0];
          setSelectedTable(firstTable.name);
          await loadTableInfo(firstTable.schema, firstTable.name);
        }
      } else {
        showNotification(response.message || 'Erreur lors du chargement des tables', 'error');
      }
    } catch (error) {
      console.error('Erreur chargement tables:', error);
      showNotification('Erreur lors du chargement des tables', 'error');
    } finally {
      setLoadingTables(false);
    }
  };

  const loadTableInfo = async (schema, table) => {
    try {
      setLoadingTableInfo(true);
      const response = await importAPI.getTableInfo(schema, table);
      
      if (response.success) {
        setTableInfo(response);
        
        // Réinitialiser le mapping
        setColumnMapping({});
        setValidationErrors([]);
        setValidationWarnings([]);
        
        // Si nous avons déjà des headers CSV, appliquer le mapping automatique
        if (csvHeaders.length > 0 && response.columns) {
          console.log('Chargement info table - Lancement mapping automatique');
          setTimeout(() => {
            mapAllColumnsAutomatically();
          }, 100);
        }
      } else {
        showNotification(response.message || 'Erreur lors du chargement des informations de la table', 'error');
      }
    } catch (error) {
      console.error('Erreur chargement info table:', error);
      showNotification('Erreur lors du chargement des informations de la table', 'error');
    } finally {
      setLoadingTableInfo(false);
    }
  };

  // ==============================================
  // GESTION DES FICHIERS
  // ==============================================
  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setCsvHeaders([]);
    setColumnMapping({});
    setUploadStep(1);
    setUploadProgress(0);
    setUploadResult(null);
    setValidationErrors([]);
    setValidationWarnings([]);
    setIsUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
      setFileType('csv');
      readCSVFile(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      setFileType('excel');
      readExcelFile(file);
    } else if (fileName.endsWith('.json')) {
      setFileType('json');
      readJSONFile(file);
    } else {
      showNotification('Format de fichier non supporté. Utilisez Excel, CSV, TXT ou JSON.', 'error');
      return;
    }
  }, []);

  const readExcelFile = async (file) => {
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (excelData.length > 0) {
        let headers = [];
        let dataRows = [];
        
        if (hasHeader && excelData.length > 0) {
          headers = excelData[0].map(header => header || '');
          dataRows = excelData.slice(1);
        } else {
          headers = excelData[0]?.map((_, index) => `Colonne_${index + 1}`) || [];
          dataRows = excelData;
        }
        
        const previewDataArray = [headers, ...dataRows.slice(0, 10)];
        
        setCsvHeaders(headers);
        setPreviewData(previewDataArray);
        
        // Appliquer le mapping automatique COMPLET immédiatement
        if (tableInfo && tableInfo.columns) {
          console.log('Fichier Excel chargé - Lancement mapping automatique');
          setTimeout(() => {
            mapAllColumnsAutomatically();
          }, 100);
        }
        
        setUploadStep(2);
        showNotification('Fichier Excel analysé avec succès - Mapping automatique en cours...', 'success');
      } else {
        showNotification('Le fichier Excel est vide', 'error');
      }
    } catch (error) {
      console.error('Erreur parsing Excel:', error);
      showNotification('Erreur lors de l\'analyse du fichier Excel', 'error');
    }
  };

  const readCSVFile = async (file) => {
    try {
      const content = await readFileAsText(file);
      parseCSV(content);
    } catch (error) {
      console.error('Erreur lecture CSV:', error);
      showNotification('Erreur lors de la lecture du fichier', 'error');
    }
  };

  const readJSONFile = async (file) => {
    try {
      const content = await readFileAsText(file);
      parseJSON(content);
    } catch (error) {
      console.error('Erreur lecture JSON:', error);
      showNotification('Erreur lors de la lecture du fichier', 'error');
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  };

  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const parseCSV = (content) => {
    try {
      const parsedData = importAPI.parseCSV(content, delimiter, hasHeader);
      
      if (parsedData.length > 0) {
        let headers = [];
        let data = [];
        
        if (hasHeader) {
          headers = parsedData[0];
          data = parsedData;
        } else {
          headers = parsedData[0]?.map((_, index) => `Colonne_${index + 1}`) || [];
          data = [headers, ...parsedData];
        }
        
        setCsvHeaders(headers);
        setPreviewData(data.slice(0, 11));
        
        // Appliquer le mapping automatique COMPLET
        if (tableInfo && tableInfo.columns) {
          console.log('Fichier CSV chargé - Lancement mapping automatique');
          setTimeout(() => {
            mapAllColumnsAutomatically();
          }, 100);
        }
        
        setUploadStep(2);
        showNotification('Fichier analysé avec succès - Mapping automatique en cours...', 'success');
      } else {
        showNotification('Le fichier est vide', 'error');
      }
    } catch (error) {
      console.error('Erreur parsing CSV:', error);
      showNotification('Erreur lors de l\'analyse du fichier CSV', 'error');
    }
  };

  const parseJSON = (content) => {
    try {
      const data = JSON.parse(content);
      let previewData = [];
      
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        setCsvHeaders(headers);
        
        previewData = data.slice(0, 10).map(obj => 
          headers.map(header => obj[header] !== null && obj[header] !== undefined ? 
            String(obj[header]) : ''
          )
        );
        
        previewData.unshift(headers);
        setPreviewData(previewData);
        
        // Appliquer le mapping automatique COMPLET
        if (tableInfo && tableInfo.columns) {
          console.log('Fichier JSON chargé - Lancement mapping automatique');
          setTimeout(() => {
            mapAllColumnsAutomatically();
          }, 100);
        }
        
        setUploadStep(2);
        showNotification('Fichier JSON analysé avec succès - Mapping automatique en cours...', 'success');
      } else {
        showNotification('Le fichier JSON ne contient pas de tableau de données valide', 'error');
      }
    } catch (error) {
      console.error('Erreur parsing JSON:', error);
      showNotification('Erreur lors de l\'analyse du fichier JSON', 'error');
    }
  };

  // ==============================================
  // GESTION DU MAPPING
  // ==============================================
  const handleColumnMapping = (csvColumn, tableColumn) => {
    setColumnMapping(prev => ({
      ...prev,
      [csvColumn]: tableColumn
    }));
  };

  const clearMapping = () => {
    setColumnMapping({});
    showNotification('Mapping réinitialisé', 'info');
  };

  // ==============================================
  // VALIDATION ET IMPORT
  // ==============================================
  const validateFile = async () => {
    if (!selectedFile || !selectedTable) {
      showNotification('Veuillez sélectionner un fichier et une table', 'error');
      return;
    }

    setIsUploading(true);
    setValidationErrors([]);
    setValidationWarnings([]);

    try {
      const options = {
        schema: selectedSchema,
        mapping: JSON.stringify(columnMapping),
        delimiter,
        hasHeader,
        importMode,
        duplicateStrategy,
        errorHandling,
        batchSize
      };

      const response = await importAPI.validateFile(selectedFile, selectedTable, options);
      
      if (response.success) {
        setValidationWarnings(response.warnings || []);
        setValidationErrors(response.errors || []);
        
        if (response.errors && response.errors.length > 0) {
          showNotification('Des erreurs ont été trouvées dans le fichier', 'warning');
        } else {
          setUploadStep(3);
          showNotification('Fichier validé avec succès', 'success');
        }
      } else {
        setValidationErrors([response.message || 'Erreur de validation']);
        showNotification(response.message || 'Erreur de validation', 'error');
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      setValidationErrors([error.message || 'Erreur lors de la validation']);
      showNotification('Erreur lors de la validation du fichier', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedTable) {
      showNotification('Veuillez sélectionner un fichier et une table', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      const options = {
        schema: selectedSchema,
        mapping: JSON.stringify(columnMapping),
        delimiter,
        hasHeader,
        importMode,
        duplicateStrategy,
        errorHandling,
        batchSize
      };

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      progressIntervalRef.current = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressIntervalRef.current);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const response = await importAPI.importFile(selectedFile, selectedTable, options);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setUploadProgress(100);

      if (response.success) {
        setUploadResult({
          success: true,
          message: response.message || 'Importation terminée avec succès',
          details: response.details || {
            totalRows: response.totalRows || 0,
            importedRows: response.importedRows || 0,
            errorRows: response.errorRows || 0,
            skippedRows: response.skippedRows || 0,
            updatedRows: response.updatedRows || 0
          },
          errors: response.errors || [],
          warnings: response.warnings || []
        });
        
        showNotification('Importation réussie', 'success');
      } else {
        setUploadResult({
          success: false,
          message: response.message || 'Erreur lors de l\'importation',
          details: response.details || {
            totalRows: 0,
            importedRows: 0,
            errorRows: 1
          },
          errors: response.errors || [response.message],
          warnings: response.warnings || []
        });
        showNotification(response.message || 'Erreur lors de l\'importation', 'error');
      }
      
      setUploadStep(4);
    } catch (error) {
      console.error('Erreur importation:', error);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setUploadResult({
        success: false,
        message: error.message || 'Erreur lors de l\'importation',
        details: {
          totalRows: 0,
          importedRows: 0,
          errorRows: 1
        },
        errors: [error.message],
        warnings: []
      });
      setUploadStep(4);
      showNotification('Erreur lors de l\'importation', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // ==============================================
  // RENDU DU COMPOSANT
  // ==============================================
  const renderStep1 = () => (
    <div className="upload-step">
      <div className="step-header">
        <h3><Database size={20} /> Sélection de la table et du fichier</h3>
        <p>Choisissez la table cible et le fichier à importer</p>
      </div>
      
      <div className="step-content">
        <div className="form-section">
          <h4>1. Schéma et table de destination</h4>
          
          <div className="schema-table-selection">
            <div className="schema-selection">
              <label>Schéma</label>
              <select 
                value={selectedSchema}
                onChange={async (e) => {
                  const newSchema = e.target.value;
                  setSelectedSchema(newSchema);
                  setSelectedTable('');
                  setTableInfo(null);
                  await loadAvailableTables(newSchema);
                }}
                disabled={loadingSchemas}
              >
                {loadingSchemas ? (
                  <option>Chargement des schémas...</option>
                ) : (
                  availableSchemas.map(schema => (
                    <option key={schema.name} value={schema.name}>
                      {schema.description || schema.name} {!schema.canImport ? '(lecture seule)' : ''}
                    </option>
                  ))
                )}
              </select>
              {loadingSchemas && <Loader2 className="spinner" size={16} />}
            </div>
            
            <div className="table-selection">
              <label>Table</label>
              <div className="tables-grid">
                {loadingTables ? (
                  <div className="loading-tables">
                    <Loader2 className="spinner" size={20} />
                    <span>Chargement des tables...</span>
                  </div>
                ) : availableTables.length === 0 ? (
                  <div className="no-tables">
                    <Table size={24} />
                    <span>Aucune table disponible</span>
                  </div>
                ) : (
                  availableTables.map(table => {
                    const isSelected = selectedTable === table.name;
                    
                    return (
                      <div
                        key={`${table.schema}.${table.name}`}
                        className={`table-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedTable(table.name);
                          loadTableInfo(table.schema, table.name);
                        }}
                      >
                        <div className="table-card-header">
                          <div className="table-icon">
                            <Table size={18} />
                          </div>
                          <span className="table-name">{table.name}</span>
                        </div>
                        <div className="table-card-body">
                          <p className="table-description">{table.description || 'Aucune description'}</p>
                          <div className="table-meta">
                            <span className="schema-badge">{table.schema}</span>
                            {table.rowCount !== undefined && (
                              <span className="row-count">{table.rowCount.toLocaleString()} lignes</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        
        {tableInfo && (
          <div className="form-section">
            <h4>2. Informations de la table sélectionnée</h4>
            <div className="table-info-panel">
              <div className="table-info-header">
                <div className="table-info-title">
                  <Database size={20} />
                  <div>
                    <h5>{selectedSchema}.{selectedTable}</h5>
                    <p>{tableInfo.description || `Table ${selectedTable}`}</p>
                  </div>
                </div>
              </div>
              
              <div className="table-stats">
                <div className="stat-item">
                  <span className="stat-label">Colonnes totales:</span>
                  <span className="stat-value">{tableInfo.columns?.length || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Colonnes obligatoires:</span>
                  <span className="stat-value">{tableInfo.requiredColumns?.length || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Clés primaires:</span>
                  <span className="stat-value">{tableInfo.primaryKeys?.length || 0}</span>
                </div>
                {tableInfo.rowCount !== undefined && (
                  <div className="stat-item">
                    <span className="stat-label">Lignes existantes:</span>
                    <span className="stat-value">{tableInfo.rowCount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="form-section">
          <h4>3. Sélection du fichier</h4>
          <div className="file-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload"
              accept={fileType === 'excel' ? '.xlsx,.xls' : fileType === 'csv' ? '.csv,.txt' : '.json'}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={!selectedTable}
            />
            <label htmlFor="file-upload" className={`file-dropzone ${!selectedTable ? 'disabled' : ''}`}>
              {fileType === 'excel' ? <FileSpreadsheet size={48} /> : <FileUp size={48} />}
              <p><strong>Cliquez pour sélectionner un fichier</strong></p>
              <p>ou glissez-déposez votre fichier ici</p>
              <p className="file-requirements">
                Formats acceptés: {fileType === 'excel' ? 'Excel (XLSX, XLS)' : fileType === 'csv' ? 'CSV, TXT' : 'JSON'} 
                • Max 100MB
              </p>
              {!selectedTable && (
                <p className="file-warning">
                  <AlertTriangle size={14} /> Sélectionnez d'abord une table
                </p>
              )}
            </label>
            
            {selectedFile && (
              <div className="file-info-card">
                <div className="file-info-header">
                  {fileType === 'excel' ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
                  <div className="file-details">
                    <strong>{selectedFile.name}</strong>
                    <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="btn-icon"
                    title="Supprimer le fichier"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="file-info-footer">
                  <span className="file-type">{fileType.toUpperCase()}</span>
                  <span className="file-modified">
                    Modifié: {new Date(selectedFile.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const requiredColumns = tableInfo?.requiredColumns || [];
    const mappedCount = Object.values(columnMapping).filter(v => v).length;
    const requiredMapped = requiredColumns.filter(col => 
      Object.values(columnMapping).includes(col)
    ).length;
    
    return (
      <div className="upload-step">
        <div className="step-header">
          <h3><FileType size={20} /> Mapping des colonnes</h3>
          <p>Associez les colonnes de votre fichier aux colonnes de la base de données</p>
        </div>
        
        <div className="step-content">
          <div className="mapping-controls">
            <div className="mapping-actions">
              <button 
                onClick={autoMapColumns}
                className="btn-secondary"
                disabled={csvHeaders.length === 0}
                title="Mapping intelligent basé sur la similarité des noms"
              >
                <Sparkles size={16} /> Mapping intelligent
              </button>
              <button 
                onClick={mapAllColumnsAutomatically}
                className="btn-primary"
                disabled={!tableInfo?.columns || !csvHeaders}
                title="Mapper AUTOMATIQUEMENT TOUTES les colonnes (algorithme avancé)"
              >
                <Wand2 size={16} /> TOUT mapper automatiquement
              </button>
              <button 
                onClick={clearMapping}
                className="btn-secondary"
                title="Réinitialiser tous les mappings"
              >
                <RefreshCw size={16} /> Réinitialiser
              </button>
            </div>
            <div className="mapping-stats">
              <span className={`stat ${mappedCount === csvHeaders.length ? 'success' : ''}`}>
                <strong>{mappedCount}</strong>/{csvHeaders.length} colonnes mappées
              </span>
              <span className={`stat ${requiredMapped === requiredColumns.length ? 'success' : 'warning'}`}>
                <strong>{requiredMapped}</strong>/{requiredColumns.length} obligatoires
              </span>
              <span className="stat">
                <strong>{tableInfo?.columns?.length || 0}</strong> colonnes table
              </span>
            </div>
          </div>
          
          {mappedCount < csvHeaders.length && (
            <div className="mapping-alert">
              <Cpu size={16} />
              <div className="alert-content">
                <strong>Conseil :</strong> Cliquez sur <strong>"TOUT mapper automatiquement"</strong> pour mapper 
                automatiquement les {csvHeaders.length - mappedCount} colonne(s) restantes. 
                Le système utilisera un algorithme avancé de correspondance.
              </div>
            </div>
          )}
          
          {previewData.length > 0 && (
            <div className="preview-section">
              <div className="preview-header">
                <h4>Aperçu du fichier ({previewData.length - (hasHeader ? 1 : 0)} lignes)</h4>
                <span className="preview-info">
                  {csvHeaders.length} colonnes • {fileType.toUpperCase()}
                </span>
              </div>
              <div className="file-preview">
                <div className="preview-table-container">
                  <table>
                    <thead>
                      <tr>
                        {csvHeaders.map((header, index) => (
                          <th key={index}>
                            <div className="column-header">
                              <span className="column-index">#{index + 1}</span>
                              <span className="column-name" title={header}>
                                {header || `Colonne ${index + 1}`}
                              </span>
                              {columnMapping[header] && (
                                <span className="mapped-to" title={`Mappé vers: ${columnMapping[header]}`}>
                                  <Map size={12} /> {columnMapping[header]}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(hasHeader ? 1 : 0, Math.min(6, previewData.length)).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} title={cell}>
                              {cell ? (
                                cell.length > 50 ? `${cell.substring(0, 50)}...` : cell
                              ) : (
                                <span className="empty-cell">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          <div className="mapping-section">
            <div className="mapping-section-header">
              <h4>Association des colonnes</h4>
              <div className="mapping-help">
                <Info size={14} />
                <span>
                  <strong>Astuce :</strong> Utilisez le bouton "TOUT mapper automatiquement" pour mapper 
                  toutes les colonnes en une seule fois. Le système utilisera la similarité des noms, 
                  les synonymes et les correspondances par position.
                </span>
              </div>
            </div>
            
            <div className="mapping-table">
              <div className="mapping-header">
                <div className="mapping-col">Colonne fichier</div>
                <div className="mapping-col">Exemple</div>
                <div className="mapping-col">Colonne base</div>
                <div className="mapping-col">Type</div>
                <div className="mapping-col">Statut</div>
              </div>
              
              {csvHeaders.map((header, index) => {
                const exampleValue = previewData.length > 1 ? 
                  previewData[hasHeader ? 1 : 0][index] : '';
                const mappedColumn = columnMapping[header];
                const columnInfo = tableInfo?.columns?.find(col => col.name === mappedColumn);
                const isRequired = requiredColumns.includes(mappedColumn);
                const isPrimaryKey = columnInfo?.isPrimaryKey;
                
                return (
                  <div key={index} className={`mapping-row ${!mappedColumn ? 'unmapped' : ''}`}>
                    <div className="mapping-col">
                      <div className="file-column-info">
                        <span className="column-index">Colonne {index + 1}</span>
                        <strong className="column-name">{header}</strong>
                      </div>
                    </div>
                    
                    <div className="mapping-col">
                      <div className="example-cell" title={exampleValue}>
                        {exampleValue ? (
                          exampleValue.length > 20 ? `${exampleValue.substring(0, 20)}...` : exampleValue
                        ) : (
                          <span className="empty-example">—</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mapping-col">
                      <select
                        value={mappedColumn || ''}
                        onChange={(e) => handleColumnMapping(header, e.target.value)}
                        className={`${isRequired ? 'required' : ''} ${isPrimaryKey ? 'primary' : ''}`}
                      >
                        <option value="">-- Non mappé --</option>
                        
                        {requiredColumns.length > 0 && (
                          <optgroup label="🔴 Colonnes obligatoires">
                            {requiredColumns.map(col => {
                              const colInfo = tableInfo?.columns?.find(c => c.name === col);
                              return (
                                <option key={col} value={col}>
                                  {col} {colInfo?.isPrimaryKey ? '🔑' : '⚠️'}
                                </option>
                              );
                            })}
                          </optgroup>
                        )}
                        
                        {tableInfo?.columns?.filter(col => !requiredColumns.includes(col.name)).length > 0 && (
                          <optgroup label="🟢 Colonnes optionnelles">
                            {tableInfo.columns
                              .filter(col => !requiredColumns.includes(col.name))
                              .map(col => (
                                <option key={col.name} value={col.name}>
                                  {col.name} {col.isNullable ? '' : '(non nullable)'}
                                </option>
                              ))
                            }
                          </optgroup>
                        )}
                      </select>
                    </div>
                    
                    <div className="mapping-col">
                      {columnInfo && (
                        <div className="column-type-info">
                          <span className={`type-badge ${columnInfo.type?.toLowerCase()}`}>
                            {columnInfo.type}
                          </span>
                          {columnInfo.maxLength && (
                            <small>(max {columnInfo.maxLength})</small>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="mapping-col">
                      {mappedColumn ? (
                        <div className={`status-indicator ${isPrimaryKey ? 'primary' : isRequired ? 'required' : 'optional'}`}>
                          {isPrimaryKey ? (
                            <>
                              <Shield size={12} />
                              <span>Clé primaire</span>
                            </>
                          ) : isRequired ? (
                            <>
                              <AlertCircle size={12} />
                              <span>Obligatoire</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={12} />
                              <span>Optionnel</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="status-indicator unmapped">
                          <AlertTriangle size={12} />
                          <span>Non mappé</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {validationErrors.length > 0 && (
            <div className="validation-section">
              <div className="errors-panel">
                <div className="error-header">
                  <AlertCircle size={18} />
                  <h5>Erreurs de validation ({validationErrors.length})</h5>
                </div>
                <div className="errors-list">
                  {validationErrors.slice(0, 5).map((error, index) => (
                    <div key={index} className="error-item">
                      <FileX size={14} />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="step-actions">
            <button 
              onClick={() => setUploadStep(1)}
              className="btn-secondary"
            >
              <ChevronDown size={16} /> Retour
            </button>
            <button 
              onClick={validateFile}
              className="btn-primary"
              disabled={isUploading || requiredColumns.some(col => 
                !Object.values(columnMapping).includes(col)
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Validation en cours...
                </>
              ) : (
                <>
                  <FileCheck size={16} /> Valider et continuer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==============================================
  // RENDU PRINCIPAL
  // ==============================================
  return (
    <div className="upload-masse-container">
      <div className="upload-header">
        <div className="header-content">
          <h1>
            <Upload size={24} /> 
            <span>Importation de Masse</span>
            <span className="header-badge">Auto-Mapping</span>
          </h1>
          <p>
            Importez des données en masse dans la base de données. 
            <strong> Le système mappera automatiquement TOUTES les colonnes</strong> lors du chargement d'un fichier.
          </p>
        </div>
      </div>
      
      {/* Étapes de progression */}
      <div className="upload-steps-indicator">
        <div className={`step-indicator ${uploadStep >= 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <span className="step-label">Sélection</span>
        </div>
        <div className={`step-indicator ${uploadStep >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <span className="step-label">Mapping Auto</span>
        </div>
        <div className={`step-indicator ${uploadStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <span className="step-label">Validation</span>
        </div>
        <div className={`step-indicator ${uploadStep >= 4 ? 'active' : ''}`}>
          <div className="step-number">4</div>
          <span className="step-label">Résultats</span>
        </div>
      </div>
      
      {/* Contenu de l'étape actuelle */}
      <div className="upload-content">
        {uploadStep === 1 && renderStep1()}
        {uploadStep === 2 && renderStep2()}
        {uploadStep === 3 && (
          <div className="upload-step">
            <div className="step-header">
              <h3><FileCheck size={20} /> Validation finale</h3>
              <p>Vérifiez les paramètres avant de lancer l'importation</p>
            </div>
            <div className="step-content">
              <div className="validation-summary">
                <div className="summary-cards-grid">
                  <div className="summary-card">
                    <div className="card-icon file">
                      {fileType === 'excel' ? <FileSpreadsheet size={24} /> : <FileText size={24} />}
                    </div>
                    <div className="card-content">
                      <h4>Fichier</h4>
                      <p className="card-value">{selectedFile?.name}</p>
                    </div>
                  </div>
                  
                  <div className="summary-card">
                    <div className="card-icon database">
                      <Database size={24} />
                    </div>
                    <div className="card-content">
                      <h4>Destination</h4>
                      <p className="card-value">{selectedSchema}.{selectedTable}</p>
                    </div>
                  </div>
                  
                  <div className="summary-card">
                    <div className="card-icon mapping">
                      <CheckCircle size={24} />
                    </div>
                    <div className="card-content">
                      <h4>Mapping</h4>
                      <p className="card-value">
                        {Object.values(columnMapping).filter(v => v).length}/{csvHeaders.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="step-actions">
                <button 
                  onClick={() => setUploadStep(2)}
                  className="btn-secondary"
                >
                  <ChevronDown size={16} /> Retour au mapping
                </button>
                <button 
                  onClick={handleUpload}
                  className="btn-primary"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Importation en cours...
                    </>
                  ) : (
                    <>
                      <Upload size={16} /> Lancer l'importation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {uploadStep === 4 && uploadResult && (
          <div className="upload-step">
            <div className="step-header">
              <h3 className={uploadResult.success ? 'success' : 'error'}>
                {uploadResult.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {uploadResult.success ? 'Importation réussie' : 'Erreur d\'importation'}
              </h3>
            </div>
            <div className="step-content">
              <div className="result-summary">
                <div className="summary-message">
                  <h4>{uploadResult.message}</h4>
                  {uploadResult.details && (
                    <div className="result-details">
                      <p>Lignes traitées: {uploadResult.details.totalRows || 0}</p>
                      <p>Lignes importées: {uploadResult.details.importedRows || 0}</p>
                      {uploadResult.details.errorRows > 0 && (
                        <p>Erreurs: {uploadResult.details.errorRows}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="result-actions">
                  <button 
                    onClick={resetUpload}
                    className="btn-primary"
                  >
                    <RefreshCw size={16} /> Nouvel import
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <details>
            <summary>Debug Info</summary>
            <pre>
              CSV Headers: {csvHeaders.length}<br/>
              Table Columns: {tableInfo?.columns?.length || 0}<br/>
              Mapped: {Object.values(columnMapping).filter(v => v).length}<br/>
              Selected Table: {selectedTable}<br/>
              File Type: {fileType}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default UploadMasse;