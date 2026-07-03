# API Key Lifecycle Runbook

This runbook contains manual commands for validating API consumer and API key lifecycle behavior.

## Admin Auth

Current local admin header:

```txt
x-admin-api-key
```

Current local admin key:

```txt
local-admin-key
```

Optional actor header:

```txt
x-admin-actor
```

## Create API Consumer

```powershell
$consumerBody = @{
  name = "Local Test Consumer"
  description = "Local validation consumer"
} | ConvertTo-Json -Depth 10

$consumerResponse = Invoke-RestMethod http://localhost:3000/internal/admin/consumers `
  -Method POST `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-validation"
    "content-type" = "application/json"
  } `
  -Body $consumerBody

$consumerId = $consumerResponse.data.id

$consumerResponse | ConvertTo-Json -Depth 10
```

Expected:

```txt
Consumer is created.
status = ACTIVE
createdBy = local-validation
updatedBy = local-validation
```

## List API Consumers

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/consumers `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
```

## Get API Consumer Detail

```powershell
Invoke-RestMethod "http://localhost:3000/internal/admin/consumers/$consumerId" `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
```

## Update API Consumer

```powershell
$consumerPatchBody = @{
  description = "Updated local validation consumer"
  status = "ACTIVE"
} | ConvertTo-Json -Depth 10

Invoke-RestMethod "http://localhost:3000/internal/admin/consumers/$consumerId" `
  -Method PATCH `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-validation"
    "content-type" = "application/json"
  } `
  -Body $consumerPatchBody |
  ConvertTo-Json -Depth 10
```

## Issue API Key

```powershell
$keyBody = @{
  name = "Local Test Key"
} | ConvertTo-Json -Depth 10

$keyResponse = Invoke-RestMethod "http://localhost:3000/internal/admin/consumers/$consumerId/api-keys" `
  -Method POST `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-validation"
    "content-type" = "application/json"
  } `
  -Body $keyBody

$issuedApiKey = $keyResponse.data.rawKey
$issuedApiKeyId = $keyResponse.data.id

$keyResponse | ConvertTo-Json -Depth 10
```

Expected:

```txt
rawKey is returned once.
keyPrefix is returned.
keyHash is not returned.
```

Important:

```txt
Save the rawKey immediately.
PulseGate does not store raw API keys and will not show the raw key again.
```

## List API Keys For Consumer

```powershell
Invoke-RestMethod "http://localhost:3000/internal/admin/consumers/$consumerId/api-keys" `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
keyHash is not exposed.
rawKey is not exposed.
```

## Create Local JWT

```powershell
$token = node --input-type=module -e "import { SignJWT } from 'jose'; const secretKey = new TextEncoder().encode('local-dev-jwt-secret-change-me'); const expiresAt = Math.floor(Date.now() / 1000) + 900; const token = await new SignJWT({ role: 'user' }).setProtectedHeader({ alg: 'HS256' }).setSubject('user_123').setIssuer('pulsegate-api-gateway').setAudience('pulsegate-clients').setExpirationTime(expiresAt).sign(secretKey); console.log(token);"
```

## Test Protected Product Route With Issued DB-Backed Key

```powershell
$dbKeyHeaders = @{
  "x-api-key" = $issuedApiKey
  "authorization" = "Bearer $token"
}

Invoke-RestMethod http://localhost:3000/api/products `
  -Headers $dbKeyHeaders |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
200 OK
Product list returned
```

## Revoke Issued API Key

```powershell
Invoke-RestMethod "http://localhost:3000/internal/admin/api-keys/$issuedApiKeyId/revoke" `
  -Method PATCH `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-validation"
  } |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
status = REVOKED
revokedAt is populated
revokedBy = local-validation
keyHash is not exposed
rawKey is not exposed
```

## Verify Revoked API Key Returns 403

```powershell
try {
  Invoke-RestMethod http://localhost:3000/api/products `
    -Headers $dbKeyHeaders |
    ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
}
```

Expected:

```txt
403
```
