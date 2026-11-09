# Herramienta para analizar mis reels guardados de Instagram

## Contexto
La API oficial de Instagram (Graph API) **no** da acceso a los posts guardados,
así que la herramienta obtiene los reels por otra vía y luego los "ve" con IA.

## Fase 1 — Obtener la lista de guardados
- **A (recomendada):** Exportación oficial → Configuración → Centro de cuentas →
  *Descargar tu información* → formato JSON → "Guardado". Da `saved_posts.json`
  con URLs y fechas. Sin riesgo para la cuenta.
- **B:** `instaloader :saved --login tu_usuario`. Automático, pero va contra los
  términos de Instagram y puede provocar bloqueos.

## Fase 2 — Descargar vídeos + metadatos
- `yt-dlp` o `instaloader`: mp4, caption, autor, hashtags, fecha, audio.
- Con pausas entre descargas y usando tu sesión (cookies).

## Fase 3 — "Ver" cada reel
| Qué | Herramienta |
|---|---|
| Audio → texto | faster-whisper (local, gratis) |
| Fotogramas clave | ffmpeg |
| Texto en pantalla | EasyOCR / Tesseract |
| Comprensión visual + resumen | API de Claude con visión → JSON (resumen, tema, etiquetas, datos clave) |
| Música (opcional) | caption o `shazamio` |

## Fase 4 — Guardar y consultar
- SQLite (o JSON/CSV), una fila por reel.
- Encima: buscador, web con filtros o export a Excel/Notion.

## Fase 5 — Orquestación
- Script Python: guardados → descarga → transcribe → frames → Claude → guarda.
- Incremental: solo procesa reels nuevos.

## Requisitos (ejecución en local)
- Python 3.10+, ffmpeg
- API key de Anthropic
- Exportación de Instagram (opción A)

## Coste
Whisper/ffmpeg/OCR gratis en local; Claude unos céntimos por reel (4–8 frames).

## Preguntas pendientes
1. ¿Qué info quiero sacar de cada reel? (resumen, tutoriales de batería, recetas, ideas de clase…)
2. ¿Cuántos reels guardados tengo aprox.?
3. ¿Opción A o B?
4. ¿Cómo quiero consultar el resultado? (Excel, buscador web, Notion…)
