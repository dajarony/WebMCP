---
id: P2OperatorCaseScreen
name: Auralis Operator Case
route: /case.html
type: Component
category: detail_screen
scp_version: 1.0.0
status: Draft
---

# P2OperatorCaseScreen — Auralis Operator Case

## 1. Goal

Permitir colaboración sobre un caso ficticio con herramientas contextuales y
una frontera de aprobación exclusivamente humana.

## 2. Scope

**In scope:** caso, plan, borradores, componente seleccionado, herramientas
vivas, propuesta y aplicación single-use. **Out of scope:** envío, red,
credenciales, DOM genérico, aprobación del agente y efectos externos.

## 3. Required Modules

```yaml
required_modules:
  page-bootstrap: { required: true, lazy: false, reason: compone el caso }
  operator-workspace: { required: true, lazy: false, reason: estado compartido }
  approval-boundary: { required: true, lazy: false, reason: autoridad humana }
  case-agent-surface-registry: { required: true, lazy: false, reason: tools dinámicas }
```

## 4. Dependencies (DI)

```yaml
view_model: OperatorWorkspace
services: [document.modelContext, window.location]
repositories: []
```

## 5. Allowed States

```yaml
states: { initial: true, ready: true, component_selected: true, webmcp_unavailable: true, error: true }
```

## 6. Input Data

```yaml
input_data:
  demo_case: { type: immutable local object, required: true, source: derived }
  component_id: { type: closed enum, required: false, source: WebMCP tool }
  observation: { type: bounded string, required: false, source: WebMCP tool }
```

## 7. Widgets Used

Caso, plan, borrador de cliente, superficie de componente, frontera de
aprobación, historial y enlace al directorio.

## 8. Allowed Actions

```yaml
actions:
  select_case_component:
    input: closed component_id
    allowed_when: [ready, component_selected]
    blocked_when: [error]
    effect: updates local context and dynamic tools
    navigation: none
  apply_approved_action:
    input: approved proposal_id
    allowed_when: [ready, component_selected]
    blocked_when: [error]
    effect: applies one local approved proposal
    navigation: none
```

## 9. Navigation

```yaml
entry: { allowed_from: [/index.html, app_start] }
exit: { allowed_to: [/index.html] }
```

## 10. Validations

- Sólo IDs de componente declarados.
- Diagnóstico entre 1 y 1000 caracteres.
- Una propuesta se aplica sólo si está `approved` y no consumida.
- Ninguna tool aprueba ni rechaza.

## 11. Possible Errors

```yaml
errors:
  COMPONENT_NOT_FOUND: { user_message: Unknown component, fallback: preserve prior selection }
  COMPONENT_NOT_SELECTED: { user_message: Select a component first, fallback: no dynamic operation }
  ACTION_DENIED: { user_message: Human approval is required, fallback: no execution }
  WEBMCP_UNAVAILABLE: { user_message: WebMCP unavailable, fallback: human UI remains readable }
```

## 12. Expected Result

La persona ve el mismo plan, borrador, componente y propuesta que el agente
prepara; las capacidades dinámicas sólo existen con contexto válido.

## 13. Minimum Tests

```yaml
tests:
  render: [case and component status are visible]
  interaction: [selection adds and clear removes contextual tools]
  state: [approval remains human-only and single-use]
  accessibility: [component and capability states use visible text]
```

---

## Decisions Made and Discarded

- Se elige cambio de tools por ciclo de vida WebMCP, no una megatool genérica.
- Se rechaza enviar o ejecutar diagnósticos fuera de la demo local.

## Status Timeline

- 2026-08-29: Created as Draft.
