const I18n = {
  currentLang: 'en',
  translations: {},

  async init(lang = 'en') {
    this.currentLang = lang;
    await this.load(lang);
  },

  async load(lang) {
    try {
      const res = await fetch(`locales/${lang}.json`);
      this.translations = await res.json();
    } catch (e) {
      console.error(`Failed to load locale: ${lang}`, e);
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

  async switchLang(lang) {
    this.currentLang = lang;
    await this.load(lang);
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    App.render();
  }
};
