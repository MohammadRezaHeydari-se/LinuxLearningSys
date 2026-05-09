const App = {
  currentView: 'lessons',
  currentLessonId: null,
  currentStepIndex: 0,
  currentContainer: null,
  nextStepBtn: null,

  init() {
    I18n.init('en');
    VFS.init();
    this.render();
  },

  render() {
    const root = document.getElementById('app');
    root.innerHTML = '';

    const header = this.createHeader();
    root.appendChild(header);

    const main = document.createElement('div');
    main.className = 'main-content';
    root.appendChild(main);

    if (this.currentView === 'lessons') {
      main.appendChild(this.renderLessonList());
    } else if (this.currentView === 'lesson') {
      const container = document.createElement('div');
      container.className = 'lesson-view';
      this.currentContainer = container;
      this.nextStepBtn = null;
      this.renderLessonView(container);
      main.appendChild(container);
    }

    this.setupLanguageSelector();
  },

  createHeader() {
    const header = document.createElement('header');
    header.className = 'app-header';
    const title = document.createElement('h1');
    title.className = 'app-title';
    title.textContent = I18n.t('ui.appTitle');
    header.appendChild(title);

    const controls = document.createElement('div');
    controls.className = 'header-controls';

    const langLabel = document.createElement('span');
    langLabel.className = 'lang-label';
    langLabel.textContent = I18n.t('ui.language') + ':';
    controls.appendChild(langLabel);

    const langSelect = document.createElement('select');
    langSelect.className = 'lang-select';
    langSelect.id = 'langSelect';
    ['en', 'sv', 'fa'].forEach(code => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = { en: 'English', sv: 'Svenska', fa: 'فارسی' }[code];
      if (code === I18n.currentLang) opt.selected = true;
      langSelect.appendChild(opt);
    });
    controls.appendChild(langSelect);

    if (this.currentView === 'lessons') {
      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn btn-reset';
      resetBtn.textContent = I18n.t('ui.resetProgress');
      resetBtn.addEventListener('click', () => {
        if (confirm(I18n.t('ui.resetConfirm'))) {
          Steps.resetProgress();
        }
      });
      controls.appendChild(resetBtn);
    }

    header.appendChild(controls);
    return header;
  },

  setupLanguageSelector() {
    const sel = document.getElementById('langSelect');
    if (sel) sel.onchange = () => I18n.switchLang(sel.value);
  },

  renderLessonList() {
    const container = document.createElement('div');
    container.className = 'lesson-list-container';
    container.innerHTML = `<h2 class="section-heading">${I18n.t('ui.selectLesson')}</h2>`;

    const grid = document.createElement('div');
    grid.className = 'lesson-grid';

    I18n.translations.lessons.forEach(lesson => {
      const card = document.createElement('div');
      card.className = 'lesson-card';
      const unlocked = Steps.isLessonUnlocked(lesson.id);
      const completed = Steps.isLessonCompleted(lesson.id);
      const progress = Steps.getProgress();
      const stepCount = progress.completedSteps[lesson.id]?.length || 0;

      if (!unlocked) card.classList.add('locked');
      if (completed) card.classList.add('completed');

      const badge = completed
        ? `<span class="badge badge-completed">${I18n.t('ui.completed')}</span>`
        : stepCount > 0
          ? `<span class="badge badge-progress">${I18n.t('ui.inProgress')}</span>`
          : !unlocked
            ? `<span class="badge badge-locked">${I18n.t('ui.locked')}</span>`
            : '';

      card.innerHTML = `
        <div class="lesson-icon">${lesson.icon}</div>
        <h3 class="lesson-title">${lesson.title}</h3>
        <p class="lesson-desc">${lesson.description}</p>
        <div class="lesson-meta">${badge}<span class="step-count">${stepCount}/${lesson.steps.length}</span></div>
      `;

      if (unlocked) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          VFS.init();
          this.currentView = 'lesson';
          this.currentLessonId = lesson.id;
          this.render();
        });
      }

      grid.appendChild(card);
    });

    container.appendChild(grid);
    return container;
  },

  renderLessonView(container) {
    const lesson = I18n.getLesson(this.currentLessonId);
    if (!lesson) { this.currentView = 'lessons'; this.render(); return; }

    const progress = Steps.getProgress();
    const completedSteps = progress.completedSteps[this.currentLessonId] || [];
    const nextIdx = lesson.steps.findIndex(s => !completedSteps.includes(s.id));
    this.currentStepIndex = nextIdx === -1 ? lesson.steps.length - 1 : nextIdx;

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-back';
    backBtn.textContent = I18n.t('ui.backToLessons');
    backBtn.addEventListener('click', () => { this.currentView = 'lessons'; this.render(); });
    container.appendChild(backBtn);

    const pct = lesson.steps.length ? (completedSteps.length / lesson.steps.length) * 100 : 0;
    const progressBar = document.createElement('div');
    progressBar.className = 'step-progress-bar';
    progressBar.innerHTML = `<div class="step-progress-fill" style="width:${pct}%"></div>`;
    container.appendChild(progressBar);

    const headerInfo = document.createElement('div');
    headerInfo.className = 'lesson-header-info';
    headerInfo.innerHTML = `<h2>${lesson.icon} ${lesson.title}</h2><span>${completedSteps.length} / ${lesson.steps.length}</span>`;
    container.appendChild(headerInfo);

    if (completedSteps.length === lesson.steps.length) {
      container.appendChild(this.renderLessonComplete(lesson));
      return;
    }

    const split = document.createElement('div');
    split.className = 'lesson-split';

    const left = document.createElement('div');
    left.className = 'lesson-left';
    this.renderStep(left, lesson, this.currentStepIndex);
    split.appendChild(left);

    const right = document.createElement('div');
    right.className = 'lesson-right';
    right.innerHTML = '<div id="desktop-panel"></div>';
    split.appendChild(right);
    container.appendChild(split);

    setTimeout(() => Desktop.init('desktop-panel'), 50);
  },

  renderLessonComplete(lesson) {
    const div = document.createElement('div');
    div.className = 'lesson-complete';
    const allDone = I18n.translations.lessons.every(l => Steps.getProgress().completedLessons.includes(l.id));

    div.innerHTML = `<h2>${allDone ? I18n.t('ui.courseComplete') : I18n.t('ui.lessonComplete')}</h2>`;
    div.innerHTML += `<div class="summary-list"><h3>${I18n.t('ui.whatYouLearned')}</h3><ul>`;
    lesson.steps.forEach(s => { div.innerHTML += `<li>${s.summary}</li>`; });
    div.innerHTML += `</ul></div>`;

    if (!allDone) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.textContent = I18n.t('ui.backToLessons');
      btn.addEventListener('click', () => { this.currentView = 'lessons'; this.render(); });
      div.appendChild(btn);
    }
    return div;
  },

  renderStep(container, lesson, stepIndex) {
    const step = lesson.steps[stepIndex];
    const wrapper = document.createElement('div');
    wrapper.className = 'step-wrapper';

    const completed = Steps.isStepCompleted(this.currentLessonId, step.id);

    const stepCard = document.createElement('div');
    stepCard.className = 'step-card';
    stepCard.innerHTML = `
      <div class="step-header">
        <span class="step-number">${I18n.t('ui.step')} ${stepIndex + 1} / ${lesson.steps.length}</span>
        <span class="step-instruction">${step.instruction}</span>
      </div>
      <div class="step-description">${step.description}</div>
      <div class="step-command-hint">
        <strong>${I18n.t('ui.expectedCommand')}</strong>
        <code>${step.command}</code>
      </div>
      <div class="step-hint"><em>${I18n.t('ui.hint')}</em> ${step.summary}</div>
    `;
    wrapper.appendChild(stepCard);

    if (completed) {
      const done = document.createElement('div');
      done.className = 'step-already-done';
      done.textContent = '✓ ' + I18n.t('ui.completed');
      wrapper.appendChild(done);
    }

    const termContainer = document.createElement('div');
    termContainer.id = 'step-terminal';
    wrapper.appendChild(termContainer);
    container.appendChild(wrapper);

    setTimeout(() => {
      Terminal.init('step-terminal');
      Terminal.writeLine('🐧 ' + I18n.t('ui.welcomeMessage'), 'terminal-welcome');
      Terminal.writeLine('');
      Terminal.writeOutput(I18n.t('ui.sandboxWelcome'));
      Terminal.writeOutput(I18n.t('ui.typeTarget'));
      Terminal.onCommand(cmd => this.handleCommand(cmd, lesson, step, container));
    }, 50);
  },

  addNextStepButton(lesson, currentStep) {
    if (this.nextStepBtn) return;
    const nextStep = Steps.getNextStep(this.currentLessonId, currentStep.id);
    if (!nextStep) {
      Terminal.writeLine('');
      Terminal.writeHtml(`<div class="step-summary"><strong>${I18n.t('ui.summary')}:</strong> ${currentStep.summary}</div>`);
      Terminal.writeLine('');
      const actionLine = document.createElement('div');
      actionLine.className = 'terminal-line terminal-action';
      const finishBtn = document.createElement('button');
      finishBtn.className = 'btn btn-next';
      finishBtn.textContent = I18n.t('ui.lessonComplete') + ' →';
      finishBtn.addEventListener('click', () => { this.render(); });
      actionLine.appendChild(finishBtn);
      Terminal.output.appendChild(actionLine);
      Terminal.scrollToBottom();
      this.nextStepBtn = finishBtn;
      return;
    }

    Terminal.writeLine('');
    Terminal.writeHtml(`<div class="step-summary"><strong>${I18n.t('ui.summary')}:</strong> ${currentStep.summary}</div>`);
    Terminal.writeLine('');
    Terminal.writeHtml(`<div class="step-done-msg">✅ ${I18n.t('ui.correct')} ${I18n.t('ui.practiceOrMove')}</div>`);
    Terminal.writeLine('');

    const actionLine = document.createElement('div');
    actionLine.className = 'terminal-line terminal-action';
    const continueBtn = document.createElement('button');
    continueBtn.className = 'btn btn-next';
    continueBtn.textContent = I18n.t('ui.nextStep') + ' →';
    continueBtn.addEventListener('click', () => {
      this.currentStepIndex = lesson.steps.findIndex(s => s.id === nextStep.id);
      this.nextStepBtn = null;
      this.render();
    });
    actionLine.appendChild(continueBtn);
    Terminal.output.appendChild(actionLine);
    Terminal.scrollToBottom();
    this.nextStepBtn = continueBtn;
  },

  handleCommand(cmd, lesson, currentStep, container) {
    cmd = cmd.trim();
    if (!cmd) return;

    const result = VFS.exec(cmd);
    Terminal.writeOutput('$ ' + cmd);

    if (result.output) {
      Terminal.writeHtml(`<div class="terminal-simulated-output">${result.output.replace(/\n/g, '<br>')}</div>`);
    }

    Desktop.render();

    const isTarget = cmd === currentStep.command.trim();
    const alreadyDone = Steps.isStepCompleted(this.currentLessonId, currentStep.id);

    if (isTarget && !alreadyDone) {
      Steps.markStepComplete(this.currentLessonId, currentStep.id);
      this.addNextStepButton(lesson, currentStep);
    } else if (isTarget && alreadyDone && !this.nextStepBtn) {
      this.addNextStepButton(lesson, currentStep);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
