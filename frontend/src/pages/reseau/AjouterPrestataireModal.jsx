// src/components/prestataires/AjouterPrestataireModal.js
import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { FaSave, FaTimes } from 'react-icons/fa';

const AjouterPrestataireModal = ({ show, onHide, onSave, centres, specialites }) => {
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
    num_licence: '',
    num_securite_sociale: '',
    date_embauche: '',
    statut_contrat: 'CDI',
    centre_id: '',
    status: 'Actif'
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        prenom: '',
        titre: '',
        specialite: '',
        telephone: '',
        email: '',
        adresse: '',
        ville: '',
        code_postal: '',
        num_licence: '',
        num_securite_sociale: '',
        date_embauche: '',
        statut_contrat: 'CDI',
        centre_id: '',
        status: 'Actif'
      });
      setErrors({});
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

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaSave className="me-2" />
          Nouveau Prestataire
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
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
            <Col md={6}>
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
          </Row>

          <Row>
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
            <Col md={8}>
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
          </Row>

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

          <Row>
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
          </Row>

          <Row>
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
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Centre de santé</Form.Label>
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
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Statut</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                  <option value="En congé">En congé</option>
                  <option value="En formation">En formation</option>
                </Form.Select>
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
        </Modal.Body>
        <Modal.Footer>
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
                <FaSave className="me-1" /> Enregistrer
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AjouterPrestataireModal;