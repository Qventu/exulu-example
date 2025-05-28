import {ExuluApp} from "@exulu/backend";
import { contexts } from "./contexts";
import {demoAgent, demoFlow} from "./agents/demo.ts";
import { transcriberFlow } from "./agents/transcriber.ts";
import tools from "./tools";
import minilmEmbedder from "./embedders/minilm-l6-v2.ts";

export const exulu = new ExuluApp({
    config: {
        workers: {
            enabled: false,
        }
    },
    contexts,
    tools: [
        ...Object.values(contexts).map(context => context.tool()),
        ...tools
    ],
    embedders: [minilmEmbedder], // Todo we can get rid of these. And provide an API that exposes the contexts above because we add embedders directly to contexts
    agents: [demoAgent],
    workflows: [demoFlow, transcriberFlow]
})