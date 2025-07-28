class WebOS {
    constructor() {
        this.windows = [];
        this.activeWindow = null;
        this.zIndex = 100;
        this.terminalHistory = [];
        this.currentPath = '/home/user';
        this.fileSystem = {
            '/home/user': {
                'Documents': { type: 'folder', contents: {
                    'letter.txt': { type: 'file', content: 'Dear friend,\n\nThis is a sample document...' },
                    'report.txt': { type: 'file', content: 'Annual Report\n\nSales increased by 15% this year...' }
                }},
                'Pictures': { type: 'folder', contents: {
                    'vacation.jpg': { type: 'file', content: 'Image: Beautiful sunset at the beach' },
                    'family.jpg': { type: 'file', content: 'Image: Family photo from last Christmas' }
                }},
                'readme.txt': { type: 'file', content: 'Welcome to WebOS!\n\nThis is a fake operating system built with web technologies.\n\nFeatures:\n- Draggable windows\n- Terminal with commands\n- File explorer\n- Notes app\n- Calculator\n\nEnjoy exploring!' },
                'photo.jpg': { type: 'file', content: 'Image: A beautiful landscape photo' }
            }
        };
        this.calculator = {
            display: '0',
            previousValue: null,
            operation: null,
            waitingForNewValue: false
        };
        
        this.init();
    }

    init() {
        this.showBootScreen();
        this.setupEventListeners();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        
        // Auto-save notes
        setInterval(() => this.autoSaveNotes(), 5000);
    }

    showBootScreen() {
        const bootScreen = document.getElementById('bootScreen');
        const desktop = document.getElementById('desktop');
        
        setTimeout(() => {
            bootScreen.classList.add('hidden');
            desktop.classList.remove('hidden');
            this.playBootSound();
        }, 4000);
    }

    setupEventListeners() {
        // Desktop icons
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.addEventListener('dblclick', (e) => {
                const appName = e.currentTarget.dataset.app;
                this.openApp(appName);
            });
        });

        // Shutdown button
        document.getElementById('shutdownBtn').addEventListener('click', () => {
            this.shutdown();
        });

        // Network icon (fake connectivity toggle)
        document.getElementById('networkIcon').addEventListener('click', () => {
            this.toggleNetwork();
        });

        // Window dragging
        document.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-header')) {
                this.startDragging(e);
            }
        });

        // Prevent context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
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

        // Add to taskbar
        this.addToTaskbar(windowElement, appName);
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
            case 'notes':
                this.setupNotes(windowElement);
                break;
            case 'fileexplorer':
                this.setupFileExplorer(windowElement);
                break;
            case 'calculator':
                this.setupCalculator(windowElement);
                break;
        }
    }

    setupTerminal(windowElement) {
        const input = windowElement.querySelector('.terminal-input');
        const output = windowElement.querySelector('.terminal-output');

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = input.value.trim();
                this.executeCommand(command, output);
                input.value = '';
            }
        });

        // Focus input when window is clicked
        windowElement.addEventListener('click', () => {
            input.focus();
        });

        input.focus();
    }

    executeCommand(command, output) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.textContent = `user@webos:~$ ${command}`;
        output.appendChild(line);

        const response = document.createElement('div');
        response.className = 'terminal-line';

        switch (command.toLowerCase()) {
            case 'help':
                response.innerHTML = `Available commands:
help     - Show this help message
clear    - Clear the terminal
date     - Show current date and time
whoami   - Show current user
ls       - List files in current directory
pwd      - Show current directory
echo     - Echo text back
shutdown - Shutdown the system
reboot   - Restart the system`;
                break;
            case 'clear':
                output.innerHTML = '<div class="terminal-line">WebOS Terminal v1.0</div><div class="terminal-line">Type \'help\' for available commands</div>';
                return;
            case 'date':
                response.textContent = new Date().toString();
                break;
            case 'whoami':
                response.textContent = 'user';
                break;
            case 'ls':
                response.textContent = 'Documents  Pictures  readme.txt  photo.jpg';
                break;
            case 'pwd':
                response.textContent = '/home/user';
                break;
            case 'shutdown':
                response.textContent = 'Shutting down system...';
                output.appendChild(response);
                setTimeout(() => this.shutdown(), 2000);
                return;
            case 'reboot':
                response.textContent = 'Rebooting system...';
                output.appendChild(response);
                setTimeout(() => this.reboot(), 2000);
                return;
            default:
                if (command.startsWith('echo ')) {
                    response.textContent = command.substring(5);
                } else if (command === '') {
                    // Empty command, just show prompt
                    return;
                } else {
                    response.textContent = `Command not found: ${command}. Type 'help' for available commands.`;
                }
        }

        output.appendChild(response);
        output.scrollTop = output.scrollHeight;
    }

    setupNotes(windowElement) {
        const textarea = windowElement.querySelector('.notes-textarea');
        const status = windowElement.querySelector('.notes-status');

        // Load saved notes
        const savedNotes = localStorage.getItem('webos-notes');
        if (savedNotes) {
            textarea.value = savedNotes;
        }

        textarea.addEventListener('input', () => {
            status.textContent = 'Unsaved changes';
            status.style.color = '#ff6b6b';
        });
    }

    setupFileExplorer(windowElement) {
        const fileItems = windowElement.querySelectorAll('.file-item');
        
        fileItems.forEach(item => {
            item.addEventListener('dblclick', () => {
                const fileName = item.dataset.name;
                const isFolder = item.classList.contains('folder');
                
                if (isFolder) {
                    this.openFolder(fileName, windowElement);
                } else {
                    this.openFile(fileName);
                }
            });
        });
    }

    openFile(fileName) {
        const fileContent = this.getFileContent(this.currentPath, fileName);
        if (fileContent) {
            alert(`${fileName}:\n\n${fileContent}`);
        }
    }

    openFolder(folderName, windowElement) {
        // This is a simplified folder navigation
        const pathElement = windowElement.querySelector('.current-path');
        pathElement.textContent = `${this.currentPath}/${folderName}`;
        
        // Update file list (simplified)
        const content = windowElement.querySelector('.file-explorer-content');
        content.innerHTML = `
            <div class="file-item file" data-name="sample.txt">
                <div class="file-icon">📄</div>
                <span class="file-name">sample.txt</span>
            </div>
        `;
    }

    getFileContent(path, fileName) {
        const pathData = this.fileSystem[path];
        if (pathData && pathData[fileName]) {
            return pathData[fileName].content;
        }
        return 'File content not available';
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
    }

    handleCalculatorInput(value, screen) {
        const calc = this.calculator;

        if (value === 'C') {
            calc.display = '0';
            calc.previousValue = null;
            calc.operation = null;
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
        } else if (value === '.') {
            if (calc.display.indexOf('.') === -1) {
                calc.display += '.';
            }
        } else if (value === '±') {
            calc.display = (parseFloat(calc.display) * -1).toString();
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
            windowElement.style.top = `${Math.max(0, Math.min(y, window.innerHeight - windowElement.offsetHeight - 50))}px`;
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    focusWindow(windowElement) {
        // Remove active class from all windows
        this.windows.forEach(w => w.classList.remove('active'));
        
        // Add active class to focused window
        windowElement.classList.add('active');
        windowElement.style.zIndex = ++this.zIndex;
        this.activeWindow = windowElement;

        // Update taskbar
        this.updateTaskbar();
    }

    closeWindow(windowElement) {
        const index = this.windows.indexOf(windowElement);
        if (index > -1) {
            this.windows.splice(index, 1);
        }
        
        windowElement.remove();
        this.removeFromTaskbar(windowElement);
        
        if (this.activeWindow === windowElement) {
            this.activeWindow = this.windows.length > 0 ? this.windows[this.windows.length - 1] : null;
        }
    }

    minimizeWindow(windowElement) {
        windowElement.classList.add('minimized');
        this.updateTaskbar();
    }

    addToTaskbar(windowElement, appName) {
        const taskbarApps = document.getElementById('taskbarApps');
        const appButton = document.createElement('div');
        appButton.className = 'taskbar-app';
        appButton.textContent = this.getAppTitle(appName);
        appButton.dataset.window = this.windows.indexOf(windowElement);

        appButton.addEventListener('click', () => {
            if (windowElement.classList.contains('minimized')) {
                windowElement.classList.remove('minimized');
                this.focusWindow(windowElement);
            } else {
                this.minimizeWindow(windowElement);
            }
        });

        taskbarApps.appendChild(appButton);
        windowElement.taskbarButton = appButton;
    }

    removeFromTaskbar(windowElement) {
        if (windowElement.taskbarButton) {
            windowElement.taskbarButton.remove();
        }
    }

    updateTaskbar() {
        document.querySelectorAll('.taskbar-app').forEach(app => {
            app.classList.remove('active');
        });

        if (this.activeWindow && this.activeWindow.taskbarButton) {
            this.activeWindow.taskbarButton.classList.add('active');
        }
    }

    getAppTitle(appName) {
        const titles = {
            terminal: 'Terminal',
            notes: 'Notes',
            fileexplorer: 'Files',
            calculator: 'Calculator'
        };
        return titles[appName] || appName;
    }

    autoSaveNotes() {
        const notesWindows = this.windows.filter(w => w.dataset.app === 'notes');
        notesWindows.forEach(window => {
            const textarea = window.querySelector('.notes-textarea');
            const status = window.querySelector('.notes-status');
            
            if (textarea && textarea.value !== localStorage.getItem('webos-notes')) {
                localStorage.setItem('webos-notes', textarea.value);
                status.textContent = 'Auto-saved';
                status.style.color = '#4CAF50';
            }
        });
    }

    updateTime() {
        const timeElement = document.getElementById('currentTime');
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timeElement.textContent = timeString;
    }

    toggleNetwork() {
        const networkIcon = document.getElementById('networkIcon');
        const isConnected = networkIcon.textContent === '📶';
        
        networkIcon.textContent = isConnected ? '📵' : '📶';
        
        // Show notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
        `;
        notification.textContent = isConnected ? 'Network Disconnected' : 'Network Connected';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    shutdown() {
        const shutdownScreen = document.getElementById('shutdownScreen');
        const desktop = document.getElementById('desktop');
        
        desktop.classList.add('hidden');
        shutdownScreen.classList.remove('hidden');
        
        setTimeout(() => {
            shutdownScreen.querySelector('h1').textContent = 'System Off';
            shutdownScreen.querySelector('.shutdown-spinner').style.display = 'none';
        }, 3000);
    }

    reboot() {
        const shutdownScreen = document.getElementById('shutdownScreen');
        const desktop = document.getElementById('desktop');
        const bootScreen = document.getElementById('bootScreen');
        
        desktop.classList.add('hidden');
        shutdownScreen.classList.remove('hidden');
        
        setTimeout(() => {
            // Clear all windows
            this.windows.forEach(window => window.remove());
            this.windows = [];
            document.getElementById('taskbarApps').innerHTML = '';
            
            // Show boot screen again
            shutdownScreen.classList.add('hidden');
            bootScreen.classList.remove('hidden');
            
            // Reset boot screen
            const progress = bootScreen.querySelector('.loading-progress');
            progress.style.animation = 'none';
            setTimeout(() => {
                progress.style.animation = 'loading 3s ease-in-out forwards';
            }, 100);
            
            setTimeout(() => {
                bootScreen.classList.add('hidden');
                desktop.classList.remove('hidden');
            }, 4000);
        }, 2000);
    }

    playBootSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // Audio not supported or blocked
        }
    }
}

// Initialize WebOS when page loads
document.addEventListener('DOMContentLoaded', () => {
    new WebOS();
});
