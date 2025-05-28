import { ExuluContext } from "@exulu/backend";
import { minilmEmbedder } from "../embedders/minilm-l6-v2.ts";

const faqs = new ExuluContext({
    id: "477af35c-18f1-47b9-8b45-0306e21145c1",
    name: "Faq articles",
    description: "1822 faq articles",
    embedder: minilmEmbedder,
    active: true,
    configuration: {
        calculateVectors: "always"
    },
    fields: [
        {
            name: "image",
            type: "text"
        },
        {
            name: "url",
            type: "text"
        }
    ],
    rateLimit: {
        name: "demoAgent",
        rate_limit: {
            limit: 100,
            time: 60
        }
    },
})

export { faqs };