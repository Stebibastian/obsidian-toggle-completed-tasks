# Toggle Completed Tasks

An Obsidian plugin to easily show/hide completed tasks with one click.

## ✨ Features

- **One-Click Toggle**: Show or hide completed tasks via title bar buttons or command palette
- **Task Sorting**: Sort tasks automatically within categories — completed, cancelled, then open tasks — each sorted by date
- **Title Bar Buttons**: Three configurable buttons (Sort ↕️, Recent 📅, Toggle 👁️) appear directly in the title bar next to the ⋮ menu
- **Recently Completed**: Optionally show tasks completed within the last 1–7 days, even when completed tasks are hidden
- **Hide Cancelled Tasks**: Automatically hide cancelled `[-]` tasks (with ❌ date) alongside completed tasks
- **Customizable Settings**: Full control over all features via settings panel
- **Edit Icons on Every Task**: 📝 icon appears next to each task in Reading View for quick editing
- **Quick Task Creation**: Click on completion messages or task list links to instantly create new tasks via the Tasks Plugin modal
- **Multi-Language Support**: Auto-detects Obsidian language (English & German supported, more coming soon)
- **Tasks Plugin Integration**:
  - Works perfectly with the Tasks Plugin - completed tasks remain visible in query results
  - Edit icons and clickable links open the Tasks Plugin modal
  - Automatically switches to edit mode and returns to reading mode after task editing/creation
- **Status Symbol Support**: Only `[x]` completed tasks are hidden, other status symbols like `[/]` (in progress), `[-]` (cancelled), `[>]` (forwarded) remain visible
- **Smart Completion Messages**:
  - Shows clickable "-All tasks completed-" message when all tasks are done
  - Shows clickable "+ Create new task" link when tasks are still pending
- **Automatic Cleanup**: Empty task lines (only checkbox, no text) are automatically removed when switching to Reading Mode
- **Notifications**: Optional toast notifications when toggling task visibility
- **Command Palette**: Also accessible via Command Palette

## 🎯 Usage

### Title Bar Buttons

The plugin adds up to three buttons in the title bar, positioned next to the ⋮ menu (right side). From left to right:

| Button | Icon | Function | Visible when |
|--------|------|----------|--------------|
| **Sort** | ↕️ (arrow-up-down) | Sort tasks within categories | "Enable task sorting" is ON |
| **Recent** | 📅 (calendar) | Toggle recently completed tasks | "Hide completed tasks" is ON |
| **Toggle** | 👁️ (eye) | Show/hide completed tasks | Always (closest to ⋮ menu) |

All buttons can be hidden via the **"Show view action buttons"** setting or the **"Toggle view action buttons"** command.

### Task Sorting

When enabled, the sort button (↕️) sorts tasks **within each category** (categories are separated by empty lines or non-task text). The sort order is:

1. **Open tasks** — sorted by ➕ creation date (original order preserved)
2. **Cancelled tasks** `[-]` — sorted by ❌ date, oldest first
3. **Completed tasks** `[x]` — sorted by ✅ date, oldest first

This keeps your open tasks at the top and moves finished tasks to the bottom of each category.

### Toggle Completed Tasks

#### Title Bar (recommended)
Click the 👁️ eye button in the title bar to toggle between hiding/showing completed tasks.

#### Command Palette
1. Press `Cmd+P` (Mac) or `Ctrl+P` (Windows/Linux)
2. Type "Toggle Completed Tasks"
3. Select the command

### Recently Completed Tasks

When "Hide completed tasks" is active, you can still show tasks that were completed within the last 1–7 days. Toggle this via the 📅 calendar button in the title bar. The number of days is configurable in settings.

### Edit Tasks with One Click (New!)

Every task in Reading View shows a 📝 edit icon that:
- Appears next to each task (becomes more visible on hover)
- Click to instantly edit that specific task
- Automatically switches to edit mode
- Opens the Tasks Plugin modal with the task's current details
- Returns to reading mode after saving

### Quick Task Creation

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

### Automatic Cleanup

Empty task lines (containing only `- [ ]` or `- [x]` with no text) are automatically removed when you switch to Reading Mode. This keeps your task lists clean and organized without manual intervention.

**When it works:**
- You create a task but decide not to fill it in
- You delete the text from a task but leave the checkbox
- When switching from Edit Mode to Reading Mode, empty lines are automatically cleaned up

## ⚙️ Settings

Customize the plugin behavior in **Settings → Community Plugins → Toggle Completed Tasks**.
All settings are enabled by default.

### Task Visibility

| Setting | Default | Description |
|---------|---------|-------------|
| **Hide completed tasks** | ON | Hides all completed `[x]` tasks |
| **Show recently completed** | OFF | Shows tasks completed in the last X days (requires "Hide completed") |
| **Number of days** | 3 | How many days back to show recently completed tasks (1–7) |
| **Hide cancelled tasks** | ON | Hides cancelled `[-]` tasks (with ❌ date) when completed tasks are hidden |

### Task Management

| Setting | Default | Description |
|---------|---------|-------------|
| **Auto-clean empty tasks** | ON | Removes empty task lines when switching to Reading Mode |
| **Show edit icons** | ON | Shows 📝 icon next to each task for quick editing |
| **Show "Create new task" link** | ON | Shows clickable link to add new tasks when incomplete tasks exist |
| **Show "All tasks completed" message** | ON | Shows message when all tasks in a list are completed |
| **Make "All tasks completed" clickable** | ON | Makes the completion message clickable to add new tasks |

### User Interface

| Setting | Default | Description |
|---------|---------|-------------|
| **Enable task sorting** | ON | Shows sort button (↕️) in title bar |
| **Show view action buttons** | ON | Shows all buttons (👁️ 📅 ↕️) in the title bar |
| **Show notifications** | ON | Shows toast notifications when toggling visibility |

## 🔧 How it Works

- **Plugin enabled** (default): Completed `[x]` tasks are hidden
- **Plugin disabled**: All tasks are shown

### Tasks Plugin Integration

This plugin is specifically optimized for use with the [Tasks Plugin](https://github.com/obsidian-tasks-group/obsidian-tasks):

#### Visibility
- In normal task lists, completed tasks are hidden
- In Tasks Plugin query results (``` ```tasks ```), ALL tasks remain visible
- Other status symbols (`[/]`, `[-]`, `[>]`, etc.) always remain visible

#### Quick Task Editing & Creation
- Edit icons (📝) appear next to every task for instant editing
- Click on completion messages or "+ Create new task" links for new tasks
- Automatically opens the Tasks Plugin modal
- Seamlessly handles mode switching (Reading ↔ Edit)
- Detects and inserts tasks into the correct list when multiple lists exist per file
- Works with tasks that have Tasks Plugin formatting (dates, priorities, etc.)

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
