import { ExuluAgent } from "@exulu/backend";
import { createOpenAI } from "@ai-sdk/openai";

const exampleAgent = new ExuluAgent({
    id: "example_agent",
    name: "Example Agent",
    provider: "openai",
    description: "Description of example agent.",
    type: "agent",
    capabilities: {
        text: true,
        images: [],
        files: [],
        audio: [],
        video: [],
    },
    evals: [],
    config: {
        name: "example-agent",
        instructions: "",
        model: {
            create: ({ apiKey }) => {
                const openai = createOpenAI({
                    apiKey: apiKey,
                })
                return openai.languageModel("gpt-4o")
            },
        }
    }
})

export default exampleAgent;