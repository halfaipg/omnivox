# Ultravox Tool System Guide

The tool system allows your AI voice agent to access real-time data and perform actions during calls. This guide explains how to configure and use tools effectively.

## Quick Start

1. Enable tools in your `.env`:
   ```bash
   ULTRAVOX_USE_TOOLS=true
   ULTRAVOX_ENABLED_TOOLS=hangup,time,weather  # comma-separated list
   ```

2. Start using tools in calls:
   - Tools are automatically available to the AI
   - The AI will use them when relevant to the conversation
   - No additional setup needed for built-in tools

## Built-in Tools

| Tool | Description | Default Status |
|------|-------------|----------------|
| `hangup` | End calls naturally | Enabled |
| `time` | Get current time/date | Disabled |
| `weather` | Get weather info | Disabled |
| `queryCorpus` | Search knowledge base | Auto-enabled with RAG |

## Configuration Options

### Core Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `ULTRAVOX_USE_TOOLS` | Master switch for tool system | `false` |
| `ULTRAVOX_ENABLED_TOOLS` | Tools to enable | Empty (none) |
| `ULTRAVOX_USE_HANGUP` | Enable hangup tool | `true` |

### Tool-Specific Settings

Each tool can have its own configuration:

```bash
# Weather tool settings
WEATHER_API_KEY=your_api_key
WEATHER_DEFAULT_LOCATION=New York

# Time tool settings
TIME_FORMAT=12h  # or 24h
TIME_ZONE=UTC
```

## Creating Custom Tools

### 1. Basic Tool

```bash
# In your .env file:
ULTRAVOX_TOOL_1_NAME=price
ULTRAVOX_TOOL_1_DESCRIPTION=Get current crypto prices
ULTRAVOX_TOOL_1_URL=https://api.example.com/price
ULTRAVOX_TOOL_1_METHOD=GET
```

### 2. Tool with Parameters

```bash
ULTRAVOX_TOOL_2_NAME=translate
ULTRAVOX_TOOL_2_DESCRIPTION=Translate text
ULTRAVOX_TOOL_2_URL=https://api.example.com/translate
ULTRAVOX_TOOL_2_METHOD=POST
ULTRAVOX_TOOL_2_PARAMS=[
  {
    "name": "text",
    "location": "PARAMETER_LOCATION_BODY",
    "schema": {"type": "string"},
    "required": true
  },
  {
    "name": "target_lang",
    "location": "PARAMETER_LOCATION_QUERY",
    "schema": {"type": "string"},
    "required": true
  }
]
```

## Tool Response Format

Tools must return JSON in this format:

```json
{
  "success": true,
  "data": {
    "result": "The actual data...",
    "message": "Optional message for the AI"
  }
}
```

## Best Practices

1. **Security**:
   - Never expose sensitive credentials in tool descriptions
   - Use environment variables for API keys
   - Validate all inputs

2. **Performance**:
   - Keep tool response times under 2 seconds
   - Cache results when possible
   - Use timeouts for external APIs

3. **Reliability**:
   - Include error handling
   - Provide fallback values
   - Log tool usage for debugging

## Example Use Cases

### 1. Weather Updates
```bash
ULTRAVOX_TOOL_1_NAME=weather
ULTRAVOX_TOOL_1_DESCRIPTION=Get weather for a location
ULTRAVOX_TOOL_1_URL=https://api.weather.com/v1/current
ULTRAVOX_TOOL_1_METHOD=GET
ULTRAVOX_TOOL_1_PARAMS=[{"name":"location","required":true}]
WEATHER_API_KEY=your_api_key
```

### 2. Database Queries
```bash
ULTRAVOX_TOOL_2_NAME=query_db
ULTRAVOX_TOOL_2_DESCRIPTION=Search product database
ULTRAVOX_TOOL_2_URL=https://api.internal/db
ULTRAVOX_TOOL_2_METHOD=POST
ULTRAVOX_TOOL_2_PARAMS=[{"name":"query","required":true}]
```

## Debugging Tools

1. Enable debug mode:
   ```bash
   ULTRAVOX_TOOL_DEBUG=true
   ```

2. Check logs for tool calls:
   ```bash
   npm run logs:tools
   ```

3. Test tools directly:
   ```bash
   npm run test:tool weather
   ```

## Common Issues

| Issue | Solution |
|-------|----------|
| Tool not found | Check `ULTRAVOX_ENABLED_TOOLS` list |
| API errors | Verify API key and endpoint URL |
| Timeout errors | Increase `TOOL_TIMEOUT` setting |
| Parameter errors | Check parameter names and types |

## Support

- 📚 [Tool Documentation](https://docs.ultravox.ai/tools)
- 💬 [Discord Help](https://discord.gg/ultravox)
- 🐛 [Report Issues](https://github.com/aipowergrid/ultravox-integrations/issues) 