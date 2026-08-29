import test from 'node:test';
import assert from 'node:assert/strict';

import { DynamicWebMCPRegistry } from '../dynamic-webmcp-registry.js';
import { createAssetDynamicWebMCPTools } from '../asset-dynamic-webmcp.js';

function tool(name, description = name) {
  return {
    name,
    description,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => 'ok'
  };
}

test('dynamic registry publishes and withdraws WebMCP tools with AbortSignal', async () => {
  const registrations = [];
  const modelContext = {
    async registerTool(definition, options) {
      registrations.push({ definition, signal: options.signal });
    }
  };
  const registry = new DynamicWebMCPRegistry(modelContext);

  assert.deepEqual(await registry.sync([tool('alpha'), tool('beta')]), ['alpha', 'beta']);
  assert.equal(registrations.length, 2);
  assert.equal(registrations[0].signal.aborted, false);

  assert.deepEqual(await registry.sync([tool('beta')]), ['beta']);
  assert.equal(registrations[0].signal.aborted, true);
  assert.equal(registrations[1].signal.aborted, false);

  registry.clear();
  assert.equal(registrations[1].signal.aborted, true);
  assert.deepEqual(registry.list(), []);
});

test('asset page has no contextual tools before a component is selected', () => {
  assert.deepEqual(createAssetDynamicWebMCPTools({}, null), []);
});

test('asset page publishes component-specific capabilities after selection', () => {
  const assetApi = {
    readSelectedComponent: () => ({ component: 'condenser-fan' }),
    prepareComponentTest: (testName) => ({ testName })
  };
  const tools = createAssetDynamicWebMCPTools(assetApi, 'condenser-fan');
  assert.deepEqual(tools.map((item) => item.name), [
    'read_selected_component',
    'prepare_component_test'
  ]);
});

test('unknown component fails closed instead of publishing tools', () => {
  assert.throws(
    () => createAssetDynamicWebMCPTools({}, 'admin-panel'),
    /Unsupported asset component/
  );
});
