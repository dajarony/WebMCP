/*
SUME DOCBLOCK

Nombre: case-component-context
Tipo: Lógica

Entradas:
- IDs cerrados de componente y observaciones de diagnóstico locales.

Acciones:
- Mantiene selección, lectura y borrador de componente para la superficie contextual.

Salidas:
- Snapshots inmutables sin envío, red ni autoridad humana.
*/

import { CASE_COMPONENTS, getCaseComponent } from '../contratos/case-agent-surface-contracts.js';
import { ToolContractError, ToolErrorCode } from '../contratos/tool-errors.js';

function clone(value) {
  return structuredClone(value);
}

function boundedObservation(value) {
  if (typeof value !== 'string') {
    throw new ToolContractError(ToolErrorCode.INVALID_COMPONENT_DIAGNOSTIC, 'Component diagnostic must be text.');
  }
  const observation = value.trim();
  if (!observation || observation.length > 1000) {
    throw new ToolContractError(ToolErrorCode.INVALID_COMPONENT_DIAGNOSTIC, 'Component diagnostic must contain 1-1000 characters.');
  }
  return observation;
}

export class CaseComponentContext {
  constructor() {
    this.selectedComponentId = null;
    this.diagnosticDraft = null;
    this.listeners = new Set();
  }

  listComponents() {
    return CASE_COMPONENTS.map((component) => ({ ...component }));
  }

  snapshot() {
    return clone({
      selectedComponent: this.selectedComponentId ? getCaseComponent(this.selectedComponentId) : null,
      diagnosticDraft: this.diagnosticDraft
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  select(componentId) {
    const component = getCaseComponent(componentId);
    if (!component) {
      throw new ToolContractError(ToolErrorCode.COMPONENT_NOT_FOUND, 'The requested component is not declared for this case.');
    }
    this.selectedComponentId = component.id;
    this.diagnosticDraft = null;
    this.#notify();
    return { ok: true, selectedComponent: component };
  }

  clear() {
    this.selectedComponentId = null;
    this.diagnosticDraft = null;
    this.#notify();
    return { ok: true, selectedComponent: null, diagnosticDraft: null };
  }

  readSelected() {
    const selectedComponent = this.#requireSelected();
    return { ok: true, selectedComponent, diagnosticDraft: this.diagnosticDraft ? { ...this.diagnosticDraft } : null };
  }

  prepareDiagnostic(observation) {
    const selectedComponent = this.#requireSelected();
    this.diagnosticDraft = { componentId: selectedComponent.id, observation: boundedObservation(observation), sent: false };
    this.#notify();
    return { ok: true, selectedComponent, diagnosticDraft: { ...this.diagnosticDraft } };
  }

  #requireSelected() {
    const selectedComponent = this.selectedComponentId ? getCaseComponent(this.selectedComponentId) : null;
    if (!selectedComponent) {
      throw new ToolContractError(ToolErrorCode.COMPONENT_NOT_SELECTED, 'Select a declared component before using contextual tools.');
    }
    return selectedComponent;
  }

  #notify() {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}
