# Vitest + Vue Testing Library

A guide to writing fast, maintainable component tests in this codebase. There are 2 key techniques to ensure we do and add to harness.

## Why this matters

3 spec files accounted for 49% of test execution time in a real CI run (37s of 75s). All three were fixed by the patterns in this guide.

Numbers from production CI (`--maxWorkers=1`):

| Fix                                    | Before   | After     |
| -------------------------------------- | -------- | --------- |
| Fake timers — worst case (single file) | ~20s     | ~2.3s     |
| Fake timers — typical file             | 2–4s     | 400–700ms |
| DataTable stub — 22 mounts             | ~6,600ms | ~1,500ms  |

These compound. CI runs on slower hardware than your local machine — the same suite took 28.44s locally and 127.26s in CI (~4.5× slower). Slow tests that feel acceptable locally become a much bigger problem in the pipeline.

---

## 1. Fake timers on primevue components

> **Note:** Examples below use Vue Testing Library, but the problem and fix apply equally to `@vue/test-utils`. The root cause is PrimeVue's internal `setTimeout` calls — those fire regardless of how you mount the component. With Vue Test Utils, replace `userEvent` interactions with `wrapper.trigger()` and drain timers manually with `await vi.runAllTimersAsync()` after each interaction.

PrimeVue interactive components (overlays, dropdowns, split buttons) use internal timers for animations and transitions. Without fake timers, `userEvent` interactions block on real time waiting for them.

**Install at the top of any affected spec file:**

```js
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});
```

**Wire `userEvent` to advance them:**

```js
const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
```

Without the `advanceTimers` wire-up, `findBy*` queries will time out even with fake timers installed.

---

## 2. Stubbing heavy PrimeVue components

Mounting `DataTable`, `Chart`, or `Editor` in a test is expensive — these components set up resize observers, virtual scrolling, transitions, and significant DOM. If your spec is testing the _parent component's logic_, not PrimeVue itself, stub them.

Use `global.stubs`, not `vi.mock` — this is a render-tree concern, not a module-level one.

The stub must call named slots with real row data so text assertions still pass:

```js
import { h } from "vue";

const DataTableStub = {
  name: "DataTable",
  inheritAttrs: false,
  props: { value: { type: Array, default: () => [] } },
  setup(props, { slots }) {
    return () => {
      const cols = slots.default?.() ?? [];
      const rows = props.value ?? [];
      return h("table", [
        h("thead", [
          h(
            "tr",
            cols.map((col) => h("th", col.props?.header ?? "")),
          ),
        ]),
        h(
          "tbody",
          rows.map((row) =>
            h(
              "tr",
              cols.map((col) =>
                h(
                  "td",
                  col.children?.body?.({ data: row }) ??
                    row[col.props?.field] ??
                    "",
                ),
              ),
            ),
          ),
        ),
      ]);
    };
  },
};

const ColumnStub = { name: "Column", template: "<span />" };
```

Pass via mount options:

```js
render(MyComponent, {
  global: {
    plugins: [[PrimeVue]],
    stubs: { DataTable: DataTableStub, Column: ColumnStub },
  },
});
```

Key rules for stubs:

- `inheritAttrs: false` — prevents undeclared props forwarding to the root DOM node, which would cause console warnings
- Call `col.children?.body?.({ data: row })` to render slot content — do not skip this or row data won't appear in the DOM
- Use plain objects, not `defineComponent()` — avoids lint warnings in spec files

---

## 3. Prefer the Node environment over jsdom

jsdom spins up a simulated browser environment for every test file that uses it — that's the `environment 140.44s` cost visible in the CI log. It's only needed when a test actually mounts a component or touches the DOM.

If your spec tests a composable, a utility function, a repository, or any pure logic, run it in Node:

```js
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { calculateTotals } from './calculateTotals'

// no DOM, no Vue — just fast
```

**In this project, environment matching is automatic:**

- `**/utils/**/*.spec.js` → Node environment
- Everything else → jsdom

You don't need to add any annotation to utils specs — they get Node for free. The trade-off: keep DOM-related concerns out of `utils/`. If a utility needs `document`, `window`, or any browser API, it belongs outside the utils folder or the spec needs to opt in to jsdom explicitly with `// @vitest-environment jsdom`.
