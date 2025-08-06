import type { ExuluTool } from "@exulu/backend";
import exampleTool from "./tool";
import { createSession, askChatgpt } from "./browserbase";
import { sitemap } from "./firecrawl";

const tools: ExuluTool[] = [
    exampleTool,
    createSession,
    askChatgpt,
    sitemap
]

export default tools;