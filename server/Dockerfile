# Express Server Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

# Create uploads directory in runtime container
RUN mkdir -p uploads

EXPOSE 5000

# Start Express application
CMD ["npm", "run", "start"]
