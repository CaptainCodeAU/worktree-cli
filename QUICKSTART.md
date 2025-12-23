# Worktree CLI - Quick Start Guide

Get up and running with `wt` in minutes. This guide covers common workflows with practical examples.

**This guide is for everyone** - whether you're using the CLI manually, with Cursor, Claude Code, or any other editor/AI assistant.

## Table of Contents

- [Installation](#installation)
- [Basic Workflow](#basic-workflow)
- [Common Scenarios](#common-scenarios)
- [Configuration for AI Assistants](#configuration-for-ai-assistants)
- [Advanced Workflows](#advanced-workflows)
- [Troubleshooting](#troubleshooting)

---

## Installation

```bash
# Install globally
pnpm install -g @johnlindquist/worktree

# Verify installation
wt --version
```

---

## Basic Workflow

### 1. Create Your First Worktree

```bash
# Create a worktree for a new feature
wt new feature/login -c

# This will:
# - Create a new branch called "feature/login"
# - Create a worktree in a sibling directory
# - Open it in your default editor (Cursor)
```

### 2. Check Your Worktrees

```bash
# List all worktrees
wt list

# Show detailed status
wt status
```

### 3. Switch Between Worktrees

```bash
# Interactive fuzzy search
wt open

# Or open by branch name
wt open feature/login
```

### 4. Merge and Clean Up

```bash
# Merge your changes back to main
wt merge feature/login --auto-commit --remove

# This will:
# - Commit any uncommitted changes
# - Merge the branch into your current branch
# - Remove the worktree
```

---

## Common Scenarios

### Working on a GitHub PR

```bash
# List open PRs and select one
wt pr

# Or directly by PR number
wt pr 123

# With setup scripts and dependencies
wt pr 123 --setup -i pnpm
```

**Result:** You now have a worktree with the PR code, ready to review or modify.

### Setting Up a New Feature with Dependencies

```bash
# Create worktree with automatic setup
wt setup feature/dark-mode -c -i pnpm

# This will:
# - Create the worktree
# - Run setup scripts from worktrees.json
# - Install dependencies with pnpm
```

### Parallel Development (Multiple Features)

```bash
# Start three features simultaneously
wt setup feature/auth -c -i pnpm
wt setup feature/ui -c -i pnpm
wt setup feature/api -c -i pnpm

# Check status of all
wt status

# Work in each independently
cd ../myapp-feature-auth
# ... make changes ...

cd ../myapp-feature-ui
# ... make changes ...

cd ../myapp-feature-api
# ... make changes ...

# Merge them back one by one
cd ../myapp  # back to main
wt merge feature/auth --auto-commit --remove
wt merge feature/ui --auto-commit --remove
wt merge feature/api --auto-commit --remove
```

### Emergency Hotfix

```bash
# Quickly create a hotfix worktree
wt new hotfix/urgent-bug -c

# Make your fix
# ... edit files ...

# Merge immediately
wt merge hotfix/urgent-bug --auto-commit --remove
```

### Experimenting Safely

```bash
# Create an experimental worktree
wt new experiment/new-approach -c

# Try your changes
# ... experiment ...

# If it doesn't work out, just remove it
wt remove experiment/new-approach -f

# Your main worktree is untouched!
```

---

## Configuration for AI Assistants

This section is specifically for users working with AI assistants like Claude Code or Cursor's parallel agents.

### Recommended Setup for Claude Code / Cursor

```bash
# Configure for headless operation
wt config set editor none        # Don't auto-open editor
wt config set trust true         # Skip confirmation prompts
wt config set subfolder true     # Organized directory structure

# Verify configuration
wt config get editor
wt config get trust
wt config get subfolder
```

### Create Setup Scripts

Create `.cursor/worktrees.json` in your repository root:

```json
[
  "pnpm install",
  "cp $ROOT_WORKTREE_PATH/.env.local .env.local",
  "pnpm build"
]
```

Or use `worktrees.json` for a generic format:

```json
{
  "setup-worktree": [
    "pnpm install",
    "cp $ROOT_WORKTREE_PATH/.env.local .env.local",
    "pnpm build"
  ]
}
```

### Parallel AI Agent Workflow

```bash
# Agent 1: Authentication
wt setup agent-1-auth -c

# Agent 2: UI Components
wt setup agent-2-ui -c

# Agent 3: API Integration
wt setup agent-3-api -c

# Check progress
wt status

# Each agent works independently in their worktree
# Merge when ready
wt merge agent-1-auth --auto-commit --remove
wt merge agent-2-ui --auto-commit --remove
wt merge agent-3-api --auto-commit --remove
```

---

## Advanced Workflows

### Using a Global Worktree Directory

```bash
# Set a global worktree location
wt config set worktreepath ~/worktrees

# Now all worktrees go to ~/worktrees/<repo-name>/<branch-name>
wt new feature/login -c
# Creates: ~/worktrees/myapp/feature-login
```

### Bare Repository Workflow

For power users who work heavily with worktrees:

```bash
# Clone as bare repository
git clone --bare git@github.com:user/repo.git repo.git
cd repo.git

# Create worktrees for different branches
wt new main -p ../main -c
wt new develop -p ../develop -c
wt new feature/new -p ../feature-new -c

# Each is a separate working directory
# The bare repo contains only .git data
```

### Custom Worktree Paths

```bash
# Specify exact path
wt new feature/login -c -p ~/custom/location/login

# Useful for organizing by project phase
wt new feature/phase1 -c -p ~/projects/phase1/feature
wt new feature/phase2 -c -p ~/projects/phase2/feature
```

### Working with GitLab

```bash
# Set GitLab as provider
wt config set provider glab

# Create worktree from Merge Request
wt pr 456

# Or let it auto-detect from your remote URL
```

---

## Troubleshooting

### "Command not found: wt"

```bash
# Reinstall globally
pnpm install -g @johnlindquist/worktree

# Or link if developing locally
pnpm link --global
```

### "Not a git repository"

```bash
# Make sure you're inside a git repository
git status

# Initialize if needed
git init
```

### "Branch already exists"

```bash
# Use without -c flag to checkout existing branch
wt new existing-branch

# Or use a different branch name
wt new feature/login-v2 -c
```

### Dirty Worktree Warnings

```bash
# Commit your changes first
git add .
git commit -m "WIP"

# Or use auto-commit when merging
wt merge feature/login --auto-commit
```

### Setup Scripts Not Running

```bash
# Make sure you're using 'wt setup' not 'wt new'
wt setup feature/login -c

# Check if worktrees.json exists
ls -la .cursor/worktrees.json
ls -la worktrees.json

# Enable trust mode if prompts are blocking
wt config set trust true
```

### Can't Find PR/MR

```bash
# Make sure gh or glab is installed and authenticated
gh auth status
glab auth status

# Set provider explicitly
wt config set provider gh   # or glab
```

---

## Quick Reference

```bash
# === CREATION ===
wt new <branch> -c              # New worktree + branch
wt setup <branch> -c            # New worktree + run setup
wt pr [number]                  # Worktree from PR/MR

# === NAVIGATION ===
wt list                         # List all worktrees
wt status                       # Show detailed status
wt open                         # Interactive selector

# === CLEANUP ===
wt remove <branch>              # Remove worktree
wt purge                        # Multi-select removal

# === MERGING ===
wt merge <branch>               # Merge branch
wt merge <branch> --auto-commit # Auto-commit first
wt merge <branch> --remove      # Merge + cleanup

# === CONFIGURATION ===
wt config set editor <name>     # Set default editor
wt config set trust true        # Skip confirmations
wt config set subfolder true    # Organized directories
wt config get <key>             # Get config value
wt config path                  # Show config location
```

---

## Next Steps

1. **Read the full README**: `cat README.md` for detailed documentation
2. **Explore your config**: `wt config path` to see where settings are stored
3. **Try the interactive mode**: Run `wt open` or `wt pr` without arguments
4. **Set up your workflow**: Create `.cursor/worktrees.json` for your project
5. **Join the community**: Check out the GitHub repository for updates

---

**Happy worktree-ing! 🚀**

