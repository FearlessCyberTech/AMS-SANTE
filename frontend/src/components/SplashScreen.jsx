import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SplashScreen.css';
import HealthCenterSoft from '../assets/HealthCenterSoft.png';

// Icônes médicales
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
  Pill: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.5 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6.5" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M8 10h8" />
      <circle cx="18" cy="18" r="3" />
      <path d="m21 15-3 3" />
    </svg>
  )
};

const SplashScreen = ({ onFinish }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [particles, setParticles] = useState([]);
  const [medicalSymbols, setMedicalSymbols] = useState([]);
  const [logoError, setLogoError] = useState(false); // État pour gérer les erreurs du logo

  // Couleurs professionnelles pour SaniCare Centre
  const colors = {
    primary: "#0d6efd", // Bleu médical
    secondary: "#20c997", // Vert turquoise
    accent: "#6f42c1", // Violet
    success: "#198754", // Vert foncé
    warning: "#fd7e14", // Orange
    lightBlue: "#0dcaf0" // Bleu clair
  };

  // Durée totale fixée à 5 secondes (5000ms)
  const TOTAL_DURATION = 5000;
  const STEP_COUNT = 4; // Réduit à 4 étapes pour 5 secondes

  // Générer des particules flottantes
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 1,
          duration: Math.random() * 4 + 2,
          delay: Math.random() * 2,
          color: i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.lightBlue
        });
      }
      setParticles(newParticles);
    };

    const generateMedicalSymbols = () => {
      const symbols = ['Stethoscope', 'Heartbeat', 'Shield', 'Pill', 'Calendar'];
      const newSymbols = [];
      for (let i = 0; i < 8; i++) {
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        newSymbols.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 20 + 12,
          duration: Math.random() * 6 + 4,
          delay: Math.random() * 3,
          opacity: Math.random() * 0.2 + 0.1,
          symbol: symbol
        });
      }
      setMedicalSymbols(newSymbols);
    };

    generateParticles();
    generateMedicalSymbols();
  }, []);

  // Étapes d'initialisation adaptées pour 5 secondes
  useEffect(() => {
    const steps = [
      { 
        duration: 800, 
        icon: MedicalIcons.Shield, 
        text: "Sécurité des données", 
        color: colors.primary,
        description: "Cryptage conforme RGPD"
      },
      { 
        duration: 800, 
        icon: MedicalIcons.Calendar, 
        text: "Gestion des rendez-vous", 
        color: colors.secondary,
        description: "Optimisation des agendas"
      },
      { 
        duration: 800, 
        icon: MedicalIcons.FileText, 
        text: "Dossiers patients", 
        color: colors.accent,
        description: "Chargement des historiques"
      },
      { 
        duration: 800, 
        icon: MedicalIcons.Users, 
        text: "Profils personnalisés", 
        color: colors.success,
        description: "Configuration des accès"
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
        const remainingTime = Math.max(0, TOTAL_DURATION - elapsedTime);
        
        setTimeout(onFinish, remainingTime);
      }
    };

    showNextStep();
  }, [onFinish]);

  const steps = [
    { icon: MedicalIcons.Shield, text: "Sécurité des données", color: colors.primary, description: "Cryptage conforme RGPD" },
    { icon: MedicalIcons.Calendar, text: "Gestion des rendez-vous", color: colors.secondary, description: "Optimisation des agendas" },
    { icon: MedicalIcons.FileText, text: "Dossiers patients", color: colors.accent, description: "Chargement des historiques" },
    { icon: MedicalIcons.Users, text: "Profils personnalisés", color: colors.success, description: "Configuration des accès" }
  ];

  const IconComponent = steps[currentStep]?.icon;
  const currentColor = steps[currentStep]?.color || colors.primary;

  return (
    <motion.div
      className="splash-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
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
              y: [0, -30, 0],
              x: [0, Math.random() * 15 - 7.5, 0],
              opacity: [0.1, 0.5, 0.1]
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
                y: [0, -20, 0],
                rotate: [0, 3, -3, 0]
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
        {/* Logo SaniCare Centre */}
        <motion.div
          className="logo-container"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            filter: [
              'drop-shadow(0 0 10px rgba(13, 110, 253, 0.3))',
              'drop-shadow(0 0 20px rgba(13, 110, 253, 0.5))',
              'drop-shadow(0 0 10px rgba(13, 110, 253, 0.3))'
            ]
          }}
          transition={{ 
            type: "spring", 
            damping: 12, 
            stiffness: 100,
            filter: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          <motion.div
            className="logo-pulse"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.div
            className="logo-inner"
            animate={{
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <img 
              src={HealthCenterSoft} 
              alt="SaniCare Centre Logo"
              className="company-logo"
              onError={() => setLogoError(true)}
            />
          </motion.div>
          
          <motion.div 
            className="logo-ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>

        {/* Titre de l'application */}
        <motion.div
          className="title-container"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.h1
            className="app-title"
            style={{
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.primary})`,
              backgroundSize: '200% auto'
            }}
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{ 
              backgroundPosition: {
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            SaniCare Centre
          </motion.h1>
          <motion.p
            className="app-subtitle"
            animate={{ 
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Excellence Médicale • Soins Personnalisés
          </motion.p>
        </motion.div>

        {/* Barre de progression linéaire optimisée pour 5 secondes */}
        <motion.div 
          className="linear-progress-container"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "70%" }}
          transition={{ delay: 0.4 }}
        >
          <div className="progress-track">
            <motion.div 
              className="progress-bar"
              style={{ backgroundColor: currentColor }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: TOTAL_DURATION / 1000, ease: "linear" }}
            />
          </div>
          <div className="progress-text">
            <span>Initialisation du système...</span>
            <motion.span
              className="progress-percent"
              animate={{ 
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {Math.min(Math.floor(((currentStep + 1) / STEP_COUNT) * 100), 99)}%
            </motion.span>
          </div>
        </motion.div>

        {/* Étape d'initialisation actuelle */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="step-content"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.3 }}
          >
            {IconComponent && (
              <motion.div
                className="step-icon-container"
                animate={{ 
                  color: currentColor,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  scale: {
                    duration: 1.5,
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
                    opacity: [0.1, 0.3, 0.1],
                    scale: [1, 1.3, 1]
                  }}
                  transition={{
                    duration: 1.5,
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
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.1 }}
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
                scale: index === currentStep ? [1, 1.2, 1] : 1
              }}
              transition={{
                scale: {
                  duration: 1,
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
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.6 }}
        >
          <div className="system-item">
            <MedicalIcons.Shield />
            <span>Sécurité: Conforme RGPD & HIPAA</span>
          </div>
          <div className="system-item">
            <span>Version: 2.1.0</span>
          </div>
          <div className="system-item">
            <span>© 2024 SaniCare Centre. Tous droits réservés.</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;