/**
 * Ultravox SDK - UMD Version
 * This is a simplified UMD version of the Ultravox SDK for better cross-origin compatibility
 */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['livekit-client'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('livekit-client'));
  } else {
    // Browser globals (root is window)
    root.UltravoxSession = factory(root.LivekitClient);
  }
}(typeof self !== 'undefined' ? self : this, function(LivekitClient) {
  'use strict';
  
  // Version
  const ULTRAVOX_SDK_VERSION = '1.2.0';
  
  // Enums
  const UltravoxSessionStatus = {
    DISCONNECTED: "disconnected",
    DISCONNECTING: "disconnecting",
    CONNECTING: "connecting",
    IDLE: "idle",
    LISTENING: "listening",
    THINKING: "thinking",
    SPEAKING: "speaking"
  };
  
  const Role = {
    USER: "user",
    AGENT: "agent"
  };
  
  const Medium = {
    VOICE: "voice",
    TEXT: "text"
  };
  
  // Classes
  class Transcript {
    constructor(text, isFinal, speaker, medium) {
      this.text = text;
      this.isFinal = isFinal;
      this.speaker = speaker;
      this.medium = medium;
    }
  }
  
  class UltravoxSessionStatusChangedEvent extends Event {
    constructor() {
      super('status');
    }
  }
  
  class UltravoxTranscriptsChangedEvent extends Event {
    constructor() {
      super('transcripts');
    }
  }
  
  class UltravoxExperimentalMessageEvent extends Event {
    constructor(message) {
      super('experimental_message');
      this.message = message;
    }
  }
  
  class UltravoxDataMessageEvent extends Event {
    constructor(message) {
      super('data_message');
      this.message = message;
    }
  }
  
  // Main UltravoxSession class
  class UltravoxSession extends EventTarget {
    static CONNECTED_STATUSES = new Set([
      UltravoxSessionStatus.LISTENING,
      UltravoxSessionStatus.THINKING,
      UltravoxSessionStatus.SPEAKING,
    ]);
    
    constructor({ audioContext, experimentalMessages } = {}) {
      super();
      this._transcripts = [];
      this._status = UltravoxSessionStatus.DISCONNECTED;
      this.registeredTools = new Map();
      this.socket = null;
      this.room = null;
      this.audioElement = null;
      this.localAudioTrack = null;
      this.micSourceNode = null;
      this.agentSourceNode = null;
      this.delayedSpeakingState = false;
      this.textDecoder = new TextDecoder();
      this.textEncoder = new TextEncoder();
      this.audioContext = null;
      this.experimentalMessages = experimentalMessages || new Set();
      this._isMicMuted = false;
      this._isSpeakerMuted = false;
    }
    
    get transcripts() {
      return [...this._transcripts.filter((t) => t != null)];
    }
    
    get status() {
      return this._status;
    }
    
    get isMicMuted() {
      return this._isMicMuted;
    }
    
    get isSpeakerMuted() {
      return this._isSpeakerMuted;
    }
    
    registerToolImplementation(name, implementation) {
      this.registeredTools.set(name, implementation);
    }
    
    registerToolImplementations(implementationMap) {
      for (const [name, implementation] of Object.entries(implementationMap)) {
        this.registerToolImplementation(name, implementation);
      }
    }
    
    joinCall(joinUrl, clientVersion) {
      if (this._status !== UltravoxSessionStatus.DISCONNECTED) {
        throw new Error('Cannot join a new call while already in a call');
      }
      
      const url = new URL(joinUrl);
      let uvClientVersion = `web_${ULTRAVOX_SDK_VERSION}`;
      if (clientVersion) {
        uvClientVersion += `:${clientVersion}`;
      }
      
      url.searchParams.set('clientVersion', uvClientVersion);
      url.searchParams.set('apiVersion', '1');
      
      if (this.experimentalMessages) {
        url.searchParams.set('experimentalMessages', Array.from(this.experimentalMessages.values()).join(','));
      }
      
      joinUrl = url.toString();
      this.setStatus(UltravoxSessionStatus.CONNECTING);
      
      this.socket = new WebSocket(joinUrl);
      this.socket.onmessage = (event) => this.handleSocketMessage(event);
      this.socket.onclose = (event) => this.handleSocketClose(event);
    }
    
    async leaveCall() {
      await this.disconnect();
    }
    
    disconnect() {
      // Simplified disconnect logic
      this.setStatus(UltravoxSessionStatus.DISCONNECTING);
      
      if (this.room) {
        this.room.disconnect();
        this.room = null;
      }
      
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      
      this.setStatus(UltravoxSessionStatus.DISCONNECTED);
      return Promise.resolve();
    }
    
    // Simplified implementations
    setStatus(status) {
      this._status = status;
      this.dispatchEvent(new UltravoxSessionStatusChangedEvent());
    }
    
    setOutputMedium(medium) {
      if (!UltravoxSession.CONNECTED_STATUSES.has(this._status)) {
        throw new Error(`Cannot set output medium while not connected. Current status is ${this._status}.`);
      }
      this.sendData({ type: 'set_output_medium', medium });
    }
    
    sendText(text) {
      if (!UltravoxSession.CONNECTED_STATUSES.has(this._status)) {
        throw new Error(`Cannot send text while not connected. Current status is ${this._status}.`);
      }
      this.sendData({ type: 'input_text_message', text });
    }
    
    sendData(obj) {
      if (obj.type == undefined) {
        throw new Error('Data must have a type field');
      }
      
      const msgStr = JSON.stringify(obj);
      const msgBytes = this.textEncoder.encode(msgStr);
      
      if (msgBytes.length > 1024) {
        this.socket?.send(msgStr);
      } else {
        this.room?.localParticipant.publishData(msgBytes, { reliable: true });
      }
    }
    
    muteMic() {
      if (!this.room?.localParticipant) {
        throw new Error('Cannot muteMic.');
      }
      this._isMicMuted = true;
      this.room.localParticipant.setMicrophoneEnabled(false);
    }
    
    unmuteMic() {
      if (!this.room?.localParticipant) {
        throw new Error('Cannot unmuteMic.');
      }
      this._isMicMuted = false;
      this.room.localParticipant.setMicrophoneEnabled(true);
    }
    
    toggleMicMute() {
      if (this.isMicMuted) {
        this.unmuteMic();
      } else {
        this.muteMic();
      }
    }
    
    muteSpeaker() {
      this._isSpeakerMuted = true;
      this.audioElement.muted = true;
    }
    
    unmuteSpeaker() {
      this._isSpeakerMuted = false;
      this.audioElement.muted = false;
    }
    
    toggleSpeakerMute() {
      if (this.isSpeakerMuted) {
        this.unmuteSpeaker();
      } else {
        this.muteSpeaker();
      }
    }
    
    async initializeAudioContext() {
      if (!this.audioContext) {
        try {
          // Create new audio context
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          
          // Resume audio context if it's suspended
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }
          
          console.log('Audio context initialized:', this.audioContext.state);
        } catch (err) {
          console.warn('Failed to initialize audio context:', err);
        }
      }
      return this.audioContext;
    }
    
    async setupLocalAudio() {
      try {
        // Initialize audio context first
        await this.initializeAudioContext();

        // Create local audio track using the correct LiveKit method
        this.localAudioTrack = await LivekitClient.LocalTrack.createLocalAudioTrack({
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          name: 'microphone'
        });

        // Get the underlying MediaStreamTrack
        const mediaStreamTrack = this.localAudioTrack.mediaStreamTrack;
        
        // Create a MediaStream from the track
        const stream = new MediaStream([mediaStreamTrack]);

        // Set up audio routing if we have an audio context
        if (this.audioContext && mediaStreamTrack) {
          try {
            if (!this.micSourceNode) {
              const source = this.audioContext.createMediaStreamSource(stream);
              source.connect(this.audioContext.destination);
              this.micSourceNode = source;
            }
          } catch (micError) {
            console.warn('Error connecting microphone to audio context:', micError);
          }
        }

        return this.localAudioTrack;
      } catch (err) {
        console.error('Error setting up local audio:', err);
        throw err;
      }
    }
    
    handleSocketMessage(event) {
      console.log('[UltravoxSession UMD] Socket message received');
      
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.error('Error parsing socket message:', e);
        return;
      }
      
      if (data.type === 'connection_details') {
        console.log('Got connection details, connecting to LiveKit');
        const { url, token, participantName } = data;
        
        try {
          // Connect to LiveKit room
          this.room = new LivekitClient.Room({
            adaptiveStream: true,
            dynacast: true,
            audioOptimizationMode: 'music'
          });
          
          // Set up audio track handling
          this.room.on(LivekitClient.RoomEvent.TrackSubscribed, async (track, publication, participant) => {
            if (track.kind === 'audio') {
              try {
                // Create audio element if needed
                if (!this.audioElement) {
                  this.audioElement = new Audio();
                  this.audioElement.autoplay = false;
                }
                
                // Initialize audio context before attaching track
                await this.initializeAudioContext();
                
                // Attach track to audio element
                track.attach(this.audioElement);
                
                // Connect to audio context if available
                if (this.audioContext) {
                  try {
                    if (!this.agentSourceNode) {
                      const source = this.audioContext.createMediaElementSource(this.audioElement);
                      source.connect(this.audioContext.destination);
                      this.agentSourceNode = source;
                    }
                  } catch (audioContextError) {
                    console.warn('Error connecting to audio context:', audioContextError);
                  }
                }
                
                // Set up play handler for user interaction
                const playAudio = async () => {
                  try {
                    // Resume audio context if needed
                    if (this.audioContext && this.audioContext.state === 'suspended') {
                      await this.audioContext.resume();
                    }
                    await this.audioElement.play();
                  } catch (playError) {
                    console.warn('Audio playback error:', playError);
                  }
                };
                
                // Add click handler for user interaction
                document.addEventListener('click', playAudio, { once: true });
                
              } catch (audioError) {
                console.error('Error setting up audio:', audioError);
              }
            }
          });
          
          // Handle local track setup
          this.room.on(LivekitClient.RoomEvent.Connected, async () => {
            try {
              // Set up local audio track
              await this.setupLocalAudio();
              
              // Publish local track if available
              if (this.localAudioTrack) {
                await this.room.localParticipant.publishTrack(this.localAudioTrack);
              }
              
              // Set initial state
              this.setStatus(UltravoxSessionStatus.IDLE);
            } catch (err) {
              console.error('Error publishing local track:', err);
              this.setStatus(UltravoxSessionStatus.DISCONNECTED);
            }
          });
          
          // Connect to room
          this.room.connect(url, token, {
            autoSubscribe: true,
            name: participantName
          }).catch(err => {
            console.error('Error connecting to LiveKit:', err);
            this.setStatus(UltravoxSessionStatus.DISCONNECTED);
          });
          
        } catch (e) {
          console.error('Error setting up room:', e);
          this.setStatus(UltravoxSessionStatus.DISCONNECTED);
        }
      }
    }
    
    handleSocketClose(event) {
      console.log('Socket closed:', event.code, event.reason);
      this.disconnect();
    }
  }
  
  // Expose public API
  return UltravoxSession;
})); 