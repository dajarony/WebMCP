import test from 'node:test';
import assert from 'node:assert/strict';

import {
  currentPageDescriptor,
  publicSiteManifest,
  resolveCapabilityPage
} from '../site-capabilities.js';
import { composeCapabilityTree } from '../capability-tree.js';

test('resolves GitHub Pages style paths to the correct page', () => {
  assert.equal(currentPageDescriptor('/WebMCP/index.html').id, 'case-workspace');
  assert.equal(currentPageDescriptor('/WebMCP/asset.html').id, 'asset-inspector');
});

test('site manifest exposes stable global capabilities and both pages', () => {
  const manifest = publicSiteManifest('/WebMCP/index.html');
  assert.equal(manifest.globalCapabilities.length, 3);
  assert.deepEqual(manifest.pages.map((page) => page.id), ['case-workspace', 'asset-inspector']);
  assert.equal(manifest.currentPageId, 'case-workspace');
  assert.equal(manifest.pages.find((page) => page.id === 'asset-inspector').contextualCapabilities.length, 2);
});

test('capability tree distinguishes live global, page-local and contextual tools', () => {
  const tree = composeCapabilityTree({
    pathname: '/WebMCP/asset.html',
    skeleton: [
      {
        id: 'component-surface',
        kind: 'contextual-api',
        humanOnly: false,
        tools: ['select_asset_component', 'read_selected_component', 'prepare_component_test']
      }
    ],
    liveTools: [
      { name: 'describe_site_capabilities' },
      { name: 'read_page_capability_tree' },
      { name: 'navigate_to_capability_page' },
      { name: 'read_asset_context' },
      { name: 'select_asset_component' },
      { name: 'set_inspection_focus' },
      { name: 'prepare_inspection_note' },
      { name: 'read_selected_component' },
      { name: 'prepare_component_test' }
    ]
  });

  assert.equal(tree.currentPage.id, 'asset-inspector');
  assert.ok(tree.globalCapabilities.every((capability) => capability.live));
  assert.ok(tree.pageCapabilities.every((capability) => capability.live));
  assert.ok(tree.contextualCapabilities.every((capability) => capability.live));
  assert.deepEqual(tree.semanticSkeleton[0].liveTools, [
    'select_asset_component',
    'read_selected_component',
    'prepare_component_test'
  ]);
  assert.equal(tree.availablePages.find((page) => page.id === 'asset-inspector').current, true);
});

test('contextual capabilities are advertised but not live before activation', () => {
  const tree = composeCapabilityTree({
    pathname: '/WebMCP/asset.html',
    skeleton: [],
    liveTools: [
      { name: 'describe_site_capabilities' },
      { name: 'read_page_capability_tree' },
      { name: 'navigate_to_capability_page' },
      { name: 'read_asset_context' },
      { name: 'select_asset_component' },
      { name: 'set_inspection_focus' },
      { name: 'prepare_inspection_note' }
    ]
  });

  assert.ok(tree.pageCapabilities.every((capability) => capability.live));
  assert.ok(tree.contextualCapabilities.every((capability) => capability.live === false));
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

test('page ids resolve to safe declared navigation targets only', () => {
  assert.equal(resolveCapabilityPage('asset-inspector').href, './asset.html');
  assert.equal(resolveCapabilityPage('https://evil.example'), null);
});
