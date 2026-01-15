import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestAuth = () => {
  const { user, loading, isAuthenticated, login, logout } = useAuth();

  const handleTestLogin = async () => {
    try {
      await login('test', 'testpassword');
    } catch (error) {
      alert('Erreur de connexion: ' + error.message);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test d'authentification</h1>
      <p>Authentifié: {isAuthenticated() ? 'Oui' : 'Non'}</p>
      <p>Utilisateur: {user ? JSON.stringify(user) : 'Aucun'}</p>
      <button onClick={handleTestLogin}>Tester la connexion</button>
      <button onClick={logout} style={{ marginLeft: '10px' }}>Déconnexion</button>
    </div>
  );
};

export default TestAuth;