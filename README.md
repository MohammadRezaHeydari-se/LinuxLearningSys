# 🐧 Linux Learning System

A **simulated Linux terminal** learning platform that teaches Linux commands through interactive, step-by-step lessons. Features a **live virtual filesystem** with a visual desktop panel that shows how each command affects the filesystem in real time. Built as a single-page web application with multi-language support.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Languages](https://img.shields.io/badge/languages-en%20%7C%20sv%20%7C%20fa-orange)

---

## ✨ Features

- **Realistic Terminal Simulation** – A fully functional fake terminal that looks and feels like a real Linux shell
- **Live Visual Desktop** – See files and folders change in real time as you type commands
- **Virtual Filesystem** – A fully simulated Linux filesystem tree (`/home`, `/tmp`, `/etc`, etc.)
- **Structured Learning Path** – Step-by-step lessons from beginner to advanced
- **Interactive Exercises** – Type real commands in a safe sandboxed environment
- **Multi-Language Support** – English, Swedish (Svenska), and Persian (فارسی)
- **Progress Tracking** – Each completed step is saved and summarized before moving on
- **RTL Support** – Full right-to-left support for Persian language
- **No Backend Required** – Everything runs in the browser

## 🎯 How It Works

When you enter a **lesson**, the screen splits into two panels:

| Left Panel | Right Panel |
|------------|-------------|
| Step instructions + terminal | Live visual desktop |
| Type commands here | See files change in real time |

Each **lesson** is broken into multiple **steps**:

1. **Read** – A short description of a command and what it does
2. **Try** – The student types the command in the simulated terminal
3. **See** – The visual desktop updates to show the effect
4. **Verify** – The system checks if the command was entered correctly
5. **Summarize** – A recap of what was learned
6. **Next Step** – Move to the next command or lesson

At the end of each lesson, a summary is shown before unlocking the next lesson.

## 📚 Lessons

| # | Lesson | Commands |
|---|--------|----------|
| 1 | Navigating the Filesystem | `pwd`, `ls`, `cd` |
| 2 | Working with Files & Directories | `touch`, `mkdir`, `cp`, `mv`, `rm` |
| 3 | Viewing File Contents | `cat`, `head`, `tail`, `wc` |
| 4 | File Permissions | `chmod`, `chown` |
| 5 | Searching & Text Processing | `grep`, `sort`, `cut` |
| 6 | Process Management | `ps`, `kill` |
| 7 | Networking Basics | `ping`, `curl`, `ss` |
| 8 | Archives & Compression | `tar`, `zip`, `unzip` |
| 9 | User & Group Management | `whoami`, `id` |
| 10 | Shell Scripting Basics | `echo`, variables, `for` loops |

> More lessons will be added over time.

## 🛠️ Tech Stack

- **HTML5** – Structure
- **CSS3** – Styling with custom properties (CSS variables) for theming
- **Vanilla JavaScript (ES6+)** – Core logic, terminal emulation, VFS, desktop rendering, i18n
- **No frameworks, no dependencies** – Lightweight and fast

## 🚀 Getting Started

### Option 1: Open directly

Clone the repo and open `index.html` in any modern browser:

```bash
git clone https://github.com/MohammadRezaHeydari-se/LinuxLearningSys.git
cd LinuxLearningSys
open index.html
```

### Option 2: Serve locally (recommended)

Use any static file server:

```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# PHP
php -S localhost:8080
```

Then open `http://localhost:8080` in your browser.

## 🌐 Language Support

Switch languages at any time from the language selector. The UI, lesson content, and command feedback all update instantly.

| Language | Code | Native Name |
|----------|------|-------------|
| English  | `en` | English |
| Swedish  | `sv` | Svenska |
| Persian  | `fa` | فارسی |

> To add a new language, create a JSON file in `locales/` with the same keys as `en.json`, then add the data to `js/locales-data.js`.

## 🏗️ Project Structure

```
LinuxLearningSys/
├── index.html              # Main HTML file
├── README.md               # This file
├── css/
│   └── style.css           # All styling (including RTL & desktop)
├── js/
│   ├── app.js              # Application entry point & orchestrator
│   ├── terminal.js         # Terminal emulation (input/output)
│   ├── fs.js               # Virtual filesystem (tree, permissions, operations)
│   ├── desktop.js          # Visual desktop panel renderer
│   ├── i18n.js             # Internationalisation engine
│   ├── steps.js            # Step progression & validation logic
│   └── locales-data.js     # Embedded locale data (en/sv/fa)
├── locales/
│   ├── en.json             # English translations (source)
│   ├── sv.json             # Swedish translations
│   └── fa.json             # Persian translations
```

## 💻 Virtual Filesystem

The virtual filesystem (`js/fs.js`) is a fully functional in-memory Linux filesystem that supports:

| Command | Effect on Desktop |
|---------|-------------------|
| `pwd` | Current path highlighted in breadcrumb |
| `ls` | Files shown in the desktop grid |
| `cd` | Desktop navigates to the target directory |
| `touch` | New file appears in the grid |
| `mkdir` | New folder appears |
| `cp` | File duplicated in the grid |
| `mv` | File renamed/moved |
| `rm` | File disappears |
| `chmod` | File color/style changes (executable = green glow) |
| `cat` / `head` / `tail` | Content appears in terminal output |
| `echo` | Text printed to terminal |

The desktop can also be navigated manually:
- **Double-click** a folder to enter it
- Click the **⬆** button to go up
- Click **🏠** to go home
- Click any **breadcrumb** segment to jump to that directory

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Add new lessons** – Create lesson definitions in the locale JSON files
2. **Add translations** – Add a new locale file in `locales/` and add to `js/locales-data.js`
3. **Improve the terminal** – Enhance the simulation, add more command responses
4. **Extend the VFS** – Add more commands to `js/fs.js` (e.g., `find`, `du`, `ln`)
5. **Report bugs** – Open an issue with detailed reproduction steps

Please follow the existing code style and ensure RTL compatibility for Persian.

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ for the Linux learning community.
