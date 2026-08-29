# STATUS — Auralis Operator Desk

## Estado actual

- Fecha: 2026-08-29
- Fase: P2 — superficie de agente viva y contextual (Draft, abierta)
- P0: interfaz estática WebMCP con cinco tools y frontera de aprobación
  implementada antes de SUME.
- Universal MCP: fuera de alcance y sin dependencias.
- Producción: no; demo pública del hackathon.

## Evidencia disponible

- `npm test`: 28/28 pruebas unitarias/ECA verdes en la verificación local del
  2026-08-29, incluyendo manifiesto multipágina, árbol curado, navegación
  cerrada, ciclo contextual, observación viva y guardia SUME de tamaño.
- CI y workflow de GitHub Pages existen; Pages requiere habilitación del
  propietario en GitHub.
- Prueba manual local con un navegador WebMCP: 11 tools base registradas; la
  selección de componente expuso 2 tools contextuales, el árbol las observó y
  limpiarlas las retiró. No se enviaron datos ni se ejecutaron acciones
  sensibles.

## Gate P2

- SUME + mapa global con guardia automática.
- FASER Draft de frontera de aprobación.
- ECA de herramientas WebMCP, validación defensiva y replay.
- ECA de páginas declaradas, árbol curado y navegación local fail-closed.
- La demo visible conserva sus cinco tools de caso y suma tres tools globales
  por página.
- El caso suma tres tools de componente siempre declaradas y dos tools
  contextuales que sólo existen con un componente de demo válido.
- `read_page_tree` separa herramientas declaradas de nombres observados por
  WebMCP; lo observado no concede autoridad.
- La guardia SUME exige DOCBLOCK, mapa exacto y máximo de 130 líneas físicas
  para cada módulo JavaScript bajo las raíces SUME.

## Siguiente frontera

Prueba E2E manual en un navegador compatible con WebMCP: `list → tree → open
→ select component → toolchange → tree → clear → rediscovery`. Revisión humana
de los contratos Draft antes de cerrar P2 o ampliar funcionalidad de producto.
