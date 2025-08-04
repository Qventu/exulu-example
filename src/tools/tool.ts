import { ExuluTool } from "@exulu/backend";
import { z } from "zod";

const exampleTool = new ExuluTool({
    id: "1234-5678-9123-4567",
    name: "Example Tool",
    description: "Description of example tool.",
    inputSchema: z.object({
        query: z.string(),
    }),
    type: "function",
    execute: async ({ query }: any) => {
        // add logic here
        console.log(query);
        return {
            result: "Example tool result",
        }
    },
})

export default exampleTool;