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
