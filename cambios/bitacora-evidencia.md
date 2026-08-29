# Bitácora de evidencia — Auralis Operator Desk

## 2026-08-29 · medición local · auditoría P0 antes de SUME

**Qué se hizo:** se clonó el repositorio público y se revisaron interfaz,
registro WebMCP, frontera de aprobación, documentación, workflows y tests.

**Evidencia:** `npm test` terminó con 5/5 pruebas verdes. El repositorio tiene
cinco tools registradas, MIT, CI y workflow Pages. No existían `AGENTS.md`,
`STATUS.md`, `.sume`, mapa global, contratos FASER ni una ECA de registro
WebMCP.

**Límites declarados:** esta medición no ejecutó WebMCP dentro de ChatGPT/Chrome
ni desplegó GitHub Pages. Las cinco pruebas cubrían sólo `ApprovalBoundary`.

**Errores propios:** no se detectó un fallo funcional en la Boundary durante
esta medición; sí una carencia de trazabilidad y cobertura ECA de integración.

**Decisión:** adoptar SUME + STDG y documentar P1 antes de refactorizar. La
demo P0 y Universal MCP permanecen fuera de modificación durante la auditoría.

**Qué NO se tocó:** Universal MCP, OAuth, P20, P21, Trinidad, credenciales,
proveedores externos, GitHub Pages y datos reales.

**Siguiente acción:** crear módulos SUME equivalentes, guardia de arquitectura y
ECA sin alterar los cinco nombres de tool ni el flujo visible de demo.

---

## 2026-08-29 · ECA P1 · manifiesto semántico WebMCP multipágina

**Qué se hizo:** se añadió un directorio de workspace y una página de caso.
Cada documento registra las tres tools globales de descubrimiento: catálogo de
páginas declaradas, árbol semántico curado y navegación por `page_id`; la página
de caso añade sus cinco tools preexistentes.

**Evidencia:** `npm test` terminó con 18/18 pruebas verdes. Las ECA verifican
que el catálogo contiene sólo `workspace_directory` y `operator_case`, que el
árbol del caso expone regiones y los controles humanos esperados, que la
navegación de `operator_case` solicita exactamente `./case.html`, y que un ID
inventado no llega al navegador. La guardia SUME confirmó un DOCBLOCK y una
entrada de mapa para cada módulo fuente.

**Límites declarados:** el árbol es un manifiesto definido por la aplicación,
no un volcado del DOM. No expone selectores, valores de formularios, nodos
ocultos, URL arbitrarias, query, fragmentos ni control genérico de navegador.
No añade una tool de aprobación/rechazo humano, red, credenciales, filesystem,
shell ni integraciones externas.

**Errores propios:** no se detectaron fallos en las ECA. La prueba E2E real con
un navegador compatible con WebMCP sigue pendiente; los tests usan un
`modelContext` y `location` simulados para demostrar el contrato.

**Decisión:** mantener P1 abierto y pedir revisión humana de los FASER Draft.
Antes de desplegar, ejecutar una demostración real de `list → tree → open →
rediscovery` en ChatGPT/Chrome con WebMCP activo.
