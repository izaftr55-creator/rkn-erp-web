$ErrorActionPreference = "Stop"

Set-Location "C:\RKN-ERP\rkn-erp-web"

Write-Host "`n=== RKN F13-R13C2 · RPC STUB TYPE SYNC ===" -ForegroundColor Cyan
Write-Host "SOURCE WRITE = YES"
Write-Host "PRODUCTION DEPLOY = NO"
Write-Host "ERP DATA WRITE = NO"
Write-Host "AUTH DATA WRITE = NO"
Write-Host ""

$file = ".\lib\erpCoreRpc.ts"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = ".\data\private\checkpoints\erpCoreRpc.f13-r13c2-$stamp.ts.bak"

Copy-Item $file $backup

$path = (Resolve-Path $file).Path
$src = [IO.File]::ReadAllText($path)
$utf8 = New-Object System.Text.UTF8Encoding($false)

# ----------------------------------------------------------
# 1. ACCESS LEVEL TYPE
# ----------------------------------------------------------

if (-not $src.Contains('| "OPERATE"')) {
    $oldAccess = @'
export type RknRpcAccessLevel =
  | "VIEW"
  | "MANAGE"
  | "OWNER";
'@

    $newAccess = @'
export type RknRpcAccessLevel =
  | "VIEW"
  | "OPERATE"
  | "MANAGE"
  | "OWNER";
'@

    if (-not $src.Contains($oldAccess)) {
        throw "R13C2_ACCESS_LEVEL_MARKER_NOT_FOUND"
    }

    $src = $src.Replace(
        $oldAccess,
        $newAccess
    )
}

# ----------------------------------------------------------
# 2. ADMIN RPC STUB METHODS
# ----------------------------------------------------------

if (-not $src.Contains("getAdminAccessDirectory(")) {
    $marker = @'
  recordPasswordChangeCompletion(
    actorUserId: string
  ): Promise<any>;
'@

    $replacement = @'
  getAdminAccessDirectory(
    actorUserId: string
  ): Promise<any>;

  provisionPendingErpUserAccess(
    actorUserId: string,
    targetUserId: string,
    fullName: string,
    roleCode: string,
    businessUnitId: string,
    accessLevel: RknRpcAccessLevel
  ): Promise<any>;

  recordPasswordChangeCompletion(
    actorUserId: string
  ): Promise<any>;
'@

    if (-not $src.Contains($marker)) {
        throw "R13C2_RPC_INSERT_MARKER_NOT_FOUND"
    }

    $src = $src.Replace(
        $marker,
        $replacement
    )
}

[IO.File]::WriteAllText(
    $path,
    $src,
    $utf8
)

# ----------------------------------------------------------
# POSTCHECK
# ----------------------------------------------------------

$after = [IO.File]::ReadAllText($path)

$operate = $after.Contains('| "OPERATE"')
$directory = $after.Contains("getAdminAccessDirectory(")
$provision = $after.Contains("provisionPendingErpUserAccess(")

Write-Host "BACKUP        = $backup"
Write-Host "OPERATE TYPE  = $operate"
Write-Host "DIRECTORY RPC = $directory"
Write-Host "PROVISION RPC = $provision"

if (-not ($operate -and $directory -and $provision)) {
    throw "F13_R13C2_RPC_STUB_SYNC_FAILED"
}

Write-Host ""
Write-Host "F13-R13C2 RPC STUB SYNC = PASS" -ForegroundColor Green
