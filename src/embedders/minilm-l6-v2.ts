import { ExuluChunkers, ExuluEmbedder } from "@exulu/backend";
// import { pipeline } from "@xenova/transformers";
import { pipeline } from '@xenova/transformers';

// Performance: auf mac m1 braucht die embedding generation 20 bis 30 sekunden
export const minilmEmbedder = new ExuluEmbedder({
  id: "28fa2488-97b2-474d-b790-9211a2179dea",
  name: "all-MiniLM-L6-v2", // we choose Qwen3's new embedding model because it ranks highly on https://huggingface.co/spaces/mteb/leaderboard (0.6b ranked nr 4)
  description: "MiniLM L6 V2 is a small language model that can be used for a variety of tasks (HF repo: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2).",
  vectorDimensions: 384,
  maxChunkSize: 256,
  queue: undefined,
  chunker: async (inputs, maxChunkSize) => {
    // todo implement proper chunking using the maxChunkSize

    const rules = new ExuluChunkers.recursive.rules({
      levels: [
        { delimiters: ["<p>", "</p>"], includeDelim: "prev" }, // Paragraphs
        { delimiters: ["<table>", "</table>"], includeDelim: "prev" }, // Paragraphs
        { delimiters: ["<tr>", "</tr>"], includeDelim: "prev" }, // Paragraphs
        { delimiters: ["\n\n"], includeDelim: "prev" }, // Paragraphs
        { delimiters: [". ", "! ", "? "], includeDelim: "prev" }, // Sentences
        {} // Fallback to token-based
      ]
    });
    const chunker = await ExuluChunkers.recursive.function.create({
      tokenizer: "gpt-3.5-turbo", // Supports string identifiers or Tokenizer instance
      chunkSize: maxChunkSize, // Maximum tokens per chunk
      rules,
      minCharactersPerChunk: 24
    });
    const content = inputs.name + "\n" + inputs.description;
    const chunks = await chunker.chunk(content);
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


export default minilmEmbedder;
