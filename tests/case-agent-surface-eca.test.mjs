import test from 'node:test';
import assert from 'node:assert/strict';
import { CaseAgentSurfaceRegistry } from '../entradas/case-agent-surface-registry.js';
import { ToolErrorCode } from '../contratos/tool-errors.js';
import { inspectLiveCapabilities } from '../logica/live-capability-inspector.js';
import { readPageTree } from '../logica/page-manifest.js';
import { ComponentSurfaceRenderer } from '../salidas/component-surface-renderer.js';

class FakeModelContext {
  constructor() {
    this.tools = [];
    this.listeners = new Set();
  }

  async registerTool(tool, options = {}) {
    const entry = { tool, signal: options.signal ?? null };
    this.tools.push(entry);
    options.signal?.addEventListener('abort', () => {
      this.tools = this.tools.filter((candidate) => candidate !== entry);
      this.dispatchToolChange();
    }, { once: true });
    this.dispatchToolChange();
  }

  async getTools() {
    return this.tools.map((entry) => entry.tool);
  }

  addEventListener(event, listener) {
    if (event === 'toolchange') this.listeners.add(listener);
  }

  removeEventListener(event, listener) {
    if (event === 'toolchange') this.listeners.delete(listener);
  }

  dispatchToolChange() {
    for (const listener of this.listeners) listener();
  }
}

test('ECA: component renderer constructs with the browser document default and renders a safe empty context', () => {
  const elements = {
    '#component-selection': {},
    '#component-diagnostic': {},
    '#component-capabilities': {}
  };
  const renderer = new ComponentSurfaceRenderer({
    documentRef: { querySelector: (selector) => elements[selector] }
  });
  renderer.render({
    component: { selectedComponent: null, diagnosticDraft: null },
    runtimeSurface: { capabilityRevision: 0, dynamicToolNames: [] }
  });

  assert.match(elements['#component-selection'].textContent, /No component selected/);
  assert.match(elements['#component-diagnostic'].textContent, /No component diagnostic/);
  assert.match(elements['#component-capabilities'].textContent, /revision 0/);
});

test('ECA: contextual tools appear only after a declared component is selected and disappear on clear', async () => {
  const modelContext = new FakeModelContext();
  const registry = new CaseAgentSurfaceRegistry({ modelContext });
  await registry.register();
  assert.deepEqual((await modelContext.getTools()).map((tool) => tool.name).sort(), [
    'clear_case_component_selection',
    'list_case_components',
    'select_case_component'
  ]);

  await registry.selectComponent('condenser_fan');
  assert.equal((await modelContext.getTools()).some((tool) => tool.name === 'read_selected_component'), true);
  assert.equal((await modelContext.getTools()).some((tool) => tool.name === 'prepare_component_diagnostic'), true);

  await registry.clearComponent();
  assert.equal((await modelContext.getTools()).some((tool) => tool.name === 'read_selected_component'), false);
  assert.equal((await modelContext.getTools()).some((tool) => tool.name === 'prepare_component_diagnostic'), false);
});

test('ECA: invalid component cannot alter dynamic tools or prior component state', async () => {
  const modelContext = new FakeModelContext();
  const registry = new CaseAgentSurfaceRegistry({ modelContext });
  await registry.register();
  await registry.selectComponent('compressor');
  const before = registry.runtimeSurface();

  await assert.rejects(
    () => registry.selectComponent('not-a-component'),
    (error) => error.code === ToolErrorCode.COMPONENT_NOT_FOUND
  );
  assert.deepEqual(registry.runtimeSurface().selectedComponent, before.selectedComponent);
  assert.deepEqual(registry.runtimeSurface().dynamicToolNames, before.dynamicToolNames);
});

test('ECA: dynamic diagnostic is local, bounded and removed with component context', async () => {
  const modelContext = new FakeModelContext();
  const registry = new CaseAgentSurfaceRegistry({ modelContext });
  await registry.register();
  await registry.selectComponent('condenser_fan');
  const diagnosticTool = (await modelContext.getTools()).find((tool) => tool.name === 'prepare_component_diagnostic');
  const result = JSON.parse(await diagnosticTool.execute({ observation: 'Inspect fan current draw and visible obstruction.' }));

  assert.equal(result.diagnosticDraft.sent, false);
  assert.equal(registry.componentSnapshot().diagnosticDraft.observation, 'Inspect fan current draw and visible obstruction.');
  await registry.clearComponent();
  assert.equal(registry.componentSnapshot().diagnosticDraft, null);
});

test('ECA: live inspector distinguishes observed capabilities from declared surface without granting unknown tools', async () => {
  const observed = await inspectLiveCapabilities({
    modelContext: { getTools: async () => [{ name: 'known' }, { name: 'foreign' }, { name: 'known' }] },
    declaredToolNames: ['known'],
    runtimeSurface: { capabilityRevision: 4 }
  });

  assert.equal(observed.observation, 'observed');
  assert.deepEqual(observed.accessibleToolNames, ['foreign', 'known']);
  assert.deepEqual(observed.unexpectedAccessibleToolNames, ['foreign']);
  assert.equal(observed.runtimeSurface.capabilityRevision, 4);
});

test('ECA: a WebMCP toolchange raises only the capability revision', async () => {
  const modelContext = new FakeModelContext();
  const registry = new CaseAgentSurfaceRegistry({ modelContext });
  await registry.register();
  await registry.selectComponent('compressor');
  const before = registry.runtimeSurface();

  modelContext.dispatchToolChange();
  const after = registry.runtimeSurface();

  assert.equal(after.capabilityRevision > before.capabilityRevision, true);
  assert.deepEqual(after.selectedComponent, before.selectedComponent);
  assert.deepEqual(after.dynamicToolNames, before.dynamicToolNames);
});

test('ECA: changing the selected component advances revision even when dynamic tool names stay the same', async () => {
  const modelContext = new FakeModelContext();
  const registry = new CaseAgentSurfaceRegistry({ modelContext });
  await registry.register();
  await registry.selectComponent('compressor');
  const before = registry.runtimeSurface();

  await registry.selectComponent('condenser_fan');
  const after = registry.runtimeSurface();

  assert.equal(after.capabilityRevision > before.capabilityRevision, true);
  assert.equal(after.selectedComponent.id, 'condenser_fan');
  assert.deepEqual(after.dynamicToolNames, before.dynamicToolNames);
});

test('ECA: failed live inspection is explicit and does not fabricate accessible tools', async () => {
  const observed = await inspectLiveCapabilities({
    modelContext: { getTools: async () => { throw new Error('browser unavailable'); } },
    declaredToolNames: ['known'],
    runtimeSurface: { capabilityRevision: 2 }
  });

  assert.equal(observed.observation, 'unavailable');
  assert.deepEqual(observed.accessibleToolNames, []);
  assert.deepEqual(observed.declaredToolNames, ['known']);
});

test('ECA: tree adds contextual form only with active component and never adds human approval tool', () => {
  const before = readPageTree('operator_case');
  const after = readPageTree('operator_case', {
    capabilityRevision: 8,
    selectedComponent: { id: 'compressor', label: 'Compressor', summary: 'Running.' },
    dynamicToolNames: ['read_selected_component', 'prepare_component_diagnostic']
  });

  assert.equal(before.forms.some((form) => form.id === 'component-diagnostic-form'), false);
  assert.equal(after.forms.some((form) => form.id === 'component-diagnostic-form'), true);
  assert.equal(after.declaredTools.includes('approve_sensitive_action'), false);
  assert.equal(after.runtimeSurface.capabilityRevision, 8);
});
