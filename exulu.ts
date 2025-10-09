import { ExuluApp } from "@exulu/backend";
import { contexts } from "./src/contexts/index";
import { exampleAgent } from "./src/agents/index";
import tools from "./src/tools/index";

let instance: ExuluApp | null = null;
export const exulu = async (): Promise<ExuluApp> => {

    if (instance) {
        return instance;
    }

    instance = new ExuluApp();
    instance = await instance.create({
        config: {
            fileUploads: {
                s3region: process.env.COMPANION_S3_REGION as string,
                s3key: process.env.COMPANION_S3_KEY as string,
                s3secret: process.env.COMPANION_S3_SECRET as string,
                s3Bucket: process.env.COMPANION_S3_BUCKET as string,
                s3endpoint: process.env.COMPANION_S3_ENDPOINT as string,
            },
            telemetry: {
                enabled: true,
            },
            workers: {
                telemetry: {
                    enabled: true,
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
    return instance;
}