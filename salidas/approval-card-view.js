/*
SUME DOCBLOCK

Nombre: approval-card-view
Tipo: Salida

Entradas:
- Propuesta de ApprovalBoundary y documento de la página.

Acciones:
- Construye una tarjeta DOM de aprobación con controles exclusivamente humanos.

Salidas:
- Nodo de tarjeta sin HTML interpolado ni efectos de aprobación automáticos.
*/

function statusLabel(proposal) {
  if (proposal.status === 'approved' && !proposal.consumed) return 'Approved · waiting for agent';
  if (proposal.status === 'executed') return 'Executed · approval consumed';
  return proposal.status;
}

function decisionButton(documentRef, label, action, proposalId) {
  const button = documentRef.createElement('button');
  button.className = action;
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.proposalId = proposalId;
  return button;
}

export function createApprovalCard(documentRef, proposal) {
  const card = documentRef.createElement('article');
  card.className = 'approval-card';
  card.dataset.status = proposal.status;
  const title = documentRef.createElement('h3');
  title.textContent = proposal.action;
  const reason = documentRef.createElement('p');
  reason.textContent = proposal.reason;
  const meta = documentRef.createElement('div');
  meta.className = 'approval-meta';
  const status = documentRef.createElement('span');
  status.className = 'approval-state';
  status.textContent = statusLabel(proposal);
  const buttons = documentRef.createElement('div');
  buttons.className = 'button-row';
  if (proposal.status === 'pending') {
    buttons.append(decisionButton(documentRef, 'Approve', 'approve', proposal.id));
    buttons.append(decisionButton(documentRef, 'Reject', 'reject', proposal.id));
  }
  meta.append(status, buttons);
  card.append(title, reason, meta);
  return card;
}
