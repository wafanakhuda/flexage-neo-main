# Stage 1: Build stage
FROM node:20.18.0-alpine AS builder

# Set working directory
WORKDIR /app

# Use a specific npm version (optional but you included it)
RUN npm install -g npm@11.0.0

# Copy dependency files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Build the Next.js application
RUN npm run build


# Stage 2: Production stage
FROM node:20.18.0-alpine AS runner
WORKDIR /app

RUN npm install -g npm@11.0.0

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3100
CMD ["npm", "run", "start"]

