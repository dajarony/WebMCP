# CMCF — Auralis Operator Desk P1

## 1. Intención Global

Permitir que un agente prepare trabajo sobre un caso técnico compartido sin
adquirir autoridad para aprobar una acción sensible.

## 2. Alcance

**Dentro:** directorio de páginas ficticias, manifiesto semántico curado por
página, navegación local entre páginas permitidas, caso ficticio, lectura del
estado, plan, borrador, propuesta, aprobación humana visible, aplicación única
y registro de historial.

**Fuera:** envío real a clientes, agenda real, autenticación, red, Universal
MCP, OAuth, herramientas remotas, filesystem y datos de producción.

## 3. Bloques principales

| Bloque | Propósito | Estado propio | Interfaz pública |
| --- | --- | --- | --- |
| Registro WebMCP | Exponer tools del caso activo | No | `registerWebMCPTools(api)` |
| Navegación Workspace | Exponer páginas y árbol semántico curado | No | `registerWorkspaceNavigationTools(pageId)` |
| Manifiesto de páginas | Declarar páginas, rutas y nodos visibles | No | `getPageManifest(pageId)` |
| Workspace | Mantener caso, plan, borrador e historial | Sí | `read`, `plan`, `draft`, `propose`, `apply` |
| Approval Boundary | Decidir transición de propuesta | Sí | `request`, `approve`, `reject`, `apply` |
| Renderizador | Reflejar estado seguro en DOM | No | `render(state)` |
| Contratos | Declarar inputs y errores | No | tools y errores tipados |

## 4. UAFs

| Bloque | UAF | Propósito | Validación | Error |
| --- | --- | --- | --- | --- |
| Workspace | `createWorkPlan(steps)` | Crear checklist local | 1–8 strings no vacíos | `INVALID_WORK_PLAN` |
| Workspace | `prepareCustomerUpdate(message)` | Crear borrador local | string 1–1500 | `INVALID_CUSTOMER_UPDATE` |
| Boundary | `request(action, reason)` | Crear propuesta | textos no vacíos | `INVALID_PROPOSAL` |
| Boundary | `approve(id)` | Aprobar por evento humano | sólo `pending` | `PROPOSAL_STATE_DENIED` |
| Boundary | `apply(id)` | Consumir aprobación una vez | sólo `approved` no consumida | `ACTION_DENIED` |
| Registro | `registerWebMCPTools(api)` | Registrar contratos | `document.modelContext` presente | `WEBMCP_UNAVAILABLE` |
| Navegación | `listWorkspacePages()` | Listar sólo páginas permitidas | manifiesto inmutable | — |
| Navegación | `readPageTree(pageId)` | Leer esqueleto funcional curado | `pageId` conocido | `PAGE_NOT_FOUND` |
| Navegación | `openWorkspacePage(pageId)` | Navegar sólo a ruta local permitida | `pageId` conocido, ruta relativa fija | `PAGE_NAVIGATION_DENIED` |

## 5. Flujo de datos

1. Cada página carga un manifiesto local inmutable de páginas y árbol semántico.
2. Registro de navegación expone lista, árbol y navegación limitada a rutas del
   manifiesto; no inspecciona ni controla el DOM de forma genérica.
3. La página de caso crea Workspace y Approval Boundary.
4. Registro WebMCP recibe una API limitada del Workspace.
5. Tool válida actualiza sólo Workspace/Boundary.
6. Renderizador proyecta el estado al DOM usando texto, nunca HTML remoto.
7. Evento humano `approve` o `reject` cambia sólo la Boundary.
8. `apply` verifica Boundary y agrega resultado al historial.

## 6. Eventos

| Evento | Emisor | Consumidor | Carga |
| --- | --- | --- | --- |
| `tool_registered` | Registro | Historial/UI | nombre de tool |
| `proposal_requested` | Workspace | Boundary/UI | action, reason, id |
| `proposal_approved` | Humano UI | Boundary | id |
| `proposal_rejected` | Humano UI | Boundary | id |
| `approved_action_applied` | Workspace | Historial/UI | id, acción |
| `workspace_page_open_requested` | Tool navegación | Browser | page_id permitido |

## 7. Decisiones y riesgos

- Se elige estado local ficticio para garantizar una demo reproducible.
- Se rechaza enviar mensajes o planificar visitas reales porque exigiría una
  integración externa no necesaria para demostrar la frontera.
- Riesgo dominante: una refactorización puede romper el registro WebMCP aunque
  los tests de Boundary sigan verdes; se mitiga con ECA de registro y mapa.
- Riesgo de autonomía excesiva: un árbol DOM genérico podría revelar nodos no
  previstos o abrir navegación arbitraria; se mitiga con manifiestos curados,
  IDs de página cerrados y rutas locales fijas.
- No promete disponibilidad de WebMCP en navegadores sin soporte.

## 8. Siguiente artefacto

`contratos/faser/workspace-page-manifest.faser.md` — contrato Draft para
descubrimiento de páginas, árbol curado y navegación local limitada.
