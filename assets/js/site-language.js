(() => {
  const storageKey = "site-language";
  const root = document.documentElement;
  const url = new URL(window.location.href);
  const requestedLanguage = url.searchParams.get("lang");
  let language = "en";

  try {
    language = localStorage.getItem(storageKey) === "ja" ? "ja" : "en";
  } catch {
    // Language switching also works when browser storage is unavailable.
  }
  if (requestedLanguage === "en" || requestedLanguage === "ja") {
    language = requestedLanguage;
    url.searchParams.delete("lang");
    window.history.replaceState(window.history.state, "", url);
  }
  root.dataset.siteLanguage = language;
  root.lang = language;

  const applyLanguage = (nextLanguage) => {
    language = nextLanguage;
    root.dataset.siteLanguage = language;
    root.lang = document.readyState === "loading" || document.querySelector("[data-language-page]") ? language : "en";
    try {
      localStorage.setItem(storageKey, language);
    } catch {
      // The current page still switches without persistence.
    }
    document.querySelectorAll("[data-language-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.languageToggle === language));
    });
    for (const attribute of ["aria-label", "title"]) {
      document.querySelectorAll(`[data-${attribute}-en]`).forEach((node) => {
        node.setAttribute(attribute, node.getAttribute(`data-${attribute}-${language}`));
      });
    }
  };

  document.addEventListener("site-language-header-ready", () => {
    applyLanguage(language);
    document.querySelectorAll("[data-language-control]").forEach((control) => {
      control.hidden = false;
    });
    document.querySelectorAll("[data-language-toggle]").forEach((button) => {
      button.addEventListener("click", () => applyLanguage(button.dataset.languageToggle));
    });
  });

  document.addEventListener("DOMContentLoaded", () => applyLanguage(language));
})();
