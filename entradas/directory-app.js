/*
SUME DOCBLOCK

Nombre: directory-app
Tipo: Entrada

Entradas:
- Carga de la página directorio, document.modelContext y location del navegador.

Acciones:
- Registra las tools globales de descubrimiento y muestra su estado visible.

Salidas:
- Directorio navegable por humano y agente, sin herramientas de caso o aprobación.
*/

import { listWorkspacePages } from '../contratos/workspace-page-contracts.js';
import { registerWorkspaceNavigationTools } from './workspace-navigation-registry.js';

const status = document.querySelector('#webmcp-status');
const list = document.querySelector('#workspace-page-list');

for (const page of listWorkspacePages()) {
  const item = document.createElement('article');
  item.className = 'directory-card';
  const title = document.createElement('h2');
  title.textContent = page.title;
  const description = document.createElement('p');
  description.textContent = page.summary;
  const tools = document.createElement('p');
  tools.className = 'tool-summary';
  tools.textContent = `${page.toolNames.length} declared WebMCP tools`;
  const link = document.createElement('a');
  link.href = page.path;
  link.textContent = 'Open page';
  item.append(title, description, tools, link);
  list.append(item);
}

try {
  const tools = await registerWorkspaceNavigationTools({
    pageId: 'workspace_directory',
    locationRef: window.location
  });
  status.textContent = `${tools.length} global WebMCP tools ready`;
  status.className = 'status status-ready';
} catch (error) {
  console.error('WebMCP registration failed', error);
  status.textContent = error.code === 'WEBMCP_UNAVAILABLE'
    ? 'WebMCP unavailable in this browser'
    : 'WebMCP registration failed';
  status.className = 'status status-warn';
}
