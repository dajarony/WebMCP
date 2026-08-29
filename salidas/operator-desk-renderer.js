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

import { createApprovalCard } from './approval-card-view.js';
import { renderHistoryList } from './history-list-view.js';

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
    for (const proposal of proposals) this.els.approvalList.append(createApprovalCard(this.document, proposal));
  }

  #renderHistory(history) {
    renderHistoryList(this.document, this.els.historyList, history);
  }

  #handleDecision(event) {
    const button = event.target.closest('button[data-proposal-id]');
    if (!button) return;
    if (button.dataset.action === 'approve') this.onApprove(button.dataset.proposalId);
    if (button.dataset.action === 'reject') this.onReject(button.dataset.proposalId);
  }
}
