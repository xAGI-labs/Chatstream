# Use an official lightweight Node.js image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies first (for better caching)
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Set critical environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_SKIP_TYPE_CHECK=1
ENV NEXT_SKIP_RENDER_COMPILATION=1
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="dummy_for_build"
ENV CLERK_SECRET_KEY="dummy_for_build"
ENV OPENAI_API_KEY="dummy_for_build"
ENV TOGETHER_API_KEY="dummy_for_build"
ENV DATABASE_URL="file:./dummy.db"

# Build with output mode standalone
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary files from builder stage
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000/ || exit 1

EXPOSE 3000

# Start the application (runtime environment variables will be provided by Dokploy)
CMD ["node", "server.js"]
