(() => {
  document.querySelectorAll("[data-news]").forEach((section) => {
    const toggle = section.querySelector(".homepage-news-toggle");
    const items = section.querySelector(".homepage-news-items");
    if (!toggle || !items) return;

    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.textContent = expanded ? "« close" : "more »";
      section.classList.toggle("is-expanded", expanded);
      items.scrollTop = 0;
    });
  });
})();
