#!/usr/bin/env node

/**
 * Script d'Audit des Traductions
 * 
 * Usage: node src/scripts/audit-translations.js
 * 
 * Ce script analyse tous les fichiers JSX et identifie:
 * - Les clés de traduction utilisées (t('key'))
 * - Les clés qui manquent dans i18n.js
 * - Les clés orphelines (non utilisées)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Chemins
const srcDir = path.join(__dirname, '../');
const i18nFile = path.join(srcDir, 'services/i18n.js');

let i18nContent = '';
let usedKeys = new Set();
let definedKeys = {
  'fr-FR': new Set(),
  'en-GB': new Set(),
  'es-ES': new Set()
};

// ============ FONCTIONS ============

/**
 * Lire récursivement les fichiers dans un répertoire
 */
function getAllFilesSync(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        getAllFilesSync(filePath, fileList);
      }
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Extraire les clés t() d'un fichier JSX
 */
function extractTranslationKeys(content) {
  // Regex pour capturer t('key'), t("key"), t(`key`), t('key.subkey'), etc.
  const regex = /t\(['"`]([a-zA-Z0-9._]+)['"`]\)/g;
  const keys = new Set();
  let match;

  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1]);
  }

  return keys;
}

/**
 * Parser le fichier i18n.js pour extraire les clés définies
 */
function parseI18nFile() {
  // Attempt to extract the `resources` object from i18n.js and evaluate it in a safe VM
  const marker = 'const resources =';
  const startIdx = i18nContent.indexOf(marker);
  if (startIdx === -1) {
    console.warn('Impossible de trouver "const resources" dans i18n.js; tentative fallback par regex.');
    return fallbackParse();
  }

  const braceStart = i18nContent.indexOf('{', startIdx + marker.length);
  if (braceStart === -1) return fallbackParse();

  // Find matching closing brace for the resources object
  let depth = 0;
  let endIdx = -1;
  for (let i = braceStart; i < i18nContent.length; i++) {
    const ch = i18nContent[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  if (endIdx === -1) return fallbackParse();

  const objectText = i18nContent.slice(braceStart, endIdx + 1);

  try {
    // Evaluate the object text in a VM and retrieve the resources object
    const script = `(function(){ return ${objectText}; })()`;
    const resourcesObj = vm.runInNewContext(script, {}, { timeout: 1000 });

    const getAllKeys = (obj, prefix = '') => {
      const out = [];
      Object.keys(obj || {}).forEach(k => {
        const v = obj[k];
        const key = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'string') {
          out.push(key);
        } else if (v && typeof v === 'object') {
          out.push(...getAllKeys(v, key));
        }
      });
      return out;
    };

    if (resourcesObj['fr-FR'] && resourcesObj['fr-FR'].translation) {
      getAllKeys(resourcesObj['fr-FR'].translation).forEach(k => definedKeys['fr-FR'].add(k));
    }
    if (resourcesObj['en-GB'] && resourcesObj['en-GB'].translation) {
      getAllKeys(resourcesObj['en-GB'].translation).forEach(k => definedKeys['en-GB'].add(k));
    }
    if (resourcesObj['es-ES'] && resourcesObj['es-ES'].translation) {
      getAllKeys(resourcesObj['es-ES'].translation).forEach(k => definedKeys['es-ES'].add(k));
    }
  } catch (e) {
    console.error('Erreur lors de l\'évaluation de resources dans i18n.js:', e.message);
    return fallbackParse();
  }

  // fallbackParse: previous regex-based method kept for compatibility
  function fallbackParse() {
    const frMatch = i18nContent.match(/'fr-FR':\s*\{[\s\S]*?translation:\s*\{([\s\S]*?)\}\s*\}/);
    const enMatch = i18nContent.match(/'en-GB':\s*\{[\s\S]*?translation:\s*\{([\s\S]*?)\}\s*\}/);
    const esMatch = i18nContent.match(/'es-ES':\s*\{[\s\S]*?translation:\s*\{([\s\S]*?)\}\s*\}/);

    const parseLanguageBlock = (block) => {
      if (!block) return new Set();
      const regex = /'([a-zA-Z0-9._]+)':/g;
      const keys = new Set();
      let match;

      while ((match = regex.exec(block)) !== null) {
        keys.add(match[1]);
      }

      return keys;
    };

    definedKeys['fr-FR'] = parseLanguageBlock(frMatch ? frMatch[1] : null);
    definedKeys['en-GB'] = parseLanguageBlock(enMatch ? enMatch[1] : null);
    definedKeys['es-ES'] = parseLanguageBlock(esMatch ? esMatch[1] : null);
  }
}

/**
 * Analyser tous les fichiers JSX
 */
function analyzeJSXFiles() {
  const files = getAllFilesSync(srcDir);
  const jsxFiles = files.filter(f => f.endsWith('.jsx'));

  console.log(`\n${colors.cyan}Analyse de ${jsxFiles.length} fichiers JSX...${colors.reset}\n`);

  jsxFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const keys = extractTranslationKeys(content);
    
    keys.forEach(key => {
      usedKeys.add(key);
    });
  });
}

/**
 * Générer le rapport d'audit
 */
function generateReport() {
  const missingInFR = new Set();
  const missingInEN = new Set();
  const missingInES = new Set();
  const orphaned = new Set();

  // Clés utilisées mais non définies
  usedKeys.forEach(key => {
    if (!definedKeys['fr-FR'].has(key)) missingInFR.add(key);
    if (!definedKeys['en-GB'].has(key)) missingInEN.add(key);
    if (!definedKeys['es-ES'].has(key)) missingInES.add(key);
  });

  // Clés orphelines
  definedKeys['fr-FR'].forEach(key => {
    if (!usedKeys.has(key)) orphaned.add(key);
  });

  // ============ AFFICHER RAPPORT ============
  console.log(`${colors.blue}=== RAPPORT D'AUDIT DES TRADUCTIONS ===${colors.reset}\n`);

  // Résumé
  console.log(`${colors.cyan}RÉSUMÉ:${colors.reset}`);
  console.log(`  Clés utilisées: ${usedKeys.size}`);
  console.log(`  Clés FR définies: ${definedKeys['fr-FR'].size}`);
  console.log(`  Clés EN définies: ${definedKeys['en-GB'].size}`);
  console.log(`  Clés ES définies: ${definedKeys['es-ES'].size}`);
  console.log(`  Clés orphelines: ${orphaned.size}\n`);

  // Clés manquantes
  if (missingInFR.size > 0) {
    console.log(`${colors.red}⚠️  MANQUANTES EN FRANÇAIS (${missingInFR.size}):${colors.reset}`);
    Array.from(missingInFR).sort().forEach(key => {
      console.log(`  - ${key}`);
    });
    console.log();
  }

  if (missingInEN.size > 0) {
    console.log(`${colors.red}⚠️  MANQUANTES EN ANGLAIS (${missingInEN.size}):${colors.reset}`);
    Array.from(missingInEN).sort().forEach(key => {
      console.log(`  - ${key}`);
    });
    console.log();
  }

  if (missingInES.size > 0) {
    console.log(`${colors.red}⚠️  MANQUANTES EN ESPAGNOL (${missingInES.size}):${colors.reset}`);
    Array.from(missingInES).sort().forEach(key => {
      console.log(`  - ${key}`);
    });
    console.log();
  }

  // Clés orphelines
  if (orphaned.size > 0) {
    console.log(`${colors.yellow}⚠️  CLÉS ORPHELINES NON UTILISÉES (${orphaned.size}):${colors.reset}`);
    Array.from(orphaned).sort().forEach(key => {
      console.log(`  - ${key}`);
    });
    console.log();
  }

  // Statut final
  const hasIssues = missingInFR.size > 0 || missingInEN.size > 0 || missingInES.size > 0;

  // Écrire des rapports JSON pour intégration
  try {
    const outDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const missingReport = {
      missingInFR: Array.from(missingInFR).sort(),
      missingInEN: Array.from(missingInEN).sort(),
      missingInES: Array.from(missingInES).sort()
    };

    const orphanReport = {
      orphaned: Array.from(orphaned).sort()
    };

    fs.writeFileSync(path.join(outDir, 'missing-translations.json'), JSON.stringify(missingReport, null, 2), 'utf8');
    fs.writeFileSync(path.join(outDir, 'orphaned-keys.json'), JSON.stringify(orphanReport, null, 2), 'utf8');
    console.log(`${colors.cyan}➡️ Reports written to ${outDir}${colors.reset}`);
  } catch (writeErr) {
    console.warn('Impossible d\'écrire les rapports JSON:', writeErr.message);
  }
  if (hasIssues) {
    console.log(`${colors.red}❌ DES TRADUCTIONS MANQUENT${colors.reset}\n`);
    process.exit(1);
  } else if (orphaned.size > 0) {
    console.log(`${colors.yellow}⚠️  Audit complet mais des clés orphelines existent${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.green}✅ AUDIT RÉUSSI - Toutes les traductions sont complètes${colors.reset}\n`);
    process.exit(0);
  }
}

// ============ EXÉCUTION ============
try {
  if (!fs.existsSync(i18nFile)) {
    console.error(`${colors.red}Erreur: Fichier i18n.js non trouvé${colors.reset}`);
    process.exit(1);
  }

  i18nContent = fs.readFileSync(i18nFile, 'utf8');
  
  parseI18nFile();
  analyzeJSXFiles();
  generateReport();
} catch (error) {
  console.error(`${colors.red}Erreur lors de l'audit:${colors.reset}`, error.message);
  process.exit(1);
}
