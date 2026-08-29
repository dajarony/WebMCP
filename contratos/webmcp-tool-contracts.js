/*
SUME DOCBLOCK

Nombre: webmcp-tool-contracts
Tipo: Contrato

Entradas:
- API limitada del workspace compartido.

Acciones:
- Declara los cinco schemas WebMCP y conecta cada execute a la API permitida.

Salidas:
- Definiciones estables de tools WebMCP sin ninguna tool de aprobación humana.
*/

export const WEBMCP_TOOL_NAMES = Object.freeze([
  'read_case_context',
  'create_work_plan',
  'prepare_customer_update',
  'request_sensitive_action',
  'apply_approved_action'
]);

export function createWebMCPToolContracts(operatorApi) {
  return [
    {
      name: 'read_case_context',
      description: 'Read the current service case and shared workspace state visible on this page. Use this before planning or proposing actions.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async () => operatorApi.readCaseContext()
    },
    {
      name: 'create_work_plan',
      description: 'Place a concise diagnostic or service checklist into the shared human-agent workspace. This prepares work only and performs no external action.',
      inputSchema: {
        type: 'object',
        properties: {
          steps: {
            type: 'array', minItems: 1, maxItems: 8,
            items: { type: 'string', minLength: 1, maxLength: 240 },
            description: 'Ordered checklist steps for the human operator to review.'
          }
        },
        required: ['steps'], additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async ({ steps }) => operatorApi.createWorkPlan(steps)
    },
    {
      name: 'prepare_customer_update',
      description: 'Prepare a customer-facing status update in the page for human review. This tool never sends the message.',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string', minLength: 1, maxLength: 1500,
            description: 'Draft status update to show in the shared workspace.'
          }
        },
        required: ['message'], additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async ({ message }) => operatorApi.prepareCustomerUpdate(message)
    },
    {
      name: 'request_sensitive_action',
      description: 'Create a sensitive-action proposal for explicit human approval in the page. This does not execute the proposed action.',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', minLength: 1, maxLength: 180, description: 'Clear description of the sensitive action being proposed.' },
          reason: { type: 'string', minLength: 1, maxLength: 500, description: 'Why the action is appropriate and what the human is being asked to approve.' }
        },
        required: ['action', 'reason'], additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async ({ action, reason }) => operatorApi.requestSensitiveAction(action, reason)
    },
    {
      name: 'apply_approved_action',
      description: 'Apply a previously proposed action only after the human has approved it in the page. Each approval is single-use and is consumed on success.',
      inputSchema: {
        type: 'object',
        properties: {
          proposal_id: { type: 'string', minLength: 1, description: 'Proposal identifier returned by request_sensitive_action.' }
        },
        required: ['proposal_id'], additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async ({ proposal_id }) => operatorApi.applyApprovedAction(proposal_id)
    }
  ];
}
