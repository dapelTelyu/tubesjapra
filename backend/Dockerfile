FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Expose port
EXPOSE 4000

# Start application (using dev script for auto-reload support during development)
CMD ["npm", "run", "dev"]
