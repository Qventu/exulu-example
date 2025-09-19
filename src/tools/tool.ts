import { ExuluTool } from "@exulu/backend";
import { z } from "zod";

const exampleTool = new ExuluTool({
    id: "example_tool",
    name: "Example Tool",
    description: "Description of example tool.",
    inputSchema: z.object({
        query: z.string(),
    }),
    type: "function",
    config: [],
    execute: async ({ query }: any) => {
        // add logic here
        console.log(query);
        return {
            result: "Example tool result",
        }
    },
})

export default exampleTool;