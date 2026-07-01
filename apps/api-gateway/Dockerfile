FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/package.json
COPY apps/product-service/package.json ./apps/product-service/package.json

RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate?schema=gateway" npm run db:generate -w apps/api-gateway

CMD ["npm", "run", "dev:gateway"]