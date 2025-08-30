# ---------- Build Stage ----------
FROM node:20-slim AS builder

WORKDIR /app

# Copy manifest files first (better caching)
COPY package*.json tsconfig.json ./

# Install all deps (devDependencies needed for tsc build)
RUN npm install

# Copy source
COPY src ./src

# Build TypeScript -> dist
RUN npm run build

# ---------- Runtime Stage ----------
FROM node:20-slim

WORKDIR /app

# Copy package.json for runtime deps
COPY package*.json ./

# Install only production deps
RUN npm install --production

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Start worker
CMD ["node", "dist/index.js"]
