import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { Logger } from './Logger';

const exec = promisify(execCallback);

export class GitManager {
    constructor(
        private workspaceRoot: string,
        private logger: Logger
    ) {}
    
    async initialize(workspaceState: vscode.Memento): Promise<void> {
        const gitDir = path.join(this.workspaceRoot, '.git');
        
        if (!fs.existsSync(gitDir)) {
            await this.run('git init');
            await this.run('git config user.name "AutoBackup"');
            await this.run('git config user.email "autobackup@local"');
            this.logger.log('Initialized version control', 'info');
        }
        
        const hidePrompt = workspaceState.get('hideRemotePrompt', false);
        if (!hidePrompt) {
            await this.checkAndPromptRemote(workspaceState);
        }
    }
    
    private async checkAndPromptRemote(workspaceState: vscode.Memento): Promise<void> {
        try {
            await this.run('git remote get-url origin');
        } catch {
            const choice = await vscode.window.showInformationMessage(
                'To enable cloud backup, connect to a remote repository.',
                'Configure now',
                'Later',
                'Don\'t show again'
            );
            
            if (choice === 'Configure now') {
                await this.configureRemote();
            } else if (choice === 'Don\'t show again') {
                await workspaceState.update('hideRemotePrompt', true);
            }
        }
    }
    
    private async configureRemote(): Promise<void> {
        const url = await vscode.window.showInputBox({
            prompt: 'Enter your remote repository URL',
            placeHolder: 'https://github.com/username/repo.git',
            validateInput: (value: string) => {
                if (!value.startsWith('https://') && !value.startsWith('git@')) {
                    return 'URL must start with https:// or git@';
                }
                return null;
            }
        });
        
        if (!url) {
            return;
        }
        
        try {
            await this.run(`git remote add origin "${url}"`);
            await this.run('git branch -M main');
            
            // Track whether we successfully created a commit
            let commitCreated = false;
            
            try {
                await this.run('git add .');
                await this.run('git commit -m "Initial backup"');
                commitCreated = true;
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                
                // If nothing to commit, create an empty commit
                if (message.includes('nothing to commit') || message.includes('nothing added to commit')) {
                    try {
                        await this.run('git commit --allow-empty -m "Initial commit"');
                        commitCreated = true;
                        this.logger.log('Created empty initial commit', 'info');
                    } catch (emptyCommitError: unknown) {
                        const emptyMessage = emptyCommitError instanceof Error ? emptyCommitError.message : String(emptyCommitError);
                        this.logger.log(`Could not create empty commit: ${emptyMessage}`, 'error');
                    }
                } else {
                    // Re-throw if it's a different error
                    throw error;
                }
            }
            
            // Only push if we successfully created a commit
            if (commitCreated) {
                try {
                    await this.run('git push -u origin main --force');
                    this.logger.log('Cloud backup configured successfully', 'info');
                    vscode.window.showInformationMessage('Cloud backup configured!');
                } catch (pushError: unknown) {
                    const pushMessage = pushError instanceof Error ? pushError.message : String(pushError);
                    this.logger.log(`Remote configured but push failed: ${pushMessage}`, 'warning');
                    vscode.window.showWarningMessage('Remote configured, but initial push failed. Will retry on next save.');
                }
            } else {
                this.logger.log('Remote configured but no initial commit could be created', 'warning');
                vscode.window.showWarningMessage('Remote configured. Initial sync will happen on next save.');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.log(`Could not configure cloud backup: ${message}`, 'error');
            vscode.window.showErrorMessage('Could not connect to remote. Check your URL and authentication.');
        }
    }
    
    async hasChanges(): Promise<boolean> {
        try {
            const output = await this.run('git status --porcelain');
            return output.trim().length > 0;
        } catch (error) {
            return false;
        }
    }
    
    async hasCommitsToSync(): Promise<boolean> {
        try {
            // Check if there are unpushed commits
            await this.run('git fetch origin --dry-run');
            const output = await this.run('git rev-list HEAD...origin/main --count');
            const count = parseInt(output.trim(), 10);
            return count > 0;
        } catch (error) {
            // If fetch fails or branch doesn't exist, try different approach
            try {
                const output = await this.run('git status -sb');
                return output.includes('[ahead');
            } catch {
                return false;
            }
        }
    }
    
    async saveVersion(): Promise<boolean> {
        try {
            await this.run('git add .');
            const timestamp = new Date().toISOString();
            await this.run(`git commit -m "autosave: ${timestamp}"`);
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            if (message.includes('nothing to commit') || message.includes('nothing added to commit')) {
                return false;
            }
            throw error;
        }
    }
    
    async syncToCloud(): Promise<void> {
        await this.run('git push');
    }
    
    async checkOnline(): Promise<void> {
        await this.run('git ls-remote origin', 5000);
    }
    
    private async run(command: string, timeout: number = 30000): Promise<string> {
        try {
            const { stdout, stderr } = await exec(command, {
                cwd: this.workspaceRoot,
                timeout
            });
            
            if (stderr && 
                !stderr.includes('Already up to date') && 
                !stderr.includes('already exists') &&
                !stderr.toLowerCase().includes('warning')) {
                throw new Error(stderr);
            }
            
            return stdout;
        } catch (error: unknown) {
            if (error instanceof Error) {
                const message = error.message.toLowerCase();
                
                if (message.includes('could not read from remote') || 
                    message.includes('could not resolve host')) {
                    throw new Error('Could not reach cloud');
                } else if (message.includes('authentication failed') || 
                           message.includes('permission denied')) {
                    throw new Error('Cloud sync needs authentication');
                } else if (message.includes('not a git repository')) {
                    throw new Error('Version control not initialized');
                }
            }
            throw error;
        }
    }
    
    get workspaceRootPath(): string {
        return this.workspaceRoot;
    }
}
