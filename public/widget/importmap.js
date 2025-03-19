// Import map to resolve module specifiers for browser ESM imports
const importMap = {
  imports: {
    // Use specific version of livekit-client that we know works
    "livekit-client": "https://cdn.jsdelivr.net/npm/livekit-client@1.11.2/dist/livekit-client.esm.mjs"
  }
};

// Function to get the base origin from the current script
function getBaseOrigin() {
  // Try to find our own script
  const scripts = document.querySelectorAll('script');
  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src || '';
    if (src.includes('importmap.js')) {
      try {
        const url = new URL(src);
        return url.origin;
      } catch (e) {
        console.error('Error parsing script URL:', e);
      }
    }
  }
  // Fallback to explicit omnivox.io domain
  return "https://omnivox.io";
}

// Create the import map script element with type="importmap"
const importMapScript = document.createElement('script');
importMapScript.type = 'importmap';
importMapScript.textContent = JSON.stringify(importMap);

// Add it to the document head
document.head.appendChild(importMapScript); 