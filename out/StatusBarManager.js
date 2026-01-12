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
exports.StatusBarManager = void 0;
const vscode = __importStar(require("vscode"));
class StatusBarManager {
    constructor() {
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.item.command = 'autoBackup.openMenu';
        this.setReady();
        this.item.show();
    }
    setReady(message) {
        this.item.text = '● Auto backup: Ready';
        this.item.color = '#4EC9B0';
        this.item.tooltip = message || 'All changes are saved safely.';
    }
    setSyncing(message) {
        this.item.text = '⟳ Auto backup: Syncing…';
        this.item.color = '#DCDCAA';
        this.item.tooltip = message || 'Saving your latest changes…';
    }
    setOffline(message) {
        this.item.text = '● Auto backup: Offline';
        this.item.color = '#808080';
        this.item.tooltip = message || 'Working offline. Changes will sync when you\'re back online.';
    }
    setError(message) {
        this.item.text = '⚠ Auto backup: Problem';
        this.item.color = '#F48771';
        this.item.tooltip = message || 'There was a problem saving. Click for details.';
    }
    setPaused(message) {
        this.item.text = '○ Auto backup: Paused';
        this.item.color = '#808080';
        this.item.tooltip = message || 'Automatic cloud sync is paused. Click to sync manually.';
    }
    dispose() {
        this.item.dispose();
    }
}
exports.StatusBarManager = StatusBarManager;
//# sourceMappingURL=StatusBarManager.js.map