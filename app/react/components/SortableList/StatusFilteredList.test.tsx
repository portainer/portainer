// This story demonstrates how StatusSummaryBar and SortableList integrate:
// the summary bar filter and the group-sort dimension filter share state so
// that selecting a status from either control keeps both in sync.
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  useTableStateFromUrl,
  asEnum,
} from '@@/datatables/useTableStateFromUrl';
import { buildGroupSortExtras } from '@@/datatables/groupSortState';
import {
  StatusSummaryBar,
  StatusSegment,
} from '@@/StatusSummaryBar/StatusSummaryBar';

import { SortableList } from './SortableList';
import { SortableGroup } from './SortableListGroup';

describe('StatusFilteredList', () => {
  it('Click "Error" in summary bar → list shows only error items, sort unchanged, summary bar highlights "Error"', async () => {
    const user = userEvent.setup();
    renderList();
    expectDefaultValues();

    await selectSummaryBarOption(user, 'error');

    expectFilterChecked('error');
    expect(screen.getByRole('status')).toBeInTheDocument();

    expectSortActive('Name');
  });

  it('Click "Error" again (active) → filter clears, all items shown', async () => {
    const user = userEvent.setup();
    renderList();
    expectDefaultValues();

    await selectSummaryBarOption(user, 'error');
    await selectSummaryBarOption(user, 'error');

    expectFilterChecked('total');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('Summary bar active, click sort header "Status" → status filter clears', async () => {
    const user = userEvent.setup();
    renderList();

    await selectSummaryBarOption(user, 'error');
    await selectSortByFilter(user, 'Status', 'All');

    expectFilterChecked('total');
    expectSortActive('Status');
  });

  it('Summary bar active, click sort header "Type" → status persists', async () => {
    const user = userEvent.setup();
    renderList();

    await selectSummaryBarOption(user, 'error');
    await selectSortByFilter(user, 'Type', 'Stack');

    expectFilterChecked('error');
    expectSortActive('Type');
  });

  it('switching to a non-grouped sort clears a group-set filter', async () => {
    const user = userEvent.setup();
    renderList();

    await selectSortByFilter(user, 'Status', 'Error');
    expectFilterChecked('error');

    await selectSortByFilter(user, 'Name');

    expectFilterChecked('total');
    expectSortActive('Name');
  });

  it('Click "Error" in status group → sort=Status, filter=Error, summary bar also shows "Error"', async () => {
    const user = userEvent.setup();
    renderList();

    await selectSortByFilter(user, 'Status', 'Error');

    expectFilterChecked('error');
    expectSortActive('Status');
  });

  it('summary bar filter persists when switching to a different dimension', async () => {
    const user = userEvent.setup();
    renderList();

    await selectSummaryBarOption(user, 'error');
    await selectSortByFilter(user, 'Type', 'Stack');

    expectFilterChecked('error');
    expectSortActive('Type');
  });

  it('second group switch clears old dimension, summary bar filter persists', async () => {
    const user = userEvent.setup();
    renderList();

    await selectSummaryBarOption(user, 'error');
    await selectSortByFilter(user, 'Type', 'Stack');
    expectFilterChecked('error');

    await selectSortByFilter(user, 'Platform', 'Linux');

    expectFilterChecked('error');
    expectSortActive('Platform');
  });

  it('deselecting a group value keeps sort, clears filter', async () => {
    const user = userEvent.setup();
    renderList();

    await selectSortByFilter(user, 'Status', 'Error');
    expectFilterChecked('error');

    await selectSortByFilter(user, 'Status', 'All');

    expectFilterChecked('total');
    expectSortActive('Status');
  });

  it('summary bar overrides a group-set filter', async () => {
    const user = userEvent.setup();
    renderList();

    await selectSortByFilter(user, 'Status', 'Error');
    expectFilterChecked('error');

    await selectSummaryBarOption(user, 'healthy');

    expectFilterChecked('healthy');
  });

  it('group value overrides a summary bar filter; summary bar updates', async () => {
    const user = userEvent.setup();
    renderList();

    await selectSummaryBarOption(user, 'healthy');
    expectFilterChecked('healthy');

    await selectSortByFilter(user, 'Status', 'Outdated');

    expectFilterChecked('outdated');
  });

  it('summary bar filter is preserved when switching dimensions after overriding a group-set filter', async () => {
    const user = userEvent.setup();
    renderList();

    await selectSortByFilter(user, 'Status', 'Error');
    expectFilterChecked('error');

    await selectSummaryBarOption(user, 'healthy');
    expectFilterChecked('healthy');

    await selectSortByFilter(user, 'Type', 'Stack');

    expectFilterChecked('healthy');
    expectSortActive('Type');
  });
});

type Item = {
  id: number;
  name: string;
  status: string;
  type: string;
  platform: string;
};

const ITEMS: Item[] = [
  { id: 1, name: 'Alpha', status: 'error', type: 'stack', platform: 'linux' },
  {
    id: 2,
    name: 'Beta',
    status: 'healthy',
    type: 'stack',
    platform: 'linux',
  },
  {
    id: 3,
    name: 'Gamma',
    status: 'error',
    type: 'edge',
    platform: 'windows',
  },
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

const FILTER_SET = new Set(['error', 'healthy', 'outdated']);
const TYPE_SET = new Set(['stack', 'edge']);
const PLATFORM_SET = new Set(['linux', 'windows', 'mac']);
const SORT_KEYS = ['name', 'status', 'type', 'platform'] as const;
const DIMENSIONS = [{ key: 'status' }, { key: 'type' }, { key: 'platform' }];

function buildGroups(items: Item[], sortBy: string): SortableGroup<Item>[] {
  const options = GROUP_OPTIONS[sortBy];
  if (!options) {
    return items.length > 0 ? [{ key: 'all', label: 'All', items }] : [];
  }
  function getField(item: Item) {
    return item[sortBy as keyof Item] as string;
  }
  return options
    .map(({ key, label }) => ({
      key,
      label,
      items: items.filter((item) => getField(item) === key),
    }))
    .filter((g) => g.items.length > 0);
}

function TestList() {
  const tableState = useTableStateFromUrl({
    localStorageKey: 'test-status-filtered-list',
    defaultSort: 'name',
    parseExtra: (p) => ({
      status: asEnum(p.status, FILTER_SET),
      type: asEnum(p.type, TYPE_SET),
      platform: asEnum(p.platform, PLATFORM_SET),
    }),
    buildExtra: (urlState, setUrlState) => ({
      filterValue: urlState.status,
      setFilter: (v: string | null) =>
        setUrlState({
          status: v,
          page: 0,
          ...(urlState.sort === 'status' ? { sort: 'name' } : {}),
        }),
      ...buildGroupSortExtras({
        urlState,
        setUrlState,
        defaultSort: 'name',
        sortKeys: SORT_KEYS,
        dimensions: DIMENSIONS,
      }),
    }),
  });

  const sortBy = tableState.sortBy?.id ?? 'name';

  return (
    <>
      <StatusSummaryBar
        total={ITEMS.length}
        segments={SEGMENTS}
        value={tableState.filterValue}
        onChange={tableState.setFilter}
        data-cy="test-list-status-bar"
      />
      <SortableList
        tableState={tableState}
        sortOptions={SORT_OPTIONS}
        groupOptions={GROUP_OPTIONS}
        groups={buildGroups(ITEMS, sortBy)}
        totalCount={ITEMS.length}
        renderItem={(item) => <div>{item.name}</div>}
        showGroupHeaders
        data-cy="test-list-list"
      />
    </>
  );
}

function renderList() {
  return render(<TestList />);
}

async function selectSummaryBarOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string
) {
  await user.click(
    screen.getByRole('radio', { name: new RegExp(`filter by ${label}`, 'i') })
  );
}

async function selectSortByFilter(
  user: ReturnType<typeof userEvent.setup>,
  sortLabel: string,
  itemLabel?: string
) {
  await user.click(
    screen.getByRole('button', { name: new RegExp(`^${sortLabel}`, 'i') })
  );
  if (itemLabel) {
    await user.click(
      screen.getByRole('menuitem', { name: new RegExp(itemLabel, 'i') })
    );
  }
}

function expectFilterChecked(label: string) {
  expect(
    screen.getByRole('radio', { name: new RegExp(`filter by ${label}`, 'i') })
  ).toBeChecked();
}

function expectSortActive(label: string) {
  expect(
    screen.getByRole('button', { name: new RegExp(`^${label}`, 'i') })
  ).toHaveAttribute('aria-pressed', 'true');
}

function expectDefaultValues() {
  expectSortActive('Name');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
}

vi.mock('@reach/menu-button');

vi.mock('@/react/hooks/useParamState', () => ({
  useParamsState: <T extends Record<string, unknown>>(
    parseParams: (params: Record<string, string | undefined>) => T
  ) => {
    const [params, setParams] = useState<Record<string, string | undefined>>(
      {}
    );
    function setState(newState: Partial<T>) {
      setParams((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(newState)) {
          if (v === null || v === undefined) {
            delete next[k];
          } else {
            next[k] = String(v);
          }
        }
        return next;
      });
    }
    return [parseParams(params), setState] as const;
  },
}));
