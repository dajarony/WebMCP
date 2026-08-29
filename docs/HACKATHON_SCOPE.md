# Hackathon scope and provenance

## Project submitted

**Auralis Workspace / Operator Desk** is the application contained in this
repository.

Its challenge-specific work includes:

- the browser-based shared service-case interface;
- a multipage workspace directory with a same-origin page manifest;
- an application-curated semantic tree per declared page;
- declared forms plus an explicitly separate live WebMCP capability observation;
- bounded page discovery and page-id navigation tools;
- WebMCP tool registration with `document.modelContext.registerTool()`;
- bounded contextual component tools whose lifecycle uses `AbortSignal`;
- schemas and descriptions for the five site tools;
- shared human-agent page state;
- work-plan and customer-update preparation flows;
- the sensitive-action proposal workflow;
- explicit human approve/reject controls;
- single-use approval consumption and replay blocking;
- the visible case audit trail;
- documentation, deployment instructions, and demo material in this repository.

## Deliberate boundary

This repository is designed to be functional as a standalone WebMCP demo and does not require a separate proprietary orchestration system.

A future version may optionally connect to external services. Such a connection would be treated as an integration, not as the implementation of the challenge submission itself. Any challenge-specific adapter code added to this repository will be documented here.

## Safety model demonstrated

The demo separates **preparation** from **authority**:

1. An agent may read page context.
2. An agent may prepare reversible workspace content.
3. An agent may propose a sensitive action.
4. Only a human using the page can approve or reject the proposal.
5. The agent may apply only a proposal whose current state is `approved`.
6. A successful application consumes the approval.
7. Replay is rejected.

The agent is never given a WebMCP tool that changes a proposal from `pending` to `approved`.

The agent is also never given a raw DOM, selector, form-control, hidden-state
or arbitrary-URL primitive. It can discover only product regions and page tools
selected by the application, and can navigate only to a declared local page.

An observed live WebMCP tool name is not an authority grant. The application
never invokes an unknown observed tool and only registers its own closed
contracts.

## Demo data

All customer, case, and asset information included in the repository is fictional demo data. No production credentials or private customer data are required.
