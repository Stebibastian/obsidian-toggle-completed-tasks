# Toggle Completed Tasks

Ein Obsidian Plugin zum einfachen Ein- und Ausblenden erledigter Tasks mit einem Klick.

## ✨ Features

- **Ein-Klick Toggle**: Schalte erledigte Tasks mit einem Icon in der Ribbon-Leiste ein/aus
- **Tasks Plugin Kompatibilität**: Funktioniert perfekt mit dem Tasks Plugin - erledigte Tasks bleiben in Query-Ergebnissen sichtbar
- **Status-Symbole Unterstützung**: Nur `[x]` completed Tasks werden ausgeblendet, andere Status wie `[/]` (in progress), `[-]` (cancelled), `[>]` (forwarded) bleiben sichtbar
- **"Alle Aufgaben erledigt" Nachricht**: Zeigt automatisch eine Nachricht wenn alle Tasks in einer Liste erledigt sind
- **Command Palette**: Auch über die Command Palette steuerbar

## 🎯 Verwendung

### Ribbon Icon (empfohlen)
Klicke auf das 👁️ Auge-Symbol in der linken Seitenleiste zum Umschalten.

### Command Palette
1. Drücke `Cmd+P` (Mac) oder `Ctrl+P` (Windows/Linux)
2. Tippe "Erledigte Tasks"
3. Wähle den Command

## 🔧 Wie es funktioniert

- **Plugin aktiviert** (Standard): Erledigte `[x]` Tasks werden ausgeblendet
- **Plugin deaktiviert**: Alle Tasks werden angezeigt

### Tasks Plugin Integration

Das Plugin ist speziell für die Verwendung mit dem [Tasks Plugin](https://github.com/obsidian-tasks-group/obsidian-tasks) optimiert:

- In normalen Task-Listen werden erledigte Tasks ausgeblendet
- In Tasks Plugin Query-Ergebnissen (``` ```tasks ```) bleiben ALLE Tasks sichtbar
- Andere Status-Symbole (`[/]`, `[-]`, `[>]`, etc.) bleiben immer sichtbar

## 📦 Installation

### Aus dem Community Plugin Store
1. Öffne Einstellungen in Obsidian
2. Navigiere zu "Community Plugins"
3. Suche nach "Toggle Completed Tasks"
4. Klicke auf "Installieren"
5. Aktiviere das Plugin

### Manuell
1. Lade die neueste Version von den [Releases](https://github.com/Stebibastian/obsidian-toggle-completed-tasks/releases) herunter
2. Entpacke die Datei in dein `.obsidian/plugins/` Verzeichnis
3. Lade Obsidian neu
4. Aktiviere das Plugin in den Einstellungen

## 🛠️ Entwicklung

```bash
# Repository klonen
git clone https://github.com/Stebibastian/obsidian-toggle-completed-tasks.git

# In Verzeichnis wechseln
cd obsidian-toggle-completed-tasks

# Dependencies installieren
npm install

# Plugin bauen
npm run build
```

## 📝 Lizenz

MIT

## 🙏 Credits

Entwickelt mit ❤️ für die Obsidian Community.

## 🐛 Bug Reports & Feature Requests

Bitte eröffne ein [Issue auf GitHub](https://github.com/Stebibastian/obsidian-toggle-completed-tasks/issues).
