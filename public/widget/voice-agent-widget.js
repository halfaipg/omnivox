/**
 * Voice Agent Widget
 * A lightweight widget for adding voice agent capabilities to any website.
 */
class VoiceAgentWidget {
  constructor(config) {
    this.agentUrl = config.agentUrl; // The sharable URL from index.html
    this.avatarUrl = config.avatarUrl || 'https://raw.githubusercontent.com/codespaces-io/genai-avatar-examples/main/ai-assistant.png';
    this.agentName = config.agentName || 'AI Assistant';
    this.theme = config.theme || 'light';
    this.position = config.position || 'bottom-right';
    
    // Direct configuration parameters
    this.voiceId = config.voiceId || null;
    this.corpusId = config.corpusId || null;
    this.systemPrompt = config.systemPrompt || null;
    
    this.container = null;
    this.callActive = false;
    this.webSocketConnection = null;
    this.webRTCConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.audioElement = null;
    this.transcripts = [];
    this.callSession = null;
    this.callParams = {}; // Will store parameters from the URL
    
    // Audio elements for call sounds
    this.ringtone = null;
    this.connectSound = null;
    this.hangupSound = null;
    
    // Bind methods
    this.toggleCall = this.toggleCall.bind(this);
    this.startCall = this.startCall.bind(this);
    this.endCall = this.endCall.bind(this);
    this.updateCallStatus = this.updateCallStatus.bind(this);
    this.processShareableUrl = this.processShareableUrl.bind(this);
    this.updateTranscript = this.updateTranscript.bind(this);
  }

  // Initialize and mount the widget to the DOM
  mount(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container element with ID "${containerId}" not found`);
      return;
    }
    
    this._injectStyles();
    this._renderWidget();
    this._setupEventListeners();
    this._preloadSounds();
    
    // Process the shareable URL if provided
    if (this.agentUrl) {
      this.processShareableUrl(this.agentUrl);
    }
  }

  // Process the shareable URL to extract parameters
  processShareableUrl(url) {
    try {
      // Extract URL parameters
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      // Get voice, agent name, corpus ID, and system prompt
      const voiceId = params.get('voice');
      const agentName = params.get('agent') || this.agentName;
      const corpusId = params.get('corpus');
      const systemPrompt = params.get('prompt');
      
      // Update widget properties
      if (agentName) this.agentName = agentName;
      
      // Update the widget UI with the agent name
      const nameElement = this.container.querySelector('.voice-agent-name');
      if (nameElement) {
        nameElement.textContent = this.agentName;
      }
      
      // Store the parameters for the call
      this.callParams = {
        voiceId: voiceId || this.voiceId,
        agentName: agentName,
        corpusId: corpusId || this.corpusId,
        systemPrompt: systemPrompt || this.systemPrompt
      };
      
      console.log('Processed call parameters:', {
        voiceId: this.callParams.voiceId,
        agentName: this.callParams.agentName,
        corpusId: this.callParams.corpusId,
        systemPrompt: this.callParams.systemPrompt ? `${this.callParams.systemPrompt.substring(0, 20)}...` : null
      });
    } catch (error) {
      console.error('Error processing shareable URL:', error);
    }
  }

  // Handle the call toggle action
  toggleCall() {
    if (this.callActive) {
      this.endCall();
    } else {
      this.startCall();
    }
  }

  // Start a WebRTC call
  async startCall() {
    try {
      this.updateCallStatus('connecting');
      
      // Check if the Ultravox SDK is available
      if (!window.UltravoxSession) {
        // Load the Ultravox SDK dynamically
        await this._loadUltravoxSDK();
      }
      
      // Get the button element for UI updates
      const buttonElement = this.container.querySelector('.voice-agent-button');
      
      // Disable the button to prevent multiple calls
      if (buttonElement) {
        buttonElement.disabled = true;
      }
      
      // Play ringtone
      if (this.ringtone) {
        try {
          this.ringtone.currentTime = 0;
          this.ringtone.play().catch(err => console.warn('Error playing ringtone:', err));
        } catch (e) {
          console.warn('Could not play ringtone:', e);
        }
      }
      
      // Update status text
      const statusElement = this.container.querySelector('.voice-agent-status');
      if (statusElement) {
        statusElement.textContent = `Calling ${this.agentName}...`;
      }
      
      // Wait 2-3 seconds before starting the connection to simulate call setup
      await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000) + 2000));
      
      // Get user's local time information
      const now = new Date();
      const localTimeString = now.toLocaleString();
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Get the base origin for API requests
      const getScriptOrigin = () => {
        // Try to find our own script
        const scripts = document.querySelectorAll('script');
        for (let i = 0; i < scripts.length; i++) {
          const src = scripts[i].src || '';
          if (src.includes('voice-agent-widget.js') || src.includes('embed.js')) {
            try {
              const url = new URL(src);
              return url.origin;
            } catch (e) {
              console.error('Error parsing script URL:', e);
            }
          }
        }
        // Fallback to current origin
        return window.location.origin;
      };
      
      const baseOrigin = getScriptOrigin();
      
      // Prepare call parameters
      const callParams = {
        agentName: this.callParams?.agentName || this.agentName,
        voiceId: this.callParams?.voiceId || this.voiceId,
        corpusId: this.callParams?.corpusId || this.corpusId,
        systemPrompt: this.callParams?.systemPrompt || this.systemPrompt,
        userLocalTimeString: localTimeString,
        userTimeZone: timeZone
      };
      
      console.log('Starting call with parameters:', {
        agentName: callParams.agentName,
        voiceId: callParams.voiceId,
        corpusId: callParams.corpusId,
        systemPrompt: callParams.systemPrompt ? 'provided' : 'not provided'
      });
      
      // Request the join URL from the server
      const response = await fetch(`${baseOrigin}/webrtc-join-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(callParams)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server error response:', errorData);
        
        // Handle case where server is not available
        this.updateCallStatus('error', 'Cannot connect to AI service. Try on main platform.');
        
        // Make the button redirect to the main site
        if (buttonElement) {
          buttonElement.disabled = false;
          buttonElement.textContent = 'Continue on main platform';
          buttonElement.onclick = () => {
            window.open(this.agentUrl, '_blank');
          };
        }
        
        throw new Error('Failed to get join URL');
      }
      
      const data = await response.json();
      
      if (!data.joinUrl) {
        throw new Error('No join URL provided');
      }
      
      // Create WebRTC call session
      const UltravoxSession = window.UltravoxSession;
      this.callSession = new UltravoxSession();
      
      // Set up event listeners for call state changes
      this.callSession.addEventListener('status', (event) => {
        if (this.callSession) {
          const status = this.callSession.status;
          
          if (statusElement) {
            statusElement.textContent = `Call status: ${status}`;
          }
          
          // Play connect sound when call is connected
          if (status === 'connected' && this.ringtone && this.ringtone.paused === false) {
            // Stop ringtone
            this.ringtone.pause();
            
            // Play connect sound
            if (this.connectSound) {
              this.connectSound.currentTime = 0;
              this.connectSound.play().catch(err => console.error('Error playing connect sound:', err));
            }
            
            this.updateCallStatus('active');
            this.callActive = true;
          }
          
          // Handle disconnected state
          if (status === 'disconnected') {
            this.endCall();
          }
        }
      });
      
      // Set up transcript updates
      this.callSession.addEventListener('transcripts', (event) => {
        if (this.callSession && this.callSession.transcripts) {
          this.updateTranscript(this.callSession.transcripts);
        }
      });
      
      // Add custom event listener for when the room is created
      const originalSetStatus = this.callSession.setStatus;
      if (originalSetStatus) {
        this.callSession.setStatus = function(status) {
          // Call the original method
          originalSetStatus.call(this, status);
          
          // If we're connecting, set up room event listeners when the room is available
          if (status === 'connecting' || status === 'connected') {
            // Wait for room to be created
            const checkRoom = setInterval(() => {
              if (this.room) {
                clearInterval(checkRoom);
                
                // Listen for room disconnect events
                this.room.on('disconnected', () => {
                  console.log('Room disconnected by server or AI');
                  if (this.endCallCallback) {
                    this.endCallCallback();
                  }
                });
                
                // Listen for participant left events (AI agent leaving)
                this.room.on('participantDisconnected', (participant) => {
                  console.log('Participant disconnected:', participant);
                  if (this.endCallCallback) {
                    this.endCallCallback();
                  }
                });
              }
            }, 100);
          }
        };
      }
      
      // Store reference to endCall for room disconnect events
      this.callSession.endCallCallback = this.endCall;
      
      // Join the call
      await this.callSession.joinCall(data.joinUrl);
      
      // Update UI for active call
      this.updateCallStatus('active');
      this.callActive = true;
      
      // Play connect sound and stop ringtone
      if (this.ringtone) {
        this.ringtone.pause();
      }
      if (this.connectSound) {
        this.connectSound.currentTime = 0;
        this.connectSound.play().catch(err => console.error('Error playing connect sound:', err));
      }
      
      // Add a transcript container if it doesn't exist
      if (!this.container.querySelector('.voice-agent-transcript')) {
        const transcriptContainer = document.createElement('div');
        transcriptContainer.className = 'voice-agent-transcript';
        transcriptContainer.innerHTML = `<p class="connected-message">Connected - ${this.agentName} has joined the call.</p>`;
        this.container.querySelector('.voice-agent-widget').appendChild(transcriptContainer);
      }
      
    } catch (error) {
      console.error('Error starting call:', error);
      
      // Stop ringtone if error occurs
      if (this.ringtone) {
        this.ringtone.pause();
      }
      
      // Update UI to show error
      this.updateCallStatus('error', error.message || 'Failed to start call');
      
      // Re-enable button
      const buttonElement = this.container.querySelector('.voice-agent-button');
      if (buttonElement) {
        buttonElement.disabled = false;
      }
    }
  }

  // End the WebRTC call
  async endCall() {
    try {
      if (this.callSession) {
        await this.callSession.leaveCall();
        this.callSession = null;
      }
      
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }
      
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.srcObject = null;
      }
      
      // Play hangup sound
      if (this.hangupSound && !this.hangupSound.playing) {
        this.hangupSound.currentTime = 0;
        this.hangupSound.playing = true;
        this.hangupSound.play().catch(err => console.error('Error playing hangup sound:', err));
        this.hangupSound.onended = () => {
          this.hangupSound.playing = false;
        };
      }
      
      this.callActive = false;
      this.updateCallStatus('idle');
      
      // Set "Call ended" message in transcript
      const transcriptContainer = this.container.querySelector('.voice-agent-transcript');
      if (transcriptContainer) {
        transcriptContainer.innerHTML = `<p class="ended-message">Call ended.</p>`;
        
        // Remove the transcript container after a delay
        setTimeout(() => {
          if (transcriptContainer.parentNode) {
            transcriptContainer.parentNode.removeChild(transcriptContainer);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error ending call:', error);
      this.callActive = false;
      this.updateCallStatus('idle');
    }
  }

  // Update the transcript
  updateTranscript(transcripts) {
    const transcriptContainer = this.container.querySelector('.voice-agent-transcript');
    if (!transcriptContainer) return;
    
    // Clear current transcript
    transcriptContainer.innerHTML = '';
    
    // Add each transcript message
    transcripts.forEach(transcript => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `transcript-message ${transcript.speaker.toLowerCase()}`;
      
      const speakerDiv = document.createElement('div');
      speakerDiv.className = 'transcript-speaker';
      speakerDiv.textContent = transcript.speaker === 'agent' ? this.agentName : 'You';
      
      const textDiv = document.createElement('div');
      textDiv.className = 'transcript-text';
      textDiv.textContent = transcript.text;
      
      messageDiv.appendChild(speakerDiv);
      messageDiv.appendChild(textDiv);
      
      transcriptContainer.appendChild(messageDiv);
      
      // Update avatar animation if agent is speaking
      if (transcript.speaker === 'agent') {
        this.updateCallStatus('speaking');
      } else {
        this.updateCallStatus('listening');
      }
    });
    
    // Scroll to bottom
    transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
  }

  // Update the UI to reflect call status
  updateCallStatus(status, errorMessage = '') {
    const statusElement = this.container.querySelector('.voice-agent-status');
    const buttonElement = this.container.querySelector('.voice-agent-button');
    const avatarElement = this.container.querySelector('.voice-agent-avatar');
    
    if (!statusElement || !buttonElement || !avatarElement) return;
    
    // Update UI based on status
    switch (status) {
      case 'idle':
        statusElement.textContent = `Click to talk with ${this.agentName}`;
        statusElement.className = 'voice-agent-status idle';
        buttonElement.textContent = 'Start Call';
        buttonElement.className = 'voice-agent-button start';
        buttonElement.disabled = false;
        avatarElement.classList.remove('speaking', 'connecting');
        break;
        
      case 'connecting':
        statusElement.textContent = 'Connecting...';
        statusElement.className = 'voice-agent-status connecting';
        buttonElement.textContent = 'Cancel';
        buttonElement.className = 'voice-agent-button cancel';
        avatarElement.classList.add('connecting');
        avatarElement.classList.remove('speaking');
        break;
        
      case 'active':
        statusElement.textContent = 'Call in progress';
        statusElement.className = 'voice-agent-status active';
        buttonElement.textContent = 'End Call';
        buttonElement.className = 'voice-agent-button end';
        buttonElement.disabled = false;
        avatarElement.classList.remove('connecting');
        
        // Expand the widget to show transcript
        const widgetElement = this.container.querySelector('.voice-agent-widget');
        if (widgetElement) {
          widgetElement.classList.add('expanded');
        }
        break;
        
      case 'speaking':
        avatarElement.classList.add('speaking');
        break;
        
      case 'listening':
        avatarElement.classList.remove('speaking');
        break;
        
      case 'error':
        statusElement.textContent = errorMessage || 'Error occurred';
        statusElement.className = 'voice-agent-status error';
        buttonElement.textContent = 'Retry';
        buttonElement.className = 'voice-agent-button retry';
        buttonElement.disabled = false;
        avatarElement.classList.remove('speaking', 'connecting');
        break;
    }
  }

  // Preload audio files for call sounds
  _preloadSounds() {
    // Get the base origin from the current script
    const getScriptOrigin = () => {
      // Try to find our own script
      const scripts = document.querySelectorAll('script');
      for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].src || '';
        if (src.includes('voice-agent-widget.js') || src.includes('embed.js')) {
          try {
            const url = new URL(src);
            return url.origin;
          } catch (e) {
            console.error('Error parsing script URL:', e);
          }
        }
      }
      // Fallback to current origin
      return window.location.origin;
    };
    
    const baseOrigin = getScriptOrigin();
    
    // Ringtone
    this.ringtone = new Audio(`${baseOrigin}/mixkit-marimba-waiting-ringtone-1360.wav`);
    this.ringtone.loop = true;
    this.ringtone.volume = 0.4;
    
    // Connect sound
    this.connectSound = new Audio(`${baseOrigin}/phone-pick-up-1.mp3`);
    this.connectSound.volume = 0.7;
    
    // Hangup sound
    this.hangupSound = new Audio(`${baseOrigin}/cell-hangup.mp3`);
    this.hangupSound.volume = 0.3;
    
    // Preload sounds - but handle errors gracefully
    [this.ringtone, this.connectSound, this.hangupSound].forEach(sound => {
      sound.load();
      
      // Add error handling for audio
      sound.addEventListener('error', (e) => {
        console.warn('Could not load audio file:', sound.src, e);
        // We'll continue without the sounds
      });
      
      // Try to preload but don't break if it fails
      try {
        sound.muted = true;
        sound.play().then(() => {
          sound.pause();
          sound.currentTime = 0;
          sound.muted = false;
        }).catch(err => {
          // Ignore errors during preload
          sound.muted = false;
        });
      } catch (e) {
        sound.muted = false;
        console.warn('Error preloading sound:', e);
      }
    });
  }

  // Load the Ultravox SDK dynamically
  async _loadUltravoxSDK() {
    return new Promise((resolve, reject) => {
      if (window.UltravoxSession) {
        resolve(window.UltravoxSession);
        return;
      }
      
      // Get the base origin from the current script
      const getScriptOrigin = () => {
        // Try to find our own script
        const scripts = document.querySelectorAll('script');
        for (let i = 0; i < scripts.length; i++) {
          const src = scripts[i].src || '';
          if (src.includes('voice-agent-widget.js') || src.includes('embed.js')) {
            try {
              const url = new URL(src);
              return url.origin;
            } catch (e) {
              console.error('Error parsing script URL:', e);
            }
          }
        }
        // Fallback to current origin
        return window.location.origin;
      };
      
      const baseOrigin = getScriptOrigin();
      console.log('Using base origin for resources:', baseOrigin);
      
      // First, make sure we have the import map loaded
      const loadImportMap = () => {
        return new Promise((resolveMap, rejectMap) => {
          if (document.querySelector('script[type="importmap"]')) {
            resolveMap();
            return;
          }
          
          const importMapScript = document.createElement('script');
          importMapScript.src = `${baseOrigin}/widget/importmap.js`;
          importMapScript.onload = resolveMap;
          importMapScript.onerror = () => {
            console.warn('Failed to load import map, will try direct SDK import');
            resolveMap(); // Continue anyway, we'll try direct import
          };
          document.head.appendChild(importMapScript);
        });
      };
      
      // Load import map then try to load the SDK
      loadImportMap()
        .then(() => {
          // Try to load ESM version directly from the correct path
          return import(`${baseOrigin}/ultravox-sdk/esm/index.js`);
        })
        .then(module => {
          if (module && module.UltravoxSession) {
            window.UltravoxSession = module.UltravoxSession;
            console.log('Successfully loaded Ultravox SDK from ESM module');
            resolve(window.UltravoxSession);
          } else {
            throw new Error('Ultravox SDK ESM module loaded but UltravoxSession not found');
          }
        })
        .catch(err => {
          console.warn('Failed to load ESM version:', err);
          
          // Create a fallback approach using a dynamic script element
          // that creates a global variable
          const script = document.createElement('script');
          script.type = 'module';
          
          // Create a small inline module that re-exports the ESM module
          script.textContent = `
            try {
              import { UltravoxSession } from '${baseOrigin}/ultravox-sdk/esm/index.js';
              window.UltravoxSession = UltravoxSession;
            } catch(e) {
              console.error("Failed to import UltravoxSession:", e);
            }
          `;
          
          script.onload = () => {
            // Wait a bit for the module to execute
            setTimeout(() => {
              if (window.UltravoxSession) {
                console.log('Successfully loaded Ultravox SDK via inline module');
                resolve(window.UltravoxSession);
              } else {
                // Try one more approach - load from a CDN or redirect to the main site
                console.warn('Could not load SDK from server, redirecting to main site');
                // Show a more user-friendly error about redirecting to the main platform
                this.updateCallStatus('error', 'Widget requires access to AI services. Click to continue on our platform.');
                
                // Make the button redirect to the main site
                const buttonElement = this.container.querySelector('.voice-agent-button');
                if (buttonElement) {
                  buttonElement.textContent = 'Continue on main platform';
                  buttonElement.onclick = () => {
                    window.open(this.agentUrl, '_blank');
                  };
                }
                
                reject(new Error('Failed to load Ultravox SDK - please use the main platform'));
              }
            }, 100);
          };
          
          script.onerror = () => {
            // Show a user-friendly error and redirect option
            this.updateCallStatus('error', 'Could not load AI services. Click to continue on our platform.');
            
            // Make the button redirect to the main site
            const buttonElement = this.container.querySelector('.voice-agent-button');
            if (buttonElement) {
              buttonElement.textContent = 'Continue on main platform';
              buttonElement.onclick = () => {
                window.open(this.agentUrl, '_blank');
              };
            }
            
            reject(new Error('Failed to load Ultravox SDK'));
          };
          
          document.head.appendChild(script);
        });
    });
  }

  // Inject CSS styles
  _injectStyles() {
    const styleId = 'voice-agent-widget-styles';
    
    // Only inject styles once
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      
      const css = `
        .voice-agent-widget {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          position: fixed;
          ${this.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
          ${this.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: ${this.theme === 'dark' ? '#2c2c2c' : '#ffffff'};
          color: ${this.theme === 'dark' ? '#ffffff' : '#333333'};
          border-radius: 16px;
          padding: 15px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          width: 220px;
          transition: all 0.3s ease;
          max-height: 300px;
          overflow: hidden;
        }
        
        .voice-agent-widget.expanded {
          max-height: 500px;
        }
        
        .voice-agent-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        
        .voice-agent-name {
          font-weight: 600;
          font-size: 16px;
          margin: 0;
          text-align: center;
        }
        
        .voice-agent-avatar-container {
          position: relative;
          margin-bottom: 15px;
        }
        
        .voice-agent-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid ${this.theme === 'dark' ? '#3a3a3a' : '#f0f0f0'};
          transition: all 0.3s ease;
        }
        
        .voice-agent-avatar.connecting {
          animation: pulse 1.5s infinite;
        }
        
        .voice-agent-avatar.speaking {
          animation: speak 0.5s infinite alternate;
        }
        
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        
        @keyframes speak {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        
        .voice-agent-status {
          font-size: 14px;
          margin: 8px 0;
          text-align: center;
        }
        
        .voice-agent-status.active {
          color: #4caf50;
        }
        
        .voice-agent-status.connecting {
          color: #ffc107;
        }
        
        .voice-agent-status.error {
          color: #f44336;
        }
        
        .voice-agent-button {
          background-color: #4285f4;
          color: white;
          border: none;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          margin-top: 8px;
          height: 40px;
        }
        
        .voice-agent-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .voice-agent-button:hover:not(:disabled) {
          background-color: #3367d6;
        }
        
        .voice-agent-button.end {
          background-color: #f44336;
        }
        
        .voice-agent-button.end:hover:not(:disabled) {
          background-color: #d32f2f;
        }
        
        .voice-agent-button.cancel {
          background-color: #ffc107;
          color: #333;
        }
        
        .voice-agent-button.cancel:hover:not(:disabled) {
          background-color: #ffb300;
        }
        
        .voice-agent-transcript {
          width: 100%;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 15px;
          padding: 10px;
          background-color: ${this.theme === 'dark' ? '#3a3a3a' : '#f5f5f5'};
          border-radius: 8px;
          font-size: 12px;
        }
        
        .transcript-message {
          margin-bottom: 10px;
        }
        
        .transcript-speaker {
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .transcript-message.agent .transcript-speaker {
          color: #4285f4;
        }
        
        .transcript-message.user .transcript-speaker {
          color: #4caf50;
        }
        
        .transcript-text {
          line-height: 1.4;
        }
        
        .connected-message, .ended-message {
          text-align: center;
          color: ${this.theme === 'dark' ? '#aaaaaa' : '#666666'};
          font-style: italic;
          margin: 5px 0;
        }
      `;
      
      styleElement.textContent = css;
      document.head.appendChild(styleElement);
    }
  }

  // Render the widget HTML
  _renderWidget() {
    this.container.innerHTML = `
      <div class="voice-agent-widget">
        <div class="voice-agent-header">
          <h3 class="voice-agent-name">${this.agentName}</h3>
        </div>
        <div class="voice-agent-avatar-container">
          <img src="${this.avatarUrl}" alt="${this.agentName}" class="voice-agent-avatar">
        </div>
        <div class="voice-agent-status idle">Click to talk with ${this.agentName}</div>
        <button class="voice-agent-button start">Start Call</button>
      </div>
    `;
  }

  // Set up event listeners
  _setupEventListeners() {
    const callButton = this.container.querySelector('.voice-agent-button');
    if (callButton) {
      callButton.addEventListener('click', this.toggleCall);
    }
  }
}

// Make available globally
window.VoiceAgentWidget = VoiceAgentWidget; 