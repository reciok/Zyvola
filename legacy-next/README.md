# Legacy Next Layer

Este directorio conserva la capa Next/React archivada durante la unificacion de arquitectura.

Objetivo:
- Evitar duplicidad funcional con la capa estatica activa.
- Mantener rollback seguro sin perdida de codigo.

Contenido archivado:
- app/
- components/
- lib/
- store/

Estado actual:
- La web activa usa solo HTML/CSS/JS del raiz y `assets/js/*`.
- Este codigo no se carga en el runtime estatico.
