import React, { forwardRef } from 'react';
import moment from 'moment';

const ExecutionSheetPrint = forwardRef(({ data }, ref) => {
  return (
    <div ref={ref} style={{ padding: '15mm', fontFamily: 'Arial, sans-serif' }}>
      {/* En-tête */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #52c41a', paddingBottom: '15px', marginBottom: '20px' }}>
        <h2 style={{ color: '#52c41a', marginBottom: '5px' }}>FICHE D'EXÉCUTION</h2>
        <h3 style={{ color: '#666', marginBottom: '5px' }}>{data.centreNom}</h3>
        <p style={{ fontSize: '12px', color: '#999' }}>
          Prescription: {data.NUM_PRESCRIPTION} | Générée le: {moment().format('DD/MM/YYYY HH:mm')}
        </p>
      </div>

      {/* Informations */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p><strong>Patient:</strong> {data.PRE_BEN} {data.NOM_BEN}</p>
            <p><strong>Carte:</strong> {data.NUMERO_CARTE}</p>
          </div>
          <div>
            <p><strong>Date prescription:</strong> {moment(data.DATE_PRESCRIPTION).format('DD/MM/YYYY HH:mm')}</p>
            <p><strong>Type:</strong> {data.TYPE_PRESTATION}</p>
          </div>
        </div>
      </div>

      {/* Tableau d'exécution */}
      <h4 style={{ color: '#52c41a', marginBottom: '10px' }}>SUIVI D'EXÉCUTION</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ background: '#52c41a', color: 'white' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Élément</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Qté prescrite</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Qté exécutée</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Statut</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Observation</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Date exécution</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Signature</th>
          </tr>
        </thead>
        <tbody>
          {(data.details || []).map((item, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.LIBELLE}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{item.QUANTITE}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                {item.QUANTITE_EXECUTEE || '0'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                <span style={{ 
                  color: item.STATUT_EXECUTION === 'EXECUTE' ? '#52c41a' : '#faad14',
                  fontWeight: 'bold'
                }}>
                  {item.STATUT_EXECUTION === 'EXECUTE' ? '✓' : '●'}
                </span>
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {item.OBSERVATION_EXECUTION || ''}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {item.DATE_EXECUTION ? moment(item.DATE_EXECUTION).format('DD/MM/YY HH:mm') : ''}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', height: '40px' }}>
                {/* Espace pour signature */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Progression */}
      <div style={{ marginBottom: '30px' }}>
        <h4 style={{ color: '#52c41a', marginBottom: '10px' }}>PROGRESSION GLOBALE</h4>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, marginRight: '20px' }}>
            <div style={{ 
              width: '100%', 
              background: '#f0f0f0', 
              height: '20px', 
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${data.progression || 0}%`, 
                background: '#52c41a', 
                height: '100%',
                transition: 'width 0.3s'
              }}></div>
            </div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
            {data.progression || 0}%
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px' }}>
        <div style={{ textAlign: 'center', width: '40%' }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: '20px', marginBottom: '10px' }}>
            <p><strong>Responsable Exécution</strong></p>
            <p style={{ fontSize: '12px', color: '#666' }}>Nom et signature</p>
          </div>
          <div>
            <p>Date: _________________</p>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', width: '40%' }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: '20px', marginBottom: '10px' }}>
            <p><strong>Contrôle Qualité</strong></p>
            <p style={{ fontSize: '12px', color: '#666' }}>Nom et signature</p>
          </div>
          <div>
            <p>Date: _________________</p>
          </div>
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
        <p>Fiche d'exécution générée le {moment().format('DD/MM/YYYY à HH:mm')}</p>
        <p>{data.centreNom} • Tél: _________________ • Email: _________________</p>
      </div>
    </div>
  );
});

export default ExecutionSheetPrint;