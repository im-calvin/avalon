# Use the official Node.js image as the base image
FROM node:22.12.0

# Create and change to the app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]