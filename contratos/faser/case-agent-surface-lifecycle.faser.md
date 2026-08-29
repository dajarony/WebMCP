===============================================================
Componente: Case Agent Surface Lifecycle
Tipo: Módulo de lógica y registro WebMCP
Estado: Draft
Versión: 0.1.0
Entradas: modelContext, component_id y observation
Acciones: observar tools, seleccionar contexto y registrar/desregistrar tools
Salidas: snapshot vivo, borrador local y contratos WebMCP contextuales
===============================================================

## DEFINICIÓN

Describe la superficie viva del agente en la página de caso. Las tools base
siempre existen; dos tools de componente sólo existen con un componente activo.

## ESTADO

@selected_component: `null | ComponentId` = `null`
  mutable: sí; persistente: no; propietario: `CaseComponentContext`.

@component_draft: `null | {component_id, observation}` = `null`
  mutable: sí; persistente: no; propietario: `CaseComponentContext`.

@dynamic_tool_names: `string[]` = `[]`
  mutable: sí; propietario: `CaseAgentSurfaceRegistry`.

@capability_revision: entero >= 0 = `0`
  mutable: sí; propietario: `CaseAgentSurfaceRegistry`.

## ACCIONES

1. Registrar las tools de selector del componente.
2. Seleccionar sólo un ID cerrado o limpiar la selección.
3. Con selección activa, registrar `read_selected_component` y
   `prepare_component_diagnostic` con un `AbortSignal` propio.
4. Sin selección, abortar esas tools y borrar el borrador local.
5. Al recibir `toolchange`, incrementar revisión y notificar; no usar su carga.
6. Al leer el árbol, devolver por separado tools declaradas y observadas vivas.

## VALIDACIONES

- `component_id in {condenser_fan, compressor}` o limpieza explícita.
- `observation.trim().length in [1, 1000]`.
- Una tool dinámica no se registra si no hay componente activo.
- `getTools()` sólo consulta el documento/origen actual; no solicita orígenes
  externos.

## ERRORES Y FALLBACK

- `COMPONENT_NOT_FOUND`: no cambia selección ni tools.
- `COMPONENT_NOT_SELECTED`: no lee ni prepara borrador.
- `INVALID_COMPONENT_DIAGNOSTIC`: no cambia borrador.
- Si `getTools()` falta/falla, el árbol devuelve observación no disponible y
  conserva los contratos declarados; no inventa tools vivas.

## UX / ACCESIBILIDAD

- La UI muestra componente activo, número de revisión y borrador local.
- El estado se expresa como texto, no sólo color.
- Limpiar selección deja visible que las tools contextuales ya no existen.

## REGLAS CRÍTICAS

- Nunca exponer funciones JavaScript no declaradas por contrato.
- Nunca usar una tool viva observada como permiso automático.
- Nunca exponer DOM, selector, valor oculto, URL externa o autorización humana.
- Nunca enviar el diagnóstico ni ejecutar una acción externa.

## ECA

1. Sin selección, las dos tools dinámicas no están registradas.
2. Selección válida registra exactamente las dos tools y sube revisión.
3. Limpieza las elimina y borra el borrador.
4. ID inválido no registra ni elimina ninguna tool.
5. `toolchange` sube revisión sin modificar componente ni aprobación.
6. Falla de `getTools()` informa estado no observado, no inventa resultados.
