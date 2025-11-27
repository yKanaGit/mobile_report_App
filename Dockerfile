# Multi-stage build to create optimized production image
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies based on locked versions
COPY package*.json ./
RUN npm ci

# Copy source and build the app
COPY . .
RUN npm run build

# Lightweight runtime stage to serve prebuilt assets
FROM node:18-alpine AS runner
WORKDIR /app

# Install a minimal static file server
RUN npm install -g serve

# Copy only the build output to keep the image small
COPY --from=builder /app/dist ./dist

EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
