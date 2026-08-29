# SUME + STDG — Auralis Operator Desk

| Carpeta | Responsabilidad |
| --- | --- |
| `entradas/` | Arranque de página y registro WebMCP. |
| `logica/` | Workspace y frontera de aprobación. |
| `salidas/` | Render seguro de la interfaz y del historial. |
| `contratos/` | Schemas de tools, errores y FASER. |
| `cambios/` | Registro append-only y evidencia. |
| `mapa-global/` | Mapa vivo y fuente de verdad de dependencias. |

Todo módulo bajo SUME comienza con un DOCBLOCK, figura exactamente una vez en
`mapa-global/arquitectura.yaml` y no supera 130 líneas físicas. La prueba de
arquitectura protege las tres reglas.
