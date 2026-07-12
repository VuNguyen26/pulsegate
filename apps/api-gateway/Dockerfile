FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/package.json
COPY apps/product-service/package.json ./apps/product-service/package.json

RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate?schema=gateway" npm run db:generate -w apps/api-gateway
RUN npm run build -w apps/api-gateway

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build --chown=node:node /app/apps/api-gateway/package.json ./apps/api-gateway/package.json
COPY --from=build --chown=node:node /app/apps/api-gateway/dist ./apps/api-gateway/dist
COPY --from=build --chown=node:node /app/apps/api-gateway/prisma ./apps/api-gateway/prisma
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api-gateway/node_modules ./apps/api-gateway/node_modules

USER node

EXPOSE 3000

CMD ["node", "apps/api-gateway/dist/server.js"]