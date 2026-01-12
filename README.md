# Auto Backup for VS Code

**Automatic cloud backup with version history. Works like Google Sheets autosave.**

[![Version](https://img.shields.io/badge/version-1.0.1-blue.svg)](https://github.com/NeloReis/auto-save-backup-v2)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.75.0+-007ACC.svg)](https://code.visualstudio.com/)

---

## 🚀 Overview

Never lose your work again! **Auto Backup** continuously saves and syncs your code to the cloud without any manual intervention. Your changes are automatically versioned locally and synchronized to your remote repository - all happening silently in the background.

**Just like Google Sheets** - the extension detects when you make changes and saves them automatically. No more manual commits, no Git commands to remember, just code with confidence knowing everything is safely backed up.


## ✨ Features

- 🔄 **Smart auto-save** - Only saves when you actually change files (just like Google Sheets!)
- ☁️ **Automatic cloud sync** - Syncs to your remote repository every 5 minutes  
- 📡 **Offline support** - Continues working offline, syncs when connection returns
- 🎯 **Simple UI** - Single status bar indicator with click-to-open menu
- 💬 **Plain language** - No Git terminology, just simple backup/sync language
- ⚡ **Non-intrusive** - Works silently in the background, no unnecessary commits
- 🧹 **Auto-cleaning logs** - Logs older than 2 hours are automatically cleared
- 🔒 **Secure** - Uses your existing Git credentials and remote repositories
- ⚙️ **Configurable** - Customize save intervals, ignore patterns, and sync behavior

---

## 📦 Installation

### Option 1: From VSIX File

1. Download the latest `.vsix` file from [Releases](https://github.com/NeloReis/auto-save-backup-v2/releases)
2. Open VS Code
3. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
4. Type "Extensions: Install from VSIX"
5. Select the downloaded `auto-backup-1.0.1.vsix` file
6. Reload VS Code when prompted

### Option 2: From Command Line

```bash
code --install-extension auto-backup-1.0.1.vsix
```

### Option 3: Build from Source

```bash
git clone https://github.com/NeloReis/auto-save-backup-v2.git
cd auto-save-backup-v2
npm install
npm run compile
vsce package
code --install-extension auto-backup-1.0.1.vsix
```

---

## 🎯 Quick Start


### Step 1: Open a Project

Open any folder or workspace in VS Code. The extension activates automatically.

### Step 2: Configure Cloud Backup

When prompted, connect to a remote repository:

1. Click **"Configure now"** when prompted
2. Enter your remote repository URL (e.g., `https://github.com/username/repo.git`)
3. Make sure you have authentication set up (GitHub credentials or SSH keys)

**Note:** You can skip this and configure later. Local versioning still works without cloud sync.

### Step 3: Start Coding

That's it! Your changes are now automatically saved and synced. Look for the status indicator in the bottom right of your VS Code window.

---

## 📊 Status Bar Indicators

The status bar (bottom right corner) shows your current backup status:

| Icon | Status | Meaning |
|------|--------|---------|
| ● | **Auto backup: Ready** | ✅ All changes are saved and synced |
| ⟳ | **Auto backup: Syncing…** | 🔄 Currently saving or syncing changes |
| ● | **Auto backup: Offline** | 📡 Working offline, will sync when back online |
| ⚠ | **Auto backup: Problem** | ⚠️ An error occurred, click for details |
| ○ | **Auto backup: Paused** | ⏸️ Auto sync is off, click to sync manually |

---

## 🎛️ Menu Options

Click the status bar indicator to access:

1. **Auto sync: ON/OFF** - Toggle automatic cloud syncing
2. **View problems and activity** - See detailed activity log
3. **Clear activity history** - Clear the log
4. **Configure ignored items** - Set which files to exclude from backup
5. **Sync now** - Manually trigger immediate sync
6. **Open settings** - Configure extension settings
7. **About auto backup** - Version and info

---

## ⚙️ Configuration

Access settings via the menu or VS Code preferences (`autoBackup.*`):

| Setting | Description | Default |
|---------|-------------|---------|
| `autoBackup.enabled` | Enable/disable the extension | `true` |
| `autoBackup.versionInterval` | Time before saving a version | `30000` ms (30s) |
| `autoBackup.cloudInterval` | Time between cloud syncs | `300000` ms (5m) |
| `autoBackup.syncMode` | Auto or manual sync mode | `auto` |
| `autoBackup.ignorePatterns` | Files/folders to exclude | See below |
| `autoBackup.logLevel` | Activity log detail level | `warn` |

### Default Ignored Patterns

```json
[
  "node_modules/**",
  ".env",
  ".git/**",
  "*.tmp",
  ".DS_Store",
  "*.log"
]
```

---

## 🔧 How It Works

Behind the scenes, the extension uses Git for version control but presents a simplified interface:

1. 📝 **File changes** are detected automatically
2. ⏱️ **After 30 seconds** of no changes, a local version is saved
3. ☁️ **Every 5 minutes**, changes are synced to your remote repository
4. 🤫 **All operations** happen in the background without interrupting your work

---

## 🐛 Troubleshooting

## 🐛 Troubleshooting

### "Could not reach cloud"

- ✓ Check your internet connection
- ✓ Verify your remote repository URL is correct
- ✓ Ensure you have proper authentication (credentials or SSH keys)

### "Cloud sync needs authentication"

- ✓ Set up GitHub authentication (Personal Access Token or SSH)
- ✓ For HTTPS: Use Git Credential Manager or store credentials
- ✓ For SSH: Configure SSH keys in your GitHub account

### Status shows "Problem"

- ✓ Click the status bar to view the activity log
- ✓ Check the log for detailed error messages
- ✓ Most issues are related to network or authentication

---

## 🛠️ Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/NeloReis/auto-save-backup-v2.git
cd auto-save-backup-v2

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
vsce package
```

### Running in Debug Mode

1. Open the project folder in VS Code
2. Press `F5` to launch Extension Development Host
3. Test in the new VS Code window

---

## 📋 Requirements

- ✅ VS Code version 1.75.0 or higher
- ✅ Git installed on your system
- ✅ A remote repository (GitHub, GitLab, Bitbucket, etc.)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 👤 Author

**Nelo Reis**
- GitHub: [@NeloReis](https://github.com/NeloReis)
- Repository: [auto-save-backup-v2](https://github.com/NeloReis/auto-save-backup-v2)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## ⭐ Support

If you find this extension helpful, please consider:

- ⭐ Starring the [repository](https://github.com/NeloReis/auto-save-backup-v2)
- 🐛 Reporting bugs and issues
- 💡 Suggesting new features
- 📖 Improving documentation

---

<div align="center">
  
  **Made with ❤️ by [Nelo Reis ](https://github.com/NeloReis)**
  
  [Report Bug](https://github.com/NeloReis/auto-save-backup-v2/issues) · [Request Feature](https://github.com/NeloReis/auto-save-backup-v2/issues)

</div>
