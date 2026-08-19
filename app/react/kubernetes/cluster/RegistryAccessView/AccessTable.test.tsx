import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { AccessTable } from './AccessTable';

// Mock lucide-react icons used by the component and Datatable
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    UserX: () => <span data-testid="user-x-icon" />,
    Search: () => <span data-testid="search-icon" />,
  };
});

// Mock DeleteButton to capture props
const mockDeleteButton = vi.fn();
vi.mock('@@/buttons/DeleteButton', () => ({
  DeleteButton: (props: {
    disabled: boolean;
    onConfirmed: () => void;
    'data-cy': string;
  }) => {
    const { disabled, onConfirmed, 'data-cy': dataCy } = props;
    mockDeleteButton(props);
    return (
      <button
        type="button"
        onClick={onConfirmed}
        disabled={disabled}
        data-cy={dataCy}
      >
        Remove
      </button>
    );
  },
}));

describe('AccessTable', () => {
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render namespace values in the table', () => {
    const dataset = [
      { value: 'namespace-1' },
      { value: 'namespace-2' },
      { value: 'namespace-3' },
    ];

    const Wrapped = withTestQueryProvider(AccessTable);

    render(<Wrapped dataset={dataset} onRemove={mockOnRemove} />);

    expect(screen.getByText('namespace-1')).toBeInTheDocument();
    expect(screen.getByText('namespace-2')).toBeInTheDocument();
    expect(screen.getByText('namespace-3')).toBeInTheDocument();
  });

  it('should render the column header', () => {
    const dataset = [{ value: 'namespace-1' }];

    const Wrapped = withTestQueryProvider(AccessTable);

    render(<Wrapped dataset={dataset} onRemove={mockOnRemove} />);

    expect(screen.getByText('Namespace')).toBeInTheDocument();
  });

  it('should render delete button with correct data-cy attribute', () => {
    const dataset = [{ value: 'namespace-1' }];

    const Wrapped = withTestQueryProvider(AccessTable);

    render(<Wrapped dataset={dataset} onRemove={mockOnRemove} />);

    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    expect(screen.getByTestId('remove-registry-access-button')).toHaveAttribute(
      'data-cy',
      'remove-registry-access-button'
    );
  });

  it('should allow multiple namespaces to be selected', async () => {
    const user = userEvent.setup();
    const dataset = [
      { value: 'namespace-1' },
      { value: 'namespace-2' },
      { value: 'namespace-3' },
    ];

    const Wrapped = withTestQueryProvider(AccessTable);

    render(<Wrapped dataset={dataset} onRemove={mockOnRemove} />);

    // Select multiple namespaces
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // namespace-1
    await user.click(checkboxes[2]); // namespace-2

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /remove/i });
    await user.click(deleteButton);

    // Verify onRemove was called with both selected items
    expect(mockOnRemove).toHaveBeenCalledWith([
      { value: 'namespace-1' },
      { value: 'namespace-2' },
    ]);
  });

  it('should use value field as unique row identifier', () => {
    // This test verifies the fix for the selection bug
    const dataset = [
      { value: 'namespace-1' },
      { value: 'namespace-2' },
      { value: 'namespace-3' },
    ];

    const Wrapped = withTestQueryProvider(AccessTable);

    const { container } = render(
      <Wrapped dataset={dataset} onRemove={mockOnRemove} />
    );

    // All three rows should render independently
    expect(screen.getByText('namespace-1')).toBeInTheDocument();
    expect(screen.getByText('namespace-2')).toBeInTheDocument();
    expect(screen.getByText('namespace-3')).toBeInTheDocument();

    // Should have 3 data rows + 1 header row
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  it('should only select the clicked item without selecting other items', async () => {
    // This test specifically verifies the bug fix where selecting one row would select all rows
    const user = userEvent.setup();
    const dataset = [
      { value: 'namespace-1' },
      { value: 'namespace-2' },
      { value: 'namespace-3' },
    ];

    const Wrapped = withTestQueryProvider(AccessTable);

    render(<Wrapped dataset={dataset} onRemove={mockOnRemove} />);

    // Get all checkboxes (first one is "select all", rest are individual rows)
    const checkboxes = screen.getAllByRole('checkbox');

    // Initially, no checkboxes should be checked
    expect(checkboxes[0]).not.toBeChecked(); // select all
    expect(checkboxes[1]).not.toBeChecked(); // namespace-1
    expect(checkboxes[2]).not.toBeChecked(); // namespace-2
    expect(checkboxes[3]).not.toBeChecked(); // namespace-3

    // Click only the second row (namespace-1)
    await user.click(checkboxes[1]);

    // Only the clicked checkbox should be checked
    expect(checkboxes[1]).toBeChecked(); // namespace-1 is checked
    expect(checkboxes[2]).not.toBeChecked(); // namespace-2 is NOT checked
    expect(checkboxes[3]).not.toBeChecked(); // namespace-3 is NOT checked

    // Click delete button and verify only the selected item is passed
    const deleteButton = screen.getByRole('button', { name: /remove/i });
    await user.click(deleteButton);

    // Verify onRemove was called with ONLY the selected item, not all items
    expect(mockOnRemove).toHaveBeenCalledTimes(1);
    expect(mockOnRemove).toHaveBeenCalledWith([{ value: 'namespace-1' }]);
    expect(mockOnRemove).not.toHaveBeenCalledWith(
      expect.arrayContaining([
        { value: 'namespace-2' },
        { value: 'namespace-3' },
      ])
    );
  });
});
