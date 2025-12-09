import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// 导入翻译文件
import translationZH from "./locales/zh/translation.json";
import translationEN from "./locales/en/translation.json";

// 翻译资源
const resources = {
  zh: {
    translation: translationZH
  },
  en: {
    translation: translationEN
  }
};

i18n
  .use(initReactI18next) // 传递 i18n 实例到 react-i18next
  .init({
    resources,
    lng: navigator.language, // 默认语言
    fallbackLng: "en", // 备用语言
    interpolation: {
      escapeValue: false // React 已经安全地处理了 XSS
    }
  });

export default i18n;
