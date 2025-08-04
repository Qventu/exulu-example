# Exulu - AI Agent Management Platform

<div align="center">

![Exulu Logo](frontend/public/exulu_logo.svg)

**A powerful platform for creating, managing, and orchestrating AI agents with enterprise-grade features**

[![Node.js](https://img.shields.io/badge/Node.js-20.10.0-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Private-red.svg)](LICENSE)

[🚀 Quick Start](#-quick-start) • [📚 Documentation](#-documentation) • [🏗️ Architecture](#️-architecture) • [🔧 Configuration](#-configuration)

</div>

---

## 🎯 Overview

Exulu is a comprehensive AI agent management platform that enables you to create, deploy, and orchestrate intelligent agents with enterprise-grade features. Built with TypeScript, it provides a robust backend infrastructure and modern frontend interface for seamless agent management and interaction.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Agent Management** | Create and manage multiple AI agents with different capabilities |
| 🔧 **Tool Integration** | Extend agent capabilities with custom tools and workflows |
| 🗄️ **Vector Database** | PostgreSQL with pgvector for semantic search and RAG |
| 📊 **Queue Management** | BullMQ for background job processing |
| 🔐 **Authentication** | JWT and NextAuth support with role-based access |
| 📝 **GraphQL API** | Flexible API with Apollo Server integration |
| 🎯 **Agent Evaluation** | Built-in evaluation framework for agent performance |
| 🔄 **Workflow Orchestration** | Create complex multi-agent workflows |
| 📦 **File Management** | S3-compatible storage with Uppy integration |
| 🎨 **Modern UI** | Next.js frontend with beautiful, responsive design |

---

## 🏗️ Architecture

The Exulu Intelligence Management Platform (IMP) is organized into **6 main repositories**:

### 📦 Repository Structure

| Repository | Description | Type |
|------------|-------------|------|
| **Backend** | NPM package with Exulu IMP server endpoints for agents, contexts, jobs, users, roles, and workflows | NPM Package |
| **Frontend** | Modern web application available as a Docker container | Docker Container |
| **Example** | Complete Exulu implementation with Docker reference files for PostgreSQL, Redis, and MinIO | Template Repository |
| **CLI** | Command-line interface tools available as an NPM package (`npm i @exulu/cli`) | NPM Package |
| **Tools** | Catalogue of ExuluTools that can be installed and added to agents | GitHub Repository |
| **Agents** | Catalogue of template agents you can install and add to your Exulu instance | GitHub Repository |

### 🧩 Core Classes and Interfaces

| Class | Purpose |
|-------|---------|
| **ExuluApp** | Main application class that initializes the platform |
| **ExuluAgent** | AI agent definitions with configurable capabilities |
| **ExuluTool** | Available actions and utilities for agents |
| **ExuluContext** | Vectorized knowledge sources agents can search through |
| **ExuluWorkflow** | Predefined agent interaction patterns |
| **ExuluEmbedder** | Defines embedding models |
| **ExuluEval** | Defines evaluations that can be run on agents |

---

## 🚀 Quick Start

### 1. Clone the Example Repository

```bash
git clone git@github.com:Qventu/exulu-example.git
cd exulu-example
```

### 2. Setup Git Remotes

```bash
# Keep original reference
git remote rename origin upstream

# Add your own repository (optional)
git remote add origin <your_repo_url>

# Verify remotes
git remote -v
```

### 3. Push to Your Repository

```bash
# For main branch
git push -u origin main

# For master branch (if different)
git checkout -b master
git push -u origin master
```

### 4. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
- PostgreSQL connection (with pgvector)
- Redis connection (optional, for background jobs)
- Authentication secret
- MinIO/S3 configuration (optional, for file storage)

### 5. License Setup

Create `.npmrc` in your project root:

```bash
engine-strict=true
@exulu:registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=<your_license_key>
```

### 6. Database Setup

```bash
# Initialize database and create default user
npm run init-db
```

> **⚠️ Important:** The default admin credentials and API key will be printed to the console. Save them securely!

---

## 🐳 Docker Deployment

### Available Configurations

| Configuration | Description | Use Case |
|---------------|-------------|----------|
| `docker-compose.dev.full.yml` | Complete development stack with auto-reload | Full local development |
| `docker-compose.dev.partial.yml` | Infrastructure only (PostgreSQL, Redis, MinIO) | Backend development |
| `docker-compose.prod.full.yml` | Complete production stack | Production deployment |
| `docker-compose.backend.prod.yml` | Backend only | Custom infrastructure |
| `docker-compose.worker.prod.yml` | Worker only | Custom infrastructure |

### Quick Commands

```bash
# Development (full stack)
NODE_ENV=dev docker compose -f ./docker-compose.dev.full.yml up --build -d

# Development (partial - infrastructure only)
NODE_ENV=dev docker compose -f ./docker-compose.dev.partial.yml up -d

# Production
NODE_ENV=prod docker compose -f ./docker-compose.prod.full.yml up --build -d

# Combine multiple compose files
NODE_ENV=dev docker compose -f ./docker-compose.dev.partial.yml -f ./docker-compose.frontend.yml up --build -d
```

---

## 💻 Local Development

### Prerequisites

- Node.js 20.10.0 (recommend using nvm)
- PostgreSQL with pgvector extension
- Redis (optional, for background jobs)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start worker (if needed)
npm run worker
```

### Database Initialization

```bash
# Initialize database (creates default user and API key)
npm run init-db
```

---

## 🔑 API Key Management

### Generating Additional API Keys

Create a script to generate new API keys:

```typescript
// utils/generate-api-key.ts
import { ExuluDatabase } from "@exulu/backend";

await ExuluDatabase.generateApiKey("your-username", "your-email@example.com");
console.log("Successfully generated API key.");
process.exit(0);
```

Run the script:

```bash
tsx utils/generate-api-key.ts
```

> **💡 Tip:** This is particularly useful when running Exulu as a pure backend without the frontend.

---

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

### Creating Workers

Create a `worker.ts` file in your project root:

```typescript
import { exulu } from "./server";

export default await exulu.bullmq.workers.create();
```

Run workers:

```bash
tsx worker.ts
```

> **⚠️ Note:** Ensure Redis is configured and running for queue functionality.

---

## 🔧 Configuration

### Environment Variables

Create `.env` files in both `frontend/` and `backend/` directories. Use the `.env.preview` files for reference.

> **⚠️ Important:** Docker deployment expects a `.env` file in the project root for build process and container configuration.

### Development Guidelines

- ✅ Follow TypeScript best practices
- ✅ Use conventional commits
- ✅ Write comprehensive tests
- ✅ Update documentation
- ✅ Follow existing code style

---

## 📄 License

This project is licensed under a private license - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Qventu Bv.** - *Initial work*

---

<div align="center">

**Exulu** - Intelligence Management Platform

*Empowering AI agents with enterprise-grade orchestration*

</div>