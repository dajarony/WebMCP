/*
SUME DOCBLOCK

Nombre: case-agent-surface-registry
Tipo: Entrada

Entradas:
- modelContext WebMCP y contexto local de componente.

Acciones:
- Registra tools base y activa/desactiva tools contextuales con AbortSignal.

Salidas:
- Superficie viva con revisión, componente y nombres dinámicos saneados.
*/

import {
  CASE_AGENT_SURFACE_DYNAMIC_TOOL_NAMES,
  CASE_AGENT_SURFACE_STATIC_TOOL_NAMES,
  createCaseAgentSurfaceDynamicContracts,
  createCaseAgentSurfaceStaticContracts
} from '../contratos/case-agent-surface-contracts.js';
import { ToolContractError, ToolErrorCode } from '../contratos/tool-errors.js';
import { CaseComponentContext } from '../logica/case-component-context.js';
import { registerWebMcpContracts } from './webmcp-contract-registrar.js';
export class CaseAgentSurfaceRegistry {
  constructor({ modelContext = globalThis.document?.modelContext, componentContext = new CaseComponentContext() } = {}) {
    this.modelContext = modelContext;
    this.componentContext = componentContext;
    this.dynamicController = null;
    this.dynamicToolNames = [];
    this.capabilityRevision = 0;
    this.listeners = new Set();
    this.toolChangeListener = () => this.#bumpRevision();
    this.componentContext.subscribe(() => this.#notify());
  }
  async register() {
    this.#assertModelContext();
    const componentApi = {
      listComponents: () => this.componentContext.listComponents(),
      selectComponent: async (componentId) => this.selectComponent(componentId),
      clearComponent: async () => this.clearComponent(),
      readSelectedComponent: () => this.componentContext.readSelected(),
      prepareDiagnostic: (observation) => this.componentContext.prepareDiagnostic(observation)
    };
    await registerWebMcpContracts(this.modelContext, createCaseAgentSurfaceStaticContracts(componentApi));
    this.modelContext.addEventListener?.('toolchange', this.toolChangeListener);
    this.#bumpRevision();
    return [...CASE_AGENT_SURFACE_STATIC_TOOL_NAMES];
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  componentSnapshot() {
    return this.componentContext.snapshot();
  }
  runtimeSurface() {
    return {
      capabilityRevision: this.capabilityRevision,
      selectedComponent: this.componentContext.snapshot().selectedComponent,
      dynamicToolNames: [...this.dynamicToolNames]
    };
  }

  async selectComponent(componentId) {
    const result = this.componentContext.select(componentId);
    const toolsChanged = await this.#syncDynamicTools();
    if (!toolsChanged) this.#bumpRevision();
    return { ...result, runtimeSurface: this.runtimeSurface() };
  }

  async clearComponent() {
    const result = this.componentContext.clear();
    const toolsChanged = await this.#syncDynamicTools();
    if (!toolsChanged) this.#bumpRevision();
    return { ...result, runtimeSurface: this.runtimeSurface() };
  }

  dispose() {
    this.modelContext?.removeEventListener?.('toolchange', this.toolChangeListener);
    this.dynamicController?.abort();
    this.dynamicController = null;
    this.dynamicToolNames = [];
    this.#bumpRevision();
  }

  async #syncDynamicTools() {
    const hasSelection = Boolean(this.componentContext.snapshot().selectedComponent);
    if (hasSelection && !this.dynamicController) {
      this.dynamicController = new AbortController();
      const componentApi = {
        readSelectedComponent: () => this.componentContext.readSelected(),
        prepareDiagnostic: (observation) => this.componentContext.prepareDiagnostic(observation)
      };
      await registerWebMcpContracts(
        this.modelContext,
        createCaseAgentSurfaceDynamicContracts(componentApi),
        this.dynamicController.signal
      );
      this.dynamicToolNames = [...CASE_AGENT_SURFACE_DYNAMIC_TOOL_NAMES];
      this.#bumpRevision();
      return true;
    }
    if (!hasSelection && this.dynamicController) {
      this.dynamicController.abort();
      this.dynamicController = null;
      this.dynamicToolNames = [];
      this.#bumpRevision();
      return true;
    }
    return false;
  }

  #assertModelContext() {
    if (!this.modelContext || typeof this.modelContext.registerTool !== 'function') {
      throw new ToolContractError(ToolErrorCode.WEBMCP_UNAVAILABLE, 'WebMCP is unavailable in this browser.');
    }
  }

  #bumpRevision() {
    this.capabilityRevision += 1;
    this.#notify();
  }

  #notify() {
    const update = { component: this.componentSnapshot(), runtimeSurface: this.runtimeSurface() };
    for (const listener of this.listeners) listener(update);
  }
}
