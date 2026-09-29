import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../scripts.js', import.meta.url), 'utf8');
function setup(fetchImplementation) {
  function element() {
    const classes = new Set(), attributes = new Map(), handlers = new Map();
    return {
      style: {}, dataset: {}, textContent: '', disabled: false, handlers,
      classList: { add: key => classes.add(key), contains: key => classes.has(key), toggle: (key, on) => on ? classes.add(key) : classes.delete(key) },
      setAttribute: (key, value) => attributes.set(key, value), getAttribute: key => attributes.get(key), removeAttribute: key => attributes.delete(key),
      addEventListener: (name, callback) => handlers.set(name, callback), focus() { this.focused = true; },
    };
  }
  const ids = Object.fromEntries(['motion-toggle','main-nav','year','network-canvas','contactForm','formStatus','submitBtn'].map(id => [id, element()]));
  const menu = element(), root = element(), documentEvents = new Map();
  const fields = { name: { value: ' Alex ' }, email: { value: 'alex@example.com' }, subject: { value: 'Hello' }, message: { value: 'A project question.' } };
  const form = ids.contactForm;
  form.action = 'https://website-l85r.onrender.com/contact';
  form.reportValidity = () => true;
  form.elements = { namedItem: key => fields[key] };
  form.reset = () => { form.resetCalled = true; Object.values(fields).forEach(field => { field.value = ''; }); };
  ids['network-canvas'].getContext = () => null;
  ids['network-canvas'].getBoundingClientRect = () => ({ width: 400, height: 210 });
  vm.runInNewContext(source, {
    window: { matchMedia: () => ({ matches: true, addEventListener() {} }), addEventListener() {}, innerHeight: 900, scrollY: 0, devicePixelRatio: 1 },
    document: { documentElement: root, hidden: false, getElementById: id => ids[id], querySelector: selector => selector === '.menu-toggle' ? menu : element(), addEventListener: (name, fn) => documentEvents.set(name, fn) },
    fetch: fetchImplementation, AbortController, Date,
    setTimeout: () => 1, clearTimeout() {}, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  });
  return { ids, fields, form, menu, documentEvents, submit: () => form.handlers.get('submit')({ preventDefault() {} }) };
}

test('successful submission sends trimmed data and clears the form', async () => {
  let request;
  const env = setup(async (url, options) => { request = { url, options }; return { ok: true }; });
  await env.submit();
  assert.equal(request.url, env.form.action);
  assert.equal(JSON.parse(request.options.body).name, 'Alex');
  assert.equal(env.ids.formStatus.dataset.state, 'success');
  assert.equal(env.form.resetCalled, true);
  assert.equal(env.ids.submitBtn.disabled, false);
});
test('HTTP failure preserves input and provides direct-email fallback', async () => {
  const env = setup(async () => ({ ok: false }));
  await env.submit();
  assert.equal(env.form.resetCalled, undefined);
  assert.equal(env.fields.message.value, 'A project question.');
  assert.equal(env.ids.formStatus.dataset.state, 'error');
  assert.match(env.ids.formStatus.textContent, /louaydridi43@gmail.com/);
  assert.equal(env.ids.submitBtn.disabled, false);
});
test('timeout restores controls and retains the message', async () => {
  const env = setup(async () => { const error = new Error('timeout'); error.name = 'AbortError'; throw error; });
  await env.submit();
  assert.match(env.ids.formStatus.textContent, /took too long/);
  assert.equal(env.fields.message.value, 'A project question.');
  assert.equal(env.ids.submitBtn.disabled, false);
  assert.equal(env.form.getAttribute('aria-busy'), undefined);
});
test('duplicate submissions are ignored during an active request', async () => {
  let finish, requests = 0;
  const env = setup(() => { requests++; return new Promise(resolve => { finish = resolve; }); });
  const first = env.submit();
  await env.submit();
  assert.equal(requests, 1);
  finish({ ok: true }); await first;
});
test('whitespace-only content never reaches the contact service', async () => {
  let requests = 0;
  const env = setup(async () => { requests++; return { ok: true }; });
  env.fields.message.value = '   '; await env.submit();
  assert.equal(requests, 0); assert.equal(env.ids.formStatus.dataset.state, 'error');
});
test('Escape closes the menu, restores focus, and reduced motion starts paused', () => {
  const env = setup(async () => ({ ok: true }));
  env.menu.handlers.get('click')(); assert.equal(env.menu.getAttribute('aria-expanded'), 'true');
  env.documentEvents.get('keydown')({ key: 'Escape' });
  assert.equal(env.menu.getAttribute('aria-expanded'), 'false');
  assert.equal(env.menu.focused, true);
  assert.equal(env.ids['motion-toggle'].getAttribute('aria-pressed'), 'true');
});
