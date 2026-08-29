/*
SUME DOCBLOCK

Nombre: workspace-navigation-registry
Tipo: Entrada

Entradas:
- page_id actual, manifest local, modelContext y location del navegador.

Acciones:
- Registra descubrimiento de páginas, árbol curado y navegación local limitada.

Salidas:
- Tres tools WebMCP globales o error tipado si la API no está disponible.
*/

import {
  createWorkspaceNavigationToolContracts,
  getWorkspacePage,
  listWorkspacePages
} from '../contratos/workspace-page-contracts.js';
import { ToolContractError, ToolErrorCode } from '../contratos/tool-errors.js';
import { readPageTree, readWorkspaceDirectory } from '../logica/page-manifest.js';
import { formatToolResult } from '../salidas/tool-result-formatter.js';

function assertLocalPagePath(page) {
  if (!page.path.startsWith('./') || /[:?#]/.test(page.path)) {
    throw new ToolContractError(ToolErrorCode.PAGE_NAVIGATION_DENIED, 'The declared page path is not a permitted local path.');
  }
  return page.path;
}

export async function registerWorkspaceNavigationTools({ pageId, locationRef, modelContext = globalThis.document?.modelContext } = {}) {
  if (!modelContext || typeof modelContext.registerTool !== 'function') {
    throw new ToolContractError(ToolErrorCode.WEBMCP_UNAVAILABLE, 'WebMCP is unavailable in this browser.');
  }
  getWorkspacePage(pageId);
  const navigationApi = {
    listPages: () => readWorkspaceDirectory(),
    readPageTree: (requestedPageId = pageId) => readPageTree(requestedPageId),
    openPage: (requestedPageId) => {
      const path = assertLocalPagePath(getWorkspacePage(requestedPageId));
      if (!locationRef || typeof locationRef.assign !== 'function') {
        throw new ToolContractError(ToolErrorCode.PAGE_NAVIGATION_DENIED, 'The browser navigation surface is unavailable.');
      }
      locationRef.assign(path);
      return { ok: true, pageId: requestedPageId, path, navigationRequested: true };
    }
  };
  const contracts = createWorkspaceNavigationToolContracts(navigationApi);
  for (const contract of contracts) {
    await modelContext.registerTool({
      ...contract,
      execute: async (input = {}) => formatToolResult(await contract.execute(input))
    });
  }
  return contracts.map((contract) => contract.name);
}

export { listWorkspacePages };
