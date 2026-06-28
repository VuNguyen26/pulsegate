FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/product-service/package.json ./apps/product-service/package.json
COPY apps/api-gateway/package.json ./apps/api-gateway/package.json

RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate" npm run db:generate -w apps/product-service

EXPOSE 3001

CMD ["npm", "run", "dev:product"]