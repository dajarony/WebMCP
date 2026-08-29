/*
SUME DOCBLOCK

Nombre: webmcp-contract-registrar
Tipo: Entrada

Entradas:
- Contratos declarados y un modelContext WebMCP disponible.

Acciones:
- Registra contratos con serialización homogénea y un AbortSignal opcional.

Salidas:
- Tools WebMCP registradas sin alterar sus contratos de entrada.
*/

import { formatToolResult } from '../salidas/tool-result-formatter.js';

export async function registerWebMcpContracts(modelContext, contracts, signal) {
  for (const contract of contracts) {
    await modelContext.registerTool({
      ...contract,
      execute: async (input = {}) => formatToolResult(await contract.execute(input))
    }, signal ? { signal } : undefined);
  }
}
