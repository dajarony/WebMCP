import { registerAssetWebMCPTools } from './asset-webmcp.js';
import { registerSiteWebMCPTools } from './site-webmcp.js';
import { buildCapabilityTree } from './capability-tree.js';
import { AssetWorkspaceState } from './asset-workspace.js';

const workspace = new AssetWorkspaceState();
const state = {
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
    els.webmcpStatus.textContent = `${tree.liveWebMCPTools.length} WebMCP tools live`;
    els.webmcpStatus.className = 'status status-ready';
    return tree;
  } catch (error) {
    console.error('Capability tree refresh failed', error);
    els.tree.textContent = `Capability tree unavailable: ${error.message}`;
    throw error;
  }
}

const assetApi = {
  readAssetContext() {
    return workspace.readAssetContext();
  },

  setInspectionFocus(focus) {
    const result = workspace.setInspectionFocus(focus);
    els.focus.textContent = result.focus;
    addHistory(`Agent set inspection focus: ${result.focus}`);
    return result;
  },

  prepareInspectionNote(note) {
    const result = workspace.prepareInspectionNote(note);
    els.note.value = result.draft;
    addHistory('Agent prepared an inspection note in the visible form. It has not been saved.');
    return result;
  }
};

els.note.addEventListener('input', () => {
  workspace.syncPreparedNote(els.note.value);
});

els.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const clean = els.note.value.trim();
  if (!clean) return;
  const result = workspace.saveInspectionNote(clean);
  addHistory(`Human saved inspection note locally: ${result.note.slice(0, 120)}${result.note.length > 120 ? '…' : ''}`);
});

els.form.addEventListener('reset', () => {
  queueMicrotask(() => {
    workspace.clearPreparedNote();
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

    addHistory('Global discovery and Asset Inspector WebMCP tools registered.');

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
