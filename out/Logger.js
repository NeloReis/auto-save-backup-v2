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
exports.Logger = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
class Logger {
    constructor(workspaceRoot) {
        this.logs = [];
        const vscodeDir = path.join(workspaceRoot, '.vscode');
        if (!fs.existsSync(vscodeDir)) {
            fs.mkdirSync(vscodeDir, { recursive: true });
        }
        this.logFile = path.join(vscodeDir, 'auto-backup.log');
        this.minLevel = 'warn';
    }
    setLevel(level) {
        this.minLevel = level;
    }
    log(message, level = 'info') {
        const levels = ['debug', 'info', 'warn', 'error'];
        const minLevelIndex = levels.indexOf(this.minLevel);
        const currentLevelIndex = levels.indexOf(level);
        if (currentLevelIndex < minLevelIndex) {
            return;
        }
        const timestamp = new Date().toISOString();
        const entry = { timestamp, level, message };
        this.logs.push(entry);
        const line = `[${timestamp}] ${level}: ${message}\n`;
        try {
            fs.appendFileSync(this.logFile, line);
        }
        catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    async show() {
        const content = this.logs
            .map(l => `[${l.timestamp}] ${l.level}: ${l.message}`)
            .join('\n');
        const doc = await vscode.workspace.openTextDocument({
            language: 'log',
            content: content || 'No activity yet.'
        });
        await vscode.window.showTextDocument(doc);
    }
    clear() {
        this.logs = [];
        try {
            fs.writeFileSync(this.logFile, '');
        }
        catch (error) {
            console.error('Failed to clear log file:', error);
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map