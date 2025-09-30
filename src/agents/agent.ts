import { ExuluAgent } from "@exulu/backend";
import { openai } from "@ai-sdk/openai";

const exampleAgent = new ExuluAgent({
    id: "example_agent_d239",
    name: "Example Agent",
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
        model: openai("gpt-4o"),
    }
})

export default exampleAgent;