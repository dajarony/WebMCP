/*
SUME DOCBLOCK

Nombre: history-list-view
Tipo: Salida

Entradas:
- Historial local de entradas con marca temporal y texto.

Acciones:
- Renderiza un historial textual accesible en orden recibido.

Salidas:
- Lista DOM sin HTML remoto ni cambio de estado de negocio.
*/

function nowLabel(timestamp) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(timestamp);
}

export function renderHistoryList(documentRef, target, history) {
  target.replaceChildren();
  for (const entry of history) {
    const item = documentRef.createElement('li');
    item.className = 'history-item';
    const time = documentRef.createElement('span');
    time.className = 'history-time';
    time.textContent = nowLabel(entry.at);
    const text = documentRef.createElement('span');
    text.className = 'history-text';
    text.textContent = entry.text;
    item.append(time, text);
    target.append(item);
  }
}
