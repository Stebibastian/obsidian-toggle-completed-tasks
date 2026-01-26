# Toggle Completed Tasks

An Obsidian plugin to easily show/hide completed tasks with one click.

## ✨ Features

- **One-Click Toggle**: Show or hide completed tasks with a ribbon icon
- **Quick Task Creation**: Click on completion messages or task list links to instantly create new tasks via the Tasks Plugin modal
- **Multi-Language Support**: Auto-detects Obsidian language (English & German supported, more coming soon)
- **Tasks Plugin Integration**:
  - Works perfectly with the Tasks Plugin - completed tasks remain visible in query results
  - Clickable links open the Tasks Plugin modal for quick task creation
  - Automatically switches to edit mode and returns to reading mode after task creation
- **Status Symbol Support**: Only `[x]` completed tasks are hidden, other status symbols like `[/]` (in progress), `[-]` (cancelled), `[>]` (forwarded) remain visible
- **Smart Completion Messages**:
  - Shows clickable "-All tasks completed-" message when all tasks are done
  - Shows clickable "+ Create new task" link when tasks are still pending
- **Command Palette**: Also accessible via Command Palette

## 🎯 Usage

### Toggle Completed Tasks

#### Ribbon Icon (recommended)
Click the 👁️ eye icon in the left sidebar to toggle between hiding/showing completed tasks.

#### Command Palette
1. Press `Cmd+P` (Mac) or `Ctrl+P` (Windows/Linux)
2. Type "Toggle Completed Tasks"
3. Select the command

### Quick Task Creation (New!)

When completed tasks are hidden, you'll see helpful links in Reading View:

#### All tasks completed
- A clickable "-All tasks completed-" message appears (green, italic)
- Click to instantly create a new task in that specific list

#### Tasks still pending
- A clickable "+ Create new task" link appears (blue)
- Click to add another task to the list

Both links will:
1. Automatically switch to edit mode
2. Insert a new empty task line at the end of that specific task list
3. Open the Tasks Plugin modal for you to fill in task details
4. Automatically return to reading mode after you save or cancel

**Note**: Requires the [Tasks Plugin](https://github.com/obsidian-tasks-group/obsidian-tasks) to be installed for the modal to work.

## 🔧 How it Works

- **Plugin enabled** (default): Completed `[x]` tasks are hidden
- **Plugin disabled**: All tasks are shown

### Tasks Plugin Integration

This plugin is specifically optimized for use with the [Tasks Plugin](https://github.com/obsidian-tasks-group/obsidian-tasks):

#### Visibility
- In normal task lists, completed tasks are hidden
- In Tasks Plugin query results (``` ```tasks ```), ALL tasks remain visible
- Other status symbols (`[/]`, `[-]`, `[>]`, etc.) always remain visible

#### Quick Task Creation
- Click on completion messages or "+ Create new task" links
- Automatically opens the Tasks Plugin modal
- Seamlessly handles mode switching (Reading ↔ Edit)
- Detects and inserts tasks into the correct list when multiple lists exist per file

## 📋 Try It Out

Want to see the features in action? Copy and paste these examples into your Obsidian vault:

### Example 1: Completed Task List
```markdown
## Shopping List

- [x] Buy milk
- [x] Get bread
- [x] Purchase coffee
```

**What you'll see**: When you enable "Hide Completed Tasks", all tasks disappear and you'll see a clickable green "-All tasks completed-" message. Click it to add a new task!

### Example 2: Mixed Task List
```markdown
## Project Tasks

- [x] Research topic
- [x] Create outline
- [ ] Write first draft
- [ ] Review and edit
```

**What you'll see**: Completed tasks are hidden, and you'll see a blue "+ Create new task" link at the bottom. Click it to quickly add another task!

### Example 3: Multiple Task Lists
```markdown
## Home Tasks

- [x] Clean kitchen
- [x] Vacuum living room

## Work Tasks

- [ ] Send email
- [ ] Update report
```

**What you'll see**: Each list gets its own creation link. Clicking on either link adds a new task to that specific list, not the other one!

### Example 4: Tasks Plugin Query (Not Affected)
````markdown
## My Tasks Query

```tasks
not done
```
````

**What you'll see**: All tasks in the query result remain visible, even when "Hide Completed Tasks" is enabled!

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
