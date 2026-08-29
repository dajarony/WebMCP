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
| `read_page_tree` | Returns a curated semantic skeleton of a declared page | Not a raw DOM, selector, form-value, or hidden-state dump |
| `open_workspace_page` | Opens a declared page by exact `page_id` | Fixed relative local route; no URL, query, fragment, or external origin |

The initial directory page exposes those three tools. The Operator Desk page
exposes them plus the five case tools below. This follows the page lifecycle:
the browser rediscovers the tools registered by the destination page after
same-origin navigation.

## Operator Desk tools

| Tool | Purpose | Sensitive side effect |
| --- | --- | --- |
| `read_case_context` | Read the active case and shared workspace | No |
| `create_work_plan` | Put an agent-generated checklist into the shared page | No external action |
| `prepare_customer_update` | Prepare a draft for human review | Never sends |
| `request_sensitive_action` | Create an approval proposal | Never executes |
| `apply_approved_action` | Apply an approved proposal | Requires prior human approval; single-use |

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
3. On the destination page, the agent discovers the case tools, then reads the
   case with `read_case_context`.
4. Ask it to prepare a diagnostic checklist with `create_work_plan`.
5. Ask it to prepare a customer update with `prepare_customer_update`.
6. Ask it to propose a sensitive action with `request_sensitive_action`.
7. Try to apply it before approval — the page blocks the action.
8. Human clicks **Approve** in the page.
9. Agent calls `apply_approved_action` using the proposal ID.
10. The page records execution and consumes the approval; a replay is blocked.

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
