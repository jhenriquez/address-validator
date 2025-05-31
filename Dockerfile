# Use Node.js 20 as the base image
FROM node:20-slim AS base

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Create app directory
WORKDIR /app

# Copy root configuration files first
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# Copy workspace package.json files (preserving directory structure)
COPY apps/api/package.json ./apps/api/
COPY packages/core/package.json ./packages/core/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build packages
RUN pnpm build

# Production image
FROM node:20-slim AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Copy package.json files
COPY --from=base /app/package.json ./
COPY --from=base /app/pnpm-lock.yaml* ./
COPY --from=base /app/pnpm-workspace.yaml* ./
COPY --from=base /app/apps/api/package.json ./apps/api/
COPY --from=base /app/packages/core/package.json ./packages/core/

# Copy built files
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=base /app/packages/core/dist ./packages/core/dist
COPY --from=base /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=base /app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production

# Expose the port your app runs on (adjust if needed)
EXPOSE 3000

# Start the application (adjust path if needed)
CMD ["node", "apps/api/dist/src/server.js"]
