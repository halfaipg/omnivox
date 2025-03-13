<<<<<<< HEAD
# Ultravox Voice Integration
=======
# Ultravox Telephony Integration
>>>>>>> 45250697e5d76e96635ad5ab3ea27dc1824af887

A powerful integration that connects Ultravox's AI voice capabilities with telephony services (Twilio and Telnyx) for creating intelligent voice agents capable of natural conversations over phone calls.

## Features

- **Multi-Provider Support**: Works with both Twilio and Telnyx
- **Inbound Call Handling**: Automatically answer and process incoming calls
- **Outbound Call Initiation**: Programmatically make outgoing calls
- **Web Interface**: User-friendly UI for making calls and managing knowledge bases
- **Knowledge Base Integration**: RAG (Retrieval Augmented Generation) support with custom corpora
- **Tool System**: Extensible tool framework for real-time data access
- **Voice Customization**: Select from multiple AI voices
- **System Prompt Control**: Customize AI behavior with detailed prompts
- **Call Control**: Built-in hangUp tool for natural call termination

## Prerequisites

- Node.js v16 or higher
- Twilio account with phone number OR Telnyx account with phone number
- Ultravox API key (from [Ultravox](https://ultravox.ai))
- Public URL for webhook endpoints (for production)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ultravox-integrations.git
   cd ultravox-integrations/twilio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   ```bash
   cp .env.template .env
   ```

4. Edit the `.env` file with your credentials (see Configuration section)

5. Start the server:
   ```bash
   npm start
   ```

## Configuration

The system is highly configurable through environment variables in the `.env` file:

### Core Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `VOICE_PROVIDER` | Voice provider to use (`twilio` or `telnyx`) | `twilio` |
| `PORT` | Port for the web server | `3000` |

### Twilio Configuration

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Your Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Your Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number (with country code) |

### Telnyx Configuration

| Variable | Description |
|----------|-------------|
| `TELNYX_API_KEY` | Your Telnyx API key |
| `TELNYX_PUBLIC_KEY` | Your Telnyx public key |
| `TELNYX_APP_ID` | Your Telnyx application ID |
| `TELNYX_PHONE_NUMBER` | Your Telnyx phone number (with country code) |

### Ultravox Configuration

| Variable | Description |
|----------|-------------|
| `ULTRAVOX_API_KEY` | Your Ultravox API key |
| `ULTRAVOX_API_URL` | Ultravox API URL |
| `ULTRAVOX_AGENT_ID` | Ultravox agent ID |
| `ULTRAVOX_CORPUS_ID` | Default corpus ID for RAG (optional) |

### AI Assistant Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_ASSISTANT_NAME` | Name of the AI assistant | `Jimothy` |
| `AI_ASSISTANT_VOICE_ID` | Voice ID to use | Ultravox default |
| `AI_TEMPERATURE` | Temperature for AI responses | `0.3` |
| `INBOUND_FIRST_SPEAKER` | Who speaks first on inbound calls | `FIRST_SPEAKER_AGENT` |
| `OUTBOUND_FIRST_SPEAKER` | Who speaks first on outbound calls | `FIRST_SPEAKER_USER` |
| `INBOUND_SYSTEM_PROMPT` | System prompt for inbound calls | See template |
| `OUTBOUND_SYSTEM_PROMPT` | System prompt for outbound calls | See template |

### UI Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `UI_LOGO_URL` | URL for the logo in the web UI | Default logo |
| `UI_APP_NAME` | Application name in the web UI | `AI Voice Agent` |

### Tool System Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ULTRAVOX_USE_TOOLS` | Enable/disable the tool system | `false` |
| `ULTRAVOX_USE_HANGUP` | Enable/disable the hangUp tool | `true` |
| `ULTRAVOX_CALL_TOOLS` | Comma-separated list of tools to enable | Empty |

## Usage

### Web Interface

Access the web interface at `http://localhost:3000` (or your deployed URL) to:

1. Make outbound calls
2. Create and manage knowledge bases
3. Configure call settings

### Inbound Calls

1. Configure your Twilio/Telnyx phone number's webhook to point to:
   - For both Twilio and Telnyx: `https://your-server.com/incoming`
   
   The system automatically detects the provider based on the request format.

2. When someone calls your number, the system will automatically:
   - Answer the call
   - Connect to Ultravox
   - Apply your configured system prompt
   - Enable configured tools and RAG if specified

### Outbound Calls

#### Using the Web Interface

1. Navigate to `http://localhost:3000`
2. Fill in the phone number and optional parameters
3. Click "Initiate Call"

#### Using the API

```bash
curl -X POST http://localhost:3000/outgoing \
  -H "Content-Type: application/json" \
  -d '{
    "destinationNumber": "+1234567890",
    "systemPrompt": "You are a helpful assistant...",
    "voiceId": "optional-voice-id",
    "corpusId": "optional-corpus-id",
    "tools": ["optional", "tool", "names"],
    "agentName": "Optional Name"
  }'
```

#### Using the CLI Tool

```bash
node outbound-call.js
```

Follow the prompts to enter a phone number and optional system prompt.

## Tool System

The system supports an extensible tool framework that allows the AI to access real-time data during calls.

### Built-in Tools

- **hangUp**: Allows the AI to end the call naturally (enabled by default)
- **queryCorpus**: Automatically added when a corpus is configured

### Custom Tools

You can define custom tools in your `.env` file:

```
ULTRAVOX_TOOL_1_NAME=weather
ULTRAVOX_TOOL_1_DESCRIPTION=Get current weather for a location
ULTRAVOX_TOOL_1_URL=https://api.example.com/weather
ULTRAVOX_TOOL_1_METHOD=GET
ULTRAVOX_TOOL_1_PARAMS=[{"name":"location","location":"PARAMETER_LOCATION_QUERY","schema":{"type":"string"},"required":true}]
```

See `README.TOOLS.md` for detailed information on configuring tools.

## Knowledge Base (RAG) Support

The system supports Retrieval Augmented Generation (RAG) through Ultravox corpora:

1. Create a corpus through the web interface or Ultravox API
2. Add URLs or documents to the corpus
3. Use the corpus in calls by:
   - Selecting it in the web interface
   - Setting `ULTRAVOX_CORPUS_ID` in `.env`
   - Passing `corpusId` in the API call

## Development

For local development with webhooks, you can use either Cloudflare Tunnel or ngrok:

### Using Cloudflare Tunnel (Recommended)

1. Install the Cloudflare Tunnel client:
   ```bash
   # On macOS
   brew install cloudflared
   
   # On Linux
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   
   # On Windows (using Powershell)
   Invoke-WebRequest -Uri https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.msi -OutFile cloudflared.msi
   Start-Process msiexec.exe -ArgumentList '/i', 'cloudflared.msi', '/quiet' -Wait
   ```

2. Start your server:
   ```bash
   npm start
   ```

3. In another terminal, start Cloudflare Tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

4. Configure your Twilio/Telnyx webhook with the Cloudflare Tunnel URL provided (https://[random]-[random].trycloudflare.com)

### Using ngrok

1. Install ngrok:
   ```bash
   npm install -g ngrok
   ```

2. Start your server:
   ```bash
   npm start
   ```

3. In another terminal, start ngrok:
   ```bash
   ngrok http 3000
   ```

4. Configure your Twilio/Telnyx webhook with the ngrok URL provided

## Troubleshooting

### Common Issues

- **Call not connecting**: Check your Twilio/Telnyx and Ultravox credentials
- **No audio**: Ensure your phone number is properly configured
- **Tools not working**: Check `ULTRAVOX_USE_TOOLS` is set to `true`
- **RAG not working**: Verify corpus exists and is in READY state
- **hangUp tool not working**: Ensure `ULTRAVOX_USE_HANGUP` is not set to `false`

### Logs

Check the server logs for detailed error messages and debugging information.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Home page with web interface |
| `/health` | GET | Health check endpoint |
| `/config` | GET | UI configuration |
| `/incoming` | POST | Webhook for incoming Twilio calls |
| `/telnyx-webhook` | POST | Webhook for Telnyx events |
| `/outgoing` | POST | Initiate outbound calls |
| `/voices` | GET | List available voices |
| `/list-corpora` | GET | List available corpora |
| `/create-corpus` | POST | Create a new corpus |
| `/corpus/:corpusId` | DELETE | Delete a corpus |
| `/test-telnyx` | GET | Test Telnyx configuration |

## License

[MIT License](LICENSE)

## Acknowledgements

- [Ultravox](https://ultravox.ai) for the AI voice technology
- [Twilio](https://twilio.com) and [Telnyx](https://telnyx.com) for telephony services 
