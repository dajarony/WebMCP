import test from 'node:test';
import assert from 'node:assert/strict';

import {
  currentPageDescriptor,
  publicSiteManifest,
  resolveCapabilityPage
} from '../site-capabilities.js';
import { buildCapabilityTree, composeCapabilityTree } from '../capability-tree.js';

test('resolves GitHub Pages style paths to the correct page', () => {
  assert.equal(currentPageDescriptor('/WebMCP/index.html').id, 'case-workspace');
  assert.equal(currentPageDescriptor('/WebMCP/asset.html').id, 'asset-inspector');
});

test('site manifest exposes stable global capabilities and both pages', () => {
  const manifest = publicSiteManifest('/WebMCP/index.html');
  assert.equal(manifest.globalCapabilities.length, 3);
  assert.deepEqual(manifest.pages.map((page) => page.id), ['case-workspace', 'asset-inspector']);
  assert.equal(manifest.currentPageId, 'case-workspace');
  assert.deepEqual(
    manifest.pages.find((page) => page.id === 'case-workspace').contextualCapabilities.map((item) => item.tool),
    ['read_selected_component', 'prepare_component_diagnostic']
  );
});

test('capability tree distinguishes live global and page-local tools', () => {
  const tree = composeCapabilityTree({
    pathname: '/WebMCP/asset.html',
    skeleton: [{ id: 'inspection-note-form', kind: 'review-form', humanOnly: false }],
    liveTools: [
      { name: 'describe_site_capabilities' },
      { name: 'read_page_capability_tree' },
      { name: 'navigate_to_capability_page' },
      { name: 'read_asset_context' },
      { name: 'set_inspection_focus' },
      { name: 'prepare_inspection_note' }
    ]
  });

  assert.equal(tree.currentPage.id, 'asset-inspector');
  assert.ok(tree.globalCapabilities.every((capability) => capability.live));
  assert.ok(tree.pageCapabilities.every((capability) => capability.live));
  assert.equal(tree.semanticSkeleton[0].id, 'inspection-note-form');
  assert.equal(tree.availablePages.find((page) => page.id === 'asset-inspector').current, true);
});

test('capability tree exposes missing advertised tools as not live', () => {
  const tree = composeCapabilityTree({
    pathname: '/WebMCP/index.html',
    skeleton: [],
    liveTools: [{ name: 'read_case_context' }]
  });

  assert.equal(tree.pageCapabilities.find((capability) => capability.tool === 'read_case_context').live, true);
  assert.equal(tree.pageCapabilities.find((capability) => capability.tool === 'create_work_plan').live, false);
  assert.equal(tree.globalCapabilities.find((capability) => capability.tool === 'describe_site_capabilities').live, false);
});

test('contextual contracts stay declared while inactive', () => {
  const tree = composeCapabilityTree({
    pathname: '/WebMCP/index.html',
    skeleton: [],
    liveTools: [{ name: 'read_case_context' }],
    contextSurface: {
      revision: 1,
      activationState: 'inactive',
      selectedComponent: null,
      dynamicToolNames: []
    }
  });

  assert.deepEqual(tree.contextualCapabilities.map((item) => item.tool), [
    'read_selected_component',
    'prepare_component_diagnostic'
  ]);
  assert.ok(tree.contextualCapabilities.every((item) => item.active === false && item.live === false));
  assert.equal(tree.declaredToolNames.includes('read_selected_component'), true);
});

test('capability tree preserves a bounded contextual surface separately from global authority', () => {
  const tree = composeCapabilityTree({
    pathname: '/WebMCP/index.html',
    skeleton: [],
    liveTools: [
      { name: 'read_case_context' },
      { name: 'read_selected_component' },
      { name: 'prepare_component_diagnostic' }
    ],
    contextSurface: {
      revision: 3,
      activationState: 'active',
      selectedComponent: { id: 'condenser_fan', label: 'Condenser fan' },
      dynamicToolNames: ['prepare_component_diagnostic', 'read_selected_component']
    }
  });

  assert.equal(tree.contextualSurface.selectedComponent.id, 'condenser_fan');
  assert.ok(tree.contextualCapabilities.every((item) => item.active && item.live));
  assert.equal(tree.globalCapabilities.some((capability) => capability.tool === 'read_selected_component'), false);
});

test('partially observed contextual registration is declared, not unexpected authority', () => {
  const tree = composeCapabilityTree({
    pathname: '/WebMCP/index.html',
    skeleton: [],
    liveTools: [{ name: 'read_selected_component' }],
    contextSurface: {
      revision: 2,
      activationState: 'activating',
      selectedComponent: { id: 'compressor', label: 'Compressor' },
      dynamicToolNames: []
    }
  });

  assert.deepEqual(tree.unexpectedObservedToolNames, []);
  assert.equal(tree.contextualCapabilities.find((item) => item.tool === 'read_selected_component').live, true);
  assert.equal(tree.contextualCapabilities.find((item) => item.tool === 'read_selected_component').active, false);
});

test('unexpected observed WebMCP tools remain informational rather than declared authority', () => {
  const tree = composeCapabilityTree({
    pathname: '/WebMCP/index.html',
    skeleton: [],
    liveTools: [{ name: 'read_case_context' }, { name: 'foreign_same_origin_tool' }]
  });

  assert.deepEqual(tree.unexpectedObservedToolNames, ['foreign_same_origin_tool']);
  assert.equal(tree.declaredToolNames.includes('foreign_same_origin_tool'), false);
  assert.match(tree.observationPolicy, /informational only/);
});

test('page ids resolve to safe declared navigation targets only', () => {
  assert.equal(resolveCapabilityPage('asset-inspector').href, './asset.html');
  assert.equal(resolveCapabilityPage('https://evil.example'), null);
});

test('live inspection failure keeps the declared capability tree available', async () => {
  const root = {
    querySelectorAll: () => [],
    modelContext: {
      getTools: async () => { throw new Error('browser inspection unavailable'); }
    }
  };

  const tree = await buildCapabilityTree({
    pathname: '/WebMCP/index.html',
    root,
    contextSurface: null
  });

  assert.equal(tree.observationStatus, 'unavailable');
  assert.match(tree.observationError, /browser inspection unavailable/);
  assert.deepEqual(tree.liveWebMCPTools, []);
  assert.equal(tree.declaredToolNames.includes('read_case_context'), true);
});

test('unknown file routes do not silently inherit Case Workspace authority', () => {
  assert.equal(currentPageDescriptor('/WebMCP/not-a-page.html'), null);
  const manifest = publicSiteManifest('/WebMCP/not-a-page.html');
  assert.equal(manifest.currentPageId, null);
  assert.throws(
    () => composeCapabilityTree({ pathname: '/WebMCP/not-a-page.html', skeleton: [], liveTools: [] }),
    /Unknown capability page path/
  );
});
