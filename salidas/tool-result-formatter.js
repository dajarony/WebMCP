/*
SUME DOCBLOCK

Nombre: tool-result-formatter
Tipo: Salida

Entradas:
- Resultado local ya validado de una tool WebMCP.

Acciones:
- Serializa sólo datos locales en JSON legible para el agente.

Salidas:
- Cadena JSON determinista, sin HTML ni información externa.
*/

export function formatToolResult(value) {
  return JSON.stringify(value, null, 2);
}
