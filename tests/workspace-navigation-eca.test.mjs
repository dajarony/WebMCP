import test from 'node:test';
import assert from 'node:assert/strict';
import { listWorkspacePages } from '../contratos/workspace-page-contracts.js';
import { ToolErrorCode } from '../contratos/tool-errors.js';
import { readPageTree } from '../logica/page-manifest.js';
import { registerWorkspaceNavigationTools } from '../entradas/workspace-navigation-registry.js';

function fakeModelContext(registered) {
  return { registerTool: async (tool) => registered.push(tool) };
}

test('ECA: global workspace catalog contains only declared same-origin local pages', () => {
  const pages = listWorkspacePages();
  assert.deepEqual(pages.map((page) => page.id), ['workspace_directory', 'operator_case']);
  for (const page of pages) {
    assert.match(page.path, /^\.\/[a-z-]+\.html$/);
    assert.equal(/[?#:]/.test(page.path), false);
  }
});

test('ECA: case tree exposes product regions, page tools and human-only controls', () => {
  const tree = readPageTree('operator_case');
  const boundary = tree.semanticTree.find((node) => node.id === 'approval-boundary');
  assert.deepEqual(boundary.humanControls, ['Approve', 'Reject']);
  assert.deepEqual(boundary.actions, ['request_sensitive_action', 'apply_approved_action']);
  assert.equal(tree.declaredTools.includes('approve_sensitive_action'), false);
  assert.equal(tree.forms.some((form) => form.id === 'sensitive-action-form' && form.humanApprovalRequired), true);
  assert.match(tree.scope, /not a raw DOM/i);
});

test('ECA: a declared page requests exactly its fixed local navigation path', async () => {
  const registered = [];
  const assignedPaths = [];
  await registerWorkspaceNavigationTools({
    pageId: 'workspace_directory',
    locationRef: { assign: (path) => assignedPaths.push(path) },
    modelContext: fakeModelContext(registered)
  });
  const openPage = registered.find((tool) => tool.name === 'open_workspace_page');
  const result = JSON.parse(await openPage.execute({ page_id: 'operator_case' }));

  assert.deepEqual(assignedPaths, ['./case.html']);
  assert.deepEqual(result, { ok: true, pageId: 'operator_case', path: './case.html', navigationRequested: true });
});

test('ECA: an invented page ID fails closed before the browser receives navigation', async () => {
  const registered = [];
  const assignedPaths = [];
  await registerWorkspaceNavigationTools({
    pageId: 'workspace_directory',
    locationRef: { assign: (path) => assignedPaths.push(path) },
    modelContext: fakeModelContext(registered)
  });
  const openPage = registered.find((tool) => tool.name === 'open_workspace_page');

  await assert.rejects(
    () => openPage.execute({ page_id: 'https://example.invalid/steal' }),
    (error) => error.code === ToolErrorCode.PAGE_NOT_FOUND
  );
  assert.deepEqual(assignedPaths, []);
});

test('ECA: every page receives exactly three global discovery and navigation tools', async () => {
  const registered = [];
  const names = await registerWorkspaceNavigationTools({
    pageId: 'operator_case',
    locationRef: { assign: () => {} },
    modelContext: fakeModelContext(registered)
  });

  assert.deepEqual(names, ['list_workspace_pages', 'read_page_tree', 'open_workspace_page']);
  assert.deepEqual(registered.map((tool) => tool.name), names);
});

test('ECA: current-page tree reports declared and actually observed WebMCP tools separately', async () => {
  const registered = [];
  const modelContext = {
    registerTool: async (tool) => registered.push(tool),
    getTools: async () => [...registered, { name: 'foreign_same_origin_tool' }]
  };
  await registerWorkspaceNavigationTools({
    pageId: 'operator_case',
    locationRef: { assign: () => {} },
    getRuntimeSurface: () => ({ capabilityRevision: 7, dynamicToolNames: ['read_selected_component'] }),
    modelContext
  });
  const readTree = registered.find((tool) => tool.name === 'read_page_tree');
  const result = JSON.parse(await readTree.execute({}));

  assert.equal(result.liveCapabilities.observation, 'observed');
  assert.equal(result.liveCapabilities.accessibleToolNames.includes('read_page_tree'), true);
  assert.deepEqual(result.liveCapabilities.unexpectedAccessibleToolNames, ['foreign_same_origin_tool']);
  assert.equal(result.runtimeSurface.capabilityRevision, 7);
});
