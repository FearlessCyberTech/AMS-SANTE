// src/components/PrescriptionPrint.jsx
import React from 'react';
import './prescription-print.css';

const PrescriptionPrint = ({ prescription, details }) => {
  const calculateTotal = () => {
    return details.reduce((sum, detail) => sum + (detail.quantite * detail.prix_unitaire), 0);
  };

  return (
    <div className="prescription-print no-print">
      {/* Original */}
      <div className="original">
        <div className="header">
          <div className="stamp">ORIGINAL</div>
          <h2>PRESCRIPTION MÉDICALE</h2>
          <div className="subtitle">
            CENTRE DE SANTÉ - {prescription?.NOM_CENTRE || 'Centre Principal'}
          </div>
          <div className="numero">N°: {prescription?.NUM_PRESCRIPTION}</div>
        </div>

        <div className="patient-info">
          <div>
            <strong>Patient:</strong> {prescription?.NOM_BEN} {prescription?.PRE_BEN}<br />
            <strong>Né(e) le:</strong> {new Date(prescription?.NAI_BEN).toLocaleDateString('fr-FR')}<br />
            <strong>Âge:</strong> {prescription?.AGE} ans<br />
            <strong>Sexe:</strong> {prescription?.SEX_BEN === 'M' ? 'Masculin' : 'Féminin'}
          </div>
          <div>
            <strong>Identifiant:</strong> {prescription?.IDENTIFIANT_NATIONAL}<br />
            <strong>Date prescription:</strong> {new Date(prescription?.DATE_PRESCRIPTION).toLocaleDateString('fr-FR')}<br />
            <strong>Médecin:</strong> {prescription?.NOM_MEDECIN} {prescription?.PRENOM_MEDECIN}<br />
            <strong>Affection:</strong> {prescription?.LIB_AFF}
          </div>
        </div>

        <div className="section">
          <div className="section-title">PRESCRIPTION</div>
          <table className="prescription-table">
            <thead>
              <tr>
                <th>Désignation</th>
                <th>Quantité</th>
                <th>Posologie</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              {details.map((detail, index) => (
                <tr key={index}>
                  <td>{detail.libelle}</td>
                  <td>{detail.quantite} {detail.unite}</td>
                  <td>{detail.posologie}</td>
                  <td>{detail.duree_traitement} jours</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {prescription?.observations && (
          <div className="section">
            <div className="section-title">OBSERVATIONS</div>
            <div style={{ padding: '10px' }}>
              {prescription.observations}
            </div>
          </div>
        )}

        <div className="footer">
          <div>
            <strong>Validité:</strong> {prescription?.DATE_VALIDITE ? new Date(prescription.DATE_VALIDITE).toLocaleDateString('fr-FR') : 'Illimitée'}<br />
            <strong>Type:</strong> {prescription?.TYPE_PRESTATION}<br />
            <strong>Origine:</strong> {prescription?.ORIGINE}
          </div>
          <div>
            <strong>Total estimé:</strong> {calculateTotal().toLocaleString('fr-FR')} FCFA<br />
            <strong>Statut:</strong> {prescription?.STATUT}
          </div>
        </div>

        <div className="signature">
          <p>Signature et cachet du médecin</p>
          <div style={{ height: '50px' }}></div>
          <p>{prescription?.NOM_MEDECIN} {prescription?.PRENOM_MEDECIN}</p>
          <p>{prescription?.SPECIALITE}</p>
        </div>
      </div>

      {/* Duplicata */}
      <div className="page-break"></div>
      
      <div className="duplicata">
        <div className="header">
          <div className="stamp">DUPLICATA</div>
          <h2>PRESCRIPTION MÉDICALE</h2>
          <div className="subtitle">
            CENTRE DE SANTÉ - {prescription?.NOM_CENTRE || 'Centre Principal'}
          </div>
          <div className="numero">N°: {prescription?.NUM_PRESCRIPTION}</div>
        </div>

        {/* Même contenu que l'original */}
        <div className="patient-info">
          <div>
            <strong>Patient:</strong> {prescription?.NOM_BEN} {prescription?.PRE_BEN}<br />
            <strong>Né(e) le:</strong> {new Date(prescription?.NAI_BEN).toLocaleDateString('fr-FR')}<br />
            <strong>Âge:</strong> {prescription?.AGE} ans<br />
            <strong>Sexe:</strong> {prescription?.SEX_BEN === 'M' ? 'Masculin' : 'Féminin'}
          </div>
          <div>
            <strong>Identifiant:</strong> {prescription?.IDENTIFIANT_NATIONAL}<br />
            <strong>Date prescription:</strong> {new Date(prescription?.DATE_PRESCRIPTION).toLocaleDateString('fr-FR')}<br />
            <strong>Médecin:</strong> {prescription?.NOM_MEDECIN} {prescription?.PRENOM_MEDECIN}<br />
            <strong>Affection:</strong> {prescription?.LIB_AFF}
          </div>
        </div>

        <div className="section">
          <div className="section-title">PRESCRIPTION</div>
          <table className="prescription-table">
            <thead>
              <tr>
                <th>Désignation</th>
                <th>Quantité</th>
                <th>Posologie</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              {details.map((detail, index) => (
                <tr key={index}>
                  <td>{detail.libelle}</td>
                  <td>{detail.quantite} {detail.unite}</td>
                  <td>{detail.posologie}</td>
                  <td>{detail.duree_traitement} jours</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="footer">
          <div>
            <strong>Validité:</strong> {prescription?.DATE_VALIDITE ? new Date(prescription.DATE_VALIDITE).toLocaleDateString('fr-FR') : 'Illimitée'}<br />
            <strong>Type:</strong> {prescription?.TYPE_PRESTATION}<br />
            <strong>Origine:</strong> {prescription?.ORIGINE}
          </div>
          <div>
            <strong>Total estimé:</strong> {calculateTotal().toLocaleString('fr-FR')} FCFA<br />
            <strong>Statut:</strong> {prescription?.STATUT}
          </div>
        </div>

        <div className="signature">
          <p>Signature et cachet du médecin</p>
          <div style={{ height: '50px' }}></div>
          <p>{prescription?.NOM_MEDECIN} {prescription?.PRENOM_MEDECIN}</p>
          <p>{prescription?.SPECIALITE}</p>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPrint;