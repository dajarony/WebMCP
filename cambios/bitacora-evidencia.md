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

---

## 2026-08-29 · ECA P2 · superficie viva y capacidades contextuales

**Qué se hizo:** se añadió una superficie de agente contextual para el caso de
demo. El árbol curado incluye formularios declarados, la lectura del árbol
separa contratos declarados de nombres observados mediante WebMCP, y un
componente ficticio válido activa dos tools adicionales. Limpiar la selección
retira las tools mediante `AbortSignal` y elimina el borrador local.

**Evidencia:** `npm test` terminó con 28/28 pruebas verdes. Las ECA demuestran
alta/baja contextual, conservación del estado ante un ID inválido, borradores
locales y acotados, distinción entre observación y autoridad, incremento de
revisión por `toolchange`, fallback explícito si `getTools()` falla y la
invariancia humana de aprobación. La guardia SUME cubre cada módulo, DOCBLOCK y
el máximo de 130 líneas.

**Límites declarados:** no se consultaron ni invocaron herramientas de otros
orígenes; `getTools()` sólo informa nombres accesibles del documento activo.
No se añadieron selectores, DOM bruto, URL arbitrarias, red, persistencia,
credenciales, envío de mensajes, aprobación automática ni efectos externos.

**Errores propios:** el E2E con una implementación real de WebMCP todavía no
se ejecutó; la cobertura actual usa un `modelContext` simulado para comprobar
el contrato y su ciclo de vida. Los avisos de Git sobre el ignore global de la
cuenta Windows no alteraron el resultado de las pruebas.

**Decisión:** mantener P2 en Draft y no conectar el repositorio con Universal
MCP. El siguiente gate es una demo manual compatible con WebMCP que compruebe
el ciclo completo de descubrimiento y retirada contextual.

**Qué NO se tocó:** Universal MCP, OAuth, P20, P21, Trinidad, credenciales,
proveedores externos, GitHub Pages ni datos reales.

---

## 2026-08-29 · E2E local WebMCP · ciclo contextual P2

**Qué se hizo:** se sirvió la demo únicamente en `localhost` y se abrió la
pantalla de caso en un navegador compatible con WebMCP. Se verificó el
registro real de las tools, se seleccionó el componente ficticio
`condenser_fan`, se leyó de nuevo el árbol semántico y luego se limpió el
contexto.

**Evidencia:** la página registró 11 tools base. Tras seleccionar el
componente, `read_page_tree` informó revisión `2`, dos tools contextuales y el
formulario de diagnóstico. La inspección viva coincidió con las 13 tools
declaradas, sin nombres inesperados. Tras limpiar, la revisión pasó a `3`, las
tools dinámicas quedaron vacías y el formulario contextual desapareció.
`npm test` terminó con 28/28 pruebas verdes, incluyendo la nueva regresión del
constructor del renderizador contextual.

**Límites declarados:** se usaron solamente datos ficticios y tools de estado
local. No se llamó a `request_sensitive_action`, no hubo aprobación, envío,
red externa, credenciales, archivos ni acciones irreversibles.

**Errores propios:** la primera revisión visual detectó un constructor que no
aceptaba el argumento por defecto; se corrigió y se añadió una ECA antes de
repetir el E2E. Una pestaña previa conservaba módulos en caché, por lo que la
confirmación final se realizó en una sesión local limpia.

**Decisión:** P2 mantiene estado Draft hasta la revisión humana de contratos,
pero su ciclo funcional WebMCP está demostrado en navegador real. No integrar
con Universal MCP durante esta fase.
