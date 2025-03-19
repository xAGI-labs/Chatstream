# Use an official lightweight Node.js image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies efficiently
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile

# Copy the rest of the project
COPY . .

# Pass environment variables at build time
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG OPENAI_API_KEY

# Ensure Next.js can access them
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY
# Disable static generation during build
ENV NEXT_SKIP_RENDER_COMPILATION=true 

# Generate Prisma Client if using Prisma
RUN npx prisma generate

# Build the Next.js application with static generation disabled
RUN npm run build

# Use a smaller base image for the production container
FROM node:18-alpine AS runner

# Set environment variables again for runtime
ENV NODE_ENV=production
ENV NEXT_PUBLIC_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV OPENAI_API_KEY=${OPENAI_API_KEY}

# Set working directory
WORKDIR /app

# Copy built files from the builder stage
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
