import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

import { NestedDatatable } from './NestedDatatable';

type MockData = { id: string; name: string };

const mockData: MockData[] = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Bob Johnson' },
];

const mockColumns = [{ accessorKey: 'name', header: 'Name' }];

const initialTableState = { pagination: { pageIndex: 0, pageSize: 2 } };

function renderTable(dataset: MockData[]) {
  return (
    <NestedDatatable
      dataset={dataset}
      columns={mockColumns}
      initialTableState={initialTableState}
      data-cy="test-nested-table"
    />
  );
}

describe('NestedDatatable pagination', () => {
  it('stays on the current page when the dataset is refetched', async () => {
    const user = userEvent.setup();
    const { rerender } = render(renderTable(mockData));

    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();

    // a refetch hands the table a new array holding the same rows
    rerender(renderTable([...mockData]));

    // table-core queues its auto reset on a microtask, so give it a chance to
    // run before asserting that the page survived
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('falls back to the last available page when the dataset shrinks', async () => {
    const user = userEvent.setup();
    const { rerender } = render(renderTable(mockData));

    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();

    rerender(renderTable(mockData.slice(0, 2)));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
