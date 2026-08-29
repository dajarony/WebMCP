# Auralis Operator Desk

**Human judgment. Agent speed. One shared case.**

Auralis Workspace is a WebMCP-native, multipage service workspace. An agent can
first discover the declared pages and each page’s functional skeleton, then
open a permitted page and work on the same live case as the human.

The agent can read the case, prepare a work plan, draft a customer update, and propose a sensitive action. Sensitive actions are deliberately separated from execution: a human must approve the proposal in the page, and that approval can be consumed only once.

## Why WebMCP

Traditional browser agents often infer intent from buttons, labels, and page structure. This project exposes explicit tools through WebMCP so an agent can operate on the same application state as the human without guessing its way through the interface.

The page registers tools with the current imperative API:

```js
await document.modelContext.registerTool({
  name,
  description,
  inputSchema,
  execute
});
```

No `navigator.modelContext` compatibility layer is used.

## Multipage semantic discovery

Each page exposes the same three global WebMCP tools:

| Tool | Purpose | Safety boundary |
| --- | --- | --- |
| `list_workspace_pages` | Lists the declared workspace pages and their tools | Fixed same-origin manifest only |
| `read_page_tree` | Returns a curated semantic skeleton, declared forms and current capability state | Not a raw DOM, selector, form-value, or hidden-state dump |
| `open_workspace_page` | Opens a declared page by exact `page_id` | Fixed relative local route; no URL, query, fragment, or external origin |

The tree separates the application's **declared** tools from names observed by
`document.modelContext.getTools()` on the active document. Observation never
grants permission: unknown observed names remain informational and cannot be
invoked through this application.

The initial directory page exposes those three tools. The Operator Desk page
exposes them plus the case tools below. This follows the page lifecycle: the
browser rediscovers the tools registered by the destination page after
same-origin navigation.

## Operator Desk tools

| Tool | Purpose | Sensitive side effect |
| --- | --- | --- |
| `read_case_context` | Read the active case and shared workspace | No |
| `create_work_plan` | Put an agent-generated checklist into the shared page | No external action |
| `prepare_customer_update` | Prepare a draft for human review | Never sends |
| `request_sensitive_action` | Create an approval proposal | Never executes |
| `apply_approved_action` | Apply an approved proposal | Requires prior human approval; single-use |

## Contextual component tools

The Operator Desk also exposes a bounded component context. An agent can list
the two fictional components and select exactly one. Selection activates two
extra tools for that known context; clearing the selection unregisters them
with `AbortSignal`.

| Tool | Availability | Purpose |
| --- | --- | --- |
| `list_case_components` | Always on the Operator Desk | Lists declared demo components |
| `select_case_component` | Always on the Operator Desk | Selects a closed component ID |
| `clear_case_component_selection` | Always on the Operator Desk | Removes context and its local draft |
| `read_selected_component` | Only after valid selection | Reads the selected component |
| `prepare_component_diagnostic` | Only after valid selection | Creates a bounded, unsent local diagnostic |

`toolchange` only advances a visible capability revision. It never grants
authority, runs an observed tool, sends the diagnostic, or changes approval.

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

1. On the directory, ask the agent to call `list_workspace_pages` and
   `read_page_tree`.
2. Ask it to call `open_workspace_page` with `page_id: "operator_case"`.
3. On the destination page, the agent reads the case with `read_case_context`.
4. It calls `list_case_components`, selects `condenser_fan`, then re-reads the
   tree to observe the contextual form and the two newly declared tools.
5. Ask it to prepare a bounded component diagnostic; it remains local and
   unsent. Clear the selection to demonstrate contextual tools disappearing.
6. Ask it to prepare a diagnostic checklist with `create_work_plan`.
7. Ask it to prepare a customer update with `prepare_customer_update`.
8. Ask it to propose a sensitive action with `request_sensitive_action`.
9. Try to apply it before approval — the page blocks the action.
10. Human clicks **Approve** in the page.
11. Agent calls `apply_approved_action` using the proposal ID.
12. The page records execution and consumes the approval; a replay is blocked.

That sequence demonstrates a shared human-agent workspace plus a real action boundary in under three minutes.

## Run locally

This project has no build step and no runtime dependencies. Serve the repository over HTTP(S), for example:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

The human interface works in ordinary browsers. To discover and invoke the registered tools, use a browser/client with WebMCP support, such as the ChatGPT built-in browser or a compatible experimental Chrome build.

## Architecture

```text
index.html                  # Workspace directory with global tools
case.html                   # shared operator interface
entradas/                   # page bootstrap and WebMCP registration
logica/                     # workspace and approval boundary
salidas/                    # safe DOM and tool-result rendering
contratos/                  # WebMCP schemas, errors and FASER
cambios/, mapa-global/      # traceability and live architecture map
docs/                       # challenge scope, CMCF and demo notes
```

## Scope and provenance

This repository is a standalone WebMCP application created for the 2026 WebMCP Challenge. It does not contain or disclose the implementation of any separate proprietary orchestration system. Optional external integrations, if added later, must remain non-essential to this repository's core demo and will be documented explicitly.

See [`docs/HACKATHON_SCOPE.md`](./docs/HACKATHON_SCOPE.md).

## Security notes

- No arbitrary URL fetching.
- No arbitrary DOM controls, selectors, raw page-tree export or navigation URLs.
- Live WebMCP observation does not create authority or invoke unrecognised tools.
- Every page, semantic node and route is declared in a local immutable manifest.
- No shell or filesystem access.
- No credentials are stored in the repository.
- Customer updates are drafts only.
- Sensitive actions begin as proposals, not execution requests.
- Human approval is explicit and single-use.
- Rejected and consumed proposals cannot be executed.
- The audit trail is visible to the human on the shared page.

## License

MIT — see [`LICENSE`](./LICENSE).
