# Stage 1: DevDocs environment setup
FROM ghcr.io/ruby/ruby:3.1-slim AS devdocs-base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    libxml2-dev \
    libxslt-dev \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Clone DevDocs repository
WORKDIR /app
RUN git clone https://github.com/freeCodeCamp/devdocs.git devdocs

# Install DevDocs dependencies
WORKDIR /app/devdocs
RUN bundle install

# Stage 2: Node.js MCP Server build
FROM node:18-alpine AS mcp-server

# Install build dependencies
RUN apk add --no-cache python3 make g++ sqlite-dev

# Copy package files
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Stage 3: Production environment
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    ruby \
    sqlite \
    git \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

# Copy DevDocs from first stage
COPY --from=devdocs-base /app/devdocs /app/devdocs

# Copy built MCP server from second stage
COPY --from=mcp-server /app/dist /app/dist
COPY --from=mcp-server /app/node_modules /app/node_modules
COPY --from=mcp-server /app/package.json /app/package.json

# Create data directory for persistent storage
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set working directory
WORKDIR /app

# Note: MCP servers use stdio communication, no HTTP port needed
# EXPOSE 3000

# Note: Health checks not typically needed for MCP servers
# as they're managed directly by the client process

# Start the server
CMD ["node", "dist/index.js"]
