# Voice Agent Widget

A lightweight, embeddable widget for adding voice agent capabilities to any website using WebRTC.

## Features

- WebRTC-based voice calls
- Customizable avatar
- Light and dark themes
- Responsive design
- Easy integration with any website
- Uses sharable URLs from the main voice agent interface

## Quick Start

### Option 1: Simple Integration (One Line)

Add this script tag to your website's HTML:

```html
<script src="https://yourdomain.com/widget/embed.js?url=YOUR_SHAREABLE_URL&avatar=https://example.com/avatar.png&theme=light&position=bottom-right"></script>
```

Replace `YOUR_SHAREABLE_URL` with the shareable URL from the main voice agent interface.

### Option 2: Manual Integration

1. Add the widget script to your page:

```html
<script src="https://yourdomain.com/widget/voice-agent-widget.js"></script>
```

2. Create a container element:

```html
<div id="voice-agent-container"></div>
```

3. Initialize the widget:

```html
<script>
  // Initialize the widget
  const voiceAgent = new VoiceAgentWidget({
    agentUrl: 'YOUR_SHAREABLE_URL_HERE',
    avatarUrl: 'https://example.com/avatar.png', // Optional
    agentName: 'AI Assistant', // Optional
    theme: 'light', // 'light' or 'dark'
    position: 'bottom-right' // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  });
  
  // Mount the widget to the container
  voiceAgent.mount('voice-agent-container');
</script>
```

## Configuration Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `agentUrl` | String | Yes | - | The shareable URL from the main voice agent interface |
| `avatarUrl` | String | No | Default avatar | URL to the avatar image |
| `agentName` | String | No | 'AI Assistant' | Display name for the voice agent |
| `theme` | String | No | 'light' | Widget theme ('light' or 'dark') |
| `position` | String | No | 'bottom-right' | Widget position ('bottom-right', 'bottom-left', 'top-right', 'top-left') |

## Getting a Shareable URL

1. Go to the main voice agent interface
2. Configure your voice agent settings (voice, agent name, etc.)
3. After submitting, you'll see a "Shareable Link" section
4. Copy this URL to use with the widget

## Browser Compatibility

- Chrome 74+
- Firefox 75+
- Safari 13+
- Edge 79+

## Privacy Considerations

- The widget requests microphone access only when a call is initiated
- All communication goes through the Ultravox API
- No audio data is stored by the widget itself

## Customization

### Custom Styling

You can override the default styles by adding CSS rules that target the widget's classes:

```css
.voice-agent-widget {
  /* Custom styles */
}

.voice-agent-avatar {
  /* Custom avatar styles */
}

.voice-agent-button {
  /* Custom button styles */
}
```

## Troubleshooting

### Widget doesn't appear
- Check that the shareable URL is correct
- Ensure there are no JavaScript errors in the console

### Cannot connect to voice agent
- Check that the user has granted microphone permissions
- Verify that the shareable URL contains valid voice and agent parameters

### Audio quality issues
- Recommend using headphones for better audio quality
- Check the user's internet connection 