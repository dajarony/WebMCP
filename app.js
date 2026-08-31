import { registerWebMCPTools } from './webmcp.js';
import { ApprovalBoundary } from './approval-boundary.js';
import { registerSiteWebMCPTools } from './site-webmcp.js';
import { buildCapabilityTree } from './capability-tree.js';
import { CaseContextWebMCP } from './case-context-webmcp.js';
import { normalizeWorkPlanSteps } from './case-workspace-state.js';

const approvalBoundary = new ApprovalBoundary();
let caseContext = null;

const state = {
  case: {
    id: 'SRV-2047',
    title: 'Cold room temperature rising',
    customer: 'Isla Verde Hotel',
    asset: 'Walk-in cold room CR-02',
    severity: 'high',
    status: 'Investigating',
    description: 'Temperature increased from 3°C to 8°C over 40 minutes. Compressor is running. Staff report intermittent condenser fan noise. No product loss has been reported.'
  },
  workPlan: [],
  customerUpdate: '',
  proposals: approvalBoundary.proposals,
  history: [
    { at: Date.now(), text: 'Case opened in the Operator Workspace.' }
  ]
};

const els = {
  webmcpStatus: document.querySelector('#webmcp-status'),
  workPlan: document.querySelector('#work-plan'),
  customerUpdate: document.querySelector('#customer-update'),
  approvalList: document.querySelector('#approval-list'),
  approvalCount: document.querySelector('#approval-count'),
  trinidadBoundary: document.querySelector('#trinidad-boundary'),
  historyList: document.querySelector('#history-list'),
  capabilityTree: document.querySelector('#capability-tree-preview'),
  componentSelection: document.querySelector('#component-selection'),
  componentDiagnostic: document.querySelector('#component-diagnostic'),
  componentCapabilities: document.querySelector('#component-capabilities')
};

function nowLabel(timestamp = Date.now()) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(timestamp);
}

function addHistory(text) {
  state.history.unshift({ at: Date.now(), text });
  renderHistory();
}

function renderPlan() {
  els.workPlan.replaceChildren();
  if (!state.workPlan.length) {
    const item = document.createElement('li');
    item.textContent = 'Ask the agent to create a work plan.';
    els.workPlan.append(item);
    els.workPlan.classList.add('empty-state');
    return;
  }
  els.workPlan.classList.remove('empty-state');
  for (const step of state.workPlan) {
    const item = document.createElement('li');
    item.textContent = step;
    els.workPlan.append(item);
  }
}

function renderCustomerUpdate() {
  if (!state.customerUpdate) {
    els.customerUpdate.textContent = 'No customer update prepared yet.';
    els.customerUpdate.classList.add('empty-text');
    return;
  }
  els.customerUpdate.textContent = state.customerUpdate;
  els.customerUpdate.classList.remove('empty-text');
}

function statusLabel(proposal) {
  if (proposal.status === 'approved' && !proposal.consumed) return 'Approved · waiting for agent';
  if (proposal.status === 'executed') return 'Executed · approval consumed';
  return proposal.status;
}

function revealTrinidad() {
  if (!els.trinidadBoundary) return;
  els.trinidadBoundary.classList.remove('trinidad-pulse');
  requestAnimationFrame(() => {
    els.trinidadBoundary.classList.add('trinidad-pulse');
    els.trinidadBoundary.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function renderApprovals() {
  els.approvalList.replaceChildren();
  const pending = state.proposals.filter((item) => item.status === 'pending').length;
  els.approvalCount.textContent = `${pending} pending`;

  if (!state.proposals.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-card';
    empty.textContent = 'Trinidad is ready. No sensitive action is waiting for approval.';
    els.approvalList.append(empty);
    return;
  }

  for (const proposal of state.proposals) {
    const card = document.createElement('article');
    card.className = 'approval-card';
    card.dataset.status = proposal.status;

    const title = document.createElement('h3');
    title.textContent = proposal.action;

    const reason = document.createElement('p');
    reason.textContent = proposal.reason;

    const meta = document.createElement('div');
    meta.className = 'approval-meta';

    const status = document.createElement('span');
    status.className = 'approval-state';
    status.textContent = statusLabel(proposal);

    const buttons = document.createElement('div');
    buttons.className = 'button-row';

    if (proposal.status === 'pending') {
      const approve = document.createElement('button');
      approve.className = 'approve';
      approve.textContent = 'Approve';
      approve.dataset.humanOnly = 'true';
      approve.addEventListener('click', () => decideProposal(proposal.id, 'approve'));

      const reject = document.createElement('button');
      reject.className = 'reject';
      reject.textContent = 'Reject';
      reject.dataset.humanOnly = 'true';
      reject.addEventListener('click', () => decideProposal(proposal.id, 'reject'));

      buttons.append(approve, reject);
    }

    meta.append(status, buttons);
    card.append(title, reason, meta);
    els.approvalList.append(card);
  }
}

function renderHistory() {
  els.historyList.replaceChildren();
  for (const entry of state.history) {
    const item = document.createElement('li');
    item.className = 'history-item';

    const time = document.createElement('span');
    time.className = 'history-time';
    time.textContent = nowLabel(entry.at);

    const text = document.createElement('span');
    text.className = 'history-text';
    text.textContent = entry.text;

    item.append(time, text);
    els.historyList.append(item);
  }
}

function renderComponentContext(snapshot) {
  const selected = snapshot.selectedComponent;
  els.componentSelection.textContent = selected
    ? `${selected.label}: ${selected.summary}`
    : 'No component selected. Contextual tools are unavailable.';
  els.componentDiagnostic.textContent = snapshot.diagnosticDraft
    ? `Draft only: ${snapshot.diagnosticDraft.observation}`
    : 'No component diagnostic prepared.';
  const names = snapshot.dynamicToolNames.length ? snapshot.dynamicToolNames.join(', ') : 'none';
  els.componentCapabilities.textContent = `Capability revision ${snapshot.revision} · ${snapshot.activationState}. Dynamic tools: ${names}.`;
}

function renderAll() {
  renderPlan();
  renderCustomerUpdate();
  renderApprovals();
  renderHistory();
}

async function refreshCapabilityTree() {
  const tree = await buildCapabilityTree({ contextSurface: caseContext?.snapshot() || null });
  if (els.capabilityTree) {
    els.capabilityTree.textContent = JSON.stringify(tree, null, 2);
  }
  els.webmcpStatus.textContent = `${tree.liveWebMCPTools.length} WebMCP tools live`;
  els.webmcpStatus.className = 'status status-ready';
  return tree;
}

const operatorApi = {
  readCaseContext() {
    return {
      case: { ...state.case },
      workPlan: [...state.workPlan],
      customerUpdate: state.customerUpdate || null,
      sensitiveActions: state.proposals.map(({ id, action, reason, status, consumed }) => ({
        id, action, reason, status, consumed
      }))
    };
  },

  createWorkPlan(steps) {
    const cleanSteps = normalizeWorkPlanSteps(steps);

    state.workPlan = cleanSteps;
    renderPlan();
    addHistory(`Agent prepared a ${cleanSteps.length}-step work plan.`);
    return { ok: true, steps: cleanSteps };
  },

  prepareCustomerUpdate(message) {
    const clean = String(message).trim();
    if (!clean) throw new Error('Customer update cannot be empty.');
    state.customerUpdate = clean.slice(0, 1500);
    renderCustomerUpdate();
    addHistory('Agent prepared a customer update draft. No message was sent.');
    return { ok: true, draft: state.customerUpdate, sent: false };
  },

  requestSensitiveAction(action, reason) {
    const proposal = approvalBoundary.request(action, reason);
    renderApprovals();
    revealTrinidad();
    addHistory(`Trinidad received an agent proposal for human approval: ${proposal.action}`);
    return {
      ok: true,
      proposal_id: proposal.id,
      status: proposal.status,
      message: 'Proposal created. A human must approve it in the page before it can be applied.'
    };
  },

  applyApprovedAction(proposalId) {
    const proposal = approvalBoundary.apply(proposalId);
    renderApprovals();
    addHistory(`Approved action applied once: ${proposal.action}`);

    return {
      ok: true,
      proposal_id: proposal.id,
      status: proposal.status,
      approvalConsumed: true,
      result: `Applied approved action: ${proposal.action}`
    };
  }
};

function decideProposal(proposalId, decision) {
  const proposal = approvalBoundary.find(proposalId);
  if (!proposal || proposal.status !== 'pending') return;

  if (decision === 'approve') {
    approvalBoundary.approve(proposal.id);
    addHistory(`Human approved once through Trinidad: ${proposal.action}`);
  } else {
    approvalBoundary.reject(proposal.id);
    addHistory(`Human rejected through Trinidad: ${proposal.action}`);
  }

  renderApprovals();
}

renderAll();
renderComponentContext({ revision: 0, activationState: 'inactive', selectedComponent: null, diagnosticDraft: null, dynamicToolNames: [] });

if ('modelContext' in document && document.modelContext) {
  try {
    caseContext = new CaseContextWebMCP({
      modelContext: document.modelContext,
      onChange: (snapshot) => {
        renderComponentContext(snapshot);
        refreshCapabilityTree().catch(() => {});
      }
    });
    await registerSiteWebMCPTools({
      getCapabilityTree: refreshCapabilityTree,
      navigate: (target) => globalThis.location.assign(target)
    });
    await registerWebMCPTools(operatorApi);
    await caseContext.register();

    addHistory('Global, case and contextual WebMCP contracts registered.');

    document.modelContext.addEventListener?.('toolchange', () => {
      refreshCapabilityTree().catch(() => {});
    });
    await refreshCapabilityTree();
  } catch (error) {
    console.error('WebMCP registration failed', error);
    els.webmcpStatus.textContent = 'WebMCP registration failed';
    if (els.capabilityTree) els.capabilityTree.textContent = `Capability tree unavailable: ${error.message}`;
  }
} else {
  els.webmcpStatus.textContent = 'WebMCP unavailable in this browser';
  if (els.capabilityTree) {
    els.capabilityTree.textContent = JSON.stringify({
      note: 'The human UI works, but native WebMCP is unavailable in this browser.'
    }, null, 2);
  }
  addHistory('Page loaded without WebMCP support; the human interface remains usable.');
}
