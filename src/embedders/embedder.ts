import { ExuluChunkers, ExuluEmbedder } from "@exulu/backend";
import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';

export const exampleEmbedder = new ExuluEmbedder({
  id: "example_embedder",
  name: "Example embedder",
  description: "OpenAI text embedder small.",
  vectorDimensions: 1536,
  maxChunkSize: 500,
  queue: undefined,
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
  generateEmbeddings: async (inputs) => {

    const { item } = inputs;

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
        vector
      }))
    }

  }
})

export default exampleEmbedder;