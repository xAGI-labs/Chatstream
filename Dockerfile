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
ARG CLERK_PUBLISHABLE_KEY
ARG OPENAI_API_KEY

# Ensure Next.js can access them
ENV CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY

# Generate Prisma Client if using Prisma
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Use a smaller base image for the production container
FROM node:18-alpine AS runner

# Set environment variables again for runtime
ENV NODE_ENV=production
ENV CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY

# Set working directory
WORKDIR /app

# Copy built files from the builder stage
COPY --from=builder /app ./

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
