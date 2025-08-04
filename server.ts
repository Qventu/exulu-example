import { type Request, type Response } from "express";
import { ExuluApp } from "@exulu/backend";
import { contexts } from "./src/contexts/index";
import { exampleAgent } from "./src/agents/index";
import tools from "./src/tools/index";

export const exulu = new ExuluApp();

const start = async () => {
  const server = await exulu.create({
    config: {
      workers: {
        enabled: false,
      },
      MCP: {
        enabled: true,
      }
    },
    contexts,
    tools: [
      ...tools
    ],
    agents: [
      exampleAgent
    ],
    workflows: []
  })

  console.log("Server created");
  if (!server) {
    throw new Error("Failed to create Exulu server.");
  }

  server.get("/", (req: Request, res: Response) => {
    res.status(200).json({
      message: "Hello, welcome to the Exulu backend ❤️."
    })
    return;
  });

  server.listen(9001, () => {
    console.log(`Exulu is listening on port ${9001}.`);
  });
}
start();