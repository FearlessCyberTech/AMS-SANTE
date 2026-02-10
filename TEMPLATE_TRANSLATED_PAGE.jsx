// Template: src/pages/[FOLDER]/[PageName].jsx
/**
 * Template de page avec traduction complète
 * 
 * Instructions:
 * 1. Copier ce fichier
 * 2. Remplacer [PageName] par le nom de votre page
 * 3. Ajouter les clés de traduction manquantes dans src/services/i18n.js
 * 4. Remplacer le contenu JSX
 * 5. Tester chaque langue (FR, EN, ES)
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// import { useAuth } from '../contexts/AuthContext';
// import TranslationHelper from '../services/TranslationHelper';
import './[PageName].css'; // Optionnel

const [PageName] = () => {
  // ============ TRADUCTION ============
  const { t, i18n } = useTranslation();
  // const { user } = useAuth();
  
  // ============ STATE ============
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // ============ EFFECTS ============
  useEffect(() => {
    // Charger les données ici
    // loadData();
  }, []);

  // ============ HANDLERS ============
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      // Sauvegarder les données
      // await saveData();
      console.log('Données sauvegardées avec succès');
    } catch (err) {
      setError(t('messages.error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ============ RENDER ============
  if (loading) {
    return (
      <div className="loading">
        <p>{t('messages.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => setError(null)}>
          {t('actions.close')}
        </button>
      </div>
    );
  }

  return (
    <div className="[page-name]-container">
      {/* Header */}
      <div className="page-header">
        <h1>{t('pageTitles.[pageName]')}</h1>
        <p>{t('descriptions.[pageName]')}</p>
      </div>

      {/* Content */}
      <div className="page-content">
        {/* Exemple de formulaire */}
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}>
          <div className="form-group">
            <label>{t('form.firstName')}</label>
            <input 
              type="text" 
              placeholder={t('form.firstName')}
            />
          </div>

          <div className="form-group">
            <label>{t('form.email')}</label>
            <input 
              type="email" 
              placeholder={t('form.email')}
            />
          </div>

          {/* Boutons */}
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {t('actions.save')}
            </button>
            <button type="reset" className="btn-secondary">
              {t('actions.reset')}
            </button>
          </div>
        </form>

        {/* Exemple de tableau */}
        {data && (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('columns.name')}</th>
                <th>{t('columns.email')}</th>
                <th>{t('columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>
                    <button>{t('actions.edit')}</button>
                    <button>{t('actions.delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default [PageName];

/**
 * CLÉS I18N REQUISES DANS src/services/i18n.js:
 * 
 * Pour FR-FR:
 * 'pageTitles.[pageName]': 'Titre de la Page',
 * 'descriptions.[pageName]': 'Description de la page',
 * 'form.firstName': 'Prénom',
 * 'form.email': 'Email',
 * 'actions.save': 'Enregistrer',
 * 'actions.reset': 'Réinitialiser',
 * 'actions.edit': 'Modifier',
 * 'actions.delete': 'Supprimer',
 * 'actions.close': 'Fermer',
 * 'columns.name': 'Nom',
 * 'columns.email': 'Email',
 * 'columns.actions': 'Actions',
 * 'messages.error': 'Une erreur est survenue',
 * 'messages.loading': 'Chargement...',
 * 
 * Et les équivalents EN-GB et ES-ES
 */
