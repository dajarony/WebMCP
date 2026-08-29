===============================================================
Componente: Approval Boundary
Tipo: Módulo de lógica
Versión: 0.1.0
Entradas: action, reason, proposal_id y decisión humana visible
Acciones: proponer, aprobar, rechazar y aplicar una vez
Salidas: propuesta saneada, estado y error tipado
===============================================================

## DEFINICIÓN

Descripción: máquina de estados local que separa una propuesta de una acción
aplicada.

Objetivo: ningún `proposal_id` pendiente, rechazado, desconocido o consumido se
puede aplicar; una aprobación válida permite una sola aplicación.

Contexto: demo WebMCP autónoma. No envía mensajes ni realiza efectos externos.

## ACCIÓN

1. Crea una propuesta `pending` desde textos válidos.
2. Acepta `approve` o `reject` sólo por el handler humano de la página.
3. Aplica sólo una propuesta `approved` y marca `executed` + `consumed=true`.

## ESTADO

@proposal: `{id, action, reason, status, consumed}` = ausente
  mutable: sí
  persistente: no
  validación: `status in {pending, approved, rejected, executed}`; `consumed`
  sólo puede ser true en `executed`.
  propietario: `ApprovalBoundary`.

Transiciones legales: `pending -> approved -> executed` y
`pending -> rejected`. No existe transición saliente desde `rejected` ni
`executed`.

## ENTRADAS

- `action`: string no vacío, máximo 180, origen tool WebMCP, obligatorio.
- `reason`: string no vacío, máximo 500, origen tool WebMCP, obligatorio.
- `proposal_id`: string no vacío, origen tool WebMCP o botón humano,
  obligatorio para transición.
- `human_decision`: literal `approve | reject`, origen handler DOM humano;
  nunca origen WebMCP.

## EVENTOS Y RESULTADOS

Evento: `proposal_requested`
  Condición: action y reason válidos.
  Acción: crear `pending`.
  Resultado: id único y propuesta visible.
  Error: `INVALID_PROPOSAL` -> no crear estado.

Evento: `human_decision_received`
  Condición: propuesta existe y está `pending`.
  Acción: cambiar a `approved` o `rejected`.
  Resultado: estado visible actualizado.
  Error: `PROPOSAL_STATE_DENIED` -> no cambiar estado.

Evento: `approved_action_requested`
  Condición: propuesta existe, `status=approved` y `consumed=false`.
  Acción: marcar `executed` y consumir aprobación.
  Resultado: resultado local e historial.
  Error: `ACTION_DENIED` -> no aplicar ni consumir.

## VALIDACIONES

- `action.trim().length in [1, 180]`.
- `reason.trim().length in [1, 500]`.
- Una tool WebMCP nunca puede cambiar `pending -> approved` ni `pending -> rejected`.
- `apply` sólo ocurre con `status === approved && consumed === false`.

## ERRORES Y FALLBACK

- `INVALID_PROPOSAL`: mostrar rechazo sin crear proposal.
- `PROPOSAL_NOT_FOUND`: no modificar historial ni estado.
- `PROPOSAL_STATE_DENIED`: mostrar estado actual y no transicionar.
- `ACTION_DENIED`: mostrar que requiere aprobación humana vigente.

## UX / FEEDBACK

- Pendiente: tarjeta con botones humanos Approve/Reject.
- Aprobado: tarjeta informa que espera al agente.
- Ejecutado: tarjeta informa que la aprobación fue consumida.
- Rechazado/error: tarjeta mantiene resultado y no ofrece acción adicional.

## ACCESIBILIDAD

- Botones con texto visible `Approve` y `Reject`.
- El estado de cada propuesta se muestra como texto, no sólo color.

## PRUEBAS

- pending no se aplica.
- approved se aplica una vez.
- rejected no se aplica.
- transición humana no se repite.
- proposal mal formada se rechaza.

## DECISIONES

- Se eligió estado local para reproducibilidad de la demo.
- Se rechazó una tool `approve` para preservar control humano.

## REGLAS CRÍTICAS

- Nunca exponer una tool WebMCP que apruebe/rechace una propuesta.
- Nunca aplicar una propuesta sin aprobación humana vigente.
- Nunca reactivar, reutilizar o reaplicar una propuesta `executed` o `rejected`.

## ECA

1. `pending` + apply -> `ACTION_DENIED`, sin cambio de estado.
2. approve humano + apply -> `executed` y `consumed=true`.
3. segundo apply mismo id -> `ACTION_DENIED`.
4. tool intenta aprobar -> interfaz no expone ruta ni tool de aprobación.
5. id desconocido -> rechazo sin nueva propuesta ni historial de ejecución.
