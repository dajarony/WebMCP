import test from 'node:test';
import assert from 'node:assert/strict';

import { registerSiteWebMCPTools } from '../site-webmcp.js';
import { registerWebMCPTools } from '../webmcp.js';
import { registerAssetWebMCPTools } from '../asset-webmcp.js';
import { CaseContextWebMCP } from '../case-context-webmcp.js';
import { ApprovalBoundary } from '../approval-boundary.js';
import { AssetWorkspaceState } from '../asset-workspace.js';
import { normalizeWorkPlanSteps } from '../case-workspace-state.js';

class FakeModelContext {
  constructor() {
    this.entries = [];
    this.listeners = new Set();
  }

  async registerTool(tool, options = {}) {
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

  tool(name) {
    return this.entries.find(({ tool }) => tool.name === name)?.tool || null;
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

async function registerGlobal(modelContext, baseHref, navigate = () => {}) {
  return registerSiteWebMCPTools({
    getCapabilityTree: async () => ({
      liveWebMCPTools: (await modelContext.getTools()).map(({ name }) => name)
    }),
    navigate,
    modelContext,
    baseHref
  });
}

test('ECA E2E: complete human-agent workflow crosses context, Trinidad and Asset Inspector safely', async () => {
  let idSequence = 0;
  let clock = 1000;
  const approvalBoundary = new ApprovalBoundary({
    idFactory: () => `proposal-${++idSequence}`,
    clock: () => ++clock
  });

  const caseState = {
    workPlan: [],
    customerUpdate: ''
  };

  const operatorApi = {
    readCaseContext() {
      return {
        case: { id: 'SRV-2047', asset: 'CR-02' },
        workPlan: [...caseState.workPlan],
        customerUpdate: caseState.customerUpdate || null,
        sensitiveActions: approvalBoundary.proposals.map(({ id, action, reason, status, consumed }) => ({
          id, action, reason, status, consumed
        }))
      };
    },
    createWorkPlan(steps) {
      caseState.workPlan = normalizeWorkPlanSteps(steps);
      return { ok: true, steps: [...caseState.workPlan] };
    },
    prepareCustomerUpdate(message) {
      const clean = String(message).trim();
      if (!clean) throw new Error('Customer update cannot be empty.');
      caseState.customerUpdate = clean.slice(0, 1500);
      return { ok: true, draft: caseState.customerUpdate, sent: false };
    },
    requestSensitiveAction(action, reason) {
      const proposal = approvalBoundary.request(action, reason);
      return { ok: true, proposalId: proposal.id, status: proposal.status };
    },
    applyApprovedAction(proposalId) {
      const proposal = approvalBoundary.apply(proposalId);
      return {
        ok: true,
        proposalId: proposal.id,
        status: proposal.status,
        approvalConsumed: proposal.consumed
      };
    }
  };

  // Case Workspace: global + case + contextual-static tools = 11.
  const caseModel = new FakeModelContext();
  let navigatedTo = null;
  await registerGlobal(
    caseModel,
    'https://example.test/WebMCP/index.html',
    (target) => { navigatedTo = target; }
  );
  await registerWebMCPTools(operatorApi, caseModel);
  const context = new CaseContextWebMCP({ modelContext: caseModel });
  await context.register();
  assert.equal((await caseModel.getTools()).length, 11);

  // Agent prepares bounded, non-consequential work.
  const plan = JSON.parse(await caseModel.tool('create_work_plan').execute({
    steps: ['Inspect condenser fan', 'Confirm compressor current']
  }));
  assert.deepEqual(plan.steps, ['Inspect condenser fan', 'Confirm compressor current']);

  const customerDraft = JSON.parse(await caseModel.tool('prepare_customer_update').execute({
    message: 'We are investigating the cold-room temperature rise.'
  }));
  assert.equal(customerDraft.sent, false);

  // Context opens only after declared component selection: 11 → 13.
  await caseModel.tool('select_case_component').execute({ component_id: 'condenser_fan' });
  assert.equal((await caseModel.getTools()).length, 13);
  assert.equal(context.snapshot().activationState, 'active');
  assert.equal(context.snapshot().selectedComponent.id, 'condenser_fan');

  const diagnostic = JSON.parse(await caseModel.tool('prepare_component_diagnostic').execute({
    observation: 'Confirm fan rotation and guard clearance.'
  }));
  assert.equal(diagnostic.sent, false);

  // Clearing context removes contextual authority: 13 → 11.
  await caseModel.tool('clear_case_component_selection').execute({});
  assert.equal((await caseModel.getTools()).length, 11);
  assert.equal(context.snapshot().activationState, 'inactive');
  assert.equal(caseModel.tool('prepare_component_diagnostic'), null);

  // Sensitive work crosses Trinidad. Pending execution is blocked.
  const requested = JSON.parse(await caseModel.tool('request_sensitive_action').execute({
    action: 'Schedule technician visit',
    reason: 'This commits staff time and requires human approval.'
  }));
  assert.equal(requested.status, 'pending');
  assert.equal(approvalBoundary.find(requested.proposalId).status, 'pending');

  await assert.rejects(
    () => caseModel.tool('apply_approved_action').execute({ proposal_id: requested.proposalId }),
    /Human approval is required/
  );

  // Human-only action: direct boundary approval, never an agent tool.
  approvalBoundary.approve(requested.proposalId);
  assert.equal(approvalBoundary.find(requested.proposalId).status, 'approved');

  // Agent may now execute exactly once; replay is blocked.
  const applied = JSON.parse(await caseModel.tool('apply_approved_action').execute({
    proposal_id: requested.proposalId
  }));
  assert.equal(applied.status, 'executed');
  assert.equal(applied.approvalConsumed, true);

  await assert.rejects(
    () => caseModel.tool('apply_approved_action').execute({ proposal_id: requested.proposalId }),
    /status is executed|already been consumed/
  );

  // Agent navigates only through the declared same-origin page id.
  const navigation = JSON.parse(await caseModel.tool('navigate_to_capability_page').execute({
    page_id: 'asset-inspector'
  }));
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.equal(navigation.pageId, 'asset-inspector');
  assert.equal(navigatedTo, 'https://example.test/WebMCP/asset.html');

  // New document: Asset Inspector exposes exactly 6 tools.
  const assetWorkspace = new AssetWorkspaceState();
  const assetApi = {
    readAssetContext: () => assetWorkspace.readAssetContext(),
    setInspectionFocus: (focus) => assetWorkspace.setInspectionFocus(focus),
    prepareInspectionNote: (note) => assetWorkspace.prepareInspectionNote(note)
  };
  const assetModel = new FakeModelContext();
  await registerGlobal(assetModel, 'https://example.test/WebMCP/asset.html');
  await registerAssetWebMCPTools(assetApi, assetModel);
  assert.equal((await assetModel.getTools()).length, 6);
  assert.equal(assetModel.tool('request_sensitive_action'), null);
  assert.equal(assetModel.tool('select_case_component'), null);

  const focus = JSON.parse(await assetModel.tool('set_inspection_focus').execute({
    focus: 'Inspect condenser fan assembly'
  }));
  assert.equal(focus.focus, 'Inspect condenser fan assembly');

  const prepared = JSON.parse(await assetModel.tool('prepare_inspection_note').execute({
    note: 'Agent draft: fan noise confirmed.'
  }));
  assert.equal(prepared.saved, false);

  // Human edits the shared draft; the agent must see that unsaved revision.
  assetWorkspace.syncPreparedNote('Human revision: inspect fan guard before service.');
  let assetContext = JSON.parse(await assetModel.tool('read_asset_context').execute({}));
  assert.equal(assetContext.preparedNote, 'Human revision: inspect fan guard before service.');
  assert.equal(assetContext.noteIsSaved, false);

  // Human save becomes visible to the agent as the final shared state.
  assetWorkspace.saveInspectionNote('Human revision: inspect fan guard before service.', 2000);
  assetContext = JSON.parse(await assetModel.tool('read_asset_context').execute({}));
  assert.equal(assetContext.lastSavedNote, 'Human revision: inspect fan guard before service.');
  assert.equal(assetContext.noteIsSaved, true);
  assert.equal(assetContext.savedAt, 2000);
});
