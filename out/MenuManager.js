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
exports.MenuManager = void 0;
const vscode = __importStar(require("vscode"));
class MenuManager {
    constructor(autoBackup, logger, config) {
        this.autoBackup = autoBackup;
        this.logger = logger;
        this.config = config;
    }
    async show() {
        const mode = this.config.get('autoBackup.syncMode');
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
        if (!choice) {
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
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Syncing…',
                    cancellable: false
                }, async () => {
                    try {
                        await this.autoBackup.forceSyncNow();
                    }
                    catch (error) {
                        const message = error instanceof Error ? error.message : String(error);
                        vscode.window.showErrorMessage(`Sync failed: ${message}`);
                    }
                });
                break;
            case 'settings':
                vscode.commands.executeCommand('workbench.action.openSettings', 'autoBackup');
                break;
            case 'about':
                vscode.window.showInformationMessage('Auto Backup v1.0.0\n\nAutomatic cloud backup with version history for your projects.');
                break;
        }
    }
}
exports.MenuManager = MenuManager;
//# sourceMappingURL=MenuManager.js.map