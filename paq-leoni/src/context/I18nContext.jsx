import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const I18nContext = createContext(null);

const DICTIONARY = {
  fr: {
    dashboard: "Tableau de bord",
    collaborators: "Collaborateurs",
    paq_dossier: "Dossier PAQ",
    entretien: "Entretien",
    positif: "Positif",
    explicatif: "Explicatif",
    daccord: "D'accord",
    mesure: "De mesure",
    decision: "De decision",
    final: "Final",
    notifications: "Notifications",
    logout: "Logout",
    search: "Rechercher...",
    back: "Retour",
    add: "Ajouter",
    edit: "Modifier",
    delete: "Supprimer",
    cancel: "Annuler",
    validate: "Valider",
    save_draft: "Enregistrer brouillon",
    select_site: "Selectionnez votre site de production",
    select_plant: "Selectionnez votre plant",
    login: "Se Connecter",
    login_title: "Connexion",
    site: "Site",
    plant: "Plant",
    password: "Mot de passe",
    username: "Login",
    return_sites: "Retour aux sites",
  },
  ar: {
    dashboard: "لوحة التحكم",
    collaborators: "المتعاونون",
    paq_dossier: "ملف PAQ",
    entretien: "مقابلة",
    positif: "إيجابي",
    explicatif: "تفسيري",
    daccord: "اتفاق",
    mesure: "إجراءات",
    decision: "قرار",
    final: "نهائي",
    notifications: "الإشعارات",
    logout: "تسجيل الخروج",
    search: "بحث...",
    back: "رجوع",
    add: "إضافة",
    edit: "تعديل",
    delete: "حذف",
    cancel: "إلغاء",
    validate: "تأكيد",
    save_draft: "حفظ المسودة",
    select_site: "اختر موقع الإنتاج",
    select_plant: "اختر المصنع",
    login: "تسجيل الدخول",
    login_title: "الدخول",
    site: "الموقع",
    plant: "المصنع",
    password: "كلمة المرور",
    username: "اسم المستخدم",
    return_sites: "العودة إلى المواقع",
  },
};

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "fr");

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const t = useMemo(() => {
    return (key, fallback) => DICTIONARY[lang]?.[key] || fallback || key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit être utilisé dans I18nProvider");
  return ctx;
}
