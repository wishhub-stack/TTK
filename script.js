/* ==========================================================
   НАСТРОЙКИ КВЕСТА
   Меняй всё, что внутри STAGES — коды, координаты, фото, тексты.
   Коды сравниваются без учёта регистра и пробелов по краям.
   ========================================================== */

const STAGES = [
  {
    id: 1,
    // код, который нужно найти в первой локации
    code: "123", // тестовый код — замени на реальный, когда всё будет готово
    // текст и картинка, которые появятся ПОСЛЕ верного кода
    heading: "Первый код принят",
    text: "Отправляйся сюда — там спрятана следующая подсказка.",
    coords: "55.7522, 37.6156",
    mapsUrl: "https://maps.google.com/?q=55.7522,37.6156",
    photo: "images/stage1.jpg", // положи сюда фото ориентира
    photoCaption: "Ищи вот этот ориентир на месте",
    gift: null,
  },
  {
    id: 2,
    code: "123", // тестовый код
    heading: "Второй код принят",
    text: "Дальше — новая точка на карте. И небольшой подарок по пути.",
    coords: "55.7601, 37.6186",
    mapsUrl: "https://maps.google.com/?q=55.7601,37.6186",
    photo: "images/stage2.jpg",
    photoCaption: "Ищи вот этот ориентир на месте",
    gift: {
      brand: "Золотое Яблоко",
      code: "GOLDEN-APPLE-CODE",
    },
  },
  {
    id: 3,
    code: "123", // тестовый код
    heading: "Финал",
    text: "Ты нашла всё, что было спрятано. Осталось последнее.",
    coords: null,
    mapsUrl: null,
    photo: "images/stage3.jpg",
    photoCaption: "",
    gift: {
      brand: "Cartier",
      code: "CARTIER-CODE",
    },
  },
];

const FINAL_MESSAGE = "Вот и всё. Спасибо, что искала знаки — дальше я расскажу остальное лично.";

/* ========================================================== */

const STORAGE_KEY = "quest-progress";
const app = document.getElementById("app");
const progressEl = document.getElementById("progress");

function getProgress() {
  const saved = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  return Number.isFinite(saved) ? saved : 0;
}

function setProgress(n) {
  localStorage.setItem(STORAGE_KEY, String(n));
}

function normalize(str) {
  return str.trim().toUpperCase().replace(/\s+/g, "");
}

function renderProgressDots(completedCount) {
  const steps = progressEl.querySelectorAll(".progress-step");
  const lines = progressEl.querySelectorAll(".progress-line");
  steps.forEach((el, i) => {
    el.classList.remove("active", "done");
    if (i < completedCount) el.classList.add("done");
    else if (i === completedCount) el.classList.add("active");
  });
  lines.forEach((el, i) => {
    el.classList.toggle("done", i < completedCount);
  });
}

/* --- экран ввода кода для текущего этапа --- */

function renderCodeEntry(stage, completedCount) {
  app.innerHTML = `
    <p class="step-label">этап ${stage.id} из ${STAGES.length}</p>
    <p class="step-heading">Введи найденный код</p>
    <p class="step-text">Код спрятан на месте — впиши его сюда, как найдёшь.</p>
    <form class="code-form" id="code-form" autocomplete="off">
      <input
        class="code-input"
        id="code-input"
        type="text"
        placeholder="код"
        maxlength="24"
        autocapitalize="characters"
      />
      <p class="error-text" id="error-text"></p>
      <button type="submit" class="btn btn-primary">Проверить</button>
    </form>
  `;

  const form = document.getElementById("code-form");
  const input = document.getElementById("code-input");
  const errorText = document.getElementById("error-text");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (normalize(input.value) === normalize(stage.code)) {
      setProgress(completedCount + 1);
      renderProgressDots(completedCount + 1);
      renderReveal(stage);
    } else {
      errorText.textContent = "Код не подходит — проверь ещё раз.";
      input.classList.remove("shake");
      void input.offsetWidth; // перезапуск анимации
      input.classList.add("shake");
    }
  });

  input.focus();
}

/* --- экран с наградой: координаты / фото / подарочный код --- */

function renderReveal(stage) {
  const isLast = stage.id >= STAGES.length;

  const photoBlock = stage.photo
    ? `<div class="reveal-photo">
         <img src="${stage.photo}" alt="${stage.photoCaption || ''}"
              onerror="this.parentElement.classList.add('empty'); this.remove();">
         <span>${stage.photoCaption || 'Фото ещё не добавлено'}</span>
       </div>`
    : "";

  const coordsBlock = stage.coords
    ? `<div class="coords-box">
         <span class="val">${stage.coords}</span>
         ${stage.mapsUrl ? `<a href="${stage.mapsUrl}" target="_blank" rel="noopener">открыть карту</a>` : ""}
       </div>`
    : "";

  const giftBlock = stage.gift
    ? `<div class="gift-box">
         <p class="gift-brand">${stage.gift.brand}</p>
         <p class="gift-code">${stage.gift.code}</p>
         <button class="copy-btn" id="copy-btn">скопировать код</button>
       </div>`
    : "";

  app.innerHTML = `
    <p class="step-label">этап ${stage.id} из ${STAGES.length}</p>
    <p class="step-heading">${stage.heading}</p>
    <p class="step-text">${stage.text}</p>
    ${photoBlock}
    ${coordsBlock}
    ${giftBlock}
    <button class="btn btn-primary" id="continue-btn">
      ${isLast ? "Дальше" : "Я на месте, идём дальше"}
    </button>
  `;

  const copyBtn = document.getElementById("copy-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(stage.gift.code).then(() => {
        copyBtn.textContent = "скопировано";
        copyBtn.classList.add("copied");
      });
    });
  }

  document.getElementById("continue-btn").addEventListener("click", render);
}

function renderFinished() {
  progressEl.style.display = "none";
  app.innerHTML = `
    <p class="step-label">квест пройден</p>
    <p class="step-heading">Готово</p>
    <p class="step-text">${FINAL_MESSAGE}</p>
    <button class="btn btn-ghost" id="restart-btn">Начать заново</button>
  `;

  document.getElementById("restart-btn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
}

/* --- сброс прогресса: открой сайт со ?reset в конце ссылки --- */

if (new URLSearchParams(window.location.search).has("reset")) {
  localStorage.removeItem(STORAGE_KEY);
}

/* --- главный рендер: решает, что показать по текущему прогрессу --- */

function render() {
  const completed = getProgress();
  renderProgressDots(Math.min(completed, STAGES.length));

  if (completed >= STAGES.length) {
    renderFinished();
    return;
  }

  renderCodeEntry(STAGES[completed], completed);
}

render();

/* ==========================================================
   ВСТУПИТЕЛЬНЫЙ ЭКРАН:
   1. логотип (PNG) спокойно проявляется по центру экрана
      (крупно — элемент временно "телепортирован" туда через
      transform, см. FLIP ниже)
   2. появляются "?" один за другим
   3. логотип + ??? одним бесшовным движением (тот же самый
      элемент, без подмены) переезжают на своё обычное место
      в шапке
   4. только после этого остальная страница проявляется "из пелены"
   ========================================================== */

(function runIntro() {
  const heroFlip = document.getElementById("heroFlip");
  const logoImg = document.getElementById("logoImg");
  const q1 = document.getElementById("q1");
  const q2 = document.getElementById("q2");
  const q3 = document.getElementById("q3");
  const veilEls = document.querySelectorAll(".veil");
  if (!heroFlip || !logoImg) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    logoImg.classList.add("visible");
    [q1, q2, q3].forEach((q) => q && q.classList.add("visible"));
    veilEls.forEach((el) => el.classList.add("visible"));
    return;
  }

  // тайминги (мс)
  const LOGO_MS = 900;    // спокойное проявление логотипа
  const Q_GAP_MS = 220;   // пауза между появлением каждого "?"
  const Q_FADE_MS = 350;  // время появления одного "?"
  const HOLD_MS = 400;    // пауза после того как всё появилось
  const FLY_MS = 900;     // "бесшовный" переезд на своё место
  const REST_DELAY_MS = 150; // маленькая пауза перед проявлением остальной страницы

  document.body.classList.add("no-scroll");

  // --- FLIP: считаем, где логотип+??? стоят "по-настоящему" (в шапке),
  // и временно переносим их transform'ом в центр экрана крупно ---
  const finalRect = heroFlip.getBoundingClientRect();
  const targetWidth = Math.min(window.innerWidth * 0.8, 430);
  const scale = targetWidth / finalRect.width;
  const targetHeight = finalRect.height * scale;
  const targetX = (window.innerWidth - targetWidth) / 2;
  const targetY = (window.innerHeight - targetHeight) / 2;
  const dx = targetX - finalRect.left;
  const dy = targetY - finalRect.top;

  heroFlip.style.transformOrigin = "top left";
  heroFlip.style.transform = `translate(${dx}px, ${dy}px) scale(${scale}) translateZ(0)`;

  // --- фаза 1: логотип спокойно проявляется ---
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      logoImg.classList.add("visible");
    });
  });

  // --- фаза 2: "?" появляются по одному ---
  [q1, q2, q3].forEach((q, i) => {
    if (!q) return;
    setTimeout(() => {
      q.classList.add("visible");
    }, LOGO_MS + i * (Q_GAP_MS + Q_FADE_MS));
  });

  const qDoneAt = LOGO_MS + 3 * (Q_GAP_MS + Q_FADE_MS);

  // --- фаза 3: логотип + ??? одним движением уезжают на своё место ---
  setTimeout(() => {
    heroFlip.style.transition = `transform ${FLY_MS}ms cubic-bezier(.65,0,.35,1)`;
    heroFlip.style.transform = "translateZ(0)";
  }, qDoneAt + HOLD_MS);

  // --- фаза 4: остальная страница проявляется "из пелены" ---
  setTimeout(() => {
    veilEls.forEach((el) => el.classList.add("visible"));
  }, qDoneAt + HOLD_MS + FLY_MS + REST_DELAY_MS);

  // уборка: снимаем инлайновый transform и блокировку скролла
  setTimeout(() => {
    heroFlip.style.transition = "";
    heroFlip.style.transform = "";
    heroFlip.style.transformOrigin = "";
    document.body.classList.remove("no-scroll");
  }, qDoneAt + HOLD_MS + FLY_MS + REST_DELAY_MS + 800);
})();
