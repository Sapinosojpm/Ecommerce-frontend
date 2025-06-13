# Stage 1: Build the React (Vite) app
FROM node:20-alpine AS build

# Install required dependencies
RUN apk add --no-cache python3 py3-pip make g++ linux-headers

# Set working directory
WORKDIR /app

# Copy dependency files and install
COPY package*.json ./
RUN npm install

# Copy the rest of the app source code
COPY . .

# Build the app (Vite outputs to 'dist' by default)
RUN npm run build

# Debug (optional): check build output
RUN ls -la dist

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built files from previous stage to Nginx's public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
