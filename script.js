const RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycbyWc4RWT7p1wLCgqMCekL_oJB9qIBQj790wMVeuJFd2rTgcfXBRGz4BYCrAIJtXgNQE/exec";

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
const siteHeader = document.querySelector(".site-header");
let headerScrollFrame;

// Мобильное меню: открытие, закрытие и демонстрация активного пункта "Приглашение".
function closeSiteMenu() {
  siteNav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Открыть меню");
}

menuToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");
  document.body.classList.toggle("menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    closeSiteMenu();
  });
});

document.addEventListener("click", (event) => {
  if (!siteNav.classList.contains("is-open") || !(event.target instanceof Node)) {
    return;
  }

  if (siteNav.contains(event.target) || menuToggle.contains(event.target)) {
    return;
  }

  closeSiteMenu();
});

function updateHeaderCompactState() {
  const shouldCompact = window.scrollY > 24;
  siteHeader.classList.toggle("is-compact", shouldCompact);
}

function requestHeaderCompactUpdate() {
  if (headerScrollFrame) {
    return;
  }

  headerScrollFrame = window.requestAnimationFrame(() => {
    updateHeaderCompactState();
    headerScrollFrame = null;
  });
}

updateHeaderCompactState();
window.addEventListener("scroll", requestHeaderCompactUpdate, { passive: true });

// Карусель Мурома: активное фото непрозрачное, остальные приглушены, автопереключение раз в 10 секунд.
const storyCarousel = document.querySelector(".story-carousel");
const storyTrack = document.querySelector(".story-track");
const storyTitle = document.querySelector(".story h2");
const carouselCards = Array.from(document.querySelectorAll(".story-card"));
const carouselCaption = document.querySelector(".carousel-caption");
const prevButton = document.querySelector(".carousel-prev");
const nextButton = document.querySelector(".carousel-next");
const CAROUSEL_INTERVAL = 10000;
const mobileStoryCarouselQuery = window.matchMedia("(max-width: 640px)");
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

function scheduleActiveCardCenter() {
  window.requestAnimationFrame(() => {
    centerActiveCard();
    window.requestAnimationFrame(centerActiveCard);
  });
}

function shouldClampCarouselEdges() {
  return mobileStoryCarouselQuery.matches;
}

function updateCarouselEdgeControls() {
  const shouldClamp = shouldClampCarouselEdges();

  prevButton.disabled = shouldClamp && carouselIndex === 0;
  nextButton.disabled = shouldClamp && carouselIndex === carouselCards.length - 1;
  storyCarousel.classList.toggle("is-at-start", shouldClamp && carouselIndex === 0);
  storyCarousel.classList.toggle("is-at-end", shouldClamp && carouselIndex === carouselCards.length - 1);
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
  updateCarouselEdgeControls();
  scheduleActiveCardCenter();
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

function createCarouselEdgePreviews() {
  if (carouselCards.length < 2) {
    return;
  }

  const firstClone = carouselCards[0].cloneNode(true);
  const lastClone = carouselCards[carouselCards.length - 1].cloneNode(true);

  [firstClone, lastClone].forEach((clone) => {
    clone.classList.remove("is-active");
    clone.classList.add("story-card-clone");
    clone.setAttribute("aria-hidden", "true");
    clone.removeAttribute("tabindex");
    clone.querySelector(".story-timer")?.remove();
  });

  storyTrack.prepend(lastClone);
  storyTrack.append(firstClone);
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
    if (shouldClampCarouselEdges() && carouselIndex === carouselCards.length - 1) {
      carouselPaused = true;
      carouselProgress = 1;
      updateTimerButtonState();
      return;
    }

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

function showPrevSlide() {
  if (shouldClampCarouselEdges() && carouselIndex === 0) {
    return;
  }

  renderCarousel(carouselIndex - 1);
  restartCarouselTimer();
}

function showNextSlide() {
  if (shouldClampCarouselEdges() && carouselIndex === carouselCards.length - 1) {
    return;
  }

  renderCarousel(carouselIndex + 1);
  restartCarouselTimer();
}

function setupCarouselSwipe() {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  storyCarousel.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchEndX = touchStartX;
      touchEndY = touchStartY;
    },
    { passive: true }
  );

  storyCarousel.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.changedTouches[0];
      touchEndX = touch.clientX;
      touchEndY = touch.clientY;
    },
    { passive: true }
  );

  storyCarousel.addEventListener(
    "touchend",
    () => {
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const swipeThreshold = Math.max(42, storyCarousel.clientWidth * 0.12);

      if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaY) > Math.abs(deltaX) * 0.7) {
        return;
      }

      if (deltaX < 0) {
        showNextSlide();
        return;
      }

      showPrevSlide();
    },
    { passive: true }
  );
}

prevButton.addEventListener("click", () => {
  showPrevSlide();
});

nextButton.addEventListener("click", () => {
  showNextSlide();
});

function handleCarouselViewportChange() {
  updateCarouselEdgeControls();
  scheduleActiveCardCenter();
}

window.addEventListener("resize", handleCarouselViewportChange);
mobileStoryCarouselQuery.addEventListener("change", handleCarouselViewportChange);

createCarouselEdgePreviews();
createCarouselTimerButtons();
prepareCarouselCards();
setupCarouselSwipe();
renderCarousel(0);
watchCarouselStart();

// Переключение палитры dress code: выбранный цвет слева управляет CSS-карточками справа.
const palette = [
  { key: "pastel-pink", name: "Мягкий розовый", hex: "#FFD1DC" },
  { key: "pastel-aquamarine", name: "Светлый аквамариновый", hex: "#B2FFFF" },
  { key: "pastel-yellow", name: "Светлый жёлтый", hex: "#FDFD96" },
  { key: "pastel-orchid", name: "Светлая орхидея", hex: "#DAB6FC" },
  { key: "pastel-green", name: "Мягкий зелёный", hex: "#77DD77" },
  { key: "light-peach", name: "Светло-персиковый", hex: "#FFD8B1" },
  { key: "sky-blue", name: "Небесно-голубой", hex: "#CFEFFF" },
  { key: "pastel-coral", name: "Мягкий коралловый", hex: "#F6A6A6" },
  { key: "pastel-lime", name: "Светлый лайм", hex: "#D8F3A3" },
  { key: "lavender", name: "Лавандовый", hex: "#E6E6FA" },
  { key: "powder-blue", name: "Пудрово-голубой", hex: "#B0E0E6" },
  { key: "icy-blue", name: "Ледяной голубой", hex: "#D6F6FF" },
  { key: "mint-blue", name: "Мятно-голубой", hex: "#C7F9F1" },
  { key: "seafoam", name: "Морская пена", hex: "#B0EAD7" },
  { key: "eucalyptus", name: "Эвкалиптовый", hex: "#CDE8D5" },
  { key: "light-mint", name: "Светло-мятный", hex: "#CFFFE5" },
  { key: "pale-blue", name: "Бледно-голубой", hex: "#D7ECFF" },
  { key: "rose-quartz", name: "Розовый кварц", hex: "#F7CAC9" },
  { key: "pastel-blue", name: "Светлый голубой", hex: "#AEC6CF" },
  { key: "pastel-orange", name: "Мягкий оранжевый", hex: "#FFB347" },
  { key: "soft-pink", name: "Нежно-розовый", hex: "#FADADD" },
  { key: "pastel-turquoise", name: "Мягкий бирюзовый", hex: "#99C5C4" },
  { key: "pastel-gray", name: "Светлый серый", hex: "#CFCFC4" },
  { key: "vanilla", name: "Ванильный", hex: "#F3E5AB" },
  { key: "mint", name: "Мятный", hex: "#AAF0D1" },
  { key: "pastel-purple", name: "Мягкий фиолетовый", hex: "#CBAACB" },
  { key: "apricot", name: "Абрикосовый", hex: "#FBCEB1" },
  { key: "powder-pink", name: "Пудрово-розовый", hex: "#F4C2C2" },
  { key: "cream", name: "Кремовый", hex: "#FFFDD0" },
  { key: "lilac", name: "Сиреневый", hex: "#D8BFD8" },
  { key: "pastel-red", name: "Мягкий красный", hex: "#FF6961" },
  { key: "warm-gray", name: "Тёплый серый", hex: "#D8D0C1" },
  { key: "peach", name: "Персиковый", hex: "#FFE5B4" },
  { key: "periwinkle", name: "Барвинковый", hex: "#CCCCFF" },
  { key: "pistachio", name: "Фисташковый", hex: "#C1E1C1" },
  { key: "buttercream", name: "Сливочный", hex: "#FFF1B5" },
  { key: "light-turquoise", name: "Светлая бирюза", hex: "#AFEEEE" },
  { key: "pale-lilac", name: "Бледно-лиловый", hex: "#E0BBE4" },
  { key: "sage", name: "Шалфейный", hex: "#B2AC88" },
  { key: "pastel-lemon", name: "Светлый лимонный", hex: "#FFFACD" },
  { key: "pastel-beige", name: "Светлый бежевый", hex: "#F5E6CC" },
  { key: "pale-green", name: "Бледно-зелёный", hex: "#D0F0C0" },
  { key: "pale-pink", name: "Бледно-розовый", hex: "#FFE4E1" },
  { key: "cream-orange", name: "Кремово-оранжевый", hex: "#FAD6A5" },
  { key: "pastel-blue-deep", name: "Мягкий синий", hex: "#A7C7E7" },
  { key: "milky", name: "Молочный", hex: "#FFF8E7" },
  { key: "soft-watermelon", name: "Нежный арбузный", hex: "#FC9C9C" },
  { key: "pale-yellow", name: "Бледно-жёлтый", hex: "#FFFFCC" },
  { key: "pastel-cyan", name: "Светлый циан", hex: "#BDEDF2" },
  { key: "pastel-tangerine", name: "Светлый мандариновый", hex: "#FFCC99" },
  { key: "pastel-indigo", name: "Мягкий индиго", hex: "#C3B1E1" },
  { key: "cream-pink", name: "Кремово-розовый", hex: "#FDDDE6" },
  { key: "champagne", name: "Шампань", hex: "#F7E7CE" },
  { key: "pastel-salmon", name: "Светлый лососевый", hex: "#FFB3A7" },
  { key: "pastel-sand", name: "Светлый песочный", hex: "#EED9B6" },
  { key: "pastel-fuchsia", name: "Мягкая фуксия", hex: "#F8BBD0" },
  { key: "pastel-gold", name: "Мягкое золото", hex: "#E6D690" },
  { key: "soft-olive", name: "Нежный оливковый", hex: "#D9E4B5" },
  { key: "peach-pink", name: "Персиково-розовый", hex: "#FFDAB9" },
  { key: "pale-amber", name: "Бледно-янтарный", hex: "#FFD580" },
];

const shadeVariants = ["silk", "paper", "glass", "shadow"];
const SHADE_SCROLL_SPEED = 56;
const SHADE_SNAP_MS = 580;
const SHADE_INTERACTION_RESUME_MS = 1200;
const swatches = Array.from(document.querySelectorAll(".swatch"));
const dressLooks = document.querySelector(".dress-looks");
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let paletteIndex = 0;

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

function ShadeCard(item, index) {
  const card = document.createElement("article");
  const variant = shadeVariants[index % shadeVariants.length];
  card.className = `shade-card shade-card-${variant}`;
  card.setAttribute("aria-label", item.name);
  card.setAttribute("role", "button");
  card.tabIndex = 0;
  card.dataset.paletteIndex = String(index);
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

  content.append(name);
  card.append(content);

  return card;
}

function createShadeCarousel() {
  const fragment = document.createDocumentFragment();
  const track = document.createElement("div");
  const status = document.createElement("p");

  track.className = "dress-looks-track";
  status.className = "dress-looks-status";
  status.setAttribute("aria-live", "polite");

  palette.forEach((item, index) => {
    fragment.append(ShadeCard(item, index));
  });

  track.append(fragment);
  dressLooks.replaceChildren(track, status);
  return { track, status };
}

let dressLooksTrack;
let dressLooksStatus;
let shadeTrackOffset = 0;
let shadePointerStartX = 0;
let shadePointerStartY = 0;
let shadePointerLastX = 0;
let shadePointerId;
let shadeDidDrag = false;
let shadeAutoFrame;
let shadeLastFrameTime = 0;
let shadeResumeTimer;
let shadeSnapTimer;
let shadeAutoPaused = false;

function getShadeCards() {
  if (!dressLooksTrack) {
    return [];
  }

  return Array.from(dressLooksTrack.querySelectorAll(".shade-card"));
}

function getShadeGap() {
  if (!dressLooksTrack) {
    return 0;
  }

  const styles = window.getComputedStyle(dressLooksTrack);
  const gap = parseFloat(styles.columnGap || styles.gap);
  return Number.isFinite(gap) ? gap : 0;
}

function syncSwatchesAndStatus() {
  swatches.forEach((swatch) => {
    const isSelected = swatch.dataset.color === palette[paletteIndex].key;
    swatch.classList.toggle("is-selected", isSelected);
    swatch.setAttribute("aria-selected", String(isSelected));
  });

  if (dressLooksStatus) {
    dressLooksStatus.textContent = `${paletteIndex + 1} из ${palette.length} оттенков`;
  }
}

function applyShadeTrackOffset() {
  if (dressLooksTrack) {
    dressLooksTrack.style.transform = `translateX(${shadeTrackOffset}px)`;
  }
}

function normalizeShadeTrackOffset() {
  if (!dressLooksTrack) {
    return;
  }

  const gap = getShadeGap();
  let safety = 0;

  while (
    dressLooksTrack.firstElementChild
    && shadeTrackOffset + dressLooksTrack.firstElementChild.offsetWidth + gap < 0
    && safety < palette.length
  ) {
    const firstCard = dressLooksTrack.firstElementChild;
    const shift = firstCard.offsetWidth + gap;
    dressLooksTrack.append(firstCard);
    shadeTrackOffset += shift;
    safety += 1;
  }

  safety = 0;

  while (dressLooksTrack.lastElementChild && shadeTrackOffset > 0 && safety < palette.length) {
    const lastCard = dressLooksTrack.lastElementChild;
    const shift = lastCard.offsetWidth + gap;
    dressLooksTrack.prepend(lastCard);
    shadeTrackOffset -= shift;
    safety += 1;
  }
}

function getCenteredShadeCard() {
  if (!dressLooks) {
    return null;
  }

  const cards = getShadeCards();
  const viewportCenter = dressLooks.clientWidth / 2;
  let centeredCard = null;
  let closestDistance = Infinity;

  cards.forEach((card) => {
    const cardCenter = card.offsetLeft + shadeTrackOffset + card.offsetWidth / 2;
    const distance = Math.abs(cardCenter - viewportCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      centeredCard = card;
    }
  });

  return centeredCard;
}

function syncShadeActiveCard() {
  const cards = getShadeCards();
  const activeCard = getCenteredShadeCard();

  cards.forEach((card) => {
    const isActive = card === activeCard;
    card.classList.toggle("shade-card-featured", isActive);
    card.setAttribute("aria-current", String(isActive));
    card.tabIndex = isActive ? 0 : -1;
  });

  if (!activeCard) {
    return;
  }

  const nextIndex = Number(activeCard.dataset.paletteIndex);
  if (Number.isFinite(nextIndex) && nextIndex !== paletteIndex) {
    paletteIndex = nextIndex;
    syncSwatchesAndStatus();
  }
}

function setShadeTrackOffset(offset, animate = false) {
  window.clearTimeout(shadeSnapTimer);
  dressLooks.classList.toggle("is-snapping", animate);
  shadeTrackOffset = offset;
  normalizeShadeTrackOffset();
  applyShadeTrackOffset();
  syncShadeActiveCard();

  if (animate) {
    shadeSnapTimer = window.setTimeout(() => {
      dressLooks.classList.remove("is-snapping");
    }, SHADE_SNAP_MS);
  }
}

function getClosestShadeCardByPaletteIndex(index) {
  const cards = getShadeCards().filter((card) => Number(card.dataset.paletteIndex) === index);
  const viewportCenter = dressLooks.clientWidth / 2;
  let closestCard = null;
  let closestDistance = Infinity;

  cards.forEach((card) => {
    const cardCenter = card.offsetLeft + shadeTrackOffset + card.offsetWidth / 2;
    const distance = Math.abs(cardCenter - viewportCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestCard = card;
    }
  });

  return closestCard;
}

function centerShadeCard(card, animate = true) {
  if (!dressLooks || !card) {
    return;
  }

  const viewportCenter = dressLooks.clientWidth / 2;
  const cardCenter = card.offsetLeft + shadeTrackOffset + card.offsetWidth / 2;
  setShadeTrackOffset(shadeTrackOffset + viewportCenter - cardCenter, animate);
}

function updateShadeCarousel(animate = false) {
  if (!dressLooks) {
    return;
  }

  if (!dressLooksTrack || !dressLooksStatus) {
    const carouselParts = createShadeCarousel();
    dressLooksTrack = carouselParts.track;
    dressLooksStatus = carouselParts.status;
  }

  setShadeTrackOffset(shadeTrackOffset, animate);
  syncSwatchesAndStatus();
}

function selectPaletteByIndex(nextIndex, animate = true) {
  const targetIndex = (nextIndex + palette.length) % palette.length;
  paletteIndex = targetIndex;

  if (!dressLooksTrack || !dressLooksStatus) {
    const carouselParts = createShadeCarousel();
    dressLooksTrack = carouselParts.track;
    dressLooksStatus = carouselParts.status;
  }

  syncSwatchesAndStatus();

  window.requestAnimationFrame(() => {
    centerShadeCard(getClosestShadeCardByPaletteIndex(targetIndex), animate);
  });
}

function showNextPalette() {
  pauseShadeAutoScroll();
  selectPaletteByIndex(paletteIndex + 1);
  resumeShadeAutoScroll(SHADE_INTERACTION_RESUME_MS);
}

function showPrevPalette() {
  pauseShadeAutoScroll();
  selectPaletteByIndex(paletteIndex - 1);
  resumeShadeAutoScroll(SHADE_INTERACTION_RESUME_MS);
}

function setupShadeCarouselPointer() {
  if (!dressLooks) {
    return;
  }

  dressLooks.addEventListener("pointerdown", (event) => {
    if (!dressLooksTrack || event.button > 0) {
      return;
    }

    shadePointerId = event.pointerId;
    shadePointerStartX = event.clientX;
    shadePointerStartY = event.clientY;
    shadePointerLastX = event.clientX;
    shadeDidDrag = false;
    pauseShadeAutoScroll();
    dressLooks.classList.add("is-dragging");
    dressLooks.setPointerCapture(event.pointerId);
  });

  dressLooks.addEventListener("pointermove", (event) => {
    if (event.pointerId !== shadePointerId) {
      return;
    }

    const deltaX = event.clientX - shadePointerStartX;
    const deltaY = event.clientY - shadePointerStartY;

    if (Math.abs(deltaX) > 6 && Math.abs(deltaX) > Math.abs(deltaY)) {
      shadeDidDrag = true;
      setShadeTrackOffset(shadeTrackOffset + event.clientX - shadePointerLastX, false);
      shadePointerLastX = event.clientX;
    }
  });

  function finishShadePointer(event) {
    if (event.pointerId !== shadePointerId) {
      return;
    }

    dressLooks.classList.remove("is-dragging");
    if (dressLooks.hasPointerCapture(event.pointerId)) {
      dressLooks.releasePointerCapture(event.pointerId);
    }
    shadePointerId = undefined;

    if (!shadeDidDrag) {
      updateShadeCarousel();
    }

    resumeShadeAutoScroll(SHADE_INTERACTION_RESUME_MS);
  }

  dressLooks.addEventListener("pointerup", finishShadePointer);
  dressLooks.addEventListener("pointercancel", finishShadePointer);

  dressLooks.addEventListener("click", (event) => {
    if (shadeDidDrag) {
      shadeDidDrag = false;
      return;
    }

    const card = event.target.closest(".shade-card");
    if (!card) {
      return;
    }

    pauseShadeAutoScroll();
    selectPaletteByIndex(Number(card.dataset.paletteIndex));
    resumeShadeAutoScroll(SHADE_INTERACTION_RESUME_MS);
  });

  dressLooks.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNextPalette();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevPalette();
    }
  });
}

function selectPalette(color, animate = true) {
  selectPaletteByIndex(getPaletteIndex(color), animate);
}

function pauseShadeAutoScroll() {
  shadeAutoPaused = true;
  window.clearTimeout(shadeResumeTimer);
}

function resumeShadeAutoScroll(delay = 0) {
  window.clearTimeout(shadeResumeTimer);

  if (reduceMotionQuery.matches) {
    return;
  }

  const resume = () => {
    shadeAutoPaused = false;
    shadeLastFrameTime = performance.now();
  };

  if (delay > 0) {
    shadeResumeTimer = window.setTimeout(resume, delay);
    return;
  }

  resume();
}

function tickShadeAutoScroll(now) {
  if (!dressLooks || !dressLooksTrack) {
    return;
  }

  if (!shadeLastFrameTime) {
    shadeLastFrameTime = now;
  }

  const elapsed = Math.min(now - shadeLastFrameTime, 80);
  shadeLastFrameTime = now;

  if (!shadeAutoPaused && !reduceMotionQuery.matches) {
    setShadeTrackOffset(shadeTrackOffset - (SHADE_SCROLL_SPEED * elapsed) / 1000, false);
  }

  shadeAutoFrame = window.requestAnimationFrame(tickShadeAutoScroll);
}

function startShadeAutoScroll() {
  window.cancelAnimationFrame(shadeAutoFrame);
  shadeLastFrameTime = performance.now();
  shadeAutoPaused = reduceMotionQuery.matches;
  shadeAutoFrame = window.requestAnimationFrame(tickShadeAutoScroll);
}

swatches.forEach((swatch) => {
  swatch.addEventListener("click", () => {
    pauseShadeAutoScroll();
    selectPalette(swatch.dataset.color);
    resumeShadeAutoScroll(SHADE_INTERACTION_RESUME_MS);
  });
});

if (dressLooks) {
  setupShadeCarouselPointer();
  selectPaletteByIndex(0, false);
  startShadeAutoScroll();
  reduceMotionQuery.addEventListener("change", () => {
    if (reduceMotionQuery.matches) {
      pauseShadeAutoScroll();
      return;
    }

    resumeShadeAutoScroll(SHADE_INTERACTION_RESUME_MS);
  });
  window.addEventListener("resize", () => {
    pauseShadeAutoScroll();
    updateShadeCarousel(false);
    resumeShadeAutoScroll(300);
  });
}

// RSVP: статический сайт отправляет данные в Google Apps Script Web App.
const rsvpForm = document.querySelector(".rsvp-form");
const formStatus = document.querySelector(".form-status");
const guestsSelect = rsvpForm.querySelector('select[name="guests"]');
const guestFields = document.querySelector(".guest-fields");
const guestFieldsList = document.querySelector(".guest-fields-list");
const guestAddButton = document.querySelector(".guest-add-button");
const drinkCheckboxes = Array.from(document.querySelectorAll('input[name="drinks"]'));
const noAlcoholCheckbox = drinkCheckboxes.find((checkbox) => checkbox.value === "Только безалкогольные напитки");
const rsvpThanks = document.querySelector(".rsvp-thanks");
const rsvpAgainButton = document.querySelector(".rsvp-again");
const nameInput = rsvpForm.querySelector('input[name="name"]');
const attendanceRadios = Array.from(document.querySelectorAll('input[name="attendance"]'));
const submitButton = rsvpForm.querySelector('button[type="submit"]');
const rsvpProgressNote = rsvpForm.querySelector(".rsvp-progress-note");
const submitButtonText = submitButton.textContent;
const rsvpSteps = {
  attendance: rsvpForm.querySelector('[data-rsvp-step="attendance"]'),
  guests: rsvpForm.querySelector('[data-rsvp-step="guests"]'),
  guestNames: rsvpForm.querySelector('[data-rsvp-step="guest-names"]'),
  drinks: rsvpForm.querySelector('[data-rsvp-step="drinks"]'),
  message: rsvpForm.querySelector('[data-rsvp-step="message"]'),
  submit: rsvpForm.querySelector('[data-rsvp-step="submit"]'),
};
const RSVP_COOKIE_NAME = "weddingRsvpSubmitted";
let rsvpSubmitting = false;

function setFormStatus(message, type = "") {
  formStatus.textContent = message;
  formStatus.className = `form-status ${type}`.trim();
}

function setCookie(name, value, maxAgeDays) {
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeDays * 24 * 60 * 60}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`))
    ?.split("=")[1];
}

function deleteCookie(name) {
  document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax`;
}

function setStepVisibility(step, isVisible) {
  if (!step) {
    return;
  }

  step.hidden = false;
  step.classList.toggle("is-visible", isVisible);
  step.setAttribute("aria-hidden", String(!isVisible));
  step.querySelectorAll("input, select, textarea, button").forEach((control) => {
    control.disabled = !isVisible || (control === submitButton && rsvpSubmitting);
  });
}

function isFamilyGuests() {
  return guestsSelect.value.startsWith("Буду с семьей");
}

function getSelectedAttendance() {
  return attendanceRadios.find((radio) => radio.checked)?.value || "";
}

function isAttendingWedding() {
  return getSelectedAttendance() === "Да, приду!";
}

function areCompanionGuestsFilled() {
  if (!isFamilyGuests()) {
    return true;
  }

  const inputs = Array.from(guestFieldsList.querySelectorAll('input[name="companionGuests"]'));
  return inputs.length > 0 && inputs.every((input) => input.value.trim());
}

function updateRsvpSteps() {
  const hasName = Boolean(nameInput.value.trim());
  const attendance = getSelectedAttendance();
  const hasAttendance = Boolean(attendance);
  const isAttending = isAttendingWedding();
  const showAttendance = hasName;
  const showGuests = hasName && hasAttendance && isAttending;
  const showGuestNames = showGuests && isFamilyGuests();
  const showDrinks = showGuests && areCompanionGuestsFilled();
  const hasDrinks = drinkCheckboxes.some((checkbox) => checkbox.checked);
  const showMessage = hasName && hasAttendance && (!isAttending || (showDrinks && hasDrinks));

  setStepVisibility(rsvpSteps.attendance, showAttendance);
  setStepVisibility(rsvpSteps.guests, showGuests);
  setStepVisibility(rsvpSteps.guestNames, showGuestNames);
  setStepVisibility(rsvpSteps.drinks, showDrinks);
  setStepVisibility(rsvpSteps.message, showMessage);
  setStepVisibility(rsvpSteps.submit, showMessage);
  rsvpProgressNote?.classList.toggle("is-hidden", showMessage);

  if (!showGuestNames) {
    guestAddButton.disabled = true;
  } else {
    guestAddButton.disabled = false;
  }

  if (showDrinks) {
    syncDrinkAvailability();
  }
}

function createGuestField(guestNumber) {
  const row = document.createElement("div");
  row.className = "guest-field-row";

  const label = document.createElement("label");
  const labelText = document.createElement("span");
  labelText.className = "guest-field-title";
  labelText.textContent = guestNumber === 2 ? "Фамилия и имя второго гостя: *" : `Фамилия и имя ${guestNumber} гостя: *`;

  const input = document.createElement("input");
  input.name = "companionGuests";
  input.type = "text";
  input.placeholder = guestNumber === 2 ? "Анна Иванова" : `Гость ${guestNumber}`;
  input.required = true;

  const removeButton = document.createElement("button");
  removeButton.className = "guest-remove-button";
  removeButton.type = "button";
  removeButton.textContent = "Удалить";
  removeButton.setAttribute("aria-label", `Удалить ${guestNumber} гостя`);

  label.append(labelText, input);
  row.append(label, removeButton);

  return row;
}

function refreshGuestFieldRows() {
  Array.from(guestFieldsList.children).forEach((row, index) => {
    const guestNumber = index + 2;
    const labelText = row.querySelector(".guest-field-title");
    const input = row.querySelector('input[name="companionGuests"]');
    const removeButton = row.querySelector(".guest-remove-button");

    labelText.textContent = guestNumber === 2 ? "Фамилия и имя второго гостя: *" : `Фамилия и имя ${guestNumber} гостя: *`;
    input.placeholder = guestNumber === 2 ? "Анна Иванова" : `Гость ${guestNumber}`;
    removeButton.hidden = guestNumber === 2;
    removeButton.setAttribute("aria-label", `Удалить ${guestNumber} гостя`);
  });
}

function addGuestField() {
  const guestNumber = guestFieldsList.children.length + 2;
  const field = createGuestField(guestNumber);
  guestFieldsList.append(field);
  refreshGuestFieldRows();
  updateRsvpSteps();
  field.querySelector("input")?.focus();
}

function syncGuestFields() {
  const needsFamilyGuests = isFamilyGuests();

  guestAddButton.hidden = !needsFamilyGuests;

  if (!needsFamilyGuests) {
    guestFieldsList.replaceChildren();
    return;
  }

  if (!guestFieldsList.children.length) {
    addGuestField();
  }
}

function syncDrinkAvailability(changedCheckbox) {
  const alcoholCheckboxes = drinkCheckboxes.filter((checkbox) => checkbox !== noAlcoholCheckbox);

  if (noAlcoholCheckbox.checked) {
    alcoholCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
      checkbox.disabled = true;
    });
    return;
  }

  const hasAlcoholChoice = alcoholCheckboxes.some((checkbox) => checkbox.checked);

  if (hasAlcoholChoice) {
    noAlcoholCheckbox.checked = false;
    noAlcoholCheckbox.disabled = true;
    alcoholCheckboxes.forEach((checkbox) => {
      checkbox.disabled = false;
    });
    return;
  }

  noAlcoholCheckbox.disabled = false;
  alcoholCheckboxes.forEach((checkbox) => {
    checkbox.disabled = false;
  });
}

function setSubmitLoading(isLoading) {
  rsvpSubmitting = isLoading;
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Отправляется..." : submitButtonText;
}

function showRsvpThanks({ scroll = true } = {}) {
  rsvpForm.hidden = true;
  rsvpThanks.hidden = false;

  if (scroll) {
    rsvpThanks.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function showRsvpFormAgain() {
  deleteCookie(RSVP_COOKIE_NAME);
  rsvpThanks.hidden = true;
  rsvpForm.hidden = false;
  rsvpForm.reset();
  setSubmitLoading(false);
  setFormStatus("");
  syncGuestFields();
  syncDrinkAvailability();
  updateRsvpSteps();
  rsvpForm.querySelector('input[name="name"]')?.focus();
}

function getFormPayload(form) {
  const formData = new FormData(form);
  return {
    name: formData.get("name")?.trim(),
    attendance: formData.get("attendance"),
    guests: formData.get("guests"),
    companionGuests: formData.getAll("companionGuests").map((guest) => guest.trim()).filter(Boolean),
    drinks: formData.getAll("drinks"),
    message: formData.get("message")?.trim(),
    submittedAt: new Date().toISOString(),
    source: window.location.href,
  };
}

nameInput.addEventListener("input", updateRsvpSteps);
attendanceRadios.forEach((radio) => {
  radio.addEventListener("change", updateRsvpSteps);
});

guestsSelect.addEventListener("change", () => {
  syncGuestFields();
  updateRsvpSteps();
});
guestAddButton.addEventListener("click", addGuestField);
guestFieldsList.addEventListener("input", updateRsvpSteps);
guestFieldsList.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".guest-remove-button");

  if (!removeButton) {
    return;
  }

  removeButton.closest(".guest-field-row")?.remove();
  refreshGuestFieldRows();
  updateRsvpSteps();
});
drinkCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    updateRsvpSteps();
    syncDrinkAvailability(checkbox);
  });
});
rsvpAgainButton.addEventListener("click", showRsvpFormAgain);

syncGuestFields();
syncDrinkAvailability();
updateRsvpSteps();

if (getCookie(RSVP_COOKIE_NAME) === "1") {
  showRsvpThanks({ scroll: false });
}

rsvpForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (submitButton.disabled) {
    return;
  }

  updateRsvpSteps();

  if (!rsvpForm.reportValidity()) {
    setFormStatus("Пожалуйста заполните обязательные поля.", "error");
    return;
  }

  const payload = getFormPayload(rsvpForm);

  if (payload.attendance === "Да, приду!" && !payload.drinks.length) {
    setFormStatus("Выберите хотя бы одно предпочтение в напитках.", "error");
    return;
  }

  if (!RSVP_ENDPOINT) {
    setFormStatus("Форма готова, но нужен URL Google Apps Script Web App для отправки.", "error");
    return;
  }

  setFormStatus("Отправляется...");
  setSubmitLoading(true);

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
    syncGuestFields();
    syncDrinkAvailability();
    updateRsvpSteps();
    setCookie(RSVP_COOKIE_NAME, "1", 365);
    showRsvpThanks();
  } catch (error) {
    setSubmitLoading(false);
    setFormStatus("Произошла ошибка. Попробуйте еще раз или напишите жениху.", "error");
  }
});
