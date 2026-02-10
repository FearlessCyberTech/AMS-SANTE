import React, { forwardRef } from 'react';
import moment from 'moment';

const OrdonnancePrint = forwardRef(({ data, getTypeLabel }, ref) => {
  return (
    <div ref={ref} style={{ padding: '20mm', fontFamily: 'Arial, sans-serif' }}>
      {/* En-tête professionnel */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #1890ff', paddingBottom: '15px', marginBottom: '20px' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
          {getTypeLabel(data.typePrestation)}
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {data.centreNom}
        </div>
        <div style={{ fontSize: '12px', color: '#999' }}>
          N°: {data.numero} | Date: {moment().format('DD/MM/YYYY HH:mm')}
        </div>
      </div>

      {/* Informations patient et médecin */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: '#1890ff' }}>PATIENT</h4>
          <p><strong>Nom:</strong> {data.patient?.nom_complet}</p>
          <p><strong>Carte:</strong> {data.patient?.numero_carte || 'N/A'}</p>
          <p><strong>Âge/Sexe:</strong> {data.patient?.age} ans / {data.patient?.sexe || 'N/A'}</p>
        </div>
        
        <div style={{ flex: 1, textAlign: 'right' }}>
          <h4 style={{ color: '#1890ff' }}>PRESCRIPTEUR</h4>
          <p><strong>Dr.</strong> {data.selectedPrestataire?.nom_complet}</p>
          <p>{data.selectedPrestataire?.specialite || 'Médecin Généraliste'}</p>
        </div>
      </div>

      {/* Diagnostic */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
        <h4 style={{ color: '#1890ff', marginBottom: '5px' }}>DIAGNOSTIC</h4>
        <p><strong>{data.affectionCode}</strong> - {data.affectionLibelle || 'Non spécifié'}</p>
      </div>

      {/* Tableau des prescriptions */}
      <h4 style={{ color: '#1890ff', marginBottom: '10px' }}>PRESCRIPTIONS</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ background: '#1890ff', color: 'white' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Code</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Désignation</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Posologie</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Durée</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Quantité</th>
          </tr>
        </thead>
        <tbody>
          {data.selectedPrestations?.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.CODE_ACTE || item.COD_ELEMENT}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.LIBELLE}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.POSOLOGIE || '-'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{item.DUREE || '-'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{item.QUANTITE}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Observations */}
      <div style={{ marginBottom: '30px' }}>
        <h4 style={{ color: '#1890ff', marginBottom: '5px' }}>OBSERVATIONS</h4>
        <p style={{ minHeight: '50px', border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
          {data.observations || 'Aucune observation particulière.'}
        </p>
      </div>

      {/* Signatures et QR Code */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ borderTop: '1px solid #000', width: '200px', margin: '0 auto', paddingTop: '20px' }}>
            <p><strong>Médecin Prescripteur</strong></p>
            <p>Dr. {data.selectedPrestataire?.nom_complet}</p>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', flex: 1 }}>
          {data.qrCode && (
            <div style={{ marginBottom: '10px' }}>
              {/* QR Code serait généré ici */}
              <div style={{ 
                width: '100px', 
                height: '100px', 
                border: '1px dashed #ccc',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '10px'
              }}>
                QR Code
              </div>
            </div>
          )}
          <p style={{ fontSize: '10px', color: '#666' }}>Code de validation</p>
        </div>
      </div>

      {/* Pied de page */}
      <div style={{ 
        marginTop: '50px', 
        fontSize: '10px', 
        color: '#999', 
        textAlign: 'center',
        borderTop: '1px solid #eee',
        paddingTop: '10px'
      }}>
        <p>Document généré le {moment().format('DD/MM/YYYY à HH:mm')} • {data.centreNom}</p>
        <p>Validité: {data.dateValidite} • Page 1/1</p>
        <p style={{ fontStyle: 'italic' }}>
          Cette ordonnance est valide uniquement avec le cachet et la signature du médecin.
        </p>
      </div>
    </div>
  );
});

export default OrdonnancePrint;