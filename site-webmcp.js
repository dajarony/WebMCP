import { publicSiteManifest, resolveCapabilityPage } from './site-capabilities.js';

function json(value) {
  return JSON.stringify(value, null, 2);
}

export function resolveNavigationTarget(pageId, baseHref = globalThis.location?.href || 'http://localhost/') {
  const page = resolveCapabilityPage(pageId);
  if (!page) throw new Error(`Unknown capability page: ${pageId}`);

  const base = new URL(baseHref);
  const target = new URL(page.href, base);
  if (target.origin !== base.origin) throw new Error('Capability navigation must remain same-origin.');
  return { page, targetHref: target.href };
}

export async function registerSiteWebMCPTools({
  getCapabilityTree,
  navigate,
  modelContext = document.modelContext,
  baseHref = globalThis.location?.href || 'http://localhost/'
}) {
  const tools = [
    {
      name: 'describe_site_capabilities',
      description: 'Describe the Auralis Operator Desk as a multi-page WebMCP site. Returns the global capabilities, declared pages and the tools each page advertises.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: true
      },
      execute: async () => json(publicSiteManifest(new URL(baseHref).pathname))
    },
    {
      name: 'read_page_capability_tree',
      description: 'Read the semantic capability tree for the active page: current page identity, exposed UI regions/forms, live WebMCP tools, page-local capabilities and global site capabilities.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: true
      },
      execute: async () => json(await getCapabilityTree())
    },
    {
      name: 'navigate_to_capability_page',
      description: 'Navigate the active browser tab to another page declared by the Auralis site capability map. Use describe_site_capabilities first when the desired page id is unknown.',
      inputSchema: {
        type: 'object',
        properties: {
          page_id: {
            type: 'string',
            enum: ['case-workspace', 'asset-inspector'],
            description: 'Stable page id from the site capability map.'
          }
        },
        required: ['page_id'],
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: true
      },
      execute: async ({ page_id }) => {
        const { page, targetHref } = resolveNavigationTarget(page_id, baseHref);
        queueMicrotask(() => navigate(targetHref));
        return json({
          ok: true,
          pageId: page.id,
          title: page.title,
          navigationRequested: true
        });
      }
    }
  ];

  for (const tool of tools) {
    await modelContext.registerTool(tool);
  }

  return tools.map((tool) => tool.name);
}
