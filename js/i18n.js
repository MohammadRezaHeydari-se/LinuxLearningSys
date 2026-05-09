const I18n = {
  currentLang: 'en',
  translations: {},

  init(lang = 'en') {
    this.currentLang = lang;
    this.load(lang);
  },

  load(lang) {
    const data = LOCALES[lang];
    if (data) {
      this.translations = data;
    } else {
      console.error(`Locale not found: ${lang}`);
      this.translations = LOCALES['en'] || {};
    }
  },

  t(key) {
    const keys = key.split('.');
    let val = this.translations;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        return key;
      }
    }
    return val;
  },

  getLesson(id) {
    return this.translations.lessons.find(l => l.id === id);
  },

  switchLang(lang) {
    this.currentLang = lang;
    this.load(lang);
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    App.render();
  }
};
