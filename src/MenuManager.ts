import * as vscode from 'vscode';
import { AutoBackupManager } from './AutoBackupManager';
import { Logger } from './Logger';
import { ConfigManager } from './ConfigManager';

export class MenuManager {
    constructor(
        private autoBackup: AutoBackupManager,
        private logger: Logger,
        private config: ConfigManager
    ) {}
    
    async show(): Promise<void> {
        const mode = this.config.get<string>('autoBackup.syncMode');
        const isAuto = mode === 'auto';
        
        const items: Array<vscode.QuickPickItem & { id?: string }> = [
            {
                label: isAuto ? '$(check) Auto sync: ON' : '○ Auto sync: OFF',
                id: 'toggle'
            },
            { label: '', kind: vscode.QuickPickItemKind.Separator },
            { label: '$(eye) View problems and activity', id: 'logs' },
            { label: '$(trash) Clear activity history', id: 'clear' },
            { label: '$(settings-gear) Configure ignored items', id: 'ignore' },
            { label: '$(sync) Sync now', id: 'sync' },
            { label: '', kind: vscode.QuickPickItemKind.Separator },
            { label: '$(gear) Open settings', id: 'settings' },
            { label: '$(info) About auto backup', id: 'about' }
        ];
        
        const choice = await vscode.window.showQuickPick(items, {
            placeHolder: 'Auto Backup'
        });
        
        if (!choice || !('id' in choice) || !choice.id) {
            return;
        }
        
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
                    { 
                        location: vscode.ProgressLocation.Notification, 
                        title: 'Syncing…',
                        cancellable: false
                    },
                    async () => {
                        try {
                            await this.autoBackup.forceSyncNow();
                        } catch (error: unknown) {
                            const message = error instanceof Error ? error.message : String(error);
                            vscode.window.showErrorMessage(`Sync failed: ${message}`);
                        }
                    }
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
