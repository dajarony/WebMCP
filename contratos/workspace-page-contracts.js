/*
SUME DOCBLOCK

Nombre: workspace-page-contracts
Tipo: Contrato

Entradas:
- Identificadores cerrados de página del workspace WebMCP.

Acciones:
- Declara rutas locales, títulos, resúmenes y herramientas por página.

Salidas:
- Catálogo inmutable sin URL arbitraria ni autoridad humana.
*/

import { ToolContractError, ToolErrorCode } from './tool-errors.js';

export const WORKSPACE_NAVIGATION_TOOL_NAMES = Object.freeze([
  'list_workspace_pages',
  'read_page_tree',
  'open_workspace_page'
]);

const PAGES = Object.freeze([
  Object.freeze({
    id: 'workspace_directory',
    path: './index.html',
    title: 'Auralis Workspace Directory',
    summary: 'Entry point that exposes the approved pages in this WebMCP workspace.',
    toolNames: WORKSPACE_NAVIGATION_TOOL_NAMES
  }),
  Object.freeze({
    id: 'operator_case',
    path: './case.html',
    title: 'Auralis Operator Desk',
    summary: 'Shared technical case where an agent can prepare work and a human retains approval authority.',
    toolNames: Object.freeze([
      ...WORKSPACE_NAVIGATION_TOOL_NAMES,
      'read_case_context',
      'create_work_plan',
      'prepare_customer_update',
      'request_sensitive_action',
      'apply_approved_action',
      'list_case_components',
      'select_case_component',
      'clear_case_component_selection'
    ])
  })
]);

function clonePage(page) {
  return { ...page, toolNames: [...page.toolNames] };
}

export function listWorkspacePages() {
  return PAGES.map(clonePage);
}

export function getWorkspacePage(pageId) {
  const page = PAGES.find((candidate) => candidate.id === pageId);
  if (!page) {
    throw new ToolContractError(ToolErrorCode.PAGE_NOT_FOUND, 'The requested workspace page is not declared.');
  }
  return clonePage(page);
}

export function createWorkspaceNavigationToolContracts(navigationApi) {
  return [
    {
      name: 'list_workspace_pages',
      description: 'List the declared pages in this same-origin WebMCP workspace and the tools available on each page.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async () => navigationApi.listPages()
    },
    {
      name: 'read_page_tree',
      description: 'Read the application-curated semantic tree, declared forms and current live capability state for a declared workspace page. This is not a raw DOM dump.',
      inputSchema: {
        type: 'object',
        properties: { page_id: { type: 'string', enum: PAGES.map((page) => page.id) } },
        additionalProperties: false
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async ({ page_id } = {}) => navigationApi.readPageTree(page_id)
    },
    {
      name: 'open_workspace_page',
      description: 'Open one declared same-origin workspace page by page_id. External URLs, queries and fragments are not accepted.',
      inputSchema: {
        type: 'object',
        properties: { page_id: { type: 'string', enum: PAGES.map((page) => page.id) } },
        required: ['page_id'], additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async ({ page_id }) => navigationApi.openPage(page_id)
    }
  ];
}
