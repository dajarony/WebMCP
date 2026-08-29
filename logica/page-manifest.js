/*
SUME DOCBLOCK

Nombre: page-manifest
Tipo: Lógica

Entradas:
- page_id declarado por el contrato de páginas.

Acciones:
- Devuelve un árbol semántico explícito y curado para cada página.

Salidas:
- Esqueleto funcional inmutable sin DOM crudo, selectores ni datos ocultos.
*/

import { getWorkspacePage, listWorkspacePages } from '../contratos/workspace-page-contracts.js';

const PAGE_TREES = Object.freeze({
  workspace_directory: Object.freeze([
    Object.freeze({ id: 'workspace-navigation', role: 'navigation', label: 'Workspace pages', actions: ['open_workspace_page'] }),
    Object.freeze({ id: 'workspace-overview', role: 'region', label: 'Available page catalog', actions: ['list_workspace_pages', 'read_page_tree'] }),
    Object.freeze({ id: 'webmcp-status', role: 'status', label: 'WebMCP registration status', actions: [] })
  ]),
  operator_case: Object.freeze([
    Object.freeze({ id: 'workspace-navigation', role: 'navigation', label: 'Workspace pages', actions: ['open_workspace_page'] }),
    Object.freeze({ id: 'active-case', role: 'region', label: 'Active service case', actions: ['read_case_context'] }),
    Object.freeze({ id: 'work-plan', role: 'region', label: 'Agent preparation work plan', actions: ['create_work_plan'] }),
    Object.freeze({ id: 'customer-update', role: 'region', label: 'Draft-only customer update', actions: ['prepare_customer_update'] }),
    Object.freeze({ id: 'approval-boundary', role: 'region', label: 'Sensitive action boundary', actions: ['request_sensitive_action', 'apply_approved_action'], humanControls: ['Approve', 'Reject'] }),
    Object.freeze({ id: 'case-history', role: 'log', label: 'Visible case history', actions: [] })
  ])
});

export function readPageTree(pageId) {
  const page = getWorkspacePage(pageId);
  const nodes = PAGE_TREES[page.id];
  return {
    page,
    semanticTree: nodes.map((node) => ({ ...node, actions: [...node.actions], humanControls: node.humanControls ? [...node.humanControls] : [] })),
    exposedTools: [...page.toolNames],
    scope: 'Application-curated semantic manifest; not a raw DOM, selector, URL, form-value or hidden-state export.'
  };
}

export function readWorkspaceDirectory() {
  return listWorkspacePages();
}
