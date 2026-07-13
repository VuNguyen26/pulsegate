param(
  [string]$ArtifactDirectory =
    "E:\pulsegate-artifacts\sprint-78-demo"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$gatewayBaseUrl =
  "http://localhost:3000"

$productServiceBaseUrl =
  "http://localhost:3001"

$adminDashboardBaseUrl =
  "http://localhost:3003"

$developerPortalBaseUrl =
  "http://localhost:3004"

$proxiedHealthPath =
  "/api/product-service/health"

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

function Assert-LocalHttpEndpoint {
  param(
    [string]$Name,
    [string]$Uri,
    [int]$ExpectedPort
  )

  $parsedUri =
    [System.Uri]$Uri

  $allowedHosts = @(
    "localhost",
    "127.0.0.1"
  )

  Assert-True `
    ($parsedUri.Scheme -eq "http") `
    "$Name must use local HTTP."

  Assert-True `
    ($allowedHosts -contains $parsedUri.Host) `
    "$Name must use localhost or 127.0.0.1."

  Assert-True `
    ($parsedUri.Port -eq $ExpectedPort) `
    "$Name must use port $ExpectedPort."
}

function Invoke-BoundedGet {
  param(
    [string]$Name,
    [string]$Uri
  )

  $request = @{
    Uri         = $Uri
    Method      = "GET"
    TimeoutSec  = 10
    ErrorAction = "Stop"
  }

  if ($PSVersionTable.PSVersion.Major -le 5) {
    $request.UseBasicParsing = $true
  }

  try {
    $response =
      Invoke-WebRequest @request

    return [PSCustomObject]@{
      Name   = $Name
      Uri    = $Uri
      Status = [int]$response.StatusCode
      Body   = [string]$response.Content
    }
  }
  catch {
    $statusCode = 0

    if ($null -ne $_.Exception.Response) {
      $statusCode =
        [int]$_.Exception.Response.StatusCode
    }

    throw (
      "$Name failed with HTTP status " +
      $statusCode +
      "."
    )
  }
}

function Convert-DemoJson {
  param(
    [object]$Response
  )

  try {
    return (
      [string]$Response.Body |
        ConvertFrom-Json
    )
  }
  catch {
    throw (
      [string]$Response.Name +
      " returned invalid JSON."
    )
  }
}

function Get-RequiredStringProperty {
  param(
    [object]$Object,
    [string]$PropertyName,
    [string]$Context
  )

  $property = @(
    $Object.PSObject.Properties |
      Where-Object {
        $_.Name -eq $PropertyName
      }
  )

  Assert-True `
    (@($property).Count -eq 1) `
    "$Context is missing $PropertyName."

  $value =
    [string]$property[0].Value

  Assert-True `
    (-not [string]::IsNullOrWhiteSpace($value)) `
    "$Context has an empty $PropertyName."

  return $value
}

Assert-LocalHttpEndpoint `
  "API Gateway" `
  $gatewayBaseUrl `
  3000

Assert-LocalHttpEndpoint `
  "Product Service" `
  $productServiceBaseUrl `
  3001

Assert-LocalHttpEndpoint `
  "Admin Dashboard" `
  $adminDashboardBaseUrl `
  3003

Assert-LocalHttpEndpoint `
  "Developer Portal" `
  $developerPortalBaseUrl `
  3004

$allowedArtifactRoot =
  [System.IO.Path]::GetFullPath(
    "E:\pulsegate-artifacts"
  )

$resolvedArtifactDirectory =
  [System.IO.Path]::GetFullPath(
    $ArtifactDirectory
  )

$allowedArtifactPrefix =
  $allowedArtifactRoot.TrimEnd(
    [System.IO.Path]::DirectorySeparatorChar
  ) +
  [System.IO.Path]::DirectorySeparatorChar

$artifactPathAllowed =
  (
    $resolvedArtifactDirectory -eq
    $allowedArtifactRoot
  ) -or
  $resolvedArtifactDirectory.StartsWith(
    $allowedArtifactPrefix,
    [System.StringComparison]::OrdinalIgnoreCase
  )

Assert-True `
  $artifactPathAllowed `
  "Artifacts must remain under E:\pulsegate-artifacts."

$startedAt =
  [System.DateTimeOffset]::UtcNow

Write-Host "=== SPRINT 78 END-TO-END DEMO ==="
Write-Host "FLOW=Developer Portal -> API Gateway -> Product Service"
Write-Host "METHOD=GET"
Write-Host "PROXIED_ROUTE=$proxiedHealthPath"
Write-Host "EXPECTED_USAGE_EVENT_DELTA=1"
Write-Host "EXPECTED_REJECTED_EVENT_DELTA=0"
Write-Host "CREDENTIALS_USED=FALSE"

$gatewayHealth =
  Invoke-BoundedGet `
    "API Gateway health" `
    "$gatewayBaseUrl/health"

Assert-True `
  ($gatewayHealth.Status -eq 200) `
  "API Gateway health did not return HTTP 200."

$gatewayPayload =
  Convert-DemoJson $gatewayHealth

$gatewayStatus =
  Get-RequiredStringProperty `
    $gatewayPayload `
    "status" `
    "API Gateway health"

Assert-True `
  ($gatewayStatus -eq "ok") `
  "API Gateway did not report status ok."

Write-Host "API_GATEWAY_HEALTH=PASS"

$productHealth =
  Invoke-BoundedGet `
    "Product Service health" `
    "$productServiceBaseUrl/health"

Assert-True `
  ($productHealth.Status -eq 200) `
  "Product Service health did not return HTTP 200."

$productPayload =
  Convert-DemoJson $productHealth

$productService =
  Get-RequiredStringProperty `
    $productPayload `
    "service" `
    "Product Service health"

$productStatus =
  Get-RequiredStringProperty `
    $productPayload `
    "status" `
    "Product Service health"

Assert-True `
  ($productService -eq "product-service") `
  "Product Service returned an unexpected service identity."

Assert-True `
  ($productStatus -eq "ok") `
  "Product Service did not report status ok."

Write-Host "PRODUCT_SERVICE_HEALTH=PASS"

$portalDocs =
  Invoke-BoundedGet `
    "Developer Portal API documentation" `
    "$developerPortalBaseUrl/api-docs"

Assert-True `
  ($portalDocs.Status -eq 200) `
  "Developer Portal API documentation did not return HTTP 200."

Assert-True `
  (
    ([string]$portalDocs.Body).Contains(
      $proxiedHealthPath
    )
  ) `
  "Developer Portal does not document the selected proxied route."

Write-Host "DEVELOPER_PORTAL_API_DOCS=PASS"

$dashboardRoot =
  Invoke-BoundedGet `
    "Admin Dashboard root" `
    "$adminDashboardBaseUrl/"

Assert-True `
  ($dashboardRoot.Status -eq 200) `
  "Admin Dashboard root did not return HTTP 200."

Write-Host "ADMIN_DASHBOARD_ROOT=PASS"

$proxiedHealth =
  Invoke-BoundedGet `
    "Gateway proxied Product Service health" `
    "$gatewayBaseUrl$proxiedHealthPath"

Assert-True `
  ($proxiedHealth.Status -eq 200) `
  "Proxied Product Service health did not return HTTP 200."

$proxiedPayload =
  Convert-DemoJson $proxiedHealth

$proxiedService =
  Get-RequiredStringProperty `
    $proxiedPayload `
    "service" `
    "Proxied Product Service health"

$proxiedStatus =
  Get-RequiredStringProperty `
    $proxiedPayload `
    "status" `
    "Proxied Product Service health"

Assert-True `
  ($proxiedService -eq "product-service") `
  "Proxied response returned an unexpected service identity."

Assert-True `
  ($proxiedStatus -eq "ok") `
  "Proxied Product Service did not report status ok."

Write-Host "PROXIED_PRODUCT_SERVICE_HEALTH=PASS"
Write-Host "DEMO_HTTP_RESULT=PASS"

$completedAt =
  [System.DateTimeOffset]::UtcNow

$summary = [ordered]@{
  sprint = 78
  flow =
    "Developer Portal -> API Gateway -> Product Service"
  localOnly = $true
  method = "GET"
  proxiedRoute = $proxiedHealthPath
  startedAt = $startedAt.ToString("o")
  completedAt = $completedAt.ToString("o")
  requests = [ordered]@{
    gatewayHealthStatus =
      $gatewayHealth.Status
    productServiceHealthStatus =
      $productHealth.Status
    developerPortalApiDocsStatus =
      $portalDocs.Status
    adminDashboardRootStatus =
      $dashboardRoot.Status
    proxiedProductServiceHealthStatus =
      $proxiedHealth.Status
  }
  proxiedResponse = [ordered]@{
    service = $proxiedService
    status = $proxiedStatus
  }
  expectedDataMutation = [ordered]@{
    apiUsageEvents = 1
    apiRejectedEvents = 0
  }
  credentialsUsed = $false
  destructiveMethodsUsed = $false
  rawResponseBodiesStored = $false
}

$summaryJson =
  $summary |
    ConvertTo-Json -Depth 8

$utf8NoBom =
  New-Object System.Text.UTF8Encoding($false)

$summaryPath =
  Join-Path `
    $resolvedArtifactDirectory `
    "sprint-78-demo-summary.json"

try {
  New-Item `
    -ItemType Directory `
    -Path $resolvedArtifactDirectory `
    -Force |
    Out-Null

  [System.IO.File]::WriteAllText(
    $summaryPath,
    $summaryJson + [Environment]::NewLine,
    $utf8NoBom
  )
}
catch {
  Write-Host "ARTIFACT_WRITE=FAILED"
  Write-Host "DEMO_HTTP_RESULT=PASS"

  throw (
    "Demo HTTP proof passed, but the sanitized " +
    "artifact could not be written."
  )
}

Write-Host "ARTIFACT_WRITE=PASS"
Write-Host "ARTIFACT_PATH=$summaryPath"
Write-Host "DEMO_RESULT=PASS"
