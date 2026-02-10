# Guide d'Implémentation de Traduction - Exemple Pratique

## Scénario: Traduire la page "Patients.jsx"

### Étape 1: Vérifier les fichiers concernés

Avant de traduire une page, identifiez tous les fichiers JSX qui affichent du texte:
- `src/pages/Patients.jsx` - Composant principal
- `src/pages/Patients.css` - Styles (pas besoin de traduire)
- Composants enfants si présents

### Étape 2: Importer useTranslation

**AVANT:**
```jsx
import React, { useState, useEffect } from 'react';
import './Patients.css';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  // ...
```

**APRÈS:**
```jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Patients.css';

const Patients = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  // ...
```

### Étape 3: Identifier tous les textes

Parsez le JSX et identifiez chaque texte visible:

```jsx
// ❌ AVANT (Textes hardcodés)
<h1>Patient List</h1>
<th>Name</th>
<th>Email</th>
<button>Add Patient</button>
<p>No patients found</p>
<button>Save</button>
<button>Cancel</button>

// ✅ APRÈS (Textes traduits)
<h1>{t('pageTitles.patients')}</h1>
<th>{t('columns.name')}</th>
<th>{t('columns.email')}</th>
<button>{t('actions.add')}</button>
<p>{t('messages.noData')}</p>
<button>{t('actions.save')}</button>
<button>{t('actions.cancel')}</button>
```

### Étape 4: Créer les clés de traduction

Ouvrez `src/services/i18n.js` et ajoutez les clés manquantes:

#### Pour FRANÇAIS (fr-FR):
```javascript
'fr-FR': {
  translation: {
    // ... clés existantes ...
    
    // Pages
    'pageTitles.patients': 'Liste des Patients',
    
    // Colonnes
    'columns.name': 'Nom',
    'columns.email': 'Email',
    'columns.phone': 'Téléphone',
    'columns.birthDate': 'Date de naissance',
    'columns.status': 'Statut',
    'columns.actions': 'Actions',
    
    // Messages
    'messages.noData': 'Aucun patient trouvé',
    'messages.loadingPatients': 'Chargement des patients...',
    
    // Validations
    'validation.patientRequired': 'Patient requis',
    'validation.emailInvalid': 'Email invalide',
  }
}
```

#### Pour ANGLAIS (en-GB):
```javascript
'en-GB': {
  translation: {
    // ... clés existantes ...
    
    'pageTitles.patients': 'Patient List',
    
    'columns.name': 'Name',
    'columns.email': 'Email',
    'columns.phone': 'Phone',
    'columns.birthDate': 'Birth Date',
    'columns.status': 'Status',
    'columns.actions': 'Actions',
    
    'messages.noData': 'No patients found',
    'messages.loadingPatients': 'Loading patients...',
    
    'validation.patientRequired': 'Patient required',
    'validation.emailInvalid': 'Invalid email',
  }
}
```

#### Pour ESPAGNOL (es-ES):
```javascript
'es-ES': {
  translation: {
    // ... clés existantes ...
    
    'pageTitles.patients': 'Lista de Pacientes',
    
    'columns.name': 'Nombre',
    'columns.email': 'Correo Electrónico',
    'columns.phone': 'Teléfono',
    'columns.birthDate': 'Fecha de Nacimiento',
    'columns.status': 'Estado',
    'columns.actions': 'Acciones',
    
    'messages.noData': 'No hay pacientes',
    'messages.loadingPatients': 'Cargando pacientes...',
    
    'validation.patientRequired': 'Paciente requerido',
    'validation.emailInvalid': 'Correo inválido',
  }
}
```

### Étape 5: Remplacer les textes dans le JSX

```jsx
const Patients = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="patients-container">
      {/* Header */}
      <div className="page-header">
        <h1>{t('pageTitles.patients')}</h1>
      </div>

      {/* Tableau */}
      {loading ? (
        <p>{t('messages.loadingPatients')}</p>
      ) : patients.length === 0 ? (
        <p>{t('messages.noData')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('columns.name')}</th>
              <th>{t('columns.email')}</th>
              <th>{t('columns.phone')}</th>
              <th>{t('columns.birthDate')}</th>
              <th>{t('columns.status')}</th>
              <th>{t('columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(patient => (
              <tr key={patient.id}>
                <td>{patient.name}</td>
                <td>{patient.email}</td>
                <td>{patient.phone}</td>
                <td>{patient.birthDate}</td>
                <td>{patient.status}</td>
                <td>
                  <button>{t('actions.edit')}</button>
                  <button>{t('actions.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        <input 
          placeholder={t('form.name')}
          required
        />
        <input 
          placeholder={t('form.email')}
          type="email"
          required
        />
        <button type="submit">{t('actions.save')}</button>
        <button type="reset">{t('actions.cancel')}</button>
      </form>
    </div>
  );
};
```

### Étape 6: Tester les traductions

1. **Vérifier l'interface en Français:**
   - Naviguer vers la page Patients
   - Vérifier que tous les textes sont en français

2. **Vérifier l'interface en Anglais:**
   - Utiliser le sélecteur de langue ou accéder via un pays anglophone
   - Vérifier que tous les textes sont en anglais

3. **Vérifier l'interface en Espagnol:**
   - Accéder via un pays hispanophone (Guinée Équatoriale)
   - Vérifier que tous les textes sont en espagnol

### Étape 7: Audit des traductions

Exécuter le script d'audit pour vérifier qu'il n'y a pas de clés manquantes:

```bash
node src/scripts/audit-translations.js
```

Doit afficher:
```
✅ AUDIT RÉUSSI - Toutes les traductions sont complètes
```

## Checklist Complète

- [ ] `useTranslation()` importé dans le composant
- [ ] Tous les textes visibles utilisent `t('key')`
- [ ] Clés créées pour FR-FR
- [ ] Clés créées pour EN-GB
- [ ] Clés créées pour ES-ES
- [ ] Testé en Français
- [ ] Testé en Anglais
- [ ] Testé en Espagnol
- [ ] Pas d'erreurs dans la console
- [ ] Script audit ne signale pas d'erreurs

## Erreurs Communes et Solutions

### ❌ Erreur 1: useTranslation pas importé
```javascript
// ❌ FAUX
const MyComponent = () => {
  return <h1>{t('key')}</h1>; // t is not defined
};

// ✅ CORRECT
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('key')}</h1>;
};
```

### ❌ Erreur 2: Clé manquante en i18n.js
```javascript
// ❌ FAUX
{t('pageTitles.myPage')} // Clé non définie dans i18n.js

// ✅ CORRECT
// Ajouter la clé dans i18n.js pour les 3 langues d'abord
```

### ❌ Erreur 3: Traduction incomplète (une ou deux langues seulement)
```javascript
// ❌ FAUX
'fr-FR': {
  translation: {
    'key': 'Valeur FR'
  }
},
// EN-GB manquant!
// ES-ES manquant!

// ✅ CORRECT
'fr-FR': { translation: { 'key': 'Valeur FR' } },
'en-GB': { translation: { 'key': 'Value EN' } },
'es-ES': { translation: { 'key': 'Valor ES' } },
```

### ❌ Erreur 4: Utiliser des variables dans les traductions
```javascript
// ❌ FAUX
const name = "John";
return <p>{t('greeting')} {name}</p>; // "Hello John" si séparé

// ✅ CORRECT (Option 1 - Interpolation)
return <p>{t('greeting.withName', { name })}</p>;
// i18n.js: 'greeting.withName': 'Bonjour {{name}}'

// ✅ CORRECT (Option 2 - Concaténation simple)
return <p>{t('greeting')}, {name}</p>;
```

## Ressources Utiles

- [React-i18next Documentation](https://react.i18next.com/)
- `src/services/i18n.js` - Voir les exemples existants
- `src/services/TranslationHelper.js` - Utilitaires de traduction
- `src/hooks/usePageTranslation.js` - Hook personnalisé complet
- Fichier: `TRANSLATION_GUIDE.md`

## Support et Questions

Pour toute question, consultez:
1. Les pages existantes traduites (Dashboard.jsx, ConsultationDetail.jsx)
2. Le fichier i18n.js pour les clés existantes
3. Ce guide d'implémentation
