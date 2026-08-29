# Three-minute demo script

The goal is to show collaboration, not architecture.

## Scene 1 — Agent understands the live case

**Prompt**

> Inspect the active service case on this page. Summarize the problem in one sentence, then create a safe diagnostic work plan with no more than five steps. Do not propose replacing parts yet.

Expected WebMCP use:

1. `read_case_context`
2. `create_work_plan`

Visible result: the checklist appears in the same page the human is viewing.

## Scene 2 — Context changes the agent surface, not authority

**Prompt**

> Select the condenser fan, re-read the capability tree, and prepare a short
> diagnostic observation. Do not send or execute anything.

Expected WebMCP use:

1. `select_case_component`
2. `read_page_capability_tree`
3. `prepare_component_diagnostic`

Visible result: two contextual tools appear only after a declared selection.
Clearing the selection removes both and discards the local draft.

## Scene 3 — Agent prepares, human retains communication control

**Prompt**

> Prepare a short customer update explaining what we know, what we are checking, and that no product loss has been reported. Do not send anything.

Expected WebMCP use:

1. `read_case_context` if needed
2. `prepare_customer_update`

Visible result: a draft appears in the shared page with the explicit note that it has not been sent.

## Scene 4 — Sensitive action boundary

**Prompt**

> Propose scheduling an on-site technician visit because the condenser fan may require physical inspection. Create the proposal, then try to apply it before I approve it and tell me what happens.

Expected WebMCP use:

1. `request_sensitive_action`
2. `apply_approved_action` → must fail while status is `pending`

Visible result: the page shows a pending approval card. The human clicks **Approve**.

**Prompt after the human click**

> Now apply the approved proposal exactly once. Then try the same proposal a second time and report the result.

Expected WebMCP use:

1. `apply_approved_action` → succeeds
2. `apply_approved_action` again → must fail

Visible result: status changes to `executed`, the approval is marked consumed, and the audit trail records the action.

## Closing line

> Auralis Operator Desk gives agents structured ways to understand and prepare work, while irreversible authority remains with the human.

## What not to show

- proprietary orchestration internals;
- unrelated MCP infrastructure;
- terminal output unless needed to prove a failure;
- long architecture diagrams;
- more than one service case.

The page itself should carry the story.
