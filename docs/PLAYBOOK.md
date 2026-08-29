# Playbook — Auralis Operator Desk

1. Leer `AGENTS.md`, `STATUS.md`, `mapa-global/arquitectura.yaml` y las últimas
   entradas de `cambios/`.
2. Antes de cambiar comportamiento, actualizar CMCF/FASER o crear una nueva
   especificación Draft.
3. Mantener las tools WebMCP estables salvo contrato aprobado por humano.
4. Añadir ECA al descubrir un fallo, rechazo o frontera nueva.
5. Ejecutar `npm test`, revisar el diff y registrar evidencia antes del cierre.

## Límite del hackathon

La URL pública debe demostrar WebMCP nativo y un flujo humano-agente estable.
Integraciones externas no son necesarias para el P1 y no deben introducir
credenciales ni dependencias que vuelvan frágil la demo.
