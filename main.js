const { Plugin, Notice, PluginSettingTab, Setting } = require('obsidian');

// Default Settings
const DEFAULT_SETTINGS = {
    hideCompleted: true,
    autoCleanEmptyTasks: true,
    showEditIcons: true,
    showAddTaskLink: true,
    showCompletedMessage: true,
    completedMessageClickable: true
};

// Translations
const translations = {
    en: {
        ribbonTooltip: 'Toggle Completed Tasks',
        commandName: 'Toggle completed tasks visibility',
        notificationHidden: 'Completed tasks: hidden',
        notificationVisible: 'Completed tasks: visible',
        allTasksCompleted: '-All tasks completed-'
    },
    de: {
        ribbonTooltip: 'Erledigte Aufgaben ein/ausblenden',
        commandName: 'Erledigte Aufgaben ein/ausblenden',
        notificationHidden: 'Erledigte Aufgaben: ausgeblendet',
        notificationVisible: 'Erledigte Aufgaben: sichtbar',
        allTasksCompleted: '-Alle Aufgaben erledigt-'
    }
};

module.exports = class ToggleCompletedTasksPlugin extends Plugin {
    async onload() {
        console.log('Loading Toggle Completed Tasks Plugin');

        // Detect language (falls back to English if not supported)
        this.lang = this.detectLanguage();
        this.t = translations[this.lang] || translations.en;

        // Load settings
        await this.loadSettings();

        // Add ribbon icon (eye symbol in sidebar)
        const ribbonIconEl = this.addRibbonIcon('eye', this.t.ribbonTooltip, (evt) => {
            this.toggleCompletedTasks();
        });
        ribbonIconEl.addClass('toggle-completed-tasks-ribbon');

        // Add command (for Command Palette)
        this.addCommand({
            id: 'toggle-completed-tasks',
            name: this.t.commandName,
            callback: () => {
                this.toggleCompletedTasks();
            }
        });

        // Apply initial state
        this.applyState();

        // Update CSS with localized message
        this.updateCSSMessage();

        // Add observers to update messages when content changes
        this.registerDomEvent(document, 'click', () => {
            setTimeout(() => this.updateCompletedMessages(), 50);
        });

        // Watch for task checkbox changes
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                setTimeout(() => this.updateCompletedMessages(), 50);
            })
        );

        // Watch for active leaf changes (switching files or views)
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                setTimeout(() => this.updateCompletedMessages(), 100);
            })
        );

        // Watch for file open events
        this.registerEvent(
            this.app.workspace.on('file-open', () => {
                setTimeout(() => this.updateCompletedMessages(), 100);
            })
        );

        // Watch for mode changes to clean up empty task lines when switching to Reading Mode
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                this.checkAndCleanEmptyTasks();
            })
        );

        // Also watch for layout changes (which includes mode switches)
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.checkAndCleanEmptyTasks();
            })
        );

        // Add settings tab
        this.addSettingTab(new ToggleCompletedTasksSettingTab(this.app, this));
    }

    detectLanguage() {
        // Get Obsidian's language setting
        const obsidianLang = window.localStorage.getItem('language') || 'en';

        // Map Obsidian language codes to our supported languages
        if (obsidianLang.startsWith('de')) return 'de';
        return 'en'; // Default to English
    }

    updateCSSMessage() {
        // CSS-based message is now handled by DOM insertion
        // This function is kept for future use
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    toggleCompletedTasks() {
        this.settings.hideCompleted = !this.settings.hideCompleted;
        this.saveSettings();
        this.applyState();

        // Show notification with localized text
        const statusText = this.settings.hideCompleted ?
            this.t.notificationHidden :
            this.t.notificationVisible;
        new Notice(statusText);
    }

    applyState() {
        const body = document.body;

        if (this.settings.hideCompleted) {
            body.classList.add('hide-completed-tasks');
        } else {
            body.classList.remove('hide-completed-tasks');
        }

        // Update completion messages
        setTimeout(() => this.updateCompletedMessages(), 100);
    }

    updateCompletedMessages() {
        // Remove old messages and icons
        document.querySelectorAll('.toggle-tasks-completion-message').forEach(el => el.remove());
        document.querySelectorAll('.toggle-tasks-add-task-link').forEach(el => el.remove());
        document.querySelectorAll('.toggle-tasks-edit-icon').forEach(el => el.remove());

        // Find all task lists in Reading View
        const readingViewLists = document.querySelectorAll('.markdown-reading-view ul.contains-task-list');
        readingViewLists.forEach(list => {
            if (this.isInTasksQuery(list)) return;

            // Always add edit icons to all tasks
            this.addEditIconsToTasks(list);

            // Only add completion messages if hideCompleted is active
            if (this.settings.hideCompleted) {
                if (this.isListFullyCompleted(list)) {
                    // Only show completion message if enabled in settings
                    if (this.settings.showCompletedMessage) {
                        this.addCompletionMessage(list);
                    }
                } else {
                    // List has incomplete tasks, add "create new task" link if enabled
                    if (this.settings.showAddTaskLink) {
                        this.addNewTaskLink(list);
                    }
                }
            }
        });
    }

    isListFullyCompleted(list) {
        const allItems = list.querySelectorAll('.task-list-item');
        const checkedItems = list.querySelectorAll('.task-list-item.is-checked');
        return allItems.length > 0 && allItems.length === checkedItems.length;
    }

    isInTasksQuery(element) {
        // Only skip if it's actually inside a Tasks Plugin query result block
        return element.closest('.plugin-tasks-query-result') !== null ||
               element.closest('.block-language-tasks') !== null;
    }

    addCompletionMessage(list) {
        // Check if message should be clickable
        const isClickable = this.settings.completedMessageClickable;

        const message = document.createElement(isClickable ? 'a' : 'div');
        message.className = 'toggle-tasks-completion-message';
        message.textContent = this.t.allTasksCompleted;

        if (isClickable) {
            message.style.cssText = 'display: inline-block; color: #10b981; font-style: italic; padding: 0; text-align: left; margin-top: -0.8em; margin-bottom: 1em; cursor: pointer; text-decoration: underline;';
            message.href = '#';

            // Store reference to the list element for later use
            message.dataset.listElement = 'true';

            // Add click handler to open Tasks plugin modal
            message.addEventListener('click', (e) => {
                e.preventDefault();
                this.openTasksModal(list);
            });
        } else {
            // Non-clickable version
            message.style.cssText = 'display: inline-block; color: #10b981; font-style: italic; padding: 0; text-align: left; margin-top: -0.8em; margin-bottom: 1em;';
        }

        list.after(message);
    }

    addNewTaskLink(list) {
        const link = document.createElement('a');
        link.className = 'toggle-tasks-add-task-link';
        link.textContent = this.lang === 'de' ? '+ Neue Aufgabe erstellen' : '+ Create new task';
        link.style.cssText = 'display: inline-block; color: #6366f1; font-size: 0.9em; padding: 0; text-align: left; margin-top: -0.4em; margin-bottom: 1em; cursor: pointer; text-decoration: none;';
        link.href = '#';

        // Store reference to the list element for later use
        link.dataset.listElement = 'true';

        // Add click handler to open Tasks plugin modal
        link.addEventListener('click', (e) => {
            e.preventDefault();
            this.openTasksModal(list);
        });

        list.after(link);
    }

    addEditIconsToTasks(list) {
        // Only add edit icons if enabled in settings
        if (!this.settings.showEditIcons) return;

        // Find all task items in this list
        const taskItems = list.querySelectorAll('.task-list-item');

        taskItems.forEach(taskItem => {
            // Skip if already has edit icon
            if (taskItem.querySelector('.toggle-tasks-edit-icon')) return;

            // Skip if this is in a Tasks Plugin query result
            if (this.isInTasksQuery(taskItem)) return;

            // Create edit icon
            const editIcon = document.createElement('a');
            editIcon.className = 'toggle-tasks-edit-icon';
            editIcon.href = '#';
            editIcon.title = this.lang === 'de' ? 'Aufgabe bearbeiten' : 'Edit task';
            editIcon.textContent = '📝';

            // Add click handler
            editIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.editTask(taskItem);
            });

            // Append to task item
            taskItem.appendChild(editIcon);
        });
    }

    async editTask(taskItem) {
        console.log('editTask called');

        const { MarkdownView } = require('obsidian');
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

        if (!activeView) {
            new Notice(this.lang === 'de'
                ? 'Keine aktive Notiz gefunden.'
                : 'No active note found.');
            return;
        }

        const file = activeView.file;
        if (!file) return;

        const currentMode = activeView.getMode();
        console.log('Current mode:', currentMode);

        // Get the task text from the DOM
        const taskText = this.getTaskTextFromItem(taskItem);
        console.log('Task text:', taskText);

        // Switch to edit mode if needed
        if (currentMode !== 'source') {
            console.log('Not in source mode, switching...');
            const leaf = this.app.workspace.activeLeaf;
            await leaf.setViewState({
                type: 'markdown',
                state: {
                    file: file.path,
                    mode: 'source'
                }
            });
            console.log('Switched to source mode');

            await new Promise(resolve => setTimeout(resolve, 150));
        } else {
            console.log('Already in source mode');
        }

        const newActiveView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!newActiveView) {
            console.error('Could not get active view after mode switch');
            return;
        }

        const editor = newActiveView.editor;
        if (!editor) {
            console.error('No editor found');
            return;
        }

        // Find the line with this task
        const content = editor.getValue();
        const lines = content.split('\n');
        let taskLine = -1;

        for (let i = 0; i < lines.length; i++) {
            // Check if this line matches the task text
            if (lines[i].includes(taskText)) {
                taskLine = i;
                break;
            }
        }

        if (taskLine === -1) {
            console.error('Could not find task line in editor');
            return;
        }

        console.log('Found task at line:', taskLine);

        // Position cursor on the task line
        editor.setCursor({ line: taskLine, ch: 0 });
        editor.focus();

        await new Promise(resolve => setTimeout(resolve, 50));

        // Execute Tasks plugin command
        const tasksCommand = this.app.commands.commands['obsidian-tasks-plugin:edit-task'];

        if (tasksCommand) {
            console.log('Opening Tasks modal for editing');

            // Set up modal watcher to return to reading mode if we switched
            if (currentMode === 'preview') {
                this.setupModalWatcher(file, newActiveView);
            }

            if (tasksCommand.editorCheckCallback) {
                tasksCommand.editorCheckCallback(false, editor, newActiveView);
            } else if (tasksCommand.editorCallback) {
                tasksCommand.editorCallback(editor, newActiveView);
            } else {
                this.app.commands.executeCommandById('obsidian-tasks-plugin:edit-task');
            }
        } else {
            console.error('Tasks plugin command not found');
            new Notice(this.lang === 'de'
                ? 'Tasks Plugin ist nicht installiert.'
                : 'Tasks Plugin is not installed.', 5000);
        }
    }

    getTaskTextFromItem(taskItem) {
        // Clone the element to avoid modifying the original
        const clone = taskItem.cloneNode(true);

        // Remove the edit icon from clone
        const editIcon = clone.querySelector('.toggle-tasks-edit-icon');
        if (editIcon) editIcon.remove();

        // Get the text content (will include the checkbox marker)
        let text = clone.textContent.trim();

        // The task text typically starts after the checkbox
        // Format is usually "- [ ] " or "- [x] " followed by the actual text
        return text;
    }

    async openTasksModal(listElement) {
        console.log('openTasksModal called');

        const { MarkdownView } = require('obsidian');
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

        if (!activeView) {
            new Notice(this.lang === 'de'
                ? 'Keine aktive Notiz gefunden.'
                : 'No active note found.');
            return;
        }

        const file = activeView.file;
        if (!file) return;

        const currentMode = activeView.getMode();
        console.log('Current mode:', currentMode);

        // STEP 1: Switch to edit mode FIRST if needed
        if (currentMode !== 'source') {
            console.log('Not in source mode, switching...');
            const leaf = this.app.workspace.activeLeaf;
            await leaf.setViewState({
                type: 'markdown',
                state: {
                    file: file.path,
                    mode: 'source'
                }
            });
            console.log('Switched to source mode');

            // STEP 2: Wait for mode switch to complete
            await new Promise(resolve => setTimeout(resolve, 150));
        } else {
            console.log('Already in source mode');
        }

        const newActiveView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!newActiveView) {
            console.error('Could not get active view after mode switch');
            return;
        }

        const editor = newActiveView.editor;
        if (!editor) {
            console.error('No editor found');
            return;
        }

        // STEP 3: Find the SPECIFIC list where the user clicked
        // The listElement is the actual UL that was passed to the function
        let targetList = listElement;

        // Find the heading that precedes this list
        // We need to search backwards through all elements, not just siblings
        let precedingHeading = null;
        let searchElement = targetList;

        // Walk backwards through the DOM tree
        while (searchElement) {
            // Check previous sibling
            let prev = searchElement.previousElementSibling;
            while (prev) {
                if (prev.tagName && /^H[1-6]$/.test(prev.tagName)) {
                    precedingHeading = prev;
                    break;
                }
                // Also check children of previous sibling in case heading is nested
                const headingInPrev = prev.querySelector('h1, h2, h3, h4, h5, h6');
                if (headingInPrev) {
                    // Get the last heading in this element
                    const allHeadings = prev.querySelectorAll('h1, h2, h3, h4, h5, h6');
                    if (allHeadings.length > 0) {
                        precedingHeading = allHeadings[allHeadings.length - 1];
                        break;
                    }
                }
                prev = prev.previousElementSibling;
            }
            if (precedingHeading) break;

            // Move up to parent and continue search
            searchElement = searchElement.parentElement;
            if (!searchElement || searchElement.tagName === 'BODY') break;
        }

        console.log('Found target list element:', targetList);
        console.log('Preceding heading:', precedingHeading ? precedingHeading.textContent : 'none');

        // Get all UL elements in the document to find the index
        const previewElement = activeView.previewMode?.containerEl || activeView.contentEl;
        const allLists = Array.from(previewElement.querySelectorAll('ul.contains-task-list'));
        const listIndex = allLists.indexOf(targetList);

        console.log('List index in document:', listIndex, 'of', allLists.length);

        // Now find the corresponding task list in the editor
        const content = editor.getValue();
        const lines = content.split('\n');
        let insertLine = 0;
        let foundListCount = 0;
        let targetHeadingText = precedingHeading ? precedingHeading.textContent.trim() : null;

        // Strategy: If we have a heading, find that heading first, then find the next task list
        // If no heading, fall back to counting lists
        let searchStartLine = 0;

        if (targetHeadingText) {
            // Find the heading in the markdown
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('#') && line.includes(targetHeadingText)) {
                    searchStartLine = i + 1;
                    console.log('Found target heading at line', i, ':', line);
                    break;
                }
            }
        }

        // Find task lists starting from searchStartLine
        for (let i = searchStartLine; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check if this line starts a task (any status symbol)
            const isTaskLine = /^-\s+\[.\]/.test(line);

            if (isTaskLine) {
                // Check if this is the start of a new list (previous line is not a task)
                const prevLineIsTask = i > 0 && /^-\s+\[.\]/.test(lines[i-1].trim());
                const isNewList = i === 0 || !prevLineIsTask;

                if (isNewList) {
                    // If we have a heading, take the first list after the heading
                    // Otherwise, count lists until we reach listIndex
                    if (targetHeadingText || foundListCount === listIndex) {
                        // This is our target list! Find where it ends
                        insertLine = i + 1;
                        // Check all task status symbols: [ ], [x], [X], [-], [/], [>], [<], [?], [!], etc.
                        while (insertLine < lines.length) {
                            const nextLine = lines[insertLine].trim();
                            // Check if line starts with any task marker (- [ followed by any character and ])
                            const isTaskLine = /^-\s+\[.\]/.test(nextLine);
                            if (!isTaskLine) {
                                // Stop if we hit a non-task line
                                break;
                            }
                            insertLine++;
                        }
                        console.log('Found target list starting at line', i, 'ending at line', insertLine);
                        break;
                    }
                    foundListCount++;
                }
            }
        }

        console.log('Will insert new task at line:', insertLine);

        // STEP 4: Insert the new empty task line
        const newTaskText = '- [ ] ';
        if (insertLine >= lines.length) {
            // At end of document
            editor.replaceRange('\n' + newTaskText, { line: lines.length, ch: 0 });
            insertLine = lines.length;
        } else {
            // Insert at specific position
            editor.replaceRange(newTaskText + '\n', { line: insertLine, ch: 0 });
        }

        console.log('Inserted new task line');

        // STEP 5: Wait for insertion to complete
        await new Promise(resolve => setTimeout(resolve, 50));

        // STEP 6: Position cursor at the new task (after "- [ ] ")
        editor.setCursor({ line: insertLine, ch: 6 });
        console.log('Cursor positioned at line:', insertLine, 'ch: 6');

        // STEP 7: Focus the editor
        editor.focus();

        // STEP 8: Open the Tasks modal
        await new Promise(resolve => setTimeout(resolve, 50));

        const tasksCommand = this.app.commands.commands['obsidian-tasks-plugin:edit-task'];

        if (tasksCommand) {
            console.log('Opening Tasks modal');

            // Set up a watcher to detect when the modal closes
            // We'll check if we should return to reading mode
            const shouldReturnToReading = currentMode === 'preview';

            if (shouldReturnToReading) {
                // Watch for modal to close by checking for DOM changes
                this.setupModalWatcher(file, newActiveView);
            }

            if (tasksCommand.editorCheckCallback) {
                tasksCommand.editorCheckCallback(false, editor, newActiveView);
            } else if (tasksCommand.editorCallback) {
                tasksCommand.editorCallback(editor, newActiveView);
            } else {
                this.app.commands.executeCommandById('obsidian-tasks-plugin:edit-task');
            }
        } else {
            console.error('Tasks plugin command not found');
            new Notice(this.lang === 'de'
                ? 'Tasks Plugin ist nicht installiert.'
                : 'Tasks Plugin is not installed.', 5000);
        }
    }

    setupModalWatcher(file, view) {
        console.log('Setting up modal watcher to return to reading mode');

        // Check if modal exists
        const checkModalClosed = () => {
            const modal = document.querySelector('.modal.mod-task-modal, .modal-container');

            if (!modal) {
                console.log('Modal closed, returning to reading mode');

                // Switch back to reading mode
                const leaf = this.app.workspace.activeLeaf;
                leaf.setViewState({
                    type: 'markdown',
                    state: {
                        file: file.path,
                        mode: 'preview'
                    }
                }).then(() => {
                    console.log('Returned to reading mode');
                    // Clean up empty task lines after mode switch completes
                    setTimeout(() => this.checkAndCleanEmptyTasks(), 150);
                    // Update completion messages after a short delay
                    setTimeout(() => this.updateCompletedMessages(), 200);
                });
            } else {
                // Modal still open, check again
                setTimeout(checkModalClosed, 200);
            }
        };

        // Start checking after a short delay (to ensure modal has opened)
        setTimeout(checkModalClosed, 300);
    }

    async checkAndCleanEmptyTasks() {
        // Only clean if enabled in settings
        if (!this.settings.autoCleanEmptyTasks) return;

        const { MarkdownView } = require('obsidian');
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

        if (!activeView) return;

        const currentMode = activeView.getMode();

        // Only clean when switching to Reading Mode (preview)
        if (currentMode !== 'preview') return;

        const file = activeView.file;
        if (!file) return;

        // Read the file content
        const content = await this.app.vault.read(file);
        const lines = content.split('\n');
        let hasChanges = false;
        const newLines = [];

        // Filter out empty task lines
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Check if this is an empty task line (only checkbox, no text)
            const isEmptyTask = trimmed === '- [ ]' ||
                              trimmed === '- [x]' ||
                              trimmed === '- [X]' ||
                              /^- \[[xX ]\]$/.test(trimmed);

            if (isEmptyTask) {
                hasChanges = true;
                // Skip this line (don't add to newLines)
                console.log('Removing empty task line:', line);
            } else {
                newLines.push(line);
            }
        }

        // If we made changes, save the file
        if (hasChanges) {
            const newContent = newLines.join('\n');
            await this.app.vault.modify(file, newContent);
            console.log('Cleaned up empty task lines');
        }
    }

    onunload() {
        console.log('Unloading Toggle Completed Tasks Plugin');
        document.body.classList.remove('hide-completed-tasks');

        // Remove injected style
        const style = document.getElementById('toggle-completed-tasks-i18n');
        if (style) style.remove();
    }
};

// Settings Tab
class ToggleCompletedTasksSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        // Get language for localized descriptions
        const isGerman = this.plugin.lang === 'de';

        containerEl.createEl('h2', { text: isGerman ? 'Toggle Completed Tasks Einstellungen' : 'Toggle Completed Tasks Settings' });

        // Auto-clean empty tasks
        new Setting(containerEl)
            .setName(isGerman ? 'Leere Aufgaben automatisch löschen' : 'Auto-clean empty tasks')
            .setDesc(isGerman
                ? 'Entfernt automatisch leere Aufgabenzeilen (nur Checkbox, kein Text) beim Wechsel in den Lesemodus.'
                : 'Automatically removes empty task lines (only checkbox, no text) when switching to Reading Mode.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoCleanEmptyTasks)
                .onChange(async (value) => {
                    this.plugin.settings.autoCleanEmptyTasks = value;
                    await this.plugin.saveSettings();
                }));

        // Show edit icons
        new Setting(containerEl)
            .setName(isGerman ? 'Bearbeiten-Icons anzeigen' : 'Show edit icons')
            .setDesc(isGerman
                ? 'Zeigt ein 📝 Icon neben jeder Aufgabe im Lesemodus zum schnellen Bearbeiten.'
                : 'Shows a 📝 icon next to each task in Reading Mode for quick editing.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showEditIcons)
                .onChange(async (value) => {
                    this.plugin.settings.showEditIcons = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateCompletedMessages();
                }));

        // Show "Add Task" link
        new Setting(containerEl)
            .setName(isGerman ? '"Neue Aufgabe erstellen" Link anzeigen' : 'Show "Create new task" link')
            .setDesc(isGerman
                ? 'Zeigt einen klickbaren Link zum Hinzufügen neuer Aufgaben, wenn noch offene Aufgaben existieren.'
                : 'Shows a clickable link to add new tasks when incomplete tasks exist.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showAddTaskLink)
                .onChange(async (value) => {
                    this.plugin.settings.showAddTaskLink = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateCompletedMessages();
                }));

        // Show completed message
        new Setting(containerEl)
            .setName(isGerman ? '"Alle Aufgaben erledigt" Nachricht anzeigen' : 'Show "All tasks completed" message')
            .setDesc(isGerman
                ? 'Zeigt eine Nachricht, wenn alle Aufgaben in einer Liste erledigt sind.'
                : 'Shows a message when all tasks in a list are completed.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showCompletedMessage)
                .onChange(async (value) => {
                    this.plugin.settings.showCompletedMessage = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateCompletedMessages();
                }));

        // Completed message clickable
        new Setting(containerEl)
            .setName(isGerman ? '"Alle Aufgaben erledigt" Nachricht klickbar machen' : 'Make "All tasks completed" message clickable')
            .setDesc(isGerman
                ? 'Macht die "Alle Aufgaben erledigt" Nachricht klickbar, um eine neue Aufgabe hinzuzufügen.'
                : 'Makes the "All tasks completed" message clickable to add a new task.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.completedMessageClickable)
                .onChange(async (value) => {
                    this.plugin.settings.completedMessageClickable = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateCompletedMessages();
                }));
    }
}
