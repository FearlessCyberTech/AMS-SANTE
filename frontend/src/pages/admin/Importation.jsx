import React, { useState, useCallback, useEffect } from 'react';
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
  TrendingUp, AlertTriangle, ExternalLink
} from 'lucide-react';
import { importAPI } from '../../services/api';
import './Importation.css';

const UploadMasse = () => {
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
  const [errorLogUrl, setErrorLogUrl] = useState(null);
  
  // États pour le chargement
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [loadingTableInfo, setLoadingTableInfo] = useState(false);
  
  // ==============================================
  // ÉTATS POUR L'HISTORIQUE ET STATISTIQUES
  // ==============================================
  const [importHistory, setImportHistory] = useState([]);
  const [importStats, setImportStats] = useState(null);
  const [historyFilters, setHistoryFilters] = useState({
    startDate: '',
    endDate: '',
    table: '',
    status: '',
    user: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // ==============================================
  // ÉTATS POUR LES DONNÉES DE RÉFÉRENCE
  // ==============================================
  const [referenceData, setReferenceData] = useState({});
  const [showReferenceData, setShowReferenceData] = useState(false);

  // ==============================================
  // FONCTION DE MAPPING AUTOMATIQUE AMÉLIORÉE
  // ==============================================
  const autoMapColumnsLocal = (csvHeaders, tableColumns) => {
    const mapping = {};
    if (!csvHeaders || !tableColumns) return mapping;

    // Normaliser les noms pour la comparaison
    const normalizeName = (name) => {
      if (!name) return '';
      return name
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/_/g, '')
        .trim();
    };

    // Créer des ensembles de noms normalisés
    const normalizedCsvHeaders = csvHeaders.map(header => ({
      original: header,
      normalized: normalizeName(header)
    }));

    const normalizedTableColumns = tableColumns.map(col => ({
      original: col.name,
      normalized: normalizeName(col.name),
      colInfo: col
    }));

    // 1. Correspondance exacte
    normalizedCsvHeaders.forEach(csvHeader => {
      const exactMatch = normalizedTableColumns.find(tableCol => 
        tableCol.normalized === csvHeader.normalized
      );
      if (exactMatch) {
        mapping[csvHeader.original] = exactMatch.original;
      }
    });

    // 2. Correspondance partielle (contient ou est contenu)
    normalizedCsvHeaders.forEach(csvHeader => {
      if (!mapping[csvHeader.original]) {
        const partialMatch = normalizedTableColumns.find(tableCol => 
          !Object.values(mapping).includes(tableCol.original) &&
          (
            csvHeader.normalized.includes(tableCol.normalized) ||
            tableCol.normalized.includes(csvHeader.normalized)
          )
        );
        if (partialMatch) {
          mapping[csvHeader.original] = partialMatch.original;
        }
      }
    });

    // 3. Correspondance par synonymes communs
    const commonSynonyms = {
      'id': ['identifiant', 'code', 'num', 'no', 'numero', 'ref', 'reference'],
      'nom': ['name', 'lastname', 'last_name', 'surname', 'familyname'],
      'prenom': ['firstname', 'first_name', 'givenname', 'given_name'],
      'date': ['dt', 'date_', 'dat', 'dte'],
      'email': ['mail', 'courriel', 'e_mail'],
      'telephone': ['phone', 'tel', 'mobile', 'cell', 'cellphone'],
      'adresse': ['address', 'addr', 'street', 'rue'],
      'ville': ['city', 'town'],
      'code': ['zip', 'postal', 'postcode', 'cp'],
      'pays': ['country', 'nation'],
      'statut': ['status', 'state', 'etat'],
      'type': ['category', 'categorie', 'class'],
      'montant': ['amount', 'total', 'sum', 'prix', 'price'],
      'quantite': ['quantity', 'qty', 'qte'],
      'description': ['desc', 'details', 'comment', 'note']
    };

    normalizedCsvHeaders.forEach(csvHeader => {
      if (!mapping[csvHeader.original]) {
        for (const [key, synonyms] of Object.entries(commonSynonyms)) {
          if (synonyms.some(syn => csvHeader.normalized.includes(normalizeName(syn)))) {
            const keyMatch = normalizedTableColumns.find(tableCol => 
              !Object.values(mapping).includes(tableCol.original) &&
              tableCol.normalized.includes(normalizeName(key))
            );
            if (keyMatch) {
              mapping[csvHeader.original] = keyMatch.original;
              break;
            }
          }
        }
      }
    });

    // 4. Mapper les colonnes requises en priorité
    const requiredColumns = tableColumns.filter(col => !col.isNullable || col.isPrimaryKey);
    if (requiredColumns.length > 0) {
      requiredColumns.forEach(reqCol => {
        if (!Object.values(mapping).includes(reqCol.name)) {
          // Chercher le meilleur match pour cette colonne requise
          const bestMatch = normalizedCsvHeaders.find(csvHeader => {
            if (mapping[csvHeader.original]) return false;
            const csvNorm = csvHeader.normalized;
            const colNorm = normalizeName(reqCol.name);
            return csvNorm.includes(colNorm) || colNorm.includes(csvNorm);
          });
          
          if (bestMatch) {
            mapping[bestMatch.original] = reqCol.name;
          }
        }
      });
    }

    return mapping;
  };

  // ==============================================
  // INITIALISATION
  // ==============================================
  useEffect(() => {
    initImportModule();
  }, []);

  const initImportModule = async () => {
    try {
      await loadSchemas();
      await loadImportStats();
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
        
        // Sélectionner le premier schéma par défaut
        if (response.schemas.length > 0) {
          const firstSchema = response.schemas.find(s => s.canImport) || response.schemas[0];
          setSelectedSchema(firstSchema.name);
          await loadAvailableTables(firstSchema.name);
        }
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
        
        // Sélectionner la première table par défaut
        if (importableTables.length > 0 && !selectedTable) {
          const firstTable = importableTables[0];
          setSelectedTable(firstTable.name);
          await loadTableInfo(firstTable.schema, firstTable.name);
        }
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
        
        // Utiliser le mapping automatique local
        if (csvHeaders.length > 0 && response.columns) {
          const autoMapping = autoMapColumnsLocal(csvHeaders, response.columns);
          setColumnMapping(autoMapping);
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

  const loadImportStats = async () => {
    try {
      const response = await importAPI.getImportStats();
      if (response.success) {
        setImportStats(response.stats);
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const loadImportHistory = async (page = 1) => {
    try {
      const response = await importAPI.getImportHistory({
        ...historyFilters,
        page,
        limit: 10
      });
      
      if (response.success) {
        setImportHistory(response.imports);
        setCurrentPage(response.pagination?.page || 1);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      showNotification('Erreur lors du chargement de l\'historique', 'error');
    }
  };

  const loadReferenceData = async (table, column) => {
    try {
      const response = await importAPI.getReferenceData(table, column);
      if (response.success && response.data) {
        setReferenceData(prev => ({
          ...prev,
          [`${table}.${column}`]: response.data
        }));
      }
    } catch (error) {
      console.error(`Erreur chargement données référence ${table}.${column}:`, error);
    }
  };

  // ==============================================
  // FONCTIONS UTILITAIRES
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
    setErrorLogUrl(null);
  };

  const showNotification = useCallback((message, type = 'info', duration = 5000) => {
    console.log(`Notification [${type}]: ${message}`);
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        ${type === 'success' ? '<CheckCircle size={16} />' : ''}
        ${type === 'error' ? '<AlertCircle size={16} />' : ''}
        ${type === 'warning' ? '<AlertTriangle size={16} />' : ''}
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, duration);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ==============================================
  // GESTION DES FICHIERS - AVEC SUPPORT EXCEL
  // ==============================================
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

  const readCSVFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      parseCSV(content);
    };
    
    reader.onerror = () => {
      showNotification('Erreur lors de la lecture du fichier', 'error');
    };
    
    reader.readAsText(file, 'UTF-8');
  };

  const readExcelFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
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
          
          // Utiliser le mapping automatique local
          if (tableInfo && tableInfo.columns) {
            const autoMapping = autoMapColumnsLocal(headers, tableInfo.columns);
            setColumnMapping(autoMapping);
          }
          
          setUploadStep(2);
          showNotification('Fichier Excel analysé avec succès', 'success');
        } else {
          showNotification('Le fichier Excel est vide', 'error');
        }
      } catch (error) {
        console.error('Erreur parsing Excel:', error);
        showNotification('Erreur lors de l\'analyse du fichier Excel', 'error');
      }
    };
    
    reader.onerror = () => {
      showNotification('Erreur lors de la lecture du fichier Excel', 'error');
    };
    
    reader.readAsBinaryString(file);
  };

  const readJSONFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      parseJSON(content);
    };
    
    reader.onerror = () => {
      showNotification('Erreur lors de la lecture du fichier', 'error');
    };
    
    reader.readAsText(file, 'UTF-8');
  };

  const parseCSV = (content) => {
    try {
      const parsedData = importAPI.parseCSV(content, delimiter, hasHeader);
      
      if (hasHeader && parsedData.length > 0) {
        const headers = parsedData[0];
        setCsvHeaders(headers);
        setPreviewData(parsedData);
        
        // Utiliser le mapping automatique local
        if (tableInfo && tableInfo.columns) {
          const autoMapping = autoMapColumnsLocal(headers, tableInfo.columns);
          setColumnMapping(autoMapping);
        }
      } else {
        const headers = parsedData[0]?.map((_, index) => `Colonne_${index + 1}`) || [];
        setCsvHeaders(headers);
        setPreviewData(parsedData);
      }
      
      setUploadStep(2);
      showNotification('Fichier analysé avec succès', 'success');
      
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
        
        // Utiliser le mapping automatique local
        if (tableInfo && tableInfo.columns) {
          const autoMapping = autoMapColumnsLocal(headers, tableInfo.columns);
          setColumnMapping(autoMapping);
        }
        
        setUploadStep(2);
        showNotification('Fichier JSON analysé avec succès', 'success');
      } else {
        showNotification('Le fichier JSON ne contient pas de tableau de données valide', 'error');
      }
    } catch (error) {
      console.error('Erreur parsing JSON:', error);
      showNotification('Erreur lors de l\'analyse du fichier JSON', 'error');
    }
  };

  // ==============================================
  // GESTION DU MAPPING DES COLONNES
  // ==============================================
  const handleColumnMapping = (csvColumn, tableColumn) => {
    setColumnMapping(prev => ({
      ...prev,
      [csvColumn]: tableColumn
    }));
  };

  const autoMapColumns = () => {
    if (tableInfo && tableInfo.columns && csvHeaders.length > 0) {
      const autoMapping = autoMapColumnsLocal(csvHeaders, tableInfo.columns);
      setColumnMapping(autoMapping);
      showNotification('Mapping automatique effectué', 'success');
    } else {
      showNotification('Impossible de générer le mapping automatique', 'warning');
    }
  };

  const clearMapping = () => {
    setColumnMapping({});
    showNotification('Mapping réinitialisé', 'info');
  };

  // ==============================================
  // VALIDATION DU FICHIER
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

  // ==============================================
  // IMPORTATION DU FICHIER
  // ==============================================
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

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const response = await importAPI.importFile(selectedFile, selectedTable, options);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        const report = importAPI.generateImportReport(response, response.errors || []);
        
        setUploadResult({
          success: true,
          message: response.message || 'Importation terminée avec succès',
          details: response.details || report.summary,
          errors: response.errors || [],
          warnings: response.warnings || []
        });
        
        await Promise.all([
          loadImportStats(),
          showHistory ? loadImportHistory(currentPage) : Promise.resolve()
        ]);
        
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
          warnings: []
        });
        showNotification(response.message || 'Erreur lors de l\'importation', 'error');
      }
      
      setIsUploading(false);
      setUploadStep(4);
    } catch (error) {
      console.error('Erreur importation:', error);
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
      setIsUploading(false);
      setUploadStep(4);
      showNotification('Erreur lors de l\'importation', 'error');
    }
  };

  // ==============================================
  // GESTION DES TEMPLATES - NOUVELLE VERSION
  // ==============================================
  const downloadTemplate = async () => {
    if (!selectedTable) {
      showNotification('Veuillez sélectionner une table', 'error');
      return;
    }

    try {
      setIsUploading(true);
      
      const templates = {
        'BENEFICIAIRE': {
          columns: [
            { name: 'IDENTIFIANT_NATIONAL', description: 'Identifiant unique national (ex: NAT123456789)', required: false, example: 'NAT123456789' },
            { name: 'NUM_PASSEPORT', description: 'Numéro de passeport', required: false, example: 'P1234567' },
            { name: 'NOM_BEN', description: 'Nom du bénéficiaire', required: true, example: 'DUPONT' },
            { name: 'PRE_BEN', description: 'Prénom du bénéficiaire', required: true, example: 'Jean' },
            { name: 'SEX_BEN', description: 'Sexe (M/F)', required: false, example: 'M' },
            { name: 'NAI_BEN', description: 'Date de naissance (JJ/MM/AAAA)', required: false, example: '15/05/1980' },
            { name: 'LIEU_NAISSANCE', description: 'Lieu de naissance', required: false, example: 'Paris, France' },
            { name: 'COD_PAY', description: 'Code pays (2 lettres)', required: false, example: 'FR' },
            { name: 'TELEPHONE_MOBILE', description: 'Téléphone mobile', required: false, example: '+33123456789' },
            { name: 'TELEPHONE', description: 'Téléphone fixe', required: false, example: '+33198765432' },
            { name: 'EMAIL', description: 'Adresse email', required: false, example: 'jean.dupont@email.com' },
            { name: 'GROUPE_SANGUIN', description: 'Groupe sanguin (A, B, AB, O)', required: false, example: 'A' },
            { name: 'RHESUS', description: 'Rhésus (+, -)', required: false, example: '+' },
            { name: 'STATUT_ACE', description: 'Statut (ASSURE_PRINCIPAL, CONJOINT, ENFANT, ASCENDANT)', required: false, example: 'ASSURE_PRINCIPAL' },
            { name: 'ID_ASSURE_PRINCIPAL', description: 'ID de l\'assuré principal (si dépendant)', required: false, example: '' },
            { name: 'PROFESSION', description: 'Profession', required: false, example: 'Ingénieur' },
            { name: 'EMPLOYEUR', description: 'Employeur', required: false, example: 'Société XYZ' },
            { name: 'SITUATION_FAMILIALE', description: 'Situation familiale', required: false, example: 'Marié' },
            { name: 'ADRESSE', description: 'Adresse complète', required: false, example: '123 Rue Principale, 75001 Paris' },
            { name: 'COD_REGION', description: 'Code région', required: false, example: 'REG001' },
            { name: 'CODE_TRIBAL', description: 'Code tribal', required: false, example: 'T001' },
            { name: 'ZONE_HABITATION', description: 'Zone d\'habitation (Urbaine, Rurale)', required: false, example: 'Urbaine' },
            { name: 'TYPE_HABITAT', description: 'Type d\'habitat (Appartement, Maison)', required: false, example: 'Appartement' },
            { name: 'ACCES_EAU', description: 'Accès à l\'eau (1=Oui, 0=Non)', required: false, example: 1 },
            { name: 'ACCES_ELECTRICITE', description: 'Accès à l\'électricité (1=Oui, 0=Non)', required: false, example: 1 },
            { name: 'DISTANCE_CENTRE_SANTE', description: 'Distance au centre de santé (km)', required: false, example: 5 },
            { name: 'MOYEN_TRANSPORT', description: 'Moyen de transport principal', required: false, example: 'Voiture' }
          ],
          description: 'Template pour l\'importation des bénéficiaires',
          instructions: [
            '⚠️ Les champs NOM_BEN et PRE_BEN sont obligatoires',
            '⚠️ Les champs IDENTIFIANT_NATIONAL et NUM_PASSEPORT doivent être uniques',
            '⚠️ Le format de date doit être JJ/MM/AAAA',
            '⚠️ Les champs booléens: 1 = Oui, 0 = Non',
            '⚠️ Les champs SEX_BEN: M = Masculin, F = Féminin'
          ]
        },
        'PRESTATAIRE': {
          columns: [
            { name: 'COD_PRE', description: 'Code prestataire (unique)', required: true, example: 'HOP001' },
            { name: 'NOM_PRESTATAIRE', description: 'Nom du prestataire', required: true, example: 'Hôpital Central' },
            { name: 'TYPE_PRESTATAIRE', description: 'Type (HOPITAL, CLINIQUE, CABINET, LABORATOIRE, PHARMACIE)', required: true, example: 'HOPITAL' },
            { name: 'ADRESSE', description: 'Adresse complète', required: false, example: '123 Rue Principale, 75001 Paris' },
            { name: 'TELEPHONE', description: 'Numéro de téléphone', required: false, example: '+33123456789' },
            { name: 'EMAIL', description: 'Adresse email', required: false, example: 'contact@hopital-central.fr' },
            { name: 'SPECIALITE', description: 'Spécialité médicale', required: false, example: 'Médecine Générale, Chirurgie' },
            { name: 'ACTIF', description: 'Statut actif (1=Oui, 0=Non)', required: false, example: 1 }
          ],
          description: 'Template pour l\'importation des prestataires de soins',
          instructions: [
            '⚠️ Les champs COD_PRE, NOM_PRESTATAIRE et TYPE_PRESTATAIRE sont obligatoires',
            '⚠️ COD_PRE doit être unique',
            '⚠️ Le champ ACTIF: 1 = Actif, 0 = Inactif'
          ]
        },
        'CENTRE': {
          columns: [
            { name: 'COD_CEN', description: 'Code centre (unique)', required: true, example: 'CTR001' },
            { name: 'LIB_CEN', description: 'Libellé du centre', required: true, example: 'Centre de Santé Principal' },
            { name: 'TYPE_CENTRE', description: 'Type (CS, PS, HD)', required: false, example: 'CS' },
            { name: 'ADRESSE', description: 'Adresse complète', required: false, example: '123 Rue Centrale, 75001 Paris' },
            { name: 'TELEPHONE', description: 'Numéro de téléphone', required: false, example: '+33123456789' },
            { name: 'EMAIL', description: 'Adresse email', required: false, example: 'contact@centre-sante-paris.fr' },
            { name: 'RESPONSABLE', description: 'Nom du responsable', required: false, example: 'Dr. Jean Dupont' },
            { name: 'CAPACITE', description: 'Capacité d\'accueil', required: false, example: 500 },
            { name: 'ACTIF', description: 'Statut actif (1=Oui, 0=Non)', required: false, example: 1 }
          ],
          description: 'Template pour l\'importation des centres de santé',
          instructions: [
            '⚠️ Les champs COD_CEN et LIB_CEN sont obligatoires',
            '⚠️ COD_CEN doit être unique',
            '⚠️ Le champ ACTIF: 1 = Actif, 0 = Inactif'
          ]
        },
        'UTILISATEUR': {
          columns: [
            { name: 'LOG_UTI', description: 'Login utilisateur (unique)', required: true, example: 'admin' },
            { name: 'PWD_UTI', description: 'Mot de passe', required: true, example: 'Admin123!' },
            { name: 'NOM_UTI', description: 'Nom de l\'utilisateur', required: false, example: 'Admin' },
            { name: 'PRE_UTI', description: 'Prénom de l\'utilisateur', required: false, example: 'Système' },
            { name: 'EMAIL_UTI', description: 'Adresse email (unique)', required: false, example: 'admin@system.com' },
            { name: 'PROFIL_UTI', description: 'Profil (ADMINISTRATEUR, MEDECIN, SECRETAIRE, AGENT)', required: true, example: 'ADMINISTRATEUR' },
            { name: 'ACTIF', description: 'Statut actif (1=Oui, 0=Non)', required: false, example: 1 },
            { name: 'DATE_EXPIRATION', description: 'Date d\'expiration (JJ/MM/AAAA)', required: false, example: '31/12/2025' }
          ],
          description: 'Template pour l\'importation des utilisateurs',
          instructions: [
            '⚠️ Les champs LOG_UTI, PWD_UTI et PROFIL_UTI sont obligatoires',
            '⚠️ LOG_UTI et EMAIL_UTI doivent être uniques',
            '⚠️ Le champ ACTIF: 1 = Actif, 0 = Inactif',
            '⚠️ Le format de date doit être JJ/MM/AAAA'
          ]
        },
        'CARTE': {
          columns: [
            { name: 'ID_BEN', description: 'ID du bénéficiaire', required: false, example: 1 },
            { name: 'NUM_CAR', description: 'Numéro de carte (clé primaire)', required: true, example: 'CARD001' },
            { name: 'COD_CAR', description: 'Code carte (clé primaire)', required: true, example: 'C' },
            { name: 'COD_PAY', description: 'Code pays (clé primaire)', required: true, example: 'FR' },
            { name: 'NOM_BEN', description: 'Nom sur la carte', required: false, example: 'DUPONT' },
            { name: 'PRE_BEN', description: 'Prénom sur la carte', required: false, example: 'Jean' },
            { name: 'SOC_BEN', description: 'Numéro de sécurité sociale', required: false, example: 'XYZ001' },
            { name: 'NAG_ASS', description: 'Numéro d\'agrément assurance', required: false, example: 'NAG001' },
            { name: 'PRM_BEN', description: 'Numéro de prime', required: false, example: 'PRM001' },
            { name: 'DDV_CAR', description: 'Date début validité (JJ/MM/AAAA)', required: false, example: '01/01/2024' },
            { name: 'DFV_CAR', description: 'Date fin validité (JJ/MM/AAAA)', required: false, example: '31/12/2024' },
            { name: 'STS_CAR', description: 'Statut (1=Actif, 0=Inactif)', required: false, example: 1 }
          ],
          description: 'Template pour l\'importation des cartes des bénéficiaires',
          instructions: [
            '⚠️ Les champs NUM_CAR, COD_CAR et COD_PAY sont obligatoires',
            '⚠️ La combinaison NUM_CAR+COD_CAR+COD_PAY doit être unique',
            '⚠️ DDV_CAR doit être antérieure à DFV_CAR',
            '⚠️ Le format de date doit être JJ/MM/AAAA',
            '⚠️ Le champ STS_CAR: 1 = Actif, 0 = Inactif'
          ]
        }
      };

      const template = templates[selectedTable.toUpperCase()];
      
      if (!template) {
        showNotification(`Aucun template disponible pour la table ${selectedTable}`, 'warning');
        
        const response = await importAPI.downloadTemplate(
          selectedTable, 
          fileType,
          selectedSchema
        );
        
        if (response.success) {
          showNotification(`Template ${response.fileName} téléchargé avec succès`, 'success');
        } else {
          showNotification(response.message || 'Erreur lors du téléchargement', 'error');
        }
        return;
      }

      const workbook = XLSX.utils.book_new();
      
      const metadata = [
        [`Template d'importation: ${template.description}`],
        [`Table: ${selectedTable}`],
        [`Généré le: ${new Date().toLocaleDateString('fr-FR')}`],
        [`Généré par: System`],
        [''],
        ['INSTRUCTIONS IMPORTANTES:'],
        ...template.instructions.map(instruction => [instruction]),
        [''],
        ['COLONNES:']
      ];
      
      const metadataWs = XLSX.utils.aoa_to_sheet(metadata);
      XLSX.utils.book_append_sheet(workbook, metadataWs, 'Instructions');
      
      const headers = template.columns.map(col => col.name);
      const descriptions = template.columns.map(col => col.description);
      const examples = template.columns.map(col => col.example || '');
      
      const data = [
        headers,
        descriptions,
        examples,
        ...Array(10).fill().map(() => headers.map(() => ''))
      ];
      
      const dataWs = XLSX.utils.aoa_to_sheet(data);
      
      const range = XLSX.utils.decode_range(dataWs['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const headerCell = XLSX.utils.encode_cell({r: 0, c: C});
        if (!dataWs[headerCell]) continue;
        dataWs[headerCell].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4F81BD" } }
        };
        
        const descCell = XLSX.utils.encode_cell({r: 1, c: C});
        if (dataWs[descCell]) {
          dataWs[descCell].s = {
            font: { italic: true, color: { rgb: "666666" } },
            fill: { fgColor: { rgb: "F2F2F2" } }
          };
        }
        
        const exampleCell = XLSX.utils.encode_cell({r: 2, c: C});
        if (dataWs[exampleCell]) {
          dataWs[exampleCell].s = {
            font: { color: { rgb: "006600" } },
            fill: { fgColor: { rgb: "E6FFE6" } }
          };
        }
      }
      
      dataWs['!cols'] = headers.map(() => ({ width: 20 }));
      
      XLSX.utils.book_append_sheet(workbook, dataWs, 'Données');
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const fileName = `template_${selectedTable.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.download = fileName;
      
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      showNotification(`Template ${fileName} téléchargé avec succès`, 'success');
      
    } catch (error) {
      console.error('Erreur téléchargement template:', error);
      showNotification('Erreur lors de la génération du template Excel', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // ==============================================
  // GESTION DE L'HISTORIQUE
  // ==============================================
  const applyHistoryFilters = () => {
    setCurrentPage(1);
    loadImportHistory(1);
  };

  const clearHistoryFilters = () => {
    setHistoryFilters({
      startDate: '',
      endDate: '',
      table: '',
      status: '',
      user: ''
    });
    setCurrentPage(1);
    loadImportHistory(1);
  };

  // ==============================================
  // RENDU DES ÉTAPES
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
                          <p className="table-description">{table.description || table.name}</p>
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
                <button 
                  onClick={() => setShowReferenceData(!showReferenceData)}
                  className="btn-secondary btn-sm"
                >
                  <BookOpen size={14} /> Données de référence
                </button>
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
              
              {showReferenceData && tableInfo.foreignKeys && tableInfo.foreignKeys.length > 0 && (
                <div className="reference-data-section">
                  <h6>Tables de référence</h6>
                  <div className="reference-tables">
                    {tableInfo.foreignKeys.map((fk, index) => (
                      <div key={index} className="reference-table">
                        <span className="fk-column">{fk.column} →</span>
                        <span className="fk-table">{fk.referencedTable}</span>
                        <button 
                          onClick={() => loadReferenceData(fk.referencedTable, fk.referencedColumn)}
                          className="btn-icon-small"
                          title="Charger les données de référence"
                        >
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="form-section">
          <h4>3. Paramètres d'import</h4>
          <div className="import-settings-grid">
            <div className="setting-group">
              <label>Format du fichier</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="fileType" 
                    value="excel" 
                    checked={fileType === 'excel'}
                    onChange={(e) => setFileType(e.target.value)}
                  />
                  <FileSpreadsheet size={16} />
                  <span>Excel (.xlsx, .xls)</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="fileType" 
                    value="csv" 
                    checked={fileType === 'csv'}
                    onChange={(e) => setFileType(e.target.value)}
                  />
                  <FileText size={16} />
                  <span>CSV (.csv, .txt)</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="fileType" 
                    value="json" 
                    checked={fileType === 'json'}
                    onChange={(e) => setFileType(e.target.value)}
                  />
                  <FileCog size={16} />
                  <span>JSON (.json)</span>
                </label>
              </div>
            </div>
            
            {fileType === 'csv' && (
              <>
                <div className="setting-group">
                  <label>Délimiteur</label>
                  <div className="button-group">
                    {[',', ';', '\t', '|'].map(delim => (
                      <button
                        key={delim}
                        type="button"
                        className={`btn-sm ${delimiter === delim ? 'active' : ''}`}
                        onClick={() => setDelimiter(delim)}
                      >
                        {delim === '\t' ? 'Tab' : delim}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="setting-group">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={hasHeader}
                      onChange={(e) => setHasHeader(e.target.checked)}
                    />
                    <span>Première ligne = en-tête</span>
                  </label>
                  <small>La première ligne contient les noms des colonnes</small>
                </div>
              </>
            )}
            
            <div className="setting-group">
              <label>Mode d'importation</label>
              <select 
                value={importMode}
                onChange={(e) => setImportMode(e.target.value)}
              >
                <option value={IMPORT_MODES.UPSERT}>Insertion et mise à jour (upsert)</option>
                <option value={IMPORT_MODES.INSERT_ONLY}>Insertion seulement</option>
                <option value={IMPORT_MODES.UPDATE_ONLY}>Mise à jour seulement</option>
              </select>
            </div>
            
            <div className="setting-group">
              <label>Gestion des doublons</label>
              <select 
                value={duplicateStrategy}
                onChange={(e) => setDuplicateStrategy(e.target.value)}
              >
                <option value={DUPLICATE_STRATEGIES.UPDATE}>Mettre à jour</option>
                <option value={DUPLICATE_STRATEGIES.SKIP}>Ignorer</option>
                <option value={DUPLICATE_STRATEGIES.ERROR}>Erreur</option>
              </select>
            </div>
            
            <div className="setting-group">
              <label>Gestion des erreurs</label>
              <select 
                value={errorHandling}
                onChange={(e) => setErrorHandling(e.target.value)}
              >
                <option value={ERROR_HANDLING.CONTINUE}>Continuer</option>
                <option value={ERROR_HANDLING.STOP}>Arrêter</option>
                <option value={ERROR_HANDLING.SKIP_ROW}>Ignorer la ligne</option>
              </select>
            </div>
            
            <div className="setting-group">
              <label>Taille du lot</label>
              <div className="range-input">
                <input 
                  type="range" 
                  min="10" 
                  max="1000" 
                  step="10"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                />
                <span className="range-value">{batchSize} lignes</span>
              </div>
              <small>Nombre d'enregistrements traités par lot</small>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h4>4. Sélection du fichier</h4>
          <div className="file-upload-area">
            <input
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
                    onClick={() => setSelectedFile(null)}
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
            
            <div className="template-section">
              <div className="template-header">
                <FileSpreadsheet size={20} />
                <div>
                  <p><strong>Vous ne savez pas comment formater votre fichier ?</strong></p>
                  <p>Téléchargez le template Excel pour voir le format attendu</p>
                </div>
              </div>
              <div className="template-actions">
                <button 
                  onClick={downloadTemplate}
                  className="btn-secondary"
                  disabled={!selectedTable || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Download size={16} /> Télécharger le template Excel
                    </>
                  )}
                </button>
                <button 
                  onClick={() => showNotification('Le template contient les colonnes exactes de la table sélectionnée avec des exemples et instructions', 'info')}
                  className="btn-text"
                >
                  <Info size={14} /> Aide
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const requiredColumns = tableInfo?.requiredColumns || [];
    
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
              >
                <Zap size={16} /> Mapping automatique
              </button>
              <button 
                onClick={clearMapping}
                className="btn-secondary"
              >
                <RefreshCw size={16} /> Réinitialiser
              </button>
            </div>
            <div className="mapping-stats">
              <span className="stat">
                <strong>{Object.values(columnMapping).filter(v => v).length}</strong> colonnes mappées
              </span>
              <span className="stat">
                <strong>{requiredColumns.length}</strong> obligatoires
              </span>
              <span className="stat">
                <strong>{csvHeaders.length}</strong> colonnes fichier
              </span>
            </div>
          </div>
          
          {previewData.length > 0 && (
            <div className="preview-section">
              <div className="preview-header">
                <h4>Aperçu du fichier</h4>
                <span className="preview-info">
                  {previewData.length - (hasHeader ? 1 : 0)} lignes • 
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
                                  → {columnMapping[header]}
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
                <span>Sélectionnez la colonne de base de données correspondante pour chaque colonne du fichier</span>
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
                
                return (
                  <div key={index} className="mapping-row">
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
                        className={isRequired ? 'required' : ''}
                      >
                        <option value="">-- Non mappé --</option>
                        
                        {requiredColumns.length > 0 && (
                          <optgroup label="Colonnes obligatoires">
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
                          <optgroup label="Colonnes optionnelles">
                            {tableInfo.columns
                              .filter(col => !requiredColumns.includes(col.name))
                              .map(col => (
                                <option key={col.name} value={col.name}>
                                  {col.name} {col.isNullable ? '(nullable)' : ''}
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
                        <div className={`status-indicator ${isRequired ? 'required' : 'optional'}`}>
                          {isRequired ? (
                            <>
                              <Shield size={12} />
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
                          <AlertCircle size={12} />
                          <span>Non mappé</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="validation-section">
            {validationWarnings.length > 0 && (
              <div className="warnings-panel">
                <div className="warning-header">
                  <AlertTriangle size={18} />
                  <h5>Avertissements ({validationWarnings.length})</h5>
                </div>
                <div className="warnings-list">
                  {validationWarnings.slice(0, 5).map((warning, index) => (
                    <div key={index} className="warning-item">
                      <span>{warning}</span>
                    </div>
                  ))}
                  {validationWarnings.length > 5 && (
                    <div className="more-warnings">
                      ... et {validationWarnings.length - 5} avertissement(s) supplémentaires
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {validationErrors.length > 0 && (
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
                  {validationErrors.length > 5 && (
                    <div className="more-errors">
                      ... et {validationErrors.length - 5} erreur(s) supplémentaire(s)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
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

  const renderStep3 = () => {
    const requiredColumns = tableInfo?.requiredColumns || [];
    const mappedCount = Object.values(columnMapping).filter(v => v).length;
    const mappedRequired = requiredColumns.filter(col => 
      Object.values(columnMapping).includes(col)
    ).length;
    
    return (
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
                  <small className="card-subtext">
                    {selectedFile ? formatFileSize(selectedFile.size) : '—'}
                  </small>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="card-icon database">
                  <Database size={24} />
                </div>
                <div className="card-content">
                  <h4>Destination</h4>
                  <p className="card-value">{selectedSchema}.{selectedTable}</p>
                  <small className="card-subtext">
                    {tableInfo?.columns?.length || 0} colonnes
                  </small>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="card-icon data">
                  <BarChart size={24} />
                </div>
                <div className="card-content">
                  <h4>Données</h4>
                  <p className="card-value">{previewData.length - (hasHeader ? 1 : 0)} lignes</p>
                  <small className="card-subtext">
                    Lot de {batchSize} lignes
                  </small>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="card-icon mapping">
                  <CheckCircle size={24} />
                </div>
                <div className="card-content">
                  <h4>Mapping</h4>
                  <p className="card-value">{mappedCount}/{tableInfo?.columns?.length || 0}</p>
                  <small className="card-subtext">
                    {mappedRequired}/{requiredColumns.length} obligatoires
                  </small>
                </div>
              </div>
            </div>
          </div>
          
          <div className="validation-details">
            <div className="detail-section">
              <h4>Paramètres d'importation</h4>
              <div className="params-grid">
                <div className="param-item">
                  <span className="param-label">Format:</span>
                  <span className="param-value">{fileType.toUpperCase()}</span>
                </div>
                {fileType === 'csv' && (
                  <div className="param-item">
                    <span className="param-label">Délimiteur:</span>
                    <span className="param-value">
                      {delimiter === '\t' ? 'Tabulation' : delimiter}
                    </span>
                  </div>
                )}
                <div className="param-item">
                  <span className="param-label">En-tête:</span>
                  <span className="param-value">{hasHeader ? 'Oui ✓' : 'Non ✗'}</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Mode:</span>
                  <span className="param-value">
                    {importMode === IMPORT_MODES.UPSERT ? 'Insertion/Mise à jour' :
                     importMode === IMPORT_MODES.INSERT_ONLY ? 'Insertion seule' :
                     'Mise à jour seule'}
                  </span>
                </div>
                <div className="param-item">
                  <span className="param-label">Doublons:</span>
                  <span className="param-value">
                    {duplicateStrategy === DUPLICATE_STRATEGIES.UPDATE ? 'Mettre à jour' :
                     duplicateStrategy === DUPLICATE_STRATEGIES.SKIP ? 'Ignorer' : 'Erreur'}
                  </span>
                </div>
                <div className="param-item">
                  <span className="param-label">Erreurs:</span>
                  <span className="param-value">
                    {errorHandling === ERROR_HANDLING.CONTINUE ? 'Continuer' :
                     errorHandling === ERROR_HANDLING.STOP ? 'Arrêter' : 'Ignorer ligne'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h4>Colonnes obligatoires</h4>
              <div className="required-columns-grid">
                {requiredColumns.map(col => {
                  const isMapped = Object.values(columnMapping).includes(col);
                  const colInfo = tableInfo?.columns?.find(c => c.name === col);
                  
                  return (
                    <div 
                      key={col} 
                      className={`required-column-item ${isMapped ? 'mapped' : 'missing'}`}
                      title={colInfo?.description || col}
                    >
                      <div className="column-name">
                        {col}
                        {colInfo?.isPrimaryKey && <span className="pk-badge">PK</span>}
                      </div>
                      <div className="column-status">
                        {isMapped ? (
                          <span className="status-success">
                            <CheckCircle size={12} /> Mappé
                          </span>
                        ) : (
                          <span className="status-error">
                            <AlertCircle size={12} /> Manquant
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="warning-section">
              <div className="warning-card">
                <div className="warning-icon">
                  <AlertTriangle size={24} />
                </div>
                <div className="warning-content">
                  <h5>Important</h5>
                  <p>L'importation de masse peut prendre plusieurs minutes selon la taille du fichier.</p>
                  <ul>
                    <li>Toutes les données seront validées avant insertion</li>
                    <li>Les doublons seront traités selon la stratégie sélectionnée</li>
                    <li>Les erreurs seront enregistrées dans un journal téléchargeable</li>
                    <li>L'opération peut être annulée pendant le traitement</li>
                  </ul>
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
              disabled={isUploading || mappedRequired < requiredColumns.length}
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Préparation...
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
    );
  };

  const renderStep4 = () => {
    if (!uploadResult) return null;
    
    const totalRows = uploadResult.details?.totalRows || 0;
    const importedRows = uploadResult.details?.importedRows || 0;
    const errorRows = uploadResult.details?.errorRows || 0;
    const successRate = totalRows > 0 ? (importedRows / totalRows * 100).toFixed(2) : 0;
    
    return (
      <div className="upload-step">
        <div className="step-header">
          <h3 className={uploadResult.success ? 'success' : 'error'}>
            {uploadResult.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            Résultats de l'importation
          </h3>
          <p>Récapitulatif de l'opération d'importation</p>
        </div>
        
        <div className="step-content">
          <div className={`result-summary ${uploadResult.success ? 'success' : 'error'}`}>
            <div className="summary-header">
              <div className="summary-icon">
                {uploadResult.success ? <CheckCircle size={48} /> : <AlertCircle size={48} />}
              </div>
              <div className="summary-message">
                <h4>{uploadResult.message}</h4>
                <p>Importation terminée • {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            
            <div className="result-stats">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value total">{totalRows.toLocaleString()}</div>
                  <div className="stat-label">Total traité</div>
                </div>
                <div className="stat-card success">
                  <div className="stat-value success">{importedRows.toLocaleString()}</div>
                  <div className="stat-label">Insérés</div>
                </div>
                <div className="stat-card error">
                  <div className="stat-value error">{errorRows.toLocaleString()}</div>
                  <div className="stat-label">Erreurs</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value rate">{successRate}%</div>
                  <div className="stat-label">Taux de réussite</div>
                </div>
              </div>
              
              {errorRows > 0 && (
                <div className="progress-chart">
                  <div className="progress-labels">
                    <span>Succès: {importedRows} ({successRate}%)</span>
                    <span>Erreurs: {errorRows} ({totalRows > 0 ? (errorRows / totalRows * 100).toFixed(2) : 0}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-success" 
                      style={{ width: `${successRate}%` }}
                    ></div>
                    <div 
                      className="progress-error" 
                      style={{ width: `${100 - successRate}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {uploadResult.errors && uploadResult.errors.length > 0 && (
            <div className="error-details">
              <div className="error-header">
                <AlertCircle size={20} />
                <h4>Erreurs rencontrées ({uploadResult.errors.length})</h4>
              </div>
              <div className="errors-list">
                {uploadResult.errors.slice(0, 10).map((error, index) => (
                  <div key={index} className="error-item">
                    <div className="error-icon">
                      <FileX size={14} />
                    </div>
                    <div className="error-message">{error}</div>
                  </div>
                ))}
                {uploadResult.errors.length > 10 && (
                  <div className="more-errors">
                    ... et {uploadResult.errors.length - 10} erreur(s) supplémentaire(s)
                  </div>
                )}
              </div>
            </div>
          )}
          
          {uploadResult.warnings && uploadResult.warnings.length > 0 && (
            <div className="warning-details">
              <div className="warning-header">
                <AlertTriangle size={20} />
                <h4>Avertissements ({uploadResult.warnings.length})</h4>
              </div>
              <div className="warnings-list">
                {uploadResult.warnings.slice(0, 5).map((warning, index) => (
                  <div key={index} className="warning-item">
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="result-actions">
            <div className="action-buttons">
              <button 
                onClick={resetUpload}
                className="btn-secondary"
              >
                <RefreshCw size={16} /> Nouvel import
              </button>
              
              {errorRows > 0 && (
                <button 
                  className="btn-primary"
                  onClick={() => {
                    // Télécharger le journal des erreurs
                    const errorLog = uploadResult.errors?.join('\n') || '';
                    const blob = new Blob([errorLog], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `erreurs_import_${selectedTable}_${new Date().toISOString().split('T')[0]}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download size={16} /> Télécharger les erreurs
                </button>
              )}
              
              <button 
                onClick={() => setShowStats(true)}
                className="btn-secondary"
              >
                <TrendingUp size={16} /> Voir les statistiques
              </button>
            </div>
            
            <div className="next-steps">
              <h5>Prochaines étapes recommandées:</h5>
              <ul>
                <li>Vérifier les données importées dans la table {selectedSchema}.{selectedTable}</li>
                <li>Exécuter des requêtes de validation pour vérifier l'intégrité des données</li>
                <li>Planifier une synchronisation régulière si nécessaire</li>
                <li>Consulter l'historique des imports pour le suivi</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="history-section">
      <div className="section-header">
        <h3><History size={20} /> Historique des imports</h3>
        <div className="header-actions">
          <button 
            onClick={() => {
              setShowStats(!showStats);
              if (!showStats) loadImportStats();
            }}
            className="btn-secondary"
          >
            {showStats ? (
              <>
                <History size={16} /> Historique
              </>
            ) : (
              <>
                <TrendingUp size={16} /> Statistiques
              </>
            )}
          </button>
          <button 
            onClick={() => setShowHistory(false)}
            className="btn-icon"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      {showStats ? (
        renderStats()
      ) : (
        <>
          <div className="history-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>Date de début</label>
                <input 
                  type="date" 
                  value={historyFilters.startDate}
                  onChange={(e) => setHistoryFilters(prev => ({ 
                    ...prev, 
                    startDate: e.target.value 
                  }))}
                />
              </div>
              
              <div className="filter-group">
                <label>Date de fin</label>
                <input 
                  type="date" 
                  value={historyFilters.endDate}
                  onChange={(e) => setHistoryFilters(prev => ({ 
                    ...prev, 
                    endDate: e.target.value 
                  }))}
                />
              </div>
              
              <div className="filter-group">
                <label>Table</label>
                <select 
                  value={historyFilters.table}
                  onChange={(e) => setHistoryFilters(prev => ({ 
                    ...prev, 
                    table: e.target.value 
                  }))}
                >
                  <option value="">Toutes les tables</option>
                  {availableTables.map(table => (
                    <option key={`${table.schema}.${table.name}`} value={table.name}>
                      {table.schema}.{table.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Statut</label>
                <select 
                  value={historyFilters.status}
                  onChange={(e) => setHistoryFilters(prev => ({ 
                    ...prev, 
                    status: e.target.value 
                  }))}
                >
                  <option value="">Tous</option>
                  <option value="success">Succès</option>
                  <option value="error">Erreur</option>
                  <option value="partial">Partiel</option>
                </select>
              </div>
            </div>
            
            <div className="filter-actions">
              <button 
                onClick={applyHistoryFilters}
                className="btn-primary"
              >
                <Filter size={16} /> Appliquer
              </button>
              <button 
                onClick={clearHistoryFilters}
                className="btn-secondary"
              >
                <RefreshCw size={16} /> Réinitialiser
              </button>
            </div>
          </div>
          
          <div className="history-table">
            {importHistory.length === 0 ? (
              <div className="empty-state">
                <History size={48} />
                <p>Aucun historique d'importation</p>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="btn-secondary"
                >
                  <Upload size={16} /> Effectuer un import
                </button>
              </div>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Table</th>
                      <th>Fichier</th>
                      <th>Statut</th>
                      <th>Résultats</th>
                      <th>Utilisateur</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importHistory.map(importItem => (
                      <tr key={importItem.id}>
                        <td>{formatDate(importItem.timestamp)}</td>
                        <td>
                          <div className="table-cell">
                            <span className="schema">{importItem.schema}.</span>
                            <strong>{importItem.table}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="file-cell">
                            <FileText size={14} />
                            <span className="filename">{importItem.file}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${importItem.status}`}>
                            {importItem.status === 'success' ? 'Succès' : 
                             importItem.status === 'error' ? 'Erreur' : 'Partiel'}
                          </span>
                        </td>
                        <td>
                          <div className="results-cell">
                            <span className="success">{importItem.importedRows}</span>
                            <span className="separator">/</span>
                            <span className="total">{importItem.totalRows}</span>
                            {importItem.errorRows > 0 && (
                              <span className="errors">({importItem.errorRows} err.)</span>
                            )}
                          </div>
                        </td>
                        <td>{importItem.user}</td>
                        <td>
                          {importItem.details && (
                            <button 
                              onClick={() => {
                                console.log('Détails import:', importItem.details);
                                showNotification('Détails affichés dans la console', 'info');
                              }}
                              className="btn-icon-small"
                              title="Voir les détails"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => loadImportHistory(1)}
                      disabled={currentPage === 1}
                      className="btn-icon"
                    >
                      <ChevronFirst size={16} />
                    </button>
                    <button 
                      onClick={() => loadImportHistory(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="btn-icon"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    <span className="page-info">
                      Page {currentPage} sur {totalPages}
                    </span>
                    
                    <button 
                      onClick={() => loadImportHistory(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="btn-icon"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button 
                      onClick={() => loadImportHistory(totalPages)}
                      disabled={currentPage === totalPages}
                      className="btn-icon"
                    >
                      <ChevronLast size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderStats = () => {
    if (!importStats) return null;
    
    return (
      <div className="stats-section">
        <div className="stats-header">
          <h4><TrendingUp size={20} /> Statistiques d'importation</h4>
          <button 
            onClick={() => setShowStats(false)}
            className="btn-secondary"
          >
            <History size={16} /> Retour à l'historique
          </button>
        </div>
        
        <div className="stats-overview">
          <div className="stat-overview-card total">
            <div className="stat-overview-value">{importStats.totalImports || 0}</div>
            <div className="stat-overview-label">Imports totaux</div>
          </div>
          
          <div className="stat-overview-card success">
            <div className="stat-overview-value">{importStats.successfulImports || 0}</div>
            <div className="stat-overview-label">Réussis</div>
          </div>
          
          <div className="stat-overview-card error">
            <div className="stat-overview-value">{importStats.failedImports || 0}</div>
            <div className="stat-overview-label">Échoués</div>
          </div>
          
          <div className="stat-overview-card rate">
            <div className="stat-overview-value">{importStats.successRate || 0}%</div>
            <div className="stat-overview-label">Taux de réussite</div>
          </div>
        </div>
        
        <div className="stats-details">
          <div className="stat-detail-section">
            <h5>Activité récente</h5>
            <div className="activity-stats">
              <div className="activity-stat">
                <span className="activity-label">7 derniers jours:</span>
                <span className="activity-value">{importStats.last7Days?.imports || 0} imports</span>
              </div>
              <div className="activity-stat">
                <span className="activity-label">30 derniers jours:</span>
                <span className="activity-value">{importStats.last30Days?.imports || 0} imports</span>
              </div>
            </div>
          </div>
          
          {importStats.byTable && Object.keys(importStats.byTable).length > 0 && (
            <div className="stat-detail-section">
              <h5>Par table</h5>
              <div className="table-stats">
                {Object.entries(importStats.byTable)
                  .sort((a, b) => b[1].imports - a[1].imports)
                  .slice(0, 5)
                  .map(([table, stats]) => (
                    <div key={table} className="table-stat-item">
                      <div className="table-stat-header">
                        <span className="table-name">{table}</span>
                        <span className="table-count">{stats.imports} imports</span>
                      </div>
                      <div className="table-stat-details">
                        <span className="stat-success">{stats.successful || 0} réussis</span>
                        <span className="stat-error">{stats.failed || 0} échoués</span>
                        {stats.rowsImported > 0 && (
                          <span className="stat-rows">{stats.rowsImported.toLocaleString()} lignes</span>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
          
          {importStats.byUser && Object.keys(importStats.byUser).length > 0 && (
            <div className="stat-detail-section">
              <h5>Par utilisateur</h5>
              <div className="user-stats">
                {Object.entries(importStats.byUser)
                  .sort((a, b) => b[1].imports - a[1].imports)
                  .slice(0, 5)
                  .map(([user, stats]) => (
                    <div key={user} className="user-stat-item">
                      <div className="user-stat-header">
                        <span className="user-name">{user}</span>
                        <span className="user-count">{stats.imports} imports</span>
                      </div>
                      <div className="user-stat-details">
                        <span className="stat-success">{stats.successful || 0} réussis</span>
                        {stats.rowsImported > 0 && (
                          <span className="stat-rows">{stats.rowsImported.toLocaleString()} lignes</span>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProgressBar = () => {
    if (!isUploading && uploadStep !== 4) return null;
    
    const progressSteps = [
      { label: 'Lecture du fichier', value: 20 },
      { label: 'Validation des données', value: 40 },
      { label: 'Traitement par lots', value: 60 },
      { label: 'Insertion en base', value: 80 },
      { label: 'Finalisation', value: 100 }
    ];
    
    return (
      <div className="upload-progress-container">
        <div className="progress-header">
          <h4>
            {isUploading ? (
              <>Importation en cours...</>
            ) : (
              <>Importation terminée</>
            )}
          </h4>
          <span className="progress-percentage">{uploadProgress}%</span>
        </div>
        
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
        
        {isUploading && (
          <div className="progress-steps">
            {progressSteps.map((step, index) => (
              <div 
                key={index} 
                className={`progress-step ${uploadProgress >= step.value ? 'completed' : ''}`}
              >
                <div className="step-icon">
                  {uploadProgress >= step.value ? '✓' : index + 1}
                </div>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        )}
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
            <span className="header-badge">Beta</span>
          </h1>
          <p>
            Importez des données en masse dans la base de données à partir de fichiers Excel, CSV, TXT ou JSON.
            Cette fonctionnalité permet d'importer rapidement des milliers d'enregistrements avec validation automatique.
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) {
                loadImportHistory();
              }
            }}
            className="btn-secondary"
          >
            <History size={16} /> 
            {showHistory ? 'Retour à l\'importation' : 'Historique'}
          </button>
          
          {importStats && (
            <button 
              onClick={() => {
                setShowStats(!showStats);
                if (showStats) setShowHistory(true);
              }}
              className="btn-secondary"
            >
              <TrendingUp size={16} /> 
              Statistiques
            </button>
          )}
        </div>
      </div>
      
      {showHistory ? (
        renderHistory()
      ) : (
        <>
          {/* Étapes de progression */}
          <div className="upload-steps-indicator">
            <div className={`step-indicator ${uploadStep >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <span className="step-label">Sélection</span>
            </div>
            <div className={`step-indicator ${uploadStep >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <span className="step-label">Mapping</span>
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
            {uploadStep === 3 && renderStep3()}
            {uploadStep === 4 && renderStep4()}
          </div>
          
          {/* Informations de débogage (optionnel) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="debug-info">
              <details>
                <summary>Informations de débogage</summary>
                <pre>
                  Table: {selectedSchema}.{selectedTable}<br />
                  Fichier: {selectedFile?.name}<br />
                  Format: {fileType}<br />
                  Étape: {uploadStep}<br />
                  Mapping: {JSON.stringify(columnMapping, null, 2)}<br />
                  Prévisualisation: {previewData.length} lignes<br />
                  Schémas: {availableSchemas.length} disponibles<br />
                  Tables: {availableTables.length} disponibles
                </pre>
              </details>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UploadMasse;