# Toggle Completed Tasks

An Obsidian plugin to easily show/hide completed tasks with one click.

## ✨ Features

- **One-Click Toggle**: Show or hide completed tasks with a ribbon icon
- **Tasks Plugin Compatible**: Works perfectly with the Tasks Plugin - completed tasks remain visible in query results
- **Status Symbol Support**: Only `[x]` completed tasks are hidden, other status symbols like `[/]` (in progress), `[-]` (cancelled), `[>]` (forwarded) remain visible
- **"All Tasks Completed" Message**: Automatically shows a message when all tasks in a list are completed
- **Command Palette**: Also accessible via Command Palette

## 🎯 Usage

### Ribbon Icon (recommended)
Click the 👁️ eye icon in the left sidebar to toggle between hiding/showing completed tasks.

### Command Palette
1. Press `Cmd+P` (Mac) or `Ctrl+P` (Windows/Linux)
2. Type "Toggle Completed Tasks"
3. Select the command

## 🔧 How it Works

- **Plugin enabled** (default): Completed `[x]` tasks are hidden
- **Plugin disabled**: All tasks are shown

### Tasks Plugin Integration

This plugin is specifically optimized for use with the [Tasks Plugin](https://github.com/obsidian-tasks-group/obsidian-tasks):

- In normal task lists, completed tasks are hidden
- In Tasks Plugin query results (``` ```tasks ```), ALL tasks remain visible
- Other status symbols (`[/]`, `[-]`, `[>]`, etc.) always remain visible

## 📦 Installation

### From Community Plugin Store
1. Open Settings in Obsidian
2. Navigate to "Community Plugins"
3. Search for "Toggle Completed Tasks"
4. Click "Install"
5. Enable the plugin

### Manual Installation
1. Download the latest release from [Releases](https://github.com/Stebibastian/obsidian-toggle-completed-tasks/releases)
2. Extract to your `.obsidian/plugins/` directory
3. Reload Obsidian
4. Enable the plugin in Settings

## 🛠️ Development

```bash
# Clone repository
git clone https://github.com/Stebibastian/obsidian-toggle-completed-tasks.git

# Navigate to directory
cd obsidian-toggle-completed-tasks

# Install dependencies
npm install

# Build plugin
npm run build
```

## 📝 License

MIT

## 🙏 Credits

Developed with ❤️ for the Obsidian Community.

## 🐛 Bug Reports & Feature Requests

Please open an [Issue on GitHub](https://github.com/Stebibastian/obsidian-toggle-completed-tasks/issues).
