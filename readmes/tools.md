# ExuluTool Class Documentation

## Overview

The `ExuluTool` class is a core component of the Exulu framework that wraps functionality into reusable tools that can be used by AI agents. Tools can be functions, context retrievers, or even other agents.

## Class Definition

```typescript
export class ExuluTool {
    public id: string;
    public name: string;
    public description: string;
    public inputSchema?: ZodSchema;
    public type: "context" | "function" | "agent";
    public tool: Tool
    public config: {
        name: string,
        description: string
    }[]
}
```

## Constructor

```typescript
constructor({ id, name, description, inputSchema, type, execute, config }: {
    id: string,
    name: string,
    description: string,
    inputSchema?: ZodSchema,
    type: "context" | "function" | "agent",
    config: {
        name: string,
        description: string
    }[],
    execute: (inputs: any) => Promise<any>
})
```

### Parameters

- **id**: Unique identifier for the tool
- **name**: Display name of the tool (will be sanitized using `sanitizeToolName`)
- **description**: Description of what the tool does
- **inputSchema**: Optional Zod schema defining the expected input parameters
- **type**: Type of tool - can be "context", "function", or "agent"
- **config**: Array of configuration options that can be set for this tool
- **execute**: Async function that implements the tool's functionality

## Tool Types

### 1. Function Tools
Custom functions that perform specific operations.

```typescript
const myTool = new ExuluTool({
    id: "my-custom-tool",
    name: "My Custom Tool",
    description: "Performs a custom operation",
    type: "function",
    inputSchema: z.object({
        input: z.string().describe("The input text to process")
    }),
    config: [],
    execute: async ({ input, providerapikey, user, role, config }) => {
        // Your custom logic here
        return `Processed: ${input}`;
    }
});
```

### 2. Context Tools
Generated automatically from `ExuluContext` instances via the `context.tool()` method.

```typescript
// Automatically created by ExuluContext
const contextTool = myContext.tool();
// This creates a tool that retrieves information from the context
```

### 3. Agent Tools
Generated automatically from `ExuluAgent` instances via the `agent.tool()` method.

```typescript
// Automatically created by ExuluAgent
const agentTool = myAgent.tool();
// This creates a tool that calls another agent
```

## Execute Function Parameters

When implementing the `execute` function, you receive an object with the following properties:

- **[input parameters]**: Any parameters defined in your `inputSchema`
- **providerapikey**: API key for the AI provider
- **user**: Current user identifier
- **role**: Current user role
- **config**: Configuration object with values set by admins in the UI

## Configuration

Tools can define configuration options that allow administrators to customize behavior:

```typescript
const configurableTool = new ExuluTool({
    id: "configurable-tool",
    name: "Configurable Tool",
    description: "A tool with configurable options",
    type: "function",
    config: [
        {
            name: "apiEndpoint",
            description: "The API endpoint to call"
        },
        {
            name: "maxRetries", 
            description: "Maximum number of retry attempts"
        }
    ],
    execute: async ({ input, config }) => {
        // Use config.apiEndpoint and config.maxRetries
        const endpoint = config.apiEndpoint;
        const retries = config.maxRetries;
        // Implementation here
    }
});
```

## Tool Name Sanitization

Tool names are automatically sanitized using the `sanitizeToolName` function:
- Only keeps a-z, A-Z, 0-9, hyphens and underscores
- Removes leading/trailing underscores
- Truncated to 128 characters maximum

## Usage in ExuluApp

Tools are registered with the ExuluApp and made available to agents:

```typescript
const app = new ExuluApp();

await app.create({
    tools: [myTool, anotherTool],
    agents: [myAgent],
    contexts: { myContext },
    config: { /* config */ }
});

// Tools are automatically available to agents
// Context and agent tools are auto-generated
```

## Best Practices

1. **Clear Descriptions**: Provide clear, detailed descriptions of what your tool does
2. **Input Validation**: Use Zod schemas to validate and describe expected inputs
3. **Error Handling**: Handle errors gracefully in your execute function
4. **Configuration**: Use configuration options for values that should be customizable
5. **Async Operations**: All execute functions should be async and handle promises properly

## Example: Complete Tool Implementation

```typescript
import { z } from "zod";
import { ExuluTool } from "./classes";

const weatherTool = new ExuluTool({
    id: "weather-lookup",
    name: "Weather Lookup",
    description: "Gets current weather information for a specified location",
    type: "function",
    inputSchema: z.object({
        location: z.string().describe("The city or location to get weather for"),
        units: z.enum(["metric", "imperial"]).optional().describe("Temperature units")
    }),
    config: [
        {
            name: "apiKey",
            description: "Weather API key"
        },
        {
            name: "baseUrl",
            description: "Weather API base URL"
        }
    ],
    execute: async ({ location, units = "metric", config, user, role }) => {
        try {
            const response = await fetch(
                `${config.baseUrl}/weather?q=${location}&units=${units}&appid=${config.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }
            
            const data = await response.json();
            return {
                location: data.name,
                temperature: data.main.temp,
                description: data.weather[0].description,
                humidity: data.main.humidity
            };
        } catch (error) {
            console.error("Weather lookup failed:", error);
            throw new Error(`Failed to get weather for ${location}: ${error.message}`);
        }
    }
});
```

## Integration with AI SDK

The ExuluTool class integrates with the AI SDK's `tool` function to create tools that can be used by language models. The internal `tool` property handles the conversion between Exulu's tool format and the AI SDK format.