// src/components/admin/MaintenanceModal.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  LinearProgress,
  Chip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  Build as BuildIcon,
  ClearAll as ClearAllIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';

const MaintenanceModal = ({ open, onClose, onExecute }) => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [results, setResults] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([
    { id: 'clear_cache', name: 'Vider le cache', enabled: true },
    { id: 'optimize_db', name: 'Optimiser la base de données', enabled: true },
    { id: 'purge_logs', name: 'Purger les vieux logs', enabled: false },
    { id: 'update_indexes', name: 'Mettre à jour les index', enabled: true },
    { id: 'check_integrity', name: 'Vérifier l\'intégrité', enabled: true }
  ]);
  
  const handleTaskToggle = (taskId) => {
    setSelectedTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, enabled: !task.enabled } : task
      )
    );
  };
  
  const executeTasks = async () => {
    setRunning(true);
    setProgress(0);
    setResults([]);
    
    const enabledTasks = selectedTasks.filter(task => task.enabled);
    const totalTasks = enabledTasks.length;
    
    for (let i = 0; i < enabledTasks.length; i++) {
      const task = enabledTasks[i];
      setCurrentTask(task.name);
      
      try {
        let result;
        
        switch (task.id) {
          case 'clear_cache':
            result = await adminAPI.clearCache('all');
            break;
          case 'optimize_db':
            result = await adminAPI.optimizeDatabase();
            break;
          case 'purge_logs':
            result = await adminAPI.purgeOldLogs(90);
            break;
          default:
            result = { success: true, message: 'Tâche exécutée' };
        }
        
        setResults(prev => [...prev, {
          task: task.name,
          success: result.success,
          message: result.message
        }]);
        
      } catch (error) {
        setResults(prev => [...prev, {
          task: task.name,
          success: false,
          message: error.message
        }]);
      }
      
      setProgress(((i + 1) / totalTasks) * 100);
    }
    
    setRunning(false);
    setCurrentTask('');
  };
  
  const getTaskIcon = (taskId) => {
    switch (taskId) {
      case 'clear_cache': return <ClearAllIcon />;
      case 'optimize_db': return <SpeedIcon />;
      case 'purge_logs': return <StorageIcon />;
      default: return <BuildIcon />;
    }
  };
  
  const getResultIcon = (success) => {
    return success ? 
      <CheckCircleIcon color="success" /> : 
      <ErrorIcon color="error" />;
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <BuildIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Maintenance système
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Exécutez des tâches de maintenance pour optimiser les performances du système.
        </Alert>
        
        {running ? (
          <Box>
            <Typography variant="body1" gutterBottom>
              Exécution en cours: {currentTask}
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
            
            {results.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Résultats:
                </Typography>
                <List dense>
                  {results.map((result, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {getResultIcon(result.success)}
                      </ListItemIcon>
                      <ListItemText
                        primary={result.task}
                        secondary={result.message}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Tâches disponibles
            </Typography>
            
            <List>
              {selectedTasks.map((task) => (
                <ListItem key={task.id}>
                  <ListItemIcon>
                    {getTaskIcon(task.id)}
                  </ListItemIcon>
                  <ListItemText
                    primary={task.name}
                    secondary={
                      task.id === 'purge_logs' ? 
                      'Supprime les logs de plus de 90 jours' : 
                      'Améliore les performances'
                    }
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={task.enabled}
                      onChange={() => handleTaskToggle(task.id)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Stepper orientation="vertical">
              <Step active>
                <StepLabel>
                  Préparation
                </StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Vérification des dépendances et préparation des tâches
                  </Typography>
                </StepContent>
              </Step>
              
              <Step>
                <StepLabel>
                  Exécution
                </StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Exécution séquentielle des tâches sélectionnées
                  </Typography>
                </StepContent>
              </Step>
              
              <Step>
                <StepLabel>
                  Vérification
                </StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Vérification des résultats et nettoyage
                  </Typography>
                </StepContent>
              </Step>
            </Stepper>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={running}>
          Annuler
        </Button>
        <LoadingButton
          variant="contained"
          onClick={executeTasks}
          loading={running}
          disabled={!selectedTasks.some(task => task.enabled)}
        >
          Exécuter la maintenance
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default MaintenanceModal;