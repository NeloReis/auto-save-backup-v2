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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const Logger_1 = require("./Logger");
const ConfigManager_1 = require("./ConfigManager");
const StatusBarManager_1 = require("./StatusBarManager");
const GitManager_1 = require("./GitManager");
const AutoBackupManager_1 = require("./AutoBackupManager");
const MenuManager_1 = require("./MenuManager");
let autoBackup;
let statusBar;
async function activate(context) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('Auto Backup requires an open folder');
        return;
    }
    try {
        const logger = new Logger_1.Logger(workspaceRoot);
        const config = new ConfigManager_1.ConfigManager();
        statusBar = new StatusBarManager_1.StatusBarManager();
        const git = new GitManager_1.GitManager(workspaceRoot, logger);
        autoBackup = new AutoBackupManager_1.AutoBackupManager(git, statusBar, logger, config);
        const menu = new MenuManager_1.MenuManager(autoBackup, logger, config);
        await git.initialize(context.workspaceState);
        await autoBackup.start();
        const openMenuCommand = vscode.commands.registerCommand('autoBackup.openMenu', () => menu.show());
        context.subscriptions.push(openMenuCommand);
        context.subscriptions.push(statusBar);
        context.subscriptions.push({
            dispose: () => autoBackup?.dispose()
        });
        logger.log('Auto Backup activated', 'info');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Auto Backup failed to activate: ${message}`);
        console.error('Auto Backup activation error:', error);
    }
}
function deactivate() {
    if (autoBackup) {
        autoBackup.dispose();
    }
    if (statusBar) {
        statusBar.dispose();
    }
}
//# sourceMappingURL=extension.js.map