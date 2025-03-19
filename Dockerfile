# Use an official lightweight Node.js image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile

COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG OPENAI_API_KEY

# Ensure Next.js can access them during build
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV NEXT_SKIP_RENDER_COMPILATION=1

# Generate Prisma Client
RUN npx prisma generate

# Use the build environment setup script to provide mock values
# This prevents static generation errors when building without actual keys
RUN node -e "require('./next-build-env.js'); require('child_process').execSync('npm run build', {stdio: 'inherit'});"

FROM node:18-alpine AS runner

# Set runtime environment variables
ENV NODE_ENV=production
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV OPENAI_API_KEY=${OPENAI_API_KEY}

WORKDIR /app

# Copy only necessary files to reduce image size
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
