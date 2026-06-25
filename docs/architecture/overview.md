# PulseGate Architecture Overview

## 1. Project Overview

PulseGate is a High-Traffic API Gateway & Observability Platform.

The long-term goal is to build a mini API Gateway and API Management system inspired by:

* Kong
* Apache APISIX
* Tyk
* Apigee
* AWS API Gateway

PulseGate is designed to help backend teams manage, protect, monitor, and scale APIs in a microservice environment.

## 2. Target Users

PulseGate is designed for:

* Backend Developers
* DevOps Engineers
* SREs
* Tech Leads
* Companies with multiple internal or external APIs

## 3. Problems PulseGate Solves

PulseGate aims to solve these problems:

* Provide a single entry point for multiple backend services.
* Route client requests to the correct downstream service.
* Centralize authentication and authorization.
* Protect APIs from spam and abuse with rate limiting.
* Reduce backend load with caching.
* Add request logging for debugging.
* Add metrics for monitoring.
* Add distributed tracing for understanding request flow.
* Support event streaming and background jobs in later phases.
* Provide a foundation for future API management features.

## 4. Current Sprint 0 Architecture

Sprint 0 focuses only on the smallest working flow:

```txt
Client
  -> API Gateway :3000
    -> Product Service :3001
      -> Response
```

Current behavior:

1. Client sends a request to API Gateway.
2. API Gateway receives the request.
3. API Gateway creates or reuses a request ID.
4. API Gateway forwards the request to Product Service.
5. API Gateway forwards the same `x-request-id` header.
6. Product Service receives the request.
7. Product Service reuses the same request ID.
8. Product Service returns mock product data.
9. API Gateway returns the response to the client.

## 5. Current Services

### 5.1 API Gateway

Location:

```txt
apps/api-gateway
```

Port:

```txt
3000
```

Current endpoints:

```txt
GET /health
GET /api/products
```

Responsibilities:

* Acts as the single entry point for clients.
* Receives client requests.
* Generates or reuses request ID.
* Adds `x-request-id` response header.
* Routes `/api/products` to Product Service.
* Forwards `x-request-id` to downstream service.
* Handles basic 404 errors.
* Handles basic 500 errors.
* Logs requests in JSON format.

Current structure:

```txt
apps/api-gateway/src/
  config/
    env.ts
  middlewares/
    error-handler.middleware.ts
    request-id.middleware.ts
  routes/
    health.route.ts
    product-proxy.route.ts
  server.ts
```

### 5.2 Product Service

Location:

```txt
apps/product-service
```

Port:

```txt
3001
```

Current endpoints:

```txt
GET /health
GET /products
```

Responsibilities:

* Provides product-related APIs.
* Returns mock product data.
* Generates or reuses request ID.
* Reuses request ID from API Gateway.
* Handles basic 404 errors.
* Handles basic 500 errors.
* Logs requests in JSON format.

Current structure:

```txt
apps/product-service/src/
  config/
    env.ts
  middlewares/
    error-handler.middleware.ts
    request-id.middleware.ts
  routes/
    health.route.ts
    product.route.ts
  server.ts
```

## 6. Current Request Flow

### 6.1 Health Check Flow

API Gateway health check:

```txt
Client
  -> GET http://localhost:3000/health
    -> API Gateway
      -> Response
```

Product Service health check:

```txt
Client
  -> GET http://localhost:3001/health
    -> Product Service
      -> Response
```

### 6.2 Product API Flow

```txt
Client
  -> GET http://localhost:3000/api/products
    -> API Gateway
      -> GET http://127.0.0.1:3001/products
        -> Product Service
          -> Mock product response
      -> API Gateway
  -> Client
```

Expected response:

```json
{
  "data": [
    {
      "id": "prod_001",
      "name": "Mechanical Keyboard",
      "price": 120
    },
    {
      "id": "prod_002",
      "name": "Gaming Mouse",
      "price": 45
    }
  ]
}
```

## 7. Request ID Design

PulseGate uses request IDs from the beginning.

Purpose:

* Make debugging easier.
* Connect logs across services.
* Prepare for distributed tracing.
* Prepare for observability tools later.

Current request ID flow:

```txt
Client request
  -> API Gateway creates or reuses x-request-id
  -> API Gateway returns x-request-id in response header
  -> API Gateway forwards x-request-id to Product Service
  -> Product Service reuses the same request ID
```

## 8. Current Tech Stack

Currently implemented:

* Node.js
* TypeScript
* Fastify
* npm workspaces

Not implemented yet:

* PostgreSQL
* Prisma
* Redis
* Kafka
* RabbitMQ
* Docker
* Docker Compose
* Kubernetes
* Prometheus
* Grafana
* OpenTelemetry
* Jaeger or Tempo
* Loki
* k6
* Unit tests
* Integration tests

## 9. Monorepo Structure

Current repository structure:

```txt
pulsegate/
  apps/
    api-gateway/
    product-service/

  packages/
    shared/

  docs/
    architecture/
    sdlc/
    project-context/

  infra/

  package.json
  package-lock.json
  README.md
```

## 10. Current Design Principles

PulseGate follows these principles:

### 10.1 Local First

The project should run locally before adding cloud deployment.

### 10.2 Cost Safe

The first version should not require paid cloud infrastructure.

### 10.3 Small Steps

New technologies should be added only after the previous layer is stable.

### 10.4 Clean Structure

Each service should separate:

* Config
* Routes
* Middlewares
* Server startup

### 10.5 Observable by Design

Even in Sprint 0, request ID and JSON logging are added to prepare for future observability.

## 11. Future Target Architecture

Long-term architecture:

```txt
Client / Frontend / External API Consumer
  -> PulseGate API Gateway
    -> Auth Service
    -> Product Service
    -> Order Service
    -> Payment Service
    -> Notification Service

Services
  -> PostgreSQL
  -> Redis
  -> Kafka
  -> RabbitMQ

Observability
  -> Prometheus
  -> Grafana
  -> OpenTelemetry
  -> Jaeger or Tempo
  -> Loki

Infrastructure
  -> Docker Compose for local development
  -> Kubernetes later
  -> CI/CD with GitHub Actions
```

## 12. Planned Evolution

### Sprint 0

Goal:

* Set up repository.
* Set up TypeScript.
* Run API Gateway.
* Run Product Service.
* Route request from Gateway to Product Service.
* Add basic request ID, logging, health check, and error handling.
* Add initial documentation.

Status:

```txt
In progress
```

### Later Sprints

Planned features:

* API key authentication.
* JWT authentication.
* Rate limiting.
* Redis caching.
* PostgreSQL and Prisma.
* Docker Compose.
* Metrics with Prometheus.
* Dashboard with Grafana.
* Distributed tracing with OpenTelemetry.
* Kafka event streaming.
* RabbitMQ background jobs.
* Load testing with k6.
* CI/CD with GitHub Actions.
