# Worktree Management

You have access to the `wt` CLI tool for managing git worktrees.

## Common Commands

- `wt new <branch> -c` — Create new worktree (create branch if needed)
- `wt setup <branch> -c` — Create worktree + run setup scripts
- `wt status` — Show status of all worktrees (clean/dirty, ahead/behind)
- `wt list` — List all worktrees
- `wt remove <branch>` — Remove a worktree
- `wt merge <branch> --auto-commit --remove` — Merge and cleanup
- `wt pr <number> --setup` — Create worktree from PR/MR

## Workflow for Parallel Tasks

When asked to work on multiple tasks in parallel:

1. Create a worktree for each task: `wt setup feature/<task-name> -c`
2. Note the paths returned
3. Work in each worktree directory independently
4. Check status: `wt status`
5. When complete, merge back: `wt merge feature/<task-name> --auto-commit`

## Configuration

This project has trust mode enabled (no confirmation prompts) and uses subfolder organization for worktrees.

**User Request:** $ARGUMENTS

