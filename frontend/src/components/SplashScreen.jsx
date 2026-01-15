import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SplashScreen.css';

// Icônes médicales (vous pouvez utiliser react-icons ou créer vos propres SVG)
const MedicalIcons = {
  Stethoscope: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 4v12a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V4M8 2v2M16 2v2M10 8h4" />
      <circle cx="18" cy="11" r="3" />
      <path d="M21 11a3 3 0 0 1-3 3" />
    </svg>
  ),
  Heartbeat: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  Shield: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Users: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  FileText: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Calendar: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  CreditCard: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  Database: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  )
};

const SplashScreen = ({ onFinish }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [particles, setParticles] = useState([]);
  const [medicalSymbols, setMedicalSymbols] = useState([]);

  // Couleurs professionnelles pour l'application médicale
  const colors = {
    primary: "#0a6cbd", // Bleu médical
    secondary: "#10b981", // Vert
    accent: "#8b5cf6", // Violet
    success: "#059669", // Vert foncé
    warning: "#f59e0b", // Orange
    danger: "#dc2626" // Rouge
  };

  // Générer des particules flottantes
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 30; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 5 + 2,
          duration: Math.random() * 5 + 3,
          delay: Math.random() * 3,
          color: i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.accent
        });
      }
      setParticles(newParticles);
    };

    // Générer des symboles médicaux flottants
    const generateMedicalSymbols = () => {
      const symbols = ['Stethoscope', 'Heartbeat', 'Shield', 'Users', 'FileText', 'Calendar', 'CreditCard'];
      const newSymbols = [];
      for (let i = 0; i < 12; i++) {
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        newSymbols.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 24 + 16,
          duration: Math.random() * 8 + 5,
          delay: Math.random() * 4,
          opacity: Math.random() * 0.3 + 0.1,
          symbol: symbol
        });
      }
      setMedicalSymbols(newSymbols);
    };

    generateParticles();
    generateMedicalSymbols();
  }, []);

  // Étapes d'initialisation adaptées à AMS Santé
  useEffect(() => {
    const steps = [
      { 
        duration: 1500, 
        icon: MedicalIcons.Database, 
        text: "Initialisation de la base patients", 
        color: colors.primary,
        description: "Chargement des dossiers médicaux sécurisés"
      },
      { 
        duration: 1600, 
        icon: MedicalIcons.Calendar, 
        text: "Module de consultations", 
        color: colors.secondary,
        description: "Configuration des agendas médicaux"
      },
      { 
        duration: 1400, 
        icon: MedicalIcons.FileText, 
        text: "Prescriptions électroniques", 
        color: colors.accent,
        description: "Chargement des modèles de prescriptions"
      },
      { 
        duration: 1700, 
        icon: MedicalIcons.Shield, 
        text: "Sécurité des données", 
        color: colors.success,
        description: "Cryptage conforme RGPD et HIPAA"
      },
      { 
        duration: 1300, 
        icon: MedicalIcons.CreditCard, 
        text: "Facturation électronique", 
        color: colors.warning,
        description: "Connexion aux partenaires payeurs"
      },
      { 
        duration: 1200, 
        icon: MedicalIcons.Users, 
        text: "Profils utilisateurs", 
        color: colors.danger,
        description: "Chargement des droits d'accès"
      }
    ];

    let currentIndex = 0;
    const startTime = Date.now();
    
    const showNextStep = () => {
      if (currentIndex < steps.length) {
        setCurrentStep(currentIndex);
        const step = steps[currentIndex];
        setTimeout(showNextStep, step.duration);
        currentIndex++;
      } else {
        const elapsedTime = Date.now() - startTime;
        const minDisplayTime = 6500; // Minimum 6.5 secondes d'affichage
        const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
        
        setTimeout(() => {
          setTimeout(onFinish, 800);
        }, remainingTime);
      }
    };

    showNextStep();
  }, [onFinish]);

  const steps = [
    { icon: MedicalIcons.Database, text: "Initialisation de la base patients", color: colors.primary, description: "Chargement des dossiers médicaux sécurisés" },
    { icon: MedicalIcons.Calendar, text: "Module de consultations", color: colors.secondary, description: "Configuration des agendas médicaux" },
    { icon: MedicalIcons.FileText, text: "Prescriptions électroniques", color: colors.accent, description: "Chargement des modèles de prescriptions" },
    { icon: MedicalIcons.Shield, text: "Sécurité des données", color: colors.success, description: "Cryptage conforme RGPD et HIPAA" },
    { icon: MedicalIcons.CreditCard, text: "Facturation électronique", color: colors.warning, description: "Connexion aux partenaires payeurs" },
    { icon: MedicalIcons.Users, text: "Profils utilisateurs", color: colors.danger, description: "Chargement des droits d'accès" }
  ];

  const IconComponent = steps[currentStep]?.icon;
  const currentColor = steps[currentStep]?.color || colors.primary;

  return (
    <motion.div
      className="splash-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Particules médicales en arrière-plan */}
      <div className="medical-background">
        {particles.map((particle) => (
          <motion.div
            key={`particle-${particle.id}`}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: '50%'
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.2, 0.6, 0.2]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Symboles médicaux flottants */}
        {medicalSymbols.map((symbol) => {
          const SymbolComponent = MedicalIcons[symbol.symbol];
          return (
            <motion.div
              key={`symbol-${symbol.id}`}
              className="medical-symbol"
              style={{
                left: `${symbol.x}%`,
                top: `${symbol.y}%`,
                width: symbol.size,
                height: symbol.size,
                color: currentColor,
                opacity: symbol.opacity,
                position: 'absolute'
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: symbol.duration,
                delay: symbol.delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <SymbolComponent />
            </motion.div>
          );
        })}
      </div>

      {/* Contenu principal */}
      <div className="splash-content">
        {/* Logo AMS Santé avec animation */}
        <motion.div
          className="logo-container"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: 1, 
            rotate: 0,
            boxShadow: [
              `0 0 20px ${currentColor}40`,
              `0 0 40px ${currentColor}60`,
              `0 0 20px ${currentColor}40`
            ]
          }}
          transition={{ 
            type: "spring", 
            damping: 15, 
            stiffness: 100,
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          <div className="logo-circle">
            <motion.div
              className="logo-pulse"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div className="logo-inner">
              <MedicalIcons.Stethoscope />
            </div>
            <motion.div 
              className="logo-ring"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </motion.div>

        {/* Titre de l'application */}
        <motion.div
          className="title-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.h1
            className="app-title"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              backgroundSize: ['200% 200%', '200% 200%', '200% 200%']
            }}
            transition={{ 
              backgroundPosition: {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            AMS Santé
          </motion.h1>
          <motion.p
            className="app-subtitle"
            animate={{ 
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Digitalisation du parcours de soin • Centre pluridisciplinaire
          </motion.p>
        </motion.div>

        {/* Barre de progression linéaire */}
        <motion.div 
          className="linear-progress-container"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "80%" }}
          transition={{ delay: 0.5 }}
        >
          <div className="progress-track">
            <motion.div 
              className="progress-bar"
              style={{ backgroundColor: currentColor }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 8, ease: "linear" }}
            />
          </div>
          <div className="progress-text">
            <span>Chargement du système...</span>
            <motion.span
              className="progress-percent"
              animate={{ 
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {Math.min(Math.floor((currentStep + 1) / steps.length * 100), 99)}%
            </motion.span>
          </div>
        </motion.div>

        {/* Étape d'initialisation actuelle */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="step-content"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            {IconComponent && (
              <motion.div
                className="step-icon-container"
                animate={{ 
                  color: currentColor,
                  scale: [1, 1.15, 1]
                }}
                transition={{ 
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                <IconComponent />
                <motion.div
                  className="icon-glow"
                  style={{ backgroundColor: currentColor }}
                  animate={{
                    opacity: [0.2, 0.5, 0.2],
                    scale: [1, 1.4, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            )}
            <motion.h3 
              className="step-text"
              style={{ color: currentColor }}
            >
              {steps[currentStep]?.text}
            </motion.h3>
            <motion.p 
              className="step-description"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.2 }}
            >
              {steps[currentStep]?.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Indicateurs de progression */}
        <div className="progress-indicators">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              className={`progress-indicator ${index <= currentStep ? 'active' : ''}`}
              style={{ 
                backgroundColor: index <= currentStep ? currentColor : 'rgba(255,255,255,0.1)'
              }}
              animate={{
                scale: index === currentStep ? [1, 1.3, 1] : 1
              }}
              transition={{
                scale: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            />
          ))}
        </div>

        {/* Informations de version et sécurité */}
        <motion.div
          className="system-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.8 }}
        >
          <div className="system-item">
            <MedicalIcons.Shield />
            <span>Sécurité: Conforme RGPD & HIPAA</span>
          </div>
          <div className="system-item">
            <span>Version: 2.1.0</span>
          </div>
          <div className="system-item">
            <span>© 2025 AMS INSURANCE. Tous droits réservés.</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;