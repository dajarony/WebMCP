/*
SUME DOCBLOCK

Nombre: case-agent-surface-contracts
Tipo: Contrato

Entradas:
- API limitada del contexto de componente del caso.

Acciones:
- Declara selección contextual y las tools que sólo existen con un componente activo.

Salidas:
- Contratos WebMCP cerrados para componente, lectura y borrador local.
*/

export const CASE_COMPONENTS = Object.freeze([
  Object.freeze({ id: 'condenser_fan', label: 'Condenser fan', summary: 'Intermittent fan noise was reported.' }),
  Object.freeze({ id: 'compressor', label: 'Compressor', summary: 'Compressor is reported as running.' })
]);

export const CASE_AGENT_SURFACE_STATIC_TOOL_NAMES = Object.freeze([
  'list_case_components',
  'select_case_component',
  'clear_case_component_selection'
]);

export const CASE_AGENT_SURFACE_DYNAMIC_TOOL_NAMES = Object.freeze([
  'read_selected_component',
  'prepare_component_diagnostic'
]);

export function getCaseComponent(componentId) {
  const component = CASE_COMPONENTS.find((candidate) => candidate.id === componentId);
  return component ? { ...component } : null;
}

export function createCaseAgentSurfaceStaticContracts(componentApi) {
  const componentIds = CASE_COMPONENTS.map((component) => component.id);
  return [
    {
      name: 'list_case_components',
      description: 'List only the declared components available for contextual inspection in this demo case.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async () => componentApi.listComponents()
    },
    {
      name: 'select_case_component',
      description: 'Select one declared case component. This changes only local page context and may expose contextual WebMCP tools.',
      inputSchema: {
        type: 'object',
        properties: { component_id: { type: 'string', enum: componentIds } },
        required: ['component_id'], additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async ({ component_id }) => componentApi.selectComponent(component_id)
    },
    {
      name: 'clear_case_component_selection',
      description: 'Clear the local component context and remove its contextual tools. This does not affect the external world.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async () => componentApi.clearComponent()
    }
  ];
}

export function createCaseAgentSurfaceDynamicContracts(componentApi) {
  return [
    {
      name: 'read_selected_component',
      description: 'Read the currently selected declared component. Available only while component context is active.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async () => componentApi.readSelectedComponent()
    },
    {
      name: 'prepare_component_diagnostic',
      description: 'Prepare a local diagnostic observation for the selected component. It never sends, saves externally, or changes approval state.',
      inputSchema: {
        type: 'object',
        properties: { observation: { type: 'string', minLength: 1, maxLength: 1000 } },
        required: ['observation'], additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async ({ observation }) => componentApi.prepareDiagnostic(observation)
    }
  ];
}
