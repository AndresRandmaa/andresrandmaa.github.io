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

  let current = null;

  for (const link of zooms) {
    link.addEventListener("click", (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      current = link;
      // The page shows a display-size copy; its width and height attributes
      // are the original's. Size the view from those, show the copy at once,
      // then swap in the original once it has been decoded.
      const thumb = link.querySelector("img");
      const w = thumb ? Number(thumb.getAttribute("width")) : 0;
      const h = thumb ? Number(thumb.getAttribute("height")) : 0;
      img.style.width = w && h ? `min(${w}px, 100%, calc((100vh - 3rem) * ${w / h}))` : "";
      img.alt = thumb ? thumb.alt : "";
      img.src = (thumb && thumb.currentSrc) || link.href;
      const full = new Image();
      full.src = link.href;
      full.decode().then(() => {
        if (current === link && dialog.open) img.src = link.href;
      }, () => {});
      dialog.showModal();
      requestAnimationFrame(() => dialog.classList.add("is-open"));
    });
  }
})();

// Case pages: each numbered section (number, node, title and content) fades up
// as one block when it scrolls into view. Sections already on the first screen
// stay as they are.
(() => {
  if (reducedMotion || !document.querySelector(".intro-case") || !("IntersectionObserver" in window)) return;

  const fold = innerHeight;
  if (!fold) return;
  const parts = (section) => [...section.children];

  // Start loading a section's images a screen before it arrives, so they are
  // ready when it fades in instead of popping in one by one.
  const preload = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const img of entry.target.querySelectorAll('img[loading="lazy"]')) img.loading = "eager";
      preload.unobserve(entry.target);
    }
  }, { rootMargin: "100% 0px" });

  // Fade in everything within the next screen, which is all a reader can reach
  // while the fade runs; anything further down is shown without animation, so
  // nothing large animates off screen.
  const reveal = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const el of parts(entry.target)) {
        el.classList.add(el.getBoundingClientRect().top < innerHeight * 2 ? "is-revealed" : "is-shown");
      }
      reveal.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -15% 0px" });

  for (const section of document.querySelectorAll("main > section")) {
    preload.observe(section);
    if (section.getBoundingClientRect().top <= fold) continue;
    for (const el of parts(section)) el.classList.add("reveal");
    reveal.observe(section);
  }
})();
