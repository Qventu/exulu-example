import { z } from "zod";
import { ExuluTool } from "exulu";

const demoTool = new ExuluTool({
    id: `1234-5678-9123-4567`,
    type: "function",
    name: "Demo tool",
    inputSchema: z.object({
        query: z.string(),
    }),
    outputSchema: z.object({
        results: z.array(z.object({
            count: z.number(),
            results: z.array(z.object({
                id: z.string(),
                content: z.string(),
                metadata: z.record(z.any())
            })),
            errors: z.array(z.string()).optional()
        }))
    }),
    description: `Demo tool call.`,
    execute: async ({ context }: any) => {
        return {
            results: [{
                count: 1,
                results: [{
                    id: "1",
                    content: "Hello, world!",
                    metadata: {}
                }]
            }]
        }
    },
})

export default demoTool;