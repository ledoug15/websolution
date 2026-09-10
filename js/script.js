/* ==========================================================================
   IVYCORE WEB SOLUTIONS — script.js
   Interactions only. No content lives here — everything is in the HTML.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     Footer year
  --------------------------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------------
     Sticky header shadow on scroll
  --------------------------------------------------------------------- */
  var header = document.getElementById("site-header");
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------------------------------------------------------------------
     Mobile menu (hamburger)
  --------------------------------------------------------------------- */
  var hamburger = document.getElementById("hamburger");
  var hamburgerIcon = document.getElementById("hamburger-icon");
  var mobileNav = document.getElementById("mobile-nav");
  var backdrop = document.getElementById("mobile-nav-backdrop");

  function setHamburgerIcon(iconId) {
    if (!hamburgerIcon) return;
    var use = hamburgerIcon.querySelector("use");
    if (use) use.setAttribute("href", "#" + iconId);
  }
  function openMenu() {
    mobileNav.classList.add("open");
    backdrop.classList.add("open");
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.setAttribute("aria-label", "Fermer le menu");
    mobileNav.setAttribute("aria-hidden", "false");
    setHamburgerIcon("i-close");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    mobileNav.classList.remove("open");
    backdrop.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Ouvrir le menu");
    mobileNav.setAttribute("aria-hidden", "true");
    setHamburgerIcon("i-menu");
    document.body.style.overflow = "";
  }
  if (hamburger && mobileNav && backdrop) {
    hamburger.addEventListener("click", function () {
      var isOpen = mobileNav.classList.contains("open");
      isOpen ? closeMenu() : openMenu();
    });
    backdrop.addEventListener("click", closeMenu);
    document.querySelectorAll("[data-nav-mobile]").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------------------------------------------------------------------
     Active section highlight in main nav
  --------------------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("href");
      return id && id.indexOf("#") === 0 ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = "#" + entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle("active", link.getAttribute("href") === id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------------------------------------------------------------------
     Scroll reveal for elements marked .reveal (cards, headings, etc.)
  --------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------------------------------------------------------------
     Scroll reveal for whole sections (.sect-reveal) — the section band
     itself fades/slides in as it's scrolled into view, on top of the
     individual .reveal elements inside it. Triggers earlier than .reveal
     since sections are tall.
  --------------------------------------------------------------------- */
  var sectionEls = document.querySelectorAll(".sect-reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    sectionEls.forEach(function (el) { el.classList.add("in-view"); });
  } else {
    var sectionObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -10% 0px" }
    );
    sectionEls.forEach(function (el) { sectionObserver.observe(el); });
  }

  /* ---------------------------------------------------------------------
     Contact form — submits to Formspree (https://formspree.io/f/xlgyrkqb)
     via fetch, so the visitor stays on the page (no redirect). Falls back
     to a normal form POST if fetch/JS is unavailable, since the <form>
     already has the Formspree action + method set in the HTML.
  --------------------------------------------------------------------- */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");

  function setStatus(message, kind) {
    status.textContent = message;
    status.className = "form-status" + (kind ? " " + kind : "");
  }

  function handleSubmit(event) {
    if (!form) return;

    // Honeypot: if filled, silently drop the submission (bot).
    var honeypot = form.querySelector('[name="_gotcha"]');
    if (honeypot && honeypot.value) {
      event.preventDefault();
      return;
    }

    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      return;
    }

    if (!window.fetch) return; // let the native form POST to Formspree happen

    event.preventDefault();

    var submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    setStatus("Envoi en cours…");

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then(function (response) {
        if (response.ok) {
          setStatus("Merci ! Votre demande a bien été envoyée. Je vous répondrai sous 24h.", "success");
          form.reset();
        } else {
          return response.json().then(function (data) {
            var message =
              data && data.errors && data.errors.length
                ? data.errors.map(function (e) { return e.message; }).join(", ")
                : "Une erreur est survenue. Merci de réessayer ou de m'écrire directement à contact@ivycore.fr.";
            setStatus(message, "error");
          });
        }
      })
      .catch(function () {
        setStatus("Une erreur est survenue. Merci de réessayer ou de m'écrire directement à contact@ivycore.fr.", "error");
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  }

  if (form) form.addEventListener("submit", handleSubmit);
})();
