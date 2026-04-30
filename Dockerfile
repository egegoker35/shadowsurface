FROM node:20-slim AS base
WORKDIR /app

# Install openssl for Prisma + tini for proper signal handling
RUN apt-get update -y && apt-get install -y openssl ca-certificates tini && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["npm", "run", "start"]
