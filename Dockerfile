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

# Build with specific settings to avoid API calls during build
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_dummy-key-for-build"
ENV CLERK_SECRET_KEY="sk_test_dummy-key-for-build"
ENV OPENAI_API_KEY="sk_dummy_key_for_build_only"
ENV TOGETHER_API_KEY="dummy_key_for_build_only"
ENV DATABASE_URL="file:./dummy.db"
ENV NEXT_TELEMETRY_DISABLED=1
# Skip static generation to avoid auth errors and API calls
ENV NEXT_SKIP_RENDER_COMPILATION=1
# This prevents Next.js from attempting data fetching during build
ENV NEXT_MINIMAL_BUILD=1

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
