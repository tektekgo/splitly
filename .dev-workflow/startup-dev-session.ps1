# Development Session Startup Script
# Generated for: splitbi
# Tech Stack: Node.js

# Automatically handle execution policy (no admin required)
try {
    $currentPolicy = Get-ExecutionPolicy -Scope Process
    if ($currentPolicy -eq 'Restricted') {
        Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force | Out-Null
    }
} catch {
    # Continue if policy check fails
}

Write-Host "=== Development Session Startup ===" -ForegroundColor Green
Write-Host "Project: splitbi" -ForegroundColor White
Write-Host "Tech Stack: Node.js" -ForegroundColor White

# Check if project dependencies are installed
Write-Host "
Checking Node.js dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "
Starting development server..." -ForegroundColor Cyan
Write-Host "Command: npm run dev" -ForegroundColor White
Write-Host "Server will be available at: http://localhost:5173" -ForegroundColor Green

# Uncomment to auto-start dev server:
# npm run dev
# Set auto-open context by default (can be disabled with DEVWF_OPEN_CONTEXT=0)
if (-not $env:DEVWF_OPEN_CONTEXT) {
    $env:DEVWF_OPEN_CONTEXT = '1'
}

# Check context documentation
Write-Host "
Checking project context..." -ForegroundColor Cyan
if (Test-Path "IDE_CONTEXT_SUMMARY.md") {
    Write-Host "✅ Context documentation ready" -ForegroundColor Green
    Write-Host "Tip: Reference IDE_CONTEXT_SUMMARY.md in your AI chat for project context" -ForegroundColor Yellow
}
else {
    Write-Host "⚠️  Context documentation not found. Run Setup-DevWorkflow.ps1 first." -ForegroundColor Yellow
}

# Auto-open context doc (enabled by default, disable with DEVWF_OPEN_CONTEXT=0)
$shouldOpen = $env:DEVWF_OPEN_CONTEXT -eq '1'
$inCI = $env:CI -or $env:GITHUB_ACTIONS
if ($shouldOpen -and -not $inCI -and (Test-Path 'IDE_CONTEXT_SUMMARY.md')) {
    $contextPath = Resolve-Path 'IDE_CONTEXT_SUMMARY.md' -ErrorAction SilentlyContinue
    if ($null -ne $contextPath) {
        try {
            if ($env:OS -eq 'Windows_NT') {
                Start-Process -FilePath $contextPath
            }
            elseif (Get-Command open -ErrorAction SilentlyContinue) {
                & open $contextPath
            }
            elseif (Get-Command xdg-open -ErrorAction SilentlyContinue) {
                & xdg-open $contextPath
            }
            else {
                Write-Host "Note: couldn't find a suitable opener for IDE_CONTEXT_SUMMARY.md" -ForegroundColor Yellow
            }
        } catch {
            try {
                Invoke-Item $contextPath
            } catch {
                Write-Host "Note: couldn't auto-open IDE_CONTEXT_SUMMARY.md" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "Note: couldn't auto-open IDE_CONTEXT_SUMMARY.md" -ForegroundColor Yellow
    }
}

# Show simple manual steps
Write-Host "
📋 Quick Start:" -ForegroundColor Cyan
Write-Host "  1) Open IDE_CONTEXT_SUMMARY.md (for AI context)" -ForegroundColor White
Write-Host "  2) Start dev server: npm run dev" -ForegroundColor Yellow
Write-Host "  3) Open: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""

# Auto-start dev server (can be disabled with DEVWF_AUTOSTART=0)
$autoStart = if ($env:DEVWF_AUTOSTART) { $env:DEVWF_AUTOSTART } else { '1' }
if ($autoStart -eq '1') {
    Write-Host "🚀 Auto-starting dev server..." -ForegroundColor Green
    try {
        Invoke-Expression "npm run dev"
    } catch {
        Write-Host "⚠️  Auto-start failed. Run manually: npm run dev" -ForegroundColor Yellow
    }
}

Write-Host "
=== Session Ready ===" -ForegroundColor Green
Write-Host "Happy coding! 🚀" -ForegroundColor White
