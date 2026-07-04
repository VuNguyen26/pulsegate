# Usage Plans and Quotas Runbook

## Purpose

This runbook validates the Sprint 15 Usage Plans and Quota Foundation.

It proves that a DB-backed API key assigned to a DAILY usage plan with quotaLimit=1 can call a protected route once, then receives 429 QUOTA_EXCEEDED on the next request.

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

Apply API Gateway migrations:

    $env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"
    npx prisma migrate deploy --schema apps/api-gateway/prisma/schema.prisma

Rebuild and start services:

    docker compose up -d --build product-service api-gateway

Check containers:

    docker compose ps

Validate API Gateway health:

    Invoke-WebRequest http://localhost:3000/health -UseBasicParsing

---

## Runtime Validation Script

Run this from repository root after the runtime stack is ready:

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

    $jwtIssuer = (docker exec pulsegate-api-gateway printenv JWT_ISSUER).Trim()
    $jwtAudience = (docker exec pulsegate-api-gateway printenv JWT_AUDIENCE).Trim()

    $jwt = (& node -e "const crypto=require('crypto'); const enc=o=>Buffer.from(JSON.stringify(o)).toString('base64url'); const secret='local-dev-jwt-secret-change-me'; const issuer=process.argv[1]; const audience=process.argv[2]; const now=Math.floor(Date.now()/1000); const header={alg:'HS256',typ:'JWT'}; const payload={sub:'quota-runtime-user',role:'tester',iss:issuer,aud:audience,iat:now,exp:now+900}; const unsigned=enc(header)+'.'+enc(payload); const sig=crypto.createHmac('sha256',secret).update(unsigned).digest('base64url'); console.log(unsigned+'.'+sig);" $jwtIssuer $jwtAudience).Trim()

    $suffix = Get-Date -Format "yyyyMMddHHmmss"

    $consumerResponse = Invoke-Http `
      -Method "POST" `
      -Uri "$gatewayBaseUrl/internal/admin/consumers" `
      -Headers $adminHeaders `
      -Body @{
        name = "Quota Runtime Consumer $suffix"
        description = "Runtime validation consumer for Sprint 15 quota"
      }

    $consumerId = $consumerResponse.Json.data.id

    $keyResponse = Invoke-Http `
      -Method "POST" `
      -Uri "$gatewayBaseUrl/internal/admin/consumers/$consumerId/api-keys" `
      -Headers $adminHeaders `
      -Body @{
        name = "Quota Runtime Key $suffix"
      }

    $apiKeyId = $keyResponse.Json.data.id
    $rawApiKey = $keyResponse.Json.data.rawKey

    if (-not $apiKeyId) {
      $keyResponse.Json | ConvertTo-Json -Depth 20
      throw "Could not read API key ID from create API key response"
    }

    if (-not $rawApiKey) {
      $keyResponse.Json | ConvertTo-Json -Depth 20
      throw "Could not read raw API key from create API key response"
    }

    $planResponse = Invoke-Http `
      -Method "POST" `
      -Uri "$gatewayBaseUrl/internal/admin/usage-plans" `
      -Headers $adminHeaders `
      -Body @{
        name = "quota-runtime-plan-$suffix"
        description = "Runtime validation plan with daily limit 1"
        quotaLimit = 1
        quotaWindow = "DAILY"
        enabled = $true
      }

    $usagePlanId = $planResponse.Json.data.id

    $assignResponse = Invoke-Http `
      -Method "PATCH" `
      -Uri "$gatewayBaseUrl/internal/admin/api-keys/$apiKeyId/usage-plan" `
      -Headers $adminHeaders `
      -Body @{
        usagePlanId = $usagePlanId
      }

    $runtimeHeaders = @{
      "x-api-key" = $rawApiKey
      "Authorization" = "Bearer $jwt"
    }

    $firstProxyCall = Invoke-Http `
      -Method "GET" `
      -Uri "$gatewayBaseUrl/api/products" `
      -Headers $runtimeHeaders

    $secondProxyCall = Invoke-Http `
      -Method "GET" `
      -Uri "$gatewayBaseUrl/api/products" `
      -Headers $runtimeHeaders

    Write-Host "First /api/products status:" $firstProxyCall.StatusCode
    Write-Host "First /api/products body:"
    $firstProxyCall.Body

    Write-Host "Second /api/products status:" $secondProxyCall.StatusCode
    Write-Host "Second /api/products body:"
    $secondProxyCall.Body

    if ($firstProxyCall.StatusCode -ne 200) {
      throw "Expected first /api/products call to return 200, got $($firstProxyCall.StatusCode)"
    }

    if ($secondProxyCall.StatusCode -ne 429) {
      throw "Expected second /api/products call to return 429, got $($secondProxyCall.StatusCode)"
    }

    if ($secondProxyCall.Json.error.code -ne "QUOTA_EXCEEDED") {
      throw "Expected QUOTA_EXCEEDED, got $($secondProxyCall.Json.error.code)"
    }

    Write-Host "Quota runtime validation PASSED: first call 200, second call 429 QUOTA_EXCEEDED"

---

## Expected Output

Expected status sequence:

    First /api/products status: 200
    Second /api/products status: 429
    Quota runtime validation PASSED: first call 200, second call 429 QUOTA_EXCEEDED

Expected over-quota response:

    {
      "error": {
        "code": "QUOTA_EXCEEDED",
        "message": "API key quota has been exceeded for the current quota window.",
        "requestId": "..."
      }
    }

---

## Troubleshooting

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