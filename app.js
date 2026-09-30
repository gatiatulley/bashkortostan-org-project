/* Башкортостан — standalone static guide. No external libraries or tracking. */
(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const data = window.BASH_DATA;
  if (!data) return;
  document.body.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let savedMotion;
  try { savedMotion = localStorage.getItem('bash-motion'); } catch (_) { /* Local files may disallow storage. */ }
  let motion = savedMotion === null || savedMotion === undefined ? !reduced.matches : savedMotion === 'on';
  const motionButton = $('#motionToggle');
  function applyMotion() {
    document.body.classList.toggle('motion-off', !motion);
    motionButton.setAttribute('aria-pressed', String(motion));
    motionButton.setAttribute('aria-label', motion ? 'Выключить анимации' : 'Включить анимации');
    $('.motion-icon', motionButton).textContent = motion ? 'Ⅱ' : '▷';
    motionButton.title = motion ? 'Выключить анимации' : 'Включить анимации';
  }
  applyMotion();
  motionButton.addEventListener('click', () => {
    motion = !motion; applyMotion();
    try { localStorage.setItem('bash-motion', motion ? 'on' : 'off'); } catch (_) {}
    scheduleScroll();
  });
  if (reduced.addEventListener) reduced.addEventListener('change', e => { motion = !e.matches; applyMotion(); });

  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: .07, rootMargin: '0px 0px -25px 0px' });
    reveals.forEach(el => observer.observe(el));
  } else reveals.forEach(el => el.classList.add('visible'));

  const header = $('#header');
  const hero = $('.hero');
  const heroImage = $('.hero-image');
  const interlude = $('.interlude');
  const interludeImage = $('.interlude>img');
  const progress = $('#readProgress');
  let scrollQueued = false;
  function onScrollFrame() {
    scrollQueued = false;
    const y = window.scrollY || 0;
    header.classList.toggle('scrolled', y > 45);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (motion && window.innerWidth > 650) {
      if (y < hero.offsetHeight + 100) heroImage.style.transform = `translateY(${Math.min(80, y * .13)}px) scale(1.04)`;
      const rect = interlude.getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom > 0) interludeImage.style.transform = `translateY(${Math.max(-35, Math.min(35, (innerHeight / 2 - rect.top - rect.height / 2) * .06))}px)`;
    } else { heroImage.style.transform = ''; interludeImage.style.transform = ''; }
  }
  function scheduleScroll() { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScrollFrame); } }
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll, { passive: true });
  scheduleScroll();
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) $$('.desktop-nav a').forEach(a => a.classList.toggle('active', a.hash === '#' + entry.target.id));
      });
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    ['nature', 'atlas', 'culture', 'library'].forEach(id => navObserver.observe(document.getElementById(id)));
  }

  const menu = $('#menu');
  const menuToggle = $('#menuToggle');
  function setMenu(open, focus = true) {
    menu.hidden = !open; menuToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (focus) (open ? $('a', menu) : menuToggle).focus();
  }
  menuToggle.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false, false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) setMenu(false);
    if (!menu.hidden && e.key === 'Tab') {
      const items = [motionButton, menuToggle, ...$$('a', menu)];
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    if (e.key === '/' && menu.hidden && !e.target.closest('input,textarea,select') && !$('#imageDialog').open) {
      e.preventDefault(); $('#chapterSearch').focus(); $('#library').scrollIntoView({ behavior: motion ? 'smooth' : 'auto' });
    }
  });

  const chapters = $$('.chapter');
  const search = $('#chapterSearch');
  function searchChapters() {
    const query = search.value.toLocaleLowerCase('ru').trim().replace(/ё/g, 'е');
    let count = 0;
    chapters.forEach(chapter => {
      const match = !query || chapter.dataset.search.replace(/ё/g, 'е').includes(query);
      chapter.hidden = !match;
      if (match) count++;
    });
    $('#noResults').hidden = count > 0;
    $('#searchStatus').textContent = query ? `Найдено тем: ${count} из ${chapters.length}.` : 'Откройте тему, чтобы прочитать полный материал.';
  }
  search.addEventListener('input', searchChapters);
  function revealTarget(hash, scroll = false) {
    if (!hash || hash === '#') return;
    let target;
    try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (_) { return; }
    if (!target) return;
    if (target.classList.contains('chapter')) {
      search.value = ''; searchChapters(); target.open = true;
    }
    let parent = target.parentElement;
    while (parent) { if (parent.tagName === 'DETAILS') parent.open = true; parent = parent.parentElement; }
    if (scroll) requestAnimationFrame(() => target.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' }));
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !a.hash) return;
    const target = document.getElementById(a.hash.slice(1));
    if (!target) return;
    e.preventDefault();
    if (!menu.hidden) setMenu(false, false);
    revealTarget(a.hash, true);
    try { history.pushState(null, '', a.hash); } catch (_) { location.hash = a.hash; }
    // Move keyboard focus to destination without competing with the smooth scroll.
    const focusTarget = target.matches('details') ? $('summary', target) : target;
    if (!focusTarget.matches('a,button,input,summary,[tabindex]')) focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
  });
  window.addEventListener('hashchange', () => revealTarget(location.hash, true));
  revealTarget(location.hash, true);

  // Count only once; never overwrite the factual values for reduced-motion readers.
  if ('IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        countObserver.unobserve(entry.target);
        if (!motion) return;
        const el = entry.target, value = Number(el.dataset.count), decimals = Number(el.dataset.decimals), start = performance.now();
        function frame(now) {
          const t = Math.min(1, (now - start) / 1250), ease = 1 - Math.pow(1 - t, 3);
          el.textContent = (value * (motion ? ease : 1)).toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
          if (t < 1 && motion) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }, { threshold: .7 });
    $$('[data-count]').forEach(el => countObserver.observe(el));
  }

  function animatePanel(panel) {
    panel.classList.remove('panel-enter');
    if (motion) { void panel.offsetWidth; panel.classList.add('panel-enter'); }
  }
  function wireTabs(selector, onSelect) {
    const tabs = $$(selector);
    function select(tab, focus = false) {
      tabs.forEach(t => { t.setAttribute('aria-selected', String(t === tab)); t.tabIndex = t === tab ? 0 : -1; });
      if (focus) tab.focus();
      onSelect(tab, tabs.indexOf(tab));
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', e => {
        let next;
        if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = tabs.length - 1;
        if (next !== undefined) { e.preventDefault(); select(tabs[next], true); }
      });
    });
    select(tabs[0]);
  }
  const times = [
    ['≈ 300', 'млн лет назад', 'Когда здесь было море', 'Рифовые известняки шиханов формировались в пермском море. Они сохранили следы организмов и стали источником знаний о древней среде. Возраст геологических пород несопоставим с возрастом городов и государств.', 4],
    ['Палеолит', 'древнейшее искусство', 'Человек оставляет изображение', 'Рисунки Шульган-Таша относятся к верхнему палеолиту. Изображения животных и знаки показывают способность людей сохранять образы и смыслы. Это культурное наследие, которое требует особой защиты.', 5],
    ['1574', 'год', 'Крепость становится городом', 'Историю Уфы отсчитывают от основания крепости в 1574 году. В 1586 году поселение получило статус города. Укрепление на речных путях постепенно стало крупным административным и хозяйственным центром.', 12],
    ['1919', '20 марта', 'Соглашение об автономии', 'Соглашение центральной Советской власти с Башкирским правительством закрепило создание автономной Башкирской Советской Республики. Эта дата — важная веха истории государственности Башкортостана.', 13],
    ['2025', 'год включения', 'Наследие мирового значения', 'Наскальные рисунки пещеры Шульган-Таш включены в Список всемирного наследия ЮНЕСКО. Международное признание подчёркивает ценность памятника и необходимость его сохранения.', 5]
  ];
  wireTabs('[data-time]', (tab, i) => {
    const t = times[i], panel = $('#timePanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.innerHTML = `<span class="time-glyph ${i === 1 ? 'time-long' : ''}" aria-hidden="true">${t[0]}<br><small>${t[1]}</small></span><div><h3>${t[2]}</h3><p>${t[3]}</p><a class="ref" href="#source-${t[4]}">Источник [${String(t[4]).padStart(2, '0')}]</a></div>`;
    animatePanel(panel);
  });
  const economies = [
    ['01 / НЕДРА И ТЕХНОЛОГИИ', 'От сырья<br>к сложному продукту', 'Нефть и другие полезные ископаемые связаны с развитием переработки, химии и нефтехимии. Машиностроение дополняет промышленную специализацию региона. Экономика опирается на природные ресурсы, но её создают предприятия и специалисты.', ['Природное сырьё', 'Переработка и инженерные знания', 'Топливо, материалы, оборудование'], 1],
    ['02 / ЛЕС И ЖИВЫЕ ЗНАНИЯ', 'Мёд начинается<br>с экосистемы', 'Бортничество — содержание пчёл в подготовленных дуплах деревьев. В районе Шульган-Таша сохраняются традиции работы с лесными пчёлами. Здесь хозяйственный навык нельзя отделить от состояния леса и передачи опыта.', ['Лес и медоносные растения', 'Пчёлы и мастерство бортника', 'Мёд и сохранение традиции'], 6],
    ['03 / ЗЕМЛЯ И ТРУД', 'Равнины становятся<br>полями', 'Земли Предуралья создают условия для растениеводства и животноводства. Хозяйство зависит от почв, климата, техники и труда людей. Разнообразие природных условий помогает понять, почему республика не ограничивается одной отраслью.', ['Почвы, климат и земельный фонд', 'Знания, техника и труд', 'Растениеводство и животноводство'], 7]
  ];
  wireTabs('[data-eco]', (tab, i) => {
    const e = economies[i], panel = $('#ecoPanel'); panel.setAttribute('aria-labelledby', tab.id);
    panel.innerHTML = `<span class="eyebrow">${e[0]}</span><h3>${e[1]}</h3><p>${e[2]} <a class="ref" href="#source-${e[4]}">[${String(e[4]).padStart(2, '0')}]</a></p><ol class="eco-chain" aria-label="Связь природы и хозяйства">${e[3].map(t => `<li>${t}</li>`).join('')}</ol>`;
    animatePanel(panel);
  });

  function selectPlace(index) {
    const p = data.places[index]; if (!p) return;
    $$('[data-place]').forEach(el => { const selected = Number(el.dataset.place) === index; el.classList.toggle('selected', selected); el.setAttribute('aria-pressed', String(selected)); });
    const card = $('#placeCard');
    card.innerHTML = `<span class="eyebrow">${p.tag}</span><h3>${p.name}</h3><p>${p.text}</p><div class="place-meaning"><span>ПОЧЕМУ ЭТО ВАЖНО</span><p>${p.why}</p></div><a class="place-source" href="#source-${p.source}">Источник [${String(p.source).padStart(2, '0')}]</a><a class="text-link chapter-link" href="#chapter-${p.chapter}">Продолжить изучение <span>+</span></a>`;
    animatePanel(card);
  }
  $$('[data-place]').forEach(el => {
    el.addEventListener('click', () => selectPlace(Number(el.dataset.place)));
    if (el.tagName.toLowerCase() === 'g') el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectPlace(Number(el.dataset.place)); }
    });
  });
  selectPlace(0);

  const imageDialog = $('#imageDialog');
  $('#replicaOpen').addEventListener('click', () => {
    imageDialog.showModal(); document.body.classList.add('dialog-open');
  });
  function closeImage() { imageDialog.close(); }
  $('#closeImage').addEventListener('click', closeImage);
  imageDialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); $('#replicaOpen').focus({ preventScroll: true }); });
  imageDialog.addEventListener('click', e => { if (e.target === imageDialog) { const r = imageDialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeImage(); } });

  let questionIndex = 0;
  const answers = [];
  const surface = $('#quizSurface');
  const quizRefs = [1, 4, 5, 6, 9, 19, null, 6, 16, null];
  function updateQuizDots() {
    $('#quizDots').innerHTML = data.quiz.map((q, i) => `<span class="quiz-dot ${i === questionIndex && i >= answers.length ? 'current' : ''} ${answers[i] !== undefined ? (answers[i] === q[2] ? 'correct' : 'wrong') : ''}" title="Вопрос ${i + 1}${answers[i] !== undefined ? (answers[i] === q[2] ? ': верно' : ': неверно') : ''}"></span>`).join('');
    $('#quizIndex').textContent = String(Math.min(questionIndex + 1, 10)).padStart(2, '0');
  }
  function renderQuestion(focus = false) {
    updateQuizDots();
    const q = data.quiz[questionIndex];
    surface.innerHTML = `<h3 id="quizQuestion" tabindex="-1">${q[0]}</h3><div class="quiz-options" role="group" aria-labelledby="quizQuestion">${q[1].map((answer, i) => `<button type="button" class="quiz-option" data-answer="${i}"><span aria-hidden="true">${String.fromCharCode(65 + i)}</span>${answer}</button>`).join('')}</div><div id="quizFeedback" class="quiz-feedback" role="status"></div>`;
    $$('[data-answer]', surface).forEach(button => button.addEventListener('click', () => chooseAnswer(Number(button.dataset.answer))));
    animatePanel(surface);
    if (focus) $('#quizQuestion').focus({ preventScroll: true });
  }
  function chooseAnswer(answer) {
    if (answers.length > questionIndex) return;
    const q = data.quiz[questionIndex]; answers.push(answer);
    $$('[data-answer]', surface).forEach(button => {
      button.disabled = true;
      const i = Number(button.dataset.answer);
      if (i === q[2]) button.classList.add('is-correct');
      if (i === answer && answer !== q[2]) button.classList.add('is-wrong');
    });
    const source = quizRefs[questionIndex];
    $('#quizFeedback').innerHTML = `<strong>${answer === q[2] ? 'Верно.' : 'Правильный ответ: ' + q[1][q[2]] + '.'}</strong>${q[3]}${source ? ` <a class="ref" href="#source-${source}">[${String(source).padStart(2, '0')}]</a>` : ''}`;
    const next = document.createElement('button'); next.type = 'button'; next.className = 'quiz-next';
    next.textContent = questionIndex === data.quiz.length - 1 ? 'Посмотреть результат' : 'Следующий вопрос';
    next.addEventListener('click', () => {
      questionIndex++;
      if (questionIndex === data.quiz.length) renderResult(); else renderQuestion(true);
    });
    surface.append(next); updateQuizDots(); next.focus({ preventScroll: true });
  }
  function renderResult() {
    const score = answers.filter((a, i) => a === data.quiz[i][2]).length;
    const message = score === 10 ? 'Вы увидели не только факты, но и связи между ними.' : score >= 7 ? 'Хорошая основа. Вернитесь к объяснениям, чтобы дополнить картину.' : 'Путешествие можно продолжить: в читальном зале есть все ответы и подробные объяснения.';
    surface.innerHTML = `<span class="eyebrow">ВАШ РЕЗУЛЬТАТ</span><div class="quiz-result-num" id="quizResult" tabindex="-1">${score}<small> / 10</small></div><h3>${score === 10 ? 'Республика стала ближе.' : 'Каждый ответ — повод узнать больше.'}</h3><p class="quiz-result-text">${message}</p><details class="quiz-review"><summary>Разобрать все ответы</summary><ol>${data.quiz.map((q, i) => `<li><strong>${i + 1}. ${q[0]}</strong><br>${answers[i] === q[2] ? 'Ваш ответ верный.' : 'Верно: ' + q[1][q[2]] + '.'} ${q[3]}</li>`).join('')}</ol></details><button class="quiz-restart" type="button">Пройти ещё раз</button>`;
    $('.quiz-restart', surface).addEventListener('click', () => { questionIndex = 0; answers.length = 0; renderQuestion(true); });
    updateQuizDots(); animatePanel(surface); $('#quizResult').focus({ preventScroll: true });
  }
  renderQuestion();

  let printState = [];
  window.addEventListener('beforeprint', () => { printState = $$('details').map(d => [d, d.open, d.hidden]); $$('details').forEach(d => { d.open = true; d.hidden = false; }); });
  window.addEventListener('afterprint', () => printState.forEach(([d, open, hidden]) => { d.open = open; d.hidden = hidden; }));
})();
