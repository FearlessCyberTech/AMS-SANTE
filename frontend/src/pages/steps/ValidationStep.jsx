import React, { useState, useEffect } from 'react';

const ValidationStep = ({
  selectedPatient,
  selectedMedecin,
  medecins,
  selectedType,
  montantTotal,
  gratuite,
  tiersPayant,
  setTiersPayant,
  pourcentageCouverture,
  setPourcentageCouverture,
  montantPrisEnCharge,
  resteCharge,
  signesVitaux,
  dateRendezVous,
  getStatutACE,
  loading,
  handlePrevStep,
  handleValidate
}) => {
  const [coveragePercentage, setCoveragePercentage] = useState(pourcentageCouverture);
  
  const getMedecinInfo = (medecinId) => {
    const medecin = medecins.find(m => m.COD_PRE === parseInt(medecinId));
    return medecin || { NOM_COMPLET: '', SPECIALITE: '' };
  };

  useEffect(() => {
    setCoveragePercentage(pourcentageCouverture);
  }, [pourcentageCouverture]);

  const handleCoverageChange = (value) => {
    const percentage = parseInt(value);
    setCoveragePercentage(percentage);
    setPourcentageCouverture(percentage);
  };

  const handleTiersPayantChange = (checked) => {
    if (gratuite && checked) {
      alert('Une consultation gratuite ne peut pas avoir de tiers payant.');
      return;
    }
    setTiersPayant(checked);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="step-container">
      <h2 className="step-title">4. VALIDATION ET DÉCOMPTE FINANCIER</h2>
      <p className="step-description">
        Vérifiez les informations et configurez les modalités de paiement avant validation
      </p>

      <div className="validation-wrapper">
        <div className="validation-grid">
          {/* Colonne gauche : Configuration financière */}
          <div className="financial-config-column">
            <div className="section-card">
              <div className="section-header">
                <div className="section-icon">💰</div>
                <h3 className="section-title">MODALITÉS DE PAIEMENT</h3>
              </div>
              
              <div className="section-content">
                {/* Option Gratuite */}
                <div className="payment-option">
                  <label className="payment-option-label">
                    <input
                      type="checkbox"
                      checked={gratuite}
                      onChange={(e) => {
                        if (tiersPayant && e.target.checked) {
                          setTiersPayant(false);
                        }
                      }}
                      className="payment-checkbox"
                      disabled={loading}
                    />
                    <div className="payment-option-content">
                      <div className="payment-icon">🎁</div>
                      <div>
                        <span className="payment-title">Consultation gratuite</span>
                        <span className="payment-description">
                          Le patient ne paiera rien pour cette consultation
                        </span>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Option Tiers Payant */}
                <div className="payment-option">
                  <label className="payment-option-label">
                    <input
                      type="checkbox"
                      checked={tiersPayant}
                      onChange={(e) => handleTiersPayantChange(e.target.checked)}
                      className="payment-checkbox"
                      disabled={gratuite || loading}
                    />
                    <div className="payment-option-content">
                      <div className="payment-icon">🏥</div>
                      <div>
                        <span className="payment-title">Tiers Payant</span>
                        <span className="payment-description">
                          Prise en charge partielle ou totale par l'assurance
                        </span>
                      </div>
                    </div>
                  </label>

                  {/* Configuration du taux de couverture */}
                  {tiersPayant && !gratuite && (
                    <div className="coverage-configuration">
                      <div className="coverage-header">
                        <span className="coverage-label">Taux de couverture</span>
                        <span className="coverage-percentage">{coveragePercentage}%</span>
                      </div>
                      
                      <div className="coverage-slider-container">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={coveragePercentage}
                          onChange={(e) => handleCoverageChange(e.target.value)}
                          className="coverage-slider"
                          disabled={loading}
                        />
                        <div className="slider-marks">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="coverage-presets">
                        <button
                          type="button"
                          onClick={() => handleCoverageChange(50)}
                          className={`coverage-preset ${coveragePercentage === 50 ? 'active' : ''}`}
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCoverageChange(70)}
                          className={`coverage-preset ${coveragePercentage === 70 ? 'active' : ''}`}
                        >
                          70%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCoverageChange(80)}
                          className={`coverage-preset ${coveragePercentage === 80 ? 'active' : ''}`}
                        >
                          80%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCoverageChange(100)}
                          className={`coverage-preset ${coveragePercentage === 100 ? 'active' : ''}`}
                        >
                          100%
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Option Paiement direct */}
                <div className="payment-option">
                  <div className="payment-option-content">
                    <div className="payment-icon">💵</div>
                    <div>
                      <span className="payment-title">Paiement direct</span>
                      <span className="payment-description">
                        Le patient paiera la totalité de la consultation
                      </span>
                    </div>
                  </div>
                  {!tiersPayant && !gratuite && (
                    <div className="direct-payment-notice">
                      <span className="notice-icon">ℹ️</span>
                      <span className="notice-text">Activé par défaut</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Résumé des signes vitaux */}
            {Object.values(signesVitaux).some(value => value && value.trim() !== '') && (
              <div className="section-card">
                <div className="section-header">
                  <div className="section-icon">🩺</div>
                  <h3 className="section-title">SIGNES VITAUX SAISIS</h3>
                </div>
                <div className="vitals-summary">
                  <div className="vitals-grid-small">
                    {signesVitaux.tensionArterielle && (
                      <div className="vital-summary-item">
                        <span className="vital-label">TA</span>
                        <span className="vital-value">{signesVitaux.tensionArterielle}</span>
                      </div>
                    )}
                    {signesVitaux.poids && (
                      <div className="vital-summary-item">
                        <span className="vital-label">Poids</span>
                        <span className="vital-value">{signesVitaux.poids} kg</span>
                      </div>
                    )}
                    {signesVitaux.taille && (
                      <div className="vital-summary-item">
                        <span className="vital-label">Taille</span>
                        <span className="vital-value">{signesVitaux.taille} cm</span>
                      </div>
                    )}
                    {signesVitaux.temperature && (
                      <div className="vital-summary-item">
                        <span className="vital-label">Temp</span>
                        <span className="vital-value">{signesVitaux.temperature}°C</span>
                      </div>
                    )}
                    {signesVitaux.pouls && (
                      <div className="vital-summary-item">
                        <span className="vital-label">Pouls</span>
                        <span className="vital-value">{signesVitaux.pouls}</span>
                      </div>
                    )}
                    {signesVitaux.frequenceRespiratoire && (
                      <div className="vital-summary-item">
                        <span className="vital-label">Fréq. Resp.</span>
                        <span className="vital-value">{signesVitaux.frequenceRespiratoire}</span>
                      </div>
                    )}
                    {signesVitaux.glycemie && (
                      <div className="vital-summary-item">
                        <span className="vital-label">Glycémie</span>
                        <span className="vital-value">{signesVitaux.glycemie}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite : Résumé et validation */}
          <div className="validation-summary-column">
            <div className="summary-card-large">
              <div className="summary-header">
                <h3 className="summary-title">RÉSUMÉ DE LA CONSULTATION</h3>
              </div>

              {/* Patient */}
              <div className="summary-section">
                <div className="summary-section-header">
                  <div className="summary-icon">👤</div>
                  <h4 className="summary-subtitle">PATIENT</h4>
                </div>
                <div className="summary-content">
                  <div className="summary-row">
                    <span className="summary-label">Nom complet:</span>
                    <span className="summary-value">
                      {selectedPatient?.NOM_BEN} {selectedPatient?.PRE_BEN}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Identifiant:</span>
                    <span className="summary-value">{selectedPatient?.IDENTIFIANT_NATIONAL}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Statut ACE:</span>
                    <span className="summary-value highlight">{getStatutACE()}</span>
                  </div>
                  {selectedPatient?.EMPLOYEUR && (
                    <div className="summary-row">
                      <span className="summary-label">Employeur:</span>
                      <span className="summary-value">{selectedPatient.EMPLOYEUR}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Consultation */}
              <div className="summary-section">
                <div className="summary-section-header">
                  <div className="summary-icon">🩺</div>
                  <h4 className="summary-subtitle">CONSULTATION</h4>
                </div>
                <div className="summary-content">
                  <div className="summary-row">
                    <span className="summary-label">Médecin:</span>
                    <span className="summary-value">
                      Dr. {getMedecinInfo(selectedMedecin).NOM_COMPLET}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Spécialité:</span>
                    <span className="summary-value">
                      {getMedecinInfo(selectedMedecin).SPECIALITE}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Type:</span>
                    <span className="summary-value">{selectedType}</span>
                  </div>
                </div>
              </div>

              {/* Rendez-vous de suivi */}
              {dateRendezVous && (
                <div className="summary-section">
                  <div className="summary-section-header">
                    <div className="summary-icon">📅</div>
                    <h4 className="summary-subtitle">RENDEZ-VOUS DE SUIVI</h4>
                  </div>
                  <div className="summary-content">
                    <div className="rdv-summary">
                      <span className="rdv-date">{formatDate(dateRendezVous)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Décompte financier */}
              <div className="summary-section financial-summary">
                <div className="summary-section-header">
                  <div className="summary-icon">💰</div>
                  <h4 className="summary-subtitle">DÉCOMPTE FINANCIER</h4>
                </div>
                <div className="financial-details">
                  <div className="financial-row">
                    <span className="financial-label">Montant total:</span>
                    <span className="financial-amount">
                      {montantTotal.toLocaleString()} FCFA
                    </span>
                  </div>

                  {tiersPayant && !gratuite && (
                    <>
                      <div className="financial-row discount-row">
                        <span className="financial-label">Prise en charge ({pourcentageCouverture}%):</span>
                        <span className="financial-discount">
                          -{montantPrisEnCharge.toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className="financial-row">
                        <span className="financial-label">Montant couvert:</span>
                        <span className="financial-covered">
                          {montantPrisEnCharge.toLocaleString()} FCFA
                        </span>
                      </div>
                    </>
                  )}

                  {gratuite && (
                    <div className="financial-row discount-row">
                      <span className="financial-label">Consultation gratuite:</span>
                      <span className="financial-discount">
                        -{montantTotal.toLocaleString()} FCFA
                      </span>
                    </div>
                  )}

                  <div className="financial-total-row">
                    <span className="total-label">RESTE À CHARGE:</span>
                    <span className={`total-amount ${resteCharge > 0 ? 'positive' : 'zero'}`}>
                      {resteCharge.toLocaleString()} FCFA
                    </span>
                  </div>

                  <div className="payment-status">
                    <span className="status-label">Statut:</span>
                    <span className={`status-badge ${gratuite ? 'gratuit' : tiersPayant ? 'tiers' : 'apayer'}`}>
                      {gratuite ? 'GRATUIT' : tiersPayant ? 'TIERS PAYANT' : 'À PAYER'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Avertissement */}
              <div className="warning-section">
                <div className="warning-header">
                  <div className="warning-icon">⚠️</div>
                  <h4 className="warning-title">AVERTISSEMENT IMPORTANT</h4>
                </div>
                <div className="warning-content">
                  <p className="warning-text">
                    La validation est <strong>IRRÉVERSIBLE</strong>. Une fois validée :
                  </p>
                  <ul className="warning-list">
                    <li>La consultation sera enregistrée dans le système</li>
                    <li>Elle deviendra facturable selon les modalités définies</li>
                    <li>Une feuille de prise en charge sera générée</li>
                    <li>Cette action ne peut pas être annulée</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="validation-actions">
                <button
                  onClick={handlePrevStep}
                  className="secondary-button large"
                  disabled={loading}
                >
                  ← Retour aux informations médicales
                </button>
                <button
                  onClick={handleValidate}
                  disabled={loading}
                  className={`validate-button ${loading ? 'loading' : ''}`}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Validation en cours...
                    </>
                  ) : (
                    '✅ VALIDER LA CONSULTATION'
                  )}
                </button>
              </div>

              {/* Note de validation */}
              <div className="validation-note">
                <p className="note-text">
                  <strong>Note:</strong> Après validation, vous pourrez imprimer la feuille de prise en charge
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationStep;