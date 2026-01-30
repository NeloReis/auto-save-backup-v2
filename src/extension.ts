import * as vscode from 'vscode';
import { Logger } from './Logger';
import { ConfigManager } from './ConfigManager';
import { StatusBarManager } from './StatusBarManager';
import { GitManager } from './GitManager';
import { AutoBackupManager } from './AutoBackupManager';
import { MenuManager } from './MenuManager';

let autoBackup: AutoBackupManager | undefined;
let statusBar: StatusBarManager | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('Auto Backup requires an open folder');
        return;
    }
    
    const logger = new Logger(workspaceRoot);
    const config = new ConfigManager();
    statusBar = new StatusBarManager();
    const git = new GitManager(workspaceRoot, logger);
    autoBackup = new AutoBackupManager(git, statusBar, logger, config);
    const menu = new MenuManager(autoBackup, logger, config);
    
    const openMenuCommand = vscode.commands.registerCommand('autoBackup.openMenu', () => 
        menu.show()
    );
    
    context.subscriptions.push(openMenuCommand);
    context.subscriptions.push(statusBar);
    context.subscriptions.push({
        dispose: () => autoBackup?.dispose()
    });
    
    try {
        await git.initialize(context.workspaceState);
        await autoBackup.start();
        
        logger.log('Auto Backup activated', 'info');
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Auto Backup failed to activate: ${message}`);
        console.error('Auto Backup activation error:', error);
    }
}

export function deactivate(): void {
    if (autoBackup) {
        autoBackup.dispose();
    }
    if (statusBar) {
        statusBar.dispose();
    }
}
