import { ExuluContext } from "@exulu/backend";
import { minilmEmbedder } from "../embedders/minilm-l6-v2.ts";

const videoSeries = new ExuluContext({
    id: "0cdaf29c-f69c-4afb-b4cc-fbc60651e9ad",
    name: "OPEN AI Video Series",
    description: "Generated video scripts and content for the OPEN AI video series",
    embedder: minilmEmbedder,
    active: true,
    configuration: {
        calculateVectors: "always"
    },
    fields: [
        {
            name: "segments",
            type: "json"
        }
    ],
})

export { videoSeries };