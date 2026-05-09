class FSNode {
  constructor(name, parent) {
    this.name = name;
    this.parent = parent;
    this.mode = 0o644;
    this.uid = 1000;
    this.gid = 1000;
    this.atime = new Date();
    this.mtime = new Date();
    this.ctime = new Date();
  }

  get path() {
    if (!this.parent) return '/';
    if (this.parent.path === '/') return '/' + this.name;
    return this.parent.path + '/' + this.name;
  }

  get isRoot() { return !this.parent; }
}

class FSDir extends FSNode {
  constructor(name, parent) {
    super(name, parent);
    this.children = [];
    this.mode = 0o755;
  }

  get type() { return 'dir'; }

  child(name) {
    return this.children.find(c => c.name === name) || null;
  }

  ls() {
    return [...this.children];
  }

  add(node) {
    node.parent = this;
    this.children.push(node);
    this.mtime = new Date();
  }

  remove(node) {
    const idx = this.children.indexOf(node);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      this.mtime = new Date();
      return true;
    }
    return false;
  }
}

class FSFile extends FSNode {
  constructor(name, parent, content = '') {
    super(name, parent);
    this.content = content;
  }

  get type() { return 'file'; }

  get size() {
    return new TextEncoder().encode(this.content).length;
  }

  get isExecutable() {
    return !!(this.mode & 0o111);
  }
}

const VFS = {
  root: null,
  cwd: null,
  lastOutput: '',
  variables: {},

  init() {
    this.root = new FSDir('/', null);
    this.cwd = this.root;
    this.variables = {};

    const home = new FSDir('home', this.root);
    this.root.add(home);
    const user = new FSDir('user', home);
    home.add(user);

    user.add(new FSDir('Documents', user));
    user.add(new FSDir('Downloads', user));
    user.add(new FSDir('Desktop', user));
    user.add(new FSDir('Music', user));
    user.add(new FSDir('Pictures', user));
    user.add(new FSDir('Projects', user));

    const tmp = new FSDir('tmp', this.root);
    this.root.add(tmp);

    const etc = new FSDir('etc', this.root);
    this.root.add(etc);
    const passwd = new FSFile('passwd', etc,
      'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin');
    passwd.mode = 0o644;
    etc.add(passwd);

    const bin = new FSDir('bin', this.root);
    this.root.add(bin);

    this.cwd = user;
    return this;
  },

  resolve(path) {
    if (path === undefined || path === null) return null;
    if (path === '') return this.cwd;
    if (path === '/') return this.root;
    if (path === '.') return this.cwd;
    if (path === '..') return this.cwd.parent || this.root;
    if (path === '~') return this.resolve('/home/user');

    let parts, start;
    if (path.startsWith('/')) {
      parts = path.split('/').filter(Boolean);
      start = this.root;
    } else {
      parts = path.split('/').filter(Boolean);
      start = this.cwd;
    }

    let node = start;
    for (const part of parts) {
      if (part === '..') {
        node = node.parent || this.root;
      } else if (part === '.') {
        continue;
      } else {
        if (node instanceof FSDir) {
          const child = node.child(part);
          if (child) {
            node = child;
          } else {
            return null;
          }
        } else {
          return null;
        }
      }
    }
    return node;
  },

  abs(path) {
    if (!path) return this.cwd.path;
    if (path.startsWith('/')) return path;
    if (path.startsWith('~/')) return '/home/user/' + path.slice(2);
    if (path === '~') return '/home/user';
    if (this.cwd.path === '/') return '/' + path;
    return this.cwd.path + '/' + path;
  },

  resolveDir(path) {
    const node = this.resolve(path);
    if (node instanceof FSDir) return node;
    const p = this.abs(path);
    const parts = p.split('/').filter(Boolean);
    parts.pop();
    const parentPath = '/' + parts.join('/');
    return this.resolve(parentPath) || this.cwd;
  },

  pwd() {
    this.lastOutput = this.cwd.path;
    return this.cwd.path;
  },

  cd(path) {
    const target = this.resolve(path);
    if (target instanceof FSDir) {
      this.cwd = target;
      this.lastOutput = '';
      return true;
    }
    this.lastOutput = `cd: ${path}: No such directory`;
    return false;
  },

  ls(path) {
    const target = path ? this.resolve(path) : this.cwd;
    if (!target || !(target instanceof FSDir)) {
      this.lastOutput = `ls: ${path || ''}: No such directory`;
      return '';
    }
    const names = target.children.map(c => {
      if (c.type === 'dir') return c.name + '/';
      if (c.isExecutable) return c.name + '*';
      return c.name;
    });
    this.lastOutput = names.join('  ');
    return this.lastOutput;
  },

  lsLong(path) {
    const target = path ? this.resolve(path) : this.cwd;
    if (!target || !(target instanceof FSDir)) {
      this.lastOutput = `ls: ${path || ''}: No such directory`;
      return '';
    }
    const lines = target.children.map(c => {
      const perms = this.formatPerms(c);
      const links = '1';
      const owner = c.uid === 0 ? 'root' : 'user';
      const group = c.gid === 0 ? 'root' : 'user';
      const size = c.type === 'dir' ? '4096' : String(c.size);
      const date = c.mtime.toISOString().slice(0, 10);
      const time = c.mtime.toISOString().slice(11, 16);
      return `${perms} ${links} ${owner} ${group} ${size} ${date} ${time} ${c.name}`;
    });
    const total = Math.ceil(target.children.reduce((s, c) => s + (c.type === 'dir' ? 4096 : c.size), 0) / 1024);
    this.lastOutput = `total ${total}\n` + lines.join('\n');
    return this.lastOutput;
  },

  formatPerms(node) {
    const t = node.type === 'dir' ? 'd' : '-';
    const u = ((node.mode >> 6) & 7).toString(2).padStart(3, '0').replace(/1/g, 'x').replace(/0/g, '-');
    const g = ((node.mode >> 3) & 7).toString(2).padStart(3, '0').replace(/1/g, 'x').replace(/0/g, '-');
    const o = (node.mode & 7).toString(2).padStart(3, '0').replace(/1/g, 'x').replace(/0/g, '-');
    return t + u.replace(/x/g, 'r').replace(/-r/g, '-w').replace(/--/g, '--') +
              g.replace(/x/g, 'r').replace(/-r/g, '-w').replace(/--/g, '--') +
              o.replace(/x/g, 'r').replace(/-r/g, '-w').replace(/--/g, '--');
  },

  touch(path, content = '') {
    const p = this.abs(path);
    const name = p.split('/').filter(Boolean).pop();
    const parentPath = '/' + p.split('/').filter(Boolean).slice(0, -1).join('/');
    const parent = this.resolve(parentPath);
    if (!parent || !(parent instanceof FSDir)) {
      this.lastOutput = `touch: ${path}: No such file or directory`;
      return false;
    }
    const existing = parent.child(name);
    if (existing) {
      existing.mtime = new Date();
      if (content) existing.content = content;
      this.lastOutput = '';
      return true;
    }
    parent.add(new FSFile(name, parent, content));
    this.lastOutput = '';
    return true;
  },

  mkdir(path) {
    const p = this.abs(path);
    const name = p.split('/').filter(Boolean).pop();
    const parentPath = '/' + p.split('/').filter(Boolean).slice(0, -1).join('/');
    const parent = this.resolve(parentPath);
    if (!parent || !(parent instanceof FSDir)) {
      this.lastOutput = `mkdir: ${path}: No such file or directory`;
      return false;
    }
    if (parent.child(name)) {
      this.lastOutput = `mkdir: ${name}: File exists`;
      return false;
    }
    parent.add(new FSDir(name, parent));
    this.lastOutput = '';
    return true;
  },

  cp(src, dest) {
    const srcNode = this.resolve(src);
    if (!srcNode) {
      this.lastOutput = `cp: ${src}: No such file or directory`;
      return false;
    }
    const dp = this.abs(dest);
    const destName = dp.split('/').filter(Boolean).pop();
    const destParentPath = '/' + dp.split('/').filter(Boolean).slice(0, -1).join('/');
    const destParent = this.resolve(destParentPath);
    if (!destParent || !(destParent instanceof FSDir)) {
      this.lastOutput = `cp: ${dest}: No such file or directory`;
      return false;
    }
    let copy;
    if (srcNode.type === 'file') {
      copy = new FSFile(destName, destParent, srcNode.content);
      copy.mode = srcNode.mode;
    } else {
      copy = new FSDir(destName, destParent);
      this.copyTree(srcNode, copy);
    }
    copy.uid = srcNode.uid;
    copy.gid = srcNode.gid;
    destParent.add(copy);
    this.lastOutput = '';
    return true;
  },

  copyTree(src, dest) {
    if (src.type !== 'dir') return;
    for (const child of src.children) {
      if (child.type === 'file') {
        const f = new FSFile(child.name, dest, child.content);
        f.mode = child.mode;
        dest.add(f);
      } else {
        const d = new FSDir(child.name, dest);
        dest.add(d);
        this.copyTree(child, d);
      }
    }
  },

  mv(src, dest) {
    const srcNode = this.resolve(src);
    if (!srcNode) {
      this.lastOutput = `mv: ${src}: No such file or directory`;
      return false;
    }
    const dp = this.abs(dest);
    const destName = dp.split('/').filter(Boolean).pop();
    const destParentPath = '/' + dp.split('/').filter(Boolean).slice(0, -1).join('/');
    const destParent = this.resolve(destParentPath);
    if (!destParent || !(destParent instanceof FSDir)) {
      this.lastOutput = `mv: ${dest}: No such file or directory`;
      return false;
    }
    srcNode.parent.remove(srcNode);
    srcNode.name = destName;
    destParent.add(srcNode);
    this.lastOutput = '';
    return true;
  },

  rm(path) {
    const node = this.resolve(path);
    if (!node) {
      this.lastOutput = `rm: ${path}: No such file or directory`;
      return false;
    }
    if (node === this.root) {
      this.lastOutput = 'rm: cannot remove root directory';
      return false;
    }
    if (node === this.cwd || (this.cwd.path.startsWith(node.path + '/'))) {
      this.lastOutput = `rm: cannot remove '${path}': Device or resource busy`;
      return false;
    }
    node.parent.remove(node);
    this.lastOutput = '';
    return true;
  },

  chmod(modeStr, path) {
    const node = this.resolve(path);
    if (!node) {
      this.lastOutput = `chmod: ${path}: No such file or directory`;
      return false;
    }
    if (modeStr.startsWith('+')) {
      const perm = modeStr[1];
      if (perm === 'x') node.mode |= 0o111;
      if (perm === 'w') node.mode |= 0o222;
      if (perm === 'r') node.mode |= 0o444;
    } else if (modeStr.startsWith('-')) {
      const perm = modeStr[1];
      if (perm === 'x') node.mode &= ~0o111;
      if (perm === 'w') node.mode &= ~0o222;
      if (perm === 'r') node.mode &= ~0o444;
    } else if (/^\d{3}$/.test(modeStr)) {
      node.mode = parseInt(modeStr, 8);
    }
    this.lastOutput = '';
    return true;
  },

  chown(owner, group, path) {
    const node = this.resolve(path);
    if (!node) {
      this.lastOutput = `chown: ${path}: No such file or directory`;
      return false;
    }
    if (owner) node.uid = owner === 'root' ? 0 : 1000;
    if (group) node.gid = group === 'root' ? 0 : 1000;
    this.lastOutput = '';
    return true;
  },

  cat(path) {
    const node = this.resolve(path);
    if (!node) {
      this.lastOutput = `cat: ${path}: No such file or directory`;
      return '';
    }
    if (node.type === 'dir') {
      this.lastOutput = `cat: ${path}: Is a directory`;
      return '';
    }
    this.lastOutput = node.content;
    return node.content;
  },

  head(path, n = 10) {
    const content = this.cat(path);
    if (!content) return content;
    const lines = content.split('\n').slice(0, n).join('\n');
    this.lastOutput = lines;
    return lines;
  },

  tail(path, n = 10) {
    const content = this.cat(path);
    if (!content) return content;
    const lines = content.split('\n').slice(-n).join('\n');
    this.lastOutput = lines;
    return lines;
  },

  wc(path) {
    const content = this.cat(path);
    if (!content) return '';
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(Boolean).length;
    const chars = content.length;
    this.lastOutput = `  ${lines}  ${words}  ${chars} ${path}`;
    return this.lastOutput;
  },

  grep(pattern, path) {
    const content = this.cat(path);
    if (!content) return '';
    const lines = content.split('\n').filter(l => l.includes(pattern));
    this.lastOutput = lines.join('\n');
    return this.lastOutput;
  },

  sort(path) {
    const content = this.cat(path);
    if (!content) return '';
    const lines = content.split('\n').sort().join('\n');
    this.lastOutput = lines;
    return lines;
  },

  cut(path, delimiter, field) {
    const content = this.cat(path);
    if (!content) return '';
    const lines = content.split('\n').map(l => {
      const parts = l.split(delimiter);
      return parts[field - 1] || '';
    }).join('\n');
    this.lastOutput = lines;
    return lines;
  },

  exec(cmdStr) {
    const trimmed = cmdStr.trim();
    if (!trimmed) return { output: '', success: true };

    if (trimmed.includes('&&')) {
      const cmds = trimmed.split('&&').map(s => s.trim()).filter(Boolean);
      let last = { output: '', success: true };
      for (const c of cmds) {
        last = this.exec(c);
        if (!last.success) return last;
      }
      return last;
    }

    const varMatch = trimmed.match(/^([a-zA-Z_]\w*)=(.*)$/);
    if (varMatch && !trimmed.includes(' ')) {
      const val = varMatch[2].replace(/^["']|["']$/g, '');
      this.variables[varMatch[1]] = val;
      this.lastOutput = '';
      return { output: '', success: true };
    }

    const parts = this.parseCommand(trimmed);
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case 'pwd':
        return { output: this.pwd(), success: true };
      case 'cd': {
        const ok = this.cd(args[0] || '~');
        return { output: this.lastOutput, success: ok };
      }
      case 'ls': {
        if (args.includes('-la') || args.includes('-al')) {
          const rest = args.filter(a => !a.startsWith('-'));
          return { output: this.lsLong(rest[0] || null), success: true };
        }
        const rest = args.filter(a => !a.startsWith('-'));
        return { output: this.ls(rest[0] || null), success: true };
      }
      case 'touch': {
        if (!args.length) return { output: 'touch: missing operand', success: false };
        const ok = args.every(a => this.touch(a));
        return { output: this.lastOutput, success: ok };
      }
      case 'mkdir': {
        if (!args.length) return { output: 'mkdir: missing operand', success: false };
        const ok = args.every(a => this.mkdir(a));
        return { output: this.lastOutput, success: ok };
      }
      case 'cp': {
        if (args.length < 2) return { output: 'cp: missing operand', success: false };
        const ok = this.cp(args[0], args[1]);
        return { output: this.lastOutput, success: ok };
      }
      case 'mv': {
        if (args.length < 2) return { output: 'mv: missing operand', success: false };
        const ok = this.mv(args[0], args[1]);
        return { output: this.lastOutput, success: ok };
      }
      case 'rm': {
        if (!args.length) return { output: 'rm: missing operand', success: false };
        const ok = args.every(a => this.rm(a));
        return { output: this.lastOutput, success: ok };
      }
      case 'chmod': {
        if (args.length < 2) return { output: 'chmod: missing operand', success: false };
        const ok = this.chmod(args[0], args[1]);
        return { output: this.lastOutput, success: ok };
      }
      case 'chown': {
        if (args.length < 2) return { output: 'chown: missing operand', success: false };
        const ownerGroup = args[0].split(':');
        const owner = ownerGroup[0];
        const group = ownerGroup[1] || '';
        const ok = this.chown(owner, group, args[1]);
        return { output: this.lastOutput, success: ok };
      }
      case 'cat':
        if (!args.length) return { output: '', success: true };
        return { output: this.cat(args[0]), success: true };
      case 'head':
        if (args[0] && args[0].startsWith('-n')) {
          const n = parseInt(args[1]) || 10;
          return { output: this.head(args[2] || args[0], n), success: true };
        }
        return { output: this.head(args[0]), success: true };
      case 'tail':
        if (args[0] && args[0].startsWith('-n')) {
          const n = parseInt(args[1]) || 10;
          return { output: this.tail(args[2] || args[0], n), success: true };
        }
        return { output: this.tail(args[0]), success: true };
      case 'wc':
        return { output: this.wc(args[0] || ''), success: true };
      case 'grep': {
        if (args[0] === '-i') {
          return { output: this.grep(args[1], args[2]), success: true };
        }
        return { output: this.grep(args[0], args[1]), success: true };
      }
      case 'sort':
        return { output: this.sort(args[0] || ''), success: true };
      case 'cut': {
        const dIdx = args.indexOf('-d');
        const fIdx = args.indexOf('-f');
        const d = dIdx !== -1 ? args[dIdx + 1] : ':';
        const f = fIdx !== -1 ? parseInt(args[fIdx + 1]) : 1;
        const file = args[args.length - 1];
        return { output: this.cut(file, d, f), success: true };
      }
      case 'echo': {
        const text = args.join(' ');
        const resolved = text.replace(/\$(\w+)/g, (_, n) => this.variables[n] || '');
        const cleaned = resolved.replace(/^["']|["']$/g, '');
        this.lastOutput = cleaned;
        return { output: cleaned, success: true };
      }
      case 'whoami':
        return { output: 'user', success: true };
      case 'id':
        return { output: 'uid=1000(user) gid=1000(user) groups=1000(user),4(adm),27(sudo)', success: true };
      case 'ps':
        return { output: '  PID TTY          TIME CMD\n 1234 pts/0    00:00:00 bash\n 5678 pts/0    00:00:00 ps', success: true };
      case 'kill':
        return { output: '', success: true };
      case 'ping':
        return { output: 'PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.\n64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=12.3 ms\n64 bytes from 8.8.8.8: icmp_seq=2 ttl=118 time=11.8 ms\n64 bytes from 8.8.8.8: icmp_seq=3 ttl=118 time=12.1 ms\n64 bytes from 8.8.8.8: icmp_seq=4 ttl=118 time=11.9 ms\n\n--- 8.8.8.8 ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss', success: true };
      case 'curl':
        return { output: '<!doctype html>\n<html>\n<head>\n    <title>Example Domain</title>\n</head>\n<body>\n    <p>This domain is for use in illustrative examples.</p>\n</body>\n</html>', success: true };
      case 'ss':
        return { output: 'State      Recv-Q Send-Q  Local Address:Port  Peer Address:Port\nLISTEN     0      128     0.0.0.0:22          0.0.0.0:*\nLISTEN     0      128     [::]:22             [::]:*', success: true };
      case 'tar': {
        if (args.includes('-czf') || args.includes('-xzf')) {
          return { output: '', success: true };
        }
        return { output: 'tar: usage: tar -czf archive.tar.gz files...', success: false };
      }
      case 'zip': {
        return { output: '', success: true };
      }
      case 'unzip':
        return { output: '', success: true };
      case 'for': {
        const fm = trimmed.match(/^for\s+(\w+)\s+in\s+(.+?);\s*do\s+(.+?);\s*done$/);
        if (fm) {
          const vn = fm[1], list = fm[2].split(/\s+/), body = fm[3];
          const results = [];
          for (const item of list) {
            const r = body.replace(new RegExp('\\$' + vn, 'g'), item);
            const res = this.exec(r);
            if (res.output) results.push(res.output);
          }
          this.lastOutput = results.join('\n');
          return { output: results.join('\n'), success: true };
        }
        return { output: '', success: true };
      }
      default:
        this.lastOutput = `bash: ${cmd}: command not found`;
        return { output: this.lastOutput, success: false };
    }
  },

  parseCommand(str) {
    const args = [];
    let current = '';
    let inQuote = null;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (inQuote) {
        if (ch === inQuote) {
          inQuote = null;
        } else {
          current += ch;
        }
      } else if (ch === '"' || ch === "'") {
        inQuote = ch;
      } else if (ch === ' ' || ch === '\t') {
        if (current) {
          args.push(current);
          current = '';
        }
      } else {
        current += ch;
      }
    }
    if (current) args.push(current);
    return args;
  }
};
