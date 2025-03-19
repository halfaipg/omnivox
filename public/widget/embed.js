/**
 * Voice Agent Widget Embed Script
 * 
 * Usage:
 * <script src="https://omnivox.io/widget/embed.js?voice=VOICE_ID&agent=AGENT_NAME&corpus=CORPUS_ID&prompt=SYSTEM_PROMPT&theme=light&position=bottom-right"></script>
 * 
 * Parameters:
 * - url: The shareable URL from index.html (optional if direct configuration used)
 * - voice: Voice ID for the agent (optional)
 * - agent: The agent's name (optional, default: 'AI Assistant')
 * - corpus: Knowledge base corpus ID for the agent (optional)
 * - prompt: System prompt for the agent (optional)
 * - avatar: URL to the agent's avatar image (optional)
 * - theme: 'light' or 'dark' (optional, default: 'light')
 * - position: 'bottom-right', 'bottom-left', 'top-right', 'top-left' (optional, default: 'bottom-right')
 * - name: Display name for the widget UI (optional, default: same as agent)
 */

(function() {
  // CLEAN IMPLEMENTATION - direct iframe with no outer boxes
  
  // Get script parameters
  const scriptTag = document.currentScript;
  const scriptUrl = new URL(scriptTag.src);
  const params = scriptUrl.searchParams;
  
  // Base domain for loading
  const BASE_DOMAIN = "https://omnivox.io";
  
  // Helper function to safely decode URL parameters
  function decodeParam(param) {
    if (!param) return param;
    try {
      return decodeURIComponent(param);
    } catch (e) {
      console.warn('Failed to decode parameter:', e);
      return param;
    }
  }
  
  // Configure from URL parameters
  const config = {
    agentUrl: params.get('url') || null,
    voiceId: params.get('voice') || null,
    corpusId: params.get('corpus') || null,
    systemPrompt: decodeParam(params.get('prompt')) || null,
    agentName: decodeParam(params.get('agent') || params.get('name') || 'AI Assistant'),
    displayName: decodeParam(params.get('name')) || null,
    avatarUrl: params.get('avatar'),
    theme: params.get('theme') || 'light',
    position: params.get('position') || 'bottom-right',
    minimized: params.get('minimized') !== 'false' // Default to minimized unless explicitly set to false
  };
  
  // Don't store 'undefined' as a string for voice ID
  if (config.voiceId === 'undefined') {
    config.voiceId = null;
  }
  
  // If we have a direct prompt parameter, log it
  if (params.has('prompt')) {
    console.log('Direct prompt parameter found:', {
      length: config.systemPrompt ? config.systemPrompt.length : 0,
      preview: config.systemPrompt ? config.systemPrompt.substring(0, 30) + '...' : 'null'
    });
  }
  
  // Extract parameters from agentUrl only if we don't have direct parameters
  if (config.agentUrl) {
    try {
      console.log('Parsing agentUrl:', config.agentUrl);
      const agentUrlObj = new URL(decodeParam(config.agentUrl));
      const agentParams = new URLSearchParams(agentUrlObj.search);
      
      console.log('Original params from script:', {
        prompt: params.has('prompt') ? 'provided (' + (params.get('prompt') ? params.get('prompt').length : 0) + ' chars)' : 'not set',
        agent: params.has('agent') ? params.get('agent') : 'not set',
        name: params.has('name') ? params.get('name') : 'not set',
        voice: params.has('voice') ? params.get('voice') : 'not set',
        corpus: params.has('corpus') ? params.get('corpus') : 'not set'
      });
      
      console.log('Params from agentUrl:', {
        prompt: agentParams.has('prompt') ? 'provided (' + (agentParams.get('prompt') ? agentParams.get('prompt').length : 0) + ' chars)' : 'not set',
        agent: agentParams.has('agent') ? agentParams.get('agent') : 'not set',
        voice: agentParams.has('voice') ? agentParams.get('voice') : 'not set',
        corpus: agentParams.has('corpus') ? agentParams.get('corpus') : 'not set'
      });
      
      // Helper function to doubly decode parameters if needed
      function getDecodedParam(params, key) {
        if (!params.has(key)) return null;
        const value = params.get(key);
        return decodeParam(value);
      }
      
      // Only override if not directly specified
      if (!params.has('voice') && agentParams.has('voice')) {
        config.voiceId = getDecodedParam(agentParams, 'voice');
      }
      
      if (!params.has('agent') && !params.has('name') && agentParams.has('agent')) {
        config.agentName = getDecodedParam(agentParams, 'agent');
      }
      
      if (!params.has('corpus') && agentParams.has('corpus')) {
        config.corpusId = getDecodedParam(agentParams, 'corpus');
      }
      
      // Only use prompt from agentUrl if we don't have a direct prompt parameter
      if (!params.has('prompt') && agentParams.has('prompt')) {
        config.systemPrompt = getDecodedParam(agentParams, 'prompt');
        console.log('Setting system prompt from agentUrl:', {
          length: config.systemPrompt ? config.systemPrompt.length : 0,
          preview: config.systemPrompt ? config.systemPrompt.substring(0, 30) + '...' : 'null'
        });
      }
      
      if (!params.has('avatar') && agentParams.has('avatar')) {
        config.avatarUrl = getDecodedParam(agentParams, 'avatar');
      }
      
      console.log('Final extracted config:', {
        agentName: config.agentName,
        voiceId: config.voiceId,
        corpusId: config.corpusId,
        systemPrompt: config.systemPrompt ? {
          length: config.systemPrompt.length,
          preview: config.systemPrompt.substring(0, 30) + '...'
        } : 'null',
        avatarUrl: config.avatarUrl ? config.avatarUrl.substring(0, 30) + '...' : 'null'
      });
    } catch (error) {
      console.error('Error parsing agentUrl:', error);
    }
  }
  
  // Generate agentUrl if needed
  if (!config.agentUrl && (config.voiceId || config.corpusId || params.get('agent') || config.systemPrompt)) {
    let queryString = '';
    
    if (config.voiceId && config.voiceId !== 'undefined') {
      queryString += 'voice=' + encodeURIComponent(config.voiceId) + '&';
    }
    if (params.get('agent')) queryString += 'agent=' + encodeURIComponent(params.get('agent')) + '&';
    if (config.corpusId) queryString += 'corpus=' + encodeURIComponent(config.corpusId) + '&';
    if (config.systemPrompt) queryString += 'prompt=' + encodeURIComponent(config.systemPrompt);
    
    if (queryString.endsWith('&')) {
      queryString = queryString.slice(0, -1);
    }
    
    config.agentUrl = `${BASE_DOMAIN}/?${queryString}`;
  }
  
  // Document ready promise
  function ready() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }
  
  // Generate iframe URL
  function generateIframeURL() {
    const url = new URL(`${BASE_DOMAIN}/widget/frame.html`);
    
    console.log('Generating iframe URL with config. System prompt present:', !!config.systemPrompt);
    
    if (config.systemPrompt) {
      console.log('System prompt details:', {
        length: config.systemPrompt.length,
        first50: config.systemPrompt.substring(0, 50) + '...'
      });
    }
    
    // Special handling for agent name
    console.log('Agent name from config:', config.agentName);
    
    // Handle avatar URL
    if (config.avatarUrl) {
      try {
        const isDataUrl = config.avatarUrl.startsWith('data:');
        const isLiteralPlaceholder = config.avatarUrl === '[base64-encoded-image]';
        
        if (isLiteralPlaceholder) {
          console.warn('Using avatar fallback for placeholder value');
          config.avatarUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSI0MCIgZmlsbD0iIzQyODVmNCIvPjxwYXRoIGQ9Ik00MCwyMCBDMzUsMjAgMzEsMjQgMzEsMjkgQzMxLDM0IDM1LDM4IDQwLDM4IEM0NSwzOCA0OSwzNCA0OSwyOSBDNDksMjQgNDUsMjAgNDAsMjAgWiBNMjUsNTggQzI1LDQ4IDMxLDQ0IDQwLDQ0IEM0OSw0NCA1NSw0OCA1NSw1OCBMNTUsNjAgTDI1LDYwIFoiIGZpbGw9IiNGRkZGRkYiLz48L3N2Zz4=';
        } else if (!isDataUrl) {
          try {
            const isSameOrigin = new URL(config.avatarUrl).origin === window.location.origin;
            const isFromBaseDomain = config.avatarUrl.startsWith(BASE_DOMAIN);
            
            if (!isSameOrigin && !isFromBaseDomain) {
              console.warn('Using direct URL for cross-origin avatar');
            }
          } catch (e) {
            console.warn('Invalid avatar URL, using fallback');
            config.avatarUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSI0MCIgZmlsbD0iIzQyODVmNCIvPjxwYXRoIGQ9Ik00MCwyMCBDMzUsMjAgMzEsMjQgMzEsMjkgQzMxLDM0IDM1LDM4IDQwLDM4IEM0NSwzOCA0OSwzNCA0OSwyOSBDNDksMjQgNDUsMjAgNDAsMjAgWiBNMjUsNTggQzI1LDQ4IDMxLDQ0IDQwLDQ0IEM0OSw0NCA1NSw0OCA1NSw1OCBMNTUsNjAgTDI1LDYwIFoiIGZpbGw9IiNGRkZGRkYiLz48L3N2Zz4=';
          }
        }
      } catch (e) {
        console.warn('Invalid avatar URL format, using fallback');
        config.avatarUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSI0MCIgZmlsbD0iIzQyODVmNCIvPjxwYXRoIGQ9Ik00MCwyMCBDMzUsMjAgMzEsMjQgMzEsMjkgQzMxLDM0IDM1LDM4IDQwLDM4IEM0NSwzOCA0OSwzNCA0OSwyOSBDNDksMjQgNDUsMjAgNDAsMjAgWiBNMjUsNTggQzI1LDQ4IDMxLDQ0IDQwLDQ0IEM0OSw0NCA1NSw0OCA1NSw1OCBMNTUsNjAgTDI1LDYwIFoiIGZpbGw9IiNGRkZGRkYiLz48L3N2Zz4=';
      }
    }
    
    // First add the non-prompt parameters to keep the URL cleaner
    // Ensure agent name is passed correctly - try all supported parameter names
    if (config.agentName) {
      url.searchParams.append('agentName', config.agentName);
      url.searchParams.append('name', config.agentName);
      console.log('Added agent name to iframe URL:', config.agentName);
    }
    
    if (config.voiceId && config.voiceId !== 'undefined') {
      url.searchParams.append('voice', config.voiceId);
    }
    
    if (config.corpusId) url.searchParams.append('corpus', config.corpusId);
    if (config.avatarUrl) url.searchParams.append('avatar', config.avatarUrl);
    if (config.theme) url.searchParams.append('theme', config.theme);
    if (config.position) url.searchParams.append('position', config.position);
    if (config.minimized !== undefined) url.searchParams.append('minimized', config.minimized);
    
    // Add the system prompt separately and at the end to ensure it's not truncated
    if (config.systemPrompt) {
      console.log('Adding systemPrompt to URL, length:', config.systemPrompt.length);
      url.searchParams.append('prompt', config.systemPrompt);
    }
    
    // Don't pass the agentUrl parameter to avoid confusion
    if (config.agentUrl) {
      console.log('Note: agentUrl is not being passed directly to the iframe');
    }
    
    const finalUrl = url.toString();
    console.log("Generated iframe URL:", finalUrl);
    return finalUrl;
  }
  
  // Handle iframe messages
  function handleIframeMessages(event) {
    const iframe = document.getElementById('omnivox-agent');
    if (!iframe || event.source !== iframe.contentWindow) return;
    
    if (event.data && event.data.type) {
      switch (event.data.type) {
        case 'resize':
          if (event.data.height && !iframe.dataset.minimized) {
            const height = Math.max(event.data.height, 160);
            iframe.style.height = `${height}px`;
          }
          break;
        
        case 'close':
          if (iframe) {
            document.body.removeChild(iframe);
            window.removeEventListener('message', handleIframeMessages);
          }
          break;
        
        case 'minimize':
          setMinimizedState(iframe, true);
          break;
        
        case 'expand':
          setMinimizedState(iframe, false);
          break;
          
        case 'toggle':
          const isCurrentlyMinimized = iframe.dataset.minimized === 'true';
          setMinimizedState(iframe, !isCurrentlyMinimized);
          break;
          
        case 'call_started':
          setMinimizedState(iframe, false);
          iframe.style.boxShadow = '0 8px 32px rgba(66, 133, 244, 0.3)';
          break;
          
        case 'call_ended':
          iframe.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.15)';
          break;
          
        case 'iframe_loaded':
          // Initial state is minimized by default
          setTimeout(() => {
            iframe.style.opacity = '1';
            iframe.style.transform = 'translateY(0)';
            
            // Tell the iframe if it should start minimized
            iframe.contentWindow.postMessage({ 
              type: config.minimized ? 'minimize' : 'expand' 
            }, '*');
          }, 100);
          break;
      }
    }
  }
  
  // Set minimized state
  function setMinimizedState(iframe, minimized) {
    if (!iframe) return;
    
    iframe.dataset.minimized = minimized;
    
    if (minimized) {
      // Minimized state (avatar bubble)
      iframe.style.width = '72px';
      iframe.style.height = '72px';
      iframe.style.borderRadius = '50%';
    } else {
      // Expanded state (full widget)
      iframe.style.width = window.innerWidth < 480 ? 'calc(100% - 40px)' : '280px';
      iframe.style.maxWidth = '280px';
      iframe.style.height = '320px';
      iframe.style.borderRadius = '18px';
    }
    
    // Notify iframe of state change
    iframe.contentWindow.postMessage({
      type: minimized ? 'minimize' : 'expand'
    }, '*');
  }
  
  // Create widget iframe
  function createWidget() {
    // Create bare iframe - no containers
    const iframe = document.createElement('iframe');
    iframe.src = generateIframeURL();
    iframe.id = 'omnivox-agent';
    iframe.allow = 'microphone; camera';
    iframe.setAttribute('frameBorder', '0');
    iframe.dataset.minimized = config.minimized;
    
    // Basic styling - start with size appropriate to minimized state if needed
    const initialWidth = config.minimized ? '72px' : '280px';
    const initialHeight = config.minimized ? '72px' : '320px';
    const initialBorderRadius = config.minimized ? '50%' : '18px';
    
    iframe.style.cssText = `
      position: fixed;
      z-index: 999999;
      width: ${initialWidth};
      height: ${initialHeight};
      border: none;
      overflow: hidden;
      border-radius: ${initialBorderRadius};
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      background: transparent;
      transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
      opacity: 0;
      transform: translateY(20px);
    `;
    
    // Position
    switch (config.position) {
      case 'bottom-right':
        iframe.style.right = '20px';
        iframe.style.bottom = '20px';
        iframe.style.transformOrigin = 'bottom right';
        break;
      case 'bottom-left':
        iframe.style.left = '20px';
        iframe.style.bottom = '20px';
        iframe.style.transformOrigin = 'bottom left';
        break;
      case 'top-right':
        iframe.style.right = '20px';
        iframe.style.top = '20px';
        iframe.style.transformOrigin = 'top right';
        break;
      case 'top-left':
        iframe.style.left = '20px';
        iframe.style.top = '20px';
        iframe.style.transformOrigin = 'top left';
        break;
      default:
        iframe.style.right = '20px';
        iframe.style.bottom = '20px';
        iframe.style.transformOrigin = 'bottom right';
    }
    
    // Mobile responsiveness (only applies when expanded)
    if (window.innerWidth < 480 && !config.minimized) {
      iframe.style.width = 'calc(100% - 40px)';
      iframe.style.maxWidth = '280px';
      iframe.style.left = '20px';
      iframe.style.right = '20px';
      iframe.style.bottom = '20px';
    }
    
    // Animation and resize handling
    iframe.onload = function() {
      setTimeout(() => {
        iframe.style.opacity = '1';
        iframe.style.transform = 'translateY(0)';
      }, 100);
      
      // Resize handler
      window.addEventListener('resize', () => {
        // Only apply responsive resizing when not minimized
        if (iframe.dataset.minimized !== 'true') {
          if (window.innerWidth < 480) {
            iframe.style.width = 'calc(100% - 40px)';
            iframe.style.maxWidth = '280px';
            iframe.style.left = '20px';
            iframe.style.right = '20px';
          } else {
            iframe.style.width = '280px';
            iframe.style.maxWidth = 'none';
            
            iframe.style.left = '';
            iframe.style.right = '';
            switch (config.position) {
              case 'bottom-right':
                iframe.style.right = '20px';
                iframe.style.bottom = '20px';
                break;
              case 'bottom-left':
                iframe.style.left = '20px';
                iframe.style.bottom = '20px';
                break;
              case 'top-right':
                iframe.style.right = '20px';
                iframe.style.top = '20px';
                break;
              case 'top-left':
                iframe.style.left = '20px';
                iframe.style.top = '20px';
                break;
            }
          }
        }
      });
    };
    
    // Error handling
    iframe.onerror = function() {
      console.error('Failed to load iframe');
    };
    
    // Fix MutationObserver issues
    const originalMutationObserver = window.MutationObserver;
    if (originalMutationObserver) {
      try {
        window.MutationObserver = function(callback) {
          const observer = new originalMutationObserver(callback);
          const originalObserve = observer.observe;
          
          observer.observe = function(target, options) {
            if (!target || !(target instanceof Node)) {
              console.warn('Invalid MutationObserver target, using document body');
              return originalObserve.call(this, document.body, options);
            }
            return originalObserve.call(this, target, options);
          };
          
          return observer;
        };
        
        window.MutationObserver.prototype = originalMutationObserver.prototype;
      } catch (e) {
        console.warn('Failed to patch MutationObserver');
        window.MutationObserver = originalMutationObserver;
      }
    }
    
    // Add iframe directly to body - no containers
    document.body.appendChild(iframe);
    
    // Message handling
    window.addEventListener('message', handleIframeMessages);
    
    return iframe;
  }
  
  // Initialize
  ready().then(createWidget);
})(); 