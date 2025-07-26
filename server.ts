import { type Request, type Response } from "express";
import { ExuluApp, ExuluChunkers } from "@exulu/backend";
import { contexts } from "./contexts";
import {videoScriptProducerFlow, transcriberFlow, videoVisualsProducerFlow} from "./agents";
import tools from "./tools";
import niahAgents from "./agents/needle-in-a-haystack-test-agent.ts";

export const exulu = new ExuluApp();
const server = await exulu.create({
  config: {
      workers: {
          enabled: false,
      },
      MCP: {
        enabled: true,
      }
  },
  contexts,
  tools: [
      ...tools
  ],
  agents: [
      /* ...niahAgents */
  ],
  workflows: [transcriberFlow, videoScriptProducerFlow, videoVisualsProducerFlow]
})

if (!server) {
  throw new Error("Failed to create Exulu server.");
}

server.post("/tokenizer/sentence", async (req: Request, res: Response) => {

  const content = req.body.content;
  const maxChunkSize = 256;

  const chunker = await ExuluChunkers.sentence.create({
    tokenizer: "gpt-3.5-turbo", // Supports string identifiers or Tokenizer instance
    chunkSize: maxChunkSize,            // Maximum tokens per chunk
    chunkOverlap: maxChunkSize / 2,         // Overlap between chunks
    minSentencesPerChunk: 1    // Minimum sentences per chunk
  });

  const chunks = await chunker.chunk(content);

  res.status(200).json({
    chunks
  })
});


server.post("/tokenizer/recursive", async (req: Request, res: Response) => {
  const content = req.body.content;

  const maxChunkSize = 256;

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

  const chunks = await chunker.chunk(content);
  console.log("chunks", chunks)

  res.status(200).json({
    chunks
  })
})

server.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Hello, welcome to the Exulu backend ❤️."
  })
  return;
});

server.listen(9001, () => {
  console.log(`Exulu is listening on port ${9001}.`);
});