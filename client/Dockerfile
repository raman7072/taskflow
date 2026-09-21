FROM node:20-alpine

WORKDIR /app

# Install dependencies first for layer caching
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 5173

# --host allows external access outside the container
CMD ["npm", "run", "dev", "--", "--host"]