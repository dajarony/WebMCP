import test from 'node:test';
import assert from 'node:assert/strict';

import { ApprovalBoundary } from '../approval-boundary.js';
import { registerWebMCPTools } from '../webmcp.js';

class FakeModelContext {
  constructor() {
    this.entries = [];
  }

  async registerTool(tool, options = {}) {
    const entry = { tool };
    this.entries.push(entry);
    options.signal?.addEventListener('abort', () => {
      this.entries = this.entries.filter((candidate) => candidate !== entry);
    }, { once: true });
  }

  tool(name) {
    return this.entries.find(({ tool }) => tool.name === name)?.tool || null;
  }

  names() {
    return this.entries.map(({ tool }) => tool.name).sort();
  }
}

function buildOperatorApi(gate) {
  return {
    readCaseContext: () => ({ case: { id: 'SRV-2047' } }),
    createWorkPlan: (steps) => ({ ok: true, steps }),
    prepareCustomerUpdate: (message) => ({ ok: true, draft: message, sent: false }),
    requestSensitiveAction(action, reason) {
      const proposal = gate.request(action, reason);
      return {
        ok: true,
        proposalId: proposal.id,
        status: proposal.status,
        message: 'Proposal created. A human must approve it in the page before it can be applied.'
      };
    },
    applyApprovedAction(proposalId) {
      const proposal = gate.apply(proposalId);
      return {
        ok: true,
        proposalId: proposal.id,
        status: proposal.status,
        approvalConsumed: true
      };
    }
  };
}

test('ECA: Trinidad exposes request/apply to the agent but never approve/reject', async () => {
  let sequence = 0;
  const gate = new ApprovalBoundary({ idFactory: () => `proposal-${++sequence}` });
  const modelContext = new FakeModelContext();
  await registerWebMCPTools(buildOperatorApi(gate), modelContext);

  assert.deepEqual(modelContext.names(), [
    'apply_approved_action',
    'create_work_plan',
    'prepare_customer_update',
    'read_case_context',
    'request_sensitive_action'
  ]);
  assert.equal(modelContext.tool('approve_sensitive_action'), null);
  assert.equal(modelContext.tool('reject_sensitive_action'), null);
  assert.equal(modelContext.tool('approve'), null);
  assert.equal(modelContext.tool('reject'), null);
});

test('ECA: Trinidad requires human approval, consumes it once, and blocks replay', async () => {
  let sequence = 0;
  const gate = new ApprovalBoundary({ idFactory: () => `proposal-${++sequence}` });
  const modelContext = new FakeModelContext();
  await registerWebMCPTools(buildOperatorApi(gate), modelContext);

  const requested = JSON.parse(await modelContext.tool('request_sensitive_action').execute({
    action: 'Schedule technician visit',
    reason: 'This commits staff time.'
  }));
  assert.equal(requested.status, 'pending');

  await assert.rejects(
    () => modelContext.tool('apply_approved_action').execute({ proposal_id: requested.proposalId }),
    /Human approval is required/
  );

  gate.approve(requested.proposalId); // human-side action; intentionally not exposed as WebMCP.

  const executed = JSON.parse(await modelContext.tool('apply_approved_action').execute({
    proposal_id: requested.proposalId
  }));
  assert.equal(executed.status, 'executed');
  assert.equal(executed.approvalConsumed, true);

  await assert.rejects(
    () => modelContext.tool('apply_approved_action').execute({ proposal_id: requested.proposalId }),
    /proposal status is executed|already been consumed/
  );
});

test('ECA: Trinidad rejection permanently blocks agent execution', async () => {
  let sequence = 0;
  const gate = new ApprovalBoundary({ idFactory: () => `proposal-${++sequence}` });
  const modelContext = new FakeModelContext();
  await registerWebMCPTools(buildOperatorApi(gate), modelContext);

  const requested = JSON.parse(await modelContext.tool('request_sensitive_action').execute({
    action: 'Close case',
    reason: 'Closing the case changes operational state.'
  }));

  gate.reject(requested.proposalId); // human-side action; intentionally not exposed as WebMCP.

  await assert.rejects(
    () => modelContext.tool('apply_approved_action').execute({ proposal_id: requested.proposalId }),
    /proposal status is rejected/
  );
});
