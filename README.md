# Auto Backup for VS Code

Automatic cloud backup with version history for your projects. Works like Google Sheets autosave - your changes are continuously saved and synced to the cloud without any manual intervention.

## Features

- **Automatic local versioning** - Saves your work every 30 seconds after you stop typing
- **Automatic cloud sync** - Syncs to your remote repository every 5 minutes
- **Offline support** - Continues working offline, syncs when connection returns
- **Simple UI** - Single status bar indicator with click-to-open menu
- **Zero Git terminology** - Plain language interface, no technical jargon

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Compile the Extension

```bash
npm run compile
```

Or watch for changes:

```bash
npm run watch
```

### 3. Run in Debug Mode

1. Open this folder in VS Code
2. Press `F5` to launch the Extension Development Host
3. Open a workspace/folder in the development window

### 4. Configure Cloud Backup

On first activation, you'll be prompted to connect to a remote repository:

1. Click **"Configure now"** when prompted
2. Enter your remote repository URL (e.g., `https://github.com/username/repo.git`)
3. Make sure you have authentication set up (GitHub credentials or SSH keys)

**Note:** You can configure this later by clicking the status bar and selecting "Sync now" if no remote is set up yet.

## Usage

### Status Bar States

The status bar (bottom right) shows your current backup status:

| Indicator | Meaning |
|-----------|---------|
| **● Auto backup: Ready** | All changes are saved and synced |
| **⟳ Auto backup: Syncing…** | Currently saving or syncing changes |
| **● Auto backup: Offline** | Working offline, will sync when back online |
| **⚠ Auto backup: Problem** | An error occurred, click for details |
| **○ Auto backup: Paused** | Auto sync is off, click to sync manually |

### Menu Options

Click the status bar indicator to open the menu:

1. **Auto sync: ON/OFF** - Toggle automatic cloud syncing
2. **View problems and activity** - See detailed activity log
3. **Clear activity history** - Clear the log
4. **Configure ignored items** - Set which files to exclude from backup
5. **Sync now** - Manually trigger immediate sync
6. **Open settings** - Configure extension settings
7. **About auto backup** - Version and info

### Configuration

Access settings via the menu or VS Code preferences:

- **autoBackup.enabled** - Enable/disable the extension
- **autoBackup.versionInterval** - Time before saving a version (default: 30 seconds)
- **autoBackup.cloudInterval** - Time between cloud syncs (default: 5 minutes)
- **autoBackup.syncMode** - Auto or manual sync mode
- **autoBackup.ignorePatterns** - Files/folders to exclude from backup
- **autoBackup.logLevel** - Activity log detail level

### Default Ignored Patterns

By default, these files are excluded from backup:

- `node_modules/**`
- `.env`
- `.git/**`
- `*.tmp`
- `.DS_Store`
- `*.log`

You can customize this list in the settings.

## How It Works

The extension uses Git internally for version control but presents a simplified, user-friendly interface:

1. **File changes** are detected automatically
2. **After 30 seconds** of no changes, a local version is saved
3. **Every 5 minutes**, changes are synced to your remote repository
4. **All operations** happen in the background without interrupting your work

## Troubleshooting

### "Could not reach cloud"

- Check your internet connection
- Verify your remote repository URL is correct
- Ensure you have proper authentication (credentials or SSH keys)

### "Cloud sync needs authentication"

- Set up GitHub authentication (Personal Access Token or SSH)
- For HTTPS: Use Git Credential Manager or store credentials
- For SSH: Configure SSH keys in your GitHub account

### Status shows "Problem"

- Click the status bar to view the activity log
- Check the log for detailed error messages
- Most issues are related to network or authentication

## Building for Production

To create a VSIX package for distribution:

```bash
npm install -g @vscode/vsce
vsce package
```

This creates an `.vsix` file you can install or share.

## Requirements

- VS Code version 1.75.0 or higher
- Git installed on your system
- A remote repository (GitHub, GitLab, Bitbucket, etc.)

## License

MIT

## Support

For issues or questions, please open an issue on the [GitHub repository](https://github.com/your-username/vscode-auto-backup).
