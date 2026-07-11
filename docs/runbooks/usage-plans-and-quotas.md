# Usage Plans and Quotas Runbook

## Purpose

This runbook validates usage plans, runtime quota enforcement, and quota observability.

It covers:

- Sprint 15 usage plan and quota foundation.
- Sprint 16 quota observability and quota metadata.

---

## Prerequisites

Run from repository root:

    cd E:\pulsegate

Expected local env values:

    API_KEY_HEADER=x-api-key
    ADMIN_API_KEY_HEADER=x-admin-api-key
    ADMIN_API_KEY=local-admin-key
    JWT_SECRET=local-dev-jwt-secret-change-me
    JWT_ISSUER=pulsegate-api-gateway
    JWT_AUDIENCE=pulsegate-clients

---

## Start Runtime Stack

Start infrastructure:

    docker compose up -d postgres redis

Apply Product Service migrations:

    $env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate"
    npx prisma migrate deploy --schema apps/product-service/prisma/schema.prisma

Apply API Gateway migrations:

    $env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"
    npx prisma migrate deploy --schema apps/api-gateway/prisma/schema.prisma

Rebuild and start services:

    docker compose up -d --build product-service api-gateway
    docker compose ps

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

    Write-Host "Checking API Gateway health..."
    $health = Invoke-Http -Method "GET" -Uri "$gatewayBaseUrl/health"

    if ($health.StatusCode -ne 200) {
      throw "Expected /health to return 200, got $($health.StatusCode)"
    }

    $jwtIssuer = (docker exec pulsegate-api-gateway printenv JWT_ISSUER).Trim()
    $jwtAudience = (docker exec pulsegate-api-gateway printenv JWT_AUDIENCE).Trim()

    $jwt = (& node -e "const crypto=require('crypto'); const enc=o=>Buffer.from(JSON.stringify(o)).toString('base64url'); const secret='local-dev-jwt-secret-change-me'; const issuer=process.argv[1]; const audience=process.argv[2]; const now=Math.floor(Date.now()/1000); const header={alg:'HS256',typ:'JWT'}; const payload={sub:'quota-observability-user',role:'tester',iss:issuer,aud:audience,iat:now,exp:now+900}; const unsigned=enc(header)+'.'+enc(payload); const sig=crypto.createHmac('sha256',secret).update(unsigned).digest('base64url'); console.log(unsigned+'.'+sig);" $jwtIssuer $jwtAudience).Trim()

    $suffix = Get-Date -Format "yyyyMMddHHmmss"

    $consumerResponse = Invoke-Http `
      -Method "POST" `
      -Uri "$gatewayBaseUrl/internal/admin/consumers" `
      -Headers $adminHeaders `
      -Body @{
        name = "Quota Observability Consumer $suffix"
        description = "Runtime validation consumer for quota observability"
      }

    $consumerId = $consumerResponse.Json.data.id

    if (-not $consumerId) {
      $consumerResponse.Json | ConvertTo-Json -Depth 20
      throw "Could not read consumer ID"
    }

    $keyResponse = Invoke-Http `
      -Method "POST" `
      -Uri "$gatewayBaseUrl/internal/admin/consumers/$consumerId/api-keys" `
      -Headers $adminHeaders `
      -Body @{
        name = "Quota Observability Key $suffix"
      }

    $apiKeyId = $keyResponse.Json.data.id
    $rawApiKey = $keyResponse.Json.data.rawKey

    if (-not $apiKeyId) {
      $keyResponse.Json | ConvertTo-Json -Depth 20
      throw "Could not read API key ID"
    }

    if (-not $rawApiKey) {
      $keyResponse.Json | ConvertTo-Json -Depth 20
      throw "Could not read raw API key"
    }

    $planResponse = Invoke-Http `
      -Method "POST" `
      -Uri "$gatewayBaseUrl/internal/admin/usage-plans" `
      -Headers $adminHeaders `
      -Body @{
        name = "quota-observability-plan-$suffix"
        description = "Runtime validation plan with daily limit 1"
        quotaLimit = 1
        quotaWindow = "DAILY"
        enabled = $true
      }

    $usagePlanId = $planResponse.Json.data.id

    if (-not $usagePlanId) {
      $planResponse.Json | ConvertTo-Json -Depth 20
      throw "Could not read usage plan ID"
    }

    $assignResponse = Invoke-Http `
      -Method "PATCH" `
      -Uri "$gatewayBaseUrl/internal/admin/api-keys/$apiKeyId/usage-plan" `
      -Headers $adminHeaders `
      -Body @{
        usagePlanId = $usagePlanId
      }

    if ($assignResponse.StatusCode -ne 200) {
      $assignResponse.Body
      throw "Expected usage plan assignment to return 200, got $($assignResponse.StatusCode)"
    }

    $runtimeHeaders = @{
      "x-api-key" = $rawApiKey
      "Authorization" = "Bearer $jwt"
    }

    $firstProxyCall = Invoke-Http `
      -Method "GET" `
      -Uri "$gatewayBaseUrl/api/products" `
      -Headers $runtimeHeaders

    $quotaStateResponse = Invoke-Http `
      -Method "GET" `
      -Uri "$gatewayBaseUrl/internal/admin/api-keys/$apiKeyId/quota" `
      -Headers $adminHeaders

    $secondProxyCall = Invoke-Http `
      -Method "GET" `
      -Uri "$gatewayBaseUrl/api/products" `
      -Headers $runtimeHeaders

    $usagePlanSummaryResponse = Invoke-Http `
      -Method "GET" `
      -Uri "$gatewayBaseUrl/internal/admin/usage-plans/$usagePlanId/usage-summary" `
      -Headers $adminHeaders

    Write-Host "First /api/products status:" $firstProxyCall.StatusCode
    Write-Host "API key quota state status:" $quotaStateResponse.StatusCode
    Write-Host "Second /api/products status:" $secondProxyCall.StatusCode
    Write-Host "Usage plan summary status:" $usagePlanSummaryResponse.StatusCode

    if ($firstProxyCall.StatusCode -ne 200) {
      throw "Expected first /api/products call to return 200, got $($firstProxyCall.StatusCode)"
    }

    if ($quotaStateResponse.StatusCode -ne 200) {
      throw "Expected API key quota state endpoint to return 200, got $($quotaStateResponse.StatusCode)"
    }

    if ($quotaStateResponse.Json.data.quota.usedRequests -ne 1) {
      throw "Expected usedRequests to be 1, got $($quotaStateResponse.Json.data.quota.usedRequests)"
    }

    if ($quotaStateResponse.Json.data.quota.remainingRequests -ne 0) {
      throw "Expected remainingRequests to be 0, got $($quotaStateResponse.Json.data.quota.remainingRequests)"
    }

    if ($quotaStateResponse.Json.data.quota.exceeded -ne $true) {
      throw "Expected quota state exceeded=true"
    }

    if ($quotaStateResponse.Json.data.quota.enforced -ne $true) {
      throw "Expected quota state enforced=true"
    }

    if ($secondProxyCall.StatusCode -ne 429) {
      throw "Expected second /api/products call to return 429, got $($secondProxyCall.StatusCode)"
    }

    if ($secondProxyCall.Json.error.code -ne "QUOTA_EXCEEDED") {
      throw "Expected QUOTA_EXCEEDED, got $($secondProxyCall.Json.error.code)"
    }

    if ($secondProxyCall.Json.error.details.quotaLimit -ne 1) {
      throw "Expected quotaLimit detail to be 1"
    }

    if ($secondProxyCall.Json.error.details.quotaWindow -ne "DAILY") {
      throw "Expected quotaWindow detail to be DAILY"
    }

    if ($secondProxyCall.Json.error.details.usedRequests -ne 1) {
      throw "Expected usedRequests detail to be 1"
    }

    if ($secondProxyCall.Json.error.details.remainingRequests -ne 0) {
      throw "Expected remainingRequests detail to be 0"
    }

    if (-not $secondProxyCall.Json.error.details.resetAt) {
      throw "Expected resetAt detail to exist"
    }

    if ($usagePlanSummaryResponse.StatusCode -ne 200) {
      throw "Expected usage plan summary endpoint to return 200, got $($usagePlanSummaryResponse.StatusCode)"
    }

    if ($usagePlanSummaryResponse.Json.data.usagePlan.id -ne $usagePlanId) {
      throw "Expected usage plan summary to return the created usage plan"
    }

    if ($usagePlanSummaryResponse.Json.data.assignedApiKeys -lt 1) {
      throw "Expected assignedApiKeys to be at least 1"
    }

    if ($usagePlanSummaryResponse.Json.data.activeApiKeys -lt 1) {
      throw "Expected activeApiKeys to be at least 1"
    }

    if ($usagePlanSummaryResponse.Json.data.totalRequestsInCurrentWindow -lt 1) {
      throw "Expected totalRequestsInCurrentWindow to be at least 1"
    }

    Write-Host "Sprint quota observability runtime validation PASSED"

---

## Expected Output

Expected status sequence:

    First /api/products status: 200
    API key quota state status: 200
    Second /api/products status: 429
    Usage plan summary status: 200
    Sprint quota observability runtime validation PASSED

Expected API key quota state:

    usedRequests = 1
    remainingRequests = 0
    exceeded = true
    enforced = true

Expected over-quota response:

    code = QUOTA_EXCEEDED
    details.quotaLimit = 1
    details.quotaWindow = DAILY
    details.usedRequests = 1
    details.remainingRequests = 0
    details.resetAt exists

Expected usage plan summary:

    assignedApiKeys >= 1
    activeApiKeys >= 1
    totalRequestsInCurrentWindow >= 1
    exceededApiKeys >= 1
    topApiKeysByUsage includes the runtime API key

---

## Troubleshooting

### Health check fails immediately after startup

Wait a few seconds and retry:

    Start-Sleep -Seconds 5
    Invoke-WebRequest http://localhost:3000/health -UseBasicParsing

### JWT_TOKEN_INVALID

Check JWT issuer and audience:

    docker exec pulsegate-api-gateway printenv JWT_ISSUER
    docker exec pulsegate-api-gateway printenv JWT_AUDIENCE

The JWT must include:

- iss=pulsegate-api-gateway
- aud=pulsegate-clients

### First Request Returns 403

Check whether the response is API key related or JWT related.

DB-backed key without JWT should return:

    JWT_TOKEN_MISSING

If it returns API_KEY_INVALID, the raw API key is wrong or the database verifier cannot find it.

### Second Request Does Not Return 429

Check that:

- API key has usagePlanId.
- Usage plan is enabled.
- quotaLimit is 1.
- quotaWindow is DAILY.
- First request returned 200 and created a usage event.

### Quota State Does Not Show usedRequests=1

Check:

- First /api/products request returned 200.
- API usage recorder wrote to gateway.api_usage_events.
- The API key ID in the quota state endpoint matches the runtime key.
- The quota window is the current UTC day.

## Sprint 63 Dashboard Quota Inspection

Product/documentation version: `v1.3.0`.

The `/usage-analytics` page adds read-only lookups for:

- one API key quota state
- one usage-plan current-window summary

The Dashboard displays the Gateway-provided quota contract. It does not recalculate quota, assign plans, update plans, revoke keys, or mutate usage.

Source-of-truth rules remain unchanged:

- `gateway.api_usage_events` is the quota-counting source.
- Disabled/no-plan behavior remains owned by the Gateway.
- Prometheus, Grafana, and analytics rollups are not quota-counting sources.
- Rejected events remain separate from successful usage.
