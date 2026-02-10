import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, HeartPulse, Activity, Zap, 
  CheckCircle, Sparkles, Target, Cpu,
  Database, Cloud, Lock, Users
} from 'lucide-react';
import './SplashScreen.css';

// Import du logo SaniCare
import SaniCareLogo from '../assets/SaniCareOnlyLogo.png';

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const steps = [
    { icon: Shield, text: 'Initialisation de la sécurité', duration: 800 },
    { icon: Database, text: 'Chargement de la base de données', duration: 1000 },
    { icon: Lock, text: 'Vérification des certificats', duration: 700 },
    { icon: Users, text: 'Connexion au réseau SaniCare', duration: 900 },
    { icon: Cloud, text: 'Synchronisation des données', duration: 600 },
    { icon: CheckCircle, text: 'Système prêt', duration: 500 }
  ];

  // Animation de progression
  useEffect(() => {
    let progressInterval;
    
    if (!isComplete) {
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsComplete(true);
            return 100;
          }
          return prev + 0.5;
        });
      }, 20);
    }

    return () => clearInterval(progressInterval);
  }, [isComplete]);

  // Gestion des étapes
  useEffect(() => {
    if (progress >= 100 && !isComplete) {
      setIsComplete(true);
      setTimeout(() => onComplete(), 500);
    }
    
    // Mettre à jour l'étape en fonction de la progression
    const stepIndex = Math.floor((progress / 100) * steps.length);
    if (stepIndex !== currentStep && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [progress, isComplete, currentStep, steps.length, onComplete]);

  return (
    <motion.div 
      className="splash-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Fond animé */}
      <div className="splash-background">
        <div className="splash-particles">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="splash-particle"
              initial={{ 
                x: Math.random() * 100 + 'vw',
                y: Math.random() * 100 + 'vh',
                scale: 0
              }}
              animate={{ 
                x: Math.random() * 100 + 'vw',
                y: Math.random() * 100 + 'vh',
                scale: [0, 1, 0],
                opacity: [0, 0.8, 0]
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        {/* Orbes de lumière */}
        <div className="splash-orbs">
          <motion.div 
            className="splash-orb orb-1"
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="splash-orb orb-2"
            animate={{
              x: [0, -40, 0],
              y: [0, 30, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          <motion.div 
            className="splash-orb orb-3"
            animate={{
              x: [0, 50, 0],
              y: [0, 20, 0],
              scale: [0.8, 1.1, 0.8],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="splash-content">
        {/* Logo avec animation */}
        <motion.div 
          className="splash-logo-container"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2
          }}
        >
          <div className="logo-glow-ring"></div>
          <div className="logo-pulse-ring"></div>
          <div className="logo-spin-ring"></div>
          
          <motion.div 
            className="logo-core"
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <img 
              src={SaniCareLogo} 
              alt="SaniCare" 
              className="splash-logo"
            />
          </motion.div>

          {/* Cercles orbitaux */}
          <motion.div 
            className="orbital-circle orbital-1"
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            <Shield className="orbital-icon" />
          </motion.div>
          <motion.div 
            className="orbital-circle orbital-2"
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <HeartPulse className="orbital-icon" />
          </motion.div>
          <motion.div 
            className="orbital-circle orbital-3"
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          >
            <Activity className="orbital-icon" />
          </motion.div>
        </motion.div>

        {/* Texte du logo */}
        <motion.div 
          className="splash-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="sanicare-splash-title">
            Sani<span className="care-gradient">Care</span>
          </h1>
          <p className="splash-subtitle">Assurance Santé Intelligente</p>
          
          <div className="splash-badges">
            <motion.div 
              className="splash-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Zap size={12} />
              <span>Powered by AI</span>
            </motion.div>
            <motion.div 
              className="splash-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Lock size={12} />
              <span>Secure</span>
            </motion.div>
            <motion.div 
              className="splash-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Target size={12} />
              <span>Premium</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Liste des étapes de chargement */}
        <div className="loading-steps">
          <AnimatePresence mode="wait">
            {steps.map((step, index) => (
              index === currentStep && (
                <motion.div
                  key={index}
                  className="loading-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="step-icon">
                    <step.icon className="step-icon-svg" />
                    {index === currentStep && (
                      <motion.div 
                        className="step-pulse"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1.5 }}
                        transition={{ 
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                  </div>
                  <div className="step-content">
                    <span className="step-text">{step.text}</span>
                    <div className="step-progress">
                      <motion.div 
                        className="step-progress-bar"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ 
                          duration: step.duration / 1000,
                          ease: "linear"
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>

        {/* Barre de progression principale */}
        <div className="splash-progress-container">
          <div className="progress-labels">
            <span className="progress-text">Initialisation du système</span>
            <span className="progress-percent">{Math.round(progress)}%</span>
          </div>
          <div className="splash-progress-bar">
            <motion.div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
              initial={{ width: 0 }}
            />
            <div className="progress-glow"></div>
          </div>
          
          {/* Indicateurs de progression */}
          <div className="progress-indicators">
            {[0, 25, 50, 75, 100].map((value) => (
              <div 
                key={value} 
                className={`progress-indicator ${progress >= value ? 'active' : ''}`}
              >
                <div className="indicator-dot"></div>
                <span className="indicator-label">{value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Statistiques de chargement */}
        <div className="splash-stats">
          <div className="splash-stat">
            <div className="stat-icon">
              <Cpu className="stat-icon-svg" />
            </div>
            <div className="stat-content">
              <motion.span 
                className="stat-value"
                initial={{ number: 0 }}
                animate={{ number: 100 }}
                transition={{ duration: 2 }}
              >
                {Math.floor(progress)}
              </motion.span>
              <span className="stat-label">Performance</span>
            </div>
          </div>
          
          <div className="splash-stat">
            <div className="stat-icon">
              <Database className="stat-icon-svg" />
            </div>
            <div className="stat-content">
              <motion.span 
                className="stat-value"
                initial={{ number: 0 }}
                animate={{ number: 99.9 }}
                transition={{ duration: 2.5 }}
              >
                {progress >= 50 ? '99.9' : Math.floor(progress * 0.5)}%
              </motion.span>
              <span className="stat-label">Sécurité</span>
            </div>
          </div>
          
          <div className="splash-stat">
            <div className="stat-icon">
              <Cloud className="stat-icon-svg" />
            </div>
            <div className="stat-content">
              <motion.span 
                className="stat-value"
                initial={{ number: 0 }}
                animate={{ number: 100 }}
                transition={{ duration: 3 }}
              >
                {progress >= 75 ? '100%' : Math.floor(progress * 0.75)}%
              </motion.span>
              <span className="stat-label">Connectivité</span>
            </div>
          </div>
        </div>

        {/* Message de bienvenue */}
        <AnimatePresence>
          {progress >= 95 && (
            <motion.div 
              className="welcome-message"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="welcome-content">
                <Sparkles className="welcome-icon" />
                <div>
                  <h4>Bienvenue sur SaniCare</h4>
                  <p>Système d'assurance santé prêt à l'emploi</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Copyright */}
        <div className="splash-copyright">
          <span>© 2024 SaniCare Assurance • v4.0 • Système certifié</span>
        </div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;