# Development Session Closeout Script
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

Write-Host "=== Development Session Closeout ===" -ForegroundColor Cyan

# Stop any running development servers
Write-Host "
Stopping development servers..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -match "node|python|go"} | ForEach-Object {
    Write-Host "Found process: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor White
}

# Commit changes reminder
Write-Host "
Git Status:" -ForegroundColor Cyan
git status --short

$uncommittedChanges = git status --short
if ($uncommittedChanges) {
    Write-Host "
⚠️  You have uncommitted changes!" -ForegroundColor Yellow
    Write-Host "Consider committing your work before closing the session." -ForegroundColor White
}
else {
    Write-Host "
✅ No uncommitted changes" -ForegroundColor Green
}

# Update context documentation for next session (KEY FEATURE)
Write-Host "
🔄 Updating IDE_CONTEXT_SUMMARY.md with session context..." -ForegroundColor Cyan

# Capture session information
$sessionDate = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$changedFiles = git diff --name-only
$changedFilesStaged = git diff --cached --name-only
$modifiedFiles = git ls-files -m
$recentCommits = git log --oneline -5
$gitStatusShort = git status --short

# Get git diff summary (brief)
$diffSummary = ""
if ($changedFiles -or $changedFilesStaged -or $modifiedFiles) {
    $allChanged = (@($changedFiles) + @($changedFilesStaged) + @($modifiedFiles)) | Select-Object -Unique | Where-Object { $_ }
    if ($allChanged) {
        $diffSummary = "Modified files: " + ($allChanged -join ", ")
    }
}

# Prompt user for session notes
Write-Host "
📝 What did you work on in this session?" -ForegroundColor Yellow
Write-Host "   (Quick notes: features added, bugs fixed, what you're working on next)" -ForegroundColor Gray
$userNotes = Read-Host "   Notes (press Enter to skip)"

# Build session context
$nl = [Environment]::NewLine
$sessionContext = ''
$sessionContext += '### Session: ' + $sessionDate + $nl + $nl
$sessionContext += '#### Files Changed:' + $nl

if ($gitStatusShort) {
    $sessionContext += $nl + (($gitStatusShort -split $nl | ForEach-Object { '- ' + $_ }) -join $nl)
} else {
    $sessionContext += $nl + '- No changes detected'
}

$sessionContext += $nl + $nl + '#### Recent Commits:' + $nl

if ($recentCommits) {
    $sessionContext += $nl + (($recentCommits -split $nl | Select-Object -First 3 | ForEach-Object { '- ' + $_ }) -join $nl)
} else {
    $sessionContext += $nl + '- No recent commits'
}

if ($userNotes) {
    $trimmedNotes = ($userNotes).Trim()
    if ($trimmedNotes) {
        $sessionContext += $nl + $nl + $nl + '#### Session Notes:' + $nl + '> ' + $trimmedNotes
    }
}

$sessionContext += $nl + $nl + '---' + $nl

# Update IDE_CONTEXT_SUMMARY.md
$contextPath = 'IDE_CONTEXT_SUMMARY.md'
if (Test-Path $contextPath) {
    $content = Get-Content $contextPath -Raw
    
    # Find and replace the Recent Session Context section
    $sectionHeader = '## Recent Session Context'
    
    $pattern = '*' + $sectionHeader + '*'
    if ($content -like $pattern) {
        # Split content into lines to find section
        $lines = $content -split $nl
        $startLineIndex = -1
        $endLineIndex = -1
        
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match "^## Recent Session Context") {
                $startLineIndex = $i
            }
            elseif ($startLineIndex -ge 0 -and $lines[$i] -match "^## " -and $lines[$i] -notmatch "^## Recent Session Context") {
                $endLineIndex = $i
                break
            }
        }
        
        if ($startLineIndex -ge 0) {
            # Build new section
            $headerText = '## Recent Session Context'
            $descText = '*This section is automatically updated when you run session-closeout.ps1 to maintain continuity between AI chat sessions.*'
            $newSection = $headerText + $nl + $nl + $descText + $nl + $nl + $sessionContext
            
            if ($endLineIndex -gt $startLineIndex) {
                # Replace section between lines
                $beforeLines = $lines[0..($startLineIndex - 1)] -join $nl
                $afterLines = $lines[$endLineIndex..($lines.Count - 1)] -join $nl
                $content = $beforeLines + $nl + $newSection + $nl + $afterLines
            } else {
                # Replace from start line to end of file
                $beforeLines = $lines[0..($startLineIndex - 1)] -join $nl
                $content = $beforeLines + $nl + $newSection
            }
        } else {
            # Append if section marker found but couldn't process
            $content += $nl + $nl + $sessionContext
        }
    } else {
        # Append if section doesn't exist
        $headerText = '## Recent Session Context'
        $descText = '*This section is automatically updated when you run session-closeout.ps1 to maintain continuity between AI chat sessions.*'
        $newSection = $headerText + $nl + $nl + $descText + $nl + $nl + $sessionContext
        $content += $nl + $nl + $newSection
    }
    
    Set-Content -Path $contextPath -Value $content -Encoding UTF8
    Write-Host 'Session context saved to IDE_CONTEXT_SUMMARY.md' -ForegroundColor Green
    Write-Host '   Next AI chat will have full context of this session!' -ForegroundColor Green
} else {
    Write-Host 'IDE_CONTEXT_SUMMARY.md not found. Run Setup-DevWorkflow.ps1 first.' -ForegroundColor Yellow
}

# Session summary
Write-Host ''
Write-Host '=== Session Summary ===' -ForegroundColor Green
Write-Host 'Project: splitbi' -ForegroundColor White
$closeoutTime = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Write-Host 'Session closed at:' -NoNewline -ForegroundColor White
Write-Host $closeoutTime -ForegroundColor White
Write-Host ''
Write-Host 'Goodbye!' -ForegroundColor Cyan
