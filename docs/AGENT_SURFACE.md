# Auralis WebMCP Agent Surface

## Goal

A page should not force an agent to infer how to use it from pixels, arbitrary selectors or hidden implementation details. The page publishes a deliberate WebMCP capability surface instead.

The agent can:

1. discover the site's declared pages;
2. inspect the active page's semantic skeleton;
3. see which capabilities are advertised and which are currently live;
4. navigate by stable page ID;
5. invoke the live WebMCP tools exposed by the destination page;
6. rediscover when `toolchange` reports that the live surface changed.

## Layers

```text
Site
├── global capabilities
├── page-local capabilities
└── contextual capabilities
    └── registered only while page state permits them
```

## Semantic tree

The semantic tree is application-curated. It may describe exposed regions, forms, fields, human-only controls and the WebMCP tools associated with those regions.

It must not expose:

- a raw DOM dump;
- arbitrary CSS/XPath selectors;
- hidden form values;
- arbitrary navigation URLs;
- unregistered JavaScript functions;
- human approval/rejection authority.

## Contextual lifecycle

Contextual tools are registered through `DynamicWebMCPRegistry`. Each live tool owns an `AbortController`; aborting the registration signal withdraws that capability from WebMCP.

The Asset Inspector demonstration starts with base tools only. Selecting an approved component publishes:

- `read_selected_component`
- `prepare_component_test`

This makes the agent surface depend on the same page state visible to the human.

## Security invariant

**Discoverability does not create authority.**

A function becomes agent-callable only when the application deliberately registers it as WebMCP. Human-only controls stay outside the tool surface, and sensitive actions continue to use the separate single-use approval boundary.
