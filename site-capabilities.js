export const SITE_CAPABILITY_MANIFEST = {
  id: 'webmcp-operator-workspace',
  title: 'WebMCP Operator Workspace',
  description: 'A multi-page WebMCP workspace where each page exposes a semantic capability surface to agents while humans retain control of sensitive actions.',
  globalCapabilities: [
    {
      id: 'site.describe',
      tool: 'describe_site_capabilities',
      kind: 'read',
      scope: 'global',
      description: 'Describe the site-level capability map, including pages and their advertised WebMCP tools.'
    },
    {
      id: 'site.page_tree',
      tool: 'read_page_capability_tree',
      kind: 'read',
      scope: 'global',
      description: 'Read the semantic skeleton of the active page, including exposed UI regions, forms and live WebMCP tools.'
    },
    {
      id: 'site.navigate',
      tool: 'navigate_to_capability_page',
      kind: 'navigation',
      scope: 'global',
      description: 'Navigate to another page declared in the site capability map.'
    }
  ],
  pages: [
    {
      id: 'case-workspace',
      title: 'Case Workspace',
      href: './index.html',
      matches: ['/', '/index.html'],
      description: 'Shared service-case workspace with planning, drafting, human approval and audit history.',
      capabilities: [
        { tool: 'read_case_context', kind: 'read', description: 'Read the active case and shared case state.' },
        { tool: 'create_work_plan', kind: 'prepare', description: 'Prepare a work plan in the shared workspace.' },
        { tool: 'prepare_customer_update', kind: 'prepare', description: 'Prepare a customer update without sending it.' },
        { tool: 'request_sensitive_action', kind: 'proposal', description: 'Create a sensitive action proposal for human approval.' },
        { tool: 'apply_approved_action', kind: 'execute', description: 'Apply a proposal only after a single-use human approval.' },
        { tool: 'list_case_components', kind: 'read', description: 'List declared components available for contextual inspection.' },
        { tool: 'select_case_component', kind: 'prepare', description: 'Select a declared component and expose its bounded contextual tools.' },
        { tool: 'clear_case_component_selection', kind: 'prepare', description: 'Clear component context and remove contextual tools.' }
      ],
      contextualCapabilities: [
        {
          tool: 'read_selected_component',
          kind: 'read',
          availability: 'component-selected',
          description: 'Read the selected component only while a declared component context is active.'
        },
        {
          tool: 'prepare_component_diagnostic',
          kind: 'prepare',
          availability: 'component-selected',
          description: 'Prepare a bounded local diagnostic only while a declared component context is active.'
        }
      ]
    },
    {
      id: 'asset-inspector',
      title: 'Asset Inspector',
      href: './asset.html',
      matches: ['/asset.html'],
      description: 'Asset-focused inspection page with page-specific tools and an agent-readable inspection form.',
      capabilities: [
        { tool: 'read_asset_context', kind: 'read', description: 'Read current asset telemetry and inspection context.' },
        { tool: 'set_inspection_focus', kind: 'prepare', description: 'Set the current inspection focus visible to the human.' },
        { tool: 'prepare_inspection_note', kind: 'prepare', description: 'Prepare an inspection note in the page form for human review.' }
      ],
      contextualCapabilities: []
    }
  ]
};

function normalizePath(pathname) {
  if (!pathname) return '/';
  return pathname || '/';
}

export function currentPageDescriptor(pathname = globalThis.location?.pathname || '/') {
  const normalized = normalizePath(pathname);
  return SITE_CAPABILITY_MANIFEST.pages.find((page) =>
    page.matches.some((match) => normalized === match || normalized.endsWith(match))
  ) || SITE_CAPABILITY_MANIFEST.pages[0];
}

export function publicSiteManifest(pathname = globalThis.location?.pathname || '/') {
  const current = currentPageDescriptor(pathname);
  return {
    id: SITE_CAPABILITY_MANIFEST.id,
    title: SITE_CAPABILITY_MANIFEST.title,
    description: SITE_CAPABILITY_MANIFEST.description,
    currentPageId: current.id,
    globalCapabilities: SITE_CAPABILITY_MANIFEST.globalCapabilities.map((item) => ({ ...item })),
    pages: SITE_CAPABILITY_MANIFEST.pages.map((page) => ({
      id: page.id,
      title: page.title,
      href: page.href,
      description: page.description,
      advertisedCapabilities: page.capabilities.map((item) => ({ ...item })),
      contextualCapabilities: page.contextualCapabilities.map((item) => ({ ...item }))
    }))
  };
}

export function resolveCapabilityPage(pageId) {
  return SITE_CAPABILITY_MANIFEST.pages.find((page) => page.id === pageId) || null;
}
