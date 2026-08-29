/*
SUME DOCBLOCK

Nombre: workspace-input-validation
Tipo: Lógica

Entradas:
- Texto de borrador y lista de pasos de preparación.

Acciones:
- Valida límites locales del workspace sin modificar su estado.

Salidas:
- Datos saneados o ToolContractError tipado.
*/

import { ToolContractError, ToolErrorCode } from '../contratos/tool-errors.js';

export function validateBoundedText(value, code, label, maxLength) {
  if (typeof value !== 'string') {
    throw new ToolContractError(code, `${label} must be text.`);
  }
  const clean = value.trim();
  if (!clean || clean.length > maxLength) {
    throw new ToolContractError(code, `${label} must contain 1-${maxLength} characters.`);
  }
  return clean;
}

export function validateWorkPlan(steps) {
  if (!Array.isArray(steps) || steps.length < 1 || steps.length > 8) {
    throw new ToolContractError(ToolErrorCode.INVALID_WORK_PLAN, 'A work plan requires 1-8 steps.');
  }
  return steps.map((step, index) => validateBoundedText(
    step,
    ToolErrorCode.INVALID_WORK_PLAN,
    `Step ${index + 1}`,
    240
  ));
}

export function validateCustomerUpdate(message) {
  return validateBoundedText(
    message,
    ToolErrorCode.INVALID_CUSTOMER_UPDATE,
    'Customer update',
    1500
  );
}
