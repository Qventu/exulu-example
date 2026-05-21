import { ExuluProvider } from "@exulu/backend";
import { createOpenAI } from "@ai-sdk/openai";

const exampleProvider = new ExuluProvider({
    id: "example_provider",
    name: "Example Provider",
    provider: "openai",
    description: "Description of example provider.",
    type: "agent",
    capabilities: {
        text: true,
        images: [],
        files: [],
        audio: [],
        video: [],
    },
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

export default exampleProvider;