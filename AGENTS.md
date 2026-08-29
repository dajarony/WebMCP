# Auralis Operator Desk — guía de agentes

## Objetivo

Demostrar colaboración humano-agente dentro de una página WebMCP: el agente
puede leer, preparar y proponer; la aprobación sensible pertenece sólo a la
persona que usa la interfaz.

## Arquitectura obligatoria

- SUME + STDG: `entradas/`, `logica/`, `salidas/`, `contratos/`, `cambios/` y
  `mapa-global/` son las fuentes de organización.
- Todo archivo JavaScript bajo una carpeta SUME empieza con un `SUME DOCBLOCK`.
- `mapa-global/arquitectura.yaml` y `cambios/registro-cambios.md` se actualizan
  con cada cambio de arquitectura.
- Los contratos nacen Draft. Sólo una persona puede aprobar un contrato que
  cambie el comportamiento funcional.
- `docs/cmcf/` define intención y límites; `contratos/faser/` define conducta.

## Invariantes de seguridad

- No existe una tool WebMCP que apruebe o rechace una propuesta.
- Una propuesta sólo se aplica desde `approved` y su aprobación es single-use.
- `pending`, `rejected`, `executed`, desconocida o mal formada => rechazo.
- Las herramientas no envían mensajes, no acceden a red, shell, filesystem ni
  credenciales.
- Datos de demo solamente; no incorporar casos ni datos de clientes reales.
- Acción, protocolo o estado desconocido => fail closed.
- Una tool observada mediante `getTools()` no concede autoridad ni se invoca si
  no forma parte de un contrato interno declarado.
- Las tools contextuales se registran y retiran sólo con contratos internos y
  `AbortSignal`; no crear una megatool de control genérico del DOM.

## Verificación

```bash
npm test
```

No cerrar un tramo sin pruebas verdes y una entrada de evidencia append-only en
`cambios/bitacora-evidencia.md` si existe un hallazgo verificable.
