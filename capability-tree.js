import { SITE_CAPABILITY_MANIFEST, currentPageDescriptor } from './site-capabilities.js';

function textLabel(element) {
  return (
    element.getAttribute('aria-label') ||
    element.getAttribute('data-agent-label') ||
    element.querySelector?.('h1,h2,h3,legend,label')?.textContent ||
    element.textContent ||
    element.id ||
    element.tagName
  ).trim().replace(/\s+/g, ' ').slice(0, 180);
}

function describeField(field) {
  return {
    tag: field.tagName.toLowerCase(),
    type: field.getAttribute('type') || null,
    name: field.getAttribute('name') || null,
    id: field.id || null,
    label: field.getAttribute('aria-label') || field.labels?.[0]?.textContent?.trim() || field.getAttribute('placeholder') || field.name || field.id || null,
    required: Boolean(field.required),
    humanOnly: field.hasAttribute('data-human-only')
  };
}

export function readExposedPageSkeleton(root = document) {
  const exposed = [...root.querySelectorAll('[data-agent-expose="true"]')];

  return exposed.map((element) => {
    const node = {
      id: element.getAttribute('data-capability-id') || element.id || null,
      kind: element.getAttribute('data-capability-kind') || element.tagName.toLowerCase(),
      label: textLabel(element),
      tag: element.tagName.toLowerCase(),
      humanOnly: element.hasAttribute('data-human-only')
    };

    if (element.tagName === 'FORM') {
      node.fields = [...element.elements]
        .filter((field) => ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(field.tagName))
        .map(describeField);
    } else {
      const controls = [...element.querySelectorAll('button,a[href],input,select,textarea')]
        .filter((control) => control.closest('[data-agent-expose="true"]') === element)
        .map((control) => ({
          ...describeField(control),
          href: control.tagName === 'A' ? control.getAttribute('href') : null,
          humanOnly: control.hasAttribute('data-human-only') || Boolean(control.closest('[data-human-only]'))
        }));
      if (controls.length) node.controls = controls;
    }

    return node;
  });
}

export async function readLiveWebMCPTools(modelContext = document.modelContext) {
  if (!modelContext?.getTools) return [];
  const tools = await modelContext.getTools();
  return tools.map((tool) => ({
    name: tool.name,
    title: tool.title || null,
    description: tool.description,
    origin: tool.origin || globalThis.location?.origin || null,
    annotations: tool.annotations || null
  }));
}

export function composeCapabilityTree({ pathname, skeleton = [], liveTools = [], contextSurface = null }) {
  const page = currentPageDescriptor(pathname);
  const liveNames = new Set(liveTools.map((tool) => tool.name));
  const contextualCapabilities = page.contextualCapabilities || [];
  const declaredToolNames = [
    ...SITE_CAPABILITY_MANIFEST.globalCapabilities.map((capability) => capability.tool),
    ...page.capabilities.map((capability) => capability.tool),
    ...contextualCapabilities.map((capability) => capability.tool)
  ].sort();
  const unexpectedObservedToolNames = [...liveNames]
    .filter((name) => !declaredToolNames.includes(name))
    .sort();

  return {
    site: {
      id: SITE_CAPABILITY_MANIFEST.id,
      title: SITE_CAPABILITY_MANIFEST.title
    },
    currentPage: {
      id: page.id,
      title: page.title,
      path: pathname,
      description: page.description
    },
    globalCapabilities: SITE_CAPABILITY_MANIFEST.globalCapabilities.map((capability) => ({
      ...capability,
      live: liveNames.has(capability.tool)
    })),
    pageCapabilities: page.capabilities.map((capability) => ({
      ...capability,
      live: liveNames.has(capability.tool)
    })),
    contextualCapabilities: contextualCapabilities.map((capability) => ({
      ...capability,
      active: Boolean(contextSurface?.dynamicToolNames?.includes(capability.tool)),
      live: liveNames.has(capability.tool)
    })),
    contextualSurface: contextSurface,
    declaredToolNames,
    unexpectedObservedToolNames,
    observationPolicy: 'Observed WebMCP names are informational only; this application invokes only its declared contracts.',
    semanticSkeleton: skeleton,
    liveWebMCPTools: liveTools,
    availablePages: SITE_CAPABILITY_MANIFEST.pages.map(({ id, title, href, description }) => ({
      id, title, href, description, current: id === page.id
    }))
  };
}

export async function buildCapabilityTree({ pathname = globalThis.location?.pathname || '/', root = document, contextSurface = null } = {}) {
  const [skeleton, liveTools] = await Promise.all([
    Promise.resolve(readExposedPageSkeleton(root)),
    readLiveWebMCPTools(root.modelContext)
  ]);
  return composeCapabilityTree({ pathname, skeleton, liveTools, contextSurface });
}
