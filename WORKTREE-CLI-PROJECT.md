# Worktree-CLI Fork: Claude Code & Cursor Integration

## Project Overview

This is a fork of `@johnlindquist/worktree-cli` — a CLI tool for managing Git worktrees with a focus on AI-assisted parallel development workflows.

**Original Repository:** https://github.com/johnlindquist/worktree-cli
**Your Fork:** https://github.com/CaptainCodeAU/worktree-cli

---

## Vision

Create a **unified worktree management system** that works seamlessly with both **Claude Code** and **Cursor**, enabling:

1. **Parallel AI agent workflows** — Multiple AI agents working on different tasks simultaneously, each in isolated worktrees
2. **Consistent experience** — Same tool, same config, same behavior regardless of which AI assistant you're using
3. **Automation-first** — Headless operation for CI/CD and AI agents without interactive prompts blocking execution
4. **Clean organization** — Structured worktree directories that don't clutter your projects folder

---

## Current State

### What's Already in the CLI

| Command | Description |
|---------|-------------|
| `wt new <branch>` | Create new worktree from branch |
| `wt setup <branch>` | Create worktree + run setup scripts |
| `wt pr [number]` | Create worktree from GitHub PR or GitLab MR |
| `wt open [path]` | Open existing worktree (interactive fuzzy search) |
| `wt list` | List all worktrees with status |
| `wt status` | **NEW** Show detailed status (clean/dirty, ahead/behind) |
| `wt remove [path]` | Remove a worktree |
| `wt purge` | Multi-select removal of worktrees |
| `wt extract` | Extract current branch to a worktree |
| `wt merge <branch>` | Merge a worktree branch into current branch |
| `wt config get/set` | Configure editor, provider, worktreepath, trust, subfolder |

### Key Options

- `-c, --checkout`: Create new branch if it doesn't exist
- `-i, --install <pm>`: Auto-install dependencies (npm/pnpm/bun)
- `-e, --editor <editor>`: Override default editor (cursor/code/none)
- `-t, --trust`: Skip confirmation for setup scripts
- `-p, --path <path>`: Custom worktree path
- `--setup` (on `wt pr`): Run setup scripts after PR worktree creation

### Setup Script Configuration

The CLI reads setup scripts from two locations (checked in order):
1. `.cursor/worktrees.json` (Cursor's native format)
2. `worktrees.json` (generic format)

**Format examples:**

```json
// .cursor/worktrees.json (array format)
[
  "pnpm install",
  "cp $ROOT_WORKTREE_PATH/.env.local .env.local"
]
```

```json
// worktrees.json (object format)
{
  "setup-worktree": [
    "pnpm install",
    "cp $ROOT_WORKTREE_PATH/.env.local .env.local"
  ]
}
```

---

## PR #35: Trust and Subfolder Config ✅ MERGED

**PR Link:** https://github.com/johnlindquist/worktree-cli/pull/35
**Status:** Successfully merged into `feature/claude-code-enhancements` branch

This PR adds two important config options:

### 1. Trust Mode
```bash
wt config set trust true
```
- Bypasses setup command confirmations globally
- No need to pass `-t` flag every time
- Essential for Claude Code automation

### 2. Subfolder Mode
```bash
wt config set subfolder true
```
- Changes worktree organization from siblings to subdirectory

**Without subfolder mode:**
```
my-app/                 # main repo
my-app-feature-auth/    # worktree (sibling)
my-app-feature-api/     # worktree (sibling)
```

**With subfolder mode:**
```
my-app/                 # main repo
my-app-worktrees/
  ├── feature-auth/     # worktree
  └── feature-api/      # worktree
```

### To Merge PR #35 Into Your Fork

```bash
git remote add upstream https://github.com/johnlindquist/worktree-cli.git
git fetch upstream feature/issues-33-34-config-options
git checkout -b feature/claude-code-enhancements main
git merge upstream/feature/issues-33-34-config-options --no-edit
pnpm build
pnpm test
```

---

## New: `wt status` Command ✅ IMPLEMENTED

The `wt status` command provides a comprehensive overview of all worktrees with detailed git status information.

### Features

- Shows all worktrees with branch names and paths
- **Git status**: Clean vs dirty (uncommitted changes)
- **Tracking status**: Ahead/behind upstream branch
- **Indicators**: Main worktree, locked, prunable status
- **Error handling**: Gracefully handles missing worktree directories

### Example Output

```bash
$ wt status
Worktree Status:

main → /Users/me/projects/myapp [main] [clean] [up-to-date]
feature/auth → /Users/me/projects/myapp-worktrees/feature-auth [dirty] [↑2]
feature/api → /Users/me/projects/myapp-worktrees/feature-api [clean] [no upstream]
```

### Status Indicators

- `[main]` - Main worktree
- `[clean]` / `[dirty]` - Git working tree status
- `[up-to-date]` - In sync with upstream
- `[↑N]` - N commits ahead of upstream
- `[↓N]` - N commits behind upstream
- `[↑N ↓M]` - Diverged from upstream
- `[no upstream]` - No tracking branch configured
- `[locked]` - Worktree is locked
- `[prunable]` - Worktree is stale/prunable

### Implementation Details

- Located in `src/commands/status.ts`
- 6 comprehensive tests in `test/status.test.ts`
- Reuses existing git utilities from `src/utils/git.ts`
- Handles edge cases: detached HEAD, bare repos, missing directories

---

## Planned Enhancements

### 1. Claude Code Slash Command Integration

Create a custom slash command for Claude Code at `.claude/commands/worktree.md`:

```markdown
# Worktree Management

You have access to the `wt` CLI tool for managing git worktrees.

## Common Commands

- `wt new <branch> -c` — Create new worktree (create branch if needed)
- `wt setup <branch> -c` — Create worktree + run setup scripts
- `wt list` — List all worktrees
- `wt remove <branch>` — Remove a worktree
- `wt merge <branch> --auto-commit --remove` — Merge and cleanup
- `wt pr <number> --setup` — Create worktree from PR/MR

## Workflow for Parallel Tasks

When asked to work on multiple tasks in parallel:

1. Create a worktree for each task: `wt setup feature/<task-name> -c`
2. Note the paths returned
3. Work in each worktree directory independently
4. When complete, merge back: `wt merge feature/<task-name> --auto-commit`

**User Request:** $ARGUMENTS
```

### 2. CLAUDE.md in Projects

Add to project's `CLAUDE.md`:

```markdown
## Worktree Workflow

This project uses `wt` (worktree-cli) for managing parallel workstreams.

- Worktrees are stored in organized subdirectories (subfolder mode enabled)
- Setup scripts run automatically via `.cursor/worktrees.json`
- For parallel tasks, create separate worktrees rather than switching branches
- Always use `wt merge` to bring changes back (safer than manual git merge)
- Trust mode is enabled — no confirmation prompts for setup scripts
```

### 3. Potential New Features to Implement

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| `wt status` | Quick overview of all worktrees + their git status (dirty/clean/ahead/behind) | High | ✅ **DONE** |
| Agent ID generation | Auto-generate `.agent-id` files for parallel agent coordination (like Cursor's parallel agents) | High | ⬜ Todo |
| CLAUDE.md copying | Automatically copy CLAUDE.md to new worktrees | Medium | ⬜ Todo |
| `wt clone` | Clone a repo as bare + set up initial worktree in one command | Medium | ⬜ Todo |
| Better GitLab parity | Ensure `wt pr` works equally well with `glab` | Medium | ⬜ Todo |
| `wt sync` | Fetch + rebase all worktrees from their upstream branches | Low | ⬜ Todo |

---

## Architecture Overview

```
worktree-cli/
├── src/
│   ├── index.ts              # CLI entry point (Commander setup)
│   ├── config.ts             # Config schema and getters/setters
│   ├── commands/
│   │   ├── new.ts            # wt new
│   │   ├── setup.ts          # wt setup
│   │   ├── pr.ts             # wt pr
│   │   ├── open.ts           # wt open
│   │   ├── list.ts           # wt list
│   │   ├── remove.ts         # wt remove
│   │   ├── merge.ts          # wt merge
│   │   ├── config.ts         # wt config get/set
│   │   └── ...
│   └── utils/
│       ├── paths.ts          # Path resolution logic
│       ├── tui.ts            # Terminal UI (prompts, confirmations)
│       ├── git.ts            # Git operations
│       └── ...
├── test/                     # Vitest tests
├── build/                    # Compiled JS output
├── package.json
└── tsconfig.json
```

### Key Technologies

- **TypeScript** — Source language
- **Commander** — CLI framework
- **Execa** — Shell command execution
- **Vitest** — Testing framework
- **Inquirer/Prompts** — Interactive TUI

---

## Development Workflow

### Setup (Already Completed)

```bash
# Clone your fork
git clone git@github.com:CaptainCodeAU/worktree-cli.git
cd worktree-cli

# Install dependencies
pnpm install

# Build
pnpm build

# Link globally for testing
pnpm link --global

# Verify
wt --version
```

### Making Changes

```bash
# 1. Create/switch to feature branch
git checkout -b feature/my-new-feature

# 2. Make changes in src/

# 3. Rebuild
pnpm build

# 4. Test manually
wt <command>

# 5. Run automated tests
pnpm test

# 6. Add tests for new functionality in test/

# 7. Commit
git add .
git commit -m "feat: description of change"

# 8. Push to your fork
git push origin feature/my-new-feature
```

### Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test -- test/config.test.ts
```

---

## Configuration Reference

### Global Config Location

Config is stored at: `~/.config/worktree-cli/config.json`

### Available Config Options

| Key | Command | Description |
|-----|---------|-------------|
| `editor` | `wt config set editor <value>` | Default editor: `cursor`, `code`, `none` |
| `provider` | `wt config set provider <value>` | Git provider CLI: `gh`, `glab` |
| `worktreepath` | `wt config set worktreepath <path>` | Global worktree directory |
| `trust` | `wt config set trust true` | Skip setup confirmations (PR #35) |
| `subfolder` | `wt config set subfolder true` | Use subdirectory organization (PR #35) |

### Recommended Config for Claude Code

```bash
wt config set editor none        # Don't open editor (headless)
wt config set trust true         # No confirmation prompts
wt config set subfolder true     # Organized directory structure
```

---

## Related Resources

### Documentation & Articles

- **Cursor Parallel Agents Docs:** https://cursor.com/docs/configuration/worktrees
- **Git Worktrees Explained:** https://dev.to/arifszn/git-worktrees-the-power-behind-cursors-parallel-agents-19j1
- **Nick Taylor's Git Worktrees Guide:** https://www.nickyt.co/blog/git-worktrees-git-done-right-2p7f/

### Cursor Parallel Agent Coordination

For Cursor's parallel agents, you can use `.cursor/worktrees.json` to auto-assign agent IDs:

```json
{
  "setup-worktree-unix": [
    "# ... coordination script that creates .agent-id file",
    "echo \"$TASK_NUM\" > .agent-id"
  ]
}
```

Then in your prompt:
```
Read your .agent-id file. Based on your number, execute ONLY that task:
1. Refactor authentication module
2. Add dark mode support
3. Optimize database queries
4. Write integration tests
```

**Full coordination script:** See https://forum.cursor.com/t/cursor-2-0-split-tasks-using-parallel-agents-automatically-in-one-chat-how-to-setup-worktree-json/140218

### Git Aliases (Fallback)

If `wt` isn't available, these git aliases provide basic worktree management:

```bash
git config --global alias.wta '!f() { git worktree add -b "$1" "../$1"; }; f'
git config --global alias.wtr '!f() { git worktree remove "../$1"; }; f'
git config --global alias.wtl '!f() { git worktree list; }; f'
```

### Shell Function for PR Checkout (Alternative)

```bash
cpr() {
  pr="$1"
  remote="${2:-origin}"
  branch=$(gh pr view "$pr" --json headRefName -q .headRefName)
  git fetch "$remote" "$branch"
  git worktree add "../$branch" "$branch"
  cd "../$branch" || return
  echo "Switched to new worktree for PR #$pr: $branch"
}
```

---

## Quick Reference Card

```bash
# === WORKTREE CREATION ===
wt new feature/auth -c              # New worktree + branch
wt setup feature/auth -c            # New worktree + run setup scripts
wt pr 123 --setup                   # Worktree from PR + setup

# === WORKTREE MANAGEMENT ===
wt list                             # List all worktrees
wt open                             # Interactive worktree selector
wt remove feature/auth              # Remove worktree
wt purge                            # Multi-select removal

# === MERGING ===
wt merge feature/auth               # Merge (fails if dirty)
wt merge feature/auth --auto-commit # Auto-commit dirty changes first
wt merge feature/auth --remove      # Merge + delete worktree
wt merge feature/auth --auto-commit --remove  # All-in-one

# === CONFIGURATION ===
wt config set editor none           # Headless mode
wt config set trust true            # Skip confirmations
wt config set subfolder true        # Organized directories
wt config path                      # Show config file location
```

---

## Next Steps for This Session

1. ✅ Fork cloned and set up locally
2. ✅ `wt` command working globally
3. ✅ Run tests: `pnpm test` (all 104 tests passing)
4. ✅ Merge PR #35 (trust + subfolder) - Successfully merged into `feature/claude-code-enhancements` branch
5. ✅ Rebuild and verify new config options work - Both `trust` and `subfolder` modes working
6. ✅ Implement first enhancement: `wt status` command - Fully implemented with 6 passing tests
7. ✅ Create Claude Code slash command - Created at `.claude/commands/worktree.md`
8. ⬜ Test end-to-end with Claude Code

---

## Questions to Consider

1. Should worktrees automatically inherit `.claude/` directory from main repo?
2. Should there be a `wt init` command that sets up recommended config + creates `.cursor/worktrees.json`?
3. How should agent coordination work in Claude Code vs Cursor? Same mechanism or different?
4. Should `wt status` show git status, or also check if setup scripts have been run?

---

*Document created: December 23, 2025*
*For use with Claude Code in ~/CODE/Ideas/Trusses/worktree-cli*
