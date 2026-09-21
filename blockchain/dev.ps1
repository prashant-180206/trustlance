param(
    [Parameter(Mandatory = $true)]
    [string[]]$Accounts
)

$ErrorActionPreference = "Stop"

# ============================================================
# TrustLance - Local Blockchain Development Setup
#
# Assumes Hardhat node is already running.
#
# Usage:
#
# .\dev-after-node.ps1 `
#     "0xFUNDING_PRIVATE_KEY" `
#     "0xCLIENT_ADDRESS" `
#     "0xFREELANCER_ADDRESS" `
#     "0xANOTHER_ADDRESS"
#
# First argument:
#     Funding account private key
#
# Remaining arguments:
#     Wallets that receive test ETH
#
# Each recipient receives 10 ETH.
# ============================================================


# ============================================================
# Configuration
# ============================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$IgnitionModule = "ignition/modules/TrustLanceFactory.ts"

$EnvFile = Join-Path $ScriptDir "..\trustlance\.env.local"

$EnvVariable = "VITE_TRUSTLANCE_FACTORY_ADDRESS"

$FundingAmount = "10"


# ============================================================
# Validate arguments
# ============================================================

if ($Accounts.Count -lt 2) {
    throw @"
At least two arguments are required.

First argument  = funding private key
Remaining args  = recipient wallet addresses

Example:

.\dev-after-node.ps1 `
    "0xPRIVATE_KEY" `
    "0xCLIENT_ADDRESS" `
    "0xFREELANCER_ADDRESS"
"@
}


# ============================================================
# Extract accounts
# ============================================================

$FundPrivateKey = $Accounts[0]

$RecipientAddresses = @(
    $Accounts | Select-Object -Skip 1
)


# ============================================================
# Header
# ============================================================

Clear-Host

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " TrustLance Local Development Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Recipients: $($RecipientAddresses.Count)" -ForegroundColor Cyan
Write-Host "Amount per wallet: $FundingAmount ETH" -ForegroundColor Cyan
Write-Host ""


# ============================================================
# Fund test wallets
# ============================================================

Write-Host "Funding test wallets..." -ForegroundColor Cyan
Write-Host ""

$env:TRANSFER_PRIVATE_KEY = $FundPrivateKey
$env:TRANSFER_AMOUNT = $FundingAmount


foreach ($RecipientAddress in $RecipientAddresses) {

    Write-Host "--------------------------------------------" `
        -ForegroundColor DarkGray

    Write-Host "Recipient:" -ForegroundColor Yellow
    Write-Host $RecipientAddress

    Write-Host ""
    Write-Host "Sending $FundingAmount ETH..." `
        -ForegroundColor Cyan

    $env:TRANSFER_RECIPIENT = $RecipientAddress

    & pnpm.cmd hardhat run `
        ".\scripts\transfer-test-eth.ts" `
        --network localhost

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to fund recipient: $RecipientAddress"
    }

    Write-Host ""
    Write-Host "Funded successfully." -ForegroundColor Green
    Write-Host ""
}


Write-Host "============================================" `
    -ForegroundColor Green

Write-Host "All test wallets funded." `
    -ForegroundColor Green

Write-Host "============================================" `
    -ForegroundColor Green


# ============================================================
# Compile contracts
# ============================================================

Write-Host ""
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


# Print deployment output

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

Write-Host "Funded wallets:" -ForegroundColor Cyan

foreach ($RecipientAddress in $RecipientAddresses) {
    Write-Host "  $RecipientAddress"
}

Write-Host ""

Write-Host "ETH per wallet:" -ForegroundColor Cyan
Write-Host "  $FundingAmount ETH"

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