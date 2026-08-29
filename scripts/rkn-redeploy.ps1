$ErrorActionPreference = "Stop"

$project = "C:\RKN-ERP\rkn-erp-web"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " RKN ERP AUTO REDEPLOY" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Set-Location $project

Write-Host ""
Write-Host "[1/4] BUILD PRODUCTION..." -ForegroundColor Yellow

& npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "BUILD_FAIL - SERVER LAMA TETAP AMAN" -ForegroundColor Red
    exit 1
}

Write-Host "BUILD_PASS" -ForegroundColor Green

Write-Host ""
Write-Host "[2/4] STOP SERVER LAMA..." -ForegroundColor Yellow

$connections = Get-NetTCPConnection `
    -LocalPort 3000 `
    -State Listen `
    -ErrorAction SilentlyContinue

if ($connections) {

    $processIds = $connections |
        Select-Object -ExpandProperty OwningProcess |
        Sort-Object -Unique

    foreach ($processId in $processIds) {

        Stop-Process `
            -Id $processId `
            -Force `
            -ErrorAction SilentlyContinue

        Write-Host "STOPPED PID = $processId"
    }

    Start-Sleep -Seconds 2
}

$remaining = Get-NetTCPConnection `
    -LocalPort 3000 `
    -State Listen `
    -ErrorAction SilentlyContinue

if ($remaining) {
    Write-Host "PORT_3000_STILL_BUSY" -ForegroundColor Red
    exit 1
}

Write-Host "PORT_3000_FREE_PASS" -ForegroundColor Green

Write-Host ""
Write-Host "[3/4] START PRODUCTION..." -ForegroundColor Yellow

$logDir = Join-Path $project "data\private\runtime"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$stdout = Join-Path $logDir "next-production.log"
$stderr = Join-Path $logDir "next-production-error.log"

$process = Start-Process `
    -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run start" `
    -WorkingDirectory $project `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -WindowStyle Hidden `
    -PassThru

Write-Host "SERVER_PID = $($process.Id)"

Write-Host ""
Write-Host "[4/4] HEALTH CHECK..." -ForegroundColor Yellow

$healthy = $false

for ($i = 1; $i -le 30; $i++) {

    Start-Sleep -Seconds 1

    try {

        $response = Invoke-WebRequest `
            -Uri "http://127.0.0.1:3000/login" `
            -UseBasicParsing `
            -TimeoutSec 3

        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
            $healthy = $true
            break
        }

    }
    catch {}
}

Write-Host ""

if ($healthy) {

    Write-Host "==========================================" -ForegroundColor Green
    Write-Host " RKN ERP REDEPLOY PASS" -ForegroundColor Green
    Write-Host " LOCAL SERVER = HEALTHY" -ForegroundColor Green
    Write-Host " PORT 3000    = ONLINE" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green

}
else {

    Write-Host "RKN ERP HEALTH CHECK FAIL" -ForegroundColor Red
    Write-Host ""
    Write-Host "ERROR LOG:" -ForegroundColor Yellow

    if (Test-Path $stderr) {
        Get-Content $stderr -Tail 30
    }

    exit 1
}
