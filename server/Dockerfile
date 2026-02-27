# Multi-stage build for Node.js backend
FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

# Production image
FROM node:20-alpine

WORKDIR /app

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
  CMD wget -qO- http://localhost:8080/api/health || exit 1

CMD ["node", "src/index.js"]
