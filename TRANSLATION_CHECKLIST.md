# ✅ Checklist de Traduction - Pour Chaque Page

## À Compléter Avant le Commit

Utilisez cette checklist pour chaque page que vous traduisez.

---

## 📄 Nom de la Page: ___________________

### Phase 1: Préparation

- [ ] Page JSX identifiée: `src/pages/[Folder]/[Page].jsx`
- [ ] Composants enfants identifiés (si présents)
- [ ] Tous les textes visibles repérés

### Phase 2: Implémentation

#### Étape 1: Importer useTranslation
- [ ] Import ajouté: `import { useTranslation } from 'react-i18next';`
- [ ] Hook utilisé: `const { t } = useTranslation();`
- [ ] Pas d'erreur "t is not defined"

#### Étape 2: Remplacer les Textes
- [ ] Titres remplacés par `t('pageTitles.*')`
- [ ] Labels remplacés par `t('form.*')`
- [ ] Boutons remplacés par `t('actions.*')`
- [ ] Messages remplacés par `t('messages.*')`
- [ ] Colonnes remplacées par `t('columns.*')`
- [ ] Tous les textes visibles utilisent `t()`
- [ ] Aucun texte hardcodé restant (sauf données du serveur)

#### Étape 3: Ajouter les Clés i18n

Pour chaque clé utilisée, vérifier dans `src/services/i18n.js`:

- [ ] Clé existe en **FRANÇAIS** (fr-FR)
- [ ] Clé existe en **ANGLAIS** (en-GB)
- [ ] Clé existe en **ESPAGNOL** (es-ES)
- [ ] Toutes les 3 versions sont complètes
- [ ] Pas d'erreurs de syntaxe JSON
- [ ] Clés organisées logiquement par catégorie

### Phase 3: Tests

#### Test 1: Français (CMF, RCA, TCD, COG)
- [ ] Page ouverte en Français
- [ ] Tous les textes s'affichent en Français
- [ ] Formatage correct (nombres, dates, devises)
- [ ] Aucune erreur dans la console
- [ ] Aucune clé manquante affichée

#### Test 2: Anglais (CMA, BDI)
- [ ] Page ouverte en Anglais
- [ ] Tous les textes s'affichent en Anglais
- [ ] Formatage correct (nombres, dates, devises)
- [ ] Aucune erreur dans la console
- [ ] Aucune clé manquante affichée

#### Test 3: Espagnol (GNQ)
- [ ] Page ouverte en Espagnol
- [ ] Tous les textes s'affichent en Espagnol
- [ ] Formatage correct (nombres, dates, devises)
- [ ] Aucune erreur dans la console
- [ ] Aucune clé manquante affichée

#### Test 4: Audit
```bash
npm run audit-translations
```
- [ ] Audit réussi: ✅ AUDIT RÉUSSI - Toutes les traductions sont complètes
- [ ] Aucune clé manquante signalée
- [ ] Aucune clé orpheline dangereuse

### Phase 4: Code Review

- [ ] Code lisible et bien formaté
- [ ] Aucun console.log ou code de debug
- [ ] Pas de fichiers temporaires
- [ ] Commentaires présents si nécessaire
- [ ] Pas de dépendances non déclarées

### Phase 5: Documentation

- [ ] README mis à jour si nécessaire
- [ ] Fichier JSDoc ajouté si logique complexe
- [ ] Guide de traduction suivi (IMPLEMENTATION_GUIDE_EXAMPLE.md)

---

## 🔍 Vérification Finale

Avant de faire le commit:

```bash
# 1. Vérifier l'audit
npm run audit-translations
# ✅ AUDIT RÉUSSI

# 2. Vérifier le linting
npm run lint
# ✅ Aucune erreur

# 3. Tester manuellement
# - Français
# - Anglais
# - Espagnol

# 4. Vérifier les consoles
# - F12 ou Cmd+Option+I
# - Aucune erreur rouge
```

## 📋 Clés à Ajouter Obligatoirement

Catégories standard pour chaque page:

### Titres de Page
```javascript
'pageTitles.myPage': 'My Page Title'
```

### Descriptions (optionnel)
```javascript
'descriptions.myPage': 'Page description'
```

### Actions Communes
```javascript
'actions.save': 'Save'
'actions.cancel': 'Cancel'
'actions.delete': 'Delete'
'actions.edit': 'Edit'
'actions.add': 'Add'
'actions.search': 'Search'
'actions.filter': 'Filter'
'actions.export': 'Export'
'actions.import': 'Import'
'actions.print': 'Print'
'actions.refresh': 'Refresh'
'actions.close': 'Close'
```

### Formulaires
```javascript
'form.submit': 'Submit'
'form.reset': 'Reset'
'form.required': 'Required'
'form.invalidEmail': 'Invalid email'
'form.invalidPhone': 'Invalid phone'
```

### Messages
```javascript
'messages.success': 'Success'
'messages.error': 'Error'
'messages.loading': 'Loading...'
'messages.noData': 'No data'
'messages.unsaved': 'Unsaved changes'
'messages.confirm': 'Are you sure?'
```

### Colonnes de Tableau
```javascript
'columns.name': 'Name'
'columns.email': 'Email'
'columns.phone': 'Phone'
'columns.status': 'Status'
'columns.actions': 'Actions'
'columns.date': 'Date'
'columns.amount': 'Amount'
```

---

## ⚠️ Erreurs Courantes à Éviter

- ❌ `const t = null;` - Oublier `useTranslation()`
- ❌ `t('unknown.key')` - Clé non définie dans i18n.js
- ❌ Ajouter clé seulement en FR, pas EN et ES
- ❌ `{t('action')} + 's'` - Ne pas concaténer avec les traductions
- ❌ Texte dans les styles CSS - Utiliser du contenu dynamique si possible
- ❌ Oublier de tester toutes les 3 langues
- ❌ Ne pas exécuter `npm run audit-translations`

---

## ✨ Bonnes Pratiques

✅ **Réutiliser les clés existantes** - Avant de créer, vérifier si existe  
✅ **Organiser par catégorie** - pageTitles.*, form.*, actions.*  
✅ **Noms descriptifs** - 'pageTitles.patientList' au lieu de 'page1'  
✅ **Traductions complètes** - Les 3 langues obligatoirement  
✅ **Tester chaque langue** - FR, EN, ES  
✅ **Exécuter l'audit** - `npm run audit-translations` avant commit  
✅ **Vérifier la console** - Aucune erreur rouge  
✅ **Documenter si complexe** - Commentaires pour la logique

---

## 📚 Ressources

| Ressource | Lien |
|-----------|------|
| Guide Complet | [TRANSLATION_GUIDE.md](../TRANSLATION_GUIDE.md) |
| Exemple Détaillé | [IMPLEMENTATION_GUIDE_EXAMPLE.md](../IMPLEMENTATION_GUIDE_EXAMPLE.md) |
| Template | [TEMPLATE_TRANSLATED_PAGE.jsx](../TEMPLATE_TRANSLATED_PAGE.jsx) |
| Fichier i18n | `src/services/i18n.js` |
| Pages Traduites | `src/pages/Dashboard.jsx`, etc. |

---

## 🎯 Points de Contrôle Rapides

```
[ ] useTranslation() importé et utilisé
[ ] Tous les textes utilisent t()
[ ] Clés ajoutées dans i18n.js (FR, EN, ES)
[ ] npm run audit-translations = ✅
[ ] Testé en Français
[ ] Testé en Anglais
[ ] Testé en Espagnol
[ ] Aucune erreur console
[ ] Prêt à commit ✅
```

---

**Dernière mise à jour:** Février 2026  
**Version:** 1.0
