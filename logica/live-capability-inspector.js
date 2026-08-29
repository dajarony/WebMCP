/*
SUME DOCBLOCK

Nombre: live-capability-inspector
Tipo: Lógica

Entradas:
- modelContext WebMCP, tools declaradas y superficie contextual local.

Acciones:
- Observa nombres de tools accesibles con getTools sin conceder autoridad.

Salidas:
- Snapshot saneado de capacidades vivas, declaradas y no declaradas.
*/

function normalizedNames(tools) {
  return [...new Set(tools.map((tool) => tool?.name).filter((name) => typeof name === 'string' && name.length > 0))]
    .sort()
    .slice(0, 64);
}

export async function inspectLiveCapabilities({ modelContext, declaredToolNames, runtimeSurface }) {
  const declared = [...new Set(declaredToolNames)].sort();
  const context = runtimeSurface ? structuredClone(runtimeSurface) : {};
  if (!modelContext || typeof modelContext.getTools !== 'function') {
    return {
      observation: 'unavailable',
      declaredToolNames: declared,
      accessibleToolNames: [],
      unexpectedAccessibleToolNames: [],
      runtimeSurface: context
    };
  }
  try {
    const accessibleToolNames = normalizedNames(await modelContext.getTools());
    return {
      observation: 'observed',
      declaredToolNames: declared,
      accessibleToolNames,
      unexpectedAccessibleToolNames: accessibleToolNames.filter((name) => !declared.includes(name)),
      runtimeSurface: context
    };
  } catch {
    return {
      observation: 'unavailable',
      declaredToolNames: declared,
      accessibleToolNames: [],
      unexpectedAccessibleToolNames: [],
      runtimeSurface: context
    };
  }
}
