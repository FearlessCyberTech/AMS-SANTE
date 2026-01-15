import React, { useState } from 'react';

const PrintStep = ({
  consultationId,
  selectedPatient,
  getStatutACE,
  assurePrincipal,
  montantTotal,
  gratuite,
  tiersPayant,
  handlePrint,
  handleNewConsultation
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrintClick = () => {
    setIsPrinting(true);
    setTimeout(() => {
      handlePrint();
      setIsPrinting(false);
    }, 1000);
  };

  return (
    <div className="step-container">
      <h2 className="step-title">5. FEUILLE DE PRISE EN CHARGE</h2>
      
      <div className="success-section">
        <div className="success-icon-container">
          <div className="success-icon-animated">
            <div className="checkmark">✓</div>
          </div>
        </div>
        
        <div className="success-message-container">
          <h3 className="success-title">Consultation enregistrée avec succès !</h3>
          <p className="success-subtitle">
            La consultation a été enregistrée dans le système et est maintenant prête pour l'impression.
          </p>
        </div>

        {/* Détails de la consultation */}
        <div className="consultation-details-card">
          <div className="details-header">
            <h4 className="details-title">📋 DÉTAILS DE LA CONSULTATION</h4>
            <span className="consultation-number">
              N°: CONS-{consultationId?.toString().padStart(6, '0') || '000000'}
            </span>
          </div>
          
          <div className="details-grid">
            {/* Informations patient */}
            <div className="details-section">
              <div className="section-header">
                <div className="section-icon">👤</div>
                <h5 className="section-title">PATIENT</h5>
              </div>
              <div className="section-content">
                <div className="detail-row">
                  <span className="detail-label">Nom complet:</span>
                  <span className="detail-value highlight">
                    {selectedPatient?.NOM_BEN} {selectedPatient?.PRE_BEN}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Identifiant:</span>
                  <span className="detail-value">{selectedPatient?.IDENTIFIANT_NATIONAL}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Statut ACE:</span>
                  <span className="detail-value badge">{getStatutACE()}</span>
                </div>
                {selectedPatient?.EMPLOYEUR && (
                  <div className="detail-row">
                    <span className="detail-label">Employeur:</span>
                    <span className="detail-value">{selectedPatient.EMPLOYEUR}</span>
                  </div>
                )}
                {(selectedPatient?.COD_PAI === 2 || selectedPatient?.COD_PAI === 3) && assurePrincipal && (
                  <div className="detail-row">
                    <span className="detail-label">Assuré Principal:</span>
                    <span className="detail-value">{assurePrincipal}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Informations financières */}
            <div className="details-section">
              <div className="section-header">
                <div className="section-icon">💰</div>
                <h5 className="section-title">FINANCIER</h5>
              </div>
              <div className="section-content">
                <div className="detail-row">
                  <span className="detail-label">Montant total:</span>
                  <span className="detail-value">{montantTotal.toLocaleString()} FCFA</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Statut paiement:</span>
                  <span className={`status-badge ${gratuite ? 'gratuit' : tiersPayant ? 'tiers' : 'apayer'}`}>
                    {gratuite ? 'GRATUIT' : tiersPayant ? 'TIERS PAYANT' : 'À PAYER'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date d'enregistrement:</span>
                  <span className="detail-value">
                    {new Date().toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="details-section">
              <div className="section-header">
                <div className="section-icon">⚡</div>
                <h5 className="section-title">ACTIONS RAPIDES</h5>
              </div>
              <div className="section-content">
                <div className="quick-actions">
                  <button
                    onClick={() => {
                      // Option pour copier le numéro de consultation
                      navigator.clipboard.writeText(`CONS-${consultationId?.toString().padStart(6, '0') || '000000'}`);
                      alert('Numéro de consultation copié !');
                    }}
                    className="quick-action-btn copy-btn"
                  >
                    📋 Copier le numéro
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="quick-action-btn print-btn"
                  >
                    🖨️ Imprimer cette page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions principales */}
        <div className="action-buttons-container">
          <div className="primary-actions">
            <button
              onClick={handlePrintClick}
              disabled={isPrinting}
              className="print-main-button"
            >
              {isPrinting ? (
                <>
                  <span className="loading-spinner"></span>
                  Préparation de l'impression...
                </>
              ) : (
                <>
                  <span className="print-icon">📄</span>
                  IMPRIMER LA FEUILLE DE PRISE EN CHARGE
                </>
              )}
            </button>
            <button
              onClick={handleNewConsultation}
              className="new-consultation-button"
            >
              <span className="plus-icon">➕</span>
              DÉMARRER UNE NOUVELLE CONSULTATION
            </button>
          </div>

          <div className="secondary-actions">
            <button className="email-button">
              📧 Envoyer par email
            </button>
            <button className="save-pdf-button">
              💾 Sauvegarder en PDF
            </button>
            <button className="archive-button">
              🗄️ Archiver la consultation
            </button>
          </div>
        </div>

        {/* Instructions d'impression */}
        <div className="print-instructions">
          <div className="instructions-header">
            <h4 className="instructions-title">📝 INSTRUCTIONS D'IMPRESSION</h4>
          </div>
          <div className="instructions-content">
            <ul className="instructions-list">
              <li>
                <span className="instruction-icon">1️⃣</span>
                <span className="instruction-text">
                  Cliquez sur <strong>"IMPRIMER LA FEUILLE"</strong> pour ouvrir l'aperçu d'impression
                </span>
              </li>
              <li>
                <span className="instruction-icon">2️⃣</span>
                <span className="instruction-text">
                  Vérifiez que le document s'affiche correctement sur 3 pages
                </span>
              </li>
              <li>
                <span className="instruction-icon">3️⃣</span>
                <span className="instruction-text">
                  Dans les paramètres d'impression, sélectionnez <strong>"Toutes les pages"</strong>
                </span>
              </li>
              <li>
                <span className="instruction-icon">4️⃣</span>
                <span className="instruction-text">
                  Choisissez l'orientation <strong>"Portrait"</strong> et le format <strong>"A4"</strong>
                </span>
              </li>
              <li>
                <span className="instruction-icon">5️⃣</span>
                <span className="instruction-text">
                  Désactivez les en-têtes et pieds de page pour un rendu optimal
                </span>
              </li>
              <li>
                <span className="instruction-icon">6️⃣</span>
                <span className="instruction-text">
                  Remettez les 3 pages au patient après impression et signature
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Notes importantes */}
        <div className="important-notes">
          <div className="notes-header">
            <h4 className="notes-title">⚠️ NOTES IMPORTANTES</h4>
          </div>
          <div className="notes-content">
            <p className="note-text">
              • La feuille de prise en charge est un document <strong>médical et administratif important</strong>
            </p>
            <p className="note-text">
              • Elle doit être <strong>signée par le médecin</strong> et tamponnée par le centre de santé
            </p>
            <p className="note-text">
              • Le patient doit conserver ce document pour toute démarche ultérieure
            </p>
            <p className="note-text">
              • Une copie doit être archivée dans le dossier médical du patient
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="stats-section">
        <div className="stats-card">
          <div className="stat-item">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">N° CONS-{consultationId?.toString().padStart(6, '0') || '000000'}</div>
              <div className="stat-label">Consultation enregistrée</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{selectedPatient?.IDENTIFIANT_NATIONAL || 'N/A'}</div>
              <div className="stat-label">Identifiant patient</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">{montantTotal.toLocaleString()} FCFA</div>
              <div className="stat-label">Montant total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintStep;