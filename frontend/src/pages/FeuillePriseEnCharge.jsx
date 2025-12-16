import React from 'react';
import './FeuillePriseEnCharge.css';

const FeuillePriseEnCharge = ({
  consultationId,
  selectedPatient,
  medecins,
  selectedMedecin,
  selectedType,
  montantTotal,
  gratuite,
  tiersPayant,
  pourcentageCouverture,
  montantPrisEnCharge,
  resteCharge,
  signesVitaux,
  observations,
  examens,
  traitements,
  recommandations,
  dateRendezVous,
  assurePrincipal,
  getStatutACE
}) => {
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMedecinInfo = () => {
    const medecin = medecins.find(m => m.COD_PRE === parseInt(selectedMedecin));
    return medecin || { NOM_COMPLET: 'Dr. Non spécifié', SPECIALITE: 'Spécialité non spécifiée' };
  };

  const medecin = getMedecinInfo();
  const currentDate = new Date();

  return (
    <div id="feuille-prise-en-charge" className="feuille-prise-en-charge">
      {/* Page 1 - Informations Générales */}
      <div className="page page1">
        <div className="header">
          <div className="header-left">
            <div className="logo">
              <div className="logo-placeholder">LOGO</div>
              <div className="center-info">
                <h1>CENTRE DE SANTÉ PRINCIPAL</h1>
                <p className="subtitle">Service de Consultation Médicale</p>
                <p className="address">BP: 1234 Yaoundé - Tél: +237 222 123 456</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="document-info">
              <p className="doc-title">FEUILLE DE PRISE EN CHARGE</p>
              <p className="doc-number">N°: CONS-{consultationId?.toString().padStart(6, '0') || '000000'}</p>
              <p className="doc-date">Date: {formatDate(currentDate)}</p>
            </div>
          </div>
        </div>

        <div className="section-title">
          <h2>1. INFORMATIONS DU PATIENT</h2>
        </div>

        <div className="patient-info-grid">
          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Nom et Prénoms:</span>
              <span className="info-value">{selectedPatient ? `${selectedPatient.NOM_BEN} ${selectedPatient.PRE_BEN}` : '____________________'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Statut ACE:</span>
              <span className="info-value highlight">{selectedPatient ? getStatutACE() : '____________________'}</span>
            </div>
          </div>

          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Sexe:</span>
              <span className="info-value">{selectedPatient?.SEX_BEN === 'M' ? 'Masculin' : 'Féminin'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Date de naissance:</span>
              <span className="info-value">{selectedPatient?.NAI_BEN ? formatDate(selectedPatient.NAI_BEN) : '____________________'}</span>
            </div>
          </div>

          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Âge:</span>
              <span className="info-value">{selectedPatient?.AGE || '____'} ans</span>
            </div>
            <div className="info-item">
              <span className="info-label">Identifiant National:</span>
              <span className="info-value">{selectedPatient?.IDENTIFIANT_NATIONAL || '____________________'}</span>
            </div>
          </div>

          <div className="info-row">
            <div className="info-item full-width">
              <span className="info-label">Entreprise / Employeur:</span>
              <span className="info-value highlight">{selectedPatient?.EMPLOYEUR || 'Non spécifié'}</span>
            </div>
          </div>

          {(selectedPatient?.COD_PAI === 2 || selectedPatient?.COD_PAI === 3) && (
            <div className="info-row">
              <div className="info-item full-width">
                <span className="info-label">Assuré Principal:</span>
                <span className="info-value">{assurePrincipal || `${selectedPatient?.NOM_BEN} ${selectedPatient?.PRE_BEN}`}</span>
              </div>
            </div>
          )}
        </div>

        <div className="section-title">
          <h2>2. INFORMATIONS DE LA CONSULTATION</h2>
        </div>

        <div className="consultation-info-grid">
          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Date et heure:</span>
              <span className="info-value">{formatDateTime(currentDate)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Médecin traitant:</span>
              <span className="info-value">{medecin.NOM_COMPLET}</span>
            </div>
          </div>

          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Spécialité:</span>
              <span className="info-value">{medecin.SPECIALITE}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Type de consultation:</span>
              <span className="info-value">{selectedType}</span>
            </div>
          </div>

          <div className="info-row">
            <div className="info-item full-width">
              <span className="info-label">Motif de consultation:</span>
              <span className="info-value">Consultation médicale</span>
            </div>
          </div>
        </div>

        <div className="section-title">
          <h2>3. SIGNES VITAUX</h2>
        </div>

        <div className="signes-vitaux-grid">
          <div className="vital-box">
            <div className="vital-label">TENSION ARTÉRIELLE</div>
            <div className="vital-value">{signesVitaux.tensionArterielle || '____/____ mmHg'}</div>
          </div>
          
          <div className="vital-box">
            <div className="vital-label">POIDS</div>
            <div className="vital-value">{signesVitaux.poids ? `${signesVitaux.poids} kg` : '____ kg'}</div>
          </div>
          
          <div className="vital-box">
            <div className="vital-label">TAILLE</div>
            <div className="vital-value">{signesVitaux.taille ? `${signesVitaux.taille} cm` : '____ cm'}</div>
          </div>
          
          <div className="vital-box">
            <div className="vital-label">TEMPERATURE</div>
            <div className="vital-value">{signesVitaux.temperature ? `${signesVitaux.temperature} °C` : '____ °C'}</div>
          </div>
          
          <div className="vital-box">
            <div className="vital-label">POULS</div>
            <div className="vital-value">{signesVitaux.pouls ? `${signesVitaux.pouls} bpm` : '____ bpm'}</div>
          </div>
          
          <div className="vital-box">
            <div className="vital-label">FRÉQUENCE RESPIRATOIRE</div>
            <div className="vital-value">{signesVitaux.frequenceRespiratoire || '____'}</div>
          </div>
          
          <div className="vital-box double-width">
            <div className="vital-label">GLYCÉMIE</div>
            <div className="vital-value">{signesVitaux.glycemie ? `${signesVitaux.glycemie} mg/dL` : '____ mg/dL'}</div>
          </div>
        </div>

        <div className="page-footer">
          <p>Page 1/3 - Feuille de prise en charge médicale - N° CONS-{consultationId?.toString().padStart(6, '0') || '000000'}</p>
        </div>
      </div>

      {/* Page 2 - Observations et Prescriptions */}
      <div className="page page2">
        <div className="header">
          <div className="header-left">
            <h2>OBSERVATIONS ET PRESCRIPTIONS MÉDICALES</h2>
          </div>
          <div className="header-right">
            <p className="doc-number">N°: CONS-{consultationId?.toString().padStart(6, '0') || '000000'}</p>
          </div>
        </div>

        <div className="section-title">
          <h3>4. OBSERVATIONS MÉDICALES</h3>
        </div>
        <div className="text-section">
          <div className="text-content">
            {observations || '______________________________________________________________________________________\n______________________________________________________________________________________\n______________________________________________________________________________________'}
          </div>
          <div className="signature-line">
            <span>Signature du médecin: </span>
            <span className="signature-space">__________________________</span>
          </div>
        </div>

        <div className="section-title">
          <h3>5. EXAMENS COMPLÉMENTAIRES PRESCRITS</h3>
        </div>
        <div className="text-section">
          <div className="text-content">
            {examens || '______________________________________________________________________________________\n______________________________________________________________________________________\n______________________________________________________________________________________'}
          </div>
          <div className="note">
            <em>À réaliser dans les meilleurs délais et à présenter lors de la prochaine consultation</em>
          </div>
        </div>

        <div className="section-title">
          <h3>6. TRAITEMENT PRESCRIT</h3>
        </div>
        <div className="text-section">
          <div className="text-content">
            {traitements || '______________________________________________________________________________________\n______________________________________________________________________________________\n______________________________________________________________________________________'}
          </div>
          <div className="note">
            <em>Posologie et durée du traitement à respecter scrupuleusement</em>
          </div>
        </div>

        <div className="page-footer">
          <p>Page 2/3 - Observations et prescriptions médicales - N° CONS-{consultationId?.toString().padStart(6, '0') || '000000'}</p>
        </div>
      </div>

      {/* Page 3 - Financier et Administratif */}
      <div className="page page3">
        <div className="header">
          <div className="header-left">
            <h2>INFORMATIONS FINANCIÈRES ET ADMINISTRATIVES</h2>
          </div>
          <div className="header-right">
            <p className="doc-number">N°: CONS-{consultationId?.toString().padStart(6, '0') || '000000'}</p>
          </div>
        </div>

        <div className="section-title">
          <h3>7. RECOMMANDATIONS ET CONSEILS</h3>
        </div>
        <div className="text-section">
          <div className="text-content">
            {recommandations || '______________________________________________________________________________________\n______________________________________________________________________________________\n______________________________________________________________________________________'}
          </div>
        </div>

        <div className="section-title">
          <h3>8. PROCHAIN RENDEZ-VOUS</h3>
        </div>
        <div className="rdv-section">
          <p>Date du prochain rendez-vous: <span className="rdv-date">{dateRendezVous ? formatDate(dateRendezVous) : '________________________'}</span></p>
          <p className="rdv-note"><em>(À confirmer avec le secrétariat du service)</em></p>
        </div>

        <div className="section-title">
          <h3>9. DÉCOMPTE FINANCIER</h3>
        </div>
        
        <div className="financial-table-container">
          <table className="financial-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Montant</th>
                <th>Observation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Montant total de la consultation</td>
                <td className="amount">{montantTotal.toLocaleString()} FCFA</td>
                <td>Tarif standard</td>
              </tr>
              
              {tiersPayant && !gratuite && (
                <>
                  <tr>
                    <td>Taux de couverture</td>
                    <td className="amount">{pourcentageCouverture}%</td>
                    <td>Assurance maladie</td>
                  </tr>
                  <tr>
                    <td>Montant pris en charge</td>
                    <td className="discount">-{montantPrisEnCharge.toLocaleString()} FCFA</td>
                    <td>Remboursement</td>
                  </tr>
                </>
              )}
              
              {gratuite && (
                <tr>
                  <td>Consultation gratuite</td>
                  <td className="discount">-{montantTotal.toLocaleString()} FCFA</td>
                  <td>Exonération</td>
                </tr>
              )}
              
              <tr className="total-row">
                <td><strong>RESTE À CHARGE PATIENT</strong></td>
                <td className="total-amount"><strong>{resteCharge.toLocaleString()} FCFA</strong></td>
                <td>
                  <span className={`status-badge ${gratuite ? 'gratuit' : tiersPayant ? 'tiers' : 'apayer'}`}>
                    {gratuite ? 'GRATUIT' : (tiersPayant ? 'TIERS PAYANT' : 'À PAYER')}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="section-title">
          <h3>10. INFORMATIONS ADMINISTRATIVES</h3>
        </div>
        
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Information</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>N° Consultation</td>
                <td>CONS-{consultationId?.toString().padStart(6, '0') || '000000'}</td>
                <td>{formatDate(currentDate)}</td>
              </tr>
              <tr>
                <td>Code Patient</td>
                <td>{selectedPatient?.IDENTIFIANT_NATIONAL || 'N/A'}</td>
                <td>{selectedPatient?.NAI_BEN ? formatDate(selectedPatient.NAI_BEN) : 'N/A'}</td>
              </tr>
              <tr>
                <td>Médecin traitant</td>
                <td>{medecin.NOM_COMPLET}</td>
                <td>{formatDate(currentDate)}</td>
              </tr>
              <tr>
                <td>Service</td>
                <td>Consultation Médicale</td>
                <td>{formatDate(currentDate)}</td>
              </tr>
              <tr>
                <td>Document généré le</td>
                <td>{formatDateTime(currentDate)}</td>
                <td>Par: Système Gestion Médicale</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="signatures-section">
          <div className="signature-box">
            <div className="signature-field">
              <p className="signature-label">Cachet du centre de santé</p>
              <div className="signature-space">
                <p className="center-stamp">CENTRE DE SANTÉ PRINCIPAL</p>
                <p>BP: 1234 Yaoundé</p>
                <p>Tél: +237 222 123 456</p>
              </div>
            </div>
          </div>
          
          <div className="signature-box">
            <div className="signature-field">
              <p className="signature-label">Signature et cachet du médecin</p>
              <div className="signature-space">
                <p className="doctor-signature">__________________________</p>
                <p className="doctor-name">{medecin.NOM_COMPLET}</p>
                <p className="doctor-specialty">{medecin.SPECIALITE}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-note">
          <p><em>Ce document est à conserver par le patient et à présenter pour toute démarche ultérieure</em></p>
          <p><em>Conservation obligatoire pendant 10 ans</em></p>
        </div>

        <div className="page-footer">
          <p>Page 3/3 - Informations financières et administratives - N° CONS-{consultationId?.toString().padStart(6, '0') || '000000'}</p>
        </div>
      </div>
    </div>
  );
};

export default FeuillePriseEnCharge;