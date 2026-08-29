# Auralis Operator Desk

**Human judgment. Agent speed. One shared multi-page workspace.**

Auralis Operator Desk is a WebMCP-native service desk where a human operator and an AI agent work on the same live operational state inside the browser.

The project now exposes a **multi-page semantic capability tree**. An agent can discover what the site offers globally, inspect the semantic skeleton and live tools of the active page, and navigate to another declared capability page where a different set of page-local WebMCP tools becomes available.

Sensitive actions remain deliberately separated from execution: a human must approve the proposal in the page, and that approval can be consumed only once.

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

The project also uses `document.modelContext.getTools()` to build a live view of what the current document actually exposes.

No `navigator.modelContext` compatibility layer is used.

## Multi-page capability model

WebMCP registrations are scoped to a `Document`. Navigation creates a new document, so site-wide tools do not magically persist between pages. Auralis handles this cleanly: every capability page imports the same site-level runtime, re-registers the stable global tools, then registers its own local tools.

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
    ├── read_asset_context
    ├── set_inspection_focus
    └── prepare_inspection_note
```

### `describe_site_capabilities`

Returns the stable site map: available pages, their descriptions and the WebMCP capabilities each page advertises.

### `read_page_capability_tree`

Returns the live semantic skeleton of the active page:

- current page identity and purpose;
- stable global capabilities;
- page-local advertised capabilities;
- whether each advertised tool is actually live;
- explicitly exposed UI regions;
- exposed forms and fields;
- human-only controls as visible structure;
- the tools currently returned by `document.modelContext.getTools()`;
- the other pages available in the site map.

The capability tree intentionally does **not** dump the entire DOM. The site marks meaningful regions with `data-agent-expose="true"`, giving the application explicit control over its agent-facing semantic surface.

### `navigate_to_capability_page`

Navigates only to page IDs declared in the local site manifest. It does not accept arbitrary URLs.

## Case Workspace tools

| Tool | Purpose | Sensitive side effect |
| --- | --- | --- |
| `read_case_context` | Read the active case and shared workspace | No |
| `create_work_plan` | Put an agent-generated checklist into the shared page | No external action |
| `prepare_customer_update` | Prepare a draft for human review | Never sends |
| `request_sensitive_action` | Create an approval proposal | Never executes |
| `apply_approved_action` | Apply an approved proposal | Requires prior human approval; single-use |

## Asset Inspector tools

| Tool | Purpose | Side effect |
| --- | --- | --- |
| `read_asset_context` | Read asset telemetry and current inspection state | No |
| `set_inspection_focus` | Put the next diagnostic focus into the shared UI | Page state only |
| `prepare_inspection_note` | Fill the visible inspection-note form for review | Never submits the form |

The form itself remains visible in the semantic tree. The agent can prepare the note, while a human uses the page's own submit control to save it to local history.

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
3. Ask for `read_page_capability_tree`; the agent sees the Case Workspace skeleton plus eight live tools: three global and five local.
4. Ask the agent to inspect the case, prepare a work plan and draft a customer update.
5. Ask it to propose a sensitive action.
6. Try to apply it before approval — the page blocks the action.
7. Human clicks **Approve**.
8. Agent applies the approved action once; replay is blocked.
9. Ask the agent to navigate to `asset-inspector`.
10. The browser loads `asset.html`; the three global tools return, but the five case tools are replaced by three Asset Inspector tools.
11. Ask for the capability tree again; the agent sees the inspection form and its fields.
12. Ask the agent to set an inspection focus and prepare a note in the visible form.
13. Human reviews and decides whether to submit it.

This demonstrates shared context, page-local capability discovery, safe navigation and human control in one coherent WebMCP site.

## Run locally

This project has no build step and no runtime dependencies. Serve the repository over HTTP(S), for example:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

The human interface works in ordinary browsers. To discover and invoke the registered tools, use a browser/client with native WebMCP support or an appropriate experimental Chrome build.

## Files

```text
index.html                 # Case Workspace UI
asset.html                 # Asset Inspector UI
styles.css                 # shared visual system
app.js                     # case state + approval boundary wiring
asset.js                   # asset page state and form behavior
webmcp.js                  # Case Workspace local tool registrations
asset-webmcp.js            # Asset Inspector local tool registrations
site-webmcp.js             # stable global multi-page discovery tools
site-capabilities.js       # site/page capability manifest
capability-tree.js         # live semantic skeleton + getTools() composition
approval-boundary.js       # single-use human approval state machine
tests/                     # approval + capability-tree tests
docs/                      # challenge scope and implementation notes
```

## Scope and provenance

This repository is a standalone WebMCP application created for the 2026 WebMCP Challenge. It does not contain or disclose the implementation of any separate proprietary orchestration system. Optional external integrations, if added later, must remain non-essential to this repository's core demo and will be documented explicitly.

See [`docs/HACKATHON_SCOPE.md`](./docs/HACKATHON_SCOPE.md).

## Security notes

- No arbitrary URL fetching.
- Multi-page navigation accepts only manifest-declared page IDs.
- The semantic tree exposes only application-approved regions, not the raw DOM.
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

The suite covers both the approval boundary and the multi-page capability model, including safe page resolution and live-vs-advertised tool state.

## License

MIT — see [`LICENSE`](./LICENSE).
