import { ExuluAgent, ExuluWorkflow, ExuluQueues } from "exulu";
import { z } from "zod"
import { Workflow as MastraWorkflow, Step } from "@mastra/core";
import { openai } from "@ai-sdk/openai";
import { contexts } from "../contexts"; // todo setup relative path

const agentId = "1234-5678-9123-4567";
export const demoAgent = new ExuluAgent({
  id: agentId,
  name: "demoAgent",
  type: "agent",
  description: "Lorem ipsum.",
  capabilities: {
    tools: true,
    images: [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    files: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"],
    audio: [".mp3", ".wav", ".m4a", ".ogg", ".flac"],
    video: [".mp4", ".mov", ".avi", ".mkv", ".webm"],
  },
  // outputSchema: z.object({
  //     name: z.string()
  // }),
  config: {
    name: "Demo Agent",
    instructions: "You are a helpful assistant.",
    model: openai("gpt-4o-mini"),
    memory: {
      lastMessages: 10,
      vector: true,
      semanticRecall: {
        topK: 3,
        messageRange: 2
      }
    }
  },
  rateLimit: {
    name: "demoAgent",
    rate_limit: {
      limit: 100,
      time: 60
    }
  },
})

const createWorkflow = () => {
  const workflow = new MastraWorkflow({
    name: "Demo Flow",
  })

  const stepOne = new Step({
    id: "stepOne",
    outputSchema: z.object({
      doubledValue: z.number(),
    }),
    execute: async ({ context }) => {
      const doubledValue = context.triggerData.inputValue * 2;
      const { faqs } = contexts;
      const response = await faqs.embedder.retrieve({
        collection: faqs.id,
        query: "some kind of query text",
        statistics: {
          label: faqs.name,
          trigger: "demoAgent"
        }
      })
      console.log(response)
      return { doubledValue };
    }
  });

  const stepTwo = new Step({
    id: "stepTwo",
    execute: async ({ context }) => {
      const doubledValue = context.getStepResult(stepOne)?.doubledValue;
      if (!doubledValue) {
        return { incrementedValue: 0 };
      }

      return {
        incrementedValue: doubledValue + 1,
      };
    },
  });

  workflow
    .step(stepOne)
    .then(stepTwo)
    .commit();

  return workflow;
}

const inputSchemaSimple = z.object({
  firstName: z.string().describe(JSON.stringify({
    label: "First name",
    description: "First name of the attendee.",
    placeholder: "James"
  }))
})

const flowId = "1234-5678-9123-4567";
export const demoFlow = new ExuluWorkflow({
  id: flowId,
  name: "demoFlow",
  description: "Lorem ipsum.",
  inputSchema: inputSchemaSimple,
  workflow: createWorkflow(),
  queue: ExuluQueues.use("flows"),
  enable_batch: true
})

export default demoAgent;