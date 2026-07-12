FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/product-service/package.json ./apps/product-service/package.json
COPY apps/api-gateway/package.json ./apps/api-gateway/package.json

RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate" npm run db:generate -w apps/product-service
RUN npm run build -w apps/product-service

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build --chown=node:node /app/apps/product-service/package.json ./apps/product-service/package.json
COPY --from=build --chown=node:node /app/apps/product-service/dist ./apps/product-service/dist
COPY --from=build --chown=node:node /app/apps/product-service/prisma ./apps/product-service/prisma
COPY --from=build --chown=node:node /app/node_modules ./node_modules

USER node

EXPOSE 3001

CMD ["node", "apps/product-service/dist/server.js"]