import { ExuluContext } from "@exulu/backend";

const llmsTxt = new ExuluContext({
    id: "llms_txt",
    name: "LLms.txt",
    description: "Stores generate llm.txt and llm.full.txt outputs.",
    active: true,
    configuration: {
        calculateVectors: "manual",
        language: "german"
    },
    fields: [
        {
            name: "full",
            type: "markdown"
        },
        {
            name: "summary",
            type: "markdown"
        }
    ],
})

export { llmsTxt };
