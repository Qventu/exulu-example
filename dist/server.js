// src/contexts/context.ts
import { ExuluContext } from "@exulu/backend";

// src/embedders/embedder.ts
import { ExuluChunkers, ExuluEmbedder, ExuluQueues } from "@exulu/backend";
import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";
var impKnowledgeQueue = ExuluQueues.register("imp_knowledge_queue", {
  worker: 20,
  queue: 20
}, 4, 100).use();
var impKnowledgeEmbedder = new ExuluEmbedder({
  id: "imp_knowledge_embedder",
  name: "Intelligence Management Platform (IMP) Knowledge embedder",
  description: "Intelligence Management Platform (IMP) Knowledge embedder, embeds the knowledge context for the IMP application.",
  vectorDimensions: 1536,
  maxChunkSize: 500,
  queue: impKnowledgeQueue,
  config: [{
    name: "openai_api_key",
    description: "OpenAI API key",
    default: void 0
  }],
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
  generateEmbeddings: async (inputs, config) => {
    const { item } = inputs;
    if (!config.openai_api_key) {
      throw new Error("OpenAI API key is required, please set it in the embedder configuration.");
    }
    const openai = createOpenAI({
      apiKey: config.openai_api_key
    });
    const { embeddings } = await embedMany({
      model: openai.textEmbeddingModel("text-embedding-3-small"),
      values: inputs.chunks.map((chunk) => chunk.content)
    });
    return {
      id: item.id,
      chunks: embeddings.map((vector, index) => ({
        content: inputs.chunks[index]?.content || "",
        index,
        vector,
        metadata: {}
      }))
    };
  }
});
var embedder_default = impKnowledgeEmbedder;

// src/contexts/context.ts
var impKnowledgeContext = new ExuluContext({
  id: "imp_knowledge_context",
  name: "Intelligence Management Platform (IMP) Knowledge context",
  description: "Intelligence Management Platform (IMP) Knowledge context, includes frequently asked questions, feature descriptions and other relevant information for the IMP application.",
  embedder: embedder_default,
  active: true,
  queryRewriter: void 0,
  resultReranker: void 0,
  sources: [],
  configuration: {
    calculateVectors: "always",
    maxRetrievalResults: 20
  },
  fields: []
});

// src/contexts/index.ts
var contexts = {
  impKnowledgeContext
};

// src/providers/provider.ts
import { ExuluProvider } from "@exulu/backend";
import { createOpenAI as createOpenAI2 } from "@ai-sdk/openai";
var exampleProvider = new ExuluProvider({
  id: "example_provider",
  name: "Example Provider",
  provider: "openai",
  description: "Description of example provider.",
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
        const openai = createOpenAI2({
          apiKey
        });
        return openai.languageModel("gpt-4o");
      }
    }
  }
});
var provider_default = exampleProvider;

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
    providers: [
      provider_default
    ]
  });
  return instance;
};

// server.ts
var start = async () => {
  const app = await exulu();
  const server = await app.express.init();
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
  });
};
start();
//# sourceMappingURL=server.js.map