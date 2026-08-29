===============================================================
Componente: Workspace Page Manifest
Tipo: Contrato de navegación WebMCP
Estado: Draft
Versión: 0.1.0
Entradas: page_id, manifiesto local inmutable y evento de navegación
Acciones: listar páginas, leer árbol semántico y abrir una página permitida
Salidas: catálogo saneado, árbol curado o error tipado
===============================================================

## DEFINICIÓN

Descripción: contrato que permite al agente descubrir la estructura funcional
de una aplicación WebMCP multipágina sin recibir control genérico del DOM ni
una primitiva de navegación arbitraria.

Objetivo: exponer sólo páginas locales permitidas, sus herramientas declaradas
y nodos semánticos elegidos por la aplicación.

## ESTADO

@workspace_pages: lista inmutable de `{id, path, title, summary, tool_names}`.
  mutable: no.
  propietario: `workspace-page-contracts`.

@page_tree: árbol semántico curado por `page_id`.
  mutable: no.
  propietario: `page-manifest`.

No existe estado de URL introducido por el agente. La navegación real pertenece
al navegador y recibe únicamente una ruta fija resuelta desde `page_id`.

## ACCIONES

1. `list_workspace_pages`: devuelve la lista completa y estable del manifiesto.
2. `read_page_tree(page_id opcional)`: devuelve sólo el árbol curado de la
   página actual o de otra página conocida; nunca serializa el DOM.
3. `open_workspace_page(page_id)`: resuelve una ruta local exacta y solicita
   navegación del navegador; no acepta URL, hash, query, selector ni origen.

## VALIDACIONES

- `page_id` debe coincidir exactamente con un ID del manifiesto.
- La ruta debe ser relativa fija y no contener esquema, host, query o fragmento.
- Todo árbol sólo declara roles, etiquetas, acciones WebMCP y controles humanos
  que el producto ha elegido hacer visibles.
- La navegación no aprueba, rechaza, aplica ni crea una propuesta.

## ERRORES Y FALLBACK

- `PAGE_NOT_FOUND`: ID ausente/desconocido; no navegar.
- `PAGE_NAVIGATION_DENIED`: ruta no local/fuera del manifiesto; no navegar.
- `WEBMCP_UNAVAILABLE`: no registrar tools; la navegación humana por enlaces
  normales sigue disponible.

## ECA

1. El catálogo contiene sólo los IDs declarados y rutas locales.
2. Un árbol de página expone sus tools y controles humanos previstos.
3. Un `page_id` permitido solicita exactamente su ruta local.
4. Un ID inventado, URL absoluta o query no provoca navegación.
5. El manifiesto no ofrece tools de aprobación/rechazo humano.
6. El árbol no depende de `querySelectorAll`, selector recibido ni DOM oculto.

## REGLAS CRÍTICAS

- Nunca ofrecer navegación por URL arbitraria.
- Nunca exponer el DOM completo como contrato de agente.
- Nunca usar el árbol para eludir Approval Boundary.
