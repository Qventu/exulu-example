import { ExuluEmbedder } from "exulu";
import { pipeline } from "@xenova/transformers";

export const minilmEmbedder = new ExuluEmbedder({
    id: "28fa2488-97b2-474d-b790-9211a2179dea",
    name: "minilm-l6-v2",
    description: "MiniLM L6 V2 is a small language model that can be used for a variety of tasks (HF repo: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2).",
    vectorDimensions: 384,
    maxChunkSize: 256 / 4,
    queue: undefined,
    chunker: async (inputs, maxChunkSize) => {
        // todo implement proper chunking using the maxChunkSize
        const content = inputs.name + "\n" + inputs.description;
        const chunks = content.split("\n");
        console.log("chunks", chunks)
        return {
          item: inputs,
          chunks: chunks.map((chunk, index) => ({
              content: chunk,
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

export default minilmEmbedder;