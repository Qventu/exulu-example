// src/contexts/context.ts
import { ExuluChunkers, ExuluContext, ExuluDocumentProcessor, ExuluQueues } from "@exulu/backend";

// src/utils/index.ts
var s3PathInfo = (path) => {
  const match = path.match(/^([^/]+)\/(.+)\.([^./]+)(?:\/(.+))?$/);
  if (!match) {
    console.error("Invalid ID format");
    return void 0;
  }
  const [, bucket, object, ext, generation] = match;
  if (!bucket || !object || !ext) {
    console.error("Missing S3 file id parts");
    return void 0;
  }
  return {
    bucket,
    object,
    ext,
    generation
  };
};

// src/contexts/context.ts
var embeddingQueue = ExuluQueues.register("embedding_queue", {
  worker: 20,
  queue: 20
}, 4, 100).use();
var processingQueue = ExuluQueues.register("processing_queue", {
  worker: 20,
  queue: 20
}, 4, 100).use();
var createChunker = async () => {
  return new ExuluChunkers.markdown();
};
var exampleTicketsContext = new ExuluContext({
  id: "example_tickets_context",
  name: "Example Tickets Context",
  description: "Example Tickets Context, includes example tickets for the IMP application.",
  embedder: {
    model: "gemini-embedding-001",
    queue: embeddingQueue
  },
  chunker: async (inputs, maxChunkSize, utils) => {
    if (!inputs.description) {
      console.error("No description found in item", inputs);
      return {
        item: inputs,
        chunks: []
      };
    }
    const chunker = await createChunker();
    const chunks = await chunker.chunk(inputs.description, maxChunkSize, prefix, {
      pageBreakTags: false
    });
    return {
      item: inputs,
      chunks: chunks.map((chunk, index) => ({
        content: chunk.text,
        index
      }))
    };
  },
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
var exampleDocumentsContext = new ExuluContext({
  id: "example_documents_context",
  name: "Example Documents Context",
  description: "Example Documents Context, includes example documents for the IMP application.",
  embedder: {
    model: "gemini-embedding-001",
    queue: embeddingQueue
  },
  chunker: async (inputs, maxChunkSize, utils) => {
    if (!inputs.markdown_s3key) {
      console.error("No markdown_s3key found in item", inputs);
      return {
        item: inputs,
        chunks: []
      };
    }
    const key = inputs.markdown_s3key;
    const url = await utils.storage.getPresignedUrl(key);
    const response = await fetch(url);
    const text = await response.text();
    const json = JSON.parse(text);
    const documentName = inputs.name || inputs.external_id || inputs.document_s3key || "";
    const prefix2 = `
        --- Document (Exulu ID: ${inputs.id}) ---
        Document Name: ${documentName}
        -------------------------`;
    const chunker = await createChunker();
    const content = `${json.map(
      (page) => `${page.content} <page_break page=${page.page}>`
    ).join("\n\n")}`;
    const chunks = await chunker.chunk(content, maxChunkSize, prefix2, {
      pageBreakTags: true
    });
    return {
      item: inputs,
      chunks: chunks.map((chunk, index) => ({
        content: chunk.text,
        index,
        metadata: {
          page: chunk.page,
          pdf: inputs.document_s3key,
          markdown: inputs.markdown_s3key
        }
      }))
    };
  },
  active: true,
  queryRewriter: void 0,
  resultReranker: void 0,
  sources: [],
  configuration: {
    calculateVectors: "manual",
    maxRetrievalResults: 20
  },
  processor: {
    name: "Document Processor",
    description: "Takes PDF files and converts them to markdown, stores the markdown file in the item on the markdown field so it can be used for embedding.",
    config: {
      trigger: "always",
      queue: processingQueue,
      timeoutInSeconds: 60 * 40,
      // 40 minutes, some documents are 200 pages, so this is a reasonable timeout
      generateEmbeddings: true
      // means embeddings will be generated after the processor has finished
    },
    filter: async ({ item, user, role, exuluConfig, utils }) => {
      return item;
    },
    execute: async ({ item, user, utils }) => {
      if (!item.document_s3key) {
        console.error("No document_s3key found in item", item);
        return item;
      }
      const pathInfo = s3PathInfo(item.document_s3key);
      if (!pathInfo) {
        console.error("Invalid document_s3key", item.document_s3key);
        return item;
      }
      const sourceFileBucket = pathInfo.bucket;
      const sourceFileObject = pathInfo.object;
      const sourceFileExt = pathInfo.ext;
      const sourceFileKey = `${sourceFileObject}.${sourceFileExt}`;
      const key = item.document_s3key;
      const url = await utils.storage.getPresignedUrl(key);
      const array = await fetch(url).then((res) => res.arrayBuffer());
      const buffer = Buffer.from(array);
      const jsonFileKey = `${sourceFileObject}.json`;
      const result = await ExuluDocumentProcessor.process({
        file: buffer,
        name: item.document_s3key,
        config: {
          processor: {
            name: "mistral",
            model: "vertex-ocr"
          },
          vlm: {
            model: "vertex-gemini-2.5-flash",
            concurrency: 40
          }
        }
      });
      const uploadedKey = await utils.storage.uploadFile(
        Buffer.from(JSON.stringify(result)),
        jsonFileKey,
        "application/json" /* json */.toString(),
        user,
        {
          sourceFile: sourceFileKey,
          bucket: sourceFileBucket
        }
      );
      const object = {
        ...item,
        markdown_s3key: uploadedKey
      };
      return object;
    }
  },
  fields: [
    {
      name: "document",
      type: "file",
      allowedFileTypes: [".pdf"]
    },
    {
      name: "markdown",
      type: "file",
      allowedFileTypes: [".md"],
      editable: false,
      calculated: true
    }
  ]
});

// src/contexts/index.ts
var contexts = {
  exampleTicketsContext,
  exampleDocumentsContext
};

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
    providers: []
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