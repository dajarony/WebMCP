/*
SUME DOCBLOCK

Nombre: operator-workspace
Tipo: Lógica

Entradas:
- Caso ficticio, datos de tools WebMCP y decisiones humanas de aprobación.

Acciones:
- Mantiene el estado compartido, valida preparación local y notifica cambios.

Salidas:
- Snapshots inmutables de caso, plan, borrador, propuestas e historial.
*/

import { ApprovalBoundary } from './approval-boundary.js';
import { validateCustomerUpdate, validateWorkPlan } from './workspace-input-validation.js';

export const DEMO_CASE = Object.freeze({
  id: 'SRV-2047',
  title: 'Cold room temperature rising',
  customer: 'Isla Verde Hotel',
  asset: 'Walk-in cold room CR-02',
  severity: 'high',
  status: 'Investigating',
  description: 'Temperature increased from 3°C to 8°C over 40 minutes. Compressor is running. Staff report intermittent condenser fan noise. No product loss has been reported.'
});

function clone(value) {
  return structuredClone(value);
}

export class OperatorWorkspace {
  constructor({ approvalBoundary = new ApprovalBoundary(), clock = () => Date.now() } = {}) {
    this.approvalBoundary = approvalBoundary;
    this.clock = clock;
    this.workPlan = [];
    this.customerUpdate = '';
    this.history = [{ at: this.clock(), text: 'Case opened in Auralis Operator Desk.' }];
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  snapshot() {
    return clone({
      case: DEMO_CASE,
      workPlan: this.workPlan,
      customerUpdate: this.customerUpdate || null,
      sensitiveActions: this.approvalBoundary.proposals,
      history: this.history
    });
  }

  readCaseContext() {
    return this.snapshot();
  }

  createWorkPlan(steps) {
    this.workPlan = validateWorkPlan(steps);
    this.#addHistory(`Agent prepared a ${this.workPlan.length}-step work plan.`);
    this.#notify();
    return { ok: true, steps: [...this.workPlan] };
  }

  prepareCustomerUpdate(message) {
    this.customerUpdate = validateCustomerUpdate(message);
    this.#addHistory('Agent prepared a customer update draft. No message was sent.');
    this.#notify();
    return { ok: true, draft: this.customerUpdate, sent: false };
  }

  requestSensitiveAction(action, reason) {
    const proposal = this.approvalBoundary.request(action, reason);
    this.#addHistory(`Agent requested human approval: ${proposal.action}`);
    this.#notify();
    return {
      ok: true,
      proposalId: proposal.id,
      status: proposal.status,
      message: 'Proposal created. A human must approve it in the page before it can be applied.'
    };
  }

  applyApprovedAction(proposalId) {
    const proposal = this.approvalBoundary.apply(proposalId);
    this.#addHistory(`Approved action applied once: ${proposal.action}`);
    this.#notify();
    return {
      ok: true,
      proposalId: proposal.id,
      status: proposal.status,
      approvalConsumed: true,
      result: `Applied approved action: ${proposal.action}`
    };
  }

  approveFromHuman(proposalId) {
    const proposal = this.approvalBoundary.approve(proposalId);
    this.#addHistory(`Human approved once: ${proposal.action}`);
    this.#notify();
  }

  rejectFromHuman(proposalId) {
    const proposal = this.approvalBoundary.reject(proposalId);
    this.#addHistory(`Human rejected: ${proposal.action}`);
    this.#notify();
  }

  #addHistory(text) {
    this.history.unshift({ at: this.clock(), text });
  }

  #notify() {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}
