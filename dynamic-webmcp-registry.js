function toolSignature(tool) {
  return JSON.stringify({
    name: tool.name,
    title: tool.title || null,
    description: tool.description || '',
    inputSchema: tool.inputSchema || null,
    annotations: tool.annotations || null
  });
}

export class DynamicWebMCPRegistry {
  constructor(modelContext) {
    if (!modelContext || typeof modelContext.registerTool !== 'function') {
      throw new Error('A WebMCP modelContext with registerTool() is required.');
    }
    this.modelContext = modelContext;
    this.active = new Map();
  }

  list() {
    return [...this.active.keys()].sort();
  }

  async sync(definitions = []) {
    const desired = new Map();

    for (const tool of definitions) {
      if (!tool?.name || typeof tool.execute !== 'function') {
        throw new Error('Dynamic WebMCP tools require a name and execute function.');
      }
      if (desired.has(tool.name)) {
        throw new Error(`Duplicate dynamic WebMCP tool: ${tool.name}`);
      }
      desired.set(tool.name, { tool, signature: toolSignature(tool) });
    }

    for (const [name, current] of this.active) {
      const next = desired.get(name);
      if (!next || next.signature !== current.signature) {
        current.controller.abort();
        this.active.delete(name);
      }
    }

    for (const [name, next] of desired) {
      if (this.active.has(name)) continue;
      const controller = new AbortController();
      await this.modelContext.registerTool(next.tool, { signal: controller.signal });
      this.active.set(name, {
        controller,
        signature: next.signature
      });
    }

    return this.list();
  }

  clear() {
    for (const current of this.active.values()) current.controller.abort();
    this.active.clear();
  }
}
