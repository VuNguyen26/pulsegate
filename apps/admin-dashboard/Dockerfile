FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/admin-dashboard/package.json ./apps/admin-dashboard/package.json
COPY apps/api-gateway/package.json ./apps/api-gateway/package.json
COPY apps/product-service/package.json ./apps/product-service/package.json
COPY apps/developer-portal/package.json ./apps/developer-portal/package.json

RUN npm ci

COPY . .

RUN npm run build -w apps/admin-dashboard


FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/apps/admin-dashboard/package.json ./apps/admin-dashboard/package.json
COPY --from=build --chown=node:node /app/apps/admin-dashboard/next.config.ts ./apps/admin-dashboard/next.config.ts
COPY --from=build --chown=node:node /app/apps/admin-dashboard/.next ./apps/admin-dashboard/.next
COPY --from=build --chown=node:node /app/node_modules ./node_modules

USER node

EXPOSE 3003

CMD ["npm", "run", "start", "-w", "apps/admin-dashboard", "--", "--hostname", "0.0.0.0"]
