"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitManager = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const vscode = __importStar(require("vscode"));
const exec = (0, util_1.promisify)(child_process_1.exec);
class GitManager {
    constructor(workspaceRoot, logger) {
        this.workspaceRoot = workspaceRoot;
        this.logger = logger;
    }
    async initialize(workspaceState) {
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
    async checkAndPromptRemote(workspaceState) {
        try {
            await this.run('git remote get-url origin');
        }
        catch {
            const choice = await vscode.window.showInformationMessage('To enable cloud backup, connect to a remote repository.', 'Configure now', 'Later', 'Don\'t show again');
            if (choice === 'Configure now') {
                await this.configureRemote();
            }
            else if (choice === 'Don\'t show again') {
                await workspaceState.update('hideRemotePrompt', true);
            }
        }
    }
    async configureRemote() {
        const url = await vscode.window.showInputBox({
            prompt: 'Enter your remote repository URL',
            placeHolder: 'https://github.com/username/repo.git',
            validateInput: (value) => {
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
            try {
                await this.run('git add .');
                await this.run('git commit -m "Initial backup"');
            }
            catch (error) {
                // Ignore if nothing to commit
            }
            await this.run('git push -u origin main --force');
            this.logger.log('Cloud backup configured successfully', 'info');
            vscode.window.showInformationMessage('Cloud backup configured!');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.log(`Could not configure cloud backup: ${message}`, 'error');
            vscode.window.showErrorMessage('Could not connect to remote. Check your URL and authentication.');
        }
    }
    async hasChanges() {
        try {
            const output = await this.run('git status --porcelain');
            return output.trim().length > 0;
        }
        catch (error) {
            return false;
        }
    }
    async hasCommitsToSync() {
        try {
            const output = await this.run('git log origin/main..HEAD --oneline');
            return output.trim().length > 0;
        }
        catch (error) {
            return false;
        }
    }
    async saveVersion() {
        try {
            await this.run('git add .');
            const timestamp = new Date().toISOString();
            await this.run(`git commit -m "autosave: ${timestamp}"`);
            return true;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (message.includes('nothing to commit') || message.includes('nothing added to commit')) {
                return false;
            }
            throw error;
        }
    }
    async syncToCloud() {
        await this.run('git push');
    }
    async checkOnline() {
        await this.run('git ls-remote origin', 5000);
    }
    async run(command, timeout = 30000) {
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
        }
        catch (error) {
            if (error instanceof Error) {
                const message = error.message.toLowerCase();
                if (message.includes('could not read from remote') ||
                    message.includes('could not resolve host')) {
                    throw new Error('Could not reach cloud');
                }
                else if (message.includes('authentication failed') ||
                    message.includes('permission denied')) {
                    throw new Error('Cloud sync needs authentication');
                }
                else if (message.includes('not a git repository')) {
                    throw new Error('Version control not initialized');
                }
            }
            throw error;
        }
    }
    get workspaceRootPath() {
        return this.workspaceRoot;
    }
}
exports.GitManager = GitManager;
//# sourceMappingURL=GitManager.js.map