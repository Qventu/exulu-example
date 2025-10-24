import { ExuluTool } from "@exulu/backend";
import { z } from "zod";

const perplexitySearch = new ExuluTool({
    id: `perplexity_search_tool`,
    type: "function",
    name: "Perplexity search.",
    inputSchema: z.object({
        prompts: z.array(z.string()).describe("A list of prompts to search for."),
    }),
    config: [
        {
            name: "apiKey",
            description: "The API key for the Perplexity API."
        }
    ],
    description: `Takes a list of prompts and returns the results of the search on Perplexity.`,
    execute: async ({ prompts, config }: any) => {

        const url = 'https://api.perplexity.ai/chat/completions';

        const headers = {
            'Authorization': `Bearer ${config.apiKey}`, // Replace with your actual API key
            'Content-Type': 'application/json'
        };

        const promises = prompts.map(async (prompt: string) => {
            const payload = {
                model: 'sonar-pro',
                messages: [
                    { role: 'user', content: prompt }
                ]
            };
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            const data: any = await response.json();

            return {
                content: data.choices[0].message.content,
                sources: data.search_results,
                prompt: prompt
            };
        })

        const results = await Promise.all(promises);

        return {
            result: JSON.stringify(results)
        };
    }
})

export { perplexitySearch };