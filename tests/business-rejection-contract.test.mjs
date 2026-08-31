import test from 'node:test';
import assert from 'node:assert/strict';

import { ApprovalBoundary } from '../approval-boundary.js';
import { registerWebMCPTools } from '../webmcp.js';

class FakeModelContext {
  constructor() {
    this.tools = new Map();
  }

  async registerTool(tool) {
    this.tools.set(tool.name, tool);
  }

  tool(name) {
    return this.tools.get(name);
  }
}

function operatorWithBoundary() {
  let sequence = 0;
  const boundary = new ApprovalBoundary({ idFactory: () => `proposal-${++sequence}` });
  return {
    boundary,
    api: {
      readCaseContext: () => ({ case: { id: 'SRV-2047' } }),
      createWorkPlan: (steps) => ({ ok: true, steps }),
      prepareCustomerUpdate: (message) => ({ ok: true, draft: message, sent: false }),
      requestSensitiveAction: (action, reason) => {
        const proposal = boundary.request(action, reason);
        return { ok: true, proposal_id: proposal.id, status: proposal.status };
      },
      applyApprovedAction: (proposalId) => {
        const proposal = boundary.apply(proposalId);
        return {
          ok: true,
          proposal_id: proposal.id,
          status: proposal.status,
          approvalConsumed: true
        };
      }
    }
  };
}

test('ECA: consumed Auralis proposal returns only a typed business rejection envelope', async () => {
  const modelContext = new FakeModelContext();
  const { boundary, api } = operatorWithBoundary();
  await registerWebMCPTools(api, modelContext);

  const proposal = JSON.parse(await modelContext.tool('request_sensitive_action').execute({
    action: 'Schedule technician visit',
    reason: 'Human approval is required.'
  }));
  boundary.approve(proposal.proposal_id);

  const first = JSON.parse(await modelContext.tool('apply_approved_action').execute({
    proposal_id: proposal.proposal_id
  }));
  assert.equal(first.ok, true);
  assert.equal(first.status, 'executed');
  assert.equal(first.approvalConsumed, true);

  const replay = JSON.parse(await modelContext.tool('apply_approved_action').execute({
    proposal_id: proposal.proposal_id
  }));
  assert.deepEqual(replay, {
    ok: false,
    error: {
      kind: 'business_rejection',
      code: 'PROPOSAL_ALREADY_CONSUMED'
    }
  });
  assert.equal(JSON.stringify(replay).includes('already been consumed'), false);
});

test('ECA: unknown apply exception is not mislabeled as a business rejection', async () => {
  const modelContext = new FakeModelContext();
  const { api } = operatorWithBoundary();
  api.applyApprovedAction = () => {
    throw new Error('unexpected internal failure');
  };
  await registerWebMCPTools(api, modelContext);

  await assert.rejects(
    () => modelContext.tool('apply_approved_action').execute({ proposal_id: 'proposal-1' }),
    /unexpected internal failure/
  );
});
