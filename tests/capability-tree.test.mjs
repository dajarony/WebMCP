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
});

test('capability tree distinguishes live global and page-local tools', () => {
  const tree = composeCapabilityTree({
    pathname: '/WebMCP/asset.html',
    skeleton: [
      { id: 'inspection-note-form', kind: 'review-form', humanOnly: false }
    ],
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

test('page ids resolve to safe declared navigation targets only', () => {
  assert.equal(resolveCapabilityPage('asset-inspector').href, './asset.html');
  assert.equal(resolveCapabilityPage('https://evil.example'), null);
});
