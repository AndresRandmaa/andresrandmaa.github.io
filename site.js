// Small enhancements; every page reads fine without this file.

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Forward and back cursor on links between case studies (mouse only).
// Replaces the static SVG cursors in styles.css with one that grows in.
(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const links = ".studies a, .next a, .next-home a";
  const cursor = document.createElement("div");
  cursor.className = "link-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.append(document.createElement("span"));
  document.body.append(cursor);
  document.documentElement.classList.add("has-link-cursor");

  const move = (e) => {
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  };

  addEventListener("pointermove", move, { passive: true });

  document.addEventListener("pointerover", (e) => {
    const link = e.target.closest(links);
    if (!link || e.pointerType !== "mouse") return;
    move(e);
    cursor.dataset.dir = link.matches(".studies a, .next-forward") ? "forward" : "back";
    cursor.classList.add("is-visible");
  });

  document.addEventListener("pointerout", (e) => {
    const link = e.target.closest(links);
    if (link && !link.contains(e.relatedTarget)) cursor.classList.remove("is-visible");
  });
})();

// Screens linked with a.zoom open enlarged on the page instead of as a bare
// file. Modified clicks (new tab, download) keep the plain link.
(() => {
  const zooms = document.querySelectorAll("a.zoom");
  if (!zooms.length) return;

  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.setAttribute("aria-label", "Enlarged screen");
  const close = document.createElement("button");
  close.className = "lightbox-close";
  close.type = "button";
  close.textContent = "Close";
  const img = document.createElement("img");
  img.alt = "";
  dialog.append(close, img);
  document.body.append(dialog);

  const hide = () => {
    dialog.classList.remove("is-open");
    setTimeout(() => dialog.close(), reducedMotion ? 0 : 150);
  };

  dialog.addEventListener("click", hide);
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    hide();
  });

  for (const link of zooms) {
    link.addEventListener("click", (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const thumb = link.querySelector("img");
      img.src = link.href;
      img.alt = thumb ? thumb.alt : "";
      img.style.maxWidth = thumb ? `min(100%, ${thumb.naturalWidth}px)` : "";
      dialog.showModal();
      requestAnimationFrame(() => dialog.classList.add("is-open"));
    });
  }
})();

// Case pages: content below the first screen fades up as it scrolls into view.
(() => {
  if (reducedMotion || !document.querySelector(".intro-case") || !("IntersectionObserver" in window)) return;

  const items = [];
  for (const section of document.querySelectorAll("main > section")) {
    for (const child of section.children) {
      if (child.tagName === "H2") continue;
      if (child.classList.contains("prose")) items.push(...child.children);
      else items.push(child);
    }
  }

  const fold = innerHeight;
  const hidden = items.filter((el) => el.getBoundingClientRect().top > fold);

  const observer = new IntersectionObserver((entries) => {
    let delay = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.style.transitionDelay = `${delay}ms`;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
      delay = Math.min(delay + 80, 240);
    }
  }, { rootMargin: "0px 0px -8% 0px" });

  for (const el of hidden) {
    el.classList.add("reveal");
    observer.observe(el);
  }
})();
