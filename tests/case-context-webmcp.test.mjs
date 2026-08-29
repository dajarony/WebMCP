import test from 'node:test';
import assert from 'node:assert/strict';
import { CaseContextWebMCP } from '../case-context-webmcp.js';

class FakeModelContext {
  constructor() {
    this.tools = [];
    this.listeners = new Set();
  }

  async registerTool(tool, options = {}) {
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

  surface.clear();
  assert.equal(modelContext.tools.some(({ tool }) => tool.name === 'read_selected_component'), false);
  assert.equal(modelContext.tools.some(({ tool }) => tool.name === 'prepare_component_diagnostic'), false);
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
