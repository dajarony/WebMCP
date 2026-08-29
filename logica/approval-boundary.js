/*
SUME DOCBLOCK

Nombre: approval-boundary
Tipo: Lógica

Entradas:
- Acción, motivo, identificador de propuesta y decisión humana.

Acciones:
- Aplica la máquina de estados pending → approved/rejected → executed.

Salidas:
- Propuesta saneada o ToolContractError fail-closed.
*/

import { ToolContractError, ToolErrorCode } from '../contratos/tool-errors.js';

function defaultIdFactory() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `proposal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function requireText(value, label, maxLength) {
  if (typeof value !== 'string') {
    throw new ToolContractError(ToolErrorCode.INVALID_PROPOSAL, `${label} must be text.`);
  }
  const clean = value.trim();
  if (!clean || clean.length > maxLength) {
    throw new ToolContractError(ToolErrorCode.INVALID_PROPOSAL, `${label} must contain 1-${maxLength} characters.`);
  }
  return clean;
}

export class ApprovalBoundary {
  constructor({ idFactory = defaultIdFactory, clock = () => Date.now() } = {}) {
    this.idFactory = idFactory;
    this.clock = clock;
    this.proposals = [];
  }

  request(action, reason) {
    const proposal = {
      id: this.idFactory(),
      action: requireText(action, 'Action', 180),
      reason: requireText(reason, 'Reason', 500),
      status: 'pending',
      consumed: false,
      createdAt: this.clock()
    };
    this.proposals.unshift(proposal);
    return proposal;
  }

  find(proposalId) {
    return this.proposals.find((item) => item.id === proposalId) ?? null;
  }

  approve(proposalId) {
    const proposal = this.#requirePending(proposalId);
    proposal.status = 'approved';
    proposal.approvedAt = this.clock();
    return proposal;
  }

  reject(proposalId) {
    const proposal = this.#requirePending(proposalId);
    proposal.status = 'rejected';
    proposal.rejectedAt = this.clock();
    return proposal;
  }

  apply(proposalId) {
    const proposal = this.find(proposalId);
    if (!proposal) {
      throw new ToolContractError(ToolErrorCode.PROPOSAL_NOT_FOUND, 'Proposal not found.');
    }
    if (proposal.status !== 'approved' || proposal.consumed) {
      throw new ToolContractError(ToolErrorCode.ACTION_DENIED, 'Action blocked: a current human approval is required.');
    }
    proposal.consumed = true;
    proposal.status = 'executed';
    proposal.executedAt = this.clock();
    return proposal;
  }

  #requirePending(proposalId) {
    const proposal = this.find(proposalId);
    if (!proposal) {
      throw new ToolContractError(ToolErrorCode.PROPOSAL_NOT_FOUND, 'Proposal not found.');
    }
    if (proposal.status !== 'pending') {
      throw new ToolContractError(ToolErrorCode.PROPOSAL_STATE_DENIED, `Proposal cannot be changed from ${proposal.status}.`);
    }
    return proposal;
  }
}
