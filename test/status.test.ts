import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

/**
 * Tests for the status command
 */

const CLI_PATH = resolve(__dirname, '../build/index.js');

interface TestContext {
    testDir: string;
    repoDir: string;
    cleanup: () => Promise<void>;
}

async function createTestRepo(): Promise<TestContext> {
    const testDir = join(tmpdir(), `wt-status-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const repoDir = join(testDir, 'repo');

    await mkdir(repoDir, { recursive: true });
    await execa('git', ['init', '-b', 'main'], { cwd: repoDir });
    await execa('git', ['config', 'user.email', 'test@test.com'], { cwd: repoDir });
    await execa('git', ['config', 'user.name', 'Test User'], { cwd: repoDir });
    await writeFile(join(repoDir, 'README.md'), '# Test\n');
    await execa('git', ['add', '.'], { cwd: repoDir });
    await execa('git', ['commit', '-m', 'Initial'], { cwd: repoDir });

    return {
        testDir,
        repoDir,
        cleanup: async () => {
            try {
                await rm(testDir, { recursive: true, force: true });
            } catch {}
        },
    };
}

async function runCli(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
        const result = await execa('node', [CLI_PATH, ...args], {
            cwd,
            reject: false,
            env: {
                ...process.env,
                WT_EDITOR: 'none',
            },
        });
        return {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode ?? 0,
        };
    } catch (error: any) {
        return {
            stdout: error.stdout ?? '',
            stderr: error.stderr ?? '',
            exitCode: error.exitCode ?? 1,
        };
    }
}

describe('wt status', () => {
    let ctx: TestContext;

    beforeAll(async () => {
        ctx = await createTestRepo();
    });

    afterAll(async () => {
        await ctx.cleanup();
    });

    it('should show status of main worktree', async () => {
        const result = await runCli(['status'], ctx.repoDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Worktree Status:');
        expect(result.stdout).toContain('main');
        expect(result.stdout).toContain('[main]');
        expect(result.stdout).toContain('[clean]');
    });

    it('should detect dirty worktree', async () => {
        // Make the worktree dirty
        await writeFile(join(ctx.repoDir, 'dirty.txt'), 'dirty content');

        const result = await runCli(['status'], ctx.repoDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('[dirty]');

        // Cleanup
        await execa('git', ['checkout', '--', '.'], { cwd: ctx.repoDir }).catch(() => {});
        await rm(join(ctx.repoDir, 'dirty.txt')).catch(() => {});
    });

    it('should show status for multiple worktrees', async () => {
        // Create a test worktree
        const wtPath = join(ctx.testDir, 'test-wt');
        await runCli(['new', 'test-branch', '--path', wtPath, '--editor', 'none', '-c'], ctx.repoDir);

        const result = await runCli(['status'], ctx.repoDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('main');
        expect(result.stdout).toContain('test-branch');

        // Cleanup
        await execa('git', ['worktree', 'remove', '--force', wtPath], { cwd: ctx.repoDir }).catch(() => {});
    });

    it('should show no upstream indicator for branches without upstream', async () => {
        const result = await runCli(['status'], ctx.repoDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('[no upstream]');
    });

    it('should handle detached HEAD state', async () => {
        // Create a detached worktree
        const { stdout: headCommit } = await execa('git', ['rev-parse', 'HEAD'], { cwd: ctx.repoDir });
        const wtPath = join(ctx.testDir, 'detached-wt');
        await execa('git', ['worktree', 'add', '--detach', wtPath, headCommit.trim()], { cwd: ctx.repoDir });

        const result = await runCli(['status'], ctx.repoDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('detached');

        // Cleanup
        await execa('git', ['worktree', 'remove', '--force', wtPath], { cwd: ctx.repoDir }).catch(() => {});
    });

    it('should show locked status', async () => {
        // Create and lock a worktree
        const wtPath = join(ctx.testDir, 'locked-wt');
        await runCli(['new', 'locked-branch', '--path', wtPath, '--editor', 'none', '-c'], ctx.repoDir);
        await execa('git', ['worktree', 'lock', wtPath], { cwd: ctx.repoDir });

        const result = await runCli(['status'], ctx.repoDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('locked-branch');
        expect(result.stdout).toContain('[locked]');

        // Cleanup
        await execa('git', ['worktree', 'unlock', wtPath], { cwd: ctx.repoDir }).catch(() => {});
        await execa('git', ['worktree', 'remove', '--force', wtPath], { cwd: ctx.repoDir }).catch(() => {});
    });
});

