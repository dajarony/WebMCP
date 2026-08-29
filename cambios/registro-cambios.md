# Registro de cambios — Auralis Operator Desk

> Append-only. Las entradas existentes no se reescriben.

## 2026-08-29 — adopción SUME y contrato P1

**Files affected:**
- `AGENTS.md`, `STATUS.md`, `SUME-README.md`, `.sume`
- `docs/PLAYBOOK.md`, `docs/cmcf/operator-desk-p1.md`
- `contratos/faser/approval-boundary.faser.md`
- `cambios/`, `mapa-global/`

**Motive:**
- Convertir el P0 WebMCP en un proyecto trazable con límites, contratos y ECA
  antes de ampliar o refactorizar la demo.

**Impact:**
- Las herramientas y la frontera humana siguen siendo la fuente funcional.
- La FASER es Draft; no autoriza ampliar comportamiento sin revisión humana.

**Author:** Codex con metodologías Dajarony, autorizado por el propietario.

## 2026-08-29 — superficie WebMCP viva y contextual P2

**Files affected:**
- `contratos/case-agent-surface-contracts.js`, `contratos/faser/`,
  `contratos/scp/`, `contratos/workspace-page-contracts.js`
- `entradas/case-agent-surface-registry.js`,
  `entradas/webmcp-contract-registrar.js`, `entradas/app.js`
- `logica/case-component-context.js`, `logica/live-capability-inspector.js`,
  `logica/page-manifest.js`
- `salidas/component-surface-renderer.js`, `case.html`, `styles.css`, `tests/`

**Motive:**
- Hacer visible para el agente el esqueleto declarado de la página, sus
  formularios y el ciclo de capacidades contextuales sin dar control genérico
  sobre el DOM o una herramienta de ejecución arbitraria.

**Impact:**
- `read_page_tree` separa contratos declarados de nombres accesibles observados
  en el documento actual.
- Dos tools de diagnóstico se registran únicamente tras seleccionar un
  componente ficticio cerrado y se retiran mediante `AbortSignal` al limpiar.
- Las observaciones vivas no se convierten en autoridad ni se invocan.
- Se divide el render/registro para que todo módulo SUME quede en 130 líneas o
  menos; la ECA de arquitectura impide regresiones de tamaño, mapa o DOCBLOCK.
- Se corrige el constructor del renderizador contextual para que el arranque de
  la página no falle al usar el `document` del navegador por defecto; la ECA
  cubre el bootstrap y el render vacío.

**Author:** Codex con metodologías Dajarony, autorizado por el propietario.

## 2026-08-29 — manifiesto semántico WebMCP multipágina P1

**Files affected:**
- `index.html`, `case.html`, `styles.css`, `README.md`, `docs/`
- `contratos/workspace-page-contracts.js`, `contratos/tool-errors.js`
- `logica/page-manifest.js`, `entradas/workspace-navigation-registry.js`
- `entradas/directory-app.js`, `entradas/app.js`, `tests/`, `mapa-global/`

**Motive:**
- Permitir descubrimiento de páginas y capacidades de forma explícita antes de
  que el agente opere sobre el caso, sin entregar control genérico del navegador.

**Impact:**
- Se añaden tres tools globales: catálogo, árbol curado y navegación por ID.
- Las rutas están cerradas a dos documentos locales; no se aceptan URL, query,
  fragmento, selector, DOM bruto ni decisiones humanas por WebMCP.
- Los cinco nombres de tool de caso y la frontera de aprobación se conservan.

**Author:** Codex con metodologías Dajarony, autorizado por el propietario.
