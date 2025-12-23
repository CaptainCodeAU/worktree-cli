import { execa } from "execa";
import chalk from "chalk";
import { getWorktrees, WorktreeInfo, isWorktreeClean } from "../utils/git.js";

/**
 * Get detailed git status for a worktree
 */
async function getWorktreeGitStatus(path: string): Promise<{
    clean: boolean;
    ahead: number;
    behind: number;
    hasUpstream: boolean;
}> {
    try {
        // Check if worktree is clean
        const clean = await isWorktreeClean(path);

        // Get ahead/behind information
        let ahead = 0;
        let behind = 0;
        let hasUpstream = false;

        try {
            // Check if branch has an upstream
            const { stdout: upstreamBranch } = await execa(
                "git",
                ["-C", path, "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"],
                { reject: false }
            );

            if (upstreamBranch && upstreamBranch.trim()) {
                hasUpstream = true;

                // Get ahead/behind counts
                const { stdout: revList } = await execa(
                    "git",
                    ["-C", path, "rev-list", "--left-right", "--count", "HEAD...@{upstream}"],
                    { reject: false }
                );

                if (revList && revList.trim()) {
                    const [aheadStr, behindStr] = revList.trim().split(/\s+/);
                    ahead = parseInt(aheadStr, 10) || 0;
                    behind = parseInt(behindStr, 10) || 0;
                }
            }
        } catch {
            // No upstream or error getting upstream info
        }

        return { clean, ahead, behind, hasUpstream };
    } catch (error) {
        // If we can't get status, return defaults
        return { clean: false, ahead: 0, behind: 0, hasUpstream: false };
    }
}

/**
 * Format worktree status for display
 */
function formatWorktreeStatus(wt: WorktreeInfo, status: {
    clean: boolean;
    ahead: number;
    behind: number;
    hasUpstream: boolean;
}): string {
    const parts: string[] = [];

    // Branch name or detached state
    if (wt.branch) {
        parts.push(chalk.cyan.bold(wt.branch));
    } else if (wt.detached) {
        parts.push(chalk.yellow(`(detached at ${wt.head.substring(0, 7)})`));
    } else if (wt.bare) {
        parts.push(chalk.gray('(bare)'));
    }

    // Path
    parts.push(chalk.gray(` → ${wt.path}`));

    // Status indicators
    const indicators: string[] = [];

    // Main worktree
    if (wt.isMain) {
        indicators.push(chalk.blue('[main]'));
    }

    // Git status
    if (status.clean) {
        indicators.push(chalk.green('[clean]'));
    } else {
        indicators.push(chalk.red('[dirty]'));
    }

    // Ahead/behind
    if (status.hasUpstream) {
        if (status.ahead > 0 && status.behind > 0) {
            indicators.push(chalk.yellow(`[↑${status.ahead} ↓${status.behind}]`));
        } else if (status.ahead > 0) {
            indicators.push(chalk.yellow(`[↑${status.ahead}]`));
        } else if (status.behind > 0) {
            indicators.push(chalk.yellow(`[↓${status.behind}]`));
        } else {
            indicators.push(chalk.green('[up-to-date]'));
        }
    } else {
        indicators.push(chalk.gray('[no upstream]'));
    }

    // Locked/prunable
    if (wt.locked) {
        indicators.push(chalk.red('[locked]'));
    }
    if (wt.prunable) {
        indicators.push(chalk.yellow('[prunable]'));
    }

    if (indicators.length > 0) {
        parts.push(' ' + indicators.join(' '));
    }

    return parts.join('');
}

/**
 * Handler for the status command
 */
export async function statusWorktreesHandler() {
    try {
        // Confirm we're in a git repo
        await execa("git", ["rev-parse", "--is-inside-work-tree"]);

        // Get all worktrees
        const worktrees = await getWorktrees();

        if (worktrees.length === 0) {
            console.log(chalk.yellow("No worktrees found."));
            return;
        }

        console.log(chalk.blue.bold("Worktree Status:\n"));

        // Process each worktree
        for (const wt of worktrees) {
            try {
                const status = await getWorktreeGitStatus(wt.path);
                console.log(formatWorktreeStatus(wt, status));
            } catch (error) {
                // If we can't get status for this worktree, show it with an error indicator
                console.log(
                    chalk.cyan.bold(wt.branch || '(unknown)') +
                    chalk.gray(` → ${wt.path}`) +
                    ' ' + chalk.red('[error: cannot read status]')
                );
            }
        }

        console.log(); // Empty line at the end

    } catch (error) {
        if (error instanceof Error) {
            console.error(chalk.red("Error getting worktree status:"), error.message);
        } else {
            console.error(chalk.red("Error getting worktree status:"), error);
        }
        process.exit(1);
    }
}

