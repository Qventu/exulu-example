// src/contexts/context.ts
import { ExuluContext } from "@exulu/backend";

// src/embedders/embedder.ts
import { ExuluChunkers, ExuluEmbedder } from "@exulu/backend";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
var exampleEmbedder = new ExuluEmbedder({
  id: "example_embedder",
  name: "Example embedder",
  description: "OpenAI text embedder small.",
  vectorDimensions: 1536,
  maxChunkSize: 500,
  queue: void 0,
  chunker: async (inputs, maxChunkSize) => {
    if (!inputs.description) {
      return {
        item: inputs,
        chunks: []
      };
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
    const { embeddings } = await embedMany({
      model: openai.textEmbeddingModel("text-embedding-3-small"),
      values: inputs.chunks.map((chunk) => chunk.content)
    });
    return {
      id: item.id,
      chunks: embeddings.map((vector, index) => ({
        content: inputs.chunks[index]?.content || "",
        index,
        vector
      }))
    };
  }
});

// src/contexts/context.ts
var exampleContext = new ExuluContext({
  id: "example_context",
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
import { createOpenAI } from "@ai-sdk/openai";
var exampleAgent = new ExuluAgent({
  id: "example_agent",
  name: "Example Agent",
  provider: "openai",
  description: "Description of example agent.",
  type: "agent",
  capabilities: {
    text: true,
    images: [],
    files: [],
    audio: [],
    video: []
  },
  config: {
    name: "example-agent",
    instructions: "",
    model: {
      create: ({ apiKey }) => {
        const openai2 = createOpenAI({
          apiKey
        });
        return openai2.languageModel("gpt-4o");
      }
    }
  }
});
var agent_default = exampleAgent;

// src/tools/tool.ts
import { ExuluTool } from "@exulu/backend";
import { z } from "zod";
var exampleTool = new ExuluTool({
  id: "example_tool",
  name: "Example Tool",
  description: "Description of example tool.",
  inputSchema: z.object({
    query: z.string().describe("The query to the tool.")
  }),
  type: "function",
  config: [],
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

// exulu.ts
import { ExuluApp } from "@exulu/backend";
var instance = null;
var exulu = async () => {
  if (instance) {
    return instance;
  }
  instance = new ExuluApp();
  instance = await instance.create({
    config: {
      telemetry: {
        enabled: false
      },
      fileUploads: {
        s3region: process.env.COMPANION_S3_REGION,
        s3key: process.env.COMPANION_S3_KEY,
        s3secret: process.env.COMPANION_S3_SECRET,
        s3Bucket: process.env.COMPANION_S3_BUCKET,
        s3endpoint: process.env.COMPANION_S3_ENDPOINT,
        s3prefix: process.env.COMPANION_S3_PREFIX
      },
      workers: {
        telemetry: {
          enabled: false
        },
        enabled: true
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
    ]
  });
  return instance;
};

// worker.ts
var worker = async () => {
  const app = await exulu();
  const worker2 = await app.bullmq.workers.create();
  return worker2;
};
worker();
//# sourceMappingURL=worker.js.map