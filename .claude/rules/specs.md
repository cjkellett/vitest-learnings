---
globs:
  - src/**/*.spec.js
---

## Co-location

Spec sits next to its source: `foo.js` → `foo.spec.js`; `UserCard.vue` → `UserCard.spec.js` (`docs/04-02`).

## Tooling

- `vitest` for unit/component tests.
- Shared helpers in `src/test-utility` (`AGENTS.md`).
- Mock dependencies with `vi.mock()`; mock API/repository modules rather than stubbing `api()` ad hoc.

## Style

- Behavior-driven: accessibility selectors (ARIA labels, roles). No `wrapper.vm` manipulation, no CSS-class queries (`docs/04-01`).
- Arrow functions in test bodies (house style).
- Behavior-oriented test names — describe what the user observes, not the implementation.

## Coverage rule (`AGENTS.md`)

Every new or modified `export`ed function ships a spec covering the happy path, documented edge cases (empty/whitespace/no-match/special characters), and every branch. Run the tests and confirm green before reporting done.

## Fake timers

Any spec that uses PrimeVue interactive components (overlays, dropdowns, split buttons) or calls `vi.setSystemTime` must install fake timers for the whole file:

```js
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});
```

- One `useFakeTimers` / `useRealTimers` pair at the outermost `describe` — never nested per-block.
- Never call `vi.setSystemTime` without `vi.useFakeTimers()` already installed; calling it alone causes Vitest to implicitly enable fake timers, making `useRealTimers()` teardown expensive.
- Always wire userEvent to advance fake timers: `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`. Without this, `findByText` / `findByLabelText` polling blocks on real time waiting for PrimeVue animations.
- `findBy*` assertions work correctly once `advanceTimers` is wired — no extra `vi.runAllTimers()` calls needed.
- Prefer `await vi.runAllTimersAsync()` over `waitFor()` when asserting that mocked functions were called after an async chain (e.g. click → API call → side-effects). `waitFor` polling can hang with fake timers; `vi.runAllTimersAsync()` drains both timers and microtasks in one call.
- Replace any `await new Promise((resolve) => setTimeout(resolve, 0))` patterns with `await vi.runAllTimersAsync()` — the `setTimeout` will never fire under fake timers.

## Stubbing heavy third-party components

When a spec's mount overhead is dominated by a large third-party component (e.g. PrimeVue `DataTable`, `Chart`, `Editor`), provide a stub via `global.stubs` in the mount options rather than mounting the real thing. The stub should be fast but honest: it must still render named slots with real data so rendering assertions pass.

Use `global.stubs`, not `vi.mock` — stubbing is a render-tree concern, not a module-level one.

**Pattern** — define stubs at file level, pass via `global.stubs`:

```js
import { h } from "vue";

const DataTableStub = {
  name: "DataTable",
  inheritAttrs: false, // prevents undeclared props forwarding to the root DOM element
  props: {
    value: { type: Array, default: () => [] },
    filters: { type: Object, default: () => ({}) },
  },
  emits: ["update:filters", "row-click", "sort", "filter", "page"],
  setup(props, { slots, emit }) {
    return () => {
      const cols = slots.default?.() ?? [];
      const rows = props.value ?? [];
      return h("table", [
        h("thead", [
          h(
            "tr",
            cols.map((col) =>
              h("th", col.children?.header?.() ?? col.props?.header ?? ""),
            ),
          ),
        ]),
        h("tbody", [
          ...rows.map((row) =>
            h(
              "tr",
              { onClick: () => emit("row-click", { data: row }) },
              cols.map((col) => h("td", col.children?.body?.({ data: row }))),
            ),
          ),
          rows.length === 0 ? h("tr", [h("td", slots.empty?.())]) : null,
        ]),
      ]);
    };
  },
};

const ColumnStub = { name: "Column", template: "<span />" };

// In mountComponent:
mount(MyComponent, {
  global: {
    plugins: [withPrimeVue()],
    stubs: { DataTable: DataTableStub, Column: ColumnStub },
  },
});
```

Key rules:

- `inheritAttrs: false` on any stub whose parent passes undeclared props — without it Vue forwards them to the root DOM node and `vitest-fail-on-console` turns warnings into failures.
- Access named slot content via `col.children?.body?.({ data: row })` — these are slot functions defined in the parent's template; calling them does not require the child component to be mounted.
- Use plain objects (`{ name, setup, ... }`) not `defineComponent()` — avoids the `vue/one-component-per-file` lint warning in spec files.

## Anti-patterns (`docs/04-01`)

- `wrapper.find('.submit-button')` and similar CSS-class queries.
- `wrapper.vm.handleSubmit()`, `wrapper.vm.isSuccess`.
- Asserting on internal component state.

## Run

```bash
npx vitest run <spec>
```
