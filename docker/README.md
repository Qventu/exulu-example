# Docker Setup for Exulu Backend

This directory contains Docker configuration for running the Exulu backend example.

## Quick Start

### Development Mode
```bash
# Start in development mode with hot reload
NODE_ENV=development docker-compose -f docker-compose.backend.yml up --build
```

### Production Mode
```bash
# Start in production mode with PM2
NODE_ENV=production docker-compose -f docker-compose.backend.yml up --build
```

## Services

- **exulu-backend**: The main Express server running on port 9001
- **redis**: Redis server for session storage and caching (port 6379)
- **postgres**: PostgreSQL with pgvector for vector storage (port 5432)

## Environment Variables

- `NODE_ENV`: Set to `development` for hot reload with tsx watch, or `production` for PM2
- `PORT`: Server port (default: 9001)

## Usage

1. **Development**: The server will run with `tsx watch server.ts` for hot reloading
2. **Production**: The server will compile TypeScript and run with PM2 for process management

## Building the Image

```bash
# Build the Docker image
docker build -t exulu-backend .

# Run the container
docker run -p 9001:9001 exulu-backend
```

## Accessing the API

Once running, the API will be available at:
- http://localhost:9001

The server responds with a welcome message at the root endpoint. 