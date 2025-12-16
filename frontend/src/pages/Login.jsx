import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SplashScreen from '../components/SplashScreen';
import LoginForm from '../components/LoginForm';
import '../services/i18n';
import './Login.css';

const Login = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Rediriger vers le dashboard si déjà connecté
    if (user && !showSplash) {
      navigate('/dashboard');
    }
  }, [user, navigate, showSplash]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleLogin = async (username, password) => {
    setIsLoading(true);
    setLoginError('');

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" onFinish={handleSplashFinish} />
        ) : (
          <motion.div
            key="login"
            className="login-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            
            
            <div className="login-content">
              <LoginForm 
                onLogin={handleLogin} 
                loading={isLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;