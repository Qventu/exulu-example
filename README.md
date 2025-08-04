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

The IMP is organized into 5 main repositories:


1. Backend: NPM package that includes the Exulu IMP server with endpoints for agents, contexts, jobs, users, roles and workflows.
2. Frontend: application available as a Docker container.
3. Example: example Exulu implementation you can use to get started including docker reference files for things like postgres, redis and minio (https://github.com/Qventu/exulu-example).
4. CLI: command-line interface tools available as an NPM package (npm i @exulu/cli).
5. Tools: catalogue of ExuluTools that can be installed and added to agents (https://github.com/Qventu/exulu-tools).
6. Agents: catalogue of template agents you can install and add to your Exulu instance (https://github.com/Qventu/exulu-agents).

### Core Classes and Interfaces

- **ExuluApp**: Main application class that initializes the platform
- **ExuluAgent**: AI agent definitions with configurable capabilities
- **ExuluTool**: Available actions and utilities for agents
- **ExuluContext**: Vectorized knowledge sources agents can search through and use in their reasoning and response
- **ExuluWorkflow**: Predefined agent interaction patterns
- **ExuluEmbedder**: Defines embedding models
- **ExuluEval**: Defines evaluations that can be run on agents

## 🚀 Getting Started

1. To create your first Exulu Application, pull the example repository from here:

```bash
git clone git@github.com:Qventu/exulu-example.git
```

2. To keep the original reference to the example repo run:

```bash
git remote rename origin upstream
```

3. Now you can optionally connect the project to your own remote repo:

```bash
git remote add origin <your_repo>
```

4. If you run "git remote -v" you should now see the original repo listed as an upstream remote as well as your own repo as origin

5. Now push to your remote by running (you might need to add --force if you have a pre-existing branch there). If your branch is not called main, but for example
master, run "git checkout -b master" first and then "git push -u origin master" instead.

```bash
git push -u origin main 
```

6. Now you need to copy the env.example to ".env" and setup the required variables such as your postgres connection, redis connection and authentication secret. The most basic requirement is a pgvector enabled postgres database. The docker-compose.dev.partial.yml and docker-compose.dev.full.yml include a pgvector enabled postgres service as well as a minio and redis instance. Redis is only needed if you want to run workers to process background jobs, which you can switch on or off in your ExuluApp class config property. Minio is a
s3 compatible object (file) storage and is also optional in case you want to enable users to upload and store files when they interact with agents.
7. Next make sure to get a Exulu IMP license key and create a .npmrc file in your project root. It should look like this:

> ```bash
> engine-strict=true
> @exulu:registry=https://registry.npmjs.org/
> //registry.npmjs.org/:_authToken=<your_license_key>
> ```

8. For the instance to work you need atleast a Postgres Database with PgVector enabled. We have provided several versions of docker compose files you can use to run Exulu easily on your local maschine, or when deployed to your server. Run these commands from the root folder of the project like this "NODE_ENV=dev docker compose -f ./docker-compose.dev.partial.yml -f ./docker-compose.frontend.yml up --build -d". Adjust which compose files you use based on your desired setup below:


| Configuration | Command |
|---------------|---------|
| docker-compose.dev.full.yml | `Will run the backend, frontend, minio, redis and postgres in docker containers sharing a network. Adjust your .env file to use the appropriate aliases inside the docker network. The backend service will mount and watch the files to enable auto-reload when something changes.` |
| docker-compose.dev.partial.yml | `Runs postgres, redis and minio only. You can then run your implementation of Exulu using "npm run dev:server" and "npm run dev:worker" respectively (if you need a worker). If you also need a frontend, run the "docker-compose.frontend.yml" as well (you can combine multiple compose files using the -f flag).` |
| docker-compose.prod.full.yml | `Will run the backend, frontend, minio, redis and postgres in docker containers sharing a network, but without mounting local files for the backend / worker.` |
| docker-compose.backend.prod.yml | `Just your Exulu backend implementation ready for production. Doesn't include a postgres, redis or minio container so you need to provision those yourself.` |
| docker-compose.worker.prod.yml | `Just your Exulu worker implementation ready for production. Doesn't include a postgres, redis or minio container so you need to provision those yourself.` |


// TODO describe setting up a worker.ts file for spawning workers

> **⚠️ Important:**  
> To run the containers in production mode, make sure to prefix your command with `NODE_ENV=prod`.  
> For example:  
> ```bash
> NODE_ENV=prod docker compose -f ./docker/docker-compose.backend.yml -f ./docker/docker-compose.pgvector.yml up -d
> ```

### Running the backend or worker without a container
If you don't want to run your backend in a container you can also just run it locally. Make sure you have node 20.10.0 running (we recommend using nvm) and then:

1. Install dependencies:
```bash
npm i
```

Then start the server like this:

```bash
npm run dev
```

You can also run your wokers outside a container like this:
```bash
npm run worker
```

Note that you need to make sure that your .env file contains the correct connection variables for postgres and optionally redis.

> **⚠️ Important - initializing the database and default user:**  
> If you are running the app for the first time, you can now initialize the Postgres Database tables by running (if you are running the backend via the docker container this is done automatically at startup):
> ```bash
> npm run init-db
> ```
> Note that this will create a default user and print the default admin login
> and API key to the console so you can save it somewhere for future use. This
> is practical if you are going to use Exulu as a pure backend without the optional
> frontend as you can use the API key to call the Exulu API's. This is the only time
> you will be able to access the generated API key.
> ### Generating Additional API Keys
> If you need to create additional API keys for different users or services, you can use the `generate-api-key.ts` script located in the `utils/` folder. This script allows you to generate new API keys via the terminal.
> 
> First, you can modify the script to specify the username and email for the new API key:
>
> ```typescript
> // utils/generate-api-key.ts
> import { ExuluDatabase } from "@exulu/backend";
> await ExuluDatabase.generateApiKey("your-username", "your-email@example.com");
> console.log("Successfully generated API key.");
> process.exit(0);
> ```
> Then run the script using:
> ```bash
> tsx utils/generate-api-key.ts
> ```
> This will generate a new API key for the specified user and print it to the console. > Make sure to save the generated API key securely as it won't be displayed again.
>
> This method is particularly convenient when running Exulu as a pure backend application without the optional frontend, as it provides a command-line way to manage API keys for different users and services.

## 📚 Usage Examples

### Creating an Agent

```typescript
import { ExuluApp, ExuluAgent } from "@exulu/backend";

const exulu = new ExuluApp();

const myAgent = new ExuluAgent({
  id: "my-custom-agent",
  name: "My Custom Agent",
  description: "A custom AI agent for specific tasks",
  type: "agent",
  capabilities: {
    tools: true,
    images: [],
    files: [],
    audio: [],
    video: []
  },
  config: {
    model: "gpt-4",
    // ... other configuration
  }
});

const server = await exulu.create({
  config: {
    workers: { enabled: false },
    MCP: { enabled: true }
  },
  contexts: [],
  tools: [],
  agents: [myAgent],
  workflows: []
});
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

### How to Create Workers

To create workers for background job processing, you need to create a `worker.ts` file that imports your ExuluApp instance and starts the worker process.

Create a `worker.ts` file in your project root:

```typescript
import { exulu } from "./server";

export default await exulu.bullmq.workers.create();
```

Then run the workers using:

```bash
tsx worker.ts
```

This will start the worker process that handles background jobs from your Exulu application. Make sure you have Redis configured and running if you want to use the queue functionality.

## 🔧 Configuration

### Environment Variables

Create `.env` files in both `frontend/` and `backend/` directories. Use the `.env.preview` files for reference.

> **⚠️ Important:**  
> The docker based deployment expects a .env file
> to be present on the project root folder on the maschine
> where the docker command is run and uses this for the build
> process as well as for copying the values into the container.
> This is mostly for convenience, if you wish to change this
> you will need to update the docker-compose and Dockerfiles
> accordingly.
> ```

### Development Guidelines

- Follow TypeScript best practices
- Use conventional commits
- Write comprehensive tests
- Update documentation
- Follow the existing code style

## 📄 License

This project is licensed under a private license - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Qventu Bv.** - *Initial work*

---

<div align="center">

**Exulu** - Intelligence Management Platform

</div>