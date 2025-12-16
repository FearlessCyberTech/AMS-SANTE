import React, { useState, useCallback, memo } from 'react';

// Composant optimisé pour les champs de saisie
const InputField = memo(({ label, value, onChange, placeholder, type = 'text', unit, ...props }) => {
  const [localValue, setLocalValue] = useState(value || '');

  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  }, [onChange]);

  return (
    <div className="form-group">
      <label className="form-label">
        {label} {unit && <span className="unit">({unit})</span>}
      </label>
      <div className="input-with-unit">
        <input
          type={type}
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="form-input"
          {...props}
        />
        {unit && <span className="unit-badge">{unit}</span>}
      </div>
    </div>
  );
});

const MedicalInfoStep = ({
  signesVitaux,
  setSignesVitaux,
  dateRendezVous,
  setDateRendezVous,
  observations,
  setObservations,
  examens,
  setExamens,
  traitements,
  setTraitements,
  recommandations,
  setRecommandations,
  selectedPatient,
  assurePrincipal,
  setAssurePrincipal,
  handlePrevStep,
  handleNextStep
}) => {
  const handleSigneVitauxChange = useCallback((field, value) => {
    setSignesVitaux(prev => ({
      ...prev,
      [field]: value
    }));
  }, [setSignesVitaux]);

  const hasSignesVitaux = Object.values(signesVitaux).some(value => value && value.trim() !== '');

  return (
    <div className="step-container">
      <h2 className="step-title">3. INFORMATIONS MÉDICALES ET SIGNES VITAUX</h2>
      <p className="step-description">
        Renseignez les informations médicales qui figureront sur la feuille de prise en charge
      </p>

      <div className="medical-info-wrapper">
        {/* Section Signes Vitaux */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-icon">🩺</div>
            <h3 className="section-title">SIGNES VITAUX</h3>
          </div>
          <div className="section-content">
            <div className="vitals-grid">
              <div className="vital-row">
                <InputField
                  label="Tension Artérielle"
                  value={signesVitaux.tensionArterielle}
                  onChange={(value) => handleSigneVitauxChange('tensionArterielle', value)}
                  placeholder="Ex: 120/80"
                  type="text"
                  unit="mmHg"
                />
                <InputField
                  label="Poids"
                  value={signesVitaux.poids}
                  onChange={(value) => handleSigneVitauxChange('poids', value)}
                  placeholder="Ex: 70"
                  type="number"
                  step="0.1"
                  unit="kg"
                />
                <InputField
                  label="Taille"
                  value={signesVitaux.taille}
                  onChange={(value) => handleSigneVitauxChange('taille', value)}
                  placeholder="Ex: 175"
                  type="number"
                  step="0.1"
                  unit="cm"
                />
              </div>
              
              <div className="vital-row">
                <InputField
                  label="Température"
                  value={signesVitaux.temperature}
                  onChange={(value) => handleSigneVitauxChange('temperature', value)}
                  placeholder="Ex: 37.0"
                  type="number"
                  step="0.1"
                  unit="°C"
                />
                <InputField
                  label="Pouls"
                  value={signesVitaux.pouls}
                  onChange={(value) => handleSigneVitauxChange('pouls', value)}
                  placeholder="Ex: 75"
                  type="number"
                  unit="bpm"
                />
                <InputField
                  label="Fréquence Respiratoire"
                  value={signesVitaux.frequenceRespiratoire}
                  onChange={(value) => handleSigneVitauxChange('frequenceRespiratoire', value)}
                  placeholder="Ex: 16"
                  type="number"
                  unit="/min"
                />
              </div>
              
              <div className="vital-row">
                <InputField
                  label="Glycémie"
                  value={signesVitaux.glycemie}
                  onChange={(value) => handleSigneVitauxChange('glycemie', value)}
                  placeholder="Ex: 100"
                  type="number"
                  step="0.1"
                  unit="mg/dL"
                  className="full-width"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Rendez-vous */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-icon">📅</div>
            <h3 className="section-title">PROCHAIN RENDEZ-VOUS</h3>
          </div>
          <div className="section-content">
            <div className="form-group">
              <label className="form-label">Date du prochain rendez-vous (optionnel)</label>
              <div className="date-input-container">
                <input
                  type="date"
                  value={dateRendezVous}
                  onChange={(e) => setDateRendezVous(e.target.value)}
                  className="form-input date-input"
                  min={new Date().toISOString().split('T')[0]}
                />
                {dateRendezVous && (
                  <span className="date-preview">
                    📅 {new Date(dateRendezVous).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Assuré Principal (pour conjoint/enfant) */}
        {selectedPatient && (selectedPatient.COD_PAI === 2 || selectedPatient.COD_PAI === 3) && (
          <div className="section-card">
            <div className="section-header">
              <div className="section-icon">👨‍👩‍👧‍👦</div>
              <h3 className="section-title">ASSURÉ PRINCIPAL</h3>
            </div>
            <div className="section-content">
              <div className="form-group">
                <label className="form-label">
                  {selectedPatient.COD_PAI === 2 ? 'Nom du conjoint principal' : 'Nom du parent assuré principal'}
                </label>
                <input
                  type="text"
                  value={assurePrincipal}
                  onChange={(e) => setAssurePrincipal(e.target.value)}
                  placeholder="Saisir le nom complet de l'assuré principal"
                  className="form-input"
                />
                <div className="form-hint">
                  Cette information sera affichée sur la feuille de prise en charge
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Informations Médicales */}
        <div className="medical-notes-section">
          <div className="notes-grid">
            {/* Observations médicales */}
            <div className="note-card">
              <div className="note-header">
                <div className="note-icon">📝</div>
                <h4 className="note-title">Observations médicales</h4>
              </div>
              <div className="note-content">
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Saisir les observations médicales (symptômes, constatations, etc.)"
                  className="medical-textarea"
                  rows={5}
                />
                <div className="character-count">
                  {observations.length} caractères
                </div>
              </div>
            </div>

            {/* Examens complémentaires */}
            <div className="note-card">
              <div className="note-header">
                <div className="note-icon">🔬</div>
                <h4 className="note-title">Examens complémentaires</h4>
              </div>
              <div className="note-content">
                <textarea
                  value={examens}
                  onChange={(e) => setExamens(e.target.value)}
                  placeholder="Liste des examens complémentaires à réaliser (analyses, radiologies, etc.)"
                  className="medical-textarea"
                  rows={5}
                />
                <div className="character-count">
                  {examens.length} caractères
                </div>
              </div>
            </div>

            {/* Traitements prescrits */}
            <div className="note-card">
              <div className="note-header">
                <div className="note-icon">💊</div>
                <h4 className="note-title">Traitements prescrits</h4>
              </div>
              <div className="note-content">
                <textarea
                  value={traitements}
                  onChange={(e) => setTraitements(e.target.value)}
                  placeholder="Médicaments et posologie prescrits (nom, dosage, fréquence, durée)"
                  className="medical-textarea"
                  rows={5}
                />
                <div className="character-count">
                  {traitements.length} caractères
                </div>
              </div>
            </div>

            {/* Recommandations */}
            <div className="note-card">
              <div className="note-header">
                <div className="note-icon">💡</div>
                <h4 className="note-title">Recommandations et conseils</h4>
              </div>
              <div className="note-content">
                <textarea
                  value={recommandations}
                  onChange={(e) => setRecommandations(e.target.value)}
                  placeholder="Recommandations pour le patient (conseils d'hygiène, précautions, etc.)"
                  className="medical-textarea"
                  rows={5}
                />
                <div className="character-count">
                  {recommandations.length} caractères
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Aperçu des données saisies */}
        {hasSignesVitaux && (
          <div className="preview-section">
            <div className="preview-header">
              <div className="preview-icon">👁️</div>
              <h4 className="preview-title">Aperçu des signes vitaux</h4>
            </div>
            <div className="preview-grid">
              {signesVitaux.tensionArterielle && (
                <div className="preview-item">
                  <span className="preview-label">Tension:</span>
                  <span className="preview-value">{signesVitaux.tensionArterielle} mmHg</span>
                </div>
              )}
              {signesVitaux.poids && (
                <div className="preview-item">
                  <span className="preview-label">Poids:</span>
                  <span className="preview-value">{signesVitaux.poids} kg</span>
                </div>
              )}
              {signesVitaux.taille && (
                <div className="preview-item">
                  <span className="preview-label">Taille:</span>
                  <span className="preview-value">{signesVitaux.taille} cm</span>
                </div>
              )}
              {signesVitaux.temperature && (
                <div className="preview-item">
                  <span className="preview-label">Température:</span>
                  <span className="preview-value">{signesVitaux.temperature} °C</span>
                </div>
              )}
              {signesVitaux.pouls && (
                <div className="preview-item">
                  <span className="preview-label">Pouls:</span>
                  <span className="preview-value">{signesVitaux.pouls} bpm</span>
                </div>
              )}
              {signesVitaux.frequenceRespiratoire && (
                <div className="preview-item">
                  <span className="preview-label">Fréq. respiratoire:</span>
                  <span className="preview-value">{signesVitaux.frequenceRespiratoire} /min</span>
                </div>
              )}
              {signesVitaux.glycemie && (
                <div className="preview-item">
                  <span className="preview-label">Glycémie:</span>
                  <span className="preview-value">{signesVitaux.glycemie} mg/dL</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Boutons de navigation */}
        <div className="navigation-buttons">
          <button
            onClick={handlePrevStep}
            className="secondary-button"
          >
            ← Retour au paramétrage
          </button>
          <button
            onClick={handleNextStep}
            className="primary-button"
          >
            Continuer vers validation →
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicalInfoStep;