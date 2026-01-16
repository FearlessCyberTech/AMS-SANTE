// src/components/prestataires/PrestataireDetailsModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Row,
  Col,
  Card,
  Badge,
  ListGroup,
  Tab,
  Tabs,
  Table,
  ProgressBar,
  Alert
} from 'react-bootstrap';
import {
  FaUserMd,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBirthdayCake,
  FaHospital,
  FaCalendarAlt,
  FaFileContract,
  FaChartLine,
  FaDownload,
  FaPrint,
  FaTimes
} from 'react-icons/fa';
import { prestatairesAPI } from '../../services/api';

const PrestataireDetailsModal = ({ show, onHide, prestataire }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (prestataire && show) {
      chargerDetailsComplets();
    }
  }, [prestataire, show]);

  const chargerDetailsComplets = async () => {
    if (!prestataire || !prestataire.id) return;
    
    setLoading(true);
    try {
      const response = await prestatairesAPI.getById(prestataire.id);
      if (response.success) {
        setDetails(response.prestataire);
      }
    } catch (error) {
      console.error('Erreur chargement détails:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non renseignée';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const calculerAge = (dateNaissance) => {
    if (!dateNaissance) return null;
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getStatusBadge = (status) => {
    const config = {
      'Actif': { variant: 'success', text: 'Actif' },
      'Inactif': { variant: 'danger', text: 'Inactif' },
      'En congé': { variant: 'warning', text: 'En congé' },
      'En formation': { variant: 'info', text: 'En formation' },
      'Suspendu': { variant: 'secondary', text: 'Suspendu' }
    };
    
    const statusConfig = config[status] || { variant: 'light', text: status };
    return <Badge bg={statusConfig.variant}>{statusConfig.text}</Badge>;
  };

  const getContratBadge = (type) => {
    const config = {
      'CDI': { variant: 'success', text: 'CDI' },
      'CDD': { variant: 'warning', text: 'CDD' },
      'Interim': { variant: 'info', text: 'Intérim' },
      'Consultant': { variant: 'primary', text: 'Consultant' },
      'Stagiaire': { variant: 'secondary', text: 'Stagiaire' }
    };
    
    const typeConfig = config[type] || { variant: 'light', text: type };
    return <Badge bg={typeConfig.variant}>{typeConfig.text}</Badge>;
  };

  if (loading) {
    return (
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Chargement...</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3">Chargement des informations du prestataire...</p>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaUserMd className="me-2" />
          Fiche détaillée : {prestataire?.nom} {prestataire?.prenom}
        </Modal.Title>
        <div>
          <Button variant="light" size="sm" className="me-2">
            <FaPrint className="me-1" /> Imprimer
          </Button>
          <Button variant="light" size="sm">
            <FaDownload className="me-1" /> Exporter
          </Button>
        </div>
      </Modal.Header>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3 px-3"
      >
        <Tab eventKey="general" title="Général">
          <Modal.Body>
            <Row>
              <Col md={4}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body className="text-center">
                    <div className="mb-3">
                      <div className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                        <FaUserMd size={48} className="text-white" />
                      </div>
                    </div>
                    <h4 className="mb-1">{details?.nom} {details?.prenom}</h4>
                    <p className="text-muted mb-2">{details?.titre}</p>
                    <div className="mb-3">
                      {getStatusBadge(details?.status)}
                      {' '}
                      {getContratBadge(details?.statut_contrat)}
                    </div>
                    <Badge bg="info" className="fs-6 py-2 px-3">
                      {details?.specialite}
                    </Badge>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <FaUserMd className="me-2" />
                      Informations personnelles
                    </h6>
                  </Card.Header>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Date de naissance</span>
                        <span>
                          {formatDate(details?.date_naissance)}
                          {details?.date_naissance && (
                            <small className="text-muted ms-2">
                              ({calculerAge(details.date_naissance)} ans)
                            </small>
                          )}
                        </span>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Lieu de naissance</span>
                        <span>{details?.lieu_naissance || 'Non renseigné'}</span>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Numéro sécurité sociale</span>
                        <span>{details?.num_securite_sociale || 'Non renseigné'}</span>
                      </div>
                    </ListGroup.Item>
                  </ListGroup>
                </Card>

                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <FaFileContract className="me-2" />
                      Informations professionnelles
                    </h6>
                  </Card.Header>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Numéro de licence</span>
                        <span>{details?.num_licence || 'Non renseigné'}</span>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Date d'embauche</span>
                        <span>{formatDate(details?.date_embauche)}</span>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Ancienneté</span>
                        <span>
                          {details?.date_embauche ? (
                            (() => {
                              const today = new Date();
                              const embauche = new Date(details.date_embauche);
                              const years = today.getFullYear() - embauche.getFullYear();
                              const months = today.getMonth() - embauche.getMonth();
                              const totalMonths = years * 12 + months;
                              const displayYears = Math.floor(totalMonths / 12);
                              const displayMonths = totalMonths % 12;
                              
                              return `${displayYears} an${displayYears > 1 ? 's' : ''} ${displayMonths} mois`;
                            })()
                          ) : 'Non calculable'}
                        </span>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Salaire de base</span>
                        <span>{details?.salaire_base ? `${details.salaire_base} €` : 'Non renseigné'}</span>
                      </div>
                    </ListGroup.Item>
                  </ListGroup>
                </Card>
              </Col>

              <Col md={8}>
                <Row>
                  <Col md={6}>
                    <Card className="border-0 shadow-sm mb-4">
                      <Card.Body>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 rounded p-3 me-3">
                            <FaPhone className="text-primary" size={24} />
                          </div>
                          <div>
                            <h6 className="mb-1">Téléphone</h6>
                            <p className="mb-0 fs-5">{details?.telephone || 'Non renseigné'}</p>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={6}>
                    <Card className="border-0 shadow-sm mb-4">
                      <Card.Body>
                        <div className="d-flex align-items-center">
                          <div className="bg-success bg-opacity-10 rounded p-3 me-3">
                            <FaEnvelope className="text-success" size={24} />
                          </div>
                          <div>
                            <h6 className="mb-1">Email</h6>
                            <p className="mb-0 fs-5">{details?.email || 'Non renseigné'}</p>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <FaMapMarkerAlt className="me-2" />
                      Adresse
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-1">
                      <strong>Adresse :</strong> {details?.adresse || 'Non renseignée'}
                    </p>
                    <p className="mb-1">
                      <strong>Code postal :</strong> {details?.code_postal || 'Non renseigné'}
                    </p>
                    <p className="mb-0">
                      <strong>Ville :</strong> {details?.ville || 'Non renseignée'}
                    </p>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      <FaHospital className="me-2" />
                      Centres associés
                    </h6>
                    <Badge bg="primary" pill>
                      {details?.centres?.length || 0} centre(s)
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    {details?.centres && details.centres.length > 0 ? (
                      <ListGroup variant="flush">
                        {details.centres.map((centre, index) => (
                          <ListGroup.Item key={index}>
                            <div className="d-flex align-items-center">
                              <div className="bg-info bg-opacity-10 rounded p-2 me-3">
                                <FaHospital className="text-info" />
                              </div>
                              <div>
                                <strong>{centre.nom}</strong>
                                <div className="text-muted small">
                                  {centre.adresse} • {centre.telephone}
                                </div>
                                <Badge bg="light" text="dark" className="mt-1">
                                  {centre.type}
                                </Badge>
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : (
                      <Alert variant="info">
                        Aucun centre associé à ce prestataire
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Modal.Body>
        </Tab>

        <Tab eventKey="statistiques" title="Statistiques">
          <Modal.Body>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">
                  <FaChartLine className="me-2" />
                  Activité du prestataire
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3} className="text-center mb-4">
                    <div className="border rounded p-3">
                      <h1 className="text-primary mb-1">156</h1>
                      <p className="text-muted mb-0">Consultations ce mois</p>
                      <small className="text-success">+12% vs mois dernier</small>
                    </div>
                  </Col>
                  
                  <Col md={3} className="text-center mb-4">
                    <div className="border rounded p-3">
                      <h1 className="text-success mb-1">42</h1>
                      <p className="text-muted mb-0">Prescriptions</p>
                      <small className="text-success">+8% vs mois dernier</small>
                    </div>
                  </Col>
                  
                  <Col md={3} className="text-center mb-4">
                    <div className="border rounded p-3">
                      <h1 className="text-warning mb-1">95%</h1>
                      <p className="text-muted mb-0">Taux de satisfaction</p>
                      <small className="text-success">+2 points</small>
                    </div>
                  </Col>
                  
                  <Col md={3} className="text-center mb-4">
                    <div className="border rounded p-3">
                      <h1 className="text-info mb-1">78h</h1>
                      <p className="text-muted mb-0">Temps travaillé</p>
                      <small className="text-warning">-3h vs mois dernier</small>
                    </div>
                  </Col>
                </Row>
                
                <h6 className="mb-3">Répartition par type de consultation</h6>
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Consultations générales</span>
                    <span>65%</span>
                  </div>
                  <ProgressBar now={65} variant="primary" />
                </div>
                
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Consultations spécialisées</span>
                    <span>25%</span>
                  </div>
                  <ProgressBar now={25} variant="success" />
                </div>
                
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Suivis</span>
                    <span>10%</span>
                  </div>
                  <ProgressBar now={10} variant="info" />
                </div>
              </Card.Body>
            </Card>
          </Modal.Body>
        </Tab>

        <Tab eventKey="notes" title="Notes">
          <Modal.Body>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Notes internes</h5>
              </Card.Header>
              <Card.Body>
                {details?.notes ? (
                  <div className="p-3 bg-light rounded">
                    {details.notes.split('\n').map((line, index) => (
                      <p key={index} className={index > 0 ? 'mt-2' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>
                ) : (
                  <Alert variant="info">
                    Aucune note interne pour ce prestataire
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Modal.Body>
        </Tab>
      </Tabs>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <FaTimes className="me-1" /> Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PrestataireDetailsModal;