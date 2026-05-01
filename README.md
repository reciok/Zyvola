# Zyvola

Plataforma premium, modular y escalable inspirada en claridad operativa estilo TradingView.

## Estado de arquitectura (unificada)

Arquitectura activa unica: sitio estatico HTML/CSS/JS.

Estructura principal activa:

- `/index.html` -> HUB central Zyvola
- `/finance/index.html`
- `/productivity/index.html`
- `/tools/index.html`
- `/creative/index.html`
- `/life/index.html`
- `/connect/index.html`
- Subpaginas tipo herramienta:
  - `/productivity/rutinas/index.html`
  - `/tools/generador-x/index.html`

Motor compartido activo:

- `assets/css/styles.css` -> sistema visual premium
- `assets/js/pages.js` -> catalogo central de categorias, herramientas, subpaginas y highlights
- `assets/js/site.js` -> render dinamico de header, footer, buscador, tarjetas, categorias y subpaginas
- `assets/js/financeToolRuntime.js` + `assets/js/financeModuleEngine.js` -> motor financiero
- `assets/js/documentProcessor.js` -> flujo documental
- `assets/js/dashboard.js` + `assets/js/dashboardSend.js` -> dashboards

## Capa duplicada archivada

Para eliminar duplicidades sin borrar trabajo, la capa Next/React se movio a:

- `legacy-next/app`
- `legacy-next/components`
- `legacy-next/lib`
- `legacy-next/store`

No participa en la navegacion del sitio estatico actual.

## Sistema modular

Agregar una herramienta nueva:

1. Anadir objeto en `assets/js/pages.js` dentro de `tools`.
2. Referenciar su `id` en `categories.<categoria>.tools`.
3. (Opcional) incluirla en `highlights`.

No es necesario editar la navegacion ni el render de tarjetas: se generan automaticamente.

## Run local

Abrir `index.html` directamente o servir la carpeta con cualquier servidor estatico.

## Rollback rapido

Si quieres restaurar la capa archivada en su ubicacion original:

1. Mover `legacy-next/app` a `/app`
2. Mover `legacy-next/components` a `/components`
3. Mover `legacy-next/lib` a `/lib`
4. Mover `legacy-next/store` a `/store`
