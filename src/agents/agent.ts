import { ExuluAgent } from "@exulu/backend";
import { openai } from "@ai-sdk/openai";

const exampleAgent = new ExuluAgent({
    id: "1234-5678-9123-4567",
    name: "Example Agent",
    description: "Description of example agent.",
    type: "agent",
    capabilities: {
        tools: false,
        images: [],
        files: [],
        audio: [],
        video: [],
    },
    evals: [],
    config: {
        name: "example-agent",
        instructions: "",
        model: openai("gpt-4o"),
    }
})

export default exampleAgent;