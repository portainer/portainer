import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  createColumnHelper,
  createTable,
  getCoreRowModel,
} from '@tanstack/react-table';

import { Datatable, defaultGlobalFilterFn, Props } from './Datatable';
import {
  BasicTableSettings,
  createPersistedStore,
  refreshableSettings,
  RefreshableTableSettings,
} from './types';
import { useTableState } from './useTableState';

// Mock data and dependencies
type MockData = { id: string; name: string; age: number };
const mockData = [
  { id: '1', name: 'John Doe', age: 30 },
  { id: '2', name: 'Jane Smith', age: 25 },
  { id: '3', name: 'Bob Johnson', age: 35 },
];

const mockColumns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age' },
];

// mock table settings / state
export interface TableSettings
  extends BasicTableSettings,
    RefreshableTableSettings {}
function createStore(storageKey: string) {
  return createPersistedStore<TableSettings>(storageKey, 'name', (set) => ({
    ...refreshableSettings(set),
  }));
}
const storageKey = 'test-table';
const settingsStore = createStore(storageKey);
const mockSettingsManager = {
  pageSize: 10,
  search: '',
  sortBy: undefined,
  setSearch: vitest.fn(),
  setSortBy: vitest.fn(),
  setPageSize: vitest.fn(),
};

function DatatableWithStore(props: Omit<Props<MockData>, 'settingsManager'>) {
  const tableState = useTableState(settingsStore, storageKey);
  return (
    <Datatable {...props} settingsManager={tableState} data-cy="test-table" />
  );
}

describe('Datatable', () => {
  it('renders the table with correct data', () => {
    render(
      <DatatableWithStore
        dataset={mockData}
        columns={mockColumns}
        data-cy="test-table"
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('renders the table with a title', () => {
    render(
      <DatatableWithStore
        dataset={mockData}
        columns={mockColumns}
        title="Test Table"
        data-cy="test-table"
      />
    );

    expect(screen.getByText('Test Table')).toBeInTheDocument();
  });

  it('handles row selection when not disabled', () => {
    render(
      <DatatableWithStore
        dataset={mockData}
        columns={mockColumns}
        data-cy="test-table"
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Select the first row

    // Check if the row is selected (you might need to adapt this based on your implementation)
    expect(checkboxes[1]).toBeChecked();
  });

  it('disables row selection when disableSelect is true', () => {
    render(
      <DatatableWithStore
        dataset={mockData}
        columns={mockColumns}
        disableSelect
        data-cy="test-table"
      />
    );

    const checkboxes = screen.queryAllByRole('checkbox');
    expect(checkboxes.length).toBe(0);
  });

  it('handles sorting', () => {
    render(
      <Datatable
        dataset={mockData}
        columns={mockColumns}
        settingsManager={mockSettingsManager}
        data-cy="test-table"
      />
    );

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    // Check if setSortBy was called with the correct arguments
    expect(mockSettingsManager.setSortBy).toHaveBeenCalledWith('name', true);
  });

  it('renders loading state', () => {
    render(
      <DatatableWithStore
        dataset={mockData}
        columns={mockColumns}
        isLoading
        data-cy="test-table"
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <DatatableWithStore
        dataset={[]}
        columns={mockColumns}
        emptyContentLabel="No data available"
        data-cy="test-table"
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('selects/deselects only page rows when select all is clicked', () => {
    render(
      <Datatable
        dataset={mockData}
        columns={mockColumns}
        settingsManager={{ ...mockSettingsManager, pageSize: 2 }}
        data-cy="test-table"
      />
    );

    const selectAllCheckbox = screen.getByLabelText('Select all rows');
    fireEvent.click(selectAllCheckbox);

    // Check if all rows on the page are selected
    expect(screen.getByText('2 item(s) selected')).toBeInTheDocument();

    // Deselect
    fireEvent.click(selectAllCheckbox);
    const checkboxes: HTMLInputElement[] = screen.queryAllByRole('checkbox');
    expect(checkboxes.filter((checkbox) => checkbox.checked).length).toBe(0);
  });

  it('selects/deselects all rows including other pages when select all is clicked with shift key', () => {
    render(
      <Datatable
        dataset={mockData}
        columns={mockColumns}
        settingsManager={{ ...mockSettingsManager, pageSize: 2 }}
        data-cy="test-table"
      />
    );

    const selectAllCheckbox = screen.getByLabelText('Select all rows');
    fireEvent.click(selectAllCheckbox, { shiftKey: true });

    // Check if all rows on the page are selected
    expect(screen.getByText('3 item(s) selected')).toBeInTheDocument();

    // Deselect
    fireEvent.click(selectAllCheckbox, { shiftKey: true });
    const checkboxes: HTMLInputElement[] = screen.queryAllByRole('checkbox');
    expect(checkboxes.filter((checkbox) => checkbox.checked).length).toBe(0);
  });
});

// Test the defaultGlobalFilterFn used in searches
type Person = {
  id: string;
  name: string;
  age: number;
  isEmployed: boolean;
  tags?: string[];
  city?: string;
  family?: { sister: string; uncles?: string[] };
};
const data: Person[] = [
  {
    // searching primitives should be supported
    id: '1',
    name: 'Alice',
    age: 30,
    isEmployed: true,
    // supporting arrays of primitives should be supported
    tags: ['music', 'likes-pixar'],
    // supporting objects of primitives should be supported (values only).
    // but shouldn't be support nested objects / arrays
    family: { sister: 'sophie', uncles: ['john', 'david'] },
  },
];
const columnHelper = createColumnHelper<Person>();
const columns = [
  columnHelper.accessor('name', {
    id: 'name',
  }),
  columnHelper.accessor('isEmployed', {
    id: 'isEmployed',
  }),
  columnHelper.accessor('age', {
    id: 'age',
  }),
  columnHelper.accessor('tags', {
    id: 'tags',
  }),
  columnHelper.accessor('family', {
    id: 'family',
  }),
];
const mockTable = createTable({
  columns,
  data,
  getCoreRowModel: getCoreRowModel(),
  state: {},
  onStateChange() {},
  renderFallbackValue: undefined,
  getRowId: (row) => row.id,
});
const mockRow = mockTable.getRow('1');

describe('defaultGlobalFilterFn', () => {
  it('should return true when filterValue is null', () => {
    const result = defaultGlobalFilterFn(mockRow, 'Name', null);
    expect(result).toBe(true);
  });

  it('should return true when filterValue.search is empty', () => {
    const result = defaultGlobalFilterFn(mockRow, 'Name', {
      search: '',
    });
    expect(result).toBe(true);
  });

  it('should filter string values correctly', () => {
    expect(
      defaultGlobalFilterFn(mockRow, 'name', {
        search: 'hello',
      })
    ).toBe(false);
    expect(
      defaultGlobalFilterFn(mockRow, 'name', {
        search: 'ALICE',
      })
    ).toBe(true);
    expect(
      defaultGlobalFilterFn(mockRow, 'name', {
        search: 'Alice',
      })
    ).toBe(true);
  });

  it('should filter number values correctly', () => {
    expect(defaultGlobalFilterFn(mockRow, 'age', { search: '123' })).toBe(
      false
    );
    expect(defaultGlobalFilterFn(mockRow, 'age', { search: '30' })).toBe(true);
    expect(defaultGlobalFilterFn(mockRow, 'age', { search: '67' })).toBe(false);
  });

  it('should filter boolean values correctly', () => {
    expect(
      defaultGlobalFilterFn(mockRow, 'isEmployed', { search: 'true' })
    ).toBe(true);
    expect(
      defaultGlobalFilterFn(mockRow, 'isEmployed', { search: 'false' })
    ).toBe(false);
  });

  it('should filter object values correctly', () => {
    expect(defaultGlobalFilterFn(mockRow, 'family', { search: 'sophie' })).toBe(
      true
    );
    expect(defaultGlobalFilterFn(mockRow, 'family', { search: '30' })).toBe(
      false
    );
  });

  it('should filter array values correctly', () => {
    expect(defaultGlobalFilterFn(mockRow, 'tags', { search: 'music' })).toBe(
      true
    );
    expect(
      defaultGlobalFilterFn(mockRow, 'tags', { search: 'Likes-Pixar' })
    ).toBe(true);
    expect(defaultGlobalFilterFn(mockRow, 'tags', { search: 'grape' })).toBe(
      false
    );
    expect(defaultGlobalFilterFn(mockRow, 'tags', { search: 'likes' })).toBe(
      true
    );
  });

  it('should handle complex nested structures', () => {
    expect(defaultGlobalFilterFn(mockRow, 'family', { search: 'sophie' })).toBe(
      true
    );
    expect(defaultGlobalFilterFn(mockRow, 'family', { search: 'mason' })).toBe(
      false
    );
  });

  it('should not filter non-primitive values within objects and arrays', () => {
    expect(defaultGlobalFilterFn(mockRow, 'family', { search: 'john' })).toBe(
      false
    );
    expect(defaultGlobalFilterFn(mockRow, 'family', { search: 'david' })).toBe(
      false
    );
  });
});
