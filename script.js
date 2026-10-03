'use strict';
let effectSettings = {
  reveal: { duration: 0.5, distance: 16, stagger: 0.035, maxDelay: 0.14 },
  navigation: { duration: 0.22 },
  pointer: { distance: 4 },
};
fetch('effects.json')
  .then((response) => {
    if (!response.ok) throw new Error('Settings unavailable');
    return response.json();
  })
  .then((settings) => {
    if (
      settings.reveal?.duration > 0 &&
      settings.reveal.duration <= 2 &&
      settings.pointer?.distance >= 0 &&
      settings.pointer.distance <= 8
    )
      effectSettings = settings;
  })
  .catch(() => {});
document.documentElement.classList.add('js');
const header = document.querySelector('header');
const navigation = document.querySelector('#navigation');
const menu = document.querySelector('.menu-toggle');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
const sections = [...document.querySelectorAll('section[id]')];
const links = [...navigation.querySelectorAll('a')];
const animations = new Map();
const shown = new WeakSet();
const targets = [
  ...document.querySelectorAll(
    '.hero h1, .hero .intro, .hero .actions, .section h2, .section .eyebrow, .about-copy > p, .profile-label, .small-note, .section-heading > p, .project-info > h3, .project-info > p, .tool-card > div, .tool-group-heading, .skill-list > div, .credential-column article, .timeline-item > div, .contact > p, .contact-actions, .contact-card',
  ),
];
let framePending = false;
let scrollFrame = 0;
let navigating = false;
let navigationTarget;
let menuAnimation;
function setMenu(open) {
  navigation.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute(
    'aria-label',
    open ? 'Close navigation' : 'Open navigation',
  );
  menuAnimation?.cancel();
  if (open && !motion.matches && window.Motion) {
    const control = Motion.animate(
      navigation,
      { opacity: [0, 1], y: [-8, 0] },
      { duration: 0.22 },
    );
    menuAnimation = { cancel: () => control.stop() };
  } else if (open && !motion.matches && navigation.animate)
    menuAnimation = navigation.animate(
      [
        { opacity: 0, transform: 'translateY(-8px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: effectSettings.navigation.duration * 1000,
        easing: 'ease-out',
      },
    );
}
menu.addEventListener('click', () =>
  setMenu(!navigation.classList.contains('open')),
);
document.addEventListener('click', (event) => {
  if (!navigation.contains(event.target) && !menu.contains(event.target))
    setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    setMenu(false);
    menu.focus();
  }
});
matchMedia('(min-width:701px)').addEventListener('change', () =>
  setMenu(false),
);
function reveal(element, delay = 0) {
  if (motion.matches || !element.animate) return;
  animations.get(element)?.cancel();
  if (window.gsap) {
    const tween = gsap.fromTo(
      element,
      { opacity: 0, y: effectSettings.reveal.distance },
      {
        opacity: 1,
        y: 0,
        duration: effectSettings.reveal.duration,
        delay: delay / 1000,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
        onComplete: () => animations.delete(element),
      },
    );
    animations.set(element, {
      cancel: () => {
        tween.kill();
        gsap.set(element, { clearProps: 'opacity,transform' });
      },
    });
    return;
  }
  const isText = !element.matches('.project, .tool-card');
  const animation = element.animate(
    [
      {
        opacity: 0,
        transform: `translateY(${isText ? effectSettings.reveal.distance : 12}px)`,
      },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    {
      duration: effectSettings.reveal.duration * 1000,
      delay,
      easing: 'cubic-bezier(.2,.7,.2,1)',
      fill: 'backwards',
    },
  );
  animations.set(element, animation);
  animation.onfinish = () => animations.delete(element);
}
function update() {
  framePending = false;
  const top = header.getBoundingClientRect().bottom + 16;
  const total = document.documentElement.scrollHeight - innerHeight;
  header.style.setProperty(
    '--reading-progress',
    String(total > 0 ? Math.min(1, Math.max(0, scrollY / total)) : 0),
  );
  header.classList.toggle('is-scrolled', scrollY > 12);
  let active = null;
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= top + 90) active = section.id;
  });
  links.forEach((link) => {
    const selected = link.hash === '#' + active;
    link.classList.toggle('active', selected);
    if (selected) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  let stagger = 0;
  targets.forEach((element) => {
    if (!element.getClientRects().length) return;
    const rect = element.getBoundingClientRect();
    if (rect.bottom < top || rect.top >= innerHeight) shown.delete(element);
    if (
      !navigating &&
      rect.top < innerHeight - 35 &&
      rect.bottom > top &&
      !shown.has(element)
    ) {
      shown.add(element);
      reveal(
        element,
        Math.min(
          stagger++ * effectSettings.reveal.stagger * 1000,
          effectSettings.reveal.maxDelay * 1000,
        ),
      );
    }
  });
}
function schedule() {
  if (!framePending) {
    framePending = true;
    requestAnimationFrame(update);
  }
}

function stopNavigation(completed = false) {
  cancelAnimationFrame(scrollFrame);
  navigating = false;
  if (completed && navigationTarget) {
    if (!navigationTarget.matches('a, button, input, [tabindex]'))
      navigationTarget.setAttribute('tabindex', '-1');
    navigationTarget.focus({ preventScroll: true });
  }
  navigationTarget = null;
  schedule();
}

function scrollToSection(target) {
  cancelAnimationFrame(scrollFrame);
  navigating = true;
  navigationTarget = target;
  const start = scrollY;
  const destination = Math.min(
    Math.max(0, document.documentElement.scrollHeight - innerHeight),
    Math.max(
      0,
      target === document.body
        ? 0
        : target.getBoundingClientRect().top + start - header.offsetHeight - 18,
    ),
  );
  const distance = destination - start;
  const duration = motion.matches
    ? 0
    : Math.min(1100, Math.max(450, Math.abs(distance) * 0.15 + 450));
  if (!duration || Math.abs(distance) < 2) {
    window.scrollTo({ top: destination, behavior: 'instant' });
    stopNavigation(true);
    return;
  }
  const began = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - began) / duration);
    const eased =
      progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    window.scrollTo({ top: start + distance * eased, behavior: 'instant' });
    if (progress < 1) scrollFrame = requestAnimationFrame(step);
    else stopNavigation(true);
  };
  scrollFrame = requestAnimationFrame(step);
}
['wheel', 'touchstart'].forEach((type) =>
  window.addEventListener(
    type,
    () => {
      if (navigating) stopNavigation();
    },
    { passive: true },
  ),
);
window.addEventListener('keydown', (event) => {
  if (
    navigating &&
    [
      'ArrowUp',
      'ArrowDown',
      'PageUp',
      'PageDown',
      'Home',
      'End',
      ' ',
      'Escape',
    ].includes(event.key)
  )
    stopNavigation();
});
motion.addEventListener('change', () => {
  if (navigating) stopNavigation();
});
document.querySelectorAll('a[href^="#"]').forEach((link) =>
  link.addEventListener('click', (event) => {
    const target = link.hash
      ? document.getElementById(link.hash.slice(1))
      : document.body;
    if (
      !target ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    setMenu(false);
    targets
      .filter((element) => target.contains(element))
      .forEach((element) => shown.delete(element));
    scrollToSection(target);
    history.replaceState(
      null,
      '',
      link.hash || location.pathname + location.search,
    );
    schedule();
  }),
);
window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule);
window.addEventListener('pageshow', schedule);
document
  .querySelectorAll('details')
  .forEach((detail) => detail.addEventListener('toggle', schedule));
motion.addEventListener('change', () => {
  animations.forEach((a) => a.cancel());
  animations.clear();
  menuAnimation?.cancel();
  schedule();
});
document.querySelectorAll('.button, .nav-contact').forEach((button) =>
  button.addEventListener('pointerdown', (event) => {
    if (motion.matches || event.button !== 0 || !button.animate) return;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'button-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.left = event.clientX - rect.left + 'px';
    ripple.style.top = event.clientY - rect.top + 'px';
    button.append(ripple);
    if (window.anime?.animate) {
      ripple.style.transform = 'translate(-50%,-50%)';
      anime.animate(ripple, {
        scale: [0, 14],
        opacity: [0.35, 0],
        duration: 450,
        ease: 'outQuad',
        onComplete: () => ripple.remove(),
      });
      return;
    }
    const animation = ripple.animate(
      [
        { transform: 'translate(-50%,-50%) scale(0)', opacity: 0.35 },
        { transform: 'translate(-50%,-50%) scale(14)', opacity: 0 },
      ],
      { duration: 450, easing: 'ease-out' },
    );
    animation.onfinish = () => ripple.remove();
    animation.oncancel = () => ripple.remove();
  }),
);
schedule();
if (window.ScrollTrigger) {
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) =>
      header.style.setProperty('--reading-progress', self.progress),
  });
}

// Fine-pointer accents remain independent of scroll-reveal transforms.
const contactPointer = matchMedia('(hover: hover) and (pointer: fine)');
document.querySelectorAll('a.contact-card').forEach((card) => {
  let pointerFrame = 0;
  const reset = () => {
    cancelAnimationFrame(pointerFrame);
    card.style.removeProperty('--icon-x');
    card.style.removeProperty('--icon-y');
    card.style.removeProperty('--contact-x');
    card.style.removeProperty('--contact-y');
  };
  card.addEventListener(
    'pointermove',
    (event) => {
      if (motion.matches || !contactPointer.matches) return;
      cancelAnimationFrame(pointerFrame);
      const x = event.clientX,
        y = event.clientY;
      pointerFrame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--contact-x', x - rect.left + 'px');
        card.style.setProperty('--contact-y', y - rect.top + 'px');
        card.style.setProperty(
          '--icon-x',
          ((x - rect.left) / rect.width - 0.5) *
            effectSettings.pointer.distance +
            'px',
        );
        card.style.setProperty(
          '--icon-y',
          ((y - rect.top) / rect.height - 0.5) *
            effectSettings.pointer.distance +
            'px',
        );
      });
    },
    { passive: true },
  );
  card.addEventListener('pointerleave', reset);
  card.addEventListener('pointercancel', reset);
  motion.addEventListener('change', reset);
  contactPointer.addEventListener('change', reset);
});

