param(
  [switch]$SkipBuild,
  [switch]$SkipK6
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (Get-Variable PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
  $PSNativeCommandUseErrorActionPreference = $false
}

function Show-Section {
  param([string]$Title)

  Write-Host ""
  Write-Host ("=" * 72)
  Write-Host $Title
  Write-Host ("=" * 72)
}

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

function Invoke-NativeChecked {
  param(
    [string]$FilePath,
    [string[]]$ArgumentList
  )

  & $FilePath @ArgumentList
  $exitCode = $LASTEXITCODE

  if ($exitCode -ne 0) {
    throw "$FilePath failed with exit code $exitCode"
  }
}

function Invoke-DemoHttp {
  param(
    [string]$Uri,
    [string]$Method = "GET",
    [hashtable]$Headers = @{},
    [string]$Body
  )

  $request = @{
    Uri         = $Uri
    Method      = $Method
    Headers     = $Headers
    ErrorAction = "Stop"
  }

  if ($PSVersionTable.PSVersion.Major -le 5) {
    $request.UseBasicParsing = $true
  }

  if ($PSBoundParameters.ContainsKey("Body")) {
    $request.Body = $Body
    $request.ContentType = "application/json"
  }

  try {
    $response = Invoke-WebRequest @request

    return [PSCustomObject]@{
      Status = [int]$response.StatusCode
      Body   = [string]$response.Content
    }
  }
  catch {
    $errorRecord = $_
    $statusCode = 0
    $responseBody = ""

    if ($null -ne $errorRecord.Exception.Response) {
      $statusCode = [int]$errorRecord.Exception.Response.StatusCode
    }

    $errorDetailsProperty =
      $errorRecord.PSObject.Properties["ErrorDetails"]

    if (
      $null -ne $errorDetailsProperty -and
      $null -ne $errorDetailsProperty.Value
    ) {
      $messageProperty =
        $errorDetailsProperty.Value.PSObject.Properties["Message"]

      if ($null -ne $messageProperty) {
        $responseBody = [string]$messageProperty.Value
      }
    }

    if (
      [string]::IsNullOrWhiteSpace($responseBody) -and
      $null -ne $errorRecord.Exception.Response
    ) {
      try {
        $errorResponse = $errorRecord.Exception.Response

        if (
          $errorResponse.PSObject.Methods.Name -contains
          "GetResponseStream"
        ) {
          $stream = $errorResponse.GetResponseStream()

          if ($null -ne $stream) {
            $reader = New-Object System.IO.StreamReader($stream)

            try {
              $responseBody = $reader.ReadToEnd()
            }
            finally {
              $reader.Dispose()
              $stream.Dispose()
            }
          }
        }
        elseif (
          $null -ne $errorResponse.Content -and
          $errorResponse.Content.PSObject.Methods.Name -contains
          "ReadAsStringAsync"
        ) {
          $responseBody = $errorResponse.Content.
            ReadAsStringAsync().
            GetAwaiter().
            GetResult()
        }
      }
      catch {
        $responseBody = ""
      }
    }

    if ([string]::IsNullOrWhiteSpace($responseBody)) {
      $responseBody = [string]$errorRecord.Exception.Message
    }

    return [PSCustomObject]@{
      Status = $statusCode
      Body   = $responseBody
    }
  }
}

function Wait-ForHttp200 {
  param(
    [string]$Name,
    [string]$Uri
  )

  for ($attempt = 1; $attempt -le 30; $attempt++) {
    $response = Invoke-DemoHttp -Uri $Uri

    if ($response.Status -eq 200) {
      Write-Host "$Name is ready."
      return
    }

    Start-Sleep -Seconds 2
  }

  throw "$Name did not become ready: $Uri"
}

function Assert-Http {
  param(
    [object]$Response,
    [int]$ExpectedStatus,
    [string]$ExpectedCode,
    [string]$Description
  )

  Assert-True `
    ($Response.Status -eq $ExpectedStatus) `
    "$Description returned HTTP $($Response.Status), expected $ExpectedStatus."

  if ($ExpectedCode) {
    Assert-True `
      ($Response.Body -match [Regex]::Escape($ExpectedCode)) `
      "$Description did not include $ExpectedCode."
  }

  Write-Host "$Description passed."
}

$gatewayBaseUrl = "http://localhost:3000"
$prometheusBaseUrl = "http://localhost:9090"
$grafanaBaseUrl = "http://localhost:3002"

$adminApiKey = if ($env:ADMIN_API_KEY) {
  $env:ADMIN_API_KEY
}
else {
  "pulsegate-demo-full-access-local-only"
}

$readOnlyApiKey = if ($env:ADMIN_READ_ONLY_API_KEY) {
  $env:ADMIN_READ_ONLY_API_KEY
}
else {
  "pulsegate-demo-read-only-local-only"
}

Assert-True `
  ($adminApiKey -ne $readOnlyApiKey) `
  "Full-access and read-only demo keys must be different."

$previousAdminApiKey = $env:ADMIN_API_KEY
$previousReadOnlyApiKey = $env:ADMIN_READ_ONLY_API_KEY

try {
  $env:ADMIN_API_KEY = $adminApiKey
  $env:ADMIN_READ_ONLY_API_KEY = $readOnlyApiKey

  Show-Section "Start Docker runtime"

  $composeArguments = @("compose", "up", "-d")

  if (-not $SkipBuild) {
    $composeArguments += "--build"
  }

  Invoke-NativeChecked "docker" $composeArguments
  Invoke-NativeChecked "docker" @("compose", "ps")

  Wait-ForHttp200 "API Gateway" "$gatewayBaseUrl/health"
  Wait-ForHttp200 "Prometheus" "$prometheusBaseUrl/-/ready"
  Wait-ForHttp200 "Grafana" "$grafanaBaseUrl/api/health"

  Show-Section "Gateway metrics"

  $metrics = Invoke-DemoHttp "$gatewayBaseUrl/metrics"
  Assert-Http $metrics 200 "" "Metrics endpoint"

  foreach ($metricName in @(
    "http_requests_total",
    "http_request_duration_seconds",
    "http_response_cache_total"
  )) {
    Assert-True `
      ($metrics.Body.Contains($metricName)) `
      "Metric family $metricName was not found."
  }

  $pathA = "/demo-unmatched-$([Guid]::NewGuid().ToString('N'))"
  $pathB = "/demo-unmatched-$([Guid]::NewGuid().ToString('N'))"

  Assert-Http `
    (Invoke-DemoHttp "$gatewayBaseUrl$pathA") `
    404 `
    "" `
    "First unmatched request"

  Assert-Http `
    (Invoke-DemoHttp "$gatewayBaseUrl$pathB") `
    404 `
    "" `
    "Second unmatched request"

  $metricsAfterUnmatched = Invoke-DemoHttp "$gatewayBaseUrl/metrics"

  Assert-True `
    ($metricsAfterUnmatched.Body.Contains('route="__unmatched__"')) `
    "Bounded unmatched route label was not found."

  Assert-True `
    (-not $metricsAfterUnmatched.Body.Contains($pathA)) `
    "First raw unmatched path leaked into metrics."

  Assert-True `
    (-not $metricsAfterUnmatched.Body.Contains($pathB)) `
    "Second raw unmatched path leaked into metrics."

  Write-Host "Bounded unmatched metric labeling passed."

  Show-Section "Prometheus target"

  $targetsResponse = Invoke-DemoHttp "$prometheusBaseUrl/api/v1/targets"
  Assert-Http $targetsResponse 200 "" "Prometheus targets API"

  $targetsPayload = $targetsResponse.Body | ConvertFrom-Json
  $gatewayTarget = $targetsPayload.data.activeTargets |
    Where-Object {
      $_.scrapeUrl -eq "http://api-gateway:3000/metrics"
    } |
    Select-Object -First 1

  Assert-True ($null -ne $gatewayTarget) "Gateway Prometheus target was not found."
  Assert-True ($gatewayTarget.health -eq "up") "Gateway Prometheus target is not up."

  Write-Host "Prometheus gateway target passed."

  Show-Section "Grafana datasource and dashboard"

  $basicValue = [Convert]::ToBase64String(
    [Text.Encoding]::ASCII.GetBytes("admin:admin")
  )

  $grafanaHeaders = @{
    Authorization = "Basic $basicValue"
  }

  $datasource = Invoke-DemoHttp `
    "$grafanaBaseUrl/api/datasources/uid/pulsegate-prometheus/health" `
    "GET" `
    $grafanaHeaders

  Assert-Http $datasource 200 "" "Grafana datasource health"

  $datasourcePayload = $datasource.Body | ConvertFrom-Json
  Assert-True `
    ($datasourcePayload.status -eq "OK") `
    "Grafana datasource status is not OK."

  $dashboard = Invoke-DemoHttp `
    "$grafanaBaseUrl/api/dashboards/uid/pulsegate-api-gateway-overview" `
    "GET" `
    $grafanaHeaders

  Assert-Http $dashboard 200 "" "Grafana dashboard lookup"

  $dashboardPayload = $dashboard.Body | ConvertFrom-Json

  Assert-True `
    ($dashboardPayload.dashboard.panels.Count -eq 5) `
    "Grafana dashboard does not contain exactly 5 panels."

  Write-Host "Grafana provisioning passed."

  Show-Section "Admin authentication boundary"

  $readOnlyHeaders = @{
    "x-admin-api-key" = $readOnlyApiKey
  }

  $fullAccessHeaders = @{
    "x-admin-api-key" = $adminApiKey
  }

  Assert-Http `
    (Invoke-DemoHttp `
      "$gatewayBaseUrl/internal/admin/routes" `
      "GET" `
      $readOnlyHeaders) `
    200 `
    "" `
    "Read-only admin GET"

  Assert-Http `
    (Invoke-DemoHttp `
      "$gatewayBaseUrl/internal/admin/consumers" `
      "POST" `
      $readOnlyHeaders `
      "{}") `
    403 `
    "ADMIN_API_KEY_READ_ONLY" `
    "Read-only admin mutation"

  Assert-Http `
    (Invoke-DemoHttp `
      "$gatewayBaseUrl/internal/admin/consumers" `
      "POST" `
      $fullAccessHeaders `
      "{}") `
    400 `
    "API_CONSUMER_INVALID" `
    "Full-access payload validation"

  Assert-Http `
    (Invoke-DemoHttp `
      "$gatewayBaseUrl/internal/admin/routes" `
      "GET" `
      @{ "x-admin-api-key" = "invalid-demo-key" }) `
    403 `
    "ADMIN_API_KEY_INVALID" `
    "Invalid admin credential"

  if (-not $SkipK6) {
    Show-Section "Bounded k6 smoke"

    $npmCommand = if ($env:OS -eq "Windows_NT") {
      "npm.cmd"
    }
    else {
      "npm"
    }

    Invoke-NativeChecked $npmCommand @("run", "test:k6:smoke")
  }

  Show-Section "Demo summary"

  Write-Host "Gateway, metrics, Prometheus, Grafana, admin auth, and bounded k6 checks passed."
  Write-Host "No destructive retention, background execute, or raw event deletion was invoked."
}
finally {
  if ($null -eq $previousAdminApiKey) {
    Remove-Item Env:ADMIN_API_KEY -ErrorAction SilentlyContinue
  }
  else {
    $env:ADMIN_API_KEY = $previousAdminApiKey
  }

  if ($null -eq $previousReadOnlyApiKey) {
    Remove-Item Env:ADMIN_READ_ONLY_API_KEY -ErrorAction SilentlyContinue
  }
  else {
    $env:ADMIN_READ_ONLY_API_KEY = $previousReadOnlyApiKey
  }
}
