/**
 * Ultravox Tools Configuration
 * 
 * This file contains the definitions for all custom tools used with Ultravox.
 * Each tool is defined with a name, description, and other properties.
 */

import 'dotenv/config';
import dotenv from 'dotenv';

// Load tools-specific environment variables
dotenv.config({ path: '.env.tools' });

// Base tools array
const tools = [
  // Add calendar tool
  {
    name: 'calendar',
    description: process.env.CALENDAR_OWNER 
      ? `Check ${process.env.CALENDAR_OWNER}'s calendar availability and schedule appointments. Use this tool when the user wants to schedule a meeting or call with ${process.env.CALENDAR_OWNER}.`
      : 'Check calendar availability and schedule appointments. Use this tool when the user wants to schedule a meeting or check when you are available.',
    url: `https://omnivox.io/api/calendar/availability`,
    method: 'GET',
    params: [],
    responseSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        availability: {
          type: 'object',
          properties: {
            availabilityText: { type: 'string', description: 'Natural language description of availability' },
            availableDays: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  formattedDate: { type: 'string' },
                  timeOfDayAvailable: { 
                    type: 'array',
                    items: { type: 'string', enum: ['morning', 'afternoon', 'evening'] }
                  }
                }
              }
            }
          }
        }
      }
    },
    examples: [
      {
        query: process.env.CALENDAR_OWNER 
          ? `When can I speak with ${process.env.CALENDAR_OWNER}?`
          : "When are you available for a meeting?",
        response: process.env.CALENDAR_OWNER
          ? `${process.env.CALENDAR_OWNER} is available on Monday, March 18th in the morning and afternoon, and on Tuesday, March 19th in the afternoon. Would either of those work for you?`
          : "I'm available on Monday, March 18th in the morning and afternoon, and on Tuesday, March 19th in the afternoon. Would either of those work for you?"
      },
      {
        query: process.env.CALENDAR_OWNER
          ? `I'd like to schedule a call with ${process.env.CALENDAR_OWNER}`
          : "I'd like to schedule a call",
        response: process.env.CALENDAR_OWNER
          ? `I'd be happy to help you schedule a call with ${process.env.CALENDAR_OWNER}. They're available on Wednesday, March 20th in the morning and Thursday, March 21st in the afternoon. Which day and time would work better for you?`
          : "I'd be happy to help you schedule a call. I'm available on Wednesday, March 20th in the morning and Thursday, March 21st in the afternoon. Which day and time would work better for you?"
      }
    ]
  },
  // Add calendar scheduling tool
  {
    name: 'calendar-schedule',
    description: process.env.CALENDAR_OWNER 
      ? `Schedule an appointment with ${process.env.CALENDAR_OWNER}. Use this tool after checking availability when the user has selected a specific date and time.`
      : 'Schedule an appointment. Use this tool after checking availability when the user has selected a specific date and time.',
    url: `https://omnivox.io/api/calendar/schedule`,
    method: 'POST',
    params: [
      {
        name: 'startTime',
        location: 'PARAMETER_LOCATION_BODY',
        schema: { type: 'string', format: 'date-time' },
        required: true
      },
      {
        name: 'endTime',
        location: 'PARAMETER_LOCATION_BODY',
        schema: { type: 'string', format: 'date-time' },
        required: true
      },
      {
        name: 'summary',
        location: 'PARAMETER_LOCATION_BODY',
        schema: { type: 'string' },
        required: true
      },
      {
        name: 'description',
        location: 'PARAMETER_LOCATION_BODY',
        schema: { type: 'string' },
        required: false
      },
      {
        name: 'attendees',
        location: 'PARAMETER_LOCATION_BODY',
        schema: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string' }
            }
          }
        },
        required: false
      }
    ],
    responseSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        event: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            summary: { type: 'string' },
            description: { type: 'string' },
            start: { type: 'object' },
            end: { type: 'object' },
            htmlLink: { type: 'string' }
          }
        }
      }
    },
    examples: [
      {
        query: process.env.CALENDAR_OWNER 
          ? `I'd like to schedule a call with ${process.env.CALENDAR_OWNER} on Monday at 10 AM`
          : "Let's schedule a meeting for Tuesday at 2 PM",
        response: process.env.CALENDAR_OWNER
          ? `Great! I've scheduled your call with ${process.env.CALENDAR_OWNER} for Monday at 10 AM. You'll receive a calendar invitation shortly.`
          : "Perfect! I've scheduled our meeting for Tuesday at 2 PM. You'll receive a calendar invitation shortly."
      }
    ]
  }
];

// Load additional tools from environment variables
function loadToolsFromEnv() {
  const envTools = [];
  let i = 1;
  
  // Look for ULTRAVOX_TOOL_1, ULTRAVOX_TOOL_2, etc.
  while (true) {
    const toolPrefix = `ULTRAVOX_TOOL_${i}`;
    const name = process.env[`${toolPrefix}_NAME`];
    
    if (!name) break;
    
    const description = process.env[`${toolPrefix}_DESCRIPTION`];
    const url = process.env[`${toolPrefix}_URL`];
    const method = process.env[`${toolPrefix}_METHOD`] || 'GET';
    
    // Parse JSON fields if they exist
    let params, headers, responseSchema, examples;
    
    try {
      params = process.env[`${toolPrefix}_PARAMS`] ? JSON.parse(process.env[`${toolPrefix}_PARAMS`]) : undefined;
    } catch (e) {
      console.warn(`Failed to parse ${toolPrefix}_PARAMS as JSON:`, e);
    }
    
    try {
      headers = process.env[`${toolPrefix}_HEADERS`] ? JSON.parse(process.env[`${toolPrefix}_HEADERS`]) : undefined;
    } catch (e) {
      console.warn(`Failed to parse ${toolPrefix}_HEADERS as JSON:`, e);
    }
    
    try {
      responseSchema = process.env[`${toolPrefix}_RESPONSE_SCHEMA`] ? JSON.parse(process.env[`${toolPrefix}_RESPONSE_SCHEMA`]) : undefined;
    } catch (e) {
      console.warn(`Failed to parse ${toolPrefix}_RESPONSE_SCHEMA as JSON:`, e);
    }
    
    try {
      examples = process.env[`${toolPrefix}_EXAMPLES`] ? JSON.parse(process.env[`${toolPrefix}_EXAMPLES`]) : undefined;
    } catch (e) {
      console.warn(`Failed to parse ${toolPrefix}_EXAMPLES as JSON:`, e);
    }
    
    envTools.push({
      name,
      description,
      url,
      method,
      params,
      headers,
      responseSchema,
      examples
    });
    
    i++;
  }
  
  return envTools;
}

// Combine base tools with environment tools
export { tools, loadToolsFromEnv };