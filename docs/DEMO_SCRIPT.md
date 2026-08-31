# Final three-minute demo script

The goal is to make the value understandable without architecture knowledge: **a site exposes capabilities, context changes the live WebMCP surface, a human retains sensitive authority, and approved capabilities create visible application state changes.**

The video has two clearly separated stories:

1. **Submitted standalone app** — WebMCP Operator Workspace from this repository.
2. **Separate interoperability validation** — an external public WebMCP application operated through the separate Universal MCP/WebMCP runtime. This second segment is compatibility evidence only; that runtime is not code contained in this repository and is not required to run the submission.

Target runtime: **2:50–2:58**. Never exceed 3:00.

---

## 0:00–0:07 — Hook

**Picture**

Very short title/intro, then cut immediately to Case Workspace. Do not spend more than seven seconds on animation.

Suggested on-screen title:

> A website should expose capabilities — not force an agent to guess the UI.

**Voice**

> "WebMCP lets a website expose capabilities directly. This demo adds dynamic context and explicit human authority."

---

## 0:07–0:30 — Context changes the live WebMCP surface

Start on **Case Workspace** with **11 WebMCP tools live** visible.

Use one compact prompt, preferably already typed before recording:

> Inspect the active WebMCP capabilities. List the case components, select `condenser_fan`, read the selected component and prepare one short diagnostic observation. Do not send or execute anything externally.

Expected WebMCP flow:

1. discovery / capability inspection;
2. `list_case_components`;
3. `select_case_component({ component_id: "condenser_fan" })`;
4. `read_selected_component`;
5. `prepare_component_diagnostic`.

**Visible proof**

- start at **11** live tools;
- selection activates the condenser-fan context;
- live surface reaches **13**;
- `read_selected_component` and `prepare_component_diagnostic` exist only in that context;
- the diagnostic appears as bounded local state and is not sent.

**Voice**

> "The tool surface is not static. Selecting a real application context activates two capabilities, so eleven live tools become thirteen."

---

## 0:30–0:40 — Withdraw context

Prompt:

> Clear the component context and confirm the contextual tools disappear.

Expected WebMCP call:

`clear_case_component_selection({})`

**Visible proof**

- contextual state clears;
- the two contextual tools disappear;
- the page returns to **11** live tools.

**Voice**

> "When the context disappears, those capabilities disappear with it."

---

## 0:40–1:22 — Trinidad: discovery is not authority

Prompt:

> Propose scheduling an on-site technician visit because the condenser fan may require physical inspection. Try to apply the proposal before I approve it.

Expected sequence:

1. `request_sensitive_action({ action, reason })`;
2. proposal becomes `pending`;
3. `apply_approved_action({ proposal_id })` before human approval is rejected;
4. the visible Trinidad card asks the human to approve or reject.

Pause speaking for the human click. Click **Approve** visibly.

Then prompt:

> Apply the approved proposal exactly once, then replay the same proposal.

Expected sequence:

1. first apply succeeds;
2. proposal becomes `executed`;
3. `approvalConsumed: true`;
4. replay returns the typed business rejection for an already-consumed proposal;
5. there is no second execution.

**Visible proof**

- agent can propose but cannot approve itself;
- execution is blocked while pending;
- human approval changes authority;
- successful execution consumes that authority;
- replay does not execute twice.

**Voice**

> "Discovering a capability is not permission to use it. Trinidad keeps the sensitive decision with the human, and the approval can be consumed only once."

Do not spend time reading the entire rejection payload. Show only enough to make **replay blocked / no second execution** obvious.

---

## 1:22–1:48 — Navigate, rediscover, change visible state

Prompt:

> Navigate to `asset-inspector`. Read the new capability surface, set the inspection focus to the condenser fan, and prepare a short inspection note. Do not save it.

Expected sequence:

1. `navigate_to_capability_page({ page_id: "asset-inspector" })`;
2. a new `Document` loads;
3. WebMCP is rediscovered;
4. destination exposes **6** live tools;
5. `set_inspection_focus` changes visible page state;
6. `prepare_inspection_note` fills the visible draft;
7. human Save remains untouched.

**Visible proof**

- **11 → new document → 6**;
- Case Workspace capabilities are gone;
- Asset Inspector capabilities are present;
- agent changes visible inspection state;
- the final save remains human-only.

**Voice**

> "Navigation creates a new document and a new capability surface. The Case tools disappear, six Asset tools appear, and the agent can prepare work without taking the human-only save action."

At this point the **standalone challenge submission has already proved its complete story**.

---

## 1:48–1:54 — Explicit boundary card

Use a very short cut/title so judges cannot confuse the next segment with code in this repository.

On-screen text:

> Separate interoperability validation  
> External public WebMCP app · separate Universal runtime · not required by the submission

**Voice**

> "Now one separate compatibility test against a public WebMCP application we do not control."

---

## 1:54–2:36 — External WebMCP capability causes a visible real change

Start with the external application visibly in its initial state. The strongest known recording target is the public analytics/query demo where the initial UI shows the unfiltered/default presentation.

Keep both the agent interaction and the external page visible enough that the before/after cannot be mistaken for a JSON-only success.

**Flow to show**

1. the runtime discovers the external page's `query` capability;
2. it interprets the capability schema without a service-specific integration;
3. invocation requires Trinidad approval;
4. human approves;
5. execution occurs through `document.modelContext.executeTool`;
6. the external application's own UI changes visibly.

Use the already validated query that produces these visible changes:

- **Status:** `All Statuses` → **`500 (Server Error)`**;
- **Group by:** `Date` → **`Status Code`**;
- **Chart:** `Vertical Bars` → **`Table`**;
- result set: **23,361 / 23,361** → **1,610 / 23,361**;
- visible rows show status **500**.

Expected execution result:

`Query applied: table | filters: status=500.`

**Voice**

> "This capability was published by somebody else's WebMCP application. The runtime discovered it, Trinidad authorized it, and the site's own interface changed from the default view to a filtered table of server errors. No site-specific integration was written for this demo."

The **visual before/after is the proof**. Do not spend these seconds showing a long tool catalog.

---

## 2:36–2:50 — What the two stories prove

Use a simple text card over a clean view of the apps, not an architecture diagram with tiny labels.

On-screen:

```text
SITE CAPABILITY → CONTEXT → HUMAN AUTHORITY → EXECUTION → VISIBLE STATE
```

Optional second line:

```text
Standalone WebMCP workspace + separate third-party interoperability validation
```

**Voice**

> "The submitted workspace proves contextual WebMCP and human-governed execution. The separate interoperability test shows the same governance model operating a capability from an unfamiliar WebMCP site."

---

## 2:50–2:58 — Closing line

**Voice**

> "The goal is simple: agents should not guess what a website can do, and discovering a capability should never mean owning its authority."

End on the project name / repository or live demo address. No long credits.

---

# Exact recording checklist

Before recording:

- open Case Workspace in a fresh state with **11 tools**;
- ensure there is no old pending Trinidad proposal;
- keep the human Approve control visible enough to capture the click;
- rehearse the exact `condenser_fan` flow once, then reload to a clean state;
- have the external WebMCP page already open at its default state for the second clip;
- verify the external query still produces the known **500 / Status Code / Table / 1,610** visual result;
- never show credentials, tokens, localhost secrets or proprietary implementation details;
- record at a resolution where tool-count changes and the external before/after are readable;
- use cuts between the standalone submission and external compatibility segment instead of wasting time navigating setup screens.

# Editing rules

- Prefer **visible page changes** over terminal output or long JSON.
- Do not enumerate every tool. One discovery moment is enough.
- Do not include work-plan/customer-draft filler unless spare time remains after the complete flow.
- Keep human approval visibly human; do not edit around the actual Approve click.
- Keep the external segment explicitly labeled as separate compatibility evidence.
- Do not imply that the private Universal runtime is contained in, required by or licensed as part of this public challenge repository.
- If the external interoperability clip fails during recording, remove that segment rather than substituting an unverified claim. The standalone repository demo must still stand on its own.

# PASS criteria for the final video

The final cut is ready only if a viewer can see, without relying on narration alone:

- **11 → 13 → 11 → 6** live WebMCP lifecycle;
- a visible contextual state change;
- sensitive action blocked before human approval;
- a visible human Trinidad approval;
- exactly one successful apply;
- replay blocked with no second execution;
- new-document rediscovery on Asset Inspector;
- a visible agent-prepared Asset state that remains human-save-only;
- if included, the clearly labeled external WebMCP capability causing the known visible **500 / Status Code / Table** state change.
