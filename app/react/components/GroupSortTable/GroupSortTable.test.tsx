import {
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
  ReactNode,
} from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnDef, Row } from '@tanstack/react-table';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';

import { GroupEntry, GroupSortTable } from './GroupSortTable';
import {
  useTestingGroupSortTableStateWithoutStorage,
  GroupSortTableState,
} from './useGroupSortTableState';

type MenuCtxType = {
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement>;
};

vi.mock('@reach/menu-button', () => {
  const MenuCtx = createContext<MenuCtxType | null>(null);

  function Menu({ children }: { children?: ReactNode }) {
    const [isOpen, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      function handleDocDown(e: MouseEvent) {
        const target = e.target as Node | null;
        if (
          isOpen &&
          menuRef.current &&
          target &&
          !menuRef.current.contains(target)
        ) {
          setOpen(false);
        }
      }

      document.addEventListener('mousedown', handleDocDown);
      return () => document.removeEventListener('mousedown', handleDocDown);
    }, [isOpen]);

    return (
      <MenuCtx.Provider value={{ isOpen, setOpen, menuRef }}>
        <div ref={menuRef}>{children}</div>
      </MenuCtx.Provider>
    );
  }

  function MenuButton({
    children,
    onClick: externalOnClick,
    ...props
  }: {
    children?: ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) {
    const ctx = useContext(MenuCtx);

    function handleClick() {
      externalOnClick?.();
      ctx?.setOpen(!ctx.isOpen);
    }

    return (
      <button type="button" onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }

  function MenuList({
    children,
    className,
  }: {
    children?: ReactNode;
    className?: string;
  }) {
    const ctx = useContext(MenuCtx);
    if (!ctx?.isOpen) return null;
    return (
      <div role="menu" className={className}>
        {children}
      </div>
    );
  }

  function MenuItem({
    children,
    onSelect,
    className,
  }: {
    children?: ReactNode;
    onSelect?: () => void;
    className?: string;
  }) {
    const ctx = useContext(MenuCtx);

    function handleClick() {
      onSelect?.();
      ctx?.setOpen(false);
    }

    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
      <div role="menuitem" onClick={handleClick} className={className}>
        {children}
      </div>
    );
  }

  return { Menu, MenuButton, MenuList, MenuItem };
});

type Item = { id: string; name: string; group: string };

const columns: ColumnDef<Item>[] = [
  { id: 'Name', accessorKey: 'name' },
  { id: 'Group', accessorKey: 'group' },
];

const sortOptions = [
  { key: 'Group', label: 'Group', grouped: true },
  { key: 'Name', label: 'Name' },
];

function getGroupKey(item: Item): string {
  return item.group;
}

function renderRow(row: Row<Item>) {
  const item = row.original;
  return (
    <tr key={item.id}>
      <td>{item.name}</td>
      <td>{item.group}</td>
    </tr>
  );
}

/**
 * A controlled wrapper that owns all GroupSortTable state via tableState and
 * performs local filtering/pagination to simulate what the server would do.
 */
function ControlledTestWrapper({ allData }: { allData: Item[] }) {
  const tableState = useTestingGroupSortTableStateWithoutStorage('Group');

  const filteredData = allData.filter((item) => {
    const matchesSearch =
      !tableState.search ||
      item.name.toLowerCase().includes(tableState.search.toLowerCase()) ||
      item.group.toLowerCase().includes(tableState.search.toLowerCase());
    const matchesGroup =
      !tableState.groupBy || item.group === tableState.groupBy;
    return matchesSearch && matchesGroup;
  });

  const start = (tableState.page - 1) * tableState.pageSize;
  const pageData = filteredData.slice(start, start + tableState.pageSize);

  const groupCounts = allData.reduce<Record<string, number>>((acc, item) => {
    acc[item.group] = (acc[item.group] ?? 0) + 1;
    return acc;
  }, {});
  const availableGroupsBySort: Record<string, GroupEntry[]> = {
    Group: Object.entries(groupCounts).map(([key, count]) => ({ key, count })),
    Name: [],
  };

  return (
    <GroupSortTable
      data={pageData}
      isLoading={false}
      columns={columns}
      renderRow={renderRow}
      getRowId={(item) => item.id}
      tableState={tableState}
      sortOptions={sortOptions}
      getGroupKey={getGroupKey}
      totalCount={filteredData.length}
      availableGroupsBySort={availableGroupsBySort}
      emptyContentLabel="No items found"
      data-cy="test-table"
    />
  );
}

function makeData(items: Partial<Item>[] = []): Item[] {
  return items.map((item, i) => ({
    id: String(i),
    name: `Item ${i}`,
    group: 'GroupA',
    ...item,
  }));
}

function renderComponent(data: Item[] = []) {
  const Wrapped = withTestQueryProvider(
    withTestRouter(() => <ControlledTestWrapper allData={data} />)
  );
  return render(<Wrapped />);
}

function makeTableState(
  overrides: Partial<GroupSortTableState> = {}
): GroupSortTableState {
  return {
    search: '',
    setSearch: () => {},
    pageSize: 10,
    setPageSize: () => {},
    page: 1,
    setPage: () => {},
    groupBy: null,
    setGroupBy: () => {},
    sortBy: { id: 'Group', desc: false },
    setSortBy: () => {},
    ...overrides,
  };
}

describe('GroupSortTable', () => {
  test('shows loading state when isLoading is true', () => {
    function LoadingWrapper() {
      return (
        <GroupSortTable
          data={[]}
          isLoading
          columns={columns}
          renderRow={renderRow}
          getRowId={(item: object) => (item as Item).id}
          tableState={makeTableState()}
          sortOptions={sortOptions}
          totalCount={0}
          availableGroupsBySort={{}}
          loadingLabel="Loading items..."
          data-cy="test-table"
        />
      );
    }

    const Wrapped = withTestQueryProvider(
      withTestRouter(() => <LoadingWrapper />)
    );
    render(<Wrapped />);
    expect(screen.getByText('Loading items...')).toBeVisible();
  });

  test('shows empty label when data is empty', async () => {
    renderComponent([]);
    expect(await screen.findByText('No items found')).toBeVisible();
  });

  test('renders all items from data', async () => {
    const data = makeData([
      { name: 'Alpha', group: 'GroupA' },
      { name: 'Beta', group: 'GroupB' },
    ]);
    renderComponent(data);

    expect(await screen.findByText('Alpha')).toBeVisible();
    expect(screen.getByText('Beta')).toBeVisible();
  });

  test('filtering by group in the dropdown only shows items from that group', async () => {
    const user = userEvent.setup();
    const data = makeData([
      { name: 'Alpha', group: 'GroupA' },
      { name: 'Beta', group: 'GroupB' },
      { name: 'Gamma', group: 'GroupA' },
    ]);

    renderComponent(data);

    expect(await screen.findByText('Alpha')).toBeVisible();

    const groupBtn = screen.getByRole('button', { name: /Group/i });
    await user.click(groupBtn);

    const groupAOption = screen.getByRole('menuitem', { name: /GroupA/ });
    await user.click(groupAOption);

    expect(screen.getByText('Alpha')).toBeVisible();
    expect(screen.getByText('Gamma')).toBeVisible();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });

  test('selecting All in the dropdown clears the group filter', async () => {
    const user = userEvent.setup();
    const data = makeData([
      { name: 'Alpha', group: 'GroupA' },
      { name: 'Beta', group: 'GroupB' },
    ]);

    renderComponent(data);
    expect(await screen.findByText('Alpha')).toBeVisible();

    await user.click(screen.getByRole('button', { name: /Group/i }));
    await user.click(screen.getByRole('menuitem', { name: /GroupA/ }));
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Group/i }));
    await user.click(screen.getByRole('menuitem', { name: /^All$/ }));
    expect(await screen.findByText('Beta')).toBeVisible();
  });

  test('renders group headers above the first item in each group', async () => {
    function GroupHeaderWrapper() {
      const data: Item[] = [
        { id: '0', name: 'Alpha', group: 'GroupA' },
        { id: '1', name: 'Beta', group: 'GroupB' },
        { id: '2', name: 'Gamma', group: 'GroupA' },
      ];
      const groupCounts = { GroupA: 2, GroupB: 1 };
      const availableGroupsBySort: Record<string, GroupEntry[]> = {
        Group: Object.entries(groupCounts).map(([key, count]) => ({
          key,
          count,
        })),
        Name: [],
      };
      return (
        <GroupSortTable
          data={data}
          isLoading={false}
          columns={columns}
          renderRow={renderRow}
          getRowId={(item) => item.id}
          tableState={makeTableState()}
          sortOptions={sortOptions}
          getGroupKey={(item) => item.group}
          renderGroupHeader={(groupKey, count) => (
            <span data-cy={`header-${groupKey}`}>
              {groupKey} ({count})
            </span>
          )}
          totalCount={data.length}
          availableGroupsBySort={availableGroupsBySort}
        />
      );
    }

    const Wrapped = withTestQueryProvider(
      withTestRouter(() => <GroupHeaderWrapper />)
    );
    render(<Wrapped />);

    expect(await screen.findByTestId('header-GroupA')).toBeVisible();
    expect(screen.getByTestId('header-GroupB')).toBeVisible();
    expect(screen.getAllByTestId(/^header-/)).toHaveLength(2);
    expect(screen.getByTestId('header-GroupA')).toHaveTextContent('GroupA (2)');
    expect(screen.getByTestId('header-GroupB')).toHaveTextContent('GroupB (1)');
  });

  test('pinned items appear after non-pinned items regardless of data order', async () => {
    type PinnableItem = Item & { pinned: boolean };

    function PinWrapper() {
      const data: PinnableItem[] = [
        { id: '0', name: 'PinnedFirst', group: 'G', pinned: true },
        { id: '1', name: 'NormalSecond', group: 'G', pinned: false },
      ];
      return (
        <GroupSortTable
          data={data}
          isLoading={false}
          columns={columns}
          renderRow={renderRow}
          getRowId={(item: object) => (item as Item).id}
          tableState={makeTableState()}
          sortOptions={sortOptions}
          pinToBottom={(item: object) => (item as PinnableItem).pinned}
          totalCount={data.length}
          availableGroupsBySort={{}}
        />
      );
    }

    const Wrapped = withTestQueryProvider(withTestRouter(() => <PinWrapper />));
    const { container } = render(<Wrapped />);

    await screen.findByText('NormalSecond');

    const bodyText = container.textContent ?? '';
    expect(bodyText.indexOf('NormalSecond')).toBeLessThan(
      bodyText.indexOf('PinnedFirst')
    );
  });

  test('changing sort key clears the active group filter', async () => {
    const user = userEvent.setup();
    const data = makeData([
      { name: 'Alpha', group: 'GroupA' },
      { name: 'Beta', group: 'GroupB' },
    ]);

    renderComponent(data);
    expect(await screen.findByText('Alpha')).toBeVisible();

    // Filter to GroupA
    await user.click(screen.getByRole('button', { name: /Group/i }));
    await user.click(screen.getByRole('menuitem', { name: /GroupA/ }));
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();

    // Switch sort key — should clear the group filter and show all items
    await user.click(screen.getByRole('button', { name: /^Name$/i }));
    expect(await screen.findByText('Beta')).toBeVisible();
  });

  test('typing in search clears the active group filter', async () => {
    const user = userEvent.setup();
    const data = makeData([
      { name: 'Alpha', group: 'GroupA' },
      { name: 'Beta', group: 'GroupB' },
    ]);

    renderComponent(data);
    expect(await screen.findByText('Alpha')).toBeVisible();

    // Filter to GroupA
    await user.click(screen.getByRole('button', { name: /Group/i }));
    await user.click(screen.getByRole('menuitem', { name: /GroupA/ }));
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();

    // Type a search term — should clear the group filter
    await user.type(screen.getByPlaceholderText('Filter...'), 'Beta');
    await waitFor(() => {
      expect(screen.getByText('Beta')).toBeVisible();
    });
  });

  test('search filters rows to only matching items', async () => {
    const user = userEvent.setup();
    const data = makeData([
      { name: 'Alpha', group: 'GroupA' },
      { name: 'Beta', group: 'GroupB' },
    ]);
    renderComponent(data);

    await screen.findByText('Alpha');

    await user.type(screen.getByPlaceholderText('Filter...'), 'Alpha');

    await waitFor(() => {
      expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Alpha')).toBeVisible();
  });

  test('emptyContentLabel object: shows withoutSearch when no search term', async () => {
    function LabelWrapper() {
      return (
        <GroupSortTable
          data={[]}
          isLoading={false}
          columns={columns}
          renderRow={renderRow}
          getRowId={(item: object) => (item as Item).id}
          tableState={makeTableState({ search: '' })}
          sortOptions={sortOptions}
          totalCount={0}
          availableGroupsBySort={{}}
          emptyContentLabel={{
            withSearch: 'No results match',
            withoutSearch: 'Nothing here yet',
          }}
        />
      );
    }

    const Wrapped = withTestQueryProvider(
      withTestRouter(() => <LabelWrapper />)
    );
    render(<Wrapped />);
    expect(await screen.findByText('Nothing here yet')).toBeVisible();
  });

  test('emptyContentLabel object: shows withSearch when search term is set', async () => {
    function LabelWrapper() {
      return (
        <GroupSortTable
          data={[]}
          isLoading={false}
          columns={columns}
          renderRow={renderRow}
          getRowId={(item: object) => (item as Item).id}
          tableState={makeTableState({ search: 'xyz' })}
          sortOptions={sortOptions}
          totalCount={0}
          availableGroupsBySort={{}}
          emptyContentLabel={{
            withSearch: 'No results match',
            withoutSearch: 'Nothing here yet',
          }}
        />
      );
    }

    const Wrapped = withTestQueryProvider(
      withTestRouter(() => <LabelWrapper />)
    );
    render(<Wrapped />);
    expect(await screen.findByText('No results match')).toBeVisible();
  });

  test('changing items per page resets to first page and shows more rows', async () => {
    const user = userEvent.setup();
    const data = makeData(
      Array.from({ length: 11 }, (_, i) => ({ name: `Item ${i}`, group: 'G' }))
    );

    renderComponent(data);

    expect(await screen.findByText('Item 0')).toBeVisible();
    expect(screen.queryByText('Item 10')).not.toBeInTheDocument();

    const pagination = screen.getByTestId('table-pagination');
    await user.click(within(pagination).getByRole('button', { name: '›' }));
    expect(await screen.findByText('Item 10')).toBeVisible();

    await user.selectOptions(
      within(pagination).getByTestId('paginationSelect'),
      '25'
    );

    expect(await screen.findByText('Item 0')).toBeVisible();
    expect(screen.getByText('Item 10')).toBeVisible();
  });

  test('container has overflow-clip class', async () => {
    const data = makeData([{ name: 'Alpha', group: 'GroupA' }]);
    const { container } = renderComponent(data);
    await screen.findByText('Alpha');
    const wrapper = container.querySelector(
      '[data-cy="test-table"]'
    ) as HTMLElement;
    expect(wrapper).toHaveClass('overflow-clip');
  });

  test('pagination next/prev navigation works', async () => {
    const user = userEvent.setup();
    const data = makeData(
      Array.from({ length: 11 }, (_, i) => ({ name: `Item ${i}`, group: 'G' }))
    );

    renderComponent(data);

    expect(await screen.findByText('Item 0')).toBeVisible();

    const pagination = screen.getByTestId('table-pagination');
    await user.click(within(pagination).getByRole('button', { name: '›' }));

    expect(await screen.findByText('Item 10')).toBeVisible();
    expect(screen.queryByText('Item 0')).not.toBeInTheDocument();
  });

  test('renders all headerButtons when provided', async () => {
    const buttons = [
      <button type="button" key="a">
        Action A
      </button>,
      <button type="button" key="b">
        Action B
      </button>,
    ];

    function Wrapper() {
      return (
        <GroupSortTable
          data={[]}
          isLoading={false}
          columns={columns}
          renderRow={renderRow}
          getRowId={(item: object) => (item as Item).id}
          tableState={makeTableState()}
          sortOptions={sortOptions}
          totalCount={0}
          availableGroupsBySort={{}}
          headerButtons={buttons}
        />
      );
    }

    const Wrapped = withTestQueryProvider(withTestRouter(() => <Wrapper />));
    render(<Wrapped />);

    expect(
      await screen.findByRole('button', { name: 'Action A' })
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Action B' })).toBeVisible();
  });

  test('renders no extra buttons when headerButtons is omitted', async () => {
    function Wrapper() {
      return (
        <GroupSortTable
          data={[]}
          isLoading={false}
          columns={columns}
          renderRow={renderRow}
          getRowId={(item: object) => (item as Item).id}
          tableState={makeTableState()}
          sortOptions={sortOptions}
          totalCount={0}
          availableGroupsBySort={{}}
        />
      );
    }

    const Wrapped = withTestQueryProvider(withTestRouter(() => <Wrapper />));
    render(<Wrapped />);

    await screen.findByText('SORT BY:');
    expect(
      screen.queryByRole('button', { name: 'Action A' })
    ).not.toBeInTheDocument();
  });

  test('renders only the truthy buttons passed via headerButtons', async () => {
    const flag = false;
    const buttons = [
      flag && (
        <button type="button" key="hidden">
          Hidden
        </button>
      ),
      <button type="button" key="visible">
        Visible
      </button>,
    ].filter((btn): btn is React.JSX.Element => Boolean(btn));

    function Wrapper() {
      return (
        <GroupSortTable
          data={[]}
          isLoading={false}
          columns={columns}
          renderRow={renderRow}
          getRowId={(item: object) => (item as Item).id}
          tableState={makeTableState()}
          sortOptions={sortOptions}
          totalCount={0}
          availableGroupsBySort={{}}
          headerButtons={buttons}
        />
      );
    }

    const Wrapped = withTestQueryProvider(withTestRouter(() => <Wrapper />));
    render(<Wrapped />);

    expect(
      await screen.findByRole('button', { name: 'Visible' })
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Hidden' })
    ).not.toBeInTheDocument();
  });
});
