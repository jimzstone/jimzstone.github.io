'use strict';
let effectSettings = {
  reveal: { duration: 1.2, distance: 16, stagger: 0.08, maxDelay: 0.32 },
  navigation: { duration: 0.45 },
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
      { duration: effectSettings.navigation.duration },
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
  const visibleTop = header.getBoundingClientRect().bottom + 12;
  const fadeZone = Math.min(110, innerHeight * 0.18);
  targets.forEach((element) => {
    if (!element.getClientRects().length) return;
    const rect = element.getBoundingClientRect();
    const entering = (innerHeight - rect.top) / fadeZone;
    const leaving = (rect.bottom - visibleTop) / fadeZone;
    const amount = element.matches(':focus-within')
      ? 1
      : Math.max(0.45, Math.min(1, entering, leaving));
    element.classList.add('scroll-fade');
    element.style.setProperty('--scroll-opacity', String(amount));
    element.style.setProperty('--scroll-offset', `${(1 - amount) * 12}px`);
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
    document
      .querySelectorAll('.section-arriving')
      .forEach((section) => section.classList.remove('section-arriving'));
    if (navigationTarget !== document.body) {
      void navigationTarget.offsetWidth;
      navigationTarget.classList.add('section-arriving');
    }
    if (!navigationTarget.matches('a, button, input, [tabindex]'))
      navigationTarget.setAttribute('tabindex', '-1');
    navigationTarget.focus({ preventScroll: true });
  }
  navigationTarget = null;
  schedule();
}

function scrollToSection(target) {
  cancelAnimationFrame(expandFrame);
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
  const duration = Math.min(
    1600,
    Math.max(800, Math.abs(distance) * 0.16 + 800),
  );
  if (motion.matches || !duration || Math.abs(distance) < 2) {
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
        duration: 800,
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
      { duration: 800, easing: 'ease-out' },
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

const setupCards = document.querySelectorAll('.development-setup li');
function animateSetup() {
  if (motion.matches) return;
  if (window.gsap) gsap.killTweensOf(setupCards);
  setupCards.forEach((card, index) => {
    card.style.removeProperty('transform');
    card.style.removeProperty('opacity');
    card.classList.remove('effect-playing');
    card.style.setProperty('--effect-delay', `${index * 180}ms`);
    void card.offsetWidth;
    card.classList.add('effect-playing');
  });
}
if (window.ScrollTrigger) {
  ScrollTrigger.create({
    trigger: '.development-setup',
    start: 'top 85%',
    onEnter: animateSetup,
    onEnterBack: animateSetup,
  });
}
setupCards.forEach((card) => {
  card.addEventListener('animationend', () =>
    card.classList.remove('effect-playing'),
  );
  card.addEventListener('pointerenter', () => {
    if (motion.matches || !window.anime?.animate) return;
    anime.animate(card, { translateY: -5, duration: 550, ease: 'out(3)' });
  });
  card.addEventListener('pointerleave', () => {
    if (motion.matches || !window.anime?.animate) return;
    anime.animate(card, { translateY: 0, duration: 600, ease: 'out(3)' });
  });
});

// Expansion motion shares the same cancellable scroll frame.
let expandFrame = 0;

const contactZoomButtons = document.querySelectorAll(
  '.contact-actions .button',
);
function sizeContactZoom() {
  contactZoomButtons.forEach((button) => {
    if (!button.offsetWidth || !button.offsetHeight) return;
    button.style.setProperty(
      '--contact-zoom-x',
      String(1 + 5 / button.offsetWidth),
    );
    button.style.setProperty(
      '--contact-zoom-y',
      String(1 + 5 / button.offsetHeight),
    );
  });
}
sizeContactZoom();
window.addEventListener('resize', sizeContactZoom);

const cvDownload = document.querySelector('.cv-download');
cvDownload?.addEventListener('click', (event) => {
  if (cvDownload.dataset.ready === 'true') {
    delete cvDownload.dataset.ready;
    return;
  }
  event.preventDefault();
  if (cvDownload.classList.contains('cv-loading')) return;
  cvDownload.classList.add('cv-loading');
  cvDownload.setAttribute('aria-disabled', 'true');
  cvDownload.setAttribute('aria-live', 'polite');
  let remaining = 3;
  cvDownload.textContent = `Preparing CV · ${remaining}s`;
  const countdown = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      cvDownload.textContent = `Preparing CV · ${remaining}s`;
      return;
    }
    clearInterval(countdown);
    cvDownload.classList.remove('cv-loading');
    cvDownload.removeAttribute('aria-disabled');
    cvDownload.textContent = 'Download My CV';
    cvDownload.dataset.ready = 'true';
    cvDownload.click();
  }, 1000);
});

['wheel', 'touchstart'].forEach((type) =>
  window.addEventListener(type, () => cancelAnimationFrame(expandFrame), {
    passive: true,
  }),
);


// Animate both opacity and occupied space so closing never snaps the layout.
const expandingContainers = new WeakSet();
function animateExpansion(container, content, opening, finish) {
  if (expandingContainers.has(container)) return;
  cancelAnimationFrame(expandFrame);
  if (motion.matches) {
    finish();
    schedule();
    return;
  }
  expandingContainers.add(container);
  container.classList.add('expansion-smoothing');
  const measurements = content.map((element) => {
    const computed = getComputedStyle(element);
    const properties = {
      height: element.getBoundingClientRect().height,
      'padding-top': parseFloat(computed.paddingTop) || 0,
      'padding-bottom': parseFloat(computed.paddingBottom) || 0,
      'margin-top': parseFloat(computed.marginTop) || 0,
      'margin-bottom': parseFloat(computed.marginBottom) || 0,
      'border-top-width': parseFloat(computed.borderTopWidth) || 0,
      'border-bottom-width': parseFloat(computed.borderBottomWidth) || 0,
    };
    const names = [...Object.keys(properties), 'overflow', 'box-sizing', 'min-height', 'opacity', 'transition', 'animation', 'transform', 'translate'];
    const original = names.map((name) => [name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]);
    element.style.setProperty('box-sizing', 'border-box', 'important');
    element.style.setProperty('overflow', 'hidden', 'important');
    element.style.setProperty('min-height', '0', 'important');
    element.style.setProperty('transition', 'none', 'important');
    element.style.setProperty('animation', 'none', 'important');
    element.style.setProperty('transform', 'none', 'important');
    element.style.setProperty('translate', 'none', 'important');
    return { element, properties, original };
  });
  const render = (amount) => measurements.forEach(({ element, properties }) => {
    Object.entries(properties).forEach(([name, value]) =>
      element.style.setProperty(name, value * amount + 'px', 'important'),
    );
    element.style.setProperty('opacity', String(amount), 'important');
  });
  render(opening ? 0 : 1);
  const duration = opening ? 1100 : 1300;
  let began;
  const step = (now) => {
    if (began === undefined) began = now;
    const progress = motion.matches ? 1 : Math.min(1, (now - began) / duration);
    const eased = progress < 0.5
      ? 4 * progress ** 3
      : 1 - (-2 * progress + 2) ** 3 / 2;
    render(opening ? eased : 1 - eased);
    schedule();
    if (progress < 1) {
      requestAnimationFrame(step);
      return;
    }
    finish();
    measurements.forEach(({ element, original }) => original.forEach(([name, value, priority]) => {
      if (value) element.style.setProperty(name, value, priority);
      else element.style.removeProperty(name);
    }));
    container.classList.remove('expansion-smoothing');
    expandingContainers.delete(container);
    schedule();
  };
  requestAnimationFrame(step);
}

document.querySelectorAll('details > summary').forEach((summary) => {
  summary.addEventListener('click', (event) => {
    event.preventDefault();
    const detail = summary.parentElement;
    if (expandingContainers.has(detail)) return;
    const opening = !detail.open;
    if (opening) detail.open = true;
    const content = [...detail.children].filter((child) => child !== summary);
    animateExpansion(detail, content, opening, () => {
      detail.open = opening;
    });
  });
});

document.querySelectorAll('.code-example-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('li');
    if (expandingContainers.has(card)) return;
    const opening = button.getAttribute('aria-expanded') !== 'true';
    if (opening) {
      card.classList.add('example-open');
      button.setAttribute('aria-expanded', 'true');
    }
    animateExpansion(card, [card.querySelector('.package-example')], opening, () => {
      card.classList.toggle('example-open', opening);
      button.setAttribute('aria-expanded', String(opening));
    });
  });
});
