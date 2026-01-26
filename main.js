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

        // Find all task lists in Reading View
        const readingViewLists = document.querySelectorAll('.markdown-reading-view ul.contains-task-list');
        readingViewLists.forEach(list => {
            if (this.isListFullyCompleted(list) && !this.isInTasksQuery(list)) {
                this.addCompletionMessage(list);
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
        const message = document.createElement('div');
        message.className = 'toggle-tasks-completion-message';
        message.textContent = this.t.allTasksCompleted;
        message.style.cssText = 'display: block; color: #10b981; font-style: italic; padding: 0; text-align: left; margin-top: -0.8em; margin-bottom: 1em;';
        list.after(message);
    }

    onunload() {
        console.log('Unloading Toggle Completed Tasks Plugin');
        document.body.classList.remove('hide-completed-tasks');

        // Remove injected style
        const style = document.getElementById('toggle-completed-tasks-i18n');
        if (style) style.remove();
    }
};
