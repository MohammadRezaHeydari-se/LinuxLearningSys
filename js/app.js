const App = {
  currentView: 'lessons',
  currentLessonId: null,
  currentStepIndex: 0,
  currentContainer: null,

  async init() {
    await I18n.init('en');
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
    const langs = [
      { code: 'en', name: 'English' },
      { code: 'sv', name: 'Svenska' },
      { code: 'fa', name: 'فارسی' }
    ];
    langs.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.code;
      opt.textContent = l.name;
      if (l.code === I18n.currentLang) opt.selected = true;
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
    if (sel) {
      sel.onchange = () => I18n.switchLang(sel.value);
    }
  },

  renderLessonList() {
    const container = document.createElement('div');
    container.className = 'lesson-list-container';

    const heading = document.createElement('h2');
    heading.className = 'section-heading';
    heading.textContent = I18n.t('ui.selectLesson');
    container.appendChild(heading);

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

      let statusBadge = '';
      if (completed) {
        statusBadge = `<span class="badge badge-completed">${I18n.t('ui.completed')}</span>`;
      } else if (stepCount > 0) {
        statusBadge = `<span class="badge badge-progress">${I18n.t('ui.inProgress')}</span>`;
      } else if (!unlocked) {
        statusBadge = `<span class="badge badge-locked">${I18n.t('ui.locked')}</span>`;
      }

      card.innerHTML = `
        <div class="lesson-icon">${lesson.icon}</div>
        <h3 class="lesson-title">${lesson.title}</h3>
        <p class="lesson-desc">${lesson.description}</p>
        <div class="lesson-meta">
          ${statusBadge}
          <span class="step-count">${I18n.t('ui.step')} ${stepCount}/${lesson.steps.length}</span>
        </div>
      `;

      if (unlocked) {
        card.addEventListener('click', () => {
          this.currentView = 'lesson';
          this.currentLessonId = lesson.id;
          this.render();
        });
        card.style.cursor = 'pointer';
      }

      grid.appendChild(card);
    });

    container.appendChild(grid);
    return container;
  },

  renderLessonView(container) {
    const lesson = I18n.getLesson(this.currentLessonId);
    if (!lesson) {
      this.currentView = 'lessons';
      this.render();
      return;
    }

    const progress = Steps.getProgress();
    const completedSteps = progress.completedSteps[this.currentLessonId] || [];

    let nextUncompletedIndex = lesson.steps.findIndex(s => !completedSteps.includes(s.id));
    if (nextUncompletedIndex === -1) nextUncompletedIndex = lesson.steps.length - 1;
    this.currentStepIndex = nextUncompletedIndex;

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-back';
    backBtn.textContent = I18n.t('ui.backToLessons');
    backBtn.addEventListener('click', () => {
      this.currentView = 'lessons';
      this.render();
    });
    container.appendChild(backBtn);

    const progressBar = document.createElement('div');
    progressBar.className = 'step-progress-bar';
    const pct = lesson.steps.length > 0 ? (completedSteps.length / lesson.steps.length) * 100 : 0;
    progressBar.innerHTML = `<div class="step-progress-fill" style="width: ${pct}%"></div>`;
    container.appendChild(progressBar);

    const completedCount = completedSteps.length;
    const headerInfo = document.createElement('div');
    headerInfo.className = 'lesson-header-info';
    headerInfo.innerHTML = `
      <h2>${lesson.icon} ${lesson.title}</h2>
      <span>${I18n.t('ui.lesson')} ${completedCount} / ${lesson.steps.length}</span>
    `;
    container.appendChild(headerInfo);

    if (completedSteps.length === lesson.steps.length) {
      container.appendChild(this.renderLessonComplete(lesson));
    } else {
      this.renderStep(container, lesson, this.currentStepIndex);
    }
  },

  renderLessonComplete(lesson) {
    const div = document.createElement('div');
    div.className = 'lesson-complete';

    const progress = Steps.getProgress();
    const allDone = I18n.translations.lessons.every(l => progress.completedLessons.includes(l.id));

    if (allDone) {
      div.innerHTML = `<h2>${I18n.t('ui.courseComplete')}</h2>`;
    } else {
      div.innerHTML = `<h2>${I18n.t('ui.lessonComplete')}</h2>`;
    }

    div.innerHTML += `<div class="summary-list"><h3>${I18n.t('ui.whatYouLearned')}</h3><ul>`;
    lesson.steps.forEach(s => {
      div.innerHTML += `<li>${s.summary}</li>`;
    });
    div.innerHTML += `</ul></div>`;

    if (!allDone) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-primary';
      nextBtn.textContent = I18n.t('ui.backToLessons');
      nextBtn.addEventListener('click', () => {
        this.currentView = 'lessons';
        this.render();
      });
      div.appendChild(nextBtn);
    }

    return div;
  },

  renderStep(container, lesson, stepIndex) {
    const step = lesson.steps[stepIndex];

    const wrapper = document.createElement('div');
    wrapper.className = 'step-wrapper';

    const stepCard = document.createElement('div');
    stepCard.className = 'step-card';

    stepCard.innerHTML = `
      <div class="step-header">
        <span class="step-number">${I18n.t('ui.step')} ${stepIndex + 1} ${I18n.t('ui.of')} ${lesson.steps.length}</span>
        <span class="step-instruction">${step.instruction}</span>
      </div>
      <div class="step-description">${step.description}</div>
      <div class="step-command-hint">
        <strong>${I18n.t('ui.expectedCommand')}</strong>
        <code>${step.command}</code>
      </div>
      <div class="step-hint">
        <em>${I18n.t('ui.hint')}</em> ${step.summary}
      </div>
    `;
    wrapper.appendChild(stepCard);

    const terminalContainer = document.createElement('div');
    terminalContainer.id = 'step-terminal';
    wrapper.appendChild(terminalContainer);

    container.appendChild(wrapper);

    setTimeout(() => {
      Terminal.init('step-terminal');
      Terminal.writeLine(I18n.t('ui.welcomeMessage'), 'terminal-welcome');
      Terminal.writeLine('');
      Terminal.writeOutput(I18n.t('ui.typeCommand'));
      Terminal.onCommand((cmd) => this.handleCommand(cmd, lesson, step, container));
    }, 50);
  },

  handleCommand(cmd, lesson, currentStep, container) {
    const expected = currentStep.command.trim();

    if (cmd.trim() === expected) {
      Terminal.writeSuccess(I18n.t('ui.correct'));
      if (currentStep.expectedOutput) {
        Terminal.writeHtml(`<div class="terminal-simulated-output">${currentStep.expectedOutput.replace(/\n/g, '<br>')}</div>`);
      }

      Steps.markStepComplete(this.currentLessonId, currentStep.id);

      setTimeout(() => {
        const nextStep = Steps.getNextStep(this.currentLessonId, currentStep.id);
        if (nextStep) {
          Terminal.writeLine('');
          Terminal.writeHtml(`<div class="step-summary"><strong>${I18n.t('ui.summary')}:</strong> ${currentStep.summary}</div>`);
          Terminal.writeLine('');

          Terminal.lock();

          const actionLine = document.createElement('div');
          actionLine.className = 'terminal-line terminal-action';

          const continueBtn = document.createElement('button');
          continueBtn.className = 'btn btn-next';
          continueBtn.textContent = I18n.t('ui.nextStep');
          continueBtn.addEventListener('click', () => {
            this.currentStepIndex = lesson.steps.findIndex(s => s.id === nextStep.id);
            this.render();
          });
          actionLine.appendChild(continueBtn);
          Terminal.output.appendChild(actionLine);
          Terminal.scrollToBottom();
        } else {
          Terminal.lock();
          this.render();
        }
      }, 800);
    } else {
      Terminal.writeError(I18n.t('ui.incorrect'));
      Terminal.writeHtml(`<div class="terminal-hint">${I18n.t('ui.expectedCommand')} <code>${expected}</code></div>`);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
