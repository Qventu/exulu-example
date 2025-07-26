import { ExuluAgent, ExuluEval, ExuluTool } from "@exulu/backend";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google"
import { groq } from "@ai-sdk/groq"
import { mistral } from '@ai-sdk/mistral';
import { anthropic } from "@ai-sdk/anthropic";
import fs from "fs";
import { z } from "zod";
import path from "path";

const agentId = "1234-5678-9123-4567";

const models = [
  {
    name: "gpt-4o",
    contextlengths: [
      5000,
      30000,
      50000,
      128000
    ] as (5000 | 30000 | 50000 | 128000)[],
    model: openai("gpt-4o")
  },
  {
    name: "o3",
    contextlengths: [
      5000,
      30000,
      50000,
      128000
    ] as (5000 | 30000 | 50000 | 128000)[],
    model: openai("o3")
  },
  {
    name: "gemini-2.5-pro-preview-05-06",
    contextlengths: [
      30000,
    ] as (5000 | 30000 | 50000 | 128000)[],
    model: google("gemini-2.5-pro-preview-05-06")
  },
  {
    name: "qwen/qwen3-32b",
    contextlengths: [
      50000,
      128000
    ] as (5000 | 30000 | 50000 | 128000)[],
    model: groq("qwen/qwen3-32b")
  },
  {
    name: "llama-3.3-70b-versatile",
    contextlengths: [
      128000
    ] as (5000 | 30000 | 50000 | 128000)[],
    model: groq("llama-3.3-70b-versatile")
  },
  {
    name: "mistral-large-latest",
    contextlengths: [
      5000,
      30000,
      50000,
      128000
    ] as (5000 | 30000 | 50000 | 128000)[],
    model: mistral("mistral-large-latest")
  },
  {
    name: "claude-4-opus-20250514",
    contextlengths: [
      5000,
      30000,
      50000,
      128000
    ] as (5000 | 30000 | 50000 | 128000)[],
    model: anthropic("claude-4-opus-20250514")
  },
]

const needles = [
  {
    question: "I am building a new car. What should be the first part of my car?",
    answer: "When building a new experimental car, the first part should be a hydrogen fuel cell",
  },
  {
    question: "I am building a new car. What should be the second part of my car?",
    answer: "When building a new experimental car, the second part should be a lithium-ion battery",
  },
  {
    question: "I am building a new car. What should be the fourth part of my car?",
    answer: "When building a new experimental car, the fourth part should be a metallic chassis",
  },
  {
    question: "I am building a new car. What should be the fifth part of my car?",
    answer: "When building a new experimental car, the fifth part should be a custom programmed flight control system"
  },
  {
    question: "I am building a new car. What should be the third part of my car?",
    answer: "When building a new experimental car, the third part should be a carbon based fuel cell",
  },
]
const testDocument = fs.readFileSync(path.join(process.cwd(), "agents", "niah-test-text.txt"), "utf8")

const niahAgents = models.map(({ name, model, contextlengths }) => {

  const exuluEval = new ExuluEval({
    name: `Needle in a haystack test agent for: ${name}`,
    description: `This eval is used to test the needle in a haystack performance of the ${name} model.`,
  })

  const llmAsAJudge = exuluEval.create.LlmAsAJudge.niah({
    label: name,
    model,
    needles,
    testDocument,
    contextlengths
  })

  return new ExuluAgent({
    id: `${agentId}-${name}`,
    name: `Needle in a haystack test agent for: ${name}`,
    description: `This agent is used to test the needle in a haystack performance of the ${name} model.`,
    type: "agent",
    capabilities: {
      tools: false,
      images: [],
      files: [],
      audio: [],
      video: [],
    },
    evals: [
      {
        runner: llmAsAJudge,
      }
    ],
    config: {
      name: `needleInAHaystackTestAgent-${name}`,
      instructions: "You are a helpful assistant.",
      model: model,
    },
    rateLimit: {
      name: `needleInAHaystackTestAgent-${name}`,
      rate_limit: {
        limit: 100,
        time: 60
      }
    }
  })
})

export default niahAgents;