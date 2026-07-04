# API Usage Analytics Runbook

## Purpose

This runbook validates successful usage analytics summary filters.

It covers Sprint 19 behavior for:

- Consumer usage summary filters.
- API key usage summary filters.
- Invalid query handling.
- Normalized filter response.

---

## Prerequisites

Run from repository root:

    cd E:\pulsegate

Expected local env values:

    ADMIN_API_KEY_HEADER=x-admin-api-key
    ADMIN_API_KEY=local-admin-key

---

## Start Runtime Stack

Start infrastructure:

    docker compose up -d postgres redis

Rebuild and start services:

    docker compose up -d --build product-service api-gateway

Validate API Gateway health:

    Invoke-WebRequest http://localhost:3000/health -UseBasicParsing

If the first health call fails immediately after startup, wait a few seconds and retry.

---

## Runtime Validation Script

Run this after the runtime stack is ready.

    $gatewayBaseUrl = "http://localhost:3000"
    $adminHeaders = @{
      "x-admin-api-key" = "local-admin-key"
    }

    function Invoke-Http {
      param(
        [string]$Method,
        [string]$Uri,
        [hashtable]$Headers = @{},
        [object]$Body = $null
      )

      $params = @{
        Method = $Method
        Uri = $Uri
        Headers = $Headers
        UseBasicParsing = $true
      }

      if ($null -ne $Body) {
        $params.ContentType = "application/json"
        $params.Body = ($Body | ConvertTo-Json -Depth 20)
      }

      try {
        $response = Invoke-WebRequest @params
        $json = $null

        if ($response.Content) {
          try {
            $json = $response.Content | ConvertFrom-Json
          } catch {}
        }

        return [pscustomobject]@{
          StatusCode = [int]$response.StatusCode
          Body = $response.Content
          Json = $json
        }
      } catch {
        if ($_.ErrorDetails.Message) {
          $bodyText = $_.ErrorDetails.Message
        } elseif ($_.Exception.Response) {
          $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
          $bodyText = $reader.ReadToEnd()
        } else {
          throw
        }

        $json = $null
        if ($bodyText) {
          try {
            $json = $bodyText | ConvertFrom-Json
          } catch {}
        }

        return [pscustomobject]@{
          StatusCode = [int]$_.Exception.Response.StatusCode
          Body = $bodyText
          Json = $json
        }
      }
    }

    Write-Host "Checking health..."
    $health = Invoke-Http -Method "GET" -Uri "$gatewayBaseUrl/health"

    if ($health.StatusCode -ne 200) {
      throw "Expected /health to return 200, got $($health.StatusCode)"
    }

    $suffix = Get-Date -Format "yyyyMMddHHmmss"

    Write-Host "Creating validation consumer..."
    $consumerResponse = Invoke-Http `
      -Method "POST" `
      -Uri "$gatewayBaseUrl/internal/admin/consumers" `
      -Headers $adminHeaders `
      -Body @{
        name = "Usage Filter Validation Consumer $suffix"
        description = "Runtime validation consumer for usage filters"
      }

    if ($consumerResponse.StatusCode -ne 201 -and $consumerResponse.StatusCode -ne 200) {
      $consumerResponse.Body
      throw "Expected consumer creation to return 200/201, got $($consumerResponse.StatusCode)"
    }

    $consumerId = $consumerResponse.Json.data.id

    if (-not $consumerId) {
      $consumerResponse.Json | ConvertTo-Json -Depth 20
      throw "Could not read consumer ID"
    }

    Write-Host "Creating validation API key..."
    $keyResponse = Invoke-Http `
      -Method "POST" `
      -Uri "$gatewayBaseUrl/internal/admin/consumers/$consumerId/api-keys" `
      -Headers $adminHeaders `
      -Body @{
        name = "Usage Filter Validation Key $suffix"
      }

    if ($keyResponse.StatusCode -ne 201 -and $keyResponse.StatusCode -ne 200) {
      $keyResponse.Body
      throw "Expected API key creation to return 200/201, got $($keyResponse.StatusCode)"
    }

    $apiKeyId = $keyResponse.Json.data.id

    if (-not $apiKeyId) {
      $keyResponse.Json | ConvertTo-Json -Depth 20
      throw "Could not read API key ID"
    }

    Write-Host "Checking invalid usage query..."
    $invalidConsumerSummary = Invoke-Http `
      -Method "GET" `
      -Uri "$gatewayBaseUrl/internal/admin/usage/consumers/$consumerId/summary?statusCode=99" `
      -Headers $adminHeaders

    if ($invalidConsumerSummary.StatusCode -ne 400) {
      $invalidConsumerSummary.Body
      throw "Expected invalid consumer usage summary query to return 400, got $($invalidConsumerSummary.StatusCode)"
    }

    if ($invalidConsumerSummary.Json.error.code -ne "INVALID_QUERY_PARAMETER") {
      $invalidConsumerSummary.Json | ConvertTo-Json -Depth 20
      throw "Expected INVALID_QUERY_PARAMETER for invalid consumer usage summary query"
    }

    Write-Host "Checking filtered consumer usage summary..."
    $consumerSummary = Invoke-Http `
      -Method "GET" `
      -Uri "$gatewayBaseUrl/internal/admin/usage/consumers/$consumerId/summary?routeMethod=get&routePath=/api/products&statusCode=200&cacheStatus=miss&apiKeyAuthSource=database" `
      -Headers $adminHeaders

    if ($consumerSummary.StatusCode -ne 200) {
      $consumerSummary.Body
      throw "Expected filtered consumer usage summary to return 200, got $($consumerSummary.StatusCode)"
    }

    if ($consumerSummary.Json.filters.routeMethod -ne "GET") {
      $consumerSummary.Json | ConvertTo-Json -Depth 20
      throw "Expected consumer summary routeMethod filter to be GET"
    }

    if ($consumerSummary.Json.filters.cacheStatus -ne "MISS") {
      $consumerSummary.Json | ConvertTo-Json -Depth 20
      throw "Expected consumer summary cacheStatus filter to be MISS"
    }

    if ($consumerSummary.Json.filters.statusCode -ne 200) {
      $consumerSummary.Json | ConvertTo-Json -Depth 20
      throw "Expected consumer summary statusCode filter to be 200"
    }

    Write-Host "Checking filtered API key usage summary..."
    $apiKeySummary = Invoke-Http `
      -Method "GET" `
      -Uri "$gatewayBaseUrl/internal/admin/usage/api-keys/$apiKeyId/summary?routeMethod=post&statusCode=500&cacheStatus=bypass" `
      -Headers $adminHeaders

    if ($apiKeySummary.StatusCode -ne 200) {
      $apiKeySummary.Body
      throw "Expected filtered API key usage summary to return 200, got $($apiKeySummary.StatusCode)"
    }

    if ($apiKeySummary.Json.filters.routeMethod -ne "POST") {
      $apiKeySummary.Json | ConvertTo-Json -Depth 20
      throw "Expected API key summary routeMethod filter to be POST"
    }

    if ($apiKeySummary.Json.filters.cacheStatus -ne "BYPASS") {
      $apiKeySummary.Json | ConvertTo-Json -Depth 20
      throw "Expected API key summary cacheStatus filter to be BYPASS"
    }

    if ($apiKeySummary.Json.filters.statusCode -ne 500) {
      $apiKeySummary.Json | ConvertTo-Json -Depth 20
      throw "Expected API key summary statusCode filter to be 500"
    }

    Write-Host "Filtered usage summary runtime validation PASSED"

---

## Expected Output

Expected status sequence:

    Checking health...
    Creating validation consumer...
    Creating validation API key...
    Checking invalid usage query...
    Checking filtered consumer usage summary...
    Checking filtered API key usage summary...
    Filtered usage summary runtime validation PASSED

Expected invalid query:

    StatusCode = 400
    error.code = INVALID_QUERY_PARAMETER

Expected normalized consumer filters:

    routeMethod = GET
    cacheStatus = MISS
    statusCode = 200

Expected normalized API key filters:

    routeMethod = POST
    cacheStatus = BYPASS
    statusCode = 500

---

## Supported Query Parameters

Consumer usage summary:

    GET /internal/admin/usage/consumers/:consumerId/summary

API key usage summary:

    GET /internal/admin/usage/api-keys/:apiKeyId/summary

Supported filters:

- from
- to
- routePath
- routeMethod
- statusCode
- cacheStatus
- apiKeyAuthSource

Validation rules:

- from and to must be valid ISO date-time strings.
- from must be earlier than or equal to to.
- statusCode must be an integer between 100 and 599.
- routeMethod must be one of GET, POST, PUT, PATCH, DELETE.
- cacheStatus must be one of HIT, MISS, BYPASS.

---

## Troubleshooting

### Health check fails immediately after startup

Wait a few seconds and retry:

    Start-Sleep -Seconds 5
    Invoke-WebRequest http://localhost:3000/health -UseBasicParsing

### Admin endpoint returns 401

Check admin API key header:

    x-admin-api-key: local-admin-key

### Invalid query does not return 400

Check that the query parser is wired in:

- apps/api-gateway/src/routes/admin-api-usage.route.ts
- apps/api-gateway/src/api-usage/api-usage-summary-query.ts

### Filters are not normalized

Check parser tests:

    npm run test --workspace api-gateway -- src/api-usage/api-usage-summary-query.test.ts

### Summary numbers are unexpected

Remember:

- Usage summaries read from gateway.api_usage_events.
- Rejected requests are stored in gateway.api_rejected_events, not gateway.api_usage_events.
- A newly created consumer/API key may have zero usage events.
