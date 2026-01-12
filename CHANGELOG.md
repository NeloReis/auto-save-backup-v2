# Changelog

All notable changes to the "Auto Backup" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-01-12

### 🚀 Improvements

#### Changed
- ⚡ **Smart auto-save**: Only saves versions when there are actual file changes (true Google Sheets-like behavior)
- 🧹 **Auto-cleaning logs**: Log files older than 2 hours are automatically cleared to prevent indefinite growth
- 🔇 **Reduced log spam**: Eliminated redundant "Everything up-to-date" messages
- 📊 **Better change detection**: Improved detection of unpushed commits before attempting cloud sync

#### Fixed
- 🐛 Log file no longer stuck in version control loop
- 🐛 Extension no longer creates empty commits when nothing changed
- 🐛 VS Code settings.json excluded from version control to prevent conflicts
- 🐛 Log file properly excluded from git tracking

#### Technical
- Implemented `hasChanges()` check before version saves
- Implemented `hasCommitsToSync()` check before cloud sync
- Added automatic log rotation after 2 hours
- Updated `.gitignore` to exclude log and settings files

---

## [1.0.0] - 2026-01-11

### 🎉 Initial Release

#### Added
- ✨ Automatic local versioning every 30 seconds after changes
- ☁️ Automatic cloud synchronization every 5 minutes
- 📊 Status bar indicator with 5 states (Ready, Syncing, Offline, Problem, Paused)
- 🎛️ Interactive quick pick menu with 7 options
- 📝 Activity logging system with configurable log levels
- ⚙️ Comprehensive configuration options
- 📡 Offline detection and automatic recovery
- 🔄 File watching with debounce mechanism
- 🚫 Customizable ignore patterns for files/folders
- 🎯 Manual sync mode option
- 💬 User-friendly interface with no Git terminology
- 🔐 Remote repository configuration wizard
- 📖 Complete documentation and README

#### Features
- **Automatic Versioning**: Saves your work locally every 30 seconds after you stop typing
- **Cloud Sync**: Automatically syncs to remote repository at configurable intervals
- **Offline Mode**: Continues working offline and syncs when connection returns
- **Status Indicators**: Clear visual feedback in status bar
- **Activity Log**: Detailed history of all backup operations
- **Ignore Patterns**: Exclude specific files/folders from backup
- **Configurable Intervals**: Customize timing for both local saves and cloud syncs
- **Error Handling**: Graceful error handling with user-friendly messages
- **Zero Git Knowledge Required**: Plain language interface for all users

#### Technical Details
- Built with TypeScript
- Uses VS Code Extension API
- Git-based version control (hidden from user)
- Debounced file watching for performance
- Minimatch for glob pattern matching
- Comprehensive error handling and logging

### 📦 Installation
- Available as `.vsix` package
- Can be installed via `code --install-extension`
- Source code available on GitHub

### 🎨 Design
- Custom logo with transparent background
- Professional status bar integration
- Intuitive quick pick menu interface
- Color-coded status indicators

---

## [Unreleased]

### Planned Features
- 📜 Version history browser
- 🔍 Search through saved versions
- 📅 Restore specific versions
- 📊 Statistics and analytics dashboard
- 🔔 Customizable notifications
- 🌐 Multi-workspace support
- 🔄 Conflict resolution interface
- 📤 Export version history
- 🎨 Customizable status bar appearance
- 🔌 Integration with popular Git hosting services

---

## Version History

- **1.0.1** (2026-01-12) - Smart auto-save, log management, and bug fixes
- **1.0.0** (2026-01-11) - Initial release with core functionality

---

**Note**: This extension is actively maintained. Please report any issues or feature requests on [GitHub](https://github.com/NeloReis/auto-save-backup-v2/issues).
