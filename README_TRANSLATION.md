
# 🌐 Système de Traduction Multi-Langue - SaniCareCentre

## ⚡ Démarrage Rapide

### Installation et Test

```bash
# Vérifier que le système fonctionne
npm run audit-translations

# Devrait afficher:
# ✅ AUDIT RÉUSSI - Toutes les traductions sont complètes
```

### Utiliser dans une Page

```jsx
import { useTranslation } from 'react-i18next';

const MaPage = () => {
  const { t } = useTranslation();
  
  return <h1>{t('pageTitles.dashboard')}</h1>;
};
```

### Ajouter des Traductions

1. **Importer et utiliser:**
```jsx
const { t } = useTranslation();
return <p>{t('ma.clé')}</p>;
```

2. **Ajouter dans `src/services/i18n.js`:**
```javascript
'fr-FR': { translation: { 'ma.clé': 'Ma traduction' } },
'en-GB': { translation: { 'ma.clé': 'My translation' } },
'es-ES': { translation: { 'ma.clé': 'Mi traducción' } },
```

3. **Valider:**
```bash
npm run audit-translations
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **TRANSLATION_GUIDE.md** | Guide complet du système |
| **IMPLEMENTATION_GUIDE_EXAMPLE.md** | Exemple pas-à-pas (détaillé) |
| **TEMPLATE_TRANSLATED_PAGE.jsx** | Template à copier |
| **TRANSLATION_SETUP.md** | Guide de configuration |

## 🎯 Fonctionnalités

✅ **Traduction Automatique par Pays**
- Français (FR): CMF, RCA, TCD, COG
- Anglais (EN): CMA, BDI
- Espagnol (ES): GNQ

✅ **Outils de Développement**
- `useTranslation()` de React-i18next
- `usePageTranslation()` hook personnalisé
- `TranslationHelper` service utilitaire
- Script d'audit: `npm run audit-translations`

✅ **Ressources Complètes**
- 900+ clés de traduction
- 3 langues complètes
- Formatage de nombres, devises, dates
- Gestion des paramètres

## 🚀 Prochaines Étapes

1. **Valider l'installation:**
   ```bash
   npm run audit-translations
   ```

2. **Lire le guide complet:**
   Ouvrir: `TRANSLATION_GUIDE.md`

3. **Traduire une page existante:**
   Suivre: `IMPLEMENTATION_GUIDE_EXAMPLE.md`

4. **Créer une nouvelle page:**
   Utiliser: `TEMPLATE_TRANSLATED_PAGE.jsx`

## 🔗 Liens Utiles

- **React-i18next:** https://react.i18next.com/
- **i18next:** https://www.i18next.com/
- **Guide Complet:** TRANSLATION_GUIDE.md
- **Exemple Détaillé:** IMPLEMENTATION_GUIDE_EXAMPLE.md

## 📝 Checklist pour Traduire une Page

- [ ] Importer `useTranslation()`
- [ ] Remplacer tous les textes par `t('key')`
- [ ] Ajouter les clés dans i18n.js (FR, EN, ES)
- [ ] Tester en Français
- [ ] Tester en Anglais
- [ ] Tester en Espagnol
- [ ] Exécuter: `npm run audit-translations`
- [ ] Passer au commit ✅

## 💡 Quick Reference

```jsx
// Importer
import { useTranslation } from 'react-i18next';

// Utiliser
const { t } = useTranslation();

// Traductions simples
<h1>{t('pageTitles.dashboard')}</h1>

// Traductions avec paramètres
<p>{t('validation.minLength', { count: 8 })}</p>

// Utiliser le hook personnalisé
const { t, formatCurrency, getRoleName } = usePageTranslation();
```

## ⚠️ Important

**La langue est automatiquement appliquée selon le pays choisi au login.**

Pas besoin de sélectionner manuellement la langue - cela se fait automatiquement!

---

**Statut:** ✅ Système prêt à l'emploi  
**Version:** 1.0  
**Mise à jour:** Février 2026
