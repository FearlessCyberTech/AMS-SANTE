import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Button,
  Chip,
  LinearProgress,
  Typography,
  Badge
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  CallEnd as CallEndIcon,
  Chat as ChatIcon,
  AttachFile as AttachFileIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';

const CallControls = ({
  isCallActive,
  isMuted,
  isVideoOn,
  isScreenSharing,
  isFullscreen,
  callDuration,
  connectionQuality = 'good',
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleFullscreen,
  onEndCall,
  onOpenChat,
  onAttachFile,
  onOpenSettings,
  showLabels = false
}) => {
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityColor = (quality) => {
    switch(quality) {
      case 'excellent': return 'success.main';
      case 'good': return 'success.light';
      case 'fair': return 'warning.main';
      case 'poor': return 'error.main';
      default: return 'grey.500';
    }
  };

  const getQualityText = (quality) => {
    switch(quality) {
      case 'excellent': return 'Excellente';
      case 'good': return 'Bonne';
      case 'fair': return 'Moyenne';
      case 'poor': return 'Mauvaise';
      default: return 'Inconnue';
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      p: 2,
      bgcolor: 'background.paper',
      borderRadius: 2,
      boxShadow: 3
    }}>
      {/* Barre d'information */}
      <Box sx={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Durée d'appel */}
        {isCallActive && (
          <Chip
            icon={<AccessTimeIcon />}
            label={`${formatDuration(callDuration)}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        )}
        
        {/* Qualité de connexion */}
        {isCallActive && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              bgcolor: getQualityColor(connectionQuality) 
            }} />
            <Typography variant="caption" color="text.secondary">
              {getQualityText(connectionQuality)}
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Barre de qualité */}
      {isCallActive && (
        <Box sx={{ width: '100%' }}>
          <LinearProgress 
            variant="determinate" 
            value={connectionQuality === 'excellent' ? 100 : 
                   connectionQuality === 'good' ? 75 : 
                   connectionQuality === 'fair' ? 50 : 25} 
            sx={{ 
              height: 4, 
              borderRadius: 2,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: getQualityColor(connectionQuality)
              }
            }}
          />
        </Box>
      )}
      
      {/* Contrôles principaux */}
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {/* Audio */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Tooltip title={isMuted ? "Activer le micro" : "Désactiver le micro"}>
            <IconButton
              color={isMuted ? "error" : "primary"}
              onClick={onToggleAudio}
              sx={{ 
                width: 56,
                height: 56,
                bgcolor: isMuted ? 'error.light' : 'primary.light',
                '&:hover': {
                  bgcolor: isMuted ? 'error.main' : 'primary.main',
                },
                '&.Mui-disabled': {
                  bgcolor: 'grey.200',
                }
              }}
            >
              {isMuted ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
          </Tooltip>
          {showLabels && (
            <Typography variant="caption" sx={{ mt: 0.5 }}>
              Micro
            </Typography>
          )}
        </Box>
        
        {/* Vidéo */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Tooltip title={isVideoOn ? "Désactiver la caméra" : "Activer la caméra"}>
            <IconButton
              color={isVideoOn ? "primary" : "error"}
              onClick={onToggleVideo}
              sx={{ 
                width: 56,
                height: 56,
                bgcolor: isVideoOn ? 'primary.light' : 'error.light',
                '&:hover': {
                  bgcolor: isVideoOn ? 'primary.main' : 'error.main',
                },
                '&.Mui-disabled': {
                  bgcolor: 'grey.200',
                }
              }}
            >
              {isVideoOn ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
          </Tooltip>
          {showLabels && (
            <Typography variant="caption" sx={{ mt: 0.5 }}>
              Caméra
            </Typography>
          )}
        </Box>
        
        {/* Partage d'écran */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Tooltip title={isScreenSharing ? "Arrêter le partage d'écran" : "Partager l'écran"}>
            <IconButton
              color={isScreenSharing ? "primary" : "default"}
              onClick={onToggleScreenShare}
              sx={{ 
                width: 56,
                height: 56,
                bgcolor: isScreenSharing ? 'primary.light' : 'grey.200',
                '&:hover': {
                  bgcolor: isScreenSharing ? 'primary.main' : 'grey.300',
                },
                '&.Mui-disabled': {
                  bgcolor: 'grey.200',
                }
              }}
            >
              {isScreenSharing ? <ScreenShareIcon /> : <StopScreenShareIcon />}
            </IconButton>
          </Tooltip>
          {showLabels && (
            <Typography variant="caption" sx={{ mt: 0.5 }}>
              Écran
            </Typography>
          )}
        </Box>
        
        {/* Chat */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Tooltip title="Ouvrir le chat">
            <IconButton
              color="default"
              onClick={onOpenChat}
              sx={{ 
                width: 56,
                height: 56,
                bgcolor: 'grey.200',
                '&:hover': { bgcolor: 'grey.300' }
              }}
            >
              <Badge badgeContent={0} color="error">
                <ChatIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          {showLabels && (
            <Typography variant="caption" sx={{ mt: 0.5 }}>
              Chat
            </Typography>
          )}
        </Box>
        
        {/* Fichiers */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Tooltip title="Joindre un fichier">
            <IconButton
              color="default"
              onClick={onAttachFile}
              sx={{ 
                width: 56,
                height: 56,
                bgcolor: 'grey.200',
                '&:hover': { bgcolor: 'grey.300' }
              }}
            >
              <AttachFileIcon />
            </IconButton>
          </Tooltip>
          {showLabels && (
            <Typography variant="caption" sx={{ mt: 0.5 }}>
              Fichiers
            </Typography>
          )}
        </Box>
        
        {/* Plein écran */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Tooltip title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}>
            <IconButton
              color="default"
              onClick={onToggleFullscreen}
              sx={{ 
                width: 56,
                height: 56,
                bgcolor: 'grey.200',
                '&:hover': { bgcolor: 'grey.300' }
              }}
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
          {showLabels && (
            <Typography variant="caption" sx={{ mt: 0.5 }}>
              Écran
            </Typography>
          )}
        </Box>
        
        {/* Paramètres */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Tooltip title="Paramètres">
            <IconButton
              color="default"
              onClick={onOpenSettings}
              sx={{ 
                width: 56,
                height: 56,
                bgcolor: 'grey.200',
                '&:hover': { bgcolor: 'grey.300' }
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          {showLabels && (
            <Typography variant="caption" sx={{ mt: 0.5 }}>
              Paramètres
            </Typography>
          )}
        </Box>
        
        {/* Terminer l'appel */}
        {isCallActive && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Tooltip title="Terminer l'appel">
              <IconButton
                color="error"
                onClick={onEndCall}
                sx={{ 
                  width: 56,
                  height: 56,
                  bgcolor: 'error.light',
                  '&:hover': { bgcolor: 'error.main' }
                }}
              >
                <CallEndIcon />
              </IconButton>
            </Tooltip>
            {showLabels && (
              <Typography variant="caption" sx={{ mt: 0.5 }}>
                Terminer
              </Typography>
            )}
          </Box>
        )}
      </Box>
      
      {/* Bouton de démarrage d'appel */}
      {!isCallActive && (
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<PhoneIcon />}
          onClick={onEndCall}
          sx={{ 
            mt: 2, 
            px: 4, 
            py: 1.5,
            borderRadius: 8,
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Commencer l'appel
        </Button>
      )}
    </Box>
  );
};

export default CallControls;