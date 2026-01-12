

# COMPLETE PROMPT: VS CODE AUTO BACKUP EXTENSION

You are an expert TypeScript developer specializing in VS Code extensions. Generate production-quality code for a complete VS Code extension with zero placeholders or pseudo-code. Follow these specifications exactly.

## PROJECT OVERVIEW

Build a VS Code extension called **"Auto Backup"** that provides automatic cloud backup with version history, similar to Google Sheets autosave. The extension uses Git internally but **never exposes Git terminology or commands to users**.

**Core Requirements:**

1. Automatic local versioning (every 30 seconds after changes)
2. Automatic cloud sync (every 5 minutes, configurable)
3. Single status bar UI (bottom right)
4. Click status bar → simple menu
5. Works offline, syncs when back online
6. Zero Git terminology in UI
7. Minimal, non-distracting user experience

***

## PROHIBITED TERMINOLOGY

**Never use these words in any user-facing text** (status bar, tooltips, menus, messages, logs shown to user):

- git, Git, GIT
- commit, commits
- branch, branches
- merge, merging
- remote, origin
- repository, repo
- push, pull
- stash, rebase
- clone, fork
- checkout, HEAD

**Instead use:** "backup", "version", "save", "sync", "cloud copy", "history", "restore", "saved point", "cloud storage", "working offline"

***

## 1. STATUS BAR (PRIMARY UI)

Create a single status bar item on the **right side** (alignment: `StatusBarAlignment.Right`, priority: 100).

### States \& Visual Appearance

| State | Icon | Text | Color | Tooltip |
| :-- | :-- | :-- | :-- | :-- |
| Ready | ● | Auto backup: Ready | `#4EC9B0` | "All changes are saved safely." |
| Syncing | ⟳ | Auto backup: Syncing… | `#DCDCAA` | "Saving your latest changes…" |
| Offline | ● | Auto backup: Offline | `#808080` | "Working offline. Changes will sync when you're back online." |
| Error | ⚠ | Auto backup: Problem | `#F48771` | "There was a problem saving. Click for details." |
| Paused | ○ | Auto backup: Paused | `#808080` | "Automatic cloud sync is paused. Click to sync manually." |

### Spinner Behavior

Show the **syncing state with ⟳ spinner** whenever:

- Staging files and saving a local version (add + commit)
- Syncing to cloud (push)
- Running "Sync now" manually

The spinner should be **visible but subtle** - status bar text updates, user can see it's working, but it's non-intrusive.

### Command

Status bar item command: `autoBackup.openMenu`

***

## 2. POPUP MENU (ON STATUS BAR CLICK)

Use `vscode.window.showQuickPick` to display a menu with these exact options:

```
1. Auto sync: ON    (or "Auto sync: OFF" if currently off)
   ────────────
2. View problems and activity
3. Clear activity history
4. Configure ignored items
5. Sync now
   ────────────
6. Open settings
7. About auto backup
```


### Menu Option Behaviors

**1. Auto sync toggle:**

- Toggles `autoBackup.syncMode` between `"auto"` and `"manual"`
- When ON (auto mode):
    - Automatic local versioning + periodic cloud sync both active
    - Status bar shows normal states (Ready/Syncing/Offline/Error)
- When OFF (manual mode):
    - Local versioning still happens
    - Cloud sync does NOT happen automatically
    - Status bar shows "Paused"
    - Only syncs when user clicks "Sync now"

**2. View problems and activity:**

- Opens a new untitled document with contents from the activity log
- Format:

```
[2026-01-11T20:30:15Z] info: Saved a new version.
[2026-01-11T20:35:20Z] info: Synced to cloud successfully.
[2026-01-11T20:40:10Z] warn: Could not reach cloud. Will try again later.
[2026-01-11T20:45:30Z] error: Problem saving version: <reason>
```

- Use plain, human language for all log messages

**3. Clear activity history:**

- Clears in-memory log array
- Clears log file on disk (`.vscode/auto-backup.log`)
- Shows brief success message: "Activity history cleared"

**4. Configure ignored items:**

- Opens VS Code settings UI filtered to `autoBackup.ignorePatterns`
- Command: `vscode.commands.executeCommand('workbench.action.openSettings', 'autoBackup.ignorePatterns')`

**5. Sync now:**

- Immediately performs:
    - Stage all changes (respecting ignore patterns)
    - Save a local version if there are changes
    - Sync to cloud
- Shows syncing spinner in status bar while running
- On success: status returns to Ready
- On error: status shows Problem, logs detailed error

**6. Open settings:**

- Opens VS Code settings UI filtered to this extension
- Command: `vscode.commands.executeCommand('workbench.action.openSettings', 'autoBackup')`

**7. About auto backup:**

- Shows info message:

```
Auto Backup v1.0.0

Automatic cloud backup with version history for your projects.
```


***

## 3. HIDDEN GIT IMPLEMENTATION

Use the local `git` binary via Node's `child_process.exec` (promisified).

### Initial Setup (First Activation)

On extension activation, if workspace folder exists:

1. **Check for .git folder:**

```typescript
const gitDir = path.join(workspaceRoot, '.git');
if (!fs.existsSync(gitDir)) {
    await exec('git init');
    await exec('git config user.name "AutoBackup"');
    await exec('git config user.email "autobackup@local"');
}
```

2. **Check for remote:**

```bash
git remote -v
```

    - If NO remote configured:
        - Show **one-time** info message:

```
"To enable cloud backup, connect to a remote repository."
[Configure now] [Later] [Don't show again]
```

        - If "Configure now":
            - Show input box: "Enter your remote repository URL (e.g., https://github.com/user/repo.git)"
            - Validate URL format (starts with `https://` or `git@`)
            - Run:

```bash
git remote add origin <url>
git branch -M main
git push -u origin main --force
```

            - If push fails (authentication):
                - Log error with message: "Cloud sync needs authentication. Make sure you have access to the remote repository."
                - Don't crash; continue working locally
        - If "Later": dismiss, don't show this session
        - If "Don't show again": store in workspace state (`context.workspaceState.update('hideRemotePrompt', true)`)
3. **If remote exists but push fails:**
    - Catch error gracefully
    - Log: "Could not sync to cloud. Check your connection or authentication."
    - Continue working in offline mode

### Git Operations (All Hidden)

**Local version save:**

```bash
git add .
git commit -m "autosave: 2026-01-11T20:30:15.123Z"
```

**Cloud sync:**

```bash
git push
```

**Get history (for future features):**

```bash
git log --oneline --date=iso -n 20
```

**Error Handling:**

- Wrap all git commands in try-catch
- Convert git errors to plain language:
    - `"nothing to commit"` → Don't log as error, just skip silently
    - `"failed to push"` → "Could not reach cloud. Will try again later."
    - `"fatal: not a git repository"` → Re-initialize
    - Generic errors → "Problem saving. Details: <brief message>"
- Never crash the extension on git errors
- Always log to activity log, update status bar appropriately

***

## 4. FILE WATCHING \& DEBOUNCE

### File Change Detection

Use `vscode.workspace.onDidChangeTextDocument` event:

```typescript
vscode.workspace.onDidChangeTextDocument((event) => {
    // Ignore changes to certain files
    if (shouldIgnore(event.document.uri.fsPath)) return;
    
    // Reset debounce timer
    resetDebounceTimer();
});
```


### Debounce Mechanism

Implement a debounce timer to batch changes:

```typescript
private debounceTimer: NodeJS.Timeout | null = null;
private debounceDelay = 30000; // Default: 30 seconds, read from config

resetDebounceTimer() {
    if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
        this.onVersionNeeded(); // Trigger local version save
    }, this.debounceDelay);
}
```

**Behavior:**

- User edits file A at 0s → timer starts (30s countdown)
- User edits file B at 5s → timer resets (30s countdown from 5s)
- User edits file C at 15s → timer resets (30s countdown from 15s)
- No more edits → at 45s, timer fires → save version

This batches rapid edits into a single version.

***

## 5. AUTOMATIC SYNC TIMERS

### Local Version Timer

- Triggered by debounce timer (file watcher)
- When fired:

1. Set status bar to "Syncing…" with spinner
2. Run: `git add .`
3. Run: `git commit -m "autosave: <ISO timestamp>"`
4. Log: "Saved a new version."
5. Set status bar back to "Ready"
6. If error: log it, set status to "Problem"


### Cloud Sync Timer

Separate interval timer, independent of file changes:

```typescript
private cloudSyncInterval = 300000; // 5 minutes default
private cloudSyncTimer: NodeJS.Timeout;

startCloudSyncTimer() {
    this.cloudSyncTimer = setInterval(async () => {
        if (this.syncMode !== 'auto') return; // Skip in manual mode
        if (!this.isOnline) return; // Skip if offline
        
        await this.syncToCloud();
    }, this.cloudSyncInterval);
}

async syncToCloud() {
    try {
        this.statusBar.setSyncing("Syncing to cloud…");
        await this.git.push();
        this.logger.log("Synced to cloud successfully.", "info");
        this.statusBar.setReady();
    } catch (error) {
        this.logger.log(`Could not reach cloud: ${error.message}`, "warn");
        // Don't show error state for cloud sync failures, just log
        this.statusBar.setReady(); // Or setOffline if network issue
    }
}
```


***

## 6. ONLINE / OFFLINE DETECTION

Implement a periodic check to detect connectivity:

```typescript
private isOnline = true;

startOnlineDetection() {
    setInterval(async () => {
        try {
            // Light check: can we reach the remote?
            await exec('git ls-remote origin', { timeout: 5000 });
            
            if (!this.isOnline) {
                // Just came back online
                this.isOnline = true;
                this.statusBar.setReady("Back online");
                this.logger.log("Connection restored.", "info");
                
                // Try to sync pending versions
                await this.syncToCloud();
            }
        } catch (error) {
            if (this.isOnline) {
                // Just went offline
                this.isOnline = false;
                this.statusBar.setOffline("Working offline");
                this.logger.log("Working offline. Changes will sync when connection is restored.", "warn");
            }
        }
    }, 10000); // Check every 10 seconds
}
```

**Offline Behavior:**

- Local versioning continues normally
- Cloud sync attempts are skipped (not logged as errors)
- Status bar shows "Offline"
- When connection returns: auto-retry sync, update status to "Ready"

***

## 7. CONFIGURATION

Add these settings to `package.json` under `contributes.configuration`:

```json
{
  "autoBackup.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Enable automatic backup and versioning"
  },
  "autoBackup.versionInterval": {
    "type": "number",
    "default": 30000,
    "minimum": 5000,
    "maximum": 300000,
    "description": "Time in milliseconds after last change before saving a version (default: 30 seconds)"
  },
  "autoBackup.cloudInterval": {
    "type": "number",
    "default": 300000,
    "enum": [60000, 300000, 600000, 1800000],
    "enumDescriptions": ["1 minute", "5 minutes", "10 minutes", "30 minutes"],
    "description": "Interval between automatic cloud syncs"
  },
  "autoBackup.syncMode": {
    "type": "string",
    "default": "auto",
    "enum": ["auto", "manual"],
    "enumDescriptions": [
      "Automatic: versions and syncs happen automatically",
      "Manual: versions saved locally, sync only when you click 'Sync now'"
    ],
    "description": "Sync mode"
  },
  "autoBackup.ignorePatterns": {
    "type": "array",
    "default": [
      "node_modules/**",
      ".env",
      ".git/**",
      "*.tmp",
      ".DS_Store",
      "*.log"
    ],
    "description": "File patterns to exclude from backup (glob patterns)",
    "items": { "type": "string" }
  },
  "autoBackup.logLevel": {
    "type": "string",
    "default": "warn",
    "enum": ["debug", "info", "warn", "error"],
    "description": "Activity log detail level"
  }
}
```


### Reading Configuration

```typescript
class ConfigManager {
    private config = vscode.workspace.getConfiguration('autoBackup');
    
    get<T>(key: string): T {
        return this.config.get<T>(key.replace('autoBackup.', ''))!;
    }
    
    async set(key: string, value: any) {
        await this.config.update(
            key.replace('autoBackup.', ''),
            value,
            vscode.ConfigurationTarget.Workspace
        );
    }
    
    async toggle(key: string) {
        const current = this.get<boolean>(key);
        await this.set(key, !current);
    }
    
    // Listen for config changes
    onDidChange(callback: () => void) {
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('autoBackup')) {
                callback();
            }
        });
    }
}
```


***

## 8. CODE STRUCTURE

Organize code into these files:

### src/extension.ts (Entry Point)

```typescript
import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('Auto Backup requires an open folder');
        return;
    }
    
    // Initialize components
    const logger = new Logger(workspaceRoot);
    const config = new ConfigManager();
    const statusBar = new StatusBarManager();
    const git = new GitManager(workspaceRoot, logger);
    const autoBackup = new AutoBackupManager(git, statusBar, logger, config);
    const menu = new MenuManager(autoBackup, logger, config);
    
    // Setup
    await git.initialize(context.workspaceState);
    await autoBackup.start();
    
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('autoBackup.openMenu', () => 
            menu.show()
        )
    );
    
    logger.log('Auto Backup activated', 'info');
}

export function deactivate() {
    // Cleanup timers
}
```


### src/StatusBarManager.ts

```typescript
export class StatusBarManager {
    private item: vscode.StatusBarItem;
    
    constructor() {
        this.item = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.item.command = 'autoBackup.openMenu';
        this.setReady();
        this.item.show();
    }
    
    setReady(message?: string) {
        this.item.text = '● Auto backup: Ready';
        this.item.color = '#4EC9B0';
        this.item.tooltip = message || 'All changes are saved safely.';
    }
    
    setSyncing(message?: string) {
        this.item.text = '⟳ Auto backup: Syncing…';
        this.item.color = '#DCDCAA';
        this.item.tooltip = message || 'Saving your latest changes…';
    }
    
    setOffline(message?: string) {
        this.item.text = '● Auto backup: Offline';
        this.item.color = '#808080';
        this.item.tooltip = message || 'Working offline. Changes will sync when you\'re back online.';
    }
    
    setError(message?: string) {
        this.item.text = '⚠ Auto backup: Problem';
        this.item.color = '#F48771';
        this.item.tooltip = message || 'There was a problem saving. Click for details.';
    }
    
    setPaused(message?: string) {
        this.item.text = '○ Auto backup: Paused';
        this.item.color = '#808080';
        this.item.tooltip = message || 'Automatic cloud sync is paused. Click to sync manually.';
    }
    
    dispose() {
        this.item.dispose();
    }
}
```


### src/GitManager.ts

```typescript
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const exec = promisify(execCallback);

export class GitManager {
    constructor(
        private workspaceRoot: string,
        private logger: Logger
    ) {}
    
    async initialize(workspaceState: vscode.Memento) {
        const gitDir = path.join(this.workspaceRoot, '.git');
        
        if (!fs.existsSync(gitDir)) {
            await this.run('git init');
            await this.run('git config user.name "AutoBackup"');
            await this.run('git config user.email "autobackup@local"');
            this.logger.log('Initialized version control', 'info');
        }
        
        // Check for remote
        const hidePrompt = workspaceState.get('hideRemotePrompt', false);
        if (!hidePrompt) {
            await this.checkAndPromptRemote(workspaceState);
        }
    }
    
    private async checkAndPromptRemote(workspaceState: vscode.Memento) {
        try {
            await this.run('git remote get-url origin');
            // Remote exists
        } catch {
            // No remote configured
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
    
    private async configureRemote() {
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
        
        if (!url) return;
        
        try {
            await this.run(`git remote add origin ${url}`);
            await this.run('git branch -M main');
            await this.run('git push -u origin main --force');
            this.logger.log('Cloud backup configured successfully', 'info');
            vscode.window.showInformationMessage('Cloud backup configured!');
        } catch (error) {
            this.logger.log(`Could not configure cloud backup: ${error}`, 'error');
            vscode.window.showErrorMessage('Could not connect to remote. Check your URL and authentication.');
        }
    }
    
    async saveVersion(): Promise<boolean> {
        try {
            await this.run('git add .');
            const timestamp = new Date().toISOString();
            await this.run(`git commit -m "autosave: ${timestamp}"`);
            return true;
        } catch (error: any) {
            if (error.message?.includes('nothing to commit')) {
                // Not an error, just no changes
                return false;
            }
            throw error;
        }
    }
    
    async syncToCloud(): Promise<void> {
        await this.run('git push');
    }
    
    private async run(command: string): Promise<string> {
        const { stdout, stderr } = await exec(command, {
            cwd: this.workspaceRoot,
            timeout: 30000
        });
        
        if (stderr && !stderr.includes('Already up to date')) {
            throw new Error(stderr);
        }
        
        return stdout;
    }
}
```


### src/AutoBackupManager.ts

```typescript
export class AutoBackupManager {
    private versionDebounceTimer: NodeJS.Timeout | null = null;
    private cloudSyncTimer: NodeJS.Timeout | null = null;
    private onlineCheckTimer: NodeJS.Timeout | null = null;
    private isOnline = true;
    
    constructor(
        private git: GitManager,
        private statusBar: StatusBarManager,
        private logger: Logger,
        private config: ConfigManager
    ) {}
    
    async start() {
        // Start file watcher
        this.startFileWatcher();
        
        // Start cloud sync timer
        this.startCloudSyncTimer();
        
        // Start online detection
        this.startOnlineDetection();
        
        // Listen for config changes
        this.config.onDidChange(() => this.restart());
        
        // Update status based on mode
        this.updateStatus();
    }
    
    private startFileWatcher() {
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (this.shouldIgnore(event.document.uri.fsPath)) return;
            
            this.resetVersionDebounce();
        });
    }
    
    private resetVersionDebounce() {
        if (this.versionDebounceTimer) {
            clearTimeout(this.versionDebounceTimer);
        }
        
        const interval = this.config.get<number>('autoBackup.versionInterval');
        
        this.versionDebounceTimer = setTimeout(async () => {
            await this.saveVersion();
        }, interval);
    }
    
    private async saveVersion() {
        try {
            this.statusBar.setSyncing('Saving version…');
            
            const saved = await this.git.saveVersion();
            
            if (saved) {
                this.logger.log('Saved a new version.', 'info');
            }
            
            this.updateStatus();
        } catch (error: any) {
            this.logger.log(`Problem saving version: ${error.message}`, 'error');
            this.statusBar.setError(error.message);
        }
    }
    
    private startCloudSyncTimer() {
        const interval = this.config.get<number>('autoBackup.cloudInterval');
        
        this.cloudSyncTimer = setInterval(async () => {
            const mode = this.config.get<string>('autoBackup.syncMode');
            if (mode !== 'auto') return;
            if (!this.isOnline) return;
            
            await this.syncToCloud();
        }, interval);
    }
    
    async syncToCloud() {
        try {
            this.statusBar.setSyncing('Syncing to cloud…');
            
            await this.git.syncToCloud();
            
            this.logger.log('Synced to cloud successfully.', 'info');
            this.updateStatus();
        } catch (error: any) {
            this.logger.log(`Could not reach cloud: ${error.message}`, 'warn');
            this.updateStatus();
        }
    }
    
    private startOnlineDetection() {
        this.onlineCheckTimer = setInterval(async () => {
            try {
                await this.git.checkOnline();
                
                if (!this.isOnline) {
                    this.isOnline = true;
                    this.logger.log('Connection restored.', 'info');
                    await this.syncToCloud();
                }
            } catch {
                if (this.isOnline) {
                    this.isOnline = false;
                    this.logger.log('Working offline. Changes will sync when connection is restored.', 'warn');
                }
            }
        }, 10000);
    }
    
    private updateStatus() {
        const mode = this.config.get<string>('autoBackup.syncMode');
        
        if (mode === 'manual') {
            this.statusBar.setPaused();
        } else if (!this.isOnline) {
            this.statusBar.setOffline();
        } else {
            this.statusBar.setReady();
        }
    }
    
    private shouldIgnore(filePath: string): boolean {
        const patterns = this.config.get<string[]>('autoBackup.ignorePatterns');
        const relative = path.relative(this.git.workspaceRoot, filePath);
        
        return patterns.some(pattern => {
            // Simple glob matching (you can use 'minimatch' library for better matching)
            return relative.includes(pattern.replace('**', '').replace('*', ''));
        });
    }
    
    private restart() {
        // Clear existing timers
        if (this.versionDebounceTimer) clearTimeout(this.versionDebounceTimer);
        if (this.cloudSyncTimer) clearInterval(this.cloudSyncTimer);
        
        // Restart with new config
        this.startCloudSyncTimer();
        this.updateStatus();
    }
    
    async forceSyncNow() {
        await this.saveVersion();
        await this.syncToCloud();
    }
}
```


### src/Logger.ts

```typescript
import * as fs from 'fs';
import * as path from 'path';

export class Logger {
    private logs: Array<{ timestamp: string; level: string; message: string }> = [];
    private logFile: string;
    
    constructor(workspaceRoot: string) {
        const vscodeDir = path.join(workspaceRoot, '.vscode');
        if (!fs.existsSync(vscodeDir)) {
            fs.mkdirSync(vscodeDir, { recursive: true });
        }
        this.logFile = path.join(vscodeDir, 'auto-backup.log');
    }
    
    log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
        const timestamp = new Date().toISOString();
        const entry = { timestamp, level, message };
        
        this.logs.push(entry);
        
        // Persist to file
        const line = `[${timestamp}] ${level}: ${message}\n`;
        fs.appendFileSync(this.logFile, line);
    }
    
    async show() {
        const content = this.logs
            .map(l => `[${l.timestamp}] ${l.level}: ${l.message}`)
            .join('\n');
        
        const doc = await vscode.workspace.openTextDocument({
            language: 'log',
            content: content || 'No activity yet.'
        });
        
        await vscode.window.showTextDocument(doc);
    }
    
    clear() {
        this.logs = [];
        fs.writeFileSync(this.logFile, '');
    }
}
```


### src/MenuManager.ts

```typescript
export class MenuManager {
    constructor(
        private autoBackup: AutoBackupManager,
        private logger: Logger,
        private config: ConfigManager
    ) {}
    
    async show() {
        const mode = this.config.get<string>('autoBackup.syncMode');
        const isAuto = mode === 'auto';
        
        const items = [
            {
                label: isAuto ? '$(check) Auto sync: ON' : '○ Auto sync: OFF',
                id: 'toggle'
            },
            { label: '────────────', id: 'sep1' },
            { label: '$(eye) View problems and activity', id: 'logs' },
            { label: '$(trash) Clear activity history', id: 'clear' },
            { label: '$(settings-gear) Configure ignored items', id: 'ignore' },
            { label: '$(sync) Sync now', id: 'sync' },
            { label: '────────────', id: 'sep2' },
            { label: '$(gear) Open settings', id: 'settings' },
            { label: '$(info) About auto backup', id: 'about' }
        ];
        
        const choice = await vscode.window.showQuickPick(items, {
            placeHolder: 'Auto Backup'
        });
        
        if (!choice) return;
        
        switch (choice.id) {
            case 'toggle':
                await this.config.set('autoBackup.syncMode', isAuto ? 'manual' : 'auto');
                break;
            case 'logs':
                await this.logger.show();
                break;
            case 'clear':
                this.logger.clear();
                vscode.window.showInformationMessage('Activity history cleared');
                break;
            case 'ignore':
                vscode.commands.executeCommand('workbench.action.openSettings', 'autoBackup.ignorePatterns');
                break;
            case 'sync':
                await vscode.window.withProgress(
                    { location: vscode.ProgressLocation.Notification, title: 'Syncing…' },
                    async () => await this.autoBackup.forceSyncNow()
                );
                break;
            case 'settings':
                vscode.commands.executeCommand('workbench.action.openSettings', 'autoBackup');
                break;
            case 'about':
                vscode.window.showInformationMessage(
                    'Auto Backup v1.0.0\n\nAutomatic cloud backup with version history for your projects.'
                );
                break;
        }
    }
}
```


***

## 9. PACKAGE.JSON

Generate a complete `package.json`:

```json
{
  "name": "auto-backup",
  "displayName": "Auto Backup",
  "description": "Automatic cloud backup with version history. Works like Google Sheets autosave.",
  "version": "1.0.0",
  "publisher": "your-publisher-name",
  "repository": "https://github.com/your-username/vscode-auto-backup",
  "engines": {
    "vscode": "^1.75.0"
  },
  "categories": ["Other"],
  "activationEvents": ["onStartupFinished"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "autoBackup.openMenu",
        "title": "Auto Backup: Open Menu"
      }
    ],
    "configuration": {
      "title": "Auto Backup",
      "properties": {
        "autoBackup.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable automatic backup and versioning"
        },
        "autoBackup.versionInterval": {
          "type": "number",
          "default": 30000,
          "minimum": 5000,
          "maximum": 300000,
          "description": "Time in milliseconds after last change before saving a version (default: 30 seconds)"
        },
        "autoBackup.cloudInterval": {
          "type": "number",
          "default": 300000,
          "enum": [60000, 300000, 600000, 1800000],
          "enumDescriptions": ["1 minute", "5 minutes", "10 minutes", "30 minutes"],
          "description": "Interval between automatic cloud syncs"
        },
        "autoBackup.syncMode": {
          "type": "string",
          "default": "auto",
          "enum": ["auto", "manual"],
          "enumDescriptions": [
            "Automatic: versions and syncs happen automatically",
            "Manual: versions saved locally, sync only when you click 'Sync now'"
          ],
          "description": "Sync mode"
        },
        "autoBackup.ignorePatterns": {
          "type": "array",
          "default": [
            "node_modules/**",
            ".env",
            ".git/**",
            "*.tmp",
            ".DS_Store",
            "*.log"
          ],
          "description": "File patterns to exclude from backup (glob patterns)",
          "items": { "type": "string" }
        },
        "autoBackup.logLevel": {
          "type": "string",
          "default": "warn",
          "enum": ["debug", "info", "warn", "error"],
          "description": "Activity log detail level"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "lint": "eslint src --ext ts"
  },
  "devDependencies": {
    "@types/vscode": "^1.75.0",
    "@types/node": "18.x",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.40.0",
    "typescript": "^5.1.0"
  },
  "dependencies": {}
}
```


***

## 10. ADDITIONAL REQUIREMENTS

### Error Handling Principles

1. **Never crash the extension** - wrap all async operations in try-catch
2. **Convert git errors to human language**:
    - "nothing to commit" → silently skip
    - "could not read from remote" → "Could not reach cloud"
    - "authentication failed" → "Cloud sync needs authentication"
3. **Log all errors** to activity log with timestamp
4. **Show critical errors** in status bar (Error state)
5. **Transient errors** should not block operation - log and continue

### Performance

- Debounce file changes (don't trigger on every keystroke)
- Use `exec` with timeout (30s max per git command)
- Don't block the UI thread
- Cloud sync failures should not stop local versioning


### Missing Method: GitManager.checkOnline()

Add this method to GitManager:

```typescript
async checkOnline(): Promise<void> {
    await this.run('git ls-remote origin', { timeout: 5000 });
}
```


***

## 11. DELIVERABLES

Generate these files in order:

1. `package.json` (complete, valid)
2. `tsconfig.json` (standard VS Code extension config)
3. `src/extension.ts`
4. `src/StatusBarManager.ts`
5. `src/GitManager.ts`
6. `src/AutoBackupManager.ts`
7. `src/Logger.ts`
8. `src/MenuManager.ts`
9. `src/ConfigManager.ts`
10. `README.md` (brief user-facing instructions)

### Code Quality Requirements

- Full TypeScript types (no `any` unless absolutely necessary)
- Proper async/await error handling
- Clean class separation
- Minimal comments (code should be self-documenting)
- No placeholder methods - implement everything


### Testing Instructions in README

Include:

1. How to install dependencies (`npm install`)
2. How to compile (`npm run compile`)
3. How to run in debug (F5 in VS Code)
4. How to configure a remote repository
5. What the status bar states mean

***

## 12. CRITICAL REMINDERS

✓ **Use plain language everywhere** - no Git terminology in UI
✓ **Show spinner when saving or syncing** - status bar updates
✓ **Handle offline gracefully** - queue, retry when back online
✓ **Local-first** - never lose data even if cloud fails
✓ **Single status bar UI** - no extra panels or views
✓ **One-click menu** - all options in Quick Pick
✓ **Silent operation** - minimal interruption to user workflow
✓ **Complete implementation** - no TODOs or placeholders

***

Generate the complete, production-ready code now.

