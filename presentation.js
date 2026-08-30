/**
 * WebMCP Operator Workspace · presentation lifecycle
 *
 * Purpose: dismiss the visual introduction without altering any WebMCP
 * capability, shared case state, approval state, or page authority.
 */

const intro = document.querySelector('#intro-stage');
const enterButton = document.querySelector('#enter-workspace');
const introVideo = intro?.querySelector('video');

function dismissIntro() {
  if (!intro || intro.dataset.dismissed === 'true') return;
  intro.dataset.dismissed = 'true';
  globalThis.setTimeout(() => intro.remove(), 420);
}

enterButton?.addEventListener('click', dismissIntro);
introVideo?.addEventListener('ended', dismissIntro);
introVideo?.addEventListener('error', dismissIntro);

if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
  dismissIntro();
}
