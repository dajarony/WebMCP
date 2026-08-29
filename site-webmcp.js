import {
  SITE_CAPABILITY_MANIFEST,
  publicSiteManifest,
  resolveCapabilityPage
} from './site-capabilities.js';

function json(value) {
  return JSON.stringify(value, null, 2);
}

export async function registerSiteWebMCPTools({ getCapabilityTree, navigate }) {
  const pageIds = SITE_CAPABILITY_MANIFEST.pages.map((page) => page.id);
  const tools = [
    {
      name: 'describe_site_capabilities',
      description: 'Describe the Auralis Operator Desk as a multi-page WebMCP site. Returns global capabilities, declared pages, base tools and contextual tools each page may publish.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: true
      },
      execute: async () => json(publicSiteManifest())
    },
    {
      name: 'read_page_capability_tree',
      description: 'Read the semantic capability tree for the active page: page identity, exposed UI regions/forms, live WebMCP tools, base capabilities, contextual capabilities and global site capabilities.',
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
      description: 'Navigate the active browser tab to another page declared by the Auralis site capability map. The agent supplies only a stable page id, never a URL.',
      inputSchema: {
        type: 'object',
        properties: {
          page_id: {
            type: 'string',
            enum: pageIds,
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
        const page = resolveCapabilityPage(page_id);
        if (!page) throw new Error(`Unknown capability page: ${page_id}`);
        const result = {
          ok: true,
          pageId: page.id,
          title: page.title,
          navigationRequested: true
        };
        queueMicrotask(() => navigate(page.href));
        return json(result);
      }
    }
  ];

  for (const tool of tools) {
    await document.modelContext.registerTool(tool);
  }

  return tools.map((tool) => tool.name);
}
