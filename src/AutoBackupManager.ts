import * as vscode from 'vscode';
import * as path from 'path';
import { minimatch } from 'minimatch';
import { GitManager } from './GitManager';
import { StatusBarManager } from './StatusBarManager';
import { Logger } from './Logger';
import { ConfigManager } from './ConfigManager';

export class AutoBackupManager {
    private versionDebounceTimer: NodeJS.Timeout | null = null;
    private cloudSyncTimer: NodeJS.Timeout | null = null;
    private onlineCheckTimer: NodeJS.Timeout | null = null;
    private isOnline = true;
    private fileWatcherDisposable: vscode.Disposable | null = null;
    private configChangeDisposable: vscode.Disposable | null = null;
    
    constructor(
        private git: GitManager,
        private statusBar: StatusBarManager,
        private logger: Logger,
        private config: ConfigManager
    ) {}
    
    async start(): Promise<void> {
        const enabled = this.config.get<boolean>('autoBackup.enabled');
        if (!enabled) {
            this.statusBar.setPaused('Auto backup is disabled');
            return;
        }
        
        const logLevel = this.config.get<string>('autoBackup.logLevel') as 'debug' | 'info' | 'warn' | 'error';
        this.logger.setLevel(logLevel);
        
        this.startFileWatcher();
        this.startCloudSyncTimer();
        this.startOnlineDetection();
        
        this.configChangeDisposable = this.config.onDidChange(() => this.restart());
        
        this.updateStatus();
    }
    
    private startFileWatcher(): void {
        this.fileWatcherDisposable = vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
            if (this.shouldIgnore(event.document.uri.fsPath)) {
                return;
            }
            
            if (event.document.uri.scheme !== 'file') {
                return;
            }
            
            this.resetVersionDebounce();
        });
    }
    
    private resetVersionDebounce(): void {
        if (this.versionDebounceTimer) {
            clearTimeout(this.versionDebounceTimer);
        }
        
        const interval = this.config.get<number>('autoBackup.versionInterval');
        
        this.versionDebounceTimer = setTimeout(async () => {
            await this.saveVersion();
        }, interval);
    }
    
    private async saveVersion(): Promise<void> {
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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.log(`Problem saving version: ${message}`, 'error');
            this.statusBar.setError(message);
        }
    }
    
    private startCloudSyncTimer(): void {
        if (this.cloudSyncTimer) {
            clearInterval(this.cloudSyncTimer);
        }
        
        const interval = this.config.get<number>('autoBackup.cloudInterval');
        
        this.cloudSyncTimer = setInterval(async () => {
            const mode = this.config.get<string>('autoBackup.syncMode');
            if (mode !== 'auto') {
                return;
            }
            if (!this.isOnline) {
                return;
            }
            
            await this.syncToCloud();
        }, interval);
    }
    
    async syncToCloud(): Promise<void> {
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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            // Only log if it's not the "already up to date" message
            if (!message.includes('Everything up-to-date')) {
                this.logger.log(`Could not reach cloud: ${message}`, 'warn');
            }
            this.updateStatus();
        }
    }
    
    private startOnlineDetection(): void {
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
            } catch {
                if (this.isOnline) {
                    this.isOnline = false;
                    this.logger.log('Working offline. Changes will sync when connection is restored.', 'warn');
                    this.updateStatus();
                }
            }
        }, 10000);
    }
    
    private updateStatus(): void {
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
        const relative = path.relative(this.git.workspaceRootPath, filePath);
        
        return patterns.some(pattern => {
            return minimatch(relative, pattern, { dot: true });
        });
    }
    
    private restart(): void {
        if (this.versionDebounceTimer) {
            clearTimeout(this.versionDebounceTimer);
        }
        if (this.cloudSyncTimer) {
            clearInterval(this.cloudSyncTimer);
        }
        if (this.onlineCheckTimer) {
            clearInterval(this.onlineCheckTimer);
        }
        
        const enabled = this.config.get<boolean>('autoBackup.enabled');
        if (!enabled) {
            this.statusBar.setPaused('Auto backup is disabled');
            return;
        }
        
        const logLevel = this.config.get<string>('autoBackup.logLevel') as 'debug' | 'info' | 'warn' | 'error';
        this.logger.setLevel(logLevel);
        
        this.startCloudSyncTimer();
        this.startOnlineDetection();
        this.updateStatus();
    }
    
    async forceSyncNow(): Promise<void> {
        await this.saveVersion();
        await this.syncToCloud();
    }
    
    dispose(): void {
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
        if (this.configChangeDisposable) {
            this.configChangeDisposable.dispose();
        }
    }
}
