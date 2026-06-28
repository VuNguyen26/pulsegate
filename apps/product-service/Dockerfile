FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/product-service/package.json ./apps/product-service/package.json
COPY apps/api-gateway/package.json ./apps/api-gateway/package.json

RUN npm ci

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev:product"]