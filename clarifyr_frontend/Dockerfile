# ==========================================
# Stage 1: Build the React Application
# ==========================================
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# Set up build arguments for environment variables
# Vite injects VITE_* prefixed variables during static compilation
ARG VITE_API_BASE_URL
ARG VITE_WS_URL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Build the production bundle
RUN npm run build

# ==========================================
# Stage 2: Serve using Nginx
# ==========================================
FROM nginx:stable-alpine

# Copy built assets to Nginx default html folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration to support SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
