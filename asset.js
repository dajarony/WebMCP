import { registerAssetWebMCPTools } from './asset-webmcp.js';
import { registerSiteWebMCPTools } from './site-webmcp.js';
import { buildCapabilityTree } from './capability-tree.js';
import { DynamicWebMCPRegistry } from './dynamic-webmcp-registry.js';
import {
  ASSET_COMPONENT_IDS,
  createAssetDynamicWebMCPTools
} from './asset-dynamic-webmcp.js';

const COMPONENT_CONTEXT = Object.freeze({
  'condenser-fan': Object.freeze({
    id: 'condenser-fan',
    label: 'Condenser fan',
    status: 'Intermittent noise',
    telemetry: Object.freeze({
      running: true,
      noise: 'intermittent',
      obstructionObserved: false,
      housingTemperatureC: 37.4
    })
  }),
  compressor: Object.freeze({
    id: 'compressor',
    label: 'Compressor',
    status: 'Running',
    telemetry: Object.freeze({
      running: true,
      shortCyclingObserved: false,
      shellTemperatureC: 54.2,
      currentState: 'energized'
    })
  })
});

const TEST_PLANS = Object.freeze({
  'visual-check': Object.freeze([
    'Inspect the selected component for visible damage, loose fixings or obstruction.',
    'Compare the visible condition with the current asset context.',
    'Record observations in the shared inspection note before any further action.'
  ]),
  'sound-check': Object.freeze([
    'Observe the selected component while it is operating normally.',
    'Describe any intermittent, scraping, rattling or cycling sound without changing the equipment state.',
    'Record the observation and escalate any unsafe condition to the human operator.'
  ]),
  'temperature-check': Object.freeze([
    'Review the temperature telemetry already exposed by the page.',
    'Compare the reading with the component status and current case context.',
    'Prepare a note for the human operator; do not perform a physical intervention.'
  ])
});

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
  selectedComponent: null,
  componentTestPlan: [],
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
  tree: document.querySelector('#capability-tree-preview'),
  componentForm: document.querySelector('#component-selection-form'),
  componentSelector: document.querySelector('#component-selector'),
  componentStatus: document.querySelector('#selected-component-status'),
  dynamicTools: document.querySelector('#dynamic-tool-list'),
  componentTestPlan: document.querySelector('#component-test-plan')
};

let dynamicRegistry = null;

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

function renderComponentSurface() {
  const component = state.selectedComponent
    ? COMPONENT_CONTEXT[state.selectedComponent]
    : null;

  if (component) {
    els.componentSelector.value = component.id;
    els.componentStatus.textContent = component.label;
    els.componentStatus.className = 'status status-ready';
  } else {
    els.componentStatus.textContent = 'No component selected';
    els.componentStatus.className = 'status status-warn';
  }

  const dynamicNames = dynamicRegistry?.list() || [];
  els.dynamicTools.textContent = dynamicNames.length
    ? dynamicNames.join(' · ')
    : 'Select a component to expose contextual capabilities.';

  els.componentTestPlan.replaceChildren();
  if (!state.componentTestPlan.length) {
    const item = document.createElement('li');
    item.textContent = 'No component test prepared yet.';
    els.componentTestPlan.append(item);
    els.componentTestPlan.classList.add('empty-state');
    return;
  }

  els.componentTestPlan.classList.remove('empty-state');
  for (const step of state.componentTestPlan) {
    const item = document.createElement('li');
    item.textContent = step;
    els.componentTestPlan.append(item);
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

async function syncDynamicCapabilities() {
  if (!dynamicRegistry) {
    renderComponentSurface();
    return [];
  }

  const definitions = createAssetDynamicWebMCPTools(assetApi, state.selectedComponent);
  const names = await dynamicRegistry.sync(definitions);
  renderComponentSurface();
  await refreshCapabilityTree();
  return names;
}

const assetApi = {
  readAssetContext() {
    return {
      asset: { ...state.asset },
      selectedComponent: state.selectedComponent,
      inspectionFocus: state.inspectionFocus || null,
      preparedNote: state.preparedNote || null,
      componentTestPlan: [...state.componentTestPlan],
      contextualTools: dynamicRegistry?.list() || [],
      noteIsSaved: false
    };
  },

  async selectAssetComponent(component) {
    if (!ASSET_COMPONENT_IDS.includes(component)) {
      throw new Error(`Unknown asset component: ${component}`);
    }
    state.selectedComponent = component;
    state.componentTestPlan = [];
    const context = COMPONENT_CONTEXT[component];
    addHistory(`Shared component selected: ${context.label}. Contextual agent capabilities may now change.`);
    const contextualTools = await syncDynamicCapabilities();
    return {
      ok: true,
      component: context.id,
      label: context.label,
      contextualTools
    };
  },

  readSelectedComponent() {
    if (!state.selectedComponent) throw new Error('No asset component is selected.');
    const context = COMPONENT_CONTEXT[state.selectedComponent];
    return {
      component: context.id,
      label: context.label,
      status: context.status,
      telemetry: { ...context.telemetry }
    };
  },

  prepareComponentTest(test) {
    if (!state.selectedComponent) throw new Error('Select a component before preparing a component test.');
    const plan = TEST_PLANS[test];
    if (!plan) throw new Error(`Unsupported component test: ${test}`);
    state.componentTestPlan = [...plan];
    renderComponentSurface();
    const label = COMPONENT_CONTEXT[state.selectedComponent].label;
    addHistory(`Agent prepared ${test} for ${label}. No physical action was performed.`);
    return {
      ok: true,
      component: state.selectedComponent,
      test,
      steps: [...state.componentTestPlan],
      physicalActionPerformed: false
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

els.componentForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const component = els.componentSelector.value;
  if (!component) return;
  assetApi.selectAssetComponent(component).catch((error) => {
    console.error('Component selection failed', error);
  });
});

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
renderComponentSurface();

if ('modelContext' in document && document.modelContext) {
  try {
    await registerSiteWebMCPTools({
      getCapabilityTree: refreshCapabilityTree,
      navigate: (target) => globalThis.location.assign(target)
    });
    await registerAssetWebMCPTools(assetApi);
    dynamicRegistry = new DynamicWebMCPRegistry(document.modelContext);
    await syncDynamicCapabilities();

    const liveTools = await document.modelContext.getTools();
    els.webmcpStatus.textContent = `${liveTools.length} WebMCP tools ready`;
    els.webmcpStatus.className = 'status status-ready';
    addHistory('Global discovery tools and base Asset Inspector tools registered. Contextual tools are state-gated.');

    document.modelContext.addEventListener?.('toolchange', () => {
      refreshCapabilityTree().catch(() => {});
      renderComponentSurface();
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
