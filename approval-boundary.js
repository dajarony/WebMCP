function defaultIdFactory() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `proposal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function requireText(value, label, maxLength) {
  const clean = String(value ?? '').trim();
  if (!clean) throw new Error(`${label} is required.`);
  return clean.slice(0, maxLength);
}

export class BusinessRuleError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'BusinessRuleError';
    this.code = code;
  }
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
      throw new BusinessRuleError('PROPOSAL_NOT_FOUND', 'Proposal not found.');
    }
    if (proposal.consumed) {
      throw new BusinessRuleError(
        'PROPOSAL_ALREADY_CONSUMED',
        'Action blocked: this approval has already been consumed.'
      );
    }
    if (proposal.status !== 'approved') {
      throw new BusinessRuleError(
        'PROPOSAL_NOT_APPROVED',
        `Action blocked: proposal status is ${proposal.status}. Human approval is required.`
      );
    }

    proposal.consumed = true;
    proposal.status = 'executed';
    proposal.executedAt = this.clock();
    return proposal;
  }

  #requirePending(proposalId) {
    const proposal = this.find(proposalId);
    if (!proposal) {
      throw new BusinessRuleError('PROPOSAL_NOT_FOUND', 'Proposal not found.');
    }
    if (proposal.status !== 'pending') {
      throw new BusinessRuleError(
        'PROPOSAL_NOT_PENDING',
        `Proposal cannot be changed from ${proposal.status}.`
      );
    }
    return proposal;
  }
}
