const Steps = {
  STORAGE_KEY: 'linux_learning_progress',

  getProgress() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : { completedLessons: [], completedSteps: {} };
    } catch {
      return { completedLessons: [], completedSteps: {} };
    }
  },

  saveProgress(progress) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
  },

  isLessonCompleted(lessonId) {
    const progress = this.getProgress();
    return progress.completedLessons.includes(lessonId);
  },

  isStepCompleted(lessonId, stepId) {
    const progress = this.getProgress();
    return progress.completedSteps[lessonId]?.includes(stepId);
  },

  isLessonUnlocked(lessonId) {
    const lessons = I18n.translations.lessons;
    const idx = lessons.findIndex(l => l.id === lessonId);
    if (idx === 0) return true;
    return this.isLessonCompleted(lessons[idx - 1].id);
  },

  markStepComplete(lessonId, stepId) {
    const progress = this.getProgress();
    if (!progress.completedSteps[lessonId]) {
      progress.completedSteps[lessonId] = [];
    }
    if (!progress.completedSteps[lessonId].includes(stepId)) {
      progress.completedSteps[lessonId].push(stepId);
    }

    const lesson = I18n.getLesson(lessonId);
    if (lesson && progress.completedSteps[lessonId].length === lesson.steps.length) {
      if (!progress.completedLessons.includes(lessonId)) {
        progress.completedLessons.push(lessonId);
      }
    }

    this.saveProgress(progress);
    return progress;
  },

  getNextStep(lessonId, currentStepId) {
    const lesson = I18n.getLesson(lessonId);
    if (!lesson) return null;
    const idx = lesson.steps.findIndex(s => s.id === currentStepId);
    if (idx < lesson.steps.length - 1) {
      return lesson.steps[idx + 1];
    }
    return null;
  },

  resetProgress() {
    localStorage.removeItem(this.STORAGE_KEY);
    App.render();
  }
};
