import { contexts } from "./src/contexts/index";
import { exampleAgent } from "./src/agents/index";
import tools from "./src/tools/index";
import { ExuluApp } from "@exulu/backend";

let instance: ExuluApp | null = null;
export const exulu = async (): Promise<ExuluApp> => {

    if (instance) {
        return instance;
    }

    instance = new ExuluApp();
    instance = await instance.create({
        config: {
            telemetry: {
                enabled: false,
            },
            fileUploads: {
                s3region: process.env.COMPANION_S3_REGION as string,
                s3key: process.env.COMPANION_S3_KEY as string,
                s3secret: process.env.COMPANION_S3_SECRET as string,
                s3Bucket: process.env.COMPANION_S3_BUCKET as string,
                s3endpoint: process.env.COMPANION_S3_ENDPOINT as string,
                s3prefix: process.env.COMPANION_S3_PREFIX as string,
            },
            workers: {
                telemetry: {
                    enabled: false,
                },
                enabled: true,
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
    return instance;
}