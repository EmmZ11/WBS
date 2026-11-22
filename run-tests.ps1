# One-click setup and test run (Windows). Start it by double-clicking run-tests.cmd.
# It does what the CI pipeline does: install, typecheck, lint, run every test project,
# then opens the HTML report.
$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

function Write-Step([string]$text) { Write-Host ''; Write-Host "==> $text" -ForegroundColor Cyan }

# 1. Node.js 22 or newer
Write-Step 'Checking Node.js'
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host 'Node.js is not installed. Install version 22 or newer from https://nodejs.org and run this again.' -ForegroundColor Red
  exit 1
}
$major = [int]((node --version).TrimStart('v').Split('.')[0])
if ($major -lt 22) {
  Write-Host "Node.js $(node --version) found; version 22 or newer is needed (https://nodejs.org)." -ForegroundColor Red
  exit 1
}
Write-Host "Node.js $(node --version)"

# 2. Dependencies and browser
Write-Step 'Installing dependencies (npm ci)'
npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Step 'Installing the Chromium browser for Playwright'
npx playwright install chromium
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 3. Credentials (.env, git-ignored). Asked for once; never printed.
if (-not (Test-Path '.env')) {
  Write-Step 'Creating .env (the logins stay on this machine)'
  Write-Host 'Restful Booker Platform admin login (automationintesting.online):'
  $adminUser = Read-Host '  Username'
  $adminPass = Read-Host '  Password' -AsSecureString
  Write-Host 'Restful Booker API login ("Auth - CreateToken" at restful-booker.herokuapp.com/apidoc):'
  $bookerUser = Read-Host '  Username'
  $bookerPass = Read-Host '  Password' -AsSecureString

  $plain = { param($s) [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)) }
  # In -replace, '$' in the replacement is special; double it so any value is written as typed.
  $safe = { param($v) $v.Replace('$', '$$') }
  $content = (Get-Content '.env.example' -Raw) `
    -replace '(?m)^ADMIN_USERNAME=.*$', ('ADMIN_USERNAME=' + (& $safe $adminUser)) `
    -replace '(?m)^ADMIN_PASSWORD=.*$', ('ADMIN_PASSWORD=' + (& $safe (& $plain $adminPass))) `
    -replace '(?m)^BOOKER_USERNAME=.*$', ('BOOKER_USERNAME=' + (& $safe $bookerUser)) `
    -replace '(?m)^BOOKER_PASSWORD=.*$', ('BOOKER_PASSWORD=' + (& $safe (& $plain $bookerPass)))
  # UTF-8 without a byte-order mark, so Node reads the first key correctly.
  [IO.File]::WriteAllText((Join-Path $PSScriptRoot '.env'), $content, (New-Object Text.UTF8Encoding $false))
  Write-Host 'Saved .env'
} else {
  Write-Host ''
  Write-Host 'Using the existing .env'
}

# 4. The same steps as CI
$env:CI = 'true'
Write-Step 'Typecheck'
npm run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Step 'Lint'
npm run lint
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Step 'Running all test projects (about 3 minutes)'
npx playwright test
$testExit = $LASTEXITCODE

# 5. Result
Write-Host ''
if ($testExit -eq 0) {
  Write-Host 'All tests passed.' -ForegroundColor Green
} else {
  Write-Host 'Test run finished with failures. This is expected: every failure is a defect' -ForegroundColor Yellow
  Write-Host 'in the systems under test, named by its bug ID and listed in BUG-REPORT.md.' -ForegroundColor Yellow
  Write-Host 'A failure starting with "precondition:" means the shared demo site misbehaved; run again.' -ForegroundColor Yellow
}
$report = Join-Path $PSScriptRoot 'playwright-report\index.html'
if (Test-Path $report) {
  Write-Host "Opening the HTML report: $report"
  Start-Process $report
}
exit $testExit
