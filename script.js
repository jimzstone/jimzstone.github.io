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
const desktopTiming = (normal, slower) =>
  matchMedia('(min-width: 701px) and (pointer: fine)').matches
    ? slower
    : normal;
const motion = matchMedia('(prefers-reduced-motion: reduce)');
if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
const sections = [...document.querySelectorAll('section[id]')];
const links = [...navigation.querySelectorAll('a')];
const animations = new Map();
const shown = new WeakSet();
const targets = [
  ...document.querySelectorAll(
    '.hero h1, .hero .intro, .hero .actions, .section h2, .section .eyebrow, .about-copy > p, .profile-label, .small-note, .section-heading > p, .project-info > h3, .project-info > p, .tool-card > div, .tool-group-heading, .skill-list > div, .credential-column article, .timeline-item > div, .contact > p, .contact-actions, .contact-card, .hire-intro > p, .hire-intro h2, .hire-reasons article',
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
  const desktopFade = matchMedia(
    '(min-width: 1001px) and (pointer: fine)',
  ).matches;
  const fadeZone = desktopFade
    ? Math.min(220, innerHeight * 0.26)
    : Math.min(110, innerHeight * 0.18);
  targets.forEach((element) => {
    if (!element.getClientRects().length) return;
    const rect = element.getBoundingClientRect();
    const entering = (innerHeight - rect.top) / fadeZone;
    const leaving = (rect.bottom - visibleTop) / fadeZone;
    const amount = element.matches(':focus-within')
      ? 1
      : Math.max(desktopFade ? 0 : 0.45, Math.min(1, entering, leaving));
    element.classList.add('scroll-fade');
    element.style.setProperty('--scroll-opacity', String(amount));
    element.style.setProperty(
      '--scroll-offset',
      `${(1 - amount) * (desktopFade ? 18 : 12)}px`,
    );
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
    desktopTiming(1300, 1600),
    Math.max(
      desktopTiming(650, 800),
      Math.abs(distance) * 0.18 + desktopTiming(650, 800),
    ),
  );
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
        duration: desktopTiming(450, 700),
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
      { duration: desktopTiming(450, 700), easing: 'ease-out' },
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
let setupRevealed = false;
function animateSetup() {
  if (motion.matches || setupRevealed) return;
  setupRevealed = true;
  setupCards.forEach((card, index) => {
    card.style.setProperty('--effect-delay', `${index * 80}ms`);
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
} else {
  const setupObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        animateSetup();
        setupObserver.disconnect();
      }
    },
    { threshold: 0.15 },
  );
  setupObserver.observe(document.querySelector('.development-setup'));
}
setupCards.forEach((card) => {
  card.addEventListener('animationend', (event) => {
    if (event.target === card) card.classList.remove('effect-playing');
  });
});
// Animate user-triggered expansion even when automatic motion is reduced.
let expandFrame = 0;
document.querySelectorAll('details').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    cancelAnimationFrame(expandFrame);
    detail.classList.remove('expansion-playing');
    if (!detail.open) return;
    if (navigating) stopNavigation();
    void detail.offsetWidth;
    detail.classList.add('expansion-playing');
    const rect = detail.getBoundingClientRect();
    const topGap = header.getBoundingClientRect().height + 24;
    const destination = Math.min(
      document.documentElement.scrollHeight - innerHeight,
      Math.max(0, scrollY + rect.top - topGap),
    );
    const start = scrollY;
    const distance = destination - start;
    // Avoid moving a disclosure whose heading is already visible.
    if (rect.top >= topGap && rect.top < innerHeight - 100) return;
    if (Math.abs(distance) < 24) return;
    const started = performance.now();
    const step = (now) => {
      if (!detail.open) return;
      const progress = Math.min(1, (now - started) / desktopTiming(1100, 1300));
      const ease =
        progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      window.scrollTo({ top: start + distance * ease, behavior: 'instant' });
      if (progress < 1) expandFrame = requestAnimationFrame(step);
    };
    expandFrame = requestAnimationFrame(step);
  });
});

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

document.querySelectorAll('.code-example-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(expanded));
    button.closest('li').classList.toggle('example-open', expanded);
  });
});

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

// Animate the disclosure's space as well as its contents, in both directions.
document.querySelectorAll('details > summary').forEach((summary) => {
  const detail = summary.parentElement;
  detail.classList.add('disclosure-motion');
  let busy = false;
  summary.addEventListener('click', (event) => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    cancelAnimationFrame(expandFrame);
    if (navigating) stopNavigation();
    const opening = !detail.open;
    if (opening) detail.open = true;
    const content = [...detail.children].filter((child) => child !== summary);
    const animations = content.map((child) => {
      const style = getComputedStyle(child);
      const expanded = {
        height: `${child.getBoundingClientRect().height}px`,
        opacity: 1,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        transform: 'translateY(0)',
      };
      const collapsed = {
        height: '0px',
        opacity: 0,
        marginTop: '0px',
        marginBottom: '0px',
        paddingTop: '0px',
        paddingBottom: '0px',
        transform: 'translateY(10px)',
      };
      child.style.overflow = 'hidden';
      return child.animate(
        opening ? [collapsed, expanded] : [expanded, collapsed],
        {
          duration: desktopTiming(opening ? 850 : 650, opening ? 1000 : 750),
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
        },
      );
    });
    Promise.all(
      animations.map((animation) => animation.finished.catch(() => {})),
    ).then(() => {
      if (!opening) detail.open = false;
      animations.forEach((animation) => animation.cancel());
      content.forEach((child) => child.style.removeProperty('overflow'));
      busy = false;
      schedule();
    });
  });
});

