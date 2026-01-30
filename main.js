const { Plugin, Notice, PluginSettingTab, Setting } = require('obsidian');

// Default Settings
const DEFAULT_SETTINGS = {
    hideCompleted: true,          // Main toggle: hide completed tasks
    showRecentCompleted: false,   // Secondary toggle: show recently completed when hiding
    recentDays: 3,                // Days to show recently completed tasks (1-7)
    hideCancelled: true,          // Also hide cancelled tasks ([-] with ❌ date)
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
        commandNameRecent: 'Toggle recently completed visibility',
        notificationHidden: 'Completed tasks: hidden',
        notificationVisible: 'Completed tasks: visible',
        notificationRecentVisible: 'Showing: open + recently completed',
        allTasksCompleted: '-All tasks completed-',
        markAllOpen: '↩ Mark all as open',
        markedOpenNotice: 'tasks marked as open'
    },
    de: {
        ribbonTooltip: 'Erledigte Aufgaben ein/ausblenden',
        commandName: 'Erledigte Aufgaben ein/ausblenden',
        commandNameRecent: 'Kürzlich erledigte ein/ausblenden',
        notificationHidden: 'Erledigte Aufgaben: ausgeblendet',
        notificationVisible: 'Erledigte Aufgaben: sichtbar',
        notificationRecentVisible: 'Zeige: offen + kürzlich erledigt',
        allTasksCompleted: '-Alle Aufgaben erledigt-',
        markAllOpen: '↩ Alle als offen markieren',
        markedOpenNotice: 'Aufgaben als offen markiert'
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

        // Add view action button (next to the 3-dots menu in title bar)
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.addViewActionButton();
            })
        );
        // Also add on initial load
        this.addViewActionButton();

        // Add command (for Command Palette)
        this.addCommand({
            id: 'toggle-completed-tasks',
            name: this.t.commandName,
            callback: () => {
                this.toggleCompletedTasks();
            }
        });

        // Add command for toggling recently completed visibility
        this.addCommand({
            id: 'toggle-recent-completed',
            name: this.t.commandNameRecent,
            callback: () => {
                this.toggleRecentCompleted();
            }
        });

        // Add menu items to the file menu (3 dots menu)
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                // Add separator
                menu.addSeparator();

                // Main toggle: Hide/Show completed tasks
                menu.addItem((item) => {
                    const isHiding = this.settings.hideCompleted;
                    item
                        .setTitle(isHiding
                            ? (this.lang === 'de' ? '☑ Erledigte ausgeblendet' : '☑ Completed hidden')
                            : (this.lang === 'de' ? '☐ Erledigte eingeblendet' : '☐ Completed visible'))
                        .setIcon(isHiding ? 'eye-off' : 'eye')
                        .onClick(() => {
                            this.toggleCompletedTasks();
                        });
                });

                // Secondary toggle: Show recently completed (only when hiding)
                if (this.settings.hideCompleted) {
                    menu.addItem((item) => {
                        const showRecent = this.settings.showRecentCompleted;
                        item
                            .setTitle(showRecent
                                ? (this.lang === 'de' ? `  ☑ Kürzlich erledigte (${this.settings.recentDays} Tage)` : `  ☑ Recently completed (${this.settings.recentDays} days)`)
                                : (this.lang === 'de' ? '  ☐ Kürzlich erledigte anzeigen' : '  ☐ Show recently completed'))
                            .setIcon(showRecent ? 'clock' : 'clock')
                            .onClick(() => {
                                this.toggleRecentCompleted();
                            });
                    });

                    // Days submenu (only when showRecentCompleted is enabled)
                    if (this.settings.showRecentCompleted) {
                        menu.addItem((item) => {
                            item
                                .setTitle(this.lang === 'de' ? '    Zeitraum ändern...' : '    Change days...')
                                .setIcon('calendar')
                                .onClick(() => {
                                    // Show a submenu with day options
                                    const daysMenu = new (require('obsidian').Menu)();
                                    for (let d = 1; d <= 7; d++) {
                                        const isSelected = this.settings.recentDays === d;
                                        daysMenu.addItem((dayItem) => {
                                            dayItem
                                                .setTitle(isSelected
                                                    ? `☑ ${d} ${this.lang === 'de' ? (d === 1 ? 'Tag' : 'Tage') : (d === 1 ? 'day' : 'days')}`
                                                    : `☐ ${d} ${this.lang === 'de' ? (d === 1 ? 'Tag' : 'Tage') : (d === 1 ? 'day' : 'days')}`)
                                                .onClick(async () => {
                                                    this.settings.recentDays = d;
                                                    await this.saveSettings();
                                                    this.applyState();
                                                    new Notice(this.lang === 'de'
                                                        ? `Zeitraum: ${d} ${d === 1 ? 'Tag' : 'Tage'}`
                                                        : `Period: ${d} ${d === 1 ? 'day' : 'days'}`);
                                                });
                                        });
                                    }
                                    daysMenu.showAtMouseEvent(event);
                                });
                        });
                    }
                }
            })
        );

        // Apply initial state
        this.applyState();

        // Update CSS with localized message
        this.updateCSSMessage();

        // Add observers to update messages when content changes
        this.registerDomEvent(document, 'click', (evt) => {
            // Check if a checkbox was clicked
            const target = evt.target;
            if (target && (target.type === 'checkbox' || target.closest('.task-list-item'))) {
                // Checkbox click - apply state after a delay to let Obsidian update the file
                setTimeout(() => this.applyState(), 100);
                setTimeout(() => this.applyState(), 300); // Double-check after file save
                setTimeout(() => this.applyState(), 600); // Triple-check for slow saves
            } else {
                setTimeout(() => this.updateCompletedMessages(), 50);
            }
        });

        // Watch for task checkbox changes
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                setTimeout(() => this.applyState(), 50);
            })
        );

        // Watch for file modifications (when tasks are checked/unchecked)
        this.registerEvent(
            this.app.vault.on('modify', () => {
                // Re-apply state when any file is modified (task toggled)
                setTimeout(() => this.applyState(), 100);
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

        // Watch for Tasks Plugin query results being added to the DOM
        this.setupTasksQueryObserver();
    }

    /**
     * Add a button to the view title bar (next to the 3-dots menu)
     */
    addViewActionButton() {
        const { MarkdownView } = require('obsidian');

        // Get all markdown leaves
        this.app.workspace.iterateAllLeaves((leaf) => {
            if (leaf.view instanceof MarkdownView) {
                const viewActionsEl = leaf.view.containerEl.querySelector('.view-actions');
                if (!viewActionsEl) return;

                // Check if button already exists
                if (viewActionsEl.querySelector('.toggle-completed-tasks-btn')) return;

                // Create the button
                const btn = document.createElement('a');
                btn.className = 'view-action clickable-icon toggle-completed-tasks-btn';
                btn.setAttribute('aria-label', this.settings.hideCompleted
                    ? (this.lang === 'de' ? 'Erledigte: ausgeblendet' : 'Completed: hidden')
                    : (this.lang === 'de' ? 'Erledigte: sichtbar' : 'Completed: visible'));

                // Set icon based on state
                this.updateButtonIcon(btn);

                // Add click handler
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleCompletedTasks();
                    // Update button after toggle
                    this.updateAllViewActionButtons();
                });

                // Insert before the 3-dots menu (last element)
                const moreOptionsBtn = viewActionsEl.querySelector('.view-action[aria-label="More options"]') ||
                                       viewActionsEl.querySelector('.view-action:last-child');
                if (moreOptionsBtn) {
                    viewActionsEl.insertBefore(btn, moreOptionsBtn);
                } else {
                    viewActionsEl.appendChild(btn);
                }
            }
        });
    }

    /**
     * Update the icon of a view action button based on current state
     */
    updateButtonIcon(btn) {
        // Clear existing content
        btn.innerHTML = '';

        // Use Obsidian's icon system
        const iconName = this.settings.hideCompleted ? 'eye-off' : 'eye';
        const { setIcon } = require('obsidian');
        setIcon(btn, iconName);

        // Update aria-label
        btn.setAttribute('aria-label', this.settings.hideCompleted
            ? (this.lang === 'de' ? 'Erledigte: ausgeblendet' : 'Completed: hidden')
            : (this.lang === 'de' ? 'Erledigte: sichtbar' : 'Completed: visible'));
    }

    /**
     * Update all view action buttons after state change
     */
    updateAllViewActionButtons() {
        document.querySelectorAll('.toggle-completed-tasks-btn').forEach(btn => {
            this.updateButtonIcon(btn);
        });
    }

    setupTasksQueryObserver() {
        // Create a MutationObserver to watch for Tasks Plugin query results
        this.tasksQueryObserver = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    // Check if any added nodes contain Tasks Plugin query results
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList?.contains('plugin-tasks-query-result') ||
                                node.querySelector?.('.plugin-tasks-query-result')) {
                                shouldUpdate = true;
                                break;
                            }
                        }
                    }
                }
                if (shouldUpdate) break;
            }
            if (shouldUpdate) {
                // Delay to ensure Tasks Plugin has finished rendering
                setTimeout(() => this.addReopenLinksToTasksQueries(), 100);
            }
        });

        // Start observing the document body
        this.tasksQueryObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
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

        // Migration: sync visibilityMode with legacy hideCompleted setting
        if (this.settings.visibilityMode === undefined) {
            this.settings.visibilityMode = this.settings.hideCompleted ? 'hideCompleted' : 'showAll';
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    toggleCompletedTasks() {
        // Simple toggle: show all <-> hide completed
        // The "show recent" option is controlled separately in settings
        this.settings.hideCompleted = !this.settings.hideCompleted;

        let statusText;
        if (this.settings.hideCompleted) {
            if (this.settings.showRecentCompleted) {
                statusText = this.t.notificationRecentVisible;
            } else {
                statusText = this.t.notificationHidden;
            }
        } else {
            statusText = this.t.notificationVisible;
        }

        this.saveSettings();
        this.applyState();
        this.updateAllViewActionButtons();

        new Notice(statusText);
    }

    toggleRecentCompleted() {
        // Toggle showing recently completed tasks (only works when hideCompleted is true)
        if (!this.settings.hideCompleted) return;

        this.settings.showRecentCompleted = !this.settings.showRecentCompleted;

        let statusText;
        if (this.settings.showRecentCompleted) {
            statusText = this.t.notificationRecentVisible;
        } else {
            statusText = this.t.notificationHidden;
        }

        this.saveSettings();
        this.applyState();

        new Notice(statusText);
    }

    applyState() {
        const body = document.body;

        // Remove all visibility classes first
        body.classList.remove('hide-completed-tasks');
        body.classList.remove('show-recent-completed-tasks');
        body.classList.remove('hide-cancelled-tasks');

        if (this.settings.hideCompleted) {
            if (this.settings.showRecentCompleted) {
                // Hide completed but show recently completed
                body.classList.add('show-recent-completed-tasks');
                this.filterRecentCompletedTasks();
            } else {
                // Hide all completed
                body.classList.add('hide-completed-tasks');
            }

            // Apply cancelled task filter if enabled
            if (this.settings.hideCancelled) {
                body.classList.add('hide-cancelled-tasks');
                this.filterCancelledTasks();
            }
        }
        // else: show all - no classes needed

        // Update completion messages
        setTimeout(() => this.updateCompletedMessages(), 100);
    }

    /**
     * Parse completion date from task text (e.g., "✅ 2026-01-18")
     * Returns Date object or null if not found
     */
    parseCompletionDate(taskText) {
        // Match patterns like "✅ 2026-01-18" or "✅2026-01-18"
        const match = taskText.match(/✅\s*(\d{4}-\d{2}-\d{2})/);
        if (match) {
            return new Date(match[1]);
        }
        return null;
    }

    /**
     * Check if a date is within the recent days threshold
     * 1 day = only today, 2 days = today + yesterday, etc.
     */
    isWithinRecentDays(completionDate) {
        if (!completionDate) return false;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const completedDay = new Date(completionDate.getFullYear(), completionDate.getMonth(), completionDate.getDate());

        const diffTime = today - completedDay;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // 1 day = only today (diffDays < 1), 2 days = today + yesterday (diffDays < 2), etc.
        return diffDays < this.settings.recentDays;
    }

    /**
     * Filter completed tasks to show only recently completed ones
     */
    filterRecentCompletedTasks() {
        // Find all completed task items in Reading View
        const completedTasks = document.querySelectorAll('.markdown-reading-view .task-list-item.is-checked');

        completedTasks.forEach(task => {
            // Skip tasks in Tasks Plugin query results
            if (this.isInTasksQuery(task)) return;

            // Skip non-completed status symbols
            const dataTask = task.getAttribute('data-task');
            if (dataTask && dataTask !== 'x' && dataTask !== 'X') return;

            const taskText = task.textContent || '';
            const completionDate = this.parseCompletionDate(taskText);

            if (completionDate && this.isWithinRecentDays(completionDate)) {
                // Show this task - it was completed recently
                task.classList.add('recent-completed-visible');
            } else if (completionDate) {
                // Hide this task - it was completed too long ago
                task.classList.add('recent-completed-hidden');
            } else {
                // No completion date found - hide it (treat as old)
                task.classList.add('recent-completed-hidden');
            }
        });
    }

    /**
     * Filter cancelled tasks ([-] with ❌ date)
     */
    filterCancelledTasks() {
        if (!this.settings.hideCancelled) return;

        // Find all cancelled task items in Reading View
        // Cancelled tasks have data-task="-"
        const cancelledTasks = document.querySelectorAll('.markdown-reading-view .task-list-item[data-task="-"]');

        cancelledTasks.forEach(task => {
            // Skip tasks in Tasks Plugin query results
            if (this.isInTasksQuery(task)) return;

            // Hide the cancelled task
            task.classList.add('cancelled-task-hidden');
        });
    }

    updateCompletedMessages() {
        // Remove old messages and icons
        document.querySelectorAll('.toggle-tasks-completion-message').forEach(el => el.remove());
        document.querySelectorAll('.toggle-tasks-add-task-link').forEach(el => el.remove());
        document.querySelectorAll('.toggle-tasks-edit-icon').forEach(el => el.remove());
        document.querySelectorAll('.toggle-tasks-reopen-link').forEach(el => el.remove());

        // Clear recent-completed visibility classes
        document.querySelectorAll('.recent-completed-visible').forEach(el => el.classList.remove('recent-completed-visible'));
        document.querySelectorAll('.recent-completed-hidden').forEach(el => el.classList.remove('recent-completed-hidden'));
        document.querySelectorAll('.cancelled-task-hidden').forEach(el => el.classList.remove('cancelled-task-hidden'));

        // Re-apply recent completed filtering if in that mode
        if (this.settings.hideCompleted && this.settings.showRecentCompleted) {
            this.filterRecentCompletedTasks();
        }

        // Re-apply cancelled task filtering if enabled and hiding completed
        if (this.settings.hideCancelled && this.settings.hideCompleted) {
            this.filterCancelledTasks();
        }

        // Find all task lists in Reading View
        const readingViewLists = document.querySelectorAll('.markdown-reading-view ul.contains-task-list');
        readingViewLists.forEach(list => {
            if (this.isInTasksQuery(list)) return;

            // Always add edit icons to all tasks
            this.addEditIconsToTasks(list);

            // Only add completion messages if hiding completed tasks
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

        // Add "Mark all as open" link to Tasks Plugin query results that have completed tasks
        this.addReopenLinksToTasksQueries();
    }

    /**
     * Add "Mark all as open" links to Tasks Plugin query results
     */
    addReopenLinksToTasksQueries() {
        // Find all Tasks Plugin query result UL elements
        // The structure is: .block-language-tasks > ul.plugin-tasks-query-result
        const queryLists = document.querySelectorAll('ul.plugin-tasks-query-result');
        console.log('Tasks Plugin: Found query lists:', queryLists.length);

        queryLists.forEach((list, index) => {
            // Find completed tasks in this query result
            const completedTasks = list.querySelectorAll('.task-list-item.is-checked');
            console.log(`List ${index}: Found ${completedTasks.length} completed tasks`);

            // Only add the link if there are completed tasks
            if (completedTasks.length === 0) return;

            // Check if already has a reopen link (check after the list)
            const nextSibling = list.nextElementSibling;
            if (nextSibling && nextSibling.classList.contains('toggle-tasks-reopen-link')) return;

            // Create the "Mark all as open" link
            const reopenLink = document.createElement('a');
            reopenLink.className = 'toggle-tasks-reopen-link';
            reopenLink.textContent = this.t.markAllOpen;
            reopenLink.href = '#';
            reopenLink.style.cssText = 'display: block; color: #f59e0b; font-size: 0.85em; padding: 4px 0; margin-top: 4px; margin-bottom: 8px; cursor: pointer; text-decoration: none;';

            // Add hover effect
            reopenLink.addEventListener('mouseenter', () => {
                reopenLink.style.textDecoration = 'underline';
            });
            reopenLink.addEventListener('mouseleave', () => {
                reopenLink.style.textDecoration = 'none';
            });

            // Add click handler
            reopenLink.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Get all completed task elements from this query list
                const tasksToReopen = Array.from(list.querySelectorAll('.task-list-item.is-checked'));
                console.log('Reopening tasks:', tasksToReopen.length);
                await this.reopenTasks(tasksToReopen);
            });

            // Insert the link after the list
            list.after(reopenLink);
            console.log('Added reopen link after list', index);
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

        // Save scroll position before any changes
        const scrollContainer = activeView.containerEl.querySelector('.markdown-preview-view') ||
                               activeView.containerEl.querySelector('.cm-scroller') ||
                               activeView.contentEl;
        const savedScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
        console.log('Saved scroll position:', savedScrollTop);

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
                this.setupModalWatcher(file, newActiveView, savedScrollTop, taskItem, null);
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

        // Save scroll position before any changes
        const scrollContainer = activeView.containerEl.querySelector('.markdown-preview-view') ||
                               activeView.containerEl.querySelector('.cm-scroller') ||
                               activeView.contentEl;
        const savedScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
        console.log('Saved scroll position:', savedScrollTop);

        // Also save the position of the clicked element relative to viewport
        const listRect = listElement ? listElement.getBoundingClientRect() : null;
        const viewportOffset = listRect ? listRect.top : null;
        console.log('List element viewport offset:', viewportOffset);

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
                // Pass scroll position and list element info for restoration
                this.setupModalWatcher(file, newActiveView, savedScrollTop, listElement, viewportOffset);
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

    setupModalWatcher(file, view, savedScrollTop, listElement, viewportOffset) {
        console.log('Setting up modal watcher to return to reading mode');
        console.log('Will restore scroll to:', savedScrollTop, 'viewport offset:', viewportOffset);

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

                    // Restore scroll position after a delay to let the view render
                    setTimeout(() => this.restoreScrollPosition(savedScrollTop, viewportOffset), 250);
                    // Double-check scroll restoration after content fully loads
                    setTimeout(() => this.restoreScrollPosition(savedScrollTop, viewportOffset), 500);
                });
            } else {
                // Modal still open, check again
                setTimeout(checkModalClosed, 200);
            }
        };

        // Start checking after a short delay (to ensure modal has opened)
        setTimeout(checkModalClosed, 300);
    }

    /**
     * Restore scroll position after returning to reading mode
     */
    restoreScrollPosition(savedScrollTop, viewportOffset) {
        const { MarkdownView } = require('obsidian');
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) return;

        const scrollContainer = activeView.containerEl.querySelector('.markdown-preview-view') ||
                               activeView.containerEl.querySelector('.cm-scroller') ||
                               activeView.contentEl;

        if (scrollContainer && savedScrollTop !== null) {
            console.log('Restoring scroll position to:', savedScrollTop);
            scrollContainer.scrollTop = savedScrollTop;
        }
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

    /**
     * Mark multiple tasks as open by removing checkmark and completion date
     * @param {Array} taskElements - Array of task DOM elements from Tasks Plugin query
     */
    async reopenTasks(taskElements) {
        if (!taskElements || taskElements.length === 0) return;

        const { MarkdownView } = require('obsidian');

        // Collect all unique files and their task modifications
        const fileModifications = new Map();

        for (const taskEl of taskElements) {
            let filePath = null;

            // Method 1: Try to find backlink with data-href attribute
            const backlinkWithHref = taskEl.querySelector('a[data-href]');
            if (backlinkWithHref) {
                const href = backlinkWithHref.getAttribute('data-href');
                if (href) {
                    filePath = href.split('#')[0];
                }
            }

            // Method 2: Try to extract file path from Tasks Plugin backlink text
            if (!filePath) {
                const tasksBacklink = taskEl.querySelector('.tasks-backlink a');
                if (tasksBacklink) {
                    const linkText = tasksBacklink.textContent || '';
                    // Format is "Filename > Heading" or just "Filename"
                    const fileNameMatch = linkText.split(' > ')[0].trim();
                    if (fileNameMatch) {
                        // Try to find the file by name
                        const allFiles = this.app.vault.getMarkdownFiles();
                        const matchingFile = allFiles.find(f =>
                            f.basename === fileNameMatch ||
                            f.path === fileNameMatch ||
                            f.path === fileNameMatch + '.md'
                        );
                        if (matchingFile) {
                            filePath = matchingFile.path;
                        }
                    }
                }
            }

            // Method 3: Try to find file path from data attributes
            if (!filePath) {
                const listItem = taskEl.closest('li');
                if (listItem) {
                    const dataFile = listItem.getAttribute('data-task-file') ||
                                    listItem.getAttribute('data-file');
                    if (dataFile) filePath = dataFile;
                }
            }

            if (!filePath) {
                console.log('Could not find file path for task:', taskEl.textContent?.substring(0, 50));
                continue;
            }

            console.log('Found file path:', filePath);

            // Get the task description (text content without metadata)
            const taskDescription = this.extractTaskDescription(taskEl);

            if (!fileModifications.has(filePath)) {
                fileModifications.set(filePath, []);
            }
            fileModifications.get(filePath).push(taskDescription);
        }

        let totalModified = 0;

        // Process each file
        for (const [filePath, taskDescriptions] of fileModifications) {
            const file = this.app.vault.getAbstractFileByPath(filePath);
            if (!file) continue;

            let content = await this.app.vault.read(file);
            let modified = false;

            for (const taskDesc of taskDescriptions) {
                // Find and modify the task line
                const lines = content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];

                    // Check if this is a completed task
                    if (/^(\s*)-\s+\[[xX]\]/.test(line)) {
                        // Normalize both strings for comparison:
                        // - Remove markdown formatting (**bold**, *italic*, etc.)
                        // - Remove extra whitespace
                        // - Compare core text
                        const normalizedLine = this.normalizeForComparison(line);
                        const normalizedDesc = this.normalizeForComparison(taskDesc);

                        // Check if the normalized description is found in the normalized line
                        if (normalizedLine.includes(normalizedDesc) && normalizedDesc.length > 10) {
                            console.log('Matched task:', taskDesc.substring(0, 50));
                            // Replace [x] or [X] with [ ]
                            let newLine = line.replace(/^(\s*-\s+)\[[xX]\]/, '$1[ ]');

                            // Remove completion date (✅ YYYY-MM-DD)
                            newLine = newLine.replace(/\s*✅\s*\d{4}-\d{2}-\d{2}/, '');

                            lines[i] = newLine;
                            modified = true;
                            totalModified++;
                            break;
                        }
                    }
                }
                content = lines.join('\n');
            }

            if (modified) {
                await this.app.vault.modify(file, content);
            }
        }

        if (totalModified > 0) {
            new Notice(`${totalModified} ${this.t.markedOpenNotice}`);

            // Refresh the view
            setTimeout(() => this.updateCompletedMessages(), 200);
        }
    }

    /**
     * Normalize a string for comparison by removing markdown formatting and extra whitespace
     */
    normalizeForComparison(text) {
        return text
            // Remove markdown bold/italic
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/_([^_]+)_/g, '$1')
            // Remove markdown links [text](url) -> text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Remove task checkbox
            .replace(/^(\s*)-\s+\[[xX ]\]\s*/, '')
            // Remove dates and emojis
            .replace(/[📅⏳🛫➕✅❌🔁⏫🔼🔽⏬]\s*\d{4}-\d{2}-\d{2}/g, '')
            .replace(/[📅⏳🛫➕✅❌🔁⏫🔼🔽⏬]/g, '')
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    /**
     * Extract the core task description from a Tasks Plugin query result element
     */
    extractTaskDescription(taskEl) {
        // Clone to avoid modifying original
        const clone = taskEl.cloneNode(true);

        // Remove common Tasks Plugin elements
        const elementsToRemove = [
            '.task-backlink',
            '.tasks-backlink',
            '.task-due',
            '.task-scheduled',
            '.task-start',
            '.task-created',
            '.task-done',
            '.task-priority',
            '.task-recurrence',
            '.task-tags',
            '.toggle-tasks-edit-icon',
            '.toggle-tasks-reopen-link',
            'input[type="checkbox"]'
        ];

        elementsToRemove.forEach(selector => {
            clone.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Get remaining text and clean it up
        let text = clone.textContent.trim();

        // Remove common metadata patterns that might remain
        text = text.replace(/📅\s*\d{4}-\d{2}-\d{2}/g, ''); // Due date
        text = text.replace(/⏳\s*\d{4}-\d{2}-\d{2}/g, ''); // Scheduled
        text = text.replace(/🛫\s*\d{4}-\d{2}-\d{2}/g, ''); // Start
        text = text.replace(/➕\s*\d{4}-\d{2}-\d{2}/g, ''); // Created
        text = text.replace(/✅\s*\d{4}-\d{2}-\d{2}/g, ''); // Done
        text = text.replace(/🔁\s*[^\s]+/g, ''); // Recurrence
        text = text.replace(/[⏫🔼🔽⏬]/g, ''); // Priority

        return text.trim();
    }

    onunload() {
        console.log('Unloading Toggle Completed Tasks Plugin');

        // Stop the MutationObserver
        if (this.tasksQueryObserver) {
            this.tasksQueryObserver.disconnect();
        }

        document.body.classList.remove('hide-completed-tasks');
        document.body.classList.remove('show-recent-completed-tasks');
        document.body.classList.remove('hide-cancelled-tasks');

        // Clean up recent-completed classes
        document.querySelectorAll('.recent-completed-visible').forEach(el => el.classList.remove('recent-completed-visible'));
        document.querySelectorAll('.recent-completed-hidden').forEach(el => el.classList.remove('recent-completed-hidden'));
        document.querySelectorAll('.cancelled-task-hidden').forEach(el => el.classList.remove('cancelled-task-hidden'));

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

        // Main toggle: Hide completed tasks
        new Setting(containerEl)
            .setName(isGerman ? 'Erledigte Aufgaben ausblenden' : 'Hide completed tasks')
            .setDesc(isGerman
                ? 'Blendet alle erledigten Aufgaben ([x]) aus.'
                : 'Hides all completed tasks ([x]).')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.hideCompleted)
                .onChange(async (value) => {
                    this.plugin.settings.hideCompleted = value;
                    await this.plugin.saveSettings();
                    this.plugin.applyState();
                    // Refresh settings display to show/hide dependent settings
                    this.display();
                }));

        // Secondary toggle: Show recently completed (only visible when hideCompleted is true)
        if (this.plugin.settings.hideCompleted) {
            new Setting(containerEl)
                .setName(isGerman ? 'Kürzlich erledigte anzeigen' : 'Show recently completed')
                .setDesc(isGerman
                    ? 'Zeigt Aufgaben an, die in den letzten X Tagen erledigt wurden (basierend auf ✅ Datum).'
                    : 'Shows tasks that were completed in the last X days (based on ✅ date).')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.showRecentCompleted)
                    .onChange(async (value) => {
                        this.plugin.settings.showRecentCompleted = value;
                        await this.plugin.saveSettings();
                        this.plugin.applyState();
                        // Refresh settings display to show/hide dependent settings
                        this.display();
                    }));

            // Recent days setting (only visible when showRecentCompleted is true)
            if (this.plugin.settings.showRecentCompleted) {
                new Setting(containerEl)
                    .setName(isGerman ? 'Anzahl Tage' : 'Number of days')
                    .setDesc(isGerman
                        ? 'Anzahl der Tage, für die erledigte Aufgaben angezeigt werden.'
                        : 'Number of days to show completed tasks.')
                    .addDropdown(dropdown => dropdown
                        .addOption('1', '1')
                        .addOption('2', '2')
                        .addOption('3', '3')
                        .addOption('4', '4')
                        .addOption('5', '5')
                        .addOption('6', '6')
                        .addOption('7', '7')
                        .setValue(String(this.plugin.settings.recentDays))
                        .onChange(async (value) => {
                            this.plugin.settings.recentDays = parseInt(value);
                            await this.plugin.saveSettings();
                            this.plugin.applyState();
                        }));
            }
        }

        // Hide cancelled tasks
        new Setting(containerEl)
            .setName(isGerman ? 'Gecancelte Aufgaben ausblenden' : 'Hide cancelled tasks')
            .setDesc(isGerman
                ? 'Blendet abgebrochene Aufgaben ([-] mit ❌ Datum) aus, wenn erledigte Aufgaben ausgeblendet sind.'
                : 'Hides cancelled tasks ([-] with ❌ date) when completed tasks are hidden.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.hideCancelled)
                .onChange(async (value) => {
                    this.plugin.settings.hideCancelled = value;
                    await this.plugin.saveSettings();
                    this.plugin.applyState();
                }));

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
