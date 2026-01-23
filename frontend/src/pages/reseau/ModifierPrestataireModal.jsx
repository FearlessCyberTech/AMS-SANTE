// src/components/prestataires/ModifierPrestataireModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Tabs,
  Tab,
  Card,
  Badge,
  ListGroup,
  InputGroup
} from 'react-bootstrap';
import { FaSave, FaTimes, FaUpload, FaDownload, FaCalendarAlt, FaHospital, FaUserMd } from 'react-icons/fa';
import { prestatairesAPI, centresAPI } from '../../services/api';

const ModifierPrestataireModal = ({
  show,
  onHide,
  onSave,
  prestataire,
  centres,
  specialites
}) => {
  // États du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    titre: '',
    specialite: '',
    telephone: '',
    email: '',
    adresse: '',
    ville: '',
    code_postal: '',
    date_naissance: '',
    lieu_naissance: '',
    num_licence: '',
    num_securite_sociale: '',
    date_embauche: '',
    statut_contrat: 'CDI',
    salaire_base: '',
    centre_id: '',
    status: 'Actif',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('informations');
  const [prestataireCentres, setPrestataireCentres] = useState([]);
  const [availableCentres, setAvailableCentres] = useState([]);
  const [disponibilites, setDisponibilites] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [documents, setDocuments] = useState([]);
  
  // Initialisation des données
  useEffect(() => {
    if (prestataire && show) {
      // Remplir le formulaire avec les données du prestataire
      setFormData({
        nom: prestataire.nom || '',
        prenom: prestataire.prenom || '',
        titre: prestataire.titre || '',
        specialite: prestataire.specialite || '',
        telephone: prestataire.telephone || '',
        email: prestataire.email || '',
        adresse: prestataire.adresse || '',
        ville: prestataire.ville || '',
        code_postal: prestataire.code_postal || '',
        date_naissance: prestataire.date_naissance || '',
        lieu_naissance: prestataire.lieu_naissance || '',
        num_licence: prestataire.num_licence || '',
        num_securite_sociale: prestataire.num_securite_sociale || '',
        date_embauche: prestataire.date_embauche || '',
        statut_contrat: prestataire.statut_contrat || 'CDI',
        salaire_base: prestataire.salaire_base || '',
        centre_id: prestataire.centre_id || '',
        status: prestataire.status || 'Actif',
        notes: prestataire.notes || ''
      });
      
      // Charger les données associées
      chargerDonneesAssociees();
    }
  }, [prestataire, show]);

  // Chargement des données associées
  const chargerDonneesAssociees = async () => {
    if (!prestataire || !prestataire.id) return;
    
    try {
      // Charger les centres du prestataire
      const centresResponse = await prestatairesAPI.getCentresByPrestataire(prestataire.id);
      if (centresResponse.success) {
        setPrestataireCentres(centresResponse.centres || []);
      }
      
      // Charger les centres disponibles
      const allCentresResponse = await centresAPI.getAll();
      if (allCentresResponse.success) {
        // Filtrer les centres déjà associés
        const centresAssocies = centresResponse.centres || [];
        const centresDisponibles = allCentresResponse.centres.filter(centre => 
          !centresAssocies.some(c => c.id === centre.id)
        );
        setAvailableCentres(centresDisponibles);
      }
      
      // Charger les disponibilités
      const disponibilitesResponse = await prestatairesAPI.getDisponibilites(prestataire.id);
      if (disponibilitesResponse.success) {
        setDisponibilites(disponibilitesResponse.disponibilites || []);
      }
      
      // Charger les contrats
      const contratsResponse = await prestatairesAPI.getContrats(prestataire.id);
      if (contratsResponse.success) {
        setContrats(contratsResponse.contrats || []);
      }
      
      // Charger les documents
      const documentsResponse = await prestatairesAPI.getDocuments(prestataire.id);
      if (documentsResponse.success) {
        setDocuments(documentsResponse.documents || []);
      }
    } catch (error) {
      console.error('Erreur chargement données associées:', error);
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!formData.specialite) newErrors.specialite = 'La spécialité est requise';
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (formData.telephone && !/^[0-9+\s-]{10,}$/.test(formData.telephone)) {
      newErrors.telephone = 'Numéro de téléphone invalide';
    }
    
    if (formData.date_naissance) {
      const birthDate = new Date(formData.date_naissance);
      if (birthDate > new Date()) {
        newErrors.date_naissance = 'La date de naissance ne peut pas être dans le futur';
      }
    }
    
    if (formData.salaire_base && isNaN(parseFloat(formData.salaire_base))) {
      newErrors.salaire_base = 'Le salaire doit être un nombre valide';
    }
    
    return newErrors;
  };

  // Gestion de la soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gestion du changement des champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Associer un centre
  const handleAssocierCentre = async (centreId) => {
    if (!prestataire || !prestataire.id) return;
    
    try {
      const response = await prestatairesAPI.associerCentre(prestataire.id, centreId);
      if (response.success) {
        await chargerDonneesAssociees();
      }
    } catch (error) {
      console.error('Erreur association centre:', error);
    }
  };

  // Dissocier un centre
  const handleDissocierCentre = async (centreId) => {
    if (!prestataire || !prestataire.id) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir dissocier ce centre ?')) {
      try {
        const response = await prestatairesAPI.dissocierCentre(prestataire.id, centreId);
        if (response.success) {
          await chargerDonneesAssociees();
        }
      } catch (error) {
        console.error('Erreur dissociation centre:', error);
      }
    }
  };

  // Ajouter une disponibilité
  const handleAjouterDisponibilite = async () => {
    // Logique pour ajouter une disponibilité
    // Vous pouvez implémenter un sous-formulaire pour ajouter des disponibilités
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non renseignée';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Calculer l'âge
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

  return (
    <Modal show={show} onHide={onHide} size="xl" centered backdrop="static" scrollable>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>
          <FaUserMd className="me-2" />
          Modifier le prestataire : {prestataire?.nom} {prestataire?.prenom}
        </Modal.Title>
      </Modal.Header>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3 px-3"
      >
        <Tab eventKey="informations" title="Informations">
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row>
                <Col md={12} className="mb-4">
                  <Card className="border-0 shadow-sm">
                    <Card.Body className="p-4">
                      <h5 className="mb-4">
                        <FaUserMd className="me-2 text-primary" />
                        Informations personnelles
                      </h5>
                      
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Nom <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              type="text"
                              name="nom"
                              value={formData.nom}
                              onChange={handleChange}
                              isInvalid={!!errors.nom}
                              required
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.nom}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Prénom <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              type="text"
                              name="prenom"
                              value={formData.prenom}
                              onChange={handleChange}
                              isInvalid={!!errors.prenom}
                              required
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.prenom}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Titre</Form.Label>
                            <Form.Select
                              name="titre"
                              value={formData.titre}
                              onChange={handleChange}
                            >
                              <option value="">Sélectionner...</option>
                              <option value="Dr">Docteur</option>
                              <option value="Pr">Professeur</option>
                              <option value="M.">Monsieur</option>
                              <option value="Mme">Madame</option>
                              <option value="Mlle">Mademoiselle</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Date de naissance</Form.Label>
                            <Form.Control
                              type="date"
                              name="date_naissance"
                              value={formData.date_naissance}
                              onChange={handleChange}
                              isInvalid={!!errors.date_naissance}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.date_naissance}
                            </Form.Control.Feedback>
                            {formData.date_naissance && (
                              <Form.Text className="text-muted">
                                Âge : {calculerAge(formData.date_naissance)} ans
                              </Form.Text>
                            )}
                          </Form.Group>
                        </Col>
                        <Col md={8}>
                          <Form.Group className="mb-3">
                            <Form.Label>Lieu de naissance</Form.Label>
                            <Form.Control
                              type="text"
                              name="lieu_naissance"
                              value={formData.lieu_naissance}
                              onChange={handleChange}
                              placeholder="Ville, Pays"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={12} className="mb-4">
                  <Card className="border-0 shadow-sm">
                    <Card.Body className="p-4">
                      <h5 className="mb-4">
                        <FaUserMd className="me-2 text-primary" />
                        Informations professionnelles
                      </h5>
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Spécialité <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                              name="specialite"
                              value={formData.specialite}
                              onChange={handleChange}
                              isInvalid={!!errors.specialite}
                              required
                            >
                              <option value="">Sélectionner...</option>
                              {specialites.map((spec, index) => (
                                <option key={index} value={spec}>{spec}</option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {errors.specialite}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Numéro de licence</Form.Label>
                            <Form.Control
                              type="text"
                              name="num_licence"
                              value={formData.num_licence}
                              onChange={handleChange}
                              placeholder="Numéro d'autorisation d'exercice"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Numéro sécurité sociale</Form.Label>
                            <Form.Control
                              type="text"
                              name="num_securite_sociale"
                              value={formData.num_securite_sociale}
                              onChange={handleChange}
                              placeholder="1 23 45 67 891 234"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Date d'embauche</Form.Label>
                            <Form.Control
                              type="date"
                              name="date_embauche"
                              value={formData.date_embauche}
                              onChange={handleChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Statut du contrat</Form.Label>
                            <Form.Select
                              name="statut_contrat"
                              value={formData.statut_contrat}
                              onChange={handleChange}
                            >
                              <option value="CDI">CDI</option>
                              <option value="CDD">CDD</option>
                              <option value="Interim">Intérim</option>
                              <option value="Consultant">Consultant</option>
                              <option value="Stagiaire">Stagiaire</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Salaire de base (€)</Form.Label>
                            <InputGroup>
                              <Form.Control
                                type="number"
                                name="salaire_base"
                                value={formData.salaire_base}
                                onChange={handleChange}
                                isInvalid={!!errors.salaire_base}
                                min="0"
                                step="0.01"
                              />
                              <InputGroup.Text>€</InputGroup.Text>
                            </InputGroup>
                            <Form.Control.Feedback type="invalid">
                              {errors.salaire_base}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Statut <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                              name="status"
                              value={formData.status}
                              onChange={handleChange}
                              required
                            >
                              <option value="Actif">Actif</option>
                              <option value="Inactif">Inactif</option>
                              <option value="En congé">En congé</option>
                              <option value="En formation">En formation</option>
                              <option value="Suspendu">Suspendu</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Centre principal</Form.Label>
                            <Form.Select
                              name="centre_id"
                              value={formData.centre_id}
                              onChange={handleChange}
                            >
                              <option value="">Sélectionner un centre...</option>
                              {centres.map((centre) => (
                                <option key={centre.id} value={centre.id}>
                                  {centre.nom}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={12} className="mb-4">
                  <Card className="border-0 shadow-sm">
                    <Card.Body className="p-4">
                      <h5 className="mb-4">
                        <FaUserMd className="me-2 text-primary" />
                        Coordonnées
                      </h5>
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Téléphone</Form.Label>
                            <Form.Control
                              type="tel"
                              name="telephone"
                              value={formData.telephone}
                              onChange={handleChange}
                              isInvalid={!!errors.telephone}
                              placeholder="+33 1 23 45 67 89"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.telephone}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              isInvalid={!!errors.email}
                              placeholder="exemple@email.com"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.email}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label>Adresse</Form.Label>
                        <Form.Control
                          type="text"
                          name="adresse"
                          value={formData.adresse}
                          onChange={handleChange}
                          placeholder="Adresse complète"
                        />
                      </Form.Group>

                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Code postal</Form.Label>
                            <Form.Control
                              type="text"
                              name="code_postal"
                              value={formData.code_postal}
                              onChange={handleChange}
                              placeholder="75000"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={8}>
                          <Form.Group className="mb-3">
                            <Form.Label>Ville</Form.Label>
                            <Form.Control
                              type="text"
                              name="ville"
                              value={formData.ville}
                              onChange={handleChange}
                              placeholder="Paris"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body className="p-4">
                      <h5 className="mb-4">
                        <FaUserMd className="me-2 text-primary" />
                        Notes et commentaires
                      </h5>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Notes internes</Form.Label>
                        <Form.Control
                          as="textarea"
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Notes sur le prestataire..."
                        />
                        <Form.Text className="text-muted">
                          Ces notes sont visibles uniquement par les administrateurs
                        </Form.Text>
                      </Form.Group>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Modal.Body>
            
            <Modal.Footer className="bg-light">
              <Button variant="secondary" onClick={onHide} disabled={loading}>
                <FaTimes className="me-1" /> Annuler
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FaSave className="me-1" /> Enregistrer les modifications
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Tab>

        <Tab eventKey="centres" title="Centres associés">
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">
                      <FaHospital className="me-2 text-primary" />
                      Centres déjà associés
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {prestataireCentres.length === 0 ? (
                      <div className="text-center py-5">
                        <FaHospital size={48} className="text-muted mb-3" />
                        <p className="text-muted">Aucun centre associé</p>
                      </div>
                    ) : (
                      <ListGroup variant="flush">
                        {prestataireCentres.map(centre => (
                          <ListGroup.Item
                            key={centre.id}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <strong>{centre.nom}</strong>
                              <div className="text-muted small">
                                {centre.type} • {centre.adresse}
                              </div>
                              {centre.telephone && (
                                <div className="small">
                                  <i className="fas fa-phone me-1"></i>
                                  {centre.telephone}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDissocierCentre(centre.id)}
                              title="Dissocier"
                            >
                              <FaTimes />
                            </Button>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">
                      <FaHospital className="me-2 text-success" />
                      Centres disponibles
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {availableCentres.length === 0 ? (
                      <div className="text-center py-5">
                        <FaHospital size={48} className="text-muted mb-3" />
                        <p className="text-muted">Tous les centres sont déjà associés</p>
                      </div>
                    ) : (
                      <ListGroup variant="flush">
                        {availableCentres.map(centre => (
                          <ListGroup.Item
                            key={centre.id}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <strong>{centre.nom}</strong>
                              <div className="text-muted small">
                                {centre.type} • {centre.adresse}
                              </div>
                            </div>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleAssocierCentre(centre.id)}
                              title="Associer"
                            >
                              <FaSave />
                            </Button>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Modal.Body>
        </Tab>

        <Tab eventKey="disponibilites" title="Disponibilités">
          <Modal.Body>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaCalendarAlt className="me-2 text-primary" />
                  Calendrier de disponibilités
                </h5>
                <Button variant="primary" size="sm" onClick={handleAjouterDisponibilite}>
                  <FaPlus className="me-1" /> Ajouter
                </Button>
              </Card.Header>
              <Card.Body>
                {disponibilites.length === 0 ? (
                  <div className="text-center py-5">
                    <FaCalendarAlt size={48} className="text-muted mb-3" />
                    <p className="text-muted">Aucune disponibilité programmée</p>
                    <Button variant="outline-primary" onClick={handleAjouterDisponibilite}>
                      Ajouter une disponibilité
                    </Button>
                  </div>
                ) : (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Jour</th>
                        <th>Horaires</th>
                        <th>Type</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disponibilites.map(dispo => (
                        <tr key={dispo.id}>
                          <td>
                            {new Date(dispo.date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </td>
                          <td>
                            {dispo.heure_debut} - {dispo.heure_fin}
                          </td>
                          <td>
                            <Badge bg={dispo.type === 'consultation' ? 'info' : 'warning'}>
                              {dispo.type}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={dispo.statut === 'libre' ? 'success' : 'secondary'}>
                              {dispo.statut}
                            </Badge>
                          </td>
                          <td>
                            <Button variant="outline-warning" size="sm" className="me-1">
                              <FaEdit />
                            </Button>
                            <Button variant="outline-danger" size="sm">
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Modal.Body>
        </Tab>

        <Tab eventKey="documents" title="Documents">
          <Modal.Body>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaFile className="me-2 text-primary" />
                  Documents du prestataire
                </h5>
                <Button variant="primary" size="sm">
                  <FaUpload className="me-1" /> Uploader
                </Button>
              </Card.Header>
              <Card.Body>
                {documents.length === 0 ? (
                  <div className="text-center py-5">
                    <FaFile size={48} className="text-muted mb-3" />
                    <p className="text-muted">Aucun document uploadé</p>
                  </div>
                ) : (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Nom du document</th>
                        <th>Type</th>
                        <th>Date d'upload</th>
                        <th>Taille</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map(doc => (
                        <tr key={doc.id}>
                          <td>{doc.nom}</td>
                          <td>
                            <Badge bg="info">{doc.type}</Badge>
                          </td>
                          <td>{formatDate(doc.date_upload)}</td>
                          <td>{doc.taille}</td>
                          <td>
                            <Button variant="outline-primary" size="sm" className="me-1">
                              <FaDownload />
                            </Button>
                            <Button variant="outline-danger" size="sm">
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Modal.Body>
        </Tab>

        <Tab eventKey="contrats" title="Contrats">
          <Modal.Body>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">
                  <FaFileContract className="me-2 text-primary" />
                  Contrats
                </h5>
              </Card.Header>
              <Card.Body>
                {contrats.length === 0 ? (
                  <div className="text-center py-5">
                    <FaFileContract size={48} className="text-muted mb-3" />
                    <p className="text-muted">Aucun contrat enregistré</p>
                  </div>
                ) : (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Numéro</th>
                        <th>Type</th>
                        <th>Date début</th>
                        <th>Date fin</th>
                        <th>Statut</th>
                        <th>Montant</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contrats.map(contrat => (
                        <tr key={contrat.id}>
                          <td>{contrat.numero}</td>
                          <td>
                            <Badge bg="secondary">{contrat.type}</Badge>
                          </td>
                          <td>{formatDate(contrat.date_debut)}</td>
                          <td>{formatDate(contrat.date_fin)}</td>
                          <td>
                            <Badge bg={contrat.statut === 'actif' ? 'success' : 'warning'}>
                              {contrat.statut}
                            </Badge>
                          </td>
                          <td>{contrat.montant} €</td>
                          <td>
                            <Button variant="outline-primary" size="sm" className="me-1">
                              <FaEye />
                            </Button>
                            <Button variant="outline-warning" size="sm" className="me-1">
                              <FaEdit />
                            </Button>
                            <Button variant="outline-danger" size="sm">
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Modal.Body>
        </Tab>
      </Tabs>
    </Modal>
  );
};

// Import manquant
import { FaPlus, FaTrash, FaFile, FaFileContract, FaEye } from 'react-icons/fa';

export default ModifierPrestataireModal;