# CMCF — Agent Surface viva P2

## 1. Intención Global

Permitir que el agente descubra las capacidades declaradas y realmente activas
de la página actual, incluidos formularios y capacidades contextuales, sin
recibir control genérico del DOM ni autoridad humana.

## 2. Alcance

**Dentro:** lectura de tools vivas mediante WebMCP, revisión de cambios con
`toolchange`, selector local de componente, dos tools contextuales y formularios
curados en el árbol semántico.

**Fuera:** scraping, selectores, coordenadas, URL arbitrarias, iframes de otro
origen, ejecución de JavaScript arbitrario, red, almacenamiento, mensajes
reales, credenciales y aprobación automática.

## 3. Bloques principales

| Bloque | Propósito | Estado propio | Interfaz pública |
| --- | --- | --- | --- |
| Inspector vivo | Leer nombres de tools accesibles por `getTools()` | No | `inspectLiveCapabilities()` |
| Contexto de componente | Seleccionar o limpiar un componente de demo | Sí | `list`, `select`, `clear`, `read`, `prepareDraft` |
| Registro contextual | Registrar/desregistrar tools según selección | Sí | `register`, `selectComponent`, `runtimeSurface` |
| Árbol semántico | Combinar árbol declarado, formularios y estado contextual | No | `readPageTree(pageId, runtime)` |
| Render de componente | Mostrar selección, borrador y revisión de capacidades | No | `render(snapshot)` |

## 4. UAFs

| Bloque | UAF | Propósito | Validación | Error |
| --- | --- | --- | --- | --- |
| Inspector | `inspectLiveCapabilities()` | Ver catálogo accesible real | API `getTools` disponible | `LIVE_CAPABILITY_UNAVAILABLE` como fallback informativo |
| Contexto | `select(componentId)` | Activar contexto conocido | ID cerrado | `COMPONENT_NOT_FOUND` |
| Contexto | `clear()` | Eliminar contexto y borrador | sin entrada | — |
| Contexto | `readSelected()` | Leer componente activo | selección presente | `COMPONENT_NOT_SELECTED` |
| Contexto | `prepareDraft(observation)` | Crear borrador local de diagnóstico | texto 1–1000 | `INVALID_COMPONENT_DIAGNOSTIC` |
| Registro | `syncDynamicTools()` | Activar/desactivar tools contextuales | estado de componente | fail-closed |

## 5. Flujo de datos

1. Cada página registra sus tools base.
2. El inspector obtiene sólo nombres de tools accesibles del documento actual.
3. El agente selecciona un componente cerrado o lo limpia.
4. El registro contextual añade o elimina dos tools mediante `AbortSignal`.
5. WebMCP emite `toolchange`; el registro incrementa la revisión local.
6. `read_page_tree` devuelve árbol declarado, formularios y estado vivo.
7. El renderizador muestra la misma selección/borrador a la persona.

## 6. Eventos

| Evento | Emisor | Consumidor | Carga |
| --- | --- | --- | --- |
| `component_selected` | Contexto | Registro/render | ID cerrado |
| `component_cleared` | Contexto | Registro/render | ninguno |
| `toolchange` | WebMCP | Registro | sin confiar en la carga |
| `capability_revision_changed` | Registro | árbol/render | revisión y nombres propios |

## 7. Decisiones y riesgos

- Se usa `getTools()` sólo para observación; nunca concede una autorización.
- Se registran tools dinámicas sólo desde contratos internos y IDs cerrados.
- Se rechaza una megatool `invoke_anything` porque escondería contratos y
  ampliaría autoridad.
- Riesgo dominante: confundir tools declaradas con tools vivas; se mitiga
  devolviendo ambos conjuntos y el estado de observación por separado.
- No promete que todos los navegadores soporten WebMCP ni que una navegación
  devuelva un resultado serializado.

## 8. Siguiente artefacto

`contratos/faser/case-agent-surface-lifecycle.faser.md` y SCP Draft de las dos
pantallas del workspace.
