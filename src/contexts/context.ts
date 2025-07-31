import { ExuluContext } from "@exulu/backend";
import { exampleEmbedder } from "../embedders/embedder";

const exampleContext = new ExuluContext({
    id: "0cdaf29c-f69c-4afb-b4cc-fbc60651e9ad",
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