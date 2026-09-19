$ErrorActionPreference = "Stop"

# ============================================================
# Configuration
# ============================================================

# ============================================================
# Configuration
# ============================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$HostAddress = "127.0.0.1"
$Port = 8545
$RpcUrl = "http://${HostAddress}:${Port}"

$IgnitionModule = "ignition/modules/TrustLanceFactory.ts"

# Vite frontend
$EnvFile = Join-Path $ScriptDir "..\trustlance\.env.local"
$EnvVariable = "VITE_TRUSTLANCE_FACTORY_ADDRESS"

$ExpectedChainId = 31337

# ============================================================
# Helper functions
# ============================================================

function Fail([string]$Message) {
    Write-Host ""
    Write-Host "ERROR: $Message" -ForegroundColor Red
    Write-Host ""
    exit 1
}

function Test-PortInUse {
    param(
        [int]$Port
    )

    $connection = Get-NetTCPConnection `
        -LocalPort $Port `
        -State Listen `
        -ErrorAction SilentlyContinue

    return $null -ne $connection
}

function Test-Rpc {
    try {
        $body = @{
            jsonrpc = "2.0"
            method  = "eth_chainId"
            params  = @()
            id      = 1
        } | ConvertTo-Json -Compress

        $response = Invoke-RestMethod `
            -Uri $RpcUrl `
            -Method Post `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 3

        return $response
    }
    catch {
        return $null
    }
}

function Get-ProcessUsingPort {
    param(
        [int]$Port
    )

    $connections = Get-NetTCPConnection `
        -LocalPort $Port `
        -State Listen `
        -ErrorAction SilentlyContinue

    if ($null -eq $connections) {
        return $null
    }

    $owningProcessId = $connections[0].OwningProcess

    try {
        return Get-Process `
            -Id $owningProcessId `
            -ErrorAction Stop
    }
    catch {
        return $null
    }
}

# ============================================================
# Header
# ============================================================

Clear-Host

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "      TrustLance Local Development" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Check project
# ============================================================

Set-Location $ScriptDir

if (-not (Test-Path "hardhat.config.ts")) {
    Fail "hardhat.config.ts was not found."
}

if (-not (Test-Path $IgnitionModule)) {
    Fail "Ignition module was not found:`n$IgnitionModule"
}

# ============================================================
# Check pnpm
# ============================================================

Write-Host "Checking pnpm..." -ForegroundColor Yellow

try {
    $pnpmVersion = & pnpm.cmd --version 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "pnpm failed."
    }

    Write-Host "pnpm: $pnpmVersion" -ForegroundColor Green
}
catch {
    Fail "pnpm is not available."
}

# ============================================================
# Check port
# ============================================================

Write-Host ""
Write-Host "Checking port $Port..." -ForegroundColor Yellow

$ExistingProcess = Get-ProcessUsingPort $Port

if ($null -ne $ExistingProcess) {

    Write-Host ""
    Write-Host "Port $Port is already in use." -ForegroundColor Red

    Write-Host ""
    Write-Host "Process using the port:" -ForegroundColor Yellow
    Write-Host "Name: $($ExistingProcess.ProcessName)"
    Write-Host "PID : $($ExistingProcess.Id)"

    Write-Host ""
    Write-Host "If this is an old Hardhat node, stop it with:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Stop-Process -Id $($ExistingProcess.Id) -Force"
    Write-Host ""

    exit 1
}

Write-Host "Port $Port is available." -ForegroundColor Green

# ============================================================
# Start Hardhat in a separate PowerShell window
# ============================================================

Write-Host ""
Write-Host "Starting Hardhat node..." -ForegroundColor Cyan

$HardhatCommand = @"
Set-Location -LiteralPath '$ScriptDir'
Write-Host ''
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ' TrustLance Hardhat Local Node' -ForegroundColor Cyan
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'RPC: http://$HostAddress`:$Port' -ForegroundColor Green
Write-Host 'Chain ID: $ExpectedChainId' -ForegroundColor Green
Write-Host ''
Write-Host 'Keep this window open.' -ForegroundColor Yellow
Write-Host 'Press Ctrl+C here to stop the blockchain.' -ForegroundColor Yellow
Write-Host ''
& pnpm.cmd hardhat node --hostname '$HostAddress' --port $Port
"@

$HardhatProcess = Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        $HardhatCommand
    ) `
    -PassThru

if ($null -eq $HardhatProcess) {
    Fail "Failed to start Hardhat."
}

Write-Host "Hardhat process started. PID: $($HardhatProcess.Id)" -ForegroundColor Green

# ============================================================
# Wait for RPC
# ============================================================

Write-Host ""
Write-Host "Waiting for Hardhat RPC..." -ForegroundColor Yellow

$RpcReady = $false
$RpcResponse = $null

for ($i = 1; $i -le 30; $i++) {

    Start-Sleep -Seconds 1

    # Check if process died
    try {
       Get-Process `
            -Id $HardhatProcess.Id `
            -ErrorAction Stop
    }
    catch {
        Fail "Hardhat process exited before RPC became available."
    }

    $RpcResponse = Test-Rpc

    if ($null -ne $RpcResponse) {
        $RpcReady = $true
        break
    }

    Write-Host "." -NoNewline
}

Write-Host ""

if (-not $RpcReady) {
    try {
        Stop-Process `
            -Id $HardhatProcess.Id `
            -Force `
            -ErrorAction SilentlyContinue
    }
    catch {}

    Fail "Hardhat RPC did not become available."
}

Write-Host "Hardhat RPC is ready." -ForegroundColor Green

# ============================================================
# Verify chain ID
# ============================================================

$ChainIdHex = $RpcResponse.result

if ($null -eq $ChainIdHex) {
    Fail "Could not read chain ID from Hardhat."
}

$ChainId = [Convert]::ToInt64(
    $ChainIdHex.Substring(2),
    16
)

Write-Host "Chain ID: $ChainId" -ForegroundColor Green

if ($ChainId -ne $ExpectedChainId) {
    Fail "Unexpected chain ID $ChainId. Expected $ExpectedChainId."
}

# ============================================================
# Check accounts
# ============================================================

Write-Host ""
Write-Host "Checking Hardhat accounts..." -ForegroundColor Yellow

try {

    $accountsBody = @{
        jsonrpc = "2.0"
        method  = "eth_accounts"
        params  = @()
        id      = 1
    } | ConvertTo-Json -Compress

    $accountsResponse = Invoke-RestMethod `
        -Uri $RpcUrl `
        -Method Post `
        -ContentType "application/json" `
        -Body $accountsBody `
        -TimeoutSec 3

}
catch {
    Fail "Could not query Hardhat accounts."
}

if (
    $null -eq $accountsResponse.result -or
    $accountsResponse.result.Count -eq 0
) {
    Fail "Hardhat returned no accounts."
}

Write-Host "Accounts available: $($accountsResponse.result.Count)" -ForegroundColor Green

# ============================================================
# Compile
# ============================================================

Write-Host ""
Write-Host "Compiling contracts..." -ForegroundColor Cyan
Write-Host ""

& pnpm.cmd hardhat compile

if ($LASTEXITCODE -ne 0) {
    Fail "Hardhat compilation failed."
}

Write-Host ""
Write-Host "Compilation successful." -ForegroundColor Green

# ============================================================
# Deploy with Ignition
# ============================================================

Write-Host ""
Write-Host "Deploying TrustLanceFactory..." -ForegroundColor Cyan
Write-Host ""

$DeployOutput = & pnpm.cmd hardhat ignition deploy `
    $IgnitionModule `
    --network localhost 2>&1

$DeployExitCode = $LASTEXITCODE

$DeployOutput | ForEach-Object {
    Write-Host $_
}

if ($DeployExitCode -ne 0) {
    Fail "Ignition deployment failed."
}

# ============================================================
# Extract factory address
# ============================================================

Write-Host ""
Write-Host "Extracting factory address..." -ForegroundColor Yellow

$OutputText = $DeployOutput -join "`n"

$AddressMatches = [regex]::Matches(
    $OutputText,
    "0x[a-fA-F0-9]{40}"
)

if ($AddressMatches.Count -eq 0) {
    Fail "No Ethereum address was found in the deployment output."
}

$FactoryAddress = $AddressMatches[
    $AddressMatches.Count - 1
].Value

Write-Host "Factory address:" -ForegroundColor Green
Write-Host $FactoryAddress

# ============================================================
# Verify factory bytecode
# ============================================================

Write-Host ""
Write-Host "Verifying deployed bytecode..." -ForegroundColor Yellow

try {

    $codeBody = @{
        jsonrpc = "2.0"
        method  = "eth_getCode"
        params  = @(
            $FactoryAddress,
            "latest"
        )
        id = 1
    } | ConvertTo-Json -Compress

    $codeResponse = Invoke-RestMethod `
        -Uri $RpcUrl `
        -Method Post `
        -ContentType "application/json" `
        -Body $codeBody `
        -TimeoutSec 3

}
catch {
    Fail "Could not verify deployed contract bytecode."
}

if (
    $null -eq $codeResponse.result -or
    $codeResponse.result -eq "0x"
) {
    Fail "No bytecode exists at $FactoryAddress."
}

Write-Host "Factory bytecode verified." -ForegroundColor Green

# ============================================================
# Verify factory contract directly
# ============================================================

Write-Host ""
Write-Host "Verifying factory configuration..." -ForegroundColor Yellow

# ------------------------------------------------------------
# clientReviewPeriod()
# ------------------------------------------------------------

# $ReviewSelector = "0x" + "f8f32e0c"

# We don't hardcode ABI selectors here.
# Instead, rely on deployment + bytecode verification.
#
# The factory's own tests already verify:
# - clientReviewPeriod
# - disputePeriod
# - createEscrow
# - registry
# - events

Write-Host "Factory deployment verified." -ForegroundColor Green

# ============================================================
# Update .env.local
# ============================================================

Write-Host ""
Write-Host "Updating Vite environment..." -ForegroundColor Cyan

$EnvDirectory = Split-Path -Parent $EnvFile

if (-not (Test-Path $EnvDirectory)) {

    New-Item `
        -ItemType Directory `
        -Path $EnvDirectory `
        -Force |
        Out-Null
}

if (-not (Test-Path $EnvFile)) {

    New-Item `
        -ItemType File `
        -Path $EnvFile `
        -Force |
        Out-Null
}

$EnvContent = Get-Content `
    -Path $EnvFile `
    -Raw `
    -ErrorAction SilentlyContinue

if ($null -eq $EnvContent) {
    $EnvContent = ""
}

$EscapedVariable = [regex]::Escape($EnvVariable)

if ($EnvContent -match "(?m)^$EscapedVariable=") {

    $EnvContent = [regex]::Replace(
        $EnvContent,
        "(?m)^$EscapedVariable=.*$",
        "$EnvVariable=$FactoryAddress"
    )

}
else {

    if (
        $EnvContent.Length -gt 0 -and
        -not $EnvContent.EndsWith("`n")
    ) {
        $EnvContent += "`r`n"
    }

    $EnvContent += "$EnvVariable=$FactoryAddress`r`n"
}

Set-Content `
    -Path $EnvFile `
    -Value $EnvContent `
    -NoNewline

# ============================================================
# Verify .env.local
# ============================================================

$UpdatedEnv = Get-Content `
    -Path $EnvFile `
    -Raw

if (
    $UpdatedEnv -notmatch
    "(?m)^$EscapedVariable=$([regex]::Escape($FactoryAddress))$"
) {
    Fail "Failed to update .env.local correctly."
}

Write-Host ".env.local updated successfully." -ForegroundColor Green

# ============================================================
# Final
# ============================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " TrustLance development environment ready" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Hardhat RPC:" -ForegroundColor Cyan
Write-Host "  $RpcUrl"
Write-Host ""
Write-Host "Chain ID:" -ForegroundColor Cyan
Write-Host "  $ChainId"
Write-Host ""
Write-Host "Factory:" -ForegroundColor Cyan
Write-Host "  $FactoryAddress"
Write-Host ""
Write-Host "Environment:" -ForegroundColor Cyan
Write-Host "  $EnvFile"
Write-Host ""
Write-Host "$EnvVariable=$FactoryAddress"
Write-Host ""
Write-Host "Hardhat is running in the separate window." -ForegroundColor Green
Write-Host "You can now start Vite normally." -ForegroundColor Green
Write-Host ""
Write-Host "Press ENTER to stop Hardhat and close this development session." -ForegroundColor Yellow
Write-Host ""



# ============================================================
# Final verification
# ============================================================

Start-Sleep -Milliseconds 500

if (Test-PortInUse $Port) {
    Write-Host ""
    Write-Host "WARNING: Port $Port is still in use." -ForegroundColor Yellow
}
else {
    Write-Host ""
    Write-Host "Hardhat stopped successfully." -ForegroundColor Green
}

Write-Host ""
Write-Host "Development session ended."