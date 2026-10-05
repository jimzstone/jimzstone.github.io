(() => {
  const track = document.querySelector('#project-slides');
  const controls = document.querySelector('.project-slide-controls');
  if (!track || !controls) return;
  const previous = controls.querySelector('[data-slide-previous]');
  const next = controls.querySelector('[data-slide-next]');
  const dots = controls.querySelector('.project-slide-dots');
  const status = controls.querySelector('.project-slide-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  status.setAttribute('aria-live', 'off');
  let overview = true;
  let slides = [];
  let current = 0;
  let pendingFrame = 0;
  let autoplayTimer;
  let touching = false;
  let hovering = false;
  function schedule() {
    clearTimeout(autoplayTimer);
    if (!overview || slides.length < 2 || hovering || touching ||
        document.hidden || reduced.matches || track.contains(document.activeElement) ||
        controls.contains(document.activeElement)) return;
    autoplayTimer = setTimeout(() => {
      go((current + 1) % slides.length, current < slides.length - 1);
      schedule();
    }, 2000);
  }
  function nearest() {
    const left = track.getBoundingClientRect().left;
    return slides.reduce((best, slide, index) =>
      Math.abs(slide.getBoundingClientRect().left - left) <
      Math.abs(slides[best].getBoundingClientRect().left - left) ? index : best, 0);
  }
  function update() {
    if (!slides.length || !overview) return;
    current = nearest();
    const active = slides[current];
    track.style.height = Math.ceil(active.getBoundingClientRect().height + 24) + 'px';
    slides.forEach((slide, index) => { slide.inert = index !== current; });
    previous.disabled = next.disabled = slides.length < 2;
    status.textContent = (current + 1) + ' / ' + slides.length;
    [...dots.children].forEach((button, index) =>
      button.setAttribute('aria-current', String(index === current)));
  }
  function go(index, smooth = true) {
    if (!overview) return;
    const slide = slides[((index % slides.length) + slides.length) % slides.length];
    if (!slide) return;
    track.scrollTo({
      left: track.scrollLeft + slide.getBoundingClientRect().left - track.getBoundingClientRect().left,
      behavior: smooth && !reduced.matches ? 'smooth' : 'instant',
    });
  }
  function rebuild() {
    overview = !track.dataset.category || track.dataset.category === 'All projects';
    track.classList.toggle('project-slideshow', overview);
    track.classList.toggle('project-category-list', !overview);
    track.setAttribute('aria-label', overview ? 'Selected projects slideshow' : track.dataset.category + ' projects');
    if (overview) {
      track.setAttribute('aria-roledescription', 'carousel');
      track.setAttribute('tabindex', '0');
    } else {
      track.removeAttribute('aria-roledescription');
      track.removeAttribute('tabindex');
      track.style.removeProperty('height');
      track.scrollLeft = 0;
      track.querySelectorAll('.project').forEach(slide => { slide.inert = false; });
    }
    const old = slides[current];
    slides = [...track.querySelectorAll('.project')].filter(slide => !slide.hidden);
    dots.replaceChildren();
    slides.forEach((slide, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(index + 1);
      const title = slide.querySelector('.project-info h3')?.textContent || 'Project';
      button.setAttribute('aria-label', 'Show ' + title);
      button.addEventListener('click', () => go(index));
      dots.append(button);
    });
    controls.hidden = !overview || slides.length < 2;
    current = Math.max(0, slides.indexOf(old));
    go(current, false);
    update();
    schedule();
  }
  previous.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(pendingFrame);
    pendingFrame = requestAnimationFrame(update);
  }, { passive: true });
  track.addEventListener('keydown', event => {
    if (!overview || event.target !== track) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      go(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  new MutationObserver(rebuild).observe(track, {
    subtree: true, attributes: true, attributeFilter: ['hidden', 'data-category'],
  });
  window.addEventListener('resize', () => { go(current, false); update(); });
  if (typeof ResizeObserver !== 'undefined') {
    const sizeObserver = new ResizeObserver(update);
    track.querySelectorAll('.project').forEach(slide => sizeObserver.observe(slide));
  }
  [track, controls].forEach(element => {
    element.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') { hovering = true; schedule(); }
    });
    element.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'touch') { hovering = false; schedule(); }
    });
    element.addEventListener('pointerdown', () => { touching = true; schedule(); });
    element.addEventListener('focusin', schedule);
    element.addEventListener('focusout', () => setTimeout(schedule, 0));
    element.addEventListener('click', schedule);
  });
  window.addEventListener('pointerup', () => { touching = false; schedule(); });
  window.addEventListener('pointercancel', () => { touching = false; schedule(); });
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', schedule);
  track.classList.add('project-slideshow');
  rebuild();
})();
