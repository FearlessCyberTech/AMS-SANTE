// src/components/prestataires/StatistiquesPrestataires.js
import React from 'react';
import { Card, Row, Col, ProgressBar } from 'react-bootstrap';
import {
  FaUserMd,
  FaUserCheck,
  FaUserSlash,
  FaCalendarCheck,
  FaChartPie,
  FaHospital
} from 'react-icons/fa';

const StatistiquesPrestataires = ({ statistiques }) => {
  if (!statistiques) return null;

  const calculatePercentage = (value, total) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <Row>
      <Col lg={3} md={6} className="mb-3">
        <Card className="border-start border-primary border-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-1">Total Prestataires</h6>
                <h3 className="mb-0">{statistiques.total || 0}</h3>
                <small className="text-muted">
                  +{statistiques.nouveaux_mois || 0} ce mois
                </small>
              </div>
              <div className="bg-primary rounded p-3">
                <FaUserMd size={24} className="text-white" />
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={3} md={6} className="mb-3">
        <Card className="border-start border-success border-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-1">Prestataires Actifs</h6>
                <h3 className="mb-0">{statistiques.actifs || 0}</h3>
                <small className="text-muted">
                  {calculatePercentage(statistiques.actifs, statistiques.total)}% du total
                </small>
              </div>
              <div className="bg-success rounded p-3">
                <FaUserCheck size={24} className="text-white" />
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={3} md={6} className="mb-3">
        <Card className="border-start border-warning border-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-1">En congé/formation</h6>
                <h3 className="mb-0">
                  {(statistiques.en_conges || 0) + (statistiques.en_formation || 0)}
                </h3>
                <small className="text-muted">
                  {statistiques.en_conges || 0} congés, {statistiques.en_formation || 0} formation
                </small>
              </div>
              <div className="bg-warning rounded p-3">
                <FaCalendarCheck size={24} className="text-white" />
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={3} md={6} className="mb-3">
        <Card className="border-start border-danger border-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-1">Prestataires Inactifs</h6>
                <h3 className="mb-0">{statistiques.inactifs || 0}</h3>
                <small className="text-muted">
                  {calculatePercentage(statistiques.inactifs, statistiques.total)}% du total
                </small>
              </div>
              <div className="bg-danger rounded p-3">
                <FaUserSlash size={24} className="text-white" />
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* Répartition par spécialité */}
      {statistiques.par_specialite && Object.keys(statistiques.par_specialite).length > 0 && (
        <Col lg={6} className="mb-3">
          <Card>
            <Card.Header>
              <FaChartPie className="me-2" />
              Répartition par spécialité
            </Card.Header>
            <Card.Body>
              {Object.entries(statistiques.par_specialite).map(([specialite, count]) => (
                <div key={specialite} className="mb-2">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">{specialite}</span>
                    <span className="fw-bold">{count}</span>
                  </div>
                  <ProgressBar
                    now={calculatePercentage(count, statistiques.total)}
                    variant={getProgressBarVariant(specialite)}
                    style={{ height: '8px' }}
                  />
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      )}
    </Row>
  );
};

// Fonction utilitaire pour déterminer la couleur de la barre de progression
const getProgressBarVariant = (specialite) => {
  const variants = {
    'Médecin généraliste': 'primary',
    'Spécialiste': 'success',
    'Infirmier': 'info',
    'Kinésithérapeute': 'warning',
    'Sage-femme': 'danger',
    'Pharmacien': 'secondary'
  };
  return variants[specialite] || 'primary';
};

export default StatistiquesPrestataires;