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
    Object.freeze({ id: 'component-context', role: 'region', label: 'Selected component and contextual capabilities', actions: ['list_case_components', 'select_case_component', 'clear_case_component_selection'] }),
    Object.freeze({ id: 'case-history', role: 'log', label: 'Visible case history', actions: [] })
  ])
});

const PAGE_FORMS = Object.freeze({
  workspace_directory: Object.freeze([]),
  operator_case: Object.freeze([
    Object.freeze({ id: 'work-plan-form', submitTool: 'create_work_plan', fields: ['steps'], effect: 'visible_local_workspace', humanApprovalRequired: false }),
    Object.freeze({ id: 'customer-update-form', submitTool: 'prepare_customer_update', fields: ['message'], effect: 'local_draft_only', humanApprovalRequired: false }),
    Object.freeze({ id: 'sensitive-action-form', submitTool: 'request_sensitive_action', fields: ['action', 'reason'], effect: 'pending_human_proposal', humanApprovalRequired: true }),
    Object.freeze({ id: 'component-selection-form', submitTool: 'select_case_component', fields: ['component_id'], effect: 'local_context_and_dynamic_tools', humanApprovalRequired: false })
  ])
});

function cloneForms(forms) {
  return forms.map((form) => ({ ...form, fields: [...form.fields] }));
}

export function readPageTree(pageId, runtimeSurface = {}) {
  const page = getWorkspacePage(pageId);
  const nodes = PAGE_TREES[page.id];
  const dynamicToolNames = Array.isArray(runtimeSurface.dynamicToolNames) ? [...runtimeSurface.dynamicToolNames] : [];
  const selectedComponent = runtimeSurface.selectedComponent ? { ...runtimeSurface.selectedComponent } : null;
  const semanticTree = nodes.map((node) => ({ ...node, actions: [...node.actions], humanControls: node.humanControls ? [...node.humanControls] : [] }));
  const forms = cloneForms(PAGE_FORMS[page.id]);
  if (page.id === 'operator_case' && selectedComponent) {
    semanticTree.push({
      id: 'selected-component',
      role: 'region',
      label: `Selected component: ${selectedComponent.label}`,
      actions: dynamicToolNames,
      humanControls: []
    });
    forms.push({
      id: 'component-diagnostic-form',
      submitTool: 'prepare_component_diagnostic',
      fields: ['observation'],
      effect: 'local_draft_only',
      humanApprovalRequired: false
    });
  }
  return {
    page,
    semanticTree,
    forms,
    declaredTools: [...page.toolNames, ...dynamicToolNames],
    runtimeSurface: {
      capabilityRevision: Number.isInteger(runtimeSurface.capabilityRevision) ? runtimeSurface.capabilityRevision : 0,
      selectedComponent,
      dynamicToolNames
    },
    scope: 'Application-curated semantic manifest; not a raw DOM, selector, URL, form-value or hidden-state export.'
  };
}

export function readWorkspaceDirectory() {
  return listWorkspacePages();
}
