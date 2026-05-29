import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import ru from './locales/ru.json';
import id from './locales/id.json';

const savedLanguage = localStorage.getItem('language') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ja: { translation: ja },
    zh: { translation: zh },
    ru: { translation: ru },
    id: { translation: id },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
