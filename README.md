# pruebas-claude-code

Proyecto de pruebas con skills para Claude Code. Las skills viven en `.claude/skills/` y Claude las carga automáticamente al trabajar en este repo.

## App: Acordes con las manos (`docs/`)

Sinte de acompañamiento que se toca con gestos delante de la webcam (MediaPipe Hands + Tone.js).

- **Mano izquierda (acordes)**: modo *Por escala* (eliges tónica y escala; cada gesto es un grado, del I al VII) o modo *Acordes a mi gusto* (eliges qué acorde toca cada gesto). Puño = silencio.
- **Mano derecha (acompañamiento)**: modo *Inversión* (cada gesto elige una inversión) o modo *Ritmo* (cada gesto elige un patrón: bloque, negras, pop, arpegios, Alberti, vals, ska, bossa). Puño = no cambia nada.
- Los ajustes se guardan en el navegador.

Para probarla en local: `cd docs && python3 -m http.server 8000` y abre `http://localhost:8000`. Para publicarla: en GitHub, *Settings → Pages → Deploy from a branch*, carpeta `/docs`.

Tests: `node --test tests/*.test.mjs`.

## Skills incluidas

### De [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) (v0.6.13, licencia MIT)

25 skills de ingeniería de software para todo el ciclo de desarrollo (idea → spec → plan → código → tests → revisión → despliegue):

`api-and-interface-design`, `browser-testing-with-devtools`, `ci-cd-and-automation`, `code-review-and-quality`, `code-simplification`, `constraint-driven-development`, `context-engineering`, `debugging-and-error-recovery`, `deprecation-and-migration`, `documentation-and-adrs`, `doubt-driven-development`, `frontend-ui-engineering`, `git-workflow-and-versioning`, `idea-refine`, `incremental-implementation`, `interview-me`, `observability-and-instrumentation`, `performance-optimization`, `planning-and-task-breakdown`, `security-and-hardening`, `shipping-and-launch`, `source-driven-development`, `spec-driven-development`, `test-driven-development`, `using-agent-skills`.

Los checklists compartidos que enlazan (seguridad, rendimiento, accesibilidad, etc.) están en `.claude/references/`.

También incluye:

- **Comandos** (`.claude/commands/`): `/spec`, `/plan`, `/build` (o `/build auto`), `/test`, `/constraints`, `/review`, `/webperf`, `/code-simplify`, `/ship`.
- **Agentes** (`.claude/agents/`): `code-reviewer`, `security-auditor`, `test-engineer`, `web-performance-auditor`.

### De [Panniantong/Agent-Reach](https://github.com/Panniantong/agent-reach) (licencia MIT)

`agent-reach`: investigación y lectura en Internet (web, búsqueda, YouTube, GitHub, Reddit, Twitter/X, Bilibili, RSS…). `SKILL.md` es la versión en inglés; `SKILL_zh.md` es la original en chino.

Requiere tener instalada la CLI de Agent Reach. Para instalarla, pídele a Claude:

```
Install Agent Reach: https://raw.githubusercontent.com/Panniantong/agent-reach/main/docs/install.md
```

### De [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) (v5.2.0, licencia MIT)

Modo "senior perezoso": el cambio más pequeño que resuelve la tarea por completo, sin recortar validación, seguridad ni accesibilidad. Cada skill se invoca también como comando:

- `/ponytail [lite|full|ultra]`: activa el modo o cambia su intensidad.
- `/ponytail-review`: revisa el diff (fallos, seguridad, carga, tests que faltan, qué sobra).
- `/ponytail-audit`: la misma revisión para todo el repo, ordenada por prioridad.
- `/ponytail-debt`: recopila los comentarios `shortcut:` en una lista de deuda técnica.
- `/ponytail-gain`: muestra los resultados medidos del benchmark.
- `/ponytail-help`: chuleta de comandos.

No se incluyen los hooks del plugin, así que no se activa solo al empezar cada sesión: se activa con `/ponytail` o cuando la tarea encaja con la descripción de la skill.

## Licencias

Las licencias originales están en `.claude/licenses/`.
