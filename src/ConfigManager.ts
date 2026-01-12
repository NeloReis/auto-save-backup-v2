import * as vscode from 'vscode';

export class ConfigManager {
    private config: vscode.WorkspaceConfiguration;
    
    constructor() {
        this.config = vscode.workspace.getConfiguration('autoBackup');
    }
    
    get<T>(key: string): T {
        const cleanKey = key.replace('autoBackup.', '');
        return this.config.get<T>(cleanKey)!;
    }
    
    async set(key: string, value: unknown): Promise<void> {
        const cleanKey = key.replace('autoBackup.', '');
        await this.config.update(
            cleanKey,
            value,
            vscode.ConfigurationTarget.Workspace
        );
        this.refresh();
    }
    
    async toggle(key: string): Promise<void> {
        const current = this.get<boolean>(key);
        await this.set(key, !current);
    }
    
    onDidChange(callback: () => void): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('autoBackup')) {
                this.refresh();
                callback();
            }
        });
    }
    
    private refresh(): void {
        this.config = vscode.workspace.getConfiguration('autoBackup');
    }
}
