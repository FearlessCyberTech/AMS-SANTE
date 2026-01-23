class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.dataChannel = null;
    this.localStream = null;
    this.remoteStream = null;
    this.iceCandidates = [];
    this.connectionState = 'disconnected';
    this.onConnectionStateChange = null;
    this.onRemoteStream = null;
    this.onDataChannelMessage = null;
    this.onDataChannelOpen = null;
    this.onDataChannelClose = null;
  }

  // Initialiser la connexion
  async initialize(offer = null) {
    try {
      // Configuration ICE
      const configuration = {
        iceServers: [
          {
            urls: [
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302',
              'stun:stun2.l.google.com:19302',
              'stun:stun3.l.google.com:19302',
              'stun:stun4.l.google.com:19302'
            ]
          },
          {
            urls: 'turn:turn.server.com:3478',
            username: 'username',
            credential: 'password'
          }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      };

      this.peerConnection = new RTCPeerConnection(configuration);
      
      // Configurer les gestionnaires d'événements
      this._setupEventHandlers();

      // Si une offre est fournie, c'est un appel entrant
      if (offer) {
        await this.handleOffer(offer);
      }

      return this.peerConnection;
    } catch (error) {
      console.error('Erreur initialisation WebRTC:', error);
      throw error;
    }
  }

  // Configurer les gestionnaires d'événements
  _setupEventHandlers() {
    if (!this.peerConnection) return;

    // Événements ICE
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.iceCandidates.push(event.candidate);
        // Envoyer le candidat au pair distant
        console.log('Candidat ICE généré:', event.candidate);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      this.connectionState = this.peerConnection.iceConnectionState;
      console.log('État connexion ICE:', this.connectionState);
      
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this.connectionState);
      }
    };

    this.peerConnection.onicegatheringstatechange = () => {
      console.log('État gathering ICE:', this.peerConnection.iceGatheringState);
    };

    this.peerConnection.onsignalingstatechange = () => {
      console.log('État signaling:', this.peerConnection.signalingState);
    };

    // Événements stream
    this.peerConnection.ontrack = (event) => {
      console.log('Track reçue:', event.track.kind);
      this.remoteStream = event.streams[0];
      
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };

    // Événements data channel
    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this._setupDataChannelHandlers();
    };
  }

  // Configurer les gestionnaires data channel
  _setupDataChannelHandlers() {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('Data channel ouvert');
      if (this.onDataChannelOpen) {
        this.onDataChannelOpen();
      }
    };

    this.dataChannel.onclose = () => {
      console.log('Data channel fermé');
      if (this.onDataChannelClose) {
        this.onDataChannelClose();
      }
    };

    this.dataChannel.onmessage = (event) => {
      console.log('Message reçu:', event.data);
      if (this.onDataChannelMessage) {
        this.onDataChannelMessage(event.data);
      }
    };

    this.dataChannel.onerror = (error) => {
      console.error('Erreur data channel:', error);
    };
  }

  // Ajouter le stream local
  async addLocalStream(stream) {
    if (!this.peerConnection) {
      throw new Error('PeerConnection non initialisée');
    }

    this.localStream = stream;
    
    // Ajouter toutes les tracks
    stream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, stream);
    });
  }

  // Créer une offre
  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('PeerConnection non initialisée');
    }

    const offerOptions = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
      voiceActivityDetection: true
    };

    const offer = await this.peerConnection.createOffer(offerOptions);
    await this.peerConnection.setLocalDescription(offer);
    
    return offer;
  }

  // Gérer une offre reçue
  async handleOffer(offer) {
    if (!this.peerConnection) {
      throw new Error('PeerConnection non initialisée');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    // Créer une réponse
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    return answer;
  }

  // Gérer une réponse reçue
  async handleAnswer(answer) {
    if (!this.peerConnection) {
      throw new Error('PeerConnection non initialisée');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  // Ajouter des candidats ICE
  async addIceCandidate(candidate) {
    if (!this.peerConnection) {
      throw new Error('PeerConnection non initialisée');
    }

    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  // Créer un data channel
  createDataChannel(label = 'chat') {
    if (!this.peerConnection) {
      throw new Error('PeerConnection non initialisée');
    }

    const config = {
      ordered: true,
      maxPacketLifeTime: 3000,
      maxRetransmits: 5
    };

    this.dataChannel = this.peerConnection.createDataChannel(label, config);
    this._setupDataChannelHandlers();
    
    return this.dataChannel;
  }

  // Envoyer un message via data channel
  sendMessage(message) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel non disponible');
    }

    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    this.dataChannel.send(messageStr);
  }

  // Obtenir les statistiques
  async getStats() {
    if (!this.peerConnection) {
      return null;
    }

    const stats = await this.peerConnection.getStats();
    const result = {
      inbound: { audio: {}, video: {} },
      outbound: { audio: {}, video: {} },
      connection: {}
    };

    stats.forEach(report => {
      // Statistiques audio inbound
      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        result.inbound.audio = {
          bitrate: report.bitrate || 0,
          packetsLost: report.packetsLost || 0,
          jitter: report.jitter || 0,
          totalBytes: report.bytesReceived || 0
        };
      }
      
      // Statistiques vidéo inbound
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        result.inbound.video = {
          bitrate: report.bitrate || 0,
          packetsLost: report.packetsLost || 0,
          frameRate: report.framesPerSecond || 0,
          frameWidth: report.frameWidth || 0,
          frameHeight: report.frameHeight || 0,
          totalBytes: report.bytesReceived || 0
        };
      }
      
      // Statistiques audio outbound
      if (report.type === 'outbound-rtp' && report.kind === 'audio') {
        result.outbound.audio = {
          bitrate: report.bitrate || 0,
          totalBytes: report.bytesSent || 0
        };
      }
      
      // Statistiques vidéo outbound
      if (report.type === 'outbound-rtp' && report.kind === 'video') {
        result.outbound.video = {
          bitrate: report.bitrate || 0,
          frameRate: report.framesPerSecond || 0,
          frameWidth: report.frameWidth || 0,
          frameHeight: report.frameHeight || 0,
          totalBytes: report.bytesSent || 0
        };
      }
      
      // Statistiques de connexion
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        result.connection = {
          rtt: report.currentRoundTripTime || 0,
          availableOutgoingBitrate: report.availableOutgoingBitrate || 0
        };
      }
    });

    return result;
  }

  // Arrêter la connexion
  stop() {
    // Fermer data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Fermer peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Arrêter les streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    // Réinitialiser
    this.iceCandidates = [];
    this.connectionState = 'disconnected';
  }

  // Vérifier la compatibilité
  static isSupported() {
    return (
      typeof window !== 'undefined' &&
      window.RTCPeerConnection &&
      window.RTCSessionDescription &&
      window.RTCIceCandidate
    );
  }

  // Obtenir les capacités du navigateur
  static getCapabilities() {
    const capabilities = {
      webRTC: this.isSupported(),
      getUserMedia: !!navigator.mediaDevices?.getUserMedia,
      getDisplayMedia: !!navigator.mediaDevices?.getDisplayMedia,
      dataChannels: true,
      simulcast: false,
      sctp: true
    };

    // Détecter le navigateur
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) {
      capabilities.browser = 'chrome';
      capabilities.version = ua.match(/Chrome\/(\d+)/)?.[1];
    } else if (ua.includes('Firefox')) {
      capabilities.browser = 'firefox';
      capabilities.version = ua.match(/Firefox\/(\d+)/)?.[1];
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      capabilities.browser = 'safari';
      capabilities.version = ua.match(/Version\/(\d+)/)?.[1];
    }

    return capabilities;
  }

  // Test de connexion
  static async testConnection() {
    try {
      // Test getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getTracks().forEach(track => track.stop());
      
      // Test RTCPeerConnection
      const pc = new RTCPeerConnection();
      pc.close();
      
      return {
        success: true,
        capabilities: this.getCapabilities(),
        message: 'WebRTC supporté'
      };
    } catch (error) {
      return {
        success: false,
        capabilities: this.getCapabilities(),
        error: error.message,
        message: 'WebRTC non supporté ou bloqué'
      };
    }
  }
}

export default WebRTCService;