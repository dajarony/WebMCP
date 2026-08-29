---
id: P1WorkspaceDirectoryScreen
name: Auralis Workspace Directory
route: /index.html
type: Component
category: list_screen
scp_version: 1.0.0
status: Draft
---

# P1WorkspaceDirectoryScreen — Auralis Workspace Directory

## 1. Goal

Permitir a persona y agente descubrir sólo las páginas declaradas del workspace.

## 2. Scope

**In scope:** catálogo de páginas, estado WebMCP, árbol curado y navegación por
`page_id`. **Out of scope:** URL libre, DOM crudo, formularios de caso,
aprobación humana y red.

## 3. Required Modules

```yaml
required_modules:
  directory-bootstrap: { required: true, lazy: false, reason: registra tools globales }
  workspace-navigation-registry: { required: true, lazy: false, reason: árbol y navegación cerrada }
```

## 4. Dependencies (DI)

```yaml
view_model: none
services: [document.modelContext, window.location]
repositories: []
```

## 5. Allowed States

```yaml
states: { initial: true, ready: true, webmcp_unavailable: true, error: true }
```

## 6. Input Data

```yaml
input_data:
  page_manifest: { type: immutable local list, required: true, source: derived }
```

## 7. Widgets Used

Directorio de páginas, enlaces locales y estado textual WebMCP.

## 8. Allowed Actions

```yaml
actions:
  open_workspace_page:
    input: page_id declared in manifest
    allowed_when: [ready]
    blocked_when: [error]
    effect: request fixed local navigation
    navigation: /case.html or /index.html
```

## 9. Navigation

```yaml
entry: { allowed_from: [app_start, /case.html] }
exit: { allowed_to: [/index.html, /case.html] }
```

## 10. Validations

- `page_id` existe exactamente en el manifiesto.
- `path` cumple `./<nombre>.html` y no contiene esquema, query ni fragmento.

## 11. Possible Errors

```yaml
errors:
  PAGE_NOT_FOUND: { user_message: Declared page not found, fallback: stay on current page }
  PAGE_NAVIGATION_DENIED: { user_message: Navigation is not allowed, fallback: stay on current page }
  WEBMCP_UNAVAILABLE: { user_message: WebMCP unavailable in this browser, fallback: human links remain usable }
```

## 12. Expected Result

La persona ve las páginas declaradas; el agente recibe sólo catálogo, árbol y
navegación local permitida.

## 13. Minimum Tests

```yaml
tests:
  render: [directory lists declared pages]
  interaction: [declared page requests fixed local route]
  state: [unknown page changes no state]
  accessibility: [status and navigation labels are visible text]
```

---

## Decisions Made and Discarded

- Se elige manifiesto inmutable para impedir navegación arbitraria.
- Se rechaza un navegador/selector genérico para preservar la frontera segura.

## Status Timeline

- 2026-08-29: Created as Draft.
