import { ExuluContext } from "@exulu/backend";
import impKnowledgeEmbedder from "../embedders/embedder";

const impKnowledgeContext = new ExuluContext({
    id: "imp_knowledge_context",
    name: "Intelligence Management Platform (IMP) Knowledge context",
    description: "Intelligence Management Platform (IMP) Knowledge context, includes frequently asked questions, feature descriptions and other relevant information for the IMP application.",
    embedder: impKnowledgeEmbedder,
    active: true,
    rateLimit: undefined,
    queryRewriter: undefined,
    resultReranker: undefined,
    sources: [],
    configuration: {
        calculateVectors: "always",
        maxRetrievalResults: 20
    },
    fields: [],
})

export { impKnowledgeContext };