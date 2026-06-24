import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import PrimeVue from 'primevue/config'
import TeamTable from './TeamTable.vue'

const renderTeamTable = () =>
  render(TeamTable, { global: { plugins: [[PrimeVue]] } })

describe('TeamTable name filter', () => {
  it('shows all rows when filter is empty', () => {
    renderTeamTable()
    expect(screen.getByText('Alice Nguyen')).toBeTruthy()
    expect(screen.getByText('James Tanaka')).toBeTruthy()
  })

  it('filters rows to only matching names', async () => {
    renderTeamTable()
    await userEvent.type(screen.getByPlaceholderText('Search by name...'), 'Grace')
    expect(screen.getByText('Grace Chen')).toBeTruthy()
    expect(screen.queryByText('Alice Nguyen')).toBeNull()
  })

  it('is case-insensitive', async () => {
    renderTeamTable()
    await userEvent.type(screen.getByPlaceholderText('Search by name...'), 'grace')
    expect(screen.getByText('Grace Chen')).toBeTruthy()
  })

  it('shows no rows when filter matches nothing', async () => {
    renderTeamTable()
    await userEvent.type(screen.getByPlaceholderText('Search by name...'), 'zzz')
    expect(screen.queryByText('Alice Nguyen')).toBeNull()
    expect(screen.queryByText('James Tanaka')).toBeNull()
  })
})
