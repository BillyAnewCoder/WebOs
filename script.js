class LinuxOS {
    constructor() {
        this.windows = [];
        this.activeWindow = null;
        this.zIndex = 100;
        this.terminalHistory = [];
        this.historyIndex = -1;
        this.currentPath = '/home/user';
        this.clipboard = '';
        this.documents = new Map();
        this.currentDocument = null;
        
        // Enhanced file system with more realistic structure
        this.fileSystem = {
            '/': {
                'home': { 
                    type: 'folder', 
                    contents: {
                        'user': {
                            type: 'folder',
                            contents: {
                                'Documents': { 
                                    type: 'folder', 
                                    contents: {
                                        'welcome.txt': { type: 'file', content: 'Welcome to LinuxOS!\n\nThis is a web-based Linux desktop environment.\n\nFeatures:\n- File manager with navigation\n- Terminal with real commands\n- Text editor with save/load\n- Calculator\n- System settings\n\nEnjoy exploring!' },
                                        'notes.txt': { type: 'file', content: 'My Notes\n========\n\n- Remember to backup files\n- Check system updates\n- Learn more Linux commands' },
                                        'todo.md': { type: 'file', content: '# TODO List\n\n- [x] Set up desktop environment\n- [ ] Install applications\n- [ ] Configure settings\n- [ ] Create backup script' }
                                    }
                                },
                                'Pictures': { 
                                    type: 'folder', 
                                    contents: {
                                        'screenshot.png': { type: 'file', content: 'Image: Desktop screenshot' },
                                        'wallpaper.jpg': { type: 'file', content: 'Image: Beautiful landscape wallpaper' }
                                    }
                                },
                                'Downloads': { 
                                    type: 'folder', 
                                    contents: {
                                        'software.deb': { type: 'file', content: 'Package: Software installer' },
                                        'archive.tar.gz': { type: 'file', content: 'Archive: Compressed files' }
                                    }
                                },
                                'Desktop': { type: 'folder', contents: {} },
                                '.bashrc': { type: 'file', content: '# ~/.bashrc\nexport PATH=$PATH:/usr/local/bin\nalias ll="ls -la"\nalias la="ls -A"' }
                            }
                        }
                    }
                },
                'usr': { 
                    type: 'folder', 
                    contents: {
                        'bin': { type: 'folder', contents: {} },
                        'lib': { type: 'folder', contents: {} }
                    }
                },
                'etc': { 
                    type: 'folder', 
                    contents: {
                        'passwd': { type: 'file', content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:User:/home/user:/bin/bash' }
                    }
                },
                'var': { type: 'folder', contents: {} },
                'tmp': { type: 'folder', contents: {} }
            }
        };
        
        this.calculator = {
            display: '0',
            previousValue: null,
            operation: null,
            waitingForNewValue: false,
            history: []
        };
        
        this.settings = {
            theme: 'default',
            wallpaper: 'gradient',
            fontSize: 'medium',
            animations: true
        };
        
        this.init();
    }

    init() {
        this.showBootScreen();
        this.setupEventListeners();
        this.updateTime();
        this.updateDate();
        setInterval(() => this.updateTime(), 1000);
        setInterval(() => this.updateDate(), 60000);
        
        // Auto-save documents
        setInterval(() => this.autoSave(), 10000);
        
        // Load saved settings
        this.loadSettings();
    }

    showBootScreen() {
        const bootScreen = document.getElementById('bootScreen');
        const desktop = document.getElementById('desktop');
        
        setTimeout(() => {
            bootScreen.classList.add('hidden');
            desktop.classList.remove('hidden');
            this.playStartupSound();
        }, 5000);
    }

    setupEventListeners() {
        // Desktop icons
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.addEventListener('dblclick', (e) => {
                const appName = e.currentTarget.dataset.app;
                this.openApp(appName);
            });
        });

        // Dock items
        document.querySelectorAll('.dock-item[data-app]').forEach(item => {
            item.addEventListener('click', (e) => {
                const appName = e.currentTarget.dataset.app;
                this.toggleApp(appName);
            });
        });

        // Special dock items
        document.getElementById('showDesktop').addEventListener('click', () => {
            this.showDesktop();
        });

        document.getElementById('powerMenu').addEventListener('click', () => {
            this.showPowerMenu();
        });

        // Top panel items
        document.getElementById('activitiesBtn').addEventListener('click', () => {
            this.showActivities();
        });

        document.getElementById('userMenu').addEventListener('click', () => {
            this.showUserMenu();
        });

        // System tray
        document.getElementById('networkIcon').addEventListener('click', () => {
            this.toggleNetwork();
        });

        document.getElementById('volumeIcon').addEventListener('click', () => {
            this.toggleVolume();
        });

        // Window dragging
        document.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-header')) {
                this.startDragging(e);
            }
        });

        // Context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e);
        });

        document.addEventListener('click', (e) => {
            this.hideContextMenu();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    }

    openApp(appName) {
        // Check if app is already open
        const existingWindow = this.windows.find(w => w.dataset.app === appName);
        if (existingWindow) {
            this.focusWindow(existingWindow);
            return;
        }

        const template = document.getElementById(`${appName}Template`);
        if (!template) return;

        const windowElement = template.content.cloneNode(true).querySelector('.window');
        const container = document.getElementById('windowsContainer');
        
        // Position window
        const offset = this.windows.length * 30;
        windowElement.style.left = `${100 + offset}px`;
        windowElement.style.top = `${50 + offset}px`;
        windowElement.style.zIndex = ++this.zIndex;

        container.appendChild(windowElement);
        this.windows.push(windowElement);
        this.focusWindow(windowElement);

        // Setup window controls
        this.setupWindowControls(windowElement);

        // Setup app-specific functionality
        this.setupAppFunctionality(windowElement, appName);

        // Update dock
        this.updateDock();
    }

    toggleApp(appName) {
        const existingWindow = this.windows.find(w => w.dataset.app === appName);
        if (existingWindow) {
            if (existingWindow.classList.contains('minimized')) {
                this.restoreWindow(existingWindow);
            } else if (existingWindow === this.activeWindow) {
                this.minimizeWindow(existingWindow);
            } else {
                this.focusWindow(existingWindow);
            }
        } else {
            this.openApp(appName);
        }
    }

    setupWindowControls(windowElement) {
        const closeBtn = windowElement.querySelector('.close-btn');
        const minimizeBtn = windowElement.querySelector('.minimize-btn');

        closeBtn.addEventListener('click', () => {
            this.closeWindow(windowElement);
        });

        minimizeBtn.addEventListener('click', () => {
            this.minimizeWindow(windowElement);
        });

        windowElement.addEventListener('mousedown', () => {
            this.focusWindow(windowElement);
        });
    }

    setupAppFunctionality(windowElement, appName) {
        switch (appName) {
            case 'terminal':
                this.setupTerminal(windowElement);
                break;
            case 'texteditor':
                this.setupTextEditor(windowElement);
                break;
            case 'filemanager':
                this.setupFileManager(windowElement);
                break;
            case 'calculator':
                this.setupCalculator(windowElement);
                break;
            case 'settings':
                this.setupSettings(windowElement);
                break;
        }
    }

    setupTerminal(windowElement) {
        const input = windowElement.querySelector('.terminal-input');
        const output = windowElement.querySelector('.terminal-output');

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = input.value.trim();
                this.executeCommand(command, output);
                this.terminalHistory.push(command);
                this.historyIndex = this.terminalHistory.length;
                input.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    input.value = this.terminalHistory[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.terminalHistory.length - 1) {
                    this.historyIndex++;
                    input.value = this.terminalHistory[this.historyIndex];
                } else {
                    this.historyIndex = this.terminalHistory.length;
                    input.value = '';
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.autoComplete(input);
            }
        });

        windowElement.addEventListener('click', () => {
            input.focus();
        });

        input.focus();
    }

    executeCommand(command, output) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = `<span style="color: #27ae60;">user@linuxos</span>:<span style="color: #3498db;">${this.currentPath}</span>$ ${command}`;
        output.appendChild(line);

        const response = document.createElement('div');
        response.className = 'terminal-line';

        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (cmd) {
            case 'help':
                response.innerHTML = `Available commands:
<span style="color: #e74c3c;">System:</span> help, clear, date, whoami, uname, uptime, ps
<span style="color: #e74c3c;">Files:</span> ls, pwd, cd, cat, mkdir, rmdir, touch, rm, cp, mv
<span style="color: #e74c3c;">Network:</span> ping, wget, curl
<span style="color: #e74c3c;">System:</span> top, df, free, history
<span style="color: #e74c3c;">Power:</span> shutdown, reboot, logout`;
                break;
            case 'clear':
                output.innerHTML = '<div class="terminal-line">LinuxOS Terminal v2.0</div><div class="terminal-line">Type \'help\' for available commands</div><div class="terminal-line"></div>';
                return;
            case 'date':
                response.textContent = new Date().toString();
                break;
            case 'whoami':
                response.textContent = 'user';
                break;
            case 'uname':
                response.textContent = 'LinuxOS 5.4.0-web x86_64';
                break;
            case 'uptime':
                const uptime = Math.floor((Date.now() - performance.timing.navigationStart) / 1000);
                response.textContent = `up ${Math.floor(uptime/60)} minutes`;
                break;
            case 'pwd':
                response.textContent = this.currentPath;
                break;
            case 'ls':
                this.listDirectory(args, response);
                break;
            case 'cd':
                this.changeDirectory(args[0], response);
                break;
            case 'cat':
                this.catFile(args[0], response);
                break;
            case 'mkdir':
                this.makeDirectory(args[0], response);
                break;
            case 'touch':
                this.touchFile(args[0], response);
                break;
            case 'rm':
                this.removeFile(args, response);
                break;
            case 'cp':
                this.copyFile(args, response);
                break;
            case 'mv':
                this.moveFile(args, response);
                break;
            case 'ping':
                response.innerHTML = `PING ${args[0] || 'localhost'} (127.0.0.1): 56 data bytes
64 bytes from 127.0.0.1: icmp_seq=0 time=0.1ms
64 bytes from 127.0.0.1: icmp_seq=1 time=0.1ms
--- ${args[0] || 'localhost'} ping statistics ---
2 packets transmitted, 2 packets received, 0.0% packet loss`;
                break;
            case 'ps':
                response.innerHTML = `  PID TTY          TIME CMD
    1 ?        00:00:01 init
  123 ?        00:00:00 kernel
  456 pts/0    00:00:00 bash
  789 pts/0    00:00:00 ps`;
                break;
            case 'free':
                response.innerHTML = `              total        used        free      shared
Mem:        8192000     2048000     6144000           0
Swap:             0           0           0`;
                break;
            case 'df':
                response.innerHTML = `Filesystem     1K-blocks    Used Available Use% Mounted on
/dev/web1        1000000  250000    750000  25% /
tmpfs             100000       0    100000   0% /tmp`;
                break;
            case 'history':
                this.terminalHistory.forEach((cmd, i) => {
                    const histLine = document.createElement('div');
                    histLine.className = 'terminal-line';
                    histLine.textContent = `${i + 1}  ${cmd}`;
                    response.appendChild(histLine);
                });
                output.appendChild(response);
                output.scrollTop = output.scrollHeight;
                return;
            case 'shutdown':
                response.textContent = 'System will shutdown in 5 seconds...';
                output.appendChild(response);
                setTimeout(() => this.shutdown(), 5000);
                output.scrollTop = output.scrollHeight;
                return;
            case 'reboot':
                response.textContent = 'System will reboot in 5 seconds...';
                output.appendChild(response);
                setTimeout(() => this.reboot(), 5000);
                output.scrollTop = output.scrollHeight;
                return;
            case 'logout':
                response.textContent = 'Logging out...';
                output.appendChild(response);
                setTimeout(() => this.logout(), 2000);
                output.scrollTop = output.scrollHeight;
                return;
            default:
                if (command.startsWith('echo ')) {
                    response.textContent = command.substring(5);
                } else if (command === '') {
                    return;
                } else {
                    response.innerHTML = `<span style="color: #e74c3c;">bash: ${cmd}: command not found</span>`;
                }
        }

        output.appendChild(response);
        output.scrollTop = output.scrollHeight;
    }

    listDirectory(args, response) {
        const path = args[0] || this.currentPath;
        const dirData = this.getDirectoryContents(path);
        
        if (!dirData) {
            response.innerHTML = `<span style="color: #e74c3c;">ls: cannot access '${path}': No such file or directory</span>`;
            return;
        }

        const items = Object.keys(dirData).sort();
        if (args.includes('-la') || args.includes('-l')) {
            response.innerHTML = items.map(item => {
                const isDir = dirData[item].type === 'folder';
                const permissions = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                const size = isDir ? '4096' : '1024';
                const date = 'Jan  1 12:00';
                return `${permissions} 1 user user ${size.padStart(8)} ${date} ${item}`;
            }).join('\n');
        } else {
            const folders = items.filter(item => dirData[item].type === 'folder');
            const files = items.filter(item => dirData[item].type === 'file');
            response.innerHTML = [...folders.map(f => `<span style="color: #3498db;">${f}/</span>`), ...files].join('  ');
        }
    }

    changeDirectory(path, response) {
        if (!path) {
            this.currentPath = '/home/user';
            response.textContent = '';
            return;
        }

        let newPath;
        if (path.startsWith('/')) {
            newPath = path;
        } else if (path === '..') {
            const parts = this.currentPath.split('/').filter(p => p);
            parts.pop();
            newPath = '/' + parts.join('/');
            if (newPath === '/') newPath = '/';
        } else {
            newPath = this.currentPath === '/' ? `/${path}` : `${this.currentPath}/${path}`;
        }

        if (this.getDirectoryContents(newPath)) {
            this.currentPath = newPath;
            response.textContent = '';
        } else {
            response.innerHTML = `<span style="color: #e74c3c;">cd: ${path}: No such file or directory</span>`;
        }
    }

    catFile(filename, response) {
        if (!filename) {
            response.innerHTML = `<span style="color: #e74c3c;">cat: missing file operand</span>`;
            return;
        }

        const content = this.getFileContent(this.currentPath, filename);
        if (content !== null) {
            response.innerHTML = content.replace(/\n/g, '<br>');
        } else {
            response.innerHTML = `<span style="color: #e74c3c;">cat: ${filename}: No such file or directory</span>`;
        }
    }

    setupTextEditor(windowElement) {
        const textarea = windowElement.querySelector('.notes-textarea');
        const statusText = windowElement.querySelector('#statusText');
        const charCount = windowElement.querySelector('#charCount');
        const documentTitle = windowElement.querySelector('#documentTitle');
        
        // Toolbar buttons
        const newBtn = windowElement.querySelector('#newBtn');
        const openBtn = windowElement.querySelector('#openBtn');
        const saveBtn = windowElement.querySelector('#saveBtn');
        const saveAsBtn = windowElement.querySelector('#saveAsBtn');
        const undoBtn = windowElement.querySelector('#undoBtn');
        const redoBtn = windowElement.querySelector('#redoBtn');

        // Load saved content
        const savedContent = localStorage.getItem('linuxos-texteditor');
        if (savedContent) {
            textarea.value = savedContent;
            this.updateCharCount(textarea, charCount);
        }

        textarea.addEventListener('input', () => {
            statusText.textContent = 'Modified';
            statusText.style.color = '#e74c3c';
            this.updateCharCount(textarea, charCount);
        });

        newBtn.addEventListener('click', () => {
            if (confirm('Create new document? Unsaved changes will be lost.')) {
                textarea.value = '';
                documentTitle.textContent = 'Untitled Document';
                statusText.textContent = 'Ready';
                statusText.style.color = '#6c757d';
                this.updateCharCount(textarea, charCount);
            }
        });

        saveBtn.addEventListener('click', () => {
            this.saveDocument(textarea.value, documentTitle.textContent);
            statusText.textContent = 'Saved';
            statusText.style.color = '#28a745';
        });

        saveAsBtn.addEventListener('click', () => {
            const filename = prompt('Save as:', 'document.txt');
            if (filename) {
                this.saveDocument(textarea.value, filename);
                documentTitle.textContent = filename;
                statusText.textContent = 'Saved';
                statusText.style.color = '#28a745';
            }
        });

        openBtn.addEventListener('click', () => {
            this.showFileDialog((filename, content) => {
                textarea.value = content;
                documentTitle.textContent = filename;
                statusText.textContent = 'Opened';
                statusText.style.color = '#28a745';
                this.updateCharCount(textarea, charCount);
            });
        });
    }

    updateCharCount(textarea, charCount) {
        const count = textarea.value.length;
        const lines = textarea.value.split('\n').length;
        charCount.textContent = `${count} characters, ${lines} lines`;
    }

    setupFileManager(windowElement) {
        const fileContent = windowElement.querySelector('#fileContent');
        const addressBar = windowElement.querySelector('#addressBar');
        const backBtn = windowElement.querySelector('#backBtn');
        const forwardBtn = windowElement.querySelector('#forwardBtn');
        const upBtn = windowElement.querySelector('#upBtn');
        const refreshBtn = windowElement.querySelector('#refreshBtn');
        const newFolderBtn = windowElement.querySelector('#newFolderBtn');

        let navigationHistory = [this.currentPath];
        let historyIndex = 0;

        const updateFileList = (path) => {
            const contents = this.getDirectoryContents(path);
            if (!contents) return;

            fileContent.innerHTML = '';
            
            // Add parent directory if not at root
            if (path !== '/') {
                const parentItem = this.createFileItem('..', 'folder', true);
                fileContent.appendChild(parentItem);
            }

            Object.keys(contents).sort().forEach(name => {
                const item = contents[name];
                const fileItem = this.createFileItem(name, item.type);
                fileContent.appendChild(fileItem);
            });

            addressBar.value = path;
        };

        const navigateTo = (path) => {
            if (this.getDirectoryContents(path)) {
                this.currentPath = path;
                updateFileList(path);
                
                // Update history
                if (historyIndex < navigationHistory.length - 1) {
                    navigationHistory = navigationHistory.slice(0, historyIndex + 1);
                }
                navigationHistory.push(path);
                historyIndex = navigationHistory.length - 1;
            }
        };

        // Event listeners
        backBtn.addEventListener('click', () => {
            if (historyIndex > 0) {
                historyIndex--;
                const path = navigationHistory[historyIndex];
                this.currentPath = path;
                updateFileList(path);
            }
        });

        forwardBtn.addEventListener('click', () => {
            if (historyIndex < navigationHistory.length - 1) {
                historyIndex++;
                const path = navigationHistory[historyIndex];
                this.currentPath = path;
                updateFileList(path);
            }
        });

        upBtn.addEventListener('click', () => {
            const parts = this.currentPath.split('/').filter(p => p);
            if (parts.length > 0) {
                parts.pop();
                const parentPath = '/' + parts.join('/');
                navigateTo(parentPath === '/' ? '/' : parentPath);
            }
        });

        refreshBtn.addEventListener('click', () => {
            updateFileList(this.currentPath);
        });

        newFolderBtn.addEventListener('click', () => {
            const name = prompt('New folder name:');
            if (name) {
                this.createFolder(this.currentPath, name);
                updateFileList(this.currentPath);
            }
        });

        addressBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                navigateTo(addressBar.value);
            }
        });

        // Initialize
        updateFileList(this.currentPath);
    }

    createFileItem(name, type, isParent = false) {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.dataset.name = name;
        item.dataset.type = type;

        const icon = document.createElement('div');
        icon.className = 'file-icon';
        
        if (isParent) {
            icon.textContent = '↰';
        } else if (type === 'folder') {
            icon.textContent = '📁';
        } else {
            const ext = name.split('.').pop().toLowerCase();
            switch (ext) {
                case 'txt': case 'md': icon.textContent = '📄'; break;
                case 'png': case 'jpg': case 'jpeg': icon.textContent = '🖼️'; break;
                case 'pdf': icon.textContent = '📕'; break;
                case 'zip': case 'tar': case 'gz': icon.textContent = '📦'; break;
                default: icon.textContent = '📄';
            }
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'file-name';
        nameSpan.textContent = name;

        item.appendChild(icon);
        item.appendChild(nameSpan);

        item.addEventListener('dblclick', () => {
            if (isParent) {
                const parts = this.currentPath.split('/').filter(p => p);
                parts.pop();
                const parentPath = '/' + parts.join('/');
                this.navigateToPath(parentPath === '/' ? '/' : parentPath);
            } else if (type === 'folder') {
                const newPath = this.currentPath === '/' ? `/${name}` : `${this.currentPath}/${name}`;
                this.navigateToPath(newPath);
            } else {
                this.openFileInEditor(name);
            }
        });

        return item;
    }

    navigateToPath(path) {
        if (this.getDirectoryContents(path)) {
            this.currentPath = path;
            const fileManager = document.querySelector('.fileexplorer-window');
            if (fileManager) {
                const addressBar = fileManager.querySelector('#addressBar');
                const fileContent = fileManager.querySelector('#fileContent');
                addressBar.value = path;
                this.updateFileManagerContent(fileContent, path);
            }
        }
    }

    updateFileManagerContent(container, path) {
        const contents = this.getDirectoryContents(path);
        if (!contents) return;

        container.innerHTML = '';
        
        if (path !== '/') {
            const parentItem = this.createFileItem('..', 'folder', true);
            container.appendChild(parentItem);
        }

        Object.keys(contents).sort().forEach(name => {
            const item = contents[name];
            const fileItem = this.createFileItem(name, item.type);
            container.appendChild(fileItem);
        });
    }

    setupCalculator(windowElement) {
        const screen = windowElement.querySelector('.calc-screen');
        const buttons = windowElement.querySelectorAll('.calc-btn');

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const value = button.textContent;
                this.handleCalculatorInput(value, screen);
            });
        });

        // Keyboard support
        windowElement.addEventListener('keydown', (e) => {
            const key = e.key;
            if ('0123456789'.includes(key)) {
                this.handleCalculatorInput(key, screen);
            } else if ('+-*/'.includes(key)) {
                const ops = {'+': '+', '-': '−', '*': '×', '/': '÷'};
                this.handleCalculatorInput(ops[key], screen);
            } else if (key === 'Enter' || key === '=') {
                this.handleCalculatorInput('=', screen);
            } else if (key === 'Escape' || key === 'c' || key === 'C') {
                this.handleCalculatorInput('C', screen);
            } else if (key === '.') {
                this.handleCalculatorInput('.', screen);
            }
        });
    }

    handleCalculatorInput(value, screen) {
        const calc = this.calculator;

        if (value === 'C') {
            calc.display = '0';
            calc.previousValue = null;
            calc.operation = null;
            calc.waitingForNewValue = false;
        } else if (value === 'CE') {
            calc.display = '0';
            calc.waitingForNewValue = false;
        } else if (['+', '−', '×', '÷'].includes(value)) {
            if (calc.previousValue !== null && calc.operation && !calc.waitingForNewValue) {
                this.performCalculation();
            }
            calc.previousValue = parseFloat(calc.display);
            calc.operation = value;
            calc.waitingForNewValue = true;
        } else if (value === '=') {
            this.performCalculation();
            calc.history.push(`${calc.previousValue} ${calc.operation} ${parseFloat(calc.display)} = ${calc.display}`);
        } else if (value === '.') {
            if (calc.display.indexOf('.') === -1) {
                calc.display += '.';
            }
        } else if (value === '%') {
            calc.display = (parseFloat(calc.display) / 100).toString();
        } else {
            if (calc.waitingForNewValue) {
                calc.display = value;
                calc.waitingForNewValue = false;
            } else {
                calc.display = calc.display === '0' ? value : calc.display + value;
            }
        }

        screen.value = calc.display;
    }

    performCalculation() {
        const calc = this.calculator;
        const current = parseFloat(calc.display);
        const previous = calc.previousValue;

        if (previous === null || calc.operation === null) return;

        let result;
        switch (calc.operation) {
            case '+':
                result = previous + current;
                break;
            case '−':
                result = previous - current;
                break;
            case '×':
                result = previous * current;
                break;
            case '÷':
                result = current !== 0 ? previous / current : 0;
                break;
            default:
                return;
        }

        calc.display = result.toString();
        calc.previousValue = null;
        calc.operation = null;
        calc.waitingForNewValue = true;
    }

    setupSettings(windowElement) {
        const categories = windowElement.querySelectorAll('.settings-category');
        const content = windowElement.querySelector('#settingsContent');

        categories.forEach(category => {
            category.addEventListener('click', () => {
                categories.forEach(c => c.classList.remove('active'));
                category.classList.add('active');
                this.showSettingsCategory(category.dataset.category, content);
            });
        });

        // Show default category
        this.showSettingsCategory('appearance', content);
    }

    showSettingsCategory(category, content) {
        switch (category) {
            case 'appearance':
                content.innerHTML = `
                    <h3>Appearance Settings</h3>
                    <div style="margin: 20px 0;">
                        <label>Theme:</label>
                        <select id="themeSelect" style="margin-left: 10px;">
                            <option value="default">Default</option>
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                        </select>
                    </div>
                    <div style="margin: 20px 0;">
                        <label>Font Size:</label>
                        <select id="fontSizeSelect" style="margin-left: 10px;">
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                    <div style="margin: 20px 0;">
                        <label>
                            <input type="checkbox" id="animationsCheck"> Enable animations
                        </label>
                    </div>
                `;
                break;
            case 'system':
                content.innerHTML = `
                    <h3>System Information</h3>
                    <div style="margin: 20px 0;">
                        <strong>OS:</strong> LinuxOS Web Edition<br>
                        <strong>Kernel:</strong> 5.4.0-web<br>
                        <strong>Architecture:</strong> x86_64<br>
                        <strong>Memory:</strong> 8 GB<br>
                        <strong>Uptime:</strong> ${Math.floor((Date.now() - performance.timing.navigationStart) / 60000)} minutes
                    </div>
                `;
                break;
            case 'network':
                content.innerHTML = `
                    <h3>Network Settings</h3>
                    <div style="margin: 20px 0;">
                        <strong>Status:</strong> Connected<br>
                        <strong>IP Address:</strong> 192.168.1.100<br>
                        <strong>Gateway:</strong> 192.168.1.1<br>
                        <strong>DNS:</strong> 8.8.8.8, 8.8.4.4
                    </div>
                `;
                break;
            case 'about':
                content.innerHTML = `
                    <h3>About LinuxOS</h3>
                    <div style="margin: 20px 0;">
                        <p><strong>LinuxOS Web Edition</strong></p>
                        <p>Version 1.0.0</p>
                        <p>A web-based Linux desktop environment built with HTML, CSS, and JavaScript.</p>
                        <p>© 2024 LinuxOS Project</p>
                    </div>
                `;
                break;
        }
    }

    // Utility methods
    getDirectoryContents(path) {
        const parts = path.split('/').filter(p => p);
        let current = this.fileSystem['/'];
        
        for (const part of parts) {
            if (current && current[part] && current[part].type === 'folder') {
                current = current[part].contents;
            } else {
                return null;
            }
        }
        
        return current;
    }

    getFileContent(path, filename) {
        const dirContents = this.getDirectoryContents(path);
        if (dirContents && dirContents[filename] && dirContents[filename].type === 'file') {
            return dirContents[filename].content;
        }
        return null;
    }

    saveDocument(content, filename) {
        localStorage.setItem('linuxos-texteditor', content);
        localStorage.setItem('linuxos-texteditor-filename', filename);
        
        // Also save to virtual file system
        const dirContents = this.getDirectoryContents('/home/user/Documents');
        if (dirContents) {
            dirContents[filename] = { type: 'file', content: content };
        }
    }

    // Window management
    startDragging(e) {
        const windowElement = e.target.closest('.window');
        if (!windowElement) return;

        this.focusWindow(windowElement);

        const rect = windowElement.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const handleMouseMove = (e) => {
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            windowElement.style.left = `${Math.max(0, Math.min(x, window.innerWidth - windowElement.offsetWidth))}px`;
            windowElement.style.top = `${Math.max(0, Math.min(y, window.innerHeight - windowElement.offsetHeight - 32))}px`;
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    focusWindow(windowElement) {
        this.windows.forEach(w => w.classList.remove('active'));
        windowElement.classList.add('active');
        windowElement.style.zIndex = ++this.zIndex;
        this.activeWindow = windowElement;
        this.updateDock();
    }

    closeWindow(windowElement) {
        const index = this.windows.indexOf(windowElement);
        if (index > -1) {
            this.windows.splice(index, 1);
        }
        
        windowElement.remove();
        
        if (this.activeWindow === windowElement) {
            this.activeWindow = this.windows.length > 0 ? this.windows[this.windows.length - 1] : null;
        }
        
        this.updateDock();
    }

    minimizeWindow(windowElement) {
        windowElement.classList.add('minimized');
        this.updateDock();
    }

    restoreWindow(windowElement) {
        windowElement.classList.remove('minimized');
        this.focusWindow(windowElement);
    }

    updateDock() {
        document.querySelectorAll('.dock-item[data-app]').forEach(item => {
            const appName = item.dataset.app;
            const hasWindow = this.windows.some(w => w.dataset.app === appName && !w.classList.contains('minimized'));
            item.classList.toggle('active', hasWindow);
        });
    }

    // System functions
    updateTime() {
        const timeElement = document.getElementById('currentTime');
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timeElement.textContent = timeString;
    }

    updateDate() {
        const dateElement = document.getElementById('currentDate');
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        });
        dateElement.textContent = dateString;
    }

    showDesktop() {
        this.windows.forEach(window => {
            if (!window.classList.contains('minimized')) {
                this.minimizeWindow(window);
            }
        });
    }

    showPowerMenu() {
        const menu = confirm('Power Options:\nOK = Shutdown\nCancel = Reboot');
        if (menu) {
            this.shutdown();
        } else {
            this.reboot();
        }
    }

    shutdown() {
        const shutdownScreen = document.getElementById('shutdownScreen');
        const desktop = document.getElementById('desktop');
        
        desktop.classList.add('hidden');
        shutdownScreen.classList.remove('hidden');
        
        setTimeout(() => {
            shutdownScreen.querySelector('h1').textContent = 'System Halted';
            shutdownScreen.querySelector('.shutdown-spinner').style.display = 'none';
        }, 3000);
    }

    reboot() {
        location.reload();
    }

    logout() {
        this.windows.forEach(window => window.remove());
        this.windows = [];
        this.showDesktop();
    }

    toggleNetwork() {
        const networkIcon = document.getElementById('networkIcon');
        const isConnected = networkIcon.textContent === '📶';
        networkIcon.textContent = isConnected ? '📵' : '📶';
        this.showNotification(isConnected ? 'Network Disconnected' : 'Network Connected');
    }

    toggleVolume() {
        const volumeIcon = document.getElementById('volumeIcon');
        const isMuted = volumeIcon.textContent === '🔇';
        volumeIcon.textContent = isMuted ? '🔊' : '🔇';
        this.showNotification(isMuted ? 'Volume Unmuted' : 'Volume Muted');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 40px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            font-size: 13px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showContextMenu(e) {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.classList.remove('hidden');
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.classList.add('hidden');
    }

    handleKeyboard(e) {
        // Global keyboard shortcuts
        if (e.ctrlKey) {
            switch (e.key) {
                case 't':
                    e.preventDefault();
                    this.openApp('terminal');
                    break;
                case 'n':
                    e.preventDefault();
                    this.openApp('texteditor');
                    break;
                case 'f':
                    e.preventDefault();
                    this.openApp('filemanager');
                    break;
            }
        }
        
        if (e.altKey && e.key === 'F4') {
            e.preventDefault();
            if (this.activeWindow) {
                this.closeWindow(this.activeWindow);
            }
        }
    }

    autoSave() {
        // Auto-save text editor content
        const textEditor = document.querySelector('.notes-window');
        if (textEditor) {
            const textarea = textEditor.querySelector('.notes-textarea');
            if (textarea) {
                localStorage.setItem('linuxos-texteditor', textarea.value);
            }
        }
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('linuxos-settings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
    }

    saveSettings() {
        localStorage.setItem('linuxos-settings', JSON.stringify(this.settings));
    }

    playStartupSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.3);
            oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.6);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.6);
        } catch (e) {
            // Audio not supported
        }
    }
}

// Initialize LinuxOS when page loads
document.addEventListener('DOMContentLoaded', () => {
    new LinuxOS();
});
