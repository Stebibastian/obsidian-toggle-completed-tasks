const { Plugin } = require('obsidian');

module.exports = class ToggleCompletedTasksPlugin extends Plugin {
    async onload() {
        console.log('Loading Toggle Completed Tasks Plugin');

        // Load settings
        await this.loadSettings();

        // Add ribbon icon (das Auge-Symbol in der Seitenleiste)
        const ribbonIconEl = this.addRibbonIcon('eye', 'Toggle Completed Tasks', (evt) => {
            this.toggleCompletedTasks();
        });
        ribbonIconEl.addClass('toggle-completed-tasks-ribbon');

        // Add command (für Command Palette)
        this.addCommand({
            id: 'toggle-completed-tasks',
            name: 'Erledigte Tasks ein/ausblenden',
            callback: () => {
                this.toggleCompletedTasks();
            }
        });

        // Apply initial state
        this.applyState();
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

        // Zeige Notification
        const statusText = this.settings.hideCompleted ? 'ausgeblendet' : 'sichtbar';
        new Notice(`Erledigte Tasks: ${statusText}`);
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
    }
};
