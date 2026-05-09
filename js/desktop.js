const Desktop = {
  element: null,

  init(containerId) {
    this.element = document.getElementById(containerId);
    this.render();
  },

  render() {
    if (!this.element) return;
    const dir = VFS.cwd;

    this.element.innerHTML = `
      <div class="desktop">
        <div class="desktop-toolbar">
          <div class="desktop-path">
            <span class="path-icon">📂</span>
            <span class="path-text">${dir.path}</span>
          </div>
          <div class="desktop-actions">
            <button class="desktop-btn" data-action="home" title="Home">🏠</button>
            <button class="desktop-btn" data-action="up" title="Up">⬆</button>
            <button class="desktop-btn" data-action="refresh" title="Refresh">🔄</button>
          </div>
        </div>
        <div class="desktop-content">
          ${this.renderBreadcrumb(dir)}
          <div class="desktop-grid" id="desktop-grid">
            ${this.renderDotDirs(dir)}
            ${dir.children.map(c => this.renderNode(c)).join('')}
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  },

  renderBreadcrumb(dir) {
    const parts = [];
    let current = dir;
    while (current) {
      parts.unshift(current);
      current = current.parent;
    }
    return `
      <div class="desktop-breadcrumb">
        ${parts.map((p, i) => `
          <span class="crumb" data-path="${p.path}">${p.isRoot ? '/' : this.escapeHtml(p.name)}</span>
          ${i < parts.length - 1 ? '<span class="crumb-sep">/</span>' : ''}
        `).join('')}
      </div>
    `;
  },

  renderDotDirs(dir) {
    if (dir.isRoot) return '';
    return `
      <div class="desktop-item desktop-item-dir" data-path="..">
        <div class="item-icon">📁</div>
        <div class="item-name">..</div>
        <div class="item-meta">parent directory</div>
      </div>
    `;
  },

  renderNode(node) {
    if (node.type === 'dir') {
      return `
        <div class="desktop-item desktop-item-dir" data-path="${node.name}">
          <div class="item-icon">📁</div>
          <div class="item-name">${this.escapeHtml(node.name)}</div>
          <div class="item-meta">${this.formatPerms(node)}</div>
        </div>
      `;
    }
    const ext = node.name.split('.').pop().toLowerCase();
    let icon = '📄';
    if (ext === 'sh') icon = '⚡';
    else if (ext === 'txt') icon = '📝';
    else if (['jpg', 'png', 'gif', 'svg'].includes(ext)) icon = '🖼️';
    else if (ext === 'html') icon = '🌐';
    else if (ext === 'zip' || ext === 'tar' || ext === 'gz') icon = '📦';

    const execClass = node.isExecutable ? ' executable' : '';
    return `
      <div class="desktop-item desktop-item-file${execClass}" data-path="${node.name}" title="Size: ${node.size} bytes | Mode: ${node.mode.toString(8)}">
        <div class="item-icon">${icon}</div>
        <div class="item-name">${this.escapeHtml(node.name)}${node.isExecutable ? '*' : ''}</div>
        <div class="item-meta">${this.formatPerms(node)}</div>
      </div>
    `;
  },

  attachEvents() {
    const grid = document.getElementById('desktop-grid');
    if (grid) {
      grid.addEventListener('dblclick', (e) => {
        const item = e.target.closest('.desktop-item-dir');
        if (item && item.dataset.path) {
          this.navigateTo(item.dataset.path);
        }
      });
    }

    const crumbs = this.element.querySelectorAll('.crumb');
    crumbs.forEach(crumb => {
      crumb.addEventListener('click', () => {
        const path = crumb.dataset.path;
        if (path) {
          const target = VFS.resolve(path);
          if (target instanceof FSDir) {
            VFS.cwd = target;
            this.render();
          }
        }
      });
    });

    this.element.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'home') this.goHome();
        else if (action === 'up') this.goUp();
        else if (action === 'refresh') this.render();
      });
    });
  },

  navigateTo(path) {
    VFS.cd(path);
    this.render();
  },

  goHome() {
    VFS.cwd = VFS.resolve('/home/user');
    this.render();
  },

  goUp() {
    if (VFS.cwd.parent) {
      VFS.cwd = VFS.cwd.parent;
      this.render();
    }
  },

  formatPerms(node) {
    const t = node.type === 'dir' ? 'd' : '-';
    const u = ((node.mode >> 6) & 7).toString(2).padStart(3, '0').replace(/1/g, 'x').replace(/0/g, '-');
    const g = ((node.mode >> 3) & 7).toString(2).padStart(3, '0').replace(/1/g, 'x').replace(/0/g, '-');
    const o = (node.mode & 7).toString(2).padStart(3, '0').replace(/1/g, 'x').replace(/0/g, '-');
    return t + this.permLetters(u) + this.permLetters(g) + this.permLetters(o);
  },

  permLetters(str) {
    return str.replace(/x/g, 'r').replace(/-r/g, '-w').replace(/--/g, '--');
  },

  escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
};
