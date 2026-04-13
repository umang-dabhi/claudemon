# Claudemon — Development Rules

> Follow these rules strictly during all development. No exceptions.

---

## Code Quality

### SOLID Principles
- **S — Single Responsibility:** One class/module = one job. `xp.ts` handles XP math, not state persistence.
- **O — Open/Closed:** Extend via new Pokemon data or achievement definitions, not by modifying core engine logic.
- **L — Liskov Substitution:** Any `OwnedPokemon` must work anywhere a Pokemon reference is expected.
- **I — Interface Segregation:** Small, focused interfaces. Don't force consumers to depend on methods they don't use.
- **D — Dependency Inversion:** Core engine depends on abstractions (e.g., `StateStore` interface), not concrete file I/O.

### DRY
- Zero duplicate logic. If two tools need XP calculation, they call the same function.
- Shared constants in one place (`src/engine/constants.ts`).
- Pokemon data lives in one file, referenced everywhere.

### Design Patterns
- **Singleton:** State manager — one instance manages all reads/writes to `~/.claudemon/`.
- **Strategy:** Evolution methods (level-up, badge, collaboration) are interchangeable strategies.
- **Observer:** Hook events trigger XP awards, reactions, achievement checks through a single event pipeline.
- **Factory:** Pokemon creation (starter generation, wild encounter generation) goes through factory functions.

---

## TypeScript Standards

### Types & Interfaces
- Type everything. No `any`. No implicit `any`. No `as` casts unless absolutely unavoidable (with comment explaining why).
- Use `interface` for object shapes that may be extended. Use `type` for unions, intersections, and primitives.
- All function parameters and return types must be explicitly typed.
- Prefer `readonly` for data that shouldn't mutate after creation.
- Use discriminated unions for state variants (e.g., evolution method types).

### Naming
- Files: `kebab-case.ts`
- Interfaces: `PascalCase` (no `I` prefix)
- Types: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Enums: `PascalCase` members

### Exports
- Named exports only. No default exports.
- Barrel files (`index.ts`) for module boundaries, not inside modules.

### Formatting
- **Prettier** is enforced. Config in `.prettierrc`.
- Run `bun run format` before committing.
- Run `bun run format:check` in CI to verify.
- Settings: 2-space indent, double quotes, semicolons, trailing commas, 100-char print width.

---

## Comments

- Short, purposeful comments only. Explain **why**, not **what**.
- No comment for self-evident code (`// increment counter` above `counter++` = bad).
- JSDoc on all public functions: one-liner description, `@param`, `@returns`. No novels.
- TODO comments must include context: `// TODO(phase-3): add shiny variant support`

---

## File Organization

- One concern per file. If a file exceeds ~200 lines, split it.
- Imports ordered: external packages → internal modules → relative imports. Blank line between groups.
- No circular dependencies. If A imports B and B needs A, extract shared types to a third file.

---

## State & Data

- All state mutations go through the `StateManager` singleton. No direct `fs.writeFile` in tool handlers.
- Atomic writes only (temp file + rename).
- JSON schemas validated at load boundaries (when reading from disk).
- Pokemon data is static and readonly at runtime. Never mutate the Pokedex.
- **Path constants that depend on `process.env` must be functions, not static constants.** Static constants are evaluated once at import time and won't reflect runtime changes (e.g., `getStateDir()` not `STATE_DIR`). This was a real bug — see TASKS.md 1.13.

---

## Error Handling

- Fail loud at boundaries (CLI, MCP tool entry points). Return clear error messages.
- Never swallow errors silently. Log to stderr if recovery is possible.
- Use typed error classes, not string throws.
- Hooks must never crash — catch everything, exit 0 on non-critical failure.

---

## Testing

- Test files next to source: `xp.ts` → `xp.test.ts` (in `tests/` mirror structure).
- Test behavior, not implementation.
- Golden snapshot tests for deterministic outputs (XP curves, evolution triggers, sprite rendering).
- Every bug fix gets a regression test.

---

## Git

- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- One logical change per commit.
- Never commit generated files without `.generated` suffix or gitignore entry.
- Commit sprites separately from logic changes.

---

## Performance

- MCP server startup: target < 100ms.
- Hook execution: target < 200ms.
- Pre-render sprites at build time. Zero image processing at runtime.
- Lazy-load sprite data — don't load all 151 into memory at startup.

---

## Scope Discipline

- Build what the task says. Nothing more.
- No speculative abstractions for hypothetical features.
- No "improvements" to code outside the current task scope.
- If something feels wrong, flag it as a TODO for a future phase — don't fix it now.
