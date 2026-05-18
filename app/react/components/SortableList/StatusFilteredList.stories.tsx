// This story demonstrates how StatusSummaryBar and SortableList integrate:
// the summary bar filter and the group-sort dimension filter share state so
// that selecting a status from either control keeps both in sync.
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { userEvent, within, expect } from 'storybook/test';
import { useState } from 'react';

import { buildGroupSortExtras } from '@@/datatables/groupSortState';
import {
  StatusSummaryBar,
  StatusSegment,
} from '@@/StatusSummaryBar/StatusSummaryBar';

import { SortableList, SortableGroup, SortableListState } from './SortableList';

type Item = {
  id: number;
  name: string;
  status: string;
  type: string;
  platform: string;
};

const ITEMS: Item[] = [
  { id: 1, name: 'Alpha', status: 'error', type: 'stack', platform: 'linux' },
  { id: 2, name: 'Beta', status: 'healthy', type: 'stack', platform: 'linux' },
  { id: 3, name: 'Gamma', status: 'error', type: 'edge', platform: 'windows' },
  {
    id: 4,
    name: 'Delta',
    status: 'healthy',
    type: 'edge',
    platform: 'windows',
  },
  { id: 5, name: 'Eta', status: 'outdated', type: 'stack', platform: 'mac' },
];

const SEGMENTS: StatusSegment<string>[] = [
  { key: 'error', label: 'Error', count: 2, color: 'error' },
  { key: 'healthy', label: 'Healthy', count: 2, color: 'success' },
  { key: 'outdated', label: 'Outdated', count: 1, color: 'warning' },
];

const SORT_OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', grouped: true },
  { key: 'type', label: 'Type', grouped: true },
  { key: 'platform', label: 'Platform', grouped: true },
];

const GROUP_OPTIONS: Record<string, Array<{ key: string; label: string }>> = {
  status: SEGMENTS,
  type: [
    { key: 'stack', label: 'Stack' },
    { key: 'edge', label: 'Edge' },
  ],
  platform: [
    { key: 'linux', label: 'Linux' },
    { key: 'windows', label: 'Windows' },
    { key: 'mac', label: 'Mac' },
  ],
};

const SORT_KEYS = ['name', 'status', 'type', 'platform'] as const;
const DIMENSIONS = [{ key: 'status' }, { key: 'type' }, { key: 'platform' }];

type Params = {
  sort: string;
  order: 'asc' | 'desc';
  status: string | null;
  type: string | null;
  platform: string | null;
  page: number;
  pageSize: number;
  search: string;
};

function buildGroups(items: Item[], sortBy: string): SortableGroup<Item>[] {
  const options = GROUP_OPTIONS[sortBy];
  if (!options) {
    return items.length > 0 ? [{ key: 'all', label: 'All', items }] : [];
  }
  return options
    .map(({ key, label }) => ({
      key,
      label,
      items: items.filter((item) => item[sortBy as keyof Item] === key),
    }))
    .filter((g) => g.items.length > 0);
}

function Demo() {
  const [params, setParams] = useState<Params>({
    sort: 'name',
    order: 'asc',
    status: null,
    type: null,
    platform: null,
    page: 0,
    pageSize: 10,
    search: '',
  });

  function patchParams(update: Record<string, unknown>) {
    setParams((prev) => {
      const next = { ...prev } as Record<string, unknown>;
      for (const [k, v] of Object.entries(update)) {
        next[k] = v ?? null;
      }
      return next as Params;
    });
  }

  const { groupFilter, setGroupFilter } = buildGroupSortExtras({
    urlState: params,
    setUrlState: patchParams,
    defaultSort: 'name',
    sortKeys: SORT_KEYS,
    dimensions: DIMENSIONS,
  });

  const isDimension = DIMENSIONS.some((d) => d.key === params.sort);

  const tableState: SortableListState = {
    sortBy: { id: params.sort, desc: params.order === 'desc' },
    setSortBy: (id, desc) =>
      patchParams({
        sort: id ?? 'name',
        order: desc ? 'desc' : 'asc',
        page: 0,
      }),
    pageSize: params.pageSize,
    setPageSize: (pageSize) => patchParams({ pageSize, page: 0 }),
    page: params.page,
    setPage: (page) => patchParams({ page }),
    groupBy: isDimension ? params.sort : null,
    setGroupBy: (groupBy) => patchParams({ sort: groupBy ?? 'name' }),
    groupFilter,
    setGroupFilter,
    search: params.search,
    setSearch: (search) => patchParams({ search, page: 0 }),
  };

  const filterValue = params.status;
  function setFilter(v: string | null) {
    patchParams({ status: v, page: 0 });
  }

  // Apply filters: summary-bar status filter + active dimension group filter
  let filteredItems = ITEMS;
  if (filterValue != null) {
    filteredItems = filteredItems.filter((i) => i.status === filterValue);
  }
  const dimKey = isDimension && params.sort !== 'status' ? params.sort : null;
  const dimFilter = dimKey
    ? (params[dimKey as keyof Params] as string | null)
    : null;
  if (dimKey && dimFilter != null) {
    filteredItems = filteredItems.filter(
      (i) => i[dimKey as keyof Item] === dimFilter
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <StatusSummaryBar
        total={ITEMS.length}
        segments={SEGMENTS}
        value={filterValue}
        onChange={setFilter}
        data-cy="status-bar"
      />
      <SortableList
        tableState={tableState}
        sortOptions={SORT_OPTIONS}
        groupOptions={GROUP_OPTIONS}
        groups={buildGroups(filteredItems, params.sort)}
        totalCount={filteredItems.length}
        renderItem={(item) => (
          <div className="px-4 py-2 text-sm">{item.name}</div>
        )}
        showGroupHeaders
        data-cy="list"
      />
    </div>
  );
}

const meta = {
  title: 'Design System/SortableList/StatusFilteredList',
  component: Demo,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Click "Error" in summary bar → filter=error, sort=Name unchanged
export const SummaryBarFiltersToError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickSummaryBarOption(canvas, 'error');
    expectFilterChecked(canvas, 'error');
    expectSortActive(canvas, 'Name');
  },
};

// Click "Error" again (active) → filter clears back to total
export const SummaryBarTogglesOff: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickSummaryBarOption(canvas, 'error');
    await clickSummaryBarOption(canvas, 'error');
    expectFilterChecked(canvas, 'total');
  },
};

// Summary bar active, click sort "Status" → status filter clears, sort=Status
export const SortStatusClearsSummaryBarFilter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickSummaryBarOption(canvas, 'error');
    await clickSortOption(canvas, 'Status', 'All');
    expectFilterChecked(canvas, 'total');
    expectSortActive(canvas, 'Status');
  },
};

// Summary bar active, click sort "Type" → status filter persists, sort=Type
export const SortTypePersistsSummaryBarFilter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickSummaryBarOption(canvas, 'error');
    await clickSortOption(canvas, 'Type', 'Stack');
    expectFilterChecked(canvas, 'error');
    expectSortActive(canvas, 'Type');
  },
};

// Switching to a non-grouped sort clears the group-set filter
export const SwitchToNameClearsGroupFilter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickSortOption(canvas, 'Status', 'Error');
    expectFilterChecked(canvas, 'error');
    await clickSortOption(canvas, 'Name');
    expectFilterChecked(canvas, 'total');
    expectSortActive(canvas, 'Name');
  },
};

// Click "Error" in Status group sort → sort=Status, summary bar shows "Error"
export const StatusGroupFilterSyncsSummaryBar: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickSortOption(canvas, 'Status', 'Error');
    expectFilterChecked(canvas, 'error');
    expectSortActive(canvas, 'Status');
  },
};

// Summary bar filter persists when switching to a different dimension
export const SummaryBarFilterPersistsAcrossDimensions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickSummaryBarOption(canvas, 'error');
    await clickSortOption(canvas, 'Type', 'Stack');
    expectFilterChecked(canvas, 'error');
    expectSortActive(canvas, 'Type');
  },
};

// Second group switch clears the old dimension, summary bar filter persists
export const SecondGroupSwitchClearsOldDimension: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickSummaryBarOption(canvas, 'error');
    await clickSortOption(canvas, 'Type', 'Stack');
    await clickSortOption(canvas, 'Platform', 'Linux');
    expectFilterChecked(canvas, 'error');
    expectSortActive(canvas, 'Platform');
  },
};

// Deselecting a group value keeps the sort, clears the filter
export const DeselectGroupValueClearsFilter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickSortOption(canvas, 'Status', 'Error');
    expectFilterChecked(canvas, 'error');
    await clickSortOption(canvas, 'Status', 'All');
    expectFilterChecked(canvas, 'total');
    expectSortActive(canvas, 'Status');
  },
};

// Summary bar overrides a group-set filter
export const SummaryBarOverridesGroupFilter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickSortOption(canvas, 'Status', 'Error');
    expectFilterChecked(canvas, 'error');
    await clickSummaryBarOption(canvas, 'healthy');
    expectFilterChecked(canvas, 'healthy');
  },
};

// Group value overrides a summary bar filter; summary bar updates
export const GroupFilterOverridesSummaryBar: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await clickSummaryBarOption(canvas, 'healthy');
    expectFilterChecked(canvas, 'healthy');
    await clickSortOption(canvas, 'Status', 'Outdated');
    expectFilterChecked(canvas, 'outdated');
  },
};

// Helpers shared across play functions
async function clickSummaryBarOption(
  canvas: ReturnType<typeof within>,
  label: string
) {
  await userEvent.click(
    canvas.getByRole('radio', { name: new RegExp(`filter by ${label}`, 'i') })
  );
}

async function clickSortOption(
  canvas: ReturnType<typeof within>,
  sortLabel: string,
  itemLabel?: string
) {
  await userEvent.click(
    canvas.getByRole('button', { name: new RegExp(`^${sortLabel}`, 'i') })
  );
  if (itemLabel) {
    await userEvent.click(
      canvas.getByRole('menuitem', { name: new RegExp(itemLabel, 'i') })
    );
  }
}

function expectFilterChecked(canvas: ReturnType<typeof within>, label: string) {
  expect(
    canvas.getByRole('radio', { name: new RegExp(`filter by ${label}`, 'i') })
  ).toBeChecked();
}

function expectSortActive(canvas: ReturnType<typeof within>, label: string) {
  expect(
    canvas.getByRole('button', { name: new RegExp(`^${label}`, 'i') })
  ).toHaveAttribute('aria-pressed', 'true');
}
