# Guide Complet de Traduction Multi-Langue

## Vue d'ensemble

Le système de traduction utilise **react-i18next** pour gérer 3 langues :
- 🇫🇷 **Français (fr-FR)** - Pays: CMF, RCA, TCD, COG
- 🇬🇧 **Anglais (en-GB)** - Pays: CMA, BDI
- 🇪🇸 **Espagnol (es-ES)** - Pays: GNQ

### Mapping Pays → Langue

```javascript
const countryLanguageMap = {
  'CMF': 'fr-FR', // Cameroun Francophone
  'CMA': 'en-GB', // Cameroun Anglophone
  'RCA': 'fr-FR', // République Centrafricaine
  'TCD': 'fr-FR', // Tchad
  'GNQ': 'es-ES', // Guinée Équatoriale
  'BDI': 'en-GB', // Burundi
  'COG': 'fr-FR'  // République du Congo
};
```

## Configuration Actuelle

1. **Fichier i18n**: `src/services/i18n.js`
   - Contient toutes les ressources de traduction
   - Initialise react-i18next
   - Gère le changement de langue

2. **Fichier AuthContext**: `src/contexts/AuthContext.jsx`
   - Stocke la langue de l'utilisateur
   - Détecte le pays au login
   - Change automatiquement la langue selon le pays

3. **Composant Layout**: `src/components/Layout.jsx`
   - Applique la langue au démarrage selon le pays de l'utilisateur

## Comment Utiliser la Traduction

### Étape 1: Importer useTranslation dans votre composant

```jsx
import { useTranslation } from 'react-i18next';

const MaPage = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('pageTitles.dashboard')}</h1>
      <p>{t('menu.beneficiaries')}</p>
    </div>
  );
};
```

### Étape 2: Créer les clés de traduction dans i18n.js

Ajouter les clés dans `src/services/i18n.js` pour les trois langues:

```javascript
const resources = {
  'fr-FR': {
    translation: {
      'pageTitles.myNewPage': 'Ma Nouvelle Page',
      'labels.firstName': 'Prénom',
      // ...
    }
  },
  'en-GB': {
    translation: {
      'pageTitles.myNewPage': 'My New Page',
      'labels.firstName': 'First Name',
      // ...
    }
  },
  'es-ES': {
    translation: {
      'pageTitles.myNewPage': 'Mi Nueva Página',
      'labels.firstName': 'Nombre',
      // ...
    }
  }
};
```

### Étape 3: Utiliser les traductions dans le JSX

```jsx
const MyForm = () => {
  const { t } = useTranslation();
  
  return (
    <form>
      <label>{t('labels.firstName')}</label>
      <input type="text" placeholder={t('labels.firstName')} />
      
      <button>{t('actions.save')}</button>
      <button>{t('actions.cancel')}</button>
    </form>
  );
};
```

## Format des Clés de Traduction

Utilisez une hiérarchie logique avec des points:

```
'section.subsection.key'

Exemples:
- 'pageTitles.dashboard'
- 'menu.beneficiaries'
- 'labels.firstName'
- 'actions.save'
- 'messages.success'
- 'validation.required'
- 'errors.invalidEmail'
```

## Clés Existantes par Catégorie

### Application
- `app.name`
- `app.centralAfrica`
- `app.description`
- `app.regionalSystem`

### Pays
- `countries.CMF`, `countries.CMA`, etc.

### Rôles
- `roles.administrator`
- `roles.doctor`
- `roles.nurse`
- etc.

### Titres de Pages
- `pageTitles.dashboard`
- `pageTitles.beneficiaryDetail`
- `pageTitles.consultations`
- etc.

### Menu
- `menu.dashboard`
- `menu.beneficiaries`
- `menu.consultations`
- etc.

### Actions Communes
- `actions.save`
- `actions.cancel`
- `actions.delete`
- `actions.edit`
- `actions.create`
- `actions.logout`
- etc.

### Formulaires
- `form.firstName`
- `form.lastName`
- `form.email`
- `form.phone`
- `form.submit`
- `form.required`
- etc.

### Messages
- `messages.success`
- `messages.error`
- `alerts.sessionExpired`
- `alerts.accessDenied`
- etc.

## Traductions Avec Paramètres

Pour les traductions qui incluent des valeurs dynamiques:

```javascript
// Dans i18n.js
'validation.minLength': 'Minimum {{count}} caractères'

// Dans le composant
{t('validation.minLength', { count: 8 })}
```

## Vérification des Traductions Manquantes

Le fichier i18n.js inclut un gestionnaire pour les traductions manquantes:

```javascript
missingKeyHandler: (lng, ns, key, fallbackValue) => {
  console.warn(`Traduction manquante: ${key} pour la langue ${lng}`);
}
```

Vérifiez la console pour les clés manquantes lors du développement.

## Changement Manuel de Langue (Optionnel)

Si vous avez besoin de changer la langue manuellement:

```jsx
import { useAuth } from '../contexts/AuthContext';

const LanguageSwitcher = () => {
  const { changeApplicationLanguage } = useAuth();
  
  return (
    <>
      <button onClick={() => changeApplicationLanguage('fr-FR')}>FR</button>
      <button onClick={() => changeApplicationLanguage('en-GB')}>EN</button>
      <button onClick={() => changeApplicationLanguage('es-ES')}>ES</button>
    </>
  );
};
```

## Listes de Vérification pour les Pages

Avant de commiter une nouvelle page, vérifiez:

- [ ] `useTranslation()` est importé et utilisé
- [ ] Tous les textes visibles utilisent des clés i18n
- [ ] Les clés sont définies dans les 3 langues
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] Les traductions s'affichent correctement pour chaque langue

## Bonnes Pratiques

1. **Réutilisez les clés existantes** - Avant de créer une nouvelle clé, vérifiez si elle existe déjà
2. **Groupez les clés** - Utilisez une hiérarchie logique
3. **Noms descriptifs** - Les clés doivent être claires et compréhensibles
4. **Traductions complètes** - Toujours fournir les 3 versions (FR, EN, ES)
5. **Tests** - Testez chaque langue pour vérifier l'affichage correct

## Fichiers à Modifier

Pour ajouter/modifier des traductions:
- `src/services/i18n.js` - Ajouter les clés de traduction

Pour ajouter la traduction à une page:
- `src/pages/[folder]/[Page].jsx` - Importer et utiliser `useTranslation()`

## Support

Pour toute question, consultez:
- React-i18next: https://react.i18next.com/
- Fichier i18n.js pour les exemples existants
- AuthContext.jsx pour la logique de changement de langue

