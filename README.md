# Ultravox Voice Integration

A powerful integration that connects Ultravox's AI voice capabilities with telephony services (Twilio and Telnyx) for creating intelligent voice agents capable of natural conversations over phone calls.

## Quick Start (5 minutes)

1. Get your credentials ready:
   - Ultravox API key from [Ultravox Dashboard](https://ultravox.ai)
   - Either Twilio OR Telnyx credentials (see [Choosing a Provider](#choosing-a-provider))

2. Clone and install:
   ```bash
   git clone https://github.com/aipowergrid/ultravox-integrations.git
   cd ultravox-integrations/twilio
   npm install
   ```

3. Set up your environment:
   ```bash
   cp .env.template .env
   # Edit .env with your credentials
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open http://localhost:3000 in your browser

## Features

- 🎯 **Production Ready**: Enterprise-grade voice AI integration
- 🔄 **Multi-Provider**: Works with both Twilio and Telnyx (telnyx wip)
- 📞 **Full Call Control**: Handle inbound/outbound calls with ease
- 🧠 **Knowledge Base**: Add custom knowledge to your AI with RAG corpus support
- 🛠️ **Extensible Tools**: Real-time data access during calls
- 🎤 **Voice Options**: Multiple AI voices to choose from
- 🎭 **Customizable Behavior**: Fine-tune AI responses with system prompts
- 🌐 **Modern UI**: Clean web interface for call management

## Choosing a Provider

### Twilio
- Easier to get started
- More beginner-friendly
- Higher per-minute costs
- Get started at [Twilio](https://www.twilio.com/try-twilio)


## Prerequisites

- Node.js v16 or higher
- npm v7 or higher
- A Twilio account OR Telnyx account with:
  - Account credentials
  - At least one phone number
- Ultravox API key
- For production: A public URL for webhooks

## Detailed Setup Guide

### 1. Environment Setup

Create your `.env` file:
```bash
cp .env.template .env
```

Required variables:
```bash
# Core settings
VOICE_PROVIDER=twilio  # or telnyx
PORT=3000

# Ultravox settings (Required)
ULTRAVOX_API_KEY=your_api_key
ULTRAVOX_API_URL=https://api.ultravox.ai
ULTRAVOX_AGENT_ID=your_agent_id

# If using Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# If using Telnyx
TELNYX_API_KEY=your_key
TELNYX_PUBLIC_KEY=your_public_key
TELNYX_APP_ID=your_app_id
TELNYX_PHONE_NUMBER=+1234567890
```

### 2. Local Development Setup

For testing webhooks locally, use either:

#### Option A: Cloudflare Tunnel (Recommended)
```bash
# Install cloudflared
brew install cloudflared  # macOS
# or
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb  # Linux

# Start tunnel
cloudflared tunnel --url http://localhost:3000
```

#### Option B: ngrok
```bash
npm install -g ngrok
ngrok http 3000
```

### 3. Configure Webhook URLs

#### For Twilio:
1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to Phone Numbers → Manage → Active numbers
3. Click your number
4. Under "Voice & Fax", set:
   - Webhook URL: `https://your-tunnel-url/incoming`
   - Method: POST

#### For Telnyx:
1. Go to [Telnyx Portal](https://portal.telnyx.com)
2. Navigate to Numbers → My Numbers
3. Click your number
4. Set webhook URL to: `https://your-tunnel-url/telnyx-webhook`

## Usage Guide

### Making Outbound Calls

#### 1. Using the Web Interface
1. Open http://localhost:3000
2. Enter the destination phone number
3. (Optional) Customize:
   - Voice selection
   - Knowledge base
   - System prompt
   - Tools
4. Click "Initiate Call"

#### 2. Using the API
```bash
# Example 1: With corpus enabled
curl -X POST http://localhost:3000/outgoing \
  -H "Content-Type: application/json" \
  -d '{
    "destinationNumber": "+1234567890",
    "systemPrompt": "You are a helpful assistant...",
    "voiceId": "optional-voice-id",
    "corpusId": "your-corpus-id",
    "tools": ["optional", "tool", "names"]
  }'

# Example 2: With corpus disabled (either omit corpusId or set to null)
curl -X POST http://localhost:3000/outgoing \
  -H "Content-Type: application/json" \
  -d '{
    "destinationNumber": "+1234567890",
    "systemPrompt": "You are a helpful assistant...",
    "voiceId": "optional-voice-id",
    "corpusId": null,
    "tools": ["optional", "tool", "names"]
  }'
```

Note: To disable the corpus (RAG) functionality:
- Either omit the `corpusId` field completely
- Or explicitly set `"corpusId": null`
- This will override any default corpus set in your `.env` file

### Setting Up Knowledge Bases

1. From the web interface:
   - Scroll to "Create Knowledge Base Corpus"
   - Enter corpus name
   - Add URLs to include (documentation, GitHub READMEs, etc.)
   - Click "Create Corpus"

2. Use in calls by:
   - Selecting from dropdown in web interface
   - Setting `ULTRAVOX_CORPUS_ID` in `.env`
   - Including in API calls

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Call not connecting | Double-check credentials in `.env` |
| No audio | Verify phone number format (E.164) |
| Webhook errors | Ensure tunnel URL is correct and server is running |
| Tools not working | Set `ULTRAVOX_USE_TOOLS=true` in `.env` |
| RAG not working | Wait for corpus to show "READY" status |
| Cloudflare "Too Many Redirects" | 1. Check your Express app isn't forcing HTTPS redirects<br>2. Ensure no conflicting proxy settings in your code<br>3. Remove any URL rewriting middleware<br>4. If using app.use(express.static(...)), place it after your routes<br>5. Check for circular redirects in your routing logic |

### Common Cloudflare Tunnel Issues

#### Too Many Redirects
If you're seeing "Too Many Redirects" with Cloudflare Tunnel:

1. **Check your Express configuration**:
   ```javascript
   // Remove or modify any forced HTTPS redirects
   // DON'T use code like this with Cloudflare Tunnel:
   app.use((req, res, next) => {
     if (!req.secure) {
       return res.redirect('https://' + req.headers.host + req.url);
     }
     next();
   });
   ```

2. **Verify your middleware order**:
   ```javascript
   // CORRECT order:
   app.use(express.json());
   app.use(routes);  // Your route handlers
   app.use(express.static('public'));  // Static files last
   ```

3. **Check for proxy settings**:
   ```javascript
   // If needed, configure trust proxy correctly:
   app.set('trust proxy', true);  // Only if behind a proxy
   ```

4. **Temporary Debug Solution**:
   ```bash
   # Start cloudflared with insecure mode (temporary debug only)
   cloudflared tunnel --no-tls-verify --url http://localhost:3000
   ```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/outgoing` | POST | Start outbound call |
| `/incoming` | POST | Handle inbound calls |
| `/voices` | GET | List available voices |
| `/list-corpora` | GET | List knowledge bases |
| `/create-corpus` | POST | Create knowledge base |
| `/corpus/:id` | DELETE | Delete knowledge base |
| `/health` | GET | Service health check |

For detailed API documentation, see our [API Guide](docs/API.md).

## Support & Community

- 📚 [Documentation](https://docs.ultravox.ai)
- 💬 [Discord Community](https://discord.gg/ultravox)
- 🐛 [Issue Tracker](https://github.com/aipowergrid/ultravox-integrations/issues)
- 📧 [Email Support](mailto:support@ultravox.ai)

## License

[MIT License](LICENSE)

## Acknowledgements

- [Ultravox](https://ultravox.ai) for voice AI technology
- [Twilio](https://twilio.com) and [Telnyx](https://telnyx.com) for telephony services
