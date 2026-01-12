import * as vscode from 'vscode';

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
    
    setReady(message?: string): void {
        this.item.text = '● Auto backup: Ready';
        this.item.color = '#4EC9B0';
        this.item.tooltip = message || 'All changes are saved safely.';
    }
    
    setSyncing(message?: string): void {
        this.item.text = '⟳ Auto backup: Syncing…';
        this.item.color = '#DCDCAA';
        this.item.tooltip = message || 'Saving your latest changes…';
    }
    
    setOffline(message?: string): void {
        this.item.text = '● Auto backup: Offline';
        this.item.color = '#808080';
        this.item.tooltip = message || 'Working offline. Changes will sync when you\'re back online.';
    }
    
    setError(message?: string): void {
        this.item.text = '⚠ Auto backup: Problem';
        this.item.color = '#F48771';
        this.item.tooltip = message || 'There was a problem saving. Click for details.';
    }
    
    setPaused(message?: string): void {
        this.item.text = '○ Auto backup: Paused';
        this.item.color = '#808080';
        this.item.tooltip = message || 'Automatic cloud sync is paused. Click to sync manually.';
    }
    
    dispose(): void {
        this.item.dispose();
    }
}
