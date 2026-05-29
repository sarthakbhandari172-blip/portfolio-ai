/**
 * Portfolio AI — Main JavaScript
 * Author: Sarthak Bhandari
 *
 * Responsibilities:
 *  1. Sticky nav scroll effect
 *  2. Mobile nav toggle
 *  3. Active nav link highlighting (IntersectionObserver)
 *  4. Scroll-reveal animations
 *  5. Typed-text effect (hero)
 *  6. Smooth-scroll for anchor links
 */

'use strict';

/* ── Helpers ──────────────────────────────────────────────── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── 1. Sticky Nav ────────────────────────────────────────── */
(function initStickyNav() {
  const header = qs('#site-header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();

/* ── 2. Mobile Nav Toggle ─────────────────────────────────── */
(function initMobileNav() {
  const toggle = qs('#navToggle');
  const links  = qs('.nav__links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    links.classList.toggle('open', !expanded);
    document.body.style.overflow = expanded ? '' : 'hidden';
  });

  // Close menu when a link is clicked
  links.addEventListener('click', e => {
    if (e.target.matches('.nav__link')) {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && links.classList.contains('open')) {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
})();

/* ── 3. Active Nav Link ───────────────────────────────────── */
(function initActiveNav() {
  const sections = qsa('section[id]');
  const navLinks = qsa('.nav__link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === `#${id}`
          );
        });
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach(s => observer.observe(s));
})();

/* ── 4. Scroll-Reveal ─────────────────────────────────────── */
(function initReveal() {
  const reveals = qsa('.reveal');
  if (!reveals.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach(el => observer.observe(el));
  } else {
    // Fallback: show everything immediately
    reveals.forEach(el => el.classList.add('is-visible'));
  }
})();

/* ── 5. Typed Text Effect ─────────────────────────────────── */
(function initTyped() {
  const target = qs('[data-typed]');
  if (!target) return;

  const words   = JSON.parse(target.dataset.typed || '[]');
  const speed   = parseInt(target.dataset.typedSpeed  || '80',  10);
  const pause   = parseInt(target.dataset.typedPause  || '1800', 10);
  const erase   = parseInt(target.dataset.typedErase  || '40',  10);

  if (!words.length) return;

  let wordIdx  = 0;
  let charIdx  = 0;
  let deleting = false;

  function tick() {
    const word    = words[wordIdx % words.length];
    const current = word.slice(0, charIdx);
    target.textContent = current;

    let delay = deleting ? erase : speed;

    if (!deleting && charIdx === word.length) {
      delay    = pause;
      deleting = true;
    } else if (deleting && charIdx === 0) {
      deleting = false;
      wordIdx++;
      delay = 400;
    }

    charIdx += deleting ? -1 : 1;
    setTimeout(tick, delay);
  }

  tick();
})();
/* ── 6. Hero Particle Motion ───────────────────────────── */
(function initHeroParticles() {
  const panel = qs('.hero__panel');
  const container = qs('.hero__particles', panel);
  if (!panel || !container) return;

  const particles = [];
  const count = 18;
  let bounds = panel.getBoundingClientRect();

  const createParticles = () => {
    container.innerHTML = '';
    particles.length = 0;
    bounds = panel.getBoundingClientRect();
    const centerX = bounds.width * 0.5;
    const centerY = bounds.height * 0.45;
    const radius = Math.min(bounds.width, bounds.height) * 0.34;

    for (let i = 0; i < count; i += 1) {
      const el = document.createElement('span');
      el.className = 'hero__particle';
      const size = 2 + Math.random() * 4;
      const angle = Math.random() * Math.PI * 2;
      const spread = radius * (0.65 + Math.random() * 0.25);
      const x = centerX + Math.cos(angle) * spread + (Math.random() * 18 - 9);
      const y = centerY + Math.sin(angle) * spread + (Math.random() * 12 - 6);
      const speed = 12 + Math.random() * 6;
      const phase = Math.random() * Math.PI * 2;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.transform = `translate(${x}px, ${y}px) scale(${0.7 + size / 10})`;
      container.appendChild(el);
      particles.push({ el, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, phase, size });
    }
  };

  createParticles();
  window.addEventListener('resize', () => requestAnimationFrame(createParticles));

  let lastTime = performance.now();

  const update = (time) => {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    const t = time * 0.001;

    particles.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      if (particle.x < -24) particle.x = bounds.width + 24;
      if (particle.x > bounds.width + 24) particle.x = -24;
      if (particle.y < -24) particle.y = bounds.height + 24;
      if (particle.y > bounds.height + 24) particle.y = -24;
      const alpha = 0.16 + Math.sin(t * 1.25 + particle.phase) * 0.09;
      particle.el.style.transform = `translate(${particle.x}px, ${particle.y}px) scale(${0.8 + particle.size / 18})`;
      particle.el.style.opacity = `${Math.max(0, Math.min(1, alpha))}`;
    });
    requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
})();
(function initHeroPanelTilt() {
  const panel = qs('.hero__panel');
  if (!panel || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const state = {
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    active: false,
    pointerType: 'mouse',
  };
  const bounds = { left: 0, top: 0, width: 0, height: 0 };

  const getMaxTilt = () => (state.pointerType === 'touch' ? 9 : 16);

  const refreshBounds = () => {
    const rect = panel.getBoundingClientRect();
    bounds.left = rect.left;
    bounds.top = rect.top;
    bounds.width = rect.width;
    bounds.height = rect.height;
  };

  const normalize = (clientX, clientY) => {
    if (!bounds.width || !bounds.height) {
      return { x: 0, y: 0 };
    }
    const x = ((clientX - bounds.left) / bounds.width) * 2 - 1;
    const y = ((clientY - bounds.top) / bounds.height) * 2 - 1;
    return {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };
  };

  const setTarget = (clientX, clientY) => {
    const pos = normalize(clientX, clientY);
    state.targetX = pos.x;
    state.targetY = pos.y;
  };

  const resetTarget = () => {
    state.targetX = 0;
    state.targetY = 0;
  };

  const tick = () => {
    const ease = state.active ? 0.32 : 0.14;
    state.currentX += (state.targetX - state.currentX) * ease;
    state.currentY += (state.targetY - state.currentY) * ease;

    const maxTiltValue = getMaxTilt();
    const rx = -state.currentY * maxTiltValue * 0.72;
    const ry = state.currentX * maxTiltValue;
    panel.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
    panel.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    panel.style.setProperty('--mx', `${(state.currentX * 18).toFixed(2)}`);
    panel.style.setProperty('--my', `${(state.currentY * 14).toFixed(2)}`);
    panel.style.setProperty('--depth', `${(state.active ? 12 : 0).toFixed(2)}px`);
    panel.style.setProperty('--hero-ring-offset-x', `${(-ry * 0.3).toFixed(2)}px`);
    panel.style.setProperty('--hero-ring-offset-y', `${(-rx * 0.3).toFixed(2)}px`);
    panel.style.setProperty('--hero-glow-x', `${(state.currentX * 24).toFixed(2)}px`);
    panel.style.setProperty('--hero-glow-y', `${(state.currentY * 18).toFixed(2)}px`);

    requestAnimationFrame(tick);
  };

  const onPointerDown = (event) => {
    if (!['mouse', 'touch', 'pen'].includes(event.pointerType)) return;
    state.pointerType = event.pointerType;
    refreshBounds();
    panel.setPointerCapture?.(event.pointerId);
    panel.classList.add('hero__panel--dragging');
    state.active = true;
    setTarget(event.clientX, event.clientY);
    event.preventDefault();
  };

  const onPointerMove = (event) => {
    if (!state.active) return;
    setTarget(event.clientX, event.clientY);
  };

  const onPointerUp = (event) => {
    if (!state.active) return;
    state.active = false;
    panel.classList.remove('hero__panel--dragging');
    resetTarget();
    panel.releasePointerCapture?.(event.pointerId);
  };

  panel.addEventListener('pointerdown', onPointerDown, { passive: false });
  panel.addEventListener('pointermove', onPointerMove, { passive: false });
  panel.addEventListener('pointerup', onPointerUp);
  panel.addEventListener('pointercancel', onPointerUp);
  panel.addEventListener('pointerleave', () => {
    if (!state.active) {
      resetTarget();
    }
  });
  window.addEventListener('resize', refreshBounds, { passive: true });

  const portalButton = qs('#cta-enter-portal');
  if (portalButton) {
    portalButton.addEventListener('click', (event) => {
      event.preventDefault();
      const workSection = document.querySelector('#work');
      if (workSection) {
        workSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  refreshBounds();
  requestAnimationFrame(tick);
})();
/* ── 7. Background Canvas Field ───────────────────────────── */
(function initBackgroundCanvas() {
  const canvas = qs('.bg-canvas__field');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const stars = Array.from({ length: 44 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.6 + Math.random() * 1.2,
    phase: Math.random() * Math.PI * 2,
  }));
  const orbs = Array.from({ length: 8 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 18 + Math.random() * 24,
    speed: 0.02 + Math.random() * 0.04,
    angle: Math.random() * Math.PI * 2,
    color: Math.random() > 0.5 ? 'rgba(6,182,212,.18)' : 'rgba(124,58,237,.18)',
  }));
  const clouds = Array.from({ length: 4 }, (_, idx) => ({
    x: 0.18 + idx * 0.2 + Math.random() * 0.06,
    y: 0.18 + Math.random() * 0.32,
    r: 260 + Math.random() * 120,
    phase: Math.random() * Math.PI * 2,
    color: idx % 2 ? 'rgba(124,58,237,.12)' : 'rgba(6,182,212,.1)',
  }));

  let width = 0;
  let height = 0;
  const pointer = { x: 0.5, y: 0.5 };

  const resize = () => {
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('pointermove', (event) => {
    pointer.x = Math.min(1, Math.max(0, event.clientX / width));
    pointer.y = Math.min(1, Math.max(0, event.clientY / height));
  });

  const drawNebula = (t) => {
    clouds.forEach((cloud, index) => {
      const x = cloud.x * width + Math.cos(t * 0.08 + cloud.phase) * 32;
      const y = cloud.y * height + Math.sin(t * 0.1 + cloud.phase) * 22;
      const radius = cloud.r * (0.9 + 0.08 * Math.sin(t * 0.2 + cloud.phase));
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, cloud.color);
      grad.addColorStop(0.6, cloud.color.replace(/[^,]+\)$/,'0.04)'));
      grad.addColorStop(1, cloud.color.replace(/[^,]+\)$/,'0)'));
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  const drawOrbs = (t) => {
    orbs.forEach((orb, index) => {
      orb.angle += orb.speed * 0.08;
      const centerX = width * 0.52 + Math.cos(orb.angle + index) * 48;
      const centerY = height * 0.38 + Math.sin(orb.angle + index * 0.7) * 36;
      const radius = orb.r * (0.86 + 0.08 * Math.sin(t * 0.6 + index));
      ctx.save();
      ctx.shadowBlur = 28;
      ctx.shadowColor = orb.color;
      ctx.fillStyle = orb.color;
      ctx.globalAlpha = 0.45 + 0.12 * Math.sin(t * 0.77 + index);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  const drawStars = (t, moveX, moveY) => {
    stars.forEach((star, index) => {
      const x = ((star.x * width + Math.cos(t * 0.92 + star.phase) * 18 + moveX * 0.28) % width + width) % width;
      const y = ((star.y * height + Math.sin(t * 0.72 + star.phase) * 14 + moveY * 0.28) % height + height) % height;
      const radius = star.r * (0.72 + 0.2 * Math.sin(t * 1.4 + star.phase));
      ctx.globalAlpha = 0.18 + 0.25 * Math.sin(t * 1.22 + star.phase);
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  const drawGrid = (t, moveX, moveY) => {
    ctx.strokeStyle = 'rgba(124,58,237,0.08)';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    const gridSize = 72;
    const offsetX = (t * 3.5 + moveX * 0.28) % gridSize;
    const offsetY = (t * 2.9 + moveY * 0.22) % gridSize;
    for (let x = -gridSize; x < width + gridSize; x += gridSize) {
      ctx.moveTo(x + offsetX, 0);
      ctx.lineTo(x + offsetX, height);
    }
    for (let y = -gridSize; y < height + gridSize; y += gridSize) {
      ctx.moveTo(0, y + offsetY);
      ctx.lineTo(width, y + offsetY);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const draw = (time) => {
    const t = time * 0.001;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(4,6,15,0.88)';
    ctx.fillRect(0, 0, width, height);

    const moveX = (pointer.x - 0.5) * 36;
    const moveY = (pointer.y - 0.5) * 24;

    drawNebula(t);
    drawOrbs(t);
    drawStars(t, moveX, moveY);
    drawGrid(t, moveX, moveY);

    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
})();
/* ── 7. Custom Sci-Fi Cursor ─────────────────────────────── */
(function initCustomCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const body = document.body;
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  cursor.innerHTML = '<span class="cursor-dot"></span><span class="cursor-ring"></span>';
  body.appendChild(cursor);
  body.classList.add('custom-cursor-enabled');

  const dot = qs('.cursor-dot', cursor);
  const ring = qs('.cursor-ring', cursor);
  const interactive = qsa('.btn, .nav__link, .card, .social-node');

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  const setHoverState = (active) => {
    cursor.classList.toggle('custom-cursor--hover', active);
  };

  document.addEventListener('pointermove', (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    dot.style.left = `${targetX}px`;
    dot.style.top = `${targetY}px`;
  });

  interactive.forEach((element) => {
    element.addEventListener('pointerenter', () => setHoverState(true));
    element.addEventListener('pointerleave', () => setHoverState(false));
  });

  const animateCursor = () => {
    currentX += (targetX - currentX) * 0.28;
    currentY += (targetY - currentY) * 0.28;
    ring.style.left = `${currentX}px`;
    ring.style.top = `${currentY}px`;
    requestAnimationFrame(animateCursor);
  };

  requestAnimationFrame(animateCursor);
})();

/* ── 6. Smooth-scroll for hash links ─────────────────────── */
(function initSmoothScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    const navH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '70',
      10
    );
    const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  });
})();

/* ── 7. Console Branding ──────────────────────────────────── */
console.log(
  '%c⬡ Portfolio AI %c— Sarthak Bhandari',
  'background:#7c3aed;color:#fff;font-size:14px;font-weight:700;padding:4px 10px;border-radius:4px;',
  'color:#a0a0c0;font-size:12px;padding:4px 0;'
);
