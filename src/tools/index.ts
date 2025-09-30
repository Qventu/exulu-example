import type { ExuluTool } from "@exulu/backend";
import { createSession, askChatgpt } from "./browserbase";
import { sitemap, scrape, llmsText, extract } from "./firecrawl";
import { perplexitySearch } from "./perplexity";

const tools: ExuluTool[] = [
    createSession,
    askChatgpt,
    sitemap,
    scrape, 
    llmsText,
    extract,
    perplexitySearch
]

export default tools;