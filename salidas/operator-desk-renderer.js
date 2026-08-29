/*
SUME DOCBLOCK

Nombre: operator-desk-renderer
Tipo: Salida

Entradas:
- Snapshot local del workspace y eventos humanos de botón.

Acciones:
- Proyecta texto seguro y estados de aprobación al DOM compartido.

Salidas:
- Interfaz actualizada; no envía datos fuera de la página.
*/

function nowLabel(timestamp) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(timestamp);
}

function statusLabel(proposal) {
  if (proposal.status === 'approved' && !proposal.consumed) return 'Approved · waiting for agent';
  if (proposal.status === 'executed') return 'Executed · approval consumed';
  return proposal.status;
}

export class OperatorDeskRenderer {
  constructor({ documentRef = document, onApprove, onReject }) {
    this.document = documentRef;
    this.onApprove = onApprove;
    this.onReject = onReject;
    this.els = {
      webmcpStatus: documentRef.querySelector('#webmcp-status'),
      workPlan: documentRef.querySelector('#work-plan'),
      customerUpdate: documentRef.querySelector('#customer-update'),
      approvalList: documentRef.querySelector('#approval-list'),
      approvalCount: documentRef.querySelector('#approval-count'),
      historyList: documentRef.querySelector('#history-list')
    };
    this.els.approvalList.addEventListener('click', (event) => this.#handleDecision(event));
  }

  render(snapshot) {
    this.#renderPlan(snapshot.workPlan);
    this.#renderCustomerUpdate(snapshot.customerUpdate);
    this.#renderApprovals(snapshot.sensitiveActions);
    this.#renderHistory(snapshot.history);
  }

  setWebMcpStatus(text, className) {
    this.els.webmcpStatus.textContent = text;
    this.els.webmcpStatus.className = className;
  }

  #renderPlan(workPlan) {
    this.els.workPlan.replaceChildren();
    if (!workPlan.length) {
      const item = this.document.createElement('li');
      item.textContent = 'Ask the agent to create a work plan.';
      this.els.workPlan.append(item);
      this.els.workPlan.classList.add('empty-state');
      return;
    }
    this.els.workPlan.classList.remove('empty-state');
    for (const step of workPlan) {
      const item = this.document.createElement('li');
      item.textContent = step;
      this.els.workPlan.append(item);
    }
  }

  #renderCustomerUpdate(message) {
    if (!message) {
      this.els.customerUpdate.textContent = 'No customer update prepared yet.';
      this.els.customerUpdate.classList.add('empty-text');
      return;
    }
    this.els.customerUpdate.textContent = message;
    this.els.customerUpdate.classList.remove('empty-text');
  }

  #renderApprovals(proposals) {
    this.els.approvalList.replaceChildren();
    const pending = proposals.filter((item) => item.status === 'pending').length;
    this.els.approvalCount.textContent = `${pending} pending`;
    if (!proposals.length) {
      const empty = this.document.createElement('div');
      empty.className = 'empty-card';
      empty.textContent = 'No sensitive action is waiting for approval.';
      this.els.approvalList.append(empty);
      return;
    }
    for (const proposal of proposals) this.els.approvalList.append(this.#approvalCard(proposal));
  }

  #approvalCard(proposal) {
    const card = this.document.createElement('article');
    card.className = 'approval-card';
    card.dataset.status = proposal.status;
    const title = this.document.createElement('h3');
    title.textContent = proposal.action;
    const reason = this.document.createElement('p');
    reason.textContent = proposal.reason;
    const meta = this.document.createElement('div');
    meta.className = 'approval-meta';
    const status = this.document.createElement('span');
    status.className = 'approval-state';
    status.textContent = statusLabel(proposal);
    const buttons = this.document.createElement('div');
    buttons.className = 'button-row';
    if (proposal.status === 'pending') {
      buttons.append(this.#decisionButton('Approve', 'approve', proposal.id));
      buttons.append(this.#decisionButton('Reject', 'reject', proposal.id));
    }
    meta.append(status, buttons);
    card.append(title, reason, meta);
    return card;
  }

  #decisionButton(label, action, proposalId) {
    const button = this.document.createElement('button');
    button.className = action;
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.proposalId = proposalId;
    return button;
  }

  #renderHistory(history) {
    this.els.historyList.replaceChildren();
    for (const entry of history) {
      const item = this.document.createElement('li');
      item.className = 'history-item';
      const time = this.document.createElement('span');
      time.className = 'history-time';
      time.textContent = nowLabel(entry.at);
      const text = this.document.createElement('span');
      text.className = 'history-text';
      text.textContent = entry.text;
      item.append(time, text);
      this.els.historyList.append(item);
    }
  }

  #handleDecision(event) {
    const button = event.target.closest('button[data-proposal-id]');
    if (!button) return;
    if (button.dataset.action === 'approve') this.onApprove(button.dataset.proposalId);
    if (button.dataset.action === 'reject') this.onReject(button.dataset.proposalId);
  }
}
