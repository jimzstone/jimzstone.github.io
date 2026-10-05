(() => {
  const track = document.querySelector('#project-slides');
  const controls = document.querySelector('.project-slide-controls');
  if (!track || !controls) return;
  const previous = controls.querySelector('[data-slide-previous]');
  const next = controls.querySelector('[data-slide-next]');
  const dots = controls.querySelector('.project-slide-dots');
  const status = controls.querySelector('.project-slide-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let slides = [];
  let current = 0;
  let pendingFrame = 0;
  function nearest() {
    const left = track.getBoundingClientRect().left;
    return slides.reduce((best, slide, index) =>
      Math.abs(slide.getBoundingClientRect().left - left) <
      Math.abs(slides[best].getBoundingClientRect().left - left) ? index : best, 0);
  }
  function update() {
    if (!slides.length) return;
    current = nearest();
    const active = slides[current];
    track.style.height = Math.ceil(active.getBoundingClientRect().height + 24) + 'px';
    slides.forEach((slide, index) => { slide.inert = index !== current; });
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    status.textContent = (current + 1) + ' / ' + slides.length;
    [...dots.children].forEach((button, index) =>
      button.setAttribute('aria-current', String(index === current)));
  }
  function go(index, smooth = true) {
    const slide = slides[Math.max(0, Math.min(index, slides.length - 1))];
    if (!slide) return;
    track.scrollTo({
      left: track.scrollLeft + slide.getBoundingClientRect().left - track.getBoundingClientRect().left,
      behavior: smooth && !reduced.matches ? 'smooth' : 'instant',
    });
  }
  function rebuild() {
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
    controls.hidden = slides.length < 2;
    current = Math.max(0, slides.indexOf(old));
    go(current, false);
    update();
  }
  previous.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(pendingFrame);
    pendingFrame = requestAnimationFrame(update);
  }, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.target !== track) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      go(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  new MutationObserver(rebuild).observe(track, {
    subtree: true, attributes: true, attributeFilter: ['hidden'],
  });
  window.addEventListener('resize', () => { go(current, false); update(); });
  if (typeof ResizeObserver !== 'undefined') {
    const sizeObserver = new ResizeObserver(update);
    track.querySelectorAll('.project').forEach(slide => sizeObserver.observe(slide));
  }
  track.classList.add('project-slideshow');
  rebuild();
})();
