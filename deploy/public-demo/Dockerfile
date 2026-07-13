FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/admin-dashboard/package.json ./apps/admin-dashboard/package.json
COPY apps/api-gateway/package.json ./apps/api-gateway/package.json
COPY apps/developer-portal/package.json ./apps/developer-portal/package.json
COPY apps/product-service/package.json ./apps/product-service/package.json

RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://pulsegate:build-only@postgres:5432/pulsegate" npm run db:generate -w apps/product-service
RUN DATABASE_URL="postgresql://pulsegate:build-only@postgres:5432/pulsegate?schema=gateway" npm run db:generate -w apps/api-gateway
RUN npm run build -w apps/product-service
RUN npm run build -w apps/api-gateway

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/apps/api-gateway/package.json ./apps/api-gateway/package.json
COPY --from=build --chown=node:node /app/apps/product-service/package.json ./apps/product-service/package.json
COPY --from=build --chown=node:node /app/apps/api-gateway/dist ./apps/api-gateway/dist
COPY --from=build --chown=node:node /app/apps/api-gateway/prisma ./apps/api-gateway/prisma
COPY --from=build --chown=node:node /app/apps/api-gateway/src/generated/prisma ./apps/api-gateway/src/generated/prisma
COPY --from=build --chown=node:node /app/apps/product-service/dist ./apps/product-service/dist
COPY --from=build --chown=node:node /app/apps/product-service/prisma ./apps/product-service/prisma
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api-gateway/node_modules ./apps/api-gateway/node_modules
COPY --from=build --chown=node:node /app/deploy/public-demo/start.mjs ./deploy/public-demo/start.mjs

USER node

EXPOSE 10000

CMD ["node", "deploy/public-demo/start.mjs"]
