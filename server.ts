import { type Request, type Response } from "express";
import { ExuluApp } from "@exulu/backend";
import { contexts } from "./src/contexts/index";
import { exampleAgent } from "./src/agents/index";
import tools from "./src/tools/index";

export const exulu = new ExuluApp();

const start = async () => {
  const server = await exulu.create({
    fileUploads: {
      s3region: process.env.COMPANION_S3_REGION,
      s3key: process.env.COMPANION_S3_KEY,
      s3secret: process.env.COMPANION_S3_SECRET,
      s3Bucket: process.env.COMPANION_S3_BUCKET,
      s3endpoint: process.env.COMPANION_S3_ENDPOINT,
    },
    telemetry: {
      enabled: false,
    },
    config: {
      workers: {
        telemetry: {
          enabled: false,
        },
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
    ]
  })
  if (!server) {
    throw new Error("Failed to create Exulu server.");
  }

  server.get("/", (req: Request, res: Response) => {
    res.status(200).json({
      message: "Hello, welcome to the Exulu backend ❤️."
    })
    return;
  });

  server.listen(9001, () => {});
}
start();