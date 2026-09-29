/* Progressive enhancement; the architecture animation is an explanatory schematic. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = reducedMotion.matches;
  const motionButton = document.getElementById('motion-toggle');
  const root = document.documentElement;
  const nav = document.getElementById('main-nav');
  const menuButton = document.querySelector('.menu-toggle');
  function setMenu(open, restoreFocus = false) {
    nav.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    if (restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false, true); });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) setMenu(false); });
  window.matchMedia('(min-width: 601px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

  if ('IntersectionObserver' in window) {
    root.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const sectionObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) links.forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
    links.forEach(link => { const section = document.querySelector(link.hash); if (section) sectionObserver.observe(section); });
  }
  const progress = document.querySelector('.reading-progress');
  let progressPending = false;
  function updateProgress() {
    const distance = root.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0})`;
    progressPending = false;
  }
  window.addEventListener('scroll', () => { if (!progressPending) { progressPending = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress(); document.getElementById('year').textContent = String(new Date().getFullYear());

  const canvas = document.getElementById('network-canvas'), ctx = canvas.getContext('2d');
  let width = 0, height = 0, frame = null, stageVisible = true, lastDraw = 0;
  const counts = [7, 6, 5, 4]; // Representative nodes; actual sizes are in the HTML labels.
  const position = (layer, node) => ({ x: width * (.1 + layer * .8 / 3), y: height * (.14 + node * .72 / (counts[layer] - 1)) });
  function drawNetwork(time = 0) {
    if (!ctx || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const phase = motionPaused ? .43 : (time % 4800) / 4800;
    for (let layer = 0; layer < counts.length - 1; layer++) {
      for (let i = 0; i < counts[layer]; i++) for (let j = 0; j < counts[layer + 1]; j++) {
        const start = position(layer, i), end = position(layer + 1, j);
        ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = (i + j) % 3 === 0 ? '#637c424d' : '#4054323d'; ctx.lineWidth = .8; ctx.stroke();
        const local = phase * 3.9 - layer;
        if ((i + j) % 4 === 0 && local > 0 && local < 1) {
          ctx.beginPath(); ctx.arc(start.x + (end.x - start.x) * local, start.y + (end.y - start.y) * local, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#c3f56b'; ctx.fill();
        }
      }
    }
    counts.forEach((count, layer) => {
      for (let i = 0; i < count; i++) {
        const p = position(layer, i), active = Math.abs(phase * 3.9 - layer) < .42;
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fillStyle = active ? '#c3f56b' : '#202d1b'; ctx.fill();
        ctx.strokeStyle = active ? '#dbffab' : '#87a866'; ctx.lineWidth = 1; ctx.stroke();
      }
    });
  }
  function animate(time) {
    frame = null;
    if (motionPaused || document.hidden || !stageVisible || !ctx) return;
    if (time - lastDraw >= 1000 / 30) { drawNetwork(time); lastDraw = time; }
    frame = requestAnimationFrame(animate);
  }
  function syncAnimation() {
    if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
    drawNetwork();
    if (!motionPaused && !document.hidden && stageVisible && ctx) frame = requestAnimationFrame(animate);
  }
  function resizeCanvas() {
    const rectangle = canvas.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rectangle.width; height = rectangle.height;
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    syncAnimation();
  }
  function setMotion(paused) {
    motionPaused = paused; root.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Resume animations' : 'Pause animations');
    motionButton.textContent = paused ? 'Resume motion ▷' : 'Pause motion Ⅱ'; syncAnimation();
  }
  motionButton.addEventListener('click', () => setMotion(!motionPaused));
  reducedMotion.addEventListener('change', event => setMotion(event.matches));
  document.addEventListener('visibilitychange', syncAnimation);
  if ('ResizeObserver' in window) new ResizeObserver(resizeCanvas).observe(canvas);
  else window.addEventListener('resize', resizeCanvas);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { stageVisible = entries[0].isIntersecting; syncAnimation(); }).observe(canvas);
  resizeCanvas(); setMotion(motionPaused);

  // Keep the existing Render endpoint and retain visitor input on failure.
  const form = document.getElementById('contactForm'), status = document.getElementById('formStatus'), button = document.getElementById('submitBtn');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    const data = Object.fromEntries(['name', 'email', 'subject', 'message'].map(key => [key, form.elements.namedItem(key).value.trim()]));
    if (Object.values(data).some(value => !value)) { status.dataset.state = 'error'; status.textContent = 'Please complete every field before sending.'; return; }
    button.disabled = true; button.textContent = 'Sending…'; form.setAttribute('aria-busy', 'true');
    status.dataset.state = 'pending'; status.textContent = 'Sending your message. The contact service may take a moment to wake up.';
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: controller.signal });
      if (!response.ok) throw new Error('Contact service did not accept the message');
      status.dataset.state = 'success'; status.textContent = 'Your message was sent. Thanks for reaching out!'; form.reset();
    } catch (error) {
      status.dataset.state = 'error'; status.textContent = error.name === 'AbortError'
        ? 'The contact service took too long. Your message is still here—please retry or email louaydridi43@gmail.com directly.'
        : 'Your message could not be sent. Please try again or email louaydridi43@gmail.com directly.';
    } finally {
      clearTimeout(timeout); button.disabled = false; button.innerHTML = 'Send message <span aria-hidden="true">↗</span>'; form.removeAttribute('aria-busy');
    }
  });
})();
