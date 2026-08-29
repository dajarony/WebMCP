# Hackathon scope and provenance

## Project submitted

**Auralis Operator Desk** is the standalone application contained in this repository.

Its challenge-specific work includes:

- a two-page browser workspace: Case Workspace + Asset Inspector;
- WebMCP registration with `document.modelContext.registerTool()`;
- three global discovery/navigation tools registered on each page;
- five Case Workspace tools;
- three component-context control tools;
- two contextual tools that exist only while a declared component is selected;
- three Asset Inspector tools;
- a curated semantic capability tree built from application contracts, explicitly exposed page regions and `document.modelContext.getTools()` observation;
- dynamic withdrawal of contextual tools with `AbortSignal`;
- safe page-ID navigation with internally resolved same-origin routes;
- shared human-agent state on the active page;
- work-plan, customer-update and component-diagnostic preparation flows;
- an Asset Inspector note draft that only a human can save through the form;
- a sensitive-action proposal workflow with explicit human approve/reject controls;
- single-use approval consumption and replay blocking;
- visible audit/history state;
- unit, ECA and multipage integration tests;
- deployment and demo material in this repository.

## Runtime shape

The expected WebMCP surface is:

```text
Case Workspace base       11 tools
component selected   →    13 tools
component cleared    →    11 tools
Asset Inspector      →     6 tools
```

The three global tools are re-registered on each new `Document`. Page-local state is deliberately in-memory; the submission does not claim cross-page persistence.

## Deliberate boundary

This repository is designed to function as a standalone WebMCP demo and does not require any separate proprietary orchestration system.

It intentionally does not include:

- a raw DOM control API;
- arbitrary CSS/XPath selectors;
- arbitrary URL fetching or navigation input;
- generic invocation of tools merely observed through `getTools()`;
- external network integrations;
- credentials;
- shell or filesystem access;
- automatic approval or rejection;
- production customer data.

All case, customer and asset information is fictional demo data.

## Observation is not application authority

`document.modelContext.getTools()` is used for runtime observation. The capability tree separates:

- tools declared by this application's contracts;
- whether a contextual contract is active;
- whether a tool is currently observed live;
- unexpected observed names.

An unexpected observed name is informational only to this application. The tree is an application policy/introspection layer and is not described as a browser permission firewall.

If live inspection fails, the declared semantic tree remains available and reports observation as unavailable rather than inventing live capabilities.

## Safety model demonstrated

The demo separates **preparation** from **authority**:

1. An agent may read the active page's declared context.
2. An agent may prepare reversible page-local workspace content.
3. An agent may activate only explicitly declared contextual capabilities.
4. An agent may propose a sensitive action.
5. Only a human using the page can approve or reject the proposal.
6. The agent may apply only a proposal whose current state is `approved`.
7. A successful application consumes the approval.
8. Replay is rejected.

There is intentionally no WebMCP tool that changes a proposal from `pending` to `approved` or `rejected`.

## Contextual lifecycle

The Case Workspace accepts only the declared fictional component IDs `condenser_fan` and `compressor`.

Selecting one begins an explicit activation lifecycle. Only successfully registered contextual tools are marked active. Registration failure rolls selection and dynamic authority back to the inactive state. Clearing the component aborts the contextual registrations and clears the local diagnostic draft.

## Asset Inspector human boundary

The agent may prepare an inspection note in the visible form, but cannot submit it. A human submit records it to local page history. The state model distinguishes current draft from last human-saved note so an unsaved revision cannot be reported as saved.

## Deployment

The GitHub Pages workflow is configured to enable Pages when it runs on `main`, upload the static repository and deploy it. A successful live deployment remains a release gate for the final submission.

## Verification gates

Before final submission:

1. CI must be green on the candidate commit.
2. The native WebMCP demo must reproduce `11 → 13 → 11 → 6`.
3. Sensitive execution must fail before approval.
4. Human approval must permit exactly one execution.
5. Replay must fail.
6. Navigation must remain page-ID-only and same-origin.
7. The public live URL must load both pages successfully.

## Provenance boundary

The challenge submission is this public WebMCP repository. A separate proprietary orchestration system is outside the submission and is neither required by nor copied into this codebase.
