import { join, dirname, basename, resolve } from "node:path";
import { getDefaultWorktreePath, getWorktreeSubfolder } from "../config.js";
import { getRepoName } from "./git.js";
/**
 * Resolve a worktree name from a branch name
 *
 * Standardizes on replacing '/' with '-' to ensure uniqueness
 * and prevent local collisions.
 *
 * Examples:
 * - "feature/auth" -> "feature-auth"
 * - "hotfix/auth" -> "hotfix-auth"
 * - "main" -> "main"
 *
 * @param branchName - The branch name to sanitize
 * @returns Sanitized name suitable for directory names
 */
export function resolveWorktreeName(branchName) {
    // Replace forward slashes with dashes
    // This ensures uniqueness: feature/auth and hotfix/auth become feature-auth and hotfix-auth
    return branchName.replace(/\//g, '-');
}
/**
 * Get the short branch name (last segment)
 *
 * Use this only when you specifically need the last segment.
 * For worktree directory names, prefer resolveWorktreeName().
 *
 * @param branchName - The branch name
 * @returns Last segment of the branch name
 */
export function getShortBranchName(branchName) {
    const parts = branchName.split('/').filter(part => part.length > 0);
    return parts.pop() || branchName;
}
/**
 * Resolve the full path for a new worktree
 *
 * Handles four cases:
 * 1. Custom path provided - use it directly
 * 2. Global defaultWorktreePath configured - use it with repo namespace
 * 3. Subfolder mode enabled - create in my-app-worktrees/feature pattern
 * 4. No config - create sibling directory (my-app-feature)
 *
 * @param branchName - The branch name to create worktree for
 * @param options - Configuration options
 * @returns Absolute path for the worktree
 */
export async function resolveWorktreePath(branchName, options = {}) {
    const { customPath, cwd = process.cwd(), useRepoNamespace = true, } = options;
    // Case 1: Custom path provided - use it directly
    if (customPath) {
        return resolve(customPath);
    }
    // Get the sanitized worktree name
    const worktreeName = resolveWorktreeName(branchName);
    // Check for configured default worktree path
    const defaultWorktreePath = getDefaultWorktreePath();
    if (defaultWorktreePath) {
        // Case 2: Global worktree path configured
        if (useRepoNamespace) {
            // Namespace by repo name to prevent cross-repo collisions
            const repoName = await getRepoName(cwd);
            return join(defaultWorktreePath, repoName, worktreeName);
        }
        return join(defaultWorktreePath, worktreeName);
    }
    // Check if subfolder mode is enabled
    const useSubfolder = getWorktreeSubfolder();
    const parentDir = dirname(cwd);
    const currentDirName = basename(cwd);
    if (useSubfolder) {
        // Case 3: Subfolder mode - create in my-app-worktrees/feature pattern
        // This keeps worktrees organized in a dedicated folder
        return join(parentDir, `${currentDirName}-worktrees`, worktreeName);
    }
    // Case 4: No config - create sibling directory (my-app-feature)
    return join(parentDir, `${currentDirName}-${worktreeName}`);
}
/**
 * Validate a branch name for worktree creation
 *
 * @param branchName - The branch name to validate
 * @returns Object with isValid and optional error message
 */
export function validateBranchName(branchName) {
    if (!branchName || branchName.trim() === '') {
        return { isValid: false, error: 'Branch name cannot be empty' };
    }
    // Check for invalid git branch name characters
    const invalidChars = /[\s~^:?*\[\]\\]/;
    if (invalidChars.test(branchName)) {
        return { isValid: false, error: 'Branch name contains invalid characters' };
    }
    // Check for double dots
    if (branchName.includes('..')) {
        return { isValid: false, error: 'Branch name cannot contain ".."' };
    }
    // Check for ending with .lock
    if (branchName.endsWith('.lock')) {
        return { isValid: false, error: 'Branch name cannot end with ".lock"' };
    }
    return { isValid: true };
}
