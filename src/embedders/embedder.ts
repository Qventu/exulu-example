import { ExuluChunkers, ExuluEmbedder, ExuluQueues } from "@exulu/backend";
import { createOpenAI } from '@ai-sdk/openai';
import { embedMany } from 'ai';

const impKnowledgeQueue = ExuluQueues.register("imp_knowledge_queue", {
  worker: 20,
  queue: 20,
}, 4, 100).use();

export const impKnowledgeEmbedder = new ExuluEmbedder({
  id: "imp_knowledge_embedder",
  name: "Intelligence Management Platform (IMP) Knowledge embedder",
  description: "Intelligence Management Platform (IMP) Knowledge embedder, embeds the knowledge context for the IMP application.",
  vectorDimensions: 1536,
  maxChunkSize: 500,
  queue: impKnowledgeQueue,
  config: [{
    name: "openai_api_key",
    description: "OpenAI API key",
    default: undefined
  }],
  chunker: async (inputs, maxChunkSize) => {

    if (!inputs.description) {
      return {
        item: inputs,
        chunks: []
      }
    }

    const content = inputs.description;

    const chunker = await ExuluChunkers.sentence.create({
      tokenizer: "gpt-3.5-turbo", // Supports string identifiers or Tokenizer instance
      chunkSize: maxChunkSize,            // Maximum tokens per chunk
      chunkOverlap: maxChunkSize / 2,         // Overlap between chunks
      minSentencesPerChunk: 1    // Minimum sentences per chunk
    });

    const chunks = await chunker.chunk(content);

    console.log("chunks", chunks)
    return {
      item: inputs,
      chunks: chunks.map((chunk, index) => ({
        content: chunk.text,
        index,
      }))
    }

  },
  generateEmbeddings: async (inputs, config: Record<string, string>) => {

    const { item } = inputs;

    if (!config.openai_api_key) {
      throw new Error("OpenAI API key is required, please set it in the embedder configuration.");
    }

    const openai = createOpenAI({
      apiKey: config.openai_api_key
    });

    // 'embeddings' is an array of embedding objects (number[][]).
    // It is sorted in the same order as the input values.

    const { embeddings } = await embedMany({
      model: openai.textEmbeddingModel('text-embedding-3-small'),
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
    }

  }
})

export default impKnowledgeEmbedder;