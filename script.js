'use strict';
let effectSettings = {
  reveal: { duration: 0.5, distance: 16, stagger: 0.035, maxDelay: 0.14 },
  navigation: { duration: 0.22 },
  pointer: { distance: 4 },
  scroll: {
    slowMobile: 1.4,
    slowDesktop: 1.65,
    fast: 0.28,
    speedThreshold: 2.5,
    edgeRatio: 0.28,
  },
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
    ) {
      const validNumber = (value, min, max, fallback) =>
        Number.isFinite(value) && value >= min && value <= max
          ? value
          : fallback;
      effectSettings.pointer.distance = settings.pointer.distance;
      effectSettings.navigation.duration = validNumber(
        settings.navigation?.duration,
        0.1,
        1,
        0.22,
      );
      const bounds = {
        slowMobile: [0.5, 3],
        slowDesktop: [0.5, 3],
        fast: [0.15, 0.5],
        speedThreshold: [0.5, 10],
        edgeRatio: [0.1, 0.35],
      };
      Object.entries(bounds).forEach(([key, [min, max]]) => {
        effectSettings.scroll[key] = validNumber(
          settings.scroll?.[key],
          min,
          max,
          effectSettings.scroll[key],
        );
      });
      schedule();
    }
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
const targets = [
  ...document.querySelectorAll(
    '.hero h1, .hero .intro, .hero .actions, .section h2, .section .eyebrow, .about-copy > p, .profile-label, .small-note, .section-heading > p, .project-info > h3, .project-info > p, .tool-card > div, .tool-group-heading, .skill-list > div, .credential-column article, .timeline-item > div, .contact > p, .contact-actions, .contact-card, .hire-intro > p, .hire-intro h2, .hire-reasons article, .interests-heading, .hobby-card, .favorite-games',
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

let lastScrollPosition = scrollY;
let lastScrollTime = performance.now();
let scrollSpeed = 0;
let scrollSettleTimer;
function update() {
  framePending = false;
  const now = performance.now();
  const elapsed = Math.max(16, now - lastScrollTime);
  const travel = Math.abs(scrollY - lastScrollPosition);
  const measuredSpeed = travel / elapsed;
  scrollSpeed =
    elapsed > 200 ? measuredSpeed : scrollSpeed * 0.65 + measuredSpeed * 0.35;
  const speedFactor = Math.min(
    1,
    scrollSpeed / effectSettings.scroll.speedThreshold,
  );
  const slowDuration =
    innerWidth > 1000
      ? effectSettings.scroll.slowDesktop
      : effectSettings.scroll.slowMobile;
  const fadeDuration =
    slowDuration + (effectSettings.scroll.fast - slowDuration) * speedFactor;
  document.documentElement.style.setProperty(
    '--scroll-fade-duration',
    fadeDuration.toFixed(2) + 's',
  );
  document.documentElement.style.setProperty(
    '--scroll-move-duration',
    Math.max(0.3, fadeDuration * 0.9).toFixed(2) + 's',
  );
  lastScrollPosition = scrollY;
  lastScrollTime = now;
  if (travel > 0) {
    clearTimeout(scrollSettleTimer);
    scrollSettleTimer = setTimeout(() => {
      scrollSpeed = 0;
      schedule();
    }, 180);
  }
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
  const availableHeight = Math.max(200, innerHeight - visibleTop);
  const motionZone = Math.min(
    220,
    availableHeight * effectSettings.scroll.edgeRatio,
  );
  const distance = innerWidth <= 700 ? 8 : innerWidth <= 1000 ? 12 : 16;
  const measurements = targets
    .filter((element) => element.getClientRects().length)
    .map((element) => ({
      element,
      rect: element.getBoundingClientRect(),
      shift:
        Number.parseFloat(getComputedStyle(element).translate.split(' ')[1]) ||
        0,
    }));
  measurements.forEach(({ element, rect, shift }) => {
    // Measure before writing and subtract the currently rendered shift.
    const top = rect.top - shift;
    const bottom = rect.bottom - shift;
    const enter = Math.max(
      0,
      Math.min(1, (top - (innerHeight - motionZone)) / motionZone),
    );
    const leave = Math.max(
      0,
      Math.min(1, (visibleTop + motionZone - bottom) / motionZone),
    );
    const offset =
      motion.matches || element.matches(':focus-within')
        ? 0
        : enter * distance - leave * distance * 0.35;
    element.classList.add('scroll-fade');
    const opacity = element.matches(':focus-within')
      ? 1
      : 1 - Math.max(enter, leave);
    element.style.setProperty('--scroll-opacity', opacity.toFixed(3));
    element.style.setProperty('--scroll-offset', `${offset.toFixed(2)}px`);
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

document.querySelectorAll('.code-example-toggle').forEach((button, index) => {
  const panel = button.closest('li').querySelector('.package-example');
  panel.id = 'code-example-' + index;
  button.setAttribute('aria-controls', panel.id);
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    button
      .closest('li')
      .style.setProperty('--example-height', panel.scrollHeight + 32 + 'px');
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

// One reversible controller owns each disclosure; rapid clicks change its target.
document.querySelectorAll('details > summary').forEach((summary) => {
  const detail = summary.parentElement;
  detail.classList.add('disclosure-motion');
  const content = [...detail.children].filter((child) => child !== summary);
  let desiredOpen = detail.open;
  let generation = 0;
  let running = [];
  summary.addEventListener('click', (event) => {
    event.preventDefault();
    if (navigating) stopNavigation();
    desiredOpen = !desiredOpen;
    const currentGeneration = ++generation;
    const wasOpen = detail.open;
    const current = content.map((child) => {
      const style = getComputedStyle(child);
      return {
        height: `${child.getBoundingClientRect().height}px`,
        opacity: style.opacity,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        transform: style.transform,
      };
    });
    running.forEach((animation) => animation.cancel());
    detail.open = true;
    const collapsed = {
      height: '0px',
      opacity: 0,
      marginTop: '0px',
      marginBottom: '0px',
      paddingTop: '0px',
      paddingBottom: '0px',
      transform: motion.matches ? 'none' : 'translateY(8px)',
    };
    const expanded = content.map((child) => {
      const style = getComputedStyle(child);
      return {
        height: `${child.getBoundingClientRect().height}px`,
        opacity: 1,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        transform: 'none',
      };
    });
    running = content.map((child, index) => {
      child.style.overflow = 'hidden';
      return child.animate(
        [
          wasOpen ? current[index] : collapsed,
          desiredOpen ? expanded[index] : collapsed,
        ],
        {
          duration: desktopTiming(
            desiredOpen ? 850 : 650,
            desiredOpen ? 1000 : 750,
          ),
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
        },
      );
    });
    Promise.all(
      running.map((animation) => animation.finished.catch(() => {})),
    ).then(() => {
      if (currentGeneration !== generation) return;
      detail.open = desiredOpen;
      running.forEach((animation) => animation.cancel());
      running = [];
      content.forEach((child) => child.style.removeProperty('overflow'));
      schedule();
    });
  });
});

