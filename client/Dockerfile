# React Client Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 5173

# Run Vite dev server exposing host
CMD ["npm", "run", "dev"]
