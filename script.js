const RSVP_ENDPOINT = "";

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");

// Мобильное меню: открытие, закрытие и демонстрация активного пункта "Приглашение".
menuToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");
  document.body.classList.toggle("menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    siteNav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Открыть меню");
  });
});

// Карусель Мурома: активное фото непрозрачное, остальные приглушены, автопереключение раз в 10 секунд.
const storyCarousel = document.querySelector(".story-carousel");
const storyTrack = document.querySelector(".story-track");
const storyTitle = document.querySelector(".story h2");
const carouselCards = Array.from(document.querySelectorAll(".story-card"));
const carouselCaption = document.querySelector(".carousel-caption");
const prevButton = document.querySelector(".carousel-prev");
const nextButton = document.querySelector(".carousel-next");
const CAROUSEL_INTERVAL = 10000;
let carouselIndex = 0;
let carouselTimerFrame;
let carouselStartedAt = 0;
let carouselProgress = 0;
let carouselPaused = false;
let carouselHasStarted = false;

function centerActiveCard() {
  const activeCard = carouselCards[carouselIndex];
  const carouselCenter = storyCarousel.clientWidth / 2;
  const activeCenter = activeCard.offsetLeft + activeCard.offsetWidth / 2;
  storyTrack.style.transform = `translateX(${carouselCenter - activeCenter}px)`;
}

function renderCarousel(nextIndex) {
  carouselIndex = (nextIndex + carouselCards.length) % carouselCards.length;

  carouselCards.forEach((card, index) => {
    const isActive = index === carouselIndex;
    card.classList.toggle("is-active", isActive);
    card.tabIndex = isActive ? -1 : 0;
    card.setAttribute("aria-label", isActive ? "Активное фото" : "Открыть это фото");
  });

  carouselCaption.innerHTML = carouselCards[carouselIndex].querySelector("figcaption").innerHTML;
  window.requestAnimationFrame(centerActiveCard);
}

function activateCarouselCard(index) {
  if (index === carouselIndex) {
    return;
  }

  renderCarousel(index);
  restartCarouselTimer();
}

function updateTimerButtonState() {
  carouselCards.forEach((card, index) => {
    const button = card.querySelector(".story-timer");
    if (!button) {
      return;
    }

    const isActive = index === carouselIndex;
    button.style.setProperty("--timer-progress", isActive ? `${carouselProgress * 360}deg` : "0deg");
    button.classList.toggle("is-paused", carouselPaused && isActive);
    button.setAttribute("aria-pressed", String(carouselPaused && isActive));
    button.setAttribute(
      "aria-label",
      carouselPaused && isActive ? "Возобновить автоматическое переключение" : "Остановить автоматическое переключение"
    );
  });
}

function createCarouselTimerButtons() {
  carouselCards.forEach((card) => {
    if (card.querySelector(".story-timer")) {
      return;
    }

    const button = document.createElement("button");
    button.className = "story-timer";
    button.type = "button";
    button.setAttribute("aria-label", "Остановить автоматическое переключение");
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = '<span class="story-timer-icon" aria-hidden="true"><span></span><span></span></span>';
    button.addEventListener("click", toggleCarouselPause);
    card.appendChild(button);
  });
}

function prepareCarouselCards() {
  carouselCards.forEach((card, index) => {
    const image = card.querySelector("img");

    if (image) {
      image.draggable = false;
    }

    card.addEventListener("dragstart", (event) => event.preventDefault());
    card.addEventListener("selectstart", (event) => event.preventDefault());

    card.addEventListener("click", (event) => {
      if (event.target.closest(".story-timer")) {
        return;
      }

      activateCarouselCard(index);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      activateCarouselCard(index);
    });
  });
}

function tickCarouselTimer(now) {
  if (carouselPaused) {
    return;
  }

  carouselProgress = Math.min((now - carouselStartedAt) / CAROUSEL_INTERVAL, 1);
  updateTimerButtonState();

  if (carouselProgress >= 1) {
    renderCarousel(carouselIndex + 1);
    carouselStartedAt = now;
    carouselProgress = 0;
    updateTimerButtonState();
  }

  carouselTimerFrame = window.requestAnimationFrame(tickCarouselTimer);
}

function restartCarouselTimer() {
  window.cancelAnimationFrame(carouselTimerFrame);
  carouselHasStarted = true;
  carouselPaused = false;
  carouselProgress = 0;
  carouselStartedAt = performance.now();
  updateTimerButtonState();
  carouselTimerFrame = window.requestAnimationFrame(tickCarouselTimer);
}

function startCarouselTimerOnce() {
  if (carouselHasStarted) {
    return;
  }

  restartCarouselTimer();
}

function watchCarouselStart() {
  const startTarget = storyTitle || storyCarousel;

  function isStartTargetVisible() {
    const rect = startTarget.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  if (isStartTargetVisible()) {
    startCarouselTimerOnce();
    return;
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        startCarouselTimerOnce();
        observer.disconnect();
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.2,
      }
    );

    observer.observe(startTarget);
    window.setTimeout(() => {
      if (isStartTargetVisible()) {
        startCarouselTimerOnce();
        observer.disconnect();
      }
    }, 120);
    return;
  }

  function handleScrollToCarousel() {
    if (!isStartTargetVisible()) {
      return;
    }

    startCarouselTimerOnce();
    window.removeEventListener("scroll", handleScrollToCarousel);
    window.removeEventListener("resize", handleScrollToCarousel);
  }

  window.addEventListener("scroll", handleScrollToCarousel, { passive: true });
  window.addEventListener("resize", handleScrollToCarousel);
}

function toggleCarouselPause() {
  if (!carouselHasStarted) {
    restartCarouselTimer();
    return;
  }

  carouselPaused = !carouselPaused;

  if (carouselPaused) {
    window.cancelAnimationFrame(carouselTimerFrame);
    updateTimerButtonState();
    return;
  }

  carouselStartedAt = performance.now() - carouselProgress * CAROUSEL_INTERVAL;
  updateTimerButtonState();
  carouselTimerFrame = window.requestAnimationFrame(tickCarouselTimer);
}

prevButton.addEventListener("click", () => {
  renderCarousel(carouselIndex - 1);
  restartCarouselTimer();
});

nextButton.addEventListener("click", () => {
  renderCarousel(carouselIndex + 1);
  restartCarouselTimer();
});

window.addEventListener("resize", centerActiveCard);

createCarouselTimerButtons();
prepareCarouselCards();
renderCarousel(0);
watchCarouselStart();

// Переключение палитры dress code: выбранный цвет слева управляет CSS-карточками справа.
const palette = [
  { key: "honey", name: "Теплый медовый", hex: "#ffc26f" },
  { key: "mint", name: "Мятный", hex: "#9fe0a2" },
  { key: "peach", name: "Персиковый", hex: "#ffb09f" },
  { key: "sage", name: "Шалфейный", hex: "#8da07b" },
  { key: "blue", name: "Синий", hex: "#466dff" },
  { key: "red", name: "Красный", hex: "#ff2828" },
  { key: "cream", name: "Светлый", hex: "#fff7e2" },
];

const shadeVariants = ["silk", "paper", "glass", "shadow"];
const swatches = Array.from(document.querySelectorAll(".swatch"));
const dressLooks = document.querySelector(".dress-looks");
let paletteIndex = 0;
let paletteTimer;

function clampColor(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "").trim();
  const fullHex = normalized.length === 3 ? normalized.split("").map((char) => char + char).join("") : normalized;
  const value = Number.parseInt(fullHex, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => clampColor(value).toString(16).padStart(2, "0")).join("")}`;
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function lighten(hex, amount) {
  const { r, g, b } = hexToRgb(hex);

  return rgbToHex({
    r: r + (255 - r) * amount,
    g: g + (255 - g) * amount,
    b: b + (255 - b) * amount,
  });
}

function darken(hex, amount) {
  const { r, g, b } = hexToRgb(hex);

  return rgbToHex({
    r: r * (1 - amount),
    g: g * (1 - amount),
    b: b * (1 - amount),
  });
}

function getPaletteIndex(color) {
  const index = palette.findIndex((item) => item.key === color);
  return index === -1 ? 0 : index;
}

function getShadeMoodboardItems(selectedIndex) {
  return [0, 1, 2, 3].map((offset) => palette[(selectedIndex + offset) % palette.length]);
}

function ShadeCard(item, index) {
  const card = document.createElement("article");
  const variant = shadeVariants[index % shadeVariants.length];
  card.className = `shade-card shade-card-${variant}${index === 0 ? " shade-card-featured" : ""}`;
  card.setAttribute("aria-label", `${item.name}, ${item.hex}`);
  card.style.setProperty("--shade", item.hex);
  card.style.setProperty("--shade-soft", lighten(item.hex, 0.42));
  card.style.setProperty("--shade-light", lighten(item.hex, 0.64));
  card.style.setProperty("--shade-dark", darken(item.hex, 0.18));
  card.style.setProperty("--shade-glow", rgba(lighten(item.hex, 0.48), 0.44));

  const content = document.createElement("div");
  content.className = "shade-card-content";

  const name = document.createElement("span");
  name.className = "shade-name";
  name.textContent = item.name;

  const hex = document.createElement("span");
  hex.className = "shade-hex";
  hex.textContent = item.hex;

  content.append(name, hex);
  card.append(content);

  return card;
}

function renderShadeCards(selectedIndex) {
  if (!dressLooks) {
    return;
  }

  const fragment = document.createDocumentFragment();
  getShadeMoodboardItems(selectedIndex).forEach((item, index) => {
    fragment.append(ShadeCard(item, index));
  });

  dressLooks.replaceChildren(fragment);
}

function selectPalette(color) {
  paletteIndex = getPaletteIndex(color);

  swatches.forEach((swatch) => {
    const isSelected = swatch.dataset.color === color;
    swatch.classList.toggle("is-selected", isSelected);
    swatch.setAttribute("aria-selected", String(isSelected));
  });

  renderShadeCards(paletteIndex);
}

function restartPaletteTimer() {
  window.clearInterval(paletteTimer);
  paletteTimer = window.setInterval(() => {
    paletteIndex = (paletteIndex + 1) % palette.length;
    selectPalette(palette[paletteIndex].key);
  }, 7000);
}

swatches.forEach((swatch) => {
  swatch.addEventListener("click", () => {
    selectPalette(swatch.dataset.color);
    restartPaletteTimer();
  });
});

if (swatches.length && dressLooks) {
  selectPalette(swatches[0].dataset.color);
  restartPaletteTimer();
}

// RSVP: статический сайт отправляет данные в Google Apps Script Web App.
const rsvpForm = document.querySelector(".rsvp-form");
const formStatus = document.querySelector(".form-status");

function setFormStatus(message, type = "") {
  formStatus.textContent = message;
  formStatus.className = `form-status ${type}`.trim();
}

function getFormPayload(form) {
  const formData = new FormData(form);
  return {
    name: formData.get("name")?.trim(),
    attendance: formData.get("attendance"),
    guests: formData.get("guests"),
    drinks: formData.getAll("drinks"),
    message: formData.get("message")?.trim(),
    submittedAt: new Date().toISOString(),
    source: window.location.href,
  };
}

rsvpForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!rsvpForm.reportValidity()) {
    setFormStatus("Пожалуйста заполните обязательные поля.", "error");
    return;
  }

  const payload = getFormPayload(rsvpForm);

  if (!payload.drinks.length) {
    setFormStatus("Выберите хотя бы одно предпочтение в напитках.", "error");
    return;
  }

  if (!RSVP_ENDPOINT) {
    setFormStatus("Форма готова, но нужен URL Google Apps Script Web App для отправки.", "error");
    return;
  }

  setFormStatus("Отправляется...");

  try {
    const response = await fetch(RSVP_ENDPOINT, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    rsvpForm.reset();
    setFormStatus("Спасибо! Ваш ответ успешно отправлен.", "success");
  } catch (error) {
    setFormStatus("Произошла ошибка. Попробуйте еще раз или напишите жениху.", "error");
  }
});
