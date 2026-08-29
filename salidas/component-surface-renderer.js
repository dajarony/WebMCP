/*
SUME DOCBLOCK

Nombre: component-surface-renderer
Tipo: Salida

Entradas:
- Snapshot de componente y revisión de la superficie viva.

Acciones:
- Proyecta selección, borrador y estado de capabilities al DOM con texto seguro.

Salidas:
- Panel visible para la persona sin ejecutar efectos externos.
*/

export class ComponentSurfaceRenderer {
  constructor({ documentRef = document } = {}) {
    this.els = {
      selection: documentRef.querySelector('#component-selection'),
      diagnostic: documentRef.querySelector('#component-diagnostic'),
      capabilities: documentRef.querySelector('#component-capabilities')
    };
  }

  render({ component, runtimeSurface }) {
    const selected = component.selectedComponent;
    this.els.selection.textContent = selected
      ? `${selected.label}: ${selected.summary}`
      : 'No component selected. Contextual tools are unavailable.';
    this.els.diagnostic.textContent = component.diagnosticDraft
      ? `Draft only: ${component.diagnosticDraft.observation}`
      : 'No component diagnostic prepared.';
    const dynamic = runtimeSurface.dynamicToolNames.length
      ? runtimeSurface.dynamicToolNames.join(', ')
      : 'none';
    this.els.capabilities.textContent = `Capability revision ${runtimeSurface.capabilityRevision}. Dynamic tools: ${dynamic}.`;
  }
}
