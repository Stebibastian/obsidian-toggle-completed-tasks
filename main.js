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
    }

    detectLanguage() {
        // Get Obsidian's language setting
        const obsidianLang = window.localStorage.getItem('language') || 'en';

        // Map Obsidian language codes to our supported languages
        if (obsidianLang.startsWith('de')) return 'de';
        return 'en'; // Default to English
    }

    updateCSSMessage() {
        // Inject CSS variable for localized message
        const style = document.createElement('style');
        style.id = 'toggle-completed-tasks-i18n';
        style.textContent = `
            body.hide-completed-tasks .markdown-reading-view ul.contains-task-list:has(.task-list-item):not(:has(.task-list-item:not(.is-checked)))::after {
                content: "${this.t.allTasksCompleted}";
            }
        `;
        document.head.appendChild(style);
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
    }

    onunload() {
        console.log('Unloading Toggle Completed Tasks Plugin');
        document.body.classList.remove('hide-completed-tasks');

        // Remove injected style
        const style = document.getElementById('toggle-completed-tasks-i18n');
        if (style) style.remove();
    }
};
