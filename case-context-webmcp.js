const COMPONENTS = Object.freeze([
  Object.freeze({
    id: 'condenser_fan',
    label: 'Condenser fan',
    summary: 'Intermittent fan noise was reported.'
  }),
  Object.freeze({
    id: 'compressor',
    label: 'Compressor',
    summary: 'The compressor is reported as running.'
  })
]);

function json(value) {
  return JSON.stringify(value, null, 2);
}

function componentById(componentId) {
  return COMPONENTS.find((component) => component.id === componentId) || null;
}

export class CaseContextWebMCP {
  constructor({ modelContext, onChange = () => {} }) {
    this.modelContext = modelContext;
    this.onChange = onChange;
    this.selectedComponent = null;
    this.diagnosticDraft = null;
    this.revision = 0;
    this.dynamicController = null;
    this.dynamicToolNames = new Set();
    this.activationState = 'inactive';
    this.activationGeneration = 0;
    this.toolChangeListener = () => this.#notify();
  }

  snapshot() {
    return {
      revision: this.revision,
      activationState: this.activationState,
      selectedComponent: this.selectedComponent ? { ...this.selectedComponent } : null,
      diagnosticDraft: this.diagnosticDraft ? { ...this.diagnosticDraft } : null,
      dynamicToolNames: [...this.dynamicToolNames].sort()
    };
  }

  async register() {
    await this.#registerToolsAtomically(this.#staticTools());
    this.modelContext.addEventListener?.('toolchange', this.toolChangeListener);
    this.#notify();
    return ['list_case_components', 'select_case_component', 'clear_case_component_selection'];
  }

  async select(componentId) {
    const component = componentById(componentId);
    if (!component) throw new Error('Unknown case component.');

    if (this.dynamicController && this.activationState === 'activating') {
      this.activationGeneration += 1;
      this.dynamicController.abort();
      this.dynamicController = null;
      this.dynamicToolNames.clear();
      this.activationState = 'inactive';
    }

    this.selectedComponent = component;
    this.diagnosticDraft = null;

    if (!this.dynamicController) {
      const generation = ++this.activationGeneration;
      const controller = new AbortController();
      this.dynamicController = controller;
      this.activationState = 'activating';
      this.#notify();
      try {
        for (const tool of this.#dynamicTools()) {
          await this.modelContext.registerTool(tool, { signal: controller.signal });
          if (controller.signal.aborted || this.dynamicController !== controller || this.activationGeneration !== generation) {
            throw new Error('Component activation was superseded.');
          }
          this.dynamicToolNames.add(tool.name);
          this.#notify();
        }
        if (controller.signal.aborted || this.dynamicController !== controller || this.activationGeneration !== generation) {
          throw new Error('Component activation was superseded.');
        }
        this.activationState = 'active';
      } catch (error) {
        controller.abort();
        if (this.dynamicController === controller && this.activationGeneration === generation) {
          this.dynamicController = null;
          this.dynamicToolNames.clear();
          this.activationState = 'inactive';
          this.selectedComponent = null;
          this.#notify();
        }
        throw error;
      }
    }

    this.#notify();
    return this.snapshot();
  }

  clear() {
    this.activationGeneration += 1;
    this.selectedComponent = null;
    this.diagnosticDraft = null;
    if (this.dynamicController) {
      this.activationState = 'deactivating';
      this.#notify();
      this.dynamicController.abort();
    }
    this.dynamicController = null;
    this.dynamicToolNames.clear();
    this.activationState = 'inactive';
    this.#notify();
    return this.snapshot();
  }

  dispose() {
    this.modelContext.removeEventListener?.('toolchange', this.toolChangeListener);
    this.clear();
  }

  #staticTools() {
    return [
      readTool('list_case_components', 'List the declared demo components available for contextual inspection.', () => ({ components: COMPONENTS })),
      inputTool('select_case_component', 'Select one declared component and expose its contextual tools.', 'component_id', { type: 'string', enum: COMPONENTS.map(({ id }) => id) }, async ({ component_id }) => this.select(component_id)),
      inputTool('clear_case_component_selection', 'Clear local component context and remove its contextual tools.', null, null, () => this.clear())
    ];
  }

  #dynamicTools() {
    return [
      readTool('read_selected_component', 'Read the currently selected component. Requires valid component context.', () => {
        if (!this.selectedComponent) throw new Error('Select a component first.');
        return { component: this.selectedComponent };
      }),
      inputTool('prepare_component_diagnostic', 'Prepare a bounded local diagnostic draft. It is never sent or executed.', 'observation', { type: 'string', minLength: 1, maxLength: 1000 }, ({ observation }) => {
        if (!this.selectedComponent) throw new Error('Select a component first.');
        const clean = String(observation).trim();
        if (!clean) throw new Error('Diagnostic observation cannot be empty.');
        if (clean.length > 1000) throw new Error('Diagnostic observation cannot exceed 1000 characters.');
        this.diagnosticDraft = { componentId: this.selectedComponent.id, observation: clean };
        this.#notify();
        return { ok: true, sent: false, diagnosticDraft: this.diagnosticDraft };
      })
    ];
  }

  async #registerToolsAtomically(tools) {
    const controller = new AbortController();
    try {
      for (const tool of tools) await this.modelContext.registerTool(tool, { signal: controller.signal });
    } catch (error) {
      controller.abort();
      throw error;
    }
  }

  #notify() {
    this.revision += 1;
    this.onChange(this.snapshot());
  }
}

function readTool(name, description, execute) {
  return {
    name,
    description,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: async () => json(await execute())
  };
}

function inputTool(name, description, field, schema, execute) {
  const properties = field ? { [field]: schema } : {};
  return {
    name,
    description,
    inputSchema: { type: 'object', properties, ...(field ? { required: [field] } : {}), additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    execute: async (input) => json(await execute(input))
  };
}
