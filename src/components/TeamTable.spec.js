import { h } from 'vue'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import PrimeVue from 'primevue/config'
import TeamTable from './TeamTable.vue'

const DataTableStub = {
  name: 'DataTable',
  inheritAttrs: false,
  props: {
    value: { type: Array, default: () => [] },
  },
  setup(props, { slots }) {
    return () => {
      const cols = slots.default?.() ?? []
      const rows = props.value ?? []
      return h('table', [
        h('thead', [
          h('tr', cols.map(col => h('th', col.props?.header ?? ''))),
        ]),
        h('tbody',
          rows.length === 0
            ? [h('tr', [h('td', slots.empty?.())])]
            : rows.map(row =>
                h('tr', cols.map(col =>
                  h('td', col.children?.body?.({ data: row }) ?? row[col.props?.field] ?? '')
                ))
              )
        ),
      ])
    }
  },
}

const ColumnStub = { name: 'Column', template: '<span />' }

const renderTeamTable = () =>
  render(TeamTable, {
    global: {
      plugins: [[PrimeVue]],
      stubs: { DataTable: DataTableStub, Column: ColumnStub },
    },
  })

describe('TeamTable name filter', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

  it('shows all rows when filter is empty', () => {
    renderTeamTable()
    expect(screen.getByText('Alice Nguyen')).toBeTruthy()
    expect(screen.getByText('James Tanaka')).toBeTruthy()
  })

  it('filters rows to only matching names', async () => {
    renderTeamTable()
    await user.type(screen.getByPlaceholderText('Search by name...'), 'Grace')
    expect(screen.getByText('Grace Chen')).toBeTruthy()
    expect(screen.queryByText('Alice Nguyen')).toBeNull()
  })

  it('is case-insensitive', async () => {
    renderTeamTable()
    await user.type(screen.getByPlaceholderText('Search by name...'), 'grace')
    expect(screen.getByText('Grace Chen')).toBeTruthy()
  })

  it('shows no rows when filter matches nothing', async () => {
    renderTeamTable()
    await user.type(screen.getByPlaceholderText('Search by name...'), 'zzz')
    expect(screen.queryByText('Alice Nguyen')).toBeNull()
    expect(screen.queryByText('James Tanaka')).toBeNull()
  })
})
