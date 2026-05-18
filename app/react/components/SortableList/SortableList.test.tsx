import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { SortableList, SortableListState, SortableGroup } from './SortableList';

interface Item {
  id: number;
  name: string;
  status: string;
}

const ITEMS: Item[] = [
  { id: 1, name: 'Alpha', status: 'healthy' },
  { id: 2, name: 'Beta', status: 'error' },
  { id: 3, name: 'Gamma', status: 'healthy' },
  { id: 4, name: 'Delta', status: 'syncing' },
  { id: 5, name: 'Epsilon', status: 'healthy' },
  { id: 6, name: 'Zeta', status: 'error' },
  { id: 7, name: 'Eta', status: 'healthy' },
  { id: 8, name: 'Theta', status: 'syncing' },
];

const SORT_OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
];

describe('SortableList', () => {
  it('renders items in groups', () => {
    renderList();

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Theta')).toBeInTheDocument();
  });

  it('calls setGroupFilter when a sort option is clicked', async () => {
    const user = userEvent.setup();
    const setGroupFilter = vi.fn();
    renderList({ state: { setGroupFilter } });

    await user.click(screen.getByText('Status'));

    expect(setGroupFilter).toHaveBeenCalledWith({
      group: 'status',
      groupValue: null,
    });
  });

  it('shows group headers when showGroupHeaders=true and multiple groups', () => {
    renderList({
      groups: makeStatusGroups(ITEMS),
      state: { sortBy: { id: 'status', desc: false } },
      groupOptions: {
        status: [{ key: 'healthy' }, { key: 'error' }, { key: 'syncing' }],
      },
      showGroupHeaders: true,
    });

    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('hides group header when there is only one group', () => {
    renderList({
      groups: makeGroups(ITEMS, 'SingleGroup'),
      showGroupHeaders: true,
    });

    expect(screen.queryByText('SingleGroup')).not.toBeInTheDocument();
  });

  it('shows empty message when groups is empty', () => {
    renderList({ groups: [], totalCount: 0 });

    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('shows custom empty message', () => {
    renderList({
      groups: [],
      totalCount: 0,
      emptyMessage: 'No workflows match your search',
    });

    expect(
      screen.getByText('No workflows match your search')
    ).toBeInTheDocument();
  });

  it('shows pagination info when totalCount exceeds pageSize', () => {
    renderList({
      groups: makeGroups(ITEMS.slice(0, 5)),
      totalCount: 20,
      state: { pageSize: 5, page: 0 },
    });

    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByText(/of/)).toBeInTheDocument();
  });

  it('calls setPage when next-page button is clicked', async () => {
    const user = userEvent.setup();
    const setPage = vi.fn();
    renderList({
      state: { pageSize: 5, page: 0, setPage },
      groups: makeGroups(ITEMS.slice(0, 5)),
      totalCount: 20,
    });

    await user.click(screen.getByTitle('Next page'));

    expect(setPage).toHaveBeenCalledWith(1);
  });

  it('calls setPage(0) when first-page button is clicked from page 2', async () => {
    const user = userEvent.setup();
    const setPage = vi.fn();
    renderList({
      state: { pageSize: 5, page: 1, setPage },
      groups: makeGroups(ITEMS.slice(5, 10)),
      totalCount: 20,
    });

    await user.click(screen.getByTitle('First page'));

    expect(setPage).toHaveBeenCalledWith(0);
  });

  it('renders column headers for each group when renderColumnHeaders is provided', () => {
    const groups = makeStatusGroups(ITEMS);
    renderList({
      groups,
      showGroupHeaders: true,
      renderColumnHeaders: () => <div>col-header</div>,
    });

    expect(screen.getAllByText('col-header')).toHaveLength(groups.length);
  });

  it('calls renderColumnHeaders with the group key and items', () => {
    const groups = makeStatusGroups(ITEMS);
    const renderColumnHeaders = vi.fn(() => null);
    renderList({ groups, showGroupHeaders: true, renderColumnHeaders });

    groups.forEach((g) =>
      expect(renderColumnHeaders).toHaveBeenCalledWith(g.key, g.items)
    );
  });

  it('renders the group icon in the group header', () => {
    const groups: SortableGroup<Item>[] = [
      {
        key: 'a',
        label: 'Group A',
        icon: <span>★</span>,
        items: ITEMS.slice(0, 2),
      },
      { key: 'b', label: 'Group B', items: ITEMS.slice(2, 4) },
    ];
    renderList({
      groups,
      groupOptions: { name: [{ key: 'a' }, { key: 'b' }] },
      totalCount: 4,
      showGroupHeaders: true,
    });

    expect(screen.getByText('★')).toBeInTheDocument();
  });

  describe('sortBy case-insensitive normalisation', () => {
    it('shows group headers when sortBy.id is uppercased', () => {
      renderList({
        groups: makeStatusGroups(ITEMS),
        state: { sortBy: { id: 'STATUS', desc: false } },
        groupOptions: {
          status: [{ key: 'healthy' }, { key: 'error' }, { key: 'syncing' }],
        },
        showGroupHeaders: true,
      });

      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    it('shows group headers when sortBy.id is mixed-case', () => {
      renderList({
        groups: makeStatusGroups(ITEMS),
        state: { sortBy: { id: 'Status', desc: false } },
        groupOptions: {
          status: [{ key: 'healthy' }, { key: 'error' }, { key: 'syncing' }],
        },
        showGroupHeaders: true,
      });

      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    it('highlights the sort option whose key matches case-insensitively', () => {
      renderList({
        state: { sortBy: { id: 'STATUS', desc: false } },
      });

      expect(screen.getByRole('button', { name: /Status/i })).toHaveTextContent(
        'Asc'
      );
    });

    it('shows no active sort option when sortBy.id has no match', () => {
      renderList({
        state: { sortBy: { id: 'unknown', desc: false } },
      });

      expect(
        screen.getByRole('button', { name: /Name/i })
      ).not.toHaveTextContent('Asc');
      expect(
        screen.getByRole('button', { name: /Status/i })
      ).not.toHaveTextContent('Asc');
    });
  });

  it('renders the group description in the group header', () => {
    const groups: SortableGroup<Item>[] = [
      {
        key: 'a',
        label: 'Group A',
        description: 'hint text',
        items: ITEMS.slice(0, 2),
      },
      { key: 'b', label: 'Group B', items: ITEMS.slice(2, 4) },
    ];
    renderList({
      groups,
      groupOptions: { name: [{ key: 'a' }, { key: 'b' }] },
      totalCount: 4,
      showGroupHeaders: true,
    });

    expect(screen.getByText('hint text')).toBeInTheDocument();
  });
});

function renderList({
  state = createMockState(),
  groups = makeGroups(ITEMS),
  totalCount = ITEMS.length,
  renderItem = (item: Item) => <div key={item.id}>{item.name}</div>,
  groupOptions,
  showGroupHeaders,
  emptyMessage,
  renderColumnHeaders,
  getItemKey,
  searchPlaceholder,
  actionButton,
  isLoading,
}: {
  state?: Partial<SortableListState>;
  groups?: SortableGroup<Item>[];
  totalCount?: number;
  renderItem?: (item: Item, index: number) => ReactNode;
  groupOptions?: Record<string, { key: string; label?: string }[]>;
  showGroupHeaders?: boolean;
  emptyMessage?: string;
  renderColumnHeaders?: (groupKey: string, items: Item[]) => ReactNode;
  getItemKey?: (item: Item, index: number) => string | number;
  searchPlaceholder?: string;
  actionButton?: ReactNode;
  isLoading?: boolean;
} = {}) {
  const tableState = createMockState(state);

  render(
    <SortableList
      tableState={tableState}
      sortOptions={SORT_OPTIONS}
      groups={groups}
      totalCount={totalCount}
      renderItem={renderItem}
      groupOptions={groupOptions}
      showGroupHeaders={showGroupHeaders}
      emptyMessage={emptyMessage}
      renderColumnHeaders={renderColumnHeaders}
      getItemKey={getItemKey}
      searchPlaceholder={searchPlaceholder}
      actionButton={actionButton}
      isLoading={isLoading}
      data-cy="sortable-list"
    />
  );
}

function makeGroups(items: Item[], label = 'Items'): SortableGroup<Item>[] {
  if (items.length === 0) return [];
  return [{ key: 'items', label, items }];
}

function makeStatusGroups(items: Item[]): SortableGroup<Item>[] {
  const byStatus = items.reduce<Record<string, Item[]>>((acc, item) => {
    const group = acc[item.status] ?? [];
    return { ...acc, [item.status]: [...group, item] };
  }, {});
  return Object.entries(byStatus).map(([status, statusItems]) => ({
    key: status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
    items: statusItems,
  }));
}

function createMockState(
  overrides?: Partial<SortableListState>
): SortableListState {
  return {
    sortBy: { id: 'name', desc: false },
    setSortBy: vi.fn(),
    pageSize: 10,
    setPageSize: vi.fn(),
    page: 0,
    setPage: vi.fn(),
    groupBy: null,
    setGroupBy: vi.fn(),
    groupFilter: null,
    setGroupFilter: vi.fn(),
    search: '',
    setSearch: vi.fn(),
    ...overrides,
  };
}
