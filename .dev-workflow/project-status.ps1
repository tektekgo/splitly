# Project Status Script
# Generated for: splitbi

# Automatically handle execution policy (no admin required)
try {
    $currentPolicy = Get-ExecutionPolicy -Scope Process
    if ($currentPolicy -eq 'Restricted') {
        Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force | Out-Null
    }
} catch {
    # Continue if policy check fails
}

Write-Host "=== Project Status ===" -ForegroundColor Cyan
Write-Host ""

# Project Information
Write-Host "📦 Project Information:" -ForegroundColor Green
Write-Host "  Name: splitbi" -ForegroundColor White
Write-Host "  Tech Stack: Node.js" -ForegroundColor White
Write-Host "  Language: JavaScript" -ForegroundColor White
Write-Host "  Framework: React + Vite" -ForegroundColor White

# Git Status
Write-Host "
📊 Git Status:" -ForegroundColor Green
git status --short
git log -1 --oneline

Write-Host "
=== End of Status ===" -ForegroundColor Cyan
