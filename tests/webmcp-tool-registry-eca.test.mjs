import test from 'node:test';
import assert from 'node:assert/strict';
import { registerWebMCPTools } from '../entradas/webmcp-tool-registry.js';
import { WEBMCP_TOOL_NAMES } from '../contratos/webmcp-tool-contracts.js';
import { ToolErrorCode } from '../contratos/tool-errors.js';

function operatorApi() {
  return {
    readCaseContext: () => ({ case: 'demo' }),
    createWorkPlan: (steps) => ({ ok: true, steps }),
    prepareCustomerUpdate: (message) => ({ ok: true, draft: message, sent: false }),
    requestSensitiveAction: (action, reason) => ({ ok: true, proposalId: 'proposal-1', action, reason }),
    applyApprovedAction: () => ({ ok: true, approvalConsumed: true })
  };
}

test('ECA: page registers exactly the five declared tools and no approval tool', async () => {
  const registered = [];
  const names = await registerWebMCPTools(operatorApi(), {
    registerTool: async (tool) => registered.push(tool)
  });

  assert.deepEqual(names, WEBMCP_TOOL_NAMES);
  assert.deepEqual(registered.map((tool) => tool.name), WEBMCP_TOOL_NAMES);
  const forbiddenHumanDecisionTools = new Set([
    'approve_sensitive_action',
    'reject_sensitive_action',
    'approve_proposal',
    'reject_proposal'
  ]);
  assert.equal(registered.some((tool) => forbiddenHumanDecisionTools.has(tool.name)), false);
});

test('ECA: registry serializes local tool results and preserves draft-only result', async () => {
  const registered = [];
  await registerWebMCPTools(operatorApi(), { registerTool: async (tool) => registered.push(tool) });
  const draft = registered.find((tool) => tool.name === 'prepare_customer_update');
  const result = JSON.parse(await draft.execute({ message: 'Draft only.' }));

  assert.deepEqual(result, { ok: true, draft: 'Draft only.', sent: false });
});

test('ECA: missing WebMCP implementation fails closed before registrations', async () => {
  await assert.rejects(
    () => registerWebMCPTools(operatorApi(), null),
    (error) => error.code === ToolErrorCode.WEBMCP_UNAVAILABLE
  );
});
