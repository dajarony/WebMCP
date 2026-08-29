# Auralis Operator Desk

**Human judgment. Agent speed. One shared multi-page workspace.**

Auralis Operator Desk is a WebMCP-native service desk where a human operator and an AI agent work on the same live operational state inside the browser.

The project exposes an **API-like agent surface** from the web page itself. An agent can discover what the site offers globally, inspect the semantic skeleton and live tools of the active page, navigate to another declared capability page, and invoke only the functions that page has deliberately published through WebMCP.

Some capabilities are contextual: they appear or disappear at runtime as the shared page state changes. Sensitive actions remain separated from execution: a human must approve the proposal in the page, and that approval can be consumed only once.

## Why WebMCP

Traditional browser agents often infer intent from buttons, labels, page structure and screenshots. This project exposes explicit tools through WebMCP so an agent can operate on the same application state as the human without guessing its way through the interface.

The pages register tools with the current imperative API:

```js
await document.modelContext.registerTool({
  name,
  description,
  inputSchema,
  execute
});
```

The project also uses `document.modelContext.getTools()` to build a live view of what the current document actually exposes, listens for `toolchange`, and uses AbortController-backed registrations for contextual tools whose lifetime depends on page state.

No `navigator.modelContext` compatibility layer is used.

## Agent-surface model

WebMCP registrations are scoped to a `Document`. Navigation creates a new document, so each page re-registers the stable global layer and then publishes its own local surface.

```text
Auralis Operator Desk
│
├── Global capability layer (registered on every page)
│   ├── describe_site_capabilities
│   ├── read_page_capability_tree
│   └── navigate_to_capability_page
│
├── Case Workspace · index.html
│   ├── read_case_context
│   ├── create_work_plan
│   ├── prepare_customer_update
│   ├── request_sensitive_action
│   └── apply_approved_action
│
└── Asset Inspector · asset.html
    ├── Base page tools
    │   ├── read_asset_context
    │   ├── select_asset_component
    │   ├── set_inspection_focus
    │   └── prepare_inspection_note
    │
    └── Contextual tools (appear after component selection)
        ├── read_selected_component
        └── prepare_component_test
```

### `describe_site_capabilities`

Returns the stable site map: available pages, their descriptions, base capabilities and any contextual capabilities that a page may publish when its state allows them.

### `read_page_capability_tree`

Returns the live semantic skeleton of the active page:

- current page identity and purpose;
- stable global capabilities;
- page-local advertised capabilities;
- contextual capabilities and whether they are currently live;
- explicitly exposed UI regions;
- exposed forms and fields;
- the WebMCP tools associated with each semantic region;
- human-only controls as visible structure;
- the tools currently returned by `document.modelContext.getTools()`;
- the other pages available in the site map.

The capability tree intentionally does **not** dump the entire DOM. The site marks meaningful regions with `data-agent-expose="true"` and associates selected regions with explicit `data-agent-tools` contracts, giving the application control over its agent-facing surface.

### `navigate_to_capability_page`

Navigates only to page IDs declared in the local site manifest. It does not accept an arbitrary destination URL from the agent.

## Contextual capability lifecycle

The Asset Inspector demonstrates that the page can behave like a contextual API rather than a fixed list of endpoints.

Initial state:

```text
read_asset_context
select_asset_component
set_inspection_focus
prepare_inspection_note
```

After the human or agent selects `condenser-fan` or `compressor`:

```text
read_selected_component   ← becomes live
prepare_component_test    ← becomes live
```

Those two tools are registered through a dynamic WebMCP registry. The registry owns an AbortController for each contextual registration, so a capability can later be withdrawn cleanly if the page state no longer permits it. The browser emits `toolchange`, and the capability tree can be rebuilt from `getTools()`.

The important rule is that the agent never receives arbitrary JavaScript functions, selectors or hidden state. **Only functions explicitly published by the application become WebMCP capabilities.**

## Case Workspace tools

| Tool | Purpose | Sensitive side effect |
| --- | --- | --- |
| `read_case_context` | Read the active case and shared workspace | No |
| `create_work_plan` | Put an agent-generated checklist into the shared page | No external action |
| `prepare_customer_update` | Prepare a draft for human review | Never sends |
| `request_sensitive_action` | Create an approval proposal | Never executes |
| `apply_approved_action` | Apply an approved proposal | Requires prior human approval; single-use |

## Asset Inspector tools

| Tool | Lifecycle | Purpose |
| --- | --- | --- |
| `read_asset_context` | Base | Read asset telemetry and current inspection state |
| `select_asset_component` | Base | Select a component and activate contextual capabilities |
| `set_inspection_focus` | Base | Put the next diagnostic focus into the shared UI |
| `prepare_inspection_note` | Base | Fill the visible inspection-note form for review |
| `read_selected_component` | Contextual | Read detailed telemetry for the selected component |
| `prepare_component_test` | Contextual | Prepare a safe inspection checklist; performs no physical action |

The inspection form remains visible in the semantic tree. The agent can prepare the note, while a human uses the page's own submit control to save it to local history.

## Human approval boundary

The important property is not just that the UI has an Approve button. The security state transition is enforced by application logic:

```text
agent request
    ↓
pending proposal
    ↓
HUMAN ONLY: approve / reject in page
    ↓
approved proposal
    ↓
agent may call apply_approved_action
    ↓
executed + approval consumed
```

`apply_approved_action` rejects unknown, pending, rejected, and already-consumed proposals.

There is intentionally **no WebMCP tool that can approve a proposal**.

## Demo flow

1. Open **Case Workspace**.
2. Ask the agent to call `describe_site_capabilities` and discover both pages.
3. Ask for `read_page_capability_tree`; the agent sees the Case Workspace skeleton plus three global and five local tools.
4. Ask the agent to inspect the case, prepare a work plan and draft a customer update.
5. Ask it to propose a sensitive action.
6. Try to apply it before approval — the page blocks the action.
7. Human clicks **Approve**.
8. Agent applies the approved action once; replay is blocked.
9. Ask the agent to navigate to `asset-inspector`.
10. The destination document publishes three global tools plus four base Asset Inspector tools.
11. Ask for the capability tree: the two contextual component tools are advertised but not live.
12. Ask the agent to call `select_asset_component` with `condenser-fan`.
13. `toolchange` fires and `read_selected_component` plus `prepare_component_test` become live.
14. Ask the agent to inspect the selected component and prepare a `sound-check` checklist.
15. The human sees the same selected component and prepared checklist in the page.

That sequence demonstrates discovery, navigation, direct page actuation, runtime capability changes, shared state and human authority in one coherent WebMCP site.

## Run locally

This project has no build step and no runtime dependencies. Serve the repository over HTTP(S), for example:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

The human interface works in ordinary browsers. To discover and invoke the registered tools, use a browser/client with native WebMCP support or an appropriate experimental Chrome build.

## Files

```text
index.html                       # Case Workspace UI
asset.html                       # Asset Inspector UI
styles.css                       # shared visual system
app.js                           # case state + approval boundary wiring
asset.js                         # asset state + contextual capability lifecycle
webmcp.js                        # Case Workspace local tools
asset-webmcp.js                  # Asset Inspector base tools
asset-dynamic-webmcp.js          # contextual component tool definitions
dynamic-webmcp-registry.js       # AbortController-backed live tool registry
site-webmcp.js                   # stable global discovery/navigation tools
site-capabilities.js             # site/page capability manifest
capability-tree.js               # semantic skeleton + live getTools() composition
approval-boundary.js             # single-use human approval state machine
tests/                           # approval + capability-surface tests
docs/                            # challenge scope and implementation notes
```

## Scope and provenance

This repository is a standalone WebMCP application created for the 2026 WebMCP Challenge. It does not contain or disclose the implementation of any separate proprietary orchestration system. Optional external integrations, if added later, must remain non-essential to this repository's core demo and will be documented explicitly.

See [`docs/HACKATHON_SCOPE.md`](./docs/HACKATHON_SCOPE.md).

## Security notes

- No arbitrary URL fetching.
- Multi-page navigation accepts only manifest-declared page IDs.
- The semantic tree exposes only application-approved regions, not the raw DOM.
- Contextual tools are published only by explicit application logic.
- No arbitrary JavaScript function enumeration or invocation.
- No shell or filesystem access.
- No credentials are stored in the repository.
- Customer updates are drafts only.
- Sensitive actions begin as proposals, not execution requests.
- Human approval is explicit and single-use.
- Rejected and consumed proposals cannot be executed.
- The audit trail is visible to the human on the shared page.

## Tests

```bash
npm test
```

The suite covers the approval boundary, multi-page capability model and contextual tool lifecycle, including safe page resolution, live-vs-advertised state, dynamic tool registration/withdrawal and fail-closed unknown component IDs.

## License

MIT — see [`LICENSE`](./LICENSE).
