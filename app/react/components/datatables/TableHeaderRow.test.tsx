import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  TableOptions,
} from '@tanstack/react-table';

import { TableHeaderRow } from './TableHeaderRow';
import { filterHOC } from './Filter';

type MockData = {
  id: string;
  name: string;
  age: number;
  status: string;
};

const columnHelper = createColumnHelper<MockData>();

describe('Basic rendering', () => {
  it('renders header row with all columns', () => {
    const columns = [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Name',
      }),
      columnHelper.accessor('age', {
        id: 'age',
        header: 'Age',
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: 'Status',
      }),
    ];

    renderTableHeaderRow(columns);

    expect(
      screen.getByRole('columnheader', { name: /Name/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Age/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Status/ })
    ).toBeInTheDocument();
  });

  it('renders empty header row when no headers provided', () => {
    const { container } = render(
      <table>
        <thead>
          <TableHeaderRow headers={[]} tableMeta={{}} />
        </thead>
      </table>
    );

    const row = container.querySelector('tr');
    expect(row).toBeInTheDocument();
    expect(row?.children.length).toBe(0);
  });
});

describe('Column metadata', () => {
  it('applies custom className from column meta', () => {
    const columns = [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Name',
        meta: {
          className: 'custom-header-class',
        },
      }),
    ];

    renderTableHeaderRow(columns);
    const headerCell = screen.getByRole('columnheader', { name: /Name/ });
    expect(headerCell).toHaveClass('custom-header-class');
  });

  it('applies custom width from column meta', () => {
    const columns = [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Name',
        meta: {
          width: '200px',
        },
      }),
    ];

    renderTableHeaderRow(columns);
    const headerCell = screen.getByRole('columnheader', { name: /Name/ });
    expect(headerCell).toHaveStyle({ width: '200px' });
  });

  it('handles missing column meta gracefully', () => {
    const columns = [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Name',
        // no meta provided
      }),
    ];

    renderTableHeaderRow(columns);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});

describe('Sorting functionality', () => {
  it('renders sortable columns with sort icons', () => {
    const columns = [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Name',
        enableSorting: true,
      }),
    ];

    renderTableHeaderRow(columns);
    const sortButton = screen.getByRole('button', { name: /Sort column/ });
    expect(sortButton).toBeInTheDocument();
  });

  it('calls onSortChange callback when provided', async () => {
    const user = userEvent.setup();
    const columns = [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Name',
        enableSorting: true,
      }),
    ];

    const onSortChange = vi.fn();

    renderTableHeaderRow(columns, onSortChange);
    const sortButton = screen.getByRole('button', { name: /Sort column/ });

    expect(sortButton).toBeInTheDocument();
    await user.click(sortButton!);

    // First click - sort descending
    await user.click(sortButton!);
    expect(onSortChange).toHaveBeenCalledWith('name', true);

    // Second click - sort ascending
    await user.click(sortButton!);
    expect(onSortChange).toHaveBeenCalledWith('name', false);
  });

  it('does not render sort button for non-sortable columns', () => {
    const columns = [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Name',
        enableSorting: false,
        enableColumnFilter: false,
      }),
    ];

    renderTableHeaderRow(columns);
    const sortButton = screen.queryByRole('button', { name: /Sort column/ });

    expect(sortButton).not.toBeInTheDocument();
  });
});

describe('Filtering functionality', () => {
  it('renders filter when column is filterable', () => {
    const columns = [
      columnHelper.accessor('status', {
        id: 'status',
        header: 'Status',
        enableColumnFilter: true,
        meta: {
          filter: filterHOC('Filter by status'),
        },
      }),
    ];

    renderTableHeaderRow(columns);
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

  it('does not render filter when column is not filterable', () => {
    const columns = [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Name',
        enableColumnFilter: false,
      }),
    ];

    renderTableHeaderRow(columns);
    expect(screen.queryByText('Filter')).not.toBeInTheDocument();
  });

  it('uses custom filter component from meta', () => {
    function CustomFilter() {
      return <div>Custom Filter Component</div>;
    }

    const columns = [
      columnHelper.accessor('status', {
        id: 'status',
        header: 'Status',
        enableColumnFilter: true,
        meta: {
          filter: CustomFilter,
        },
      }),
    ];

    renderTableHeaderRow(columns);
    expect(screen.getByText('Custom Filter Component')).toBeInTheDocument();
  });

  it('renders filter with options derived from data', async () => {
    const user = userEvent.setup();
    const columns = [
      columnHelper.accessor('status', {
        id: 'status',
        header: 'Status',
        enableColumnFilter: true,
        meta: {
          filter: filterHOC('Filter by status'),
        },
      }),
    ];

    renderTableHeaderRow(columns);

    // Open the filter menu
    const filterButton = screen.getByText('Filter');
    await user.click(filterButton);

    // Verify the filter options are derived from the actual data
    // mockData has 'active' and 'inactive' statuses
    expect(screen.getByLabelText('active')).toBeInTheDocument();
    expect(screen.getByLabelText('inactive')).toBeInTheDocument();
  });

  it('provides filter options from table meta via custom transformer', async () => {
    const user = userEvent.setup();

    const columns = [
      columnHelper.accessor('status', {
        id: 'status',
        header: 'Status',
        enableColumnFilter: true,
        meta: {
          filter: filterHOC('Filter by status', () => [
            'pending',
            'approved',
            'rejected',
          ]),
        },
      }),
    ];

    renderTableHeaderRow(columns);

    // Open the filter menu
    const filterButton = screen.getByText('Filter');
    await user.click(filterButton);

    // Verify the custom filter options from the transformer are rendered
    expect(screen.getByLabelText('pending')).toBeInTheDocument();
    expect(screen.getByLabelText('approved')).toBeInTheDocument();
    expect(screen.getByLabelText('rejected')).toBeInTheDocument();

    // Verify the default data-derived options are NOT present
    expect(screen.queryByLabelText('active')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('inactive')).not.toBeInTheDocument();
  });
});

describe('Edge cases', () => {
  it('handles columns with function headers', () => {
    const columns = [
      columnHelper.accessor('name', {
        id: 'name',
        header: () => <span>Dynamic Header</span>,
      }),
    ];

    renderTableHeaderRow(columns);
    expect(screen.getByText('Dynamic Header')).toBeInTheDocument();
  });

  it('handles columns with complex header content', () => {
    const columns = [
      columnHelper.accessor('name', {
        id: 'name',
        header: () => (
          <div>
            <span>Name</span>
            <span className="badge">Required</span>
          </div>
        ),
      }),
    ];

    renderTableHeaderRow(columns);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('handles rapid sort clicks without errors', async () => {
    const user = userEvent.setup();
    const columns = [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Name',
        enableSorting: true,
      }),
    ];

    renderTableHeaderRow(columns);
    const sortButton = screen.getByRole('button', { name: /Sort column/ });

    // Click multiple times rapidly
    await user.click(sortButton!);
    await user.click(sortButton!);
    await user.click(sortButton!);

    // Should not throw and component should still be rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});

const mockData: MockData[] = [
  { id: '1', name: 'John Doe', age: 30, status: 'active' },
  { id: '2', name: 'Jane Smith', age: 25, status: 'inactive' },
  { id: '3', name: 'Bob Johnson', age: 35, status: 'active' },
];

// Helper function to render TableHeaderRow with a table
function renderTableHeaderRow(
  columns: TableOptions<MockData>['columns'],
  onSortChange?: (colId: string, desc: boolean) => void
) {
  function TestComponent() {
    const table = useReactTable({
      data: mockData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
    });

    const headerGroup = table.getHeaderGroups()[0];

    return (
      <table>
        <thead>
          <TableHeaderRow
            headers={headerGroup.headers}
            onSortChange={onSortChange}
            tableMeta={undefined}
          />
        </thead>
      </table>
    );
  }

  return render(<TestComponent />);
}
