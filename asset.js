import { registerAssetWebMCPTools } from './asset-webmcp.js';
import { registerSiteWebMCPTools } from './site-webmcp.js';
import { buildCapabilityTree } from './capability-tree.js';

const state = {
  asset: {
    id: 'CR-02',
    name: 'Walk-in cold room CR-02',
    location: 'Isla Verde Hotel · Kitchen level',
    temperatureC: 8.0,
    condenserFan: 'Intermittent noise',
    compressor: 'Running'
  },
  inspectionFocus: '',
  preparedNote: '',
  history: [
    { at: Date.now(), text: 'Asset Inspector opened.' }
  ]
};

const els = {
  webmcpStatus: document.querySelector('#webmcp-status'),
  focus: document.querySelector('#inspection-focus'),
  form: document.querySelector('#inspection-note-form'),
  note: document.querySelector('#inspection-note'),
  history: document.querySelector('#asset-history-list'),
  tree: document.querySelector('#capability-tree-preview')
};

function nowLabel(timestamp = Date.now()) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(timestamp);
}

function addHistory(text) {
  state.history.unshift({ at: Date.now(), text });
  renderHistory();
}

function renderHistory() {
  els.history.replaceChildren();
  for (const entry of state.history) {
    const item = document.createElement('li');
    item.className = 'history-item';

    const time = document.createElement('span');
    time.className = 'history-time';
    time.textContent = nowLabel(entry.at);

    const text = document.createElement('span');
    text.className = 'history-text';
    text.textContent = entry.text;

    item.append(time, text);
    els.history.append(item);
  }
}

async function refreshCapabilityTree() {
  try {
    const tree = await buildCapabilityTree();
    els.tree.textContent = JSON.stringify(tree, null, 2);
    return tree;
  } catch (error) {
    console.error('Capability tree refresh failed', error);
    els.tree.textContent = `Capability tree unavailable: ${error.message}`;
    throw error;
  }
}

const assetApi = {
  readAssetContext() {
    return {
      asset: { ...state.asset },
      inspectionFocus: state.inspectionFocus || null,
      preparedNote: state.preparedNote || null,
      noteIsSaved: false
    };
  },

  setInspectionFocus(focus) {
    const clean = String(focus).trim().slice(0, 240);
    if (!clean) throw new Error('Inspection focus cannot be empty.');
    state.inspectionFocus = clean;
    els.focus.textContent = clean;
    addHistory(`Agent set inspection focus: ${clean}`);
    return { ok: true, focus: clean };
  },

  prepareInspectionNote(note) {
    const clean = String(note).trim().slice(0, 1200);
    if (!clean) throw new Error('Inspection note cannot be empty.');
    state.preparedNote = clean;
    els.note.value = clean;
    addHistory('Agent prepared an inspection note in the visible form. It has not been saved.');
    return { ok: true, draft: clean, saved: false };
  }
};

els.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const clean = els.note.value.trim();
  if (!clean) return;
  state.preparedNote = clean;
  addHistory(`Human saved inspection note locally: ${clean.slice(0, 120)}${clean.length > 120 ? '…' : ''}`);
});

els.form.addEventListener('reset', () => {
  queueMicrotask(() => {
    state.preparedNote = '';
    addHistory('Human cleared the inspection note form.');
  });
});

renderHistory();

if ('modelContext' in document && document.modelContext) {
  try {
    await registerSiteWebMCPTools({
      getCapabilityTree: refreshCapabilityTree,
      navigate: (target) => globalThis.location.assign(target)
    });
    await registerAssetWebMCPTools(assetApi);

    els.webmcpStatus.textContent = '6 WebMCP tools ready';
    els.webmcpStatus.className = 'status status-ready';
    addHistory('Global discovery tools and Asset Inspector tools registered.');

    document.modelContext.addEventListener?.('toolchange', () => {
      refreshCapabilityTree().catch(() => {});
    });
    await refreshCapabilityTree();
  } catch (error) {
    console.error('WebMCP registration failed', error);
    els.webmcpStatus.textContent = 'WebMCP registration failed';
  }
} else {
  els.webmcpStatus.textContent = 'WebMCP unavailable in this browser';
  els.tree.textContent = JSON.stringify({
    note: 'The human UI works, but native WebMCP is unavailable in this browser.'
  }, null, 2);
  addHistory('Page loaded without native WebMCP support.');
}
