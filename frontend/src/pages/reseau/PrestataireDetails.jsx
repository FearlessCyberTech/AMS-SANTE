// src/pages/prestataires/PrestataireDetails.jsx
import React, { useState, useEffect } from 'react';
import './prestataires.css';

const PrestataireDetails = ({ prestataire, onEdit, onClose }) => {
  const [centreDetails, setCentreDetails] = useState(null);
  const [loadingCentre, setLoadingCentre] = useState(false);

  useEffect(() => {
    const loadCentreDetails = async () => {
      if (prestataire.COD_CEN) {
        try {
          setLoadingCentre(true);
          const response = await api.get(`/centres-sante/${prestataire.COD_CEN}`);
          if (response.data.success) {
            setCentreDetails(response.data.centre);
          }
        } catch (error) {
          console.error('Erreur chargement centre:', error);
        } finally {
          setLoadingCentre(false);
        }
      }
    };

    loadCentreDetails();
  }, [prestataire.COD_CEN]);

  return (
    <div className="prestataire-details-container">
      <div className="details-header">
        <h2>
          {prestataire.NOM_PRESTATAIRE} {prestataire.PRENOM_PRESTATAIRE}
          <span className={`badge ms-2 ${prestataire.ACTIF ? 'bg-success' : 'bg-danger'}`}>
            {prestataire.ACTIF ? 'Actif' : 'Inactif'}
          </span>
        </h2>
        
        <div className="btn-group">
          <button className="btn btn-primary" onClick={onEdit}>
            <i className="fas fa-edit"></i> Modifier
          </button>
          <button className="btn btn-outline-secondary" onClick={onClose}>
            <i className="fas fa-times"></i> Fermer
          </button>
        </div>
      </div>

      <div className="details-content">
        <div className="row">
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Informations personnelles</h5>
              </div>
              <div className="card-body">
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <th width="40%">Nom complet:</th>
                      <td>{prestataire.NOM_PRESTATAIRE} {prestataire.PRENOM_PRESTATAIRE}</td>
                    </tr>
                    <tr>
                      <th>Type:</th>
                      <td>
                        <span className="badge bg-info">{prestataire.TYPE_PRESTATAIRE}</span>
                      </td>
                    </tr>
                    <tr>
                      <th>Titre:</th>
                      <td>{prestataire.TITRE || '-'}</td>
                    </tr>
                    <tr>
                      <th>Spécialité:</th>
                      <td>{prestataire.SPECIALITE || '-'}</td>
                    </tr>
                    <tr>
                      <th>Statut:</th>
                      <td>
                        <span className={`badge ${prestataire.ACTIF ? 'bg-success' : 'bg-danger'}`}>
                          {prestataire.ACTIF ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Coordonnées</h5>
              </div>
              <div className="card-body">
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <th width="40%">Téléphone:</th>
                      <td>{prestataire.TELEPHONE || '-'}</td>
                    </tr>
                    <tr>
                      <th>Email:</th>
                      <td>{prestataire.EMAIL || '-'}</td>
                    </tr>
                    <tr>
                      <th>Centre de santé:</th>
                      <td>
                        {prestataire.COD_CEN ? (
                          loadingCentre ? (
                            <span className="text-muted">Chargement...</span>
                          ) : centreDetails ? (
                            <span className="badge bg-secondary">{centreDetails.NOM_CENTRE}</span>
                          ) : (
                            <span className="text-muted">Centre ID: {prestataire.COD_CEN}</span>
                          )
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>Date création:</th>
                      <td>{prestataire.DAT_CREUTIL ? new Date(prestataire.DAT_CREUTIL).toLocaleDateString('fr-FR') : '-'}</td>
                    </tr>
                    <tr>
                      <th>Dernière modification:</th>
                      <td>{prestataire.DAT_MODUTIL ? new Date(prestataire.DAT_MODUTIL).toLocaleDateString('fr-FR') : '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrestataireDetails;