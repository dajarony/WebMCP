/*
SUME DOCBLOCK

Nombre: app
Tipo: Entrada

Entradas:
- Carga del módulo de página, document.modelContext y decisiones humanas DOM.

Acciones:
- Compone workspace, renderizador y registro WebMCP sin exponer aprobación al agente.

Salidas:
- Página compartida actualizada y cinco tools registradas cuando el navegador las soporta.
*/

import { OperatorWorkspace } from '../logica/operator-workspace.js';
import { CaseAgentSurfaceRegistry } from './case-agent-surface-registry.js';
import { OperatorDeskRenderer } from '../salidas/operator-desk-renderer.js';
import { ComponentSurfaceRenderer } from '../salidas/component-surface-renderer.js';
import { registerWebMCPTools } from './webmcp-tool-registry.js';
import { registerWorkspaceNavigationTools } from './workspace-navigation-registry.js';

const workspace = new OperatorWorkspace();
const renderer = new OperatorDeskRenderer({
  onApprove: (proposalId) => workspace.approveFromHuman(proposalId),
  onReject: (proposalId) => workspace.rejectFromHuman(proposalId)
});
const componentRenderer = new ComponentSurfaceRenderer();
const caseAgentSurface = new CaseAgentSurfaceRegistry({ modelContext: document.modelContext });

workspace.subscribe((snapshot) => renderer.render(snapshot));
renderer.render(workspace.snapshot());
componentRenderer.render({ component: caseAgentSurface.componentSnapshot(), runtimeSurface: caseAgentSurface.runtimeSurface() });
caseAgentSurface.subscribe((update) => componentRenderer.render(update));

const operatorApi = {
  readCaseContext: () => workspace.readCaseContext(),
  createWorkPlan: (steps) => workspace.createWorkPlan(steps),
  prepareCustomerUpdate: (message) => workspace.prepareCustomerUpdate(message),
  requestSensitiveAction: (action, reason) => workspace.requestSensitiveAction(action, reason),
  applyApprovedAction: (proposalId) => workspace.applyApprovedAction(proposalId)
};

try {
  const navigationToolNames = await registerWorkspaceNavigationTools({
    pageId: 'operator_case',
    locationRef: window.location,
    getRuntimeSurface: () => caseAgentSurface.runtimeSurface(),
    modelContext: document.modelContext
  });
  const caseToolNames = await registerWebMCPTools(operatorApi);
  const componentToolNames = await caseAgentSurface.register();
  const toolNames = [...navigationToolNames, ...caseToolNames, ...componentToolNames];
  renderer.setWebMcpStatus('WebMCP tools ready', 'status status-ready');
  workspace.history.unshift({ at: Date.now(), text: `${toolNames.length} WebMCP tools registered for the active page.` });
  renderer.render(workspace.snapshot());
} catch (error) {
  console.error('WebMCP registration failed', error);
  renderer.setWebMcpStatus(
    error.code === 'WEBMCP_UNAVAILABLE' ? 'WebMCP unavailable in this browser' : 'WebMCP registration failed',
    'status status-warn'
  );
}
