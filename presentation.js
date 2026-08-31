/**
 * WebMCP Operator Workspace · presentation lifecycle
 *
 * Purpose: dismiss the visual introduction only after an explicit human
 * decision, without altering any WebMCP capability, shared case state,
 * approval state, or page authority.
 */

const intro = document.querySelector('#intro-stage');
const enterButton = document.querySelector('#enter-workspace');

function dismissIntro() {
  if (!intro || intro.dataset.dismissed === 'true') return;
  intro.dataset.dismissed = 'true';
  globalThis.setTimeout(() => intro.remove(), 420);
}

enterButton?.addEventListener('click', dismissIntro);
