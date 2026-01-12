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
exports.ConfigManager = void 0;
const vscode = __importStar(require("vscode"));
class ConfigManager {
    constructor() {
        this.config = vscode.workspace.getConfiguration('autoBackup');
    }
    get(key) {
        const cleanKey = key.replace('autoBackup.', '');
        return this.config.get(cleanKey);
    }
    async set(key, value) {
        const cleanKey = key.replace('autoBackup.', '');
        await this.config.update(cleanKey, value, vscode.ConfigurationTarget.Workspace);
        this.refresh();
    }
    async toggle(key) {
        const current = this.get(key);
        await this.set(key, !current);
    }
    onDidChange(callback) {
        return vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('autoBackup')) {
                this.refresh();
                callback();
            }
        });
    }
    refresh() {
        this.config = vscode.workspace.getConfiguration('autoBackup');
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=ConfigManager.js.map