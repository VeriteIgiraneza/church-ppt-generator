---

## Prerequisites

You need three things installed on your computer:

| Tool         | Minimum version | Check with        |
| ------------ | --------------- | ----------------- |
| **Python**   | 3.10+           | `python3 --version` |
| **Node.js**  | 18+             | `node --version`  |
| **uv**       | latest          | `uv --version`    |

### Install Python

- **macOS**: `brew install python@3.14` (or download from [python.org](https://www.python.org/downloads/))
- **Windows**: download the installer from [python.org](https://www.python.org/downloads/) and **check "Add Python to PATH"** during install
- **Ubuntu/Debian**: `sudo apt install python3 python3-venv`

### Install Node.js

- **macOS**: `brew install node` (or download from [nodejs.org](https://nodejs.org/))
- **Windows**: download from [nodejs.org](https://nodejs.org/)
- **Ubuntu/Debian**: `sudo apt install nodejs npm` (or use [nvm](https://github.com/nvm-sh/nvm) for newer versions)

### Install uv

`uv` is a fast Python package manager that replaces `pip` + `venv`.

- **macOS / Linux**: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **Windows (PowerShell)**: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`

After installation, **restart your terminal** so the `uv` command becomes available, then verify with `uv --version`.

---

## First-time setup

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd church-ppt-generator
```

### 2. Install backend dependencies

```bash
cd backend
uv sync
cd ..
```

`uv sync` creates a `.venv/` folder and installs everything listed in `pyproject.toml`.

### 3. Install root + frontend dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### 4. Add your data files (if missing)

The app needs four data files in `backend/data/`:

| File                                  | Format    | Required? | Description                                    |
| ------------------------------------- | --------- | --------- | ---------------------------------------------- |
| `hymns.csv`                           | CSV       | ✅        | Hymn library (id, title, author, category, verses) |
| `bible.csv`                           | CSV       | ✅        | Bible verses (book, chapter, verse, text)      |
| `Creed.csv`                           | CSV       | ✅        | Creeds (id, name, content)                     |
| `representative_prayer.txt`           | JSON      | ✅        | Prayer leaders (real names — gitignored)       |
| `representative_prayer.example.txt`   | JSON      | —         | Placeholder version with fake names (committed) |

If you don't have a real `representative_prayer.txt`, copy the example:

```bash
cp backend/data/representative_prayer.example.txt backend/data/representative_prayer.txt
```

Then edit it to add your church's actual prayer leaders.

### 5. (Optional) Add a PowerPoint template

Drop your church's branded `.pptx` template at `backend/templates/church_template.pptx`. The slide generator will use it as the starting point so generated presentations match your church's style.

If no template is provided, the app falls back to a blank presentation — still works, just looks plain.

---

## Running the app

### Easy way: one command

From the project root:

```bash
npm run dev
```

This starts both servers in parallel and auto-opens your browser to the app:

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API docs**: http://localhost:8000/docs

Press `Ctrl + C` to stop both servers.

### Manual way: two terminals

**Terminal 1 — backend:**

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — frontend:**

```bash
cd frontend
npm run dev
```

---

## Double-click launcher (recommended)

Skip the terminal entirely. Set up a launcher file once, then double-click it from your desktop.

### macOS

A `.command` file is already in the repo at `launch-church-app.command`.

1. **Make it executable** (one-time setup):
```bash
   chmod +x launch-church-app.command
```

2. **Drag it to your Desktop** — or right-click → **Make Alias** → drag the alias to your Desktop (recommended; the original stays in the project folder).

3. **Double-click to launch**: Terminal opens, both servers start, browser opens automatically.

> **Note:** macOS may show a security warning the first time. Click "Open" in the dialog, or go to **System Settings → Privacy & Security** and click "Open Anyway."

### Windows

A `.bat` file is already in the repo at `launch-church-app.bat`.

1. **Drag it to your Desktop** (or right-click → **Send to → Desktop (create shortcut)**).
2. **Double-click to launch.** A command prompt opens, both servers start, browser opens.

> **Note:** Windows Defender SmartScreen may warn the first time. Click "More info" → "Run anyway."

### Windows
"Do this if above is not working"

Create a `.bat` file in the project root with this content:

```batch
@echo off
cd /d "%~dp0"
npm run dev
pause
```

Save as `launch-church-app.bat`. Then:

1. **Drag it to your Desktop** (or right-click → **Send to → Desktop (create shortcut)**).
2. **Double-click to launch.** A command prompt opens, both servers start, browser opens.


### Ubuntu / Linux

A `.sh` file is already in the repo at `launch-church-app.sh`.

1. **Make it executable** (one-time setup):
```bash
   chmod +x launch-church-app.sh
```

2. **For double-click support in your file manager**, you have two options:

   **Option A — enable executable text files** (GNOME):
   Open **Files → Preferences → Behavior**, set "Executable Text Files" to "Run them" or "Ask what to do."

   **Option B — use the included `.desktop` file** (more reliable):
   Copy `launch-church-app.desktop` to your Desktop:
```bash
   cp launch-church-app.desktop ~/Desktop/
   chmod +x ~/Desktop/launch-church-app.desktop
```
   Right-click it → **"Allow Launching"** the first time.

### Ubuntu / Linux
"Do this if above is not working"

Create a `.sh` file in the project root with this content:

```bash
#!/bin/bash
cd "$(dirname "$0")"
npm run dev
```

Save as `launch-church-app.sh`. Then:

1. **Make it executable**:
```bash
   chmod +x launch-church-app.sh
```

2. **For double-click support in your file manager**, you may need to:
   - GNOME: enable "Run executable text files" in **Files → Preferences → Behavior**
   - Or create a `.desktop` file:
```ini
     [Desktop Entry]
     Type=Application
     Name=Church PPT Generator
     Exec=/full/path/to/launch-church-app.sh
     Terminal=true
```
   Save as `~/Desktop/church-ppt-generator.desktop` and make it executable.

---

## Updating data

To add hymns, edit verses, or change prayer leaders:

1. Edit the relevant file in `backend/data/` (see the table above for formats)
2. **Restart the backend** (Ctrl+C in the terminal, then run `npm run dev` again)
3. Refresh your browser

The backend caches all data in memory at startup, so changes only take effect after a restart.

---

## Troubleshooting

### "Backend: ❌ Failed to fetch" in the UI

Backend isn't running, or it crashed during startup. Check the terminal for Python errors. Common causes:

- A required CSV file is missing — see the data files table
- A column name in your CSV doesn't match what the model expects
- Port 8000 is already in use — kill the process or change the port in `package.json`

### "Port 5173 is already in use"

Another Vite dev server is already running. Find and kill it:

```bash
# macOS / Linux
lsof -ti:5173 | xargs kill

# Windows
netstat -ano | findstr :5173
taskkill /PID <pid> /F
```

### macOS "command not found: uv" after installation

Restart your terminal. If still missing, add this line to `~/.zshrc`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Then `source ~/.zshrc`.

### Generated PowerPoint looks wrong

- **Missing template**: drop a real `church_template.pptx` into `backend/templates/`
- **Slides truncated**: check the verse text for unusual characters that might break parsing
- **Verse pagination weird**: tune `max_chars_per_bible_slide` in `backend/app/core/config.py`

### "ImportError" or "ModuleNotFoundError" in the backend

Your virtual environment is out of sync. Recreate it:

```bash
cd backend
rm -rf .venv
uv sync
```

---

## Privacy & data handling

- **Everything runs locally** on your machine. No data is sent to any external server.
- **`representative_prayer.txt`** (containing real names) is in `.gitignore` and **never** committed to the repo. Only `representative_prayer.example.txt` (placeholders) is tracked.
- **Generated PowerPoints** are saved to `backend/output/` and gitignored.

---

## Tech stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — modern Python web framework
- [Pydantic v2](https://docs.pydantic.dev/) — data validation
- [python-pptx](https://python-pptx.readthedocs.io/) — PowerPoint generation
- [pandas](https://pandas.pydata.org/) — CSV parsing
- [uv](https://github.com/astral-sh/uv) — package management

**Frontend**
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) — build tool & dev server

**Tooling**
- [concurrently](https://github.com/open-cli-tools/concurrently) — run both servers in one terminal
- [wait-on](https://github.com/jeffbski/wait-on) — wait for the frontend to be ready before opening the browser

---

## Contributing

This is a personal/church project, but suggestions and pull requests are welcome. Some ideas for future improvements:

- [ ] Auto-save form state to `localStorage` (survive page refresh)
- [ ] Drag-and-drop reordering of the service flow
- [ ] In-app editor for hymns and Bible data (no CSV editing required)
- [ ] PDF export option in addition to PPTX
- [ ] Multi-language support
- [ ] Optional auth for hosted deployment

---

## License

MIT — do whatever you want with it.