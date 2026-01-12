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
exports.AutoBackupManager = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const minimatch_1 = require("minimatch");
class AutoBackupManager {
    constructor(git, statusBar, logger, config) {
        this.git = git;
        this.statusBar = statusBar;
        this.logger = logger;
        this.config = config;
        this.versionDebounceTimer = null;
        this.cloudSyncTimer = null;
        this.onlineCheckTimer = null;
        this.isOnline = true;
        this.fileWatcherDisposable = null;
        this.fileSystemWatcher = null;
        this.configChangeDisposable = null;
    }
    async start() {
        const enabled = this.config.get('autoBackup.enabled');
        if (!enabled) {
            this.statusBar.setPaused('Auto backup is disabled');
            return;
        }
        const logLevel = this.config.get('autoBackup.logLevel');
        this.logger.setLevel(logLevel);
        this.startFileWatcher();
        this.startCloudSyncTimer();
        this.startOnlineDetection();
        this.configChangeDisposable = this.config.onDidChange(() => this.restart());
        this.updateStatus();
    }
    startFileWatcher() {
        // Watch text document changes
        this.fileWatcherDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
            if (this.shouldIgnore(event.document.uri.fsPath)) {
                return;
            }
            if (event.document.uri.scheme !== 'file') {
                return;
            }
            this.resetVersionDebounce();
        });
        // Watch ALL file changes (including binary files)
        const pattern = new vscode.RelativePattern(this.git.workspaceRootPath, '**/*');
        this.fileSystemWatcher = vscode.workspace.createFileSystemWatcher(pattern);
        // Watch for file creation, changes, and deletion
        this.fileSystemWatcher.onDidCreate((uri) => {
            if (!this.shouldIgnore(uri.fsPath)) {
                this.resetVersionDebounce();
            }
        });
        this.fileSystemWatcher.onDidChange((uri) => {
            if (!this.shouldIgnore(uri.fsPath)) {
                this.resetVersionDebounce();
            }
        });
        this.fileSystemWatcher.onDidDelete((uri) => {
            if (!this.shouldIgnore(uri.fsPath)) {
                this.resetVersionDebounce();
            }
        });
    }
    resetVersionDebounce() {
        if (this.versionDebounceTimer) {
            clearTimeout(this.versionDebounceTimer);
        }
        const interval = this.config.get('autoBackup.versionInterval');
        this.versionDebounceTimer = setTimeout(async () => {
            await this.saveVersion();
        }, interval);
    }
    async saveVersion() {
        try {
            // Check if there are actual changes before attempting to save
            const hasChanges = await this.git.hasChanges();
            if (!hasChanges) {
                return; // No changes, skip saving
            }
            this.statusBar.setSyncing('Saving version…');
            const saved = await this.git.saveVersion();
            if (saved) {
                this.logger.log('Saved a new version.', 'info');
            }
            this.updateStatus();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.log(`Problem saving version: ${message}`, 'error');
            this.statusBar.setError(message);
        }
    }
    startCloudSyncTimer() {
        if (this.cloudSyncTimer) {
            clearInterval(this.cloudSyncTimer);
        }
        const interval = this.config.get('autoBackup.cloudInterval');
        this.cloudSyncTimer = setInterval(async () => {
            const mode = this.config.get('autoBackup.syncMode');
            if (mode !== 'auto') {
                return;
            }
            if (!this.isOnline) {
                return;
            }
            await this.syncToCloud();
        }, interval);
    }
    async syncToCloud() {
        try {
            // Check if there are changes to sync
            const hasChanges = await this.git.hasChanges();
            if (!hasChanges) {
                const hasCommitsToSync = await this.git.hasCommitsToSync();
                if (!hasCommitsToSync) {
                    return; // Nothing to sync
                }
            }
            this.statusBar.setSyncing('Syncing to cloud…');
            await this.git.syncToCloud();
            this.logger.log('Synced to cloud successfully.', 'info');
            this.updateStatus();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            // Only log if it's not the "already up to date" message
            if (!message.includes('Everything up-to-date')) {
                this.logger.log(`Could not reach cloud: ${message}`, 'warn');
            }
            this.updateStatus();
        }
    }
    startOnlineDetection() {
        if (this.onlineCheckTimer) {
            clearInterval(this.onlineCheckTimer);
        }
        this.onlineCheckTimer = setInterval(async () => {
            try {
                await this.git.checkOnline();
                if (!this.isOnline) {
                    this.isOnline = true;
                    this.logger.log('Connection restored.', 'info');
                    this.updateStatus();
                    await this.syncToCloud();
                }
            }
            catch {
                if (this.isOnline) {
                    this.isOnline = false;
                    this.logger.log('Working offline. Changes will sync when connection is restored.', 'warn');
                    this.updateStatus();
                }
            }
        }, 10000);
    }
    updateStatus() {
        const mode = this.config.get('autoBackup.syncMode');
        if (mode === 'manual') {
            this.statusBar.setPaused();
        }
        else if (!this.isOnline) {
            this.statusBar.setOffline();
        }
        else {
            this.statusBar.setReady();
        }
    }
    shouldIgnore(filePath) {
        const patterns = this.config.get('autoBackup.ignorePatterns');
        const relative = path.relative(this.git.workspaceRootPath, filePath);
        return patterns.some(pattern => {
            return (0, minimatch_1.minimatch)(relative, pattern, { dot: true });
        });
    }
    restart() {
        if (this.versionDebounceTimer) {
            clearTimeout(this.versionDebounceTimer);
        }
        if (this.cloudSyncTimer) {
            clearInterval(this.cloudSyncTimer);
        }
        if (this.onlineCheckTimer) {
            clearInterval(this.onlineCheckTimer);
        }
        const enabled = this.config.get('autoBackup.enabled');
        if (!enabled) {
            this.statusBar.setPaused('Auto backup is disabled');
            return;
        }
        const logLevel = this.config.get('autoBackup.logLevel');
        this.logger.setLevel(logLevel);
        this.startCloudSyncTimer();
        this.startOnlineDetection();
        this.updateStatus();
    }
    async forceSyncNow() {
        await this.saveVersion();
        await this.syncToCloud();
    }
    dispose() {
        if (this.versionDebounceTimer) {
            clearTimeout(this.versionDebounceTimer);
        }
        if (this.cloudSyncTimer) {
            clearInterval(this.cloudSyncTimer);
        }
        if (this.onlineCheckTimer) {
            clearInterval(this.onlineCheckTimer);
        }
        if (this.fileWatcherDisposable) {
            this.fileWatcherDisposable.dispose();
        }
        if (this.fileSystemWatcher) {
            this.fileSystemWatcher.dispose();
        }
        if (this.configChangeDisposable) {
            this.configChangeDisposable.dispose();
        }
    }
}
exports.AutoBackupManager = AutoBackupManager;
//# sourceMappingURL=AutoBackupManager.js.map