const Terminal = {
  element: null,
  output: null,
  input: null,
  inputLine: null,
  prompt: null,
  history: [],
  historyIndex: -1,
  commandCallback: null,
  locked: false,

  init(containerId) {
    this.element = document.getElementById(containerId);
    this.element.innerHTML = '';
    this.element.className = 'terminal';

    const output = document.createElement('div');
    output.className = 'terminal-output';
    this.output = output;
    this.element.appendChild(output);

    const inputLine = document.createElement('div');
    inputLine.className = 'terminal-input-line';

    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    this.prompt = prompt;
    inputLine.appendChild(prompt);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'terminal-input';
    input.autofocus = true;
    input.spellcheck = false;
    input.autocomplete = 'off';
    this.input = input;
    inputLine.appendChild(input);
    this.element.appendChild(inputLine);

    this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    this.element.addEventListener('click', () => this.focus());

    this.updatePrompt();
    this.focus();
  },

  updatePrompt() {
    this.prompt.textContent = I18n.t('ui.simulatedPrompt') + ' ';
  },

  focus() {
    if (!this.locked) {
      this.input.focus();
    }
  },

  lock() {
    this.locked = true;
    this.input.disabled = true;
  },

  unlock() {
    this.locked = false;
    this.input.disabled = false;
    this.focus();
  },

  handleKeydown(e) {
    if (this.locked) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = this.input.value.trim();
      if (cmd) {
        this.history.push(cmd);
        this.historyIndex = this.history.length;
        this.writeLine(`${I18n.t('ui.simulatedPrompt')} ${cmd}`);
        if (this.commandCallback) {
          this.commandCallback(cmd);
        }
      }
      this.input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.input.value = this.history[this.historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.input.value = this.history[this.historyIndex];
      } else {
        this.historyIndex = this.history.length;
        this.input.value = '';
      }
    }
  },

  writeLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.innerHTML = this.escapeHtml(text);
    this.output.appendChild(line);
    this.scrollToBottom();
  },

  writeHtml(html, className = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.innerHTML = html;
    this.output.appendChild(line);
    this.scrollToBottom();
  },

  writeOutput(text) {
    this.writeLine(text, 'terminal-output-text');
  },

  writeSuccess(text) {
    this.writeLine(text, 'terminal-success');
  },

  writeError(text) {
    this.writeLine(text, 'terminal-error');
  },

  clear() {
    this.output.innerHTML = '';
  },

  scrollToBottom() {
    this.element.scrollTop = this.element.scrollHeight;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  onCommand(callback) {
    this.commandCallback = callback;
  }
};
