/*
SUME DOCBLOCK

Nombre: webmcp-tool-registry
Tipo: Entrada

Entradas:
- API limitada del workspace y la implementación document.modelContext.

Acciones:
- Registra los contratos WebMCP explícitos de la página.

Salidas:
- Nombres de tools registradas o ToolContractError si WebMCP no está disponible.
*/

import { createWebMCPToolContracts } from '../contratos/webmcp-tool-contracts.js';
import { ToolContractError, ToolErrorCode } from '../contratos/tool-errors.js';
import { formatToolResult } from '../salidas/tool-result-formatter.js';

export async function registerWebMCPTools(operatorApi, modelContext = document.modelContext) {
  if (!modelContext || typeof modelContext.registerTool !== 'function') {
    throw new ToolContractError(ToolErrorCode.WEBMCP_UNAVAILABLE, 'WebMCP is unavailable in this browser.');
  }
  const contracts = createWebMCPToolContracts(operatorApi);
  for (const contract of contracts) {
    await modelContext.registerTool({
      ...contract,
      execute: async (input = {}) => formatToolResult(await contract.execute(input))
    });
  }
  return contracts.map((contract) => contract.name);
}
