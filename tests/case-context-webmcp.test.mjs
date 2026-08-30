import test from 'node:test';
import assert from 'node:assert/strict';
import { CaseContextWebMCP } from '../case-context-webmcp.js';

class FakeModelContext {
  constructor({ failTool = null } = {}) {
    this.tools = [];
    this.listeners = new Set();
    this.failTool = failTool;
  }

  async registerTool(tool, options = {}) {
    if (tool.name === this.failTool) throw new Error(`registration failed: ${tool.name}`);
    const entry = { tool };
    this.tools.push(entry);
    options.signal?.addEventListener('abort', () => {
      this.tools = this.tools.filter((candidate) => candidate !== entry);
      this.dispatchToolChange();
    }, { once: true });
    this.dispatchToolChange();
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

test('ECA: contextual case tools exist only after a declared component selection', async () => {
  const modelContext = new FakeModelContext();
  const surface = new CaseContextWebMCP({ modelContext });
  await surface.register();
  assert.deepEqual(modelContext.tools.map(({ tool }) => tool.name).sort(), [
    'clear_case_component_selection',
    'list_case_components',
    'select_case_component'
  ]);

  await surface.select('condenser_fan');
  assert.equal(modelContext.tools.some(({ tool }) => tool.name === 'read_selected_component'), true);
  assert.equal(modelContext.tools.some(({ tool }) => tool.name === 'prepare_component_diagnostic'), true);
  assert.equal(surface.snapshot().activationState, 'active');

  surface.clear();
  assert.equal(modelContext.tools.some(({ tool }) => tool.name === 'read_selected_component'), false);
  assert.equal(modelContext.tools.some(({ tool }) => tool.name === 'prepare_component_diagnostic'), false);
  assert.equal(surface.snapshot().activationState, 'inactive');
});

test('ECA: activation snapshots never announce both dynamic tools before both registrations finish', async () => {
  const snapshots = [];
  const modelContext = new FakeModelContext();
  const surface = new CaseContextWebMCP({
    modelContext,
    onChange: (snapshot) => snapshots.push(snapshot)
  });
  await surface.register();
  await surface.select('compressor');

  const activating = snapshots.filter((snapshot) => snapshot.activationState === 'activating');
  assert.ok(activating.some((snapshot) => snapshot.dynamicToolNames.length === 0));
  assert.ok(activating.some((snapshot) => snapshot.dynamicToolNames.length === 1));
  assert.equal(surface.snapshot().dynamicToolNames.length, 2);
});

test('ECA: failed contextual registration rolls back selection and authority', async () => {
  const modelContext = new FakeModelContext({ failTool: 'prepare_component_diagnostic' });
  const surface = new CaseContextWebMCP({ modelContext });
  await surface.register();

  await assert.rejects(() => surface.select('compressor'), /registration failed/);
  assert.equal(surface.snapshot().selectedComponent, null);
  assert.equal(surface.snapshot().activationState, 'inactive');
  assert.deepEqual(surface.snapshot().dynamicToolNames, []);
  assert.equal(modelContext.tools.some(({ tool }) => tool.name === 'read_selected_component'), false);
});

test('ECA: switching between declared components does not duplicate dynamic tools', async () => {
  const modelContext = new FakeModelContext();
  const surface = new CaseContextWebMCP({ modelContext });
  await surface.register();
  await surface.select('compressor');
  await surface.select('condenser_fan');

  const dynamic = modelContext.tools
    .map(({ tool }) => tool.name)
    .filter((name) => ['read_selected_component', 'prepare_component_diagnostic'].includes(name));
  assert.deepEqual(dynamic.sort(), ['prepare_component_diagnostic', 'read_selected_component']);
  assert.equal(surface.snapshot().selectedComponent.id, 'condenser_fan');
});

test('ECA: unknown component fails closed without adding authority', async () => {
  const modelContext = new FakeModelContext();
  const surface = new CaseContextWebMCP({ modelContext });
  await surface.register();

  await assert.rejects(() => surface.select('foreign_component'), /Unknown case component/);
  assert.equal(surface.snapshot().selectedComponent, null);
  assert.deepEqual(surface.snapshot().dynamicToolNames, []);
});

test('ECA: component diagnostic is bounded local state and is cleared with context', async () => {
  const modelContext = new FakeModelContext();
  const surface = new CaseContextWebMCP({ modelContext });
  await surface.register();
  await surface.select('compressor');
  const tool = modelContext.tools.find(({ tool: candidate }) => candidate.name === 'prepare_component_diagnostic').tool;
  const result = JSON.parse(await tool.execute({ observation: 'Confirm stable compressor current draw.' }));

  assert.equal(result.sent, false);
  assert.equal(surface.snapshot().diagnosticDraft.observation, 'Confirm stable compressor current draw.');
  surface.clear();
  assert.equal(surface.snapshot().diagnosticDraft, null);
});

test('ECA: component diagnostic enforces the runtime max length', async () => {
  const modelContext = new FakeModelContext();
  const surface = new CaseContextWebMCP({ modelContext });
  await surface.register();
  await surface.select('compressor');
  const tool = modelContext.tools.find(({ tool: candidate }) => candidate.name === 'prepare_component_diagnostic').tool;

  await assert.rejects(
    () => tool.execute({ observation: 'x'.repeat(1001) }),
    /cannot exceed 1000/
  );
  assert.equal(surface.snapshot().diagnosticDraft, null);
});

test('ECA: static contextual registration rolls back atomically on failure', async () => {
  const modelContext = new FakeModelContext({ failTool: 'select_case_component' });
  const surface = new CaseContextWebMCP({ modelContext });

  await assert.rejects(() => surface.register(), /registration failed/);
  assert.deepEqual(modelContext.tools.map(({ tool }) => tool.name), []);
});

test('ECA: clear during activation cannot leave phantom active contextual authority', async () => {
  let releaseSecond;
  class DelayedModelContext extends FakeModelContext {
    async registerTool(tool, options = {}) {
      if (tool.name === 'prepare_component_diagnostic') {
        await new Promise((resolve) => { releaseSecond = resolve; });
        if (options.signal?.aborted) throw options.signal.reason || new Error('registration aborted');
      }
      return super.registerTool(tool, options);
    }
  }

  const modelContext = new DelayedModelContext();
  const surface = new CaseContextWebMCP({ modelContext });
  await surface.register();
  const activation = surface.select('compressor');

  while (!releaseSecond) await new Promise((resolve) => setImmediate(resolve));
  surface.clear();
  releaseSecond();

  await assert.rejects(() => activation, /superseded|aborted/i);
  const snapshot = surface.snapshot();
  assert.equal(snapshot.activationState, 'inactive');
  assert.equal(snapshot.selectedComponent, null);
  assert.deepEqual(snapshot.dynamicToolNames, []);
  assert.equal(modelContext.tools.some(({ tool }) => tool.name === 'read_selected_component'), false);
  assert.equal(modelContext.tools.some(({ tool }) => tool.name === 'prepare_component_diagnostic'), false);
});
