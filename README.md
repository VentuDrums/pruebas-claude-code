# pruebas-claude-code

Proyecto de pruebas con skills para Claude Code. Las skills viven en `.claude/skills/` y Claude las carga automáticamente al trabajar en este repo.

## Skills incluidas

### De [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) (v0.6.13, licencia MIT)

25 skills de ingeniería de software para todo el ciclo de desarrollo (idea → spec → plan → código → tests → revisión → despliegue):

`api-and-interface-design`, `browser-testing-with-devtools`, `ci-cd-and-automation`, `code-review-and-quality`, `code-simplification`, `constraint-driven-development`, `context-engineering`, `debugging-and-error-recovery`, `deprecation-and-migration`, `documentation-and-adrs`, `doubt-driven-development`, `frontend-ui-engineering`, `git-workflow-and-versioning`, `idea-refine`, `incremental-implementation`, `interview-me`, `observability-and-instrumentation`, `performance-optimization`, `planning-and-task-breakdown`, `security-and-hardening`, `shipping-and-launch`, `source-driven-development`, `spec-driven-development`, `test-driven-development`, `using-agent-skills`.

Los checklists compartidos que enlazan (seguridad, rendimiento, accesibilidad, etc.) están en `.claude/references/`.

### De [Panniantong/Agent-Reach](https://github.com/Panniantong/agent-reach) (licencia MIT)

`agent-reach`: investigación y lectura en Internet (web, búsqueda, YouTube, GitHub, Reddit, Twitter/X, Bilibili, RSS…). `SKILL.md` es la versión en inglés; `SKILL_zh.md` es la original en chino.

Requiere tener instalada la CLI de Agent Reach. Para instalarla, pídele a Claude:

```
Install Agent Reach: https://raw.githubusercontent.com/Panniantong/agent-reach/main/docs/install.md
```

## Licencias

Las licencias originales están en `.claude/licenses/`.
