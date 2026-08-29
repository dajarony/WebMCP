# Three-minute demo script

The goal is to prove the product through visible behavior, not architecture slides.

## 0:00–0:25 — Discover the site

Start on **Case Workspace**.

**Prompt**

> Discover what this WebMCP site exposes, then read the capability tree for the active page. Tell me how many tools are live and what other page you can navigate to.

Expected WebMCP use:

1. `describe_site_capabilities`
2. `read_page_capability_tree`

Visible proof:

- Case Workspace is identified as the active page;
- Asset Inspector is discoverable by stable page ID;
- the page reports **11 live tools**;
- human approval appears in the semantic structure but there is no approval tool.

## 0:25–0:55 — Context changes the API

**Prompt**

> List the available case components. Select `condenser_fan`, re-read the capability tree and prepare one short diagnostic observation. Do not send or execute anything.

Expected WebMCP use:

1. `list_case_components`
2. `select_case_component`
3. `read_page_capability_tree`
4. `prepare_component_diagnostic`

Visible proof:

- the live tool count reaches **13**;
- `read_selected_component` and `prepare_component_diagnostic` become live;
- the diagnostic is explicitly local and unsent.

Then ask:

> Clear the component context and confirm the two contextual tools disappear.

Expected result: the page returns to **11 live tools**.

## 0:55–1:20 — Agent prepares visible work

**Prompt**

> Read the active case and create a safe three-step diagnostic work plan. Also prepare a one-sentence customer update. Do not send anything.

Expected WebMCP use:

1. `read_case_context`
2. `create_work_plan`
3. `prepare_customer_update`

Visible proof: both outputs appear in the same page the human is viewing, and the customer update remains a draft.

## 1:20–2:15 — Human authority boundary

**Prompt**

> Propose scheduling an on-site technician visit because the condenser fan may require physical inspection. Then try to apply the proposal before I approve it.

Expected WebMCP use:

1. `request_sensitive_action`
2. `apply_approved_action` → blocked while `pending`

Visible proof: a pending approval card appears. The human clicks **Approve** in the page.

**Prompt**

> Apply that approved proposal exactly once, then try the same proposal again.

Expected result:

1. first `apply_approved_action` succeeds;
2. approval becomes consumed;
3. second call fails as replay.

This is the main human-in-the-loop proof.

## 2:15–2:50 — Navigate and rediscover

**Prompt**

> Navigate to `asset-inspector`, read the new page capability tree, set the inspection focus to the condenser fan, and prepare a short inspection note. Do not save the form.

Expected WebMCP use:

1. `navigate_to_capability_page`
2. new `Document` loads `asset.html`;
3. global tools are re-registered;
4. `read_page_capability_tree`
5. `set_inspection_focus`
6. `prepare_inspection_note`

Visible proof:

- the new page reports **6 live tools**;
- the Case Workspace tools are gone;
- Asset Inspector tools are present;
- the agent fills the visible note field;
- only the human can save the form.

## 2:50–3:00 — Closing line

> Auralis turns each page into an explicit, contextual WebMCP capability surface: the agent discovers and uses what the site deliberately exposes, while consequential authority stays with the human.

## Recording rules

- Keep the browser and page visible; avoid terminal footage unless a failure must be proven.
- Do not show proprietary orchestration internals or unrelated MCP infrastructure.
- Keep one fictional service case throughout.
- Prefer the visible live tool count and capability tree over long verbal explanations.
- If native navigation returns no tool payload because the old document is destroyed, treat the successful page load and rediscovery on the destination document as the proof.
