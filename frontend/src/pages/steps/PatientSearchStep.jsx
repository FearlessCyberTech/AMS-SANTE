import React, { useState } from 'react';

const PatientSearchStep = ({
  searchType,
  setSearchType,
  cardNumber,
  setCardNumber,
  patients,
  selectedPatient,
  loading,
  handleSearchPatient,
  handleSelectPatient,
  handleNextStep
}) => {
  return (
    <div className="step-container">
      <h2 className="step-title">1. IDENTIFICATION DU PATIENT</h2>
      
      <div className="search-section">
        <div className="search-type-selector">
          <button
            onClick={() => setSearchType('carte')}
            className={`search-type-btn ${searchType === 'carte' ? 'active' : ''}`}
          >
            Carte d'assuré
          </button>
          <button
            onClick={() => setSearchType('biometrique')}
            className={`search-type-btn ${searchType === 'biometrique' ? 'active' : ''}`}
          >
            Biométrie
          </button>
        </div>

        {searchType === 'carte' && (
          <div className="card-search">
            <div className="form-group">
              <label className="form-label">Numéro de carte d'assuré</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="Ex: CM12345678"
                className="form-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchPatient();
                  }
                }}
              />
            </div>
            <button
              onClick={handleSearchPatient}
              disabled={loading || !cardNumber.trim()}
              className="search-button"
            >
              {loading ? '🔍 Recherche en cours...' : '🔍 Rechercher le patient'}
            </button>
          </div>
        )}

        {searchType === 'biometrique' && (
          <div className="biometric-section">
            <div className="biometric-icon">👆</div>
            <p className="biometric-title">Lecture biométrique</p>
            <p className="biometric-hint">Connectez votre lecteur d'empreintes et placez le doigt sur le capteur</p>
            <button className="biometric-button">
              🖐️ Démarrer la lecture
            </button>
            <div className="biometric-status">
              <p>📡 En attente de connexion du lecteur...</p>
            </div>
          </div>
        )}
      </div>

      {/* Liste des patients trouvés */}
      {patients.length > 0 && (
        <div className="patients-list-section">
          <h3 className="section-subtitle">
            👥 Bénéficiaires associés à cette carte ({patients.length} trouvé{patients.length > 1 ? 's' : ''})
          </h3>
          <div className="patients-list">
            {patients.map((patient) => (
              <div
                key={patient.ID_BEN}
                className={`patient-card ${selectedPatient?.ID_BEN === patient.ID_BEN ? 'selected' : ''}`}
                onClick={() => handleSelectPatient(patient)}
              >
                <div className="patient-info">
                  <div className="patient-main-info">
                    <div className="patient-name-row">
                      <p className="patient-name">{patient.NOM_BEN} {patient.PRE_BEN}</p>
                      <span className="patient-status-badge">
                        {patient.COD_PAI === 1 ? 'A' : patient.COD_PAI === 2 ? 'C' : patient.COD_PAI === 3 ? 'E' : '?'}
                      </span>
                    </div>
                    <div className="patient-details-grid">
                      <div className="patient-detail">
                        <span className="detail-label">ID:</span>
                        <span className="detail-value">{patient.IDENTIFIANT_NATIONAL}</span>
                      </div>
                      <div className="patient-detail">
                        <span className="detail-label">Âge:</span>
                        <span className="detail-value">{patient.AGE} ans</span>
                      </div>
                      <div className="patient-detail">
                        <span className="detail-label">Sexe:</span>
                        <span className="detail-value">{patient.SEX_BEN === 'M' ? 'Masculin' : 'Féminin'}</span>
                      </div>
                      <div className="patient-detail">
                        <span className="detail-label">Tél:</span>
                        <span className="detail-value">{patient.TELEPHONE_MOBILE || 'Non renseigné'}</span>
                      </div>
                    </div>
                    {patient.EMPLOYEUR && (
                      <div className="patient-employeur">
                        <span className="employeur-label">🏢 Employeur:</span>
                        <span className="employeur-value">{patient.EMPLOYEUR}</span>
                      </div>
                    )}
                  </div>
                  <div className="patient-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPatient(patient);
                      }}
                      className="select-patient-btn"
                    >
                      Sélectionner
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient sélectionné */}
      {selectedPatient && (
        <div className="selected-patient-card">
          <div className="selected-patient-header">
            <div className="selected-patient-icon">✅</div>
            <div>
              <p className="success-message">Patient sélectionné</p>
              <p className="patient-full-name">{selectedPatient.NOM_BEN} {selectedPatient.PRE_BEN}</p>
            </div>
          </div>
          
          <div className="selected-patient-details">
            <div className="detail-row">
              <span className="detail-label">Identifiant:</span>
              <span className="detail-value">{selectedPatient.IDENTIFIANT_NATIONAL}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Statut ACE:</span>
              <span className="detail-value highlight">
                {selectedPatient.COD_PAI === 1 ? 'Assuré Principal (A)' :
                 selectedPatient.COD_PAI === 2 ? 'Conjoint (C)' :
                 selectedPatient.COD_PAI === 3 ? 'Enfant (E)' : 'Non spécifié'}
              </span>
            </div>
            {selectedPatient.EMPLOYEUR && (
              <div className="detail-row">
                <span className="detail-label">Entreprise:</span>
                <span className="detail-value">{selectedPatient.EMPLOYEUR}</span>
              </div>
            )}
            {selectedPatient.TELEPHONE_MOBILE && (
              <div className="detail-row">
                <span className="detail-label">Téléphone:</span>
                <span className="detail-value">{selectedPatient.TELEPHONE_MOBILE}</span>
              </div>
            )}
          </div>

          <div className="selected-patient-actions">
            <button
              onClick={() => {
                setCardNumber('');
                setPatients([]);
                handleSelectPatient(null);
              }}
              className="change-patient-btn"
            >
              🔄 Changer de patient
            </button>
            <button
              onClick={handleNextStep}
              className="continue-button"
            >
              Continuer vers le paramétrage →
            </button>
          </div>
        </div>
      )}

      {/* Aucun patient trouvé */}
      {patients.length === 0 && cardNumber && !selectedPatient && !loading && (
        <div className="no-patients-found">
          <div className="no-patients-icon">😕</div>
          <p className="no-patients-title">Aucun patient trouvé</p>
          <p className="no-patients-message">
            Aucun bénéficiaire n'a été trouvé avec le numéro de carte <strong>{cardNumber}</strong>
          </p>
          <button
            onClick={() => {
              setCardNumber('');
              setPatients([]);
            }}
            className="try-again-btn"
          >
            Essayer un autre numéro
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientSearchStep;