/**
 * Tool Manager Utility
 * 
 * Provides functions for working with Ultravox tools in the application.
 */

import { tools, loadToolsFromEnv } from '../config/tools.js';

/**
 * Get the list of available tools by name
 * @param {Array<string>} toolNames - Optional array of specific tool names to retrieve
 * @returns {Array} - Array of tool configurations in the format Ultravox expects
 */
function getToolsByName(toolNames = null) {
  // Get all tools (base + env)
  const allTools = [...tools, ...loadToolsFromEnv()];
  
  // If no specific tools requested, return all tools
  if (!toolNames || toolNames.length === 0) {
    return allTools.map(tool => ({ toolName: tool.name }));
  }
  
  // Otherwise, return only the requested tools
  return toolNames
    .filter(name => allTools.some(tool => tool.name === name)) // Only include tools that exist
    .map(name => ({ toolName: name }));
}

/**
 * Get temporary tool definitions
 * This is useful if you need to use tools that haven't been registered yet
 * @param {Array<string>} toolNames - Optional array of specific tool names to retrieve
 * @returns {Array} - Array of temporary tool definitions
 */
function getTemporaryTools(toolNames = null) {
  // Get all tools (base + env)
  const allTools = [...tools, ...loadToolsFromEnv()];
  
  // Filter tools by name if provided
  const toolsToInclude = toolNames 
    ? allTools.filter(tool => toolNames.includes(tool.name))
    : allTools;
  
  // Convert to temporary tool format
  return toolsToInclude.map(toolConfig => {
    // Create a temporary tool object with only the fields that Ultravox accepts
    const temporaryTool = {
      modelToolName: toolConfig.name,
      description: toolConfig.description,
      dynamicParameters: toolConfig.params || []
    };

    // If mockResponse is provided, use client field instead of HTTP
    if (toolConfig.mockResponse) {
      temporaryTool.client = {
        name: "mock",
        config: {
          response: JSON.stringify(toolConfig.mockResponse)
        }
      };
    } else {
      temporaryTool.http = {
        baseUrlPattern: toolConfig.url,
        httpMethod: toolConfig.method || 'GET'
      };
    }

    return {
      temporaryTool
    };
  });
}

/**
 * Get tool configurations for an Ultravox call
 * 
 * Uses env vars to determine whether to use permanent or temporary tools:
 * - ULTRAVOX_USE_PERMANENT_TOOLS="true" - Use permanent tools (assumes tools are registered)
 * - ULTRAVOX_USE_PERMANENT_TOOLS="false" or undefined - Use temporary tools
 * 
 * @param {Array<string>} toolNames - Optional array of specific tool names to include
 * @returns {Array} - Array of tool configurations ready to include in a call
 */
function getToolsForCall(toolNames = null) {
  // Check if tools should be used at all
  if (process.env.ULTRAVOX_USE_TOOLS !== 'true') {
    return [];
  }
  
  // Determine whether to use permanent or temporary tools
  const usePermanent = process.env.ULTRAVOX_USE_PERMANENT_TOOLS === 'true';
  
  // If using permanent tools, return tool references
  if (usePermanent) {
    return getToolsByName(toolNames);
  }
  
  // Otherwise, return temporary tool definitions
  return getTemporaryTools(toolNames);
}

export {
  getToolsByName,
  getTemporaryTools,
  getToolsForCall
}; 