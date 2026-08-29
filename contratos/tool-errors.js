/*
SUME DOCBLOCK

Nombre: tool-errors
Tipo: Contrato

Entradas:
- Código estable y mensaje seguro de una validación de tool.

Acciones:
- Representa errores de contrato sin exponer detalles internos.

Salidas:
- ToolContractError con código legible para ECA y UI.
*/

export const ToolErrorCode = Object.freeze({
  INVALID_WORK_PLAN: 'INVALID_WORK_PLAN',
  INVALID_CUSTOMER_UPDATE: 'INVALID_CUSTOMER_UPDATE',
  INVALID_PROPOSAL: 'INVALID_PROPOSAL',
  PROPOSAL_NOT_FOUND: 'PROPOSAL_NOT_FOUND',
  PROPOSAL_STATE_DENIED: 'PROPOSAL_STATE_DENIED',
  ACTION_DENIED: 'ACTION_DENIED',
  PAGE_NOT_FOUND: 'PAGE_NOT_FOUND',
  PAGE_NAVIGATION_DENIED: 'PAGE_NAVIGATION_DENIED',
  WEBMCP_UNAVAILABLE: 'WEBMCP_UNAVAILABLE'
});

export class ToolContractError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ToolContractError';
    this.code = code;
  }
}
