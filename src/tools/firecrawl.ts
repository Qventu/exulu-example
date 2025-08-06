import { z } from "zod";
import { ExuluTool } from "@exulu/backend";
import FirecrawlApp, { CrawlParams, CrawlStatusResponse } from '@mendable/firecrawl-js';


const sitemap = new ExuluTool({
    id: `9429-2931-0358-1852`,
    type: "function",
    name: "Firecrawl sitemap creation.",
    inputSchema: z.object({
        url: z.string().describe("The url of the website to generate a sitemap for.")
    }),
    config: [
        {
            name: "apiKey",
            description: "The API key for the Firecrawl app."
        }
    ],
    description: `Takes a url and generates a sitemap for that website.`,
    execute: async ({ url, config }: any) => {

        console.log("[EXULU] Firecrawl config", config)

        if (!config.apiKey) {
            throw new Error("Firecrawl API key not set in the config.")
        }

        const app = new FirecrawlApp({ apiKey: config.apiKey });

        const mapResult = await app.mapUrl(url);

        if (!mapResult.success) {
            throw new Error(`Failed to map: ${mapResult.error}`)
        }

        console.log(mapResult)

        return {
            mapResult
        };
    },
})

export { sitemap };