# ============================================================
# TrustLance - Local Supabase
# ============================================================

# supabase gen types typescript --local > ../trustlance/src/types/database.types.ts

$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SupabaseDir = Join-Path $ScriptDir "./"
$EnvFile = Join-Path $ScriptDir "../trustlance\.env.local"

# ------------------------------------------------------------
# Validate
# ------------------------------------------------------------

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "Supabase CLI not found." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$SupabaseDir\config.toml")) {
    Write-Host "Supabase project not found: $SupabaseDir" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " TrustLance Local Supabase" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------
# Start Supabase in separate PowerShell
# ------------------------------------------------------------

$Command = @"
Set-Location -LiteralPath '$SupabaseDir'

Write-Host ''
Write-Host 'Starting Supabase...' -ForegroundColor Yellow
Write-Host ''

supabase start

Write-Host ''
Write-Host 'Supabase is running.' -ForegroundColor Green
Write-Host ''
Write-Host 'Studio: http://127.0.0.1:54323' -ForegroundColor Cyan
Write-Host 'API:    http://127.0.0.1:54321' -ForegroundColor Cyan
Write-Host ''

Read-Host 'Press ENTER to close'
"@

Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        $Command
    )

# ------------------------------------------------------------
# Wait for Supabase
# ------------------------------------------------------------

Write-Host "Waiting for Supabase..." -ForegroundColor Yellow

Start-Sleep -Seconds 5

# ------------------------------------------------------------
# Get environment from Supabase CLI
# ------------------------------------------------------------

Push-Location $SupabaseDir

try {
    $Output = & supabase status -o env 2>&1
}
finally {
    Pop-Location
}

$OutputText = $Output -join "`n"

# ------------------------------------------------------------
# Extract values
# ------------------------------------------------------------

$SupabaseUrl = $null
$AnonKey = $null

foreach ($Line in $Output) {

    $Line = [string]$Line

    if ($Line -match '^API_URL=(.*)$') {
        $SupabaseUrl = $Matches[1].Trim('"')
    }

    elseif ($Line -match '^ANON_KEY=(.*)$') {
        $AnonKey = $Matches[1].Trim('"')
    }

}

# ------------------------------------------------------------
# Validate
# ------------------------------------------------------------

if (-not $SupabaseUrl) {
    Write-Host ""
    Write-Host "Could not get Supabase API URL." -ForegroundColor Red
    Write-Host $OutputText
    exit 1
}

if (-not $AnonKey) {
    Write-Host ""
    Write-Host "Could not get Supabase anon/publishable key." -ForegroundColor Red
    Write-Host $OutputText
    exit 1
}


# ------------------------------------------------------------
# Create env file if necessary
# ------------------------------------------------------------

if (-not (Test-Path $EnvFile)) {
    New-Item -ItemType File -Path $EnvFile -Force | Out-Null
}

$Lines = @(Get-Content $EnvFile)

# ------------------------------------------------------------
# Update environment variable
# ------------------------------------------------------------

function Set-Env {
    param(
        [string[]]$Lines,
        [string]$Name,
        [string]$Value
    )

    $Result = @()
    $Found = $false

    foreach ($Line in $Lines) {

        if ($Line -match "^\s*$([regex]::Escape($Name))\s*=") {

            if (-not $Found) {
                $Result += "$Name=$Value"
                $Found = $true
            }

            continue
        }

        $Result += $Line
    }

    if (-not $Found) {
        $Result += "$Name=$Value"
    }

    return $Result
}

# ------------------------------------------------------------
# Update .env.local
# ------------------------------------------------------------

$Lines = Set-Env `
    -Lines $Lines `
    -Name "VITE_SUPABASE_URL" `
    -Value $SupabaseUrl

$Lines = Set-Env `
    -Lines $Lines `
    -Name "VITE_SUPABASE_ANON_KEY" `
    -Value $AnonKey

$Lines | Set-Content $EnvFile -Encoding UTF8

# ------------------------------------------------------------
# Done
# ------------------------------------------------------------

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " Supabase Setup Complete" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Write-Host "API:" -ForegroundColor Cyan
Write-Host "  $SupabaseUrl"

Write-Host ""
Write-Host "Updated:" -ForegroundColor Cyan
Write-Host "  $EnvFile"

Write-Host ""
Write-Host "Supabase Studio:" -ForegroundColor Cyan
Write-Host "  http://127.0.0.1:54323"

Write-Host ""