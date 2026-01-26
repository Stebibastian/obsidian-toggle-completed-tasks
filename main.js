const { Plugin, Notice } = require('obsidian');

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
        this.settings = Object.assign({ hideCompleted: true }, await this.loadData());
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
        if (!this.settings.hideCompleted) return;

        // Remove old messages
        document.querySelectorAll('.toggle-tasks-completion-message').forEach(el => el.remove());
        document.querySelectorAll('.toggle-tasks-add-task-link').forEach(el => el.remove());

        // Find all task lists in Reading View
        const readingViewLists = document.querySelectorAll('.markdown-reading-view ul.contains-task-list');
        readingViewLists.forEach(list => {
            if (this.isInTasksQuery(list)) return;

            if (this.isListFullyCompleted(list)) {
                this.addCompletionMessage(list);
            } else {
                // List has incomplete tasks, add "create new task" link
                this.addNewTaskLink(list);
            }
        });
    }

    isListFullyCompleted(list) {
        const allItems = list.querySelectorAll('.task-list-item');
        const checkedItems = list.querySelectorAll('.task-list-item.is-checked');
        return allItems.length > 0 && allItems.length === checkedItems.length;
    }

    isInTasksQuery(element) {
        return element.closest('.plugin-tasks-query-result') !== null ||
               element.closest('[class*="tasks-"]') !== null ||
               element.closest('[class*="block-language-tasks"]') !== null;
    }

    addCompletionMessage(list) {
        const message = document.createElement('a');
        message.className = 'toggle-tasks-completion-message';
        message.textContent = this.t.allTasksCompleted;
        message.style.cssText = 'display: block; color: #10b981; font-style: italic; padding: 0; text-align: left; margin-top: -0.8em; margin-bottom: 1em; cursor: pointer; text-decoration: underline;';
        message.href = '#';

        // Store reference to the list element for later use
        message.dataset.listElement = 'true';

        // Add click handler to open Tasks plugin modal
        message.addEventListener('click', (e) => {
            e.preventDefault();
            this.openTasksModal(list);
        });

        list.after(message);
    }

    addNewTaskLink(list) {
        const link = document.createElement('a');
        link.className = 'toggle-tasks-add-task-link';
        link.textContent = this.lang === 'de' ? '+ Neue Aufgabe erstellen' : '+ Create new task';
        link.style.cssText = 'display: block; color: #6366f1; font-size: 0.9em; padding: 0; text-align: left; margin-top: -0.4em; margin-bottom: 1em; cursor: pointer; text-decoration: none;';
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
        // We need to find which UL element in the DOM corresponds to the listElement
        let targetList = listElement;

        // Walk up to find the UL parent
        while (targetList && targetList.tagName !== 'UL') {
            targetList = targetList.previousElementSibling;
            if (!targetList) {
                // If we can't find it via previousSibling, try parent
                targetList = listElement.parentElement;
                while (targetList && targetList.tagName !== 'UL') {
                    targetList = targetList.parentElement;
                }
                break;
            }
        }

        if (!targetList) {
            console.error('Could not find task list element');
            return;
        }

        console.log('Found target list element:', targetList);

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

        // Find all task lists and count them until we reach our target
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check if this line starts a task (completed or not)
            if (line.startsWith('- [x]') || line.startsWith('- [X]') || line.startsWith('- [ ]')) {
                // Check if this is the start of a new list (previous line is not a task)
                const isNewList = i === 0 ||
                    !(lines[i-1].trim().startsWith('- [x]') ||
                      lines[i-1].trim().startsWith('- [X]') ||
                      lines[i-1].trim().startsWith('- [ ]'));

                if (isNewList) {
                    // This is the start of a task list
                    if (foundListCount === listIndex) {
                        // This is our target list! Find where it ends
                        insertLine = i + 1;
                        while (insertLine < lines.length && (
                            lines[insertLine].trim().startsWith('- [x]') ||
                            lines[insertLine].trim().startsWith('- [X]') ||
                            lines[insertLine].trim().startsWith('- [ ]')
                        )) {
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
                    // Update completion messages after a short delay
                    setTimeout(() => this.updateCompletedMessages(), 100);
                });
            } else {
                // Modal still open, check again
                setTimeout(checkModalClosed, 200);
            }
        };

        // Start checking after a short delay (to ensure modal has opened)
        setTimeout(checkModalClosed, 300);
    }

    onunload() {
        console.log('Unloading Toggle Completed Tasks Plugin');
        document.body.classList.remove('hide-completed-tasks');

        // Remove injected style
        const style = document.getElementById('toggle-completed-tasks-i18n');
        if (style) style.remove();
    }
};
