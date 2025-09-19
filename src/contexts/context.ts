import { ExuluContext } from "@exulu/backend";
import { exampleEmbedder } from "../embedders/embedder";

const exampleContext = new ExuluContext({
    id: "example_context",
    name: "Example context",
    description: "Example context",
    embedder: exampleEmbedder,
    active: true,
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