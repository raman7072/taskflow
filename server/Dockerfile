FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy server code
COPY . .

# Change to whatever port your server.js listens on (e.g., 5000 or 3000)
EXPOSE 5000

CMD ["node", "server.js"]