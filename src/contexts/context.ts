import { ExuluContext, ExuluQueues } from "@exulu/backend";
import { exampleEmbedder } from "../embedders/embedder";

const exampleContext = new ExuluContext({
    id: "example_context",
    name: "Example context",
    description: "Example context",
    embedder: exampleEmbedder,
    active: true,
    rateLimit: undefined,
    queryRewriter: undefined,
    resultReranker: undefined,
    sources: [{
        id: "example_source",
        name: "Example Source",
        description: "Example Source",
        config: {
            schedule: "*/1 * * * *", // every minute
            queue: ExuluQueues.register("example_source_queue").use()
        },
        execute: async (inputs: any) => {
            console.log("[EXULU] executing example source", inputs);
            return [];
        }
    }],
    configuration: {
        calculateVectors: "always"
    },
    fields: [
        {
            name: "json",
            type: "json"
        }
    ],
})

export { exampleContext };