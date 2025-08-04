import { ExuluChunkers, ExuluEmbedder } from "@exulu/backend";
import { pipeline } from "@xenova/transformers";

export const exampleEmbedder = new ExuluEmbedder({
  id: "28fa2488-97b2-474d-b790-9211a2179dea",
  name: "minilm-l6-v2",
  description: "MiniLM L6 V2 is a small language model that can be used for a variety of tasks (HF repo: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2).",
  vectorDimensions: 384,
  maxChunkSize: 256 / 4,
  queue: undefined,
  chunker: async (inputs, maxChunkSize) => {

    if (!inputs.description) {
      throw new Error("No content for item.")
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
    const extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    const response = await extractor(
      inputs.chunks.map((chunk) => chunk.content),
      { pooling: "mean", normalize: true }
    );

    const vectors = response.tolist();
    console.log("vectors", vectors?.length)
    return {
      id: item.id,
      chunks: vectors.map((vector, index) => ({
        content: inputs.chunks[index]?.content || "",
        index,
        vector: vector
      }))
    }
  }
})

export default exampleEmbedder;