import React from 'react';

const ConfigurationStep = ({
  selectedPatient,
  medecins,
  selectedMedecin,
  setSelectedMedecin,
  typesConsultation,
  selectedType,
  handleTypeChange,
  montant,
  gratuite,
  handleGratuiteChange,
  getStatutACE,
  handlePrevStep,
  handleNextStep
}) => {
  const getMedecinInfo = (medecinId) => {
    const medecin = medecins.find(m => m.COD_PRE === parseInt(medecinId));
    return medecin || { NOM_COMPLET: '', SPECIALITE: '' };
  };

  const getTypeInfo = (typeLibelle) => {
    const type = typesConsultation.find(t => t.libelle === typeLibelle);
    return type || { tarif: 0 };
  };

  return (
    <div className="step-container">
      <h2 className="step-title">2. PARAMÉTRAGE DE LA CONSULTATION</h2>
      <p className="step-description">
        Configurez les détails de la consultation (médecin, type, coût)
      </p>
      
      <div className="configuration-grid">
        {/* Formulaire de configuration */}
        <div className="form-section">
          {/* Sélection du médecin */}
          <div className="form-group">
            <label className="form-label">
              👨‍⚕️ Médecin consulté
            </label>
            <div className="select-with-icon">
              <select
                value={selectedMedecin}
                onChange={(e) => setSelectedMedecin(e.target.value)}
                className="form-select"
              >
                <option value="">-- Sélectionnez un médecin --</option>
                {medecins.map((medecin) => (
                  <option key={medecin.COD_PRE} value={medecin.COD_PRE}>
                    Dr. {medecin.NOM_COMPLET} - {medecin.SPECIALITE}
                  </option>
                ))}
              </select>
              <span className="select-icon">▼</span>
            </div>
            {selectedMedecin && (
              <div className="selected-info">
                <p className="selected-doctor">
                  🩺 Dr. {getMedecinInfo(selectedMedecin).NOM_COMPLET}
                </p>
                <p className="selected-specialty">
                  📚 {getMedecinInfo(selectedMedecin).SPECIALITE}
                </p>
              </div>
            )}
          </div>

          {/* Sélection du type de consultation */}
          <div className="form-group">
            <label className="form-label">
              🏥 Type de consultation
            </label>
            <div className="select-with-icon">
              <select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="form-select"
              >
                <option value="">-- Sélectionnez un type --</option>
                {typesConsultation.map((type) => (
                  <option key={type.id} value={type.libelle}>
                    {type.libelle} - {type.tarif.toLocaleString()} FCFA
                  </option>
                ))}
              </select>
              <span className="select-icon">▼</span>
            </div>
            {selectedType && (
              <div className="selected-info">
                <p className="selected-type">
                  📝 {selectedType}
                </p>
                <p className="selected-price">
                  💰 {getTypeInfo(selectedType).tarif.toLocaleString()} FCFA
                </p>
              </div>
            )}
          </div>

          {/* Option gratuite */}
          <div className="checkbox-section">
            <label className="checkbox-label large">
              <input
                type="checkbox"
                checked={gratuite}
                onChange={(e) => handleGratuiteChange(e.target.checked)}
                className="checkbox-input"
              />
              <div className="checkbox-content">
                <span className="checkbox-icon">🎁</span>
                <div>
                  <span className="checkbox-text">Consultation gratuite</span>
                  <span className="checkbox-description">
                    Le montant de la consultation sera fixé à 0 FCFA
                  </span>
                </div>
              </div>
            </label>
          </div>

          {/* Informations sur la gratuité */}
          {gratuite && (
            <div className="gratuity-notice">
              <div className="notice-icon">ℹ️</div>
              <div className="notice-content">
                <p className="notice-title">Consultation gratuite activée</p>
                <p className="notice-message">
                  Cette consultation sera enregistrée comme gratuite. Le patient ne paiera rien.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Résumé et actions */}
        <div className="summary-section">
          {/* Carte de résumé */}
          <div className="summary-card">
            <div className="summary-header">
              <h3 className="summary-title">📋 RÉSUMÉ</h3>
              <div className="summary-status">
                <span className={`status-dot ${selectedPatient && selectedMedecin && selectedType ? 'complete' : 'incomplete'}`}></span>
                <span className="status-text">
                  {selectedPatient && selectedMedecin && selectedType ? 'Complet' : 'Incomplet'}
                </span>
              </div>
            </div>
            
            {/* Informations du patient */}
            <div className="summary-section-group">
              <h4 className="summary-subtitle">👤 Patient</h4>
              {selectedPatient ? (
                <div className="patient-summary">
                  <p className="patient-name">{selectedPatient.NOM_BEN} {selectedPatient.PRE_BEN}</p>
                  <div className="patient-meta">
                    <span className="patient-meta-item">ID: {selectedPatient.IDENTIFIANT_NATIONAL}</span>
                    <span className="patient-meta-item">Âge: {selectedPatient.AGE} ans</span>
                    <span className="patient-meta-item">Statut: {getStatutACE()}</span>
                  </div>
                  {selectedPatient.EMPLOYEUR && (
                    <p className="patient-employeur">🏢 {selectedPatient.EMPLOYEUR}</p>
                  )}
                </div>
              ) : (
                <p className="summary-empty">❌ Aucun patient sélectionné</p>
              )}
            </div>

            {/* Informations de la consultation */}
            <div className="summary-section-group">
              <h4 className="summary-subtitle">🩺 Consultation</h4>
              {selectedMedecin ? (
                <div className="consultation-summary">
                  <p className="doctor-name">Dr. {getMedecinInfo(selectedMedecin).NOM_COMPLET}</p>
                  <p className="doctor-specialty">{getMedecinInfo(selectedMedecin).SPECIALITE}</p>
                </div>
              ) : (
                <p className="summary-empty">❌ Aucun médecin sélectionné</p>
              )}
            </div>

            {/* Informations financières */}
            <div className="summary-section-group">
              <h4 className="summary-subtitle">💰 Coût</h4>
              {selectedType ? (
                <div className="cost-summary">
                  <div className="cost-row">
                    <span className="cost-label">Type:</span>
                    <span className="cost-value">{selectedType}</span>
                  </div>
                  <div className="cost-row">
                    <span className="cost-label">Tarif:</span>
                    <span className={`cost-value ${gratuite ? 'free' : ''}`}>
                      {gratuite ? '0' : getTypeInfo(selectedType).tarif.toLocaleString()} FCFA
                    </span>
                  </div>
                  {gratuite && (
                    <div className="free-notice">
                      <span className="free-icon">🎁</span>
                      <span className="free-text">Gratuit</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="summary-empty">❌ Aucun type sélectionné</p>
              )}
            </div>

            {/* Validation */}
            <div className="summary-validation">
              {selectedPatient && selectedMedecin && selectedType ? (
                <div className="validation-success">
                  <span className="validation-icon">✅</span>
                  <span className="validation-text">Configuration valide</span>
                </div>
              ) : (
                <div className="validation-warning">
                  <span className="validation-icon">⚠️</span>
                  <span className="validation-text">Configuration incomplète</span>
                </div>
              )}
            </div>
          </div>

          {/* Boutons de navigation */}
          <div className="navigation-buttons">
            <button
              onClick={handlePrevStep}
              className="secondary-button"
            >
              ← Retour à la recherche
            </button>
            <button
              onClick={handleNextStep}
              disabled={!selectedPatient || !selectedMedecin || !selectedType}
              className="primary-button"
            >
              Continuer vers informations médicales →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationStep;