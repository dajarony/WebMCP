# STATUS — Auralis Operator Desk

## Estado actual

- Fecha: 2026-08-29
- Fase: P1 — adopción SUME + ampliación ECA
- P0: interfaz estática WebMCP con cinco tools y frontera de aprobación
  implementada antes de SUME.
- Universal MCP: fuera de alcance y sin dependencias.
- Producción: no; demo pública del hackathon.

## Evidencia disponible

- `npm test`: 18/18 pruebas unitarias/ECA verdes en la verificación local del
  2026-08-29, incluyendo manifiesto multipágina, árbol curado y navegación
  cerrada.
- CI y workflow de GitHub Pages existen; Pages requiere habilitación del
  propietario en GitHub.

## Gate P1

- SUME + mapa global con guardia automática.
- FASER Draft de frontera de aprobación.
- ECA de herramientas WebMCP, validación defensiva y replay.
- ECA de páginas declaradas, árbol curado y navegación local fail-closed.
- La demo visible conserva sus cinco tools de caso y suma tres tools globales
  por página.

## Siguiente frontera

Prueba E2E manual en un navegador compatible con WebMCP y revisión humana de
los contratos Draft antes de cerrar P1 o ampliar funcionalidad de producto.
