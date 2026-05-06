# Zyvola · módulo ETFs

Sistema modular para importar el universo de ETFs UCITS europeos disponibles en Trade Republic, detectar rallies pasados, analizarlos técnica y macroeconómicamente, generar patrones y proponer "ETFs con futuro".

## Estructura

```
etf/
  etfDataImporter.js   → universo de ETFs (semilla + remoteFetcher pluggable)
  etfPriceFeed.js      → precios históricos (semilla determinista + provider externo)
  etfAnalyzer.js       → indicadores: %, RSI, EMA, breakout, fuerza relativa, volatilidad
  etfRallyDetector.js  → busca subidas ≥ +15% entre 7 y 90 días
  etfRallyDatabase.js  → persistencia (localStorage + memoria) con query/stats
  etfRallyAnalysis.js  → contexto técnico + macro + conclusión automática
  etfPatternEngine.js  → patrones repetidos en rallies registrados
  etfFutureFinder.js   → ETFs actuales que cumplen ≥ 70% de un patrón ganador
  etfAPI.js            → endpoints (dispatcher) y pipeline diario
  index.html           → demo navegable
```

## Orden de carga (sin bundler)

```html
<script src="etf/etfDataImporter.js"></script>
<script src="etf/etfPriceFeed.js"></script>
<script src="etf/etfAnalyzer.js"></script>
<script src="etf/etfRallyDetector.js"></script>
<script src="etf/etfRallyDatabase.js"></script>
<script src="etf/etfRallyAnalysis.js"></script>
<script src="etf/etfPatternEngine.js"></script>
<script src="etf/etfFutureFinder.js"></script>
<script src="etf/etfAPI.js"></script>
```

## Uso rápido

```js
// Ejecuta el pipeline diario completo
const run = ETF_API.call("/etf/run").data;

// Lecturas
ETF_API.call("/etf/universe");
ETF_API.call("/etf/rallies");
ETF_API.call("/etf/patrones");
ETF_API.call("/etf/futuro");
ETF_API.call("/etf/snapshot");
```

## Conexión a fuentes reales

- **ETFs**: `ZyvolaETF.dataImporter.setRemoteFetcher(async () => [...])` → debe devolver objetos `{ nombre, ticker, ISIN, gestora, TER, sector, tipo, moneda }`.
- **Precios**: `ZyvolaETF.priceFeed.setProvider((etf, days) => [...])` → debe devolver `[{ date:"YYYY-MM-DD", close:Number, volume:Number }, ...]` (síncrono o Promise).
- **Macro**: define `window.ZyvolaETF.macroNarratives = { "Sector": { tema, economica, sentimiento }, ... }` antes de ejecutar el pipeline.

## Esquema de un rally registrado

```json
{
  "id": "IE00B5BMR087|2025-09-01|2025-10-12",
  "etf": { "nombre": "...", "ticker": "CSPX", "ISIN": "...", "gestora": "iShares", "sector": "...", "tipo": "Equity", "moneda": "USD" },
  "fechaInicio": "2025-09-01",
  "fechaFin": "2025-10-12",
  "duracionDias": 41,
  "porcentajeSubida": 17.43,
  "volumenRelativo": 1.45,
  "contextoTecnico": {
    "rupturaResistencia": true,
    "rsiPrevio": 64.2,
    "alineacionEMA": true,
    "volumenAlto": true,
    "fuerzaRelativa": { "value": 18.1, "avg": 4.6, "spread": 13.5, "rank": 0.93 }
  },
  "contextoMacro": {
    "noticiaSector": "Liderazgo Magnificent Seven",
    "noticiaEconomica": "Liquidez global",
    "sentimientoMercado": "positivo",
    "ventana": { "desde": "...", "hasta": "..." }
  },
  "conclusionAutomatica": "Rally del 17.43% en 41 días impulsado por ruptura de resistencia de 60 días, EMA20 sobre EMA50, RSI fuerte (64.2), volumen relativo 1.45×, narrativa: liderazgo magnificent seven."
}
```
