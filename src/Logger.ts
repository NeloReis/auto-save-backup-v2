import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
}

export class Logger {
    private logs: LogEntry[] = [];
    private logFile: string;
    private minLevel: LogLevel;
    
    constructor(workspaceRoot: string) {
        const vscodeDir = path.join(workspaceRoot, '.vscode');
        if (!fs.existsSync(vscodeDir)) {
            fs.mkdirSync(vscodeDir, { recursive: true });
        }
        this.logFile = path.join(vscodeDir, 'auto-backup.log');
        this.minLevel = 'warn';
        this.cleanOldLogs();
    }
    
    private cleanOldLogs(): void {
        try {
            if (!fs.existsSync(this.logFile)) {
                return;
            }
            
            const stats = fs.statSync(this.logFile);
            const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
            
            if (stats.mtimeMs < twoHoursAgo) {
                fs.writeFileSync(this.logFile, '');
            }
        } catch (error) {
            console.error('Failed to clean old logs:', error);
        }
    }
    
    setLevel(level: LogLevel): void {
        this.minLevel = level;
    }
    
    log(message: string, level: LogLevel = 'info'): void {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
        const minLevelIndex = levels.indexOf(this.minLevel);
        const currentLevelIndex = levels.indexOf(level);
        
        if (currentLevelIndex < minLevelIndex) {
            return;
        }
        
        const timestamp = new Date().toISOString();
        const entry: LogEntry = { timestamp, level, message };
        
        this.logs.push(entry);
        
        const line = `[${timestamp}] ${level}: ${message}\n`;
        try {
            fs.appendFileSync(this.logFile, line);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    
    async show(): Promise<void> {
        const content = this.logs
            .map(l => `[${l.timestamp}] ${l.level}: ${l.message}`)
            .join('\n');
        
        const doc = await vscode.workspace.openTextDocument({
            language: 'log',
            content: content || 'No activity yet.'
        });
        
        await vscode.window.showTextDocument(doc);
    }
    
    clear(): void {
        this.logs = [];
        try {
            fs.writeFileSync(this.logFile, '');
        } catch (error) {
            console.error('Failed to clear log file:', error);
        }
    }
}
