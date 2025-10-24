import { ExuluChunkers, ExuluEmbedder } from "@exulu/backend";
import OpenAI from "openai";

// Performance: auf mac m1 braucht die embedding generation 20 bis 30 sekunden
export const openAITextEmbedding3Small = new ExuluEmbedder({
  id: "28fa2488-97b2-474d-b790-9211a2179dea",
  name: "text-embedding-3-small",
  description: "text-embedding-3-small is a small language model that can be used for a variety of tasks (HF repo: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2).",
  vectorDimensions: 1536,
  maxChunkSize: 4000,
  queue: undefined,
  chunker: async (inputs, maxChunkSize) => {
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

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    const { item, chunks } = inputs;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const promises = chunks.map<Promise<{ content: string; index: number; vector: number[] }>>(async (chunk, index) => {

      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk.content,
        encoding_format: "float",
      });

      return {
        ...chunk,
        index,
        vector: embedding.data[0]?.embedding || []
      };
      
    });

    return {
      id: item.id,
      chunks: await Promise.all(promises)
    }
  }
});


export default openAITextEmbedding3Small;
