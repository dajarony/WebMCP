# WebMCP Operator Workspace

**A website should expose its capabilities to an agent instead of forcing the agent to guess the UI.**

WebMCP Operator Workspace is a standalone WebMCP-native, multi-page service workspace where a human operator and an AI agent share the state of the active page while sensitive authority remains human-controlled.

## Judge quick start

This repository is designed to prove visible behavior, not just tool discovery.

Use the submitted live app in a WebMCP-capable browser/client and ask the agent to use the page tools. A compact end-to-end run is:

```text
Case Workspace: 11 live tools
        ↓
select_case_component({ component_id: "condenser_fan" })
        ↓
13 live tools + visible component context
        ↓
prepare_component_diagnostic(...)
        ↓
clear_case_component_selection({})
        ↓
11 live tools
        ↓
request_sensitive_action({ action, reason })
        ↓
proposal is pending; execution is blocked
        ↓
HUMAN ONLY: approve in Trinidad
        ↓
apply_approved_action({ proposal_id })
        ↓
executed once + approval consumed
        ↓
replay is rejected
        ↓
navigate_to_capability_page({ page_id: "asset-inspector" })
        ↓
new Document: 6 live tools
```

What to watch on screen:

- the live WebMCP count changes **11 → 13 → 11 → 6**;
- component selection changes the visible workspace and the actual tool catalog;
- Trinidad visibly separates proposal from human authority;
- the approved action records one execution and consumes approval;
- replay cannot create a second execution;
- navigation creates a new document with the Asset Inspector tool surface;
- an inspection note can be prepared by the agent but only saved by the human.

A useful judge prompt is:

> Inspect the active WebMCP capabilities. Select the condenser fan, read the selected component, prepare a short diagnostic observation, then clear the component. Create a sensitive proposal explaining what you want to apply, but do not claim it executed before I approve it in Trinidad. After I approve, apply it once and show that replay is rejected. Then navigate to Asset Inspector and describe the new WebMCP surface.

## Why this is different

The demo is not a fixed list of agent shortcuts. It demonstrates a **context-sensitive capability surface** and a separate **human authority boundary**:

```text
DISCOVER → UNDERSTAND → INVOKE → CONTEXT CHANGES → REDISCOVER
                                ↓
                         HUMAN AUTHORITY
                                ↓
                         EXECUTE ONCE
```

The site publishes semantic capabilities directly through WebMCP instead of requiring an agent to infer every action from screenshots, labels, selectors or DOM structure. Contextual tools appear only when their application context exists, disappear when it is cleared, and are re-registered per document after navigation.

The application also distinguishes **capability discovery from authority**. Seeing a tool never grants permission to approve a sensitive proposal. Trinidad approval is human-only and single-use.

## Separate interoperability validation

The challenge submission is **this public repository and its standalone app**. A separate proprietary Universal MCP/WebMCP client is outside the submitted codebase and is not required to run or judge this project.

As additional compatibility evidence, that separate runtime has been exercised against public third-party WebMCP demos without service-specific integrations. In one external test it discovered an unfamiliar `query` capability, passed invocation through Trinidad, executed it through `document.modelContext.executeTool`, and the external application visibly changed its own state: status filter `500`, grouping `Status Code`, visualization `Table`, and a reduced result set. This is interoperability evidence only; it is not presented as code contained in this repository.

## The two-page demo

- **Case Workspace** — case context, planning, drafting, contextual tools and Trinidad human approval.
- **Asset Inspector** — asset telemetry, inspection focus and a human-reviewed note form.

Each navigation creates a new `Document`, so each page re-registers the same global discovery tools plus its own local tools. Demo state is intentionally in-memory and page-local; this project does not claim cross-page persistence.

## WebMCP primitives used

The pages use the imperative WebMCP API:

```js
await document.modelContext.registerTool({
  name,
  description,
  inputSchema,
  execute
});
```

The project also uses:

- `document.modelContext.getTools()` for live observation;
- `toolchange` to refresh the capability view;
- `AbortSignal` to withdraw contextual tools when their page context disappears.

No `navigator.modelContext` compatibility layer is used.

## Capability model

```text
WebMCP Operator Workspace
│
├── Global layer · every page · 3 tools
│   ├── describe_site_capabilities
│   ├── read_page_capability_tree
│   └── navigate_to_capability_page
│
├── Case Workspace · index.html
│   ├── Case tools · 5
│   │   ├── read_case_context
│   │   ├── create_work_plan
│   │   ├── prepare_customer_update
│   │   ├── request_sensitive_action
│   │   └── apply_approved_action
│   ├── Component-context controls · 3
│   │   ├── list_case_components
│   │   ├── select_case_component
│   │   └── clear_case_component_selection
│   └── Contextual tools · +2 only while a component is selected
│       ├── read_selected_component
│       └── prepare_component_diagnostic
│
└── Asset Inspector · asset.html
    └── Asset tools · 3
        ├── read_asset_context
        ├── set_inspection_focus
        └── prepare_inspection_note
```

That produces the key runtime sequence:

```text
Case Workspace base          11 live tools
select condenser_fan    →    13 live tools
clear component         →    11 live tools
navigate to Asset       →     6 live tools
```

The visible status is derived from the current `getTools()` result rather than a hard-coded count.

## Semantic capability tree

`read_page_capability_tree` returns an application-curated view of the active page:

- current page identity and purpose;
- global capabilities;
- page-local capabilities;
- contextual capability contracts;
- `active` state from the application context;
- `live` state from WebMCP observation;
- explicitly exposed UI regions and forms;
- human-only controls as visible structure;
- currently observed WebMCP tools;
- unexpected observed tool names;
- the declared pages available for navigation.

Meaningful regions opt in with `data-agent-expose="true"`. This is a semantic contract, not a DOM dump.

### Declared is different from observed

The tree deliberately separates **application contracts** from **runtime observation**.

A contextual tool may be declared but not live. A tool returned by `getTools()` may be observed without becoming a contract of this application. Unknown observed names are reported as informational and this application never uses them as an automatic authority grant.

The capability tree is an application policy and introspection layer; it is not presented as a browser permission firewall.

If live inspection is unavailable or `getTools()` fails, the declared tree remains available with `observationStatus: "unavailable"` rather than fabricating live tools.

## Safe navigation

`navigate_to_capability_page` accepts only stable page IDs declared in the local manifest:

- `case-workspace`
- `asset-inspector`

The route is resolved internally and constrained to the current origin. The tool result does not expose a generic navigation URL.

## Case Workspace

### Reversible preparation

| Tool | Purpose | External side effect |
| --- | --- | --- |
| `read_case_context` | Read the active case and shared page state | None |
| `create_work_plan` | Prepare a checklist visible to the human | None |
| `prepare_customer_update` | Prepare a customer-facing draft | Never sends |

### Contextual capability lifecycle

The page exposes two fictional component IDs: `condenser_fan` and `compressor`.

Selecting a valid component activates two contextual contracts. Registration state is tracked explicitly as `inactive`, `activating`, `active` or `deactivating`. Only successfully registered tools enter the active runtime list. If contextual registration fails, selection and dynamic authority roll back fail-closed.

Clearing the component aborts the contextual registrations and removes the local diagnostic draft.

### Trinidad human approval boundary

Sensitive work is split into proposal and execution:

```text
agent proposes
    ↓
pending
    ↓
HUMAN ONLY: approve / reject in page
    ↓
approved
    ↓
agent may apply once
    ↓
executed + approval consumed
```

`request_sensitive_action` never executes the action. `apply_approved_action` rejects unknown, pending, rejected and already-consumed proposals. There is intentionally **no WebMCP tool that approves or rejects a proposal**.

For challenge reproducibility, **Trinidad is the in-page human approval boundary in this standalone demo**. It does not require the separate private Universal MCP runtime or a localhost approval service; the human-only boundary is visible to the judge on the submitted page itself.

Known proposal-lifecycle rejections are returned through a small typed result contract; unexpected execution failures are not mislabeled as business rejections.

## Asset Inspector

The Asset Inspector exposes six tools total: three global plus three local.

The agent can read the fictional asset, set an inspection focus and prepare text in the visible inspection form. The agent cannot submit the form. Saving remains a human UI action.

Asset note state distinguishes:

- current prepared draft;
- last note saved by the human;
- whether the current draft is exactly the saved note;
- the save timestamp.

A later unsaved revision can therefore never masquerade as already saved.

## Three-minute demo

The recommended demo proves the architecture through visible behavior rather than diagrams:

1. Discover the site and show **11 live tools** on Case Workspace.
2. Select `condenser_fan`; show the live surface reach **13**, prepare a local diagnostic, then clear and return to **11**.
3. Create a sensitive proposal and prove execution is blocked before approval.
4. Let the human approve in Trinidad, execute once, then prove replay is blocked.
5. Navigate by page ID to Asset Inspector; show the new document exposing **6 tools** and prepare an inspection note for human review.

See [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md).

## Run locally

There is no build step and no runtime dependency.

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

The human UI works in ordinary browsers. WebMCP discovery and invocation require a client/browser with native WebMCP support.

## Deployment

GitHub Actions contains a static Pages deployment workflow. It is configured to enable GitHub Pages when the workflow runs on `main`, then upload and deploy the repository as the site artifact.

## Project layout

```text
index.html                  # Case Workspace
asset.html                  # Asset Inspector
app.js                      # case page state + approval wiring
asset.js                    # asset page UI wiring
asset-workspace.js          # testable asset draft/saved state
webmcp.js                   # five Case Workspace tools
asset-webmcp.js             # three Asset Inspector tools
site-webmcp.js              # three global discovery/navigation tools
site-capabilities.js        # page + contextual capability contracts
capability-tree.js          # semantic tree + live WebMCP observation
case-context-webmcp.js      # 11 → 13 → 11 contextual lifecycle
approval-boundary.js        # single-use Trinidad human approval state machine
tests/                      # unit, ECA and integration coverage
docs/                       # scope and demo material
```

## Security boundaries

- No arbitrary URL fetching.
- Navigation accepts only manifest-declared page IDs and resolves same-origin targets internally.
- No raw DOM export or generic selector/action tool.
- No generic `executeTool` bridge for observed names.
- No network integration, shell, filesystem or credentials.
- Customer updates and diagnostics are drafts only.
- The agent cannot submit the Asset Inspector form.
- Trinidad human approval is explicit and single-use.
- Rejected and consumed proposals cannot execute.
- Contextual tool registration fails closed and is withdrawn with `AbortSignal`.
- All included case/customer/asset data is fictional demo data.

## Tests

```bash
npm test
```

Current CI verification: **49/49 tests passing**.

The suite covers approval/replay, typed business rejection, page resolution, declared-vs-live capabilities, contextual activation and rollback, activation races, atomic registration rollback, runtime bounds, human/agent asset-state coherence, navigation contracts, live-inspection fallback and the multipage **11 → 13 → 11 → 6** integration lifecycle.

## Scope and provenance

This repository is the standalone WebMCP application submitted for the 2026 WebMCP Challenge. It does not contain or disclose the implementation of the separate proprietary orchestration/runtime used for broader compatibility testing, and the demo does not depend on that system.

See [`docs/HACKATHON_SCOPE.md`](./docs/HACKATHON_SCOPE.md).

## License

MIT — see [`LICENSE`](./LICENSE).
