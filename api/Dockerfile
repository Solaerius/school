FROM node:20-slim

WORKDIR /app

# Install OpenSSL + CA certs for Prisma engines
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3100
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
