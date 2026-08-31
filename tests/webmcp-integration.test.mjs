import test from 'node:test';
import assert from 'node:assert/strict';

import { registerSiteWebMCPTools } from '../site-webmcp.js';
import { registerWebMCPTools } from '../webmcp.js';
import { registerAssetWebMCPTools } from '../asset-webmcp.js';
import { CaseContextWebMCP } from '../case-context-webmcp.js';

class FakeModelContext {
  constructor({ failTool = null } = {}) {
    this.entries = [];
    this.listeners = new Set();
    this.failTool = failTool;
  }

  async registerTool(tool, options = {}) {
    if (tool.name === this.failTool) throw new Error(`registration failed: ${tool.name}`);
    const entry = { tool };
    this.entries.push(entry);
    options.signal?.addEventListener('abort', () => {
      this.entries = this.entries.filter((candidate) => candidate !== entry);
      this.dispatchToolChange();
    }, { once: true });
    this.dispatchToolChange();
  }

  async getTools() {
    return this.entries.map(({ tool }) => tool);
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

  tool(name) {
    return this.entries.find(({ tool }) => tool.name === name)?.tool || null;
  }
}

const operatorApi = {
  readCaseContext: () => ({ case: { id: 'SRV-2047' } }),
  createWorkPlan: (steps) => ({ ok: true, steps }),
  prepareCustomerUpdate: (message) => ({ ok: true, draft: message, sent: false }),
  requestSensitiveAction: (action, reason) => ({ ok: true, action, reason, status: 'pending' }),
  applyApprovedAction: (proposalId) => ({ ok: true, proposal_id: proposalId })
};

const assetApi = {
  readAssetContext: () => ({ asset: { id: 'CR-02' } }),
  setInspectionFocus: (focus) => ({ ok: true, focus }),
  prepareInspectionNote: (note) => ({ ok: true, draft: note, saved: false })
};

async function registerGlobal(modelContext, baseHref, navigate = () => {}) {
  return registerSiteWebMCPTools({
    getCapabilityTree: async () => ({ ok: true }),
    navigate,
    modelContext,
    baseHref
  });
}

test('E2E contract: Case Workspace moves 11 → 13 → 11 tools, then Asset Inspector exposes 6', async () => {
  const caseModel = new FakeModelContext();
  await registerGlobal(caseModel, 'https://example.test/WebMCP/index.html');
  await registerWebMCPTools(operatorApi, caseModel);
  const context = new CaseContextWebMCP({ modelContext: caseModel });
  await context.register();

  assert.equal((await caseModel.getTools()).length, 11);

  await caseModel.tool('select_case_component').execute({ component_id: 'condenser_fan' });
  assert.equal((await caseModel.getTools()).length, 13);
  assert.deepEqual(context.snapshot().dynamicToolNames, [
    'prepare_component_diagnostic',
    'read_selected_component'
  ]);

  await caseModel.tool('clear_case_component_selection').execute({});
  assert.equal((await caseModel.getTools()).length, 11);
  assert.equal(context.snapshot().activationState, 'inactive');

  const assetModel = new FakeModelContext();
  await registerGlobal(assetModel, 'https://example.test/WebMCP/asset.html');
  await registerAssetWebMCPTools(assetApi, assetModel);
  assert.equal((await assetModel.getTools()).length, 6);
});

test('site navigation accepts only declared page ids and keeps the URL internal', async () => {
  const modelContext = new FakeModelContext();
  let navigatedTo = null;
  await registerGlobal(
    modelContext,
    'https://example.test/WebMCP/index.html',
    (target) => { navigatedTo = target; }
  );

  const result = JSON.parse(await modelContext.tool('navigate_to_capability_page').execute({ page_id: 'asset-inspector' }));
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.deepEqual(result, {
    ok: true,
    pageId: 'asset-inspector',
    title: 'Asset Inspector',
    navigationRequested: true
  });
  assert.equal('target' in result, false);
  assert.equal(navigatedTo, 'https://example.test/WebMCP/asset.html');

  await assert.rejects(
    () => modelContext.tool('navigate_to_capability_page').execute({ page_id: 'https://evil.example' }),
    /Unknown capability page/
  );
});

test('ECA: global WebMCP registration rolls back atomically on partial failure', async () => {
  const modelContext = new FakeModelContext({ failTool: 'read_page_capability_tree' });
  await assert.rejects(
    () => registerGlobal(modelContext, 'https://example.test/WebMCP/index.html'),
    /registration failed/
  );
  assert.deepEqual((await modelContext.getTools()).map(({ name }) => name), []);
});

test('ECA: case WebMCP registration rolls back atomically on partial failure', async () => {
  const modelContext = new FakeModelContext({ failTool: 'prepare_customer_update' });
  await assert.rejects(() => registerWebMCPTools(operatorApi, modelContext), /registration failed/);
  assert.deepEqual((await modelContext.getTools()).map(({ name }) => name), []);
});

test('ECA: asset WebMCP registration rolls back atomically on partial failure', async () => {
  const modelContext = new FakeModelContext({ failTool: 'prepare_inspection_note' });
  await assert.rejects(() => registerAssetWebMCPTools(assetApi, modelContext), /registration failed/);
  assert.deepEqual((await modelContext.getTools()).map(({ name }) => name), []);
});

test('ECA: sensitive-action proposal ids use the same proposal_id contract for request and apply', async () => {
  const modelContext = new FakeModelContext();
  let appliedId = null;
  const api = {
    ...operatorApi,
    requestSensitiveAction: () => ({ ok: true, proposal_id: 'proposal-eca-1', status: 'pending' }),
    applyApprovedAction: (proposalId) => {
      appliedId = proposalId;
      return { ok: true, proposal_id: proposalId, status: 'executed', approvalConsumed: true };
    }
  };

  await registerWebMCPTools(api, modelContext);
  const proposal = JSON.parse(await modelContext.tool('request_sensitive_action').execute({
    action: 'Local test action',
    reason: 'Contract regression.'
  }));
  assert.equal(proposal.proposal_id, 'proposal-eca-1');

  const applied = JSON.parse(await modelContext.tool('apply_approved_action').execute({
    proposal_id: proposal.proposal_id
  }));
  assert.equal(appliedId, 'proposal-eca-1');
  assert.equal(applied.proposal_id, 'proposal-eca-1');
});
