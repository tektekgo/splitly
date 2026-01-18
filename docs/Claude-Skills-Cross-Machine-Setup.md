# Claude Skills Cross-Machine Setup Guide

**Use Case:** Sharing Claude Code skills between Windows and Mac machines

---

## How Claude Skills Work

| Location | Path | Scope |
|----------|------|-------|
| **Personal** | `~/.claude/skills/` | All your projects (automatic) |
| **Project** | `.claude/skills/` | Anyone using that repo |
| **Plugin** | Plugin package | Distributed/shared |

---

## Option A: Git Repo + Symlinks (Recommended)

Create a GitHub repo for your skills, then symlink on each machine.

### Step 1: Create a Skills Repo

```bash
# Create repo on GitHub: your-username/claude-skills
# Then clone it
git clone https://github.com/YOUR_USERNAME/claude-skills.git ~/repos/claude-skills
```

### Step 2: Structure Your Skills

```
claude-skills/
├── skill-name-1/
│   └── SKILL.md
├── skill-name-2/
│   └── SKILL.md
└── README.md
```

### Step 3: Create Symlinks

#### On Windows (Run PowerShell as Administrator)

```powershell
# First, remove existing skills folder if it exists
Remove-Item -Path "$env:USERPROFILE\.claude\skills" -Recurse -Force -ErrorAction SilentlyContinue

# Create symlink
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.claude\skills" -Target "C:\Repos\claude-skills"
```

#### On Mac

```bash
# First, remove existing skills folder if it exists
rm -rf ~/.claude/skills

# Create symlink
ln -s ~/repos/claude-skills ~/.claude/skills
```

### Syncing Between Machines

```bash
# Pull latest skills on any machine
cd ~/repos/claude-skills  # or C:\Repos\claude-skills on Windows
git pull

# After adding/editing skills
git add .
git commit -m "Add new skill"
git push
```

### Benefits
- Version controlled
- Sync by `git pull` on each machine
- Can share with others
- Works offline

---

## Option B: Cloud Sync (Simpler)

Store skills in a cloud-synced folder (OneDrive, iCloud, Dropbox), then symlink.

### OneDrive (Windows)

```powershell
# Create skills folder in OneDrive
New-Item -ItemType Directory -Path "$env:USERPROFILE\OneDrive\claude-skills" -Force

# Create symlink
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.claude\skills" -Target "$env:USERPROFILE\OneDrive\claude-skills"
```

### iCloud (Mac)

```bash
# Create skills folder in iCloud
mkdir -p ~/Library/Mobile\ Documents/com~apple~CloudDocs/claude-skills

# Create symlink
ln -s ~/Library/Mobile\ Documents/com~apple~CloudDocs/claude-skills ~/.claude/skills
```

### Dropbox

```bash
# Windows
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.claude\skills" -Target "$env:USERPROFILE\Dropbox\claude-skills"

# Mac
ln -s ~/Dropbox/claude-skills ~/.claude/skills
```

### Benefits
- Auto-sync (no git commands)
- Works across machines instantly

### Downsides
- No version history
- Dependent on cloud service

---

## SKILL.md File Structure

Each skill needs a `SKILL.md` file:

```markdown
---
name: My Custom Skill
description: Brief description of what this skill does
---

# My Custom Skill

## When to Use
Describe when this skill should be triggered.

## Instructions
Step-by-step instructions for Claude to follow.

## Examples
Show example usage if helpful.
```

---

## Troubleshooting

### Symlink Not Working (Windows)

1. Run PowerShell as Administrator
2. Enable Developer Mode: Settings → Update & Security → For developers → Developer Mode

### Skills Not Loading

1. Restart Claude Code
2. Check symlink is valid: `ls -la ~/.claude/skills` (Mac) or `dir $env:USERPROFILE\.claude\skills` (Windows)
3. Verify SKILL.md exists in each skill folder

### Permission Denied (Mac)

```bash
chmod -R 755 ~/.claude/skills
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Check skills location | `~/.claude/skills/` |
| Pull latest (Git) | `cd ~/repos/claude-skills && git pull` |
| Add new skill | Create folder with `SKILL.md` inside |
| Verify symlink (Mac) | `ls -la ~/.claude/skills` |
| Verify symlink (Win) | `Get-Item $env:USERPROFILE\.claude\skills` |

---

*Created: January 13, 2026*
