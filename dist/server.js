// server.ts
import { ExuluApp } from "@exulu/backend";

// src/contexts/context.ts
import { ExuluContext } from "@exulu/backend";

// src/embedders/embedder.ts
import { ExuluChunkers, ExuluEmbedder } from "@exulu/backend";
import { pipeline } from "@xenova/transformers";
var exampleEmbedder = new ExuluEmbedder({
  id: "28fa2488-97b2-474d-b790-9211a2179dea",
  name: "minilm-l6-v2",
  description: "MiniLM L6 V2 is a small language model that can be used for a variety of tasks (HF repo: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2).",
  vectorDimensions: 384,
  maxChunkSize: 256 / 4,
  queue: void 0,
  chunker: async (inputs, maxChunkSize) => {
    if (!inputs.description) {
      throw new Error("No content for item.");
    }
    const content = inputs.description;
    const chunker = await ExuluChunkers.sentence.create({
      tokenizer: "gpt-3.5-turbo",
      // Supports string identifiers or Tokenizer instance
      chunkSize: maxChunkSize,
      // Maximum tokens per chunk
      chunkOverlap: maxChunkSize / 2,
      // Overlap between chunks
      minSentencesPerChunk: 1
      // Minimum sentences per chunk
    });
    const chunks = await chunker.chunk(content);
    console.log("chunks", chunks);
    return {
      item: inputs,
      chunks: chunks.map((chunk, index) => ({
        content: chunk.text,
        index
      }))
    };
  },
  generateEmbeddings: async (inputs) => {
    const { item } = inputs;
    const extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    const response = await extractor(
      inputs.chunks.map((chunk) => chunk.content),
      { pooling: "mean", normalize: true }
    );
    const vectors = response.tolist();
    console.log("vectors", vectors?.length);
    return {
      id: item.id,
      chunks: vectors.map((vector, index) => ({
        content: inputs.chunks[index]?.content || "",
        index,
        vector
      }))
    };
  }
});

// src/contexts/context.ts
var exampleContext = new ExuluContext({
  id: "0cdaf29c-f69c-4afb-b4cc-fbc60651e9ad",
  name: "Example context",
  description: "Example context",
  embedder: exampleEmbedder,
  active: true,
  configuration: {
    calculateVectors: "always"
  },
  fields: [
    {
      name: "json",
      type: "json"
    }
  ]
});

// src/contexts/index.ts
var contexts = {
  exampleContext
};

// src/agents/agent.ts
import { ExuluAgent } from "@exulu/backend";
import { openai } from "@ai-sdk/openai";
var exampleAgent = new ExuluAgent({
  id: "1234-5678-9123-4567",
  name: "Example Agent",
  description: "Description of example agent.",
  type: "agent",
  capabilities: {
    tools: false,
    images: [],
    files: [],
    audio: [],
    video: []
  },
  evals: [],
  config: {
    name: "example-agent",
    instructions: "",
    model: openai("gpt-4o")
  }
});
var agent_default = exampleAgent;

// src/tools/tool.ts
import { ExuluTool } from "@exulu/backend";
import { z } from "zod";
var exampleTool = new ExuluTool({
  id: "1234-5678-9123-4567",
  name: "Example Tool",
  description: "Description of example tool.",
  inputSchema: z.object({
    query: z.string()
  }),
  type: "function",
  execute: async ({ query }) => {
    console.log(query);
    return {
      result: "Example tool result"
    };
  }
});
var tool_default = exampleTool;

// src/tools/index.ts
var tools = [
  tool_default
];
var tools_default = tools;

// server.ts
var exulu = new ExuluApp();
var server = await exulu.create({
  config: {
    workers: {
      enabled: false
    },
    MCP: {
      enabled: true
    }
  },
  contexts,
  tools: [
    ...tools_default
  ],
  agents: [
    agent_default
  ],
  workflows: []
});
console.log("Server created");
if (!server) {
  throw new Error("Failed to create Exulu server.");
}
server.get("/", (req, res) => {
  res.status(200).json({
    message: "Hello, welcome to the Exulu backend \u2764\uFE0F."
  });
  return;
});
server.listen(9001, () => {
  console.log(`Exulu is listening on port ${9001}.`);
});
export {
  exulu
};
//# sourceMappingURL=server.js.map