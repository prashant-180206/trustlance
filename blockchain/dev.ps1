param()

$ErrorActionPreference = "Stop"

# ============================================================
# TrustLance - Local Blockchain Deployment
#
# Assumes Hardhat node is already running.
#
# Usage:
#
# .\dev-after-node.ps1
#
# This script:
#   1. Compiles contracts
#   2. Deploys TrustLanceFactory
#   3. Extracts the factory address
#   4. Updates the Vite frontend .env.local
# ============================================================


# ============================================================
# Configuration
# ============================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$IgnitionModule = "ignition/modules/TrustLanceFactory.ts"

$EnvFile = Join-Path $ScriptDir "..\trustlance\.env.local"

$EnvVariable = "VITE_TRUSTLANCE_FACTORY_ADDRESS"


# ============================================================
# Header
# ============================================================

Clear-Host

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " TrustLance Local Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Network: localhost" -ForegroundColor Cyan
Write-Host "RPC:     http://127.0.0.1:8545" -ForegroundColor Cyan
Write-Host "Chain:   31337" -ForegroundColor Cyan

Write-Host ""


# ============================================================
# Compile contracts
# ============================================================

Write-Host "Compiling contracts..." -ForegroundColor Cyan
Write-Host ""

& pnpm.cmd hardhat compile

if ($LASTEXITCODE -ne 0) {
    throw "Hardhat compilation failed."
}

Write-Host ""
Write-Host "Compilation successful." -ForegroundColor Green


# ============================================================
# Deploy TrustLanceFactory
# ============================================================

Write-Host ""
Write-Host "Deploying TrustLanceFactory..." -ForegroundColor Cyan
Write-Host ""

$DeployOutput = & pnpm.cmd hardhat ignition deploy `
    $IgnitionModule `
    --network localhost 2>&1

$DeployExitCode = $LASTEXITCODE


# ============================================================
# Print deployment output
# ============================================================

$DeployOutput | ForEach-Object {
    Write-Host $_
}


if ($DeployExitCode -ne 0) {
    throw "Ignition deployment failed."
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
    throw "Could not find the deployed factory address."
}

$FactoryAddress = $AddressMatches[
    $AddressMatches.Count - 1
].Value


Write-Host ""
Write-Host "Factory deployed:" -ForegroundColor Green
Write-Host $FactoryAddress


# ============================================================
# Update frontend .env.local
# ============================================================

Write-Host ""
Write-Host "Updating frontend environment..." -ForegroundColor Cyan


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


# ------------------------------------------------------------
# Replace existing variable
# ------------------------------------------------------------

if ($EnvContent -match "(?m)^$EscapedVariable=") {

    $EnvContent = [regex]::Replace(
        $EnvContent,
        "(?m)^$EscapedVariable=.*$",
        "$EnvVariable=$FactoryAddress"
    )

}


# ------------------------------------------------------------
# Add variable if it doesn't exist
# ------------------------------------------------------------

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
# Final output
# ============================================================

Write-Host ""
Write-Host "============================================" `
    -ForegroundColor Green

Write-Host " TrustLance blockchain ready" `
    -ForegroundColor Green

Write-Host "============================================" `
    -ForegroundColor Green

Write-Host ""

Write-Host "RPC:" -ForegroundColor Cyan
Write-Host "  http://127.0.0.1:8545"

Write-Host ""

Write-Host "Chain ID:" -ForegroundColor Cyan
Write-Host "  31337"

Write-Host ""

Write-Host "Factory:" -ForegroundColor Cyan
Write-Host "  $FactoryAddress"

Write-Host ""

Write-Host "Frontend environment:" -ForegroundColor Cyan
Write-Host "  $EnvFile"

Write-Host ""

Write-Host "$EnvVariable=$FactoryAddress"

Write-Host ""

Write-Host "You can now start the Vite frontend." `
    -ForegroundColor Green

Write-Host ""