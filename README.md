# Exulu - AI Agent Management Platform

<div align="center">

![Exulu Logo](frontend/public/exulu_logo.svg)

**A powerful platform for creating, managing, and orchestrating AI agents with enterprise-grade features**

[![Node.js](https://img.shields.io/badge/Node.js-20.10.0-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Private-red.svg)](LICENSE)

</div>

## 🚀 Overview

Exulu is a comprehensive AI agent management platform that enables you to create, deploy, and orchestrate intelligent agents with enterprise-grade features. Built with TypeScript, it provides a robust backend infrastructure and modern frontend interface for seamless agent management and interaction.

### Key Features

- 🤖 **AI Agent Management**: Create and manage multiple AI agents with different capabilities
- 🔧 **Tool Integration**: Extend agent capabilities with custom tools and workflows
- 🗄️ **Vector Database**: PostgreSQL with pgvector for semantic search and RAG
- 📊 **Queue Management**: BullMQ for background job processing
- 🔐 **Authentication**: JWT and NextAuth support with role-based access
- 📝 **GraphQL API**: Flexible API with Apollo Server integration
- 🎯 **Agent Evaluation**: Built-in evaluation framework for agent performance
- 🔄 **Workflow Orchestration**: Create complex multi-agent workflows
- 📦 **File Management**: S3-compatible storage with Uppy integration
- 🎨 **Modern UI**: Next.js frontend.

## 🏗️ Architecture

The IMP is organized into 4 main repositories:

1. Backend: NPM package that includes the Exulu IMP server with endpoints for agents, contexts, jobs, users, roles and workflows.
2. Frontend: application available as a Docker container.
3. Example: example Exulu implementation you can use to get started including docker reference files for things like postgres, redis and minio (https://github.com/Qventu/exulu-example).
4. CLI: command-line interface tools available as an NPM package (npm i @exulu/cli).

### Core Classes and Interfaces

- **ExuluApp**: Main application class that initializes the platform
- **ExuluAgent**: AI agent definitions with configurable capabilities
- **ExuluTool**: Available actions and utilities for agents
- **ExuluContext**: Vectorized knowledge sources agents can search through and use in their reasoning and response
- **ExuluWorkflow**: Predefined agent interaction patterns
- **ExuluEmbedder**: Defines embedding models

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have:
- Node.js 22.17.0 (we recommend using [nvm](https://github.com/nvm-sh/nvm))
- Docker (for running local services such as Postgres and Redis)
- An Exulu IMP license key for the backend (available from your account at [partners.exulu.com](https://partners.exulu.com)) or via your license partner

### Step 1: Clone the Example Repository

```bash
git clone git@github.com:Qventu/exulu-example.git
cd exulu-example
```

### Step 2: Configure NPM Registry Access

Create a `.npmrc` file in your project root with your Exulu IMP license key:

```bash
engine-strict=true
@exulu:registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=<your_license_key>
```

### Step 3: Set Up Environment Variables

Copy the example environment file and configure it for your setup.

```bash
cp .env.example .env
```

The `.env.example` file is pre-configured for local development with Docker services for Postgres, Redis and Minio. Edit `.env` if you need to connect to different infrastructure (e.g., AWS S3, managed PostgreSQL, etc.).

### Step 4: Start Required Services

Launch PostgreSQL (with pgvector), Redis, and MinIO using Docker Compose:

```bash
docker compose -f ./docker-compose.services.yml up --build -d
```

**Note:** You can customize `docker-compose.services.yml` to:
- Run only PostgreSQL if you want to use external Redis or S3-compatible storage
- Adjust ports, credentials, or other service configurations

**Required Service:**
- PostgreSQL with pgvector extension (required)

**Optional Services:**
- Redis (only needed if using queues/workers)
- MinIO or S3-compatible storage (only needed if enabling file uploads in your ExuluApp instance)

### Step 5: Install Dependencies

Make sure you're using the correct Node.js version:

```bash
nvm use  # This will automatically use the version specified in .nvmrc
npm install
```

### Step 6: Initialize the Database

On first run, initialize the PostgreSQL database tables (this needs to be done as well if you add, or change ExuluContext instances
as this will update columns based on your defined fields and generate indexes if needed).

```bash
npm run init-db
```

This will also create a default admin user. **Save the generated login credentials and API key** that are printed to the console - you won't be able to retrieve the API key again. If you run the frontend as well you can login by default using admin@exulu.com / admin (we recommend changing
this as soon as possible after first login).

### Step 7: Start the Exulu Server

```bash
npm run dev:server
```

Your Exulu backend will now be running and ready to accept requests.

### Step 8: Start the Frontend (Optional)

To access the Exulu web interface, run:

```bash
npx @exulu/frontend
```

The frontend will start and connect to your local Exulu backend.

### Step 9: Start Workers (Optional)

If you're using background job processing with queues, start the worker process (requires a Redis instance):

```bash
npm run dev:worker
```

---

## 🔄 Alternative Deployment Methods

While the recommended approach above is best for local development, Exulu supports running all aspects via Docker as well. For this you 
can use the docker-compose.backend.yml, docker-compose.worker.yml and docker-compose.frontend.yml files respectively. Do keep in mind
that this will require you to update  your .env file to set the correct variables, and keep in mind that these services connect via a docker
network to eachother (we have left some instructions about which connection variables need to be changed when running in a docker network in the .env.example file).

> **⚠️ Important:**  
> To run containers in production mode, always prefix commands with `NODE_ENV=prod`.

### Generating Additional API Keys

If you need to create additional API keys for different users or services, use the `generate-api-key.ts` script in the `utils/` folder.

First, modify the script to specify the username and email:

```typescript
// utils/generate-api-key.ts
import { db } from "@exulu/backend";
const { key } = await db.api.key.generate("test", "test@test.com");
console.log("Successfully generated api key.", key);
process.exit(0);
```

Then run:

```bash
tsx utils/generate-api-key.ts
```

The generated API key will be printed to the console. Save it securely as it won't be displayed again.

---

## 📚 Usage Examples

### Creating an Agent

```typescript
import { ExuluApp, ExuluAgent } from "@exulu/backend";
import { claudeSonnet45Agent } from './templates/agents/anthropic/claude'

const exulu = new ExuluApp();

export const claudeSonnet45Agent = new ExuluAgent({
    id: `claude_code_agent`,
    name: `CLAUDE-SONNET-4.5`,
    provider: "anthropic",
    description: `Best Anthropic model for complex agents and coding. Highest intelligence across most tasks with exceptional agent and coding capabilities`,
    type: "agent",
    capabilities: {
        text: true,
        images: [".png", ".jpg", ".jpeg", ".webp"],
        files: [".pdf", ".docx", ".xlsx", ".xls", ".csv", ".pptx", ".ppt", ".json"],
        audio: [],
        video: [],
    },
    maxContextLength: 200000,
    config: {
        name: `CLAUDE-SONNET-4.5`,
        instructions: "",
        model: {
            create: ({ apiKey }) => {
                const anthropic = createAnthropic({
                    apiKey: apiKey
                })
                return anthropic.languageModel("claude-sonnet-4-5")
            }
        }
    }
})

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
            claudeSonnet45Agent
        ]
    })
    return instance;
}

const start = async () => {

  const app = await exulu();
  const server = await app.express.init();
  
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

```

### Using the CLI

```bash
# Install CLI globally
npm install -g @exulu/cli

# Run CLI
exulu

# Available commands:
# - Start Claude Code
# - List agents
# - List contexts
```

### Creating Workers

To create workers for background job processing, create a `worker.ts` file in your project root:

```typescript
import {exulu} from "./exulu";

const worker = async () => {
  const app = await exulu();
  const worker = await app.bullmq.workers.create(); // create takes an optional array of queue names (["queue1", "queue2"]) that allows you to define what queues this worker should listen to. If not provided the worker will listen to all queues.
  return worker;
}

worker();
```

Then run the workers:

```bash
tsx worker.ts
```

If you don't have tsx installed, you can install it globally using "npm i -g tsx". This makes it easy to run .ts files directly.

Make sure Redis is configured and running to use the queue functionality.

---

## 🔧 Configuration

### Environment Variables

The `.env.example` file provides a template for local development. Key variables include:

- **Database**: PostgreSQL connection settings
- **Redis**: Queue/cache connection (optional)
- **Storage**: MinIO/S3 configuration (optional)
- **Authentication**: JWT secrets and session configuration
- **OpenTelemetry**: Logging and tracing configuration (optional)

Copy `.env.example` to `.env` and adjust values based on your infrastructure.

### Configuring OpenTelemetry for Logging and Tracing

Exulu integrates with [SigNoz](https://signoz.io/) for observability using OpenTelemetry (OTEL). Enable telemetry in your ExuluApp configuration:

```typescript
export const exulu = new ExuluApp();

const server = await exulu.create({
  config: {
    telemetry: {
      enabled: true // Backend telemetry
    },
    workers: {
      telemetry: {
        enabled: true // Worker telemetry
      },
      enabled: false,
    },
    MCP: {
      enabled: true,
      telemetry: {
        enabled: true // MCP server telemetry
      }
    }
  },
  contexts,
  tools: [...tools],
  agents: [exampleAgent]
});
```

#### Setting Up SigNoz

You can use either SigNoz Cloud or self-host the open-source version.

**Self-Hosted Installation:**

```bash
git clone -b main https://github.com/SigNoz/signoz.git && cd signoz/deploy/
docker compose up -d --remove-orphans
```

Configure your `.env` file with SigNoz connection details:

```bash
SIGNOZ_TRACES_URL=http://localhost:4318/v1/traces
SIGNOZ_LOGS_URL=http://localhost:4318/v1/logs
SIGNOZ_ACCESS_TOKEN=your-access-token
```

#### Running with OpenTelemetry

Create an `otel.ts` file to initialize telemetry:

```typescript
import { ExuluOtel } from "@exulu/backend";

const otel = ExuluOtel.create({
  SIGNOZ_TRACES_URL: process.env.SIGNOZ_TRACES_URL!,
  SIGNOZ_LOGS_URL: process.env.SIGNOZ_LOGS_URL!,
  SIGNOZ_ACCESS_TOKEN: process.env.SIGNOZ_ACCESS_TOKEN!
});

otel.start();
```

**Development:**
```bash
npm run dev:server:otel
npm run dev:worker:otel
```

**Production:**
```bash
npm run start:server:otel
npm run start:worker:otel
```

#### Storage Requirements for SigNoz

SigNoz uses ClickHouse as its OLAP database. Typical requirements:
- **Retention**: 7 days for logs/traces, 30 days for metrics (configurable)
- **Storage**: ~60GB for one month of logs
- **Server**: 2 CPUs, 4GB RAM is sufficient for most deployments

---

## 👥 Development Guidelines

- Follow TypeScript best practices
- Use conventional commits
- Write comprehensive tests
- Update documentation
- Follow the existing code style

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The Exulu Example Project is open source, while the Exulu IMP backend requires a commercial license. See [exulu.com](https://exulu.com) for backend licensing information.

---

<div align="center">

**Exulu Example** - Open-source example project for the Exulu Intelligence Management Platform

Made with ❤️ by [Qventu](https://qventu.com)

</div>